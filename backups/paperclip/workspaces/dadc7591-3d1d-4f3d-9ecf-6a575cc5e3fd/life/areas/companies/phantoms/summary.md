# Phantoms (PHA)

## Summary

- Agent company, prefix `PHA`. Created 2026-10-03 19:57Z. Board user: `q49Waw45`.
- CEO: `The Hand` (`dadc7591`). Six direct reports, all role `general`, all on `hermes_local` profiles.
- **No product, mission, or monetization recorded.** Company still has no description.
- Board asked the CEO to "Help me setup this company" on PHA-2 (2026-10-03 23:30Z). Phase 0 executed.
- PHA-1, the earlier scoping thread, was deleted by the board.

## Current State

**Phase 0 is stalled, and delegation does not currently work.** As of 2026-10-05 the binding
constraint is NOT board input on the product — it is a company-wide execution defect.

- Goal `930db951` "Stand up Phantoms as a functioning AI company" created 2026-10-04, status `planned`.
- **Wake path repaired** 2026-10-04 (`wakeOnDemand: true` on all six). This was necessary but
  turned out not to be sufficient.
- Routing charter corrected to match the real roster (see Team).
- **BLOCKER — `hermes_local` never sets a run disposition.** Every run on every report performs
  tool work, then ends with the issue still `in_progress` and no status write. Runs stall
  permanently and escalate to board as `missing_disposition`. Verified over 7 runs on 2 agents.
  The CEO runs `opencode_local` on the same API and completes correctly, which isolates the fault.
  **Until this is fixed, do not delegate anything.** Diagnosis and three options in **PHA-5**.
- PHA-3 (`Hermes Developer`) — `blocked`, board-escalated recovery. Partial real delivery:
  repo `parth5012/phantoms-core` (private) + project `phantoms-core` exist. Preserve, don't redo.
- PHA-4 (`Hermes Curator`) — `in_progress` with no live path (invalid state I could not repair).
  Zero deliverables.
- PHA-2 (`Help me setup this company`) — `blocked` on PHA-3 and PHA-4.
- Second open board decision: what Phantoms is and who pays. Pending `ask_user_questions`
  interaction `654847c4`, `human_only`, `wake_assignee`. Recommendation on record: software
  product, B2B or developer buyer. Unanswered for ~15h as of 2026-10-05.

Two decisions now compete for the board: PHA-5 (execution, blocking) and `654847c4` (product,
non-blocking). PHA-5 comes first.

## Open Questions

- What does Phantoms sell, and to whom? (pending board answer, interaction `654847c4`)
- Does the company need a design/UX capability? Only genuine capability gap in the roster.
  Hire with `paperclip-create-agent` if design becomes load-bearing.

## Team

| Agent | Id | Profile | Routing |
| --- | --- | --- | --- |
| Hermes Developer | `ee57f120` | `developer` | Code, backend, testing, repo, infra, CI |
| Hermes Researcher | `7d70796e` | `researcher` | Deep research, market/competitor analysis, citations |
| Hermes Curator | `87780e85` | `curator` | Documentation, knowledge base, company wiki |
| Hermes Social | `f4e3990a` | `social` | Content, social, growth, visual/media assets |
| Hermes Assistant | `f7852f58` | `assistant` | Email, Google Workspace, scheduling, task tracking |
| Hermes Agent | `4069c579` | (default) | Multi-tool orchestration, subagent delegation |

**No CTO, CMO, or UXDesigner exists in this company.** Do not route to those roles.
Design has no owner. Prefer an existing report over hiring; hire only for a real gap.

**Do not route product-campaign work to `Hermes Social`** until the board states the product.
Foundation and research work is always safe to route.
