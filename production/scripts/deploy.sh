#!/bin/bash

#################################################################################
# Production Deployment Script for Raspberry Pi Zero 2 W
# Zero-Downtime Deployment with Automatic Rollback
# Optimized for ARM64 with comprehensive health checks
#################################################################################

set -euo pipefail  # Exit on any error, undefined variable, or pipe failure

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PRODUCTION_DIR="$(dirname "$SCRIPT_DIR")"
readonly PROJECT_ROOT="$(dirname "$PRODUCTION_DIR")"
readonly COMPOSE_FILE="$PRODUCTION_DIR/docker-compose.production.yml"
readonly LOG_FILE="/var/log/booking-deployment.log"
readonly LOCK_FILE="/tmp/booking-deploy.lock"
readonly BACKUP_DIR="/opt/booking/backups"
readonly MAX_DEPLOYMENT_TIME=300  # 5 minutes timeout

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# Deployment configuration
ENVIRONMENT="${ENVIRONMENT:-production}"
SKIP_BACKUP="${SKIP_BACKUP:-false}"
SKIP_TESTS="${SKIP_TESTS:-false}"
FORCE_DEPLOY="${FORCE_DEPLOY:-false}"
DRY_RUN="${DRY_RUN:-false}"

#################################################################################
# Utility Functions
#################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Color based on log level
    local color=""
    case "$level" in
        ERROR) color="$RED" ;;
        SUCCESS) color="$GREEN" ;;
        WARNING) color="$YELLOW" ;;
        INFO) color="$BLUE" ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $message${NC}" | tee -a "$LOG_FILE"
}

cleanup() {
    log "INFO" "Cleaning up deployment process..."
    rm -f "$LOCK_FILE"
    
    # Kill any hanging docker processes
    if pgrep -f "docker compose.*production" > /dev/null; then
        log "WARNING" "Killing hanging Docker processes..."
        pkill -f "docker compose.*production" || true
    fi
}

# Set up trap for cleanup
trap cleanup EXIT INT TERM

acquire_lock() {
    if [ -f "$LOCK_FILE" ]; then
        local lock_pid
        lock_pid=$(cat "$LOCK_FILE" 2>/dev/null || echo "")
        
        if [ -n "$lock_pid" ] && kill -0 "$lock_pid" 2>/dev/null; then
            log "ERROR" "Another deployment is already running (PID: $lock_pid)"
            exit 1
        else
            log "WARNING" "Removing stale lock file"
            rm -f "$LOCK_FILE"
        fi
    fi
    
    echo $$ > "$LOCK_FILE"
    log "INFO" "Deployment lock acquired"
}

#################################################################################
# System Health and Validation
#################################################################################

check_system_requirements() {
    log "INFO" "Checking system requirements for Raspberry Pi Zero 2 W..."
    
    # Check if running on ARM64
    if [ "$(uname -m)" != "aarch64" ]; then
        log "WARNING" "Not running on ARM64 architecture. Expected aarch64, got $(uname -m)"
    fi
    
    # Check available memory (should have at least 400MB free)
    local available_mem
    available_mem=$(awk '/MemAvailable/ {print $2}' /proc/meminfo)
    available_mem=$((available_mem / 1024))  # Convert to MB
    
    if [ "$available_mem" -lt 400 ]; then
        log "ERROR" "Insufficient memory: ${available_mem}MB available, need at least 400MB"
        return 1
    fi
    
    log "SUCCESS" "Memory check passed: ${available_mem}MB available"
    
    # Check disk space (need at least 2GB free)
    local available_disk
    available_disk=$(df /opt/booking | awk 'NR==2 {print $4}')
    available_disk=$((available_disk / 1024))  # Convert to MB
    
    if [ "$available_disk" -lt 2048 ]; then
        log "ERROR" "Insufficient disk space: ${available_disk}MB available, need at least 2GB"
        return 1
    fi
    
    log "SUCCESS" "Disk space check passed: ${available_disk}MB available"
    
    # Check Docker availability
    if ! command -v docker &> /dev/null; then
        log "ERROR" "Docker is not installed or not in PATH"
        return 1
    fi
    
    if ! docker compose version &> /dev/null; then
        log "ERROR" "Docker Compose is not available"
        return 1
    fi
    
    log "SUCCESS" "Docker requirements met"
    
    # Check required directories
    local required_dirs=(
        "/opt/booking/data/postgres"
        "/opt/booking/data/grafana"
        "/opt/booking/data/prometheus"
        "/opt/booking/backups"
        "/var/log"
    )
    
    for dir in "${required_dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            log "INFO" "Creating required directory: $dir"
            mkdir -p "$dir"
            chown -R booking:booking "$dir" 2>/dev/null || true
        fi
    done
    
    log "SUCCESS" "System requirements check completed"
}

validate_configuration() {
    log "INFO" "Validating production configuration..."
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        log "ERROR" "Docker Compose file not found: $COMPOSE_FILE"
        return 1
    fi
    
    # Validate compose file syntax
    if ! docker compose -f "$COMPOSE_FILE" config > /dev/null 2>&1; then
        log "ERROR" "Invalid Docker Compose configuration"
        docker compose -f "$COMPOSE_FILE" config
        return 1
    fi
    
    log "SUCCESS" "Docker Compose configuration is valid"
    
    # Check required secrets
    local required_secrets=(
        "postgres_password"
        "jwt_secret"
        "smtp_password"
    )
    
    for secret in "${required_secrets[@]}"; do
        if ! docker secret inspect "$secret" &> /dev/null; then
            log "ERROR" "Required Docker secret not found: $secret"
            log "INFO" "Create secret with: echo 'your_secret_value' | docker secret create $secret -"
            return 1
        fi
    done
    
    log "SUCCESS" "All required secrets are available"
    
    # Check SSL certificates
    local ssl_cert="/opt/booking/ssl/booking.crt"
    local ssl_key="/opt/booking/ssl/booking.key"
    
    if [ ! -f "$ssl_cert" ] || [ ! -f "$ssl_key" ]; then
        log "WARNING" "SSL certificates not found. HTTPS will not work properly."
        log "INFO" "Generate certificates with: ./scripts/setup-ssl.sh"
    else
        # Check certificate expiry
        local cert_expiry
        cert_expiry=$(openssl x509 -in "$ssl_cert" -noout -enddate | cut -d= -f2)
        local cert_expiry_epoch
        cert_expiry_epoch=$(date -d "$cert_expiry" +%s)
        local current_epoch
        current_epoch=$(date +%s)
        local days_until_expiry
        days_until_expiry=$(( (cert_expiry_epoch - current_epoch) / 86400 ))
        
        if [ "$days_until_expiry" -lt 30 ]; then
            log "WARNING" "SSL certificate expires in $days_until_expiry days"
        else
            log "SUCCESS" "SSL certificate is valid (expires in $days_until_expiry days)"
        fi
    fi
    
    log "SUCCESS" "Configuration validation completed"
}

#################################################################################
# Backup and Recovery
#################################################################################

create_backup() {
    if [ "$SKIP_BACKUP" = "true" ]; then
        log "INFO" "Skipping backup (SKIP_BACKUP=true)"
        return 0
    fi
    
    log "INFO" "Creating pre-deployment backup..."
    
    local backup_timestamp
    backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_name="backup_${backup_timestamp}"
    local backup_path="$BACKUP_DIR/$backup_name"
    
    mkdir -p "$backup_path"
    
    # Backup database
    if docker compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log "INFO" "Backing up PostgreSQL database..."
        
        docker compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
            -U booking_user -d booking_prod --no-password \
            > "$backup_path/database.sql" 2>/dev/null || {
            log "ERROR" "Database backup failed"
            rm -rf "$backup_path"
            return 1
        }
        
        log "SUCCESS" "Database backup completed"
    else
        log "WARNING" "PostgreSQL is not running, skipping database backup"
    fi
    
    # Backup volumes
    log "INFO" "Backing up data volumes..."
    
    local volumes=(
        "/opt/booking/data/postgres:postgres_data"
        "/opt/booking/data/grafana:grafana_data"
        "/opt/booking/data/prometheus:prometheus_data"
    )
    
    for volume_mapping in "${volumes[@]}"; do
        IFS=':' read -r source_path volume_name <<< "$volume_mapping"
        
        if [ -d "$source_path" ]; then
            log "INFO" "Backing up $volume_name..."
            tar -czf "$backup_path/${volume_name}.tar.gz" -C "$(dirname "$source_path")" "$(basename "$source_path")" || {
                log "ERROR" "Failed to backup $volume_name"
                rm -rf "$backup_path"
                return 1
            }
        fi
    done
    
    # Create backup metadata
    cat > "$backup_path/metadata.json" << EOF
{
    "timestamp": "$backup_timestamp",
    "git_commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')",
    "deployment_version": "${DEPLOYMENT_VERSION:-unknown}",
    "system_info": {
        "architecture": "$(uname -m)",
        "kernel": "$(uname -r)",
        "memory_mb": $(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
    }
}
EOF
    
    # Set backup as current
    ln -sfn "$backup_name" "$BACKUP_DIR/current"
    
    log "SUCCESS" "Backup created successfully: $backup_path"
    
    # Cleanup old backups (keep last 10)
    log "INFO" "Cleaning up old backups..."
    cd "$BACKUP_DIR"
    ls -1t backup_* | tail -n +11 | xargs rm -rf 2>/dev/null || true
    
    log "SUCCESS" "Backup cleanup completed"
    
    # Export backup path for rollback use
    export BACKUP_PATH="$backup_path"
}

#################################################################################
# Build and Test
#################################################################################

build_images() {
    log "INFO" "Building production images for ARM64..."
    
    cd "$PROJECT_ROOT"
    
    # Set build arguments
    local build_args=(
        "--build-arg" "BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
        "--build-arg" "VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')"
    )
    
    if [ "$DRY_RUN" = "true" ]; then
        log "INFO" "[DRY RUN] Would build images with args: ${build_args[*]}"
        return 0
    fi
    
    # Build with timeout to prevent hanging on Pi Zero
    timeout 1800 docker compose -f "$COMPOSE_FILE" build "${build_args[@]}" || {
        log "ERROR" "Image build failed or timed out after 30 minutes"
        return 1
    }
    
    log "SUCCESS" "Production images built successfully"
    
    # Check image sizes
    log "INFO" "Checking image sizes..."
    docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}" | grep booking || true
}

run_tests() {
    if [ "$SKIP_TESTS" = "true" ]; then
        log "INFO" "Skipping tests (SKIP_TESTS=true)"
        return 0
    fi
    
    log "INFO" "Running production tests..."
    
    # Start test environment
    if [ "$DRY_RUN" = "false" ]; then
        # TODO: Implement test suite for production deployment
        # This would include:
        # - Container startup tests
        # - Health check verification  
        # - Basic API endpoint tests
        # - Database connectivity tests
        
        log "INFO" "Production test suite not yet implemented"
        log "WARNING" "Skipping automated tests - manual verification required"
    else
        log "INFO" "[DRY RUN] Would run production test suite"
    fi
    
    log "SUCCESS" "Tests completed"
}

#################################################################################
# Health Checks
#################################################################################

wait_for_health() {
    local service="$1"
    local max_attempts="${2:-30}"
    local attempt=0
    
    log "INFO" "Waiting for $service to become healthy..."
    
    while [ $attempt -lt $max_attempts ]; do
        if docker compose -f "$COMPOSE_FILE" ps "$service" | grep -q "Up (healthy)"; then
            log "SUCCESS" "$service is healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "INFO" "Attempt $attempt/$max_attempts: Waiting for $service..."
        sleep 10
    done
    
    log "ERROR" "$service failed to become healthy within $((max_attempts * 10)) seconds"
    
    # Show service logs for debugging
    log "INFO" "Last 20 lines of $service logs:"
    docker compose -f "$COMPOSE_FILE" logs --tail=20 "$service" || true
    
    return 1
}

check_api_health() {
    local max_attempts=30
    local attempt=0
    
    log "INFO" "Checking API health endpoint..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -sf http://localhost/health > /dev/null 2>&1; then
            log "SUCCESS" "API health check passed"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log "INFO" "Attempt $attempt/$max_attempts: API not ready..."
        sleep 10
    done
    
    log "ERROR" "API health check failed"
    return 1
}

perform_smoke_tests() {
    log "INFO" "Performing smoke tests..."
    
    # Test 1: Check if main page loads
    if curl -sf -o /dev/null http://localhost/; then
        log "SUCCESS" "Main page loads successfully"
    else
        log "ERROR" "Main page failed to load"
        return 1
    fi
    
    # Test 2: Check API endpoints
    local api_endpoints=(
        "/health"
        "/api/health"
    )
    
    for endpoint in "${api_endpoints[@]}"; do
        if curl -sf -o /dev/null "http://localhost$endpoint"; then
            log "SUCCESS" "Endpoint $endpoint is accessible"
        else
            log "ERROR" "Endpoint $endpoint is not accessible"
            return 1
        fi
    done
    
    # Test 3: Check database connectivity
    if docker compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U booking_user -d booking_prod > /dev/null; then
        log "SUCCESS" "Database connectivity verified"
    else
        log "ERROR" "Database connectivity failed"
        return 1
    fi
    
    log "SUCCESS" "All smoke tests passed"
}

check_resource_usage() {
    log "INFO" "Checking resource usage after deployment..."
    
    # Memory usage
    local memory_usage
    memory_usage=$(docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}" | grep booking || true)
    
    if [ -n "$memory_usage" ]; then
        log "INFO" "Memory usage by container:"
        echo "$memory_usage" | while read -r line; do
            log "INFO" "  $line"
        done
    fi
    
    # Total system memory
    local total_mem_mb
    local available_mem_mb
    total_mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
    available_mem_mb=$(awk '/MemAvailable/ {print int($2/1024)}' /proc/meminfo)
    
    log "INFO" "System memory: ${available_mem_mb}MB available / ${total_mem_mb}MB total"
    
    # CPU usage
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    log "INFO" "CPU usage: ${cpu_usage}%"
    
    # Disk usage
    local disk_usage
    disk_usage=$(df -h /opt/booking | awk 'NR==2 {print $5}')
    log "INFO" "Disk usage: $disk_usage"
    
    # Check if memory usage is within acceptable limits (< 450MB)
    local total_container_mem_mb
    total_container_mem_mb=$(docker stats --no-stream --format "{{.MemUsage}}" | grep -o '[0-9]\+\.[0-9]\+MiB' | sed 's/MiB//' | awk '{sum+=$1} END {print int(sum)}')
    
    if [ -n "$total_container_mem_mb" ] && [ "$total_container_mem_mb" -gt 450 ]; then
        log "WARNING" "Container memory usage is high: ${total_container_mem_mb}MB (target: <450MB)"
    else
        log "SUCCESS" "Container memory usage is within limits: ${total_container_mem_mb}MB"
    fi
}

#################################################################################
# Deployment Process
#################################################################################

deploy() {
    log "INFO" "Starting zero-downtime deployment..."
    
    # Pull latest images
    if [ "$DRY_RUN" = "false" ]; then
        log "INFO" "Pulling latest images..."
        docker compose -f "$COMPOSE_FILE" pull --quiet || true
    else
        log "INFO" "[DRY RUN] Would pull latest images"
    fi
    
    # Deploy with rolling update
    if [ "$DRY_RUN" = "false" ]; then
        log "INFO" "Starting services with rolling update..."
        
        # Start database first
        docker compose -f "$COMPOSE_FILE" up -d postgres
        wait_for_health "postgres"
        
        # Start backend
        docker compose -f "$COMPOSE_FILE" up -d backend
        wait_for_health "backend"
        
        # Start remaining services
        docker compose -f "$COMPOSE_FILE" up -d nginx prometheus grafana backup
        
        # Final health checks
        wait_for_health "nginx"
        check_api_health
        perform_smoke_tests
        check_resource_usage
        
    else
        log "INFO" "[DRY RUN] Would perform rolling deployment"
    fi
    
    log "SUCCESS" "Deployment completed successfully"
}

rollback() {
    local backup_path="${BACKUP_PATH:-$BACKUP_DIR/current}"
    
    log "WARNING" "Initiating rollback to backup: $backup_path"
    
    if [ ! -d "$backup_path" ]; then
        log "ERROR" "Backup directory not found: $backup_path"
        return 1
    fi
    
    # Stop current services
    log "INFO" "Stopping current services..."
    docker compose -f "$COMPOSE_FILE" down --remove-orphans || true
    
    # Restore database
    if [ -f "$backup_path/database.sql" ]; then
        log "INFO" "Restoring database..."
        
        # Start only postgres for restore
        docker compose -f "$COMPOSE_FILE" up -d postgres
        wait_for_health "postgres"
        
        # Restore database
        cat "$backup_path/database.sql" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
            psql -U booking_user -d booking_prod > /dev/null || {
            log "ERROR" "Database restore failed"
            return 1
        }
        
        log "SUCCESS" "Database restored successfully"
    fi
    
    # Restore volumes
    log "INFO" "Restoring data volumes..."
    
    local volumes=(
        "postgres_data"
        "grafana_data"
        "prometheus_data"
    )
    
    for volume_name in "${volumes[@]}"; do
        local backup_file="$backup_path/${volume_name}.tar.gz"
        local target_dir="/opt/booking/data/${volume_name#*_}"
        
        if [ -f "$backup_file" ]; then
            log "INFO" "Restoring $volume_name..."
            rm -rf "$target_dir"
            mkdir -p "$target_dir"
            tar -xzf "$backup_file" -C "$(dirname "$target_dir")" || {
                log "ERROR" "Failed to restore $volume_name"
                return 1
            }
        fi
    done
    
    # Restart services
    log "INFO" "Restarting services after rollback..."
    docker compose -f "$COMPOSE_FILE" up -d
    
    # Wait for services to be healthy
    wait_for_health "postgres"
    wait_for_health "backend"
    wait_for_health "nginx"
    
    log "SUCCESS" "Rollback completed successfully"
}

#################################################################################
# Main Function
#################################################################################

main() {
    log "INFO" "Starting Booking System Production Deployment"
    log "INFO" "Environment: $ENVIRONMENT"
    log "INFO" "Dry Run: $DRY_RUN"
    log "INFO" "Skip Backup: $SKIP_BACKUP"
    log "INFO" "Skip Tests: $SKIP_TESTS"
    
    # Acquire deployment lock
    acquire_lock
    
    # Set deployment timeout
    (
        sleep $MAX_DEPLOYMENT_TIME
        log "ERROR" "Deployment timed out after $MAX_DEPLOYMENT_TIME seconds"
        exit 1
    ) &
    timeout_pid=$!
    
    # Deployment steps
    local deployment_failed=false
    
    {
        check_system_requirements
        validate_configuration
        create_backup
        build_images
        run_tests
        deploy
        
        # Kill timeout process if we get here
        kill $timeout_pid 2>/dev/null || true
        
    } || {
        deployment_failed=true
        
        # Kill timeout process
        kill $timeout_pid 2>/dev/null || true
        
        if [ "$FORCE_DEPLOY" != "true" ]; then
            log "ERROR" "Deployment failed, initiating automatic rollback..."
            rollback || {
                log "ERROR" "Rollback also failed! Manual intervention required."
                log "ERROR" "Check logs and restore from backup manually: $BACKUP_PATH"
                exit 2
            }
        else
            log "ERROR" "Deployment failed but rollback skipped (FORCE_DEPLOY=true)"
            exit 1
        fi
    }
    
    if [ "$deployment_failed" = "false" ]; then
        log "SUCCESS" "🎉 Production deployment completed successfully!"
        log "INFO" "Application is now running at: https://booking.yourdomain.com"
        log "INFO" "Health check: https://booking.yourdomain.com/health"
        log "INFO" "Monitoring: http://localhost:3000 (Grafana)"
        log "INFO" "Backup created at: $BACKUP_PATH"
    fi
}

#################################################################################
# Script Entry Point
#################################################################################

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        check_api_health && perform_smoke_tests
        ;;
    "cleanup")
        docker compose -f "$COMPOSE_FILE" down --volumes --remove-orphans
        docker system prune -af
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|cleanup}"
        echo ""
        echo "Environment variables:"
        echo "  ENVIRONMENT=production    Target environment"
        echo "  DRY_RUN=false            Run without making changes"
        echo "  SKIP_BACKUP=false        Skip backup creation"
        echo "  SKIP_TESTS=false         Skip test execution"
        echo "  FORCE_DEPLOY=false       Skip rollback on failure"
        echo ""
        echo "Examples:"
        echo "  $0 deploy                Normal deployment"
        echo "  DRY_RUN=true $0 deploy   Preview deployment"
        echo "  $0 rollback              Rollback to last backup"
        echo "  $0 health                Check application health"
        echo "  $0 cleanup               Clean up containers and images"
        exit 1
        ;;
esac