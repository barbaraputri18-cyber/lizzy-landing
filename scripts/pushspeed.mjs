import { chromium } from 'playwright';
const b = await chromium.launch(); const out = [];
for (const [w, h, pre] of [[1920, 1080, 'x'], [1440, 900, 'd'], [390, 844, 'm']]) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.addInitScript(() => { localStorage.setItem('lz-theme', 'day'); sessionStorage.setItem('lz-intro', '1'); });
  await p.goto('http://localhost:4399/'); await p.waitForTimeout(1000);
  await p.evaluate(() => scrollTo(0, document.querySelector('#menu').getBoundingClientRect().top + scrollY - 70)); await p.waitForTimeout(1200);
  const t0 = Date.now(); await p.click('.nav.next');
  for (const t of [250, 550, 900, 1250]) { await p.waitForTimeout(Math.max(0, t - (Date.now() - t0))); await p.screenshot({ path: `shots/push-${pre}-${t}.png` }); }
  await p.waitForFunction(() => !document.querySelector('.pusher') || getComputedStyle(document.querySelector('.sitter')).opacity === '1', null, { timeout: 4000 });
  out.push([pre, 'settled~ms', Date.now() - t0]); await p.close();
}
console.log(JSON.stringify(out)); await b.close();
