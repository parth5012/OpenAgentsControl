# Visual Findings Skill — Design Spec

**Date:** 2026-08-07  
**Status:** Approved  
**Author:** OpenCode Orchestrator  

---

## 1. Overview

### What it does
The `visual-findings` skill lets agents transform structured findings (from any source) into self-contained HTML dashboard + detail pages. Users can open these stable files in any browser — no server, no build, no dependencies.

### Why it exists
Coordinator and coding agents produce findings (code analysis, security audits, research outputs, validation reports). Currently these are shared as markdown in chat — hard to scan, no navigation, no visual hierarchy. This skill gives agents a way to present findings as scannable, shareable, stable web reports.

### Skill name
`visual-findings`

### Location
`.opencode/skills/visual-findings/SKILL.md`

---

## 2. Input Normalization

### Accepted input modes

| Mode | Source | Parsing |
|------|--------|---------|
| **Markdown file** | `REVIEW.md`, `SECURITY.md`, etc. | Parse `##`/`###` headings as finding titles, severity badges (`🔴 critical`, `🟠 high`, `🟡 medium`, `🔵 low`, `⚪ info`), fenced code blocks as snippets, `file:line` references |
| **JSON array** | Agent tool outputs, structured data | Direct mapping to schema |
| **Plain text** | Agent describes findings in prompt | LLM extraction to structured schema |

### Normalized Finding Schema

```json
{
  "id": "finding-001",
  "title": "SQL Injection in login handler",
  "severity": "critical",
  "category": "security",
  "file": "src/auth/login.ts",
  "line": 42,
  "description": "User input concatenated directly into SQL query...",
  "recommendation": "Use parameterized queries via pg.escape()",
  "codeSnippet": "const query = `SELECT * FROM users WHERE name = '${username}'`",
  "tags": ["sql", "injection", "auth"],
  "source": "security-audit"
}
```

### Field definitions

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | Unique identifier (e.g., `finding-001`) |
| `title` | Yes | string | Short finding title |
| `severity` | Yes | enum | `critical`, `high`, `medium`, `low`, `info` |
| `category` | Yes | string | Free-form (security, performance, bug, architecture, tech-debt, etc.) |
| `file` | No | string | File path where finding was detected |
| `line` | No | number | Line number in file |
| `description` | Yes | string | Full finding description (supports markdown) |
| `recommendation` | No | string | Suggested fix or improvement |
| `codeSnippet` | No | string | Problematic code block |
| `tags` | No | string[] | Searchable/filterable tags |
| `source` | No | string | Agent or tool that produced the finding |

### Severity levels

| Level | Color | Hex |
|-------|-------|-----|
| critical | Red | `#dc3545` |
| high | Orange | `#fd7e14` |
| medium | Amber | `#ffc107` |
| low | Cyan | `#0dcaf0` |
| info | Gray | `#6c757d` |

---

## 3. Output Structure

### Folder layout

```
.tmp/findings/<run-id>/
├── index.html          ← Dashboard (overview + finding list)
├── finding-001.html    ← Detail page per finding
├── finding-002.html
├── finding-003.html
└── (no assets folder — everything embedded)
```

### Run ID format
`<YYYYMMDD>-<HHMMSS>-<4char-hex>` (e.g., `20260807-160848-a4f2`)

### File characteristics
- Each HTML is fully self-contained (embedded CSS, JS, fonts)
- No external dependencies
- ~50KB per file budget
- Fonts load async, degrade to system fonts offline
- Opens via `file://` protocol (double-click)

---

## 4. Dashboard Design (index.html)

### Layout (top to bottom)

1. **Header bar**
   - Report title
   - Generation timestamp
   - Total finding count
   - Source agent name

2. **Summary cards row**
   - 5 cards: critical, high, medium, low, info
   - Each shows count + color
   - Click to filter table

3. **Category breakdown**
   - Tag cloud with count badges
   - Each tag is clickable to filter
   - Size/weight proportional to finding count

4. **Findings table**
   - Columns: severity badge, title, category, file reference, action link
   - Sortable (by severity, title, category)
   - Click row → opens detail page

5. **Footer**
   - Export hint ("Ctrl+P to save as PDF")

### Interactions (vanilla JS, no dependencies)
- Click severity card → filter table
- Click category tag → filter table
- Click finding row → open detail page
- Keyboard navigation support
- Sticky header

---

## 5. Detail Page Design (finding-XXX.html)

### Layout

1. **Breadcrumb** — `← Back to Dashboard` link + finding ID
2. **Title card** — Title, severity badge, category tag, source agent
3. **Location block** — File path + line number (monospace, copyable)
4. **Description** — Full description with markdown rendering
5. **Code snippet** — Syntax-highlighted code block with copy button
6. **Recommendation** — Callout box with fix suggestion
7. **Metadata footer** — Tags, generation time, source reference

### Features
- "Copy link" button (copies file path for IDE navigation)
- Code block copy button
- Print-optimized CSS
- Consistent header styling with dashboard
- Optional: prev/next finding links at bottom

---

## 6. Visual System

### Default style
Clean Light with dark mode toggle (respects `prefers-color-scheme`, persists in `localStorage`).

### Design tokens (CSS variables)

```css
--color-critical: #dc3545;
--color-high:     #fd7e14;
--color-medium:   #ffc107;
--color-low:      #0dcaf0;
--color-info:     #6c757d;
--font-mono:      'JetBrains Mono', ui-monospace, system-mono;
--font-sans:      'Inter', system-ui, system-sans;
--radius:         8px;
--shadow:         0 1px 3px rgba(0,0,0,0.1);
```

### Typography
- Body: 14px
- Metadata: 12px
- Tags: 11px
- Findings table: 13px title, 11px file ref
- Detail page: 20px title, 14px body, 12px code

### Export
- **Print-to-PDF** — `@media print` styles, user presses Ctrl+P
- **Shareable** — zip the folder, all files self-contained
- **Open anywhere** — double-click index.html, no server needed

---

## 7. Agent Integration

### Trigger phrases
- "show findings"
- "visualize results"
- "generate findings report"
- "present analysis"
- User asks to see results from a coordinator/coding agent run

### Autonomous triggers
1. **Explicit** — User says "show findings" → agent invokes skill
2. **Post-run** — After coordinator/coding agent completes, agent auto-offers: *"I've generated a visual findings report. Want me to open it?"*
3. **Post-validation** — After Validator/Reviewer runs, agent auto-suggests generating the visual report

### Agent workflow
```
1. Collect findings (tool outputs, file reads, internal analysis)
2. Normalize to JSON schema
3. Call visual-findings skill with findings JSON
4. Skill generates .tmp/findings/<run-id>/ folder
5. Agent reports: "Findings report ready at .tmp/findings/<run-id>/index.html"
6. User opens in browser
```

### Autonomy rules
- Agent can call skill without asking permission (read-only visualization)
- Agent must report output path to user
- Agent should offer to open the file (e.g., `start` on Windows, `open` on macOS, `xdg-open` on Linux)

### Skill description (for agent matching)
> "Generate self-contained HTML dashboard and detail pages from structured findings. Use when the user asks to see results, findings, analysis output, or wants a visual report from a coordinator/coding agent run. Accepts markdown files, JSON arrays, or plain text. Outputs stable .html files that open in any browser with no dependencies."

---

## 8. Implementation Plan

### Phase 1: Core Template System
- Create SKILL.md with full instructions
- Build HTML dashboard template (index.html generator)
- Build HTML detail page template (finding-XXX.html generator)
- Implement CSS design system with dark/light mode
- Implement vanilla JS filtering and interactivity

### Phase 2: Input Parsers
- Markdown findings parser (headings, severity, code blocks, file refs)
- JSON array direct mapper
- Plain text LLM extraction prompt

### Phase 3: Agent Integration
- Write skill description for agent matching
- Add trigger phrase handling
- Implement autonomous post-run suggestion logic
- Test with coordinator + coding agent workflows

### Phase 4: Export & Polish
- Print-to-PDF CSS optimization
- Copy-to-clipboard for code blocks and file paths
- Keyboard navigation
- Performance optimization (target <50KB per file)

---

## 9. Success Criteria

- [ ] Agent can generate findings report from markdown, JSON, or text
- [ ] Output is self-contained HTML (no server needed)
- [ ] Dashboard shows summary cards, category breakdown, findings table
- [ ] Detail pages have title, description, code, recommendation
- [ ] Dark/light mode toggle works
- [ ] Ctrl+P produces clean PDF
- [ ] Agent autonomously offers to generate report after runs
- [ ] Files are <50KB each
- [ ] Works offline (fonts degrade to system)

---

## 10. Out of Scope

- Server-side rendering or API
- Real-time collaboration
- Database persistence
- User authentication
- Interactive charts (use CSS-only visualizations)
- Mobile app (desktop browser is target)
