---
name: babysit-pr
description: "Babysit an open GitHub PR until checks go green: use T3 watch_pull_request or pr-wait (never own polling), rebase-if-behind, trigger and apply concrete review fixes from OCR, CodeRabbit, and parthpr bot (as well as humans), push, report. Never merges."
argument-hint: "PR number or branch name (optional — auto-detects current branch PR)"
---

# Babysit PR

Keep an open PR fresh until CI is green and review threads are worked. Rebase + concrete review fixes only (bots and humans) — never merges, never freelances red-CI fixes, never resolves/dismisses anyone's threads.

Coordinates reviews across three automated reviewers plus humans:
1. **OCR (OpenCodeReview)** — local diff review vs base branch.
2. **CodeRabbit** — GitHub bot (`coderabbitai[bot]`).
3. **parthpr bot (PR-Agent)** — GitHub bot (`parthpr[bot]` / `parth-pr-agent[bot]`).

Companion skills: `file-pr` files/refreshes the PR, `babysit-pr` (this) watches it, `merge-pr` lands it, `leaving-pr-comments` formats any comment posted on the user's behalf.

## Waiting

Never write your own watcher, polling loop, or `sleep` loop. Use one watcher per PR: `watch_pull_request` in T3 Code, `pr-wait` everywhere else. Never run both on the same PR. Every watcher on a GitHub account shares one rate limit.

### In T3 Code: `watch_pull_request`

Handle the existing checks and comments first. Then call `watch_pull_request` and end your turn. T3 Code wakes you with a message when a check fails, the required checks pass, someone comments or reviews, or the branch conflicts.

- **Only the thread that owns the PR watches it.** If you are a delegated child task (a reviewer, a Sol round, any `delegate_task` child), never call `watch_pull_request`. The parent owns the PR. Do not watch PRs you are not working on.
- **A wake is news, not a merge decision.** Check the merge gate yourself.
- **Unwatch when you hand off.** A watched thread stays in Working and out of the user's inbox. When you stop (ready, blocked, or asking the user a question), call `unwatch_pull_request` first. A merge or close ends the watch on its own.
- **"Stopped watching, could not read it"** usually means GitHub's rate limit is used up. Run `gh api rate_limit --jq .resources.graphql` before you watch again. If `remaining` is near 0, wait for `reset` with one background command, then watch again. Never watch again in a tight loop.

### Everywhere else: `pr-wait`

Wait with `scripts/pr-wait` from this skill's directory (use its absolute path).

```bash
pr-wait <pr> [--repo owner/name] [--until ready|green|any-change]
```

It prints one line per real event. It exits 0 when the `--until` condition is met or the PR merges, 1 when it needs you (a required check failed, conflicts, unresolved threads, PR closed), and 2 on bad input.

- `ready` (default): required checks green, Greptile or Macroscope reviewed the head, and no unresolved threads. Use this to babysit.
- `green`: required checks only. Use it when the repo has no Greptile or Macroscope.
- `any-change`: exit on the first event.

In Claude Code, run it with the Monitor tool (`timeout_ms: 3600000`), so each line wakes you. Without a monitor, run it as one long command. It ends on its own.

Start it again after you push, after you handle an exit 1, and after a resume. It remembers what it already reported, so nothing that arrived in between is lost. If it says another pid already watches the PR, do not start a second one. Kill the old one only if its events do not reach you.

With either watcher: when an event needs no action, end your turn without a message. Never post or say "still waiting".

## GitHub rate limits

`gh pr create`, `gh pr view`, and `gh pr checks` use GraphQL. When GraphQL is used up, the REST limit is separate and usually still has room. Use `gh api repos/<owner>/<repo>/pulls/<n>` to read a PR, and `gh api repos/<owner>/<repo>/commits/<sha>/check-runs` for checks.

## Reviews

Only act on checks and comments newer than the latest push. Verify every bot finding against the source before changing code. Fix real findings and CI failures, distinguish repository failures from infrastructure flakes, and reply with a written reason when dismissing false positives.

If the repo has `.macroscope/check-run-agents/*.md`, read those rules before you reply to a Macroscope finding. Its findings cite them.

CodeRabbit is advisory. Treat its findings like any other finding, but never wait for it and never hold a merge for it.

If a review bot leaves feedback you believe is not worth addressing, reply with a written reason and resolve the comment. Use the `leaving-pr-comments` skill for every comment posted on the user's behalf.

Screenshots and videos help as well, when you have a way to upload them.

### Three Review Pillars (concrete handling)

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
Inspect findings in `/tmp/ocr_pr_${PR_NUMBER}.txt`:
- Target actionable findings with severity `critical`, `high`, or `medium` (discard `low` / cosmetic style nits).
- Extract concrete fixes (bugs, security risks, missing null guards, error handling, performance regressions).

#### C. Fetch Remote Review Comments (Bots & Humans)

```bash
gh pr view <PR_NUMBER> --json reviews,comments
gh api repos/<owner>/<repo>/pulls/<PR_NUMBER>/comments --paginate --jq '.[] | {id, path, line, author: .user.login, type: .user.type, body: (.body[:500])}'
```

Filter:
- **Bot authors**: login ends with `[bot]` or author type is `Bot`.
- **Human authors**: everyone else — same concrete-only treatment, never reply-argue.
- Only `OPEN` PR threads; skip comment IDs already addressed earlier in this run.
- Prefer actionable items: fenced ```suggestion blocks / patch hunks and explicitly named asks.

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

## Base branch and merging

Keep an eye on changes to `main` and rebase when needed. `pr-wait` reports when new base commits touch this PR's files, and when the PR becomes BEHIND or DIRTY. `watch_pull_request` reports conflicts only, so check for BEHIND yourself before you call the PR ready.

If an overlapping PR makes this one obsolete, stop monitoring, report it to the user, and ask before closing the PR unless closure was explicitly authorized.

If nothing has changed, stay quiet rather than posting filler comments. Stop when `pr-wait` exits 0, or in T3 Code when the merge gate passes on the latest head. Merge only when the user explicitly requested it; otherwise report that the PR is ready. Right before a merge, run `git fetch` and check the PR again. Never merge when it is BEHIND or DIRTY, or when base commits that landed after the last green run touch this PR's files. Rebase, push, and wait for green again.

## Workflow (bounded loop, non-T3 fallback)

Limits: poll every ~2 min, max ~30 min (~15 polls). Exit early on green / hard fail / complex conflict.

Each poll:
```bash
git fetch origin main
gh pr view <PR_NUMBER> --json state,mergeStateStatus,url
gh pr checks <PR_NUMBER> --json name,state,conclusion
git rev-list --count HEAD..origin/main
```
Also re-run the Review pillars each poll.

Decide:
- **New concrete review suggestions**: apply per above, push, continue loop.
- **Behind main** (`rev-list` count > 0): rebase + push, then continue loop.
- **Checks all pass + not behind + no unapplied concrete review items**: exit SUCCESS, go to Report.
- **Checks pending or reviews pending**: wait ~2 min, next poll. If still pending at 30 min cap → exit TIMEOUT, report.
- **Any check failed**: STOP, go to Report as FAILED. The review-fix path is the only code-edit exception — do not invent fixes for red CI.
- **No checks configured**: treat as SUCCESS if not behind and no pending review items.
- **`gh pr checks` errors**: warn and continue to next poll.

**Rebase conflict policy:**
1. `git diff --name-only --diff-filter=U` — list conflicted files.
2. Trivial only (whitespace, import order, non-overlapping additions): resolve, `git add`, `git rebase --continue`.
3. Otherwise ABORT immediately: `git rebase --abort`, STOP, report files + both-side changes.

Always abort rebase and report on:
- More than 3 files conflicted
- Conflicts in test files, `package.json`, lock files, CI configs
- Any doubt about preserving intent

## Report

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
- **Code edits allowed ONLY for concrete reviewer-provided fixes.** Never freelance fixes for red CI.
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