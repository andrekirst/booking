#!/bin/bash

# Sub-Agents Setup Script für Booking-Projekt
# Installiert und konfiguriert alle Sub-Agents für Claude Code

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
AGENTS_DIR="$PROJECT_ROOT/.claude/agents"

echo "🤖 Sub-Agents Setup für Booking-Projekt"
echo "========================================"

# Funktionen
log_info() {
    echo "ℹ️  $1"
}

log_success() {
    echo "✅ $1"
}

log_error() {
    echo "❌ $1"
    exit 1
}

# Verzeichnisse prüfen
if [ ! -d "$AGENTS_DIR" ]; then
    log_error "Agents-Verzeichnis nicht gefunden: $AGENTS_DIR"
fi

# Claude Code Installation prüfen
if ! command -v claude &> /dev/null; then
    log_error "Claude Code nicht installiert. Installiere zuerst Claude Code."
fi

# Agent-Dateien prüfen
log_info "Prüfe Agent-Definitionen..."
AGENTS=(
    "backend-architect"
    "frontend-developer"
    "sql-pro"
    "security-auditor"
    "deployment-engineer"
    "code-reviewer"
    "test-automator"
    "performance-engineer"
    "devops-troubleshooter"
    "api-documenter"
)

for agent in "${AGENTS[@]}"; do
    if [ -f "$AGENTS_DIR/${agent}.md" ]; then
        log_success "Agent gefunden: $agent"
    else
        log_error "Agent-Definition fehlt: $AGENTS_DIR/${agent}.md"
    fi
done

# Agent-Konfiguration prüfen
if [ -f "$AGENTS_DIR/agents.json" ]; then
    log_success "Agent-Konfiguration gefunden"
else
    log_error "Agent-Konfiguration fehlt: $AGENTS_DIR/agents.json"
fi

# Claude Settings prüfen/erstellen
CLAUDE_SETTINGS_DIR="$PROJECT_ROOT/.claude"
if [ ! -f "$CLAUDE_SETTINGS_DIR/settings.json" ]; then
    log_info "Erstelle Claude Settings..."
    cat > "$CLAUDE_SETTINGS_DIR/settings.json" << 'EOF'
{
  "agents": {
    "enabled": true,
    "directory": ".claude/agents",
    "auto_load": true,
    "coordination": {
      "enable_multi_agent": true,
      "conflict_resolution": "priority_based",
      "communication_protocol": "claude_md"
    }
  },
  "project": {
    "name": "booking-agent4",
    "tech_stack": [".NET 9", "Next.js", "PostgreSQL", "Docker"],
    "platform": "Raspberry Pi Zero 2 W",
    "language": "deutsch"
  }
}
EOF
    log_success "Claude Settings erstellt"
fi

# Agents-Liste ausgeben
echo ""
log_info "Verfügbare Sub-Agents:"
echo "======================"

for agent in "${AGENTS[@]}"; do
    if [ -f "$AGENTS_DIR/${agent}.md" ]; then
        description=$(grep "^description:" "$AGENTS_DIR/${agent}.md" | cut -d: -f2- | xargs)
        model=$(grep "^model:" "$AGENTS_DIR/${agent}.md" | cut -d: -f2 | xargs)
        echo "📋 $agent ($model)"
        echo "   $description"
        echo ""
    fi
done

# Usage Instructions
echo "🚀 Setup abgeschlossen!"
echo "======================"
echo ""
echo "So verwendest du die Sub-Agents:"
echo ""
echo "1. Starte Claude Code in deinem Projekt:"
echo "   claude"
echo ""
echo "2. Verwende Agents direkt:"
echo "   'Als backend-architect: Entwerfe API für Buchungs-Verfügbarkeit'"
echo "   'Als frontend-developer: Erstelle Kalender-Komponente'"
echo "   'Als security-auditor: Überprüfe JWT-Implementation'"
echo ""
echo "3. Multi-Agent Workflows:"
echo "   'Verwende feature-development Workflow für neue Buchungs-Features'"
echo "   'Starte bug-fix Workflow für Performance-Problem'"
echo ""
echo "4. Agent-Koordination:"
echo "   Agents koordinieren automatisch basierend auf agents.json"
echo "   Konflikte werden über Priority (1=highest) gelöst"
echo ""
echo "📖 Weitere Infos in: docs/SUB_AGENTS_ANALYSIS.md"

log_success "Sub-Agents Setup erfolgreich abgeschlossen!"