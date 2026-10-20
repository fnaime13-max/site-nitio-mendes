"""Embute css/tokens.css + css/site.css (minificados) dentro do index.html.

Por quê: um <link rel="stylesheet"> no <head> bloqueia a renderização
(PageSpeed: "Solicitações que bloquearam a renderização"). Com o CSS
embutido, a página pinta sem esperar outro arquivo.

Edite os arquivos em css/ normalmente e rode depois:
    python ferramentas/embutir-css.py
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'


def minify(css: str) -> str:
    css = re.sub(r'/\*.*?\*/', '', css, flags=re.S)
    css = re.sub(r'\s+', ' ', css)
    css = re.sub(r'\s*([{}:;,>])\s*', r'\1', css)
    css = css.replace(';}', '}')
    return css.strip()


css = minify((ROOT / 'css/tokens.css').read_text(encoding='utf-8') + '\n' + (ROOT / 'css/site.css').read_text(encoding='utf-8'))
block = f'<!--CSS-->\n<style>{css}</style>\n<!--/CSS-->'
page = INDEX.read_text(encoding='utf-8')
links = re.compile(r'<link rel="stylesheet" href="css/tokens\.css[^"]*">\s*<link rel="stylesheet" href="css/site\.css[^"]*">')
if '<!--CSS-->' in page:
    page = re.sub(r'<!--CSS-->.*?<!--/CSS-->', lambda m: block, page, count=1, flags=re.S)
else:
    assert links.search(page), 'links de CSS não encontrados'
    page = links.sub(lambda m: block, page, count=1)
INDEX.write_text(page, encoding='utf-8')
print(f'CSS embutido: {len(css) // 1024} KB')
