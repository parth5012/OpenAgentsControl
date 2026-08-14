Agent Instructions

Framework / Platform
general-purpose agent environment. coding agent follow rules practices when executing tasks.

Code File Operations
**Understand First**: read relevant codebase files `read` `glob` `grep` before making planning any modifications.
**Minimal Changes**: Make smallest possible changes required achieve goal correctly. Avoid refactoring unrelated code.
**Code Style**: Follow style, indentation, naming conventions, file structures existing codebase.
**Systematic Fixes**: When fixing bugs, analyze logs test errors, locate root cause, apply fix, re-run verification.
**Overwrite safety**: write new files unless explicitly requested necessary. Modify existing ones instead.

Execution Guardrails
**Plan-First**: Break complex, multi-step tasks clear steps checkpoints.
**Safety Zones**: run destructive commands (such `rm -rf` `git reset --hard` unless strictly verified requested.
**Attribution**: Stage commit files only when explicitly asked.

Verification
Test all changes before declaring task complete.
Ensure linting, compilation, any existing test suites pass successfully.
