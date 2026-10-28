/* Nítio Mendes · vendas: mês das vagas e aplicação no site (respostas → WhatsApp).
   Nada é enviado nem guardado pelo site: o botão final só abre o WhatsApp
   com a mensagem pronta. Número e vagas em js/config.js. */
(() => {
  'use strict';
  const C = window.NM_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const track = (n, d) => window.nmTrack && window.nmTrack(n, d);

  /* ---------- Mês das vagas ----------
     A partir do dia VIRA_MES_NO_DIA, o site já fala da agenda do mês seguinte.
     VAGAS_RESTANTES só aparece se for um número real informado pelo Nítio. */
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const hoje = new Date();
  const mes = meses[(hoje.getMonth() + (hoje.getDate() >= (C.VIRA_MES_NO_DIA || 20) ? 1 : 0)) % 12];
  const vagas = C.VAGAS_RESTANTES;
  $$('[data-mes]').forEach((el) => { el.textContent = mes; });
  $$('[data-vagas]').forEach((el) => {
    el.textContent = vagas ? `Restam ${vagas} ${vagas === 1 ? 'vaga' : 'vagas'} para ${mes}` : `Vagas limitadas para ${mes}`;
  });

  /* ---------- Aplicação ---------- */
  const quiz = $('#quiz');
  if (!quiz) return;
  const steps = $$('.quiz__step', quiz);
  const total = steps.length;
  const seg = $('[data-q-seg]', quiz), stepTxt = $('[data-q-step]', quiz);
  const back = $('[data-q-back]', quiz), next = $('[data-q-next]', quiz), err = $('[data-q-err]', quiz);
  const nav = $('[data-q-nav]', quiz), end = $('[data-q-end]', quiz), sum = $('[data-q-sum]', quiz), send = $('[data-q-send]', quiz);
  seg.innerHTML = '<i></i>'.repeat(total);
  const segs = $$('i', seg);
  let cur = 0, started = false;

  const progress = (n) => segs.forEach((s, i) => s.classList.toggle('on', i < n));
  const answers = (f) => (f.dataset.type === 'text' ? null : $$('input:checked', f).map((i) => i.value));

  const show = (i, focus) => {
    cur = i;
    steps.forEach((f, j) => { f.hidden = j !== i; });
    stepTxt.textContent = `Pergunta ${i + 1} de ${total}`;
    back.hidden = i === 0;
    next.firstChild.textContent = i === total - 1 ? 'Finalizar aplicação ' : 'Continuar ';
    err.textContent = '';
    progress(i);
    if (focus) { const el = $('input', steps[i]); if (el) el.focus({ preventScroll: true }); }
  };

  const valid = (i) => {
    const f = steps[i];
    if (f.dataset.type === 'text') {
      const nome = $('[name="nome"]', f);
      if (!nome.value.trim()) { err.textContent = 'Digite o seu nome para a equipe saber com quem está falando.'; nome.focus(); return false; }
      return true;
    }
    if (!answers(f).length) { err.textContent = 'Escolha pelo menos uma opção para continuar.'; return false; }
    return true;
  };

  const finish = () => {
    const nome = $('[name="nome"]', quiz).value.trim();
    const cidade = $('[name="cidade"]', quiz).value.trim();
    const rows = [];
    steps.forEach((f) => { const r = answers(f); if (r) rows.push([f.dataset.key, r.join(', ')]); });
    if (cidade) rows.push(['Cidade', cidade]);
    const msg = `Olá! Meu nome é ${nome} e acabei de fazer minha aplicação pelo site para o Planejamento Nutricional Estratégico.\n\n`
      + rows.map(([k, v]) => `• ${k}: ${v}`).join('\n')
      + `\n\nQuero garantir minha vaga para ${mes}!`;
    send.href = `https://wa.me/${C.WHATSAPP || '5531999670406'}?text=${encodeURIComponent(msg)}`;
    sum.innerHTML = '';
    rows.forEach(([k, v]) => {
      const li = document.createElement('li'), b = document.createElement('b');
      b.textContent = k; li.append(b, document.createTextNode(v)); sum.appendChild(li);
    });
    steps.forEach((f) => { f.hidden = true; });
    nav.hidden = true; end.hidden = false;
    quiz.classList.add('is-done');
    stepTxt.textContent = 'Aplicação completa';
    progress(total);
    $('[data-q-end-t]', quiz).focus({ preventScroll: true });
    track('aplicacao_concluida', { plano: (answers(steps[3]) || [''])[0] });
  };

  quiz.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!valid(cur)) return;
    if (cur < total - 1) show(cur + 1, true); else finish();
  });
  back.addEventListener('click', () => { if (cur > 0) show(cur - 1, true); });
  $('[data-q-redo]', quiz).addEventListener('click', () => {
    quiz.reset(); end.hidden = true; nav.hidden = false; quiz.classList.remove('is-done'); show(0, true);
  });
  send.addEventListener('click', () => track('envio_formulario', { origem: 'aplicacao_site' }));

  // Escolha única avança sozinha; "Ainda não" desmarca as outras opções, e vice-versa
  quiz.addEventListener('change', (e) => {
    const inp = e.target, f = inp.closest('.quiz__step');
    if (!f) return;
    err.textContent = '';
    if (!started) { started = true; track('aplicacao_inicio', {}); }
    if (inp.type === 'checkbox' && inp.checked) {
      $$('input', f).forEach((o) => { if (o !== inp && (inp.hasAttribute('data-only') || o.hasAttribute('data-only'))) o.checked = false; });
    }
    if (f.dataset.type === 'unico') setTimeout(() => { if (!f.hidden) quiz.requestSubmit(next); }, 320);
  });

  show(0, false);

  // Botões dos planos já marcam o plano escolhido (a rolagem é feita pelo site.js)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href="#aplicacao"]');
    if (!a) return;
    if (a.dataset.plano) { const r = $(`input[name="plano"][value="${a.dataset.plano}"]`, quiz); if (r) r.checked = true; }
  });
})();
