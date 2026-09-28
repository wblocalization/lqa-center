#!/usr/bin/env python3
"""
Выгрузка непереведённых строк из Weblate в .po — сразу для всех компонентов и языков.

Пример:
    python weblate_export.py --links links.txt --langs en ka kk uz ky hy tg am

Токен берётся из переменной окружения WEBLATE_TOKEN, из --token,
или спрашивается при запуске (Weblate → профиль → «Доступ к API»).

Только стандартная библиотека Python 3.8+, ничего ставить не нужно.
"""

import argparse
import csv
import getpass
import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import date

DEFAULT_URL = "https://weblate.wb.ru"
# Weblate search: пустые + «требует правки» (fuzzy)
UNTRANSLATED_QUERY = "state:<translated"


# ---------------------------------------------------------------- HTTP / API

class Weblate:
    def __init__(self, base_url, token):
        self.base = base_url.rstrip("/")
        self.token = token

    def _get(self, url, params=None):
        if not url.startswith("http"):
            url = self.base + url
        if params:
            url += ("&" if "?" in url else "?") + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={
            "Authorization": f"Token {self.token}",
            "Accept": "application/json, */*",
        })
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                return resp.read()
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")[:300]
            raise RuntimeError(f"HTTP {e.code} for {url}: {body}") from None

    def get_json(self, url, params=None):
        return json.loads(self._get(url, params).decode("utf-8"))

    def paginate(self, url):
        while url:
            data = self.get_json(url)
            yield from data["results"]
            url = data.get("next")

    def components(self, project):
        return [c["slug"] for c in self.paginate(f"/api/projects/{project}/components/")]

    def translations(self, project, component):
        return list(self.paginate(f"/api/components/{project}/{component}/translations/"))

    def download(self, project, component, lang, query):
        return self._get(
            f"/api/translations/{project}/{component}/{lang}/file/",
            {"format": "po", "q": query},
        )


# ---------------------------------------------------------------- PO filtering

def _unquote(s):
    s = s.strip()
    if len(s) >= 2 and s[0] == '"' and s[-1] == '"':
        s = s[1:-1]
    return s


def parse_po_blocks(text):
    """Split PO text into raw entry blocks (list of line lists)."""
    blocks, cur = [], []
    for line in text.splitlines():
        if line.strip() == "":
            if cur:
                blocks.append(cur)
                cur = []
        else:
            cur.append(line)
    if cur:
        blocks.append(cur)
    return blocks


def analyze_block(lines):
    """Return dict with msgid, msgstrs, fuzzy, obsolete for one PO entry."""
    fuzzy = any(l.startswith("#,") and "fuzzy" in l for l in lines)
    obsolete = all(l.startswith("#") for l in lines) and any(l.startswith("#~") for l in lines)
    fields, key = {}, None
    for l in lines:
        if l.startswith("#"):
            continue
        m = re.match(r'^(msgctxt|msgid_plural|msgid|msgstr(?:\[\d+\])?)\s+(".*")\s*$', l)
        if m:
            key = m.group(1)
            fields[key] = _unquote(m.group(2))
        elif l.startswith('"') and key:
            fields[key] += _unquote(l)
    msgstrs = [v for k, v in fields.items() if k.startswith("msgstr")]
    return {
        "msgid": fields.get("msgid"),
        "msgid_plural": fields.get("msgid_plural", ""),
        "msgstrs": msgstrs,
        "fuzzy": fuzzy,
        "obsolete": obsolete,
    }


def word_count(s):
    s = s.replace("\\n", " ").replace("\\t", " ")
    s = re.sub(r"<[^>]+>", " ", s)            # html-теги
    s = re.sub(r"\{[^}]*\}|%\w", " ", s)       # плейсхолдеры
    return len(re.findall(r"\w+", s))


def filter_untranslated(po_text):
    """Keep header + entries that are empty or fuzzy. Returns (text, strings, words)."""
    out, n, words = [], 0, 0
    for block in parse_po_blocks(po_text):
        info = analyze_block(block)
        if info["msgid"] is None:           # чистые комментарии
            continue
        if info["msgid"] == "" and not info["msgid_plural"]:
            out.append(block)               # заголовок
            continue
        if info["obsolete"]:
            continue
        done = info["msgstrs"] and all(info["msgstrs"]) and not info["fuzzy"]
        if done:
            continue
        out.append(block)
        n += 1
        words += word_count(info["msgid"]) + word_count(info["msgid_plural"])
    text = "\n\n".join("\n".join(b) for b in out) + "\n"
    return text, n, words


# ---------------------------------------------------------------- helpers

ENGLISH_DIR = "Английский ШТАТ"


def po_name(component, lang):
    return f"{component}_{lang}.po"


def archive_path(component, lang):
    """Папка по компоненту; английский всегда отдельно в «Английский ШТАТ»."""
    folder = ENGLISH_DIR if base_lang(lang) == "en" else component
    return f"{folder}/{po_name(component, lang)}"


def parse_component_ref(ref, default_project):
    """Accept URL like .../projects/global_site/wb-web-orders/#translations or slug."""
    ref = ref.strip()
    m = re.search(r"/projects/([^/#?]+)/([^/#?]+)", ref)
    if m:
        return m.group(1), m.group(2)
    if "/" in ref:
        p, c = ref.split("/", 1)
        return p, c.strip("/")
    return default_project, ref


def base_lang(code):
    return re.split(r"[_\-@]", code.lower())[0]


def match_language(wanted, available):
    """Map user-given code (e.g. 'uz') to Weblate code (e.g. 'uz_Latn')."""
    codes = [t["language"]["code"] for t in available]
    if wanted in codes:
        return wanted
    low = {c.lower(): c for c in codes}
    if wanted.lower() in low:
        return low[wanted.lower()]
    same_base = [c for c in codes if base_lang(c) == base_lang(wanted)]
    if len(same_base) == 1:
        return same_base[0]
    if len(same_base) > 1:
        raise ValueError(f"'{wanted}' неоднозначен: {', '.join(same_base)} — укажи точный код")
    return None


# ---------------------------------------------------------------- main

def main():
    ap = argparse.ArgumentParser(description="Выгрузка непереведённых строк из Weblate (.po)")
    ap.add_argument("--url", default=os.environ.get("WEBLATE_URL", DEFAULT_URL))
    ap.add_argument("--token", default=os.environ.get("WEBLATE_TOKEN"))
    ap.add_argument("--links", help="файл со ссылками/slug'ами компонентов, по одному в строке")
    ap.add_argument("--components", nargs="*", default=[], help="ссылки или slug'и компонентов")
    ap.add_argument("--project", default="global_site", help="проект по умолчанию (global_site)")
    ap.add_argument("--all-components", action="store_true", help="взять все компоненты проекта")
    ap.add_argument("--langs", nargs="*", default=[], help="коды языков: en ka kk uz ky hy tg am")
    ap.add_argument("--list-languages", action="store_true", help="показать языки и выйти")
    ap.add_argument("--query", default=UNTRANSLATED_QUERY, help=f"фильтр Weblate (по умолчанию '{UNTRANSLATED_QUERY}')")
    ap.add_argument("--out", default=f"export_{date.today().isoformat()}", help="папка для результата")
    ap.add_argument("--no-zip", action="store_true", help="не собирать zip по языкам")
    args = ap.parse_args()

    token = args.token or getpass.getpass("Weblate API token: ").strip()
    wl = Weblate(args.url, token)

    refs = list(args.components)
    if args.links:
        with open(args.links, encoding="utf-8-sig") as f:
            refs += [l for l in (x.strip() for x in f) if l and not l.startswith("#")]
    comps = [parse_component_ref(r, args.project) for r in refs]
    if args.all_components:
        comps += [(args.project, c) for c in wl.components(args.project)]
    comps = list(dict.fromkeys(comps))  # dedupe, keep order
    if not comps:
        ap.error("не указаны компоненты (--links, --components или --all-components)")

    if args.list_languages:
        p, c = comps[0]
        for t in wl.translations(p, c):
            print(f"{t['language']['code']:<15} {t['language']['name']}")
        return
    if not args.langs:
        ap.error("не указаны языки (--langs), см. --list-languages")

    os.makedirs(args.out, exist_ok=True)
    summary, errors = [], []
    for p, c in comps:
        print(f"\n== {p}/{c}")
        try:
            translations = wl.translations(p, c)
        except Exception as e:
            print(f"   ! не удалось получить языки: {e}")
            errors.append((c, "*", str(e)))
            continue
        for wanted in args.langs:
            try:
                code = match_language(wanted, translations)
            except ValueError as e:
                print(f"   ! {e}")
                errors.append((c, wanted, str(e)))
                continue
            if not code:
                print(f"   - {wanted}: языка нет в компоненте")
                errors.append((c, wanted, "языка нет в компоненте"))
                continue
            try:
                raw = wl.download(p, c, code, args.query).decode("utf-8")
            except Exception as e:
                print(f"   ! {code}: {e}")
                errors.append((c, code, str(e)))
                continue
            # Дофильтровываем локально (на случай старого Weblate, игнорирующего q)
            text, n, words = filter_untranslated(raw)
            if n == 0:
                print(f"   OK {code}: всё переведено")
                continue
            path = os.path.join(args.out, *archive_path(c, code).split("/"))
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w", encoding="utf-8", newline="\n") as f:
                f.write(text)
            print(f"   -> {code}: {n} строк, {words} слов")
            summary.append({"component": c, "language": code, "strings": n, "words": words, "file": path})

    # Сводка
    summary_path = os.path.join(args.out, "summary.csv")
    with open(summary_path, "w", encoding="utf-8-sig", newline="") as f:
        w = csv.DictWriter(f, fieldnames=["component", "language", "strings", "words", "file"], delimiter=";")
        w.writeheader()
        w.writerows(summary)
    if errors:
        with open(os.path.join(args.out, "errors.csv"), "w", encoding="utf-8-sig", newline="") as f:
            w = csv.writer(f, delimiter=";")
            w.writerow(["component", "language", "error"])
            w.writerows(errors)

    # Zip на каждый язык — удобно отправлять подрядчику
    if not args.no_zip:
        for lang in sorted({s["language"] for s in summary}):
            zpath = os.path.join(args.out, f"{lang}.zip")
            with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
                for s in summary:
                    if s["language"] == lang:
                        z.write(s["file"], os.path.basename(s["file"]))

    print("\nИтого по языкам:")
    langs = {}
    for s in summary:
        agg = langs.setdefault(s["language"], [0, 0, 0])
        agg[0] += 1; agg[1] += s["strings"]; agg[2] += s["words"]
    for lang, (files, n, words) in sorted(langs.items()):
        print(f"  {lang:<10} файлов: {files:<3} строк: {n:<6} слов: {words}")
    print(f"\nГотово: {os.path.abspath(args.out)}  (сводка: summary.csv)")
    if errors:
        print(f"Проблем: {len(errors)} — см. errors.csv")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        sys.exit(1)
    except RuntimeError as e:
        print(f"\nОшибка: {e}", file=sys.stderr)
        sys.exit(1)
