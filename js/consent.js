/* Consentimento (LGPD) e eventos de conversão.
   - Nada de medição carrega antes do aceite. "Recusar não essenciais" é o padrão
     seguro: fechar o aviso sem escolher não ativa nada.
   - window.nmTrack(nome, dados) registra o evento no dataLayer e, se o visitante
     aceitou, envia também ao GA4 / Meta Pixel / Google Ads configurados em config.js. */
(() => {
  'use strict';
  const C = window.NM_CONFIG || {};
  const KEY = 'nm-consent-v1';
  window.dataLayer = window.dataLayer || [];

  let choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}
  let loaded = false;

  const load = (src) => { const s = document.createElement('script'); s.async = true; s.src = src; document.head.appendChild(s); };

  const startTags = () => {
    if (loaded) return; loaded = true;
    const tagId = C.GA4_ID || C.GOOGLE_ADS_ID;
    if (tagId) {
      window.gtag = function () { window.dataLayer.push(arguments); };
      gtag('js', new Date());
      if (C.GA4_ID) gtag('config', C.GA4_ID, { anonymize_ip: true });
      if (C.GOOGLE_ADS_ID) gtag('config', C.GOOGLE_ADS_ID);
      load('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(tagId));
    }
    if (C.META_PIXEL_ID) {
      /* Meta Pixel (snippet oficial, reduzido) */
      !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', C.META_PIXEL_ID); fbq('track', 'PageView');
    }
  };

  window.nmTrack = (name, data = {}) => {
    window.dataLayer.push({ event: name, ...data });
    if (choice !== 'all') return;
    if (window.gtag) gtag('event', name, data);
    if (window.fbq) {
      if (name === 'envio_formulario') fbq('track', 'Lead', data);
      else if (name === 'clique_whatsapp') fbq('track', 'Contact', data);
      else fbq('trackCustom', name, data);
    }
  };

  const set = (v) => {
    choice = v;
    try { localStorage.setItem(KEY, v); } catch (e) {}
    if (v === 'all') startTags();
    const bar = document.querySelector('[data-consent]');
    if (bar) { bar.classList.remove('is-open'); setTimeout(() => bar.remove(), 400); }
  };

  const banner = () => {
    const privacy = document.documentElement.dataset.privacy || 'privacidade.html';
    const el = document.createElement('div');
    el.className = 'consent'; el.setAttribute('data-consent', '');
    el.setAttribute('role', 'region'); el.setAttribute('aria-label', 'Aviso de cookies');
    el.innerHTML = `<p>Usamos cookies essenciais para o site funcionar. Com o seu aceite, usamos também cookies de medição para entender de onde vêm as visitas. <a href="${privacy}">Política de privacidade</a></p>
      <div class="consent__actions">
        <button type="button" class="consent__btn" data-c="essential">Recusar não essenciais</button>
        <button type="button" class="consent__btn consent__btn--ok" data-c="all">Aceitar</button>
      </div>`;
    el.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) set(b.dataset.c); });
    document.body.appendChild(el);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('is-open')));
  };

  window.nmConsent = { open: banner, get: () => choice };

  if (choice === 'all') startTags();
  const hasIds = C.GA4_ID || C.META_PIXEL_ID || C.GOOGLE_ADS_ID;
  /* O aviso aparece mesmo sem IDs configurados? Não: sem ferramenta de medição,
     só há cookies essenciais e não há o que consentir. */
  const ready = () => { if (!choice && hasIds) banner(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
