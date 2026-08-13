# LOG

## 2026-08-11

### Impeccable skill install
- **Status:** Done
- **What:** Installed the Impeccable design skill (pbakaus/impeccable, v4.0.4) via `npx impeccable install`.
- **Where:** Project scope — `.opencode/skills/impeccable/` (OpenCode), `.github/skills/impeccable/` + `.github/agents` + hooks (GitHub Copilot).
- **Verified:** `SKILL.md` frontmatter valid (name: impeccable, allowed-tools points to `.opencode/skills/impeccable/scripts/*`). Node v24.18.0, npm 11.16.0.
- **Next:** Reload OpenCode session for `/impeccable` to appear, then run `/impeccable init` to write PRODUCT.md.

### Pin `/init` command
- **Status:** Done
- **What:** Ran `node .opencode/skills/impeccable/scripts/pin.mjs pin init` to create a standalone `/init` command shortcut.
- **Where:** `.opencode/skills/init/SKILL.md` (OpenCode), `.github/skills/init` (Copilot). Description + argument-hint from command-metadata.json, marked `impeccable-pinned-skill`.
- **Verified:** File exists with valid frontmatter (`name: init`, `user-invocable: true`). Invokes `/impeccable init`.
### Rename `/init` → `/impeccable-init`
- **Status:** Done
- **What:** Old `init` name conflicted with OpenCode's default `/init` command. Unpinned it (`pin.mjs unpin init`), then created renamed shortcut manually.
- **Where:** `.opencode/skills/impeccable-init/SKILL.md` + `.github/skills/impeccable-init/SKILL.md` (kept parity with Copilot). Both keep `impeccable-pinned-skill` marker and redirect to `/impeccable init`.
- **Verified:** `.opencode/skills/init` and `.github/skills/init` removed; new dirs exist with valid frontmatter.
### Create `/impeccable-init` command (from skill)
- **Status:** Done
- **What:** Created `.opencode/command/impeccable-init.md` — a proper OpenCode command that loads the impeccable skill and runs its init flow (context.mjs → explore → interview → PRODUCT.md → live config → next-step recommendation).
- **Where:** `.opencode/command/impeccable-init.md` (project command, shows in `/` palette). Removed redundant `.opencode/skills/impeccable-init/` pinned skill to avoid duplicate suggestions. Kept `.github/skills/impeccable-init` for Copilot parity.
- **Verified:** Command file exists with description frontmatter; skill shortcut dir removed.
- **Note:** Copilot still uses the pinned skill at `.github/skills/impeccable-init`.

2026-08-13

### Babysitter skill + /babysit command
**Status:** Done
**What:** Created babysitter skill (on-demand branch snapshot: commit, push to GitHub, open/refresh PR via gh CLI for later review, never auto-merge) and /babysit slash command.
**Where:** .opencode/skills/babysitter/SKILL.md + .opencode/commands/babysit.md
**Verified:** Files exist, follow local frontmatter conventions; skill reuses  for optional commit message.
**Next:** Restart OpenCode so /babysit registers; run /babysit on first feature branch to test.

**Renamed:** Babysitter -> checkpoint (/babysit -> /checkpoint) after user feedback name didn't look good. Files: .opencode/skills/checkpoint/SKILL.md, .opencode/commands/checkpoint.md. Same workflow.

### Asset upload skill
**Status:** Done
**What:** Created asset-upload skill for any generated/fetched asset (screenshots, audio, video, text, pdf, zip): upload to free anonymous host, return public URL. Script: .opencode/scripts/upload.ts (catbox permanent default, litterbox temp 1GB, 0x0 ~30d). Command: /upload.
**Verified:** Live test uploaded AGENTS.md -> https://files.catbox.moe/u8w3eb.md EXIT=0.
**Next:** Restart OpenCode; agents auto-use /upload to share generated artifacts.
