# Docker Multi-Agent - Quick Reference 🚀

## 🎯 Wichtigste Befehle

```bash
# Agent starten
./scripts/start-agent.sh <AGENT_NR> <BRANCH_NAME>

# Agent stoppen
./scripts/stop-agent.sh <AGENT_NR>

# Status anzeigen
./scripts/status-agents.sh

# Alle stoppen
./scripts/stop-all-agents.sh
```

## 🔢 Port-Zuordnung

| Agent | Frontend URL | Backend URL | DB Port |
|-------|-------------|-------------|---------|
| 2 | http://localhost:60201 | http://localhost:60202 | 60203 |
| 3 | http://localhost:60301 | http://localhost:60302 | 60303 |
| 4 | http://localhost:60401 | http://localhost:60402 | 60403 |

## 💡 Häufige Workflows

### Neues Feature starten
```bash
./scripts/start-agent.sh 2 feat/mein-feature
cd ../booking-agent2
code .  # oder claude
```

### Logs anschauen
```bash
# Alle Services
docker-compose -f docker-compose.agent2.yml logs -f

# Nur Backend
docker-compose -f docker-compose.agent2.yml logs -f backend-agent2
```

### Datenbank-Zugriff
```bash
docker-compose -f docker-compose.agent2.yml exec postgres-agent2 \
  psql -U booking_user -d booking_agent2
```

### Container neustarten
```bash
# Einzelner Service
docker-compose -f docker-compose.agent2.yml restart backend-agent2

# Alle Services eines Agenten
./scripts/stop-agent.sh 2 && ./scripts/start-agent.sh 2 feat/branch
```

## 🔧 Troubleshooting

### Health Check Fehler?
```bash
# Direkt testen
curl http://localhost:60202/health

# Logs prüfen
docker-compose -f docker-compose.agent2.yml logs backend-agent2
```

### Port belegt?
```bash
# Wer nutzt den Port?
lsof -i :60201
```

### Aufräumen
```bash
# Volumes löschen
./scripts/stop-agent.sh 2 --remove-data

# Docker aufräumen
docker system prune -a
```

## 📍 Worktree Navigation

```bash
# Hauptrepository
cd ~/git/github/andrekirst/booking

# Agent Worktrees
cd ../booking-agent2  # Agent 2
cd ../booking-agent3  # Agent 3
cd ../booking-agent4  # Agent 4
```

## ⚡ Pro-Tips

1. **Parallel starten**: Mehrere Terminals für mehrere Agenten
2. **Resource Check**: `docker stats` für CPU/RAM-Überwachung
3. **Quick Reset**: `stop-agent.sh` + `start-agent.sh` löst die meisten Probleme
4. **Hot Reload**: Frontend-Änderungen sofort sichtbar, Backend auch!

---
📚 Vollständige Dokumentation: [DOCKER-MULTI-AGENT-SETUP.md](./DOCKER-MULTI-AGENT-SETUP.md)