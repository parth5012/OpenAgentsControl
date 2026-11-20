---
name: file-pr
description: "File a PR: commit current work, push branch to GitHub, and open (or refresh) a PR for later review via gh CLI. Also files concise, problem-first PRs. Use when user says checkpoint, babysit, push PR, publish branch, file/open/create PR, snapshot work to GitHub, or wants current work reviewed later."
argument-hint: "PR number or branch name (optional — auto-detects current branch PR)"
---

# Checkpoint (includes file-pr)

Snapshot current branch to GitHub so it can be reviewed/merged later, on demand. Never auto-merges — merging is always manual by the user. Also covers filing a concise, problem-first PR (formerly the `file-pr` skill).

**PR body generation:** This skill always defers PR body writing to the `pr` skill (Matt Pocock's PR template). Every PR filed or refreshed here MUST use that template; never compose a PR body ad hoc. When filing a concise PR, put the problem statement at the top of Summary.

## When to use

Triggered by `/checkpoint` slash command when user wants current work pushed and a PR opened for later review. Also usable mid-conversation when user asks to "checkpoint", "babysit", "push a PR", "publish this branch", "File and babysit", "file/open/create a PR", or "save this so I can review it later".

## Filing a concise PR (problem-first)

Before filing, check whether a PR for this branch already exists. Review the diff locally against the base branch (usually `origin/main`) to make sure its contents match the goal.

PR titles usually become commit messages, so follow the repository's title conventions. Look at recently merged PRs and Git history for examples. Prefer a concise, human-readable title that explains why the change matters:

BAD
> ❌ perf(server): negotiate permessage-deflate on the websocket

GOOD
> ✅ perf(server): cut websocket frame size by 70%+ with gzipping

Open the description with a simple explanation of the problem based on the user's original prompt, then briefly explain the solution. Do not lead with an implementation inventory:

BAD
> ❌ Removed implicit workspace carry-over from every "new thread" entry point...

GOOD
> ✅ My "new worktree" default was ignored when starting new threads on existing worktrees. Super unintuitive. Now your preferences always apply.

Where this repo uses the `pr` skill's template (Summary / Evidence / Merge Danger), put the problem statement at the top of Summary and keep the evidence and merge-danger sections after it.

End the description with the public model name and harness that made the changes, for example `Created with <model> in <harness>.` Include subagent models that wrote part of the change. Use the model name the harness reports. If model identity is unavailable, name the harness without guessing a model.

Before submission, check the title, description, quotes, and attachments for secrets and private details.

Open a real PR rather than a draft so review bots run. If `gh pr create` fails because the GraphQL rate limit is used up, open it through REST with `gh api repos/<owner>/<repo>/pulls -f title=... -f head=... -f base=... -F body=@<file>`. If the user also asked to babysit it, continue with the `babysit-pr` skill.

Do not post a follow-up PR comment unless it serves the user's request. When a comment is needed, use the `leaving-pr-comments` skill.

## Workflow (checkpoint)

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
   - Check if a PR already exists for this branch: `gh pr view <current-branch> --json number,url,state`
   - If none exists, create one using the concise problem-first style above and the `pr` template body.
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
- **PR body must always be generated via the `pr` skill template** (`## Summary`, `## Evidence`, `## Merge Danger`), with the problem statement at the top of Summary.
- If `gh` is not authenticated or no remote is configured, stop and ask the user how to proceed.

## Verification

After every run, confirm:

- `gh pr view <current-branch>` returns an open PR owned by the current branch, and report its URL.
- The PR body follows the `pr` skill template.
- `git status --porcelain` is clean after commit/push (unless user had untracked files they asked to leave alone).