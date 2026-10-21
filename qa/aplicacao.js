// Testa o formulário de aplicação. Uso: PW=<playwright> node qa/aplicacao.js
const path = require('path');
const { chromium } = require(process.env.PW || 'playwright');
const URL = 'http://127.0.0.1:8765/aplicacao.html?utm_source=site&utm_content=teste&plano=anual';
const shot = (n) => path.resolve(__dirname, 'shots', n);
const res = [];
const ok = (n, c, x = '') => res.push(`${c ? 'PASSOU' : 'FALHOU'}  ${n}${x ? '  · ' + x : ''}`);

(async () => {
  const b = await chromium.launch();
  const errs = [];
  for (const [w, h, tag] of [[1440, 900, 'desk'], [390, 844, 'mob']]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 768 });
    const pg = await ctx.newPage();
    pg.on('pageerror', (e) => errs.push(`${tag} ${e.message}`));
    pg.on('console', (m) => m.type() === 'error' && errs.push(`${tag} ${m.text()}`));
    await pg.goto(URL); await pg.waitForTimeout(700);
    await pg.screenshot({ path: shot(`apl-${tag}-0-boasvindas.png`) });
    await pg.click('[data-start]'); await pg.waitForTimeout(900);
    const step = () => pg.evaluate(() => [...document.querySelectorAll('.q')].findIndex((q) => q.classList.contains('is-active')));
    const press = async () => { await pg.keyboard.press('Enter'); await pg.waitForTimeout(700); };

    // 1. aceite: avançar sem escolher mostra erro
    await pg.click('.q.is-active [data-ok]'); await pg.waitForTimeout(300);
    if (tag === 'desk') ok('Sem escolher, a etapa 1 mostra erro e não avança', (await step()) === 0 && await pg.isVisible('#acordo-err'));
    if (tag === 'desk') { await pg.keyboard.press('a'); } else { await pg.click('.q.is-active .choice'); }
    await pg.waitForTimeout(1000);
    if (tag === 'desk') ok('Tecla "A" escolhe a opção e avança sozinha', (await step()) === 1);
    await pg.screenshot({ path: shot(`apl-${tag}-1-nome.png`) });

    // 2. nome: exige nome e sobrenome
    await pg.keyboard.type('Maria'); await press();
    if (tag === 'desk') ok('Nome sem sobrenome é recusado com mensagem', (await step()) === 1 && (await pg.textContent('#nome-err')).includes('sobrenome'));
    await pg.keyboard.type(' Teste'); await press();
    // 3. instagram: @ automático
    await pg.keyboard.type('mariateste');
    if (tag === 'desk') ok('Instagram recebe @ automaticamente', (await pg.inputValue('#instagram')) === '@mariateste');
    await press();
    // 4. whatsapp com máscara
    await pg.keyboard.type('31999998888');
    if (tag === 'desk') ok('WhatsApp formatado como 31 99999-8888', (await pg.inputValue('#whatsapp')) === '31 99999-8888', await pg.inputValue('#whatsapp'));
    await press();
    // 5. modalidade
    await pg.click('.q.is-active .choice >> nth=1'); await pg.waitForTimeout(1000);
    await pg.screenshot({ path: shot(`apl-${tag}-6-objetivos.png`) });
    // 6–9 textos longos
    for (const t of ['Perder gordura e ganhar energia.', 'Rotina corrida e falta de constância.', 'Em 6 meses, -8 kg; em 12, manter.', 'Já fiz nutricionista uma vez.']) { await pg.keyboard.type(t); await press(); }
    // voltar e conferir que a resposta foi mantida
    if (tag === 'desk') {
      await pg.click('[data-back]'); await pg.waitForTimeout(800);
      ok('Botão voltar retorna e mantém a resposta', (await step()) === 8 && (await pg.inputValue('#historico')).includes('nutricionista'));
      await pg.click('[data-fwd]'); await pg.waitForTimeout(800);
      // recarregar mantém rascunho
      await pg.reload(); await pg.waitForTimeout(600); await pg.click('[data-start]'); await pg.waitForTimeout(1100);
      ok('Recarregar a página retoma de onde parou', (await step()) === 9, `etapa ${await step() + 1}`);
    }
    // 10 trabalho
    await pg.keyboard.type('Advogada há 5 anos'); await press();
    // 11 investimentos (múltipla)
    await pg.click('.q.is-active .choice >> nth=0'); await pg.click('.q.is-active .choice >> nth=4'); await pg.mouse.move(5, 5); await pg.waitForTimeout(500);
    await pg.screenshot({ path: shot(`apl-${tag}-11-investimentos.png`) });
    await pg.click('.q.is-active [data-ok]'); await pg.waitForTimeout(800);
    // 12 tentativas
    await pg.click('.q.is-active .choice >> nth=1'); await pg.waitForTimeout(1000);
    // 13 plano (vem marcado pelo ?plano=anual do link)
    if (tag === 'desk') ok('Plano vem pré-marcado pelo link do site', await pg.isChecked('.q.is-active input[value="Anual (12 meses)"]'));
    await pg.click('.q.is-active [data-ok]'); await pg.waitForTimeout(800);
    // 14 motivo
    await pg.keyboard.type('Quero um acompanhamento próximo.'); await press();
    // 15 consentimento LGPD: obrigatório
    await pg.screenshot({ path: shot(`apl-${tag}-15-lgpd.png`) });
    await pg.click('.q.is-active [data-ok]'); await pg.waitForTimeout(400);
    if (tag === 'desk') ok('Sem o aceite LGPD a aplicação não é enviada', await pg.isVisible('#lgpd-err') && (await step()) === 14);
    await pg.click('.q.is-active .consent-box');
    const [popup] = await Promise.all([ctx.waitForEvent('page'), pg.click('.q.is-active [data-ok]')]);
    const u = decodeURIComponent(popup.url().replace(/\+/g, ' ')); await popup.close();
    await pg.waitForTimeout(900);
    ok(`[${tag}] Envio abre o WhatsApp da atendente com as respostas`, u.includes('5531999670406') && u.includes('Planejamento Nutricional Estratégico') && u.includes('Maria Teste') && u.includes('@mariateste') && u.includes('+55 31 99999-8888') && u.includes('Medicações') && u.includes('teste') && u.includes('Anual (12 meses)') && u.includes('Consentimento LGPD: sim'), u.slice(0, 120));
    if (tag === 'desk') ok('Eventos inicio_formulario e envio_formulario registrados', await pg.evaluate(() => ['inicio_formulario', 'envio_formulario'].every((n) => window.dataLayer.some((e) => e.event === n))));
    ok(`[${tag}] Tela "Recebemos sua aplicação!" aparece`, await pg.isVisible('#t-title'));
    await pg.screenshot({ path: shot(`apl-${tag}-14-obrigado.png`) });
    ok(`[${tag}] Sem rolagem horizontal`, (await pg.evaluate(() => document.documentElement.scrollWidth - innerWidth)) === 0);
    await ctx.close();
  }
  console.log(res.join('\n'));
  console.log('\nerros de console:', errs.length ? errs : 'nenhum');
  await b.close();
})();
