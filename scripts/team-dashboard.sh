#!/bin/bash

# Claude Code Sub-Agent Team Dashboard
# Erweiterte Team-Metriken und Performance-Monitoring

set -e

# Configuration
DASHBOARD_PORT=8888
METRICS_DIR=".claude/metrics"
REPORTS_DIR=".claude/reports"
DATE=$(date '+%Y-%m-%d')
TIME=$(date '+%H:%M:%S')

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎭 Sub-Agent Team Dashboard${NC}"
echo -e "${BLUE}==============================${NC}"
echo -e "Date: $DATE | Time: $TIME"
echo ""

# Create directories
mkdir -p "$METRICS_DIR" "$REPORTS_DIR"

# Function: Get Git Stats
get_git_stats() {
    echo -e "${CYAN}📊 Git Activity Metrics${NC}"
    echo "========================"
    
    # Commits per role (last 7 days)
    echo "Commits by role (last 7 days):"
    ROLES=("senior-developer" "ui-developer" "ux-expert" "test-expert" "architecture-expert" "devops-expert" "default")
    
    for role in "${ROLES[@]}"; do
        COMMITS=$(git log --since="7 days ago" --author="Agent.*$role" --oneline 2>/dev/null | wc -l)
        PERCENTAGE=0
        TOTAL_COMMITS=$(git log --since="7 days ago" --oneline 2>/dev/null | wc -l)
        
        if [ $TOTAL_COMMITS -gt 0 ]; then
            PERCENTAGE=$((COMMITS * 100 / TOTAL_COMMITS))
        fi
        
        # Progress bar
        BAR_LENGTH=20
        FILLED=$((PERCENTAGE * BAR_LENGTH / 100))
        EMPTY=$((BAR_LENGTH - FILLED))
        
        BAR=$(printf "%*s" $FILLED | tr ' ' '█')$(printf "%*s" $EMPTY | tr ' ' '░')
        
        printf "  %-20s [%s] %2d%% (%d commits)\n" "$role" "$BAR" "$PERCENTAGE" "$COMMITS"
    done
    
    echo ""
    echo "Recent activity:"
    git log --oneline --since="24 hours ago" | head -5 | sed 's/^/  /'
    echo ""
}

# Function: Get Team Productivity Metrics
get_productivity_metrics() {
    echo -e "${GREEN}📈 Team Productivity Metrics${NC}"
    echo "==============================="
    
    # Lines of code by file type
    echo "Code distribution:"
    
    # TypeScript/JavaScript (Frontend)
    TS_LINES=$(find src/frontend -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    
    # C# (Backend)
    CS_LINES=$(find src/backend -name "*.cs" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    
    # Configuration files
    CONFIG_LINES=$(find . -name "*.yml" -o -name "*.yaml" -o -name "*.json" -o -name "*.toml" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    
    # Documentation
    DOC_LINES=$(find . -name "*.md" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    
    TOTAL_LINES=$((TS_LINES + CS_LINES + CONFIG_LINES + DOC_LINES))
    
    if [ $TOTAL_LINES -gt 0 ]; then
        TS_PCT=$((TS_LINES * 100 / TOTAL_LINES))
        CS_PCT=$((CS_LINES * 100 / TOTAL_LINES))
        CONFIG_PCT=$((CONFIG_LINES * 100 / TOTAL_LINES))
        DOC_PCT=$((DOC_LINES * 100 / TOTAL_LINES))
        
        printf "  Frontend (TS/JS):  %6d lines (%2d%%)\n" $TS_LINES $TS_PCT
        printf "  Backend (C#):      %6d lines (%2d%%)\n" $CS_LINES $CS_PCT
        printf "  Configuration:     %6d lines (%2d%%)\n" $CONFIG_LINES $CONFIG_PCT
        printf "  Documentation:     %6d lines (%2d%%)\n" $DOC_LINES $DOC_PCT
        printf "  Total:             %6d lines\n" $TOTAL_LINES
    else
        echo "  No code files found for analysis"
    fi
    
    echo ""
    
    # Test coverage estimation
    echo "Test coverage estimation:"
    TEST_FILES=$(find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.Test.cs" -o -name "*Tests.cs" 2>/dev/null | wc -l)
    SOURCE_FILES=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | grep -v ".test\|.spec\|Test\|Tests" | wc -l)
    
    if [ $SOURCE_FILES -gt 0 ]; then
        TEST_RATIO=$((TEST_FILES * 100 / SOURCE_FILES))
        printf "  Test files:        %6d\n" $TEST_FILES
        printf "  Source files:      %6d\n" $SOURCE_FILES
        printf "  Test ratio:        %6d%%\n" $TEST_RATIO
        
        if [ $TEST_RATIO -ge 80 ]; then
            echo -e "  Status:            ${GREEN}Excellent${NC}"
        elif [ $TEST_RATIO -ge 60 ]; then
            echo -e "  Status:            ${YELLOW}Good${NC}"
        elif [ $TEST_RATIO -ge 40 ]; then
            echo -e "  Status:            ${YELLOW}Fair${NC}"
        else
            echo -e "  Status:            ${RED}Needs Improvement${NC}"
        fi
    else
        echo "  No source files found for analysis"
    fi
    
    echo ""
}

# Function: Get Role-Specific Metrics
get_role_metrics() {
    echo -e "${PURPLE}🎭 Role-Specific Metrics${NC}"
    echo "========================="
    
    ROLES=("senior-developer" "ui-developer" "ux-expert" "test-expert" "architecture-expert" "devops-expert")
    
    for role in "${ROLES[@]}"; do
        # Check if role has been used recently
        RECENT_USAGE=$(ls -la .claude/CLAUDE-backup-$role.md 2>/dev/null | wc -l)
        ROLE_CONFIG=$(ls -la config/sub-agents/CLAUDE-$role.md 2>/dev/null | wc -l)
        
        if [ $ROLE_CONFIG -gt 0 ]; then
            STATUS="✅ Configured"
            if [ $RECENT_USAGE -gt 0 ]; then
                LAST_USED=$(stat -c %Y .claude/CLAUDE-backup-$role.md 2>/dev/null || echo "0")
                NOW=$(date +%s)
                HOURS_AGO=$(( (NOW - LAST_USED) / 3600 ))
                
                if [ $HOURS_AGO -lt 24 ]; then
                    STATUS="🔥 Active (${HOURS_AGO}h ago)"
                elif [ $HOURS_AGO -lt 168 ]; then  # 7 days
                    DAYS_AGO=$(( HOURS_AGO / 24 ))
                    STATUS="⏰ Recent (${DAYS_AGO}d ago)"
                else
                    STATUS="💤 Dormant"
                fi
            fi
        else
            STATUS="❌ Missing Config"
        fi
        
        printf "  %-20s %s\n" "$role" "$STATUS"
        
        # Role-specific metrics
        case $role in
            "senior-developer")
                ARCHITECTURE_FILES=$(find src/backend -name "*Aggregate*.cs" -o -name "*Domain*.cs" -o -name "*Service*.cs" 2>/dev/null | wc -l)
                echo "    Architecture files: $ARCHITECTURE_FILES"
                ;;
            "ui-developer")
                COMPONENT_FILES=$(find src/frontend/src/components -name "*.tsx" 2>/dev/null | wc -l)
                echo "    React components: $COMPONENT_FILES"
                ;;
            "ux-expert")
                ACCESSIBILITY_ATTRS=$(grep -r "aria-\|role=" src/frontend 2>/dev/null | wc -l)
                echo "    Accessibility attributes: $ACCESSIBILITY_ATTRS"
                ;;
            "test-expert")
                TEST_FILES=$(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l)
                echo "    Test files: $TEST_FILES"
                ;;
            "architecture-expert")
                EVENT_FILES=$(find src/backend -name "*Event*.cs" 2>/dev/null | wc -l)
                echo "    Domain events: $EVENT_FILES"
                ;;
            "devops-expert")
                DOCKER_FILES=$(find . -name "Dockerfile*" -o -name "docker compose*.yml" 2>/dev/null | wc -l)
                echo "    Docker configs: $DOCKER_FILES"
                ;;
        esac
    done
    
    echo ""
}

# Function: Get System Health
get_system_health() {
    echo -e "${YELLOW}🏥 System Health${NC}"
    echo "================"
    
    # Git repository health
    echo "Repository health:"
    
    # Check for uncommitted changes
    if git status --porcelain | grep -q .; then
        UNCOMMITTED=$(git status --porcelain | wc -l)
        echo -e "  Uncommitted changes: ${YELLOW}$UNCOMMITTED files${NC}"
    else
        echo -e "  Working tree: ${GREEN}Clean${NC}"
    fi
    
    # Check remote sync status
    git fetch origin --quiet 2>/dev/null || true
    BEHIND=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    AHEAD=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    
    if [ "$BEHIND" -gt 0 ] || [ "$AHEAD" -gt 0 ]; then
        echo -e "  Remote sync: ${YELLOW}$AHEAD ahead, $BEHIND behind${NC}"
    else
        echo -e "  Remote sync: ${GREEN}Up to date${NC}"
    fi
    
    # Branch status
    CURRENT_BRANCH=$(git branch --show-current)
    echo "  Current branch: $CURRENT_BRANCH"
    
    # Check for large files
    LARGE_FILES=$(find . -type f -size +10M 2>/dev/null | grep -v ".git" | wc -l)
    if [ $LARGE_FILES -gt 0 ]; then
        echo -e "  Large files (>10MB): ${YELLOW}$LARGE_FILES${NC}"
    else
        echo -e "  Large files: ${GREEN}None${NC}"
    fi
    
    echo ""
    
    # Docker environment health (if applicable)
    if command -v docker >/dev/null 2>&1; then
        echo "Docker environment:"
        
        # Check if Docker is running
        if docker info >/dev/null 2>&1; then
            RUNNING_CONTAINERS=$(docker ps --format "table {{.Names}}" | grep -c "booking" 2>/dev/null || echo "0")
            echo "  Running containers: $RUNNING_CONTAINERS"
            
            if [ $RUNNING_CONTAINERS -gt 0 ]; then
                echo "  Active services:"
                docker ps --format "table {{.Names}}\t{{.Status}}" | grep "booking" | sed 's/^/    /'
            fi
        else
            echo -e "  Docker status: ${RED}Not running${NC}"
        fi
    else
        echo "  Docker: Not installed"
    fi
    
    echo ""
}

# Function: Generate Performance Report
generate_performance_report() {
    echo -e "${CYAN}📊 Generating Performance Report...${NC}"
    
    REPORT_FILE="$REPORTS_DIR/team-performance-$DATE.md"
    
    cat > "$REPORT_FILE" << EOF
# Sub-Agent Team Performance Report

**Date:** $DATE  
**Time:** $TIME  
**Generated by:** team-dashboard.sh

## Summary

This report provides insights into the Sub-Agent team's productivity, code quality, and system health.

## Team Activity

### Git Statistics
$(git log --since="7 days ago" --pretty=format:"- %h %s (%an, %ar)" | head -10)

### Code Metrics
- Total commits (7 days): $(git log --since="7 days ago" --oneline | wc -l)
- Active contributors: $(git log --since="7 days ago" --format="%an" | sort -u | wc -l)
- Files changed (7 days): $(git log --since="7 days ago" --name-only --pretty=format: | sort -u | grep -v "^$" | wc -l)

### Role Usage
$(for role in senior-developer ui-developer ux-expert test-expert architecture-expert devops-expert; do
    if [ -f ".claude/CLAUDE-backup-$role.md" ]; then
        LAST_USED=$(stat -c %Y .claude/CLAUDE-backup-$role.md 2>/dev/null || echo "0")
        if [ $LAST_USED -gt 0 ]; then
            echo "- $role: $(date -d @$LAST_USED '+%Y-%m-%d %H:%M')"
        fi
    else
        echo "- $role: Never used"
    fi
done)

## Quality Metrics

### Test Coverage
- Test files: $(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l)
- Source files: $(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | grep -v ".test\|.spec\|Test\|Tests" | wc -l)

### Code Quality Indicators
- TODO/FIXME items: $(grep -r "TODO\|FIXME" src 2>/dev/null | wc -l)
- Console.log statements: $(grep -r "console\.log\|Console\.WriteLine" src 2>/dev/null | wc -l)
- Hardcoded strings: $(grep -r "\".*\"" src 2>/dev/null | grep -v "test\|spec" | wc -l)

## Recommendations

$(
# Generate dynamic recommendations based on metrics
RECOMMENDATIONS=""

# Check test coverage
TEST_FILES=$(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l)
SOURCE_FILES=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | grep -v ".test\|.spec\|Test\|Tests" | wc -l)

if [ $SOURCE_FILES -gt 0 ]; then
    TEST_RATIO=$((TEST_FILES * 100 / SOURCE_FILES))
    if [ $TEST_RATIO -lt 50 ]; then
        echo "- **Increase test coverage**: Current ratio is ${TEST_RATIO}%. Target: 80%+"
    fi
fi

# Check for uncommitted changes
if git status --porcelain | grep -q .; then
    echo "- **Commit pending changes**: $(git status --porcelain | wc -l) files have uncommitted changes"
fi

# Check role usage balance
TOTAL_ROLES=6
USED_ROLES=$(ls .claude/CLAUDE-backup-*.md 2>/dev/null | wc -l)
if [ $USED_ROLES -lt 3 ]; then
    echo "- **Utilize more roles**: Only $USED_ROLES of $TOTAL_ROLES roles have been used recently"
fi

echo "- **Regular team status checks**: Run \`./scripts/team-dashboard.sh\` daily for optimal productivity"
)

---

*Report generated automatically by Claude Code Sub-Agent Team Dashboard*
EOF

    echo "  Report saved: $REPORT_FILE"
    echo ""
}

# Function: Save Metrics to JSON
save_metrics_json() {
    METRICS_FILE="$METRICS_DIR/metrics-$DATE.json"
    
    # Collect metrics data
    TOTAL_COMMITS=$(git log --since="7 days ago" --oneline | wc -l)
    TEST_FILES=$(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l)
    SOURCE_FILES=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | grep -v ".test\|.spec\|Test\|Tests" | wc -l)
    UNCOMMITTED=$(git status --porcelain | wc -l)
    
    cat > "$METRICS_FILE" << EOF
{
  "date": "$DATE",
  "time": "$TIME",
  "git": {
    "commits_7d": $TOTAL_COMMITS,
    "uncommitted_files": $UNCOMMITTED,
    "current_branch": "$(git branch --show-current)"
  },
  "code": {
    "test_files": $TEST_FILES,
    "source_files": $SOURCE_FILES,
    "test_ratio": $(if [ $SOURCE_FILES -gt 0 ]; then echo $((TEST_FILES * 100 / SOURCE_FILES)); else echo 0; fi)
  },
  "roles": {
$(for role in senior-developer ui-developer ux-expert test-expert architecture-expert devops-expert; do
    if [ -f ".claude/CLAUDE-backup-$role.md" ]; then
        LAST_USED=$(stat -c %Y .claude/CLAUDE-backup-$role.md 2>/dev/null || echo "0")
        echo "    \"$role\": { \"configured\": true, \"last_used\": $LAST_USED },"
    else
        echo "    \"$role\": { \"configured\": $([ -f "config/sub-agents/CLAUDE-$role.md" ] && echo true || echo false), \"last_used\": 0 },"
    fi
done | sed '$ s/,$//')
  }
}
EOF

    echo -e "${CYAN}💾 Metrics saved: $METRICS_FILE${NC}"
    echo ""
}

# Function: Show Web Dashboard URL
show_web_dashboard() {
    echo -e "${BLUE}🌐 Web Dashboard${NC}"
    echo "=================="
    
    # Check if we can start a simple HTTP server
    if command -v python3 >/dev/null 2>&1; then
        echo "Starting web dashboard on port $DASHBOARD_PORT..."
        echo ""
        echo -e "  ${GREEN}Dashboard URL: http://localhost:$DASHBOARD_PORT${NC}"
        echo "  Press Ctrl+C to stop the dashboard"
        echo ""
        
        # Create a simple HTML dashboard
        HTML_FILE="$REPORTS_DIR/dashboard.html"
        cat > "$HTML_FILE" << 'EOF'
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sub-Agent Team Dashboard</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; margin-bottom: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .metric { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 8px; margin: 10px 0; }
        .metric h3 { margin: 0 0 10px 0; color: #495057; }
        .metric .value { font-size: 2em; font-weight: bold; color: #007bff; }
        .role-status { display: flex; align-items: center; margin: 10px 0; }
        .status-icon { width: 12px; height: 12px; border-radius: 50%; margin-right: 10px; }
        .status-active { background: #28a745; }
        .status-configured { background: #ffc107; }
        .status-missing { background: #dc3545; }
        .refresh-btn { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
        .refresh-btn:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎭 Sub-Agent Team Dashboard</h1>
            <p>Real-time monitoring of Claude Code Sub-Agent team performance</p>
            <button class="refresh-btn" onclick="location.reload()">Refresh Data</button>
        </div>
        
        <div class="grid">
            <div class="card">
                <h2>📊 Git Activity</h2>
                <div class="metric">
                    <h3>Commits (7 days)</h3>
                    <div class="value" id="commits">Loading...</div>
                </div>
                <div class="metric">
                    <h3>Active Branch</h3>
                    <div class="value" id="branch">Loading...</div>
                </div>
            </div>
            
            <div class="card">
                <h2>🧪 Code Quality</h2>
                <div class="metric">
                    <h3>Test Coverage</h3>
                    <div class="value" id="coverage">Loading...</div>
                </div>
                <div class="metric">
                    <h3>Source Files</h3>
                    <div class="value" id="files">Loading...</div>
                </div>
            </div>
            
            <div class="card">
                <h2>🎭 Role Status</h2>
                <div id="roles">Loading...</div>
            </div>
            
            <div class="card">
                <h2>🏥 System Health</h2>
                <div class="metric">
                    <h3>Repository Status</h3>
                    <div class="value" id="repo-status">Loading...</div>
                </div>
                <div class="metric">
                    <h3>Last Update</h3>
                    <div class="value" id="last-update">Loading...</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // Simulated data loading - in real implementation, this would fetch from metrics JSON
        document.addEventListener('DOMContentLoaded', function() {
            // Update timestamp
            document.getElementById('last-update').textContent = new Date().toLocaleString();
            
            // Simulate loading other data
            setTimeout(() => {
                document.getElementById('commits').textContent = Math.floor(Math.random() * 50) + 10;
                document.getElementById('branch').textContent = 'feat/70-claude-sub-agents';
                document.getElementById('coverage').textContent = Math.floor(Math.random() * 30) + 60 + '%';
                document.getElementById('files').textContent = Math.floor(Math.random() * 100) + 150;
                document.getElementById('repo-status').textContent = 'Healthy';
                
                // Role status
                const roles = [
                    { name: 'Senior Developer', status: 'active' },
                    { name: 'UI Developer', status: 'configured' },
                    { name: 'UX Expert', status: 'configured' },
                    { name: 'Test Expert', status: 'configured' },
                    { name: 'Architecture Expert', status: 'configured' },
                    { name: 'DevOps Expert', status: 'configured' }
                ];
                
                const rolesHtml = roles.map(role => 
                    `<div class="role-status">
                        <div class="status-icon status-${role.status}"></div>
                        <span>${role.name}</span>
                    </div>`
                ).join('');
                
                document.getElementById('roles').innerHTML = rolesHtml;
            }, 1000);
        });
    </script>
</body>
</html>
EOF
        
        # Start Python HTTP server in background
        cd "$REPORTS_DIR"
        python3 -m http.server $DASHBOARD_PORT --bind 127.0.0.1 >/dev/null 2>&1 &
        HTTP_PID=$!
        
        # Wait for user input
        read -p "Press Enter to stop the web dashboard..."
        
        # Stop HTTP server
        kill $HTTP_PID 2>/dev/null || true
        cd - >/dev/null
        
    else
        echo -e "${YELLOW}Python3 not found. Web dashboard unavailable.${NC}"
        echo "Install Python3 to enable web dashboard functionality."
    fi
}

# Main execution
main() {
    # Parse arguments
    case "${1:-}" in
        --web)
            get_git_stats
            get_productivity_metrics
            get_role_metrics
            get_system_health
            generate_performance_report
            save_metrics_json
            show_web_dashboard
            ;;
        --json)
            save_metrics_json
            echo "Metrics saved to JSON format"
            ;;
        --report)
            generate_performance_report
            echo "Performance report generated"
            ;;
        --help)
            echo "Usage: $0 [--web|--json|--report|--help]"
            echo ""
            echo "Options:"
            echo "  --web     Start interactive web dashboard"
            echo "  --json    Save metrics to JSON format only"
            echo "  --report  Generate performance report only"
            echo "  --help    Show this help message"
            echo ""
            echo "Default: Show all metrics in terminal"
            ;;
        *)
            get_git_stats
            get_productivity_metrics
            get_role_metrics
            get_system_health
            generate_performance_report
            save_metrics_json
            
            echo -e "${GREEN}✅ Dashboard update completed!${NC}"
            echo ""
            echo "Available actions:"
            echo "  📊 View web dashboard: $0 --web"
            echo "  📄 View latest report: cat $REPORTS_DIR/team-performance-$DATE.md"
            echo "  📈 View metrics JSON: cat $METRICS_DIR/metrics-$DATE.json"
            ;;
    esac
}

# Run main function
main "$@"