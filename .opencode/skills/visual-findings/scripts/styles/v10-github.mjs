import { esc, prose, sevCounts, catCounts, loc, renderUrlLink, linkUrl } from './shared.mjs';

export default {
  name: 'v10-github',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const counts = sevCounts(findings);
    const cats = Object.keys(catCounts(findings));

    const rowsHtml = findings.map((f, i) => `
      <a class="li" data-sev="${esc(f.severity)}" data-cat="${esc(f.category)}" data-text="${esc(f.title + ' ' + f.category)}" href="finding-${String(i+1).padStart(3,'0')}.html">
        <span class="state-ic ic-${esc(f.severity)}">!</span>
        <div class="libody"><div class="lititle">${esc(f.title)} ${renderUrlLink(f, 'url-link')}</div><div class="limeta">#${String(i+1).padStart(3,'0')} · ${esc(f.category)} · ${esc(loc(f))}</div></div>
        <span class="labels"><span class="label lb-${esc(f.severity)}">${esc(f.severity)}</span></span>
      </a>`).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --canvas:#f6f8fa; --card:#fff; --line:#d0d7de; --fg:#1f2328; --dim:#656d76; --dim2:#8c959f;
    --acc:#0969da;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif;
    --mono:ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--canvas);color:var(--fg);font-family:var(--sans);font-size:14px;line-height:1.5}
  header.site{background:#24292f;color:#fff;padding:12px 24px;display:flex;align-items:center;gap:10px}
  header.site .mark{width:26px;height:26px;border-radius:50%;background:#fff;color:#24292f;display:flex;align-items:center;justify-content:center;font-weight:800}
  .wrap{max-width:1012px;margin:0 auto;padding:20px 16px 44px}
  .repohdr{display:flex;align-items:center;gap:8px;font-size:16px;margin-bottom:4px}
  .visibility{font-size:11px;border:1px solid var(--line);border-radius:99px;padding:1px 8px;color:var(--dim)}
  p.desc{color:var(--dim);font-size:13px;margin-bottom:18px}
  .tabs{display:flex;gap:6px;border-bottom:1px solid var(--line);margin-bottom:14px}
  .tab{padding:7px 13px;font-size:14px;color:var(--fg);border-radius:6px 6px 0 0;border-bottom:2px solid transparent;cursor:pointer}
  .tab.on{border-bottom-color:#fd8c73;font-weight:600}
  .tab .cnt{background:#eff2f5;border-radius:99px;font-size:11.5px;padding:1px 7px;margin-left:5px;color:var(--dim)}
  .toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}
  input.q{all:unset;flex:1;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:5px 12px;font-size:13px}
  select{all:unset;background:var(--card);border:1px solid var(--line);border-radius:6px;padding:5px 10px;font-size:13px;cursor:pointer}
  .list{background:var(--card);border:1px solid var(--line);border-radius:6px;overflow:hidden}
  .li{display:flex;gap:10px;padding:10px 16px;border-bottom:1px solid #eaeef2;text-decoration:none;color:inherit;cursor:pointer}
  .li:hover{background:#f6f8fa}
  .li:last-child{border-bottom:none}
  .li.hidden{display:none}
  .state-ic{flex-shrink:0;margin-top:2px;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800}
  .ic-critical{background:#cf222e} .ic-high{background:#bc4c00} .ic-medium{background:#9a6700} .ic-low{background:#0969da} .ic-info{background:#57606a}
  .libody{flex:1;min-width:0}
  .lititle{font-weight:600;font-size:14.5px;color:var(--fg)}
  .url-link{font-size:11px;font-weight:500;color:var(--acc);text-decoration:none;padding:1px 6px;border-radius:4px;background:#ddf4ff;margin-left:6px}
  .limeta{font-size:12px;color:var(--dim);margin-top:3px}
  .labels{display:flex;gap:5px;margin-left:auto;align-items:center;flex-shrink:0}
  .label{font-size:11.5px;font-weight:600;padding:1px 9px;border-radius:99px}
  .lb-critical{background:#ffebe9;color:#cf222e} .lb-high{background:#fff1e5;color:#bc4c00}
  .lb-medium{background:#fff8c5;color:#9a6700} .lb-low{background:#ddf4ff;color:#0969da} .lb-info{background:#eff2f5;color:#57606a}
</style>
</head>
<body>
<header class="site"><span class="mark">VF</span><span style="font-weight:600">visual-findings</span></header>
<div class="wrap">
  <div class="repohdr"><b>${esc(meta.title)}</b> <span class="visibility">Public report</span></div>
  <p class="desc">${findings.length} findings · generated ${esc(meta.now)}</p>

  <div class="tabs" id="tabs">
    <span class="tab on" data-sev="" onclick="flt('',this)">All<span class="cnt">${findings.length}</span></span>
    <span class="tab" data-sev="critical" onclick="flt('critical',this)">Critical<span class="cnt">${counts.critical}</span></span>
    <span class="tab" data-sev="high" onclick="flt('high',this)">High<span class="cnt">${counts.high}</span></span>
    <span class="tab" data-sev="medium" onclick="flt('medium',this)">Medium<span class="cnt">${counts.medium}</span></span>
    <span class="tab" data-sev="low" onclick="flt('low',this)">Low<span class="cnt">${counts.low}</span></span>
    <span class="tab" data-sev="info" onclick="flt('info',this)">Info<span class="cnt">${counts.info}</span></span>
  </div>

  <div class="toolbar">
    <input class="q" id="q" placeholder="Search findings…" oninput="apply()">
    <select onchange="apply()"><option value="">Category ▾</option>${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select>
  </div>

  <div class="list" id="list">${rowsHtml}</div>
</div>
<script>
let sev='',cat='';
function flt(s,el){sev=s;document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on',t===el));apply()}
function apply(){
  const q=document.getElementById('q').value.toLowerCase(); cat=document.querySelector('select').value;
  document.querySelectorAll('.li').forEach(r=>{
    const ok=(!sev||r.dataset.sev===sev)&&(!cat||r.dataset.cat===cat)&&(!q||r.textContent.toLowerCase().includes(q));
    r.style.display=ok?'':'none';
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
    --canvas:#f6f8fa; --card:#fff; --line:#d0d7de; --fg:#1f2328; --dim:#656d76; --acc:#0969da;
    --sans:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; --mono:ui-monospace,Menlo,monospace;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--canvas);color:var(--fg);font-family:var(--sans);font-size:14px;line-height:1.55}
  .wrap{max-width:900px;margin:0 auto;padding:20px 16px 44px}
  a.back{color:var(--dim);text-decoration:none;font-size:13.5px}
  .issue{background:var(--card);border:1px solid var(--line);border-radius:6px;margin-top:14px}
  .ihead{padding:18px 20px;border-bottom:1px solid #eaeef2}
  h1{font-size:20px;font-weight:600;line-height:1.3}
  .ibody{padding:18px 20px}
  .ibody h2{font-size:14px;font-weight:600;margin:16px 0 8px}
  p code{font-family:var(--mono);font-size:12px;background:rgba(175,184,193,.2);padding:1px 5px;border-radius:5px}
  pre{margin-top:10px;background:#f6f8fa;border:1px solid var(--line);border-radius:6px;padding:13px;font-family:var(--mono);font-size:12px;line-height:1.55;overflow-x:auto}
  .callout{border:1px solid #d4f4dc;background:#dafbe1;border-radius:6px;padding:13px 15px;margin-top:14px}
</style>
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← Back to findings list</a>
  <div class="issue">
    <div class="ihead">
      <h1>${esc(finding.title)}</h1>
      ${linkUrl(finding) ? `<div style="margin-top:8px"><a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:var(--acc);font-size:13px">🔗 ${esc(linkUrl(finding))} ↗</a></div>` : ''}
    </div>
    <div class="ibody">
      <h2>Description</h2><p>${prose(finding.description)}</p>
      ${finding.codeSnippet ? `<h2>Evidence</h2><pre>${esc(finding.codeSnippet)}</pre>` : ''}
      ${finding.recommendation ? `<div class="callout"><b>Recommended fix</b><br>${prose(finding.recommendation)}</div>` : ''}
    </div>
  </div>
</div>
</body>
</html>`;
  }
};
