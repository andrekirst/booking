#!/bin/bash

# Multi-Agent Cleanup Script - Räumt nach PR-Merge auf
# Verwendung: ./scripts/cleanup-after-merge.sh <AGENT_NUMBER> [BRANCH_NAME]

set -e  # Exit bei Fehlern

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parameter Validierung
if [ $# -lt 1 ]; then
    echo -e "${RED}❌ Fehler: Agent-Nummer erforderlich${NC}"
    echo ""
    echo "Usage: $0 <AGENT_NUMBER> [BRANCH_NAME]"
    echo ""
    echo "Beispiele:"
    echo "  $0 2                    # Cleanup für Agent 2"
    echo "  $0 3 feat/75-dashboard  # Cleanup für Agent 3 mit Branch-Löschung"
    echo ""
    exit 1
fi

AGENT_NUMBER=$1
BRANCH_NAME=${2:-""}
WORKTREE_DIR="../booking-agent$AGENT_NUMBER"

# Validierung Agent-Nummer
if [[ ! $AGENT_NUMBER =~ ^[2-4]$ ]]; then
    echo -e "${RED}❌ Fehler: AGENT_NUMBER muss zwischen 2 und 4 liegen${NC}"
    exit 1
fi

echo -e "${BLUE}🧹 Post-Merge Cleanup für Agent $AGENT_NUMBER${NC}"
echo "================================================"
echo ""

# Schritt 1: Container und Volumes stoppen
echo -e "${YELLOW}📦 Schritt 1: Docker Container stoppen und Daten löschen${NC}"
if [ -f "docker-compose.agent$AGENT_NUMBER.yml" ]; then
    ./scripts/stop-agent.sh $AGENT_NUMBER --remove-data
    echo -e "${GREEN}✅ Docker Container und Volumes entfernt${NC}"
else
    echo -e "${YELLOW}⚠️  Docker Compose Datei nicht gefunden - überspringe${NC}"
fi
echo ""

# Schritt 2: Git Worktree entfernen
echo -e "${YELLOW}🌳 Schritt 2: Git Worktree entfernen${NC}"
if [ -d "$WORKTREE_DIR" ]; then
    # Prüfe ob Worktree sauber ist
    cd "$WORKTREE_DIR"
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}⚠️  Warnung: Uncommitted Changes in Worktree gefunden!${NC}"
        git status --short
        echo ""
        read -p "Trotzdem fortfahren und Änderungen verwerfen? (j/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Jj]$ ]]; then
            echo -e "${RED}❌ Abgebrochen - bitte manuell prüfen${NC}"
            exit 1
        fi
    fi
    
    # Zurück zum Hauptverzeichnis
    cd - > /dev/null
    
    # Worktree entfernen
    git worktree remove "$WORKTREE_DIR" --force
    echo -e "${GREEN}✅ Worktree entfernt: $WORKTREE_DIR${NC}"
else
    echo -e "${YELLOW}⚠️  Worktree nicht gefunden - überspringe${NC}"
fi
echo ""

# Schritt 3: Remote Branch löschen (optional)
if [ -n "$BRANCH_NAME" ]; then
    echo -e "${YELLOW}🌿 Schritt 3: Remote Branch löschen${NC}"
    
    # Prüfe ob Branch remote existiert
    if git ls-remote --heads origin "$BRANCH_NAME" | grep -q "$BRANCH_NAME"; then
        echo "Lösche Remote Branch: origin/$BRANCH_NAME"
        git push origin --delete "$BRANCH_NAME"
        echo -e "${GREEN}✅ Remote Branch gelöscht${NC}"
    else
        echo -e "${YELLOW}⚠️  Remote Branch nicht gefunden - überspringe${NC}"
    fi
    
    # Lokalen Branch löschen falls vorhanden
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        git branch -D "$BRANCH_NAME" 2>/dev/null || true
        echo -e "${GREEN}✅ Lokaler Branch gelöscht${NC}"
    fi
else
    echo -e "${YELLOW}ℹ️  Schritt 3: Branch-Löschung übersprungen (kein Branch angegeben)${NC}"
fi
echo ""

# Schritt 4: Docker Cleanup
echo -e "${YELLOW}🐳 Schritt 4: Docker System Cleanup${NC}"

# Entferne ungenutzte Container
REMOVED_CONTAINERS=$(docker container prune -f 2>&1 | grep -oE 'Total reclaimed space: .*' || echo "0B")
echo "   Entfernte Container: $REMOVED_CONTAINERS"

# Entferne ungenutzte Images
REMOVED_IMAGES=$(docker image prune -f 2>&1 | grep -oE 'Total reclaimed space: .*' || echo "0B")
echo "   Entfernte Images: $REMOVED_IMAGES"

# Entferne ungenutzte Volumes (vorsichtig - nur wirklich ungenutzte)
REMOVED_VOLUMES=$(docker volume prune -f 2>&1 | grep -oE 'Total reclaimed space: .*' || echo "0B")
echo "   Entfernte Volumes: $REMOVED_VOLUMES"

echo -e "${GREEN}✅ Docker Cleanup abgeschlossen${NC}"
echo ""

# Schritt 5: Git Maintenance
echo -e "${YELLOW}🔧 Schritt 5: Git Repository Wartung${NC}"

# Garbage Collection
git gc --auto --quiet

# Prune Worktree Liste
git worktree prune

# Remote Tracking Branches aufräumen
git remote prune origin

echo -e "${GREEN}✅ Git Wartung abgeschlossen${NC}"
echo ""

# Finale Zusammenfassung
echo -e "${BLUE}📊 Cleanup Zusammenfassung${NC}"
echo "=========================="
echo -e "✅ Agent $AGENT_NUMBER vollständig aufgeräumt"
echo -e "✅ Docker Container und Volumes entfernt"
echo -e "✅ Git Worktree entfernt"
if [ -n "$BRANCH_NAME" ]; then
    echo -e "✅ Branch '$BRANCH_NAME' gelöscht"
fi
echo -e "✅ Docker System bereinigt"
echo -e "✅ Git Repository gewartet"
echo ""

# Zeige verfügbare Agenten
echo -e "${BLUE}🚀 Verfügbare Agenten für neue Issues:${NC}"
./scripts/status-agents.sh | grep -E "Agent [2-4]" -A 3 | grep -E "(Agent|Worktree|Services)"

echo ""
echo -e "${GREEN}✨ Agent $AGENT_NUMBER ist jetzt bereit für ein neues Issue!${NC}"
echo ""
echo "Nächster Schritt:"
echo "  ./scripts/start-agent.sh $AGENT_NUMBER feat/new-feature"