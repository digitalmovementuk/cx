# Inhalts-Standards CEx

Formulierungen, die auf **jeder** Seite wortgleich stehen müssen. Ein Baustein,
der auf 33 Seiten vorkommt, liest sich nur dann als ein Baustein, wenn er überall
gleich heißt. Wer eine neue Seite anlegt, übernimmt diese Sätze unverändert — die
Seitenspezifik gehört in den Inhalt darunter, nicht in die Überschrift.

Die zugehörige Gestaltung steht in `cx-components.css` (FAQ) und `founders.css`
("Wer wir sind"). Beide Dateien verweisen auf dieses Dokument.

---

## Festgelegte Überschriften

| Baustein | Selektor | Wortlaut |
|---|---|---|
| FAQ | `<section id="faq"> h2` | **Diese Fragen hören wir häufiger** |
| Wer wir sind | `.cx-trust__heading` | **Prozesse, Architektur, Change.** |

### FAQ

Stand 3. August 2026 vereinheitlicht. Vorher standen dort **30 verschiedene**
Formulierungen — "Fragen, die in den ersten Gesprächen immer kommen.", "Häufige
Fragen zur Supply-Chain-Digitalisierung.", "Fragen aus Produktion, Qualität und
Instandhaltung.", "Fragen vor der Copilot-Entscheidung." und so weiter. Jede für
sich war in Ordnung, zusammen wirkten sie wie 30 verschiedene Abschnitte.

Kein Punkt am Ende. Die Kicker-Zeile darüber (`.eyebrow`) darf seitenspezifisch
bleiben.

### Wer wir sind

Die Gründersektion ist auf allen 33 Seiten identisch — Überschrift, Fließtext,
Fotos, Merkmale. Gestaltung und Begründung in `founders.css`. Die rechte Spalte
unterscheidet sich bewusst: Startseite ein Gesprächs-Panel, Unterseiten das
Kontaktformular am Seitenende.

---

## Regeln für neue Überschriften

- **Kein Punkt** am Ende einer Überschrift, sofern sie kein vollständiger Satz ist.
- **Keine Zahlwörter, die nur den Inhalt darunter abzählen** ("Fünf Phasen",
  "Drei Regeln", "Sechs häufige Prozesse"). Sie veralten, sobald jemand eine
  Karte ergänzt, und der Leser zählt ohnehin nicht mit. Ausnahme: Wenn die Zahl
  Teil des Angebots ist und dort dauerhaft stimmt — "Sechs Leistungsfelder der
  Prozessoptimierung" bleibt bewusst stehen.
- **Kein Doppelpunkt-Aufzähler** ("Praxisbeispiele: weniger Rückstand, kürzere
  Bearbeitung, weniger Handarbeit."). Die Aufzählung steht darunter.
- **Klartext**, verständlich für eine fünfzehnjährige Leserin. Kein Fachjargon in
  der Überschrift.
