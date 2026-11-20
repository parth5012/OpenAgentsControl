# Skill: implementation-loop-builder

Builds project-tailored implementation-loop skills. Use when a project needs its own `<name>-implementation-loop` skill — "design an implementation loop for this project", "make a tailored loop skill for <project>", "how should agents implement features here". TRIGGER when starting any project where implementation agents (human devs or AI) will execute tickets repeatedly. This is a META skill: it does NOT implement features; it authors the per-project skill that does.

Companion to:
- `project-kickoff` (decide what to build) → **this skill** (decide HOW agents verify build work) → `wayfinder-runner` / tickets (execute)

## Phase 0 — Scan the project (evidence, not interviews)

Read-only sweep before any questions. Extract from the repo:

| Scan target | Artifacts to read |
|---|---|
| Contract chain | AGENTS.md / CLAUDE.md, contract docs, behavior specs, guardrails (every protected invariant becomes a loop rule) |
| Test architecture | testing docs, test plans, harness docs; identify the VERIFICATION TIERS (static → unit → fake/blackbox → integration → device/e2e) and the exact runnable command per tier |
| Write-first status | does a red-first suite exist or is it planned? capture the flip-the-suite mechanic if present |
| Review tooling | installed review skills/CLI/bots: e.g. ocr-review, openqodex, CodeRabbit, parth pr bot, internal review subagents; note which are live vs planned (honest-status rule) |
| Workflow conventions | wayfinder maps? stacking thresholds? evidence bundle contracts? tmp/ discipline? artifact files (LOG.md/LEARNINGS/TECH_DEBT/DECISIONS)? PR linking/watching rules? |
| Language/layer skills map | which best-practice skills exist per language/layer (Rust/Android/TS/...); gaps get logged |

Also: ONE anchor ticket (existing issue or synthetic) to dry-run validation against in Phase 3.

## Phase 1 — Grill the open forks (with the project owner)

Batched scenario questions, recommendations given, "a mix" rejected. Typical forks (skip any already decided upstream):

1. **Loop topology**: gates per tier fixed or per-ticket-tier-ceiling (from a test-group table)? Who sets each ticket's ceiling?
2. **Failure policy**: root-cause-fix-then-full-rerun vs rerun-only-failing; bounded fix cycles before escalate-with-evidence (propose 3); BLOCKED classification rules (e.g., hardware unavailable).
3. **Review lanes**: which of the scanned tools are MANDATORY vs optional; parallel-vs-serial; adversarial brief mandate ("prove the diff fails") yes/no; spec-conformance pass against acceptance criteria yes/no; block-only findings discipline.
4. **Ship mechanics**: stacking threshold layouts, PR-babysit rules, who may merge, per-blocking-bot triage.
5. **Artifacts**: evidence bundle shape and location, required final VERIFY block format, close-out files that must update.

## Phase 2 — Draft the tailored skill

Output: `<project>-implementation-loop/SKILL.md`. Skeleton (all slots filled FROM the scan/decisions, no generic boilerplate):

```
# <project>-implementation-loop
[scope note: THIS PROJECT ONLY; what it is not]
Phase 0 intake  — ticket load command, the project's contract-chain read order, work-branch/stacking rules
Phase 1 RED     — project's test-first authoring order + exact commands + where scenarios/tests live + red-failure capture location
Phase 2 GREEN   — minimum implementation rule + handoff intent paragraph
Phase 3 VERIFY  — the project's tier table (tier, command, live status) + loop rules (rerun policy, bound, evidence contract, contract-change rule)
Phase 4 REVIEW  — the p0/frozen lane list with each tool's exact invocation + triage policy
Phase 5 SHIP    — commit style, PR creation + linking, bot review markers, babysit rules, stacking math
Phase 6 CLOSE   — artifact files to update + final report format
Standing rules  — guardrail-derived hard stops only
```

Rules of drafting:
- Every command must be copy-paste runnable verbatim against the CURRENT repo state, or carry its live-when marker (e.g., "planned, issue #N") — never a fabricated green.
- Verify/review rules must reference the project's OWN artifact names and doc paths, not placeholders.
- Scope: ONLY the loop. What-to-build belongs to kickoff/grilling; how tickets flow belongs to wayfinder. Cross-reference, do not duplicate.
- Size: one page-ish; AGENTS.md keeps the pointer, skill keeps the detail.

## Phase 3 — Validate (dry-run, adversarial)

1. Dry-run against the anchor ticket: does the drafted skill make the correct first three actions unambiguous?
2. Validator checks: (a) zero placeholder paths, (b) every tier command exists in repo-map/command table or is explicitly future-dated, (c) no invented tool names, (d) conflict check — no rule violates AGENTS.md/guardrails, (e) bounded-escalation rule present.
3. Hand the draft to the project owner for edit (expect merges); the skill ships authoritative at their edit, not the agent's first version.

## Phase 4 — Install + register

- Install/user-level copy: `C:\Users\<user>\.agents\skills\<name>-implementation-loop\SKILL.md`
- Versioned: personal-skills repo `skills/<name>-implementation-loop/` + MANIFEST regeneration + push
- Per-project policy: install per-project when loop rules diverge across projects; add the pointer to the project's AGENTS.md (one line!) so agents/bar loaders find the skill, keep the detail in the skill.
- Ticket: register the skill's existence in the project's LOG.md.
- Maintenance: any loop-rule change (review tool added, tier added, threshold changes) = regenerate + re-validate; skill drift is a bug, not a nuisance.

## Standing rules
- Honest-status drafting only (planned is allowed; pretending live is not)
- Owner approves the final text; agent drafts, owner merges (mirror the kickoff AGENTS.md session)
- The tailoring must survive a cold-start agent: all reading paths exist in the repo at draft time, whether in design or issue form.
