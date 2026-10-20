import { chromium } from 'playwright';
const b = await chromium.launch(); const errs = [];
for (const [w, h, pre] of [[1920, 1080, 'x'], [1440, 900, 'd'], [390, 844, 'm']]) for (const th of ['day', 'night']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36' })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(pre + th + ' ' + m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript((t) => { localStorage.setItem('lz-theme', t); sessionStorage.setItem('lz-intro', '1'); }, th);
  await p.goto('http://localhost:4399/', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `shots/slim-${pre}-${th}-first.png` });
  await p.evaluate(() => scrollTo(0, document.querySelector('#promo').getBoundingClientRect().top + scrollY - 70));
  let last = 0; for (const t of [400, 1500, 2800]) { await p.waitForTimeout(t - last); last = t; await p.screenshot({ path: `shots/slim-${pre}-${th}-promo-${t}.png` }); }
  await p.click('#promo [data-next]'); await p.waitForTimeout(1200); await p.screenshot({ path: `shots/slim-${pre}-${th}-promo-s2.png` });
  await p.click('#promo [data-next]'); await p.waitForTimeout(500); await p.screenshot({ path: `shots/slim-${pre}-${th}-promo-s3-500.png` }); await p.waitForTimeout(1500); await p.screenshot({ path: `shots/slim-${pre}-${th}-promo-s3-2000.png` });
  console.log(pre, th, await p.evaluate(() => ({ promoH: document.querySelector('#promo').offsetHeight, hs: document.documentElement.scrollWidth - innerWidth, over: [...document.querySelectorAll('#promo .ps-copy')].filter(e => e.scrollHeight > e.clientHeight + 2 || e.getBoundingClientRect().bottom > document.querySelector('#promo').getBoundingClientRect().bottom).length })));
  await p.close();
}
console.log('ERRORS', errs); await b.close();
