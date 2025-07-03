---
title: Projekt-Grundstruktur gemäß Anforderungen anlegen
description: Lege die Basisstruktur für das Buchungssystem an, damit die weiteren Anforderungen aus der requirements.md effizient umgesetzt werden können.
labels: [setup, struktur, backend, frontend, datenbank]
---

## Akzeptanzkriterien
- Projektstruktur für Backend (.NET 9 Native AOT) und Frontend (Plain HTML/JS, generiert durch TypeScript) ist angelegt.
- Für das Backend wird eine .NET 9 Solution (nur Grundstruktur, keine Implementierung) angelegt.
- Für das Frontend wird eine Grundstruktur (z. B. TypeScript-Projekt, HTML-Ordner) angelegt.
- PostgreSQL-Anbindung ist vorbereitet.
- Verzeichnisstruktur für Konfiguration, Models, Services, Datenbankzugriff und Frontend vorhanden.
- README.md enthält einen Überblick über die Struktur und den Technologie-Stack.
- Es werden keine unnötigen Abhängigkeiten hinzugefügt.
- Die Lösung ist auf einem Raspberry Pi Zero 2 W lauffähig (Performance beachten).

## Technologie-Stack laut requirements.md
- Platform: Raspberry PI Zero 2 W
- Backend: .NET 9 Native AOT
- Frontend: Plain HTML/JS (generiert durch TypeScript)
- Datenbank: PostgreSQL
