# API Client Abstraktion

Diese Bibliothek stellt eine abstraktions-layer für die API-Kommunikation bereit, die Tests vereinfacht und die Wartbarkeit erhöht.

## Struktur

```
lib/
├── api/
│   ├── client.ts          # HTTP API Client (echte API-Calls)
│   ├── mock-client.ts     # Mock API Client (für Tests)
│   └── factory.ts         # Factory für verschiedene Umgebungen
├── types/
│   └── api.ts            # TypeScript-Typen für API
└── config/
    └── api.ts            # Konfiguration für verschiedene Umgebungen
```

## Verwendung

### Grundlegende Nutzung

```typescript
import { getApiClient } from '@/lib/api/factory';

const apiClient = getApiClient();

// Login
const response = await apiClient.login({
  email: 'user@example.com',
  password: 'password123'
});

// Buchungen abrufen
const bookings = await apiClient.getBookings();
```

### Verschiedene Umgebungen

```typescript
import { getApiClient } from '@/lib/api/factory';

// Explizite Umgebung
const mockClient = getApiClient('mock');      // Mock-Daten
const testClient = getApiClient('test');      // Test-Umgebung
const prodClient = getApiClient('production'); // Produktion

// Automatische Erkennung basierend auf NODE_ENV
const autoClient = getApiClient(); // Wählt automatisch
```

### In Tests

```typescript
import { test, expect } from '@/e2e/helpers/api';

test('should authenticate user', async ({ apiClient }) => {
  const response = await apiClient.login({
    email: 'admin@booking.com',
    password: 'admin123'
  });
  
  expect(response.token).toBeTruthy();
});
```

## Umgebungsvariablen

- `NEXT_PUBLIC_API_ENVIRONMENT`: Explizite API-Umgebung (`mock`, `test`, `development`, `production`)
- `NEXT_PUBLIC_API_URL`: Base URL für die API
- `NODE_ENV`: Wird für automatische Umgebungserkennung verwendet
- `PLAYWRIGHT_TEST`: Aktiviert Test-Modus

## Vorteile

1. **Testbarkeit**: Mock-API für E2E-Tests ohne Backend
2. **Typsicherheit**: Vollständige TypeScript-Unterstützung
3. **Flexibilität**: Einfacher Wechsel zwischen Umgebungen
4. **Wartbarkeit**: Zentrale Stelle für API-Logik
5. **Fehlerbehandlung**: Einheitliche Error-Handling-Strategie

## NPM Scripts

```bash
# Nur API-Tests ausführen
npm run test:api

# API-Tests im UI-Modus
npm run test:api:ui

# Smoke-Tests mit Mock-API
npm run test:smoke
```

## Erweiterung

Neue API-Endpoints hinzufügen:

1. Type in `types/api.ts` definieren
2. Method in `ApiClient` Interface hinzufügen
3. Implementation in `HttpApiClient` und `MockApiClient`
4. Tests in `e2e/api.spec.ts` hinzufügen