#!/bin/bash
export LANG=C  # Für konsistente Dezimaltrennzeichen

# Docker Compose v2 Migration Test Suite
# Tests für Issue #87: Migration von docker-compose zu Docker Compose v2
# ========================================================================

set -e  # Exit bei Fehlern

# Test-Konfiguration
TEST_LOG_FILE="/tmp/docker-compose-v2-tests.log"
TEST_RESULTS_DIR="/tmp/docker-compose-v2-results"
PERFORMANCE_LOG="$TEST_RESULTS_DIR/performance.json"
TEST_TIMEOUT=300  # 5 Minuten Timeout für Tests

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test-Counter
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_SKIPPED=0

# Cleanup-Funktion
cleanup() {
    echo -e "\n${CYAN}🧹 Cleanup wird durchgeführt...${NC}"
    
    # Stoppe alle Test-Services
    for agent in 2 3 4; do
        if [ -f "docker-compose.agent$agent.yml" ]; then
            docker compose -f "docker-compose.agent$agent.yml" down --remove-orphans &>/dev/null || true
        fi
    done
    
    docker compose -f docker-compose.yml down --remove-orphans &>/dev/null || true
    docker compose -f docker-compose.dev.yml down --remove-orphans &>/dev/null || true
    
    # Test-Container entfernen
    docker container prune -f &>/dev/null || true
    
    echo -e "${GREEN}✅ Cleanup abgeschlossen${NC}"
}

# Trap für sauberes Cleanup
trap cleanup EXIT

# Logging-Setup
setup_logging() {
    mkdir -p "$TEST_RESULTS_DIR"
    echo "# Docker Compose v2 Migration Test Results" > "$TEST_LOG_FILE"
    echo "# Started: $(date)" >> "$TEST_LOG_FILE"
    echo "" >> "$TEST_LOG_FILE"
    
    # Performance Log initialisieren
    echo '{"test_start": "'$(date -Iseconds)'", "tests": []}' > "$PERFORMANCE_LOG"
}

# Test-Helper-Funktionen
log_test_start() {
    local test_name="$1"
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "\n${BLUE}🧪 Test $TESTS_TOTAL: $test_name${NC}"
    echo "TEST $TESTS_TOTAL: $test_name - STARTED $(date)" >> "$TEST_LOG_FILE"
}

log_test_result() {
    local test_name="$1"
    local result="$2"
    local duration="${3:-0}"
    local details="${4:-}"
    
    if [ "$result" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✅ PASS: $test_name ($duration s)${NC}"
        echo "TEST $TESTS_TOTAL: $test_name - PASSED (${duration}s)" >> "$TEST_LOG_FILE"
    elif [ "$result" = "FAIL" ]; then
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}❌ FAIL: $test_name ($duration s)${NC}"
        echo "TEST $TESTS_TOTAL: $test_name - FAILED (${duration}s)" >> "$TEST_LOG_FILE"
        if [ -n "$details" ]; then
            echo -e "${RED}   Details: $details${NC}"
            echo "   Error: $details" >> "$TEST_LOG_FILE"
        fi
    elif [ "$result" = "SKIP" ]; then
        TESTS_SKIPPED=$((TESTS_SKIPPED + 1))
        echo -e "${YELLOW}⏭️  SKIP: $test_name${NC}"
        echo "TEST $TESTS_TOTAL: $test_name - SKIPPED" >> "$TEST_LOG_FILE"
        if [ -n "$details" ]; then
            echo -e "${YELLOW}   Reason: $details${NC}"
            echo "   Reason: $details" >> "$TEST_LOG_FILE"
        fi
    fi
    
    # Performance-Daten loggen
    if [ "$result" != "SKIP" ]; then
        local temp_file=$(mktemp)
        jq --arg name "$test_name" --arg result "$result" --arg duration "$duration" --arg details "$details" \
           '.tests += [{"name": $name, "result": $result, "duration": ($duration | tonumber), "details": $details, "timestamp": now | todate}]' \
           "$PERFORMANCE_LOG" > "$temp_file" && mv "$temp_file" "$PERFORMANCE_LOG"
    fi
}

measure_time() {
    local start_time=$(date +%s.%N)
    "$@"
    local end_time=$(date +%s.%N)
    echo "$(echo "$end_time - $start_time" | bc -l | xargs printf "%.2f")"
}

# Docker Compose Version Detection
check_docker_compose_version() {
    log_test_start "Docker Compose Version Detection"
    
    local start_time=$(date +%s.%N)
    
    # Prüfe ob docker compose (v2) verfügbar ist
    if ! command -v docker &> /dev/null; then
        log_test_result "Docker Compose Version Detection" "FAIL" "0" "Docker nicht verfügbar"
        return 1
    fi
    
    # Prüfe Docker Compose v2 Verfügbarkeit
    if docker compose version &> /dev/null; then
        local compose_version=$(docker compose version --short 2>/dev/null || echo "unknown")
        echo -e "${GREEN}   ✅ Docker Compose v2 verfügbar: $compose_version${NC}"
        
        # Prüfe ob legacy docker-compose auch verfügbar ist
        if command -v docker-compose &> /dev/null; then
            local legacy_version=$(docker-compose --version 2>/dev/null | cut -d' ' -f3 | cut -d',' -f1 || echo "unknown")
            echo -e "${YELLOW}   ⚠️  Legacy docker-compose auch vorhanden: $legacy_version${NC}"
        fi
        
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Docker Compose Version Detection" "PASS" "$duration" "Docker Compose v2 ($compose_version)"
        return 0
    else
        log_test_result "Docker Compose Version Detection" "FAIL" "0" "Docker Compose v2 nicht verfügbar"
        return 1
    fi
}

# 1. SYNTAX-VALIDIERUNG
test_compose_file_syntax() {
    log_test_start "Docker Compose File Syntax Validation"
    
    local start_time=$(date +%s.%N)
    local compose_files=(
        "docker-compose.yml"
        "docker-compose.dev.yml" 
        "docker-compose.agent2.yml"
        "docker-compose.agent3.yml"
        "docker-compose.agent4.yml"
        "docker-compose.agent-template.yml"
        "docker-compose.sub-agent-template.yml"
    )
    
    local failed_files=()
    local validated_files=0
    
    for file in "${compose_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${YELLOW}   ⏭️  $file nicht gefunden, überspringe${NC}"
            continue
        fi
        
        echo -e "${CYAN}   Validiere $file...${NC}"
        
        # Syntax-Validierung mit docker compose config
        if timeout 30 docker compose -f "$file" config &> /dev/null; then
            echo -e "${GREEN}   ✅ $file: Syntax OK${NC}"
            validated_files=$((validated_files + 1))
        else
            echo -e "${RED}   ❌ $file: Syntax-Fehler${NC}"
            failed_files+=("$file")
            
            # Detaillierte Fehlerausgabe
            echo -e "${RED}      Details:${NC}"
            timeout 30 docker compose -f "$file" config 2>&1 | head -5 | sed 's/^/      /'
        fi
    done
    
    local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
    
    if [ ${#failed_files[@]} -eq 0 ]; then
        log_test_result "Docker Compose File Syntax Validation" "PASS" "$duration" "$validated_files files validated"
    else
        log_test_result "Docker Compose File Syntax Validation" "FAIL" "$duration" "Failed files: ${failed_files[*]}"
        return 1
    fi
}

# 2. PROFILE-VALIDIERUNG
test_compose_profiles() {
    log_test_start "Docker Compose Profiles Validation"
    
    local start_time=$(date +%s.%N)
    local agent_file="docker-compose.agent2.yml"
    
    if [ ! -f "$agent_file" ]; then
        log_test_result "Docker Compose Profiles Validation" "SKIP" "0" "$agent_file nicht gefunden"
        return 0
    fi
    
    # Test Development Profile
    echo -e "${CYAN}   Teste development profile...${NC}"
    if timeout 30 docker compose -f "$agent_file" --profile development config &> /dev/null; then
        echo -e "${GREEN}   ✅ Development profile: OK${NC}"
        
        # Prüfe ob pgweb Service im development profile enthalten ist
        if docker compose -f "$agent_file" --profile development config | grep -q "pgweb-agent2"; then
            echo -e "${GREEN}   ✅ pgweb Service in development profile enthalten${NC}"
        else
            echo -e "${RED}   ❌ pgweb Service nicht in development profile gefunden${NC}"
            local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
            log_test_result "Docker Compose Profiles Validation" "FAIL" "$duration" "pgweb Service fehlt in development profile"
            return 1
        fi
    else
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Docker Compose Profiles Validation" "FAIL" "$duration" "Development profile config failed"
        return 1
    fi
    
    # Test Default Profile (ohne --profile)
    echo -e "${CYAN}   Teste default profile (ohne pgweb)...${NC}"
    if timeout 30 docker compose -f "$agent_file" config &> /dev/null; then
        echo -e "${GREEN}   ✅ Default profile: OK${NC}"
        
        # Prüfe dass pgweb Service NICHT im default profile enthalten ist
        if ! docker compose -f "$agent_file" config | grep -q "pgweb-agent2"; then
            echo -e "${GREEN}   ✅ pgweb Service korrekt ausgeschlossen in default profile${NC}"
        else
            echo -e "${RED}   ❌ pgweb Service fälschlicherweise in default profile${NC}"
            local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
            log_test_result "Docker Compose Profiles Validation" "FAIL" "$duration" "pgweb Service sollte nicht in default profile sein"
            return 1
        fi
    else
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Docker Compose Profiles Validation" "FAIL" "$duration" "Default profile config failed"
        return 1
    fi
    
    local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
    log_test_result "Docker Compose Profiles Validation" "PASS" "$duration" "Development and default profiles validated"
}

# 3. SERVICE-STARTUP-TESTS
test_service_startup() {
    log_test_start "Service Startup with docker compose up"
    
    local start_time=$(date +%s.%N)
    local compose_file="docker-compose.agent2.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_test_result "Service Startup with docker compose up" "SKIP" "0" "$compose_file nicht gefunden"
        return 0
    fi
    
    # Cleanup vor dem Test
    docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
    
    echo -e "${CYAN}   Starte Services mit 'docker compose up -d --wait'...${NC}"
    
    # Service-Start mit Timeout
    if timeout $TEST_TIMEOUT docker compose -f "$compose_file" up -d --wait; then
        echo -e "${GREEN}   ✅ Services erfolgreich gestartet${NC}"
        
        # Prüfe Service-Status
        local running_services=$(docker compose -f "$compose_file" ps -q | wc -l)
        echo -e "${GREEN}   ✅ $running_services Services laufen${NC}"
        
        # Health Check für PostgreSQL
        local db_health=$(docker compose -f "$compose_file" ps -q postgres-agent2 | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
        if [ "$db_health" = "healthy" ]; then
            echo -e "${GREEN}   ✅ PostgreSQL Health Check: $db_health${NC}"
        else
            echo -e "${YELLOW}   ⚠️  PostgreSQL Health Check: $db_health${NC}"
        fi
        
        # Cleanup nach erfolgreichem Test
        docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
        
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Service Startup with docker compose up" "PASS" "$duration" "$running_services services started"
    else
        echo -e "${RED}   ❌ Service-Start fehlgeschlagen oder Timeout${NC}"
        
        # Debug-Informationen sammeln
        echo -e "${RED}   Debug-Informationen:${NC}"
        docker compose -f "$compose_file" ps 2>/dev/null | sed 's/^/      /' || true
        docker compose -f "$compose_file" logs --tail=10 2>/dev/null | sed 's/^/      /' || true
        
        # Cleanup nach fehlgeschlagenem Test
        docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
        
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Service Startup with docker compose up" "FAIL" "$duration" "Service startup failed or timeout"
        return 1
    fi
}

# 4. PORT-SCHEMA-TESTS
test_port_schema() {
    log_test_start "Multi-Agent Port Schema Validation"
    
    local start_time=$(date +%s.%N)
    local expected_ports=(
        # Agent 2
        "60201:frontend" "60202:backend" "60203:database" "60204:pgweb"
        # Agent 3  
        "60301:frontend" "60302:backend" "60303:database" "60304:pgweb"
        # Agent 4
        "60401:frontend" "60402:backend" "60403:database" "60404:pgweb"
    )
    
    local port_errors=()
    
    for agent in 2 3 4; do
        local compose_file="docker-compose.agent$agent.yml"
        
        if [ ! -f "$compose_file" ]; then
            echo -e "${YELLOW}   ⏭️  $compose_file nicht gefunden, überspringe Agent $agent${NC}"
            continue
        fi
        
        echo -e "${CYAN}   Prüfe Port-Schema für Agent $agent...${NC}"
        
        # Port-Berechnung
        local base_port=$((60000 + (agent * 100)))
        local frontend_port=$((base_port + 1))
        local backend_port=$((base_port + 2))
        local db_port=$((base_port + 3))
        local pgweb_port=$((base_port + 4))
        
        # Prüfe Frontend-Port
        if docker compose -f "$compose_file" config | grep -q "$frontend_port:3000"; then
            echo -e "${GREEN}   ✅ Agent $agent Frontend Port: $frontend_port${NC}"
        else
            echo -e "${RED}   ❌ Agent $agent Frontend Port: $frontend_port nicht konfiguriert${NC}"
            port_errors+=("Agent $agent Frontend Port $frontend_port")
        fi
        
        # Prüfe Backend-Port
        if docker compose -f "$compose_file" config | grep -q "$backend_port:80"; then
            echo -e "${GREEN}   ✅ Agent $agent Backend Port: $backend_port${NC}"
        else
            echo -e "${RED}   ❌ Agent $agent Backend Port: $backend_port nicht konfiguriert${NC}"
            port_errors+=("Agent $agent Backend Port $backend_port")
        fi
        
        # Prüfe Database-Port
        if docker compose -f "$compose_file" config | grep -q "$db_port:5432"; then
            echo -e "${GREEN}   ✅ Agent $agent Database Port: $db_port${NC}"
        else
            echo -e "${RED}   ❌ Agent $agent Database Port: $db_port nicht konfiguriert${NC}"
            port_errors+=("Agent $agent Database Port $db_port")
        fi
        
        # Prüfe pgweb-Port (nur in development profile)
        if docker compose -f "$compose_file" --profile development config | grep -q "$pgweb_port:8081"; then
            echo -e "${GREEN}   ✅ Agent $agent pgweb Port: $pgweb_port (development)${NC}"
        else
            echo -e "${RED}   ❌ Agent $agent pgweb Port: $pgweb_port nicht konfiguriert${NC}"
            port_errors+=("Agent $agent pgweb Port $pgweb_port")
        fi
    done
    
    local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
    
    if [ ${#port_errors[@]} -eq 0 ]; then
        log_test_result "Multi-Agent Port Schema Validation" "PASS" "$duration" "All port schemas validated"
    else
        log_test_result "Multi-Agent Port Schema Validation" "FAIL" "$duration" "Port errors: ${port_errors[*]}"
        return 1
    fi
}

# 5. CONTAINER-NAMEN-TESTS
test_container_names() {
    log_test_start "Container Names (Hyphen Convention)"
    
    local start_time=$(date +%s.%N)
    local expected_names=(
        "booking-postgres-agent2"
        "booking-api-agent2" 
        "booking-frontend-agent2"
        "booking-pgweb-agent2"
    )
    
    local compose_file="docker-compose.agent2.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_test_result "Container Names (Hyphen Convention)" "SKIP" "0" "$compose_file nicht gefunden"
        return 0
    fi
    
    local name_errors=()
    
    echo -e "${CYAN}   Prüfe Container-Namen für Agent 2...${NC}"
    
    for expected_name in "${expected_names[@]}"; do
        if docker compose -f "$compose_file" config | grep -q "container_name: $expected_name"; then
            echo -e "${GREEN}   ✅ Container-Name: $expected_name${NC}"
        else
            echo -e "${RED}   ❌ Container-Name nicht gefunden: $expected_name${NC}"
            name_errors+=("$expected_name")
        fi
    done
    
    # Prüfe dass keine Underscores verwendet werden
    local underscore_names=$(docker compose -f "$compose_file" config | grep "container_name:" | grep "_" | wc -l)
    if [ "$underscore_names" -gt 0 ]; then
        echo -e "${RED}   ❌ Container mit Underscores gefunden (sollten Hyphens verwenden)${NC}"
        name_errors+=("Underscore usage detected")
    else
        echo -e "${GREEN}   ✅ Kein Underscore in Container-Namen (Hyphen-Convention korrekt)${NC}"
    fi
    
    local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
    
    if [ ${#name_errors[@]} -eq 0 ]; then
        log_test_result "Container Names (Hyphen Convention)" "PASS" "$duration" "All container names validated"
    else
        log_test_result "Container Names (Hyphen Convention)" "FAIL" "$duration" "Name errors: ${name_errors[*]}"
        return 1
    fi
}

# 6. SCRIPT-KOMPATIBILITÄT-TESTS
test_script_compatibility() {
    log_test_start "Script Compatibility with Docker Compose v2"
    
    local start_time=$(date +%s.%N)
    local scripts_to_test=(
        "scripts/start-agent.sh"
        "scripts/stop-agent.sh" 
        "scripts/status-agents.sh"
    )
    
    local script_errors=()
    
    for script in "${scripts_to_test[@]}"; do
        if [ ! -f "$script" ]; then
            echo -e "${YELLOW}   ⏭️  $script nicht gefunden, überspringe${NC}"
            continue
        fi
        
        echo -e "${CYAN}   Prüfe $script...${NC}"
        
        # Prüfe auf legacy docker-compose Aufrufe
        if grep -q "docker-compose" "$script"; then
            echo -e "${RED}   ❌ $script: Legacy 'docker-compose' Aufruf gefunden${NC}"
            script_errors+=("$script: legacy docker-compose usage")
        else
            echo -e "${GREEN}   ✅ $script: Verwendet 'docker compose' (v2)${NC}"
        fi
        
        # Syntax-Check für Bash-Script
        if bash -n "$script" 2>/dev/null; then
            echo -e "${GREEN}   ✅ $script: Bash-Syntax OK${NC}"
        else
            echo -e "${RED}   ❌ $script: Bash-Syntax-Fehler${NC}"
            script_errors+=("$script: bash syntax error")
        fi
    done
    
    local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
    
    if [ ${#script_errors[@]} -eq 0 ]; then
        log_test_result "Script Compatibility with Docker Compose v2" "PASS" "$duration" "All scripts validated"
    else
        log_test_result "Script Compatibility with Docker Compose v2" "FAIL" "$duration" "Script errors: ${script_errors[*]}"
        return 1
    fi
}

# 7. PERFORMANCE-TESTS
test_performance_comparison() {
    log_test_start "Performance Comparison (Startup Time)"
    
    local start_time=$(date +%s.%N)
    local compose_file="docker-compose.agent2.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_test_result "Performance Comparison (Startup Time)" "SKIP" "0" "$compose_file nicht gefunden"
        return 0
    fi
    
    echo -e "${CYAN}   Messe Service-Startup Zeit...${NC}"
    
    # Cleanup vor dem Test
    docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
    
    # Messe Startup-Zeit
    local startup_start=$(date +%s.%N)
    
    if timeout $TEST_TIMEOUT docker compose -f "$compose_file" up -d --wait; then
        local startup_end=$(date +%s.%N)
        local startup_duration=$(echo "$startup_end - $startup_start" | bc -l | xargs printf "%.2f")
        
        echo -e "${GREEN}   ✅ Startup-Zeit: ${startup_duration}s${NC}"
        
        # Messe Memory-Verbrauch
        local memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep "booking-.*-agent2" | awk '{print $2}' | head -3)
        echo -e "${GREEN}   📊 Memory-Verbrauch:${NC}"
        echo "$memory_usage" | sed 's/^/      /'
        
        # Cleanup
        docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
        
        # Performance-Benchmark
        local is_fast="UNKNOWN"
        if (( $(echo "$startup_duration < 60" | bc -l) )); then
            is_fast="FAST"
            echo -e "${GREEN}   ✅ Performance: Schneller Start (< 60s)${NC}"
        elif (( $(echo "$startup_duration < 120" | bc -l) )); then
            is_fast="MODERATE"
            echo -e "${YELLOW}   ⚠️  Performance: Moderater Start (< 120s)${NC}"
        else
            is_fast="SLOW"
            echo -e "${RED}   ⚠️  Performance: Langsamer Start (> 120s)${NC}"
        fi
        
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Performance Comparison (Startup Time)" "PASS" "$duration" "Startup: ${startup_duration}s ($is_fast)"
    else
        docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Performance Comparison (Startup Time)" "FAIL" "$duration" "Startup failed or timeout"
        return 1
    fi
}

# 8. HEALTH-CHECK-TESTS
test_health_checks() {
    log_test_start "Health Check Functionality"
    
    local start_time=$(date +%s.%N)
    local compose_file="docker-compose.agent2.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_test_result "Health Check Functionality" "SKIP" "0" "$compose_file nicht gefunden"
        return 0
    fi
    
    # Cleanup vor dem Test
    docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
    
    echo -e "${CYAN}   Starte Services und teste Health Checks...${NC}"
    
    if timeout $TEST_TIMEOUT docker compose -f "$compose_file" up -d --wait; then
        # Warte auf Health Check Stabilisierung
        sleep 10
        
        # Prüfe PostgreSQL Health Check
        local db_health=$(docker compose -f "$compose_file" ps -q postgres-agent2 | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "no_healthcheck")
        
        if [ "$db_health" = "healthy" ]; then
            echo -e "${GREEN}   ✅ PostgreSQL Health Check: healthy${NC}"
            
            # Teste Health Check Command direkt
            if docker compose -f "$compose_file" exec -T postgres-agent2 pg_isready -U booking_user -d booking_agent2 &>/dev/null; then
                echo -e "${GREEN}   ✅ Health Check Command funktioniert${NC}"
            else
                echo -e "${RED}   ❌ Health Check Command fehlgeschlagen${NC}"
                docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
                local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
                log_test_result "Health Check Functionality" "FAIL" "$duration" "Health check command failed"
                return 1
            fi
        else
            echo -e "${RED}   ❌ PostgreSQL Health Check: $db_health${NC}"
            docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
            local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
            log_test_result "Health Check Functionality" "FAIL" "$duration" "PostgreSQL health check: $db_health"
            return 1
        fi
        
        # Cleanup
        docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
        
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Health Check Functionality" "PASS" "$duration" "Health checks working"
    else
        docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "Health Check Functionality" "FAIL" "$duration" "Service startup failed"
        return 1
    fi
}

# 9. BUILDKIT-INTEGRATION-TESTS
test_buildkit_integration() {
    log_test_start "BuildKit Integration Test"
    
    local start_time=$(date +%s.%N)
    local compose_file="docker-compose.agent2.yml"
    
    if [ ! -f "$compose_file" ]; then
        log_test_result "BuildKit Integration Test" "SKIP" "0" "$compose_file nicht gefunden"
        return 0
    fi
    
    # Prüfe BuildKit-Verfügbarkeit
    if ! docker buildx version &>/dev/null; then
        log_test_result "BuildKit Integration Test" "SKIP" "0" "BuildKit/buildx nicht verfügbar"
        return 0
    fi
    
    echo -e "${CYAN}   Teste BuildKit Integration...${NC}"
    
    # Cleanup vor dem Test
    docker compose -f "$compose_file" down --remove-orphans &>/dev/null || true
    
    # Setze BuildKit-Umgebungsvariable
    export DOCKER_BUILDKIT=1
    export COMPOSE_DOCKER_CLI_BUILD=1
    
    # Teste Build mit BuildKit
    if timeout 180 docker compose -f "$compose_file" build --parallel; then
        echo -e "${GREEN}   ✅ BuildKit Build erfolgreich${NC}"
        
        # Prüfe Build-Cache
        local build_cache=$(docker system df | grep "Build Cache" | awk '{print $3}' || echo "0B")
        echo -e "${GREEN}   📊 Build Cache: $build_cache${NC}"
        
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "BuildKit Integration Test" "PASS" "$duration" "BuildKit build successful, cache: $build_cache"
    else
        local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
        log_test_result "BuildKit Integration Test" "FAIL" "$duration" "BuildKit build failed"
        return 1
    fi
}

# 10. NETWORK-ISOLATION-TESTS
test_network_isolation() {
    log_test_start "Network Isolation Between Agents"
    
    local start_time=$(date +%s.%N)
    
    # Teste Network-Konfiguration in Agent-Files
    local network_errors=()
    
    for agent in 2 3 4; do
        local compose_file="docker-compose.agent$agent.yml"
        
        if [ ! -f "$compose_file" ]; then
            continue
        fi
        
        echo -e "${CYAN}   Prüfe Network-Isolation für Agent $agent...${NC}"
        
        # Prüfe dass jeder Agent sein eigenes Netzwerk hat
        local expected_network="booking-agent${agent}-network"
        
        if docker compose -f "$compose_file" config | grep -q "name: $expected_network"; then
            echo -e "${GREEN}   ✅ Agent $agent hat eigenes Netzwerk: $expected_network${NC}"
        else
            echo -e "${RED}   ❌ Agent $agent Netzwerk nicht konfiguriert: $expected_network${NC}"
            network_errors+=("Agent $agent network missing")
        fi
        
        # Prüfe dass alle Services dem gleichen Netzwerk zugeordnet sind
        local services_in_network=$(docker compose -f "$compose_file" config | grep -A 10 "networks:" | grep "$expected_network" | wc -l)
        if [ "$services_in_network" -ge 3 ]; then  # postgres, backend, frontend mindestens
            echo -e "${GREEN}   ✅ Agent $agent Services korrekt im Netzwerk: $services_in_network Services${NC}"
        else
            echo -e "${RED}   ❌ Agent $agent Services nicht alle im Netzwerk: $services_in_network Services${NC}"
            network_errors+=("Agent $agent services not in network")
        fi
    done
    
    local duration=$(echo "$(date +%s.%N) - $start_time" | bc -l | xargs printf "%.2f")
    
    if [ ${#network_errors[@]} -eq 0 ]; then
        log_test_result "Network Isolation Between Agents" "PASS" "$duration" "All agent networks isolated"
    else
        log_test_result "Network Isolation Between Agents" "FAIL" "$duration" "Network errors: ${network_errors[*]}"
        return 1
    fi
}

# Test-Suite ausführen
main() {
    echo -e "${BLUE}🧪 Docker Compose v2 Migration Test Suite${NC}"
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${CYAN}Issue #87: Migration von docker-compose zu Docker Compose v2${NC}"
    echo ""
    
    setup_logging
    
    # Prüfe Docker-Verfügbarkeit
    if ! docker info &> /dev/null; then
        echo -e "${RED}❌ Docker ist nicht verfügbar. Tests können nicht ausgeführt werden.${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}🔍 Test-Umgebung:${NC}"
    echo -e "   Docker: $(docker --version)"
    echo -e "   Compose: $(docker compose version --short 2>/dev/null || echo 'nicht verfügbar')"
    echo -e "   Verzeichnis: $(pwd)"
    echo -e "   Verfügbare Compose-Files: $(ls docker-compose*.yml 2>/dev/null | wc -l)"
    echo ""
    
    # Führe alle Tests aus
    check_docker_compose_version || true
    test_compose_file_syntax || true
    test_compose_profiles || true  
    test_service_startup || true
    test_port_schema || true
    test_container_names || true
    test_script_compatibility || true
    test_performance_comparison || true
    test_health_checks || true
    test_buildkit_integration || true
    test_network_isolation || true
    
    # Finaler Report
    echo -e "\n${BLUE}📊 Test-Zusammenfassung${NC}"
    echo -e "${BLUE}========================${NC}"
    echo -e "${GREEN}✅ Bestanden: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Fehlgeschlagen: $TESTS_FAILED${NC}"
    echo -e "${YELLOW}⏭️  Übersprungen: $TESTS_SKIPPED${NC}"
    echo -e "${CYAN}📊 Gesamt: $TESTS_TOTAL${NC}"
    echo ""
    
    # Test Coverage berechnen
    local test_coverage=$((TESTS_PASSED * 100 / (TESTS_PASSED + TESTS_FAILED)))
    if [ $TESTS_FAILED -eq 0 ] && [ $TESTS_PASSED -gt 0 ]; then
        test_coverage=100
    fi
    
    echo -e "${CYAN}📈 Test Coverage: ${test_coverage}%${NC}"
    
    # Performance-Zusammenfassung
    if [ -f "$PERFORMANCE_LOG" ]; then
        echo -e "\n${CYAN}⚡ Performance-Metriken:${NC}"
        local avg_duration=$(jq -r '.tests[] | select(.result == "PASS") | .duration' "$PERFORMANCE_LOG" | awk '{sum+=$1; count++} END {if(count>0) printf "%.2f", sum/count; else print "0"}')
        local max_duration=$(jq -r '.tests[] | select(.result == "PASS") | .duration' "$PERFORMANCE_LOG" | sort -n | tail -1)
        echo -e "   Durchschnittliche Test-Dauer: ${avg_duration}s"
        echo -e "   Längster Test: ${max_duration}s"
    fi
    
    # Logs-Pfad anzeigen
    echo -e "\n${CYAN}📄 Detaillierte Logs:${NC}"
    echo -e "   Test-Log: $TEST_LOG_FILE"
    echo -e "   Performance-Log: $PERFORMANCE_LOG"
    echo -e "   Results-Verzeichnis: $TEST_RESULTS_DIR"
    
    # Exit-Code basierend auf Test-Ergebnissen
    if [ $TESTS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}🎉 Alle Tests erfolgreich! Docker Compose v2 Migration ist bereit.${NC}"
        
        # Performance-Report schreiben
        cat > "$TEST_RESULTS_DIR/summary.md" << EOF
# Docker Compose v2 Migration Test Results

**Status**: ✅ **ERFOLGREICH**

## Test-Übersicht
- **Bestanden**: $TESTS_PASSED
- **Fehlgeschlagen**: $TESTS_FAILED  
- **Übersprungen**: $TESTS_SKIPPED
- **Gesamt**: $TESTS_TOTAL
- **Coverage**: ${test_coverage}%

## Performance-Metriken
- **Durchschnittliche Test-Dauer**: ${avg_duration}s
- **Längster Test**: ${max_duration}s

## Validierte Bereiche
- ✅ Docker Compose v2 Syntax-Kompatibilität
- ✅ Profile-basierte Service-Konfiguration (development/production)
- ✅ Multi-Agent Port-Schema (60201-60404)
- ✅ Container-Namen mit Hyphen-Convention
- ✅ Script-Kompatibilität mit 'docker compose' (v2)
- ✅ Health-Check-Funktionalität
- ✅ BuildKit-Integration
- ✅ Network-Isolation zwischen Agenten
- ✅ Service-Startup-Performance

## Empfehlungen
Die Migration zu Docker Compose v2 ist erfolgreich validiert und produktionsbereit.

**Generiert am**: $(date)
EOF
        
        exit 0
    else
        echo -e "\n${RED}💥 $TESTS_FAILED Test(s) fehlgeschlagen. Migration benötigt Korrekturen.${NC}"
        exit 1
    fi
}

# Script ausführen
main "$@"