# Claude Docker Multi-Agent Integration Guide

## 🤖 Automatische Workflows für Claude

Diese Datei definiert, wie Claude automatisch mit dem Docker Multi-Agent System arbeiten soll.

### 📋 Issue-Start-Protokoll

Wenn der User sagt: **"Arbeite an Issue #XX"**

```bash
# Claude führt AUTOMATISCH aus:
1. ./scripts/status-agents.sh                    # Prüfe verfügbare Agenten
2. AGENT=$(first_available_agent)                # Wähle Agent 2, 3 oder 4
3. BRANCH="feat/XX-issue-description"            # Erstelle Branch-Namen
4. ./scripts/start-agent.sh $AGENT $BRANCH       # Starte Container
5. cd ../booking-agent$AGENT                     # Wechsle zum Worktree

# Claude informiert User:
"✅ Agent $AGENT gestartet für Issue #XX
- Frontend: http://localhost:${AGENT}0${AGENT}01
- Backend:  http://localhost:${AGENT}0${AGENT}02
- Worktree: ../booking-agent$AGENT"
```

### 🔄 Entwicklungs-Protokoll

Während der Entwicklung:

```bash
# Bei JEDER Code-Änderung:
1. Speichere Datei
2. Warte 2-3 Sekunden (Hot-Reload)
3. Informiere User: "✅ Änderung live unter http://localhost:..."

# Bei Frontend-Änderungen:
"✅ Frontend aktualisiert - prüfe http://localhost:${PORT}01"

# Bei Backend-Änderungen:
"✅ API aktualisiert - teste http://localhost:${PORT}02/endpoint"

# Bei Datenbank-Änderungen:
docker-compose -f docker-compose.agent$AGENT.yml exec backend-agent$AGENT \
  dotnet ef database update
"✅ Datenbank-Migration durchgeführt"
```

### 🧪 Test-Protokoll

Vor jedem Commit:

```bash
# Frontend Tests
cd src/frontend && npm test
# Bei Fehler: Korrigiere und teste erneut

# Backend Tests
cd src/backend && dotnet test
# Bei Fehler: Korrigiere und teste erneut

# Informiere User über Test-Status
"✅ Alle Tests bestanden - bereit für Commit"
```

### 💾 Commit-Protokoll

Bei Commits IMMER Test-URLs angeben:

```bash
git commit -m "feat: implement feature XYZ

Test-Umgebung:
- Frontend: http://localhost:${AGENT}0${AGENT}01
- Backend:  http://localhost:${AGENT}0${AGENT}02
- Feature:  http://localhost:${AGENT}0${AGENT}01/feature-path

Fixes #XX"
```

### 🔀 PR-Protokoll

Bei PR-Erstellung:

```markdown
## Test-Umgebung für Review

Reviewer können sofort testen mit:
\`\`\`bash
./scripts/start-agent.sh 3 $BRANCH_NAME
\`\`\`

URLs:
- Frontend: http://localhost:60301
- Backend:  http://localhost:60302
- Swagger:  http://localhost:60302/swagger

## Spezifische Test-Pfade
- Feature X: http://localhost:60301/feature-x
- API Endpoint: http://localhost:60302/api/feature-x
```

### 🧹 Cleanup-Protokoll

Nach PR-Merge AUTOMATISCH:

```bash
# Claude führt aus:
1. cd ~/git/github/andrekirst/booking            # Zurück zum Hauptrepo
2. git checkout main && git pull                 # Update main
3. ./scripts/cleanup-after-merge.sh $AGENT $BRANCH  # Full cleanup
4. ./scripts/status-agents.sh                    # Zeige Status

# Informiere User:
"✅ Issue #XX abgeschlossen und aufgeräumt
- Agent $AGENT ist wieder verfügbar
- Branch $BRANCH wurde gelöscht
- Docker Container und Volumes entfernt"
```

### 🔍 Status-Checks

Claude soll proaktiv Status prüfen:

```bash
# Bei Session-Start
./scripts/status-agents.sh
"📊 Status: X Agenten laufen, Y verfügbar"

# Bei Problemen
"⚠️ Container unhealthy - führe Neustart durch..."
docker-compose -f docker-compose.agent$AGENT.yml restart

# Bei Port-Konflikten
"❌ Port belegt - verwende alternativen Agent"
```

### 📝 User-Feedback Integration

Wenn User sagt: **"Das funktioniert nicht"** oder **"Ändere X"**

```bash
# Claude reagiert:
1. "Verstehe, ich passe das an..."
2. Macht Änderung im Code
3. Wartet auf Hot-Reload
4. "✅ Änderung durchgeführt - bitte teste erneut unter http://..."
```

Wenn User sagt: **"Ich habe was geändert"**

```bash
# Claude reagiert:
1. git status                                    # Prüfe Änderungen
2. git diff                                      # Verstehe Änderungen
3. "✅ Deine Änderungen erkannt - integriere sie"
4. git add -p && git commit                      # Committe Änderungen
```

### 🚨 Fehlerbehandlung

Bei Docker-Problemen:

```bash
# Container startet nicht
docker-compose -f docker-compose.agent$AGENT.yml logs
# → Analysiere Fehler und behebe

# Port bereits belegt
lsof -i :$PORT
# → Stoppe blockierenden Prozess oder wähle anderen Agent

# Speicherprobleme
docker system df
docker system prune -a
# → Räume auf und starte neu
```

### 🎯 Checkliste für Claude

Bei JEDEM Issue diese Checkliste abarbeiten:

- [ ] Agent auswählen und starten
- [ ] User über URLs informieren
- [ ] Code mit Hot-Reload entwickeln
- [ ] Tests vor Commits ausführen
- [ ] Test-URLs in Commits angeben
- [ ] PR mit Test-Anleitung erstellen
- [ ] Nach Merge vollständig aufräumen
- [ ] Status-Update an User

### 💡 Proaktive Hilfe

Claude sollte proaktiv:

1. **URLs wiederholen**: "Du kannst die Änderung unter http://localhost:60201 testen"
2. **Status melden**: "✅ Backend läuft stabil | ⚠️ Frontend wird neu gestartet"
3. **Hilfe anbieten**: "Soll ich die Logs zeigen?" bei Problemen
4. **Cleanup erinnern**: "PR gemerged? Soll ich aufräumen?"

### 🔗 Quick Commands für Claude

```bash
# Alias-Nutzung in Claude-Kontext
alias agent-start='./scripts/start-agent.sh'
alias agent-stop='./scripts/stop-agent.sh'
alias agent-status='./scripts/status-agents.sh'
alias agent-cleanup='./scripts/cleanup-after-merge.sh'

# Docker Shortcuts
alias dc2='docker-compose -f docker-compose.agent2.yml'
alias dc3='docker-compose -f docker-compose.agent3.yml'
alias dc4='docker-compose -f docker-compose.agent4.yml'

# Quick Logs
alias logs2='dc2 logs -f'
alias logs3='dc3 logs -f'
alias logs4='dc4 logs -f'
```

## 📋 Template-Responses für Claude

### Issue-Start
```
✅ Ich starte Agent {N} für Issue #{XX}
📦 Docker-Container werden gestartet...
🌐 Deine Test-URLs:
   - Frontend: http://localhost:{PORT1}
   - Backend:  http://localhost:{PORT2}
🚀 Entwicklungsumgebung bereit!
```

### Während Entwicklung
```
💾 Änderung gespeichert: {filename}
🔄 Hot-Reload aktiv...
✅ Teste jetzt unter: http://localhost:{PORT}/{path}
```

### Bei Problemen
```
⚠️ Problem erkannt: {error}
🔧 Führe Korrektur durch...
✅ Behoben - bitte erneut testen
```

### Nach Merge
```
🎉 Issue #{XX} erfolgreich abgeschlossen!
🧹 Räume Entwicklungsumgebung auf...
✅ Agent {N} ist wieder verfügbar für neue Aufgaben
```