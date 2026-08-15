---
name: merge-pr
description: "Use when an agent needs to merge a GitHub PR into main, finalize a worktree branch, push merged work to origin/main, or when user says merge, land PR, ship it, merge and push, finalize branch, land this, close the PR. Also use when agent is unsure how to complete the PR-to-main flow after checkpoint."
argument-hint: "PR number or branch name to merge (optional — auto-detects current branch PR)"
---

# Merge PR

Safely merge a GitHub PR into `main` using rebase strategy, push to `origin/main`, and clean up. This is the merge counterpart to the `checkpoint` skill (which creates/updates PRs).

## When to Use

- After `checkpoint` has created a PR and it's ready to land
- When user says "merge", "land this PR", "ship it", "merge and push", "finalize"
- When an agent has completed work on a worktree branch and needs to get it into main
- When NOT to use: if work isn't committed/pushed yet → use `checkpoint` first

## Workflow

Run from **wherever you are** — the feature worktree or the main working tree. The skill detects which and adapts. Run steps in order. **STOP and report** if any step fails — never force or skip.

### 1. Validate Environment

```bash
gh auth status
git rev-parse --is-inside-work-tree
```

If `gh` not authenticated or not in a git repo → STOP, report, ask user.

### 2. Identify the PR

Three ways to identify the target PR (try in order):

1. **User gave PR number**: `gh pr view <number> --json number,url,state,headRefName,baseRefName`
2. **User gave branch name**: `gh pr view <branch> --json number,url,state,headRefName,baseRefName`
3. **Auto-detect from current branch**: `gh pr view --json number,url,state,headRefName,baseRefName`

Capture: `PR_NUMBER`, `HEAD_BRANCH`, `BASE_BRANCH`

**Validate:**
- PR state MUST be `OPEN`. If closed/merged → STOP, report.
- `BASE_BRANCH` should be `main`. If not → STOP, confirm with user before proceeding.

**Worktree awareness:** If you're inside a worktree (`git rev-parse --show-toplevel` differs from main repo), note the worktree path for cleanup in Step 8.

### 3. Check CI Status (Best Effort)

```bash
gh pr checks <PR_NUMBER> --json name,state,conclusion
```

- If checks exist and **all pass** → proceed
- If checks exist and **some pending** → wait up to 2 minutes, re-check once; if still pending → warn user, proceed
- If checks exist and **any failed** → STOP, report which checks failed, ask user whether to proceed
- If **no checks configured** → proceed (not all repos have CI)
- If `gh pr checks` errors → proceed with warning

### 4. Sync Main and Rebase

```bash
# Ensure main is up to date
git fetch origin main
```

**If inside a worktree** (detected in Step 2):
```bash
# Stay on HEAD_BRANCH, rebase onto fetched origin/main
git rebase origin/main
```

**If in the main working tree:**
```bash
git checkout main
git pull origin main --ff-only

# Switch to PR branch and rebase onto latest main
git checkout <HEAD_BRANCH>
git rebase origin/main
```

**If rebase produces conflicts:**

1. Check conflict type with `git diff --name-only --diff-filter=U`
2. For each conflicted file, inspect with `git diff <file>`
3. **Simple conflicts** (whitespace-only, non-overlapping additions, import order): attempt resolution
   - `git checkout --theirs <file>` or `git checkout --ours <file>` only when one side is clearly a no-op
   - For non-overlapping: manually edit, `git add <file>`, `git rebase --continue`
4. **Complex conflicts** (overlapping logic, semantic changes on both sides): **ABORT immediately**
   ```bash
   git rebase --abort
   ```
   Report: which files conflict, what both sides changed, why it needs human judgment. STOP.

**Red Flags — ALWAYS abort rebase and report:**
- More than 3 files conflicted
- Conflicts in test files (risk of silently breaking coverage)
- Conflicts in config/lock files (package.json, lock files, CI configs)
- You're unsure whether the resolution preserves intent on both sides

### 5. Force-Push Rebased Branch

After successful rebase:

```bash
git push --force-with-lease origin <HEAD_BRANCH>
```

`--force-with-lease` prevents overwriting others' work. If this fails → STOP, someone else pushed to the branch.

### 6. Merge via GitHub

```bash
gh pr merge <PR_NUMBER> --rebase --delete-branch
```

This:
- Merges with **rebase strategy** (linear history)
- Deletes the **remote** source branch after merge

If merge fails (protection rules, review requirements) → STOP, report the specific error.

### 7. Update Local Main

**If inside a worktree:** navigate to the main working tree directory first.

```bash
git checkout main
git pull origin main --ff-only
```

Verify the merge landed:
```bash
git log --oneline -5
```

Confirm PR commits appear in main's history.

### 8. Clean Up

```bash
# Delete local branch
git branch -d <HEAD_BRANCH>
```

If the work was in a **worktree** (from the main working tree):
```bash
git worktree remove <worktree-path>
# Also delete local branch if worktree removal didn't
git branch -d <HEAD_BRANCH>
```

If `git branch -d` refuses (unmerged warning) → use `git branch -D` only after confirming the commits exist in main via Step 7.

### 9. Push Verification

Final verification that `origin/main` has the merged work:

```bash
git log origin/main --oneline -5
```

Confirm the PR's commits are present.

## Report Template

After successful merge, report:

```
✅ PR #<number> merged into main
   Branch: <HEAD_BRANCH> → main (rebase)
   Commits landed: <count>
   CI: <passed | no checks | warning>
   Branch cleanup: remote ✓ local ✓ [worktree ✓]
   origin/main: up to date
   URL: <PR URL>
```

After failure, report:

```
❌ PR #<number> merge STOPPED at step <N>
   Reason: <specific reason>
   State: <what was done, what was rolled back>
   Action needed: <what user should do>
```

## Rules

- **Always rebase, never merge commit.** Linear history is the standard.
- **Never `git push --force`** — always `--force-with-lease`.
- **Never auto-resolve complex conflicts.** When in doubt, abort and report.
- **Never skip CI failures silently.** Report and let user decide.
- **Never merge a closed/merged PR.** Check state first.
- **Never merge to a branch other than `main`** unless user explicitly confirms.
- **Never delete `main` branch** under any circumstances.
- **Always clean up** — delete local branch, remote branch, and worktree after successful merge.
- **Checkpoint first if uncommitted work exists.** If `git status --porcelain` shows changes, tell user to run `checkpoint` first.

## Common Agent Mistakes This Skill Prevents

| Mistake | Prevention |
|---------|-----------|
| Merge to wrong branch | Step 2 validates `BASE_BRANCH` is `main` |
| Stale branch merged | Step 4 fetches and rebases onto latest `origin/main` |
| Silent conflict resolution | Step 4 abort rules for complex conflicts |
| Forgot to push after local merge | Step 6 uses `gh pr merge` which operates on remote |
| Branch left dangling | Steps 6+8 delete remote and local branch |
| Worktree left behind | Step 8 removes worktree |
| Force-push overwrites others | Step 5 uses `--force-with-lease` |
| CI failures ignored | Step 3 checks and reports |

## Verification

After every run, confirm:
- `gh pr view <PR_NUMBER> --json state` returns `MERGED`
- `git log main --oneline -5` shows the PR's commits
- `git branch` does NOT list the old branch
- `git status` is clean
