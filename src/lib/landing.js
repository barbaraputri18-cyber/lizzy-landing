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
      if (REQUIRED.every((k) => d && k in d)) { data = { ...fallback, ...d }; source = 'api';
        // API masih kosong (menu/promo belum diisi di dashboard): pakai landing.json
        for (const k of ['menu', 'menuLengkap', 'promos']) if (!Array.isArray(d[k]) || d[k].length === 0) data[k] = fallback[k];
      }
      else console.warn('[landing] API format tidak lengkap, pakai landing.json');
    } else console.warn(`[landing] API ${res.status}, pakai landing.json`);
  } catch (e) {
    console.warn('[landing] API tidak bisa diakses, pakai landing.json:', e.message);
  }
  // Uji state kosong: LZ_EMPTY_TITIK=1 npm run build
  if (typeof process !== 'undefined' && process.env?.LZ_EMPTY_TITIK) data = { ...data, titik: [], jadwal: [] };
  // urutkan menu sesuai `order` (data API menang; item tanpa order tetap di urutan aslinya)
  const byOrder = (a) => (Array.isArray(a) ? a.map((m, i) => [m, i]).sort((x, y) => (x[0].order ?? 1e9) - (y[0].order ?? 1e9) || x[1] - y[1]).map(([m]) => m) : a);
  data = { ...data, menu: byOrder(data.menu), menuLengkap: byOrder(data.menuLengkap) };
  data = { ...data, titik: Array.isArray(data.titik) ? data.titik : [], jadwal: Array.isArray(data.jadwal) ? data.jadwal : [] };
  cached = { ...data, _source: source };
  return cached;
}

// Gambar: nama file di public/img atau URL lengkap dari dashboard.
export const img = (v) => (/^https?:\/\//.test(v) ? v : `img/${v}.webp`);
