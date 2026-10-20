// Ambil data landing dari API dashboard pas build; kalau gagal pakai landing.json.
import fallback from '../data/landing.json';

export const API_BASE = (import.meta.env.PUBLIC_LANDING_API || 'https://coffe.lizzy.my.id/api/public').replace(/\/$/, '');
const REQUIRED = ['brand', 'status', 'menu', 'menuLengkap', 'titik', 'jadwal'];
let cached;

export async function getLanding() {
  if (cached) return cached;
  let data = fallback, source = 'fallback';
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 6000);
    const res = await fetch(`${API_BASE}/landing`, { signal: ctl.signal, headers: { Accept: 'application/json' } });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const d = json?.data ?? json;
      if (REQUIRED.every((k) => d && k in d)) { data = { ...fallback, ...d, promos: d.promos ?? [] }; source = 'api'; }
      else console.warn('[landing] API format tidak lengkap, pakai landing.json');
    } else console.warn(`[landing] API ${res.status}, pakai landing.json`);
  } catch (e) {
    console.warn('[landing] API tidak bisa diakses, pakai landing.json:', e.message);
  }
  cached = { ...data, _source: source };
  return cached;
}

// Gambar: nama file di public/img atau URL lengkap dari dashboard.
export const img = (v) => (/^https?:\/\//.test(v) ? v : `img/${v}.webp`);
