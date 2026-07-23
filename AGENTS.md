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

While responding the user ,Be extremely concise and sacrifice grammar for the sake of concision.
