# Claude-Mem Memory Context

<claude-mem-context>

# Memory Context from Past Sessions

*No context yet. Complete the first session for context to appear here.*

Use claude-mem search tools for manual memory queries.

</claude-mem-context>

---

# Agent Instructions

## Framework / Platform

General-purpose autonomous agent environment. Coding agents must follow these rules and practices when executing tasks.

For Python package management, always prefer **uv**.

## Code & File Operations

- **Understand First**: Check the project's graphify setup and read relevant codebase files (`read`, `glob`, `rg`) before making any changes. Never use `grep` — use `rg` (ripgrep), which is installed and aliased as `rg`.
- **Minimal Changes**: Make the smallest possible changes required to achieve the goal correctly. Avoid refactoring unrelated code.
- **Code Style**: Follow the existing style, indentation, naming conventions, and file structure of the codebase.
- **Systematic Fixes**: When fixing bugs — analyze logs and test errors, locate the root cause, apply the fix, then re-run verification.
- **Overwrite Safety**: Do not write new files unless explicitly requested or strictly necessary. Modify existing ones instead.

## Execution Guardrails

- **Plan-First**: Break complex, multi-step tasks into clear steps with checkpoints.
- **Safety Zones**: Do not run destructive commands (such as `rm -rf` or `git reset --hard`) unless strictly verified and explicitly requested.
- **Attribution**: Only stage and commit files when explicitly asked.

## Verification

Test all changes before declaring a task complete. Ensure linting, compilation, and any existing test suites pass successfully.

## Definition of Done

A task is **DONE** only when all of the following are true:

1. Relevant tests are green (unit + integration)
2. Typecheck passes cleanly
3. User-facing flows have been exercised end-to-end (e.g. Playwright for web)
4. Changes are committed with a detailed commit message
5. `LEARNINGS.md` is updated if a new edge case was discovered
6. Status and iteration notes are logged in `LOG.md`

**Never report "done" without running verification. If verification was skipped, say so plainly.**

## TDD — Mandatory

Every change follows the **red → green → refactor** cycle:

1. Write test(s) that capture the desired behavior and watch them **fail** (red).
2. Implement the minimum code required to make them pass.
3. Run the full suite and typecheck to confirm green.

Do not write implementation before a failing test exists. When fixing a bug, reproduce it with a failing test first.

## Context Re-entry (Multi-project Juggling)

When juggling several projects across concurrent sessions, write every user-facing message for **cold re-entry**:

- **Open recap**: Before any summary, decision, or question — write 2–3 plain sentences covering what you are working on, why, and where it stands.
- **Plain language**: No codenames, abbreviations, or callbacks like "the earlier fix" — restate the thing in place.
- **Self-contained questions**: When asking for a decision, include background, options, tradeoffs, and a recommendation.
- **One question at a time**: State how many decisions are waiting, present only the first, and wait for an answer before moving to the next.
- **Anchor work**: Name the project, branch, and timestamp when reporting status.
- **End with next action**: Close with the single thing waiting on the user, or say explicitly that nothing is.

## Worktrees

When starting any new feature or fix, create a separate git worktree from the base branch so that parallel agents do not overwrite each other. After a merge, remove the worktree. For the next task, create a fresh worktree from the latest base branch.

## Builder / Driver Split (Token Optimization)

When an agent that **built** a feature accumulates a huge context (150k–200k tokens), driving review becomes expensive because the entire context is resent every turn. Instead:

- **Builder**: Builds, commits to branch, ends with a `HANDOFF: INTENT` paragraph (what changed + why).
- **Driver**: A fresh, cheap, small-context agent that runs the review gate, monitors CI, and answers questions.
- **Gate rules**: Auto-fix lint/type findings; approve info-only findings; park human decisions verbatim at the end of the task for the orchestrator to relay. End the subagent turn while the gate runs active background processes to avoid orphaned processes.

## Harness Patterns

- **Teach the agent**: Create docs covering business logic, data models, technology, patterns, practices, and architecture. Cross-link them.
- **Point docs to live code**: Reference architecture docs in code comments where decisions live.
- **One item per fresh chat**: Do not chain unrelated tasks in one session.
- **Close the loop**: After completing work — verify, write logs, test with appropriate tools, and give feedback in the same session.
- **Spawn helper agents** for research, review, and verification to keep the main context clean.
- **Never compact chat**: Risk of data loss.
- **Recover via git**: Use `git reset --hard` to fix a broken loop and run again.
- **Loop anything repetitive**: Features, tests, refactors, docs, cleanup, audits, and evals can all be automated loops.
- **Fix bugs at the root**: When an issue arises, update the instructions so it doesn't recur — don't just patch by hand.
- **Build spec before code**: Produce a spec and plan before implementing.

## Statuses

Use these status labels for tasks:

| Status | Meaning |
|---|---|
| `Done` | Completed successfully |
| `Blocked` | Documented in `BLOCKED.md` with reason |
| `Budget` | Token/time budget exhausted |
| `Compacted` | Context was compacted (potential data loss) |
| `Stuck` | Unable to proceed — needs human input |
| `Outage` | Tool or service unavailable |
| `Review` | Awaiting review gate |

## Remote Usage

This agent may run remotely from another machine. When producing artifacts (HTML, images, dashboards, reports), always serve them via the cron system, the project's Cloudflare setup, or show images inline — never assume local filesystem access.

## Artifacts

Maintain the following project files:

| File | Purpose |
|---|---|
| `BLOCKED.md` | Anything the agent cannot access or execute — write it here, then stop |
| `LEARNINGS.md` | Key learnings, edge cases, and decision rationale per project |
| `LOG.md` | Log every iteration: status, what changed, verification result |
| `TECH_DEBT.md` | Track tech debt separately — distinguish intentional choices from bugs |
| `PROMPT.md` | Define automated loop (Ralph Loop) or repetitive workflow prompts |
| `DECISIONS.md` | Track architectural and design tradeoff decisions with rationale, alternatives considered, and why chosen |
| `.tmp/` | All temporary and generated files |

## Commit Standards

Generate detailed commits that include:

- What changed and why
- What was verified (tests run, typecheck status)
- Any decisions made and their rationale
- References to issues or tickets when applicable
- When babysitting a PR, if the CodeRabbit bot skips the review, comment `@coderabbitai review`

**Atomic commits**: One logical change per commit. Never mix unrelated changes. Each commit must be independently understandable and revertable. Write commit messages that explain *what* and *why*, not just *how*.

## Resume

When a project context warrants future reference (e.g. job applications, portfolio, stakeholder updates), maintain a `RESUME.md`. Capture: tech stack, key achievements, challenges solved, and measurable outcomes. Update it when a meaningful milestone is reached.

## Wayfinder Runner

When a wayfinder map exists and you want to process all tickets in one session:

1. Invoke the `wayfinder-runner` skill: `/wayfinder-runner <map-number>`
2. **Phase 1 (HITL):** Prototype, grilling, and HITL-task tickets are processed with the human present. Agent assists; human decides.
3. **Phase 2 (AFK):** Once all HITL tickets are resolved, autonomous agents run research and task tickets unattended.
4. Each ticket gets its own agent dispatch with full context from the map.
5. Code changes trigger a CodeReviewer sub-agent before recording resolution.
6. Human may leave after Phase 1; Phase 2 runs to completion.

**Pattern:**

```
Task(subagent_type="general", prompt="/wayfinder-runner <map-number>")
```

## Post-Code-Change Skills Pipeline

Before reporting results after any code change, run the following skills in order:

| Step | Skill | Purpose |
|---|---|---|
| 1 | `code-simplifier` | Simplify and clean up changed code — remove noise, dead paths, over-engineering |
| 2 | `code-review` | Review the diff for correctness, style violations, and logic issues |
| 3 | `ocr-review` | Visually inspect any UI/screenshot output for regressions or rendering issues |
| 4 | `pr` | Prepare or update the pull request with a structured description and linked artifacts |
| 5 | `repo-quality-orchestrator` | Run repo-wide quality checks — linting, coverage, dependency hygiene |
| 6 | `retro` | Log a brief retrospective: what went well, what broke, what to improve next time |

**Rule**: Do not report a task as `Done` until this pipeline has been run. If a skill is not applicable for a given change (e.g. no UI → skip `ocr-review`), note the skip explicitly in `LOG.md`.

### Code Review Standards (`code-review`)

When running the `code-review` skill, follow these rules:

- **Diff scope**: Review the diff on this branch against `main` only — do not comment on pre-existing issues outside the diff.
- **Block-only findings**: List only problems you would block the merge for. Do not report style nits or non-blocking observations as blockers.
- **Finding format**: For each blocking issue, provide:
  - **File + line**: exact location
  - **Why it's wrong**: clear explanation of the problem
  - **How to prove it fails**: a test, reproduction step, or command that demonstrates the failure
- **Unconfirmed items**: Explicitly mark anything you could not confirm. State what you checked and where you looked — do not silently omit uncertainties.

## Concision

When responding, be extremely concise. Sacrifice grammar for the sake of concision. Answer directly without preamble or postamble. Use the `visual-findings` skill whenever the output needs to be long.

## Proposal

- **Implicit approval**: Actions, commands, and tools needed to complete a requested task are pre-approved. No need to ask permission for each step.
- **Follow-through**: If a task implies follow-on steps (e.g. publishing HTML, uploading screenshots into a PR description), do them automatically — don't stop at the literal boundary of the request.
- **Use judgment**: Apply the same follow-through principle to analogous situations not explicitly listed. The examples above are illustrative, not exhaustive.
- **Interrupt only when it matters**: Ask before acting only when there is a real risk of exposing sensitive information, or when an action is irreversible and goes well beyond what was requested.
- **Keep moving**: When a step needs no input, continue without checking in. Embed status notes in the same message as the next action.
- **Hard stops**: Pause and ask before anything destructive — deleting data, force-pushing, or modifying anything outside this repository.
- **Parallelise with subagents**: Split tasks across subagents wherever possible to reduce latency and keep the main context clean.