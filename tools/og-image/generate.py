"""Writes the Open Graph card templates (az.html, ru.html, en.html) into the given folder.
Text comes from src/i18n/<lang>.json; render each at 1200x630 (see README.md)."""
import json, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(sys.argv[1] if len(sys.argv) > 1 else '.')
OUT.mkdir(parents=True, exist_ok=True)

# Same spines as the hero (src/components/Hero.astro): key, width, height, background, text, shade.
SPINES = [
    ('novel', 46, 250, '#B8323F', '#F4EDE1', .22), ('poetry', 34, 200, '#E9A83A', '#0A2523', .18),
    ('history', 56, 290, '#F4EDE1', '#0A2523', .14), ('philosophy', 40, 230, '#2C6B63', '#F4EDE1', .22),
    ('tales', 50, 270, '#7A1F2B', '#F4EDE1', .25), ('drama', 38, 210, '#D9C9A8', '#0A2523', .14),
    ('biography', 54, 300, '#1D5A52', '#F4EDE1', .25), ('scifi', 44, 240, '#C9852C', '#0A2523', .18),
    ('essays', 48, 260, '#8FB5AC', '#0A2523', .16),
]
SCALE = 1.18

TEMPLATE = '<!doctype html><html lang="{lang}"><head><meta charset="utf-8">\n<link href="https://fonts.googleapis.com/css2?family=Literata:ital,opsz,wght@1,7..72,700&family=Manrope:wght@600;700;800&display=block" rel="stylesheet">\n<style>\n*{{box-sizing:border-box}}html,body{{margin:0}}\nbody{{width:1200px;height:630px;overflow:hidden;background:#12403C;position:relative;font-family:Manrope,sans-serif;color:#F4EDE1}}\n.glow{{position:absolute;inset:0;background:radial-gradient(700px 420px at 85% 30%,rgba(143,181,172,.16),transparent 70%)}}\n.text{{position:absolute;left:80px;top:96px;width:520px}}\n.mark{{font-family:Literata,serif;font-style:italic;font-weight:700;font-size:92px;line-height:1;letter-spacing:-.01em}}\n.tag{{margin-top:34px;font-size:46px;line-height:1.14;font-weight:800;letter-spacing:-.02em}}\n.url{{position:absolute;left:80px;bottom:46px;font-size:26px;font-weight:700;color:#0A2523;letter-spacing:.01em}}\n.shelf{{position:absolute;right:72px;bottom:118px;display:flex;align-items:flex-end;gap:0}}\n.spine{{border-radius:3px 3px 1px 1px;box-shadow:inset 0 22px 0 -16px var(--s),inset 0 -22px 0 -16px var(--s);display:flex;align-items:center;justify-content:center}}\n.spine span{{writing-mode:vertical-rl;transform:rotate(180deg);font-size:17px;font-weight:700;letter-spacing:.04em;white-space:nowrap}}\n.spine:last-child{{transform:rotate(-9deg);transform-origin:left bottom;margin-left:40px}}\n.board{{position:absolute;left:0;right:0;bottom:100px;height:18px;background:#E9A83A;box-shadow:0 10px 0 -2px #0A2523}}\n.foot{{position:absolute;left:0;right:0;bottom:0;height:100px;background:#E9A83A}}\n</style></head><body><div class="glow"></div>\n<div class="text"><div class="mark">Libramigo</div><div class="tag">{title}</div></div>\n<div class="shelf">{shelf}</div><div class="board"></div><div class="foot"></div><div class="url">libramigo.az</div>\n</body></html>'

for lang in ('az', 'ru', 'en'):
    d = json.loads((ROOT / 'src' / 'i18n' / f'{lang}.json').read_text(encoding='utf-8'))
    shelf = ''.join(
        f'<div class="spine" style="width:{round(w * SCALE)}px;height:{round(h * SCALE)}px;'
        f'background:{bg};color:{fg};--s:rgba(0,0,0,{s})"><span>{d["hero"]["genres"][key]}</span></div>'
        for key, w, h, bg, fg, s in SPINES
    )
    (OUT / f'{lang}.html').write_text(TEMPLATE.format(lang=lang, title=d['hero']['title'], shelf=shelf), encoding='utf-8')
    print('wrote', OUT / f'{lang}.html')
