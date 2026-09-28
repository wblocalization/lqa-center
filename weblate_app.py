#!/usr/bin/env python3
"""
Страница для выгрузки непереведённых строк из Weblate.

Запуск: двойной клик по «Запустить.bat» (Windows) / «Запустить.command» (Mac)
или `python weblate_app.py`. Браузер откроется сам.

Страница работает через этот маленький локальный сервер, потому что браузер
не даёт странице напрямую ходить в API Weblate (CORS).
"""

import csv
import io
import json
import threading
import uuid
import webbrowser
import zipfile
from concurrent.futures import ThreadPoolExecutor
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from weblate_export import (
    DEFAULT_URL, Weblate, archive_path, filter_untranslated, match_language, parse_component_ref, po_name,
)

HOST, PORT = "127.0.0.1", 8765
JOBS = {}
LOCK = threading.Lock()


def parse_links(text, default_project="global_site"):
    refs = [l.strip() for l in text.splitlines()]
    refs = [r for r in refs if r and not r.startswith("#")]
    return list(dict.fromkeys(parse_component_ref(r, default_project) for r in refs))


def load_languages(wl, comps):
    langs = {}
    with ThreadPoolExecutor(6) as pool:
        for trs in pool.map(lambda pc: wl.translations(*pc), comps):
            for t in trs:
                if t.get("is_source"):
                    continue
                lang = t["language"]
                langs.setdefault(lang["code"], {"code": lang["code"], "name": lang["name"], "count": 0})
                langs[lang["code"]]["count"] += 1
    return sorted(langs.values(), key=lambda l: l["name"])


def run_job(job, wl, comps, langs, query):
    def one_component(pc):
        p, c = pc
        try:
            trs = wl.translations(p, c)
        except Exception as e:
            with LOCK:
                job["errors"].append({"component": c, "language": "*", "error": str(e)})
                job["done"] += len(langs)
            return
        for wanted in langs:
            try:
                code = match_language(wanted, trs)
                if not code:
                    raise ValueError("языка нет в компоненте")
                raw = wl.download(p, c, code, query).decode("utf-8")
                text, n, words = filter_untranslated(raw)
                if n:
                    job["results"].append({"component": c, "language": code,
                                           "strings": n, "words": words, "po": text})
            except Exception as e:
                job["errors"].append({"component": c, "language": wanted, "error": str(e)})
            finally:
                with LOCK:
                    job["done"] += 1

    try:
        with ThreadPoolExecutor(4) as pool:
            list(pool.map(one_component, comps))
    finally:
        job["finished"] = True


def build_zip(job, lang=None):
    buf = io.BytesIO()
    rows = sorted(job["results"], key=lambda r: (r["language"], r["component"]))
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        for r in rows:
            if lang and r["language"] != lang:
                continue
            name = po_name(r["component"], r["language"]) if lang else archive_path(r["component"], r["language"])
            z.writestr(name, r["po"])
        if not lang:
            s = io.StringIO()
            w = csv.writer(s, delimiter=";")
            w.writerow(["component", "language", "strings", "words"])
            for r in rows:
                w.writerow([r["component"], r["language"], r["strings"], r["words"]])
            z.writestr("summary.csv", "﻿" + s.getvalue())
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def _send(self, code, body, ctype="application/json; charset=utf-8", headers=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False)
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _body(self):
        n = int(self.headers.get("Content-Length", 0))
        return json.loads(self.rfile.read(n) or b"{}")

    def do_GET(self):
        u = urlparse(self.path)
        if u.path == "/":
            return self._send(200, PAGE, "text/html; charset=utf-8")
        if u.path.startswith("/api/status/"):
            job = JOBS.get(u.path.rsplit("/", 1)[1])
            if not job:
                return self._send(404, {"error": "нет такой выгрузки"})
            by_lang = {}
            for r in job["results"]:
                a = by_lang.setdefault(r["language"], {"language": r["language"], "files": 0, "strings": 0, "words": 0})
                a["files"] += 1; a["strings"] += r["strings"]; a["words"] += r["words"]
            return self._send(200, {
                "total": job["total"], "done": job["done"], "finished": job["finished"],
                "languages": sorted(by_lang.values(), key=lambda a: a["language"]),
                "files": sorted(({k: r[k] for k in ("component", "language", "strings", "words")}
                                 for r in job["results"]), key=lambda r: (r["language"], r["component"])),
                "errors": job["errors"],
            })
        if u.path.startswith("/api/download/"):
            job = JOBS.get(u.path.rsplit("/", 1)[1])
            if not job:
                return self._send(404, {"error": "нет такой выгрузки"})
            lang = parse_qs(u.query).get("lang", [None])[0]
            name = f"weblate_{lang or 'all'}_{date.today().isoformat()}.zip"
            return self._send(200, build_zip(job, lang), "application/zip",
                              {"Content-Disposition": f'attachment; filename="{name}"'})
        self._send(404, {"error": "not found"})

    def do_POST(self):
        try:
            data = self._body()
            wl = Weblate(data.get("url") or DEFAULT_URL, data.get("token", "").strip())
            comps = parse_links(data.get("links", ""))
            if not wl.token:
                raise ValueError("Нужен API-токен Weblate")
            if not comps:
                raise ValueError("Вставь хотя бы одну ссылку на компонент")
            if self.path == "/api/languages":
                return self._send(200, {"components": len(comps), "languages": load_languages(wl, comps)})
            if self.path == "/api/export":
                langs = data.get("languages") or []
                if not langs:
                    raise ValueError("Отметь хотя бы один язык")
                job_id = uuid.uuid4().hex
                job = JOBS[job_id] = {"total": len(comps) * len(langs), "done": 0,
                                      "finished": False, "results": [], "errors": []}
                query = "state:<translated" if data.get("include_fuzzy", True) else "state:empty"
                threading.Thread(target=run_job, args=(job, wl, comps, langs, query), daemon=True).start()
                return self._send(200, {"job": job_id})
            self._send(404, {"error": "not found"})
        except Exception as e:
            self._send(400, {"error": str(e)})


PAGE = r"""<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Выгрузка из Weblate</title>
<style>
  :root { --bg:#f6f7f9; --card:#fff; --text:#1d2330; --muted:#6b7385; --line:#e3e6ec;
          --accent:#1b8a6b; --accent-2:#e8f5f0; --err:#c0392b; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--text);
         font: 15px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 860px; margin: 0 auto; padding: 32px 16px 64px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .sub { color: var(--muted); margin: 0 0 24px; }
  .card { background: var(--card); border:1px solid var(--line); border-radius:12px; padding:20px; margin-bottom:16px; }
  .card h2 { font-size: 15px; margin: 0 0 12px; display:flex; gap:8px; align-items:center; }
  .num { display:inline-grid; place-items:center; width:22px; height:22px; border-radius:50%;
         background:var(--accent); color:#fff; font-size:12px; }
  label.f { display:block; font-size:13px; color:var(--muted); margin:10px 0 4px; }
  input[type=text], input[type=password], textarea { width:100%; padding:9px 11px; border:1px solid var(--line);
         border-radius:8px; font: inherit; background:#fff; color:inherit; }
  textarea { min-height: 170px; font: 13px/1.5 ui-monospace, Consolas, monospace; resize: vertical; }
  .row { display:flex; gap:12px; flex-wrap:wrap; align-items:center; }
  button { font: inherit; border:0; border-radius:8px; padding:10px 18px; cursor:pointer;
           background:var(--accent); color:#fff; font-weight:600; }
  button.ghost { background:var(--accent-2); color:var(--accent); }
  button:disabled { opacity:.5; cursor:default; }
  .big { font-size:17px; padding:14px 28px; }
  .langs { display:grid; grid-template-columns: repeat(auto-fill, minmax(190px,1fr)); gap:6px; margin-top:8px; }
  .langs label { display:flex; gap:8px; align-items:center; padding:6px 8px; border-radius:6px; cursor:pointer; }
  .langs label:hover { background: var(--bg); }
  .langs code { color:var(--muted); font-size:12px; }
  .hint { color:var(--muted); font-size:13px; }
  .err { color: var(--err); margin-top:10px; white-space: pre-wrap; }
  .bar { height:10px; background:var(--line); border-radius:6px; overflow:hidden; margin:10px 0; }
  .bar > div { height:100%; width:0; background:var(--accent); transition: width .3s; }
  table { width:100%; border-collapse: collapse; font-size:14px; }
  th, td { text-align:left; padding:8px 6px; border-bottom:1px solid var(--line); }
  th { color:var(--muted); font-weight:500; font-size:13px; }
  th.n, td.n { text-align:right; font-variant-numeric: tabular-nums; }
  a.dl { color: var(--accent); font-weight:600; text-decoration:none; }
  details { margin-top: 12px; } summary { cursor:pointer; color:var(--muted); font-size:13px; }
  .hidden { display:none; }
</style></head>
<body><main>
  <h1>Выгрузка непереведённых строк из Weblate</h1>
  <p class="sub">Вставь ссылки, отметь языки, нажми кнопку. На выходе .po по каждому компоненту, по архиву на язык.</p>

  <div class="card">
    <h2><span class="num">1</span> API-токен Weblate</h2>
    <input type="password" id="token" placeholder="Weblate → Настройки → Доступ к API → скопировать токен">
    <div class="row" style="margin-top:8px">
      <label class="hint"><input type="checkbox" id="remember" checked> запомнить на этом компьютере</label>
    </div>
    <details><summary>Адрес Weblate</summary>
      <input type="text" id="url" value="https://weblate.wb.ru" style="margin-top:8px">
    </details>
  </div>

  <div class="card">
    <h2><span class="num">2</span> Ссылки на компоненты</h2>
    <textarea id="links" placeholder="https://weblate.wb.ru/projects/global_site/wb-web-orders/#translations&#10;https://weblate.wb.ru/projects/global_site/wb-web-kids/#translations&#10;…"></textarea>
    <div class="hint">Можно вставить прямо весь кусок сообщения со ссылками: лишние строки не мешают.</div>
    <div class="row" style="margin-top:12px">
      <button class="ghost" id="loadLangs">Загрузить языки</button>
      <span class="hint" id="langsInfo"></span>
    </div>
    <div class="err" id="err1"></div>
  </div>

  <div class="card hidden" id="langCard">
    <h2><span class="num">3</span> Языки</h2>
    <div class="row">
      <button class="ghost" id="all" style="padding:6px 12px">Все</button>
      <button class="ghost" id="none" style="padding:6px 12px">Снять все</button>
    </div>
    <div class="langs" id="langs"></div>
    <label class="hint" style="display:block;margin-top:12px">
      <input type="checkbox" id="fuzzy" checked> включать строки «требует правки»
    </label>
    <div style="margin-top:16px">
      <button class="big" id="go">Выгрузить</button>
    </div>
    <div class="err" id="err2"></div>
  </div>

  <div class="card hidden" id="resCard">
    <h2><span class="num">4</span> Результат</h2>
    <div class="hint" id="progressText"></div>
    <div class="bar"><div id="bar"></div></div>
    <div id="results"></div>
  </div>
</main>
<script>
const $ = id => document.getElementById(id);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};
$('token').value = store.get('wl_token') || '';
$('url').value = store.get('wl_url') || $('url').value;
$('links').value = store.get('wl_links') || '';
const savedLangs = JSON.parse(store.get('wl_langs') || 'null');

function extractLinks(text) {
  const found = text.match(/https?:\/\/[^\s)<>"']*\/projects\/[^\s)<>"']+/g) || [];
  const plain = text.split(/\n/).map(s => s.trim()).filter(s => /^[\w.-]+(\/[\w.-]+)?$/.test(s));
  return [...new Set(found.length ? found : plain)].join('\n');
}
function payload() {
  if ($('remember').checked) store.set('wl_token', $('token').value.trim()); else store.del('wl_token');
  store.set('wl_url', $('url').value.trim());
  store.set('wl_links', $('links').value);
  return { token: $('token').value.trim(), url: $('url').value.trim(), links: extractLinks($('links').value) };
}
async function post(path, body) {
  const r = await fetch(path, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || r.statusText);
  return j;
}
function friendly(msg) {
  if (/HTTP 401|HTTP 403/.test(msg)) return 'Weblate не принял токен. Проверь, что он скопирован целиком.\n\n' + msg;
  if (/HTTP 404/.test(msg)) return 'Не нашёлся компонент — проверь ссылку.\n\n' + msg;
  if (/urlopen|Name or service|getaddrinfo|timed out/i.test(msg)) return 'Нет связи с Weblate. Включён ли VPN?\n\n' + msg;
  return msg;
}

$('loadLangs').onclick = async () => {
  $('err1').textContent = ''; $('langsInfo').textContent = 'Загружаю…'; $('loadLangs').disabled = true;
  try {
    const j = await post('/api/languages', payload());
    $('langsInfo').textContent = `Компонентов: ${j.components}`;
    $('langs').innerHTML = j.languages.map(l => {
      const def = savedLangs ? savedLangs.includes(l.code) : !/generated/i.test(l.name);
      return `<label><input type="checkbox" value="${l.code}" ${def ? 'checked' : ''}>
              ${l.name} <code>${l.code}</code></label>`;
    }).join('');
    $('langCard').classList.remove('hidden');
  } catch (e) { $('err1').textContent = friendly(e.message); $('langsInfo').textContent = ''; }
  $('loadLangs').disabled = false;
};
$('all').onclick = () => document.querySelectorAll('#langs input').forEach(i => i.checked = true);
$('none').onclick = () => document.querySelectorAll('#langs input').forEach(i => i.checked = false);

$('go').onclick = async () => {
  $('err2').textContent = '';
  const languages = [...document.querySelectorAll('#langs input:checked')].map(i => i.value);
  store.set('wl_langs', JSON.stringify(languages));
  $('go').disabled = true;
  try {
    const { job } = await post('/api/export', { ...payload(), languages, include_fuzzy: $('fuzzy').checked });
    $('resCard').classList.remove('hidden'); $('results').innerHTML = '';
    $('resCard').scrollIntoView({ behavior: 'smooth' });
    poll(job);
  } catch (e) { $('err2').textContent = friendly(e.message); $('go').disabled = false; }
};

async function poll(job) {
  const s = await (await fetch('/api/status/' + job)).json();
  const pct = s.total ? Math.round(100 * s.done / s.total) : 100;
  $('bar').style.width = pct + '%';
  $('progressText').textContent = s.finished ? 'Готово!' : `Скачиваю… ${s.done} из ${s.total}`;
  if (!s.finished) return setTimeout(() => poll(job), 700);
  $('go').disabled = false;
  const esc = t => String(t).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  let html = '';
  if (!s.languages.length) html += '<p>Непереведённых строк нет — всё переведено 🎉</p>';
  else {
    html += `<table><tr><th>Язык</th><th class="n">Файлов</th><th class="n">Строк</th><th class="n">Слов</th><th></th></tr>`;
    for (const l of s.languages)
      html += `<tr><td>${esc(l.language)}</td><td class="n">${l.files}</td><td class="n">${l.strings}</td>
               <td class="n">${l.words}</td><td class="n"><a class="dl" href="/api/download/${job}?lang=${encodeURIComponent(l.language)}">Скачать .zip</a></td></tr>`;
    html += `</table><div style="margin-top:16px"><a class="dl" href="/api/download/${job}">⬇ Скачать всё одним архивом</a>
             <span class="hint"> — папки по компонентам, английский — в «Английский ШТАТ», + summary.csv</span></div>`;
    html += '<details><summary>По компонентам</summary><table><tr><th>Компонент</th><th>Язык</th><th class="n">Строк</th><th class="n">Слов</th></tr>' +
      s.files.map(f => `<tr><td>${esc(f.component)}</td><td>${esc(f.language)}</td><td class="n">${f.strings}</td><td class="n">${f.words}</td></tr>`).join('') +
      '</table></details>';
  }
  if (s.errors.length)
    html += `<details open><summary style="color:var(--err)">Проблемы: ${s.errors.length}</summary><table>` +
      s.errors.map(e => `<tr><td>${esc(e.component)}</td><td>${esc(e.language)}</td><td>${esc(e.error)}</td></tr>`).join('') + '</table></details>';
  $('results').innerHTML = html;
}
</script>
</body></html>
"""


def main():
    url = f"http://{HOST}:{PORT}/"
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError:
        print(f"Уже запущено — открываю {url}")
        webbrowser.open(url)
        return
    print(f"Открыто в браузере: {url}\nНе закрывай это окно, пока работаешь. Для выхода — Ctrl+C.")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
