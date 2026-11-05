"""Content for the counting and planning tools: character counter, emoji picker, best time to post, UTM builder and
YouTube money calculator."""
import json, os, html as H
HERE = os.path.dirname(os.path.abspath(__file__))
TOOLS = []

# ---------------------------------------------------------------- Character counter
# Post limits match what Capybaroar itself enforces (src/lib/networks.ts and the providers' checks).
NETS = [
    ('x', 'X', 'Post', 280, 'x'), ('instagram', 'Instagram', 'Caption', 2200, ''), ('tiktok', 'TikTok', 'Caption', 2200, ''),
    ('linkedin', 'LinkedIn', 'Post', 3000, ''), ('facebook', 'Facebook', 'Post', 63206, ''), ('threads', 'Threads', 'Post', 500, ''),
    ('youtube', 'YouTube', 'Title', 100, ''), ('youtube', 'YouTube', 'Description', 5000, 'bytes'), ('pinterest', 'Pinterest', 'Pin title', 100, ''),
    ('pinterest', 'Pinterest', 'Pin description', 500, ''), ('bluesky', 'Bluesky', 'Post', 300, 'g'), ('mastodon', 'Mastodon', 'Post', 500, ''),
    ('discord', 'Discord', 'Message', 2000, ''), ('instagram', 'Instagram', 'Bio', 150, ''), ('x', 'X', 'Bio', 160, ''), ('tiktok', 'TikTok', 'Bio', 80, ''),
    ('linkedin', 'LinkedIn', 'Headline', 220, ''),
]
rows = ''.join(f'<li class="cc-net" data-limit="{lim}" data-how="{how}"><svg class="nl" aria-hidden="true"><use href="#n-{i}"/></svg><span class="nm">{n} <small>{what}</small></span><span class="v"><b data-n>0</b> / {lim:,} <span data-left></span></span><span class="tr"><i data-b></i></span></li>' for i, n, what, lim, how in NETS)
STATS = [('chars', 'Characters'), ('nospace', 'No spaces'), ('words', 'Words'), ('lines', 'Lines'), ('emoji', 'Emoji'), ('hashtags', 'Hashtags'), ('mentions', 'Mentions'), ('links', 'Links')]
stats = ''.join(f'<div><small>{l}</small><b data-stat="{k}">0</b></div>' for k, l in STATS)
limits_table = ''.join(f'<tr><th>{n} {what.lower()}</th><td>{lim:,}</td></tr>' for i, n, what, lim, how in NETS)
TOOLS.append(dict(
    slug='/tools/character-counter', key='counter', icon='i-text', group='write',
    name='Character counter', line='Check your post against the limit on 12 networks.',
    title='Character Counter for Social Media: X, Instagram, LinkedIn and More | Capybaroar',
    desc='Free character counter for social media. See your count against the limit on X, Instagram, TikTok, LinkedIn, YouTube and 7 more, with X\'s own counting rules.',
    tag='Free tool', h1a='Character counter', h1b='for every social network',
    lead='Paste your post and see at a glance if it fits on X, Instagram, TikTok, LinkedIn, YouTube and more. Words, emoji, hashtags and links are counted too.',
    tool=f'''<div class="t-card" data-tool="counter">
<label class="t-lab" for="cc-in">Your text</label>
<textarea id="cc-in" data-input rows="7" placeholder="Paste or write your post here"></textarea>
<div class="t-foot" style="margin-top:8px"><span class="rs-hint">Counted in your browser. Nothing is sent anywhere.</span><span class="t-bar" style="margin:0"><button class="t-btn" type="button" data-copy><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copy</button><button class="t-btn" type="button" data-clear>Clear</button></span></div>
<div class="cc-stats">{stats}</div>
<ul class="cc-nets">{rows}</ul>
</div>''',
    read=f'''<h2>Why each network counts differently</h2>
<p>A "character" sounds simple, but every network counts it in its own way. That is why a post that fits on Instagram can be too long for X, even when both say it has the same number of letters.</p>
<ul>
<li><b>X weighs characters.</b> Plain letters, numbers and punctuation count as 1. Emoji count as 2. Letters from many other scripts, like Chinese, Japanese and Korean, also count as 2. Every link counts as 23, no matter how long it is, because X shortens it. This counter follows those rules.</li>
<li><b>Bluesky counts what you see.</b> A family emoji made of several people counts as one character, because it shows as one picture.</li>
<li><b>YouTube descriptions count bytes.</b> The 5,000 limit is measured in bytes, so emoji and accented letters use more of it than plain letters.</li>
<li><b>Most other networks</b> count each character once, but emoji built from several parts can count as more than one.</li>
</ul>
<h2>How to use the counter</h2>
<ol>
<li>Paste or type your post in the box.</li>
<li>Watch the bar for each network. It turns yellow near the limit and red when you go over.</li>
<li>Read the counts at the top for words, emoji, hashtags, mentions and links.</li>
</ol>
<p>Your text is kept in this browser, so it is still there if you reload the page.</p>
<h2>Character limits for each network</h2>
<p>These are the limits for posting, the same ones Capybaroar checks before it schedules a post:</p>
<div class="scroll"><table class="cmp"><thead><tr><th>Field</th><th>Limit</th></tr></thead><tbody>{limits_table}</tbody></table></div>
<p>X Premium accounts can post longer texts, but most people still see the first 280 characters before "show more", so the 280 limit is the one to write for.</p>
<h2>How long should a post be?</h2>
<p>The limit is the most a network allows, not the best length. Some guidelines that help most posts:</p>
<ul>
<li><b>Hook in the first line.</b> Instagram, LinkedIn and Facebook cut long posts with "more" after a line or three. Say the main thing first.</li>
<li><b>X:</b> short posts with one idea are easiest to read and share.</li>
<li><b>LinkedIn:</b> longer posts can do well when they are broken into short lines with space between them.</li>
<li><b>Instagram:</b> a short caption suits a strong photo. A longer caption suits a story, a recipe or a tutorial.</li>
<li><b>YouTube titles:</b> the full 100 characters rarely shows. Put the key words in the first 50 or so.</li>
</ul>
<h2>Why emoji and styled text count extra</h2>
<p>Many emoji are made of more than one character joined together. Skin tones, flags and family emoji can count as 2 to 8 characters on some networks. Styled text, like the bold letters from our <a href="/tools/bold-text-generator">bold text generator</a>, also counts as 2 per letter on X. If a post is close to the limit, check it here after you add emoji.</p>
<div class="note">Writing for several networks at once? In Capybaroar you write one post, give each network its own version, and the composer checks every limit before anything goes out.</div>''',
    faq=[('How does X count characters?', 'Plain letters, numbers and punctuation count as 1. Emoji and most characters from Chinese, Japanese and Korean count as 2. Every link counts as 23. This counter uses those rules.'),
         ('What is the Instagram caption limit?', '2,200 characters. Instagram cuts the caption with "more" after the first lines, so put the main point first.'),
         ('What is the LinkedIn post limit?', '3,000 characters for a post. Headlines allow 220.'),
         ('How long can a YouTube title and description be?', 'Titles can be 100 characters. Descriptions can be 5,000 bytes, so emoji and accented letters use more of the limit.'),
         ('Do emoji count as one character?', 'Not always. On X every emoji counts as 2. Emoji with skin tones, flags and families are built from several parts and can count as more on some networks.'),
         ('Do spaces count as characters?', 'Yes, on every network. The counter also shows a count without spaces.'),
         ('Is my text saved?', 'Only in your own browser, so it stays if you reload. Nothing is sent to us or anyone else.'),
         ('Does the counter work for TikTok?', 'Yes. It checks TikTok captions against 2,200 characters, the limit for posting through TikTok\'s API, and TikTok bios against 80.')]))

# ---------------------------------------------------------------- Emoji picker
D = json.load(open(os.path.join(HERE, 'emoji', 'data.json')))
M = json.load(open(os.path.join(HERE, 'emoji', 'messages.json')))
GROUPS = {g['order']: g['message'] for g in M['groups']}
groups = {}
for e in D:
    if e.get('group') is None or e['group'] == 2:
        continue
    groups.setdefault(e['group'], []).append(e)
for g in groups.values():
    g.sort(key=lambda e: e['order'])
MAXV = max(e.get('version', 0) for e in D)


def skins(e):
    out = {}
    for s in e.get('skins', []):
        t = s.get('tone')
        if isinstance(t, int):
            out[t] = s['emoji']
        elif isinstance(t, list) and len(set(t)) == 1:
            out.setdefault(t[0], s['emoji'])
    return [out[i] for i in range(1, 6)] if all(i in out for i in range(1, 6)) else None


cap = lambda s: s[:1].upper() + s[1:]
EMOJI_COUNT = sum(len(g) for g in groups.values())
FIRST = {0: '😀', 1: '👋', 3: '🐻', 4: '🍔', 5: '✈️', 6: '⚽', 7: '💡', 8: '❤️', 9: '🏁'}
chips = ''.join(f'<button class="ej-chip" type="button" data-to="g{k}"><span class="ej-ci" aria-hidden="true">{FIRST[k]}</span>{cap(GROUPS[k])}</button>' for k in sorted(groups))
secs = ''
for k in sorted(groups):
    b = ''
    for e in groups[k]:
        keys = ' '.join([e['label']] + e.get('tags', [])).lower()
        sk = skins(e)
        b += f'<button type="button" class="ej" data-k="{H.escape(keys)}"' + (f' data-s="{" ".join(sk)}"' if sk else '') + f' title="{H.escape(cap(e["label"]))}" aria-label="{H.escape(cap(e["label"]))}">{e["emoji"]}</button>'
    secs += f'<section class="ej-sec" id="g{k}" aria-labelledby="g{k}-h"><h2 id="g{k}-h">{cap(GROUPS[k])}</h2><div class="ej-grid">{b}</div></section>'
TONES = [('Default', '#FFC83D'), ('Light', '#F7DECE'), ('Medium-light', '#F3D2A2'), ('Medium', '#D5AB88'), ('Medium-dark', '#AF7E57'), ('Dark', '#7C533E')]
tones = ''.join(f'<button type="button" class="ej-tone" data-t="{i}" aria-pressed="{"true" if i == 0 else "false"}" aria-label="{n} skin tone" title="{n} skin tone"><span style="background:{c}"></span></button>' for i, (n, c) in enumerate(TONES))
emoji_tool = f'''<div class="t-card ej-tool" data-tool="emoji">
<div class="ej-bar">
<div class="ej-row">
<label class="ej-search"><svg class="ico" aria-hidden="true"><use href="#i-search"/></svg><span class="sr">Search emoji</span><input id="ej-q" type="search" placeholder="Search {EMOJI_COUNT:,} emoji" autocomplete="off" spellcheck="false"></label>
<div class="ej-tones" role="group" aria-label="Skin tone">{tones}</div>
</div>
<div class="ej-tray">
<div class="ej-out" id="ej-out" aria-live="polite" data-empty="Click emoji to add them here"></div>
<button class="btn sm ghost" type="button" id="ej-back" aria-label="Remove the last emoji" disabled>⌫</button>
<button class="btn sm ghost" type="button" id="ej-clear" disabled>Clear</button>
<button class="btn sm" type="button" id="ej-copy" disabled><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copy all</button>
</div>
<div class="ej-chips" aria-label="Categories"><button class="ej-chip" type="button" data-to="recent" hidden><span class="ej-ci" aria-hidden="true"><svg class="ico"><use href="#i-clock"/></svg></span>Recent</button>{chips}</div>
</div>
<div class="ej-body">
<section class="ej-sec" id="recent" aria-labelledby="recent-h" hidden><h2 id="recent-h">Recently used</h2><div class="ej-grid" id="ej-recent"></div></section>
{secs}
<p class="ej-none" id="ej-none" hidden></p>
</div>
</div>'''
group_rows = ''.join(f'<tr><th>{cap(GROUPS[k])}</th><td>{len(groups[k]):,}</td><td>{" ".join(e["emoji"] for e in groups[k][:6])}</td></tr>' for k in sorted(groups))
TOOLS.append(dict(
    slug='/tools/emoji-copy-paste', key='emoji', icon='i-smile', group='write',
    name='Emoji copy and paste', line=f'Copy any of {EMOJI_COUNT:,} emoji in one click.',
    title='Emoji Copy and Paste: Click to Copy Any Emoji (Free) | Capybaroar',
    desc=f'Copy and paste any of {EMOJI_COUNT:,} emoji in one click. Search by name, pick a skin tone and build a whole line of emoji for Instagram, TikTok and more. Free.',
    tag='Free tool', h1a='Emoji copy and paste', h1b='every emoji, one click',
    lead=f'Click any emoji to copy it. Search {EMOJI_COUNT:,} emoji by name, pick a skin tone and build a whole line to paste into your posts.',
    tool=emoji_tool,
    read=f'''<h2>How to copy and paste emoji</h2>
<ol>
<li><b>Find your emoji.</b> Scroll the categories, tap a category chip to jump to it, or type in the search box. Search knows names and common words, so "laugh", "love" or "party" all work.</li>
<li><b>Click it.</b> The emoji is copied right away and added to the box at the top.</li>
<li><b>Paste it.</b> Press Ctrl+V on Windows or Cmd+V on a Mac. On a phone, press and hold where you want it and tap Paste.</li>
</ol>
<p>Want several? Click them one after another. They line up in the box, and <b>Copy all</b> copies the whole line. The ⌫ button removes the last one, and <b>Clear</b> empties the box.</p>
<h2>Skin tones</h2>
<p>Pick a skin tone from the six circles next to the search box. Every emoji that supports skin tones switches to that tone, like hands, faces and people at work. Your choice is remembered next time you visit. Emoji that only come in one color, like animals and objects, stay the same.</p>
<h2>Every emoji, sorted the official way</h2>
<p>This picker has all {EMOJI_COUNT:,} emoji in the current Unicode release (Emoji {MAXV:g}), in the order and groups that Unicode uses. That is the same order you see on most phone keyboards.</p>
<div class="scroll"><table class="cmp"><thead><tr><th>Category</th><th>Emoji</th><th>Examples</th></tr></thead><tbody>{group_rows}</tbody></table></div>
<p>The newest emoji only show on phones and computers with recent updates. If you see an empty box or a question mark, that device doesn't have that emoji yet. People with updated phones will still see it.</p>
<h2>Using emoji in your social posts</h2>
<ul>
<li><b>Lead with words, not emoji.</b> Put the emoji after your first few words so the opening still reads clearly in previews and notifications.</li>
<li><b>Use emoji as bullets.</b> ✅, 👉 and 📍 make tidy list markers in long captions.</li>
<li><b>Watch the count on X.</b> Each emoji counts as 2 characters there. Check long posts with our <a href="/tools/character-counter">character counter</a>.</li>
<li><b>Don't replace keywords.</b> Search reads words, not pictures. Write "pizza 🍕", not just "🍕".</li>
<li><b>Think about screen readers.</b> They read every emoji's name out loud. Five emoji in a row means five names read one after another.</li>
</ul>
<h2>Why emoji look different on other devices</h2>
<p>Every emoji has an official name and code, but Apple, Google, Samsung and Microsoft each draw their own pictures. A 😂 on an iPhone and a 😂 on an Android phone mean the same thing, but they don't look exactly alike. That's why the emoji on this page look like the ones on your own device.</p>
<p>Windows shows country flags as two letters, like "US" or "GB", instead of a flag picture. Phones and Macs show the flags.</p>
<div class="note">Got your emoji? Paste them into a Capybaroar post and schedule it to Instagram, TikTok, X, LinkedIn and 8 more networks from one calendar.</div>''',
    faq=[('How do I copy an emoji?', 'Click or tap it. It is copied right away and added to the box at the top, so you can build a line of emoji and copy it all at once.'),
         ('How do I paste an emoji?', 'Press Ctrl+V on Windows or Cmd+V on a Mac. On a phone, press and hold where you want it, then tap Paste.'),
         ('How do I change the skin tone?', 'Pick one of the six circles next to the search box. Every emoji that supports skin tones switches to that tone.'),
         ('How many emoji are there?', f'This picker has all {EMOJI_COUNT:,} emoji in Emoji {MAXV:g}, not counting skin tone versions. With skin tones, there are thousands more.'),
         ('Why do I see a box instead of an emoji?', 'Your device doesn\'t have that emoji yet. Updating your phone or computer usually fixes it. People with newer devices still see it.'),
         ('Why do I see letters instead of a flag?', 'Windows doesn\'t draw country flags as pictures, so it shows the two-letter country code. Phones and Macs show the flag.'),
         ('Do emoji count toward character limits?', 'Yes. On X each emoji counts as 2. On other networks some emoji, like flags and families, count as several characters.'),
         ('Is this emoji picker free?', 'Yes. It is free, needs no account and works on phones too. Your recent emoji are only saved in your own browser.')]))

# ---------------------------------------------------------------- Best time to post
QUICK = [('America/New_York', 'New York'), ('America/Chicago', 'Chicago'), ('America/Los_Angeles', 'Los Angeles'), ('Europe/London', 'London'), ('Europe/Berlin', 'Berlin'), ('Asia/Kolkata', 'India'), ('Asia/Singapore', 'Singapore'), ('Australia/Sydney', 'Sydney')]
quick = ''.join(f'<button class="t-btn" type="button" data-quick="{z}">{n}</button>' for z, n in QUICK)
TOOLS.append(dict(
    slug='/tools/best-time-to-post', key='besttime', icon='i-clock', group='plan',
    name='Best time to post', line='Turn your audience\'s best hours into your own time.',
    title='Best Time to Post on Instagram and TikTok: Free Planner | Capybaroar',
    desc='Find the best time to post on Instagram, TikTok and more for your audience\'s time zone. Turn their best hours into your own time and learn how to find yours.',
    tag='Free tool', h1a='Best time to post', h1b='in your audience\'s time zone',
    lead='The best time to post is when your audience is awake and scrolling. Pick where they live and the hours you want to reach them, and see what that is in your own time.',
    tool=f'''<div class="t-card" data-tool="besttime">
<div class="t-two">
<div>
<label class="t-lab" for="bt-zone">Where your audience lives</label>
<div class="bt-zone"><input id="bt-zone" class="t-in" data-zone type="text" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="bt-list" autocomplete="off" spellcheck="false"><ul class="bt-list" id="bt-list" data-zones role="listbox" hidden></ul></div>
<div class="bt-quick">{quick}</div>
<span class="t-lab" style="margin-top:18px">Hours to reach them, in their time</span>
<div class="bt-times" data-times></div>
<p class="rs-hint" style="margin-top:10px">Your time zone: <b data-mine></b></p>
</div>
<div><table class="bt-table" data-table></table></div>
</div>
</div>''',
    read='''<h2>Is there one best time to post?</h2>
<p>No single time works for every account. The best time is when <b>your</b> followers are online, and that depends on where they live, what they do all day and which network they use. A bakery in Austin, a game streamer and a law firm have very different audiences.</p>
<p>What most audiences share is a daily rhythm. People check their phones when they wake up, around lunch and in the evening. So a good place to start is those three windows, in the time zone where most of your followers live. This planner does the time zone math for you.</p>
<h2>How to use the planner</h2>
<ol>
<li>Pick where most of your audience lives. Type a city or region, or tap one of the quick picks.</li>
<li>Set the hours you want to reach them, in their time. The planner starts with 8 AM, 12 PM and 6 PM. Use − and + to move an hour, × to remove it, or add up to five.</li>
<li>Read the table. It shows each of those hours in your own time zone, and warns you when it falls on the next day or the day before.</li>
</ol>
<p>Your choices are remembered in this browser for next time.</p>
<h2>Good starting hours</h2>
<p>Until you have your own numbers, these windows in your audience's time zone are a sensible place to start:</p>
<ul>
<li><b>Early morning, around 7 to 9 AM.</b> People check their phones before work or school.</li>
<li><b>Lunch, around 11 AM to 1 PM.</b> A short break and a quick scroll.</li>
<li><b>Evening, around 6 to 9 PM.</b> The longest scrolling time for most people, and strong for video.</li>
</ul>
<p>Business audiences on LinkedIn tend to be most active on weekdays during working hours. Consumer audiences on Instagram and TikTok often stay active into the evening and on weekends. Treat these as a first guess, then test.</p>
<h2>How to find your own best time</h2>
<p>Your own data beats any guide. Every network shows when your followers are online:</p>
<ul>
<li><b>Instagram:</b> open Insights from your professional dashboard, then Total followers, and look at Most active times. You need a professional account (business or creator).</li>
<li><b>TikTok:</b> open Analytics from your profile tools, then Followers, and look at Follower activity.</li>
<li><b>YouTube:</b> in YouTube Studio, open Analytics, then Audience, and find "When your viewers are on YouTube".</li>
<li><b>Facebook:</b> Meta Business Suite shows when your Page's fans are online under Insights.</li>
<li><b>LinkedIn and X:</b> they don't show a "most active" chart. Compare how posts at different times did.</li>
</ul>
<p>Then run a simple test. Post similar content at two or three different times for two weeks and compare reach and engagement. Keep the time that wins, and test again every few months, because audiences change.</p>
<div class="note">Capybaroar does this for you. It looks at your own posts from the last 90 days and shows your best day and hour for each channel, then fills your posting queue at those times.</div>
<h2>Does posting time still matter?</h2>
<p>Feeds today are sorted by what people are likely to enjoy, not only by time. But timing still helps. A post gets its first reactions in the first hour or two, and those early signals help decide how far it travels. Posting when your followers are awake gives every post a better start.</p>
<h2>Posting across time zones</h2>
<p>If your audience lives in more than one place, pick the time zone where most of them are, or split your posts. For example, a morning post for Europe and an evening post for the US. A scheduler lets you post at 3 AM your time without setting an alarm.</p>''',
    faq=[('What is the best time to post on Instagram?', 'When your own followers are online. Check Most active times in Instagram Insights. Until you have that data, early morning, lunch and evening in your audience\'s time zone are good places to start.'),
         ('What is the best time to post on TikTok?', 'Check Follower activity in TikTok Analytics to see when your followers are on the app. Evenings are often strong for video, but your own data decides.'),
         ('Does the day of the week matter?', 'It can. Business audiences are most active on weekdays. Consumer audiences are often busy in the evening and on weekends. Test a few days and compare.'),
         ('How does this planner work?', 'You pick where your audience lives and the hours you want to reach them. The planner shows those hours in your own time zone and handles daylight saving time.'),
         ('My followers live in different countries. What should I do?', 'Pick the time zone where most of them live, or post at two times, one for each region.'),
         ('How often should I check my best time?', 'Every few months. Audiences grow and change, and so do the hours they are online.'),
         ('Can Capybaroar post at the best time for me?', 'Yes. It shows your best hours from your own results and can fill your queue at those times, so posts go out while you sleep.')]))

# ---------------------------------------------------------------- UTM builder
PRESETS = [('instagram', 'Instagram', 'instagram|social'), ('facebook', 'Facebook', 'facebook|social'), ('linkedin', 'LinkedIn', 'linkedin|social'), ('tiktok', 'TikTok', 'tiktok|social'),
           ('x', 'X', 'x|social'), ('youtube', 'YouTube', 'youtube|social'), ('pinterest', 'Pinterest', 'pinterest|social'), ('threads', 'Threads', 'threads|social')]
presets = ''.join(f'<button class="t-btn" type="button" data-preset="{p}" aria-pressed="false"><svg class="nl" aria-hidden="true" style="width:15px;height:15px"><use href="#n-{i}"/></svg>{n}</button>' for i, n, p in PRESETS) + '<button class="t-btn" type="button" data-preset="newsletter|email" aria-pressed="false"><svg class="ico" aria-hidden="true"><use href="#i-mail"/></svg>Email</button>'
fields = [('url', 'Website address', 'https://yourshop.com/sourdough', 'wide'), ('source', 'Source (utm_source)', 'instagram', ''), ('medium', 'Medium (utm_medium)', 'social', ''),
          ('campaign', 'Campaign (utm_campaign)', 'spring_launch', 'wide'), ('term', 'Term (utm_term), optional', 'sourdough', ''), ('content', 'Content (utm_content), optional', 'bio_link', '')]
f_html = ''.join(f'<div class="{c}"><label class="t-lab" for="utm-{k}">{l}</label><input id="utm-{k}" class="t-in" type="text" data-f="{k}" placeholder="{p}" autocomplete="off" spellcheck="false"></div>' for k, l, p, c in fields)
TOOLS.append(dict(
    slug='/tools/utm-builder', key='utm', icon='i-link', group='plan',
    name='UTM link builder', line='Tracking links for every social post and bio.',
    title='UTM Builder: Free Campaign URL Builder for Social Media | Capybaroar',
    desc='Build UTM tracking links for Instagram, TikTok, LinkedIn and every social post. One-click presets, clean naming and Google Analytics tips. Free.',
    tag='Free tool', h1a='UTM link builder', h1b='know which posts send visitors',
    lead='Add tracking tags to any link so Google Analytics shows exactly which network, post or campaign sent each visitor. Pick a network and copy your link.',
    tool=f'''<div class="t-card" data-tool="utm">
<span class="t-lab">Quick pick</span>
<div class="t-bar">{presets}</div>
<div class="utm-f">{f_html}</div>
<div class="t-foot"><button class="t-btn" type="button" data-lower role="switch" aria-checked="true">Lowercase everything</button><button class="btn sm" type="button" data-copy><svg class="ico" aria-hidden="true"><use href="#i-copy"/></svg>Copy link</button></div>
<div class="utm-out empty" data-out aria-live="polite">Your link shows here.</div>
<p class="t-err" data-err aria-live="polite"></p>
</div>''',
    read='''<h2>What is a UTM link?</h2>
<p>A UTM link is a normal web address with a few labels added at the end, like <code>?utm_source=instagram&amp;utm_medium=social&amp;utm_campaign=spring_launch</code>. When someone clicks it, analytics tools such as Google Analytics read those labels and record where the visit came from. The page itself doesn't change.</p>
<p>Without UTM tags, most visits from social apps show up as "direct" or as one big "social" bucket, so you can't tell which post did the work. With them, you can see that your Tuesday Reel sent 140 visitors and your LinkedIn post sent 30.</p>
<h2>The five UTM tags</h2>
<div class="scroll"><table class="cmp"><thead><tr><th>Tag</th><th>What it answers</th><th>Examples</th></tr></thead><tbody>
<tr><th>utm_source</th><td>Which site or app sent the visit?</td><td>instagram, linkedin, newsletter</td></tr>
<tr><th>utm_medium</th><td>What kind of channel?</td><td>social, paid_social, email</td></tr>
<tr><th>utm_campaign</th><td>Which campaign or promotion?</td><td>spring_launch, black_friday</td></tr>
<tr><th>utm_term</th><td>Which keyword or topic? (optional)</td><td>sourdough, gift_box</td></tr>
<tr><th>utm_content</th><td>Which post, link or button? (optional)</td><td>bio_link, reel_0412, story_swipe</td></tr>
</tbody></table></div>
<p>Source, medium and campaign are the three that matter most. The tool reminds you if one is missing.</p>
<h2>How to build a link</h2>
<ol>
<li>Paste the page you want people to visit.</li>
<li>Tap a network under <b>Quick pick</b> to fill in the source and medium, or type your own.</li>
<li>Name the campaign, and add a term or content label if you want more detail.</li>
<li>Press <b>Copy link</b> and use it in your post, bio or ad.</li>
</ol>
<h2>Naming rules that keep reports clean</h2>
<ul>
<li><b>Always lowercase.</b> Analytics treats "Instagram" and "instagram" as two different sources. The tool lowercases everything unless you turn it off.</li>
<li><b>No spaces.</b> Use underscores or dashes. The tool swaps spaces for underscores.</li>
<li><b>Use "social" for free posts and "paid_social" for ads.</b> Google Analytics 4 puts visits with the medium "social" in its Organic Social group, and visits whose medium starts with "paid" from a social site in Paid Social.</li>
<li><b>Write your names down.</b> Keep a short list of the sources and campaign names your team uses, so everyone tags links the same way.</li>
</ul>
<h2>Where to find the results</h2>
<p>In Google Analytics 4, open <b>Reports</b>, then <b>Acquisition</b>, then <b>Traffic acquisition</b>. Change the table to show <b>Session source / medium</b> or <b>Session campaign</b>. Your UTM labels appear there, usually within a day.</p>
<h2>Tips for social media</h2>
<ul>
<li><b>Link in bio:</b> use utm_content=bio_link so bio clicks don't mix with post clicks.</li>
<li><b>Stories and Reels:</b> give each one its own utm_content to see which format sends more visits.</li>
<li><b>Long links look messy.</b> Put the UTM link behind a short link or a link in bio page so your post stays tidy.</li>
<li><b>Don't tag links between your own pages.</b> UTM tags on internal links reset the source of a visit and spoil your reports.</li>
</ul>
<div class="note">Capybaroar shortens every link in your posts and counts the clicks for you, and its link in bio page shows which links people tap.</div>''',
    faq=[('What does UTM stand for?', 'Urchin Tracking Module. Urchin was the company Google bought to build Google Analytics, and the name stuck.'),
         ('Which UTM tags do I need?', 'Source, medium and campaign. Term and content are optional and add more detail.'),
         ('What medium should I use for social media?', 'Use social for regular posts and paid_social for ads. Google Analytics 4 groups those as Organic Social and Paid Social.'),
         ('Should UTM tags be lowercase?', 'Yes. Analytics counts Instagram and instagram as two different sources, so lowercase keeps your reports in one place.'),
         ('Do UTM tags hurt SEO?', 'No, not on links you share in posts, bios, emails and ads. Don\'t add them to links between pages on your own site.'),
         ('Where do I see UTM results in Google Analytics?', 'In Google Analytics 4, go to Reports, Acquisition, Traffic acquisition, and show Session source / medium or Session campaign.'),
         ('Can I shorten a UTM link?', 'Yes. A short link keeps the tags. When someone clicks it, they land on the full link with the tags intact.')]))

# ---------------------------------------------------------------- YouTube money
TOOLS.append(dict(
    slug='/tools/youtube-money-calculator', key='ytmoney', icon='i-chart', group='plan',
    name='YouTube money calculator', line='Estimate earnings from views and RPM.',
    title='YouTube Money Calculator: Estimate Earnings From Views | Capybaroar',
    desc='Estimate how much a YouTube channel can earn per day, month and year from views and RPM, for long videos and Shorts. Learn how YouTube pays creators.',
    tag='Free tool', h1a='YouTube money calculator', h1b='estimate earnings from your views',
    lead='Enter your monthly views and an RPM range to estimate what a channel earns from ads. Switch between long videos and Shorts, which pay very differently.',
    tool='''<div class="t-card" data-tool="ytmoney">
<div class="t-bar" role="group" aria-label="Video type"><button class="t-btn" type="button" data-kind="long" aria-pressed="true">Long videos</button><button class="t-btn" type="button" data-kind="shorts" aria-pressed="false">Shorts</button></div>
<div class="ym-in">
<div><label class="t-lab" for="ym-views">Views per month</label><div class="t-range"><input id="ym-views" type="range" min="0" max="100" step="0.5" data-views aria-label="Views per month"></div></div>
<div><label class="t-lab" for="ym-vo">Exact views</label><input id="ym-vo" type="text" inputmode="numeric" data-views-out spellcheck="false"></div>
<div class="ym-rpm"><span class="t-lab">RPM range (US$ per 1,000 views)</span><div style="display:flex;gap:6px;align-items:center"><input type="number" min="0" step="0.01" value="1.5" data-lo aria-label="Low RPM"><span>to</span><input type="number" min="0" step="0.01" value="6" data-hi aria-label="High RPM"></div></div>
</div>
<div class="ym-res"><div><small>Per day</small><b data-r="day">$0</b></div><div><small>Per month</small><b data-r="month">$0</b></div><div><small>Per year</small><b data-r="year">$0</b></div></div>
<p class="rs-hint" style="margin-top:10px">Estimates only. The RPM values are examples; use the RPM in your own YouTube Studio for a real number.</p>
</div>''',
    read='''<h2>How YouTube pays creators</h2>
<p>Channels in the YouTube Partner Program earn a share of the money from ads shown on their videos. YouTube's own figures: creators keep <b>55%</b> of ad revenue on long videos, and <b>45%</b> of their share of the Shorts revenue pool. Shorts pay less because the ad money is pooled across all Shorts and shared by views, and part of it pays for music licenses.</p>
<p>To join the Partner Program with ad revenue, a channel needs 1,000 subscribers plus either 4,000 public watch hours in the last 12 months or 10 million public Shorts views in the last 90 days. YouTube also has a lower first step with fewer features, so check YouTube's Partner Program page for the current rules in your country.</p>
<h2>RPM and CPM: the two numbers to know</h2>
<ul>
<li><b>CPM</b> is what advertisers pay for 1,000 ad views. It is the price of ads, before YouTube's cut.</li>
<li><b>RPM</b> is what you actually earn for every 1,000 views of your videos, after YouTube's cut and counting views that show no ads. RPM is the number that turns views into money.</li>
</ul>
<p>The math is simple: <b>earnings = views ÷ 1,000 × RPM</b>. That is what this calculator does, with a low and a high RPM so you see a range instead of one number that looks more exact than it is.</p>
<h2>How to use the calculator</h2>
<ol>
<li>Pick <b>Long videos</b> or <b>Shorts</b>. Each starts with an example RPM range.</li>
<li>Drag the slider or type your exact monthly views.</li>
<li>Change the RPM range to match your channel. Your real RPM is in YouTube Studio, under Analytics, then Revenue.</li>
<li>Read your estimated earnings per day, month and year.</li>
</ol>
<h2>Why RPM changes so much between channels</h2>
<ul>
<li><b>Topic.</b> Advertisers pay more to reach people shopping for money, software or business products than for gaming or comedy, so finance and tech channels often have higher RPMs.</li>
<li><b>Where viewers live.</b> Ads cost more in countries like the US, UK, Canada and Australia.</li>
<li><b>Video length.</b> Videos of 8 minutes or more can show ads in the middle, which can raise earnings per view.</li>
<li><b>Time of year.</b> Advertisers spend most in the last months of the year and least in January, so RPM swings with the seasons.</li>
<li><b>Shorts versus long videos.</b> Shorts usually earn far less per 1,000 views than long videos.</li>
</ul>
<h2>Other ways YouTube channels make money</h2>
<p>Ads are only one part. Many creators earn more from:</p>
<ul>
<li>Channel memberships, Super Chat, Super Thanks and Super Stickers.</li>
<li>YouTube Premium revenue, shared by watch time.</li>
<li>Brand deals and sponsored segments.</li>
<li>Selling their own products, courses or merchandise.</li>
</ul>
<p>This calculator only estimates ad revenue, so the true earnings of a channel with sponsors can be much higher.</p>
<div class="note">Growing a channel takes steady posting. Capybaroar schedules your YouTube uploads with their title, tags and thumbnail, and shows views for every video next to your other networks.</div>''',
    faq=[('How much does YouTube pay per 1,000 views?', 'It depends on your RPM, which varies a lot by topic, country and season. Your own RPM is in YouTube Studio under Analytics, then Revenue.'),
         ('What share of ad revenue do creators get?', 'According to YouTube, creators get 55% of ad revenue on long videos and 45% of their share of the Shorts revenue pool.'),
         ('What is the difference between RPM and CPM?', 'CPM is what advertisers pay for 1,000 ad views. RPM is what you earn for 1,000 video views after YouTube\'s share. RPM is the one to use for earnings.'),
         ('How many views do I need to make money on YouTube?', 'You first need to join the YouTube Partner Program: 1,000 subscribers plus 4,000 watch hours in 12 months or 10 million Shorts views in 90 days. After that, earnings depend on views and RPM.'),
         ('Do YouTube Shorts make money?', 'Yes, through the Shorts revenue pool, but usually far less per 1,000 views than long videos.'),
         ('How accurate is this calculator?', 'It is an estimate. It multiplies your views by an RPM range. For a real number, put your own RPM from YouTube Studio into the calculator.'),
         ('Can I see how much another channel makes?', 'Not exactly. Only the channel owner sees earnings. You can estimate with their public views and a typical RPM for their topic, but the real number can be very different.')]))
