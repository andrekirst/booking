#!/bin/bash

# Data Migration Script for Booking System
# Handles data migration between different database instances and environments

set -euo pipefail

# Configuration
SOURCE_DB_TYPE="docker"  # docker, kubernetes, external
TARGET_DB_TYPE="kubernetes"  # kubernetes, external
NAMESPACE="booking-system"
MIGRATION_DIR="./migration-data-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Agent database mapping
declare -A AGENTS=(
    ["agent2"]="booking_agent2"
    ["agent3"]="booking_agent3"
    ["agent4"]="booking_agent4"
    ["sub-s1"]="booking_sub_s1"
    ["sub-s2"]="booking_sub_s2"
    ["sub-s3"]="booking_sub_s3"
    ["sub-s4"]="booking_sub_s4"
    ["sub-s5"]="booking_sub_s5"
    ["sub-s6"]="booking_sub_s6"
)

# Create migration directory
create_migration_dir() {
    log_info "Creating migration directory: $MIGRATION_DIR"
    mkdir -p "$MIGRATION_DIR"/{dumps,logs,scripts}
}

# Export data from Docker containers
export_from_docker() {
    local agent=$1
    local db_name=${AGENTS[$agent]}
    local container_name="booking-postgres-${agent}"
    
    log_info "Exporting data from Docker container: $container_name"
    
    if ! docker ps -q -f name="$container_name" | grep -q .; then
        log_warning "Container $container_name not found or not running"
        return 1
    fi
    
    # Create database dump
    docker exec "$container_name" pg_dump \
        -U booking_user \
        -d "$db_name" \
        --clean \
        --if-exists \
        --create \
        --verbose \
        > "$MIGRATION_DIR/dumps/${agent}_export.sql" 2> "$MIGRATION_DIR/logs/${agent}_export.log"
    
    # Export schema only
    docker exec "$container_name" pg_dump \
        -U booking_user \
        -d "$db_name" \
        --schema-only \
        --clean \
        --if-exists \
        --create \
        > "$MIGRATION_DIR/dumps/${agent}_schema.sql" 2> "$MIGRATION_DIR/logs/${agent}_schema.log"
    
    # Export data only
    docker exec "$container_name" pg_dump \
        -U booking_user \
        -d "$db_name" \
        --data-only \
        --disable-triggers \
        > "$MIGRATION_DIR/dumps/${agent}_data.sql" 2> "$MIGRATION_DIR/logs/${agent}_data.log"
    
    log_success "Data exported for $agent"
    return 0
}

# Export data from Kubernetes
export_from_kubernetes() {
    local agent=$1
    local db_name=${AGENTS[$agent]}
    local pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$pod_name" ]; then
        log_warning "PostgreSQL pod for $agent not found in Kubernetes"
        return 1
    fi
    
    log_info "Exporting data from Kubernetes pod: $pod_name"
    
    # Create database dump
    kubectl exec -n $NAMESPACE "$pod_name" -- pg_dump \
        -U booking_user \
        -d "$db_name" \
        --clean \
        --if-exists \
        --create \
        --verbose \
        > "$MIGRATION_DIR/dumps/${agent}_export.sql" 2> "$MIGRATION_DIR/logs/${agent}_export.log"
    
    # Export schema only
    kubectl exec -n $NAMESPACE "$pod_name" -- pg_dump \
        -U booking_user \
        -d "$db_name" \
        --schema-only \
        --clean \
        --if-exists \
        --create \
        > "$MIGRATION_DIR/dumps/${agent}_schema.sql" 2> "$MIGRATION_DIR/logs/${agent}_schema.log"
    
    # Export data only
    kubectl exec -n $NAMESPACE "$pod_name" -- pg_dump \
        -U booking_user \
        -d "$db_name" \
        --data-only \
        --disable-triggers \
        > "$MIGRATION_DIR/dumps/${agent}_data.sql" 2> "$MIGRATION_DIR/logs/${agent}_data.log"
    
    log_success "Data exported for $agent"
    return 0
}

# Import data to Kubernetes
import_to_kubernetes() {
    local agent=$1
    local db_name=${AGENTS[$agent]}
    local pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}')
    
    if [ -z "$pod_name" ]; then
        log_error "PostgreSQL pod for $agent not found in Kubernetes"
        return 1
    fi
    
    local dump_file="$MIGRATION_DIR/dumps/${agent}_export.sql"
    if [ ! -f "$dump_file" ]; then
        log_error "Dump file not found: $dump_file"
        return 1
    fi
    
    log_info "Importing data to Kubernetes pod: $pod_name"
    
    # Copy dump file to pod
    kubectl cp "$dump_file" "$NAMESPACE/$pod_name:/tmp/${agent}_import.sql"
    
    # Import data
    kubectl exec -n $NAMESPACE "$pod_name" -- psql \
        -U booking_user \
        -d postgres \
        -f "/tmp/${agent}_import.sql" \
        > "$MIGRATION_DIR/logs/${agent}_import.log" 2>&1
    
    # Verify import
    local table_count=$(kubectl exec -n $NAMESPACE "$pod_name" -- psql \
        -U booking_user \
        -d "$db_name" \
        -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d ' ')
    
    log_info "Tables imported for $agent: $table_count"
    
    # Clean up temporary file
    kubectl exec -n $NAMESPACE "$pod_name" -- rm -f "/tmp/${agent}_import.sql"
    
    log_success "Data imported for $agent"
    return 0
}

# Validate data integrity
validate_data() {
    local agent=$1
    local db_name=${AGENTS[$agent]}
    
    log_info "Validating data integrity for $agent"
    
    # Get target database info
    if [ "$TARGET_DB_TYPE" == "kubernetes" ]; then
        local pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}')
        
        if [ -z "$pod_name" ]; then
            log_error "Cannot validate: PostgreSQL pod for $agent not found"
            return 1
        fi
        
        # Count records in main tables
        local user_count=$(kubectl exec -n $NAMESPACE "$pod_name" -- psql \
            -U booking_user \
            -d "$db_name" \
            -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
        
        local booking_count=$(kubectl exec -n $NAMESPACE "$pod_name" -- psql \
            -U booking_user \
            -d "$db_name" \
            -t -c "SELECT COUNT(*) FROM \"BookingReadModels\";" 2>/dev/null | tr -d ' ' || echo "0")
        
        local accommodation_count=$(kubectl exec -n $NAMESPACE "$pod_name" -- psql \
            -U booking_user \
            -d "$db_name" \
            -t -c "SELECT COUNT(*) FROM \"SleepingAccommodations\";" 2>/dev/null | tr -d ' ' || echo "0")
        
        # Create validation report
        cat >> "$MIGRATION_DIR/validation-report.txt" << EOF
Agent: $agent
Database: $db_name
Users: $user_count
Bookings: $booking_count
Accommodations: $accommodation_count
Status: $([ "$user_count" -gt 0 ] && echo "OK" || echo "WARNING")
---
EOF
        
        log_success "Validation completed for $agent (Users: $user_count, Bookings: $booking_count, Accommodations: $accommodation_count)"
    fi
    
    return 0
}

# Generate migration scripts for schema updates
generate_migration_scripts() {
    log_info "Generating migration scripts..."
    
    # Create schema migration script
    cat > "$MIGRATION_DIR/scripts/apply-schema-updates.sql" << 'EOF'
-- Schema updates for Kubernetes deployment
-- Apply these changes after data migration

-- Update connection limits
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_booking_models_status ON "BookingReadModels"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_accommodations_active ON "SleepingAccommodations"(is_active);

-- Update statistics
ANALYZE;

-- Create monitoring user if not exists
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'monitoring') THEN
      CREATE ROLE monitoring WITH LOGIN PASSWORD 'monitoring_password';
      GRANT CONNECT ON DATABASE current_database() TO monitoring;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring;
      GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO monitoring;
   END IF;
END
$$;
EOF

    # Create cleanup script
    cat > "$MIGRATION_DIR/scripts/cleanup-old-data.sql" << 'EOF'
-- Cleanup script for old/invalid data
-- Run after confirming migration success

-- Remove old migration-related tables if they exist
DROP TABLE IF EXISTS migration_log CASCADE;
DROP TABLE IF EXISTS old_user_sessions CASCADE;

-- Vacuum and analyze
VACUUM ANALYZE;
EOF

    # Create rollback script
    cat > "$MIGRATION_DIR/scripts/rollback-migration.sh" << 'EOF'
#!/bin/bash
# Rollback script for data migration
# WARNING: This will destroy current data and restore backup

set -euo pipefail

NAMESPACE="booking-system"
BACKUP_DIR="$1"

if [ -z "$BACKUP_DIR" ]; then
    echo "Usage: $0 <backup_directory>"
    exit 1
fi

echo "WARNING: This will destroy current database data!"
read -p "Are you sure you want to rollback? (type 'ROLLBACK' to confirm): " confirm

if [ "$confirm" != "ROLLBACK" ]; then
    echo "Rollback cancelled."
    exit 0
fi

# Rollback each agent database
for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
    echo "Rolling back $agent..."
    
    pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}')
    
    if [ -n "$pod_name" ] && [ -f "$BACKUP_DIR/dumps/${agent}_export.sql" ]; then
        kubectl cp "$BACKUP_DIR/dumps/${agent}_export.sql" "$NAMESPACE/$pod_name:/tmp/rollback.sql"
        kubectl exec -n $NAMESPACE "$pod_name" -- psql -U booking_user -d postgres -f "/tmp/rollback.sql"
        kubectl exec -n $NAMESPACE "$pod_name" -- rm -f "/tmp/rollback.sql"
        echo "Rollback completed for $agent"
    else
        echo "Warning: Could not rollback $agent (pod or backup not found)"
    fi
done

echo "Rollback completed."
EOF

    chmod +x "$MIGRATION_DIR/scripts/rollback-migration.sh"
    
    log_success "Migration scripts generated in $MIGRATION_DIR/scripts/"
}

# Main export function
export_data() {
    log_info "Starting data export from $SOURCE_DB_TYPE..."
    
    local success_count=0
    local failed_agents=()
    
    for agent in "${!AGENTS[@]}"; do
        log_info "Processing agent: $agent"
        
        case $SOURCE_DB_TYPE in
            "docker")
                if export_from_docker "$agent"; then
                    ((success_count++))
                else
                    failed_agents+=("$agent")
                fi
                ;;
            "kubernetes")
                if export_from_kubernetes "$agent"; then
                    ((success_count++))
                else
                    failed_agents+=("$agent")
                fi
                ;;
            *)
                log_error "Unsupported source database type: $SOURCE_DB_TYPE"
                return 1
                ;;
        esac
    done
    
    log_success "Export completed: $success_count successful, ${#failed_agents[@]} failed"
    
    if [ ${#failed_agents[@]} -gt 0 ]; then
        log_warning "Failed agents: ${failed_agents[*]}"
    fi
}

# Main import function
import_data() {
    log_info "Starting data import to $TARGET_DB_TYPE..."
    
    local success_count=0
    local failed_agents=()
    
    for agent in "${!AGENTS[@]}"; do
        # Skip if export file doesn't exist
        if [ ! -f "$MIGRATION_DIR/dumps/${agent}_export.sql" ]; then
            log_warning "No export file found for $agent, skipping import"
            continue
        fi
        
        log_info "Importing data for agent: $agent"
        
        case $TARGET_DB_TYPE in
            "kubernetes")
                if import_to_kubernetes "$agent"; then
                    ((success_count++))
                else
                    failed_agents+=("$agent")
                fi
                ;;
            *)
                log_error "Unsupported target database type: $TARGET_DB_TYPE"
                return 1
                ;;
        esac
        
        # Validate imported data
        validate_data "$agent"
    done
    
    log_success "Import completed: $success_count successful, ${#failed_agents[@]} failed"
    
    if [ ${#failed_agents[@]} -gt 0 ]; then
        log_warning "Failed agents: ${failed_agents[*]}"
    fi
}

# Generate final report
generate_report() {
    log_info "Generating migration report..."
    
    cat > "$MIGRATION_DIR/data-migration-report.md" << EOF
# Data Migration Report

**Migration Date:** $(date)
**Source:** $SOURCE_DB_TYPE
**Target:** $TARGET_DB_TYPE
**Migration Directory:** $MIGRATION_DIR

## Migration Summary

### Agents Processed
$(for agent in "${!AGENTS[@]}"; do
    echo "- $agent (${AGENTS[$agent]})"
done)

### Files Generated
- Database dumps in \`dumps/\` directory
- Migration logs in \`logs/\` directory
- Migration scripts in \`scripts/\` directory

### Validation Results
\`\`\`
$(cat "$MIGRATION_DIR/validation-report.txt" 2>/dev/null || echo "No validation data available")
\`\`\`

## Post-Migration Tasks

1. **Apply Schema Updates:**
   \`\`\`bash
   kubectl exec -n $NAMESPACE <postgres-pod> -- psql -U booking_user -d <database> -f /tmp/apply-schema-updates.sql
   \`\`\`

2. **Verify Application Connectivity:**
   - Test each agent's database connectivity
   - Verify data integrity through application UI
   - Check logs for any connection errors

3. **Performance Optimization:**
   - Run ANALYZE on all tables
   - Monitor query performance
   - Adjust connection pool settings if needed

4. **Backup Schedule:**
   - Set up automated backups for Kubernetes databases
   - Configure backup retention policy
   - Test backup restore procedures

## Rollback Instructions

To rollback the migration:
\`\`\`bash
./scripts/rollback-migration.sh $MIGRATION_DIR
\`\`\`

**WARNING:** Rollback will destroy current data and restore from backup.

## Support

For migration issues:
- Check logs in \`$MIGRATION_DIR/logs/\`
- Verify pod status: \`kubectl get pods -n $NAMESPACE\`
- Check database connectivity: \`kubectl exec -n $NAMESPACE <pod> -- pg_isready\`

EOF

    log_success "Migration report generated: $MIGRATION_DIR/data-migration-report.md"
}

# Help function
show_help() {
    cat << EOF
Data Migration Script for Booking System

Usage: $0 [OPTIONS] COMMAND

Commands:
  export      Export data from source database
  import      Import data to target database
  migrate     Full migration (export + import)
  validate    Validate migrated data
  help        Show this help message

Options:
  --source-type TYPE    Source database type (docker, kubernetes, external)
  --target-type TYPE    Target database type (kubernetes, external)
  --namespace NAME      Kubernetes namespace (default: booking-system)
  --agent AGENT         Process specific agent only
  --dry-run            Show what would be done without executing

Examples:
  $0 --source-type docker --target-type kubernetes migrate
  $0 --agent agent2 export
  $0 validate
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --source-type)
            SOURCE_DB_TYPE="$2"
            shift 2
            ;;
        --target-type)
            TARGET_DB_TYPE="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --agent)
            SINGLE_AGENT="$2"
            shift 2
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        export|import|migrate|validate|help)
            COMMAND="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Main execution
main() {
    case "${COMMAND:-}" in
        "export")
            create_migration_dir
            export_data
            generate_migration_scripts
            ;;
        "import")
            import_data
            generate_report
            ;;
        "migrate")
            create_migration_dir
            export_data
            import_data
            generate_migration_scripts
            generate_report
            ;;
        "validate")
            for agent in "${!AGENTS[@]}"; do
                validate_data "$agent"
            done
            ;;
        "help"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: ${COMMAND:-}"
            show_help
            exit 1
            ;;
    esac
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi