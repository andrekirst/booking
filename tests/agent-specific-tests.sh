#!/bin/bash
export LANG=C  # Für konsistente Dezimaltrennzeichen

# Agent-Spezifische Docker Compose v2 Tests
# Testet jeden Agent (2-4) individuell mit vollem Service-Stack
# =============================================================

set -e

# Konfiguration
AGENT_NUMBER=${1:-2}  # Default: Agent 2
TEST_TIMEOUT=300      # 5 Minuten pro Agent
WAIT_TIME=10          # Warte-Zeit zwischen Tests

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Validierung
if [[ ! $AGENT_NUMBER =~ ^[2-4]$ ]]; then
    echo -e "${RED}❌ Fehler: AGENT_NUMBER muss 2, 3 oder 4 sein${NC}"
    echo "Usage: $0 [AGENT_NUMBER]"
    echo "Beispiel: $0 2"
    exit 1
fi

echo -e "${BLUE}🧪 Agent-Spezifische Docker Compose v2 Tests${NC}"
echo -e "${BLUE}==============================================${NC}"
echo -e "${CYAN}Agent: $AGENT_NUMBER${NC}"
echo ""

# Variablen für den spezifischen Agent
COMPOSE_FILE="docker-compose.agent$AGENT_NUMBER.yml"
WORKTREE_DIR="../booking-agent$AGENT_NUMBER"
BASE_PORT=$((60000 + (AGENT_NUMBER * 100)))
FRONTEND_PORT=$((BASE_PORT + 1))
BACKEND_PORT=$((BASE_PORT + 2))
DB_PORT=$((BASE_PORT + 3))
PGWEB_PORT=$((BASE_PORT + 4))

# Test-Counter
TESTS_PASSED=0
TESTS_FAILED=0

log_test() {
    local test_name="$1"
    local result="$2"
    local details="${3:-}"
    
    if [ "$result" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✅ PASS: $test_name${NC}"
        [ -n "$details" ] && echo -e "${GREEN}   $details${NC}"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}❌ FAIL: $test_name${NC}"
        [ -n "$details" ] && echo -e "${RED}   $details${NC}"
    fi
}

# Cleanup-Funktion
cleanup() {
    echo -e "\n${CYAN}🧹 Cleanup für Agent $AGENT_NUMBER...${NC}"
    if [ -f "$COMPOSE_FILE" ]; then
        docker compose -f "$COMPOSE_FILE" down --remove-orphans --volumes &>/dev/null || true
    fi
}

trap cleanup EXIT

# Test 1: Compose-File Existenz
test_compose_file_exists() {
    echo -e "\n${BLUE}🔍 Test 1: Compose-File Existenz${NC}"
    
    if [ -f "$COMPOSE_FILE" ]; then
        log_test "Compose-File Existenz" "PASS" "$COMPOSE_FILE gefunden"
        return 0
    else
        log_test "Compose-File Existenz" "FAIL" "$COMPOSE_FILE nicht gefunden"
        return 1
    fi
}

# Test 2: Syntax-Validierung
test_syntax_validation() {
    echo -e "\n${BLUE}🔍 Test 2: Syntax-Validierung${NC}"
    
    if timeout 30 docker compose -f "$COMPOSE_FILE" config --quiet &> /dev/null; then
        log_test "Syntax-Validierung" "PASS" "Compose-File ist syntaktisch korrekt"
        return 0
    else
        local error_msg=$(timeout 30 docker compose -f "$COMPOSE_FILE" config 2>&1 | head -1)
        log_test "Syntax-Validierung" "FAIL" "Syntax-Fehler: $error_msg"
        return 1
    fi
}

# Test 3: Port-Konfiguration
test_port_configuration() {
    echo -e "\n${BLUE}🔍 Test 3: Port-Konfiguration${NC}"
    
    local config_output=$(docker compose -f "$COMPOSE_FILE" config 2>/dev/null)
    local port_errors=()
    
    # Prüfe Frontend-Port
    if echo "$config_output" | grep -q "$FRONTEND_PORT:3000"; then
        echo -e "${GREEN}   ✅ Frontend-Port: $FRONTEND_PORT${NC}"
    else
        port_errors+=("Frontend-Port $FRONTEND_PORT fehlt")
    fi
    
    # Prüfe Backend-Port
    if echo "$config_output" | grep -q "$BACKEND_PORT:80"; then
        echo -e "${GREEN}   ✅ Backend-Port: $BACKEND_PORT${NC}"
    else
        port_errors+=("Backend-Port $BACKEND_PORT fehlt")
    fi
    
    # Prüfe Database-Port
    if echo "$config_output" | grep -q "$DB_PORT:5432"; then
        echo -e "${GREEN}   ✅ Database-Port: $DB_PORT${NC}"
    else
        port_errors+=("Database-Port $DB_PORT fehlt")
    fi
    
    if [ ${#port_errors[@]} -eq 0 ]; then
        log_test "Port-Konfiguration" "PASS" "Alle Ports korrekt konfiguriert"
        return 0
    else
        log_test "Port-Konfiguration" "FAIL" "${port_errors[*]}"
        return 1
    fi
}

# Test 4: Service-Startup (ohne pgweb)
test_service_startup() {
    echo -e "\n${BLUE}🔍 Test 4: Service-Startup${NC}"
    
    # Cleanup vor dem Test
    cleanup &>/dev/null
    
    echo -e "${CYAN}   Starte Services für Agent $AGENT_NUMBER...${NC}"
    
    local start_time=$(date +%s)
    
    if timeout $TEST_TIMEOUT docker compose -f "$COMPOSE_FILE" up -d --wait; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        
        # Prüfe laufende Services
        local running_services=$(docker compose -f "$COMPOSE_FILE" ps -q | wc -l)
        
        echo -e "${GREEN}   ✅ $running_services Services gestartet in ${duration}s${NC}"
        
        # Service-Details
        echo -e "${CYAN}   📋 Service-Status:${NC}"
        docker compose -f "$COMPOSE_FILE" ps --format "table" | tail -n +2 | while read -r line; do
            if [ -n "$line" ]; then
                echo "      $line"
            fi
        done
        
        log_test "Service-Startup" "PASS" "$running_services Services in ${duration}s gestartet"
        return 0
    else
        log_test "Service-Startup" "FAIL" "Timeout oder Fehler beim Service-Start"
        return 1
    fi
}

# Test 5: Health-Checks
test_health_checks() {
    echo -e "\n${BLUE}🔍 Test 5: Health-Checks${NC}"
    
    # Warte auf Health-Check-Stabilisierung
    echo -e "${CYAN}   Warte auf Health-Check-Stabilisierung...${NC}"
    sleep $WAIT_TIME
    
    # Prüfe PostgreSQL Health-Check
    local db_health=$(docker compose -f "$COMPOSE_FILE" ps -q postgres-agent$AGENT_NUMBER | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
    
    if [ "$db_health" = "healthy" ]; then
        echo -e "${GREEN}   ✅ PostgreSQL Health-Check: healthy${NC}"
        
        # Teste direkten Health-Check-Command
        if docker compose -f "$COMPOSE_FILE" exec -T postgres-agent$AGENT_NUMBER pg_isready -U booking_user -d booking_agent$AGENT_NUMBER &>/dev/null; then
            echo -e "${GREEN}   ✅ Health-Check-Command funktioniert${NC}"
            log_test "Health-Checks" "PASS" "PostgreSQL Health-Check funktioniert"
            return 0
        else
            log_test "Health-Checks" "FAIL" "Health-Check-Command fehlgeschlagen"
            return 1
        fi
    else
        log_test "Health-Checks" "FAIL" "PostgreSQL Health-Check: $db_health"
        return 1
    fi
}

# Test 6: Container-zu-Container-Kommunikation
test_container_communication() {
    echo -e "\n${BLUE}🔍 Test 6: Container-zu-Container-Kommunikation${NC}"
    
    # Teste ob Backend mit PostgreSQL kommunizieren kann
    echo -e "${CYAN}   Teste Backend -> PostgreSQL Verbindung...${NC}"
    
    if docker compose -f "$COMPOSE_FILE" exec -T backend-agent$AGENT_NUMBER timeout 10 sh -c "nc -z postgres-agent$AGENT_NUMBER 5432" &>/dev/null; then
        echo -e "${GREEN}   ✅ Backend kann PostgreSQL erreichen${NC}"
        log_test "Container-zu-Container-Kommunikation" "PASS" "Backend -> PostgreSQL Verbindung OK"
        return 0
    else
        log_test "Container-zu-Container-Kommunikation" "FAIL" "Backend kann PostgreSQL nicht erreichen"
        return 1
    fi
}

# Test 7: pgweb Integration (development profile)
test_pgweb_integration() {
    echo -e "\n${BLUE}🔍 Test 7: pgweb Integration (development profile)${NC}"
    
    # Stoppe aktuelle Services
    docker compose -f "$COMPOSE_FILE" down &>/dev/null || true
    
    echo -e "${CYAN}   Starte Services mit development profile...${NC}"
    
    if timeout $TEST_TIMEOUT docker compose -f "$COMPOSE_FILE" --profile development up -d --wait; then
        # Warte auf pgweb-Start
        sleep 5
        
        # Prüfe ob pgweb läuft
        local pgweb_running=$(docker compose -f "$COMPOSE_FILE" ps -q pgweb-agent$AGENT_NUMBER | wc -l)
        
        if [ "$pgweb_running" -eq 1 ]; then
            echo -e "${GREEN}   ✅ pgweb Service läuft${NC}"
            
            # Teste pgweb-Port
            if netstat -tuln 2>/dev/null | grep -q ":$PGWEB_PORT "; then
                echo -e "${GREEN}   ✅ pgweb Port $PGWEB_PORT ist aktiv${NC}"
                log_test "pgweb Integration" "PASS" "pgweb läuft auf Port $PGWEB_PORT"
                return 0
            else
                log_test "pgweb Integration" "FAIL" "pgweb Port $PGWEB_PORT nicht aktiv"
                return 1
            fi
        else
            log_test "pgweb Integration" "FAIL" "pgweb Service nicht gestartet"
            return 1
        fi
    else
        log_test "pgweb Integration" "FAIL" "Services mit development profile konnten nicht gestartet werden"
        return 1
    fi
}

# Test 8: Volume-Management
test_volume_management() {
    echo -e "\n${BLUE}🔍 Test 8: Volume-Management${NC}"
    
    local volume_name="booking-agent${AGENT_NUMBER}_postgres_agent${AGENT_NUMBER}_data"
    
    # Prüfe ob Volume existiert
    if docker volume ls -q | grep -q "^$volume_name$"; then
        echo -e "${GREEN}   ✅ Volume existiert: $volume_name${NC}"
        
        # Prüfe Volume-Informationen
        local volume_driver=$(docker volume inspect "$volume_name" --format '{{.Driver}}' 2>/dev/null || echo "unknown")
        echo -e "${GREEN}   📊 Volume-Driver: $volume_driver${NC}"
        
        log_test "Volume-Management" "PASS" "Volume $volume_name existiert ($volume_driver)"
        return 0
    else
        log_test "Volume-Management" "FAIL" "Volume $volume_name nicht gefunden"
        return 1
    fi
}

# Test 9: Network-Isolation
test_network_isolation() {
    echo -e "\n${BLUE}🔍 Test 9: Network-Isolation${NC}"
    
    local network_name="booking-agent${AGENT_NUMBER}-network"
    
    # Prüfe ob Agent-spezifisches Netzwerk existiert
    if docker network ls | grep -q "$network_name"; then
        echo -e "${GREEN}   ✅ Agent-Netzwerk existiert: $network_name${NC}"
        
        # Prüfe Network-Driver
        local network_driver=$(docker network inspect "$network_name" --format '{{.Driver}}' 2>/dev/null || echo "unknown")
        echo -e "${GREEN}   📊 Network-Driver: $network_driver${NC}"
        
        # Zähle Container im Netzwerk
        local containers_in_network=$(docker network inspect "$network_name" --format '{{len .Containers}}' 2>/dev/null || echo "0")
        echo -e "${GREEN}   📊 Container im Netzwerk: $containers_in_network${NC}"
        
        log_test "Network-Isolation" "PASS" "Netzwerk $network_name mit $containers_in_network Containern"
        return 0
    else
        log_test "Network-Isolation" "FAIL" "Agent-Netzwerk $network_name nicht gefunden"
        return 1
    fi
}

# Test 10: Resource-Verbrauch
test_resource_usage() {
    echo -e "\n${BLUE}🔍 Test 10: Resource-Verbrauch${NC}"
    
    # Sammle Resource-Statistiken
    local stats_output=$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep "booking-.*-agent$AGENT_NUMBER")
    
    if [ -n "$stats_output" ]; then
        echo -e "${GREEN}   📊 Resource-Verbrauch:${NC}"
        echo "$stats_output" | sed 's/^/      /'
        
        # Prüfe auf übermäßigen Resource-Verbrauch (mehr als 90% CPU)
        local high_cpu=$(echo "$stats_output" | awk '{print $2}' | sed 's/%//' | awk '$1 > 90 {print $1}')
        
        if [ -n "$high_cpu" ]; then
            log_test "Resource-Verbrauch" "FAIL" "Hoher CPU-Verbrauch erkannt: $high_cpu%"
            return 1
        else
            log_test "Resource-Verbrauch" "PASS" "Resource-Verbrauch im normalen Bereich"
            return 0
        fi
    else
        log_test "Resource-Verbrauch" "FAIL" "Keine Resource-Statistiken verfügbar"
        return 1
    fi
}

# Führe alle Tests aus
main() {
    echo -e "${CYAN}🚀 Starte Agent-spezifische Tests für Agent $AGENT_NUMBER${NC}"
    echo -e "${CYAN}Compose-File: $COMPOSE_FILE${NC}"
    echo -e "${CYAN}Ports: Frontend=$FRONTEND_PORT, Backend=$BACKEND_PORT, DB=$DB_PORT, pgweb=$PGWEB_PORT${NC}"
    echo ""
    
    # Prüfe Docker-Verfügbarkeit
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker ist nicht verfügbar${NC}"
        exit 1
    fi
    
    # Führe Tests sequenziell aus
    test_compose_file_exists || exit 1
    test_syntax_validation || exit 1
    test_port_configuration || exit 1
    test_service_startup || exit 1
    test_health_checks || exit 1
    test_container_communication || exit 1
    test_pgweb_integration || exit 1
    test_volume_management || exit 1
    test_network_isolation || exit 1
    test_resource_usage || exit 1
    
    # Ergebnis-Zusammenfassung
    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=$((TESTS_PASSED * 100 / total_tests))
    
    echo -e "\n${BLUE}📊 Test-Zusammenfassung für Agent $AGENT_NUMBER${NC}"
    echo -e "${BLUE}==========================================${NC}"
    echo -e "${GREEN}✅ Bestanden: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Fehlgeschlagen: $TESTS_FAILED${NC}"
    echo -e "${CYAN}📊 Gesamt: $total_tests${NC}"
    echo -e "${CYAN}🎯 Erfolgsrate: ${success_rate}%${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Alle Tests für Agent $AGENT_NUMBER erfolgreich!${NC}"
        echo -e "${GREEN}Agent $AGENT_NUMBER ist bereit für Docker Compose v2${NC}"
        exit 0
    else
        echo -e "\n${RED}💥 $TESTS_FAILED Test(s) für Agent $AGENT_NUMBER fehlgeschlagen${NC}"
        exit 1
    fi
}

# Script ausführen
main "$@"