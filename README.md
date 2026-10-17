# Site · Nítio Mendes (v5, preto + ouro)

Landing page longa de conversão para o **Programa de Acompanhamento de 12 meses**. O objetivo é levar o visitante a **aplicar** (`aplicacao.html`) ou a **falar no WhatsApp**. Ela é estática (HTML, CSS e JS, sem build) e pode ser hospedada em GitHub Pages, Netlify ou Hostinger.

A identidade segue a apresentação comercial **Estética · Performance · Qualidade de vida**: fundo preto, ouro metálico, **Barlow Condensed 800 em caixa-alta** nos títulos e Montserrat no corpo. A organização segue o modelo de referência (fabriciomoura.com): coluna central, blocos curtos, botões retangulares e CTA depois de cada bloco. Um botão de WhatsApp fica sempre à mão: flutuante no computador e, no celular, numa barra fixa junto com "Aplicar".

## Blocos da página (cada um com âncora própria)

| # | Âncora | Bloco |
|---|--------|-------|
| 1 | `#inicio` | Hero: "NÍTIO MENDES" gigante atrás do retrato (letras sobem na abertura), selo "Acompanhamento Premium", título com teste A/B, CTA |
| — | barra fixa | WhatsApp + Aplicar (no topo depois do hero no computador; sempre no rodapé no celular) |
| 2 | `#dores` | Faixa dourada: "Eu sei que você não está feliz com seus resultados…" + perguntas de dor |
| 3 | `#resultados` | Prova: relatos do Google (ou antes/depois, se ligado) |
| 4 | `#solucao` | "Eu sei o que impede os seus resultados" + 6 pares dor → resolução |
| 5 | `#programa` | "Veja tudo que estará incluso": cartão Programa Premium com checklist e foto |
| 6 | `#beneficios` | Os 6 benefícios com numerais dourados |
| 7 | `#equipe` | "Quem é Nítio Mendes?" (foto P&B, curvas douradas, 12 especializações em `#especialidades`, cada uma abre o texto completo em `#especialidade-<slug>`) + equipe multidisciplinar |
| 8 | `#local` | Presencial em Contagem (SEO local, mapa sob demanda) × online com bioimpedância por IA |
| 9 | `#planos` | Anual (destaque) e semestral, aviso "não atendemos por convênio"; preços controlados por flag |
| 10 | `#como-funciona` | 6 passos depois da aplicação (fundo claro) |
| 11 | `#depoimentos` | Abas: Vídeos, Resultados, Mensagens e Google |
| 12 | `#faq` | 12 perguntas em caixas (JSON-LD FAQPage gerado do próprio HTML) |
| 13 | `#aplicar` | CTA final |
| — | rodapé | Ícones WhatsApp/Instagram, endereço, CRN, privacidade, cookies, aviso de IA |

## Onde editar

| O quê | Arquivo |
|-------|---------|
| Preços, antes/depois, checkout, GA4/Pixel/Ads, A/B do título, vídeos, prints | **`js/config.js`** |
| Cores, fontes e componentes da marca | `css/tokens.css` (veja também `/identidade/`) |
| Layout da página | `css/site.css` |
| Textos | `index.html` |
| Texto das 12 especialidades | `ferramentas/especialidades.html`, depois rode `python ferramentas/montar-index.py` |
| Perguntas do FAQ | `index.html`, depois rode o mesmo script (atualiza o JSON-LD) |
| Perguntas da aplicação e destino das respostas | `js/aplicacao.js` (`CONFIG.endpoint`) |

Pré-visualização sem publicar: `?precos=1` mostra os preços e `?antesdepois=1` liga o antes/depois. Antes de publicar, mude `ALLOW_PREVIEW_PARAMS` para `false`.

## Arquivos

```
index.html               landing page
aplicacao.html           formulário de aplicação (15 etapas, LGPD obrigatória)
privacidade.html         política de privacidade (LGPD)
identidade/              kit visual: paleta, tipografia, componentes, posts e imagem OG
css/tokens.css           tokens da marca (compartilhados)
css/site.css             estilos da landing
css/aplicacao.css        estilos do formulário
js/config.js             configuração editável
js/consent.js            aviso de cookies + eventos (nmTrack)
js/site.js               comportamento da landing
js/aplicacao.js          lógica do formulário
ferramentas/             script de montagem e fonte das especialidades
qa/                      testes Playwright
GUIA-SEO-LOCAL.md        checklist de SEO local para o cliente
PENDENCIAS.md            o que falta o cliente enviar ou confirmar (fora do git)
```

## Eventos de conversão

`clique_aplicar`, `clique_whatsapp`, `inicio_formulario`, `envio_formulario`, `play_video`, além de `clique_como_chegar`, `clique_checkout`, `abrir_especialidade` e `ab_hero`. Todos vão para o `dataLayer`. Com o aceite de cookies e os IDs preenchidos, também vão para o GA4, o Meta Pixel e o Google Ads.

## Testar

```
python -m http.server 8765
PW=<caminho do pacote playwright> node qa/site.js        # 48 verificações
PW=<caminho do pacote playwright> node qa/aplicacao.js   # 16 verificações do formulário
PW=<caminho do pacote playwright> node qa/sections.js 1440 390   # capturas por seção
```

## Versões anteriores

A v4 (carbono + vermelho) está na branch `main` e foi publicada em `site-nitio.felixdias.com`. A v2 (folhas) está na branch `versao-folhas-publicada`.
