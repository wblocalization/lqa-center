#!/usr/bin/env python3
"""Собирает index.html с кнопкой-закладкой из weblate-export.js.

    python bookmarklet/build.py
"""
import html
import re
from pathlib import Path
from urllib.parse import quote

HERE = Path(__file__).parent
ROOT = HERE.parent


def build_bookmarklet():
    src = (HERE / "weblate-export.js").read_text(encoding="utf-8")
    src = re.sub(r"^\s*/\*[\s\S]*?\*/[ \t]*\n", "", src, flags=re.M)   # комментарии-блоки
    src = "\n".join(l.strip() for l in src.splitlines() if l.strip())
    return "javascript:" + quote(src, safe="()!*'~;,/?:@&=+$-_.")


def main():
    href = build_bookmarklet()
    page = (HERE / "index.template.html").read_text(encoding="utf-8")
    page = page.replace("{{BOOKMARKLET}}", html.escape(href, quote=True))
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print(f"index.html: закладка {len(href) // 1024} КБ")


if __name__ == "__main__":
    main()
