#!/bin/bash

# Automatic Application Status Update Script
# Wird automatisch nach jeder Feature-Implementation ausgeführt

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔄 Automatisches Application Status Update"
echo "=========================================="

# Git-Informationen sammeln
CURRENT_BRANCH=$(git branch --show-current)
LAST_COMMIT=$(git log -1 --pretty=format:"%h - %s")
echo "📍 Branch: $CURRENT_BRANCH"
echo "📝 Letzter Commit: $LAST_COMMIT"

# 1. Vollständige Anwendungsanalyse durchführen
echo ""
echo "🔍 Schritt 1/4: Anwendungsanalyse aktualisieren..."
"$SCRIPT_DIR/analyze-application.sh"

# 2. API-Endpoints aktualisieren (falls Backend-Änderungen)
if git diff HEAD~1 --name-only | grep -q "src/backend.*Controller"; then
    echo ""
    echo "🔌 Schritt 2/4: API-Endpoints aktualisiert erkannt, analysiere..."
    "$SCRIPT_DIR/analyze-api-endpoints.sh" > "$PROJECT_ROOT/docs/API_ENDPOINTS.md" 2>/dev/null || true
else
    echo ""
    echo "🔌 Schritt 2/4: Keine Backend-Änderungen erkannt, überspringe API-Analyse"
fi

# 3. Frontend-Komponenten aktualisieren (falls Frontend-Änderungen)
if git diff HEAD~1 --name-only | grep -q "src/frontend.*\\.tsx"; then
    echo ""
    echo "🎨 Schritt 3/4: Frontend-Komponenten aktualisiert erkannt, analysiere..."
    "$SCRIPT_DIR/analyze-frontend-components.sh" > "$PROJECT_ROOT/docs/FRONTEND_COMPONENTS.md" 2>/dev/null || true
else
    echo ""
    echo "🎨 Schritt 3/4: Keine Frontend-Änderungen erkannt, überspringe Komponenten-Analyse"
fi

# 4. Status-Update mit Metadaten
echo ""
echo "📊 Schritt 4/4: Metadaten hinzufügen..."

# Update-Informationen zu APPLICATION_STATUS.md hinzufügen
cat >> "$PROJECT_ROOT/APPLICATION_STATUS.md" << EOF

---

## 🔄 Update-Historie

### $(date '+%Y-%m-%d %H:%M:%S')
- **Branch:** $CURRENT_BRANCH
- **Commit:** $LAST_COMMIT
- **Trigger:** Automatisches Update nach Feature-Implementation
- **Änderungen erkannt:** $(git diff HEAD~1 --name-only | wc -l) Dateien

EOF

# Git-Status für Entwickler anzeigen
echo ""
echo "📈 Application Status erfolgreich aktualisiert!"
echo "📄 Hauptdatei: APPLICATION_STATUS.md"
echo "📁 Zusätzliche Docs: docs/"
echo ""

# Zeige Statistiken
total_components=$(find "$PROJECT_ROOT/src/frontend" -name "*.tsx" -not -path "*/__tests__/*" | wc -l)
total_controllers=$(find "$PROJECT_ROOT/src/backend" -name "*Controller.cs" | wc -l)
total_routes=$(find "$PROJECT_ROOT/src/frontend/app" -name "page.tsx" | wc -l)

echo "📊 Aktuelle Statistiken:"
echo "   ├── Frontend-Komponenten: $total_components"
echo "   ├── API-Controller: $total_controllers"
echo "   ├── Verfügbare Routen: $total_routes"
echo "   └── Letztes Update: $(date '+%H:%M:%S')"