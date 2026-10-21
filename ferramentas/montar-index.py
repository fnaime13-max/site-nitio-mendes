"""Monta as partes repetitivas do index.html (rodar de novo após editar especialidades ou FAQ).

- <!--SPECS--> / <!--DIALOGS-->: as 12 especialidades com o texto integral, tiradas de
  ferramentas/especialidades.html (fonte única; editar lá).
- <!--FAQ-LD-->: JSON-LD FAQPage gerado a partir das <details class="qa"> do próprio index,
  para o texto do Google ser sempre igual ao da página.
- <!--SERVICES-LD-->: um "Service" por especialidade.

Uso: python ferramentas/montar-index.py
"""
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
INDEX = ROOT / 'index.html'
SRC = ROOT / 'ferramentas' / 'especialidades.html'
SITE = 'https://nitiomendes.com.br/'

page = INDEX.read_text(encoding='utf-8')
src = SRC.read_text(encoding='utf-8')


def between(text, start, end):
    """Substitui o conteúdo entre dois marcadores (mantém os marcadores)."""
    a = text.index(start) + len(start)
    b = text.index(end, a)
    return a, b


def strip_tags(s):
    return html.unescape(re.sub(r'<[^>]+>', '', s)).strip()


# ---------- especialidades ----------
items = re.findall(r'<li class="spec[^"]*" id="especialidade-([\w-]+)"[^>]*>(.*?)</li>', src, re.S)
dialogs = re.findall(r'(<dialog class="sheet".*?</dialog>)', src, re.S)
assert len(items) == 12 and len(dialogs) == 12, (len(items), len(dialogs))

INCL = ('<ul class="sheet__incl">'
        '<li>Consultas com o nutricionista Nítio Mendes</li>'
        '<li>Plano alimentar individualizado</li>'
        '<li>Aplicativo exclusivo de dieta</li>'
        '<li>Checkpoints com ajustes quinzenais</li>'
        '<li>Grupo exclusivo com a equipe e Grupo VIP</li>'
        '<li>Suporte diário via WhatsApp</li></ul>')

spec_html, dlg_html, services = [], [], []
for (slug, inner), dlg in zip(items, dialogs):
    title = strip_tags(re.search(r'<span class="spec__t">(.*?)</span>', inner, re.S).group(1))
    desc = strip_tags(re.search(r'<span class="spec__d">(.*?)</span>', inner, re.S).group(1))
    spec_html.append(f'      <li class="spec rv" id="especialidade-{slug}">{inner.strip()}</li>')

    wa = 'https://wa.me/5531992748134?text=' + quote(
        f'Olá, Nítio! Vim pelo site e tenho interesse no acompanhamento para: {title}.', safe='')
    d = dlg
    d = re.sub(r'<ul class="sheet__incl">.*?</ul>', INCL, d, flags=re.S)
    d = d.replace('Especialidade clínica ·', 'Especialidade ·')
    d = re.sub(r'utm_content=especialidade"', f'utm_content=especialidade_{slug}"', d)
    d = re.sub(r'<a class="btn" href="aplicacao', '<a class="btn btn--gold" data-apply href="aplicacao', d)
    d = re.sub(r'<a class="lnk" href="https://wa\.me/[^"]*"', f'<a class="btn btn--line" data-wa="especialidade" href="{html.escape(wa)}"', d)
    d = d.replace('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
                  '<svg aria-hidden="true"><use href="#close"/></svg>')
    dlg_html.append(d)

    services.append({
        '@type': 'Service',
        '@id': f'{SITE}#especialidade-{slug}',
        'name': title,
        'description': desc,
        'url': f'{SITE}#especialidade-{slug}',
        'serviceType': 'Acompanhamento nutricional',
        'provider': {'@id': f'{SITE}#negocio'},
        'areaServed': ['Contagem, MG', 'Belo Horizonte, MG', 'Brasil'],
    })

a, b = between(page, '<ul class="specs">', '    </ul>')
page = page[:a] + '\n<!--SPECS-->\n' + '\n'.join(spec_html) + '\n<!--/SPECS-->\n' + page[b:]

# só substitui o bloco já marcado (<!--DIALOGS--> … <!--/DIALOGS-->) ou o marcador vazio
page = re.sub(r'<!--DIALOGS-->(?:.*?<!--/DIALOGS-->)?',
              lambda m: '<!--DIALOGS-->\n' + '\n'.join(dlg_html) + '\n<!--/DIALOGS-->', page, count=1, flags=re.S)

# ---------- JSON-LD: serviços ----------
svc = ',\n    '.join(json.dumps(s, ensure_ascii=False) for s in services)
page = re.sub(r'(<!--SERVICES-LD-->|,\n    \{"@type": "Service".*?(?=\n  \]\n\}))',
              lambda m: ',\n    ' + svc, page, count=1, flags=re.S)

# ---------- JSON-LD: FAQ ----------
qas = re.findall(r'<details class="qa"><summary>(?:<span class="qa__i"[^>]*></span>)?<span class="qa__q">(.*?)</span>.*?<div class="qa__a">(.*?)</div></details>', page, re.S)
faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    'mainEntity': [{'@type': 'Question', 'name': strip_tags(q),
                    'acceptedAnswer': {'@type': 'Answer', 'text': ' '.join(strip_tags(p) for p in re.findall(r'<p>(.*?)</p>', a_, re.S))}}
                   for q, a_ in qas],
}
block = '<!--FAQ-LD-->\n<script type="application/ld+json">\n' + json.dumps(faq, ensure_ascii=False) + '\n</script>\n<!--/FAQ-LD-->'
page = re.sub(r'<!--FAQ-LD-->(.*?<!--/FAQ-LD-->)?', lambda m: block, page, count=1, flags=re.S)

INDEX.write_text(page, encoding='utf-8')
print(f'especialidades: {len(items)} · perguntas no FAQPage: {len(qas)}')

# os botões "Aplicar" das especialidades recém-geradas vão para o WhatsApp da atendente
import runpy
runpy.run_path(str(ROOT / 'ferramentas' / 'aplicar-whatsapp.py'), run_name='__main__')
