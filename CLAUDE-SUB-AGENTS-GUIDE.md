# Claude Code Sub-Agents - Komplette Anleitung

## 🎯 Überblick

Das Claude Code Sub-Agents System erweitert die bestehende Multi-Agent-Architektur um **spezialisierte Rollen**, die als Team in derselben Entwicklungsumgebung arbeiten. Statt separate Container zu verwenden, arbeiten Sub-Agents als **Team-Rollen** in einem gemeinsamen Worktree.

## 🏗️ Architektur-Konzept

### Team-basierte Sub-Agents
```
Standard Multi-Agent (z.B. Agent 4)
├── Shared Docker Environment (Ports 60401-60403)
├── Shared Git Worktree (../booking-agent4)
└── Multiple Claude Code Roles:
    ├── 🎯 Senior Developer (Architektur-Lead)
    ├── 🎨 UI Developer (Frontend-Spezialist)  
    ├── 👤 UX Expert (User Experience)
    ├── 🧪 Test Expert (Qualitätssicherung)
    ├── 🏗️ Architecture Expert (System-Design)
    └── ⚙️ DevOps Expert (CI/CD & Deployment)
```

### Kernprinzipien
- **Ein Docker-Setup** für alle Team-Rollen
- **Shared Codebase** für echte Kollaboration
- **Rolle-spezifische CLAUDE.md** Konfigurationen
- **Flexible Team-Zusammenstellung** je nach Issue-Komplexität

## 🚀 Quick Start

### 1. Standard Multi-Agent mit Team starten
```bash
# Einfacher Start
./scripts/start-sub-agent-team.sh 4 feat/75-complex-feature

# Mit spezifischen Team-Rollen
./scripts/start-sub-agent-team.sh 4 feat/75-complex-feature "senior-developer,ui-developer,test-expert"

# Mit Issue-Nummer
./scripts/start-sub-agent-team.sh 4 feat/75-complex-feature "senior-developer,ui-developer" 75
```

### 2. Rolle wechseln und arbeiten
```bash
# Zum Team-Worktree wechseln
cd ../booking-agent4

# Rolle auswählen
./scripts/switch-role.sh senior-developer

# Claude Code Session starten
claude
```

### 3. Team-Status überprüfen
```bash
# Team-Dashboard anzeigen
./scripts/team-status.sh

# Rolle-Informationen anzeigen
./scripts/switch-role.sh ui-developer --info
```

## 👥 Verfügbare Sub-Agent Rollen

### 🎯 Senior Developer (`senior-developer`)
**Hauptverantwortlichkeiten:**
- **Architekturentscheidungen**: Clean Architecture, SOLID Principles, Design Patterns
- **Code-Quality & Reviews**: Best Practices, Refactoring, Technical Debt Management
- **Performance-Optimierung**: Profiling, Database-Optimierung, Caching-Strategien
- **Technical Leadership**: Mentoring, Standards, komplexe Problemlösungen

**Spezialisierung:**
- .NET 9 Clean Architecture
- Entity Framework Core Advanced Patterns
- Performance Profiling und Optimierung
- System-Design und Integration

**Typische Aufgaben:**
```csharp
// Architektur-Entscheidungen treffen
public class EventStore(BookingDbContext context, IEventSerializer serializer) : IEventStore
{
    public async Task<T?> GetAggregateAsync<T>(Guid id) where T : AggregateRoot
    {
        // Performance-optimierte Implementation
    }
}
```

### 🎨 UI Developer (`ui-developer`)
**Hauptverantwortlichkeiten:**
- **React/Next.js Entwicklung**: Server Components, Client Components, Custom Hooks
- **Tailwind CSS & Styling**: Utility-First Design, Responsive Layouts
- **Component Libraries**: Wiederverwendbare UI-Komponenten, Design Systems
- **Frontend Performance**: Bundle Optimization, Lazy Loading

**Spezialisierung:**
- Next.js 15 mit App Router
- Tailwind CSS 4 Advanced Patterns
- React Performance Optimization
- Component-Driven Development

**Typische Aufgaben:**
```typescript
// Performance-optimierte React Components
const BookingStatusFilter = memo(({ currentStatus, onStatusChange }: FilterProps) => {
    const handleStatusChange = useCallback((status: BookingStatus | null) => {
        onStatusChange(status);
    }, [onStatusChange]);
    
    return (
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            {/* Tailwind-optimierte UI Implementation */}
        </div>
    );
});
```

### 👤 UX Expert (`ux-expert`)
**Hauptverantwortlichkeiten:**
- **User Experience Design**: Intuitive Benutzeroberflächen, Interaction Design
- **Accessibility**: WCAG 2.1 AA Compliance, Inclusive Design
- **Usability Testing**: User Journey Analyse, Usability-Optimierungen
- **Information Architecture**: Logische Strukturierung, Navigation

**Spezialisierung:**
- WCAG Guidelines Implementation
- Screen Reader Optimization
- User Journey Mapping
- Accessibility Testing

**Typische Aufgaben:**
```typescript
// Accessibility-optimierte Komponenten
const AccessibleButton = ({ children, onClick, ...props }: ButtonProps) => {
    return (
        <button
            onClick={onClick}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-describedby="button-description"
            {...props}
        >
            {children}
        </button>
    );
};
```

### 🧪 Test Expert (`test-expert`)
**Hauptverantwortlichkeiten:**
- **Test Strategy**: Comprehensive Test Plans, Test Pyramid Implementation
- **Unit Testing**: Jest (Frontend), xUnit (Backend), Test-Driven Development
- **Integration Testing**: API Testing, Database Testing, Service Integration
- **E2E Testing**: Playwright, User Journey Testing, Automation

**Spezialisierung:**
- Jest für Frontend Unit Tests
- xUnit für Backend Unit Tests  
- Playwright für E2E Tests
- GitHub Actions Test Automation

**Typische Aufgaben:**
```typescript
// Comprehensive Component Testing
describe('BookingStatusFilter', () => {
    it('should update status when filter is selected', async () => {
        const mockOnChange = jest.fn();
        render(<BookingStatusFilter onStatusChange={mockOnChange} />);
        
        await user.click(screen.getByText('Ausstehend'));
        expect(mockOnChange).toHaveBeenCalledWith(BookingStatus.Pending);
    });
});
```

### 🏗️ Architecture Expert (`architecture-expert`)  
**Hauptverantwortlichkeiten:**
- **System Architecture**: Microservices, Event-Driven Architecture, Scalability
- **Database Design**: Schema Design, Query Optimization, Event Sourcing
- **Performance Patterns**: Caching Strategies, Load Balancing, Optimization
- **Integration Design**: API Design, Message Queues, Service Communication

**Spezialisierung:**
- Event Sourcing und CQRS
- Domain-Driven Design (DDD)
- PostgreSQL Performance Tuning
- System Scalability Patterns

**Typische Aufgaben:**
```csharp
// Event Sourcing Architecture
public class BookingAggregate : AggregateRoot
{
    public void Accept()
    {
        if (Status != BookingStatus.Pending)
            throw new InvalidOperationException("Can only accept pending bookings");
            
        ApplyEvent(new BookingAcceptedEvent(Id, AcceptedAt: DateTime.UtcNow));
    }
}
```

### ⚙️ DevOps Expert (`devops-expert`)
**Hauptverantwortlichkeiten:**
- **CI/CD Pipelines**: GitHub Actions, Automated Testing, Deployment Automation
- **Containerization**: Docker Optimization, Multi-Stage Builds, Security
- **Infrastructure**: Infrastructure as Code, Monitoring, Logging
- **Deployment Strategies**: Blue-Green Deployment, Rollback Mechanisms

**Spezialisierung:**
- GitHub Actions Workflows
- Docker Multi-Agent Architecture
- Infrastructure Automation
- Monitoring und Observability

**Typische Aufgaben:**
```yaml
# GitHub Actions Workflow Optimization
name: CI/CD Pipeline
on:
  push:
    branches: [main, 'feat/*']
jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [20.x, 22.x]
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
```

## 🛠️ Management-Scripts

### start-sub-agent-team.sh
**Startet Standard Multi-Agent mit Team-Support**

```bash
# Syntax
./scripts/start-sub-agent-team.sh <AGENT_NUMBER> <BRANCH_NAME> [SUB_AGENT_ROLES] [ISSUE_NUMBER]

# Beispiele
./scripts/start-sub-agent-team.sh 4 feat/75-feature
./scripts/start-sub-agent-team.sh 4 feat/75-feature "senior-developer,ui-developer,test-expert"
./scripts/start-sub-agent-team.sh 4 feat/75-feature "full-stack" 75
```

**Vordefinierte Team-Patterns:**
- `full-stack`: senior-developer,ui-developer,test-expert,devops-expert
- `frontend-focus`: ui-developer,ux-expert,test-expert  
- `backend-focus`: senior-developer,architecture-expert,test-expert
- `performance`: senior-developer,architecture-expert,devops-expert

### switch-role.sh
**Wechselt zwischen Sub-Agent Rollen**

```bash
# Syntax
./scripts/switch-role.sh <ROLE> [--info]

# Beispiele
./scripts/switch-role.sh senior-developer
./scripts/switch-role.sh ui-developer --info
./scripts/switch-role.sh default
```

**Was passiert beim Rollen-Wechsel:**
1. Backup der aktuellen CLAUDE.md
2. Kopiere rollenspezifische CLAUDE.md 
3. Update .claude/current-role.txt
4. Erstelle/Update Team-Koordination
5. Setze Environment-Variablen

### team-status.sh
**Zeigt umfassendes Team-Dashboard**

```bash
./scripts/team-status.sh
```

**Dashboard-Inhalte:**
- Worktree-Informationen
- Git-Status und Remote-Sync
- Verfügbare Team-Rollen
- Team-Koordination-Status
- CLAUDE.md Status und Rolle-Match
- Service-URLs
- Management-Befehle und Empfehlungen

## 🎭 Team-Workflows

### 1. Full-Stack Feature Development
**Team:** Senior Developer, UI Developer, Test Expert, DevOps Expert

```bash
# Setup
./scripts/start-sub-agent-team.sh 4 feat/78-booking-dashboard "full-stack" 78

# Phase 1: Architecture (Senior Developer)
cd ../booking-agent4
./scripts/switch-role.sh senior-developer
claude
# -> API-Design, Datenbank-Schema, System-Architektur

# Phase 2: Frontend (UI Developer)
./scripts/switch-role.sh ui-developer  
claude
# -> React-Komponenten, Tailwind-Styling, UX Implementation

# Phase 3: Testing (Test Expert)
./scripts/switch-role.sh test-expert
claude
# -> Unit-Tests, Integration-Tests, E2E-Tests

# Phase 4: Deployment (DevOps Expert)
./scripts/switch-role.sh devops-expert
claude
# -> CI/CD Pipeline, Docker-Optimierung, Monitoring
```

### 2. Performance Optimization
**Team:** Architecture Expert, Senior Developer, DevOps Expert

```bash
# Setup für Performance-fokussiertes Team
./scripts/start-sub-agent-team.sh 4 feat/79-performance-optimization "performance" 79

# Architecture Expert: System-Analysis
./scripts/switch-role.sh architecture-expert
# -> Database Query Optimization, Caching Strategy

# Senior Developer: Code Optimization  
./scripts/switch-role.sh senior-developer
# -> Algorithm Optimization, Memory Management

# DevOps Expert: Infrastructure Optimization
./scripts/switch-role.sh devops-expert
# -> Container Optimization, Load Balancing
```

### 3. UI/UX Redesign
**Team:** UI Developer, UX Expert, Test Expert

```bash
# Setup für UI/UX-fokussiertes Team
./scripts/start-sub-agent-team.sh 4 feat/80-ui-redesign "frontend-focus" 80

# UX Expert: User Research & Design
./scripts/switch-role.sh ux-expert
# -> User Journey Analysis, Accessibility Review

# UI Developer: Implementation
./scripts/switch-role.sh ui-developer  
# -> Component Redesign, Responsive Implementation

# Test Expert: Usability Testing
./scripts/switch-role.sh test-expert
# -> E2E Tests, Accessibility Testing
```

## 🔧 Koordination & Best Practices

### Git-Workflow für Teams
```bash
# Branch-Strategie für Team-Entwicklung
feat/78-booking-dashboard                    # Haupt-Feature Branch
├── feat/78-booking-dashboard-api           # Backend (Senior Developer)
├── feat/78-booking-dashboard-ui            # Frontend (UI Developer)
├── feat/78-booking-dashboard-tests         # Testing (Test Expert)
└── feat/78-booking-dashboard-deployment    # DevOps (DevOps Expert)

# Koordination durch regelmäßige Merges in Haupt-Branch
```

### Team-Kommunikation
```markdown
# .claude/team-coordination.md wird automatisch gepflegt
## Current Sprint
- **Architecture**: API-Design abgeschlossen ✅
- **Frontend**: Komponenten 80% fertig 🔄  
- **Testing**: Unit Tests implementiert ✅
- **DevOps**: CI/CD Pipeline konfiguriert ✅

## Next Steps
- Frontend: Mobile Responsive Design
- Testing: E2E Tests für kritische User Journeys
- DevOps: Production Deployment vorbereiten
```

### Code-Review Prozess
1. **Role-Specific Reviews**: Jede Rolle reviewt ihren Bereich
2. **Cross-Role Collaboration**: Senior Developer koordiniert Gesamt-Review
3. **Quality Gates**: Test Expert validiert vor Merge
4. **Architecture Validation**: Architecture Expert prüft System-Impact

## 📊 Monitoring & Metrics

### Team-Effizienz Metriken
```bash
# Team-Produktivität messen
./scripts/team-status.sh | grep "Commits today"
./scripts/team-status.sh | grep "Active roles"

# Rolle-spezifische Contribution tracking
git log --author="Agent4-Senior" --since="1 day ago" --oneline
git log --author="Agent4-UI" --since="1 day ago" --oneline
```

### Quality Metrics
- **Code Coverage**: Minimum 80% (Test Expert Verantwortung)
- **Performance**: <200ms API Response Time (Architecture Expert)
- **Accessibility**: WCAG 2.1 AA Compliance (UX Expert)
- **Bundle Size**: <1MB Critical Path (UI Developer)

## 🚨 Troubleshooting

### Häufige Probleme

#### Problem: "Rolle-Wechsel funktioniert nicht"
```bash
# Lösung: Prüfe CLAUDE.md Status
./scripts/team-status.sh
# -> Zeigt Rolle-Match und Konfigurationsstatus

# Reset auf Standard
./scripts/switch-role.sh default
```

#### Problem: "Team-Koordination out of sync"  
```bash
# Lösung: Team-Status neu synchronisieren
cd ../booking-agent4
git status
git pull origin feat/branch-name
./scripts/team-status.sh
```

#### Problem: "Rollen-Konfiguration fehlt"
```bash
# Lösung: Prüfe verfügbare Konfigurationen
ls config/sub-agents/CLAUDE-*.md

# Fallback auf Standard
./scripts/switch-role.sh default
```

### Debug-Befehle
```bash
# Aktuelle Rolle prüfen
cat .claude/current-role.txt

# Team-Koordination anzeigen
cat .claude/team-coordination.md

# CLAUDE.md Inhalt prüfen
head -10 CLAUDE.md

# Verfügbare Backups
ls .claude/CLAUDE-backup-*.md
```

## 📈 Advanced Features

### Multi-Session Development
```bash
# Terminal 1: Architecture Lead
cd ../booking-agent4
./scripts/switch-role.sh senior-developer
claude

# Terminal 2: Frontend Development
cd ../booking-agent4  
./scripts/switch-role.sh ui-developer
claude

# Terminal 3: Quality Assurance
cd ../booking-agent4
./scripts/switch-role.sh test-expert  
claude
```

### Custom Team Compositions
```yaml
# Eigene Team-Patterns definieren (in start-sub-agent-team.sh)
case $SUB_AGENT_ROLES in
    "database-focus")
        SUB_AGENT_ROLES="senior-developer,architecture-expert"
        ;;
    "security-focus")  
        SUB_AGENT_ROLES="senior-developer,devops-expert,test-expert"
        ;;
    "mobile-focus")
        SUB_AGENT_ROLES="ui-developer,ux-expert,test-expert"
        ;;
esac
```

### Integration mit GitHub Issues
```bash
# Automatische Issue-Integration
./scripts/start-sub-agent-team.sh 4 feat/85-mobile-app "mobile-focus" 85

# -> Erstellt automatisch Links zu Issue #85
# -> Konfiguriert Team basierend auf Issue-Labels
# -> Setzt Milestones und Assignees
```

## ✅ Checkliste für Teams

### Setup-Checkliste
- [ ] Multi-Agent gestartet: `./scripts/start-sub-agent-team.sh`
- [ ] Team-Rollen definiert und konfiguriert
- [ ] Alle Team-Mitglieder haben passende CLAUDE.md
- [ ] Git-Branch-Strategie festgelegt
- [ ] Team-Koordination initialisiert

### Development-Checkliste  
- [ ] Rolle-spezifische Tasks klar definiert
- [ ] Regelmäßige Team-Status Checks: `./scripts/team-status.sh`
- [ ] Cross-Role Communication über Git
- [ ] Code-Reviews nach Rollen-Expertise
- [ ] Quality Gates durch Test Expert

### Completion-Checkliste
- [ ] Alle Rollen haben ihre Tasks completed
- [ ] Integration-Tests erfolgreich (Test Expert)
- [ ] Performance-Validierung (Architecture Expert)  
- [ ] Accessibility-Check (UX Expert)
- [ ] Deployment-Ready (DevOps Expert)
- [ ] Final Review (Senior Developer)

---

**🎭 Mit dem Claude Code Sub-Agents System können Sie komplexe Software-Entwicklungsprojekte mit spezialisierter Expertise und echter Team-Kollaboration bewältigen - alles in einer effizienten, ressourcenschonenden Umgebung.**