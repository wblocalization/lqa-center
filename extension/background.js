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
      enAndroid: c.enAndroid || '', enIos: c.enIos || '', enWeb: c.enWeb || '', enAssign: c.enAssign || [], enEdit: c.enEdit || [], langWeb: c.langWeb || '', langMob: c.langMob || '', links: c.links || '', bandTpl: c.bandTpl || '', bandHook: c.bandHook || '', bandAuto: !!c.bandAuto, enAssignOn: c.enAssignOn !== false, schedOn: !!c.schedOn, sched: c.sched || SCHED_DEFAULT, base: scBase(c), setups: c.setups || [], setup: c.setup || '' };
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
    /* в списке проектов языков может не быть — берём из карточки проекта */
    let langs = hit[0].targetLanguages || [];
    if (!langs.length) {
      try { langs = (await (await scFetch('/project/' + encodeURIComponent(hit[0].id))).json()).targetLanguages || []; } catch (e) {}
    }
    return { id: hit[0].id, name: hit[0].name, targetLanguages: langs };
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
  chrome.alarms.get('sc-sched', (a) => { if (!a) chrome.alarms.create('sc-sched', { periodInMinutes: 1 }); });
}
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);
ensureAlarm();
chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === 'sc-watch') checkSmartcatReady().catch((e) => console.error('Weblate LQA:', e));
  if (a.name === 'sc-sched') schedTick().catch((e) => console.error('Weblate LQA:', e));
});

/* ---------- Отправка android + ios в Smartcat по расписанию (время московское) ----------
   В назначенное время открываем Weblate в фоновой вкладке и жмём «🚀 Выгрузить и отправить в Smartcat».
   Пропустили (компьютер спал, Chrome закрыт) — уведомление с кнопкой «Отправить сейчас», само не шлём.
   Если сегодня уже отправляли android / ios — второй раз не отправляем. */
const SCHED_DEFAULT = 'вт 14:00, пт 10:00';
const DOW = { 'вс': 0, 'пн': 1, 'вт': 2, 'ср': 3, 'чт': 4, 'пт': 5, 'сб': 6 };
const DOW_NAME = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
function parseSched(t) {
  return String(t || '').split(/[,;\n]+/).map((x) => {
    const m = /(вс|пн|вт|ср|чт|пт|сб)\D*(\d{1,2})[:.](\d{2})/i.exec(x.trim());
    return m ? { dow: DOW[m[1].toLowerCase()], h: +m[2], m: +m[3], label: m[1].toLowerCase() + ' ' + m[2].padStart(2, '0') + ':' + m[3] } : null;
  }).filter(Boolean);
}
const mskNow = (t = Date.now()) => new Date(t + 3 * 3600e3);        // UTC-поля этой даты = московское время
const ddmmyyMsk = (d) => String(d.getUTCDate()).padStart(2, '0') + String(d.getUTCMonth() + 1).padStart(2, '0') + String(d.getUTCFullYear()).slice(-2);
async function schedTick() {
  const { sc = {}, schedState = {} } = await chrome.storage.local.get(['sc', 'schedState']);
  if (!sc.schedOn) return;
  const now = Date.now(), m = mskNow(now), day = m.toISOString().slice(0, 10);
  let changed = false;
  for (const s of parseSched(sc.sched || SCHED_DEFAULT)) {
    if (m.getUTCDay() !== s.dow) continue;
    const slot = Date.UTC(m.getUTCFullYear(), m.getUTCMonth(), m.getUTCDate(), s.h, s.m) - 3 * 3600e3;
    const key = day + ' ' + s.label;
    if (now < slot || schedState[key]) continue;
    changed = true;
    if (now - slot <= 20 * 60e3) { schedState[key] = 'run'; await chrome.storage.local.set({ schedState }); await runAuto(s.label); }
    else {
      schedState[key] = 'missed';
      chrome.notifications.create('sc-sched-miss|' + s.label + '|' + now, { type: 'basic', iconUrl: 'icons/icon128.png', priority: 2, requireInteraction: true,
        title: 'Smartcat: пропущена отправка ' + s.label, message: 'В ' + s.label + ' (МСК) компьютер или Chrome были выключены. Выгрузить android и ios и отправить сейчас?',
        buttons: [{ title: 'Отправить сейчас' }, { title: 'Не надо' }] });
    }
  }
  Object.keys(schedState).forEach((k) => { if (Date.parse(k.slice(0, 10)) < now - 14 * 864e5) { delete schedState[k]; changed = true; } });
  if (changed) await chrome.storage.local.set({ schedState });
}
function schedNote(title, message, id) {
  chrome.notifications.create(id || 'sc-sched-done|' + Date.now(), { type: 'basic', iconUrl: 'icons/icon128.png', priority: 2, title, message });
}
let autoTabId = null;
async function runAuto(label) {
  const { scProjects = [] } = await chrome.storage.local.get('scProjects');
  const ld = new Date(), local = String(ld.getDate()).padStart(2, '0') + String(ld.getMonth() + 1).padStart(2, '0') + String(ld.getFullYear()).slice(-2);
  const days = [ddmmyyMsk(mskNow()), local];          // имя папки — по часам компьютера; на всякий случай и московская дата
  const already = scProjects.filter((p) => days.some((d) => new RegExp('#' + d + '_(android|ios)$').test(p.key || '')));
  if (already.length) { schedNote('Smartcat: по расписанию не отправляю', 'Сегодня уже отправлено: ' + already.map((p) => p.name).join(', ') + '. Второй раз не шлю.'); return; }
  const tab = await chrome.tabs.create({ url: WEBLATE_URL, active: false });
  autoTabId = tab.id;
  await new Promise((res) => {
    const f = (tid, info) => { if (tid === tab.id && info.status === 'complete') { chrome.tabs.onUpdated.removeListener(f); res(); } };
    chrome.tabs.onUpdated.addListener(f);
    setTimeout(res, 60000);
  });
  try {
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['weblate-export.js'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, func: (l) => { window.__wlExport && window.__wlExport.autoSend(l); }, args: [label || 'сейчас'] });
  } catch (e) { schedNote('Smartcat: отправка по расписанию не удалась', String(e.message || e)); }
}
SC_HANDLERS['sc-auto-done'] = async (m) => {
  const text = m.error ? '✗ ' + m.error : m.nothing ? 'Нечего отправлять — всё переведено 🎉'
    : 'Отправлено: ' + (m.made || []).join(', ') + ((m.en || []).length ? '. Английский: ' + m.en.join(', ') : '');
  schedNote(m.error ? 'Smartcat: отправка по расписанию не удалась' : 'Smartcat: отправлено по расписанию (' + (m.slot || '') + ')', text.slice(0, 300));
  if (autoTabId) { const id = autoTabId; autoTabId = null; setTimeout(() => chrome.tabs.remove(id).catch(() => {}), 60000); }
  return { ok: true };
};
SC_HANDLERS['sc-sched-run-now'] = async () => { await runAuto('вручную'); return { ok: true }; };
chrome.notifications.onButtonClicked.addListener((id, idx) => {
  if (!id.startsWith('sc-sched-miss|')) return;
  chrome.notifications.clear(id);
  if (idx === 0) runAuto(id.split('|')[1]).catch((e) => console.error('Weblate LQA:', e));
});
chrome.runtime.onStartup.addListener(() => { schedTick().catch(() => {}); });

chrome.notifications.onClicked.addListener(async (id) => {
  if (!id.startsWith('sc-ready|') && !id.startsWith('sc-sched-done|')) return;
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

/* все проекты аккаунта (постранично), свежие сверху */
SC_HANDLERS['sc-projects'] = async () => {
  const out = [], seen = new Set(), step = 100;
  for (let off = 0; off < 3000; off += step) {
    const list = await (await scFetch('/project/list?offset=' + off + '&limit=' + step)).json();
    if (!Array.isArray(list) || !list.length) break;
    let fresh = 0;
    list.forEach((p) => { if (!seen.has(p.id)) { seen.add(p.id); fresh++; out.push({ id: p.id, name: p.name, status: p.status || '',
      created: p.creationDate || '', modified: p.modificationDate || p.creationDate || '', deadline: p.deadline || '',
      targetLanguages: p.targetLanguages || [] }); } });
    if (list.length < step || !fresh) break;       // последняя страница (или API не умеет offset)
  }
  out.sort((a, b) => String(b.modified).localeCompare(String(a.modified)));
  return out;
};
/* «Моя команда» в Smartcat — для назначения переводчиков */
SC_HANDLERS['sc-team'] = async () => {
  const out = [], seen = new Set();
  for (let skip = 0; skip < 2000; skip += 100) {
    const r = await scFetch('/account/searchMyTeam', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skip, limit: 100 }) });
    const list = await r.json();
    const arr = Array.isArray(list) ? list : (list && (list.items || list.users || list.result)) || [];
    let fresh = 0;
    arr.forEach((x) => {
      const id = x.id || x.userId; if (!id || seen.has(id)) return;
      seen.add(id); fresh++;
      out.push({ id, name: [x.firstName, x.lastName].filter(Boolean).join(' ') || x.name || x.email || id, email: x.email || '' });
    });
    if (arr.length < 100 || !fresh) break;
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
};
/* назначить людей из «Моей команды» на документы (этап 1 — перевод); документ после загрузки ещё разбирается — повторяем */
SC_HANDLERS['sc-assign'] = async (m) => {
  const stage = m.stage || 1;
  const json = (o) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(o) });
  /* 1) прямое назначение исполнителей с режимом «распределить между всеми, кто принял»;
     2) запасной путь — приглашение из «Моей команды» (старый способ) */
  const tries = [
    ['assign', '/document/assign', { documentIds: m.documentIds, stageNumber: stage, executives: m.userIds.map((id) => ({ id })), minWordsCountForExecutive: 0, assignmentMode: 'distributeAmongAll' }],
    ['assign', '/document/assign', { documentIds: m.documentIds, stageNumber: stage, executives: m.userIds.map((id) => ({ id, wordsCount: 0 })), minWordsCountForExecutive: 0, assignmentMode: 'DistributeAmongAll' }],
    ['myTeam', '/document/assignFromMyTeam', { documentIds: m.documentIds, stageNumber: stage, strategy: 'distributeAmongAll', userIds: m.userIds }]
  ];
  const errs = [];
  for (let round = 0; round < 6; round++) {
    let notReady = false;
    for (const [how, path, body] of tries) {
      try {
        await scFetch(path, json(body));
        return { ok: true, how, tries: round + 1 };
      } catch (e) {
        const t = String(e.message);
        errs.push(how + ': ' + t.slice(0, 200));
        if (/disassembl|not ready|processing|is being|not found.*document|документ/i.test(t)) notReady = true;
      }
    }
    if (!notReady) break;           // ошибка не про «документ ещё разбирается» — ждать смысла нет
    await sleep(5000);
  }
  throw new Error(errs.slice(-3).join(' | '));
};
/* сообщение в рабочий чат по вебхуку (Band / Mattermost / Slack-совместимый: JSON {"text": …}).
   «простой» запрос без предварительной проверки: ответ чата не читается, поэтому успех не гарантирован */
SC_HANDLERS['band-send'] = async (m) => {
  const url = String(m.url || '').trim();
  if (!/^https:\/\//i.test(url)) throw new Error('ссылка вебхука должна начинаться с https://');
  await fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ text: String(m.text || '') }) });
  return { sent: true };
};
SC_HANDLERS['sc-ready-get'] = async () => (await chrome.storage.local.get('scReady')).scReady || {};
SC_HANDLERS['sc-watch-now'] = () => checkSmartcatReady();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const h = msg && SC_HANDLERS[msg.type];
  if (!h) return;
  h(msg).then((data) => sendResponse({ ok: true, data }), (e) => sendResponse({ ok: false, error: String(e.message || e) }));
  return true;
});
