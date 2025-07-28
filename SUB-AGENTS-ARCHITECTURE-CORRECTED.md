# Claude Code Sub-Agents - Korrigierte Team-Architektur

## 🎯 Korrigiertes Konzept

**Sub-Agents sind spezialisierte Claude Code Rollen, die als Team in derselben Entwicklungsumgebung arbeiten, NICHT separate Container!**

## 🏗️ Team-basierte Architektur

### Shared Environment Ansatz
```
Standard Multi-Agent Setup (Agent 2-4)
├── Agent 2: Port 60201-60203 + Sub-Agent Team
├── Agent 3: Port 60301-60303 + Sub-Agent Team  
└── Agent 4: Port 60401-60403 + Sub-Agent Team
```

### Sub-Agent Rollen im Team
**Alle Sub-Agents arbeiten in derselben Docker-Umgebung (z.B. Agent 4):**

- **S1 - Senior Developer**: Architektur-Lead und Code-Review
- **S2 - UI Developer**: Frontend-Komponenten und Styling
- **S3 - UX Expert**: User Experience und Accessibility
- **S4 - Test Expert**: Testing-Strategien und Qualitätssicherung
- **S5 - Architecture Expert**: System-Design und Performance
- **S6 - DevOps Expert**: CI/CD und Deployment

## 🤝 Team-Workflow

### 1. Issue Assignment to Agent Team
```bash
# Starte Standard Agent (z.B. Agent 4) für komplexes Issue
./scripts/start-agent.sh 4 feat/70-complex-feature

# Agent 4 bekommt ein Team von Sub-Agents zugewiesen
```

### 2. Role-Based Claude Sessions
**Mehrere Claude Code Sessions in demselben Worktree mit verschiedenen Rollen:**

```bash
# Terminal 1: Senior Developer Role
cd ../booking-agent4
export CLAUDE_ROLE=senior-developer
claude

# Terminal 2: UI Developer Role  
cd ../booking-agent4
export CLAUDE_ROLE=ui-developer
claude

# Terminal 3: Test Expert Role
cd ../booking-agent4
export CLAUDE_ROLE=test-expert
claude
```

### 3. Koordination durch Branch-Strategy
```bash
# Haupt-Feature Branch
feat/70-complex-feature

# Sub-Feature Branches (von verschiedenen Rollen erstellt)
├── feat/70-complex-feature-architecture  (Senior Developer)
├── feat/70-complex-feature-frontend      (UI Developer)  
├── feat/70-complex-feature-tests         (Test Expert)
└── feat/70-complex-feature-deployment    (DevOps Expert)
```

## 🛠️ Implementation

### Role-Based CLAUDE.md System
```bash
# Struktur im Worktree
booking-agent4/
├── CLAUDE.md                     # Standard Agent Instructions
├── CLAUDE-senior-developer.md    # Senior Developer Role
├── CLAUDE-ui-developer.md        # UI Developer Role
├── CLAUDE-test-expert.md         # Test Expert Role
└── .claude/
    ├── current-role.txt          # Aktuelle Rolle
    └── team-coordination.md      # Team-Koordination
```

### Role Switching System
```bash
# Script für Rollen-Wechsel
./scripts/switch-role.sh senior-developer
# -> Kopiert CLAUDE-senior-developer.md nach CLAUDE.md
# -> Setzt Environment für Rolle
# -> Zeigt rollenspezifische Instruktionen
```

### Team Coordination
```yaml
# .claude/team-coordination.md
Current Issue: #70
Main Branch: feat/70-complex-feature
Active Roles:
  - senior-developer: Architecture lead
  - ui-developer: Frontend implementation  
  - test-expert: Quality assurance
Team Lead: senior-developer
```

## 📋 Korrigierte Scripts

### start-sub-agent-team.sh
```bash
#!/bin/bash
# Startet Standard Agent mit Sub-Agent Team-Support
AGENT_NUMBER=$1
BRANCH_NAME=$2  
SUB_AGENT_ROLES=$3  # "senior-developer,ui-developer,test-expert"

# Starte Standard Agent
./scripts/start-agent.sh $AGENT_NUMBER $BRANCH_NAME

# Setup Team-Rollen im Worktree
./scripts/setup-team-roles.sh $AGENT_NUMBER "$SUB_AGENT_ROLES"
```

### switch-role.sh
```bash
#!/bin/bash
# Wechselt Claude Role im aktuellen Worktree
ROLE=$1

# Validiere Rolle
VALID_ROLES=("senior-developer" "ui-developer" "ux-expert" 
             "test-expert" "architecture-expert" "devops-expert")

# Kopiere rollenspezifische CLAUDE.md
cp "CLAUDE-$ROLE.md" "CLAUDE.md"

# Setze Environment
echo $ROLE > .claude/current-role.txt
export CLAUDE_ROLE=$ROLE

echo "🎭 Rolle gewechselt zu: $ROLE"
echo "💡 Starte neue Claude Session für optimale Rolle-Integration"
```

### team-status.sh
```bash
#!/bin/bash
# Zeigt Team-Status im aktuellen Worktree

echo "🤖 Sub-Agent Team Status"
echo "========================"
echo "Worktree: $(pwd)"
echo "Haupt-Branch: $(git branch --show-current)"
echo "Aktuelle Rolle: $(cat .claude/current-role.txt 2>/dev/null || echo 'Keine')"
echo ""
echo "📋 Verfügbare Rollen:"
ls CLAUDE-*.md | sed 's/CLAUDE-//g' | sed 's/.md//g' | sed 's/^/  - /'
echo ""
echo "🔄 Rolle wechseln: ./scripts/switch-role.sh <rolle>"
```

## 🎯 Praktische Anwendung

### Beispiel: Full-Stack Feature Development

**1. Team Setup:**
```bash
# Starte Agent 4 mit Team-Rollen
./scripts/start-sub-agent-team.sh 4 feat/75-booking-dashboard "senior-developer,ui-developer,test-expert"
```

**2. Parallele Entwicklung:**
```bash
# Terminal 1: Senior Developer (Architektur)
cd ../booking-agent4
./scripts/switch-role.sh senior-developer
claude
# -> Fokus: API-Design, Datenbank-Schema, System-Architektur

# Terminal 2: UI Developer (Frontend)  
cd ../booking-agent4
./scripts/switch-role.sh ui-developer
claude
# -> Fokus: React-Komponenten, Tailwind-Styling, UX

# Terminal 3: Test Expert (Qualität)
cd ../booking-agent4  
./scripts/switch-role.sh test-expert
claude
# -> Fokus: Unit-Tests, Integration-Tests, E2E-Tests
```

**3. Koordination:**
- Senior Developer koordiniert Architektur-Entscheidungen
- UI Developer implementiert Frontend basierend auf Specs
- Test Expert erstellt Tests parallel zur Entwicklung
- Alle arbeiten im selben Worktree, verschiedene Dateien/Bereiche

## ✅ Vorteile der Team-Architektur

### Resource Efficiency
- ✅ **Ein Docker-Setup** statt 6 separate Container
- ✅ **Shared Services** (DB, Backend, Frontend)
- ✅ **Minimaler Overhead** bei maximaler Spezialisierung

### True Collaboration  
- ✅ **Shared Codebase** in Echtzeit
- ✅ **Git-Integration** für alle Rollen
- ✅ **Live Collaboration** zwischen Rollen

### Flexible Team Composition
- ✅ **Skalierbar**: 1-6 Rollen je nach Bedarf
- ✅ **Adaptiv**: Rollenverteilung je Issue
- ✅ **Effizient**: Nur benötigte Rollen aktivieren

## 🔧 Implementation Plan

### Phase 1: Role System
- [x] Rollenbasierte CLAUDE.md Files erstellen
- [ ] switch-role.sh Script implementieren
- [ ] team-status.sh Script implementieren

### Phase 2: Team Scripts
- [ ] start-sub-agent-team.sh Script
- [ ] setup-team-roles.sh Script  
- [ ] team-coordination System

### Phase 3: Integration
- [ ] Integration mit bestehenden Agent-Scripts
- [ ] Dokumentation und Beispiele
- [ ] Testing der Team-Workflows

---

**🎭 Korrigiertes Konzept: Sub-Agents sind spezialisierte Rollen in einem Team, nicht separate Container. Dies ermöglicht echte Kollaboration bei minimaler Komplexität.**