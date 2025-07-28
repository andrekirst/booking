#!/bin/bash

# Claude Code Sub-Agents Status Dashboard
# Zeigt Status aller Sub-Agents und deren Ressourcen-Verwendung

set -e

echo "🤖 Claude Code Sub-Agents Status Dashboard"
echo "==========================================="
echo "Zeitpunkt: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Agent-Informationen
declare -A AGENT_INFO
AGENT_INFO[S1]="Senior Developer"
AGENT_INFO[S2]="UI Developer"
AGENT_INFO[S3]="UX Expert"
AGENT_INFO[S4]="Test Expert"
AGENT_INFO[S5]="Architecture Expert"
AGENT_INFO[S6]="DevOps Expert"

declare -A AGENT_ROLES
AGENT_ROLES[S1]="senior-developer"
AGENT_ROLES[S2]="ui-developer"
AGENT_ROLES[S3]="ux-expert"
AGENT_ROLES[S4]="test-expert"
AGENT_ROLES[S5]="architecture-expert"
AGENT_ROLES[S6]="devops-expert"

# Prüfe Docker-Verfügbarkeit
if ! docker info &> /dev/null; then
    echo "❌ Docker ist nicht verfügbar oder läuft nicht"
    echo "   Bitte starten Sie Docker Desktop/Engine"
    exit 1
fi

# Header für Tabelle
printf "%-4s %-20s %-15s %-10s %-8s %-8s %-8s %-8s %-15s\n" \
    "ID" "Agent" "Status" "Frontend" "Backend" "DB" "Claude" "Health" "Branch"
echo "--------------------------------------------------------------------------------------------------------"

TOTAL_ACTIVE=0
TOTAL_CONTAINERS=0
TOTAL_MEMORY=0

# Prüfe jeden Sub-Agent
for agent_id in S1 S2 S3 S4 S5 S6; do
    compose_file="docker-compose.sub-agent$agent_id.yml"
    worktree_dir="../booking-sub-agent$agent_id"
    
    # Port-Berechnung
    agent_number=${agent_id:1}
    base_port=$((60500 + ((agent_number - 1) * 100)))
    frontend_port=$((base_port + 1))
    backend_port=$((base_port + 2))
    db_port=$((base_port + 3))
    claude_port=$((base_port + 4))
    
    # Status ermitteln
    if [ -f "$compose_file" ]; then
        # Prüfe Container-Status
        container_status=$(docker-compose -f "$compose_file" ps --format json 2>/dev/null | jq -r '.[].State' 2>/dev/null | head -1 || echo "unknown")
        
        if [ "$container_status" = "running" ]; then
            status="🟢 Aktiv"
            TOTAL_ACTIVE=$((TOTAL_ACTIVE + 1))
            
            # Prüfe Service-Ports
            frontend_status=$(curl -s --max-time 2 "http://localhost:$frontend_port" > /dev/null 2>&1 && echo "✅" || echo "❌")
            backend_status=$(curl -s --max-time 2 "http://localhost:$backend_port/health" > /dev/null 2>&1 && echo "✅" || echo "❌")
            db_status=$(nc -z localhost $db_port 2>/dev/null && echo "✅" || echo "❌")
            claude_status=$(curl -s --max-time 2 "http://localhost:$claude_port/health" > /dev/null 2>&1 && echo "✅" || echo "❌")
            
            # Health-Status abrufen
            health_response=$(curl -s --max-time 3 "http://localhost:$claude_port/health" 2>/dev/null)
            if [ -n "$health_response" ]; then
                health_status="🟢 OK"
            else
                health_status="🔴 Error"
            fi
            
        elif [ "$container_status" = "exited" ]; then
            status="🔴 Gestoppt"
            frontend_status="⏹️"
            backend_status="⏹️"
            db_status="⏹️"
            claude_status="⏹️"
            health_status="⏹️ Offline"
        else
            status="🟡 Unbekannt"
            frontend_status="❓"
            backend_status="❓"
            db_status="❓"
            claude_status="❓"
            health_status="❓ Unknown"
        fi
        
        # Container-Anzahl zählen
        container_count=$(docker-compose -f "$compose_file" ps -q 2>/dev/null | wc -l || echo 0)
        TOTAL_CONTAINERS=$((TOTAL_CONTAINERS + container_count))
        
    else
        status="⚫ Nicht konfiguriert"
        frontend_status="➖"
        backend_status="➖"
        db_status="➖"
        claude_status="➖"
        health_status="➖ N/A"
    fi
    
    # Git Branch ermitteln
    if [ -d "$worktree_dir/.git" ]; then
        current_branch=$(cd "$worktree_dir" && git branch --show-current 2>/dev/null || echo "unknown")
    else
        current_branch="N/A"
    fi
    
    # Zeile ausgeben
    printf "%-4s %-20s %-15s %-10s %-8s %-8s %-8s %-8s %-15s\n" \
        "$agent_id" \
        "${AGENT_INFO[$agent_id]}" \
        "$status" \
        "$frontend_status" \
        "$backend_status" \
        "$db_status" \
        "$claude_status" \
        "$health_status" \
        "$current_branch"
done

echo ""
echo "📊 Zusammenfassung:"
echo "   Aktive Sub-Agents: $TOTAL_ACTIVE/6"
echo "   Gesamt Container: $TOTAL_CONTAINERS"

# Docker Resource Usage
if [ $TOTAL_ACTIVE -gt 0 ]; then
    echo ""
    echo "💻 Ressourcen-Verwendung:"
    
    # Memory Usage für Sub-Agent Container
    echo "   Docker Memory Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | grep -E "(booking-.*-sub-agent|CONTAINER)" || echo "   Keine Sub-Agent Container gefunden"
    
    echo ""
    echo "🌐 Service URLs (nur aktive Agents):"
    for agent_id in S1 S2 S3 S4 S5 S6; do
        compose_file="docker-compose.sub-agent$agent_id.yml"
        if [ -f "$compose_file" ]; then
            container_status=$(docker-compose -f "$compose_file" ps --format json 2>/dev/null | jq -r '.[].State' 2>/dev/null | head -1 || echo "unknown")
            if [ "$container_status" = "running" ]; then
                agent_number=${agent_id:1}
                base_port=$((60500 + ((agent_number - 1) * 100)))
                frontend_port=$((base_port + 1))
                backend_port=$((base_port + 2))
                claude_port=$((base_port + 4))
                
                echo "   $agent_id (${AGENT_INFO[$agent_id]}):"
                echo "     Frontend: http://localhost:$frontend_port"
                echo "     Backend:  http://localhost:$backend_port"
                echo "     Claude:   http://localhost:$claude_port/health"
            fi
        fi
    done
fi

# Port-Übersicht
echo ""
echo "🔌 Port-Übersicht (60500-61099 Bereich):"
echo "┌──────┬──────────────────────┬─────────┬─────────┬──────────┬─────────┐"
echo "│ ID   │ Agent                │ Frontend│ Backend │ Database │ Claude  │"
echo "├──────┼──────────────────────┼─────────┼─────────┼──────────┼─────────┤"
for agent_id in S1 S2 S3 S4 S5 S6; do
    agent_number=${agent_id:1}
    base_port=$((60500 + ((agent_number - 1) * 100)))
    frontend_port=$((base_port + 1))
    backend_port=$((base_port + 2))
    db_port=$((base_port + 3))
    claude_port=$((base_port + 4))
    
    printf "│ %-4s │ %-20s │ %-7s │ %-7s │ %-8s │ %-7s │\n" \
        "$agent_id" \
        "${AGENT_INFO[$agent_id]}" \
        "$frontend_port" \
        "$backend_port" \
        "$db_port" \
        "$claude_port"
done
echo "└──────┴──────────────────────┴─────────┴─────────┴──────────┴─────────┘"

# Worktree Status
echo ""
echo "📂 Git Worktree Status:"
if command -v git >/dev/null 2>&1; then
    echo "   Aktive Worktrees:"
    git worktree list | grep "booking-sub-agent" || echo "   Keine Sub-Agent Worktrees gefunden"
else
    echo "   Git nicht verfügbar"
fi

# Disk Usage
echo ""
echo "💾 Disk Usage (Docker Volumes):"
docker volume ls | grep "booking.*sub.*agent" | while read driver volume_name; do
    if command -v docker >/dev/null 2>&1; then
        size=$(docker system df -v | grep "$volume_name" | awk '{print $3}' || echo "Unknown")
        echo "   $volume_name: $size"
    fi
done || echo "   Keine Sub-Agent Volumes gefunden"

# Management-Befehle
echo ""
echo "🔧 Nützliche Befehle:"
echo "   Alle stoppen:        for id in S1 S2 S3 S4 S5 S6; do ./scripts/stop-sub-agent.sh \$id; done"
echo "   Logs anzeigen:       docker-compose -f docker-compose.sub-agent<ID>.yml logs -f"
echo "   Container Shell:     docker-compose -f docker-compose.sub-agent<ID>.yml exec claude-sub-agent<ID> bash"
echo "   Health Check:        curl http://localhost:<CLAUDE_PORT>/health"
echo "   Agent Status:        curl http://localhost:<CLAUDE_PORT>/agent/status"

# Performance-Tipps
if [ $TOTAL_ACTIVE -gt 3 ]; then
    echo ""
    echo "⚠️  Performance-Hinweis:"
    echo "   $TOTAL_ACTIVE Sub-Agents aktiv - hohe Ressourcen-Nutzung"
    echo "   Stoppe nicht benötigte Agents: ./scripts/stop-sub-agent.sh <ID>"
fi

echo ""
echo "🔄 Letztes Update: $(date '+%H:%M:%S')"
echo "   Für Live-Updates: watch -n 10 './scripts/status-sub-agents.sh'"