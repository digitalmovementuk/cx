/* ============================================================================
   CX-Experts — TEMPORARY client overview widget
   A centered pill in the sticky top bar (red pulsing LIVE dot) → opens a branded
   table of the priority pages with Volumen · KD · LOS · EYS · Anfragen/Mt. (12 Mt.)
   and per-page LIVE status. Data: overview-data.json (refreshed daily 08:00 WITA by
   .github/workflows/overview-sync.yml).
   TO REMOVE: delete this file + overview-data.json + the <script> include + the
   .github/workflows/overview-sync.yml workflow.
   ========================================================================== */
(function () {
  "use strict";
  // resolve site root from this script's own URL (works locally AND on /cx/ Pages)
  var me = document.currentScript ? document.currentScript.src : "";
  var ROOT = me.replace(/overview-widget\.js(\?.*)?$/, "");

  var CSS = `
  :root{--ov-ink:#1E2327;--ov-acc:#FF7A00;--ov-warm:#FAF6EC;--ov-line:rgba(30,35,39,.12);--ov-mut:#5A6066}
  /* TEMP overview state: clear the centred in-page nav links so the LIVE button never overlaps */
  .nav__links{display:none!important}
  .ov-pill{position:fixed;top:10px;left:50%;transform:translateX(-50%);z-index:99998;
    display:inline-flex;align-items:center;gap:9px;padding:8px 16px;border-radius:999px;
    background:#1E2327;color:#fff;font:800 12.5px/1 Inter,system-ui,sans-serif;letter-spacing:.02em;
    border:1px solid rgba(255,255,255,.14);box-shadow:0 8px 24px -8px rgba(0,0,0,.45);cursor:pointer;
    -webkit-tap-highlight-color:transparent;transition:transform .15s ease, background .2s}
  .ov-pill:hover{background:#000;transform:translateX(-50%) translateY(1px)}
  .ov-dot{width:9px;height:9px;border-radius:50%;background:#ff3b30;box-shadow:0 0 0 0 rgba(255,59,48,.7);
    animation:ovpulse 1.6s infinite}
  @keyframes ovpulse{0%{box-shadow:0 0 0 0 rgba(255,59,48,.7)}70%{box-shadow:0 0 0 7px rgba(255,59,48,0)}100%{box-shadow:0 0 0 0 rgba(255,59,48,0)}}
  .ov-pill__live{color:#ff6a60;font-weight:900;letter-spacing:.12em}
  .ov-pill__lbl{opacity:.92}
  @media(max-width:620px){.ov-pill__lbl{display:none}.ov-pill{padding:8px 13px}}
  .ov-scrim{position:fixed;inset:0;z-index:99999;background:rgba(20,18,16,.62);backdrop-filter:blur(3px);
    display:none;align-items:flex-start;justify-content:center;padding:5vh 16px;overflow:auto}
  .ov-scrim.is-open{display:flex}
  .ov-modal{width:min(1040px,100%);background:var(--ov-warm);border-radius:18px;overflow:hidden;
    box-shadow:0 40px 90px -30px rgba(0,0,0,.6);font-family:Inter,system-ui,sans-serif;color:var(--ov-ink)}
  .ov-head{background:#1E2327;color:#fff;padding:22px 26px 20px;position:relative}
  .ov-kick{font:800 10px/1 ui-monospace,Menlo,monospace;letter-spacing:.22em;text-transform:uppercase;color:#FFB870}
  .ov-h{font-size:clamp(1.25rem,2.4vw,1.7rem);font-weight:800;letter-spacing:-.02em;margin:8px 0 4px}
  .ov-sub{font-size:13px;color:rgba(255,255,255,.72)}
  .ov-stats{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
  .ov-stat{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:11px;padding:10px 14px;min-width:104px}
  .ov-stat b{display:block;font-size:1.5rem;font-weight:800;letter-spacing:-.02em;line-height:1.05}
  .ov-stat span{font-size:10.5px;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.6)}
  .ov-stat--acc b{color:#FFB870}
  .ov-x{position:absolute;top:16px;right:18px;width:34px;height:34px;border-radius:50%;border:0;cursor:pointer;
    background:rgba(255,255,255,.12);color:#fff;font-size:18px;line-height:1;display:grid;place-items:center}
  .ov-x:hover{background:rgba(255,255,255,.24)}
  .ov-wrap{max-height:58vh;overflow:auto;padding:0 6px 6px}
  table.ov-tbl{width:100%;border-collapse:collapse;font-size:13px}
  .ov-tbl thead th{position:sticky;top:0;background:var(--ov-warm);text-align:right;font:800 10.5px/1.3 ui-monospace,Menlo,monospace;
    letter-spacing:.06em;text-transform:uppercase;color:var(--ov-mut);padding:14px 12px 9px;border-bottom:2px solid var(--ov-line);white-space:nowrap}
  .ov-tbl thead th.l{text-align:left}
  .ov-tbl td{padding:10px 12px;border-bottom:1px solid var(--ov-line);text-align:right;white-space:nowrap}
  .ov-tbl td.l{text-align:left;white-space:normal}
  .ov-tbl tr:hover td{background:rgba(255,122,0,.05)}
  .ov-rank{display:inline-grid;place-items:center;width:22px;height:22px;border-radius:6px;background:#1E2327;color:#fff;font:800 11px/1 Inter;margin-right:8px}
  .ov-tier{display:inline-block;font:800 9px/1 ui-monospace;letter-spacing:.1em;text-transform:uppercase;padding:3px 7px;border-radius:5px;margin-left:8px;vertical-align:middle}
  .ov-tier.Hub{background:#FFE0B8;color:#8a4b00}.ov-tier.Spoke{background:#E7E2D4;color:#5A6066}
  .ov-pg{color:var(--ov-ink);text-decoration:none;font-weight:700;border-bottom:2px solid rgba(255,122,0,.35)}
  .ov-pg:hover{border-bottom-color:var(--ov-acc)}
  .ov-clu{font-size:11px;color:var(--ov-mut)}
  .ov-enq{font-weight:800;color:#0F8C61}
  .ov-eys{font-weight:800}
  .ov-live{display:inline-flex;align-items:center;gap:6px;font-weight:800;font-size:11.5px}
  .ov-live i{width:8px;height:8px;border-radius:50%}
  .ov-live.on i{background:#16a34a}.ov-live.on{color:#16a34a}
  .ov-live.off i{background:#b3261e}.ov-live.off{color:#b3261e}
  .ov-foot{padding:14px 24px 20px;font-size:11.5px;line-height:1.55;color:var(--ov-mut);background:var(--ov-warm);border-top:1px solid var(--ov-line)}
  .ov-foot b{color:var(--ov-ink)}
  .ov-load{padding:40px;text-align:center;color:var(--ov-mut);font-weight:700}
  .ov-cum{color:var(--ov-mut);font-weight:700}
  @media(max-width:760px){.ov-wrap{max-height:64vh}}
  `;

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function n(x){ return (x==null)?"—":Number(x).toLocaleString("de-DE"); }

  function render(data) {
    var t = data.totals || {};
    var scrim = el("div", "ov-scrim");
    var rows = (data.rows || []).map(function (r, i) {
      var live = r.live ? '<span class="ov-live on"><i></i>Deployed · GitHub</span>' : '<span class="ov-live off"><i></i>nicht deployed</span>';
      var url = ROOT + r.slug;
      var pct = (data.totals && data.totals.volume) ? (r.cum_volume / data.totals.volume * 100) : 0;
      return '<tr>' +
        '<td class="l"><span class="ov-rank">' + (i + 1) + '</span>' +
          '<a class="ov-pg" href="' + url + '">' + r.title + '</a>' +
          '<span class="ov-tier ' + r.tier + '">' + r.tier + '</span>' +
          '<div class="ov-clu">' + r.cluster + '</div></td>' +
        '<td>' + n(r.volume) + '</td>' +
        '<td class="ov-cum">' + pct.toLocaleString("de-DE",{minimumFractionDigits:1,maximumFractionDigits:1}) + ' %</td>' +
        '<td>' + (r.kd == null ? '—' : r.kd) + '</td>' +
        '<td class="ov-eys">' + n(r.eys) + '</td>' +
        '<td class="ov-enq">' + (r.enquiries_12mo).toLocaleString("de-DE") + '</td>' +
        '<td>' + live + '</td></tr>';
    }).join("");

    scrim.innerHTML =
      '<div class="ov-modal" role="dialog" aria-label="SEO-Projekt Überblick">' +
        '<div class="ov-head">' +
          '<button class="ov-x" aria-label="Schließen">×</button>' +
          '<div class="ov-kick">CX-Experts · SEO-Projekt · Live-Überblick</div>' +
          '<div class="ov-h">Prioritätsseiten — Volumen, Aufwand & erwartete Anfragen</div>' +
          '<div class="ov-sub">Zuletzt synchronisiert: ' + (data.synced_at || "—") + '  ·  täglich 08:00 WITA</div>' +
          '<div class="ov-stats">' +
            '<div class="ov-stat"><b>' + n(t.live) + '/' + n(t.pages) + '</b><span>deployed · GitHub</span></div>' +
            '<div class="ov-stat"><b>' + n(t.volume) + '</b><span>Suchvolumen/Mt.</span></div>' +
            '<div class="ov-stat ov-stat--acc"><b>~' + n(t.enquiries_12mo) + '</b><span>Anfragen/Mt. (12 Mt.)*</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="ov-wrap"><table class="ov-tbl"><thead><tr>' +
          '<th class="l">Seite</th><th>Volumen/Mt.</th><th>Kum.<br>Volumen&nbsp;%</th><th>KD</th><th>EYS</th>' +
          '<th>Anfragen/Mt.<br>(12 Mt.)*</th><th>Status</th>' +
          '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
        '<div class="ov-foot">' +
          '<b>* Projektion.</b> ' + (data.model_note || '') +
          ' &nbsp;·&nbsp; <b>Kum. Volumen&nbsp;%</b> = Anteil des kumulierten Suchvolumens am Gesamtvolumen entlang der Prioritätsreihenfolge (steigt bis 100 %). ' +
          '<b>EYS</b> = Expected Yield Score (erwartete organische Klicks/Mt. bei Zielranking). ' +
          'Volumen & KD sind reale Semrush-Daten; „—" = noch nicht erhoben.' +
        '</div>' +
      '</div>';
    document.body.appendChild(scrim);

    var pill = el("button", "ov-pill");
    pill.innerHTML = '<span class="ov-dot"></span><span class="ov-pill__live">LIVE</span>' +
                     '<span class="ov-pill__lbl">SEO-Überblick · ' + n(t.live) + '/' + n(t.pages) + '</span>';
    document.body.appendChild(pill);

    function open(){ scrim.classList.add("is-open"); document.documentElement.style.overflow="hidden"; }
    function close(){ scrim.classList.remove("is-open"); document.documentElement.style.overflow=""; }
    pill.addEventListener("click", open);
    scrim.addEventListener("click", function(e){ if (e.target === scrim) close(); });
    scrim.querySelector(".ov-x").addEventListener("click", close);
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });
  }

  function start() {
    var style = el("style"); style.textContent = CSS; document.head.appendChild(style);
    fetch(ROOT + "overview-data.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(render)
      .catch(function () {
        var p = el("button", "ov-pill");
        p.innerHTML = '<span class="ov-dot"></span><span class="ov-pill__live">LIVE</span>';
        document.body.appendChild(p);
      });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
