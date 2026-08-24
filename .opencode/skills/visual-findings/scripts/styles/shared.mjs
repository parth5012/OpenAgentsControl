/** Shared helpers for visual-findings style modules. */

export const SEVS = ['critical', 'high', 'medium', 'low', 'info'];

/** Escape a string for safe HTML interpolation. EVERY user-data field must pass through this. */
export const esc = (s = '') =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

/** Escape then convert newlines to <br> for prose fields. */
export const prose = (s = '') => esc(s).replace(/\r?\n/g, '<br>');

export const cap = (s = '') => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export function sevCounts(findings) {
  const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
  for (const f of findings) if (counts[f.severity] !== undefined) counts[f.severity]++;
  return counts;
}

export function catCounts(findings) {
  const counts = {};
  for (const f of findings) counts[f.category] = (counts[f.category] || 0) + 1;
  return counts;
}

export const loc = (f) => (f.file ? `${f.file}${f.line ? ':' + f.line : ''}` : '—');

/** Extract URL/link from finding object if provided. */
export const linkUrl = (f) => f.url || f.href || f.link || f.targetUrl || f.sourceUrl || null;

/** Render a clickable link button/badge if URL present. */
export const renderUrlLink = (f, className = '') => {
  const u = linkUrl(f);
  if (!u) return '';
  return `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer" class="${className}" onclick="event.stopPropagation()">↗ link</a>`;
};

/** Common page shell pieces. */
export const THEME_SCRIPT = `<script>
function vfTgl(){const h=document.documentElement,next=h.getAttribute('data-theme')==='dark'?'light':'dark';h.setAttribute('data-theme',next);try{localStorage.setItem('vf-theme',next)}catch(e){}}
try{const t=localStorage.getItem('vf-theme');if(t)document.documentElement.setAttribute('data-theme',t);else if(matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.setAttribute('data-theme','dark')}catch(e){}
</script>`;

export const COPY_SCRIPT = `<script>
function vfCopy(b,t){navigator.clipboard.writeText(t);const o=b.textContent;b.textContent='copied ✓';setTimeout(()=>b.textContent=o,1200)}
</script>`;
