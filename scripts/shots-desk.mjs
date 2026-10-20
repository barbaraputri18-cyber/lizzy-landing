import { chromium } from 'playwright';
const U = 'http://localhost:4399/'; const b = await chromium.launch(); const errs = [];
const run = async (w, h, pre) => {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text())); p.on('pageerror', (e) => errs.push('PAGE ' + e.message));
  await p.addInitScript(() => { localStorage.setItem('lz-theme', 'day'); sessionStorage.setItem('lz-intro', '1'); });
  await p.goto(U); await p.waitForTimeout(1800);
  const at = async (sel, name, wait = 1200, off = 70) => { await p.evaluate(([s, o]) => scrollTo(0, document.querySelector(s).getBoundingClientRect().top + scrollY - o), [sel, off]); await p.waitForTimeout(wait); await p.screenshot({ path: `shots/${pre}-${name}.png` }); };
  await p.screenshot({ path: `shots/${pre}-hero.png` });
  await at('#menu', 'carousel'); await at('#menu-lengkap', 'fullmenu', 1500);
  await at('#pour', 'brew1', 1300, 120); await p.waitForTimeout(1300); await p.screenshot({ path: `shots/${pre}-brew2.png` }); await p.waitForTimeout(1500); await p.screenshot({ path: `shots/${pre}-brew3.png` });
  await at('#preorder', 'preorder'); await at('#jadwal', 'jadwal', 3500);
  await p.evaluate(() => scrollTo(0, document.body.scrollHeight)); await p.waitForTimeout(1500); await p.screenshot({ path: `shots/${pre}-closing.png` });
  console.log(pre, 'height', await p.evaluate(() => document.body.scrollHeight));
};
await run(1440, 900, 'd'); await run(390, 844, 'm');
console.log('ERRORS', errs.length, errs); await b.close();
