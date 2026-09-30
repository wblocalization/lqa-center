#!/usr/bin/env python3
"""Собирает из weblate-export.js закладку (index.html) и расширение Chrome (extension/).

    python bookmarklet/build.py
"""
import html
import json
import re
import zipfile
from pathlib import Path
from urllib.parse import quote

HERE = Path(__file__).parent
ROOT = HERE.parent


def load_flags():
    """bookmarklet/flags/<код>.svg → {код: svg}. id внутри SVG получают префикс кода,
    чтобы флаги на одной странице не конфликтовали."""
    flags = {}
    for f in sorted((HERE / "flags").glob("*.svg")):
        code = f.stem
        svg = f.read_text(encoding="utf-8")
        svg = re.sub(r">\s+<", "><", svg).strip()
        svg = re.sub(r'\bid="([^"]+)"', lambda m: f'id="{code}-{m.group(1)}"', svg)
        svg = re.sub(r'url\(#([^)]+)\)', lambda m: f"url(#{code}-{m.group(1)})", svg)
        svg = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{code}-{m.group(1)}"', svg)
        flags[code] = svg
    return flags


def build_source():
    src = (HERE / "weblate-export.js").read_text(encoding="utf-8")
    flags = json.dumps(load_flags(), ensure_ascii=False)
    assert "{} /*FLAGS*/" in src
    return src.replace("{} /*FLAGS*/", flags)


def build_bookmarklet(src):
    src = re.sub(r"^\s*/\*[\s\S]*?\*/[ \t]*\n", "", src, flags=re.M)   # комментарии-блоки
    src = "\n".join(l.strip() for l in src.splitlines() if l.strip())
    return "javascript:" + quote(src, safe="()!*'~;,/?:@&=+$-_.")


def main():
    src = build_source()
    href = build_bookmarklet(src)
    page = (HERE / "index.template.html").read_text(encoding="utf-8")
    page = page.replace("{{BOOKMARKLET}}", html.escape(href, quote=True))
    (ROOT / "index.html").write_text(page, encoding="utf-8")
    print(f"index.html: закладка {len(href) // 1024} КБ")
    (ROOT / "extension" / "weblate-export.js").write_text(src, encoding="utf-8")
    ext = ROOT / "extension"
    with zipfile.ZipFile(ROOT / "weblate-extension.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(ext.rglob("*")):
            if f.is_file():
                z.write(f, Path("weblate-extension") / f.relative_to(ext))
    # Для Chrome Web Store: без "key" (магазин не принимает его, ID назначит сам)
    manifest = json.loads((ext / "manifest.json").read_text(encoding="utf-8"))
    manifest.pop("key", None)
    (ROOT / "store").mkdir(exist_ok=True)
    with zipfile.ZipFile(ROOT / "store" / "weblate-extension-store.zip", "w", zipfile.ZIP_DEFLATED) as z:
        for f in sorted(ext.rglob("*")):
            if f.is_file() and f.name != "manifest.json":
                z.write(f, f.relative_to(ext))
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print("extension/, weblate-extension.zip и store/weblate-extension-store.zip обновлены")


if __name__ == "__main__":
    main()
