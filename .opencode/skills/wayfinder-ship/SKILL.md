---
name: wayfinder-ship
description: "Full-cycle wayfinder ship: run a wayfinder map end-to-end, self-review each AFK ticket until clean (≤3 iterations), file a single PR or a stacked PR set by AFK count, then babysit every PR (OCR + CodeRabbit + parthpr bot) to green. Never merges. Use when user says ship wayfinder map, run and ship map, wayfinder to PRs."
argument-hint: "<map-number-or-url>"
---

# Wayfinder Ship

Full lifecycle for a wayfinder map: execute it (HITL first, AFK second), self-review each AFK ticket's diff until clean, file PRs (single or stacked by AFK count), then babysit every PR to green with OCR + CodeRabbit + parthpr bot. **Never merges** — hands off to `merge-pr`.

Companion skills: `wayfinder-runner` (map execution semantics), `code-review`, `ocr-review`, `checkpoint`, `babysit-pr`, `merge-pr`, `pr` (PR body template), `grilling`.

## When to use

- A wayfinder map exists and you want it executed, reviewed, and shipped to green PRs in one run
- You want every filed PR babysat (not just stacked sub-PRs)
- You want a self-review loop before filing, not just the per-ticket review gate

## When NOT to use

- Map only has HITL tickets and no code changes → use `wayfinder-runner`
- Work isn't committed yet / no map → use `checkpoint` / `wayfinder-runner`
- Ready to land → use `merge-pr`

## Ticket types recap

| Type | Mode | Strategy |
|------|------|----------|
| `research` | AFK | spawn research agent; no code → skip code self-review |
| `task` | AFK or HITL | AFK → coder agent; HITL → Phase 1 with human |
| `prototype` | HITL | Phase 1 with human |
| `grilling` | HITL | Phase 1 with human |

## Pre-flight (STOP on any failure)

```bash
gh auth status
git rev-parse --is-inside-work-tree
ocr_health   # or: ocr llm test
```

Also resolve the map: `gh issue view <MAP>` must return a `wayfinder:map`-labeled issue with a `## Destination`. If not found, list candidates:

```bash
gh issue list --label "wayfinder:map" --state open --json number,title
```

Capture `OWNER/REPO`, `MAP_NUMBER`, `MAP_URL`, `DESTINATION`, `NOTES`.

## Phase 1 — HITL (human present)

Follow `wayfinder-runner` Phase 1 exactly:

1. Load map + child tickets; compute frontier (open, unblocked, unclaimed, topo-sorted).
2. For each HITL ticket (`prototype`, `grilling`, HITL `task`): claim → collaborate with human (agent assists, never decides) → record resolution comment → close → append to map `## Decisions so far` → recompute frontier. Loop until no HITL remain.
3. Notify human: Phase 1 complete; AFK tickets remain; hand off to autonomous agents.

**Human decides in Phase 1. Agent never replaces human judgment.**

## Phase 2 — AFK (autonomous)

### Threshold decision (re-check on every recompute)

Count open AFK **code-changing** tickets (research tickets that change no code are excluded from the stack count):

- **< 5 code-changing AFK → Single-PR mode**: implement each ticket, self-review, commit per ticket on one branch, file one PR at the end via `checkpoint`.
- **≥ 5 code-changing AFK → Stacked-PR mode**: one branch + one sub-PR per ticket (base = parent branch), stacked with plain `git`/`gh`.

### Per AFK ticket loop

For each AFK ticket in frontier order:

#### A. Claim
```bash
gh issue edit <N> --add-assignee @me
```

#### B. Dispatch agent
Build prompt from ticket `## Question`, map `## Decisions so far`, map `## Notes`. Use `general` subagent (one ticket per dispatch — never batch). For research tickets, ask the agent to investigate and post a resolution comment, no code. For task tickets, implement minimal focused changes.

#### C. Self-review loop (code tickets only; research tickets skip)

Run up to **3 iterations**. Each iteration:

1. `code-review` skill on the ticket's diff (`git diff` for single mode; `git diff <parent>...HEAD` for stacked).
2. `ocr-review` skill on the same diff (critical/high/medium only; discard low).
3. If both clean → exit loop (GREEN).
4. If findings → apply only **concrete** fixes (named asks, suggestion blocks, obvious null guards matching style). Commit the fix batch with message `fix(<ticket>): address self-review finding on <file>`. Increment iteration.
5. On iteration 3 with remaining findings → **park them verbatim** (file + line + finding + recommendation) in a ticket comment; do not keep looping.

**Park (never code):** design/architecture opinions, ambiguous asks, conflicting asks, anything in tests/lockfiles/CI configs beyond trivial, anything needing new deps/migrations. Parked items are quoted verbatim with source.

#### D. Record resolution
```bash
gh issue comment <N> --body "<resolution summary>"
gh issue close <N> --reason completed
```
Append to map `## Decisions so far`: `- [<ticket name>](link) — <one-line resolution>` (include sub-PR URL in stacked mode).

#### E. Commit / file

- **Single-PR mode:** `git add -A; git commit -m "<ticket name> (#<N>)"` on the accumulating branch.
- **Stacked-PR mode:** branch off parent, commit, push, file sub-PR (see below).

#### F. Recompute frontier
After close, new tickets may unblock. Re-check the threshold; if newly unblocked push remaining AFK count to ≥5, switch to stacked mode for the rest (never collapse an already-started stack).

### Stacked-PR mode details (≥5 AFK)

Plain `git` + `gh`, no external stacking tool. One branch + one PR per ticket, topo order, child base = parent branch.

Branch naming: `wf/<MAP>-<N>-<short-slug>`.

Per ticket (in topo order):

1. **Branch:** `git checkout -b wf/<MAP>-<N>-<slug> <parent-branch>` (first parent = `origin/main`).
2. **Implement** only that ticket's scope (minimal).
3. **Self-review loop** (Step C) on `git diff <parent>...HEAD`.
4. **Commit + push:** `git add -A; git commit -m "<ticket name> (#<N>)"; git push -u origin <branch>`.
5. **File sub-PR** via `checkpoint` semantics, but base = parent branch:
   ```bash
   gh pr create --base <parent-branch> --head <branch> \
     --title "<ticket name> (#<N>)" \
     --body "<generated via pr skill template>"
   ```
   PR body MUST use the `pr` skill template (`## Summary`, `## Evidence`, `## Merge Danger`). Never duplicate an existing PR — refresh via `gh pr edit`.
6. **Record resolution** (Step D), including sub-PR URL in ticket close comment and map line.
7. **Next ticket:** branch off the branch just pushed (stack grows).

**Idempotency:** before filing, check `gh pr view <branch>`; if an open PR exists, refresh it instead of creating a duplicate.

### Single-PR mode tail

After all AFK tickets: file/refresh one PR via `checkpoint` (`gh pr create --base main --head <branch>`), PR body via `pr` skill template. Then babysit that PR.

## Babysit every filed PR

After filing (single or all sub-PRs), run `babysit-pr` on **each** PR:

- **Stacked:** bottom-up (bottom sub-PR first). Restack descendants whenever a parent moves (`git rebase <parent>; git push --force-with-lease` on each descendant before babysitting the next up).
- **Single:** babysit the one PR.

Per `babysit-pr` rules: poll checks, rebase-if-behind, apply concrete review fixes from OCR/CodeRabbit/parthpr/humans, never merge, never resolve/dismiss threads, never freelance red-CI fixes, park ambiguous asks verbatim, cap ~30 min.

**Hard fail / complex conflict (>3 files, test/lock/CI files, unclear intent):** abort that rebase, STOP that leg, report files + both-side changes on the sub-PR and its ticket, continue independent legs.

**Do not merge mid-stack.** Landing is bottom-up via `merge-pr` or manual human merge only after the sub-PR below is merged and the child's base is retargeted.

## Final report

```
WAYFINDER SHIP — COMPLETE
==========================

Map: #<MAP> — <title>
Destination: <destination>

Phase 1 — HITL resolved (N):
• [<ticket>](link) — <one-line resolution>

Phase 2 — AFK resolved (M):
• [<ticket>](link) — <one-line resolution>  [self-review: clean | parked K]

Self-review summary:
  iterations used: X/Y tickets, parked findings: Z (quoted in ticket comments)

PRs filed & babysat:
| # | PR | Ticket | Base → Head | CI | Review fixes applied | Parked |
|---|----|--------|-------------|----|----------------------|--------|
| 1/<total> | #<pr> (link) | [<ticket>](link) | <parent> → <branch> | passed/failed/pending | n from OCR/CR/parthpr/human | m |

Stacked: restacks performed: <list or none>

Status: NOT MERGED. Hand off to `merge-pr` (bottom-up for stacks) or manual merge.
Action needed: <any parked findings / failed checks / timeouts>
```

## Important rules

1. **HITL first, AFK second** — never start Phase 2 while HITL tickets remain.
2. **Human decides in Phase 1** — agent assists, never replaces.
3. **One ticket per agent dispatch** — never batch.
4. **Claim before work** — assign to self before dispatching.
5. **Recompute frontier after every close** — closing unblocks others.
6. **Refer to tickets by name** — never bare `#42`.
7. **Minimal changes** — implement exactly what the ticket asks.
8. **Self-review cap = 3** — park the rest verbatim; never infinite-loop.
9. **Babysit every PR** — single and stacked.
10. **Never merge** — `merge-pr` or human only.
11. **Never freelance red-CI fixes** — only concrete reviewer asks.
12. **Never force-push** — `--force-with-lease` only after rebase.
13. **Never auto-resolve complex conflicts** — abort and report.
14. **PR body via `pr` skill** — every PR (single + sub) uses the template.

## Invocation

```
/wayfinder-ship <map-number-or-url>
```

With no argument, list open wayfinder maps:

```bash
gh issue list --label "wayfinder:map" --state open --json number,title
```

Then ask which to run.