import { esc, prose, loc, renderUrlLink, linkUrl } from './shared.mjs';

export default {
  name: 'v7-linear',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const rowsHtml = findings.map((f, i) => `
      <a class="row pr-${esc(f.severity)}" data-sev="${esc(f.severity)}" data-text="${esc(f.title + ' ' + f.category + ' ' + (f.file||''))}" href="finding-${String(i+1).padStart(3,'0')}.html">
        <span class="pri"><i></i><i></i><i></i></span>
        <span class="id">${esc(f.id || 'VF-'+(i+1))}</span>
        <span class="rtitle">${esc(f.title)} ${renderUrlLink(f, 'url-link')}</span>
        <span class="labels"><span class="lab ${esc(f.severity)}">${esc(f.severity)}</span><span class="lab cat">${esc(f.category)}</span></span>
        <span class="path">${esc(loc(f))}</span>
      </a>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --bg:#0f1011; --side:#131316; --surf:#17181b; --elev:#1d1e22;
    --line:rgba(255,255,255,.06); --line2:rgba(255,255,255,.10);
    --fg:#f7f8f8; --dim:#8a8f98; --dim2:#62666d;
    --acc:#5e6ad2; --accsoft:rgba(94,106,210,.16);
    --p0:#ff5e5e; --p1:#ff9540; --p2:#f2c94c; --p3:#4cb782; --p4:#8a8f98;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:13px;line-height:1.45;display:flex;min-height:100vh}
  aside{width:216px;flex-shrink:0;background:var(--side);border-right:1px solid var(--line);padding:14px 10px;display:flex;flex-direction:column;gap:2px}
  .ws{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:6px;font-weight:600;font-size:13px;margin-bottom:12px}
  .ws .logo{width:20px;height:20px;border-radius:5px;background:linear-gradient(135deg,#5e6ad2,#8a7ff0);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
  .navlabel{font-size:11px;font-weight:600;color:var(--dim2);padding:10px 10px 6px;text-transform:none}
  .nav{display:flex;align-items:center;gap:9px;padding:6px 10px;border-radius:6px;color:var(--dim);cursor:pointer;text-decoration:none}
  .nav:hover{background:var(--surf);color:var(--fg)}
  .nav.on{background:var(--accsoft);color:#c3c8f4;font-weight:500}
  kbd{font-family:var(--mono);font-size:10px;background:var(--elev);border:1px solid var(--line2);border-radius:4px;padding:1px 5px;color:var(--dim)}
  main{flex:1;min-width:0;display:flex;flex-direction:column}
  header.top{display:flex;align-items:center;gap:14px;padding:12px 24px;border-bottom:1px solid var(--line)}
  .crumb{color:var(--dim)} .crumb b{color:var(--fg);font-weight:600}
  .searchbox{margin-left:auto;display:flex;align-items:center;gap:8px;background:var(--surf);border:1px solid var(--line);border-radius:7px;padding:5px 10px;width:260px;color:var(--dim2)}
  .searchbox input{all:unset;flex:1;font-size:12.5px;color:var(--fg)}
  .pagehead{padding:22px 24px 14px;display:flex;justify-content:space-between;align-items:flex-end}
  h1{font-size:17px;font-weight:600;letter-spacing:-.01em}
  .meta{color:var(--dim);font-size:12px;margin-top:3px}
  .viewtabs{display:flex;gap:2px;padding:0 24px;border-bottom:1px solid var(--line)}
  .vt{padding:8px 12px;font-size:12.5px;color:var(--dim);border-bottom:2px solid transparent;cursor:pointer}
  .vt:hover{color:var(--fg)}
  .vt.on{color:var(--fg);border-bottom-color:var(--acc);font-weight:500}
  .list{flex:1}
  .row{display:flex;align-items:center;gap:12px;padding:9px 24px;border-bottom:1px solid var(--line);cursor:pointer;text-decoration:none;color:inherit;transition:background .08s}
  .row:hover{background:var(--surf)}
  .pri{width:14px;height:10px;position:relative;flex-shrink:0}
  .pri i{position:absolute;bottom:0;width:3px;border-radius:1px;background:currentColor;display:block}
  .pri i:nth-child(1){left:0;height:4px}.pri i:nth-child(2){left:5px;height:7px}.pri i:nth-child(3){left:10px;height:10px}
  .pr-critical{color:var(--p0)}.pr-high{color:var(--p1)}.pr-medium{color:var(--p2)}.pr-low{color:var(--p3)}.pr-info{color:var(--p4)}
  .id{font-family:var(--mono);font-size:11px;color:var(--dim2);width:82px;flex-shrink:0}
  .rtitle{font-size:13px;font-weight:450;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .url-link{font-size:10.5px;font-weight:500;color:#8a7ff0;background:var(--accsoft);padding:1px 6px;border-radius:4px;text-decoration:none;margin-left:6px}
  .labels{display:flex;gap:6px;margin-left:auto;flex-shrink:0}
  .lab{font-size:10.5px;padding:1px 8px;border-radius:99px;font-weight:500}
  .lab.cat{background:var(--elev);color:var(--dim)}
  .lab.critical{background:rgba(255,94,94,.14);color:#ff8a8a}
  .lab.high{background:rgba(255,149,64,.13);color:#ffb37a}
  .lab.medium{background:rgba(242,201,76,.12);color:#efd97e}
  .lab.low{background:rgba(76,183,130,.13);color:#7dd0a5}
  .lab.info{background:var(--elev);color:var(--dim)}
  .path{font-family:var(--mono);font-size:11px;color:var(--dim2);width:230px;flex-shrink:0;text-align:right;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  footer.statusbar{display:flex;gap:18px;padding:9px 24px;border-top:1px solid var(--line);color:var(--dim2);font-size:11.5px}
</style>
</head>
<body>
<aside>
  <div class="ws"><span class="logo">VF</span> visual-findings <kbd style="margin-left:auto">⌘K</kbd></div>
  <div class="navlabel">Workspace</div>
  <a class="nav on">Audit · ${esc(meta.title)}</a>
</aside>

<main>
  <header class="top">
    <span class="crumb">Audit / <b>${esc(meta.title)}</b></span>
    <div class="searchbox"><input id="q" placeholder="Filter findings…" oninput="apply()"><kbd>/</kbd></div>
  </header>

  <div class="pagehead">
    <div><h1>${esc(meta.title)} — ${findings.length} findings</h1><div class="meta">Generated ${esc(meta.now)}</div></div>
    <kbd>esc to clear</kbd>
  </div>

  <div class="viewtabs" id="tabs">
    <span class="vt on" data-sev="" onclick="flt('',this)">All</span>
    <span class="vt" data-sev="critical" onclick="flt('critical',this)">Critical</span>
    <span class="vt" data-sev="high" onclick="flt('high',this)">High</span>
    <span class="vt" data-sev="medium" onclick="flt('medium',this)">Medium</span>
    <span class="vt" data-sev="low" onclick="flt('low',this)">Low</span>
    <span class="vt" data-sev="info" onclick="flt('info',this)">Info</span>
  </div>

  <div class="list" id="list">${rowsHtml}</div>
  <footer class="statusbar"><span>${findings.length} findings</span><span id="shown">${findings.length} shown</span></footer>
</main>
<script>
let sev='';
function flt(s,el){sev=s;document.querySelectorAll('.vt').forEach(t=>t.classList.toggle('on',t===el));apply()}
function apply(){
  const q=document.getElementById('q').value.toLowerCase();let n=0;
  document.querySelectorAll('.row').forEach(r=>{
    const ok=(!sev||r.dataset.sev===sev)&&(!q||r.dataset.text.includes(q));
    r.style.display=ok?'':'none'; if(ok)n++;
  });
  document.getElementById('shown').textContent=n+' shown';
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){sev='';document.querySelectorAll('.vt').forEach((t,i)=>t.classList.toggle('on',i===0));document.getElementById('q').value='';apply()}});
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
    --bg:#0f1011; --side:#131316; --surf:#17181b; --elev:#1d1e22;
    --line:rgba(255,255,255,.06); --line2:rgba(255,255,255,.10);
    --fg:#f7f8f8; --dim:#8a8f98; --dim2:#62666d;
    --acc:#5e6ad2; --accsoft:rgba(94,106,210,.16); --p0:#ff5e5e;
    --sans:'Inter',system-ui,sans-serif; --mono:'Cascadia Code',ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--fg);font-family:var(--sans);font-size:13px;line-height:1.55;display:flex;min-height:100vh}
  aside{width:216px;flex-shrink:0;background:var(--side);border-right:1px solid var(--line);padding:14px 10px}
  .ws{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:6px;font-weight:600}
  .ws .logo{width:20px;height:20px;border-radius:5px;background:linear-gradient(135deg,#5e6ad2,#8a7ff0);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#fff}
  .nav{display:block;padding:6px 10px;border-radius:6px;color:var(--dim);text-decoration:none;margin-top:10px}
  main{flex:1;min-width:0}
  header.top{display:flex;align-items:center;gap:14px;padding:12px 24px;border-bottom:1px solid var(--line)}
  .crumb{color:var(--dim)} .crumb b{color:var(--fg)}
  .issuehead{max-width:900px;margin:0 auto;padding:28px 32px 18px}
  .state{font-size:11.5px;font-weight:600;padding:3px 10px;border-radius:99px;background:rgba(255,94,94,.15);color:#ff8a8a;display:inline-flex;align-items:center;gap:6px}
  h1{font-size:19px;font-weight:600;letter-spacing:-.01em;line-height:1.35;margin-top:10px}
  .body{max-width:900px;margin:0 auto;padding:6px 32px 40px}
  .card{background:var(--surf);border:1px solid var(--line);border-radius:8px;padding:16px 18px;margin-bottom:12px}
  .card h2{font-size:11px;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:9px}
  p code{font-family:var(--mono);font-size:11.5px;background:var(--accsoft);color:#b6bcf0;padding:1px 5px;border-radius:4px}
  pre{margin-top:10px;background:#101114;border:1px solid var(--line);border-radius:7px;padding:14px;font-family:var(--mono);font-size:11.5px;line-height:1.6;color:#c8ccd4;overflow-x:auto}
  .fixcard{border-left:3px solid #4cb782}
  .fixcard h2{color:#7dd0a5}
  .pager{display:flex;justify-content:space-between;max-width:900px;margin:0 auto;padding:0 32px 30px;font-size:12.5px;color:var(--dim)}
  .pager a{color:inherit;text-decoration:none}
</style>
</head>
<body>
<aside>
  <div class="ws"><span class="logo">VF</span> visual-findings</div>
  <a class="nav" href="index.html">← Back to list</a>
</aside>
<main>
  <header class="top"><span class="crumb">Audit / <b>${esc(finding.id||'VF')}</b></span></header>

  <div class="issuehead">
    <span class="state">${esc(finding.severity)}</span>
    <h1>${esc(finding.title)}</h1>
    <div style="color:var(--dim2);font-size:12px;margin-top:8px">${esc(loc(finding))} · ${esc(finding.category)} ${linkUrl(finding) ? `· <a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:var(--acc)">${esc(linkUrl(finding))} ↗</a>` : ''}</div>
  </div>

  <div class="body">
    <div class="card"><h2>Description</h2><p>${prose(finding.description)}</p></div>
    ${finding.codeSnippet ? `<div class="card"><h2>Evidence</h2><pre>${esc(finding.codeSnippet)}</pre></div>` : ''}
    ${finding.recommendation ? `<div class="card fixcard"><h2>Recommendation</h2><p>${prose(finding.recommendation)}</p></div>` : ''}
  </div>

  <div class="pager">
    <a href="index.html">← Back to list</a>
    <a href="${next ? 'finding-' + String(next).padStart(3,'0') + '.html' : '#'}">Next issue →</a>
  </div>
</main>
</body>
</html>`;
  }
};
