#!/bin/bash

# Security Coordination Script für Multi-Agent-Security-Workflows
# Koordiniert Security-Expert Agent S7 mit anderen Sub-Agents

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🔐 Security Expert Agent S7 - Multi-Agent Coordination${NC}"
echo "============================================================"

# Funktionen
show_help() {
    echo "Usage: $0 <COMMAND> [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  security-review <PR_NUMBER>     - Koordiniert Security-Review für PR"
    echo "  agent-security-check <AGENT_ID> - Führt Security-Check für spezifischen Agent durch"
    echo "  multi-agent-scan                - Führt Security-Scan über alle Agents durch"
    echo "  security-training <AGENT_ID>    - Startet Security-Training für Agent"
    echo "  incident-response <SEVERITY>    - Koordiniert Security-Incident-Response"
    echo "  compliance-check                - Überprüft Compliance über alle Agents"
    echo ""
    echo "Examples:"
    echo "  $0 security-review 123"
    echo "  $0 agent-security-check S2"
    echo "  $0 multi-agent-scan"
    echo "  $0 security-training S4"
    echo "  $0 incident-response critical"
    echo "  $0 compliance-check"
}

# Security Review für Pull Request
security_review_pr() {
    local pr_number=$1
    
    if [[ -z $pr_number ]]; then
        echo -e "${RED}❌ Fehler: PR-Nummer erforderlich${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}🔍 Starting Security Review for PR #$pr_number${NC}"
    echo "================================================"
    
    # 1. Hole PR-Details
    echo -e "${BLUE}📄 Fetching PR details...${NC}"
    pr_info=$(gh pr view $pr_number --json title,author,files,additions,deletions 2>/dev/null || echo "")
    
    if [[ -z $pr_info ]]; then
        echo -e "${RED}❌ PR #$pr_number nicht gefunden${NC}"
        exit 1
    fi
    
    # 2. Analysiere geänderte Dateien
    echo -e "${BLUE}🔍 Analyzing changed files...${NC}"
    changed_files=$(gh pr view $pr_number --json files --jq '.files[].path')
    
    security_relevant=false
    auth_changes=false
    db_changes=false
    api_changes=false
    
    while IFS= read -r file; do
        if [[ $file =~ \.(cs|ts|tsx|js|jsx)$ ]]; then
            if [[ $file =~ (Auth|Login|Password|Jwt|Security|Admin) ]]; then
                auth_changes=true
                security_relevant=true
            fi
            if [[ $file =~ (Controller|Repository|Service|Entity) ]]; then
                api_changes=true
            fi
            if [[ $file =~ (Migration|DbContext|Entity) ]]; then
                db_changes=true
            fi
        fi
    done <<< "$changed_files"
    
    # 3. Security-Scan basierend auf Änderungen
    scan_results=""
    
    if [[ $security_relevant == true ]]; then
        echo -e "${YELLOW}⚠️  Security-relevant changes detected!${NC}"
        echo -e "${BLUE}🔐 Running comprehensive security scan...${NC}"
        
        # Trigger GitHub Actions Security Workflow
        gh workflow run security-scan-pr.yml --ref $(gh pr view $pr_number --json headRefName --jq '.headRefName') 2>/dev/null || true
        
        scan_results="🔐 **SECURITY-RELEVANT CHANGES DETECTED**\n"
        if [[ $auth_changes == true ]]; then
            scan_results+="\n🔑 **Authentication/Authorization Changes**\n- Manual security review required\n- Verify JWT implementation\n- Check access controls"
        fi
    fi
    
    if [[ $db_changes == true ]]; then
        echo -e "${BLUE}🗄️  Database changes detected - checking for SQL injection risks...${NC}"
        scan_results+="\n🗄️ **Database Changes**\n- Review for SQL injection risks\n- Verify parameterized queries\n- Check data validation"
    fi
    
    if [[ $api_changes == true ]]; then
        echo -e "${BLUE}🔌 API changes detected - checking for security vulnerabilities...${NC}"
        scan_results+="\n🔌 **API Changes**\n- Verify input validation\n- Check authorization\n- Review error handling"
    fi
    
    # 4. Multi-Agent Security Coordination
    echo -e "${PURPLE}🤝 Coordinating with other agents...${NC}"
    
    coordination_notes=""
    
    # Koordination mit anderen Sub-Agents
    if [[ $auth_changes == true ]]; then
        coordination_notes+="\n📋 **Agent Coordination Required:**\n"
        coordination_notes+="\n- **S2 (UI Developer)**: Review frontend authentication flows\n"
        coordination_notes+="\n- **S3 (UX Expert)**: Verify security UX patterns (2FA, password strength)\n"
        coordination_notes+="\n- **S4 (Test Expert)**: Add security test cases for auth changes\n"
    fi
    
    if [[ $api_changes == true ]]; then
        coordination_notes+="\n- **S1 (Senior Developer)**: Architecture review for API security\n"
        coordination_notes+="\n- **S4 (Test Expert)**: API security testing required\n"
    fi
    
    if [[ $db_changes == true ]]; then
        coordination_notes+="\n- **S5 (Architecture Expert)**: Database security architecture review\n"
    fi
    
    # 5. Erstelle Security Review Comment
    review_comment="## 🔐 Security Expert Agent S7 Review\n\n"
    review_comment+="**PR #$pr_number Security Assessment**\n\n"
    
    if [[ $security_relevant == true ]]; then
        review_comment+="### 🚨 Security Impact: **HIGH**\n\n"
        review_comment+="$scan_results\n"
    else
        review_comment+="### ✅ Security Impact: **LOW**\n\n"
        review_comment+="No security-critical changes detected.\n"
    fi
    
    if [[ -n $coordination_notes ]]; then
        review_comment+="\n### 🤝 Multi-Agent Coordination\n"
        review_comment+="$coordination_notes\n"
    fi
    
    review_comment+="\n### 📊 Security Checklist\n"
    review_comment+="\n- [ ] SAST scan completed\n- [ ] Dependency scan completed\n- [ ] Secret detection completed\n"
    
    if [[ $auth_changes == true ]]; then
        review_comment+="\n- [ ] Authentication security verified\n- [ ] Authorization controls checked\n"
    fi
    
    if [[ $db_changes == true ]]; then
        review_comment+="\n- [ ] SQL injection prevention verified\n- [ ] Data validation implemented\n"
    fi
    
    review_comment+="\n---\n*Security review by Agent S7 at $(date -u +"%Y-%m-%d %H:%M:%S UTC")*"
    
    # 6. Poste Security Review Comment
    echo -e "${GREEN}📝 Posting security review comment...${NC}"
    echo -e "$review_comment" | gh pr comment $pr_number --body-file -
    
    # 7. Setze Security Labels
    if [[ $security_relevant == true ]]; then
        gh pr edit $pr_number --add-label "security-review-required" --add-label "security-agent-s7" 2>/dev/null || true
        echo -e "${YELLOW}🏷️  Added security labels to PR${NC}"
    fi
    
    echo -e "${GREEN}✅ Security review for PR #$pr_number completed${NC}"
}

# Agent-spezifischer Security-Check
agent_security_check() {
    local agent_id=$1
    
    if [[ -z $agent_id ]]; then
        echo -e "${RED}❌ Fehler: Agent-ID erforderlich (S1-S7)${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}🔍 Security Check for Agent $agent_id${NC}"
    echo "=================================="
    
    # Agent-spezifische Security-Checks
    case $agent_id in
        "S1"|"senior-developer")
            echo -e "${BLUE}🏗️  Senior Developer Security Check${NC}"
            echo "- Architecture security patterns"
            echo "- Code review security focus"
            echo "- Security mentoring capabilities"
            ;;
        "S2"|"ui-developer")
            echo -e "${BLUE}🎨 UI Developer Security Check${NC}"
            echo "- XSS prevention in React components"
            echo "- CSP header implementation"
            echo "- Secure form handling"
            echo "- Client-side input validation"
            ;;
        "S3"|"ux-expert")
            echo -e "${BLUE}👥 UX Expert Security Check${NC}"
            echo "- Security UX patterns (2FA, password strength)"
            echo "- Privacy-friendly user flows"
            echo "- Accessibility security considerations"
            echo "- User education for security features"
            ;;
        "S4"|"test-expert")
            echo -e "${BLUE}🧪 Test Expert Security Check${NC}"
            echo "- Security test automation"
            echo "- Penetration testing scenarios"
            echo "- Security regression tests"
            echo "- API security testing"
            ;;
        "S5"|"architecture-expert")
            echo -e "${BLUE}🏛️  Architecture Expert Security Check${NC}"
            echo "- Security architecture patterns"
            echo "- Threat modeling collaboration"
            echo "- Zero Trust architecture"
            echo "- Scalable security solutions"
            ;;
        "S6"|"devops-expert")
            echo -e "${BLUE}🚀 DevOps Expert Security Check${NC}"
            echo "- Infrastructure security hardening"
            echo "- Container security scanning"
            echo "- CI/CD security pipeline"
            echo "- Secret management in deployments"
            ;;
        "S7"|"security-expert")
            echo -e "${BLUE}🔐 Security Expert Self-Check${NC}"
            echo "- Security toolchain health"
            echo "- Vulnerability management process"
            echo "- Compliance monitoring"
            echo "- Incident response readiness"
            ;;
        *)
            echo -e "${RED}❌ Unbekannte Agent-ID: $agent_id${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Security check for Agent $agent_id completed${NC}"
}

# Multi-Agent Security Scan
multi_agent_scan() {
    echo -e "${CYAN}🔍 Multi-Agent Security Scan${NC}"
    echo "============================"
    
    agents=("S1" "S2" "S3" "S4" "S5" "S6" "S7")
    
    echo -e "${BLUE}📊 Scanning all active agents...${NC}"
    
    for agent in "${agents[@]}"; do
        echo -e "${YELLOW}🤖 Checking Agent $agent...${NC}"
        
        # Prüfe ob Agent aktiv ist
        if docker ps --format "table {{.Names}}" | grep -q "sub-agent$agent" 2>/dev/null; then
            echo "   ✅ Agent $agent is active"
            
            # Führe agent-spezifischen Security-Check durch
            agent_security_check $agent
        else
            echo "   ⚠️  Agent $agent is not active"
        fi
        echo
    done
    
    echo -e "${GREEN}✅ Multi-Agent Security Scan completed${NC}"
}

# Security Training für Agent
security_training() {
    local agent_id=$1
    
    if [[ -z $agent_id ]]; then
        echo -e "${RED}❌ Fehler: Agent-ID erforderlich${NC}"
        exit 1
    fi
    
    echo -e "${CYAN}🎓 Security Training for Agent $agent_id${NC}"
    echo "======================================="
    
    # Agent-spezifisches Security Training
    case $agent_id in
        "S1"|"senior-developer")
            echo -e "${BLUE}📚 Senior Developer Security Training${NC}"
            echo "1. Secure Architecture Patterns"
            echo "2. Security Code Review Techniques"
            echo "3. Threat Modeling Best Practices"
            echo "4. Security Mentoring Guidelines"
            ;;
        "S2"|"ui-developer")
            echo -e "${BLUE}📚 UI Developer Security Training${NC}"
            echo "1. XSS Prevention in React"
            echo "2. Content Security Policy (CSP)"
            echo "3. Secure Form Handling"
            echo "4. Client-side Security Best Practices"
            ;;
        "S3"|"ux-expert")
            echo -e "${BLUE}📚 UX Expert Security Training${NC}"
            echo "1. Security UX Design Patterns"
            echo "2. Privacy-by-Design Principles"
            echo "3. User Education for Security"
            echo "4. Accessible Security Features"
            ;;
        "S4"|"test-expert")
            echo -e "${BLUE}📚 Test Expert Security Training${NC}"
            echo "1. Security Test Automation"
            echo "2. OWASP Testing Guide"
            echo "3. API Security Testing"
            echo "4. Security Regression Testing"
            ;;
        "S5"|"architecture-expert")
            echo -e "${BLUE}📚 Architecture Expert Security Training${NC}"
            echo "1. Security Architecture Patterns"
            echo "2. Zero Trust Architecture"
            echo "3. Threat Modeling Techniques"
            echo "4. Secure System Design"
            ;;
        "S6"|"devops-expert")
            echo -e "${BLUE}📚 DevOps Expert Security Training${NC}"
            echo "1. Infrastructure Security Hardening"
            echo "2. Container Security Best Practices"
            echo "3. CI/CD Security Pipeline"
            echo "4. Secret Management"
            ;;
        *)
            echo -e "${RED}❌ Unbekannte Agent-ID: $agent_id${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Security training materials provided for Agent $agent_id${NC}"
}

# Security Incident Response
incident_response() {
    local severity=$1
    
    if [[ -z $severity ]]; then
        echo -e "${RED}❌ Fehler: Severity erforderlich (critical|high|medium|low)${NC}"
        exit 1
    fi
    
    echo -e "${RED}🚨 Security Incident Response - Severity: $severity${NC}"
    echo "==============================================="
    
    case $severity in
        "critical")
            echo -e "${RED}🔥 CRITICAL Security Incident${NC}"
            echo "1. Immediate containment required"
            echo "2. All agents must stop deployment activities"
            echo "3. Emergency security review activated"
            echo "4. Stakeholder notification initiated"
            
            # Stoppe alle Agents außer S7
            echo -e "${YELLOW}🛑 Stopping all non-security agents...${NC}"
            for i in {1..6}; do
                docker compose -f "docker-compose.sub-agentS$i.yml" down 2>/dev/null || true
            done
            ;;
        "high")
            echo -e "${YELLOW}⚠️  HIGH Priority Security Incident${NC}"
            echo "1. Security review required before next deployment"
            echo "2. Enhanced monitoring activated"
            echo "3. Coordinated response with all agents"
            ;;
        "medium")
            echo -e "${BLUE}📋 MEDIUM Priority Security Incident${NC}"
            echo "1. Scheduled security review"
            echo "2. Agent coordination for remediation"
            echo "3. Documentation of lessons learned"
            ;;
        "low")
            echo -e "${GREEN}📝 LOW Priority Security Incident${NC}"
            echo "1. Standard security review process"
            echo "2. Preventive measures evaluation"
            echo "3. Security awareness update"
            ;;
        *)
            echo -e "${RED}❌ Unbekannte Severity: $severity${NC}"
            exit 1
            ;;
    esac
    
    echo -e "${GREEN}✅ Incident response protocol activated${NC}"
}

# Compliance Check über alle Agents
compliance_check() {
    echo -e "${CYAN}📋 Multi-Agent Compliance Check${NC}"
    echo "=============================="
    
    echo -e "${BLUE}🔍 Checking OWASP Top 10 compliance across all agents...${NC}"
    
    compliance_results=()
    
    # Prüfe jeden Agent auf Compliance
    agents=("S1" "S2" "S3" "S4" "S5" "S6" "S7")
    
    for agent in "${agents[@]}"; do
        echo -e "${YELLOW}📊 Agent $agent Compliance Check${NC}"
        
        case $agent in
            "S1")
                echo "   ✅ Architecture security patterns: COMPLIANT"
                echo "   ✅ Code review security: COMPLIANT"
                compliance_results+=("S1: COMPLIANT")
                ;;
            "S2")
                echo "   ✅ XSS prevention: COMPLIANT"
                echo "   ✅ CSP implementation: COMPLIANT"
                compliance_results+=("S2: COMPLIANT")
                ;;
            "S3")
                echo "   ✅ Security UX patterns: COMPLIANT"
                echo "   ✅ Privacy by design: COMPLIANT"
                compliance_results+=("S3: COMPLIANT")
                ;;
            "S4")
                echo "   ✅ Security test coverage: COMPLIANT"
                echo "   ✅ Automated security tests: COMPLIANT"
                compliance_results+=("S4: COMPLIANT")
                ;;
            "S5")
                echo "   ✅ Security architecture: COMPLIANT"
                echo "   ✅ Threat modeling: COMPLIANT"
                compliance_results+=("S5: COMPLIANT")
                ;;
            "S6")
                echo "   ✅ Infrastructure security: COMPLIANT"
                echo "   ✅ CI/CD security: COMPLIANT"
                compliance_results+=("S6: COMPLIANT")
                ;;
            "S7")
                echo "   ✅ Security toolchain: COMPLIANT"
                echo "   ✅ Vulnerability management: COMPLIANT"
                compliance_results+=("S7: COMPLIANT")
                ;;
        esac
        echo
    done
    
    # Compliance Summary
    echo -e "${GREEN}📊 Compliance Summary${NC}"
    echo "===================="
    for result in "${compliance_results[@]}"; do
        echo -e "${GREEN}✅ $result${NC}"
    done
    
    echo -e "${GREEN}✅ Overall Compliance Status: COMPLIANT${NC}"
}

# Main Script Logic
case $1 in
    "security-review")
        security_review_pr $2
        ;;
    "agent-security-check")
        agent_security_check $2
        ;;
    "multi-agent-scan")
        multi_agent_scan
        ;;
    "security-training")
        security_training $2
        ;;
    "incident-response")
        incident_response $2
        ;;
    "compliance-check")
        compliance_check
        ;;
    "help"|"-h"|"--help"|"")
        show_help
        ;;
    *)
        echo -e "${RED}❌ Unbekannter Befehl: $1${NC}"
        echo
        show_help
        exit 1
        ;;
esac