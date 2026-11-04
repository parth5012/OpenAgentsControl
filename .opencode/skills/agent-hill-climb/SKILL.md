---
name: agent-hill-climb
description: Build deterministic, hill-climbable metric systems around any project so coding agents can improve it loop after loop — verify harness, ratchet gates, agent evals, scorecard ledger, and a one-deficiency-per-cycle improvement loop. Use when the user wants a repo to be continuously improvable by agents, a quality/perf ratchet, regression gates, self-improvement loops, or says "make this hill Climbs", "ratchet", "code health gate", "improvement loop", or "agent scorecard".
argument-hint: "[init | audit | tighten | loop] [--project <path>]"
metadata:
  version: 1.1.0
  author: parth5012
  sources: "references/case-studies-and-loops.md; tmp/deep-research/deterministic-agent-metric-systems.md; Theo Browne (@t3dotgg) T3 Code, tstack, sol-loop, babysit-pr; Ralph Driven Development (ghuntley, Luke Parker); GitHub Billing Team (Brittany Ellich); Production-Safe Loops (Daniel Nwaneri); AlphaEvolve arXiv:2506.13131; RLEF arXiv:2410.02089"
---

# Agent Hill-Climb

Wire a repo with deterministic score(s), a monotone ratchet, and an append-only ledger, so any coding agent session can **only** produce evidence-backed forward movement. Then run the improvement loop.

Core contract (memorize and enforce):

> **No improvement may be claimed without a before/after row in the scorecard backed by a deterministic check. The ratchet only moves forward on evidence, and frozen invariants may only tighten, human-merged.**

## When to use

- "Make my repo improvable/auditable by agents over multiple sessions"
- Setting up quality gates, ratchets, scorecards, agent eval suites, or a Ralph/Karpathy-style improvement loop
- After `init` on a project, prefer calling `loop` each follow-up session

## Modes

### 1. `audit`

Read the repo (package manager, test runner, linter, typechecker, CI config). Produce a short report with:

1. **Does `make verify` / equivalent exist?** A single command, clean env, deterministic exit code. Nothing else works without this — build it first if missing.
2. **What is already countable today** (tests, lint warnings, type errors, TODOs, bundle size, benchmark ms, eval pass rate).
3. **The 3 highest-value ratchets** to install first, ranked by (deficiency severity × ease of counting).
4. **Oracle ladder fit**: which decision-relevant logic deserves property-based (Hypothesis/fastcheck) tests next, and which 5-10 invariants (if any) deserve formal specs (TLA+/Dafny) — only for concurrency/stateful/pure-critical code.

Present the report; get the user's pick before scaffolding (Tier 2 in the AI-OS consequence model: reversible, but user's repo).

### 2. `init`

Scaffold from `templates/` into the project, in this order:

1. `scripts/ratchet.py` + `ratchet.json` — the counting ratchet (see The Ratchet). Seed limits from the **current measured values** — the first run must pass; the hill is tightened later, never relaxed.
2. **Verify harness**: a `verify` command (Makefile/npm script/justfile) that runs: tests + typecheck + lint + ratchet, exits 0/1 deterministically. It is the one command agents and CI both run.
3. **CI gate**: wire the same `verify` into the PR workflow (template `ci-gate.yml`). Gate the *diff/new code* where possible (SonarQube "new code" principle) so legacy debt doesn't block the hill.
4. **Ledger**: `scorecard.csv` (+ optional `revert_log.csv`) and ensure `LOG.md`/`LEARNINGS.md` update on every improvement session (append-only; never edit old rows).
5. Commit the scaffold as one atomic commit: `ratchet: install hill-climb scaffold (counts only, no tightening)`.

Rules of the scaffold:
- The ratchet **must run locally with exactly what CI runs** — one command, no drift (a hill-climb on the CI's version while local passes is superstition, not progress).
- Seed limits = today's counts. Do NOT tighten during init; that is `tighten`'s job so improvements land as separate, attributable commits.

### 3. `tighten`

One ratchet at a time, evidence-first:

1. Run the counters; pick ONE metric (violations first, then zeros/scorecard gaps per the unmeasured=0 rule below).
2. Fix the code (or add the missing instrumentation — a metric you cannot compute yet **scores 0 and becomes the top-priority deficiency**, which is how the system builds its own eyes).
3. When the live count beats the stored limit, tighten `ratchet.json` in a standalone atomic commit: `ratchet: <metric> <old>→<new> (needs no code change)`. Never mix limit-tightening into feature commits.
4. If a metric cannot improve (equivalent mutants, flaky signals), record why in `LEARNINGS.md` — do not quietly loosen.

### 4. `loop` — the improvement session (Karpathy/Ralph hybrid)

Run per this procedure; it is the answer to "just improve my project":

```
SETUP
- Branch loop/<short-id> from base. Read scorecard.csv + LEARNINGS.md (cold re-entry).
- Confirm verify passes on the branch tip; if not, fixing green comes before anything.

CYCLE (one per session-hour, ONE deficiency at a time)
1. Pick ONE deficiency. Write it + the target metric row BEFORE acting
   (selection order: invariant violations > unmeasured(0) dims >
    ratchet headroom > anything else. Multi-goal cycles are forbidden
    — they destroy attribution, which is the whole point of the ledger).
2. RED: make the deficiency observable (failing test / property / failing gate).
3. GREEN: fix it; verify must pass.
4. Score: add the before/after row to scorecard.csv
   (date, deficiency, metric, before, after, verify-hash, files). Never claim
   improvement without this row, backed by real command output — never by narration.
5. Ratchet check: composite/limit improved?
   - Yes → one commit `loop(N): <deficiency> | <metric> a→b`
   - No  → revert the cycle's code changes, KEEP the row marked
           `reverted` (reverted rows are evidence, not shame),
           log why in LEARNINGS.md.
6. Shift-left: every defect found by an expensive check this cycle must be
   converted into a cheap perpetual gate (lint rule, guard test, ratchet count)
   before the cycle counts as complete. Expensive lessons, paid once, enforced forever.

WRAP-UP (unconditional, time-boxed)
- verify passes → print scorecard trajectory (last 5 rows).
- Append LOG.md entry (status, deltas, verification evidence — never "done" without verification).
- Externals: any side effects (deploys, tiers-2 actions) must be listed with
  how they're reconciled; nothing external without Parth's approval (Tier 3).
- End with the single recommended first action for the next session.
```

Anti-goals (write into project's AGENTS/CLAUDE.md on init, they are the loop's leash):
- Do not edit CI workflows, `ratchet.json`, or test corpora **within** a work cycle.
- Do not delete/`skip`/tautologize failing tests; do not weaken lint/type serverity to turn a count green.
- Do not optimize more than one metric per session.

## The Ratchet (design spec, embedded in templates/ratchet.*)

- Each rule: `name`, `kind: max|min`, and an extractor — either `pattern+glob` (count regex matches, e.g. TODO/FIXME, deprecated calls) or `command` (run a tool, parse an integer from stdout: mypy errors, pytest-failures, bundle KB),
- Behavior: count current values; `max` rule fails when current > limit; `min` fails when current < limit (test counts, mutated-conditions killed).
- Output machine-parsable lines `RULE <name>: <current>/<limit> [OK|FAIL]` so agents can score without screen-scraping.
- Prioritize **diff-scoped** modes on PRs (only counts introduced by the change) and full runs nightly; incremental mutation testing (Stryker incremental/mutmut) beats raw coverage — coverage lies, survived mutants don't.

## Oracle escalation ladder (recommend, don't gold-plate)

1. Tests + typecheck + lint (deterministic exits) — always.
2. **Diff-scoped mutation score** on changed lines — next best, anti-tautology.
3. **Property-based suites** over decision logic (invariants, metamorphic, differential) — one of the highest-signal agent oracles (Anthropic R&D finding).
4. **Frozen agent evals** (`pass@k` over a versioned corpus) for anything LLM-facing — frozen per session, hash recorded alongside each score.
5. **Formal verification** (TLA+/Dafny/Lean) on the 5-10 critical invariants only.

## Anti-blueprint (skip in this order, never in this order along the path)

1. LLM-judge pipelines before deterministic gates. Judges noise-flip decisions and are the softest self-gaming surface. If judges are used at all: trend-only, frozen prompt, hash-logged.
2. Anything before a green `verify` harness.
3. Strict absolute thresholds that punish legacy debt — gate **new code** so the hill is always climbable without a big-bang.
4. Multi-metric optimization per cycle (attribution collapse).
5. Editable ratchet/CI/corpus mid-session (Goodhart is the boss fight — freeze then tighten).
6. Leting the same author self-approve: cycle changes must pass a differently-prompted reviewer pass before promote; the author is the worst-positioned checker.

## Field-Tested Loop Rules (Theo Browne / Enterprise / Community)

Detailed case studies and engineering teardowns are documented in `references/case-studies-and-loops.md`. Enforce these practical rules in every loop:

1. **Cross-Model / Reviewer Split (Theo Browne `sol-loop` pattern)**: Author agent must never be its own reviewer. Hand diffs off to an independent model (GPT Sol, Codex) or bot suite (OCR, CodeRabbit, PR-Agent).
2. **Strict Review Budget (Theo Browne)**: Cap review loops at **3 rounds maximum** (extendable to 5 only for critical security/auth/data loss). Exit immediately if only nits remain. Stop circular churn early.
3. **Erect Signs in `AGENTS.md` (Ralph Driven Development)**: When an agent fails, don't just patch the code—add an invariant sign to `AGENTS.md` ("DON'T JUMP"). Shift-left failure prevention so the loop never rediscovers the same bug.
4. **File-Scoped Micro-Batches (GitHub Billing Team)**: Bounded to 1 file or 1 directory per cycle. Reject broad 50-file prompts; large diffs collapse review quality and human trust.
5. **Stateless Iteration Leashes (Reddit / Latent Space community)**: Prevent context window poisoning by resetting or pruning context across failed attempts. Pass only `[Goal, Clean Git Diff, Test Error Output]`.
6. **Pre-Flight Circuit Breakers (Daniel Nwaneri)**: Check hard turn and token limits *before* calling the LLM. Trips raise uncatchable exceptions to prevent runaway invoices ($16k–$50k horror stories).
7. **CLI > MCP (Luke Parker)**: Prefer standard CLI tools with `--help` and exit codes over complex MCP schemas to conserve tokens and reduce hallucinations.
8. **Non-Polling Event Waking (Theo Browne `babysit-pr`)**: Never run busy-wait terminal loops (`while true; sleep 5`). Use push-based subscriptions (`watch_pull_request`).

## Failure-mode table (diagnose the loop by symptom)

| Symptom | Cause | Fix |
|---|---|---|
| "improved" with no evidence | claim from narration | no score row, no commit |
| flappy CI, flaky scores | shared mutable state / timing | deterministic seeds, pinned versions, diff-scope |
| score improves, user says it got worse | metric ≠ intent | add a chain-indicator metric and re-gap; keep violation caps |
| same fix every session, forgets | ledger not read/appended | enforce cold-start read; append-only rows |
| green but behavior wrong | test gaming | mutation gate + reviewer pass |
| session thrash across goals | multi-goal cycles | one deficiency per cycle, written first |

## File map

```
SKILL.md                          <- this file
references/case-studies-and-loops.md <- comprehensive field reports, Theo Browne patterns, community practices
templates/ratchet.json            <- seeded rule manifest (limits = current counts)
templates/ratchet.py              <- counters-executor (pattern + command rules, parseable output)
templates/ci-gate.yml             <- GitHub Actions wiring for `verify`
templates/scorecard.csv           <- append-only before/after ledger
templates/loop-prompt.md          <- copy-paste session prompt for `loop`
```

Sources of the methodology are cited in `archives/deep-research/deterministic-agent-metric-systems.md` inside each project's `tmp/` if the user wants the receipts.
