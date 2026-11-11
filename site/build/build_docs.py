"""Builds the help docs at /docs: the start page, one page per guide, one page per network, a search index, a Markdown
copy of every page (/docs/<slug>.md) and /llms.txt for AI assistants. Run by build_tools.py after the other pages, so
page(), esc() and the shared header and footer are loaded.

Network facts (limits, settings, Inbox, analytics) come from the app: site/build/docs/facts.ts writes facts.json.
Screens: site/build/app-shots.mjs saves fresh app screenshots to img/docs/<key>.webp; until then the site's own app
pictures stand in."""
import os, re, json, subprocess, html as _H

DOCS = os.path.join(HERE, 'docs')
try:
    out = subprocess.run(['npx', 'tsx', os.path.join(DOCS, 'facts.ts')], capture_output=True, text=True, timeout=120, cwd=os.path.dirname(os.path.dirname(HERE)))
    if out.returncode == 0 and out.stdout.strip().startswith('['):
        open(os.path.join(DOCS, 'facts.json'), 'w').write(out.stdout)
except Exception:
    pass  # no Node here: the committed facts.json is used
FACT = {n['id']: n for n in json.load(open(os.path.join(DOCS, 'facts.json')))}
dns = {}
exec(open(os.path.join(DOCS, 'pages.py')).read(), dns)
SECTIONS, NET, NET_ORDER = dns['SECTIONS'], dns['NET'], dns['NET_ORDER']

SHOTS = {
    'calendar': ('/img/calendar.webp', 2304, 1440, 'The Capybaroar calendar'),
    'composer': ('/img/composer.webp', 1600, 1114, 'Writing a post in Capybaroar'),
    'agent': ('/img/agent.webp', 1600, 1020, 'The Capybaroar agent planning posts'),
    'inbox': ('/img/inbox.webp', 1600, 1173, 'The Capybaroar inbox'),
    'analytics': ('/img/analytics.webp', 1600, 1506, 'Capybaroar analytics'),
    'channels': ('/img/docs/channels.webp', 1600, 1000, 'Channels in Capybaroar'),
    'settings': ('/img/docs/settings.webp', 1600, 1000, 'Settings in Capybaroar'),
}


def shot(key):
    if not key:
        return ''
    src, w, h, alt = SHOTS[key]
    fresh = f'/img/docs/{key}.webp'
    if os.path.exists(P + fresh[1:]):
        src, w, h = fresh, 1600, 1000
    elif src.startswith('/img/docs/'):
        return ''  # no picture of this screen yet: run site/build/app-shots.mjs
    return f'<figure class="lx-shot dx-shot"><div class="lx-bar" aria-hidden="true"><i></i><i></i><i></i><span>app.capybaroar.com</span></div><img src="{src}" width="{w}" height="{h}" alt="{esc(alt)}" loading="lazy"></figure>'


def net_page(key):
    n = NET[key]
    ids = n.get('ids', [key])
    fs = [FACT[i] for i in ids]
    f = fs[0]
    fields = []
    for x in f['fields']:
        if x['key'] in ('first_comment',):
            fields.append(('First comment', 'Posted as a comment right after the post'))
        else:
            opts = ', '.join(x.get('options') or []) if x.get('options') else ''
            extra = []
            if x.get('required'):
                extra.append('required')
            if x.get('initial') and x.get('options'):
                lab = dict(zip([o.lower() for o in x['options']], x['options']))
                extra.append(f'starts as {x["initial"].capitalize()}')
            if x.get('when'):
                extra.append('for Reels only' if x['when'].get('value') == 'reel' else f'only when {x["when"]["key"]} is {x["when"]["value"]}')
            fields.append((x['label'], (opts + (' (' + ', '.join(extra) + ')' if extra else '')).strip() or 'Text'))
    inbox_parts = []
    for i, g in zip(ids, fs):
        ib = g['inbox']
        who = '' if len(ids) == 1 else (' (Pages)' if i.endswith('page') else ' (profiles)')
        if ib is None:
            inbox_parts.append(f'Not in the Inbox{who}')
        else:
            can = ['answer'] + (['like'] if ib.get('like') else []) + (['hide'] if ib.get('hide') else [])
            inbox_parts.append(f'Comments and mentions: {", ".join(can[:-1]) + " and " + can[-1] if len(can) > 1 else can[0]}{who}')
    stats = 'Reach and engagement for each post in Analytics' if any(g['hasStats'] for g in fs) else 'Not in Analytics yet'
    rows = [('Characters', f'{f["limit"]:,}'), ('Needs a picture or video', 'Yes' if f['needsMedia'] else 'No'),
            ('Connects with', {'oauth': 'Sign-in', 'form': 'A short form'}[f['connect']] + (f' ({", ".join(f["asks"] + f["formFields"])})' if (f['asks'] or f['formFields']) else '')),
            ('Inbox', '; '.join(inbox_parts)), ('Analytics', stats)]
    facts = ''.join(f'<tr><th scope="row">{esc(a)}</th><td>{esc(b)}</td></tr>' for a, b in rows)
    sets = ''.join(f'<tr><th scope="row">{esc(a)}</th><td>{esc(b)}</td></tr>' for a, b in fields)
    notes = ''.join(f'<li>{esc(x)}</li>' for x in n['notes'])
    errs = ''.join(f'<tr><td><code>{esc(a)}</code></td><td>{esc(b)}</td></tr>' for a, b in n['errors'])
    body = f'''<h2 id="at-a-glance">At a glance</h2>
<div class="scroll"><table class="cmp dx-facts"><tbody>{facts}</tbody></table></div>
<h2 id="connect">Connect {esc(n["title"])}</h2>
<p>{esc(n["connect"])}</p>
<h2 id="post">Post to {esc(n["title"])}</h2>
<ol class="dx-steps"><li><b>Open the calendar</b> and click <b>New post</b>.</li><li><b>Pick your {esc(n["title"])} channel</b> and write the post.</li><li><b>Open the {esc(n["title"])} tab</b> to set the options below.</li><li><b>Check the preview</b>, then schedule, queue or post now.</li></ol>
<ul>{notes}</ul>
{f'<h2 id="settings">{esc(n["title"])} settings</h2><div class="scroll"><table class="cmp dx-facts"><tbody>{sets}</tbody></table></div>' if sets else ''}
<h2 id="errors">If a post is turned down</h2>
<p>Capybaroar checks each post before it's scheduled and shows the reason next to the channel. These are the {esc(n["title"])} ones:</p>
<div class="scroll"><table class="cmp dx-err"><thead><tr><th scope="col">Message</th><th scope="col">What to do</th></tr></thead><tbody>{errs}</tbody></table></div>
<p>Read more about scheduling {esc(n["title"])} on the <a href="{n["page"]}">{esc(n["title"])} scheduler</a> page.</p>'''
    return {'slug': key, 'section': 'channels', 'title': n['title'], 'nav': n['nav'], 'app': '/channels', 'shot': None,
            'lead': f'How to connect {n["title"]}, what you can post there and how to fix a post it turns down.',
            'body': body, 'related': ['connect-a-channel', 'schedule-your-first-post']}


DOCS_PAGES = dns['PAGES'][:4] + [net_page(k) for k in NET_ORDER] + dns['PAGES'][4:]
BY = {p['slug']: p for p in DOCS_PAGES}
ORDERED = [p for s, _ in SECTIONS for p in DOCS_PAGES if p['section'] == s]


def side(active):
    out = '<label class="dx-find"><svg class="ico" aria-hidden="true"><use href="#i-search"/></svg><input type="search" placeholder="Search docs" aria-label="Search docs" data-dx-search></label><div class="dx-results" data-dx-results hidden></div>'
    for s, name in SECTIONS:
        li = ''
        for p in [q for q in DOCS_PAGES if q['section'] == s]:
            icon = f'<svg class="nl" aria-hidden="true"><use href="#n-{p["nav"]}"/></svg>' if p.get('nav') else ''
            on = ' class="on" aria-current="page"' if p['slug'] == active else ''
            li += f'<li><a href="/docs/{p["slug"]}"{on}>{icon}{esc(p["title"])}</a></li>'
        out += f'<p class="dx-sec">{esc(name)}</p><ul>{li}</ul>'
    return f'<nav class="dx-side" aria-label="Docs">{out}</nav>'


def toc(body):
    hs = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', body)
    li = ''.join(f'<li><a href="#{a}">{re.sub("<[^>]+>", "", b)}</a></li>' for a, b in hs)
    return f'<aside class="lx-toc dx-toc"><details open><summary>On this page</summary><nav aria-label="On this page"><ol>{li}</ol></nav></details></aside>' if hs else '<aside></aside>'


def to_md(p):
    """A plain Markdown copy of a page, for AI assistants and llms.txt."""
    b = p['body']
    b = re.sub(r'<figure.*?</figure>', '', b, flags=re.S)
    b = re.sub(r'<h2[^>]*>(.*?)</h2>', lambda m: '\n## ' + re.sub('<[^>]+>', '', m.group(1)) + '\n', b)
    b = re.sub(r'<a href="([^"]+)"[^>]*>(.*?)</a>', lambda m: f'[{m.group(2)}]({m.group(1) if m.group(1).startswith("http") else "https://capybaroar.com" + m.group(1)})', b)
    b = re.sub(r'</?(b|strong)>', '**', b)
    b = re.sub(r'<code>(.*?)</code>', r'`\1`', b)
    b = re.sub(r'<pre>(.*?)</pre>', lambda m: '\n```\n' + re.sub('<[^>]+>', '', m.group(1)) + '\n```\n', b, flags=re.S)
    b = re.sub(r'<tr>(.*?)</tr>', lambda m: '| ' + ' | '.join(re.sub('<[^>]+>', '', c).strip() for c in re.findall(r'<t[hd][^>]*>(.*?)</t[hd]>', m.group(1), re.S)) + ' |\n', b, flags=re.S)
    b = re.sub(r'<ol[^>]*>(.*?)</ol>', lambda m: '\n' + ''.join(f'{i}. {re.sub("<[^>]+>", "", x).strip()}\n' for i, x in enumerate(re.findall(r'<li>(.*?)</li>', m.group(1), re.S), 1)), b, flags=re.S)
    b = re.sub(r'<li>(.*?)</li>', lambda m: '- ' + re.sub('<[^>]+>', '', m.group(1)).strip() + '\n', b, flags=re.S)
    b = re.sub(r'<p[^>]*>(.*?)</p>', r'\n\1\n', b, flags=re.S)
    b = re.sub(r'<[^>]+>', '', b)
    b = _H.unescape(re.sub(r'\n{3,}', '\n\n', b)).strip()
    return f'# {p["title"]}\n\n{p["lead"]}\n\n{b}\n\nSource: https://capybaroar.com/docs/{p["slug"]}\n'


DX_JS = '''<script>(function(){var i=document.querySelector('[data-dx-search]'),box=document.querySelector('[data-dx-results]'),idx=null;if(!i)return;
function load(){return idx?Promise.resolve(idx):fetch('/docs/search.json').then(function(r){return r.json()}).then(function(d){idx=d;return d})}
i.addEventListener('input',function(){var q=i.value.trim().toLowerCase();if(!q){box.hidden=true;box.innerHTML='';return}
load().then(function(d){var hits=d.filter(function(p){return (p.title+' '+p.text).toLowerCase().indexOf(q)>-1}).slice(0,8);
box.innerHTML=hits.length?hits.map(function(p){return '<a href="/docs/'+p.slug+'"><b>'+p.title.replace(/</g,'&lt;')+'</b><span>'+p.section+'</span></a>'}).join(''):'<p>No pages match.</p>';box.hidden=false})})})();</script>'''

os.makedirs(P + 'docs', exist_ok=True)
for k, p in enumerate(ORDERED):
    prev_p = ORDERED[k - 1] if k else None
    next_p = ORDERED[k + 1] if k + 1 < len(ORDERED) else None
    sec = dict(SECTIONS)[p['section']]
    rel = ''.join(f'<li><a href="/docs/{r}">{esc(BY[r]["title"])}</a></li>' for r in p.get('related', []) if r in BY)
    pn = ''
    if prev_p:
        pn += f'<a class="dx-prev" href="/docs/{prev_p["slug"]}"><small>Previous</small>{esc(prev_p["title"])}</a>'
    if next_p:
        pn += f'<a class="dx-next" href="/docs/{next_p["slug"]}"><small>Next</small>{esc(next_p["title"])}</a>'
    app = p.get('app')
    body = f'''<section class="dx" aria-label="Docs"><div class="wrap dx-grid">
{side(p["slug"])}
<article class="t-read dx-art">
<p class="dx-crumb"><a href="/docs">Docs</a> / {esc(sec)}</p>
<h1>{esc(p["title"])}</h1>
<p class="dx-lead">{p["lead"]}</p>
{f'<p class="dx-try"><a class="btn ghost sm" href="https://app.capybaroar.com{app}">Open in Capybaroar</a><a class="dx-md" href="/docs/{p["slug"]}.md">Markdown</a></p>' if app else ''}
{shot(p.get("shot"))}
{p["body"]}
{f'<h2 id="related">Related</h2><ul>{rel}</ul>' if rel else ''}
<nav class="dx-pn" aria-label="Previous and next">{pn}</nav>
</article>
{toc(p["body"])}
</div></section>'''
    html = page(f'/docs/{p["slug"]}', 'sched', f'{p["title"]} | Capybaroar Docs', re.sub('<[^>]+>', '', p['lead'])[:155], body, [])
    html = re.sub(r'<section id="faq".*?</section>\n', '', html, count=1, flags=re.S)
    html = html.replace('<body>', '<body class="lx-page dx-page">', 1).replace('</body>', TOC_JS + DX_JS + '\n</body>', 1)
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Docs", "item": "https://capybaroar.com/docs"},
        {"@type": "ListItem", "position": 2, "name": p['title'], "item": f"https://capybaroar.com/docs/{p['slug']}"}]}
    html = html.replace('</head>', '<script type="application/ld+json">' + json.dumps(crumbs, separators=(',', ':')) + '</script>\n</head>', 1)
    open(P + f'docs/{p["slug"]}.html', 'w').write(html)
    open(P + f'docs/{p["slug"]}.md', 'w').write(to_md(p))

# ---------- the docs start page ----------
cards = ''
for s, name in SECTIONS:
    li = ''.join(f'<li><a href="/docs/{p["slug"]}">{f"<svg class=\"nl\" aria-hidden=\"true\"><use href=\"#n-{p["nav"]}\"/></svg>" if p.get("nav") else ""}<b>{esc(p["title"])}</b><span>{esc(re.sub("<[^>]+>", "", p["lead"]))}</span></a></li>' for p in DOCS_PAGES if p['section'] == s)
    cards += f'<section class="dx-group" aria-labelledby="dx-{s}"><h2 id="dx-{s}">{esc(name)}</h2><ul class="dx-cards">{li}</ul></section>'
start = f'''<section class="hero f-hero simple-hero gl-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-file")}Docs</p>
<h1>Capybaroar docs. <span class="dim">Everything, step by step.</span></h1>
<p class="lead">How to connect your channels, schedule posts, work with the AI agent and use Capybaroar from Claude, ChatGPT or Cursor.</p>
<label class="gl-search"><svg class="ico" aria-hidden="true"><use href="#i-search"/></svg><input type="search" placeholder="Search the docs" aria-label="Search the docs" data-dx-search></label>
<div class="dx-results dx-results-hero" data-dx-results hidden></div>
</div>
</section>
<section aria-label="All docs"><div class="wrap">{cards}</div></section>'''
html = page('/docs', 'sched', 'Capybaroar Docs: Guides for Every Channel and the AI Agent', 'Step-by-step guides for Capybaroar: connect your channels, schedule posts to 14 networks, use the AI agent and connect Claude, ChatGPT or Cursor.', start, [])
html = re.sub(r'<section id="faq".*?</section>\n', '', html, count=1, flags=re.S)
html = html.replace('</body>', DX_JS + '\n</body>', 1)
open(P + 'docs.html', 'w').write(html)

# ---------- search index, llms.txt, sitemap ----------
json.dump([{'slug': p['slug'], 'title': p['title'], 'section': dict(SECTIONS)[p['section']], 'text': re.sub(r'\s+', ' ', _H.unescape(re.sub('<[^>]+>', ' ', p['lead'] + ' ' + p['body'])))[:2000]} for p in ORDERED],
          open(P + 'docs/search.json', 'w'), separators=(',', ':'))
llms = ['# Capybaroar', '', '> Capybaroar is an agentic social media platform: an AI agent plans and writes posts, and people schedule them to 14 networks (Instagram, Facebook, TikTok, LinkedIn profiles and Pages, YouTube, X, Threads, Pinterest, Bluesky, Mastodon, Discord) from one calendar. It has an MCP server and REST API on every plan.', '']
for s, name in SECTIONS:
    llms.append(f'## {name}')
    llms += [f'- [{p["title"]}](https://capybaroar.com/docs/{p["slug"]}.md): {re.sub("<[^>]+>", "", p["lead"])}' for p in ORDERED if p['section'] == s]
    llms.append('')
llms += ['## More', '- [Pricing](https://capybaroar.com/pricing)', '- [API docs](https://capybaroar.com/api)', '- [MCP](https://capybaroar.com/mcp)', '- [Social media terms](https://capybaroar.com/social-media-terms)', '']
open(P + 'llms.txt', 'w').write('\n'.join(llms))
sm = open(P + 'sitemap.xml').read()
add = ''.join(f'  <url><loc>https://capybaroar.com{u}</loc></url>\n' for u in ['/docs'] + [f'/docs/{p["slug"]}' for p in ORDERED] if f'{u}<' not in sm)
if add:
    sm = sm.replace('</urlset>', add + '</urlset>')
    open(P + 'sitemap.xml', 'w').write(sm)
print('docs built:', len(ORDERED))
