---
name: software-factory-builder
description: Build and run a personalized software factory for any repo — architecture-contract extraction and certification, enforcement scaffolding (context loading + validator agents + mechanical checks), a one-gate per-task pipeline (research → story → blueprint → AFK build → validate → PR), and a compulsory performance-ratchet gate that prevents regressions. Use when the user says "build a software factory", "create a factory for this repo", "factory run", or mentions the software-factory subagent pipeline for their projects.
---

# Software Factory Builder

Personalized for Parth. Methodology and defaults were **decided and locked in a grilling session on 2026-10-23**. This skill encodes those decisions so every future factory run follows the same model without re-litigating it.

## Core model: a factory is a CONTRACT AMPLIFIER

The factory does not "fight the architecture" — it **amplifies whatever contract is certified**, good or bad. Agents have no architectural judgment to resist a bad spec; a strong model will faithfully contort code around a wrong abstraction indefinitely. Quality comes from exactly two mechanisms:

1. A contract that **shrinks the agents' decision space**, written from *reality*, not aspiration.
2. **Verification with teeth**: humans certify once per repo; machines check every task.

### Locked anti-patterns (never do these)

- **Never enforce an aspirational architecture** on an existing repo. If the contract describes what the code *should* be, blueprints hallucinate conventions and end up straddling two architectures — drift, unpredictable and worse than no factory.
- **Never let agents author their own thresholds.** The perf baseline file is a lock file agents cannot write. Self-grading gates are the built-in attack surface.
- **Never auto-merge.** The human merges. Always.
- **Never make a gate compulsory before proving it deterministic.** One false alarm turns the team into rerun-until-green followers and the gate becomes theater.
- **Never gate at every stage.** Human attention is spent once per task — on *interpretation* (the blueprint), never on boilerplate approval.

## Parth's locked defaults

Apply these without asking, unless the repo's reality contradicts them:

| Decision | Locked value |
|---|---|
| Architecture source (existing repo) | Extract current architecture, human certifies it as the contract |
| Architecture source (greenfield repo) | Human-designed minimal contract + walking skeleton, *before* any code |
| Certification gate | Human reviews each repo's contract **one time** — the single place where human attention is worth ten agents |
| Enforcement | Agent-context loading (Context-First) + validator agents per diff + mechanical checks (import linting, dependency-cruiser, boundary tests) added incrementally |
| Per-task human gates | **One gate only: blueprint approval**, then fully AFK to PR (OCR + CodeRabbit review) |
| Merge | Human merges; never auto-merge |
| Perf metric scope at seed | 3 Critical User Journeys × Tier-1 (user-perceived latency) only; Tier 2/3 added later |
| Ratchet advancement | Only the human advances `perf-baseline.json`, at the merge gate |
| Gate calibration | **Shadow mode first** (report-only) across N real PRs → set tolerance per metric from measured variance → then flip to blocking |
| Pilot success metric | Ledger: contract-violation catch rate + blueprint-correction count + wall-clock/touch-minutes vs a comparable manual task |

## Phase 0 — Archetype check (do this before anything)

Determine, from the repo on disk (or by asking one question), which archetype applies:

- **Existing repo** → Phase 1a + Phase 2 (extraction path).
- **Greenfield (nothing to extract)** → Phase 1b (contract-first path).

If the mandate is ambiguous, run a `/grilling` interview — **one question at a time, always with a recommended answer** — covering: first pilot repo, what "helped" means in numbers, and any default above the repo's reality contradicts. Do not re-ask what is already locked in the table.

## Phase 1a — Existing repo: extract and certify

1. Run an architecture extraction pass (`architecture-analyzer` subagent, or `graphify` / `understand` on the repo). Extract also the repo's **3 Critical User Journeys** as named, user-perceived-latitude metrics (e.g. `cold_start_ms`, `tap_to_result_ms`, `heavy_op_settle_ms`) — never vague ones like "app feels slow".
2. Produce: `ARCHITECTURE_CONTRACT.md` (module boundaries, data ownership, dependency rules — verified against real imports) and a `CUJ_CATALOGUE.md` with the three metrics.
3. **Human gate #0**: the human reads both documents once and approves. A wrong contract poisons every downstream task; expect ~30 minutes of their attention per repo. No agent may begin Phase 2 before approval.

## Phase 1b — Greenfield repo: contract-first

1. The human and an architect-grade agent (strongest available model via `delegate_task`) design a **minimal** contract: module boundaries, data ownership, dependency rules. Minimal = it tracks reality instead of fantasy.
2. The repo is born with the contract in agent context + a walking skeleton that maps the real structure.
3. The factory implements every story after that. (This is the one place where "architecture first → quality" is fully true, because the human owns the decisions that are least revisable: project layout, data modeling.)

## Phase 2 — Install enforcement (per repo)

1. **Context loading (Context-First)**: contract lands in the repo's persistent agent context (`AGENTS.md` / `.opencode/context/`) so every blueprint/implement agent must read it before work. A contract that is read but not checked decays.
2. **Mechanical checks**: incrementally add import linting / dependency-cruiser / boundary tests that the stack supports cheaply. Docs carry judgment; machines catch boring violations.
3. **Validator agents**: every task's diff is audited by a validator agent against the contract, in addition to the mechanical checks.
4. **Performance harness (zero-flake)**:
   - Local synthetic harness; deterministic data; run each metric 5 times, drop highest and lowest, average the remaining 3. Never benchmark debug builds or live networks.
   - Telemetry from the `deep-performance-engineering` skill (`templates/telemetry-web.ts` / `-backend.py` / `-react-native.ts` per stack).
   - Commit `perf-baseline.json` into the repo.
   - Gate starts in **shadow mode**: `ratchet.py` runs report-only on PRs. After N real PRs of measured variance, set each metric's tolerance = measured noise + margin, then flip to blocking. Report the flip decision to the human.
   - **Ratchet law**: `perf-baseline.json` moves only when the human advances it at the merge gate (a genuine speed-up). Agents never touch it. Regression > tolerance on a blocking gate = PR fails; fix or human override with stated reason.
   - Tier 2 (renders, event-loop lag) and Tier 3 (frames, memory) metrics are added only after the gate has proven deterministic.

## Phase 3 — Per-task factory run (repeat every task)

```
research → story → blueprint → ⟨HUMAN GATE: approve interpretation⟩
        → implement (parallel, worktree-isolated T3 threads)
        → validate (validator agent + contract checks + ratchet check)
        → e2e-verify → PR (ocr_review + CodeRabbit /review) → HUMAN MERGES
```

Orchestration mapping in this harness:

| Role | Mechanism |
|---|---|
| Research | `subagent` → `researcher` / `explore` |
| Stories | `subagent` → `story-writer` |
| Blueprint | `subagent` → `technical-blueprint` (strongest available model — this is the artifact the human gate judges) |
| Implementation | `t3_thread_launch` with `workspaceStrategy: worktree` (+ `delegate_task` for cross-provider or cheap-model routine work) |
| Validation | `subagent` → `validator` (+ contract diff audit + `ratchet.py` in gate mode) |
| E2E | `subagent` → `e2e-verifier` (Playwright; only once e2e coverage is contract-listed) |
| Review | `ocr_review` on the PR + CodeRabbit review; apply concrete fixes before landing |

Isolation rules: one T3 thread per task in its own worktree; parallel independent tasks fan out simultaneously; uncommitted parent edits are not copied into worktrees; never poll PRs manually — use watch tooling where available.

## Phase 4 — Ledger (after every pilot/factory task)

Record in the repo's `LOG.md` (or the factory's ledger file):

- Contract/cheat rate: count of architecture violations caught by mechanical checks + validator (non-zero catch rate proves the contract bites; zero usually means weak checks, not clean agents).
- Blueprint corrections the human had to make (tests the research/story stages, not the human).
- Wall-clock time + human touch-minutes vs a comparable manually executed task.

No factory is declared "helping" without this ledger; the postmortem must not be vibes.

## Execution summary (start here)

1. Phase 0 → archetype. 2. Phase 1 → contract + certification gate. 3. Phase 2 → enforcement + harness (shadow). 4. Phase 3 on a small real task (the perf harness build itself is an excellent first pilot task) → PR → human merge. 5. Phase 4 → ledger → iterate: flip the ratchet to blocking once variance is calibrated.
