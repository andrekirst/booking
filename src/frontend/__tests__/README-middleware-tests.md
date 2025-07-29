# Middleware Route Protection Tests

## Übersicht

Diese Datei enthält umfassende Unit-Tests für die Next.js Middleware Route Protection (`middleware.ts`).

## Test-Abdeckung

### 🔒 Geschützte Routes ohne Authentifizierung (6 Tests)
- Redirect zu `/login?redirect=ORIGINAL_PATH` für:
  - `/bookings` → `/login?redirect=/bookings`
  - `/admin` → `/login?redirect=/admin`  
  - `/profile` → `/login?redirect=/profile`
  - Verschachtelte Routes (`/bookings/123`, `/admin/users`)
  - Nur Pathname wird für Redirect verwendet (Query-Parameter werden nicht beibehalten)

### ✅ Geschützte Routes mit Authentifizierung (5 Tests)
- Zugriff erlaubt mit gültigem Token aus:
  - Cookie (`auth_token`)
  - Authorization Header (`Bearer token`)
- Cookie-Token hat Vorrang vor Authorization Header
- Verschachtelte Routes werden korrekt behandelt

### 🌐 Öffentliche Routes (6 Tests)
- Immer zugänglich ohne Token:
  - `/` (Homepage)
  - `/login`
  - `/register`
  - `/verify-email`
  - `/api-test`
- Query-Parameter werden bei öffentlichen Routes beibehalten

### 🔄 Bereits authentifizierte Benutzer (4 Tests)
- Redirect von `/login` und `/register` zu `/bookings` bei vorhandenem Token
- Authorization Header und Cookie werden beide unterstützt
- `/verify-email` wird auch mit Token durchgelassen

### ⚠️ Edge Cases (9 Tests)
- Leere Tokens werden als unauthentifiziert behandelt
- `null` und `undefined` Token-Werte
- Authorization Header ohne "Bearer " Prefix
- Case-Sensitivity bei Route-Matching
- Mehrfache Slashes in URLs
- Ähnliche Route-Namen (z.B. `/booking-helper` vs `/bookings`)

### 🔧 Token-Extraktion (4 Tests)
- Cookie-Token Extraktion
- Authorization Header Extraktion
- Prioritätslogik zwischen Cookie und Header
- Fallback-Mechanismen

### 🌍 URL-Konstruktion (3 Tests)
- Korrekte Login-URL mit Redirect-Parameter
- Korrekte Bookings-URL für authentifizierte Redirects
- Base-URL wird aus Request übernommen

### 📍 Route-Matching-Logik (2 Tests)
- `startsWith()` für geschützte Routes
- Exakte Übereinstimmung für öffentliche Routes

## Test-Ausführung

### Middleware-Tests separat ausführen
```bash
npm run test:middleware
```

### Mit NPX (falls npm-Script nicht verfügbar)
```bash
npx jest --config=jest.config.middleware.js
```

### Mit Verbose-Output
```bash
npx jest --config=jest.config.middleware.js --verbose
```

## Konfiguration

Die Tests verwenden eine separate Jest-Konfiguration (`jest.config.middleware.js`) um:
- Node.js Test-Environment zu verwenden (für Next.js Server-Components)
- Setup-Dateien zu vermeiden die Konflikte verursachen können
- Nur Middleware-Tests auszuführen

## Mock-Strategie

- **NextRequest**: Mockt URL, Headers und Cookies
- **NextResponse**: Mockt `next()` und `redirect()` Methoden
- **Helper-Funktionen**: 
  - `createMockRequest()` - Erstellt Mock-Request mit optionalen Headers/Cookies
  - `getRedirectUrl()` - Extrahiert URL aus Redirect-Mock-Aufruf

## Teststatistiken

- **Gesamt**: 39 Tests
- **Test-Suites**: 8 Kategorien
- **Durchschnittliche Laufzeit**: ~0.6 Sekunden
- **Code-Coverage**: 100% der Middleware-Funktionalität

## Bekannte Limitierungen

1. **Query-Parameter**: Middleware verwendet nur `pathname` für Redirects, nicht die komplette URL
2. **Token-Validierung**: Tests prüfen nur Token-Existenz, nicht Token-Gültigkeit
3. **Route-Priorität**: Geschützte Routes haben Vorrang vor öffentlichen Routes bei Überlappungen

## Wartung

Bei Änderungen an der Middleware müssen entsprechende Tests angepasst werden:
- Neue geschützte Routes in `protectedRoutes` Array
- Neue öffentliche Routes in `publicRoutes` Array  
- Änderungen an Token-Extraktion-Logik
- Neue Redirect-Regeln