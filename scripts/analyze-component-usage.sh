#!/bin/bash

# Component Usage Analysis Script
# Findet wo Komponenten verwendet werden

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔍 Component Usage Analysis"
echo "==========================="

# Funktion zur Analyse der Komponenten-Verwendung
analyze_component_usage() {
    local component_name="$1"
    local component_file="$2"
    
    echo "## $component_name"
    echo "**File:** \`$(realpath --relative-to="$PROJECT_ROOT" "$component_file")\`"
    echo ""
    
    # Suche nach Verwendungen der Komponente
    local usage_count=0
    echo "**Verwendungen:**"
    
    # Suche in allen TSX/TS Dateien nach Importen und Verwendungen
    find "$PROJECT_ROOT/src" -name "*.tsx" -o -name "*.ts" | grep -v "$component_file" | \
    while read -r file; do
        # Prüfe auf Import
        if grep -q "import.*$component_name" "$file" 2>/dev/null; then
            rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
            echo "- **Import in:** \`$rel_path\`"
            ((usage_count++))
        fi
        
        # Prüfe auf JSX-Verwendung
        if grep -q "<$component_name" "$file" 2>/dev/null; then
            rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
            usage_instances=$(grep -c "<$component_name" "$file" 2>/dev/null || echo "0")
            echo "- **Verwendet in:** \`$rel_path\` ($usage_instances Mal)"
            ((usage_count++))
        fi
    done
    
    if [ $usage_count -eq 0 ]; then
        echo "- ❌ Keine Verwendungen gefunden"
    fi
    
    echo ""
}

# Hauptkomponenten analysieren (wichtigste UI-Komponenten)
declare -a important_components=(
    "BookingCalendarView"
    "BookingListView" 
    "BookingForm"
    "CreateBookingButton"
    "UserMenuDropdown"
    "ConfirmationModal"
    "BookingStatusFilter"
    "TimeRangeFilter"
    "SleepingAccommodationsTable"
)

for comp in "${important_components[@]}"; do
    # Finde die Komponenten-Datei
    comp_file=$(find "$PROJECT_ROOT/src" -name "*.tsx" -exec grep -l "export.*$comp" {} \; 2>/dev/null | head -1)
    
    if [ -n "$comp_file" ]; then
        analyze_component_usage "$comp" "$comp_file"
    else
        echo "## $comp"
        echo "❌ **Komponente nicht gefunden**"
        echo ""
    fi
done

echo "---"
echo ""
echo "📊 **Gesamt-Statistiken:**"
echo "- **Analysierte Komponenten:** ${#important_components[@]}"
echo "- **Analyse-Zeitpunkt:** $(date '+%Y-%m-%d %H:%M:%S')"