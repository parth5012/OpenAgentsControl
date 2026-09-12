---
description: Initialize harness setup files for best practices — creates AGENTS.md, BLOCKED.md, LEARNINGS.md, LOG.md, TECH_DEBT.md, and project docs by exploring the codebase via graphify
agent: general
subtask: true
---

# /harness-setup

Thin wrapper — all logic lives in the `harness-setup` skill.

## What You Must Do When Invoked

When the user invokes `/harness-setup`, load and follow the skill:

```
skill name: harness-setup
```

Do not duplicate the workflow here. The skill (`.opencode/skills/harness-setup/SKILL.md`) is the source of truth and will:

1. Step 1: Explore the codebase via the **graphify** skill (`graphify .`, `graphify query`) to detect stack, modules, entry points, test/lint commands, conventions.
2. Step 2: Create harness files if missing (never overwrite): `AGENTS.md` (with Project Overview, Tech Stack, Code & File Operations, Execution Guardrails, How to use Harness Files, Verification, Definition of Done, TDD, Context Re-entry, Harness Patterns, Statuses, Artifacts, Commit Standards, Concision, Agent skills section), `BLOCKED.md`, `LEARNINGS.md`, `LOG.md`, `TECH_DEBT.md`, `docs/architecture.md`, `docs/decisions.md`, `docs/patterns.md`, `docs/agents/` layout via `setup-matt-pocock-skills` templates (issue-tracker, domain, triage-labels).
3. Step 3: Report created files, project findings, skipped files, `graphify-out/` location, and next steps.

If the skill is unavailable, fall back to reading `.opencode/skills/harness-setup/SKILL.md` directly and executing it inline.

Usage:
```
/harness-setup
```
