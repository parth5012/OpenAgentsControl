# Claude-Mem Memory Context

<claude-mem-context>

# Memory Context from Past Sessions

*No context yet. Complete your first session and context will appear here.*

Use claude-mem search tools for manual memory queries.

</claude-mem-context>

---

# Agent Instructions

## Framework / Platform

This is a general-purpose agent environment. The coding agent should follow these rules and practices when executing tasks.

## Code & File Operations

- **Understand First**: Always check if the project has graphify setup before trying to read relevant codebase files (`read`, `glob`, `grep`).
- **Minimal Changes**: Make the smallest possible changes required to achieve the goal correctly. Avoid refactoring unrelated code.
- **Code Style**: Follow the style, indentation, naming conventions, and file structures of the existing codebase.
- **Systematic Fixes**: When fixing bugs, analyze the logs or test errors, locate the root cause, apply the fix, and re-run verification.
- **Overwrite safety**: Never write new files unless explicitly requested or necessary. Modify existing ones instead.

## Execution Guardrails

- **Plan-First**: Break complex, multi-step tasks into clear steps with checkpoints.
- **Safety Zones**: Never run destructive commands (such as `rm -rf`, `git reset --hard`) unless strictly verified and requested.
- **Attribution**: Stage and commit files only when explicitly asked.

## Verification

- Test all changes before declaring a task complete.
- Ensure linting, compilation, and any existing test suites pass successfully.

## Definition of Done

A task is **DONE** only when:
1. Relevant tests are green (unit + integration)
2. Typecheck passes clean
3. For user-facing flows: exercised end-to-end (e.g. Playwright for web)
4. Changes committed with detailed commit message
5. LEARNINGS.md updated if new edge case discovered
6. Logged in LOG.md with status and iteration notes

**Never report "done" without running verification. If skipped, say so plainly.**

## TDD is mandatory

Every change follows **failing test first → implement → verify**:
1. Write the test(s) that capture the desired behavior and watch them **fail** (red).
2. Implement the minimum to make them pass.
3. Run the suite + typecheck and confirm green.

Don't write implementation before a failing test exists. When fixing a bug, reproduce it with a failing test first.

## Context Re-entry (multi-project juggling)

I juggle several projects with concurrent sessions. Write every user-facing message for **cold re-entry**:

- **Open with a recap.** Before any summary/decision/question: 2–3 plain sentences on what we were working on, why, and where it stands.
- **Plain language.** No codenames, abbreviations, or callbacks like "the earlier fix" — restate the thing in place.
- **Self-contained questions.** When asking for a decision, include background, options, tradeoffs, and your recommendation.
- **One question at a time.** Say how many decisions are waiting, present only the first, wait for answer before next.
- **Anchor the work.** Name project, branch, and PR when reporting status.
- **End with the next action.** Close with the single thing waiting on me, or say explicitly that nothing is.

## Worktrees

When starting any new feature or fix, create a separate git worktree from the base branch. Do all work inside it so parallel agents never overwrite each other. After merge, remove the worktree. For next task, create a fresh worktree from latest base branch.

## Builder/Driver Split (token optimization)

The agent that *built* a feature sits on huge context (150k–200k tokens). If it also drives review, that entire context is resent every turn. Instead:
- **Builder** builds, commits on branch, ends with `HANDOFF: INTENT` paragraph (what changed + why)
- **Driver** (fresh, cheap, tiny-context agent) runs the review gate, monitors, answers questions
- **Gate rules**: auto-fix findings; approve info-only; for human decisions — PARK verbatim and end task so orchestrator relays it
- Never end a subagent turn while a gate run is active — background processes orphan instantly

## Harness Patterns

- **Teach the agent.** Create docs for business logic, data, technology, patterns, practices, architecture. Cross-link them.
- **Point at docs in live code.** Reference architecture docs from code comments where decisions live.
- **One item per fresh chat.** Don't chain unrelated tasks in one session.
- **Close the loop.** After completing work: verify itself, write logs, test with appropriate tools, give feedback to same session.
- **Spawn helper agents** for research, review, and verification — keep main context clean.
- **Never compact chat.** Data loss risk.
- **Recover with git.** `git reset --hard` → fix the loop → run again.
- **Loop anything repetitive.** Features, tests, refactor, docs, cleanup, audit, eval — all can be automated loops.
- **Fix bugs older than you.** When an issue arises, update instructions so it never recurs (don't just patch by hand).
- **Build spec before code.** Always produce a spec or plan before implementing.

## Exit Codes & Statuses

Use these statuses consistently for all tasks:
- `Done` — verified complete
- `Blocked` — documented in BLOCKED.md with reason
- `Budget` — token/time budget exhausted
- `Compacted` — context was compacted (potential data loss)
- `Stuck` — unable to proceed, needs human
- `Outage` — tool/service unavailable
- `Review` — awaiting review gate

## Artifacts

- `BLOCKED.md` — write anything you can't access or execute into this file, then stop
- `LEARNINGS.md` — key learnings, edge cases, decision rationale per project
- `LOG.md` — log every iteration with status, what changed, and verification result
- `TECH_DEBT.md` — track tech debt separately to distinguish choice from bugs
- `PROMPT.md` — define your automated loop (Ralph Loop) for repetitive workflows
- `.tmp/` — all temporary generated files go here

## Commit Standards

Always generate detailed commits:
- What changed and why
- What was verified (tests run, typecheck status)
- Any decisions made with rationale
- References to issues/tickets when applicable

## Wayfinder Runner

When a wayfinder map exists and you want to process all tickets in one session:

1. Invoke the `wayfinder-runner` skill: `/wayfinder-runner <map-number>`
2. Two-phase flow:
   - **Phase 1 (HITL):** prototype/grilling/HITL-task tickets processed with human present
   - **Phase 2 (AFK):** once HITL resolved, autonomous agents run research/task tickets
3. Each ticket gets its own agent dispatch with full context from the map
4. Code changes trigger a CodeReviewer sub-agent before recording resolution

**Pattern:**
```
Task(subagent_type="general", prompt="/wayfinder-runner <map-number>")
```

## Concision

Be extremely concise. Sacrifice grammar for the sake of concision. Answer directly without preamble or postamble.
