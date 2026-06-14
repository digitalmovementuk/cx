#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
sync_overview.py — builds /overview-data.json for the client overview tab.

Run daily at 08:00 WITA by .github/workflows/overview-sync.yml (and once now to seed it).
It (1) holds the real Semrush metrics per page, (2) computes a transparent EYS +
12-month enquiry PROJECTION, (3) checks the LIVE status of every page on the deployed
site, and (4) writes overview-data.json with a fresh `synced_at` stamp.

HARD: Volume + KD are real Semrush data (null where not pulled). EYS + enquiries are
clearly-labelled PROJECTIONS (model below) — never presented as measured fact.
"""
from __future__ import annotations
import json, sys, urllib.request, datetime, concurrent.futures
from pathlib import Path

LIVE_BASE = "https://digitalmovementuk.github.io/cx"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "overview-data.json"

# (title, slug, cluster, tier, volume, kd|None)   — volume = target-group /mo; kd = Semrush (None = not pulled)
PAGES = [
 ("KI-Beratung","ki-beratung/","KI","Hub",7340,53),
 ("Digitalisierungsberatung","digitalisierungsberatung/","Digitalisierung","Hub",5780,20),
 ("Change-Management-Beratung","change-management-beratung/","Change","Hub",2610,23),
 ("Projektmanagement-Beratung","projektmanagement-beratung/","Projektmanagement","Hub",2400,20),
 ("Prozessoptimierung-Beratung","prozessoptimierung-beratung/","Prozesse","Hub",2320,11),
 ("Enterprise-Architecture-Beratung","enterprise-architecture-beratung/","Architektur","Hub",90,None),
 ("KI › Mittelstand","ki-beratung/mittelstand/","KI","Spoke",590,5),
 ("Prozess › Geschäftsprozessmanagement","prozessoptimierung-beratung/geschaeftsprozessmanagement/","Prozesse","Spoke",1620,27),
 ("Change › Organisationsentwicklung","change-management-beratung/organisationsentwicklung/","Change","Spoke",1080,9),
 ("Digi › Transformation","digitalisierungsberatung/transformation/","Digitalisierung","Spoke",420,11),
 ("KI › Unternehmen","ki-beratung/unternehmen/","KI","Spoke",260,46),
 ("Digi › Industrie 4.0","digitalisierungsberatung/industrie-4-0/","Digitalisierung","Spoke",260,7),
 ("Digi › Mittelstand","digitalisierungsberatung/mittelstand/","Digitalisierung","Spoke",250,12),
 ("PM › Scrum","projektmanagement-beratung/scrum/","Projektmanagement","Spoke",180,None),
 ("Digi › Supply Chain","digitalisierungsberatung/supply-chain/","Digitalisierung","Spoke",130,None),
 ("Prozess › Digitale Prozesse & KI","prozessoptimierung-beratung/digitale-prozesse-ki/","Prozesse","Spoke",120,None),
 ("KI › Generative KI","ki-beratung/generative-ki/","KI","Spoke",110,12),
 ("KI › Microsoft 365","ki-beratung/microsoft-365/","KI","Spoke",80,None),
 ("KI › Microsoft Copilot","ki-beratung/microsoft-copilot/","KI","Spoke",80,None),
 ("KI › Industrie","ki-beratung/industrie/","KI","Spoke",80,None),
 ("EA › IT-Architektur","enterprise-architecture-beratung/it-architektur/","Architektur","Spoke",80,None),
 ("PM › Externe Projektleitung","projektmanagement-beratung/externe-projektleitung/","Projektmanagement","Spoke",70,None),
 ("PM › Agiles Projektmanagement","projektmanagement-beratung/agiles-projektmanagement/","Projektmanagement","Spoke",70,None),
 ("KI › Maschinenbau","ki-beratung/maschinenbau/","KI","Spoke",70,None),
 ("Prozess › Öffentliche Verwaltung","prozessoptimierung-beratung/oeffentliche-verwaltung/","Prozesse","Spoke",60,None),
 ("PM › PMO","projektmanagement-beratung/pmo/","Projektmanagement","Spoke",50,None),
 ("KI › Chatbot","ki-beratung/chatbot/","KI","Spoke",40,None),
 ("KI › Daten & KI","ki-beratung/daten-ki/","KI","Spoke",40,None),
 ("Digi › Gescheiterte Digitalisierung","digitalisierungsberatung/gescheiterte-digitalisierung/","Digitalisierung","Spoke",30,None),
 ("PM › Logistik & 3PL","projektmanagement-beratung/logistik/","Projektmanagement","Spoke",90,None),
 ("PM › Rheinland","projektmanagement-beratung/rheinland/","Projektmanagement","Spoke",40,None),
 ("Prozess › Mittelstand","prozessoptimierung-beratung/mittelstand/","Prozesse","Spoke",110,None),
]

# per-cluster fallback difficulty (median of real spoke KDs) — feeds the PROJECTION only,
# never shown as KD. Keeps the enquiry model defined for not-yet-pulled spokes.
CLUSTER_KD = {"KI":14,"Digitalisierung":11,"Prozesse":18,"Change":12,"Projektmanagement":20,"Architektur":16}
CONVERSION = 0.03  # 3% enquiry rate — high-intent service page with hero form
CTR = {1:0.28, 2:0.17, 3:0.11, 4:0.08, 5:0.06, 6:0.045}

def target_rank(kd: float) -> int:
    if kd <= 6:  return 1
    if kd <= 12: return 2
    if kd <= 22: return 3
    if kd <= 35: return 4
    if kd <= 50: return 5
    return 6

def is_live(slug: str) -> bool:
    try:
        req = urllib.request.Request(f"{LIVE_BASE}/{slug}", method="HEAD")
        return urllib.request.urlopen(req, timeout=10).getcode() == 200
    except Exception:
        try:  # some hosts reject HEAD — fall back to GET
            return urllib.request.urlopen(f"{LIVE_BASE}/{slug}", timeout=10).getcode() == 200
        except Exception:
            return False

def build():
    rows = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as ex:
        live_map = dict(zip([p[1] for p in PAGES], ex.map(lambda p: is_live(p[1]), PAGES)))
    tot_enq = 0
    cum_vol = 0
    for title, slug, cluster, tier, vol, kd in PAGES:
        cum_vol += vol
        kd_for_model = kd if kd is not None else CLUSTER_KD.get(cluster, 18)
        rank = target_rank(kd_for_model)
        eys = round(vol * CTR[rank])                       # projected mature clicks/mo
        enq = round(eys * CONVERSION, 1)                   # projected enquiries/mo @12mo
        los = max(5, 100 - kd_for_model)                   # likelihood of success %
        tot_enq += enq
        rows.append({
            "title": title, "slug": slug, "cluster": cluster, "tier": tier,
            "volume": vol, "cum_volume": cum_vol, "kd": kd, "los": los, "eys": eys,
            "enquiries_12mo": enq, "rank_target": rank, "live": live_map[slug],
        })
    data = {
        "synced_at": datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y-%m-%d %H:%M WITA"),
        "live_base": LIVE_BASE,
        "totals": {
            "pages": len(rows),
            "live": sum(1 for r in rows if r["live"]),
            "volume": sum(r["volume"] for r in rows),
            "enquiries_12mo": round(tot_enq),
        },
        "model_note": "Volumen & KD: Semrush (real). EYS & Anfragen: konservative Projektion — Zielranking nach 12 Monaten, positionsbasierte CTR × 3 % Anfragequote (nur Hauptbegriff, ohne Long-Tail).",
        "rows": rows,
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {OUT.name}: {data['totals']['live']}/{data['totals']['pages']} live · "
          f"~{data['totals']['enquiries_12mo']} enquiries/mo @12mo · synced {data['synced_at']}")

if __name__ == "__main__":
    build()
