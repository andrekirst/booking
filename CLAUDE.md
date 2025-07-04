# Claude Instructions

Diese Datei enthält Richtlinien und Projektinformationen für Claude AI-Sessions, um optimal in diesem Projekt zu arbeiten.

## Projekt-Übersicht

### Ziel der Software
Das Projekt ist eine Buchungsplattform für einen Garten, die es Familienmitgliedern ermöglicht, Übernachtungen zu buchen. Die Software funktioniert wie ein Hotel-Buchungssystem für ein einzelnes Haus/Garten.

### Rollen
- **Administrator**: Berechtigt Familienmitglieder, verwaltet Räume und Schlafplätze, konfiguriert Schlafmöglichkeiten
- **Familienmitglied**: Kann eine oder mehrere Nächte buchen

### Kernfunktionen
- Buchung von ein oder mehreren Nächten mit Datumsbereich
- Auswahl und Buchung von Räumen mit Personenanzahl
- Anpassung bestehender Buchungen (Datum, Räume, Personen)
- Stornierung von Buchungen
- Benutzerregistrierung und -anmeldung (E-Mail oder Google-Account)
- Administratorfreigabe für Buchungsrechte

### Technologie-Stack
- **Platform**: Raspberry PI Zero 2 W
- **Backend**: .NET 9 Native AOT (maximale Performance)
- **Frontend**: Plain HTML/JS mit TypeScript
- **Datenbank**: PostgreSQL
- **Datenzugriff**: Direkte SQL-Statements (kein EF Core)

### Besondere Anforderungen
- Maximale Performance für Raspberry PI Zero 2 W
- Hohe Sicherheitsstandards (Gerät hinter Fritzbox)
- Keine ORM-Frameworks, direkte SQL-Verwendung

## 1. Anforderungen aus requirements.md nutzen
- Verwende die Datei `requirements.md` als zentrale Quelle für fachliche und technische Anforderungen.
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
### 5.1 Test-Strategie
- **Zu jedem Feature** müssen sowohl **positive als auch negative Tests** erstellt werden
- **Positive Tests**: Verifizieren, dass das System bei korrekten Eingaben ordnungsgemäß funktioniert
- **Negative Tests**: Verifizieren, dass das System bei fehlerhaften Eingaben angemessen reagiert (Fehlerbehandlung)
- **Edge Cases**: Teste Grenzwerte und ungewöhnliche Szenarien

### 5.2 Test-Typen
#### Unit Tests
- Teste einzelne Funktionen/Methoden isoliert
- Positive Tests: Korrekte Parameter → Erwartetes Ergebnis
- Negative Tests: Falsche Parameter → Erwartete Exceptions/Fehler

#### Integration Tests
- Teste Zusammenspiel zwischen Komponenten
- Datenbankoperationen (CRUD-Tests)
- API-Endpoint Tests
- Positive: Gültige Requests → Korrekte Responses
- Negative: Ungültige Requests → Fehler-Responses

#### Schema/Database Tests
- Teste Datenbank-Constraints und -Validierungen
- Positive: Gültige Daten → Erfolgreiche Speicherung
- Negative: Constraint-Verletzungen → Erwartete Datenbankfehler

### 5.3 Test-Datei-Struktur
```
tests/
├── unit/
│   ├── database/
│   │   ├── schema_positive_tests.sql
│   │   ├── schema_negative_tests.sql
│   │   └── constraints_tests.sql
│   ├── services/
│   └── models/
├── integration/
│   ├── api/
│   └── database/
└── scripts/
    ├── run_all_tests.sh
    └── test_database.sh
```

### 5.4 Test-Beispiele
#### Positive Test
```sql
-- Test: Gültiger Benutzer kann erstellt werden
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Test User', 'test@example.com', 'hash123', 'MEMBER');
```

#### Negative Test
```sql
-- Test: Ungültige Rolle wird abgelehnt
-- Erwartung: Constraint-Violation
INSERT INTO users (name, email, password_hash, role) 
VALUES ('Test User', 'test@example.com', 'hash123', 'INVALID_ROLE');
```

### 5.5 Test-Ausführung
- Alle Tests müssen automatisiert ausführbar sein
- Test-Scripts sollen sowohl Erfolgs- als auch Fehler-Szenarien prüfen
- Aufräumen nach Tests (Cleanup) ist obligatorisch
- Tests müssen isoliert und wiederholbar sein

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
- Nach dem Anlegen des Branches auf GitHub muss der Branch lokal ausgecheckt werden, damit Änderungen nicht versehentlich auf `main` erfolgen.

---

Diese Datei kann bei Bedarf erweitert oder angepasst werden.
