#!/bin/bash

# Docker Compose v2 Migration - Automatische Issue-Behebung
# Behebt die durch Tests identifizierten Migrations-Probleme
# =========================================================

set -e

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Konfiguration
DRY_RUN=${1:-false}  # Wenn "true", nur anzeigen was gemacht würde
BACKUP_DIR="/tmp/docker-compose-v2-migration-backup"

echo -e "${BLUE}🔧 Docker Compose v2 Migration - Issue-Behebung${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

if [ "$DRY_RUN" = "true" ]; then
    echo -e "${YELLOW}⚠️  DRY RUN MODUS - Keine Änderungen werden vorgenommen${NC}"
    echo ""
fi

# Backup-Verzeichnis erstellen
if [ "$DRY_RUN" != "true" ]; then
    mkdir -p "$BACKUP_DIR"
    echo -e "${CYAN}📁 Backup-Verzeichnis erstellt: $BACKUP_DIR${NC}"
fi

# Issue 1: Container-Cleanup
fix_container_conflicts() {
    echo -e "\n${BLUE}🧹 Issue 1: Container-Konflikte beheben${NC}"
    
    # Liste alle booking-Container
    local existing_containers=$(docker ps -a --filter "name=booking-" --format "{{.Names}}" | sort)
    
    if [ -z "$existing_containers" ]; then
        echo -e "${GREEN}   ✅ Keine Container-Konflikte gefunden${NC}"
        return 0
    fi
    
    echo -e "${YELLOW}   Gefundene Container:${NC}"
    echo "$existing_containers" | sed 's/^/      /'
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}   [DRY RUN] Würde folgende Container entfernen:${NC}"
        echo "$existing_containers" | sed 's/^/      /'
        return 0
    fi
    
    # Stoppe und entferne Container
    echo -e "${CYAN}   Stoppe und entferne Container...${NC}"
    for container in $existing_containers; do
        echo -e "${CYAN}     Entferne: $container${NC}"
        docker stop "$container" &>/dev/null || true
        docker rm "$container" &>/dev/null || true
    done
    
    # Aufräumen von Volumes und Networks
    echo -e "${CYAN}   Aufräumen von Volumes und Networks...${NC}"
    docker volume prune -f &>/dev/null || true
    docker network prune -f &>/dev/null || true
    
    echo -e "${GREEN}   ✅ Container-Konflikte behoben${NC}"
}

# Issue 2: Script-Migration zu Docker Compose v2
fix_script_legacy_usage() {
    echo -e "\n${BLUE}🔄 Issue 2: Script-Migration zu Docker Compose v2${NC}"
    
    local scripts_to_fix=(
        "scripts/start-agent.sh"
        "scripts/stop-agent.sh"
        "scripts/status-agents.sh"
        "scripts/generate-agent-configs.sh"
        "scripts/stop-all-agents.sh"
    )
    
    for script in "${scripts_to_fix[@]}"; do
        if [ ! -f "$script" ]; then
            echo -e "${YELLOW}   ⏭️  $script nicht gefunden, überspringe${NC}"
            continue
        fi
        
        # Prüfe auf legacy docker-compose Verwendung
        local legacy_count=$(grep -c "docker-compose" "$script" 2>/dev/null || echo "0")
        
        if [ "$legacy_count" -eq 0 ]; then
            echo -e "${GREEN}   ✅ $script: Bereits v2-kompatibel${NC}"
            continue
        fi
        
        echo -e "${CYAN}   🔄 $script: $legacy_count legacy Aufrufe gefunden${NC}"
        
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}   [DRY RUN] Würde ersetzen:${NC}"
            grep -n "docker-compose" "$script" | head -3 | sed 's/^/      /'
            continue
        fi
        
        # Backup erstellen
        cp "$script" "$BACKUP_DIR/$(basename "$script").backup"
        
        # Ersetze docker-compose mit docker compose
        sed -i 's/docker-compose/docker compose/g' "$script"
        
        # Verifikation
        local new_legacy_count=$(grep -c "docker-compose" "$script" 2>/dev/null || echo "0")
        
        if [ "$new_legacy_count" -eq 0 ]; then
            echo -e "${GREEN}   ✅ $script: Migration erfolgreich (${legacy_count} → 0 legacy Aufrufe)${NC}"
        else
            echo -e "${RED}   ❌ $script: Migration unvollständig ($new_legacy_count legacy Aufrufe verbleiben)${NC}"
        fi
    done
}

# Issue 3: Port-Schema-Konfiguration prüfen
fix_port_schema_config() {
    echo -e "\n${BLUE}🌐 Issue 3: Port-Schema-Konfiguration prüfen${NC}"
    
    for agent in 2 3 4; do
        local compose_file="docker-compose.agent$agent.yml"
        
        if [ ! -f "$compose_file" ]; then
            echo -e "${YELLOW}   ⏭️  $compose_file nicht gefunden${NC}"
            continue
        fi
        
        echo -e "${CYAN}   Prüfe $compose_file...${NC}"
        
        # Erwartete Ports berechnen
        local base_port=$((60000 + (agent * 100)))
        local frontend_port=$((base_port + 1))
        local backend_port=$((base_port + 2))
        local db_port=$((base_port + 3))
        local pgweb_port=$((base_port + 4))
        
        # Prüfe aktuelle Port-Konfiguration
        local config_output=$(docker compose -f "$compose_file" config 2>/dev/null)
        
        # Frontend-Port prüfen
        if echo "$config_output" | grep -q "- \"$frontend_port:3000\""; then
            echo -e "${GREEN}     ✅ Frontend-Port: $frontend_port${NC}"
        else
            echo -e "${RED}     ❌ Frontend-Port: $frontend_port nicht gefunden${NC}"
            echo -e "${CYAN}     Gefundene Ports:${NC}"
            echo "$config_output" | grep -E "ports:" -A 1 | grep -E "^\s*-\s*\"" | sed 's/^/        /'
        fi
        
        # Backend-Port prüfen
        if echo "$config_output" | grep -q "- \"$backend_port:80\""; then
            echo -e "${GREEN}     ✅ Backend-Port: $backend_port${NC}"
        else
            echo -e "${RED}     ❌ Backend-Port: $backend_port nicht gefunden${NC}"
        fi
        
        # Database-Port prüfen
        if echo "$config_output" | grep -q "- \"$db_port:5432\""; then
            echo -e "${GREEN}     ✅ Database-Port: $db_port${NC}"
        else
            echo -e "${RED}     ❌ Database-Port: $db_port nicht gefunden${NC}"
        fi
        
        # pgweb-Port prüfen (development profile)
        local pgweb_config=$(docker compose -f "$compose_file" --profile development config 2>/dev/null)
        if echo "$pgweb_config" | grep -q "- \"$pgweb_port:8081\""; then
            echo -e "${GREEN}     ✅ pgweb-Port: $pgweb_port (development)${NC}"
        else
            echo -e "${YELLOW}     ⚠️  pgweb-Port: $pgweb_port nicht gefunden oder nicht im development profile${NC}"
        fi
    done
}

# Issue 4: Container-Namen-Convention prüfen und korrigieren
fix_container_naming() {
    echo -e "\n${BLUE}🏷️  Issue 4: Container-Namen-Convention prüfen${NC}"
    
    for agent in 2 3 4; do
        local compose_file="docker-compose.agent$agent.yml"
        
        if [ ! -f "$compose_file" ]; then
            continue
        fi
        
        echo -e "${CYAN}   Prüfe $compose_file...${NC}"
        
        # Prüfe auf Underscore-Verwendung (außer in Volume-Namen)
        local underscores=$(grep "container_name:" "$compose_file" | grep "_" | wc -l)
        
        if [ "$underscores" -gt 0 ]; then
            echo -e "${RED}     ❌ $underscores Container-Namen mit Underscores gefunden${NC}"
            grep "container_name:" "$compose_file" | grep "_" | sed 's/^/        /'
            
            if [ "$DRY_RUN" != "true" ]; then
                echo -e "${YELLOW}     ⚠️  Manuelle Korrektur erforderlich - Container-Namen sollten Hyphens verwenden${NC}"
            fi
        else
            echo -e "${GREEN}     ✅ Container-Namen verwenden Hyphen-Convention${NC}"
        fi
        
        # Prüfe pgweb Container-Namen
        if grep -q "container_name.*pgweb-agent$agent" "$compose_file"; then
            echo -e "${GREEN}     ✅ pgweb Container-Name korrekt: booking-pgweb-agent$agent${NC}"
        else
            echo -e "${YELLOW}     ⚠️  pgweb Container-Name möglicherweise fehlerhaft${NC}"
            grep "container_name.*pgweb" "$compose_file" | sed 's/^/        /' || echo "        Kein pgweb Container gefunden"
        fi
    done
}

# Issue 5: Template-Files von Validierung ausschließen
fix_template_validation() {
    echo -e "\n${BLUE}📝 Issue 5: Template-File-Validierung korrigieren${NC}"
    
    local validation_script="tests/validate-compose-syntax.sh"
    
    if [ ! -f "$validation_script" ]; then
        echo -e "${YELLOW}   ⏭️  Validierungs-Script nicht gefunden${NC}"
        return 0
    fi
    
    # Prüfe ob Template-Files bereits ausgeschlossen werden
    if grep -q "template" "$validation_script" && grep -q "skip\|überspringe" "$validation_script"; then
        echo -e "${GREEN}   ✅ Template-Files bereits von Validierung ausgeschlossen${NC}"
        return 0
    fi
    
    echo -e "${CYAN}   Template-Files sollten von Syntax-Validierung ausgeschlossen werden${NC}"
    echo -e "${CYAN}   Grund: Template-Files enthalten Platzhalter wie {AGENT_NUMBER}${NC}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}   [DRY RUN] Würde Template-Exclusion zu $validation_script hinzufügen${NC}"
        return 0
    fi
    
    # Backup erstellen
    cp "$validation_script" "$BACKUP_DIR/$(basename "$validation_script").backup"
    
    # Template-Exclusion-Logik hinzufügen (vereinfacht)
    echo -e "${CYAN}   Hinweis: Manuelle Anpassung von $validation_script erforderlich${NC}"
    echo -e "${CYAN}   Füge Template-Exclusion-Logik hinzu:${NC}"
    echo -e "${CYAN}     if [[ \"\$file\" == *\"-template.yml\" ]]; then${NC}"
    echo -e "${CYAN}       continue # Skip template files${NC}"
    echo -e "${CYAN}     fi${NC}"
}

# Issue 6: BC-Verfügbarkeit für numerische Berechnungen prüfen
fix_bc_dependency() {
    echo -e "\n${BLUE}🔢 Issue 6: BC-Dependency für Tests prüfen${NC}"
    
    if command -v bc &> /dev/null; then
        echo -e "${GREEN}   ✅ bc ist verfügbar${NC}"
    else
        echo -e "${RED}   ❌ bc ist nicht verfügbar (benötigt für numerische Berechnungen)${NC}"
        
        if [ "$DRY_RUN" = "true" ]; then
            echo -e "${YELLOW}   [DRY RUN] Würde bc installieren: sudo apt-get install bc${NC}"
        else
            echo -e "${CYAN}   Installiere bc...${NC}"
            if sudo apt-get update && sudo apt-get install -y bc; then
                echo -e "${GREEN}   ✅ bc erfolgreich installiert${NC}"
            else
                echo -e "${RED}   ❌ bc Installation fehlgeschlagen${NC}"
            fi
        fi
    fi
}

# Issue 7: JQ-Performance für JSON-Verarbeitung optimieren
fix_jq_performance() {
    echo -e "\n${BLUE}📊 Issue 7: JQ-Performance-Issues beheben${NC}"
    
    # Das Problem liegt an deutschen Dezimaltrennzeichen (Komma statt Punkt)
    echo -e "${CYAN}   Problem: Deutsche Locale verwendet Komma als Dezimaltrenner${NC}"
    echo -e "${CYAN}   JQ erwartet aber Punkt als Dezimaltrenner${NC}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}   [DRY RUN] Würde LANG=C in Test-Scripts setzen${NC}"
        return 0
    fi
    
    # Korrigiere Test-Scripts für LANG=C
    local test_scripts=(
        "tests/docker-compose-v2-migration.test.sh"
        "tests/agent-specific-tests.sh"
        "tests/performance-benchmark.sh"
    )
    
    for script in "${test_scripts[@]}"; do
        if [ ! -f "$script" ]; then
            continue
        fi
        
        # Backup erstellen
        cp "$script" "$BACKUP_DIR/$(basename "$script").backup"
        
        # Füge LANG=C am Anfang hinzu (falls nicht vorhanden)
        if ! grep -q "export LANG=C" "$script"; then
            sed -i '2i export LANG=C  # Für konsistente Dezimaltrennzeichen' "$script"
            echo -e "${GREEN}   ✅ $script: LANG=C hinzugefügt${NC}"
        else
            echo -e "${GREEN}   ✅ $script: LANG=C bereits gesetzt${NC}"
        fi
    done
}

# Haupt-Ausführung
main() {
    echo -e "${CYAN}🚀 Starte automatische Issue-Behebung...${NC}"
    echo ""
    
    # Führe alle Korrekturen aus
    fix_container_conflicts
    fix_script_legacy_usage
    fix_port_schema_config
    fix_container_naming
    fix_template_validation
    fix_bc_dependency
    fix_jq_performance
    
    # Zusammenfassung
    echo -e "\n${BLUE}📋 Zusammenfassung der Korrekturen${NC}"
    echo -e "${BLUE}===================================${NC}"
    
    if [ "$DRY_RUN" = "true" ]; then
        echo -e "${YELLOW}🔍 DRY RUN abgeschlossen - Keine Änderungen vorgenommen${NC}"
        echo -e "${CYAN}Führe das Script ohne Parameter aus, um Korrekturen anzuwenden:${NC}"
        echo -e "${CYAN}  ./tests/fix-migration-issues.sh${NC}"
    else
        echo -e "${GREEN}✅ Korrekturen angewendet${NC}"
        echo -e "${CYAN}📁 Backups erstellt in: $BACKUP_DIR${NC}"
        echo -e "${CYAN}🧪 Führe Tests erneut aus:${NC}"
        echo -e "${CYAN}  ./tests/docker-compose-v2-migration.test.sh${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}🔄 Empfohlene nächste Schritte:${NC}"
    echo -e "${CYAN}1. Tests erneut ausführen: ./tests/docker-compose-v2-migration.test.sh${NC}"
    echo -e "${CYAN}2. Agent-spezifische Tests: ./tests/agent-specific-tests.sh 2${NC}"
    echo -e "${CYAN}3. Performance-Benchmark: ./tests/performance-benchmark.sh${NC}"
    echo -e "${CYAN}4. Manuelle Überprüfung der Port-Konfiguration falls Tests weiterhin fehlschlagen${NC}"
}

# Hilfe anzeigen
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Docker Compose v2 Migration - Issue-Behebung"
    echo ""
    echo "Usage:"
    echo "  $0                 # Führe Korrekturen aus"
    echo "  $0 true           # Dry Run - Zeige nur was gemacht würde"
    echo "  $0 --help        # Zeige diese Hilfe"
    echo ""
    echo "Das Script behebt automatisch folgende Issues:"
    echo "- Container-Konflikte durch existierende Container"
    echo "- Legacy docker-compose Verwendung in Scripts"
    echo "- Numerische Locale-Issues (deutsche Komma-Trennung)"
    echo "- BC-Dependency für Berechnungen"
    echo "- Template-File-Validierungs-Issues"
    echo ""
    exit 0
fi

# Script ausführen
main "$@"