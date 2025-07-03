# Copilot Instructions

Diese Datei enthält Richtlinien, um GitHub Copilot optimal in diesem Projekt zu nutzen.

## 1. Anforderungen aus requirements.md nutzen
- Copilot soll die Datei `requirements.md` als zentrale Quelle für fachliche und technische Anforderungen verwenden.
- Neue Issues, Features oder Tasks werden auf Basis der Anforderungen in `requirements.md` erstellt.
- Bei der Umsetzung von Anforderungen prüfe regelmäßig, ob sie vollständig und korrekt umgesetzt wurden.

## 2. Code-Stil und Konventionen
- Folge den in diesem Projekt üblichen Code-Konventionen (z. B. Benennung, Einrückung, Kommentare).
- Schreibe klaren, gut dokumentierten und wartbaren Code.
- Nutze, wenn möglich, bestehende Funktionen und Module wieder.

## 3. Commit-Nachrichten
- Verwende beschreibende Commit-Nachrichten auf Englisch oder Deutsch.
- Nutze das Conventional-Commits-Format (z. B. `feat: add booking validation`, `fix: behebe Fehler bei der Datumsauswahl`).
- Nach jeder Tätigkeit (Teilaufgabe) ist ein Commit durchzuführen und nach GitHub zu pushen.
- Die Commit-Nachricht soll kurz beschreiben, was geändert wurde.

## 4. Umsetzungsplan
- Vor der Umsetzung eines Issues erstellt Copilot einen kurzen Umsetzungsplan (Schritte/Tasks).
- Die Umsetzung erfolgt Schritt für Schritt entlang dieses Plans.
- Nach jedem Schritt erfolgt ein Commit und Push.

## 5. Tests
- Schreibe zu neuem Code immer passende Tests.
- Bevorzuge Test-Frameworks, die im Projekt bereits verwendet werden.

## 6. Dokumentation
- Dokumentiere neue Funktionen und wichtige Änderungen im Code und in der README.md.
- Halte die Dokumentation aktuell.

## 7. Abhängigkeiten
- Füge neue Abhängigkeiten nur hinzu, wenn unbedingt nötig.
- Dokumentiere neue Abhängigkeiten in der README.md oder in einer separaten Datei (z. B. requirements.txt, package.json).

## 8. Sicherheit
- Achte auf sichere Programmierpraktiken (z. B. Validierung von Benutzereingaben, Vermeidung von SQL-Injektionen).

## 9. Zusammenarbeit mit Copilot
- Schreibe präzise Kommentare und TODOs, um Copilot gezielt einzusetzen.
- Nutze Copilot-Vorschläge als Ausgangspunkt und überprüfe den generierten Code sorgfältig.
- Bei der automatischen Erstellung von Issues oder Tasks immer auf die Anforderungen in `requirements.md` zurückgreifen.

## 10. GitHub Aktionen
- Alle Aktionen, die mit GitHub durchgeführt werden können (z. B. Issue-Erstellung, PRs, Labels), sollen per GitHub CLI (`gh`) ausgeführt werden.
- Vor dem Erstellen eines Issues, einer PR oder eines Labels ist zu prüfen, ob das Label bereits existiert. Falls nicht, muss es mit einer sinnvollen Beschreibung und Farbe angelegt werden.
- Empfohlene Labels:
  - `setup`: Initial project setup und Grundstruktur
  - `struktur`: Projektstruktur und Architektur
  - `backend`: .NET Backend
  - `frontend`: Frontend (HTML/JS/TS)
  - `datenbank`: PostgreSQL und Datenbankthemen
  - Weitere Labels nach Bedarf, immer mit Beschreibung und Farbe versehen.

## 11. Branch-Strategie für Issues
- Für jedes Issue, das durch Copilot umgesetzt wird, muss immer ein neuer Branch angelegt werden.
- Der Branch wird immer auf GitHub (remote) erzeugt, niemals lokal. Grund: Es soll immer der neueste Stand aus dem Haupt-Repository verwendet werden, um Merge-Konflikte zu minimieren.
- Die Erstellung des Branches erfolgt per GitHub CLI (`gh`), z. B. mit `gh pr checkout -b <branchname>` oder `gh api`.

---

Diese Datei kann bei Bedarf erweitert oder angepasst werden.
