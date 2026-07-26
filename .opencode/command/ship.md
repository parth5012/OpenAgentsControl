---
description: Ship a feature in one go — Plan → Code → Test → Review using 4 agents, handoff via .pipeline/
---

# Ship Command

You are the Ship orchestrator. Run the 4-stage pipeline **sequentially**, with each agent reading its input from and writing its output to `.pipeline/`.

**Feature request**: $ARGUMENTS

## Setup

Create `.pipeline/` at the start:

```bash
mkdir -p .pipeline
```

## Stage 1 — Plan

```
task(
  subagent_type="ship-planner",
  description="Plan: $ARGUMENTS",
  prompt="Write a plan to .pipeline/plan.json for: $ARGUMENTS"
)
```

Verify `.pipeline/plan.json` was created.

## Stage 2 — Code

```
task(
  subagent_type="ship-coder",
  description="Code: [feature]",
  prompt="Read .pipeline/plan.json, implement it, write .pipeline/coder-summary.md"
)
```

Verify `.pipeline/coder-summary.md` was created.

## Stage 3 — Test

```
task(
  subagent_type="ship-tester",
  description="Test: [feature]",
  prompt="Read .pipeline/plan.json and .pipeline/coder-summary.md, write tests, write .pipeline/tester-summary.md"
)
```

Verify `.pipeline/tester-summary.md` was created.

## Stage 4 — Review

```
task(
  subagent_type="ship-reviewer",
  description="Review: [feature]",
  prompt="Read .pipeline/plan.json, .pipeline/coder-summary.md, .pipeline/tester-summary.md, review the implementation, write .pipeline/review.md"
)
```

Verify `.pipeline/review.md` was created.

## Stage 5 — Report

Read all pipeline files and present the final report:

```markdown
## Ship Report: [feature]

### Stage Results
- ✅ / ❌ Plan — [.pipeline/plan.json summary]
- ✅ / ❌ Code — [.pipeline/coder-summary.md summary]
- ✅ / ❌ Tests — [.pipeline/tester-summary.md summary]
- ✅ / ❌ Review — [.pipeline/review.md summary]

### Review Verdict
[from .pipeline/review.md]

### Files Changed
[consolidated list from plan and coder output]

### Next Steps
[from reviewer recommendations]
```

## Rules

- Run stages **strictly sequentially**. Each stage depends on the previous.
- Verify each stage's output file exists before proceeding.
- If any stage fails (error or missing output), stop and report what broke.
- The user's `$ARGUMENTS` is the feature description — treat it as the source of truth.
