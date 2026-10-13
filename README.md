# Site — Nítio Mendes · Nutrição Avançada

Proposta de redesign de [nitiomendes.com.br](https://nitiomendes.com.br/). É uma página única em HTML, CSS e JavaScript puros, sem framework, sem dependências e sem etapa de build.

## Conceito: "A linha da constância"

O ponto de partida é o próprio consultório. A frase na parede da sala de espera, "O resultado mora na constância.", já era o título do site. As faixas de LED lineares, o cimento queimado, o mármore e o monograma N em prata e preto definem a paleta e a linguagem gráfica:

- **A linha de luz.** É a faixa de LED do consultório. Ela aparece acendendo na abertura, ao lado do retrato, preenchendo o método conforme a leitura avança e como trilho de progresso lateral no desktop.
- **Seções em folhas.** Cada seção tem cor própria e desliza sobre a anterior com cantos arredondados, numerada (01, 02…). As cores vêm do consultório e dos materiais: mármore, areia e pedra (paredes e mesa), couro (a cadeira) no Método e vinho (o ebook) nos Livros. O preto fica só na abertura e no contato.
- **Movimento.** Rolagem suave com inércia (Lenis, guardada em `js/vendor/`), faixa contínua no fim do hero, paralaxe leve nas fotos do consultório e cartões que reagem ao passar o mouse.
- **Tipografia.** Archivo expandida ecoa o "NITIO MENDES" da placa. Newsreader itálica traz a voz humana. IBM Plex Mono é usada nas medidas.

O dourado do site atual foi deixado de lado de propósito. Ele não aparece no espaço físico nem nos materiais da marca.

## Estrutura

```
index.html            página única (todos os textos)
css/styles.css        visual; cores, fontes e espaçamentos ficam em :root, no topo
js/main.js            abertura, rolagem suave, linha do método, filtros, diálogos, formulário…
js/vendor/lenis.min.js rolagem suave (Lenis 1.1.13, MIT), servida localmente
assets/images/        fotos em .webp e .jpg (640 e 1100 px), og-image.jpg
assets/icons/         favicon.svg e apple-touch-icon.png
ferramentas/          script para gerar novas versões das fotos
qa/                   testes automatizados (Playwright) e capturas
_redirects            mantém os links antigos /especialidades/... funcionando
robots.txt, sitemap.xml
PENDENCIAS.md         o que precisa de confirmação antes de publicar
```

## Ordem da página

1. **Abertura.** Contador de 0 a 100%, linha de luz e monograma.
2. **Hero.** Cartão em destaque do **Planejamento Nutricional Estratégico** (aplicação via Leadix), título, CTAs, números e faixa contínua.
3. **Manifesto.** O problema ("se sentiu sozinha no processo"), com as palavras acendendo durante a leitura.
4. **Consultório e online.** Fotos reais com paralaxe, endereço, mapa sob demanda e países atendidos.
5. **Método.** As cinco etapas do acompanhamento e o que as sustenta. O site atual tinha o título "Clique abaixo para saber como funciona", mas não explicava o método.
6. **Especialidades.** As 12, em cartões com filtros. Cada uma abre um painel com o texto integral da página original.
7. **Depoimentos.** Os 9 relatos do Google, sem edição.
8. **Livros.** Neuroemocional (Amazon e pedido com dedicatória) e o ebook (Eduzz).
9. **Conteúdo.** Seis artigos do blog, em cartões (carrossel no celular).
10. **Dúvidas.** As 10 perguntas do site original.
11. **Contato.** Aplicação, WhatsApp, e-mail, Instagram e um formulário que monta a mensagem do WhatsApp.

## Formulário de aplicação (`aplicacao.html`)

Recria as 13 perguntas do formulário da Leadix ("Aplicação #TeamNítio") com a estética do site. Os textos de boas-vindas, as perguntas, as opções e a mensagem de agradecimento são os originais.

- **Etapas:** uma pergunta por vez, com barra de progresso, numeração, botões voltar e avançar, e validação (nome e sobrenome, WhatsApp com DDI e máscara, @ automático no Instagram).
- **Teclado:** Enter avança e as letras A a F escolhem as opções.
- **Rascunho:** as respostas ficam guardadas na sessão do navegador, então recarregar a página não perde o que já foi preenchido.
- **Origem:** os parâmetros UTM de cada botão do site seguem junto com as respostas.
- **Envio:** em `js/aplicacao.js`, `CONFIG.endpoint`.
  - **Vazio (padrão atual):** ao enviar, abre o WhatsApp do Nítio com todas as respostas organizadas.
  - **Com uma URL de webhook (Leadix, Zapier, Make…):** as respostas vão por POST em JSON para essa URL. Se o envio falhar, o formulário usa o WhatsApp para não perder a aplicação.
- **Teste:** `PW=<playwright> node qa/aplicacao.js`.

## Como executar

Abra o `index.html` no navegador. Para testar como em produção (recomendado), sirva a pasta:

```
python -m http.server 8765
```

Depois acesse http://127.0.0.1:8765/.

A abertura aparece só na primeira visita de cada sessão do navegador. Para vê-la de novo, abra uma aba anônima ou rode `sessionStorage.clear()` no console.

## Como publicar

Qualquer hospedagem estática serve: Netlify, Cloudflare Pages, Vercel ou um servidor comum. Envie a pasta inteira. O conteúdo de `qa/` não é necessário em produção.

- **Netlify / Cloudflare Pages.** O arquivo `_redirects` já é lido e faz os links antigos `/especialidades/<slug>` abrirem a especialidade certa (`/#especialidade-<slug>`).
- **Outros hosts.** Recrie os redirecionamentos 301 listados em `_redirects`.
- **Blog.** Os artigos continuam em `nitiomendes.com.br/blog/...`. Leia `PENDENCIAS.md` antes de trocar o domínio.

## Como alterar

- **Textos.** Todos ficam no `index.html`, em ordem. Cada seção começa com um comentário, por exemplo `<!-- 03 · MÉTODO -->`.
- **Link da aplicação.** Os 6 botões apontam para `aplicacao.html`. O parâmetro `utm_content` identifica de qual botão veio cada lead (`hero_destaque`, `hero_botao`, `header`, `menu`, `barra_mobile`, `contato`).
- **WhatsApp.** Substitua `5531992748134` em todo o `index.html` e em `WA_NUMBER`, no topo de `js/main.js`.
- **CRN.** Procure `CRN: a confirmar` no rodapé. Troque pelo número real e remova a classe `pending`.
- **Fotos.**
  ```
  python ferramentas/gerar-fotos.py caminho/da/foto.jpg nitio-retrato
  ```
  Os nomes válidos estão no cabeçalho do script. Se faltar algum arquivo, o site mostra um placeholder com nome e tamanho esperados, em vez de uma imagem quebrada.
- **Logo.** O monograma é um `<symbol id="mono">` no início do `<body>` e também aparece desenhado dentro da abertura. Para usar o vetor oficial, substitua os `path` nos dois lugares e em `assets/icons/favicon.svg`.

## Testes

Os testes usam o Playwright. Primeiro sirva o site em `127.0.0.1:8765`, depois rode:

```
PW=<caminho do pacote playwright> node qa/shots.js         # 7 larguras: overflow, erros, capturas
PW=<caminho do pacote playwright> node qa/sections.js      # captura seção por seção (1440 e 390)
PW=<caminho do pacote playwright> node qa/interactions.js  # 27 verificações funcionais
```

As capturas ficam em `qa/shots/`.

## Acessibilidade e desempenho

- HTML semântico, com um único `h1` e hierarquia h2/h3 por seção.
- Link "Pular para o conteúdo".
- Foco visível em todos os elementos interativos.
- Diálogos nativos (`<dialog>`) que devolvem o foco ao botão que os abriu.
- O menu mobile mantém o foco dentro dele e fecha com Esc.
- Depoimentos navegáveis pelas setas do teclado.
- Filtros com `aria-pressed` e anúncio do resultado para leitores de tela.
- `prefers-reduced-motion` reduz a abertura a cerca de 0,5 s e desliga rolagem suave, paralaxe, faixa contínua, inclinação e revelações. No toque, a rolagem é sempre a nativa do aparelho.
- Sem JavaScript, o conteúdo aparece completo e não há abertura.
- Imagens em WebP com fallback JPG, `srcset` e `loading="lazy"` fora da primeira dobra.
- O retrato do hero é pré-carregado.
- O mapa do Google só carrega quando a pessoa pede.
