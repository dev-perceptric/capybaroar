"""Builds every free tool page under /tools, the Free tools index, the Utilities menu and the sitemap entries.
Runs the earlier builders first so every page shares the same nav and footer."""
import os, re, json
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'public') + os.sep  # site/public/

# Icons the tools use that the homepage sprite didn't have yet; the other pages copy their sprite from it.
NEW_ICONS = {
    'i-smile': '<symbol id="i-smile" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></g></symbol>',
    'i-search': '<symbol id="i-search" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></g></symbol>',
}
idx = open(P + 'index.html').read()
for sid, sym in NEW_ICONS.items():
    if f'id="{sid}"' not in idx:
        idx = idx.replace('<symbol id="i-send"', sym + '<symbol id="i-send"', 1)
open(P + 'index.html', 'w').write(idx)

# The Utilities menu itself is defined in build_pages.py (UTILITIES).
exec(open(os.path.join(HERE, 'build_channels.py')).read())

T = {}
for mod in ('tools_text', 'tools_plan', 'tools_media', 'tools_more'):
    ns = {'__file__': os.path.join(HERE, mod + '.py')}
    exec(open(os.path.join(HERE, mod + '.py')).read(), ns)
    for t in ns['TOOLS']:
        T[t['key']] = t
ORDER = ['font', 'counter', 'emoji', 'besttime', 'fancy', 'igsize', 'invisible', 'bold', 'ytthumb', 'small', 'glitch', 'strike', 'utm', 'ytmoney', 'grid', 'linkedin',
         'words', 'oldenglish', 'cursive', 'igfonts', 'discord', 'upside', 'ytbanner', 'libanner', 'fbcover', 'igstory', 'xheader', 'ttmoney', 'engagement']
assert set(ORDER) == set(T), set(T) ^ set(ORDER)
GROUPS = [('text', 'Text styles'), ('write', 'Writing'), ('image', 'Pictures'), ('plan', 'Planning and growth')]
TOOL_RELATED = {"font": ['fancy', 'bold', 'small', 'glitch', 'strike', 'linkedin'], 'fancy': ['font', 'bold', 'small', 'glitch', 'invisible', 'emoji'],
           'bold': ['linkedin', 'font', 'strike', 'small', 'counter', 'fancy'], 'small': ['font', 'fancy', 'bold', 'invisible', 'strike', 'emoji'],
           'glitch': ['fancy', 'font', 'strike', 'counter', 'small', 'emoji'], 'strike': ['bold', 'font', 'linkedin', 'small', 'glitch', 'counter'],
           'linkedin': ['bold', 'counter', 'font', 'strike', 'utm', 'besttime'], 'invisible': ['fancy', 'font', 'counter', 'emoji', 'small', 'grid'],
           'counter': ['linkedin', 'emoji', 'bold', 'besttime', 'utm', 'font'], 'emoji': ['counter', 'font', 'fancy', 'invisible', 'linkedin', 'besttime'],
           'besttime': ['utm', 'counter', 'igsize', 'ytmoney', 'grid', 'linkedin'], 'utm': ['besttime', 'counter', 'linkedin', 'igsize', 'ytmoney', 'emoji'],
           'ytmoney': ['ytthumb', 'besttime', 'utm', 'counter', 'igsize', 'emoji'], 'igsize': ['grid', 'ytthumb', 'besttime', 'counter', 'font', 'utm'],
           'ytthumb': ['igsize', 'ytmoney', 'grid', 'counter', 'besttime', 'utm'], 'grid': ['igsize', 'ytthumb', 'besttime', 'font', 'emoji', 'counter'],
           'words': ['counter', 'linkedin', 'emoji', 'bold', 'font', 'utm'], 'oldenglish': ['font', 'cursive', 'discord', 'fancy', 'bold', 'igfonts'],
           'cursive': ['font', 'igfonts', 'oldenglish', 'fancy', 'bold', 'small'], 'igfonts': ['font', 'cursive', 'fancy', 'igsize', 'igstory', 'counter'],
           'discord': ['oldenglish', 'font', 'fancy', 'small', 'invisible', 'upside'], 'upside': ['fancy', 'glitch', 'font', 'small', 'strike', 'discord'],
           'ytbanner': ['ytthumb', 'ytmoney', 'libanner', 'xheader', 'fbcover', 'igsize'], 'libanner': ['linkedin', 'fbcover', 'xheader', 'ytbanner', 'igsize', 'bold'],
           'fbcover': ['libanner', 'xheader', 'ytbanner', 'igsize', 'igstory', 'besttime'], 'igstory': ['igsize', 'grid', 'igfonts', 'ytthumb', 'fbcover', 'besttime'],
           'xheader': ['libanner', 'fbcover', 'ytbanner', 'counter', 'igsize', 'bold'], 'ttmoney': ['ytmoney', 'engagement', 'besttime', 'counter', 'utm', 'igstory'],
           'engagement': ['besttime', 'ttmoney', 'ytmoney', 'utm', 'counter', 'igsize']}


def card(k):
    t = T[k]
    return f'<li><a href="{t["slug"]}"><span class="ic">{ico(t["icon"])}</span><h3>{t["name"]}</h3><p>{t["line"]}</p><span class="more">Open tool{ico("i-arrow")}</span></a></li>'


def more_tools(k):
    return f'''<section class="related-band" aria-labelledby="mt-title"><div class="wrap">
<header class="head"><h2 id="mt-title">More free tools. <span>No account needed.</span></h2></header>
<ul class="related tool-list">{''.join(card(x) for x in TOOL_RELATED[k])}</ul>
<div class="nets-foot"><a class="btn ghost" href="/tools">See all {len(ORDER)} tools{ico("i-arrow")}</a></div>
</div></section>'''


for k in ORDER:
    t = T[k]
    body = f'''<section class="hero f-hero tool-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico(t["icon"])}{t["tag"]}</p>
<h1>{t["h1a"]} <span class="dim">{t["h1b"]}</span></h1>
<p class="lead">{t["lead"]}</p>
</div>
<div class="wrap">{t["tool"]}</div>
</section>
<section id="guide" aria-label="Guide"><div class="wrap"><article class="t-read">{t["read"]}</article></div></section>'''
    html = page(t['slug'], 'tool', t['title'], t['desc'], body, t['faq'])
    # FAQ data plus the tool itself for search engines.
    app = {"@context": "https://schema.org", "@type": "WebApplication", "name": t['name'], "url": "https://capybaroar.com" + t['slug'], "applicationCategory": "UtilitiesApplication",
           "operatingSystem": "Any", "browserRequirements": "Requires JavaScript", "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"}, "publisher": {"@type": "Organization", "name": "Capybaroar", "url": "https://capybaroar.com"}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Capybaroar", "item": "https://capybaroar.com/"},
        {"@type": "ListItem", "position": 2, "name": "Free tools", "item": "https://capybaroar.com/tools"},
        {"@type": "ListItem", "position": 3, "name": t['name'], "item": "https://capybaroar.com" + t['slug']}]}
    html = html.replace('</head>', '<script type="application/ld+json">' + json.dumps(app, separators=(',', ':')) + '</script>\n<script type="application/ld+json">' + json.dumps(crumbs, separators=(',', ':')) + '</script>\n</head>', 1)
    html = re.sub(r'<section class="related-band".*?</section>', lambda m: more_tools(k), html, count=1, flags=re.S)
    html = html.replace('<script src="/nav.js?v=1" defer></script>', '<script src="/nav.js?v=1" defer></script>\n<script src="/tools/tools.js?v=1" defer></script>')
    html = with_promo(html, t['group'])
    os.makedirs(P + 'tools', exist_ok=True)
    open(P + t['slug'][1:] + '.html', 'w').write(html)

# ---------- the Free tools page ----------
groups_html = ''
for g, gname in GROUPS:
    ks = [k for k in ORDER if T[k]['group'] == g]
    groups_html += f'<div class="tools-group"><h2>{gname}</h2><ul class="related tool-list">{"".join(card(k) for k in ks)}</ul></div>'
tools_body = f'''<section class="hero f-hero simple-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-grid")}Utilities</p>
<h1>Free social media tools. <span class="dim">No account needed.</span></h1>
<p class="lead">{len(ORDER)} free tools to style your text, check your posts, size your pictures and plan when to post. They run in your browser, so nothing you type or upload leaves your device.</p>
</div>
<div class="wrap">{groups_html}</div>
</section>'''
tp = open(P + 'tools.html').read()
tp = re.sub(r'<section class="hero f-hero simple-hero">.*?</section>', lambda m: tools_body, tp, count=1, flags=re.S)
tp = tp.replace('<meta name="description" content="Free tools for social media from Capybaroar. No account needed.">', '<meta name="description" content="Free social media tools: font generator, character counter, word counter, emoji copy and paste, Instagram post size, LinkedIn text formatter, UTM builder and more. No account needed.">')
open(P + 'tools.html', 'w').write(with_promo(tp, 'index'))

# ---------- sitemap ----------
sm = open(P + 'sitemap.xml').read()
add = ''.join(f'  <url><loc>https://capybaroar.com{T[k]["slug"]}</loc></url>\n' for k in ORDER if T[k]['slug'] not in sm)
sm = sm.replace('  <url><loc>https://capybaroar.com/tools</loc></url>\n', '  <url><loc>https://capybaroar.com/tools</loc></url>\n' + add)
open(P + 'sitemap.xml', 'w').write(sm)
print('tools built:', len(ORDER))
exec(open(os.path.join(HERE, 'build_pricing.py')).read())
