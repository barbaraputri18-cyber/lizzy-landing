import { chromium } from 'playwright';
const b = await chromium.launch(); const errs = [];
for (const [w, h, pre] of [[1440, 900, 'd'], [390, 844, 'm']]) for (const th of ['day', 'night']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36' })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(pre + th + ' ' + m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto('http://localhost:4399/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `shots/${pre}-${th}-pt-peek.png` });
  await p.evaluate(() => scrollTo(0, document.querySelector('#menu').getBoundingClientRect().top + scrollY - 70)); await p.waitForTimeout(1300);
  await p.screenshot({ path: `shots/${pre}-${th}-pt-sit.png` });
  await p.click('.nav.next'); await p.waitForTimeout(1100); await p.screenshot({ path: `shots/${pre}-${th}-pt-walk.png` }); await p.waitForTimeout(2200);
  await p.evaluate(() => scrollTo(0, document.querySelector('#quote').getBoundingClientRect().top + scrollY - 70)); await p.waitForTimeout(1500);
  await p.screenshot({ path: `shots/${pre}-${th}-pt-jump.png` });
  await p.evaluate(() => scrollTo(0, document.querySelector('.closing').getBoundingClientRect().top + scrollY - 70)); await p.waitForTimeout(1500);
  await p.screenshot({ path: `shots/${pre}-${th}-pt-lie.png` }); await p.close();
}
console.log('ERRORS', errs); await b.close();
