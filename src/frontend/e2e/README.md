# E2E Tests mit Playwright

Diese End-to-End-Tests testen die komplette Anwendung vom Frontend bis zur Datenbank.

## Voraussetzungen

- Node.js installiert
- .NET SDK installiert
- PostgreSQL läuft (oder Docker)
- Playwright Browser installiert: `npx playwright install`

## Tests ausführen

```bash
# Alle E2E-Tests ausführen
npm run test:e2e

# Tests im UI-Modus (interaktiv)
npm run test:e2e:ui

# Tests debuggen
npm run test:e2e:debug

# Test-Code generieren (Record & Playback)
npm run test:e2e:codegen
```

## Test-Struktur

- `smoke.spec.ts` - Grundlegende Tests ob Anwendung läuft
- `login.spec.ts` - Login-Flow Tests
- `bookings.spec.ts` - Buchungs-Funktionalität Tests
- `auth.setup.ts` - Authentifizierungs-Setup für Tests

## Konfiguration

Die Playwright-Konfiguration in `playwright.config.ts`:
- Startet automatisch Frontend (Port 3000) und Backend (Port 5000)
- Testet gegen Chrome, Firefox, Safari und mobile Browser
- Speichert Screenshots bei Fehlern
- Erstellt Traces für Debugging

## Umgebungsvariablen

- `PLAYWRIGHT_BASE_URL` - Frontend URL (default: http://localhost:3000)
- `CI` - Aktiviert CI-spezifische Einstellungen

## Tipps

1. **Lokale Entwicklung**: Tests laufen gegen lokale Dev-Server
2. **CI/CD**: In der Pipeline werden Frontend und Backend automatisch gestartet
3. **Debugging**: Nutze `--debug` Flag oder Playwright Inspector
4. **Neue Tests**: Nutze `test:e2e:codegen` um Tests aufzuzeichnen