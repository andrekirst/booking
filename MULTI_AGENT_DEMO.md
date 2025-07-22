# Multi-Agent Development Demo

## Praktisches Beispiel: 3 Agenten arbeiten parallel

### Szenario
Wir entwickeln ein neues Feature "Benachrichtigungssystem" mit 3 parallel arbeitenden Agenten:

- **Agent 1** (Main): Koordination + Backend-API (Issue #40)
- **Agent 2**: Frontend UI Components (Issue #41)  
- **Agent 3**: E2E Tests (Issue #42)

### Setup-Prozess

#### 1. Agent 2 Setup (Frontend)
```bash
# Aus dem Hauptverzeichnis
./scripts/setup-multi-agent.sh 41 notification-ui 2

# Output:
# ✅ Worktree created at ../booking-agent2
# ✅ Branch feat/41-notification-ui created
# ✅ Claude settings isolated
```

#### 2. Agent 3 Setup (Tests)
```bash
./scripts/setup-multi-agent.sh 42 notification-tests 3

# Output:
# ✅ Worktree created at ../booking-agent3  
# ✅ Branch feat/42-notification-tests created
# ✅ Claude settings isolated
```

#### 3. Verzeichnisstruktur nach Setup
```
/home/andrekirst/git/github/andrekirst/
├── booking/           # Agent 1: Backend API
├── booking-agent2/    # Agent 2: Frontend UI
└── booking-agent3/    # Agent 3: E2E Tests
```

### Parallele Entwicklung

#### Agent 1 (Backend API)
```bash
# In booking/ directory
# Arbeitet an: src/backend/Booking.Api/Features/Notifications/
- NotificationController.cs
- NotificationService.cs  
- NotificationDto.cs
```

#### Agent 2 (Frontend UI)
```bash
# In booking-agent2/ directory
cd ../booking-agent2
# Arbeitet an: src/frontend/components/notifications/
- NotificationBell.tsx
- NotificationList.tsx
- NotificationItem.tsx
```

#### Agent 3 (E2E Tests)
```bash
# In booking-agent3/ directory  
cd ../booking-agent3
# Arbeitet an: src/frontend/e2e/
- notifications.spec.ts
- notification-api.spec.ts
```

### Koordination & Status-Check

#### Alle Worktrees anzeigen
```bash
git worktree list

# Output:
/home/.../booking           abcd123 [feat/32-multi-agent-workflow]
/home/.../booking-agent2    efgh456 [feat/41-notification-ui]
/home/.../booking-agent3    ijkl789 [feat/42-notification-tests]
```

#### Multi-Agent Status
```bash
# Custom Command nutzen
/worktree-status

# Output:
🤖 Multi-Agent Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent 1: Issue #40 🔄 Backend API (5 commits)
Agent 2: Issue #41 🔄 Frontend UI (3 commits)  
Agent 3: Issue #42 🔄 E2E Tests (2 commits)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
No conflicts detected ✅
```

### Integration & Merge

#### Step 1: Agent 2 (Frontend) fertig
```bash
# Agent 2 pushed seine Änderungen
cd ../booking-agent2
git push -u origin feat/41-notification-ui

# PR erstellen
gh pr create --title "feat: notification UI components" \
  --body "Frontend components for notification system. Fixes #41"
```

#### Step 2: Koordinierter Merge
```bash
# Zurück zu Agent 1 (Koordinator)
cd ../booking
git fetch --all

# Frontend zuerst mergen (keine Dependencies)
git merge origin/feat/41-notification-ui --no-ff

# Dann Backend
git push origin feat/32-multi-agent-workflow
```

### Performance-Metriken

#### Zeitersparnis durch Parallelisierung
```
Sequenziell:
- Backend API: 4h
- Frontend UI: 3h  
- E2E Tests: 2h
Total: 9h

Parallel (Multi-Agent):
- Alle 3 parallel: 4h (längste Task)
Ersparnis: 55% (5h gespart!)
```

#### Commit-Aktivität
```bash
# Commits pro Agent in 2h
Agent 1: 12 commits (Backend)
Agent 2: 8 commits (Frontend)
Agent 3: 5 commits (Tests)
Total: 25 commits parallel!
```

### Cleanup nach Feature-Completion

```bash
# Worktrees entfernen
git worktree remove ../booking-agent2
git worktree remove ../booking-agent3

# Branches löschen
git branch -d feat/41-notification-ui
git branch -d feat/42-notification-tests
```

## Lessons Learned

### ✅ Was funktioniert gut
- **File-Isolation**: Keine Konflikte durch klare Trennung
- **Parallel Commits**: 3x mehr Commits in gleicher Zeit
- **Quick Navigation**: ~/agent2.sh für schnellen Wechsel

### ⚠️ Herausforderungen  
- **Dependencies**: Backend muss vor Frontend-Tests ready sein
- **Communication**: Regelmäßige Syncs nötig
- **Resource Usage**: 3x Claude Sessions = 3x Token-Verbrauch

### 🚀 Best Practices
1. **Klare File-Grenzen** definieren vor Start
2. **Regelmäßige Status-Checks** mit /worktree-status
3. **Frühe Integration** von completed Features
4. **Dokumentation** in AGENT_INFO.md pro Workspace

## Fazit
Multi-Agent-Entwicklung mit Git Worktrees ermöglicht echte Parallel-Entwicklung mit bis zu 3x Geschwindigkeitssteigerung bei gut strukturierten Projekten!