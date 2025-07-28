#!/bin/bash

# Team Metrics Collector - Automated data collection for Sub-Agent team
# Collects and aggregates metrics for long-term trend analysis

set -e

# Configuration
METRICS_BASE_DIR=".claude/metrics"
TRENDS_DIR=".claude/trends"
ARCHIVE_DIR=".claude/archive"
DATE=$(date '+%Y-%m-%d')
TIMESTAMP=$(date '+%Y-%m-%d_%H-%M-%S')

# Create directories
mkdir -p "$METRICS_BASE_DIR" "$TRENDS_DIR" "$ARCHIVE_DIR"

echo "📊 Team Metrics Collector"
echo "========================="
echo "Date: $DATE"
echo ""

# Function: Collect Git Metrics
collect_git_metrics() {
    echo "📈 Collecting Git metrics..."
    
    local output_file="$METRICS_BASE_DIR/git-metrics-$DATE.json"
    
    # Collect various Git statistics
    local total_commits=$(git rev-list --count HEAD 2>/dev/null || echo "0")
    local commits_today=$(git log --since="midnight" --oneline | wc -l)
    local commits_week=$(git log --since="7 days ago" --oneline | wc -l)
    local commits_month=$(git log --since="30 days ago" --oneline | wc -l)
    
    # Author statistics
    local unique_authors=$(git log --since="30 days ago" --format="%an" | sort -u | wc -l)
    local most_active_author=$(git log --since="7 days ago" --format="%an" | sort | uniq -c | sort -nr | head -1 | awk '{print $2" "$3}')
    
    # File change statistics
    local files_changed_week=$(git log --since="7 days ago" --name-only --pretty=format: | sort -u | grep -v "^$" | wc -l)
    local insertions_week=$(git log --since="7 days ago" --shortstat | grep "insertion" | awk '{sum+=$4} END {print sum+0}')
    local deletions_week=$(git log --since="7 days ago" --shortstat | grep "deletion" | awk '{sum+=$6} END {print sum+0}')
    
    # Branch information
    local current_branch=$(git branch --show-current)
    local total_branches=$(git branch -a | wc -l)
    local remote_ahead=$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0")
    local remote_behind=$(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0")
    
    cat > "$output_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "commits": {
    "total": $total_commits,
    "today": $commits_today,
    "week": $commits_week,
    "month": $commits_month
  },
  "authors": {
    "unique_month": $unique_authors,
    "most_active_week": "$most_active_author"
  },
  "changes": {
    "files_changed_week": $files_changed_week,
    "insertions_week": $insertions_week,
    "deletions_week": $deletions_week
  },
  "branches": {
    "current": "$current_branch",
    "total": $total_branches,
    "remote_ahead": $remote_ahead,
    "remote_behind": $remote_behind
  }
}
EOF
    
    echo "  ✅ Git metrics saved: $output_file"
}

# Function: Collect Code Quality Metrics
collect_code_metrics() {
    echo "🔍 Collecting code quality metrics..."
    
    local output_file="$METRICS_BASE_DIR/code-metrics-$DATE.json"
    
    # File count by type
    local ts_files=$(find src/frontend -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
    local js_files=$(find src/frontend -name "*.js" -o -name "*.jsx" 2>/dev/null | wc -l)
    local cs_files=$(find src/backend -name "*.cs" 2>/dev/null | wc -l)
    local test_files=$(find . -name "*.test.*" -o -name "*Test.cs" -o -name "*Tests.cs" 2>/dev/null | wc -l)
    
    # Line counts
    local ts_lines=$(find src/frontend -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    local cs_lines=$(find src/backend -name "*.cs" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    local test_lines=$(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")
    
    # Code quality indicators
    local todo_count=$(grep -r "TODO\|FIXME\|HACK" src 2>/dev/null | wc -l)
    local console_logs=$(grep -r "console\.log\|Console\.WriteLine" src 2>/dev/null | wc -l)
    local commented_code=$(grep -r "//.*\(function\|class\|interface\)" src 2>/dev/null | wc -l)
    
    # Component analysis (Frontend)
    local react_components=$(find src/frontend -name "*.tsx" 2>/dev/null | xargs grep -l "export.*function\|export.*const.*=" 2>/dev/null | wc -l)
    local custom_hooks=$(find src/frontend -name "*.ts" -o -name "*.tsx" 2>/dev/null | xargs grep -l "use[A-Z]" 2>/dev/null | wc -l)
    
    # Architecture analysis (Backend)
    local controllers=$(find src/backend -name "*Controller.cs" 2>/dev/null | wc -l)
    local services=$(find src/backend -name "*Service.cs" 2>/dev/null | wc -l)
    local repositories=$(find src/backend -name "*Repository.cs" 2>/dev/null | wc -l)
    local entities=$(find src/backend -name "*Entity.cs" -o -name "*Aggregate.cs" 2>/dev/null | wc -l)
    
    cat > "$output_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "files": {
    "typescript": $ts_files,
    "javascript": $js_files,
    "csharp": $cs_files,
    "tests": $test_files
  },
  "lines": {
    "typescript": $ts_lines,
    "csharp": $cs_lines,
    "tests": $test_lines,
    "total": $((ts_lines + cs_lines))
  },
  "quality": {
    "todo_items": $todo_count,
    "console_logs": $console_logs,
    "commented_code": $commented_code
  },
  "frontend": {
    "react_components": $react_components,
    "custom_hooks": $custom_hooks
  },
  "backend": {
    "controllers": $controllers,
    "services": $services,
    "repositories": $repositories,
    "entities": $entities
  },
  "test_coverage": {
    "ratio": $(if [ $((ts_files + cs_files)) -gt 0 ]; then echo "scale=2; $test_files * 100 / ($ts_files + $cs_files)" | bc; else echo "0"; fi)
  }
}
EOF
    
    echo "  ✅ Code metrics saved: $output_file"
}

# Function: Collect Role Usage Metrics
collect_role_metrics() {
    echo "🎭 Collecting role usage metrics..."
    
    local output_file="$METRICS_BASE_DIR/role-metrics-$DATE.json"
    
    # Get role usage data
    local roles=("senior-developer" "ui-developer" "ux-expert" "test-expert" "architecture-expert" "devops-expert")
    local role_data=""
    
    for role in "${roles[@]}"; do
        local configured="false"
        local last_used="0"
        local usage_count="0"
        
        # Check if role is configured
        if [ -f "config/sub-agents/CLAUDE-$role.md" ]; then
            configured="true"
        fi
        
        # Check last usage
        if [ -f ".claude/CLAUDE-backup-$role.md" ]; then
            last_used=$(stat -c %Y ".claude/CLAUDE-backup-$role.md" 2>/dev/null || echo "0")
        fi
        
        # Count role mentions in commits (approximate usage)
        usage_count=$(git log --since="30 days ago" --grep="$role" --oneline | wc -l)
        
        # Calculate days since last use
        local days_since_use="999"
        if [ "$last_used" -gt 0 ]; then
            local now=$(date +%s)
            days_since_use=$(( (now - last_used) / 86400 ))
        fi
        
        role_data+="{\"name\":\"$role\",\"configured\":$configured,\"last_used\":$last_used,\"days_since_use\":$days_since_use,\"usage_count\":$usage_count},"
    done
    
    # Remove trailing comma
    role_data=${role_data%,}
    
    cat > "$output_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "roles": [$role_data],
  "summary": {
    "total_roles": ${#roles[@]},
    "configured_roles": $(ls config/sub-agents/CLAUDE-*.md 2>/dev/null | wc -l),
    "recently_used": $(find .claude -name "CLAUDE-backup-*.md" -mtime -7 2>/dev/null | wc -l),
    "current_role": "$(cat .claude/current-role.txt 2>/dev/null || echo 'default')"
  }
}
EOF
    
    echo "  ✅ Role metrics saved: $output_file"
}

# Function: Collect System Metrics
collect_system_metrics() {
    echo "🖥️ Collecting system metrics..."
    
    local output_file="$METRICS_BASE_DIR/system-metrics-$DATE.json"
    
    # Disk usage
    local disk_usage=$(df -h . | awk 'NR==2{print $5}' | sed 's/%//')
    local disk_free=$(df -h . | awk 'NR==2{print $4}')
    
    # Repository size
    local repo_size=$(du -sh . 2>/dev/null | awk '{print $1}')
    local git_size=$(du -sh .git 2>/dev/null | awk '{print $1}')
    
    # File counts
    local total_files=$(find . -type f | grep -v ".git" | wc -l)
    local large_files=$(find . -type f -size +1M | grep -v ".git" | wc -l)
    
    # Docker status (if available)
    local docker_status="unavailable"
    local running_containers="0"
    
    if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
        docker_status="running"
        running_containers=$(docker ps --format "table {{.Names}}" | grep -c "booking" 2>/dev/null || echo "0")
    fi
    
    # Process information (basic)
    local cpu_count=$(nproc 2>/dev/null || echo "1")
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//' 2>/dev/null || echo "0")
    
    cat > "$output_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "disk": {
    "usage_percent": $disk_usage,
    "free_space": "$disk_free",
    "repo_size": "$repo_size",
    "git_size": "$git_size"
  },
  "files": {
    "total": $total_files,
    "large_files": $large_files
  },
  "docker": {
    "status": "$docker_status",
    "running_containers": $running_containers
  },
  "system": {
    "cpu_count": $cpu_count,
    "load_average": "$load_avg"
  }
}
EOF
    
    echo "  ✅ System metrics saved: $output_file"
}

# Function: Generate Trend Analysis
generate_trend_analysis() {
    echo "📈 Generating trend analysis..."
    
    local trend_file="$TRENDS_DIR/trends-$DATE.json"
    
    # Collect historical data (last 7 days)
    local historical_commits=()
    local historical_files=()
    local historical_roles=()
    
    for i in {0..6}; do
        local check_date=$(date -d "$i days ago" '+%Y-%m-%d')
        local git_file="$METRICS_BASE_DIR/git-metrics-$check_date.json"
        local code_file="$METRICS_BASE_DIR/code-metrics-$check_date.json"
        local role_file="$METRICS_BASE_DIR/role-metrics-$check_date.json"
        
        if [ -f "$git_file" ]; then
            local commits=$(jq -r '.commits.total' "$git_file" 2>/dev/null || echo "0")
            historical_commits+=("$commits")
        else
            historical_commits+=("0")
        fi
        
        if [ -f "$code_file" ]; then
            local files=$(jq -r '.files.typescript + .files.csharp' "$code_file" 2>/dev/null || echo "0")
            historical_files+=("$files")
        else
            historical_files+=("0")
        fi
        
        if [ -f "$role_file" ]; then
            local active_roles=$(jq -r '.summary.recently_used' "$role_file" 2>/dev/null || echo "0")
            historical_roles+=("$active_roles")
        else
            historical_roles+=("0")
        fi
    done
    
    # Calculate trends (simple growth rate)
    local commit_trend="stable"
    local file_trend="stable"
    local role_trend="stable"
    
    if [ ${#historical_commits[@]} -ge 2 ]; then
        local first_commit=${historical_commits[-1]}
        local last_commit=${historical_commits[0]}
        
        if [ "$last_commit" -gt "$first_commit" ]; then
            commit_trend="growing"
        elif [ "$last_commit" -lt "$first_commit" ]; then
            commit_trend="declining"
        fi
    fi
    
    cat > "$trend_file" << EOF
{
  "timestamp": "$TIMESTAMP",
  "period": "7_days",
  "trends": {
    "commits": {
      "direction": "$commit_trend",
      "data": [$(IFS=,; echo "${historical_commits[*]}")]
    },
    "files": {
      "direction": "$file_trend", 
      "data": [$(IFS=,; echo "${historical_files[*]}")]
    },
    "roles": {
      "direction": "$role_trend",
      "data": [$(IFS=,; echo "${historical_roles[*]}")]
    }
  },
  "insights": {
    "most_productive_day": "$(git log --since='7 days ago' --format='%ad' --date=short | sort | uniq -c | sort -nr | head -1 | awk '{print $2}')",
    "avg_commits_per_day": "$(echo "scale=1; $(git log --since='7 days ago' --oneline | wc -l) / 7" | bc 2>/dev/null || echo "0")",
    "code_velocity": "$(echo "scale=1; (${historical_files[0]} - ${historical_files[-1]}) / 7" | bc 2>/dev/null || echo "0")"
  }
}
EOF
    
    echo "  ✅ Trend analysis saved: $trend_file"
}

# Function: Create Summary Report
create_summary_report() {
    echo "📋 Creating summary report..."
    
    local summary_file="$METRICS_BASE_DIR/daily-summary-$DATE.md"
    
    cat > "$summary_file" << EOF
# Daily Team Metrics Summary

**Date:** $DATE  
**Generated:** $TIMESTAMP

## Overview

This is an automated summary of the Sub-Agent team's daily metrics.

## Key Metrics

### Git Activity
- Total commits: $(git rev-list --count HEAD 2>/dev/null || echo "0")
- Commits today: $(git log --since="midnight" --oneline | wc -l)
- Commits this week: $(git log --since="7 days ago" --oneline | wc -l)
- Active branch: $(git branch --show-current)

### Code Base
- TypeScript files: $(find src/frontend -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l)
- C# files: $(find src/backend -name "*.cs" 2>/dev/null | wc -l)
- Test files: $(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l)
- Total LOC: $(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}' || echo "0")

### Role Usage
$(for role in senior-developer ui-developer ux-expert test-expert architecture-expert devops-expert; do
    if [ -f ".claude/CLAUDE-backup-$role.md" ]; then
        local last_used=$(stat -c %Y ".claude/CLAUDE-backup-$role.md" 2>/dev/null || echo "0")
        local hours_ago=$(( ($(date +%s) - last_used) / 3600 ))
        echo "- $role: Used ${hours_ago}h ago"
    else
        echo "- $role: Not used recently"
    fi
done)

### Quality Indicators
- TODO/FIXME items: $(grep -r "TODO\|FIXME" src 2>/dev/null | wc -l)
- Console logs: $(grep -r "console\.log\|Console\.WriteLine" src 2>/dev/null | wc -l)
- Test coverage ratio: $(if [ $(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | wc -l) -gt 0 ]; then echo "scale=1; $(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l) * 100 / $(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | wc -l)" | bc; else echo "0"; fi)%

## Repository Health
- Working tree: $(if git status --porcelain | grep -q .; then echo "Uncommitted changes ($(git status --porcelain | wc -l) files)"; else echo "Clean"; fi)
- Remote sync: $(git fetch origin --quiet 2>/dev/null || true; echo "$(git rev-list --count @{u}..HEAD 2>/dev/null || echo "0") ahead, $(git rev-list --count HEAD..@{u} 2>/dev/null || echo "0") behind")
- Disk usage: $(du -sh . 2>/dev/null | awk '{print $1}')

## Recommendations

$(
# Generate recommendations
RECOMMENDATIONS=""

# Check test coverage
TEST_FILES=$(find . -name "*.test.*" -o -name "*Test*.cs" 2>/dev/null | wc -l)
SOURCE_FILES=$(find src -name "*.ts" -o -name "*.tsx" -o -name "*.cs" 2>/dev/null | wc -l)

if [ $SOURCE_FILES -gt 0 ]; then
    TEST_RATIO=$((TEST_FILES * 100 / SOURCE_FILES))
    if [ $TEST_RATIO -lt 60 ]; then
        echo "- 🧪 **Increase test coverage**: Current ratio is ${TEST_RATIO}%. Consider adding more tests."
    fi
fi

# Check for uncommitted changes
if git status --porcelain | grep -q .; then
    echo "- 📝 **Commit pending changes**: $(git status --porcelain | wc -l) files have uncommitted changes."
fi

# Check role diversity
RECENT_ROLES=$(find .claude -name "CLAUDE-backup-*.md" -mtime -1 2>/dev/null | wc -l)
if [ $RECENT_ROLES -lt 2 ]; then
    echo "- 🎭 **Diversify role usage**: Only $RECENT_ROLES role(s) used recently. Consider utilizing different expertise."
fi

echo "- 📊 **Monitor trends**: Run \`./scripts/team-dashboard.sh\` for detailed insights."
)

---

*Generated automatically by team-metrics-collector.sh*
EOF
    
    echo "  ✅ Summary report saved: $summary_file"
}

# Function: Archive Old Metrics
archive_old_metrics() {
    echo "🗄️ Archiving old metrics..."
    
    # Archive metrics older than 30 days
    find "$METRICS_BASE_DIR" -name "*.json" -mtime +30 -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true
    find "$TRENDS_DIR" -name "*.json" -mtime +30 -exec mv {} "$ARCHIVE_DIR/" \; 2>/dev/null || true
    
    # Compress archive if it gets large
    if [ $(find "$ARCHIVE_DIR" -name "*.json" | wc -l) -gt 100 ]; then
        local archive_name="metrics-archive-$(date '+%Y%m').tar.gz"
        tar -czf "$ARCHIVE_DIR/$archive_name" "$ARCHIVE_DIR"/*.json 2>/dev/null || true
        find "$ARCHIVE_DIR" -name "*.json" -delete 2>/dev/null || true
        echo "  📦 Archived old metrics to: $archive_name"
    fi
    
    echo "  ✅ Archive cleanup completed"
}

# Main execution
main() {
    case "${1:-collect}" in
        "collect")
            collect_git_metrics
            collect_code_metrics
            collect_role_metrics
            collect_system_metrics
            generate_trend_analysis
            create_summary_report
            archive_old_metrics
            echo ""
            echo "✅ All metrics collected successfully!"
            echo ""
            echo "📁 Files created:"
            echo "  - Git metrics: $METRICS_BASE_DIR/git-metrics-$DATE.json"
            echo "  - Code metrics: $METRICS_BASE_DIR/code-metrics-$DATE.json"
            echo "  - Role metrics: $METRICS_BASE_DIR/role-metrics-$DATE.json"
            echo "  - System metrics: $METRICS_BASE_DIR/system-metrics-$DATE.json"
            echo "  - Trend analysis: $TRENDS_DIR/trends-$DATE.json"
            echo "  - Daily summary: $METRICS_BASE_DIR/daily-summary-$DATE.md"
            ;;
        "report")
            create_summary_report
            echo "📋 Summary report generated: $METRICS_BASE_DIR/daily-summary-$DATE.md"
            ;;
        "trends")
            generate_trend_analysis
            echo "📈 Trend analysis generated: $TRENDS_DIR/trends-$DATE.json"
            ;;
        "archive")
            archive_old_metrics
            ;;
        "help")
            echo "Usage: $0 [collect|report|trends|archive|help]"
            echo ""
            echo "Commands:"
            echo "  collect  - Collect all metrics (default)"
            echo "  report   - Generate daily summary report only"
            echo "  trends   - Generate trend analysis only"
            echo "  archive  - Archive old metrics only"
            echo "  help     - Show this help message"
            ;;
        *)
            echo "Unknown command: $1"
            echo "Use '$0 help' for usage information."
            exit 1
            ;;
    esac
}

# Check dependencies
if ! command -v jq >/dev/null 2>&1; then
    echo "⚠️ Warning: jq not found. Some trend analysis features may be limited."
    echo "   Install jq for full functionality: sudo apt-get install jq"
fi

if ! command -v bc >/dev/null 2>&1; then
    echo "⚠️ Warning: bc not found. Some calculations may be limited."
    echo "   Install bc for full functionality: sudo apt-get install bc"
fi

# Run main function
main "$@"