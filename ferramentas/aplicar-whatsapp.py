"""Troca os botões "Aplicar" do index.html por links diretos para o WhatsApp
da atendente comercial (as perguntas da aplicação são feitas lá).

Cada botão leva uma mensagem pronta; nos planos e nas especialidades a
mensagem já diz o interesse. O utm_content antigo vira data-local, para o
evento clique_aplicar continuar dizendo de qual botão veio o contato.

Rode depois de ferramentas/montar-index.py (que regenera as especialidades).
Uso: python ferramentas/aplicar-whatsapp.py
"""
import html
import re
from pathlib import Path
from urllib.parse import quote

ATENDENTE = '5531999670406'
ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'

page = INDEX.read_text(encoding='utf-8')
titles = dict(re.findall(r'data-spec-open="([\w-]+)"[^>]*>\s*<span class="spec__n">\d+</span><span class="spec__t">(.*?)</span>', page, re.S))


def message(local: str) -> str:
    base = 'Olá! Vim pelo site e quero fazer minha aplicação para o Planejamento Nutricional Estratégico.'
    if local == 'plano_anual':
        return base + ' Tenho interesse no plano Anual (12 meses).'
    if local == 'plano_semestral':
        return base + ' Tenho interesse no plano Semestral (6 meses).'
    if local == 'online':
        return base + ' Tenho interesse no atendimento online.'
    if local.startswith('especialidade_'):
        t = titles.get(local[len('especialidade_'):])
        if t:
            return base + f' Tenho interesse em: {html.unescape(t)}.'
    return base


def swap(m):
    local = re.search(r'utm_content=([\w-]+)', html.unescape(m.group(2)))
    local = local.group(1) if local else 'site'
    url = f'https://wa.me/{ATENDENTE}?text=' + quote(message(local), safe='')
    attrs = m.group(1) + m.group(3)
    attrs = re.sub(r'\s*(target|rel)="[^"]*"', '', attrs)
    return f'<a{attrs} href="{html.escape(url)}" target="_blank" rel="noopener" data-local="{local}"'


n = 0
def counted(m):
    global n; n += 1; return swap(m)


page = re.sub(r'<a([^>]*?)\s+href="(aplicacao\.html[^"]*)"([^>]*?)(?=\s*(?:data-apply|>))', counted, page)
assert 'href="aplicacao.html' not in page, 'sobrou link para aplicacao.html'
INDEX.write_text(page, encoding='utf-8')
print(f'botões de aplicar trocados: {n}')
