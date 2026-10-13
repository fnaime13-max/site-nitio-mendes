// Testes do layout v4 (cinematográfico). Uso: PW=<playwright> node qa/v4.js
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const URL = 'http://127.0.0.1:8765/';
const res = []; const errs = [];
const ok = (n, c, x = '') => res.push(`${c ? 'PASSOU' : 'FALHOU'}  ${n}${x ? '  · ' + x : ''}`);
const watch = (pg, tag) => { pg.on('pageerror', (e) => errs.push(`${tag} ${e.message}`)); pg.on('console', (m) => m.type() === 'error' && errs.push(`${tag} ${m.text()}`)); };

(async () => {
  const b = await chromium.launch();

  // 1. Abertura honesta e única por sessão
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage(); watch(pg, 'intro');
    await pg.goto(URL, { waitUntil: 'commit' }); await pg.waitForSelector('[data-count]', { state: 'attached' });
    const s = [];
    for (let i = 0; i < 60; i++) { const v = await pg.evaluate(() => { const e = document.querySelector('[data-count]'); return e ? +e.textContent : null; }); if (v === null) break; s.push(v); await pg.waitForTimeout(60); }
    ok('Contador vai de 0 a 100 sem regredir', s[0] <= 15 && s.includes(100) && s.every((v, i) => !i || v >= s[i - 1]), s.filter((_, i) => i % 5 === 0).join(','));
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 9000 });
    ok('Rolagem liberada após a abertura', await pg.evaluate(() => getComputedStyle(document.documentElement).overflow !== 'hidden'));
    await pg.waitForTimeout(1600);
    ok('Nome e palavras do hero aparecem', await pg.evaluate(() => [...document.querySelectorAll('.hero__roles .lni, .hero__name .ch')].every((e) => getComputedStyle(e).opacity === '1')));
    await pg.reload(); await pg.waitForTimeout(400);
    ok('Recarregar não repete a abertura', await pg.evaluate(() => !document.querySelector('[data-intro]') || getComputedStyle(document.querySelector('[data-intro]')).display === 'none'));
    await ctx.close();
  }
  // 2. Recurso lento: não finge 100% e libera a página
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.route('**/nitio-recorte.*', async (r) => { await new Promise((x) => setTimeout(x, 9000)); r.continue().catch(() => {}); });
    const pg = await ctx.newPage(); watch(pg, 'lento');
    const t = Date.now(); await pg.goto(URL, { waitUntil: 'commit' }); await pg.waitForTimeout(2600);
    const mid = await pg.evaluate(() => { const e = document.querySelector('[data-count]'); return e ? +e.textContent : 100; });
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 9000 });
    ok('Com o retrato atrasado, o contador não marca 100 e a página é liberada', mid < 100 && Date.now() - t < 7000, `aos 2,6 s: ${mid}; liberado em ${Date.now() - t} ms`);
    await ctx.close();
  }
  // 3. Larguras, overflow e imagens
  for (const w of [360, 390, 430, 768, 1024, 1280, 1440]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 844 : 900 }, isMobile: w < 768, hasTouch: w < 768 });
    await ctx.addInitScript(() => sessionStorage.setItem('nm-intro', '1'));
    const pg = await ctx.newPage(); watch(pg, String(w));
    await pg.goto(URL); await pg.waitForTimeout(800);
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 700) { await pg.evaluate((y) => scrollTo(0, y), y); await pg.waitForTimeout(40); }
    await pg.waitForTimeout(600);
    const r = await pg.evaluate(() => ({ ovf: document.documentElement.scrollWidth - innerWidth, miss: document.querySelectorAll('.liquid.is-missing').length, broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).length }));
    ok(`${w}px: sem rolagem lateral e sem imagem quebrada`, r.ovf === 0 && r.miss === 0 && r.broken === 0, JSON.stringify(r));
    await ctx.close();
  }
  // 4. Interações (desktop)
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => sessionStorage.setItem('nm-intro', '1'));
    const pg = await ctx.newPage(); watch(pg, 'desk');
    await pg.goto(URL); await pg.waitForTimeout(900);
    const btn = pg.locator('[data-spec-open="nutricao-glp1-gip-tirzepatida-semaglutida"]');
    await btn.scrollIntoViewIfNeeded(); await btn.focus(); await pg.keyboard.press('Enter'); await pg.waitForTimeout(800);
    ok('Especialidade abre o painel com o texto integral', await pg.evaluate(() => { const d = document.querySelector('dialog[open]'); return !!d && d.querySelectorAll('.sheet__body p').length === 3; }));
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(600);
    ok('Esc fecha o painel e devolve o foco', await pg.evaluate(() => !document.querySelector('dialog[open]') && document.activeElement.dataset.specOpen === 'nutricao-glp1-gip-tirzepatida-semaglutida'));
    await pg.locator('[data-voice] >> nth=2').scrollIntoViewIfNeeded(); await pg.click('[data-voice] >> nth=2'); await pg.waitForTimeout(900);
    ok('Trocar depoimento troca a citação, o nome e as iniciais', await pg.evaluate(() => document.querySelector('[data-quote-text]').textContent.includes('acompanhamento diário') && document.querySelector('[data-who]').textContent.startsWith('Dr. Ewandro') && document.querySelector('[data-mark] span').textContent === 'DE'));
    ok('Citação mantém o texto integral do Google', await pg.evaluate(() => document.querySelector('[data-quote-text]').textContent.includes('a cada 15 dias é como avançar de fase')));
    await pg.locator('.hero__plan').scrollIntoViewIfNeeded().catch(() => {});
    const links = await pg.evaluate(() => [...document.querySelectorAll('a[href^="aplicacao.html"]')].length);
    ok('Chamadas para o Planejamento apontam para o formulário próprio', links >= 5, `${links} links`);
    await pg.goto(URL + '#especialidade-nutricao-na-gestacao'); await pg.waitForTimeout(900);
    ok('Link antigo #especialidade-<slug> abre a especialidade', await pg.evaluate(() => document.querySelector('dialog[open]')?.dataset.specDialog === 'nutricao-na-gestacao'));
    await ctx.close();
  }
  // 5. Menu mobile
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => sessionStorage.setItem('nm-intro', '1'));
    const pg = await ctx.newPage(); watch(pg, 'mob');
    await pg.goto(URL); await pg.waitForTimeout(800);
    await pg.click('[data-burger]'); await pg.waitForTimeout(700);
    ok('Menu mobile abre', await pg.evaluate(() => document.querySelector('[data-menu]').classList.contains('is-open') && document.querySelector('[data-burger]').getAttribute('aria-expanded') === 'true'));
    await pg.screenshot({ path: path.resolve(__dirname, 'shots', 'v4-menu-390.png') });
    await pg.click('[data-menu] a[href="#depoimentos"]'); await pg.waitForTimeout(1600);
    ok('Link do menu fecha e leva à seção', await pg.evaluate(() => !document.querySelector('[data-menu]').classList.contains('is-open') && Math.abs(document.getElementById('depoimentos').getBoundingClientRect().top) < 140));
    ok('Barra fixa do Planejamento aparece no celular', await pg.evaluate(() => document.querySelector('[data-dock]').classList.contains('is-visible')));
    await ctx.close();
  }
  // 6. Movimento reduzido e sem JavaScript
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage(); watch(pg, 'reduzido');
    await pg.goto(URL); await pg.waitForTimeout(500);
    ok('prefers-reduced-motion: sem abertura, texto visível', await pg.evaluate(() => getComputedStyle(document.querySelector('[data-intro]') || document.body).display === 'none' || !document.querySelector('[data-intro]')) && await pg.evaluate(() => getComputedStyle(document.querySelector('.hero__name .ch')).opacity === '1'));
    await ctx.close();
    const c2 = await b.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
    const p2 = await c2.newPage(); await p2.goto(URL); await p2.waitForTimeout(400);
    ok('Sem JavaScript: sem abertura e conteúdo visível', await p2.evaluate(() => getComputedStyle(document.querySelector('[data-intro]')).display === 'none' && getComputedStyle(document.querySelector('.story__lead')).opacity === '1'));
    await c2.close();
  }
  console.log(res.join('\n')); console.log('\nerros de console:', errs.length ? errs : 'nenhum');
  await b.close();
})();
