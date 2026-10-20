import { chromium } from 'playwright';
const b = await chromium.launch(); const errs = [];
for (const [w, h, pre, th] of [[1440, 900, 'd', 'day'], [1920, 1080, 'x', 'night'], [390, 844, 'm', 'day'], [390, 844, 'm', 'night'], [1440, 900, 'd', 'night'], [1920, 1080, 'x', 'day']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto('http://localhost:4399/'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `shots/card-${pre}-${th}-first.png` });
  await p.evaluate(() => scrollTo(0, document.querySelector('#promo').getBoundingClientRect().top + scrollY - 70));
  for (let s = 0; s < 4; s++) { if (s) await p.click('#promo [data-next]'); await p.waitForTimeout(800); await p.screenshot({ path: `shots/card-${pre}-${th}-s${s + 1}-800.png` }); await p.waitForTimeout(1800); await p.screenshot({ path: `shots/card-${pre}-${th}-s${s + 1}-2600.png` }); }
  console.log(pre, th, JSON.stringify(await p.evaluate(() => ({ h: document.querySelector('#promo').offsetHeight, hs: document.documentElement.scrollWidth - innerWidth }))));
  await p.close();
}
console.log('ERRORS', errs); await b.close();
