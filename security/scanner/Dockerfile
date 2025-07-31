# Security Scanner Service Dockerfile
# Kombiniert mehrere Security-Tools in einem Container für Agent S7

FROM ubuntu:22.04

# Verhindere interaktive Prompts
ENV DEBIAN_FRONTEND=noninteractive

# Basis-Pakete installieren
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    python3 \
    python3-pip \
    nodejs \
    npm \
    openjdk-11-jdk \
    unzip \
    jq \
    && rm -rf /var/lib/apt/lists/*

# Security-Tools installieren
WORKDIR /security-tools

# 1. OWASP ZAP CLI
RUN wget -q https://github.com/zaproxy/zaproxy/releases/download/v2.14.0/ZAP_2_14_0_unix.sh \
    && chmod +x ZAP_2_14_0_unix.sh \
    && ./ZAP_2_14_0_unix.sh -q \
    && rm ZAP_2_14_0_unix.sh

# 2. Trivy Container Scanner
RUN curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin

# 3. OWASP Dependency Check
RUN wget -q https://github.com/jeremylong/DependencyCheck/releases/download/v9.0.8/dependency-check-9.0.8-release.zip \
    && unzip dependency-check-9.0.8-release.zip \
    && rm dependency-check-9.0.8-release.zip \
    && chmod +x dependency-check/bin/dependency-check.sh \
    && ln -s /security-tools/dependency-check/bin/dependency-check.sh /usr/local/bin/dependency-check

# 4. Semgrep SAST Scanner
RUN pip3 install semgrep

# 5. Safety (Python dependency security)
RUN pip3 install safety

# 6. GitLeaks für Secret Detection
RUN curl -sSfL https://raw.githubusercontent.com/gitleaks/gitleaks/master/scripts/install.sh | sh -s -- -b /usr/local/bin

# 7. Bandit (Python SAST)
RUN pip3 install bandit

# 8. ESLint Security Plugin
RUN npm install -g eslint eslint-plugin-security

# Security Scanner Script
COPY security-scanner.py /usr/local/bin/security-scanner
COPY zap-scan.py /usr/local/bin/zap-scan
COPY report-generator.py /usr/local/bin/report-generator

RUN chmod +x /usr/local/bin/security-scanner \
    && chmod +x /usr/local/bin/zap-scan \
    && chmod +x /usr/local/bin/report-generator

# Working Directory für Scans
WORKDIR /app

# Environment Variables
ENV ZAP_HOME=/security-tools/ZAP_2.14.0
ENV PATH="${ZAP_HOME}:${PATH}"
ENV PYTHONPATH=/usr/local/lib/python3.10/site-packages

# Health Check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python3 -c "import requests; requests.get('http://localhost:8080/health')" || exit 1

# Ports für Security-Tools
EXPOSE 8080 8090 8443

# Default Command
CMD ["python3", "/usr/local/bin/security-scanner"]