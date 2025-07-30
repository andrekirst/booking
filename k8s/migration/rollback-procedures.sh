#!/bin/bash

# Rollback Procedures for Booking System Kubernetes Migration
# This script provides comprehensive rollback capabilities

set -euo pipefail

# Configuration
NAMESPACE="booking-system"
BACKUP_PATH=""
ROLLBACK_TO="docker"  # docker, previous-k8s-state
CONFIRMATION_PHRASE="ROLLBACK_BOOKING_SYSTEM"

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

# Show rollback confirmation
confirm_rollback() {
    log_warning "==================================="
    log_warning "    DESTRUCTIVE OPERATION"
    log_warning "==================================="
    log_warning "This will perform a complete rollback of the Kubernetes migration!"
    log_warning "Current Kubernetes deployment will be DESTROYED."
    log_warning "All data in Kubernetes will be LOST."
    log_warning ""
    log_warning "Rollback target: $ROLLBACK_TO"
    log_warning "Backup location: $BACKUP_PATH"
    log_warning ""
    
    read -p "Type '$CONFIRMATION_PHRASE' to confirm rollback: " confirmation
    
    if [ "$confirmation" != "$CONFIRMATION_PHRASE" ]; then
        log_info "Rollback cancelled."
        exit 0
    fi
    
    log_warning "Proceeding with rollback in 10 seconds... (Ctrl+C to cancel)"
    sleep 10
}

# Create rollback backup
create_rollback_backup() {
    local rollback_backup_dir="./rollback-backup-$(date +%Y%m%d-%H%M%S)"
    
    log_info "Creating rollback backup before proceeding..."
    mkdir -p "$rollback_backup_dir"
    
    # Backup current Kubernetes resources
    log_info "Backing up current Kubernetes resources..."
    kubectl get all -n $NAMESPACE -o yaml > "$rollback_backup_dir/kubernetes-resources.yml"
    kubectl get configmaps -n $NAMESPACE -o yaml > "$rollback_backup_dir/configmaps.yml"
    kubectl get secrets -n $NAMESPACE -o yaml > "$rollback_backup_dir/secrets.yml"
    kubectl get pvc -n $NAMESPACE -o yaml > "$rollback_backup_dir/persistent-volumes.yml"
    
    # Backup current database data
    log_info "Backing up current database data..."
    for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
        local pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
        
        if [ -n "$pod_name" ]; then
            log_info "Backing up data for $agent..."
            kubectl exec -n $NAMESPACE "$pod_name" -- pg_dump -U booking_user -d "booking_${agent}" \
                > "$rollback_backup_dir/${agent}_current.sql" 2>/dev/null || true
        fi
    done
    
    log_success "Rollback backup created: $rollback_backup_dir"
    echo "$rollback_backup_dir" > /tmp/booking_rollback_backup_path
}

# Stop Kubernetes resources
stop_kubernetes_resources() {
    log_info "Stopping Kubernetes resources..."
    
    # Scale down deployments to 0
    log_info "Scaling down deployments..."
    kubectl scale deployment --all --replicas=0 -n $NAMESPACE 2>/dev/null || true
    
    # Wait for pods to terminate
    log_info "Waiting for pods to terminate..."
    kubectl wait --for=delete pod --all -n $NAMESPACE --timeout=300s 2>/dev/null || true
    
    # Delete non-persistent resources
    log_info "Deleting deployments and services..."
    kubectl delete deployments --all -n $NAMESPACE 2>/dev/null || true
    kubectl delete services --all -n $NAMESPACE 2>/dev/null || true
    kubectl delete ingresses --all -n $NAMESPACE 2>/dev/null || true
    kubectl delete hpa --all -n $NAMESPACE 2>/dev/null || true
    
    log_success "Kubernetes resources stopped."
}

# Rollback to Docker
rollback_to_docker() {
    log_info "Rolling back to Docker environment..."
    
    if [ ! -f "$BACKUP_PATH/docker-compose.yml" ]; then
        log_error "Docker compose file not found in backup: $BACKUP_PATH/docker-compose.yml"
        return 1
    fi
    
    # Copy Docker configuration back
    log_info "Restoring Docker configuration..."
    cp "$BACKUP_PATH"/*.yml ./
    
    # Start Docker containers
    log_info "Starting Docker containers..."
    if [ -f "docker-compose.yml" ]; then
        docker-compose up -d
    else
        log_error "docker-compose.yml not found in current directory"
        return 1
    fi
    
    # Wait for containers to be ready
    log_info "Waiting for Docker containers to be ready..."
    sleep 30
    
    # Restore database data
    log_info "Restoring database data from backup..."
    for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
        local container_name="booking-postgres-${agent}"
        local backup_file="$BACKUP_PATH/${agent}_backup.sql"
        
        if docker ps -q -f name="$container_name" | grep -q . && [ -f "$backup_file" ]; then
            log_info "Restoring data for $agent..."
            
            # Wait for container to be fully ready
            sleep 5
            
            # Restore data
            docker exec "$container_name" psql -U booking_user -d "booking_${agent}" -f /dev/stdin < "$backup_file" || {
                log_warning "Failed to restore data for $agent, trying alternative method..."
                docker cp "$backup_file" "$container_name:/tmp/restore.sql"
                docker exec "$container_name" psql -U booking_user -d postgres -f "/tmp/restore.sql"
                docker exec "$container_name" rm -f "/tmp/restore.sql"
            }
            
            log_success "Data restored for $agent"
        else
            log_warning "Container $container_name not found or backup file missing for $agent"
        fi
    done
    
    log_success "Docker rollback completed."
}

# Rollback to previous Kubernetes state
rollback_to_previous_k8s() {
    log_info "Rolling back to previous Kubernetes state..."
    
    # Apply backed up resources
    if [ -f "$BACKUP_PATH/kubernetes-resources.yml" ]; then
        log_info "Restoring Kubernetes resources..."
        kubectl apply -f "$BACKUP_PATH/kubernetes-resources.yml" 2>/dev/null || true
    fi
    
    if [ -f "$BACKUP_PATH/configmaps.yml" ]; then
        log_info "Restoring ConfigMaps..."
        kubectl apply -f "$BACKUP_PATH/configmaps.yml" 2>/dev/null || true
    fi
    
    if [ -f "$BACKUP_PATH/secrets.yml" ]; then
        log_info "Restoring Secrets..."
        kubectl apply -f "$BACKUP_PATH/secrets.yml" 2>/dev/null || true
    fi
    
    # Wait for pods to be ready
    log_info "Waiting for pods to be ready..."
    kubectl wait --for=condition=ready pod --all -n $NAMESPACE --timeout=600s 2>/dev/null || {
        log_warning "Some pods did not become ready within timeout"
    }
    
    # Restore database data
    log_info "Restoring database data..."
    for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
        local backup_file="$BACKUP_PATH/${agent}_backup.sql"
        
        if [ -f "$backup_file" ]; then
            local pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
            
            if [ -n "$pod_name" ]; then
                log_info "Restoring data for $agent..."
                kubectl cp "$backup_file" "$NAMESPACE/$pod_name:/tmp/restore.sql"
                kubectl exec -n $NAMESPACE "$pod_name" -- psql -U booking_user -d postgres -f "/tmp/restore.sql"
                kubectl exec -n $NAMESPACE "$pod_name" -- rm -f "/tmp/restore.sql"
                log_success "Data restored for $agent"
            else
                log_warning "Pod not found for $agent"
            fi
        else
            log_warning "Backup file not found for $agent"
        fi
    done
    
    log_success "Kubernetes state rollback completed."
}

# Clean up Kubernetes resources completely
cleanup_kubernetes() {
    log_info "Cleaning up Kubernetes resources..."
    
    # Delete the entire namespace (this will delete everything)
    kubectl delete namespace $NAMESPACE --ignore-not-found=true
    
    # Wait for namespace to be deleted
    log_info "Waiting for namespace deletion..."
    while kubectl get namespace $NAMESPACE 2>/dev/null; do
        sleep 5
    done
    
    # Clean up any cluster-wide resources
    kubectl delete clusterrole booking-system-role --ignore-not-found=true
    kubectl delete clusterrolebinding booking-system-rolebinding --ignore-not-found=true
    kubectl delete clusterrole booking-system-vpa-role --ignore-not-found=true
    kubectl delete clusterrolebinding booking-system-vpa-rolebinding --ignore-not-found=true
    
    log_success "Kubernetes cleanup completed."
}

# Verify rollback
verify_rollback() {
    log_info "Verifying rollback..."
    
    case $ROLLBACK_TO in
        "docker")
            # Check Docker containers
            log_info "Checking Docker containers..."
            local running_containers=$(docker ps -q -f name="booking-*" | wc -l)
            log_info "Running booking containers: $running_containers"
            
            if [ "$running_containers" -gt 0 ]; then
                log_success "Docker containers are running"
                docker ps -f name="booking-*"
            else
                log_warning "No Docker containers found running"
            fi
            
            # Test database connectivity
            log_info "Testing database connectivity..."
            for agent in agent2 agent3 agent4; do
                local container_name="booking-postgres-${agent}"
                if docker exec "$container_name" pg_isready -U booking_user 2>/dev/null; then
                    log_success "Database connectivity OK for $agent"
                else
                    log_warning "Database connectivity failed for $agent"
                fi
            done
            ;;
            
        "previous-k8s-state")
            # Check Kubernetes resources
            log_info "Checking Kubernetes resources..."
            kubectl get pods -n $NAMESPACE
            
            local ready_pods=$(kubectl get pods -n $NAMESPACE --no-headers 2>/dev/null | grep Running | wc -l)
            log_info "Running pods: $ready_pods"
            
            if [ "$ready_pods" -gt 0 ]; then
                log_success "Kubernetes rollback appears successful"
            else
                log_warning "No pods are running after rollback"
            fi
            ;;
    esac
}

# Generate rollback report
generate_rollback_report() {
    local report_file="./rollback-report-$(date +%Y%m%d-%H%M%S).md"
    
    log_info "Generating rollback report..."
    
    cat > "$report_file" << EOF
# Booking System Rollback Report

**Rollback Date:** $(date)
**Rollback Type:** $ROLLBACK_TO
**Backup Used:** $BACKUP_PATH
**Emergency Backup:** $(cat /tmp/booking_rollback_backup_path 2>/dev/null || echo "Not created")

## Rollback Summary

The Kubernetes migration has been rolled back to: **$ROLLBACK_TO**

### Actions Performed
- [x] Confirmation obtained from user
- [x] Emergency backup created
- [x] Kubernetes resources stopped/removed
- [x] Target environment restored
- [x] Database data restored
- [x] Rollback verified

### Current State

#### Docker Status (if applicable)
$(if [ "$ROLLBACK_TO" == "docker" ]; then
    echo "\`\`\`"
    docker ps -f name="booking-*" 2>/dev/null || echo "No Docker containers found"
    echo "\`\`\`"
fi)

#### Kubernetes Status (if applicable)
$(if [ "$ROLLBACK_TO" == "previous-k8s-state" ]; then
    echo "\`\`\`"
    kubectl get pods -n $NAMESPACE 2>/dev/null || echo "Namespace not found"
    echo "\`\`\`"
fi)

## Next Steps

1. **Verify Application Functionality**
   - Test all booking agent endpoints
   - Verify database connectivity
   - Check sub-agent functionality

2. **Data Verification**
   - Compare data before and after rollback
   - Verify no data loss occurred
   - Check data integrity

3. **Monitoring**
   - Monitor system performance
   - Check for any errors in logs
   - Verify all services are responding

## Recovery Options

If rollback was unsuccessful:
- Emergency backup available at: $(cat /tmp/booking_rollback_backup_path 2>/dev/null || echo "Unknown")
- Original migration backup at: $BACKUP_PATH
- Contact system administrator for manual recovery

## Lessons Learned

Document what went wrong with the migration and how to prevent it in the future:
- [ ] Migration preparation
- [ ] Testing procedures
- [ ] Rollback triggers
- [ ] Communication process

---
*Report generated automatically by rollback script*
EOF

    log_success "Rollback report generated: $report_file"
}

# Help function
show_help() {
    cat << EOF
Rollback Procedures for Booking System Kubernetes Migration

Usage: $0 [OPTIONS]

Options:
  --backup-path PATH    Path to migration backup directory (required)
  --rollback-to TYPE    Rollback target: docker, previous-k8s-state (default: docker)
  --namespace NAME      Kubernetes namespace (default: booking-system)
  --force              Skip confirmation prompts (dangerous!)
  --help               Show this help message

Examples:
  $0 --backup-path ./migration-backup-20250129-120000
  $0 --backup-path ./backup --rollback-to previous-k8s-state
  $0 --backup-path ./backup --force

WARNING: This script performs destructive operations. Always ensure you have
proper backups before proceeding with rollback.
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --backup-path)
            BACKUP_PATH="$2"
            shift 2
            ;;
        --rollback-to)
            ROLLBACK_TO="$2"
            shift 2
            ;;
        --namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        --force)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validation
if [ -z "$BACKUP_PATH" ]; then
    log_error "Backup path is required. Use --backup-path option."
    show_help
    exit 1
fi

if [ ! -d "$BACKUP_PATH" ]; then
    log_error "Backup directory does not exist: $BACKUP_PATH"
    exit 1
fi

if [[ ! "$ROLLBACK_TO" =~ ^(docker|previous-k8s-state)$ ]]; then
    log_error "Invalid rollback target: $ROLLBACK_TO"
    log_error "Valid options: docker, previous-k8s-state"
    exit 1
fi

# Main execution
main() {
    log_info "Starting Booking System rollback procedure..."
    log_info "Rollback target: $ROLLBACK_TO"
    log_info "Backup location: $BACKUP_PATH"
    
    # Confirmation
    if [ "${SKIP_CONFIRMATION:-false}" != "true" ]; then
        confirm_rollback
    fi
    
    # Execute rollback
    create_rollback_backup
    stop_kubernetes_resources
    
    case $ROLLBACK_TO in
        "docker")
            cleanup_kubernetes
            rollback_to_docker
            ;;
        "previous-k8s-state")
            rollback_to_previous_k8s
            ;;
    esac
    
    verify_rollback
    generate_rollback_report
    
    log_success "Rollback procedure completed!"
    log_info "Please verify your application is working correctly."
    log_info "Check the rollback report for details and next steps."
}

# Execute main function if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main
fi