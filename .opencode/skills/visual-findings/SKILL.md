---
name: visual-findings
description: Generate self-contained HTML dashboard and detail pages from structured findings. Use when the user asks to see results, findings, analysis output, or wants a visual report from a coordinator/coding agent run. Accepts markdown files, JSON arrays, or plain text. Outputs stable .html files that open in any browser with no dependencies.
metadata:
  version: 2.0
  author: OpenCode Orchestrator
---

# Visual Findings Skill

Transform structured findings into scannable, self-contained HTML reports that open in any browser with no server, build step, or dependencies.

## When to Use

**Trigger phrases:**
- "show findings"
- "visualize results"
- "generate findings report"
- "present analysis"
- "show what you found"

**Autonomous triggers:**
- After coordinator/coding agent run completes, offer to generate visual report
- After Validator/Reviewer runs, suggest generating visual report
- When user asks to share findings with others

---

## Workflow

### 1. Collect Findings
Gather findings from markdown reports, JSON tool outputs, or plain text.

### 2. Normalize Schema
Convert all findings to JSON:
```json
[
  {
    "id": "finding-001",
    "title": "Short finding title",
    "severity": "critical | high | medium | low | info",
    "category": "security | performance | tech-debt | ux | bug | accessibility",
    "file": "src/auth/login.ts",
    "line": 42,
    "url": "https://github.com/org/repo/blob/main/src/auth.ts#L42",
    "description": "Full description...",
    "recommendation": "Suggested fix...",
    "codeSnippet": "const query = `SELECT...`",
    "tags": ["xss", "escaping"],
    "source": "ui-audit"
  }
]
```
> **Note on URLs & Links:** Optional `url` (or `href` / `link` / `sourceUrl`) field adds a direct, clickable `target="_blank"` link in both dashboard rows and detail views. Ideal for linking to GitHub codebase lines, bug trackers, problem statements, or extracted web content.

### 3. Generate HTML Report
Run `scripts/generate.mjs`:
```bash
node .opencode/skills/visual-findings/scripts/generate.mjs \
  --findings findings.json \
  --output .tmp/findings/run-id \
  --title "Security Audit — Auth Module" \
  --style master-detail
```

---

## Available Styles (`--style`)

| Style Flag | Alias | Description | Ideal For |
|---|---|---|---|
| `--style v13` | `master-detail`, `sentry` | **Recommended.** Two-pane layout with zero page navigation; findings update in-place with arrow key navigation. | Deep triage sessions |
| `--style v7` | `linear` | Near-black restraint, single indigo accent, 13px issue-list density, priority bars, sidebar views. | Developer tool audits |
| `--style v14` | `shadcn` | Zinc dark palette, segmented severity tabs, outline badges, rounded cards. | Clean production default |
| `--style v12` | `vercel` | Pure black + grays, monochrome restraint, quiet severity dots. | Minimalist dark reports |
| `--style v8` | `supabase` | DevOps console: project sidebar, KPI tiles, dense table, green accent on charcoal. | Ops & infra audits |
| `--style v10` | `github` | Repo-style header, tab counts, state icons, accessible label color pairs. | GitHub-native feel |
| `--style v5` | `refined-ops` | Heat-bar distribution strip, live search, working severity & category filters, light+dark toggle. | Multi-category reviews |
| `--style v6` | `kanban` | Grouped severity columns instead of a table. | Item-by-item triage |
| `--style default` | — | Legacy bootstrap-style baseline layout. | Backward compatibility |

---

## Output Structure
- `index.html` — The main dashboard (or single-page master-detail for `v13`).
- `finding-001.html`, `finding-002.html`... — Dedicated detail pages (omitted for single-page styles like `v13`).

All generated HTML files are **100% self-contained** (inline CSS & JS, zero external network requests) and safe to open from `file://`.
