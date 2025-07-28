#!/bin/bash

# Claude Code Sub-Agent Stopper
# Stoppt spezialisierte Sub-Agents und räumt Ressourcen auf

set -e

# Parameter validation
if [ $# -lt 1 ]; then
    echo "❌ Fehler: Sub-Agent ID erforderlich"
    echo ""
    echo "Usage: $0 <SUB_AGENT_ID> [--remove-data]"
    echo ""
    echo "Sub-Agent IDs:"
    echo "  S1 - Senior Developer Agent"
    echo "  S2 - UI Developer Agent"
    echo "  S3 - UX Expert Agent"
    echo "  S4 - Test Expert Agent"
    echo "  S5 - Architecture Expert Agent"
    echo "  S6 - DevOps Expert Agent"
    echo ""
    echo "Optionen:"
    echo "  --remove-data  Entfernt auch Datenbank-Volumes und Worktree"
    echo ""
    echo "Beispiele:"
    echo "  $0 S1"
    echo "  $0 S2 --remove-data"
    echo ""
    exit 1
fi

SUB_AGENT_ID=$1
REMOVE_DATA=${2:-""}

# Validierung Sub-Agent-ID
if [[ ! $SUB_AGENT_ID =~ ^S[1-6]$ ]]; then
    echo "❌ Fehler: SUB_AGENT_ID muss S1-S6 sein"
    echo "   Verfügbare Sub-Agents: S1, S2, S3, S4, S5, S6"
    exit 1
fi

WORKTREE_DIR="../booking-sub-agent$SUB_AGENT_ID"
COMPOSE_FILE="docker-compose.sub-agent$SUB_AGENT_ID.yml"

# Agent-spezifische Informationen
declare -A AGENT_INFO
AGENT_INFO[S1]="Senior Developer"
AGENT_INFO[S2]="UI Developer"
AGENT_INFO[S3]="UX Expert"
AGENT_INFO[S4]="Test Expert"
AGENT_INFO[S5]="Architecture Expert"
AGENT_INFO[S6]="DevOps Expert"

echo "🛑 Stoppe Claude Code Sub-Agent $SUB_AGENT_ID"
echo "============================================="
echo "Agent: ${AGENT_INFO[$SUB_AGENT_ID]}"
echo "Compose File: $COMPOSE_FILE"
echo "Worktree: $WORKTREE_DIR"
if [ "$REMOVE_DATA" = "--remove-data" ]; then
    echo "⚠️  Daten werden ebenfalls entfernt!"
fi
echo ""

# Prüfe ob Docker läuft
if ! docker info &> /dev/null; then
    echo "❌ Warning: Docker ist nicht verfügbar"
    echo "   Container könnten bereits gestoppt sein"
fi

# Prüfe ob Compose File existiert
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "⚠️  Warning: Docker Compose File '$COMPOSE_FILE' nicht gefunden"
    echo "   Sub-Agent war möglicherweise nie gestartet"
else
    echo "🔍 Prüfe Status der Sub-Agent Services..."
    
    # Zeige aktuellen Status
    if docker-compose -f "$COMPOSE_FILE" ps 2>/dev/null | grep -q "Up"; then
        echo "📊 Aktuelle Services:"
        docker-compose -f "$COMPOSE_FILE" ps
        echo ""
    else
        echo "ℹ️  Keine laufenden Services gefunden"
    fi
    
    # Stoppe Services
    echo "🛑 Stoppe Docker Services..."
    if [ "$REMOVE_DATA" = "--remove-data" ]; then
        echo "   Entferne auch Volumes..."
        docker-compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
    else
        docker-compose -f "$COMPOSE_FILE" down --remove-orphans
    fi
    
    echo "✅ Docker Services gestoppt"
fi

# Worktree Management
if [ "$REMOVE_DATA" = "--remove-data" ]; then
    if [ -d "$WORKTREE_DIR" ]; then
        echo "🗂️  Entferne Git Worktree..."
        
        # Sichere aktuelle Änderungen falls vorhanden
        if (cd "$WORKTREE_DIR" && git status --porcelain | grep -q .); then
            echo "⚠️  Worktree hat uncommitted Änderungen!"
            echo "   Änderungen werden gestasht für späteren Zugriff:"
            (cd "$WORKTREE_DIR" && git stash push -m "Auto-stash before sub-agent removal $(date)")
        fi
        
        # Entferne Worktree
        git worktree remove "$WORKTREE_DIR" --force 2>/dev/null || {
            echo "⚠️  Konnte Worktree nicht automatisch entfernen"
            echo "   Manueller Cleanup erforderlich: git worktree remove $WORKTREE_DIR --force"
        }
        
        echo "✅ Worktree entfernt"
    else
        echo "ℹ️  Worktree-Verzeichnis nicht gefunden: $WORKTREE_DIR"
    fi
    
    # Entferne Compose File
    if [ -f "$COMPOSE_FILE" ]; then
        rm "$COMPOSE_FILE"
        echo "✅ Docker Compose File entfernt"
    fi
else
    echo "ℹ️  Worktree und Daten bleiben erhalten"
    echo "   Zum vollständigen Entfernen: $0 $SUB_AGENT_ID --remove-data"
fi

# Cleanup Docker-Ressourcen (optional)
echo ""
echo "🧹 Cleanup-Optionen:"
echo "   Ungenutzte Docker-Images: docker image prune"
echo "   Ungenutzte Volumes: docker volume prune"
echo "   Vollständiger Cleanup: docker system prune -a"

# Port-Freigabe-Info
AGENT_NUMBER=${SUB_AGENT_ID:1}
BASE_PORT=$((60500 + ((AGENT_NUMBER - 1) * 100)))
FRONTEND_PORT=$((BASE_PORT + 1))
BACKEND_PORT=$((BASE_PORT + 2))
DB_PORT=$((BASE_PORT + 3))
CLAUDE_PORT=$((BASE_PORT + 4))

echo ""
echo "📍 Folgende Ports sind jetzt wieder verfügbar:"
echo "   Frontend: $FRONTEND_PORT"
echo "   Backend:  $BACKEND_PORT"
echo "   Database: $DB_PORT"
echo "   Claude:   $CLAUDE_PORT"

echo ""
echo "✅ Sub-Agent $SUB_AGENT_ID erfolgreich gestoppt!"

# Zeige verbleibende aktive Sub-Agents
echo ""
echo "🔍 Status anderer Sub-Agents:"
ACTIVE_AGENTS=0
for agent_id in S1 S2 S3 S4 S5 S6; do
    if [ "$agent_id" != "$SUB_AGENT_ID" ]; then
        compose_file="docker-compose.sub-agent$agent_id.yml"
        if [ -f "$compose_file" ] && docker-compose -f "$compose_file" ps 2>/dev/null | grep -q "Up"; then
            echo "   $agent_id: ${AGENT_INFO[$agent_id]} - ✅ Aktiv"
            ACTIVE_AGENTS=$((ACTIVE_AGENTS + 1))
        else
            echo "   $agent_id: ${AGENT_INFO[$agent_id]} - ⏹️  Gestoppt"
        fi
    fi
done

if [ $ACTIVE_AGENTS -eq 0 ]; then
    echo ""
    echo "ℹ️  Keine anderen Sub-Agents aktiv"
else
    echo ""
    echo "ℹ️  $ACTIVE_AGENTS andere Sub-Agent(s) noch aktiv"
fi