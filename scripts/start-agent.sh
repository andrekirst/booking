#!/bin/bash

# Multi-Agent Docker Entwicklungsumgebung Starter
# Erstellt und startet isolierte Docker-Umgebungen für jeden Agenten

set -e  # Exit bei Fehlern

# Parameter validation
if [ $# -lt 2 ]; then
    echo "❌ Fehler: Unvollständige Parameter"
    echo ""
    echo "Usage: $0 <AGENT_NUMBER> <BRANCH_NAME> [ISSUE_NUMBER]"
    echo ""
    echo "Beispiele:"
    echo "  $0 2 feat/65-user-management"
    echo "  $0 3 feat/66-api-enhancement 66"
    echo ""
    exit 1
fi

AGENT_NUMBER=$1
BRANCH_NAME=$2
ISSUE_NUMBER=${3:-""}

# Validierung Agent-Nummer (2-4, da Agent 1 = Haupt-Repository)
if [[ ! $AGENT_NUMBER =~ ^[2-4]$ ]]; then
    echo "❌ Fehler: AGENT_NUMBER muss zwischen 2 und 4 liegen"
    echo "   Agent 1 ist das Haupt-Repository ohne separate Docker-Umgebung"
    exit 1
fi

# Port-Berechnung basierend auf 60000er Schema
BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
FRONTEND_PORT=$((BASE_PORT + 1))
BACKEND_PORT=$((BASE_PORT + 2))
DB_PORT=$((BASE_PORT + 3))

WORKTREE_DIR="../booking-agent$AGENT_NUMBER"
COMPOSE_FILE="docker-compose.agent$AGENT_NUMBER.yml"

echo "🚀 Multi-Agent Docker Setup für Agent $AGENT_NUMBER"
echo "=================================================="
echo "Branch: $BRANCH_NAME"
echo "Worktree: $WORKTREE_DIR"
echo "Ports: Frontend=$FRONTEND_PORT, Backend=$BACKEND_PORT, DB=$DB_PORT"
echo ""

# Prüfe ob Docker läuft
if ! docker info &> /dev/null; then
    echo "❌ Fehler: Docker ist nicht verfügbar oder läuft nicht"
    echo "   Bitte starten Sie Docker Desktop/Engine und versuchen Sie erneut"
    exit 1
fi

# Prüfe ob Compose-File existiert
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Fehler: Docker Compose Datei '$COMPOSE_FILE' nicht gefunden"
    echo "   Bitte führen Sie das Setup aus dem Haupt-Repository-Verzeichnis aus"
    exit 1
fi

# Stoppe existierende Services für diesen Agenten (falls laufend)
echo "🛑 Stoppe existierende Services für Agent $AGENT_NUMBER..."
docker-compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# Prüfe Port-Verfügbarkeit
echo "🔍 Prüfe Port-Verfügbarkeit..."
for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "⚠️  Warning: Port $port ist bereits belegt"
        echo "   Dies könnte zu Konflikten führen"
    fi
done

# Erstelle/Update Worktree falls erforderlich
if [ ! -d "$WORKTREE_DIR" ]; then
    echo "📂 Erstelle Git Worktree für Agent $AGENT_NUMBER..."
    
    # Prüfe ob Branch bereits existiert (lokal oder remote)
    if git show-ref --verify --quiet refs/heads/$BRANCH_NAME; then
        echo "   Lokaler Branch '$BRANCH_NAME' bereits vorhanden"
        git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
    elif git show-ref --verify --quiet refs/remotes/origin/$BRANCH_NAME; then
        echo "   Remote Branch 'origin/$BRANCH_NAME' gefunden"
        git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" "origin/$BRANCH_NAME"
    else
        echo "   Erstelle neuen Branch '$BRANCH_NAME' basierend auf main"
        git fetch origin main
        git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" origin/main
    fi
    
    echo "✅ Worktree erstellt: $WORKTREE_DIR"
else
    echo "📂 Worktree bereits vorhanden: $WORKTREE_DIR"
    
    # Update Worktree
    echo "🔄 Aktualisiere Worktree..."
    (cd "$WORKTREE_DIR" && git fetch origin && git status)
fi

# Baue und starte Services
echo "🏗️  Baue und starte Docker Services für Agent $AGENT_NUMBER..."
echo "   Dies kann beim ersten Mal einige Minuten dauern..."

# Baue Images mit Fortschrittsanzeige
docker-compose -f "$COMPOSE_FILE" build --parallel

# Starte Services
docker-compose -f "$COMPOSE_FILE" up -d

# Warte auf Service-Bereitschaft
echo "⏳ Warte auf Service-Bereitschaft..."
sleep 5

# Health Check
echo "🏥 Führe Health Check durch..."
HEALTH_CHECK_TIMEOUT=60
ELAPSED=0

while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
    # Prüfe Datenbank-Status über Docker Health Check
    DB_STATUS=$(docker-compose -f "$COMPOSE_FILE" ps -q postgres-agent$AGENT_NUMBER | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    
    if [ "$DB_STATUS" = "healthy" ]; then
        echo "✅ Datenbank ist bereit"
        break
    fi
    
    echo "   Warte auf Datenbank... ($ELAPSED/$HEALTH_CHECK_TIMEOUT Sekunden) - Status: $DB_STATUS"
    sleep 3
    ELAPSED=$((ELAPSED + 3))
done

if [ $ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo "❌ Timeout: Datenbank nicht bereit nach $HEALTH_CHECK_TIMEOUT Sekunden"
    echo "   Prüfen Sie die Logs: docker-compose -f $COMPOSE_FILE logs postgres-agent$AGENT_NUMBER"
    echo "   Prüfen Sie den Container-Status: docker-compose -f $COMPOSE_FILE ps"
    # Nicht abbrechen - Services könnten trotzdem funktionieren
    echo "⚠️  Fortfahren trotz Health Check Timeout..."
fi

# Zeige finale URLs und Informationen
echo ""
echo "🎉 Agent $AGENT_NUMBER erfolgreich gestartet!"
echo "============================================"
echo ""
echo "📍 Zugriff auf die Services:"
echo "   🌐 Frontend:  http://localhost:$FRONTEND_PORT"
echo "   🔧 Backend:   http://localhost:$BACKEND_PORT"
echo "   🗄️  Database: localhost:$DB_PORT"
echo ""
echo "📂 Worktree-Verzeichnis: $WORKTREE_DIR"
echo "🌿 Branch: $BRANCH_NAME"
if [ -n "$ISSUE_NUMBER" ]; then
    echo "🎫 Issue: #$ISSUE_NUMBER"
fi
echo ""
echo "🔧 Management-Befehle:"
echo "   Status:  docker-compose -f $COMPOSE_FILE ps"
echo "   Logs:    docker-compose -f $COMPOSE_FILE logs -f"
echo "   Stoppen: docker-compose -f $COMPOSE_FILE down"
echo "   Shell:   docker-compose -f $COMPOSE_FILE exec backend-agent$AGENT_NUMBER bash"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Öffnen Sie eine neue Claude Code Session im Worktree:"
echo "      cd $WORKTREE_DIR && claude"
echo "   2. Beginnen Sie mit der Issue-Implementierung"
echo "   3. Die Änderungen werden automatisch live-reloaded"
echo ""

# Optionale: Browser öffnen (falls $DISPLAY gesetzt ist)
if [ -n "$DISPLAY" ] && command -v xdg-open >/dev/null 2>&1; then
    echo "🌐 Öffne Frontend im Browser..."
    xdg-open "http://localhost:$FRONTEND_PORT" 2>/dev/null &
fi