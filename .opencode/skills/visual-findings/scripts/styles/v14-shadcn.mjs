import { esc, prose, loc, renderUrlLink, linkUrl } from './shared.mjs';

export default {
  name: 'v14-shadcn',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const rowsHtml = findings.map((f, i) => `
      <tr data-sev="${esc(f.severity)}" data-text="${esc(f.title + ' ' + f.category)}" onclick="location.href='finding-${String(i+1).padStart(3,'0')}.html'">
        <td><span class="badge b-${esc(f.severity)}">${esc(f.severity)}</span></td>
        <td class="title">${esc(f.title)} ${renderUrlLink(f, 'url-link')}</td>
        <td class="cat">${esc(f.category)}</td>
        <td class="path">${esc(loc(f))}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --bg:#09090b; --card:#0f0f12; --card2:#18181b; --line:#27272a;
    --fg:#fafafa; --dim:#a1a1aa; --dim2:#71717a;
    --crit:#f87171; --high:#fb923c; --med:#facc15; --low:#38bdf8; --info:#a1a1aa; --ring:#6366f1;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:14px;line-height:1.5;min-height:100vh;padding:36px 24px}
  .wrap{max-width:960px;margin:0 auto}
  .head{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px}
  h1{font-size:22px;font-weight:700;letter-spacing:-.02em}
  .sub{color:var(--dim);font-size:13px;margin-top:5px}
  .tabs{display:inline-flex;background:var(--card2);border:1px solid var(--line);border-radius:9px;padding:3px;margin-bottom:16px}
  .tab{font-size:12.5px;font-weight:500;padding:5px 14px;border-radius:6px;color:var(--dim);cursor:pointer}
  .tab.on{background:#2e2e33;color:var(--fg)}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;overflow:hidden}
  .cardhead{padding:14px 18px;border-bottom:1px solid var(--line);font-size:13.5px;font-weight:600;display:flex;align-items:center}
  .cardhead .n{font-size:11px;color:var(--dim2);background:var(--card2);border:1px solid var(--line);border-radius:99px;padding:1px 9px;margin-left:9px}
  input.q{all:unset;margin-left:auto;border:1px solid var(--line);border-radius:8px;padding:5px 12px;font-size:12.5px;width:200px;color:var(--fg)}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:12px;color:var(--dim2);font-weight:500;padding:10px 18px;border-bottom:1px solid var(--line)}
  td{padding:12px 18px;font-size:13.5px;border-bottom:1px solid var(--line);vertical-align:middle}
  tbody tr{cursor:pointer} tbody tr:last-child td{border-bottom:none}
  tbody tr:hover{background:var(--card2)}
  tr.hidden{display:none}
  .badge{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;padding:2px 10px;border-radius:999px;border:1px solid}
  .b-critical{color:var(--crit);border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08)}
  .b-high{color:var(--high);border-color:rgba(251,146,60,.35);background:rgba(251,146,60,.08)}
  .b-medium{color:var(--med);border-color:rgba(250,204,21,.32);background:rgba(250,204,21,.07)}
  .b-low{color:var(--low);border-color:rgba(56,189,248,.32);background:rgba(56,189,248,.07)}
  .b-info{color:var(--info);border-color:var(--line);background:var(--card2)}
  .title{font-weight:500}
  .url-link{font-size:11px;font-weight:500;color:var(--ring);text-decoration:none;padding:1px 6px;border-radius:4px;background:var(--card2);border:1px solid var(--line);margin-left:6px}
  .cat{color:var(--dim);font-size:12.5px}
  .path{font-family:var(--mono);font-size:11px;color:var(--dim2)}
</style>
</head>
<body>
<div class="wrap">
  <div class="head">
    <div><h1>${esc(meta.title)}</h1><p class="sub">${findings.length} findings · generated ${esc(meta.now)}</p></div>
  </div>

  <div class="tabs" id="tabs">
    <span class="tab on" data-sev="" onclick="flt('',this)">All</span>
    <span class="tab" data-sev="critical" onclick="flt('critical',this)">Critical</span>
    <span class="tab" data-sev="high" onclick="flt('high',this)">High</span>
    <span class="tab" data-sev="medium" onclick="flt('medium',this)">Medium</span>
    <span class="tab" data-sev="low" onclick="flt('low',this)">Low</span>
    <span class="tab" data-sev="info" onclick="flt('info',this)">Info</span>
  </div>

  <div class="card">
    <div class="cardhead vf-cardhead">Results<span class="n">${findings.length}</span><input class="q" id="q" placeholder="Filter…" oninput="apply()"></div>
    <table>
      <thead><tr><th style="width:110px">Severity</th><th>Title</th><th style="width:110px">Category</th><th style="width:220px">Location</th></tr></thead>
      <tbody id="rows">${rowsHtml}</tbody>
    </table>
  </div>
</div>
<script>
let sev='';
function flt(s,el){sev=s;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t===el));apply()}
function apply(){
  const q=document.getElementById('q').value.toLowerCase();
  document.querySelectorAll('#rows tr').forEach(r=>{
    r.classList.toggle('hidden',!( (!sev||r.dataset.sev===sev) && r.dataset.text.includes(q) ));
  });
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
    --bg:#09090b; --card:#0f0f12; --card2:#18181b; --line:#27272a;
    --fg:#fafafa; --dim:#a1a1aa; --dim2:#71717a; --crit:#f87171; --ring:#6366f1;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:14px;line-height:1.6;min-height:100vh;padding:36px 24px}
  .wrap{max-width:800px;margin:0 auto}
  a.back{display:inline-flex;align-items:center;gap:6px;color:var(--dim);text-decoration:none;font-size:13px}
  .card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px 26px;margin-top:16px}
  .badges{display:flex;gap:7px;margin-bottom:13px}
  .badge{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;padding:2px 11px;border-radius:999px;border:1px solid}
  .b-critical{color:var(--crit);border-color:rgba(248,113,113,.35);background:rgba(248,113,113,.08)}
  .b-soft{color:var(--dim);border-color:var(--line);background:var(--card2)}
  h1{font-size:20px;font-weight:700;line-height:1.35}
  .label{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--dim2);margin-bottom:9px}
  p{color:#d4d4d8}
  pre{padding:16px 18px;font-family:var(--mono);font-size:12px;line-height:1.65;color:#d4d4d8;overflow-x:auto}
  .fix{border:1px solid rgba(52,211,153,.3);background:rgba(52,211,153,.06);border-radius:12px;padding:17px 20px;margin-top:16px}
  .fix .label{color:#34d399}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← Back to findings</a>
  <div class="card">
    <div class="badges"><span class="badge b-critical">${esc(finding.severity)}</span><span class="badge b-soft">${esc(finding.category)}</span></div>
    <h1>${esc(finding.title)}</h1>
    <div style="font-family:var(--mono);font-size:11.5px;color:var(--dim);margin-top:10px">${esc(loc(finding))} ${linkUrl(finding) ? `· <a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:var(--ring)">${esc(linkUrl(finding))} ↗</a>` : ''}</div>
  </div>
  <div class="card"><div class="label">Description</div><p>${prose(finding.description)}</p></div>
  ${finding.codeSnippet ? `<div class="card"><div class="label">Evidence</div><pre>${esc(finding.codeSnippet)}</pre></div>` : ''}
  ${finding.recommendation ? `<div class="fix"><div class="label">Recommended fix</div><p>${prose(finding.recommendation)}</p></div>` : ''}
</div>
</body>
</html>`;
  }
};
