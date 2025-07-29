#!/bin/bash

# API Endpoints Analysis Script
# Detaillierte Analyse aller API-Endpoints mit Parametern und Responses

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🔌 API Endpoints Analysis"
echo "========================"

# Funktion zur Analyse eines Controllers
analyze_controller() {
    local controller_file="$1"
    local controller_name=$(basename "$controller_file" .cs)
    
    echo "## $controller_name"
    echo ""
    
    # Base Route extrahieren
    local base_route=$(grep -E '\[Route\(' "$controller_file" | head -1 | sed 's/.*Route("\([^"]*\)".*/\1/' 2>/dev/null || echo "")
    if [ -n "$base_route" ]; then
        echo "**Base Route:** \`$base_route\`"
        echo ""
    fi
    
    # Alle HTTP-Methoden finden und analysieren
    local line_num=1
    while IFS= read -r line; do
        if echo "$line" | grep -qE '\[Http(Get|Post|Put|Delete)'; then
            # HTTP-Methode extrahieren
            local method=$(echo "$line" | sed 's/.*\[Http\([^]]*\).*/\1/' | tr '[:lower:]' '[:upper:]')
            local route_param=$(echo "$line" | sed 's/.*("\([^"]*\)".*/\1/' 2>/dev/null || echo "")
            
            # Nächste Zeile für Methodensignatur lesen
            local next_line=$(sed -n "$((line_num + 1))p" "$controller_file")
            local method_name=$(echo "$next_line" | grep -oE 'public.*\(' | sed 's/public[[:space:]]*async[[:space:]]*Task[^[:space:]]*[[:space:]]*\([^(]*\).*/\1/')
            
            if [ -n "$route_param" ]; then
                echo "### $method \`$base_route/$route_param\`"
            else
                echo "### $method \`$base_route\`"
            fi
            
            if [ -n "$method_name" ]; then
                echo "**Method:** \`$method_name\`"
            fi
            
            # Parameter analysieren (grober Ansatz)
            local params=$(echo "$next_line" | grep -oE '\([^)]*\)' | tr -d '()')
            if [ -n "$params" ] && [ "$params" != "" ]; then
                echo "**Parameters:** \`$params\`"
            fi
            
            echo ""
        fi
        ((line_num++))
    done < "$controller_file"
    
    echo ""
}

# Alle Controller analysieren
find "$PROJECT_ROOT/src/backend" -name "*Controller.cs" | sort | while read -r controller; do
    analyze_controller "$controller"
done