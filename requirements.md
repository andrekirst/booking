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

## Fachliche Anfoderungen

* Ein Familienmitglied kann eine oder mehrere Nächte buchen
  * Der Datumsbereich muss angegeben werden
  * Es muss ausgewählt werden, welche Räume mit wieviel Personen gebucht werden soll
* Ein Familienmitglied kann eine Buchung anpassen
  * Der Datumsbereich kann angepasst werden
  * Die Räume mit deren Personenanzahl kann angepasst werden
* Ein Failienmitglied kann die gesamte Buchung stornieren
* Ein Familienmitglied kann sich per E-Mail-Adresse oder einem Google-Account registrieren
  * Der Administrator muss allerdings das Familienmitgliede befehigen, Nächte zu buchen
* Ein Familienmitglied kann sich mit einer E-Mail-Adresse oder Google-Account anmelden

## Technische Anfoderungen

Die Software soll mindestens auf einem Raspberry PI Zero 2 W laufen. Das heißt, die Software muss maximal performant sein.
Dies bedeutet auch, dass kein EF Core eingesetzt wird, sondern einfache SQL-Statements genutzt werden.

Da der Raspberry hinter einer Fritzbox steht, soll Sicherheit ganz oben stehen und viele Sicherehritsmerkmale aufweisen.

### Technologie Stack

* Platform: Raspberry PI Zero 2 W
* Backend: .net 9 Native AOT
* Frontend: Plain HTML/JS - Javascript generiert durch Typescript
* Datenbank: PostgreSQL