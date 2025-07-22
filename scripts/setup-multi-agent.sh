#!/bin/bash
# setup-multi-agent.sh - Multi-Agent Development Setup Script
# Usage: ./setup-multi-agent.sh <issue-number> <feature-name> <agent-number>
# Example: ./setup-multi-agent.sh 33 user-dashboard 2

set -e

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check parameters
if [ $# -ne 3 ]; then
    echo -e "${RED}Error: Missing parameters${NC}"
    echo "Usage: $0 <issue-number> <feature-name> <agent-number>"
    echo "Example: $0 33 user-dashboard 2"
    exit 1
fi

ISSUE_NUMBER=$1
FEATURE_NAME=$2
AGENT_NUMBER=$3

# Validate agent number
if ! [[ "$AGENT_NUMBER" =~ ^[2-9]$ ]]; then
    echo -e "${RED}Error: Agent number must be between 2-9${NC}"
    exit 1
fi

# Setup variables
BRANCH_NAME="feat/${ISSUE_NUMBER}-${FEATURE_NAME}"
WORKTREE_DIR="../booking-agent${AGENT_NUMBER}"
CURRENT_DIR=$(pwd)

echo -e "${BLUE}🚀 Setting up Multi-Agent Environment${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Issue:      #${ISSUE_NUMBER}"
echo -e "Feature:    ${FEATURE_NAME}"
echo -e "Agent:      ${AGENT_NUMBER}"
echo -e "Branch:     ${BRANCH_NAME}"
echo -e "Workspace:  ${WORKTREE_DIR}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if worktree already exists
if [ -d "$WORKTREE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Worktree already exists at ${WORKTREE_DIR}${NC}"
    read -p "Remove existing worktree? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Removing existing worktree...${NC}"
        git worktree remove "$WORKTREE_DIR" --force
    else
        echo -e "${RED}Aborted.${NC}"
        exit 1
    fi
fi

# Fetch latest changes
echo -e "${BLUE}📥 Fetching latest changes...${NC}"
git fetch origin

# Create worktree
echo -e "${BLUE}🌳 Creating worktree...${NC}"
git worktree add "$WORKTREE_DIR" -b "$BRANCH_NAME" origin/main

# Setup Claude settings
echo -e "${BLUE}⚙️  Setting up Claude configuration...${NC}"
if [ -d ".claude" ]; then
    cp -r .claude "$WORKTREE_DIR/"
    
    # Create agent-specific settings
    SETTINGS_FILE="$WORKTREE_DIR/.claude/settings.local.json"
    if [ -f "$SETTINGS_FILE" ]; then
        # Backup original settings
        cp "$SETTINGS_FILE" "${SETTINGS_FILE}.backup"
    fi
    
    # Create agent-specific settings
    cat > "$SETTINGS_FILE" << EOF
{
  "agent": {
    "id": ${AGENT_NUMBER},
    "issue": ${ISSUE_NUMBER},
    "branch": "${BRANCH_NAME}",
    "workspace": "${WORKTREE_DIR}"
  },
  "context": {
    "isolation": true,
    "shared_files": ["CLAUDE.md", "requirements.md"]
  }
}
EOF
    echo -e "${GREEN}✅ Claude settings configured for Agent ${AGENT_NUMBER}${NC}"
else
    echo -e "${YELLOW}⚠️  No .claude directory found, skipping Claude setup${NC}"
fi

# Create agent info file
echo -e "${BLUE}📝 Creating agent info file...${NC}"
cat > "$WORKTREE_DIR/AGENT_INFO.md" << EOF
# Agent ${AGENT_NUMBER} Workspace

## Configuration
- **Issue**: #${ISSUE_NUMBER}
- **Feature**: ${FEATURE_NAME}
- **Branch**: ${BRANCH_NAME}
- **Created**: $(date)

## Guidelines
1. Work ONLY on Issue #${ISSUE_NUMBER}
2. Stay within the ${BRANCH_NAME} branch
3. Avoid modifying files being worked on by other agents
4. Commit and push changes regularly
5. Document all changes in commit messages

## Coordination
- Check CLAUDE.md for multi-agent protocols
- Communicate through PR descriptions
- Avoid conflicts by respecting file boundaries

## Commands
\`\`\`bash
# Navigate to workspace
cd ${WORKTREE_DIR}

# Start Claude session
claude

# Check status
git status
git log --oneline -5

# Push changes
git push -u origin ${BRANCH_NAME}
\`\`\`
EOF

# Create quick navigation script
echo -e "${BLUE}🔗 Creating navigation helper...${NC}"
NAV_SCRIPT="$HOME/agent${AGENT_NUMBER}.sh"
cat > "$NAV_SCRIPT" << EOF
#!/bin/bash
cd "${CURRENT_DIR}/${WORKTREE_DIR}"
echo "📍 Switched to Agent ${AGENT_NUMBER} workspace"
echo "🌿 Branch: ${BRANCH_NAME}"
echo "📋 Issue: #${ISSUE_NUMBER}"
pwd
EOF
chmod +x "$NAV_SCRIPT"

# Summary
echo -e "\n${GREEN}✨ Multi-Agent Setup Complete!${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Worktree created${NC}"
echo -e "${GREEN}✅ Branch configured${NC}"
echo -e "${GREEN}✅ Claude settings isolated${NC}"
echo -e "${GREEN}✅ Agent info documented${NC}"
echo -e "${GREEN}✅ Navigation helper created${NC}"
echo -e "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "\n${BLUE}Next steps:${NC}"
echo -e "1. Navigate: ${YELLOW}cd ${WORKTREE_DIR}${NC}"
echo -e "2. Start Claude: ${YELLOW}claude${NC}"
echo -e "3. Quick nav: ${YELLOW}~/agent${AGENT_NUMBER}.sh${NC}"
echo -e "\n${GREEN}Happy coding with Agent ${AGENT_NUMBER}! 🚀${NC}"