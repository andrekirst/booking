#!/bin/bash

# Claude Code Sub-Agents Orchestrator
# Koordiniert mehrere Sub-Agents für komplexe Features

set -e

# Parameter validation
if [ $# -lt 3 ]; then
    echo "❌ Fehler: Unvollständige Parameter"
    echo ""
    echo "Usage: $0 <ISSUE_NUMBER> <SUB_AGENT_LIST> <BRANCH_PREFIX> [COORDINATION_AGENT]"
    echo ""
    echo "Sub-Agent List Format: \"S1,S2,S4\" (komma-getrennt, ohne Leerzeichen)"
    echo "Coordination Agent: S1-S6 (Standard: S1 = Senior Developer)"
    echo ""
    echo "Verfügbare Sub-Agents:"
    echo "  S1 - Senior Developer (Standard-Koordinator)"
    echo "  S2 - UI Developer"
    echo "  S3 - UX Expert"
    echo "  S4 - Test Expert"
    echo "  S5 - Architecture Expert"
    echo "  S6 - DevOps Expert"
    echo ""
    echo "Beispiele:"
    echo "  $0 75 \"S1,S2,S4\" feat/75-full-stack-feature S1"
    echo "  $0 76 \"S2,S3\" feat/76-ui-ux-redesign S2"
    echo "  $0 77 \"S5,S1,S6\" feat/77-architecture-refactor S5"
    echo ""
    echo "Vordefinierte Patterns:"
    echo "  full_stack_feature: S1,S2,S3,S4,S6 (alle außer Architecture Expert)"
    echo "  performance_optimization: S5,S1,S6 (Architecture, Senior, DevOps)"
    echo "  ui_redesign: S2,S3,S1 (UI, UX, Senior Review)"
    echo "  testing_suite: S4,S1 (Test Expert, Senior Review)"
    echo ""
    exit 1
fi

ISSUE_NUMBER=$1
SUB_AGENT_LIST=$2
BRANCH_PREFIX=$3
COORDINATION_AGENT=${4:-"S1"}

# Parse Sub-Agent List
IFS=',' read -ra AGENTS <<< "$SUB_AGENT_LIST"

# Validation
for agent in "${AGENTS[@]}"; do
    if [[ ! $agent =~ ^S[1-6]$ ]]; then
        echo "❌ Fehler: Ungültige Sub-Agent ID '$agent'"
        echo "   Gültige IDs: S1, S2, S3, S4, S5, S6"
        exit 1
    fi
done

if [[ ! $COORDINATION_AGENT =~ ^S[1-6]$ ]]; then
    echo "❌ Fehler: Ungültiger Koordinations-Agent '$COORDINATION_AGENT'"
    exit 1
fi

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

echo "🎭 Claude Code Sub-Agents Orchestrator"
echo "======================================"
echo "Issue: #$ISSUE_NUMBER"
echo "Branch Prefix: $BRANCH_PREFIX"
echo "Agents: ${AGENTS[*]}"
echo "Koordinator: $COORDINATION_AGENT (${AGENT_INFO[$COORDINATION_AGENT]})"
echo ""

# Prüfe ob alle Agents verfügbar sind
echo "🔍 Prüfe Agent-Verfügbarkeit..."
for agent in "${AGENTS[@]}"; do
    compose_file="docker-compose.sub-agent$agent.yml"
    if [ -f "$compose_file" ] && docker compose -f "$compose_file" ps 2>/dev/null | grep -q "Up"; then
        echo "⚠️  Agent $agent bereits aktiv - wird neu gestartet"
        ./scripts/stop-sub-agent.sh "$agent"
        sleep 2
    fi
done

# Erstelle Branch-Namen für jeden Agent
declare -A AGENT_BRANCHES
for agent in "${AGENTS[@]}"; do
    case $agent in
        S1) role_suffix="architecture" ;;
        S2) role_suffix="frontend" ;;
        S3) role_suffix="ux" ;;
        S4) role_suffix="testing" ;;
        S5) role_suffix="system-design" ;;
        S6) role_suffix="devops" ;;
    esac
    AGENT_BRANCHES[$agent]="$BRANCH_PREFIX-$role_suffix"
done

# Starte alle Sub-Agents parallel
echo ""
echo "🚀 Starte Sub-Agents parallel..."
echo "================================"

# Array für Background-PIDs
declare -a PIDS

for agent in "${AGENTS[@]}"; do
    branch="${AGENT_BRANCHES[$agent]}"
    role="${AGENT_ROLES[$agent]}"
    
    echo "   Starte $agent (${AGENT_INFO[$agent]}) auf Branch $branch..."
    
    # Starte Sub-Agent im Hintergrund
    (
        ./scripts/start-sub-agent.sh "$agent" "$branch" "$role" "$ISSUE_NUMBER" > "logs/start-$agent.log" 2>&1
        echo "✅ $agent gestartet" > "logs/status-$agent.log"
    ) &
    
    PIDS+=($!)
    sleep 3  # Kurze Verzögerung zwischen Starts
done

# Warte auf alle Starts
echo ""
echo "⏳ Warte auf Abschluss aller Starts..."
mkdir -p logs

FAILED_AGENTS=()
for i in "${!PIDS[@]}"; do
    agent="${AGENTS[$i]}"
    pid="${PIDS[$i]}"
    
    if wait $pid; then
        echo "✅ $agent erfolgreich gestartet"
    else
        echo "❌ $agent Start fehlgeschlagen"
        FAILED_AGENTS+=($agent)
    fi
done

# Zeige Ergebnisse
echo ""
echo "📊 Start-Ergebnisse:"
echo "==================="
SUCCESSFUL_COUNT=$((${#AGENTS[@]} - ${#FAILED_AGENTS[@]}))
echo "   Erfolgreich: $SUCCESSFUL_COUNT/${#AGENTS[@]}"

if [ ${#FAILED_AGENTS[@]} -gt 0 ]; then
    echo "   Fehlgeschlagen: ${FAILED_AGENTS[*]}"
    echo ""
    echo "🔍 Logs für fehlgeschlagene Agents:"
    for agent in "${FAILED_AGENTS[@]}"; do
        echo "   $agent: cat logs/start-$agent.log"
    done
fi

# Health Checks für alle gestarteten Agents
echo ""
echo "🏥 Führe Health Checks durch..."
echo "==============================="

sleep 10  # Warte bis Services bereit sind

for agent in "${AGENTS[@]}"; do
    if [[ ! " ${FAILED_AGENTS[@]} " =~ " ${agent} " ]]; then
        agent_number=${agent:1}
        base_port=$((60500 + ((agent_number - 1) * 100)))
        claude_port=$((base_port + 4))
        
        if curl -s --max-time 5 "http://localhost:$claude_port/health" > /dev/null; then
            echo "✅ $agent Health Check erfolgreich"
        else
            echo "⚠️  $agent Health Check fehlgeschlagen"
        fi
    fi
done

# Erstelle Koordinations-Dashboard
echo ""
echo "🎛️  Erstelle Koordinations-Dashboard..."
cat > "orchestration-dashboard-$ISSUE_NUMBER.md" << EOF
# Sub-Agents Orchestration Dashboard
## Issue #$ISSUE_NUMBER: $BRANCH_PREFIX

### Agent-Assignments
$(for agent in "${AGENTS[@]}"; do
    echo "- **$agent** (${AGENT_INFO[$agent]}): \`${AGENT_BRANCHES[$agent]}\`"
done)

### Koordination
- **Koordinator**: $COORDINATION_AGENT (${AGENT_INFO[$COORDINATION_AGENT]})
- **Gestartet**: $(date)

### Service URLs
$(for agent in "${AGENTS[@]}"; do
    if [[ ! " ${FAILED_AGENTS[@]} " =~ " ${agent} " ]]; then
        agent_number=${agent:1}
        base_port=$((60500 + ((agent_number - 1) * 100)))
        frontend_port=$((base_port + 1))
        backend_port=$((base_port + 2))
        claude_port=$((base_port + 4))
        echo "#### $agent (${AGENT_INFO[$agent]})"
        echo "- Frontend: http://localhost:$frontend_port"
        echo "- Backend: http://localhost:$backend_port"
        echo "- Claude Health: http://localhost:$claude_port/health"
        echo "- Agent Status: http://localhost:$claude_port/agent/status"
        echo ""
    fi
done)

### Development Workflow
1. **Architecture Planning** (${AGENT_INFO[$COORDINATION_AGENT]})
2. **Parallel Implementation** (All Agents)
3. **Integration Testing** (${AGENT_INFO[S4]})
4. **Code Review** (${AGENT_INFO[S1]})
5. **Deployment** (${AGENT_INFO[S6]})

### Management Commands
\`\`\`bash
# Status aller Agents
./scripts/status-sub-agents.sh

# Stoppe alle Agents
$(for agent in "${AGENTS[@]}"; do echo "./scripts/stop-sub-agent.sh $agent"; done)

# Logs anzeigen
$(for agent in "${AGENTS[@]}"; do echo "docker compose -f docker-compose.sub-agent$agent.yml logs -f"; done)
\`\`\`

### Collaboration Notes
- Coordination Agent: $COORDINATION_AGENT
- Issue Number: #$ISSUE_NUMBER
- Branch Pattern: $BRANCH_PREFIX-{role}
EOF

echo "📄 Dashboard erstellt: orchestration-dashboard-$ISSUE_NUMBER.md"

# Zeige finale URLs und Instruktionen
echo ""
echo "🎉 Multi-Agent Orchestration abgeschlossen!"
echo "==========================================="
echo ""
echo "📋 Orchestration Details:"
echo "   Issue: #$ISSUE_NUMBER"
echo "   Erfolgreiche Agents: $SUCCESSFUL_COUNT/${#AGENTS[@]}"
echo "   Koordinator: $COORDINATION_AGENT (${AGENT_INFO[$COORDINATION_AGENT]})"
echo "   Dashboard: orchestration-dashboard-$ISSUE_NUMBER.md"
echo ""

if [ $SUCCESSFUL_COUNT -gt 0 ]; then
    echo "🌐 Agent Service URLs:"
    for agent in "${AGENTS[@]}"; do
        if [[ ! " ${FAILED_AGENTS[@]} " =~ " ${agent} " ]]; then
            agent_number=${agent:1}
            base_port=$((60500 + ((agent_number - 1) * 100)))
            frontend_port=$((base_port + 1))
            claude_port=$((base_port + 4))
            
            echo "   $agent (${AGENT_INFO[$agent]}):"
            echo "     - Frontend: http://localhost:$frontend_port"
            echo "     - Claude:   http://localhost:$claude_port/health"
            echo "     - Worktree: ../booking-sub-agent$agent"
        fi
    done
    
    echo ""
    echo "🔧 Nächste Schritte:"
    echo "   1. Öffne separate Claude Code Sessions für jeden Agent:"
    for agent in "${AGENTS[@]}"; do
        if [[ ! " ${FAILED_AGENTS[@]} " =~ " ${agent} " ]]; then
            echo "      cd ../booking-sub-agent$agent && claude"
        fi
    done
    echo "   2. Koordiniere über den $COORDINATION_AGENT Agent"
    echo "   3. Verwende ./scripts/status-sub-agents.sh für Übersicht"
    echo "   4. Integriere über Pull Requests in den Main-Branch"
fi

# Cleanup function für Exit
cleanup() {
    echo ""
    echo "🧹 Cleanup bei Exit..."
    rm -f logs/start-*.log logs/status-*.log 2>/dev/null || true
}

trap cleanup EXIT

echo ""
echo "✨ Multi-Agent Team ist bereit für kollaborative Entwicklung!"
echo "   Dashboard: orchestration-dashboard-$ISSUE_NUMBER.md"
echo "   Status: ./scripts/status-sub-agents.sh"