#!/bin/bash

# Claude Code Role Switcher
# Wechselt zwischen Sub-Agent Rollen im aktuellen Worktree

set -e

# Parameter validation
if [ $# -lt 1 ]; then
    echo "❌ Fehler: Rolle erforderlich"
    echo ""
    echo "Usage: $0 <ROLE> [--info]"
    echo ""
    echo "Verfügbare Rollen:"
    echo "  senior-developer    - Architektur, Code-Reviews, komplexe Problemlösungen"
    echo "  ui-developer        - Frontend-Komponenten, Styling, User Interface"
    echo "  ux-expert          - User Experience, Usability, Accessibility"
    echo "  test-expert        - Test-Strategien, Unit/Integration/E2E Tests"
    echo "  architecture-expert - System-Design, Performance, Skalierbarkeit"
    echo "  devops-expert      - CI/CD, Deployment, Infrastructure"
    echo "  default            - Standard Multi-Agent Rolle"
    echo ""
    echo "Optionen:"
    echo "  --info             - Zeigt nur Rollen-Informationen ohne Wechsel"
    echo ""
    echo "Beispiele:"
    echo "  $0 senior-developer"
    echo "  $0 ui-developer --info"
    echo "  $0 default"
    echo ""
    exit 1
fi

ROLE=$1
INFO_ONLY=${2:-""}

# Validiere Rolle
VALID_ROLES=("senior-developer" "ui-developer" "ux-expert" "test-expert" "architecture-expert" "devops-expert" "default")
if [[ ! " ${VALID_ROLES[@]} " =~ " ${ROLE} " ]]; then
    echo "❌ Fehler: Ungültige Rolle '$ROLE'"
    echo "   Gültige Rollen: ${VALID_ROLES[*]}"
    exit 1
fi

# Rolle-Informationen
declare -A ROLE_INFO
ROLE_INFO[senior-developer]="🎯 Senior Developer - Architektur, Code-Reviews, komplexe Problemlösungen"
ROLE_INFO[ui-developer]="🎨 UI Developer - Frontend-Komponenten, Styling, User Interface"  
ROLE_INFO[ux-expert]="👤 UX Expert - User Experience, Usability, Accessibility"
ROLE_INFO[test-expert]="🧪 Test Expert - Test-Strategien, Unit/Integration/E2E Tests"
ROLE_INFO[architecture-expert]="🏗️ Architecture Expert - System-Design, Performance, Skalierbarkeit"
ROLE_INFO[devops-expert]="⚙️ DevOps Expert - CI/CD, Deployment, Infrastructure"
ROLE_INFO[default]="🤖 Standard Multi-Agent - Allgemeine Entwicklungsaufgaben"

declare -A ROLE_SPECIALIZATIONS
ROLE_SPECIALIZATIONS[senior-developer]="Architecture Design, Performance Optimization, Code Quality, Technical Leadership"
ROLE_SPECIALIZATIONS[ui-developer]="React/Next.js, Tailwind CSS, Component Libraries, Responsive Design"
ROLE_SPECIALIZATIONS[ux-expert]="User Research, Accessibility (WCAG), Interaction Design, Usability Testing"
ROLE_SPECIALIZATIONS[test-expert]="Unit Testing (Jest/xUnit), Integration Testing, E2E Testing (Playwright), Test Automation"
ROLE_SPECIALIZATIONS[architecture-expert]="System Architecture, Database Design, Event Sourcing, Scalability Patterns"
ROLE_SPECIALIZATIONS[devops-expert]="CI/CD Pipelines, Docker, Infrastructure as Code, Monitoring & Observability"
ROLE_SPECIALIZATIONS[default]="Full-Stack Development, General Programming, Feature Implementation"

# Info-Modus
if [ "$INFO_ONLY" = "--info" ]; then
    echo "${ROLE_INFO[$ROLE]}"
    echo ""
    echo "🔧 Spezialisierung:"
    echo "   ${ROLE_SPECIALIZATIONS[$ROLE]}"
    echo ""
    
    if [ "$ROLE" != "default" ]; then
        config_file="CLAUDE-$ROLE.md"
        if [ -f "$config_file" ]; then
            echo "📄 Konfiguration: $config_file ✅"
        else
            echo "📄 Konfiguration: $config_file ❌ (nicht gefunden)"
        fi
    fi
    
    exit 0
fi

# Prüfe ob wir in einem gültigen Worktree sind
if [ ! -d ".git" ] && [ ! -f ".git" ]; then
    echo "❌ Fehler: Nicht in einem Git-Repository"
    echo "   Bitte führen Sie diesen Befehl in einem Agent-Worktree aus"
    exit 1
fi

# Erstelle .claude Verzeichnis falls nicht vorhanden
mkdir -p .claude

# Aktuelle Rolle ermitteln
CURRENT_ROLE="unknown"
if [ -f ".claude/current-role.txt" ]; then
    CURRENT_ROLE=$(cat .claude/current-role.txt)
fi

echo "🎭 Claude Code Rolle-Wechsel"
echo "============================"
echo "Worktree: $(pwd | sed 's|.*/||')"
echo "Aktuell: $CURRENT_ROLE"
echo "Neu: $ROLE"
echo ""

# Backup der aktuellen CLAUDE.md falls vorhanden
if [ -f "CLAUDE.md" ] && [ "$CURRENT_ROLE" != "unknown" ]; then
    echo "💾 Sichere aktuelle Konfiguration..."
    cp "CLAUDE.md" ".claude/CLAUDE-backup-$CURRENT_ROLE.md"
fi

# Wechsel zur neuen Rolle
if [ "$ROLE" = "default" ]; then
    # Verwende Original CLAUDE.md aus Haupt-Repository
    if [ -f "../booking/CLAUDE.md" ]; then
        cp "../booking/CLAUDE.md" "CLAUDE.md"
        echo "✅ Standard-Konfiguration wiederhergestellt"
    else
        echo "⚠️  Standard CLAUDE.md nicht gefunden, verwende generische Konfiguration"
        cat > "CLAUDE.md" << 'EOF'
# Standard Multi-Agent Instructions

Du bist ein Software-Entwicklungsagent für das Booking-System.

## Technologie-Stack
- .NET 9 Backend mit Clean Architecture
- Next.js 15 Frontend mit TypeScript
- PostgreSQL Database mit Entity Framework Core
- Tailwind CSS für Styling
- Docker für Containerization

## Entwicklungsansatz
- Qualität über Geschwindigkeit
- Best Practices befolgen
- Dokumentierte und wartbare Lösungen
- Test-driven Development
- Kontinuierliche Verbesserung
EOF
    fi
else
    # Verwende rollenspezifische Konfiguration
    config_file="config/sub-agents/CLAUDE-$ROLE.md"
    
    if [ -f "$config_file" ]; then
        cp "$config_file" "CLAUDE.md"
        echo "✅ Rollenspezifische Konfiguration geladen: $config_file"
    else
        echo "⚠️  Rollenspezifische Konfiguration nicht gefunden: $config_file"
        echo "   Verwende Basis-Konfiguration mit Rollen-Header"
        
        cat > "CLAUDE.md" << EOF
# $ROLE Agent Instructions

${ROLE_INFO[$ROLE]}

## Spezialisierung
${ROLE_SPECIALIZATIONS[$ROLE]}

## Entwicklungskontext
- Projekt: Booking System (Garten-Buchungsplattform)
- Technologie: .NET 9 Backend, Next.js 15 Frontend
- Datenbank: PostgreSQL mit Entity Framework Core
- Styling: Tailwind CSS
- Containerization: Docker

## Rolle-spezifische Hinweise
Je nach Rolle fokussiere dich auf deine Kernkompetenzen und arbeite eng mit anderen Team-Mitgliedern zusammen.
EOF
    fi
fi

# Speichere neue Rolle
echo "$ROLE" > .claude/current-role.txt

# Setze Environment Variable
export CLAUDE_ROLE=$ROLE

# Update Team-Koordination
cat > ".claude/team-coordination.md" << EOF
# Team Coordination

## Current Session
- Role: $ROLE
- Changed: $(date)
- Worktree: $(pwd | sed 's|.*/||')
- Branch: $(git branch --show-current 2>/dev/null || echo 'unknown')

## Role Details
${ROLE_INFO[$ROLE]}

Specializations: ${ROLE_SPECIALIZATIONS[$ROLE]}

## Collaboration
- Work in same codebase with clear role separation
- Coordinate through Git branches and commits
- Focus on your role's expertise while understanding the full context
EOF

echo ""
echo "🎉 Rolle erfolgreich gewechselt!"
echo "================================"
echo ""
echo "${ROLE_INFO[$ROLE]}"
echo ""
echo "🔧 Spezialisierung:"
echo "   ${ROLE_SPECIALIZATIONS[$ROLE]}"
echo ""
echo "📂 Konfiguration:"
echo "   CLAUDE.md wurde aktualisiert"
echo "   Team-Koordination: .claude/team-coordination.md"
echo "   Aktuelle Rolle: .claude/current-role.txt"
echo ""
echo "💡 Nächste Schritte:"
echo "   1. Starte eine neue Claude Code Session für optimale Rolle-Integration:"
echo "      claude"
echo "   2. Die rollenspezifischen Instruktionen sind jetzt aktiv"
echo "   3. Fokussiere dich auf deine Rolle, aber arbeite im Team"
echo ""
echo "🔄 Rolle wechseln: ./scripts/switch-role.sh <andere-rolle>"
echo "📊 Team-Status: ./scripts/team-status.sh"

# Zeige verfügbare Team-Mitglieder falls mehrere Rollen-Files vorhanden
echo ""
echo "👥 Verfügbare Team-Rollen:"
for role in "${VALID_ROLES[@]}"; do
    if [ "$role" = "$ROLE" ]; then
        echo "   $role - ${ROLE_INFO[$role]} ✅ (AKTIV)"
    else
        if [ "$role" = "default" ] || [ -f "config/sub-agents/CLAUDE-$role.md" ]; then
            echo "   $role - ${ROLE_INFO[$role]}"
        else
            echo "   $role - ${ROLE_INFO[$role]} (Konfiguration fehlt)"
        fi
    fi
done