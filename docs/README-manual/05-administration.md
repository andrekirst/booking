# ⚙️ Administration

> **[← Zurück: Räume und Schlafplätze](04-raumverwaltung.md)** | **[Zurück zum Hauptmenü](README.md)** | **[Weiter zu: Fehlerbehebung →](06-fehlerbehebung.md)**

> ⚠️ **Nur für Administratoren** - Normale Benutzer haben keinen Zugang zu diesen Funktionen

---

## 🛠️ Administrator-Bereich

### 🔐 Zugang zum Admin-Panel

#### **Voraussetzungen:**
- ✅ Administrator-Rolle erforderlich
- ✅ Vollständig verifiziertes Konto
- ✅ Aktive Session

#### **Admin-Bereich aufrufen:**
1. **🔑 Anmelden**: Mit Administrator-Konto einloggen
2. **⚙️ Admin-Button**: Klicken Sie auf "Admin" in der Navigation
3. **🚀 Dashboard**: Administrator-Dashboard wird geöffnet

### 🎯 Dashboard-Navigation

Das neue Admin-Dashboard ist in drei Hauptbereiche unterteilt:

```
┌────────────────┬─────────────────────────────┐
│                │                             │
│  📊 Allgemein  │                             │
│                │                             │
│  📋 Verwaltung │    Hauptinhalt-Bereich     │
│     • Benutzer │                             │
│     • Buchungen│                             │
│     • Räume    │                             │
│                │                             │
│  ⚙️ System     │                             │
│     • E-Mail   │                             │
│     • Backup   │                             │
│                │                             │
└────────────────┴─────────────────────────────┘
```

**Navigation-Tabs:**
- **📊 Allgemein**: System-Übersicht und Statistiken
- **📋 Verwaltung**: Benutzer, Buchungen, Räume verwalten
- **⚙️ Systemeinstellungen**: E-Mail, Backup, erweiterte Optionen

---

## 👥 Benutzerverwaltung

### 📋 Benutzerübersicht

Die Benutzerübersicht zeigt alle registrierten Benutzer:

| Spalte | Beschreibung | Aktionen |
|--------|--------------|----------|
| **👤 Name** | Vor- und Nachname | Klick für Details |
| **📧 E-Mail** | E-Mail mit Verifizierungsstatus | ✅ = verifiziert |
| **🏷️ Rolle** | Member / Administrator | Änderbar |
| **📊 Status** | Aktiv / Ausstehend / Abgelehnt | Farbcodiert |
| **📅 Registriert** | Registrierungsdatum | Sortierbar |
| **⚡ Aktionen** | Verfügbare Aktionen | Buttons |

### 🆕 Neue Benutzer freischalten

Nach der E-Mail-Verifizierung müssen neue Registrierungen genehmigt werden:

#### **Genehmigungsprozess:**

1. **🔔 Benachrichtigung**
   - Badge zeigt Anzahl ausstehender Genehmigungen
   - E-Mail-Alert bei neuen Registrierungen

2. **👀 Prüfung durchführen**
   ```
   ┌──────────────────────────────────────────┐
   │        Ausstehende Genehmigung           │
   ├──────────────────────────────────────────┤
   │ 👤 Name: Max Mustermann                  │
   │ 📧 E-Mail: max@example.com ✅            │
   │ 📅 Registriert: 15.05.2024              │
   │ ✉️ E-Mail verifiziert: Ja               │
   │                                          │
   │ [✅ Genehmigen] [❌ Ablehnen]           │
   └──────────────────────────────────────────┘
   ```

3. **✅ Genehmigung**
   - Klick auf "Genehmigen"
   - Benutzer wird aktiviert
   - Automatische E-Mail-Benachrichtigung

4. **❌ Ablehnung**
   - Klick auf "Ablehnen"
   - Optional: Begründung eingeben
   - Benutzer erhält Ablehnungs-E-Mail

### 🔄 Benutzerrollen verwalten

#### **Verfügbare Rollen:**

| Rolle | Rechte | Verwendung |
|-------|--------|------------|
| **👤 Member** | Buchungen erstellen/verwalten | Standard für Familienmitglieder |
| **👑 Administrator** | Vollzugriff auf alle Funktionen | System-Verwaltung |
| **🚫 Inactive** | Kein Zugriff | Temporär deaktiviert |

#### **Rolle ändern:**
1. **📋 Benutzerliste**: Benutzer finden
2. **✏️ Bearbeiten**: Klick auf Bearbeiten-Button
3. **🎯 Rolle wählen**: Dropdown-Auswahl
4. **💾 Speichern**: Änderungen übernehmen

---

## 📊 Buchungsmanagement

### 📅 Alle Buchungen verwalten

Administratoren haben erweiterte Buchungsfunktionen:

#### **Erweiterte Aktionen:**
- **✅ Bestätigen**: Pending-Buchungen genehmigen
- **❌ Ablehnen**: Mit Begründung ablehnen
- **✏️ Bearbeiten**: Auch bestätigte Buchungen ändern
- **🚨 Notfall-Storno**: In Ausnahmefällen

#### **Buchungsübersicht-Filter:**
```
Filter: [Alle ▼] [Pending ▼] [Heute ▼]
Suche: [🔍 Name oder Buchungsnummer...]
```

### 📊 Buchungsrichtlinien

#### **Überwachung:**
- **📏 Maximale Dauer**: 14 Nächte Limit durchsetzen
- **🔄 Doppelbuchungen**: Automatische Prüfung
- **⚖️ Faire Verteilung**: Auslastung überwachen
- **🎉 Sonderanlässe**: Prioritäten setzen

---

## 🏨 Raumverwaltung

### ➕ Neuen Raum hinzufügen

#### **Raum erstellen:**
1. **📋 Navigation**: Verwaltung → Räume
2. **➕ Button**: "Neuen Raum hinzufügen"
3. **📝 Formular ausfüllen**:
   ```
   Name: [Schlafzimmer 3____________]
   Typ:  [Zimmer ▼]
   Kapazität: [4] Personen
   
   Beschreibung:
   [Geräumiges Zimmer im Obergeschoss mit...]
   
   Ausstattung:
   ☑ Doppelbett
   ☑ Einzelbetten (2)
   ☐ Schlafsofas
   ☑ Schrank
   ☑ Fenster
   ```

### ✏️ Räume bearbeiten

#### **Bearbeitungsoptionen:**
- **📝 Details**: Name, Beschreibung, Ausstattung
- **👥 Kapazität**: Maximale Personenzahl
- **🖼️ Bilder**: Fotos hochladen/ändern
- **🔧 Status**: Aktiv/Wartung/Gesperrt

### 🔧 Wartung und Sperrungen

#### **Raum sperren:**
1. **🏨 Raum wählen**: Aus der Liste
2. **🔧 Wartung**: Button "Wartung/Sperrung"
3. **📅 Zeitraum**: Von/Bis festlegen
4. **📝 Grund**: Wartungsgrund eingeben
5. **💾 Speichern**: Sperrung aktivieren

**Effekt:** Raum ist für den Zeitraum nicht buchbar

---

## ⚙️ System-Einstellungen

### 📧 E-Mail-Konfiguration

Das neue E-Mail-Einstellungen-Interface unter "Systemeinstellungen → E-Mail":

#### **SMTP-Server einrichten:**
```
┌────────────────────────────────────────────┐
│          📧 E-Mail-Einstellungen           │
├────────────────────────────────────────────┤
│ SMTP-Server:    [smtp.gmail.com_____]     │
│ Port:           [587_] (TLS)               │
│ Benutzername:   [booking@garden.com_]      │
│ Passwort:       [••••••••••••••]          │
│                                            │
│ Verschlüsselung: ○ Keine ● TLS ○ SSL      │
│                                            │
│ Absender-Name:  [Garten-Buchung_____]     │
│ Absender-Mail:  [noreply@garden.com]      │
├────────────────────────────────────────────┤
│              [💾 Speichern]                │
└────────────────────────────────────────────┘
```

#### **E-Mail testen:**
1. **📧 Test-Adresse**: Empfänger eingeben
2. **📤 Senden**: "Test-E-Mail senden"
3. **✅ Prüfen**: Posteingang kontrollieren
4. **💾 Speichern**: Bei Erfolg speichern

#### **Automatische E-Mails:**
- **📝 Registrierung**: Verifizierungs-Mail
- **✅ Genehmigung**: Freischaltungs-Mail
- **❌ Ablehnung**: Ablehnungs-Mail mit Grund
- **📅 Buchungen**: Bestätigungen
- **🔔 Admin-Alerts**: Bei neuen Anfragen

### 🌐 Globale Einstellungen

#### **Buchungsregeln:**
```
Max. Buchungsdauer:    [14] Nächte
Min. Vorlaufzeit:      [1_] Tag(e)
Stornierungsfrist:     [24] Stunden
```

#### **System-Modi:**
- **🟢 Normal**: Vollbetrieb
- **🟡 Eingeschränkt**: Nur Admins
- **🔴 Wartung**: System gesperrt

### 📊 Berichte und Statistiken

#### **Verfügbare Berichte:**
1. **📈 Auslastung**
   - Monatliche Übersicht
   - Raum-Auslastung
   - Trend-Analyse

2. **👥 Benutzer-Aktivität**
   - Buchungen pro Benutzer
   - Aktivste Nutzer
   - Neue Registrierungen

3. **💾 Export-Optionen**
   - CSV-Download
   - PDF-Berichte
   - Excel-Export

---

## 🔧 Wartung

### 🗄️ Backup-Management

#### **Regelmäßige Aufgaben:**
- **📦 Datenbank-Backup**: Täglich automatisch
- **🗂️ Archivierung**: Alte Buchungen
- **🧹 Bereinigung**: Temporäre Dateien
- **📊 Log-Rotation**: System-Logs

### 🚨 Notfall-Prozeduren

#### **Bei Problemen:**
1. **🔄 Wiederherstellung**: Aus Backup
2. **🚑 Notfall-Support**: Direkter Zugriff
3. **📞 Kontakt**: Technischer Support
4. **📋 Dokumentation**: Vorfall protokollieren

---

## 💡 Admin-Tipps

### 🎯 **Best Practices:**
1. **📅 Regelmäßige Prüfung**: Täglich neue Anfragen checken
2. **📧 E-Mail-Test**: Nach Änderungen testen
3. **💾 Backups**: Regelmäßig prüfen
4. **📊 Monitoring**: Auslastung im Blick behalten

### ⚡ **Schnellzugriff:**
- **Alt+A**: Admin-Dashboard
- **Alt+U**: Benutzerverwaltung
- **Alt+B**: Buchungsübersicht
- **Alt+S**: Systemeinstellungen

---

## 🆘 Häufige Admin-Aufgaben

### **Neue Saison vorbereiten:**
1. Alte Buchungen archivieren
2. Räume auf Wartung prüfen
3. Benutzerkonten aktualisieren
4. E-Mail-Templates anpassen

### **Konfliktlösung:**
1. Doppelbuchung identifizieren
2. Betroffene kontaktieren
3. Alternative anbieten
4. Lösung dokumentieren

---

**Navigation:**
> **[← Zurück: Räume und Schlafplätze](04-raumverwaltung.md)** | **[Zurück zum Hauptmenü](README.md)** | **[Weiter zu: Fehlerbehebung →](06-fehlerbehebung.md)**

---

*🔐 **Sicherheitshinweis**: Teilen Sie Ihre Administrator-Zugangsdaten niemals mit anderen. Bei Verdacht auf Kompromittierung sofort Passwort ändern!*

*Letzte Aktualisierung: Automatisch generiert | Version: 1.0.0*