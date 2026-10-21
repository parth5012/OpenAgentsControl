---
name: checkpoint
description: "On-demand branch checkpoint: commit current work, push branch to GitHub, and open (or refresh) a PR for later review via gh CLI. Use when user says checkpoint, babysit, push PR, publish branch, snapshot work to GitHub, or wants current branch reviewed later."
---
# Checkpoint

Snapshot current branch to GitHub so it can be reviewed/merged later, on demand. Never auto-merges — merging is always manual by the user.

**PR body generation:** This skill always defers PR body writing to the `pr` skill (Matt Pocock's PR template). Every PR filed or refreshed here MUST use that template; never compose a PR body ad hoc.

## When to use

Triggered by `/checkpoint` slash command when user wants current work pushed and a PR opened for later review. Also usable mid-conversation when user asks to "checkpoint", "babysit", "push a PR", "publish this branch", "File and babysit", or "save this so I can review it later".

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
  `gh pr create --base <default-branch> --head <current-branch> --title "<derived from commit(s)>" --body "<generated via the `pr` skill>"`
    - **PR body MUST be generated using the `pr` skill (Matt Pocock's PR template).** Invoke/read the `pr` skill and fill its template (`## Summary`, `## Evidence`, `## Merge Danger`) from the commit list/diff since the base branch. Never hand-write or improvise a PR body outside that template.
    - Derive the title from the branch name or the latest commit message; brief bullet body from commit list since the base branch.
  - If a PR exists and is open, update it with the new commit info (`gh pr edit`) rather than creating a duplicate, regenerating the PR body via the `pr` skill template when the diff changed.
  - If a PR exists but is closed/merged and new commits landed, ask the user: open a new PR or leave it.
5. **Report**
  - Return the PR number and URL so the user can review later.
  - State explicitly: PR was **not** merged — merging is left to the user.
  - Offer next step: `babysit-pr` to watch checks until green, `merge-pr` to land when ready.

## Rules

- **Never auto-merge, never use `gh pr merge`.** The user reviews and merges manually.
- Never force-push (`git push --force`) unless explicitly requested.
- Never touch branches, commits, or files unrelated to the current work.
- Do not open a duplicate PR for a branch that already has an open PR — refresh it instead.
- **PR body must always be generated via the `pr` skill (Matt Pocock's PR template).** Any PR filed or refreshed by this skill MUST use the `pr` template (`## Summary`, `## Evidence`, `## Merge Danger`). Never file a PR with an ad-hoc body.
- If `gh` is not authenticated or no remote is configured, stop and ask the user how to proceed.

## Verification

After every run, confirm:

- `gh pr view <current-branch>` returns an open PR owned by the current branch, and report its URL.
- The PR body follows the `pr` skill template (`## Summary`, `## Evidence`, `## Merge Danger`).
- `git status --porcelain` is clean after commit/push (unless user had untracked files they asked to leave alone).

