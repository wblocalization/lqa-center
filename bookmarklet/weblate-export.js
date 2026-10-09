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
    /* без кэша браузера: Weblate отвечает «не изменилось» (304) по дате последней правки перевода,
       а новые исходные строки её не двигают — и браузер отдавал старый файл без новых строк */
    return fetch(url, { credentials: 'same-origin', cache: 'no-store', headers: { 'Accept': asText ? '*/*' : 'application/json' } })
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
  /* Weblate может ответить 200, но не файлом (страница входа, техработы и т. п.) — тогда это ошибка, а не «всё переведено» */
  function checkPo(t) {
    if (/^\s*(#|msgid|msgctxt)/m.test(t) && /msgid\s+"/.test(t)) return t;
    var title = (/<title[^>]*>([^<]*)/i.exec(t) || [])[1];
    throw new Error('Weblate прислал не .po файл' + (title ? ': «' + title.trim() + '»' : t.trim() ? ': ' + t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 150) : ' (пустой ответ)'));
  }
  function downloadPo(p, c, lang, q, viaUi) {
    var qs = '?format=po&q=' + encodeURIComponent(q) + '&_=' + Date.now();   // _= — чтобы ни один кэш не отдал старый файл
    if (viaUi) return http('/download/' + p + '/' + c + '/' + lang + '/' + qs, true).then(checkPo);
    return http(trApi(p, c, lang) + 'file/' + qs, true).then(checkPo)
      .catch(function (e) {
        return http('/download/' + p + '/' + c + '/' + lang + '/' + qs, true).then(checkPo).catch(function () { throw e; });
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
  var MT_LANGS = ['kk', 'ky', 'tg', 'ka', 'hy', 'uz', 'az', 'en'];
  /* если в Weblate у языка несколько вариантов (en / en_US, uz / uz_Latn) — берём один:
     для узбекского латиницу, для остальных основной код */
  /* выгружаем, но в Smartcat не отправляем (сейчас таких нет: AZ тоже идёт на машперевод) */
  var EXPORT_ONLY_LANGS = [];
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
    ios: 'https://smartcat.com/projects/85c99769-dcf4-429c-8432-7ed09a4d2f10',
    web: 'МП Web'   // для веба в Smartcat уходит только английский — сюда, в папку «ДДММГГ web»
  };
  var SC_PROJECT_DEFAULT = 'AI translation 4 MP';
  var SC_LANG_DEFAULTS = 'ru=ru-RU\nen=en\nen_US=en\nkk=kk\nky=ky\ntg=tg\nka=ka\nhy=hy\nuz=uz-Latn\nuz_Latn=uz-Latn\naz=az-Latn';
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
        var m = /^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+("[^\n]*")\s*$/.exec(l);
        if (m) { key = m[1]; f[key] = unquote(m[2]); }
        else if (l.trim()[0] === '"' && key) { f[key] += unquote(l); }
      });
      if (f.msgid === undefined) return;
      var strs = Object.keys(f).filter(function (k) { return k.indexOf('msgstr') === 0; }).map(function (k) { return f[k]; });
      out.push({
        lines: lines, fuzzy: fuzzy, obsolete: obsolete, msgid: f.msgid, plural: f.msgid_plural || '', strs: strs, ctx: f.msgctxt || '',
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
  /* Smartcat иногда портит длинные строки (эмодзи, неразрывный пробел): кавычка не закрыта, конец исходника уезжает в msgstr.
     Weblate тогда отклоняет файл целиком («end-of-line within string»). Такие записи выкидываем, остальное оставляем.
     → null, если файл в порядке; иначе { text, dropped: [ключи] } */
  var PO_STR = /^\s*(?:#~\s*)?(?:(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+)?"((?:[^"\\]|\\.)*)"\s*$/;
  function quoteCount(l) {
    var n = 0;
    for (var i = 0; i < l.length; i++) { if (l[i] === '\\') { i++; continue; } if (l[i] === '"') n++; }
    return n;
  }
  /* Smartcat иногда пишет настоящий перенос строки внутри "…" вместо \n — склеиваем обратно через \n */
  function joinBrokenStrings(lines) {
    var out = [], joined = 0;
    for (var i = 0; i < lines.length; i++) {
      var l = lines[i], t = l.trim();
      if (t && t[0] !== '#' && t.indexOf('"') >= 0 && quoteCount(l) % 2) {
        var buf = l, j = i;
        while (quoteCount(buf) % 2 && j + 1 < lines.length && !/^\s*(msgctxt|msgid|msgstr|#)/.test(lines[j + 1])) { j++; buf += '\\n' + lines[j]; }
        if (!(quoteCount(buf) % 2) && PO_STR.test(buf)) { out.push(buf); joined++; i = j; continue; }
      }
      out.push(l);
    }
    return { lines: out, joined: joined };
  }
  function fixPo(text) {
    var jb = joinBrokenStrings(String(text).replace(/\r\n?/g, '\n').split('\n'));
    var lines = jb.lines;
    var bad = lines.some(function (l) { return l.trim() && l.trim()[0] !== '#' && !PO_STR.test(l); });
    if (!bad) return jb.joined ? { text: lines.join('\n'), dropped: [], joined: jb.joined } : null;
    var groups = [], g = null;
    lines.forEach(function (l) {
      var t = l.trim(), m = PO_STR.exec(l), key = m && m[1];
      if (!t) { g = null; return; }
      var startsNew = !g || (g.hasStr && (t[0] === '#' || key === 'msgctxt' || key === 'msgid'));
      if (startsNew) { g = { lines: [], ok: true, hasStr: false, ctx: '', id: null }; groups.push(g); }
      g.lines.push(l);
      if (t[0] === '#') { if (g.hasStr || g.id !== null) g.ok = false; return; }
      if (!m) { g.ok = false; return; }
      if (key === 'msgctxt') g.ctx = m[2];
      if (key === 'msgid') g.id = m[2];
      if (key && key.indexOf('msgstr') === 0) g.hasStr = true;
    });
    var dropped = [], out = [], lastKey = '';
    groups.forEach(function (x) {
      var hasId = x.id !== null;
      var key = x.ctx || (x.id ? poStr(x.id).slice(0, 40) : '');
      if (x.ok && hasId && x.hasStr) { out.push(x.lines.join('\n')); lastKey = key; return; }
      if (!hasId && !x.hasStr && x.lines.every(function (l) { return l.trim()[0] === '#'; })) return;   // осиротевшие комментарии
      /* кусок без ключа — обрывок предыдущей испорченной строки: не считаем отдельной строкой */
      if (!key) { if (!dropped.length || dropped[dropped.length - 1] !== lastKey) dropped.push(lastKey ? lastKey + ' (обрывок)' : 'без ключа'); return; }
      if (dropped.indexOf(key) < 0) dropped.push(key);
      lastKey = key;
    });
    return { text: out.join('\n\n') + '\n', dropped: dropped, joined: jb.joined };
  }
  /* ---------- переменные: {{count}}, %s, %1$d, {name}, $t(key), теги ----------
     Ошибка (строку не грузим): переменная, которой нет в исходнике (опечатка), или сломанная скобка.
     Предупреждение: переменная пропала, слиплась со словом, теги не совпадают.
     Учитываем язык: в az / tr / uz к переменной приклеиваются окончания ({{count}}-dən, {{name}}'in) — это не ошибка;
     в плюралках форма «один» может быть без числа. */
  var VAR_GLUE_OK = ['az', 'tr', 'uz', 'tk', 'ka', 'am'];   // окончания и приставки пишутся слитно: {{count}}-dən, ለ{{count}}
  var VAR_COUNT = /^(\{\{(count|displaycount|n|num|number|value|amount)\b[^}]*\}\}|%(\d+\$)?d|\{(count|n)\})$/i;
  /* kinds — какие виды переменных искать (по исходнику): в переводе ищем только те, что есть в исходнике,
     иначе «22%-dək» в азербайджанском похоже на %-d */
  function varParse(s, kinds) {
    kinds = kinds || { i18n: 1, nest: 1, printf: 1, single: 1 };
    var toks = [], tags = [], rest = String(s || ''), found = {};
    function take(re, kind, norm) {
      rest = rest.replace(re, function (m, x) { found[kind] = 1; if (kinds[kind]) toks.push(norm ? norm(m, x) : m); return ' '; });
    }
    take(/\{\{\s*([^{}]+?)\s*\}\}/g, 'i18n', function (m, x) { return '{{' + x.replace(/\s+/g, '') + '}}'; });
    take(/\$t\([^)]*\)/g, 'nest', function (m) { return m.replace(/\s+/g, ''); });
    if (kinds.printf) take(/%(\d+\$)?[-+0#]?\d*(?:\.\d+)?[sdif@]/g, 'printf');
    if (kinds.single) take(/\{[A-Za-z_][\w.]*\}/g, 'single');
    String(s || '').replace(/<\/?([a-zA-Z][\w-]*)[^>]*>/g, function (m, n) { tags.push(n.toLowerCase()); return m; });
    return { toks: toks, tags: tags.sort().join(','), stray: /[{}]/.test(rest), kinds: found };
  }
  function checkVars(srcs, forms, lang, isPlural) {
    var S = varParse(srcs.join('\n')), srcSet = {}, probs = [], seen = {};
    var kinds = { i18n: 1, nest: 1, printf: S.kinds.printf, single: S.kinds.single };
    var braces = S.kinds.i18n || S.kinds.single;
    S.toks.forEach(function (t) { srcSet[t] = 1; });
    var glueOk = VAR_GLUE_OK.indexOf(baseLang(lang || '')) >= 0;
    var srcGlue = /\}\}[\p{L}]|[\p{L}]\{\{/u.test(srcs.join(' '));
    function add(hard, text) { if (!seen[text]) { seen[text] = 1; probs.push({ hard: hard, text: text }); } }
    forms.forEach(function (f) {
      if (!f) return;
      var T = varParse(f, kinds);
      T.toks.forEach(function (t) { if (!srcSet[t]) add(true, 'лишняя переменная ' + t + ' — в исходнике её нет'); });
      if (braces && T.stray && !S.stray) add(true, 'сломана скобка у переменной');
      Object.keys(srcSet).forEach(function (t) {
        if (T.toks.indexOf(t) < 0 && !(isPlural && VAR_COUNT.test(t))) add(false, 'нет переменной ' + t);
      });
      if (!glueOk && !srcGlue) {
        var g = /\{\{[^{}]+\}\}[\p{L}]+|[\p{L}]+\{\{[^{}]+\}\}/u.exec(f);
        if (g) add(false, 'переменная слиплась со словом: «' + g[0] + '»');
      }
      if (S.tags !== T.tags) add(false, 'теги не совпадают с исходником');
    });
    return probs;
  }
  function varScan(u) {
    if (u.vars !== undefined) return u.vars;
    if (u.error || !u.text) return null;
    var list = [];
    if (/\.json$/i.test(u.name)) {
      var obj = {}; try { obj = JSON.parse(u.text); } catch (e) { return null; }
      Object.keys(obj).forEach(function (k) {
        var probs = mtLeak('', String(obj[k] || ''), u.lang, true);
        if (probs.length) list.push({ idx: k, ctx: k, src: '', tr: String(obj[k]), probs: probs, hard: true, salvage: mtSalvage('', String(obj[k] || ''), u.lang) });
      });
      u.vars = list.length ? list : null;
      return u.vars;
    }
    poEntries(u.text).forEach(function (e, idx) {
      if (e.header || e.obsolete || !e.strs.some(Boolean)) return;
      var srcs = [poStr(e.msgid), poStr(e.plural)].filter(Boolean);
      var probs = checkVars(srcs, e.strs.map(poStr), u.lang, !!e.plural)
        .concat(mtLeak(srcs.join('\n'), e.strs.map(poStr).join('\n'), u.lang));
      var onlyLeak = probs.length && probs.every(function (x) { return !x.hard || x.leak; }) && probs.some(function (x) { return x.leak; });
      if (probs.length) list.push({ idx: idx, ctx: poStr(e.ctx), src: poStr(e.msgid), tr: e.strs.map(poStr).join(' | '), probs: probs,
        hard: probs.some(function (x) { return x.hard; }),
        salvage: onlyLeak && !e.plural && e.strs.length === 1 ? mtSalvage(srcs.join('\n'), poStr(e.strs[0]), u.lang) : null });
    });
    u.vars = list.length ? list : null;
    return u.vars;
  }
  function poEsc(t) { return String(t).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\t/g, '\\t'); }
  /* файл только с вытащенными из «мусора» переводами — грузится отдельно, со статусом «На правку» */
  function salvageText(u, items) {
    if (/\.json$/i.test(u.name)) {
      var jo = JSON.parse(u.text), plBase = function (k) { return k.replace(/_(zero|one|two|few|many|other|plural|\d+)$/, ''); };
      var bad = (u.vars || []).filter(function (x) { return x.hard; }), out = {}, n = 0;
      var bases = items.map(function (x) { return plBase(x.idx); }).filter(function (b, i, a) { return a.indexOf(b) === i; });
      bases.forEach(function (b) {
        var badHere = bad.filter(function (x) { return plBase(x.idx) === b; });
        if (!badHere.every(function (x) { return x.salvage; })) return;        // плюралку — только целиком
        Object.keys(jo).forEach(function (k) { if (plBase(k) === b) { var fix = badHere.filter(function (x) { return x.idx === k; })[0]; out[k] = fix ? fix.salvage : jo[k]; } });
        n += badHere.length;
      });
      return n ? { text: JSON.stringify(out, null, 2) + '\n', n: n } : null;
    }
    var es = poEntries(u.text), parts = [], cnt = 0;
    es.forEach(function (e, i) {
      if (e.header) { parts.push(e.lines.join('\n')); return; }
      var it = items.filter(function (x) { return x.idx === i; })[0];
      if (it) { parts.push(setPoStrs(e, [poEsc(it.salvage)])); cnt++; }
    });
    return cnt ? { text: parts.join('\n\n') + '\n', n: cnt } : null;
  }
  function dropEntries(text, idxs) {
    return poEntries(text).filter(function (e, i) { return idxs.indexOf(i) < 0; }).map(function (e) { return e.lines.join('\n'); }).join('\n\n') + '\n';
  }
  function applyPoFix(u) {
    if (/\.json$/i.test(u.name) || !u.text) return;
    var fx = fixPo(u.text), notes = [];
    if (fx) {
      u.text = fx.text;
      if (fx.joined) notes.push('склеила разорванные строки: ' + fx.joined);
      if (fx.dropped.length) { u.fixedKeys = fx.dropped; notes.push('смарткат испортил ' + fx.dropped.length + ' стр. — убрала, остальное загружу (' + fx.dropped.join(', ') + ')'); }
    }
    var nl = fixNewlines(u.text);
    if (nl.n) { u.text = nl.text; notes.push('убрала лишние переносы строк: ' + nl.n); }
    if (notes.length) u.note = (u.note ? u.note + ' · ' : '') + notes.join(' · ');
  }
  /* заменить msgstr у записи (строки в экранированном виде, как в файле) */
  function setPoStrs(e, strs) {
    var out = [], cur = null;
    e.lines.forEach(function (l) {
      var m = PO_STR.exec(l);
      if (m && m[1]) cur = m[1]; else if (!m) cur = null;
      if (cur && cur.indexOf('msgstr') === 0) return;
      out.push(l);
    });
    if (!e.plural && strs.length === 1) out.push('msgstr "' + strs[0] + '"');
    else strs.forEach(function (x, i) { out.push('msgstr[' + i + '] "' + x + '"'); });
    return out.join('\n');
  }
  /* в исходнике нет переносов, а машперевод разбил строку на несколько — склеиваем пробелом */
  function fixNewlines(text) {
    var n = 0;
    var parts = poEntries(text).map(function (e) {
      if (e.header || e.obsolete || !e.strs.some(Boolean)) return e.lines.join('\n');
      var src = e.msgid + (e.plural || '');
      if (/\\n/.test(src) || !e.strs.some(function (x) { return /\\n/.test(x); })) return e.lines.join('\n');
      n++;
      return setPoStrs(e, e.strs.map(function (x) { return x.replace(/(?:[ \t]|\\n)*\\n(?:[ \t]|\\n)*/g, ' ').replace(/^ | $/g, ''); }));
    });
    return n ? { text: parts.join('\n\n') + '\n', n: n } : { text: text, n: 0 };
  }
  /* «мусор» от машперевода: пояснения, контекст, варианты, разметка — такие строки не грузим */
  var LEAK_WORDS = /(?:^|[\s(*\[«"—-])(context|note|notes|translation|translated|alternative(?:ly)?|usually|most natural|literally|explanation|meaning|here is|here's|option\s*\d|variant\s*\d|wait|glossary|let's|let us|source:|rendering|strictly|i will|i'll|hmm)\b/i;
  /* английские служебные слова — признак «рассуждений» ИИ внутри перевода */
  var EN_STOP = ['the', 'and', 'is', 'are', 'with', 'this', 'that', 'should', 'would', 'which', 'keep', 'use', 'natural', 'literal', 'standard', 'exact', 'words', 'or', 'but', 'so'];
  var LEAK_LABEL = /[(*\[]\s*\**\s*[\p{Lu}][\p{Lu} -]{3,}\s*:/u;
  function mtLeak(src, tr, lang, noSrc) {
    var probs = [];
    if (!tr) return probs;
    var en = baseLang(lang || '') === 'en';
    function frag(m) { var i = Math.max(0, m.index - 10); return '«' + tr.slice(i, i + 50).replace(/\s+/g, ' ') + (tr.length > i + 50 ? '…' : '') + '»'; }
    var w = !en && LEAK_WORDS.exec(tr);
    if (w && (noSrc || src.toLowerCase().indexOf(w[1].toLowerCase()) < 0)) probs.push({ hard: true, text: 'похоже, смарткат дописал пояснение: ' + frag(w) });
    var lb = LEAK_LABEL.exec(tr);
    if (lb && (noSrc || !LEAK_LABEL.test(src))) probs.push({ hard: true, text: 'похоже, смарткат вставил примечание: ' + frag(lb) });
    if (!en) {
      var srcL = String(src || '').toLowerCase(), hits = EN_STOP.filter(function (w) {
        return new RegExp('(^|[^a-z\']' + ')' + w + '(?![a-z])', 'i').test(tr) && !new RegExp('(^|[^a-z])' + w + '(?![a-z])').test(srcL);
      });
      if (hits.length >= 3) probs.push({ hard: true, text: 'в переводе английские рассуждения ИИ (' + hits.slice(0, 5).join(', ') + ')' });
    }
    var md = /\*\*|\*\(|\)\*/.exec(tr);
    if (md && (noSrc || !/\*/.test(src))) probs.push({ hard: true, text: 'в переводе разметка * — в исходнике её нет: ' + frag(md) });
    if (!noSrc && src && tr.length > src.length * 3 + 60) probs.push({ hard: true, text: 'перевод в ' + Math.round(tr.length / src.length) + ' раз длиннее исходника — похоже, смарткат дописал лишнее' });
    probs.forEach(function (p) { p.leak = true; });
    return probs;
  }
  /* попытка вытащить сам перевод из «рассуждений» ИИ:
     1) после последнего «Let's use: / Let's keep: / Final:» — первый вариант в кавычках или первая строка;
     2) иначе — текст до первого «Wait / Glossary / Source / (context …) / *(…)*», первый вариант до « / ».
     Кандидат принимается, только если сам чистый (без мусора, переменные как в исходнике, столько же строк). */
  var SALV_FINAL = /(?:let'?s\s+(?:use|keep|go with|choose|output)|final(?:\s+(?:answer|version|translation))?|result|answer|output)\s*[:\-—]\s*/gi;
  var SALV_CUT = /(\*\s*\(|\(\s*[\p{Lu}][\p{Lu} -]{3,}:|\*?\(?\b(?:wait|glossary|source|note|notes|context|usually|literal(?:ly)?|let'?s|hmm|alternatively|option|translation|standard|or)\b)/iu;
  function mtSalvage(src, tr, lang) {
    var t = String(tr || ''), cand = null, m, last = -1;
    SALV_FINAL.lastIndex = 0;
    while ((m = SALV_FINAL.exec(t))) last = SALV_FINAL.lastIndex;
    if (last >= 0) {
      var rest = t.slice(last).replace(/^\s+/, '');
      var q = /^["«“]([^"»”]+)["»”]/.exec(rest);
      cand = q ? q[1] : rest.split(/\n\s*\n/)[0];
      var cut = SALV_CUT.exec(cand); if (cut && cut.index > 0) cand = cand.slice(0, cut.index);
    } else {
      var c2 = SALV_CUT.exec(t);
      if (!c2 || c2.index === 0) return null;
      cand = t.slice(0, c2.index);
    }
    cand = cand.split(/\s+\/\s+/)[0];
    if (!/[()]/.test(src)) cand = cand.replace(/\s*\([^()]*\)?\s*$/, '');
    cand = cand.replace(/^[\s"«“]+|[\s"»”:]+$/g, '').replace(/\n{2,}/g, '\n');
    if (!cand) return null;
    /* строки: столько же, сколько в исходнике (там бывает U+2028 вместо переноса) */
    var srcSep = /\u2028/.test(src) ? '\u2028' : '\n', srcN = String(src).split(/\n|\u2028/).length, lines = cand.split('\n');
    if (srcN === 1 && lines.length > 1) cand = lines.map(function (x) { return x.trim(); }).join(' ');
    else if (lines.length !== srcN) return null;
    else cand = lines.join(srcSep);
    if (mtLeak(src, cand, lang).length) return null;
    if (src && checkVars([src], [cand], lang, false).some(function (p) { return p.hard; })) return null;
    if (src && cand.length > src.length * 2.5 + 20) return null;
    return cand;
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
  function downloadBlob(blob, name) {
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
  }
  /* ---------- папка для архивов: выбирается один раз (File System Access API), хранится в IndexedDB ---------- */
  var dirHandle = null, dirLoaded = null;
  function dirDb(op, val) {
    return new Promise(function (res, rej) {
      var rq = indexedDB.open('wlx-dir', 1);
      rq.onupgradeneeded = function () { rq.result.createObjectStore('h'); };
      rq.onerror = function () { rej(rq.error); };
      rq.onsuccess = function () {
        var db = rq.result, st = db.transaction('h', op === 'get' ? 'readonly' : 'readwrite').objectStore('h');
        var r = op === 'get' ? st.get('dir') : op === 'del' ? st.delete('dir') : st.put(val, 'dir');
        r.onsuccess = function () { res(r.result); db.close(); };
        r.onerror = function () { rej(r.error); };
      };
    });
  }
  function loadDir() {
    if (!dirLoaded) dirLoaded = dirDb('get').then(function (h) { dirHandle = h || null; return dirHandle; }, function () { return null; });
    return dirLoaded;
  }
  function pickDir() {
    if (!window.showDirectoryPicker) return Promise.reject(new Error('этот браузер не умеет выбирать папку — нужен Chrome'));
    return window.showDirectoryPicker({ id: 'wlx-archives', mode: 'readwrite', startIn: 'desktop' }).then(function (h) {
      dirHandle = h; dirLoaded = Promise.resolve(h);
      return dirDb('put', h).then(function () { return h; });
    });
  }
  function forgetDir() { dirHandle = null; dirLoaded = Promise.resolve(null); return dirDb('del'); }
  function freeName(dir, name) {
    var m = /^(.*?)(\.[^.]+)?$/.exec(name), n = 1;
    function tryName(nm) {
      return dir.getFileHandle(nm).then(function () { n++; return n > 99 ? nm : tryName(m[1] + ' (' + n + ')' + (m[2] || '')); }, function () { return nm; });
    }
    return tryName(name);
  }
  function saveToDir(blob, name) {
    var h = dirHandle;
    return h.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? p : h.requestPermission({ mode: 'readwrite' }); }).then(function (p) {
      if (p !== 'granted') throw new Error('нет разрешения на папку');
      var sub = sget('wlx_dir_dated') === '0' ? '' : ddmmyy();
      return (sub ? h.getDirectoryHandle(sub, { create: true }) : Promise.resolve(h)).then(function (d) {
        return freeName(d, name).then(function (nm) {
          return d.getFileHandle(nm, { create: true }).then(function (fh) { return fh.createWritable(); })
            .then(function (w) { return w.write(blob).then(function () { return w.close(); }); })
            .then(function () { return h.name + '/' + (sub ? sub + '/' : '') + nm; });
        });
      });
    });
  }
  /* папки по платформам на компьютере: ДДММГГ_web / ДДММГГ_iOS / ДДММГГ_android */
  function platDir(p, c) { var pl = scPlatform(p, c); return ddmmyy() + '_' + (pl === 'ios' ? 'iOS' : pl); }
  /* выгрузка «папками»: если выбрана папка для архивов и включено «без zip» — пишем файлы прямо туда (по умолчанию выключено) */
  function unzipToDir() { return !!dirHandle && sget('wlx_dir_unzip') === '1'; }
  function saveFilesToDir(files) {
    var h = dirHandle, cache = {};
    function dirFor(path) {
      var parts = path.split('/').slice(0, -1), key = '';
      return parts.reduce(function (pr, part) {
        return pr.then(function (d) { key += '/' + part; if (!cache[key]) cache[key] = d.getDirectoryHandle(part, { create: true }); return cache[key]; });
      }, Promise.resolve(h));
    }
    return h.queryPermission({ mode: 'readwrite' }).then(function (p) { return p === 'granted' ? p : h.requestPermission({ mode: 'readwrite' }); }).then(function (p) {
      if (p !== 'granted') throw new Error('нет разрешения на папку');
      return files.reduce(function (pr, f) {
        return pr.then(function () {
          return dirFor(f.name).then(function (d) {
            return d.getFileHandle(f.name.split('/').pop(), { create: true }).then(function (fh) { return fh.createWritable(); })
              .then(function (w) { return w.write(new Blob([f.text])).then(function () { return w.close(); }); });
          });
        });
      }, Promise.resolve()).then(function () {
        var tops = {}; files.forEach(function (f) { var t = f.name.split('/')[0]; if (f.name.indexOf('/') > 0) tops[t] = (tops[t] || 0) + 1; });
        return Object.keys(tops).sort().map(function (t) { return h.name + '/' + t + ' (' + tops[t] + ')'; }).join(', ');
      });
    });
  }
  /* сохранить набор файлов: папками (если можно) или zip; файлы в ДДММГГ_web/_iOS/_android — отдельный zip на платформу */
  function saveFiles(files, zipName) {
    if (!unzipToDir()) {
      var groups = {}, rest = [];
      files.forEach(function (f) {
        var m = /^(\d{6}_(?:web|iOS|android))\/(.+)$/.exec(f.name);
        if (m) (groups[m[1]] = groups[m[1]] || []).push({ name: m[2], text: f.text }); else rest.push(f);
      });
      var names = Object.keys(groups).sort();
      if (!names.length) { saveBlob(makeZip(files), zipName); return; }
      names.forEach(function (g, i) { setTimeout(function () { saveBlob(makeZip(groups[g].concat(rest)), g + '.zip'); }, i * 600); });
      return;
    }
    saveFilesToDir(files).then(function (where) { toast('✓ Сохранено папками: ' + where); }, function (e) {
      saveBlob(makeZip(files), zipName);
      toast('Не получилось сохранить папками (' + (e.message || e) + ') — сохранила zip', true);
    });
  }
  /* архивы (.zip) — в выбранную папку, если она есть; остальное и запасной вариант — обычное скачивание */
  function saveBlob(blob, name) {
    if (!/\.zip$/i.test(name) || !dirHandle) { downloadBlob(blob, name); return; }
    saveToDir(blob, name).then(function (path) { toast('✓ Сохранено: ' + path); }, function (e) {
      downloadBlob(blob, name);
      toast('Папка для архивов недоступна (' + (e.message || e) + ') — скачала в «Загрузки». Проверь папку в ⚙', true);
    });
  }
  var toastEl = null, toastTimer = null;
  function toast(text, bad) {
    if (!toastEl) return;
    toastEl.textContent = text; toastEl.className = 'toast' + (bad ? ' bad' : '');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { toastEl.className = 'toast hide'; }, bad ? 12000 : 6000);
  }
  loadDir();

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
    return fetch('/', { credentials: 'same-origin', cache: 'no-store' }).then(function (r) { return r.text(); }).then(function (t) {
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
    ':host{all:initial;--bg:#FCFBFF;--card:#FFFFFF;--soft:#F2EEFF;--ink:#2A2140;--ink-soft:#7A7194;--line:#E7E1F7;--accent:#8B5CF6;--accent-2:#EC4899;--ok:#16A34A;--ok-soft:#EEFBF2;--warn:#C2410C;--warn-soft:#FFF4EA;--err:#E11D74;--err-soft:#FFEFF6;--shadow:0 4px 14px rgb(42 33 64 / .06);--glow:0 6px 16px rgb(139 92 246 / .3);--scrim:rgb(42 33 64 / .38);--on:#fff;color-scheme:light}',
    ':host([data-theme="dark"]){--bg:#17131F;--card:#1E1829;--soft:#251E37;--ink:#EEE9FA;--ink-soft:#A79DC0;--line:#362C4D;--accent:#A78BFA;--accent-2:#F472B6;--ok:#4ADE80;--ok-soft:#17271D;--warn:#FBBF24;--warn-soft:#2A2316;--err:#FB7185;--err-soft:#331A26;--shadow:0 4px 14px rgb(0 0 0 / .25);--glow:0 6px 16px rgb(167 139 250 / .25);--scrim:rgb(0 0 0 / .55);--on:#1A1027;color-scheme:dark}',
    '@media (prefers-color-scheme: dark){:host(:not([data-theme="light"])){--bg:#17131F;--card:#1E1829;--soft:#251E37;--ink:#EEE9FA;--ink-soft:#A79DC0;--line:#362C4D;--accent:#A78BFA;--accent-2:#F472B6;--ok:#4ADE80;--ok-soft:#17271D;--warn:#FBBF24;--warn-soft:#2A2316;--err:#FB7185;--err-soft:#331A26;--shadow:0 4px 14px rgb(0 0 0 / .25);--glow:0 6px 16px rgb(167 139 250 / .25);--scrim:rgb(0 0 0 / .55);--on:#1A1027;color-scheme:dark}}',
    '*{box-sizing:border-box}',
    '.back{position:fixed;inset:0;background:var(--scrim);backdrop-filter:blur(3px);z-index:2147483646;display:grid;place-items:center;padding:16px}',
    '.box{position:relative;display:flex;flex-direction:column;width:min(960px,100%);height:min(900px,100%);background:var(--bg);color:var(--ink);border-radius:22px;box-shadow:0 30px 80px rgb(20 10 40 / .35);overflow:hidden;font:14px/1.45 Onest,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}',
    '.top{display:flex;align-items:center;gap:14px;padding:12px 12px 12px 18px;background:var(--card);border-bottom:1px solid var(--line);flex:none}',
    '.brand{display:flex;align-items:center;gap:10px;min-width:0}',
    '.logo{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:linear-gradient(135deg,var(--accent-2),var(--accent));color:#fff;font-weight:700;font-size:17px;box-shadow:var(--glow);flex:none}',
    'h1{font-size:16px;margin:0;font-weight:700;white-space:nowrap}',
    '.tabs{display:flex;gap:2px;padding:3px;border-radius:14px;background:var(--soft);margin:0 auto;min-width:0;overflow:auto}',
    '.tab{font:inherit;font-size:13.5px;font-weight:600;border:0;border-radius:11px;padding:7px 14px;cursor:pointer;background:transparent;color:var(--ink-soft);white-space:nowrap}',
    '.tab:hover{color:var(--ink)}',
    '.tab.on{background:var(--card);color:var(--accent);box-shadow:0 2px 8px rgb(139 92 246 / .18)}',
    '.icons{display:flex;gap:2px;flex:none}',
    '.x{display:grid;place-items:center;width:34px;height:34px;padding:0;border:0;border-radius:10px;background:transparent;color:var(--ink-soft);cursor:pointer;font:inherit;font-size:20px;line-height:1}',
    '.x:hover,.x.on{background:var(--soft);color:var(--accent)}',
    '.x.s{width:26px;height:26px;font-size:16px}',
    '.x svg{width:19px;height:19px}',
    '.scroll{flex:1;overflow:auto;padding:18px 22px 28px;scrollbar-width:thin;scrollbar-color:var(--line) transparent}',
    '.sub{display:none}',
    'h2{font-size:12.5px;font-weight:600;color:var(--accent);margin:18px 0 8px}',
    'h3{font-size:15px;margin:0;font-weight:700;color:var(--ink)}',
    'a{color:var(--accent)}',
    'textarea{display:block;width:100%;min-height:120px;padding:10px 12px;border:1px solid var(--line);border-radius:12px;font-family:inherit;font-size:13px;line-height:1.5;resize:vertical;color:var(--ink);background:var(--card)}',
    'input[type=text],input[type=password],input[type=number],input[type=time],input[type=date],input[type=url],select{display:block;width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:12px;font:inherit;color:var(--ink);background:var(--card);margin-top:0}',
    'textarea:focus,select:focus,input:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}',
    'input[type=checkbox],input[type=radio]{accent-color:var(--accent);width:16px;height:16px;margin:0;cursor:pointer;flex:none}',
    'button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}',
    '.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:12px}',
    'button.b{font:inherit;font-weight:600;border:0;border-radius:12px;padding:9px 16px;cursor:pointer;background:var(--accent);color:var(--on);white-space:nowrap}',
    'button.b:hover:not(:disabled){filter:brightness(1.07)}',
    'button.g{background:var(--card);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}',
    'button.g:hover:not(:disabled){filter:none;box-shadow:inset 0 0 0 1px var(--accent);color:var(--accent)}',
    'button.s{padding:6px 12px;font-size:12.5px;border-radius:10px}',
    'button.ico{padding:6px 9px}',
    'button.big,button.hgo{font:inherit;font-size:15px;font-weight:700;border:0;cursor:pointer;border-radius:14px;padding:12px 22px;background:linear-gradient(100deg,var(--accent),var(--accent-2));color:var(--on);box-shadow:var(--glow)}',
    'button.big:hover:not(:disabled),button.hgo:hover:not(:disabled){filter:brightness(1.06)}',
    'button.big:active,button.hgo:active{transform:translateY(1px)}',
    'button.big.g{background:var(--card);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line)}',
    'button.hgo{text-align:left;display:grid;gap:1px;padding:11px 22px}',
    'button.hgo span{font-size:15px;font-weight:700}',
    'button.hgo small{font-size:11.5px;font-weight:500;opacity:.88}',
    'button:disabled{opacity:.5;cursor:default}',
    'button.lnk{font:inherit;font-size:13px;border:0;background:none;color:var(--accent);font-weight:600;cursor:pointer;padding:2px 0}',
    'button.lnk:hover{text-decoration:underline}',
    '.muted{color:var(--ink-soft);font-size:12.5px}',
    '.red{color:var(--err)}',
    '.ok{color:var(--ok)}',
    '.err{color:var(--err);white-space:pre-wrap;margin-top:8px;font-size:13px;background:var(--err-soft);border-radius:12px;padding:9px 12px}',
    '.err:empty{display:none}',
    '.blk{display:block;margin-top:10px}',
    '.bar{height:8px;background:var(--soft);border-radius:6px;overflow:hidden;margin:8px 0 12px}',
    '.bar>div{height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--accent-2));transition:width .25s}',
    'table{width:100%;border-collapse:collapse;font-size:13px}',
    'th,td{text-align:left;padding:8px 6px;border-bottom:1px solid var(--line);vertical-align:top}',
    'th{color:var(--ink-soft);font-weight:600;font-size:11.5px;text-transform:uppercase;letter-spacing:.04em}',
    'tr:hover td{background:color-mix(in srgb,var(--soft) 55%,transparent)}',
    '.n{text-align:right;font-variant-numeric:tabular-nums}',
    'details{margin-top:12px}',
    'summary{cursor:pointer;color:var(--accent);font-size:13px;font-weight:600}',
    '.langs{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:6px;margin-top:8px}',
    '.langs label{position:relative;display:flex;gap:8px;align-items:center;padding:7px 11px;border:1px solid var(--line);border-radius:12px;cursor:pointer;background:var(--card);font-weight:500}',
    '.langs label:hover{border-color:var(--accent)}',
    '.langs label:has(input:checked){background:var(--accent);border-color:var(--accent);color:var(--on)}',
    '.langs label:has(input:checked) .muted{color:var(--on);opacity:.8}',
    '.langs input{position:absolute;opacity:0;pointer-events:none}',
    '.drop{display:block;border:2px dashed var(--line);border-radius:16px;padding:24px 16px;text-align:center;cursor:pointer;color:var(--ink-soft);background:var(--card);transition:border-color .12s,background .12s}',
    '.drop:hover,.drop.over{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 6%,var(--card));color:var(--accent)}',
    '.drop input{display:none}',
    '.dropt{font-size:14.5px;font-weight:600;color:var(--ink)}',
    '.opts{display:grid;grid-template-columns:1fr;gap:10px}',
    '.opts label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;color:var(--ink-soft)}',
    '.flag{display:inline-block;width:24px;height:18px;flex:none;vertical-align:middle;border-radius:3px;overflow:hidden}',
    '.flag svg{width:24px;height:18px;display:block}',
    '.lang{display:inline-flex;align-items:center;gap:8px}',
    '.layouts{display:grid;gap:6px}',
    '.layouts label{display:flex;gap:8px;align-items:baseline;padding:8px 11px;border:1px solid var(--line);border-radius:12px;cursor:pointer;background:var(--card)}',
    '.layouts label:has(input:checked){border-color:var(--accent);background:var(--soft)}',
    '.complist{max-height:220px;overflow:auto;font:12.5px/1.6 ui-monospace,Consolas,monospace;color:var(--ink);padding:6px 0}',
    '.settings label{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;color:var(--ink-soft);margin-top:10px}',
    '.settings label.blk,.settings label.chk{flex-direction:row;align-items:center;gap:8px;color:var(--ink);font-weight:500;font-size:13px}',
    'textarea.small{min-height:60px}',
    '.scimp label.chk,label.chk{display:inline-flex;gap:8px;align-items:center;font-size:13px;color:var(--ink);cursor:pointer}',
    '.scimp details label.chk{padding:3px 0 3px 22px}',
    '.scgroup{margin-top:10px;padding:10px 12px;border:1px solid var(--line);border-radius:14px;background:var(--soft)}',
    'select.presel{display:inline-block;width:auto;min-width:220px;padding:7px 10px}',
    'pre.report{white-space:pre-wrap;font:12.5px/1.55 ui-monospace,Consolas,monospace;background:var(--soft);border-radius:12px;padding:10px 12px;margin:6px 0;color:var(--ink)}',
    '.sec,.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px 18px;margin-top:14px;box-shadow:var(--shadow)}',
    '.scroll>div>.sec:first-child,.scroll>div>.card:first-child,.scroll>div>.setrow+.card{margin-top:0}',
    '.sech{font-weight:700;font-size:15px;color:var(--ink);margin-bottom:10px}',
    '.card .head,.sec .head{display:flex;justify-content:space-between;align-items:center;gap:10px}',
    '.hint{color:var(--ink-soft);font-size:12.5px;margin:4px 0 0}',
    '.scrow{display:flex;gap:10px;align-items:center;padding:9px 4px;border-top:1px solid var(--line)}',
    '.scrow .grow{flex:1;min-width:0}',
    '.scrow .grow b{font-weight:600}',
    '.scrow .grow div{margin-top:1px}',
    '.ftable{max-height:380px;overflow:auto;margin-top:8px;border:1px solid var(--line);border-radius:12px}',
    '.ftable th{position:sticky;top:0;background:var(--soft);z-index:1}',
    '.ftable td,.ftable th{padding:7px 9px}',
    '.ftable tr{cursor:pointer}',
    '.ftable tr.folder td{background:color-mix(in srgb,var(--soft) 40%,transparent)}',
    '.ftable tr.done td{background:var(--ok-soft)}',
    'input.pick{display:block;width:100%;min-width:170px;padding:5px 8px;border:1px solid var(--line);border-radius:8px;font:inherit;font-size:12.5px;background:var(--card);color:var(--ink)}',
    '.crumbs{margin-top:10px;font-size:13px}',
    '.crumbs a{color:var(--accent);text-decoration:none;font-weight:600}',
    '.setrow{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 12px;color:var(--ink-soft);font-size:13px}',
    'td.brtr{max-width:320px;word-break:break-word}',
    '.badge{display:inline-block;font-size:11.5px;font-weight:600;padding:1px 8px;border-radius:999px;margin-left:6px;vertical-align:1px;white-space:nowrap}',
    '.b-ok{background:var(--ok-soft);color:var(--ok)}.b-part{background:var(--warn-soft);color:var(--warn)}.b-new{background:var(--soft);color:var(--ink-soft)}',
    '.res{margin-top:12px;border-top:1px solid var(--line);padding-top:10px}',
    '.res .line{font-size:13.5px;margin:4px 0}',
    '.res .bar{margin:6px 0 10px}',
    '.toast{position:sticky;top:-18px;z-index:5;margin:-6px 0 12px;padding:10px 14px;border-radius:14px;background:var(--ok);color:#fff;font-size:13.5px;font-weight:600;box-shadow:0 8px 22px rgb(0 0 0 / .14)}',
    '.toast.bad{background:var(--err)}',
    '.lbl{display:block;font-weight:600;font-size:12.5px;color:var(--accent);margin-bottom:6px}',
    '.hblock{margin-top:16px}',
    '.hsetup{margin-top:0}',
    '.hsetup .lbl{display:inline;margin:0}',
    '.hsetup select{width:auto;min-width:200px}',
    'textarea.hlinks{min-height:84px}',
    '.seg{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px}',
    '.seg.mini{margin:0}',
    '.chipb{font:inherit;font-size:13px;font-weight:500;border:1px solid var(--line);background:var(--card);color:var(--ink);border-radius:999px;padding:6px 13px;cursor:pointer;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.chipb:hover{border-color:var(--accent)}',
    '.chipb.on{background:var(--accent);border-color:var(--accent);color:var(--on)}',
    '.steps{display:grid;gap:12px}',
    '.st{display:grid;grid-template-columns:26px 1fr auto;gap:12px;align-items:center}',
    '.st .grow{min-width:0}',
    '.st b{font-size:14px;font-weight:600}',
    '.dot{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;color:#fff}',
    '.d-ok{background:var(--ok)}.d-run{background:#F59E0B}.d-err{background:var(--err)}.d-next{background:var(--soft);color:var(--ink-soft)}',
    '.hdrop{margin-top:14px}',
    '.hfoot{justify-content:space-between}',
    'details.fold>summary{font-weight:700;font-size:15px;color:var(--ink);list-style:none;display:flex;justify-content:space-between;align-items:center}',
    'details.fold>summary::-webkit-details-marker,details.grp>summary::-webkit-details-marker{display:none}',
    'details.fold>summary::after,details.grp>summary::after{content:"";width:8px;height:8px;border-right:2px solid var(--ink-soft);border-bottom:2px solid var(--ink-soft);transform:rotate(45deg);transition:transform .15s;margin:0 4px 3px auto;flex:none}',
    'details.fold:not([open])>summary::after,details.grp:not([open])>summary::after{transform:rotate(-45deg);margin-bottom:0}',
    'details.fold[open]>summary{margin-bottom:8px}',
    'details.fold{margin-top:10px}',
    '.settings{margin:0}',
    '.track{margin-top:14px}',
    '.savebar{position:sticky;bottom:-28px;background:var(--bg);padding:12px 0 14px;margin-top:12px;z-index:3;border-top:1px solid var(--line)}',
    'input.dl{display:block;width:100%;padding:9px 11px;border:1px solid var(--line);border-radius:12px;background:var(--card);font:inherit;color:var(--ink)}',
    '.msgblk{margin-top:14px}',
    'textarea.msg{min-height:110px;font-size:13px}',
    '.listbar{margin-top:10px}',
    '.empty{color:var(--ink-soft);font-size:13px;text-align:center;padding:18px 0 6px;margin:0}',
    'details.grp{margin-top:10px;border:1px solid var(--line);border-radius:14px;background:var(--card);overflow:hidden}',
    'details.grp>summary{list-style:none;display:flex;align-items:center;gap:10px;padding:10px 14px;color:var(--ink);font-size:14px;font-weight:500}',
    'details.grp>summary:hover{background:color-mix(in srgb,var(--soft) 50%,transparent)}',
    'details.grp[open]>summary{border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--soft) 50%,transparent)}',
    'details.grp>summary b{font-weight:700}',
    'details.grp .scrow{padding:9px 14px;border-top:0}',
    'details.grp .scrow+.scrow{border-top:1px solid var(--line)}',
    '.gico{font-size:15px}',
    '.pill{display:inline-block;font-size:11.5px;font-weight:600;padding:2px 9px;border-radius:999px;white-space:nowrap}',
    '.p-ok{background:var(--ok-soft);color:var(--ok)}.p-ready{background:color-mix(in srgb,var(--accent-2) 14%,var(--card));color:var(--accent-2)}.p-wait{background:var(--soft);color:var(--ink-soft)}',
    '.qa{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px;margin-top:14px}',
    '.qitem{display:flex;align-items:center;gap:12px;padding:12px 14px;text-align:left;border:1px solid var(--line);border-radius:16px;background:var(--card);box-shadow:var(--shadow);font:inherit;color:var(--ink);cursor:pointer}',
    '.qitem:hover{border-color:var(--accent)}',
    '.qic{display:grid;place-items:center;width:38px;height:38px;flex:none;border-radius:12px;background:var(--soft);color:var(--accent);font-size:18px}',
    '.qitem b{display:block;font-size:14px;font-weight:600}',
    '.qitem span.muted{display:block}',
    '.sheet{position:absolute;inset:0;z-index:20;background:var(--scrim);display:grid;place-items:center;padding:20px}',
    '.sheetwin{display:flex;flex-direction:column;width:min(660px,100%);max-height:100%;background:var(--bg);border-radius:20px;box-shadow:0 24px 60px rgb(20 10 40 / .35);overflow:hidden}',
    '.sheethead{display:flex;align-items:center;justify-content:space-between;padding:14px 12px 14px 22px;background:var(--card);border-bottom:1px solid var(--line)}',
    '.sheett{font-size:17px;font-weight:700}',
    '.sheetbody{overflow:auto;padding:4px 22px 8px}',
    '.step{display:grid;grid-template-columns:28px 1fr;gap:14px;padding:16px 0;border-bottom:1px solid var(--line)}',
    '.step:last-child{border-bottom:0}',
    '.stepn{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--soft);color:var(--accent);font-weight:700;font-size:13px}',
    '.stepb{min-width:0}',
    '.stept{font-weight:700;font-size:14.5px;margin:3px 0 10px}',
    '.fchips{display:flex;flex-direction:column;gap:6px;margin-top:8px}',
    '.fchips:empty{display:none}',
    '.fchip{display:flex;align-items:center;gap:8px;padding:5px 6px 5px 10px;border-radius:12px;background:var(--soft)}',
    '.fext{font-size:10.5px;font-weight:700;color:var(--accent-2);text-transform:uppercase;min-width:30px}',
    '.fname{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}',
    '.plist{display:flex;flex-direction:column;gap:6px;margin-top:8px}',
    '.pitem{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 13px;border:1px solid var(--line);border-radius:12px;background:var(--card);font:inherit;color:var(--ink);cursor:pointer;text-align:left}',
    '.pitem:hover{border-color:var(--accent)}',
    '.pitem.on{border-color:var(--accent);background:var(--soft);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 16%,transparent)}',
    '.pname{font-weight:600;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.chipsw{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}',
    '.fl{display:flex;flex-direction:column;gap:5px;font-size:12.5px;font-weight:600;color:var(--ink-soft);margin-top:10px}',
    '.stepb label.chk{margin-top:10px}',
    '.sheetfoot{padding:14px 22px 16px;background:var(--card);border-top:1px solid var(--line)}',
    '.sheetfoot .row{margin-top:10px}',
    '.where{font-size:13px;color:var(--ink-soft)}',
    '.where b{color:var(--ink)}',
    'label>input[type=text],label>input[type=password],label>input[type=time],label>select,label>textarea{font-weight:400;color:var(--ink)}',
    '.hide{display:none!important}'
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

  /* карточка-блок и сворачиваемый блок — общий вид всех вкладок */
  function card(title, kids, cls) { return el('div', { class: 'sec' + (cls ? ' ' + cls : '') }, (title ? [el('div', { class: 'sech', text: title })] : []).concat(kids)); }
  function fold(title, kids, open) { var d = el('details', { class: 'sec fold' }, [el('summary', { text: title })].concat(kids)); if (open) d.open = true; return d; }
  /* плитка «Загрузить в Smartcat» — открывает окно загрузки */
  function upScTile(sub) {
    return el('div', { class: 'qa' }, [el('button', { class: 'qitem', type: 'button', onclick: function () { upScOpen(); } }, [
      el('span', { class: 'qic', text: '⬆' }), el('span', {}, [el('b', { text: 'Загрузить файлы в Smartcat' }), el('span', { class: 'muted', text: sub })])])]);
  }
  var host = el('div', { id: 'wl-export-host' });
  var root = host.attachShadow({ mode: 'open' });
  try {
    var sheet = new CSSStyleSheet(); sheet.replaceSync(CSS); root.adoptedStyleSheets = [sheet];
  } catch (e) {
    root.appendChild(el('style', { text: CSS }));
  }

  /* шрифт Onest (из расширения, данными — CSP Weblate не мешает); в закладке — системный */
  if (HAS_EXT && !window.__wlxFonts) {
    window.__wlxFonts = 1;
    var FONT_RANGES = { cyrillic: 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116',
      latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD' };
    scCall('ui-fonts').then(function (list) {
      list.forEach(function (f) {
        var bin = atob(f.b64), b = new Uint8Array(bin.length);
        for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
        var ff = new FontFace('Onest', b.buffer, { weight: String(f.w), style: 'normal', unicodeRange: FONT_RANGES[f.s] });
        document.fonts.add(ff); ff.load().catch(function () {});
      });
    }).catch(function () { window.__wlxFonts = 0; });
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
  englishApart.checked = false;   // английский в архив не кладём вообще — он уходит в Smartcat
  englishApart.addEventListener('change', function () { sset('wlx_en', englishApart.checked ? '1' : '0'); });
  var skipEnglish = el('input', { type: 'checkbox' });
  skipEnglish.checked = true;
  skipEnglish.addEventListener('change', function () { sset('wlx_noen', skipEnglish.checked ? '1' : '0'); });
  var byPlatform = el('input', { type: 'checkbox' });
  byPlatform.checked = true;      // всегда отдельный zip на платформу: ДДММГГ_web / _iOS / _android
  byPlatform.addEventListener('change', function () { sset('wlx_byplat', byPlatform.checked ? '1' : '0'); });
  /* ---------- шаблоны языков ---------- */
  var TPL_AUTO = '__auto', TPL_MANUAL = '';
  var LANG_TPL_DEFAULTS = [
    { name: '[Магазинка] Веб', bases: ['en', 'ka', 'kk', 'uz', 'ky', 'hy', 'tg', 'am', 'az'], plat: 'web' },
    { name: '[Магазинка] Android и iOS', bases: ['en', 'ka', 'kk', 'uz', 'ky', 'hy', 'tg', 'az'], plat: 'mobile' }
  ];
  function langTemplates() {
    var custom = [];
    try { custom = JSON.parse(sget('wlx_langtpl') || '[]'); } catch (e) {}
    var names = custom.map(function (t) { return t.name; });
    return LANG_TPL_DEFAULTS.filter(function (t) { return names.indexOf(t.name) < 0; }).concat(custom.map(function (t) {
      var d = LANG_TPL_DEFAULTS.filter(function (x) { return x.name === t.name; })[0];
      return { name: t.name, bases: t.bases, plat: d ? d.plat : null, custom: true };
    }));
  }
  function tplByPlat(pl) {
    var key = pl === 'web' ? 'web' : 'mobile';
    /* языки из текущего сетапа (⚙), если заданы */
    var own = scCfg && (key === 'web' ? scCfg.langWeb : scCfg.langMob);
    if (own && String(own).trim()) return { name: key === 'web' ? 'Веб' : 'Android и iOS', bases: String(own).trim().toLowerCase().split(/[\s,;]+/), plat: key };
    return langTemplates().filter(function (t) { return t.plat === key; })[0];
  }
  /* в режиме «Авто» у каждого компонента свои языки: веб — по шаблону «Веб», android/ios — по «Android и iOS» */
  function tplLangsFor(x, checked) {
    if (tplSel.value !== TPL_AUTO) return checked;
    var t = tplByPlat(scPlatform(x.p, x.c));
    if (!t) return checked;
    var pick = mtPick(checked, t.bases);
    return checked.filter(function (c) { return pick.indexOf(c) >= 0; });
  }
  var tplSel = el('select', { class: 'presel', style: 'width:auto' });
  var tplHint = el('div', { class: 'muted' });
  function tplRefresh() {
    var cur = sget('wlx_langtpl_cur');
    if (cur === null) cur = TPL_AUTO;
    tplSel.textContent = '';
    tplSel.appendChild(el('option', { value: TPL_AUTO, text: 'Авто: веб и android/iOS — каждый по своему шаблону' }));
    langTemplates().forEach(function (t) { tplSel.appendChild(el('option', { value: t.name, text: t.name + ' — ' + t.bases.join(' ').toUpperCase() })); });
    tplSel.appendChild(el('option', { value: TPL_MANUAL, text: 'Вручную (как отмечу)' }));
    tplSel.value = cur;
    if (tplSel.value !== cur) tplSel.value = TPL_AUTO;
  }
  function tplApply() {
    var v = tplSel.value, inputs = Array.prototype.slice.call(langsBox.querySelectorAll('input'));
    tplHint.textContent = '';
    if (v === TPL_MANUAL || !inputs.length) return;
    var codes = inputs.map(function (i) { return i.value; }), pick = [];
    if (v === TPL_AUTO) {
      var plats = {};
      (comps || []).forEach(function (x) { plats[scPlatform(x.p, x.c) === 'web' ? 'web' : 'mobile'] = 1; });
      Object.keys(plats).forEach(function (k) { var t = tplByPlat(k === 'web' ? 'web' : 'android'); if (t) pick = pick.concat(mtPick(codes, t.bases)); });
      if (plats.web && plats.mobile) tplHint.textContent = 'Веб получит языки шаблона «Веб», android/iOS — шаблона «Android и iOS» (лишние языки компоненту не выгружаются).';
    } else {
      var t = langTemplates().filter(function (x) { return x.name === v; })[0];
      if (t) pick = mtPick(codes, t.bases);
    }
    inputs.forEach(function (i) { i.checked = pick.indexOf(i.value) >= 0; });
  }
  tplSel.addEventListener('change', function () { sset('wlx_langtpl_cur', tplSel.value); tplApply(); });
  var tplSave = el('button', { class: 'b g s', text: '💾 Сохранить как шаблон', onclick: function () {
    var checked = Array.prototype.map.call(langsBox.querySelectorAll('input:checked'), function (i) { return i.value; });
    if (!checked.length) { tplHint.textContent = 'Сначала отметь языки'; return; }
    var cur = tplSel.value && tplSel.value !== TPL_AUTO ? tplSel.value : '';
    var name = prompt('Название шаблона (то же название — перезапишет):', cur || '[Магазинка] ');
    if (!name || !name.trim()) return;
    name = name.trim();
    var custom = [];
    try { custom = JSON.parse(sget('wlx_langtpl') || '[]'); } catch (e) {}
    var bases = checked.map(baseLang).filter(function (x, i, a) { return a.indexOf(x) === i; });
    custom = custom.filter(function (t) { return t.name !== name; }).concat([{ name: name, bases: bases }]);
    sset('wlx_langtpl', JSON.stringify(custom)); sset('wlx_langtpl_cur', name);
    tplRefresh(); tplHint.textContent = 'Шаблон «' + name + '» сохранён: ' + bases.join(' ').toUpperCase();
  } });
  var tplDel = el('button', { class: 'b g s', text: '✕', title: 'Удалить свой шаблон (у стандартного — вернуть как было)', onclick: function () {
    var v = tplSel.value, custom = [];
    try { custom = JSON.parse(sget('wlx_langtpl') || '[]'); } catch (e) {}
    if (!custom.some(function (t) { return t.name === v; })) { tplHint.textContent = 'Это стандартный шаблон — его можно изменить: отметь языки и «Сохранить как шаблон» с тем же названием.'; return; }
    if (!confirm('Удалить шаблон «' + v + '»?')) return;
    sset('wlx_langtpl', JSON.stringify(custom.filter(function (t) { return t.name !== v; })));
    tplRefresh(); tplApply();
  } });
  tplRefresh();
  var langSec = card('Языки', [
    el('div', { class: 'row' }, [
      el('span', { class: 'muted', text: 'Шаблон:' }), tplSel, tplSave, tplDel,
      el('button', { class: 'b g s', text: 'Все', onclick: function () { setAll(true); } }),
      el('button', { class: 'b g s', text: 'Снять все', onclick: function () { setAll(false); } })
    ]),
    tplHint,
    langsBox,
    el('details', { class: 'more' }, [el('summary', { text: 'Ещё настройки: «требует правки», плюралки, раскладка архива' }),
      el('label', { class: 'muted blk' }, [fuzzy, ' включать строки «требует правки»']),
      el('label', { class: 'muted blk' }, [pluralsJson, ' плюралки (множественное число) — отдельным .json, как у нас принято']),
      el('div', { class: 'lbl', style: 'margin-top:12px', text: 'Внутри архива' }),
      layoutBox]),
    el('p', { class: 'muted', text: 'Архивы сохранятся сами: ДДММГГ_web.zip / _iOS.zip / _android.zip, без английского.' }),
    el('div', { class: 'row' }, [goBtn]),
    err2
  ], 'hide');
  var resSec = card('Результат', [progText, el('div', { class: 'bar' }, [barFill]), results], 'hide');

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
    el('p', { class: 'sub', text: 'Своя выгрузка: любые ссылки и языки галочками. Для обычной работы — 🏠 Главная.' }),
    card('Ссылки', [exportPresets, links, el('div', { class: 'row' }, [loadBtn, clearBtn, restoreBtn, info]), err1, compList]),
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
  var salvageOn = el('input', { type: 'checkbox' });
  salvageOn.checked = sget('wlx_salvage') !== '0';
  salvageOn.addEventListener('change', function () { sset('wlx_salvage', salvageOn.checked ? '1' : '0'); });
  var varSkip = el('input', { type: 'checkbox' });
  varSkip.checked = sget('wlx_varskip') !== '0';
  varSkip.addEventListener('change', function () { sset('wlx_varskip', varSkip.checked ? '1' : '0'); renderPreview(); });
  var upResults = el('div', { class: 'blk' });
  var modeSum = el('summary');
  function modeSumUpd() {
    var t = function (sel) { return sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : ''; };
    modeSum.textContent = 'Как загружать: ' + t(optMethod).toLowerCase() + ' · ' + t(optConf).toLowerCase();
  }
  [optMethod, optFuzzy, optConf].forEach(function (x) { x.addEventListener('change', modeSumUpd); });
  modeSumUpd();
  var upSec = card('Загрузка', [
    el('label', { class: 'muted blk' }, [varSkip, ' строки с ошибкой не загружать (сломанная переменная, мусор от машперевода) — остальное загрузится']),
    el('label', { class: 'muted blk' }, [salvageOn, ' из «рассуждений» ИИ вытаскивать сам перевод и загружать его «На правку» — чтобы осталось только проверить']),
    el('details', { class: 'more' }, [modeSum,
      el('div', { class: 'opts' }, [
        el('label', {}, ['Режим загрузки файла', optMethod]),
        el('label', {}, ['Обработка строк, отмеченных «На правку»', optFuzzy]),
        el('label', {}, ['Разрешение конфликтов', optConf])
      ]),
      el('p', { class: 'muted', text: 'Машинный перевод из Smartcat эти настройки не использует: он всегда идёт только в непереведённые строки. «Заменить файл» нет специально — в файлах только часть строк.' })]),
    el('div', { class: 'row' }, [upBtn]),
    upResults
  ], 'hide');
  var importPane = el('div', { class: 'hide' }, [
    el('p', { class: 'sub', text: 'Перетащи файлы от подрядчиков — компонент и язык определятся сами.' }),
    card('Файлы от подрядчиков', [drop, errU, preview]),
    upSec
  ]);

  /* ----- вкладка «Smartcat»: стандартный набор одной кнопкой ----- */
  var SC_DEFAULT_LINKS = 'https://weblate.wb.ru/projects/global_site/wb-android/\nhttps://weblate.wb.ru/projects/global_site/wb-ios_new/';
  var scLinks = el('textarea', { class: 'small' });
  scLinks.value = sget('wlx_mt_links') || SC_DEFAULT_LINKS;
  var scRun = el('button', { class: 'b big g', text: 'Выгрузить непереведённое', onclick: function () { runScPreset(false); } });
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
  var scBack = el('div', { class: 'scimp card hide' });
  /* сетап Smartcat — быстрый выбор прямо на вкладке */
  var scSetupQuick = el('select', { class: 'presel' });
  var scSetupNote = el('span', { class: 'muted' });
  /* забрать готовые переводы из любого проекта Smartcat (не только из отправленного расширением) */
  var scImpProject = el('input', { type: 'text', placeholder: 'ссылка на проект в Smartcat; пусто — проект из сетапа' });
  var scImpFilter = el('input', { type: 'text', placeholder: 'фильтр по имени файла, например wb-web (необязательно)' });
  var scImpMsg = el('span', { class: 'muted' });
  var scImpList = el('div');
  var scImpBtn = el('button', { class: 'b g s', text: '🔄 Обновить', onclick: function () { listScFiles(); } });
  var scImpMode = select([['', 'только в непереведённые строки'], ['replace-translated', 'заменять и переведённые строки']], sget('wlx_scimp_mode') || '');
  scImpMode.className = 'presel';
  scImpMode.addEventListener('change', function () { sset('wlx_scimp_mode', scImpMode.value); });
  var scImpBody = el('div', { class: 'hide' }, [
    el('div', { class: 'row' }, [scImpMsg, scImpBtn]),
    scImpList
  ]);
  scImpBtn.style.marginLeft = 'auto';
  var scImpOpen = el('button', { class: 'b s', text: 'Открыть', onclick: function () {
    var open = scImpBody.classList.toggle('hide') === false;
    scImpOpen.textContent = open ? 'Свернуть' : 'Открыть';
    scImpOpen.className = open ? 'b g s' : 'b s';
    if (open && !scImpList.childNodes.length) listScFiles();
  } });
  var scImpBox = el('div', { class: 'scimp card' }, [
    el('div', { class: 'head' }, [el('h3', { text: 'Все файлы в Smartcat → в Weblate' }), scImpOpen]),
    el('p', { class: 'hint', text: 'Все проекты Smartcat → папки → файлы, даже если файлы грузили руками (например, веб). Можно и файлы, которые ещё в работе.' }),
    scImpBody
  ]);
  scImpProject.style.flex = '1'; scImpProject.style.minWidth = '240px'; scImpProject.style.margin = '0';
  scRun.textContent = HAS_EXT ? 'Только скачать ZIP' : 'Выгрузить непереведённое';
  scRun.className = HAS_EXT ? 'b g' : 'b big';
  var scPane = el('div', { class: 'hide' }, [
    HAS_EXT ? el('div', { class: 'setrow' }, ['Сетап:', scSetupQuick, scSetupNote]) : null,
    HAS_EXT ? upScTile('Свои файлы в проект и папку — можно создать новые') : null,
    el('div', { class: 'card' }, [
      el('h3', { text: 'На машинный перевод' }),
      el('p', { class: 'hint', text: 'Непереведённое из android и iOS по языкам проекта (⚙ → Проект) → ZIP и Smartcat.' }),
      el('div', { class: 'row' }, HAS_EXT ? [scRunSend, scRun] : [scRun]),
      el('details', {}, [el('summary', { text: 'Компоненты и наборы' }),
        scPresets,
        scLinks,
        el('div', { class: 'row' }, [el('button', { class: 'b g s', text: 'Вернуть стандартные', onclick: function () { scLinks.value = SC_DEFAULT_LINKS; sset('wlx_mt_links', ''); } })])]),
      el('div', { class: 'hide', id: 'wlx-sc-prog' }, [scProg, el('div', { class: 'bar' }, [scBar])]),
      scOut
    ]),
    scBack,
    HAS_EXT ? scImpBox : null
  ]);
  function docReady(d) {
    if (d.documentDisassemblingStatus && d.documentDisassemblingStatus !== 'success') return false;
    if (String(d.status || '').toLowerCase() === 'completed') return true;
    var st = d.workflowStages || [];
    return st.length > 0 && st.every(function (x) { return (x.progress || 0) >= 100; });
  }
  function docProgress(d) {
    var st = d.workflowStages || [];
    return st.length ? Math.round(Math.min.apply(null, st.map(function (x) { return x.progress || 0; }))) : null;
  }
  /* блок 3: все проекты → папки → файлы */
  var scProjCache = null, scOpenPr = null;
  function listScFiles() {
    if (scOpenPr) return openScProject(scOpenPr.id);
    return listScProjects(true);
  }
  function scGuard() {
    return loadScConfig().then(function (c) { if (!c || !c.accountId || !c.hasKey) throw new Error('Smartcat не подключён (⚙)'); return c; });
  }
  function listScProjects(reload) {
    scOpenPr = null;
    scImpBtn.disabled = true; scImpList.textContent = ''; scImpMsg.className = 'muted'; scImpMsg.textContent = 'Загружаю проекты…';
    var cfg;
    scGuard().then(function (c) {
      cfg = c;
      return scProjCache && !reload ? scProjCache : scCall('sc-projects').then(function (l) { scProjCache = l; return l; });
    }).then(function (list) {
      /* проект из сетапа — наверх */
      var ref = String(cfg.project || SC_PROJECT_DEFAULT), idm = /([0-9a-f]{8}-[0-9a-f-]{27,})/i.exec(ref);
      var pin = list.filter(function (p) { return idm ? p.id === idm[1] : p.name === ref; })[0];
      renderScProjects(pin ? [pin].concat(list.filter(function (p) { return p !== pin; })) : list, pin);
    }).catch(function (e) { scImpMsg.className = 'red'; scImpMsg.textContent = '✗ ' + e.message; })
      .then(function () { scImpBtn.disabled = false; });
  }
  function renderScProjects(list, pin) {
    scImpList.textContent = '';
    scImpMsg.className = 'muted'; scImpMsg.textContent = 'Проектов: ' + list.length;
    var tbody = el('tbody');
    var crumbs = el('div', { class: 'crumbs' }, [el('b', { text: '📂 Все проекты Smartcat' })]);
    function draw() {
      tbody.textContent = '';
      var raw = scImpFilter.value.trim(), q = raw.toLowerCase().split(/\s+/).filter(Boolean);
      var idm = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(raw);
      if (idm) {
        var tr0 = el('tr', { class: 'folder' }, [el('td', {}, [el('b', { text: '🔗 Открыть проект по ссылке' })]), el('td', { colspan: '3', class: 'muted', text: idm[1] })]);
        tr0.addEventListener('click', function () { openScProject(idm[1]); });
        tbody.appendChild(tr0);
      }
      var shown = 0;
      list.forEach(function (p) {
        if (q.length && !idm && !q.every(function (w) { return String(p.name).toLowerCase().indexOf(w) >= 0; })) return;
        if (idm && p.id !== idm[1]) return;
        if (++shown > 300) return;
        var d = Date.parse(p.modified || p.created || '');
        var tr = el('tr', { class: 'folder', title: 'Открыть проект' }, [
          el('td', {}, [el('b', { text: (p === pin ? '⭐ ' : '📁 ') + p.name })]),
          el('td', { class: 'muted', text: (p.targetLanguages || []).length ? p.targetLanguages.length + ' яз.' : '' }),
          el('td', { class: 'muted', text: d ? new Date(d).toLocaleDateString('ru-RU') : '' }),
          el('td', { class: String(p.status).toLowerCase() === 'completed' ? 'ok' : 'muted', text: projStatus(p.status) })]);
        tr.addEventListener('click', function () { openScProject(p.id); });
        tbody.appendChild(tr);
      });
      if (shown > 300) tbody.appendChild(el('tr', {}, [el('td', { colspan: '4', class: 'muted', text: 'и ещё ' + (shown - 300) + ' — уточни поиск' })]));
      if (!tbody.childNodes.length) tbody.appendChild(el('tr', {}, [el('td', { colspan: '4', class: 'muted', text: 'Ничего не нашлось' })]));
    }
    scImpFilter.value = '';
    scImpFilter.oninput = draw;
    scImpFilter.placeholder = '🔍 поиск проекта по названию — или вставь ссылку на проект';
    scImpList.appendChild(scImpFilter);
    scImpList.appendChild(crumbs);
    scImpList.appendChild(el('div', { class: 'ftable' }, [el('table', {}, [
      el('thead', {}, [el('tr', {}, [el('th', { text: 'Проект' }), el('th', { text: 'Языки' }), el('th', { text: 'Изменён' }), el('th', { text: 'Статус' })])]), tbody])]));
    draw();
  }
  function projStatus(s) {
    s = String(s || '').toLowerCase();
    return { created: 'создан', inprogress: 'в работе', completed: '✓ завершён', canceled: 'отменён', cancelled: 'отменён' }[s] || s;
  }
  function openScProject(id) {
    scImpBtn.disabled = true; scImpMsg.className = 'muted'; scImpMsg.textContent = 'Открываю проект…';
    scGuard().then(function () { return scCall('sc-project', { id: id }); }).then(function (full) {
      scOpenPr = { id: full.id || id, name: full.name || id };
      scImpFilter.value = '';
      renderScFiles(scOpenPr, full.documents || []);
    }).catch(function (e) { scImpMsg.className = 'red'; scImpMsg.textContent = '✗ ' + e.message; })
      .then(function () { scImpBtn.disabled = false; });
  }
  /* файлы проекта как в Smartcat: папки и файлы вне папок, клик по папке — внутрь; поиск — по всем файлам */
  /* что уже загружено в Weblate из блока 3 — по id документа Smartcat (на этом компьютере) */
  function scDone() { try { return JSON.parse(sget('wlx_scdone') || '{}'); } catch (e) { return {}; } }
  function markScDone(todo) {
    var m = scDone(), now = new Date().toISOString(), ch = 0;
    todo.forEach(function (u) { if (u.sent && u.scDocId) { m[u.scDocId] = now; ch++; } });
    if (!ch) return;
    var keys = Object.keys(m);
    if (keys.length > 20000) keys.sort(function (a, b) { return m[a] < m[b] ? -1 : 1; }).slice(0, keys.length - 20000).forEach(function (k) { delete m[k]; });
    sset('wlx_scdone', JSON.stringify(m));
    if (scImpRedraw) scImpRedraw();
  }
  function shortDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2); }
  var scImpRedraw = null, scImpRes = null, scImpUnpick = null;
  var scImpHide = el('input', { type: 'checkbox' });
  scImpHide.checked = sget('wlx_scimp_hide') === '1';
  scImpHide.addEventListener('change', function () { sset('wlx_scimp_hide', scImpHide.checked ? '1' : '0'); if (scImpRedraw) scImpRedraw(); });
  function renderScFiles(pr, docs) {
    scImpList.textContent = '';
    var readyN = docs.filter(docReady).length;
    scImpMsg.className = 'muted';
    scImpMsg.textContent = 'Проект «' + pr.name + '»: файлов ' + docs.length + ', готово ' + readyN;
    if (!docs.length) return;
    var files = docs.map(function (d) {
      var path = String(d.fullPath || d.path || '').replace(/^\/+/, ''), i = path.lastIndexOf('/'), t = Date.parse(d.creationDate || d.created || '');
      var folder = i > 0 ? path.slice(0, i) : '';
      return { d: d, t: t || 0, folder: folder, parts: folder ? folder.split('/') : [], day: t ? new Date(t).toLocaleDateString('ru-RU') : '',
        hay: (d.name + ' ' + d.targetLanguage + ' ' + folder + ' ' + (t ? new Date(t).toLocaleDateString('ru-RU') : '')).toLowerCase() };
    }).sort(function (a, b) { return a.d.name.localeCompare(b.d.name) || String(a.d.targetLanguage).localeCompare(String(b.d.targetLanguage)); });
    var picked = {}, cur = [];
    var under = function (path) { return files.filter(function (f) { return path.every(function (p, k) { return f.parts[k] === p; }); }); };
    var cbAll = el('input', { type: 'checkbox', title: 'Отметить всё, что видно' });
    var crumbs = el('div', { class: 'crumbs' });
    var tbody = el('tbody');
    var count = el('span', { class: 'muted' });
    var goBtn = el('button', { class: 'b', onclick: function () { takeScFiles(sel(), goBtn, true); } });
    var takeBtn = el('button', { class: 'b g', text: 'Сначала посмотреть', onclick: function () { takeScFiles(sel(), takeBtn, false); } });
    var zipBtn = el('button', { class: 'b g', text: '⬇ Скачать ZIP', title: 'Скачать отмеченные с именами как в Weblate (по папкам компонентов)', onclick: function () { takeScFiles(sel(), zipBtn, 'zip'); } });
    var clearBtn = el('button', { class: 'b g s', text: 'Снять всё', onclick: function () { picked = {}; draw(); } });
    function sel() { return files.filter(function (f) { return picked[f.d.id]; }).map(function (f) { return f.d; }); }
    function setMany(list, on) { list.forEach(function (f) { if (on) picked[f.d.id] = 1; else delete picked[f.d.id]; }); }
    function state(cb, list) {
      var n = list.filter(function (f) { return picked[f.d.id]; }).length;
      cb.checked = list.length > 0 && n === list.length; cb.indeterminate = n > 0 && n < list.length;
    }
    function status(list) {
      var r = list.filter(function (f) { return docReady(f.d); }).length;
      return r === list.length ? '✓ готово' : 'готово ' + r + ' из ' + list.length;
    }
    var visible = [], done = scDone();
    function isDone(f) { return !!done[f.d.id]; }
    function shown(list) { return scImpHide.checked ? list.filter(function (f) { return !isDone(f); }) : list; }
    function draw() {
      done = scDone();
      tbody.textContent = ''; crumbs.textContent = ''; visible = [];
      var q = scImpFilter.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (q.length) {
        /* поиск: все подходящие файлы из всех папок */
        crumbs.appendChild(el('a', { href: '#', text: '📂 Все проекты', onclick: function (e) { e.preventDefault(); listScProjects(false); } }));
        crumbs.appendChild(el('span', { class: 'muted', text: ' › ' + pr.name + ' — найдено по всему проекту:' }));
        /* сначала папки (по названию), потом файлы */
        var paths = {};
        files.forEach(function (f) { f.parts.forEach(function (x, k) { paths[f.parts.slice(0, k + 1).join('/')] = 1; }); });
        Object.keys(paths).filter(function (path) { var low = path.toLowerCase(); return q.every(function (w) { return low.indexOf(w) >= 0; }); })
          .sort().forEach(function (path) { folderRow(path.split('/'), path); });
        shown(files.filter(function (f) { return q.every(function (w) { return f.hay.indexOf(w) >= 0; }); })).forEach(function (f) { fileRow(f, true); });
      } else {
        crumbs.appendChild(el('a', { href: '#', text: '📂 Все проекты', onclick: function (e) { e.preventDefault(); listScProjects(false); } }));
        crumbs.appendChild(document.createTextNode(' › '));
        var home = cur.length ? el('a', { href: '#', text: pr.name, onclick: function (e) { e.preventDefault(); cur = []; draw(); } }) : el('b', { text: pr.name });
        crumbs.appendChild(home);
        cur.forEach(function (p, k) {
          crumbs.appendChild(document.createTextNode(' › '));
          crumbs.appendChild(k === cur.length - 1 ? el('b', { text: p })
            : el('a', { href: '#', text: p, onclick: function (e) { e.preventDefault(); cur = cur.slice(0, k + 1); draw(); } }));
        });
        var here = under(cur), subs = {};
        here.forEach(function (f) { if (f.parts.length > cur.length) (subs[f.parts[cur.length]] = subs[f.parts[cur.length]] || []).push(f); });
        Object.keys(subs).sort(function (a, b) {
          var ta = Math.max.apply(null, subs[a].map(function (f) { return f.t; })), tb = Math.max.apply(null, subs[b].map(function (f) { return f.t; }));
          return tb - ta || b.localeCompare(a);
        }).forEach(function (name) { folderRow(cur.concat([name]), name); });
        shown(here.filter(function (f) { return f.parts.length === cur.length; })).forEach(function (f) { fileRow(f, false); });
        if (!tbody.childNodes.length) tbody.appendChild(el('tr', {}, [el('td', { colspan: '5', class: 'muted', text: 'Пусто' })]));
      }
      state(cbAll, visible);
      var n = sel().length;
      count.textContent = 'отмечено файлов: ' + n;
      goBtn.textContent = '⬆ Загрузить в Weblate (' + n + ')';
      goBtn.disabled = takeBtn.disabled = zipBtn.disabled = !n;
      clearBtn.classList.toggle('hide', !n);
    }
    function folderRow(path, label) {
      var all = under(path), list = shown(all), cb = el('input', { type: 'checkbox', title: 'Отметить всю папку' });
      if (!list.length) return;                                      // всё загружено и скрыто
      var dn = all.filter(isDone), last = dn.map(function (f) { return done[f.d.id]; }).sort().pop();
      var badge = dn.length === all.length ? el('span', { class: 'badge b-ok', text: '✓ в Weblate ' + fmtDate(last) })
        : dn.length ? el('span', { class: 'badge b-part', text: 'загружено ' + dn.length + ' из ' + all.length }) : el('span', { class: 'badge b-new', text: 'новое' });
      state(cb, list); visible = visible.concat(list.filter(function (f) { return visible.indexOf(f) < 0; }));
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { setMany(list, cb.checked); draw(); });
      var langs = list.map(function (f) { return f.d.targetLanguage; }).filter(function (x, i, a) { return x && a.indexOf(x) === i; });
      var tr = el('tr', { class: 'folder' + (dn.length === all.length ? ' done' : ''), title: 'Открыть папку' }, [el('td', {}, [cb]), el('td', {}, [el('b', { text: '📁 ' + label }), badge]),
        el('td', { class: 'muted', text: langs.length === 1 ? langs[0] : langs.length + ' яз.' }),
        el('td', { class: 'muted', text: 'файлов ' + all.length }),
        el('td', { class: all.every(function (f) { return docReady(f.d); }) ? 'ok' : 'muted', text: status(all) })]);
      tr.addEventListener('click', function () { cur = path.slice(); scImpFilter.value = ''; draw(); });
      tbody.appendChild(tr);
    }
    function fileRow(f, withPath) {
      if (visible.indexOf(f) < 0) visible.push(f);
      var cb = el('input', { type: 'checkbox' }), ok = docReady(f.d), pg = docProgress(f.d);
      cb.checked = !!picked[f.d.id];
      cb.addEventListener('click', function (e) { e.stopPropagation(); });
      cb.addEventListener('change', function () { setMany([f], cb.checked); draw(); });
      var tr = el('tr', isDone(f) ? { class: 'done' } : {}, [el('td', {}, [cb]),
        el('td', {}, [document.createTextNode(scDocKey(f.d.name)), isDone(f) ? el('span', { class: 'badge b-ok', text: '✓ ' + shortDate(done[f.d.id]), title: 'загружено в Weblate ' + fmtDate(done[f.d.id]) }) : null]),
        el('td', { text: f.d.targetLanguage || '' }),
        el('td', { class: 'muted', text: withPath ? [f.folder ? '📁 ' + f.folder : '', f.day].filter(Boolean).join(' · ') : f.day }),
        el('td', { class: ok ? 'ok' : 'muted', text: ok ? '✓ готово' : 'в работе' + (pg != null ? ' ' + pg + '%' : '') })]);
      tr.addEventListener('click', function () { setMany([f], !picked[f.d.id]); draw(); });
      tbody.appendChild(tr);
    }
    cbAll.addEventListener('change', function () { setMany(visible, cbAll.checked); draw(); });
    scImpFilter.oninput = draw;
    scImpFilter.placeholder = '🔍 поиск по папкам и файлам проекта — например «280926» или «wb-web kk»';
    var t = el('table', {}, [el('thead', {}, [el('tr', {}, [el('th', {}, [cbAll]), el('th', { text: 'Имя' }), el('th', { text: 'Язык' }), el('th', { text: 'Дата / файлов' }), el('th', { text: 'Статус' })])]), tbody]);
    scImpList.appendChild(scImpFilter);
    scImpList.appendChild(crumbs);
    scImpList.appendChild(el('div', { class: 'ftable' }, [t]));
    scImpList.appendChild(el('div', { class: 'row' }, [el('label', { class: 'chk' }, [scImpHide, 'скрыть уже загруженное'])]));
    scImpList.appendChild(el('div', { class: 'row' }, [el('span', { class: 'muted', text: 'Как загружать:' }), scImpMode, count, clearBtn]));
    scImpList.appendChild(el('div', { class: 'row' }, [goBtn, takeBtn, zipBtn]));
    scImpRes = el('div', { class: 'res hide' });
    scImpList.appendChild(scImpRes);
    scImpRedraw = draw;
    scImpUnpick = function (ids) { ids.forEach(function (id) { delete picked[id]; }); draw(); };
    draw();
  }
  /* скачать отмеченные документы и положить в «Загрузить обратно» как обычные файлы */
  /* загрузка из блока 3 с результатом прямо здесь, без перехода на другую вкладку */
  function inlineUpload(found) {
    var box = scImpRes;
    if (!box) return;
    box.classList.remove('hide'); box.textContent = '';
    var line = el('div', { class: 'line', text: 'Загружаю…' }), fill = el('div');
    box.appendChild(line); box.appendChild(el('div', { class: 'bar' }, [fill]));
    scImpMsg.className = 'muted'; scImpMsg.textContent = 'Забрала ' + found.length + ' файл(ов) из Smartcat — загружаю, результат ниже';
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    var skipped = found.filter(function (u) { return u.error || u.skip; });
    runUpload(function (u) { return found.indexOf(u) >= 0; }, {
      tick: function (ok, bad, total, took) {
        fill.style.width = Math.round(100 * (ok + bad) / Math.max(1, total)) + '%';
        line.textContent = 'Загружаю: ' + (ok + bad) + ' из ' + total + ' · ' + took + ' — Weblate обрабатывает файлы одного компонента по очереди';
      },
      fail: function (e) { line.className = 'line red'; line.textContent = '✗ ' + friendly(e); },
      done: function (todo, opts, took) {
        box.textContent = '';
        var sentIds = todo.filter(function (u) { return u.sent && u.scDocId; }).map(function (u) { return u.scDocId; });
        if (scImpUnpick) scImpUnpick(sentIds);
        scImpMsg.className = todo.some(function (u) { return !u.sent; }) ? 'red' : 'ok';
        scImpMsg.textContent = todo.length ? 'Готово — результат ниже' : 'Загружать нечего';
        var sent = todo.filter(function (u) { return u.sent; }), failed = todo.filter(function (u) { return !u.sent; });
        var acc = sent.reduce(function (a, u) { return a + (Number(u.accepted) || 0); }, 0);
        var where = function (u) { return u.c + ' · ' + langName(u.lang); };
        var srch = function (u, key) { return '/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent('context:"' + key + '"'); };
        if (!todo.length) box.appendChild(el('div', { class: 'line', text: 'Загружать нечего — причины в списке на вкладке «Загрузить обратно»' }));
        else box.appendChild(el('div', { class: 'line' }, [el('b', { text: (failed.length ? '' : '✓ ') + 'Загружено ' + sent.length + ' из ' + todo.length }),
          document.createTextNode(' · строк принято ' + acc.toLocaleString('ru-RU') + ' · ' + took)]));
        box.appendChild(el('div', { class: 'bar' }, [el('div', { style: 'width:100%' })]));
        if (failed.length) box.appendChild(el('div', { class: 'line red', text: '✗ С ошибкой ' + failed.length + ': ' +
          failed.map(function (u) { return where(u) + ' — ' + (u.upError || 'не загружено'); }).join('; ') }));
        if (skipped.length) box.appendChild(el('div', { class: 'line muted', text: 'Пропущено ' + skipped.length + ': ' +
          skipped.map(function (u) { return (u.c ? where(u) : u.name.split('/').pop()) + ' — ' + (u.error || u.skip); }).join('; ') }));
        var fx = sent.filter(function (u) { return u.fixedKeys && u.fixedKeys.length; });
        if (fx.length) {
          var keys = {};
          fx.forEach(function (u) { u.fixedKeys.forEach(function (k) { (keys[k] = keys[k] || []).push(u); }); });
          var ln = el('div', { class: 'line' }, [document.createTextNode('⚠ Смарткат испортил строки — убрала, остальное загружено: ')]);
          Object.keys(keys).forEach(function (k, i) {
            if (i) ln.appendChild(document.createTextNode(', '));
            ln.appendChild(el('a', { href: srch(keys[k][0], k), target: '_blank', text: k }));
            ln.appendChild(document.createTextNode(' (' + keys[k][0].c + ', ' + keys[k].length + ' яз.)'));
          });
          box.appendChild(ln);
        }
        var vs = sent.filter(function (u) { return u.varSkipped; });
        if (vs.length) box.appendChild(el('div', { class: 'line red', text: '✗ Переменные: не загружено строк ' + vs.reduce(function (a, u) { return a + u.varSkipped; }, 0) +
          ' (сломанная или лишняя переменная) — список на вкладке «Загрузить обратно»' }));
        var der = sent.filter(function (u) { return u.derived; });
        if (der.length) box.appendChild(el('div', { class: 'line', text: 'ℹ Плюралки вынесла в .json: ' +
          der.map(function (u) { return u.c; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') + ' (' + der.length + ' файл.)' }));
        var prob = sent.filter(function (u) { return u.upSkipped || u.notFound; });
        if (prob.length) { var pd = el('details', {}, [el('summary', { text: 'Какие строки не легли — файлов: ' + prob.length })]); box.appendChild(pd); explainAll(prob, pd); }
        if (todo.length) {
          var ft = el('table', {}, [el('tr', {}, [el('th', { text: 'Файл' }), el('th', { text: 'Куда' }), el('th', { text: 'Статус' })])]);
          todo.forEach(function (u) { ft.appendChild(el('tr', {}, [el('td', { text: u.name.split('/').pop() }), el('td', { text: where(u) }), el('td', { class: u.sent ? 'ok' : 'red', text: u.status || '' })])); });
          box.appendChild(el('details', {}, [el('summary', { text: 'По файлам — ' + todo.length }), ft]));
          box.appendChild(el('details', {}, [el('summary', { text: 'Полный отчёт' }), uploadReport(todo, opts || {}, took)]));
        }
        box.appendChild(el('div', { class: 'row' }, [el('button', { class: 'b g s', text: 'Открыть на вкладке «Загрузить обратно»', onclick: function () { tab('imp'); } })]));
      }
    });
  }
  /* скачать отмеченное архивом с именами как в Weblate: <компонент>/global_site-<компонент>-<язык>.po, <компонент>_<язык>_plural form.json */
  function zipScFiles(found) {
    var files = [], bad = 0;
    found.forEach(function (u) {
      var json = /\.json$/i.test(u.name), text = u.orig || u.text || '';
      if (u.p && u.c && u.lang && !u.error) {
        files.push({ name: fileKey(u.c) + '/' + poName({ p: u.p, component: u.c, language: u.lang, ext: json ? 'json' : 'po' }), text: text });
      } else { bad++; files.push({ name: 'не распознано/' + (u.scName || u.name.split('/').pop()) + (json ? '.json' : '.po'), text: text }); }
    });
    files.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    saveBlob(makeZip(files), 'smartcat_' + today() + '.zip');
    scImpMsg.className = bad ? 'red' : 'ok';
    scImpMsg.textContent = '✓ Скачан архив: ' + (files.length - bad) + ' файл(ов) с именами как в Weblate' + (bad ? ', не распознано: ' + bad + ' (папка «не распознано»)' : '');
  }
  function takeScFiles(docs, btn, upload) {
    if (!docs.length) return;
    btn.disabled = true; scImpMsg.className = 'muted';
    var n = 0, found = [];
    scImpMsg.textContent = 'Скачиваю 0 из ' + docs.length + '…';
    pool(docs, 3, function (d) {
      var lang = String(d.targetLanguage || ''), base = scDocKey(d.name).replace(/\s*\(\d+\)$/, '').replace(/\([^)]*\)$/, '');
      /* язык в конце имени («b2b.en», «…-kk») убираем — язык берём из Smartcat */
      var lm = /^(.+)[._-]([a-z]{2,3})(?:[_-][A-Za-z0-9]+)?$/i.exec(base);
      if (lm && [baseLang(lang), 'ru', 'en'].indexOf(lm[2].toLowerCase()) >= 0) base = lm[1];
      if (lang) base += '-' + lang.replace(/-/g, '_');
      var path = String(d.fullPath || d.path || '').replace(/^\/+/, ''), cut = path.lastIndexOf('/');
      var dir = cut > 0 ? path.slice(0, cut).split('/').pop() : '';
      return scCall('sc-export', { documentId: d.id }).then(function (r) {
        var json = /^\s*[\[{]/.test(r.text);
        return detect({ name: 'Smartcat/' + (dir ? dir + '/' : '') + base + (json ? '.json' : '.po'), text: r.text }).then(function (u) { u.orig = r.text; u.scName = scDocKey(d.name); return u; });
      }).then(function (u) {
        /* AZ на машпереводе android/ios: в Smartcat это az-Latn, а в Weblate — обычный az (не az_Latn, не N11) */
        if (!u.error && u.p && u.c && baseLang(lang) === 'az' && scPlatform(u.p, u.c) !== 'web') {
          return withTranslations(u.p, u.c).then(function (w) {
            var code = w && matchLanguage('az', w.trs);
            if (code) u.lang = code;
            return u;
          });
        }
        /* язык берём из Smartcat, если в файле указан другой */
        if (!u.error && u.p && u.c && lang && (!u.lang || baseLang(u.lang) !== baseLang(lang))) {
          return withTranslations(u.p, u.c).then(function (w) {
            var code = w && (matchLanguage(lang.replace(/-/g, '_'), w.trs) || matchLanguage(baseLang(lang), w.trs));
            if (code) u.lang = code; else u.error = 'языка ' + lang + ' нет в компоненте «' + u.c + '»';
            return u;
          });
        }
        return u;
      }, function (e) { return { name: 'Smartcat/' + base + '.po', text: '', filled: 0, total: 0, error: e.message, scName: scDocKey(d.name), scDocId: d.id }; }).then(function (u) {
        u.note = 'из Smartcat';
        u.scImp = true;
        u.scDocId = d.id;
        /* Smartcat отдаёт неподтверждённое как «требует правки» — считаем строки с текстом, импортируем как переведённые */
        if (!u.error && !/\.json$/i.test(u.name)) {
          var inf = poInfo(u.text);
          u.filled = inf.withText; u.total = inf.total;
          u.skip = inf.withText ? null : 'в файле из Smartcat нет переведённых строк';
        }
        u.opts = { method: 'translate', fuzzy: 'approve', conflicts: scImpMode.value };
        found.push(u);
        scImpMsg.textContent = 'Скачиваю ' + (++n) + ' из ' + docs.length + '…';
      });
    }).then(function () {
      if (upload === 'zip') return zipScFiles(found);
      return withPlurals(found);
    }).then(function (found) {
      if (!found) return;
      found.forEach(function (u) {
        var kind = function (x) { return /\.json$/i.test(x.name); };
        if (!u.error) uploads = uploads.filter(function (x) { return !(x.p === u.p && x.c === u.c && x.lang === u.lang && kind(x) === kind(u)); });
        uploads.push(u);
      });
      renderPreview();
      var bad = found.filter(function (u) { return u.error; }).length;
      scImpMsg.className = bad ? 'red' : 'ok';
      if (upload) { inlineUpload(found); return; }
      scImpMsg.textContent = '✓ Забрала ' + (found.length - bad) + (bad ? ', не поняла куда: ' + bad : '') +
        ' — проверь и нажми «Загрузить в Weblate» на вкладке «Загрузить обратно»' +
        (bad ? '. Для нераспознанных выбери компонент в колонке «Куда»' : '');
      tab('imp');
    }).catch(function (e) { scImpMsg.className = 'red'; scImpMsg.textContent = '✗ ' + e.message; }).then(function () { btn.disabled = false; });
  }
  /* AZ — обычный az и для android, и для ios (az_N11 и подобные в набор не берём) */
  function presetLangs(x, codes) {
    var rest = codes.filter(function (c) { return !/_n\d+$/i.test(c); });
    var t = tplByPlat(scPlatform(x.p, x.c));   // языки проекта из ⚙ (по умолчанию — магазинка)
    return mtPick(rest, t ? t.bases : MT_LANGS).concat(mtPick(rest, EXPORT_ONLY_LANGS));
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
      if (autoSend) autoDone({ error: friendly(e) });
    }).then(function () { scRun.disabled = false; scRunSend.disabled = false; });
  }

  /* служебные флаги Weblate о состоянии строки («keep-needs-editing», «fuzzy») в Smartcat не отправляем:
     с ними Smartcat может не дать машперевод; форматные флаги (java-printf-format и т. п.) оставляем */
  function scSendText(t) {
    if (/^\s*[\[{]/.test(t)) return t;
    return t.replace(/^#,(.*)$/mg, function (m, flags) {
      var keep = flags.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^(fuzzy|keep-needs-editing)$/i.test(x); });
      return keep.length ? '#, ' + keep.join(', ') : '\u0000';
    }).replace(/^\u0000\n/mg, '');
  }
  function scFileName(r) { return r.p + '-' + fileKey(r.component) + '-' + r.language + '.po'; }
  /* запуск по расписанию: «🚀 Выгрузить и отправить», итог — в фон (уведомление) */
  var scAutoHook = null;
  function autoDone(r) { if (scAutoHook) { var h = scAutoHook; scAutoHook = null; h(r); } }
  function autoSend(slot) {
    return new Promise(function (resolve) {
      scAutoHook = function (r) { r.slot = slot; scCall('sc-auto-done', r).catch(function () {}); resolve(r); };
      tab('sc'); runScPreset(true);
      setTimeout(function () { autoDone({ error: 'не дождалась конца отправки за 15 минут — проверь вкладку Smartcat' }); }, 15 * 60000);
    });
  }
  function showScPreset(res, errs, autoSend) {
    if (!res.length) { scOut.appendChild(el('p', { text: 'Непереведённых строк нет — всё переведено 🎉' })); if (autoSend) autoDone({ nothing: true }); }
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
      var scZipBtn;
      scOut.appendChild(el('div', { class: 'row' }, [
        scZipBtn = el('button', { class: 'b', text: '⬇ Скачать ZIP ещё раз (' + plats.sort().join(' / ') + ' отдельно)', onclick: function () {
          /* английский в архив не кладём — он уходит в Smartcat */
          var files = res.filter(function (r) { return !isEnglish(r.language); }).map(function (r) { return { name: platDir(r.p, r.component) + '/' + scFileName(r), text: r.text }; });
          files.sort(function (a, b) { return a.name.localeCompare(b.name); });
          saveFiles(files, 'smartcat_' + ddmmyy() + '.zip');
        } })
      ]));
      scOut.appendChild(t);
      /* ZIP сохраняем сразу (кроме запуска по расписанию) */
      if (!scAutoHook && res.some(function (r) { return !isEnglish(r.language); })) scZipBtn.click();
      var toSc = res.filter(function (r) { return EXPORT_ONLY_LANGS.indexOf(baseLang(r.language)) < 0; });
      var only = res.filter(function (r) { return toSc.indexOf(r) < 0; }).map(function (r) { return r.language; })
        .filter(function (x, i, a) { return a.indexOf(x) === i; });
      if (only.length) scOut.appendChild(el('p', { class: 'muted', text: only.map(langName).join(', ') + ' — только в ZIP, в Smartcat не отправляется.' }));
      if (toSc.length) renderSmartcat(toSc, scOut).then(function (sendBtn) {
        if (autoSend && sendBtn) sendBtn.click();
        else if (autoSend) { scOut.appendChild(el('div', { class: 'err', text: 'Отправить не получилось: Smartcat не подключён (⚙)' })); autoDone({ error: 'Smartcat не подключён (⚙)' }); }
      });
      else if (autoSend) autoDone({ nothing: true });
    }
    if (errs.length) {
      var et = el('table');
      errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
      scOut.appendChild(el('details', { open: '' }, [el('summary', { text: 'Проблемы: ' + errs.length, class: 'red' }), et]));
    }
  }

  var tabHome = el('button', { class: 'tab on', 'data-t': 'home', text: 'Главная', onclick: function () { tab('home'); } });
  var tabExp = el('button', { class: 'tab', 'data-t': 'exp', text: 'Выгрузка вручную', onclick: function () { tab('exp'); } });
  var tabSc = el('button', { class: 'tab', 'data-t': 'sc', text: 'Smartcat', onclick: function () { tab('sc'); } });
  var tabImp = el('button', { class: 'tab', 'data-t': 'imp', text: 'Загрузить обратно', onclick: function () { tab('imp'); } });
  var curTab = 'home';
  function tab(t) {
    curTab = t;
    if (!settingsPane.classList.contains('hide')) showSettings(false);
    else if (scroller) scroller.scrollTop = 0;
    tabHome.classList.toggle('on', t === 'home');
    tabExp.classList.toggle('on', t === 'exp'); tabSc.classList.toggle('on', t === 'sc'); tabImp.classList.toggle('on', t === 'imp');
    homePane.classList.toggle('hide', t !== 'home');
    exportPane.classList.toggle('hide', t !== 'exp'); scPane.classList.toggle('hide', t !== 'sc'); importPane.classList.toggle('hide', t !== 'imp');
    if (t === 'home') homeRefreshSc();
  }


  /* ----- настройки Smartcat (только в расширении) ----- */
  var scServer = select([['eu', 'smartcat.com'], ['us', 'us.smartcat.com'], ['ea', 'ea.smartcat.com'], ['custom', 'свой адрес']], 'eu');
  var scCustom = el('input', { type: 'text', placeholder: 'https://…' });
  var scAccount = el('input', { type: 'text', placeholder: 'Account ID' });
  var scKey = el('input', { type: 'password', placeholder: 'API-ключ' });
  var scProject = el('input', { type: 'text', placeholder: 'ссылка на проект или название; пусто = ' + SC_PROJECT_DEFAULT });
  var scEnAndroid = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.android });
  var scEnIos = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.ios });
  var scEnWeb = el('input', { type: 'text', placeholder: SC_EN_DEFAULTS.web });
  var scLangWeb = el('input', { type: 'text', placeholder: 'en ka kk uz ky hy tg am az' });
  var scLangMob = el('input', { type: 'text', placeholder: 'en ka kk uz ky hy tg az' });
  /* сообщение в чат (Band): шаблон, вебхук, автоотправка — у каждого сетапа свои */
  var BAND_TPL_DEFAULT = 'Привет! Выгрузка {дата} · {проект}\n📦 Подрядчикам: {архивы}\n🤖 В Smartcat: {smartcat}\n🌍 Языки: {языки}\n🧩 Компоненты: {компоненты}\nСтрок: {строки}';
  var BAND_TPL_WEB = 'Привет! {люди}\n\nзагрузила новые файлики для веба {ссылка_веб}\nдедлайн — {дедлайн} :bunny_rabbit_flower_thank_you:';
  var BAND_TPL_APP = 'Привет! {люди}\nновые файлы на перевод для\nандроида {ссылка_android}\nи айоса {ссылка_ios}\nдедлайн — {дедлайн} :pepe_pray:';
  var bandTpl = el('textarea', { class: 'small', placeholder: BAND_TPL_DEFAULT });
  var bandPeople = el('input', { type: 'text', placeholder: '@ник1 @ник2 @ник3' });
  var bandTplWeb = el('textarea', { class: 'small', placeholder: BAND_TPL_WEB });
  var bandTplApp = el('textarea', { class: 'small', placeholder: BAND_TPL_APP });
  var bandHook = el('input', { type: 'text', placeholder: 'https://… (вебхук чата; пусто — только «Скопировать»)' });
  var bandAuto = el('input', { type: 'checkbox' });
  /* папка для архивов */
  var dirInfo = el('span', { class: 'muted' });
  var dirDated = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  var dirUnzip = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  dirUnzip.checked = sget('wlx_dir_unzip') === '1';
  dirUnzip.addEventListener('change', function () { sset('wlx_dir_unzip', dirUnzip.checked ? '1' : '0'); });
  dirDated.checked = sget('wlx_dir_dated') !== '0';
  dirDated.addEventListener('change', function () { sset('wlx_dir_dated', dirDated.checked ? '1' : '0'); dirShow(); });
  function dirShow() {
    loadDir().then(function (h) {
      if (!h) { dirInfo.className = 'muted'; dirInfo.textContent = 'не выбрана — архивы скачиваются в «Загрузки»'; dirForget.classList.add('hide'); return; }
      dirForget.classList.remove('hide');
      return h.queryPermission({ mode: 'readwrite' }).then(function (p) {
        dirInfo.className = p === 'granted' ? 'ok' : 'muted';
        dirInfo.textContent = 'архивы → «' + h.name + (dirDated.checked ? '/ДДММГГ' : '') + '»' + (p === 'granted' ? '' : ' (Chrome спросит разрешение при первом сохранении)');
      });
    });
  }
  var dirPick = el('button', { class: 'b g s', text: '📁 Выбрать папку…', onclick: function () {
    pickDir().then(function () { dirShow(); toast('✓ Папка для архивов: ' + dirHandle.name); }, function (e) { if (e && e.name !== 'AbortError') { dirInfo.className = 'red'; dirInfo.textContent = '✗ ' + (e.message || e); } });
  } });
  var dirForget = el('button', { class: 'b g s', text: 'Сбросить', onclick: function () { forgetDir().then(dirShow); } });
  /* отправка android + ios по расписанию */
  var schOn = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  var schText = el('input', { type: 'text', placeholder: 'вт 14:00, пт 10:00' });
  var schNext = el('span', { class: 'muted' });
  var DOWS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
  function schParse(t) {
    return String(t || '').split(/[,;\n]+/).map(function (x) {
      var m = /(вс|пн|вт|ср|чт|пт|сб)\D*(\d{1,2})[:.](\d{2})/i.exec(x.trim());
      return m ? { dow: DOWS.indexOf(m[1].toLowerCase()), h: +m[2], m: +m[3] } : null;
    }).filter(Boolean);
  }
  function schShowNext() {
    var slots = schParse(schText.value || 'вт 14:00, пт 10:00');
    if (!slots.length) { schNext.className = 'red'; schNext.textContent = 'не поняла расписание — пиши так: вт 14:00, пт 10:00'; return; }
    var now = Date.now(), best = null;
    for (var d = 0; d < 8 && !best; d++) {
      var day = new Date(now + 3 * 3600e3 + d * 864e5);
      slots.forEach(function (s) {
        if (day.getUTCDay() !== s.dow) return;
        var t = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), s.h, s.m) - 3 * 3600e3;
        if (t > now && (!best || t < best)) best = t;
      });
    }
    var b = best ? new Date(best + 3 * 3600e3) : null;
    schNext.className = 'muted';
    schNext.textContent = !schOn.checked ? 'выключено' : b ? 'следующая: ' + DOWS[b.getUTCDay()] + ' ' + ('0' + b.getUTCDate()).slice(-2) + '.' + ('0' + (b.getUTCMonth() + 1)).slice(-2) +
      ' в ' + ('0' + b.getUTCHours()).slice(-2) + ':' + ('0' + b.getUTCMinutes()).slice(-2) + ' МСК' : '';
  }
  function schSave() { return scCall('sc-set-config', { config: { schedOn: schOn.checked, sched: schText.value.trim() || 'вт 14:00, пт 10:00' } }).then(schShowNext); }
  schOn.addEventListener('change', schSave);
  schText.addEventListener('change', schSave);
  var schRun = el('button', { class: 'b g s', text: 'Запустить сейчас', title: 'Сделать то же, что по расписанию: выгрузить android и ios и отправить в Smartcat (в фоновой вкладке)', onclick: function () {
    if (!confirm('Выгрузить android и ios и отправить в Smartcat прямо сейчас (как по расписанию)?')) return;
    scCall('sc-sched-run-now').then(function () { schNext.textContent = 'запущено — итог придёт уведомлением'; }, function (e) { schNext.textContent = '✗ ' + e.message; });
  } });
  /* кого назначать на английский — из «Моей команды» Smartcat */
  var asgOn = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 6px 0 0;vertical-align:middle' });
  var asgList = el('div', { class: 'team' });
  var asgMsg = el('span', { class: 'muted' });
  /* переводчики (этап 1) и редакторы (этап 2) на английский; один человек может быть и там, и там */
  var asgSel = [], edSel = [];
  function asgSave() { return patchSetup({ enAssign: asgSel, enEdit: edSel }, { enAssignOn: asgOn.checked }); }
  /* записать поля в текущий сетап (и сразу в действующие настройки) */
  function patchSetup(fields, extra) {
    return loadScConfig().then(function (c) {
      if (!c) return null;
      var cur = activeSetup(c).name;
      var list = setupsOf(c).map(function (x) { return x.name === cur ? Object.assign({}, x, fields) : x; });
      return scCall('sc-set-config', { config: Object.assign({ setups: list, setup: cur }, fields, extra || {}) }).then(loadScConfig);
    });
  }
  function asgSummary() {
    return 'Перевод: ' + (asgSel.length ? asgSel.map(function (y) { return y.name; }).join(', ') : 'никто') +
      ' · Редактура: ' + (edSel.length ? edSel.map(function (y) { return y.name; }).join(', ') : 'никто');
  }
  function asgRender(team) {
    asgList.textContent = '';
    var seen = {}, list = [];
    (team || asgSel.concat(edSel)).forEach(function (x) { if (!seen[x.id]) { seen[x.id] = 1; list.push(x); } });
    if (!list.length) { asgList.appendChild(el('p', { class: 'muted', text: 'Никто не выбран — нажми «Загрузить команду из Smartcat».' })); return; }
    var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Человек' }), el('th', { text: 'Перевод' }), el('th', { text: 'Редактура' })])]);
    list.forEach(function (x) {
      function box(getList, setList) {
        var cb = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0' });
        cb.checked = getList().some(function (y) { return y.id === x.id; });
        cb.addEventListener('change', function () {
          var l = getList().filter(function (y) { return y.id !== x.id; });
          if (cb.checked) l.push({ id: x.id, name: x.name });
          setList(l);
          asgSave().then(function () { asgMsg.textContent = 'Сохранено. ' + asgSummary(); });
        });
        return el('td', {}, [cb]);
      }
      t.appendChild(el('tr', {}, [el('td', { text: x.name + (x.email ? ' · ' + x.email : '') }),
        box(function () { return asgSel; }, function (l) { asgSel = l; }),
        box(function () { return edSel; }, function (l) { edSel = l; })]));
    });
    asgList.appendChild(t);
  }
  asgOn.addEventListener('change', function () { asgSave(); });
  var asgLoad = el('button', { class: 'b g s', text: 'Загрузить команду из Smartcat', onclick: function () {
    asgMsg.textContent = 'Загружаю…'; asgLoad.disabled = true;
    scCall('sc-team').then(function (team) {
      asgMsg.textContent = 'В команде: ' + team.length + '. Отметь, кого назначать на перевод и на редактуру (можно одного человека на оба).';
      asgRender(team);
    }, function (e) { asgMsg.textContent = '✗ ' + e.message; }).then(function () { asgLoad.disabled = false; });
  } });
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
  /* ----- сетапы: свой проект / английские проекты / коды языков; аккаунт и ключ общие ----- */
  var SETUP_FIELDS = ['project', 'enAndroid', 'enIos', 'enWeb', 'langMap', 'extra', 'langWeb', 'langMob', 'enAssign', 'enEdit', 'links', 'bandTpl', 'bandHook', 'bandAuto', 'bandPeople', 'bandTplWeb', 'bandTplApp'];
  var scSetup = el('select', { class: 'presel' });
  function setupsOf(c) {
    var list = (c.setups || []).slice();
    if (!list.length) list.push({ name: 'Магазинка', project: c.project === SC_PROJECT_DEFAULT ? '' : c.project,
      enAndroid: c.enAndroid, enIos: c.enIos, enWeb: c.enWeb, langMap: c.langMap, extra: c.extra,
      langWeb: c.langWeb || '', langMob: c.langMob || '', enAssign: c.enAssign || [], enEdit: c.enEdit || [], links: c.links || '' });
    return list;
  }
  function activeSetup(c) { var l = setupsOf(c); return l.filter(function (x) { return x.name === c.setup; })[0] || l[0]; }
  function fillSetupSelects(c) {
    var list = setupsOf(c), cur = activeSetup(c).name;
    [scSetup, scSetupQuick].concat(typeof homeSetup !== 'undefined' && homeSetup ? [homeSetup] : []).forEach(function (sel) {
      sel.textContent = '';
      list.forEach(function (x) { sel.appendChild(el('option', { value: x.name, text: x.name })); });
      sel.value = cur;
    });
    if (typeof homeSetupFill === 'function' && typeof homeSetup !== 'undefined' && homeSetup) homeSetupFill(c);
  }
  function fieldsNow() {
    return { project: scProject.value.trim(), enAndroid: scEnAndroid.value.trim(), enIos: scEnIos.value.trim(), enWeb: scEnWeb.value.trim(), langMap: scLangs.value, extra: scExtra.value.trim(),
      langWeb: scLangWeb.value.trim(), langMob: scLangMob.value.trim(),
      bandTpl: bandTpl.value, bandHook: bandHook.value.trim(), bandAuto: bandAuto.checked,
      bandPeople: bandPeople.value.trim(), bandTplWeb: bandTplWeb.value, bandTplApp: bandTplApp.value };
  }
  /* переключить сетап: его поля становятся текущими настройками */
  function switchSetup(name) {
    return loadScConfig().then(function (c) {
      var list = setupsOf(c), x = list.filter(function (s) { return s.name === name; })[0];
      if (!x) return c;
      var cfg = { setups: list, setup: name };
      /* старые поля сетапа — как были; новые (языки, ссылки, люди) — только если они в сетапе заданы */
      SETUP_FIELDS.forEach(function (f) { if (x[f] !== undefined) cfg[f] = x[f]; else if (SETUP_FIELDS.indexOf(f) < 6) cfg[f] = ''; });
      return scCall('sc-set-config', { config: cfg }).then(loadScConfig);
    }).then(function (c) { fillScSettings(); if (c) fillSetupSelects(c); return c; });
  }
  scSetup.addEventListener('change', function () { switchSetup(scSetup.value).then(function () { scMsg.textContent = 'Сетап «' + scSetup.value + '»'; }); });
  scSetupQuick.addEventListener('change', function () {
    var name = scSetupQuick.value;
    switchSetup(name).then(function (c) {
      scSetupNote.textContent = c ? 'проект: ' + (c.project || SC_PROJECT_DEFAULT) : '';
      if (!scImpBody.classList.contains('hide') && !scOpenPr) listScProjects(false);
    });
  });
  function newSetup() {
    loadScConfig().then(function (c) {
      var name = prompt('Название сетапа (например: Веб)');
      if (!name || !name.trim()) return;
      name = name.trim();
      var list = setupsOf(c).filter(function (x) { return x.name !== name; });
      list.push(Object.assign({ name: name }, fieldsNow(), { project: '', enAndroid: '', enIos: '', enWeb: '', langWeb: '', langMob: '', enAssign: [], enEdit: [], links: '' }));
      scProject.value = '';
      return scCall('sc-set-config', { config: { setups: list } }).then(function () { return switchSetup(name); }).then(function () {
        scMsg.textContent = 'Сетап «' + name + '» создан — впиши проект и нажми «Сохранить»';
        scProject.focus();
      });
    });
  }
  function deleteSetup() {
    loadScConfig().then(function (c) {
      var list = setupsOf(c), cur = activeSetup(c).name;
      if (list.length < 2) { scMsg.textContent = 'Это единственный сетап'; return; }
      if (!confirm('Удалить сетап «' + cur + '»?')) return;
      list = list.filter(function (x) { return x.name !== cur; });
      return scCall('sc-set-config', { config: { setups: list } }).then(function () { return switchSetup(list[0].name); });
    });
  }
  function fillScSettings() {
    loadScConfig().then(function (c) {
      if (!c) return;
      fillSetupSelects(c);
      scSetupNote.textContent = 'проект: ' + (c.project || SC_PROJECT_DEFAULT);
      scServer.value = c.server; scCustom.value = c.customUrl; scAccount.value = c.accountId;
      scCustomLbl.classList.toggle('hide', c.server !== 'custom');
      scKey.value = ''; scKey.placeholder = c.hasKey ? 'ключ сохранён — впиши новый, чтобы заменить' : 'API-ключ';
      if (!c.hasKey || !c.accountId) connFold.open = true;
      scLangs.value = c.langMap; scExtra.value = c.extra; scProject.value = c.project === SC_PROJECT_DEFAULT ? '' : c.project;
      scEnAndroid.value = c.enAndroid; scEnIos.value = c.enIos; scEnWeb.value = c.enWeb || '';
      scLangWeb.value = c.langWeb || ''; scLangMob.value = c.langMob || '';
      bandTpl.value = c.bandTpl || ''; bandHook.value = c.bandHook || ''; bandAuto.checked = !!c.bandAuto;
      bandPeople.value = c.bandPeople || ''; bandTplWeb.value = c.bandTplWeb || ''; bandTplApp.value = c.bandTplApp || '';
      asgSel = (c.enAssign || []).slice(); edSel = (c.enEdit || []).slice(); asgOn.checked = c.enAssignOn !== false;
      schOn.checked = !!c.schedOn; schText.value = c.sched || 'вт 14:00, пт 10:00'; schShowNext();
      dirShow();
      if (!asgList.querySelector('input')) asgRender(null);
    });
  }
  function saveScSettings() {
    if (scExtra.value.trim()) { try { JSON.parse(scExtra.value); } catch (e) { return Promise.reject(new Error('«Доп. параметры» — не JSON')); } }
    return loadScConfig().then(function (c) {
      var list = c ? setupsOf(c) : [], cur = c ? activeSetup(c).name : 'Магазинка', now = fieldsNow();
      list = list.map(function (x) { return x.name === cur ? Object.assign({}, x, { name: cur }, now) : x; });
      if (!list.length) list.push(Object.assign({ name: cur }, now));
      return scCall('sc-set-config', { config: Object.assign({ server: scServer.value, customUrl: scCustom.value.trim(), accountId: scAccount.value.trim(),
        apiKey: scKey.value.trim(), setups: list, setup: cur }, now) });
    }).then(loadScConfig);
  }
  /* копия настроек в файл (без API-ключа) — для нового компьютера или коллеги */
  var BACKUP_KEYS = ['wlx_links', 'wlx_langs', 'wlx_langtpl', 'wlx_langtpl_cur', 'wlx_layout', 'wlx_en', 'wlx_pj', 'wlx_mt_links', 'wlx_sc_split', 'wlx_m', 'wlx_f', 'wlx_c', 'wlx_presets_exp', 'wlx_presets_sc',
    'wlx_scdone', 'wlx_scimp_hide', 'wlx_scimp_mode', 'wlx_varskip', 'wlx_salvage', 'wlx_dir_dated', 'wlx_dir_unzip', 'wlx_byplat', 'wlx_noen'];
  var restoreInput = el('input', { type: 'file', accept: '.json', class: 'hide' });
  function backupSettings() {
    loadScConfig().then(function (c) {
      var local = {};
      BACKUP_KEYS.forEach(function (k) { var v = sget(k); if (v !== null) local[k] = v; });
      var data = { weblateExtensionSettings: 1, saved: new Date().toISOString(), smartcat: c ? {
        server: c.server, customUrl: c.customUrl, accountId: c.accountId, langMap: c.langMap, extra: c.extra,
        project: c.project === SC_PROJECT_DEFAULT ? '' : c.project, enAndroid: c.enAndroid, enIos: c.enIos, enWeb: c.enWeb || '',
        setups: c.setups || [], setup: c.setup || '', enWebKeep: 1, enAssign: c.enAssign || [], enEdit: c.enEdit || [], enAssignOn: c.enAssignOn !== false } : null, local: local };
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
  var scCustomLbl = el('label', {}, ['Адрес сервера', scCustom]);
  scServer.addEventListener('change', function () { scCustomLbl.classList.toggle('hide', scServer.value !== 'custom'); });
  var connFold = fold('Подключение к Smartcat', [
    el('p', { class: 'muted', text: 'Ключ API: Smartcat → Настройки → API. Хранится только в расширении на этом компьютере.' }),
    el('label', {}, ['Сервер', scServer]),
    scCustomLbl,
    el('label', {}, ['Account ID', scAccount]),
    el('label', {}, ['API-ключ', scKey])]);
  var settingsPane = el('div', { class: 'settings hide' }, [
    el('div', { class: 'row', style: 'margin-top:0' }, [el('button', { class: 'b g s back2', text: '← Назад', onclick: function () { showSettings(false); } }),
      el('span', { class: 'sub', style: 'margin:0', text: 'Настройки сохраняются в расширении' })]),
    fold('Проект (сетап)', [
      el('p', { class: 'muted', text: 'У каждого проекта или команды — свои ссылки, языки и проекты Smartcat. Аккаунт и ключ общие.' }),
      el('div', { class: 'row' }, [scSetup,
        el('button', { class: 'b g s', text: '＋ Новый', onclick: newSetup }),
        el('button', { class: 'b g s', text: 'Удалить', onclick: deleteSetup })]),
      el('label', {}, ['Языки веба (коды через пробел) — пусто = ' + LANG_TPL_DEFAULTS[0].bases.join(' '), scLangWeb]),
      el('label', {}, ['Языки android и iOS — пусто = ' + LANG_TPL_DEFAULTS[1].bases.join(' '), scLangMob]),
      el('label', {}, ['Машперевод: проект в Smartcat (ссылка или название) — пусто = «' + SC_PROJECT_DEFAULT + '»', scProject]),
      el('label', {}, ['Английский android → проект — пусто = стандартный', scEnAndroid]),
      el('label', {}, ['Английский iOS → проект — пусто = стандартный', scEnIos]),
      el('label', {}, ['Английский веба → проект (папка «ДДММГГ web») — пусто = «' + SC_EN_DEFAULTS.web + '»', scEnWeb])], true),
    fold('Люди на английский', [
      el('p', { class: 'muted', text: 'Назначаются сразу при отправке на английские документы (EN android, EN ios, веб). Перевод — этап 1, редактура — этап 2. Режим — все, кто примет.' }),
      el('label', { class: 'blk' }, [asgOn, 'назначать автоматически']),
      el('div', { class: 'row' }, [asgLoad, asgMsg]),
      asgList]),
    connFold,
    fold('Сообщения в чат (Band)', [
      el('p', { class: 'muted', text: 'После «Выгрузить и отправить» на главной появятся готовые сообщения для веба и для приложений — со ссылками на Smartcat. Вписываешь дедлайн, копируешь, вставляешь в Band.' }),
      el('label', {}, ['Кого тегнуть ({люди})', bandPeople]),
      el('label', {}, ['Сообщение для веба — пусто = стандартное', bandTplWeb]),
      el('label', {}, ['Сообщение для приложений — пусто = стандартное', bandTplApp]),
      el('p', { class: 'muted', text: 'Подстановки: {люди} {дедлайн} {дата} {ссылка_веб} {папка_веб} {ссылка_android} {ссылка_ios} {файл_android} {файл_ios} {архивы} {языки} {компоненты} {строки}.' }),
      el('details', { class: 'more' }, [el('summary', { text: 'Сводка и автоотправка по вебхуку (не обязательно)' }),
        el('label', {}, ['Сводка — пусто = стандартная', bandTpl]),
        el('label', {}, ['Вебхук чата (Band / Mattermost / Slack)', bandHook]),
        el('label', { class: 'blk' }, [bandAuto, 'отправлять сводку в чат автоматически'])])]),
    fold('Папка для архивов', [
      el('p', { class: 'muted', text: 'Куда сохранять zip для подрядчиков. Если папка недоступна — архив скачается в «Загрузки».' }),
      el('div', { class: 'row' }, [dirPick, dirForget, dirInfo]),
      el('label', { class: 'blk' }, [dirUnzip, 'сохранять папками, без zip']),
      el('label', { class: 'blk' }, [dirDated, 'класть в подпапку с датой (ДДММГГ)'])]),
    fold('Отправка по расписанию', [
      el('p', { class: 'muted', text: 'В это время (по Москве) расширение само выгружает android и iOS и отправляет в Smartcat. Chrome должен быть открыт, а ты — залогинена в Weblate. Включай только на одном компьютере.' }),
      el('label', { class: 'blk' }, [schOn, 'отправлять по расписанию']),
      el('label', {}, ['Когда (по Москве)', schText]),
      el('div', { class: 'row' }, [schRun, schNext])]),
    fold('Дополнительно', [
      el('label', {}, ['Коды языков для Smartcat (код_weblate=код_smartcat, по строке)', scLangs]),
      el('label', {}, ['Доп. параметры создания проекта (JSON)', scExtra]),
      el('div', { class: 'lbl', style: 'margin-top:14px', text: 'Перенос на другой компьютер' }),
      el('div', { class: 'row' }, [
        el('button', { class: 'b g s', text: 'Сохранить настройки в файл', onclick: backupSettings }),
        el('button', { class: 'b g s', text: 'Загрузить из файла', onclick: function () { restoreInput.click(); } }),
        restoreInput
      ]),
      el('p', { class: 'muted', text: 'Файл без API-ключа.' })]),
    el('div', { class: 'row savebar' }, [
      el('button', { class: 'b', text: 'Сохранить', onclick: function () {
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
    ])
  ]);
  /* ================= ГЛАВНАЯ (вариант A): ссылки → языки → одна кнопка → шаги ================= */
  var homeSetup = el('select', { class: 'presel' });
  var homeSetupNote = el('span', { class: 'muted' });
  var homeLinks = el('textarea', { class: 'small hlinks', placeholder: 'Ссылки на компоненты, категории или целый проект — можно вставить сообщение из чата целиком' });
  homeLinks.value = sget('wlx_home_links') || '';
  var HOME_MODES = [['auto', 'Авто: веб и мобильные'], ['web', 'Только языки веба'], ['mob', 'Только языки android/iOS'], ['manual', 'Свои языки…']];
  var homeMode = sget('wlx_home_tpl') || 'auto';
  var homeSeg = el('div', { class: 'seg' });
  var homeLangInfo = el('div', { class: 'muted' });
  function homeRenderSeg() {
    homeSeg.textContent = '';
    HOME_MODES.forEach(function (m) {
      homeSeg.appendChild(el('button', { class: 'chipb' + (homeMode === m[0] ? ' on' : ''), type: 'button', text: m[1], onclick: function () {
        if (m[0] === 'manual') { homeToManual(); return; }
        homeMode = m[0]; sset('wlx_home_tpl', homeMode); homeRenderSeg();
      } }));
    });
    var w = tplByPlat('web'), mb = tplByPlat('android');
    var up = function (t) { return t ? t.bases.join(' ').toUpperCase() : '—'; };
    homeLangInfo.textContent = homeMode === 'web' ? 'Все компоненты: ' + up(w) : homeMode === 'mob' ? 'Все компоненты: ' + up(mb)
      : 'веб: ' + up(w) + ' · android/iOS: ' + up(mb);
  }
  /* свои языки — та же выгрузка с галочками на вкладке «Выгрузка вручную» */
  function homeToManual() {
    links.value = homeLinks.value; tab('exp');
    sset('wlx_langtpl_cur', TPL_MANUAL); tplRefresh();
    if (parseLinks(links.value).length) loadLangs();
  }
  function homePickFor(x, codes) {
    var t = homeMode === 'web' ? tplByPlat('web') : homeMode === 'mob' ? tplByPlat('android') : tplByPlat(scPlatform(x.p, x.c));
    return t ? mtPick(codes, t.bases) : [];
  }
  /* шаги */
  var homeSteps = [
    { title: 'Архивы для подрядчиков' }, { title: 'Отправка в Smartcat' }, { title: 'Машинный перевод' }, { title: 'Загрузка в Weblate' }
  ].map(function (s, i) {
    s.dot = el('span', { class: 'dot d-next', text: String(i + 1) });
    s.t = el('b', { text: s.title }); s.sub = el('div', { class: 'muted' }); s.act = el('span');
    s.row = el('div', { class: 'st' }, [s.dot, el('div', { class: 'grow' }, [s.t, s.sub]), s.act]);
    return s;
  });
  function homeStep(i, state, sub, act) {
    var s = homeSteps[i];
    s.dot.className = 'dot d-' + state;
    s.dot.textContent = state === 'ok' ? '✓' : state === 'err' ? '!' : state === 'run' ? '…' : String(i + 1);
    s.sub.textContent = sub || ''; s.sub.className = state === 'err' ? 'red' : 'muted';
    s.act.textContent = ''; if (act) s.act.appendChild(act);
  }
  var homeBar = el('div'), homeProg = el('div', { class: 'bar hide' }, [homeBar]);
  var homeOut = el('div');
  var homeDetails = el('details', { class: 'hide' }, [el('summary', { text: 'Подробности' }), homeOut]);
  var homeGo = el('button', { class: 'hgo', type: 'button', onclick: function () { homeRun(true); } },
    [el('span', { text: 'Выгрузить и отправить' }), el('small', { text: 'архивы на компьютер · машперевод и английский в Smartcat' })]);
  var homeZip = el('button', { class: 'b g s', type: 'button', text: 'Только архивы, без Smartcat', onclick: function () { homeRun(false); } });
  if (!HAS_EXT) { homeGo.firstChild.textContent = 'Выгрузить'; homeGo.lastChild.textContent = 'архивы на компьютер'; homeZip.classList.add('hide'); }
  function homeRun(send) {
    var text = homeLinks.value.trim();
    homeSteps.forEach(function (s, i) { homeStep(i, 'next', ''); });
    homeAssignOn = false;
    if (!parseLinks(text).length) { homeStep(0, 'err', 'Вставь ссылки на компоненты Weblate (…/projects/<проект>/…)'); return; }
    sset('wlx_home_links', text);
    if (HAS_EXT) patchSetup({ links: text }).catch(function () {});
    homeGo.disabled = homeZip.disabled = true;
    homeOut.textContent = ''; homeDetails.classList.add('hide');
    homeProg.classList.remove('hide'); homeBar.style.width = '0%';
    homeStep(0, 'run', 'Ищу компоненты…');
    var map = {}, union = [], hcomps = [], info = null;
    homeMsgCard.classList.add('hide');
    resolveLinks(text).then(function (r) {
      hcomps = r.comps;
      if (r.missing.length) { homeOut.appendChild(el('div', { class: 'err', text: 'Не нашла компоненты по ссылкам:\n' + r.missing.join('\n') })); homeDetails.classList.remove('hide'); }
      if (!hcomps.length) throw new Error('Не нашла ни одного компонента по ссылкам');
      homeStep(0, 'run', 'Компонентов: ' + hcomps.length + ', смотрю языки…');
      return pool(hcomps, 6, function (x) {
        return translations(x.p, x.c).then(function (trs) {
          var codes = trs.filter(function (t) { return !t.is_source; }).map(function (t) { return t.language.code; });
          var pick = homePickFor(x, codes);
          map[x.p + '/' + x.c] = pick;
          pick.forEach(function (c) { if (union.indexOf(c) < 0) union.push(c); });
        });
      });
    }).then(function () {
      var total = hcomps.reduce(function (a, x) { return a + map[x.p + '/' + x.c].length; }, 0), done = 0;
      if (!total) throw new Error('В компонентах нет языков из шаблона — проверь языки в ⚙ или выбери «Свои языки…»');
      homeStep(0, 'run', 'Скачиваю непереведённое… 0 из ' + total);
      return exportCore(hcomps, union, { q: fuzzy.checked ? QUERY_ALL : QUERY_EMPTY, wantJson: pluralsJson.checked,
        langsFor: function (x) { return map[x.p + '/' + x.c]; } }, function () {
        done++; homeBar.style.width = Math.round(100 * Math.min(done, total) / total) + '%';
        homeStep(0, 'run', 'Скачиваю непереведённое… ' + Math.min(done, total) + ' из ' + total);
      });
    }).then(function (r) {
      homeProg.classList.add('hide');
      var res = r.res, errs = r.errs;
      if (errs.length) {
        var et = el('table');
        errs.forEach(function (e) { et.appendChild(el('tr', {}, e.map(function (v) { return el('td', { text: v }); }))); });
        homeOut.appendChild(el('div', {}, [el('b', { class: 'red', text: 'Проблемы: ' + errs.length }), et]));
        homeDetails.classList.remove('hide'); homeDetails.open = true;
      }
      if (!res.length) { homeStep(0, 'ok', 'Непереведённого нет — всё переведено 🎉' + (errs.length ? ' (есть проблемы — ниже)' : '')); return; }
      var strings = res.reduce(function (a, x) { return a + x.strings; }, 0);
      var a = saveArchives(res);
      var uniq = function (l) { return l.filter(function (x, i, arr) { return arr.indexOf(x) === i; }); };
      info = { 'дата': ddmmyy(), 'проект': scCfg ? activeSetup(scCfg).name : '', 'архивы': a.zips.length ? a.zips.map(function (z) { return z + '.zip'; }).join(', ') : '—',
        'smartcat': send && HAS_EXT ? '…' : 'не отправляли', 'языки': uniq(res.map(function (x) { return langName(x.language); })).join(', '),
        'компоненты': uniq(res.map(function (x) { return x.component; })).join(', '), 'строки': String(strings) };
      homeStep(0, 'ok', strings + ' строк · ' + (a.zips.length ? 'сохранены ' + a.zips.map(function (z) { return z + '.zip'; }).join(', ') : 'только английский — архивов нет'),
        el('button', { class: 'b g s', type: 'button', text: '⬇ ещё раз', onclick: function () { saveArchives(res); } }));
      if (!send || !HAS_EXT) { homeStep(1, 'next', send ? '' : 'пропущено — выбрано «Только архивы»'); return; }
      homeStep(1, 'run', 'Готовлю отправку…');
      var box = el('div'); homeOut.appendChild(box);
      return Promise.resolve(renderSmartcat(res, box)).then(function (btn) {
        if (!btn) {
          if (info) info.smartcat = 'не отправляли';
          homeStep(1, 'err', scCfg && scCfg.accountId && scCfg.hasKey ? 'Отправлять в Smartcat нечего' : 'Smartcat не подключён — открой ⚙');
          return;
        }
        homeDetails.classList.remove('hide');
        homeStep(1, 'run', 'Отправляю в Smartcat…');
        homeAssignOn = true;
        return new Promise(function (resolve) {
          scAutoHook = function (x) {
            var made = (x.made || []).join(', '), en = (x.en || []).join(', ');
            if (info) { info.smartcat = x.error ? 'ошибка: ' + x.error : (made || '—') + (en ? '; английский: ' + en : ''); info.links = x.links || {}; }
            if (x.error) homeStep(1, 'err', x.error + (made ? ' · отправлено: ' + made : ''));
            else homeStep(1, 'ok', (made || 'отправлено') + (en ? ' · английский: ' + en : ''));
            homeRefreshSc(); resolve();
          };
          btn.click();
        });
      });
    }).catch(function (e) {
      homeProg.classList.add('hide');
      var cur = homeSteps.filter(function (s) { return /d-run/.test(s.dot.className); })[0];
      homeStep(cur ? homeSteps.indexOf(cur) : 0, 'err', friendly(e));
    }).then(function () { homeGo.disabled = homeZip.disabled = false; homeRefreshSc(); if (info) homeMessage(info); });
  }
  /* готовые сообщения в чат (Band): для веба и для приложений — по шаблонам из ⚙ → «Сообщения в чат» */
  var homeMsgText = el('textarea', { class: 'small' });   // сводка (для вебхука)
  var homeMsgSt = el('span', { class: 'muted' });
  var homeMsgSend = el('button', { class: 'b s', type: 'button', text: '💬 Отправить сводку в чат', onclick: function () { homeSendMsg(); } });
  var homeDeadline = el('input', { type: 'text', class: 'dl', placeholder: 'например: 15.10, 18:00' });
  var homeMsgBox = el('div');
  var homeMsgInfo = null;
  function copyText(ta, st) {
    var done = function () { st.className = 'ok'; st.textContent = '✓ Скопировано'; setTimeout(function () { st.textContent = ''; }, 2500); };
    var fallback = function () { ta.select(); try { document.execCommand('copy'); } catch (e) {} done(); };
    if (navigator.clipboard) navigator.clipboard.writeText(ta.value).then(done, fallback); else fallback();
  }
  var homeMsgCard = card('Сообщения в чат', [
    el('label', { class: 'lbl', text: 'Дедлайн' }), homeDeadline,
    homeMsgBox], 'hide');
  homeDeadline.addEventListener('input', function () { if (homeMsgInfo) homeMessage(homeMsgInfo, true); });
  function chatFill(tpl, info) {
    var L = info.links || {}, md = function (t, x) { return x ? '[' + t + '](' + x.url + ')' : '—'; };
    var v = {
      'люди': (scCfg && scCfg.bandPeople) || '', 'дедлайн': homeDeadline.value.trim() || '[дедлайн]',
      'ссылка_веб': L.web ? md(L.web.folder, L.web) : '—', 'папка_веб': L.web ? L.web.folder : '—',
      'ссылка_android': L.android ? md(L.android.file, L.android) : '—', 'ссылка_ios': L.ios ? md(L.ios.file, L.ios) : '—',
      'файл_android': L.android ? L.android.file : '—', 'файл_ios': L.ios ? L.ios.file : '—'
    };
    return tpl.replace(/\{([а-яёa-z_]+)\}/gi, function (m, k) { return v[k] != null ? v[k] : info[k] != null ? info[k] : m; });
  }
  function homeMessage(info, refill) {
    homeMsgInfo = info;
    var L = info.links || {}, blocks = [];
    if (L.web) blocks.push(['Для веба', (scCfg && scCfg.bandTplWeb && scCfg.bandTplWeb.trim()) || BAND_TPL_WEB]);
    if (L.android || L.ios) blocks.push(['Для приложений', (scCfg && scCfg.bandTplApp && scCfg.bandTplApp.trim()) || BAND_TPL_APP]);
    homeMsgBox.textContent = '';
    blocks.forEach(function (b) {
      var ta = el('textarea', { class: 'small msg' }), st = el('span', { class: 'muted' });
      ta.value = chatFill(b[1], info);
      homeMsgBox.appendChild(el('div', { class: 'msgblk' }, [el('div', { class: 'lbl', text: b[0] }), ta,
        el('div', { class: 'row' }, [el('button', { class: 'b s', type: 'button', text: '📋 Скопировать', onclick: function () { copyText(ta, st); } }), st])]));
    });
    if (!blocks.length) homeMsgBox.appendChild(el('p', { class: 'muted', text: 'Сообщения появятся, когда английский уйдёт в Smartcat (веб — в «МП Web», android/iOS — в английские проекты).' }));
    /* сводка для вебхука — только если он настроен */
    var hook = scCfg && scCfg.bandHook;
    if (hook) {
      homeMsgText.value = chatFill((scCfg.bandTpl && scCfg.bandTpl.trim()) || BAND_TPL_DEFAULT, info);
      homeMsgBox.appendChild(el('details', { class: 'more' }, [el('summary', { text: 'Сводка в чат по вебхуку' }), homeMsgText, el('div', { class: 'row' }, [homeMsgSend, homeMsgSt])]));
      if (scCfg.bandAuto && !refill) homeSendMsg();
    }
    homeMsgCard.classList.remove('hide');
  }
  function homeSendMsg() {
    var hook = scCfg && scCfg.bandHook;
    if (!hook) return;
    homeMsgSend.disabled = true; homeMsgSt.className = 'muted'; homeMsgSt.textContent = 'Отправляю…';
    scCall('band-send', { url: hook, text: homeMsgText.value }).then(function () {
      homeMsgSt.className = 'ok'; homeMsgSt.textContent = '✓ Отправлено в чат (проверь, что сообщение пришло)';
    }, function (e) { homeMsgSt.className = 'red'; homeMsgSt.textContent = '✗ ' + e.message; }).then(function () { homeMsgSend.disabled = false; });
  }
  /* итог назначения людей на английский — дописываем во 2-й шаг главной */
  var homeAssignOn = false;
  function homeAssignNote(text, ok) {
    if (!homeAssignOn) return;
    var st = homeSteps[1];
    st.sub.textContent += (st.sub.textContent ? ' · ' : '') + text;
    if (!ok) { st.sub.className = 'red'; homeDetails.classList.remove('hide'); }
  }
  /* шаги 3–4: что сейчас ждёт перевода в Smartcat и что можно загрузить */
  function homeRefreshSc() {
    if (!HAS_EXT) { homeSteps[2].row.classList.add('hide'); homeSteps[3].row.classList.add('hide'); return; }
    var wk = new Date(); wk.setHours(0, 0, 0, 0); wk.setDate(wk.getDate() - 6);
    var pending = scProjects().filter(function (pr) { return !pr.uploaded && scDay(pr) >= wk; });
    var ready = pending.filter(function (pr) { return scReady[pr.key || pr.id]; });
    var check = el('button', { class: 'b g s', type: 'button', text: 'Проверить', onclick: function () {
      check.disabled = true;
      scCall('sc-watch-now').catch(function () {}).then(function () { return scCall('sc-ready-get'); }).then(function (r) { scReady = r || {}; renderScImport(); homeRefreshSc(); }, function () { check.disabled = false; });
    } });
    if (!pending.length) homeStep(2, 'next', 'Сейчас ничего не ждёт перевода');
    else if (ready.length === pending.length) homeStep(2, 'ok', 'Готово: ' + ready.length + ' из ' + pending.length + ' отправок', check);
    else homeStep(2, 'run', 'Переводится: готово ' + ready.length + ' из ' + pending.length + ' · придёт уведомление 🔔', check);
    var upMsg = el('span', { class: 'muted' });
    var upBtn = el('button', { class: 'b s', type: 'button', text: 'В Weblate (' + (ready.length || pending.length) + ')', onclick: function () {
      renderScImport(); uploadAllReady(upBtn, upMsg, ready.length ? ready : null);
    } });
    if (!pending.length) homeStep(3, 'next', 'Когда перевод будет готов, загрузится только в непереведённые строки');
    else homeStep(3, ready.length ? 'run' : 'next', ready.length ? 'Можно загружать — только в непереведённые строки' : 'Можно попробовать забрать то, что уже готово', el('span', {}, [upBtn, upMsg]));
  }
  /* файлы подрядчиков: бросить прямо на главную */
  var homeFile = el('input', { type: 'file', multiple: '', accept: '.po,.json,.zip' });
  homeFile.addEventListener('change', function () { if (homeFile.files.length) { addFiles(homeFile.files); tab('imp'); } homeFile.value = ''; });
  var homeDrop = el('label', { class: 'drop hdrop' }, [homeFile, el('div', { text: '⬆ Файлы от подрядчиков (.po, .json, .zip) — перетащи сюда или нажми' })]);
  ['dragover', 'dragenter'].forEach(function (ev) { homeDrop.addEventListener(ev, function (e) { e.preventDefault(); homeDrop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { homeDrop.addEventListener(ev, function () { homeDrop.classList.remove('over'); }); });
  homeDrop.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files.length) { addFiles(e.dataTransfer.files); tab('imp'); } });
  homeSetup.addEventListener('change', function () {
    switchSetup(homeSetup.value).then(function (c) {
      homeSetupFill(c);
      if (c && c.links) homeLinks.value = c.links;
    });
  });
  function homeSetupFill(c) {
    if (!c) { homeSetup.parentNode && homeSetup.parentNode.classList.add('hide'); homeRenderSeg(); return; }
    homeSetupNote.textContent = 'Smartcat: ' + (c.project || SC_PROJECT_DEFAULT) + (c.enWeb ? ' · веб EN: ' + c.enWeb : '');
    homeRenderSeg();
  }
  /* ----- «Загрузить в Smartcat»: свои файлы → проект (или новый) → папка (или новая) → языки ----- */
  var upSc = { files: [], pr: null, mode: 'old', folder: '', langs: null, q: '' };
  var upScFile = el('input', { type: 'file', multiple: '' });
  var upScDrop = el('label', { class: 'drop' }, [upScFile, el('div', { class: 'dropt', text: 'Перетащи файлы или нажми, чтобы выбрать' }),
    el('div', { class: 'muted', text: 'любые форматы: .po, .json, .xlsx, .docx…' })]);
  var upScFiles = el('div', { class: 'fchips' });
  var upScProjQ = el('input', { type: 'text', placeholder: 'Поиск проекта или ссылка на него' });
  var upScProjList = el('div', { class: 'plist' });
  var upScNewName = el('input', { type: 'text' });
  var upScNewLangs = el('input', { type: 'text', placeholder: 'коды через пробел: kk ky uz-Latn' });
  var upScNewMt = el('input', { type: 'checkbox' }); upScNewMt.checked = true;
  var upScFolders = el('div', { class: 'chipsw' });
  var upScNewFolder = el('input', { type: 'text', placeholder: 'новая папка — например ' + ddmmyy() });
  var upScLangBox = el('div', { class: 'chipsw' });
  var upScByName = el('input', { type: 'checkbox' }); upScByName.checked = sget('wlx_upsc_byname') !== '0';
  var upScWhere = el('div', { class: 'where' });
  var upScGo = el('button', { class: 'b big', type: 'button', onclick: function () { upScRun(); } });
  var upScMsg = el('div', { class: 'muted' });
  var upScSegOld = el('button', { class: 'chipb on', type: 'button', text: 'Существующий', onclick: function () { upSc.mode = 'old'; upScDraw(); } });
  var upScSegNew = el('button', { class: 'chipb', type: 'button', text: '＋ Новый проект', onclick: function () { upSc.mode = 'new'; upScDraw(); } });
  var upScOldBox = el('div', {}, [upScProjQ, upScProjList]);
  var upScNewBox = el('div', { class: 'hide' }, [
    el('label', { class: 'fl' }, ['Название', upScNewName]),
    el('label', { class: 'fl' }, ['Языки перевода', upScNewLangs]),
    el('div', { class: 'seg', id: 'wlx-upsc-tpl' }),
    el('label', { class: 'chk' }, [upScNewMt, 'сразу машинный перевод и память переводов'])]);
  upScByName.addEventListener('change', function () { sset('wlx_upsc_byname', upScByName.checked ? '1' : '0'); upScDraw(); });
  upScFile.addEventListener('change', function () { upScAdd(upScFile.files); upScFile.value = ''; });
  ['dragover', 'dragenter'].forEach(function (ev) { upScDrop.addEventListener(ev, function (e) { e.preventDefault(); upScDrop.classList.add('over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { upScDrop.addEventListener(ev, function () { upScDrop.classList.remove('over'); }); });
  upScDrop.addEventListener('drop', function (e) { e.preventDefault(); upScAdd(e.dataTransfer.files); });
  upScProjQ.addEventListener('input', function () { upSc.q = upScProjQ.value; upScDrawProjects(); });
  upScNewFolder.addEventListener('input', upScDrawWhere);
  [upScNewName, upScNewLangs].forEach(function (x) { x.addEventListener('input', upScDrawWhere); });
  upScNewLangs.addEventListener('input', upScDrawLangs);
  var upSheet = el('div', { class: 'sheet hide', onclick: function (e) { if (e.target === upSheet) upScClose(); } }, [
    el('div', { class: 'sheetwin', role: 'dialog' }, [
      el('div', { class: 'sheethead' }, [el('div', { class: 'sheett', text: 'Загрузить в Smartcat' }),
        el('button', { class: 'x', type: 'button', title: 'Закрыть', text: '×', onclick: function () { upScClose(); } })]),
      el('div', { class: 'sheetbody' }, [
        el('div', { class: 'step' }, [el('div', { class: 'stepn', text: '1' }), el('div', { class: 'stepb' }, [el('div', { class: 'stept', text: 'Файлы' }), upScDrop, upScFiles])]),
        el('div', { class: 'step' }, [el('div', { class: 'stepn', text: '2' }), el('div', { class: 'stepb' }, [el('div', { class: 'stept', text: 'Проект' }),
          el('div', { class: 'seg' }, [upScSegOld, upScSegNew]), upScOldBox, upScNewBox])]),
        el('div', { class: 'step' }, [el('div', { class: 'stepn', text: '3' }), el('div', { class: 'stepb' }, [el('div', { class: 'stept', text: 'Папка' }), upScFolders, upScNewFolder])]),
        el('div', { class: 'step' }, [el('div', { class: 'stepn', text: '4' }), el('div', { class: 'stepb' }, [el('div', { class: 'stept', text: 'Языки' }), upScLangBox,
          el('label', { class: 'chk' }, [upScByName, 'если язык есть в имени файла (…_kk.po) — только на этот язык'])])])
      ]),
      el('div', { class: 'sheetfoot' }, [upScWhere, el('div', { class: 'row' }, [upScGo, upScMsg])])
    ])
  ]);
  function upScOpen() {
    upSheet.classList.remove('hide');
    upScMsg.textContent = ''; upScMsg.className = 'muted';
    if (!upScNewName.value) upScNewName.value = ddmmyy() + ' ';
    var tb = upSheet.querySelector('#wlx-upsc-tpl'); tb.textContent = '';
    [['web', 'Языки веба'], ['mob', 'Языки android и iOS']].forEach(function (t) {
      var tp = tplByPlat(t[0]);
      if (!tp) return;
      tb.appendChild(el('button', { class: 'chipb', type: 'button', text: t[1], onclick: function () {
        var map = scLangMap(scCfg && scCfg.langMap);
        upScNewLangs.value = tp.bases.filter(function (b) { return b !== 'ru'; }).map(function (b) { return map(b === 'uz' ? 'uz_Latn' : b); }).join(' ');
        upScDrawLangs(); upScDrawWhere();
      } }));
    });
    upScDraw();
    if (upSc.prs) return;
    upScProjList.textContent = ''; upScProjList.appendChild(el('div', { class: 'muted', text: 'Загружаю проекты…' }));
    scGuard().then(function (c) {
      return scProjCache || scCall('sc-projects').then(function (l) { scProjCache = l; return l; }).then(function (l) {
        var ref = String(c.project || SC_PROJECT_DEFAULT), idm = /([0-9a-f]{8}-[0-9a-f-]{27,})/i.exec(ref);
        l.forEach(function (p) { p.pin = idm ? p.id === idm[1] : p.name === ref; });
        return l;
      });
    }).then(function (l) { upSc.prs = l; upScDrawProjects(); }, function (e) {
      upScProjList.textContent = ''; upScProjList.appendChild(el('div', { class: 'red', text: '✗ ' + e.message }));
    });
  }
  function upScClose() { upSheet.classList.add('hide'); }
  function upScAdd(list) {
    Array.prototype.slice.call(list || []).forEach(function (f) {
      upSc.files = upSc.files.filter(function (x) { return x.file.name !== f.name; });
      upSc.files.push({ file: f });
    });
    Promise.all(upSc.files.map(function (x) {
      if (x.head !== undefined || !/\.po$/i.test(x.file.name)) return null;
      return x.file.text().then(function (t) {
        var m = /Language-Team:[^<\n]*<[^>\n]*\/projects\/([^/\s>]+)\/(.+?)\/([^/\s>]+)\/?>/.exec(t.slice(0, 4000));
        x.head = m ? { p: m[1], c: decodeURIComponent(m[2]), lang: m[3] } : null;
      });
    })).then(upScDraw);
    upScDraw();
  }
  function upScPrLangs() {
    if (upSc.mode === 'new') return upScNewLangs.value.trim().split(/[\s,;]+/).filter(Boolean);
    return upSc.pr ? (upSc.pr.targetLanguages || []).map(String) : [];
  }
  /* язык в имени файла: …-kk.po, …_az-Latn.json, kk(kk).po */
  function upScLangOf(name, langs) {
    var n = String(name).replace(/\.[^.]+$/, '').toLowerCase(), best = null;
    langs.forEach(function (l) {
      [l, l.replace(/-/g, '_'), baseLang(l)].forEach(function (v) {
        v = v.toLowerCase();
        var re = new RegExp('(^|[^a-z])' + v.replace(/[-_]/g, '[-_]') + '($|[^a-z])');
        if (re.test(n) && (!best || v.length > best.v.length || (v.length === best.v.length && v === l.toLowerCase()))) best = { l: l, v: v };
      });
    });
    return best && best.l;
  }
  function upScTargets(x, langs) {
    var hit = upScByName.checked ? upScLangOf(x.file.name, langs) : null;
    if (hit) return [hit];
    return langs.filter(function (l) { return upSc.langs ? upSc.langs[l] : true; });
  }
  function upScDraw() {
    upScSegOld.classList.toggle('on', upSc.mode === 'old'); upScSegNew.classList.toggle('on', upSc.mode === 'new');
    upScOldBox.classList.toggle('hide', upSc.mode !== 'old'); upScNewBox.classList.toggle('hide', upSc.mode !== 'new');
    upScFiles.textContent = '';
    var langs = upScPrLangs();
    upSc.files.forEach(function (x) {
      var hit = upScByName.checked && langs.length ? upScLangOf(x.file.name, langs) : null;
      upScFiles.appendChild(el('div', { class: 'fchip' }, [el('span', { class: 'fext', text: (/\.([^.]+)$/.exec(x.file.name) || [0, '?'])[1].slice(0, 4) }),
        el('span', { class: 'fname', text: x.file.name }), hit ? el('span', { class: 'pill p-ready', text: '→ ' + hit }) : null,
        x.head ? el('span', { class: 'pill p-ok', title: 'Файл из Weblate — появится в «Перевод готов → в Weblate»', text: x.head.c }) : null,
        el('span', { class: 'muted', text: x.file.size > 1048576 ? (x.file.size / 1048576).toFixed(1) + ' МБ' : Math.max(1, Math.round(x.file.size / 1024)) + ' КБ' }),
        el('button', { class: 'x s', type: 'button', title: 'Убрать', text: '×', onclick: function () { upSc.files.splice(upSc.files.indexOf(x), 1); upScDraw(); } })]));
    });
    upScDrawProjects(); upScDrawFolders(); upScDrawLangs(); upScDrawWhere();
  }
  function upScDrawProjects() {
    if (!upSc.prs) return;
    upScProjList.textContent = '';
    var raw = upSc.q.trim(), q = raw.toLowerCase().split(/\s+/).filter(Boolean);
    var idm = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i.exec(raw);
    var list = upSc.prs.filter(function (p) { return idm ? p.id === idm[1] : q.every(function (w) { return String(p.name).toLowerCase().indexOf(w) >= 0; }); });
    list = list.filter(function (p) { return p.pin; }).concat(list.filter(function (p) { return !p.pin; }));
    if (upSc.pr && list.indexOf(upSc.pr) < 0 && !q.length) list.unshift(upSc.pr);
    if (idm && !list.length) list = [{ id: idm[1], name: 'Проект по ссылке', targetLanguages: [] }];
    list.slice(0, q.length ? 30 : 6).forEach(function (p) {
      var d = Date.parse(p.modified || p.created || '');
      upScProjList.appendChild(el('button', { class: 'pitem' + (upSc.pr && upSc.pr.id === p.id ? ' on' : ''), type: 'button', onclick: function () { upScPick(p); } }, [
        el('span', { class: 'pname', text: (p.pin ? '⭐ ' : '') + p.name }),
        el('span', { class: 'muted', text: [(p.targetLanguages || []).length ? p.targetLanguages.length + ' яз.' : '', d ? new Date(d).toLocaleDateString('ru-RU') : ''].filter(Boolean).join(' · ') })]));
    });
    if (!list.length) upScProjList.appendChild(el('div', { class: 'muted', text: 'Ничего не нашлось — можно создать новый проект' }));
    else if (!q.length && list.length > 6) upScProjList.appendChild(el('div', { class: 'muted', text: 'ещё ' + (list.length - 6) + ' — найди поиском' }));
  }
  function upScPick(p) {
    upSc.pr = p; upSc.folder = ''; upSc.folders = null; upSc.langs = null;
    upScDraw();
    upScFolders.textContent = ''; upScFolders.appendChild(el('span', { class: 'muted', text: 'Смотрю папки…' }));
    scCall('sc-project', { id: p.id }).then(function (full) {
      if (upSc.pr !== p) return;
      if (full.targetLanguages && full.targetLanguages.length) p.targetLanguages = full.targetLanguages;
      if (full.name && p.name === 'Проект по ссылке') p.name = full.name;
      var seen = {};
      (full.documents || []).forEach(function (d) {
        var path = String(d.fullPath || d.path || '').replace(/^\/+/, ''), parts = path.split('/').slice(0, -1), t = Date.parse(d.creationDate || '') || 0;
        for (var i = 1; i <= parts.length; i++) { var k = parts.slice(0, i).join('/'); seen[k] = Math.max(seen[k] || 0, t); }
      });
      upSc.folders = Object.keys(seen).sort(function (a, b) { return seen[b] - seen[a] || a.localeCompare(b); });
      upScDraw();
    }, function (e) { upSc.folders = []; upScFolders.textContent = ''; upScFolders.appendChild(el('span', { class: 'red', text: '✗ ' + e.message })); });
  }
  function upScDrawFolders() {
    if (upSc.mode === 'new') { upScFolders.textContent = ''; upScFolders.appendChild(el('span', { class: 'muted', text: 'В новом проекте папок ещё нет — впиши новую или оставь пустым' })); return; }
    if (!upSc.pr) { upScFolders.textContent = ''; upScFolders.appendChild(el('span', { class: 'muted', text: 'Сначала выбери проект' })); return; }
    if (!upSc.folders) return;
    upScFolders.textContent = '';
    [''].concat(upSc.folders.slice(0, 40)).forEach(function (f) {
      upScFolders.appendChild(el('button', { class: 'chipb' + (upSc.folder === f ? ' on' : ''), type: 'button', text: f ? '📁 ' + f : 'Корень проекта',
        onclick: function () { upSc.folder = f; upScDrawFolders(); upScDrawWhere(); } }));
    });
  }
  function upScDrawLangs() {
    upScLangBox.textContent = '';
    var langs = upScPrLangs();
    if (!langs.length) { upScLangBox.appendChild(el('span', { class: 'muted', text: upSc.mode === 'new' ? 'Впиши языки нового проекта выше' : 'Языки появятся, когда выберешь проект' })); return; }
    if (!upSc.langs) { upSc.langs = {}; langs.forEach(function (l) { upSc.langs[l] = 1; }); }
    langs.forEach(function (l) {
      if (!(l in upSc.langs)) upSc.langs[l] = 1;
      upScLangBox.appendChild(el('button', { class: 'chipb' + (upSc.langs[l] ? ' on' : ''), type: 'button', text: langName(l.replace(/-/g, '_')) === l.replace(/-/g, '_') ? l : langName(l.replace(/-/g, '_')) + ' · ' + l,
        onclick: function () { upSc.langs[l] = upSc.langs[l] ? 0 : 1; upScDrawLangs(); upScDrawWhere(); } }));
    });
  }
  function upScPath() {
    var nf = upScNewFolder.value.trim().replace(/^\/+|\/+$/g, '');
    var base = upSc.mode === 'new' ? '' : upSc.folder;
    return [base, nf].filter(Boolean).join('/');
  }
  function upScDrawWhere() {
    var langs = upScPrLangs(), pr = upSc.mode === 'new' ? (upScNewName.value.trim() ? '«' + upScNewName.value.trim() + '» (новый)' : '') : (upSc.pr ? '«' + upSc.pr.name + '»' : '');
    var path = upScPath(), n = upSc.files.length;
    var docs = upSc.files.reduce(function (a, x) { return a + upScTargets(x, langs).length; }, 0);
    upScWhere.textContent = '';
    upScWhere.appendChild(el('span', {}, pr ? ['Куда: ', el('b', { text: pr + (path ? ' / ' + path : '') }), n ? ' · документов: ' + docs : ''] : ['Выбери файлы и проект']));
    upScGo.textContent = n ? 'Загрузить ' + plural(n, 'файл', 'файла', 'файлов') : 'Загрузить';
    upScGo.disabled = !n || !pr || !docs;
  }
  function upScRead(f) {
    if (/\.po$/i.test(f.name)) return f.text().then(function (t) { return { text: scSendText(t) }; });
    return f.arrayBuffer().then(function (buf) {
      var b = new Uint8Array(buf), s = '';
      for (var i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
      return { b64: btoa(s) };
    });
  }
  function upScRun() {
    var langs = upScPrLangs(), path = upScPath(), files = upSc.files.slice();
    upScGo.disabled = true; upScMsg.className = 'muted'; upScMsg.textContent = 'Читаю файлы…';
    var getPr;
    if (upSc.mode === 'new') {
      var extra = {}; try { extra = scCfg && scCfg.extra ? JSON.parse(scCfg.extra) : {}; } catch (e) {}
      var model = Object.assign({ name: upScNewName.value.trim(), description: 'Создано расширением Weblate ⇄ Smartcat',
        sourceLanguage: 'ru', targetLanguages: langs, assignToVendor: false, useMT: upScNewMt.checked, pretranslate: upScNewMt.checked,
        useTranslationMemory: true, autoPropagateRepetitions: false, isForTesting: false, workflowStages: ['translation'] }, extra);
      getPr = function () { upScMsg.textContent = 'Создаю проект…'; return scCall('sc-create', { model: model, files: [] }).then(function (p) {
        scProjCache = null; upSc.prs = null;
        return { id: p.id, name: p.name || model.name, targetLanguages: p.targetLanguages || langs };
      }); };
    } else getPr = function () { return Promise.resolve(upSc.pr); };
    var payload;
    Promise.all(files.map(function (x) { return upScRead(x.file).then(function (r) {
      return Object.assign({ name: (path ? path + '/' : '') + x.file.name, targetLanguages: upScTargets(x, langs) }, r);
    }); })).then(function (p) { payload = p; return getPr(); }).then(function (pr) {
      upScMsg.textContent = 'Загружаю в Smartcat…';
      return scCall('sc-add-docs', { projectId: pr.id, files: payload }).then(function (r) { return { pr: pr, r: r }; });
    }).then(function (x) {
      /* файлы из Weblate — в список «Перевод готов → в Weblate» */
      var docs = {}, byKey = {};
      files.forEach(function (f) { if (f.head) byKey[f.file.name.replace(/\.(po|json)$/i, '')] = f.head; });
      (x.r.documents || []).forEach(function (d) { var h = byKey[scDocKey(d.name)] || byKey[scDocKey(d.fullPath)]; if (h) docs[d.id] = { p: h.p, c: h.c, lang: h.lang }; });
      var tracked = Object.keys(docs).length;
      if (tracked) {
        var key = x.pr.id + '#' + (path || 'root');
        var list = scProjects().filter(function (y) { return (y.key || y.id) !== key; });
        var old = scProjects().filter(function (y) { return (y.key || y.id) === key; })[0];
        list.unshift({ key: key, id: x.pr.id, name: x.pr.name + (path ? ' / ' + path : ''), created: new Date().toISOString(),
          docs: Object.assign({}, old && old.docs, docs), files: {}, langs: {} });
        saveScProjects(list); renderScImport(); homeRefreshSc();
      }
      upScMsg.className = 'ok'; upScMsg.textContent = '';
      upScMsg.appendChild(document.createTextNode('✓ Загружено документов: ' + (x.r.documents || []).length + ' · '));
      upScMsg.appendChild(el('a', { href: (scCfg && scCfg.base || 'https://smartcat.com') + '/projects/' + x.pr.id, target: '_blank', text: 'открыть в Smartcat ↗' }));
      if (tracked) upScMsg.appendChild(document.createTextNode(' · появится в «Перевод готов → в Weblate»'));
      upSc.files = []; upScNewFolder.value = '';
      if (upSc.mode === 'new') upSc.mode = 'old';
      upScPick(x.pr); upSc.folder = path;
    }).catch(function (e) { upScMsg.className = 'red'; upScMsg.textContent = '✗ ' + e.message; upScGo.disabled = false; });
  }
  var homePane = el('div', {}, [
    card(null, [
    HAS_EXT ? el('div', { class: 'row hsetup', style: 'margin-top:0' }, [el('span', { class: 'lbl', text: 'Проект' }), homeSetup,
      el('button', { class: 'b g s', type: 'button', text: '＋', title: 'Новый сетап: свои ссылки, языки и проекты Smartcat', onclick: function () { showSettings(true); newSetup(); } }), homeSetupNote]) : null,
    el('div', { class: 'hblock' }, [el('span', { class: 'lbl', text: 'Что выгружаем' }), homeLinks]),
    el('div', { class: 'hblock' }, [el('span', { class: 'lbl', text: 'Языки' }), homeSeg, homeLangInfo]),
    el('div', { class: 'row' }, [homeGo, homeZip]),
    homeProg], 'homecard'),
    card('Что дальше', [el('div', { class: 'steps', style: 'margin-top:0;padding-top:0;border-top:0' }, homeSteps.map(function (s) { return s.row; })), homeDetails]),
    homeMsgCard,
    HAS_EXT ? upScTile('Выбрать проект и папку, создать новые') : null,
    homeDrop,
    el('div', { class: 'row hfoot' }, [
      HAS_EXT ? el('button', { class: 'lnk', type: 'button', text: 'Все отправки в Smartcat ›', onclick: function () { tab('sc'); } }) : null,
      el('button', { class: 'lnk', type: 'button', text: 'Выгрузка вручную ›', onclick: function () { tab('exp'); } })
    ])
  ]);
  homeRenderSeg();
  var mainArea, tabsBar;
  function showSettings(on) {
    settingsPane.classList.toggle('hide', !on);
    if (mainArea) mainArea.classList.toggle('hide', on);
    if (gearBtn) gearBtn.classList.toggle('on', on);
    if (tabsBar) tabsBar.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('on', !on && b.dataset.t === curTab); });
    if (scroller) scroller.scrollTop = 0;
    if (on) fillScSettings();
  }

  /* тема: как в системе или кнопкой ☾/☀ в шапке */
  var THEME_ICONS = { moon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    gear: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>' };
  function svgEl(markup) { return new DOMParser().parseFromString(markup, 'image/svg+xml').documentElement; }
  function isDark() { var t = host.getAttribute('data-theme'); return t ? t === 'dark' : !!(window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches); }
  var themeBtn = el('button', { class: 'x', type: 'button', title: 'Светлая / тёмная тема', onclick: function () {
    var t = isDark() ? 'light' : 'dark'; host.setAttribute('data-theme', t); sset('wlx_theme', t); themeIcon();
  } });
  function themeIcon() { themeBtn.textContent = ''; themeBtn.appendChild(svgEl(isDark() ? THEME_ICONS.sun : THEME_ICONS.moon)); }
  if (sget('wlx_theme')) host.setAttribute('data-theme', sget('wlx_theme'));
  themeIcon();
  var gearBtn = HAS_EXT ? el('button', { class: 'x', type: 'button', title: 'Настройки Smartcat', onclick: function () { showSettings(settingsPane.classList.contains('hide')); } }, [svgEl(THEME_ICONS.gear)]) : null;
  var scroller;
  var back = el('div', { class: 'back', onclick: function (e) { if (e.target === back) hide(); } }, [
    el('div', { class: 'box' }, [
      el('div', { class: 'top' }, [
        el('div', { class: 'brand' }, [el('div', { class: 'logo', text: '⇄' }), el('h1', { text: 'Weblate ⇄ Smartcat' })]),
        tabsBar = el('div', { class: 'tabs' }, HAS_EXT ? [tabHome, tabExp, tabSc, tabImp] : [tabHome, tabExp, tabImp]),
        el('div', { class: 'icons' }, [themeBtn, gearBtn, el('button', { class: 'x', type: 'button', title: 'Закрыть', text: '×', onclick: hide })])
      ]),
      scroller = el('div', { class: 'scroll' }, [
        toastEl = el('div', { class: 'toast hide' }),
        settingsPane,
        mainArea = el('div', {}, [homePane, exportPane, scPane, importPane])
      ]),
      upSheet
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
      tplRefresh(); tplApply();
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
  var EXPORT_DEBUG = [];
  function exportCore(comps, langs, opts, onTick) {
    EXPORT_DEBUG = [];
    var res = [], errs = [];
    return pool(comps, 4, function (x) {
      return translations(x.p, x.c).then(function (trs) {
        var mine = opts.langsFor ? opts.langsFor(x, langs) : langs;
        langs.filter(function (l) { return mine.indexOf(l) < 0; }).forEach(function () { onTick(); });
        return mine.reduce(function (chain, wanted) {
          return chain.then(function () {
            var code = matchLanguage(wanted, trs);
            if (!code) { errs.push([x.c, wanted, 'языка нет в компоненте']); onTick(); return; }
            var src = trs.filter(function (t) { return t.is_source; })[0];
            var srcCode = src ? src.language.code : 'ru';
            var st = trs.filter(function (t) { return t.language.code === code; })[0];
            var expect = st && st.total != null && st.translated != null ? st.total - st.translated : 0;
            return downloadPo(x.p, x.c, code, opts.q).then(function (raw) {
              /* Weblate говорит, что непереведённое есть, а файл пустой — пробуем скачать как через интерфейс Weblate */
              if (expect > 0 && !filterPo(raw, false).strings) {
                var dbg = { c: x.c, p: x.p, lang: code, q: opts.q, expect: expect, api: raw };
                EXPORT_DEBUG.push(dbg);
                return downloadPo(x.p, x.c, code, opts.q, true).then(function (t) { dbg.ui = t; return t; }, function (e) { dbg.ui = 'ОШИБКА: ' + e.message; return raw; });
              }
              return raw;
            }).then(function (raw) {
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
    exportCore(comps, langs, { q: fuzzy.checked ? QUERY_ALL : QUERY_EMPTY, wantJson: pluralsJson.checked, langsFor: tplLangsFor }, tick).then(function (r) {
      goBtn.disabled = false;
      progText.textContent = 'Готово!';
      barFill.style.width = '100%';
      showResults(r.res, r.errs);
      otherLangsHint(langs, r.res);
    });
  }
  /* непереведённое есть в языках, которые не отмечены (например, английский) — подсказать и дать выгрузить */
  function otherLangsHint(langs, res) {
    var left = {}, mine = {}, got = {};
    (res || []).forEach(function (r) { got[r.language] = (got[r.language] || 0) + r.strings; });
    pool(comps, 4, function (x) {
      return translations(x.p, x.c).then(function (trs) {
        var ml = tplLangsFor(x, langs);
        trs.forEach(function (t) {
          var code = t.language.code;
          if (t.is_source || /generated/i.test(t.language.name || '') || t.total == null || t.translated == null) return;
          var n = t.total - t.translated;
          if (ml.indexOf(code) >= 0) { mine[code] = (mine[code] || 0) + n; return; }
          if (langs.indexOf(code) >= 0) return;   // отмечен, но этому компоненту по шаблону не нужен
          if (n > 0) left[code] = (left[code] || 0) + n;
        });
      }, function () {});
    }).then(function () {
      /* сверка с Weblate по отмеченным языкам: что он считает непереведённым и что пришло в файлах */
      var stat = Object.keys(mine).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); });
      var odd = stat.filter(function (c) { return mine[c] > 0 && !got[c]; });
      if (odd.length) results.insertBefore(el('div', { class: 'err', text: 'Странно: по данным Weblate непереведённое есть (' +
        odd.map(function (c) { return langName(c) + ' — ' + mine[c] + ' стр'; }).join(', ') +
        '), а в выгрузке пусто. ' + (fuzzy.checked ? '' : 'Попробуй включить «включать строки «требует правки»». ') }, [
          EXPORT_DEBUG.length ? el('button', { class: 'b g s', text: '⬇ Скачать ответ Weblate для разбора', onclick: function () {
            var files = [];
            EXPORT_DEBUG.forEach(function (d) {
              var base = d.c + '-' + d.lang;
              files.push({ name: base + '-api.po', text: d.api || '' });
              files.push({ name: base + '-download.po', text: d.ui || '' });
            });
            files.push({ name: 'info.txt', text: 'версия ' + (HAS_EXT ? chrome.runtime.getManifest().version : 'закладка') + '\nзапрос q=' + (EXPORT_DEBUG[0] || {}).q + '\n' +
              EXPORT_DEBUG.map(function (d) { return d.p + '/' + d.c + '/' + d.lang + ': Weblate говорит ' + d.expect + ', api ' + (d.api || '').length + ' байт, download ' + (d.ui || '').length + ' байт'; }).join('\n') + '\n' });
            downloadBlob(makeZip(files), 'weblate_debug_' + today() + '.zip');
          } }) : null,
          el('span', { text: ' — пришли мне этот архив, разберусь.' })
        ]), results.firstChild);
      else if (stat.length && !(res || []).length) results.insertBefore(el('p', { class: 'muted', text: 'По данным Weblate в отмеченных языках всё переведено: ' +
        stat.map(function (c) { return langName(c) + ' — ' + mine[c]; }).join(', ') + ' непереведённых.' }), results.firstChild);
      var codes = Object.keys(left).sort(function (a, b) { return langName(a).localeCompare(langName(b), 'ru'); });
      if (!codes.length) return;
      var box = el('div', { class: 'hint' }, [
        el('span', { text: 'Непереведённое есть ещё в неотмеченных языках: ' + codes.map(function (c) { return langName(c) + ' — ' + left[c] + ' стр'; }).join(', ') + '. ' }),
        el('button', { class: 'b g s', text: 'Отметить и выгрузить', onclick: function () {
          langsBox.querySelectorAll('input').forEach(function (i) { if (codes.indexOf(i.value) >= 0) i.checked = true; });
          runExport();
        } })
      ]);
      results.insertBefore(box, results.firstChild);
    });
  }


  function today() { return new Date().toISOString().slice(0, 10); }
  var ENGLISH_DIR = 'Английский ШТАТ';
  function isEnglish(code) { return baseLang(code) === 'en'; }
  var PLURAL_MARK = '_plural form';
  /* .po — как при ручном скачивании из Weblate: global_site-wb-ios_new-az_Latn.po */
  function poName(r) { return r.ext === 'json' ? fileKey(r.component) + '_' + r.language + PLURAL_MARK + '.json' : scFileName(r); }
  function archivePath(r, layout, englishApart) {
    var folder = englishApart && isEnglish(r.language) ? ENGLISH_DIR
      : layout === 'language' ? langName(r.language)
      : layout === 'flat' ? ''
      : fileKey(r.component);
    return (folder ? folder + '/' : '') + poName(r);
  }
  /* архивы для подрядчиков: отдельный zip на платформу, без английского, со своим summary.csv */
  function saveArchives(res) {
    var layout = currentLayout(), eng = englishApart.checked, byPlat = byPlatform.checked;
    var files = res.filter(function (r) { return !(skipEnglish.checked && isEnglish(r.language)); }).map(function (r) { return { name: (byPlat ? platDir(r.p, r.component) + '/' : '') + archivePath(r, layout, eng), text: r.text }; });
    files.sort(function (a, b) { return a.name.localeCompare(b.name, 'ru'); });
    var csv = '﻿компонент;язык;код;формат;строк;слов\n' + res.map(function (r) {
      return [r.component, langName(r.language), r.language, r.ext || 'po', r.strings, r.words].join(';');
    }).join('\n') + '\n';
    if (!byPlat) files.push({ name: 'summary.csv', text: csv });
    else {
      /* summary — свой в каждой папке платформы */
      var plats = {};
      res.filter(function (r) { return !(skipEnglish.checked && isEnglish(r.language)); }).forEach(function (r) { (plats[platDir(r.p, r.component)] = plats[platDir(r.p, r.component)] || []).push(r); });
      Object.keys(plats).forEach(function (d) {
        files.push({ name: d + '/summary.csv', text: '\ufeffкомпонент;язык;код;формат;строк;слов\n' + plats[d].map(function (r) {
          return [r.component, langName(r.language), r.language, r.ext || 'po', r.strings, r.words].join(';');
        }).join('\n') + '\n' });
      });
    }
    var real = files.filter(function (f) { return !/summary\.csv$/.test(f.name); });
    if (real.length) saveFiles(files, 'weblate_all_' + today() + '.zip');
    else toast('В архив класть нечего — только английский, он уходит в Smartcat');
    var zips = real.map(function (f) { return f.name.split('/')[0]; }).filter(function (x, k, a) { return /^\d{6}_/.test(x) && a.indexOf(x) === k; }).sort();
    return { files: real.length, zips: zips };
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
        if (isEnglish(lang)) {
          t.appendChild(el('tr', {}, [el('td', { title: lang }, [langLabel(lang)]), el('td', { class: 'n', text: String(a.files) }),
            el('td', { class: 'n', text: String(a.strings) }), el('td', { class: 'n', text: String(a.words) }),
            el('td', { class: 'muted', text: 'в Smartcat, не в архив' })]));
          return;
        }
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
        layoutHint.textContent = (byPlatform.checked ? (unzipToDir() ? 'папки ' : 'отдельный zip на платформу: ') + ddmmyy() + '_web / _iOS / _android, внутри ' : '') +
          (l === 'language' ? 'папки по языкам' : l === 'flat' ? 'все файлы в одной папке' : 'папки по компонентам') +
          (skipEnglish.checked ? ', без английского (он — в Smartcat)' : englishApart.checked ? ', английский — в «' + ENGLISH_DIR + '»' : '') + ' + summary.csv' +
          (unzipToDir() ? ' → сразу папками в «' + dirHandle.name + '»' : '') + ' (раскладку можно поменять выше)';
      }
      updateHint();
      layoutBox.addEventListener('change', updateHint);
      englishApart.addEventListener('change', updateHint);
      byPlatform.addEventListener('change', updateHint);
      skipEnglish.addEventListener('change', updateHint);
      function saveAll() { saveArchives(res); }
      results.appendChild(el('div', { class: 'row' }, [
        el('button', { class: 'b', text: '⬇ Скачать архивы ещё раз', onclick: saveAll }),
        layoutHint
      ]));
      /* архивы сохраняем сразу, без лишнего клика */
      if (res.some(function (r) { return !isEnglish(r.language); })) saveAll();
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
    var js = res.filter(function (r) { return r.ext === 'json' && r.strings; });
    if (!po.length && !js.length) return;
    var box = el('div', { class: 'track sec' }, [el('div', { class: 'sech', text: 'Отправить в Smartcat' })]);
    var info4 = el('details', { class: 'more' }, [el('summary', { text: 'Подробности: какие языки и куда' })]);
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
      /* az_N11 и подобные варианты в Smartcat не отправляем — машперевод только в обычный язык (az) */
      po = po.filter(function (r) { return !/_n\d+$/i.test(r.language); });
      js = js.filter(function (r) { return !/_n\d+$/i.test(r.language); });
      var files = po.map(function (r) {
        if (langs.indexOf(r.language) < 0) langs.push(r.language);
        var key = r.p + '-' + fileKey(r.component) + '-' + r.language;
        return { name: key + '.po', key: key, p: r.p, c: r.component, lang: r.language, text: r.text, strings: r.strings, src: r.src };
      }).filter(function (f) { return f.strings; });
      /* плюралки (.json) — тоже в Smartcat: «<компонент>_<язык>_plural form.json» */
      js.forEach(function (r) {
        if (langs.indexOf(r.language) < 0) langs.push(r.language);
        var name = poName(r);
        files.push({ name: name, key: name.replace(/\.json$/i, ''), p: r.p, c: r.component, lang: r.language, text: r.text, strings: r.strings, src: r.src, json: true });
      });
      var jsonCount = 0;
      /* веб: в Smartcat уходит только английский — в свой проект («МП Web»), в папку «ДДММГГ web»; остальные языки веба — только в архиве */
      var webAll = files.filter(function (f) { return scPlatform(f.p, f.c) === 'web'; });
      var webEn = webAll.filter(function (f) { return isEnglish(f.lang); });
      var webSkip = webAll.filter(function (f) { return !isEnglish(f.lang); });
      files = files.filter(function (f) { return scPlatform(f.p, f.c) !== 'web'; });
      var webRef = c.enWeb || SC_EN_DEFAULTS.web;
      var webGroup = webEn.length ? { files: webEn, input: el('input', { type: 'text', value: ddmmyy() + ' web' }), note: el('span', { class: 'muted' }) } : null;
      /* проекты по платформе: 290926_android, 290926_ios (дата отправки в начале) */
      function platform(f) { return scPlatform(f.p, f.c); }
      var split = el('input', { type: 'checkbox', style: 'width:auto;display:inline;margin:0 4px 0 0;vertical-align:middle' }); split.checked = sget('wlx_sc_split') !== '0';
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
      if (c.project && files.length) scCall('sc-resolve-project', { ref: c.project }).then(function (pr) {
        targetName = pr.name;
        var pl = projectLangs(pr);
        var warn = el('p', { class: 'red', text: 'В проекте «' + pr.name + '» нет: ' + pl.missing.map(langName).join(', ') +
          ' — эти языки не отправлю (в проекте: ' + pl.all.join(', ') + ').' });
        if (pl.missing.length) { if (groupsBox.parentNode === box) box.insertBefore(warn, groupsBox); else box.appendChild(warn); }
        groupsBox.querySelectorAll('label').forEach(function (l) { if (l.firstChild && l.firstChild.nodeType === 3) l.firstChild.textContent = 'Папка в проекте «' + pr.name + '»'; });
      }, function (e) { msg.className = 'red'; msg.textContent = '✗ Проект в Smartcat: ' + e.message; });
      if (files.length) {
        box.appendChild(el('label', { class: 'muted blk' }, [split, c.project ? ' отдельная папка для android и ios' : ' отдельный проект для android и ios']));
        box.appendChild(groupsBox);
        split.addEventListener('change', buildGroups);
        buildGroups();
      }
      if (webGroup) {
        var webLbl = el('label', { class: 'muted blk' }, ['Веб, английский → папка в проекте «' + webRef + '»', webGroup.input]);
        box.appendChild(el('div', { class: 'scgroup' }, [webLbl,
          el('div', { class: 'muted', text: webEn.length + ' файл(ов): ' + webEn.map(function (f) { return f.c; }).join(', ') }), webGroup.note]));
        scCall('sc-resolve-project', { ref: webRef }).then(function (pr) { webLbl.firstChild.textContent = 'Веб, английский → папка в проекте «' + pr.name + '»'; },
          function (e) { webGroup.note.className = 'red'; webGroup.note.textContent = '✗ Проект «' + webRef + '»: ' + e.message + ' (поправь в ⚙ → «Веб: английский → проект»)'; });
      }
      if (webSkip.length) info4.appendChild(el('p', { class: 'muted', text: 'Веб: ' + webSkip.map(function (f) { return langName(f.lang); })
        .filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') + ' — только в архиве, в Smartcat для веба уходит только английский.' }));
      if (!files.length && !webGroup) { box.appendChild(el('p', { class: 'muted', text: 'Отправлять в Smartcat нечего.' })); return; }
      box.appendChild(info4);
      info4.appendChild(el('p', { class: 'muted', text: 'Языки: ' + langs.map(function (l) { return langName(l) + ' → ' + map(l); }).join(', ') + '.' +
        '' }));
      if (jsonCount) {
        var jsByLang = {};
        res.filter(function (r) { return r.ext === 'json'; }).forEach(function (r) { (jsByLang[r.language] = jsByLang[r.language] || []).push(r.component); });
        info4.appendChild(el('p', { class: 'muted', text: 'Плюралки (.json) в Smartcat не отправляются — они только в архиве: ' +
          Object.keys(jsByLang).sort().map(function (l) { return langName(l) + ' — ' + jsByLang[l].length + ' (' + jsByLang[l].join(', ') + ')'; }).join('; ') + '.' }));
      }
      var msg = el('div', { class: 'muted' });
      /* английский — ещё и в отдельные проекты по платформе, без папки */
      var enTargets = { android: c.enAndroid || SC_EN_DEFAULTS.android, ios: c.enIos || SC_EN_DEFAULTS.ios };
      var enFiles = files.filter(function (f) { return isEnglish(f.lang) && enTargets[scPlatform(f.p, f.c)]; });
      if (enFiles.length) info4.appendChild(el('p', { class: 'muted', text: 'Английский (' + enFiles.length + ' файл.) также уйдёт без папки в проекты для английского (' +
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
                return { name: ddmmyy() + '_' + f.name, text: scSendText(f.text), targetLanguages: [code] };
              }) }).then(function (r) { acc.push({ ok: true, text: pl + ' → ' + pr.name + ' (' + r.documents.length + ' док.)', docIds: r.documents.map(function (d) { return d.id; }),
                pl: pl, projectId: pr.id, files: by[pl].map(function (f) { return ddmmyy() + '_' + f.name; }) }); return acc; });
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
          files: send.map(function (f) { return { name: (folder ? folder + '/' : '') + f.name, text: scSendText(f.text), targetLanguages: [pl.codes[f.lang]] }; }) }).catch(function (e) {
          if (/target languages/i.test(String(e.message))) throw new Error(e.message + ' — отправляла языки: ' +
            send.map(function (f) { return pl.codes[f.lang]; }).filter(function (x, i, a) { return a.indexOf(x) === i; }).join(', ') +
            ', в проекте «' + pr.name + '»: ' + (pl.all.length ? pl.all.join(', ') : 'Smartcat не отдал список языков'));
          throw e;
        }).then(function (r) {
          if (!r.documents.length) throw new Error('Smartcat не показал новых документов в проекте — проверь проект вручную');
          var lmap = {}, byKey = {}, docs = {}, lost = [];
          send.forEach(function (f) { byKey[f.key] = f; lmap[pl.codes[f.lang].toLowerCase()] = f.lang; });
          r.documents.forEach(function (d) {
            var f = byKey[scDocKey(d.name)] || byKey[scDocKey(d.fullPath)];
            if (f) docs[d.id] = { p: f.p, c: f.c, lang: f.lang, json: !!f.json }; else lost.push(d.name + ' (' + d.targetLanguage + ')');
          });
          if (pl.missing.length) lost.unshift('языков нет в проекте, не отправлены: ' + pl.missing.map(langName).join(', '));
          var key = pr.id + '#' + (folder || 'root');
          var list = scProjects().filter(function (x) { return (x.key || x.id) !== key; });
          list.unshift({ key: key, id: pr.id, name: pr.name + (folder ? ' / ' + folder : ''), created: new Date().toISOString(), docs: docs, files: {}, langs: lmap });
          saveScProjects(list);
          return { id: pr.id, name: pr.name + (folder ? ' / ' + folder : ''), docs: Object.keys(docs).length, lost: lost, docIds: Object.keys(docs) };
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
        var webErr = null;
        if (webGroup) chain = chain.then(function (prev) {
          return scCall('sc-resolve-project', { ref: webRef }).then(function (pr) {
            return addToProject(webGroup, pr, webGroup.input.value.trim() || ddmmyy() + ' web');
          }).then(function (res) { res.enDocs = true; made.push(res); webGroup.input.disabled = true; return prev; },
            function (e) { webErr = e; return prev; });   /* ошибка веба не мешает отправить английский android/ios */
        });
        var enRes = [];
        if (enFiles.length) chain = chain.then(function () { return sendEnglish().then(function (r) { enRes = r; }); });
        chain.then(function () {
          if (webErr) throw new Error('веб («' + webRef + '»): ' + webErr.message);
        }).then(function () {
          msg.className = 'ok';
        }, function (e) {
          btn.disabled = false; msg.className = 'red';
          msg.appendChild(el('div', { text: '✗ ' + e.message }));
        }).then(function () {
          renderScImport();
          /* ссылки для сообщения в чат: папка веба в «МП Web», файлы в английских проектах android/ios */
          var chatLinks = {};
          made.forEach(function (p) { if (p.enDocs) chatLinks.web = { url: c.base + '/projects/' + p.id, folder: String(p.name || '').split(' / ').pop() }; });
          enRes.forEach(function (x) { if (x.ok && x.pl) chatLinks[x.pl] = { url: c.base + '/projects/' + x.projectId, file: (x.files || []).join(', ') }; });
          autoDone({ made: made.map(function (p) { return p.name + (p.docs != null ? ' (' + p.docs + ' док.)' : ''); }),
            en: enRes.map(function (x) { return (x.ok ? '' : '✗ ') + x.text; }), error: msg.className === 'red' ? msg.textContent.slice(0, 200) : '', links: chatLinks });
          if (!made.length) return;
          if (msg.className !== 'red') msg.textContent = '';
          msg.insertBefore(el('div', {}, [document.createTextNode(c.project ? '✓ Файлы добавлены: ' : '✓ Созданы проекты: ')].concat(made.map(function (p, i) {
            return el('span', {}, [i ? ', ' : '', el('a', { href: c.base + '/projects/' + p.id, target: '_blank', text: p.name }),
              p.docs != null ? ' (' + p.docs + ' док.)' : '']);
          })).concat([document.createTextNode('. Когда Smartcat переведёт, придёт уведомление Chrome 🔔 — тогда в блоке «Перевод готов» на вкладке Smartcat нажми «В Weblate».')])), msg.firstChild);
          scCall('sc-watch-now').catch(function () {});
          enRes.forEach(function (x) {
            msg.appendChild(el('div', { class: x.ok ? 'ok' : 'red', text: (x.ok ? '✓ Английский: ' : '✗ Английский: ') + x.text }));
          });
          /* назначить переводчиков на английские документы (EN android / EN ios / веб) */
          var enDocIds = [].concat.apply([], enRes.filter(function (x) { return x.ok && x.docIds; }).map(function (x) { return x.docIds; }))
            .concat([].concat.apply([], made.filter(function (p) { return p.enDocs && p.docIds; }).map(function (p) { return p.docIds; })));
          var who = c.enAssign || [], eds = c.enEdit || [];
          var roles = [{ stage: 1, label: 'перевод', list: who }, { stage: 2, label: 'редактура', list: eds }].filter(function (x) { return x.list.length; });
          if (enDocIds.length && c.enAssignOn !== false && roles.length) {
            roles.reduce(function (chain, ro) {
              var am = el('div', { class: 'muted', text: 'Назначаю на английский (' + ro.label + '): ' + ro.list.map(function (x) { return x.name; }).join(', ') + '…' });
              msg.appendChild(am);
              return chain.then(function () {
                return scCall('sc-assign', { documentIds: enDocIds, stage: ro.stage, userIds: ro.list.map(function (x) { return x.id; }) }).then(function (res) {
                  am.className = 'ok'; am.textContent = '✓ Английский (' + enDocIds.length + ' док.), ' + ro.label + ' — назначены: ' + ro.list.map(function (x) { return x.name; }).join(', ') + ' (все, кто примет' + (res && res.how === 'myTeam' ? '; через приглашение «Моей команды»' : '') + ')';
                  homeAssignNote('✓ ' + ro.label + ': ' + ro.list.length + ' чел.', true);
                }, function (e) {
                  am.className = 'red'; am.textContent = '✗ Не получилось назначить (' + ro.label + ', этап ' + ro.stage + '): ' + e.message + ' — назначь в Smartcat вручную';
                  homeAssignNote('✗ ' + ro.label + ' не назначена — текст ошибки в «Подробностях»', false);
                });
              });
            }, Promise.resolve());
          } else if (enDocIds.length && !who.length && !eds.length) {
            msg.appendChild(el('div', { class: 'muted', text: 'Переводчики на английский не назначены — выбрать их можно в ⚙ → «Назначать на английский».' }));
          }
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
  function compNorm(x) { return String(x || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  /* все компоненты проектов, с которыми работаем (для поиска по имени и ручного выбора) */
  function knownComps() {
    var projects = [defaultProject(), 'global_site'];
    savedComps().concat(parseLinks(location.pathname)).forEach(function (x) { if (projects.indexOf(x.p) < 0) projects.push(x.p); });
    return Promise.all(projects.filter(function (p, i, a) { return p && a.indexOf(p) === i; }).map(function (p) {
      return projectComponents(p).catch(function () { return []; });
    })).then(function (lists) {
      var seen = {}, out = [];
      [].concat.apply([], lists).concat(savedComps()).forEach(function (x) {
        if (x.glossary || seen[x.p + '/' + x.c]) return;
        seen[x.p + '/' + x.c] = 1; out.push({ p: x.p, c: x.c });
      });
      return out;
    });
  }
  function resolveComponent(key) {
    var sc = savedComps(), last = function (c) { return c.split('/').pop(); };
    var cands = sc.filter(function (x) { return fileKey(x.c) === key || x.c === key || x.p + '-' + fileKey(x.c) === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c) === key; });
    if (!cands.length) cands = sc.filter(function (x) { return last(x.c).slice(-(key.length + 1)) === '-' + key; });
    if (cands.length > 1) return Promise.resolve(null);
    if (cands[0]) return withTranslations(cands[0].p, cands[0].c);
    var dp = defaultProject();
    if (key.indexOf(dp + '-') === 0) key = key.slice(dp.length + 1);   // global_site-wb-ios_new → wb-ios_new
    var n = compNorm(key);
    if (n.length < 2) return Promise.resolve(null);
    /* по всем компонентам: без учёта регистра и дефисов (aiAssistant → ai-assistant), потом по окончанию (→ wb-web-ai-assistant) */
    return knownComps().then(function (all) {
      var hit = all.filter(function (x) { return compNorm(fileKey(x.c)) === n || compNorm(last(x.c)) === n || compNorm(x.p + '-' + fileKey(x.c)) === n; });
      if (!hit.length && n.length >= 4) hit = all.filter(function (x) { var m = compNorm(last(x.c)); return m.length > n.length && m.slice(-n.length) === n; });
      if (hit.length === 1) return withTranslations(hit[0].p, hit[0].c);
      if (hit.length > 1) return null;
      return withTranslations(dp, key.split('__').join('/'));
    });
  }
  /* из .json с плюралками убираем то, что осталось на русском (не переведено) */
  /* для плюралки: какую русскую форму выгрузка подставляет в каждый ключ («ключ_one» → «{{count}} товар», «ключ_other» → «{{count}} товаров»…) */
  function pluralPlaceholders(x, fmt, srcCode, tgtCode) {
    var out = {};
    if (!x.source || x.source.length < 2 || !x.context) return out;
    var n = x.target && x.target.length > 1 ? x.target.length : pluralCats(tgtCode).length;
    var tgtCats = fitCats(pluralCats(tgtCode), n), srcCats = fitCats(pluralCats(srcCode), x.source.length);
    pluralSuffixes(fmt, tgtCode, n).forEach(function (suf, i) {
      var j = Math.min(i, x.source.length - 1);
      if (tgtCats && srcCats) {
        j = srcCats.indexOf(tgtCats[i]);
        if (j < 0) j = srcCats.indexOf('many') >= 0 ? srcCats.indexOf('many') : x.source.length - 1;
      }
      out[x.context + suf] = x.source[j];
    });
    return out;
  }
  /* из .json с плюралками убираем то, что не переведено: строка, где ВСЕ формы совпадают с русскими заготовками выгрузки.
     Если хоть одна форма другая — переводчик строку трогал, оставляем (в киргизском «{{count}} товар» — это перевод). */
  function stripJson(u) {
    var keys = Object.keys(u.obj);
    if (keys.some(function (k) { return typeof u.obj[k] !== 'string'; })) return Promise.resolve(u);
    return Promise.all([units(u.p, u.c, u.lang, 'has:plural'), componentFormat(u.p, u.c), withTranslations(u.p, u.c)]).then(function (res) {
      var list = res[0], fmt = res[1], trs = res[2] ? res[2].trs : [];
      var srcT = trs.filter(function (t) { return t.is_source; })[0], srcCode = srcT ? srcT.language.code : 'ru';
      var anySrc = {}, drop = {}, owned = {};
      list.forEach(function (x) { (x.source || []).forEach(function (s) { anySrc[s] = 1; }); });
      list.forEach(function (x) {
        if (!x.context) return;
        var ph = pluralPlaceholders(x, fmt, srcCode, u.lang);
        var mine = keys.filter(function (k) { return k === x.context || k.indexOf(x.context + '_') === 0; });
        if (!mine.length) return;
        mine.forEach(function (k) { owned[k] = 1; });
        var untouched = mine.every(function (k) { var v = u.obj[k]; return !v || (k in ph ? v === ph[k] : anySrc[v]); });
        if (untouched) mine.forEach(function (k) { drop[k] = 1; });
      });
      var kept = {}, dropped = 0;
      keys.forEach(function (k) {
        var v = u.obj[k];
        if (!v || drop[k] || (!owned[k] && anySrc[v])) dropped++; else kept[k] = v;
      });
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
      applyPoFix(u);
      var inf = poInfo(u.text);
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
    var parts = f.name.split('/'), base = parts.pop().replace(/\.(po|json)$/i, '').replace(/\s*\(\d+\)$/, '');
    /* плюралки: «wb-web-loyalty_kk_plural form», «…_plural form(kk)», «…_plural form.kk», «…_plural form (1)» */
    var plm = /^(.*?)[ _.-]*plurals?(?:[ _-]*forms?)?(?:[ ._-]*\(?([A-Za-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)\)?)?$/i.exec(base), plAlt = '';
    if (plm && plm[1]) { base = plm[1]; plAlt = plm[2] || ''; }
    var namePart = base, wanted = h['Language'] || '', alt = plAlt;
    /* как из Smartcat: «b2b.kk(kk)», «aiAssistant.az(az-Latn)», «kk(kk)» */
    var scm = /^(.*?)[._ -]?([A-Za-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)\(([^)]+)\)$/.exec(base);
    var suffix = !scm && /^(.+)[._-]([a-z]{2,3}(?:[_@-][A-Za-z0-9]+)?)$/.exec(base);
    if (scm) { namePart = scm[1]; wanted = wanted || scm[2]; alt = scm[3]; }
    else if (!suffix && plAlt) { wanted = wanted || plAlt; }
    else if (suffix) { namePart = suffix[1]; wanted = wanted || suffix[2]; }
    var folder = parts.length ? parts[parts.length - 1] : '';
    var folderLang = folder === ENGLISH_DIR ? 'en' : folder;
    if (!wanted && (!scm && !suffix)) wanted = '';
    /* компонент: из имени файла, иначе из папки (wb-web-ai-assistant/kk(kk).po) */
    var cands = [namePart, folder, parts[parts.length - 2]].filter(function (x, i, a) { return x && x !== ENGLISH_DIR && a.indexOf(x) === i; });
    u.c = namePart || folder;
    u.want = { lang: wanted || folderLang, alt: alt, folder: folderLang };
    if (!wanted && !folderLang) { u.error = 'не понятно, какой это язык'; return Promise.resolve(u); }
    function tryNext(i) {
      if (i >= cands.length) return Promise.resolve(null);
      return resolveComponent(cands[i]).then(function (r) { return r || tryNext(i + 1); });
    }
    return tryNext(0).then(function (r) {
      if (!r) { u.error = 'не нашла компонент «' + u.c + '» — выбери его в колонке «Куда»'; u.needComp = true; return u; }
      return applyComp(u, r, isJson);
    });
  }
  /* компонент найден (или выбран руками) → язык → готово */
  function applyComp(u, r, isJson) {
    u.p = r.p; u.c = r.c; delete u.error; delete u.needComp;
    var w = u.want || {};
    u.lang = (w.lang && matchLanguage(String(w.lang).replace('-', '_'), r.trs)) || (w.alt && matchLanguage(String(w.alt).replace(/-/g, '_'), r.trs)) ||
      (w.alt && matchLanguage(baseLang(w.alt), r.trs)) || byRuName(w.folder, r.trs);
    if (!u.lang) { u.error = 'язык «' + (w.lang || w.alt || '?') + '» не найден в компоненте «' + r.c + '»'; return u; }
    return isJson ? stripJson(u) : u;
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
      return Promise.all(all.map(detect)).then(withPlurals);
    }).then(function (found) {
      found.forEach(function (u) {
        var kind = function (x) { return /\.json$/i.test(x.name) ? 'json' : 'po'; };
        if (!u.error) uploads = uploads.filter(function (x) { return !(x.p === u.p && x.c === u.c && x.lang === u.lang && kind(x) === kind(u)); });
        uploads.push(u);
      });
      renderPreview();
    }).catch(function (e) { errU.textContent = friendly(e); });
  }
  function poStr(s) { return String(s || '').replace(/\\(["\\nt])/g, function (m, c) { return c === 'n' ? '\n' : c === 't' ? '\t' : c; }); }
  /* плюралки в .po для json-компонентов (i18next): Weblate их из .po не принимает (у русского 3 формы, в .po влезает 2) —
     выносим в отдельный «…_plural form.json», а из .po убираем */
  function splitPoPlurals(u) {
    if (!u || u.error || !u.p || !u.c || !u.lang || !u.text || /\.json$/i.test(u.name)) return Promise.resolve(null);
    var es = poEntries(u.text);
    if (!es.some(function (e) { return !e.header && e.plural; })) return Promise.resolve(null);
    return componentFormat(u.p, u.c).then(function (fmt) {
      if (!/i18next|json/i.test(fmt || '')) return null;
      var pl = es.filter(function (e) { return !e.header && !e.obsolete && e.plural; });
      u.text = es.filter(function (e) { return e.header || !e.plural; }).map(function (e) { return e.lines.join('\n'); }).join('\n\n') + '\n';
      var inf = poInfo(u.text);
      u.filled = u.fromSc || u.scImp ? inf.withText : inf.filled; u.total = inf.total;
      if (!u.filled && !u.skip) u.skip = 'кроме плюралок переводить нечего';
      var cats = pluralCats(u.lang), sufs = pluralSuffixes(fmt, u.lang, cats.length), obj = {}, n = 0;
      pl.forEach(function (e) {
        var forms = e.strs.map(poStr);
        if (!forms.some(Boolean) || !e.ctx) return;
        n++;
        var ctx = poStr(e.ctx);
        sufs.forEach(function (suf, i) {
          var v = forms.length === 1 ? forms[0] : forms[i];      // одна форма в .po (грузинский) — во все ключи
          if (v) obj[ctx + suf] = v;
        });
      });
      u.note = (u.note ? u.note + ' · ' : '') + 'плюралки (' + pl.length + ') вынесла в .json — из .po Weblate их не принимает';
      if (!n) return null;
      return { name: u.name.replace(/\.po$/i, '') + ' — плюралки.json', text: JSON.stringify(obj, null, 2) + '\n', obj: obj,
        p: u.p, c: u.c, lang: u.lang, filled: Object.keys(obj).length, total: Object.keys(obj).length, derived: true,
        fromSc: u.fromSc, scKey: u.scKey, scImp: u.scImp, opts: u.opts, note: 'плюралки из .po' };
    }, function () { return null; });
  }
  /* добавить к файлам вынесенные плюралки; если подрядчик прислал свой json на тот же компонент и язык — берём его */
  function withPlurals(list) {
    return Promise.all(list.map(splitPoPlurals)).then(function (extra) {
      var real = list.concat(uploads).filter(function (x) { return /\.json$/i.test(x.name) && !x.derived && !x.error; });
      extra.forEach(function (d) {
        if (!d) return;
        if (real.some(function (x) { return x.p === d.p && x.c === d.c && x.lang === d.lang; })) return;
        list.push(d);
      });
      return list;
    });
  }
  /* какие строки не легли: сверяем файл со строками в Weblate */
  function explainUpload(u) {
    var o = u.usedOpts || {};
    return units(u.p, u.c, u.lang, '').then(function (list) {
      var byCtx = {}, bySrc = {};
      list.forEach(function (x) { if (x.context) byCtx[x.context] = x; bySrc[(x.source || []).join('\u001e')] = x; });
      var items = [];
      if (/\.json$/i.test(u.name)) {
        var obj = {}; try { obj = JSON.parse(u.text); } catch (e) {}
        Object.keys(obj).forEach(function (k) { items.push({ key: k, alt: k.replace(/_(zero|one|two|few|many|other|plural|\d+)$/, ''), src: '', val: obj[k] }); });
      } else {
        poEntries(u.text).forEach(function (e) {
          if (e.header || e.obsolete || !e.strs.some(Boolean)) return;
          var k = poStr(e.ctx);
          items.push({ key: k, alt: k, src: poStr(e.msgid), val: e.strs.map(poStr).join(' | ') });
        });
      }
      var out = [];
      items.forEach(function (it) {
        var x = (it.key && (byCtx[it.key] || byCtx[it.alt])) || (!it.key && Object.keys(bySrc).filter(function (k) { return k.split('\u001e')[0] === it.src; }).map(function (k) { return bySrc[k]; })[0]);
        var label = it.key ? it.key + (it.src ? ' — «' + it.src.slice(0, 50) + (it.src.length > 50 ? '…' : '') + '»' : '') : it.src.slice(0, 60);
        if (!x) {
          out.push({ label: label, why: 'нет такой строки в компоненте (не найдено)', href: '/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent(it.key ? 'context:"' + it.alt + '"' : 'source:"' + it.src.slice(0, 60) + '"') });
          return;
        }
        var tgt = (x.target || []).join(' | '), st = x.state || 0, why = '';
        if (st >= 100) why = 'строка только для чтения';
        else if (tgt && tgt === it.val) return;                                   // такой же перевод уже есть — не проблема
        else if (!o.conflicts && st >= 20) why = 'уже переведена — режим «только непереведённые» её не трогает';
        else if (o.conflicts === 'replace-translated' && st >= 30) why = 'одобрена — режим «переведённые» одобренные не трогает';
        else return;
        out.push({ label: label, why: why, href: x.web_url || x.translate_url || ('/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent('context:"' + (x.context || '') + '"')) });
      });
      return out;
    });
  }
  /* ручной выбор компонента, если по имени не нашёлся */
  var compListId = 'wlx-comps-' + Math.random().toString(16).slice(2), pickComps = null;   // не путать с compList на вкладке «Выгрузить»
  function compPicker(u) {
    var inp = el('input', { type: 'text', list: compListId, placeholder: 'начни вводить компонент…', class: 'pick' });
    var ok = el('button', { class: 'b s', text: 'OK', onclick: function () {
      var v = inp.value.trim(), all = pickComps || [];
      var x = all.filter(function (c) { return c.p + '/' + c.c === v || c.c === v; })[0];
      if (!x) { inp.style.borderColor = '#c0392b'; return; }
      ok.disabled = true;
      withTranslations(x.p, x.c).then(function (r) {
        if (!r) throw new Error('нет доступа к компоненту');
        return applyComp(u, r, /\.json$/i.test(u.name));
      }).then(function () {
        uploads = uploads.filter(function (y) { return y === u || !(y.p === u.p && y.c === u.c && y.lang === u.lang && /\.json$/i.test(y.name) === /\.json$/i.test(u.name)); });
        renderPreview();
      }, function (e) { ok.disabled = false; inp.title = e.message; inp.style.borderColor = '#c0392b'; });
    } });
    if (!pickComps) knownComps().then(function (all) {
      pickComps = all;
      var dl = root.getElementById ? root.getElementById(compListId) : null;
      if (!dl) { dl = el('datalist', { id: compListId }); root.appendChild(dl); }
      all.forEach(function (c) { dl.appendChild(el('option', { value: c.p + '/' + c.c })); });
    });
    return el('td', {}, [el('div', { class: 'row', style: 'margin:0;gap:6px;flex-wrap:nowrap' }, [inp, ok])]);
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
        (function () {
          var vr = varScan(u), hn = vr ? vr.filter(function (x) { return x.hard; }).length : 0;
          return el('td', {}, [el('div', { text: u.name }), vr ? el('div', { class: hn ? 'red' : 'muted',
            text: '⚠ проверка: ' + vr.length + ' стр.' + (hn ? (varSkip.checked ? ' — с ошибкой не загружу: ' + hn : ', с ошибкой: ' + hn) : ' — проверь') }) : null]);
        })(),
        u.lang ? el('td', { title: u.p + '/' + u.c + '/' + u.lang }, [el('div', { text: u.c }), langLabel(u.lang)]) : u.needComp ? compPicker(u) : el('td', { text: '—' }),
        el('td', { class: 'n', text: u.filled + ' из ' + u.total }),
        u.row
      ]));
    });
    preview.appendChild(t);
    var withVars = uploads.filter(function (u) { return varScan(u); });
    if (withVars.length) {
      var vt = el('table', {}, [el('tr', {}, [el('th', { text: 'Где' }), el('th', { text: 'Ключ' }), el('th', { text: 'Перевод' }), el('th', { text: 'Что не так' })])]);
      var vn = 0, vh = 0;
      withVars.forEach(function (u) {
        u.vars.forEach(function (x) {
          vn++; if (x.hard) vh++;
          vt.appendChild(el('tr', {}, [el('td', { text: u.c + ' · ' + langName(u.lang) }),
            el('td', {}, [el('a', { href: '/translate/' + u.p + '/' + u.c + '/' + u.lang + '/?q=' + encodeURIComponent(x.ctx ? 'context:"' + x.ctx + '"' : 'source:"' + x.src.slice(0, 60) + '"'), target: '_blank', text: x.ctx || x.src.slice(0, 50) })]),
            el('td', { class: 'brtr', text: x.tr }),
            el('td', {}, x.probs.map(function (p) { return el('div', { class: p.hard ? 'red' : 'muted', text: (p.hard ? '✗ ' : '? ') + p.text }); })
              .concat(x.salvage ? [el('div', { class: 'ok', text: '→ вытащу и загружу «На правку»: «' + x.salvage + '»' })] : []))]));
        });
      });
      preview.appendChild(el('details', vh ? { open: '' } : {}, [el('summary', { class: vh ? 'red' : 'muted',
        text: 'Проверка переводов (переменные, мусор от машперевода) — строк: ' + vn + (vh ? ', с ошибкой: ' + vh : '') + ' (✗ — ошибка, ? — проверь глазами)' }), vt]));
    }
    preview.appendChild(el('div', { class: 'row' }, [
      el('span', { class: 'muted', text: 'Файлов: ' + uploads.length }),
      el('button', { class: 'b g s', text: 'Очистить список', onclick: function () { uploads = []; renderPreview(); } })
    ]));
    upSec.classList.remove('hide');
  }
  /* ----- «Из Smartcat»: забрать машинный перевод и подготовить к загрузке ----- */
  /* список отправок в Smartcat: на вкладке загрузки — «Забрать переводы» (проверить и загрузить вручную),
     на вкладке Smartcat — «Забрать и загрузить в Weblate» одной кнопкой */
  /* дата отправки: из имени папки (ДДММГГ…) или из даты создания */
  function scDay(pr) {
    var m = /(?:^|\/\s*)(\d{2})(\d{2})(\d{2})(?=[ _\-]|$)/.exec(String(pr.name || '').split(' / ').pop());
    var d = m ? new Date(2000 + +m[3], +m[2] - 1, +m[1]) : new Date(pr.created);
    if (isNaN(d)) d = new Date(0);
    d.setHours(0, 0, 0, 0); return d;
  }
  function dayLabel(d) {
    var t = new Date(); t.setHours(0, 0, 0, 0);
    var diff = Math.round((t - d) / 864e5), dm = ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2);
    if (!d.getTime()) return 'Без даты';
    return diff === 0 ? 'Сегодня · ' + dm : diff === 1 ? 'Вчера · ' + dm : dm + ' · ' + ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()];
  }
  function plural(n, a, b, c) { var m10 = n % 10, m100 = n % 100; return n + ' ' + (m10 === 1 && m100 !== 11 ? a : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? b : c); }
  var scRange = sget('wlx_scrange') || '2', scOpen = {};
  function renderScList(box, auto) {
    box.textContent = '';
    if (!HAS_EXT) { box.classList.add('hide'); return; }
    var all = scProjects();
    box.classList.remove('hide');
    var keyOf = function (pr) { return pr.key || pr.id; };
    var cut = new Date(); cut.setHours(0, 0, 0, 0); cut.setDate(cut.getDate() - (scRange === '7' ? 6 : 1));
    var list = scRange === 'all' ? all : all.filter(function (pr) { return scDay(pr) >= cut; });
    var older = all.length - list.length;
    var findMsg = el('span', { class: 'muted' });
    var findBtn = el('button', { class: 'b g s', text: 'Найти отправки', title: 'Восстановить список по файлам в проекте Smartcat за последние 2 недели',
      onclick: function () { recoverScProjects(findBtn, findMsg); } });
    var rangeSeg = el('div', { class: 'seg mini' }, [['2', '2 дня'], ['7', 'Неделя'], ['all', 'Все']].map(function (r) {
      return el('button', { class: 'chipb' + (scRange === r[0] ? ' on' : ''), type: 'button', text: r[1], onclick: function () {
        scRange = r[0]; sset('wlx_scrange', r[0]); renderScImport();
      } });
    }));
    var pending = list.filter(function (pr) { return !pr.uploaded; });
    var allMsg = el('span', { class: 'muted' });
    var allBtn = el('button', { class: 'b s', text: 'Загрузить всё готовое (' + pending.length + ')',
      title: 'Забрать из Smartcat все показанные не загруженные отправки и загрузить их в Weblate одним разом',
      onclick: function () { uploadAllReady(allBtn, allMsg, pending); } });
    /* галочки: загрузить или убрать только отмеченные отправки */
    Object.keys(scSel).forEach(function (k) { if (!list.some(function (pr) { return keyOf(pr) === k; })) delete scSel[k]; });
    var picked = function () { return list.filter(function (pr) { return scSel[keyOf(pr)]; }); };
    var selBtn = el('button', { class: 'b s', title: 'Забрать из Smartcat отмеченные отправки и загрузить в Weblate одним разом',
      onclick: function () { uploadAllReady(selBtn, allMsg, picked()); } });
    var selDel = el('button', { class: 'b g s', text: 'Убрать отмеченные', onclick: function () {
      var ks = picked().map(keyOf);
      saveScProjects(scProjects().filter(function (x) { return ks.indexOf(keyOf(x)) < 0; }));
      ks.forEach(function (k) { delete scSel[k]; }); renderScImport();
    } });
    var selAll = el('input', { type: 'checkbox', title: 'Отметить все / снять' });
    var groups = [], gByKey = {};
    list.forEach(function (pr) {
      var d = scDay(pr), k = String(d.getTime());
      if (!gByKey[k]) { gByKey[k] = { d: d, items: [] }; groups.push(gByKey[k]); }
      gByKey[k].items.push(pr);
    });
    groups.sort(function (a, b) { return b.d - a.d; });
    function updSel() {
      var n = picked().length;
      selBtn.textContent = 'Загрузить отмеченные (' + n + ')';
      selBtn.classList.toggle('hide', !n); selDel.classList.toggle('hide', !n);
      allBtn.classList.toggle('hide', !!n || !pending.length);
      selAll.checked = n > 0 && n === list.length; selAll.indeterminate = n > 0 && n < list.length;
      groups.forEach(function (g) {
        var m = g.items.filter(function (pr) { return scSel[keyOf(pr)]; }).length;
        g.cb.checked = m > 0 && m === g.items.length; g.cb.indeterminate = m > 0 && m < g.items.length;
      });
    }
    var boxes = {};
    selAll.addEventListener('change', function () {
      list.forEach(function (pr) { if (selAll.checked) scSel[keyOf(pr)] = 1; else delete scSel[keyOf(pr)]; boxes[keyOf(pr)].checked = selAll.checked; });
      updSel();
    });
    box.appendChild(el('div', { class: 'head' }, [el('h3', { text: 'Перевод готов → в Weblate' }), findBtn]));
    box.appendChild(el('p', { class: 'hint', text: 'Когда Smartcat переведёт, придёт уведомление 🔔. Загрузка идёт только в непереведённые строки.' }));
    box.appendChild(el('div', { class: 'row listbar' }, [rangeSeg, findMsg]));
    if (list.length) box.appendChild(el('div', { class: 'row' }, [el('label', { class: 'chk' }, [selAll, 'все']), allBtn, selBtn, selDel, allMsg]));
    else box.appendChild(el('p', { class: 'empty', text: all.length ? (scRange === '7' ? 'За неделю отправок нет' : 'За 2 дня отправок нет') : 'Отправок пока нет. Если они были, но пропали — «Найти отправки».' }));
    scRows = {};
    groups.forEach(function (g, gi) {
      var up = g.items.filter(function (pr) { return pr.uploaded; }).length;
      var rd = g.items.filter(function (pr) { return !pr.uploaded && scReady[keyOf(pr)]; }).length;
      var gk = String(g.d.getTime());
      var det = el('details', { class: 'grp' });
      det.open = gk in scOpen ? scOpen[gk] : (gi === 0 || up < g.items.length);
      det.addEventListener('toggle', function () { scOpen[gk] = det.open; });
      g.cb = el('input', { type: 'checkbox', title: 'Отметить всю папку' });
      g.cb.addEventListener('click', function (e) { e.stopPropagation(); });
      g.cb.addEventListener('change', function () {
        g.items.forEach(function (pr) { if (g.cb.checked) scSel[keyOf(pr)] = 1; else delete scSel[keyOf(pr)]; boxes[keyOf(pr)].checked = g.cb.checked; });
        updSel();
      });
      det.appendChild(el('summary', {}, [g.cb, el('span', { class: 'gico', text: '📁' }), el('b', { text: dayLabel(g.d) }),
        el('span', { class: 'muted', text: plural(g.items.length, 'отправка', 'отправки', 'отправок') }),
        el('span', { class: 'pill ' + (up === g.items.length ? 'p-ok' : rd ? 'p-ready' : 'p-wait'),
          text: up === g.items.length ? '✓ загружено' : rd ? '🔔 готово ' + rd : up ? 'загружено ' + up + ' из ' + g.items.length : 'в работе' })]));
      g.items.forEach(function (pr) {
        var st = el('span', { class: pr.uploaded ? 'ok' : 'muted',
          text: pr.uploaded ? '✓ в Weblate ' + fmtDate(pr.uploaded) : (scReady[keyOf(pr)] ? '🔔 перевод готов' : '') });
        var get = el('button', { class: 'b s', text: 'В Weblate', title: 'Забрать готовые переводы из Smartcat и загрузить в Weblate («только непереведённые строки»)',
          onclick: function () { fetchSc(pr, st, get, auto); } });
        var zip = el('button', { class: 'b g s', text: 'ZIP', title: 'Скачать готовые переводы из Smartcat архивом (в Weblate ничего не загружается)',
          onclick: function () { zipSc(pr, st, zip); } });
        var del = el('button', { class: 'b g s ico', text: '×', title: 'Убрать из списка', onclick: function () {
          saveScProjects(scProjects().filter(function (x) { return keyOf(x) !== keyOf(pr); })); renderScImport();
        } });
        scRows[keyOf(pr)] = { st: st, get: get };
        var cb = el('input', { type: 'checkbox', title: 'Отметить' });
        cb.checked = !!scSel[keyOf(pr)]; boxes[keyOf(pr)] = cb;
        cb.addEventListener('change', function () { if (cb.checked) scSel[keyOf(pr)] = 1; else delete scSel[keyOf(pr)]; updSel(); });
        det.appendChild(el('div', { class: 'scrow' }, [cb,
          el('div', { class: 'grow' }, [el('b', { text: String(pr.name || '').split(' / ').pop() }),
            el('div', { class: 'muted' }, [String(pr.name || '').split(' / ').slice(0, -1).join(' / ') + (pr.created ? ' · ' + fmtDate(pr.created) + ' ' : ' '), st])]),
          get, zip, del]));
      });
      box.appendChild(det);
    });
    if (older && scRange !== 'all') box.appendChild(el('button', { class: 'lnk', type: 'button', text: 'Показать старые отправки (' + older + ') ›',
      onclick: function () { scRange = 'all'; sset('wlx_scrange', 'all'); renderScImport(); } }));
    updSel();
  }
  var scRows = {}, scReady = {}, scSel = {};
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : ('0' + d.getDate()).slice(-2) + '.' + ('0' + (d.getMonth() + 1)).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  /* забрать все незагруженные отправки и загрузить одним разом */
  function uploadAllReady(btn, msg, only) {
    var list = only || scProjects().filter(function (pr) { return !pr.uploaded; });
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
      keys.forEach(function (k) { delete scSel[k]; });
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
          var isJ = (info && info.json) || /^\s*[\[{]/.test(r.text);
          files.push({ name: folder + '/' + (isJ && info ? poName({ p: info.p, component: info.c, language: info.lang, ext: 'json' }) : name + (isJ ? '.json' : '.po')), text: r.text });
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
  function scDocKey(name) { return String(name || '').split('/').pop().replace(/\.(po|json)$/i, ''); }
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
        var u = { name: 'Smartcat/' + key + '.po', text: '', filled: 0, total: 0, fromSc: true, scKey: prKey };
        if (!comp || !lang) { u.error = 'не понимаю, куда это: документ «' + d.name + '», язык ' + d.targetLanguage; uploads.push(u); return Promise.resolve(); }
        u.p = comp.p; u.c = comp.c; u.lang = lang;
        return scCall('sc-export', { documentId: d.id }).then(function (r) {
          u.text = r.text;
          u.json = !!(comp && comp.json) || /^\s*[\[{]/.test(r.text);
          if (u.json) {
            try { u.obj = JSON.parse(r.text); } catch (e) { u.error = 'файл .json из Smartcat не читается'; return; }
            var vals = Object.keys(u.obj).map(function (k) { return u.obj[k]; });
            u.total = vals.length; u.filled = vals.filter(Boolean).length;
          } else {
            applyPoFix(u);
            var inf = poInfo(u.text);
            u.filled = inf.withText; u.total = inf.total;
            if (!inf.withText) u.skip = 'Smartcat вернул пустой перевод — машинный перевод в документе ещё не появился';
          }
          return withTranslations(u.p, u.c).then(function (w) {
            if (!w) { u.error = 'компонент «' + u.c + '» не найден в Weblate'; return; }
            var code = matchLanguage(u.lang, w.trs);           /* в старых именах бывает «uz» вместо «uz_Latn» */
            if (code) u.lang = code; else { u.error = 'языка ' + u.lang + ' нет в компоненте'; return; }
            if (u.json) { u.name = 'x.json'; return stripJson(u); }
          });
        }, function (e) { u.error = e.message; }).then(function () {
          uploads = uploads.filter(function (x) { return !(x.fromSc && x.p === u.p && x.c === u.c && x.lang === u.lang && !!x.json === !!u.json); });
          if (u.p && u.c) u.name = 'Smartcat/' + (u.json ? poName({ p: u.p, component: u.c, language: u.lang, ext: 'json' }) : scFileName({ p: u.p, component: u.c, language: u.lang }));
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
  loadScConfig().then(function (c) {
    if (!c) return;
    fillSetupSelects(c);
    scSetupNote.textContent = 'проект: ' + (c.project || SC_PROJECT_DEFAULT);
  });

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
    var anySc = todo.some(function (u) { return u.fromSc; }), anyVendor = todo.some(function (u) { return !u.fromSc && !u.scImp; });
    var imp = todo.filter(function (u) { return u.scImp; })[0];
    var out = ['Загрузка в Weblate · ' + date + ' · ' + took,
      'Файлов: ' + sent.length + (failed.length ? ' (с ошибкой: ' + failed.length + ')' : '') + ' · строк принято: ' + lines.toLocaleString('ru-RU')];
    if (anySc) out.push('Машинный перевод Smartcat: «Добавить как перевод», «Изменять только непереведённые строки»');
    if (imp) out.push('Готовые переводы из Smartcat: «Добавить как перевод», «' + (imp.opts.conflicts ? 'Изменять переведённые строки' : 'Изменять только непереведённые строки') + '»');
    if (anyVendor) out.push('Файлы подрядчиков: «' + label(optMethod) + '», «' + label(optConf) + '»');
    var by = {};
    sent.forEach(function (u) { (by[u.p + '/' + u.c] = by[u.p + '/' + u.c] || []).push(u); });
    Object.keys(by).sort().forEach(function (k) {
      out.push(k.split('/').slice(1).join('/') + ': ' + by[k].sort(function (a, b) { return langName(a.lang).localeCompare(langName(b.lang), 'ru'); })
        .map(function (u) { return langName(u.lang) + ' ' + (u.accepted != null ? u.accepted : '✓'); }).join(', '));
    });
    var vsk = sent.filter(function (u) { return u.varSkipped; });
    if (vsk.length) {
      out.push('Не загружено строк с ошибкой: ' + sum(vsk, 'varSkipped') + ' (переменная или мусор от машперевода):');
      vsk.forEach(function (u) { u.vars.filter(function (x) { return x.hard; }).forEach(function (x) {
        out.push('  ' + u.c + ' · ' + langName(u.lang) + ' · ' + (x.ctx || x.src.slice(0, 40)) + ': ' + x.probs.filter(function (p) { return p.hard; })[0].text);
      }); });
    }
    failed.forEach(function (u) { out.push('✗ ' + (u.c || u.name) + ' · ' + (u.lang ? langName(u.lang) : '') + ': ' + (u.upError || 'не загружено')); });
    var fixedU = sent.filter(function (u) { return u.fixedKeys && u.fixedKeys.length; });
    if (fixedU.length) {
      out.push('Испорчены в Smartcat — не загружены, проверь вручную:');
      fixedU.forEach(function (u) { out.push('  ' + u.c + ' · ' + langName(u.lang) + ': ' + u.fixedKeys.join(', ')); });
    }
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
  /* после загрузки: какие именно строки не легли (не найдено / пропущено) — со ссылками на Weblate */
  function explainAll(list, into) {
    if (!list.length) return;
    var box = el('div', { class: 'blk' }, [el('h2', { text: 'Какие строки не легли' }), el('p', { class: 'muted', text: 'Сверяю файлы со строками в Weblate…' })]);
    (into || upResults).appendChild(box);
    var groups = [];
    pool(list, 3, function (u) {
      return explainUpload(u).then(function (items) { if (items.length) groups.push({ u: u, items: items }); }, function (e) {
        groups.push({ u: u, items: [{ label: '—', why: 'не получилось сверить: ' + e.message }] });
      });
    }).then(function () {
      box.textContent = '';
      box.appendChild(el('h2', { text: 'Какие строки не легли' }));
      if (!groups.length) { box.appendChild(el('p', { class: 'muted', text: 'Всё, что не принято, уже было в Weblate с таким же переводом — смотреть нечего.' })); return; }
      var txt = [];
      groups.sort(function (a, b) { return (a.u.c + a.u.lang).localeCompare(b.u.c + b.u.lang); }).forEach(function (g) {
        var head = g.u.c + ' · ' + langName(g.u.lang) + (/\.json$/i.test(g.u.name) ? ' (json)' : '');
        txt.push(head + ':');
        var t = el('table', {}, [el('tr', {}, [el('th', { text: 'Строка' }), el('th', { text: 'Почему' })])]);
        g.items.forEach(function (it) {
          txt.push('  ' + it.label + ' — ' + it.why);
          t.appendChild(el('tr', {}, [el('td', {}, [it.href ? el('a', { href: it.href, target: '_blank', text: it.label }) : el('span', { text: it.label })]), el('td', { class: 'muted', text: it.why })]));
        });
        box.appendChild(el('details', { open: '' }, [el('summary', { text: head + ' — строк: ' + g.items.length }), t]));
      });
      var text = 'Не легли в Weblate:\n' + txt.join('\n'), note = el('span', { class: 'muted' });
      box.appendChild(el('div', { class: 'row' }, [el('button', { class: 'b g s', text: '📋 Скопировать список', onclick: function () {
        var done = function () { note.textContent = 'Скопировано ✓'; };
        var fb = function () { var a = document.createElement('textarea'); a.value = text; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) {} a.remove(); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fb); else fb();
      } }), note]));
    });
  }
  function runUpload(only, hooks) {
    hooks = hooks || {};
    var todo = uploads.filter(function (u) { return !u.error && !u.skip && !u.sent && (typeof only !== 'function' || only(u)); });
    if (!todo.length && hooks.done) { hooks.done([], null, ''); return; }
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
      if (hooks.tick) hooks.tick(ok, bad, todo.length, secs(t0));
    }
    todo.forEach(function (u) { setRow(u, 'muted', 'в очереди'); });
    progress();
    var tick = setInterval(progress, 1000);
    csrfToken().then(function (token) {
      return pool(todo, 3, function (u) {
        var started = Date.now();
        setRow(u, 'muted', 'загружаю…');
        var rowTimer = setInterval(function () { if (!u.sent) setRow(u, 'muted', 'загружаю… ' + secs(started)); }, 1000);
        var o = u.opts || (u.fromSc ? SC_OPTS : opts);
        /* «переведённые и одобренные» без включённой проверки Weblate не принимает — тогда «переведённые» */
        u.usedOpts = o;
        var sendU = u; u.varSkipped = 0;
        if (varSkip.checked && varScan(u)) {
          var hardV = u.vars.filter(function (x) { return x.hard; });
          if (hardV.length) {
            var badIdx = hardV.map(function (x) { return x.idx; }), newText;
            if (/\.json$/i.test(u.name)) {
              /* плюралку не грузим наполовину: плохая одна форма — пропускаем все формы ключа */
              var jo = JSON.parse(u.text), keep = {}, plBase = function (k) { return k.replace(/_(zero|one|two|few|many|other|plural|\d+)$/, ''); };
              var badBase = badIdx.map(plBase);
              Object.keys(jo).forEach(function (k) { if (badBase.indexOf(plBase(k)) < 0) keep[k] = jo[k]; });
              newText = JSON.stringify(keep, null, 2) + '\n';
            } else newText = dropEntries(u.text, badIdx);
            sendU = Object.assign({}, u, { text: newText }); u.varSkipped = hardV.length;
          }
        }
        return uploadPo(sendU, o, token).catch(function (e) {
          if (o.conflicts !== 'replace-approved' || !/Проверка перевода не включена|review/i.test(String(e.message || e))) throw e;
          u.fellBack = true;
          u.usedOpts = Object.assign({}, o, { conflicts: 'replace-translated' });
          return uploadPo(sendU, u.usedOpts, token);
        }).then(function (r) {
          /* мусор от ИИ, из которого удалось вытащить перевод — отдельной загрузкой «На правку» */
          u.salvaged = 0;
          var items = salvageOn.checked && u.varSkipped ? (u.vars || []).filter(function (x) { return x.hard && x.salvage; }) : [];
          var sv = items.length ? salvageText(u, items) : null;
          if (!sv) return r;
          return uploadPo(Object.assign({}, u, { text: sv.text }), { method: 'fuzzy', fuzzy: 'process', conflicts: u.usedOpts.conflicts }, token)
            .then(function () { u.salvaged = sv.n; return r; }, function (e) { u.salvageErr = friendly(e).split('\n')[0]; return r; });
        }).then(function (r) {
          clearInterval(rowTimer);
          u.sent = true; ok++;
          u.accepted = r.accepted; u.upTotal = r.total; u.upSkipped = r.skipped || 0; u.notFound = r.not_found || 0;
          setRow(u, 'ok', r.viaForm ? '✓ отправлено (проверь в Weblate)'
            : '✓ принято ' + (r.accepted != null ? r.accepted : '?') + ' из ' + (r.total != null ? r.total : '?') +
              (r.skipped ? ', пропущено ' + r.skipped : '') + (r.not_found ? ', не найдено ' + r.not_found : '') +
              (r.skipped || r.not_found ? ' (какие — ниже)' : '') +
              (u.fellBack ? ' · в компоненте выключена проверка — залито с «Изменять переведённые строки»' : '') +
              (u.varSkipped ? ' · с ошибкой не загружено: ' + (u.varSkipped - (u.salvaged || 0)) : '') +
              (u.salvaged ? ' · из мусора ИИ вытащено и загружено «На правку»: ' + u.salvaged : '') +
              (u.salvageErr ? ' · «На правку» не загрузилось: ' + u.salvageErr : ''));
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
      markScDone(todo);
      upResults.appendChild(uploadReport(todo, opts, secs(t0)));
      explainAll(todo.filter(function (u) { return u.sent && (u.upSkipped || u.notFound); }));
      if (hooks.done) hooks.done(todo, opts, secs(t0));
    }).catch(function (e) {
      clearInterval(tick);
      upResults.textContent = friendly(e);
      if (hooks.fail) hooks.fail(e);
    }).then(function () { upBtn.disabled = false; });
  }

  document.body.appendChild(host);
  /* открываемся на главной; сетап, ссылки и состояние отправок подтягиваем из расширения */
  tab('home');
  if (HAS_EXT) {
    loadScConfig().then(function (c) {
      if (!c) return;
      fillSetupSelects(c);
      var st = activeSetup(c);
      if (!homeLinks.value.trim() && st.links) homeLinks.value = st.links;
    });
    scCall('sc-ready-get').then(function (r) { scReady = r || {}; homeRefreshSc(); }, function () { homeRefreshSc(); });
  } else homeRefreshSc();
  window.__wlExport = { show: show, autoSend: autoSend, openTab: function (t) {
    show(); tab(t);
    if (HAS_EXT) syncScProjects().then(function () { return scCall('sc-ready-get'); }).then(function (r) { scReady = r || {}; renderScImport(); }, function () {});
  } };
})();
