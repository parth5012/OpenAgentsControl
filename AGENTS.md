# Agent Instructions

## Framework / Platform

general-purpose agent environment. coding agent follow rules practices when executing tasks.

## Code & File Operations

**Understand First**: check project graphify setup before trying read relevant codebase files`read``glob``grep`).
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

## Wayfinder Runner

When wayfinder map exists want process all tickets one session:

1. Invoke`wayfinder-runner`skill:`/wayfinder-runner <map-number>`
2. Two-phase flow:
 **Phase 1 (HITL):** prototype/grilling/HITL-task tickets processed human present. Agent assists, human decides.
 **Phase 2 (AFK):** once all HITL tickets resolved, autonomous agents run research/task tickets unattended.
3. Each ticket gets own agent dispatch full context map
4. Code changes trigger CodeReviewer sub-agent before recording resolution
5. Human leave after Phase 1 Phase 2 runs completion

**Pattern:**
```
Task(subagent_type="general", prompt="/wayfinder-runner <map-number>")
```

## Rules

While responding user, Be extremely concise sacrifice grammar sake concision.
feel don't access something unable perform / executesomething, write down`BLOCKED.md`
Create`LEARNINGS.md`every project store key learning edge cases concepts worth remembering.
Generate detailed commits for every project.
Use statuses like Done, Blocked, Budget, Compacted, Stuck, Outage, etc. for better user experience tasks.
Every project create`LOG.md` and Log every iteration into it.
Place all generated temporary files in`.tmp`project directory.
Create`DECISIONS.md`every project to track architectural and design tradeoff decisions with rationale, alternatives considered, and why chosen.
Maintain`RESUME.md`every project for future reference (job applications, portfolio, stakeholder updates). Capture: tech stack, key achievements, challenges solved, measurable outcomes. Add when meaningful milestone reached.
Create atomic commits for every project — one logical change per commit, never mix unrelated changes. Each commit should be independently understandable and revertable.
