#!/bin/bash

# Frontend Components Analysis Script
# Detaillierte Analyse aller React-Komponenten mit Props und Usage

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🎨 Frontend Components Analysis"
echo "==============================="

# Funktion zur Analyse einer Komponente
analyze_component() {
    local component_file="$1"
    local rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$component_file")
    local component_name=$(basename "$component_file" .tsx)
    
    echo "## $component_name"
    echo "**File:** \`$rel_path\`"
    echo ""
    
    # Export-Typ ermitteln
    local export_type="Unknown"
    if grep -q "export default" "$component_file"; then
        export_type="Default Export"
    elif grep -q "export const\|export function" "$component_file"; then
        export_type="Named Export"
    fi
    echo "**Export Type:** $export_type"
    
    # Props Interface finden (falls vorhanden)
    local props_interface=$(grep -E "interface.*Props|type.*Props" "$component_file" | head -1 | sed 's/.*\(interface\|type\)[[:space:]]*\([^[:space:]]*\).*/\2/' 2>/dev/null || echo "")
    if [ -n "$props_interface" ]; then
        echo "**Props Interface:** \`$props_interface\`"
    fi
    
    # Dependencies analysieren (Imports)
    echo "**Dependencies:**"
    grep -E "^import.*from" "$component_file" | while read -r import_line; do
        local module=$(echo "$import_line" | sed "s/.*from[[:space:]]*['\"]//;s/['\"].*//")
        echo "- \`$module\`"
    done
    
    # Tests prüfen
    local test_file="${component_file%/*}/__tests__/$(basename "$component_file")"
    test_file="${test_file%.tsx}.test.tsx"
    if [ -f "$test_file" ]; then
        echo "**Tests:** ✅ \`$(realpath --relative-to="$PROJECT_ROOT" "$test_file")\`"
    else
        echo "**Tests:** ❌ Keine Tests gefunden"
    fi
    
    echo ""
}

# Alle Frontend-Komponenten analysieren (ohne Tests)
find "$PROJECT_ROOT/src/frontend" -name "*.tsx" -not -path "*/__tests__/*" -not -path "*/node_modules/*" | \
sort | while read -r component; do
    analyze_component "$component"
done

echo ""
echo "📊 **Statistiken:**"
echo ""

# Komponenten-Statistiken
local total_components=$(find "$PROJECT_ROOT/src/frontend" -name "*.tsx" -not -path "*/__tests__/*" -not -path "*/node_modules/*" | wc -l)
local components_with_tests=$(find "$PROJECT_ROOT/src/frontend" -name "*.test.tsx" | wc -l)
local test_coverage=$((components_with_tests * 100 / total_components))

echo "- **Gesamt Komponenten:** $total_components"
echo "- **Komponenten mit Tests:** $components_with_tests"  
echo "- **Test Coverage:** ${test_coverage}%"
echo ""

# UI-Komponenten vs. Page-Komponenten
local ui_components=$(find "$PROJECT_ROOT/src/frontend" -path "*/components/*" -name "*.tsx" -not -path "*/__tests__/*" | wc -l)
local page_components=$(find "$PROJECT_ROOT/src/frontend" -name "page.tsx" | wc -l)

echo "- **UI-Komponenten:** $ui_components"
echo "- **Seiten-Komponenten:** $page_components"