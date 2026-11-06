# Glossary v2, batch 4.
TERMS = []

TERMS += [
{
 'slug': 'google-business-profile',
 'short': 'A Google Business Profile is a free business listing that shows your info, photos, reviews and posts in Google Search and Google Maps.',
 'body': '''<h2>What is a Google Business Profile?</h2>
<p>A Google Business Profile is the free listing that shows up when someone searches for your business on Google or spots it on Google Maps. It holds your name, address, phone number, opening hours, website, photos and customer reviews in one panel. It used to be called Google My Business, and you may still hear people use the old name.</p>
<p>You claim the profile, prove you own the business, then keep the details fresh. Profiles help most when you have a shop people visit or a set area you serve, like a bakery, a hair salon, a dentist or a mobile dog groomer. Online-only brands can't always get one, since Google ties profiles to a real place or service area.</p>
<h2>How a Google Business Profile works</h2>
<p>When someone types a search like "pizza near me" or the name of your shop, Google looks at the profiles it knows about and picks the ones that fit. It weighs how well a profile matches the search, how close the business is to the person and how well known the business seems. A full, active profile with steady reviews gives Google more to work with.</p>
<p>From the listing, a searcher can call you, ask for directions, open your website, read reviews or check your hours. Each of those taps is a sign of interest, and you can see them in the profile's performance stats. The path from search to action looks a lot like a funnel: many people see the listing, fewer open it, and a smaller group takes a step.</p>
<figure data-chart="1"></figure>
<h2>How to set up your profile</h2>
<p>Setup takes an afternoon if you have your details ready. Gather your hours, a short description, a list of services and a handful of good photos before you start.</p>
<figure data-chart="2"></figure>
<p>Pick your main category with care. It tells Google what you are, and a precise one like "Italian restaurant" beats a broad one like "restaurant" when it is true. You can add a few extra categories, but the main one carries the most weight. Fill in every field you can, since an empty field is a question a customer has to call to ask.</p>
<h2>Google Business Profile posts</h2>
<p>You can publish short updates on your profile, much like posts on a social network. A post can share news, an offer or an event, and it can carry a photo and a button such as "Call now" or "Learn more." Each post can hold up to 1,500 characters, though short posts read better on a phone. Most people only see the first line or two before they tap.</p>
<p>Here is a made-up example. A bike shop posts: "Spring tune-ups are open. Book this week and we'll check your brakes for free. Tap Book to pick a time." It is short, it says what to do, and the photo shows a mechanic at work.</p>
<p>Posts keep your profile looking active and give searchers one more reason to pick you over the shop down the street. Many owners post once a week, or whenever they have an offer or an event coming up.</p>
<h2>How to measure results</h2>
<p>Your profile has a performance view that shows how people found you and what they did next. Look at how often your profile showed in search, plus calls, direction requests and website clicks. Compare month to month, since one week can swing with weather, holidays or local news.</p>
<p>For website clicks, add UTM tags to the link on your profile. Then your website analytics can show how many visitors came from your Google Business Profile and what they did once they arrived, like booking or buying.</p>
<h2>Common mistakes</h2>
<ul>
<li>Leaving holiday hours wrong, which sends customers to a locked door.</li>
<li>Stuffing extra keywords into the business name, which goes against Google's guidelines and can get the profile suspended.</li>
<li>Ignoring bad reviews when a calm, helpful reply would show others you care.</li>
<li>Letting the profile sit for months with no new photos or posts.</li>
<li>Showing a different phone number or address than your website does.</li>
</ul>
<h2>Tips to stand out</h2>
<p>Answer the questions people ask on your profile before they have to call. Add photos often, including seasonal ones and pictures of real customers if they agree. Use the products or services sections so searchers can see what you sell at a glance. And share the same offer you run on your other channels, so every place a customer looks tells the same story.</p>''',
 'charts': [
  {'type': 'funnel', 'title': 'From search to action', 'sub': 'One month on a local profile', 'example': True,
   'stages': [('Times the profile showed in search', 4000, '4,000'), ('Profile opened', 1200, '1,200'), ('Call, directions or website tap', 180, '180')], 'unit': 'Count',
   'note': 'Made-up numbers to show the shape. Your own stats will differ.'},
  {'type': 'steps', 'title': 'Set up your profile',
   'steps': [('Find or create it', 'Search for your business on Google. Claim the listing or start a new one.'),
             ('Verify', 'Prove you own the business with the method Google offers you.'),
             ('Pick a main category', 'Choose the most precise one that is true.'),
             ('Fill every field', 'Hours, services, description, website and service area.'),
             ('Add photos and ask for reviews', 'Show the place and the team, then send happy customers a review link.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Schedule Google Business Profile posts in the same calendar as your other social channels.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Check that a post fits the 1,500 character limit before you publish it.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag the website link on your profile so your analytics show visits from it.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design app for making clean photos and graphics for your posts.'},
 ],
 'list': 'social-media-tools-for-small-business',
 'faqs': [
  ("Is Google Business Profile free?", "Yes. Creating and managing a Google Business Profile is free. Google also sells ads, but you don't need them to have a profile."),
  ("How long can a Google Business Profile post be?", "A post can be up to 1,500 characters. Short posts with a photo and a clear button tend to read best on a phone."),
  ("What happened to Google My Business?", "Google My Business was renamed Google Business Profile. It works in much the same way, and you can manage it from Google Search and Maps."),
  ("How often should I post on my profile?", "Many owners post about once a week or whenever they have news, an offer or an event. Pick a pace you can keep."),
  ("Can an online-only business get a profile?", "Profiles are tied to a real location or a service area where you meet customers. If you only sell online, you may not qualify, so check Google's rules for your case."),
 ],
 'related': ['geotag', 'social-proof', 'keyword', 'post', 'posting-frequency'],
},
{
 'slug': 'grid',
 'short': 'A grid is the layout of post tiles on an Instagram profile, which shows your posts in rows when someone visits your page.',
 'body': '''<h2>What is a grid?</h2>
<p>On Instagram, your grid is the block of tiles people see when they open your profile. Each tile is the cover of one post, carousel or Reel. The newest post sits at the top and older ones slide down as you add more. You can pin a few posts so they stay at the top no matter when you shared them.</p>
<p>The grid crops each post into a tile shape, so part of a photo may be hidden until someone taps it. Instagram has changed the tile shape more than once, so check how your covers look after an app update.</p>
<h2>How the grid works</h2>
<p>Every time you post to the feed, the new tile pushes the rest along by one spot. Since each row holds a fixed number of tiles, one new post shifts every row below it. That matters if you plan patterns. A deleted post or a skipped day throws the whole layout off by one.</p>
<p>Reels can show on the grid too, using the cover frame you pick. Stories don't appear on the grid unless you save them to Highlights, which sit in their own row of circles above it.</p>
<h2>Why your grid matters</h2>
<p>Your grid is often someone's first real look at your account. A person finds you through a Reel, a tag or a search, then taps your name. In a few seconds they scan the grid and decide whether to follow. If it looks clear and they can tell what you post, they are more likely to stay. A messy or empty grid can send them back to scrolling.</p>
<p>Think about a made-up candle shop. Its grid shows warm photos of candles, short Reels of wax being poured and a pinned post with prices. A new visitor gets the idea at once. Now picture the same shop with blurry photos, random memes and old sale posts. Same candles, far fewer follows.</p>
<h2>How to plan your grid</h2>
<ol>
<li><b>Pick a look.</b> Choose a small set of colors, fonts or filters that match your brand, and stick to them.</li>
<li><b>Set a content mix.</b> Decide roughly how much will be photos, carousels and Reels, then rotate them so no format piles up in one spot.</li>
<li><b>Preview before you post.</b> Drop upcoming posts into a grid preview to see how each one sits next to the last.</li>
<li><b>Choose covers on purpose.</b> Pick a Reel cover with a clear face or object and very few words.</li>
<li><b>Pin key posts.</b> Good picks are an intro, a best seller, a how-to guide or a customer review.</li>
<li><b>Review once a month.</b> Scroll your own grid like a stranger would and fix anything that looks off.</li>
</ol>
<figure data-chart="1"></figure>
<h2>Popular grid styles</h2>
<ul>
<li><b>Color theme:</b> every post shares a palette for a calm look.</li>
<li><b>Checkerboard:</b> two kinds of posts take turns, like photos and quote cards.</li>
<li><b>Row by row:</b> each row tells a small story or covers one launch.</li>
<li><b>Puzzle:</b> one big image is split across several tiles.</li>
<li><b>Frame:</b> each tile has the same white edge or colored border.</li>
</ul>
<p>Puzzle grids look striking at first. They break when the tile shape changes or when one post gets deleted, so only use them if you are ready to fix them later.</p>
<h2>How to tell if your grid works</h2>
<p>Instagram Insights shows how many people visit your profile and how many new follows you get. If lots of people visit but few follow, your grid and bio may not be doing their job. Try a cleanup, such as archiving old sale posts, adding clear covers or pinning a welcome post. Then watch the share of visits that turn into follows for a few weeks.</p>
<figure data-chart="2"></figure>
<p>Give any change at least a month before you judge it. A single viral Reel can send a flood of visitors who were never going to follow, which drags the rate down for a week or two.</p>
<h2>Common mistakes</h2>
<ul>
<li>Covers packed with small text that nobody can read at tile size.</li>
<li>Busy photos where the main subject gets lost when cropped.</li>
<li>Spending so long on the layout that you stop posting.</li>
<li>Forgetting that most followers see your posts in their feed, so each post must work on its own too.</li>
<li>Pinning old posts and never swapping them, so the top row shows last year's news.</li>
</ul>
<p>A good test is to hand your phone to a friend who has never seen your account. Ask them what you post and who it is for. If they can answer in one sentence after a quick scroll, your grid is doing its job.</p>''',
 'charts': [
  {'type': 'stack', 'title': 'One month of posts on a planned grid', 'sub': 'Share of tiles by format', 'example': True,
   'parts': [('Reels', 40), ('Carousels', 30), ('Single photos', 20), ('Quote cards', 10)],
   'note': 'Made-up mix for one account. Pick the mix that fits your content.'},
  {'type': 'line', 'title': 'Profile visits that turn into follows', 'sub': 'Monthly rate, with a grid cleanup in March', 'example': True, 'suffix': '%', 'unit': 'Follow rate',
   'points': [('Jan', 4.2), ('Feb', 4.0), ('Mar', 4.6), ('Apr', 5.8), ('May', 6.3), ('Jun', 6.5)],
   'note': 'Made-up numbers for one account.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Instagram scheduler', 'url': '/instagram-post-scheduler', 'line': 'Plan Instagram posts in a calendar and check previews before they go live.'},
  {'name': 'Instagram grid maker', 'url': '/tools/instagram-grid-maker', 'line': 'Split one image into tiles for a puzzle or banner layout.'},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Find the right size for feed posts so your tiles crop the way you expect.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design app for making covers and graphics in your brand colors.'},
 ],
 'list': 'instagram-post-schedulers',
 'faqs': [
  ("What is an Instagram grid?", "It is the layout of post tiles on your Instagram profile. Visitors see it when they open your page."),
  ("How do I plan my Instagram grid?", "Line up your next posts in a grid preview before they go live. Check colors, covers and the mix of formats so the grid looks balanced."),
  ("Can I rearrange my Instagram grid?", "You can pin posts to the top, and Instagram has been adding more ways to arrange your grid. Check your profile options in the app for what is available now."),
  ("Do Reels show on my grid?", "They can. A Reel shows on your grid with the cover frame you choose, so pick one that reads well at tile size."),
  ("Should I delete old posts to clean up my grid?", "Archiving hides a post without losing it, which is safer than deleting. You can bring it back later if you change your mind."),
 ],
 'related': ['instagram', 'pinned-post', 'thumbnail', 'content-calendar', 'profile'],
},
{
 'slug': 'growth-hacking',
 'short': 'Growth hacking is a style of marketing that uses quick, low-cost experiments to find the fastest ways to grow users or customers.',
 'body': '''<h2>What is growth hacking?</h2>
<p>Growth hacking is a way of growing a business by running lots of small, cheap tests and keeping the ones that work. The term came from startups, where tiny teams needed many users fast without big ad budgets. A growth hacker looks across marketing, the product itself and the data, then puts effort behind the few ideas that move the numbers.</p>
<p>The word "hack" here means a clever shortcut. It has nothing to do with breaking into computers or breaking rules. Today many teams call the same work growth marketing.</p>
<h2>How growth hacking works</h2>
<p>The core is a loop. You pick a goal, guess what might move it, test the guess, learn from the result and start again. Speed matters more than polish. A test that runs for two weeks and teaches you something is worth more than a perfect campaign that takes six months to launch.</p>
<figure data-chart="1"></figure>
<p>Each pass through the loop should end with a written note: what you tried, what happened and what you will do next. Over a year, those notes become a playbook of what works for your audience.</p>
<h2>How to pick which ideas to test</h2>
<p>You will always have more ideas than time. A simple fix is to score each idea from 1 to 10 on impact, confidence and ease, then add the scores. Many teams call this an ICE score. The total is only a rough guide, but it stops the loudest person in the room from choosing every test.</p>
<p>Here is a made-up idea list for a small meal kit brand, scored by its team:</p>
<figure data-chart="2"></figure>
<p>The referral offer wins this round, so it runs first. The others wait their turn. If the referral test flops, the team still learns something and moves to the next idea on the list.</p>
<h2>Growth hacking on social media</h2>
<ul>
<li>Testing several hooks on the same video to find the one people watch longest.</li>
<li>A referral offer where customers invite friends and both get a reward.</li>
<li>Turning one post that did well into a carousel, a short video and a thread.</li>
<li>Teaming up with small creators in a tight niche for a one-week trial.</li>
<li>Adding a share prompt right after someone has a good moment with your product, like finishing an order.</li>
<li>Answering every comment in the first hour to see if it lifts reach.</li>
</ul>
<p>Here is a made-up example. A small plant shop noticed that posts about saving dying plants got far more shares than product photos. It tested a weekly "plant rescue" Reel for a month and tracked link clicks from each one. Clicks rose, so the series became a regular slot, and the shop moved on to testing a free care guide.</p>
<h2>How to measure a growth test</h2>
<p>Decide on the number before you start, and write down where it sits today. Use tracked links with UTM tags so you know which post or offer sent each visitor. Run the test long enough to see a pattern. For a small account, that might mean a few weeks. Compare the result with your starting point and with a normal week, so a holiday or a lucky viral post doesn't fool you.</p>
<p>Change one thing at a time. If you swap the offer, the picture and the posting time all at once, you won't know which change made the difference. When you can, keep a control group that sees the old version, so you have something fair to compare against.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Crossing ethical lines.</b> Buying followers, spamming DMs, fake reviews and engagement pods can bring quick numbers and lasting harm. Platforms often cut reach or ban accounts for these tricks.</li>
<li><b>Growing a leaky product.</b> If people sign up and leave, more sign-ups won't fix it. Make the product worth keeping first.</li>
<li><b>Stopping tests too early.</b> A few days of data can point the wrong way.</li>
<li><b>Never writing results down.</b> Lessons get lost when the person who ran the test moves on.</li>
</ul>
<h2>Tips for small teams</h2>
<p>Start with one channel you already know well. Keep a simple sheet with each idea, its score, the test dates and the result. Review it every two weeks with whoever helps you post. When a test wins, turn it into a habit, then go back to the list for the next idea. Small wins stack up faster than you might think.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'The growth test loop',
   'steps': [('Choose one goal', 'Pick a single number, like trial sign-ups per week.'),
             ('Gather ideas', 'Ask your team, read comments and look at past wins.'),
             ('Score and pick', 'Rate each idea and run the top one first.'),
             ('Run the test', 'Set a start date, an end date and what counts as a win.'),
             ('Learn and repeat', 'Keep it, change it or drop it, then write down what you learned.')]},
  {'type': 'bars', 'title': 'Scoring a list of ideas', 'sub': 'ICE score: impact + confidence + ease, each out of 10', 'example': True,
   'rows': [('Referral offer', 24), ('New hooks on Reels', 22), ('Free recipe PDF', 19), ('New landing page', 15), ('Giveaway with a partner', 12)], 'highlight': 'Referral offer', 'unit': 'ICE score',
   'note': 'Made-up scores for a made-up brand.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Compare reach and engagement across your channels while a test runs.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag each test link so you can tell which post or offer sent the visit.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics that show what visitors from social did on your site.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for keeping your idea list, scores and results in one place.'},
 ],
 'list': 'social-media-tools-for-small-business',
 'faqs': [
  ("What is an example of growth hacking?", "A classic example is a referral program that gives both the customer and their friend a reward for signing up. It turns happy customers into a low-cost way to find new ones."),
  ("Is growth hacking the same as marketing?", "It is a type of marketing that focuses on fast testing and measurable growth. It often mixes marketing with product changes and data work."),
  ("Is growth hacking still used?", "Yes, though many teams now call it growth marketing. The core idea of testing quickly and doing more of what works is still common."),
  ("What is an ICE score?", "It is a quick way to rank ideas. You rate each one on impact, confidence and ease, add the numbers and test the highest first."),
  ("How long should a growth test run?", "Long enough to see a clear pattern, which for small accounts often means a few weeks. Set the end date before you start so you don't stop early on a good or bad day."),
 ],
 'related': ['a-b-testing', 'viral', 'key-performance-indicator', 'lead-generation', 'analytics'],
},
{
 'slug': 'grwm',
 'short': 'GRWM stands for get ready with me, a video style where a creator chats with viewers while doing their makeup, hair or getting dressed.',
 'body': '''<h2>What is GRWM?</h2>
<p>GRWM is short for "get ready with me." In a GRWM video, a creator films themselves getting ready for the day, a date, a trip or a big event. They might do skincare, makeup or hair, or try on outfits. While they get ready, they talk to the camera as if a friend were sitting on the bed behind them.</p>
<p>You will see the letters in video titles, captions and hashtags such as #GRWM. The format is common on TikTok, Instagram Reels and YouTube, both as short clips and as longer sit-down videos.</p>
<h2>How a GRWM video works</h2>
<p>A GRWM has two layers running at once. The first is the routine: the steps of getting ready, which give the video a clear shape from start to finish. The second is the talk: a story, an opinion, some advice or the latest news in the creator's life. The routine keeps hands busy and gives viewers something to look at. The talk gives them a reason to stay.</p>
<p>Because the routine has a natural ending, like grabbing keys and walking out the door, viewers often stick around to see the finished look. That built-in payoff is a big part of why the format holds attention so well.</p>
<h2>Why GRWM videos are popular</h2>
<ul>
<li>They feel personal, like hanging out with the creator.</li>
<li>Viewers pick up product and routine tips without a lecture.</li>
<li>The talk can cover anything, from a funny story to a serious topic.</li>
<li>They are easy to film with a phone, a mirror and a window.</li>
<li>They give fans a peek at the creator's real day.</li>
</ul>
<p>The format has also spread far past makeup. "Get unready with me" shows a night routine. People film GRWM-style videos while packing for a trip, getting ready for the gym, setting up a shop before it opens or making lunch for the week. The idea stays the same: a simple task on screen and a good story out loud.</p>
<p>Here is a made-up caption: "GRWM for my first day at the new job. Telling you how I almost missed the interview while I do a five-minute makeup look."</p>
<h2>GRWM vs a tutorial</h2>
<p>A makeup tutorial teaches. Each step is explained, often with close-ups and product names, so you can copy the look at home. A GRWM entertains first. The products show up, but the story leads. Viewers who want to learn a look step by step will pick the tutorial. Viewers who want company and a chat will pick the GRWM.</p>
<figure data-chart="1"></figure>
<h2>How to make a GRWM video</h2>
<figure data-chart="2"></figure>
<p>Plan the story more than the routine. Jot down the main beats you want to hit, such as the setup, the twist and how it ended. Then let the routine fill the time between them. If your story runs short, the video can end early. Nobody needs every step of a long routine.</p>
<p>Light matters a lot. Sit facing a window during the day if you can. Keep the phone steady on a stand at eye level, and make sure the mic picks up your voice over a hair dryer or running tap. Add captions, since plenty of people watch on mute.</p>
<h2>How brands use GRWM</h2>
<p>GRWM fits beauty, fashion and personal care brands well. A creator can use a product as part of a real routine, which feels more natural than a standard ad. Some brands film their own GRWM videos with staff, showing how they get ready with the products they sell. Others ask creators for a GRWM before an event the brand is hosting, so the video doubles as a teaser.</p>
<p>Any paid GRWM should be clearly labeled as an ad or a paid partnership, the same as any sponsored post.</p>
<h2>Common mistakes</h2>
<ul>
<li>Opening with a long silent stretch before the talking starts.</li>
<li>Rushing the story so the video ends before the look is done.</li>
<li>Filming in dim light, which hides the very products people want to see.</li>
<li>Skipping captions, so people watching on mute lose the story.</li>
<li>Listing every product like a shopping haul, which turns the chat into an ad.</li>
</ul>
<p>The fix for most of these is the same. Watch your video once with the sound off and once with your eyes closed. If it still makes sense both ways, it is ready to post.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'GRWM vs a tutorial', 'cols': ('GRWM', 'Tutorial'),
   'rows': [('Main goal', 'Chat and entertain', 'Teach a skill'), ('A story runs through it', True, False), ('Every step explained', False, True),
            ('Product names', 'Sometimes', 'Usually'), ('Close-ups of each step', False, True)]},
  {'type': 'steps', 'title': 'Make a GRWM video',
   'steps': [('Pick the reason', 'A date, a trip, a first day or just a normal Monday.'),
             ('Plan the story beats', 'Write the setup, the twist and the ending on a sticky note.'),
             ('Set up light and sound', 'Face a window, prop the phone at eye level and test the mic.'),
             ('Open with the hook', 'Say what you are getting ready for and why it matters.'),
             ('Talk while you work', 'Let the story fill the routine and end on the finished look.')]},
 ],
 'tools': [],
 'faqs': [
  ("What does GRWM mean?", "GRWM means get ready with me. It is a video where a creator gets ready while talking to viewers."),
  ("Where are GRWM videos posted?", "GRWM videos are most common on TikTok, Instagram Reels and YouTube, often tagged with #GRWM."),
  ("What do you talk about in a GRWM?", "Anything you like. Many creators tell a story, give advice, talk about their plans for the day or explain the products they use."),
  ("How long should a GRWM be?", "As long as the story needs. A short clip can work for a quick tale, while a longer video suits a full routine and a bigger story."),
 ],
 'related': ['ootd', 'vlog', 'content-creator', 'influencer', 'tiktok'],
},
{
 'slug': 'handle',
 'short': 'A handle is the unique username that identifies an account on a social network, usually written with an @ sign, like @yourbrand.',
 'body': '''<h2>What is a handle?</h2>
<p>A handle is your username on a social network. It is the name after the @ sign, like @sunnybakery. No two accounts on the same network can share one, so a handle works like an address. People type it to tag you, mention you or find your profile, and it often becomes part of your profile's web address.</p>
<p>Your handle is separate from your display name. The display name is the bigger, friendlier name at the top of your profile. It can have spaces and emoji, and plenty of other accounts can use the same one. The handle is the short ID that belongs to you alone.</p>
<figure data-chart="1"></figure>
<h2>How handles work</h2>
<p>When someone writes your handle in a post or comment, the network turns it into a link to your profile and usually sends you a notice. That is called a mention. Search bars match handles too, so a short, clear one is easier to find. If you change your handle, old mentions may stop pointing to you, and a flyer or menu with the old one prints the wrong address.</p>
<h2>Why your handle matters</h2>
<ul>
<li>It is how customers find you in search.</li>
<li>Other accounts use it to tag and mention you.</li>
<li>It often shows in your profile link, so it ends up on business cards, packaging and ads.</li>
<li>A matching handle on every network helps people trust they found the real you.</li>
</ul>
<p>Fake accounts often copy a brand's name with one extra letter or an underscore. When your real handle is the same everywhere, people spot the copies faster. Verified badges help on some networks, but plenty of small businesses never get one, so a clean, matching handle is your first line of trust.</p>
<p>Your handle also shapes how people talk about you offline. A customer telling a friend "find them at sunny bakery" is far more likely to land on the right page than one trying to remember "sunny underscore bakery two."</p>
<h2>How to choose a good handle</h2>
<ol>
<li><b>Start with your brand name.</b> If it is free, take it.</li>
<li><b>Keep it short.</b> Short handles are easier to type, say out loud and fit into a caption.</li>
<li><b>Skip confusing bits.</b> Numbers, double underscores and letters that look alike, like a lowercase l and a capital I, cause typos.</li>
<li><b>Check every network.</b> Look for the same handle on each place you plan to post before you commit.</li>
<li><b>Add a simple word if needed.</b> "hq," "shop," "app," "studio" or your city can rescue a taken name.</li>
<li><b>Say it out loud.</b> If you have to spell it twice on the phone, try again.</li>
</ol>
<h2>How to change your handle safely</h2>
<p>Sometimes a rebrand means a new handle. Plan the switch so you lose as few people as possible.</p>
<figure data-chart="2"></figure>
<p>For a made-up example, say a shop called Pine and Pour moves from @pineandpourcandles to @pineandpour. It posts a heads-up a week ahead, changes the handle on a quiet morning, updates its website and email footer the same day and keeps a pinned post about the new name for a month. Regulars barely notice, and new customers only ever see the short name.</p>
<h2>Handles on different networks</h2>
<p>Most networks use an @ handle, but the details vary. On Bluesky, a handle can be a domain you own, like @yourbrand.com, which also shows the account really is yours. On Mastodon, a full handle includes the server, like @yourname@server.social, because accounts live on many different servers. Rules on length, capital letters and allowed symbols differ too, so a handle that works on one network may be too long or not allowed on another.</p>
<p>Some networks limit how often you can change your handle. Others let the old one go back into the pool, where anyone can grab it. Read the network's help page before you switch.</p>
<h2>Common mistakes</h2>
<ul>
<li>Changing your handle often, which breaks links and confuses followers.</li>
<li>Picking a handle close to a famous brand, which can get you reported.</li>
<li>Leaving your name open on a new network, so someone else claims it first.</li>
<li>Using a personal handle for a business account you may hand to a team later.</li>
<li>Mixing upper and lower case in print in a way that makes the handle hard to read.</li>
</ul>
<p>Before you print a handle on anything that lasts, like a shop sign or a van, type it into each app yourself and make sure it lands on the right profile.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Handle vs display name', 'cols': ('Handle', 'Display name'),
   'rows': [('Unique on the network', True, False), ('Can have spaces', False, True), ('Used to tag and mention you', True, False),
            ('Part of your profile web address', 'Often', False), ('Easy to change', 'Sometimes limited', 'Usually')]},
  {'type': 'steps', 'title': 'Change a handle safely',
   'steps': [('Warn your followers', 'Post the new name a week ahead and pin it.'),
             ('Switch on a quiet day', 'Change it when few posts or ads are running.'),
             ('Update every link', 'Website, email footer, other profiles and printed items.'),
             ('Watch for copycats', 'Check if anyone grabs your old name and report fakes.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See comments and mentions of your accounts from your connected channels in one place.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'One page that lists all your profiles, so people find the right handle on every network.'},
 ],
 'faqs': [
  ("What is the difference between a handle and a username?", "They usually mean the same thing. Handle is the common name for the unique username that follows the @ sign."),
  ("Can I change my social media handle?", "Most networks let you change it, though some limit how often. Changing it can break old links and tags, so do it rarely and tell followers first."),
  ("What happens if my handle is taken?", "Try adding a short word like shop, app, hq or official, or pair your brand name with your city. Keep the new handle the same across networks if you can."),
  ("Is a handle the same as a display name?", "No. The handle is the unique ID after the @ sign. The display name is the bigger name on your profile, and other accounts can share it."),
 ],
 'related': ['profile', 'mention', 'tag', 'bio', 'verified-account'],
},
]

TERMS += [
{
 'slug': 'hashtag',
 'short': 'A hashtag is a word or phrase after a # sign that groups posts on the same topic so people can find them.',
 'body': '''<h2>What is a hashtag?</h2>
<p>A hashtag is a tag you make by putting the # sign in front of a word or a run of words with no spaces, like #SmallBusiness or #BakingTips. On most social networks a hashtag turns into a link. Tap it and you see other posts that use the same tag. That gives everyone a simple way to sort a huge stream of posts into topics.</p>
<p>Hashtags started as a habit among users before the networks built them in. Now nearly every major app reads them, though each one treats them a little differently.</p>
<h2>How hashtags work</h2>
<p>When you add a hashtag, the network files your post under that tag. People can find it by tapping the tag on another post, searching for it or, on some apps, following the tag so matching posts show up in their feed. The app also reads your tags as a clue about what your post covers, along with your caption, the image and the sound.</p>
<p>A tag only links letters, numbers and underscores with no spaces. #Coffee_Time works on most apps, while #Coffee-Time stops at the dash and becomes #Coffee. A tag made only of numbers often won't link at all.</p>
<h2>Why hashtags matter</h2>
<p>Hashtags help people who don't follow you find your posts. Someone who taps or searches a tag can land on your content even if they have never heard of you. Brands also create their own tags to collect fan posts in one place or to keep a whole campaign in a single feed. A made-up coffee shop might ask customers to post their latte art with #BeanThereLatte, then share the best ones each Friday.</p>
<h2>How to choose hashtags</h2>
<ol>
<li><b>Start with your topic.</b> Write down the words someone would use to describe your post.</li>
<li><b>See what people already use.</b> Search those words in the app and look at the tags on top posts in your niche.</li>
<li><b>Mix broad and specific.</b> A broad tag is crowded and moves fast. A narrow tag reaches fewer people who care more.</li>
<li><b>Add a branded tag</b> if you run a campaign or want to collect customer posts.</li>
<li><b>Check each tag first.</b> Make sure it isn't tied to a joke, a scandal or a meaning you didn't expect.</li>
<li><b>Capitalize each word.</b> #PlantBasedRecipes is easier to read than #plantbasedrecipes, and screen readers say it more clearly.</li>
</ol>
<figure data-chart="1"></figure>
<h2>How many hashtags should you use?</h2>
<p>There is no single right number. Each network treats tags differently, and the advice shifts over time. On X, Threads and LinkedIn, posts usually carry just a few. On Instagram and TikTok, tags in the caption count toward the 2,200 character limit, so a long block of them eats space you could use for words. On X, every tag eats into a 280 character post, which adds up fast.</p>
<figure data-chart="2"></figure>
<p>Use as many as truly describe the post, then test. Try a month of posts with a few tags and a month with more, keeping topics and posting times similar. Compare reach from hashtags in your analytics and keep whatever works for your account.</p>
<h2>Where to put hashtags</h2>
<p>You can weave a tag into a sentence ("Our #SourdoughSunday loaf is out of the oven"), add a short group at the end of the caption or, on Instagram, put them in the first comment. Inside a sentence reads most naturally. At the end keeps the main text clean. The first comment keeps the caption even tidier, though it takes an extra step each time. Pick one style and stick with it, so your posts look neat side by side.</p>
<h2>Common mistakes</h2>
<ul>
<li>Stuffing a post with dozens of loosely related tags.</li>
<li>Jumping on a trending tag that has nothing to do with your post, which annoys people and hurts trust.</li>
<li>Making a brand hashtag so long nobody can spell it.</li>
<li>Pasting the same block of tags on every post, no matter the topic.</li>
<li>Using tags a network has hidden or limited, which can keep your post off that tag's page.</li>
</ul>
<p>When in doubt, ask yourself if a stranger tapping that tag would be glad to find your post. If the answer is yes, keep it. If you have to squint to see the link, cut it.</p>''',
 'charts': [
  {'type': 'stack', 'title': 'A balanced set of six tags', 'sub': 'One way to mix tags on a single post', 'example': True,
   'parts': [('Broad topic', 1), ('Specific topic', 2), ('Niche or local', 2), ('Branded', 1)],
   'note': 'A made-up mix to show the idea. Test what works for your account.'},
  {'type': 'bars', 'title': 'Room for words and tags', 'sub': 'Hashtags count toward each post limit', 'unit': 'Characters',
   'rows': [('LinkedIn', 3000, '3,000'), ('Instagram', 2200, '2,200'), ('TikTok', 2200, '2,200'), ('Threads', 500, '500'), ('Mastodon', 500, '500'), ('Bluesky', 300, '300'), ('X', 280, '280')], 'highlight': 'X',
   'note': "Limits used by Capybaroar's composer, November 2026."},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Write captions, add a first comment for your tags and schedule posts across your channels.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Compare reach and engagement across posts to see which tag habits help.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Check how much room your tags take before you post.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ("Do hashtags still work?", "Yes. Hashtags still help people find posts by topic on most networks, though how much they help depends on the platform. Treat them as labels that describe your post."),
  ("Where should I put hashtags?", "You can put them inside a sentence, at the end of the caption or, on Instagram, in the first comment. Choose the spot that keeps your post easy to read."),
  ("Can I create my own hashtag?", "Yes. Anyone can start a hashtag just by typing it. Search it first to check that nobody is already using it for something else."),
  ("Are hashtags case sensitive?", "Generally no, so #CoffeeTime and #coffeetime lead to the same place. Capitalizing each word just makes the tag easier to read."),
  ("Do hashtags count toward the character limit?", "Yes. Every character in a tag, including the # sign, counts toward the post limit, which matters most on short networks like X and Bluesky."),
 ],
 'related': ['keyword', 'trend', 'caption', 'explore-page', 'social-listening'],
},
{
 'slug': 'highlights',
 'short': 'Highlights are Instagram Stories you save to your profile in named groups, so they stay visible after the Story itself expires.',
 'body': '''<h2>What are Highlights?</h2>
<p>Instagram Highlights are saved groups of your Stories. A normal Story drops out of view after a day. When you add it to a Highlight, it stays on your profile until you remove it. Highlights sit in a row of small circles just under your bio, each with its own name and cover image. Tap one and the saved Stories play in order, just like a live Story.</p>
<p>Think of them as folders on your profile. Each one holds Stories on one theme, such as prices, reviews or how to book. Stories you post every day come and go, while Highlights are the part of your Story work that stays on show for every new visitor.</p>
<h2>How Highlights work</h2>
<p>Every Story you post goes to your private Story archive once it expires, as long as the archive setting is on. From there, or while the Story is still live, you can add it to a Highlight. One Story can sit in more than one Highlight. The order of the row can shift when you add to a group, so check your profile after you make changes.</p>
<p>Anyone who can see your profile can watch your Highlights. If your account is private, only approved followers can. Stories you first shared only with Close Friends are meant to stay limited to that list, so check who can see a Highlight before you fill it with them.</p>
<h2>Why Highlights matter</h2>
<p>When someone visits your profile for the first time, the Highlights row is one of the first things they see. It works like a menu. A visitor can tap "Prices" or "Reviews" and get answers without sending you a message. For a business, that turns short-lived Stories into lasting content that keeps working long after you posted it.</p>
<p>Highlights also save you time in your inbox. If people keep asking where you ship or how long orders take, one "Shipping" Highlight can answer them all day long while you get on with your work.</p>
<h2>How to create a Highlight</h2>
<figure data-chart="1"></figure>
<p>You can add more Stories, remove old ones or rename the group whenever you like. To change the cover, open the Highlight, choose edit and pick a frame or an image from your phone. Many brands make simple icon covers in their brand colors so the row looks neat and each circle is easy to tell apart.</p>
<h2>Ideas for Highlights</h2>
<ul>
<li><b>Start here:</b> who you are and what you offer, in a few quick frames.</li>
<li><b>FAQ:</b> answers to the questions you get most in DMs.</li>
<li><b>Products or menu:</b> what you sell, with photos and prices.</li>
<li><b>Reviews:</b> shared posts and messages from happy customers.</li>
<li><b>How it's made:</b> your team, your tools or your process.</li>
<li><b>Events:</b> recaps of launches, classes or pop-ups.</li>
</ul>
<p>Here is a made-up example. A yoga studio keeps Highlights called "New here," "Schedule," "Teachers," "Reviews" and "Retreats." A newcomer can learn what to bring, see the weekly class times and meet the teachers without ever leaving the profile. The studio gets fewer "what should I wear?" messages, and more people show up ready.</p>
<h2>How to tell which Highlights get used</h2>
<p>Your Story stats in Instagram Insights show how many people viewed each Story. Look at the Stories inside each Highlight and see which groups get the most attention. You can also watch your DMs. If people stop asking a question that a Highlight answers, it is doing its job.</p>
<figure data-chart="2"></figure>
<p>The groups people open most deserve your best, freshest Stories and the first spots in the row. The ones nobody taps can be merged into another group or removed.</p>
<h2>Common mistakes</h2>
<ul>
<li>Letting Highlights go stale with old prices, past sales or expired offers.</li>
<li>Using covers that all look alike, so nobody can tell the circles apart.</li>
<li>Giving groups long names that get cut off under the circle.</li>
<li>Packing one Highlight with dozens of frames, so people give up halfway.</li>
<li>Saving Stories with stickers or links that no longer work.</li>
</ul>
<p>Set a reminder to clean them out every month or so. A few minutes of tidying keeps your profile feeling current and stops new visitors from acting on old news. While you are at it, look at the order of the row. Put the groups that answer new visitors' biggest questions at the front, where they are seen first.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Create a Highlight',
   'steps': [('Pick a Story', 'Use one that is live now, or open your Story archive.'),
             ('Tap Highlight', 'Choose the Highlight option on the Story.'),
             ('Choose a group', 'Add it to an existing Highlight or start a new one.'),
             ('Name it', 'Use one or two short words that fit under the circle.'),
             ('Set the cover', 'Edit the Highlight and pick a frame or a simple icon.')]},
  {'type': 'columns', 'title': 'Which Highlights people open', 'sub': 'Views over one month for a small shop', 'example': True,
   'rows': [('Start here', 820, '820'), ('FAQ', 610, '610'), ('Menu', 540, '540'), ('Reviews', 300, '300'), ('Events', 120, '120')], 'highlight': 'Start here', 'labels': 'all', 'unit': 'Views',
   'note': 'Made-up numbers for one account.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Instagram scheduler', 'url': '/instagram-post-scheduler', 'line': 'Plan your Instagram posts in one calendar with your other channels.'},
  {'name': 'Instagram story size', 'url': '/tools/instagram-story-size', 'line': 'Get the right size for Stories and Highlight covers.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design app for making matching Highlight covers and Story frames.'},
 ],
 'list': 'instagram-post-schedulers',
 'faqs': [
  ("Do Instagram Highlights expire?", "No. A Story added to a Highlight stays on your profile until you remove it or delete the Highlight."),
  ("Can I add an old Story to a Highlight?", "Yes. If your Story archive is turned on, you can pick past Stories from the archive and add them to any Highlight."),
  ("How do I change a Highlight cover?", "Open the Highlight, choose to edit it and pick a new cover. You can use a frame from one of its Stories or an image from your camera roll."),
  ("How many Highlights should I have?", "Enough to answer the main questions new visitors have, and few enough that the row is easy to scan. Many accounts keep somewhere between four and eight."),
  ("Can people see my Highlights if my account is private?", "Only people you have approved as followers can see them on a private account."),
 ],
 'related': ['instagram-stories', 'instagram', 'bio', 'profile', 'story'],
},
{
 'slug': 'hook',
 'short': 'A hook is the opening line or first moment of a post that grabs attention and makes people want to keep reading or watching.',
 'body': '''<h2>What is a hook?</h2>
<p>A hook is the very start of your content. In a video, it is the first moment on screen and the first words you say. In a text post, it is the line or two that show before the "see more" cut. In a carousel, it is the first slide. Its one job is to make someone stop scrolling and give the rest of your post a chance.</p>
<p>The rest of the post does the real work: teaching, telling a story or selling. The hook is the door. If nobody walks through it, the rest never gets seen.</p>
<h2>How hooks work</h2>
<p>People scroll fast. They decide almost at once if a post is worth their time, based on what they see and hear in the first moment. A good hook gives them a reason to stay, like a problem they have, a result they want or a question they can't leave alone.</p>
<p>Many platforms watch how long people stay on a post when they decide who to show it to next. If most viewers leave in the first second, the post may stall. If they stick around, it can keep spreading. That is why the drop in the first few seconds of a video matters so much.</p>
<figure data-chart="1"></figure>
<h2>Types of hooks, with examples</h2>
<p>These lines are made up to show the idea.</p>
<ul>
<li><b>A question:</b> "Why does your bread always come out flat?"</li>
<li><b>A bold claim:</b> "You're watering your houseplants too much."</li>
<li><b>A promise:</b> "Here's how I plan a whole week of posts in one hour."</li>
<li><b>A story start:</b> "The day our oven broke, we got our biggest order ever."</li>
<li><b>A mistake:</b> "Stop putting your logo in the first frame."</li>
<li><b>The result first:</b> show the finished cake, then rewind to the start.</li>
</ul>
<h2>How to write a hook step by step</h2>
<ol>
<li><b>Write the main point first.</b> Know what the post delivers before you decide how it opens.</li>
<li><b>Find what your viewer cares about.</b> Pick the problem they feel or the result they want.</li>
<li><b>Put it in the first few words.</b> Cut warm-ups like "Hey guys, so today I wanted to talk about."</li>
<li><b>Show it as well as say it.</b> In video, open on movement or something unusual, and add on-screen text that repeats the hook.</li>
<li><b>Write several versions.</b> Five quick drafts usually beat one careful one.</li>
<li><b>Test them.</b> Use different hooks on similar posts and compare how long people stay.</li>
</ol>
<h2>Hooks on different networks</h2>
<p>On short video apps like TikTok, Instagram Reels and YouTube Shorts, the hook is mostly visual and spoken, and it has to land in a second or two. On LinkedIn and Facebook, the hook is the opening line of text, because only the first lines show before the post is cut. On X, Threads and Bluesky, the whole post is short, so the hook is often the first sentence and the post at once. On Pinterest and YouTube, the title and the image do the hooking before anyone opens the content.</p>
<p>That means one idea may need a different hook on each network. A video can open on a dramatic before shot, while the LinkedIn version of the same tip opens with a plain, surprising sentence.</p>
<h2>How to measure a hook</h2>
<p>For video, look at how many viewers are still watching after the first few seconds. Most video analytics show a retention graph or an average watch time. For text posts, compare how many people stop to react or comment. Change only the hook between tests so you know the opening made the difference.</p>
<figure data-chart="2"></figure>
<p>In the made-up test above, the same video went out with four different openings. Showing the result first kept the most people. The slow intro lost more than half of them before anything useful happened.</p>
<h2>Common mistakes</h2>
<ul>
<li>Promising something the post doesn't deliver. That is clickbait, and people trust you less next time.</li>
<li>Starting with a logo, a title card or a long intro.</li>
<li>Being vague. "Some tips for you" says nothing. "Fix a squeaky door in ten seconds" says a lot.</li>
<li>Saying the hook out loud with nothing new happening on screen.</li>
</ul>
<p>Keep the hook honest and specific, and make sure the rest of the post pays it off. A strong hook with a weak payoff wins one view and loses a follower.</p>''',
 'charts': [
  {'type': 'line', 'title': 'Viewers still watching a short video', 'sub': 'Most of the drop happens in the first seconds', 'example': True, 'suffix': '%', 'unit': 'Still watching',
   'points': [('0s', 100), ('1s', 82), ('2s', 70), ('3s', 63), ('5s', 55), ('10s', 46), ('15s', 40), ('20s', 36)],
   'note': 'Made-up numbers for one video.'},
  {'type': 'bars', 'title': 'Four hooks on the same video', 'sub': 'Share of viewers still watching at 3 seconds', 'example': True, 'unit': 'Still watching',
   'rows': [('Result first', 68.0, '68%'), ('Bold claim', 61.0, '61%'), ('Question', 55.0, '55%'), ('Slow intro', 31.0, '31%')], 'highlight': 'Result first',
   'note': 'Made-up numbers to show how a hook test reads.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar AI agent', 'url': '/#agents', 'line': 'An AI agent that plans and writes posts as drafts for you to review, on paid plans.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Check how long your opening line is before the post gets cut.'},
  {'name': 'CapCut', 'url': 'https://www.capcut.com/', 'domain': 'capcut.com', 'line': 'A video editor for trimming slow starts and adding on-screen text.'},
  {'name': 'Claude', 'url': 'https://claude.ai/', 'domain': 'claude.ai', 'line': 'An AI assistant you can ask for several versions of an opening line.'},
 ],
 'faqs': [
  ("How long should a hook be?", "Short. For a video, aim to land it in the first second or two. For a text post, fit it in the first line or two that show before the post is cut off."),
  ("What makes a good hook on TikTok or Reels?", "Start with movement, a clear on-screen line and a reason to keep watching, such as a question or a result you will show. Skip greetings and intros."),
  ("Is a hook the same as clickbait?", "No. A hook grabs attention and the post delivers on it. Clickbait grabs attention with a promise the post doesn't keep."),
  ("How do I test hooks?", "Post similar content with different openings and compare how many people are still watching after a few seconds. Change only the hook so the test is fair."),
 ],
 'related': ['caption', 'clickbait', 'watch-time', 'dwell-time', 'call-to-action'],
},
{
 'slug': 'impressions',
 'short': 'Impressions are the number of times your content was shown on a screen, counting repeat views by the same person.',
 'body': '''<h2>What are impressions?</h2>
<p>Impressions count how many times your post or ad was shown on a screen. Every time the content appears, that is one impression. If one person sees your post four times, that adds four impressions. An impression doesn't mean the person read it, liked it or clicked. It only means the content showed up.</p>
<p>Some apps now call this number views. The idea is the same: a count of displays, with repeats included.</p>
<p>Impressions are usually the biggest number in your stats, which is why people like to quote them. They are also the easiest number to misread, because they say nothing about who saw the post or whether anyone cared.</p>
<h2>Impressions vs reach</h2>
<p>Reach counts unique people. Impressions count total displays. So impressions are almost always equal to or higher than reach. Divide one by the other and you get frequency, the average number of times each person saw the post.</p>
<figure data-chart="1"></figure>
<p>A high frequency can mean people came back to your post on purpose, maybe to reread a recipe or rewatch a video. It can also mean the post showed up in several places, like the feed, a hashtag page and a friend's share. For ads, a frequency that keeps climbing can mean the same people see your ad over and over and start to tune it out.</p>
<p>Here is a made-up example. A gym posts a short workout video. It gets 9,000 impressions and reaches 4,000 people. Many members saved it and came back to follow along, so the frequency is high for a good reason. A second post with the same impressions but a frequency near one reached more new people, which tells a different story.</p>
<h2>How platforms count impressions</h2>
<p>Each network has its own rule for when a display counts. Some count a post as soon as it appears on screen. Others need it to stay in view for a moment. Video views often have their own rule too. Because the rules differ, compare impressions within one network over time. Putting one app's impressions next to another's can mislead you.</p>
<p>Most apps also break impressions down by where they came from, such as the home feed, your profile, search, hashtags or a discovery page. That split shows how people are finding your posts and which doors are open to new viewers.</p>
<p>If you run ads, you will also see paid and organic impressions split apart. Organic impressions come from people seeing your post on their own. Paid ones come from the ad budget. Keep them separate in your reports so a boosted post doesn't make your normal posts look better than they are.</p>
<figure data-chart="2"></figure>
<h2>How to use impressions</h2>
<p>On its own, a big impressions number feels nice but says little. Impressions are most useful as the bottom of a fraction:</p>
<ul>
<li><b>Click-through rate:</b> clicks ÷ impressions × 100.</li>
<li><b>Engagement rate by impressions:</b> engagements ÷ impressions × 100.</li>
<li><b>Cost per thousand impressions (CPM):</b> ad spend ÷ impressions × 1,000.</li>
<li><b>Frequency:</b> impressions ÷ reach.</li>
</ul>
<p>These show how well your content did once people saw it. High impressions with a low rate can mean a weak hook or the wrong audience. Low impressions with a high rate can mean a good post that needs more people to see it, such as a better posting time or a small boost.</p>
<p>Track these rates monthly in one place, along with the raw counts. A month with fewer impressions but more clicks may be a better month for your business.</p>
<figure data-chart="3"></figure>
<h2>How to get more impressions</h2>
<ol>
<li><b>Post when your audience is online.</b> Your analytics show the hours your followers are active.</li>
<li><b>Use the formats each app is pushing.</b> Short video is often shown to people who don't follow you.</li>
<li><b>Open strong.</b> A good hook keeps people on the post, which helps it spread.</li>
<li><b>Add words people search for.</b> Clear captions, keywords and a few fitting hashtags help search and topic pages find you.</li>
<li><b>Reply to comments.</b> An active thread keeps the post in front of people.</li>
<li><b>Post on a steady schedule.</b> Long gaps make it harder to build momentum.</li>
</ol>
<h2>Common mistakes</h2>
<ul>
<li>Reporting impressions as if they were people. Ten thousand impressions might be a few thousand people.</li>
<li>Comparing impressions across networks that count them differently.</li>
<li>Chasing impressions with off-topic trends that bring views from people who will never care.</li>
<li>Judging a post in its first hour, when many keep collecting impressions for days.</li>
</ul>
<p>Use impressions to spot which posts traveled, then use the rates built on them to judge which posts actually worked.</p>''',
 'charts': [
  {'type': 'formula', 'title': 'Frequency: how often each person saw a post', 'formula': 'Frequency = impressions ÷ reach',
   'note': 'Made-up numbers to show the math.', 'result': '2.25 views per person',
   'example': [('Impressions', '9,000'), ('Reach', '4,000')]},
  {'type': 'bars', 'title': 'Where one post\'s impressions came from', 'sub': 'Total impressions split by source', 'example': True, 'unit': 'Impressions',
   'rows': [('Home feed', 5200, '5,200'), ('Explore or discovery', 1500, '1,500'), ('Hashtags', 1400, '1,400'), ('Profile', 900, '900')], 'highlight': 'Home feed',
   'note': 'Made-up numbers. Source names differ by app.'},
  {'type': 'funnel', 'title': 'From impressions to clicks', 'sub': 'One post with a link', 'example': True, 'unit': 'Count',
   'stages': [('Impressions', 20000, '20,000'), ('Engagements', 900, '900'), ('Link clicks', 240, '240')],
   'note': 'Made-up numbers to show how the rates build on impressions.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, engagement and follower trends for every channel side by side.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Work out engagement rate by impressions, reach or followers.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for logging impressions and rates month by month.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ("What is a good number of impressions?", "It depends on your account size and goal. Compare each post with your own average to see what is working."),
  ("Do impressions count the same person more than once?", "Yes. Impressions count every display, so one person seeing a post three times adds three impressions. Reach is the number that counts each person once."),
  ("Are impressions the same as views?", "They are close, and some platforms now use the word views for this number. For video, a view can also mean a play that met the platform's own rule, so check each app's definition."),
  ("Why are my impressions dropping?", "Common causes are posting less often, posting at quiet times, a change in what the platform favors or content your audience isn't reacting to. Look at recent posts that did well and do more of what they did."),
  ("What is frequency?", "Frequency is impressions divided by reach. It tells you how many times, on average, each person saw your post or ad."),
 ],
 'related': ['reach', 'engagement-rate', 'click-through-rate', 'analytics', 'video-views'],
},
{
 'slug': 'influencer',
 'short': 'An influencer is a person who has built a trusted following online and can shape what that audience thinks and buys.',
 'body': '''<h2>What is an influencer?</h2>
<p>An influencer is a person whose posts sway the choices of the people who follow them. They might share makeup tips, gaming streams, recipes, money advice or software reviews. What makes them an influencer is trust. When they say a product is good, their audience listens and often acts. Many influencers earn money from brand deals, while others post simply because they love the topic.</p>
<p>Influence comes from a mix of things: knowing a subject, posting often, being honest and having a voice people enjoy. Follower count is only one piece. A baker with a small, loyal following in one town can sell more cupcakes than a famous account with no link to baking.</p>
<h2>Types of influencers</h2>
<p>People usually sort influencers by the size of their following:</p>
<ul>
<li><b>Nano-influencers:</b> small, close-knit audiences, often local or tied to a hobby.</li>
<li><b>Micro-influencers:</b> a focused following in one niche with strong engagement.</li>
<li><b>Mid-tier influencers:</b> a larger audience that still feels personal.</li>
<li><b>Macro-influencers:</b> big audiences across many interests.</li>
<li><b>Celebrities:</b> famous people known outside social media.</li>
</ul>
<p>The exact cutoffs vary from one agency to the next, so treat these as rough groups. Smaller accounts often see higher engagement rates, since their followers feel closer to them. Bigger accounts reach more people with each post. Which one suits you depends on the goal. A local cafe opening a second shop may want a few nano accounts in that part of town. A brand launching across a whole country may want reach first and mix in larger names.</p>
<figure data-chart="1"></figure>
<h2>Influencer vs content creator</h2>
<p>The two words overlap a lot. A content creator is anyone who makes content, whether or not they have a big audience or sell anything. An influencer is defined by the effect they have on an audience. Many people are both. Some creators dislike the word influencer and prefer to be called creators, so check how someone describes themselves before you write to them.</p>
<figure data-chart="2"></figure>
<h2>How influencers make money</h2>
<ul>
<li>Paid posts and videos for brands.</li>
<li>Affiliate links and discount codes that pay a cut of each sale.</li>
<li>Ad revenue or creator programs run by the platform.</li>
<li>Their own products, courses or merch.</li>
<li>Fan support like subscriptions, tips and paid communities.</li>
</ul>
<p>Most full-time influencers mix several of these, so one slow month in brand deals doesn't sink them. For a brand, this matters when you plan a deal. A creator who earns mostly from affiliate links may be happy with a commission, while one who earns mostly from paid posts will expect a set fee up front.</p>
<h2>How to pick the right influencer</h2>
<figure data-chart="3"></figure>
<p>Start with your customer, then work backward. Ask a few customers who they follow for ideas in your space, or look at who already tags your brand. Then check each person's recent posts. Read the comments, since real questions and stories mean real fans, while piles of one-word replies from random accounts can be a warning sign. Look at how they handle sponsored posts. If every post is an ad, their audience may have stopped listening.</p>
<p>Here is a made-up example. A small hiking gear brand picks a trail guide with a modest following who answers every question about boots. Her post about the brand's socks brings in more sales than a bigger travel account the brand tried earlier, because her followers buy what she recommends.</p>
<h2>Disclosure and trust</h2>
<p>When an influencer is paid or gets free products, rules in many countries say they must make that clear. Most platforms offer a paid partnership label for this. Brands should put disclosure in the contract, since hiding a paid post can hurt both sides and may break the law. Being open also protects the trust that made the influencer worth working with in the first place.</p>
<h2>Common mistakes</h2>
<ul>
<li>Choosing by follower count alone and ignoring who the followers are.</li>
<li>Skipping a look at past sponsored posts and how the audience reacted.</li>
<li>Sending a script so tight the post sounds like an ad.</li>
<li>Expecting one post to change everything, when repeat work tends to build more trust.</li>
<li>Forgetting to agree on who can reuse the content, and for how long.</li>
</ul>
<p>Treat an influencer like a partner who knows their audience better than you do. Share the key facts, agree on the basics in writing, then let them speak in their own voice. Their followers can tell the difference.</p>''',
 'charts': [
  {'type': 'columns', 'title': 'Engagement rate by account size', 'sub': 'A common pattern: smaller accounts, closer fans', 'example': True, 'unit': 'Engagement rate',
   'rows': [('Nano', 6.1, '6.1%'), ('Micro', 4.3, '4.3%'), ('Mid-tier', 2.8, '2.8%'), ('Macro', 1.9, '1.9%'), ('Celebrity', 1.2, '1.2%')], 'highlight': 'Nano', 'labels': 'all',
   'note': 'Made-up numbers to show the shape. Real rates vary widely by niche and network.'},
  {'type': 'versus', 'title': 'Influencer vs content creator', 'cols': ('Influencer', 'Content creator'),
   'rows': [('Defined by', 'Effect on an audience', 'Making content'), ('Needs a big following', 'Not always', False), ('Often does brand deals', True, 'Sometimes'), ('Can be the same person', True, True)]},
  {'type': 'steps', 'title': 'Pick the right influencer',
   'steps': [('Know your customer', 'Write down who you want to reach and what they care about.'),
             ('Find who they follow', 'Ask customers and check who already tags you.'),
             ('Check fit', 'Read recent posts for tone, values and topic.'),
             ('Read the comments', 'Real questions and stories mean real fans.'),
             ('Ask for audience data', 'Location, age and past results, before you agree to anything.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See comments and mentions in one place, including when creators tag your brand.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Check an influencer\'s engagement rate from their public numbers.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Give each influencer a tagged link so you can see the visits they send.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for tracking the creators you contact and how each deal went.'},
 ],
 'faqs': [
  ("How do influencers make money?", "Common ways include paid posts for brands, affiliate links, ad revenue from the platform, selling their own products and fan support like subscriptions or tips."),
  ("How many followers do you need to be an influencer?", "There is no official number. What counts is whether your audience trusts you and acts on what you share. Small accounts can be very influential in a tight niche."),
  ("Do influencers have to say a post is sponsored?", "In many countries, yes. Laws and platform rules generally require paid or gifted posts to be clearly marked, often with a paid partnership label or a tag like #ad."),
  ("How do I spot fake followers?", "Look for sudden jumps in followers, lots of empty accounts and comments that don't relate to the post. A low engagement rate on a big account can also be a warning sign."),
 ],
 'related': ['influencer-marketing', 'micro-influencer', 'nano-influencer', 'content-creator', 'key-opinion-leader'],
},
]

TERMS += [
{
 'slug': 'influencer-marketing',
 'short': "Influencer marketing is when a brand works with online creators to promote a product or message to the creator's audience.",
 'body': '''<h2>What is influencer marketing?</h2>
<p>Influencer marketing is a partnership between a brand and an online creator. The brand pays the creator, sends free products or shares sales, and the creator presents the brand to their followers in their own style. It works because people tend to trust a person they follow more than they trust an ad. Done well, a sponsored post feels like a tip from a friend who knows the topic.</p>
<p>It can be as small as a local bakery sending a box of pastries to a food blogger in town, or as big as a months-long campaign with dozens of creators across several networks. The basic steps stay the same at any size.</p>
<h2>How influencer marketing works</h2>
<figure data-chart="1"></figure>
<p>Each step has a few details that make or break the deal. When you reach out, keep the first message short and personal. Mention a post of theirs you liked and say in a sentence or two what you have in mind. When you agree on terms, write down what will be posted, on which networks, by what date, what you will pay, who can reuse the content and how the post will be labeled as paid. When you share a brief, give the key facts and any must-say points, then leave room for the creator's own voice.</p>
<h2>Common types of deals</h2>
<ul>
<li><b>Gifted product:</b> you send something free and hope they post, with no promise either way.</li>
<li><b>Paid post:</b> a set fee for an agreed post, video or Story set.</li>
<li><b>Affiliate:</b> the creator earns a cut of each sale made through their link or code.</li>
<li><b>Ambassador:</b> a longer deal where the creator promotes you over several months.</li>
<li><b>Takeover:</b> the creator runs your account for a day.</li>
<li><b>Whitelisting:</b> you run ads through the creator's account with their permission.</li>
</ul>
<p>Small brands often start with gifts and affiliate deals, since they cost little up front. As you learn which creators bring results, you can move the best ones to paid or ambassador deals.</p>
<h2>How to measure results</h2>
<p>Give each creator a unique discount code or a link with UTM tags, so you can see which sales and visits came from whom. Then follow the path from their post to your checkout.</p>
<figure data-chart="2"></figure>
<p>Watch engagement on their posts, new followers on your own account and the questions people leave in the comments. For sales, compare what you spent with what you earned. That is your return on investment, or ROI.</p>
<figure data-chart="3"></figure>
<p>Some value is harder to count. A creator's video might bring few sales this week but give you great footage to reuse in ads, or put your brand in front of people who buy months later. Note these wins too, so you don't judge a campaign on one number.</p>
<h2>A made-up example</h2>
<p>A small skincare brand wants more first orders. It picks six micro creators who post about sensitive skin, sends each a starter kit and offers a commission on sales through a personal code. Two creators bring most of the orders. The brand moves those two to a paid ambassador deal for the next few months and thanks the others with a second gift. The next round copies what the best posts had in common: real before and after shots and an honest note about what the product can't do.</p>
<h2>Common mistakes</h2>
<ul>
<li>Picking creators by follower count alone, when some large accounts have little real engagement.</li>
<li>Writing a script so tight the post sounds like an ad.</li>
<li>Forgetting to agree on who can reuse the content and for how long.</li>
<li>Skipping disclosure, which can break the law in many places and costs trust.</li>
<li>Running one post and giving up. Repeated work with the same creators often builds more trust.</li>
<li>Paying late. Creators talk to each other, and a brand that pays on time gets better partners.</li>
</ul>
<h2>Tips for a better campaign</h2>
<p>Look at who already tags your brand before you go looking for strangers. Those people like you already, and their posts will sound real. Ask creators what has worked with their audience before, since they know their followers best. Keep a simple sheet with each creator, the deal, the dates and the results, so your next campaign starts from facts instead of guesses. And say thank you in public when a post does well. Other creators notice brands that treat partners kindly.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Run an influencer campaign',
   'steps': [('Set a goal', 'Awareness, sign-ups, sales or content you can reuse.'),
             ('Find creators', 'Search your niche and check who already tags you.'),
             ('Agree in writing', 'Posts, dates, pay, reuse rights and disclosure.'),
             ('Share a brief', 'Key facts and must-say points, with room for their voice.'),
             ('Review and measure', 'Check facts and labels, then track codes and links.')]},
  {'type': 'funnel', 'title': 'From a creator post to sales', 'sub': 'One creator, one week, tracked with a personal code', 'example': True, 'unit': 'Count',
   'stages': [('Post views', 18000, '18,000'), ('Link clicks', 540, '540'), ('Orders with the code', 38, '38')],
   'note': 'Made-up numbers to show how to follow one creator\'s results.'},
  {'type': 'formula', 'title': 'Return on investment', 'formula': 'ROI = (revenue - cost) ÷ cost × 100',
   'note': 'Made-up numbers to show the math. Count product, fees and your time in the cost.', 'result': '150%',
   'example': [('Revenue from codes', '3,000'), ('Total cost', '1,200')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Watch your own reach and follower growth while a campaign runs.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Make a tagged link for each creator so you can see the visits they send.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Check a creator\'s engagement rate before you reach out.'},
  {'name': 'Bitly', 'url': 'https://bitly.com/', 'domain': 'bitly.com', 'line': 'A link shortener that turns long tagged links into short ones creators can share.'},
 ],
 'list': 'social-media-tools-for-agencies',
 'faqs': [
  ("Does influencer marketing work for small businesses?", "Yes. Small businesses often do well with nano and micro creators who have local or niche audiences and are open to gifted or affiliate deals."),
  ("How do you find influencers?", "Search hashtags in your niche, check who your customers follow, look at who already tags your brand or use an influencer search tool."),
  ("How do you measure influencer marketing?", "Use unique discount codes and tracked links, then look at clicks, sales, sign-ups and engagement on each creator's posts compared with what you spent."),
  ("Do I need a contract with an influencer?", "It is a good idea. A written agreement should cover what will be posted, when, payment, disclosure and whether you can reuse the content."),
  ("What is whitelisting?", "Whitelisting is when a creator lets a brand run ads through the creator's account. The ad shows the creator's name, which can feel more personal than a brand ad."),
 ],
 'related': ['influencer', 'sponsored-content', 'affiliate-marketing', 'ambassador-program', 'whitelisting'],
},
{
 'slug': 'instagram',
 'short': 'Instagram is a photo and video sharing app owned by Meta where people post to a feed, share Stories, make Reels and send messages.',
 'body': '''<h2>What is Instagram?</h2>
<p>Instagram is a photo and video app owned by Meta. It started as a place to share square photos with filters and grew into a home for short video, shopping, messaging and quick updates. People use it to follow friends, creators and brands they like. Businesses use it to show products, answer questions and find new customers.</p>
<p>Most time on Instagram is spent on a phone. That shapes everything you post: vertical video, big readable text and captions that get to the point fast.</p>
<h2>Main ways to post on Instagram</h2>
<ul>
<li><b>Feed posts:</b> single photos or videos that live on your profile grid.</li>
<li><b>Carousels:</b> several photos or videos in one post that people swipe through.</li>
<li><b>Reels:</b> short vertical videos that can reach people who don't follow you.</li>
<li><b>Stories:</b> full-screen posts that drop out of view after a day unless saved to Highlights.</li>
<li><b>Live:</b> real-time video where viewers can comment.</li>
<li><b>Notes and DMs:</b> short updates and private messages in the inbox.</li>
</ul>
<p>Captions can be up to 2,200 characters, which is plenty of room for a story or a how-to. Web addresses in feed captions don't turn into clickable links, which is why so many accounts point people to the link in their bio.</p>
<figure data-chart="1"></figure>
<h2>How Instagram decides what people see</h2>
<p>Instagram doesn't show posts in plain time order. It looks at signals like how often someone interacts with you, what kinds of posts they usually stop on and how other people react to your post. The feed leans toward accounts people already follow. Reels and the Explore page lean toward accounts they don't follow yet, which is why Reels are often the main way new people find you.</p>
<p>The exact rules change often and aren't public. What stays steady is that posts people watch, save, share and talk about tend to travel further. Posting tricks come and go. Making something your followers want to send to a friend keeps working.</p>
<p>Search matters more than many people think. People type topics into Instagram's search bar the way they would on Google, so clear words in your caption, your name field and your on-screen text help the right people find you.</p>
<h2>Personal vs professional accounts</h2>
<p>A personal account is fine for friends and family. A professional account, either creator or business, adds Instagram Insights, contact buttons and ad tools. It also lets you connect approved scheduling and management apps. Switching is free and takes a minute in settings.</p>
<figure data-chart="2"></figure>
<p>Choose between the two professional types by what you are. A business account suits shops, restaurants, agencies and other companies, and it leans toward contact buttons and shopping. A creator account suits people who make content or are public figures, and it leans toward tools for working with brands. You can switch between them later, so don't worry about picking wrong.</p>
<h2>How to grow on Instagram</h2>
<ol>
<li><b>Pick a clear niche</b> so people know what to expect when they follow.</li>
<li><b>Write a bio</b> that says who you help and what to do next.</li>
<li><b>Use Reels for reach</b> and carousels for saves.</li>
<li><b>Use Stories to talk</b> with the followers you already have, with polls and questions.</li>
<li><b>Reply to comments and DMs</b> quickly, especially in the first hour after a post.</li>
<li><b>Check Insights each month</b> and repeat what worked.</li>
</ol>
<p>A good habit is to plan a simple mix each week. For example, a made-up flower shop might post a few Reels showing bouquets being made, a carousel on caring for cut flowers and daily Stories from the shop floor. Over a few months, its Insights show where new followers come from, and the shop leans into that format.</p>
<figure data-chart="3"></figure>
<h2>Measuring what works</h2>
<p>Instagram Insights shows reach, views, likes, comments, shares, saves, profile visits and follower changes. Pick the numbers that match your goal. For awareness, watch reach and new followers. For useful content, watch saves and shares. For sales, add tracked links to your bio and Stories and check your website analytics for visits and orders.</p>
<p>Look at monthly averages for each format. A single post can surprise you in either direction, while a month of posts shows the real pattern.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting only when you remember, which makes it hard for people to get to know you.</li>
<li>Leaning on one format and missing the reach that others bring.</li>
<li>Treating every post as an ad. Mix helpful and personal posts with the ones that sell.</li>
<li>Uploading videos with another app's watermark, which looks careless.</li>
<li>Ignoring DMs, where many customers ask their first question.</li>
</ul>''',
 'charts': [
  {'type': 'bars', 'title': 'Instagram caption room next to other networks', 'sub': 'Post text limits', 'unit': 'Characters',
   'rows': [('LinkedIn', 3000, '3,000'), ('Instagram', 2200, '2,200'), ('TikTok', 2200, '2,200'), ('Discord', 2000, '2,000'), ('Google Business Profile', 1500, '1,500'), ('Threads', 500, '500'), ('X', 280, '280')], 'highlight': 'Instagram',
   'note': "Limits used by Capybaroar's composer, November 2026."},
  {'type': 'versus', 'title': 'Personal vs professional account', 'cols': ('Personal', 'Professional'),
   'rows': [('Instagram Insights', False, True), ('Contact buttons', False, True), ('Run ads', False, True), ('Connect scheduling apps', False, True), ('Free to use', True, True)]},
  {'type': 'stack', 'title': 'Where new followers found one account', 'sub': 'One month, by first place they saw the account', 'example': True,
   'parts': [('Reels', 50), ('Explore and search', 20), ('Tags and mentions', 18), ('Shares from friends', 12)],
   'note': 'Made-up numbers for one account.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Instagram scheduler', 'url': '/instagram-post-scheduler', 'line': 'Plan and schedule Instagram posts in a calendar, with previews and a first comment.'},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Find the right image and video sizes for feed posts.'},
  {'name': 'Instagram fonts', 'url': '/tools/instagram-fonts', 'line': 'Style text for your bio or captions with copy and paste fonts.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design app for making carousels, covers and graphics.'},
 ],
 'list': 'instagram-post-schedulers',
 'faqs': [
  ("Is Instagram free?", "Yes. Creating an account and posting is free. You only pay if you choose to run ads or buy optional extras."),
  ("What is the Instagram caption limit?", "An Instagram caption can be up to 2,200 characters, including spaces, hashtags and emoji."),
  ("Should I use a business or creator account?", "Both are professional accounts with Insights. A business account suits shops and companies, while a creator account suits public figures and people who make content."),
  ("Can I schedule Instagram posts?", "Yes. Professional accounts can schedule posts inside Instagram or through approved third-party scheduling apps."),
  ("Why can't I add links to Instagram captions?", "Instagram doesn't make web addresses in feed captions clickable. Use the link in your bio, or a link sticker in Stories."),
 ],
 'related': ['instagram-reels', 'instagram-stories', 'carousel-post', 'instagram-insights', 'business-account'],
},
{
 'slug': 'instagram-close-friends',
 'short': 'Instagram Close Friends is a private list you choose so that only those people can see certain Stories and other content you share.',
 'body': '''<h2>What is Instagram Close Friends?</h2>
<p>Close Friends is a list you build inside Instagram. When you post a Story, you can share it with everyone who can see your account or only with the people on that list. It gives you a smaller, more personal room inside the same app. Stories shared this way carry a green marker, so viewers know they are part of a select group.</p>
<p>People use it for all sorts of reasons. Some share silly everyday moments with real friends. Creators use it as a perk for loyal fans. Small brands use it to give their best customers a first look at something new.</p>
<h2>How Close Friends works</h2>
<p>You add or remove people from the list at any time. Instagram doesn't send people a notice when you change the list. The only clue is the green marker they see on Stories you share with it. You can also share some other content, such as Notes, with Close Friends only. The list is yours alone, and nobody else can see who is on it.</p>
<p>A Close Friends Story behaves like any other Story. It drops out of view after a day, replies go to your DMs and you can see who viewed it while it is live. The only change is who gets to see it.</p>
<p>You can still save a Close Friends Story to a Highlight. Check who can see that Highlight afterward, since you don't want a members-only code showing to everyone who visits your profile. When in doubt, keep perks out of Highlights and share them fresh each time.</p>
<figure data-chart="1"></figure>
<h2>How to set up Close Friends</h2>
<figure data-chart="2"></figure>
<p>Start small. A list of people who truly fit feels more special than one that holds half your followers. If you use it for business, decide on a rule for who gets in before you start, such as customers who bought more than once or members of a paid club. Write the rule down so anyone on your team who manages the account follows it too.</p>
<p>Tell people how to join in your public Stories now and then. A short line like "Reply JOIN to get early looks at new drops" lets interested followers raise their hand. Then add them by hand, which takes a minute and makes each person feel picked.</p>
<h2>Ways creators and brands use it</h2>
<ul>
<li>Early looks at new products for loyal customers.</li>
<li>Special discount codes as a thank-you to top fans.</li>
<li>A perk for people in a paid community or club.</li>
<li>Casual, behind-the-scenes clips that wouldn't suit the main feed.</li>
<li>Asking a trusted group for feedback before you share an idea with everyone.</li>
</ul>
<p>Here is a made-up example. A sneaker shop invites repeat buyers to its Close Friends list. Each time a new pair is coming, it shares a sneak peek and a short early-access window with that group first. Those customers feel looked after, and the shop gets honest early feedback on which colors people want.</p>
<p>Because the list feels exclusive, people often pay more attention to Close Friends Stories. Be fair about how people get on it. Share a simple way to join, like a sign-up form, a purchase or a reply to a Story, so nobody feels shut out for no reason.</p>
<h2>How to measure it</h2>
<p>Close Friends lists are often small, so judge them by quality over size. Watch how many people on the list view each Story, how many reply and how many use the codes or links you share there. Compare those numbers with your public Stories. If the private group replies far more often, it is working as a closer channel.</p>
<figure data-chart="3"></figure>
<p>If the numbers look the same as your public Stories, the list may be too big or the content too similar to what everyone else sees. Trim the list or give it something truly extra.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting to the wrong audience. Always check which option is selected before you tap share.</li>
<li>Thinking private means secret. Anyone on the list can take a screenshot and pass it on.</li>
<li>Letting the list grow until it stops feeling special.</li>
<li>Forgetting to remove people who no longer fit, like past staff or old partners.</li>
</ul>
<p>A quick rule helps: only share something with Close Friends that you would be fine seeing on the main feed one day.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Close Friends vs all followers', 'cols': ('Close Friends', 'All followers'),
   'rows': [('Who sees it', 'People on your list', 'Anyone who can see your account'), ('Green marker on the Story', True, False), ('Replies go to DMs', True, True),
            ('Fades after a day', True, True), ('Good for perks and early looks', True, False)]},
  {'type': 'steps', 'title': 'Set up Close Friends',
   'steps': [('Open the list', 'Find Close Friends in your profile menu.'),
             ('Add people', 'Search for followers and tap to add them.'),
             ('Pick it when you post', 'Choose Close Friends before you share a Story.'),
             ('Review often', 'Remove anyone who no longer fits.')]},
  {'type': 'columns', 'title': 'Replies per 100 viewers', 'sub': 'Close Friends Stories next to public Stories', 'example': True, 'unit': 'Replies per 100 viewers',
   'rows': [('Public Stories', 1.2, '1.2'), ('Close Friends Stories', 6.5, '6.5')], 'highlight': 'Close Friends Stories', 'labels': 'all',
   'note': 'Made-up numbers for one small shop.'},
 ],
 'tools': [
  {'name': 'Instagram story size', 'url': '/tools/instagram-story-size', 'line': 'Get the right size for Story photos and videos.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design app for making Story frames for your early looks and offers.'},
 ],
 'faqs': [
  ("Does someone know if I add or remove them from Close Friends?", "Instagram doesn't send a notice when you change the list. People on it see a green marker on Stories you share with Close Friends."),
  ("Can people see who else is on my Close Friends list?", "No. Only you can see the full list."),
  ("Can business accounts use Close Friends?", "Close Friends is a standard Stories feature, and many professional accounts use it for loyal customers. Check your own app, since features can vary by account and region."),
  ("How many people can be on Close Friends?", "You can add as many as you like, but a smaller list keeps it feeling special and makes the content more personal."),
 ],
 'related': ['instagram-stories', 'instagram', 'highlights', 'story', 'instagram-notes'],
},
{
 'slug': 'instagram-insights',
 'short': 'Instagram Insights is the built-in analytics area for professional Instagram accounts that shows how your content performs and who follows you.',
 'body': '''<h2>What is Instagram Insights?</h2>
<p>Instagram Insights is the free stats area inside the Instagram app. It shows how many people saw your content, what they did with it and who your followers are. You only get it with a professional account, either creator or business. Personal accounts don't see these numbers.</p>
<p>Insights answers simple questions that are hard to guess: which posts people saved, what time your followers are online and whether your account grew or shrank last month.</p>
<h2>What Insights shows you</h2>
<ul>
<li><b>Account overview:</b> accounts reached, accounts engaged and follower changes over a date range.</li>
<li><b>Content results:</b> views, likes, comments, shares and saves for each post, Reel and Story.</li>
<li><b>Actions:</b> profile visits, link taps and button taps like call or email.</li>
<li><b>Audience:</b> where followers live, their age range, gender split and the hours they are most active.</li>
<li><b>Reels details:</b> plays, watch time and how many people watched to the end, where the app shows it.</li>
</ul>
<p>The exact names of metrics change from time to time as Instagram updates the app, so expect labels to shift. What a number means matters more than what it is called this year.</p>
<p>To find Insights, open your profile and look for the professional dashboard or the insights button. You can also tap any single post to see its own numbers. The account view is best for trends. The post view is best for checking why one post did well or badly.</p>
<h2>How to read your Insights</h2>
<p>Raw numbers are hard to compare because every post reaches a different number of people. Turn them into rates. The most useful one is engagement rate by reach, which shows how people who saw a post reacted to it.</p>
<figure data-chart="1"></figure>
<p>Next, group your posts by format and topic. You may find that one kind of post reaches far more people, while another earns the saves and shares that bring people back. Both are useful. They just do different jobs.</p>
<p>In the made-up numbers below, Reels reach the most accounts by far. That doesn't mean you should post only Reels. If carousels bring more saves and link taps, they may matter more for sales, even with smaller reach.</p>
<figure data-chart="2"></figure>
<h2>How to review Insights each month</h2>
<figure data-chart="3"></figure>
<p>Here is a made-up example. A home cook reviews her month and sees that recipe carousels earned the most saves, while Reels of the finished dish reached the most new people. She plans a Reel for each new recipe that points to a carousel with the full steps, so the two formats work together. A month later she checks again to see if the pairing lifted both numbers.</p>
<h2>Metrics worth watching</h2>
<p>Reach shows how far a post traveled. Saves and shares hint that people found it worth keeping or passing on. Profile visits and link taps show interest in you beyond a single post. Follower changes show whether new people are sticking around. For Reels, watch time and the share of people who watch to the end tell you whether your hook and pacing hold attention.</p>
<p>Pick a small set that matches your goal. If you want sales, link taps matter more than likes. If you want a bigger audience, reach and new followers come first. If you want people to trust you as an expert, saves and shares carry the most weight.</p>
<h2>Limits to know</h2>
<ul>
<li>Insights only covers Instagram, so you can't compare it side by side with other networks there.</li>
<li>It keeps data for a limited time, so export or note your numbers each month if you want long-term trends.</li>
<li>It can't see what people do after they leave the app. Use UTM links and your website analytics for that part.</li>
<li>Posts made before you switched to a professional account usually lack full stats.</li>
<li>Audience details only show once you have enough followers.</li>
</ul>
<h2>Common mistakes</h2>
<p>Many people open Insights only after a bad week and make big changes based on a few posts. Look at a full month instead. Another mistake is comparing a Reel's views with a photo's reach as if they were the same number. Compare like with like, and track your own averages over time. Finally, don't let numbers alone pick your topics. If a post with modest reach brought in three paying customers, it did its job.</p>''',
 'charts': [
  {'type': 'formula', 'title': 'Engagement rate by reach', 'formula': 'Engagement rate = (likes + comments + shares + saves) ÷ accounts reached × 100',
   'note': 'Made-up numbers to show the math.', 'result': '6%',
   'example': [('Engagements', '360'), ('Accounts reached', '6,000')]},
  {'type': 'columns', 'title': 'Average reach by format', 'sub': 'One account, averaged over a month', 'example': True, 'unit': 'Accounts reached',
   'rows': [('Reels', 5400, '5,400'), ('Carousels', 3100, '3,100'), ('Single photos', 1800, '1,800'), ('Stories', 900, '900')], 'highlight': 'Reels', 'labels': 'all',
   'note': 'Made-up numbers for one account. Your mix will differ.'},
  {'type': 'steps', 'title': 'A monthly Insights review',
   'steps': [('Pick the date range', 'Look at the last full month.'),
             ('Sort by your goal', 'Reach for awareness, saves for useful posts, link taps for sales.'),
             ('Find patterns', 'Note the format, topic and time of your top posts.'),
             ('Check your audience hours', 'See when followers are most active.'),
             ('Plan the next month', 'Do more of what worked and test one new idea.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See Instagram results next to your other channels, with your best times to post.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Turn your Insights numbers into an engagement rate by reach or followers.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Pick posting times to test against the active hours in your Insights.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for keeping monthly numbers after Insights stops showing them.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ("Is Instagram Insights free?", "Yes. Insights is free for every professional account, creator or business."),
  ("Why can't I see Insights on my account?", "Insights only works on professional accounts. Switch from a personal account to a creator or business account in your settings."),
  ("Can I see Insights for posts made before I switched?", "Usually only content posted after you switched to a professional account has full Insights."),
  ("Can I see who viewed my profile?", "No. Insights shows the number of profile visits you got. It doesn't list the people who made them."),
  ("How far back does Instagram Insights go?", "Insights keeps data for a limited window that Instagram sets. Note or export your numbers each month if you want a long record."),
 ],
 'related': ['analytics', 'instagram', 'business-account', 'reach', 'engagement-rate'],
},
{
 'slug': 'instagram-notes',
 'short': 'Instagram Notes are short text updates that show above the inbox for people you choose and fade from view after a day.',
 'body': '''<h2>What are Instagram Notes?</h2>
<p>Instagram Notes are tiny status updates. You type a quick thought, and it shows in a small bubble above your profile picture at the top of other people's message inbox. They are meant to be short and casual. Think of a sticky note on your door that says what you are up to today.</p>
<p>Notes don't show in the feed, on your grid or in Stories. They live in the inbox, which makes them feel more like the start of a chat than a post.</p>
<h2>How Notes work</h2>
<p>You choose who can see your Note, usually followers you follow back or your Close Friends list. A Note can hold a short line of text and, in many places, a song clip or other extras the app adds over time. When someone replies, the reply lands in your DMs as a private message. Notes fade from view after about a day, so they suit what is happening right now.</p>
<p>Only one Note shows at a time. Post a new one and it replaces the last.</p>
<p>Notes only reach people who already have some link to you, such as followers you follow back. That makes them a poor way to find new people and a good way to stay close to the ones you have. Think of them as a friendly wave to regulars.</p>
<h2>How to post a Note</h2>
<figure data-chart="1"></figure>
<p>Keep it short enough to read at a glance. The bubble is small, and longer text gets hard to follow. A Note that asks a simple question usually gets more replies than one that just states a fact, because it gives people an easy reason to tap.</p>
<h2>How brands and creators use Notes</h2>
<p>Because Notes sit at the top of the inbox, they are a low-effort way to nudge people who already know you. Here are some made-up ideas:</p>
<ul>
<li>"New video up, tell me what you think."</li>
<li>"Shop open until 8 tonight."</li>
<li>"Red or green for the winter mugs?"</li>
<li>"Going live at 6 with a Q and A."</li>
<li>"Back from the market with fresh plums."</li>
</ul>
<p>Replies start a private chat, so Notes can open more one-on-one talks than a public post would. A made-up bakery posts "Last dozen croissants, who wants them?" and gets several replies within minutes, each one a customer it can answer by name.</p>
<p>Keep the tone friendly and human. A Note that reads like an ad feels out of place in someone's messages.</p>
<h2>Notes vs Stories</h2>
<p>Both are short-lived. Stories are full-screen photos and video with stickers and links, and they show at the top of the home feed. Notes are a line of text in the inbox. Use Stories when you have something to show. Use Notes when a few words are enough and you want a chat.</p>
<figure data-chart="2"></figure>
<p>The two work well together. Post a Story about a new product, then a Note that asks people which color they like best. The Story shows the item, and the Note starts the talk.</p>
<h2>How to tell if Notes help</h2>
<p>Notes don't come with a full stats page the way posts do. The simplest test is your inbox. Count how many replies each Note gets and how many of those chats turn into something useful, like a question answered, a booking or a sale. Try different kinds of Notes over a few weeks. Questions, updates and small offers each draw different responses, and you will soon see which style your followers answer.</p>
<p>Timing matters too. A Note posted when your followers are usually online has more hours in front of them before it fades. Check the active hours in your Instagram Insights and post your Notes around those times. Then keep an eye on your inbox, since quick replies keep the chat going.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting a sales pitch that feels pushy in a personal space.</li>
<li>Forgetting to check who can see the Note before you share it.</li>
<li>Leaving replies unanswered, which wastes the whole point of a Note.</li>
<li>Posting too often, so your bubble starts to feel like noise.</li>
</ul>
<p>A Note works best when you have time to reply. Post one when you can sit with your inbox for a while, and treat each reply as a small chance to talk with a real person.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Post a Note',
   'steps': [('Open your inbox', 'Go to your messages.'),
             ('Tap the bubble', 'It sits above your profile picture at the top.'),
             ('Write a line', 'Type a short thought or question, or add a song.'),
             ('Choose who sees it', 'Followers you follow back or Close Friends.'),
             ('Share and reply', 'Answer the DMs that come in while it is up.')]},
  {'type': 'versus', 'title': 'Notes vs Stories', 'cols': ('Notes', 'Stories'),
   'rows': [('Where it shows', 'Top of the inbox', 'Top of the home feed'), ('Photos and video', False, True), ('Links and stickers', False, True),
            ('Replies go to DMs', True, True), ('Fades after about a day', True, True)]},
 ],
 'tools': [
  {'name': 'Emoji copy and paste', 'url': '/tools/emoji-copy-paste', 'line': 'Find and copy emoji to add a little color to a short Note.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Check the length of a line before you post it.'},
 ],
 'faqs': [
  ("Who can see my Instagram Note?", "You choose. Most people share Notes with followers they follow back or with their Close Friends list."),
  ("How long do Instagram Notes last?", "Notes fade from view after about a day. You can delete one sooner if you change your mind."),
  ("Where do replies to Notes go?", "Replies arrive in your direct messages as a private conversation with that person."),
  ("Can I post more than one Note at a time?", "No. Only one Note shows at a time, and a new one replaces the last."),
 ],
 'related': ['instagram', 'direct-message', 'instagram-close-friends', 'instagram-stories'],
},
]
