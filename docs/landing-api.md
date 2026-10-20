# Landing API (coffe.lizzy.my.id)

Dipakai landing page di `https://lizzy.my.id`. Semua endpoint **publik, read-only, GET saja**.
Bentuk JSON **harus sama persis** dengan `src/data/landing.json` (file itu jadi contoh + cadangan kalau API mati).

- CORS: `Access-Control-Allow-Origin: https://lizzy.my.id` (plus `http://localhost:4321` buat dev)
- Cache: `Cache-Control: public, max-age=60` (status) / `max-age=120` (landing)
- Jangan pernah keluarin: omzet, data pelanggan, nomor HP selain WA bisnis, token, data admin.
- Harga: integer Rupiah tanpa titik (`22000`). Waktu: string `"07.00"`. Koordinat: float WGS84.
- Field `contoh` dari API selalu `false` (atau dihapus).

## GET /api/public/landing

```json
{
  "brand": { "name": "Lizzy Coffee", "waNumber": "62812...", "instagram": "https://...", "tiktok": "https://...", "payments": ["Tunai","QRIS"] },
  "status": { "titikId": "t1", "etaMin": 5, "openUntil": "14.00", "userLatLng": null },
  "menu":        [ { "id": "aren", "name": "...", "desc": "...", "price": 22000, "tag": "Signature", "img": "cup-aren" } ],
  "menuLengkap": [ { "id": "aren", "cat": "Kopi", "name": "...", "desc": "...", "price": 22000, "tone": "#7a4a2c", "soldOut": false, "signature": true } ],
  "titik":  [ { "id": "t1", "name": "Titik 1 Kemang", "address": "...", "lat": -6.2607, "lng": 106.8137 } ],
  "jadwal": [ { "titikId": "t1", "days": "Senin – Jumat", "time": "06.30 – 14.00" } ],
  "quote": "...",
  "promos": [ ...lihat di bawah ]
}
```

- `brand` diisi dari menu **Setting Kontak** di dashboard (CRUD):
  - `waNumber`: format `62812...` tanpa `+`/spasi/strip. Dipakai buat semua tombol WA & pre-order.
  - `socials`: array `{ "label": "Instagram", "url": "https://..." }`, urut sesuai `urutan`, cuma yang aktif. Boleh nambah apa aja (Instagram, TikTok, X, Shopee, GoFood, dll).
  - `instagram`/`tiktok` lama tetap dikirim biar kompatibel (boleh ambil dari `socials`).
- `menu` = 3 cup carousel signature (urut). `img` = nama file di `public/img` tanpa `.webp`, **atau** URL lengkap `https://...` kalau upload dari dashboard.
- `menuLengkap[].cat` salah satu: `Kopi`, `Non-kopi`, `Teman ngopi`. `soldOut` diambil dari stok hari ini.
- `menuLengkap[].tone` = warna hex buat ilustrasi cup (boleh default per kategori).

### promos[]

Hanya promo yang **aktif sekarang** (`mulai <= now <= selesai`, status aktif), urut sesuai `urutan`.

| field | tipe | wajib | keterangan |
|---|---|---|---|
| `id` | string | ya | unik |
| `type` | `"lizzy"` \| `"image"` | ya | |
| `anim` | `"push"` \| `"peek"` \| `"lie"` | kalau lizzy | gaya animasi Lizzy |
| `pose` | string | kalau lizzy | `cat-push` / `cat-peek` / `cat-lie` (ikut `anim`) |
| `cup` | string | opsional | nama file cup atau URL |
| `eyebrow` | string | opsional | teks kecil di atas judul |
| `title` | string | ya | `*kata*` = miring emas |
| `desc` | string | opsional | |
| `priceOld`, `priceNew` | int | opsional | harga coret + harga promo |
| `titikId` | string | opsional | buat `anim: "lie"`, label & peta ambil dari `titik`/`jadwal` |
| `cta`, `href` | string | opsional | tombol; `href` boleh `#preorder` atau URL |
| `src`, `alt` | string | kalau image | URL gambar upload (rasio ~3:1 desktop, min 1600px lebar) |
| `peek` | bool | opsional | Lizzy kecil ngintip di pojok banner gambar |

Kalau `promos` kosong, slider disembunyikan.

## GET /api/public/status

Ringan, di-poll landing tiap 60 detik.

```json
{ "titikId": "t1", "open": true, "etaMin": 5, "openUntil": "14.00",
  "lat": -6.2607, "lng": 106.8137, "updatedAt": "2026-10-20T04:30:00Z",
  "soldOut": ["latte","tehtarik"] }
```

- `open: false` = lagi nggak mangkal; `titikId`/`lat`/`lng` boleh `null`.
- `lat`/`lng` dari GPS sesi mangkal aktif, kalau nggak ada pakai koordinat titik.
- `updatedAt` ISO 8601 UTC.

## Error

Selalu JSON: `{ "success": false, "message": "..." }` dengan status HTTP yang sesuai. Landing akan pakai data terakhir yang tersimpan.
