// Status live: badge buka/istirahat, posisi Lizzy, 'Find Lizzy today', menu habis.
// /api/public/status di-poll tiap 60 detik; /api/public/landing sekali saat load (soldOut per menu).
// Gagal (CORS/jaringan) = diam: badge tetap hidden, data build-time dipakai.
import L from 'leaflet';
import { alamatTitik } from '../lib/alamat.js';
const API = (window.LZ_API || 'https://coffe.lizzy.my.id/api/public').replace(/\/$/, '');
const KEY = 'lz-status';
const titik = (() => { try { return JSON.parse(document.getElementById('landing-data').textContent).titik || []; } catch { return []; } })();
const set = (k, v) => document.querySelectorAll(`[data-live="${k}"]`).forEach((el) => { if (v != null && el.textContent !== String(v)) el.textContent = v; });

function apply(s) {
  if (!s) return;
  const t = s.titikId != null ? titik.find((x) => x.id === s.titikId) : null;
  if (s.open === false) set('name', 'Lagi nggak mangkal');
  else if (t) set('name', t.name);
  const hasEta = s.etaMin != null && s.etaMin !== '';
  if (hasEta) set('eta', s.etaMin);
  document.querySelectorAll('[data-eta-wrap]').forEach((el) => { el.hidden = !hasEta; });
  document.querySelectorAll('[data-live-lbl]').forEach((el) => { el.textContent = hasEta ? 'Lizzy sekarang di' : 'Lagi di'; });
  document.querySelectorAll('[data-until-lbl]').forEach((el) => { el.textContent = hasEta ? 'buka s/d' : 'buka sampai jam'; });
  if (s.openUntil != null) set('until', s.openUntil);
  badge(s);
  const shown = today(s);
  const soon = !shown;
  soonCards(soon);
  document.dispatchEvent(new CustomEvent('lz:status', { detail: { ...s, soon } }));
}

const hhmm = (v) => String(v ?? '').trim().replace(/^(\d{1,2})[:.](\d{2}).*$/, (_, h, m) => `${h.padStart(2, '0')}.${m}`);
function badge(s) {
  const b = document.querySelector('[data-live-badge]'); if (!b || typeof s.open !== 'boolean') return;
  const until = s.openUntil ? hhmm(s.openUntil) : '';
  b.querySelector('[data-live-badge-txt]').textContent = s.open ? (until ? `Lizzy lagi buka, sampai ${until}` : 'Lizzy lagi buka') : ((s.titikId == null && s.lat == null) ? 'Segera buka' : 'Lagi istirahat');
  b.classList.toggle('is-open', s.open); b.hidden = false;
}


// ---- Jadwal hari ini: 'Senin–Jumat', 'Sabtu, Minggu', 'Setiap hari'. Tidak terbaca = anggap cocok (jangan sembunyikan). ----
const HARI = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
const jadwalL = (() => { try { return JSON.parse(document.getElementById('landing-data').textContent).jadwal || []; } catch { return []; } })();
function hariCocok(days, d) {
  const str = String(days ?? '').toLowerCase().replace(/jum'?at/g, 'jumat');
  if (!str.trim() || /setiap|tiap hari|everyday|daily/.test(str)) return null;
  let found = false, hit = false;
  for (const part of str.split(/[,&]|\bdan\b/)) {
    const r = part.split(/\s*(?:–|—|-|s\/d|sampai)\s*/).map((x) => HARI.findIndex((h) => x.includes(h)));
    if (r.length >= 2 && r[0] >= 0 && r[r.length - 1] >= 0) { found = true; const a = r[0], b = r[r.length - 1]; if (a <= b ? d >= a && d <= b : d >= a || d <= b) hit = true; }
    else if (r[0] >= 0) { found = true; if (r[0] === d) hit = true; }
  }
  return found ? hit : null;
}
function jadwalHariIni(t) {
  const js = jadwalL.filter((j) => String(j.titikId) === String(t.id));
  if (!js.length) return true;
  const d = new Date().getDay();
  const res = js.map((j) => hariCocok(j.days, d));
  return res.some((r) => r !== false);
}
// ---- Kartu 'Jadwal segera diumumkan' di slot Lokasi hari ini (kalau jadwal kosong, kartu di section jadwal sudah ada) ----
function soonCards(soon) {
  document.querySelectorAll('[data-today-soon]').forEach((el) => { el.hidden = !soon || el.dataset.hasJadwal !== '1'; });
}

// ---- Find Lizzy today (peta + petunjuk arah); tanpa titik = section tetap hidden ----
let tMap, tMark;
function today(s) {
  const sec = document.querySelector('[data-today]'); if (!sec) return false;
  const t = s.titikId != null ? titik.find((x) => String(x.id) === String(s.titikId)) : null;
  const lat = Number.isFinite(+s.lat) && s.lat !== null ? +s.lat : t ? +t.lat : NaN;
  const lng = Number.isFinite(+s.lng) && s.lng !== null ? +s.lng : t ? +t.lng : NaN;
  if (s.open === false || !Number.isFinite(lat) || !Number.isFinite(lng) || (t && !jadwalHariIni(t))) { sec.hidden = true; return false; }
  sec.hidden = false; sec.dataset.lat = lat; sec.dataset.lng = lng;
  const nm = sec.querySelector('[data-today-name]'), ad = sec.querySelector('[data-today-addr]');
  if (t) { nm.textContent = t.name; ad.textContent = alamatTitik(t); }
  sec.querySelector('[data-today-dir]').href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  drawToday(sec, lat, lng);
  return true;
}
function drawToday(sec, lat, lng) {
  const el = sec.querySelector('#mapToday'); if (!el) return;
  if (!tMap) {
    tMap = L.map(el, { zoomControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false, attributionControl: true });
    tMap.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin' }).addTo(tMap);
    tMark = L.marker([lat, lng], { icon: L.divIcon({ className: 'lz-pin-wrap', html: '<div class="lz-pin"><span class="ring"></span><img src="img/logo.webp" alt=""></div>', iconSize: [54, 60], iconAnchor: [27, 64] }) }).addTo(tMap);
  } else tMark.setLatLng([lat, lng]);
  tMap.setView([lat, lng], 16, { animate: false });
}
{ const sec = document.querySelector('[data-today]'); if (sec && !sec.hidden && sec.dataset.lat) drawToday(sec, +sec.dataset.lat, +sec.dataset.lng); }

// ---- 'Habis' real-time per menu (aturan: kalau SEMUA soldOut, abaikan) ----
const norm = (x) => String(x ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function stock() {
  try {
    const r = await fetch(`${API}/landing`, { headers: { Accept: 'application/json' } });
    if (!r.ok) return;
    const j = await r.json(); const d = j?.data ?? j;
    const list = Array.isArray(d?.menuLengkap) ? d.menuLengkap : [];
    if (!list.length) return;
    const allOut = list.every((m) => m?.soldOut);
    const byName = new Map(list.map((m) => [norm(m.name), !!m.soldOut])), byId = new Map(list.map((m) => [String(m.id), !!m.soldOut]));
    document.querySelectorAll('.mitem[data-id]').forEach((li) => {
      const v = byName.get(norm(li.dataset.n)) ?? byId.get(li.dataset.id);
      if (v === undefined) return;
      const isOut = allOut ? false : v;
      li.classList.toggle('out', isOut);
      li.querySelectorAll('.mi-add').forEach((a) => { a.hidden = isOut; });
      let na = li.querySelector('.mi-na');
      if (isOut && !na) { na = document.createElement('span'); na.className = 'mi-na'; na.textContent = 'Besok lagi ya'; li.querySelector('.mi-foot')?.append(na); }
      if (na) na.hidden = !isOut;
    });
  } catch { /* CORS/jaringan: pakai data build-time */ }
}
stock();

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
