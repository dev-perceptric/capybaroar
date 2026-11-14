"""Builds site/public/home-v2.html: a preview of the homepage with a "Built for you" section, a bento grid in place
of the feature tour, and compact pricing and FAQ. Not linked anywhere and marked noindex."""
import re

P = "/home/user/capybaroar/site/public/"
src = open(P + "index.html").read()
lines = src.split("\n")


def ico(name, cls="ico"):
    return f'<svg class="{cls}" viewBox="0 0 24 24" aria-hidden="true"><use href="#{name}"/></svg>'


def net(name):
    return f'<svg class="v2-net" aria-hidden="true"><use href="#n-{name}"/></svg>'


# ---------- Built for you ----------
AUD = [
    {
        "id": "creators", "label": "Creators", "icon": "i-user",
        "title": "Post every day without living on your phone.",
        "points": ["Best times picked from your own results", "A link-in-bio page in minutes", "AI pictures and short videos, from 6 credits"],
        "brand": "Maya Moves", "kind": "Fitness coach",
        "posts": [("instagram", "Reel", "5-minute morning mobility, no gear needed", "Mon 7:30 AM", "Scheduled"),
                  ("tiktok", "Video", "3 stretches for desk workers", "Tue 6:00 PM", "Scheduled"),
                  ("youtube", "Short", "Why I stopped skipping leg day", "Thu 12:00 PM", "Draft")],
    },
    {
        "id": "agencies", "label": "Agencies", "icon": "i-users",
        "title": "Every client in one calendar, with their own brand.",
        "points": ["A brand per client, with its own channels and people", "Clients approve posts from a link, no account needed", "Monthly reports with your logo (Agency plan)"],
        "brand": "Northwind Studio", "kind": "Agency with 3 clients",
        "posts": [("linkedin", "Bright Path Tutoring", "Exam season tips for parents", "Mon 9:00 AM", "Approved"),
                  ("instagram", "Lumen Coffee", "New oat flat white is here", "Tue 8:00 AM", "In review"),
                  ("facebook", "Oak Dental", "Free checkups for kids in June", "Wed 10:00 AM", "Scheduled")],
    },
    {
        "id": "business", "label": "Small business", "icon": "i-spark",
        "title": "A week of posts from one message.",
        "points": ["Tell the agent what's new, it writes the week", "Each post fits each network on its own", "Every comment and message in one inbox"],
        "brand": "Taco Luna", "kind": "Restaurant",
        "posts": [("instagram", "Post", "Taco Tuesday is back: 2 for $6", "Tue 11:00 AM", "Scheduled"),
                  ("facebook", "Post", "Live music this Friday from 7", "Thu 4:00 PM", "Scheduled"),
                  ("threads", "Post", "Which salsa wins: verde or roja?", "Sat 1:00 PM", "Draft")],
    },
    {
        "id": "teams", "label": "Teams", "icon": "i-layers",
        "title": "Launches your whole team can work on.",
        "points": ["Roles, brand limits and approvals for every post", "Campaigns keep launch posts together", "See which posts brought clicks and signups"],
        "brand": "Ledgerly", "kind": "Software company",
        "posts": [("linkedin", "Launch", "Ledgerly 3.0: invoices in one click", "Mon 9:00 AM", "Approved"),
                  ("x", "Thread", "5 things we learned building 3.0", "Mon 9:30 AM", "Scheduled"),
                  ("youtube", "Video", "Ledgerly 3.0 in 90 seconds", "Tue 10:00 AM", "In review")],
    },
]
STATE = {"Scheduled": "s-ok", "Approved": "s-ok", "Draft": "s-mute", "In review": "s-wait"}

tabs = "".join(
    f'<button class="v2-tab" role="tab" id="tab-{a["id"]}" aria-controls="pane-{a["id"]}" aria-selected="{"true" if i == 0 else "false"}" tabindex="{0 if i == 0 else -1}">{ico(a["icon"])}{a["label"]}</button>'
    for i, a in enumerate(AUD))
panes = ""
for i, a in enumerate(AUD):
    rows = "".join(
        f'<li class="v2-post">{net(n)}<span class="v2-post-main"><span class="v2-post-kind">{k}</span><span class="v2-post-text">{t}</span></span><span class="v2-post-when">{w}</span><span class="v2-state {STATE[s]}">{s}</span></li>'
        for n, k, t, w, s in a["posts"])
    points = "".join(f"<li>{p}</li>" for p in a["points"])
    panes += f'''<div class="v2-pane" role="tabpanel" id="pane-{a["id"]}" aria-labelledby="tab-{a["id"]}"{"" if i == 0 else " hidden"}>
<div class="v2-pane-copy"><h3>{a["title"]}</h3><ul class="checks">{points}</ul><a class="btn" href="https://app.capybaroar.com/signup">Start free</a></div>
<div class="v2-pane-demo card"><div class="v2-demo-head"><span class="v2-avatar">{a["brand"][0]}</span><span><b>{a["brand"]}</b><small>{a["kind"]}</small></span><span class="v2-demo-week">This week</span></div><ul class="v2-posts">{rows}</ul></div>
</div>'''

who = f'''<section id="who" class="v2-who" aria-labelledby="who-title">
<div class="wrap">
<header class="head">
<p class="tag">{ico("i-users")}Built for you</p>
<h2 id="who-title">One tool. <span>However you post.</span></h2>
</header>
<div class="v2-tabs" role="tablist" aria-label="Who it's for">{tabs}</div>
{panes}
</div>
</section>'''

# ---------- Bento grid ----------
DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"]
cal_cells = ""
CAL = {(0, 0): ("linkedin", "Meet the team"), (1, 1): ("tiktok", "Behind the scenes"), (2, 0): ("instagram", "New menu"), (3, 2): ("youtube", "Q&A live"), (4, 1): ("pinterest", "Spring ideas"), (2, 2): ("bluesky", "Hiring")}
for r in range(3):
    for c in range(5):
        if (c, r) in CAL:
            n, t = CAL[(c, r)]
            cal_cells += f'<span class="v2-cal-ev">{net(n)}{t}</span>'
        else:
            cal_cells += '<span class="v2-cal-empty"></span>'
heat = "".join(f'<span class="v2-heat-c" style="opacity:{o}"></span>' for o in [
    .15, .25, .5, .9, .6, .3, .2, .15, .35, .7, 1, .55, .3, .2, .1, .3, .6, .8, .5, .25, .15, .2, .4, .65, .45, .2, .1, .15])

bento = f'''<section id="everything" class="v2-features" aria-labelledby="feat-title">
<div class="wrap">
<header class="head">
<p class="tag">{ico("i-grid")}Everything in one place</p>
<h2 id="feat-title">Plan, post, reply. <span>Then see what worked.</span></h2>
</header>
<div class="v2-bento">
<a class="v2-tile v2-t-cal card" href="/social-media-scheduler">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-calendar")}Scheduler</span><b>Write once, post to 14 networks</b><small>Each network gets the right size, length and settings.</small></span>
<span class="v2-cal"><span class="v2-cal-days">{"".join(f"<span>{d}</span>" for d in DAYS)}</span><span class="v2-cal-grid">{cal_cells}</span></span>
</a>
<a class="v2-tile v2-t-agent card" href="/ai-social-media-agent">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-bot")}Agents</span><b>Ask for a week of posts</b></span>
<span class="v2-chat"><span class="v2-bubble v2-me">Plan next week for our 3 clients</span><span class="v2-bubble v2-ai">{ico("i-spark")}Done: 15 drafts on the calendar, 5 waiting for client approval.</span></span>
</a>
<a class="v2-tile v2-t-inbox card" href="/social-media-inbox">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-inbox")}Inbox</span><b>Every comment in one list</b></span>
<span class="v2-inbox"><span class="v2-msg">{net("instagram")}<span><b>Priya</b> Do you deliver on Sundays?</span></span><span class="v2-msg">{net("facebook")}<span><b>Tom</b> Booked for Friday, thanks!</span></span><span class="v2-msg">{net("youtube")}<span><b>Ana</b> Great video, part 2?</span></span></span>
</a>
<a class="v2-tile v2-t-ana card" href="/social-media-analytics">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-chart")}Analytics</span><b>Know your best times</b></span>
<span class="v2-heat">{heat}</span>
</a>
<a class="v2-tile v2-t-ai card" href="/ai-studio">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-image")}AI Studio</span><b>Pictures and videos for every post</b><small>Nano Banana, Ideogram, Kling and more.</small></span>
<span class="v2-ai-grid"><span class="v2-ai a1"></span><span class="v2-ai a2">{ico("i-play")}</span><span class="v2-ai a3"></span></span>
</a>
<a class="v2-tile v2-t-bio card" href="/link-in-bio">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-link")}Link in bio</span><b>One page for every link</b></span>
<span class="v2-bio"><span class="v2-bio-av">M</span><span class="v2-bio-l">Book a class</span><span class="v2-bio-l">Free guide</span><span class="v2-bio-l">Shop</span></span>
</a>
<a class="v2-tile v2-t-appr card" href="/post-approval">
<span class="v2-tile-copy"><span class="v2-tile-tag">{ico("i-check-circle")}Approvals</span><b>Clients approve from a link</b></span>
<span class="v2-appr"><span class="v2-state s-wait">In review</span>{ico("i-arrow")}<span class="v2-state s-ok">Approved</span></span>
</a>
</div>
</div>
</section>'''

# ---------- Compact pricing ----------
PLANS = [("Free", "$0", "Plan and publish in one place", ["3 channels", "30 scheduled posts a month", "Inbox, analytics and link in bio"], "Get started free", False),
         ("Creator", "$29", "Your AI social media manager", ["8 channels, unlimited posts", "1,000 AI credits a month", "Agents, AI Studio and best times"], "Get started", False),
         ("Pro", "$49", "For teams and growing brands", ["30 channels and 5 seats", "2,500 AI credits a month", "Approvals and client reports"], "Start 14-day free trial", True),
         ("Agency", "$149", "Every client, your brand", ["100 channels, unlimited brands", "8,000 AI credits a month", "White-label reports and limits per brand"], "Get started", False)]
cards = "".join(
    f'<article class="v2-plan card{" v2-hot" if hot else ""}">{"<span class=v2-pop>Most popular</span>" if hot else ""}<h3>{n}</h3><p class="v2-plan-line">{line}</p><p class="v2-price">{price}<small>/ month</small></p><ul class="checks">{"".join(f"<li>{x}</li>" for x in feats)}</ul><a class="btn{"" if hot else " ghost"}" href="https://app.capybaroar.com/signup">{cta}</a></article>'
    for n, price, line, feats, cta, hot in PLANS)
pricing = f'''<section id="pricing" class="band-gray" aria-labelledby="pricing-title">
<div class="wrap">
<header class="head">
<p class="tag">{ico("i-tag")}Pricing</p>
<h2 id="pricing-title">Start free. <span>Upgrade when you&rsquo;re ready.</span></h2>
</header>
<div class="v2-plans">{cards}</div>
<p class="v2-compare"><a href="/pricing">Compare every feature {ico("i-arrow")}</a></p>
</div>
</section>'''

# ---------- Assemble ----------
def block(start_marker, end_marker="</section>"):
    i = next(n for n, l in enumerate(lines) if l.startswith(start_marker))
    j = next(n for n in range(i, len(lines)) if lines[n].startswith(end_marker))
    return i, j

t0, t1 = block('<section id="tour"')
p0, p1 = block('<section id="pricing"')
f0, f1 = block('<section id="faq"')
faq = "\n".join(lines[f0:f1 + 1])
details = re.findall(r"<details.*?</details>", faq, re.S)
keep = [d for d in details if any(k in d for k in ("agentic social media platform", "post without asking", "Which networks", "Claude, ChatGPT or Cursor", "for agencies"))]
faq = faq.replace("\n".join(details), "\n".join(keep)) if "\n".join(details) in faq else faq
if len(keep) == 5 and "\n".join(details) not in faq:
    for d in details:
        if d not in keep:
            faq = faq.replace(d + "\n", "").replace(d, "")

out = lines[:t0] + [who, bento] + lines[t1 + 1:p0] + [pricing] + lines[p1 + 1:f0] + [faq] + lines[f1 + 1:]
html = "\n".join(out)
html = html.replace("<head>", '<head>\n<meta name="robots" content="noindex">', 1)
html = html.replace('<link rel="stylesheet" href="/home.css?v=6">', '<link rel="stylesheet" href="/home.css?v=6">\n<link rel="stylesheet" href="/home-v2.css?v=1">', 1)
html = html.replace('<a class="btn ghost" href="#tour">', '<a class="btn ghost" href="#features">')
tabjs = """<script>
(function(){var tabs=[].slice.call(document.querySelectorAll('.v2-tab'));function pick(t){tabs.forEach(function(x){var on=x===t;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;document.getElementById(x.getAttribute('aria-controls')).hidden=!on;});}
tabs.forEach(function(t,i){t.addEventListener('click',function(){pick(t)});t.addEventListener('keydown',function(e){var n=e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0;if(n){var x=tabs[(i+n+tabs.length)%tabs.length];pick(x);x.focus();e.preventDefault();}});});})();
</script>"""
html = html.replace("</body>", tabjs + "\n</body>", 1)
open(P + "home-v2.html", "w").write(html)
print("built", len(html), "bytes; faq kept", len(keep))
