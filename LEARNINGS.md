# LEARNINGS

- Impeccable (pbakaus/impeccable) is a design skill for AI coding agents: 1 skill, 23 sub-commands (`shape`, `audit`, `polish`, `live`, etc.), 59 deterministic detector rules. Installs per-harness via `npx impeccable install` (auto-detects opencode, claude, copilot, codex, gemini). Requires Node 22.12+. First command after install is always `/impeccable init` to capture design context into PRODUCT.md (then optional DESIGN.md).
- OpenCode project skills live in `.opencode/skills/<name>/SKILL.md` and are picked up at session start — a running session must be reloaded to see newly installed skills.
