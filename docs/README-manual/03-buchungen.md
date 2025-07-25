# 📅 Buchungen verwalten

> **[← Zurück: Erste Schritte](02-erste-schritte.md)** | **[Zurück zum Hauptmenü](README.md)** | **[Weiter zu: Räume und Schlafplätze →](04-raumverwaltung.md)**

---

## 📊 Buchungsübersicht

### 🔄 Ansichtsmodi

Die Buchungsplattform bietet zwei verschiedene Ansichtsmodi für Ihre Buchungen:

| Modus | Symbol | Beschreibung | Vorteile |
|-------|--------|--------------|----------|
| **Listenansicht** | 📋 | Traditionelle Kartenansicht | Detaillierte Informationen, Übersichtlich bei wenigen Buchungen |
| **Kalenderansicht** | 📅 | Visuelle Monatsübersicht | Zeitliche Übersicht, Schnelles Erfassen von Belegungen |

#### 🔀 **Ansicht wechseln:**
1. **🔍 Buttons finden**: Rechts oben in der Buchungsübersicht
2. **📋 Listen-Symbol**: Klicken für Listenansicht
3. **📅 Kalender-Symbol**: Klicken für Kalenderansicht
4. **💾 Gespeichert**: Ihre Präferenz wird automatisch gespeichert

### 📋 Listenansicht

In der Listenansicht sehen Sie alle Ihre Buchungen als übersichtliche Karten:

```
┌─────────────────────────────────────────────┐
│ 📅 01.06. - 03.06.2024    Status: ✅ Bestätigt│
├─────────────────────────────────────────────┤
│ 🏨 Räume: Schlafzimmer 1, Schlafzimmer 2    │
│ 👥 Personen: 6                              │
│ 📝 Notizen: Familienfeier                   │
│                                             │
│ [Bearbeiten] [Details] [Stornieren]         │
└─────────────────────────────────────────────┘
```

#### 🎯 **Funktionen der Listenansicht:**
- **📊 Alle Details**: Zeitraum, Status, Räume, Personen auf einen Blick
- **🔘 Aktionsbuttons**: Direkte Bearbeitung möglich
- **🎨 Farbcodierung**: Status-abhängige Farbmarkierungen
- **📱 Responsive**: Optimal für Mobile und Desktop

### 📅 Kalenderansicht

Die neue Kalenderansicht bietet eine visuelle Übersicht über alle Buchungen:

#### 🗓️ **Hauptfunktionen:**

1. **📅 Monatsansicht**
   - Standardmäßig aktueller Monat
   - Alle Buchungen als farbige Balken
   - Wochenenden hervorgehoben
   - Heute markiert

2. **🧭 Navigation**
   ```
   [◀ Vorheriger] [Heute] [Nächster ▶]
            Mai 2024
   ```
   - **◀/▶ Pfeile**: Monatswechsel
   - **Heute-Button**: Springt zum aktuellen Tag
   - **Monats-/Jahresanzeige**: Aktuelle Position

3. **🎨 Farbcodierung**
   | Farbe | Status | Bedeutung |
   |-------|--------|-----------|
   | 🟢 Grün | Bestätigt | Buchung ist genehmigt |
   | 🟡 Orange | Wartend | Wartet auf Genehmigung |
   | 🔴 Rot | Abgelehnt | Wurde nicht genehmigt |
   | ⚫ Grau | Storniert | Wurde storniert |

4. **📱 Kompakte Buchungsliste**
   - Rechts neben dem Kalender
   - Scrollbare Liste aller Buchungen
   - Klickbar für Details
   - Synchron mit Kalender

#### 🖱️ **Interaktionen:**
- **📅 Buchung anklicken**: Details öffnen sich
- **🔍 Hover-Effekt**: Zusatzinfos bei Mauszeiger
- **📱 Touch**: Antippen auf Mobilgeräten
- **⌨️ Tastatur**: Tab-Navigation möglich

---

## ➕ Neue Buchung erstellen

### 📝 Buchungsformular öffnen

1. **🔘 Button finden**: „Neue Buchung" in der Navigation oder auf der Übersichtsseite
2. **📄 Formular lädt**: System prüft Verfügbarkeiten
3. **✅ Bereit**: Formular ist ausgefüllt bereit

### 📅 Datum und Zeitraum wählen

#### **Schritt 1: Anreisedatum**
```
Anreisedatum: [📅 Kalender öffnen]
              └─ Klick öffnet Datumswähler
```

**Kalender-Features:**
- **📍 Heute markiert**: Aktueller Tag hervorgehoben
- **🚫 Vergangenheit**: Vergangene Tage nicht wählbar
- **🔴 Belegt**: Bereits gebuchte Tage markiert
- **✅ Verfügbar**: Freie Tage grün

#### **Schritt 2: Abreisedatum**
```
Abreisedatum: [📅 Kalender öffnen]
              └─ Nur Tage nach Anreise wählbar
```

**Automatische Berechnung:**
```
━━━━━━━━━━━━━━━━━━━━━━━━
🌙 Anzahl Nächte: 2
📅 Aufenthalt: Fr 01.06. - So 03.06.
━━━━━━━━━━━━━━━━━━━━━━━━
```

### 🏨 Räume und Schlafplätze auswählen

Nach der Datumswahl werden verfügbare Räume angezeigt:

#### **Raumkarten-Ansicht:**
```
┌─────────────────────────────────────┐
│ 🛏️ Schlafzimmer 1                   │
├─────────────────────────────────────┤
│ Typ: Doppelzimmer                   │
│ Max. Kapazität: 2 Personen          │
│ Ausstattung: Doppelbett, Schrank    │
│                                     │
│ ☐ Raum auswählen                   │
│ Personen: [0] ▼ (max. 2)           │
└─────────────────────────────────────┘
```

#### **Auswahlprozess:**
1. **☑️ Checkbox**: Aktivieren für gewünschte Räume
2. **👥 Personenzahl**: Dropdown oder Eingabefeld
3. **⚠️ Validierung**: System prüft Kapazitätsgrenzen
4. **➕ Mehrfachauswahl**: Beliebig viele Räume kombinierbar

#### **Verfügbarkeitsanzeige:**
- **✅ Grün**: Vollständig verfügbar
- **🟡 Orange**: Teilweise belegt (andere Tage)
- **🔴 Rot**: Nicht verfügbar
- **🔧 Grau**: In Wartung/gesperrt

### 📝 Zusätzliche Informationen

#### **Notizen-Feld:**
```
┌─────────────────────────────────────────┐
│ 📝 Notizen (optional):                  │
│ ┌─────────────────────────────────────┐ │
│ │ Hier können Sie besondere Wünsche,  │ │
│ │ Anmerkungen oder wichtige Infos     │ │
│ │ hinterlassen...                     │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│ 💡 Beispiele: Allergien, Ankunftszeit   │
└─────────────────────────────────────────┘
```

**Nützliche Notizen-Beispiele:**
- 🕐 **Ankunft**: „Ankunft erst gegen 20 Uhr"
- 🍼 **Kinder**: „Mit Baby (6 Monate) - Babybett benötigt"
- ♿ **Barrierefreiheit**: „Rollstuhlfahrer dabei"
- 🎉 **Anlass**: „Überraschungsparty für Oma"
- 🐕 **Haustiere**: „Kleiner Hund dabei - ist das okay?"

### ✅ Buchung bestätigen und absenden

#### **Zusammenfassung prüfen:**
```
┌──────────────────────────────────────────┐
│         📋 Buchungszusammenfassung       │
├──────────────────────────────────────────┤
│ 📅 Zeitraum:                             │
│    Anreise: Fr, 01.06.2024              │
│    Abreise: So, 03.06.2024              │
│    Dauer: 2 Nächte                      │
│                                          │
│ 🏨 Gebuchte Räume:                      │
│    • Schlafzimmer 1 (2 Personen)        │
│    • Schlafzimmer 2 (4 Personen)        │
│                                          │
│ 👥 Gesamtpersonen: 6                    │
│                                          │
│ 📝 Notizen:                              │
│    Familienfeier - Omas Geburtstag      │
├──────────────────────────────────────────┤
│         [❌ Abbrechen] [✅ Buchen]       │
└──────────────────────────────────────────┘
```

#### **Nach dem Absenden:**
1. **⏳ Verarbeitung**: Kurze Ladezeit
2. **✅ Erfolgsmeldung**: „Buchung erfolgreich erstellt!"
3. **📧 E-Mail**: Bestätigung an Ihre E-Mail-Adresse
4. **🔄 Weiterleitung**: Zur Buchungsübersicht
5. **⚠️ Status**: Neue Buchung hat Status „Pending"

---

## 📊 Buchungsstatus verstehen

### 🔍 Status-Übersicht

| Status | Symbol | Bedeutung | Aktionen möglich |
|--------|--------|-----------|------------------|
| **Pending** | 🟡 | Wartet auf Admin-Bestätigung | ✏️ Bearbeiten, ❌ Stornieren |
| **Confirmed** | 🟢 | Bestätigt und verbindlich | 👁️ Ansehen, ❌ Stornieren* |
| **Cancelled** | ⚫ | Vom Nutzer storniert | 👁️ Ansehen |
| **Rejected** | 🔴 | Vom Admin abgelehnt | 👁️ Ansehen, 📧 Grund einsehen |

*Stornierung bestätigter Buchungen nur nach Rücksprache

### 📈 Status-Workflow

```
Neue Buchung
    ↓
🟡 Pending ──→ Admin prüft ──→ 🟢 Confirmed
    ↓                    ↘
❌ Nutzer                 🔴 Rejected
storniert                    ↓
    ↓                    Begründung
⚫ Cancelled             per E-Mail
```

---

## ✏️ Buchung bearbeiten

### 🔓 Bearbeitbare Buchungen

**Nur Buchungen mit Status „Pending" können bearbeitet werden!**

#### **Bearbeitung starten:**
1. **📋 Übersicht**: Navigieren Sie zu Ihren Buchungen
2. **🔍 Buchung finden**: Suchen Sie die gewünschte Buchung
3. **✏️ Button**: Klicken Sie auf „Bearbeiten"
4. **📝 Formular**: Bearbeitungsformular öffnet sich

### 🔄 Änderbare Elemente

#### **Was Sie ändern können:**
- ✅ **Datum**: An- und Abreisedatum
- ✅ **Räume**: Andere oder zusätzliche Räume
- ✅ **Personen**: Anzahl pro Raum
- ✅ **Notizen**: Zusätzliche Informationen

#### **Was NICHT änderbar ist:**
- ❌ **Bestätigte Buchungen**: Status „Confirmed"
- ❌ **Vergangene Buchungen**: Bereits abgelaufen
- ❌ **Stornierte/Abgelehnte**: Status „Cancelled/Rejected"

### 💾 Änderungen speichern

1. **✅ Prüfen**: Alle Änderungen korrekt?
2. **💾 Speichern**: Button „Änderungen speichern"
3. **⏳ Verarbeitung**: System prüft Verfügbarkeit
4. **✅ Bestätigung**: „Änderungen gespeichert"
5. **📧 E-Mail**: Aktualisierte Buchungsbestätigung

---

## ❌ Buchung stornieren

### ⚠️ Stornierungsprozess

#### **Schritt 1: Stornierung initiieren**
1. **📋 Buchung finden**: In der Übersicht
2. **❌ Button**: „Stornieren" anklicken
3. **⚠️ Dialog**: Bestätigungsdialog erscheint

#### **Schritt 2: Bestätigungsdialog**
```
┌──────────────────────────────────────┐
│     ⚠️ Buchung wirklich stornieren?  │
├──────────────────────────────────────┤
│ Möchten Sie diese Buchung wirklich  │
│ stornieren?                          │
│                                      │
│ 📅 01.06. - 03.06.2024              │
│ 🏨 Schlafzimmer 1, Schlafzimmer 2   │
│                                      │
│ Diese Aktion kann nicht rückgängig  │
│ gemacht werden!                      │
├──────────────────────────────────────┤
│    [Abbrechen] [❌ Stornieren]       │
└──────────────────────────────────────┘
```

#### **Schritt 3: Stornierung abschließen**
1. **❌ Bestätigen**: „Stornieren" klicken
2. **⏳ Verarbeitung**: Stornierung wird durchgeführt
3. **✅ Bestätigung**: „Buchung wurde storniert"
4. **📧 E-Mail**: Stornierungsbestätigung
5. **🔄 Status**: Ändert sich zu „Cancelled"

### 📋 Stornierungsrichtlinien

**Pending-Buchungen:**
- ✅ Jederzeit stornierbar
- ✅ Keine Rücksprache nötig
- ✅ Sofort wirksam

**Bestätigte Buchungen:**
- ⚠️ Administrator kontaktieren
- ⚠️ Begründung erforderlich
- ⚠️ Individuelle Entscheidung

---

## 📄 Buchungsdetails anzeigen

### 👁️ Detailansicht öffnen

**Mehrere Wege zur Detailansicht:**
1. **📋 Listenansicht**: Klick auf „Details"
2. **📅 Kalenderansicht**: Klick auf Buchung
3. **🔗 Direktlink**: Aus E-Mail-Bestätigung

### 📊 Verfügbare Informationen

#### **Vollständige Buchungsdetails:**
```
┌────────────────────────────────────────┐
│        📄 Buchungsdetails              │
├────────────────────────────────────────┤
│ 🔢 Buchungsnummer: #2024-0142         │
│ 📅 Status: ✅ Bestätigt                │
│                                        │
│ 📆 Zeitraum:                           │
│    Check-in: Fr, 01.06.2024           │
│    Check-out: So, 03.06.2024          │
│    Dauer: 2 Nächte                    │
│                                        │
│ 🏨 Gebuchte Räume:                    │
│    • Schlafzimmer 1                   │
│      └─ 2 Personen                    │
│    • Schlafzimmer 2                   │
│      └─ 4 Personen                    │
│                                        │
│ 👥 Gesamtpersonen: 6                  │
│                                        │
│ 📝 Notizen:                            │
│    Familienfeier - Omas Geburtstag    │
│                                        │
│ 🕒 Erstellt: 15.05.2024, 14:32       │
│ ✅ Bestätigt: 16.05.2024, 09:15      │
├────────────────────────────────────────┤
│ [📧 E-Mail senden] [🖨️ Drucken]      │
└────────────────────────────────────────┘
```

### 🖨️ Zusätzliche Funktionen

**Verfügbare Aktionen:**
- **📧 E-Mail**: Bestätigung erneut senden
- **🖨️ Drucken**: Druckfreundliche Version
- **📤 Teilen**: Link mit Familie teilen
- **📅 Kalender**: Zu Kalender hinzufügen (.ics)

---

## 💡 Tipps & Tricks

### 🎯 **Beste Praktiken:**

1. **📅 Frühzeitig buchen**
   - Beliebte Termine schnell vergeben
   - Mehr Auswahl bei Räumen
   - Zeit für Planung

2. **📝 Notizen nutzen**
   - Besondere Wünsche mitteilen
   - Ankunftszeit angeben
   - Allergien/Bedürfnisse

3. **👥 Personenzahl**
   - Genau angeben
   - Kinder/Babys erwähnen
   - Platz optimal nutzen

4. **📧 E-Mails prüfen**
   - Spam-Ordner checken
   - Benachrichtigungen aktivieren
   - Aktuelle E-Mail-Adresse

### ⚡ **Schnellaktionen:**

- **Doppelklick**: Öffnet Details direkt
- **Rechtsklick**: Kontextmenü mit Optionen
- **Tastatur**: 
  - `N` = Neue Buchung
  - `L` = Listenansicht
  - `K` = Kalenderansicht
  - `ESC` = Dialog schließen

---

## 🆘 Häufige Probleme

### ❓ **Problem: Keine verfügbaren Räume**
**Lösung:**
- Andere Daten prüfen
- Kürzeren Zeitraum wählen
- Administrator kontaktieren

### ❓ **Problem: Buchung wird nicht bestätigt**
**Lösung:**
- Geduld - Admin muss prüfen
- E-Mail-Adresse verifiziert?
- Notfalls Admin kontaktieren

### ❓ **Problem: Kann nicht stornieren**
**Lösung:**
- Nur Pending-Status selbst stornierbar
- Bei Confirmed: Admin fragen
- Stornierungsgrund angeben

---

## 🎯 Nächste Schritte

- **🏨 [Räume entdecken](04-raumverwaltung.md)** - Alle Schlafplätze kennenlernen
- **❓ [FAQ lesen](06-fehlerbehebung.md)** - Antworten auf häufige Fragen
- **📞 Support** - Bei weiteren Fragen

---

**Navigation:**
> **[← Zurück: Erste Schritte](02-erste-schritte.md)** | **[Zurück zum Hauptmenü](README.md)** | **[Weiter zu: Räume und Schlafplätze →](04-raumverwaltung.md)**

---

*🌟 **Power-User-Tipp**: Nutzen Sie die Kalenderansicht für die Urlaubsplanung - so sehen Sie auf einen Blick, wann der Garten frei ist!*

*Letzte Aktualisierung: Automatisch generiert | Version: 1.0.0*