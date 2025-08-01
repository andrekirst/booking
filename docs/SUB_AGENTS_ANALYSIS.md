# Sub-Agents Analyse für Booking-Projekt

## Übersicht
Analyse und Auswahl von spezialisierten Sub-Agents aus dem Repository https://github.com/wshobson/agents für unser Booking-Projekt.

## Unser Tech-Stack
- **Backend**: .NET 9 Native AOT mit Entity Framework Core
- **Frontend**: Next.js mit TypeScript und Tailwind CSS
- **Datenbank**: PostgreSQL
- **Platform**: Raspberry Pi Zero 2 W
- **DevOps**: Docker, Docker Compose

## Priorität 1 - Direkt relevante Sub-Agents

### 1. backend-architect (sonnet)
**Original Beschreibung**: Design RESTful APIs, microservice boundaries, and database schemas. Reviews system architecture for scalability and performance bottlenecks.

**Projektanpassung für Booking-Projekt**:
- Fokus auf .NET 9 Native AOT Performance-Optimierung
- Entity Framework Core Query-Optimierung
- Event Sourcing Pattern für Booking-Historie
- Raspberry Pi Hardware-spezifische Architektur-Entscheidungen

### 2. frontend-developer (sonnet)
**Original Beschreibung**: Build React components, implement responsive layouts, and handle client-side state management.

**Projektanpassung für Booking-Projekt**:
- Next.js 15 App Router Best Practices
- TypeScript strict mode Implementierung
- Tailwind CSS für Responsive Booking-UI
- Client-Server State Synchronisation
- Mobile-first Design für Touch-Geräte

### 3. sql-pro (sonnet)
**Original Beschreibung**: Write complex SQL queries, optimize execution plans, and design normalized schemas.

**Projektanpassung für Booking-Projekt**:
- PostgreSQL-spezifische Optimierungen
- Entity Framework Core LINQ zu SQL Translation
- Booking-spezifische Query-Patterns (Verfügbarkeitsabfragen)
- Index-Strategien für Datums- und Zeitraumabfragen
- Event Store Schema-Design

### 4. security-auditor (opus)
**Original Beschreibung**: Review code for vulnerabilities, implement secure authentication, and ensure OWASP compliance.

**Projektanpassung für Booking-Projekt**:
- JWT Token Security für Familien-Authentifizierung
- Google OAuth Integration Security
- GDPR-Compliance für Familiendaten
- Raspberry Pi spezifische Security Hardening
- Admin-Approval-Workflow Security

### 5. deployment-engineer (sonnet) 
**Original Beschreibung**: Configure CI/CD pipelines, Docker containers, and cloud deployments.

**Projektanpassung für Booking-Projekt**:
- Multi-Agent Docker Compose Setup
- Raspberry Pi ARM64 Container Optimierung
- GitHub Actions für .NET Native AOT
- Zero-Downtime Deployment für Familien-Verfügbarkeit
- Container Health Checks und Auto-Recovery

## Priorität 2 - Nützlich für Entwicklung

### 6. performance-engineer (opus)
**Projektanpassung**:
- .NET Native AOT Startup-Zeit Optimierung
- Raspberry Pi Memory Management
- Frontend Bundle-Size Optimierung
- PostgreSQL Query Performance
- Cache-Strategien für begrenzte Hardware

### 7. test-automator (sonnet)
**Projektanpassung**:
- xUnit Test-Setup für .NET Backend
- Jest/Playwright für Next.js Frontend
- Integration Tests mit Testcontainers
- Multi-Agent Test-Isolation
- GitHub Actions Test-Pipeline

### 8. code-reviewer (sonnet)
**Projektanpassung**:
- C# 12 Conventions Enforcement
- Next.js/TypeScript Best Practices
- Performance Reviews für Raspberry Pi
- Security Code Reviews
- Architectural Decision Records

### 9. devops-troubleshooter (sonnet)
**Projektanpassung**:
- Docker Container Debugging
- Raspberry Pi System Monitoring
- PostgreSQL Performance Issues
- Multi-Agent Coordination Problems
- GitHub Actions Pipeline Failures

### 10. api-documenter (haiku)
**Projektanpassung**:
- OpenAPI Specs für .NET Minimal APIs
- TypeScript Client Generation
- Multi-Agent API Versioning
- Booking-Domain spezifische Examples
- Developer Onboarding Dokumentation

## Agent-Koordination Matrix

| Agent | Primäre Tasks | Sekundäre Tasks | Koordiniert mit |
|-------|---------------|-----------------|-----------------|
| backend-architect | API Design, Architektur | Performance Review | frontend-developer, sql-pro |
| frontend-developer | UI Components, State | API Integration | backend-architect, test-automator |
| sql-pro | Query Optimization, Schema | Performance Tuning | backend-architect, performance-engineer |
| security-auditor | Security Reviews, Auth | Compliance Checks | code-reviewer, deployment-engineer |
| deployment-engineer | CI/CD, Docker | Monitoring Setup | devops-troubleshooter, performance-engineer |

## Multi-Agent Workflow Integration

### Feature Development Workflow
1. **backend-architect**: API Design und Architektur
2. **frontend-developer**: UI Komponenten und Integration  
3. **sql-pro**: Database Schema und Queries
4. **test-automator**: Test-Suite Erstellung
5. **security-auditor**: Security Review
6. **code-reviewer**: Code Quality Review
7. **deployment-engineer**: Deployment Setup

### Bug-Fix Workflow
1. **devops-troubleshooter**: Problem-Analyse
2. **performance-engineer**: Performance-Analyse (falls relevant)
3. **code-reviewer**: Fix-Review
4. **test-automator**: Test-Coverage
5. **deployment-engineer**: Deployment Validation

## Implementierungsplan

### Phase 1: Core Development Agents
- backend-architect
- frontend-developer
- sql-pro
- code-reviewer

### Phase 2: Quality & Security
- security-auditor
- test-automator
- performance-engineer

### Phase 3: Operations
- deployment-engineer
- devops-troubleshooter
- api-documenter

## Agent-spezifische Anpassungen erforderlich

### Alle Agents
- Deutsche Sprache für Kommunikation
- Booking-Domain Kontext
- Raspberry Pi Hardware-Bewusstsein
- Multi-Agent Koordination

### Backend-specific
- .NET 9 Native AOT Constraints
- Entity Framework Core Patterns
- Event Sourcing Implementation

### Frontend-specific  
- Next.js App Router Migration
- TypeScript Strict Mode
- Tailwind v4 Features

### Database-specific
- PostgreSQL 16+ Features
- Event Store Schema
- Performance für ARM64

## Erwartete Verbesserungen

### Entwicklungsgeschwindigkeit
- **25-40%** durch spezialisierte Agents
- **Parallelisierung** von Frontend/Backend Development
- **Automatisierte Reviews** reduzieren Iteration-Zyklen

### Code-Qualität  
- **Konsistente Architektur** durch backend-architect
- **Security by Design** durch security-auditor
- **Performance-Optimiert** durch performance-engineer

### Wartbarkeit
- **Umfassende Tests** durch test-automator
- **Dokumentierte APIs** durch api-documenter
- **Saubere Deployments** durch deployment-engineer