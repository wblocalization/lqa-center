#!/usr/bin/env python3
"""Собирает из weblate-export.js закладку (index.html) и расширение Chrome (extension/).

    python bookmarklet/build.py
"""
import html
import re
import shutil
import zipfile
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
    shutil.copyfile(HERE / "weblate-export.js", ROOT / "extension" / "weblate-export.js")
    ext = ROOT / "extension"
    with zipfile.ZipFile(ROOT / "weblate-extension.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(ext.rglob("*")):
            if f.is_file():
                z.write(f, Path("weblate-extension") / f.relative_to(ext))
    print("extension/ и weblate-extension.zip обновлены")


if __name__ == "__main__":
    main()
