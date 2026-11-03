(() => {
  'use strict';
  const LANGS = ['английский', 'азербайджанский', 'амхарский', 'армянский', 'грузинский', 'казахский',
    'киргизский', 'таджикский', 'туркменский', 'турецкий', 'узбекский'];
  const MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());

  if (new URLSearchParams(location.search).get('tab')) document.body.classList.add('tab');

  let tasks = [];          // {id, title, langs[], link, date:'YYYY-MM-DD', created}
  let picked = [];         // языки в порядке выбора
  let editId = null;
  let tabUrl = '';
  const now = new Date();
  let ym = { y: now.getFullYear(), m: now.getMonth() };

  const store = {
    load: () => new Promise((r) => chrome.storage.local.get(['tasks', 'draft'], r)),
    save: () => chrome.storage.local.set({ tasks })
  };

  /* ---------- языки ---------- */
  function renderLangs() {
    $('langs').innerHTML = LANGS.map((l) => {
      const i = picked.indexOf(l);
      return '<button type="button" class="chip' + (i >= 0 ? ' on' : '') + '" data-l="' + l + '">' + l + '</button>';
    }).join('');
  }
  $('langs').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const l = b.dataset.l, i = picked.indexOf(l);
    if (i >= 0) picked.splice(i, 1); else picked.push(l);
    renderLangs();
  });
  $('allLangs').onclick = () => { LANGS.forEach((l) => { if (!picked.includes(l)) picked.push(l); }); renderLangs(); };
  $('noLangs').onclick = () => { picked = []; renderLangs(); };

  /* ---------- текст пункта ---------- */
  const itemText = (t) => t.title.trim() + (t.langs && t.langs.length ? ' (' + t.langs.join(', ') + ')' : '');

  /* ---------- список месяца ---------- */
  function monthTasks() {
    const key = ym.y + '-' + pad(ym.m + 1);
    return tasks.filter((t) => t.date.slice(0, 7) === key)
      .sort((a, b) => a.date.localeCompare(b.date) || a.created - b.created);
  }
  function render() {
    const list = monthTasks();
    $('mLabel').innerHTML = MONTHS[ym.m] + ' ' + ym.y + '<small>' + (list.length ? list.length + ' ' + plural(list.length, 'задача', 'задачи', 'задач') : 'пока пусто') + '</small>';
    if (!list.length) {
      $('list').innerHTML = '<div class="empty">В этом месяце задач нет.<br>Добавь первую сверху или через правый клик на странице.</div>';
    } else {
      let html = '', lastDay = '';
      list.forEach((t, i) => {
        if (t.date !== lastDay) {
          lastDay = t.date;
          const d = new Date(t.date + 'T00:00:00');
          html += '<div class="day">' + d.getDate() + ' ' + MONTHS_GEN[d.getMonth()] + ', ' + d.toLocaleDateString('ru-RU', { weekday: 'long' }) + '</div>';
        }
        html += '<div class="task" data-id="' + t.id + '"><div><div class="t"><span class="num">' + (i + 1) + '.</span>' + esc(itemText(t)) + '</div>' +
          '<div class="meta">' + (t.link ? '<a href="' + esc(t.link) + '" target="_blank" rel="noopener">открыть в Бэнде ↗</a>' : '<span class="tag">без ссылки</span>') + '</div></div>' +
          '<div class="acts"><button data-a="edit" title="Изменить" aria-label="Изменить">✎</button><button data-a="del" title="Удалить" aria-label="Удалить">🗑</button></div></div>';
      });
      $('list').innerHTML = html;
    }
    $('copyBtn').disabled = !list.length;
  }
  function plural(n, one, few, many) {
    const a = n % 10, b = n % 100;
    return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? few : many;
  }
  $('prevM').onclick = () => { ym.m--; if (ym.m < 0) { ym.m = 11; ym.y--; } render(); };
  $('nextM').onclick = () => { ym.m++; if (ym.m > 11) { ym.m = 0; ym.y++; } render(); };

  $('list').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const id = b.closest('.task').dataset.id, t = tasks.find((x) => x.id === id); if (!t) return;
    if (b.dataset.a === 'del') {
      if (!confirm('Удалить задачу?\n\n' + itemText(t))) return;
      tasks = tasks.filter((x) => x.id !== id); store.save(); render();
      if (editId === id) resetForm();
    } else {
      editId = id;
      $('title').value = t.title; $('link').value = t.link || ''; $('date').value = t.date;
      picked = (t.langs || []).slice(); renderLangs();
      $('save').textContent = 'Сохранить'; $('cancelEdit').hidden = false; $('form').classList.add('editing');
      $('title').focus();
    }
  });

  /* ---------- форма ---------- */
  function resetForm() {
    editId = null;
    $('form').reset(); $('date').value = iso(new Date());
    $('save').textContent = 'Добавить'; $('cancelEdit').hidden = true; $('form').classList.remove('editing');
    renderLangs();
  }
  $('cancelEdit').onclick = () => { picked = []; resetForm(); };
  $('tabLink').onclick = () => { if (tabUrl) $('link').value = tabUrl; };
  $('title').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('form').requestSubmit(); });

  $('form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = $('title').value.replace(/\s+$/, '').trim();
    if (!title) return;
    let link = $('link').value.trim();
    if (link && !/^https?:\/\//i.test(link)) link = 'https://' + link;
    const data = { title, langs: picked.slice(), link, date: $('date').value || iso(new Date()) };
    if (editId) {
      Object.assign(tasks.find((x) => x.id === editId), data);
      toast('Сохранено');
    } else {
      tasks.push(Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created: Date.now() }, data));
      toast('Добавлено ✓');
    }
    store.save();
    const d = new Date(data.date + 'T00:00:00'); ym = { y: d.getFullYear(), m: d.getMonth() };
    picked = []; resetForm(); render();
  });

  /* ---------- копирование списка ---------- */
  $('copyBtn').onclick = async () => {
    const list = monthTasks(); if (!list.length) return;
    const head = 'Задачи в Band:';
    const html = '<p><b>' + head + '</b></p><ol>' + list.map((t) =>
      '<li>' + (t.link ? '<a href="' + esc(t.link) + '">' + esc(itemText(t)) + '</a>' : esc(itemText(t))) + '</li>').join('') + '</ol>';
    const text = head + '\n\n' + list.map((t, i) => (i + 1) + '. ' + itemText(t) + (t.link ? ' — ' + t.link : '')).join('\n');
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })]);
    } catch (err) {
      const div = document.createElement('div');
      div.contentEditable = 'true'; div.innerHTML = html; div.style.cssText = 'position:fixed;left:-9999px';
      document.body.appendChild(div);
      const r = document.createRange(); r.selectNodeContents(div);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      document.execCommand('copy'); sel.removeAllRanges(); div.remove();
    }
    toast('Скопировано: ' + list.length + ' ' + plural(list.length, 'задача', 'задачи', 'задач') + '. Вставляй — ссылки сохранятся.');
  };

  /* ---------- копия / восстановление ---------- */
  $('menuBtn').onclick = (e) => { e.stopPropagation(); $('menu').hidden = !$('menu').hidden; };
  document.addEventListener('click', (e) => { if (!$('menu').contains(e.target)) $('menu').hidden = true; });
  $('backupBtn').onclick = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ v: 1, tasks }, null, 2)], { type: 'application/json' }));
    a.download = 'moi-zadachi-' + iso(new Date()) + '.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000); $('menu').hidden = true;
  };
  $('restoreInp').onchange = async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const j = JSON.parse(await f.text()), arr = Array.isArray(j) ? j : j.tasks;
      if (!Array.isArray(arr)) throw new Error();
      const have = new Set(tasks.map((t) => t.id)); let n = 0;
      arr.forEach((t) => { if (t && t.id && t.title && t.date && !have.has(t.id)) { tasks.push(t); n++; } });
      store.save(); render(); toast('Восстановлено задач: ' + n);
    } catch (err) { toast('Не получилось прочитать файл'); }
    e.target.value = ''; $('menu').hidden = true;
  };

  let tt;
  function toast(msg) { const el = $('toast'); el.textContent = msg; el.hidden = false; clearTimeout(tt); tt = setTimeout(() => { el.hidden = true; }, 3500); }

  /* ---------- старт ---------- */
  (async () => {
    const s = await store.load();
    tasks = Array.isArray(s.tasks) ? s.tasks : [];
    $('date').value = iso(new Date());
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && /^https?:/i.test(tab.url || '')) tabUrl = tab.url;
    } catch (e) {}
    $('tabLink').hidden = !tabUrl;
    if (tabUrl && /band/i.test(tabUrl)) $('link').value = tabUrl;
    if (s.draft && Date.now() - s.draft.at < 5 * 60 * 1000) {
      if (s.draft.title) $('title').value = s.draft.title;
      if (s.draft.link) $('link').value = s.draft.link;
      chrome.storage.local.remove('draft');
    }
    renderLangs(); render(); $('title').focus();
  })();
})();
