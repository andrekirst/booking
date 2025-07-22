# Koordinierter Multi-Agent Merge

Führe koordinierte Merges von Multi-Agent Branches durch.

## Workflow:

1. **Pre-Merge Checks**:
   - Alle Agenten haben gepusht
   - Keine uncommitted changes
   - CI/CD Tests passed

2. **Merge-Reihenfolge bestimmen**:
   - Dependencies analysieren
   - Konflikt-Risiko bewerten
   - Optimale Merge-Sequenz

3. **Schrittweises Merging**:
   ```bash
   # Schritt 1: Fetch all
   git fetch --all
   
   # Schritt 2: Merge Agent branches
   git checkout main
   git merge origin/feat/33-feature --no-ff
   git merge origin/feat/34-backend --no-ff
   ```

4. **Konflikt-Resolution**:
   - Bei Konflikten: Stoppen und melden
   - Konflikt-Lösung dokumentieren
   - Affected Agents informieren

5. **Post-Merge**:
   - Run tests
   - Update CLAUDE.md wenn nötig
   - Cleanup merged branches

6. **Worktree Cleanup**:
   ```bash
   git worktree remove ../booking-agent2
   git branch -d feat/33-feature
   ```

## Safety Checks:
- ⚠️  Niemals force-merge
- ⚠️  Immer no-fast-forward
- ⚠️  Tests müssen grün sein
- ⚠️  Review vor merge