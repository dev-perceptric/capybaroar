"""Builds the blog listicles under /blog/<slug>, the blog index and their sitemap entries.

Run by build_tools.py after every other page, so the shared nav, footer and page() helper are already loaded.
Data lives in site/build/listicles/: tools.json (each tool's address), facts.json (prices and features copied from each
vendor's own pages, with the date) and posts/*.py (one file per post, POST = {...}). Screenshots come from
site/build/shots.mjs, covers from site/build/covers.mjs."""
import os, re, json, glob, html as H

LX = os.path.join(HERE, 'listicles')
FACTS = json.load(open(os.path.join(LX, 'facts.json')))
POSTS = []
for f in sorted(glob.glob(os.path.join(LX, 'posts', '*.py'))):
    ns = {}
    exec(open(f).read(), ns)
    POSTS.append(ns['POST'])
POSTS.sort(key=lambda p: p.get('order', 99))

# Capybaroar's own screens, from the app, for its entry in each list.
APP_SHOTS = {
    'calendar': ('/img/calendar.webp', 2304, 1440, 'The Capybaroar calendar with a month of posts across channels'),
    'composer': ('/img/composer.webp', 1600, 1114, 'Writing one post for Instagram, LinkedIn and Facebook in Capybaroar'),
    'inbox': ('/img/inbox.webp', 1600, 1173, 'The Capybaroar inbox with comments from several networks'),
    'agent': ('/img/agent.webp', 1600, 1020, 'The Capybaroar agent planning a week of LinkedIn posts'),
    'analytics': ('/img/analytics.webp', 1600, 1506, 'Capybaroar analytics with reach, engagement and the best time to post'),
    'approvals': ('/img/approvals.webp', 1600, 1328, 'A client approving a post in Capybaroar'),
    'week': ('/img/calendar-week.webp', 1600, 1240, 'A week of scheduled posts in Capybaroar'),
}
MONTH = 'November 2026'


def esc(s):
    return H.escape(str(s), quote=True)


def logo(tid, size=28):
    if tid == 'capybaroar':
        return f'<img class="lx-logo" src="/icon.svg" alt="" width="{size}" height="{size}">'
    return f'<img class="lx-logo" src="/img/blog/logos/{tid}.png" alt="" width="{size}" height="{size}" loading="lazy">'


def shot(tid, kind):
    f = FACTS[tid]
    if tid == 'capybaroar':
        src, w, h, alt = APP_SHOTS[kind]
        addr, cap = 'app.capybaroar.com', alt + '.'
    else:
        src, w, h = f'/img/blog/shots/{tid}-{kind}.webp', 1440, 900
        page_name = 'pricing page' if kind == 'pricing' else 'homepage'
        alt = f"{f['name']}'s {page_name}"
        addr = f['pricing' if kind == 'pricing' else 'home'].replace('https://', '').replace('www.', '').rstrip('/')
        cap = f"{f['name']}'s {page_name}, {f.get('captured', MONTH)}."
    return (f'<figure class="lx-shot"><div class="lx-bar" aria-hidden="true"><i></i><i></i><i></i><span>{esc(addr)}</span></div>'
            f'<img src="{src}" width="{w}" height="{h}" alt="{esc(alt)}" loading="lazy" decoding="async"><figcaption>{esc(cap)}</figcaption></figure>')


def cell(v):
    return esc(v) if v else '<span class="no">&ndash;</span>'


# ---------- links inside the copy ----------
# Capybaroar's own pages, linked where Capybaroar is reviewed (its item, the intro and the bottom line).
CAPY_LINKS = [
    (r'\bAI agent\b|\bagent\b', '/#agents'), (r'\bMCP server\b|\bMCP\b', '/mcp'), (r'\bREST API\b', '/api'),
    (r'\binbox\b', '/social-media-inbox'), (r'\banalytics\b', '/social-media-analytics'), (r'\b[Ll]ink in bio\b', '/link-in-bio'),
    (r'\bcalendar\b', '/social-media-scheduler'), (r'\b(?:Creator|Pro|Agency)(?= (?:is|costs|plan)\b)', '/pricing'),
    (r'\bCapybaroar\b', '/'),
]
NET_LINKS = [(r'\b' + n + r'\b', u) for u, _, n, _ in CHANNELS_NAV if n != 'X'] + [(r'\bX \(Twitter\)', '/x-post-scheduler')]
# Other lists, linked when the copy names their topic.
POST_LINKS = [
    (r'\bBuffer alternatives?\b', 'buffer-alternatives'), (r'\bHootsuite alternatives?\b', 'hootsuite-alternatives'),
    (r'\bSprout Social alternatives?\b', 'sprout-social-alternatives'), (r'\bBuffer vs\.? Hootsuite\b', 'buffer-vs-hootsuite'),
    (r'\bfree plans?\b', 'free-social-media-management-tools'), (r'\bagenc(?:y|ies)\b', 'social-media-tools-for-agencies'),
    (r'\bsmall business(?:es)?\b', 'social-media-tools-for-small-business'), (r'\bAI\b', 'ai-social-media-scheduling-tools'),
]
TAG = re.compile(r'(<[^>]+>)')


def autolink(html, rules, used, skip_href=None):
    """Links the first match of each rule in text that isn't already a link, a heading or a tag."""
    out, in_a, in_h = [], 0, 0
    for part in TAG.split(html):
        if part.startswith('<'):
            t = part.lower()
            in_a += 1 if t.startswith('<a ') or t == '<a>' else -1 if t.startswith('</a') else 0
            in_h += 1 if re.match(r'<h[1-6]\b', t) else -1 if re.match(r'</h[1-6]', t) else 0
            out.append(part)
            continue
        if in_a > 0 or in_h > 0:
            out.append(part)
            continue
        for rx, href in rules:
            if href in used or href == skip_href:
                continue
            m = re.search(rx, part)
            if m:
                used.add(href)
                part = part[:m.start()] + f'<a href="{href}">{m.group(0)}</a>' + part[m.end():]
        out.append(part)
    return ''.join(out)


def compare(items):
    rows = ''
    for k, it in enumerate(items, 1):
        f = FACTS[it['id']]
        rows += (f'<tr><th scope="row"><a href="#{it["id"]}">{logo(it["id"], 22)}<span>{k}. {esc(f["name"])}</span></a></th>'
                 f'<td>{cell(f.get("priceShort"))}</td><td>{cell(f.get("freeShort"))}</td><td>{cell(f.get("trialShort"))}</td><td>{cell(f.get("bestFor"))}</td></tr>')
    return ('<div class="scroll"><table class="cmp lx-cmp"><caption class="sr">Tools compared</caption><thead><tr>'
            '<th scope="col">Tool</th><th scope="col">Price from</th><th scope="col">Free plan</th><th scope="col">Free trial</th><th scope="col">Best for</th>'
            f'</tr></thead><tbody>{rows}</tbody></table></div>')


def picks(p):
    out = ''
    for label, tid, why in p['picks']:
        out += f'<li><a href="#{tid}"><span class="lx-pl">{esc(label)}</span><span class="lx-pn">{logo(tid, 24)}{esc(FACTS[tid]["name"])}</span><span class="lx-pw">{why}</span></a></li>'
    return f'<ul class="lx-picks">{out}</ul>'


def ul(items, cls):
    return f'<ul class="{cls}">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'


def item(k, it, used):
    f = FACTS[it['id']]
    tid = it['id']
    text = it['text']
    # The "is a" line names the tool, so the first paragraph goes on with "It".
    name = re.escape(f['name'])
    text = re.sub(r'^(\s*<p>)' + name + r' is ', r"\1It's ", text, count=1)
    text = re.sub(r'^(\s*<p>)' + name + r' (was|calls itself|has)\b', r'\1It \2', text, count=1)
    if tid == 'capybaroar':
        used.update(re.findall(r'href="(/[^"]*)"', f['kind']))
        text = autolink(text, CAPY_LINKS + NET_LINKS, used)
    price = f.get('priceLine') or f.get('priceShort') or ''
    meta = [('Price', price)]
    if f.get('freeLine'):
        meta.append(('Free plan', f['freeLine']))
    if f.get('trialShort'):
        meta.append(('Free trial', f['trialShort']))
    dl = ''.join(f'<div><dt>{a}</dt><dd>{esc(b)}</dd></div>' for a, b in meta if b)
    if tid == 'capybaroar':
        go = '<a class="btn sm" href="https://app.capybaroar.com/signup">Start free</a>'
    else:
        go = f'<a class="btn ghost sm" href="{esc(f["home"])}" rel="nofollow noopener" target="_blank">Visit {esc(f["name"])}</a>'
    pros = it.get('pros') or f.get('pros', [])
    cons = it.get('cons') or f.get('cons', [])
    return f'''<section class="lx-item" id="{tid}" aria-labelledby="{tid}-h">
<h2 id="{tid}-h"><span class="lx-n">{k}</span>{logo(tid, 36)}<span>{esc(f["name"])}</span></h2>
<p class="lx-best">Best for {esc(it.get("bestFor") or f.get("bestFor", ""))}</p>
{shot(tid, it.get("shot", "pricing"))}
<p class="lx-is"><b>{esc(f["name"])}</b> is {f["kind"]}.</p>
{text}
<dl class="lx-meta">{dl}</dl>
<div class="lx-pc"><div><h3>What we like</h3>{ul(pros, "lx-pros")}</div><div><h3>What to know</h3>{ul(cons, "lx-cons")}</div></div>
<p class="lx-go">{go}</p>
</section>'''


def cover_of(p):
    return {'slug': p['slug'], **p['cover']}


SIGNUP = '''<aside class="lx-signup" aria-label="Try Capybaroar">
<img src="/icon.svg" alt="" width="48" height="48">
<div><h2>Try Capybaroar free</h2><p>Tell the agent what you want, and it plans and writes a week of posts. Review them, then schedule to 12 networks from one calendar.</p>
<p class="lx-note">Free forever plan. 14 days of Pro free. No card needed.</p></div>
<div class="lx-cta"><a class="btn" href="https://app.capybaroar.com/signup">Start free</a><a class="btn ghost" href="/pricing">See pricing</a></div>
</aside>'''
TOC_JS = '''<script>(function(){
var d=document.querySelector('.lx-toc details');if(d&&matchMedia('(max-width:1100px)').matches)d.open=false;
var links=[].slice.call(document.querySelectorAll('.lx-toc a[href^="#"]')),by={},on=null;
if(!links.length||!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;if(on)on.classList.remove('on');on=by[e.target.id];on.classList.add('on')})},{rootMargin:'-15% 0px -75% 0px'});
links.forEach(function(a){var t=document.getElementById(a.getAttribute('href').slice(1));if(t){by[t.id]=a;io.observe(t)}});
})();</script>'''


def related_posts(p):
    mine = {i['id'] for i in p['items']}
    scored = sorted((len(mine & {i['id'] for i in q['items']}) / len(mine | {i['id'] for i in q['items']}), q['order'], q) for q in POSTS if q is not p)
    picked = [q for _, _, q in sorted(scored, key=lambda x: (-x[0], x[1]))[:4]]
    li = ''.join(f'<li><a href="/blog/{q["slug"]}"><img src="/img/blog/{q["slug"]}.webp" width="2400" height="1260" alt="" loading="lazy"><span>{esc(q["title"])}</span></a></li>' for q in picked)
    return f'<h2 id="more">Keep comparing</h2><ul class="lx-more">{li}</ul>'


def toc(p):
    rows = [('picks', 'Our picks'), ('compared', f'All {len(p["items"])} compared')]
    rows += [(it['id'], f'{k}. {FACTS[it["id"]]["name"]}') for k, it in enumerate(p['items'], 1)]
    rows += [('how', 'How we picked'), ('bottom-line', 'The bottom line'), ('faq', 'Questions')]
    li = ''.join(f'<li><a href="#{a}">{esc(b)}</a></li>' for a, b in rows)
    mini = ('<div class="lx-mini"><img src="/icon.svg" alt="" width="32" height="32"><b>Try Capybaroar free</b>'
            '<p>An AI agent that plans your week of posts.</p><a class="btn sm" href="https://app.capybaroar.com/signup">Start free</a></div>')
    return (f'<aside class="lx-toc"><details open><summary>On this page</summary><nav aria-label="On this page"><ol>{li}</ol></nav></details>{mini}</aside>')


cards = []
for p in POSTS:
    slug = '/blog/' + p['slug']
    n = len(p['items'])
    used = set()
    here = slug
    intro = autolink(p['intro'], CAPY_LINKS[-1:] + NET_LINKS + [(rx, '/blog/' + t) for rx, t in POST_LINKS], used, skip_href=here)
    items_html = ''.join(item(k, it, used) for k, it in enumerate(p['items'], 1))
    verdict = autolink(p['verdict'], CAPY_LINKS + [(rx, '/blog/' + t) for rx, t in POST_LINKS], used, skip_href=here)
    how = autolink(p['how'], [(rx, '/blog/' + t) for rx, t in POST_LINKS], used, skip_href=here)
    body = f'''<section class="hero f-hero lx-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-file")}<a href="/blog">Blog</a></p>
<h1>{p["h1a"]} <span class="dim">{p["h1b"]}</span></h1>
<p class="lead">{p["lead"]}</p>
<p class="lx-by">Updated {MONTH}. Prices checked on each tool's own site.</p>
</div>
<div class="wrap"><img class="lx-cover" src="/img/blog/{p["slug"]}.webp" width="2400" height="1260" alt=""></div>
</section>
<section id="list" aria-label="The list"><div class="wrap lx-layout">{toc(p)}<article class="t-read lx">
{intro}
<h2 id="picks">Our picks</h2>
{picks(p)}
<h2 id="compared">All {n} compared</h2>
{compare(p["items"])}
{SIGNUP}
{items_html}
<h2 id="how">How we picked</h2>
{how}
<h2 id="bottom-line">The bottom line</h2>
{verdict}
{related_posts(p)}
</article></div></section>'''
    html = page(slug, 'sched', p['title'], p['desc'], body, p['faqs'])
    html = html.replace('content="https://capybaroar.com/img/og.jpg"', f'content="https://capybaroar.com/img/blog/{p["slug"]}.jpg"')
    html = html.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    art = {"@context": "https://schema.org", "@type": "Article", "headline": p['title'], "description": p['desc'], "image": f"https://capybaroar.com/img/blog/{p['slug']}.jpg",
           "dateModified": p.get('updated', '2026-11-06'), "author": {"@type": "Organization", "name": "Capybaroar"}, "publisher": {"@type": "Organization", "name": "Capybaroar", "url": "https://capybaroar.com"},
           "mainEntityOfPage": "https://capybaroar.com" + slug}
    lst = {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
        {"@type": "ListItem", "position": k, "name": FACTS[it['id']]['name'], "url": f"https://capybaroar.com{slug}#{it['id']}"} for k, it in enumerate(p['items'], 1)]}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Capybaroar", "item": "https://capybaroar.com/"},
        {"@type": "ListItem", "position": 2, "name": "Blog", "item": "https://capybaroar.com/blog"},
        {"@type": "ListItem", "position": 3, "name": p['title'], "item": "https://capybaroar.com" + slug}]}
    ld = ''.join('<script type="application/ld+json">' + json.dumps(x, separators=(',', ':')) + '</script>\n' for x in (art, lst, crumbs))
    html = html.replace('</head>', ld + '</head>', 1)
    html = with_promo(html, 'index').replace('<body>', '<body class="lx-page">', 1).replace('</body>', TOC_JS + '\n</body>', 1)
    os.makedirs(P + 'blog', exist_ok=True)
    open(P + 'blog/' + p['slug'] + '.html', 'w').write(html)
    cards.append(f'<li><a href="{slug}"><img src="/img/blog/{p["slug"]}.webp" width="2400" height="1260" alt="" loading="lazy"><h2>{esc(p["title"])}</h2><p>{esc(p["desc"])}</p></a></li>')

# ---------- the blog index ----------
if POSTS:
    bp = open(P + 'blog.html').read()
    grid = f'<div class="wrap"><ul class="lx-cards">{"".join(cards)}</ul></div>'
    bp = re.sub(r'<div class="wrap"><div class="soon">.*?</div></div>|<div class="wrap"><ul class="lx-cards">.*?</ul></div>', lambda m: grid, bp, count=1, flags=re.S)
    assert 'lx-cards' in bp
    open(P + 'blog.html', 'w').write(bp)

# ---------- covers and sitemap ----------
cv_path = os.path.join(HERE, 'covers.json')
cv = json.load(open(cv_path))
have = {c['slug'] for c in cv}
new = [cover_of(p) for p in POSTS if p['slug'] not in have]
if new:
    open(cv_path, 'w').write('[\n' + ',\n'.join('  ' + json.dumps(c) for c in cv + new) + '\n]\n')
    print('covers to render:', ', '.join(c['slug'] for c in new), '(npm run site:covers)')
sm = open(P + 'sitemap.xml').read()
add = ''.join(f'  <url><loc>https://capybaroar.com/blog/{p["slug"]}</loc></url>\n' for p in POSTS if f'/blog/{p["slug"]}<' not in sm)
if add:
    sm = sm.replace('  <url><loc>https://capybaroar.com/blog</loc></url>\n', '  <url><loc>https://capybaroar.com/blog</loc></url>\n' + add)
    open(P + 'sitemap.xml', 'w').write(sm)
print('listicles built:', len(POSTS))

# ---------- links from product pages to the matching list ----------
LINKS = {'instagram-post-scheduler': 'instagram-post-schedulers', 'facebook-post-scheduler': 'facebook-post-schedulers',
         'linkedin-post-scheduler': 'linkedin-post-schedulers', 'tiktok-scheduler': 'tiktok-post-schedulers', 'x-post-scheduler': 'x-post-schedulers',
         'social-media-scheduler': 'social-media-scheduling-tools', 'social-media-inbox': 'social-media-scheduling-platforms',
         'social-media-analytics': 'social-media-tools-for-agencies', 'mcp': 'ai-social-media-scheduling-tools'}
BYSLUG = {p['slug']: p for p in POSTS}
for pg, slug in LINKS.items():
    if slug not in BYSLUG or not os.path.exists(P + pg + '.html'):
        continue
    s = open(P + pg + '.html').read()
    s = re.sub(r'<section class="lx-link".*?</section>\n', '', s, flags=re.S)
    post = BYSLUG[slug]
    band = (f'<section class="lx-link" aria-label="Compare tools"><div class="wrap"><a href="/blog/{slug}">'
            f'<img src="/img/blog/{slug}.webp" width="2400" height="1260" alt="" loading="lazy">'
            f'<span><small>Compare</small><b>{esc(post["title"])}</b><span>{esc(post["desc"])}</span></span></a></div></section>\n')
    s = s.replace('<section class="related-band"', band + '<section class="related-band"', 1)
    open(P + pg + '.html', 'w').write(s)
