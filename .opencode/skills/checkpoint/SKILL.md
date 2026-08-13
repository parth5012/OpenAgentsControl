---
name: checkpoint
description: "On-demand branch checkpoint: commit current work, push branch to GitHub, and open (or refresh) a PR for later review via gh CLI. Use when user says checkpoint, babysit, push PR, publish branch, snapshot work to GitHub, or wants current branch reviewed later."
---
# Checkpoint

Snapshot current branch to GitHub so it can be reviewed/merged later, on demand. Never auto-merges — merging is always manual by the user.

## When to use

Triggered by `/checkpoint` slash command when user wants current work pushed and a PR opened for later review. Also usable mid-conversation when user asks to "checkpoint", "babysit", "push a PR", "publish this branch", or "save this so I can review it later".

## Workflow

Run these steps in order. Stop and ask the user if any step reveals ambiguity.

1. **Check environment**
   - Verify `gh` is installed and authenticated: `gh auth status`
   - Verify current directory is a git repo: `git rev-parse --is-inside-work-tree`

2. **Check git state**
   - `git branch --show-current` — get current branch name
   - `git status --porcelain` — see what is uncommitted
   - `git log -1 --oneline` — see latest commit
   - If there are uncommitted changes, ask the user for a commit message (use `$ARGUMENTS` or prompt if blank). Stage all changes (`git add -A`) and commit them.

3. **Push the branch**
   - `git push -u origin <current-branch>` (if remote/branch already tracked, plain `git push` is fine)

4. **Open / refresh the PR (gh CLI)**
   - Check if a PR already exists for this branch:
     `gh pr view <current-branch> --json number,url,state`
   - If none exists, create one:
     `gh pr create --base <default-branch> --head <current-branch> --title "<derived from commit(s)>" --body "<summary>"`
     - Derive the title from the branch name or the latest commit message; brief bullet body from commit list since the base branch.
   - If a PR exists and is open, update it with the new commit info (`gh pr edit`) rather than creating a duplicate.
   - If a PR exists but is closed/merged and new commits landed, ask the user: open a new PR or leave it.

5. **Report**
   - Return the PR number and URL so the user can review later.
   - State explicitly: PR was **not** merged — merging is left to the user.

## Rules

- **Never auto-merge, never use `gh pr merge`.** The user reviews and merges manually.
- Never force-push (`git push --force`) unless explicitly requested.
- Never touch branches, commits, or files unrelated to the current work.
- Do not open a duplicate PR for a branch that already has an open PR — refresh it instead.
- If `gh` is not authenticated or no remote is configured, stop and ask the user how to proceed.

## Verification

After every run, confirm:
- `gh pr view <current-branch>` returns an open PR owned by the current branch, and report its URL.
- `git status --porcelain` is clean after commit/push (unless user had untracked files they asked to leave alone).