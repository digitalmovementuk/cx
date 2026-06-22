/* CEx Cookie-Consent (CMP-lite) — DSGVO/TTDSG: opt-in, Banner, Kategorien, Widerruf.
   Notwendige Cookies immer aktiv; Statistik/Marketing erst nach Einwilligung.
   Reopen via window.CExCookies.open(). Consent in localStorage (cex_consent_v1). */
(function () {
  "use strict";
  var KEY = "cex_consent_v1";
  var CATS = [
    { id: "necessary", label: "Notwendig", locked: true,
      desc: "Für den Betrieb der Seite erforderlich (z. B. das Speichern Ihrer Cookie-Auswahl). Ohne diese Cookies funktioniert die Website nicht." },
    { id: "statistics", label: "Statistik",
      desc: "Anonymisierte Reichweitenmessung, damit wir die Seite verbessern können. Wird erst nach Ihrer Einwilligung geladen." },
    { id: "marketing", label: "Marketing",
      desc: "Hilft uns, die Relevanz unserer Inhalte und Anzeigen zu messen. Wird erst nach Ihrer Einwilligung geladen." }
  ];
  function read() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function save(c) { c.ts = new Date().toISOString(); c.v = 1; try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} apply(c); }
  function apply(c) {
    // Hook: hier würden Statistik-/Marketing-Tags erst nach Einwilligung geladen.
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: "cex_consent_update", statistics: !!c.statistics, marketing: !!c.marketing });
  }

  var CSS = "" +
  ".cexc-backdrop{position:fixed;inset:0;background:rgba(20,22,26,.5);z-index:9998;display:none}" +
  ".cexc-backdrop.show{display:block}" +
  ".cexc{position:fixed;z-index:9999;left:20px;bottom:20px;width:min(420px,calc(100vw - 40px));background:#fff;color:#1E2327;border:1px solid #e6e1d8;border-radius:14px;box-shadow:0 24px 60px -20px rgba(20,22,26,.45);padding:22px 22px 18px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;display:none}" +
  ".cexc.show{display:block}" +
  ".cexc__h{font-size:1.06rem;font-weight:800;margin:0 0 8px;letter-spacing:-.01em}" +
  ".cexc__t{font-size:.86rem;line-height:1.55;color:#52555c;margin:0 0 14px}" +
  ".cexc__t a{color:#9a3412}" +
  ".cexc__btns{display:flex;flex-wrap:wrap;gap:8px}" +
  ".cexc__btn{flex:1 1 auto;min-width:120px;padding:11px 14px;font-size:.82rem;font-weight:800;border-radius:9px;cursor:pointer;border:1px solid #d7d1c5;background:#fff;color:#1E2327}" +
  ".cexc__btn--primary{background:#FF7A00;border-color:#FF7A00;color:#1E2327}" +
  ".cexc__btn--ghost{background:#fff}" +
  ".cexc__link{margin-top:10px;background:none;border:none;color:#9a3412;font-size:.8rem;font-weight:700;cursor:pointer;padding:4px 0;text-decoration:underline;text-underline-offset:2px}" +
  ".cexc__cats{margin:4px 0 14px;display:none}" +
  ".cexc__cats.show{display:block}" +
  ".cexc__cat{border-top:1px solid #efe9db;padding:12px 0;display:flex;gap:12px;align-items:flex-start}" +
  ".cexc__cat b{display:block;font-size:.9rem;font-weight:800}" +
  ".cexc__cat span{font-size:.8rem;color:#52555c;line-height:1.5}" +
  ".cexc__sw{flex:0 0 auto;margin-top:2px}" +
  ".cexc__sw input{width:40px;height:22px}" +
  ".cexc__lock{font-size:.72rem;color:#15803d;font-weight:800;white-space:nowrap;margin-top:3px}" +
  "@media(max-width:560px){.cexc{left:12px;right:12px;bottom:12px;width:auto;padding:18px}.cexc__btn{flex:1 1 100%}}";

  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  var root, backdrop, catsWrap;
  function build() {
    var st = document.createElement("style"); st.textContent = CSS; document.head.appendChild(st);
    backdrop = el("div", "cexc-backdrop");
    root = el("div", "cexc");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-label", "Cookie-Einstellungen");
    root.innerHTML =
      '<h2 class="cexc__h">Wir schätzen Ihre Privatsphäre</h2>' +
      '<p class="cexc__t">Wir nutzen Cookies, um die Website zu betreiben und — mit Ihrer Einwilligung — die Nutzung anonym zu messen und Inhalte relevanter zu machen. Mehr in der <a href="@DS@">Datenschutzerklärung</a>.</p>';
    catsWrap = el("div", "cexc__cats");
    CATS.forEach(function (c) {
      var row = el("div", "cexc__cat");
      var sw = el("div", "cexc__sw");
      if (c.locked) { sw.innerHTML = '<div class="cexc__lock">Immer aktiv</div>'; }
      else { sw.innerHTML = '<input type="checkbox" data-cat="' + c.id + '" aria-label="' + c.label + '">'; }
      row.appendChild(sw);
      row.appendChild(el("div", null, "<b>" + c.label + "</b><span>" + c.desc + "</span>"));
      catsWrap.appendChild(row);
    });
    root.appendChild(catsWrap);
    var btns = el("div", "cexc__btns");
    var bAccept = el("button", "cexc__btn cexc__btn--primary", "Alle akzeptieren");
    var bReject = el("button", "cexc__btn cexc__btn--ghost", "Alle ablehnen");
    var bCustom = el("button", "cexc__btn cexc__btn--ghost", "Anpassen");
    var bSave = el("button", "cexc__btn cexc__btn--primary", "Auswahl speichern"); bSave.style.display = "none";
    btns.appendChild(bAccept); btns.appendChild(bReject); btns.appendChild(bCustom); btns.appendChild(bSave);
    root.appendChild(btns);
    document.body.appendChild(backdrop); document.body.appendChild(root);

    bAccept.onclick = function () { save({ statistics: true, marketing: true }); hide(); };
    bReject.onclick = function () { save({ statistics: false, marketing: false }); hide(); };
    bCustom.onclick = function () {
      var open = catsWrap.classList.toggle("show");
      bSave.style.display = open ? "" : "none";
      bAccept.style.display = open ? "none" : "";
      bReject.style.display = open ? "none" : "";
      bCustom.style.display = open ? "none" : "";
    };
    bSave.onclick = function () {
      var c = { statistics: false, marketing: false };
      catsWrap.querySelectorAll("input[data-cat]").forEach(function (i) { c[i.getAttribute("data-cat")] = i.checked; });
      save(c); hide();
    };
  }
  function show(reopen) {
    var c = read();
    if (reopen && c) { catsWrap.querySelectorAll("input[data-cat]").forEach(function (i) { i.checked = !!c[i.getAttribute("data-cat")]; }); }
    backdrop.classList.add("show"); root.classList.add("show");
  }
  function hide() { backdrop.classList.remove("show"); root.classList.remove("show"); }

  function init() {
    build();
    var ds = (window.CEX_DS_PATH || "datenschutz.html");
    root.querySelector(".cexc__t a").setAttribute("href", ds);
    var c = read();
    if (c) { apply(c); } else { show(false); }
    backdrop.onclick = function () { if (read()) hide(); };
    window.CExCookies = { open: function () { show(true); }, get: read };
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
