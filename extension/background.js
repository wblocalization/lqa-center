/* Нажатие на значок расширения: на странице Weblate открывает окно выгрузки/загрузки,
   на любой другой странице — открывает Weblate. */
const WEBLATE_URL = 'https://weblate.wb.ru/';

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || !/^https?:\/\/[^/]*weblate/i.test(tab.url)) {
    chrome.tabs.create({ url: WEBLATE_URL });
    return;
  }
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['weblate-export.js'] });
  } catch (e) {
    console.error('Weblate LQA:', e);
  }
});

/* ---------- Smartcat API ----------
   Ключ API хранится только здесь (chrome.storage расширения), на страницу Weblate он не попадает.
   Страница присылает сообщения { type: 'sc-…' }, запросы к Smartcat идут отсюда (у страницы их не пускает CORS). */
const SC_SERVERS = { eu: 'https://smartcat.com', us: 'https://us.smartcat.com', ea: 'https://ea.smartcat.com' };
const SC_API = '/api/integration/v1';

async function scConfig() {
  const { sc = {} } = await chrome.storage.local.get('sc');
  return sc;
}
function scBase(c) {
  if (c.server === 'custom') return (c.customUrl || '').replace(/\/+$/, '');
  return SC_SERVERS[c.server] || SC_SERVERS.eu;
}
async function scFetch(path, init = {}) {
  const c = await scConfig();
  if (!c.accountId || !c.apiKey) throw new Error('Smartcat не подключён: ⚙ → Account ID и API-ключ');
  const headers = Object.assign({}, init.headers, { Authorization: 'Basic ' + btoa(c.accountId + ':' + c.apiKey) });
  const r = await fetch(scBase(c) + SC_API + path, Object.assign({}, init, { headers }));
  if (!r.ok && r.status !== 204) {
    const t = await r.text();
    throw new Error('Smartcat ' + r.status + (r.status === 401 ? ' (неверный Account ID или ключ)' : '') + ': ' + t.slice(0, 400));
  }
  return r;
}
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

const SC_HANDLERS = {
  async 'sc-get-config'() {
    const c = await scConfig();
    return { server: c.server || 'eu', customUrl: c.customUrl || '', accountId: c.accountId || '', hasKey: !!c.apiKey,
      langMap: c.langMap || '', extra: c.extra || '', project: c.project || '',
      enAndroid: c.enAndroid || '', enIos: c.enIos || '', base: scBase(c) };
  },
  async 'sc-set-config'(m) {
    const c = await scConfig();
    const n = Object.assign({}, c, m.config);
    if (!m.config.apiKey) n.apiKey = c.apiKey;   // пустое поле = оставить сохранённый ключ
    await chrome.storage.local.set({ sc: n });
    return { saved: true };
  },
  async 'sc-check'() {
    const r = await scFetch('/account');
    const j = await r.json();
    return { name: j.name || j.id || '' };
  },
  async 'sc-create'(m) {
    // multipart собираем вручную: «model» — JSON-поле без имени файла (как в примерах Smartcat), дальше файлы
    const boundary = '----weblate' + Math.random().toString(16).slice(2);
    const q = (v) => String(v).replace(/"/g, '%22');
    const parts = ['--' + boundary + '\r\nContent-Disposition: form-data; name="model"\r\nContent-Type: application/json\r\n\r\n' +
      JSON.stringify(m.model) + '\r\n'];
    m.files.forEach((f) => parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + q(f.name) +
      '"\r\nContent-Type: application/octet-stream\r\n\r\n', f.text, '\r\n'));
    parts.push('--' + boundary + '--\r\n');
    const r = await scFetch('/project/create', {
      method: 'POST', body: new Blob(parts), headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary }
    });
    return await r.json();
  },
  async 'sc-find'(m) {
    // есть ли уже проект с таким именем (для предупреждения); список ищет по вхождению — сверяем точно
    const r = await scFetch('/project/list?projectName=' + encodeURIComponent(m.name) + '&limit=20');
    const list = await r.json();
    return (Array.isArray(list) ? list : []).filter((p) => p.name === m.name).map((p) => ({ id: p.id, name: p.name }));
  },
  /* проект для машперевода: ссылка (…/projects/<id>…) или точное название → { id, name, targetLanguages } */
  async 'sc-resolve-project'(m) {
    const ref = String(m.ref || '').trim();
    const idm = /\/projects?\/([0-9a-f-]{16,})/i.exec(ref) || (/^[0-9a-f-]{16,}$/i.test(ref) ? [0, ref] : null);
    if (idm) {
      const j = await (await scFetch('/project/' + encodeURIComponent(idm[1]))).json();
      return { id: j.id, name: j.name, targetLanguages: j.targetLanguages || [] };
    }
    const list = await (await scFetch('/project/list?projectName=' + encodeURIComponent(ref) + '&limit=50')).json();
    const hit = (Array.isArray(list) ? list : []).filter((p) => p.name === ref);
    if (!hit.length) throw new Error('в Smartcat не нашёлся проект «' + ref + '» — вставь ссылку на него');
    if (hit.length > 1) throw new Error('в Smartcat несколько проектов «' + ref + '» — вставь ссылку на нужный');
    return { id: hit[0].id, name: hit[0].name, targetLanguages: hit[0].targetLanguages || [] };
  },
  /* добавить файлы в существующий проект (путь в имени файла = папка) и вернуть только новые документы */
  async 'sc-add-docs'(m) {
    const before = await (await scFetch('/project/' + encodeURIComponent(m.projectId))).json();
    const known = new Set((before.documents || []).map((d) => d.id));
    const boundary = '----weblate' + Math.random().toString(16).slice(2);
    const q = (v) => String(v).replace(/"/g, '%22');
    const parts = [];
    // языки перевода — у каждого файла свои (файл на язык)
    if (m.files.some((f) => f.targetLanguages)) {
      const models = m.files.map((f) => (f.targetLanguages ? { targetLanguages: f.targetLanguages } : {}));
      parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="documentModel"\r\nContent-Type: application/json\r\n\r\n' +
        JSON.stringify(models) + '\r\n');
    }
    m.files.forEach((f) => parts.push('--' + boundary + '\r\nContent-Disposition: form-data; name="file"; filename="' + q(f.name) +
      '"\r\nContent-Type: application/octet-stream\r\n\r\n', f.text, '\r\n'));
    parts.push('--' + boundary + '--\r\n');
    await scFetch('/project/document?projectId=' + encodeURIComponent(m.projectId), {
      method: 'POST', body: new Blob(parts), headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary }
    });
    const after = await (await scFetch('/project/' + encodeURIComponent(m.projectId))).json();
    return { name: after.name, documents: (after.documents || []).filter((d) => !known.has(d.id))
      .map((d) => ({ id: d.id, name: d.name, fullPath: d.fullPath || d.path || '', targetLanguage: d.targetLanguage })) };
  },
  /* список отправок в Smartcat — копия в расширении, чтобы не терялся вместе с данными страницы */
  async 'sc-list-get'() {
    const { scProjects = [] } = await chrome.storage.local.get('scProjects');
    return scProjects;
  },
  async 'sc-list-set'(m) {
    await chrome.storage.local.set({ scProjects: m.list || [] });
    return { saved: true };
  },
  async 'sc-project'(m) {
    const r = await scFetch('/project/' + encodeURIComponent(m.id));
    return await r.json();
  },
  async 'sc-export'(m) {
    const r = await scFetch('/document/export?documentIds=' + encodeURIComponent(m.documentId) + '&type=target', { method: 'POST' });
    const task = await r.json();
    for (let i = 0; i < 60; i++) {
      const d = await scFetch('/document/export/' + encodeURIComponent(task.id));
      if (d.status === 200) return { text: await d.text() };
      await sleep(2000);
    }
    throw new Error('Smartcat долго готовит файл — попробуй ещё раз позже');
  },
};

/* ---------- Уведомление «перевод готов» ----------
   Раз в пару минут смотрим отправки из списка: когда Smartcat перевёл все их документы — показываем уведомление.
   Загружать в Weblate всё равно нажимает человек. */
const WATCH_DAYS = 3;

async function checkSmartcatReady() {
  const { scProjects = [], scReady = {}, sc = {} } = await chrome.storage.local.get(['scProjects', 'scReady', 'sc']);
  if (!sc.accountId || !sc.apiKey) return scReady;
  let changed = false;
  for (const pr of scProjects) {
    const key = pr.key || pr.id;
    if (pr.uploaded || scReady[key] || !pr.docs || !Object.keys(pr.docs).length) continue;
    if (pr.created && Date.now() - Date.parse(pr.created) > WATCH_DAYS * 864e5) continue;
    let proj;
    try { proj = await (await scFetch('/project/' + encodeURIComponent(pr.id))).json(); } catch (e) { continue; }
    const docs = (proj.documents || []).filter((d) => pr.docs[d.id]);
    if (!docs.length) continue;
    const ready = docs.every((d) => (!d.documentDisassemblingStatus || d.documentDisassemblingStatus === 'success') &&
      d.pretranslateCompleted !== false);
    if (!ready) continue;
    scReady[key] = new Date().toISOString();
    changed = true;
    try {
      await chrome.notifications.create('sc-ready|' + key, {
        type: 'basic', iconUrl: 'icons/icon128.png', title: 'Smartcat: перевод готов',
        message: (pr.name || 'Отправка') + ' — ' + docs.length + ' файл(ов). Нажми, чтобы открыть и загрузить в Weblate.',
        priority: 2
      });
    } catch (e) { console.error('Weblate LQA:', e); }
  }
  if (changed) await chrome.storage.local.set({ scReady });
  return scReady;
}

function ensureAlarm() {
  chrome.alarms.get('sc-watch', (a) => { if (!a) chrome.alarms.create('sc-watch', { periodInMinutes: 2 }); });
}
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);
ensureAlarm();
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'sc-watch') checkSmartcatReady().catch((e) => console.error('Weblate LQA:', e)); });

chrome.notifications.onClicked.addListener(async (id) => {
  if (!id.startsWith('sc-ready|')) return;
  chrome.notifications.clear(id);
  const tabs = await chrome.tabs.query({ url: WEBLATE_URL + '*' });
  let tab = tabs[0];
  if (tab) {
    await chrome.tabs.update(tab.id, { active: true });
  } else {
    tab = await chrome.tabs.create({ url: WEBLATE_URL });
    await new Promise((res) => {
      const f = (tid, info) => { if (tid === tab.id && info.status === 'complete') { chrome.tabs.onUpdated.removeListener(f); res(); } };
      chrome.tabs.onUpdated.addListener(f);
    });
  }
  await chrome.windows.update(tab.windowId, { focused: true });
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['weblate-export.js'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: () => window.__wlExport && window.__wlExport.openTab('sc') });
  } catch (e) { console.error('Weblate LQA:', e); }
});

SC_HANDLERS['sc-ready-get'] = async () => (await chrome.storage.local.get('scReady')).scReady || {};
SC_HANDLERS['sc-watch-now'] = () => checkSmartcatReady();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const h = msg && SC_HANDLERS[msg.type];
  if (!h) return;
  h(msg).then((data) => sendResponse({ ok: true, data }), (e) => sendResponse({ ok: false, error: String(e.message || e) }));
  return true;
});
