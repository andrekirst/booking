#!/bin/bash

# Docker Compose Syntax Validation Script
# Für CI/CD Pipeline - Schnelle Syntax-Validierung aller Compose-Files
# =====================================================================

set -e

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Docker Compose Syntax Validation${NC}"
echo -e "${BLUE}====================================${NC}"

# Prüfe Docker Compose v2 Verfügbarkeit
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose v2 nicht verfügbar${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker Compose Version: $(docker compose version --short)${NC}"
echo ""

# Sammle alle Compose-Files
compose_files=(
    "docker-compose.yml"
    "docker-compose.dev.yml"
    "docker-compose.agent2.yml"
    "docker-compose.agent3.yml"
    "docker-compose.agent4.yml"
    "docker-compose.agent-template.yml"
    "docker-compose.sub-agent-template.yml"
)

total_files=0
valid_files=0
invalid_files=0
skipped_files=0

for file in "${compose_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${YELLOW}⏭️  $file - ÜBERSPRUNGEN (nicht gefunden)${NC}"
        skipped_files=$((skipped_files + 1))
        continue
    fi
    
    total_files=$((total_files + 1))
    echo -e "${BLUE}🔍 Validiere $file...${NC}"
    
    # Syntax-Validierung mit timeout
    if timeout 30 docker compose -f "$file" config --quiet &> /dev/null; then
        echo -e "${GREEN}✅ $file - GÜLTIG${NC}"
        valid_files=$((valid_files + 1))
    else
        echo -e "${RED}❌ $file - SYNTAX-FEHLER${NC}"
        
        # Zeige ersten Fehler
        echo -e "${RED}   Fehler-Details:${NC}"
        timeout 30 docker compose -f "$file" config 2>&1 | head -3 | sed 's/^/   /'
        echo ""
        
        invalid_files=$((invalid_files + 1))
    fi
done

echo ""
echo -e "${BLUE}📊 Validierungs-Zusammenfassung${NC}"
echo -e "${BLUE}===============================${NC}"
echo -e "${GREEN}✅ Gültig: $valid_files${NC}"
echo -e "${RED}❌ Ungültig: $invalid_files${NC}"
echo -e "${YELLOW}⏭️  Übersprungen: $skipped_files${NC}"
echo -e "${BLUE}📁 Gesamt gefunden: $total_files${NC}"

# Exit-Code für CI/CD
if [ $invalid_files -eq 0 ]; then
    echo -e "\n${GREEN}🎉 Alle Compose-Files sind syntaktisch korrekt!${NC}"
    exit 0
else
    echo -e "\n${RED}💥 $invalid_files Compose-File(s) haben Syntax-Fehler!${NC}"
    exit 1
fi