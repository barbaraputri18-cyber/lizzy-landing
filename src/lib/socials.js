// Ikon sosial otomatis dari label/URL brand.socials. Ikon = SVG stroke currentColor (24x24) buatan sendiri,
// dirender via elemen (Astro: <path d>), tanpa innerHTML data API. Platform tak dikenal = ikon link generik.
const P = {
  instagram: { name: 'Instagram', d: ['M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z', 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z', 'M17.2 6.8h.01'] },
  tiktok: { name: 'TikTok', d: ['M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5', 'M14 3c.4 2.6 2.2 4.4 5 4.6'] },
  facebook: { name: 'Facebook', d: ['M14.5 21v-8h2.7l.4-3.2h-3.1V7.9c0-.9.3-1.6 1.6-1.6h1.6V3.5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H8.6V13h2.7v8'] },
  x: { name: 'X', d: ['M4 4l16 16', 'M20 4l-6.6 7.4', 'M10.6 12.6 4 20'] },
  youtube: { name: 'YouTube', d: ['M3.5 8.2c.2-1.6 1.3-2.7 2.9-2.8C8.2 5.2 10 5.1 12 5.1s3.8.1 5.6.3c1.6.1 2.7 1.2 2.9 2.8.2 1.3.2 2.5.2 3.8s0 2.5-.2 3.8c-.2 1.6-1.3 2.7-2.9 2.8-1.8.2-3.6.3-5.6.3s-3.8-.1-5.6-.3c-1.6-.1-2.7-1.2-2.9-2.8C3.3 14.5 3.3 13.3 3.3 12s0-2.5.2-3.8Z', 'M10 9.2v5.6l4.8-2.8Z'] },
  whatsapp: { name: 'WhatsApp', d: ['M3.6 20.4l1.2-4.3A8.4 8.4 0 1 1 8 19.2Z', 'M9 8.2c.3-.5.6-.5.9-.5l.6.1.8 1.9-.6.9c.5 1.1 1.4 2 2.6 2.6l.9-.7 1.9.8v.6c0 .5-.7 1.3-1.6 1.3-2.6 0-5.6-3-5.6-5.6 0-.6.1-1 .1-1.4Z'] },
  threads: { name: 'Threads', d: ['M16.6 11.3c-.4-2.4-2-3.6-4.3-3.6-2 0-3.3 1-3.8 2.4', 'M16.7 11.4c-3.2-.7-7 .1-6.8 2.5.2 2.4 4.8 2.6 5.9-.3.6-1.7.5-3.8.5-3.8', 'M18.6 7.4C17.3 4.9 15.1 3.6 12 3.6 7 3.6 4.3 7 4.3 12s2.7 8.4 7.7 8.4c3.5 0 6.6-1.8 6.6-5.1 0-1.5-.8-2.9-2-3.6'] },
  telegram: { name: 'Telegram', d: ['M21 4 3 11l6 2.3L19 7l-7.6 7.7V20l3.3-3.6L18.5 19Z'] },
  linkedin: { name: 'LinkedIn', d: ['M5 3.5h14A1.5 1.5 0 0 1 20.5 5v14a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19V5A1.5 1.5 0 0 1 5 3.5Z', 'M8 10.5V17', 'M8 7.5v.01', 'M11.5 17v-6.5', 'M11.5 13.2c0-1.6 1-2.7 2.4-2.7s2.1 1 2.1 2.6V17'] },
  spotify: { name: 'Spotify', d: ['M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z', 'M7.2 9.4c3.3-1 7-.7 9.8.9', 'M7.8 12.5c2.7-.8 5.6-.5 7.9.8', 'M8.4 15.4c2.1-.6 4.2-.4 5.9.6'] },
  email: { name: 'Email', d: ['M4 5.5h16a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1Z', 'm3.5 6.5 8.5 6.5 8.5-6.5'] },
  phone: { name: 'Telepon', d: ['M5 4h3.5l1.5 4-2 1.3a10.5 10.5 0 0 0 6.7 6.7L16 14l4 1.5V19a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z'] },
  link: { name: 'Link', d: ['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1', 'M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'] },
};
const RULES = [
  ['whatsapp', /whatsapp|(^|\.)wa\.me$|^wa$/], ['instagram', /instagram|(^|\.)instagr\.am$/], ['threads', /threads/],
  ['tiktok', /tiktok/], ['facebook', /facebook|(^|\.)fb\.(com|me)$/], ['youtube', /youtube|(^|\.)youtu\.be$/],
  ['x', /twitter|(^|\.)x\.com$|^x$/], ['telegram', /telegram|(^|\.)t\.me$/], ['linkedin', /linkedin|(^|\.)lnkd\.in$/], ['spotify', /spotify/],
];
// URL aman: hanya http(s)/mailto/tel; lain = null (link dibuang)
export function safeUrl(u) {
  const s = typeof u === 'string' ? u.trim() : '';
  if (!s) return null;
  try { const x = new URL(s); return /^(https?|mailto|tel):$/.test(x.protocol) ? x.href : null; } catch { return null; }
}
export function platform(label, url) {
  const l = String(label ?? '').toLowerCase().trim();
  let host = '', proto = '';
  try { const x = new URL(url); host = x.hostname.toLowerCase().replace(/^www\./, ''); proto = x.protocol; } catch {}
  if (proto === 'mailto:') return 'email';
  if (proto === 'tel:') return 'phone';
  for (const [k, re] of RULES) if (re.test(host)) return k;
  for (const [k, re] of RULES) if (re.test(l)) return k;
  return 'link';
}
// [{ label, url, key, paths, external }] — label kosong diisi nama platform / host
export function socialLinks(list) {
  return (Array.isArray(list) ? list : []).flatMap((x) => {
    const url = safeUrl(x?.url); if (!url) return [];
    const key = platform(x?.label, url);
    let label = String(x?.label ?? '').trim();
    if (!label) label = key === 'link' ? new URL(url).hostname.replace(/^www\./, '') : P[key].name;
    return [{ label, url, key, paths: P[key].d, external: /^https?:/.test(url) }];
  });
}
export const iconPaths = (key) => (P[key] ?? P.link).d;
// Client-side (kalau suatu saat list dirender di live.js): bangun node via DOM, tanpa innerHTML.
export function socialAnchor(doc, s, cls = '') {
  const a = doc.createElement('a'); a.href = s.url; if (cls) a.className = cls; a.dataset.soc = s.key;
  if (s.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
  const NS = 'http://www.w3.org/2000/svg', svg = doc.createElementNS(NS, 'svg');
  for (const [k, v] of Object.entries({ viewBox: '0 0 24 24', width: '16', height: '16', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false', class: 'soc-ic' })) svg.setAttribute(k, v);
  s.paths.forEach((d) => { const p = doc.createElementNS(NS, 'path'); p.setAttribute('d', d); svg.append(p); });
  const t = doc.createElement('span'); t.textContent = s.label;
  a.append(svg, t); return a;
}
