"""The /pricing page: plan cards, a full comparison, what AI credits buy and the pricing FAQ. Every number comes from
src/lib/billing.ts (PLANS, TRIAL_DAYS) and src/lib/genRules.ts (credits per model). Run by build_tools.py, after the
other builders, so it shares their nav, footer and helpers."""
import os, json

# Mirrors PLANS in src/lib/billing.ts. Change both together.
PLANS = [
    dict(id='free', name='Free', price=0, members=1, brands=1, channels=3, posts=30, agent=False, reports=False, white=False, badge_off=False, credits=0),
    dict(id='pro', name='Pro', price=19, members=3, brands=3, channels=15, posts=None, agent=True, reports=True, white=False, badge_off=True, credits=600),
    dict(id='agency', name='Agency', price=59, members=10, brands=None, channels=60, posts=None, agent=True, reports=True, white=True, badge_off=True, credits=2000),
]
TRIAL_DAYS = 14
SIGNUP = 'https://app.capybaroar.com/signup'


def n(v, word, plural=None):
    if v is None:
        return f'Unlimited {plural or word + "s"}'
    return f'{v:,} {word if v == 1 else (plural or word + "s")}'


def plan_card(p):
    on = p['id'] == 'pro'
    items = [f'{n(p["members"], "member")} and {n(p["brands"], "brand").lower() if p["brands"] is None else n(p["brands"], "brand")}',
             n(p['channels'], 'channel'),
             'Unlimited scheduled posts' if p['posts'] is None else f'{p["posts"]} scheduled posts a month',
             'Calendar, inbox and analytics', 'Link in bio, API and MCP']
    if p['agent']:
        items.append('The agent and AI writing tools')
        items.append(f'{p["credits"]:,} AI credits a month')
    if p['reports']:
        items.append('Reports with your logo and color' if p['white'] else 'Reports by link, PDF and email')
    cta = ('Try Pro free', 'btn') if on else ('Start free', 'btn ghost')
    top = f'<div class="plan-top"><h3>{p["name"]}</h3><span class="tag solid">{TRIAL_DAYS} days free</span></div>' if on else f'<h3>{p["name"]}</h3>'
    line = {'free': 'For trying Capybaroar and small side projects.', 'pro': 'For creators and small businesses posting every week.', 'agency': 'For agencies and teams running many brands.'}[p['id']]
    return f'''<article class="plan{' on' if on else ''}">
{top}
<p class="plan-line">{line}</p>
<p class="price">${p['price']}<small>/ month</small></p>
<a class="{cta[1]}" href="{SIGNUP}">{cta[0]}</a>
{checks(items)}
</article>'''


Y, N_ = YES, NO


def cell(v):
    if v is True:
        return Y
    if v is False or v is None:
        return N_
    return v


ROWS = [
    ('Plan', [
        ('Price per month', ['$0', '$19', '$59']),
        ('Team members', ['1', '3', '10']),
        ('Clients who approve posts', ['Unlimited, free'] * 3),
        ('Brands', ['1', '3', 'Unlimited']),
        ('Channels', ['3', '15', '60']),
        ('Scheduled posts', ['30 a month', 'Unlimited', 'Unlimited']),
    ]),
    ('Publishing', [
        ('Calendar with week, month and list views', [True, True, True]),
        ('Composer with previews for every network', [True, True, True]),
        ('Queue times', [True, True, True]),
        ('Bulk upload from CSV or a batch of photos', [True, True, True]),
        ('RSS feeds to posts', [True, True, True]),
        ('Post again every few weeks', [True, True, True]),
        ('Short links with click counts', [True, True, True]),
        ('Approvals and client review links', [True, True, True]),
        ('Delete a post everywhere', [True, True, True]),
    ]),
    ('Inbox and results', [
        ('Inbox for comments, mentions and messages', [True, True, True]),
        ('Suggested replies', [False, True, True]),
        ('Analytics and best times to post', [True, True, True]),
        ('Reports by link, PDF and email', [False, True, True]),
        ('Reports with your logo and color', [False, False, True]),
    ]),
    ('Link in bio', [
        ('Link in bio pages with views and clicks', [True, True, True]),
        ('Turn off the "Made with Capybaroar" badge', [False, True, True]),
    ]),
    ('AI', [
        ('The agent plans and writes posts', [False, True, True]),
        ('Rewrite, captions for photos and hashtags', [False, True, True]),
        ('AI credits for pictures, videos and audio', ['None', '600 a month', '2,000 a month']),
    ]),
    ('Developers', [
        ('REST API and MCP server', [True, True, True]),
        ('Webhooks', [True, True, True]),
    ]),
]


def compare():
    head = '<tr><th scope="col"></th>' + ''.join(f'<th scope="col">{p["name"]}</th>' for p in PLANS) + '</tr>'
    body = ''
    for group, rows in ROWS:
        body += f'<tr class="grp"><th scope="rowgroup" colspan="4">{group}</th></tr>'
        for label, vals in rows:
            body += f'<tr><th scope="row">{label}</th>' + ''.join(f'<td>{cell(v)}</td>' for v in vals) + '</tr>'
    return f'<div class="scroll pr-table"><table class="cmp"><caption class="sr">Compare Capybaroar plans</caption><thead>{head}</thead><tbody>{body}</tbody></table></div>'


# Credits per item, from src/lib/genRules.ts (1 credit = 1 cent of model cost).
CREDITS = [('A picture with FLUX.2 Pro', 3), ('A picture with Ideogram V3', 3), ('A picture with Nano Banana 2', 8), ('A picture with Nano Banana Pro', 15),
           ('A 5-second video with Kling 3 Pro', 84), ('An 8-second video with Veo 3.1', 320), ('A 1,000-character voiceover with ElevenLabs v3', 10), ('A 30-second music track with Lyria 2', 10)]


def credits_table():
    rows = ''.join(f'<tr><th scope="row">{w}</th><td>{c:,}</td><td>{600 // c:,}</td><td>{2000 // c:,}</td></tr>' for w, c in CREDITS)
    return f'<div class="scroll"><table class="cmp"><caption class="sr">What AI credits buy</caption><thead><tr><th scope="col">What you make</th><th scope="col">Credits</th><th scope="col">On Pro (600)</th><th scope="col">On Agency (2,000)</th></tr></thead><tbody>{rows}</tbody></table></div>'


PRICING_FAQ = [
    ('Is there a free plan?', 'Yes. Free has 1 member, 1 brand, 3 channels and 30 scheduled posts a month, with the calendar, inbox, analytics, link in bio, API and MCP server. It stays free with no time limit.'),
    ('Do I need a card for the free trial?', f'No. Every new workspace gets {TRIAL_DAYS} days of Pro without a card.'),
    ('What happens when the trial ends?', 'Your workspace moves to Free unless you upgrade. Nothing you made is deleted, and scheduled posts stay on your calendar.'),
    ('What happens if I go over the Free limits?', 'Nothing you scheduled is lost. You can\'t add more channels, or schedule more posts that month, until you upgrade or the month turns over.'),
    ('What counts as a channel?', 'Each account or Page you connect is one channel. An Instagram account and a Facebook Page are two channels, and a LinkedIn profile and a LinkedIn Page are two.'),
    ('What is a brand?', 'A brand is a group of channels with its own calendar, results and settings, like one client or one business. Agencies use one brand per client.'),
    ('Do clients count as members?', 'No. Clients who only review and approve posts don\'t take a seat, on any plan.'),
    ('What are AI credits?', 'Credits pay for pictures, videos, voiceovers and music made with AI models. Each credit is 1 US cent of what the model costs us, so a FLUX.2 Pro picture uses 3 credits and an 8-second Veo 3.1 video uses 320. Credits reset at the start of each month.'),
    ('Does the agent use credits?', 'Writing posts, rewrites and suggested replies are included in Pro and Agency. Credits are only used when you make pictures, videos or audio.'),
    ('Can I pay yearly?', 'Not yet. Plans are billed monthly.'),
    ('Can I change or cancel my plan?', 'Yes, any time from Settings, then Billing. When you cancel, your plan stays active until the end of the month you paid for.'),
    ('Are prices in US dollars?', 'Yes. Prices are in US dollars, billed monthly through Stripe. Taxes may apply depending on where you are.'),
]

EVERY_PLAN = [('i-calendar', 'Calendar and queue', 'Plan every post on one calendar and fill your queue times.'),
              ('i-inbox', 'Inbox', 'Comments, mentions and messages in one list.'),
              ('i-chart', 'Analytics', 'Reach, engagement and your best times to post.'),
              ('i-link', 'Link in bio', 'A page of links with views and clicks.'),
              ('i-check-circle', 'Approvals', 'Clients approve from a link, without an account.'),
              ('i-bot', 'API and MCP', 'Work from Claude, ChatGPT, Cursor or your own code.')]


def build_pricing():
    cards = ''.join(plan_card(p) for p in PLANS)
    every = '<ul class="pr-every">' + ''.join(f'<li><span class="ic">{ico(i)}</span><div><h3>{t}</h3><p>{d}</p></div></li>' for i, t, d in EVERY_PLAN) + '</ul>'
    body = f'''<section class="hero f-hero pr-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico("i-tag")}Pricing</p>
<h1>Simple plans. <span class="dim">Cancel anytime.</span></h1>
<p class="lead">Start free, or try every Pro feature for {TRIAL_DAYS} days. No card needed.</p>
</div>
<div class="wrap"><div class="plans pr-plans">{cards}</div>
<p class="fine">Prices in US dollars, billed monthly. Taxes may apply. Clients who only approve posts don&rsquo;t count as members.</p></div>
</section>
<section id="every-plan" class="band-gray" aria-labelledby="every-title"><div class="wrap">
<header class="head"><p class="tag">{ico("i-layers")}On every plan</p><h2 id="every-title">The whole platform. <span>Free plan included.</span></h2></header>
{every}
</div></section>
<section id="compare" aria-labelledby="compare-title"><div class="wrap">
<header class="head"><p class="tag">{ico("i-grid")}Compare</p><h2 id="compare-title">Every feature, <span>plan by plan.</span></h2></header>
{compare()}
<div class="nets-foot"><a class="btn" href="{SIGNUP}">Start free</a></div>
</div></section>
<section id="credits" class="band-gray" aria-labelledby="credits-title"><div class="wrap">
<header class="head"><p class="tag">{ico("i-spark")}AI credits</p><h2 id="credits-title">What your AI credits make. <span>Each month.</span></h2>
<p>Pro includes 600 credits a month and Agency 2,000. One credit is one cent of what the model costs, so you can see exactly what you get.</p></header>
<div class="pr-credits">{credits_table()}</div>
<p class="fine">Writing posts, rewrites and suggested replies don&rsquo;t use credits. Credits reset at the start of each month.</p>
</div></section>'''
    body += CLOSE.format(a='Your next month of posts,', b='planned today.').replace('<a class="btn ghost" href="/pricing">See pricing</a>', '<a class="btn ghost" href="https://app.capybaroar.com/login">Log in</a>')
    desc = f'Capybaroar pricing: Free $0, Pro $19 and Agency $59 a month. Compare every feature, see what AI credits make and try Pro free for {TRIAL_DAYS} days, no card needed.'
    html = page('/pricing', 'pricing', 'Pricing: Free, Pro $19 and Agency $59 a Month | Capybaroar', desc, body, PRICING_FAQ)
    offers = {"@context": "https://schema.org", "@type": "SoftwareApplication", "name": "Capybaroar", "applicationCategory": "BusinessApplication", "operatingSystem": "Web",
              "url": "https://capybaroar.com/pricing", "offers": [{"@type": "Offer", "name": p['name'], "price": str(p['price']), "priceCurrency": "USD", "url": "https://capybaroar.com/pricing"} for p in PLANS]}
    html = html.replace('</head>', '<script type="application/ld+json">' + json.dumps(offers, separators=(',', ':')) + '</script>\n</head>', 1)
    open(P + 'pricing.html', 'w').write(html)


build_pricing()
sm = open(P + 'sitemap.xml').read()
if '/pricing</loc>' not in sm:
    sm = sm.replace('  <url><loc>https://capybaroar.com/social-media-scheduler</loc></url>\n', '  <url><loc>https://capybaroar.com/pricing</loc></url>\n  <url><loc>https://capybaroar.com/social-media-scheduler</loc></url>\n', 1)
    open(P + 'sitemap.xml', 'w').write(sm)
print('pricing built')
