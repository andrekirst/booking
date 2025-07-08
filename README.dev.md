# Entwickler-Setup für Booking System

## Voraussetzungen

- Docker und Docker Compose
- .NET 9 SDK (für lokale Entwicklung)
- Node.js 20+ (für lokale Frontend-Entwicklung)
- Visual Studio, Rider oder VS Code

## Entwicklungsoptionen

### Option 1: Nur PostgreSQL mit Docker (Empfohlen für IDE-Entwicklung)

1. **PostgreSQL starten:**
   ```bash
   docker-compose up -d
   ```

2. **Backend in IDE starten:**
   - Profile auswählen: "Development" oder "Docker-PostgreSQL"
   - F5 oder "Start Debugging"

3. **Frontend separat starten:**
   ```bash
   cd src/frontend
   npm install && npm run dev
   ```

### Option 2: Vollständige Docker-Entwicklung

1. **Alle Services starten:**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Services einzeln starten:**
   ```bash
   # Nur Datenbank
   docker-compose up postgres -d
   
   # Backend und Datenbank
   docker-compose -f docker-compose.dev.yml up postgres backend -d
   ```

3. **Services stoppen:**
   ```bash
   docker-compose -f docker-compose.dev.yml down
   # oder für nur PostgreSQL:
   docker-compose down
   ```

## Lokale Entwicklung (ohne Docker)

### Backend (.NET API)

1. **PostgreSQL starten:**
   ```bash
   docker-compose -f docker-compose.dev.yml up postgres -d
   ```

2. **Backend starten:**
   ```bash
   cd src/backend
   dotnet restore
   dotnet run --project Booking.Api
   ```

3. **API ist verfügbar unter:**
   - HTTP: http://localhost:5000
   - Swagger UI: http://localhost:5000/swagger

### Frontend (Next.js)

1. **Dependencies installieren:**
   ```bash
   cd src/frontend
   npm install
   ```

2. **Development Server starten:**
   ```bash
   npm run dev
   ```

3. **Frontend ist verfügbar unter:**
   - http://localhost:3000

## Test-Benutzer

Die Anwendung wird automatisch mit folgenden Test-Benutzern befüllt:

| E-Mail | Passwort | Rolle |
|--------|----------|-------|
| admin@booking.com | admin123 | Administrator |
| member@booking.com | member123 | Member |
| test@example.com | test123 | Member |

## IDE-Konfiguration

### Visual Studio / Rider

1. **Solution öffnen:**
   - `src/backend/BookingSystem.sln`

2. **Startup Project:**
   - `Booking.Api` als Startup Project setzen

3. **Environment Variables:**
   - Bereits in `appsettings.Development.json` konfiguriert

### VS Code

1. **Workspace öffnen:**
   - Root-Verzeichnis des Projekts öffnen

2. **Extensions installieren:**
   - C# Dev Kit
   - Docker
   - Thunder Client (für API-Tests)

## Debugging

### Backend Debugging

1. **In IDE:**
   - Breakpoints setzen
   - F5 oder "Start Debugging"

2. **Mit Docker:**
   ```bash
   # Backend container mit Debug-Support
   docker-compose -f docker-compose.dev.yml up postgres -d
   # Dann Backend lokal in IDE starten
   ```

### Frontend Debugging

1. **Browser DevTools:**
   - Chrome/Edge: F12
   - Network Tab für API-Calls

2. **VS Code:**
   - JavaScript Debugger Extension
   - Launch.json für Next.js konfigurieren

## Datenbank

### Migrations

```bash
cd src/backend
dotnet ef migrations add MigrationName --project Booking.Api
dotnet ef database update --project Booking.Api
```

### Datenbank zurücksetzen

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up postgres -d
```

## API Testing

### Mit Swagger UI
- http://localhost:5000/swagger

### Mit curl
```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "test123"}'
```

### Mit HTTP Files
- `src/backend/Booking.Api/Booking.Api.http`

## Troubleshooting

### Port bereits in Verwendung
```bash
# Ports prüfen
netstat -tulpn | grep :5000
netstat -tulpn | grep :3000

# Docker Container stoppen
docker-compose -f docker-compose.dev.yml down
```

### Datenbank-Verbindungsfehler
```bash
# Container-Logs prüfen
docker-compose -f docker-compose.dev.yml logs postgres

# Container-Status prüfen
docker-compose -f docker-compose.dev.yml ps
```

### Frontend Build-Fehler
```bash
cd src/frontend
rm -rf node_modules .next
npm install
npm run dev
```

## Hot Reload

- **Backend:** Automatisch mit `dotnet run`
- **Frontend:** Automatisch mit `npm run dev`
- **Docker:** Volume-Mounts für Live-Updates konfiguriert