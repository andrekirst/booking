#!/bin/bash

# Multi-Agent Docker Entwicklungsumgebung Stopper
# Stoppt isolierte Docker-Umgebungen für spezifische Agenten

set -e  # Exit bei Fehlern

# Parameter validation
if [ $# -lt 1 ]; then
    echo "❌ Fehler: Agent-Nummer erforderlich"
    echo ""
    echo "Usage: $0 <AGENT_NUMBER> [--remove-data]"
    echo ""
    echo "Beispiele:"
    echo "  $0 2                    # Stoppt Agent 2"
    echo "  $0 3 --remove-data      # Stoppt Agent 3 und entfernt Datenbank-Volumes"
    echo ""
    exit 1
fi

AGENT_NUMBER=$1
REMOVE_DATA=${2:-""}

# Validierung Agent-Nummer (2-4)
if [[ ! $AGENT_NUMBER =~ ^[2-4]$ ]]; then
    echo "❌ Fehler: AGENT_NUMBER muss zwischen 2 und 4 liegen"
    exit 1
fi

COMPOSE_FILE="docker-compose.agent$AGENT_NUMBER.yml"

echo "🛑 Stoppe Agent $AGENT_NUMBER"
echo "=========================="

# Prüfe ob Compose-File existiert
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "❌ Fehler: Docker Compose Datei '$COMPOSE_FILE' nicht gefunden"
    exit 1
fi

# Prüfe ob Services laufen
RUNNING_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)

if [ "$RUNNING_SERVICES" -eq 0 ]; then
    echo "ℹ️  Keine laufenden Services für Agent $AGENT_NUMBER gefunden"
else
    echo "🔍 Gefundene laufende Services: $RUNNING_SERVICES"
    
    # Zeige aktuelle Services
    echo ""
    echo "📋 Aktuelle Services:"
    docker compose -f "$COMPOSE_FILE" ps
    echo ""
    
    # Stoppe Services
    echo "🛑 Stoppe Services..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans
    
    echo "✅ Services gestoppt"
fi

# Entferne Datenbank-Volumes falls angefordert
if [ "$REMOVE_DATA" = "--remove-data" ]; then
    echo ""
    echo "🗑️  Entferne Datenbank-Volumes..."
    
    # Prüfe ob Volume existiert
    VOLUME_NAME="booking-agent4_postgres_agent${AGENT_NUMBER}_data"
    if docker volume ls -q | grep -q "^$VOLUME_NAME$"; then
        docker volume rm "$VOLUME_NAME" 2>/dev/null || true
        echo "✅ Volume '$VOLUME_NAME' entfernt"
    else
        echo "ℹ️  Volume '$VOLUME_NAME' existiert nicht"
    fi
    
    echo "⚠️  Alle Datenbank-Daten für Agent $AGENT_NUMBER wurden gelöscht!"
fi

# Zeige Port-Status
BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
FRONTEND_PORT=$((BASE_PORT + 1))
BACKEND_PORT=$((BASE_PORT + 2))
DB_PORT=$((BASE_PORT + 3))

echo ""
echo "📍 Freigegebene Ports:"
echo "   Frontend:  $FRONTEND_PORT"
echo "   Backend:   $BACKEND_PORT"
echo "   Database:  $DB_PORT"

# Prüfe ob Ports wirklich frei sind
echo ""
echo "🔍 Port-Status nach dem Stoppen:"
for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "   Port $port: ⚠️  Noch belegt (möglicherweise anderer Service)"
    else
        echo "   Port $port: ✅ Frei"
    fi
done

echo ""
echo "✅ Agent $AGENT_NUMBER erfolgreich gestoppt"

# Optionale Aufräum-Hinweise
echo ""
echo "💡 Weitere Optionen:"
echo "   Entferne Daten: $0 $AGENT_NUMBER --remove-data"
echo "   Entferne Images: docker image prune"
echo "   Status aller:   ./scripts/status-agents.sh"