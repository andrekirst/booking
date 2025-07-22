# Multi-Agent Status Check

Zeige den Status aller aktiven Multi-Agent Worktrees und deren Fortschritt.

## Ausführung:

1. **Worktree Übersicht**:
   ```bash
   git worktree list
   ```

2. **Branch Status aller Agenten**:
   ```bash
   git branch -a | grep feat/
   ```

3. **Detaillierter Status pro Agent**:
   Für jeden Worktree:
   - Aktueller Branch
   - Uncommitted Changes
   - Ahead/Behind Status
   - Letzter Commit

4. **Merge-Readiness**:
   ```bash
   git log --oneline --graph --all --decorate -20
   ```

5. **Konflikt-Check**:
   - Prüfe überlappende File-Änderungen
   - Zeige potenzielle Merge-Konflikte

6. **Performance Metriken**:
   - Anzahl aktiver Agenten
   - Issues in Bearbeitung
   - Commits pro Agent
   - Zeit seit letztem Merge

## Output Format:
```
🤖 Multi-Agent Status Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Agent 1 (Main): Issue #32 ✅ Ready to merge
Agent 2: Issue #33 🔄 In progress (3 commits ahead)
Agent 3: Issue #34 ⚠️  Conflicts detected
Agent 4: Issue #35 🆕 Just started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```