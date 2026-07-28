#!/usr/bin/env python3
"""Keep the 36 public GitHub HTML pages visually aligned with WordPress."""

from __future__ import annotations

import html
import json
import os
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parents[1]
WP_ROOT = ROOT.parent / "wordpress-cex"
MANIFEST = json.loads((ROOT / "image-manifest.json").read_text(encoding="utf-8"))
IMAGE_ROWS = {
    row["page"].rstrip("/") or "https://cex.koeln": row
    for row in MANIFEST.get("images", [])
    if isinstance(row, dict) and row.get("page") and row.get("src")
}
LEGAL_OVERRIDES = {
    ROOT / "impressum.html": WP_ROOT / "build-assets" / "impressum-main.html",
    ROOT / "datenschutz.html": WP_ROOT / "build-assets" / "datenschutz-main.html",
}
SUPPORT = {
    ROOT / "impressum.html": ("https://cex.koeln/impressum/", "Impressum | CEx"),
    ROOT / "datenschutz.html": ("https://cex.koeln/datenschutz/", "Datenschutz | CEx"),
    ROOT / "sitemap" / "index.html": ("https://cex.koeln/sitemap/", "Sitemap | CEx"),
}


def page_file(page_url: str) -> Path:
    path = urlparse(page_url).path.strip("/")
    return ROOT / "index.html" if not path else ROOT / path / "index.html"


MAIN = {page_file(row["page"]): row for row in IMAGE_ROWS.values()}
PUBLIC = [*MAIN, *SUPPORT]


def root_prefix(path: Path) -> str:
    depth = len(path.relative_to(ROOT).parent.parts)
    return "../" * depth


def set_meta(text: str, key_type: str, key: str, content: str) -> str:
    tag = f'<meta {key_type}="{key}" content="{html.escape(str(content), quote=True)}">'
    pattern = rf'<meta\b(?=[^>]*\b{re.escape(key_type)}=["\']{re.escape(key)}["\'])[^>]*>'
    if re.search(pattern, text, flags=re.I):
        return re.sub(pattern, tag, text, count=1, flags=re.I)
    return text.replace("</head>", f"{tag}\n</head>", 1)


def set_canonical(text: str, url: str) -> str:
    tag = f'<link rel="canonical" href="{url}">'
    pattern = r'<link\b(?=[^>]*\brel=["\']canonical["\'])[^>]*>'
    if re.search(pattern, text, flags=re.I):
        return re.sub(pattern, tag, text, count=1, flags=re.I)
    return text.replace("</head>", f"{tag}\n</head>", 1)


def ensure_body_classes(text: str, classes: list[str]) -> str:
    def repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        class_match = re.search(r'\bclass\s*=\s*(["\'])(.*?)\1', tag, flags=re.I | re.S)
        if class_match:
            current = class_match.group(2).split()
            merged = current + [value for value in classes if value not in current]
            return tag[: class_match.start()] + f'class="{" ".join(merged)}"' + tag[class_match.end() :]
        return tag[:-1] + f' class="{" ".join(classes)}">'

    return re.sub(r'<body\b[^>]*>', repl, text, count=1, flags=re.I)


def add_main_id(text: str) -> str:
    return re.sub(r'<main(?![^>]*\bid\s*=)([^>]*)>', r'<main id="main"\1>', text, count=1, flags=re.I)


def add_page_visual(text: str, path: Path, row: dict) -> str:
    prefix = root_prefix(path)
    src = prefix + str(row["src"]).lstrip("/")
    filename = Path(str(row["src"])).name
    alt = html.escape(str(row.get("alt", "")), quote=True)
    width = int(row.get("width", 1600))
    height = int(row.get("height", 1067))
    figure = (
        '<figure class="cex-page-visual">'
        f'<img src="{src}" alt="{alt}" width="{width}" height="{height}" loading="lazy" decoding="async">'
        '</figure>'
    )
    present = bool(
        re.search(
            rf'<figure\b[^>]*class=["\'][^"\']*cex-page-visual[^"\']*["\'][^>]*>.*?'
            rf'<img\b[^>]*src=["\'][^"\']*{re.escape(filename)}[^"\']*["\']',
            text,
            flags=re.I | re.S,
        )
    )
    if path == ROOT / "index.html":
        text = re.sub(r'poster=(["\']).*?\1', f'poster="{src}"', text, count=1, flags=re.I)
        if not present:
            text = re.sub(r'(</section\s*>)', r'\1\n' + figure, text, count=1, flags=re.I)
        return text

    stock_figure = re.compile(
        r'<figure\b[^>]*>(?:(?!</figure\s*>).)*?'
        r'<img\b[^>]*\bsrc=["\'][^"\']*cx-img-[^"\']+["\'][^>]*>'
        r'.*?</figure\s*>',
        flags=re.I | re.S,
    )
    if not present:
        matches = list(stock_figure.finditer(text))
        if matches:
            used = False

            def replace_stock(_: re.Match[str]) -> str:
                nonlocal used
                if used:
                    return ""
                used = True
                return figure

            text = stock_figure.sub(replace_stock, text)
        else:
            text = re.sub(r'(</section\s*>)', r'\1\n' + figure, text, count=1, flags=re.I)
    else:
        text = stock_figure.sub("", text)
    return re.sub(r'<img\b[^>]*\bsrc=["\'][^"\']*cx-img-[^"\']+["\'][^>]*>', "", text, flags=re.I)


def augment_forms(text: str) -> str:
    def open_tag(match: re.Match[str]) -> str:
        tag = match.group(0)
        if "data-cex-static-contact" not in tag:
            tag = tag[:-1] + ' data-cex-static-contact="true">'
        if not re.search(r'\saction\s*=', tag, flags=re.I):
            tag = tag[:-1] + ' action="mailto:kontakt@cex.koeln">'
        if not re.search(r'\smethod\s*=', tag, flags=re.I):
            tag = tag[:-1] + ' method="post">'
        if not re.search(r'\senctype\s*=', tag, flags=re.I):
            tag = tag[:-1] + ' enctype="text/plain">'
        return tag

    text = re.sub(r'<form\b[^>]*>', open_tag, text, flags=re.I)

    def form_body(match: re.Match[str]) -> str:
        form = match.group(0)
        additions = ""
        if not re.search(r'\bname\s*=\s*["\']website["\']', form, flags=re.I):
            additions += '<input type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true" class="cex-honeypot">'
        form = re.sub(
            r'<p\b(?=[^>]*class=["\'][^"\']*cex-form-status[^"\']*["\'])[^>]*>\s*</p>',
            '',
            form,
            flags=re.I | re.S,
        )
        if re.search(r'<p\b(?=[^>]*aria-live=["\']polite["\'])[^>]*>', form, flags=re.I):
            def status_class(status: re.Match[str]) -> str:
                tag = status.group(0)
                class_match = re.search(r'class=(["\'])(.*?)\1', tag, flags=re.I | re.S)
                if class_match:
                    classes = class_match.group(2).split()
                    if 'cex-form-status' not in classes:
                        classes.append('cex-form-status')
                    return tag[:class_match.start()] + f'class="{" ".join(classes)}"' + tag[class_match.end():]
                return tag[:-1] + ' class="cex-form-status">'
            form = re.sub(
                r'<p\b(?=[^>]*aria-live=["\']polite["\'])[^>]*>',
                status_class,
                form,
                count=1,
                flags=re.I,
            )
        else:
            additions += '<p class="form__status cex-form-status" aria-live="polite"></p>'
        return re.sub(r'</form\s*>$', additions + "</form>", form, flags=re.I)

    return re.sub(r'<form\b[^>]*data-cex-static-contact[^>]*>.*?</form\s*>', form_body, text, flags=re.I | re.S)


def fix_footer(text: str, path: Path) -> str:
    destination = root_prefix(path) + "index.html#contact"
    ki_destination = root_prefix(path) + "ki-beratung/"

    def footer_repl(match: re.Match[str]) -> str:
        footer = match.group(0)

        def set_href(anchor: re.Match[str], href: str) -> str:
            tag = anchor.group(0)
            return re.sub(r'href\s*=\s*(["\'])[^"\']*\1', f'href="{href}"', tag, count=1, flags=re.I)

        footer = re.sub(
            r'<a\b[^>]*>\s*KI-Beratung\s*</a>',
            lambda anchor: set_href(anchor, ki_destination),
            footer,
            flags=re.I | re.S,
        )
        return re.sub(
            r'<a\b[^>]*>\s*Erstgespräch anfragen\s*</a>',
            lambda anchor: set_href(anchor, destination),
            footer,
            flags=re.I | re.S,
        )

    return re.sub(r'<footer\b.*?</footer\s*>', footer_repl, text, flags=re.I | re.S)


def move_body_styles_and_add_css(text: str, path: Path) -> str:
    body_match = re.search(r'<body\b', text, flags=re.I)
    if not body_match:
        return text
    head_part, body_part = text[: body_match.start()], text[body_match.start() :]
    moved = re.findall(r'<style\b[^>]*>.*?</style\s*>', body_part, flags=re.I | re.S)
    body_part = re.sub(r'<style\b[^>]*>.*?</style\s*>', "", body_part, flags=re.I | re.S)
    text = head_part + body_part
    text = re.sub(
        r'<link\b[^>]*href=["\'][^"\']*(?:founders|polish)\.css[^"\']*["\'][^>]*>\s*',
        "",
        text,
        flags=re.I,
    )
    text = re.sub(r'<link\b[^>]*href=["\']https://fonts\.googleapis\.com/[^"\']*["\'][^>]*>\s*', "", text, flags=re.I)
    text = re.sub(r'<link\b[^>]*rel=["\']preconnect["\'][^>]*href=["\']https://fonts\.(?:googleapis|gstatic)\.com[^"\']*["\'][^>]*>\s*', "", text, flags=re.I)
    prefix = root_prefix(path)
    text = re.sub(
        r'<link\b[^>]*rel=["\']preload["\'][^>]*href=["\'][^"\']*inter-latin-400-normal\.woff2["\'][^>]*>\s*',
        "",
        text,
        flags=re.I,
    )
    bundle = "\n".join(
        [
            *moved,
            f'<link rel="preload" href="{prefix}fonts/inter-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>',
            f'<link rel="stylesheet" href="{prefix}founders.css?v=20260715">',
            f'<link rel="stylesheet" href="{prefix}polish.css?v=20260715">',
        ]
    )
    return text.replace("</head>", bundle + "\n</head>", 1)


def ensure_shared_script(text: str, path: Path) -> str:
    if re.search(r'<script\b[^>]+src=["\'][^"\']*script\.js(?:\?[^"\']*)?["\']', text, flags=re.I):
        return text
    tag = f'<script src="{root_prefix(path)}script.js?v=20260715" defer></script>'
    return text.replace('</body>', tag + '\n</body>', 1)


def remove_unverified_proof_placeholders(text: str) -> str:
    """Never expose internal prompts that request still-unverified case facts."""
    pattern = re.compile(
        r'<section\b(?=[^>]*\bclass=["\'][^"\']*\bcx-substance-block\b[^"\']*["\'])[^>]*>'
        r'(?:(?!</section\s*>).)*?HUMAN INSERT'
        r'(?:(?!</section\s*>).)*?</section\s*>',
        flags=re.I | re.S,
    )
    return pattern.sub('', text)


def normalize_main_boundary(text: str) -> str:
    """Keep all visitor content inside one main landmark, ending at footer."""
    if not re.search(r'<main\b', text, flags=re.I):
        return text
    text = re.sub(r'</main\s*>', '', text, flags=re.I)
    footer = re.search(r'<footer\b', text, flags=re.I)
    if footer:
        return text[:footer.start()] + '</main>\n' + text[footer.start():]
    return text.replace('</body>', '</main>\n</body>', 1)


def update_support_meta(text: str, path: Path, canonical: str, title: str) -> str:
    description_match = re.search(r'<meta\b[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', text, flags=re.I | re.S)
    description = re.sub(r'\s+', " ", html.unescape(description_match.group(1))).strip() if description_match else "CEx Website"
    text = set_canonical(text, canonical)
    for key_type, key, value in [
        ("property", "og:title", title),
        ("property", "og:description", description),
        ("property", "og:type", "website"),
        ("property", "og:url", canonical),
        ("property", "og:image", "https://cex.koeln/media/og-home.png"),
        ("property", "og:image:width", "1200"),
        ("property", "og:image:height", "630"),
        ("property", "og:image:alt", "CEx — Beratung, die Strategie und IT verbindet"),
        ("name", "twitter:card", "summary_large_image"),
        ("name", "twitter:title", title),
        ("name", "twitter:description", description),
        ("name", "twitter:image", "https://cex.koeln/media/og-home.png"),
        ("name", "twitter:image:alt", "CEx — Beratung, die Strategie und IT verbindet"),
    ]:
        text = set_meta(text, key_type, key, value)
    return text


def update_breadcrumb_schema(text: str, canonical: str) -> str:
    """Keep the final BreadcrumbList item tied to the page being emitted."""
    h1_match = re.search(r'<h1\b[^>]*>(.*?)</h1\s*>', text, flags=re.I | re.S)
    if h1_match:
        page_name = re.sub(r'<[^>]+>', ' ', h1_match.group(1))
        page_name = re.sub(r'\s+', ' ', html.unescape(page_name)).strip()
    else:
        title_match = re.search(r'<title\b[^>]*>(.*?)</title\s*>', text, flags=re.I | re.S)
        page_name = re.sub(r'\s*[|–—-]\s*CEx.*$', '', html.unescape(title_match.group(1))).strip() if title_match else 'CEx'

    def patch_json(match: re.Match[str]) -> str:
        raw = match.group(2)
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return match.group(0)

        changed = False

        def walk(value: object) -> None:
            nonlocal changed
            if isinstance(value, dict):
                if value.get('@type') == 'BreadcrumbList':
                    items = value.get('itemListElement')
                    if isinstance(items, list) and items and isinstance(items[-1], dict):
                        items[-1]['name'] = page_name
                        items[-1]['item'] = canonical
                        changed = True
                for child in value.values():
                    walk(child)
            elif isinstance(value, list):
                for child in value:
                    walk(child)

        walk(data)
        if not changed:
            return match.group(0)
        return match.group(1) + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + match.group(3)

    return re.sub(
        r'(<script\b[^>]*type=["\']application/ld\+json["\'][^>]*>)(.*?)(</script\s*>)',
        patch_json,
        text,
        flags=re.I | re.S,
    )


def normalize_founder_schema(text: str) -> str:
    """Keep machine-readable founder roles aligned with the shared founder block."""
    text = re.sub(
        r'("jobTitle"\s*:\s*")Beratungspartner CEx(")',
        r'\1Gründer\2',
        text,
        flags=re.I,
    )
    return re.sub(
        r'("jobTitle"\s*:\s*")Geschäftsführer(")',
        r'\1Gründer\2',
        text,
        flags=re.I,
    )


def sync_page(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = re.sub(r'<script\b[^>]+src=["\'][^"\']*(?:overview-widget|cookie-consent)\.js[^"\']*["\'][^>]*>\s*</script>', "", text, flags=re.I)
    text = re.sub(r'<script\b[^>]*>\s*window\.CEX_DS_PATH=.*?</script>', "", text, flags=re.I | re.S)

    override = LEGAL_OVERRIDES.get(path)
    if override and override.exists():
        text = re.sub(r'<main\b[^>]*>.*?</main\s*>', override.read_text(encoding="utf-8").strip(), text, count=1, flags=re.I | re.S)

    row = MAIN.get(path)
    if row:
        text = add_page_visual(text, path, row)
        canonical = row["page"]
        text = set_meta(text, "property", "og:image", "https://cex.koeln/" + str(row["src"]).lstrip("/"))
        text = set_meta(text, "property", "og:image:width", row.get("width", 1600))
        text = set_meta(text, "property", "og:image:height", row.get("height", 1067))
        text = set_meta(text, "property", "og:image:alt", row.get("alt", "CEx Beratung"))
        text = set_meta(text, "name", "twitter:image", "https://cex.koeln/" + str(row["src"]).lstrip("/"))
        text = set_meta(text, "name", "twitter:image:alt", row.get("alt", "CEx Beratung"))
    else:
        canonical, title = SUPPORT[path]
        text = update_support_meta(text, path, canonical, title)

    # The checked-in GitHub preview stays out of search until the user gives
    # an explicit launch Go. Final static builds can opt in with
    # CEX_STATIC_INDEXABLE=1; legal/support pages remain noindex.
    static_indexable = os.environ.get('CEX_STATIC_INDEXABLE') == '1' and path in MAIN
    text = set_meta(text, 'name', 'robots', 'index, follow, max-image-preview:large' if static_indexable else 'noindex, follow')

    text = normalize_founder_schema(text)
    text = update_breadcrumb_schema(text, canonical)
    text = text.replace("hallo@cex.koeln", "kontakt@cex.koeln")
    text = text.replace(
        "Ich willige ein, dass meine Angaben zur Bearbeitung meiner Anfrage gespeichert werden.",
        "Ich willige ein, dass meine Angaben zur Bearbeitung meiner Anfrage verarbeitet werden.",
    )
    text = text.replace('Made in Köln · DSGVO-konform · DACH-weit', 'Made in Köln · Datenschutzbewusst · DACH-weit')

    text = add_main_id(text)
    text = augment_forms(text)
    text = fix_footer(text, path)
    text = remove_unverified_proof_placeholders(text)
    text = normalize_main_boundary(text)
    classes = ["cex-migrated-page", "cex-static-site"]
    if path == ROOT / "index.html":
        classes.append("home")
    if path in LEGAL_OVERRIDES:
        classes.append("cex-legal-page")
    text = ensure_body_classes(text, classes)
    text = move_body_styles_and_add_css(text, path)
    text = ensure_shared_script(text, path)

    def logo_repl(match: re.Match[str]) -> str:
        tag = match.group(0)
        if re.search(r'\bsrcset\s*=', tag, flags=re.I):
            return tag
        src = match.group(1)
        return tag[:-1] + f' srcset="{src.rsplit("/", 1)[0] + "/" if "/" in src else ""}cex-logo-2x.png 2x">'

    text = re.sub(r'<img\b[^>]*\bsrc=["\']([^"\']*cex-logo\.png)["\'][^>]*>', logo_repl, text, flags=re.I)
    path.write_text(text, encoding="utf-8")


def main() -> None:
    missing = [str(path) for path in PUBLIC if not path.exists()]
    if missing:
        raise SystemExit("Missing public pages: " + ", ".join(missing))
    for path in PUBLIC:
        sync_page(path)
    # Remove the public widget include from any internal/noindex artefact too.
    for path in ROOT.rglob("*.html"):
        if any(part in {".git", "_audit", "_gate-compare"} for part in path.parts):
            continue
        text = path.read_text(encoding="utf-8")
        clean = re.sub(r'<script\b[^>]+src=["\'][^"\']*overview-widget\.js[^"\']*["\'][^>]*>\s*</script>', "", text, flags=re.I)
        if clean != text:
            path.write_text(clean, encoding="utf-8")
    sitemap = ROOT / 'sitemap.xml'
    if sitemap.exists():
        xml = sitemap.read_text(encoding='utf-8')
        xml = re.sub(r'<lastmod>[^<]+</lastmod>', f'<lastmod>{date.today().isoformat()}</lastmod>', xml)
        sitemap.write_text(xml, encoding='utf-8')
    print(f"Synchronized {len(PUBLIC)} public HTML pages: {len(MAIN)} main + {len(SUPPORT)} support")


if __name__ == "__main__":
    main()
