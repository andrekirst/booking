#!/bin/bash

# Docker to Kubernetes Migration Script for Booking System
# This script migrates the existing Docker-based multi-agent system to Kubernetes

set -euo pipefail

# Configuration
NAMESPACE="booking-system"
DOCKER_COMPOSE_PATH="./docker-compose.yml"
K8S_PATH="./k8s"
BACKUP_PATH="./migration-backup-$(date +%Y%m%d-%H%M%S)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Pre-migration checks
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running."
        exit 1
    fi
    
    # Check Kubernetes cluster connectivity
    if ! kubectl cluster-info &> /dev/null; then
        log_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    # Check if namespace exists
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        log_warning "Namespace $NAMESPACE already exists. Migration will update existing resources."
    fi
    
    log_success "Prerequisites check completed."
}

# Backup existing Docker configuration
backup_docker_config() {
    log_info "Backing up existing Docker configuration..."
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup docker-compose files
    if [ -f "$DOCKER_COMPOSE_PATH" ]; then
        cp "$DOCKER_COMPOSE_PATH" "$BACKUP_PATH/"
    fi
    
    find . -name "docker-compose.*.yml" -exec cp {} "$BACKUP_PATH/" \;
    
    # Backup current database data
    log_info "Backing up database data..."
    
    # Create database dumps for each agent
    for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
        container_name="booking-postgres-${agent}"
        if docker ps -q -f name="$container_name" | grep -q .; then
            log_info "Backing up database for $agent..."
            docker exec "$container_name" pg_dump -U booking_user -d "booking_${agent}" > "$BACKUP_PATH/${agent}_backup.sql"
        else
            log_warning "Container $container_name not found, skipping backup."
        fi
    done
    
    log_success "Backup completed in $BACKUP_PATH"
}

# Stop Docker containers
stop_docker_containers() {
    log_info "Stopping Docker containers..."
    
    # Stop all booking-related containers
    docker ps -q -f name="booking-*" | xargs -r docker stop
    docker ps -q -f name="claude-*" | xargs -r docker stop
    
    log_success "Docker containers stopped."
}

# Create Kubernetes namespace and core resources
create_k8s_namespace() {
    log_info "Creating Kubernetes namespace and core resources..."
    
    kubectl apply -f "$K8S_PATH/core/namespace.yml"
    kubectl apply -f "$K8S_PATH/core/rbac.yml"
    
    log_success "Namespace and RBAC created."
}

# Migrate secrets and configuration
migrate_secrets_config() {
    log_info "Migrating secrets and configuration..."
    
    # Extract database credentials from docker-compose
    DB_USER=$(grep POSTGRES_USER docker-compose.yml | head -1 | cut -d: -f2 | tr -d ' ')
    DB_PASS=$(grep POSTGRES_PASSWORD docker-compose.yml | head -1 | cut -d: -f2 | tr -d ' ')
    
    # Create temporary secrets file
    cat > "$BACKUP_PATH/secrets-temp.yml" << EOF
apiVersion: v1
kind: Secret
metadata:
  name: booking-system-secrets-migration
  namespace: $NAMESPACE
type: Opaque
stringData:
  POSTGRES_USER: "$DB_USER"
  POSTGRES_PASSWORD: "$DB_PASS"
  JWT_SECRET: "migration-jwt-secret-key-needs-to-be-updated-256-bits-minimum"
  JWT_ISSUER: "BookingApi-K8s"
  JWT_AUDIENCE: "BookingApp-K8s"
EOF
    
    kubectl apply -f "$BACKUP_PATH/secrets-temp.yml"
    kubectl apply -f "$K8S_PATH/core/configmap.yml"
    
    log_success "Secrets and configuration migrated."
}

# Deploy databases
deploy_databases() {
    log_info "Deploying PostgreSQL databases..."
    
    # Apply database configurations
    kubectl apply -f "$K8S_PATH/database/postgres-agent-dbs.yml"
    kubectl apply -f "$K8S_PATH/database/postgres-sub-agent-dbs.yml"
    
    # Wait for databases to be ready
    log_info "Waiting for databases to be ready..."
    kubectl wait --for=condition=ready pod -l component=database -n $NAMESPACE --timeout=300s
    
    log_success "Databases deployed."
}

# Restore database data
restore_database_data() {
    log_info "Restoring database data..."
    
    for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
        backup_file="$BACKUP_PATH/${agent}_backup.sql"
        
        if [ -f "$backup_file" ]; then
            log_info "Restoring data for $agent..."
            
            # Get the pod name for the database
            pod_name=$(kubectl get pods -n $NAMESPACE -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}')
            
            if [ -n "$pod_name" ]; then
                # Copy backup file to pod
                kubectl cp "$backup_file" "$NAMESPACE/$pod_name:/tmp/${agent}_backup.sql"
                
                # Restore database
                kubectl exec -n $NAMESPACE "$pod_name" -- psql -U booking_user -d "booking_${agent}" -f "/tmp/${agent}_backup.sql"
                
                log_success "Data restored for $agent"
            else
                log_warning "Could not find database pod for $agent"
            fi
        else
            log_warning "No backup file found for $agent"
        fi
    done
}

# Deploy applications
deploy_applications() {
    log_info "Deploying applications..."
    
    # Deploy standard agents
    kubectl apply -f "$K8S_PATH/agents/"
    
    # Deploy sub-agents
    kubectl apply -f "$K8S_PATH/sub-agents/"
    
    # Wait for deployments to be ready
    log_info "Waiting for applications to be ready..."
    kubectl wait --for=condition=available deployment -l app.kubernetes.io/part-of=booking-system -n $NAMESPACE --timeout=600s
    
    log_success "Applications deployed."
}

# Deploy monitoring
deploy_monitoring() {
    log_info "Deploying monitoring stack..."
    
    kubectl apply -f "$K8S_PATH/monitoring/"
    
    # Wait for monitoring to be ready
    log_info "Waiting for monitoring to be ready..."
    kubectl wait --for=condition=available deployment -l component=monitoring -n $NAMESPACE --timeout=300s
    
    log_success "Monitoring deployed."
}

# Verify migration
verify_migration() {
    log_info "Verifying migration..."
    
    # Check all pods are running
    failed_pods=$(kubectl get pods -n $NAMESPACE --no-headers | grep -v Running | grep -v Completed | wc -l)
    if [ "$failed_pods" -gt 0 ]; then
        log_warning "$failed_pods pods are not in Running state"
        kubectl get pods -n $NAMESPACE --no-headers | grep -v Running | grep -v Completed
    fi
    
    # Check services
    log_info "Checking services..."
    kubectl get services -n $NAMESPACE
    
    # Check ingresses
    log_info "Checking ingresses..."
    kubectl get ingresses -n $NAMESPACE
    
    # Test basic connectivity
    log_info "Testing basic connectivity..."
    
    # Port-forward to test one of the agents
    kubectl port-forward -n $NAMESPACE service/booking-agent2-frontend-service 8080:3000 &
    PF_PID=$!
    sleep 5
    
    if curl -f http://localhost:8080 &> /dev/null; then
        log_success "Basic connectivity test passed"
    else
        log_warning "Basic connectivity test failed"
    fi
    
    kill $PF_PID 2>/dev/null || true
    
    log_success "Migration verification completed."
}

# Cleanup old Docker resources
cleanup_docker() {
    log_info "Cleaning up Docker resources..."
    
    read -p "Do you want to remove old Docker containers and volumes? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Remove containers
        docker ps -aq -f name="booking-*" | xargs -r docker rm -f
        docker ps -aq -f name="claude-*" | xargs -r docker rm -f
        
        # Remove volumes
        docker volume ls -q -f name="booking*" | xargs -r docker volume rm
        
        log_success "Docker resources cleaned up."
    else
        log_info "Skipping Docker cleanup."
    fi
}

# Generate migration report
generate_report() {
    log_info "Generating migration report..."
    
    cat > "$BACKUP_PATH/migration-report.md" << EOF
# Booking System Migration Report

**Migration Date:** $(date)
**Backup Location:** $BACKUP_PATH

## Migration Summary

### Migrated Components
- [x] PostgreSQL Databases (with data)
- [x] Booking Agents (agent2, agent3, agent4)  
- [x] Claude Sub-Agents (S1-S6)
- [x] Configuration & Secrets
- [x] Monitoring Stack

### Kubernetes Resources Created
\`\`\`
$(kubectl get all -n $NAMESPACE)
\`\`\`

### Services Endpoints
\`\`\`
$(kubectl get services -n $NAMESPACE)
\`\`\`

### Ingress Configuration
\`\`\`
$(kubectl get ingresses -n $NAMESPACE)
\`\`\`

## Post-Migration Tasks

1. Update DNS records to point to new ingress endpoints
2. Update Claude API keys in secrets
3. Configure SSL certificates
4. Set up backup schedule for PostgreSQL
5. Configure monitoring alerts
6. Test all agent functionalities

## Rollback Instructions

To rollback to Docker:
1. Stop Kubernetes deployments: \`kubectl delete namespace $NAMESPACE\`
2. Restore Docker containers: \`docker-compose up -d\`
3. Restore database from backup: Located in $BACKUP_PATH

## Support

For issues with the migration, check:
- Kubernetes logs: \`kubectl logs -n $NAMESPACE <pod-name>\`
- Events: \`kubectl get events -n $NAMESPACE\`
- Pod status: \`kubectl describe pod -n $NAMESPACE <pod-name>\`
EOF

    log_success "Migration report generated: $BACKUP_PATH/migration-report.md"
}

# Main migration function
main() {
    log_info "Starting Booking System Docker to Kubernetes migration..."
    log_info "Backup will be stored in: $BACKUP_PATH"
    
    # Confirm migration
    read -p "This will migrate your booking system from Docker to Kubernetes. Continue? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Migration cancelled."
        exit 0
    fi
    
    # Execute migration steps
    check_prerequisites
    backup_docker_config
    stop_docker_containers
    create_k8s_namespace
    migrate_secrets_config
    deploy_databases
    restore_database_data
    deploy_applications
    deploy_monitoring
    verify_migration
    generate_report
    cleanup_docker
    
    log_success "Migration completed successfully!"
    log_info "Check the migration report at: $BACKUP_PATH/migration-report.md"
    log_info "Access your applications via the ingress endpoints:"
    kubectl get ingresses -n $NAMESPACE -o custom-columns=NAME:.metadata.name,HOST:.spec.rules[0].host,ADDRESS:.status.loadBalancer.ingress[0].ip
}

# Script execution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi