# texure-implementation-loop

TEXURE PROJECT ONLY. The per-ticket implement + verify + review + land loop for texure, tailored from docs/agent-test-loop.md, docs/blackbox-plan.md, docs/linting-plan.md, docs/lld-ci.md, docs/runbook-device.md, docs/guardrails.md. What to build belongs to grilling/kickoff; how tickets flow belongs to wayfinder-runner. This skill is how ONE ticket gets built and proven.

## Phase 0 — Intake

```bash
gh issue view <N> --repo parth5012/texure
```

Then read, in order: `AGENTS.md` → `docs/guardrails.md` → `docs/behavior-spec.md` (rows your ticket touches) → `docs/bridge-contract.md` (if wire-level) → your tier ceiling (blackbox-plan group tables). Derive the acceptance checklist; ambiguity → clarify on the ticket, never guess.

Skills to load before code: Rust patterns (crates/*), Android patterns (android/*), tdd, codebase-design for seams.

Branch: `git checkout -b issue-<N>-<slug>`; in wayfinder stacks: `wf/<map>-<ticket>-<slug>` based on parent branch (≥5 code-changing AFK tickets → stacked-PR mode).

## Phase 1 — RED (docs gate first, then tests first)

Order: 1) docs/behavior rows → 2) blackbox → 3) unit → 4) code.

1. Every behavior row the ticket touches gets mapped to a blackbox test ID (`BB-<group><n>`); a missing mapping is a suite bug, fix the suite first.
2. Scenario files go in `tests/blackbox/scenarios/*.json` (same JSON as FakeBridge scenarios), schema in `docs/blackbox-plan.md` DSL section.
3. Unit tests at module seams (contract structs, tree serializer, rev guard, error translation). Android unit = Robolectric, no device.
4. **Watch reds fail.** Capture red output to `tmp/evidence/<ticket>/red-run.txt`. Tests passing before implementation exists = wrong tests, rewrite.

## Phase 2 — GREEN (minimum)

Implement only what flips the reds. Throwaway lives ONLY in `android/sample`. No refactors parked outside a comment/issue. Keep a `HANDOFF: INTENT` paragraph (what changed + why) for review agents.

## Phase 3 — Verify gauntlet (per docs/agent-test-loop.md)

| Tier | Command | Live when |
|---|---|---|
| L0 | `cargo run -p texure-lint` + `cargo clippy` + `gradlew lint` | lint crate: #5 P0 |
| L1 | `cargo test --workspace` + `gradlew testDebug` | first crate |
| L2 | `cargo run -p texure-blackbox -- --target mcp-fake --report out.json` | #3 P0 |
| L3 | `cargo run -p texure-blackbox -- --target http --url <phone-ip>:<port>` | #1 |
| L3 | `gradlew :android:sample:connectedDebugAndroidTest` | device harness |

Rules:
- Tier ceiling per ticket comes from the blackbox group table; climbing above ceiling is OPTIONAL depth, never required.
- Failure = root cause (logs/tests) → fix → RE-RUN the whole gauntlet from L0. Never rerun only the failed tier.
- Contract touch = `schema_version` bump + BOTH bridge-contract.md + DECISIONS.md entry. Tool list frozen at 6; adding tools is a DECISIONS gate.
- Red device run → evidence bundle (`tmp/evidence-<date>-<step>/`: logcat ≥200 lines + screen.png + tree.json + step.md) → BLOCKED comment on ticket. Never improvise device debugging; device unreachable = park L3, land through L2 with leftovers stated.
- Bounded: 3 full-gauntlet failures → stop, escalate with bundle + one recommended unblock.
- Perfgym note: ast-grep rules execute via perfgym's linter while the 2-week dogfood window runs, else `sg scan` (see linting-plan).

## Phase 4 — Adversarial review (parallel lanes)

1. **Attack-brief reviewer** (CodeReviewer-like subagent): "Prove this diff fails, row-by-row against the touched behavior rows and the acceptance checklist; attack: file+line, why wrong, reproduction; list unconfirmed items with what you checked. Block-only." Fixes: lint/type auto-fix; logic findings get tests then fixes at root.
2. **Spec conformance**: diff vs the ticket's acceptance criteria list row by row; missed requirements are blockers.
3. **ocr-review**: `ocr review` (or ocr_review tool) on the commit/branch for structured line findings.
4. **openqodex**: security/secret/dependency scanners on the changed files before any push.
5. Triage: MUST-fix now vs park verbatim in the ticket comment for review. MUST-fix → root fix → back to Phase 3 (bounded).

## Phase 5 — Ship

1. Atomic commits: what+why + verification evidence + ticket ref.
2. `checkpoint` PR: push, `gh pr create`, link full URL in chat/files; in maps, one PR per ticket stacked (base = parent branch), parent PR linkage stated per wayfinder rules.
3. Bots: comment `@coderabbitai review` + parth pr bot `/review`; concrete findings get a proving test + real fix, then Phase 3 re-run.
4. `babysit-pr`: rebase-if-behind, poll checks, apply concrete fixes; NEVER merge (landing only via `merge-pr` or the human); restack descendants on any parent move; conflict >3 files → stop leg, report.

## Phase 6 — Close out

- Files: `LOG.md` session entry; `LEARNINGS.md` if edge case; `TECH_DEBT.md` for deferrals; `DECISIONS.md` for any tradeoff; docs/repo-map command table + status column flips.
- Final report (ticket resolution comment + chat):

```
VERIFY: L0 pass · L1 pass · L2 pass(<n> scenario groups or n/a) · L3 <pass|blocked:<reason>|n/a>
EVIDENCE: <bundle path or none>
FLIPS: <test IDs flipped red→green, or none>
PR: <full URL>
REVIEW: <fixed findings> | <parked findings>
NEXT: <single next action>
```

## Standing rules
- Never report done without running the gauntlet for real; skipped tiers said plainly
- tmp/ for evidence and throwaway; never commit bundles to main
- One ticket per loop; ADB stays setup-only (G4); release builds never contain bridge code (G1); wayfinder HITL tickets are NOT loop material — those wait for the human
