// Status live: posisi Lizzy + menu habis, di-poll tiap 60 detik dari /api/public/status.
const API = (window.LZ_API || 'https://coffe.lizzy.my.id/api/public').replace(/\/$/, '');
const KEY = 'lz-status';
const titik = (() => { try { return JSON.parse(document.getElementById('landing-data').textContent).titik || []; } catch { return []; } })();
const set = (k, v) => document.querySelectorAll(`[data-live="${k}"]`).forEach((el) => { if (v != null && el.textContent !== String(v)) el.textContent = v; });

function apply(s) {
  if (!s) return;
  const t = titik.find((x) => x.id === s.titikId);
  if (s.open === false) set('name', 'Lagi nggak mangkal');
  else if (t) set('name', t.name);
  set('eta', s.etaMin);
  set('until', s.openUntil);
  if (Array.isArray(s.soldOut)) {
    const out = new Set(s.soldOut);
    document.querySelectorAll('.mitem[data-id]').forEach((li) => {
      const isOut = out.has(li.dataset.id);
      li.classList.toggle('out', isOut);
      li.querySelectorAll('.mi-add').forEach((a) => { a.hidden = isOut; });
    });
  }
  document.dispatchEvent(new CustomEvent('lz:status', { detail: s }));
}

async function poll() {
  if (document.hidden) return;
  try {
    const r = await fetch(`${API}/status`, { headers: { Accept: 'application/json' }, cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const s = j?.data ?? j;
    if (s && 'open' in s) { localStorage.setItem(KEY, JSON.stringify(s)); apply(s); }
  } catch { /* API mati: tetap pakai data terakhir */ }
}

try { const c = JSON.parse(localStorage.getItem(KEY)); if (c && Date.now() - Date.parse(c.updatedAt) < 6 * 3600e3) apply(c); } catch {}
poll();
setInterval(poll, 60000);
document.addEventListener('visibilitychange', () => { if (!document.hidden) poll(); });
