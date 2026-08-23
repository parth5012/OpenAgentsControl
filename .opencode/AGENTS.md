# Claude-Mem Memory Context

<claude-mem-context>

# Memory Context from Past Sessions

*No context yet. Complete first session context appear here.*

Use claude-mem search tools manual memory queries.

</claude-mem-context>

---

# Agent Instructions

## Framework / Platform

general-purpose agent environment. coding agent follow rules practices when executing tasks.
For Python package management always prefer using uv.

## Code &amp; File Operations

**Understand First**: check project graphify setup before trying read relevant codebase files`read``glob``grep`). Never use grep , we have ripgrap installed which is more efficient than grep and its alias as rg.
**Minimal Changes**: Make smallest possible changes required achieve goal correctly. Avoid refactoring unrelated code.
**Code Style**: Follow style, indentation, naming conventions, file structures existing codebase.
**Systematic Fixes**: When fixing bugs, analyze logs test errors, locate root cause, apply fix, re-run verification.
**Overwrite safety**: write new files unless explicitly requested necessary. Modify existing ones instead.

## Execution Guardrails

**Plan-First**: Break complex, multi-step tasks clear steps checkpoints.
**Safety Zones**: run destructive commands (such`rm -rf``git reset --hard`unless strictly verified requested.
**Attribution**: Stage commit files only when explicitly asked.

## Verification

Test all changes before declaring task complete.
Ensure linting, compilation, any existing test suites pass successfully.

## Definition Done

task **DONE** only when:

1. Relevant testsgreen (unit + integration)
2. Typecheck passes clean
3. user-facing flows: exercised end-to-end (e.g. Playwright for web)
4. Changes committed detailed commit message
5. LEARNINGS.md updated new edge case discovered
6. Logged LOG.md status iteration notes

**Never report "done" without running verification. skipped, say plainly.**

## TDD mandatory

Every change follows **failing test first implement verify**:

1. Writetest(s)capture desired behavior watch **fail** (red).
2. Implement minimum make pass.
3. Run suite typecheck confirm green.

Don't write implementation before failing test exists. When fixing bug, reproduce failing test first.

## Context Re-entry (multi-project juggling)

juggle several projects concurrent sessions. Write every user-facing message **cold re-entry**:

**Open recap.** Before any summary/decision/question: 2–3 plain sentences what working on, why, where stands.
**Plain language.** codenames, abbreviations, callbacks like "the earlier fix" restate thing place.
**Self-contained questions.** When asking decision, include background, options, tradeoffs, recommendation.
**One question time.** Say how many decisions waiting, present only first, wait answer before next.
**Anchor work.** Name project, branch, when reporting status.
**End next action.** Close single thing waiting me, say explicitly nothing is.

## Worktrees

When starting any new feature fix, create separate git worktree base branch. all work inside parallel agents overwrite each other. After merge, remove worktree. next task, create fresh worktree latest base branch.

## Builder/DriverSplit (token optimization)

agent *built* feature sits hugecontext (150k–200k tokens). drives review, entire context resent every turn. Instead:
**Builder** builds, commits branch, ends`HANDOFF: INTENT`paragraph (what changed + why)
**Driver** (fresh, cheap, tiny-context agent) runs review gate, monitors, answers questions
**Gate rules**: auto-fix findings; approve info-only; human decisions PARK verbatim end task orchestrator relays 82: end subagent turn while gate run active background processes orphan instantly

## Harness Patterns

**Teach agent.** Create docs business logic, data, technology, patterns, practices, architecture. Cross-link them.
**Point docs live code.** Reference architecture docs code comments where decisions live.
**One item per fresh chat.** Don't chain unrelated tasks one session.
**Close loop.** After completing work: verify itself, write logs, test appropriate tools, give feedback same session.
**Spawn helper agents** research, review, verification keep main context clean.
**Never compact chat.** Data loss risk.
**Recover git.**`git reset --hard`fix loop run again.
**Loop anything repetitive.** Features, tests, refactor, docs, cleanup, audit, eval all automated loops.
**Fix bugs older than you.** When issue arises, update instructionsrecurs (don't just patch by hand).
**Build spec before code.** produce spec plan before implementing.

## Statuses

Use these statuses for tasks:

- `Done` - completed successfully
- `Blocked`documented BLOCKED.md reason
- `Budget`token/time budget exhausted
- `Compacted`— contextcompacted (potential data loss)
- `Stuck`unable proceed, needs human
- `Outage`tool/service unavailable
- `Review`awaiting review gate

## Artifacts

`BLOCKED.md`write anything can't access execute file, then stop
`LEARNINGS.md`key learnings, edge cases, decision rationale per project
`LOG.md`log every iteration status, what changed, verification result
`TECH_DEBT.md`track tech debt separately distinguish choice bugs
`PROMPT.md`define automatedloop (Ralph Loop)repetitive workflows
`DECISIONS.md`track architectural and design tradeoff decisions with rationale, alternatives considered, and why chosen
`.tmp/`all temporary generated files

## Commit Standards

generate detailed commits:

- What changed why
- Whatverified (tests run, typecheck status)
- Any decisions made rationale
- References issues/tickets when applicable

**Atomic commits**: one logical change per commit. Never mix unrelated changes. Each commit should be independently understandable and revertable. Write a commit message that explains *what* and *why*, not just *how*.

## Resume

When project context requires future reference (e.g. job applications, portfolio, stakeholder updates), maintain a project resume in `RESUME.md` or equivalent. Capture: tech stack, key achievements, challenges solved, measurable outcomes. Add to this when a meaningful milestone is reached.

**Pattern:**

```
Task(subagent_type="general", prompt="/wayfinder-runner <map-number>")
```

## Concision

When responding to me, Be extremely concise. Sacrifice grammar sake concision. Answer directly without preamble postamble. Use `visual-findings` skill whenever the output needs to be long for the user.