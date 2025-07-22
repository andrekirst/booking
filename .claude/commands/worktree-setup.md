# Setup Multi-Agent Worktree

Erstelle einen neuen Git Worktree für parallele Multi-Agent-Entwicklung.

## Schritte:

1. **Parameter erfragen**:
   - Issue-Nummer für den neuen Agent
   - Feature-Name (kurz, ohne Leerzeichen)
   - Agent-Nummer (2-9)

2. **Worktree Setup ausführen**:
   ```bash
   ./scripts/setup-multi-agent.sh <issue-number> <feature-name> <agent-number>
   ```

3. **Verification**:
   - Prüfe ob Worktree erstellt wurde
   - Zeige Navigation-Befehle
   - Bestätige isolierte Claude-Settings

4. **Next Steps anzeigen**:
   - Navigation zum neuen Workspace
   - Start einer neuen Claude Session
   - Quick-Navigation Helper

## Beispiel:
```bash
# Setup Agent 2 für Issue #35 (user-profile Feature)
./scripts/setup-multi-agent.sh 35 user-profile 2
```

## Post-Setup:
- Informiere über Agent-Koordination-Protokoll
- Erinnere an File-Isolation-Regeln
- Zeige aktive Worktrees mit `git worktree list`