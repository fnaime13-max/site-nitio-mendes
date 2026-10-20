/* Nítio Mendes · comportamento da landing page.
   Tudo o que é editável fica em js/config.js. */
(() => {
  'use strict';
  const C = window.NM_CONFIG || {};
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const track = (n, d) => window.nmTrack && window.nmTrack(n, d);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const params = new URLSearchParams(location.search);
  const preview = (k) => C.ALLOW_PREVIEW_PARAMS && params.get(k) === '1';
  const SHOW_PRICES = !!C.SHOW_PRICES || preview('precos');
  const SHOW_BA = !!C.SHOW_BEFORE_AFTER || preview('antesdepois');

  /* ---------- UTM: quem chegou por campanha leva a origem para a aplicação ---------- */
  const inbound = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term'].filter((k) => params.get(k));
  if (inbound.length) {
    $$('a[href^="aplicacao.html"]').forEach((a) => {
      const u = new URL(a.getAttribute('href'), location.href);
      inbound.forEach((k) => u.searchParams.set(k, params.get(k)));
      a.setAttribute('href', 'aplicacao.html' + u.search);
    });
  }

  /* ---------- Eventos de conversão ---------- */
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (href.startsWith('aplicacao.html')) {
      const u = new URL(href, location.href);
      track('clique_aplicar', { local: u.searchParams.get('utm_content') || '', plano: u.searchParams.get('plano') || '' });
    } else if (href.includes('wa.me/')) {
      track('clique_whatsapp', { local: a.dataset.wa || '' });
    } else if (a.hasAttribute('data-maps')) {
      track('clique_como_chegar', {});
    } else if (a.hasAttribute('data-checkout')) {
      track('clique_checkout', { plano: a.dataset.checkout });
    }
  });

  /* ---------- Teste A/B do título ---------- */
  const h1 = $('[data-hero-h1]');
  if (h1 && C.HERO_H1) {
    let v = C.HERO_AB;
    if (v === 'auto') {
      try { v = localStorage.getItem('nm-ab-hero'); } catch (e) { v = null; }
      if (v !== 'A' && v !== 'B') { v = Math.random() < .5 ? 'A' : 'B'; try { localStorage.setItem('nm-ab-hero', v); } catch (e) {} }
    }
    if (v === 'B' && Array.isArray(C.HERO_H1.B)) {
      h1.textContent = C.HERO_H1.B[0];
      const sub = $('[data-hero-sub]'); if (sub && C.HERO_H1.B[1]) sub.textContent = C.HERO_H1.B[1];
    }
    document.documentElement.dataset.ab = v || 'A';
    track('ab_hero', { variante: v || 'A' });
  }

  /* ---------- Nome gigante: letras sobem na abertura ---------- */
  let li = 0;
  $$('[data-letters]').forEach((el) => {
    const t = el.textContent.trim();
    el.textContent = '';
    [...t].forEach((c) => { const s = document.createElement('span'); s.className = 'ch'; s.style.setProperty('--i', li++); s.textContent = c; el.appendChild(s); });
  });

  /* ---------- Barra de ação: no computador aparece no topo depois do hero ---------- */
  const actbar = $('[data-actbar]');
  const hero = $('#inicio');
  // IntersectionObserver em vez de medir o hero a cada rolagem (evita "reflow forçado")
  if (actbar && hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      actbar.classList.toggle('is-visible', !e.isIntersecting && e.boundingClientRect.top < 0);
    }, { rootMargin: '-120px 0px 0px 0px' }).observe(hero);
  }

  /* ---------- Menu do celular ---------- */
  const burger = $('[data-burger]'), menu = $('[data-menu]');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.documentElement.classList.toggle('menu-open', open);
    if (open) { menu.hidden = false; requestAnimationFrame(() => menu.classList.add('is-open')); document.documentElement.style.overflow = 'hidden'; lenis && lenis.stop(); $('a', menu).focus(); }
    else { menu.classList.remove('is-open'); setTimeout(() => { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 350); document.documentElement.style.overflow = ''; lenis && lenis.start(); }
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); burger.focus(); } });

  /* ---------- Rolagem suave (opcional) ---------- */
  let lenis = null;
  if (C.SMOOTH_SCROLL && !reduced && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    import('https://cdn.jsdelivr.net/npm/lenis@1.3.19/dist/lenis.mjs').then(({ default: Lenis }) => {
      lenis = new Lenis({ smoothWheel: true, lerp: .12 });
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
      $$('dialog, [data-menu], .rail, .tabs').forEach((el) => el.setAttribute('data-lenis-prevent', ''));
    }).catch(() => {});
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2) return;
    const el = $(a.getAttribute('href'));
    if (!el) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(el, { offset: -80, duration: 1.2 });
    else el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    history.replaceState(null, '', a.getAttribute('href') === '#inicio' ? location.pathname + location.search : a.getAttribute('href'));
  });

  /* ---------- Revelação ao rolar ---------- */
  const io = 'IntersectionObserver' in window && !reduced
    ? new IntersectionObserver((es) => es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { rootMargin: '0px 0px -8% 0px' })
    : null;
  const watch = (el) => (io ? io.observe(el) : el.classList.add('in'));
  $$('.rv').forEach(watch);

  /* brilho dourado passa uma vez no botão principal do hero */
  if (!reduced) setTimeout(() => { const b = $('.hero .btn--gold'); if (b) { b.classList.add('is-shine'); setTimeout(() => b.classList.remove('is-shine'), 1100); } }, 1400);

  /* ---------- Prova imediata: antes/depois (só com a flag) ---------- */
  const baCard = (it, i) => {
    const pic = (src, alt) => src ? `<img src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async" width="600" height="800">` : `<span class="ba__ph">Foto autorizada<br>aguardando arquivo</span>`;
    return `<figure class="ba rv" style="--rv-delay:${i * 70}ms">
      <div class="ba__pics">${pic(it.before, `Antes · ${it.name || ''}`)}${pic(it.after, `Depois · ${it.name || ''}`)}</div>
      <span class="ba__lbl ba__lbl--a">Antes</span><span class="ba__lbl ba__lbl--b">Depois</span>
      ${it.seal ? `<span class="nm-seal">${esc(it.seal)}</span>` : ''}
      <figcaption class="ba__who">${esc(it.name || 'Paciente')}${it.note ? ' · ' + esc(it.note) : ''}</figcaption>
    </figure>`;
  };
  const baItems = (C.BEFORE_AFTER && C.BEFORE_AFTER.length) ? C.BEFORE_AFTER : Array.from({ length: 4 }, () => ({ seal: 'Meses entre as fotos', name: 'Nome do paciente' }));
  if (SHOW_BA) {
    const rail = $('[data-res-rail]'); rail.hidden = false;
    rail.innerHTML = baItems.map(baCard).join('');
    $$('.rv', rail).forEach(watch);
    const ba = $('[data-ba]'); ba.innerHTML = baItems.map(baCard).join(''); $$('.rv', ba).forEach(watch);
    $$('[data-ba-only]').forEach((t) => (t.hidden = false));
  }

  /* ---------- Planos: preços e checkout ---------- */
  if (SHOW_PRICES && C.PRICES) {
    Object.entries(C.PRICES).forEach(([k, p]) => {
      const box = $(`[data-price="${k}"]`);
      if (!box) return;
      box.innerHTML = `<p class="plan__card">${esc(p.card)}<small>no cartão, em cobrança recorrente mensal</small></p><p class="plan__pix">ou <b>${esc(p.pix)}</b> à vista no Pix</p>`;
    });
    $('[data-price-note]').textContent = 'Valores do programa completo. O parcelamento no cartão é feito em cobranças mensais recorrentes. Cada aplicação é analisada pessoalmente. Na pré-consulta você recebe os valores e as formas de pagamento.';
    [['anual', C.CHECKOUT_URL_ANUAL], ['semestral', C.CHECKOUT_URL_SEMESTRAL]].forEach(([k, url]) => {
      const a = $(`[data-checkout="${k}"]`);
      if (a && url) { a.href = url; a.hidden = false; }
    });
  }

  /* ---------- Abas dos depoimentos ---------- */
  const tabs = $$('[data-tabs] [role="tab"]');
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
      $('#' + t.getAttribute('aria-controls')).hidden = !on;
    });
    if (focus) tab.focus();
  };
  tabs.forEach((t) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const vis = tabs.filter((x) => !x.hidden);
      const i = vis.indexOf(t);
      const to = e.key === 'ArrowRight' ? vis[(i + 1) % vis.length] : e.key === 'ArrowLeft' ? vis[(i - 1 + vis.length) % vis.length] : e.key === 'Home' ? vis[0] : e.key === 'End' ? vis[vis.length - 1] : null;
      if (to) { e.preventDefault(); select(to, true); }
    });
  });

  /* vídeos */
  // capas em WebP responsivo (depoimento-NN-360/720.webp, geradas ao lado do .jpg)
  const posterImg = (src) => {
    const m = /^(assets\/depoimentos\/[\w-]+)\.jpg$/.exec(src);
    const set = m ? `${m[1]}-360.webp 360w, ${m[1]}-480.webp 480w, ${m[1]}-720.webp 720w` : '';
    return `<picture>${set ? `<source type="image/webp" srcset="${set}" sizes="(min-width: 900px) 240px, 56vw">` : ''}<img class="vid__poster" src="${esc(src)}" alt="" loading="lazy" decoding="async" width="540" height="960"></picture>`;
  };
  const vids = $('[data-videos]');
  const list = C.TESTIMONIALS || [];
  if (list.length) {
    vids.innerHTML = list.map((v, i) => {
      const wide = !!v.wide; // card largo só se pedido; vídeo horizontal abre em 16:9 no player
      const meta = `<span class="vid__meta"><b>${esc(v.name)}</b><span>${esc(v.result || '')}${v.months ? ` · ${esc(v.months)} meses de acompanhamento` : ''}</span></span>`;
      return `<li class="vid${wide ? ' vid--wide' : ''}"><button type="button" data-vid="${i}" aria-label="Assistir ao depoimento de ${esc(v.name)}">
        ${v.poster ? posterImg(v.poster) : '<span class="vid__ph"></span>'}
        <span class="vid__play" aria-hidden="true"><svg><use href="#play"/></svg></span>${meta}</button></li>`;
    }).join('');
  } else {
    vids.innerHTML = Array.from({ length: 4 }, (_, i) => `<li class="vid"><div><span class="vid__ph"><span class="vid__play" aria-hidden="true"><svg><use href="#play"/></svg></span></span><span class="vid__meta"><b>Depoimento ${i + 1}</b><span>Vídeo em breve</span></span></div></li>`).join('');
  }

  /* prints de mensagens */
  const msgs = C.MESSAGES || [];
  $('[data-msgs]').innerHTML = (msgs.length ? msgs : Array.from({ length: 4 }, () => null)).map((m) =>
    m ? `<li class="msg"><img src="${esc(m.src)}" alt="${esc(m.alt || 'Mensagem de paciente')}"${m.w ? ` width="${m.w}" height="${m.h}"` : ''} loading="lazy" decoding="async"></li>`
      : `<li class="msg"><span class="msg__ph">Print de mensagem<br>aguardando arquivo autorizado</span></li>`).join('');

  /* player em modal: só carrega o vídeo no clique */
  const player = $('[data-player]'), frame = $('[data-player-frame]');
  let opener = null;
  const embed = (v) => {
    if (v.type === 'youtube') return `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(v.src)}?autoplay=1&rel=0&playsinline=1" title="Depoimento de ${esc(v.name)}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>`;
    if (v.type === 'vimeo') return `<iframe src="https://player.vimeo.com/video/${encodeURIComponent(v.src)}?autoplay=1&dnt=1" title="Depoimento de ${esc(v.name)}" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>`;
    return `<video src="${esc(v.src)}" ${v.poster ? `poster="${esc(v.poster)}"` : ''} controls autoplay playsinline></video>`;
  };
  vids.addEventListener('click', (e) => {
    const b = e.target.closest('[data-vid]');
    if (!b) return;
    const v = list[+b.dataset.vid];
    opener = b;
    player.classList.toggle('player--tall', v.ratio !== '16:9');
    frame.innerHTML = embed(v);
    player.showModal(); lenis && lenis.stop();
    $('[data-player-close]').focus();
    track('play_video', { nome: v.name || '' });
  });
  const closePlayer = () => { if (player.open) player.close(); };
  player.addEventListener('close', () => { frame.innerHTML = ''; lenis && lenis.start(); if (opener) opener.focus(); });
  $('[data-player-close]').addEventListener('click', closePlayer);
  player.addEventListener('click', (e) => { if (e.target === player) closePlayer(); });
  /* mantém o Tab dentro do modal: depois do vídeo, um marcador devolve o foco ao botão de fechar */
  $('[data-trap]', player).addEventListener('focus', () => $('[data-player-close]').focus());
  /* mantém o Tab dentro do modal (o iframe fica fora do alcance do documento) */
  player.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const f = $$('button, iframe, video, [data-trap]', player);
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  /* ---------- Mapa: só carrega quando pedido (desempenho e privacidade) ---------- */
  const mapBtn = $('[data-map-load]');
  mapBtn.addEventListener('click', () => {
    const m = $('[data-map]');
    m.innerHTML = '<iframe title="Mapa do consultório em Contagem, MG" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Av.+Dr.+Jo%C3%A3o+Augusto+da+Fonseca+e+Silva,+396,+Novo+Eldorado,+Contagem+-+MG&output=embed"></iframe>';
    m.hidden = false; mapBtn.hidden = true;
  });

  /* ---------- Especialidades: painel com o texto integral ---------- */
  let specOpener = null;
  const openSpec = (slug, btn) => {
    const d = $(`[data-spec-dialog="${slug}"]`);
    if (!d || d.open) return;
    specOpener = btn || null;
    d.showModal(); lenis && lenis.stop();
    history.replaceState(null, '', '#especialidade-' + slug);
    track('abrir_especialidade', { especialidade: slug });
  };
  const closeSpec = (d) => {
    if (!d.open || d.classList.contains('is-closing')) return;
    const end = () => { d.classList.remove('is-closing'); d.close(); lenis && lenis.start(); history.replaceState(null, '', location.pathname + location.search); if (specOpener) specOpener.focus(); };
    if (reduced) return end();
    d.classList.add('is-closing'); setTimeout(end, 360);
  };
  $$('[data-spec-open]').forEach((b) => b.addEventListener('click', () => openSpec(b.dataset.specOpen, b)));
  $$('[data-spec-dialog]').forEach((d) => {
    d.addEventListener('cancel', (e) => { e.preventDefault(); closeSpec(d); });
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) closeSpec(d); });
  });
  const fromHash = () => {
    const m = location.hash.match(/^#especialidade-([\w-]+)$/);
    if (m) { const b = $(`[data-spec-open="${m[1]}"]`); if (b) { b.scrollIntoView({ block: 'center' }); openSpec(m[1], b); } }
  };
  setTimeout(fromHash, 250);
  addEventListener('hashchange', fromHash);

  /* ---------- Rodapé ---------- */
  const yEl = $('[data-year]'); if (yEl) yEl.textContent = new Date().getFullYear();
  const prefs = $('[data-cookie-prefs]');
  if (prefs) prefs.addEventListener('click', () => { try { localStorage.removeItem('nm-consent-v1'); } catch (e) {} window.nmConsent && window.nmConsent.open(); });

})();
