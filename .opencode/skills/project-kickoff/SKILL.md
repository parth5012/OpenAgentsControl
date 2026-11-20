# Skill: project-kickoff

Grill-driven greenfield project bootstrap with progressive detail (idea → abstract architecture → HLD → LLD → blackbox). Use when the user wants to START a new project from an idea, research report, or rough plan — "help me plan out this project idea", "kickoff this", "create a project repo for this". NOT for working inside existing projects (that's plan-orchestrate / wayfinder territory).

## Core principle: detail grows slowly, gated

Detail levels must NOT interleave. Abstract architecture stays implementation-agnostic (no framework names, no wire formats). HLD names components and responsibilities but not protocols. LLD opens wire shapes, schemas, state machines — one component at a time, only when its HLD is stable. Each level change is grilling + a gate, never a jump.

## Phase 0 — Intake
Accept the raw idea in any form (markdown report, chat dump, options list). Read fully; do NOT plan from it yet. Map what is UNDECIDED: goal, audience, platform, success bar, constraints. The report is evidence, not truth; claims get verified later.

## Phase 1 — Grill: identity and shape

Scenario-based questions with tradeoff tables (question tool, batched). Round 1: what IS this in one README sentence; force ONE success bar (reject "a mix"); name scope contradictions and cut them; pick the seam/interface; pin reality constraints (hardware, platform). Round 2: the forced two-week milestone; the delete test for the adoption surface (smallest possible user action); product stance (OSS/MIT/monetization guard); first client/harness. Rules: never accept vague answers; confess mistakes immediately and re-confirm; every decision carries cut alternatives.

## Phase 2 — Scaffold the docs repo (early, no code)

In the user's projects directory: `README.md` (one-liner, why, first milestone), `ARCHITECTURE.md` (started abstract at this stage), `DECISIONS.md` (append-only: what/why/alternatives cut), `LOG.md`, `docs/` skeleton, `.gitignore`, git init + one detailed commit. Naming ritual: propose, check fit/collisions, confirm; mistakes get renamed + logged.

## Phase 3 — Abstract architecture (abstract)

Draft into `ARCHITECTURE.md`: the seams/interfaces ONLY — what modules exist, what each interface promises, invariants, who consumes what. Deliberately NO tech stack, NO wire formats. Apply seam tests: deletion test (complexity reappears across callers when removed — deep), two-adapters rule (a seam with only one conceivable adapter is hypothetical). Rank risks by the assumption most likely to kill the design.

## Phase 4 — HLD (component design)

For each seam: name concrete components, responsibilities, data flow, adapter slots inside modules, deployment shape. Still no wire formats. This lands as ARCHITECTURE.md sections advancing from abstract to structural. Gate: every component maps to a seam; every risk has a mitigation or an explicit spike backlog item.

## Phase 5 — Feasibility research (before or during LLD)

Identify the single assumption that kills the architecture if false. Delegate research: claim-by-claim verdicts (verified/plausible/debunked with sources) + a spike spec with acceptance criteria, written into `docs/`. Retry a dead subagent once, then run research inline. Facts about target projects come from scanning disks, not from asking users what they could look up.

## Phase 6 — LLD grill (behaviors, wire, state)

Grill round on observable behaviors: per-component behavior tables (lifecycle, transport, state, screen/human interactions, error surface: one-line `CODE: message` + hint, verbose opt-in) + ONE shared state machine + explicit NON-behaviors. Then open the wire contract AFTER behaviors are stable: routes, node/object schemas, rev/staleness guards, versioning, error taxonomy. Tag decisions [S] into DECISIONS.md. Breaking a behavior row later is a bug, not a choice.

## Phase 7 — Feature planning

Split the milestone into concrete features; park each as tiered roadmap (now / next / later / NOT-doing) with the DECISIONS-gate for tier moves. Then features → issues with explicit gates, acceptance criteria, sequencing (blocked-by), and rules of engagement. Everything implementation-flavored starts as an issue; wayfinder maps drive execution if present.

## Phase 8 — Blackbox testing design (write-first)

Test through the interfaces, never internals; ONE suite, multiple progressively-real targets (fake → device/prod). Build the in-memory SECOND adapter so CI-speed testing needs no hardware. Author test-ID matrix mapping every behavior row to test IDs (gaps in the mapping are suite bugs). Define the scenario/assertion DSL schema BEFORE authoring. Report/CI contract: machine-readable results, exit-code rule, evidence bundles on red runs, cron opens issues. Phases P0.. with gates; P0 authorable with zero implementation — the whole suite exists as red/skipped first.

## Phase 9 — AGENTS.md design session

Run the `agents-md` skill. Propose sections; user merges their own takes. Splits: `docs/repo-map.md` (layout + command table with honest planned/live status), `docs/guardrails.md` (numbered hard limits), skills-discipline section in AGENTS.md. CLAUDE.md symlink or copy fallback on Windows, logged.

## Phase 10 — Meta tooling (optional, grilled)

Custom linters/eval harnesses/cron: grill rule inventory, severity tiers (FAIL/WARN), executor policy (time-boxed dogfood of other personal projects, plain fallback), rule home (in-repo, versioned with the code). Park as an issue.

## Standing rules throughout
- Temp files in `tmp/`; evidence bundles on every red run; `LOG.md` every session
- `DECISIONS.md` before behavior/contract changes; honest status columns everywhere
- Park, don't run: implementation starts only on explicit go; keep the issue board accurate
- After every doc write + push: short status summary + next action
