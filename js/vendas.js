/* Nítio Mendes · vendas: mês e número de vagas nas chamadas do site.
   Vagas e dia da virada em js/config.js. */
(() => {
  'use strict';
  const C = window.NM_CONFIG || {};
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

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
})();
