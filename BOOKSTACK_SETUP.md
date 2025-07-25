# BookStack Setup und Integration

Diese Anleitung beschreibt die Integration von BookStack als Dokumentationssystem für die Buchungsplattform.

## 🚀 Schnellstart

1. **BookStack starten:**
   ```bash
   docker-compose up -d bookstack-db bookstack
   ```

2. **BookStack öffnen:**
   - URL: http://localhost:6875
   - Standard-Login: `admin@admin.com` / `password`

3. **Erstes Setup durchführen (siehe Setup-Abschnitt unten)**

## 📋 Konfiguration

### Docker Services

Die `docker-compose.yml` enthält zwei neue Services:

- **bookstack-db**: MySQL 8.0 Datenbank für BookStack
- **bookstack**: BookStack-Anwendung (LinuxServer.io Image)

### Environment Variablen

```yaml
environment:
  - TZ=Europe/Berlin           # Zeitzone
  - APP_URL=http://localhost:6875  # BookStack URL
  - APP_KEY=base64:Nm/CZI95YBTxCz7h92HDhL6ZSAv7UfqfhkOK7WZXrjs=  # Verschlüsselungsschlüssel
  - APP_LANG=de               # Deutsche Sprache
  - APP_DEFAULT_DARK_MODE=false  # Light Mode Standard
```

### APP_KEY generieren

Falls ein neuer APP_KEY benötigt wird:

```bash
docker run --rm --entrypoint /bin/bash lscr.io/linuxserver/bookstack:latest appkey
```

### Ports

- **BookStack**: Port 6875 (http://localhost:6875)
- **BookStack-DB**: Intern (Port 3306)

## 🔧 Initiales Setup

### 1. Erster Login
1. Öffne http://localhost:6875
2. Login mit: `admin@admin.com` / `password`
3. **Wichtig**: Ändere sofort das Admin-Passwort!

### 2. Deutsche Sprache aktivieren
1. Gehe zu **Settings** → **App Settings**
2. Setze **Default Language** auf `Deutsch`
3. **Save Settings** klicken

### 3. Benutzerhandbuch-Struktur erstellen

#### Buch erstellen:
1. **Create New** → **Book**
2. Name: `Benutzerhandbuch`
3. Description: `Vollständige Anleitung für die Garten-Buchungsplattform`

#### Kapitel erstellen:
1. **Einleitung**
2. **Erste Schritte** 
3. **Buchungen verwalten**
4. **Räume und Schlafplätze**
5. **Administration**
6. **FAQ und Fehlerbehebung**

### 4. Seiten erstellen

Für jedes Kapitel die entsprechenden Seiten anlegen:

#### Kapitel "Erste Schritte":
- Anmeldung und Registrierung
- E-Mail-Verifizierung  
- Administrator-Freigabe
- Benutzeroberfläche

#### Kapitel "Buchungen verwalten":
- Neue Buchung erstellen
- Buchungsübersicht
- Buchungen bearbeiten
- Buchungen stornieren
- Kalenderansicht
- Listenansicht

#### Kapitel "Räume und Schlafplätze":
- Raumübersicht
- Raumauswahl
- Verfügbarkeit prüfen

#### Kapitel "Administration":
- Admin-Dashboard
- Benutzerverwaltung
- Benutzer freischalten
- E-Mail-Konfiguration
- Buchungsmanagement

#### Kapitel "FAQ":
- Häufige Fragen nach Kategorien
- Fehlerbehebung
- Browser-Kompatibilität

## 🔗 Integration mit der Anwendung

### HelpButton-Integration

Der `HelpButton` ist bereits konfiguriert und verweist auf BookStack:

```typescript
// Beispiel-URLs:
const helpTopics = {
  'login': { 
    url: 'http://localhost:6875/books/benutzerhandbuch/chapter/erste-schritte#anmeldung', 
    title: 'Anmeldung' 
  },
  'booking-create': { 
    url: 'http://localhost:6875/books/benutzerhandbuch/chapter/buchungen#erstellen', 
    title: 'Buchung erstellen' 
  },
  // ...
};
```

### URL-Struktur

BookStack URLs folgen diesem Muster:
```
http://localhost:6875/books/[buch-name]/chapter/[kapitel-name]#[anker]
```

## 📝 Content Migration

### Aus bestehender Dokumentation

1. **LaTeX-Inhalte** aus `/docs/manual/chapters/` nach BookStack kopieren
2. **Markdown-Inhalte** aus `/docs/README-manual/` übertragen  
3. **Screenshots** aus `/docs/manual/images/` hochladen

### Inhaltserstellung

1. **Strukturierte Inhalte** mit Überschriften und Ankern
2. **Screenshots** für UI-Beschreibungen
3. **Schritt-für-Schritt-Anleitungen** mit nummerierten Listen
4. **Warnhinweise** und Tipps-Boxen verwenden
5. **Interne Verlinkungen** zwischen Kapiteln

## 🔒 Sicherheit und Zugriff

### Produktionsumgebung

Für Production Environment:

```yaml
environment:
  - APP_URL=https://docs.ihre-domain.de
  - MAIL_DRIVER=smtp
  - MAIL_HOST=smtp.ihre-domain.de
  - MAIL_PORT=587
  - MAIL_USERNAME=docs@ihre-domain.de
  - MAIL_PASSWORD=ihr-passwort
```

### Benutzerberechtigungen

1. **Public Access**: Für Dokumentation aktivieren
2. **Guest Access**: Lesezugriff für nicht-angemeldete Benutzer  
3. **Admin-Account**: Für Content-Management

## 🔧 Wartung und Backup

### Datenbank-Backup

```bash
# Backup erstellen
docker exec bookstack-mysql mysqldump -u bookstack -pbookstack_password bookstack > bookstack_backup.sql

# Backup wiederherstellen  
docker exec -i bookstack-mysql mysql -u bookstack -pbookstack_password bookstack < bookstack_backup.sql
```

### Volume-Backup

```bash
# BookStack-Daten sichern
docker run --rm -v booking-agent2_bookstack_app_data:/data -v $(pwd):/backup alpine tar czf /backup/bookstack_data.tar.gz -C /data .

# Wiederherstellen
docker run --rm -v booking-agent2_bookstack_app_data:/data -v $(pwd):/backup alpine tar xzf /backup/bookstack_data.tar.gz -C /data
```

## 🚀 Next Steps

1. **BookStack starten**: `docker-compose up -d bookstack-db bookstack`
2. **Initiales Setup** durchführen (Admin-Passwort, Sprache)
3. **Benutzerhandbuch-Struktur** erstellen
4. **Content migrieren** aus bestehenden Quellen
5. **URLs testen** mit HelpButton-Integration
6. **Custom Documentation** entfernen (optional)

## 📖 Zusätzliche Ressourcen

- [BookStack Dokumentation](https://www.bookstackapp.com/docs/)
- [Docker Image Dokumentation](https://docs.linuxserver.io/images/docker-bookstack)
- [BookStack GitHub](https://github.com/BookStackApp/BookStack)