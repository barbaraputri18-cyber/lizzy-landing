import { gsap } from 'gsap';
import L from 'leaflet';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CustomEase } from 'gsap/CustomEase';
gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('lzSplit', '0.37,0,0.63,1');

const data = JSON.parse(document.getElementById('landing-data').textContent);
// nomor WA dari data (brand.waNumber); kosong = pre-order belum dibuka
export const WA_NUMBER = String(data.brand?.waNumber ?? '').replace(/\D/g, '');
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const root = document.documentElement;
let map, tiles;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const rp = (n) => 'Rp ' + n.toLocaleString('id-ID');

/* ---------- theme ---------- */
function applySwaps() {
  const n = root.dataset.theme === 'night';
  $$('.swap').forEach((p) => { const img = p.querySelector('img'); const src = n ? p.dataset.night : p.dataset.day; if (img.getAttribute('src') !== src) img.src = src; });
  if (tiles) mapTheme();
  $('#themeBtn .lbl').textContent = n ? 'Mode siang' : 'Mode malam';
  document.querySelector('meta[name=theme-color]').content = n ? '#140d0a' : '#f7f1e6';
}
applySwaps();
$('#themeBtn').addEventListener('click', (e) => {
  const next = root.dataset.theme === 'night' ? 'day' : 'night';
  localStorage.setItem('lz-theme', next);
  const rv = $('#theme-reveal');
  if (RM) { root.dataset.theme = next; applySwaps(); return; }
  const r = e.currentTarget.getBoundingClientRect();
  const x = r.left + r.width / 2, y = r.top + r.height / 2;
  rv.style.background = next === 'night' ? '#140d0a' : '#f7f1e6';
  gsap.timeline()
    .fromTo(rv, { clipPath: `circle(0px at ${x}px ${y}px)` }, { clipPath: `circle(150vmax at ${x}px ${y}px)`, duration: .7, ease: 'power2.inOut' })
    .add(() => { root.dataset.theme = next; applySwaps(); })
    .to(rv, { opacity: 0, duration: .45 })
    .set(rv, { clipPath: 'circle(0 at 0 0)', opacity: 1 });
});

/* ---------- map (Leaflet + CARTO) ---------- */
// CARTO free basemaps now return 'API KEY REQUIRED' tiles, so we use OSM standard tiles and theme them with CSS filters.
// Swap TILES here if a keyed provider (CARTO/MapTiler/Stadia) is added later.
const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILES = { day: OSM, night: OSM };
const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
// Tanpa titik: peta area layanan Tangsel (tanpa pin), card 'Jadwal segera diumumkan' di atasnya.
const TANGSEL = [-6.30, 106.70];
const emptyMaps = [];
function initEmptyMap(el) {
  const m = L.map(el, { zoomControl: false, scrollWheelZoom: false, dragging: false, touchZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false, attributionControl: true, zoomSnap: .25 });
  m.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  m.setView(TANGSEL, el.clientWidth < 600 ? 11.5 : 12, { animate: false });
  const tl = L.tileLayer(TILES[root.dataset.theme === 'night' ? 'night' : 'day'], { attribution: ATTR, maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin' }).addTo(m);
  L.circle(TANGSEL, { radius: 6500, color: '#b8894a', weight: 2.5, opacity: .8, dashArray: '6 8', fillColor: '#c99a55', fillOpacity: .2, interactive: false }).addTo(m);
  emptyMaps.push(tl);
  new ResizeObserver(() => { m.invalidateSize(false); m.setView(TANGSEL, el.clientWidth < 600 ? 11.5 : 12, { animate: false }); }).observe(el);
}
function initMap() {
  $$('.map[data-empty]').forEach(initEmptyMap);
  const el = $('#map:not([data-empty])'); if (!el) return;
  const here = data.titik.find((t) => t.id === data.status?.titikId) ?? data.titik[0];
  if (!here) return;
  if (!Array.isArray(data.status?.userLatLng)) return;
  const wide = matchMedia('(min-width:960px)').matches;
  map = L.map(el, { zoomControl: wide, scrollWheelZoom: false, dragging: wide || !L.Browser.mobile, tap: false, attributionControl: true, zoomSnap: .25 });
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  const me = data.status.userLatLng;
  if (wide) map.fitBounds(L.latLngBounds([[here.lat, here.lng], me]), { paddingTopLeft: [70, 90], paddingBottomRight: [200, 150], maxZoom: 16 });
  else { map.setView([(here.lat + me[0]) / 2, (here.lng + me[1]) / 2], 14.75, { animate: false }); map.panBy([0, -30], { animate: false }); }
  tiles = L.tileLayer(TILES[root.dataset.theme === 'night' ? 'night' : 'day'], { attribution: ATTR, maxZoom: 19, referrerPolicy: 'strict-origin-when-cross-origin' }).addTo(map);
  data.titik.filter((t) => t.id !== here.id).forEach((t) => L.marker([t.lat, t.lng], { icon: L.divIcon({ className: '', html: '<div class="lz-spot"></div>', iconSize: [14, 14], iconAnchor: [7, 7] }) }).addTo(map).bindTooltip(t.name, { className: 'lz-tip', direction: 'top', offset: [0, -8] }));
  L.marker(me, { icon: L.divIcon({ className: '', html: '<div class="lz-me"></div>', iconSize: [16, 16], iconAnchor: [8, 8] }) }).addTo(map).bindTooltip('Kamu', { className: 'lz-tip', direction: 'bottom', offset: [0, 8] });
  L.polyline([me, [(me[0] + here.lat) / 2 + .0012, (me[1] + here.lng) / 2 - .001], [here.lat, here.lng]], { color: '#b8894a', weight: 3, dashArray: '6 8', lineCap: 'round', smoothFactor: 1 }).addTo(map);
  L.marker([here.lat, here.lng], { icon: L.divIcon({ className: 'lz-pin-wrap', html: '<div class="lz-pin"><span class="ring"></span><img src="img/logo.webp" alt=""></div>', iconSize: [54, 60], iconAnchor: [27, 64] }), zIndexOffset: 1000 }).addTo(map).bindTooltip(here.name, { className: 'lz-tip', direction: 'top', offset: [0, -60] });
}
function mapTheme() { const u = TILES[root.dataset.theme === 'night' ? 'night' : 'day']; if (tiles) tiles.setUrl(u); emptyMaps.forEach((t) => t.setUrl(u)); }
initMap();

/* ---------- blur-to-sharp text ---------- */
$$('.blur-in').forEach((el) => {
  const walk = (node) => [...node.childNodes].forEach((c) => {
    if (c.nodeType === 3) { const f = document.createDocumentFragment(); c.textContent.split(/(\s+)/).forEach((w) => { if (!w) return; if (/^\s+$/.test(w)) f.append(w); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = w; f.append(s); } }); c.replaceWith(f); }
    else if (c.nodeType === 1 && c.tagName !== 'BR') walk(c);
  });
  walk(el);
});
function reveals() {
  if (RM) return;
  $$('.blur-in').forEach((el) => gsap.from($$('.w', el), { filter: 'blur(12px)', opacity: 0, y: 14, duration: .9, stagger: .07, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  $$('.rv').forEach((el) => gsap.from(el, { filter: 'blur(8px)', opacity: 0, y: 18, duration: .8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } }));
  gsap.from('.peek', { x: 90, duration: 1.2, ease: 'power3.out', delay: .3 });
  $$('.fb').forEach((b, i) => gsap.to(b, { y: '-=' + (30 + i * 7), x: '+=' + (i % 2 ? 12 : -12), rotate: i % 2 ? 40 : -40, duration: 5 + i, repeat: -1, yoyo: true, ease: 'sine.inOut' }));
}

/* ---------- header logo ---------- */
gsap.from('.logo img', { opacity: 0, scale: .82, duration: RM ? 0 : .9, ease: 'power2.out', delay: .2 });

/* ---------- intro ---------- */
function intro(done) {
  const el = $('#intro');
  if (root.classList.contains('no-intro') || RM) { el.remove(); done(); return; }
  sessionStorage.setItem('lz-intro', '1');
  const ease = 'lzSplit'; // cubic-bezier(0.37,0,0.63,1)
  const tl = gsap.timeline({ onComplete: () => { el.remove(); done(); } });
  tl.from('.bean-half', { scale: .6, opacity: 0, duration: .45, ease: 'back.out(2)' })
    .from('.intro-tag', { opacity: 0, y: 8, duration: .35 }, '<.1')
    .to('.bean-half.l', { x: -18, rotate: -8, duration: .25, ease: 'power2.out' }, '+=.15')
    .to('.bean-half.r', { x: 18, rotate: 8, duration: .25, ease: 'power2.out' }, '<')
    .addLabel('split')
    .add(() => el.classList.add('splitting'), 'split')
    .to('.bean-half.l, .intro-panel.l', { xPercent: -110, x: '-=40', duration: 1.6, ease }, 'split')
    .to('.bean-half.r, .intro-panel.r', { xPercent: 110, x: '+=40', duration: 1.6, ease }, 'split')
    .to('.intro-tag, #skip', { opacity: 0, duration: .4 }, 'split');
  $('#skip').addEventListener('click', () => tl.progress(1));
}

/* ---------- carousel ---------- */
const cups = $$('.cup'), N = cups.length;
let cur = 0, busy = false, curTl = null, curStep = null, lastClick = 0;
const pos = (k) => { const d = ((k - cur) % N + N) % N; return d === 0 ? 'c' : d === 1 ? 'r' : 'l'; };
const P = { c: { x: 0, scale: 1, rotate: 0, opacity: 1, zIndex: 3, filter: 'blur(0px)' }, r: { x: 150, scale: .62, rotate: 6, opacity: .55, zIndex: 2, filter: 'blur(1.5px)' }, l: { x: -150, scale: .62, rotate: -6, opacity: .55, zIndex: 2, filter: 'blur(1.5px)' } };
const sideX = () => Math.round(Math.max(150, Math.min($('#stage').clientWidth * .27, 300)));
const placeSitter = (side = 1) => { const st = $('#stage'), sit = $('.sitter'), cw = cups[0].offsetWidth, W = st.clientWidth, sw = sit.offsetWidth; gsap.set(sit, { right: 'auto', left: side === 1 ? W / 2 + cw / 2 - sw * .25 : W / 2 - cw / 2 - sw * .75 }); };
const fitP = () => { const x = sideX(), sc = x > 200 ? .72 : .62; P.r.x = x; P.l.x = -x; P.r.scale = P.l.scale = sc; };
function layout(anim) { fitP(); placeSitter(); cups.forEach((c, k) => gsap.to(c, { ...P[pos(k)], duration: anim ? .9 : 0, ease: 'power3.inOut' })); }
function setCard() {
  const m = data.menu[cur];
  $('#dTag').textContent = m.tag; $('#dName').textContent = m.name; if ($('#dCommon')) $('#dCommon').textContent = m.namaUmum ?? ''; $('#dDesc').textContent = m.desc; $('#dPrice').textContent = rp(m.price);
  $$('.dots button').forEach((b, i) => b.classList.toggle('on', i === cur));
  $$('.mini button').forEach((b, i) => b.classList.toggle('on', i === cur));
  if (!RM) gsap.fromTo('#drinkCard > *', { opacity: 0, y: 10, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)', stagger: .05, duration: .5 });
}
function go(dir, to) {
  const now = performance.now(), rapid = now - lastClick < 380; lastClick = now;
  if (busy) {
    // fast-forward the running push to its end state so the new click is never ignored
    curTl && curTl.progress(1); curStep && curStep.kill();
    gsap.killTweensOf(cups); layout(false);
    gsap.set($('.pusher'), { opacity: 1, x: 0, scale: 1, y: 0 }); gsap.set($('.pusher img'), { y: 0, rotate: 0 });
    gsap.set($('.sitter'), { opacity: 1, y: 0, scale: 1 }); busy = false;
  }
  const next = to ?? (cur + dir + N) % N; if (next === cur) return;
  dir = to != null ? (((next - cur + N) % N) === 1 ? 1 : -1) : dir;
  busy = true;
  const incoming = cups[next];
  const sitter = $('.sitter'), pusher = $('.pusher');
  if (RM || rapid) { cur = next; layout(false); setCard(); gsap.set(sitter, { opacity: 1, y: 0, scale: 1 }); busy = false; return; }
  cur = next; setCard();
  const W = $('#stage').clientWidth; fitP();
  const S = sideX(), cw = cups[0].offsetWidth, pw = pusher.offsetWidth, start = W + 200 - pw;
  const touch = W / 2 + S + cw * P.r.scale / 2 - 24;           // pusher left edge when paws touch the side cup
  const x0 = -Math.max(0, start - (touch + 120));               // start at most ~120px beyond that cup
  const d1 = start - touch, d2 = start - (W / 2 + cw / 2 - 24);
  // pusher comes from the side the next cup is on, and pushes it to center
  const from = dir === 1 ? 1 : -1; // incoming is on the right (1) or left (-1)
  gsap.set(pusher, { scaleX: from === 1 ? -1 : 1, left: from === 1 ? 'auto' : -200, right: from === 1 ? -200 : 'auto', x: 0 });
  const img = pusher.querySelector('img');
  const step = gsap.timeline({ repeat: -1, paused: true })
    .to(img, { y: -9, rotate: from * -3, duration: .17, ease: 'sine.out' })
    .to(img, { y: 0, rotate: from * 1.5, duration: .17, ease: 'sine.in' })
    .to(img, { y: -6, rotate: from * 3, duration: .17, ease: 'sine.out' })
    .to(img, { y: 0, rotate: 0, duration: .17, ease: 'sine.in' });
  const tl = gsap.timeline({ onComplete: () => { step.kill(); gsap.set(img, { y: 0, rotate: 0 }); busy = false; } });
  curTl = tl; curStep = step;
  gsap.set(pusher, { x: from * x0, opacity: 0 });
  tl.to(sitter, { opacity: 0, y: 14, scale: .92, duration: .25 })
    .to(pusher, { opacity: 1, duration: .2 }, '<')
    .add(() => step.play(), '<')
    // walk in to the incoming (side) cup
    .to(pusher, { x: -from * d1, duration: .5, ease: 'none' }, '<')
    // push: cup and cat travel together to center
    .to(pusher, { x: -from * d2, duration: .6, ease: 'power1.inOut' })
    .add(() => cups.forEach((c, k) => gsap.to(c, { ...P[pos(k)], duration: .6, ease: 'power1.inOut', ...(c === incoming ? { keyframes: { rotate: [P[pos(k)].rotate, -from * 7, from * 2, 0], ease: 'none' } } : {}) })), '<')
    // settle: walking pose fades into sitting pose next to the cup
    .add(() => { step.pause(); gsap.to(img, { y: 0, rotate: 0, duration: .2 }); placeSitter(from); })
    .to(pusher, { opacity: 0, scale: .9, y: 6, duration: .25, ease: 'power2.in' })
    .fromTo(sitter, { opacity: 0, y: 10, scale: .9 }, { opacity: 1, y: 0, scale: 1, duration: .3, ease: 'back.out(1.8)' }, '<.05')
    .set(pusher, { opacity: 1, x: 0, scale: 1, y: 0 });
}
layout(false); setCard();
$('.next').addEventListener('click', () => go(1));
$('.prev').addEventListener('click', () => go(-1));
$$('.dots button, .mini button').forEach((b) => b.addEventListener('click', () => go(0, +b.dataset.i)));
// swipe + tilt
const stage = $('#stage');
let sx = null, sy = 0;
stage.addEventListener('pointerdown', (e) => { sx = e.clientX; sy = e.clientY; });
stage.addEventListener('pointerup', (e) => { if (sx == null) return; const dx = e.clientX - sx; if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - sy)) go(dx < 0 ? 1 : -1); sx = null; tiltReset(); });
stage.addEventListener('pointerleave', () => { sx = null; tiltReset(); });
stage.addEventListener('pointermove', (e) => {
  if (RM || busy) return;
  const r = stage.getBoundingClientRect(); const nx = (e.clientX - r.left) / r.width - .5, ny = (e.clientY - r.top) / r.height - .5;
  gsap.to(cups[cur], { rotationY: nx * 22, rotationX: -ny * 14, x: (sx != null ? (e.clientX - sx) * .25 : 0), duration: .4, ease: 'power2.out' });
  gsap.to(cups[cur].querySelector('.shadow'), { x: -nx * 18, duration: .4 });
});
const tiltReset = () => gsap.to(cups[cur], { rotationY: 0, rotationX: 0, x: 0, duration: .6, ease: 'power3.out' });
$('#pickBtn')?.addEventListener('click', () => { const r = $(`#poForm input[value="${data.menu[cur].id}"]`); r.checked = true; $('#poForm').other.value = ''; total(); });

/* ---------- brew ---------- */
function pour() {
  const sec = $('#pour'), full = $('.bcup .full'), ghost = $('.bcup .ghost'), fw = $('.fillwrap');
  const seq = [
    { img: 'cup-aren', name: 'Kopi Susu Gula Aren', stream: '#3a1e12', steps: ['Espresso diekstrak', 'Susu & gula aren dituang', 'Es masuk, siap diambil'] },
    { img: 'cup-matcha', name: 'Matcha Latte', stream: '#6f8f3e', steps: ['Matcha dikocok halus', 'Susu segar dituang', 'Es masuk, siap diambil'] },
    { img: 'cup-butterscotch', name: 'Butterscotch Latte', stream: '#9a6236', steps: ['Espresso diekstrak', 'Saus butterscotch & susu', 'Es masuk, siap diambil'] },
  ];
  const stepEls = $$('#brewSteps li');
  const setStep = (k) => stepEls.forEach((li, i) => li.classList.toggle('on', i <= k));
  if (RM) { gsap.set(fw, { clipPath: 'inset(0% 0 0 0)' }); setStep(2); return; }
  gsap.set(fw, { clipPath: 'inset(100% 0 0 0)' });
  gsap.set('.stream', { scaleY: 0, transformOrigin: '50% 0' });
  gsap.set('.drops .ice', { y: -260, opacity: 0 });
  gsap.set('.steam i', { opacity: 0 });
  let n = 0;
  const one = () => {
    const c = seq[n % seq.length]; n++;
    full.src = ghost.src = `img/${c.img}.webp`; $('#brewName').textContent = c.name;
    stepEls.forEach((li, i) => li.querySelector('span').textContent = c.steps[i]);
    $('.stream').style.setProperty('--sc', c.stream);
    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(1.4, one) });
    tl.set(fw, { clipPath: 'inset(100% 0 0 0)' }).set('.wave', { opacity: 1 }).add(() => setStep(-1))
      .fromTo('.bcup', { y: 16, rotate: -2, opacity: .0 }, { y: 0, rotate: 0, opacity: 1, duration: .5, ease: 'back.out(1.7)' })
      .add(() => setStep(0))
      .to('.stream', { scaleY: 1, duration: .35, ease: 'power2.in' })
      .to(fw, { clipPath: 'inset(58% 0 0 0)', duration: .8, ease: 'power1.inOut' }, '<.2')
      .add(() => setStep(1))
      .fromTo('.swirl', { opacity: 0, rotate: 0, scale: .6 }, { opacity: .85, rotate: 220, scale: 1.1, duration: 1.1, ease: 'sine.inOut' }, '<.3')
      .to(fw, { clipPath: 'inset(12% 0 0 0)', duration: 1, ease: 'power1.inOut' }, '<')
      .to('.stream', { scaleY: 0, transformOrigin: '50% 100%', duration: .3, ease: 'power2.out' })
      .set('.stream', { transformOrigin: '50% 0' })
      .to('.swirl', { opacity: 0, duration: .5 }, '<')
      .add(() => setStep(2))
      .to('.drops .ice', { y: 0, opacity: 1, rotate: (i) => [-18, 12, 30][i], duration: .55, ease: 'bounce.out', stagger: .12 }, '<')
      .to(fw, { clipPath: 'inset(0% 0 0 0)', duration: .5, ease: 'power2.out' }, '<.2')
      .to('.wave', { opacity: 0, duration: .3 }, '<.2')
      .to('.drops .ice', { opacity: 0, duration: .4 }, '+=.1')
      .fromTo('.steam i', { y: 10, opacity: 0, scaleY: .7 }, { y: -50, opacity: .7, scaleY: 1.2, duration: 1.4, stagger: .2, ease: 'sine.out' }, '<-.2')
      .to('.steam i', { opacity: 0, duration: .6, stagger: .2 }, '-=.6')
      .to('.bcup', { y: -6, duration: .6, yoyo: true, repeat: 1, ease: 'sine.inOut' }, '<');
  };
  ScrollTrigger.create({ trigger: sec, start: 'top 70%', once: true, onEnter: one });
}

/* ---------- full menu ---------- */
const fullSec = $('#menu-lengkap'), more = $('#miMore');
const setMore = (c) => { if (!more) return; fullSec.classList.remove('expanded'); more.setAttribute('aria-expanded', 'false'); more.hidden = !$$('.mitem.xtra').some((it) => it.dataset.c === c); more.textContent = `Lihat semua ${c.toLowerCase()}`; };
more?.addEventListener('click', () => { const on = fullSec.classList.toggle('expanded'); more.setAttribute('aria-expanded', String(on)); const c = $('#cats button.on').dataset.c; more.textContent = on ? 'Tampilkan lebih sedikit' : `Lihat semua ${c.toLowerCase()}`; if (!on) fullSec.scrollIntoView({ block: 'start', behavior: RM ? 'auto' : 'smooth' }); });
$$('#cats button').forEach((b) => b.addEventListener('click', () => {
  $$('#cats button').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', String(x === b)); });
  const items = $$('.mitem');
  items.forEach((it) => { it.hidden = it.dataset.c !== b.dataset.c; });
  setMore(b.dataset.c);
  if (!RM) gsap.fromTo(items.filter((i) => !i.hidden), { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: .04, duration: .4 });
}));
$$('.mi-add').forEach((a) => a.addEventListener('click', () => { const id = a.dataset.id; const r = $(`#poForm input[value="${id}"]`); if (r) { r.checked = true; $('#poForm').other.value = ''; } else $('#poForm').other.value = id; total(); }));
if (!RM) ScrollTrigger.batch('.mitem', { start: 'top 92%', once: true, onEnter: (els) => gsap.from(els, { opacity: 0, y: 24, filter: 'blur(6px)', stagger: .06, duration: .6, ease: 'power3.out' }) });

/* ---------- form ---------- */
const form = $('#poForm');
if (form && WA_NUMBER) {
const total = () => { const m = form.other.value ? data.menuLengkap.find((x) => x.id === form.other.value) : data.menu.find((x) => x.id === form.drink.value); const q = Math.max(1, Math.min(20, +form.qty.value || 1)); $('#total').textContent = rp(m.price * q); return { m, q }; };
form.addEventListener('change', (e) => { if (e.target.name === 'drink') form.other.value = ''; total(); });
form.qty.addEventListener('input', total);
$$('.qty button').forEach((b) => b.addEventListener('click', () => { form.qty.value = Math.max(1, Math.min(20, (+form.qty.value || 1) + +b.dataset.q)); total(); }));
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const { m, q } = total();
  const nama = form.nama.value.trim();
  if (!nama) { form.nama.focus(); form.nama.setAttribute('aria-invalid', 'true'); if (!RM) gsap.fromTo(form.nama, { x: -6 }, { x: 0, duration: .4, ease: 'elastic.out(3,.3)' }); return; }
  const titik = data.titik.find((x) => x.id === form.titik.value)?.name ?? 'Nanti dikabari via WA';
  const txt = `Halo Lizzy! Aku mau pre-order ya 🐱☕\n\nNama: ${nama}\nPesanan: ${q}x ${m.name}\nTitik ambil: ${titik}\nWaktu ambil: ${form.waktu.value}\nTotal: ${rp(m.price * q)}\n\nMakasih!`;
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(txt)}`;
  $('#ovWa').href = url;
  $('#ovSum').textContent = `${q}x ${m.name} · ${titik} · ${form.waktu.value}`;
  const ov = $('#overlay'); ov.hidden = false;
  if (!RM) gsap.timeline()
    .from('.ov-card', { y: 40, opacity: 0, scale: .95, duration: .5, ease: 'back.out(1.6)' })
    .from('.jumper', { y: 60, opacity: 0, duration: .5, ease: 'back.out(2)' }, '-=.2')
    .to('.jumper', { y: -18, duration: .45, yoyo: true, repeat: 3, ease: 'power1.inOut' })
    .from('.ov-card h3, .ov-sum, .ov-q, .ov-row', { opacity: 0, filter: 'blur(8px)', y: 10, stagger: .08, duration: .5 }, 1.0);
  window.__lastWa = url;
  if (!navigator.webdriver) window.open(url, '_blank', 'noopener');
});
}
$('#ovClose').addEventListener('click', () => { $('#overlay').hidden = true; });

/* ---------- quote typing ---------- */
function typing() {
  const el = $('#typed'), t = el.dataset.text;
  if (RM) { el.textContent = t; el.classList.add('done'); return; }
  ScrollTrigger.create({ trigger: el, start: 'top 80%', once: true, onEnter: () => {
    let i = 0; const id = setInterval(() => { el.textContent = t.slice(0, ++i); if (i >= t.length) { clearInterval(id); el.classList.add('done'); } }, 42);
  } });
  gsap.from('.lier', { x: 60, opacity: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: '.closing', start: 'top 85%', once: true } });
  gsap.from('.jumper-q', { y: 40, opacity: 0, duration: .8, ease: 'back.out(2)', scrollTrigger: { trigger: '.quote', start: 'top 85%', once: true } });
}

intro(() => { reveals(); pour(); typing(); ScrollTrigger.refresh(); });

/* ---------- reveal safety net ----------
   Konten nggak boleh nyangkut di opacity 0 (Android Chrome: fast scroll / layout geser setelah gambar & Leaflet load).
   1) refresh posisi trigger setelah semua aset load, 2) elemen yang sudah lewat/ada di layar tapi masih transparan dipaksa tampil. */
const REVEAL_SEL = '.blur-in .w, .rv, .mitem, .lier, .jumper-q, .logo img';
function unstick() {
  const vh = innerHeight;
  $$(REVEAL_SEL).forEach((el) => {
    if (el.closest('[hidden]')) return;
    const r = el.getBoundingClientRect();
    if (r.top < vh * .9 && +getComputedStyle(el).opacity < .1) {
      gsap.getTweensOf(el).forEach((t) => t.progress(1));
      gsap.set(el, { clearProps: 'opacity,filter,visibility' });
    }
  });
}
addEventListener('load', () => { ScrollTrigger.refresh(); setTimeout(unstick, 1500); });
let unstickT; addEventListener('scroll', () => { clearTimeout(unstickT); unstickT = setTimeout(unstick, 1500); }, { passive: true });
setTimeout(unstick, 4000);

addEventListener('resize', () => { if (!busy) layout(false); });
