// Alamat titik mangkal untuk ditampilkan: pakai `address` dari API,
// kalau kosong pakai koordinat "lat, lng" (4 desimal), kalau koordinat juga tidak valid = ''.
const num = (v) => (v === null || v === undefined || (typeof v === 'string' && v.trim() === '') ? NaN : Number(v));
export function alamatTitik(t) {
  if (!t) return '';
  const a = typeof t.address === 'string' ? t.address.trim() : '';
  if (a) return a;
  const lat = num(t.lat), lng = num(t.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : '';
}
