// Testes funcionais das interações. Uso: PW=<playwright> node qa/interactions.js
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const URL = 'http://127.0.0.1:8765/';
const shot = (n) => path.resolve(__dirname, 'shots', n);
const results = [];
const ok = (name, cond, extra = '') => results.push(`${cond ? 'PASSOU' : 'FALHOU'}  ${name}${extra ? '  · ' + extra : ''}`);

(async () => {
  const b = await chromium.launch();
  const errs = [];
  const watch = (pg, tag) => { pg.on('pageerror', (e) => errs.push(`${tag} ${e.message}`)); pg.on('console', (m) => m.type() === 'error' && errs.push(`${tag} ${m.text()}`)); };

  // 1. Abertura: contador sobe de 0 a 100, sem regredir, e termina
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const pg = await ctx.newPage(); watch(pg, 'intro');
    await pg.goto(URL, { waitUntil: 'commit' }); await pg.waitForSelector('[data-intro-count]', { state: 'attached' });
    const seen = [];
    for (let i = 0; i < 60; i++) {
      const v = await pg.evaluate(() => { const e = document.querySelector('[data-intro-count]'); return e ? +e.getAttribute('aria-valuenow') : null; });
      if (v === null) break; seen.push(v); await pg.waitForTimeout(60);
    }
    const mono = seen.every((v, i) => i === 0 || v >= seen[i - 1]);
    ok('Contador começa em 0, termina em 100 e nunca regride', seen[0] <= 15 && seen.includes(100) && mono, `amostras: ${seen.filter((_, i) => i % 4 === 0).join(',')}`);
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 8000 });
    ok('Abertura libera a rolagem ao terminar', await pg.evaluate(() => !document.documentElement.classList.contains('is-intro')));
    // 2. Segunda navegação na mesma sessão: sem abertura
    await pg.reload();
    ok('Recarregar na mesma sessão não repete a abertura', await pg.evaluate(() => !document.querySelector('[data-intro]')));
    await ctx.close();
  }

  // 3. Pular abertura (botão e Esc)
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    const pg = await ctx.newPage(); watch(pg, 'skip');
    const t = Date.now(); await pg.goto(URL); await pg.waitForTimeout(300);
    await pg.keyboard.press('Escape');
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 4000 });
    ok('Esc pula a abertura rapidamente', Date.now() - t < 3500, `${Date.now() - t} ms`);
    await ctx.close();
  }

  // 4. Movimento reduzido: abertura curta
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage(); watch(pg, 'reduced');
    const t = Date.now(); await pg.goto(URL);
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 5000 });
    const ms = Date.now() - t;
    const heroVisible = await pg.evaluate(() => getComputedStyle(document.querySelector('.hero__title [data-hero-in]')).transform === 'none');
    ok('prefers-reduced-motion: abertura curta e conteúdo sem deslocamento', ms < 2200 && heroVisible, `${ms} ms`);
    await ctx.close();
  }

  // 5. Recurso lento: o contador espera o retrato real e o limite de 5 s funciona
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
    await ctx.route('**/nitio-retrato-*', async (r) => { await new Promise((res) => setTimeout(res, 9000)); r.continue().catch(() => {}); });
    const pg = await ctx.newPage(); watch(pg, 'slow');
    const t = Date.now(); await pg.goto(URL, { waitUntil: 'commit' });
    await pg.waitForTimeout(2600);
    const mid = await pg.evaluate(() => { const e = document.querySelector('[data-intro-count]'); return e ? +e.getAttribute('aria-valuenow') : 100; });
    await pg.waitForFunction(() => !document.querySelector('[data-intro]'), null, { timeout: 9000 });
    ok('Com retrato atrasado, contador não chega a 100 antes do tempo e o limite libera a página', mid < 100 && Date.now() - t < 7500, `valor aos 2,6 s: ${mid}; liberado em ${Date.now() - t} ms`);
    await ctx.close();
  }

  // 6. Especialidades, diálogo, filtros, teclado (desktop)
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await ctx.addInitScript(() => sessionStorage.setItem('nm-intro', '1'));
    const pg = await ctx.newPage(); watch(pg, 'desk');
    await pg.goto(URL); await pg.waitForTimeout(800);
    await pg.click('[data-filter="mulher"]');
    const vis = await pg.evaluate(() => [...document.querySelectorAll('.spec')].filter((l) => !l.classList.contains('is-hidden')).length);
    ok('Filtro "Saúde da mulher" mostra 3 especialidades', vis === 3, `${vis}`);
    ok('Filtro anuncia o resultado para leitores de tela', (await pg.textContent('[data-filter-status]')).includes('3'));
    await pg.click('[data-filter="todas"]');
    const btn = pg.locator('[data-spec-open="nutricao-glp1-gip-tirzepatida-semaglutida"]');
    await btn.focus(); await pg.keyboard.press('Enter'); await pg.waitForTimeout(800);
    const open = await pg.evaluate(() => document.querySelector('[data-spec-dialog="nutricao-glp1-gip-tirzepatida-semaglutida"]').open);
    ok('Enter abre o diálogo da especialidade', open);
    ok('Diálogo traz texto integral e CTA com tema', await pg.evaluate(() => { const d = document.querySelector('dialog[open]'); return d.querySelectorAll('.sheet__body p').length === 3 && d.querySelector('a.btn').href.includes('Mounjaro'); }));
    ok('Endereço reflete a especialidade aberta', (await pg.evaluate(() => location.hash)) === '#especialidade-nutricao-glp1-gip-tirzepatida-semaglutida');
    await pg.screenshot({ path: shot('dialog-1440.png') });
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(700);
    ok('Esc fecha o diálogo e devolve o foco ao botão', await pg.evaluate(() => !document.querySelector('dialog[open]') && document.activeElement.dataset.specOpen === 'nutricao-glp1-gip-tirzepatida-semaglutida'));

    // depoimentos por teclado
    await pg.focus('[data-reel-track]'); await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(900);
    ok('Seta para a direita avança o depoimento', (await pg.textContent('[data-reel-current]')) === '02');
    await pg.click('[data-reel-prev]'); await pg.waitForTimeout(900);
    ok('Botão anterior volta ao primeiro', (await pg.textContent('[data-reel-current]')) === '01');

    // FAQ
    await pg.click('.qa >> nth=0 >> summary'); await pg.waitForTimeout(600);
    ok('Pergunta frequente abre ao clicar', await pg.evaluate(() => document.querySelector('.qa').open));

    // mapa sob demanda
    await pg.click('[data-map-load]'); await pg.waitForTimeout(300);
    ok('Mapa só é carregado sob pedido', await pg.evaluate(() => !!document.querySelector('[data-map] iframe') && !document.querySelector('[data-map]').hidden));

    // formulário: validação e mensagem
    await pg.evaluate(() => document.getElementById('contato').scrollIntoView());
    await pg.click('[data-wa-form] button[type="submit"]');
    ok('Formulário sem nome mostra erro acessível', await pg.evaluate(() => document.getElementById('f-nome').getAttribute('aria-invalid') === 'true' && !document.getElementById('f-nome-err').hidden && document.activeElement.id === 'f-nome'));
    await pg.fill('#f-nome', 'Maria Teste');
    await pg.selectOption('#f-obj', { index: 3 });
    await pg.check('input[value="online"]');
    const [popup] = await Promise.all([ctx.waitForEvent('page'), pg.click('[data-wa-form] button[type="submit"]')]);
    const u = popup.url().replace(/\+/g, ' '); await popup.close();
    ok('Formulário abre o WhatsApp com a mensagem montada', u.includes('5531992748134') && decodeURIComponent(u).includes('Maria Teste') && decodeURIComponent(u).includes('online'), decodeURIComponent(u).slice(0, 140));

    // CTA Leadix em destaque no início
    ok('CTA do Planejamento é o primeiro link do conteúdo principal', await pg.evaluate(() => document.querySelector('main a').getAttribute('href').startsWith('aplicacao.html')));
    const leadix = await pg.evaluate(() => [...document.querySelectorAll('a[href^="aplicacao.html"]')].map((a) => a.getAttribute('href')));
    ok('Links da aplicação apontam para o formulário próprio, com origem "site"', leadix.length >= 5 && leadix.every((h) => !h.includes('fbclid') && h.includes('utm_source=site')), `${leadix.length} links`);

    // ordem de tabulação inicial
    await pg.goto(URL); await pg.waitForTimeout(500);
    const order = [];
    for (let i = 0; i < 4; i++) { await pg.keyboard.press('Tab'); order.push(await pg.evaluate(() => (document.activeElement.textContent || '').trim().slice(0, 28))); }
    ok('Tab começa por "Pular para o conteúdo"', order[0] === 'Pular para o conteúdo', order.join(' | '));
    await ctx.close();
  }

  // 7. Link antigo de especialidade abre o diálogo
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    await ctx.addInitScript(() => sessionStorage.setItem('nm-intro', '1'));
    const pg = await ctx.newPage(); watch(pg, 'hash');
    await pg.goto(URL + '#especialidade-nutricao-na-gestacao'); await pg.waitForTimeout(1200);
    ok('#especialidade-<slug> abre a especialidade correspondente', await pg.evaluate(() => { const d = document.querySelector('dialog[open]'); return !!d && d.dataset.specDialog === 'nutricao-na-gestacao'; }));
    await pg.screenshot({ path: shot('dialog-390.png') });
    await pg.click('dialog[open] .sheet__close'); await pg.waitForTimeout(700);

    // 8. Menu mobile
    await pg.mouse.wheel(0, -200); await pg.evaluate(() => window.scrollBy(0, -200)); await pg.waitForTimeout(700);
    ok('Cabeçalho volta ao rolar para cima', await pg.evaluate(() => !document.querySelector('[data-header]').classList.contains('is-hidden')));
    await pg.click('[data-menu-toggle]'); await pg.waitForTimeout(800);
    ok('Menu mobile abre com aria-expanded e foco no primeiro link', await pg.evaluate(() => document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded') === 'true' && document.activeElement.closest('.menu') !== null));
    await pg.screenshot({ path: shot('menu-390.png') });
    await pg.click('.menu__list a[href="#livros"]'); await pg.waitForTimeout(1200);
    ok('Link do menu fecha o menu e leva à seção', await pg.evaluate(() => document.querySelector('[data-menu-toggle]').getAttribute('aria-expanded') === 'false' && Math.abs(document.getElementById('livros').getBoundingClientRect().top) < 120));
    ok('Barra fixa de aplicação aparece fora do hero', await pg.evaluate(() => document.querySelector('[data-dock]').classList.contains('is-visible')));
    await ctx.close();
  }

  // 9. Sem JavaScript: conteúdo continua acessível
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false });
    const pg = await ctx.newPage();
    await pg.goto(URL); await pg.waitForTimeout(500);
    ok('Sem JavaScript, não há abertura e o título aparece', await pg.evaluate(() => getComputedStyle(document.querySelector('[data-intro]')).display === 'none' && getComputedStyle(document.querySelector('.hero__title [data-hero-in]')).opacity === '1'));
    await ctx.close();
  }

  console.log(results.join('\n'));
  console.log('\nerros de console:', errs.length ? errs : 'nenhum');
  await b.close();
})();
