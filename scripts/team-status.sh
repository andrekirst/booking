#!/bin/bash

# Claude Code Team Status Dashboard
# Zeigt Status des Sub-Agent Teams im aktuellen Worktree

set -e

echo "🤖 Sub-Agent Team Status Dashboard"
echo "=================================="
echo "Zeitpunkt: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Prüfe ob wir in einem gültigen Worktree sind
if [ ! -d ".git" ] && [ ! -f ".git" ]; then
    echo "❌ Fehler: Nicht in einem Git-Repository"
    echo "   Bitte führen Sie diesen Befehl in einem Agent-Worktree aus"
    exit 1
fi

# Basis-Informationen
WORKTREE_NAME=$(pwd | sed 's|.*/||')
CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || echo 'unknown')
CURRENT_ROLE="Keine aktive Rolle"

if [ -f ".claude/current-role.txt" ]; then
    CURRENT_ROLE=$(cat .claude/current-role.txt)
fi

echo "📂 Worktree Information:"
echo "   Name: $WORKTREE_NAME"  
echo "   Pfad: $(pwd)"
echo "   Branch: $CURRENT_BRANCH"
echo "   Aktuelle Rolle: $CURRENT_ROLE"
echo ""

# Git Status
echo "📊 Git Status:"
if git status --porcelain | grep -q .; then
    echo "   Uncommitted Changes: ✅"
    echo "   Geänderte Dateien:"
    git status --porcelain | head -10 | sed 's/^/     /'
    if [ $(git status --porcelain | wc -l) -gt 10 ]; then
        echo "     ... und $(( $(git status --porcelain | wc -l) - 10 )) weitere"
    fi
else
    echo "   Uncommitted Changes: ❌ (Working Tree Clean)"
fi

# Remote Status
BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")

if [ "$BEHIND" -gt 0 ] || [ "$AHEAD" -gt 0 ]; then
    echo "   Remote Sync: ⚠️  $AHEAD ahead, $BEHIND behind"
else
    echo "   Remote Sync: ✅ Up to date"
fi
echo ""

# Team-Rollen Verfügbarkeit
echo "👥 Verfügbare Team-Rollen:"
echo "=========================="

declare -A ROLE_INFO
ROLE_INFO[senior-developer]="🎯 Senior Developer - Architektur, Code-Reviews"
ROLE_INFO[ui-developer]="🎨 UI Developer - Frontend-Komponenten, Styling"
ROLE_INFO[ux-expert]="👤 UX Expert - User Experience, Accessibility"
ROLE_INFO[test-expert]="🧪 Test Expert - Testing, Qualitätssicherung"
ROLE_INFO[architecture-expert]="🏗️ Architecture Expert - System-Design, Performance"
ROLE_INFO[devops-expert]="⚙️ DevOps Expert - CI/CD, Deployment"

VALID_ROLES=("senior-developer" "ui-developer" "ux-expert" "test-expert" "architecture-expert" "devops-expert")

for role in "${VALID_ROLES[@]}"; do
    config_file="config/sub-agents/CLAUDE-$role.md"
    
    if [ "$role" = "$CURRENT_ROLE" ]; then
        status="✅ AKTIV"
    elif [ -f "$config_file" ]; then
        status="🔄 Verfügbar"
    else
        status="❌ Konfiguration fehlt"
    fi
    
    printf "   %-20s - %s %s\n" "$role" "${ROLE_INFO[$role]}" "$status"
done

echo ""
echo "🔄 Standard-Rolle:"
printf "   %-20s - %s %s\n" "default" "🤖 Standard Multi-Agent - Allgemeine Entwicklung" "🔄 Verfügbar"

# Team-Koordination
echo ""
echo "🤝 Team-Koordination:"
echo "===================="

if [ -f ".claude/team-coordination.md" ]; then
    echo "   Koordinations-File: ✅ Vorhanden"
    
    # Zeige letzte Rolle-Änderung
    if grep -q "Changed:" ".claude/team-coordination.md"; then
        last_change=$(grep "Changed:" ".claude/team-coordination.md" | cut -d' ' -f3-)
        echo "   Letzte Änderung: $last_change"
    fi
    
    # Zeige aktueller Branch aus Koordination
    if grep -q "Branch:" ".claude/team-coordination.md"; then
        coord_branch=$(grep "Branch:" ".claude/team-coordination.md" | cut -d' ' -f3)
        if [ "$coord_branch" != "$CURRENT_BRANCH" ]; then
            echo "   ⚠️  Branch-Mismatch: Koordination zeigt '$coord_branch', aktuell '$CURRENT_BRANCH'"
        fi
    fi
else
    echo "   Koordinations-File: ❌ Nicht vorhanden"
    echo "   Wird bei nächstem Rolle-Wechsel erstellt"
fi

# Backup-Status
echo ""
echo "💾 Backup-Status:"
echo "================"

if [ -d ".claude" ]; then
    backup_count=$(ls .claude/CLAUDE-backup-*.md 2>/dev/null | wc -l || echo "0")
    if [ "$backup_count" -gt 0 ]; then
        echo "   Rolle-Backups: $backup_count verfügbar"
        echo "   Backups:"
        ls .claude/CLAUDE-backup-*.md 2>/dev/null | sed 's|.claude/CLAUDE-backup-||g' | sed 's|.md||g' | sed 's/^/     - /' || true
    else
        echo "   Rolle-Backups: Keine vorhanden"
    fi
else
    echo "   .claude Verzeichnis: ❌ Nicht vorhanden"
fi

# CLAUDE.md Status
echo ""
echo "📄 CLAUDE.md Status:"
echo "==================="

if [ -f "CLAUDE.md" ]; then
    echo "   CLAUDE.md: ✅ Vorhanden"
    
    # Prüfe ob es eine rollenspezifische Version ist
    if grep -q "Agent Instructions" "CLAUDE.md"; then
        detected_role=$(head -1 "CLAUDE.md" | sed 's/# //g' | sed 's/ Agent Instructions//g' | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g')
        if [ "$detected_role" = "$CURRENT_ROLE" ]; then
            echo "   Rolle-Match: ✅ Konfiguration passt zur aktuellen Rolle"
        else
            echo "   Rolle-Match: ⚠️  Konfiguration für '$detected_role', aktuelle Rolle '$CURRENT_ROLE'"
        fi
    else
        echo "   Typ: Standard-Konfiguration"
    fi
    
    # Zeige Dateigröße und letzte Änderung
    file_size=$(wc -c < "CLAUDE.md")
    file_date=$(stat -c %Y "CLAUDE.md" 2>/dev/null | xargs -I {} date -d @{} '+%Y-%m-%d %H:%M' || echo "unknown")
    echo "   Größe: $file_size Bytes"
    echo "   Geändert: $file_date"
else
    echo "   CLAUDE.md: ❌ Nicht vorhanden"
    echo "   Verwenden Sie: ./scripts/switch-role.sh <rolle>"
fi

# Service-URLs (falls in Standard Multi-Agent Umgebung)
echo ""
echo "🌐 Service-URLs (falls Multi-Agent aktiv):"
echo "=========================================="

# Ermittle Agent-Nummer aus Worktree-Namen
if [[ $WORKTREE_NAME =~ booking-agent([2-4]) ]]; then
    AGENT_NUMBER="${BASH_REMATCH[1]}"
    BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
    FRONTEND_PORT=$((BASE_PORT + 1))
    BACKEND_PORT=$((BASE_PORT + 2))
    DB_PORT=$((BASE_PORT + 3))
    
    echo "   Agent: $AGENT_NUMBER"
    echo "   Frontend: http://localhost:$FRONTEND_PORT"
    echo "   Backend:  http://localhost:$BACKEND_PORT"
    echo "   Database: localhost:$DB_PORT"
    
    # Prüfe ob Services laufen
    if curl -s --max-time 2 "http://localhost:$FRONTEND_PORT" > /dev/null 2>&1; then
        echo "   Status: ✅ Services laufen"
    else  
        echo "   Status: ❌ Services nicht erreichbar"
        echo "   Starten mit: ./scripts/start-agent.sh $AGENT_NUMBER $CURRENT_BRANCH"
    fi
else
    echo "   Nicht in Standard Multi-Agent Worktree"
fi

# Management-Befehle
echo ""
echo "🔧 Management-Befehle:"
echo "===================="
echo "   Rolle wechseln:        ./scripts/switch-role.sh <rolle>"
echo "   Standard wiederherstellen: ./scripts/switch-role.sh default"
echo "   Verfügbare Rollen:     ./scripts/switch-role.sh senior-developer --info"
echo "   Team-Status:           ./scripts/team-status.sh"
echo ""

# Empfehlungen basierend auf aktuellem Status
echo "💡 Empfehlungen:"
echo "==============="

if [ "$CURRENT_ROLE" = "Keine aktive Rolle" ]; then
    echo "   - Wähle eine Rolle: ./scripts/switch-role.sh senior-developer"
    echo "   - Oder verwende Standard: ./scripts/switch-role.sh default"
fi

if git status --porcelain | grep -q .; then
    echo "   - Committe deine Änderungen vor Rolle-Wechsel"
fi

if [ "$BEHIND" -gt 0 ]; then
    echo "   - Update Branch: git pull origin $CURRENT_BRANCH"
fi

echo ""
echo "🔄 Letztes Update: $(date '+%H:%M:%S')"