# Site — Nítio Mendes · Nutrição Avançada

One-pager cinematográfico, escuro e imponente. O `index.html` é um arquivo único, com HTML, CSS e JavaScript juntos, sem framework e sem etapa de build. A rolagem suave usa o Lenis, carregado de CDN; se o CDN falhar, o site continua com a rolagem normal.

## Conceito

- **Nome gigante:** "NÍTIO / MENDES" em vermelho (`#ff3b1d`, da família do vermelho do ebook), na fonte Anton, com o retrato recortado do Nítio na frente.
- **Movimento:**
  - abertura com contador de 0 a 100% ligado ao carregamento real;
  - nome que sobe letra a letra, títulos que sobem linha a linha e depoimentos que aparecem palavra a palavra;
  - letreiro contínuo com os pilares do acompanhamento;
  - fotos em preto e branco que ganham cor e ondulam ao passar o mouse.
- **Grade proporcional:** tudo é medido em `rem`, e a fonte raiz acompanha a largura da tela (base de 1920 px), então o layout escala igual em qualquer tamanho.

## Seções

1. **Abertura:** contador 0 → 100%, uma vez por sessão, com botão "Pular" e tecla Esc.
2. **Hero:** "Nutrição / Clínica / Avançada / Humanizada", descrição, botão do Planejamento Nutricional Estratégico, nome gigante e retrato.
3. **Letreiro:** escuta ativa, leitura clínica, plano personalizado, suporte diário, checkpoints quinzenais.
4. **Método:** "O resultado mora na constância." e os quatro pilares.
5. **Especialidades:** as 12 áreas. Cada uma abre um painel com o texto integral; os links antigos `#especialidade-<slug>` também funcionam.
6. **Espaço & obras:** consultório, avaliação de composição corporal, o livro *Neuroemocional* e o ebook.
7. **Em números:** +2.000 vidas, +11 países, 5,0 no Google, 15 dias entre checkpoints.
8. **Depoimentos:** quatro relatos reais do Google, sem edição, com troca interativa.
9. **Dúvidas:** as 10 perguntas do site original.
10. **Contato e rodapé:** aplicação ao Planejamento, WhatsApp, e-mail, endereço e redes.

O formulário próprio da aplicação continua em `aplicacao.html`, que usa `css/aplicacao.css`, `css/styles.css` e `js/aplicacao.js`.

## Arquivos

```
index.html                 página principal (arquivo único)
aplicacao.html             formulário de aplicação ao Planejamento
assets/images/             fotos (.webp e .jpg) e o retrato recortado (nitio-recorte.webp/.png)
assets/images/nitio-mesa-original.jpg   foto original do retrato (trocar por alta resolução)
css/, js/aplicacao.js      estilos e lógica do formulário de aplicação
qa/v4.js                   23 testes automáticos (Playwright)
.htaccess, _redirects      redirecionamentos para Hostinger / Netlify
CNAME, .nojekyll           publicação no GitHub Pages (site-nitio.felixdias.com)
```

## Trocar o retrato

A foto atual tem só 453×545 px e aparece um pouco suave no hero. Para usar uma versão em alta resolução, recorte o fundo dela (ficando só a pessoa, com fundo transparente) e salve como `assets/images/nitio-recorte.webp` e `nitio-recorte.png`. Depois ajuste `width` e `height` da `<img data-hero-img>` no `index.html` para a nova proporção.

## Executar e testar

```
python -m http.server 8765
PW=<caminho do pacote playwright> node qa/v4.js
```

A abertura aparece uma vez por sessão do navegador. Para vê-la de novo, use uma aba anônima ou rode `sessionStorage.clear()` no console.

## Versão anterior

A versão com seções em folhas coloridas está na branch `versao-folhas-publicada` e na pasta `site-nitio-mendes-backup-2026-10-13-v2-publicado`.
