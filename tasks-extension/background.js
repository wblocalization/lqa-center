// Правый клик по странице / ссылке / выделенному тексту → «Добавить в задачи».
// Черновик кладём в storage, окно задач подхватит его при открытии.
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'add-task', title: 'Добавить в «Мои задачи»', contexts: ['page', 'link', 'selection'] });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'add-task') return;
  const draft = {
    title: (info.selectionText || '').trim().slice(0, 500),
    link: info.linkUrl || info.pageUrl || (tab && tab.url) || '',
    pageTitle: (tab && tab.title) || '',
    at: Date.now()
  };
  await chrome.storage.local.set({ draft });
  try { await chrome.action.openPopup(); }
  catch (e) { chrome.tabs.create({ url: chrome.runtime.getURL('popup.html?tab=1') }); }
});
