# Software Requirements

In diesem Dokument ist niedergeschrieben, um welche Software es sich handeln soll, sowei deren Anforderungen.

## Ziel und Beschreibung der Software

Ziel soll es sein, dass man unseren Garten für Nächte buchen kann. Dadurch können andere Familienmitglieder sehen, wann der Garten für eine Übernachtung gebucht werden kann. Quasi wie ein Hotel für ein einzelnes Haus.

## Rollen

### Administrator

* Der Administrator befehigt Familienmitglieder den Garten für eine Übernachtung zu buchen. Oder entfernt das Recht
* Der Administrator legt in einer Konfiguration fest, wieviele räume es gibt und wie viele Schlafplätze in einem Raum zur Verfügung stehen
* Der Administrator legt fest, welche weitere Schlafmöglichkeiten, bspw. Zelt, es gibt und wieviele Schlafplätze es dafür gibt

### Familienmitglied

Ein Familienmitglied kann ein oder mehrere Nächte übernachten

## Fachliche Anforderungen

* Ein Familienmitglied kann eine oder mehrere Nächte buchen
  * Der Datumsbereich muss angegeben werden
  * Es muss ausgewählt werden, welche Räume mit wieviel Personen gebucht werden soll
* Ein Familienmitglied kann eine Buchung anpassen
  * Der Datumsbereich kann angepasst werden
  * Die Räume mit deren Personenanzahl kann angepasst werden
* Ein Familienmitglied kann die gesamte Buchung stornieren
* Ein Familienmitglied kann sich per E-Mail-Adresse oder einem Google-Account registrieren
  * Der Administrator muss allerdings das Familienmitglied befehigen, Nächte zu buchen
* Ein Familienmitglied kann sich mit einer E-Mail-Adresse oder Google-Account anmelden

## UI/UX Anforderungen

### DateRangePicker (Datumsauswahl)

#### Grundfunktionalität
* Moderner Kalender-View mit integriertem Popup statt separaten Input-Feldern
* Visueller Datumsbereich zwischen Start- und Enddatum mit Hover-Effekten
* Kompaktes Eingabefeld zeigt ausgewählte Daten im Format "15. Jan 2025 → 20. Jan 2025"
* Automatische Anzahl-der-Nächte-Berechnung und -Anzeige

#### Kalender-Layout
* Montag als erster Wochentag (europäischer Standard)
* Deutsche Monats- und Wochentag-Namen
* 6 Wochen Grid (42 Tage) für konsistente Darstellung
* Heute-Markierung mit blauem Ring um das aktuelle Datum

#### Interaktive Features
* "Heute"-Button für schnelle Navigation zum aktuellen Monat
* Pfeil-Navigation zwischen Monaten (vorheriger/nächster Monat)
* Klick außerhalb des Dropdowns schließt den Kalender
* Heutiges Datum ist auswählbar (außer bei anderen Geschäftsregeln)

#### Hover-Funktionalität
* Nach Startdatum-Auswahl: Hover über anderen Daten zeigt Nächte-Vorschau
* Beispiel: "3 Nächte - Klicken Sie um zu bestätigen"
* Visuelle Range-Highlights zwischen Start und Hover-Datum
* Real-time Feedback für bessere Benutzererfahrung

#### Verfügbarkeitsprüfung
* Integration mit Backend-Availability-Daten
* Vollständig belegte Tage sind nicht auswählbar
* Visuelle Darstellung blockierter Tage:
  - Rote Hintergrundfarbe
  - Durchgestrichener Text
  - Roter Punkt als zusätzliche Markierung
  - Deaktivierte Interaktion (cursor: not-allowed)

#### Textgestaltung
* Dunkle, gut lesbare Textfarben statt Grau-Töne
* Wochentage: `text-gray-700` für bessere Sichtbarkeit
* Ausgewählte Daten: `text-gray-900 font-medium` für Betonung
* Hilfetext: `text-gray-800 font-medium` für klare Anweisungen

#### Responsive Design
* Funktioniert auf Desktop und Mobile-Geräten
* Touch-optimierte Schaltflächen und Eingabebereiche
* Angemessene Größen für Touch-Interaktion

#### Fehlerzustände
* Unterscheidung zwischen Warnungen (gelb) und Fehlern (rot)
* Verfügbarkeitsprobleme als Warnung, nicht als blockierender Fehler
* Fallback-Mechanismus bei API-Ausfällen mit informativer Warnung

## Technische Anforderungen

Die Software soll mindestens auf einem Raspberry PI Zero 2 W laufen. Das heißt, die Software muss performant sein.
Die Datenbankzugriffe werden über Entity Framework Core realisiert.

Da der Raspberry hinter einer Fritzbox steht, soll Sicherheit ganz oben stehen und viele Sicherheitsmerkmale aufweisen.

### Technologie Stack

* Platform: Raspberry PI Zero 2 W
* Backend: .NET 9 Native AOT
* Frontend: Next.js mit TypeScript und Tailwind CSS
* Datenbank: PostgreSQL

### Backend-Konfiguration

#### DateTime-Handling
* PostgreSQL verwendet `timestamp with time zone` für alle DateTime-Felder
* Npgsql Legacy Timestamp Behavior aktiviert für Kompatibilität mit `DateTime.Kind=Unspecified`
* Konfiguration: `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)`

#### API-Verfügbarkeitsprüfung
* Fallback-Mechanismus bei API-Ausfällen implementiert
* Graceful Degradation: Alle Schlafplätze als verfügbar anzeigen wenn Backend nicht erreichbar
* Warnungen statt blockierender Fehler für bessere Benutzererfahrung

### Frontend-Architektur

#### API-Integration
* Zentraler API-Client für alle Backend-Kommunikation
* Error-Handling mit automatischem Logout bei 401-Fehlern
* Konsistente Fehlerbehandlung und Logging

#### Komponentenstruktur
* DateRangePicker: Standalone-Komponente mit Availability-Integration
* Prop-Interface für Availability-Daten und Callback-Funktionen
* Modulare Architektur für Wiederverwendbarkeit

#### State Management
* React Hooks für lokalen Component-State
* Availability-Daten als Props von Parent-Komponenten
* Optimistische Updates mit Fallback-Verhalten

## API-Validierungsregeln

### Backend-Validierung (Unabhängig von Frontend)

#### DateRangePicker-Validierungsregeln
Die API implementiert umfassende Validierungsregeln, die unabhängig von der Web-Anwendung funktionieren:

##### Datumsbereich-Validierung
* **Anreisedatum**: Kann nicht vor heute liegen (heutiges Datum ist erlaubt)
* **Abreisedatum**: Muss nach dem Anreisedatum liegen
* **Mindestaufenthalt**: 1 Nacht (Same-Day-Buchungen nicht erlaubt für Übernachtungen)
* **Maximaler Aufenthalt**: 30 Tage pro Buchung
* **Zeitzone**: Alle Datumsvergleiche erfolgen auf Tagesebene (Mitternacht-Normalisierung)

##### Schlafmöglichkeiten-Validierung
* **Mindestauswahl**: Mindestens eine Schlafmöglichkeit muss ausgewählt werden
* **Personenanzahl**: 1-20 Personen pro Schlafmöglichkeit
* **Kapazitätsprüfung**: Angeforderte Personenanzahl darf verfügbare Kapazität nicht überschreiten
* **Verfügbarkeitsprüfung**: Real-time Validierung gegen aktuelle Buchungen

##### Zusätzliche Geschäftsregeln
* **Notizen**: Maximal 500 Zeichen
* **Buchungsstatus**: Stornierte Buchungen können nicht geändert werden
* **Verfügbarkeitsausschluss**: Bei Updates wird die aktuelle Buchung von der Verfügbarkeitsprüfung ausgeschlossen

### API-Endpunkte für Validierung

#### POST /api/bookings/validate
Vollständige Validierung einer Buchungsanfrage ohne Erstellung:
```json
{
  "startDate": "2025-01-15T00:00:00",
  "endDate": "2025-01-20T00:00:00",
  "bookingItems": [
    {
      "sleepingAccommodationId": "uuid",
      "personCount": 2
    }
  ],
  "notes": "Optional notes"
}
```

**Response bei Erfolg:**
```json
{
  "isValid": true,
  "message": "Buchungsanfrage ist gültig",
  "validatedAt": "2025-01-15T10:30:00Z",
  "dateRange": {
    "startDate": "2025-01-15T00:00:00",
    "endDate": "2025-01-20T00:00:00",
    "nights": 5
  },
  "totalPersons": 2,
  "accommodationCount": 1
}
```

**Response bei Validierungsfehlern:**
```json
{
  "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
  "title": "Validation Error",
  "status": 400,
  "errors": {
    "DateRange": ["Das Anreisedatum kann nicht vor heute liegen"],
    "Availability": ["Schlafmöglichkeit 'Hauptzimmer' hat nur 2 freie Plätze, 4 wurden angefragt"]
  }
}
```

#### GET /api/bookings/availability
Verfügbarkeitsprüfung für einen Datumsbereich:
```
GET /api/bookings/availability?startDate=2025-01-15&endDate=2025-01-20&excludeBookingId=uuid
```

### Validierungs-Attribute (Custom Validation)

#### DateRangeValidationAttribute
* Validiert Datumsbereich-Geschäftsregeln
* Konfigurierbare Parameter: `AllowSameDay`, `AllowToday`
* Zentrale Validierungslogik für Konsistenz

#### FutureDateAttribute  
* Validiert dass Datum nicht in der Vergangenheit liegt
* Parameter: `AllowToday` (Standard: true)

#### AvailabilityValidationAttribute
* Async Verfügbarkeitsprüfung gegen Backend
* Integration mit MediatR für Query-Handling
* Unterstützt Buchungsausschluss bei Updates

### Fehlerbehandlung

#### Strukturierte Validation Responses
* **ValidationProblemDetails**: RFC 7807 konforme Fehlerresponses
* **Deutsche Fehlermeldungen**: Benutzerfreundliche Texte
* **Kategorisierte Fehler**: Domain, Business, Availability
* **Detaillierte Kontext-Informationen**: Welche Regel verletzt wurde

#### Fallback-Mechanismen
* **API-Ausfall**: Graceful Degradation mit informativen Warnungen
* **Verfügbarkeitsprüfung**: Fallback auf "verfügbar" bei System-Fehlern
* **Timeout-Handling**: Angemessene Timeouts für Validierungsoperationen

### Integration mit Frontend

#### Konsistente Validierung
* **Gleiche Regeln**: Frontend und Backend verwenden identische Geschäftsregeln
* **Real-time Feedback**: Frontend kann API-Validierung für sofortiges Feedback nutzen
* **Optimistic UI**: Frontend validiert lokal, Backend validiert autoritativ