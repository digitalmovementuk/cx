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
| FAQ | `<section id="faq"> h2` | **Welche Fragen hören wir häufiger?** |
| Praxischeck | `.cx-proof__h` | **Welche Fragen klären wir vor Projektbeginn?** |
| Wer wir sind | `.cx-trust__heading` | **Prozesse, Architektur, Change.** |

Am 4. August 2026 wurden die beiden Fragen-Überschriften von der Aussageform in die
Frageform gebracht ("Diese Fragen …" → "Welche Fragen …?"). Grund: Google und die
KI-Assistenten ziehen Antworten bevorzugt aus Abschnitten, deren Überschrift die Frage
stellt, die der Nutzer eingibt. Der Sinn bleibt gleich, ein Wort ändert sich, und beide
Blöcke sind ohnehin Fragenblöcke. **Ausnahme von "kein Punkt am Ende": das Fragezeichen
gehört hier dazu.**

### FAQ

Stand 3. August 2026 vereinheitlicht. Vorher standen dort **30 verschiedene**
Formulierungen — "Fragen, die in den ersten Gesprächen immer kommen.", "Häufige
Fragen zur Supply-Chain-Digitalisierung.", "Fragen aus Produktion, Qualität und
Instandhaltung.", "Fragen vor der Copilot-Entscheidung." und so weiter. Jede für
sich war in Ordnung, zusammen wirkten sie wie 30 verschiedene Abschnitte.

Kein Punkt am Ende. Die Kicker-Zeile darüber (`.eyebrow`) darf seitenspezifisch
bleiben.

### Praxischeck

Derselbe Fall wie beim FAQ. Der Kopf über dem Fragenblock lautete auf jeder Seite
anders — "Diese Fragen klären wir, bevor Struktur, Rollen oder Zusammenarbeit
verändert werden.", "… bevor KI Produktwissen, Service oder Engineering
unterstützt.", "Was Kunden vor dem Start am häufigsten wissen wollen." Alle sagten
dasselbe, keine zwei gleich. Freigegeben ist die kurze Fassung von der
Prozessoptimierungs-Seite; sie gilt jetzt überall.

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
- **Kein Gedankenstrich-Aufzähler** ("Vier Leistungsfelder — von der zeitweisen
  Projektleitung bis zur Projektstabilisierung."). Der Gedankenstrich klebt hier
  zwei Überschriften aneinander. Entweder das eine oder das andere.
- **Klartext**, verständlich für eine fünfzehnjährige Leserin. Kein Fachjargon in
  der Überschrift. Konkret gestrichen: Roadmap, Audit, Go-live, Portfolio, RPA,
  Mandat, Stabsarbeit, Folien-Beratung.
- **Zwei Zeilen** ist das Maß. Eine Zeile wirkt wie eine Bildunterschrift, drei
  wie ein Absatz. Bei 960 px Spaltenbreite sind das rund 50 bis 75 Zeichen — bei
  langen Komposita eher weniger, weil ein einzelnes Wort die Zeile früh umbricht.
  Nicht mit dem Zeichenzähler prüfen, sondern im Browser messen.
  Ausgenommen sind die vom Kunden persönlich freigegebenen Überschriften und die
  beiden festgelegten Bausteine oben; die stehen so, wie sie stehen.

---

## Abschnitts-Labels (`.eyebrow`)

Die kleine Zeile über der Überschrift benennt den Abschnitt. Sie lief in drei
Varianten auseinander: die Hub-Seiten sagten "Unsere Leistungen", ein Teil der
Unterseiten nur "Leistungen", ein anderer "Ausgangslage" statt zu sagen, woran es
hakt. Verbindlich ist die Hub-Fassung:

| Abschnitt | Label |
|---|---|
| Problem | eine **"Warum …"**-Zeile, die das Problem benennt — nicht "Ausgangslage" |
| Leistungen | Unsere Leistungen |
| Vorgehen | Unser Vorgehen |
| Anwendungsfälle | Konkrete Anwendungsfelder |
| Zuschnitt / Branchen | Branchenübergreifend |
| Abgrenzung | Was uns unterscheidet |
| Arbeitsweise | Wie wir arbeiten |
| FAQ | Häufig gestellte Fragen |
| Abschluss | Nächster Schritt |

Themenspezifische Labels dazwischen sind erlaubt ("Methoden im Überblick",
"Fertigungstypen", "Leitplanken") — die gibt es auf den Hub-Seiten auch. Kein
Label darf auf einer Seite zweimal vorkommen, und statt `&` steht "und".
