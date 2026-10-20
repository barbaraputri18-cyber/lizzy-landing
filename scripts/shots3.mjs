import { chromium } from 'playwright';
const U = 'http://localhost:4399/'; const b = await chromium.launch(); const errs = [];
for (const [w, h, pre] of [[1440, 900, 'd'], [390, 844, 'm']]) for (const th of ['day', 'night']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(pre + th + ' ' + m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto(U, { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `shots/${pre}-${th}-map.png` });
  await p.evaluate(() => scrollTo(0, document.querySelector('#menu').getBoundingClientRect().top + scrollY - 60)); await p.waitForTimeout(1200);
  await p.click('.nav.next');
  for (const t of [400, 800, 1300, 2200, 3200]) { await p.waitForTimeout(t - (t === 400 ? 0 : 0)); }
  await p.close();
}
// precise mid-push sequence
for (const [w, h, pre, th] of [[390, 844, 'm', 'day'], [1440, 900, 'd', 'night']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36' })).newPage();
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto(U, { waitUntil: 'networkidle' }); await p.waitForTimeout(1200);
  await p.evaluate(() => scrollTo(0, document.querySelector('#menu').getBoundingClientRect().top + scrollY - 60)); await p.waitForTimeout(1300);
  await p.click('.nav.next'); let last = 0;
  for (const t of [500, 1000, 1500, 2600]) { await p.waitForTimeout(t - last); last = t; await p.screenshot({ path: `shots/${pre}-${th}-push-${t}.png` }); }
  await p.evaluate(() => scrollTo(0, document.querySelector('#quote').getBoundingClientRect().top + scrollY - 80)); await p.waitForTimeout(4200);
  await p.screenshot({ path: `shots/${pre}-${th}-quote.png` }); await p.close();
}
console.log('ERRORS', errs); await b.close();
