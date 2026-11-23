"""Builds the blog listicles under /blog/<slug>, the blog index and their sitemap entries.

Run by build_tools.py after every other page, so the shared nav, footer and page() helper are already loaded.
Data lives in site/build/listicles/: tools.json (each tool's address), facts.json (features copied from each vendor's
own pages, with the date), pricing.json (each tool's plans in one format), g2.json (G2 scores) and posts/*.py (one file
per post, POST = {...}). Each post runs: header, intro, "What is", "Why", the list with a Quick Match quiz, entries
(Rating, Overview, Pros, Cons, Pricing), recap table, conclusion, FAQ, CTA blocks and related posts.
Screenshots come from site/build/shots.mjs, covers from site/build/covers.mjs."""
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
    """Links the first match of each rule in text that isn't already a link, a heading or a tag.
    Matches never overlap and never start or end inside a hyphenated word."""
    out, in_a, in_h = [], 0, 0
    for part in TAG.split(html):
        if part.startswith('<'):
            t = part.lower()
            in_a += 1 if t.startswith('<a ') or t == '<a>' else -1 if t.startswith('</a') else 0
            in_h += 1 if re.match(r'<h[1-6]\b', t) else -1 if re.match(r'</h[1-6]', t) else 0
            out.append(part)
            continue
        if in_a > 0 or in_h > 0 or not part.strip():
            out.append(part)
            continue
        spans = []
        for rx, href in rules:
            if href in used or href == skip_href:
                continue
            for m in re.finditer(rx, part):
                a, b = m.span()
                if (a > 0 and part[a - 1] in '-/#@') or (b < len(part) and part[b] == '-'):
                    continue
                if any(a < y and x < b for x, y, _ in spans):
                    continue
                spans.append((a, b, href))
                used.add(href)
                break
        for a, b, href in sorted(spans, reverse=True):
            part = part[:a] + f'<a href="{href}">{part[a:b]}</a>' + part[b:]
        out.append(part)
    return ''.join(out)


UTM = '?utm_source=article'
SIGNUP_URL = 'https://app.capybaroar.com/signup' + UTM
VALUE = 'Every social channel, one calendar'
UPDATED = '2026-11-23'
UPDATED_TEXT = 'November 23, 2026'
YEAR = '2027'
G2 = json.load(open(os.path.join(LX, 'g2.json')))
PRICING = json.load(open(os.path.join(LX, 'pricing.json')))


def utm(href):
    """Adds the article UTM to links that point at Capybaroar itself."""
    if href.startswith('/') and not href.startswith('/blog') or href.startswith('https://capybaroar.com') or href.startswith('https://app.capybaroar.com'):
        base, _, frag = href.partition('#')
        if 'utm_source=' not in base:
            base += ('&' if '?' in base else '?') + 'utm_source=article'
        return base + ('#' + frag if frag else '')
    return href


def brand_links(html):
    return re.sub(r'href="([^"]+)"', lambda m: f'href="{utm(m.group(1))}"', html)


def stars(n):
    return '⭐' * n


def rating(p, k, tid):
    """Brand and the post's 2 best-known leaders get 5 stars; everyone else gets their G2 score rounded."""
    g = G2.get(tid) or {}
    score = g.get('score')
    top = tid == 'capybaroar' or tid in p.get('leaders', [])
    if tid == 'capybaroar':
        return f'{stars(5)} <span class="lx-g2">New on G2</span>'
    if score is None:
        return f'{stars(5) if top else ""}<span class="lx-g2">Not yet rated on G2</span>'
    n = 5 if top else max(1, min(5, int(score + 0.5)))
    reviews = f', {g["reviews"]:,} reviews' if g.get('reviews') else ''
    return f'{stars(n)} <a class="lx-g2" href="{esc(g["url"])}" rel="nofollow noopener" target="_blank">{score:.1f}/5 on G2{reviews}</a>'


def price_lines(it):
    return it.get('pricing') or PRICING[it['id']]['lines']


def start_price(it):
    return it.get('start') or PRICING[it['id']]['start']


def ul(items, cls):
    return f'<ul class="{cls}">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'


def item(p, k, it):
    f = FACTS[it['id']]
    tid = it['id']
    overview, pros, cons = it['overview'], list(it['pros']), list(it['cons'])
    if tid == 'capybaroar':
        overview = brand_links(autolink(overview, CAPY_LINKS + NET_LINKS, set()))
        pros = [brand_links(x) for x in pros]
    return f'''<section class="lx-item" id="{tid}" aria-labelledby="{tid}-h">
<h3 id="{tid}-h">{logo(tid, 32)}<span>{k}. {esc(f["name"])}</span></h3>
{shot(tid, it.get("shot", "pricing"))}
<p class="lx-field"><b>Rating:</b> {rating(p, k, tid)}</p>
{overview}
<p class="lx-label"><b>Pros:</b></p>
{ul(pros, "lx-pros")}
<p class="lx-label"><b>Cons:</b></p>
{ul(cons, "lx-cons")}
<p class="lx-label"><b>Pricing:</b></p>
{ul([esc(x) for x in price_lines(it)], "lx-price")}
{agent_card(p) if tid == "capybaroar" else ""}
</section>'''


def what(p):
    w = p['what']
    checks = ''.join(f'<li>✅ {x}</li>' for x in w['bullets'])
    return (f'<h2 id="what">{esc(p["whatH2"])}</h2>\n<p><b>{w["def"]}</b></p>\n{w["body"]}\n'
            f'<p>Most tools include:</p><ul class="lx-checks">{checks}</ul>\n<p>{w["close"]}</p>')


def why(p):
    w = p['why']
    li = ''.join(f'<li><b>{a}:</b> {b}</li>' for a, b in w['bullets'])
    return f'<h2 id="why">{esc(p["whyH2"])}</h2>\n{w["lead"]}\n<ul class="lx-why">{li}</ul>'


def quiz(p):
    """Quick Match: 4 questions, each answer gives a point to some tools; the most points wins, list order breaks ties."""
    order = [it['id'] for it in p['items']]
    qs = ''
    for n, q in enumerate(p['quiz'], 1):
        opts = ''.join(f'<label><input type="radio" name="q{n}" value="{" ".join(ids)}"><span>{esc(lbl)}</span></label>' for lbl, ids in q['options'])
        qs += f'<fieldset><legend>{n}. {esc(q["q"])}</legend>{opts}</fieldset>'
    names = {i: FACTS[i]['name'] for i in order}
    data = json.dumps({'order': order, 'names': names}, separators=(',', ':'))
    return (f'<h3 id="quick-match">{esc(p["quizH3"])}</h3>\n'
            f'<form class="lx-quiz" data-quiz=\'{data}\' onsubmit="return false">{qs}'
            f'<p class="lx-quiz-out" aria-live="polite">Answer all 4 questions to see your match.</p></form>')


TOC_JS = '''<script>(function(){
var d=document.querySelector('.lx-toc details');if(d&&matchMedia('(max-width:1100px)').matches)d.open=false;
var links=[].slice.call(document.querySelectorAll('.lx-toc a[href^="#"]')),by={},on=null;
if(!links.length||!('IntersectionObserver' in window))return;
var io=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;if(on)on.classList.remove('on');on=by[e.target.id];on.classList.add('on')})},{rootMargin:'-15% 0px -75% 0px'});
links.forEach(function(a){var t=document.getElementById(a.getAttribute('href').slice(1));if(t){by[t.id]=a;io.observe(t)}});
})();</script>'''


QUIZ_JS = '''<script>(function(){
document.querySelectorAll('.lx-quiz').forEach(function(f){
var d=JSON.parse(f.getAttribute('data-quiz')),out=f.querySelector('.lx-quiz-out'),n=f.querySelectorAll('fieldset').length;
f.addEventListener('change',function(){
var picked=f.querySelectorAll('input:checked');if(picked.length<n)return;
var s={};d.order.forEach(function(id){s[id]=0});
picked.forEach(function(i){i.value.split(' ').forEach(function(id){if(id in s)s[id]++})});
var best=d.order[0];d.order.forEach(function(id){if(s[id]>s[best])best=id});
out.innerHTML='Your match: <a href="#'+best+'">'+d.names[best]+'</a>. Jump to its review below.';
});});
})();</script>'''


def recap(p):
    rows = ''
    for k, it in enumerate(p['items'], 1):
        f = FACTS[it['id']]
        tid = it['id']
        href = utm('https://capybaroar.com/') if tid == 'capybaroar' else f['home']
        rel = '' if tid == 'capybaroar' else ' rel="nofollow noopener" target="_blank"'
        st = rating(p, k, tid).split(' ')[0] if not rating(p, k, tid).startswith('<') else '&ndash;'
        rows += (f'<tr><th scope="row"><a href="{esc(href)}"{rel}>{logo(tid, 20)}<span>{esc(f["name"])}</span></a></th>'
                 f'<td>{st}</td><td>{esc(it["best"])}</td><td>{esc(start_price(it))}</td></tr>')
    return (f'<h2 id="recap">{esc(p["recapH2"])}</h2>\n'
            '<div class="scroll"><table class="cmp lx-cmp"><caption class="sr">Recap of every tool</caption><thead><tr>'
            '<th scope="col">Tool</th><th scope="col">Rating</th><th scope="col">Best feature</th><th scope="col">Starting price</th>'
            f'</tr></thead><tbody>{rows}</tbody></table></div>\n'
            f'<p class="lx-try"><b><a href="{SIGNUP_URL}">👉 Try Capybaroar for free</a></b></p>')


def faq(p):
    qa = ''.join(f'<h3>{esc(q)}</h3>\n<p>{a}</p>\n' for q, a in p['faqs'])
    return f'<h2 id="faq">Frequently Asked Questions</h2>\n{qa}'


# The site's motion layer (build_motion.py): the animated calendar closing card and the AI chat cards.
import importlib.util as _ilu
_spec = _ilu.spec_from_file_location('build_motion', os.path.join(HERE, 'build_motion.py'))
MO = _ilu.module_from_spec(_spec)
_spec.loader.exec_module(MO)
SPRITE_NETS = ['instagram', 'tiktok', 'linkedin', 'youtube', 'facebook', 'x', 'threads', 'pinterest', 'bluesky', 'mastodon', 'discord']
NET_NAMES = {'instagram': 'Instagram', 'tiktok': 'TikTok', 'linkedin': 'LinkedIn', 'youtube': 'YouTube', 'facebook': 'Facebook', 'x': 'X',
             'threads': 'Threads', 'pinterest': 'Pinterest', 'bluesky': 'Bluesky', 'mastodon': 'Mastodon', 'discord': 'Discord'}


def post_nets(p):
    """The networks a post is about, from its cover; mixed networks when it covers them all."""
    c = p.get('cover', {})
    nets = [n for n in (c.get('networks') or [c.get('network')]) if n in SPRITE_NETS]
    return nets or MO.MIXED


def agent_card(p):
    """Animated card in Capybaroar's entry: Claude drafts a week of posts in Capybaroar (plays when it scrolls into view)."""
    nets = post_nets(p)
    names = [NET_NAMES[n] for n in dict.fromkeys(nets)][:3]
    where = names[0] if len(names) == 1 else ', '.join(names[:-1]) + ' and ' + names[-1]
    titles = ['Launch day is here', 'How we feed the starter', 'Meet our bakers', 'Behind the oven', 'Weekend bake list']
    week = ''.join(f'<li data-s><small>{d}</small><svg class="v2-net" aria-hidden="true"><use href="#n-{nets[i % len(nets)]}"/></svg><span>{t}</span><em class="v2-state s-mute">Draft</em></li>'
                   for i, (d, t) in enumerate(zip(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], titles)))
    html = MO.card(utm('/ai-social-media-agent'), 'i-spark', 'AI agent', 'Ask once. Get a week of posts.',
                   'Tell the agent, Claude or ChatGPT what you want. Capybaroar drafts the week and puts every post on your calendar for you to review.', 'cl',
                   f'<p class="ai-me" data-s>Plan next week\'s {where} posts about our sourdough launch and save them as drafts.</p>{MO.USED}'
                   f'<p class="ai-say" data-s>Done. 5 drafts are on your Capybaroar calendar for next week. Nothing goes live until you approve it.</p><ul class="ai-week">{week}</ul>')
    html = html.replace('</p></div>', f'</p><a class="btn sm lx-shine" href="{SIGNUP_URL}">Try it free for 14 days<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a></div>', 1)
    return f'<div class="lx-agent">{html}</div>'


def ready(p):
    nets = SPRITE_NETS
    chips = ''.join(f'<span class="lx-r-chip"><svg aria-hidden="true"><use href="#n-{n}"/></svg>{NET_NAMES[n]}</span>' for n in nets)
    return f'''<aside class="lx-ready" aria-labelledby="ready-h">
<div class="lx-r-fx" aria-hidden="true"><span class="cx-blob b1"></span><span class="cx-blob b2"></span></div>
<div class="lx-r-main">
<span class="lx-r-logo"><img src="/icon.svg" alt="" width="56" height="56"><i aria-hidden="true"></i></span>
<div class="lx-r-text"><h2 id="ready-h">Ready to use Capybaroar?</h2><p>{VALUE}. Plan, write and schedule posts to 14 networks, free forever for 3 channels.</p></div>
<a class="btn lx-shine" href="{SIGNUP_URL}">👉 Start free<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>
</div>
<div class="lx-r-tick" aria-hidden="true"><div class="lx-r-track">{chips}{chips}</div></div>
</aside>'''


def closing_card(p):
    cta = f'<a class="btn" href="{SIGNUP_URL}">Start free</a><a class="btn ghost" href="{utm("/pricing")}">See pricing</a>'
    return MO.closing('Every social channel, <span>one calendar.</span>',
                      'Bring Instagram, TikTok, LinkedIn, YouTube and 10 more networks into one calendar. Your AI agent drafts the week, and you approve it.',
                      cta, post_nets(p))


def related_posts(p):
    mine = {i['id'] for i in p['items']}
    scored = sorted((len(mine & {i['id'] for i in q['items']}) / len(mine | {i['id'] for i in q['items']}), q['order'], q) for q in POSTS if q is not p)
    picked = [q for _, _, q in sorted(scored, key=lambda x: (-x[0], x[1]))[:6]]
    li = ''.join(f'<li><a href="/blog/{q["slug"]}"><img src="/img/blog/{q["slug"]}.webp" width="2400" height="1260" alt="{esc(q["title"])} cover image" loading="lazy"><span>{esc(q["title"])}</span></a></li>' for q in picked)
    return f'<section class="lx-related" aria-labelledby="related"><div class="wrap"><h2 id="related">Related Posts</h2><ul class="lx-more">{li}</ul></div></section>'


def toc(p):
    rows = [('what', p['whatH2']), ('why', p['whyH2']), ('list', p['listH2'])]
    rows += [(it['id'], f'{k}. {FACTS[it["id"]]["name"]}') for k, it in enumerate(p['items'], 1)]
    rows += [('recap', 'Recap Table'), ('conclusion', 'Conclusion'), ('faq', 'Frequently Asked Questions'), ('closing-title', VALUE), ('related', 'Related Posts')]
    li = ''.join(f'<li{" class=\"sub\"" if a in {i["id"] for i in p["items"]} else ""}><a href="#{a}">{esc(b)}</a></li>' for a, b in rows)
    return f'<aside class="lx-toc"><details open><summary>Jump to</summary><nav aria-label="Jump links"><ol>{li}</ol></nav></details></aside>'


def wordcount(html):
    return len(re.sub(r'<[^>]+>', ' ', html).split())


cards = []
for p in POSTS:
    slug = '/blog/' + p['slug']
    n = len(p['items'])
    p.setdefault('listH2', p['title'] + '!')
    p.setdefault('recapH2', p['title'] + ': Recap Table')
    p.setdefault('quizH3', p['keyword'].title() + ': Quick Match')
    here = slug
    used = set()
    post_links = [(rx, '/blog/' + t) for rx, t in POST_LINKS]
    intro = autolink(p['intro'], NET_LINKS + post_links, used, skip_href=here)
    items_html = ''.join(item(p, k, it) for k, it in enumerate(p['items'], 1))
    conclusion = brand_links(p['conclusion'])
    article = f'''{intro}
{what(p)}
{why(p)}
<h2 id="list">{esc(p["listH2"])}</h2>
<p>Here are the {n} tools, starting with the one we know best.</p>
{quiz(p)}
{items_html}
{recap(p)}
<h2 id="conclusion">Conclusion</h2>
{conclusion}
{faq(p)}
{ready(p)}'''
    body = f'''<section class="hero f-hero lx-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<nav class="lx-crumb" aria-label="Breadcrumb"><a href="/blog">Blog</a> / <span>Guides</span></nav>
<p class="lx-updated">Last updated {UPDATED_TEXT}</p>
<h1>{esc(p["title"])}</h1>
<p class="lx-by">By Capybaroar Team</p>
<p class="lx-tagline"><span>{VALUE}.</span> <a class="btn sm" href="{SIGNUP_URL}">Start free</a></p>
</div>
<div class="wrap"><img class="lx-cover" src="/img/blog/{p["slug"]}.webp" width="2400" height="1260" alt="{esc(p["heroAlt"])}"></div>
</section>
<section id="article" aria-label="Article"><div class="wrap lx-layout">{toc(p)}<article class="t-read lx">
{article}
</article></div></section>
{closing_card(p)}
{related_posts(p)}'''
    p['_words'] = wordcount(article)
    html = page(slug, 'sched', p['title'], p['desc'], body, p['faqs'])
    # The questions sit inside the article as H2 + H3, so drop the shared FAQ band; the FAQPage schema stays.
    html, nf = re.subn(r'<section id="faq" class="band-gray".*?</section>\n', '', html, count=1, flags=re.S)
    assert nf == 1
    html = html.replace('content="https://capybaroar.com/img/og.jpg"', f'content="https://capybaroar.com/img/blog/{p["slug"]}.jpg"')
    html = html.replace('<meta property="og:type" content="website">', '<meta property="og:type" content="article">')
    art = {"@context": "https://schema.org", "@type": "Article", "headline": p['title'], "description": p['desc'], "image": f"https://capybaroar.com/img/blog/{p['slug']}.jpg",
           "dateModified": UPDATED, "author": {"@type": "Organization", "name": "Capybaroar Team", "url": "https://capybaroar.com"}, "publisher": {"@type": "Organization", "name": "Capybaroar", "url": "https://capybaroar.com"},
           "mainEntityOfPage": "https://capybaroar.com" + slug}
    lst = {"@context": "https://schema.org", "@type": "ItemList", "itemListElement": [
        {"@type": "ListItem", "position": k, "name": FACTS[it['id']]['name'], "url": f"https://capybaroar.com{slug}#{it['id']}"} for k, it in enumerate(p['items'], 1)]}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Blog", "item": "https://capybaroar.com/blog"},
        {"@type": "ListItem", "position": 2, "name": "Guides", "item": "https://capybaroar.com/blog"},
        {"@type": "ListItem", "position": 3, "name": p['title'], "item": "https://capybaroar.com" + slug}]}
    ld = ''.join('<script type="application/ld+json">' + json.dumps(x, separators=(',', ':')) + '</script>\n' for x in (art, lst, crumbs))
    html = html.replace('</head>', ld + '</head>', 1)
    html = MO.add_assets(html.replace('/home.css?v=8', '/home.css?v=10'))
    html = with_promo(html, 'index').replace('<body>', '<body class="lx-page">', 1).replace('</body>', TOC_JS + QUIZ_JS + '\n</body>', 1)
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
