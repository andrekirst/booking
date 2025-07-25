# booking

## Projektstruktur

Das Projekt ist wie folgt aufgebaut:

- `backend/` – .NET 9 Native AOT Backend
- `frontend/` – Next.js Frontend mit TypeScript
- `config/` – Konfigurationsdateien
- `db/` – SQL-Skripte und Datenbankzugriff (PostgreSQL)
- `docs/` – LaTeX/PDF-Dokumentation (Legacy)
- **BookStack** – Integrierte Dokumentation (siehe BOOKSTACK_SETUP.md)

## Technologie-Stack

- Platform: Raspberry PI Zero 2 W
- Backend: .NET 9 Native AOT
- Frontend: Next.js mit TypeScript und Tailwind CSS
- Datenbank: PostgreSQL
- Dokumentation: BookStack (Docker-Container)

## 📚 Dokumentation

Die Benutzeranleitung wird über **BookStack** bereitgestellt - ein professionelles Wiki-System.

### BookStack Setup
```bash
# BookStack starten
docker-compose up -d bookstack-db bookstack

# BookStack öffnen
open http://localhost:6875
```

**Standard-Login:** `admin@admin.com` / `password`

**Wichtig:** Sofort das Passwort ändern und deutsche Sprache aktivieren!

Detaillierte Setup-Anleitung: [BOOKSTACK_SETUP.md](./BOOKSTACK_SETUP.md)

### Dokumentations-Integration

Die Anwendung ist vollständig mit BookStack integriert:
- **Hilfe-Buttons** verlinken direkt zu relevanten BookStack-Seiten
- **Kontextsensitive Hilfe** für jeden UI-Bereich
- **Mehrsprachige Unterstützung** (Deutsch/English)

### Legacy-Dokumentation

- **LaTeX/PDF**: `/docs/manual/` - Automatische PDF-Generierung via GitHub Actions
- **Markdown**: `/docs/README-manual/` - Static Markdown-Dateien (deprecated)