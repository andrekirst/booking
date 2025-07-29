#!/bin/bash
export LANG=C  # Für konsistente Dezimaltrennzeichen

# Docker Compose v2 Performance Benchmark
# Vergleicht Performance-Metriken zwischen v1 und v2
# ===================================================

set -e

# Konfiguration
BENCHMARK_RUNS=3          # Anzahl der Benchmark-Läufe
WARMUP_RUNS=1            # Aufwärm-Läufe vor Messung
TEST_TIMEOUT=300         # 5 Minuten Timeout
RESULTS_DIR="/tmp/docker-compose-v2-benchmark"

# Farben
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m'

echo -e "${MAGENTA}⚡ Docker Compose v2 Performance Benchmark${NC}"
echo -e "${MAGENTA}===========================================${NC}"
echo ""

# Setup
mkdir -p "$RESULTS_DIR"
RESULTS_FILE="$RESULTS_DIR/benchmark-results.json"
LOG_FILE="$RESULTS_DIR/benchmark.log"

# Initialisiere Ergebnis-Datei
cat > "$RESULTS_FILE" << EOF
{
  "benchmark_start": "$(date -Iseconds)",
  "config": {
    "runs": $BENCHMARK_RUNS,
    "warmup_runs": $WARMUP_RUNS,
    "timeout": $TEST_TIMEOUT
  },
  "system_info": {},
  "results": {}
}
EOF

# System-Informationen sammeln
collect_system_info() {
    echo -e "${CYAN}🖥️  Sammle System-Informationen...${NC}"
    
    local docker_version=$(docker --version | cut -d' ' -f3 | sed 's/,//')
    local compose_version=$(docker compose version --short 2>/dev/null || echo "not available")
    local os_info=$(uname -a)
    local cpu_info=$(nproc 2>/dev/null || echo "unknown")
    local memory_info=$(free -h | grep "^Mem:" | awk '{print $2}' 2>/dev/null || echo "unknown")
    
    # System-Info in Results-File einträgen
    local temp_file=$(mktemp)
    jq --arg docker "$docker_version" \
       --arg compose "$compose_version" \
       --arg os "$os_info" \
       --arg cpu "$cpu_info" \
       --arg memory "$memory_info" \
       '.system_info = {
         "docker_version": $docker,
         "compose_version": $compose,
         "os": $os,
         "cpu_cores": $cpu,
         "memory": $memory
       }' "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
    
    echo -e "${GREEN}   Docker: $docker_version${NC}"
    echo -e "${GREEN}   Compose: $compose_version${NC}"
    echo -e "${GREEN}   CPU Cores: $cpu_info${NC}"
    echo -e "${GREEN}   Memory: $memory_info${NC}"
    echo ""
}

# Cleanup-Funktion
cleanup_services() {
    local compose_file="$1"
    if [ -f "$compose_file" ]; then
        docker compose -f "$compose_file" down --remove-orphans --volumes &>/dev/null || true
    fi
}

# Zeit-Messung-Wrapper
measure_time() {
    local start_time=$(date +%s.%N)
    "$@"
    local end_time=$(date +%s.%N)
    echo "$(echo "$end_time - $start_time" | bc -l | xargs printf "%.3f")"
}

# Service-Startup-Benchmark
benchmark_startup() {
    local compose_file="$1"
    local test_name="$2"
    
    echo -e "${BLUE}⏱️  Benchmark: $test_name Startup${NC}"
    
    local startup_times=()
    local build_times=()
    local health_times=()
    
    # Aufwärm-Läufe
    echo -e "${CYAN}   Führe $WARMUP_RUNS Aufwärm-Lauf(läufe) durch...${NC}"
    for ((i=1; i<=WARMUP_RUNS; i++)); do
        cleanup_services "$compose_file"
        docker compose -f "$compose_file" up -d --wait &>/dev/null || true
        cleanup_services "$compose_file"
        echo -e "${YELLOW}     Aufwärm-Lauf $i abgeschlossen${NC}"
    done
    
    # Benchmark-Läufe
    echo -e "${CYAN}   Führe $BENCHMARK_RUNS Benchmark-Läufe durch...${NC}"
    for ((i=1; i<=BENCHMARK_RUNS; i++)); do
        echo -e "${BLUE}     🏃 Lauf $i/$BENCHMARK_RUNS...${NC}"
        
        # Cleanup vor dem Test
        cleanup_services "$compose_file"
        sleep 2
        
        # Messe Build-Zeit (falls nötig)
        local build_time=""
        if [ "$i" -eq 1 ]; then  # Nur beim ersten Lauf builden
            echo -e "${CYAN}       🏗️  Build-Zeit wird gemessen...${NC}"
            build_time=$(measure_time timeout $TEST_TIMEOUT docker compose -f "$compose_file" build --parallel)
            build_times+=("$build_time")
            echo -e "${GREEN}       Build-Zeit: ${build_time}s${NC}"
        fi
        
        # Messe Startup-Zeit
        echo -e "${CYAN}       🚀 Startup-Zeit wird gemessen...${NC}"
        local startup_time=$(measure_time timeout $TEST_TIMEOUT docker compose -f "$compose_file" up -d --wait)
        startup_times+=("$startup_time")
        echo -e "${GREEN}       Startup-Zeit: ${startup_time}s${NC}"
        
        # Messe Health-Check-Zeit
        echo -e "${CYAN}       🏥 Health-Check-Zeit wird gemessen...${NC}"
        local health_start=$(date +%s.%N)
        local health_timeout=60
        local health_elapsed=0
        
        while [ $health_elapsed -lt $health_timeout ]; do
            local db_health=$(docker compose -f "$compose_file" ps -q postgres-agent2 2>/dev/null | xargs docker inspect --format='{{.State.Health.Status}}' 2>/dev/null || echo "unknown")
            
            if [ "$db_health" = "healthy" ]; then
                break
            fi
            
            sleep 2
            health_elapsed=$((health_elapsed + 2))
        done
        
        local health_end=$(date +%s.%N)
        local health_time=$(echo "$health_end - $health_start" | bc -l | xargs printf "%.3f")
        health_times+=("$health_time")
        echo -e "${GREEN}       Health-Check-Zeit: ${health_time}s${NC}"
        
        # Sammle Resource-Statistiken
        local memory_usage=$(docker stats --no-stream --format "{{.MemUsage}}" | head -1 2>/dev/null || echo "unknown")
        echo -e "${GREEN}       Memory-Verbrauch: $memory_usage${NC}"
        
        # Log einzelne Messung
        echo "Run $i - Startup: ${startup_time}s, Health: ${health_time}s, Memory: $memory_usage" >> "$LOG_FILE"
    done
    
    # Berechne Statistiken
    local avg_startup=$(echo "${startup_times[@]}" | tr ' ' '\n' | awk '{sum+=$1; count++} END {if(count>0) printf "%.3f", sum/count; else print "0"}')
    local min_startup=$(echo "${startup_times[@]}" | tr ' ' '\n' | sort -n | head -1)
    local max_startup=$(echo "${startup_times[@]}" | tr ' ' '\n' | sort -n | tail -1)
    
    local avg_health=$(echo "${health_times[@]}" | tr ' ' '\n' | awk '{sum+=$1; count++} END {if(count>0) printf "%.3f", sum/count; else print "0"}')
    local min_health=$(echo "${health_times[@]}" | tr ' ' '\n' | sort -n | head -1)
    local max_health=$(echo "${health_times[@]}" | tr ' ' '\n' | sort -n | tail -1)
    
    # Ergebnisse anzeigen
    echo -e "\n${MAGENTA}   📊 Benchmark-Ergebnisse für $test_name:${NC}"
    echo -e "${GREEN}     Startup-Zeit:     Durchschnitt=${avg_startup}s, Min=${min_startup}s, Max=${max_startup}s${NC}"
    echo -e "${GREEN}     Health-Check:     Durchschnitt=${avg_health}s, Min=${min_health}s, Max=${max_health}s${NC}"
    
    if [ ${#build_times[@]} -gt 0 ]; then
        local avg_build=$(echo "${build_times[@]}" | tr ' ' '\n' | awk '{sum+=$1; count++} END {if(count>0) printf "%.3f", sum/count; else print "0"}')
        echo -e "${GREEN}     Build-Zeit:       ${avg_build}s${NC}"
    fi
    
    # Speichere Ergebnisse in JSON
    local temp_file=$(mktemp)
    jq --arg name "$test_name" \
       --argjson startup_times "$(printf '%s\n' "${startup_times[@]}" | jq -R . | jq -s 'map(tonumber)')" \
       --argjson health_times "$(printf '%s\n' "${health_times[@]}" | jq -R . | jq -s 'map(tonumber)')" \
       --arg avg_startup "$avg_startup" \
       --arg min_startup "$min_startup" \
       --arg max_startup "$max_startup" \
       --arg avg_health "$avg_health" \
       --arg min_health "$min_health" \
       --arg max_health "$max_health" \
       '.results[$name] = {
         "startup_times": $startup_times,
         "health_times": $health_times,
         "statistics": {
           "startup": {
             "average": ($avg_startup | tonumber),
             "min": ($min_startup | tonumber),
             "max": ($max_startup | tonumber)
           },
           "health": {
             "average": ($avg_health | tonumber),
             "min": ($min_health | tonumber),
             "max": ($max_health | tonumber)
           }
         }
       }' "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
    
    # Cleanup nach dem Benchmark
    cleanup_services "$compose_file"
    echo ""
}

# Memory-Verbrauch-Benchmark
benchmark_memory_usage() {
    local compose_file="$1"
    local test_name="$2"
    
    echo -e "${BLUE}💾 Memory-Verbrauch-Benchmark: $test_name${NC}"
    
    # Starte Services
    cleanup_services "$compose_file"
    if ! timeout $TEST_TIMEOUT docker compose -f "$compose_file" up -d --wait; then
        echo -e "${RED}   ❌ Service-Start fehlgeschlagen${NC}"
        return 1
    fi
    
    # Warte auf Stabilisierung
    sleep 10
    
    # Sammle Memory-Statistiken über Zeit
    local memory_samples=()
    local sample_count=10
    local sample_interval=5
    
    echo -e "${CYAN}   Sammle $sample_count Memory-Samples über $((sample_count * sample_interval))s...${NC}"
    
    for ((i=1; i<=sample_count; i++)); do
        local memory_total=$(docker stats --no-stream --format "{{.MemUsage}}" | grep -E "booking-.*-agent2" | awk -F'/' '{sum += $1} END {print sum}' | numfmt --from=iec)
        memory_samples+=("$memory_total")
        echo -e "${YELLOW}     Sample $i/$sample_count: $(numfmt --to=iec $memory_total)B${NC}"
        sleep $sample_interval
    done
    
    # Berechne Memory-Statistiken
    local avg_memory=$(echo "${memory_samples[@]}" | tr ' ' '\n' | awk '{sum+=$1; count++} END {if(count>0) printf "%.0f", sum/count; else print "0"}')
    local min_memory=$(echo "${memory_samples[@]}" | tr ' ' '\n' | sort -n | head -1)
    local max_memory=$(echo "${memory_samples[@]}" | tr ' ' '\n' | sort -n | tail -1)
    
    echo -e "\n${MAGENTA}   📊 Memory-Verbrauch-Ergebnisse:${NC}"
    echo -e "${GREEN}     Durchschnitt: $(numfmt --to=iec $avg_memory)B${NC}"
    echo -e "${GREEN}     Minimum:      $(numfmt --to=iec $min_memory)B${NC}"
    echo -e "${GREEN}     Maximum:      $(numfmt --to=iec $max_memory)B${NC}"
    
    # Speichere Memory-Ergebnisse
    local temp_file=$(mktemp)
    jq --arg name "$test_name" \
       --argjson memory_samples "$(printf '%s\n' "${memory_samples[@]}" | jq -R . | jq -s 'map(tonumber)')" \
       --arg avg_memory "$avg_memory" \
       --arg min_memory "$min_memory" \
       --arg max_memory "$max_memory" \
       '.results[$name].memory = {
         "samples": $memory_samples,
         "statistics": {
           "average_bytes": ($avg_memory | tonumber),
           "min_bytes": ($min_memory | tonumber),
           "max_bytes": ($max_memory | tonumber),
           "average_mb": (($avg_memory | tonumber) / 1048576 | floor),
           "max_mb": (($max_memory | tonumber) / 1048576 | floor)
         }
       }' "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
    
    cleanup_services "$compose_file"
    echo ""
}

# Build-Performance-Benchmark
benchmark_build_performance() {
    local compose_file="$1"
    local test_name="$2"
    
    echo -e "${BLUE}🏗️  Build-Performance-Benchmark: $test_name${NC}"
    
    # Cleanup und entferne Images
    cleanup_services "$compose_file"
    docker compose -f "$compose_file" down --rmi all --volumes &>/dev/null || true
    
    local build_times=()
    
    for ((i=1; i<=BENCHMARK_RUNS; i++)); do
        echo -e "${CYAN}     🔨 Build-Lauf $i/$BENCHMARK_RUNS...${NC}"
        
        # Messe Build-Zeit
        local build_time=$(measure_time timeout $TEST_TIMEOUT docker compose -f "$compose_file" build --parallel --no-cache)
        build_times+=("$build_time")
        echo -e "${GREEN}       Build-Zeit: ${build_time}s${NC}"
        
        # Prüfe Image-Größen
        local image_sizes=$(docker images --format "table {{.Repository}}\t{{.Size}}" | grep "booking-agent2" | awk '{print $2}')
        echo -e "${GREEN}       Image-Größen: $image_sizes${NC}"
    done
    
    # Build-Statistiken
    local avg_build=$(echo "${build_times[@]}" | tr ' ' '\n' | awk '{sum+=$1; count++} END {if(count>0) printf "%.3f", sum/count; else print "0"}')
    local min_build=$(echo "${build_times[@]}" | tr ' ' '\n' | sort -n | head -1)
    local max_build=$(echo "${build_times[@]}" | tr ' ' '\n' | sort -n | tail -1)
    
    echo -e "\n${MAGENTA}   📊 Build-Performance-Ergebnisse:${NC}"
    echo -e "${GREEN}     Durchschnitt: ${avg_build}s${NC}"
    echo -e "${GREEN}     Minimum:      ${min_build}s${NC}"
    echo -e "${GREEN}     Maximum:      ${max_build}s${NC}"
    
    # Speichere Build-Ergebnisse
    local temp_file=$(mktemp)
    jq --arg name "$test_name" \
       --argjson build_times "$(printf '%s\n' "${build_times[@]}" | jq -R . | jq -s 'map(tonumber)')" \
       --arg avg_build "$avg_build" \
       --arg min_build "$min_build" \
       --arg max_build "$max_build" \
       '.results[$name].build = {
         "times": $build_times,
         "statistics": {
           "average": ($avg_build | tonumber),
           "min": ($min_build | tonumber),
           "max": ($max_build | tonumber)
         }
       }' "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
    
    echo ""
}

# Generiere Benchmark-Report
generate_report() {
    echo -e "${MAGENTA}📋 Generiere Benchmark-Report...${NC}"
    
    local report_file="$RESULTS_DIR/benchmark-report.md"
    
    cat > "$report_file" << EOF
# Docker Compose v2 Performance Benchmark Report

**Generiert am**: $(date)

## System-Informationen
$(jq -r '.system_info | to_entries[] | "- **\(.key | gsub("_"; " ") | ascii_upcase)**: \(.value)"' "$RESULTS_FILE")

## Benchmark-Konfiguration
- **Runs**: $BENCHMARK_RUNS
- **Warmup Runs**: $WARMUP_RUNS  
- **Timeout**: $TEST_TIMEOUT Sekunden

## Ergebnisse

EOF

    # Füge Ergebnisse für jeden Test hinzu
    jq -r '.results | keys[]' "$RESULTS_FILE" | while read -r test_name; do
        echo "### $test_name" >> "$report_file"
        echo "" >> "$report_file"
        
        # Startup-Statistiken
        if jq -e ".results[\"$test_name\"].statistics.startup" "$RESULTS_FILE" >/dev/null; then
            local avg_startup=$(jq -r ".results[\"$test_name\"].statistics.startup.average" "$RESULTS_FILE")
            local min_startup=$(jq -r ".results[\"$test_name\"].statistics.startup.min" "$RESULTS_FILE")
            local max_startup=$(jq -r ".results[\"$test_name\"].statistics.startup.max" "$RESULTS_FILE")
            
            echo "**Startup-Performance**:" >> "$report_file"
            echo "- Durchschnitt: ${avg_startup}s" >> "$report_file"
            echo "- Minimum: ${min_startup}s" >> "$report_file"
            echo "- Maximum: ${max_startup}s" >> "$report_file"
            echo "" >> "$report_file"
        fi
        
        # Memory-Statistiken
        if jq -e ".results[\"$test_name\"].memory" "$RESULTS_FILE" >/dev/null; then
            local avg_mb=$(jq -r ".results[\"$test_name\"].memory.statistics.average_mb" "$RESULTS_FILE")
            local max_mb=$(jq -r ".results[\"$test_name\"].memory.statistics.max_mb" "$RESULTS_FILE")
            
            echo "**Memory-Verbrauch**:" >> "$report_file"
            echo "- Durchschnitt: ${avg_mb}MB" >> "$report_file"
            echo "- Maximum: ${max_mb}MB" >> "$report_file"
            echo "" >> "$report_file"
        fi
        
        # Build-Statistiken
        if jq -e ".results[\"$test_name\"].build" "$RESULTS_FILE" >/dev/null; then
            local avg_build=$(jq -r ".results[\"$test_name\"].build.statistics.average" "$RESULTS_FILE")
            local min_build=$(jq -r ".results[\"$test_name\"].build.statistics.min" "$RESULTS_FILE")
            local max_build=$(jq -r ".results[\"$test_name\"].build.statistics.max" "$RESULTS_FILE")
            
            echo "**Build-Performance**:" >> "$report_file"
            echo "- Durchschnitt: ${avg_build}s" >> "$report_file"
            echo "- Minimum: ${min_build}s" >> "$report_file"
            echo "- Maximum: ${max_build}s" >> "$report_file"
            echo "" >> "$report_file"
        fi
        
        echo "" >> "$report_file"
    done
    
    # Performance-Bewertung
    cat >> "$report_file" << EOF

## Performance-Bewertung

### Startup-Performance
EOF

    local startup_avg=$(jq -r '.results | to_entries[] | select(.value.statistics.startup) | .value.statistics.startup.average' "$RESULTS_FILE" | head -1)
    
    if [ -n "$startup_avg" ] && [ "$startup_avg" != "null" ]; then
        if (( $(echo "$startup_avg < 30" | bc -l) )); then
            echo "✅ **AUSGEZEICHNET** - Startup unter 30 Sekunden" >> "$report_file"
        elif (( $(echo "$startup_avg < 60" | bc -l) )); then
            echo "✅ **GUT** - Startup unter 60 Sekunden" >> "$report_file"
        elif (( $(echo "$startup_avg < 120" | bc -l) )); then
            echo "⚠️ **AKZEPTABEL** - Startup unter 120 Sekunden" >> "$report_file"
        else
            echo "❌ **VERBESSERUNG NÖTIG** - Startup über 120 Sekunden" >> "$report_file"
        fi
    fi
    
    cat >> "$report_file" << EOF

### Memory-Effizienz
EOF

    local memory_avg_mb=$(jq -r '.results | to_entries[] | select(.value.memory.statistics.average_mb) | .value.memory.statistics.average_mb' "$RESULTS_FILE" | head -1)
    
    if [ -n "$memory_avg_mb" ] && [ "$memory_avg_mb" != "null" ]; then
        if (( $(echo "$memory_avg_mb < 512" | bc -l) )); then
            echo "✅ **AUSGEZEICHNET** - Unter 512MB Memory-Verbrauch" >> "$report_file"
        elif (( $(echo "$memory_avg_mb < 1024" | bc -l) )); then
            echo "✅ **GUT** - Unter 1GB Memory-Verbrauch" >> "$report_file"
        elif (( $(echo "$memory_avg_mb < 2048" | bc -l) )); then
            echo "⚠️ **AKZEPTABEL** - Unter 2GB Memory-Verbrauch" >> "$report_file"
        else
            echo "❌ **HOCH** - Über 2GB Memory-Verbrauch" >> "$report_file"
        fi
    fi
    
    echo "" >> "$report_file"
    echo "**Detaillierte Benchmark-Daten**: [benchmark-results.json](benchmark-results.json)" >> "$report_file"
    
    echo -e "${GREEN}   📄 Report erstellt: $report_file${NC}"
}

# Haupt-Benchmark-Funktion
main() {
    # Prüfe Abhängigkeiten
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker nicht verfügbar${NC}"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}❌ jq nicht verfügbar (benötigt für JSON-Verarbeitung)${NC}"
        exit 1
    fi
    
    if ! command -v bc &> /dev/null; then
        echo -e "${RED}❌ bc nicht verfügbar (benötigt für Berechnungen)${NC}"
        exit 1
    fi
    
    # System-Informationen sammeln
    collect_system_info
    
    # Prüfe verfügbare Compose-Files
    local agent2_compose="docker-compose.agent2.yml"
    
    if [ ! -f "$agent2_compose" ]; then
        echo -e "${RED}❌ $agent2_compose nicht gefunden${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}🚀 Starte Performance-Benchmarks...${NC}"
    echo -e "${CYAN}Results-Verzeichnis: $RESULTS_DIR${NC}"
    echo ""
    
    # Führe Benchmarks aus
    benchmark_startup "$agent2_compose" "Agent2_Standard"
    benchmark_memory_usage "$agent2_compose" "Agent2_Standard"
    benchmark_build_performance "$agent2_compose" "Agent2_Standard"
    
    # Finalisiere Ergebnisse
    local temp_file=$(mktemp)
    jq '.benchmark_end = (now | todate)' "$RESULTS_FILE" > "$temp_file" && mv "$temp_file" "$RESULTS_FILE"
    
    # Generiere Report
    generate_report
    
    echo -e "\n${MAGENTA}🎉 Performance-Benchmark abgeschlossen!${NC}"
    echo -e "${GREEN}📊 Ergebnisse:${NC}"
    echo -e "${GREEN}   JSON-Daten: $RESULTS_FILE${NC}"
    echo -e "${GREEN}   Report: $RESULTS_DIR/benchmark-report.md${NC}"
    echo -e "${GREEN}   Logs: $LOG_FILE${NC}"
    echo ""
    
    # Zeige Kurz-Zusammenfassung
    echo -e "${CYAN}📈 Kurz-Zusammenfassung:${NC}"
    if jq -e '.results.Agent2_Standard.statistics.startup.average' "$RESULTS_FILE" >/dev/null; then
        local avg_startup=$(jq -r '.results.Agent2_Standard.statistics.startup.average' "$RESULTS_FILE")
        echo -e "${GREEN}   Durchschnittliche Startup-Zeit: ${avg_startup}s${NC}"
    fi
    
    if jq -e '.results.Agent2_Standard.memory.statistics.average_mb' "$RESULTS_FILE" >/dev/null; then
        local avg_memory=$(jq -r '.results.Agent2_Standard.memory.statistics.average_mb' "$RESULTS_FILE")
        echo -e "${GREEN}   Durchschnittlicher Memory-Verbrauch: ${avg_memory}MB${NC}"
    fi
}

# Script ausführen
main "$@"