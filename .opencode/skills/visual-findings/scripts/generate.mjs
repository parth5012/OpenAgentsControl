#!/usr/bin/env node
/**
 * Visual Findings Generator
 * 
 * Generates self-contained HTML dashboard + detail pages from findings JSON.
 * 
 * Usage:
 *   node generate.mjs --findings findings.json --output .tmp/findings/run-id --title "Report Title"
 * 
 * Input: JSON array of findings (see schema in SKILL.md)
 * Output: index.html + finding-XXX.html files
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(name);
  return idx !== -1 ? args[idx + 1] : null;
};

const findingsPath = getArg('--findings');
const outputDir = getArg('--output');
const reportTitle = getArg('--title') || 'Findings Report';

if (!findingsPath || !outputDir) {
  console.error('Usage: node generate.mjs --findings <path.json> --output <dir> [--title "Report"]');
  process.exit(1);
}

// Load findings
const findings = JSON.parse(readFileSync(findingsPath, 'utf-8'));

// Ensure output dir exists
mkdirSync(outputDir, { recursive: true });

// Severity colors
const severityColors = {
  critical: '#dc3545',
  high: '#fd7e14',
  medium: '#ffc107',
  low: '#0dcaf0',
  info: '#6c757d'
};

// Count by severity
const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
findings.forEach(f => { if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++; });

// Count by category
const categoryCounts = {};
findings.forEach(f => { categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1; });

// Generate timestamp
const now = new Date().toLocaleString();

// Dashboard HTML
function generateDashboard() {
  const totalFindings = findings.length;
  
  const summaryCards = Object.entries(severityCounts).map(([sev, count]) => `
    <div class="card ${sev}" onclick="filterBySeverity('${sev}')">
      <div class="count">${count}</div>
      <div class="label">${sev.charAt(0).toUpperCase() + sev.slice(1)}</div>
    </div>
  `).join('');

  const categoryTags = Object.entries(categoryCounts).map(([cat, count]) => `
    <span class="tag" onclick="filterByCategory('${cat}')">${cat} <span class="count">${count}</span></span>
  `).join('');

  const tableRows = findings.map(f => `
    <tr data-severity="${f.severity}" data-category="${f.category}" onclick="window.location.href='${f.id}.html'">
      <td><span class="badge ${f.severity}">${f.severity}</span></td>
      <td>${f.title}</td>
      <td>${f.category}</td>
      <td><span class="file-ref">${f.file ? `${f.file}${f.line ? ':' + f.line : ''}` : '—'}</span></td>
      <td><a href="${f.id}.html">View →</a></td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportTitle}</title>
  <style>
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
    [data-theme="dark"] {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --bg-card: #0f3460;
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --border: #2a2a4a;
      --shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-sans); font-size: 14px; line-height: 1.5; color: var(--text-primary); background: var(--bg-secondary); }
    .container { max-width: 1200px; margin: 0 auto; padding: 24px; }
    .header { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px 24px; margin-bottom: 24px; box-shadow: var(--shadow); }
    .header h1 { font-size: 20px; font-weight: 600; margin-bottom: 4px; }
    .header .meta { font-size: 12px; color: var(--text-secondary); }
    .summary-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 16px; margin-bottom: 24px; }
    .card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; box-shadow: var(--shadow); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s; }
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
    .category-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px 24px; margin-bottom: 24px; box-shadow: var(--shadow); }
    .category-section h3 { font-size: 12px; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 12px; }
    .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
    .tag { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: var(--bg-secondary); border: 1px solid var(--border); border-radius: 16px; font-size: 12px; cursor: pointer; transition: background 0.15s; }
    .tag:hover { background: var(--border); }
    .tag .count { font-weight: 600; }
    .findings-section { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden; }
    .findings-section h3 { font-size: 12px; text-transform: uppercase; color: var(--text-secondary); padding: 16px 24px; border-bottom: 1px solid var(--border); }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; color: var(--text-secondary); padding: 12px 16px; background: var(--bg-secondary); position: sticky; top: 0; }
    td { padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
    tr { cursor: pointer; transition: background 0.1s; }
    tr:hover { background: var(--bg-secondary); }
    tr:last-child td { border-bottom: none; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .badge.critical { background: rgba(220,53,69,0.15); color: var(--color-critical); }
    .badge.high { background: rgba(253,126,20,0.15); color: var(--color-high); }
    .badge.medium { background: rgba(255,193,7,0.15); color: var(--color-medium); }
    .badge.low { background: rgba(13,202,240,0.15); color: var(--color-low); }
    .badge.info { background: rgba(108,117,125,0.15); color: var(--color-info); }
    .file-ref { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); }
    .theme-toggle { position: fixed; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow); }
    .footer { text-align: center; padding: 24px; font-size: 11px; color: var(--text-secondary); }
    @media print { .theme-toggle { display: none; } .card { break-inside: avoid; } body { background: white; } }
    .hidden { display: none !important; }
  </style>
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>
  <div class="container">
    <div class="header">
      <h1>${reportTitle}</h1>
      <div class="meta">Generated: ${now} · ${totalFindings} findings</div>
    </div>
    <div class="summary-cards">
      ${summaryCards}
    </div>
    <div class="category-section">
      <h3>Categories</h3>
      <div class="tag-cloud">
        ${categoryTags}
      </div>
    </div>
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
          ${tableRows}
        </tbody>
      </table>
    </div>
    <div class="footer">
      Open in browser → Ctrl+P to save as PDF
    </div>
  </div>
  <script>
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    function filterBySeverity(severity) {
      document.querySelectorAll('tbody tr').forEach(row => {
        row.classList.toggle('hidden', row.dataset.severity !== severity);
      });
    }
    function filterByCategory(category) {
      document.querySelectorAll('tbody tr').forEach(row => {
        row.classList.toggle('hidden', row.dataset.category !== category);
      });
    }
  </script>
</body>
</html>`;
}

// Detail page HTML
function generateDetailPage(finding, prevId, nextId) {
  const codeBlock = finding.codeSnippet
    ? `<div class="code-section">
      <div class="code-header">
        <span>Code</span>
        <button onclick="copyCode()">Copy</button>
      </div>
      <pre><code>${escapeHtml(finding.codeSnippet)}</code></pre>
    </div>`
    : '';

  const recommendation = finding.recommendation
    ? `<div class="recommendation">
      <h4>Recommendation</h4>
      <p>${finding.recommendation}</p>
    </div>`
    : '';

  const tags = finding.tags && finding.tags.length
    ? `<div class="tags">
      ${finding.tags.map(t => `<span class="badge info">${t}</span>`).join(' ')}
    </div>`
    : '';

  const nav = `<div class="finding-nav">
    ${prevId ? `<a href="${prevId}.html" class="prev">← Previous</a>` : '<span></span>'}
    ${nextId ? `<a href="${nextId}.html" class="next">Next →</a>` : ''}
  </div>`;

  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${finding.title} — Findings Report</title>
  <style>
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
    [data-theme="dark"] {
      --bg-primary: #1a1a2e;
      --bg-secondary: #16213e;
      --bg-card: #0f3460;
      --text-primary: #e0e0e0;
      --text-secondary: #a0a0a0;
      --border: #2a2a4a;
      --shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-sans); font-size: 14px; line-height: 1.6; color: var(--text-primary); background: var(--bg-secondary); }
    .container { max-width: 800px; margin: 0 auto; padding: 24px; }
    .breadcrumb { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-size: 13px; }
    .breadcrumb a { color: var(--color-low); text-decoration: none; }
    .breadcrumb a:hover { text-decoration: underline; }
    .finding-id { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); }
    .title-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow); }
    .title-card h1 { font-size: 22px; font-weight: 600; margin-bottom: 12px; }
    .badges { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; text-transform: uppercase; }
    .badge.critical { background: rgba(220,53,69,0.15); color: var(--color-critical); }
    .badge.high { background: rgba(253,126,20,0.15); color: var(--color-high); }
    .badge.medium { background: rgba(255,193,7,0.15); color: var(--color-medium); }
    .badge.low { background: rgba(13,202,240,0.15); color: var(--color-low); }
    .badge.info { background: rgba(108,117,125,0.15); color: var(--color-info); }
    .category-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; background: var(--bg-secondary); border: 1px solid var(--border); }
    .source-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 10px; background: var(--bg-secondary); border: 1px solid var(--border); color: var(--text-secondary); }
    .location-block { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-family: var(--font-mono); font-size: 12px; }
    .location-block code { color: var(--text-primary); }
    .location-block button { padding: 4px 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-secondary); cursor: pointer; font-size: 11px; }
    .location-block button:hover { background: var(--border); }
    .description { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow); }
    .description p { margin-bottom: 12px; }
    .description p:last-child { margin-bottom: 0; }
    .code-section { margin-bottom: 20px; }
    .code-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-bottom: none; border-radius: var(--radius) var(--radius) 0 0; font-size: 12px; }
    .code-header button { padding: 4px 10px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg-card); cursor: pointer; font-size: 11px; }
    .code-header button:hover { background: var(--bg-secondary); }
    pre { margin: 0; padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border); border-top: none; border-radius: 0 0 var(--radius) var(--radius); overflow-x: auto; }
    code { font-family: var(--font-mono); font-size: 12px; line-height: 1.5; }
    .recommendation { background: rgba(13,202,240,0.05); border: 1px solid rgba(13,202,240,0.2); border-radius: var(--radius); padding: 20px; margin-bottom: 20px; }
    .recommendation h4 { font-size: 12px; text-transform: uppercase; color: var(--color-low); margin-bottom: 8px; }
    .recommendation p { font-size: 14px; }
    .metadata-footer { background: var(--bg-card); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 20px; box-shadow: var(--shadow); }
    .tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 8px; }
    .meta { font-size: 11px; color: var(--text-secondary); }
    .finding-nav { display: flex; justify-content: space-between; padding: 16px 0; }
    .finding-nav a { color: var(--color-low); text-decoration: none; font-size: 13px; }
    .finding-nav a:hover { text-decoration: underline; }
    .theme-toggle { position: fixed; top: 16px; right: 16px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; font-size: 18px; display: flex; align-items: center; justify-content: center; box-shadow: var(--shadow); }
    @media print { .theme-toggle { display: none; } body { background: white; } }
  </style>
</head>
<body>
  <button class="theme-toggle" onclick="toggleTheme()" aria-label="Toggle theme">🌓</button>
  <div class="container">
    <div class="breadcrumb">
      <a href="index.html">← Back to Dashboard</a>
      <span class="finding-id">${finding.id}</span>
    </div>
    <div class="title-card">
      <h1>${finding.title}</h1>
      <div class="badges">
        <span class="badge ${finding.severity}">${finding.severity}</span>
        <span class="category-tag">${finding.category}</span>
        ${finding.source ? `<span class="source-tag">${finding.source}</span>` : ''}
      </div>
    </div>
    ${finding.file ? `<div class="location-block">
      <code>${finding.file}${finding.line ? ':' + finding.line : ''}</code>
      <button onclick="copyToClipboard('${finding.file}${finding.line ? ':' + finding.line : ''}')">Copy</button>
    </div>` : ''}
    <div class="description">
      <p>${finding.description}</p>
    </div>
    ${codeBlock}
    ${recommendation}
    <div class="metadata-footer">
      ${tags}
      <div class="meta">Generated: ${now}${finding.source ? ' · Source: ' + finding.source : ''}</div>
    </div>
    ${nav}
  </div>
  <script>
    function toggleTheme() {
      const html = document.documentElement;
      const current = html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('theme', next);
    }
    const saved = localStorage.getItem('theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const btn = event.target;
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = original, 1500);
      });
    }
    function copyCode() {
      const code = document.querySelector('pre code').textContent;
      copyToClipboard(code);
    }
  </script>
</body>
</html>`;
}

// HTML escape helper
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Generate files
const dashboardHtml = generateDashboard();
writeFileSync(join(outputDir, 'index.html'), dashboardHtml, 'utf-8');

findings.forEach((f, i) => {
  const prevId = i > 0 ? findings[i - 1].id : null;
  const nextId = i < findings.length - 1 ? findings[i + 1].id : null;
  const detailHtml = generateDetailPage(f, prevId, nextId);
  writeFileSync(join(outputDir, `${f.id}.html`), detailHtml, 'utf-8');
});

console.log(`✅ Generated findings report: ${outputDir}`);
console.log(`   Dashboard: index.html`);
console.log(`   Detail pages: ${findings.length} files`);
console.log(`   Total findings: ${findings.length}`);
console.log(`   Critical: ${severityCounts.critical} | High: ${severityCounts.high} | Medium: ${severityCounts.medium} | Low: ${severityCounts.low} | Info: ${severityCounts.info}`);
