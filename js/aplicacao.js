/* Aplicação · Planejamento Nutricional Estratégico
   Recria as 13 perguntas do formulário da Leadix com a estética do site.

   ENVIO DAS RESPOSTAS
   - CONFIG.endpoint vazio: abre o WhatsApp do Nítio com todas as respostas.
   - CONFIG.endpoint preenchido (webhook da Leadix, Zapier, Make…): envia um
     JSON por POST. Se o envio falhar, cai no WhatsApp para não perder o lead.
*/
(() => {
  'use strict';

  const CONFIG = {
    endpoint: '',                 // ex.: 'https://hooks.zapier.com/hooks/catch/…'
    whatsapp: '5531992748134',
    draftKey: 'nm-aplicacao',
  };

  const Q = [
    { id: 'acordo', type: 'choice', required: true,
      title: 'Você está de acordo com isso?',
      lead: [
        'Você será selecionado através desse formulário para o <strong>Planejamento Nutricional Estratégico</strong>, buscando identificar os principais motivos que estão te impedindo de evoluir.',
        'Além disso, já iremos traçar um plano de ação para seu objetivo.',
        '<strong>Importante:</strong> a aplicação não garante que será aceito. Vamos avaliar cuidadosamente cada aplicação e entraremos em contato com os aprovados para realizarmos a Pré-Consulta, que dura em média 45 a 60 minutos.',
      ],
      options: ['Sim, estou de acordo.'] },
    { id: 'nome', type: 'text', required: true, title: 'Qual o seu nome completo?', placeholder: 'Seu nome completo', autocomplete: 'name' },
    { id: 'instagram', type: 'instagram', required: true, title: 'Qual é o @ do seu Instagram?', placeholder: '@seuperfil' },
    { id: 'whatsapp', type: 'phone', required: true, title: 'Qual é o seu WhatsApp?', placeholder: '31 99999-9999' },
    { id: 'modalidade', type: 'choice', required: true,
      title: 'Você deseja ser atendido(a) de forma presencial ou online?',
      note: 'Observação: atendo presencialmente na cidade de Contagem-MG, no bairro Novo Eldorado.',
      options: ['Atendimento Presencial', 'Atendimento Online'] },
    { id: 'objetivos', type: 'long', required: true,
      title: 'Quais são os seus principais objetivos?',
      note: 'O que você deseja alcançar em termos de saúde, forma física e desempenho? Descreva de forma clara para que possamos entender melhor sua meta.' },
    { id: 'desafios', type: 'long', required: true, title: 'Quais são os maiores desafios que você tem enfrentado para alcançar esses objetivos?' },
    { id: 'metas', type: 'long', required: true,
      title: 'Em 6 e 12 meses, qual é o corpo e resultado que você quer alcançar?',
      note: 'Explique suas metas da forma mais detalhada possível.' },
    { id: 'historico', type: 'long', required: true,
      title: 'Você já teve algum tipo de acompanhamento profissional antes?',
      note: 'Se sim, como foi a experiência? (Médico, nutricionista, personal trainer etc.)' },
    { id: 'trabalho', type: 'text', required: true, title: 'Com o que você trabalha? E há quanto tempo atua neste trabalho?', placeholder: 'Sua resposta…' },
    { id: 'investimentos', type: 'multi', required: false,
      title: 'Que investimentos anteriores você já fez para conquistar o corpo e a saúde que deseja?',
      note: 'Selecione todos que se aplicam.',
      options: [
        'Uso de suplementos (whey, creatina, ômega-3, pré-treino).',
        'Consulta com nutricionista e/ou consultoria online de treinos.',
        'Personal presencial, de 2 a 5x na semana.',
        'Acompanhamento médico (endocrinologista, nutrólogo ou outro).',
        'Medicações (como Ozempic e Mounjaro).',
        'Cirurgias e procedimentos estéticos.',
      ] },
    { id: 'tentativas', type: 'choice', required: true,
      title: 'Quantas vezes você já tentou alcançar seus objetivos e não conseguiu?',
      options: ['Uma vez', 'Duas a quatro vezes', 'Mais de quatro vezes'] },
    { id: 'motivo', type: 'long', required: true,
      title: 'Por que você considera que fazer parte do nosso time é a oportunidade ideal neste momento?',
      note: 'Como você acha que nosso acompanhamento pode ajudar a transformar seus resultados?' },
  ];

  const COUNTRIES = [['Brasil', '55'], ['Portugal', '351'], ['Estados Unidos', '1'], ['Canadá', '1'], ['Reino Unido', '44'], ['Alemanha', '49'], ['Espanha', '34'], ['Austrália', '61'], ['Chile', '56'], ['Outro país', '']];

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const LETTERS = 'ABCDEFGH';

  const flow = $('[data-flow]');
  const stepsEl = $('[data-steps]');
  const live = $('[data-live]');
  const bar = $('[data-progress]');
  const countCur = $('[data-count-current]');
  $('[data-count-total]').textContent = String(Q.length).padStart(2, '0');

  // origem do lead (UTM) — preservada para o envio
  const params = new URLSearchParams(location.search);
  const origem = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'].reduce((o, k) => { if (params.get(k)) o[k] = params.get(k); return o; }, {});

  // rascunho salvo na sessão (sobrevive a recarregar a página)
  let answers = {};
  try { answers = JSON.parse(sessionStorage.getItem(CONFIG.draftKey) || '{}'); } catch (e) { answers = {}; }
  const save = () => { try { sessionStorage.setItem(CONFIG.draftKey, JSON.stringify(answers)); } catch (e) {} };

  /* ---------- Montagem das etapas ---------- */
  const render = (q, i) => {
    const n = String(i + 1).padStart(2, '0');
    const lead = q.lead ? `<div class="q__lead">${q.lead.map((p) => `<p>${p}</p>`).join('')}</div>` : '';
    const note = q.note ? `<p class="q__note" id="${q.id}-note">${esc(q.note)}</p>` : '';
    const err = `<p class="q__err" id="${q.id}-err" role="alert" hidden></p>`;
    const desc = [q.note ? `${q.id}-note` : '', `${q.id}-err`].filter(Boolean).join(' ');
    let field = '';
    if (q.type === 'text' || q.type === 'instagram') {
      field = `<input class="q__input" id="${q.id}" name="${q.id}" type="text" placeholder="${esc(q.placeholder || '')}" ${q.autocomplete ? `autocomplete="${q.autocomplete}"` : ''} ${q.type === 'instagram' ? 'autocapitalize="off" spellcheck="false"' : ''} aria-describedby="${desc}" ${q.required ? 'aria-required="true"' : ''}>`;
    } else if (q.type === 'phone') {
      field = `<div class="q__phone">
          <label class="visually-hidden" for="${q.id}-ddi">País</label>
          <select class="q__ddi" id="${q.id}-ddi" name="${q.id}-ddi">${COUNTRIES.map(([c, d]) => `<option value="${d}">${c}${d ? ' +' + d : ''}</option>`).join('')}</select>
          <input class="q__input" id="${q.id}" name="${q.id}" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="${esc(q.placeholder)}" aria-describedby="${desc}" aria-required="true">
        </div>`;
    } else if (q.type === 'long') {
      field = `<textarea class="q__input q__input--long" id="${q.id}" name="${q.id}" rows="3" placeholder="Sua resposta…" aria-describedby="${desc}" aria-required="true"></textarea>
        <p class="q__hint q__hint--long"><kbd>Shift</kbd> + <kbd>Enter</kbd> para quebrar a linha</p>`;
    } else {
      const multi = q.type === 'multi';
      field = `<div class="q__choices" role="${multi ? 'group' : 'radiogroup'}" aria-labelledby="${q.id}-t" aria-describedby="${desc}">
        ${q.options.map((o, k) => `<label class="choice">
            <input type="${multi ? 'checkbox' : 'radio'}" name="${q.id}" value="${esc(o)}">
            <span class="choice__key" aria-hidden="true">${LETTERS[k]}</span>
            <span class="choice__txt">${esc(o)}</span>
            <span class="choice__check" aria-hidden="true"></span>
          </label>`).join('')}
      </div>`;
    }
    const last = i === Q.length - 1;
    return `<fieldset class="q" data-q="${i}" aria-labelledby="${q.id}-t">
      <legend class="visually-hidden">Pergunta ${i + 1} de ${Q.length}</legend>
      <p class="q__n"><span>${n}</span><svg class="i" aria-hidden="true" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></p>
      ${lead}
      <h2 class="q__t" id="${q.id}-t">${esc(q.title)}${q.required ? '' : ' <span class="q__opt">(opcional)</span>'}</h2>
      ${note}
      ${field}
      ${err}
      <div class="q__actions">
        <button type="${last ? 'submit' : 'button'}" class="btn btn--light ${last ? 'btn--big' : ''}" data-ok>${last ? 'Enviar aplicação' : 'OK'} <svg class="i" aria-hidden="true" viewBox="0 0 24 24">${last ? '<path d="M5 12h14M13 6l6 6-6 6"/>' : '<path d="M5 12.5l4.5 4.5L19 7.5"/>'}</svg></button>
        <p class="q__hint">pressione <kbd>Enter ↵</kbd></p>
      </div>
    </fieldset>`;
  };
  stepsEl.innerHTML = Q.map(render).join('');
  const qs = $$('.q', stepsEl);

  // restaura o rascunho
  Q.forEach((q) => {
    const v = answers[q.id];
    if (v == null) return;
    if (q.type === 'choice') $$(`input[name="${q.id}"]`).forEach((r) => { r.checked = r.value === v; });
    else if (q.type === 'multi') $$(`input[name="${q.id}"]`).forEach((c) => { c.checked = Array.isArray(v) && v.includes(c.value); });
    else if (q.type === 'phone') { $(`#${q.id}`).value = v.numero || ''; $(`#${q.id}-ddi`).value = v.ddi ?? '55'; }
    else $(`#${q.id}`).value = v;
  });

  /* ---------- Leitura, validação e máscaras ---------- */
  const read = (q) => {
    if (q.type === 'choice') { const r = $(`input[name="${q.id}"]:checked`); return r ? r.value : ''; }
    if (q.type === 'multi') return $$(`input[name="${q.id}"]:checked`).map((c) => c.value);
    if (q.type === 'phone') return { ddi: $(`#${q.id}-ddi`).value, numero: $(`#${q.id}`).value.trim() };
    return $(`#${q.id}`).value.trim();
  };
  const validate = (q, v) => {
    if (!q.required) return '';
    if (q.type === 'choice') return v ? '' : 'Selecione uma opção para continuar.';
    if (q.type === 'phone') {
      const d = v.numero.replace(/\D/g, '');
      if (!d) return 'Informe seu WhatsApp para continuar.';
      if (v.ddi === '55' && (d.length < 10 || d.length > 11)) return 'Confira o número: DDD + número, por exemplo 31 99999-9999.';
      if (d.length < 6) return 'Confira o número informado.';
      return '';
    }
    if (q.id === 'nome') return v.split(/\s+/).filter(Boolean).length >= 2 ? '' : 'Informe seu nome e sobrenome.';
    if (q.type === 'instagram') return v.replace('@', '').length >= 2 ? '' : 'Informe o @ do seu Instagram.';
    if (q.type === 'long') return v.length >= 3 ? '' : 'Escreva sua resposta para continuar.';
    return v ? '' : 'Responda para continuar.';
  };
  const showErr = (q, msg) => {
    const e = $(`#${q.id}-err`);
    e.textContent = msg; e.hidden = !msg;
    const input = $(`#${q.id}`);
    if (input) input.setAttribute('aria-invalid', String(!!msg));
  };

  // máscara simples para telefone brasileiro
  const phone = $('#whatsapp');
  phone.addEventListener('input', () => {
    if ($('#whatsapp-ddi').value !== '55') return;
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    phone.value = d.length > 2 ? `${d.slice(0, 2)} ${d.length > 7 ? d.slice(2, d.length - 4) + '-' + d.slice(-4) : d.slice(2)}` : d;
  });
  // @ automático no Instagram
  const ig = $('#instagram');
  ig.addEventListener('input', () => { const v = ig.value.replace(/\s/g, ''); ig.value = v && !v.startsWith('@') ? '@' + v : v; });

  /* ---------- Navegação entre etapas ---------- */
  let cur = -1;
  const setProgress = () => {
    const done = Math.max(0, cur) / Q.length;
    bar.style.transform = `scaleX(${done})`;
    countCur.textContent = String(Math.max(0, cur + 1)).padStart(2, '0');
  };
  const focusStep = (el) => {
    const target = $('input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea', el) || $('input:checked', el) || $('input', el);
    if (target) target.focus({ preventScroll: true });
  };
  const go = (to, dir = 1) => {
    if (to < 0 || to >= Q.length) return;
    const prev = qs[cur];
    const next = qs[to];
    if (prev) {
      prev.classList.remove('is-active');
      prev.classList.add(dir > 0 ? 'is-leaving-up' : 'is-leaving-down');
      setTimeout(() => { prev.classList.remove('is-leaving-up', 'is-leaving-down'); prev.hidden = true; }, reduced ? 0 : 450);
    }
    next.hidden = false;
    next.classList.add(dir > 0 ? 'from-down' : 'from-up');
    requestAnimationFrame(() => requestAnimationFrame(() => { next.classList.remove('from-down', 'from-up'); next.classList.add('is-active'); }));
    cur = to;
    setProgress();
    $('[data-back]').disabled = cur === 0;
    live.textContent = `Pergunta ${cur + 1} de ${Q.length}`;
    setTimeout(() => focusStep(next), reduced ? 0 : 380);
    window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
  };
  const advance = () => {
    const q = Q[cur];
    const v = read(q);
    const msg = validate(q, v);
    showErr(q, msg);
    if (msg) { qs[cur].classList.remove('shake'); void qs[cur].offsetWidth; qs[cur].classList.add('shake'); focusStep(qs[cur]); return; }
    answers[q.id] = v; save();
    if (cur < Q.length - 1) go(cur + 1, 1); else submit();
  };

  qs.forEach((el, i) => {
    el.hidden = true;
    $('[data-ok]', el).addEventListener('click', (e) => { e.preventDefault(); advance(); });
    // escolha única avança sozinha, como no formulário original com OK
    $$('input[type=radio]', el).forEach((r) => r.addEventListener('change', () => {
      showErr(Q[i], '');
      answers[Q[i].id] = r.value; save();
      setTimeout(() => { if (cur === i) advance(); }, reduced ? 0 : 380);
    }));
    $$('input[type=checkbox]', el).forEach((c) => c.addEventListener('change', () => { answers[Q[i].id] = read(Q[i]); save(); }));
    $$('input[type=text], input[type=tel], textarea', el).forEach((t) => t.addEventListener('input', () => { if ($(`#${Q[i].id}-err`).textContent) showErr(Q[i], ''); }));
  });

  // teclado: Enter avança; letras escolhem opções
  flow.addEventListener('keydown', (e) => {
    if (cur < 0) return;
    const step = qs[cur];
    if (e.key === 'Enter' && !(e.target.tagName === 'TEXTAREA' && e.shiftKey) && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') { e.preventDefault(); advance(); return; }
    if (e.target.tagName === 'INPUT' && /text|tel/.test(e.target.type)) return;
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    const k = LETTERS.indexOf(e.key.toUpperCase());
    const opts = $$('.choice input', step);
    if (k >= 0 && opts[k] && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); opts[k].click(); opts[k].focus(); }
  });
  $('[data-back]').addEventListener('click', () => go(cur - 1, -1));
  $('[data-fwd]').addEventListener('click', advance);
  flow.addEventListener('submit', (e) => { e.preventDefault(); advance(); });

  /* ---------- Início ---------- */
  const welcome = $('[data-screen="welcome"]');
  $('[data-start]').addEventListener('click', () => {
    welcome.classList.remove('is-active');
    welcome.classList.add('is-leaving-up');
    setTimeout(() => {
      welcome.hidden = true;
      flow.hidden = false;
      document.body.classList.add('is-flow');
      // retoma na primeira pergunta ainda sem resposta
      const firstOpen = Q.findIndex((q) => validate(q, answers[q.id] ?? (q.type === 'phone' ? { ddi: '55', numero: '' } : q.type === 'multi' ? [] : '')) !== '' || answers[q.id] == null);
      go(firstOpen < 0 ? Q.length - 1 : firstOpen, 1);
    }, reduced ? 0 : 420);
  });

  /* ---------- Envio ---------- */
  const fmtPhone = (v) => (v.ddi ? `+${v.ddi} ` : '') + v.numero;
  const toText = () => {
    const lines = ['*Aplicação · Planejamento Nutricional Estratégico*', ''];
    Q.forEach((q, i) => {
      if (q.id === 'acordo') return;
      const v = answers[q.id];
      const val = q.type === 'phone' ? fmtPhone(v) : Array.isArray(v) ? (v.length ? v.map((x) => '• ' + x).join('\n') : 'Nenhum') : v;
      lines.push(`*${i + 1}. ${q.title}*`, val, '');
    });
    lines.push('Aceite: Sim, estou de acordo.');
    if (Object.keys(origem).length) lines.push('Origem: ' + Object.values(origem).join(' / '));
    return lines.join('\n');
  };
  const waUrl = () => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(toText())}`;

  const thanks = (viaWhats) => {
    try { sessionStorage.removeItem(CONFIG.draftKey); } catch (e) {}
    flow.hidden = true;
    document.body.classList.remove('is-flow');
    document.body.classList.add('is-done');
    bar.style.transform = 'scaleX(1)';
    countCur.textContent = String(Q.length).padStart(2, '0');
    const t = $('[data-screen="thanks"]');
    if (viaWhats) { $('[data-thanks-wa]').hidden = false; $('[data-thanks-wa-link]').href = viaWhats; }
    t.hidden = false;
    requestAnimationFrame(() => t.classList.add('is-active'));
    $('#t-title').focus();
  };

  let sending = false;
  const submit = async () => {
    if (sending) return; sending = true;
    const btn = $('[data-ok]', qs[cur]);
    btn.disabled = true; btn.firstChild.textContent = 'Enviando… ';
    const payload = { formulario: 'Planejamento Nutricional Estratégico', enviado_em: new Date().toISOString(), origem, respostas: Q.map((q) => ({ pergunta: q.title, resposta: q.type === 'phone' ? fmtPhone(answers[q.id]) : answers[q.id] })) };
    if (CONFIG.endpoint) {
      try {
        const r = await fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        thanks(null);
        return;
      } catch (err) { /* segue para o WhatsApp abaixo, para não perder a aplicação */ }
    }
    // sem integração: abre o WhatsApp com as respostas organizadas
    const url = waUrl();
    const w = window.open(url, '_blank');
    if (w) w.opener = null;
    thanks(url);
  };

  setProgress();
})();
