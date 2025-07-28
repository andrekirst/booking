# Claude Code Sub-Agents - Usage Guide

## 🎯 Überblick

Sub-Agents sind **spezialisierte Rollen** innerhalb eines Standard Multi-Agent Worktrees. Statt separate Container zu verwenden, arbeiten mehrere Claude Code Sessions mit unterschiedlichen Rollen in derselben Entwicklungsumgebung als Team.

## 🏗️ Konzept

### Team-basierte Entwicklung
```
Standard Agent 4 (Port 60401-60403)
└── Sub-Agent Team (samme Umgebung, verschiedene Rollen)
    ├── Terminal 1: Senior Developer Role
    ├── Terminal 2: UI Developer Role  
    ├── Terminal 3: Test Expert Role
    └── Terminal 4: DevOps Expert Role
```

### Verfügbare Rollen
- **🎯 Senior Developer**: Architektur, Code-Reviews, komplexe Problemlösungen
- **🎨 UI Developer**: Frontend-Komponenten, Styling, User Interface
- **👤 UX Expert**: User Experience, Usability, Accessibility
- **🧪 Test Expert**: Test-Strategien, Unit/Integration/E2E Tests
- **🏗️ Architecture Expert**: System-Design, Performance, Skalierbarkeit
- **⚙️ DevOps Expert**: CI/CD, Deployment, Infrastructure

## 🚀 Quick Start

### 1. Team Setup starten
```bash
# Einfaches Team-Setup
./scripts/start-sub-agent-team.sh 4 feat/75-complex-feature

# Mit spezifischen Rollen
./scripts/start-sub-agent-team.sh 4 feat/75-complex-feature "senior-developer,ui-developer,test-expert"

# Mit Issue-Nummer
./scripts/start-sub-agent-team.sh 4 feat/75-complex-feature "full-stack" 75
```

### 2. In Worktree wechseln
```bash
cd ../booking-agent4
```

### 3. Rolle wählen und Claude starten
```bash
# Rolle wählen
./scripts/switch-role.sh senior-developer

# Claude Code Session starten
claude
```

## 📋 Detaillierte Workflows

### Workflow 1: Full-Stack Feature Development

**Szenario**: Komplexes Feature mit Frontend, Backend, Tests und Deployment

```bash
# 1. Team-Setup mit Full-Stack Pattern
./scripts/start-sub-agent-team.sh 4 feat/85-booking-dashboard "full-stack" 85
cd ../booking-agent4

# 2. Parallele Entwicklung in mehreren Terminals

# Terminal 1: Senior Developer (Architektur & Backend)
./scripts/switch-role.sh senior-developer
claude
# -> Fokus: API-Design, Domain Models, Business Logic

# Terminal 2: UI Developer (Frontend)
./scripts/switch-role.sh ui-developer  
claude
# -> Fokus: React Components, Tailwind Styling, UX

# Terminal 3: Test Expert (Qualitätssicherung)
./scripts/switch-role.sh test-expert
claude
# -> Fokus: Unit Tests, Integration Tests, E2E Tests

# Terminal 4: DevOps Expert (Deployment)
./scripts/switch-role.sh devops-expert
claude  
# -> Fokus: CI/CD, Docker, Performance Monitoring
```

### Workflow 2: Frontend-Focused Development

**Szenario**: UI/UX-intensive Entwicklung

```bash
# 1. Frontend-Team Setup
./scripts/start-sub-agent-team.sh 3 feat/86-ui-redesign "frontend-focus" 86
cd ../booking-agent3

# 2. UI/UX Team Collaboration

# Terminal 1: UI Developer (Implementation)
./scripts/switch-role.sh ui-developer
claude

# Terminal 2: UX Expert (Design & Accessibility)
./scripts/switch-role.sh ux-expert
claude

# Terminal 3: Test Expert (Component Testing)
./scripts/switch-role.sh test-expert
claude
```

### Workflow 3: Performance Optimization

**Szenario**: System-Performance-Verbesserungen

```bash
# 1. Performance-Team Setup
./scripts/start-sub-agent-team.sh 2 feat/87-performance-boost "performance" 87
cd ../booking-agent2

# 2. Performance-Team Koordination

# Terminal 1: Senior Developer (Code-Optimierung)
./scripts/switch-role.sh senior-developer
claude

# Terminal 2: Architecture Expert (System-Design)
./scripts/switch-role.sh architecture-expert
claude

# Terminal 3: DevOps Expert (Infrastructure)
./scripts/switch-role.sh devops-expert
claude
```

## 🔧 Management Commands

### Rolle-Management
```bash
# Aktuelle Rolle und Team-Status anzeigen
./scripts/team-status.sh

# Rolle wechseln
./scripts/switch-role.sh senior-developer
./scripts/switch-role.sh ui-developer
./scripts/switch-role.sh test-expert

# Rolle-Informationen anzeigen
./scripts/switch-role.sh senior-developer --info

# Zurück zur Standard-Konfiguration
./scripts/switch-role.sh default
```

### Team-Koordination
```bash
# Team-Status anzeigen
./scripts/team-status.sh

# Verfügbare Rollen auflisten
ls config/sub-agents/CLAUDE-*.md

# Team-Koordinations-File anzeigen
cat .claude/team-coordination.md

# Aktuelle Rolle anzeigen
cat .claude/current-role.txt
```

## 🎭 Rollen-Details

### 🎯 Senior Developer Agent
**Fokus**: Architektur, Code-Quality, Technical Leadership

**Typische Aufgaben**:
- API-Design und Domain Modeling
- Performance-Optimierungen
- Code-Reviews für andere Team-Mitglieder
- Komplexe Business Logic Implementation
- Technical Debt Management

**Code-Beispiel**:
```csharp
// Senior Developer fokussiert auf Clean Architecture
public class BookingService(IBookingRepository repository, IEventDispatcher eventDispatcher)
{
    public async Task<BookingResult> CreateBookingAsync(CreateBookingCommand command)
    {
        // Domain-driven validation und business logic
    }
}
```

### 🎨 UI Developer Agent
**Fokus**: Frontend-Komponenten, User Interface, Styling

**Typische Aufgaben**:
- React/Next.js Komponenten-Entwicklung
- Tailwind CSS Styling und Design System
- Responsive Design Implementation
- Component Library Entwicklung
- Frontend Performance Optimization

**Code-Beispiel**:
```typescript
// UI Developer fokussiert auf Component Design
const BookingCard = memo(({ booking }: BookingCardProps) => (
  <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
    <BookingStatus status={booking.status} />
    <BookingDetails booking={booking} />
  </div>
));
```

### 🧪 Test Expert Agent
**Fokus**: Testing-Strategien, Qualitätssicherung, Automation

**Typische Aufgaben**:
- Unit Test Implementation (Jest, xUnit)
- Integration Testing Strategien
- E2E Testing mit Playwright
- Test Automation und CI/CD Integration
- Code Coverage Analysis

**Code-Beispiel**:
```typescript
// Test Expert fokussiert auf umfassende Test-Abdeckung
describe('BookingService', () => {
  it('should create booking with proper validation', async () => {
    const result = await bookingService.createBooking(validBookingData);
    expect(result.isSuccess).toBe(true);
    expect(result.booking).toMatchObject(expectedBooking);
  });
});
```

## 🤝 Team-Kollaboration Best Practices

### 1. Rolle-Klarheit
- **Fokussierte Expertise**: Jede Rolle konzentriert sich auf ihre Kernkompetenzen
- **Overlap-Management**: Klare Abgrenzung der Verantwortlichkeiten
- **Communication**: Regelmäßige Synchronisation über Git-Commits

### 2. Git-Workflow
```bash
# Jede Rolle erstellt eigene Feature-Branches
git checkout -b feat/85-booking-dashboard-backend    # Senior Developer
git checkout -b feat/85-booking-dashboard-frontend   # UI Developer  
git checkout -b feat/85-booking-dashboard-tests      # Test Expert

# Integration über Pull Requests
# Senior Developer reviewed andere Rollen
```

### 3. Code-Organisation
```
src/
├── backend/
│   ├── Features/Bookings/     # Senior Developer + Architecture Expert
│   └── Tests/                 # Test Expert
├── frontend/
│   ├── components/            # UI Developer
│   ├── pages/                 # UI Developer + UX Expert
│   └── __tests__/             # Test Expert
└── docker/                    # DevOps Expert
```

## 📊 Vordefinierte Team-Patterns

### "full-stack" Pattern
**Rollen**: senior-developer, ui-developer, test-expert, devops-expert
**Verwendung**: Komplexe Features mit Frontend, Backend, Testing und Deployment

### "frontend-focus" Pattern  
**Rollen**: ui-developer, ux-expert, test-expert
**Verwendung**: UI/UX-intensive Entwicklung mit Fokus auf User Experience

### "backend-focus" Pattern
**Rollen**: senior-developer, architecture-expert, test-expert
**Verwendung**: Backend-API-Entwicklung, Performance, System-Design

### "performance" Pattern
**Rollen**: senior-developer, architecture-expert, devops-expert
**Verwendung**: System-Optimierung, Performance-Tuning, Infrastructure

## 🔍 Troubleshooting

### Problem: Rolle wechselt nicht korrekt
```bash
# Lösung: Status prüfen und manuell korrigieren
./scripts/team-status.sh
rm .claude/current-role.txt
./scripts/switch-role.sh senior-developer
```

### Problem: CLAUDE.md überschrieben
```bash
# Lösung: Backup wiederherstellen
ls .claude/CLAUDE-backup-*.md
cp .claude/CLAUDE-backup-senior-developer.md CLAUDE.md
```

### Problem: Team-Koordination verloren
```bash
# Lösung: Team-Koordination neu erstellen
./scripts/start-sub-agent-team.sh 4 $(git branch --show-current) "senior-developer,ui-developer"
```

## 🎯 Success Stories

### Beispiel 1: Booking Dashboard Feature
```bash
# Team: Senior Developer + UI Developer + Test Expert
# Ergebnis: 3x schnellere Entwicklung durch Parallelisierung
# Quality: 95% Test Coverage durch dedizierten Test Expert
# Performance: Optimierte Queries durch Senior Developer Review
```

### Beispiel 2: Mobile-First Redesign
```bash
# Team: UI Developer + UX Expert + Test Expert  
# Ergebnis: 100% WCAG-kompatible Implementierung durch UX Expert
# Quality: Umfassende Component Tests durch Test Expert
# User Experience: Intuitive Navigation durch UX-Fokus
```

## 🚀 Next Steps

### Für Einsteiger
1. Starten Sie mit einem einfachen Team: `./scripts/start-sub-agent-team.sh 4 feat/test-feature "senior-developer"`
2. Wechseln Sie die Rolle: `./scripts/switch-role.sh senior-developer`
3. Experimentieren Sie mit verschiedenen Rollen

### Für Fortgeschrittene
1. Verwenden Sie vordefinierte Patterns für komplexe Features
2. Entwickeln Sie eigene Team-Patterns für wiederkehrende Workflows
3. Implementieren Sie Rolle-spezifische Git-Hooks und Automation

### Für Teams
1. Definieren Sie Rolle-Zuweisungen pro Issue-Type
2. Etablieren Sie Code-Review-Workflows zwischen Rollen
3. Messen Sie Entwicklungsgeschwindigkeit und Qualitäts-Metriken

---

**🎭 Mit Sub-Agents können Sie die Macht der Spezialisierung nutzen, während Sie in einem kohärenten Team arbeiten. Jede Rolle bringt ihre Expertise ein, und gemeinsam erstellen Sie hochwertige Software mit maximaler Effizienz.**