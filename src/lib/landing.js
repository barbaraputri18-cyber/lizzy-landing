// Ambil data landing dari API dashboard pas build; kalau gagal pakai landing.json.
import fallback from '../data/landing.json';

export const API_BASE = (import.meta.env.PUBLIC_LANDING_API || 'https://coffe.lizzy.my.id/api/public').replace(/\/$/, '');
const REQUIRED = ['brand', 'status', 'menu', 'menuLengkap', 'titik', 'jadwal'];
let cached;

// ---- normalisasi item menu dari dashboard API ----
const SIG_ID = { 1: 'aren', 2: 'butterscotch', 3: 'matcha' };
const norm = (n) => String(n ?? '').toLowerCase().replace(/\(.*?\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
const fbItems = [...(fallback.menu ?? []), ...(fallback.menuLengkap ?? [])];
const fbById = (id) => fallback.menuLengkap?.find((x) => x.id === id) ?? fallback.menu?.find((x) => x.id === id);
const fbByName = (name) => fbItems.find((x) => norm(x.name) === norm(name));
export function mapId(it) {
  if (it == null) return it;
  if (typeof it !== 'object') return String(it);
  if (SIG_ID[it.signature_order]) return SIG_ID[it.signature_order];
  if (/trio/i.test(it.name ?? '')) return 'trio';
  return it.slug || String(it.id);
}
export function normalizeItem(it, i) {
  if (!it || typeof it !== 'object') return it;
  const id = mapId(it);
  const fb = fbById(id) ?? fbByName(it.name) ?? {};
  const isTrio = id === 'trio';
  return {
    ...it,
    id,
    namaUmum: it.namaUmum ?? it.generic_name ?? fb.namaUmum,
    desc: it.public_description || it.desc || fb.desc,
    tag: it.tag ?? fb.tag,
    img: it.img ?? fb.img,
    tone: it.tone ?? fb.tone,
    cat: it.cat || (isTrio ? 'Bundle' : fb.cat),
    order: it.order ?? fb.order ?? i,
  };
}
const normList = (a) => (Array.isArray(a) ? a.map(normalizeItem) : a);
// dashboard stok kosong -> semua soldOut: abaikan supaya web nggak tampil 'Habis' semua
const fixSoldOut = (a) => (Array.isArray(a) && a.length && a.every((m) => m?.soldOut) ? a.map((m) => ({ ...m, soldOut: false })) : a);

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
        for (const k of ['menu', 'menuLengkap']) if (data[k] !== fallback[k]) data[k] = fixSoldOut(normList(data[k]));
        if (Array.isArray(d.signatures)) {
          // signatures bisa berupa objek item atau id mentah ("6") -> cari item aslinya di menuLengkap API
          const raw = [...(d.menuLengkap ?? []), ...(d.menu ?? [])];
          data.signatures = d.signatures.map((x, i) => (typeof x === 'object' && x ? normalizeItem(x, i) : mapId(raw.find((m) => String(m?.id) === String(x)) ?? x)));
        }
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
