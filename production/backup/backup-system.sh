#!/bin/bash
# Comprehensive Backup and Recovery System für Booking System
# Optimiert für Raspberry Pi Zero 2 W mit minimaler I/O-Belastung

set -euo pipefail

# =============================================================================
# CONFIGURATION
# =============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="/var/backups/booking"
BACKUP_RETENTION_DAYS=30
BACKUP_RETENTION_WEEKS=12
BACKUP_RETENTION_MONTHS=12

# Database Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="booking_production"
DB_USER="booking_user"
DB_PASSWORD_FILE="/run/secrets/postgres_password"

# Compression Settings (optimiert für Pi Zero CPU)
COMPRESSION_LEVEL=6  # Balance zwischen CPU und Speicher
COMPRESSION_CMD="gzip -${COMPRESSION_LEVEL}"
COMPRESSION_EXT=".gz"

# Remote Backup Configuration (optional)
REMOTE_BACKUP_ENABLED=false
REMOTE_HOST=""
REMOTE_USER=""
REMOTE_PATH=""
REMOTE_KEY_FILE=""

# Notification Configuration
NOTIFICATION_EMAIL=""
SLACK_WEBHOOK=""

# =============================================================================
# LOGGING
# =============================================================================
LOG_FILE="/var/log/booking-backup.log"
SYSLOG_TAG="booking-backup"

log_info() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [INFO] $message" | tee -a "$LOG_FILE"
    logger -t "$SYSLOG_TAG" -p local0.info "$message"
}

log_error() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [ERROR] $message" | tee -a "$LOG_FILE" >&2
    logger -t "$SYSLOG_TAG" -p local0.err "$message"
}

log_warning() {
    local message="$1"
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [WARNING] $message" | tee -a "$LOG_FILE"
    logger -t "$SYSLOG_TAG" -p local0.warning "$message"
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================
check_requirements() {
    local missing_tools=()
    
    # Check required tools
    for tool in docker pg_dump gzip tar; do
        if ! command -v "$tool" >/dev/null 2>&1; then
            missing_tools+=("$tool")
        fi
    done
    
    if [[ ${#missing_tools[@]} -gt 0 ]]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        return 1
    fi
    
    # Check backup directory
    if [[ ! -d "$BACKUP_BASE_DIR" ]]; then
        log_info "Creating backup directory: $BACKUP_BASE_DIR"
        mkdir -p "$BACKUP_BASE_DIR"/{daily,weekly,monthly,logs}
    fi
    
    # Check disk space (Warnung bei <1GB freier Speicher)
    local available_space
    available_space=$(df "$BACKUP_BASE_DIR" | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 1048576 ]]; then  # 1GB in KB
        log_warning "Low disk space: Only ${available_space}KB available"
    fi
    
    return 0
}

get_db_password() {
    if [[ -f "$DB_PASSWORD_FILE" ]]; then
        cat "$DB_PASSWORD_FILE"
    else
        log_error "Database password file not found: $DB_PASSWORD_FILE"
        return 1
    fi
}

create_timestamp() {
    date '+%Y%m%d_%H%M%S'
}

calculate_file_size() {
    local file="$1"
    if [[ -f "$file" ]]; then
        stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null || echo "0"
    else
        echo "0"
    fi
}

send_notification() {
    local subject="$1"
    local message="$2"
    local severity="${3:-info}"
    
    # Email notification
    if [[ -n "$NOTIFICATION_EMAIL" ]]; then
        echo "$message" | mail -s "[$severity] $subject" "$NOTIFICATION_EMAIL" || true
    fi
    
    # Slack notification
    if [[ -n "$SLACK_WEBHOOK" ]]; then
        local color="good"
        [[ "$severity" == "error" ]] && color="danger"
        [[ "$severity" == "warning" ]] && color="warning"
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"$subject\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK" >/dev/null 2>&1 || true
    fi
}

# =============================================================================
# BACKUP FUNCTIONS
# =============================================================================
backup_database() {
    local backup_type="$1"
    local timestamp="$2"
    local backup_dir="$BACKUP_BASE_DIR/$backup_type"
    local backup_file="$backup_dir/db_backup_${timestamp}.sql${COMPRESSION_EXT}"
    
    log_info "Starting database backup ($backup_type)"
    
    # Get database password
    local db_password
    db_password=$(get_db_password) || return 1
    
    # Create database dump with optimized settings für Pi Zero
    PGPASSWORD="$db_password" pg_dump \
        --host="$DB_HOST" \
        --port="$DB_PORT" \
        --username="$DB_USER" \
        --dbname="$DB_NAME" \
        --verbose \
        --format=custom \
        --compress=0 \
        --no-owner \
        --no-privileges \
        --exclude-table='event_store_events_old*' \
        --exclude-table='log_*' \
        | $COMPRESSION_CMD > "$backup_file"
    
    if [[ $? -eq 0 ]]; then
        local file_size
        file_size=$(calculate_file_size "$backup_file")
        log_info "Database backup completed: $backup_file (${file_size} bytes)"
        return 0
    else
        log_error "Database backup failed"
        return 1
    fi
}

backup_application_data() {
    local backup_type="$1"
    local timestamp="$2"
    local backup_dir="$BACKUP_BASE_DIR/$backup_type"
    local backup_file="$backup_dir/app_data_${timestamp}.tar${COMPRESSION_EXT}"
    
    log_info "Starting application data backup ($backup_type)"
    
    # Define paths to backup
    local paths_to_backup=(
        "/var/lib/booking/logs"
        "/var/lib/booking/ssl"
        "/var/lib/booking/config"
        "/var/lib/booking/uploads"  # Falls User-Uploads existieren
    )
    
    # Create tar archive with compression
    tar -czf "$backup_file" \
        --exclude='*.log.*.gz' \
        --exclude='*/tmp/*' \
        --exclude='*/cache/*' \
        "${paths_to_backup[@]}" 2>/dev/null || true
    
    if [[ -f "$backup_file" ]]; then
        local file_size
        file_size=$(calculate_file_size "$backup_file")
        log_info "Application data backup completed: $backup_file (${file_size} bytes)"
        return 0
    else
        log_error "Application data backup failed"
        return 1
    fi
}

backup_docker_volumes() {
    local backup_type="$1"
    local timestamp="$2"
    local backup_dir="$BACKUP_BASE_DIR/$backup_type"
    local backup_file="$backup_dir/docker_volumes_${timestamp}.tar${COMPRESSION_EXT}"
    
    log_info "Starting Docker volumes backup ($backup_type)"
    
    # Stop containers gracefully for consistent backup
    log_info "Stopping containers for consistent backup..."
    docker compose -f /opt/booking/production/docker-compose.production.yml stop
    
    # Backup Docker volumes
    docker run --rm \
        -v /var/lib/docker/volumes:/backup-source:ro \
        -v "$backup_dir":/backup-dest \
        alpine:latest \
        tar -czf "/backup-dest/docker_volumes_${timestamp}.tar${COMPRESSION_EXT}" \
        -C /backup-source \
        booking_postgres_data
    
    # Restart containers
    log_info "Restarting containers..."
    docker compose -f /opt/booking/production/docker-compose.production.yml start
    
    if [[ -f "$backup_file" ]]; then
        local file_size
        file_size=$(calculate_file_size "$backup_file")
        log_info "Docker volumes backup completed: $backup_file (${file_size} bytes)"
        return 0
    else
        log_error "Docker volumes backup failed"
        return 1
    fi
}

# =============================================================================
# BACKUP EXECUTION
# =============================================================================
perform_backup() {
    local backup_type="$1"
    local timestamp
    timestamp=$(create_timestamp)
    
    log_info "Starting $backup_type backup at $(date)"
    
    local success=true
    local backup_summary=""
    
    # Database Backup
    if backup_database "$backup_type" "$timestamp"; then
        backup_summary+="✓ Database backup successful\n"
    else
        backup_summary+="✗ Database backup failed\n"
        success=false
    fi
    
    # Application Data Backup
    if backup_application_data "$backup_type" "$timestamp"; then
        backup_summary+="✓ Application data backup successful\n"
    else
        backup_summary+="✗ Application data backup failed\n"
        success=false
    fi
    
    # Docker Volumes Backup (nur bei weekly/monthly)
    if [[ "$backup_type" != "daily" ]]; then
        if backup_docker_volumes "$backup_type" "$timestamp"; then
            backup_summary+="✓ Docker volumes backup successful\n"
        else
            backup_summary+="✗ Docker volumes backup failed\n"
            success=false
        fi
    fi
    
    # Remote Backup (falls konfiguriert)
    if [[ "$REMOTE_BACKUP_ENABLED" == "true" ]]; then
        if perform_remote_backup "$backup_type" "$timestamp"; then
            backup_summary+="✓ Remote backup successful\n"
        else
            backup_summary+="✗ Remote backup failed\n"
            success=false
        fi
    fi
    
    # Cleanup old backups
    cleanup_old_backups "$backup_type"
    
    # Send notification
    local severity="info"
    [[ "$success" == "false" ]] && severity="error"
    
    local subject="Booking System Backup ($backup_type)"
    local message="Backup completed at $(date)\n\nSummary:\n$backup_summary"
    
    send_notification "$subject" "$message" "$severity"
    
    log_info "$backup_type backup completed (success: $success)"
    return $([[ "$success" == "true" ]] && echo 0 || echo 1)
}

# =============================================================================
# REMOTE BACKUP
# =============================================================================
perform_remote_backup() {
    local backup_type="$1"
    local timestamp="$2"
    
    if [[ "$REMOTE_BACKUP_ENABLED" != "true" ]]; then
        return 0
    fi
    
    log_info "Starting remote backup ($backup_type)"
    
    local local_dir="$BACKUP_BASE_DIR/$backup_type"
    local remote_dir="$REMOTE_PATH/$backup_type"
    
    # Sync backups to remote location
    rsync -avz --progress \
        -e "ssh -i $REMOTE_KEY_FILE -o StrictHostKeyChecking=no" \
        "$local_dir/" \
        "$REMOTE_USER@$REMOTE_HOST:$remote_dir/" \
        >> "$LOG_FILE" 2>&1
    
    if [[ $? -eq 0 ]]; then
        log_info "Remote backup completed successfully"
        return 0
    else
        log_error "Remote backup failed"
        return 1
    fi
}

# =============================================================================
# CLEANUP
# =============================================================================
cleanup_old_backups() {
    local backup_type="$1"
    local backup_dir="$BACKUP_BASE_DIR/$backup_type"
    local retention_days
    
    case "$backup_type" in
        "daily")
            retention_days=$BACKUP_RETENTION_DAYS
            ;;
        "weekly")
            retention_days=$((BACKUP_RETENTION_WEEKS * 7))
            ;;
        "monthly")
            retention_days=$((BACKUP_RETENTION_MONTHS * 30))
            ;;
        *)
            log_warning "Unknown backup type: $backup_type"
            return 1
            ;;
    esac
    
    log_info "Cleaning up old $backup_type backups (retention: $retention_days days)"
    
    # Find and delete old backup files
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        log_info "Deleted old backup: $(basename "$file")"
    done < <(find "$backup_dir" -name "*.sql.gz" -o -name "*.tar.gz" -type f -mtime +$retention_days -print0 2>/dev/null)
    
    log_info "Cleanup completed: $deleted_count files deleted"
}

# =============================================================================
# RECOVERY FUNCTIONS
# =============================================================================
restore_database() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Starting database restore from: $backup_file"
    
    # Get database password
    local db_password
    db_password=$(get_db_password) || return 1
    
    # Stop application containers
    log_info "Stopping application containers..."
    docker compose -f /opt/booking/production/docker-compose.production.yml stop backend frontend
    
    # Restore database
    if [[ "$backup_file" == *.gz ]]; then
        gunzip -c "$backup_file" | PGPASSWORD="$db_password" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$DB_NAME" \
            --quiet
    else
        PGPASSWORD="$db_password" psql \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            --dbname="$DB_NAME" \
            --quiet \
            < "$backup_file"
    fi
    
    if [[ $? -eq 0 ]]; then
        log_info "Database restore completed successfully"
        
        # Restart containers
        log_info "Restarting application containers..."
        docker compose -f /opt/booking/production/docker-compose.production.yml start backend frontend
        
        return 0
    else
        log_error "Database restore failed"
        return 1
    fi
}

list_backups() {
    local backup_type="${1:-all}"
    
    echo "==================== BACKUP INVENTORY ===================="
    
    for type in daily weekly monthly; do
        if [[ "$backup_type" == "all" || "$backup_type" == "$type" ]]; then
            echo ""
            echo "[$type backups]"
            local backup_dir="$BACKUP_BASE_DIR/$type"
            
            if [[ -d "$backup_dir" ]]; then
                find "$backup_dir" -name "*.sql.gz" -o -name "*.tar.gz" | sort | while read -r file; do
                    local size
                    size=$(calculate_file_size "$file")
                    local date_created
                    date_created=$(stat -f%Sm -t '%Y-%m-%d %H:%M:%S' "$file" 2>/dev/null || stat -c%y "$file" 2>/dev/null | cut -d' ' -f1,2)
                    printf "  %-40s %10s bytes  %s\n" "$(basename "$file")" "$size" "$date_created"
                done
            else
                echo "  No backups found"
            fi
        fi
    done
    
    echo ""
    echo "=========================================================="
}

# =============================================================================
# HEALTH CHECKS
# =============================================================================
verify_backup_integrity() {
    local backup_file="$1"
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Verifying backup integrity: $backup_file"
    
    # Test compression integrity
    if [[ "$backup_file" == *.gz ]]; then
        if ! gunzip -t "$backup_file" 2>/dev/null; then
            log_error "Backup file is corrupted (compression test failed)"
            return 1
        fi
    fi
    
    # For SQL backups, test if it's valid SQL
    if [[ "$backup_file" == *sql* ]]; then
        local temp_db="booking_verify_$$"
        local db_password
        db_password=$(get_db_password) || return 1
        
        # Create temporary database
        PGPASSWORD="$db_password" createdb \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            "$temp_db" 2>/dev/null
        
        # Test restore to temporary database
        local restore_success=false
        if [[ "$backup_file" == *.gz ]]; then
            if gunzip -c "$backup_file" | PGPASSWORD="$db_password" psql \
                --host="$DB_HOST" \
                --port="$DB_PORT" \
                --username="$DB_USER" \
                --dbname="$temp_db" \
                --quiet >/dev/null 2>&1; then
                restore_success=true
            fi
        else
            if PGPASSWORD="$db_password" psql \
                --host="$DB_HOST" \
                --port="$DB_PORT" \
                --username="$DB_USER" \
                --dbname="$temp_db" \
                --quiet \
                < "$backup_file" >/dev/null 2>&1; then
                restore_success=true
            fi
        fi
        
        # Cleanup temporary database
        PGPASSWORD="$db_password" dropdb \
            --host="$DB_HOST" \
            --port="$DB_PORT" \
            --username="$DB_USER" \
            "$temp_db" 2>/dev/null
        
        if [[ "$restore_success" == "true" ]]; then
            log_info "Backup integrity verification passed"
            return 0
        else
            log_error "Backup integrity verification failed"
            return 1
        fi
    fi
    
    log_info "Backup integrity verification completed"
    return 0
}

# =============================================================================
# MAIN COMMAND HANDLING
# =============================================================================
show_help() {
    cat << EOF
Booking System Backup and Recovery Tool

Usage: $0 <command> [options]

Commands:
  daily              Perform daily backup
  weekly             Perform weekly backup  
  monthly            Perform monthly backup
  
  list [type]        List available backups (daily|weekly|monthly|all)
  restore <file>     Restore database from backup file
  verify <file>      Verify backup file integrity
  
  cleanup <type>     Manual cleanup of old backups
  test               Test backup system configuration
  
Options:
  -h, --help         Show this help message
  -v, --verbose      Enable verbose logging

Examples:
  $0 daily           # Perform daily backup
  $0 list weekly     # List weekly backups
  $0 restore /var/backups/booking/daily/db_backup_20240801_120000.sql.gz
  $0 verify /var/backups/booking/daily/db_backup_20240801_120000.sql.gz
  $0 cleanup daily   # Clean up old daily backups

Backup Schedule (recommended crontab entries):
  # Daily backup at 2:00 AM
  0 2 * * * /opt/booking/production/backup/backup-system.sh daily
  
  # Weekly backup on Sunday at 3:00 AM  
  0 3 * * 0 /opt/booking/production/backup/backup-system.sh weekly
  
  # Monthly backup on 1st day at 4:00 AM
  0 4 1 * * /opt/booking/production/backup/backup-system.sh monthly

EOF
}

test_configuration() {
    log_info "Testing backup system configuration..."
    
    local tests_passed=0
    local tests_total=0
    
    # Test 1: Check requirements
    ((tests_total++))
    if check_requirements; then
        log_info "✓ Requirements check passed"
        ((tests_passed++))
    else
        log_error "✗ Requirements check failed"
    fi
    
    # Test 2: Database connectivity
    ((tests_total++))
    local db_password
    if db_password=$(get_db_password) && \
       PGPASSWORD="$db_password" pg_isready \
           --host="$DB_HOST" \
           --port="$DB_PORT" \
           --username="$DB_USER" \
           --dbname="$DB_NAME" >/dev/null 2>&1; then
        log_info "✓ Database connectivity test passed"
        ((tests_passed++))
    else
        log_error "✗ Database connectivity test failed"
    fi
    
    # Test 3: Docker connectivity
    ((tests_total++))
    if docker info >/dev/null 2>&1; then
        log_info "✓ Docker connectivity test passed"
        ((tests_passed++))
    else
        log_error "✗ Docker connectivity test failed"
    fi
    
    # Test 4: Backup directory permissions
    ((tests_total++))
    if [[ -w "$BACKUP_BASE_DIR" ]]; then
        log_info "✓ Backup directory permissions test passed"
        ((tests_passed++))
    else
        log_error "✗ Backup directory permissions test failed"
    fi
    
    # Test 5: Remote backup (wenn aktiviert)
    if [[ "$REMOTE_BACKUP_ENABLED" == "true" ]]; then
        ((tests_total++))
        if ssh -i "$REMOTE_KEY_FILE" -o ConnectTimeout=10 -o BatchMode=yes \
               "$REMOTE_USER@$REMOTE_HOST" "exit" >/dev/null 2>&1; then
            log_info "✓ Remote backup connectivity test passed"
            ((tests_passed++))
        else
            log_error "✗ Remote backup connectivity test failed"
        fi
    fi
    
    echo ""
    echo "Test Results: $tests_passed/$tests_total tests passed"
    
    if [[ $tests_passed -eq $tests_total ]]; then
        log_info "All tests passed! Backup system is ready."
        return 0
    else
        log_error "Some tests failed. Please fix the issues before using the backup system."
        return 1
    fi
}

main() {
    # Initialize logging
    mkdir -p "$(dirname "$LOG_FILE")"
    
    case "${1:-help}" in
        "daily"|"weekly"|"monthly")
            check_requirements || exit 1
            perform_backup "$1"
            ;;
        "list")
            list_backups "${2:-all}"
            ;;
        "restore")
            if [[ -z "${2:-}" ]]; then
                log_error "Please specify a backup file to restore"
                exit 1
            fi
            check_requirements || exit 1
            restore_database "$2"
            ;;
        "verify")
            if [[ -z "${2:-}" ]]; then
                log_error "Please specify a backup file to verify"
                exit 1
            fi
            check_requirements || exit 1
            verify_backup_integrity "$2"
            ;;
        "cleanup")
            if [[ -z "${2:-}" ]]; then
                log_error "Please specify backup type to cleanup (daily|weekly|monthly)"
                exit 1
            fi
            cleanup_old_backups "$2"
            ;;
        "test")
            test_configuration
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Make script executable if not already
chmod +x "$0" 2>/dev/null || true

main "$@"