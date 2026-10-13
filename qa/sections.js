// Captura cada seção na altura da tela, pulando a abertura.
// Uso: PW=<playwright> node qa/sections.js [largura...]
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const URL = 'http://127.0.0.1:8765/';
const widths = process.argv.slice(2).map(Number).filter(Boolean);
(async () => {
  const b = await chromium.launch();
  for (const w of widths.length ? widths : [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, hasTouch: w < 1024, isMobile: w < 768 });
    await ctx.addInitScript(() => { try { sessionStorage.setItem('nm-intro', '1'); } catch (e) {} });
    const pg = await ctx.newPage();
    await pg.goto(URL); await pg.waitForTimeout(1800);
    const ids = await pg.evaluate(() => [...document.querySelectorAll('main > section, body > footer')].map((s, i) => { s.dataset.qa = i; return i; }));
    for (const i of ids) {
      await pg.evaluate((i) => { document.documentElement.style.scrollBehavior = 'auto'; const s = document.querySelector(`[data-qa="${i}"]`); window.scrollTo(0, s.offsetTop - 1); }, i);
      await pg.waitForTimeout(250);
      await pg.evaluate(() => window.scrollBy(0, 1));
      await pg.waitForTimeout(1100);
      await pg.screenshot({ path: path.resolve(__dirname, 'shots', `sec-${w}-${String(i).padStart(2, '0')}.png`) });
    }
    await ctx.close();
  }
  await b.close();
})();
