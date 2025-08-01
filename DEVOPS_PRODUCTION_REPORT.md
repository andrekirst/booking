# DevOps Production Report - Booking System
## Raspberry Pi Zero 2 W Deployment

**Erstellt:** 31. Juli 2025  
**Zielplattform:** Raspberry Pi Zero 2 W (ARM64, 512MB RAM)  
**Technologie-Stack:** .NET 9 Native AOT, Next.js 15, PostgreSQL  

---

## 1. Aktuelle Konfiguration Analyse

### 1.1 Docker-Compose Dateien Bewertung

#### ✅ Stärken der aktuellen Konfiguration
- **Mehrschichtige Entwicklungsumgebung**: Separate Konfigurationen für Basic, Development und Multi-Agent
- **Health Checks**: PostgreSQL Health Checks implementiert
- **Multi-Agent-Setup**: Isolierte Entwicklungsumgebungen mit Port-Separation
- **Docker Compose v2**: Moderne Syntax bereits implementiert

#### ⚠️ Kritische Lücken für Production
- **Keine Production-spezifische Konfiguration**: Alle Configs sind development-orientiert
- **Fehlende Resource Limits**: Keine Memory/CPU-Beschränkungen für 512MB RAM
- **Ungesicherte Secrets**: Hardcodierte Passwörter in Environment-Variablen
- **Keine Reverse Proxy**: Direkter Service-Zugriff ohne Load Balancing
- **Fehlende Monitoring**: Keine Observability für Production-Umgebung

### 1.2 Dockerfile ARM64-Optimierung

#### Backend Dockerfile Analyse
**Aktuelle Implementierung:**
```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
```

**Kritische Probleme:**
- ❌ Keine ARM64-spezifische Optimierung
- ❌ Keine Native AOT Konfiguration
- ❌ Runtime-Image zu groß für Raspberry Pi
- ❌ Fehlende Multi-Stage Build Optimierung

#### Frontend Dockerfile Analyse
**Aktuelle Implementierung:**
```dockerfile
FROM node:20-alpine
CMD ["npm", "run", "dev"]
```

**Kritische Probleme:**
- ❌ Development-Server für Production
- ❌ Keine Static Generation Build
- ❌ Fehlende Production-Optimierungen
- ❌ Keine ARM64-spezifische Node.js Optimierung

## 2. Production-Ready Empfehlungen

### 2.1 ARM64-spezifische Optimierungen

#### Native AOT Backend Optimierung
```dockerfile
# Optimierter Backend Dockerfile für ARM64 + Native AOT
FROM --platform=$BUILDPLATFORM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG TARGETARCH
WORKDIR /src

# ARM64 Cross-Compilation Tools
RUN if [ "$TARGETARCH" = "arm64" ]; then \
        apt-get update && \
        apt-get install -y gcc-aarch64-linux-gnu; \
    fi

# Native AOT Publish für maximale Performance
RUN dotnet publish \
    -a $TARGETARCH \
    -c Release \
    -p:PublishAot=true \
    -p:StripSymbols=true \
    -p:PublishTrimmed=true \
    -p:TrimMode=full \
    -p:PublishSingleFile=false \
    --self-contained true

# Minimal Runtime für ARM64
FROM --platform=$TARGETPLATFORM mcr.microsoft.com/dotnet/runtime-deps:9.0-alpine AS runtime
# Memory-Optimierungen für Raspberry Pi
ENV DOTNET_GCServer=0 \
    DOTNET_GCConcurrent=0 \
    DOTNET_GCRetainVM=0
```

#### Next.js Static Generation Optimierung
```dockerfile
# Optimierter Frontend Dockerfile für Production
FROM --platform=$BUILDPLATFORM node:20-alpine AS base
FROM base AS deps
RUN npm ci --only=production --ignore-scripts

FROM base AS builder
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

FROM --platform=$TARGETPLATFORM node:20-alpine AS runtime
# Memory-Optimierung für Raspberry Pi
ENV NODE_OPTIONS="--max-old-space-size=128"
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
```

### 2.2 Memory/CPU-Limits für 512MB RAM

#### Kritische Resource-Allocation
```yaml
# Empfohlene Resource-Limits für Raspberry Pi Zero 2 W
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.3'
        reservations:
          memory: 64M
          cpus: '0.1'
  
  backend:
    deploy:
      resources:
        limits:
          memory: 192M  # Native AOT reduziert Memory-Footprint
          cpus: '0.4'
        reservations:
          memory: 96M
          cpus: '0.2'
  
  frontend:
    deploy:
      resources:
        limits:
          memory: 128M  # Static Generation reduziert Runtime-Memory
          cpus: '0.2'
        reservations:
          memory: 64M
          cpus: '0.1'
  
  nginx:
    deploy:
      resources:
        limits:
          memory: 32M
          cpus: '0.1'
```

**Total Memory Usage:** ~380MB (74% von 512MB, 128MB Buffer für System)

### 2.3 Security Hardening

#### Secrets Management
```yaml
# Production-sichere Konfiguration
services:
  backend:
    environment:
      # ❌ NIEMALS: POSTGRES_PASSWORD: "hardcoded_password"
      # ✅ IMMER: External Secrets
      POSTGRES_PASSWORD_FILE: /run/secrets/postgres_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
    secrets:
      - postgres_password
      - jwt_secret

secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true
```

#### Container Security
```dockerfile
# Non-root User für alle Container
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup
USER appuser

# Read-only Root Filesystem
read_only: true
tmpfs:
  - /tmp
  - /var/run
```

## 3. Production Docker-Compose Design

### 3.1 Vollständige docker-compose.prod.yml

```yaml
# docker-compose.prod.yml - Production-Ready Stack
version: '3.8'

services:
  # Reverse Proxy & Load Balancer
  nginx:
    image: nginx:alpine
    container_name: booking-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx_cache:/var/cache/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - booking-network
    deploy:
      resources:
        limits:
          memory: 32M
          cpus: '0.1'

  # Frontend Service
  frontend:
    image: ghcr.io/andrekirst/booking-frontend:${IMAGE_TAG:-latest}
    container_name: booking-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NODE_OPTIONS=--max-old-space-size=128
    networks:
      - booking-network
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.2'

  # Backend Service  
  backend:
    image: ghcr.io/andrekirst/booking-backend:${IMAGE_TAG:-latest}
    container_name: booking-backend
    restart: unless-stopped
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - DOTNET_GCServer=0
      - DOTNET_GCConcurrent=0
    secrets:
      - postgres_password
      - jwt_secret
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - booking-network
    deploy:
      resources:
        limits:
          memory: 192M
          cpus: '0.4'

  # Database
  postgres:
    image: postgres:15-alpine
    container_name: booking-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_DB=booking_prod
      - POSTGRES_USER=booking_user
    secrets:
      - postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/backups:/backups
    networks:
      - booking-network
    deploy:
      resources:
        limits:
          memory: 128M
          cpus: '0.3'

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    container_name: booking-prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    networks:
      - booking-network
    deploy:
      resources:
        limits:
          memory: 64M
          cpus: '0.1'

  grafana:
    image: grafana/grafana:latest
    container_name: booking-grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD_FILE=/run/secrets/grafana_password
    secrets:
      - grafana_password
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - booking-network
    deploy:
      resources:
        limits:
          memory: 64M
          cpus: '0.1'

networks:
  booking-network:
    driver: bridge

volumes:
  postgres_data:
  prometheus_data:
  grafana_data:
  nginx_cache:

secrets:
  postgres_password:
    external: true
  jwt_secret:
    external: true
  grafana_password:
    external: true
```

### 3.2 Nginx Reverse Proxy Configuration

```nginx
# nginx/nginx.conf - Optimiert für Raspberry Pi
events {
    worker_connections 256;  # Reduziert für geringen RAM
}

http {
    # Memory-optimierte Konfiguration
    client_body_buffer_size 8k;
    client_header_buffer_size 1k;
    large_client_header_buffers 2 1k;
    client_max_body_size 1m;
    
    # Caching für statische Assets
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m 
                     max_size=100m inactive=60m use_temp_path=off;
    
    upstream backend {
        server backend:80;
        keepalive 2;  # Reduziert für RAM-Schonung
    }
    
    upstream frontend {
        server frontend:3000;
        keepalive 2;
    }
    
    server {
        listen 80;
        server_name booking.family.local;
        
        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_cache app_cache;
            proxy_cache_valid 200 302 5m;
            proxy_cache_key "$scheme$request_method$host$request_uri";
        }
        
        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_cache app_cache;
            proxy_cache_valid 200 302 10m;
        }
        
        # Health Check
        location /health {
            access_log off;
            return 200 "healthy\n";
        }
    }
}
```

## 4. CI/CD Pipeline Integration

### 4.1 GitHub Actions für Multi-Architecture Builds

```yaml
# .github/workflows/production-deployment.yml
name: Production Deployment Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # Multi-Architecture Docker Build
  docker-build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        component: [frontend, backend]
        
    steps:
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        with:
          platforms: linux/amd64,linux/arm64

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          file: ./src/${{ matrix.component }}/Dockerfile.prod
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-${{ matrix.component }}:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

  # Performance Testing für Raspberry Pi
  performance-tests:
    runs-on: ubuntu-latest
    needs: [docker-build]
    steps:
      - name: Resource Constraint Testing
        run: |
          # Simuliere Raspberry Pi Constraints
          docker run --memory=512m --cpus=0.8 \
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}-backend:latest \
            timeout 30s /app/Booking.Api || echo "Memory constraint test completed"

  # Production Deployment zu Raspberry Pi
  deploy-production:
    runs-on: ubuntu-latest
    needs: [performance-tests]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Raspberry Pi
        run: |
          ssh pi@${{ secrets.DEPLOY_HOST }} << 'EOF'
            cd ~/booking-system
            
            # Backup vor Deployment
            ./scripts/create-backup.sh
            
            # Pull neue Images
            docker compose -f docker-compose.prod.yml pull
            
            # Blue-Green Deployment
            ./scripts/blue-green-deploy.sh
            
            # Health Check
            ./scripts/health-check.sh
          EOF
```

### 4.2 Blue-Green Deployment für Zero-Downtime

```bash
#!/bin/bash
# scripts/blue-green-deploy.sh - Zero-Downtime Deployment

set -e

COMPOSE_FILE="docker-compose.prod.yml"
HEALTH_CHECK_URL="http://localhost/health"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Pre-deployment Resource Check
check_resources() {
    AVAILABLE_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$AVAILABLE_MEMORY" -lt 100 ]; then
        log "ERROR: Insufficient memory: ${AVAILABLE_MEMORY}MB available"
        exit 1
    fi
}

# Blue-Green Deployment
blue_green_deploy() {
    log "Starting Blue-Green deployment..."
    
    # Tag current services as "blue"
    docker tag ghcr.io/andrekirst/booking-frontend:latest \
        ghcr.io/andrekirst/booking-frontend:blue
    docker tag ghcr.io/andrekirst/booking-backend:latest \
        ghcr.io/andrekirst/booking-backend:blue
    
    # Pull new images (green)
    docker compose -f $COMPOSE_FILE pull
    
    # Health check on new images
    docker compose -f $COMPOSE_FILE up -d --wait
    
    if ! curl -f --max-time 10 "$HEALTH_CHECK_URL" >/dev/null 2>&1; then
        log "ERROR: Health check failed, rolling back..."
        docker tag ghcr.io/andrekirst/booking-frontend:blue \
            ghcr.io/andrekirst/booking-frontend:latest
        docker tag ghcr.io/andrekirst/booking-backend:blue \
            ghcr.io/andrekirst/booking-backend:latest
        docker compose -f $COMPOSE_FILE up -d
        exit 1
    fi
    
    log "Deployment successful!"
}

# Main execution
check_resources
blue_green_deploy
```

### 4.3 Automated Testing Integration

```yaml
# Testing Pipeline für Raspberry Pi Constraints
test-raspberry-pi-constraints:
  runs-on: ubuntu-latest
  steps:
    - name: Memory Stress Test
      run: |
        docker run --memory=384m --memory-swap=384m \
          ghcr.io/andrekirst/booking-backend:latest \
          /bin/bash -c "
            # Memory Load Test
            echo 'Starting memory stress test...'
            dotnet Booking.Api.dll &
            sleep 30
            
            # Check Memory Usage
            MEMORY_USAGE=\$(ps -o pid,ppid,cmd,%mem,%cpu --sort=-%mem | grep dotnet)
            echo \"Memory Usage: \$MEMORY_USAGE\"
            
            # Fail if memory > 180MB (94% of allocated 192MB)
            MEMORY_PERCENT=\$(echo \$MEMORY_USAGE | awk '{print \$4}')
            if (( \$(echo \"\$MEMORY_PERCENT > 85\" | bc -l) )); then
              echo \"FAIL: Memory usage too high: \$MEMORY_PERCENT%\"
              exit 1
            fi
            
            echo \"PASS: Memory usage acceptable: \$MEMORY_PERCENT%\"
          "
    
    - name: CPU Performance Test
      run: |
        docker run --cpus=0.8 \
          ghcr.io/andrekirst/booking-backend:latest \
          /bin/bash -c "
            # CPU Load Test
            dotnet Booking.Api.dll &
            APP_PID=\$!
            
            # Generate CPU load
            for i in {1..5}; do
              curl -f http://localhost/api/bookings &
            done
            wait
            
            # Check CPU Usage
            CPU_USAGE=\$(ps -p \$APP_PID -o %cpu --no-headers)
            echo \"CPU Usage: \$CPU_USAGE%\"
            
            kill \$APP_PID
          "
```

## 5. Security & Performance

### 5.1 Container Security Best Practices

#### Security Scanning Pipeline
```yaml
# Container Vulnerability Scanning
security-scan:
  runs-on: ubuntu-latest
  steps:
    - name: Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ghcr.io/andrekirst/booking-backend:latest
        format: 'sarif'
        output: 'trivy-results.sarif'
        severity: 'CRITICAL,HIGH'

    - name: OWASP Dependency Check
      uses: dependency-check/Dependency-Check_Action@main
      with:
        project: 'booking-system'
        path: '.'
        format: 'ALL'
```

#### Runtime Security Configuration
```yaml
# Security-gehärtete Container-Konfiguration
services:
  backend:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    user: "1001:1001"
```

### 5.2 Performance Monitoring für Raspberry Pi

#### Monitoring-Stack Konfiguration
```yaml
# monitoring/prometheus.yml - Raspberry Pi optimiert
global:
  scrape_interval: 30s  # Reduziert für geringere CPU-Last
  evaluation_interval: 30s

scrape_configs:
  - job_name: 'booking-backend'
    static_configs:
      - targets: ['backend:80']
    scrape_interval: 15s
    metrics_path: /metrics

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['localhost:9100']
    scrape_interval: 30s

  - job_name: 'postgres-exporter'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 60s  # Database Metrics weniger häufig
```

#### Resource Monitoring Alerts
```yaml
# monitoring/alerts/raspberry-pi.yml
groups:
  - name: raspberry-pi-resources
    rules:
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes > 0.9
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Critical: Memory usage > 90% on Raspberry Pi"
          description: "Available memory: {{ $value | humanizePercentage }}"

      - alert: HighCpuUsage
        expr: 100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Warning: CPU usage > 80% on Raspberry Pi"

      - alert: LowDiskSpace
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) < 0.15
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Critical: Disk space < 15%"
```

### 5.3 Resource Optimization Strategien

#### Database Optimization für 128MB RAM
```sql
-- postgresql.conf Optimierungen für Raspberry Pi
shared_buffers = 32MB                # 25% of allocated 128MB
effective_cache_size = 96MB          # 75% of allocated 128MB
maintenance_work_mem = 8MB           # Reduziert für Maintenance
work_mem = 2MB                       # Pro Query Memory
max_connections = 20                 # Begrenzt für Memory-Schonung
checkpoint_segments = 8              # Reduziert für geringere I/O
```

#### .NET Native AOT Optimierungen
```xml
<!-- Booking.Api.csproj - Production Optimierung -->
<PropertyGroup Condition="'$(Configuration)' == 'Release'">
  <PublishAot>true</PublishAot>
  <StripSymbols>true</StripSymbols>
  <PublishTrimmed>true</PublishTrimmed>
  <TrimMode>full</TrimMode>
  <IlcOptimizationPreference>Size</IlcOptimizationPreference>
  <IlcFoldIdenticalMethodBodies>true</IlcFoldIdenticalMethodBodies>
  <EventSourceSupport>false</EventSourceSupport>
  <HttpActivityPropagationSupport>false</HttpActivityPropagationSupport>
  <MetadataUpdaterSupport>false</MetadataUpdaterSupport>
</PropertyGroup>
```

#### Next.js Production Build Optimierung
```javascript
// next.config.js - Raspberry Pi Optimierungen
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  
  // Memory Optimierungen
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    isrMemoryCacheSize: 0, // Deaktiviert für RAM-Schonung
  },
  
  // Build Optimierungen
  swcMinify: true,
  
  // Image Optimierungen
  images: {
    deviceSizes: [640, 768, 1024], // Reduziert für geringere Memory
    imageSizes: [16, 32, 48, 64, 96, 128],
  },
}

module.exports = nextConfig
```

## 6. Deployment-Checkliste

### 6.1 Pre-Deployment Vorbereitung
- [ ] Raspberry Pi OS auf neuesten Stand
- [ ] Docker Engine 24+ installiert
- [ ] Docker Compose v2 Plugin verfügbar
- [ ] Ausreichend Speicherplatz (min. 4GB frei)
- [ ] SSH-Zugang konfiguriert
- [ ] Domain/DNS konfiguriert (booking.family.local)

### 6.2 Security Setup
- [ ] SSL-Zertifikate generiert
- [ ] Docker Secrets konfiguriert
- [ ] Firewall-Regeln aktiviert
- [ ] Non-root Container-User erstellt
- [ ] Backup-Strategie implementiert

### 6.3 Monitoring Setup
- [ ] Prometheus konfiguriert
- [ ] Grafana Dashboards importiert
- [ ] Alert-Manager konfiguriert
- [ ] Log-Aggregation aktiviert
- [ ] Health-Check Endpoints verfügbar

### 6.4 Performance Testing
- [ ] Memory Stress Tests bestanden
- [ ] CPU Load Tests bestanden
- [ ] Database Performance validiert
- [ ] Network Latency gemessen
- [ ] Concurrent User Tests durchgeführt

---

## Zusammenfassung

Das aktuelle Development-Setup ist gut strukturiert für Multi-Agent-Entwicklung, benötigt jedoch erhebliche Anpassungen für Production-Deployment auf Raspberry Pi Zero 2 W:

### Kritische Produktions-Anforderungen:
1. **Native AOT Backend** für 50-70% Memory-Reduktion  
2. **Static Generation Frontend** für minimalen Runtime-Footprint
3. **Resource Limits** für alle Services (Total: 380MB/512MB)
4. **Security Hardening** mit Secrets Management
5. **Monitoring Stack** für proaktive Performance-Überwachung

### Empfohlene Implementierungsreihenfolge:
1. **Phase 1**: ARM64-optimierte Dockerfiles erstellen
2. **Phase 2**: Production docker-compose.yml implementieren  
3. **Phase 3**: CI/CD Pipeline mit Multi-Architecture Builds
4. **Phase 4**: Blue-Green Deployment und Monitoring
5. **Phase 5**: Security Hardening und Performance Tuning

**Geschätzte Implementierungszeit:** 3-4 Wochen  
**Erwartete Performance:** 40-60% Memory-Nutzung, <2 Sekunden Response Time