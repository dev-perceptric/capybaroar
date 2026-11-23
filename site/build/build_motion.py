"""Adds the motion layer to the marketing site, after the other build scripts have run.

- Every landing page loads /motion.css and /motion.js (scroll reveal, hover effects, chat playback).
- Every landing page's closing card becomes the animated calendar card, keeping the page's own headline and buttons.
- The 11 network pages get three chat cards in their "Schedule ... from Claude, ChatGPT or Cursor" section.
- The homepage, /mcp and /ai-social-media-agent get the six-card AI section (build/ai-section.html) after the hero.
  On the homepage it replaces the "One tool. However you post." and "Plan, post, reply." sections.

Safe to run more than once: a page that already has the motion layer only gets its version number updated.
build_home_v2.py runs this at the end. To run it on its own: python3 site/build/build_motion.py
"""
import os, re, datetime
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.join(HERE, '..', 'public') + os.sep
VER = '3'  # bump when motion.css or motion.js change, so browsers fetch the new files
MARK = '<link rel="stylesheet" href="/motion.css?v=' + VER + '">'
LANDING = """ai-social-media-agent ai-studio bluesky-scheduler brands-and-teams bulk-scheduling chatgpt claude-code
claude-cowork claude client-reports codex cursor discord-message-scheduler facebook-post-scheduler gemini-cli
github-copilot grok instagram-post-scheduler link-in-bio linkedin-post-scheduler manus mastodon-scheduler mcp
media-library n8n perplexity pinterest-pin-scheduler post-approval posting-queue pricing social-media-analytics
social-media-automation social-media-calendar social-media-inbox social-media-scheduler threads-scheduler
tiktok-scheduler windsurf x-post-scheduler youtube-video-scheduler""".split()

PLATFORMS = {
 'instagram-post-scheduler': ('Instagram', 'instagram', 'img'),
 'facebook-post-scheduler': ('Facebook', 'facebook', 'img'),
 'pinterest-pin-scheduler': ('Pinterest', 'pinterest', 'img'),
 'tiktok-scheduler': ('TikTok', 'tiktok', 'video'),
 'youtube-video-scheduler': ('YouTube', 'youtube', 'video'),
 'linkedin-post-scheduler': ('LinkedIn', 'linkedin', 'text'),
 'x-post-scheduler': ('X', 'x', 'text'),
 'threads-scheduler': ('Threads', 'threads', 'text'),
 'bluesky-scheduler': ('Bluesky', 'bluesky', 'text'),
 'mastodon-scheduler': ('Mastodon', 'mastodon', 'text'),
 'discord-message-scheduler': ('Discord', 'discord', 'text'),
}
MIXED = ['instagram', 'linkedin', 'tiktok', 'x', 'facebook', 'threads', 'youtube', 'pinterest', 'bluesky']

# ---------- pieces ----------
def closing(h2, p, cta, nets):
    posted = {1,2,3,5,7,8,9,10,12,14,15,16,17,19,21,22,23,26,28,29,30,31}
    start = datetime.date(2026, 11, 30); cells = []; k = 0
    for i in range(35):
        d = start + datetime.timedelta(days=i); mute = d.month != 12
        inner = f'<small>{d.day}</small>'
        if not mute and d.day in posted:
            inner += f'<span class="cx-p"><svg><use href="#n-{nets[k % len(nets)]}"/></svg></span><span class="cx-ring"></span>'; k += 1
        cells.append(f'<div class="cx-c{" mute" if mute else ""}">{inner}</div>')
    fl = ['instagram', 'tiktok', 'linkedin', 'youtube'] if len(nets) > 1 else nets * 4  # floating logos
    cta = re.sub(r'(<a class="btn" [^>]*>[^<]*)(</a>)', r'\1<svg class="ico" aria-hidden="true"><use href="#i-arrow"/></svg>\2', cta, count=1)
    return ('<section class="closing" aria-labelledby="closing-title">\n<div class="wrap">\n<div class="closing-card cx">\n'
     '<div class="cx-fx" aria-hidden="true"><span class="cx-blob b1"></span><span class="cx-blob b2"></span>'
     + ''.join(f'<span class="cx-fl f{i+1}"><svg><use href="#n-{n}"/></svg></span>' for i, n in enumerate(fl)) + '</div>\n'
     f'<div class="cx-text"><div><h2 id="closing-title">{h2}</h2><p>{p}</p></div><div class="cta">{cta}</div></div>\n'
     f'<div class="cx-cal" aria-hidden="true"><div class="cx-cal-h"><b>December 2026</b><span class="cx-agent"><svg class="ico"><use href="#i-spark"/></svg><span class="cx-cnt">{k}</span>&nbsp;posts planned</span></div>'
     '<div class="cx-days">' + ''.join(f'<span>{d}</span>' for d in ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']) + '</div>'
     '<div class="cx-grid">' + ''.join(cells) + '</div></div>\n</div>\n</div>\n</section>')

def swap_closing(body, nets):
    i = body.find('<section class="closing"')
    if i < 0: return body
    j = body.index('</section>', i) + len('</section>')
    old = body[i:j]
    h2 = re.search(r'<h2[^>]*>(.*?)</h2>', old, re.S).group(1)
    pm = re.search(r'<p>(.*?)</p>', old, re.S); p = pm.group(1) if pm else ''
    cta = re.search(r'<div class="cta">(.*?)</div>', old, re.S).group(1)
    return body[:i] + closing(h2, p, cta, nets) + body[j:]

USED = '<p class="ai-used" data-s><span class="ai-dot"></span><span class="ai-w">Working in Capybaroar</span><span class="ai-k">Used Capybaroar</span><svg class="ai-ok" aria-hidden="true"><use href="#i-check"/></svg></p>'
def win(app, inner):
    logo, name = ('a-chatgpt', 'ChatGPT') if app == 'gpt' else ('a-claude', 'Claude')
    return (f'<div class="ai-stage dots"><div class="ai-win ai-{"gpt" if app=="gpt" else "cl"}"><div class="ai-bar"><svg class="ai-logo" aria-hidden="true"><use href="#{logo}"/></svg>{name}</div>'
            f'<div class="ai-chat">{inner}</div></div></div>')
def card(tag_href, tag_ico, tag, h3, p, app, inner):
    return (f'<article class="ai-card"><div class="ai-copy"><a class="ai-tag" href="{tag_href}"><svg class="ico" aria-hidden="true"><use href="#{tag_ico}"/></svg>{tag}</a>'
            f'<h3>{h3}</h3><p>{p}</p></div>{win(app, inner)}</article>')

def platform_cards(name, nid, kind):
    titles = ['Launch day is here', 'How we feed the starter', 'Meet our bakers', 'Behind the oven', 'Weekend bake list']
    week = ''.join(f'<li data-s><small>{d}</small><svg class="v2-net" aria-hidden="true"><use href="#n-{nid}"/></svg><span>{t}</span><em class="v2-state s-mute">Draft</em></li>'
                   for d, t in zip(['Mon','Tue','Wed','Thu','Fri'], titles))
    c1 = card('/ai-social-media-agent', 'i-spark', 'Agents', f'Plan a week of {name} posts', f'Ask once. The {name} posts go on your calendar as drafts for you to check.', 'gpt',
        f'<p class="ai-me" data-s>Write next week\'s {name} posts about our sourdough launch and save them as drafts.</p>{USED}'
        f'<p class="ai-say" data-s>Done. 5 {name} drafts are on your calendar for next week. Nothing is published yet.</p><ul class="ai-week">{week}</ul>')
    c2 = card('/social-media-analytics', 'i-chart', 'Analytics', f'See how {name} is doing', f'Ask how your {name} posts did and get reach, top posts and your best time to post.', 'cl',
        f'<p class="ai-me" data-s>How did my {name} posts do last month?</p>{USED}'
        f'<p class="ai-say" data-s>Reach is up 18% from the month before. Your best time on {name} is Tuesday at 7 PM.</p>'
        '<div class="ai-stats" data-s><div class="ai-big"><b data-count="18">+18%</b><small>Reach vs. last month</small></div>'
        '<div class="ai-bars" aria-hidden="true"><i style="height:38%"></i><i style="height:52%"></i><i style="height:45%"></i><i style="height:60%"></i><i style="height:56%"></i><i style="height:72%"></i><i class="hi" style="height:96%"></i><i style="height:64%"></i></div></div>')
    if kind in ('img', 'video'):
        vid = kind == 'video'
        what = 'a short video' if vid else 'a photo'
        c3 = card('/ai-studio', 'i-video' if vid else 'i-image', 'AI Studio', f'Make {"videos" if vid else "pictures"} for {name}', f'Ask for {what} and it is made in AI Studio and added to the post.', 'gpt',
            f'<p class="ai-me" data-s>Make {what} of our sourdough loaf and add it to Thursday\'s {name} post.</p>{USED}'
            f'<div class="ai-media{" ai-vid" if vid else ""}" data-s><img src="/img/food/loaf.webp" alt="AI {"video still" if vid else "picture"} of a sourdough loaf" width="96" height="96">'
            f'<div><b>{"Video" if vid else "Picture"} added to Thursday\'s post</b><span><svg class="v2-net" aria-hidden="true"><use href="#n-{nid}"/></svg>{name} · Thu, 8:00 AM</span><small>Made in AI Studio</small></div></div>')
    else:
        c3 = card('/posting-queue', 'i-clock', 'Posting queue', f'Fix and move {name} posts', 'Edit or reschedule with one sentence. The queue finds the next open time.', 'gpt',
            f'<p class="ai-me" data-s>Move Friday\'s {name} post to the next free slot and fix the typo in it.</p>{USED}'
            '<div class="ai-move"><div class="ai-post old" data-s><small>Fri, 12:00 PM</small><span>Fresh loaves every mornign from 7.</span></div>'
            '<svg class="ico ai-arr" data-s aria-hidden="true"><use href="#i-arrow"/></svg>'
            '<div class="ai-post new" data-s><small>Sat, 10:30 AM · Queue</small><span>Fresh loaves every morning from 7.</span></div></div>')
    return f'<div class="ai-grid three">{c1}{c2}{c3}</div>'

AI_SECTION = open(os.path.join(HERE, 'ai-section.html'), encoding='utf-8').read()

def add_assets(doc):
    doc = doc.replace('</head>', MARK + '\n</head>', 1)
    return doc.replace('</body>', '<script src="/motion.js?v=' + VER + '" defer></script>\n</body>', 1)

def after_hero(doc):
    h = doc.index('<section class="hero')
    n = doc.index('<section', h + 10)
    return doc[:n] + AI_SECTION + '\n' + doc[n:]

def bump(doc):
    return re.sub(r'/motion\.(css|js)\?v=\d+', lambda m: '/motion.' + m.group(1) + '?v=' + VER, doc)

def page(slug, doc):
    if '/motion.css' in doc:
        return bump(doc)
    nets = MIXED
    if slug in PLATFORMS:
        name, nid, kind = PLATFORMS[slug]
        i = doc.find('<section id="ai"')
        if i >= 0 and '<div class="ask-ex"' in doc[i:]:
            a = doc.index('<div class="ask-ex"', i); b = doc.index('<div class="nets-foot">', a)
            doc = doc[:a] + platform_cards(name, nid, kind) + '\n' + doc[b:]
        nets = [nid, 'linkedin-page'] if nid == 'linkedin' else [nid]
    if slug in ('mcp', 'ai-social-media-agent'):
        doc = after_hero(doc)
    return add_assets(swap_closing(doc, nets))

def home(doc):
    if '/motion.css' in doc:
        return bump(doc)
    a, b = '<!-- Zigzag tour -->', '<!-- Networks -->'
    if a in doc and b in doc:
        doc = doc[:doc.index(a)] + AI_SECTION + '\n' + doc[doc.index(b):]
    else:
        doc = after_hero(doc)
    return add_assets(swap_closing(doc, MIXED))

def run():
    done = 0
    for slug in LANDING:
        f = P + slug + '.html'
        if not os.path.exists(f):
            continue
        s = open(f, encoding='utf-8').read(); t = page(slug, s)
        if t != s:
            open(f, 'w', encoding='utf-8').write(t); done += 1
    f = P + 'index.html'
    s = open(f, encoding='utf-8').read(); t = home(s)
    if t != s:
        open(f, 'w', encoding='utf-8').write(t); done += 1
    print('motion layer added to', done, 'pages')

if __name__ == '__main__':
    run()
