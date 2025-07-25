# Docker Multi-Agent Entwicklungsumgebung - Setup-Anleitung

## 📋 Inhaltsverzeichnis

1. [Übersicht](#übersicht)
2. [Voraussetzungen](#voraussetzungen)
3. [Schnellstart](#schnellstart)
4. [Detaillierte Einrichtung](#detaillierte-einrichtung)
5. [Port-Schema](#port-schema)
6. [Tägliche Nutzung](#tägliche-nutzung)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## 🎯 Übersicht

Die Docker Multi-Agent Entwicklungsumgebung ermöglicht es, **mehrere Entwickler (Agenten)** parallel an verschiedenen Features zu arbeiten, ohne sich gegenseitig zu stören. Jeder Agent erhält:

- ✅ **Eigene Docker-Container** (Frontend, Backend, Datenbank)
- ✅ **Isolierte Ports** im 60000er Bereich
- ✅ **Separates Git Worktree**
- ✅ **Hot-Reload** für schnelle Entwicklung
- ✅ **Automatisches Setup** mit einem Befehl

## 🔧 Voraussetzungen

### Software-Anforderungen

```bash
# Prüfe Docker Installation
docker --version  # Docker version 20.10.0 oder höher
docker-compose --version  # Docker Compose version 2.0.0 oder höher

# Prüfe Git Installation
git --version  # Git version 2.20.0 oder höher

# Optional: GitHub CLI für PR-Erstellung
gh --version  # GitHub CLI version 2.0.0 oder höher
```

### System-Anforderungen

- **RAM**: Mindestens 8GB (empfohlen 16GB für 4 Agenten)
- **CPU**: 4+ Cores empfohlen
- **Disk**: 20GB freier Speicherplatz
- **OS**: Linux, macOS oder Windows mit WSL2

### Port-Verfügbarkeit prüfen

```bash
# Prüfe ob 60000er Ports frei sind
netstat -tuln | grep -E "60[1-4][0-9]{2}"
# Sollte keine Ausgabe zeigen (= Ports sind frei)
```

## 🚀 Schnellstart

### 1. Repository klonen (falls noch nicht vorhanden)

```bash
git clone https://github.com/andrekirst/booking.git
cd booking
```

### 2. Ersten Multi-Agent starten

```bash
# Starte Agent 2 mit einem Feature-Branch
./scripts/start-agent.sh 2 feat/mein-feature

# Nach erfolgreichem Start:
# Frontend: http://localhost:60201
# Backend:  http://localhost:60202
# Database: localhost:60203
```

### 3. Status prüfen

```bash
# Zeige Status aller Agenten
./scripts/status-agents.sh
```

### 4. Agent stoppen

```bash
# Stoppe Agent 2
./scripts/stop-agent.sh 2
```

## 📚 Detaillierte Einrichtung

### Schritt 1: Initiale Konfiguration

```bash
# Im Haupt-Repository
cd /pfad/zu/booking

# Stelle sicher, dass alle Scripts ausführbar sind
chmod +x scripts/*.sh

# Optional: Generiere alle Docker Compose Configs neu
./scripts/generate-agent-configs.sh
```

### Schritt 2: Multi-Agent Workflow starten

#### Beispiel: 3 Entwickler arbeiten parallel

```bash
# Terminal 1 - Agent 2: Frontend-Feature
./scripts/start-agent.sh 2 feat/65-user-dashboard

# Terminal 2 - Agent 3: Backend-API
./scripts/start-agent.sh 3 feat/66-api-optimization

# Terminal 3 - Agent 4: Tests
./scripts/start-agent.sh 4 feat/67-integration-tests
```

### Schritt 3: In Worktrees arbeiten

```bash
# Wechsle zum Agent 2 Worktree
cd ../booking-agent2

# Starte deine Entwicklungsumgebung (VS Code, etc.)
code .

# Oder starte eine Claude Code Session
claude
```

### Schritt 4: Live-URLs für Review

Nach dem Start sind die Anwendungen sofort erreichbar:

- **Agent 2**: http://localhost:60201
- **Agent 3**: http://localhost:60301  
- **Agent 4**: http://localhost:60401

## 🔢 Port-Schema

### Übersicht der Port-Zuweisungen

| Agent | Port-Bereich | Frontend | Backend | PostgreSQL | Zusätzliche Ports |
|-------|--------------|----------|---------|------------|-------------------|
| Agent 1 | 60100-60199 | 60101 | 60102 | 60103 | 60104-60199 |
| Agent 2 | 60200-60299 | 60201 | 60202 | 60203 | 60204-60299 |
| Agent 3 | 60300-60399 | 60301 | 60302 | 60303 | 60304-60399 |
| Agent 4 | 60400-60499 | 60401 | 60402 | 60403 | 60404-60499 |

### Port-Berechnung

```bash
# Formel für Port-Berechnung
BASE_PORT = 60000 + (AGENT_NUMBER * 100)
FRONTEND_PORT = BASE_PORT + 1
BACKEND_PORT = BASE_PORT + 2
DATABASE_PORT = BASE_PORT + 3
```

## 💻 Tägliche Nutzung

### Typischer Arbeitstag

```bash
# Morgens: Status prüfen
./scripts/status-agents.sh

# Agenten für heute starten
./scripts/start-agent.sh 2 feat/todays-feature

# Arbeiten im Worktree
cd ../booking-agent2
# ... Entwicklung ...

# Abends: Aufräumen
./scripts/stop-agent.sh 2
```

### Nützliche Befehle

```bash
# Logs eines Agenten anzeigen
docker-compose -f docker-compose.agent2.yml logs -f

# In Backend-Container einloggen
docker-compose -f docker-compose.agent2.yml exec backend-agent2 bash

# Datenbank-Shell öffnen
docker-compose -f docker-compose.agent2.yml exec postgres-agent2 psql -U booking_user -d booking_agent2

# Nur Backend neu starten
docker-compose -f docker-compose.agent2.yml restart backend-agent2
```

### Hot-Reload testen

```bash
# Frontend-Änderung (im Worktree)
echo "Test" >> ../booking-agent2/src/frontend/app/page.tsx
# Änderung ist sofort in http://localhost:60201 sichtbar

# Backend-Änderung
# .NET Hot-Reload funktioniert automatisch bei Code-Änderungen
```

## 🔍 Troubleshooting

### Problem: Container startet nicht

```bash
# Prüfe Logs
docker-compose -f docker-compose.agent2.yml logs

# Prüfe ob Ports belegt sind
netstat -tuln | grep 60201

# Neustart versuchen
./scripts/stop-agent.sh 2
./scripts/start-agent.sh 2 feat/branch-name
```

### Problem: "Container is unhealthy"

```bash
# Health-Status prüfen
docker-compose -f docker-compose.agent2.yml ps

# Backend direkt testen
curl http://localhost:60202/health

# Container neu bauen
docker-compose -f docker-compose.agent2.yml build --no-cache
docker-compose -f docker-compose.agent2.yml up -d
```

### Problem: Datenbank-Verbindung fehlgeschlagen

```bash
# Datenbank-Logs prüfen
docker-compose -f docker-compose.agent2.yml logs postgres-agent2

# Datenbank neu initialisieren
./scripts/stop-agent.sh 2 --remove-data
./scripts/start-agent.sh 2 feat/branch-name
```

### Problem: Port bereits belegt

```bash
# Finde Prozess der Port belegt
sudo lsof -i :60201

# Oder
sudo netstat -tlnp | grep 60201

# Prozess beenden oder anderen Agent verwenden
```

## ✅ Best Practices

### 1. Ein Agent = Ein Feature

```bash
# ✅ Gut: Klare Zuordnung
./scripts/start-agent.sh 2 feat/user-authentication
./scripts/start-agent.sh 3 feat/payment-integration

# ❌ Schlecht: Mehrere Features pro Agent
./scripts/start-agent.sh 2 feat/multiple-things
```

### 2. Regelmäßig aufräumen

```bash
# Wöchentlich: Alte Volumes entfernen
docker volume prune

# Alte Images entfernen
docker image prune -a

# Gestoppte Container entfernen
docker container prune
```

### 3. Resource Management

```bash
# Vor dem Start neuer Agenten
./scripts/status-agents.sh

# Nicht benötigte Agenten stoppen
./scripts/stop-agent.sh 3

# Bei wenig RAM: Max 2-3 Agenten gleichzeitig
```

### 4. Branch-Hygiene

```bash
# Worktrees regelmäßig aktualisieren
cd ../booking-agent2
git fetch origin
git pull origin main

# Alte Worktrees entfernen
git worktree list
git worktree remove ../booking-agent-old
```

### 5. Monitoring

```bash
# Docker Resource Usage
docker stats

# Detaillierte Agent-Übersicht
watch -n 5 './scripts/status-agents.sh'
```

## 📊 Performance-Tipps

### Docker-Optimierungen

```bash
# Docker BuildKit aktivieren (schnellere Builds)
export DOCKER_BUILDKIT=1

# Multi-Stage Build Cache nutzen
docker-compose -f docker-compose.agent2.yml build --parallel
```

### System-Optimierungen

- **SSD verwenden** für Docker-Volumes
- **RAM erhöhen** falls möglich (16GB+ ideal)
- **CPU-Cores** dem Docker Desktop zuweisen
- **WSL2** Memory-Limits anpassen (Windows)

## 🆘 Hilfe & Support

### Logs sammeln für Debugging

```bash
# Alle Logs eines Agenten exportieren
docker-compose -f docker-compose.agent2.yml logs > agent2-logs.txt

# System-Informationen sammeln
./scripts/status-agents.sh > system-status.txt
docker version >> system-status.txt
docker-compose version >> system-status.txt
```

### Nützliche Aliase

Füge zu deiner `~/.bashrc` oder `~/.zshrc` hinzu:

```bash
# Multi-Agent Shortcuts
alias ma-start='./scripts/start-agent.sh'
alias ma-stop='./scripts/stop-agent.sh'
alias ma-status='./scripts/status-agents.sh'
alias ma-stop-all='./scripts/stop-all-agents.sh'

# Schneller Worktree-Wechsel
alias wa2='cd ../booking-agent2'
alias wa3='cd ../booking-agent3'
alias wa4='cd ../booking-agent4'
```

## 🎉 Zusammenfassung

Mit dieser Docker Multi-Agent Umgebung kannst du:

1. **Parallel entwickeln** ohne Konflikte
2. **Sofort reviewen** über dedizierte URLs
3. **Isoliert testen** mit eigenen Datenbanken
4. **Schnell wechseln** zwischen Features
5. **Ressourcen sparen** durch Docker-Optimierungen

Viel Erfolg mit der Multi-Agent-Entwicklung! 🚀