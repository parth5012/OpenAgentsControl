# Agent Instructions

## Framework / Platform

This is a general-purpose agent environment. The coding agent should follow these rules and practices when executing tasks.

## Code &amp; File Operations

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

## Wayfinder Runner

When a wayfinder map exists and you want to process all tickets in one session:

1. Invoke the `wayfinder-runner` skill: `/wayfinder-runner <map-number>`
2. Two-phase flow:
  - **Phase 1 (HITL):** prototype/grilling/HITL-task tickets are processed with the human present. Agent assists, human decides.
  - **Phase 2 (AFK):** once all HITL tickets are resolved, autonomous agents run research/task tickets unattended.
3. Each ticket gets its own agent dispatch with full context from the map
4. Code changes trigger a CodeReviewer sub-agent before recording resolution
5. Human can leave after Phase 1 — Phase 2 runs to completion

**Pattern:**

```
Task(subagent_type="general", prompt="/wayfinder-runner <map-number>")
```

## Rules

- While responding the user ,Be extremely concise and sacrifice grammar for the sake of concision.
- If you feel , you dont have access to something or you are unable to perform /execute something , write it down in a `BLOCKED.md`
- Create a `LEARNINGS.md`in every project to store the key learning , edgecases and concepts that are worth remembering.
- Always generate detailed Commits for projects
- Use statuses like Done ,Blocked ,Budget ,Compacted, Stuck, Outage, etc. ,for better user experience on tasks
- For every project create a [LOG.md](http://LOG.md) and Log every iteration into it.

