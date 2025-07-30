# Booking System Kubernetes Deployment Guide

## 🎯 Quick Deploy Checklist

This guide provides a step-by-step deployment process for the booking system Kubernetes migration.

### ✅ Pre-Deployment Checklist

- [ ] Kubernetes cluster (v1.24+) is running
- [ ] `kubectl` is configured and connected
- [ ] Docker images are built and accessible
- [ ] Claude API keys are available
- [ ] Domain names are configured
- [ ] SSL certificates are ready (optional)
- [ ] Storage classes are available
- [ ] Ingress controller is installed

## 🚀 Deployment Steps

### Step 1: Prepare Environment

```bash
# 1. Clone the repository
git clone https://github.com/andrekirst/booking.git
cd booking/k8s

# 2. Verify cluster connectivity
kubectl cluster-info
kubectl get nodes

# 3. Check required resources
kubectl get storageclass
kubectl get ingressclass
```

### Step 2: Configure Secrets

```bash
# 1. Copy secrets template
cp core/secrets.yml core/secrets-production.yml

# 2. Update with real values
vim core/secrets-production.yml
```

Update the following values in `secrets-production.yml`:

```yaml
stringData:
  # Database - Use strong passwords
  POSTGRES_PASSWORD: "your-secure-database-password"
  
  # JWT - Generate 256-bit key
  JWT_SECRET: "your-256-bit-jwt-secret-key"
  
  # Claude API Keys - One per sub-agent
  CLAUDE_API_KEY_PRIMARY: "sk-ant-api03-YOUR-PRIMARY-KEY"
  CLAUDE_API_KEY_SUB_AGENT_S1: "sk-ant-api03-YOUR-S1-KEY"
  CLAUDE_API_KEY_SUB_AGENT_S2: "sk-ant-api03-YOUR-S2-KEY"
  CLAUDE_API_KEY_SUB_AGENT_S3: "sk-ant-api03-YOUR-S3-KEY"
  CLAUDE_API_KEY_SUB_AGENT_S4: "sk-ant-api03-YOUR-S4-KEY"
  CLAUDE_API_KEY_SUB_AGENT_S5: "sk-ant-api03-YOUR-S5-KEY"
  CLAUDE_API_KEY_SUB_AGENT_S6: "sk-ant-api03-YOUR-S6-KEY"
  
  # Monitoring
  GRAFANA_ADMIN_PASSWORD: "your-grafana-password"
```

### Step 3: Update Configuration

```bash
# 1. Update domain names in ingress files
find agents/ sub-agents/ monitoring/ -name "*.yml" -exec sed -i 's/example\.com/yourdomain.com/g' {} \;

# 2. Update ConfigMap if needed
vim core/configmap.yml
```

### Step 4: Deploy Core Infrastructure

```bash
# 1. Create namespace and RBAC
kubectl apply -f core/namespace.yml
kubectl apply -f core/rbac.yml

# 2. Apply configuration
kubectl apply -f core/configmap.yml
kubectl apply -f core/secrets-production.yml

# 3. Verify core resources
kubectl get all -n booking-system
```

### Step 5: Deploy Databases

```bash
# 1. Deploy PostgreSQL instances
kubectl apply -f database/postgres-agent-dbs.yml
kubectl apply -f database/postgres-sub-agent-dbs.yml

# 2. Wait for databases to be ready
kubectl wait --for=condition=ready pod -l component=database -n booking-system --timeout=300s

# 3. Verify database deployment
kubectl get statefulsets -n booking-system
kubectl get pods -l component=database -n booking-system
```

### Step 6: Deploy Applications

```bash
# 1. Deploy standard agents
kubectl apply -f agents/booking-agent2.yml
kubectl apply -f agents/booking-agent3.yml
kubectl apply -f agents/booking-agent4.yml

# 2. Deploy Claude sub-agents
kubectl apply -f sub-agents/sub-agent-s1.yml
kubectl apply -f sub-agents/sub-agent-s2.yml
kubectl apply -f sub-agents/sub-agent-s3.yml
kubectl apply -f sub-agents/sub-agent-s4.yml
kubectl apply -f sub-agents/sub-agent-s5.yml
kubectl apply -f sub-agents/sub-agent-s6.yml

# 3. Wait for applications to be ready
kubectl wait --for=condition=available deployment -l app.kubernetes.io/part-of=booking-system -n booking-system --timeout=600s

# 4. Verify application deployment
kubectl get deployments -n booking-system
kubectl get pods -n booking-system
```

### Step 7: Configure Auto-Scaling

```bash
# 1. Deploy VPA configuration
kubectl apply -f core/vpa-config.yml

# 2. Deploy custom metrics and HPA
kubectl apply -f core/custom-metrics.yml

# 3. Verify scaling configuration
kubectl get hpa -n booking-system
kubectl get vpa -n booking-system
```

### Step 8: Deploy Monitoring

```bash
# 1. Deploy Prometheus
kubectl apply -f monitoring/prometheus.yml

# 2. Deploy Grafana
kubectl apply -f monitoring/grafana.yml

# 3. Deploy logging stack (optional)
kubectl apply -f monitoring/logging.yml

# 4. Wait for monitoring to be ready
kubectl wait --for=condition=available deployment -l component=monitoring -n booking-system --timeout=300s

# 5. Verify monitoring deployment
kubectl get pods -l component=monitoring -n booking-system
```

### Step 9: Verify Deployment

```bash
# 1. Check all pods are running
kubectl get pods -n booking-system

# 2. Check services
kubectl get services -n booking-system

# 3. Check ingresses
kubectl get ingresses -n booking-system

# 4. Test connectivity
kubectl port-forward service/booking-agent2-frontend-service 8080:3000 -n booking-system &
curl http://localhost:8080
kill %1
```

## 🔧 Post-Deployment Configuration

### Configure DNS

Point your domain names to the ingress controller's external IP:

```bash
# Get ingress external IP
kubectl get service ingress-nginx-controller -n ingress-nginx

# Configure DNS records:
# booking-agent2.yourdomain.com -> EXTERNAL-IP
# booking-agent3.yourdomain.com -> EXTERNAL-IP
# booking-agent4.yourdomain.com -> EXTERNAL-IP
# monitoring.yourdomain.com -> EXTERNAL-IP
# logs.yourdomain.com -> EXTERNAL-IP
```

### SSL Certificates

If using cert-manager:

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@yourdomain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Initialize Databases

```bash
# Run database migrations for each agent
for agent in agent2 agent3 agent4; do
  kubectl exec -n booking-system deployment/booking-${agent}-backend -- dotnet ef database update
done
```

## 📊 Health Checks

### Application Health

```bash
# Check application endpoints
curl https://booking-agent2.yourdomain.com/health
curl https://booking-agent3.yourdomain.com/health
curl https://booking-agent4.yourdomain.com/health

# Check sub-agent health
for i in {1..6}; do
  kubectl exec -n booking-system deployment/booking-sub-s${i} -- curl -f http://localhost:8080/health
done
```

### Database Health

```bash
# Check database connectivity
for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
  pod=$(kubectl get pods -n booking-system -l app="booking-${agent}-postgres" -o jsonpath='{.items[0].metadata.name}')
  kubectl exec -n booking-system $pod -- pg_isready -U booking_user
done
```

### Monitoring Health

```bash
# Access Grafana
kubectl port-forward service/grafana-service 3000:3000 -n booking-system &
# Visit http://localhost:3000

# Access Prometheus
kubectl port-forward service/prometheus-service 9090:9090 -n booking-system &
# Visit http://localhost:9090
```

## 🚨 Troubleshooting Common Issues

### Pod Startup Issues

```bash
# Check pod events
kubectl describe pod <pod-name> -n booking-system

# Check logs
kubectl logs <pod-name> -n booking-system

# Check resource constraints
kubectl top pod <pod-name> -n booking-system
```

### Database Connection Issues

```bash
# Verify secrets
kubectl get secret booking-system-secrets -n booking-system -o yaml

# Test database connection from application pod
kubectl exec -it deployment/booking-agent2-backend -n booking-system -- \
  psql -h booking-agent2-postgres-service -U booking_user -d booking_agent2
```

### Ingress Issues

```bash
# Check ingress controller logs
kubectl logs -n ingress-nginx deployment/ingress-nginx-controller

# Verify ingress configuration
kubectl describe ingress -n booking-system

# Test internal service connectivity
kubectl exec -it deployment/booking-agent2-backend -n booking-system -- \
  curl http://booking-agent2-frontend-service:3000
```

### Scaling Issues

```bash
# Check HPA status
kubectl describe hpa booking-sub-s1-hpa -n booking-system

# Check metrics server
kubectl top nodes
kubectl top pods -n booking-system

# Check custom metrics
kubectl get --raw "/apis/custom.metrics.k8s.io/v1beta1" | jq
```

## 🔄 Update Procedures

### Application Updates

```bash
# Update image tag
kubectl set image deployment/booking-agent2-backend backend=booking-api:v1.2.3 -n booking-system

# Rolling update
kubectl rollout status deployment/booking-agent2-backend -n booking-system

# Rollback if needed
kubectl rollout undo deployment/booking-agent2-backend -n booking-system
```

### Configuration Updates

```bash
# Update ConfigMap
kubectl apply -f core/configmap.yml

# Restart deployments to pick up changes
kubectl rollout restart deployment -l app.kubernetes.io/part-of=booking-system -n booking-system
```

## 🔐 Security Considerations

### Network Policies

```yaml
# Example network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: booking-system-netpol
  namespace: booking-system
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
  egress:
  - {}
```

### Pod Security Standards

```yaml
# Add to namespace
metadata:
  labels:
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
```

### RBAC Validation

```bash
# Test service account permissions
kubectl auth can-i list pods --as=system:serviceaccount:booking-system:booking-system-sa -n booking-system
```

## 📈 Performance Optimization

### Resource Tuning

Monitor and adjust resource requests/limits based on actual usage:

```bash
# Check resource utilization
kubectl top pods -n booking-system --sort-by=cpu
kubectl top pods -n booking-system --sort-by=memory

# Get VPA recommendations
kubectl get vpa -n booking-system -o yaml
```

### Database Performance

```sql
-- Connect to each database and optimize
ANALYZE;
VACUUM ANALYZE;

-- Check performance stats
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del, n_live_tup, n_dead_tup 
FROM pg_stat_user_tables 
ORDER BY n_live_tup DESC;
```

## 📋 Maintenance Tasks

### Regular Maintenance

```bash
# Weekly tasks
kubectl delete pods --field-selector=status.phase=Succeeded -n booking-system
kubectl logs -f deployment/prometheus -n booking-system | grep -i error

# Monthly tasks
kubectl get events --sort-by='.lastTimestamp' -n booking-system
kubectl describe nodes | grep -A 5 "Allocated resources"
```

### Backup Procedures

```bash
# Database backup script (run from cron)
#!/bin/bash
for agent in agent2 agent3 agent4 sub-s1 sub-s2 sub-s3 sub-s4 sub-s5 sub-s6; do
  kubectl exec -n booking-system statefulset/booking-${agent}-postgres -- \
    pg_dump -U booking_user booking_${agent} > backup-${agent}-$(date +%Y%m%d).sql
done
```

## 📞 Support Escalation

1. **Level 1**: Check this guide and troubleshooting section
2. **Level 2**: Review logs and metrics in Grafana
3. **Level 3**: Contact system administrator with:
   - Error messages
   - Pod/service status
   - Resource utilization
   - Recent changes

---

*This deployment guide is maintained by the DevOps team. Last updated: $(date)*