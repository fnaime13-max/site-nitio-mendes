"""Gera as versões otimizadas de uma foto para o site.

Uso:  python ferramentas/gerar-fotos.py CAMINHO_DA_FOTO NOME
NOME: nitio-retrato | consultorio-mesa | consultorio-logo | consultorio-sofa |
      consultorio-detalhes | livro-neuroemocional | ebook-emagreca
Cria assets/images/NOME-640.(webp|jpg) e NOME-1100.(webp|jpg).
"""
import sys, pathlib
from PIL import Image, ImageOps

src, name = sys.argv[1], sys.argv[2]
out = pathlib.Path(__file__).resolve().parent.parent / 'assets' / 'images'
im = Image.open(src)
im = ImageOps.exif_transpose(im)
if im.mode in ('RGBA', 'LA', 'P'):
    bg = Image.new('RGB', im.size, (17, 17, 17))
    im = im.convert('RGBA'); bg.paste(im, mask=im.split()[-1]); im = bg
im = im.convert('RGB')
for w in (640, 1100):
    r = im if im.width <= w else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
    r.save(out / f'{name}-{w}.webp', quality=80, method=6)
    r.save(out / f'{name}-{w}.jpg', quality=82, optimize=True, progressive=True)
print('ok:', name, im.size)
