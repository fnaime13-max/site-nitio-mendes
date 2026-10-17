// Captura cada seção (e o hero) em várias larguras para revisão visual.
// Uso: PW=<playwright> node qa/sections.js [largura...] [--q=precos=1]
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const args = process.argv.slice(2);
const q = (args.find((a) => a.startsWith('--q=')) || '').slice(4);
const URL = 'http://127.0.0.1:8765/' + (q ? '?' + q : '');
const widths = args.map(Number).filter(Boolean);
(async () => {
  const b = await chromium.launch();
  for (const w of widths.length ? widths : [1440, 390]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, hasTouch: w < 1024, isMobile: w < 768, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => console.log('ERRO', e.message));
    await pg.goto(URL, { waitUntil: 'networkidle' }); await pg.waitForTimeout(600);
    const ids = await pg.evaluate(() => [...document.querySelectorAll('main > section, body > footer')].map((s) => s.id || s.className.split(' ')[0]));
    for (const [i, id] of ids.entries()) {
      const el = pg.locator('main > section, body > footer').nth(i);
      await el.evaluate((s) => s.querySelectorAll('.rv').forEach((r) => r.classList.add('in')));
      await el.screenshot({ path: path.resolve(__dirname, 'shots', `sec-${w}-${String(i).padStart(2, '0')}-${id}${q ? '-' + q.replace(/\W/g, '') : ''}.png`) });
    }
    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(300);
    await pg.screenshot({ path: path.resolve(__dirname, 'shots', `fold-${w}.png`) });
    await ctx.close();
  }
  await b.close();
})();
