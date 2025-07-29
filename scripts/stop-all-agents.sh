#!/bin/bash

# Multi-Agent Docker Entwicklungsumgebung - Alle Agenten stoppen
# Stoppt alle laufenden Docker-Umgebungen für Agenten 2-4

set -e  # Exit bei Fehlern

echo "🛑 Stoppe alle Multi-Agent Docker Umgebungen"
echo "============================================="

REMOVE_DATA=${1:-""}
STOPPED_COUNT=0
ERROR_COUNT=0

# Validiere Parameter
if [ "$REMOVE_DATA" != "" ] && [ "$REMOVE_DATA" != "--remove-data" ]; then
    echo "❌ Fehler: Unbekannter Parameter '$REMOVE_DATA'"
    echo ""
    echo "Usage: $0 [--remove-data]"
    echo ""
    echo "Beispiele:"
    echo "  $0                 # Stoppt alle Agenten"
    echo "  $0 --remove-data   # Stoppt alle Agenten und entfernt Datenbank-Volumes"
    echo ""
    exit 1
fi

# Zeige Warnung bei --remove-data
if [ "$REMOVE_DATA" = "--remove-data" ]; then
    echo "⚠️  WARNUNG: Alle Datenbank-Volumes werden gelöscht!"
    echo "   Dies entfernt ALLE lokalen Daten aller Agenten unwiderruflich!"
    echo ""
    read -p "   Fortfahren? (j/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Jj]$ ]]; then
        echo "❌ Abgebrochen"
        exit 0
    fi
    echo ""
fi

# Stoppe jeden Agenten
for AGENT_NUMBER in 2 3 4; do
    COMPOSE_FILE="docker-compose.agent$AGENT_NUMBER.yml"
    
    echo "🤖 Agent $AGENT_NUMBER"
    echo "─────────────"
    
    # Prüfe ob Compose-File existiert
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo "   ⚠️  Konfiguration nicht gefunden ($COMPOSE_FILE)"
        echo ""
        continue
    fi
    
    # Prüfe laufende Services
    RUNNING_SERVICES=$(docker compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)
    
    if [ "$RUNNING_SERVICES" -eq 0 ]; then
        echo "   ℹ️  Keine laufenden Services"
    else
        echo "   🛑 Stoppe $RUNNING_SERVICES Services..."
        
        # Versuche Services zu stoppen
        if docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null; then
            echo "   ✅ Services gestoppt"
            STOPPED_COUNT=$((STOPPED_COUNT + 1))
        else
            echo "   ❌ Fehler beim Stoppen der Services"
            ERROR_COUNT=$((ERROR_COUNT + 1))
        fi
    fi
    
    # Entferne Volumes falls angefordert
    if [ "$REMOVE_DATA" = "--remove-data" ]; then
        VOLUME_NAME="booking-agent4_postgres_agent${AGENT_NUMBER}_data"
        
        if docker volume ls -q | grep -q "^$VOLUME_NAME$"; then
            if docker volume rm "$VOLUME_NAME" 2>/dev/null; then
                echo "   🗑️  Volume '$VOLUME_NAME' entfernt"
            else
                echo "   ❌ Fehler beim Entfernen des Volumes '$VOLUME_NAME'"
                ERROR_COUNT=$((ERROR_COUNT + 1))
            fi
        else
            echo "   ℹ️  Volume '$VOLUME_NAME' existiert nicht"
        fi
    fi
    
    echo ""
done

# Zusammenfassung
echo "📋 Zusammenfassung"
echo "──────────────────"
echo "   ✅ Erfolgreich gestoppte Agenten: $STOPPED_COUNT"

if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "   ❌ Fehler aufgetreten: $ERROR_COUNT"
fi

# Prüfe verbleibende Docker-Ressourcen
REMAINING_CONTAINERS=$(docker ps -q --filter "name=booking-" | wc -l)
REMAINING_VOLUMES=$(docker volume ls -q | grep "booking-agent" | wc -l)

echo ""
echo "🐳 Verbleibende Docker-Ressourcen:"
echo "   📦 Container mit 'booking-' Namen: $REMAINING_CONTAINERS"
echo "   💾 Agent-Volumes: $REMAINING_VOLUMES"

# Port-Status nach dem Stoppen
echo ""
echo "🌐 Port-Status (60000er Bereich):"
ALL_PORTS_FREE=true

for AGENT_NUMBER in 2 3 4; do
    BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
    for PORT_OFFSET in 1 2 3; do
        PORT=$((BASE_PORT + PORT_OFFSET))
        
        if netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
            echo "   Port $PORT: ⚠️  Noch belegt"
            ALL_PORTS_FREE=false
        fi
    done
done

if [ "$ALL_PORTS_FREE" = true ]; then
    echo "   ✅ Alle Agent-Ports (60201-60403) sind frei"
else
    echo "   ⚠️  Einige Ports sind noch belegt (möglicherweise andere Services)"
fi

# Aufräum-Empfehlungen
echo ""
echo "🧹 Optionale Aufräum-Aktionen:"
echo "   Docker Images: docker image prune"
echo "   Docker System: docker system prune"
echo "   Docker Volumes: docker volume prune"

# Neustart-Empfehlungen
echo ""
echo "🚀 Neustart von Agenten:"
echo "   Einzelner Agent: ./scripts/start-agent.sh <AGENT_NUMBER> <BRANCH_NAME>"
echo "   Status prüfen:   ./scripts/status-agents.sh"

if [ "$ERROR_COUNT" -eq 0 ]; then
    echo ""
    echo "✅ Alle Multi-Agent Docker Umgebungen erfolgreich gestoppt"
    exit 0
else
    echo ""
    echo "⚠️  Stoppen abgeschlossen mit $ERROR_COUNT Fehlern"
    echo "   Prüfen Sie die obigen Meldungen für Details"
    exit 1
fi