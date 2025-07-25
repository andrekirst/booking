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

### Performance-Grundsätze
**WICHTIG - Backend-First Prinzip**: Datenverarbeitung wie Sortierung, Filterung, Paginierung und Aggregation muss IMMER backend-seitig implementiert werden. Dies reduziert:
- Netzwerk-Traffic (kleinere Datenmengen)
- Client-seitige Verarbeitungszeit
- Speicherverbrauch im Browser
- Besonders kritisch auf schwacher Hardware (Raspberry Pi)

**Beispiele:**
- ❌ Client: `data.sort((a, b) => new Date(b.date) - new Date(a.date))`
- ✅ Backend: API-Endpoint mit `ORDER BY startDate DESC`
- ❌ Client: `data.filter(item => item.status === 'active')`
- ✅ Backend: API-Parameter `?status=active`

### API-Client Verwendung - KRITISCH!
**NIEMALS direkte fetch() Aufrufe verwenden!** Alle API-Kommunikation MUSS über den konfigurierten API-Client erfolgen:

**❌ FALSCH - Direkte fetch-Aufrufe:**
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(credentials)
});
```

**✅ RICHTIG - API-Client verwenden:**
```javascript
const { apiClient } = useApi();
const response = await apiClient.login(credentials);
```

**Warum API-Client verwenden:**
- ✅ Verwendet konfigurierte Backend-URL (`NEXT_PUBLIC_API_URL`)
- ✅ Konsistente Error-Behandlung
- ✅ Automatisches Token-Management
- ✅ TypeScript-Type-Safety
- ✅ Mock-Support für Tests
- ❌ Direkte fetch verwendet hardcodierten localhost:3000

**Bei JEDER neuen API-Funktion:**
1. Type-Interfaces in `lib/types/api.ts` definieren
2. Methode zu `ApiClient` Interface hinzufügen
3. Implementation in `HttpApiClient` hinzufügen
4. Mock-Implementation in `MockApiClient` hinzufügen
5. Komponenten verwenden `const { apiClient } = useApi()`

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
- **KRITISCH - Strikte Issue-Fokussierung**: Implementiere AUSSCHLIESSLICH die in der Issue-Beschreibung geforderten Funktionen. NIEMALS zusätzliche Features wie Paging, Filterung, erweiterte Parameter oder "vorsorgliche" Funktionalitäten hinzufügen, die nicht explizit gefordert wurden. Dies verursacht unnötige Analyse-Zeit beim Review und macht PRs komplexer als nötig. Regel: Wenn es nicht im Issue steht, wird es nicht implementiert.
- **OBLIGATORISCH - Frontend & Backend Synchronisation**: Bei JEDER Aufgabe IMMER sowohl Frontend als auch Backend betrachten und synchron halten. Änderungen an APIs, Datenstrukturen oder Funktionen müssen konsistent zwischen Frontend (.NET Core API) und Backend (Next.js) implementiert werden. Vergessene Frontend-Anpassungen führen zu Runtime-Fehlern und zusätzlicher Review-Zeit.

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
- [ ] Pull Request erstellen mit Issue-Verknüpfung (siehe Abschnitt 12.4)
- [ ] PR-Details ausfüllen (Summary, Test Plan, Issue-Referenz)

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

### 12.4 OBLIGATORISCH - Pull Request Issue-Verknüpfung
**JEDER Pull Request MUSS mit seinem zugehörigen Issue verknüpft werden:**

#### Schritt 1: Issue-Referenz im PR-Body
**IMMER eine der folgenden Keywords verwenden:**
```bash
# Schließt Issue automatisch bei PR-Merge:
gh pr create --title "feat: implement feature X" --body "Fixes #30"
gh pr create --title "fix: resolve bug Y" --body "Closes #30" 
gh pr create --title "docs: update documentation Z" --body "Resolves #30"
```

#### Schritt 2: PR-Body Template
**Standard-Template für alle PRs:**
```markdown
## Summary
[Kurze Beschreibung der Änderungen]

### Implementation Details  
- [Detail 1]
- [Detail 2]

### Test Plan
- [x] Test 1 erfolgreich
- [x] Test 2 erfolgreich

Fixes #[ISSUE-NUMMER]
```

#### Schritt 3: Automatische Verknüpfung verifizieren
- ✅ GitHub zeigt "linked issues" in PR-Sidebar
- ✅ Issue erhält "linked pull request" Referenz
- ✅ Issue wird automatisch geschlossen bei PR-Merge

#### WICHTIGE Keywords für automatisches Issue-Closing:
- `Fixes #123` - Schließt Issue #123 
- `Closes #123` - Schließt Issue #123
- `Resolves #123` - Schließt Issue #123
- `Fixes: #123` - Schließt Issue #123 (mit Doppelpunkt)

#### Beispiel-Kommandos:
```bash
# Interaktiv mit Issue-Referenz im Body
gh pr create --title "feat: add user authentication" --body "$(cat <<'EOF'
## Summary
Implements user authentication with JWT tokens

### Changes
- Add login/logout endpoints
- JWT token validation middleware  
- User session management

### Test Plan
- [x] Login functionality tested
- [x] Token validation tested  
- [x] Logout functionality tested

Fixes #25
EOF
)"

# Mit --fill und nachträglicher Issue-Referenz
gh pr create --fill --body-file <(echo "Fixes #25")
```

**REGEL: Ohne Issue-Verknüpfung wird KEIN PR akzeptiert!**

## Entwicklungs-Erinnerungen
- Benutze das Options-Pattern, anstatt direkt von IConfiguration zu lesen
- **WICHTIG - Pipeline-Validierung**: Nach jedem Commit und Push MUSS gewartet werden, bis alle GitHub Actions/Pipelines erfolgreich durchgelaufen sind, bevor eine Aufgabe als "abgeschlossen" markiert wird. Dies gilt besonders für PR-Fixes und kritische Änderungen.

## 13. Multi-Agent-Entwicklung mit Git Worktrees

### 13.1 Übersicht
**Ziel**: Mehrere Claude Code Agenten arbeiten parallel an verschiedenen Issues mit isolierten Workspaces für 2.8-4.4x höhere Entwicklungsgeschwindigkeit.

### 13.2 Git Worktrees Setup

#### Basis-Setup für Multi-Agent-Entwicklung
```bash
# Haupt-Repository (Agent 1)
/home/user/git/github/andrekirst/booking/

# Worktree für Agent 2 erstellen
git worktree add ../booking-agent2 feat/33-feature-xyz

# Worktree für Agent 3 erstellen  
git worktree add ../booking-agent3 feat/34-backend-api

# Worktree für Agent 4 erstellen
git worktree add ../booking-agent4 feat/35-tests
```

#### Verzeichnisstruktur nach Setup
```
/home/user/git/github/andrekirst/
├── booking/          (main workspace - Agent 1)
├── booking-agent2/   (worktree - Agent 2)
├── booking-agent3/   (worktree - Agent 3)
└── booking-agent4/   (worktree - Agent 4)
```

### 13.3 Agent-Koordination-Protokoll

#### Issue-Zuweisung
**REGEL**: Jeder Agent bearbeitet GENAU EIN Issue in seinem Worktree.

1. **Agent 1** (Haupt-Workspace): Koordination + Issue #A
2. **Agent 2** (Worktree 1): Issue #B (z.B. Frontend)
3. **Agent 3** (Worktree 2): Issue #C (z.B. Backend)
4. **Agent 4** (Worktree 3): Issue #D (z.B. Tests)

#### Konflikt-Vermeidung
- **File-Level-Assignment**: Agenten arbeiten an unterschiedlichen Files
- **Feature-Isolation**: Klare Trennung von Features pro Agent
- **Communication**: Regelmäßige Sync über CLAUDE.md Updates

### 13.4 Multi-Agent Workflow

#### Schritt 1: Worktree erstellen
```bash
# Für neues Issue #36 mit Agent 2
git worktree add ../booking-agent2 -b feat/36-user-profile origin/main
cd ../booking-agent2
```

#### Schritt 2: Claude Code Session starten
```bash
# In jedem Worktree separate Claude Code Session
cd /path/to/booking-agent2
claude # Startet neue Claude Session für Agent 2
```

#### Schritt 3: Context-Isolation sicherstellen
- Jeder Worktree hat eigene `.claude/settings.local.json`
- Keine geteilten Kontexte zwischen Agenten
- Branch-spezifische Arbeit ohne Interferenz

#### Schritt 4: Koordinierte Integration
```bash
# Agent 1 koordiniert Merges
cd /path/to/booking
git fetch --all
git merge origin/feat/36-user-profile
git merge origin/feat/37-api-enhancement
```

### 13.5 Best Practices für Multi-Agent-Entwicklung

#### DO's ✅
- **Klare Issue-Zuweisung**: Ein Agent = Ein Issue = Ein Branch
- **Regelmäßige Pulls**: `git fetch --all` in allen Worktrees
- **Feature-Isolation**: Keine überlappenden Änderungen
- **Dokumentation**: Jeder Agent dokumentiert seine Änderungen
- **Communication**: Updates in gemeinsamer CLAUDE.md

#### DON'Ts ❌
- **Gleiche Files**: Mehrere Agenten ändern gleiche Datei
- **Branch-Hopping**: Agent wechselt zwischen Branches
- **Context-Mixing**: Geteilte .claude Settings
- **Unkontrollierte Merges**: Ohne Koordination mergen

### 13.6 Performance-Monitoring

#### Metriken
- **Development Speed**: Ziel 3x Improvement
- **Parallel Issues**: 2-4 gleichzeitige Entwicklungsströme
- **Merge Success Rate**: >95% konfliktfreie Merges
- **Agent Efficiency**: <10% Koordinations-Overhead

#### Tracking
```bash
# Aktive Worktrees anzeigen
git worktree list

# Branch-Status aller Agenten
git branch -a | grep feat/

# Merge-Readiness prüfen
git log --oneline --graph --all
```

### 13.7 Troubleshooting

#### Problem: Merge-Konflikte
**Lösung**: Strikte File-Assignment + Feature-Isolation

#### Problem: Context-Bleeding
**Lösung**: Separate .claude Verzeichnisse pro Worktree

#### Problem: Worktree-Fehler
```bash
# Worktree aufräumen
git worktree prune

# Beschädigten Worktree entfernen
git worktree remove booking-agent2 --force
```

### 13.8 Automation Scripts

#### Multi-Agent Setup Script
```bash
#!/bin/bash
# setup-multi-agent.sh
ISSUE_NUMBER=$1
FEATURE_NAME=$2
AGENT_NUMBER=$3

BRANCH_NAME="feat/${ISSUE_NUMBER}-${FEATURE_NAME}"
WORKTREE_DIR="../booking-agent${AGENT_NUMBER}"

# Worktree erstellen
git worktree add $WORKTREE_DIR -b $BRANCH_NAME origin/main

# Claude Settings kopieren
cp -r .claude $WORKTREE_DIR/

echo "✅ Agent $AGENT_NUMBER setup für Issue #$ISSUE_NUMBER"
echo "📁 Workspace: $WORKTREE_DIR"
echo "🌿 Branch: $BRANCH_NAME"
```

### 13.9 Claude Code Instanzen - WICHTIG

#### Separate Sessions erforderlich
**KRITISCH**: Jeder Agent benötigt eine EIGENE Claude Code Session/Instanz!

#### Warum separate Instanzen?
- **Context Isolation**: Jede Session hat eigenen, unabhängigen Kontext
- **Echte Parallelität**: Gleichzeitige Ausführung ohne Wartezeiten
- **Keine Interferenz**: Agenten können sich nicht gegenseitig stören
- **Token-Management**: Separate Limits pro Session

#### Praktisches Multi-Session Setup

**Option 1: Multiple Terminal-Fenster** (Empfohlen)
```bash
# Terminal 1 - Agent 1
cd /home/user/booking
claude  # Startet Claude Session für Agent 1

# Terminal 2 - Agent 2  
cd /home/user/booking-agent2
claude  # Startet SEPARATE Claude Session für Agent 2

# Terminal 3 - Agent 3
cd /home/user/booking-agent3
claude  # Startet DRITTE Claude Session für Agent 3
```

**Option 2: Terminal Multiplexer (tmux)**
```bash
# Erstelle tmux Session mit mehreren Windows
tmux new-session -s multi-agent -n agent1 -c /home/user/booking
tmux new-window -n agent2 -c /home/user/booking-agent2
tmux new-window -n agent3 -c /home/user/booking-agent3

# In jedem Window: claude starten
```

**Option 3: VS Code Multi-Workspace**
- Öffne jedes Worktree in separatem VS Code Fenster
- Nutze Claude Code Extension in jedem Fenster separat
- Alternativ: VS Code Workspace mit mehreren Ordnern

#### Kosten & Subscription
**⚠️ WICHTIG**: Multi-Agent bedeutet multiplizierte Kosten!

- **Claude Pro**: Bei 3-4 Agenten $100-200/Monat empfohlen
- **API Usage**: Kann schnell mehrere hundert Dollar/Monat erreichen
- **Token Limits**: Jede Session zählt gegen dein Limit

#### Session-Koordination
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   AGENT 1   │     │   AGENT 2   │     │   AGENT 3   │
│   Claude    │     │   Claude    │     │   Claude    │
│  Session 1  │     │  Session 2  │     │  Session 3  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                    Git Repository                    │
│  Branch: main    feat/33-ui    feat/34-api         │
└─────────────────────────────────────────────────────┘
```

#### FAQ - Häufige Fragen

**F: Kann ich eine Claude Session für alle Agenten verwenden?**
A: NEIN! Das würde Context-Mixing verursachen und die Parallelität zerstören.

**F: Wie viele parallele Sessions sind möglich?**
A: Technisch unbegrenzt, praktisch durch Subscription/Kosten limitiert (empfohlen: 2-4).

**F: Wie gebe ich verschiedenen Agenten unterschiedliche Anweisungen?**
A: In jedem Terminal/Session separat. Jeder Agent erhält eigene Instruktionen.

**F: Was passiert bei Session-Timeout?**
A: Jede Session hat eigenen Timeout. Bei Bedarf in jeweiligem Terminal neu starten.

#### Best Practice Beispiel
```bash
# Vorbereitung: 3 Issues für parallele Bearbeitung
# Issue #40: Backend API
# Issue #41: Frontend UI  
# Issue #42: Tests

# Setup alle Worktrees
./scripts/setup-multi-agent.sh 40 backend-api 2
./scripts/setup-multi-agent.sh 41 frontend-ui 3
./scripts/setup-multi-agent.sh 42 tests 4

# Starte 3 separate Terminals
# Terminal 1: cd booking && claude
#   -> "Implementiere die Backend API für Feature X"
# Terminal 2: cd ../booking-agent2 && claude  
#   -> "Erstelle die Frontend-Komponenten für Feature X"
# Terminal 3: cd ../booking-agent3 && claude
#   -> "Schreibe Tests für Feature X"

# Alle arbeiten GLEICHZEITIG ohne Konflikte!
```

### 13.10 Docker-basierte Multi-Agent-Entwicklungsumgebungen

#### Übersicht
**Ziel**: Automatisierte, isolierte Docker-Umgebungen für jeden Agenten mit eigenem Port-Bereich und sofort verfügbarer Entwicklungsumgebung. Diese Lösung eliminiert das manuelle Starten von `npm run dev` und IDE-Setup für jeden Agenten.

#### Port-Schema (60000er Bereich)
**WICHTIG**: Verwendet 60000er Bereich zur Vermeidung von Standard-Port-Konflikten:

| Agent | Port-Bereich | Frontend | Backend | PostgreSQL | Redis | Weitere Services |
|-------|--------------|----------|---------|------------|-------|------------------|
| Agent 1 | 60100-60199 | 60101 | 60102 | 60103 | 60104 | 60105-60199 |
| Agent 2 | 60200-60299 | 60201 | 60202 | 60203 | 60204 | 60205-60299 |
| Agent 3 | 60300-60399 | 60301 | 60302 | 60303 | 60304 | 60305-60399 |
| Agent 4 | 60400-60499 | 60401 | 60402 | 60403 | 60404 | 60405-60499 |

**Vorteile des 60000er Bereichs:**
- ✅ **Keine Konflikte** mit Standard-Ports (80, 443, 3000, 5000, etc.)
- ✅ **Klare Struktur**: 100er Blöcke pro Agent
- ✅ **Erweiterbar**: Platz für zusätzliche Services pro Agent
- ✅ **Hohe Ports**: Keine Admin-Rechte erforderlich

#### Docker-Setup pro Agent
Jeder Agent erhält isolierte Docker-Services:
- **PostgreSQL**: Eigene Datenbank-Instanz
- **Backend**: .NET API mit agentenspezifischer Konfiguration
- **Frontend**: Next.js mit Hot-Reload
- **Networking**: Isolierte Docker-Netzwerke

#### Automatisierungs-Scripts

##### Agent-Verwaltung
```bash
# Neuen Agenten starten (erstellt Worktree + Docker-Umgebung)
./scripts/start-agent.sh 2 feat/49-user-manual

# Agent stoppen
./scripts/stop-agent.sh 2

# Status aller Agenten
./scripts/status-agents.sh

# Alle Agenten stoppen
./scripts/stop-all-agents.sh
```

##### Konfiguration generieren
```bash
# Regeneriert alle Docker Compose Files aus Template
./scripts/generate-agent-configs.sh
```

#### Template-System
- **Template**: `docker-compose.agent-template.yml`
- **Generierte Files**: `docker-compose.agent{2-4}.yml`
- **Platzhalter**: `{AGENT_NUMBER}`, `{FRONTEND_PORT}`, etc.
- **Automatische Validation** der generierten Konfigurationen

#### Features

##### Automatisches Setup
- Git Worktree wird automatisch erstellt oder aktualisiert
- Dependencies werden im Container installiert
- Datenbank-Migrationen laufen automatisch
- Hot-Reload funktioniert out-of-the-box

##### Isolation
- Jeder Agent hat eigene Datenbank-Instanz
- Keine Port-Konflikte zwischen Agenten
- Unabhängige Node_modules und Build-Caches
- Eigene Environment-Variablen pro Agent

##### Monitoring
- Docker Dashboard zeigt alle laufenden Agenten
- Logs zentral über `docker-compose logs`
- Health-Checks für alle Services
- Restart-Policy für Stabilität

#### Workflow-Integration

##### Typischer Multi-Agent-Workflow
```bash
# 1. Starte mehrere Agenten parallel
./scripts/start-agent.sh 2 feat/65-user-management
./scripts/start-agent.sh 3 feat/66-api-enhancement
./scripts/start-agent.sh 4 feat/67-testing

# 2. Prüfe Status aller Agenten
./scripts/status-agents.sh

# 3. Arbeite in separaten Claude Sessions
# Terminal 1: cd ../booking-agent2 && claude
# Terminal 2: cd ../booking-agent3 && claude
# Terminal 3: cd ../booking-agent4 && claude

# 4. URLs für sofortige Review:
# Agent 2: http://localhost:60201
# Agent 3: http://localhost:60301  
# Agent 4: http://localhost:60401
```

##### Hot-Reload Testing
```bash
# Änderungen in Agent-Worktrees werden automatisch live-reloaded
echo "🐳 Docker Agent 2" > ../booking-agent2/src/frontend/app/test.txt
# Änderung ist sofort in http://localhost:60201 sichtbar
```

#### Vorteile
- ✅ **Zero-Setup**: Ein Befehl startet komplette Umgebung
- ✅ **Parallel Review**: Alle Agenten gleichzeitig reviewbar
- ✅ **Keine Konflikte**: Isolierte Ports und Datenbanken
- ✅ **Persistent**: Container überleben IDE-Neustart
- ✅ **Performance**: Docker-Cache beschleunigt Builds
- ✅ **Saubere Ports**: 60000er Bereich ohne Standard-Port-Konflikte

#### Technische Anforderungen
- Docker Desktop oder Docker Engine
- Docker Compose v2.0+
- Ausreichend RAM (min. 8GB für 4 Agenten)
- Port-Bereiche 60100-60499 frei

#### Best Practices
- **Ein Agent = Ein Issue**: Klare Trennung der Entwicklungsarbeiten
- **Status prüfen**: Regelmäßig `./scripts/status-agents.sh` verwenden
- **Aufräumen**: Gestoppte Container und Volumes regelmäßig löschen
- **Resource Management**: Nicht benötigte Agenten stoppen
- **Monitoring**: Docker Dashboard zur Überwachung nutzen

#### Troubleshooting
- **Port-Konflikte**: 60000er Bereich prüfen mit `netstat -tuln | grep 60`
- **Container-Probleme**: Logs mit `docker-compose -f docker-compose.agent{N}.yml logs`
- **Health-Checks**: Services können trotz "unhealthy" Status funktionieren
- **Performance**: Bei >3 Agenten RAM-Überwachung empfohlen

## 14. Kommunikation
- **Sprache**: Antworte in diesem Projekt grundsätzlich auf **Deutsch**
- Verwende deutsche Begriffe für Erklärungen und Dokumentation
- Code-Kommentare und technische Begriffe können auf Englisch bleiben (z.B. Variablennamen, Methodennamen)
- Commit-Nachrichten können auf Englisch oder Deutsch sein

---

Diese Datei kann bei Bedarf erweitert oder angepasst werden.