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

/* Запросы к таблице задач (Google Apps Script) идут отсюда: со страницы Weblate их не пускает его защита. */
const TRACKER_URL = /^https:\/\/script\.google(usercontent)?\.com\//;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || msg.type !== 'wlx-tracker') return;
  if (!TRACKER_URL.test(msg.url || '')) {
    sendResponse({ ok: false, error: 'ссылка на таблицу должна начинаться с https://script.google.com/' });
    return;
  }
  const init = msg.method === 'POST'
    ? { method: 'POST', body: msg.body, headers: { 'Content-Type': 'text/plain;charset=utf-8' } }
    : {};
  fetch(msg.url, init)
    .then((r) => r.text())
    .then((text) => sendResponse({ ok: true, text }), (e) => sendResponse({ ok: false, error: String(e) }));
  return true;
});
