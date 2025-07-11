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