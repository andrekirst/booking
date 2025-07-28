#!/bin/bash

# Claude Code Sub-Agent Wrapper Script
# Simulates Claude Code CLI integration for Sub-Agents

set -e

AGENT_ROLE=${CLAUDE_AGENT_ROLE:-"unknown"}
SUB_AGENT_ID=${CLAUDE_SUB_AGENT_ID:-"unknown"}
WORKSPACE=${CLAUDE_WORKSPACE:-"/workspace"}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo -e "${PURPLE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║${NC}  🤖 ${CYAN}Claude Code Sub-Agent ${SUB_AGENT_ID}${NC} (${YELLOW}${AGENT_ROLE}${NC})                  ${PURPLE}║${NC}"
echo -e "${PURPLE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Load agent-specific configuration
CLAUDE_CONFIG="${WORKSPACE}/CLAUDE.md"
if [ -f "$CLAUDE_CONFIG" ]; then
    echo -e "${GREEN}✅ Agent configuration loaded from CLAUDE.md${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: CLAUDE.md not found, using default configuration${NC}"
fi

# Display agent capabilities
echo -e "${BLUE}🎯 Agent Specializations:${NC}"
case $AGENT_ROLE in
    "senior-developer")
        echo "   • Code Architecture & Design Patterns"
        echo "   • Performance Optimization"
        echo "   • Complex Problem Solving"
        echo "   • Technical Leadership & Mentoring"
        ;;
    "ui-developer")
        echo "   • React/Next.js Component Development"
        echo "   • Tailwind CSS & Modern Styling"
        echo "   • Responsive & Mobile-First Design"
        echo "   • Component Libraries & Design Systems"
        ;;
    "ux-expert")
        echo "   • User Experience Design"
        echo "   • Accessibility & WCAG Compliance"
        echo "   • Usability Testing & User Research"
        echo "   • Information Architecture"
        ;;
    "test-expert")
        echo "   • Test Strategy & Planning"
        echo "   • Unit, Integration & E2E Testing"
        echo "   • Test Automation & CI/CD Integration"
        echo "   • Quality Assurance & Metrics"
        ;;
    "architecture-expert")
        echo "   • System Architecture & Design"
        echo "   • Database Design & Optimization"
        echo "   • Scalability & Performance Patterns"
        echo "   • Event-Driven Architecture"
        ;;
    "devops-expert")
        echo "   • CI/CD Pipeline Design"
        echo "   • Docker & Container Orchestration"
        echo "   • Infrastructure as Code"
        echo "   • Monitoring & Observability"
        ;;
    *)
        echo "   • General Software Development"
        ;;
esac

echo ""

# Show workspace information
echo -e "${BLUE}📂 Workspace Information:${NC}"
echo "   Path: $WORKSPACE"
if [ -d "$WORKSPACE/.git" ]; then
    CURRENT_BRANCH=$(cd "$WORKSPACE" && git branch --show-current 2>/dev/null || echo "unknown")
    echo "   Git Branch: $CURRENT_BRANCH"
    echo -e "   ${GREEN}✅ Git repository detected${NC}"
else
    echo -e "   ${YELLOW}⚠️  No Git repository found${NC}"
fi

# Show service URLs
echo ""
echo -e "${BLUE}🌐 Service URLs:${NC}"
[ -n "$FRONTEND_URL" ] && echo "   Frontend:  $FRONTEND_URL"
[ -n "$BACKEND_URL" ] && echo "   Backend:   $BACKEND_URL"
echo "   Health:    http://localhost:3000/health"

echo ""

# Start health server in background
echo -e "${GREEN}🚀 Starting Claude Sub-Agent Health Server...${NC}"
node /workspace/health-server.js &
HEALTH_PID=$!

# Trap to cleanup background process
trap "kill $HEALTH_PID 2>/dev/null || true" EXIT

# Wait a moment for health server to start
sleep 2

# Check if health server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health server is running${NC}"
else
    echo -e "${RED}❌ Failed to start health server${NC}"
fi

echo ""
echo -e "${CYAN}🎯 Sub-Agent is ready for specialized development tasks!${NC}"
echo -e "${CYAN}💡 Type 'help' for available commands or 'exit' to quit${NC}"
echo ""

# Interactive shell simulation
while true; do
    echo -n -e "${PURPLE}claude-${SUB_AGENT_ID}${NC}:${BLUE}${WORKSPACE##*/}${NC}$ "
    read -r command
    
    case $command in
        "help"|"h")
            echo ""
            echo -e "${YELLOW}Available Commands:${NC}"
            echo "  help, h          - Show this help message"
            echo "  status           - Show agent and workspace status"
            echo "  capabilities     - Show agent capabilities"
            echo "  workspace        - Show workspace information"
            echo "  health           - Check health status"
            echo "  specialization   - Show role-specific guidance"
            echo "  exit, quit       - Exit the agent session"
            echo ""
            ;;
        "status")
            curl -s http://localhost:3000/agent/status | jq '.' 2>/dev/null || echo "Status endpoint not available"
            echo ""
            ;;
        "capabilities")
            curl -s http://localhost:3000/agent/capabilities | jq '.' 2>/dev/null || echo "Capabilities endpoint not available"
            echo ""
            ;;
        "workspace")
            curl -s http://localhost:3000/workspace/info | jq '.' 2>/dev/null || echo "Workspace endpoint not available"
            echo ""
            ;;
        "health")
            curl -s http://localhost:3000/health | jq '.' 2>/dev/null || echo "Health endpoint not available"
            echo ""
            ;;
        "specialization")
            echo ""
            echo -e "${YELLOW}🎯 Role-Specific Guidance for ${AGENT_ROLE}:${NC}"
            case $AGENT_ROLE in
                "senior-developer")
                    echo "• Focus on architecture decisions and code quality"
                    echo "• Review and mentor other agents' work"
                    echo "• Optimize performance and implement complex business logic"
                    echo "• Ensure adherence to SOLID principles and design patterns"
                    ;;
                "ui-developer")
                    echo "• Implement responsive React components with Tailwind CSS"
                    echo "• Follow component-driven development practices"
                    echo "• Ensure cross-browser compatibility and accessibility"
                    echo "• Create reusable component libraries"
                    ;;
                "ux-expert")
                    echo "• Prioritize user experience and accessibility"
                    echo "• Follow WCAG guidelines for inclusive design"
                    echo "• Optimize user journeys and interaction patterns"
                    echo "• Conduct usability reviews and improvements"
                    ;;
                "test-expert")
                    echo "• Implement comprehensive test coverage"
                    echo "• Write unit, integration, and E2E tests"
                    echo "• Set up test automation and CI/CD integration"
                    echo "• Ensure quality gates and metrics tracking"
                    ;;
                "architecture-expert")
                    echo "• Design scalable system architectures"
                    echo "• Optimize database schemas and queries"
                    echo "• Implement event-driven patterns"
                    echo "• Plan for performance and scalability"
                    ;;
                "devops-expert")
                    echo "• Automate CI/CD pipelines and deployments"
                    echo "• Manage containerization and orchestration"
                    echo "• Implement monitoring and logging solutions"
                    echo "• Optimize infrastructure and resource usage"
                    ;;
            esac
            echo ""
            ;;
        "exit"|"quit")
            echo -e "${GREEN}👋 Claude Sub-Agent ${SUB_AGENT_ID} session ended${NC}"
            break
            ;;
        "")
            # Empty command, just continue
            ;;
        *)
            echo -e "${YELLOW}Unknown command: $command${NC}"
            echo -e "${CYAN}Type 'help' for available commands${NC}"
            echo ""
            ;;
    esac
done

# Cleanup
kill $HEALTH_PID 2>/dev/null || true
echo -e "${BLUE}🛑 Health server stopped${NC}"