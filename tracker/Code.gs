/**
 * Трекер задач переводчиков для расширения «Weblate: выгрузка и загрузка переводов».
 * Как подключить — tracker/README.md.
 *
 * Одна строка на листе «Задачи» = задача × язык. Расширение:
 *   - после выгрузки записывает строки (action: export);
 *   - после загрузки переводов обратно в Weblate отмечает их загруженными (action: upload).
 * Лист «Переводчики» (язык → имя → роль) — подсказки для выбора переводчика и редактора в расширении.
 */

var TOKEN = 'ПОМЕНЯЙ-МЕНЯ';   // любое слово-пароль; то же самое вписывается в расширение

var TASKS = 'Задачи';
var PEOPLE = 'Переводчики';
var HEADERS = ['ID', 'Дата выгрузки', 'Задача', 'Ссылка на задачу', 'Команда', 'Компоненты', 'Язык', 'Код',
  'Строк', 'Слов', 'Переводчик', 'Редактор', 'Срок', 'Smartcat', 'Выгрузил(а)', 'Статус', 'Дата загрузки', 'Загрузил(а)',
  'Комментарий', 'Загруженные компоненты'];
var COL = {};
HEADERS.forEach(function (h, i) { COL[h] = i; });

var STATUS_WORK = 'В работе';
var STATUS_DONE = 'Загружено';

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.token !== TOKEN) return json({ ok: false, error: 'неверный токен' });
  ensureSheets();
  if (p.action === 'translators') return json({ ok: true, translators: translators() });
  return json({ ok: true, sheet: SpreadsheetApp.getActiveSpreadsheet().getName() });
}

function doPost(e) {
  var body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return json({ ok: false, error: 'не JSON' }); }
  if (body.token !== TOKEN) return json({ ok: false, error: 'неверный токен' });
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    ensureSheets();
    if (body.action === 'export') return json(recordExport(body.rows || []));
    if (body.action === 'upload') return json(recordUpload(body.items || [], body.who || ''));
    return json({ ok: false, error: 'неизвестное действие' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- выгрузка: новые строки или обновление уже записанных ---------- */
function recordExport(rows) {
  var sh = sheet(TASKS), data = sh.getDataRange().getValues(), added = 0, updated = 0, now = new Date();
  var byId = {};
  for (var i = 1; i < data.length; i++) byId[data[i][COL['ID']]] = i;
  rows.forEach(function (r) {
    var comps = (r.components || []).join(', ');
    var id = (r.task || comps) + ' · ' + r.lang;
    var row = [];
    row[COL['ID']] = id;
    row[COL['Дата выгрузки']] = now;
    row[COL['Задача']] = r.task || '';
    row[COL['Ссылка на задачу']] = r.taskUrl || '';
    row[COL['Команда']] = r.team || '';
    row[COL['Компоненты']] = comps;
    row[COL['Язык']] = r.langName || r.lang;
    row[COL['Код']] = r.lang;
    row[COL['Строк']] = r.strings || 0;
    row[COL['Слов']] = r.words || 0;
    row[COL['Переводчик']] = r.translator || '';
    row[COL['Редактор']] = r.editor || '';
    row[COL['Срок']] = r.deadline || '';
    row[COL['Smartcat']] = r.smartcat || '';
    row[COL['Выгрузил(а)']] = r.who || '';
    row[COL['Статус']] = STATUS_WORK;
    row[COL['Дата загрузки']] = '';
    row[COL['Загрузил(а)']] = '';
    row[COL['Комментарий']] = r.comment || '';
    row[COL['Загруженные компоненты']] = '';
    if (byId[id] !== undefined) {
      sh.getRange(byId[id] + 1, 1, 1, HEADERS.length).setValues([row]);
      updated++;
    } else {
      sh.appendRow(row);
      byId[id] = sh.getLastRow() - 1;
      added++;
    }
  });
  return { ok: true, added: added, updated: updated };
}

/* ---------- загрузка обратно: отметить компонент × язык в открытых строках ---------- */
function baseLang(code) { return String(code || '').toLowerCase().split(/[_\-@]/)[0]; }

function recordUpload(items, who) {
  var sh = sheet(TASKS), data = sh.getDataRange().getValues(), marked = {}, now = new Date();
  items.forEach(function (it) {
    for (var i = 1; i < data.length; i++) {
      var r = data[i];
      if (r[COL['Статус']] === STATUS_DONE) continue;
      if (String(r[COL['Код']]) !== String(it.lang) && baseLang(r[COL['Код']]) !== baseLang(it.lang)) continue;
      var comps = String(r[COL['Компоненты']]).split(/\s*,\s*/).filter(String);
      if (comps.indexOf(it.component) < 0) continue;
      var done = String(r[COL['Загруженные компоненты']] || '').split(/\s*,\s*/).filter(String);
      if (done.indexOf(it.component) < 0) done.push(it.component);
      var left = comps.filter(function (c) { return done.indexOf(c) < 0; });
      r[COL['Загруженные компоненты']] = done.join(', ');
      r[COL['Статус']] = left.length ? 'Частично (' + (comps.length - left.length) + '/' + comps.length + ')' : STATUS_DONE;
      r[COL['Дата загрузки']] = now;
      r[COL['Загрузил(а)']] = who;
      sh.getRange(i + 1, 1, 1, HEADERS.length).setValues([r.slice(0, HEADERS.length)]);
      marked[r[COL['ID']]] = r[COL['Статус']];
    }
  });
  return { ok: true, marked: Object.keys(marked).length, rows: marked };
}

/* ---------- люди: лист «Переводчики» — Язык | Имя | Роль ---------- */
/* Язык: код (en, ky…), название («армянский») или * — любой язык.
   Роль: «переводчик», «редактор», «переводчик, редактор» или «подрядчик» (идёт в подсказки переводчика). */
var PEOPLE_HEADERS = ['Язык (код en/ky…, название или * — любой)', 'Имя', 'Роль (переводчик / редактор / подрядчик)'];

// Штатные переводчики/редакторы EN и подрядчики — из дашборда локализации (лист «Списки»).
var SEED_PEOPLE = [
  ['en', 'Валерия Гасанова', 'переводчик, редактор'],
  ['en', 'Виктория Гусева', 'переводчик, редактор'],
  ['en', 'Влада Тимощенко', 'переводчик, редактор'],
  ['en', 'Дмитрий Меделяновский', 'переводчик, редактор'],
  ['en', 'Максим Селищев', 'переводчик, редактор'],
  ['en', 'Мария Трофимова', 'переводчик, редактор'],
  ['en', 'София Горская', 'переводчик, редактор'],
  ['en', 'Татьяна Козлова', 'переводчик, редактор'],
  ['*', 'LogrusIT', 'подрядчик'],
  ['*', 'LogrusGlobal', 'подрядчик'],
  ['*', 'Бюро переводов', 'подрядчик'],
  ['*', 'JanusWW', 'подрядчик'],
  ['*', 'Awatera', 'подрядчик']
];

function translators() {
  var data = sheet(PEOPLE).getDataRange().getValues(), out = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i][1]) continue;
    var role = String(data[i][2] || '').toLowerCase();
    out.push({
      lang: String(data[i][0]).trim(), name: String(data[i][1]).trim(), role: role,
      translator: !role || /перевод|подряд/.test(role), editor: !role || /редакт/.test(role)
    });
  }
  return out;
}

/* ---------- служебное ---------- */
function ensureSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss.getSheetByName(TASKS)) {
    var t = ss.insertSheet(TASKS);
    t.appendRow(HEADERS);
    t.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    t.setFrozenRows(1);
    t.hideColumns(COL['ID'] + 1);
    t.hideColumns(COL['Загруженные компоненты'] + 1);
  }
  if (!ss.getSheetByName(PEOPLE)) {
    var p = ss.insertSheet(PEOPLE);
    p.appendRow(PEOPLE_HEADERS);
    SEED_PEOPLE.forEach(function (r) { p.appendRow(r); });
    p.getRange(1, 1, 1, PEOPLE_HEADERS.length).setFontWeight('bold');
    p.setFrozenRows(1);
  }
}

function sheet(name) { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name); }

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Запусти один раз вручную из редактора (▶ setup), чтобы создать листы и выдать скрипту доступ к таблице. */
function setup() { ensureSheets(); }
