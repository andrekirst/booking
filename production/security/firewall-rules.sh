#!/bin/bash
# Firewall Rules für Booking System auf Raspberry Pi Zero 2 W
# Hochsichere iptables-Konfiguration für Production

set -euo pipefail

# =============================================================================
# KONFIGURATION
# =============================================================================
# Trusted Networks (anpassen nach Bedarf)
TRUSTED_NETWORKS="192.168.1.0/24 10.0.0.0/8"
SSH_PORT=22
HTTP_PORT=80
HTTPS_PORT=443

# Docker Networks
DOCKER_NETWORK="172.20.0.0/24"

# Log Prefix für bessere Analyse
LOG_PREFIX="[FIREWALL-BOOKING]"

# =============================================================================
# FUNCTIONS
# =============================================================================
log_info() {
    echo "[INFO] $1"
    logger -t "booking-firewall" "$1"
}

log_error() {
    echo "[ERROR] $1" >&2
    logger -t "booking-firewall" -p user.err "$1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
}

# =============================================================================
# FIREWALL INITIALIZATION
# =============================================================================
init_firewall() {
    log_info "Initializing firewall rules for Booking System..."
    
    # Flush all existing rules
    iptables -F
    iptables -X
    iptables -t nat -F
    iptables -t nat -X
    iptables -t mangle -F
    iptables -t mangle -X
    
    # Set default policies to DROP (Security First)
    iptables -P INPUT DROP
    iptables -P FORWARD DROP
    iptables -P OUTPUT ACCEPT
    
    log_info "Firewall initialized with DROP-by-default policy"
}

# =============================================================================
# BASIC RULES
# =============================================================================
setup_basic_rules() {
    log_info "Setting up basic firewall rules..."
    
    # Allow loopback traffic (essential for Docker)
    iptables -A INPUT -i lo -j ACCEPT
    iptables -A OUTPUT -o lo -j ACCEPT
    
    # Allow established and related connections
    iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
    
    # Drop invalid packets
    iptables -A INPUT -m conntrack --ctstate INVALID -j LOG --log-prefix "${LOG_PREFIX} INVALID: "
    iptables -A INPUT -m conntrack --ctstate INVALID -j DROP
    
    log_info "Basic rules configured"
}

# =============================================================================
# SSH PROTECTION - Kritisch für Pi Zero Administration
# =============================================================================
setup_ssh_protection() {
    log_info "Setting up SSH protection..."
    
    # SSH Rate Limiting - Schutz vor Brute Force
    iptables -N SSH_LIMIT 2>/dev/null || true
    iptables -A SSH_LIMIT -m recent --set --name SSH --rsource
    iptables -A SSH_LIMIT -m recent --update --seconds 60 --hitcount 4 --name SSH --rsource -j LOG --log-prefix "${LOG_PREFIX} SSH-LIMIT: "
    iptables -A SSH_LIMIT -m recent --update --seconds 60 --hitcount 4 --name SSH --rsource -j DROP
    iptables -A SSH_LIMIT -j ACCEPT
    
    # Allow SSH from trusted networks only
    for network in $TRUSTED_NETWORKS; do
        iptables -A INPUT -p tcp --dport $SSH_PORT -s $network -j SSH_LIMIT
        log_info "SSH access allowed from $network"
    done
    
    # Block SSH from all other sources
    iptables -A INPUT -p tcp --dport $SSH_PORT -j LOG --log-prefix "${LOG_PREFIX} SSH-BLOCK: "
    iptables -A INPUT -p tcp --dport $SSH_PORT -j DROP
}

# =============================================================================
# WEB SERVICES PROTECTION
# =============================================================================
setup_web_protection() {
    log_info "Setting up web services protection..."
    
    # HTTP/HTTPS Rate Limiting
    iptables -N WEB_LIMIT 2>/dev/null || true
    
    # Allow legitimate web traffic with rate limiting
    # 20 connections per minute per IP (Pi Zero constraint)
    iptables -A WEB_LIMIT -m recent --set --name WEB --rsource
    iptables -A WEB_LIMIT -m recent --update --seconds 60 --hitcount 20 --name WEB --rsource -j LOG --log-prefix "${LOG_PREFIX} WEB-LIMIT: "
    iptables -A WEB_LIMIT -m recent --update --seconds 60 --hitcount 20 --name WEB --rsource -j DROP
    iptables -A WEB_LIMIT -j ACCEPT
    
    # HTTP (Port 80) - Redirect to HTTPS
    iptables -A INPUT -p tcp --dport $HTTP_PORT -m conntrack --ctstate NEW -j WEB_LIMIT
    
    # HTTPS (Port 443) - Main service
    iptables -A INPUT -p tcp --dport $HTTPS_PORT -m conntrack --ctstate NEW -j WEB_LIMIT
    
    log_info "Web protection configured (Rate limiting: 20 req/min per IP)"
}

# =============================================================================
# DOCKER NETWORK RULES
# =============================================================================
setup_docker_rules() {
    log_info "Setting up Docker network rules..."
    
    # Allow Docker internal communication
    iptables -A INPUT -s $DOCKER_NETWORK -d $DOCKER_NETWORK -j ACCEPT
    
    # Allow Docker to access external resources (outbound)
    iptables -A FORWARD -s $DOCKER_NETWORK ! -d $DOCKER_NETWORK -j ACCEPT
    iptables -A FORWARD -d $DOCKER_NETWORK -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
    
    # Block direct external access to Docker containers (Security)
    iptables -A INPUT -s ! $DOCKER_NETWORK -d $DOCKER_NETWORK -j LOG --log-prefix "${LOG_PREFIX} DOCKER-BLOCK: "
    iptables -A INPUT -s ! $DOCKER_NETWORK -d $DOCKER_NETWORK -j DROP
    
    log_info "Docker network rules configured"
}

# =============================================================================
# DDoS PROTECTION für Pi Zero 2 W
# =============================================================================
setup_ddos_protection() {
    log_info "Setting up DDoS protection..."
    
    # SYN Flood Protection
    iptables -N SYN_FLOOD 2>/dev/null || true
    iptables -A SYN_FLOOD -m limit --limit 2/s --limit-burst 6 -j RETURN
    iptables -A SYN_FLOOD -j LOG --log-prefix="${LOG_PREFIX} SYN-FLOOD: "
    iptables -A SYN_FLOOD -j DROP
    iptables -A INPUT -p tcp --syn -j SYN_FLOOD
    
    # ICMP Flood Protection (Ping)
    iptables -A INPUT -p icmp --icmp-type echo-request -m limit --limit 1/s --limit-burst 3 -j ACCEPT
    iptables -A INPUT -p icmp --icmp-type echo-request -j LOG --log-prefix="${LOG_PREFIX} ICMP-FLOOD: "
    iptables -A INPUT -p icmp --icmp-type echo-request -j DROP
    
    # Port Scan Detection
    iptables -N PORT_SCAN 2>/dev/null || true
    iptables -A PORT_SCAN -m recent --set --name PORTSCAN --rsource
    iptables -A PORT_SCAN -m recent --update --seconds 60 --hitcount 10 --name PORTSCAN --rsource -j LOG --log-prefix="${LOG_PREFIX} PORT-SCAN: "
    iptables -A PORT_SCAN -m recent --update --seconds 60 --hitcount 10 --name PORTSCAN --rsource -j DROP
    iptables -A PORT_SCAN -j ACCEPT
    
    # Apply port scan detection to new connections
    iptables -A INPUT -m conntrack --ctstate NEW -j PORT_SCAN
    
    log_info "DDoS protection configured"
}

# =============================================================================
# MALICIOUS TRAFFIC DETECTION
# =============================================================================
setup_malicious_traffic_protection() {
    log_info "Setting up malicious traffic protection..."
    
    # Block common attack patterns
    
    # Block NULL packets
    iptables -A INPUT -p tcp --tcp-flags ALL NONE -j LOG --log-prefix="${LOG_PREFIX} NULL-PACKET: "
    iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
    
    # Block SYN-FIN packets
    iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j LOG --log-prefix="${LOG_PREFIX} SYN-FIN: "
    iptables -A INPUT -p tcp --tcp-flags SYN,FIN SYN,FIN -j DROP
    
    # Block SYN-RST packets
    iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j LOG --log-prefix="${LOG_PREFIX} SYN-RST: "
    iptables -A INPUT -p tcp --tcp-flags SYN,RST SYN,RST -j DROP
    
    # Block FIN-RST packets
    iptables -A INPUT -p tcp --tcp-flags FIN,RST FIN,RST -j LOG --log-prefix="${LOG_PREFIX} FIN-RST: "
    iptables -A INPUT -p tcp --tcp-flags FIN,RST FIN,RST -j DROP
    
    # Block FIN without ACK
    iptables -A INPUT -p tcp --tcp-flags ACK,FIN FIN -j LOG --log-prefix="${LOG_PREFIX} FIN-NO-ACK: "
    iptables -A INPUT -p tcp --tcp-flags ACK,FIN FIN -j DROP
    
    # Block PSH without ACK
    iptables -A INPUT -p tcp --tcp-flags ACK,PSH PSH -j LOG --log-prefix="${LOG_PREFIX} PSH-NO-ACK: "
    iptables -A INPUT -p tcp --tcp-flags ACK,PSH PSH -j DROP
    
    # Block URG without ACK
    iptables -A INPUT -p tcp --tcp-flags ACK,URG URG -j LOG --log-prefix="${LOG_PREFIX} URG-NO-ACK: "
    iptables -A INPUT -p tcp --tcp-flags ACK,URG URG -j DROP
    
    log_info "Malicious traffic protection configured"
}

# =============================================================================
# GEOBLOCKING (Optional)
# =============================================================================
setup_geoblocking() {
    log_info "Setting up geoblocking (optional)..."
    
    # Beispiel: Blockiere bekannte Angreifer-Länder
    # Uncomment und anpassen nach Bedarf
    
    # # Block China
    # iptables -A INPUT -m geoip --src-cc CN -j LOG --log-prefix="${LOG_PREFIX} GEO-BLOCK-CN: "
    # iptables -A INPUT -m geoip --src-cc CN -j DROP
    
    # # Block Russia  
    # iptables -A INPUT -m geoip --src-cc RU -j LOG --log-prefix="${LOG_PREFIX} GEO-BLOCK-RU: "
    # iptables -A INPUT -m geoip --src-cc RU -j DROP
    
    log_info "Geoblocking configured (disabled by default)"
}

# =============================================================================
# MONITORING RULES
# =============================================================================
setup_monitoring() {
    log_info "Setting up monitoring rules..."
    
    # Log dropped packets (sampling to avoid log spam on Pi Zero)
    iptables -A INPUT -j LOG --log-prefix="${LOG_PREFIX} DROPPED: " -m limit --limit 2/min --limit-burst 5
    
    log_info "Monitoring rules configured"
}

# =============================================================================
# SAVE RULES
# =============================================================================
save_rules() {
    log_info "Saving firewall rules..."
    
    # Ubuntu/Debian
    if command -v iptables-save >/dev/null; then
        iptables-save > /etc/iptables/rules.v4
        log_info "Rules saved to /etc/iptables/rules.v4"
    fi
    
    # Create systemd service for persistence
    cat > /etc/systemd/system/booking-firewall.service << EOF
[Unit]
Description=Booking System Firewall Rules
After=network.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/firewall-rules.sh
RemainAfterExit=yes

[Install]
WantedBy=multi-user.target
EOF
    
    systemctl enable booking-firewall.service
    log_info "Firewall service enabled for boot"
}

# =============================================================================
# STATUS CHECK
# =============================================================================
show_status() {
    echo "==================== FIREWALL STATUS ===================="
    echo "Input Policy: $(iptables -L INPUT | head -1)"
    echo "Forward Policy: $(iptables -L FORWARD | head -1)"
    echo "Output Policy: $(iptables -L OUTPUT | head -1)"
    echo ""
    echo "Active Rules:"
    iptables -L -n -v --line-numbers | head -30
    echo ""
    echo "Recent blocked IPs:"
    iptables -L | grep -E "(DROP|REJECT)" | head -5
    echo "=========================================================="
}

# =============================================================================
# MAIN EXECUTION
# =============================================================================
main() {
    case "${1:-setup}" in
        "setup")
            check_root
            init_firewall
            setup_basic_rules
            setup_ssh_protection
            setup_web_protection
            setup_docker_rules
            setup_ddos_protection
            setup_malicious_traffic_protection
            setup_geoblocking
            setup_monitoring
            save_rules
            log_info "Firewall setup completed successfully!"
            show_status
            ;;
        "status")
            show_status
            ;;
        "reset")
            check_root
            log_info "Resetting firewall to default (ACCEPT ALL)"
            iptables -F
            iptables -X
            iptables -P INPUT ACCEPT
            iptables -P FORWARD ACCEPT
            iptables -P OUTPUT ACCEPT
            log_info "Firewall reset completed"
            ;;
        *)
            echo "Usage: $0 {setup|status|reset}"
            echo "  setup  - Configure production firewall rules"
            echo "  status - Show current firewall status"
            echo "  reset  - Reset firewall to default (DANGEROUS!)"
            exit 1
            ;;
    esac
}

# Install script to system location
if [[ "${BASH_SOURCE[0]}" != "/usr/local/bin/firewall-rules.sh" ]]; then
    if [[ $EUID -eq 0 ]]; then
        cp "$0" /usr/local/bin/firewall-rules.sh
        chmod +x /usr/local/bin/firewall-rules.sh
        log_info "Script installed to /usr/local/bin/firewall-rules.sh"
    fi
fi

main "$@"