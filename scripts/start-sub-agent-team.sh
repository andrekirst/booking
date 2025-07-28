#!/bin/bash

# Claude Code Sub-Agent Team Starter
# Startet Standard Agent mit Sub-Agent Team-Support

set -e

# Parameter validation
if [ $# -lt 2 ]; then
    echo "❌ Fehler: Unvollständige Parameter"
    echo ""
    echo "Usage: $0 <AGENT_NUMBER> <BRANCH_NAME> [SUB_AGENT_ROLES] [ISSUE_NUMBER]"
    echo ""
    echo "Sub-Agent Roles (optional): Komma-getrennte Liste von Rollen"
    echo "  Verfügbare Rollen: senior-developer, ui-developer, ux-expert,"
    echo "                     test-expert, architecture-expert, devops-expert"
    echo ""
    echo "Beispiele:"
    echo "  $0 4 feat/75-complex-feature"
    echo "  $0 4 feat/75-complex-feature \"senior-developer,ui-developer,test-expert\""
    echo "  $0 4 feat/75-complex-feature \"senior-developer,ui-developer\" 75"
    echo ""
    echo "Vordefinierte Team-Patterns:"
    echo "  full-stack:     senior-developer,ui-developer,test-expert,devops-expert"
    echo "  frontend-focus: ui-developer,ux-expert,test-expert"
    echo "  backend-focus:  senior-developer,architecture-expert,test-expert"
    echo "  performance:    senior-developer,architecture-expert,devops-expert"
    echo ""
    exit 1
fi

AGENT_NUMBER=$1
BRANCH_NAME=$2
SUB_AGENT_ROLES=${3:-""}
ISSUE_NUMBER=${4:-""}

# Validierung Agent-Nummer
if [[ ! $AGENT_NUMBER =~ ^[2-4]$ ]]; then
    echo "❌ Fehler: AGENT_NUMBER muss 2, 3 oder 4 sein"
    exit 1
fi

# Expandiere vordefinierte Patterns
case $SUB_AGENT_ROLES in
    "full-stack")
        SUB_AGENT_ROLES="senior-developer,ui-developer,test-expert,devops-expert"
        ;;
    "frontend-focus")
        SUB_AGENT_ROLES="ui-developer,ux-expert,test-expert"
        ;;
    "backend-focus")
        SUB_AGENT_ROLES="senior-developer,architecture-expert,test-expert"
        ;;
    "performance")
        SUB_AGENT_ROLES="senior-developer,architecture-expert,devops-expert"
        ;;
esac

WORKTREE_DIR="../booking-agent$AGENT_NUMBER"

echo "🤖 Sub-Agent Team Setup"
echo "======================="
echo "Agent: $AGENT_NUMBER"
echo "Branch: $BRANCH_NAME"
echo "Worktree: $WORKTREE_DIR"
if [ -n "$SUB_AGENT_ROLES" ]; then
    echo "Team-Rollen: $SUB_AGENT_ROLES"
fi
if [ -n "$ISSUE_NUMBER" ]; then
    echo "Issue: #$ISSUE_NUMBER"
fi
echo ""

# Starte Standard Multi-Agent
echo "🚀 Starte Standard Multi-Agent..."
if [ -n "$ISSUE_NUMBER" ]; then
    ./scripts/start-agent.sh "$AGENT_NUMBER" "$BRANCH_NAME" "$ISSUE_NUMBER"
else
    ./scripts/start-agent.sh "$AGENT_NUMBER" "$BRANCH_NAME"
fi

echo ""
echo "🎭 Setup Sub-Agent Team-Rollen..."

# Wechsle zum Worktree
if [ ! -d "$WORKTREE_DIR" ]; then
    echo "❌ Fehler: Worktree nicht gefunden: $WORKTREE_DIR"
    echo "   Standard Agent Start möglicherweise fehlgeschlagen"
    exit 1
fi

cd "$WORKTREE_DIR"

# Erstelle .claude Verzeichnis
mkdir -p .claude

# Setup Team-Koordination
cat > ".claude/team-coordination.md" << EOF
# Sub-Agent Team Coordination

## Team Setup
- Created: $(date)
- Agent: $AGENT_NUMBER
- Branch: $BRANCH_NAME
- Issue: ${ISSUE_NUMBER:-"N/A"}

## Team Composition
$(if [ -n "$SUB_AGENT_ROLES" ]; then
    IFS=',' read -ra ROLES <<< "$SUB_AGENT_ROLES"
    for role in "${ROLES[@]}"; do
        case $role in
            senior-developer) echo "- **Senior Developer**: Architektur-Lead, Code-Reviews, komplexe Problemlösungen" ;;
            ui-developer) echo "- **UI Developer**: Frontend-Komponenten, Styling, User Interface" ;;
            ux-expert) echo "- **UX Expert**: User Experience, Usability, Accessibility" ;;
            test-expert) echo "- **Test Expert**: Test-Strategien, Qualitätssicherung, Automation" ;;
            architecture-expert) echo "- **Architecture Expert**: System-Design, Performance, Skalierbarkeit" ;;
            devops-expert) echo "- **DevOps Expert**: CI/CD, Deployment, Infrastructure" ;;
        esac
    done
else
    echo "- Standard Multi-Agent Konfiguration"
fi)

## Workflow
1. **Role Selection**: Use \`./scripts/switch-role.sh <role>\` to switch between team roles
2. **Coordination**: Team members work in same codebase with role-specific focus
3. **Integration**: Regular commits and pull requests for coordination
4. **Quality**: Code reviews and testing by appropriate specialists

## Commands
- Switch Role: \`./scripts/switch-role.sh <role>\`
- Team Status: \`./scripts/team-status.sh\`
- Available Roles: \`./scripts/switch-role.sh <role> --info\`
EOF

# Erstelle Team-Roles-Referenz
if [ -n "$SUB_AGENT_ROLES" ]; then
    echo "$SUB_AGENT_ROLES" > .claude/team-roles.txt
    
    echo "✅ Team-Rollen konfiguriert:"
    IFS=',' read -ra ROLES <<< "$SUB_AGENT_ROLES"
    for role in "${ROLES[@]}"; do
        echo "   - $role"
        
        # Prüfe ob Rollen-Konfiguration existiert
        config_file="config/sub-agents/CLAUDE-$role.md"
        if [ -f "$config_file" ]; then
            echo "     ✅ Konfiguration verfügbar"
        else
            echo "     ⚠️  Konfiguration fehlt: $config_file"
        fi
    done
else
    echo "ℹ️  Keine spezifischen Team-Rollen konfiguriert"
    echo "   Verwenden Sie: ./scripts/switch-role.sh <rolle>"
fi

# Setze Standard-Rolle falls Team-Rollen definiert sind
if [ -n "$SUB_AGENT_ROLES" ]; then
    IFS=',' read -ra ROLES <<< "$SUB_AGENT_ROLES"
    FIRST_ROLE="${ROLES[0]}"
    
    echo ""
    echo "🎯 Setze Standard-Rolle: $FIRST_ROLE"
    ./scripts/switch-role.sh "$FIRST_ROLE" > /dev/null 2>&1 || {
        echo "⚠️  Konnte Standard-Rolle nicht setzen, verwende default"
        ./scripts/switch-role.sh default > /dev/null 2>&1
    }
fi

# Zeige finale Informationen
echo ""
echo "🎉 Sub-Agent Team erfolgreich eingerichtet!"
echo "=========================================="
echo ""

# Service URLs
BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
FRONTEND_PORT=$((BASE_PORT + 1))
BACKEND_PORT=$((BASE_PORT + 2))
DB_PORT=$((BASE_PORT + 3))

echo "🌐 Service URLs:"
echo "   Frontend: http://localhost:$FRONTEND_PORT"
echo "   Backend:  http://localhost:$BACKEND_PORT"
echo "   Database: localhost:$DB_PORT"
echo ""

echo "📂 Team Workspace:"
echo "   Worktree: $WORKTREE_DIR"
echo "   Branch: $BRANCH_NAME"
echo "   Koordination: .claude/team-coordination.md"
echo ""

echo "🎭 Team-Management:"
if [ -n "$SUB_AGENT_ROLES" ]; then
    echo "   Verfügbare Rollen:"
    IFS=',' read -ra ROLES <<< "$SUB_AGENT_ROLES"
    for role in "${ROLES[@]}"; do
        echo "     - $role"
    done
    echo ""
    
    CURRENT_ROLE="unknown"
    if [ -f ".claude/current-role.txt" ]; then
        CURRENT_ROLE=$(cat .claude/current-role.txt)
    fi
    echo "   Aktuelle Rolle: $CURRENT_ROLE"
else
    echo "   Standard Multi-Agent Konfiguration"
fi

echo ""
echo "🔧 Nächste Schritte:"
echo "   1. Wechsle in das Team-Worktree:"
echo "      cd $WORKTREE_DIR"
echo ""
if [ -n "$SUB_AGENT_ROLES" ]; then
    echo "   2. Wähle eine Team-Rolle:"
    IFS=',' read -ra ROLES <<< "$SUB_AGENT_ROLES"
    for role in "${ROLES[@]}"; do
        echo "      ./scripts/switch-role.sh $role"
    done
    echo ""
    echo "   3. Starte Claude Code Session für gewählte Rolle:"
    echo "      claude"
    echo ""
    echo "   4. Arbeite mit rollenspezifischem Fokus im Team"
else
    echo "   2. Optional: Wähle eine spezialisierte Rolle:"
    echo "      ./scripts/switch-role.sh senior-developer"
    echo ""
    echo "   3. Starte Claude Code Session:"
    echo "      claude"
fi

echo ""
echo "📊 Team-Status anzeigen: ./scripts/team-status.sh"
echo "🔄 Rolle wechseln: ./scripts/switch-role.sh <rolle>"

echo ""
echo "✨ Multi-Agent Team bereit für kollaborative Entwicklung!"