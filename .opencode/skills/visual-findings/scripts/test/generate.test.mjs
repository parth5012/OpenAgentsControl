/**
 * Visual Findings Generator — tests
 * Run: node --test .opencode/skills/visual-findings/scripts/test/generate.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GEN = join(__dirname, '..', 'generate.mjs');
const OUT = join(__dirname, '..', '..', '..', '..', '.tmp', 'vf-test-out');

const SAMPLE = [
  {
    id: 'finding-001', title: 'XSS via unescaped fields', severity: 'critical', category: 'security',
    file: 'src/a.ts', line: 10, description: 'Plain description with <img src=x> raw html.',
    recommendation: 'Escape everything.', codeSnippet: 'const x = `<b>${t}</b>`;', tags: ['xss'], source: 'test'
  },
  { id: 'finding-002', title: 'Empty dir', severity: 'high', category: 'tech-debt', description: 'Missing files.', tags: [], source: 'test' },
  { id: 'finding-003', title: 'Hardcoded style', severity: 'medium', category: 'ux', description: 'One style only.', tags: [], source: 'test' }
];

const MARKERS = {
  'v5': 'heatbar', 'refined-ops': 'heatbar',
  'v6': 'colhead', 'kanban': 'colhead',
  'v7': 'viewtabs', 'linear': 'viewtabs',
  'v8': 'kpis', 'supabase': 'kpis',
  'v10': 'repohdr', 'github': 'repohdr',
  'v12': 'vf-summary', 'vercel': 'vf-summary',
  'v13': 'vf-listpane', 'master-detail': 'vf-listpane', 'sentry': 'vf-listpane',
  'v14': 'vf-cardhead', 'shadcn': 'vf-cardhead'
};

function run(args) {
  return execFileSync('node', [GEN, ...args], { encoding: 'utf-8' });
}

test('default style still works (backward compat)', () => {
  const out = join(OUT, 'default');
  rmSync(out, { recursive: true, force: true });
  const f = join(out, 'findings.json');
  mkdirSync(out, { recursive: true }); writeFileSync(f, JSON.stringify(SAMPLE));
  run(['--findings', f, '--output', out, '--title', 'T']);
  assert.ok(existsSync(join(out, 'index.html')));
  assert.ok(existsSync(join(out, 'finding-001.html')));
});

for (const [style, marker] of Object.entries(MARKERS)) {
  test(`style ${style}: dashboard + detail pages render with marker`, () => {
    const out = join(OUT, style.replace(/[^a-z0-9-]/gi, '_'));
    rmSync(out, { recursive: true, force: true });
    const f = join(out, 'findings.json');
    mkdirSync(out, { recursive: true }); writeFileSync(f, JSON.stringify(SAMPLE));
    run(['--findings', f, '--output', out, '--title', 'T', '--style', style]);
    const idx = readFileSync(join(out, 'index.html'), 'utf-8');
    assert.ok(idx.includes(marker), `marker "${marker}" missing in ${style} index.html`);
    const hasDetail = !['v13', 'master-detail', 'sentry'].includes(style);
    if (hasDetail) {
      const d = readFileSync(join(out, 'finding-001.html'), 'utf-8');
      assert.ok(d.includes('XSS via unescaped fields'));
    } else {
      assert.ok(!existsSync(join(out, 'finding-001.html')), 'v13 must not emit detail pages');
    }
  });
}

test('XSS: malicious fields are escaped in every style', () => {
  const evil = [{ ...SAMPLE[0], title: '<img src=x onerror=alert(1)>', description: '<script>alert(2)</script>' }];
  for (const style of ['v5', 'v6', 'v7', 'v8', 'v10', 'v12', 'v13', 'v14']) {
    const out = join(OUT, `xss-${style}`);
    rmSync(out, { recursive: true, force: true });
    const f = join(out, 'findings.json');
    mkdirSync(out, { recursive: true }); writeFileSync(f, JSON.stringify(evil));
    run(['--findings', f, '--output', out, '--style', style]);
    const idx = readFileSync(join(out, 'index.html'), 'utf-8');
    assert.ok(!idx.includes('<img src=x'), `${style}: raw img tag leaked`);
    assert.ok(!idx.includes('<script>alert(2)'), `${style}: raw script leaked`);
    if (['v13', 'master-detail', 'sentry'].includes(style)) {
      assert.ok(idx.includes('\\u003cimg'), `${style}: JSON unicode escape missing`);
    } else {
      assert.ok(idx.includes('&lt;img src=x'), `${style}: escaped title missing`);
    }
  }
});

test('URL href support: findings with url property render clickable target=_blank links', () => {
  const sampleWithUrl = [{
    ...SAMPLE[0],
    url: 'https://github.com/example/repo/blob/main/src/auth.ts#L42'
  }];
  for (const style of ['v5', 'v6', 'v7', 'v8', 'v10', 'v12', 'v13', 'v14']) {
    const out = join(OUT, `url-${style}`);
    rmSync(out, { recursive: true, force: true });
    const f = join(out, 'findings.json');
    mkdirSync(out, { recursive: true }); writeFileSync(f, JSON.stringify(sampleWithUrl));
    run(['--findings', f, '--output', out, '--style', style]);
    const idx = readFileSync(join(out, 'index.html'), 'utf-8');
    assert.ok(idx.includes('https://github.com/example/repo/blob/main/src/auth.ts#L42'), `${style}: URL missing in dashboard`);
    assert.ok(idx.includes('target="_blank"') || idx.includes('target=\\"_blank\\"'), `${style}: target=_blank missing in dashboard`);
  }
});

test('unknown style fails with style list', () => {
  const out = join(OUT, 'bad');
  const f = join(out, 'findings.json');
  mkdirSync(out, { recursive: true }); writeFileSync(f, JSON.stringify(SAMPLE));
  assert.throws(
    () => run(['--findings', f, '--output', out, '--style', 'nope']),
    /available styles/i
  );
});
