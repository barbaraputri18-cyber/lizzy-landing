import { chromium } from 'playwright';
const b = await chromium.launch(); const errs = [];
for (const [w, h, pre, th] of [[1440, 900, 'd', 'day'], [390, 844, 'm', 'night']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto('http://localhost:4399/'); await p.waitForTimeout(800);
  await p.evaluate(() => scrollTo(0, document.querySelector('#promo').getBoundingClientRect().top + scrollY - 60));
  for (let s = 0; s < 4; s++) {
    if (s) await p.click('#promo [data-next]');
    let last = 0;
    for (const t of [300, 900, 1600, 2400, 3400]) { await p.waitForTimeout(t - last); last = t; await p.screenshot({ path: `shots/promo-${pre}-${th}-s${s + 1}-${t}.png` }); }
  }
  // replay check: scroll away and back
  await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(600);
  await p.evaluate(() => scrollTo(0, document.querySelector('#promo').getBoundingClientRect().top + scrollY - 60)); await p.waitForTimeout(500);
  await p.screenshot({ path: `shots/promo-${pre}-${th}-replay-500.png` });
  await p.close();
}
console.log('ERRORS', errs); await b.close();
