# LOG

## 2026-09-01

### serve-html -> serve-content skill upgrade
- **Status:** Done
- **What:** Upgraded serve-html skill to serve-content. Added multi-media support (images, videos, PDFs). Upgraded cron-system server with: auto-discovery of static dirs, gzip + cache-control middleware, admin API (list/status/delete endpoints), web upload form with drag-and-drop + password gate, auto-generated index page.
- **Where:** `.opencode/skills/serve-content/SKILL.md` (OpenCode Setup), `main.py` + `requirements.txt` (cron-system)
- **Commits (cron-system):** 5 atomic commits (middleware, auto-discovery, admin API, upload+index, import cleanup)
- **Commits (OpenCode Setup):** `refactor: rename serve-html to serve-content with multi-media support`
- **Future:** GitHub API persistence for web uploads (documented in SKILL.md as roadmap)
- **Next:** Set ADMIN_SECRET and UPLOAD_PASSWORD env vars in Vercel, then push cron-system to deploy.


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

### Visual-findings template gallery (rounds 1-2)
**Status:** Review
**What:** User flagged visual-findings UI as lame + templates/ dir empty. Built 10 design variants (dashboard+detail each, identical 6-finding demo data = real audit of the skill itself) in .tmp/findings-ui-gallery/ + gallery index.html. Round 1: Terminal, Editorial, Aurora Glass, Brutalist, Refined Ops, Kanban. Round 2 (after web research on 2026 dashboard trends): Linear, Supabase Console, Stripe Analytics, GitHub Primer. All opened/reviewed via Orca embedded browser (orca tab create/goto/screenshot).
**Verified:** Screenshots of all 4 round-2 dashboards render clean; baseline v1.0 generated via existing generate.mjs for contrast.
**Saved:** User picked V5 (refined-ops) + V6 (kanban) -> copied to .opencode/skills/visual-findings/templates/{v5-refined-ops,v6-kanban}/{dashboard,detail}.html.
**Next:** User votes on round 2 (V7-V10); winners also copied to templates/; then wire --style flag into generate.mjs.

### Visual-findings round 3 (dark-only simplicity pass)
**Status:** Review
**What:** User saved V7/V8/V10 to templates/ (5 canonical total incl. V5/V6; V9 Stripe rejected - user not a light-mode guy). Built round 3 dark-only UX-first variants: V11 Raycast command-bar, V12 Vercel Geist monochrome, V13 Sentry master-detail (zero page navigation, arrow-key nav), V14 shadcn/ui zinc. All screenshot-verified in Orca browser.
**Next:** User votes round 3; save winners; then wire --style flag into generate.mjs.

### Visual-findings round 3 saved
**Status:** Done (template phase)
**What:** Saved V12 vercel, V13 master-detail (single-page, no separate detail.html), V14 shadcn to templates/. Canonical set now: v5-refined-ops, v6-kanban, v7-linear, v8-supabase, v10-github, v12-vercel, v13-master-detail, v14-shadcn. Rejected by user: V1-V4 (round 1 loud/experimental), V9 stripe + V11 raycast (light/wrong fit).
**Verified:** 15 files present under .opencode/skills/visual-findings/templates/.
**Next:** wire --style flag into generate.mjs mapping to these template dirs (user has not yet requested).

### Visual-findings --style generator wiring complete
**Status:** Done
**What:** Wired `--style` flag into `generate.mjs`. Created `scripts/styles/` module architecture (`shared.mjs` + 8 style modules: v5-refined-ops, v6-kanban, v7-linear, v8-supabase, v10-github, v12-vercel, v13-master-detail, v14-shadcn). Added dynamic import, CLI alias mapping (e.g. `linear`, `sentry`, `shadcn`), and XSS escaping across all styles.
**Verified:** TDD test harness `.opencode/skills/visual-findings/scripts/test/generate.test.mjs` running 20 test suites � all 20 pass green (default, all 8 styles x 2 aliases, XSS escaping, unknown-style handling).
**Updated:** `SKILL.md` bumped to v2.0 with `--style` documentation table.

### URL / Href link support added across visual-findings reports
**Status:** Done
**What:** Added `url` (and aliases `href`, `link`, `sourceUrl`, `targetUrl`) support to visual-findings schema and generator. In dashboards, URL links render as clickable `target="_blank"` link badges (with `event.stopPropagation()` so row clicks still navigate to details). In detail views/master-detail panes, direct links open source codebase locations, bug trackers, problem statements, or extracted web resources with 1-click.
**Verified:** TDD test harness `generate.test.mjs` running 21/21 passing test suites.
**Updated:** `SKILL.md` updated with URL schema property & usage note.

