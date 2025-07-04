# Strukturkonzept für die neue CLAUDE.md

## 1. Einleitung/Ziel
- **Projektübersicht**: Kurze Beschreibung des Booking-Projekts
- **Zweck dieser Datei**: Zentrale Referenz für Claude AI Assistant
- **Zielgruppe**: Entwickler, die mit Claude arbeiten
- **Versionierung**: Aktueller Stand und Änderungshistorie

## 2. Rollen und Verantwortlichkeiten
- **Claude als AI Assistant**: Aufgaben und Grenzen
- **Entwicklerrolle**: Erwartungen an menschliche Entwickler
- **Code-Review**: Zuständigkeiten und Prozesse
- **Entscheidungsfindung**: Wann Claude autonom handelt vs. Rückfragen

## 3. Fachliche Anforderungen
- **Projektziele**: Hauptziele des Booking-Systems
- **Funktionale Anforderungen**: Kernfunktionen und Features
- **Business Logic**: Geschäftsregeln und Constraints
- **Benutzeranforderungen**: UX/UI-Richtlinien
- **Referenz auf requirements.md**: Zentrale Quelle für Details

## 4. Technische Anforderungen
- **Systemarchitektur**: Überblick über die Technologie-Stack
- **Backend-Technologien**: .NET, APIs, Datenbank
- **Frontend-Technologien**: HTML, JavaScript, TypeScript
- **Datenbank**: PostgreSQL, Schema-Design
- **Infrastruktur**: Hosting, CI/CD, Deployment
- **Performance-Anforderungen**: Metriken und Benchmarks

## 5. Arbeitsrichtlinien für Claude
### 5.1 Code-Entwicklung
- **Programmierstandards**: Coding-Konventionen und Best Practices
- **Architektur-Patterns**: MVC, Repository Pattern, etc.
- **Code-Qualität**: Wartbarkeit, Lesbarkeit, Effizienz
- **Refactoring**: Wann und wie Code verbessert wird

### 5.2 Test-Strategie
- **Unit Tests**: Abdeckung und Frameworks
- **Integration Tests**: API und Datenbank-Tests
- **End-to-End Tests**: Benutzer-Journey-Tests
- **Test-Driven Development**: Approach und Implementierung

### 5.3 Dokumentation
- **Code-Dokumentation**: Inline-Kommentare und XML-Docs
- **API-Dokumentation**: Swagger/OpenAPI
- **README-Pflege**: Aktuelle Installationsanweisungen
- **Architektur-Dokumentation**: Diagramme und Beschreibungen

### 5.4 Versionskontrolle
- **Git-Workflow**: Branch-Strategie und Merge-Prozess
- **Commit-Standards**: Conventional Commits
- **Pull Request Process**: Review-Richtlinien
- **Branch-Management**: Naming und Lifecycle

## 6. Sicherheit
- **Secure Coding Practices**: Input-Validierung, SQL-Injection-Schutz
- **Authentication/Authorization**: Benutzerauthentifizierung
- **Data Protection**: Datenschutz und GDPR-Compliance
- **Dependency Management**: Sicherheitsupdates und Vulnerabilities
- **Secret Management**: API-Keys und Credentials

## 7. Umsetzungshinweise
### 7.1 Entwicklungsprozess
- **Issue-Management**: Erstellung und Priorisierung
- **Task-Planung**: Aufgliederung in Teilschritte
- **Iterative Entwicklung**: Scrum/Agile Prinzipien
- **Continuous Integration**: Automated Testing und Deployment

### 7.2 Tools und Automation
- **GitHub CLI**: Verwendung für Repository-Management
- **Label-System**: Kategorisierung und Organisation
- **GitHub Actions**: CI/CD-Pipeline
- **Code-Analyse**: Linting und Code-Quality-Tools

### 7.3 Collaboration
- **Code-Review-Prozess**: Peer-Review-Standards
- **Kommunikation**: Issue-Diskussionen und Dokumentation
- **Knowledge Sharing**: Dokumentation von Entscheidungen
- **Onboarding**: Einarbeitung neuer Entwickler

## 8. Anhänge
- **Referenzen**: Links zu wichtigen Dokumenten
- **Glossar**: Fachbegriffe und Definitionen
- **Troubleshooting**: Häufige Probleme und Lösungen
- **Changelog**: Änderungen an dieser Datei

## 9. Metadaten
- **Letzte Aktualisierung**: Datum und Autor
- **Nächste Review**: Geplante Überprüfung
- **Verantwortliche**: Maintainer der Datei
- **Feedback**: Verbesserungsvorschläge und Kontakt

---

## Implementierungsnotizen für die Umsetzung:

### Priorität 1 (Kritisch):
- Abschnitte 1-3: Grundlegende Struktur und Ziele
- Abschnitt 5.1-5.4: Kernarbeitsrichtlinien
- Abschnitt 6: Sicherheitsaspekte

### Priorität 2 (Wichtig):
- Abschnitt 4: Technische Details
- Abschnitt 7.1-7.2: Prozesse und Tools
- Abschnitt 8: Referenzen und Dokumentation

### Priorität 3 (Wünschenswert):
- Abschnitt 2: Detaillierte Rollen
- Abschnitt 7.3: Collaboration-Aspekte
- Abschnitt 9: Metadaten und Maintenance

### Besondere Überlegungen:
- **Modularität**: Jeder Abschnitt soll eigenständig verständlich sein
- **Verlinkung**: Querverweise zwischen Abschnitten
- **Praktische Beispiele**: Konkrete Code-Beispiele und Workflows
- **Aktualisierbarkeit**: Struktur soll einfach erweiterbar sein
- **Konsistenz**: Einheitliche Formatierung und Terminologie
