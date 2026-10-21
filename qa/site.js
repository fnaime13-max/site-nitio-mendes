// Testes da landing page (v5 preto + ouro). Uso:
//   python -m http.server 8765      (na raiz do projeto)
//   PW=<pacote playwright> node qa/site.js
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const BASE = 'http://127.0.0.1:8765/';
const res = []; const errs = [];
const ok = (n, c, x = '') => res.push(`${c ? 'PASSOU' : 'FALHOU'}  ${n}${x ? '  · ' + x : ''}`);
const watch = (pg, tag) => {
  pg.on('pageerror', (e) => errs.push(`${tag} ${e.message}`));
  pg.on('console', (m) => m.type() === 'error' && !/youtube|googletagmanager|ERR_|net::/i.test(m.text()) && errs.push(`${tag} ${m.text()}`));
};
// injeta valores no config.js sem editar o arquivo
const withConfig = async (ctx, extra) => ctx.route('**/js/config.js*', async (r) => {
  const resp = await r.fetch(); const body = await resp.text();
  r.fulfill({ response: resp, body: body + `\nObject.assign(window.NM_CONFIG, ${JSON.stringify(extra)});` });
});

// contraste WCAG
const lum = (hex) => { const c = hex.match(/\w\w/g).map((h) => parseInt(h, 16) / 255).map((v) => (v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const mix = (fg, a, bg) => '#' + [0, 2, 4].map((i) => Math.round(parseInt(fg.slice(1 + i, 3 + i), 16) * a + parseInt(bg.slice(1 + i, 3 + i), 16) * (1 - a)).toString(16).padStart(2, '0')).join('');
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + .05) / (y + .05); };

(async () => {
  const b = await chromium.launch();

  // 1. Larguras: sem rolagem lateral, sem imagem quebrada, sem erro de JS
  for (const w of [360, 390, 768, 1280, 1920]) {
    const ctx = await b.newContext({ viewport: { width: w, height: w < 768 ? 800 : 960 }, isMobile: w < 768, hasTouch: w < 768 });
    const pg = await ctx.newPage(); watch(pg, String(w));
    await pg.goto(BASE, { waitUntil: 'networkidle' });
    const H = await pg.evaluate(() => document.body.scrollHeight);
    for (let y = 0; y < H; y += 700) { await pg.evaluate((y) => scrollTo(0, y), y); await pg.waitForTimeout(30); }
    await pg.waitForTimeout(500);
    const r = await pg.evaluate(() => ({
      ovf: document.documentElement.scrollWidth - innerWidth,
      broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src),
      wide: [...document.querySelectorAll('main *, footer *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(e).position !== 'fixed' && !e.closest('.rail, .tabs, .hero__media, .bens, .light, dialog, .who__media, .pains__arc, .vids--proof, .who__stripe, .about__band'); }).length,  // .about__band: enfeite cortado por .about__media
    }));
    ok(`${w}px: sem rolagem lateral e sem imagem quebrada`, r.ovf === 0 && !r.broken.length && r.wide === 0, JSON.stringify(r));
    if (w === 390) {
      await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(300);
      ok('390px: barra com WhatsApp e Aplicar sempre visível (já no topo da página)', await pg.evaluate(() => { const b = document.querySelector('[data-actbar]').getBoundingClientRect(); return b.top >= innerHeight - 90 && b.bottom <= innerHeight + 1 && !!document.querySelector('[data-actbar] a[href*="wa.me"]') && !!document.querySelector('[data-actbar] a[data-apply]'); }));
      ok('390px: título principal aparece sem rolar', await pg.evaluate(() => { const h = document.querySelector('h1').getBoundingClientRect(); return h.top >= 0 && h.top < innerHeight - 90; }));
      await pg.click('[data-burger]'); await pg.waitForTimeout(500);
      const open = await pg.evaluate(() => !document.querySelector('[data-menu]').hidden && document.querySelector('[data-burger]').getAttribute('aria-expanded') === 'true');
      await pg.keyboard.press('Escape'); await pg.waitForTimeout(500);
      ok('Menu do celular abre e fecha com Esc', open && await pg.evaluate(() => document.querySelector('[data-menu]').hidden));
    }
    await ctx.close();
  }

  // 2. Conteúdo, links, SEO e acessibilidade (desktop)
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage(); watch(pg, 'desk');
    await pg.goto(BASE, { waitUntil: 'networkidle' });
    const d = await pg.evaluate(() => {
      const ld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch (e) { return null; } });
      const faq = ld.find((x) => x && x['@type'] === 'FAQPage');
      const graph = (ld.find((x) => x && x['@graph']) || {})['@graph'] || [];
      const a = [...document.querySelectorAll('a[href]')];
      return {
        ldOk: ld.every(Boolean), ldN: ld.length,
        faqLd: faq ? faq.mainEntity.length : 0, faqHtml: document.querySelectorAll('[data-faq] details').length,
        faqSame: faq ? faq.mainEntity.every((q, i) => q.name === document.querySelectorAll('[data-faq] .qa__q')[i].textContent.trim()) : false,
        services: graph.filter((g) => g['@type'] === 'Service').length,
        biz: graph.some((g) => [].concat(g['@type']).includes('LocalBusiness') && g.address && g.address.addressLocality === 'Contagem'),
        person: graph.some((g) => g['@type'] === 'Person' && g.name === 'Nítio Mendes'),
        rating: JSON.stringify(ld).includes('AggregateRating'),
        h1: document.querySelectorAll('h1').length,
        robots: document.querySelector('meta[name=robots]').content,
        title: document.title, desc: document.querySelector('meta[name=description]').content,
        og: document.querySelector('meta[property="og:image"]').content,
        badAnchors: a.filter((x) => x.getAttribute('href').length > 1 && x.getAttribute('href').startsWith('#') && !document.querySelector(x.getAttribute('href'))).map((x) => x.getAttribute('href')),
        applyWrong: [...document.querySelectorAll('a[data-apply]')].filter((x) => !x.getAttribute('href').startsWith('https://wa.me/5531999670406?text=') || x.target !== '_blank' || !x.dataset.local).length,
        applyN: document.querySelectorAll('a[data-apply]').length,
        formLinks: a.filter((x) => x.getAttribute('href').startsWith('aplicacao.html')).length,
        blankNoRel: a.filter((x) => x.target === '_blank' && !/noopener/.test(x.rel)).length,
        waN: a.filter((x) => x.href.includes('wa.me/5531992748134')).length,
        agendeConsulta: /agende (uma )?consulta|agendar consulta/i.test(document.body.innerText),
        specs: document.querySelectorAll('.spec').length, dialogs: document.querySelectorAll('dialog.sheet').length,
        imgNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
        imgNoSize: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
        btnNoName: [...document.querySelectorAll('button, a')].filter((e) => !(e.getAttribute('aria-label') || e.textContent.trim())).length,
        sections: ['inicio', 'dores', 'resultados', 'solucao', 'diferencial', 'programa', 'beneficios', 'equipe', 'especialidades', 'local', 'planos', 'como-funciona', 'depoimentos', 'faq', 'aplicar'].filter((id) => !document.getElementById(id)),
        fab: !!document.querySelector('.wafab[href*="wa.me/5531992748134"]'),
        nameLetters: document.querySelectorAll('.hero__name .ch').length,
        disclaim: /Os resultados variam de pessoa para pessoa/.test(document.body.innerText) && /publicados com autorização/.test(document.body.innerText),
        crn: !!document.querySelector('[data-crn]'),
        prices: /R\$/.test(document.body.innerText),
        plans: [...document.querySelectorAll('[data-plan]')].map((e) => e.dataset.plan).join(','),
        noTri: !/trimestral/i.test(document.documentElement.outerHTML),
        convenio: [...document.querySelectorAll('.nohealth, .private, .foot__legal')].some((e) => /não atendemos por convênio/i.test(e.textContent)) && /^Não\./.test(document.querySelector('[data-faq] .qa__a').textContent.trim()),
        baTab: !document.querySelector('#tab-resultados').hidden,
      };
    });
    ok('JSON-LD válido (negócio local, pessoa, 12 serviços, FAQ)', d.ldOk && d.biz && d.person && d.services === 12 && d.faqLd === 12, `${d.ldN} blocos, ${d.services} serviços`);
    ok('FAQ: 12 perguntas na página iguais às do JSON-LD', d.faqHtml === 12 && d.faqSame);
    ok('AggregateRating ausente até haver dados reais do Google', !d.rating);
    ok('Um único H1, indexável, título e descrição locais', d.h1 === 1 && d.robots.startsWith('index') && /Contagem/.test(d.title) && /Contagem/.test(d.desc) && /online/i.test(d.desc), d.title);
    ok('Blocos na ordem do modelo, cada um com âncora própria', !d.sections.length, d.sections.join(','));
    ok('Botão de WhatsApp flutuante presente', d.fab);
    ok('Nome gigante "NÍTIO MENDES" dividido em letras para a abertura', d.nameLetters === 11, String(d.nameLetters));
    ok('Âncoras internas resolvem', !d.badAnchors.length, d.badAnchors.join(','));
    ok('Todos os botões Aplicar abrem o WhatsApp da atendente (sem formulário)', d.applyN >= 15 && d.applyWrong === 0 && d.formLinks === 0, `${d.applyN} botões`);
    ok('Links externos em nova aba com rel=noopener', d.blankNoRel === 0);
    ok('WhatsApp presente em vários pontos', d.waN >= 6, `${d.waN} links`);
    ok('Nenhum "agende uma consulta" como chamada', !d.agendeConsulta);
    ok('12 especialidades com painel', d.specs === 12 && d.dialogs === 12);
    ok('Imagens com alt e dimensões (CLS)', d.imgNoAlt === 0 && d.imgNoSize === 0, `sem alt: ${d.imgNoAlt}, sem dimensão: ${d.imgNoSize}`);
    ok('Botões e links com nome acessível', d.btnNoName === 0, String(d.btnNoName));
    ok('Avisos "resultados variam" e "com autorização" presentes', d.disclaim);
    ok('Campo de CRN no rodapé', d.crn);
    ok('Padrão: preços ocultos e aba de antes/depois oculta', !d.prices && !d.baTab);
    ok('Só dois planos: anual e semestral (nada de trimestral)', d.plans === 'anual,semestral' && d.noTri, d.plans);
    ok('Fica claro que não atende por convênio (planos, FAQ e rodapé)', d.convenio);
    ok('Aviso de convênio visível no topo, junto do botão principal', await pg.evaluate(() => { scrollTo(0, 0); const n = document.querySelector('#inicio .nohealth'); return !!n && /plano de saúde ou convênio/.test(n.textContent); }));
    ok('Seção de diferencial com nutricionista, personal e médico', await pg.evaluate(() => [...document.querySelectorAll('#diferencial .pro__t')].map((e) => e.textContent.trim()).join('|') === 'Nutricionistas|Personal trainer|Médicos'));

    // fontes da marca realmente carregam (página e formulário)
    const fontsOk = async (url) => { const p = await ctx.newPage(); await p.goto(BASE + url, { waitUntil: 'networkidle' }); const r = await p.evaluate(async () => { await document.fonts.ready; const t = 'Ação NÍTIO ê'; return document.fonts.check('800 40px "Barlow Condensed"', t) && document.fonts.check(getComputedStyle(document.body).fontWeight + ' 16px Montserrat', t); }); await p.close(); return r; };
    ok('Fontes Barlow Condensed e Montserrat carregam no site e no kit', await fontsOk('') && await fontsOk('identidade/'));
    // recursos locais respondem 200
    const local = await pg.evaluate(() => [...new Set([
      ...[...document.querySelectorAll('[srcset]')].flatMap((e) => e.getAttribute('srcset').split(',').map((x) => x.trim().split(' ')[0])),
      ...[...document.querySelectorAll('img[src], link[href], script[src], a[href]')].map((e) => e.getAttribute('src') || e.getAttribute('href')),
    ].filter((u) => u && !/^(https?:|mailto:|tel:|#|data:)/.test(u)).map((u) => u.split('#')[0].split('?')[0]).filter(Boolean))]);
    const bad = [];
    for (const u of local) { const r = await pg.request.get(BASE + u); if (r.status() !== 200) bad.push(`${u} ${r.status()}`); }
    for (const u of ['sitemap.xml', 'robots.txt', 'privacidade.html', 'assets/images/og-image.jpg', 'identidade/']) { const r = await pg.request.get(BASE + u); if (r.status() !== 200) bad.push(`${u} ${r.status()}`); }
    ok('Arquivos locais respondem 200', !bad.length, `${local.length} verificados ${bad.join(', ')}`);

    // contraste (tokens)
    const pairs = [['ouro #C9983A no preto', '#C9983A', '#0F0F0F'], ['ouro claro no preto', '#E8CB6F', '#0F0F0F'], ['texto 2 no preto', mix('#ffffff', .74, '#0F0F0F'), '#0F0F0F'], ['rótulo (texto 3) no grafite', mix('#ffffff', .56, '#1E1E1E'), '#1E1E1E'], ['texto no botão dourado (pior ponto)', '#111111', '#B0802C'], ['passo: texto #3d3d3d no branco', '#3d3d3d', '#ffffff'], ['eyebrow #6B4610 no claro', '#6B4610', '#ECECEC']];
    const low = pairs.map(([n, f, bg]) => [n, ratio(f, bg)]).filter(([, r]) => r < 4.5);
    ok('Contraste AA (≥ 4,5:1) nos pares de cor do site', !low.length, low.map(([n, r]) => `${n} ${r.toFixed(2)}`).join('; ') || pairs.map(([n, f, bg]) => `${n.split(' ')[0]} ${ratio(f, bg).toFixed(1)}`).join(', '));

    // foco visível
    await pg.keyboard.press('Tab'); await pg.keyboard.press('Tab');
    const focus = await pg.evaluate(() => { const e = document.activeElement; const s = getComputedStyle(e); return { tag: e.tagName, outline: s.outlineStyle, w: s.outlineWidth }; });
    ok('Foco visível em dourado ao navegar com Tab', focus.outline !== 'none' && parseFloat(focus.w) >= 2, JSON.stringify(focus));

    await pg.evaluate(() => scrollTo(0, 0)); await pg.waitForTimeout(300);
    const barTop = await pg.evaluate(() => document.querySelector('[data-actbar]').classList.contains('is-visible'));
    await pg.evaluate(() => scrollTo(0, document.querySelector('#dores').offsetTop + 200)); await pg.waitForTimeout(1200);
    ok('Computador: barra WhatsApp + Aplicar aparece no topo depois do hero', !barTop && await pg.evaluate(() => document.querySelector('[data-actbar]').classList.contains('is-visible') && Math.abs(document.querySelector('[data-actbar]').getBoundingClientRect().top) < 1));
    ok('Computador: WhatsApp flutuante visível', await pg.evaluate(() => { const r = document.querySelector('.wafab').getBoundingClientRect(); return r.width > 0 && r.bottom <= innerHeight; }));
    // especialidade por hash + Esc devolve o foco
    await pg.goto(BASE + '#especialidade-nutricao-glp1-gip-tirzepatida-semaglutida', { waitUntil: 'networkidle' }); await pg.waitForTimeout(800);
    const opened = await pg.evaluate(() => document.querySelector('dialog[open]')?.dataset.specDialog);
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(700);
    ok('Link #especialidade-<slug> abre o painel e Esc fecha', opened === 'nutricao-glp1-gip-tirzepatida-semaglutida' && await pg.evaluate(() => !document.querySelector('dialog[open]') && document.activeElement.dataset.specOpen === 'nutricao-glp1-gip-tirzepatida-semaglutida'));

    // abas com teclado
    await pg.focus('#tab-google'); await pg.keyboard.press('ArrowLeft');
    ok('Abas dos depoimentos navegam pelas setas', await pg.evaluate(() => document.activeElement.id === 'tab-mensagens' && !document.querySelector('#pan-mensagens').hidden && document.querySelector('#pan-google').hidden));

    // eventos
    await pg.evaluate(() => { document.querySelector('.hero a[data-apply]').addEventListener('click', (e) => e.preventDefault(), { once: true }); });
    await pg.click('.hero a[data-apply]');
    ok('Clique em "Aplicar" registra clique_aplicar', await pg.evaluate(() => window.dataLayer.some((e) => e.event === 'clique_aplicar' && e.local === 'hero')));
    await ctx.close();
  }

  // 3. Flags: preços, antes/depois, A/B, UTM de entrada
  {
    const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
    const pg = await ctx.newPage(); watch(pg, 'flags');
    await pg.goto(BASE + '?precos=1&antesdepois=1', { waitUntil: 'networkidle' });
    const f = await pg.evaluate(() => ({ anual: document.querySelector('[data-price="anual"]').innerText, ba: document.querySelectorAll('[data-res-rail] .ba').length, tab: !document.querySelector('#tab-resultados').hidden }));
    ok('?precos=1 mostra 12× R$ 397,00 e R$ 4.000,00 no Pix', f.anual.includes('12× R$ 397,00') && f.anual.includes('R$ 4.000,00'), f.anual.replace(/\n/g, ' '));
    ok('?antesdepois=1 liga a faixa de antes/depois e a aba Resultados', f.ba === 4 && f.tab);
    await ctx.close();

    const c2 = await b.newContext({ viewport: { width: 1440, height: 900 } });
    await withConfig(c2, { SHOW_PRICES: true, CHECKOUT_URL_ANUAL: 'https://exemplo.com/checkout-anual' });
    await c2.addInitScript(() => localStorage.setItem('nm-ab-hero', 'B'));
    const p2 = await c2.newPage(); watch(p2, 'ab');
    await p2.goto(BASE + '?utm_source=instagram&utm_medium=bio&utm_campaign=outubro', { waitUntil: 'networkidle' });
    const g = await p2.evaluate(() => ({
      h1: document.querySelector('h1').textContent, sub: document.querySelector('[data-hero-sub]').textContent, ab: window.dataLayer.find((e) => e.event === 'ab_hero'),
      co: document.querySelector('[data-checkout="anual"]'), coSem: document.querySelector('[data-checkout="semestral"]').hidden,
      href: document.querySelector('.hero a[data-apply]').getAttribute('href'),
    }));
    ok('Teste A/B: versão B troca o H1 e registra ab_hero', g.h1.startsWith('Resultado que dura') && g.sub.startsWith('Com uma equipe') && g.ab && g.ab.variante === 'B');
    ok('Checkout aparece só no plano com URL configurada', g.co && !g.co.hidden && g.coSem);
    ok('Mesmo com UTM de entrada, Aplicar vai para o WhatsApp da atendente', g.href.startsWith('https://wa.me/5531999670406?text='), g.href.slice(0, 60));
    await c2.close();
  }

  // 4. Depoimento em vídeo: carrega só no clique, modal com Esc e foco
  {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
    await withConfig(ctx, { TESTIMONIALS: [{ type: 'youtube', src: 'abc123XYZ', poster: '', ratio: '9:16', name: 'Paciente Teste', result: 'Mais energia', months: 8 }] });
    await ctx.route('**youtube-nocookie.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>player</p>' }));
    const pg = await ctx.newPage(); watch(pg, 'video');
    await pg.goto(BASE, { waitUntil: 'networkidle' });
    const before = await pg.evaluate(() => ({ tab: document.querySelector('#resultados [data-vid="0"]') ? 'true' : 'false', iframes: document.querySelectorAll('iframe').length }));
    await pg.locator('[data-vid="0"]').scrollIntoViewIfNeeded(); await pg.click('[data-vid="0"]'); await pg.waitForTimeout(400);
    const open = await pg.evaluate(() => ({ open: document.querySelector('[data-player]').open, src: document.querySelector('[data-player] iframe')?.src || '', focus: document.activeElement.hasAttribute('data-player-close'), ev: window.dataLayer.some((e) => e.event === 'play_video') }));
    // Tab percorre fechar → vídeo → fechar… sem sair do modal.
    // (Com o foco DENTRO do iframe, o Esc vai para o player do YouTube: limitação de iframes.)
    let trapped = true;
    for (let i = 0; i < 4; i++) { await pg.keyboard.press('Tab'); trapped = trapped && await pg.evaluate(() => !!document.activeElement.closest('[data-player]')); }
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
    const after = await pg.evaluate(() => ({ open: document.querySelector('[data-player]').open, iframes: document.querySelectorAll('[data-player] iframe').length, back: document.activeElement.dataset.vid === '0' }));
    ok('Vídeos ficam na seção logo depois das dores e não carregam antes do clique', before.tab === 'true' && before.iframes === 0);
    ok('Clique abre o modal com o vídeo e registra play_video', open.open && open.src.includes('abc123XYZ') && open.focus && open.ev);
    ok('Foco fica preso no modal; Esc fecha, descarrega e devolve o foco', trapped && !after.open && after.iframes === 0 && after.back);
    await ctx.close();
  }

  // 5. Cookies: nada de medição antes do aceite
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 800 }, isMobile: true });
    await withConfig(ctx, { GA4_ID: 'G-TESTE123' });
    const hits = []; await ctx.route('**googletagmanager.com/**', (r) => { hits.push(r.request().url()); r.fulfill({ status: 200, body: '' }); });
    const pg = await ctx.newPage(); watch(pg, 'cookies');
    await pg.goto(BASE, { waitUntil: 'networkidle' }); await pg.waitForTimeout(600);
    const shown = await pg.isVisible('[data-consent]');
    await pg.screenshot({ path: path.resolve(__dirname, 'shots', 'cookies-390.png') });
    await pg.click('[data-c="essential"]'); await pg.waitForTimeout(500);
    const afterRefuse = hits.length;
    await pg.reload({ waitUntil: 'networkidle' });
    const noBanner = !(await pg.isVisible('[data-consent]'));
    await pg.evaluate(() => localStorage.removeItem('nm-consent-v1')); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForTimeout(400);
    await pg.click('[data-c="all"]'); await pg.waitForTimeout(500);
    ok('Aviso de cookies aparece com GA4 configurado', shown);
    ok('"Recusar não essenciais" não carrega o Google e não volta a perguntar', afterRefuse === 0 && noBanner);
    ok('"Aceitar" carrega o GA4', hits.length > 0, hits[0] || '');
    await ctx.close();
  }

  // 6. Desempenho no celular com 4G lento simulado (Lighthouse: 1,6 Mb/s, 150 ms)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, deviceScaleFactor: 2 });
    const pg = await ctx.newPage();
    const cdp = await ctx.newCDPSession(pg);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    let bytes = 0; pg.on('response', async (r) => { try { const h = await r.allHeaders(); bytes += +(h['content-length'] || 0); } catch (e) {} });
    await pg.addInitScript(() => { window.__lcp = 0; new PerformanceObserver((l) => { const e = l.getEntries(); window.__lcp = e[e.length - 1].startTime; window.__lcpEl = e[e.length - 1].element?.tagName; }).observe({ type: 'largest-contentful-paint', buffered: true }); window.__cls = 0; window.__clsSrc = []; new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) { window.__cls += e.value; if (e.value > .01) window.__clsSrc.push(e.value.toFixed(3) + ' ' + e.sources.map((x) => x.node && (x.node.className || x.node.nodeName)).join('|')); } })).observe({ type: 'layout-shift', buffered: true }); });
    await pg.goto(BASE, { waitUntil: 'load', timeout: 60000 }); await pg.waitForTimeout(1500);
    const m = await pg.evaluate(() => ({ lcp: Math.round(window.__lcp), el: window.__lcpEl, cls: +window.__cls.toFixed(3), src: window.__clsSrc }));
    ok('LCP no celular (4G lento + CPU 4×) abaixo de 2,5 s', m.lcp < 2500, `LCP ${m.lcp} ms (${m.el}), CLS ${m.cls}, ~${Math.round(bytes / 1024)} KB até o load`);
    ok('CLS abaixo de 0,1', m.cls < .1, String(m.cls) + ' ' + m.src.join('; '));
    await ctx.close();
  }

  console.log(res.join('\n'));
  const fails = res.filter((r) => r.startsWith('FALHOU')).length;
  console.log(`\n${res.length - fails}/${res.length} passaram`);
  console.log('erros de console:', errs.length ? errs : 'nenhum');
  await b.close();
})();
