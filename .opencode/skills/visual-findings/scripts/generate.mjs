#!/usr/bin/env node
/**
 * Visual Findings Generator
 *
 * Generates self-contained HTML dashboard + detail pages from findings JSON.
 *
 * Usage:
 *   node generate.mjs --findings findings.json --output .tmp/findings/run-id [--title "Report Title"] [--style linear]
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

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
const styleArg = (getArg('--style') || 'default').toLowerCase();

if (!findingsPath || !outputDir) {
  console.error('Usage: node generate.mjs --findings <path.json> --output <dir> [--title "Report"] [--style <name>]');
  process.exit(1);
}

const STYLE_MAP = {
  'v5': './styles/v5-refined-ops.mjs', 'refined-ops': './styles/v5-refined-ops.mjs',
  'v6': './styles/v6-kanban.mjs', 'kanban': './styles/v6-kanban.mjs',
  'v7': './styles/v7-linear.mjs', 'linear': './styles/v7-linear.mjs',
  'v8': './styles/v8-supabase.mjs', 'supabase': './styles/v8-supabase.mjs',
  'v10': './styles/v10-github.mjs', 'github': './styles/v10-github.mjs',
  'v12': './styles/v12-vercel.mjs', 'vercel': './styles/v12-vercel.mjs',
  'v13': './styles/v13-master-detail.mjs', 'master-detail': './styles/v13-master-detail.mjs', 'sentry': './styles/v13-master-detail.mjs',
  'v14': './styles/v14-shadcn.mjs', 'shadcn': './styles/v14-shadcn.mjs'
};

if (styleArg !== 'default' && !STYLE_MAP[styleArg]) {
  console.error(`Unknown style "${styleArg}". Available styles: default, ${Object.keys(STYLE_MAP).join(', ')}`);
  process.exit(1);
}

// Load findings
const findings = JSON.parse(readFileSync(findingsPath, 'utf-8'));
mkdirSync(outputDir, { recursive: true });

const meta = {
  title: reportTitle,
  now: new Date().toISOString().split('T')[0],
  total: findings.length
};

if (styleArg !== 'default') {
  const modPath = join(__dirname, STYLE_MAP[styleArg]);
  const mod = (await import(pathToFileURL(modPath).href)).default;

  // Generate dashboard
  const dashHtml = mod.dashboard(findings, meta);
  writeFileSync(join(outputDir, 'index.html'), dashHtml, 'utf-8');

  // Generate detail pages if style supports them
  if (mod.hasDetailPages && mod.detail) {
    findings.forEach((f, i) => {
      const prev = i > 0 ? i : null;
      const next = i < findings.length - 1 ? i + 2 : null;
      const detailHtml = mod.detail(f, meta, prev, next);
      const filename = `finding-${String(i + 1).padStart(3, '0')}.html`;
      writeFileSync(join(outputDir, filename), detailHtml, 'utf-8');
    });
  }

  console.log(`Generated ${meta.total} findings with style "${mod.name}" in ${outputDir}`);
  process.exit(0);
}

// ----------------------------------------------------------------------
// Legacy Default Builder (with XSS escaping fix applied)
// ----------------------------------------------------------------------
const esc = (s = '') => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
const severityCounts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
findings.forEach(f => { if (severityCounts[f.severity] !== undefined) severityCounts[f.severity]++; });

const categoryCounts = {};
findings.forEach(f => { categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1; });

const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><title>${esc(reportTitle)}</title>
<style>
  body{font-family:system-ui,sans-serif;margin:0;padding:24px;background:#f8f9fa;color:#212529}
  .wrap{max-width:1000px;margin:0 auto}
  h1{margin:0 0 16px}
  .cards{display:flex;gap:12px;margin-bottom:24px}
  .card{flex:1;background:#fff;padding:16px;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden}
  th,td{padding:12px;text-align:left;border-bottom:1px solid #dee2e6}
  th{background:#e9ecef}
  tr:hover{background:#f1f3f5;cursor:pointer}
</style>
</head>
<body>
<div class="wrap">
  <h1>${esc(reportTitle)}</h1>
  <div class="cards">
    <div class="card">Critical: ${severityCounts.critical}</div>
    <div class="card">High: ${severityCounts.high}</div>
    <div class="card">Medium: ${severityCounts.medium}</div>
    <div class="card">Low: ${severityCounts.low}</div>
    <div class="card">Info: ${severityCounts.info}</div>
  </div>
  <table>
    <thead><tr><th>Severity</th><th>Title</th><th>Category</th><th>Location</th></tr></thead>
    <tbody>
      ${findings.map((f, i) => {
        const u = f.url || f.href || f.link || f.sourceUrl;
        return `
        <tr onclick="location.href='finding-${String(i+1).padStart(3,'0')}.html'">
          <td>${esc(f.severity)}</td>
          <td>${esc(f.title)} ${u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" onclick="event.stopPropagation()">[link ↗]</a>` : ''}</td>
          <td>${esc(f.category)}</td>
          <td>${esc(f.file || '—')}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
</div>
</body>
</html>`;

writeFileSync(join(outputDir, 'index.html'), indexHtml, 'utf-8');

findings.forEach((f, i) => {
  const detailHtml = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>${esc(f.title)}</title>
<style>body{font-family:system-ui,sans-serif;padding:30px;max-width:800px;margin:0 auto}</style>
</head>
<body>
  <a href="index.html">← Back</a>
  <h1>${esc(f.title)}</h1>
  <p><b>Severity:</b> ${esc(f.severity)} | <b>Category:</b> ${esc(f.category)}</p>
  <p><b>File:</b> ${esc(f.file || '—')}${f.line ? ':' + f.line : ''}</p>
  <div><h3>Description</h3><p>${esc(f.description)}</p></div>
  ${f.codeSnippet ? `<div><h3>Evidence</h3><pre><code>${esc(f.codeSnippet)}</code></pre></div>` : ''}
  ${f.recommendation ? `<div><h3>Recommendation</h3><p>${esc(f.recommendation)}</p></div>` : ''}
</body>
</html>`;
  writeFileSync(join(outputDir, `finding-${String(i + 1).padStart(3, '0')}.html`), detailHtml, 'utf-8');
});

console.log(`Generated ${findings.length} findings with legacy default style in ${outputDir}`);
