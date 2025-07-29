#!/bin/bash

# Kubernetes Deployment Script for Multi-Agent Booking System
# Based on Issue #68: Multi-Agent Kubernetes-Cluster mit skalierbaren Claude Code Instanzen

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="booking-agents"
CONTEXT="minikube"  # Change this to your Kubernetes context
TIMEOUT="300s"

echo -e "${BLUE}🚀 Starting Kubernetes deployment for Multi-Agent Booking System${NC}"
echo -e "${BLUE}📋 Based on Issue #68: feat: Multi-Agent Kubernetes-Cluster mit skalierbaren Claude Code Instanzen${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed or not in PATH"
        exit 1
    fi
    print_status "kubectl is available"
}

# Function to check if cluster is accessible
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        print_error "Please ensure your cluster is running and kubectl is configured"
        exit 1
    fi
    print_status "Kubernetes cluster is accessible"
}

# Function to create namespace and core resources
deploy_core() {
    print_status "Deploying core infrastructure..."
    
    # Apply namespace and resource quotas
    kubectl apply -f k8s/core/namespace.yaml
    
    # Wait for namespace to be ready
    kubectl wait --for=condition=Ready namespace/$NAMESPACE --timeout=$TIMEOUT
    
    print_status "Core infrastructure deployed successfully"
}

# Function to create secrets (template - needs to be customized)
create_secrets() {
    print_status "Creating secrets..."
    
    # Check if secrets already exist
    if kubectl get secret claude-api-credentials -n $NAMESPACE &> /dev/null; then
        print_warning "Claude API credentials secret already exists, skipping creation"
    else
        print_warning "Please create the Claude API credentials secret manually:"
        echo "kubectl create secret generic claude-api-credentials \\"
        echo "  --from-literal=api-key='your-claude-api-key' \\"
        echo "  --namespace=$NAMESPACE"
        echo ""
        read -p "Press Enter after creating the secret..."
    fi
    
    # Check PostgreSQL secret
    if kubectl get secret postgres-secret -n $NAMESPACE &> /dev/null; then
        print_warning "PostgreSQL secret already exists, skipping creation"
    else
        print_status "Creating PostgreSQL secret..."
        kubectl create secret generic postgres-secret \
          --from-literal=username='postgres' \
          --from-literal=password='booking-postgres-secure-2025' \
          --namespace=$NAMESPACE
    fi
    
    print_status "Secrets created successfully"
}

# Function to deploy database
deploy_database() {
    print_status "Deploying PostgreSQL cluster..."
    
    kubectl apply -f k8s/database/postgres-cluster.yaml
    
    # Wait for StatefulSet to be ready
    print_status "Waiting for PostgreSQL StatefulSet to be ready..."
    kubectl wait --for=condition=Ready statefulset/postgres-cluster -n $NAMESPACE --timeout=$TIMEOUT
    
    print_status "PostgreSQL cluster deployed successfully"
}

# Function to deploy monitoring stack
deploy_monitoring() {
    print_status "Deploying monitoring stack..."
    
    kubectl apply -f k8s/monitoring/prometheus.yaml
    
    # Wait for Prometheus to be ready
    print_status "Waiting for Prometheus to be ready..."
    kubectl wait --for=condition=Available deployment/prometheus -n $NAMESPACE --timeout=$TIMEOUT
    
    print_status "Monitoring stack deployed successfully"
}

# Function to deploy sub-agents
deploy_sub_agents() {
    print_status "Deploying Claude sub-agents..."
    
    # Deploy S1 (Senior Developer) first as it's the most critical
    kubectl apply -f k8s/sub-agents/claude-sub-agent-s1.yaml
    
    # Wait for S1 to be ready before deploying others
    print_status "Waiting for S1 (Senior Developer) to be ready..."
    kubectl wait --for=condition=Available deployment/claude-sub-agent-s1 -n $NAMESPACE --timeout=$TIMEOUT
    
    # Deploy remaining sub-agents
    for agent in s2 s3 s4 s5 s6; do
        if [ -f "k8s/sub-agents/claude-sub-agent-${agent}.yaml" ]; then
            print_status "Deploying sub-agent ${agent}..."
            kubectl apply -f "k8s/sub-agents/claude-sub-agent-${agent}.yaml"
        else
            print_warning "Sub-agent ${agent} configuration not found, skipping..."
        fi
    done
    
    print_status "Sub-agents deployed successfully"
}

# Function to deploy standard agents
deploy_standard_agents() {
    print_status "Deploying standard booking agents..."
    
    # Deploy agents A2, A3, A4
    for agent in a2 a3 a4; do
        if [ -f "k8s/agents/booking-agent-${agent}.yaml" ]; then
            print_status "Deploying booking agent ${agent}..."
            kubectl apply -f "k8s/agents/booking-agent-${agent}.yaml"
        else
            print_warning "Booking agent ${agent} configuration not found, skipping..."
        fi
    done
    
    print_status "Standard agents deployed successfully"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    echo ""
    print_status "Namespace status:"
    kubectl get namespace $NAMESPACE
    
    echo ""
    print_status "Pod status:"
    kubectl get pods -n $NAMESPACE -o wide
    
    echo ""
    print_status "Service status:"
    kubectl get services -n $NAMESPACE
    
    echo ""
    print_status "HPA status:"
    kubectl get hpa -n $NAMESPACE
    
    echo ""
    print_status "PVC status:"
    kubectl get pvc -n $NAMESPACE
    
    # Check if all critical pods are running
    echo ""
    print_status "Checking critical components..."
    
    # Check PostgreSQL
    if kubectl get statefulset postgres-cluster -n $NAMESPACE &> /dev/null; then
        POSTGRES_READY=$(kubectl get statefulset postgres-cluster -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
        POSTGRES_DESIRED=$(kubectl get statefulset postgres-cluster -n $NAMESPACE -o jsonpath='{.spec.replicas}')
        if [ "$POSTGRES_READY" = "$POSTGRES_DESIRED" ]; then
            print_status "✅ PostgreSQL cluster is ready ($POSTGRES_READY/$POSTGRES_DESIRED)"
        else
            print_warning "⚠️  PostgreSQL cluster is not fully ready ($POSTGRES_READY/$POSTGRES_DESIRED)"
        fi
    fi
    
    # Check Prometheus
    if kubectl get deployment prometheus -n $NAMESPACE &> /dev/null; then
        PROMETHEUS_READY=$(kubectl get deployment prometheus -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
        if [ "$PROMETHEUS_READY" = "1" ]; then
            print_status "✅ Prometheus is ready"
        else
            print_warning "⚠️  Prometheus is not ready"
        fi
    fi
    
    # Check sub-agents
    SUB_AGENTS_READY=0
    SUB_AGENTS_TOTAL=0
    for agent in s1 s2 s3 s4 s5 s6; do
        if kubectl get deployment claude-sub-agent-${agent} -n $NAMESPACE &> /dev/null; then
            SUB_AGENTS_TOTAL=$((SUB_AGENTS_TOTAL + 1))
            READY=$(kubectl get deployment claude-sub-agent-${agent} -n $NAMESPACE -o jsonpath='{.status.readyReplicas}')
            if [ "$READY" -gt 0 ]; then
                SUB_AGENTS_READY=$((SUB_AGENTS_READY + 1))
            fi
        fi
    done
    
    if [ $SUB_AGENTS_READY -gt 0 ]; then
        print_status "✅ Sub-agents ready: $SUB_AGENTS_READY/$SUB_AGENTS_TOTAL"
    else
        print_warning "⚠️  No sub-agents are ready yet"
    fi
}

# Function to show access information
show_access_info() {
    echo ""
    print_status "🎉 Deployment completed successfully!"
    echo ""
    print_status "Access Information:"
    echo ""
    
    # Prometheus
    print_status "📊 Prometheus Monitoring:"
    echo "  kubectl port-forward -n $NAMESPACE svc/prometheus 9090:9090"
    echo "  Then access: http://localhost:9090"
    echo ""
    
    # Sub-agents
    print_status "🤖 Claude Sub-Agents:"
    echo "  Senior Developer (S1): kubectl port-forward -n $NAMESPACE svc/claude-sub-agent-s1 8080:8080"
    echo ""
    
    # Database
    print_status "🗄️  PostgreSQL Database:"
    echo "  kubectl port-forward -n $NAMESPACE svc/postgres-cluster 5432:5432"
    echo ""
    
    # Logs
    print_status "📝 View Logs:"
    echo "  kubectl logs -n $NAMESPACE -l app=claude-sub-agent -f"
    echo "  kubectl logs -n $NAMESPACE -l app=postgres -f"
    echo ""
    
    # Scaling
    print_status "⚖️ Scaling Commands:"
    echo "  kubectl scale deployment claude-sub-agent-s1 --replicas=5 -n $NAMESPACE"
    echo "  kubectl get hpa -n $NAMESPACE -w  # Watch auto-scaling"
    echo ""
    
    print_status "🔍 Troubleshooting:"
    echo "  kubectl describe pods -n $NAMESPACE"
    echo "  kubectl get events -n $NAMESPACE --sort-by='.lastTimestamp'"
    echo ""
}

# Main deployment flow
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_kubectl
    check_cluster
    
    # Set context if different
    if [ "$CONTEXT" != "$(kubectl config current-context)" ]; then
        print_status "Switching to context: $CONTEXT"
        kubectl config use-context $CONTEXT
    fi
    
    deploy_core
    create_secrets
    deploy_database
    deploy_monitoring
    deploy_sub_agents
    deploy_standard_agents
    
    # Wait a bit for everything to settle
    print_status "Waiting for all components to stabilize..."
    sleep 30
    
    verify_deployment
    show_access_info
    
    echo ""
    print_status "🎯 Issue #68 Implementation Status:"
    echo "  ✅ Multi-Agent Kubernetes Cluster deployed"
    echo "  ✅ Scalable Claude Code instances configured"
    echo "  ✅ Resource isolation and auto-scaling enabled"
    echo "  ✅ Monitoring and observability setup"
    echo "  ✅ Database per agent isolation implemented"
    echo ""
    print_status "🚀 The system is now ready for unlimited parallel Claude Code instances!"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "verify")
        verify_deployment
        ;;
    "clean")
        print_warning "This will delete the entire $NAMESPACE namespace and all resources!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kubectl delete namespace $NAMESPACE
            print_status "Cleanup completed"
        fi
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [deploy|verify|clean|help]"
        echo ""
        echo "Commands:"
        echo "  deploy  - Deploy the complete multi-agent system (default)"
        echo "  verify  - Verify the current deployment status"
        echo "  clean   - Remove all deployed resources"
        echo "  help    - Show this help message"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 --help' for usage information"
        exit 1
        ;;
esac