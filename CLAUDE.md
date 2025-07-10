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
- **Frontend**: Next.js mit TypeScript und Tailwind CSS
- **Datenbank**: PostgreSQL
- **Datenzugriff**: Entity Framework Core

### Besondere Anforderungen
- Maximale Performance für Raspberry PI Zero 2 W
- Hohe Sicherheitsstandards (Gerät hinter Fritzbox)
- Entity Framework Core für Datenbankzugriff

## 1. Anforderungen aus requirements.md nutzen
- Verwende die Datei `requirements.md` als zentrale Quelle für fachliche und technische Anforderungen.
- Neue Issues, Features oder Tasks werden auf Basis der Anforderungen in `requirements.md` erstellt.
- Bei der Umsetzung von Anforderungen prüfe regelmäßig, ob sie vollständig und korrekt umgesetzt wurden.

## 2. Code-Stil und Konventionen
- Folge den in diesem Projekt üblichen Code-Konventionen (z. B. Benennung, Einrückung, Kommentare).
- Schreibe klaren, gut dokumentierten und wartbaren Code.
- Nutze, wenn möglich, bestehende Funktionen und Module wieder.
- **C# 12 Konventionen**:
  - **Primary Constructors**: Verwende Primary Constructors für Klassen mit Dependency Injection
    - Beispiel: `public class EventStore(BookingDbContext context, IEventSerializer serializer) : IEventStore`
    - Entferne explizite private readonly Fields zugunsten der Parameter-Captures
  - **Expression-bodied Members**: Nutze Expression-bodied Properties für einfache Get-Only Properties
    - Beispiel: `public DbSet<User> Users => Set<User>();`
  - **Brace-Formatierung**: ALLE if-Statements müssen Braces verwenden, auch bei einzeiligen Anweisungen
    - Korrekt: `if (condition) { throw new ArgumentException(); }`
    - Falsch: `if (condition) throw new ArgumentException();`
  - **Performance-Optimierungen**:
    - Verwende `Count == 0` statt `!Any()` für Listen
    - Nutze Ternary Operators für einfache Conditional Returns
    - Beispiel: `return snapshot == null ? null : eventSerializer.DeserializeSnapshot<T>(snapshot.SnapshotData);`
  - **Async/Await Best Practices**:
    - Verwende `await using` statt `using` für IAsyncDisposable
    - Beispiel: `await using var transaction = await context.Database.BeginTransactionAsync();`

## 3. Commit-Nachrichten
- Verwende beschreibende Commit-Nachrichten auf Englisch oder Deutsch.
- Nutze das Conventional-Commits-Format (z. B. `feat: add booking validation`, `fix: behebe Fehler bei der Datumsauswahl`).
- Nach jeder Tätigkeit (Teilaufgabe) ist ein Commit durchzuführen und nach GitHub zu pushen.
- Die Commit-Nachricht soll kurz beschreiben, was geändert wurde.

## 4. Umsetzungsplan
- **ALLERERSTER SCHRITT**: Branch-Workflow aus Abschnitt 11 und 12 durchführen - KEINE AUSNAHMEN!
- Vor der Umsetzung eines Issues erstellt Copilot einen kurzen Umsetzungsplan (Schritte/Tasks).
- Die Umsetzung erfolgt Schritt für Schritt entlang dieses Plans.
- Nach jedem Schritt erfolgt ein Commit und Push.
- **WICHTIG - Schrittweise Umsetzung**: Implementiere immer nur das, was explizit besprochen und geplant wurde. Vermeide es, zusätzliche Features oder Placeholder für zukünftige Funktionen zu erstellen, da dies die Issues zu groß macht und das Testen erschwert. Jedes Feature sollte vollständig und isoliert implementiert werden.

### 4.1 Obligatorische Reihenfolge bei Issue-Bearbeitung:
1. **Branch-Setup** (Abschnitt 11.3 + 12.1) - IMMER zuerst!
2. **Umsetzungsplan** erstellen und dokumentieren
3. **Schritt-für-Schritt Implementation** mit regelmäßigen Commits
4. **Tests** erstellen und ausführen
5. **Pull Request** erstellen und reviewen

## 5. Tests

### 5.1 Test-Frameworks und Tools
#### Backend/API
- **Test-Framework**: xUnit
- **Mocking**: NSubstitute (für Isolierung von Dependencies)
- **Test-Daten**: AutoFixture (für automatische Test-Daten-Generierung)
- **Assertions**: FluentAssertions
- **Integration Tests**: Testcontainers für PostgreSQL

#### Frontend
- **Unit/Component Tests**: Jest
- **E2E Tests**: Playwright
- **Test-Utilities**: React Testing Library (für Next.js)

### 5.2 Zu erstellende Testarten
1. **Unit Tests**: Isolierte Tests einzelner Funktionen/Methoden
2. **Funktionstests**: Tests von Features und Geschäftslogik
3. **Komponententests**: Tests einzelner UI-Komponenten (Frontend)
4. **Integrationstests**: Tests des Zusammenspiels mehrerer Komponenten
5. **Performance Tests**: Lasttests und Performance-Messungen
6. **Akzeptanztests**: Tests gegen Akzeptanzkriterien der User Stories
7. **End-to-End-Tests**: Vollständige Durchläufe durch die Anwendung
8. **Smoke Tests**: Grundlegende Tests der wichtigsten Funktionen

### 5.3 Best Practices
- **Testpyramide**: Viele Unit Tests, weniger Integration Tests, noch weniger E2E-Tests
- **Test-Daten**: Builder-Pattern mit AutoFixture verwenden
- **Page Object Model**: Für Playwright E2E-Tests
- **AAA-Pattern**: Arrange, Act, Assert für klare Teststruktur
- **Test-Isolation**: Jeder Test soll unabhängig ausführbar sein
- **Naming**: Beschreibende Test-Namen (When_Condition_Then_ExpectedResult)
- **Coverage**: Mindestens 80% Code-Coverage anstreben

### 5.4 Komponententest-Richtlinien
- **WICHTIG**: Bei jeder Erstellung oder Änderung von React-Komponenten MÜSSEN entsprechende Komponententests erstellt oder angepasst werden
- **Test-Struktur**: Verwende `describe` Blöcke zur Gruppierung von Tests nach Funktionalität
- **Test-Abdeckung**: Jede Komponente sollte mindestens folgende Tests haben:
  - Rendering-Tests für alle Varianten/Props
  - Event-Handler-Tests (onClick, onChange, etc.)
  - Accessibility-Tests (Focus, ARIA-Attribute)
  - Conditional Rendering-Tests
  - Props-Validierung-Tests
- **Test-Verzeichnis**: Tests gehören in `__tests__` Ordner neben der Komponente
- **Test-Naming**: `ComponentName.test.tsx` für Komponententests
- **Test-Commands**: 
  - `npm test` - Einmalige Ausführung aller Tests
  - `npm run test:watch` - Watch-Mode für Entwicklung
  - `npm run test:coverage` - Coverage-Report generieren

## 6. Dokumentation
- Dokumentiere neue Funktionen und wichtige Änderungen im Code und in der README.md.
- Halte die Dokumentation aktuell.

## 7. Abhängigkeiten
- Füge neue Abhängigkeiten nur hinzu, wenn unbedingt nötig.
- Dokumentiere neue Abhängigkeiten in der README.md oder in einer separaten Datei (z. B. requirements.txt, package.json).

## 8. Sicherheit
- Achte auf sichere Programmierpraktiken (z. B. Validierung von Benutzereingaben, Vermeidung von SQL-Injektionen).
- **WICHTIG: Secrets und sensible Daten**:
  - NIEMALS Secrets (wie JWT-Secrets, Datenbankpasswörter, API-Keys) in appsettings.json oder anderen Konfigurationsdateien im Repository speichern
  - Für die lokale Entwicklung: .NET User Secrets verwenden (`dotnet user-secrets`)
  - Für Docker/Production: Umgebungsvariablen verwenden, die aus .env-Dateien oder einem Secret-Management-System kommen
  - .env-Dateien müssen in .gitignore eingetragen sein und dürfen NIEMALS ins Repository committet werden
  - Beispiel für appsettings.json: `"JwtSettings": { "Secret": "" }` - der Wert wird über User Secrets oder Umgebungsvariablen überschrieben

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

### 11.1 Grundprinzipien
- **JEDES Issue erfordert einen neuen Branch** - keine Ausnahmen
- **Remote-First**: Branches werden IMMER auf GitHub (remote) erstellt, niemals lokal
- **Aktueller Stand**: Verwende immer den neuesten Stand des Haupt-Repository
- **Konfliktvermeidung**: Minimiere Merge-Konflikte durch saubere Branch-Trennung

### 11.2 Branch-Naming-Convention
- Format: `feat/ISSUE-NUMBER-short-description`
- Beispiele:
  - `feat/26-user-authentication`
  - `feat/27-booking-calendar-widget`
  - `fix/28-date-validation-bug`
  - `docs/29-api-documentation`

### 11.3 Obligatorischer Workflow
**DIESER WORKFLOW MUSS VOR JEDER ISSUE-BEARBEITUNG DURCHGEFÜHRT WERDEN:**

#### Schritt 1: Branch-Status überprüfen
```bash
git branch -a
git status
```
- ✅ Prüfe, ob du auf `main` Branch bist
- ✅ Falls nicht auf `main`: Wechsle zu `main` mit `git checkout main`

#### Schritt 2: Repository aktualisieren
```bash
git pull origin main
```
- ✅ Stelle sicher, dass lokaler `main` auf neuestem Stand ist

#### Schritt 3: Issue-Status prüfen
- ✅ Überprüfe, ob das Issue bereits auf einem anderen Branch bearbeitet wird
- ✅ Verwende `gh pr list` um aktive Pull Requests zu prüfen

#### Schritt 4: Neuen Branch erstellen (Remote)
```bash
gh api repos/:owner/:repo/git/refs -f ref=refs/heads/BRANCH-NAME -f sha=$(git rev-parse main)
```
- ✅ Erstelle Branch remote mit aktuellem `main` Stand

#### Schritt 5: Branch lokal auschecken
```bash
git fetch origin
git checkout BRANCH-NAME
```
- ✅ Checke den neuen Branch lokal aus
- ✅ Bestätige mit `git status`, dass du auf dem richtigen Branch bist

#### Schritt 6: Implementation beginnen
- ✅ Erst NACH successful Branch-Setup mit der Implementierung beginnen

### 11.4 Fehlervermeidung
- **NIEMALS** auf `main` Branch direkte Änderungen machen
- **IMMER** Branch-Status vor Arbeitsbeginn überprüfen
- **IMMER** Remote-Branch vor lokalem Checkout erstellen
- **NIEMALS** mehrere Issues auf einem Branch bearbeiten

## 12. Issue-Workflow (OBLIGATORISCH)

### 12.1 Workflow-Checkliste für neue Issues
**DIESE CHECKLISTE MUSS BEI JEDEM NEUEN ISSUE ABGEARBEITET WERDEN:**

#### ✅ Phase 1: Vorbereitung
- [ ] Issue-Nummer und Beschreibung notieren
- [ ] Aktuellen Branch überprüfen mit `git branch`
- [ ] Falls nicht auf `main`: `git checkout main`
- [ ] Repository aktualisieren mit `git pull origin main`
- [ ] Prüfen ob Issue bereits bearbeitet wird: `gh pr list`

#### ✅ Phase 2: Branch-Erstellung
- [ ] Branch-Namen festlegen (Format: `feat/ISSUE-NUMBER-description`)
- [ ] Remote-Branch erstellen mit `gh api`
- [ ] Branch lokal auschecken mit `git checkout BRANCH-NAME`
- [ ] Branch-Status bestätigen mit `git status`

#### ✅ Phase 3: Implementation
- [ ] Umsetzungsplan erstellen und dokumentieren
- [ ] Schritt-für-Schritt Implementierung
- [ ] Regelmäßige Commits mit aussagekräftigen Nachrichten
- [ ] Tests erstellen und ausführen

#### ✅ Phase 4: Abschluss
- [ ] Finale Tests durchführen
- [ ] Branch pushen mit `git push origin BRANCH-NAME`
- [ ] Pull Request erstellen mit `gh pr create`
- [ ] PR-Details ausfüllen (Summary, Test Plan, etc.)

### 12.2 Notfall-Checkliste bei Branch-Problemen
**Falls du feststellst, dass du auf dem falschen Branch arbeitest:**

1. **SOFORT STOPPEN** - keine weiteren Änderungen
2. Aktuellen Zustand sichern: `git stash`
3. Zum korrekten Branch wechseln oder neuen erstellen
4. Änderungen wiederherstellen: `git stash pop`
5. Weiterarbeiten auf dem korrekten Branch

### 12.3 Qualitätssicherung
- **Vor jedem Commit**: Überprüfe mit `git status` den Branch
- **Vor jedem Push**: Bestätige dass du auf dem richtigen Branch bist
- **Vor PR-Erstellung**: Verifiziere dass alle Änderungen zum Issue gehören

## Entwicklungs-Erinnerungen
- Benutze das Options-Pattern, anstatt direkt von IConfiguration zu lesen

## 13. Kommunikation
- **Sprache**: Antworte in diesem Projekt grundsätzlich auf **Deutsch**
- Verwende deutsche Begriffe für Erklärungen und Dokumentation
- Code-Kommentare und technische Begriffe können auf Englisch bleiben (z.B. Variablennamen, Methodennamen)
- Commit-Nachrichten können auf Englisch oder Deutsch sein

---

Diese Datei kann bei Bedarf erweitert oder angepasst werden.