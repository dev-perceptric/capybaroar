"""Builds the social media glossary: /social-media-terms (A to Z with search) and one page per term at
/social-media-terms/<slug>. Run by build_tools.py after build_listicles.py, so page(), autolink() and the shared parts
are loaded. Terms: site/build/glossary/list.json (name, category, the Capybaroar page it ties to) and
site/build/glossary/terms/group*.py (the copy)."""
import os, re, json, glob, string

GL = os.path.join(HERE, 'glossary')
LIST = json.load(open(os.path.join(GL, 'list.json')))
COPY = {}
for f in sorted(glob.glob(os.path.join(GL, 'terms', 'group*.py'))):
    ns = {}
    try:
        exec(open(f).read(), ns)
    except SyntaxError as e:
        print('glossary: skipped', os.path.basename(f), '(not finished:', e.msg + ')')
        continue
    for t in ns['TERMS']:
        COPY[t['slug']] = t
TERMS = [dict(x, **COPY[x['slug']]) for x in LIST if x['slug'] in COPY]
BY = {t['slug']: t for t in TERMS}
BASE = '/social-media-terms'

CHAN = {c[1]: (c[0], c[2]) for c in CHANNELS_NAV}
TOOLS_CAP = {
    'besttime': ('/tools/best-time-to-post', 'Find your best times to post', 'Our free planner shows when your audience is most likely online.'),
    'emoji': ('/tools/emoji-copy-paste', 'Copy any emoji', 'Search and copy emojis in one click with our free tool.'),
    'engagement': ('/tools/engagement-rate-calculator', 'Work out your engagement rate', 'Our free calculator does the math for any post or profile.'),
    'grid': ('/tools/instagram-grid-maker', 'Plan your Instagram grid', 'Split one picture into grid tiles with our free grid maker.'),
    'ytthumb': ('/tools/youtube-thumbnail-size', 'Size your YouTube thumbnail', 'Check and resize thumbnails with our free tool.'),
    'utm': ('/tools/utm-builder', 'Build a tracked link', 'Add UTM tags to any link with our free UTM builder.'),
}
CAP = {
    'sched': ('Schedule it with Capybaroar', 'Plan posts for 12 networks in one calendar, set queue times and let Capybaroar publish them on time.', '/social-media-scheduler', 'See the scheduler'),
    'agent': ('Let the agent write it', 'Tell the Capybaroar agent what you need, and it plans and writes a week of posts as drafts for you to review.', '/#agents', 'See the agent'),
    'ana': ('Track it in Capybaroar', 'See reach, engagement and followers for every channel side by side, with your best times to post.', '/social-media-analytics', 'See analytics'),
    'inbox': ('Answer it in one inbox', 'Comments and mentions from your channels land in one Capybaroar inbox, with suggested replies on paid plans.', '/social-media-inbox', 'See the inbox'),
    'bio': ('Build your link in bio page', 'Make one page for every link you share, right next to your posts in Capybaroar.', '/link-in-bio', 'See link in bio'),
    'mcp': ('Use Capybaroar from your AI', 'Connect Claude, ChatGPT or Cursor to Capybaroar through MCP, on every plan, Free included.', '/mcp', 'Set up MCP'),
    'api': ('Build on Capybaroar', 'The REST API and the MCP server run the same actions as the app, on every plan.', '/api', 'Read the API docs'),
    'approvals': ('Get posts approved first', "On Pro and Agency, teammates and clients approve posts before they go out. Clients who only approve don't take a seat.", '/pricing', 'See plans'),
    'reports': ('Send reports with your brand', 'On Agency, reports carry your logo and color, and you share them by link, PDF or email.', '/social-media-analytics', 'See reports'),
    'gbp': ('Post to Google Business Profile', 'Schedule Google Business Profile posts next to your social posts in one Capybaroar calendar.', '/social-media-scheduler', 'See the scheduler'),
}


def cap_block(key):
    if key in TOOLS_CAP:
        url, title, line = TOOLS_CAP[key]
        go = 'Open the free tool'
    elif key in CHAN:
        url, name = CHAN[key]
        title, line, go = f'Schedule {name} posts', f'Plan and publish {name} posts with Capybaroar, next to every other channel in one calendar.', f'See the {name} scheduler'
    else:
        title, line, url, go = CAP.get(key or 'sched', CAP['sched'])
    return (f'<aside class="lx-signup gl-cap" id="capybaroar" aria-label="Capybaroar"><img src="/icon.svg" alt="" width="48" height="48">'
            f'<div><h2>{esc(title)}</h2><p>{esc(line)}</p><p class="lx-note">Free forever plan. 14 days of Pro free. No card needed.</p></div>'
            f'<div class="lx-cta"><a class="btn" href="https://app.capybaroar.com/signup">Start free</a><a class="btn ghost" href="{url}">{esc(go)}</a></div></aside>')


def hid(text):
    return re.sub(r'[^a-z0-9]+', '-', re.sub('<[^>]+>', '', text).lower()).strip('-')[:60]


# Words too common to link as a term inside other terms' copy.
PLAIN = {'post', 'like', 'profile', 'feed', 'story', 'tag', 'trend', 'viral', 'audience', 'follower', 'handle', 'filter', 'embed', 'pin',
         'saves', 'shares', 'reach', 'mute', 'niche', 'keyword', 'hook', 'grid', 'thread', 'mention', 'queue', 'repost', 'remix', 'avatar',
         'authenticity', 'monetization', 'moderation', 'meme', 'emoji', 'gif', 'bio', 'caption', 'subscriber', 'unfollow', 'troll', 'takeover',
         'highlights', 'x', 'vlog', 'voiceover', 'engagement', 'analytics', 'algorithm', 'api', 'feed', 'tag', 'pov', 'ootd', 'fomo', 'grwm', 'cfbr'}


def term_rules(skip):
    rules = []
    for t in sorted(TERMS, key=lambda x: -len(x['term'])):
        if t['slug'] == skip:
            continue
        name = re.sub(r'\s*\(.*?\)', '', t['term'])
        if name.lower() in PLAIN:
            continue
        rules.append((r'(?i)\b' + re.escape(name) + r's?\b', f'{BASE}/{t["slug"]}'))
    return rules


def az_bar(active=None):
    have = {t['term'][0].upper() for t in TERMS}
    out = ''
    for L in string.ascii_uppercase:
        if L in have:
            out += f'<a href="{BASE}#{L.lower()}"{" class=\"on\"" if L == active else ""}>{L}</a>'
        else:
            out += f'<span>{L}</span>'
    return f'<nav class="gl-az" aria-label="Terms A to Z">{out}</nav>'


written = 0
for t in TERMS:
    slug = f'{BASE}/{t["slug"]}'
    body = t['body']
    heads = []

    def add_id(m):
        h = hid(m.group(2))
        heads.append((h, re.sub('<[^>]+>', '', m.group(2))))
        return f'<h2 id="{h}"{m.group(1)}>{m.group(2)}</h2>'
    body = re.sub(r'<h2([^>]*)>(.*?)</h2>', add_id, body, flags=re.S)
    used = set()
    body = autolink(body, term_rules(t['slug'])[:400], used)
    # Keep it to a handful of links: drop links past the eighth.
    n = [0]

    def cap_links(m):
        n[0] += 1
        return m.group(0) if n[0] <= 8 else m.group(2)
    body = re.sub(r'(<a href="/social-media-terms/[^"]+">)(.*?)</a>', cap_links, body)
    rel = [BY[r] for r in t.get('related', []) if r in BY][:5]
    rel_html = ''.join(f'<li><a href="{BASE}/{r["slug"]}"><b>{esc(r["term"])}</b><span>{esc(r["short"])}</span></a></li>' for r in rel)
    rows = heads + [('capybaroar', 'In Capybaroar')] + ([('related', 'Related terms')] if rel else []) + [('faq', 'Questions')]
    toc = ''.join(f'<li><a href="#{a}">{esc(b)}</a></li>' for a, b in rows)
    mini = ('<div class="lx-mini"><img src="/icon.svg" alt="" width="32" height="32"><b>Try Capybaroar free</b>'
            '<p>An AI agent that plans your week of posts.</p><a class="btn sm" href="https://app.capybaroar.com/signup">Start free</a></div>')
    html_body = f'''<section class="hero f-hero lx-hero gl-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-text")}<a href="{BASE}">Social media terms</a></p>
<h1>{esc(t["term"])}</h1>
<p class="gl-def">{esc(t["short"])}</p>
</div>
</section>
<section aria-label="{esc(t["term"])}"><div class="wrap lx-layout"><aside class="lx-toc"><details open><summary>On this page</summary><nav aria-label="On this page"><ol>{toc}</ol></nav></details>{mini}</aside>
<article class="t-read lx gl">
{body}
{cap_block(t.get("cap"))}
{f'<h2 id="related">Related terms</h2><ul class="gl-rel">{rel_html}</ul>' if rel else ''}
{az_bar(t["term"][0].upper())}
</article></div></section>'''
    title = f'What Is {t["term"]}? Meaning and How to Use It | Capybaroar'
    if len(title) > 70:
        title = f'What Is {t["term"]}? | Capybaroar'
    html = page(slug, 'sched', title, t['short'], html_body, t['faqs'])
    dt = {"@context": "https://schema.org", "@type": "DefinedTerm", "name": t['term'], "description": t['short'], "url": "https://capybaroar.com" + slug,
          "inDefinedTermSet": {"@type": "DefinedTermSet", "name": "Social media terms", "url": "https://capybaroar.com" + BASE}}
    crumbs = {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": 1, "name": "Capybaroar", "item": "https://capybaroar.com/"},
        {"@type": "ListItem", "position": 2, "name": "Social media terms", "item": "https://capybaroar.com" + BASE},
        {"@type": "ListItem", "position": 3, "name": t['term'], "item": "https://capybaroar.com" + slug}]}
    html = html.replace('</head>', ''.join('<script type="application/ld+json">' + json.dumps(x, separators=(',', ':')) + '</script>\n' for x in (dt, crumbs)) + '</head>', 1)
    html = with_promo(html, 'index').replace('<body>', '<body class="lx-page">', 1).replace('</body>', TOC_JS + '\n</body>', 1)
    os.makedirs(P + BASE[1:], exist_ok=True)
    open(P + slug[1:] + '.html', 'w').write(html)
    written += 1

# ---------- the A to Z page ----------
if TERMS:
    groups = ''
    for L in string.ascii_uppercase:
        ts = sorted([t for t in TERMS if t['term'][0].upper() == L], key=lambda x: x['term'].lower())
        if not ts:
            continue
        cards = ''.join(f'<li data-q="{esc((t["term"] + " " + t["short"]).lower())}"><a href="{BASE}/{t["slug"]}"><b>{esc(t["term"])}</b><span>{esc(t["short"])}</span></a></li>' for t in ts)
        groups += f'<section class="gl-group" id="{L.lower()}" aria-labelledby="gl-{L}"><h2 id="gl-{L}">{L}</h2><ul class="gl-list">{cards}</ul></section>'
    idx_body = f'''<section class="hero f-hero simple-hero gl-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-text")}Social media terms</p>
<h1>Social media terms. <span class="dim">From A to Z.</span></h1>
<p class="lead">{len(TERMS)} social media words, metrics and slang explained in plain English, from A/B testing to zero-party data.</p>
<label class="gl-search"><svg class="ico" aria-hidden="true"><use href="#i-search"/></svg><input type="search" placeholder="Search {len(TERMS)} terms" aria-label="Search terms" data-gl-search></label>
</div>
</section>
<section aria-label="All terms"><div class="wrap">
<div class="gl-azwrap">{az_bar()}</div>
{groups}
<p class="gl-none" hidden data-gl-none>No terms match. Try another word.</p>
</div></section>'''
    faqs = [('What is a social media glossary?', 'A social media glossary is a list of the words, metrics and slang people use on social media, each with a plain explanation. Use it to look up a term you see in a report, a brief or a comment.'),
            ('How many terms are in this glossary?', f'There are {len(TERMS)} terms, from A/B testing to zero-party data. Each one has its own page with examples, common questions and related terms.'),
            ('What are the most important social media terms to know?', 'Start with reach, impressions, engagement rate, click-through rate and organic reach. They show up in almost every social media report.')]
    html = page(BASE, 'sched', f'Social Media Terms: {len(TERMS)} Words Explained A to Z | Capybaroar', f'{len(TERMS)} social media terms explained in plain English: metrics, platforms, content formats, ads and slang, from A/B testing to zero-party data.', idx_body, faqs)
    js = '''<script>(function(){var i=document.querySelector('[data-gl-search]'),n=document.querySelector('[data-gl-none]');if(!i)return;
i.addEventListener('input',function(){var q=i.value.trim().toLowerCase(),any=false;
document.querySelectorAll('.gl-group').forEach(function(g){var shown=0;g.querySelectorAll('li').forEach(function(li){var ok=!q||li.getAttribute('data-q').indexOf(q)>-1;li.hidden=!ok;if(ok)shown++});g.hidden=!shown;if(shown)any=true});
n.hidden=any})})();</script>'''
    html = with_promo(html, 'index').replace('</body>', js + '\n</body>', 1)
    open(P + BASE[1:] + '.html', 'w').write(html)
    sm = open(P + 'sitemap.xml').read()
    add = ''.join(f'  <url><loc>https://capybaroar.com{u}</loc></url>\n' for u in [BASE] + [f'{BASE}/{t["slug"]}' for t in TERMS] if f'{u}<' not in sm)
    if add:
        sm = sm.replace('</urlset>', add + '</urlset>')
        open(P + 'sitemap.xml', 'w').write(sm)
print('glossary built:', written)
