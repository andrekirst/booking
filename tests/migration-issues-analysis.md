# Docker Compose v2 Migration - Issues Analysis

**Test-Datum**: 2025-07-29  
**Test Coverage**: 30% (3/10 Tests bestanden)  
**Status**: ❌ **MIGRATION NICHT BEREIT**

## 🔍 Gefundene Issues

### 1. Container-Name-Konflikte
**Problem**: Existierende Container blockieren das Starten neuer Services
```
Error: The container name "/booking-postgres-agent2" is already in use
```
**Impact**: KRITISCH - Verhindert Service-Startup  
**Lösung**: Container-Cleanup vor Tests erforderlich

### 2. Legacy docker-compose Verwendung in Scripts
**Problem**: Scripts verwenden noch `docker-compose` (v1) statt `docker compose` (v2)
**Betroffene Files**:
- `scripts/start-agent.sh`
- `scripts/stop-agent.sh`  
- `scripts/status-agents.sh`

**Impact**: HOCH - Scripts funktionieren nicht mit v2  
**Lösung**: Alle `docker-compose` Aufrufe zu `docker compose` ändern

### 3. Port-Schema-Validierung fehlgeschlagen
**Problem**: Test kann Ports nicht korrekt in Compose-Config finden
```
❌ Agent 2 Frontend Port: 60201 nicht konfiguriert
❌ Agent 2 Backend Port: 60202 nicht konfiguriert
```
**Impact**: MITTEL - Möglicherweise Test-Issue statt Config-Issue  
**Lösung**: Test-Logik überprüfen oder Port-Konfiguration korrigieren

### 4. Container-Namen-Convention
**Problem**: pgweb Container-Name nicht gefunden + Underscore-Verwendung erkannt
```
❌ Container-Name nicht gefunden: booking-pgweb-agent2
❌ Container mit Underscores gefunden
```
**Impact**: MITTEL - Naming-Inconsistency  
**Lösung**: pgweb Container-Namen prüfen und Hyphen-Convention durchsetzen

### 5. Service-Startup-Failures
**Problem**: Services können nicht erfolgreich gestartet werden
```
❌ Service startup failed or timeout
```
**Impact**: KRITISCH - Grundfunktionalität beeinträchtigt  
**Lösung**: Container-Konflikte beheben + Dependency-Issues prüfen

### 6. Template-File-Syntax-Errors (Erwartet)
**Problem**: Template-Files enthalten Platzhalter
```
❌ docker-compose.agent-template.yml: Syntax-Fehler
```
**Impact**: NIEDRIG - Erwartet bei Template-Files  
**Lösung**: Templates von Syntax-Validierung ausschließen

## 📊 Test-Ergebnisse Details

### ✅ Bestanden (3/11)
1. **Docker Compose Version Detection** - v2.29.7 verfügbar
2. **Network Isolation Between Agents** - Netzwerk-Konfiguration korrekt
3. **Docker Compose File Syntax Validation** - Haupt-Files syntaktisch korrekt

### ❌ Fehlgeschlagen (7/11)
1. **Service Startup** - Container-Konflikte + Dependency-Issues
2. **Multi-Agent Port Schema** - Port-Detection-Logik fehlerhaft
3. **Container Names** - pgweb Missing + Underscore-Usage
4. **Script Compatibility** - Legacy docker-compose Verwendung
5. **Performance Comparison** - Service-Startup-Failure
6. **Health Check Functionality** - Service-Startup-Failure
7. **Docker Compose File Syntax** - Template-Files (erwartet)

### ⏭️ Übersprungen (1/11)
1. **BuildKit Integration** - BuildKit/buildx nicht verfügbar

## 🔧 Erforderliche Korrekturen

### Priorität 1: KRITISCH
```bash
# 1. Container-Cleanup implementieren
docker container prune -f
docker compose -f docker-compose.agent2.yml down --remove-orphans --volumes

# 2. Scripts auf v2 migrieren
sed -i 's/docker-compose/docker compose/g' scripts/*.sh
```

### Priorität 2: HOCH
```bash
# 3. pgweb Container-Namen prüfen
grep -r "container_name.*pgweb" docker-compose.agent*.yml

# 4. Port-Schema-Tests debuggen
docker compose -f docker-compose.agent2.yml config | grep -E "60[2-4][0-9][1-4]:"
```

### Priorität 3: MITTEL
```bash
# 5. Template-Files von Tests ausschließen
# In validate-compose-syntax.sh: Skip *-template.yml files

# 6. Underscore-Usage eliminieren
grep -r "_" docker-compose.agent*.yml | grep -v "postgres_data"
```

## 🎯 Nächste Schritte

1. **Container-Cleanup** implementieren und testen
2. **Script-Migration** zu Docker Compose v2 durchführen
3. **Port-Schema-Tests** debuggen und korrigieren
4. **Container-Namen-Convention** durchsetzen
5. **Service-Startup-Tests** wiederholen
6. **Performance-Benchmarks** nach Fixes durchführen

## 📈 Migration-Readiness-Score

**Aktuell**: 30% (3/10 Tests bestanden)  
**Ziel**: 90%+ (9/10+ Tests bestanden)  
**Geschätzte Korrektur-Zeit**: 2-4 Stunden  

## 🏷️ Test-Klassifikation

- **Syntax-Validation**: ✅ Bereit (außer Templates)
- **Runtime-Tests**: ❌ Nicht bereit (Container-Konflikte)
- **Script-Kompatibilität**: ❌ Nicht bereit (Legacy-Aufrufe)
- **Performance**: ❌ Nicht testbar (Service-Startup-Failures)
- **Network-Isolation**: ✅ Bereit
- **Port-Schema**: ❌ Test-Issue oder Config-Issue

**Fazit**: Migration zu Docker Compose v2 ist technisch möglich, benötigt aber Korrekturen der identifizierten Issues vor Produktions-Deployment.