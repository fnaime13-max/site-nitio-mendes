# -*- coding: utf-8 -*-
"""Gera o blog estático a partir de ferramentas/blog-artigos.json.

    python ferramentas/gerar-blog.py

Saída: blog/index.html e blog/<slug>/index.html (mesmas URLs do site antigo,
nitiomendes.com.br/blog/<slug>) e as entradas do blog no sitemap.xml.
Para publicar um artigo novo: acrescente um objeto no JSON (slug, title,
category, tags, readingTime, excerpt, metaTitle, metaDescription, content,
e opcionalmente date no formato AAAA-MM-DD) e rode o script de novo.
Blocos de content: {"type": "p"|"h2"|"h3", "text": ...} ou {"type": "ul", "items": [...]}.
"""
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

RAIZ = Path(__file__).resolve().parent.parent
DADOS = RAIZ / 'ferramentas' / 'blog-artigos.json'
SITE = 'https://nitiomendes.com.br'
VERSAO = '20261029c'          # mesmo ?v= das outras páginas
DATA_PADRAO = '2026-10-26'    # data de publicação neste domínio
WA = '5531999670406'
CRN = 'CRN-9 36148'
OG = SITE + '/assets/images/og-image.jpg'

e = lambda s: html.escape(s, quote=True)


def wa_link(texto):
    return f'https://wa.me/{WA}?text=' + quote(texto, safe='')


FONTES = 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;1,800&family=Montserrat:wght@400;500;600;700;800&display=swap'

def _sprite():
    """Ícones copiados do sprite do index.html (mesmo desenho do site)."""
    idx = (RAIZ / 'index.html').read_text(encoding='utf-8')
    defs = re.search(r'<linearGradient id="g-logo".*?</linearGradient>', idx, re.S).group(0)
    simb = [re.search(rf'<symbol id="{n}".*?</symbol>', idx, re.S).group(0) for n in ('mono', 'wa', 'ig')]
    seta = '<symbol id="arrow" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></symbol>'
    linhas = ['<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false">',
              '  <defs>' + defs + '</defs>'] + ['  ' + x for x in simb + [seta]] + ['</svg>']
    return '\n'.join(linhas)


SPRITE = _sprite()


def head(titulo, descricao, url, tipo, extra_ld, keywords=None):
    kw = f'\n<meta name="keywords" content="{e(keywords)}">' if keywords else ''
    return f'''<!doctype html>
<html lang="pt-BR" data-privacy="/privacidade.html">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{e(titulo)}</title>
<meta name="description" content="{e(descricao)}">{kw}
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#0F0F0F">
<meta name="author" content="Nítio Mendes">
<meta property="og:type" content="{tipo}">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="Nítio Mendes · Nutrição">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(descricao)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{OG}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{e(titulo)}">
<meta name="twitter:description" content="{e(descricao)}">
<meta name="twitter:image" content="{OG}">
<link rel="icon" href="/assets/icons/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icons/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="{FONTES}">
<link rel="stylesheet" href="/css/tokens.css?v={VERSAO}">
<link rel="stylesheet" href="/css/blog.css?v={VERSAO}">
<script>
  /* Prévia (qualquer domínio que não seja o oficial): não indexar no Google. */
  if (!/(^|\\.)nitiomendes\\.com\\.br$/.test(location.hostname)) {{ var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow'; document.head.appendChild(m); }}
</script>
<script type="application/ld+json">
{json.dumps(extra_ld, ensure_ascii=False, indent=1)}
</script>
</head>
<body>
<a class="skip" href="#conteudo">Pular para o conteúdo</a>
{SPRITE}
<header class="top">
  <div class="wrap top__in">
    <a class="brand" href="/" aria-label="Nítio Mendes, página inicial">
      <svg class="brand__mono" aria-hidden="true"><use href="#mono"/></svg>
      <span class="brand__word" aria-hidden="true"><b>N</b>ITIO<b>M</b>ENDES</span>
    </a>
    <nav class="top__nav" aria-label="Principal">
      <a href="/#programa">O programa</a>
      <a href="/blog/" aria-current="{'page' if tipo == 'website' else 'false'}">Blog</a>
      <a class="top__cta" href="{wa_link('Olá! Vim pelo blog e quero saber mais sobre o acompanhamento.')}" target="_blank" rel="noopener" data-wa="blog_topo"><svg aria-hidden="true"><use href="#wa"/></svg><span>Falar com a equipe</span></a>
    </nav>
  </div>
</header>
'''


RODAPE = f'''
<footer class="foot">
  <div class="wrap center">
    <ul class="foot__social">
      <li><a class="foot__ic" href="https://wa.me/{WA}" target="_blank" rel="noopener" aria-label="WhatsApp" data-wa="blog_rodape"><svg aria-hidden="true"><use href="#wa"/></svg></a></li>
      <li><a class="foot__ic" href="https://instagram.com/nitiomendes" target="_blank" rel="noopener" aria-label="Instagram @nitiomendes"><svg aria-hidden="true"><use href="#ig"/></svg></a></li>
    </ul>
    <p class="foot__brand"><svg aria-hidden="true"><use href="#mono"/></svg><span><b>N</b>ITIO<b>M</b>ENDES</span></p>
    <p class="foot__tag">Estética · Performance · Qualidade de vida</p>
    <address class="foot__addr">Av. Dr. João Augusto da Fonseca e Silva, 396, 2º andar · Novo Eldorado, Contagem, MG<br><a href="mailto:consultorianitiomendes@gmail.com">consultorianitiomendes@gmail.com</a> · (31) 99967-0406</address>
    <ul class="foot__links">
      <li><a href="/">Página inicial</a></li>
      <li><a href="/blog/">Blog</a></li>
      <li><a href="/privacidade.html">Política de privacidade</a></li>
      <li><button type="button" class="linkbtn" data-cookie-prefs>Preferências de cookies</button></li>
    </ul>
    <p class="foot__copy">Todos os direitos reservados © 2026</p>
    <p class="foot__legal">Nítio Mendes, Nutricionista {CRN}</p>
    <p class="foot__legal">Conteúdo educativo: não substitui consulta nem orientação individual. Este site não faz prescrição.</p>
    <p class="foot__legal">Textos produzidos com apoio de ferramentas de inteligência artificial e revisados pelo nutricionista responsável.</p>
  </div>
</footer>
<script src="/js/config.js?v={VERSAO}" defer></script>
<script src="/js/consent.js?v={VERSAO}" defer></script>
<script src="/js/blog.js?v={VERSAO}" defer></script>
</body>
</html>
'''

AUTOR = {'@type': 'Person', '@id': SITE + '/#nitio', 'name': 'Nítio Mendes', 'jobTitle': 'Nutricionista',
         'identifier': CRN, 'url': SITE + '/', 'sameAs': ['https://instagram.com/nitiomendes']}
EDITORA = {'@type': 'Organization', '@id': SITE + '/#negocio', 'name': 'Nítio Mendes - Nutrição Avançada',
           'url': SITE + '/', 'logo': {'@type': 'ImageObject', 'url': SITE + '/assets/icons/apple-touch-icon.png'}}


def slug_cat(c):
    s = c.lower()
    for a, b in (('áàãâ', 'a'), ('éê', 'e'), ('í', 'i'), ('óõô', 'o'), ('ú', 'u'), ('ç', 'c')):
        s = re.sub(f'[{a}]', b, s)
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def corpo(blocos):
    out = []
    for b in blocos:
        t = b['type']
        if t == 'ul':
            out.append('<ul>' + ''.join(f'<li>{e(i)}</li>' for i in b['items']) + '</ul>')
        elif t in ('p', 'h2', 'h3'):
            out.append(f'<{t}>{e(b["text"])}</{t}>')
        else:
            raise ValueError('bloco desconhecido: ' + t)
    return '\n      '.join(out)


def cartao(p, nivel='h2'):
    return f'''<li class="card" data-cat="{slug_cat(p['category'])}">
        <a class="card__link" href="/blog/{p['slug']}/">
          <p class="card__meta"><span>{e(p['category'])}</span>{e(p['readingTime'])}</p>
          <{nivel} class="card__t">{e(p['title'])}</{nivel}>
          <p class="card__ex">{e(p['excerpt'])}</p>
          <span class="card__more">Ler artigo<svg aria-hidden="true"><use href="#arrow"/></svg></span>
        </a>
      </li>'''


def migalhas(itens):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(itens)]}


def pagina_artigo(p, todos):
    url = f'{SITE}/blog/{p["slug"]}/'
    data = p.get('date', DATA_PADRAO)
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'BlogPosting', 'headline': p['title'], 'description': p['metaDescription'],
         'keywords': ', '.join(p['tags']), 'articleSection': p['category'], 'inLanguage': 'pt-BR',
         'datePublished': data, 'dateModified': p.get('updated', data), 'image': OG,
         'mainEntityOfPage': url, 'url': url, 'author': AUTOR, 'publisher': EDITORA},
        migalhas([('Início', SITE + '/'), ('Blog', SITE + '/blog/'), (p['title'], url)])]}
    # Relacionados: primeiro a mesma categoria, depois a ordem do blog
    outros = [x for x in todos if x['slug'] != p['slug']]
    rel = ([x for x in outros if x['category'] == p['category']] + [x for x in outros if x['category'] != p['category']])[:3]
    tags = ''.join(f'<li>#{e(t)}</li>' for t in p['tags'])
    cta = wa_link(f'Olá! Li o artigo "{p["title"]}" no blog e quero saber mais sobre o acompanhamento.')
    partilha = wa_link(f'{p["title"]} {url}')
    return head(p['metaTitle'], p['metaDescription'], url, 'article', ld, ', '.join(p['tags'])) + f'''
<main id="conteudo">
  <article class="post">
    <header class="post__head wrap narrow">
      <nav class="crumbs" aria-label="Você está em"><a href="/">Início</a><span aria-hidden="true">/</span><a href="/blog/">Blog</a><span aria-hidden="true">/</span><span>{e(p['category'])}</span></nav>
      <p class="kicker">{e(p['category'])} · {e(p['readingTime'])}</p>
      <h1 class="post__t">{e(p['title'])}</h1>
      <p class="post__ex">{e(p['excerpt'])}</p>
      <p class="byline"><svg aria-hidden="true"><use href="#mono"/></svg><span><b>Nítio Mendes</b>Nutricionista · {CRN}</span></p>
    </header>
    <div class="prose wrap narrow">
      {corpo(p['content'])}
      <ul class="tags" aria-label="Assuntos">{tags}</ul>
      <p class="share"><a href="{partilha}" target="_blank" rel="noopener" data-wa="blog_compartilhar"><svg aria-hidden="true"><use href="#wa"/></svg>Compartilhar no WhatsApp</a></p>
    </div>
  </article>

  <section class="cta wrap narrow" aria-labelledby="cta-t">
    <svg class="cta__mono" aria-hidden="true"><use href="#mono"/></svg>
    <h2 class="cta__t" id="cta-t">Quer aplicar isso <em>na sua rotina?</em></h2>
    <p>Chame a nossa equipe no WhatsApp. Ela faz algumas perguntas rápidas para entender o seu contexto e, se fizer sentido para você, agenda a sua pré-consulta com o Nítio, online e sem custo.</p>
    <a class="btn" href="{cta}" target="_blank" rel="noopener" data-wa="blog_artigo"><svg aria-hidden="true"><use href="#wa"/></svg>Falar com a equipe</a>
  </section>

  <section class="more wrap" aria-labelledby="more-t">
    <h2 class="more__t" id="more-t">Mais artigos</h2>
    <ul class="grid">
      {''.join(cartao(x, 'h3') for x in rel)}
    </ul>
    <p class="more__all"><a href="/blog/">Ver todos os artigos</a></p>
  </section>
</main>
''' + RODAPE


def pagina_indice(todos):
    url = SITE + '/blog/'
    desc = 'Artigos clínicos do nutricionista Nítio Mendes sobre metabolismo, composição corporal, performance, exames e o uso de tirzepatida e semaglutida. Conteúdo baseado em prática clínica real, não em modismo.'
    ld = {'@context': 'https://schema.org', '@graph': [
        {'@type': 'Blog', '@id': url + '#blog', 'name': 'Blog Nítio Mendes', 'description': desc, 'url': url,
         'inLanguage': 'pt-BR', 'author': AUTOR, 'publisher': EDITORA,
         'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': f'{SITE}/blog/{p["slug"]}/',
                       'datePublished': p.get('date', DATA_PADRAO)} for p in todos]},
        migalhas([('Início', SITE + '/'), ('Blog', url)])]}
    cats = []
    for p in todos:
        if p['category'] not in cats:
            cats.append(p['category'])
    filtros = '<button type="button" class="chip" aria-pressed="true" data-filter="">Todos</button>' + ''.join(
        f'<button type="button" class="chip" aria-pressed="false" data-filter="{slug_cat(c)}">{e(c)}</button>' for c in cats)
    return head('Blog · Nítio Mendes, nutricionista em Contagem, MG e online', desc, url, 'website', ld) + f'''
<main id="conteudo">
  <section class="intro wrap">
    <p class="kicker">Conteúdo clínico</p>
    <h1 class="intro__t">Nutrição sem <em>modismo</em></h1>
    <p class="intro__lead">Artigos sobre nutrição clínica, metabolismo, composição corporal, performance e o uso de medicamentos como tirzepatida e semaglutida. Conteúdo baseado em prática clínica real.</p>
  </section>
  <section class="wrap" aria-label="Artigos">
    <div class="chips" role="group" aria-label="Filtrar por assunto" data-filters hidden>{filtros}</div>
    <ul class="grid" data-grid>
      {''.join(cartao(p) for p in todos)}
    </ul>
  </section>
  <section class="cta wrap narrow" aria-labelledby="cta-t">
    <svg class="cta__mono" aria-hidden="true"><use href="#mono"/></svg>
    <h2 class="cta__t" id="cta-t">Pronto para <em>começar?</em></h2>
    <p>O acompanhamento tem vagas limitadas para manter o padrão de proximidade. Chame a nossa equipe no WhatsApp para entender se faz sentido para você.</p>
    <a class="btn" href="{wa_link('Olá! Vim pelo blog e quero saber mais sobre o acompanhamento.')}" target="_blank" rel="noopener" data-wa="blog_indice"><svg aria-hidden="true"><use href="#wa"/></svg>Falar com a equipe</a>
  </section>
</main>
''' + RODAPE


def atualizar_sitemap(todos):
    caminho = RAIZ / 'sitemap.xml'
    s = caminho.read_text(encoding='utf-8')
    s = re.sub(r'\n  <!-- blog -->.*?<!-- /blog -->', '', s, flags=re.S)
    linhas = [f'  <url><loc>{SITE}/blog/</loc><lastmod>{DATA_PADRAO}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>']
    linhas += [f'  <url><loc>{SITE}/blog/{p["slug"]}/</loc><lastmod>{p.get("updated", p.get("date", DATA_PADRAO))}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>' for p in todos]
    bloco = '\n  <!-- blog -->\n' + '\n'.join(linhas) + '\n  <!-- /blog -->'
    s = s.replace('\n</urlset>', bloco + '\n</urlset>')
    caminho.write_text(s, encoding='utf-8', newline='\n')


def main():
    todos = json.loads(DADOS.read_text(encoding='utf-8'))
    pasta = RAIZ / 'blog'
    pasta.mkdir(exist_ok=True)
    (pasta / 'index.html').write_text(pagina_indice(todos), encoding='utf-8', newline='\n')
    for p in todos:
        d = pasta / p['slug']
        d.mkdir(exist_ok=True)
        (d / 'index.html').write_text(pagina_artigo(p, todos), encoding='utf-8', newline='\n')
    atualizar_sitemap(todos)
    print(f'{len(todos)} artigos gerados em blog/')


if __name__ == '__main__':
    main()
