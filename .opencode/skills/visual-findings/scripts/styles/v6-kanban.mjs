import { esc, prose, loc, renderUrlLink, linkUrl, COPY_SCRIPT } from './shared.mjs';

export default {
  name: 'v6-kanban',
  hasDetailPages: true,

  dashboard(findings, meta) {
    const cols = { critical: [], high: [], medium: [], low: [], info: [] };
    findings.forEach((f, i) => {
      if (cols[f.severity]) cols[f.severity].push({ ...f, idx: i + 1 });
      else cols.info.push({ ...f, idx: i + 1 });
    });

    const renderCol = (sev, title) => {
      const items = cols[sev] || [];
      const cardsHtml = items.length === 0
        ? `<div class="emptycol">No ${sev} findings</div>`
        : items.map(f => `
          <a class="card2 b-${esc(sev)}" href="finding-${String(f.idx).padStart(3,'0')}.html">
            <div class="ctitle">${esc(f.title)} ${renderUrlLink(f, 'url-link')}</div>
            <div class="cpath">${esc(loc(f))}</div>
            <div class="ctags">${(f.tags || []).map(t => `<span class="t">#${esc(t)}</span>`).join('')}</div>
          </a>`).join('');

      return `
        <div class="col c-${esc(sev)}">
          <div class="colhead"><i></i>${title}<span class="cnt">${items.length}</span></div>
          <div class="cards">${cardsHtml}</div>
        </div>`;
    };

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(meta.title)}</title>
<style>
  :root{
    --bg:#eef0f3; --col:#e4e7ec; --card:#fff; --text:#1f2430; --dim:#6b7280; --line:#dfe3ea;
    --crit:#ef4444; --high:#f59e0b; --med:#eab308; --low:#06b6d4; --info:#94a3b8; --acc:#6366f1;
    --sans:'Inter',system-ui,sans-serif;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.5;padding:26px}
  .wrap{max-width:1280px;margin:0 auto}
  header{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px}
  h1{font-size:19px;font-weight:700;letter-spacing:-.02em;display:flex;align-items:center;gap:9px}
  .chip{font-size:11px;font-weight:700;background:var(--card);border:1px solid var(--line);padding:3px 10px;border-radius:99px;color:var(--dim)}
  .sub{color:var(--dim);font-size:12.5px;margin-top:3px}
  .board{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;align-items:start}
  .colhead{display:flex;align-items:center;gap:8px;padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.07em}
  .colhead .cnt{margin-left:auto;font-size:11px;color:var(--dim);background:rgba(0,0,0,.05);border-radius:99px;padding:1px 8px}
  .colhead i{width:8px;height:8px;border-radius:50%;font-style:normal}
  .c-critical i{background:var(--crit)} .c-high i{background:var(--high)} .c-medium i{background:var(--med)} .c-low i{background:var(--low)} .c-info i{background:var(--info)}
  .col{background:var(--col);border-radius:13px;padding:8px}
  .cards{display:flex;flex-direction:column;gap:9px;padding-top:2px}
  .card2{background:var(--card);border:1px solid var(--line);border-left-width:4px;border-radius:10px;padding:12px 13px;cursor:pointer;transition:transform .12s,box-shadow .12s;text-decoration:none;color:inherit;display:block}
  .card2:hover{transform:translateY(-2px);box-shadow:0 5px 14px rgba(15,23,42,.09)}
  .b-critical{border-left-color:var(--crit)} .b-high{border-left-color:var(--high)} .b-medium{border-left-color:var(--med)} .b-low{border-left-color:var(--low)} .b-info{border-left-color:var(--info)}
  .ctitle{font-weight:600;font-size:13px;line-height:1.35}
  .url-link{font-size:10px;font-weight:600;color:var(--acc);text-decoration:none;padding:1px 5px;border-radius:3px;background:#eef0ff;margin-left:4px}
  .cpath{font-family:'Cascadia Code',Consolas,monospace;font-size:10.5px;color:var(--dim);margin-top:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .ctags{display:flex;gap:5px;flex-wrap:wrap;margin-top:8px}
  .t{font-size:10px;color:var(--dim);background:#f1f3f7;border-radius:5px;padding:1px 7px}
  .emptycol{text-align:center;color:var(--dim);font-size:11.5px;padding:18px 6px}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <div>
      <h1><span class="chip" style="color:var(--acc)">BOARD</span> ${esc(meta.title)}</h1>
      <p class="sub">${findings.length} findings · grouped by severity · click a card for detail</p>
    </div>
    <span class="chip">${esc(meta.now)}</span>
  </header>

  <div class="board">
    ${renderCol('critical', 'Critical')}
    ${renderCol('high', 'High')}
    ${renderCol('medium', 'Medium')}
    ${renderCol('low', 'Low')}
    ${renderCol('info', 'Info')}
  </div>
</div>
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
    --bg:#eef0f3; --card:#fff; --text:#1f2430; --dim:#6b7280; --line:#dfe3ea;
    --crit:#ef4444; --high:#f59e0b; --med:#eab308; --low:#06b6d4; --info:#94a3b8; --acc:#6366f1;
    --sans:'Inter',system-ui,sans-serif;
  }
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:14px;line-height:1.6;padding:26px}
  .wrap{max-width:760px;margin:0 auto}
  a.back{color:var(--dim);text-decoration:none;font-size:12.5px;font-weight:600}
  .card{background:var(--card);border:1px solid var(--line);border-left:5px solid var(--crit);border-radius:13px;padding:24px;margin-top:14px;box-shadow:0 2px 10px rgba(15,23,42,.05)}
  .badges{display:flex;gap:7px;flex-wrap:wrap;margin-bottom:12px}
  .b1{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#fff;background:var(--crit);padding:3px 10px;border-radius:6px}
  .b2{font-size:10px;font-weight:700;color:var(--dim);background:#f1f3f7;padding:3px 10px;border-radius:6px}
  h1{font-size:20px;font-weight:700;line-height:1.35;letter-spacing:-.01em}
  .pathrow{display:flex;justify-content:space-between;align-items:center;background:#f8f9fb;border:1px solid var(--line);border-radius:99px;padding:9px 13px;margin-top:14px}
  .pathrow code{font-family:'Cascadia Code',Consolas,monospace;font-size:11.5px;color:var(--acc)}
  .pathrow button{all:unset;cursor:pointer;font-size:11px;font-weight:600;color:var(--dim)}
  h2{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:var(--dim);margin:22px 0 8px}
  p code{font-family:'Cascadia Code',Consolas,monospace;font-size:12px;background:#eef0ff;color:var(--acc);padding:1px 5px;border-radius:4px}
  pre{margin-top:10px;background:#161a23;border-radius:10px;color:#cdd6e4;padding:16px;font-family:'Cascadia Code',Consolas,monospace;font-size:12px;line-height:1.6;overflow-x:auto}
  .fix{background:#ecfdf5;border-left:4px solid #10b981;border-radius:0 9px 9px 0;padding:12px 16px}
  .tags{display:flex;gap:6px;flex-wrap:wrap;margin-top:18px}
  .tag{font-size:10.5px;color:var(--dim);border:1px solid var(--line);border-radius:99px;padding:2px 9px}
</style>
${COPY_SCRIPT}
</head>
<body>
<div class="wrap">
  <a class="back" href="index.html">← Back to board</a>

    <div class="card">
      <div class="badges"><span class="b1">${esc(finding.severity)}</span><span class="b2">${esc(finding.category)}</span></div>
      <h1>${esc(finding.title)}</h1>
      <div class="pathrow"><code>${esc(loc(finding))}</code><button onclick="vfCopy(this, '${esc(loc(finding))}')">copy path</button></div>
      ${linkUrl(finding) ? `<div style="margin-top:10px"><a href="${esc(linkUrl(finding))}" target="_blank" rel="noopener noreferrer" style="color:var(--acc);font-weight:600;font-size:12.5px">🔗 ${esc(linkUrl(finding))} ↗</a></div>` : ''}

    <h2>Description</h2>
    <p>${prose(finding.description)}</p>

    ${finding.codeSnippet ? `<h2>Evidence</h2><pre>${esc(finding.codeSnippet)}</pre>` : ''}

    ${finding.recommendation ? `<h2 style="color:#059669">Recommended fix</h2><p class="fix">${prose(finding.recommendation)}</p>` : ''}

    <div class="tags">${(finding.tags || []).map(t => `<span class="tag">#${esc(t)}</span>`).join('')}</div>
  </div>
</div>
</body>
</html>`;
  }
};
