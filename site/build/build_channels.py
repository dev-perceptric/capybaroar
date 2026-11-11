"""One landing page per network (11 pages; LinkedIn profiles and Pages share one). Runs build_pages.py first so the
shared parts and helpers are current, then writes the channel pages, links them from the site and updates the sitemap.
Every fact here comes from the app: src/lib/networks.ts and the post checks in src/lib/providers/*."""
import os, re
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'build_pages.py')).read())

C = {}


def ch(id_, **kw):
    kw['id'] = id_
    C[id_] = kw


ch('facebook', slug='/facebook-post-scheduler', name='Facebook', h1='Facebook Post Scheduler', dim='to schedule Facebook posts and Reels',
   title='Facebook Post Scheduler: Schedule Facebook Posts and Reels | Capybaroar',
   desc='Schedule Facebook Page posts and Reels from one calendar. First comments, pictures or video, and Facebook comments and messages in one inbox. Free plan.',
   lead='Plan Facebook Page posts and Reels on one calendar. Capybaroar publishes them on time and brings comments and messages back to your inbox.',
   account='your Facebook Pages', connect='Sign in with Facebook and pick the Pages you manage.',
   specs=[('Characters', '63,206'), ('Formats', 'Post or Reel'), ('Media', 'Pictures, or one video'), ('Reels', 'One video'), ('First comment', 'Yes'), ('Accounts', 'Facebook Pages')],
   fields=[('Format', ['Post', 'Reel'], 1), ('First comment', 'Order here: crumbandco.com', None)],
   preview='vertical', img='croissant', text='Croissant day is back this Saturday. Doors open at 7, and the first 50 people get a free coffee.',
   inbox={'Comments and replies': True, 'Messages': True, 'Like': True, 'Hide': True}, stats=True,
   faq=[('Can I schedule Facebook Reels?', 'Yes. Pick Reel in the composer and add one video. Capybaroar uploads it and publishes the Reel at the time you pick.'),
        ('Can I schedule Facebook Stories?', 'Not yet. You can schedule Facebook posts and Reels today. Instagram Stories are supported.'),
        ('Can I post to a personal Facebook profile?', 'No. Facebook only lets apps post to Pages, so Capybaroar connects to the Pages you manage.'),
        ('Can I add a first comment?', 'Yes. Write it in the composer and Capybaroar posts it as a comment right after the post goes live. It is a good place for links.'),
        ('Can I answer Facebook comments and messages?', 'Yes. Comments and Messenger messages land in the Capybaroar inbox. You can reply, like and hide comments from there.'),
        ('Is the Facebook scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('instagram', slug='/instagram-post-scheduler', name='Instagram', h1='Instagram Post Scheduler', dim='to schedule posts, Reels and Stories',
   title='Instagram Post Scheduler: Schedule Instagram Posts, Reels and Stories | Capybaroar',
   desc='Schedule Instagram posts, carousels, Reels and Stories that publish on their own. Reel covers, first comments and Instagram comments in one inbox. Free plan.',
   lead='Schedule feed posts, carousels, Reels and Stories. Capybaroar publishes them for you through Instagram\'s API, so there are no phone reminders to tap.',
   account='your Instagram professional account', connect='Sign in with Facebook and pick the Instagram professional account linked to your Page.',
   specs=[('Characters', '2,200'), ('Formats', 'Post, carousel, Reel or Story'), ('Carousels', 'Up to 10 pictures or videos'), ('Reels', 'One video, with a cover'), ('Stories', 'One picture or video'), ('Accounts', 'Professional accounts')],
   fields=[('Format', ['Post', 'Reel', 'Story'], 1), ('Reel cover', 'Frame at 0:02', None), ('First comment', '#sourdough #austin', None)],
   preview='vertical', img='shape', text='How we shape a loaf, start to finish. Pre-orders open now, link in bio.',
   inbox={'Comments and replies': True, 'Messages': True, 'Like': False, 'Hide': True}, stats=True,
   faq=[('Can I schedule Instagram Reels?', 'Yes. Pick Reel, add one video and choose a cover. Capybaroar publishes the Reel at the time you pick.'),
        ('Can I schedule Instagram Stories?', 'Yes. Pick Story and add one picture or video. It goes live on its own, with no reminder to tap.'),
        ('Can I schedule carousels?', 'Yes. Add up to 10 pictures or videos to one post and they publish as a carousel.'),
        ('Do I need a business account?', 'You need an Instagram professional account (Business or Creator) linked to a Facebook Page. Switching is free in the Instagram app.'),
        ('Can I add a first comment?', 'Yes. Capybaroar posts it right after the post goes live, which keeps hashtags out of your caption.'),
        ('Is the Instagram scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('linkedin', slug='/linkedin-post-scheduler', name='LinkedIn', h1='LinkedIn Post Scheduler', dim='for profiles and company Pages',
   title='LinkedIn Post Scheduler for Profiles and Company Pages | Capybaroar',
   desc='Schedule LinkedIn posts and PDF carousels to your profile and company Pages. Up to 20 pictures, video, first comments, Page comments in one inbox and results for every post. Free plan.',
   lead='Schedule posts and PDF carousels to your own profile and to the company Pages you manage. Add a first comment and see how every post does.',
   account='your LinkedIn profile or Pages', connect='Sign in with LinkedIn, then add your profile, your Pages or both.',
   specs=[('Characters', '3,000'), ('Media', 'Up to 20 pictures, one video or one PDF'), ('First comment', 'Yes'), ('Accounts', 'Profiles and company Pages'), ('Page comments', 'In the inbox'), ('Results', 'For every post')],
   fields=[('Post as', ['Jon Park', 'Crumb & Co.'], 1), ('First comment', 'We are hiring: crumbandco.com/jobs', None)],
   preview='feed', img='loaf', text='We start our dough at 4 AM so you can have warm bread at 8. This Friday we launch our first sourdough. Pre-orders are open now.',
   inbox={'Comments and replies': True, 'Messages': False, 'Like': True, 'Hide': False}, inbox_note='Comments come from company Pages. Personal profiles are for posting.', stats=True,
   faq=[('Can I schedule posts to a LinkedIn company Page?', 'Yes. Connect any Page you are an admin of and schedule to it like any other channel.'),
        ('Can I schedule to my personal profile too?', 'Yes. Connect your profile and your Pages, and pick one or both for each post.'),
        ('Can I add a first comment?', 'Yes. Write it in the composer and it is posted right after your post goes live.'),
        ('Can I answer LinkedIn comments?', 'Yes, for company Pages. Comments on your Page posts land in the inbox, where you can reply and like.'),
        ('What can I attach?', 'Up to 20 pictures, one video, or one PDF. LinkedIn does not mix a video or a PDF with other files in one post.'),
        ('Can I schedule a LinkedIn carousel?', 'Yes. Add a PDF and it goes out as a document post that people swipe through. PDFs are up to 100 MB and 300 pages.'),
        ('Can I choose who sees my post?', 'Yes, on your profile: anyone, connections only or LinkedIn members. You can also turn resharing off.'),
        ('Is the LinkedIn scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('tiktok', slug='/tiktok-scheduler', name='TikTok', h1='TikTok Scheduler', dim='to schedule TikTok videos',
   title='TikTok Scheduler: Schedule TikTok Videos That Post on Their Own | Capybaroar',
   desc='Schedule TikTok videos and photo posts that publish directly to your account. Set who can watch and turn comments on or off, then see views and likes. Free plan.',
   lead='Upload a video or up to 35 pictures, write the caption and pick a time. Capybaroar posts it straight to TikTok and shows you how it did.',
   account='your TikTok account', connect='Sign in with TikTok and allow Capybaroar to post for you.',
   specs=[('Caption', '2,200 characters'), ('Media', 'One video, or 1 to 35 pictures'), ('Who can watch', 'Everyone, friends, followers or only me'), ('Comments', 'On or off'), ('Posting', 'Straight to your profile'), ('Results', 'For every video')],
   fields=[('Who can watch', ['Everyone', 'Followers', 'Only me'], 0), ('Comments', ['On', 'Off'], 0)],
   preview='vertical', img='shape', text='How we shape a loaf in 30 seconds. Would you try this at home?',
   inbox=None, stats=True,
   faq=[('Does Capybaroar post straight to TikTok?', 'Yes. Your video is published to your profile at the time you pick. You do not need to finish it in the TikTok app.'),
        ('Can I schedule TikTok photo posts?', 'Yes. Add 1 to 35 JPG or WebP pictures instead of a video, and add a title if you like. TikTok shows them as a swipeable photo post.'),
        ('Can I choose who can watch?', 'Yes. Pick everyone, friends, followers or only me. TikTok decides which of these your account can use.'),
        ('Can I turn comments off?', 'Yes. Set comments to on or off for each video.'),
        ('Can I schedule TikTok photo posts?', 'Not yet. Each TikTok post is one video.'),
        ('Can I answer TikTok comments in Capybaroar?', 'Not yet. TikTok is for posting and results for now.'),
        ('Is the TikTok scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('youtube', slug='/youtube-video-scheduler', name='YouTube', h1='YouTube Video Scheduler', dim='to schedule YouTube uploads',
   title='YouTube Video Scheduler: Schedule YouTube Uploads | Capybaroar',
   desc='Schedule YouTube videos with their title, description, tags, visibility and thumbnail. Answer comments in one inbox and see views for every video. Free plan.',
   lead='Upload once, fill in the details and pick a time. Capybaroar publishes the video with its title, tags, visibility and thumbnail.',
   account='your YouTube channel', connect='Sign in with Google and pick your YouTube channel.',
   specs=[('Title', 'Up to 100 characters'), ('Description', 'Up to 5,000 characters'), ('Video', 'One per post'), ('Visibility', 'Public, unlisted or private'), ('Thumbnail', 'Your own picture'), ('Made for kids', 'Yes or no')],
   fields=[('Title', 'How we shape a sourdough loaf', None), ('Visibility', ['Public', 'Unlisted', 'Private'], 0), ('Tags', 'sourdough, baking, bread', None)],
   preview='video', img='shape', text='How we shape a sourdough loaf, start to finish',
   inbox={'Comments and replies': True, 'Messages': False, 'Like': False, 'Hide': True}, stats=True,
   faq=[('What can I set for each video?', 'Title, description, tags, visibility, made for kids and a thumbnail, all in the composer.'),
        ('Can I schedule YouTube Shorts?', 'You can upload vertical videos like any other. YouTube decides which videos it shows as Shorts, usually vertical videos up to 3 minutes.'),
        ('Can I upload as unlisted or private?', 'Yes. Pick public, unlisted or private for each video.'),
        ('Can I answer YouTube comments?', 'Yes. Comments land in the inbox, where you can reply and hide them. A hidden YouTube comment cannot be shown again.'),
        ('How long can descriptions be?', 'Up to 5,000 characters. Titles are up to 100.'),
        ('Is the YouTube scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('x', slug='/x-post-scheduler', name='X', h1='X (Twitter) Post Scheduler', dim='to schedule posts on X',
   title='X (Twitter) Post Scheduler: Schedule Tweets and Posts on X | Capybaroar',
   desc='Schedule posts on X (Twitter) with pictures, a video or a GIF. Answer replies and mentions in one inbox and see how every post does. Free plan.',
   lead='Write your post, add pictures or a video and pick a time. Replies and mentions come back to one inbox.',
   account='your X account', connect='Sign in with X and allow Capybaroar to post for you.',
   specs=[('Characters', '280'), ('Pictures', 'Up to 4, each under 5 MB'), ('Video or GIF', 'One per post'), ('Video size', 'Up to 512 MB'), ('Threads and polls', 'Yes'), ('Replies and mentions', 'In the inbox'), ('Results', 'For every post')],
   fields=[('Media', ['4 pictures', '1 video', '1 GIF'], 0)],
   preview='text', img='loaf', text='Sourdough drops Friday, 8 AM. Pre-order now so we save you a loaf.',
   inbox={'Comments and replies': True, 'Messages': False, 'Like': True, 'Hide': True}, stats=True,
   faq=[('Can I schedule tweets?', 'Yes. Posts on X are what used to be called tweets. Write one, pick a time and Capybaroar posts it.'),
        ('Can I schedule a thread or a poll?', 'Yes. Press Add to thread for a thread of up to 25 posts, or write 2 to 4 options in Poll. You can also pick who can reply and mark a post as made with AI or as a paid partnership.'),
        ('What can I attach?', 'Up to 4 pictures, or one video or GIF. Pictures must be under 5 MB and videos up to 512 MB.'),
        ('Can I post longer than 280 characters?', 'Not yet. Capybaroar keeps X posts to 280 characters.'),
        ('Can I schedule a thread of posts?', 'Not yet. Each scheduled X post is a single post.'),
        ('Can I answer replies and mentions?', 'Yes. They land in the inbox, where you can reply, like and hide them.'),
        ('Is the X scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('threads', slug='/threads-scheduler', name='Threads', h1='Threads Scheduler', dim='to schedule Threads posts',
   title='Threads Scheduler: Schedule Posts on Threads | Capybaroar',
   desc='Schedule Threads posts with text, pictures or videos, up to 20 in one carousel. Answer replies in one inbox and see how every post does. Free plan.',
   lead='Schedule text posts and carousels to Threads. Replies come back to your inbox, and every post gets its numbers.',
   account='your Threads account', connect='Sign in with Threads and allow Capybaroar to post for you.',
   specs=[('Characters', '500'), ('Text posts', 'Yes'), ('Carousels', 'Up to 20 pictures or videos'), ('Replies', 'In the inbox'), ('Hide replies', 'Yes'), ('Results', 'For every post')],
   fields=[('Media', ['Text only', 'Carousel'], 0)],
   preview='text', img=None, text='Real talk: we tested this sourdough 41 times. Friday at 8 it is finally yours. Who is coming?',
   inbox={'Comments and replies': True, 'Messages': False, 'Like': False, 'Hide': True}, stats=True,
   faq=[('Can I schedule text-only Threads posts?', 'Yes. Text posts are up to 500 characters.'),
        ('Can I schedule carousels on Threads?', 'Yes. Add up to 20 pictures or videos to one post.'),
        ('Do I need an Instagram account?', 'You sign in with your Threads account. Capybaroar connects to it directly.'),
        ('Can I answer Threads replies?', 'Yes. Replies land in the inbox, where you can answer and hide them.'),
        ('Can I post the same thing to Instagram and Threads?', 'Yes. Pick both channels in the composer and give each one its own text if you like.'),
        ('Is the Threads scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('pinterest', slug='/pinterest-pin-scheduler', name='Pinterest', h1='Pinterest Pin Scheduler', dim='to schedule Pins to any board',
   title='Pinterest Pin Scheduler: Schedule Pins to Any Board | Capybaroar',
   desc='Schedule Pinterest Pins with a picture or video, a title, a link and the board you pick. See saves and clicks for every Pin. Free plan.',
   lead='Pick the board, add a title and a link, and set a time. Capybaroar publishes the Pin and tracks how it does.',
   account='your Pinterest account', connect='Sign in with Pinterest and allow Capybaroar to create Pins.',
   specs=[('Description', 'Up to 500 characters'), ('Title', 'Up to 100 characters'), ('Media', 'One picture or one video'), ('Board', 'Any board you own'), ('Link', 'Where the Pin sends people'), ('Results', 'For every Pin')],
   fields=[('Board', 'Bread recipes', None), ('Title', 'Easy sourdough for beginners', None), ('Link', 'crumbandco.com/recipe', None)],
   preview='pin', img='loaf', text='Our easiest sourdough recipe, made for first-time bakers.',
   inbox=None, stats=True,
   faq=[('Can I pick the board?', 'Yes. Type the board name in the composer and the Pin goes to that board.'),
        ('Can I add a link to my Pin?', 'Yes. Add the page you want people to visit when they tap the Pin.'),
        ('Can I schedule video Pins?', 'Yes. Each Pin takes one picture or one video.'),
        ('How long can titles and descriptions be?', 'Titles are up to 100 characters and descriptions up to 500.'),
        ('Can I see how my Pins do?', 'Yes. Analytics shows the numbers for each Pin next to your other channels.'),
        ('Is the Pinterest scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('bluesky', slug='/bluesky-scheduler', name='Bluesky', h1='Bluesky Scheduler', dim='to schedule Bluesky posts',
   title='Bluesky Scheduler: Schedule Posts on Bluesky | Capybaroar',
   desc='Schedule Bluesky posts with up to 4 pictures. Connect with an app password, answer replies in one inbox and see how every post does. Free plan.',
   lead='Write your post, add up to 4 pictures and pick a time. Replies and mentions come back to one inbox.',
   account='your Bluesky account', connect='Make an app password in Bluesky (Settings, App passwords) and enter it with your handle.',
   specs=[('Characters', '300'), ('Pictures', 'Up to 4'), ('Video', 'Not yet'), ('Connect', 'Handle and app password'), ('Replies and mentions', 'In the inbox'), ('Results', 'For every post')],
   fields=[('Media', ['Text only', 'Up to 4 pictures'], 1)],
   preview='text', img='croissant', text='Croissant day is back this Saturday. Doors at 7. Bring a friend.',
   inbox={'Comments and replies': True, 'Messages': False, 'Like': True, 'Hide': False}, stats=True,
   faq=[('How do I connect Bluesky?', 'In Bluesky, open Settings, then App passwords, and make one. Enter it in Capybaroar with your handle. Your main password stays private.'),
        ('Can I add pictures?', 'Yes. Add up to 4 pictures to a post.'),
        ('Can I schedule Bluesky videos?', 'Not yet. Bluesky posts take text and pictures for now.'),
        ('Can I answer replies?', 'Yes. Replies and mentions land in the inbox, where you can answer and like them.'),
        ('How long can a post be?', 'Up to 300 characters.'),
        ('Is the Bluesky scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('mastodon', slug='/mastodon-scheduler', name='Mastodon', h1='Mastodon Scheduler', dim='to schedule posts on any server',
   title='Mastodon Scheduler: Schedule Posts on Any Mastodon Server | Capybaroar',
   desc='Schedule Mastodon posts on any server, with up to 4 pictures or videos, visibility and content warnings. Mentions and direct messages in one inbox. Free plan.',
   lead='Connect your account on any Mastodon server. Set visibility and content warnings, and answer mentions from one inbox.',
   account='your Mastodon account', connect='Type your server name, like mastodon.social, and sign in there.',
   specs=[('Characters', '500'), ('Media', 'Up to 4 pictures or videos'), ('Visibility', 'Public, quiet public or followers'), ('Content warning', 'Yes'), ('Servers', 'Any Mastodon server'), ('Mentions and messages', 'In the inbox')],
   fields=[('Visibility', ['Public', 'Quiet public', 'Followers'], 0), ('Content warning', 'Food photos', None)],
   preview='text', img='rack', text='New flour from a farm 40 miles away. The crumb on this one is something else.',
   inbox={'Comments and replies': True, 'Messages': True, 'Like': True, 'Hide': False}, stats=True,
   faq=[('Which Mastodon servers work?', 'Any of them. Type your server name, like mastodon.social, and sign in there.'),
        ('Can I set visibility?', 'Yes. Pick public, quiet public or followers for each post.'),
        ('Can I add a content warning?', 'Yes. Write it in the composer and your post is hidden behind it.'),
        ('Can I answer mentions and direct messages?', 'Yes. Both land in the inbox, where you can reply and favorite.'),
        ('How long can a post be?', 'Up to 500 characters, with up to 4 pictures or videos.'),
        ('Is the Mastodon scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ch('discord', slug='/discord-message-scheduler', name='Discord', h1='Discord Message Scheduler', dim='to schedule messages to any channel',
   title='Discord Message Scheduler: Schedule Announcements to Any Channel | Capybaroar',
   desc='Schedule Discord messages and announcements with up to 10 files. Connect any channel with a webhook, no bot needed. Free plan.',
   lead='Schedule announcements to any Discord channel with a webhook. No bot to install, and no one has to be online.',
   account='a Discord channel', connect='In Discord, open Server settings, then Integrations, then Webhooks. Make one for your channel and paste its link.',
   specs=[('Characters', '2,000'), ('Files', 'Up to 10'), ('Connect', 'A channel webhook'), ('Bot needed', 'No'), ('Channels', 'Any channel you can add a webhook to'), ('Delete', 'Take a message down from Capybaroar')],
   fields=[('Channel', '#announcements', None)],
   preview='discord', img='croissant', text='Croissant day is back this Saturday. Doors open at 7, and the first 50 people get a free coffee.',
   inbox=None, stats=False,
   faq=[('Do I need a Discord bot?', 'No. Capybaroar posts through a channel webhook, which any server admin can make in a minute.'),
        ('How do I make a webhook?', 'In Discord, open Server settings, then Integrations, then Webhooks. Press New Webhook, pick the channel and copy the webhook link.'),
        ('Can I post to several channels?', 'Yes. Add a webhook for each channel and pick them in the composer.'),
        ('Can I attach files?', 'Yes. Add up to 10 pictures or videos to a message.'),
        ('Can I delete a message later?', 'Yes. Delete the post in Capybaroar and it is removed from Discord too.'),
        ('Is the Discord scheduler free?', 'Yes. The Free plan has 3 channels and 30 scheduled posts a month. Creator, Pro and Agency have unlimited posts.')])

ORDER = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'x', 'threads', 'pinterest', 'bluesky', 'mastodon', 'discord']
LOGO = {'linkedin': 'linkedin'}


# ---------- visuals ----------
def fields_html(fs):
    out = ''
    for label, val, pick in fs:
        if isinstance(val, list):
            v = '<span class="chips">' + ''.join(f'<span class="pill{" pick" if k == pick else ""}">{H.escape(x)}</span>' for k, x in enumerate(val)) + '</span>'
        else:
            v = f'<span class="fval">{H.escape(val)}</span>'
        out += f'<div class="fld rv pop"><span class="flab">{label}</span>{v}</div>'
    return out


def composer(c):
    return f'''<div class="win mk-win comp">
<div class="win-h">New post<span class="sub">Crumb &amp; Co.</span></div>
<div class="mk-pad">
<div class="comp-ch rv pop"><span class="pill pick">{net(c["id"])}{c["name"]}</span></div>
<div class="comp-tx rv pop">{H.escape(c["text"])}</div>
{fields_html(c["fields"])}
</div>
<div class="comp-f rv pop"><span class="pill">{ico("i-clock")}Fri, 9:00 AM</span><span class="pill dark">Schedule</span></div>
</div>'''


def preview(c):
    t = H.escape(c['text'])
    head = f'<div class="pvx-h">{face("owner", 30)}<div><b>Crumb &amp; Co.</b><small>Scheduled for Fri, 9:00 AM</small></div>{net(c["id"])}</div>'
    img = c.get('img')
    kind = c['preview']
    if kind == 'vertical':
        return f'<div class="pvx pvx-v rv pop">{food(img)}<div class="pvx-ov"><b>Crumb &amp; Co.</b><p>{t}</p></div><span class="pvx-play">{ico("i-play")}</span>{net(c["id"]).replace("class=" + chr(34) + "nl", "class=" + chr(34) + "nl pvx-logo")}</div>'
    if kind == 'video':
        return f'<div class="pvx rv pop"><div class="pvx-169">{food(img)}<span class="pvx-play">{ico("i-play")}</span><span class="badge m-dur">2:41</span></div><div class="pvx-yt">{face("owner", 30)}<div><b>{t}</b><small>Crumb &amp; Co.</small></div>{net(c["id"])}</div></div>'
    if kind == 'pin':
        return f'<div class="pvx pvx-pin rv pop">{food(img)}<div class="pvx-pad"><b>Easy sourdough for beginners</b><p>{t}</p><div class="pvx-by">{face("owner", 22)}Crumb &amp; Co.{net(c["id"])}</div></div></div>'
    if kind == 'discord':
        return f'<div class="pvx pvx-dc rv pop"><div class="dc-h"># announcements{net(c["id"])}</div><div class="dc-m">{face("owner", 36)}<div><b>Crumb &amp; Co.</b><span class="badge">APP</span><small>Today at 9:00 AM</small><p>{t}</p>{food(img, "dc-img")}</div></div></div>'
    media = f'<div class="pvx-img">{food(img)}</div>' if img else ''
    if kind == 'feed':
        return f'<div class="pvx rv pop">{head}<p class="pvx-t">{t}</p>{media}<div class="pvx-f"><span>Like</span><span>Comment</span><span>Repost</span></div></div>'
    return f'<div class="pvx rv pop">{head}<p class="pvx-t">{t}</p>{media}<div class="pvx-f"><span>Reply</span><span>Repost</span><span>Like</span></div></div>'


def spec_card(c):
    rows = ''.join(f'<div class="spec rv pop"><span>{a}</span><b>{b}</b></div>' for a, b in c['specs'])
    return mock(f'<div class="win mk-win"><div class="win-h">{net(c["id"])}What you can post<span class="sub">{c["name"]}</span></div>{rows}</div>')


def month_for(c):
    titles = ['Meet our bakers', 'Rye is back', 'Shaping video', 'Recipe card', 'Behind the counter', 'Sourdough drop', 'Weekend hours', 'Croissant day', 'Starter guide', 'Bread club', 'Month recap']
    days = [2, 4, 6, 9, 11, 12, 16, 19, 23, 26, 29]
    cells = ''
    ev = dict(zip(days, titles))
    for d in range(1, 36):
        day = d - 2
        n = day if 1 <= day <= 30 else ''
        it = f'<span class="mev rv pop">{net(c["id"])}<em>{ev[day]}</em></span>' if day in ev else ''
        cells += f'<div class="mc{" today" if day == 12 else ""}"><b>{n}</b>{it}</div>'
    hd = ''.join(f'<div class="mh">{x}</div>' for x in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'])
    return mock(f'<div class="win mk-win"><div class="win-h">June<span class="pill pick" style="margin-left:auto;height:24px;font-size:11.5px">{net(c["id"])}{c["name"]}</span></div><div class="mgrid">{hd}{cells}</div></div>')


def inbox_card(c):
    caps = c['inbox']
    people = [('maya', 'Maya Ruiz', 'Do you ship the starter kit to Dallas?'), ('jon', 'Jon Park', 'Loved the post about your night shift team.'), ('rae', 'rae.bakes', 'The crumb on this one is unreal.')]
    acts = ''.join(f'<span>{ico(i)}{l}</span>' for k, i, l in [('Like', 'i-heart', 'Like'), ('Hide', 'i-eyeoff', 'Hide')] if caps.get(k)) + f'<span>{ico("i-reply")}Reply</span>'
    rows = ''.join(f'<div class="modrow rv pop">{face(f, 28)}<div class="bd"><div class="nm">{n}{net(c["id"])}</div><div class="sn">{t}</div><div class="acts">{acts}</div></div></div>' for f, n, t in people)
    return mock(f'<div class="win mk-win"><div class="win-h">Inbox<span class="pill pick" style="margin-left:auto;height:24px;font-size:11.5px">{net(c["id"])}{c["name"]}</span></div>{rows}</div>')


def crosspost_card(c):
    tiles = ''.join(f'<span class="xp{" on" if o == c["id"] or o in ("instagram", "facebook", "linkedin") else ""} rv pop">{net(o if o != "linkedin" else "linkedin")}</span>' for o in ORDER)
    return mock(f'<div class="win mk-win"><div class="win-h">Post to<span class="sub">4 channels picked</span></div><div class="xps">{tiles}</div><div class="mk-pad"><div class="comp-tx rv pop">{H.escape(c["text"])}</div></div><div class="comp-f rv pop"><span class="pill">{ico("i-clock")}Fri, 9:00 AM</span><span class="pill dark">Schedule</span></div></div>')


def stats_card(c):
    posts = [('shape', 'How we shape a loaf', '9.8K'), ('loaf', 'Sourdough drops Friday', '6.1K'), ('croissant', 'Croissant day is back', '3.9K')]
    tp = ''.join(f'<div class="tp rv pop">{food(f)}<div class="bd"><div class="nm">{net(c["id"])}{t}</div><div class="sn">{r} reach</div></div></div>' for f, t, r in posts)
    return mock(f'''<div class="win mk-win"><div class="win-h">{net(c["id"])}{c["name"]} results<span class="seg"><span>7 days</span><span class="on">30 days</span><span>90 days</span></span></div>
<div class="n-stats rv pop"><div class="n-stat"><small>Reach</small><b>21.4K</b><em>+18%</em></div><div class="n-stat"><small>Engagements</small><b>1,842</b><em>+11%</em></div><div class="n-stat"><small>New followers</small><b>+248</b><em>+24%</em></div><div class="n-stat"><small>Posts</small><b>14</b></div></div>
<div class="mk-pad">{tp}</div></div>''')


def agent_card(c):
    return mock(f'''<div class="win mk-win"><div class="win-h"><span class="av y" style="width:22px;height:22px">{ico("i-bot")}</span>Agent<span class="sub">Crumb &amp; Co.</span></div>
<div class="mk-pad"><div class="bub me rv pop" style="align-self:flex-end">Write this week's {c["name"]} posts about our holiday bread box, one a day at 9 AM.</div>
<div class="a-steps rv pop"><div class="a-step done"><span class="ok">{ico("i-check", "")}</span>Wrote 5 posts for {c["name"]}</div><div class="a-step done"><span class="ok">{ico("i-check", "")}</span>Saved 5 drafts at 9:00 AM</div></div></div></div>''')


def join_and(xs):
    return xs[0] if len(xs) == 1 else ', '.join(xs[:-1]) + ' and ' + xs[-1]


def steps4(c):
    s = [('Connect ' + c['account'], c['connect']),
         ('Write your post', 'Add your text and media, then set ' + join_and([f[0].lower() for f in c['fields']]) + ' in the composer.'),
         ('Pick a time', 'Choose a date and time, or add it to your queue and it takes the next free time.'),
         ('It goes out on time', f'Capybaroar posts it to {c["name"]} through the official API. You don\'t need to be online.')]
    return '<ol class="steps4">' + ''.join(f'<li><span class="g-n">{k + 1}</span><h3>{a}</h3><p>{b}</p></li>' for k, (a, b) in enumerate(s)) + '</ol>'


def others(cur):
    tiles = ''.join(f'<li><a class="ont" href="{C[o]["slug"]}">{net(o)}<span>{C[o]["name"]}</span></a></li>' for o in ORDER if o != cur)
    return f'''<section class="band-gray" aria-labelledby="oth-title"><div class="wrap">
<header class="head"><h2 id="oth-title">Schedule everywhere. <span>12 networks, one calendar.</span></h2></header>
<ul class="onets">{tiles}</ul>
<div class="nets-foot"><a class="btn ghost" href="/social-media-scheduler">See the scheduler{ico("i-arrow")}</a></div>
</div></section>'''


for cid in ORDER:
    c = C[cid]
    n = c['name']
    body = f'''<section class="hero f-hero ch-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{net(cid)}{n}</p>
<h1>{c["h1"]} <span class="dim">{c["dim"]}</span></h1>
<p class="lead">{c["lead"]}</p>
<div class="cta"><a class="btn" href="https://app.capybaroar.com/signup">Start free</a><a class="btn ghost" href="#tour">See how it works</a></div>
<p class="note">14 days of Pro free. No card needed.</p>
</div>
<div class="wrap"><div class="showcase f-show"><div class="sc-card"><div class="ch-stage dots" aria-hidden="true" data-reveal>{composer(c)}{preview(c)}</div></div></div></div>
</section>'''
    rows = [zrow('i-pen', 'Composer', f'Every {n} setting.', 'Right in the composer.', f'Capybaroar knows what {n} allows, so your post is checked before it goes out.',
                 [f'{a}: {b}' for a, b in c['specs'][:4]], spec_card(c)),
            zrow('i-calendar', 'Calendar', f'Plan {n}', 'next to everything else.', f'See your {n} posts on the same calendar as your other channels. Drag one to a new day, or add it to your queue.',
                 ['Week, month and list views', 'Queue times that fill in order', 'Drafts, scheduled and published together', 'Post the same thing to other networks'], month_for(c), flip=True)]
    if c['inbox']:
        ib = c['inbox']
        items = [f'{n} comments and replies in one list']
        if ib.get('Messages'):
            items.append(f'{n} messages in the same list')
        if ib.get('Like') and ib.get('Hide'):
            items.append('Like and hide comments from the inbox')
        elif ib.get('Like'):
            items.append('Like comments from the inbox')
        elif ib.get('Hide'):
            items.append('Hide comments from the inbox')
        items.append('Suggested replies on every paid plan')
        if c.get('inbox_note'):
            items.append(c['inbox_note'])
        rows.append(zrow('i-inbox', 'Inbox', f'Answer {n}', 'without opening the app.', f'People\'s comments on your {n} posts land in the Capybaroar inbox, next to every other channel.', items, inbox_card(c), more=('/social-media-inbox', 'More about the inbox')))
    else:
        rows.append(zrow('i-layers', 'Cross-post', f'Post to {n}', 'and 11 more at once.', f'Pick {n} and any other channels in the composer. Each one gets its own text and settings.',
                         ['One post, many channels', 'Its own text for each network', 'Previews that match each feed', 'Saved channel groups'], crosspost_card(c)))
    if c['stats']:
        rows.append(zrow('i-chart', 'Analytics', f'See what works', f'on {n}.', f'Every {n} post gets its numbers, next to your other channels. Find your best posts and your best times.',
                         ['Reach and engagement for every post', 'Views for 7, 30 and 90 days', 'Your best times to post', 'Reports by link, PDF or email'], stats_card(c), flip=True, more=('/social-media-analytics', 'More about analytics')))
    else:
        rows.append(zrow('i-bot', 'Agent', f'Let the agent', f'write your {n} posts.', 'Tell the agent what is coming up. It writes the drafts and puts them on your calendar for you to check.',
                         ['Drafts wait for you to check them', 'Uses your queue times', 'Pictures from top AI models', 'Or use your own AI through MCP'], agent_card(c), flip=True, more=('/mcp', 'Use your own AI')))
    body += tour(rows)
    body += section('how', 'i-clock', 'How it works', f'How to schedule {n} posts.', 'In four steps.', '', steps4(c), gray=True)
    body += f'''<section id="ai" aria-labelledby="ai-title"><div class="wrap">
<header class="head"><p class="tag">{ico("i-bot")}Your AI</p><h2 id="ai-title">Schedule {n} posts <span>from Claude, ChatGPT or Cursor.</span></h2>
<p>Connect your AI once through MCP, then ask it to plan your {n} posts. They land on your calendar as drafts.</p></header>
<div class="ask-ex" data-reveal><div class="ask rv pop"><span class="bub me">Use Capybaroar. Write next week's {n} posts about our sourdough launch and save them as drafts.</span></div></div>
<div class="nets-foot"><a class="btn ghost" href="/mcp">Set up MCP{ico("i-arrow")}</a></div>
</div></section>'''
    body += others(cid)
    body += CLOSE.format(a=f'Your next month of {n} posts,', b='planned today.')
    html = page(c['slug'], cid, c['title'], c['desc'], body, c['faq'])
    open(P + c['slug'][1:] + '.html', 'w').write(html)

# ---------- link the channel pages from the site ----------
NETS_FOOT = '<nav aria-labelledby="f-nets"><h2 id="f-nets">Networks</h2><ul>' + ''.join(f'<li><a href="{C[o]["slug"]}">{C[o]["name"]}</a></li>' for o in ORDER) + '</ul></nav>'
for f in sorted(os.listdir(P)):
    if not f.endswith('.html'):
        continue
    s = open(P + f).read()
    if 'id="f-nets"' not in s and 'id="f-product"' in s:
        s = re.sub(r'(<nav aria-labelledby="f-product">.*?</ul></nav>)', lambda m: m.group(1) + '\n' + NETS_FOOT, s, count=1, flags=re.S)
    open(P + f, 'w').write(s)

# Homepage network tiles link to their pages
h = open(P + 'index.html').read()
TILE = {'instagram': 'instagram', 'tiktok': 'tiktok', 'youtube': 'youtube', 'facebook': 'facebook', 'linkedin': 'linkedin', 'linkedin-page': 'linkedin', 'x': 'x', 'threads': 'threads', 'bluesky': 'bluesky', 'pinterest': 'pinterest', 'mastodon': 'mastodon', 'discord': 'discord'}
for nid, cid in TILE.items():
    pat = re.compile(r'(<li class="nt" style="--i:\d+"><svg aria-hidden="true"><use href="#n-' + re.escape(nid) + r'"/></svg>)([^<]+)(</li>)')
    h = pat.sub(lambda m: m.group(1) + f'<a class="nt-a" href="{C[cid]["slug"]}">{m.group(2)}</a>' + m.group(3), h)
open(P + 'index.html', 'w').write(h)

# Scheduler page table: network names link to their pages
s = open(P + 'social-media-scheduler.html').read()
for nid, cid in TILE.items():
    s = re.sub(r'(<th scope="row"><svg class="nl"><use href="#n-' + re.escape(nid) + r'"/></svg>)([^<]+)(</th>)', lambda m: m.group(1) + f'<a href="{C[cid]["slug"]}">{m.group(2)}</a>' + m.group(3), s)
open(P + 'social-media-scheduler.html', 'w').write(s)

# ---------- Blog and Free tools: real pages until the first posts and tools land ----------
def simple(slug, title, desc, tag_icon, tag, h1a, h1b, lead, empty_t, empty_l):
    url = 'https://capybaroar.com' + slug
    t = H.escape(title)
    d = H.escape(desc)
    body = f'''<section class="hero f-hero simple-hero">
<div class="hero-bg dots" aria-hidden="true"></div>
<div class="wrap hero-text">
<p class="tag solid">{ico(tag_icon)}{tag}</p>
<h1>{h1a} <span class="dim">{h1b}</span></h1>
<p class="lead">{lead}</p>
</div>
<div class="wrap"><div class="soon"><span class="ic">{ico(tag_icon)}</span><h2>{empty_t}</h2><p>{empty_l}</p><a class="btn" href="/">See the platform</a></div></div>
</section>'''
    html = f'''<!doctype html>
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
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="stylesheet" href="/style.css">
<link rel="stylesheet" href="/home.css?v=6">
</head>
<body>
{sprites}<a class="skip" href="#main">Skip to content</a>
{header}

<main id="main">
{body}
{related('none')}
</main>

{footer}

<script src="/nav.js?v=1" defer></script>
</body>
</html>
'''
    if slug == '/blog':
        html = with_promo(html, 'index')
    open(P + slug[1:] + '.html', 'w').write(html)


simple('/blog', 'Blog | Capybaroar', 'Guides on social media, AI agents and growing an audience, from the Capybaroar team.', 'i-file', 'Blog',
       'The Capybaroar blog.', 'Guides for busy teams.', 'How to plan, post and grow on every network, with AI that does the busy work.',
       'The first posts are on the way.', 'Until then, see what Capybaroar can do for your posts.')
simple('/tools', 'Free social media tools | Capybaroar', 'Free tools for social media from Capybaroar. No account needed.', 'i-grid', 'Utilities',
       'Free social media tools.', 'No account needed.', 'Small tools that help you write, plan and check your posts.',
       'The first tools are on the way.', 'Until then, see what Capybaroar can do for your posts.')

# Sitemap
urls = ['/'] + [u for u, _ in PAGES] + [C[o]['slug'] for o in ORDER] + ['/blog', '/tools', '/api', '/terms', '/privacy', '/data-deletion']
open(P + 'sitemap.xml', 'w').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(f'  <url><loc>https://capybaroar.com{u}</loc></url>\n' for u in urls) + '</urlset>\n')
print('channels built:', len(ORDER))
