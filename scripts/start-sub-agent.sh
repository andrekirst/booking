#!/bin/bash

# Claude Code Sub-Agent Starter
# Startet spezialisierte Sub-Agents für komplexe Entwicklungsaufgaben

set -e

# Parameter validation
if [ $# -lt 3 ]; then
    echo "❌ Fehler: Unvollständige Parameter"
    echo ""
    echo "Usage: $0 <SUB_AGENT_ID> <BRANCH_NAME> <AGENT_ROLE> [ISSUE_NUMBER]"
    echo ""
    echo "Sub-Agent IDs:"
    echo "  S1 - Senior Developer Agent"
    echo "  S2 - UI Developer Agent"
    echo "  S3 - UX Expert Agent"
    echo "  S4 - Test Expert Agent"
    echo "  S5 - Architecture Expert Agent"
    echo "  S6 - DevOps Expert Agent"
    echo ""
    echo "Beispiele:"
    echo "  $0 S1 feat/70-architecture-review senior-developer 70"
    echo "  $0 S2 feat/71-ui-components ui-developer 71"
    echo "  $0 S4 feat/72-test-automation test-expert 72"
    echo ""
    exit 1
fi

SUB_AGENT_ID=$1
BRANCH_NAME=$2
AGENT_ROLE=$3
ISSUE_NUMBER=${4:-""}

# Validierung Sub-Agent-ID
if [[ ! $SUB_AGENT_ID =~ ^S[1-6]$ ]]; then
    echo "❌ Fehler: SUB_AGENT_ID muss S1-S6 sein"
    echo "   Verfügbare Sub-Agents: S1, S2, S3, S4, S5, S6"
    exit 1
fi

# Agent-Rolle Validierung
VALID_ROLES=("senior-developer" "ui-developer" "ux-expert" "test-expert" "architecture-expert" "devops-expert")
if [[ ! " ${VALID_ROLES[@]} " =~ " ${AGENT_ROLE} " ]]; then
    echo "❌ Fehler: Ungültige AGENT_ROLE '$AGENT_ROLE'"
    echo "   Gültige Rollen: ${VALID_ROLES[*]}"
    exit 1
fi

# Port-Berechnung für Sub-Agents (60500+)
AGENT_NUMBER=${SUB_AGENT_ID:1}  # Extract number from S1-S6
BASE_PORT=$((60500 + ((AGENT_NUMBER - 1) * 100)))
FRONTEND_PORT=$((BASE_PORT + 1))
BACKEND_PORT=$((BASE_PORT + 2))
DB_PORT=$((BASE_PORT + 3))
CLAUDE_PORT=$((BASE_PORT + 4))

WORKTREE_DIR="../booking-sub-agent$SUB_AGENT_ID"
COMPOSE_FILE="docker-compose.sub-agent$SUB_AGENT_ID.yml"

# Agent-spezifische Informationen
declare -A AGENT_INFO
AGENT_INFO[S1]="Senior Developer - Architektur, Code-Reviews, komplexe Problemlösungen"
AGENT_INFO[S2]="UI Developer - Frontend-Komponenten, Styling, User Interface"
AGENT_INFO[S3]="UX Expert - User Experience, Usability, Accessibility"
AGENT_INFO[S4]="Test Expert - Test-Strategien, Unit/Integration/E2E Tests"
AGENT_INFO[S5]="Architecture Expert - System-Design, Performance, Skalierbarkeit"
AGENT_INFO[S6]="DevOps Expert - CI/CD, Deployment, Infrastructure"

echo "🤖 Claude Code Sub-Agent Setup für $SUB_AGENT_ID"
echo "=================================================="
echo "Agent: ${AGENT_INFO[$SUB_AGENT_ID]}"
echo "Rolle: $AGENT_ROLE"
echo "Branch: $BRANCH_NAME"
echo "Worktree: $WORKTREE_DIR"
echo "Ports: Frontend=$FRONTEND_PORT, Backend=$BACKEND_PORT, DB=$DB_PORT, Claude=$CLAUDE_PORT"
echo ""

# Prüfe ob Docker läuft
if ! docker info &> /dev/null; then
    echo "❌ Fehler: Docker ist nicht verfügbar oder läuft nicht"
    echo "   Bitte starten Sie Docker Desktop/Engine und versuchen Sie erneut"
    exit 1
fi

# Generiere Sub-Agent Docker Compose File falls nicht vorhanden
if [ ! -f "$COMPOSE_FILE" ]; then
    echo "🏗️  Generiere Docker Compose Konfiguration für Sub-Agent $SUB_AGENT_ID..."
    
    if [ ! -f "docker-compose.sub-agent-template.yml" ]; then
        echo "❌ Fehler: Template 'docker-compose.sub-agent-template.yml' nicht gefunden"
        exit 1
    fi
    
    # Template-Substitution
    sed -e "s/{SUB_AGENT_ID}/$SUB_AGENT_ID/g" \
        -e "s/{AGENT_ROLE}/$AGENT_ROLE/g" \
        -e "s/{BASE_PORT}/$BASE_PORT/g" \
        -e "s/{FRONTEND_PORT}/$FRONTEND_PORT/g" \
        -e "s/{BACKEND_PORT}/$BACKEND_PORT/g" \
        -e "s/{DB_PORT}/$DB_PORT/g" \
        -e "s/{CLAUDE_PORT}/$CLAUDE_PORT/g" \
        docker-compose.sub-agent-template.yml > "$COMPOSE_FILE"
    
    echo "✅ Docker Compose File generiert: $COMPOSE_FILE"
fi

# Stoppe existierende Services für diesen Sub-Agent
echo "🛑 Stoppe existierende Services für Sub-Agent $SUB_AGENT_ID..."
docker compose -f "$COMPOSE_FILE" down --remove-orphans 2>/dev/null || true

# Prüfe Port-Verfügbarkeit
echo "🔍 Prüfe Port-Verfügbarkeit..."
for port in $FRONTEND_PORT $BACKEND_PORT $DB_PORT $CLAUDE_PORT; do
    if netstat -tuln 2>/dev/null | grep -q ":$port "; then
        echo "⚠️  Warning: Port $port ist bereits belegt"
        echo "   Dies könnte zu Konflikten führen"
    fi
done

# Erstelle/Update Sub-Agent Worktree
if [ ! -d "$WORKTREE_DIR" ]; then
    echo "📂 Erstelle Git Worktree für Sub-Agent $SUB_AGENT_ID..."
    
    # Prüfe ob Branch bereits existiert
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

# Kopiere Agent-spezifische Konfiguration
echo "📄 Kopiere Agent-spezifische Konfiguration..."
AGENT_CONFIG_SOURCE="config/sub-agents/CLAUDE-$AGENT_ROLE.md"
AGENT_CONFIG_TARGET="$WORKTREE_DIR/CLAUDE.md"

if [ -f "$AGENT_CONFIG_SOURCE" ]; then
    cp "$AGENT_CONFIG_SOURCE" "$AGENT_CONFIG_TARGET"
    echo "✅ Agent-Konfiguration kopiert: $AGENT_CONFIG_TARGET"
else
    echo "⚠️  Warning: Agent-Konfiguration nicht gefunden: $AGENT_CONFIG_SOURCE"
    echo "   Sub-Agent startet mit Standard-Konfiguration"
fi

# Erstelle .claude Verzeichnis für Sub-Agent Settings
mkdir -p "$WORKTREE_DIR/.claude"
cat > "$WORKTREE_DIR/.claude/settings.json" << EOF
{
  "sub_agent": {
    "id": "$SUB_AGENT_ID",
    "role": "$AGENT_ROLE",
    "specializations": $(get_agent_specializations "$AGENT_ROLE"),
    "branch": "$BRANCH_NAME",
    "issue": "$ISSUE_NUMBER"
  },
  "development": {
    "frontend_url": "http://localhost:$FRONTEND_PORT",
    "backend_url": "http://localhost:$BACKEND_PORT",
    "health_url": "http://localhost:$CLAUDE_PORT/health"
  },
  "project_context": {
    "framework": "Next.js 15",
    "backend": ".NET 9",
    "database": "PostgreSQL",
    "styling": "Tailwind CSS"
  }
}
EOF

# Baue und starte Sub-Agent Services
echo "🏗️  Baue und starte Docker Services für Sub-Agent $SUB_AGENT_ID..."
echo "   Dies kann beim ersten Mal einige Minuten dauern..."

# Baue Images
docker compose -f "$COMPOSE_FILE" build --parallel

# Starte Services
docker compose -f "$COMPOSE_FILE" up -d --wait

# Warte auf Service-Bereitschaft
echo "⏳ Warte auf Service-Bereitschaft..."
sleep 8

# Health Check
echo "🏥 Führe Health Check durch..."
HEALTH_CHECK_TIMEOUT=90
ELAPSED=0

while [ $ELAPSED -lt $HEALTH_CHECK_TIMEOUT ]; do
    # Prüfe Claude Integration Health
    if curl -s "http://localhost:$CLAUDE_PORT/health" > /dev/null 2>&1; then
        echo "✅ Claude Integration ist bereit"
        break
    fi
    
    echo "   Warte auf Claude Integration... ($ELAPSED/$HEALTH_CHECK_TIMEOUT Sekunden)"
    sleep 5
    ELAPSED=$((ELAPSED + 5))
done

if [ $ELAPSED -ge $HEALTH_CHECK_TIMEOUT ]; then
    echo "❌ Timeout: Claude Integration nicht bereit nach $HEALTH_CHECK_TIMEOUT Sekunden"
    echo "   Services können trotzdem funktionieren"
fi

# Zeige finale Informationen
echo ""
echo "🎉 Sub-Agent $SUB_AGENT_ID erfolgreich gestartet!"
echo "=============================================="
echo ""
echo "🤖 Agent Details:"
echo "   ID: $SUB_AGENT_ID"
echo "   Rolle: $AGENT_ROLE"
echo "   Spezialisierung: ${AGENT_INFO[$SUB_AGENT_ID]}"
echo ""
echo "📍 Service URLs:"
echo "   🌐 Frontend:        http://localhost:$FRONTEND_PORT"
echo "   🔧 Backend:         http://localhost:$BACKEND_PORT"
echo "   🗄️  Database:       localhost:$DB_PORT"
echo "   🤖 Claude Health:   http://localhost:$CLAUDE_PORT/health"
echo "   📊 Agent Status:    http://localhost:$CLAUDE_PORT/agent/status"
echo ""
echo "📂 Entwicklungsumgebung:"
echo "   Worktree: $WORKTREE_DIR"
echo "   Branch: $BRANCH_NAME"
echo "   Config: $AGENT_CONFIG_TARGET"
if [ -n "$ISSUE_NUMBER" ]; then
    echo "   Issue: #$ISSUE_NUMBER"
fi
echo ""
echo "🔧 Management-Befehle:"
echo "   Status:    docker compose -f $COMPOSE_FILE ps"
echo "   Logs:      docker compose -f $COMPOSE_FILE logs -f"
echo "   Stoppen:   docker compose -f $COMPOSE_FILE down"
echo "   Claude:    docker compose -f $COMPOSE_FILE exec claude-sub-agent$SUB_AGENT_ID claude"
echo ""
echo "📝 Nächste Schritte:"
echo "   1. Öffnen Sie eine neue Claude Code Session im Sub-Agent Worktree:"
echo "      cd $WORKTREE_DIR && claude"
echo "   2. Der Sub-Agent ist bereits mit rollenspezifischen Instruktionen konfiguriert"
echo "   3. Beginnen Sie mit der spezialisierten Entwicklungsarbeit"
echo ""

# Hilfsfunktion für Agent-Spezialisierungen
get_agent_specializations() {
    case $1 in
        "senior-developer")
            echo '["architecture", "performance", "code-review", "mentoring"]'
            ;;
        "ui-developer")
            echo '["react", "tailwind", "responsive-design", "components"]'
            ;;
        "ux-expert")
            echo '["usability", "accessibility", "user-journey", "interaction-design"]'
            ;;
        "test-expert")
            echo '["unit-testing", "integration-testing", "e2e-testing", "automation"]'
            ;;
        "architecture-expert")
            echo '["system-design", "database-design", "scalability", "patterns"]'
            ;;
        "devops-expert")
            echo '["ci-cd", "docker", "infrastructure", "monitoring"]'
            ;;
        *)
            echo '["general-development"]'
            ;;
    esac
}

echo "🚀 Sub-Agent $SUB_AGENT_ID ist bereit für spezialisierte Entwicklungsaufgaben!"