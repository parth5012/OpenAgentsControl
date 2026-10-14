---
name: babysit-pr
description: "Babysit an open GitHub PR until checks go green: poll checks, rebase-if-behind, trigger and apply concrete review fixes from OCR, CodeRabbit, and parthpr bot (as well as humans), push, report. Use when user says babysit PR, watch PR, keep PR rebased, address review comments. Never merges."
argument-hint: "PR number or branch name (optional — auto-detects current branch PR)"
---

# Babysit PR

Keep an open PR fresh until CI is green and review threads are worked. Rebase + concrete review fixes only (bots and humans) — never merges, never freelances red-CI fixes, never resolves/dismisses anyone's threads.

### Three Review Pillars
Babysit PR coordinates reviews across three automated reviewers:
1. **OCR (OpenCodeReview)**: Run local diff review (`ocr review` or `tools.ocr_review`) to catch bugs, security issues, performance problems, and maintainability concerns directly on the diff vs the base branch.
2. **CodeRabbit**: Monitor `coderabbitai[bot]`. If CodeRabbit has not reviewed the PR yet, trigger review: post a comment with `@coderabbitai review` and wait for its feedback.
3. **parthpr bot (PR-Agent)**: Monitor `parthpr[bot]` (or `parth-pr-agent[bot]`). If parthpr bot has not reviewed the PR yet, trigger review: post a comment with `/review` (or `@parthpr review`) and wait for its review.

Companion skills: `checkpoint` files/refreshes the PR, `babysit-pr` (this) watches it, `merge-pr` lands it.

## When to Use

- After `checkpoint` opened a PR and user says "babysit", "watch PR", "keep it rebased", "wait for checks"
- When a PR is behind `main` or CI is pending and user wants it maintained until green
- When reviewers — OCR, bots (CodeRabbit, parthpr bot, Copilot, CodeQL, linters) or humans — left comments and user wants the concrete asks applied
- When NOT to use: no open PR exists yet → use `checkpoint` first; ready to land → use `merge-pr`

## Workflow

Run steps in order. **STOP and report** on hard fail — never force or skip.

### 1. Validate Environment

```bash
gh auth status
git rev-parse --is-inside-work-tree
```

If `gh` not authenticated or not in a git repo → STOP, report, ask user.

### 2. Identify the PR

Try in order:

1. **User gave PR number**: `gh pr view <number> --json number,url,state,headRefName,baseRefName`
2. **User gave branch name**: `gh pr view <branch> --json number,url,state,headRefName,baseRefName`
3. **Auto-detect from current branch**: `gh pr view --json number,url,state,headRefName,baseRefName`

Capture: `PR_NUMBER`, `HEAD_BRANCH`, `BASE_BRANCH`.

**Validate:**

- PR state MUST be `OPEN`. If closed/merged → STOP, report.
- `BASE_BRANCH` should be `main`. If not → STOP, confirm with user.

### 3. Trigger & Collect AI Reviews (OCR, CodeRabbit, parthpr bot) and Human Comments

Run on the first pass and re-check on every watch-loop poll — reviewers may post mid-loop. Same bar for bots and humans.

#### A. Trigger AI Review Bots on GitHub (CodeRabbit & parthpr bot)
Fetch existing PR comments:
```bash
gh repo view --json owner,name
gh api repos/<owner>/<repo>/issues/<PR_NUMBER>/comments --paginate --jq '.[] | {id, author: .user.login, body: (.body[:200])}'
```

- **CodeRabbit**: If `coderabbitai[bot]` has not posted a review or summary:
  ```bash
  gh pr comment <PR_NUMBER> --body "@coderabbitai review"
  ```
- **parthpr bot**: If `parthpr[bot]` or `parth-pr-agent[bot]` has not posted a review:
  ```bash
  gh pr comment <PR_NUMBER> --body "/review"
  ```
Wait for bot responses before concluding reviews are complete.

#### B. Run OCR Review Locally
Run `ocr review` on the branch diff vs base branch (or use `tools.ocr_review`):
```bash
ocr review --audience agent -b "Babysit PR #${PR_NUMBER} automated review" --from origin/${BASE_BRANCH} --to ${HEAD_BRANCH} -o /tmp/ocr_pr_${PR_NUMBER}.txt
```
Inspect findings in `/tmp/ocr_pr_${PR_NUMBER}.txt` (or structured JSON output):
- Target actionable findings with severity `critical`, `high`, or `medium` (discard `low` / cosmetic style nits).
- Extract concrete fixes (bugs, security risks, missing null guards, error handling, performance regressions).

#### C. Fetch Remote Review Comments (Bots & Humans)
```bash
gh pr view <PR_NUMBER> --json reviews,comments
gh api repos/<owner>/<repo>/pulls/<PR_NUMBER>/comments --paginate --jq '.[] | {id, path, line, author: .user.login, type: .user.type, body: (.body[:500])}'
```

Filter:
- **Bot authors**: login ends with `[bot]` or author type is `Bot` (e.g. `coderabbitai[bot]`, `parthpr[bot]`, `parth-pr-agent[bot]`, `github-actions[bot]`).
- **Human authors**: everyone else — same concrete-only treatment, never reply-argue.
- Only `OPEN` PR threads; skip comment IDs already addressed earlier in this run (track them in-run).
- Prefer actionable items: fenced ```suggestion blocks / patch hunks and explicitly named asks (rename X→Y, use Z here).

#### D. Apply Fixes (concrete fixes only)

- **DO apply**:
  - Reviewer-provided ```suggestion patch blocks verbatim from CodeRabbit, parthpr bot, or human reviewers.
  - Concrete asks named exactly (rename X→Y, use Z here, formatting, import order, typos, unused imports, obvious null guards matching surrounding style).
  - Concrete fixes from OCR `critical`/`high`/`medium` findings matching existing codebase style.
- **PARK verbatim, do not code**: design/architecture opinions, ambiguous or vague asks, conflicting asks between reviewers, anything in test files / lockfiles / CI configs beyond trivial, anything needing new deps or migrations.
- Commit each batch:
  - `fix(pr): address coderabbit review on <file>`
  - `fix(pr): address parthpr review on <file>`
  - `fix(pr): address ocr finding on <file>`
  - Reference the comment URL or OCR finding in the commit body.
- Push — plain `git push`, or `--force-with-lease` only right after a rebase — and continue the watch loop.
- Never mark threads resolved/dismissed to silence them; never reply-chat or argue with reviewers. Human "Request changes" reviews still need a human re-review after fixes — flag as action needed in Report.

### 4. Bounded Watch Loop

Limits: poll every ~2 min, max ~30 min (~15 polls). Exit early on green / hard fail / complex conflict.

Each poll:

```bash
git fetch origin main
gh pr view <PR_NUMBER> --json state,mergeStateStatus,url
gh pr checks <PR_NUMBER> --json name,state,conclusion
git rev-list --count HEAD..origin/main
```

Also re-run Step 3 each poll:
- Check for newly posted review comments from CodeRabbit, parthpr bot, or humans.
- If new commits were pushed or branch rebased, re-run OCR (`ocr review --audience agent --from origin/${BASE_BRANCH} --to ${HEAD_BRANCH}`) to verify no new issues were introduced.

Decide:

- **New concrete review suggestions (OCR, CodeRabbit, parthpr bot, humans)**: apply per Step 3, push, continue loop.
- **Behind main** (`rev-list` count > 0): rebase + push, then continue loop:
  ```bash
  git rebase origin/main
  git push --force-with-lease origin <HEAD_BRANCH>
  ```
- **Checks all pass + not behind + no unapplied concrete review items (OCR, CodeRabbit, parthpr bot, humans)**: exit SUCCESS, go to Report.
- **Checks pending or reviews pending**: wait ~2 min, next poll. If still pending at 30 min cap → exit TIMEOUT, report.
- **Any check failed**: STOP, go to Report as FAILED. The Step 3 review-fix path is the only code-edit exception — do not invent fixes for red CI.
- **No checks configured**: treat as SUCCESS if not behind and no pending review items (not all repos have CI).
- **`gh pr checks` errors**: warn and continue to next poll, do not fail the loop on one transient error.

**Rebase conflict policy (same as `merge-pr`):**

1. `git diff --name-only --diff-filter=U` — list conflicted files.
2. Trivial only (whitespace, import order, non-overlapping additions): resolve, `git add`, `git rebase --continue`.
3. Otherwise ABORT immediately: `git rebase --abort`, STOP, report files + both-side changes.

**Always abort rebase and report on:**

- More than 3 files conflicted
- Conflicts in test files, `package.json`, lock files, CI configs
- Any doubt about preserving intent

### 5. Report

Success:

```
👀 PR #<number> green — <URL>
   Branch: <HEAD_BRANCH> → main (up to date)
   CI: passed | no checks
   Reviews: OCR (clean), CodeRabbit (addressed), parthpr bot (addressed)
   Review fixes: <n applied from OCR / CodeRabbit / parthpr bot / humans> / parked: <m>
   Next: merge-pr to land, or leave open (human re-review if requested)
```

Failed / timeout / conflict:

```
⚠️ PR #<number> babysit STOPPED — <reason>
   URL: <PR URL>
   CI: <failed check names | pending at timeout>
   Reviews: OCR status, CodeRabbit status, parthpr bot status
   Review fixes: <applied list> / parked verbatim: <quotes + URLs>
   State: <rebased/aborted, pushed or not>
   Action needed: <what user should do>
```

Parked review items are quoted verbatim with comment URLs — never paraphrased away.

State explicitly: PR was **not** merged — `merge-pr` or manual merge is still required.

## Rules

- **Never merge, never use `gh pr merge`.** Hand off to `merge-pr`/user.
- **Code edits allowed ONLY for concrete reviewer-provided fixes (Step 3: OCR findings, CodeRabbit, parthpr bot, and human reviews).** Never freelance fixes for red CI.
- **Never reply-argue with reviewers, human or bot.** Apply concrete asks or park them.
- **Never `git push --force`** — always `--force-with-lease`, and only after a rebase.
- **Never auto-resolve complex conflicts.** Abort and report.
- **Never resolve/dismiss review threads to silence them.** Human re-reviews stay with humans.
- **Never loop past ~30 min.** Timeout and report instead of orphaning.
- **Never touch unrelated branches/files.**
- If `gh` not authenticated or no remote → stop and ask.

## Verification

After every run, confirm:

- `gh pr view <PR_NUMBER> --json state` returns `OPEN`
- Final `gh pr checks` outcome reported accurately (passed / failed names / timeout)
- OCR review completed and clean or concrete high/medium findings addressed
- CodeRabbit and parthpr bot reviews triggered and comments handled
- Applied review fixes listed with source reviewer name and comment URL; parked items quoted verbatim
- `git status --porcelain` clean (unless user asked to leave files alone)
- Report includes PR URL and explicit not-merged statement
