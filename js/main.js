/* Nítio Mendes · Nutrição Avançada — interações
   Sem dependências. Cada bloco é independente e falha em silêncio se o
   elemento não existir na página. */
(() => {
  'use strict';

  const WA_NUMBER = '5531992748134';
  const doc = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* ------------------------------------------------------------------
     Rolagem suave com inércia (Lenis). Só com mouse/trackpad e sem
     preferência por movimento reduzido; no toque, a rolagem é a nativa.
     ------------------------------------------------------------------ */
  let lenis = null;
  if (window.Lenis && !reduced.matches) {
    lenis = new window.Lenis({ lerp: 0.09, wheelMultiplier: 0.95, smoothWheel: true });
    const lr = (t) => { lenis.raf(t); requestAnimationFrame(lr); };
    requestAnimationFrame(lr);
    // áreas com rolagem própria continuam independentes
    $$('dialog, .menu, [data-reel-track], .cards').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
  }
  const scrollLock = (on) => { if (lenis) (on ? lenis.stop() : lenis.start()); };
  // âncoras internas com a mesma suavidade
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || !lenis) return;
    const id = a.getAttribute('href');
    const target = id === '#topo' ? 0 : (id.length > 1 ? document.querySelector(id) : null);
    if (target === null) return;
    e.preventDefault();
    lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    if (id !== '#topo') history.replaceState(null, '', id);
  });

  /* ------------------------------------------------------------------
     Imagens ausentes: placeholder com nome e tamanho esperados
     ------------------------------------------------------------------ */
  const markMissing = (img) => { const m = img.closest('.media'); if (m) m.classList.add('is-missing'); };
  document.addEventListener('error', (e) => { if (e.target.tagName === 'IMG') markMissing(e.target); }, true);
  $$('.media img').forEach((img) => { if (img.complete && img.naturalWidth === 0 && img.currentSrc) markMissing(img); });

  /* ------------------------------------------------------------------
     Abertura: contador 0–100 ligado ao carregamento real
     O número exibido nunca passa do que já foi de fato carregado
     (fontes + retrato do hero + página). O tempo mínimo só suaviza.
     Limite rígido de 5 s, botão "Pular" e tecla Esc.
     ------------------------------------------------------------------ */
  const heroEl = $('[data-hero]');
  const startHero = () => {
    if (!heroEl || heroEl.classList.contains('is-in')) return;
    $$('[data-hero-in]', heroEl).forEach((el, i) => el.style.setProperty('--d', String(120 + i * 90)));
    heroEl.classList.add('is-in');
  };

  const intro = $('[data-intro]');
  const introActive = intro && !doc.classList.contains('intro-seen') && getComputedStyle(intro).display !== 'none';

  if (!introActive) {
    if (intro) intro.remove();
    requestAnimationFrame(() => requestAnimationFrame(startHero));
  } else {
    doc.classList.add('is-intro');
    scrollLock(true);
    const num = $('[data-intro-num]');
    const bar = $('[data-intro-count]');
    const ticksEl = $('[data-intro-ticks]');
    const steps = $$('[data-intro-steps] li');
    const mono = $('[data-intro-mono]');
    const glow = $('[data-intro-glow]');
    const fast = reduced.matches;
    const MIN = fast ? 500 : 2000;     // duração mínima da sequência
    const MAX = 4000;                  // nunca prende o visitante além disto

    // ticks da régua: um por ponto percentual
    const tickCount = window.innerWidth < 600 ? 51 : 101;
    const frag = document.createDocumentFragment();
    for (let i = 0; i < tickCount; i++) frag.appendChild(document.createElement('i'));
    ticksEl.appendChild(frag);
    const ticks = Array.from(ticksEl.children);

    // tarefas reais
    const tasks = [];
    const track = (p, weight) => { const t = { done: false, weight }; tasks.push(t); Promise.resolve(p).catch(() => {}).finally(() => { t.done = true; }); };
    track(document.fonts ? document.fonts.ready : null, 2);
    const heroImg = $('[data-hero-img]');
    if (heroImg) track(heroImg.decode ? heroImg.decode() : new Promise((r) => { heroImg.onload = heroImg.onerror = r; }), 3);
    track(new Promise((r) => (document.readyState === 'complete' ? r() : window.addEventListener('load', r, { once: true }))), 1);
    const totalW = tasks.reduce((s, t) => s + t.weight, 0);
    const realProgress = () => tasks.reduce((s, t) => s + (t.done ? t.weight : 0), 0) / totalW;

    const t0 = performance.now();
    let shown = 0, finished = false, raf = 0;
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    const render = (p) => {
      const v = Math.round(p * 100);
      num.textContent = String(v).padStart(3, '0');
      bar.setAttribute('aria-valuenow', String(v));
      intro.style.setProperty('--p', p.toFixed(4));
      const lit = Math.round(p * (ticks.length - 1));
      for (let i = 0; i < ticks.length; i++) ticks[i].classList.toggle('on', i <= lit);
      steps.forEach((s, i) => s.classList.toggle('on', p >= (i + 1) / steps.length - 0.001));
    };

    // complete = tudo carregou de verdade. Ao pular ou estourar o limite,
    // o número fica onde está: não fingimos 100% sem os recursos.
    const finish = (complete) => {
      if (finished) return; finished = true;
      cancelAnimationFrame(raf);
      if (complete === true) render(1);
      else {
        bar.setAttribute('aria-valuetext', Math.round(shown * 100) + '%, o restante carrega em segundo plano');
        if (steps.length) { steps[steps.length - 1].textContent = 'Abrindo, o restante carrega em seguida'; steps[steps.length - 1].classList.add('on'); }
      }
      intro.classList.add('is-assembled');
      try { sessionStorage.setItem('nm-intro', '1'); } catch (e) {}
      const hold = complete === true && !fast ? 520 : 120;
      setTimeout(() => {
        intro.classList.add('is-flash');
        setTimeout(() => {
          intro.classList.add('is-out');
          doc.classList.remove('is-intro');
          scrollLock(false);
          setTimeout(startHero, fast ? 0 : 260);
          setTimeout(() => intro.remove(), fast ? 400 : 1300);
        }, fast ? 0 : 160);
      }, hold);
    };

    const tick = (now) => {
      const el = now - t0;
      const timeP = ease(clamp(el / MIN, 0, 1));
      // nunca mostra mais do que já carregou; a interpolação abaixo evita saltos
      const target = Math.min(timeP, realProgress());
      shown = Math.max(shown, lerp(shown, target, 0.12));
      if (target >= 1 && shown > 0.995) shown = 1;
      render(shown);
      if (shown >= 1) finish(true);
      else if (el >= MAX) finish(false);
      else raf = requestAnimationFrame(tick);
    };
    render(0);
    raf = requestAnimationFrame(tick);

    $('[data-intro-skip]').addEventListener('click', () => finish(false));
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !finished) finish(false); });

    // luz e monograma reagem ao cursor
    if (finePointer.matches && !fast) {
      intro.addEventListener('pointermove', (e) => {
        const x = e.clientX / window.innerWidth, y = e.clientY / window.innerHeight;
        intro.style.setProperty('--gx', (e.clientX - parseFloat(getComputedStyle(glow.parentElement).left)) + 'px');
        mono.style.setProperty('--ty', ((x - 0.5) * 18).toFixed(2) + 'deg');
        mono.style.setProperty('--tx', ((0.5 - y) * 14).toFixed(2) + 'deg');
      });
    }
  }

  /* ------------------------------------------------------------------
     Cabeçalho: contraste conforme a seção sob ele, sólido ao rolar,
     esconde ao descer e volta ao subir
     ------------------------------------------------------------------ */
  const header = $('[data-header]');
  const themed = $$('[data-theme]').filter((el) => el.matches('section, footer'));
  let lastY = window.scrollY;
  const updateHeader = () => {
    const y = window.scrollY;
    const probe = (header.offsetHeight || 72) / 2;
    const under = themed.find((s) => { const r = s.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    header.dataset.on = under ? under.dataset.theme : 'dark';
    header.classList.toggle('is-solid', y > 24);
    const menuOpen = $('[data-menu-toggle]').getAttribute('aria-expanded') === 'true';
    header.classList.toggle('is-hidden', !menuOpen && y > lastY && y > window.innerHeight * 0.9 && !header.contains(document.activeElement));
    lastY = y;
  };

  /* Menu mobile */
  const toggle = $('[data-menu-toggle]');
  const menu = $('[data-menu]');
  const setMenu = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    $('.menu-toggle__label', toggle).textContent = open ? 'Fechar' : 'Menu';
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      doc.style.overflow = 'hidden';
      scrollLock(true);
      header.dataset.on = 'dark';
      const first = $('a', menu); if (first) first.focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      doc.style.overflow = '';
      scrollLock(false);
      setTimeout(() => { if (toggle.getAttribute('aria-expanded') === 'false') menu.hidden = true; }, reduced.matches ? 0 : 700);
      updateHeader();
    }
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setMenu(false); toggle.focus(); }
    if (e.key === 'Tab' && toggle.getAttribute('aria-expanded') === 'true') { // mantém o foco dentro do menu
      const f = [toggle, ...$$('a, button', menu)];
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (m) => { if (m.matches) setMenu(false); });

  /* ------------------------------------------------------------------
     Manifesto: as palavras acendem conforme a leitura
     ------------------------------------------------------------------ */
  const light = $('[data-lightup]');
  let words = [];
  if (light) {
    const text = light.textContent.trim();
    light.setAttribute('aria-label', text);
    light.innerHTML = text.split(/\s+/).map((w) => `<span class="w" aria-hidden="true">${w}</span>`).join(' ');
    words = $$('.w', light);
  }
  const updateLight = () => {
    if (!words.length) return;
    const r = light.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = reduced.matches ? 1 : clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35), 0, 1);
    const n = Math.round(p * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  };

  /* Método: a linha se preenche e os pontos acendem com a rolagem */
  const stepsEl = $('[data-steps]');
  const stepItems = $$('[data-step]');
  const updateSteps = () => {
    if (!stepsEl) return;
    const r = stepsEl.getBoundingClientRect();
    const vh = window.innerHeight;
    const horizontal = window.innerWidth >= 1024;
    let p;
    if (reduced.matches) p = 1;
    else if (horizontal) p = clamp((vh * 0.8 - r.top) / (vh * 0.55), 0, 1);
    else p = clamp((vh * 0.65 - r.top) / r.height, 0, 1);
    stepsEl.style.setProperty('--p', p.toFixed(3));
    stepItems.forEach((s, i) => {
      const at = horizontal ? i / stepItems.length + 0.02 : (s.offsetTop) / r.height;
      s.classList.toggle('is-lit', p >= at);
    });
  };

  /* ------------------------------------------------------------------
     Trilho lateral (desktop) e barra fixa (mobile)
     ------------------------------------------------------------------ */
  const rail = $('[data-rail]');
  const railLinks = $$('[data-rail-link]');
  const railTargets = railLinks.map((a) => $(a.getAttribute('href')));
  const navLinks = $$('.nav a');
  const dock = $('[data-dock]');
  const contact = $('#contato');
  const updateRail = () => {
    const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
    if (rail) {
      rail.style.setProperty('--rp', (max > 0 ? y / max : 0).toFixed(4));
      rail.classList.toggle('is-visible', y > window.innerHeight * 0.5);
    }
    let active = 0;
    railTargets.forEach((t, i) => { if (t && t.getBoundingClientRect().top < window.innerHeight * 0.45) active = i; });
    railLinks.forEach((a, i) => { a.classList.toggle('is-active', i === active); if (i === active) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    const id = railLinks[active] && railLinks[active].getAttribute('href');
    navLinks.forEach((a) => (a.getAttribute('href') === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
    if (dock) {
      const cr = contact ? contact.getBoundingClientRect() : null;
      const nearContact = cr && cr.top < window.innerHeight && cr.bottom > 0;
      dock.classList.toggle('is-visible', y > window.innerHeight * 0.85 && !nearContact);
      dock.toggleAttribute('inert', !dock.classList.contains('is-visible'));
    }
  };

  /* Paralaxe: a foto desliza devagar dentro da moldura */
  const parallax = $$('[data-parallax]');
  const updateParallax = () => {
    if (reduced.matches) return;
    const vh = window.innerHeight;
    parallax.forEach((m) => {
      const r = m.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
      m.style.setProperty('--py', (p * -r.height * 0.05).toFixed(1) + 'px');
    });
  };

  /* Um único laço de rolagem, sincronizado ao quadro */
  let ticking = false;
  const onScroll = () => {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => { ticking = false; updateHeader(); updateLight(); updateSteps(); updateRail(); updateParallax(); });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* Revelações ao entrar na tela */
  $$('.section-head, .proof__head, .books__head, .faq__grid > header, .contact__copy, .steps, .reel').forEach((el) => el.setAttribute('data-reveal', ''));
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealEls.forEach((el) => io.observe(el));
  } else revealEls.forEach((el) => el.classList.add('is-in'));

  /* ------------------------------------------------------------------
     Especialidades: filtros + diálogo com o texto completo
     ------------------------------------------------------------------ */
  const status = $('[data-filter-status]');
  $$('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      let count = 0;
      $$('.spec').forEach((li) => { const show = f === 'todas' || li.dataset.group === f; li.classList.toggle('is-hidden', !show); if (show) count++; });
      if (status) status.textContent = count + (count === 1 ? ' especialidade exibida' : ' especialidades exibidas');
    });
  });

  let lastOpener = null;
  const openDialog = (slug, opener) => {
    const dlg = $(`[data-spec-dialog="${slug}"]`);
    if (!dlg || dlg.open) return;
    lastOpener = opener || null;
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    scrollLock(true);
    history.replaceState(null, '', '#especialidade-' + slug);
  };
  const closeDialog = (dlg) => {
    if (!dlg.open || dlg.classList.contains('is-closing')) return;
    const done = () => {
      dlg.classList.remove('is-closing');
      if (dlg.open) dlg.close();
      scrollLock(false);
      history.replaceState(null, '', location.pathname + location.search);
      if (lastOpener) lastOpener.focus();
    };
    if (reduced.matches) return done();
    dlg.classList.add('is-closing');
    setTimeout(done, 420);
  };
  $$('[data-spec-open]').forEach((b) => b.addEventListener('click', () => openDialog(b.dataset.specOpen, b)));
  $$('[data-spec-dialog]').forEach((dlg) => {
    dlg.addEventListener('cancel', (e) => { e.preventDefault(); closeDialog(dlg); });
    dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) closeDialog(dlg); });
  });
  // links antigos (/especialidades/slug) chegam aqui como #especialidade-slug
  const fromHash = () => {
    const m = location.hash.match(/^#especialidade-([\w-]+)$/);
    if (m && $(`[data-spec-dialog="${m[1]}"]`)) {
      const btn = $(`[data-spec-open="${m[1]}"]`);
      const go = () => { if (btn) btn.scrollIntoView({ block: 'center' }); openDialog(m[1], btn); };
      if (doc.classList.contains('is-intro')) setTimeout(go, 600); else go();
    }
  };
  fromHash();

  /* ------------------------------------------------------------------
     Depoimentos: rolagem com setas, teclado e toque
     ------------------------------------------------------------------ */
  const reel = $('[data-reel]');
  if (reel) {
    const trackEl = $('[data-reel-track]', reel);
    const items = $$('[data-reel-item]', reel);
    const cur = $('[data-reel-current]', reel);
    const prev = $('[data-reel-prev]', reel), next = $('[data-reel-next]', reel);
    let index = 0;
    const go = (i) => { index = clamp(i, 0, items.length - 1); trackEl.scrollTo({ left: items[index].offsetLeft - trackEl.offsetLeft, behavior: reduced.matches ? 'auto' : 'smooth' }); };
    const sync = () => {
      const x = trackEl.scrollLeft;
      let best = 0, bd = Infinity;
      items.forEach((it, i) => { const d = Math.abs(it.offsetLeft - trackEl.offsetLeft - x); if (d < bd) { bd = d; best = i; } });
      index = best;
      cur.textContent = String(best + 1).padStart(2, '0');
      prev.disabled = best === 0; next.disabled = best === items.length - 1;
      items.forEach((it, i) => it.style.opacity = i === best ? '1' : '.45');
    };
    prev.addEventListener('click', () => go(index - 1));
    next.addEventListener('click', () => go(index + 1));
    trackEl.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(index + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(index - 1); }
    });
    let st; trackEl.addEventListener('scroll', () => { clearTimeout(st); st = setTimeout(sync, 60); }, { passive: true });
    sync();
  }

  if (finePointer.matches && !reduced.matches) {
    /* Botões principais: atração magnética sutil */
    $$('[data-magnetic]').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / r.width, y = (e.clientY - r.top - r.height / 2) / r.height;
        b.style.transform = `translate(${(x * 8).toFixed(1)}px, ${(y * 6).toFixed(1)}px)`;
      });
      b.addEventListener('pointerleave', () => { b.style.transform = ''; });
    });
  }

  /* Mapa sob demanda (evita carregar o Google Maps sem pedido) */
  const mapBtn = $('[data-map-load]');
  if (mapBtn) {
    mapBtn.addEventListener('click', () => {
      const box = $('[data-map]');
      if (!box.firstChild) {
        const f = document.createElement('iframe');
        f.src = 'https://www.google.com/maps?q=Av.+Dr.+Jo%C3%A3o+Augusto+da+Fonseca+e+Silva,+396,+Novo+Eldorado,+Contagem+-+MG&output=embed';
        f.title = 'Mapa do consultório em Contagem, MG';
        f.loading = 'lazy';
        f.referrerPolicy = 'no-referrer-when-downgrade';
        box.appendChild(f);
      }
      box.hidden = !box.hidden;
      mapBtn.setAttribute('aria-expanded', String(!box.hidden));
      mapBtn.textContent = box.hidden ? 'Mostrar mapa aqui' : 'Ocultar mapa';
    });
    mapBtn.setAttribute('aria-expanded', 'false');
  }

  /* ------------------------------------------------------------------
     Formulário: monta a mensagem e abre o WhatsApp
     ------------------------------------------------------------------ */
  const form = $('[data-wa-form]');
  if (form) {
    const nome = form.elements.nome, err = $('[data-err]', form);
    const invalid = (on) => { nome.setAttribute('aria-invalid', String(on)); err.hidden = !on; };
    nome.addEventListener('input', () => { if (nome.value.trim()) invalid(false); });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const n = nome.value.trim();
      if (!n) { invalid(true); nome.focus(); return; }
      const obj = form.elements.objetivo.value;
      const mod = (form.querySelector('input[name="modalidade"]:checked') || {}).value || '';
      const msg = form.elements.mensagem.value.trim();
      let text = `Olá Nítio, meu nome é ${n}. Gostaria de agendar um horário`;
      text += mod ? ` (${mod})` : '';
      text += obj ? `. Tenho interesse em: ${obj}.` : '.';
      if (msg) text += `\n\n${msg}`;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
      const w = window.open(url, '_blank');
      if (w) w.opener = null; else location.href = url;
    });
  }

  /* Ano no rodapé */
  const yEl = $('[data-year]'); if (yEl) yEl.textContent = String(new Date().getFullYear());
})();
