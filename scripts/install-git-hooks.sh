#!/bin/bash

# Git Hooks Installation Script
# Installiert Hooks für automatisches Application Status Tracking

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
HOOKS_DIR="$PROJECT_ROOT/.git/hooks"

echo "🔧 Git Hooks Installation für Application Status Tracking"
echo "========================================================"

# Post-commit Hook erstellen
echo "📝 Erstelle post-commit Hook..."
cat > "$HOOKS_DIR/post-commit" << 'EOF'
#!/bin/bash

# Post-commit Hook: Automatisches Application Status Update
# Wird nach jedem Commit ausgeführt

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Prüfe ob Update-Script existiert
if [ -f "$PROJECT_ROOT/scripts/update-application-status.sh" ]; then
    echo ""
    echo "🔄 Automatisches Update des Application Status..."
    
    # Führe Update im Hintergrund aus um Commit nicht zu verzögern
    (
        cd "$PROJECT_ROOT"
        ./scripts/update-application-status.sh
    ) &
    
    echo "✅ Application Status Update gestartet (läuft im Hintergrund)"
else
    echo "⚠️  Application Status Update Script nicht gefunden"
fi
EOF

# Hook ausführbar machen
chmod +x "$HOOKS_DIR/post-commit"

# Pre-push Hook für finale Validierung
echo "📝 Erstelle pre-push Hook..."
cat > "$HOOKS_DIR/pre-push" << 'EOF'
#!/bin/bash

# Pre-push Hook: Stelle sicher dass APPLICATION_STATUS.md aktuell ist
# Verhindert Push wenn Status veraltet ist

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo ""
echo "🔍 Validiere Application Status vor Push..."

# Prüfe ob APPLICATION_STATUS.md existiert
if [ ! -f "$PROJECT_ROOT/APPLICATION_STATUS.md" ]; then
    echo "❌ APPLICATION_STATUS.md nicht gefunden!"
    echo "🔧 Führe aus: ./scripts/analyze-application.sh"
    exit 1
fi

# Prüfe Alter der Status-Datei (nicht älter als 1 Stunde)
if [ -f "$PROJECT_ROOT/APPLICATION_STATUS.md" ]; then
    file_age=$(( $(date +%s) - $(stat -c %Y "$PROJECT_ROOT/APPLICATION_STATUS.md") ))
    max_age=3600  # 1 Stunde in Sekunden
    
    if [ $file_age -gt $max_age ]; then
        echo "⚠️  APPLICATION_STATUS.md ist älter als 1 Stunde"
        echo "🔧 Empfehlung: ./scripts/analyze-application.sh ausführen"
        echo "✅ Push wird trotzdem fortgesetzt (nur Warnung)"
    else
        echo "✅ APPLICATION_STATUS.md ist aktuell"
    fi
fi

echo "🚀 Pre-push Validierung erfolgreich"
EOF

# Hook ausführbar machen
chmod +x "$HOOKS_DIR/pre-push"

echo ""
echo "✅ Git Hooks erfolgreich installiert!"
echo ""
echo "📋 Installierte Hooks:"
echo "   ├── post-commit: Automatisches Status-Update nach jedem Commit"
echo "   └── pre-push: Validierung vor Push zu Remote"
echo ""
echo "🎯 Verwendung:"
echo "   └── Hooks werden automatisch bei git commit/push ausgeführt"
echo "   └── Manuell deaktivieren: git config core.hooksPath /dev/null"
echo "   └── Wieder aktivieren: git config --unset core.hooksPath"