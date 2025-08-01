#!/bin/bash

#################################################################################
# Complete System Installation for Raspberry Pi Zero 2 W Production Environment
# Installs and configures all required components for the Booking System
# Optimized for ARM64 with security hardening and performance tuning
#################################################################################

set -euo pipefail

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PRODUCTION_DIR="$(dirname "$SCRIPT_DIR")"
readonly INSTALL_LOG="/var/log/booking-installation.log"
readonly SYSTEM_USER="booking"
readonly APP_DIR="/opt/booking"
readonly BACKUP_DIR="/opt/booking/backups"

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Installation flags
SKIP_DOCKER="${SKIP_DOCKER:-false}"
SKIP_SECURITY="${SKIP_SECURITY:-false}"
SKIP_MONITORING="${SKIP_MONITORING:-false}"
SKIP_SSL="${SKIP_SSL:-false}"
DRY_RUN="${DRY_RUN:-false}"

#################################################################################
# Utility Functions
#################################################################################

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    local color=""
    case "$level" in
        ERROR) color="$RED" ;;
        SUCCESS) color="$GREEN" ;;
        WARNING) color="$YELLOW" ;;
        INFO) color="$BLUE" ;;
    esac
    
    echo -e "${color}[$timestamp] [$level] $message${NC}" | tee -a "$INSTALL_LOG"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        log "ERROR" "This script must be run as root"
        log "INFO" "Please run: sudo $0"
        exit 1
    fi
}

check_pi_zero() {
    local cpu_model
    cpu_model=$(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)
    
    if [[ "$cpu_model" != *"ARM Cortex-A53"* ]]; then
        log "WARNING" "Not running on expected Raspberry Pi Zero 2 W (Cortex-A53)"
        log "INFO" "Detected CPU: $cpu_model"
        log "INFO" "Continuing anyway..."
    else
        log "SUCCESS" "Detected Raspberry Pi Zero 2 W (ARM Cortex-A53)"
    fi
    
    # Check ARM64 architecture
    if [ "$(uname -m)" != "aarch64" ]; then
        log "ERROR" "Expected ARM64 (aarch64) architecture, got $(uname -m)"
        log "ERROR" "Please ensure you're running 64-bit Raspberry Pi OS"
        exit 1
    fi
    
    log "SUCCESS" "ARM64 architecture confirmed"
}

#################################################################################
# System Preparation
#################################################################################

update_system() {
    log "INFO" "Updating system packages..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Update package lists
        apt-get update -qq
        
        # Upgrade system with automatic restart services
        DEBIAN_FRONTEND=noninteractive apt-get upgrade -y -qq
        
        # Install essential packages
        apt-get install -y -qq \
            curl \
            wget \
            gnupg \
            lsb-release \
            ca-certificates \
            software-properties-common \
            apt-transport-https \
            unzip \
            git \
            htop \
            nano \
            tree \
            jq \
            openssl \
            fail2ban \
            ufw \
            logrotate \
            cron \
            rsync \
            acl
            
        log "SUCCESS" "System packages updated and essential tools installed"
    else
        log "INFO" "[DRY RUN] Would update system packages"
    fi
}

optimize_pi_zero() {
    log "INFO" "Optimizing Raspberry Pi Zero 2 W for production..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # GPU memory split (minimum for headless server)
        if ! grep -q "gpu_mem=16" /boot/config.txt; then
            echo "gpu_mem=16" >> /boot/config.txt
            log "INFO" "Set GPU memory to 16MB (minimum for headless)"
        fi
        
        # ARM frequency scaling for stability
        if ! grep -q "arm_freq=1000" /boot/config.txt; then
            echo "arm_freq=1000" >> /boot/config.txt
            log "INFO" "Set ARM frequency to 1000MHz for stability"
        fi
        
        # Memory management optimizations
        cat >> /etc/sysctl.d/99-pi-zero-optimization.conf << 'EOF'
# Raspberry Pi Zero 2 W memory optimizations
vm.swappiness=10
vm.vfs_cache_pressure=50
vm.dirty_background_ratio=5
vm.dirty_ratio=10
vm.overcommit_memory=1
vm.panic_on_oom=1

# Network optimizations for limited resources
net.core.rmem_default=65536
net.core.rmem_max=16777216
net.core.wmem_default=65536
net.core.wmem_max=16777216
net.ipv4.tcp_rmem=4096 65536 16777216
net.ipv4.tcp_wmem=4096 65536 16777216
net.ipv4.tcp_congestion_control=bbr

# Security hardening
kernel.dmesg_restrict=1
kernel.kptr_restrict=2
net.ipv4.conf.default.log_martians=1
net.ipv4.conf.all.log_martians=1
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.conf.all.accept_source_route=0
net.ipv4.conf.default.accept_source_route=0
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.default.accept_redirects=0
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.default.accept_redirects=0
net.ipv4.icmp_ignore_bogus_error_responses=1
net.ipv4.icmp_echo_ignore_broadcasts=1
net.ipv4.ip_forward=0
EOF
        
        # Apply sysctl settings
        sysctl -p /etc/sysctl.d/99-pi-zero-optimization.conf
        
        # Optimize systemd for Pi Zero
        mkdir -p /etc/systemd/system.conf.d
        cat > /etc/systemd/system.conf.d/pi-zero.conf << 'EOF'
[Manager]
# Reduce systemd overhead on Pi Zero
DefaultTimeoutStartSec=30s
DefaultTimeoutStopSec=15s
DefaultRestartSec=5s
DefaultLimitNOFILE=1024
RuntimeWatchdogSec=30s
EOF
        
        log "SUCCESS" "Pi Zero optimizations applied"
    else
        log "INFO" "[DRY RUN] Would apply Pi Zero optimizations"
    fi
}

create_system_user() {
    log "INFO" "Creating system user for booking application..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Create system user if it doesn't exist
        if ! id "$SYSTEM_USER" &>/dev/null; then
            useradd -r -s /bin/bash -d "$APP_DIR" -c "Booking System User" "$SYSTEM_USER"
            log "SUCCESS" "Created system user: $SYSTEM_USER"
        else
            log "INFO" "System user $SYSTEM_USER already exists"
        fi
        
        # Create application directories
        mkdir -p "$APP_DIR"/{data,logs,backups,ssl,scripts}
        mkdir -p "$APP_DIR/data"/{postgres,grafana,prometheus}
        
        # Set permissions
        chown -R "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR"
        chmod 755 "$APP_DIR"
        chmod 700 "$APP_DIR"/{ssl,backups}
        chmod 755 "$APP_DIR"/{data,logs,scripts}
        
        # Add booking user to docker group (will be created by Docker installation)
        usermod -a -G docker "$SYSTEM_USER" 2>/dev/null || true
        
        log "SUCCESS" "Application directories created and configured"
    else
        log "INFO" "[DRY RUN] Would create system user and directories"
    fi
}

#################################################################################
# Docker Installation
#################################################################################

install_docker() {
    if [ "$SKIP_DOCKER" = "true" ]; then
        log "INFO" "Skipping Docker installation (SKIP_DOCKER=true)"
        return 0
    fi
    
    log "INFO" "Installing Docker for ARM64..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Remove old Docker versions
        apt-get remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true
        
        # Add Docker's official GPG key
        curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        
        # Add Docker repository for ARM64
        echo "deb [arch=arm64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        
        # Update package index
        apt-get update -qq
        
        # Install Docker CE
        apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
        
        # Optimize Docker daemon for Pi Zero
        mkdir -p /etc/docker
        cat > /etc/docker/daemon.json << 'EOF'
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "storage-opts": [
        "overlay2.override_kernel_check=true"
    ],
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 64000,
            "Soft": 64000
        }
    },
    "max-concurrent-downloads": 2,
    "max-concurrent-uploads": 2,
    "default-shm-size": "64M"
}
EOF
        
        # Configure Docker systemd service for Pi Zero
        mkdir -p /etc/systemd/system/docker.service.d
        cat > /etc/systemd/system/docker.service.d/pi-zero.conf << 'EOF'
[Service]
# Memory limits for Pi Zero
MemoryAccounting=yes
MemoryMax=400M
# CPU limits
CPUAccounting=yes
CPUQuota=80%
# Restart configuration
Restart=unless-stopped
RestartSec=5
EOF
        
        # Enable and start Docker
        systemctl daemon-reload
        systemctl enable docker
        systemctl start docker
        
        # Add booking user to docker group
        usermod -a -G docker "$SYSTEM_USER"
        
        # Test Docker installation
        if docker run --rm hello-world > /dev/null 2>&1; then
            log "SUCCESS" "Docker installed and tested successfully"
        else
            log "ERROR" "Docker installation test failed"
            return 1
        fi
        
        # Initialize Docker Swarm for secrets support
        if ! docker info --format '{{.Swarm.LocalNodeState}}' | grep -q active; then
            docker swarm init --advertise-addr 127.0.0.1
            log "SUCCESS" "Docker Swarm initialized for secrets support"
        fi
        
    else
        log "INFO" "[DRY RUN] Would install Docker with Pi Zero optimizations"
    fi
}

#################################################################################
# Security Configuration
#################################################################################

configure_firewall() {
    if [ "$SKIP_SECURITY" = "true" ]; then
        log "INFO" "Skipping security configuration (SKIP_SECURITY=true)"
        return 0
    fi
    
    log "INFO" "Configuring UFW firewall..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Reset UFW to default
        ufw --force reset
        
        # Default policies
        ufw default deny incoming
        ufw default allow outgoing
        
        # SSH access (adjust port if changed)
        ufw allow 22/tcp comment 'SSH'
        
        # HTTP and HTTPS
        ufw allow 80/tcp comment 'HTTP'
        ufw allow 443/tcp comment 'HTTPS'
        
        # Optional: Prometheus monitoring (only from local network)
        # ufw allow from 192.168.0.0/16 to any port 9090 comment 'Prometheus'
        # ufw allow from 10.0.0.0/8 to any port 9090 comment 'Prometheus'
        
        # Enable UFW
        ufw --force enable
        
        log "SUCCESS" "UFW firewall configured and enabled"
    else
        log "INFO" "[DRY RUN] Would configure UFW firewall"
    fi
}

configure_fail2ban() {
    if [ "$SKIP_SECURITY" = "true" ]; then
        return 0
    fi
    
    log "INFO" "Configuring fail2ban for SSH protection..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Configure fail2ban for SSH
        cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
# Pi Zero optimized settings
bantime = 3600
findtime = 600
maxretry = 3
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
bantime = 1800

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 600
EOF
        
        # Create nginx filters
        mkdir -p /etc/fail2ban/filter.d
        
        cat > /etc/fail2ban/filter.d/nginx-req-limit.conf << 'EOF'
[Definition]
failregex = limiting requests, excess: .* by zone .*, client: <HOST>
ignoreregex =
EOF
        
        cat > /etc/fail2ban/filter.d/nginx-http-auth.conf << 'EOF'
[Definition]
failregex = no user/password was provided for basic authentication.*client: <HOST>
            user .* was not found in .*client: <HOST>
            user .* password mismatch.*client: <HOST>
ignoreregex =
EOF
        
        # Enable and start fail2ban
        systemctl enable fail2ban
        systemctl start fail2ban
        
        log "SUCCESS" "Fail2ban configured and started"
    else
        log "INFO" "[DRY RUN] Would configure fail2ban"
    fi
}

harden_ssh() {
    if [ "$SKIP_SECURITY" = "true" ]; then
        return 0
    fi
    
    log "INFO" "Hardening SSH configuration..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Backup original SSH config
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
        
        # Apply SSH hardening
        cat >> /etc/ssh/sshd_config.d/99-pi-zero-hardening.conf << 'EOF'
# SSH hardening for Pi Zero production
Protocol 2
Port 22
PermitRootLogin no
PasswordAuthentication yes
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
ClientAliveInterval 300
ClientAliveCountMax 2
MaxAuthTries 3
MaxSessions 2
LoginGraceTime 60
Banner /etc/ssh/banner

# Restrict to specific users if needed
# AllowUsers pi booking

# Key exchange and encryption
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512
EOF
        
        # Create SSH banner
        cat > /etc/ssh/banner << 'EOF'
################################################################################
#                          AUTHORIZED ACCESS ONLY                             #
#                                                                              #
#  This system is for authorized users only. All activities are monitored     #
#  and logged. Unauthorized access is prohibited and may be subject to        #
#  criminal and civil prosecution.                                             #
#                                                                              #
#                        Booking System Production Server                      #
################################################################################
EOF
        
        # Test SSH configuration
        if sshd -t; then
            systemctl restart sshd
            log "SUCCESS" "SSH hardening applied and service restarted"
        else
            log "ERROR" "SSH configuration test failed"
            return 1
        fi
    else
        log "INFO" "[DRY RUN] Would harden SSH configuration"
    fi
}

#################################################################################
# SSL Certificate Setup
#################################################################################

setup_ssl_certificates() {
    if [ "$SKIP_SSL" = "true" ]; then
        log "INFO" "Skipping SSL certificate setup (SKIP_SSL=true)"
        return 0
    fi
    
    log "INFO" "Setting up SSL certificates..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Create SSL directory
        mkdir -p "$APP_DIR/ssl"
        
        # Check if certificates already exist
        if [ -f "$APP_DIR/ssl/booking.crt" ] && [ -f "$APP_DIR/ssl/booking.key" ]; then
            log "INFO" "SSL certificates already exist"
            return 0
        fi
        
        # Install certbot for Let's Encrypt (commented out for now)
        # apt-get install -y certbot python3-certbot-nginx
        
        # For now, create self-signed certificates for testing
        log "INFO" "Creating self-signed SSL certificates for testing..."
        log "WARNING" "Replace with proper Let's Encrypt certificates in production!"
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$APP_DIR/ssl/booking.key" \
            -out "$APP_DIR/ssl/booking.crt" \
            -subj "/C=DE/ST=State/L=City/O=Organization/CN=booking.localhost"
        
        # Create CA certificate (same as certificate for self-signed)
        cp "$APP_DIR/ssl/booking.crt" "$APP_DIR/ssl/booking-ca.crt"
        
        # Set proper permissions
        chown -R "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR/ssl"
        chmod 700 "$APP_DIR/ssl"
        chmod 600 "$APP_DIR/ssl"/*.key
        chmod 644 "$APP_DIR/ssl"/*.crt
        
        log "SUCCESS" "Self-signed SSL certificates created"
        log "INFO" "For production, run: certbot --nginx -d yourdomain.com"
    else
        log "INFO" "[DRY RUN] Would setup SSL certificates"
    fi
}

#################################################################################
# Monitoring Setup
#################################################################################

setup_log_rotation() {
    log "INFO" "Setting up log rotation for application logs..."
    
    if [ "$DRY_RUN" = "false" ]; then
        cat > /etc/logrotate.d/booking-system << 'EOF'
/opt/booking/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    copytruncate
    create 644 booking booking
}

/var/log/booking-*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    sharedscripts
    copytruncate
    create 644 root root
}
EOF
        
        # Test logrotate configuration
        logrotate -d /etc/logrotate.d/booking-system
        
        log "SUCCESS" "Log rotation configured"
    else
        log "INFO" "[DRY RUN] Would setup log rotation"
    fi
}

install_monitoring_tools() {
    if [ "$SKIP_MONITORING" = "true" ]; then
        log "INFO" "Skipping monitoring tools installation (SKIP_MONITORING=true)"
        return 0
    fi
    
    log "INFO" "Installing monitoring tools..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Install system monitoring tools
        apt-get install -y -qq \
            htop \
            iotop \
            nethogs \
            tcpdump \
            sysstat
        
        # Create Pi Zero monitoring script
        cat > /usr/local/bin/pi-zero-monitor.sh << 'EOF'
#!/bin/bash
# Pi Zero 2 W System Monitor

echo "=== Raspberry Pi Zero 2 W System Status ==="
echo "Date: $(date)"
echo ""

# System info
echo "--- System Information ---"
echo "Uptime: $(uptime)"
echo "Load: $(cat /proc/loadavg)"
echo "CPU Temp: $(($(cat /sys/class/thermal/thermal_zone0/temp)/1000))°C"
echo ""

# Memory usage
echo "--- Memory Usage ---"
free -h
echo ""

# Disk usage
echo "--- Disk Usage ---"
df -h / /opt/booking
echo ""

# Docker containers
echo "--- Docker Containers ---"
if command -v docker &> /dev/null; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    echo "--- Container Resources ---"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
else
    echo "Docker not installed"
fi
echo ""

# Network connections
echo "--- Network Connections ---"
ss -tuln | head -10
echo ""

# Recent logs
echo "--- Recent System Logs ---"
journalctl --since "5 minutes ago" --no-pager | tail -10
EOF
        
        chmod +x /usr/local/bin/pi-zero-monitor.sh
        
        # Create daily monitoring cron job
        cat > /etc/cron.d/pi-zero-monitoring << 'EOF'
# Pi Zero monitoring - runs every hour
0 * * * * root /usr/local/bin/pi-zero-monitor.sh >> /var/log/pi-zero-monitoring.log 2>&1

# Log cleanup - runs daily at 2 AM
0 2 * * * root find /var/log -name "*.log" -size +100M -delete 2>/dev/null
EOF
        
        log "SUCCESS" "Monitoring tools installed and configured"
    else
        log "INFO" "[DRY RUN] Would install monitoring tools"
    fi
}

#################################################################################
# Docker Secrets Setup
#################################################################################

setup_docker_secrets() {
    log "INFO" "Setting up Docker secrets for production..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Generate secure random passwords
        local postgres_password
        local jwt_secret
        local smtp_password
        
        postgres_password=$(openssl rand -base64 32)
        jwt_secret=$(openssl rand -base64 64)
        smtp_password="your_smtp_password_here"  # User needs to set this
        
        # Create Docker secrets
        echo "$postgres_password" | docker secret create postgres_password - 2>/dev/null || {
            log "INFO" "postgres_password secret already exists"
        }
        
        echo "$jwt_secret" | docker secret create jwt_secret - 2>/dev/null || {
            log "INFO" "jwt_secret secret already exists"
        }
        
        echo "$smtp_password" | docker secret create smtp_password - 2>/dev/null || {
            log "INFO" "smtp_password secret already exists"
        }
        
        # Create secrets file for reference (without actual values)
        cat > "$APP_DIR/secrets-reference.txt" << EOF
# Docker Secrets Reference
# Actual secrets are stored in Docker Swarm and not visible here

postgres_password: [GENERATED - 32 characters]
jwt_secret: [GENERATED - 64 characters] 
smtp_password: [SET TO: your_smtp_password_here]

# To update secrets:
# echo 'new_value' | docker secret create secret_name_v2 -
# Update docker-compose.yml to use new secret name
# Remove old secret: docker secret rm old_secret_name

# To view existing secrets:
# docker secret ls
EOF
        
        chown "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR/secrets-reference.txt"
        chmod 600 "$APP_DIR/secrets-reference.txt"
        
        log "SUCCESS" "Docker secrets created"
        log "WARNING" "IMPORTANT: Update SMTP password with: echo 'your_real_password' | docker secret create smtp_password_v2 -"
    else
        log "INFO" "[DRY RUN] Would setup Docker secrets"
    fi
}

#################################################################################
# Final Configuration
#################################################################################

create_environment_file() {
    log "INFO" "Creating production environment configuration..."
    
    if [ "$DRY_RUN" = "false" ]; then
        cat > "$APP_DIR/.env.production" << 'EOF'
# Production Environment Configuration for Raspberry Pi Zero 2 W
# Source this file before running Docker Compose

# Domain Configuration
PUBLIC_URL=https://booking.yourdomain.com
ALLOWED_ORIGINS=https://booking.yourdomain.com

# Email Configuration (Update these values)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
FROM_EMAIL=noreply@yourdomain.com

# Grafana Configuration
GRAFANA_ADMIN_PASSWORD=admin123
GRAFANA_SECRET_KEY=your-grafana-secret-key

# Build Information
BUILD_DATE=$(date -u +'%Y-%m-%dT%H:%M:%SZ')
VCS_REF=$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')

# Performance Tuning for Pi Zero
COMPOSE_HTTP_TIMEOUT=120
DOCKER_CLIENT_TIMEOUT=120
EOF
        
        chown "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR/.env.production"
        chmod 600 "$APP_DIR/.env.production"
        
        log "SUCCESS" "Environment configuration created"
        log "WARNING" "IMPORTANT: Update email settings in $APP_DIR/.env.production"
    else
        log "INFO" "[DRY RUN] Would create environment file"
    fi
}

setup_systemd_service() {
    log "INFO" "Creating systemd service for booking system..."
    
    if [ "$DRY_RUN" = "false" ]; then
        cat > /etc/systemd/system/booking-system.service << EOF
[Unit]
Description=Booking System Production
Requires=docker.service
After=docker.service
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
User=$SYSTEM_USER
Group=$SYSTEM_USER

# Environment
EnvironmentFile=$APP_DIR/.env.production

# Start command
ExecStart=/usr/bin/docker compose -f $PRODUCTION_DIR/docker-compose.production.yml up -d

# Stop command
ExecStop=/usr/bin/docker compose -f $PRODUCTION_DIR/docker-compose.production.yml down

# Reload command
ExecReload=/usr/bin/docker compose -f $PRODUCTION_DIR/docker-compose.production.yml restart

# Restart configuration
Restart=no
TimeoutStartSec=300
TimeoutStopSec=120

[Install]
WantedBy=multi-user.target
EOF
        
        # Enable the service but don't start yet
        systemctl daemon-reload
        systemctl enable booking-system.service
        
        log "SUCCESS" "Systemd service created and enabled"
        log "INFO" "Start service with: sudo systemctl start booking-system"
    else
        log "INFO" "[DRY RUN] Would create systemd service"
    fi
}

install_deployment_scripts() {
    log "INFO" "Installing deployment and management scripts..."
    
    if [ "$DRY_RUN" = "false" ]; then
        # Copy deployment script
        cp "$PRODUCTION_DIR/scripts/deploy.sh" "$APP_DIR/scripts/"
        chmod +x "$APP_DIR/scripts/deploy.sh"
        
        # Create management shortcuts
        cat > /usr/local/bin/booking-deploy << EOF
#!/bin/bash
cd $APP_DIR
sudo -u $SYSTEM_USER ./scripts/deploy.sh "\$@"
EOF
        
        cat > /usr/local/bin/booking-status << EOF
#!/bin/bash
echo "=== Booking System Status ==="
systemctl status booking-system --no-pager
echo ""
cd $APP_DIR
if [ -f "$PRODUCTION_DIR/docker-compose.production.yml" ]; then
    sudo -u $SYSTEM_USER docker compose -f $PRODUCTION_DIR/docker-compose.production.yml ps
fi
EOF
        
        cat > /usr/local/bin/booking-logs << EOF
#!/bin/bash
cd $APP_DIR
if [ -f "$PRODUCTION_DIR/docker-compose.production.yml" ]; then
    sudo -u $SYSTEM_USER docker compose -f $PRODUCTION_DIR/docker-compose.production.yml logs "\$@"
fi
EOF
        
        chmod +x /usr/local/bin/booking-*
        
        # Set ownership
        chown -R "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR/scripts"
        
        log "SUCCESS" "Management scripts installed"
        log "INFO" "Available commands: booking-deploy, booking-status, booking-logs"
    else
        log "INFO" "[DRY RUN] Would install deployment scripts"
    fi
}

#################################################################################
# Main Installation Function
#################################################################################

main() {
    log "INFO" "Starting Booking System installation for Raspberry Pi Zero 2 W"
    log "INFO" "Dry Run: $DRY_RUN"
    log "INFO" "Skip Docker: $SKIP_DOCKER"
    log "INFO" "Skip Security: $SKIP_SECURITY"
    log "INFO" "Skip Monitoring: $SKIP_MONITORING"
    log "INFO" "Skip SSL: $SKIP_SSL"
    
    # Pre-flight checks
    check_root
    check_pi_zero
    
    # Installation steps
    update_system
    optimize_pi_zero
    create_system_user
    
    # Docker installation
    install_docker
    
    # Security configuration
    configure_firewall
    configure_fail2ban
    harden_ssh
    
    # SSL setup
    setup_ssl_certificates
    
    # Monitoring
    setup_log_rotation
    install_monitoring_tools
    
    # Application setup
    setup_docker_secrets
    create_environment_file
    setup_systemd_service
    install_deployment_scripts
    
    log "SUCCESS" "🎉 Booking System installation completed!"
    log "INFO" ""
    log "INFO" "=== Next Steps ==="
    log "INFO" "1. Update email settings in: $APP_DIR/.env.production"
    log "INFO" "2. Update SMTP password: echo 'password' | docker secret create smtp_password_v2 -"
    log "INFO" "3. Get SSL certificate: certbot --nginx -d yourdomain.com"
    log "INFO" "4. Deploy application: sudo booking-deploy"
    log "INFO" "5. Check status: sudo booking-status"
    log "INFO" "6. View logs: sudo booking-logs"
    log "INFO" ""
    log "INFO" "=== System Information ==="
    log "INFO" "Application directory: $APP_DIR"
    log "INFO" "System user: $SYSTEM_USER"
    log "INFO" "Log file: $INSTALL_LOG"
    log "INFO" "Monitor script: /usr/local/bin/pi-zero-monitor.sh"
    log "INFO" ""
    log "WARNING" "REBOOT RECOMMENDED to apply all kernel optimizations"
}

#################################################################################
# Script Entry Point
#################################################################################

# Handle command line arguments
case "${1:-install}" in
    "install")
        main
        ;;
    "update")
        log "INFO" "Running system update only..."
        update_system
        ;;
    "monitor")
        /usr/local/bin/pi-zero-monitor.sh
        ;;
    *)
        echo "Usage: $0 {install|update|monitor}"
        echo ""
        echo "Environment variables:"
        echo "  DRY_RUN=false           Preview installation without making changes"
        echo "  SKIP_DOCKER=false       Skip Docker installation"
        echo "  SKIP_SECURITY=false     Skip security hardening"
        echo "  SKIP_MONITORING=false   Skip monitoring tools"
        echo "  SKIP_SSL=false          Skip SSL certificate setup"
        echo ""
        echo "Examples:"
        echo "  $0 install              Full installation"
        echo "  DRY_RUN=true $0 install Preview installation"
        echo "  $0 update               Update system packages only"
        echo "  $0 monitor              Show system status"
        exit 1
        ;;
esac