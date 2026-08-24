import { esc, prose, sevCounts, loc, renderUrlLink, linkUrl } from './shared.mjs';

export default {
  name: 'v12-vercel',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const counts = sevCounts(findings);
    const rowsHtml = findings.map((f, i) => `
      <a class="frow" data-text="${esc(f.title + ' ' + f.category)}" href="finding-${String(i+1).padStart(3,'0')}.html">
        <span class="sdot d-${esc(f.severity)}"></span>
        <div><div class="ftitle">${esc(f.title)} ${renderUrlLink(f, 'url-link')}</div><div class="fmeta">${esc(f.category)} · ${esc(loc(f))}</div></div>
        <span class="fsev">${esc(f.severity)}</span>
      </a>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --bg:#0a0a0a; --surf:#141414; --line:#262626; --line2:#333;
    --fg:#ededed; --dim:#a1a1a1; --dim2:#707070;
    --sans:'Inter',system-ui,sans-serif; --mono:'Geist Mono',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:13.5px;line-height:1.5;min-height:100vh}
  header.top{border-bottom:1px solid var(--line);padding:14px 28px;display:flex;align-items:center;gap:14px}
  .logo{display:flex;align-items:center;gap:9px;font-weight:600;font-size:13.5px}
  .logo .tri{width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-bottom:12px solid #fff}
  .wrap{max-width:980px;margin:0 auto;padding:30px 28px}
  h1{font-size:19px;font-weight:600;letter-spacing:-.01em}
  .sub{color:var(--dim);font-size:12.5px;margin-top:4px}
  .summary{display:flex;gap:26px;margin:20px 0 26px;padding:15px 18px;background:var(--surf);border:1px solid var(--line);border-radius:10px}
  .sum .n{font-family:var(--mono);font-size:19px;font-weight:600;line-height:1}
  .sum .l{font-size:11px;color:var(--dim2);margin-top:5px;display:flex;align-items:center;gap:6px}
  .sum .l i{width:6px;height:6px;border-radius:50%;font-style:normal}
  .s-critical i{background:#ff4d4d} .s-critical .n{color:#ff4d4d}
  .s-high i{background:#ff8a3d} .s-high .n{color:#ff8a3d}
  .s-medium i{background:#f5c518} .s-medium .n{color:#f5c518}
  .s-low i{background:#3fb6ff} .s-low .n{color:#3fb6ff}
  .listhead{display:flex;align-items:center;padding-bottom:9px;border-bottom:1px solid var(--line);color:var(--dim2);font-size:11px;text-transform:uppercase;letter-spacing:.07em}
  .frow{display:flex;align-items:center;gap:14px;padding:13px 4px;border-bottom:1px solid var(--line);text-decoration:none;color:inherit;transition:background .1s}
  .frow:hover{background:var(--surf)}
  .frow.hidden{display:none}
  .sdot{width:7px;height:7px;border-radius:50%;flex-shrink:0}
  .d-critical{background:#ff4d4d} .d-high{background:#ff8a3d} .d-medium{background:#f5c518} .d-low{background:#3fb6ff} .d-info{background:#8f8f8f}
  .ftitle{font-size:13.5px;font-weight:500}
  .url-link{font-size:10.5px;color:var(--dim);border:1px solid var(--line2);padding:1px 6px;border-radius:4px;text-decoration:none;margin-left:6px}
  .fmeta{font-family:var(--mono);font-size:11px;color:var(--dim2);margin-top:3px}
  .fsev{margin-left:auto;font-family:var(--mono);font-size:11px;color:var(--dim)}
  input.q{all:unset;margin-left:auto;border:1px solid var(--line2);border-radius:7px;padding:5px 11px;font-size:12.5px;width:210px;color:var(--fg)}
</style>
</head>
<body>
<header class="top"><span class="logo"><span class="tri"></span> findings</span></header>

<div class="wrap">
  <h1>${esc(meta.title)}</h1>
  <p class="sub">${findings.length} findings · generated ${esc(meta.now)}</p>

  <div class="summary vf-summary">
    <div class="sum s-critical"><div class="n">${counts.critical}</div><div class="l"><i></i>Critical</div></div>
    <div class="sum s-high"><div class="n">${counts.high}</div><div class="l"><i></i>High</div></div>
    <div class="sum s-medium"><div class="n">${counts.medium}</div><div class="l"><i></i>Medium</div></div>
    <div class="sum s-low"><div class="n">${counts.low}</div><div class="l"><i></i>Low</div></div>
    <div class="sum s-info"><div class="n">${counts.info}</div><div class="l"><i></i>Info</div></div>
  </div>

  <div class="listhead"><span>All findings</span><input class="q" id="q" placeholder="Filter…" oninput="apply()"></div>
  ${rowsHtml}
</div>
<script>
function apply(){
  const q=document.getElementById('q').value.toLowerCase();
  document.querySelectorAll('.frow').forEach(r=>r.classList.toggle('hidden',!r.dataset.text.includes(q)));
}
</script>
</body>
</html>`;
  },

  detail(finding, meta, prev, next) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(finding.title)}</title>
<style>
  :root{
    --bg:#0a0a0a; --surf:#141414; --line:#262626; --fg:#ededed; --dim:#a1a1a1; --dim2:#707070; --crit:#ff4d4d;
    --sans:'Inter',system-ui,sans-serif; --mono:'Geist Mono',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:13.5px;line-height:1.6}
  .wrap{max-width:760px;margin:0 auto;padding:34px 28px 50px}
  a.back{color:var(--dim);font-size:12.5px;text-decoration:none}
  h1{font-size:20px;font-weight:600;margin-top:10px}
  section{border-top:1px solid var(--line);padding:18px 0;margin-top:14px}
  .label{font-size:10.5px;font-weight:600;color:var(--dim2);text-transform:uppercase;letter-spacing:.09em;margin-bottom:8px}
  p code{font-family:var(--mono);font-size:11.5px;background:var(--surf);border:1px solid var(--line);padding:1px 6px;border-radius:5px}
  pre{background:var(--surf);border:1px solid var(--line);border-radius:10px;padding:16px;font-family:var(--mono);font-size:12px;line-height:1.65;overflow-x:auto}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← All findings</a>
  <h1>${esc(finding.title)}</h1>
  <div style="color:var(--dim2);font-family:var(--mono);font-size:11.5px;margin-top:6px">${esc(loc(finding))} · ${esc(finding.category)} ${linkUrl(finding) ? `· <a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:#3fb6ff">${esc(linkUrl(finding))} ↗</a>` : ''}</div>
  <section><div class="label">Description</div><p>${prose(finding.description)}</p></section>
  ${finding.codeSnippet ? `<section><div class="label">Evidence</div><pre>${esc(finding.codeSnippet)}</pre></section>` : ''}
  ${finding.recommendation ? `<section><div class="label" style="color:#4ade80">Recommended fix</div><p>${prose(finding.recommendation)}</p></section>` : ''}
</div>
</body>
</html>`;
  }
};
