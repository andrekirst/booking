# End-to-End Tests für Authentication Flows

Diese Verzeichnis enthält umfassende End-to-End Tests für das Authentication-System der Booking-Plattform mit Playwright.

## 📁 Struktur

```
e2e/
├── auth-flows.spec.ts          # Haupttest-Datei für Authentication Flows
├── login.spec.ts               # Legacy Login Tests (aktualisiert)
├── auth.setup.ts               # Setup für Authentication State
├── fixtures/
│   └── auth.ts                 # Authentication Fixtures & Mocks
├── pages/                      # Page Object Models
│   ├── LoginPage.ts            # Login Page Object Model
│   ├── BookingsPage.ts         # Bookings Page Object Model
│   └── AdminPage.ts            # Admin Page Object Model
└── docs/
    └── README.md               # Diese Dokumentation
```

## 🚀 Tests ausführen

### Alle E2E Tests
```bash
npm run test:e2e
```

### Nur Authentication Tests
```bash
npx playwright test auth-flows
```

### Tests mit UI (visuell)
```bash
npm run test:e2e:ui
```

### Tests debuggen
```bash
npm run test:e2e:debug
```

## 🧪 Test-Szenarien

### 1. Unauthentifizierter Zugriff
- Redirect zu Login bei geschützten Routes (`/bookings`, `/admin`, `/profile`)
- Korrekte Redirect-Parameter werden gesetzt
- Öffentliche Routes bleiben zugänglich (`/`, `/login`, `/register`)

### 2. Login mit Redirect
- Nach erfolgreichem Login → Weiterleitung zur ursprünglichen Route
- Komplexe URLs mit Query-Parametern werden erhalten
- Fehlerbehandlung bei fehlgeschlagenen Logins

### 3. Bereits authentifizierte Benutzer
- Redirect von `/login` und `/register` zu `/bookings`
- Schutz vor redundanten Login-Versuchen

### 4. Session Persistence
- Token-Persistierung nach Page-Reload
- localStorage und Cookie-basierte Authentication
- Korrekte Logout-Implementierung

### 5. Admin-Bereiche
- Admin-User haben Zugriff auf `/admin`
- Regular User werden abgewehrt
- Role-based Access Control

### 6. Edge Cases & Error Handling
- Malformed Redirect-Parameter
- API-Fehler und Timeouts
- Concurrent Authentication-Versuche
- Cross-Browser Kompatibilität

## 🛠 Page Object Models

### LoginPage
```typescript
const loginPage = new LoginPage(page);
await loginPage.login('user@example.com', 'password');
await loginPage.expectSuccessfulLogin();
```

### BookingsPage  
```typescript
const bookingsPage = new BookingsPage(page);
await bookingsPage.goto();
await bookingsPage.logout();
```

### AdminPage
```typescript
const adminPage = new AdminPage(page);
const hasAccess = await adminPage.hasAdminAccess();
```

## 🎭 Authentication Fixtures

Die `AuthFixtures` Klasse bietet Mock-Funktionalität für Tests ohne laufendes Backend:

### Authentication State setzen
```typescript
const authFixtures = new AuthFixtures(page, context);

// Authentifizierten User setzen
await authFixtures.setAuthenticatedUser('user@family.com', 'Member');

// Admin User setzen  
await authFixtures.setAuthenticatedUser('admin@booking.com', 'Administrator');

// Auth State löschen
await authFixtures.clearAuthState();
```

### API Responses mocken
```typescript
// Erfolgreichen Login mocken
await authFixtures.mockLoginSuccess();

// Login-Fehler mocken  
await authFixtures.mockLoginFailure('Invalid credentials');

// Server-Fehler mocken
await authFixtures.mockServerError(500);

// Network Timeout mocken
await authFixtures.mockNetworkTimeout();
```

---

**💡 Tipp**: Nutze `npm run test:e2e:ui` für interaktive Test-Entwicklung und Debugging!