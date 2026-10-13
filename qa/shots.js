// Capturas e verificações em vários tamanhos.
// Uso: PW=<caminho do pacote playwright> node qa/shots.js [url]
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const URL = process.argv[2] || 'http://127.0.0.1:8765/';
const out = (n) => path.resolve(__dirname, 'shots', n);
require('fs').mkdirSync(path.resolve(__dirname, 'shots'), { recursive: true });

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const report = [];
  for (const w of [360, 390, 430, 768, 1024, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 820 : w < 1100 ? 1000 : 900 }, deviceScaleFactor: 1, hasTouch: w < 1024, isMobile: w < 768 });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push(`${w} pageerror ${e.message}`));
    pg.on('console', (m) => m.type() === 'error' && errs.push(`${w} console ${m.text()}`));
    pg.on('requestfailed', (r) => errs.push(`${w} reqfail ${r.url()}`));
    const t0 = Date.now();
    await pg.goto(URL);
    if (w === 1440 || w === 390) {
      await pg.waitForTimeout(700); await pg.screenshot({ path: out(`intro-a-${w}.png`) });
      if (w === 1440) { await pg.mouse.move(900, 300, { steps: 5 }); }
      await pg.waitForTimeout(800); await pg.screenshot({ path: out(`intro-b-${w}.png`) });
    }
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 9000 });
    const introMs = Date.now() - t0;
    await pg.waitForTimeout(1700);
    if (w >= 1024) { for (let i = 0; i < 12; i++) await pg.mouse.move(w * 0.2 + i * 50, 700, { steps: 2 }); await pg.waitForTimeout(400); }
    await pg.screenshot({ path: out(`hero-${w}.png`) });
    const ovf = await pg.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 600) { await pg.evaluate((y) => window.scrollTo(0, y), y); await pg.waitForTimeout(70); }
    await pg.waitForTimeout(900);
    await pg.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, 0); document.querySelectorAll('[data-reveal]').forEach((e) => e.classList.add('is-in')); });
    await pg.waitForTimeout(400);
    await pg.screenshot({ path: out(`full-${w}.png`), fullPage: true });
    const info = await pg.evaluate(() => {
      const small = [...document.querySelectorAll('a, button, input, select, summary')].filter((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        return r.width > 0 && cs.visibility !== 'hidden' && !el.closest('[hidden], dialog:not([open]), .menu, .rail') && (r.height < 40 || r.width < 40) && !el.closest('p, address');
      }).map((el) => `${el.tagName}.${el.className || ''}:${Math.round(el.getBoundingClientRect().width)}x${Math.round(el.getBoundingClientRect().height)}`);
      const emptyLinks = [...document.querySelectorAll('a')].filter((a) => !a.getAttribute('href') || a.getAttribute('href') === '#').length;
      const missing = document.querySelectorAll('.media.is-missing').length;
      const h1 = document.querySelectorAll('h1').length;
      return { small: [...new Set(small)].slice(0, 12), emptyLinks, missing, h1 };
    });
    report.push({ w, introMs, overflowX: ovf, ...info });
    await ctx.close();
  }
  console.log(JSON.stringify(report, null, 1));
  console.log('errors:', errs);
  await b.close();
})();
