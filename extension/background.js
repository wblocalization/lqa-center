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
      langMap: c.langMap || '', extra: c.extra || '', base: scBase(c) };
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

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const h = msg && SC_HANDLERS[msg.type];
  if (!h) return;
  h(msg).then((data) => sendResponse({ ok: true, data }), (e) => sendResponse({ ok: false, error: String(e.message || e) }));
  return true;
});
