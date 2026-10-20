/* ==========================================================================
   CONFIGURAÇÃO DO SITE · edite só este arquivo para ligar/desligar recursos.
   Não precisa mexer no HTML.
   ========================================================================== */
window.NM_CONFIG = {

  /* ---------- Preços ----------
     false (padrão): mostra "Investimento sob aplicação"; os valores são
     apresentados depois da aplicação.
     true: mostra a tabela de preços com o plano anual em destaque.
     A Res. CFN 856/2026 (Art. 68) permite divulgar preço, sem promoção. */
  SHOW_PRICES: false,

  /* ---------- Antes e depois ----------
     TODO: validar compliance. A Res. CFN 856/2026 (Art. 69) proíbe divulgar
     resultados de terceiros com fim publicitário, incluindo antes/depois.
     Só mude para true depois de validar com o CRN-9 por escrito.
     Com false: a faixa "Prova imediata" mostra relatos do Google e a aba
     "Resultados" dos depoimentos fica oculta. */
  SHOW_BEFORE_AFTER: false,

  /* Permite pré-visualizar os modos acima pela URL (?precos=1&antesdepois=1).
     Mude para false antes de publicar. */
  ALLOW_PREVIEW_PARAMS: true,

  /* Valores exibidos quando SHOW_PRICES: true (apresentação comercial). */
  PRICES: {
    anual:      { card: '12× R$ 397,00', pix: 'R$ 4.000,00' },
    semestral:  { card: '12× R$ 217,00', pix: 'R$ 2.197,00' },
  },

  /* ---------- Pagamento recorrente (checkout) ----------
     Cartão: 12 cobranças mensais (recorrente/parcelado). Cole aqui o link do
     checkout (Eduzz, Hotmart, Asaas, Stripe…). Vazio = o botão leva à aplicação. */
  CHECKOUT_URL_ANUAL: '',
  CHECKOUT_URL_SEMESTRAL: '',

  /* ---------- Medição (só carrega depois do aceite de cookies) ---------- */
  GA4_ID: '',            // ex.: 'G-XXXXXXXXXX'
  META_PIXEL_ID: '',     // ex.: '123456789012345'
  GOOGLE_ADS_ID: '',     // ex.: 'AW-123456789'

  /* ---------- Contato ---------- */
  WHATSAPP: '5531992748134',

  /* ---------- Teste A/B do título principal ----------
     'auto' sorteia uma vez por visitante e registra o evento "ab_hero".
     'A' ou 'B' fixa a versão. */
  HERO_AB: 'auto',
  HERO_H1: {   // [título, subtítulo]
    A: ['Emagreça, defina e mantenha', 'Sem dieta engessada e sem abrir mão da sua vida!'],
    B: ['Resultado que dura', 'Com uma equipe inteira ao seu lado!'],
  },

  /* ---------- Rolagem suave (Lenis, ~15 KB via CDN) ---------- */
  SMOOTH_SCROLL: true,

  /* ---------- Depoimentos em vídeo ----------
     type: 'youtube' | 'vimeo' | 'mp4'
     src: ID do YouTube/Vimeo ou caminho do .mp4
     poster: imagem de capa (assets/depoimentos/...)
     ratio: '9:16' (vertical) ou '16:9'
     TODO: confirmar autorização por escrito de cada pessoa antes de publicar.
     Exemplo:
     { type: 'youtube', src: 'dQw4w9WgXcQ', poster: 'assets/depoimentos/ana.jpg',
       ratio: '9:16', name: 'Ana P.', result: 'Mais energia e constância', months: 8 }, */
  /* TODO: confirmar a autorização por escrito de cada pessoa antes de publicar.
     06 é horizontal: o card fica vertical e o player abre em 16:9. */
  TESTIMONIALS: [
    { type: 'mp4', src: 'assets/depoimentos/depoimento-06.mp4', poster: 'assets/depoimentos/depoimento-06.jpg', ratio: '16:9', name: 'Wilker, 34 anos', result: 'Time do Nítio' },
    { type: 'mp4', src: 'assets/depoimentos/depoimento-05.mp4', poster: 'assets/depoimentos/depoimento-05.jpg', ratio: '9:16', name: 'Ewandro', result: 'Time do Nítio' },
    { type: 'mp4', src: 'assets/depoimentos/depoimento-07.mp4', poster: 'assets/depoimentos/depoimento-07.jpg', ratio: '9:16', name: 'Natália', result: 'Time do Nítio' },
    { type: 'mp4', src: 'assets/depoimentos/depoimento-04.mp4', poster: 'assets/depoimentos/depoimento-04.jpg', ratio: '9:16', name: 'Serlane', result: 'Time do Nítio' },
  ],

  /* ---------- Antes e depois (só aparece com SHOW_BEFORE_AFTER: true) ----------
     Exemplo:
     { before: 'assets/resultados/pedro-antes.webp', after: 'assets/resultados/pedro-depois.webp',
       name: 'Pedro', seal: '10 meses entre as fotos' }, */
  BEFORE_AFTER: [],

  /* ---------- Prints de mensagens (WhatsApp) ----------
     { src: 'assets/depoimentos/print-01.webp', alt: 'Mensagem de paciente sobre…' }, */
  MESSAGES: [
    { src: 'assets/feedbacks/feedback-01.webp', w: 720, h: 691, alt: 'Paciente conta que a pressão arterial se regularizou e se manteve estável durante o acompanhamento' },
    { src: 'assets/feedbacks/feedback-02.webp', w: 720, h: 493, alt: 'Paciente conta que eliminou 6,4 kg em 20 dias' },
    { src: 'assets/feedbacks/feedback-03.webp', w: 720, h: 529, alt: 'Paciente comenta que precisou apertar todas as calças' },
    { src: 'assets/feedbacks/feedback-04.webp', w: 720, h: 254, alt: 'Paciente conta que voltou a usar uma roupa que não usava fazia tempo' },
    { src: 'assets/feedbacks/feedback-05.webp', w: 720, h: 645, alt: 'Paciente comemora 14,5 kg a menos e diz que perdeu 75% das roupas' },
    { src: 'assets/feedbacks/feedback-06.webp', w: 720, h: 357, alt: 'Paciente conta que saiu da linha poucas vezes e passou a gastar menos com delivery' },
    { src: 'assets/feedbacks/feedback-07.webp', w: 720, h: 387, alt: 'Paciente diz que a consultoria foi o melhor investimento dos últimos tempos e que se alimenta bem sem sofrer' },
    { src: 'assets/feedbacks/feedback-08.webp', w: 720, h: 312, alt: 'Paciente conta que perdeu a vergonha de tirar a camiseta e se sentiu mais confiante' },
    { src: 'assets/feedbacks/feedback-09.webp', w: 720, h: 267, alt: 'Paciente conta que um short que ficava apertado serviu quase perfeitamente' },
  ],
};
