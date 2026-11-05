"""Builds the five feature landing pages for capybaroar.com from the homepage's parts, and updates the shared nav and
footer on every page. Run from anywhere; writes into site/public."""
import os, re, json, html as H

P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public') + os.sep  # site/public/
home = open(P + 'index.html').read()

# ---------- shared nav and footer ----------
PAGES = [
    ('/social-media-scheduler', 'Scheduler'),
    ('/social-media-inbox', 'Inbox'),
    ('/social-media-analytics', 'Analytics'),
    ('/link-in-bio', 'Link in bio'),
    ('/mcp', 'MCP'),
]
PLATFORM = [
    ('/social-media-scheduler', 'i-calendar', 'Scheduler', 'Plan and post to 12 networks'),
    ('/social-media-inbox', 'i-inbox', 'Inbox', 'Every comment in one list'),
    ('/social-media-analytics', 'i-chart', 'Analytics', 'See what works and when'),
    ('/link-in-bio', 'i-link', 'Link in bio', 'One page for every link'),
    ('/#agents', 'i-spark', 'Agents', 'A week of posts in one message'),
    ('/mcp', 'i-bot', 'MCP', 'Work from Claude, ChatGPT or Cursor'),
]
CHANNELS_NAV = [
    ('/instagram-post-scheduler', 'instagram', 'Instagram', 'Posts, Reels, Stories'),
    ('/facebook-post-scheduler', 'facebook', 'Facebook', 'Posts and Reels'),
    ('/tiktok-scheduler', 'tiktok', 'TikTok', 'Videos'),
    ('/linkedin-post-scheduler', 'linkedin', 'LinkedIn', 'Profiles and Pages'),
    ('/youtube-video-scheduler', 'youtube', 'YouTube', 'Videos'),
    ('/x-post-scheduler', 'x', 'X', 'Posts'),
    ('/threads-scheduler', 'threads', 'Threads', 'Posts and carousels'),
    ('/pinterest-pin-scheduler', 'pinterest', 'Pinterest', 'Pins'),
    ('/bluesky-scheduler', 'bluesky', 'Bluesky', 'Posts'),
    ('/mastodon-scheduler', 'mastodon', 'Mastodon', 'Posts'),
    ('/discord-message-scheduler', 'discord', 'Discord', 'Messages'),
]
RESOURCES = [('/blog', 'i-file', 'Blog', 'Guides and news'), ('/api', 'i-layers', 'API docs', 'REST API, MCP and webhooks')]
UTILITIES = [('/tools/font-generator', 'i-text', 'Font generator', 'Fonts for Instagram and more'), ('/tools/character-counter', 'i-text', 'Character counter', 'Fits on every network?'),
             ('/tools/emoji-copy-paste', 'i-smile', 'Emoji copy and paste', 'Every emoji, one click'), ('/tools/linkedin-text-formatter', 'i-pen', 'LinkedIn formatter', 'Bold and lists for LinkedIn'),
             ('/tools/instagram-post-size', 'i-image', 'Instagram post size', 'Check and resize pictures'), ('/tools/best-time-to-post', 'i-clock', 'Best time to post', 'Your audience\'s hours, your time'),
             ('/tools/utm-builder', 'i-link', 'UTM link builder', 'Track every post'), ('/tools', 'i-grid', 'All free tools', '29 tools, no account needed')]
CHEV = '<svg class="dd-chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def dd_item(u, ic, t, d, logo=False):
    mark = f'<svg class="nl" aria-hidden="true"><use href="#n-{ic}"/></svg>' if logo else f'<svg class="ico" aria-hidden="true"><use href="#{ic}"/></svg>'
    return f'<a class="dd-item" href="{u}"><span class="dd-ic{" logo" if logo else ""}">{mark}</span><span class="dd-tx"><b>{t}</b><small>{d}</small></span></a>'


def dd(key, label, items, logo=False, cols=1, foot=''):
    body = ''.join(dd_item(*x, logo=logo) for x in items)
    return (f'<div class="dd" data-dd="{key}"><button class="dd-btn" type="button" aria-expanded="false" aria-controls="dd-{key}">{label}{CHEV}</button>'
            f'<div class="dd-panel" id="dd-{key}"><div class="dd-box cols{cols}">{body}{foot}</div></div></div>')


ALLCH = '<a class="dd-all" href="/social-media-scheduler#networks">See what you can post on each network<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg></a>'
NAV = (dd('platform', 'Platform', PLATFORM, cols=2) + dd('channels', 'Channels', CHANNELS_NAV, logo=True, cols=3, foot=ALLCH)
       + '<a class="nav-a" href="/pricing">Pricing</a>' + dd('resources', 'Resources', RESOURCES) + dd('utilities', 'Utilities', UTILITIES, cols=2))


def sheet_group(title, items, logo=False, cols=1):
    links = ''.join(f'<a href="{u}">' + (f'<svg class="nl" aria-hidden="true"><use href="#n-{ic}"/></svg>' if logo else f'<svg class="ico" aria-hidden="true"><use href="#{ic}"/></svg>') + f'{t}</a>' for u, ic, t, _ in items)
    return f'<div class="sh-g"><p class="sh-t">{title}</p><div class="sh-l cols{cols}">{links}</div></div>'


SHEET = (sheet_group('Platform', PLATFORM) + sheet_group('Channels', CHANNELS_NAV, logo=True, cols=2)
         + sheet_group('Resources', RESOURCES) + sheet_group('Utilities', UTILITIES, cols=2)
         + '<div class="sh-g sh-end"><a href="/pricing">Pricing</a><a href="https://app.capybaroar.com/login">Log in</a></div>')
FOOT = ''.join(f'<li><a href="{u}">{n}</a></li>' for u, _, n, _ in PLATFORM) + '<li><a href="/pricing">Pricing</a></li><li><a href="/blog">Blog</a></li><li><a href="/tools">Free tools</a></li><li><a href="/api">API docs</a></li>'
NAV_IDS = ['i-calendar', 'i-inbox', 'i-chart', 'i-link', 'i-spark', 'i-bot', 'i-file', 'i-layers', 'i-grid', 'i-arrow', 'i-smile', 'i-text', 'i-pen', 'i-image', 'i-clock'] + [f'n-{c[1]}' for c in CHANNELS_NAV]


def nav_sprite(src):
    syms = []
    for i in NAV_IDS:
        m = re.search(r'<symbol id="' + re.escape(i) + r'".*?</symbol>', src, flags=re.S)
        assert m, i
        syms.append(m.group(0))
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false" class="nav-sprite"><defs>' + ''.join(syms) + '</defs></svg>\n'


NAV_SPRITE = nav_sprite(open(P + 'index.html').read())


# Floating Capybaroar card on the free tools and the blog: one line that fits what the visitor just did.
PROMO_COPY = {
    'text': ('Styled your text? Schedule the post.', 'Write it once and Capybaroar posts it to Instagram, TikTok, LinkedIn and 9 more networks on time.'),
    'write': ('Post ready? Let it go out on time.', 'Capybaroar posts to 12 networks from one calendar and checks every limit before it goes out.'),
    'image': ('Picture ready? Schedule the post.', 'Capybaroar crops it for each network and posts it to 12 networks from one calendar.'),
    'plan': ('Plan a week of posts in minutes.', 'Capybaroar\'s agent drafts your posts and puts them on one calendar for 12 networks.'),
    'index': ('Plan a week of posts in minutes.', 'Capybaroar\'s agent drafts your posts and puts them on one calendar for 12 networks.'),
}


def promo(group):
    title, line = PROMO_COPY[group]
    nets = ''.join(f'<svg class="nl" aria-hidden="true"><use href="#n-{n}"/></svg>' for n in ['instagram', 'tiktok', 'linkedin', 'youtube', 'x', 'facebook'])
    return (f'<aside class="promo" data-promo hidden aria-label="Capybaroar">'
            f'<img class="promo-mark" src="/icon.svg" alt="" width="40" height="40">'
            f'<div class="promo-tx"><b>{title}</b><p>{line}</p><span class="promo-nets">{nets}<small>Free plan, no card</small></span></div>'
            f'<a class="btn sm promo-go" href="https://app.capybaroar.com/signup">Start free</a>'
            f'<button class="promo-x" type="button" aria-label="Close" data-promo-close><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button></aside>')


def with_promo(html, group):
    if 'data-promo' in html:
        return html
    html = html.replace('</main>', '</main>\n' + promo(group), 1)
    return html.replace('</body>', '<script src="/promo.js?v=1" defer></script>\n</body>', 1)


def renav(s):
    s, a = re.subn(r'<nav class="nav-links" aria-label="Main">.*?</nav>', lambda m: f'<nav class="nav-links" aria-label="Main">{NAV}</nav>', s, flags=re.S)
    s, b = re.subn(r'<nav class="nav-sheet" aria-label="Menu">.*?</nav>', lambda m: f'<nav class="nav-sheet" aria-label="Menu">{SHEET}</nav>', s, flags=re.S)
    s, c = re.subn(r'(<nav aria-labelledby="f-product"><h2 id="f-product">Product</h2><ul>).*?(</ul></nav>)', lambda m: m.group(1) + FOOT + m.group(2), s, flags=re.S)
    assert a == 1 and b == 1 and c == 1, (a, b, c)
    # Pages that don't carry the full sprite get the nav's icons and logos.
    if 'id="n-instagram"' not in s:
        s = s.replace('<body>\n', '<body>\n' + NAV_SPRITE, 1)
    if '/nav.js' not in s:
        s = s.replace('</body>', '<script src="/nav.js?v=1" defer></script>\n</body>', 1)
    return s


def grab(s, id_):
    """The whole element that carries id="id_", by counting its own tag."""
    i = s.index(f'id="{id_}"')
    st = s.rindex('<', 0, i)
    tag = re.match(r'<(\w+)', s[st:]).group(1)
    depth, j = 0, st
    pat = re.compile(rf'<{tag}\b|</{tag}>')
    for m in pat.finditer(s, st):
        depth += 1 if m.group(0) != f'</{tag}>' else -1
        if depth == 0:
            return s[st:m.end()]
    raise ValueError(id_)


home = renav(home)
# "Learn more" under each homepage tour row
LEARN = {'Scheduler': '/social-media-scheduler', 'Inbox': '/social-media-inbox', 'Analytics': '/social-media-analytics', 'Link in bio': '/link-in-bio'}
for name, url in LEARN.items():
    pat = re.compile(r'(<p class="tag"><svg class="ico"><use href="#i-[a-z]+"/></svg>' + re.escape(name) + r'</p>.*?</ul>\n)(</div>)', re.S)
    if 'class="more" href="' + url not in home:
        home, n = pat.subn(lambda m: m.group(1) + f'<a class="more" href="{url}">Learn more<svg class="ico"><use href="#i-arrow"/></svg></a>\n' + m.group(2), home, count=1)
        assert n == 1, name
if 'href="/mcp">See the full guide' not in home:
    a = '<p class="g-dev">Building your own app? Read the <a href="/api">API docs</a>.</p>'
    assert a in home
    home = home.replace(a, '<p class="g-dev"><a href="/mcp">See the full guide and prompt library</a>. Building your own app? Read the <a href="/api">API docs</a>.</p>')
home = home.replace('/site.js?v=1', '/site.js?v=2')
open(P + 'index.html', 'w').write(home)

for f in ['api.html', 'terms.html', 'privacy.html', 'data-deletion.html', '404.html']:
    s = open(P + f).read()
    open(P + f, 'w').write(renav(s))

# ---------- parts taken from the homepage ----------
sprites = home[home.index('<body>\n') + 7:home.index('<a class="skip"')]
header = home[home.index('<header class="nav">'):home.index('</header>') + 9]
footer = home[home.index('<footer class="foot">'):home.index('</footer>') + 9]
closing = grab(home, 'closing-title')  # the h2; we rebuild the band below
STAGE = {k: grab(home, k) for k in ['sc-sched', 'sc-inbox', 'sc-agent', 'sc-ana', 'sc-bio']}
ZVIS = {k: grab(home, k) for k in ['z-prev', 'z-inbox', 'z-heat', 'z-bio']}
guide_apps = grab(home, 'mcp-title')  # not used; keeps grab honest
mcp_sec = grab(home, 'mcp')
g_start = mcp_sec.index('<div class="g-apps"')
g_end = mcp_sec.index('<p class="g-dev">')
GUIDE = mcp_sec[g_start:g_end]

ICON = {'sched': 'i-calendar', 'inbox': 'i-inbox', 'ana': 'i-chart', 'bio': 'i-link', 'mcp': 'i-bot'}


def ico(i, cls='ico'):
    return f'<svg class="{cls}"><use href="#{i}"/></svg>'


def net(n):
    return f'<svg class="nl"><use href="#n-{n}"/></svg>'


def face(n, size=28):
    return f'<span class="av" style="width:{size}px;height:{size}px"><img src="/img/faces/{n}.webp" alt="" width="{size}" height="{size}" loading="lazy" decoding="async"></span>'


def food(n, cls=''):
    return f'<img{" class=" + chr(34) + cls + chr(34) if cls else ""} src="/img/food/{n}.webp" alt="" loading="lazy" decoding="async">'


def checks(items):
    return '<ul class="checks">' + ''.join(f'<li>{x}</li>' for x in items) + '</ul>'


def zrow(tag_icon, tag, h2a, h2b, para, items, visual, flip=False, more=None):
    m = f'<a class="more" href="{more[0]}">{more[1]}{ico("i-arrow")}</a>' if more else ''
    return f'''<article class="z{' flip' if flip else ''}">
<div class="z-text">
<p class="tag">{ico(tag_icon)}{tag}</p>
<h2>{h2a} <span>{h2b}</span></h2>
<p>{para}</p>
{checks(items)}
{m}
</div>
{visual}
</article>'''


def mock(inner, cls=''):
    return f'<div class="z-vis dots mk-vis {cls}" aria-hidden="true" data-reveal>{inner}</div>'


def faq_html(qs):
    out = []
    for k, (q, a) in enumerate(qs):
        out.append(f'<details{" open" if k == 0 else ""}><summary>{q}</summary><p>{a}</p></details>')
    return f'''<section id="faq" class="band-gray" aria-labelledby="faq-title">
<div class="wrap faq-wrap">
<header class="head">
<h2 id="faq-title">Questions. <span>Answers.</span></h2>
<p>Something else? Write to <a href="mailto:hello@capybaroar.com">hello@capybaroar.com</a>.</p>
</header>
<div class="faq">
{''.join(out)}
</div>
</div>
</section>'''


RELATED = {
    'sched': ('/social-media-scheduler', 'i-calendar', 'Scheduler', 'Plan and post to 12 networks from one calendar.'),
    'inbox': ('/social-media-inbox', 'i-inbox', 'Inbox', 'Answer comments, mentions and messages in one list.'),
    'ana': ('/social-media-analytics', 'i-chart', 'Analytics', 'See what works and when to post.'),
    'bio': ('/link-in-bio', 'i-link', 'Link in bio', 'One page for every link you share.'),
    'mcp': ('/mcp', 'i-bot', 'MCP', 'Run Capybaroar from Claude, ChatGPT or Cursor.'),
}


def related(skip):
    cards = ''.join(f'<li><a href="{u}"><span class="ic">{ico(i)}</span><h3>{t}</h3><p>{d}</p><span class="more">Learn more{ico("i-arrow")}</span></a></li>'
                    for k, (u, i, t, d) in RELATED.items() if k != skip)
    return f'''<section class="related-band" aria-labelledby="rel-title">
<div class="wrap">
<header class="head"><h2 id="rel-title">More in Capybaroar. <span>All in one workspace.</span></h2></header>
<ul class="related">{cards}</ul>
</div>
</section>'''


CLOSE = '''<section class="closing" aria-labelledby="closing-title">
<div class="wrap">
<div class="closing-card">
<div>
<h2 id="closing-title">{a} <span>{b}</span></h2>
<p>14 days of Pro free. No card needed.</p>
</div>
<div class="cta"><a class="btn" href="https://app.capybaroar.com/signup">Start free</a><a class="btn ghost" href="/pricing">See pricing</a></div>
</div>
</div>
</section>'''


def hero(key, tag, h1a, h1b, lead, visual):
    return f'''<section class="hero f-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico(ICON[key])}{tag}</p>
<h1>{h1a} <span class="dim">{h1b}</span></h1>
<p class="lead">{lead}</p>
<div class="cta"><a class="btn" href="https://app.capybaroar.com/signup">Start free</a><a class="btn ghost" href="#tour">See how it works</a></div>
<p class="note">14 days of Pro free. No card needed.</p>
</div>
{visual}
</section>'''


def hero_stage(k):
    st = STAGE[k]
    st = st.replace(f'<div class="stage dots" id="{k}" aria-hidden="true">', f'<div class="stage dots" id="{k}" aria-hidden="true" data-scene="{k[3:]}">', 1)
    assert 'data-scene' in st
    return f'<div class="wrap"><div class="showcase f-show"><div class="sc-card">{st}</div></div></div>'


def page(slug, key, title, desc, body, faqs):
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": re.sub('<[^>]+>', '', a)}} for q, a in faqs]}
    url = 'https://capybaroar.com' + slug
    t = H.escape(title)
    d = H.escape(desc)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#ffffff">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Capybaroar">
<meta property="og:url" content="{url}">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:image" content="https://capybaroar.com/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{t}">
<meta name="twitter:description" content="{d}">
<meta name="twitter:image" content="https://capybaroar.com/img/og.jpg">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/home.css?v=6">
<script type="application/ld+json">{json.dumps(ld, separators=(',', ':'))}</script>
</head>
<body>
{sprites}<a class="skip" href="#main">Skip to content</a>
{header}

<main id="main">
{body}
{faq_html(faqs)}
{related(key)}
</main>

{footer}

<script src="/site.js?v=2" defer></script>
<script src="/nav.js?v=1" defer></script>
</body>
</html>
'''


YES = '<span class="yes" title="Yes"></span>'
NO = '<span class="no">&ndash;</span>'


def table(head, rows, cap):
    th = ''.join(f'<th scope="col">{x}</th>' for x in head)
    tr = ''.join('<tr>' + f'<th scope="row">{r[0]}</th>' + ''.join(f'<td>{c}</td>' for c in r[1:]) + '</tr>' for r in rows)
    return f'<div class="scroll ftable"><table class="cmp"><caption class="sr">{cap}</caption><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


def section(id_, tag_icon, tag, h2a, h2b, para, inner, gray=False):
    p = f'<p>{para}</p>' if para else ''
    return f'''<section id="{id_}"{' class="band-gray"' if gray else ''} aria-labelledby="{id_}-title">
<div class="wrap">
<header class="head">
<p class="tag">{ico(tag_icon)}{tag}</p>
<h2 id="{id_}-title">{h2a} <span>{h2b}</span></h2>
{p}
</header>
{inner}
</div>
</section>'''


def points(items):
    return '<ul class="points2">' + ''.join(f'<li>{ico(i)}<div><h3>{t}</h3><p>{d}</p></div></li>' for i, t, d in items) + '</ul>'


def tour(rows):
    return f'<section id="tour" aria-label="Feature tour"><div class="wrap zig">{"".join(rows)}</div></section>'


# =====================================================================================================
# 1. Scheduler
# =====================================================================================================
def month_mock():
    evs = {2: [('linkedin', 'Meet our bakers')], 3: [('instagram', 'Rye is back')], 5: [('tiktok', 'Shaping video'), ('youtube', 'Oven tour')],
           8: [('pinterest', 'Recipe card')], 9: [('instagram', 'Behind the counter')], 10: [('bluesky', 'Q&amp;A')], 12: [('instagram', 'Sourdough drop'), ('x', 'Sourdough drop')],
           15: [('linkedin', 'Hiring')], 16: [('facebook', 'Weekend hours')], 17: [('threads', 'Poll')], 19: [('instagram', 'Croissant day')],
           22: [('youtube', 'Starter guide')], 23: [('tiktok', 'Crumb shot')], 24: [('mastodon', 'New flour')], 26: [('instagram', 'Bread club')], 29: [('linkedin', 'Month recap')]}
    cells = ''
    for d in range(1, 36):
        day = d - 2
        n = day if 1 <= day <= 30 else ''
        items = ''.join(f'<span class="mev rv pop">{net(a)}<em>{b}</em></span>' for a, b in evs.get(day, []))
        cells += f'<div class="mc{" today" if day == 12 else ""}{" off" if not n else ""}"><b>{n}</b>{items}</div>'
    days = ''.join(f'<div class="mh">{x}</div>' for x in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    return mock(f'''<div class="win mk-win">
<div class="win-h">June<span class="seg"><span>Week</span><span class="on">Month</span><span>List</span></span></div>
<div class="mgrid">{days}{cells}</div>
</div>''')


def queue_mock():
    rows = [('Mon', ['9:00 AM', '12:30 PM', '5:00 PM'], [1, 1, 1]), ('Tue', ['9:00 AM', '12:30 PM', '5:00 PM'], [1, 1, 0]), ('Wed', ['9:00 AM', '12:30 PM', '5:00 PM'], [1, 2, 0]),
            ('Thu', ['9:00 AM', '12:30 PM', '5:00 PM'], [0, 0, 0]), ('Fri', ['9:00 AM', '12:30 PM'], [0, 0])]
    out = ''
    for d, ts, st in rows:
        slots = ''
        for t, s in zip(ts, st):
            cls = 'slot full' if s == 1 else ('slot next rv pop' if s == 2 else 'slot')
            lab = '<span class="badge">Filled</span>' if s == 1 else ('<span class="badge y">Next post</span>' if s == 2 else '')
            slots += f'<span class="{cls}"><b>{t}</b>{lab}</span>'
        out += f'<div class="qrow"><span class="qd">{d}</span><div class="qs">{slots}</div></div>'
    return mock(f'''<div class="win mk-win">
<div class="win-h">Queue times<span class="sub">Crumb &amp; Co.</span></div>
<div class="qlist">{out}</div>
<div class="qfoot rv pop">{ico("i-clock")}New posts take the next free time: <b>Wed, 12:30 PM</b></div>
</div>''')


def bulk_mock():
    rows = [('Jun 16', ['instagram', 'facebook'], 'Croissant day is back. Doors at 7.'), ('Jun 18', ['linkedin'], 'We are hiring a night baker.'),
            ('Jun 20', ['tiktok', 'youtube'], 'How we shape a loaf, in 30 seconds.'), ('Jun 23', ['x', 'bluesky', 'threads'], 'New flour from a farm 40 miles away.')]
    tr = ''.join(f'<div class="crow rv pop"><span class="cd">{d}</span><span class="cl">{"".join(net(n) for n in ns)}</span><span class="ct">{t}</span></div>' for d, ns, t in rows)
    weeks = ''.join(f'<span class="pill{" pick" if w == 4 else ""}">{w} {"week" if w == 1 else "weeks"}</span>' for w in [1, 2, 4, 8, 12, 26])
    return mock(f'''<div class="stack2">
<div class="win mk-win">
<div class="win-h">{ico("i-upload")}posts-june.csv<span class="sub">24 posts</span></div>
<div class="csv">{tr}</div>
<div class="mk-foot"><span class="pill dark">Import 24 posts</span></div>
</div>
<div class="win mk-win rv pop">
<div class="win-h">{ico("i-repeat")}Post again</div>
<div class="weeks">{weeks}</div>
</div>
</div>''')


SCHED_NETS = [
    ('linkedin', 'LinkedIn', '3,000', 'Post', False, 'First comment'),
    ('linkedin-page', 'LinkedIn Pages', '3,000', 'Post', False, 'First comment'),
    ('facebook', 'Facebook', '63,206', 'Post or Reel', False, 'First comment'),
    ('instagram', 'Instagram', '2,200', 'Post, Reel or Story', True, 'Reel cover, first comment'),
    ('threads', 'Threads', '500', 'Post', False, ''),
    ('tiktok', 'TikTok', '2,200', 'Video', True, 'Who can watch, comments on or off'),
    ('youtube', 'YouTube', '5,000', 'Video', True, 'Title, tags, visibility, made for kids, thumbnail'),
    ('x', 'X', '280', 'Post', False, ''),
    ('pinterest', 'Pinterest', '500', 'Pin', True, 'Board, title, link'),
    ('bluesky', 'Bluesky', '300', 'Post', False, ''),
    ('mastodon', 'Mastodon', '500', 'Post', False, 'Visibility, content warning'),
    ('discord', 'Discord', '2,000', 'Message', False, ''),
]

sched_body = hero('sched', 'Social media scheduler', 'Schedule posts to 12 networks', 'from one calendar',
                  'Write a post once, fit it to each network and pick a time. Capybaroar posts it for you, on time, every time.', hero_stage('sc-sched'))
sched_body += tour([
    zrow('i-calendar', 'Calendar', 'See every post.', 'Move any of them.', 'Week, month and list views show drafts, scheduled and published posts side by side. Drag a post to a new day, or click an open hour to add one.',
         ['Week, month and list views', 'Drag and drop to change the day', 'Filter by channel or by brand', 'Drafts, scheduled and published posts together'], month_mock()),
    zrow('i-pen', 'Composer', 'Write once.', 'Fit every network.', 'Each network gets its own text, settings and preview, so every post looks right where it lands.',
         ['Phone and desktop previews that match the feed', 'Crop pictures and trim videos to fit', 'Character counts for each network', 'Short links with click counts'], ZVIS['z-prev'], flip=True),
    zrow('i-clock', 'Queue', 'Set your times once.', 'Fill them in order.', 'Pick the hours you want to post each day. New posts take the next free time, so your week stays full without planning every slot.',
         ['Different times for each day', 'Times in your own time zone', 'Bulk uploads and feeds can fill the queue', 'Your AI can find the next free time too'], queue_mock()),
    zrow('i-upload', 'Bulk and repeat', 'Add a month at once.', 'Run your best posts again.', 'Upload a CSV or a stack of photos, turn an RSS feed into posts, and send a good post out again every few weeks.',
         ['Bulk upload from a CSV file', 'A caption for each photo in a batch', 'New articles from a feed become drafts', 'Post again every 1 to 26 weeks'], bulk_mock(), flip=True),
])
sched_body += section('networks', 'i-send', 'Networks', 'What you can post.', 'Network by network.', 'Capybaroar uses each network\'s official API, so posts go out the way the network expects.',
                      table(['Network', 'Characters', 'Format', 'Needs a picture or video', 'Settings in the composer'],
                            [[net(i) + n, c, w, YES if m else NO, st or NO] for i, n, c, w, m, st in SCHED_NETS], 'What you can post on each network'), gray=True)
sched_body += f'''<section id="agent" aria-label="Agent">
<div class="wrap zig">
{zrow('i-bot', 'Agent', 'Ask for a week.', 'Get a full calendar.', 'Tell the agent what is coming up. It reads your channels and recent posts, writes the drafts with pictures and puts them on your calendar for you to check.',
      ['Drafts wait for you to check them', 'Pictures and videos from top AI models', 'Works with your queue times', 'Or use your own AI through MCP'],
      '<div class="z-vis dots" aria-hidden="true">' + STAGE["sc-agent"].replace('<div class="stage dots" id="sc-agent" aria-hidden="true">', '<div class="stage" id="sc-agent" data-scene="agent" style="min-height:440px">', 1) + '</div>', more=('/mcp', 'Use Claude, ChatGPT or Cursor instead'))}
</div>
</section>'''
sched_body += section('teams', 'i-users', 'Teams', 'Many brands.', 'Clients approve with a link.', '', points([
    ('i-check-circle', 'Approvals', 'Turn on approval for a brand and posts wait for a yes before they go out.'),
    ('i-link', 'Review links', 'Clients approve or reject from a link, with no account needed.'),
    ('i-layers', 'Brands', 'Each client gets their own channels, calendar and results.'),
    ('i-users', 'Roles', 'Owners, admins, editors and clients. Clients who only approve don\'t take a seat.'),
]), gray=True)
sched_body += CLOSE.format(a='Your next month of posts,', b='planned today.')
sched_faq = [
    ('Does Capybaroar post on its own?', 'Yes. Once a post is scheduled, Capybaroar publishes it at that time through each network\'s official API. You don\'t need to keep the app open.'),
    ('Which networks can I schedule to?', 'LinkedIn profiles and Pages, Facebook Pages, Instagram, Threads, TikTok, YouTube, X, Pinterest, Bluesky, Mastodon and Discord.'),
    ('Can I schedule Instagram Reels and Stories?', 'Yes. Pick Post, Reel or Story in the composer. Reels can have their own cover. Facebook Reels work too.'),
    ('Can I schedule YouTube videos and TikToks?', 'Yes. YouTube gets its title, tags, visibility and thumbnail. TikTok gets who can watch and whether comments are on.'),
    ('How many posts can I schedule?', 'Free has 30 scheduled posts a month on 3 channels. Creator, Pro and Agency have unlimited posts.'),
    ('What is a posting queue?', 'A set of times you want to post each day. When you add a post to the queue, it takes the next free time.'),
    ('Can I upload many posts at once?', 'Yes. Upload a CSV file or a batch of pictures and videos. Each picture can get its own caption.'),
    ('Can my team and clients approve posts?', 'Yes. Turn on approvals for a brand and posts wait for a yes. Clients can approve from a review link without an account.'),
]
open(P + 'social-media-scheduler.html', 'w').write(page('/social-media-scheduler', 'sched', 'Social media scheduler for 12 networks | Capybaroar',
     'Schedule posts to Instagram, TikTok, LinkedIn, YouTube, X and 7 more networks from one calendar. Queue times, bulk upload and an agent that plans your week. Free plan available.',
     sched_body, sched_faq))

# =====================================================================================================
# 2. Inbox
# =====================================================================================================
def reply_mock():
    return mock(f'''<div class="win mk-win">
<div class="win-h">{face("maya", 22)}Maya Ruiz{net("instagram")}<span class="sub">On: Sourdough drops Friday</span></div>
<div class="mk-pad">
<div class="bub rv pop">Do you ship the starter kit to Dallas? Would love one for my mom.</div>
<div class="sug rv pop"><div class="sug-h">{ico("i-spark")}Suggested reply</div><p>We do! The starter kit ships anywhere in Texas in 2 days. Here's the link to order: crumbandco.com/kit</p></div>
<div class="row-end rv pop"><span class="pill">Edit</span><span class="pill dark">{ico("i-send")}Send</span></div>
</div>
</div>''')


def mod_mock():
    items = [('ana', 'Ana Kim', 'x', 'Best croissant in Austin, no contest.', '<span class="badge green">Liked</span>', ''),
             (None, 'promo_deals_4u', 'instagram', 'Get 10k followers fast!! DM me', '<span class="badge">Hidden</span>', ' hid'),
             ('tom', 'Tom Baker', 'facebook', 'What time do you open on Sunday?', '<span class="badge y">Open</span>', '')]
    out = ''
    for f, n, nw, t, b, extra in items:
        av = face(f, 28) if f else '<span class="av">P</span>'
        out += f'<div class="modrow rv pop{extra}">{av}<div class="bd"><div class="nm">{n}{net(nw)}{b}</div><div class="sn">{t}</div><div class="acts"><span>{ico("i-heart")}Like</span><span>{ico("i-eyeoff")}Hide</span><span>{ico("i-reply")}Reply</span></div></div></div>'
    return mock(f'<div class="win mk-win">{out}</div>')


def sidebar_mock():
    nav = [('i-calendar', 'Calendar', ''), ('i-inbox', 'Inbox', '<span class="cnt rv pop">12</span>'), ('i-chart', 'Analytics', ''), ('i-link', 'Link in bio', ''), ('i-bot', 'Agent', '')]
    nv = ''.join(f'<div class="sbi{" on" if t == "Inbox" else ""}">{ico(i)}{t}{c}</div>' for i, t, c in nav)
    done = ''.join(f'<div class="drow rv pop">{face(f, 22)}<span>{n}</span><span class="badge green">Done</span></div>' for f, n in [('leaf', 'leafandloaf'), ('jon', 'Jon Park'), ('rae', 'rae.bakes')])
    return mock(f'''<div class="sbwrap">
<div class="sb">{nv}</div>
<div class="win mk-win sbmain"><div class="win-h">Inbox<span class="seg"><span>Open</span><span class="on">Done</span></span></div><div class="mk-pad">{done}</div></div>
</div>''')


INBOX_NETS = [('facebook', 'Facebook', YES, YES, YES, YES), ('instagram', 'Instagram', YES, YES, NO, YES), ('threads', 'Threads', YES, NO, NO, YES),
              ('youtube', 'YouTube', YES, NO, NO, YES), ('x', 'X', YES, NO, YES, YES), ('linkedin-page', 'LinkedIn Pages', YES, NO, YES, NO),
              ('bluesky', 'Bluesky', YES, NO, YES, NO), ('mastodon', 'Mastodon', YES, YES, YES, NO)]
inbox_body = hero('inbox', 'Social media inbox', 'Every comment and mention', 'in one inbox',
                  'Comments, replies, mentions and messages from your channels land in one list. Answer from one screen and mark threads done.', hero_stage('sc-inbox'))
inbox_body += tour([
    zrow('i-inbox', 'One list', 'Every comment.', 'One list.', 'See what people say on every channel without opening each app. Filter by network or brand to focus.',
         ['Comments, replies and mentions together', 'Messages from Instagram, Facebook and Mastodon', 'Filter by network, channel or brand', 'Search every thread'], ZVIS['z-inbox']),
    zrow('i-spark', 'Suggested replies', 'Start from a draft.', 'Send it in your words.', 'Ask for a reply and get a draft that fits the thread. Change a word or two and send it.',
         ['Replies that read the whole thread', 'Edit before anything goes out', 'Works on every inbox network', 'Comes with every paid plan'], reply_mock(), flip=True),
    zrow('i-shield', 'Moderation', 'Keep threads clean.', 'Show some love.', 'Like good comments and hide spam where the network allows it, right from the inbox.',
         ['Like on Facebook, X, LinkedIn Pages, Bluesky and Mastodon', 'Hide on Facebook, Instagram, Threads, YouTube and X', 'Hidden comments stay out of the list', 'Every action goes through the network\'s API'], mod_mock()),
    zrow('i-check-circle', 'Stay on top', 'Mark it done.', 'Keep the list short.', 'Done threads leave your open list. A count in the sidebar shows when something new comes in.',
         ['Open and Done views', 'A count for anything new', 'Shared by your whole team', 'Each brand sees its own threads'], sidebar_mock(), flip=True),
])
inbox_body += section('networks', 'i-send', 'Networks', 'Where the inbox works.', 'Network by network.', 'What you can do depends on what each network\'s API allows.',
                      table(['Network', 'Comments and mentions', 'Messages', 'Like', 'Hide'], [[net(i) + n, a, b, c, d] for i, n, a, b, c, d in INBOX_NETS], 'What the inbox can do on each network')
                      + '<p class="fine">LinkedIn profiles, TikTok, Pinterest and Discord are for posting only.</p>', gray=True)
inbox_body += CLOSE.format(a='Answer everyone,', b='from one place.')
inbox_faq = [
    ('Which networks does the inbox cover?', 'Facebook, Instagram, Threads, YouTube, X, LinkedIn Pages, Bluesky and Mastodon. LinkedIn profiles, TikTok, Pinterest and Discord are for posting only.'),
    ('Does it include direct messages?', 'Yes, for Instagram, Facebook and Mastodon. The other networks bring comments, replies and mentions.'),
    ('Can I reply from Capybaroar?', 'Yes. Your reply goes out on the network as your account, in the same thread.'),
    ('What are suggested replies?', 'A draft reply that reads the thread. You edit it and press Send. Suggested replies come with every paid plan.'),
    ('Can my team share the inbox?', 'Yes. Everyone in the workspace sees the same threads, and each brand sees its own channels.'),
    ('Is the inbox on the Free plan?', 'Yes. Free includes the inbox for your 3 channels.'),
]
open(P + 'social-media-inbox.html', 'w').write(page('/social-media-inbox', 'inbox', 'Social media inbox for comments and messages | Capybaroar',
     'Answer comments, mentions and messages from Instagram, Facebook, X, YouTube, Threads and more in one inbox. Suggested replies, like and hide, mark done. Free plan available.',
     inbox_body, inbox_faq))

# =====================================================================================================
# 3. Analytics
# =====================================================================================================
def overview_mock():
    rows = [('instagram', 'Instagram', '21.4K', '1,842', '+248'), ('tiktok', 'TikTok', '14.9K', '1,106', '+191'), ('linkedin-page', 'LinkedIn Page', '7.6K', '512', '+96'),
            ('youtube', 'YouTube', '4.3K', '298', '+51'), ('x', 'X', '2.1K', '156', '+26')]
    tr = ''.join(f'<div class="orow rv pop"><span class="on2">{net(i)}{n}</span><b>{a}</b><b>{b}</b><b class="up">{c}</b></div>' for i, n, a, b, c in rows)
    return mock(f'''<div class="win mk-win">
<div class="win-h">Channels<span class="seg"><span>7 days</span><span class="on">30 days</span><span>90 days</span></span></div>
<div class="ohead"><span>Channel</span><span>Reach</span><span>Engagements</span><span>Followers</span></div>
{tr}
</div>''')


def top_mock():
    posts = [('shape', 'tiktok', 'How we shape a loaf, in 30 seconds', '9.8K', '7.4%'), ('loaf', 'instagram', 'Sourdough drops Friday at 8', '6.1K', '6.2%'), ('croissant', 'facebook', 'Croissant day is back', '3.9K', '4.8%')]
    tr = ''.join(f'<div class="tp rv pop">{food(f)}<div class="bd"><div class="nm">{net(n)}{t}</div><div class="sn">{r} reach<span>{e} engagement</span></div></div></div>' for f, n, t, r, e in posts)
    fm = [('Short video', 92, '6.9%'), ('Picture', 64, '4.8%'), ('Text', 31, '2.3%')]
    bars = ''.join(f'<div class="fm rv pop"><span>{n}</span><span class="tr"><i style="width:{w}%"></i></span><b>{v}</b></div>' for n, w, v in fm)
    return mock(f'''<div class="stack2">
<div class="win mk-win"><div class="win-h">Top posts<span class="sub">Last 30 days</span></div><div class="mk-pad">{tr}</div></div>
<div class="win mk-win"><div class="win-h">By format<span class="sub">Engagement rate</span></div><div class="mk-pad">{bars}</div></div>
</div>''')


def report_mock():
    return mock(f'''<div class="win mk-win rep">
<div class="rep-h">{face("owner", 36)}<div><b>Crumb &amp; Co.</b><small>Monthly report, June</small></div></div>
<div class="n-stats rv pop"><div class="n-stat"><small>Reach</small><b>48.2K</b><em>+18%</em></div><div class="n-stat"><small>Engagements</small><b>3,914</b><em>+11%</em></div><div class="n-stat"><small>New followers</small><b>+612</b><em>+24%</em></div><div class="n-stat"><small>Link clicks</small><b>1,208</b><em>+9%</em></div></div>
<div class="rep-acts rv pop"><span class="pill">{ico("i-link")}Copy link</span><span class="pill">{ico("i-file")}PDF</span></div>
<div class="rep-mail rv pop">{ico("i-mail")}<span>Email this report every month to 2 people</span><span class="sw"></span></div>
</div>''')


ana_body = hero('ana', 'Social media analytics', 'See what works', 'on every network',
                'Reach, engagement and followers for every channel, side by side. Find your best times to post and share reports with your team or clients.', hero_stage('sc-ana'))
ana_body += tour([
    zrow('i-chart', 'Overview', 'Every channel.', 'Side by side.', 'Compare channels on one screen and see how this period stacks up against the one before.',
         ['Reach, engagement and followers', 'Views for 7, 30 and 90 days', 'Change from the period before', 'Filter by brand or channel'], overview_mock()),
    zrow('i-clock', 'Best times', 'Post when', 'your people are online.', 'Capybaroar looks at your own results from the last 90 days and shows the hours that work best for you.',
         ['A heatmap of every day and hour', 'Based on your own posts', 'Your best day at a glance', 'Use it to set your queue times'], ZVIS['z-heat'], flip=True),
    zrow('i-layers', 'Top posts', 'Find your winners.', 'Make more like them.', 'See which posts and formats did best, so you know what to post next.',
         ['Top posts by reach and engagement', 'Compare short video, pictures and text', 'Click counts on every short link', 'Run a winner again with Post again'], top_mock()),
    zrow('i-file', 'Reports', 'Share results', 'in one click.', 'Send a link or a PDF, or email a report every week or month. On Agency, reports carry your logo and color.',
         ['Share as a link or a PDF', 'Report emails every week or month', 'Your logo and color on Agency', 'Clients see results without an account'], report_mock(), flip=True),
])
ana_body += section('ask', 'i-bot', 'Ask your AI', 'Ask about your results.', 'Get answers in plain words.', 'Connect Claude, ChatGPT or Cursor through MCP and ask what worked. Your AI reads your numbers and explains them.',
                    '<div class="ask-ex">' + ''.join(f'<div class="ask rv pop"><span class="bub me">{q}</span></div>' for q in ['Which posts did best last month, and why?', 'What day and format should I post more of?', 'Compare Instagram and LinkedIn for June.']) + f'</div><div class="nets-foot"><a class="btn ghost" href="/mcp">Set up MCP{ico("i-arrow")}</a></div>', gray=True)
ana_body = ana_body.replace('<div class="ask-ex">', '<div class="ask-ex" data-reveal>', 1)
ana_body += CLOSE.format(a='Know what works,', b='then do more of it.')
ana_faq = [
    ('Which numbers do I get?', 'Reach, engagements, engagement rate and new followers for each channel, plus your top posts, best formats and best times to post.'),
    ('Where do the numbers come from?', 'From each network\'s official API. What you see depends on what each network shares.'),
    ('How far back can I look?', 'Pick 7, 30 or 90 days. Best times use your last 90 days.'),
    ('How are best times worked out?', 'From the engagement on your own posts in the last 90 days, by day of the week and hour.'),
    ('Can I share reports with clients?', 'Yes. Share a link or a PDF, or email reports every week or month. Reports come with Pro and Agency, and Agency adds your logo and color.'),
    ('Is analytics on the Free plan?', 'Yes. Free includes analytics for your 3 channels. Reports come with Pro and Agency.'),
]
open(P + 'social-media-analytics.html', 'w').write(page('/social-media-analytics', 'ana', 'Social media analytics and reports | Capybaroar',
     'See reach, engagement and followers for every channel side by side. Best times to post, top posts and reports you can share by link, PDF or email. Free plan available.',
     ana_body, ana_faq))

# =====================================================================================================
# 4. Link in bio
# =====================================================================================================
def sched_links_mock():
    rows = [('i-link', 'Pre-order this week\'s loaves', 'Always on', '<span class="badge green">Live</span>'),
            ('i-link', 'Holiday bread box', 'Dec 1 to Dec 24', '<span class="badge y">Scheduled</span>'),
            ('i-video', 'How we shape a loaf', 'Always on', '<span class="badge green">Live</span>'),
            ('i-link', 'Summer menu', 'Jun 1 to Aug 31', '<span class="badge">Ended</span>')]
    tr = ''.join(f'<div class="e-blk rv pop"><span class="ic2">{ico(i)}</span><div class="bd"><b>{t}</b><small>{d}</small></div>{b}</div>' for i, t, d, b in rows)
    return mock(f'''<div class="win mk-win">
<div class="win-h">Blocks<span class="sub">crumbandco</span></div>
<div class="e-list">{tr}</div>
<div class="when rv pop"><span class="pill">{ico("i-clock")}Starts Dec 1, 8:00 AM</span><span class="pill">{ico("i-clock")}Ends Dec 24, 6:00 PM</span></div>
</div>''')


def themes_mock():
    th = [('t-white', 'owner', 'Crumb &amp; Co.'), ('t-sun', 'rae', 'rae.bakes'), ('t-ink', 'jon', 'Jon Park'), ('t-stone', 'leaf', 'leafandloaf')]
    out = ''
    for c, f, n in th:
        out += f'<div class="mini {c} rv pop">{face(f, 34)}<b>{n}</b><i></i><i></i><i></i></div>'
    return mock(f'<div class="minis">{out}</div>')


def sources_mock():
    src = [('instagram', 'Instagram', 54), ('tiktok', 'TikTok', 27), (None, 'Direct', 12), ('threads', 'Threads', 7)]
    bars = ''.join(f'<div class="fm rv pop"><span>{net(i) if i else ico("i-link", "nl")}{n}</span><span class="tr"><i style="width:{w}%"></i></span><b>{w}%</b></div>' for i, n, w in src)
    return mock(f'''<div class="win mk-win">
<div class="win-h">Page numbers<span class="seg"><span>7 days</span><span class="on">30 days</span><span>90 days</span></span></div>
<div class="n-stats two rv pop"><div class="n-stat"><small>Views</small><b>2,481</b><em>+14%</em></div><div class="n-stat"><small>Clicks</small><b>734</b><em>+21%</em></div></div>
<div class="mk-pad"><div class="b-lab">Where visitors come from</div>{bars}</div>
</div>''')


bio_body = hero('bio', 'Link in bio', 'A link in bio page', 'that counts every click',
                'Build one page for every link you share, from blocks. See views and clicks for each link, and where your visitors come from.', hero_stage('sc-bio'))
bio_body += tour([
    zrow('i-grid', 'Blocks', 'Build it from blocks.', 'Change it any time.', 'Add links, text, social icons, videos, your latest posts and an email button. Drag them into order and the page updates right away.',
         ['Links, text and social icons', 'Videos and your latest posts', 'An email button for sign-ups', 'Hide a block without deleting it'], ZVIS['z-bio']),
    zrow('i-clock', 'Scheduled links', 'Links that start', 'and stop on their own.', 'Give a link a start and end time. It goes live for your launch and leaves when the sale ends.',
         ['Start and end dates for any link', 'Scheduled, Live and Ended at a glance', 'Plan a launch weeks ahead', 'No late-night page edits'], sched_links_mock(), flip=True),
    zrow('i-spark', 'Look', 'Make it yours.', 'Start from a template.', 'Pick a theme and a template, then set the title, description and picture people see when the link is shared.',
         ['Themes and templates to start from', 'Your own share title and picture', 'Search settings for your page', 'On paid plans, the agent builds a first page from your website'], themes_mock()),
    zrow('i-chart', 'Numbers', 'See what people tap.', 'And where they come from.', 'Views and clicks for every block, and the sites and apps that send visitors to your page.',
         ['Views and clicks by day', 'Top links and videos', 'Where your visitors come from', 'Counted privately, without tracking cookies'], sources_mock(), flip=True),
])
bio_body += CLOSE.format(a='One link for everything', b='you share.')
bio_faq = [
    ('Is link in bio free?', 'Yes. Every plan includes link in bio pages. On Free, pages show a small "Made with Capybaroar" badge. Paid plans turn it off.'),
    ('What can I put on my page?', 'Links, text, social icons, videos, your latest posts and an email button. Drag blocks into any order.'),
    ('Does it work with Instagram and TikTok?', 'Yes. Put your page link in your Instagram, TikTok or any other bio. You can see how many visitors each one sends.'),
    ('Can I schedule a link?', 'Yes. Give any link a start and end time, and it shows only between them.'),
    ('Can I use my own domain?', 'Not yet. Your page lives at a Capybaroar link that you can share anywhere.'),
    ('How are views and clicks counted?', 'Capybaroar counts them privately on its own servers, without tracking cookies, and skips known bots.'),
]
open(P + 'link-in-bio.html', 'w').write(page('/link-in-bio', 'bio', 'Free link in bio page with click tracking | Capybaroar',
     'Make a link in bio page from blocks: links, videos, social icons, your latest posts and an email button. Scheduled links, themes, and views and clicks for every link. Free.',
     bio_body, bio_faq))

# =====================================================================================================
# 5. MCP
# =====================================================================================================
def plist(items):
    return '<ul class="g-prompts">' + ''.join(f'<li><p>{t}</p><button class="g-copy" type="button">{ico("i-copy")}<span>Copy</span></button></li>' for t in items) + '</ul>'


PROMPTS = [
    ('i-calendar', 'Plan', [
        'Use Capybaroar. Look at my channels and recent posts, then write a week of posts about [your topic]. Save them as drafts at my next queue times.',
        'Use Capybaroar. Plan two posts a week about [your topic] for the next month, spread across my channels, as drafts.',
        'Use Capybaroar. Look at what is scheduled next week and fill the empty days with drafts.']),
    ('i-pen', 'Write', [
        'Use Capybaroar. Turn this article into a LinkedIn post and an X post, and save both as drafts: [link]',
        'Use Capybaroar. Rewrite my drafts for next week so each one has a stronger first line.',
        'Use Capybaroar. Post this to Instagram tomorrow at 9 AM with this picture: [text] [picture link]']),
    ('i-image', 'Media', [
        'Use Capybaroar. Make a picture of [your idea] and add it to my Monday draft.',
        'Use Capybaroar. Make an 8 second video of [your idea] for TikTok and add it to a draft when it is ready.']),
    ('i-chart', 'Results', [
        'Use Capybaroar. Show my results for the last 30 days and tell me which posts did best.',
        'Use Capybaroar. Which day and format work best for me? Use the last 90 days.',
        'Use Capybaroar. List everything scheduled for this week.']),
]
prompt_cards = '<div class="pgrid">' + ''.join(f'<div class="pcard"><h3>{ico(i)}{t}</h3>{plist(ps)}</div>' for i, t, ps in PROMPTS) + '</div>'
TOOLS = [
    ('i-calendar', 'Plan and post', 'Write, schedule, change and delete posts on any channel.', ['list_channels', 'next_queue_slot', 'create_posts', 'update_post', 'delete_post', 'list_posts', 'get_post']),
    ('i-image', 'Media', 'Upload pictures and videos, or make new ones with AI.', ['upload_media', 'list_media', 'generate_media', 'get_generation']),
    ('i-chart', 'Results', 'Read reach, engagement and best times for any period.', ['get_analytics']),
    ('i-layers', 'Brands and groups', 'Work across brands and saved channel groups.', ['list_brands', 'list_channel_groups']),
    ('i-repeat', 'Webhooks', 'Get an event in your own app when a post goes out.', ['create_webhook', 'set_webhook', 'list_webhooks', 'test_webhook', 'delete_webhook']),
]
tool_cards = '<ul class="tgrid">' + ''.join(f'<li><span class="ic">{ico(i)}</span><h3>{t}</h3><p>{d}</p><ul class="tools">{"".join(f"<li>{x}</li>" for x in xs)}</ul></li>' for i, t, d, xs in TOOLS) + '</ul>'

mcp_body = f'''<section class="hero f-hero f-hero-mcp">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-bot")}MCP and API</p>
<h1>Run your social media <span class="dim">from Claude, ChatGPT or Cursor</span></h1>
<p class="lead">Connect Capybaroar to the AI you already use. Ask it to plan, write and schedule posts, make pictures or check your results.</p>
<div class="cta"><a class="btn" href="https://app.capybaroar.com/settings?tab=api">Get my link</a><a class="btn ghost" href="#prompts">See prompts</a></div>
<p class="note">On every plan, Free too.</p>
</div>
<div class="wrap" id="tour">
{GUIDE}
</div>
</section>'''
mcp_body += section('prompts', 'i-copy', 'Prompt library', 'Copy a prompt.', 'Paste it into your AI.', 'Swap the words in brackets for your own.', prompt_cards, gray=True)
mcp_body += section('tools', 'i-grid', 'What your AI can do', 'Everything you can do in the app,', 'your AI can do too.', 'The MCP server and the REST API run the same actions, with the same checks as the app.', tool_cards)
mcp_body += section('safety', 'i-shield', 'You stay in charge', 'Your AI works for you.', 'You keep the final say.', '', points([
    ('i-file', 'Drafts first', 'Your AI saves drafts unless you ask it to schedule. Brands with approvals still wait for a yes.'),
    ('i-user', 'Acts as you', 'A key has your role and your brands, and nothing more. Delete it any time and access stops.'),
    ('i-shield', 'Plan limits apply', 'Posts from your AI count toward your plan, just like posts from the app.'),
    ('i-clock', 'Fair use', 'Each key can make 120 requests a minute.'),
]), gray=True)
mcp_body += section('developers', 'i-repeat', 'Developers', 'Build on Capybaroar.', 'REST API and webhooks.', 'Use the same actions from your own code, and get a signed event when a post goes out, fails or gets approved.',
                    f'<div class="nets-foot"><a class="btn" href="/api">Read the API docs{ico("i-arrow")}</a></div>')
mcp_body += CLOSE.format(a='Your AI,', b='now on social.')
mcp_faq = [
    ('What is MCP?', 'MCP (Model Context Protocol) is an open standard that lets AI apps use tools. Capybaroar\'s MCP server gives your AI the same actions you have in the app.'),
    ('Which AI apps work with Capybaroar?', 'Claude, ChatGPT, Cursor, Claude Code and any other app that supports remote MCP servers. Apps that take only a link use your MCP link with the key inside it.'),
    ('Is MCP on every plan?', 'Yes. The MCP server and the REST API come with every plan, Free too. Making pictures and videos uses AI credits, which come with every paid plan.'),
    ('Will my AI post without asking me?', 'It saves drafts unless you ask it to schedule. If a brand needs approval, posts wait for a yes from an owner, an admin or the client.'),
    ('Is my MCP link safe?', 'Treat it like a password. It acts as you. If it leaks, delete the key in Settings, then API and MCP, and make a new one.'),
    ('Does ChatGPT need a paid plan?', 'Yes. ChatGPT adds custom connectors in Developer mode, which needs a paid ChatGPT plan.'),
]
open(P + 'mcp.html', 'w').write(page('/mcp', 'mcp', 'Social media MCP server for Claude, ChatGPT and Cursor | Capybaroar',
     'Connect Capybaroar to Claude, ChatGPT or Cursor with MCP. Plan, write and schedule posts, make pictures and check results from your own AI. Step by step guide and prompts.',
     mcp_body, mcp_faq))

# ---------- sitemap and robots ----------
urls = ['/'] + [u for u, _ in PAGES] + ['/api', '/terms', '/privacy', '/data-deletion']
sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>https://capybaroar.com{u}</loc></url>\n' for u in urls) + '</urlset>\n'
open(P + 'sitemap.xml', 'w').write(sm)
open(P + 'robots.txt', 'w').write('User-agent: *\nAllow: /\n\nSitemap: https://capybaroar.com/sitemap.xml\n')
print('built')
