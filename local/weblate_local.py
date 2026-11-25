#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Weblate ⇄ Smartcat без расширения.

Запускает на этом компьютере локальную страницу с тем же окном, что в расширении.
В Weblate и Smartcat ходит сама программа (не браузер), поэтому расширение не нужно.

  Windows: двойной клик по «Запустить.bat»
  Mac:     двойной клик по «Запустить.command»

Нужен только Python 3.8+ (ничего доустанавливать не надо).
Токен Weblate и ключ Smartcat хранятся только на этом компьютере: ~/.weblate-lqa/store.json
"""
import json
import mimetypes
import os
import secrets
import sys
import threading
import urllib.error
import urllib.parse
import urllib.request
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
EXT = HERE / "ext" if (HERE / "ext").is_dir() else HERE.parent / "extension"
STORE_DIR = Path(os.environ.get("WEBLATE_LQA_HOME") or (Path.home() / ".weblate-lqa"))
STORE_FILE = STORE_DIR / "store.json"
WEBLATE_DEFAULT = "https://weblate.wb.ru"
PORTS = range(8765, 8775)
SECRET = secrets.token_urlsafe(24)
COOKIE = "wlx_local"
TIMEOUT = 180
# что из запроса страницы передаём дальше (куки, Origin и прочее — нет)
FORWARD = ("accept", "content-type", "authorization")
SC_TEST = os.environ.get("WEBLATE_LQA_SC_TEST", "").rstrip("/")

_lock = threading.Lock()


def load_store():
    try:
        return json.loads(STORE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_store(data):
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    tmp = STORE_FILE.with_suffix(".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
    try:
        os.chmod(tmp, 0o600)
    except OSError:
        pass
    os.replace(tmp, STORE_FILE)


STATE = load_store()
STATE.setdefault("ext", {})   # то, что расширение держало в chrome.storage (настройки, ключ Smartcat, проекты)
STATE.setdefault("app", {})   # токен и адрес Weblate


def weblate_base():
    return (STATE["app"].get("weblate") or WEBLATE_DEFAULT).rstrip("/")


def smartcat_host_ok(host):
    host = (host or "").lower()
    if host == "smartcat.com" or host.endswith(".smartcat.com"):
        return True
    custom = ((STATE["ext"].get("sc") or {}).get("customUrl") or "").strip()
    if custom:
        try:
            return host == (urllib.parse.urlsplit(custom).hostname or "").lower()
        except ValueError:
            return False
    return False


def fetch(method, url, headers, body):
    """Запрос наружу. Возвращает (код, тип, тело) — и для ошибок тоже, чтобы окно показало ответ сервера."""
    req = urllib.request.Request(url, data=body if body else None, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            return r.status, r.headers.get("Content-Type", "application/octet-stream"), r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.headers.get("Content-Type", "text/plain; charset=utf-8"), e.read()
    except Exception as e:   # нет сети, VPN, сертификат и т.п.
        msg = "Не удалось соединиться с %s: %s" % (urllib.parse.urlsplit(url).hostname, e)
        return 502, "text/plain; charset=utf-8", msg.encode("utf-8")


PAGE = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Weblate ⇄ Smartcat</title>
<link rel="icon" href="/ext/icons/icon32.png">
<style>
  html,body{margin:0;height:100%;background:#f4f1fb;font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1d1830}
  @media (prefers-color-scheme:dark){html,body{background:#16131f;color:#efeaf9}}
  #setup{max-width:560px;margin:12vh auto 0;padding:24px;background:rgba(255,255,255,.9);border:1px solid #e3def0;border-radius:16px}
  @media (prefers-color-scheme:dark){#setup{background:#1f1b2b;border-color:#322c44}}
  #setup h1{font-size:20px;margin:0 0 8px}
  #setup p{margin:0 0 12px;opacity:.8}
  #setup input{width:100%;box-sizing:border-box;padding:10px 12px;border-radius:10px;border:1px solid #cfc7e3;font:inherit;margin-bottom:10px;background:transparent;color:inherit}
  #setup button{padding:10px 16px;border-radius:10px;border:0;background:#7c3aed;color:#fff;font:inherit;font-weight:600;cursor:pointer}
  #msg{margin-top:10px;min-height:1.4em}
  #bar{position:fixed;left:12px;bottom:10px;font-size:12px;opacity:.6}
  #bar a{color:inherit}
</style>
</head>
<body>
<input type="hidden" name="csrfmiddlewaretoken" value="local">
<div id="setup" hidden>
  <h1>Подключение к Weblate</h1>
  <p>Нужен токен: Weblate → аватарка → Настройки → Доступ к API → скопировать. Он сохранится только на этом компьютере.</p>
  <input id="wl" placeholder="адрес Weblate">
  <input id="tok" type="password" placeholder="API-токен Weblate" autocomplete="off">
  <button id="go">Сохранить и открыть</button>
  <div id="msg"></div>
</div>
<div id="bar"></div>
<script src="/__shim.js"></script>
</body>
</html>
"""

FRAME = """<!doctype html><meta charset="utf-8"><script>window.__ROLE=%s;</script><script src="/__shim.js"></script><script src="/ext/%s"></script><script>parent.__wlxFrameReady && parent.__wlxFrameReady(window.__ROLE);</script>"""


class Handler(BaseHTTPRequestHandler):
    server_version = "WeblateLocal/1"

    def log_message(self, *a):   # тихо: в окне программы только важное
        pass

    # ---------- ответ ----------
    def send(self, code, body=b"", ctype="text/plain; charset=utf-8", headers=None):
        if isinstance(body, str):
            body = body.encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(body)

    def json(self, obj, code=200):
        self.send(code, json.dumps(obj, ensure_ascii=False), "application/json; charset=utf-8")

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n) if n > 0 else b""

    # ---------- защита: страницу открывает только эта программа ----------
    def allowed(self):
        port = self.server.server_address[1]
        if (self.headers.get("Host") or "").lower() not in ("127.0.0.1:%d" % port, "localhost:%d" % port):
            return False
        origin = self.headers.get("Origin")
        if origin and origin not in ("http://127.0.0.1:%d" % port, "http://localhost:%d" % port):
            return False
        for part in (self.headers.get("Cookie") or "").split(";"):
            k, _, v = part.strip().partition("=")
            if k == COOKIE and secrets.compare_digest(v, SECRET):
                return True
        return False

    def handle_any(self):
        url = urllib.parse.urlsplit(self.path)
        path, query = url.path, urllib.parse.parse_qs(url.query)

        # вход: программа открывает страницу со своим одноразовым ключом
        if path == "/" and query.get("k"):
            if not secrets.compare_digest(query["k"][0], SECRET):
                return self.send(403, "Открой страницу через «Запустить» — эта ссылка устарела.")
            return self.send(302, b"", headers={"Location": "/", "Set-Cookie": "%s=%s; Path=/; HttpOnly; SameSite=Strict" % (COOKIE, SECRET)})
        if not self.allowed():
            return self.send(403, "Эта страница открывается только через «Запустить» (Запустить.bat / Запустить.command).")

        if path == "/":
            return self.send(200, PAGE, "text/html; charset=utf-8")
        if path == "/__shim.js":
            return self.send(200, (HERE / "shim.js").read_bytes(), "text/javascript; charset=utf-8")
        if path == "/__bg.html":
            return self.send(200, FRAME % ('"bg"', "background.js"), "text/html; charset=utf-8")
        if path == "/__off.html":
            return self.send(200, FRAME % ('"off"', "offscreen.js"), "text/html; charset=utf-8")
        if path.startswith("/ext/"):
            return self.static(path[5:])
        if path == "/__store":
            return self.store()
        if path == "/__app":
            return self.app()
        if path == "/__sc":
            return self.smartcat(query)
        if path.startswith(("/api/", "/download/", "/upload/")):
            return self.weblate()
        # ссылки из окна на страницы Weblate (строка, компонент) — открываем настоящий Weblate
        if self.command == "GET":
            return self.send(302, b"", headers={"Location": weblate_base() + self.path})
        self.send(404, "не найдено")

    do_GET = do_POST = do_PUT = do_DELETE = do_PATCH = do_HEAD = handle_any

    # ---------- файлы окна ----------
    def static(self, rel):
        f = (EXT / rel).resolve()
        if EXT.resolve() not in f.parents or not f.is_file():
            return self.send(404, "нет файла")
        ctype = mimetypes.guess_type(f.name)[0] or "application/octet-stream"
        if f.suffix == ".js":
            ctype = "text/javascript; charset=utf-8"
        self.send(200, f.read_bytes(), ctype)

    # ---------- хранилище настроек (вместо chrome.storage) ----------
    def store(self):
        with _lock:
            if self.command == "GET":
                return self.json({"ext": STATE["ext"]})
            try:
                data = json.loads(self.body().decode("utf-8") or "{}")
            except ValueError:
                return self.json({"error": "плохой запрос"}, 400)
            if isinstance(data.get("all"), dict):
                STATE["ext"] = data["all"]
                save_store(STATE)
            return self.json({"ok": True})

    # ---------- токен и адрес Weblate ----------
    def app(self):
        check = bool(urllib.parse.parse_qs(urllib.parse.urlsplit(self.path).query).get("check"))
        out = {}
        if self.command == "POST":
            try:
                data = json.loads(self.body().decode("utf-8") or "{}")
            except ValueError:
                return self.json({"error": "плохой запрос"}, 400)
            base = str(data.get("weblate") or weblate_base()).strip().rstrip("/")
            token = str(data.get("token") or "").strip()
            if not base.lower().startswith(("https://", "http://127.0.0.1:")):
                return self.json({"error": "адрес Weblate должен начинаться с https://", "hasToken": False}, 400)
            if not token:
                return self.json({"error": "вставь токен", "hasToken": False}, 400)
            # сначала проверяем токен в Weblate и только потом сохраняем
            code, _, body = fetch("GET", base + "/api/", {"Authorization": "Token " + token, "Accept": "application/json"}, None)
            if code != 200:
                err = "неверный токен" if code in (401, 403) else body.decode("utf-8", "replace")[:300]
                return self.json({"ok": False, "error": err, "hasToken": False})
            with _lock:
                STATE["app"]["weblate"] = base
                STATE["app"]["token"] = token
                save_store(STATE)
            out["ok"] = True
        token = STATE["app"].get("token") or ""
        out.update({"weblate": weblate_base(), "hasToken": bool(token), "store": str(STORE_FILE)})
        if check and token and "ok" not in out:
            code, _, body = fetch("GET", weblate_base() + "/api/", {"Authorization": "Token " + token, "Accept": "application/json"}, None)
            out["ok"] = code == 200
            if code != 200:
                out["error"] = "неверный токен" if code in (401, 403) else body.decode("utf-8", "replace")[:300]
        self.json(out)

    # ---------- Weblate: тот же запрос, но с токеном ----------
    def weblate(self):
        token = STATE["app"].get("token") or ""
        if not token:
            return self.json({"detail": "Не задан токен Weblate — обнови страницу и введи его"}, 401)
        if self.path.startswith("/upload/"):
            # запасной путь окна через сайт Weblate работает только со входом в браузере; здесь его нет
            return self.send(403, "Weblate не принял файл через API (см. ошибку выше)")
        headers = {k: v for k, v in self.headers.items() if k.lower() in ("accept", "content-type")}
        headers["Authorization"] = "Token " + token
        code, ctype, body = fetch(self.command, weblate_base() + self.path, headers, self.body())
        self.send(code, body, ctype)

    # ---------- Smartcat: запрос уходит отсюда, браузер его сам не пускает ----------
    def smartcat(self, query):
        target = (query.get("u") or [""])[0]
        u = urllib.parse.urlsplit(target)
        if u.scheme != "https" or not smartcat_host_ok(u.hostname):
            return self.send(400, "адрес не похож на Smartcat")
        headers = {k: v for k, v in self.headers.items() if k.lower() in FORWARD}
        if SC_TEST:   # только для проверки программы на заглушке
            target = SC_TEST + u.path + ("?" + u.query if u.query else "")
        code, ctype, body = fetch(self.command, target, headers, self.body())
        self.send(code, body, ctype)


def main():
    if not (EXT / "weblate-export.js").is_file():
        print("Не нашла файлы окна рядом с программой (папка ext). Распакуй архив целиком.")
        return 1
    httpd = None
    for port in PORTS:
        try:
            httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if not httpd:
        print("Не получилось занять порт %d–%d. Закрой другие копии программы и попробуй ещё раз." % (PORTS[0], PORTS[-1]))
        return 1
    httpd.daemon_threads = True
    url = "http://127.0.0.1:%d/?k=%s" % (httpd.server_address[1], SECRET)
    print("Weblate ⇄ Smartcat запущен.")
    print("Страница открылась в браузере. Это окно не закрывай, пока работаешь.")
    print("Если страница не открылась сама, скопируй адрес в браузер:")
    print("  " + url)
    print("Настройки и ключи лежат здесь: %s" % STORE_FILE)
    if not os.environ.get("WEBLATE_LQA_NO_BROWSER"):
        threading.Timer(0.6, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nОстановлено.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
