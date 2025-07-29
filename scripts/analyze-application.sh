#!/bin/bash

# Application Status Analysis Script
# Automatische Analyse der Anwendungsstruktur für besseres Context-Management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_FILE="$PROJECT_ROOT/APPLICATION_STATUS.md"

echo "🔍 Analysiere Anwendungsstruktur..."
echo "📁 Projekt-Root: $PROJECT_ROOT"
echo "📄 Output: $OUTPUT_FILE"

# Header für APPLICATION_STATUS.md
cat > "$OUTPUT_FILE" << EOF
# Application Status Report

> 🤖 Automatisch generiert am $(date '+%Y-%m-%d %H:%M:%S')
> 
> Dieses Dokument bietet eine vollständige Übersicht über den aktuellen Stand der Booking-Anwendung.

## 📊 Übersicht

### Projektstruktur
```
booking/
├── src/
│   ├── backend/           # .NET 9 API
│   └── frontend/          # Next.js Frontend
├── scripts/               # Automation Scripts
└── docs/                  # Dokumentation
```

EOF

# Frontend-Komponenten analysieren
echo "🔍 Analysiere Frontend-Komponenten..."
cat >> "$OUTPUT_FILE" << 'EOF'

## 🎨 Frontend-Komponenten

### React-Komponenten
EOF

# Finde alle Frontend-Komponenten
find "$PROJECT_ROOT/src/frontend" -name "*.tsx" -not -path "*/node_modules/*" -not -path "*/__tests__/*" | \
while read -r file; do
    rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
    component_name=$(basename "$file" .tsx)
    
    # Extrahiere Export-Name falls verfügbar
    export_name=$(grep -E "^export (default |const |function )" "$file" | head -1 | sed 's/^export[[:space:]]*//' | cut -d' ' -f2 | cut -d'(' -f1 || echo "$component_name")
    
    echo "- **$export_name** - \`$rel_path\`" >> "$OUTPUT_FILE"
done

# Seiten/Routen analysieren
echo "🔍 Analysiere Next.js Routen..."
cat >> "$OUTPUT_FILE" << 'EOF'

### 🌐 Verfügbare Routen
EOF

find "$PROJECT_ROOT/src/frontend/app" -name "page.tsx" | \
while read -r file; do
    # Konvertiere Dateipfad zu Route
    route_path=$(dirname "$file" | sed "s|$PROJECT_ROOT/src/frontend/app||" | sed 's|\[|\:|g' | sed 's|\]||g')
    if [ "$route_path" = "" ]; then
        route_path="/"
    fi
    
    rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
    echo "- **$route_path** - \`$rel_path\`" >> "$OUTPUT_FILE"
done

# API-Endpoints analysieren
echo "🔍 Analysiere API-Endpoints..."
cat >> "$OUTPUT_FILE" << 'EOF'

## 🔌 API-Endpoints

### Backend-Controller
EOF

find "$PROJECT_ROOT/src/backend" -name "*Controller.cs" | \
while read -r file; do
    controller_name=$(basename "$file" .cs)
    rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
    
    echo "#### $controller_name" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # Extrahiere Route-Attribute
    base_route=$(grep -E '\[Route\(' "$file" | head -1 | sed 's/.*Route("\([^"]*\)".*/\1/' || echo "")
    
    if [ -n "$base_route" ]; then
        echo "**Base Route:** \`$base_route\`" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
    fi
    
    # Extrahiere HTTP-Methoden
    echo "**Endpoints:**" >> "$OUTPUT_FILE"
    grep -E '\[Http(Get|Post|Put|Delete)' "$file" | \
    while read -r line; do
        method=$(echo "$line" | sed 's/.*\[Http\([^]]*\).*/\1/' | tr '[:lower:]' '[:upper:]')
        endpoint=$(echo "$line" | sed 's/.*("\([^"]*\)".*/\1/' 2>/dev/null || echo "")
        
        if [ -n "$endpoint" ]; then
            echo "- **$method** \`$base_route/$endpoint\`" >> "$OUTPUT_FILE"
        else
            echo "- **$method** \`$base_route\`" >> "$OUTPUT_FILE"
        fi
    done
    
    echo "" >> "$OUTPUT_FILE"
    echo "_Datei: \`$rel_path\`_" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
done

# Datenmodelle analysieren
echo "🔍 Analysiere Datenmodelle..."
cat >> "$OUTPUT_FILE" << 'EOF'

## 📊 Datenmodelle

### Entities (Domain Models)
EOF

find "$PROJECT_ROOT/src/backend" -path "*/Domain/Entities/*.cs" | \
while read -r file; do
    entity_name=$(basename "$file" .cs)
    rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
    
    echo "- **$entity_name** - \`$rel_path\`" >> "$OUTPUT_FILE"
done

cat >> "$OUTPUT_FILE" << 'EOF'

### Read Models (Projections)
EOF

find "$PROJECT_ROOT/src/backend" -path "*/Domain/ReadModels/*.cs" | \
while read -r file; do
    model_name=$(basename "$file" .cs)
    rel_path=$(realpath --relative-to="$PROJECT_ROOT" "$file")
    
    echo "- **$model_name** - \`$rel_path\`" >> "$OUTPUT_FILE"
done

# Technologie-Stack dokumentieren
cat >> "$OUTPUT_FILE" << 'EOF'

## 🛠 Technologie-Stack

### Backend
- **.NET 9** - Web API mit Native AOT
- **Entity Framework Core** - Datenzugriff
- **PostgreSQL** - Datenbank
- **MediatR** - CQRS Pattern
- **xUnit** - Testing Framework

### Frontend  
- **Next.js 15** - React Framework mit App Router
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Jest** - Unit Testing
- **Playwright** - E2E Testing

### DevOps
- **Docker** - Containerization
- **GitHub Actions** - CI/CD
- **Multi-Agent Development** - Parallele Entwicklung mit Git Worktrees

EOF

# Abschluss-Timestamp
echo "" >> "$OUTPUT_FILE"
echo "_Letztes Update: $(date '+%Y-%m-%d %H:%M:%S')_" >> "$OUTPUT_FILE"

echo "✅ Anwendungsanalyse abgeschlossen!"
echo "📄 Report erstellt: $OUTPUT_FILE"