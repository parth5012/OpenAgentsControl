---
name: visual-findings
description: Generate self-contained HTML dashboard and detail pages from structured findings. Use when the user asks to see results, findings, analysis output, or wants a visual report from a coordinator/coding agent run. Accepts markdown files, JSON arrays, or plain text. Outputs stable .html files that open in any browser with no dependencies.
metadata:
  version: "1.0"
  author: OpenCode Orchestrator
---

# Visual Findings Skill

Transform structured findings into scannable, self-contained HTML reports that open in any browser — no server, no build, no dependencies.

## When to Use

**Trigger phrases (invoke when user says):**
- "show findings"
- "visualize results"
- "generate findings report"
- "present analysis"
- "show me what you found"
- Any request to see results from a coordinator/coding agent run

**Autonomous triggers (agent self-initiates):**
- After a coordinator/coding agent run completes → offer to generate visual report
- After Validator/Reviewer runs → suggest generating the visual report
- When user asks to share findings with others

## Workflow

### 1. Collect Findings

Gather findings from any source:
- Read markdown report files (REVIEW.md, SECURITY.md, etc.)
- Use structured JSON from tool outputs
- Extract from plain text descriptions

### 2. Normalize to Schema

Convert all findings into this JSON structure:

```json
{
  "id": "finding-001",
  "title": "Short finding title",
  "severity": "critical",
  "category": "security",
  "file": "src/auth/login.ts",
  "line": 42,
  "description": "Full description of the finding...",
  "recommendation": "Suggested fix...",
  "codeSnippet": "const query = `SELECT * FROM users WHERE name = '${username}'`",
  "tags": ["sql", "injection", "auth"],
  "source": "security-audit"
}
```

**Field requirements:**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `id` | Yes | string | Unique: `finding-001`, `finding-002`, etc. |
| `title` | Yes | string | Short finding title |
| `severity` | Yes | enum | `critical`, `high`, `medium`, `low`, `info` |
| `category` | Yes | string | Free-form: security, performance, bug, architecture, tech-debt |
| `file` | No | string | File path where finding was detected |
| `line` | No | number | Line number in file |
| `description` | Yes | string | Full finding description (markdown supported) |
| `recommendation` | No | string | Suggested fix |
| `codeSnippet` | No | string | Problematic code block |
| `tags` | No | string[] | Searchable/filterable tags |
| `source` | No | string | Agent or tool that produced the finding |

### 3. Generate Output

Create the output folder and generate HTML files:

```
.tmp/findings/<run-id>/
├── index.html          ← Dashboard
├── finding-001.html    ← Detail pages
├── finding-002.html
└── finding-003.html
```

Run ID format: `<YYYYMMDD>-<HHMMSS>-<4char-hex>` (e.g., `20260807-160848-a4f2`)

**Option A: Use the generation script (recommended)**

```bash
node .opencode/skills/visual-findings/scripts/generate.mjs \
  --findings findings.json \
  --output .tmp/findings/20260807-160848-a4f2 \
  --title "Security Audit Report"
```

**Option B: Generate HTML directly**

If the script can't run, generate HTML files directly using the templates in `templates/` as reference. Each file must be fully self-contained.

### 4. Report to User

Tell the user:
```
Findings report ready at .tmp/findings/20260807-160848-a4f2/index.html
Open it in your browser to view the dashboard.
```

Offer to open the file:
- Windows: `start .tmp/findings/20260807-160848-a4f2/index.html`
- macOS: `open .tmp/findings/20260807-160848-a4f2/index.html`
- Linux: `xdg-open .tmp/findings/20260807-160848-a4f2/index.html`

## Dashboard Template (index.html)

The dashboard is the entry point. Structure:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Report Title}</title>
  <style>
    /* CSS Variables - Light Theme */
    :root {
      --color-critical: #dc3545;
      --color-high: #fd7e14;
      --color-medium: #ffc107;
      --color-low: #0dcaf0;
      --color-info: #6c757d;
      --bg-primary: #ffffff;
      --bg-secondary: #f8f9fa;
      --bg-card: #ffffff;
      --text-primary: #212529;
      --text-secondary: #6c757d;
      --border: #dee2e6;
      --font-mono: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
      --radius: 8px;
      --shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    /* Dark Theme */
    [data-theme="dark"] {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --bg-card: #0f3460;
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --border: #2a2a4a;
      --shadow: 0 1px 3px rgba(0,0,0,0.3);
    }

    /* Reset & Base */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.5;
      color: var(--text-primary);
      background: var(--bg-secondary);
    }

    /* Layout */
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }

    /* Header */
    .header {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
    }
    .header h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .header .meta { font-size: 12px; color: var(--text-secondary); }

    /* Summary Cards */
    .summary-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px;
      box-shadow: var(--shadow);
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .card .count { font-size: 28px; font-weight: 700; }
    .card .label { font-size: 12px; color: var(--text-secondary); text-transform: uppercase; }
    .card.critical { border-left: 4px solid var(--color-critical); }
    .card.critical .count { color: var(--color-critical); }
    .card.high { border-left: 4px solid var(--color-high); }
    .card.high .count { color: var(--color-high); }
    .card.medium { border-left: 4px solid var(--color-medium); }
    .card.medium .count { color: var(--color-medium); }
    .card.low { border-left: 4px solid var(--color-low); }
    .card.low .count { color: var(--color-low); }
    .card.info { border-left: 4px solid var(--color-info); }
    .card.info .count { color: var(--color-info); }

    /* Category Tags */
    .category-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 16px 24px;
      margin-bottom: 24px;
      box-shadow: var(--shadow);
    }
    .category-section h3 { font-size: 12px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; }
    .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 12px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 16px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .tag:hover { background: var(--border); }
    .tag .count { font-weight: 600; }

    /* Findings Table */
    .findings-section {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .findings-section h3 {
      font-size: 12px;
      text-transform: uppercase;
      color: var(--text-secondary);
      padding: 16px 24px;
      border-bottom: 1px solid var(--border);
    }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-secondary); padding: 12px 16px; background: var(--bg-secondary); position: sticky; top: 0; }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
    tr { cursor: pointer; transition: background 0.1s; }
    tr:hover { background: var(--bg-secondary); }
    tr:last-child td { border-bottom: none; }

    /* Severity Badge */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.critical { background: rgba(220,53,69,0.15); color: var(--color-critical); }
    .badge.high { background: rgba(253,126,20,0.15); color: var(--color-high); }
    .badge.medium { background: rgba(255,193,7,0.15); color: var(--color-medium); }
    .badge.low { background: rgba(13,202,240,0.15); color: var(--color-low); }
    .badge.info { background: rgba(108,117,125,0.15); color: var(--color-info); }

    /* File reference */
    .file-ref { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); }

    /* Theme toggle */
    .theme-toggle {
      position: fixed;
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: var(--bg-card);
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow);
    }

    /* Footer */
    .footer { text-align: center; padding: 24px; font-size: 11px; color: var(--text-secondary); }

    /* Print styles */
    @media print {
      .theme-toggle { display: none; }
      .card { break-inside: avoid; }
      body { background: white; }
    }

    /* Hidden class for filtering */
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>{Report Title}</h1>
      <div class="meta">Generated: {Timestamp} · {Total Count} findings · Source: {Source}</div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards">
      <div class="card critical" onclick="filterBySeverity('critical')">
        <div class="count">{Critical Count}</div>
        <div class="label">Critical</div>
      </div>
      <div class="card high" onclick="filterBySeverity('high')">
        <div class="count">{High Count}</div>
        <div class="label">High</div>
      </div>
      <div class="card medium" onclick="filterBySeverity('medium')">
        <div class="count">{Medium Count}</div>
        <div class="label">Medium</div>
      </div>
      <div class="card low" onclick="filterBySeverity('low')">
        <div class="count">{Low Count}</div>
        <div class="label">Low</div>
      </div>
      <div class="card info" onclick="filterBySeverity('info')">
        <div class="count">{Info Count}</div>
        <div class="label">Info</div>
      </div>
    </div>

    <!-- Category Tags -->
    <div class="category-section">
      <h3>Categories</h3>
      <div class="tag-cloud">
        <!-- Generated dynamically -->
      </div>
    </div>

    <!-- Findings Table -->
    <div class="findings-section">
      <h3>All Findings</h3>
      <table>
        <thead>
          <tr>
            <th>Severity</th>
            <th>Title</th>
            <th>Category</th>
            <th>Location</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <!-- Generated dynamically -->
        </tbody>
      </table>
    </div>

    <!-- Footer -->
    <div class="footer">
      Open in browser → Ctrl+P to save as PDF
    </div>
  </div>

  <script>
    // Theme toggle
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }

    // Restore theme preference
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // Filter by severity
    function filterBySeverity(severity) {
      const rows = document.querySelectorAll('tbody tr');
      rows.forEach(row => {
        if (severity === 'all' || row.dataset.severity === severity) {
          row.classList.remove('hidden');
        } else {
          row.classList.add('hidden');
        }
      });
    }

    // Filter by category
    function filterByCategory(category) {
      const rows = document.querySelectorAll('tbody tr');
      rows.forEach(row => {
        if (row.dataset.category === category) {
          row.classList.remove('hidden');
        } else {
          row.classList.add('hidden');
        }
      });
    }

    // Reset filters
    function resetFilter() {
      document.querySelectorAll('tbody tr').forEach(row => row.classList.remove('hidden'));
    }
  </script>
</body>
</html>
```

## Detail Page Template (finding-XXX.html)

Each finding gets its own page:

```html
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Finding Title} — Findings Report</title>
  <!-- Same CSS as dashboard -->
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>
  <div class="container">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <a href="index.html">← Back to Dashboard</a>
      <span class="finding-id">{finding-id}</span>
    </div>

    <!-- Title Card -->
    <div class="title-card">
      <h1>{Finding Title}</h1>
      <div class="badges">
        <span class="badge {severity}">{severity}</span>
        <span class="category-tag">{category}</span>
        <span class="source-tag">{source}</span>
      </div>
    </div>

    <!-- Location -->
    <div class="location-block">
      <code>{file}:{line}</code>
      <button onclick="copyToClipboard('{file}:{line}')">Copy</button>
    </div>

    <!-- Description -->
    <div class="description">
      {description with markdown rendered}
    </div>

    <!-- Code Snippet -->
    <div class="code-section">
      <div class="code-header">
        <span>Code</span>
        <button onclick="copyToClipboard(`{codeSnippet}`)">Copy</button>
      </div>
      <pre><code>{codeSnippet}</code></pre>
    </div>

    <!-- Recommendation -->
    <div class="recommendation">
      <h4>Recommendation</h4>
      <p>{recommendation}</p>
    </div>

    <!-- Metadata -->
    <div class="metadata-footer">
      <div class="tags">
        <!-- Tags -->
      </div>
      <div class="meta">Generated: {timestamp} · Source: {source}</div>
    </div>

    <!-- Navigation -->
    <div class="finding-nav">
      <a href="finding-{prev-id}.html" class="prev">← Previous</a>
      <a href="finding-{next-id}.html" class="next">Next →</a>
    </div>
  </div>

  <script>
    // Same theme toggle + copyToClipboard as dashboard
  </script>
</body>
</html>
```

## Input Parsing Guide

### Markdown Parsing

Parse structured markdown reports with this format:

```markdown
## 🔴 SQL Injection in login handler
**File:** src/auth/login.ts:42
**Category:** security
**Tags:** sql, injection, auth

User input concatenated directly into SQL query without sanitization.

```typescript
const query = `SELECT * FROM users WHERE name = '${username}'`
```

**Recommendation:** Use parameterized queries via pg.escape()
```

Parsing rules:
- `##` or `###` heading = finding title (strip severity emoji)
- Severity emoji in title: 🔴 critical, 🟠 high, 🟡 medium, 🔵 low, ⚪ info
- `**File:**` line = file path + optional line number
- `**Category:**` line = category
- `**Tags:**` line = comma-separated tags
- Fenced code block = code snippet
- `**Recommendation:**` paragraph = recommendation
- Everything between title and recommendation = description

### JSON Array Parsing

Direct mapping — pass JSON array directly to the generator. Each object should match the normalized schema.

### Plain Text Extraction

When findings are described in plain text, extract:
1. Look for severity indicators: "critical", "high", "medium", "low", "minor"
2. Look for file paths: patterns like `src/file.ts` or `path/to/file.py:42`
3. Look for code blocks: inline code or fenced blocks
4. Look for recommendations: "should", "recommend", "fix", "consider"
5. Assign sequential IDs (finding-001, finding-002, etc.)

## Output Guidelines

1. **Always generate index.html** — the dashboard is the entry point
2. **One detail page per finding** — named `finding-XXX.html`
3. **All files self-contained** — embed all CSS/JS, no external requests
4. **Relative links only** — detail pages link to `index.html` and each other
5. **File size target** — <50KB per file
6. **Output to `.tmp/findings/<run-id>/`** — keeps workspace clean

## Autonomy Rules

- Agent can call this skill without asking permission (read-only visualization)
- Agent must report the output path to user
- Agent should offer to open the file after generation
- Agent should suggest generating a report after coordinator/coding agent runs complete
