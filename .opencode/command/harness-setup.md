---
description: Initialize harness setup files for best practices — creates AGENTS.md, BLOCKED.md, LEARNINGS.md, LOG.md, TECH_DEBT.md, and project docs by exploring the codebase via graphify
agent: general
subtask: true
---

You are a harness setup specialist. Your task is to explore the current project using graphify and create all the files and folders needed for a proper agent harness setup.

## Step 1: Ensure graphify is installed

Check if graphify is available:

```bash
graphify --version 2>/dev/null || echo "NOT_INSTALLED"
```

If not installed, install it:

```bash
# Prefer uv tool install
if command -v uv >/dev/null 2>&1; then
    uv tool install graphifyy
else
    pip install graphifyy --break-system-packages 2>/dev/null || pip install graphifyy
fi
```

Verify installation:

```bash
graphify --version
```

If installation fails, write the blocker to `.tmp/graphify-install-blocked.md` and proceed to Step 2 using manual exploration (glob/grep/read) instead.

## Step 2: Explore the Project with graphify

Run the full graphify pipeline on the current directory:

```bash
cd PROJECT_ROOT && graphify .
```

This will:
- Detect all files in the project
- Extract entities and relationships (AST for code, LLM for docs)
- Build a knowledge graph with community detection
- Generate `graphify-out/` with `graph.json`, `GRAPH_REPORT.md`, and `graph.html`

After it completes, read `graphify-out/GRAPH_REPORT.md` to understand:
- Project structure and communities
- God nodes (key concepts)
- Surprising connections
- Suggested questions

Then query the graph for project-specific details:

```bash
graphify query "What is the main tech stack and frameworks used?"
graphify query "What are the key modules and their responsibilities?"
graphify query "What are the entry points and main workflows?"
graphify query "What are the test commands and build commands?"
graphify query "What are the naming conventions and code patterns?"
```

If graphify fails or is unavailable, fall back to manual exploration:
- Use `glob` to find all files (patterns: `*`, `src/**/*`, `lib/**/*`, `packages/**/*`, `apps/**/*`)
- Read `package.json`, `Cargo.toml`, `pyproject.toml`, `go.mod`, or whatever build config exists
- Read `README.md`
- Use `grep` to find test scripts, lint commands, build commands

## Step 3: Create Core Harness Files

Create these files if they don't exist. If they exist, skip them (don't overwrite).

### 1. AGENTS.md (Project Root)
A comprehensive agent instruction file tailored to THIS project. Include:
- **Project Overview**: What this project is (from graphify exploration)
- **Tech Stack**: Languages, frameworks, build tools detected
- **Graphify**: Note that graphify is set up — agents should use `graphify query` for codebase questions
- **Code & File Operations**: Understand-first, minimal changes, code style, systematic fixes, overwrite safety
- **Execution Guardrails**: Plan-first, safety zones, attribution
- **Verification**: Test commands, lint commands, typecheck commands (specific to this project)
- **Definition of Done**: Explicit checklist
- **TDD**: Test-first approach
- **Context Re-entry**: Cold re-entry rules for multi-project juggling
- **Harness Patterns**: Teach docs, one item per chat, close loop, helper agents, never compact, recover with git, loop everything, fix bugs via instructions, spec before code
- **Exit Codes & Statuses**: Done, Blocked, Budget, Compacted, Stuck, Outage, Review
- **Artifacts**: Reference to all harness files
- **Commit Standards**: What makes a good commit in this project
- **Concision**: Be extremely concise

### 2. BLOCKED.md
```markdown
# Blockers

> Agent writes here when it cannot proceed. Human resolves and unblocks.

## Active Blockers

_None yet._

## Resolved Blockers

_None yet._
```

### 3. LEARNINGS.md
```markdown
# Learnings

> Key learnings, edge cases, and concepts worth remembering for this project.

## Project-Specific Learnings

_None yet — populate as the agent discovers patterns, edge cases, and gotchas._

## Decision Log

_None yet._
```

### 4. LOG.md
```markdown
# Log

> Every iteration logged with status, what changed, and verification result.

## Format

Each entry:
- **Date**: YYYY-MM-DD HH:MM
- **Status**: Done | Blocked | Budget | Compacted | Stuck | Outage | Review
- **What**: Brief description of the task/change
- **Verified**: What was run to verify (tests, typecheck, etc.)
- **Notes**: Any decisions or learnings

## Entries

_None yet._
```

### 5. TECH_DEBT.md
```markdown
# Technical Debt

> Track tech debt separately to distinguish deliberate choices from bugs.

## Active Debt

_None yet — populate as the agent identifies debt during work._

## Resolved Debt

_None yet._

## How to Use

- When a decision is made for pragmatic reasons (deadline, scope), log it here with rationale
- When a bug is actually a choice (not a mistake), log it here
- When debt is paid down, move it to Resolved
```

## Step 4: Create Project Docs

Create a `docs/` folder with these files. Use graphify insights to populate them.

### docs/architecture.md
Based on graphify exploration, document:
- Project structure (directories and their purposes)
- Key modules/packages and their responsibilities
- Data flow (if applicable)
- External dependencies and integrations
- Entry points
- Graphify graph location (`graphify-out/graph.json`) for querying

### docs/decisions.md
```markdown
# Architecture Decisions

> ADR-style log of significant decisions.

## Format

### [DATE]: [Title]
- **Status**: Proposed | Accepted | Superseded
- **Context**: Why this decision was needed
- **Decision**: What was decided
- **Consequences**: Trade-offs and implications

## Decisions

_None yet._
```

### docs/patterns.md
```markdown
# Patterns & Conventions

> Code patterns, naming conventions, and idioms specific to this project.

## Naming Conventions

_Document as discovered._

## Code Patterns

_Document as discovered._

## Testing Patterns

_Document as discovered._

## Import/Module Conventions

_Document as discovered._
```

## Step 5: Report

After creating all files, provide a summary of:
1. What files were created (with paths)
2. What was detected about the project (stack, structure, graphify communities)
3. Any files that already existed and were skipped
4. Graphify outputs location (`graphify-out/`) for future queries
5. Next steps for the user (e.g., "Review AGENTS.md and customize further")
