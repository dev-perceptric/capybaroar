"""Writes the CapyInfographic starter library into capy/templates/: standalone HTML files, one per layout, each a fixed
canvas with the brand's style in CSS variables at the top. Claude reads these as worked examples and writes a new page
in the same way for each request; the render worker turns the page into a PNG. No JavaScript, no outside requests:
fonts and photos load from capy/templates/fonts and capy/templates/img. Run: python3 capy/build_templates.py"""
import os, json

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'templates')

# ---------- brand themes (what the website scan fills in) ----------
LOGOS = {
    'lumen': '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" fill="var(--accent)"/><circle cx="26" cy="15" r="13" fill="var(--bg)"/></svg>',
    'ledgerly': '<svg viewBox="0 0 40 40"><rect x="4" y="22" width="8" height="14" rx="2" fill="var(--accent)"/><rect x="16" y="13" width="8" height="23" rx="2" fill="var(--accent)" opacity=".7"/><rect x="28" y="4" width="8" height="32" rx="2" fill="var(--accent)" opacity=".45"/></svg>',
    'maya': '<svg viewBox="0 0 40 40"><path d="M4 30 14 10l6 12 6-12 10 20" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linejoin="miter"/></svg>',
    'northwind': '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="none" stroke="var(--ink)" stroke-width="2.5"/><path d="M20 6 25 20H15z" fill="var(--accent)"/><path d="M20 34 15 20h10z" fill="var(--ink)"/></svg>',
    'taco': '<svg viewBox="0 0 40 40"><path d="M3 26a17 17 0 0 1 34 0z" fill="var(--accent)"/><circle cx="13" cy="18" r="2.5" fill="var(--ink)"/><circle cx="21" cy="14" r="2.5" fill="var(--ink)"/><circle cx="28" cy="19" r="2.5" fill="var(--ink)"/></svg>',
    'capy': '<svg viewBox="0 0 40 40"><rect width="40" height="40" rx="11" fill="var(--accent)"/><circle cx="20" cy="21" r="10" fill="none" stroke="var(--accent-ink)" stroke-width="3.5"/><circle cx="20" cy="21" r="3.5" fill="var(--accent-ink)"/></svg>',
}

THEMES = {
    'lumen': dict(name='Lumen Coffee', handle='@lumencoffee', logo='lumen', bg='#F6EFE6', surface='#FFFFFF', ink='#2B1D14', muted='#7A6A5D', line='#E6D9CB',
                  accent='#C8553D', accent_ink='#FFFFFF', accent_text='#C8553D', accent2='#E9B872', head="'Fraunces'", head_w='700', head_ls='-0.02em', body="'Inter'", radius='28px'),
    'ledgerly': dict(name='Ledgerly', handle='ledgerly.com', logo='ledgerly', bg='#0E1A2B', surface='#16263D', ink='#F3F6FA', muted='#9FB0C6', line='#26384F',
                     accent='#3DDC97', accent_ink='#06281A', accent_text='#3DDC97', accent2='#6EA8FE', head="'Space Grotesk'", head_w='700', head_ls='-0.03em', body="'Inter'", radius='18px'),
    'maya': dict(name='Maya Moves', handle='@mayamoves', logo='maya', bg='#111111', surface='#1E1E1E', ink='#FFFFFF', muted='#A3A3A3', line='#2E2E2E',
                 accent='#D7FF3A', accent_ink='#111111', accent_text='#D7FF3A', accent2='#FF5C8A', head="'Archivo Black'", head_w='400', head_ls='-0.01em', body="'Inter'", radius='0px'),
    'northwind': dict(name='Northwind Studio', handle='northwind.studio', logo='northwind', bg='#FFFFFF', surface='#F4F4F2', ink='#111111', muted='#6B6B6B', line='#E4E4E0',
                      accent='#2F54EB', accent_ink='#FFFFFF', accent_text='#2F54EB', accent2='#FFB547', head="'DM Serif Display'", head_w='400', head_ls='-0.01em', body="'Inter'", radius='6px'),
    'taco': dict(name='Taco Luna', handle='@tacoluna', logo='taco', bg='#FF5A36', surface='#FFF3E6', ink='#1E1B18', muted='#5A4A40', line='#F2C9A8',
                 accent='#FFD23F', accent_ink='#1E1B18', accent_text='#1E1B18', accent2='#1E1B18', head="'Bricolage Grotesque'", head_w='800', head_ls='-0.035em', body="'Inter'", radius='32px'),
    'capy': dict(name='Capybaroar', handle='capybaroar.com', logo='capy', bg='#FFFFFF', surface='#FAFAFA', ink='#171717', muted='#737373', line='#EBEBEB',
                 accent='#FFD202', accent_ink='#262209', accent_text='#171717', accent2='#333333', head="'Inter'", head_w='800', head_ls='-0.045em', body="'Inter'", radius='24px'),
}

FONTS = [('Inter', 'inter', [400, 500, 600, 700, 800]), ('Fraunces', 'fraunces', [400, 600, 700]), ('Space Grotesk', 'space-grotesk', [400, 500, 700]),
         ('Archivo Black', 'archivo-black', [400]), ('DM Serif Display', 'dm-serif-display', [400]), ('Bricolage Grotesque', 'bricolage-grotesque', [400, 600, 800]),
         ('Poppins', 'poppins', [400, 600, 700, 800]), ('Montserrat', 'montserrat', [400, 600, 700, 800]), ('DM Sans', 'dm-sans', [400, 500, 700]),
         ('Playfair Display', 'playfair-display', [400, 700]), ('Manrope', 'manrope', [400, 600, 800]), ('Lora', 'lora', [400, 600, 700])]


def font_faces():
    out = []
    for fam, slug, ws in FONTS:
        for w in ws:
            out.append(f"@font-face{{font-family:'{fam}';font-weight:{w};font-style:normal;font-display:block;src:url(fonts/{slug}-latin-{w}-normal.woff2) format('woff2')}}")
    out.append("@font-face{font-family:'DM Serif Display';font-weight:400;font-style:italic;font-display:block;src:url(fonts/dm-serif-display-latin-400-italic.woff2) format('woff2')}")
    return '\n'.join(out)


BASE = """*{box-sizing:border-box;margin:0;padding:0}
html,body{width:var(--w);height:var(--h);overflow:hidden}
body{background:var(--bg);color:var(--ink);font:400 30px/1.4 var(--body),system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.canvas{position:relative;width:var(--w);height:var(--h);padding:var(--pad);display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:14px;font:600 26px/1 var(--body);letter-spacing:-.01em}
.brand svg{width:40px;height:40px;flex-shrink:0}
.brand .logo{height:44px;width:auto;max-width:280px;object-fit:contain;flex-shrink:0}
.kicker{display:inline-flex;align-self:flex-start;align-items:center;gap:10px;font:600 22px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--accent-text)}
.chip{display:inline-flex;align-self:flex-start;align-items:center;height:48px;padding:0 22px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font:600 22px/1 var(--body)}
.h{font-family:var(--head);font-weight:var(--head-w);letter-spacing:var(--head-ls);line-height:1.02;text-wrap:balance}
.muted{color:var(--muted)}
.accent{color:var(--accent-text)}
/* Accent as text uses --accent-text: the accent where it reads well on the background, the ink where it doesn't. */
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;font-size:22px;line-height:1.3;color:var(--muted)}
.card{background:var(--surface);border-radius:var(--radius)}
.ph{background:var(--line);overflow:hidden}
.ph img{display:block;width:100%;height:100%;object-fit:cover}
"""


def theme_vars(t, w, h, pad):
    return (f":root{{--w:{w}px;--h:{h}px;--pad:{pad}px;--bg:{t['bg']};--surface:{t['surface']};--ink:{t['ink']};--muted:{t['muted']};--line:{t['line']};"
            f"--accent:{t['accent']};--accent-ink:{t['accent_ink']};--accent-2:{t['accent2']};--accent-text:{t['accent_text']};--mark:{t['accent'] if t['accent_text'] != t['accent'] else 'transparent'};--head:{t['head']};--head-w:{t['head_w']};--head-ls:{t['head_ls']};"
            f"--body:{t['body']};--radius:{t['radius']}}}")


EXPORT = False  # True while writing the app's examples: logo and photos point at the render host


def brand(t):
    if EXPORT:
        return '<div class="brand"><img class="logo" src="https://capy.local/logo" alt=""><span>Brand name</span></div>'
    return f'<div class="brand">{LOGOS[t["logo"]]}<span>{t["name"]}</span></div>'


def page(slug, title, theme, size, body, css, pad=80, meta=None):
    t = THEMES[theme]
    w, h = size
    info = {'layout': slug, 'size': f'{w}x{h}', 'theme': theme}
    info.update(meta or {})
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{title}</title>
<!-- capy-template {json.dumps(info)} -->
<style>
/* Brand: filled from the brand's style card. Change these and the whole design follows. */
{theme_vars(t, w, h, pad)}
{font_faces()}
{BASE}
/* Layout */
{css}
</style>
</head>
<body>
<main class="canvas">
{body}
</main>
</body>
</html>
"""


T = {}  # slug -> (title, default theme, size, builder(theme) -> (body, css), meta)


def tpl(slug, title, theme, size, meta=None):
    def deco(fn):
        T[slug] = (title, theme, size, fn, meta or {})
        return fn
    return deco


SQ, PT, ST, LI, YT = (1080, 1080), (1080, 1350), (1080, 1920), (1200, 627), (1280, 720)


# ====================================================================================== square
@tpl('big-stat', 'One big number', 'ledgerly', SQ, {'use': 'A single striking number with what it means and where it came from.'})
def _(t):
    return f"""{brand(t)}
<div class="stat-wrap">
<p class="kicker">Small business survey 2026</p>
<p class="h stat">73<span>%</span></p>
<p class="h lead">of owners now check their cash flow every week.</p>
<p class="muted sub">Up from 51% in 2024.</p>
</div>
<div class="foot"><span>Source: [your source]</span><span>{t['handle']}</span></div>""", """
.stat-wrap{margin-top:auto;display:flex;flex-direction:column;gap:22px}
.stat{font-size:420px;line-height:.84;color:var(--accent-text);margin-top:8px;align-self:flex-start;background:linear-gradient(transparent 78%,var(--mark) 78%,var(--mark) 92%,transparent 92%)}
.stat span{font-size:.5em;vertical-align:.62em;margin-left:6px}
.lead{font-size:68px;max-width:880px}
.sub{font-size:30px}
.foot{margin-top:72px}
"""


@tpl('stat-grid', 'Four numbers', 'northwind', SQ, {'use': 'A year in review, results of a campaign, or any 3 to 4 numbers side by side.'})
def _(t):
    cards = [('48', 'brands launched'), ('2.1M', 'people reached'), ('312', 'videos made'), ('97%', 'clients stayed')]
    items = ''.join(f'<div class="card cell"><p class="h n">{n}</p><p class="muted l">{l}</p></div>' for n, l in cards)
    return f"""{brand(t)}
<h1 class="h title">Our 2026 <em>in numbers</em></h1>
<div class="grid">{items}</div>""", """
.title{font-size:96px;margin:56px 0 48px}
.title em{font-style:italic;color:var(--accent-text)}
.grid{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:20px}
.cell{display:flex;flex-direction:column;justify-content:flex-end;padding:36px}
.n{font-size:120px;line-height:.9}
.l{font-size:30px;margin-top:12px}
.cell:first-child{background:var(--accent);color:var(--accent-ink)}
.cell:first-child .l{color:inherit;opacity:.8}
"""


@tpl('steps', 'Numbered steps', 'taco', SQ, {'use': 'How to do something in 3 to 5 steps.'})
def _(t):
    steps = [('Pick your tacos', 'Choose 3 fillings from the menu.'), ('Tell us the date', 'At least 2 days ahead.'),
             ('Add the extras', 'Salsas, chips and agua fresca.'), ('We bring it hot', 'Set up and ready to serve.')]
    li = ''.join(f'<li><span class="num">{k + 1}</span><div><p class="st">{a}</p><p class="sd">{b}</p></div></li>' for k, (a, b) in enumerate(steps))
    return f"""{brand(t)}
<h1 class="h title">How to order catering</h1>
<ol class="card steps">{li}</ol>
<div class="foot"><span>{t['handle']}</span><span>Order at tacoluna.com/catering</span></div>""", """
body{color:var(--ink)}
.foot{color:var(--ink);opacity:.8}
.title{font-size:92px;margin:44px 0 40px;max-width:860px}
.steps{list-style:none;display:flex;flex-direction:column;padding:16px 40px;background:var(--surface)}
.steps li{display:flex;align-items:center;gap:28px;padding:22px 0;border-bottom:2px dashed var(--line)}
.steps li:last-child{border-bottom:0}
.num{flex-shrink:0;display:flex;align-items:center;justify-content:center;width:76px;height:76px;border-radius:50%;background:var(--accent);font:800 38px/1 var(--head)}
.st{font:700 36px/1.15 var(--body)}
.sd{font-size:26px;color:var(--muted)}
.foot{margin-top:32px}
"""


@tpl('compare', 'This vs that', 'capy', SQ, {'use': 'Two ways of doing something, row by row.'})
def _(t):
    rows = [('Time each week', '6 hours', '45 minutes'), ('Posts missed', 'Often', 'Never'), ('Networks', 'One at a time', '14 at once'), ('Best times', 'A guess', 'From your results')]
    tr = ''.join(f'<div class="row"><p class="rl">{a}</p><p class="old">{b}</p><p class="new">{c}</p></div>' for a, b, c in rows)
    return f"""{brand(t)}
<h1 class="h title">Posting by hand <span class="muted">vs</span> with a queue</h1>
<div class="table">
<div class="row head"><p></p><p>By hand</p><p class="new-h">With a queue</p></div>
{tr}
</div>""", """
.title{font-size:84px;margin:48px 0 44px}
.table{flex:1;display:flex;flex-direction:column;justify-content:space-between}
.row{display:grid;grid-template-columns:1.1fr 1fr 1fr;align-items:center;gap:16px;padding:22px 0;border-top:2px solid var(--line);font-size:32px}
.row.head{border-top:0;padding-top:0;font:600 24px/1 var(--body);color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
.rl{color:var(--muted)}
.old{text-decoration:line-through;text-decoration-color:var(--line);text-decoration-thickness:3px;color:var(--muted)}
.new{font-weight:700;display:inline-flex;align-items:center;gap:12px}
.new::before{content:"";width:34px;height:34px;flex-shrink:0;border-radius:50%;background:var(--accent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='m6 12 4 4 8-8' fill='none' stroke='%23262209' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/22px no-repeat}
.new-h{color:var(--ink)}
"""


@tpl('quote', 'Customer quote', 'lumen', SQ, {'use': 'A review or testimonial in the customer\'s own words.'})
def _(t):
    return f"""{brand(t)}
<div class="q">
<svg class="mark" viewBox="0 0 64 48"><path d="M0 48V28C0 12 8 2 26 0l2 8C18 11 14 17 14 24h12v24zm36 0V28C36 12 44 2 62 0l2 8c-10 3-14 9-14 16h12v24z" fill="var(--accent)"/></svg>
<p class="h text">The oat flat white is the best thing on our street. I come in every morning before work.</p>
</div>
<div class="who"><div class="ph av"><img src="img/ana.webp" alt=""></div><div><p class="nm">Ana Ruiz</p><p class="muted">Regular since 2023</p></div>
<p class="stars">&#9733;&#9733;&#9733;&#9733;&#9733;</p></div>""", """
.q{margin:auto 0;display:flex;flex-direction:column;gap:36px}
.mark{width:96px;height:72px}
.text{font-size:68px;line-height:1.12;font-weight:600}
.who{display:flex;align-items:center;gap:22px;padding-top:36px;border-top:2px solid var(--line)}
.av{width:92px;height:92px;border-radius:50%}
.nm{font:600 30px/1.2 var(--body)}
.stars{margin-left:auto;font-size:40px;letter-spacing:4px;color:var(--accent-text)}
"""


@tpl('bar-chart', 'Bar chart', 'northwind', SQ, {'use': 'Compare 4 to 8 values, with the top one picked out.'})
def _(t):
    data = [('Mon', 62), ('Tue', 81), ('Wed', 74), ('Thu', 100), ('Fri', 58), ('Sat', 33), ('Sun', 41)]
    bars = ''.join(f'<div class="bar{" top" if v == 100 else ""}"><span class="v">{v}</span><span class="b" style="height:{v}%"></span><span class="d">{d}</span></div>' for d, v in data)
    return f"""{brand(t)}
<p class="kicker">Engagement by day</p>
<h1 class="h title">Thursday is your <em>best day</em> to post</h1>
<div class="chart">{bars}</div>
<div class="foot"><span>Average engagement, last 90 days, Thursday = 100</span></div>""", """
.kicker{margin-top:52px}
.title{font-size:80px;margin:20px 0 36px}
.title em{font-style:italic;color:var(--accent-text)}
.chart{flex:1;display:grid;grid-template-columns:repeat(7,1fr);gap:18px;align-items:end}
.bar{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:12px}
.b{width:100%;background:var(--surface);border-radius:var(--radius) var(--radius) 0 0}
.top .b{background:var(--accent)}
.v{font:600 24px/1 var(--body);color:var(--muted)}
.top .v{color:var(--accent-text)}
.d{font:600 24px/1 var(--body)}
.foot{margin-top:28px}
"""


@tpl('donut', 'Donut chart', 'maya', SQ, {'use': 'Parts of a whole: 2 to 4 shares that add up to 100%.'})
def _(t):
    parts = [('Home', 54, 'var(--accent)'), ('Gym', 31, 'var(--accent-2)'), ('Outdoors', 15, 'var(--ink)')]
    r, c = 150, 2 * 3.14159 * 150
    off, arcs, leg = 0, '', ''
    for name, pct, col in parts:
        ln = c * pct / 100
        arcs += f'<circle r="{r}" cx="200" cy="200" fill="none" stroke="{col}" stroke-width="64" stroke-dasharray="{ln - 6:.1f} {c:.1f}" stroke-dashoffset="{-off:.1f}"/>'
        off += ln
        leg += f'<li><span class="sw" style="background:{col}"></span><span class="ln">{name}</span><span class="pc">{pct}%</span></li>'
    return f"""{brand(t)}
<h1 class="h title">WHERE OUR MEMBERS TRAIN</h1>
<div class="body"><svg class="d" viewBox="0 0 400 400"><g transform="rotate(-90 200 200)">{arcs}</g></svg><ul class="leg">{leg}</ul></div>
<div class="foot"><span>2,400 members asked in October</span><span>{t['handle']}</span></div>""", """
.title{font-size:88px;line-height:.95;margin:48px 0 0;max-width:900px}
.body{flex:1;display:flex;align-items:center;gap:64px}
.d{width:440px;height:440px;flex-shrink:0}
.leg{list-style:none;display:flex;flex-direction:column;gap:28px;flex:1}
.leg li{display:flex;align-items:center;gap:18px;font-size:34px;padding-bottom:24px;border-bottom:2px solid var(--line)}
.sw{width:28px;height:28px}
.pc{margin-left:auto;font:400 52px/1 var(--head)}
"""


@tpl('myth-fact', 'Myth and fact', 'maya', SQ, {'use': 'Correct a common belief: the myth, then the fact.'})
def _(t):
    return f"""{brand(t)}
<div class="pair">
<div class="panel myth"><p class="tag">MYTH</p><p class="h txt">You need an hour a day to get strong.</p></div>
<div class="panel fact"><p class="tag">FACT</p><p class="h txt">Three 20-minute sessions a week build real strength.</p></div>
</div>
<div class="foot"><span>{t['handle']}</span><span>Save this for your next excuse</span></div>""", """
.pair{flex:1;display:flex;flex-direction:column;gap:20px;margin:44px 0 36px}
.panel{flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px;padding:44px}
.myth{background:var(--surface)}
.myth .txt{color:var(--muted);text-decoration:line-through;text-decoration-thickness:6px;text-decoration-color:var(--accent-2)}
.fact{background:var(--accent);color:var(--accent-ink)}
.tag{font:800 26px/1 var(--body);letter-spacing:.12em}
.myth .tag{color:var(--accent-2)}
.txt{font-size:62px;line-height:1.02}
"""


@tpl('sale', 'Offer banner', 'lumen', SQ, {'use': 'A sale, discount or limited offer with dates and a code.'})
def _(t):
    return f"""<div class="ph photo"><img src="img/coffee.webp" alt=""></div>
<div class="over">
{brand(t)}
<div class="deal"><p class="h big">20% off</p><p class="h what">every bag of beans</p></div>
<div class="row"><p class="dates">Friday to Sunday</p><p class="code">Code <b>WEEKEND20</b></p></div>
</div>""", """
.canvas{padding:0;flex-direction:row}
.photo{width:44%;height:100%}
.over{flex:1;display:flex;flex-direction:column;padding:72px 64px}
.deal{margin:auto 0}
.big{font-size:150px;line-height:.9;color:var(--accent-text)}
.what{font-size:64px;margin-top:16px}
.row{display:flex;flex-direction:column;gap:18px}
.dates{font:600 30px/1 var(--body)}
.code{align-self:flex-start;padding:18px 24px;border:3px dashed var(--accent);border-radius:16px;font-size:28px}
.code b{font-weight:700;letter-spacing:.06em}
"""


@tpl('hiring', 'We are hiring', 'northwind', SQ, {'use': 'A job opening with the role, the basics and how to apply.'})
def _(t):
    facts = [('Where', 'Lisbon or remote in Europe'), ('Type', 'Full time'), ('Pay', '[salary range]'), ('Start', 'January 2027')]
    rows = ''.join(f'<div class="f"><p class="muted fk">{k}</p><p class="fv">{v}</p></div>' for k, v in facts)
    return f"""{brand(t)}
<p class="chip hire">We're hiring</p>
<h1 class="h title">Senior Product <em>Designer</em></h1>
<div class="facts">{rows}</div>
<div class="foot apply"><span>Apply at northwind.studio/jobs</span><span class="arrow">&rarr;</span></div>""", """
.hire{margin-top:64px}
.title{font-size:112px;margin:28px 0 auto}
.title em{font-style:italic;color:var(--accent-text)}
.facts{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin:40px 0}
.f{padding:22px 0;border-top:2px solid var(--line)}
.fk{font-size:22px}
.fv{font:600 30px/1.3 var(--body)}
.apply{padding:28px 32px;background:var(--ink);color:#fff;border-radius:var(--radius);font:600 30px/1 var(--body);align-items:center}
.arrow{font-size:40px}
"""


# ====================================================================================== portrait 4:5
@tpl('checklist', 'Checklist', 'lumen', PT, {'use': 'Tips or a checklist of 4 to 6 short items.'})
def _(t):
    items = ['Fresh beans, roasted in the last 3 weeks', 'Grind right before you brew', 'Water just off the boil, 94&deg;C', 'One gram of coffee for every 16 of water', 'Pour slowly for 3 minutes']
    li = ''.join(f'<li><span class="box"></span><span>{x}</span></li>' for x in items)
    return f"""{brand(t)}
<p class="kicker">Brew guide</p>
<h1 class="h title">5 steps to better coffee at home</h1>
<ul class="list card">{li}</ul>
<div class="foot"><span>{t['handle']}</span><span>Save it for tomorrow morning</span></div>""", """
.kicker{margin-top:64px}
.title{font-size:96px;margin:20px 0 48px}
.list{list-style:none;padding:20px 44px}
.list li{display:flex;align-items:center;gap:26px;padding:28px 0;border-bottom:2px solid var(--line);font-size:34px;line-height:1.25}
.list li:last-child{border-bottom:0}
.box{flex-shrink:0;width:48px;height:48px;border-radius:14px;background:var(--accent) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='m6 12 4 4 8-8' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/30px no-repeat}
.foot{margin-top:40px}
"""


@tpl('timeline', 'Timeline', 'northwind', PT, {'use': 'A plan, a history or a roadmap: 4 to 6 dated moments.'})
def _(t):
    ms = [('Week 1', 'Discovery', 'Interviews, audit and goals'), ('Week 2', 'Brand', 'Logo, colors and type'), ('Week 4', 'Website', 'Design and build'),
          ('Week 6', 'Content', 'First month of posts'), ('Week 8', 'Launch', 'Live, with a report every month')]
    li = ''.join(f'<li class="{"now" if k == 4 else ""}"><p class="when">{a}</p><span class="dot"></span><div><p class="what">{b}</p><p class="muted">{c}</p></div></li>' for k, (a, b, c) in enumerate(ms))
    return f"""{brand(t)}
<h1 class="h title">From kickoff to <em>launch</em> in 8 weeks</h1>
<ol class="tl">{li}</ol>
<div class="foot"><span>{t['handle']}</span></div>""", """
.title{font-size:96px;margin:56px 0 56px}
.title em{font-style:italic;color:var(--accent-text)}
.tl{list-style:none;position:relative;flex:1;display:flex;flex-direction:column;justify-content:space-between}
.tl::before{content:"";position:absolute;left:206px;top:20px;bottom:40px;width:3px;background:var(--line)}
.tl li{position:relative;display:grid;grid-template-columns:170px 72px 1fr;align-items:start;font-size:28px}
.when{font:600 26px/1.6 var(--body);color:var(--muted);text-align:right;padding-right:6px}
.dot{width:26px;height:26px;margin:10px auto 0;border-radius:50%;background:var(--bg);border:4px solid var(--ink);position:relative;z-index:1}
.now .dot{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 10px rgba(47,84,235,.15)}
.what{font:400 46px/1.1 var(--head)}
.now .what{color:var(--accent-text)}
"""


@tpl('matrix', '2 by 2 grid', 'ledgerly', PT, {'use': 'Sort ideas on two scales, like effort and impact.'})
def _(t):
    q = [('Quick wins', ['Send invoices on day 1', 'Turn on card payments'], True), ('Big bets', ['Raise prices for new clients', 'Hire a bookkeeper'], False),
         ('Fill-ins', ['Rename your files', 'Tidy old receipts'], False), ('Skip', ['Build your own spreadsheet', 'Daily reports nobody reads'], False)]
    cells = ''.join(f'<div class="q{" hot" if hot else ""}"><p class="qn">{n}</p>' + ''.join(f'<p class="it">{i}</p>' for i in items) + '</div>' for n, items, hot in q)
    return f"""{brand(t)}
<h1 class="h title">Where to spend your time this quarter</h1>
<div class="wrap"><p class="ax y">More impact &rarr;</p><div class="m">{cells}</div><p class="ax x">More effort &rarr;</p></div>
<div class="foot"><span>{t['handle']}</span></div>""", """
.title{font-size:84px;margin:52px 0 44px}
.wrap{flex:1;display:grid;grid-template-columns:48px 1fr;grid-template-rows:1fr 48px;gap:12px}
.m{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px}
.q{background:var(--surface);border-radius:var(--radius);padding:32px;display:flex;flex-direction:column;gap:14px}
.q.hot{background:var(--accent);color:var(--accent-ink)}
.qn{font:700 40px/1.1 var(--head);margin-bottom:8px}
.it{font-size:26px;line-height:1.3;padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.06)}
.hot .it{background:rgba(6,40,26,.1)}
.ax{font:600 22px/1 var(--body);color:var(--muted);letter-spacing:.04em}
.y{writing-mode:vertical-rl;transform:rotate(180deg);text-align:right;grid-row:1}
.x{grid-column:2;text-align:right}
.foot{margin-top:24px}
"""


@tpl('line-chart', 'Line chart', 'ledgerly', PT, {'use': 'A trend over time: 6 to 12 points, with the change called out.'})
def _(t):
    vals = [42, 45, 44, 51, 55, 53, 60, 66, 64, 72, 79, 86]
    months = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
    W, H, lo, hi = 920, 560, 30, 95
    pts = [(k * W / (len(vals) - 1), H - (v - lo) / (hi - lo) * H) for k, v in enumerate(vals)]
    line = ' '.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    area = f'0,{H} ' + line + f' {W},{H}'
    grid = ''.join(f'<line x1="0" x2="{W}" y1="{H * g / 4:.0f}" y2="{H * g / 4:.0f}" stroke="var(--line)" stroke-width="2"/>' for g in range(5))
    lx, ly = pts[-1]
    ms = ''.join(f'<span>{m}</span>' for m in months)
    return f"""{brand(t)}
<p class="kicker">Monthly revenue, 2026</p>
<h1 class="h title">Up <span class="accent">105%</span> since January</h1>
<div class="card chart"><svg viewBox="-10 -20 {W + 20} {H + 40}">{grid}<polygon points="{area}" fill="var(--accent)" opacity=".14"/><polyline points="{line}" fill="none" stroke="var(--accent)" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="{lx:.1f}" cy="{ly:.1f}" r="14" fill="var(--accent)" stroke="var(--surface)" stroke-width="6"/></svg>
<div class="months">{ms}</div></div>
<div class="foot"><span>$42K in January, $86K in December</span><span>{t['handle']}</span></div>""", """
.kicker{margin-top:56px}
.title{font-size:96px;margin:20px 0 44px}
.chart{flex:1;display:flex;flex-direction:column;padding:40px 36px 28px}
.chart svg{flex:1;width:100%}
.months{display:flex;justify-content:space-between;padding:16px 4px 0;font:600 22px/1 var(--body);color:var(--muted)}
.foot{margin-top:32px}
"""


@tpl('menu', 'Menu or price list', 'taco', PT, {'use': 'A short menu, price list or list of services with a photo.'})
def _(t):
    items = [('Al pastor', 'Pork, pineapple, onion, cilantro', '$4'), ('Baja fish', 'Crispy cod, slaw, chipotle mayo', '$5'), ('Hongos', 'Mushrooms, corn, queso fresco', '$4'), ('Birria', 'Slow-cooked beef, dipping broth', '$6')]
    li = ''.join(f'<li><div><p class="it">{a}</p><p class="ds">{b}</p></div><span class="dots"></span><p class="pr">{c}</p></li>' for a, b, c in items)
    return f"""<div class="top"><div class="ph photo"><img src="img/shelf.webp" alt=""></div><p class="chip new">New this week</p></div>
<div class="sheet">
<div class="hd">{brand(t)}<p class="hours">Tue to Sun, 11 to 10</p></div>
<h1 class="h title">Taco Tuesday menu</h1>
<ul class="list">{li}</ul>
</div>""", """
.canvas{padding:0}
.top{position:relative;height:430px}
.photo{width:100%;height:100%}
.new{position:absolute;left:64px;bottom:-24px}
.sheet{flex:1;margin:0;padding:64px 64px 56px;background:var(--surface);display:flex;flex-direction:column}
.hd{display:flex;justify-content:space-between;align-items:center}
.hours{font:600 24px/1 var(--body);color:var(--muted)}
.title{font-size:92px;margin:36px 0 28px;color:var(--bg)}
.list{list-style:none;display:flex;flex-direction:column;gap:30px}
.list li{display:flex;align-items:flex-end;gap:16px}
.it{font:800 40px/1.1 var(--head)}
.ds{font-size:26px;color:var(--muted)}
.dots{flex:1;border-bottom:3px dotted var(--line);margin-bottom:12px}
.pr{font:800 44px/1 var(--head)}
"""


# ====================================================================================== stories 9:16
@tpl('event-story', 'Event story', 'northwind', ST, {'use': 'A workshop, webinar or event: date, time, speaker and how to join.'})
def _(t):
    return f"""{brand(t)}
<p class="chip live">Free live workshop</p>
<h1 class="h title">Build a brand people <em>remember</em></h1>
<div class="when card"><div class="date"><p class="mo">DEC</p><p class="h dd">4</p></div><div><p class="wd">Thursday, 5 PM Lisbon</p><p class="muted">45 minutes, then questions</p></div></div>
<div class="spk"><div class="ph av"><img src="img/jon.webp" alt=""></div><div><p class="nm">Jon Avery</p><p class="muted">Creative director, Northwind</p></div></div>
<div class="cta"><span>Save your seat</span><span class="lnk">northwind.studio/live</span></div>""", """
.canvas{padding:120px 80px 140px}
.live{margin-top:auto}
.title{font-size:168px;margin:36px 0 64px}
.title em{font-style:italic;color:var(--accent-text)}
.when{display:flex;align-items:center;gap:32px;padding:32px}
.date{width:132px;height:132px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--accent);color:var(--accent-ink);border-radius:var(--radius)}
.mo{font:700 24px/1 var(--body);letter-spacing:.1em}
.dd{font-size:72px;line-height:1}
.wd{font:600 36px/1.2 var(--body)}
.spk{display:flex;align-items:center;gap:24px;margin-top:48px}
.av{width:104px;height:104px;border-radius:50%}
.nm{font:600 32px/1.2 var(--body)}
.cta{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:64px;padding:36px;background:var(--ink);color:#fff;border-radius:var(--radius);font:700 40px/1 var(--body)}
.lnk{font:500 26px/1 var(--body);opacity:.7}
"""


@tpl('launch-story', 'Launch story', 'maya', ST, {'use': 'Announce something new: a product, program or drop.'})
def _(t):
    return f"""<div class="ph photo"><img src="img/maya.webp" alt=""></div>
<div class="over">
{brand(t)}
<p class="chip">New</p>
<h1 class="h title">6-WEEK STRONG PROGRAM</h1>
<ul class="pts"><li>3 workouts a week</li><li>20 minutes each</li><li>No gym needed</li></ul>
<p class="start">Starts January 5</p>
<p class="lnk">Link in bio &darr;</p>
</div>""", """
.canvas{padding:0}
.photo{position:absolute;inset:0 0 auto 0;height:1000px}
.photo::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(17,17,17,0) 55%,var(--bg))}
.photo{position:absolute}
.over{position:relative;flex:1;display:flex;flex-direction:column;padding:110px 80px 150px}
.over .chip{margin-top:auto}
.title{font-size:150px;line-height:.9;margin:28px 0 40px;color:var(--accent)}
.pts{list-style:none;display:flex;flex-wrap:wrap;gap:14px}
.pts li{padding:16px 26px;border:3px solid var(--ink);font:700 30px/1 var(--body)}
.start{font:700 40px/1 var(--body);margin-top:56px}
.lnk{font:500 30px/1 var(--body);color:var(--muted);margin-top:16px}
"""


@tpl('vote-story', 'This or that story', 'taco', ST, {'use': 'Ask people to pick between two things.'})
def _(t):
    return f"""<div class="hd">{brand(t)}</div>
<h1 class="h title">Which one wins?</h1>
<div class="pick a"><div class="ph img"><img src="img/croissant.webp" alt=""></div><p class="lbl">Churro croissant</p></div>
<p class="or">OR</p>
<div class="pick b"><div class="ph img"><img src="img/loaf.webp" alt=""></div><p class="lbl">Masa banana bread</p></div>
<p class="foot2">Vote with the poll &uarr;</p>""", """
.canvas{padding:110px 72px 130px;align-items:center}
.hd{align-self:flex-start}
.title{font-size:128px;margin:48px 0 48px;text-align:center}
.pick{position:relative;width:100%;flex:1;border-radius:var(--radius);overflow:hidden}
.pick .img{position:absolute;inset:0}
.lbl{position:absolute;left:28px;bottom:28px;padding:16px 26px;border-radius:999px;background:var(--surface);font:800 36px/1 var(--head)}
.or{margin:-36px 0;z-index:1;width:112px;height:112px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--accent);font:800 40px/1 var(--head);border:8px solid var(--bg)}
.foot2{margin-top:40px;font:600 32px/1 var(--body)}
"""


# ====================================================================================== landscape
@tpl('link-banner', 'Link post banner', 'ledgerly', LI, {'use': 'The picture for a LinkedIn, X or blog link: the article title and author.'})
def _(t):
    return f"""<div class="l">{brand(t)}<h1 class="h title">How to price your services in 2027</h1>
<div class="by"><div class="ph av"><img src="img/sam.webp" alt=""></div><p>Sam Okafor <span class="muted">&middot; 6 min read</span></p></div></div>
<div class="r"><div class="card mini"><p class="muted lb">Average rate rise</p><p class="h n">+18%</p><div class="bars"><span style="height:40%"></span><span style="height:55%"></span><span style="height:48%"></span><span style="height:72%"></span><span class="hi" style="height:100%"></span></div></div></div>""", """
.canvas{flex-direction:row;gap:48px;padding:64px}
.l{flex:1.4;display:flex;flex-direction:column}
.title{font-size:64px;margin:auto 0 32px}
.by{display:flex;align-items:center;gap:16px;font:600 24px/1 var(--body)}
.av{width:56px;height:56px;border-radius:50%}
.r{flex:1;display:flex;align-items:center}
.mini{width:100%;padding:36px}
.lb{font-size:22px}
.n{font-size:96px;color:var(--accent-text);margin:8px 0 24px}
.bars{display:flex;align-items:flex-end;gap:12px;height:150px}
.bars span{flex:1;background:var(--line);border-radius:8px 8px 0 0}
.bars .hi{background:var(--accent)}
"""


@tpl('thumbnail', 'Video thumbnail', 'maya', YT, {'use': 'A YouTube thumbnail: 2 to 4 huge words and a face.'})
def _(t):
    return f"""<div class="ph face"><img src="img/maya.webp" alt=""></div>
<div class="txt"><p class="h w1">5 MIN</p><p class="h w2">ABS</p><p class="tag">NO EQUIPMENT</p></div>
<div class="brandc">{brand(t)}</div>""", """
.canvas{padding:0}
.face{position:absolute;right:0;top:0;width:560px;height:100%}
.face::after{content:"";position:absolute;inset:0;box-shadow:inset 120px 0 80px -40px var(--bg)}
.txt{position:relative;padding:64px 72px;display:flex;flex-direction:column;align-items:flex-start}
.w1{font-size:200px;line-height:.86;color:var(--ink)}
.w2{font-size:260px;line-height:.86;color:var(--accent)}
.tag{margin-top:24px;padding:14px 22px;background:var(--accent-2);color:#fff;font:800 32px/1 var(--body);letter-spacing:.06em;transform:rotate(-2deg)}
.brandc{position:absolute;left:72px;bottom:44px}
"""


# ====================================================================================== carousel (4:5)
CAR = {'use': 'A carousel: cover, one idea per slide, a last slide that asks for the follow or save.', 'carousel': True}


@tpl('carousel-1-cover', 'Carousel cover', 'capy', PT, CAR)
def _(t):
    return f"""{brand(t)}
<p class="kicker2">Guide</p>
<h1 class="h title">7 hooks that stop the scroll</h1>
<p class="muted lead">Steal these for your next post.</p>
<div class="foot"><span>{t['handle']}</span><span class="swipe">Swipe <span class="arr">&rarr;</span></span></div>
<p class="pg">1/9</p>""", """
.kicker2{margin-top:auto;align-self:flex-start;padding:10px 18px;border-radius:10px;background:var(--accent);color:var(--accent-ink);font:700 24px/1 var(--body)}
.title{font-size:150px;line-height:.95;margin:32px 0 28px}
.lead{font-size:40px;margin-bottom:auto}
.swipe{display:inline-flex;align-items:center;gap:14px;font:600 28px/1 var(--body);color:var(--ink)}
.arr{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--ink);color:#fff;font-size:30px}
.pg{position:absolute;top:84px;right:80px;font:600 24px/1 var(--body);color:var(--muted)}
"""


@tpl('carousel-2-point', 'Carousel slide', 'capy', PT, CAR)
def _(t):
    return f"""<div class="top"><p class="n">01</p><p class="pg">2/9</p></div>
<h2 class="h title">Start with the result</h2>
<p class="body">Lead with what happened, then explain how. People stay for the story once they know where it ends.</p>
<div class="ex card"><p class="exl">Try</p><p class="ext">&ldquo;We tripled our bookings in 6 weeks. Here&rsquo;s the one change we made.&rdquo;</p></div>
<div class="foot"><span>{t['handle']}</span><span class="arr">&rarr;</span></div>""", """
.top{display:flex;justify-content:space-between;align-items:flex-start}
.n{align-self:flex-start;padding:18px 26px;border-radius:20px;background:var(--accent);color:var(--accent-ink);font:800 72px/1 var(--head);letter-spacing:-.03em}
.pg{font:600 24px/1 var(--body);color:var(--muted)}
.title{font-size:104px;margin:72px 0 32px}
.body{font-size:38px;line-height:1.4;color:var(--muted)}
.ex{margin-top:auto;padding:40px;border-left:10px solid var(--accent);border-radius:0 var(--radius) var(--radius) 0}
.exl{font:700 22px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}
.ext{font:600 38px/1.3 var(--body);margin-top:16px}
.foot{margin-top:48px}
.arr{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--ink);color:#fff;font-size:30px}
"""


@tpl('carousel-3-cta', 'Carousel last slide', 'capy', PT, CAR)
def _(t):
    return f"""<p class="pg">9/9</p>
<div class="mid">
<div class="big">{LOGOS['capy']}</div>
<h2 class="h title">Save this for your next post</h2>
<p class="muted lead">Follow for a new guide every Tuesday.</p>
<div class="acts"><p class="act">&#9734; Save</p><p class="act">&#8618; Share</p><p class="act pri">+ Follow</p></div>
</div>
<div class="foot"><span>{t['handle']}</span></div>""", """
.pg{position:absolute;top:84px;right:80px;font:600 24px/1 var(--body);color:var(--muted)}
.mid{margin:auto 0;display:flex;flex-direction:column;align-items:center;text-align:center}
.big svg{width:140px;height:140px}
.title{font-size:110px;margin:48px 0 24px}
.lead{font-size:38px}
.acts{display:flex;gap:16px;margin-top:56px}
.act{padding:22px 32px;border-radius:999px;background:var(--surface);box-shadow:0 0 0 2px var(--line);font:600 30px/1 var(--body)}
.act.pri{background:var(--accent);color:var(--accent-ink);box-shadow:none}
"""


def build():
    os.makedirs(os.path.join(OUT, 'themes'), exist_ok=True)
    index = []
    for slug, (title, theme, size, fn, meta) in T.items():
        body, css = fn(THEMES[theme])
        pad = 80
        open(os.path.join(OUT, f'{slug}.html'), 'w').write(page(slug, title, theme, size, body, css, pad, meta))
        index.append({'file': f'{slug}.html', 'title': title, 'size': f'{size[0]}x{size[1]}', 'theme': theme, **meta})
    # One layout in every brand, to show that the style card changes the whole look.
    for th in THEMES:
        title, _, size, fn, meta = T['big-stat']
        body, css = fn(THEMES[th])
        html = page('big-stat', title, th, size, body, css, 80, meta).replace('src="img/', 'src="../img/').replace('url(fonts/', 'url(../fonts/')
        open(os.path.join(OUT, 'themes', f'big-stat--{th}.html'), 'w').write(html)
    json.dump({'templates': index, 'themes': THEMES}, open(os.path.join(OUT, 'index.json'), 'w'), indent=1)
    export_examples()
    print('templates:', len(index), 'themes:', len(THEMES))


def export_examples():
    """Writes src/lib/capy/examples.ts: each layout's CSS and markup, with the logo and photos pointing at the render
    host, for Claude to learn from. The base CSS goes in once."""
    import re
    global EXPORT
    EXPORT = True
    rows = []
    for slug, (title, theme, size, fn, meta) in T.items():
        body, css = fn(THEMES[theme])
        body = re.sub(r'src="img/[^"]+"', 'src="https://capy.local/photo"', body)
        body = re.sub(r'<svg viewBox="0 0 40 40">.*?</svg>', '<img class="logo" src="https://capy.local/logo" alt="">', body)
        rows.append({'slug': slug, 'title': title, 'use': meta.get('use', ''), 'size': f'{size[0]}x{size[1]}', 'photo': 'capy.local/photo' in body,
                     'carousel': bool(meta.get('carousel')), 'css': css.strip(), 'body': body.strip()})
    EXPORT = False
    app = os.path.join(os.path.dirname(HERE), 'src', 'lib', 'capy', 'examples.ts')
    out = ['// Written by capy/build_templates.py from the starter library. Do not edit by hand: change the library and run it.',
           '// Each layout is its own CSS (on the base CSS and the brand variables) and the markup inside <main class="canvas">.',
           '', 'export type Example = { slug: string; title: string; use: string; size: string; photo: boolean; carousel: boolean; css: string; body: string };', '',
           f'export const BASE_CSS = {json.dumps(BASE.strip())};', '', f'export const EXAMPLES: Example[] = {json.dumps(rows, indent=1)};', '']
    open(app, 'w').write('\n'.join(out))
    print('examples:', len(rows), '->', os.path.relpath(app, os.path.dirname(HERE)))


if __name__ == '__main__':
    build()
