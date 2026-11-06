"""Charts and diagrams for the glossary and the blog, drawn at build time as plain HTML and SVG.

One look everywhere (dataviz method): thin marks with 4px rounded data ends, hairline axes, values in text colors,
a 2px white gap between touching marks. One series is gray with the one thing that matters in yellow. Charts with
parts use the validated palette (blue, orange, aqua, yellow) in that fixed order, always with a legend that names
each part and its value, plus a table for screen readers. Every mark has a hover tip (data-tip, see CHART_JS).
Numbers that aren't facts carry an "Example" tag.

Spec types (dicts): bars, columns, line, funnel, stack, steps, versus, formula. See render_chart()."""
import html as _H

PARTS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100']


def _e(s):
    return _H.escape(str(s), quote=True)


def _fmt(v):
    if isinstance(v, float) and not v.is_integer():
        return f'{v:,.1f}'
    return f'{int(v):,}'


def _head(spec):
    tag = '<span class="ch-ex">Example</span>' if spec.get('example') else ''
    sub = f'<p class="ch-sub">{_e(spec["sub"])}</p>' if spec.get('sub') else ''
    return f'<figcaption class="ch-head"><b>{_e(spec["title"])}</b>{tag}{sub}</figcaption>'


def _note(spec):
    return f'<p class="ch-note">{_e(spec["note"])}</p>' if spec.get('note') else ''


def _table(head, rows):
    th = ''.join(f'<th scope="col">{_e(h)}</th>' for h in head)
    tr = ''.join('<tr>' + ''.join(f'<td>{_e(c)}</td>' for c in r) + '</tr>' for r in rows)
    return f'<table class="sr"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table>'


def _shown(row):
    return row[2] if len(row) > 2 and row[2] not in (None, '') else _fmt(row[1])


def bars(spec):
    rows = spec['rows']
    top = max(r[1] for r in rows) or 1
    hi = spec.get('highlight')
    out = ''
    for r in rows:
        w = max(1.5, r[1] / top * 100)
        on = ' on' if r[0] == hi else ''
        out += (f'<div class="ch-row"><span class="ch-lab">{_e(r[0])}</span><span class="ch-track">'
                f'<span class="ch-bar{on}" style="width:{w:.1f}%" data-tip="{_e(r[0])}: {_e(_shown(r))}"></span>'
                f'<span class="ch-val">{_e(_shown(r))}</span></span></div>')
    return f'<figure class="ch">{_head(spec)}<div class="ch-bars" aria-hidden="true">{out}</div>{_table(["", spec.get("unit", "Value")], [(r[0], _shown(r)) for r in rows])}{_note(spec)}</figure>'


def columns(spec):
    rows = spec['rows']
    top = max(r[1] for r in rows) or 1
    hi = spec.get('highlight')
    cols = ''
    for r in rows:
        h = max(1.5, r[1] / top * 100)
        on = ' on' if r[0] == hi else ''
        lab = f'<span class="ch-cv">{_e(_shown(r))}</span>' if (r[0] == hi or spec.get('labels') == 'all') else ''
        cols += (f'<div class="ch-col"><div class="ch-cbox">{lab}<span class="ch-colbar{on}" style="height:{h:.1f}%" data-tip="{_e(r[0])}: {_e(_shown(r))}"></span></div>'
                 f'<span class="ch-cl">{_e(r[0])}</span></div>')
    return f'<figure class="ch">{_head(spec)}<div class="ch-cols" aria-hidden="true">{cols}</div>{_table(["", spec.get("unit", "Value")], [(r[0], _shown(r)) for r in rows])}{_note(spec)}</figure>'


def line(spec):
    pts = spec['points']
    W, H, pl, pr, pt, pb = 640, 240, 44, 56, 16, 30
    ys = [p[1] for p in pts]
    lo = min(0, min(ys))
    hi = max(ys) or 1
    step = (W - pl - pr) / max(1, len(pts) - 1)
    X = lambda i: pl + i * step
    Y = lambda v: pt + (H - pt - pb) * (1 - (v - lo) / (hi - lo or 1))
    d = ' '.join(f'{"M" if i == 0 else "L"}{X(i):.1f} {Y(p[1]):.1f}' for i, p in enumerate(pts))
    area = d + f' L{X(len(pts) - 1):.1f} {Y(lo):.1f} L{X(0):.1f} {Y(lo):.1f} Z'
    grid = ''
    for k in range(3):
        v = lo + (hi - lo) * k / 2
        grid += f'<line x1="{pl}" x2="{W - pr}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" class="ch-grid"/><text x="{pl - 8}" y="{Y(v) + 4:.1f}" class="ch-ax" text-anchor="end">{_e(_fmt(round(v, 1)))}{_e(spec.get("suffix", ""))}</text>'
    every = max(1, len(pts) // 6)
    xl = ''.join(f'<text x="{X(i):.1f}" y="{H - 8}" class="ch-ax" text-anchor="middle">{_e(p[0])}</text>' for i, p in enumerate(pts) if i % every == 0 or i == len(pts) - 1)
    dots = ''.join(f'<circle cx="{X(i):.1f}" cy="{Y(p[1]):.1f}" r="10" class="ch-hit" data-tip="{_e(p[0])}: {_e(_fmt(p[1]))}{_e(spec.get("suffix", ""))}"/>' for i, p in enumerate(pts))
    last = pts[-1]
    end = (f'<circle cx="{X(len(pts) - 1):.1f}" cy="{Y(last[1]):.1f}" r="5" class="ch-end"/>'
           f'<text x="{X(len(pts) - 1) + 10:.1f}" y="{Y(last[1]) + 4:.1f}" class="ch-endl">{_e(_fmt(last[1]))}{_e(spec.get("suffix", ""))}</text>')
    svg = (f'<svg class="ch-line" viewBox="0 0 {W} {H}" role="img" aria-label="{_e(spec["title"])}">{grid}'
           f'<path d="{area}" class="ch-area"/><path d="{d}" class="ch-path"/>{end}{xl}{dots}</svg>')
    return f'<figure class="ch">{_head(spec)}{svg}{_table(["", spec.get("unit", "Value")], [(p[0], _fmt(p[1]) + spec.get("suffix", "")) for p in pts])}{_note(spec)}</figure>'


def funnel(spec):
    st = spec['stages']
    top = st[0][1] or 1
    out = ''
    for i, s in enumerate(st):
        if i > 0 and st[i - 1][1]:
            out += f'<div class="ch-frate"><span></span><span>{s[1] / st[i - 1][1] * 100:.0f}% move on</span></div>'
        w = max(1.5, s[1] / top * 100)
        on = ' on' if i == len(st) - 1 else ''
        out += (f'<div class="ch-row"><span class="ch-lab">{_e(s[0])}</span><span class="ch-track">'
                f'<span class="ch-bar ch-fb{on}" style="width:{w:.1f}%" data-tip="{_e(s[0])}: {_e(_shown(s))}"></span>'
                f'<span class="ch-val">{_e(_shown(s))}</span></span></div>')
    return f'<figure class="ch">{_head(spec)}<div class="ch-bars ch-funnel" aria-hidden="true">{out}</div>{_table(["Stage", spec.get("unit", "Value")], [(s[0], _shown(s)) for s in st])}{_note(spec)}</figure>'


def stack(spec):
    parts = spec['parts'][:4]
    total = sum(p[1] for p in parts) or 1
    seg = ''.join(f'<span class="ch-seg" style="flex:{p[1]};background:{PARTS[i]}" data-tip="{_e(p[0])}: {p[1] / total * 100:.0f}%"></span>' for i, p in enumerate(parts))
    leg = ''.join(f'<li><i style="background:{PARTS[i]}"></i>{_e(p[0])}<b>{p[1] / total * 100:.0f}%</b></li>' for i, p in enumerate(parts))
    return f'<figure class="ch">{_head(spec)}<div class="ch-stack" aria-hidden="true">{seg}</div><ul class="ch-leg">{leg}</ul>{_table(["Part", "Share"], [(p[0], f"{p[1] / total * 100:.0f}%") for p in parts])}{_note(spec)}</figure>'


def steps(spec):
    li = ''.join(f'<li><span class="ch-n">{i}</span><div><b>{_e(s[0])}</b><p>{_e(s[1])}</p></div></li>' for i, s in enumerate(spec['steps'], 1))
    return f'<figure class="ch ch-flow">{_head(spec)}<ol class="ch-steps">{li}</ol>{_note(spec)}</figure>'


def versus(spec):
    a, b = spec['cols']
    def c(v):
        if v is True:
            return '<span class="yes" title="Yes"></span>'
        if v is False or v in (None, ''):
            return '<span class="no">&ndash;</span>'
        return _e(v)
    rows = ''.join(f'<tr><th scope="row">{_e(r[0])}</th><td>{c(r[1])}</td><td>{c(r[2])}</td></tr>' for r in spec['rows'])
    return f'<figure class="ch">{_head(spec)}<div class="scroll"><table class="cmp ch-vs"><thead><tr><th scope="col"></th><th scope="col">{_e(a)}</th><th scope="col">{_e(b)}</th></tr></thead><tbody>{rows}</tbody></table></div>{_note(spec)}</figure>'


def formula(spec):
    ins = ''.join(f'<div class="ch-in"><span>{_e(k)}</span><b>{_e(v)}</b></div>' for k, v in spec.get('example', []))
    ex = f'<div class="ch-calc">{ins}<div class="ch-eq">=</div><div class="ch-in ch-res"><span>Result</span><b>{_e(spec["result"])}</b></div></div>' if spec.get('example') else ''
    return f'<figure class="ch">{_head(spec)}<p class="ch-formula">{_e(spec["formula"])}</p>{ex}{_note(spec)}</figure>'


KINDS = {'bars': bars, 'columns': columns, 'line': line, 'funnel': funnel, 'stack': stack, 'steps': steps, 'versus': versus, 'formula': formula}


def render_chart(spec):
    return KINDS[spec['type']](spec)


# Network text limits from the app (src/lib/networks.ts), the one set of platform numbers the glossary may chart as fact.
LIMITS = [('Facebook', 63206), ('YouTube description', 5000), ('LinkedIn', 3000), ('Instagram', 2200), ('TikTok', 2200), ('Discord', 2000),
          ('Google Business Profile', 1500), ('Threads', 500), ('Pinterest description', 500), ('Mastodon', 500), ('Bluesky', 300), ('X', 280)]

CHART_JS = '''<script>(function(){var t=document.createElement('div');t.className='ch-tip';t.hidden=true;document.body.appendChild(t);
function show(e){var m=e.target.closest('[data-tip]');if(!m){t.hidden=true;return}t.textContent=m.getAttribute('data-tip');t.hidden=false;
var r=m.getBoundingClientRect();t.style.left=Math.min(innerWidth-t.offsetWidth-8,Math.max(8,r.left+r.width/2-t.offsetWidth/2))+'px';t.style.top=(r.top+scrollY-t.offsetHeight-8)+'px'}
document.addEventListener('mouseover',show);document.addEventListener('focusin',show);document.addEventListener('scroll',function(){t.hidden=true},{passive:true})})();</script>'''
