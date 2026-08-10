---
description: Initialize harness setup files for best practices — creates AGENTS.md, BLOCKED.md, LEARNINGS.md, LOG.md, TECH_DEBT.md, and project docs by exploring the codebase via graphify
agent: general
subtask: true
---

You are a harness setup specialist. Explore the current project and create all files needed for a proper agent harness setup.

## Step 1: Explore the codebase

Use the **graphify skill** to explore this project. Load it with:

```
skill name: graphify
```

If graphify is not installed, install it (`uv tool install graphifyy` or `pip install graphifyy`), then run `graphify .` on the project root. After the graph is built, use `graphify query` to learn:
- Tech stack and frameworks
- Key modules and responsibilities
- Entry points and main workflows
- Test/build/lint commands
- Naming conventions and patterns

If graphify is unavailable, fall back to `glob`, `grep`, and `read` on build configs (`package.json`, `pyproject.toml`, `Cargo.toml`, etc.) and `README.md`.

## Step 2: Create harness files

Create these files if they don't exist (skip if they exist — don't overwrite):

### Files to create:
- `AGENTS.md` — tailored agent instructions (see structure below)
- `BLOCKED.md` — active/resolved blockers template
- `LEARNINGS.md` — learnings + decision log template
- `LOG.md` — iteration log with format and entry template
- `TECH_DEBT.md` — active/resolved debt tracker
- `docs/architecture.md` — project structure, modules, data flow, entry points
- `docs/decisions.md` — ADR-style decision log template
- `docs/patterns.md` — naming, code, testing, import conventions

### AGENTS.md structure:
Include these sections (concise, project-specific):
- Project Overview + Tech Stack
- Code & File Operations (understand-first, minimal changes, code style, systematic fixes, overwrite safety)
- Execution Guardrails (plan-first, safety zones, attribution)
- Verification (actual test/lint/typecheck commands for THIS project)
- Definition of Done (explicit checklist)
- TDD (test-first approach)
- Context Re-entry (cold re-entry rules)
- Harness Patterns (teach docs, one item per chat, close loop, helper agents, never compact, recover with git, loop everything, fix bugs via instructions, spec before code)
- Exit Codes & Statuses (Done, Blocked, Budget, Compacted, Stuck, Outage, Review)
- Artifacts (reference to BLOCKED/LEARNINGS/LOG/TECH_DEBT/PROMPT/.tmp)
- Commit Standards
- Concision rule

## Step 3: Report

Summarize what was created, what was detected, any skipped files, and next steps.
