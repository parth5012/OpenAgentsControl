import { esc, prose, sevCounts, catCounts, loc, renderUrlLink, linkUrl, THEME_SCRIPT, COPY_SCRIPT } from './shared.mjs';

export default {
  name: 'v5-refined-ops',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const counts = sevCounts(findings);
    const total = findings.length || 1;
    const cats = Object.keys(catCounts(findings));

    const rowsHtml = findings.map((f, i) => `
      <tr data-sev="${esc(f.severity)}" data-cat="${esc(f.category)}" onclick="location.href='finding-${String(i+1).padStart(3,'0')}.html'">
        <td><span class="badge ${esc(f.severity)}">${esc(f.severity)}</span></td>
        <td class="ftitle">${esc(f.title)} ${renderUrlLink(f, 'url-link')}</td>
        <td class="cat">${esc(f.category)}</td>
        <td class="path">${esc(loc(f))}</td>
      </tr>`).join('');

    const catOpts = cats.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --bg:#f7f8fa; --card:#ffffff; --text:#111827; --dim:#6b7280; --line:#e5e7eb;
    --crit:#b91c1c; --critbg:#fee2e2; --high:#c2410c; --highbg:#ffedd5;
    --med:#854d0e; --medbg:#fef3c7; --low:#0e7490; --lowbg:#cffafe; --info:#475569; --infobg:#e2e8f0;
    --acc:#2563eb; --accsoft:#dbeafe;
    --sans:'Inter',system-ui,-apple-system,'Segoe UI',sans-serif;
    --mono:'Cascadia Code','JetBrains Mono',Consolas,monospace;
  }
  [data-theme="dark"]{
    --bg:#0f1218; --card:#161a22; --text:#e5e7eb; --dim:#9ca3af; --line:#262c38;
    --crit:#f87171; --critbg:rgba(248,113,113,.14); --high:#fb923c; --highbg:rgba(251,146,60,.14);
    --med:#facc15; --medbg:rgba(250,204,21,.13); --low:#22d3ee; --lowbg:rgba(34,211,238,.13); --info:#94a3b8; --infobg:rgba(148,163,184,.14);
    --acc:#60a5fa; --accsoft:rgba(96,165,250,.14);
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.55}
  .wrap{max-width:1100px;margin:0 auto;padding:28px 24px 40px}
  header.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px}
  h1{font-size:21px;font-weight:700;letter-spacing:-.02em;display:flex;align-items:center;gap:10px}
  .dotlive{width:8px;height:8px;border-radius:50%;background:#10b981}
  .sub{color:var(--dim);font-size:12.5px;margin-top:4px}
  .theme{all:unset;cursor:pointer;width:36px;height:36px;border-radius:9px;border:1px solid var(--line);background:var(--card);display:flex;align-items:center;justify-content:center;font-size:16px}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:12px}
  .dist{padding:18px 20px;margin-bottom:14px}
  .heatbar{display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--line);margin-bottom:14px}
  .heatbar span{height:100%}
  .hb-critical{background:var(--crit)} .hb-high{background:var(--high)} .hb-medium{background:var(--med)} .hb-low{background:var(--low)} .hb-info{background:var(--info)}
  .legend{display:flex;flex-wrap:wrap;gap:6px}
  .pill{all:unset;cursor:pointer;font-size:11.5px;font-weight:600;padding:4px 11px;border-radius:99px;border:1px solid transparent;display:inline-flex;align-items:center;gap:7px;transition:opacity .12s}
  .pill i{width:7px;height:7px;border-radius:50%;display:inline-block;font-style:normal}
  .pill.critical{color:var(--crit);background:var(--critbg)} .pill.critical i{background:var(--crit)}
  .pill.high{color:var(--high);background:var(--highbg)} .pill.high i{background:var(--high)}
  .pill.medium{color:var(--med);background:var(--medbg)} .pill.medium i{background:var(--med)}
  .pill.low{color:var(--low);background:var(--lowbg)} .pill.low i{background:var(--low)}
  .pill.info{color:var(--info);background:var(--infobg)} .pill.info i{background:var(--info)}
  .pill.off{opacity:.35}
  .toolbar{position:sticky;top:12px;z-index:5;display:flex;gap:10px;align-items:center;padding:11px 14px;margin-bottom:14px;box-shadow:0 4px 14px rgba(0,0,0,.06)}
  .search{flex:1;min-width:160px;all:unset;font-size:13px;color:var(--text)}
  .search::placeholder{color:var(--dim)}
  .sicon{color:var(--dim)}
  select{all:unset;cursor:pointer;font-size:12.5px;color:var(--text);border-left:1px solid var(--line);padding-left:12px}
  .clearbtn{all:unset;cursor:pointer;font-size:12px;font-weight:600;color:var(--acc);white-space:nowrap}
  .clearbtn[hidden]{display:none}
  table{width:100%;border-collapse:collapse}
  th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.09em;color:var(--dim);padding:12px 16px;border-bottom:1px solid var(--line);font-weight:600}
  td{padding:13px 16px;border-bottom:1px solid var(--line);font-size:13.5px;vertical-align:middle}
  tbody tr{cursor:pointer;transition:background .1s}
  tbody tr:hover{background:var(--accsoft)}
  tbody tr:last-child td{border-bottom:none}
  tr.hidden{display:none}
  .badge{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:3px 9px;border-radius:6px}
  .badge.critical{color:var(--crit);background:var(--critbg)} .badge.high{color:var(--high);background:var(--highbg)}
  .badge.medium{color:var(--med);background:var(--medbg)} .badge.low{color:var(--low);background:var(--lowbg)} .badge.info{color:var(--info);background:var(--infobg)}
  .ftitle{font-weight:550}
  .url-link{font-size:11px;font-weight:600;color:var(--acc);text-decoration:none;padding:1px 6px;border-radius:4px;background:var(--accsoft);margin-left:6px}
  .url-link:hover{text-decoration:underline}
  .cat{color:var(--dim);font-size:12.5px}
  .path{font-family:var(--mono);font-size:11.5px;color:var(--dim)}
  .empty{padding:30px;text-align:center;color:var(--dim);font-size:13px}
  footer{margin-top:18px;text-align:center;color:var(--dim);font-size:11.5px}
  @media print{.toolbar,.theme{display:none}body{background:#fff}}
</style>
${THEME_SCRIPT}
</head>
<body>
<div class="wrap">
  <header class="top">
    <div><h1><span class="dotlive"></span> ${esc(meta.title)}</h1><p class="sub">Generated ${esc(meta.now)} · ${findings.length} findings</p></div>
    <button class="theme" onclick="vfTgl()" aria-label="Toggle theme">◐</button>
  </header>

  <div class="panel dist">
    <div class="heatbar">
      <span class="hb-critical" style="width:${(counts.critical/total)*100}%"></span>
      <span class="hb-high" style="width:${(counts.high/total)*100}%"></span>
      <span class="hb-medium" style="width:${(counts.medium/total)*100}%"></span>
      <span class="hb-low" style="width:${(counts.low/total)*100}%"></span>
      <span class="hb-info" style="width:${(counts.info/total)*100}%"></span>
    </div>
    <div class="legend">
      <button class="pill critical" id="p-critical" onclick="flt('critical')"><i></i> Critical · ${counts.critical}</button>
      <button class="pill high" id="p-high" onclick="flt('high')"><i></i> High · ${counts.high}</button>
      <button class="pill medium" id="p-medium" onclick="flt('medium')"><i></i> Medium · ${counts.medium}</button>
      <button class="pill low" id="p-low" onclick="flt('low')"><i></i> Low · ${counts.low}</button>
      <button class="pill info" id="p-info" onclick="flt('info')"><i></i> Info · ${counts.info}</button>
    </div>
  </div>

  <div class="panel toolbar">
    <span class="sicon">⌕</span><input class="search" id="q" placeholder="Search titles, files, tags…">
    <select onchange="apply()"><option value="">All categories</option>${catOpts}</select>
    <button class="clearbtn" id="clearBtn" hidden onclick="reset()">✕ Reset filters</button>
  </div>

  <div class="panel">
    <table>
      <thead><tr><th style="width:110px">Severity</th><th>Finding</th><th style="width:130px">Category</th><th style="width:290px">Location</th></tr></thead>
      <tbody id="rows">${rowsHtml}</tbody>
    </table>
    <div class="empty" id="empty" hidden>No findings match the current filters.</div>
  </div>
  <footer>Self-contained report · Ctrl+P for PDF · visual-findings</footer>
</div>
<script>
let sev=null; const q=document.getElementById('q'), catSel=document.querySelector('select');
q.addEventListener('input',apply);
function flt(s){
  sev=(sev===s)?null:s;
  ['critical','high','medium','low','info'].forEach(x=>document.getElementById('p-'+x).classList.toggle('off',sev&&sev!==x));
  apply();
}
function reset(){sev=null;q.value='';catSel.value='';['critical','high','medium','low','info'].forEach(x=>document.getElementById('p-'+x).classList.remove('off'));apply()}
function apply(){
  const t=q.value.toLowerCase(), c=catSel.value; let n=0;
  document.querySelectorAll('#rows tr').forEach(r=>{
    const ok=(!sev||r.dataset.sev===sev)&&(!c||r.dataset.cat===c)&&(!t||r.textContent.toLowerCase().includes(t));
    r.classList.toggle('hidden',!ok); if(ok)n++;
  });
  document.getElementById('empty').hidden=n>0;
  document.getElementById('clearBtn').hidden=!sev&&!t&&!c;
}
</script>
</body>
</html>`;
  },

  detail(finding, meta, prev, next) {
    const navHtml = `
      <a href="${prev ? 'finding-' + String(prev).padStart(3,'0') + '.html' : '#'}" style="${prev?'':'opacity:.4;pointer-events:none'}">← Previous finding</a>
      <a href="${next ? 'finding-' + String(next).padStart(3,'0') + '.html' : '#'}" style="${next?'':'opacity:.4;pointer-events:none'}">Next finding →</a>`;

    const tagsHtml = (finding.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('');

    return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(finding.title)}</title>
<style>
  :root{
    --bg:#f7f8fa; --card:#ffffff; --text:#111827; --dim:#6b7280; --line:#e5e7eb;
    --crit:#b91c1c; --critbg:#fee2e2; --high:#c2410c; --highbg:#ffedd5;
    --med:#854d0e; --medbg:#fef3c7; --low:#0e7490; --lowbg:#cffafe; --info:#475569; --infobg:#e2e8f0;
    --acc:#2563eb; --accsoft:#dbeafe; --codebg:#0d1117; --codetext:#dbe4f0;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code','JetBrains Mono',Consolas,monospace;
  }
  [data-theme="dark"]{
    --bg:#0f1218; --card:#161a22; --text:#e5e7eb; --dim:#9ca3af; --line:#262c38;
    --crit:#f87171; --critbg:rgba(248,113,113,.14); --high:#fb923c; --highbg:rgba(251,146,60,.14);
    --med:#facc15; --medbg:rgba(250,204,21,.13); --low:#22d3ee; --lowbg:rgba(34,211,238,.13); --info:#94a3b8; --infobg:rgba(148,163,184,.14);
    --acc:#60a5fa; --accsoft:rgba(96,165,250,.14);
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14.5px;line-height:1.6}
  .wrap{max-width:840px;margin:0 auto;padding:28px 24px 48px}
  a.back{color:var(--dim);text-decoration:none;font-size:13px} a.back:hover{color:var(--text)}
  .hero{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:26px 28px;margin:16px 0 14px}
  .badges{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
  .badge{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;padding:3px 10px;border-radius:6px}
  .badge.critical{color:var(--crit);background:var(--critbg)} .badge.high{color:var(--high);background:var(--highbg)}
  .badge.medium{color:var(--med);background:var(--medbg)} .badge.low{color:var(--low);background:var(--lowbg)} .badge.info{color:var(--info);background:var(--infobg)}
  .badge.soft{color:var(--dim);background:transparent;border:1px solid var(--line)}
  h1{font-size:22px;font-weight:700;letter-spacing:-.02em;line-height:1.3}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}
  .kv{border:1px solid var(--line);border-radius:9px;padding:10px 13px}
  .kv .k{font-size:10px;text-transform:uppercase;letter-spacing:.11em;color:var(--dim);margin-bottom:3px}
  .kv .v{font-family:var(--mono);font-size:12px;color:var(--acc)}
  section.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:22px 26px;margin-bottom:14px}
  .label{font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.13em;color:var(--dim);margin-bottom:10px}
  .codebox{margin-top:14px;border-radius:10px;overflow:hidden;border:1px solid var(--line)}
  .codehead{display:flex;justify-content:space-between;align-items:center;background:#161b22;color:#8b949e;padding:7px 14px;font-family:var(--mono);font-size:11px}
  .codehead button{all:unset;cursor:pointer;color:#58a6ff;font-weight:600}
  pre{background:var(--codebg);color:var(--codetext);padding:15px 17px;overflow-x:auto;font-family:var(--mono);font-size:12.5px;line-height:1.6}
  .rec{border-left:3px solid #10b981;background:rgba(16,185,129,.06);border-radius:0 10px 10px 0;padding:14px 18px}
  .tagsline{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px}
  .tag{font-size:11px;color:var(--dim);border:1px solid var(--line);border-radius:99px;padding:2px 10px}
  .navrow{display:flex;justify-content:space-between;margin-top:20px;font-size:13px}
  .navrow a{color:var(--acc);text-decoration:none;font-weight:600}
</style>
${THEME_SCRIPT}${COPY_SCRIPT}
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← Back to dashboard</a>

  <div class="hero">
    <div class="badges">
      <span class="badge ${esc(finding.severity)}">${esc(finding.severity)}</span>
      <span class="badge soft">${esc(finding.category)}</span>
      <span class="badge soft">${esc(finding.id || 'VF')}</span>
    </div>
    <h1>${esc(finding.title)}</h1>
    <div class="grid">
      <div class="kv"><div class="k">Location</div><div class="v">${esc(loc(finding))}</div></div>
      <div class="kv"><div class="k">Source / Link</div><div class="v">${linkUrl(finding) ? `<a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:var(--acc)">${esc(linkUrl(finding))} ↗</a>` : esc(finding.source || 'agent')}</div></div>
    </div>
  </div>

  <section class="card">
    <div class="label">Description</div>
    <p>${prose(finding.description)}</p>
    ${finding.codeSnippet ? `
    <div class="codebox">
      <div class="codehead"><span>${esc(loc(finding))}</span><button onclick="vfCopy(this, document.querySelector('pre').textContent)">Copy</button></div>
      <pre>${esc(finding.codeSnippet)}</pre>
    </div>` : ''}
  </section>

  ${finding.recommendation ? `
  <section class="card">
    <div class="label" style="color:#059669">Recommended fix</div>
    <p class="rec">${prose(finding.recommendation)}</p>
    <div class="tagsline">${tagsHtml}</div>
  </section>` : ''}

  <div class="navrow">${navHtml}</div>
</div>
</body>
</html>`;
  }
};
