#!/bin/bash

# Multi-Agent Docker Entwicklungsumgebung Status
# Zeigt den Status aller Docker-Agenten und deren Services

set -e  # Exit bei Fehlern

echo "📊 Multi-Agent Docker Status Übersicht"
echo "======================================="
echo ""

# Prüfe Docker-Status
if ! docker info &> /dev/null; then
    echo "❌ Docker ist nicht verfügbar oder läuft nicht"
    exit 1
fi

# Sammle Informationen für alle Agenten (2-4)
TOTAL_RUNNING=0
TOTAL_STOPPED=0

for AGENT_NUMBER in 2 3 4; do
    COMPOSE_FILE="docker-compose.agent$AGENT_NUMBER.yml"
    WORKTREE_DIR="../booking-agent$AGENT_NUMBER"
    
    # Port-Berechnung
    BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
    FRONTEND_PORT=$((BASE_PORT + 1))
    BACKEND_PORT=$((BASE_PORT + 2))
    DB_PORT=$((BASE_PORT + 3))
    
    echo "🤖 Agent $AGENT_NUMBER"
    echo "─────────────"
    
    # Prüfe ob Compose-File existiert
    if [ ! -f "$COMPOSE_FILE" ]; then
        echo "   ❌ Konfiguration nicht gefunden ($COMPOSE_FILE)"
        echo ""
        continue
    fi
    
    # Prüfe Worktree-Status
    if [ -d "$WORKTREE_DIR" ]; then
        CURRENT_BRANCH=$(cd "$WORKTREE_DIR" && git branch --show-current 2>/dev/null || echo "unknown")
        echo "   📂 Worktree: ✅ Vorhanden ($CURRENT_BRANCH)"
    else
        echo "   📂 Worktree: ❌ Nicht vorhanden"
    fi
    
    # Prüfe Service-Status
    RUNNING_SERVICES=$(docker-compose -f "$COMPOSE_FILE" ps -q 2>/dev/null | wc -l)
    
    if [ "$RUNNING_SERVICES" -gt 0 ]; then
        echo "   🐳 Services: ✅ $RUNNING_SERVICES laufend"
        TOTAL_RUNNING=$((TOTAL_RUNNING + RUNNING_SERVICES))
        
        # Detaillierter Service-Status
        echo "   📋 Service-Details:"
        docker-compose -f "$COMPOSE_FILE" ps --format "table" 2>/dev/null | tail -n +2 | while read -r line; do
            if [ -n "$line" ]; then
                SERVICE_NAME=$(echo "$line" | awk '{print $1}')
                SERVICE_STATUS=$(echo "$line" | awk '{print $2}')
                echo "      • $SERVICE_NAME: $SERVICE_STATUS"
            fi
        done
        
        # Port-Status
        echo "   🌐 Ports:"
        for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT; do
            PORT_TYPE=""
            case $port in
                $FRONTEND_PORT) PORT_TYPE="Frontend" ;;
                $BACKEND_PORT) PORT_TYPE="Backend" ;;
                $DB_PORT) PORT_TYPE="Database" ;;
            esac
            
            if netstat -tuln 2>/dev/null | grep -q ":$port "; then
                echo "      • $PORT_TYPE ($port): ✅ Aktiv"
            else
                echo "      • $PORT_TYPE ($port): ❌ Inaktiv"
            fi
        done
        
        # URLs anzeigen
        echo "   🔗 URLs:"
        echo "      • Frontend:  http://localhost:$FRONTEND_PORT"
        echo "      • Backend:   http://localhost:$BACKEND_PORT/health"
        echo "      • Database:  localhost:$DB_PORT"
        
    else
        echo "   🐳 Services: ❌ Gestoppt"
        TOTAL_STOPPED=$((TOTAL_STOPPED + 1))
        echo "   🌐 Ports: $FRONTEND_PORT, $BACKEND_PORT, $DB_PORT (frei)"
    fi
    
    # Docker Volume Status
    VOLUME_NAME="booking-agent4_postgres_agent${AGENT_NUMBER}_data"
    if docker volume ls -q | grep -q "^$VOLUME_NAME$"; then
        VOLUME_SIZE=$(docker system df -v | grep "$VOLUME_NAME" | awk '{print $3}' || echo "unknown")
        echo "   💾 Volume: ✅ Vorhanden ($VOLUME_SIZE)"
    else
        echo "   💾 Volume: ❌ Nicht vorhanden"
    fi
    
    echo ""
done

# Gesamtübersicht
echo "📈 Gesamtübersicht"
echo "──────────────────"
echo "   🟢 Laufende Services: $TOTAL_RUNNING"
echo "   🔴 Gestoppte Agenten: $TOTAL_STOPPED"

# Docker-Ressourcen-Übersicht
echo ""
echo "🖥️  Docker-Ressourcen"
echo "─────────────────────"

# Docker System Info
DOCKER_CONTAINERS=$(docker ps -q | wc -l)
DOCKER_IMAGES=$(docker images -q | wc -l)
DOCKER_VOLUMES=$(docker volume ls -q | grep "booking-agent" | wc -l)

echo "   📦 Container (gesamt): $DOCKER_CONTAINERS laufend"
echo "   🏗️  Images (gesamt): $DOCKER_IMAGES"
echo "   💾 Agent-Volumes: $DOCKER_VOLUMES"

# Speicher-Verbrauch (falls docker system df verfügbar ist)
if command -v docker &> /dev/null; then
    echo ""
    echo "💽 Speicher-Verbrauch"
    echo "───────────────────────"
    docker system df 2>/dev/null | grep -E "(TYPE|Images|Containers|Local Volumes)" || echo "   Speicher-Informationen nicht verfügbar"
fi

# Port-Übersicht aller Agenten
echo ""
echo "🌐 Port-Übersicht (60000er Bereich)"
echo "──────────────────────────────────────"
echo "   Agent | Frontend | Backend | Database"
echo "   ------|----------|---------|----------"
for AGENT_NUMBER in 2 3 4; do
    BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
    FRONTEND_PORT=$((BASE_PORT + 1))
    BACKEND_PORT=$((BASE_PORT + 2))
    DB_PORT=$((BASE_PORT + 3))
    
    # Status-Icons
    FRONTEND_STATUS="❌"
    BACKEND_STATUS="❌"
    DB_STATUS="❌"
    
    if netstat -tuln 2>/dev/null | grep -q ":$FRONTEND_PORT "; then
        FRONTEND_STATUS="✅"
    fi
    if netstat -tuln 2>/dev/null | grep -q ":$BACKEND_PORT "; then
        BACKEND_STATUS="✅"
    fi
    if netstat -tuln 2>/dev/null | grep -q ":$DB_PORT "; then
        DB_STATUS="✅"
    fi
    
    printf "   %5s | %8s | %7s | %8s\n" "$AGENT_NUMBER" "$FRONTEND_PORT $FRONTEND_STATUS" "$BACKEND_PORT $BACKEND_STATUS" "$DB_PORT $DB_STATUS"
done

# Management-Hinweise
echo ""
echo "🔧 Management-Befehle"
echo "─────────────────────"
echo "   Agent starten: ./scripts/start-agent.sh <AGENT_NUMBER> <BRANCH_NAME>"
echo "   Agent stoppen: ./scripts/stop-agent.sh <AGENT_NUMBER>"
echo "   Alle stoppen:  ./scripts/stop-all-agents.sh"
echo "   Logs anzeigen: docker-compose -f docker-compose.agent<N>.yml logs -f"
echo ""

# Warnung bei hoher Ressourcen-Nutzung
if [ "$TOTAL_RUNNING" -gt 6 ]; then
    echo "⚠️  Warnung: Viele Services laufen gleichzeitig ($TOTAL_RUNNING)"
    echo "   Dies kann bei begrenztem RAM zu Performance-Problemen führen"
    echo "   Erwägen Sie, nicht benötigte Agenten zu stoppen"
    echo ""
fi

echo "✅ Status-Übersicht abgeschlossen"