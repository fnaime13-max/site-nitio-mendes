/* Blog: filtro por assunto, preferências de cookies e eventos de clique no WhatsApp. */
(() => {
  'use strict';
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* Filtro do índice (sem JS, todos os artigos aparecem e os botões ficam ocultos) */
  const bar = document.querySelector('[data-filters]');
  if (bar) {
    bar.hidden = false;
    const cards = $$('[data-grid] > li');
    bar.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-filter]'); if (!b) return;
      $$('[data-filter]', bar).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      cards.forEach((c) => { c.hidden = !!b.dataset.filter && c.dataset.cat !== b.dataset.filter; });
    });
  }

  document.addEventListener('click', (ev) => {
    if (ev.target.closest('[data-cookie-prefs]')) {
      try { localStorage.removeItem('nm-consent-v1'); } catch (e) {}
      window.nmConsent && window.nmConsent.open();
      return;
    }
    const wa = ev.target.closest('[data-wa]');
    if (wa && window.nmTrack) window.nmTrack('clique_whatsapp', { local: wa.dataset.wa, pagina: location.pathname });
  });
})();
