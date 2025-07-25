#!/bin/bash

# Multi-Agent Docker Compose Konfiguration Generator
# Generiert spezifische Docker Compose Files für alle Agenten basierend auf Template

set -e  # Exit bei Fehlern

TEMPLATE_FILE="docker-compose.agent-template.yml"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "🏭 Multi-Agent Docker Compose Konfiguration Generator"
echo "====================================================="
echo "Projektverzeichnis: $PROJECT_ROOT"
echo ""

# Prüfe ob Template existiert
if [ ! -f "$PROJECT_ROOT/$TEMPLATE_FILE" ]; then
    echo "❌ Fehler: Template-Datei '$TEMPLATE_FILE' nicht gefunden"
    echo "   Erwartet in: $PROJECT_ROOT/$TEMPLATE_FILE"
    exit 1
fi

# Zeige Template-Informationen
echo "📄 Template-Datei: $TEMPLATE_FILE"
echo "🔧 Generiere Konfigurationen für Agenten 2-4..."
echo ""

# Zähler für generierte Dateien
GENERATED_COUNT=0
UPDATED_COUNT=0

# Generiere Konfigurationsdateien für jeden Agenten
for AGENT_NUMBER in 2 3 4; do
    # Port-Berechnung basierend auf 60000er Schema
    BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
    FRONTEND_PORT=$((BASE_PORT + 1))
    BACKEND_PORT=$((BASE_PORT + 2))
    DB_PORT=$((BASE_PORT + 3))
    
    OUTPUT_FILE="$PROJECT_ROOT/docker-compose.agent$AGENT_NUMBER.yml"
    
    echo "🤖 Agent $AGENT_NUMBER"
    echo "─────────────"
    echo "   Basis-Port: $BASE_PORT"
    echo "   Frontend:   $FRONTEND_PORT"
    echo "   Backend:    $BACKEND_PORT"
    echo "   Database:   $DB_PORT"
    
    # Prüfe ob Datei bereits existiert
    if [ -f "$OUTPUT_FILE" ]; then
        echo "   Status:     ⚠️  Datei existiert bereits - wird überschrieben"
        UPDATED_COUNT=$((UPDATED_COUNT + 1))
    else
        echo "   Status:     ✨ Neue Datei wird erstellt"
        GENERATED_COUNT=$((GENERATED_COUNT + 1))
    fi
    
    # Erstelle temporäre Datei mit Ersetzungen
    TEMP_FILE=$(mktemp)
    
    # Führe alle Ersetzungen durch
    sed -e "s/{AGENT_NUMBER}/$AGENT_NUMBER/g" \
        -e "s/{BASE_PORT}/$BASE_PORT/g" \
        -e "s/{FRONTEND_PORT}/$FRONTEND_PORT/g" \
        -e "s/{BACKEND_PORT}/$BACKEND_PORT/g" \
        -e "s/{DB_PORT}/$DB_PORT/g" \
        "$PROJECT_ROOT/$TEMPLATE_FILE" > "$TEMP_FILE"
    
    # Füge Generierungs-Header hinzu
    {
        echo "# AUTOMATISCH GENERIERT - NICHT MANUELL BEARBEITEN!"
        echo "# Generiert von: $(basename "$0") am $(date)"
        echo "# Template: $TEMPLATE_FILE"
        echo "# Agent: $AGENT_NUMBER | Ports: $FRONTEND_PORT/$BACKEND_PORT/$DB_PORT"
        echo ""
        cat "$TEMP_FILE"
    } > "$OUTPUT_FILE"
    
    # Aufräumen
    rm "$TEMP_FILE"
    
    echo "   Ausgabe:    $(basename "$OUTPUT_FILE")"
    echo ""
done

# Zusammenfassung
echo "📊 Zusammenfassung"
echo "──────────────────"
echo "   ✨ Neu generiert: $GENERATED_COUNT"
echo "   🔄 Aktualisiert:  $UPDATED_COUNT"
echo "   📁 Gesamt:        $((GENERATED_COUNT + UPDATED_COUNT))"

# Validierung der generierten Dateien
echo ""
echo "🔍 Validierung der generierten Dateien"
echo "──────────────────────────────────────"

VALIDATION_ERRORS=0

for AGENT_NUMBER in 2 3 4; do
    OUTPUT_FILE="$PROJECT_ROOT/docker-compose.agent$AGENT_NUMBER.yml"
    
    echo "   Agent $AGENT_NUMBER: $(basename "$OUTPUT_FILE")"
    
    # Prüfe Datei-Existenz
    if [ ! -f "$OUTPUT_FILE" ]; then
        echo "      ❌ Datei nicht gefunden"
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        continue
    fi
    
    # Prüfe auf unersetzten Platzhalter
    REMAINING_PLACEHOLDERS=$(grep -o '{[A-Z_]*}' "$OUTPUT_FILE" 2>/dev/null | wc -l)
    if [ "$REMAINING_PLACEHOLDERS" -gt 0 ]; then
        echo "      ❌ $REMAINING_PLACEHOLDERS unersetzter Platzhalter gefunden"
        grep -n '{[A-Z_]*}' "$OUTPUT_FILE" | head -3
        VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
    else
        echo "      ✅ Alle Platzhalter korrekt ersetzt"
    fi
    
    # Prüfe Docker Compose Syntax (falls docker-compose verfügbar)
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose -f "$OUTPUT_FILE" config >/dev/null 2>&1; then
            echo "      ✅ Docker Compose Syntax gültig"
        else
            echo "      ❌ Docker Compose Syntax fehlerhaft"
            VALIDATION_ERRORS=$((VALIDATION_ERRORS + 1))
        fi
    fi
done

echo ""

if [ "$VALIDATION_ERRORS" -eq 0 ]; then
    echo "✅ Alle Konfigurationsdateien erfolgreich generiert und validiert"
    echo ""
    echo "🚀 Nächste Schritte:"
    echo "   Agent starten: ./scripts/start-agent.sh <AGENT_NUMBER> <BRANCH_NAME>"
    echo "   Status prüfen: ./scripts/status-agents.sh"
    echo "   Alle stoppen:  ./scripts/stop-all-agents.sh"
    exit 0
else
    echo "❌ $VALIDATION_ERRORS Validierungsfehler gefunden"
    echo "   Bitte prüfen Sie die oben genannten Probleme"
    exit 1
fi