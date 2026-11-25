/*
  Прослойка для локальной программы (weblate_local.py): подменяет то, что окну давало расширение Chrome.
  Один файл на три места:
    страница      — рисует окно (weblate-export.js);
    кадр «bg»     — фоновая часть расширения (background.js): Smartcat, расписание, уведомления;
    кадр «off»    — звук уведомлений (offscreen.js).
  Хранилище настроек — файл на компьютере (через /__store), запросы к Smartcat — через /__sc.
*/
(function () {
  'use strict';
  var ROLE = window.__ROLE || 'page';

  /* ---------- кадры: берут готовый chrome у страницы ---------- */
  if (ROLE !== 'page') {
    window.chrome = parent.__wlxChrome(ROLE, window);
    if (ROLE === 'bg') {
      /* запросы к Smartcat из браузера не проходят — отправляем через программу */
      var realFetch = window.fetch.bind(window);
      window.fetch = function (url, init) {
        var u = String(url && url.url ? url.url : url);
        if (/^https:\/\//i.test(u) && parent.__wlxIsSmartcat(u)) return realFetch('/__sc?u=' + encodeURIComponent(u), init);
        return realFetch(url, init);
      };
    }
    return;
  }

  /* ---------- страница ---------- */
  function xhr(method, url, body) {
    var x = new XMLHttpRequest();
    x.open(method, url, false);
    if (body) x.setRequestHeader('Content-Type', 'application/json');
    x.send(body || null);
    return x;
  }
  function $(id) { return document.getElementById(id); }
  var clone = function (v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); };

  var app = JSON.parse(xhr('GET', '/__app').responseText);

  function setup(note) {
    $('setup').hidden = false;
    $('wl').value = app.weblate || '';
    $('msg').textContent = note || '';
    $('go').onclick = function () {
      var tok = $('tok').value.trim();
      if (!tok) { $('msg').textContent = 'Вставь токен'; return; }
      $('msg').textContent = 'Проверяю…';
      fetch('/__app?check=1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: tok, weblate: $('wl').value.trim() }) })
        .then(function (r) { return r.json(); })
        .then(function (r) {
          if (r.ok !== true) { $('msg').textContent = '✗ ' + (r.error === 'неверный токен' ? 'Weblate не принял токен — проверь, что скопировала его целиком' : (r.error || 'не получилось')); return; }
          location.reload();
        }, function (e) { $('msg').textContent = '✗ ' + e.message; });
    };
  }
  if (!app.hasToken) { setup(''); return; }

  var store = (JSON.parse(xhr('GET', '/__store').responseText).ext) || {};
  var manifest = JSON.parse(xhr('GET', '/ext/manifest.json').responseText);
  window.__WLX_ORIGIN = app.weblate;

  /* ----- хранилище ----- */
  var changeL = [], saveT = null;
  function flush() {
    saveT = null;
    fetch('/__store', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: store }), keepalive: true }).catch(function () {});
  }
  function persist() { if (!saveT) saveT = setTimeout(flush, 120); }
  window.addEventListener('pagehide', function () { if (saveT) { clearTimeout(saveT); flush(); } });
  function done(cb, v) { if (typeof cb === 'function') { cb(v); return undefined; } return Promise.resolve(v); }
  var storage = {
    local: {
      get: function (keys, cb) {
        var out = {};
        if (typeof keys === 'function') { cb = keys; keys = null; }
        if (keys == null) out = clone(store);
        else if (typeof keys === 'string') { if (keys in store) out[keys] = clone(store[keys]); }
        else if (Array.isArray(keys)) keys.forEach(function (k) { if (k in store) out[k] = clone(store[k]); });
        else Object.keys(keys).forEach(function (k) { out[k] = k in store ? clone(store[k]) : keys[k]; });
        return done(cb, out);
      },
      set: function (obj, cb) {
        var ch = {};
        Object.keys(obj).forEach(function (k) { ch[k] = { oldValue: store[k], newValue: clone(obj[k]) }; store[k] = clone(obj[k]); });
        persist();
        changeL.slice().forEach(function (f) { try { f(ch, 'local'); } catch (e) { console.error(e); } });
        return done(cb);
      },
      remove: function (keys, cb) {
        var ch = {};
        (Array.isArray(keys) ? keys : [keys]).forEach(function (k) { if (k in store) { ch[k] = { oldValue: store[k] }; delete store[k]; } });
        persist();
        changeL.slice().forEach(function (f) { try { f(ch, 'local'); } catch (e) { console.error(e); } });
        return done(cb);
      }
    },
    onChanged: { addListener: function (f) { changeL.push(f); } }
  };

  /* ----- сообщения между страницей и кадрами ----- */
  var L = { page: [], bg: [], off: [] };
  var ROUTE = { page: 'bg', bg: 'off', off: 'bg' };
  function dispatch(list, msg) {
    return new Promise(function (resolve) {
      var answered = false, later = false;
      function reply(r) { if (!answered) { answered = true; resolve(r); } }
      list.slice().forEach(function (f) {
        try { if (f(clone(msg), { id: 'local' }, reply) === true) later = true; } catch (e) { console.error(e); }
      });
      if (!later && !answered) resolve(undefined);
    });
  }

  /* ----- расписание и уведомления ----- */
  var alarms = {}, alarmL = [], noteClickL = [], startL = [];
  var noop = function () {};
  var listener = function (arr) { return { addListener: function (f) { arr.push(f); }, removeListener: function (f) { var i = arr.indexOf(f); if (i >= 0) arr.splice(i, 1); } }; };
  function notify(id, o) {
    o = o || {};
    try {
      if (window.Notification && Notification.permission === 'granted') {
        var n = new Notification(o.title || 'Weblate ⇄ Smartcat', { body: o.message || '', tag: id, icon: '/ext/icons/icon128.png' });
        n.onclick = function () { window.focus(); noteClickL.slice().forEach(function (f) { try { f(id); } catch (e) { console.error(e); } }); n.close(); };
      }
    } catch (e) { /* уведомления запрещены — ничего страшного, статус виден в окне */ }
    document.title = '● ' + (o.title || 'Перевод готов');
    setTimeout(function () { document.title = 'Weblate ⇄ Smartcat'; }, 15000);
  }
  /* разрешение на уведомления браузер даёт только по клику */
  document.addEventListener('click', function ask() {
    document.removeEventListener('click', ask);
    try { if (window.Notification && Notification.permission === 'default') Notification.requestPermission(); } catch (e) {}
  });

  var FAKE_TAB = { id: 1, windowId: 1, url: app.weblate + '/' };
  function runInPage(o) {
    if (o && o.func) { try { new Function('return (' + o.func.toString() + ').apply(null, arguments)').apply(null, o.args || []); } catch (e) { console.error(e); } }
    else if (window.__wlExport) window.__wlExport.show();
    return Promise.resolve([]);
  }

  window.__wlxIsSmartcat = function (u) {
    try {
      var h = new URL(u).hostname.toLowerCase();
      if (h === 'smartcat.com' || /\.smartcat\.com$/.test(h)) return true;
      var c = store.sc && store.sc.customUrl;
      return !!c && h === new URL(c).hostname.toLowerCase();
    } catch (e) { return false; }
  };

  window.__wlxChrome = function (role, win) {
    return {
      runtime: {
        id: 'weblate-local',
        lastError: null,
        getManifest: function () { return manifest; },
        getURL: function (p) { return '/ext/' + String(p).replace(/^\/+/, ''); },
        onMessage: listener(L[role]),
        onInstalled: listener(startL),
        onStartup: listener(startL),
        sendMessage: function (msg, cb) {
          var p = dispatch(L[ROUTE[role]], msg);
          if (typeof cb === 'function') { p.then(cb); return undefined; }
          return p;
        }
      },
      storage: storage,
      action: { onClicked: listener([]) },
      alarms: {
        create: function (name, o) {
          if (alarms[name]) clearInterval(alarms[name]);
          alarms[name] = setInterval(function () { alarmL.slice().forEach(function (f) { try { f({ name: name }); } catch (e) { console.error(e); } }); }, Math.max(0.5, (o && o.periodInMinutes) || 1) * 60000);
        },
        get: function (name, cb) { return done(cb, alarms[name] ? { name: name } : undefined); },
        onAlarm: listener(alarmL)
      },
      notifications: {
        create: function (id, o, cb) { if (typeof id === 'object') { cb = o; o = id; id = 'n' + Date.now(); } notify(id, o); return done(cb, id); },
        clear: function (id, cb) { return done(cb, true); },
        onClicked: listener(noteClickL),
        onButtonClicked: listener([])
      },
      offscreen: { hasDocument: function () { return Promise.resolve(true); }, createDocument: function () { return Promise.resolve(); } },
      tabs: {
        create: function (o, cb) { return done(cb, FAKE_TAB); },
        query: function (o, cb) { return done(cb, [FAKE_TAB]); },
        update: function (id, o, cb) { return done(cb, FAKE_TAB); },
        remove: function (id, cb) { return done(cb); },
        onUpdated: { addListener: function (f) { setTimeout(function () { try { f(FAKE_TAB.id, { status: 'complete' }); } catch (e) {} }, 0); }, removeListener: noop }
      },
      windows: { update: function (id, o, cb) { try { window.focus(); } catch (e) {} return done(cb); } },
      scripting: { executeScript: runInPage }
    };
  };

  window.chrome = window.__wlxChrome('page', window);

  /* ----- запуск: сначала фоновая часть, потом окно ----- */
  var ready = {};
  window.__wlxFrameReady = function (role) {
    ready[role] = 1;
    if (role !== 'bg') return;
    startL.slice().forEach(function (f) { try { f({ reason: 'startup' }); } catch (e) { console.error(e); } });
    var s = document.createElement('script');
    s.src = '/ext/weblate-export.js';
    document.body.appendChild(s);
  };
  ['off', 'bg'].forEach(function (role) {
    var f = document.createElement('iframe');
    f.hidden = true; f.src = '/__' + role + '.html'; f.title = role;
    document.body.appendChild(f);
  });

  /* ----- строка внизу: куда подключены и как сменить токен ----- */
  var bar = $('bar');
  bar.textContent = 'Weblate: ' + app.weblate.replace(/^https:\/\//, '') + ' · версия ' + manifest.version + ' · ';
  var a = document.createElement('a');
  a.href = '#'; a.textContent = 'сменить токен';
  a.onclick = function (e) { e.preventDefault(); setup(''); window.scrollTo(0, 0); };
  bar.appendChild(a);
  var b = document.createElement('a');
  b.href = '#'; b.textContent = 'открыть окно'; b.style.marginLeft = '10px';
  b.onclick = function (e) { e.preventDefault(); if (window.__wlExport) window.__wlExport.show(); };
  bar.appendChild(b);
})();
