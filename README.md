# CEx portable HTML site

This is the 36-page static mirror of the future `https://cex.koeln` website. It is also the shared content/design source used to generate the WordPress package in `../wordpress-cex`.

- `index.html` plus 32 service URLs — the 33 search-facing pages
- `impressum.html`, `datenschutz.html`, `sitemap/index.html` — support pages
- `polish.css`, `founders.css`, `styles.css`, `script.js` — shared visual and interaction system
- `media/page-*.jpg` and `image-manifest.json` — page-owned licensed images and attribution
- `scripts/sync_wordpress_parity.py` — idempotent source cleanup and synchronization
- `scripts/qa-static-site.mjs` — 36-page desktop/mobile, Axe, link and asset QA

The checked-in copy is deliberately `noindex`. Keep it that way when WordPress is the production system, so Google never sees two competing copies. Only if the static build is explicitly chosen *instead of WordPress* may it be made indexable:

```bash
CEX_STATIC_INDEXABLE=1 python3 scripts/sync_wordpress_parity.py
```

GitHub Pages cannot run WordPress/PHP. Static forms therefore open a prefilled email in the visitor's mail program; the WordPress version uses its protected REST endpoint and private enquiry storage.

No script in this folder pushes to GitHub, changes DNS or connects `cex.koeln`.
