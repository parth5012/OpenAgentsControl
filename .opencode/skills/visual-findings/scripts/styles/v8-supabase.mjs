import { esc, prose, sevCounts, loc, renderUrlLink, linkUrl } from './shared.mjs';

export default {
  name: 'v8-supabase',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const counts = sevCounts(findings);
    const rowsHtml = findings.map((f, i) => `
      <tr data-sev="${esc(f.severity)}" data-text="${esc(f.title + ' ' + f.category)}" onclick="location.href='finding-${String(i+1).padStart(3,'0')}.html'">
        <td><span class="sevchip s-${esc(f.severity)}">${esc(f.severity)}</span></td>
        <td>${esc(f.title)} ${renderUrlLink(f, 'url-link')}</td>
        <td style="color:var(--dim)">${esc(f.category)}</td>
        <td class="path">${esc(loc(f))}</td>
      </tr>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --bg:#121212; --side:#171717; --card:#1c1c1c; --elev:#242424;
    --line:#2e2e2e; --fg:#ededed; --dim:#a3a3a3; --dim2:#707070;
    --green:#3ecf8e; --greensoft:rgba(62,207,142,.12);
    --crit:#f87171; --high:#fb923c; --med:#facc15; --low:#22d3ee;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:13px;line-height:1.5;display:flex;min-height:100vh}
  aside{width:230px;flex-shrink:0;background:var(--side);border-right:1px solid var(--line);display:flex;flex-direction:column}
  .brand{padding:16px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:10px;font-weight:600;font-size:13.5px}
  .brand .b{width:26px;height:26px;border-radius:6px;background:#3ecf8e;display:inline-flex;align-items:center;justify-content:center;color:#0c2818;font-weight:900}
  nav{padding:4px 12px;flex:1}
  .nitem{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:5px;color:var(--dim);text-decoration:none;margin-bottom:2px}
  .nitem.on{background:var(--greensoft);color:var(--green);font-weight:500}
  main{flex:1;min-width:0;padding:0 26px 30px}
  header.top{display:flex;align-items:center;gap:14px;padding:15px 0;border-bottom:1px solid var(--line);margin-bottom:20px}
  h1{font-size:16px;font-weight:600}
  input.q{all:unset;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:7px 12px;width:250px;font-size:12.5px;color:var(--fg);margin-left:auto}
  .kpis{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:18px}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:9px;padding:13px 15px}
  .kpi .v{font-family:var(--mono);font-size:23px;font-weight:700;line-height:1}
  .kpi .l{font-size:11px;color:var(--dim);text-transform:uppercase;letter-spacing:.07em;margin-top:6px}
  .k-critical .v{color:var(--crit)} .k-high .v{color:var(--high)} .k-medium .v{color:var(--med)} .k-low .v{color:var(--low)}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:9px;overflow:hidden}
  .phead{display:flex;align-items:center;gap:10px;padding:11px 15px;border-bottom:1px solid var(--line);font-size:12.5px;color:var(--dim)}
  table{width:100%;border-collapse:collapse}
  th{font-size:10.5px;text-transform:uppercase;letter-spacing:.08em;color:var(--dim2);text-align:left;font-weight:600;padding:9px 15px;border-bottom:1px solid var(--line)}
  td{padding:10px 15px;border-bottom:1px solid var(--line);font-size:13px;vertical-align:middle}
  tbody tr{cursor:pointer} tbody tr:hover{background:var(--elev)}
  tbody tr:last-child td{border-bottom:none}
  tr.hidden{display:none}
  .sevchip{font-size:11px;font-weight:600;padding:2px 9px;border-radius:99px}
  .url-link{font-size:11px;font-weight:600;color:var(--green);text-decoration:none;padding:1px 6px;border-radius:4px;background:var(--greensoft);margin-left:6px}
  .s-critical{background:rgba(248,113,113,.13);color:var(--crit)}
  .s-high{background:rgba(251,146,60,.12);color:var(--high)}
  .s-medium{background:rgba(250,204,21,.11);color:var(--med)}
  .s-low{background:rgba(34,211,238,.11);color:var(--low)}
  .s-info{background:var(--elev);color:var(--dim)}
  .path{font-family:var(--mono);font-size:11px;color:var(--dim)}
</style>
</head>
<body>
<aside>
  <div class="brand"><span class="b">◢</span> findings-console</div>
  <nav><a class="nitem on">▤ Findings</a></nav>
</aside>
<main>
  <header class="top">
    <div><h1>${esc(meta.title)}</h1></div>
    <input class="q" id="q" placeholder="Filter findings…" oninput="apply()">
  </header>

  <div class="kpis">
    <div class="kpi k-critical"><div class="v">${counts.critical}</div><div class="l">Critical</div></div>
    <div class="kpi k-high"><div class="v">${counts.high}</div><div class="l">High</div></div>
    <div class="kpi k-medium"><div class="v">${counts.medium}</div><div class="l">Medium</div></div>
    <div class="kpi k-low"><div class="v">${counts.low}</div><div class="l">Low</div></div>
    <div class="kpi"><div class="v" style="color:var(--dim)">${counts.info}</div><div class="l" style="color:var(--dim)">Info</div></div>
  </div>

  <div class="panel">
    <div class="phead">${findings.length} findings · click row for detail</div>
    <table>
      <thead><tr><th style="width:100px">Severity</th><th>Finding</th><th style="width:110px">Category</th><th style="width:240px">Location</th></tr></thead>
      <tbody id="rows">${rowsHtml}</tbody>
    </table>
  </div>
</main>
<script>
function apply(){
  const q=document.getElementById('q').value.toLowerCase();
  document.querySelectorAll('#rows tr').forEach(r=>r.classList.toggle('hidden',!r.dataset.text.includes(q)));
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
    --bg:#121212; --side:#171717; --card:#1c1c1c; --line:#2e2e2e;
    --fg:#ededed; --dim:#a3a3a3; --green:#3ecf8e; --crit:#f87171;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:13px;line-height:1.55;display:flex;min-height:100vh}
  aside{width:230px;flex-shrink:0;background:var(--side);border-right:1px solid var(--line)}
  main{flex:1;min-width:0;padding:0 30px 40px}
  a.back{display:inline-flex;align-items:center;gap:6px;color:var(--dim);text-decoration:none;font-size:12.5px;margin:16px 0}
  h1{font-size:19px;font-weight:600;margin-bottom:10px}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:9px;padding:17px 19px;margin-bottom:14px}
  .panel h2{font-size:11px;text-transform:uppercase;letter-spacing:.09em;color:var(--dim);margin-bottom:9px}
  p code{font-family:var(--mono);font-size:11.5px;background:rgba(62,207,142,.1);color:var(--green);padding:1px 5px;border-radius:4px}
  pre{margin-top:10px;background:#101010;border:1px solid var(--line);border-radius:7px;padding:14px;font-family:var(--mono);font-size:11.5px;line-height:1.6;color:#c8ccd4;overflow-x:auto}
  .fix{border-left:3px solid var(--green)} .fix h2{color:var(--green)}
</style>
</head>
<body>
<aside></aside>
<main>
  <a class="back" href="index.html">← Back to findings</a>
  <h1>${esc(finding.title)}</h1>
  ${linkUrl(finding) ? `<div style="margin-bottom:12px"><a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:var(--green);font-size:12.5px">🔗 ${esc(linkUrl(finding))} ↗</a></div>` : ''}

  <div class="panel"><h2>Description</h2><p>${prose(finding.description)}</p></div>
  ${finding.codeSnippet ? `<div class="panel"><h2>Evidence</h2><pre>${esc(finding.codeSnippet)}</pre></div>` : ''}
  ${finding.recommendation ? `<div class="panel fix"><h2>Recommended fix</h2><p>${prose(finding.recommendation)}</p></div>` : ''}
</main>
</body>
</html>`;
  }
};
