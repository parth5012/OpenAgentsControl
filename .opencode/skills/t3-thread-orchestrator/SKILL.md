---
name: t3-thread-orchestrator
description: "Orchestrate multiple T3 Code threads (one per feature/wayfinder map) from a single agent: launch worktree-isolated threads, run them in parallel or sequence, wait for completion, aggregate PRs/results, and hand off to merge. Use when user says spawn threads, orchestrate features, run multiple maps, parallel wayfinder, multi-thread."
argument-hint: "<feature-list: map numbers or prompts> [--parallel|--sequential] [--base <branch>]"
---

# T3 Thread Orchestrator

Drive several independent features (wayfinder maps, tickets, or free-form prompts) concurrently or sequentially using T3 Code threads, each in its own worktree, then aggregate results and hand off to merge. One orchestrator thread, many worker threads.

Inspired by the pattern: spawn a thread per map with `$wayfinder-ship <N>, file and babysit`, wait for all, report, then merge on request.

## When to use

- Multiple independent wayfinder maps / features to run in one session
- You want each feature isolated in its own worktree and PR(s)
- You want parallel execution to save wall-clock time
- You want a single aggregated report and a single merge handoff

## When NOT to use

- Single feature → use `wayfinder-ship` / `wayfinder-runner` directly
- Features with hard ordering/dependencies → run sequentially (this skill supports `--sequential`)
- No T3 Code available → fall back to in-process subagents (slower, shared checkout)

## Inputs

Parse `$ARGUMENTS` into:
- **Feature list**: comma/semicolon separated. Each item is either a wayfinder map number (e.g. `403`) or a free-form prompt (quote it).
- **Mode**: `--parallel` (default) or `--sequential`.
- **Base branch**: `--base <branch>` (default `main` or the repo's default).
- **Per-feature command**: default `$wayfinder-ship <N>, file and babysit` for map numbers; for free-form prompts, use the prompt verbatim.
- **Merge policy**: default "report only, do not merge" (merge only if user explicitly asks afterward).

## Pre-flight

1. `gh auth status` and `git rev-parse --is-inside-work-tree`.
2. `t3_thread_list` / `orchestrator_capabilities` to confirm T3 Code is available and which provider/model to use.
3. Resolve project + default base branch (`git symbolic-ref refs/remotes/origin/HEAD` or `main`).
4. For each map number, verify it exists (`gh issue view <N>`).

## Workflow

### Step 1 — Plan the thread set

For each feature, derive:
- `title`: short label (e.g. `Wayfinder 403`, `Feature: auth refactor`)
- `branch`: `t3/<short-slug>-<index>` (unique per thread; T3 may also auto-name — prefer explicit to avoid collisions)
- `workspaceStrategy`: `{ "type": "worktree", "baseRef": "<base>", "branch": "<branch>", "startFromOrigin": false }` (use local base commits)
- `message`: the per-feature prompt (e.g. `$wayfinder-ship 403, file and babysit`)

Present the plan (titles + branches + mode) and confirm before launching if more than ~6 threads or any free-form prompt is ambiguous.

### Step 2 — Launch threads

- **Parallel**: launch all threads in one batch via `t3_thread_launch` (or `create_threads` if sharing the caller's checkout — only when worktrees aren't needed). Capture each returned `threadId`. Retain them; do not retry a launch without checking `t3_thread_list` first (launch has no idempotency key).
- **Sequential**: launch thread 1, `t3_thread_wait` for completion, then launch thread 2, etc. Use when features depend on each other or share a branch.

For each launch, set `workspaceStrategy` explicitly so each thread gets its own worktree (prevents git state clobbering). Pass the prompt in `message`.

Record a table: `threadId | title | branch | worktreePath | status`.

### Step 3 — Wait & monitor

- For parallel: `t3_thread_wait` on each threadId (can wait in parallel where supported; otherwise poll with bounded waits, ~2 min, cap ~60 min). Do not busy-loop; use thread wait.
- For sequential: already waited per thread.
- If a thread fails/stalls: capture its last assistant message / error, mark that leg FAILED, continue with independent legs.
- If a thread requests human input (HITL): surface it to the user and pause that leg; continue others.

### Step 4 — Aggregate results

Once all threads complete (or failed), for each thread:
- `t3_thread_read` to get the final assistant report (PR URLs, branches, checks, parked findings).
- Extract: PR numbers/URLs, branch names, CI status, parked items.

Produce an aggregated report (see template). Link threads as `[title](t3-thread://v1/<threadId>)`.

### Step 5 — Merge handoff (only on explicit user request)

If the user says "merge all" / "land them":
- For single-PR threads: run `merge-pr` per PR in a sensible order (base-branch first).
- For stacked threads: merge bottom-up, retargeting child bases as parents land.
- Otherwise: state "NOT MERGED" and hand off to `merge-pr` / user.

Never merge without explicit user instruction. `babysit-pr` should already have run inside each worker thread (the per-feature prompt includes "file and babysit").

## Report template

```
T3 THREAD ORCHESTRATION — COMPLETE
==================================

Mode: parallel | sequential
Base: <branch>
Threads: N (completed: X, failed: Y)

| # | Thread | Feature | PR(s) | CI | Status |
|---|--------|---------|-------|----|--------|
| 1 | [title](t3-thread://v1/<id>) | #403 | #440 | green | done |
| 2 | [title](t3-thread://v1/<id>) | #427 | #441..#446 | green | done |

Aggregated PRs: <list with URLs>
Parked findings: <list or none>
Failed legs: <list or none>

Status: NOT MERGED (unless user requested merge).
Next: say "merge all" to land, or review individually.
```

## Important rules

1. **One worktree per thread** — always set `workspaceStrategy` with `type: "worktree"`; never let two threads share a checkout.
2. **Unique branch names** — avoid collisions; include map number / slug.
3. **Don't retry launches blindly** — check `t3_thread_list` before re-launching (no idempotency key).
4. **Bounded waits** — cap total wait (~60 min); on timeout, report which threads are still running and offer to continue later.
5. **Surface HITL** — if a worker needs human input, pause that leg and tell the user; don't auto-decide.
6. **Aggregate, don't dump** — return PR URLs, statuses, parked items; not raw tool traces.
7. **Never merge without explicit ask** — hand off to `merge-pr`.
8. **Parallelize independent legs** — launch all at once when mode is parallel.
9. **Continue on partial failure** — one failed thread doesn't cancel the others.
10. **Link threads** — use `[title](t3-thread://v1/<threadId>)` so the user can open them.

## Invocation

```
/t3-thread-orchestrator <feature-list> [--parallel|--sequential] [--base <branch>]
```

Examples:
```
/t3-thread-orchestrator "403, 427" --parallel
/t3-thread-orchestrator "403" "427" --sequential --base main
/t3-thread-orchestrator "refactor auth module; add rate limiting" --parallel
```

With no arguments, ask the user for the feature list and mode.