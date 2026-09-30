/*
  Кнопка-закладка «Выгрузка из Weblate».
  Запускается на странице weblate.wb.ru и работает через текущий вход в Weblate
  (без токена и без установки программ). Это исходник; закладку из него
  собирает build.py в index.html.
  Не использовать однострочные комментарии: код живёт в URL закладки.
*/
(function () {
  if (window.__wlExport) { window.__wlExport.show(); return; }

  var QUERY_ALL = 'state:<translated';
  var QUERY_EMPTY = 'state:empty';

  /* ---------- языки: русские названия и флаги ---------- */
  var FLAGS = {} /*FLAGS*/;
  var RU_NAMES = { ky: 'Киргизский', az_N11: 'Азербайджанский (N11)', zh_Hans: 'Китайский (упрощённый)', zh_Hant: 'Китайский (традиционный)', en_US: 'Английский (США)', en_GB: 'Английский (Великобритания)' };
  var WL_NAMES = {};
  var displayNames = null;
  try { displayNames = new Intl.DisplayNames(['ru'], { type: 'language' }); } catch (e) {}
  function langName(code) {
    if (RU_NAMES[code]) return RU_NAMES[code];
    var wl = WL_NAMES[code] || code;
    if (/generated/i.test(wl)) return wl;
    try {
      var n = displayNames && displayNames.of(code.replace(/_/g, '-'));
      if (n && n.toLowerCase() !== code.toLowerCase().replace(/_/g, '-')) return n[0].toUpperCase() + n.slice(1);
    } catch (e) {}
    return wl;
  }
  var flagSeq = 0;
  function flag(code) {
    var svg = FLAGS[code] || FLAGS[code.toLowerCase().split(/[_\-@]/)[0]];
    var box = document.createElement('span');
    box.className = 'flag';
    if (svg) {
      try {
        /* у каждого флага свои id: иначе флаг на видимой вкладке ссылается на градиент во флаге на скрытой и не рисуется */
        var uid = '-f' + (++flagSeq);
        svg = svg.replace(/(\bid="|url\(#|href="#)([^")]+)/g, function (m0, a, b) { return a + b + uid; });
        var doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
        box.appendChild(document.importNode(doc.documentElement, true));
      } catch (e) {}
    }
    return box;
  }
  function langLabel(code) {
    var s = document.createElement('span');
    s.className = 'lang';
    s.appendChild(flag(code));
    s.appendChild(document.createTextNode(langName(code)));
    return s;
  }

  /* ---------- storage ---------- */
  function sget(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function sset(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  /* ---------- HTTP ---------- */
  function http(url, asText) {
    return fetch(url, { credentials: 'same-origin', headers: { 'Accept': asText ? '*/*' : 'application/json' } })
      .then(function (r) {
        if (!r.ok) {
          return r.text().then(function (t) {
            var err = new Error('HTTP ' + r.status + ' ' + url + (t ? ': ' + t.slice(0, 200) : ''));
            err.status = r.status;
            throw err;
          });
        }
        return asText ? r.text() : r.json();
      });
  }
  function paginate(url) {
    var out = [];
    function step(u) {
      return http(u).then(function (d) {
        out = out.concat(d.results || []);
        if (d.next) {
          var n = new URL(d.next, location.origin);
          return step(n.pathname + n.search);
        }
        return out;
      });
    }
    return step(url);
  }
  /* ---------- компоненты, в т.ч. внутри категорий: c = «категория/компонент» ---------- */
  var COMP_API = {}, TR_API = {}, PROJECT_COMPS = {};
  function pathOf(u) {
    try { var x = new URL(u, location.origin).pathname; return x.slice(-1) === '/' ? x : x + '/'; } catch (e) { return null; }
  }
  function compApi(p, c) { return COMP_API[p + '/' + c] || '/api/components/' + p + '/' + c.split('/').join('%252F') + '/'; }
  function trApi(p, c, lang) { return TR_API[p + '/' + c + '/' + lang] || '/api/translations/' + p + '/' + c.split('/').join('%252F') + '/' + lang + '/'; }
  function fileKey(c) { return c.split('/').join('__'); }
  function projectComponents(p) {
    if (!PROJECT_COMPS[p]) {
      PROJECT_COMPS[p] = paginate('/api/projects/' + p + '/components/?page_size=1000').then(function (list) {
        return list.map(function (x) {
          var web = x.web_url ? pathOf(x.web_url) : null, pre = '/projects/' + p + '/';
          var c = web && web.indexOf(pre) === 0 ? decodeURIComponent(web.slice(pre.length, -1)) : x.slug;
          if (x.url) COMP_API[p + '/' + c] = pathOf(x.url);
          return { p: p, c: c, glossary: !!x.is_glossary };
        });
      });
      PROJECT_COMPS[p].catch(function () { delete PROJECT_COMPS[p]; });
    }
    return PROJECT_COMPS[p];
  }
  function translations(p, c) {
    return paginate(compApi(p, c) + 'translations/').then(function (trs) {
      trs.forEach(function (t) {
        WL_NAMES[t.language.code] = t.language.name;
        if (t.url) TR_API[p + '/' + c + '/' + t.language.code] = pathOf(t.url);
      });
      return trs;
    });
  }
  function downloadPo(p, c, lang, q) {
    var qs = '?format=po&q=' + encodeURIComponent(q);
    return http(trApi(p, c, lang) + 'file/' + qs, true)
      .catch(function (e) {
        return http('/download/' + p + '/' + c + '/' + lang + '/' + qs, true).catch(function () { throw e; });
      });
  }

  /* ---------- ссылки ---------- */
  function parseLinks(text) {
    var seen = {}, out = [];
    var re = /\/projects\/([^\s#?"'<>]+)/g, m;
    while ((m = re.exec(text))) {
      var segs = m[1].split('/').filter(Boolean).map(function (x) { try { return decodeURIComponent(x); } catch (e) { return x; } });
      if (!segs.length || seen[segs.join('/')]) continue;
      seen[segs.join('/')] = 1;
      out.push({ p: segs[0], segs: segs.slice(1), text: segs.join('/') });
    }
    return out;
  }
  /* ссылка → компоненты: на компонент, на категорию (все компоненты в ней) или на проект (все) */
  function resolveLinks(text) {
    var list = parseLinks(text), out = [], seen = {}, missing = [];
    function add(p, c) { if (!seen[p + '/' + c]) { seen[p + '/' + c] = 1; out.push({ p: p, c: c }); } }
    return Promise.all(list.map(function (l) {
      return projectComponents(l.p).then(function (all) { return { l: l, all: all }; }, function () { return { l: l, all: null }; });
    })).then(function (rs) {
      rs.forEach(function (r) {
        var l = r.l, before = out.length;
        if (!r.all) { if (l.segs.length) add(l.p, l.segs[0]); else missing.push(l.text); return; }
        var known = {};
        r.all.forEach(function (x) { known[x.c] = 1; });
        for (var k = l.segs.length; k > 0; k--) {
          var path = l.segs.slice(0, k).join('/');
          if (known[path]) { add(l.p, path); return; }
        }
        var prefix = l.segs.length ? l.segs.join('/') + '/' : '';
        r.all.forEach(function (x) { if (!x.glossary && x.c.indexOf(prefix) === 0) add(l.p, x.c); });
        if (out.length === before) missing.push(l.text);
      });
      return { comps: out, missing: missing };
    });
  }
  function baseLang(code) { return code.toLowerCase().split(/[_\-@]/)[0]; }
  function matchLanguage(wanted, trs) {
    var codes = trs.map(function (t) { return t.language.code; });
    if (codes.indexOf(wanted) >= 0) return wanted;
    var same = codes.filter(function (c) { return baseLang(c) === baseLang(wanted); });
    return same.length === 1 ? same[0] : null;
  }

  /* ---------- Smartcat: запросы идут через фон расширения (там же хранится ключ) ---------- */
  var HAS_EXT = typeof chrome !== 'undefined' && !!(chrome.runtime && chrome.runtime.id && chrome.runtime.sendMessage);
  function scCall(type, data) {
    return new Promise(function (resolve, reject) {
      if (!HAS_EXT) return reject(new Error('Smartcat работает только в расширении'));
      chrome.runtime.sendMessage(Object.assign({ type: type }, data || {}), function (r) {
        if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
        if (!r || !r.ok) return reject(new Error((r && r.error) || 'нет ответа от расширения'));
        resolve(r.data);
      });
    });
  }
  /* языки машперевода — как в проекте Smartcat «AI translation 4 MP» */
  var MT_LANGS = ['kk', 'ky', 'tg', 'ka', 'hy', 'uz', 'en'];
  /* если в Weblate у языка несколько вариантов (en / en_US, uz / uz_Latn) — берём один:
     для узбекского латиницу, для остальных основной код */
  /* выгружаем, но в Smartcat не отправляем */
  var EXPORT_ONLY_LANGS = ['az'];
  function mtPick(codes, bases) {
    var out = [];
    (bases || MT_LANGS).forEach(function (b) {
      var c = codes.filter(function (x) { return baseLang(x) === b && !/generated/i.test(WL_NAMES[x] || ''); });
      if (!c.length) return;
      var pick = b === 'uz' ? (c.filter(function (x) { return /latn/i.test(x); })[0] || c.filter(function (x) { return x === b; })[0])
        : c.filter(function (x) { return x === b; })[0];
      out.push(pick || c.sort(function (x, y) { return x.length - y.length; })[0]);
    });
    return out;
  }
  /* код Weblate → код Smartcat: из настроек (uz_Latn=uz-Latn) или просто «_» → «-» */
  /* коды Smartcat по умолчанию (как в проекте «AI translation 4 MP»); настройки в ⚙ их дополняют/перебивают */
  /* куда дополнительно класть английский (без папки, «ДДММГГ_имяфайла.po»), обратно оттуда не забираем */
  var SC_EN_DEFAULTS = {
    android: 'https://smartcat.com/projects/732af7d0-0e14-4705-99dd-97b31f8f4933',
    ios: 'https://smartcat.com/projects/85c99769-dcf4-429c-8432-7ed09a4d2f10'
  };
  var SC_PROJECT_DEFAULT = 'AI translation 4 MP';
  var SC_LANG_DEFAULTS = 'ru=ru-RU\nen=en\nen_US=en\nkk=kk\nky=ky\ntg=tg\nka=ka\nhy=hy\nuz=uz-Latn\nuz_Latn=uz-Latn';
  function scPlatform(p, c) {
    var t = (p + '/' + c).toLowerCase();
    if (/android/.test(t)) return 'android';
    if (/(^|[^a-z])ios([^a-z]|$)/.test(t)) return 'ios';
    return 'web';
  }
  function ddmmyy() { var d = new Date(); return ('0' + d.getDate()).slice(-2) + ('0' + (d.getMonth() + 1)).slice(-2) + String(d.getFullYear()).slice(-2); }
  function scLangMap(text) {
    var m = {};
    (SC_LANG_DEFAULTS + '\n' + String(text || '')).split(/[\n,;]+/).forEach(function (l) {
      var kv = l.split('=');
      if (kv.length === 2 && kv[0].trim() && kv[1].trim()) m[kv[0].trim()] = kv[1].trim();
    });
    return function (code) { return m[code] || code.replace(/_/g, '-'); };
  }
  /* ---------- PO filter: keep header + empty / fuzzy entries ---------- */
  function unquote(s) {
    s = s.trim();
    return s.length >= 2 && s[0] === '"' && s[s.length - 1] === '"' ? s.slice(1, -1) : s;
  }
  function wordCount(s) {
    s = s.replace(/\\n|\\t/g, ' ').replace(/<[^>]+>/g, ' ').replace(/\{\{?[^}]*\}\}?|%\w/g, ' ');
    var m = s.match(/[\p{L}\p{N}_]+/gu);
    return m ? m.length : 0;
  }
  function poEntries(text) {
    var out = [];
    text.replace(/\r\n/g, '\n').split(/\n\s*\n/).forEach(function (b) {
      var lines = b.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      var fuzzy = lines.some(function (l) { return l.indexOf('#,') === 0 && l.indexOf('fuzzy') >= 0; });
      var obsolete = lines.every(function (l) { return l[0] === '#'; }) && lines.some(function (l) { return l.indexOf('#~') === 0; });
      var f = {}, key = null;
      lines.forEach(function (l) {
        if (l[0] === '#') return;
        var m = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+(".*")\s*$/.exec(l);
        if (m) { key = m[1]; f[key] = unquote(m[2]); }
        else if (l.trim()[0] === '"' && key) { f[key] += unquote(l); }
      });
      if (f.msgid === undefined) return;
      var strs = Object.keys(f).filter(function (k) { return k.indexOf('msgstr') === 0; }).map(function (k) { return f[k]; });
      out.push({
        lines: lines, fuzzy: fuzzy, obsolete: obsolete, msgid: f.msgid, plural: f.msgid_plural || '', strs: strs,
        header: f.msgid === '' && !f.msgid_plural,
        done: !!strs.length && strs.every(function (x) { return x !== ''; }) && !fuzzy
      });
    });
    return out;
  }
  function filterPo(text, dropPlurals) {
    var keep = [], n = 0, words = 0, plurals = 0;
    poEntries(text).forEach(function (e) {
      if (e.header) { keep.push(e.lines.join('\n')); return; }
      if (e.obsolete || e.done) return;
      if (e.plural) { plurals++; if (dropPlurals) return; }
      keep.push(e.lines.join('\n'));
      n++;
      words += wordCount(e.msgid) + wordCount(e.plural);
    });
    return { text: keep.join('\n\n') + '\n', strings: n, words: words, plurals: plurals };
  }

  /* ---------- плюралки → i18next JSON ---------- */
  var CAT_ORDER = ['zero', 'one', 'two', 'few', 'many', 'other'];
  function pluralCats(code) {
    try {
      var c = new Intl.PluralRules(code.replace(/_/g, '-')).resolvedOptions().pluralCategories;
      return CAT_ORDER.filter(function (x) { return c.indexOf(x) >= 0; });
    } catch (e) { return ['one', 'other']; }
  }
  /* подогнать категории CLDR под число форм в Weblate (у русского в Weblate 3 формы без other) */
  function fitCats(cats, n) {
    cats = cats.slice();
    if (cats.length > n && cats.indexOf('other') >= 0) cats.splice(cats.indexOf('other'), 1);
    return cats.length === n ? cats : null;
  }
  var FORMATS = {};
  function componentFormat(p, c) {
    var k = p + '/' + c;
    if (!FORMATS[k]) FORMATS[k] = http(compApi(p, c)).then(function (d) { return d.file_format || ''; }, function () { return ''; });
    return FORMATS[k];
  }
  function units(p, c, lang, q) {
    return paginate(trApi(p, c, lang) + 'units/?q=' + encodeURIComponent(q));
  }
  function pluralSuffixes(fmt, code, n) {
    var idx = [];
    for (var i = 0; i < n; i++) idx.push('_' + i);
    if (fmt === 'i18next') return n === 2 ? ['', '_plural'] : idx;
    var cats = fitCats(pluralCats(code), n);
    return cats ? cats.map(function (c) { return '_' + c; }) : idx;
  }
  /* непереведённые плюралки → { "ключ_one": "…", "ключ_other": "…" }; где перевода нет — русский исходник нужной формы */
  function pluralJson(list, fmt, srcCode, tgtCode) {
    var out = {}, strings = 0, words = 0;
    list.forEach(function (u) {
      if (!u.source || u.source.length < 2 || u.state >= 20 || !u.context) return;
      var n = u.target && u.target.length > 1 ? u.target.length : pluralCats(tgtCode).length;
      var sufs = pluralSuffixes(fmt, tgtCode, n);
      var tgtCats = fitCats(pluralCats(tgtCode), n);
      var srcCats = fitCats(pluralCats(srcCode), u.source.length);
      sufs.forEach(function (suf, i) {
        var val = u.target && u.target[i];
        if (!val) {
          var j = Math.min(i, u.source.length - 1);
          if (tgtCats && srcCats) {
            var cat = tgtCats[i];
            j = srcCats.indexOf(cat);
            if (j < 0) j = srcCats.indexOf('many') >= 0 ? srcCats.indexOf('many') : u.source.length - 1;
          }
          val = u.source[j];
        }
        out[u.context + suf] = val;
      });
      strings++;
      words += u.num_words || wordCount(u.source[0]);
    });
    return { text: JSON.stringify(out, null, 2) + '\n', strings: strings, words: words };
  }
  function poInfo(text) {
    var headers = {}, filled = 0, total = 0, withText = 0;
    poEntries(text).forEach(function (e) {
      if (e.header) {
        e.strs.join('').split('\\n').forEach(function (l) {
          var i = l.indexOf(':');
          if (i > 0) headers[l.slice(0, i).trim()] = l.slice(i + 1).trim();
        });
        return;
      }
      if (e.obsolete) return;
      total++;
      if (e.done) filled++;
      /* с текстом перевода, даже если помечено «требует правки» — так Smartcat отдаёт неподтверждённый машинный перевод */
      if (e.strs.length && e.strs.every(function (x) { return x !== ''; })) withText++;
    });
    return { headers: headers, filled: filled, total: total, withText: withText };
  }

  /* ---------- ZIP (store, UTF-8 names) ---------- */
  var CRC = (function () {
    var t = [], c, n, k;
    for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
    return t;
  })();
  function crc32(buf) {
    var c = 0xFFFFFFFF;
    for (var i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }
  function makeZip(files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var d = new Date();
    var dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
    var dosDate = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();
    files.forEach(function (f) {
      var name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
      var h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, dosTime, true); h.setUint16(12, dosDate, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, name.length, true); h.setUint16(28, 0, true);
      parts.push(h.buffer, name, data);
      var cd = new DataView(new ArrayBuffer(46));
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true);
      cd.setUint16(8, 0x0800, true); cd.setUint16(10, 0, true); cd.setUint16(12, dosTime, true);
      cd.setUint16(14, dosDate, true); cd.setUint32(16, crc, true); cd.setUint32(20, data.length, true);
      cd.setUint32(24, data.length, true); cd.setUint16(28, name.length, true);
      cd.setUint32(42, offset, true);
      central.push(cd.buffer, name);
      offset += 30 + name.length + data.length;
    });
    var cdSize = central.reduce(function (s, p) { return s + p.byteLength; }, 0);
    var end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return new Blob(parts.concat(central, [end.buffer]), { type: 'application/zip' });
  }
  function saveBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }

  /* ---------- ZIP read (stored / deflate) ---------- */
  function readZip(buf) {
    var dv = new DataView(buf), u8 = new Uint8Array(buf), dec = new TextDecoder('utf-8'), eocd = -1;
    for (var i = buf.byteLength - 22; i >= 0; i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) return Promise.reject(new Error('не похоже на zip-архив'));
    var count = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), jobs = [];
    for (var k = 0; k < count; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nlen = dv.getUint16(p + 28, true), xlen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      var loc = dv.getUint32(p + 42, true);
      var name = dec.decode(u8.subarray(p + 46, p + 46 + nlen));
      var start = loc + 30 + dv.getUint16(loc + 26, true) + dv.getUint16(loc + 28, true);
      var data = u8.slice(start, start + csize);
      p += 46 + nlen + xlen + clen;
      if (/\/$/.test(name) || /__MACOSX/.test(name) || !/\.(po|json)$/i.test(name)) continue;
      jobs.push((function (name, method, data) {
        var bytes = method === 0 ? Promise.resolve(data.buffer)
          : new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
        return bytes.then(function (b) { return { name: name, text: dec.decode(b) }; });
      })(name, method, data));
    }
    return Promise.all(jobs);
  }

  /* ---------- upload ---------- */
  function csrfToken() {
    var i = document.querySelector('input[name=csrfmiddlewaretoken]');
    if (i && i.value) return Promise.resolve(i.value);
    var m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    if (m) return Promise.resolve(decodeURIComponent(m[1]));
    return fetch('/', { credentials: 'same-origin' }).then(function (r) { return r.text(); }).then(function (t) {
      var m2 = /name="csrfmiddlewaretoken"\s+value="([^"]+)"/.exec(t);
      if (!m2) throw new Error('Не нашла CSRF-токен — открой любую страницу Weblate и попробуй ещё раз');
      return m2[1];
    });
  }
  function uploadPo(u, opts, token) {
    function form(api) {
      var fd = new FormData();
      var isJson = /\.json$/i.test(u.name);
      fd.append('file', new Blob([u.text], { type: isJson ? 'application/json' : 'text/x-gettext-translation' }), u.name.split('/').pop());
      fd.append('method', opts.method); fd.append('fuzzy', opts.fuzzy); fd.append('conflicts', opts.conflicts);
      if (!api) fd.append('csrfmiddlewaretoken', token);
      return fd;
    }
    var path = u.p + '/' + u.c + '/' + u.lang + '/';
    return fetch(trApi(u.p, u.c, u.lang) + 'file/', {
      method: 'POST', credentials: 'same-origin', body: form(true),
      headers: { 'X-CSRFToken': token, 'Accept': 'application/json' }
    }).then(function (r) {
      return r.text().then(function (t) {
        if (r.ok) { try { return JSON.parse(t); } catch (e) { return { result: true }; } }
        if (r.status === 403 || r.status === 405) {
          return fetch('/upload/' + path, { method: 'POST', credentials: 'same-origin', body: form(false) }).then(function (r2) {
            if (!r2.ok) throw new Error('HTTP ' + r2.status + ': ' + t.slice(0, 200));
            return { viaForm: true };
          });
        }
        throw new Error('HTTP ' + r.status + ': ' + t.slice(0, 300));
      });
    });
  }

  /* ---------- UI ---------- */
  var CSS = [
    ':host{all:initial}',
    '.back{position:fixed;inset:0;background:rgba(15,20,30,.45);z-index:2147483646;display:flex;align-items:flex-start;justify-content:center;overflow:auto;padding:24px 12px}',
    '.box{background:#fff;color:#1d2330;width:100%;max-width:760px;border-radius:14px;box-shadow:0 20px 60px rgba(0,0,0,.3);padding:22px 22px 26px;font:14px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.top{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px}',
    'h1{font-size:19px;margin:0}',
    '.x{background:none;border:0;font-size:24px;line-height:1;cursor:pointer;color:#6b7385;padding:4px 8px}',
    '.sub{color:#6b7385;margin:0 0 14px;font-size:13px}',
    'h2{font-size:14px;margin:18px 0 8px}',
    'textarea{width:100%;box-sizing:border-box;min-height:140px;padding:9px 11px;border:1px solid #d9dde5;border-radius:8px;font:12.5px/1.5 Consolas,ui-monospace,monospace;resize:vertical;color:#1d2330;background:#fff}',
    '.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:10px}',
    'button.b{font:inherit;border:0;border-radius:8px;padding:9px 16px;cursor:pointer;background:#1b8a6b;color:#fff;font-weight:600}',
    'button.g{background:#e8f5f0;color:#1b8a6b}',
    'button.s{padding:5px 11px;font-size:13px}',
    'button.big{font-size:16px;padding:12px 26px}',
    'button:disabled{opacity:.5;cursor:default}',
    '.langs{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:2px;margin-top:8px}',
    '.langs label{display:flex;gap:7px;align-items:center;padding:5px 7px;border-radius:6px;cursor:pointer}',
    '.langs label:hover{background:#f3f5f8}',
    '.muted{color:#6b7385;font-size:12.5px}',
    '.err{color:#c0392b;white-space:pre-wrap;margin-top:8px;font-size:13px}',
    '.bar{height:9px;background:#e3e6ec;border-radius:6px;overflow:hidden;margin:8px 0 12px}',
    '.bar>div{height:100%;width:0;background:#1b8a6b;transition:width .25s}',
    'table{width:100%;border-collapse:collapse;font-size:13.5px}',
    'th,td{text-align:left;padding:7px 5px;border-bottom:1px solid #eceef2}',
    'th{color:#6b7385;font-weight:500;font-size:12.5px}',
    '.n{text-align:right;font-variant-numeric:tabular-nums}',
    'details{margin-top:12px}summary{cursor:pointer;color:#6b7385;font-size:13px}',
    '.blk{display:block;margin-top:10px}',
    '.red{color:#c0392b}',
    '.tabs{display:flex;gap:6px;margin:6px 0 4px;border-bottom:1px solid #eceef2;padding-bottom:10px}',
    '.tab{font:inherit;border:0;border-radius:8px;padding:8px 14px;cursor:pointer;background:#f3f5f8;color:#1d2330;font-weight:600}',
    '.tab.on{background:#1b8a6b;color:#fff}',
    '.drop{display:block;border:2px dashed #cfd5de;border-radius:10px;padding:22px;text-align:center;cursor:pointer;color:#6b7385}',
    '.drop.over{border-color:#1b8a6b;background:#e8f5f0;color:#1b8a6b}',
    '.drop input{display:none}',
    '.opts{display:grid;grid-template-columns:1fr;gap:10px}',
    '.opts label{display:block;font-size:13px;color:#6b7385}',
    'select{display:block;width:100%;margin-top:4px;padding:8px 10px;border:1px solid #d9dde5;border-radius:8px;font:inherit;color:#1d2330;background:#fff}',
    '.ok{color:#1b8a6b}',
    '.flag{display:inline-block;width:24px;height:18px;flex:none;vertical-align:middle}',
    '.flag svg{width:24px;height:18px;display:block}',
    '.lang{display:inline-flex;align-items:center;gap:8px}',
    '.layouts{display:grid;gap:4px}',
    '.layouts label{display:flex;gap:8px;align-items:baseline;padding:5px 7px;border-radius:6px;cursor:pointer}',
    '.layouts label:hover{background:#f3f5f8}',
    '.complist{max-height:220px;overflow:auto;font:12.5px/1.6 Consolas,ui-monospace,monospace;color:#1d2330;padding:6px 0}',
    '.settings{margin:6px 0 10px;padding:12px 14px;border-radius:10px;background:#f3f5f8}',
    '.settings label{display:block;font-size:13px;color:#6b7385;margin-top:8px}',
    '.settings input,.settings select,.track input{display:block;width:100%;box-sizing:border-box;margin-top:3px;padding:7px 9px;border:1px solid #d9dde5;border-radius:7px;font:inherit;color:#1d2330;background:#fff}',
    'textarea.small{min-height:56px;margin-top:3px}',
    '.track{margin-top:18px;border-top:1px solid #eceef2;padding-top:4px}',
    '.scimp{margin-bottom:12px;padding:10px 12px;border-radius:10px;background:#f3f5f8}',
    '.scimp h2{margin-top:0}',
    '.scgroup{margin-top:10px;padding:8px 10px;border:1px solid #eceef2;border-radius:8px}',
    'select.presel{display:inline-block;width:auto;min-width:220px;margin:0;padding:6px 8px;border:1px solid #d9dde5;border-radius:7px;font:inherit;background:#fff;color:#1d2330}',
    'pre.report{white-space:pre-wrap;font:12.5px/1.55 Consolas,ui-monospace,monospace;background:#f3f5f8;border-radius:8px;padding:10px 12px;margin:6px 0;color:#1d2330}',
    '.hide{display:none}'
  ].join('\n');

  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === 'text') e.textContent = attrs[k];
      else if (k === 'class') e.className = attrs[k];
      else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), attrs[k]);
      else e.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (k) { if (k) e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k); });
    return e;
  }

  var host = el('div', { id: 'wl-export-host' });
  var root = host.attachShadow({ mode: 'open' });
  try {
    var sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); root.adoptedStyleSheets = [sheet];
  } catch (e) {
    root.appendChild(el('style', { text: CSS }));
  }

  var links = el('textarea', { placeholder: 'Вставь ссылки на компоненты — можно прямо сообщение из чата целиком' });
  var info = el('span', { class: 'muted' });
  var compList = el('div');
  var err1 = el('div', { class: 'err' });
  var langsBox = el('div', { class: 'langs' });
  var fuzzy = el('input', { type: 'checkbox' }); fuzzy.checked = true;
  var pluralsJson = el('input', { type: 'checkbox' });
  pluralsJson.checked = sget('wlx_pj') !== '0';
  pluralsJson.addEventListener('change', function () { sset('wlx_pj', pluralsJson.checked ? '1' : '0'); });
  var err2 = el('div', { class: 'err' });
  var progText = el('div', { class: 'muted' });
  var barFill = el('div');
  var results = el('div');
  var loadBtn = el('button', { class: 'b g', text: 'Загрузить языки', onclick: loadLangs });
  var goBtn = el('button', { class: 'b big', text: 'Выгрузить', onclick: runExport });
  var clearBtn = el('button', { class: 'b g s', text: 'Очистить', onclick: function () {
    links.value = ''; links.focus(); info.textContent = ''; err1.textContent = ''; compList.textContent = '';
    langSec.classList.add('hide'); resSec.classList.add('hide');
  } });
  var restoreBtn = el('button', { class: 'b g s', text: 'Вернуть прошлые ссылки', onclick: function () {
    links.value = sget('wlx_links') || '';
  } });
  var LAYOUTS = [
    ['component', 'По компонентам', 'папка на каждый компонент: wb-web-resale/, wb-web-rqx/…'],
    ['language', 'По языкам', 'папка на каждый язык: Грузинский/, Казахский/…'],
    ['flat', 'Всё в одну папку', 'все файлы вместе, без подпапок']
  ];
  var layoutBox = el('div', { class: 'layouts' });
  var savedLayout = sget('wlx_layout') || 'component';
  LAYOUTS.forEach(function (l) {
    var r = el('input', { type: 'radio', name: 'wlx-layout', value: l[0] });
    r.checked = l[0] === savedLayout;
    r.addEventListener('change', function () { sset('wlx_layout', l[0]); });
    layoutBox.appendChild(el('label', {}, [r, el('span', {}, [el('b', { text: l[1] }), el('span', { class: 'muted', text: ' — ' + l[2] })])]));
  });
  function currentLayout() {
    var r = layoutBox.querySelector('input:checked');
    return r ? r.value : 'component';
  }
  var englishApart = el('input', { type: 'checkbox' });
  englishApart.checked = sget('wlx_en') !== '0';
  englishApart.addEventListener('change', function () { sset('wlx_en', englishApart.checked ? '1' : '0'); });
  var langSec = el('div', { class: 'hide' }, [
    el('h2', { text: '2. Языки' }),
    el('div', { class: 'row' }, [
      el('button', { class: 'b g s', text: 'Все', onclick: function () { setAll(true); } }),
      el('button', { class: 'b g s', text: 'Снять все', onclick: function () { setAll(false); } }),
      el('button', { class: 'b g s', text: 'Набор для Smartcat: KK KY TG KA HY UZ EN', title: 'Отметить языки, которые отправляем в Smartcat', onclick: function () {
        var inputs = Array.prototype.slice.call(langsBox.querySelectorAll('input'));
        var pick = mtPick(inputs.map(function (i) { return i.value; }));
        inputs.forEach(function (i) { i.checked = pick.indexOf(i.value) >= 0; });
      } })
    ]),
    langsBox,
    el('label', { class: 'muted blk' }, [fuzzy, ' включать строки «требует правки»']),
    el('label', { class: 'muted blk' }, [pluralsJson, ' плюралки (множественное число) — отдельным .json, как у нас принято']),
    el('h2', { text: 'Как разложить файлы в архиве' }),
    layoutBox,
    el('label', { class: 'muted blk' }, [englishApart, ' английский всегда отдельно — в папку «Английский ШТАТ»']),
    el('div', { class: 'row' }, [goBtn]),
    err2
  ]);
  var resSec = el('div', { class: 'hide' }, [el('h2', { text: '3. Результат' }), progText, el('div', { class: 'bar' }, [barFill]), results]);

  /* ----- наборы: сохранить ссылки (и языки) под именем и выбирать из списка ----- */
  function presetBar(storeKey, builtin, getState, applyState) {
    var sel = el('select', { class: 'presel' });
    function own() { try { return JSON.parse(sget(storeKey) || '[]'); } catch (e) { return []; } }
    function all() { return builtin.concat(own()); }
    function find(name) { return all().filter(function (x) { return x.name === name; })[0]; }
    var delBtn = el('button', { class: 'b g s', text: 'Удалить набор', onclick: function () {
      var p = find(sel.value);
      if (!p || p.builtin || !confirm('Удалить набор «' + p.name + '»?')) return;
      sset(storeKey, JSON.stringify(own().filter(function (x) { return x.name !== p.name; })));
      refresh('');
    } });
    function refresh(selected) {
      sel.textContent = '';
      sel.appendChild(el('option', { value: '', text: '— выбрать набор —' }));
      all().forEach(function (p) { sel.appendChild(el('option', { value: p.name, text: p.name + (p.builtin ? ' (стандартный)' : '') })); });
      sel.value = selected || '';
      var p = find(sel.value);
      delBtn.classList.toggle('hide', !p || !!p.builtin);
    }
    sel.addEventListener('change', function () { var p = find(sel.value); if (p) applyState(p); refresh(sel.value); });
    var saveBtn = el('button', { class: 'b g s', text: '💾 Сохранить как набор', onclick: function () {
      var cur = find(sel.value);
      var name = prompt('Название набора (например: Портал продавца)', cur && !cur.builtin ? cur.name : '');
      if (!name || !name.trim()) return;
      name = name.trim();
      if (builtin.some(function (b) { return b.name === name; })) { alert('Так называется стандартный набор — выбери другое название'); return; }
      var list = own().filter(function (x) { return x.name !== name; });
      list.push(Object.assign({ name: name }, getState()));
      sset(storeKey, JSON.stringify(list));
      refresh(name);
    } });
    refresh('');
    return el('div', { class: 'row' }, [el('span', { class: 'muted', text: 'Набор:' }), sel, saveBtn, delBtn]);
  }
  var exportPresets = presetBar('wlx_presets_exp', [], function () {
    var checked = Array.prototype.map.call(langsBox.querySelectorAll('input:checked'), function (i) { return i.value; });
    var prev = null;
    try { prev = JSON.parse(sget('wlx_langs') || 'null'); } catch (e) {}
    return { links: links.value, langs: checked.length ? checked : (prev || []) };
  }, function (p) {
    links.value = p.links || '';
    if (p.langs && p.langs.length) {
      sset('wlx_langs', JSON.stringify(p.langs));
      langsBox.querySelectorAll('input').forEach(function (i) { i.checked = p.langs.indexOf(i.value) >= 0; });
    }
    info.textContent = 'Набор «' + p.name + '»: нажми «Загрузить языки» — языки отметятся сами';
  });

  var exportPane = el('div', {}, [
    el('p', { class: 'sub', text: 'Ссылки → языки → «Выгрузить». На выходе .po по каждому компоненту и языку, в архиве — как удобнее: по компонентам, по языкам или всё вместе.' }),
    el('h2', { text: '1. Ссылки на компоненты' }),
    exportPresets,
    links,
    el('div', { class: 'row' }, [loadBtn, clearBtn, restoreBtn, info]),
    err1,
    compList,
    langSec,
    resSec
  ]);

  /* ----- import pane ----- */
  function select(options, value) {
    var sel = el('select');
    options.forEach(function (o) { sel.appendChild(el('option', { value: o[0], text: o[1] })); });
    sel.value = value;
    return sel;
  }
  function savedOr(k, def) { var v = sget(k); return v === null ? def : v; }
  var fileInput = el('input', { type: 'file', multiple: '', accept: '.po,.json,.zip' });
  var drop = el('label', { class: 'drop' }, [fileInput, el('div', { text: 'Перетащи сюда .po, .json (плюралки) или .zip от подрядчика — или нажми, чтобы выбрать' })]);
  var preview = el('div');
  var errU = el('div', { class: 'err' });
  var optMethod = select([['translate', 'Добавить как перевод'], ['suggest', 'Добавить как предложение'], ['fuzzy', 'Добавить перевод как «На правку»']], savedOr('wlx_m', 'translate'));
  var optFuzzy = select([['approve', 'Импортировать как переведённое'], ['process', 'Импортировать как «На правку»'], ['', 'Не импортировать']], savedOr('wlx_f', 'approve'));
  var optConf = select([['replace-approved', 'Изменять переведённые и одобренные строки'], ['replace-translated', 'Изменять переведённые строки'], ['', 'Изменять только непереведённые строки']], savedOr('wlx_c', 'replace-approved'));
  var upBtn = el('button', { class: 'b big', text: 'Загрузить в Weblate', onclick: runUpload });
  var upResults = el('div', { class: 'blk' });
  var upSec = el('div', { class: 'hide' }, [
    el('h2', { text: '2. Как загружать' }),
    el('div', { class: 'opts' }, [
      el('label', {}, ['Режим загрузки файла', optMethod]),
      el('label', {}, ['Обработка строк, отмеченных «На правку»', optFuzzy]),
      el('label', {}, ['Разрешение конфликтов', optConf])
    ]),
    el('p', { class: 'muted', text: 'Машинный перевод из Smartcat (вкладка «🤖 Smartcat») эти настройки не использует — он всегда загружается с «Добавить как перевод» и «Изменять только непереведённые строки».' }),
    el('p', { class: 'muted', text: '«Заменить существующий файл перевода» здесь нет специально: в файлах только часть строк, и замена стёрла бы остальные переводы.' }),
    el('div', { class: 'row' }, [upBtn]),
    upResults
  ]);
  var importPane = el('div', { class: 'hide' }, [
    el('p', { class: 'sub', text: 'Файлы от подрядчиков → проверка → «Загрузить в Weblate». Компонент и язык определяются сами. Машинный перевод из Smartcat загружается на вкладке «🤖 Smartcat».' }),
    el('h2', { text: '1. Файлы от подрядчиков' }),
    drop, errU,
    preview, upSec
  ]);

  /* ----- вкладка «Smartcat»: стандартный набор одной кнопкой ----- */
  var SC_DEFAULT_LINKS = 'https://weblate.wb.ru/projects/global_site/wb-android/\nhttps://weblate.wb.ru/projects/global_site/wb-ios_new/';
  var scLinks = el('textarea', { class: 'small' });
  scLinks.value = sget('wlx_mt_links') || SC_DEFAULT_LINKS;
  var scRun = el('button', { class: 'b big', text: 'Выгрузить непереведённое', onclick: function () { runScPreset(false); } });
  var scRunSend = el('button', { class: 'b big', text: '🚀 Выгрузить и отправить в Smartcat', title: 'Выгрузить и сразу отправить в Smartcat. Когда перевод будет готов, придёт уведомление Chrome.',
    onclick: function () { runScPreset(true); } });
  var scPresets = presetBar('wlx_presets_sc', [{ name: 'Магазинка: андроид + айос', links: SC_DEFAULT_LINKS, builtin: true }], function () {
    return { links: scLinks.value.trim() };
  }, function (p) {
    scLinks.value = p.links || SC_DEFAULT_LINKS;
    sset('wlx_mt_links', p.links === SC_DEFAULT_LINKS ? '' : p.links);
  });
  var scProg = el('div', { class: 'muted' });
  var scBar = el('div');
  var scOut = el('div');
  var scBack = el('div', { class: 'scimp hide' });
  var scPane = el('div', { class: 'hide' }, [
    el('p', { class: 'sub', text: 'Стандартный набор для Smartcat: непереведённые строки по компонентам ниже на языки KK KY TG KA HY UZ EN (+ AZ — только в ZIP, в Smartcat не уходит; для android — AZ N11). На выходе ZIP с папками android и ios и отправка в Smartcat.' }),
    scPresets,
    el('details', {}, [el('summary', { text: 'Компоненты (можно поменять и сохранить как набор)' }),
      scLinks,
      el('div', { class: 'row' }, [el('button', { class: 'b g s', text: 'Вернуть стандартные', onclick: function () { scLinks.value = SC_DEFAULT_LINKS; sset('wlx_mt_links', ''); } })])]),
    el('div', { class: 'row' }, HAS_EXT ? [scRunSend, scRun] : [scRun]),
    el('div', { class: 'hide', id: 'wlx-sc-prog' }, [scProg, el('div', { class: 'bar' }, [scBar])]),
    scOut,
    scBack
  ]);
  /* AZ по платформе: у андроида свой язык az_N11, у остальных — обычный az */
  var AZ_BY_PLATFORM = { android: 'az_N11' };
  function presetLangs(x, codes) {
    var own = AZ_BY_PLATFORM[scPlatform(x.p, x.c)];
    var az = own && codes.filter(function (c) { return c.toLowerCase() === own.toLowerCase(); })[0];
    var rest = codes.filter(function (c) { return !/_n\d+$/i.test(c); });   /* az_N11 и подобные — только когда явно нужны */
    return mtPick(rest).concat(az ? [az] : mtPick(rest, EXPORT_ONLY_LANGS));
  }
  function runScPreset(autoSend) {
    var text = scLinks.value.trim() || SC_DEFAULT_LINKS;
    if (text !== SC_DEFAULT_LINKS) sset('wlx_mt_links', text);
    scRun.disabled = true; scRunSend.disabled = true; scOut.textContent = '';
    var prog = scPane.querySelector('#wlx-sc-prog'); prog.classList.remove('hide');
    scBar.style.width = '0%'; scProg.textContent = 'Ищу компоненты…';
    var plan = [];
    resolveLinks(text).then(function (r) {
      if (r.missing.length) scOut.appendChild(el('div', { class: 'err', text: 'Не нашла компоненты по ссылкам:\n' + r.missing.join('\n') }));
      if (!r.comps.length) throw new Error('Не нашла ни одного компонента');
      scProg.textContent = 'Смотрю языки…';
      /* языки выбираются для каждого компонента отдельно */
      return pool(r.comps, 4, function (x) {
        return translations(x.p, x.c).then(function (trs) {
          var codes = trs.filter(function (t) { return !t.is_source; }).map(function (t) { return t.language.code; });
          plan.push({ comp: x, langs: presetLangs(x, codes) });
        });
      });
    }).then(function () {
      plan = plan.filter(function (x) { return x.langs.length; });
      if (!plan.length) throw new Error('В компонентах нет языков из набора');
      var total = plan.reduce(function (a, x) { return a + x.langs.length; }, 0), done = 0;
      scProg.textContent = 'Скачиваю… 0 из ' + total;
      var all = { res: [], errs: [] };
      return pool(plan, 2, function (x) {
        return exportCore([x.comp], x.langs, { q: QUERY_EMPTY, wantJson: false }, function () {
          done++; scBar.style.width = Math.round(100 * done / total) + '%'; scProg.textContent = 'Скачиваю… ' + done + ' из ' + total;
        }).then(function (r) { all.res = all.res.concat(r.res); all.errs = all.errs.concat(r.errs); });
      }).then(function () { return all; });
    }).then(function (r) {
      scBar.style.width = '100%'; scProg.textContent = 'Готово!';
      showScPreset(r.res, r.errs, autoSend);
    }).catch(function (e) {
      scOut.appendChild(el('div', { class: 'err', text: friendly(e) }));
      prog.classList.add('hide');
    }).then(function () { scRun.disabled = false; scRunSend.disabled = false; });
  }

  function scFileName(r) { return r.p + '-' + fileKey(r.component) + '-' + r.language + '.po'; }
  function showScPreset(res, errs, autoSend) {
    if (!res.length) { scOut.appendChild(el('p', { text: 'Непереведённых строк нет — всё переведено 🎉' })); }
    else {
      var by = {}, plats = [];
      res.forEach(function (r) {
        var pl = scPlatform(r.p, r.component);
        if (plats.indexOf(pl) < 0) plats.push(pl);
        var k = pl + '|' + r.language, a = by[k] = by[k] || { pl: pl, lang: r.language, strings: 0, words: 0 };
        a.strings += r.strings; a.words += r.words;
      });
      var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Папка' }), el('th', { text: 'Язык' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' })])]);
      Object.keys(by).sort().forEach(function (k) {
        var a = by[k];
        t.appendChild(el('tr', {}, [el('td', { text: ddmmyy() + '_' + a.pl }), el('td', {}, [langLabel(a.lang)]),
          el('td', { class: 'n', text: String(a.strings) }), el('td', { class: 'n', text: String(a.words) })]));
      });
      scOut.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'b', text: '⬇ Скачать ZIP (' + plats.sort().join(' / ') + ' отдельно)', onclick: function () {
          var files = res.map(function (r) { return { name: ddmmyy() + '_' + scPlatform(r.p, r.component) + '/' + scFileName(r), text: r.text }; });
          files.sort(function (a, b) { return a.name.localeCompare(b.name); });
          saveBlob(makeZip(files), 'smartcat_' + ddmmyy() + '.zip');
        } })
      ]));
      scOut.appendChild(t);
      var toSc = res.filter(function (r) { return EXPORT_ONLY_LANGS.indexOf(baseLang(r.language)) < 0; });
      var only = res.filter(function (r) { return toSc.indexOf(r) < 0; }).map(function (r) { return r.language; })
        .filter(function (x, i, a) { return a.indexOf(x) === i; });
      if (only.length) scOut.appendChild(el('p', { class: 'muted', text: only.map(langName).join(', ') + ' — только в ZIP, в Smartcat не отправляется.' }));
      if (toSc.length) renderSmartcat(toSc, scOut).then(function (sendBtn) {
        if (autoSend && sendBtn) sendBtn.click();
        else if (autoSend) scOut.appendChild(el('div', { class: 'err', text: 'Отправить не получилось: Smartcat не подключён (⚙)' }));
      });
    }
    if (errs.length) {
      var et = el('table');
      errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
      scOut.appendChild(el('details', { open: '' }, [el('summary', { text: 'Проблемы: ' + errs.length, class: 'red' }), et]));
    }
  }

  var tabExp = el('button', { class: 'tab on', text: '⬇ Выгрузить', onclick: function () { tab('exp'); } });
  var tabSc = el('button', { class: 'tab', text: '🤖 Smartcat', onclick: function () { tab('sc'); } });
  var tabImp = el('button', { class: 'tab', text: '⬆ Загрузить обратно', onclick: function () { tab('imp'); } });
  function tab(t) {
    tabExp.classList.toggle('on', t === 'exp'); tabSc.classList.toggle('on', t === 'sc'); tabImp.classList.toggle('on', t === 'imp');
    exportPane.classList.toggle('hide', t !== 'exp'); scPane.classList.toggle('hide', t !== 'sc'); importPane.classList.toggle('hide', t !== 'imp');
  }


  /* ----- настройки Smartcat (только в расширении) ----- */
  var scServer = select([['eu', 'smartcat.com'], ['us', 'us.smartcat.com'], ['ea', 'ea.smartcat.com'], ['custom', 'свой адрес']], 'eu');
  var scCustom = el('input', { type: 'text', placeholder: 'https://…' });
  var scAccount = el('input', { type: 'text', placeholder: 'Account ID' });
  var scKey = el('input', { type: 'password', placeholder: 'API-ключ' });
  var scProject = el('input', { type: 'text', placeholder: 'ссылка на проект или название; пусто = ' + SC_PROJECT_DEFAULT });
  var scEnAndroid = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.android });
  var scEnIos = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.ios });
  var scLangs = el('textarea', { class: 'small', placeholder: 'если Smartcat не принимает код языка, например:\nuz_Latn=uz-Latn' });
  var scExtra = el('textarea', { class: 'small', placeholder: '{"workflowStages": ["translation"]}' });
  var scMsg = el('div', { class: 'muted' });
  var scCfg = null;
  function loadScConfig() {
    if (!HAS_EXT) return Promise.resolve(null);
    return scCall('sc-get-config').then(function (c) {
      if (!c.project) c.project = SC_PROJECT_DEFAULT;
      scCfg = c; return c;
    }, function () { return null; });
  }
  function fillScSettings() {
    loadScConfig().then(function (c) {
      if (!c) return;
      scServer.value = c.server; scCustom.value = c.customUrl; scAccount.value = c.accountId;
      scKey.value = ''; scKey.placeholder = c.hasKey ? 'ключ сохранён — впиши новый, чтобы заменить' : 'API-ключ';
      scLangs.value = c.langMap; scExtra.value = c.extra; scProject.value = c.project === SC_PROJECT_DEFAULT ? '' : c.project;
      scEnAndroid.value = c.enAndroid; scEnIos.value = c.enIos;
    });
  }
  function saveScSettings() {
    if (scExtra.value.trim()) { try { JSON.parse(scExtra.value); } catch (e) { return Promise.reject(new Error('«Доп. параметры» — не JSON')); } }
    return scCall('sc-set-config', { config: { server: scServer.value, customUrl: scCustom.value.trim(), accountId: scAccount.value.trim(),
      apiKey: scKey.value.trim(), langMap: scLangs.value, extra: scExtra.value.trim(), project: scProject.value.trim(),
      enAndroid: scEnAndroid.value.trim(), enIos: scEnIos.value.trim() } }).then(loadScConfig);
  }
  /* копия настроек в файл (без API-ключа) — для нового компьютера или коллеги */
  var BACKUP_KEYS = ['wlx_links', 'wlx_langs', 'wlx_layout', 'wlx_en', 'wlx_pj', 'wlx_mt_links', 'wlx_sc_split', 'wlx_m', 'wlx_f', 'wlx_c', 'wlx_presets_exp', 'wlx_presets_sc'];
  var restoreInput = el('input', { type: 'file', accept: '.json', class: 'hide' });
  function backupSettings() {
    loadScConfig().then(function (c) {
      var local = {};
      BACKUP_KEYS.forEach(function (k) { var v = sget(k); if (v !== null) local[k] = v; });
      var data = { weblateExtensionSettings: 1, saved: new Date().toISOString(), smartcat: c ? {
        server: c.server, customUrl: c.customUrl, accountId: c.accountId, langMap: c.langMap, extra: c.extra,
        project: c.project === SC_PROJECT_DEFAULT ? '' : c.project, enAndroid: c.enAndroid, enIos: c.enIos } : null, local: local };
      saveBlob(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'weblate-extension-settings.json');
      scMsg.textContent = 'Сохранено в файл (без API-ключа)';
    });
  }
  restoreInput.addEventListener('change', function () {
    var f = restoreInput.files[0]; restoreInput.value = '';
    if (!f) return;
    f.text().then(function (t) {
      var d = JSON.parse(t);
      if (!d.weblateExtensionSettings) throw new Error('это не файл настроек расширения');
      Object.keys(d.local || {}).forEach(function (k) { if (BACKUP_KEYS.indexOf(k) >= 0) sset(k, d.local[k]); });
      return d.smartcat ? scCall('sc-set-config', { config: Object.assign({}, d.smartcat, { apiKey: '' }) }) : null;
    }).then(function () {
      fillScSettings(); scLinks.value = sget('wlx_mt_links') || SC_DEFAULT_LINKS;
      scMsg.textContent = '✓ Настройки загружены из файла. API-ключ — впиши, если его здесь ещё нет.';
    }, function (e) { scMsg.textContent = '✗ ' + (e.message || e); });
  });
  var settingsPane = el('div', { class: 'settings hide' }, [
    el('h2', { text: 'Smartcat' }),
    el('p', { class: 'muted', text: 'Ключ API: Smartcat → Настройки → API (создаёт администратор аккаунта). Ключ хранится только в расширении на этом компьютере.' }),
    el('label', {}, ['Сервер', scServer]),
    el('label', {}, ['Адрес (если «свой адрес»)', scCustom]),
    el('label', {}, ['Account ID', scAccount]),
    el('label', {}, ['API-ключ', scKey]),
    el('label', {}, ['Проект в Smartcat (файлы складываются в папки ДДММГГ_android / ДДММГГ_ios внутри него; пусто — «' + SC_PROJECT_DEFAULT + '»)', scProject]),
    el('label', {}, ['Английский дополнительно в проект (android) — пусто = стандартный', scEnAndroid]),
    el('label', {}, ['Английский дополнительно в проект (ios) — пусто = стандартный', scEnIos]),
    el('details', {}, [el('summary', { text: 'Дополнительно' }),
      el('label', {}, ['Коды языков для Smartcat (код_weblate=код_smartcat, по строке)', scLangs]),
      el('label', {}, ['Доп. параметры создания проекта (JSON, добавляются к стандартным)', scExtra])]),
    el('div', { class: 'row' }, [
      el('button', { class: 'b s', text: 'Сохранить', onclick: function () {
        scMsg.textContent = 'Сохраняю…';
        saveScSettings().then(function () { scMsg.textContent = 'Сохранено'; fillScSettings(); }, function (e) { scMsg.textContent = '✗ ' + e.message; });
      } }),
      el('button', { class: 'b g s', text: 'Проверить подключение', onclick: function () {
        scMsg.textContent = 'Проверяю…';
        saveScSettings().then(function () { return scCall('sc-check'); }).then(function (a) {
          scMsg.textContent = '✓ Подключено к Smartcat' + (a.name ? ': ' + a.name : '');
          fillScSettings();
          return scCall('sc-resolve-project', { ref: scProject.value.trim() || SC_PROJECT_DEFAULT }).then(function (pr) {
            scMsg.textContent += ' · проект «' + pr.name + '» найден' +
              (pr.targetLanguages.length ? ', коды языков в нём: ' + pr.targetLanguages.join(', ') : '');
          });
        }, function (e) { scMsg.textContent = '✗ ' + e.message; });
      } }),
      scMsg
    ]),
    el('div', { class: 'row' }, [
      el('button', { class: 'b g s', text: 'Сохранить настройки в файл', onclick: backupSettings }),
      el('button', { class: 'b g s', text: 'Загрузить настройки из файла', onclick: function () { restoreInput.click(); } }),
      restoreInput
    ]),
    el('p', { class: 'muted', text: 'Настройки хранятся в расширении и не сбрасываются при обновлении. Файл нужен только для другого компьютера.' })
  ]);

  var back = el('div', { class: 'back', onclick: function (e) { if (e.target === back) hide(); } }, [
    el('div', { class: 'box' }, [
      el('div', { class: 'top' }, [
        el('h1', { text: 'Weblate: выгрузка и загрузка переводов' }),
        el('div', {}, [
          HAS_EXT ? el('button', { class: 'x', title: 'Настройки Smartcat', text: '⚙', onclick: function () { settingsPane.classList.toggle('hide'); if (!settingsPane.classList.contains('hide')) fillScSettings(); } }) : null,
          el('button', { class: 'x', title: 'Закрыть', text: '×', onclick: hide })
        ])
      ]),
      settingsPane,
      el('div', { class: 'tabs' }, HAS_EXT ? [tabExp, tabSc, tabImp] : [tabExp, tabImp]),
      exportPane,
      scPane,
      importPane
    ])
  ]);
  root.appendChild(back);

  function show() { host.style.display = ''; }
  function hide() { host.style.display = 'none'; }
  function setAll(v) { langsBox.querySelectorAll('input').forEach(function (i) { i.checked = v; }); }
  function friendly(e) {
    var m = String(e && e.message || e);
    if (/HTTP 40[13]/.test(m)) return 'Weblate не пускает. Проверь, что ты вошла в Weblate в этой вкладке, и нажми закладку ещё раз.\n\n' + m;
    if (/HTTP 404/.test(m)) return 'Не нашёлся компонент или язык — проверь ссылку.\n\n' + m;
    if (/Failed to fetch|NetworkError/.test(m)) return 'Нет связи с Weblate (VPN?).\n\n' + m;
    return m;
  }

  /* поле ссылок при открытии пустое; прошлые ссылки можно вернуть кнопкой */
  var saved = sget('wlx_links');
  if (!saved) restoreBtn.classList.add('hide');

  var comps = [];
  function loadLangs() {
    err1.textContent = ''; compList.textContent = '';
    sset('wlx_links', links.value);
    if (!parseLinks(links.value).length) { err1.textContent = 'Не нашла ни одной ссылки вида …/projects/<проект>/…'; return; }
    loadBtn.disabled = true; info.textContent = 'Разбираю ссылки…';
    resolveLinks(links.value).then(function (r) {
      comps = r.comps;
      if (r.missing.length) err1.textContent = 'Не нашла компоненты по ссылкам:\n' + r.missing.join('\n');
      if (!comps.length) throw new Error('Не нашла ни одного компонента');
      sset('wlx_comps', JSON.stringify(comps));
      info.textContent = 'Нашла компонентов: ' + comps.length + '. Загружаю языки…';
      var all = [], done = 0;
      return pool(comps, 6, function (x) {
        return translations(x.p, x.c).then(function (trs) {
          all.push(trs); done++;
          info.textContent = 'Нашла компонентов: ' + comps.length + '. Загружаю языки… ' + done + ' из ' + comps.length;
        });
      }).then(function () { return all; });
    }).then(function (all) {
      var langs = {};
      all.forEach(function (trs) {
        trs.forEach(function (t) { if (!t.is_source) langs[t.language.code] = t.language.name; });
      });
      var prev = null;
      try { prev = JSON.parse(sget('wlx_langs') || 'null'); } catch (e) {}
      langsBox.textContent = '';
      Object.keys(langs).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (code) {
        var cb = el('input', { type: 'checkbox', value: code });
        cb.checked = prev ? prev.indexOf(code) >= 0 : !/generated/i.test(langs[code]);
        langsBox.appendChild(el('label', { title: code }, [cb, langLabel(code)]));
      });
      info.textContent = 'Компонентов: ' + comps.length + (comps.length > 100 ? ' — много, выгрузка займёт время' : '');
      var ul = el('div', { class: 'complist' });
      comps.forEach(function (x) { ul.appendChild(el('div', { text: x.p + ' / ' + x.c })); });
      compList.appendChild(el('details', {}, [el('summary', { text: 'Какие компоненты нашлись (' + comps.length + ')' }), ul]));
      langSec.classList.remove('hide');
    }).catch(function (e) {
      err1.textContent = (err1.textContent ? err1.textContent + '\n\n' : '') + friendly(e); info.textContent = '';
    }).then(function () { loadBtn.disabled = false; });
  }

  function pool(items, size, fn) {
    var i = 0;
    function worker() { if (i >= items.length) return Promise.resolve(); var it = items[i++]; return fn(it).then(worker); }
    var ws = [];
    for (var k = 0; k < Math.min(size, items.length); k++) ws.push(worker());
    return Promise.all(ws);
  }

  /* выгрузка: компоненты × языки → { res, errs } */
  function exportCore(comps, langs, opts, onTick) {
    var res = [], errs = [];
    return pool(comps, 4, function (x) {
      return translations(x.p, x.c).then(function (trs) {
        return langs.reduce(function (chain, wanted) {
          return chain.then(function () {
            var code = matchLanguage(wanted, trs);
            if (!code) { errs.push([x.c, wanted, 'языка нет в компоненте']); onTick(); return; }
            var src = trs.filter(function (t) { return t.is_source; })[0];
            var srcCode = src ? src.language.code : 'ru';
            return downloadPo(x.p, x.c, code, opts.q).then(function (raw) {
              var r = filterPo(raw, false);
              if (!r.plurals || !opts.wantJson) return r;
              return Promise.all([units(x.p, x.c, code, opts.q + ' AND has:plural'), componentFormat(x.p, x.c)]).then(function (a) {
                var j = pluralJson(a[0], a[1], srcCode, code);
                if (!j.strings) return r;
                res.push({ component: x.c, p: x.p, language: code, src: srcCode, strings: j.strings, words: j.words, text: j.text, ext: 'json' });
                return filterPo(raw, true);
              }, function (e) {
                errs.push([x.c, code, 'плюралки не удалось выгрузить в .json, оставила их в .po: ' + friendly(e).split('\n')[0]]);
                return r;
              });
            }).then(function (r) {
              if (r.strings) res.push({ component: x.c, p: x.p, language: code, src: srcCode, strings: r.strings, words: r.words, text: r.text, ext: 'po' });
            }).catch(function (e) { errs.push([x.c, code, friendly(e)]); }).then(onTick);
          });
        }, Promise.resolve());
      }).catch(function (e) {
        errs.push([x.c, '*', friendly(e)]);
        langs.forEach(onTick);
      });
    }).then(function () { return { res: res, errs: errs }; });
  }

  function runExport() {
    err2.textContent = '';
    var langs = Array.prototype.map.call(langsBox.querySelectorAll('input:checked'), function (i) { return i.value; });
    if (!langs.length) { err2.textContent = 'Отметь хотя бы один язык'; return; }
    sset('wlx_langs', JSON.stringify(langs));
    var total = comps.length * langs.length, done = 0;
    function tick() { done++; barFill.style.width = Math.round(100 * done / total) + '%'; progText.textContent = 'Скачиваю… ' + done + ' из ' + total; }
    goBtn.disabled = true; resSec.classList.remove('hide'); results.textContent = '';
    barFill.style.width = '0%'; progText.textContent = 'Скачиваю… 0 из ' + total;
    exportCore(comps, langs, { q: fuzzy.checked ? QUERY_ALL : QUERY_EMPTY, wantJson: pluralsJson.checked }, tick).then(function (r) {
      goBtn.disabled = false;
      progText.textContent = 'Готово!';
      barFill.style.width = '100%';
      showResults(r.res, r.errs);
    });
  }


  function today() { return new Date().toISOString().slice(0, 10); }
  var ENGLISH_DIR = 'Английский ШТАТ';
  function isEnglish(code) { return baseLang(code) === 'en'; }
  var PLURAL_MARK = '_plural form';
  function poName(r) { return fileKey(r.component) + '_' + r.language + (r.ext === 'json' ? PLURAL_MARK + '.json' : '.po'); }
  function archivePath(r, layout, englishApart) {
    var folder = englishApart && isEnglish(r.language) ? ENGLISH_DIR
      : layout === 'language' ? langName(r.language)
      : layout === 'flat' ? ''
      : fileKey(r.component);
    return (folder ? folder + '/' : '') + poName(r);
  }
  function showResults(res, errs) {
    res.sort(function (a, b) { return (a.language + a.component).localeCompare(b.language + b.component); });
    results.textContent = '';
    if (!res.length) results.appendChild(el('p', { text: 'Непереведённых строк нет — всё переведено 🎉' }));
    else {
      var by = {};
      res.forEach(function (r) {
        var a = by[r.language] = by[r.language] || { files: 0, strings: 0, words: 0 };
        a.files++; a.strings += r.strings; a.words += r.words;
      });
      var t = el('table', {}, [el('tr', {}, [
        el('th', { text: 'Язык' }), el('th', { class: 'n', text: 'Файлов' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' }), el('th')
      ])]);
      Object.keys(by).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); }).forEach(function (lang) {
        var a = by[lang];
        t.appendChild(el('tr', {}, [
          el('td', { title: lang }, [langLabel(lang)]), el('td', { class: 'n', text: String(a.files) }),
          el('td', { class: 'n', text: String(a.strings) }), el('td', { class: 'n', text: String(a.words) }),
          el('td', { class: 'n' }, [el('button', { class: 'b g s', text: 'Скачать .zip', onclick: function () {
            saveBlob(makeZip(res.filter(function (r) { return r.language === lang; })
              .map(function (r) { return { name: poName(r), text: r.text }; })), 'weblate_' + lang + '_' + today() + '.zip');
          } })])
        ]));
      });
      var layoutHint = el('span', { class: 'muted' });
      function updateHint() {
        var l = currentLayout();
        layoutHint.textContent = (l === 'language' ? 'папки по языкам' : l === 'flat' ? 'все файлы в одной папке' : 'папки по компонентам') +
          (englishApart.checked ? ', английский — в «' + ENGLISH_DIR + '»' : '') + ' + summary.csv (раскладку можно поменять выше)';
      }
      updateHint();
      layoutBox.addEventListener('change', updateHint);
      englishApart.addEventListener('change', updateHint);
      results.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'b', text: '⬇ Скачать всё одним архивом', onclick: function () {
          var layout = currentLayout(), eng = englishApart.checked;
          var files = res.map(function (r) { return { name: archivePath(r, layout, eng), text: r.text }; });
          files.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
          var csv = '﻿компонент;язык;код;формат;строк;слов\n' + res.map(function (r) {
            return [r.component, langName(r.language), r.language, r.ext || 'po', r.strings, r.words].join(';');
          }).join('\n') + '\n';
          files.push({ name: 'summary.csv', text: csv });
          saveBlob(makeZip(files), 'weblate_all_' + today() + '.zip');
        } }),
        layoutHint
      ]));
      results.appendChild(el('p', { class: 'muted', text: 'Или отдельный архив на язык:' }));
      results.appendChild(t);
      var dt = el('table', {}, [el('tr', {}, [el('th', { text: 'Компонент' }), el('th', { text: 'Язык' }),
        el('th', { class: 'n', text: 'Строк' }), el('th', { class: 'n', text: 'Слов' })])]);
      res.forEach(function (r) {
        dt.appendChild(el('tr', {}, [el('td', { text: r.component + (r.ext === 'json' ? ' · плюралки .json' : '') }), el('td', { title: r.language }, [langLabel(r.language)]),
          el('td', { class: 'n', text: String(r.strings) }), el('td', { class: 'n', text: String(r.words) })]));
      });
      results.appendChild(el('details', {}, [el('summary', { text: 'По компонентам' }), dt]));
    }
    if (errs.length) {
      var et = el('table');
      errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
      results.appendChild(el('details', { open: '' }, [el('summary', { text: 'Проблемы: ' + errs.length, class: 'red' }), et]));
    }
    if (HAS_EXT) renderSmartcat(res);
  }

  /* ----- шаг «Отправить в Smartcat» после выгрузки ----- */
  function scProjects() { try { return JSON.parse(sget('wlx_sc_projects') || '[]'); } catch (e) { return []; } }
  function saveScProjects(list) {
    list = list.slice(0, 40);
    sset('wlx_sc_projects', JSON.stringify(list));
    if (HAS_EXT) scCall('sc-list-set', { list: list }).catch(function () {});
  }
  /* при открытии: объединить список со страницы и копию из расширения */
  function syncScProjects() {
    if (!HAS_EXT) return Promise.resolve();
    return scCall('sc-list-get').then(function (ext) {
      var local = scProjects(), keys = {};
      local.forEach(function (x) { keys[x.key || x.id] = 1; });
      (ext || []).forEach(function (e) {
        local.forEach(function (x) { if ((x.key || x.id) === (e.key || e.id) && e.uploaded && !x.uploaded) x.uploaded = e.uploaded; });
      });
      var merged = local.concat((ext || []).filter(function (x) { return !keys[x.key || x.id]; }));
      merged.sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
      saveScProjects(merged);
    }, function () {});
  }
  function renderSmartcat(res, container) {
    var po = res.filter(function (r) { return r.ext !== 'json'; });
    if (!po.length) return;
    var box = el('div', { class: 'track' }, [el('h2', { text: '4. Отправить в Smartcat' })]);
    (container || results).appendChild(box);
    return loadScConfig().then(function (c) {
      if (!c || !c.accountId || !c.hasKey) {
        box.appendChild(el('p', { class: 'muted', text: 'Можно отправить эти строки в Smartcat одной кнопкой — подключи Smartcat в ⚙ вверху окна.' }));
        return;
      }
      var map = scLangMap(c.langMap);
      /* отдельный файл на каждый компонент × язык — со своими непереведёнными строками,
         имя как при скачивании из Weblate: global_site-wb-android-hy.po */
      var langs = [];
      var files = po.map(function (r) {
        if (langs.indexOf(r.language) < 0) langs.push(r.language);
        var key = r.p + '-' + fileKey(r.component) + '-' + r.language;
        return { name: key + '.po', key: key, p: r.p, c: r.component, lang: r.language, text: r.text, strings: r.strings, src: r.src };
      }).filter(function (f) { return f.strings; });
      var jsonCount = res.length - po.length;
      /* проекты по платформе: 290926_android, 290926_ios (дата отправки в начале) */
      function platform(f) { return scPlatform(f.p, f.c); }
      var split = el('input', { type: 'checkbox' }); split.checked = sget('wlx_sc_split') !== '0';
      var targetName = '';
      var groupsBox = el('div');
      var groups = [];
      function buildGroups() {
        sset('wlx_sc_split', split.checked ? '1' : '0');
        var by = {};
        files.forEach(function (f) { var g = split.checked ? platform(f) : 'all'; (by[g] = by[g] || []).push(f); });
        groups = Object.keys(by).sort().map(function (g) {
          var one = by[g].every(function (f) { return f.c === by[g][0].c; });
          var name = ddmmyy() + (g === 'all' ? '_' + (one ? fileKey(by[g][0].c) : 'weblate') : '_' + g);
          return { files: by[g], input: el('input', { type: 'text', value: name }), note: el('span', { class: 'muted' }) };
        });
        groupsBox.textContent = '';
        groups.forEach(function (g) {
          var strings = g.files.reduce(function (a, f) { return a + f.strings; }, 0);
          var comps = g.files.map(function (f) { return f.c; }).filter(function (x, i, a) { return a.indexOf(x) === i; });
          groupsBox.appendChild(el('div', { class: 'scgroup' }, [
            el('label', { class: 'muted blk' }, [c.project ? 'Папка в проекте «' + (targetName || c.project) + '»' : 'Проект в Smartcat', g.input]),
            el('div', { class: 'muted', text: g.files.length + ' файл(ов) — ' + comps.length + ' компонент(ов) × языки, ' + strings + ' строк: ' + comps.join(', ') }),
            g.note
          ]));
          checkName(g);
          g.input.addEventListener('change', function () { checkName(g); });
        });
      }
      function checkName(g) {
        g.note.className = 'muted'; g.note.textContent = '';
        if (c.project) return;
        scCall('sc-find', { name: g.input.value.trim() }).then(function (list) {
          if (list && list.length) { g.note.className = 'red'; g.note.textContent = 'В Smartcat уже есть проект «' + g.input.value.trim() + '» — будет создан ещё один с тем же именем. Можно поменять название.'; }
        }, function () {});
      }
      if (c.project) scCall('sc-resolve-project', { ref: c.project }).then(function (pr) {
        targetName = pr.name;
        var pl = projectLangs(pr);
        if (pl.missing.length) box.insertBefore(el('p', { class: 'red', text: 'В проекте «' + pr.name + '» нет: ' + pl.missing.map(langName).join(', ') +
          ' — эти языки не отправлю (в проекте: ' + pl.all.join(', ') + ').' }), groupsBox);
        groupsBox.querySelectorAll('label').forEach(function (l) { if (l.firstChild && l.firstChild.nodeType === 3) l.firstChild.textContent = 'Папка в проекте «' + pr.name + '»'; });
      }, function (e) { msg.className = 'red'; msg.textContent = '✗ Проект в Smartcat: ' + e.message; });
      box.appendChild(el('label', { class: 'muted blk' }, [split, c.project ? ' отдельная папка для android и ios' : ' отдельный проект для android и ios']));
      box.appendChild(groupsBox);
      split.addEventListener('change', buildGroups);
      buildGroups();
      box.appendChild(el('p', { class: 'muted', text: 'Языки: ' + langs.map(function (l) { return langName(l) + ' → ' + map(l); }).join(', ') + '.' +
        (jsonCount ? ' Плюралки (.json) в Smartcat не отправляются.' : '') }));
      var msg = el('div', { class: 'muted' });
      /* английский — ещё и в отдельные проекты по платформе, без папки */
      var enTargets = { android: c.enAndroid || SC_EN_DEFAULTS.android, ios: c.enIos || SC_EN_DEFAULTS.ios };
      var enFiles = files.filter(function (f) { return isEnglish(f.lang) && enTargets[scPlatform(f.p, f.c)]; });
      if (enFiles.length) box.appendChild(el('p', { class: 'muted', text: 'Английский (' + enFiles.length + ' файл.) также уйдёт без папки в проекты для английского (' +
        enFiles.map(function (f) { return scPlatform(f.p, f.c); }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') +
        ') с именем ' + ddmmyy() + '_' + enFiles[0].name + ' — обратно оттуда не забираю.' }));
      function sendEnglish() {
        var by = {};
        enFiles.forEach(function (f) { var pl = scPlatform(f.p, f.c); (by[pl] = by[pl] || []).push(f); });
        return Object.keys(by).reduce(function (chain, pl) {
          return chain.then(function (acc) {
            return scCall('sc-resolve-project', { ref: enTargets[pl] }).then(function (pr) {
              var pls = (pr.targetLanguages || []).map(String);
              var code = pls.filter(function (x) { return x.toLowerCase() === map('en').toLowerCase(); })[0] ||
                pls.filter(function (x) { return baseLang(x) === 'en'; })[0] || (pls.length ? null : map('en'));
              if (!code) throw new Error('в проекте «' + pr.name + '» нет английского (в нём: ' + pls.join(', ') + ')');
              return scCall('sc-add-docs', { projectId: pr.id, files: by[pl].map(function (f) {
                return { name: ddmmyy() + '_' + f.name, text: f.text, targetLanguages: [code] };
              }) }).then(function (r) { acc.push({ ok: true, text: pl + ' → ' + pr.name + ' (' + r.documents.length + ' док.)' }); return acc; });
            }).catch(function (e) { acc.push({ ok: false, text: pl + ': ' + e.message }); return acc; });
          });
        }, Promise.resolve([]));
      }
      function createOne(g, extra) {
        var model = Object.assign({
          name: g.input.value.trim() || ddmmyy() + '_weblate',
          description: 'Создано расширением Weblate. Компоненты: ' + g.files.map(function (f) { return f.p + '/' + f.c; })
            .filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', '),
          sourceLanguage: map(g.files[0].src || 'ru'),
          targetLanguages: langs.map(map),
          assignToVendor: false, useMT: true, pretranslate: true, useTranslationMemory: true,
          autoPropagateRepetitions: false, isForTesting: false, workflowStages: ['translation']
        }, extra);
        return scCall('sc-create', { model: model, files: [] }).then(function (proj) {
          return addToProject(g, { id: proj.id, name: proj.name || model.name, targetLanguages: proj.targetLanguages || model.targetLanguages }, '');
        });
      }
      /* добавить в существующий проект: папка = название группы */
      /* языки выгрузки → языки проекта: точное совпадение, иначе по основному языку (en ↔ en-US); остальных в проекте нет */
      function projectLangs(pr) {
        var pl = (pr.targetLanguages || []).map(String), out = {}, missing = [];
        langs.forEach(function (l) {
          var want = map(l), hit = pl.filter(function (x) { return x.toLowerCase() === want.toLowerCase(); })[0] ||
            pl.filter(function (x) { return baseLang(x) === baseLang(want); })[0];
          if (hit || !pl.length) out[l] = hit || want; else missing.push(l);
        });
        return { codes: out, missing: missing, all: pl };
      }
      function addToProject(g, pr, folderOverride) {
        var folder = folderOverride != null ? folderOverride : (g.input.value.trim() || ddmmyy() + '_weblate');
        var pl = projectLangs(pr);
        var send = g.files.filter(function (f) { return pl.codes[f.lang]; });
        if (!send.length) return Promise.reject(new Error('ни одного выбранного языка нет в проекте «' + pr.name + '» (в нём: ' + pl.all.join(', ') + ')'));
        return scCall('sc-add-docs', { projectId: pr.id,
          files: send.map(function (f) { return { name: (folder ? folder + '/' : '') + f.name, text: f.text, targetLanguages: [pl.codes[f.lang]] }; }) }).then(function (r) {
          if (!r.documents.length) throw new Error('Smartcat не показал новых документов в проекте — проверь проект вручную');
          var lmap = {}, byKey = {}, docs = {}, lost = [];
          send.forEach(function (f) { byKey[f.key] = f; lmap[pl.codes[f.lang].toLowerCase()] = f.lang; });
          r.documents.forEach(function (d) {
            var f = byKey[scDocKey(d.name)] || byKey[scDocKey(d.fullPath)];
            if (f) docs[d.id] = { p: f.p, c: f.c, lang: f.lang }; else lost.push(d.name + ' (' + d.targetLanguage + ')');
          });
          if (pl.missing.length) lost.unshift('языков нет в проекте, не отправлены: ' + pl.missing.map(langName).join(', '));
          var key = pr.id + '#' + (folder || 'root');
          var list = scProjects().filter(function (x) { return (x.key || x.id) !== key; });
          list.unshift({ key: key, id: pr.id, name: pr.name + (folder ? ' / ' + folder : ''), created: new Date().toISOString(), docs: docs, files: {}, langs: lmap });
          saveScProjects(list);
          return { id: pr.id, name: pr.name + (folder ? ' / ' + folder : ''), docs: Object.keys(docs).length, lost: lost };
        });
      }
      var btn = el('button', { class: 'b', text: 'Отправить в Smartcat', onclick: function () {
        var extra = {};
        try { extra = c.extra ? JSON.parse(c.extra) : {}; } catch (e) {}
        btn.disabled = true; split.disabled = true; msg.className = 'muted';
        msg.textContent = c.project ? 'Добавляю файлы в проект…' : 'Создаю проекты в Smartcat…';
        var made = [], chain = c.project ? scCall('sc-resolve-project', { ref: c.project }) : Promise.resolve(null);
        groups.forEach(function (g) {
          chain = chain.then(function (pr) {
            return (pr ? addToProject(g, pr) : createOne(g, extra)).then(function (res) { made.push(res); g.input.disabled = true; return pr; });
          });
        });
        var enRes = [];
        if (enFiles.length) chain = chain.then(function () { return sendEnglish().then(function (r) { enRes = r; }); });
        chain.then(function () {
          msg.className = 'ok';
        }, function (e) {
          btn.disabled = false; msg.className = 'red';
          msg.appendChild(el('div', { text: '✗ ' + e.message }));
        }).then(function () {
          renderScImport();
          if (!made.length) return;
          if (msg.className !== 'red') msg.textContent = '';
          msg.insertBefore(el('div', {}, [document.createTextNode(c.project ? '✓ Файлы добавлены: ' : '✓ Созданы проекты: ')].concat(made.map(function (p, i) {
            return el('span', {}, [i ? ', ' : '', el('a', { href: c.base + '/projects/' + p.id, target: '_blank', text: p.name }),
              p.docs != null ? ' (' + p.docs + ' док.)' : '']);
          })).concat([document.createTextNode('. Когда Smartcat переведёт, придёт уведомление Chrome 🔔 — тогда внизу вкладки «🤖 Smartcat» нажми «⬆ Загрузить в Weblate».')])), msg.firstChild);
          scCall('sc-watch-now').catch(function () {});
          enRes.forEach(function (x) {
            msg.appendChild(el('div', { class: x.ok ? 'ok' : 'red', text: (x.ok ? '✓ Английский: ' : '✗ Английский: ') + x.text }));
          });
          made.forEach(function (p) {
            (p.lost || []).forEach(function (t) {
              msg.appendChild(el('div', { class: 'red', text: /^языков нет/.test(t) ? p.name + ': ' + t : 'Не поняла, к какому компоненту/языку относится: ' + t }));
            });
          });
        });
      } });
      box.appendChild(el('div', { class: 'row' }, [btn]));
      box.appendChild(msg);
      return btn;
    });
  }

  /* ----- import logic ----- */
  var uploads = [];
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function (e) { addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', function () { addFiles(fileInput.files); fileInput.value = ''; });

  function savedComps() { try { return JSON.parse(sget('wlx_comps') || '[]'); } catch (e) { return []; } }
  function defaultProject() {
    var sc = savedComps(), l = parseLinks(location.pathname);
    return sc.length ? sc[0].p : l.length ? l[0].p : 'global_site';
  }
  function withTranslations(p, c) {
    return projectComponents(p).catch(function () {}).then(function () { return translations(p, c); })
      .then(function (trs) { return { p: p, c: c, trs: trs }; }, function () { return null; });
  }
  function byRuName(folder, trs) {
    var f = (folder || '').trim().toLowerCase();
    if (!f) return null;
    var hit = trs.filter(function (t) { return langName(t.language.code).toLowerCase() === f; });
    return hit.length === 1 ? hit[0].language.code : null;
  }
  /* имя файла без языка → компонент: сначала среди компонентов прошлой выгрузки */
  function resolveComponent(key) {
    var sc = savedComps(), last = function (c) { return c.split('/').pop(); };
    var cands = sc.filter(function (x) { return fileKey(x.c) === key || x.c === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c) === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c).slice(-(key.length + 1)) === '-' + key; });
    if (cands.length > 1) return Promise.resolve(null);
    var pick = cands[0] || { p: defaultProject(), c: key.split('__').join('/') };
    return withTranslations(pick.p, pick.c);
  }
  /* из .json с плюралками убираем то, что осталось на русском (не переведено) */
  function stripJson(u) {
    var keys = Object.keys(u.obj);
    if (keys.some(function (k) { return typeof u.obj[k] !== 'string'; })) return Promise.resolve(u);
    return units(u.p, u.c, u.lang, 'has:plural').then(function (list) {
      var src = {};
      list.forEach(function (x) { (x.source || []).forEach(function (s) { src[s] = 1; }); });
      var kept = {}, dropped = 0;
      keys.forEach(function (k) { var v = u.obj[k]; if (!v || src[v]) dropped++; else kept[k] = v; });
      u.filled = Object.keys(kept).length;
      u.text = JSON.stringify(kept, null, 2) + '\n';
      if (!u.filled) u.skip = 'всё ещё на русском — похоже, не переведено, пропущу';
      else if (dropped) u.note = dropped + ' ещё на русском — их не отправлю';
      return u;
    }, function () { u.note = 'не смогла сверить с исходником'; return u; });
  }
  function detect(f) {
    var isJson = /\.json$/i.test(f.name), h = {};
    var u = { name: f.name, text: f.text };
    if (isJson) {
      try { u.obj = JSON.parse(f.text); } catch (e) { u.error = 'файл .json не читается'; return Promise.resolve(u); }
      var vals = Object.keys(u.obj).map(function (k) { return u.obj[k]; });
      u.total = vals.length;
      u.filled = vals.filter(function (v) { return v !== ''; }).length;
    } else {
      var inf = poInfo(f.text);
      h = inf.headers; u.filled = inf.filled; u.total = inf.total;
      if (!inf.filled) u.skip = 'в файле нет переведённых строк — пропущу';
      var lt = /\/projects\/([^\s>"]+)/.exec(h['Language-Team'] || '');
      var segs = lt ? lt[1].split('/').filter(Boolean) : [];
      if (segs.length >= 3) {
        u.p = segs[0]; u.c = segs.slice(1, -1).join('/'); u.lang = segs[segs.length - 1];
        return withTranslations(u.p, u.c).then(function (r) {
          if (!r) u.error = 'компонент «' + u.c + '» не найден';
          return u;
        });
      }
    }
    var parts = f.name.split('/'), base = parts.pop().replace(/\.(po|json)$/i, '').replace(/[ _.-]*plurals?([ _-]*forms?)?$/i, '');
    var suffix = /^(.+)[._]([a-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)$/.exec(base);
    u.c = suffix ? suffix[1] : base;
    var folder = parts.pop() || '';
    if (folder === ENGLISH_DIR) folder = 'en';
    var wanted = h['Language'] || (suffix && suffix[2]) || folder;
    if (!wanted) { u.error = 'не понятно, какой это язык'; return Promise.resolve(u); }
    return resolveComponent(u.c).then(function (r) {
      if (!r) { u.error = 'компонент «' + u.c + '» не найден — переименуй файл в <компонент>_<язык>'; return u; }
      u.p = r.p; u.c = r.c;
      u.lang = matchLanguage(wanted.replace('-', '_'), r.trs) || byRuName(folder, r.trs);
      if (!u.lang) { u.error = 'язык «' + wanted + '» не найден в компоненте'; return u; }
      return isJson ? stripJson(u) : u;
    });
  }
  function addFiles(list) {
    errU.textContent = '';
    var files = Array.prototype.slice.call(list || []);
    Promise.all(files.map(function (file) {
      if (/\.zip$/i.test(file.name)) return file.arrayBuffer().then(readZip);
      if (/\.(po|json)$/i.test(file.name)) return file.text().then(function (t) { return [{ name: file.name, text: t }]; });
      return Promise.resolve([]);
    })).then(function (groups) {
      var all = [].concat.apply([], groups);
      if (!all.length) throw new Error('Не нашла .po файлов');
      return Promise.all(all.map(detect));
    }).then(function (found) {
      found.forEach(function (u) {
        var kind = function (x) { return /\.json$/i.test(x.name) ? 'json' : 'po'; };
        if (!u.error) uploads = uploads.filter(function (x) { return !(x.p === u.p && x.c === u.c && x.lang === u.lang && kind(x) === kind(u)); });
        uploads.push(u);
      });
      renderPreview();
    }).catch(function (e) { errU.textContent = friendly(e); });
  }
  function renderPreview() {
    preview.textContent = ''; upResults.textContent = '';
    if (!uploads.length) { upSec.classList.add('hide'); return; }
    preview.appendChild(el('h2', { text: 'Готово к загрузке' }));
    var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Файл' }), el('th', { text: 'Куда' }),
      el('th', { class: 'n', text: 'С переводом' }), el('th', { text: 'Статус' })])]);
    uploads.forEach(function (u) {
      u.row = el('td', { class: u.error ? 'red' : (u.sent ? 'ok' : 'muted'), text: u.error || u.status || u.skip || (u.note ? 'готов · ' + u.note : 'готов') });
      t.appendChild(el('tr', {}, [
        el('td', { text: u.name }),
        u.lang ? el('td', { title: u.p + '/' + u.c + '/' + u.lang }, [el('div', { text: u.c }), langLabel(u.lang)]) : el('td', { text: '—' }),
        el('td', { class: 'n', text: u.filled + ' из ' + u.total }),
        u.row
      ]));
    });
    preview.appendChild(t);
    preview.appendChild(el('div', { class: 'row' }, [
      el('span', { class: 'muted', text: 'Файлов: ' + uploads.length }),
      el('button', { class: 'b g s', text: 'Очистить список', onclick: function () { uploads = []; renderPreview(); } })
    ]));
    upSec.classList.remove('hide');
  }
  /* ----- «Из Smartcat»: забрать машинный перевод и подготовить к загрузке ----- */
  /* список отправок в Smartcat: на вкладке загрузки — «Забрать переводы» (проверить и загрузить вручную),
     на вкладке Smartcat — «Забрать и загрузить в Weblate» одной кнопкой */
  function renderScList(box, auto) {
    box.textContent = '';
    if (!HAS_EXT) { box.classList.add('hide'); return; }
    var list = scProjects();
    box.classList.remove('hide');
    var findMsg = el('span', { class: 'muted' });
    var findBtn = el('button', { class: 'b g s', text: '🔎 Найти отправки в Smartcat', title: 'Восстановить список по файлам в проекте Smartcat за последние 2 недели',
      onclick: function () { recoverScProjects(findBtn, findMsg); } });
    var pending = list.filter(function (pr) { return !pr.uploaded; });
    var allMsg = el('span', { class: 'muted' });
    var allBtn = el('button', { class: 'b s', text: '⬆ Загрузить всё готовое (' + pending.length + ')',
      title: 'Забрать из Smartcat все ещё не загруженные отправки и загрузить их в Weblate одним разом',
      onclick: function () { uploadAllReady(allBtn, allMsg); } });
    box.appendChild(el('div', { class: 'row' }, [el('h2', { text: 'Отправленное в Smartcat → в Weblate' }), findBtn, findMsg]));
    if (pending.length > 1) box.appendChild(el('div', { class: 'row' }, [allBtn, allMsg]));
    if (!list.length) box.appendChild(el('p', { class: 'muted', text: 'Отправок пока нет. Если они были, но пропали — нажми «Найти отправки в Smartcat».' }));
    scRows = {};
    list.forEach(function (pr) {
      var st = el('span', { class: pr.uploaded ? 'ok' : 'muted',
        text: pr.uploaded ? '✓ загружено в Weblate ' + fmtDate(pr.uploaded) : (scReady[pr.key || pr.id] ? '🔔 перевод в Smartcat готов' : '') });
      var get = el('button', { class: 'b s', text: '⬆ Загрузить в Weblate', title: 'Забрать готовые переводы из Smartcat и загрузить в Weblate («только непереведённые строки»)',
        onclick: function () { fetchSc(pr, st, get, auto); } });
      var zip = el('button', { class: 'b g s', text: '⬇ ZIP', title: 'Скачать готовые переводы из Smartcat архивом (в Weblate ничего не загружается)',
        onclick: function () { zipSc(pr, st, zip); } });
      var del = el('button', { class: 'b g s', text: '×', title: 'Убрать из списка', onclick: function () {
        saveScProjects(scProjects().filter(function (x) { return (x.key || x.id) !== (pr.key || pr.id); })); renderScImport();
      } });
      scRows[pr.key || pr.id] = { st: st, get: get };
      box.appendChild(el('div', { class: 'row' }, [el('b', { text: pr.name }), el('span', { class: 'muted', text: (pr.created || '').slice(0, 10) }), get, zip, del, st]));
    });
  }
  var scRows = {}, scReady = {};
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  /* забрать все незагруженные отправки и загрузить одним разом */
  function uploadAllReady(btn, msg) {
    var list = scProjects().filter(function (pr) { return !pr.uploaded; });
    if (!list.length) { msg.textContent = 'Всё уже загружено'; return; }
    btn.disabled = true; msg.className = 'muted'; msg.textContent = 'Забираю из Smartcat…';
    var keys = [];
    list.reduce(function (chain, pr) {
      return chain.then(function () {
        var r = scRows[pr.key || pr.id];
        keys.push(pr.key || pr.id);
        return fetchSc(pr, r.st, r.get, 'collect');
      });
    }, Promise.resolve()).then(function () {
      var mine = uploads.filter(function (u) { return keys.indexOf(u.scKey) >= 0 && !u.error && !u.skip && !u.sent; });
      if (!mine.length) { msg.className = 'red'; msg.textContent = 'Загружать нечего — у каждой отправки причина написана в строке'; return; }
      msg.className = 'ok'; msg.textContent = '✓ Загружаю ' + mine.length + ' файл(ов) — результат на вкладке «Загрузить обратно»';
      tab('imp');
      runUpload(function (u) { return keys.indexOf(u.scKey) >= 0; });
    }).catch(function (e) { msg.className = 'red'; msg.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  /* скачать готовые переводы отправки архивом: <папка>/<проект>-<компонент>-<язык>.po */
  function zipSc(pr, st, btn) {
    btn.disabled = true; st.className = 'muted'; st.textContent = 'Проверяю проект…';
    var folder = String(pr.name || '').split(' / ').pop() || ddmmyy();
    scCall('sc-project', { id: pr.id }).then(function (proj) {
      var docs = (proj.documents || []).filter(function (d) { return !pr.docs || pr.docs[d.id]; });
      var ready = docs.filter(function (d) {
        return (!d.documentDisassemblingStatus || d.documentDisassemblingStatus === 'success') && d.pretranslateCompleted !== false;
      });
      if (!ready.length) { st.textContent = docs.length ? 'Smartcat ещё переводит (готово 0 из ' + docs.length + ') — попробуй позже' : 'В проекте больше нет этих документов'; return; }
      var files = [], n = 0;
      st.textContent = 'Скачиваю ' + ready.length + ' из ' + docs.length + '…';
      return pool(ready, 3, function (d) {
        var info = pr.docs && pr.docs[d.id];
        var name = info ? info.p + '-' + fileKey(info.c) + '-' + info.lang : scDocKey(d.name) + '-' + d.targetLanguage;
        return scCall('sc-export', { documentId: d.id }).then(function (r) {
          files.push({ name: folder + '/' + name + '.po', text: r.text });
          st.textContent = 'Скачано ' + (++n) + ' из ' + ready.length + '…';
        }, function (e) { files.push({ name: folder + '/ОШИБКА_' + name + '.txt', text: String(e.message || e) }); });
      }).then(function () {
        files.sort(function (a, b) { return a.name.localeCompare(b.name); });
        saveBlob(makeZip(files), 'smartcat_' + folder + '.zip');
        st.className = 'ok';
        st.textContent = '✓ Скачан архив: ' + n + ' файл(ов)' + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '');
      });
    }).catch(function (e) { st.className = 'red'; st.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  /* восстановить отправки по документам проекта: «global_site-wb-android-hy» → компонент + язык, дата загрузки → папка */
  function recoverScProjects(btn, msg) {
    btn.disabled = true; msg.className = 'muted'; msg.textContent = 'Смотрю проект в Smartcat…';
    loadScConfig().then(function (c) {
      if (!c || !c.accountId || !c.hasKey) throw new Error('Smartcat не подключён (⚙)');
      return scCall('sc-resolve-project', { ref: c.project || SC_PROJECT_DEFAULT }).then(function (pr) {
        return scCall('sc-project', { id: pr.id }).then(function (full) { return { pr: pr, docs: full.documents || [] }; });
      });
    }).then(function (x) {
      var known = {}, projects = ['global_site'];
      savedComps().concat(parseLinks(sget('wlx_mt_links') || SC_DEFAULT_LINKS)).forEach(function (l) { if (projects.indexOf(l.p) < 0) projects.push(l.p); });
      scProjects().forEach(function (e) { Object.keys(e.docs || {}).forEach(function (id) { known[id] = 1; }); });
      var since = Date.now() - 14 * 864e5, groups = {};
      x.docs.forEach(function (d) {
        if (known[d.id]) return;
        var t = Date.parse(d.creationDate || d.created || '');
        if (t && t < since) return;
        var name = scDocKey(d.name).replace(/\s*\(\d+\)$/, '');
        var m = /^(.+)-([a-z]{2,3}(?:_[A-Za-z0-9]+)?)$/.exec(name);
        if (!m) return;
        var proj = projects.filter(function (p) { return m[1].indexOf(p + '-') === 0; })[0];
        if (!proj) return;
        var comp = m[1].slice(proj.length + 1).split('__').join('/');
        var day = t ? new Date(t) : new Date();
        var dd = ('0' + day.getDate()).slice(-2) + ('0' + (day.getMonth() + 1)).slice(-2) + String(day.getFullYear()).slice(-2);
        var folder = dd + '_' + scPlatform(proj, comp);
        var g = groups[folder] = groups[folder] || { docs: {}, t: t || Date.now() };
        g.docs[d.id] = { p: proj, c: comp, lang: m[2] };
      });
      var names = Object.keys(groups);
      if (!names.length) { msg.textContent = 'Новых отправок за 2 недели не нашла'; return; }
      var list = scProjects();
      names.forEach(function (folder) {
        var key = x.pr.id + '#' + folder, ex = list.filter(function (e) { return e.key === key; })[0];
        if (ex) { Object.keys(groups[folder].docs).forEach(function (id) { ex.docs[id] = groups[folder].docs[id]; }); return; }
        list.push({ key: key, id: x.pr.id, name: x.pr.name + ' / ' + folder, created: new Date(groups[folder].t).toISOString(), docs: groups[folder].docs, files: {}, langs: {} });
      });
      list.sort(function (a, b) { return String(b.created).localeCompare(String(a.created)); });
      saveScProjects(list);
      renderScImport();
    }).catch(function (e) { msg.className = 'red'; msg.textContent = '✗ ' + e.message; btn.disabled = false; });
  }
  function renderScImport() { renderScList(scBack, true); }
  function scDocKey(name) { return String(name || '').split('/').pop().replace(/\.po$/i, ''); }
  function fetchSc(pr, st, btn, auto) {
    var prKey = pr.key || pr.id;
    btn.disabled = true; st.className = 'muted'; st.textContent = 'Проверяю проект…';
    return scCall('sc-project', { id: pr.id }).then(function (proj) {
      var docs = (proj.documents || []).filter(function (d) { return !pr.docs || pr.docs[d.id]; });
      if (pr.docs && !docs.length) { st.className = 'red'; st.textContent = 'В проекте больше нет этих документов'; return; }
      var ready = docs.filter(function (d) {
        return (!d.documentDisassemblingStatus || d.documentDisassemblingStatus === 'success') && d.pretranslateCompleted !== false;
      });
      if (!ready.length) { st.textContent = 'Smartcat ещё переводит (готово 0 из ' + docs.length + ') — попробуй позже'; return; }
      var n = 0;
      st.textContent = 'Скачиваю ' + ready.length + ' из ' + docs.length + '…';
      return pool(ready, 3, function (d) {
        var key = scDocKey(d.name), comp = pr.docs ? pr.docs[d.id] : pr.files[key];
        var lang = (pr.docs && pr.docs[d.id].lang) || pr.langs[String(d.targetLanguage || '').toLowerCase()] ||
          Object.keys(pr.langs).map(function (k) { return pr.langs[k]; }).filter(function (l) { return baseLang(l) === baseLang(d.targetLanguage || ''); })[0];
        var u = { name: 'Smartcat/' + key + '_' + (lang || d.targetLanguage) + '.po', text: '', filled: 0, total: 0, fromSc: true, scKey: prKey };
        if (!comp || !lang) { u.error = 'не понимаю, куда это: документ «' + d.name + '», язык ' + d.targetLanguage; uploads.push(u); return Promise.resolve(); }
        u.p = comp.p; u.c = comp.c; u.lang = lang;
        return scCall('sc-export', { documentId: d.id }).then(function (r) {
          var inf = poInfo(r.text);
          u.text = r.text; u.filled = inf.withText; u.total = inf.total;
          if (!inf.withText) u.skip = 'Smartcat вернул пустой перевод — машинный перевод в документе ещё не появился';
          return withTranslations(u.p, u.c).then(function (w) {
            if (!w) { u.error = 'компонент «' + u.c + '» не найден в Weblate'; return; }
            var code = matchLanguage(u.lang, w.trs);           /* в старых именах бывает «uz» вместо «uz_Latn» */
            if (code) u.lang = code; else u.error = 'языка ' + u.lang + ' нет в компоненте';
          });
        }, function (e) { u.error = e.message; }).then(function () {
          uploads = uploads.filter(function (x) { return !(x.fromSc && x.p === u.p && x.c === u.c && x.lang === u.lang); });
          if (u.p && u.c) u.name = 'Smartcat/' + fileKey(u.c) + '_' + u.lang + '.po';
          uploads.push(u);
          st.textContent = 'Скачано ' + (++n) + ' из ' + ready.length + '…';
        });
      }).then(function () {
        renderPreview();
        st.className = 'ok';
        if (auto === 'collect') {
          st.textContent = '✓ Забрала ' + n + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '');
          return;
        }
        if (auto) {
          var ours = uploads.filter(function (u) { return u.scKey === prKey; });
          var mine = ours.filter(function (u) { return !u.error && !u.skip && !u.sent; }).length;
          if (mine) {
            st.textContent = '✓ Забрала ' + n + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '') +
              ', загружаю ' + mine + ' в Weblate («только непереведённые») — результат на вкладке «Загрузить обратно»';
            tab('imp'); runUpload(function (u) { return u.scKey === prKey; });
            return;
          }
          /* загружать нечего — показать почему */
          var why = {};
          ours.forEach(function (u) { var r = u.sent ? 'уже загружено' : (u.error || u.skip || '?'); why[r] = (why[r] || 0) + 1; });
          st.className = 'red';
          st.textContent = 'Забрала ' + n + ', но загружать нечего: ' + Object.keys(why).map(function (r) { return why[r] + ' × ' + r; }).join('; ') +
            '. Подробности — на вкладке «Загрузить обратно».';
          return;
        }
        st.textContent = '✓ Готово к загрузке: ' + n + (ready.length < docs.length ? ' (ещё не готово в Smartcat: ' + (docs.length - ready.length) + ')' : '') +
          '. Машинный перевод загрузится с «Изменять только непереведённые строки» — проверь список ниже и нажми «Загрузить в Weblate».';
      });
    }).catch(function (e) { st.className = 'red'; st.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  renderScImport();
  syncScProjects().then(function () {
    return HAS_EXT ? scCall('sc-ready-get').then(function (r) { scReady = r || {}; }, function () {}) : null;
  }).then(renderScImport);

  function setRow(u, cls, text) { u.status = text; u.row.className = cls; u.row.textContent = text; }
  /* отправки Smartcat, у которых всё загрузилось, помечаем «загружено» */
  function markScUploaded(todo) {
    var keys = {};
    todo.forEach(function (u) { if (u.fromSc && u.scKey) keys[u.scKey] = 1; });
    var now = new Date().toISOString(), changed = false;
    var list = scProjects().map(function (pr) {
      var k = pr.key || pr.id;
      if (!keys[k]) return pr;
      var items = uploads.filter(function (u) { return u.scKey === k && !u.error && !u.skip; });
      if (items.length && items.every(function (u) { return u.sent; })) { pr.uploaded = now; changed = true; }
      return pr;
    });
    if (changed) { saveScProjects(list); renderScImport(); }
  }
  /* отчёт после загрузки — можно скопировать в чат */
  function uploadReport(todo, opts, took) {
    var d = new Date(), date = ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + '.' + d.getFullYear() +
      ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    var sent = todo.filter(function (u) { return u.sent; }), failed = todo.filter(function (u) { return !u.sent; });
    var lines = sum(sent, 'accepted');
    function sum(a, f) { return a.reduce(function (x, u) { return x + (Number(u[f]) || 0); }, 0); }
    var label = function (sel) { return sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : ''; };
    var anySc = todo.some(function (u) { return u.fromSc; }), anyVendor = todo.some(function (u) { return !u.fromSc; });
    var out = ['Загрузка в Weblate · ' + date + ' · ' + took,
      'Файлов: ' + sent.length + (failed.length ? ' (с ошибкой: ' + failed.length + ')' : '') + ' · строк принято: ' + lines.toLocaleString('ru-RU')];
    if (anySc) out.push('Машинный перевод Smartcat: «Добавить как перевод», «Изменять только непереведённые строки»');
    if (anyVendor) out.push('Файлы подрядчиков: «' + label(optMethod) + '», «' + label(optConf) + '»');
    var by = {};
    sent.forEach(function (u) { (by[u.p + '/' + u.c] = by[u.p + '/' + u.c] || []).push(u); });
    Object.keys(by).sort().forEach(function (k) {
      out.push(k.split('/').slice(1).join('/') + ': ' + by[k].sort(function (a, b) { return langName(a.lang).localeCompare(langName(b.lang), 'ru'); })
        .map(function (u) { return langName(u.lang) + ' ' + (u.accepted != null ? u.accepted : '✓'); }).join(', '));
    });
    failed.forEach(function (u) { out.push('✗ ' + (u.c || u.name) + ' · ' + (u.lang ? langName(u.lang) : '') + ': ' + (u.upError || 'не загружено')); });
    var text = out.join('\n');
    var pre = el('pre', { class: 'report', text: text });
    var note = el('span', { class: 'muted' });
    var copy = el('button', { class: 'b g s', text: '📋 Скопировать отчёт', onclick: function () {
      var done = function () { note.textContent = 'Скопировано ✓'; };
      var fallback = function () {
        var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); done(); } catch (e) { note.textContent = 'Не получилось — выдели текст и скопируй вручную'; }
        t.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    } });
    return el('div', { class: 'blk' }, [el('h2', { text: 'Отчёт' }), pre, el('div', { class: 'row' }, [copy, note])]);
  }
  function runUpload(only) {
    var todo = uploads.filter(function (u) { return !u.error && !u.skip && !u.sent && (typeof only !== 'function' || only(u)); });
    if (!todo.length) {
      var sentAll = uploads.length && uploads.every(function (u) { return u.sent || u.error || u.skip; }) && uploads.some(function (u) { return u.sent; });
      upResults.textContent = sentAll ? '✓ Всё из списка уже загружено — повторно загружать не нужно. Можно нажать «Очистить список».'
        : 'Нечего загружать: добавь файлы или посмотри причины в колонке «Статус»';
      return;
    }
    var opts = { method: optMethod.value, fuzzy: optFuzzy.value, conflicts: optConf.value };
    /* машинный перевод из Smartcat — всегда «добавить как перевод» + «только непереведённые строки»;
       выбор в «3. Как загружать» — для файлов подрядчиков, его и запоминаем */
    /* машинный перевод Smartcat приходит как «требует правки» — импортируем как переведённое, как при ручной загрузке */
    var SC_OPTS = { method: 'translate', fuzzy: 'approve', conflicts: '' };
    if (todo.some(function (u) { return !u.fromSc; })) { sset('wlx_m', opts.method); sset('wlx_f', opts.fuzzy); sset('wlx_c', opts.conflicts); }
    upBtn.disabled = true;
    var ok = 0, bad = 0, t0 = Date.now();
    function secs(from) { var s = Math.round((Date.now() - from) / 1000); return s < 60 ? s + ' с' : Math.floor(s / 60) + ' мин ' + (s % 60) + ' с'; }
    /* Weblate обрабатывает файлы одного компонента по очереди, поэтому показываем, что процесс идёт */
    function progress() {
      upResults.textContent = 'Загружаю: готово ' + (ok + bad) + ' из ' + todo.length + ' · ' + secs(t0) +
        '. Weblate обрабатывает файлы одного компонента по очереди — не закрывай окно, пока всё не станет «✓ принято».';
    }
    todo.forEach(function (u) { setRow(u, 'muted', 'в очереди'); });
    progress();
    var tick = setInterval(progress, 1000);
    csrfToken().then(function (token) {
      return pool(todo, 3, function (u) {
        var started = Date.now();
        setRow(u, 'muted', 'загружаю…');
        var rowTimer = setInterval(function () { if (!u.sent) setRow(u, 'muted', 'загружаю… ' + secs(started)); }, 1000);
        return uploadPo(u, u.fromSc ? SC_OPTS : opts, token).then(function (r) {
          clearInterval(rowTimer);
          u.sent = true; ok++;
          u.accepted = r.accepted; u.upTotal = r.total; u.upSkipped = r.skipped || 0;
          setRow(u, 'ok', r.viaForm ? '✓ отправлено (проверь в Weblate)'
            : '✓ принято ' + (r.accepted != null ? r.accepted : '?') + ' из ' + (r.total != null ? r.total : '?') +
              (r.skipped ? ', пропущено ' + r.skipped : '') + (r.not_found ? ', не найдено ' + r.not_found : ''));
        }).catch(function (e) {
          clearInterval(rowTimer);
          bad++;
          u.upError = friendly(e).split('\n')[0];
          setRow(u, 'red', u.upError);
          u.row.title = String(e.message || e);
        });
      });
    }).then(function () {
      clearInterval(tick);
      upResults.textContent = 'Готово: загружено ' + ok + (bad ? ', с ошибкой ' + bad + ' (наведи на ошибку, чтобы увидеть подробности)' : '') + ' · ' + secs(t0);
      markScUploaded(todo);
      upResults.appendChild(uploadReport(todo, opts, secs(t0)));
    }).catch(function (e) {
      clearInterval(tick);
      upResults.textContent = friendly(e);
    }).then(function () { upBtn.disabled = false; });
  }

  document.body.appendChild(host);
  window.__wlExport = { show: show, openTab: function (t) {
    show(); tab(t);
    if (HAS_EXT) syncScProjects().then(function () { return scCall('sc-ready-get'); }).then(function (r) { scReady = r || {}; renderScImport(); }, function () {});
  } };
})();
