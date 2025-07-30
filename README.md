# Booking System

Ein modernes Buchungssystem für Unterkünfte mit .NET 9 Backend und Next.js Frontend.

## 🚀 Quick Start für Entwickler

### 1. Repository klonen und Setup
```bash
git clone https://github.com/andrekirst/booking-agent2.git
cd booking-agent2
```

### 2. Datenbank Setup
```bash
# PostgreSQL installieren und starten
# Datenbank und Benutzer erstellen:
createdb booking_dev
createuser booking_user
```

### 3. Backend starten
```bash
cd src/backend/Booking.Api
dotnet restore
dotnet ef database update
dotnet run
```

Das Backend läuft dann auf `https://localhost:7190` mit automatischer Test-Daten-Befüllung.

### 4. Frontend starten
```bash
cd src/frontend
npm install
npm run dev
```

Das Frontend läuft dann auf `http://localhost:3000`.

## 🔑 Test-Anmeldedaten

Nach dem ersten Start werden automatisch Test-Daten angelegt. Sie können sich sofort mit folgenden Konten anmelden:

### Administrator Account
| **Email** | **Passwort** | **Beschreibung** |
|-----------|-------------|------------------|
| `admin@booking.com` | `admin123` | Vollzugriff, kann alle Buchungen verwalten |

### Test-Benutzer (Alle mit Passwort: `member123`)

#### ✅ Aktive Benutzer (können buchen)
| **Email** | **Name** | **Status** | **Beschreibung** |
|-----------|----------|------------|------------------|
| `maria.mueller@familie-mueller.de` | Maria Müller | Aktiv & Genehmigt | Langjähriges Familienmitglied |
| `thomas.schmidt@gmail.com` | Thomas Schmidt | Aktiv & Genehmigt | Kürzlich genehmigter Benutzer |
| `anna.weber@web.de` | Anna Weber | Aktiv & Genehmigt | Etabliertes Mitglied |
| `julia.klein@student.de` | Julia Klein | Aktiv & Genehmigt | Jüngeres Familienmitglied |

#### ⏰ Wartende Benutzer (Email verifiziert, warten auf Admin-Genehmigung)
| **Email** | **Name** | **Status** | **Beschreibung** |
|-----------|----------|------------|------------------|
| `lisa.hoffmann@hotmail.de` | Lisa Hoffmann | Wartet auf Genehmigung | Kürzlich registriert |
| `michael.bauer@t-online.de` | Michael Bauer | Wartet auf Genehmigung | Längere Zeit wartend |
| `robert.fischer@gmx.de` | Robert Fischer | Wartet auf Genehmigung | Email verifiziert |

#### 📧 Unverifizierte Benutzer (müssen Email bestätigen)
| **Email** | **Name** | **Status** | **Beschreibung** |
|-----------|----------|------------|------------------|
| `sarah.koch@gmail.com` | Sarah Koch | Email nicht verifiziert | Kürzlich registriert |
| `peter.zimmermann@yahoo.de` | Peter Zimmermann | Token abgelaufen | Muss Email neu bestätigen |

#### 🚫 Gesperrte Benutzer (für Edge-Case Tests)
| **Email** | **Name** | **Status** | **Beschreibung** |
|-----------|----------|------------|------------------|
| `blocked.user@example.de` | Gesperrt Benutzer | Deaktiviert | Für Sperrfälle-Tests |

## 🏠 Verfügbare Test-Unterkünfte

Das System wird mit folgenden Unterkünften befüllt:

| **Name** | **Typ** | **Kapazität** | **Beschreibung** |
|----------|---------|---------------|------------------|
| Hauptschlafzimmer | Zimmer | 2 Personen | Primäres Schlafzimmer für Paare |
| Gästezimmer | Zimmer | 1 Person | Einzelzimmer für Gäste |
| Kinderzimmer | Zimmer | 2 Personen | Zimmer mit Stockbetten |
| Wohnzimmer Schlafsofa | Zimmer | 1 Person | Flexibles Schlafsofa |
| Garten Zeltplatz | Zelt | 4 Personen | Camping-Bereich im Garten |

## 📅 Test-Buchungen

Das System erstellt automatisch realistische Buchungsszenarien:

- **Vergangene Buchungen**: Abgeschlossene und stornierte Buchungen
- **Aktuelle Buchungen**: Laufende und kürzlich bestätigte Buchungen
- **Ausstehende Buchungen**: Wartende Genehmigungen und Konflikte
- **Zukünftige Buchungen**: Geplante Aufenthalte und Langzeitbuchungen

## ⚙️ Seeding-Konfiguration

### Umgebungs-spezifisches Verhalten

- **Development**: Vollständige Test-Daten (Benutzer, Unterkünfte, Buchungen)
- **Production**: Nur Administrator-Account (sichere Standardeinstellung)

### Konfiguration anpassen

In `appsettings.json` oder über Umgebungsvariablen:

```json
{
  "SeedingSettings": {
    "EnableSeeding": true,              // Master-Schalter
    "EnableBasicSeeding": true,         // Admin-Benutzer (immer empfohlen)
    "EnableComprehensiveSeeding": true, // Test-Daten (nur Development)
    "ForceComprehensiveSeeding": false, // Test-Daten in Production erzwingen (VORSICHT!)
    "EnableSeedingLogs": true          // Detaillierte Logs
  }
}
```

### Umgebungsvariablen

```bash
# Alle Seeding deaktivieren
export SEEDING__ENABLESEEDING=false

# Nur Admin-User, keine Test-Daten
export SEEDING__ENABLECOMPREHENSIVESEEDING=false

# Test-Daten auch in Production (NICHT EMPFOHLEN!)
export SEEDING__FORCECOMPREHENSIVESEEDING=true
```

## 🗄️ Datenbank zurücksetzen

```bash
cd src/backend/Booking.Api

# Option 1: Migrations zurücksetzen
dotnet ef database drop
dotnet ef database update

# Option 2: Nur Daten löschen (behält Schema)
dotnet ef database update 0  # Alle Migrations rückgängig
dotnet ef database update    # Neustart mit frischen Daten
```

## 📁 Projektstruktur

```
booking-agent2/
├── src/
│   ├── backend/             # .NET 9 Backend API
│   │   └── Booking.Api/     # Haupt-API Projekt
│   │       ├── Data/        # Datenbank Context & Seeding
│   │       ├── Domain/      # Entities & Business Logic
│   │       ├── Controllers/ # API Endpoints
│   │       └── Configuration/ # App-Konfiguration
│   └── frontend/            # Next.js 15 Frontend
│       ├── app/             # App Router (Next.js 15)
│       ├── components/      # React Komponenten
│       └── contexts/        # React Contexts
├── README.md               # Diese Datei
└── CLAUDE.md              # Entwickler-Instruktionen
```

## 🛠️ Technologie-Stack

### Backend
- **.NET 9** mit Native AOT für optimale Performance
- **Entity Framework Core** für Datenbank-Zugriff
- **PostgreSQL** als Hauptdatenbank
- **JWT Authentication** für sichere Anmeldung
- **AutoMapper** für Objekt-Mapping

### Frontend
- **Next.js 15** mit App Router
- **React 18** mit Server/Client Components
- **TypeScript** für Type-Safety
- **Tailwind CSS** für Styling
- **React Hook Form** für Formulare

### Development
- **Hot Reload** für Backend und Frontend
- **Entity Framework Migrations** für Datenbankschema
- **Automatische Test-Daten** für lokale Entwicklung
- **Swagger/OpenAPI** Dokumentation

## 🔧 Entwicklung

### API-Dokumentation
Die Swagger-Dokumentation ist verfügbar unter:
- Development: `https://localhost:7190/swagger`

### Datenbank-Migrations
```bash
# Neue Migration erstellen
dotnet ef migrations add MigrationName

# Datenbank aktualisieren
dotnet ef database update

# Migration-History anzeigen
dotnet ef migrations list
```

### Test-Daten anpassen

Die Seeding-Logik finden Sie in:
- `/src/backend/Booking.Api/Data/DbSeeder.cs`
- Benutzer-Definitionen ab Zeile 282
- Unterkunft-Definitionen ab Zeile 560  
- Buchungs-Szenarien ab Zeile 813

## 🚨 Wichtige Sicherheitshinweise

1. **Produktions-Deployment**: `ForceComprehensiveSeeding` NIEMALS in Production aktivieren
2. **Passwörter**: Standard-Passwörter vor Production ändern
3. **JWT Secret**: Sicheren JWT-Secret in `appsettings.json` setzen
4. **Datenbank-Credentials**: Sichere Datenbank-Passwörter verwenden

## ❓ FAQ

**Q: Ich kann mich nicht anmelden - was tun?**
A: Prüfen Sie, ob die Datenbank erfolgreich geseeded wurde. Schauen Sie in die Logs nach "Database seeding completed" Meldungen.

**Q: Keine Test-Daten sichtbar?**
A: In Production ist Comprehensive Seeding standardmäßig deaktiviert. Für lokale Entwicklung `ASPNETCORE_ENVIRONMENT=Development` setzen.

**Q: Wie füge ich neue Test-Benutzer hinzu?**
A: Bearbeiten Sie die `testUserDefinitions` in `DbSeeder.cs` und starten Sie die Anwendung neu.

**Q: Datenbank-Migrations-Fehler?**
A: Löschen Sie die Datenbank (`dotnet ef database drop`) und erstellen Sie sie neu (`dotnet ef database update`).

---

**📚 Weitere Dokumentation:**
- [Backend API Details](/src/backend/Booking.Api/README.secrets.md)
- [Entity Framework Verbesserungen](/src/backend/Booking.Api/ReadModel-Improvements.md)
- [Claude Entwickler-Guide](/CLAUDE.md)