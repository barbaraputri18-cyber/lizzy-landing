import { chromium } from 'playwright';
const b = await chromium.launch(); const errs = [];
for (const [w, h, pre] of [[1920, 1080, 'x'], [1440, 900, 'd'], [390, 844, 'm']]) for (const th of ['day', 'night']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36' })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto('http://localhost:4399/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1800);
  await p.screenshot({ path: `shots/hero2-${pre}-${th}.png` });
  console.log(pre, th, await p.evaluate(() => ({ zoom: window.__z, hero: document.querySelector('#hero').offsetHeight, hs: document.documentElement.scrollWidth - innerWidth })));
  await p.close();
}
console.log('ERRORS', errs); await b.close();
