# Upgraded glossary terms, batch 6.
TERMS = []

TERMS += [
{
 'slug': 'pin',
 'short': 'A pin is a post on Pinterest: an image or video with a title, description and link that people save to boards to keep ideas for later.',
 'body': '''<h2>What is a pin?</h2>
<p>A pin is the basic unit of Pinterest. It is a picture or a short video, usually with a title, a description and a link to a web page. People find pins through search or their home feed, then save the ones they like to boards, which work like folders of ideas. A recipe, a living room photo, a workout plan and a product page can all become pins.</p>
<p>The word works as a verb too. To pin something means to save it to one of your boards, either from Pinterest itself or from a website with a save button.</p>
<h2>How pins get found</h2>
<p>Pinterest behaves a lot like a visual search engine. People type what they want, such as "small balcony ideas", and Pinterest shows pins that match. It reads your title, description, board name, the text on your image and the page you link to, then decides which searches your pin fits.</p>
<p>A pin can be found in several places:</p>
<ul>
<li><b>Search results</b> for the words people type.</li>
<li><b>The home feed</b>, which mixes pins based on what each person has searched and saved.</li>
<li><b>Related pins</b> shown under a pin someone opened.</li>
<li><b>Other people's boards</b>, once they save your pin there.</li>
</ul>
<p>People often plan far ahead on Pinterest. Someone may look for holiday baking ideas weeks before the holiday. That is why a good pin can keep earning views and clicks for months, long after a post on a fast feed has faded.</p>
<h2>Parts of a pin</h2>
<ul>
<li><b>Image or video:</b> tall pictures fit best, since Pinterest shows pins in narrow columns.</li>
<li><b>Title:</b> a short line with the words people would search for.</li>
<li><b>Description:</b> up to 500 characters that explain the idea and add more search words.</li>
<li><b>Link:</b> the page people land on when they tap through.</li>
<li><b>Board:</b> the collection you save it to, which also tells Pinterest what the pin is about.</li>
<li><b>Alt text:</b> a plain description of the image for people who use screen readers.</li>
</ul>
<p>Most pins are standard image pins. Video pins play a short clip in the feed. Some pins hold several images people swipe through. Product pins show price and stock details from a shop, and Rich Pins pull extra details from your website on their own. The options shift over time, so check the create screen to see what Pinterest offers today.</p>
<p>Whatever the type, the same rule holds. The image gets the first look, the words help Pinterest place the pin in search, and the link decides whether a visit turns into anything.</p>
<figure data-chart="1"></figure>
<h2>How to make a good pin, step by step</h2>
<ol>
<li><b>Pick one idea per pin.</b> "Five-minute oat breakfast" works better than "my morning routine and also some recipes".</li>
<li><b>Make a tall image.</b> Use a clear photo with good light and a short text overlay that says what the pin is about.</li>
<li><b>Write a searchable title.</b> Put the main words first, the way a person would type them.</li>
<li><b>Fill in the description.</b> Explain what people get, add a few related words and keep it natural.</li>
<li><b>Link to the exact page.</b> A home page link makes people hunt for the idea, and many give up.</li>
<li><b>Save it to a clear board.</b> A board called "Quick breakfast recipes" helps more than one called "Stuff".</li>
</ol>
<p>For example, a made-up bakery might pin a photo of sourdough with the overlay "Beginner sourdough in 3 steps", link it to the matching blog post and save it to a board named "Easy bread recipes".</p>
<h2>How to measure a pin</h2>
<p>With a business account, Pinterest analytics show how each pin does. The main numbers are impressions (how often it was shown), saves (how often people kept it) and outbound clicks (how often people went to your site). Each step loses some people, so it helps to look at them as a funnel.</p>
<figure data-chart="2"></figure>
<p>A pin with lots of impressions but few saves may have a weak image. A pin with many saves but few clicks may link to a page that does not match the promise. Fix the step where people drop off.</p>
<h2>Common mistakes</h2>
<ul>
<li>Using square or wide images that look small next to tall pins.</li>
<li>Leaving the description empty, which gives Pinterest less to match against searches.</li>
<li>Pinning once and stopping. Fresh pins for the same page, with new images, give it more chances to be found.</li>
<li>Judging a pin after one day. Pins often build slowly, so look at results over a few weeks.</li>
</ul>
<h2>Pin vs post</h2>
<p>A post on most apps fades from feeds within a day or two. A pin is built to be found through search and saved for later, so it can keep working long after you publish it.</p>
<figure data-chart="3"></figure>''',
 'charts': [
  {'type': 'bars', 'title': 'Text room on a pin', 'sub': 'Pinterest description compared with a few other networks', 'rows': [('Instagram caption', 2200, '2,200'), ('Pinterest description', 500, '500'), ('Threads', 500, '500'), ('X', 280, '280')],
   'highlight': 'Pinterest description', 'unit': 'Characters', 'note': "Limits used by Capybaroar's composer, November 2026."},
  {'type': 'funnel', 'title': 'From pin view to website visit', 'sub': 'One pin over its first month', 'example': True,
   'stages': [('Impressions', 20000, '20,000'), ('Pin opened', 1600, '1,600'), ('Saves', 480, '480'), ('Outbound clicks', 240, '240')],
   'unit': 'People or views', 'note': 'Made-up numbers to show where people drop off.'},
  {'type': 'versus', 'title': 'Pin vs regular feed post', 'cols': ['Pin', 'Feed post'],
   'rows': [('Found mostly through search', True, False), ('Built to be saved for later', True, 'Sometimes'), ('Link on the post itself', True, 'Depends on the app'), ('Usual life in feeds', 'Months', 'A day or two'), ('Best image shape', 'Tall', 'Varies by app')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Pinterest scheduler', 'url': '/pinterest-pin-scheduler', 'line': 'Plan pins on a calendar with their title, description, link and board, and see a preview before they go out.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter checks that a pin description fits in 500 characters.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for making tall pin images with text overlays.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags pin links so your website analytics can show visits from Pinterest.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('What does it mean to pin something?', 'To pin something means to save an image or video to one of your Pinterest boards. You can pin from Pinterest itself or from a website that has a save button.'),
  ('How long can a Pinterest pin description be?', 'A pin description can be up to 500 characters. Put the most important words near the start.'),
  ('How do I see how many saves my pin has?', 'Open Pinterest analytics on a business account to see impressions, saves and clicks for each pin. Compare them to learn which ideas people want to keep.'),
  ('How do I add a link to a pin?', 'When you create a pin, paste the web address into the link field. People who tap the pin can then visit that page.'),
  ('Why does my pin get views but no clicks?', 'The image may promise something the link does not deliver, or the pin may not say why people should visit. Make the overlay and title match the page, and link to the exact page.'),
 ],
 'related': ['pinterest', 'rich-pin', 'saves', 'evergreen-content', 'keyword'],
},
{
 'slug': 'pinned-post',
 'short': 'A pinned post is a post you fix to the top of your profile or a group so it stays the first thing visitors see, even after you publish newer posts.',
 'body': '''<h2>What is a pinned post?</h2>
<p>A pinned post is one you choose to keep at the top of your profile, page or group. Normally, the newest post shows first and older ones slide down. A pin breaks that order and holds one post, or a small set of posts, in the top spot until you unpin it.</p>
<p>Most major apps offer some form of pinning. You can pin posts on X, Threads, Bluesky and Mastodon profiles, pin posts in a Facebook group or on a page, pin a few posts or Reels to the top of an Instagram grid and pin videos on a TikTok profile. LinkedIn has a Featured section that does a similar job. Many apps also let you pin a comment under your own post, which is handy for adding a link or a correction.</p>
<p>Pinning changes nothing about the post itself. It keeps its likes, comments and date. Only its place on your profile changes.</p>
<h2>Why pinned posts matter</h2>
<p>New visitors decide fast whether to follow you. They look at your photo, your bio and the first post they see. Your pinned post is often that first post, so it works like a welcome sign. It can explain who you are, show your best work or point people to the one thing you want them to do.</p>
<p>A pinned post also keeps working without you. A regular post gets most of its views in its first day or so. A pinned post keeps meeting every new person who opens your profile, for as long as it stays up.</p>
<figure data-chart="1"></figure>
<h2>What to pin</h2>
<ul>
<li><b>An intro post</b> that says who you are and what you post about.</li>
<li><b>Your best performing post</b>, so newcomers see you at your strongest.</li>
<li><b>A current offer, launch or event</b>, with a clear date.</li>
<li><b>Rules or a welcome note</b> in a group or community.</li>
<li><b>An answer to the question people ask you most</b>, so you can point to it in replies.</li>
</ul>
<p>For example, a made-up yoga teacher might pin a short video that says "New here? Start with this 10-minute morning flow." It tells visitors what the account offers and gives them something to try right away.</p>
<h2>How to pin a post</h2>
<ol>
<li>Open your profile and find the post you want to keep on top.</li>
<li>Tap the menu on the post, usually three dots.</li>
<li>Choose the pin option. The wording can be "Pin to profile" or "Pin to your grid".</li>
<li>Check your profile to confirm the post now sits at the top.</li>
</ol>
<p>To remove it, open the same menu and choose unpin. The post then returns to its normal place by date. In groups, only admins or moderators can usually pin posts.</p>
<h2>How pinning differs by network</h2>
<p>The idea is the same everywhere, but the details vary. Some apps let you pin only one post, so pinning a new one replaces the old. Others, like the Instagram grid, let you pin a few. Some show a small pin icon on the post, while others just place it first. On LinkedIn you add posts, links or media to Featured instead of pinning. Check each app's post menu, since these options change over time.</p>
<h2>How to tell if your pinned post works</h2>
<p>Look at the pinned post's numbers in your analytics over a few weeks. If it holds a link, tag the link with UTM parameters so your website analytics can show how many visits it sends. Compare those visits with the ones from your bio link and your regular posts.</p>
<figure data-chart="2"></figure>
<p>If a pinned post gets few views or clicks, try a new hook, a clearer offer or a different post. Swap it, wait a couple of weeks and compare. Keep a short note of what you pinned and when, so you can see which pins did best over a year.</p>
<p>In a group, the signs are different. Fewer repeat questions and fewer posts that break the rules mean your pinned welcome note is being read.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Forgetting a pin.</b> An event that ended months ago, or a sale that has closed, makes your profile look out of date.</li>
<li><b>Pinning something only you care about.</b> A company award may matter less to a visitor than a clear "here is what we do".</li>
<li><b>Pinning a post with no next step.</b> Give people a link, a question or a reason to follow.</li>
<li><b>Using the same pin on every app.</b> What works on LinkedIn may feel stiff on TikTok.</li>
</ul>
<p>Set a reminder to review your pinned posts every few weeks and swap them when your goals change.</p>''',
 'charts': [
  {'type': 'line', 'title': 'Views on a pinned post vs a regular post', 'sub': 'Total views, days after posting', 'example': True,
   'points': [('Day 1', 900), ('Day 3', 1300), ('Day 7', 1800), ('Day 14', 2500), ('Day 21', 3100), ('Day 30', 3800)],
   'unit': 'Total views on the pinned post', 'note': 'Made-up numbers. A regular post often levels off after its first days, while a pinned post keeps adding views from profile visits.'},
  {'type': 'steps', 'title': 'Review your pinned post', 'steps': [
    ('Check the numbers', 'Look at its views and link clicks for the last few weeks.'),
    ('Check the date', 'Make sure any offer, event or price in it is still true.'),
    ('Pick a better option', 'Find a newer post that earned more saves, shares or clicks.'),
    ('Swap and wait', 'Pin the new post and compare results after a couple of weeks.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Find your best performing posts on each channel, so you know which one deserves the top spot.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags the link in a pinned post so you can count the visits it sends.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics that show visits from the tagged links in your pinned posts.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('Can other people see my pinned post?', 'Yes. A pinned post on a public profile shows at the top for anyone who visits. On a private account, only approved followers can see it.'),
  ('How many posts can I pin?', 'It depends on the app. Some let you pin one post, while others, like the Instagram grid, let you pin a few.'),
  ('Does pinning a post boost its reach?', 'Pinning keeps the post at the top of your profile, so visitors see it first. Over time, that steady spot can bring it more views.'),
  ('How often should I change my pinned post?', 'Review it every few weeks and change it when it goes out of date or a newer post does better. There is no fixed rule.'),
  ('Can I pin a post in a Facebook group?', 'Group admins and moderators can usually pin or feature posts so members see them first. Regular members often cannot.'),
 ],
 'related': ['profile', 'post', 'grid', 'bio', 'facebook-group'],
},
{
 'slug': 'pinterest',
 'short': 'Pinterest is a visual discovery app where people search for ideas, save images and videos called pins to boards, and click through to websites.',
 'body': '''<h2>What is Pinterest?</h2>
<p>Pinterest is a social app built around ideas. People use it to plan meals, decorate homes, find outfits, gather wedding ideas, learn crafts and shop. Each idea is a pin, and people save pins to boards so they can come back later. A board might be called "Garden plans" or "Easy dinners".</p>
<p>Pinterest feels less like a chat app and more like a search engine with pictures. People come with a goal in mind and look for ways to reach it. They follow accounts too, but many never talk to anyone. They search, save and click.</p>
<p>Personal and business accounts are free to create and use. You only pay if you choose to run ads to reach more people.</p>
<h2>How Pinterest works</h2>
<ul>
<li><b>Pins:</b> images or videos with a title, a description of up to 500 characters and often a link.</li>
<li><b>Boards:</b> collections where people save pins by theme. Boards can be public, secret or shared with others.</li>
<li><b>Search:</b> people type what they want and see matching pins, with suggested words to narrow it down.</li>
<li><b>Home feed:</b> a stream of pins picked for each person based on what they search and save.</li>
<li><b>Related pins:</b> more ideas shown under any pin someone opens.</li>
</ul>
<p>When someone saves your pin, more people can find it through their boards and through recommendations. Pinterest reads your words, your image and the page you link to, then matches your pin to searches.</p>
<h2>Why Pinterest matters for business</h2>
<p>People on Pinterest are often planning a purchase or a project, so they are open to ideas from brands. Pins link straight to websites, which makes Pinterest a steady source of traffic for blogs, shops and recipe sites. Content also lasts longer here than on fast-moving feeds, which rewards evergreen posts.</p>
<figure data-chart="1"></figure>
<p>Another plus is that people often plan early. A home store might see searches for patio ideas build up well before summer. If your pins are already there, they are ready when people start looking.</p>
<h2>How to set up Pinterest for marketing</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Create a business account</b> or switch your personal one. It is free and gives you analytics and ads.</li>
<li><b>Claim your website</b> so your pins show your name and logo and you can see stats for pins from your site.</li>
<li><b>Write a clear profile</b> with a short line about what you share and a link to your site.</li>
<li><b>Create boards</b> for the main topics your customers search for, with plain, searchable names.</li>
<li><b>Pin tall, clear images</b> with short text overlays, and link each one to the matching page.</li>
<li><b>Keep pinning</b> fresh images for your best pages so they get more chances to show up.</li>
</ol>
<p>As for what to pin, helpful, visual ideas tied to what you sell work best. A made-up furniture shop might pin "Small entryway ideas" with a photo of its bench in a narrow hall. A food blog might pin each recipe with a photo and the cook time on the image. A software company might pin a checklist or a simple chart that links to a guide.</p>
<p>Think about what your customer is planning, then make pins that help with that plan. Hard sales pitches tend to get skipped. A pin that solves a small problem, like "how to fit a desk in a closet", earns saves, and saves bring it to more people.</p>
<h2>How Pinterest differs from other networks</h2>
<p>On most apps, a post gets most of its views in its first day. On Pinterest, a pin can grow slowly over weeks and keep going for months. Replies and comments matter less, while saves and clicks matter more. Hashtags play a small role, and good words in your title and description do most of the work. Video exists, but still images remain a big part of the feed.</p>
<h2>How to measure Pinterest results</h2>
<p>Pinterest analytics show impressions, saves, pin clicks and outbound clicks for each pin and for your whole account. Outbound clicks are the ones that send people to your site. Add UTM tags to your links so your website analytics can show what those visitors did next, such as signing up or buying.</p>
<h2>Common mistakes</h2>
<ul>
<li>Treating Pinterest like Instagram and posting selfies or chatty updates.</li>
<li>Linking every pin to your home page.</li>
<li>Giving boards cute names nobody would search for.</li>
<li>Giving up after a few weeks, before pins have had time to build.</li>
<li>Pinning only your own posts once and never coming back to refresh them with new images.</li>
</ul>''',
 'charts': [
  {'type': 'line', 'title': 'Clicks from one pin, month by month', 'sub': 'Outbound clicks to a recipe page', 'example': True,
   'points': [('Month 1', 40), ('Month 2', 95), ('Month 3', 160), ('Month 4', 210), ('Month 5', 240), ('Month 6', 250)],
   'unit': 'Outbound clicks', 'note': 'Made-up numbers. Pins often build slowly as more people save them.'},
  {'type': 'steps', 'title': 'Set up Pinterest for a business', 'steps': [
    ('Business account', 'Create one or switch your personal account for free.'),
    ('Claim your site', 'Prove you own your website so pins show your name.'),
    ('Make boards', 'One board per topic your customers search for.'),
    ('Pin and link', 'Tall images that link to the exact matching page.'),
    ('Check analytics', 'Watch saves and outbound clicks each month.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Pinterest scheduler', 'url': '/pinterest-pin-scheduler', 'line': 'Plan pins to your boards on one calendar next to your other channels.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags pin links so you can see what Pinterest visitors do on your site.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for making tall pin images.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics that show which pins sent visitors who signed up or bought.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Is Pinterest a social media platform or a search engine?', 'It is a bit of both. People can follow others and save pins, but many use it mainly to search for ideas.'),
  ('Do I need a business account on Pinterest?', 'You need a business account to see analytics, claim your website and run ads. It is free, and you can switch a personal account over.'),
  ('What should businesses post on Pinterest?', 'Post helpful, visual ideas related to what you sell, such as how-to guides, product photos, recipes or style tips. Link each pin to a matching page.'),
  ('How long does a pin last on Pinterest?', 'There is no set end date. Because people find pins through search, a good pin can keep getting views and clicks for a long time.'),
  ('Do hashtags matter on Pinterest?', 'They play a small role. Clear search words in your pin title, description and board names matter much more.'),
 ],
 'related': ['pin', 'rich-pin', 'saves', 'evergreen-content', 'keyword'],
},
{
 'slug': 'post',
 'short': 'A post is any piece of content you publish on a social media app, such as text, a photo, a video, a link or a mix of these.',
 'body': '''<h2>What is a post?</h2>
<p>A post is a single item you share on a social app. It might be a few lines of text on Threads, a photo on Instagram, a short video on TikTok, a link on LinkedIn or an update in a Facebook group. Once it goes live, it shows on your profile and may appear in your followers' feeds.</p>
<p>Some apps use their own name for a post. People talk about tweets or posts on X, pins on Pinterest and Snaps on Snapchat. Mastodon used to call them toots and now calls them posts. The idea is the same everywhere: one piece of content, published at one time, under your name.</p>
<h2>Parts and types of a post</h2>
<ul>
<li><b>Media:</b> the image, video, carousel or GIF.</li>
<li><b>Caption or text:</b> the words that go with it.</li>
<li><b>Hashtags and mentions:</b> tags that help people find the post or point to other accounts.</li>
<li><b>Link:</b> a web address, where the app allows one in the post.</li>
<li><b>Alt text:</b> a description of the image for people using screen readers.</li>
<li><b>Settings:</b> location, who can reply, whether comments are on and similar options.</li>
</ul>
<h2>Post length limits by platform</h2>
<p>Each app caps how much text a post can hold. These are the limits for standard accounts:</p>
<figure data-chart="1"></figure>
<p>A limit is a ceiling. Most good posts use far less. Many apps also cut long text after a line or two with a "more" link, so the first line has to earn the tap.</p>
<p>Most apps support a handful of formats. Text posts work well on X, Threads, Bluesky, Mastodon and LinkedIn. Photo posts and carousels fit Instagram, Facebook and LinkedIn. Video posts rule on TikTok, YouTube and Reels. Link posts share an article with a preview card. Some apps add polls, documents, events or live video. Pick the format your audience on that app expects.</p>
<p>A post can also live in more than one place. The same post may show in followers' feeds, in search, on hashtag pages and in recommendations to people who don't follow you yet. That is why one good post can reach far past your follower count.</p>
<h2>How to write a good post, step by step</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Know your one point.</b> If you can't say it in a sentence, the post will wander.</li>
<li><b>Write the hook first.</b> The first line or first second decides if people stop scrolling.</li>
<li><b>Match the format to the app.</b> A long text post on TikTok or a bare link on Instagram rarely works.</li>
<li><b>Add the media.</b> Use the right size for each app so nothing gets cropped.</li>
<li><b>Add alt text</b> to images so everyone can follow along.</li>
<li><b>End with a next step,</b> such as a question, a link or a nudge to save it.</li>
<li><b>Proofread, then publish or schedule.</b> Typos are easy to fix before and harder after.</li>
</ol>
<p>For example, a made-up plant shop might post a carousel titled "4 signs your plant needs more light", with one sign per slide and a last slide that asks "Which one is your plant showing?"</p>
<h2>How to judge a post</h2>
<p>Open the insights for the post after a few days. Reach tells you how many people saw it. Likes, comments, shares and saves tell you how many cared. Link clicks tell you how many took the next step. Compare each post with your own average for that app and format, since one post on its own says little.</p>
<p>Look for patterns. If your how-to carousels keep beating your quote graphics, make more how-to carousels. If posts with a question at the end get twice the comments, keep asking. Write down what you learn so the next post starts from what worked.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting the exact same text and image on every app without any changes.</li>
<li>Burying the main point in the third paragraph.</li>
<li>Adding a long block of hashtags that crowds out the message.</li>
<li>Posting and walking away. Replies in the first hour keep a post alive.</li>
<li>Skipping alt text, which shuts out people who use screen readers.</li>
<li>Deleting a post that did poorly right away. Give it a day, then learn from it.</li>
</ul>
<h2>Post vs story</h2>
<p>A post stays on your profile until you delete it. A story disappears after about a day unless you save it as a highlight. Use posts for content you want people to find later, and stories for quick, casual updates.</p>
<figure data-chart="3"></figure>''',
 'charts': [
  {'type': 'bars', 'title': 'Post text limits by network', 'sub': 'Characters allowed in one post or caption', 'rows': [('Facebook', 63206, '63,206'), ('YouTube description', 5000, '5,000'), ('LinkedIn', 3000, '3,000'), ('Instagram', 2200, '2,200'), ('TikTok', 2200, '2,200'), ('Discord', 2000, '2,000'), ('Google Business Profile', 1500, '1,500'), ('Threads', 500, '500'), ('Pinterest description', 500, '500'), ('Mastodon', 500, '500'), ('Bluesky', 300, '300'), ('X', 280, '280')],
   'highlight': 'X', 'unit': 'Characters', 'note': "Limits used by Capybaroar's composer, November 2026."},
  {'type': 'steps', 'title': 'From idea to published post', 'steps': [
    ('One point', 'Write the single thing the post should say.'),
    ('Hook', 'Draft a first line or first second that makes people stop.'),
    ('Format and media', 'Pick the format the app favors and size the media for it.'),
    ('Next step', 'Add a question, link or call to save.'),
    ('Check and schedule', 'Proofread, add alt text, then publish or schedule.')]},
  {'type': 'versus', 'title': 'Post vs story', 'cols': ['Post', 'Story'],
   'rows': [('Stays on your profile', True, 'Only if saved as a highlight'), ('Usual life', 'Until you delete it', 'About a day'), ('Shows in the main feed', True, False), ('Good for', 'Content people find later', 'Quick, casual updates'), ('Gets likes and comments', True, 'Replies and reactions')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Write one post, adjust it for each network, preview it and schedule it on a shared calendar.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter shows how your text fits each network\'s limit.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for post images and carousels.'},
 ],
 'list': 'social-media-post-schedulers',
 'faqs': [
  ('What is the difference between a post and a story?', 'A post stays on your profile and in feeds until you remove it. A story is a short update that disappears after about a day unless you save it.'),
  ('Can I edit a post after publishing it?', 'Most apps let you edit the caption after posting, though some limit what you can change. Many do not let you swap the photo or video once it is live.'),
  ('How long should a social media post be?', "Stay well inside each app's limit and keep it as short as the message allows. The first line matters most because many apps hide the rest behind a more link."),
  ('Should I post the same thing on every app?', 'You can share the same idea, but adjust the text, size and format for each app. People who follow you in more than one place will notice copies.'),
 ],
 'related': ['caption', 'story', 'carousel-post', 'social-media-scheduling', 'feed'],
},
{
 'slug': 'posting-frequency',
 'short': 'Posting frequency is how often you publish new content on a social media account, such as several times a day, once a day or a few times a week.',
 'body': '''<h2>What is posting frequency?</h2>
<p>Posting frequency is the pace at which you share new posts on an account. You can count it per day, per week or per month, and it often differs from one app to the next. A brand might post several times a day on X, once a day on Instagram and twice a week on LinkedIn.</p>
<p>Frequency is about rhythm as much as volume. Three posts every week, week after week, usually does more for you than ten posts one week and none the next. Followers learn when to expect you, and you learn faster because each week looks like the last.</p>
<p>It helps to track frequency for each app and each format on its own. Two Reels and four Stories a week on Instagram is a different plan from six feed photos, even though both add up to six items.</p>
<h2>Why posting frequency matters</h2>
<p>Each post is a new chance to be seen. Posting too rarely means your followers forget you, and the app has little fresh content to show. Posting too often can tire your audience, lower the quality of each post and burn out your team. The right pace keeps you visible without wearing anyone out.</p>
<p>Frequency also shapes how fast you learn. More posts give you more data on what works, as long as each one is good enough to be worth testing.</p>
<h2>How frequency changes results</h2>
<p>As you post more, total reach often rises, but the reach of each post can start to slip. At some point, extra posts add little and may even pull your average down. The chart below shows that pattern with made-up numbers.</p>
<figure data-chart="1"></figure>
<p>Your own curve will look different. The goal is to find the pace where total results keep growing and each post still holds up.</p>
<h2>How networks differ</h2>
<p>Fast feeds like X, Threads and Bluesky move quickly, so a post fades within hours and more frequent posting is normal. Instagram and Facebook sit in the middle. LinkedIn feeds move slower, and posts can keep getting views for a couple of days. Pinterest and YouTube content can keep being found for months, so fewer, stronger posts can go further. Stories and short videos often run on their own pace, apart from feed posts.</p>
<p>Groups and communities are another case. In a Facebook group or a Discord server, members may welcome a daily prompt but feel crowded by several brand posts a day. Watch how members respond and set the pace with them in mind.</p>
<h2>How to find your right posting frequency</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Start with what you can keep up.</b> A pace you can hold for months beats a burst that stops after two weeks.</li>
<li><b>Write down your current numbers.</b> Note average reach and engagement per post for each app over the past month.</li>
<li><b>Change one thing at a time.</b> Raise or lower your pace on one app for three or four weeks.</li>
<li><b>Compare per post and in total.</b> Did total reach grow? Did reach per post hold steady or drop?</li>
<li><b>Watch for fatigue.</b> Rising unfollows, muted accounts or falling engagement per post can mean you are posting too much.</li>
<li><b>Settle on a pace and review it every few months.</b> Audiences and apps change.</li>
</ol>
<p>For example, a made-up coffee roaster might post three times a week on Instagram for a month, then five times a week for a month. If reach per post stays close and total reach grows, five is worth keeping. If saves and comments per post fall off, three may be the better pace.</p>
<h2>How to keep a steady posting schedule</h2>
<ul>
<li>Plan posts ahead on a content calendar.</li>
<li>Batch your writing and filming into set blocks of time.</li>
<li>Use a queue with fixed time slots so posts go out on their own.</li>
<li>Turn one strong idea into several formats for different apps.</li>
<li>Keep a short list of backup posts for busy weeks.</li>
<li>Give one person the job of checking the calendar each Monday for gaps.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li><b>Copying a number you read somewhere.</b> Your own results are a better guide than any rule of thumb.</li>
<li><b>Posting filler to hit a target.</b> A weak post can teach followers to scroll past you.</li>
<li><b>Posting the same text on every app at the same moment.</b> It can look lazy to people who follow you in more than one place.</li>
<li><b>Changing pace and format together.</b> Then you can't tell which change made the difference.</li>
</ul>
<p>Good posts on a steady rhythm count for more than any single number.</p>''',
 'charts': [
  {'type': 'columns', 'title': 'Reach per post as posting goes up', 'sub': 'Average reach per post at each weekly pace', 'example': True,
   'rows': [('1 a week', 2400, '2,400'), ('3 a week', 2300, '2,300'), ('5 a week', 2100, '2,100'), ('7 a week', 1700, '1,700'), ('14 a week', 1100, '1,100')],
   'highlight': '5 a week', 'labels': 'all', 'unit': 'Reach per post', 'note': 'Made-up numbers for one account. Here, 5 a week keeps reach per post close while total reach grows.'},
  {'type': 'steps', 'title': 'Test a new posting pace', 'steps': [
    ('Baseline', 'Write down reach and engagement per post for the last month.'),
    ('Change the pace', 'Post more or less on one app for three or four weeks.'),
    ('Compare', 'Check total reach and reach per post against the baseline.'),
    ('Decide', 'Keep the pace that grows results without hurting each post.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Set queue time slots for each channel and let posts go out at a steady pace.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Track reach and engagement per channel while you test a new pace.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Our free guide helps you choose the hours for your time slots.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for logging your weekly numbers during a test.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('How often should I post on social media?', 'There is no single right answer for every account. Pick a pace you can keep for months, then adjust it based on your own reach and engagement.'),
  ('Does posting more often increase reach?', 'It can, because each post is another chance to be seen. But if quality drops or followers get tired, reach per post can fall.'),
  ('Is it bad to post twice in one day?', 'Not on most apps, as long as both posts are worth seeing. Spacing them a few hours apart helps each one get its own attention.'),
  ('Should I post the same amount on every app?', 'Usually no. Fast feeds like X and Threads suit more frequent posts, while Pinterest and YouTube content lasts longer, so fewer posts can go further.'),
  ('How long should I test a new posting pace?', 'Give it three or four weeks so one lucky or unlucky post does not skew the result. Change only the pace during that time.'),
 ],
 'related': ['best-time-to-post', 'content-calendar', 'queue', 'batching', 'social-media-scheduling'],
},
]

TERMS += [
{
 'slug': 'pov',
 'short': 'POV is short for point of view, a caption style on short videos that puts the viewer inside a scene, as in "POV: you just got your first paycheck."',
 'body': '''<h2>What is POV?</h2>
<p>POV stands for point of view. On social media, it usually starts a caption or an on-screen line that sets up a scene. The words after "POV:" tell you who you are or what is happening, and the video then plays out that moment as if you were living it. The person on camera often acts as someone talking to you, or the camera stands in for your own eyes.</p>
<p>The format took off on TikTok and spread to Instagram Reels, YouTube Shorts and other short video apps. People also use POV in plain text posts and memes to describe a feeling everyone knows, with no video at all.</p>
<p>In film, a point of view shot shows what a character sees. Social media borrowed the term and made it looser. Today a POV post may not even be filmed from your eyes. What matters is that the caption puts you, the viewer, into the scene.</p>
<h2>How a POV video works</h2>
<p>A POV video has two parts that work together. The caption sets the scene in one line. The video then delivers the reaction, the punchline or the feeling. Because the caption does the setup, the video can skip straight to the good part, which suits apps where people decide in a second whether to keep watching.</p>
<p>There are two common camera styles. In the first, the creator looks into the lens and acts as the other person in the scene, so it feels like they are talking to you. In the second, the camera shows what you would see with your own eyes, such as hands opening a box or a view walking into a room.</p>
<h2>How people use POV</h2>
<ul>
<li><b>Skits:</b> short acted scenes, such as a teacher reacting to a very creative excuse.</li>
<li><b>Relatable moments:</b> everyday feelings, like the first sip of coffee on a Monday.</li>
<li><b>Fan stories:</b> imagined scenes with a character or a famous person.</li>
<li><b>Work and hobby life:</b> what a job or a hobby looks like from the inside.</li>
<li><b>Places and trips:</b> walking into a café, a hotel room or a city street as if you just arrived.</li>
<li><b>Before and after:</b> the moment something changes, like a messy room turning tidy.</li>
</ul>
<h2>Examples of POV posts</h2>
<p>These are made-up examples to show the style:</p>
<ul>
<li>"POV: you open the group chat after a few hours offline."</li>
<li>"POV: you are the barista and someone orders a drink with a long list of changes."</li>
<li>"POV: you finally fixed the bug just before the weekend."</li>
<li>"POV: your dog hears the treat bag from two rooms away."</li>
</ul>
<p>In each one, the caption sets the scene and the video or image shows the reaction. The best ones need no extra words. You read the line, you see the face and you get it.</p>
<h2>How to make a POV video, step by step</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Start from a feeling.</b> Pick a moment your audience knows well, like waiting for a reply or the first day at a new job.</li>
<li><b>Write the line.</b> Keep it short: "POV:" plus who the viewer is or what just happened.</li>
<li><b>Choose the camera style.</b> Decide if you are acting as the other person or showing what the viewer sees.</li>
<li><b>Film the reaction.</b> Keep it to a few seconds of face, motion or sound that lands the joke.</li>
<li><b>Put the line on screen in the first second.</b> Many people watch with the sound off.</li>
<li><b>Add a caption and post.</b> You can repeat the POV line in the caption so search can pick it up.</li>
</ol>
<h2>How brands can use POV</h2>
<p>POV videos work well for brands because they feel like jokes between friends. A bakery could post "POV: you walk in right as the bread comes out of the oven" with a slow shot of the shelves. A software company might show the moment a customer finds the feature they needed. A gym could act out the face of someone seeing the stairs after leg day.</p>
<p>The trick is to start from a feeling your audience already has, then let your product show up inside that moment. If the video only works as an ad, it will feel like one. If it works as a joke first, the product gets a free ride.</p>
<figure data-chart="2"></figure>
<h2>Common mistakes</h2>
<ul>
<li><b>Calling any video POV.</b> If the viewer can't picture themselves in the scene, the label confuses people.</li>
<li><b>Making the setup too long.</b> A caption that needs two sentences loses people before the payoff.</li>
<li><b>Hiding the line.</b> Text placed late, or tucked under app buttons, gets missed.</li>
<li><b>Punching down.</b> Jokes that mock customers or groups can spread fast for the wrong reasons.</li>
<li><b>Copying a trend word for word.</b> Add your own setting or twist so it feels like yours.</li>
</ul>
<p>Keep the scene clear and quick, put the line on screen right away and make sure anyone watching can step into it.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Make a POV video', 'steps': [
    ('Pick a feeling', 'Choose a moment your audience knows well.'),
    ('Write one line', 'POV plus who the viewer is or what just happened.'),
    ('Film the payoff', 'A few seconds of reaction that lands the joke.'),
    ('Text first', 'Show the line on screen in the first second.'),
    ('Post', 'Repeat the line in the caption so search finds it.')]},
  {'type': 'versus', 'title': 'POV video vs regular skit', 'cols': ['POV video', 'Regular skit'],
   'rows': [('Viewer is placed in the scene', True, False), ('Setup lives in one caption line', True, 'Often acted out'), ('Usual length', 'A few seconds', 'Often longer'), ('Camera often acts as the viewer', True, False), ('Can work with no sound', True, 'Sometimes')]},
 ],
 'tools': [],
 'faqs': [
  ('What does POV mean on TikTok?', 'POV means point of view. A TikTok captioned POV puts you, the viewer, inside a scene, and the video acts out what you would see or feel.'),
  ('How do you write a POV caption?', "Start with POV and a colon, then describe a short scene from the viewer's side, such as POV: your dog hears the treat bag. Keep it to one line."),
  ('Is POV the same as a skit?', 'Many POV videos are skits. What makes it POV is the angle: the viewer is placed inside the scene as one of the people in it.'),
  ('Can brands use POV videos?', 'Yes. They work best when they start from a feeling customers already know and let the product show up inside that moment.'),
 ],
 'related': ['tiktok', 'instagram-reels', 'meme', 'trend', 'hook'],
},
{
 'slug': 'profile',
 'short': 'A profile is the public page for a social media account, showing its name, handle, photo, bio, links and posts.',
 'body': '''<h2>What is a profile?</h2>
<p>A profile is your home base on a social app. When someone taps your name, they land on your profile and see who you are, what you post and how to reach you. Every account has one, whether it belongs to a person, a creator, a brand or a group.</p>
<p>Your profile is often the place where people decide whether to follow you. They may have seen one post in their feed, liked it and tapped through to see more. In a few seconds they scan your photo, your bio and your recent posts. If it all fits together, they follow. If it looks empty, old or confusing, they leave.</p>
<p>An account and a profile are not quite the same thing. The account is your login and everything tied to it, like settings and messages. The profile is the public page other people see.</p>
<h2>Parts of a profile</h2>
<ul>
<li><b>Display name:</b> the name people see, which can include spaces and sometimes a keyword.</li>
<li><b>Handle:</b> your unique username, often shown with an @ sign.</li>
<li><b>Profile photo:</b> your face or logo, shown small next to every post and comment.</li>
<li><b>Cover or banner image:</b> a wide image at the top on apps like X, LinkedIn, YouTube and Facebook.</li>
<li><b>Bio:</b> a short line or paragraph about you.</li>
<li><b>Link:</b> one or more web addresses, depending on the app.</li>
<li><b>Posts and highlights:</b> your content, often with pinned posts on top.</li>
<li><b>Buttons and details:</b> contact buttons, a category, a location or opening hours on business profiles.</li>
</ul>
<h2>Personal, creator and business profiles</h2>
<p>Many apps offer different account types. A personal profile is for everyday use. Creator and business profiles add tools such as analytics, contact buttons, categories and access to ads. On Facebook, businesses use a Page, and on LinkedIn they use a Company Page, while people have personal profiles on both. Some apps let you switch types at any time, and you can often switch back.</p>
<p>A business or creator profile is usually public. Personal profiles on many apps can go private, so only approved followers see posts. Pick the type that matches how you want people to find you.</p>
<h2>How to set up a strong profile, step by step</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Use a clear photo or logo</b> that still looks good at a tiny size. Crop tight on a face or use the simplest version of your logo.</li>
<li><b>Pick a handle</b> that is easy to spell and, if you can, the same on every app.</li>
<li><b>Write a bio</b> that says what you do and who it is for in plain words. Add what people get from following you.</li>
<li><b>Add a link</b> to the page you most want people to visit. If you need more than one, use a link in bio page.</li>
<li><b>Upload a banner</b> at the right size for each app, with nothing important near the edges where it may be cropped.</li>
<li><b>Pin a post</b> that shows your best work or explains what you share.</li>
<li><b>Check your contact details and category</b> so people can reach you.</li>
</ol>
<p>For example, a made-up dog groomer might use a photo of a happy, freshly groomed dog, the handle @tidypaws, the bio "Dog grooming in Leeds. Gentle cuts, no rush. Book below." and one link to a booking page.</p>
<h2>How profiles differ by network</h2>
<p>Each app gives your profile a different shape. Instagram and TikTok lead with a grid of posts, so your recent content does most of the talking. X, Threads, Bluesky and Mastodon show a stream of posts under a banner and a short bio. LinkedIn profiles read more like a résumé, with a headline, work history and a Featured section. YouTube channels put a banner and your videos front and center. Bios also have different lengths and link rules, so write each one for its app.</p>
<h2>How to measure your profile</h2>
<p>Many apps show profile visits in their insights, plus how many visitors followed you or tapped your link. Comparing those numbers tells you how well your profile turns curious visitors into followers and clicks.</p>
<figure data-chart="2"></figure>
<p>If lots of people visit but few follow, your bio or recent posts may not make the case. If people follow but few tap the link, your link may not say why it is worth a tap.</p>
<h2>Common mistakes</h2>
<ul>
<li>Old links that lead to a closed sale or a missing page.</li>
<li>Blurry logos that turn into a smudge at small sizes.</li>
<li>Bios full of buzzwords that never say what you actually do.</li>
<li>Different names and photos on every app, so people can't tell it is you.</li>
<li>Missing contact details on a business profile.</li>
</ul>
<p>Visit your own profile as a stranger would once a month and ask yourself if you would follow it.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Set up a profile', 'steps': [
    ('Photo', 'A clear face or simple logo that works at a tiny size.'),
    ('Handle and name', 'Easy to spell and the same across apps.'),
    ('Bio', 'What you do, who it is for and why to follow.'),
    ('Link', 'The one page you most want people to visit.'),
    ('Pinned post', 'Your best work or a short intro at the top.')]},
  {'type': 'funnel', 'title': 'From profile visit to booking', 'sub': 'One month of profile activity', 'example': True,
   'stages': [('Profile visits', 4000, '4,000'), ('New follows', 600, '600'), ('Link taps', 180, '180'), ('Booked a visit', 30, '30')],
   'unit': 'People', 'note': 'Made-up numbers to show how a profile turns visitors into followers and clicks.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'Give your profile one link that opens a page with all the places you want people to go.'},
  {'name': 'X header size', 'url': '/tools/x-header-size', 'line': 'Our free guide to the banner size for an X profile.'},
  {'name': 'LinkedIn banner size', 'url': '/tools/linkedin-banner-size', 'line': 'Our free guide to the banner size for a LinkedIn profile.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for profile photos, logos and banners.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is the difference between a profile and an account?', 'An account is your login and everything tied to it. A profile is the public page other people see for that account.'),
  ('Can I make my social media profile private?', 'Many apps, including Instagram, TikTok and X, let personal accounts go private so only approved followers see posts. Business pages are usually public.'),
  ('What should I put in my profile bio?', 'Say what you do, who you help and what people get from following you. Add a link or a call to action if there is room.'),
  ('Should my profile look the same on every app?', 'Use the same name, handle and photo where you can so people know it is you. Write each bio and banner to fit that app.'),
  ('How do I see how many people visit my profile?', 'Many apps show profile visits in the insights for business or creator accounts. Compare visits with new follows to see how well your profile works.'),
 ],
 'related': ['bio', 'handle', 'avatar', 'business-account', 'pinned-post'],
},
{
 'slug': 'psychographics',
 'short': 'Psychographics are the values, interests, attitudes and lifestyle choices that explain why people act the way they do, used to understand an audience.',
 'body': '''<h2>What are psychographics?</h2>
<p>Psychographics describe the inner side of your audience. They cover what people care about, how they spend their free time, what they believe and what worries or excites them. Two people of the same age in the same city can have very different psychographics. One might be a weekend hiker who saves for travel, while the other loves gaming and buys the newest gadgets.</p>
<p>On social media, psychographics help you decide what to post, how to say it and who to aim ads at. They turn "women aged 25 to 34" into a picture of a real person with real reasons to stop scrolling.</p>
<h2>Psychographics vs demographics</h2>
<p>Demographics tell you who someone is on paper: age, gender, location, income, job or education. Psychographics tell you why they make the choices they do. Demographics help you aim. Psychographics help you write content that feels like it was made for the reader. The best audience profiles use both.</p>
<figure data-chart="1"></figure>
<h2>Common psychographic traits</h2>
<ul>
<li><b>Values:</b> what matters most, such as family, saving money or caring for the planet.</li>
<li><b>Interests and hobbies:</b> cooking, fitness, music, gardening and so on.</li>
<li><b>Lifestyle:</b> busy parent, frequent traveler, remote worker, night owl.</li>
<li><b>Attitudes:</b> early adopter of new things, or careful buyer who reads every review.</li>
<li><b>Pain points:</b> problems they want to solve, like no time to cook or trouble sleeping.</li>
<li><b>Goals:</b> what they hope to reach, such as running a first race or growing a small shop.</li>
</ul>
<h2>How to find your audience's psychographics, step by step</h2>
<ol>
<li><b>Read what people already tell you.</b> Go through comments, messages and reviews, and note the words they use.</li>
<li><b>Ask with polls and question stickers.</b> Short, specific questions get more answers than long surveys.</li>
<li><b>Listen beyond your brand.</b> Social listening shows what your audience talks about in general, such as other hobbies or worries.</li>
<li><b>Check interest data.</b> Platform analytics and ad tools often show interest groups for your followers.</li>
<li><b>Talk to real customers.</b> A few short calls asking "why did you choose us?" often teach more than a big survey.</li>
<li><b>Look at what gets saved and shared.</b> Those posts show what your audience values enough to keep or pass on.</li>
<li><b>Write it down.</b> Group what you find into one or two short personas.</li>
</ol>
<p>For example, a made-up meal kit brand might learn from comments that many followers are parents who care about health but feel short on time. That single finding shapes everything from the hooks it writes to the hour it posts.</p>
<h2>How to use psychographics on social media</h2>
<p>Once you know what your audience values, you can pick topics, tone and visuals that match. A brand whose followers care about saving time can post quick tips and shortcuts. One whose followers love craft and detail can show slow, behind-the-scenes work. A brand whose followers worry about money can lead with value and honest prices.</p>
<p>Psychographics also help you plan your content mix. You might map each content pillar to one value your audience holds, then check that your weekly posts cover them in the right amounts.</p>
<figure data-chart="2"></figure>
<p>In paid social, interest targeting lets you reach people with similar traits. Write ads that speak to the reason behind the purchase. "Dinner on the table in 20 minutes" speaks to a busy parent far better than a list of ingredients.</p>
<h2>How psychographics shift across networks</h2>
<p>The same person can show a different side on each app. On LinkedIn they may care about career growth and look for advice. On Pinterest they may be planning a home project. On TikTok they may want to laugh after work. Think about what mood and goal people bring to each app, and adjust your angle while keeping your brand the same.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Guessing.</b> A persona built from what the team imagines can point you the wrong way. Base it on what people say and do.</li>
<li><b>Making personas too broad.</b> "Likes good things" tells you nothing. Pick traits that change what you would post.</li>
<li><b>Never updating them.</b> Audiences change. Review your personas every six months or after a big shift in your business.</li>
<li><b>Using them to stereotype.</b> Personas are a guide for writing, and real people will always vary.</li>
</ul>
<p>Keep your persona next to your content calendar and check new posts against it before you publish.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Demographics vs psychographics', 'cols': ['Demographics', 'Psychographics'],
   'rows': [('Answers', 'Who they are', 'Why they act'), ('Examples', 'Age, location, job', 'Values, hobbies, goals'), ('Easy to collect', True, 'Takes more work'), ('Helps you aim ads', True, True), ('Helps you write the message', 'A little', True)]},
  {'type': 'stack', 'title': 'Content mix mapped to audience values', 'sub': 'Share of weekly posts for a meal kit brand', 'example': True,
   'parts': [('Saving time', 40), ('Eating well', 30), ('Family moments', 20), ('Saving money', 10)],
   'note': 'Made-up numbers for one brand. Base your own mix on what your audience tells you.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Read comments and mentions from every channel in one place and spot what your audience cares about.'},
  {'name': 'Typeform', 'url': 'https://www.typeform.com/', 'domain': 'typeform.com', 'line': 'A tool for building surveys to ask customers about their values and habits.'},
  {'name': 'Notion', 'url': 'https://www.notion.com/', 'domain': 'notion.com', 'line': 'A workspace for writing personas your whole team can find.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is an example of psychographics?', 'A psychographic profile might say a customer values health, cooks at home most nights and reads labels before buying. That tells you far more than their age alone.'),
  ('Why are psychographics important in marketing?', "They explain why people buy, which helps you write messages that feel personal. Content that matches someone's values is more likely to get attention."),
  ('How do you collect psychographic data?', 'Use surveys, polls, interviews, comment threads, social listening and interest data from analytics tools. Look for patterns across many people.'),
  ('How are psychographics different from demographics?', 'Demographics describe who someone is, like age and location. Psychographics describe why they act, like their values, interests and goals.'),
  ('How often should I update my audience personas?', 'Review them about every six months, or sooner if your product or audience changes a lot.'),
 ],
 'related': ['target-audience', 'audience', 'social-listening', 'customer-journey', 'niche'],
},
{
 'slug': 'qanda-sticker',
 'short': 'A Q&A sticker is a sticker you add to an Instagram story that lets viewers type a question for you, which you can then answer in a new story.',
 'body': '''<h2>What is a Q&amp;A sticker?</h2>
<p>A Q&amp;A sticker is an interactive box you place on an Instagram story. It shows a prompt, such as "Ask me anything", with a space where viewers type a reply. Instagram labels it the Questions sticker in the sticker tray, but most people call it the Q&amp;A sticker. The questions come to you privately, and you choose which ones to share and answer.</p>
<p>When you share an answer, the question appears on a new story without the sender's name. You then add your reply as text, a photo or a video. You can see who sent each question, but your other viewers can't.</p>
<p>Other apps have similar tools. Facebook stories offer interactive stickers, and many creators run question sessions in live videos or community posts. The idea is the same: let your audience ask, then answer in public.</p>
<h2>Why the Q&amp;A sticker matters</h2>
<p>The sticker turns a one-way story into a conversation. It shows you what your audience wants to know, gives you a steady supply of content ideas and makes followers feel heard. Replies are a form of story engagement, a sign that people care about what you share.</p>
<p>It is also a research tool. The questions people send show their worries, their goals and the words they use. A made-up skincare brand might learn that most questions are about using two products together, which tells it what guide to write next.</p>
<h2>How to use the Q&amp;A sticker, step by step</h2>
<figure data-chart="1"></figure>
<ol>
<li>Start a new story and add a photo, video or plain background.</li>
<li>Tap the sticker icon and choose Questions.</li>
<li>Type your own prompt so people know what to ask.</li>
<li>Post the story and wait for replies. Give it most of the day.</li>
<li>Open the viewer list on the story to see the responses.</li>
<li>Tap a question and pick share to answer it in a new story.</li>
<li>Save your answers as a highlight on your profile so new visitors can find them later.</li>
</ol>
<h2>How to measure a Q&amp;A sticker</h2>
<p>Story insights show how many people viewed the story and how many replied through the sticker. Count how many questions came in and how many you answered. Over a few rounds, you'll see which prompts get the most replies and which answers keep people watching your stories.</p>
<figure data-chart="2"></figure>
<p>If many people see the sticker but few reply, the prompt may be too broad or the topic may not matter enough to them. Try a more specific prompt next time.</p>
<p>Also watch what happens after you answer. If the story with your answers keeps most viewers to the end, people found them useful. If viewers drop off fast, keep answers shorter or pick questions more people care about. A simple log of prompts, replies and answer views makes the pattern easy to spot after a month or two.</p>
<h2>Q&amp;A sticker ideas</h2>
<ul>
<li><b>Ask me anything</b> about your job, product or hobby.</li>
<li><b>Product questions</b> in the days before a launch.</li>
<li><b>Tips on one topic</b>, such as "What do you want to know about meal prep?"</li>
<li><b>Feedback</b> on what to post next or which product to make.</li>
<li><b>Behind the scenes</b>, like "Ask our head baker anything."</li>
<li><b>A weekly session</b> at a regular time, so followers learn to save their questions.</li>
</ul>
<h2>Tips for better answers</h2>
<p>Answer with video when you can. A short clip of you talking feels more personal than text on a colored background. Pick a mix of questions, from quick and fun to useful and detailed. If one question comes up again and again, answer it once in a full post and point people to it.</p>
<p>Be careful with what you share. Remove anything personal, such as a phone number or a full name, before posting a question. Skip rude questions instead of answering them for laughs, since the sender may still be watching.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>A vague prompt.</b> "Ask me anything" can work for a big creator but often brings few replies for a brand. "What is your biggest question about running shoes?" works better.</li>
<li><b>Never answering.</b> A sticker that collects questions and goes silent leaves people feeling ignored.</li>
<li><b>Answering too late.</b> Stories disappear after a day, so answer while people still remember asking.</li>
<li><b>Forgetting the highlight.</b> Good answers vanish unless you save them.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Run a Q&A round in stories', 'steps': [
    ('Pick one topic', 'Write a specific prompt such as questions about running shoes.'),
    ('Post the sticker', 'Add it to a story and give it most of the day.'),
    ('Choose questions', 'Pick a mix of quick and detailed ones, with personal details removed.'),
    ('Answer on video', 'Share each question and reply in a short clip.'),
    ('Save a highlight', 'Keep the answers on your profile for new visitors.')]},
  {'type': 'funnel', 'title': 'From story view to answered question', 'sub': 'One Q&A sticker round', 'example': True,
   'stages': [('Story viewers', 1800, '1,800'), ('Tapped the sticker', 240, '240'), ('Questions sent', 90, '90'), ('Questions answered', 24, '24')],
   'unit': 'People or questions', 'note': 'Made-up numbers for one account.'},
 ],
 'tools': [
  {'name': 'Instagram story size', 'url': '/tools/instagram-story-size', 'line': 'Our free guide to the size and safe areas for story backgrounds.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for making story backgrounds for your questions and answers.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for logging the questions you get and turning them into post ideas.'},
 ],
 'list': 'instagram-post-schedulers',
 'faqs': [
  ('Is the Instagram Q&A sticker anonymous?', "No. You can see who sent each question. When you share a question in a story, the sender's name is not shown to other viewers."),
  ('How do I see responses to my question sticker?', 'Open the story, swipe up or tap the viewer list, and you will find the responses there. Tap one to share or reply.'),
  ('What should I write on a Q&A sticker?', 'Use a clear prompt tied to one topic, such as Ask me about running shoes. Specific prompts bring more and better questions.'),
  ('How long do I have to answer questions?', 'The story with the sticker lasts about a day, so answer while it is still live. You can still see responses later in your story archive.'),
 ],
 'related': ['instagram-stories', 'highlights', 'engagement', 'community-management', 'instagram'],
},
{
 'slug': 'qr-code',
 'short': 'A QR code is a square barcode that a phone camera can scan to open a link, such as a website, a social profile or a sign-up page.',
 'body': '''<h2>What is a QR code?</h2>
<p>QR stands for quick response. A QR code is a pattern of black and white squares that stores a short piece of data, most often a web address. Point a phone camera at it, tap the link that pops up and you land on the page. No typing is needed.</p>
<p>You see QR codes on posters, menus, flyers, product packaging, business cards and event screens. They connect something in the real world to something online. For social media, that often means turning someone standing in front of your shop window into a follower.</p>
<h2>How QR codes work</h2>
<p>The squares in a QR code hold data in a grid. Three big squares in the corners help the camera find the code and read it at any angle. The code also stores extra data so it can still be read when part of it is dirty, scratched or covered by a small logo. Most phone cameras read QR codes on their own, with no extra app.</p>
<p>A QR code doesn't know who scanned it. It only opens a link. Any tracking happens on the page it opens or through a short link service in between.</p>
<h2>How QR codes help social media</h2>
<ul>
<li>Send people from a shop window or flyer to your Instagram or TikTok profile.</li>
<li>Add a code to packaging that opens a how-to video.</li>
<li>Show a code at an event so people can follow you on the spot.</li>
<li>Link to a contest entry or sign-up form.</li>
<li>Put a code on a business card that opens your link in bio page.</li>
</ul>
<p>Many social apps can make a QR code for your profile. Look in your profile or share menu for a QR option.</p>
<h2>Static vs dynamic QR codes</h2>
<p>A <b>static</b> QR code holds the link inside the pattern itself. It never expires, but you can't change where it points once it is printed. A <b>dynamic</b> QR code points to a short link that a service controls, so you can change the destination later and often see how many scans it got. Dynamic codes stop working if the service stops, so pick one you trust.</p>
<figure data-chart="1"></figure>
<p>One handy middle path is a static code that points to a page you control, such as your own link in bio page. The code never changes, and you update the page whenever you like.</p>
<h2>How to make a QR code, step by step</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Decide which page the code should open.</b> Use one page with one clear purpose.</li>
<li><b>Add UTM parameters</b> to the link so your analytics can tell these visits apart from others.</li>
<li><b>Make the code</b> with a QR code generator or your social app's QR tool.</li>
<li><b>Download a high quality file</b>, such as SVG or a large PNG, for print.</li>
<li><b>Test it</b> with a few different phones, in good and poor light, before you print hundreds of copies.</li>
<li><b>Check the page on a phone.</b> Everyone who scans will see it on a small screen.</li>
</ol>
<p>For example, a made-up café might put a code on each table that opens its Instagram profile with the line "Scan for this week's specials". With a tagged link to its own page in between, it can count how many visits came from the tables.</p>
<h2>How to measure QR code results</h2>
<p>If you used UTM tags, your website analytics show visits from the code along with what people did next. A dynamic code service may also count scans. Compare scans or visits with how many people saw the code, such as event visitors or flyers handed out, to see what share of them scanned.</p>
<h2>Tips and common mistakes</h2>
<ul>
<li><b>Too small.</b> Print the code large enough to scan from where people stand. A code on a far wall needs to be big.</li>
<li><b>No clear space.</b> Leave a blank border around the code so the camera can find its edges.</li>
<li><b>Weak contrast.</b> Dark squares on a light background scan best. Pale colors or busy photos behind the code cause misses.</li>
<li><b>No reason to scan.</b> Add a short line that says what people get, such as "Scan for the recipe".</li>
<li><b>A page that breaks on phones.</b> A slow or desktop-only page wastes the scan.</li>
<li><b>Forgetting to test after printing.</b> Ink and paper can change how a code reads.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Static vs dynamic QR codes', 'cols': ['Static', 'Dynamic'],
   'rows': [('Link stored in the pattern', True, False), ('Can change the destination later', False, True), ('Counts scans on its own', False, 'Usually'), ('Keeps working if a service shuts down', True, False), ('Good for', 'Print that lasts', 'Campaigns you may change')]},
  {'type': 'steps', 'title': 'Make a QR code that works', 'steps': [
    ('Pick the page', 'One page with one clear purpose.'),
    ('Tag the link', 'Add UTM parameters so you can track visits.'),
    ('Make the code', 'Use a generator or your app\'s QR tool.'),
    ('Test it', 'Scan with several phones in different light.'),
    ('Print it big', 'Add clear space and a line that says why to scan.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'Point your QR code at one page you control and change its links any time.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags the link inside your code so you can count visits from print.'},
  {'name': 'Bitly', 'url': 'https://bitly.com/', 'domain': 'bitly.com', 'line': 'A link shortening service that also makes QR codes.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for placing your QR code on flyers, posters and menus.'},
 ],
 'list': 'social-media-tools-for-small-business',
 'faqs': [
  ('Do QR codes expire?', 'Static QR codes do not expire, since the link is stored in the pattern. Dynamic codes can stop working if the service behind them ends or your plan lapses.'),
  ('How do I scan a QR code?', "Open your phone's camera and point it at the code. Tap the link that appears on screen."),
  ('Can I make a QR code for my Instagram profile?', 'Yes. Instagram and many other apps can create a QR code for your profile from the profile or share menu.'),
  ('Are QR codes free to make?', 'Many tools make static QR codes for free. Dynamic codes with scan tracking often come with a paid plan.'),
  ('How do I track scans from a QR code?', 'Add UTM parameters to the link so your website analytics can count the visits, or use a dynamic code service that counts scans.'),
 ],
 'related': ['url-shortener', 'utm-parameters', 'link-in-bio', 'profile', 'call-to-action'],
},
]

TERMS += [
{
 'slug': 'queue',
 'short': 'A queue is a line of posts waiting to be published in order, each one going out at the next open time slot you set in a scheduling tool.',
 'body': '''<h2>What is a queue?</h2>
<p>In social media tools, a queue is a list of posts lined up to go out one after another. You set regular time slots for each account, such as weekday mornings and evenings. Each post you add drops into the next free slot, and the tool publishes it when that time comes. You don't have to pick a date and time for every single post.</p>
<p>Think of it like a line at a ticket window. The slots are the window opening times, and the posts are the people waiting. Whoever is next in line goes when the window opens.</p>
<h2>How a queue works</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>You set time slots.</b> For example, Monday to Friday at 8:30 and 17:00 for Instagram, and three times a day for X.</li>
<li><b>You add a post to the queue.</b> You write it once and choose which accounts it goes to.</li>
<li><b>The tool places it in the next empty slot</b> for each account.</li>
<li><b>When the slot arrives, the post goes live.</b></li>
<li><b>The queue moves forward</b>, and the next post waits for its turn.</li>
</ol>
<p>Most tools let you drag posts to reorder them, push an urgent post to the front or pause the whole queue if news breaks. If you change a slot time, every queued post moves with it.</p>
<h2>Queue vs scheduling a set time</h2>
<p>Scheduling a post for a set date and time is best when timing matters, like a launch, a live event or a holiday greeting. A queue is best for steady, everyday content where the exact hour matters less than showing up often. Many teams use both. Time-sensitive posts get fixed times, and everything else flows through the queue.</p>
<figure data-chart="2"></figure>
<h2>Why use a queue</h2>
<ul>
<li>You keep a steady posting rhythm without thinking about each slot.</li>
<li>You can write many posts in one sitting and let them roll out over days.</li>
<li>Gaps on busy weeks are less likely, since the queue keeps going.</li>
<li>You can change slot times once and have every queued post follow.</li>
<li>A team can add posts from different people while one schedule keeps them spaced out.</li>
</ul>
<h2>How to set up a good queue, step by step</h2>
<ol>
<li><b>Pick slot times from your data.</b> Check your analytics for the hours your followers are online, and start there.</li>
<li><b>Set slots for each network on its own.</b> X and Threads can take more slots a day than LinkedIn or Pinterest.</li>
<li><b>Match slots to what you can fill.</b> Ten slots a week with five posts leaves gaps. Start smaller and add slots later.</li>
<li><b>Fill at least a week ahead.</b> A buffer covers sick days, trips and busy launches.</li>
<li><b>Mix post types.</b> Spread tips, questions, stories and offers so followers don't see the same kind of post several times in a row.</li>
<li><b>Review the queue each week.</b> Read the next few days of posts and check that dates, prices and links are still right.</li>
</ol>
<p>For example, a made-up bookshop might set Instagram slots at 9:00 on weekdays and 11:00 on Saturdays. On Sunday evening, someone writes six posts in an hour: two staff picks, a quote, a question, an event reminder and a photo of the new window display. The queue spaces them across the week.</p>
<h2>How to tell if your queue works</h2>
<p>Look at reach and engagement for each slot over a few weeks. If one slot keeps doing poorly, move it to a different hour or drop it. Also check how often the queue runs dry. If it empties every Thursday, you either need fewer slots or a longer writing session.</p>
<p>It also helps to look at how far ahead the queue runs. A queue that is always two days from empty puts stress on the team. A queue that runs three months ahead may hold posts that go stale before they go out.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Setting and forgetting.</b> A queue runs on its own, which is both its strength and its risk.</li>
<li><b>Letting old posts go out.</b> A promotion that already ended, or a cheerful post during a serious news event, can hurt your brand.</li>
<li><b>Too many slots.</b> Filling slots with weak posts trains followers to scroll past you.</li>
<li><b>Identical copy on every network.</b> Adjust the text and size for each app, even when the idea is the same.</li>
</ul>
<p>Pause the queue when something big happens in the news or in your business, and read it again before you start it.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'How a post moves through the queue', 'steps': [
    ('Set slots', 'Choose regular posting times for each account.'),
    ('Add a post', 'Write it once and pick the accounts.'),
    ('Next free slot', 'The tool places it in the first open time.'),
    ('Publish', 'The post goes live when its slot arrives.')]},
  {'type': 'versus', 'title': 'Queue vs set date and time', 'cols': ['Queue', 'Set time'],
   'rows': [('You pick the exact hour', False, True), ('Good for everyday posts', True, 'Works, but slower'), ('Good for launches and events', False, True), ('Moves when you change slot times', True, False), ('Keeps posts evenly spaced', True, 'Only if you plan it')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Set queue time slots for each channel, add posts and let them go out in order.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See your best times to post, so you can place queue slots where your audience is.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Our free guide to choosing posting hours for each network.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('What does queue mean in social media?', 'It means a list of posts waiting to be published in order. Each post goes out at the next time slot you have set.'),
  ('How many posts should I keep in my queue?', 'Keep enough to cover at least a week of your normal posting pace. That way a busy few days will not leave your accounts silent.'),
  ('Can I change the order of posts in a queue?', 'Most scheduling tools let you drag posts into a new order or move one to the front. You can also edit or remove a post before it goes out.'),
  ('Should I pause my queue during big news?', 'Yes, when the news is serious or touches your business. Read the queued posts again before you restart it.'),
 ],
 'related': ['social-media-scheduling', 'bulk-scheduling', 'content-calendar', 'posting-frequency', 'auto-posting'],
},
{
 'slug': 'quote-post',
 'short': "A quote post is a share of someone else's post with your own comment added on top, so your followers see both your words and the original.",
 'body': '''<h2>What is a quote post?</h2>
<p>A quote post lets you repost something and add your own thoughts. Your text shows first, and the original post appears below it as an embedded card that people can tap to open. On X, this was long known as a quote tweet. Threads and Bluesky also have quote posts, and LinkedIn offers a similar option when you repost with your thoughts.</p>
<p>A quote post counts as a new post on your profile. It has its own likes, replies and reposts, separate from the original. The original author usually gets a notice that you quoted them.</p>
<h2>Quote post vs repost</h2>
<p>A plain repost shares the original exactly as it is, with no added words. It says "I think you should see this." A quote post adds your view, so it says "Here is what I think about this." Quote posts give you more room to add value, but they also put your opinion on the record next to someone else's words.</p>
<figure data-chart="1"></figure>
<h2>Why quote posts matter</h2>
<ul>
<li>They let you join a popular conversation in your own voice.</li>
<li>They give credit to the original author while adding context.</li>
<li>They show up as your own post, so they can reach your followers in their feed.</li>
<li>The original author is usually notified, which can start a real exchange.</li>
<li>They can bring the original author's followers to your profile when your comment is worth reading.</li>
</ul>
<h2>How to make a quote post, step by step</h2>
<ol>
<li><b>Find the post you want to share.</b> Read it in full, including any thread or link.</li>
<li><b>Tap the repost or share icon.</b></li>
<li><b>Choose Quote</b>, or repost with your thoughts on LinkedIn.</li>
<li><b>Write your comment.</b> Lead with your point in the first line.</li>
<li><b>Check the preview</b>, then post.</li>
</ol>
<p>Your comment has to fit the app's text limit. On short-form apps that leaves little room, so every word counts. Read it out loud once. If it only makes sense after reading the original, add a few words of context so it stands on its own in the feed.</p>
<figure data-chart="2"></figure>
<p>Good quote posts add something the original lacks. A few ways to do that:</p>
<ul>
<li><b>Add a fact or a tip</b> that builds on the original point.</li>
<li><b>Share a short story</b> from your own work that backs it up.</li>
<li><b>Thank a customer</b> who praised you, with a warm reply.</li>
<li><b>Explain why news matters</b> to your audience in one clear line.</li>
<li><b>Celebrate a partner's launch</b> and say what you like about it.</li>
</ul>
<p>For example, a made-up accounting firm might quote a post about a new tax rule with "If you run a small shop, the part that matters is the deadline. Here's what to do this month." It gives followers a reason to read the original and a reason to follow the firm.</p>
<h2>How quote posts differ by network</h2>
<p>On X, Threads and Bluesky, quote posts are a normal part of daily talk, and people use them both to praise and to argue. Some of these apps let authors limit or remove quotes of their own posts. LinkedIn's version reads more like a shared article with a note on top. Instagram and TikTok have no quote button in the same sense. People there share a post to their story with text, or use features like remix or stitch to build on a video. Features shift over time, so check the share menu on each app.</p>
<h2>How to measure quote posts</h2>
<p>Look at your quote post's own numbers: reach, likes, replies and profile visits. Then compare them with your plain reposts and your regular posts. If your quotes earn more replies than your reposts, your added comments are pulling their weight. If you are the one being quoted, read those quotes. They show how people talk about you, and they often hold questions you can answer in a later post.</p>
<p>Keep a simple tally for a month. Note each quote post you make, what kind of comment you added and how it did. Tips and personal stories often beat plain praise, but your own numbers will tell you what your audience likes.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Quoting to mock.</b> Quote posts used to pile on someone can spread fast and look bad for a brand.</li>
<li><b>Arguing with customers in public.</b> If a customer has a problem, reply directly or move the chat to messages.</li>
<li><b>Empty quotes.</b> "This!" adds nothing a plain repost would not.</li>
<li><b>Quoting without reading.</b> Check the full thread and the account before you put your name next to it.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Quote post vs repost', 'cols': ['Quote post', 'Repost'],
   'rows': [('Adds your own words', True, False), ('Counts as a new post on your profile', True, 'Shows on your profile'), ('Has its own likes and replies', True, False), ('Original author usually notified', True, True), ('Best when', 'You have something to add', 'The post speaks for itself')]},
  {'type': 'bars', 'title': 'Room for your comment', 'sub': 'Text limit for a post on apps with quote posts', 'rows': [('LinkedIn', 3000, '3,000'), ('Threads', 500, '500'), ('Bluesky', 300, '300'), ('X', 280, '280')],
   'highlight': 'X', 'unit': 'Characters', 'note': "Limits used by Capybaroar's composer, November 2026."},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See comments and mentions from your channels in one place, so you can reply when people talk about you.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter checks that your comment fits the limit on each app.'},
 ],
 'list': 'x-post-schedulers',
 'faqs': [
  ('What is the difference between a quote post and a repost?', 'A repost shares the original post as it is. A quote post adds your own comment on top of it.'),
  ('Does the original poster see a quote post?', 'On most apps the original author gets a notification when their post is quoted. Some apps also let authors limit or remove quotes of their posts.'),
  ('Can I quote post on Instagram?', 'Instagram has no quote button like the one on X or Threads. A common way to comment on a post there is to share it to your story and add text.'),
  ('Is a quote post better than a reply?', 'A reply joins the conversation under the original post, where its readers see it. A quote post brings the original to your own followers with your view on top.'),
 ],
 'related': ['repost', 'x-twitter', 'threads', 'bluesky', 'mention'],
},
{
 'slug': 'reach',
 'short': 'Reach is the number of unique people who saw your content at least once, counting each person only one time.',
 'body': '''<h2>What is reach?</h2>
<p>Reach tells you how many different people saw a post, a story, an ad or your account as a whole over a set period. If one person sees your post five times, reach counts that as one. It measures how widely your content spread across people.</p>
<p>Most apps show reach in their analytics, sometimes labeled accounts reached or unique viewers. Because each app counts views a little differently, compare reach within one app and be careful comparing across apps.</p>
<p>You can look at reach at different levels. Post reach covers one post. Account reach covers everything you shared over a week or a month, counting each person once. Campaign reach covers a set of posts or ads tied to one goal. Pick the level that answers your question.</p>
<h2>Reach vs impressions</h2>
<p>Impressions count every time your content appeared on a screen, including repeat views by the same person. Reach counts the people. So impressions are always equal to or higher than reach. Comparing the two shows frequency, which is impressions ÷ reach. A high frequency means the same people see your content many times.</p>
<p>For example, with made-up numbers: a post with 8,000 impressions and 5,000 reach has a frequency of 1.6. On average, each person saw it about one and a half times.</p>
<h2>Types of reach</h2>
<ul>
<li><b>Organic reach:</b> people who saw your content for free.</li>
<li><b>Paid reach:</b> people who saw it through an ad or boost.</li>
<li><b>Viral reach:</b> people who saw it because someone else shared or engaged with it.</li>
<li><b>Follower and non-follower reach:</b> some apps split viewers by whether they already follow you.</li>
</ul>
<p>Non-follower reach is worth watching. It shows how often the app picks your posts to show new people through recommendations, search or shares.</p>
<h2>How to measure reach</h2>
<p>Open the insights for each post and note its reach. To compare posts fairly across accounts of different sizes, or over months as you grow, work out the reach rate.</p>
<figure data-chart="1"></figure>
<p>A rising reach rate means your content is spreading further than your follower count alone would suggest. A reach rate above 100% is possible when many non-followers see a post.</p>
<p>Reach also has a shape over time. Most posts get the bulk of their reach soon after they go live, then level off. Looking at that curve tells you how long a typical post keeps working on each app. If most of your reach arrives in the first three hours, the hour you post matters a lot. If it keeps growing for days, timing matters less than the post itself.</p>
<figure data-chart="2"></figure>
<h2>How reach differs by network</h2>
<p>On fast feeds like X and Threads, reach builds and fades within hours. Instagram and Facebook posts often grow for a day or two. TikTok and Reels can pick up again days later if the app starts showing the video to a new group. Pinterest and YouTube can keep adding reach for months, because people find content through search. So judge each app by its own timing, and wait long enough before you compare posts.</p>
<h2>How to increase reach, step by step</h2>
<ol>
<li><b>Lead with a hook</b> in the first line or first second of video.</li>
<li><b>Make content people want to send to a friend.</b> Shares carry your post to new people.</li>
<li><b>Post when your audience is online</b>, so the first wave of viewers comes fast.</li>
<li><b>Use the formats each app is pushing to new viewers</b>, such as short video.</li>
<li><b>Collaborate with other accounts</b> so you appear in front of their followers.</li>
<li><b>Use clear keywords and a few relevant hashtags</b> so search can find you.</li>
<li><b>Reply to early comments</b> to keep the post active.</li>
</ol>
<h2>Common mistakes</h2>
<ul>
<li><b>Mixing up reach and impressions</b> in reports, which makes growth look bigger or smaller than it is.</li>
<li><b>Adding up reach across posts</b> and calling it total people. The same person may have seen several posts, so the sum overcounts.</li>
<li><b>Judging reach alone.</b> Reach is the top of the funnel. Before anyone can like, click or buy, they must see you, but seeing is only the start.</li>
<li><b>Chasing reach with clickbait</b> that brings the wrong people.</li>
<li><b>Comparing one post with another too soon.</b> A post shared this morning hasn't had the same time as one from last week.</li>
</ul>
<p>Pair reach with engagement and conversions to see whether the right people are seeing your posts and acting on them.</p>''',
 'charts': [
  {'type': 'formula', 'title': 'Reach rate', 'formula': 'Reach rate = people reached ÷ followers × 100',
   'note': 'Made-up numbers to show the math.', 'result': '25%',
   'example': [('People reached', '3,000'), ('Followers', '12,000')]},
  {'type': 'line', 'title': 'How reach builds after posting', 'sub': 'Total people reached, hours after posting', 'example': True,
   'points': [('1h', 600), ('3h', 1400), ('6h', 2100), ('12h', 2600), ('24h', 2900), ('48h', 3000)],
   'unit': 'People reached', 'note': 'Made-up numbers for one Instagram post. Timing differs by app and post.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, engagement and followers for every channel side by side.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Our free calculator turns reach and engagements into a rate you can compare.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for logging reach by post and month.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is the difference between reach and impressions?', 'Reach counts unique people who saw your content. Impressions count every view, so one person can create several impressions.'),
  ('What is a good reach rate on social media?', 'It depends on the app, your niche and your account size. Compare against your own past posts to see if you are improving.'),
  ('Can reach be higher than followers?', 'Yes. When people share your post or the app recommends it, people who do not follow you can see it, which can push reach above your follower count.'),
  ('Can I add up reach from several posts?', 'Only as a rough guide. The same person may have seen more than one post, so the sum counts some people twice.'),
  ('Why did my reach drop?', 'Common reasons include posting at a different time, a format your audience likes less or simply a weaker post. Look at several weeks before deciding something is wrong.'),
 ],
 'related': ['impressions', 'organic-reach', 'engagement-rate', 'analytics', 'viral'],
},
{
 'slug': 'remix',
 'short': "A remix is an Instagram feature that lets you create your own Reel using someone else's Reel, either side by side, after it or as a backdrop.",
 'body': '''<h2>What is a remix?</h2>
<p>On Instagram, a remix is a Reel you make by building on another public Reel. You can play your clip next to the original, add your clip after it or react to it in other layouts. The original creator gets credit on your remix, and people can tap through to see their Reel.</p>
<p>The idea is close to TikTok's duet and stitch features. People use remixes to react, answer a question, try a challenge, add a joke or show their own version of a trend. Some apps also use "remix" more loosely for reusing a sound or a template.</p>
<h2>How remix works</h2>
<p>Remixing is available on public Reels whose creators allow it. When you remix, Instagram usually lets you choose a layout:</p>
<ul>
<li><b>Side by side:</b> your video plays next to the original.</li>
<li><b>Sequential:</b> your clip plays after a part of the original.</li>
<li><b>Green screen:</b> the original plays behind you.</li>
<li><b>Picture in picture:</b> a small view of one clip sits on top of the other.</li>
</ul>
<p>Layout choices change over time, so check the remix screen in the app for what is offered now. Your remix lives on your profile as your own Reel, with its own views, likes and comments, and a credit link back to the original.</p>
<p>A remix lets you join a conversation that already has an audience. If a Reel is getting lots of views, a smart reaction to it can catch some of that interest. It also saves you from starting every idea from scratch. The original gives you the setup, and you bring the twist.</p>
<p>For the creator being remixed, it can mean new viewers. People who enjoy your remix may tap through and follow them too.</p>
<p>Remixes also make it easy to show your expertise. A dentist reacting to a tooth-brushing trend, or a chef reacting to a cooking shortcut, can teach something in seconds because the original video already set up the question.</p>
<h2>How to remix a Reel, step by step</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Open the Reel you want to remix.</b> Make sure it is something you are glad to put your name next to.</li>
<li><b>Tap the share or menu icon and choose Remix.</b></li>
<li><b>Pick a layout</b> that fits your idea. A reaction works side by side. An answer works after the clip.</li>
<li><b>Record or upload your part.</b> Keep it short and get to your point fast.</li>
<li><b>Add text and captions</b> so it works with the sound off.</li>
<li><b>Write your caption and post.</b> Say why you made it, and keep the credit in place.</li>
</ol>
<h2>Remix vs duet vs stitch</h2>
<p>These features overlap. Instagram remix covers several layouts in one place. TikTok splits them up: a duet plays your video next to the original, and a stitch plays a short piece of the original before your clip. The goal is the same in all of them: build on someone else's video and give them credit.</p>
<figure data-chart="2"></figure>
<h2>How to control remixes of your Reels</h2>
<p>You can turn remixing on or off in your settings for all future Reels, or change it on a single Reel from its menu. If you share a lot of personal content, such as your kids or your home, you may want to keep it off. If you want more reach, leaving it on gives others a reason to share your work. You can check who remixed you by looking at the remixes linked from your Reel.</p>
<p>To measure how remixes help you, compare the reach of your remixes with your regular Reels. If remixes keep finding more non-followers, they are a good way to meet new people. If they do worse, your audience may prefer your own ideas.</p>
<h2>Ideas for brands</h2>
<ul>
<li><b>Thank a customer</b> by remixing their review Reel and showing the product in use.</li>
<li><b>Answer a question</b> someone asked in a Reel, in sequence after their clip.</li>
<li><b>Join a trend</b> with your team's own take.</li>
<li><b>Show the real thing</b> next to a mock-up or a recipe attempt.</li>
<li><b>Invite remixes</b> by posting a Reel that leaves room for others to respond, such as a question or a challenge.</li>
</ul>
<p>For example, a made-up hardware store might remix a viral "shelf fail" Reel by placing a clip of its staff hanging the same shelf the right way next to it, with the caption "Two screws make all the difference."</p>
<h2>Common mistakes</h2>
<ul>
<li>Remixing to mock the original creator. They and their followers will see it.</li>
<li>Adding nothing new, so the remix is just a copy with your face in the corner.</li>
<li>Remixing a Reel that has sounds or images you have no right to use in an ad.</li>
<li>Making your part too long. The original already used some of the viewer's patience, so get to your point quickly.</li>
<li>Forgetting captions. Many people watch Reels with the sound off, and a reaction with no text can be hard to follow.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Remix a Reel', 'steps': [
    ('Pick the Reel', 'A public Reel you are glad to build on.'),
    ('Choose Remix', 'From the share or menu icon.'),
    ('Pick a layout', 'Side by side for reactions, after the clip for answers.'),
    ('Record your part', 'Short, with on-screen text.'),
    ('Post with credit', 'Write a caption and keep the credit in place.')]},
  {'type': 'versus', 'title': 'Instagram remix vs TikTok duet', 'cols': ['Instagram remix', 'TikTok duet'],
   'rows': [('Builds on another video', True, True), ('Side by side layout', True, True), ('Clip after the original', True, 'Done with stitch'), ('Original creator credited', True, True), ('Creator can turn it off', True, True)]},
 ],
 'tools': [
  {'name': 'CapCut', 'url': 'https://www.capcut.com/', 'domain': 'capcut.com', 'line': 'A video editor for trimming and adding captions to your part before you record the remix.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Compare reach and engagement on your Reels to see which ones earned the most attention.'},
 ],
 'faqs': [
  ('What does remix mean on Instagram?', "It means making your own Reel that builds on someone else's Reel, such as reacting side by side or adding a clip after theirs. The original creator is credited."),
  ('Can I stop people from remixing my Reels?', 'Yes. You can turn remixing off for all your Reels in settings or switch it off on one Reel from its menu.'),
  ('Is remix the same as a TikTok duet?', "They are similar ideas. Both let you build a new video on top of someone else's, but each app has its own layouts and rules."),
  ('Does the original creator know I remixed their Reel?', 'Usually yes. Remixes credit and link to the original, and creators can see remixes of their Reels.'),
 ],
 'related': ['instagram-reels', 'duet', 'stitch', 'trend', 'collab-post'],
},
{
 'slug': 'repost',
 'short': "A repost is when you share someone else's post with your own followers, either with a built-in repost button or by posting it again with credit.",
 'body': '''<h2>What is a repost?</h2>
<p>Reposting means passing another account's content on to your audience. On some apps, a repost button does it in one tap. The post appears in your followers' feeds and on your profile, still showing the original author. On X this used to be called a retweet. Mastodon calls it a boost. Threads, Bluesky, TikTok and LinkedIn all have their own repost buttons.</p>
<p>On apps without such a button, people repost by downloading a photo or video and posting it again on their own account with credit to the creator, or by sharing it to their story.</p>
<p>Reposting is one of the oldest habits on social media. It is how ideas spread from one circle of friends to the next. When lots of people repost the same thing in a short time, that is often what people mean when they say a post went viral.</p>
<h2>Repost vs quote post</h2>
<p>A repost shares the original exactly as it is. A quote post adds your own comment above the original. Use a repost when the content speaks for itself, and a quote post when you have something to add.</p>
<figure data-chart="1"></figure>
<h2>Why reposting matters</h2>
<ul>
<li>It helps creators and partners reach more people.</li>
<li>It fills your feed with useful content on days you have less to share.</li>
<li>Sharing customer posts is a strong form of social proof.</li>
<li>It shows you are part of a community, beyond posting about yourself.</li>
<li>It builds goodwill with the accounts you share.</li>
<li>It tells you what your audience likes from others, which can shape your own posts.</li>
</ul>
<h2>Two kinds of reposts</h2>
<p>A <b>button repost</b> uses the app's own feature. The original stays linked, its likes and comments stay with the author, and credit is built in. This is the simplest and safest way to share.</p>
<p>A <b>re-upload</b> is when you save the photo or video and post it again yourself. It becomes your own post, with its own numbers. This is common on Instagram for customer photos. It also carries more risk, because you are publishing someone else's work under your account. Always ask first.</p>
<p>There is also a middle option on some apps: sharing a post to your story. The story links back to the original, so credit stays in place, and it fades after a day instead of sitting in your feed for good.</p>
<h2>How to repost the right way, step by step</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Use the built-in repost button when there is one.</b> It keeps credit attached.</li>
<li><b>Ask for permission before a re-upload.</b> A short comment or message works: "We love this photo. Can we share it on our page with credit?"</li>
<li><b>Keep a record of the yes.</b> A screenshot or a note in a spreadsheet saves trouble later.</li>
<li><b>Credit clearly.</b> Tag the creator's handle in the caption and, where you can, on the image.</li>
<li><b>Leave the content as it is.</b> Don't crop out watermarks or change it in a way that hides who made it.</li>
<li><b>Add your own short caption</b> so followers know why you shared it.</li>
</ol>
<p>For example, a made-up bike shop might spot a customer's photo of a sunrise ride on a bike they bought there. The shop comments to ask if it can share the photo, gets a yes, reposts it with "Sunrise ride by @alexrides" and thanks them in the caption.</p>
<h2>How to balance reposts with your own posts</h2>
<p>Reposts are a helpful side dish. Your own posts are still the main meal, since they are the reason people follow you instead of the original accounts. Many brands keep reposts to a small share of their feed and save them for things that add real value, like customer stories or partner news.</p>
<p>Watch how your reposts do compared with your own posts. If customer photos you re-upload get more saves and comments than your studio shots, that tells you what your audience trusts. It may be worth asking customers for more photos, or shooting your own posts in a more natural style.</p>
<figure data-chart="3"></figure>
<h2>Common mistakes</h2>
<ul>
<li><b>Re-uploading without asking.</b> It can break copyright rules and upset creators.</li>
<li><b>Using customer content in ads without written permission.</b> Permission to repost does not cover paid ads.</li>
<li><b>Weak credit.</b> A tag buried after many hashtags is easy to miss.</li>
<li><b>Reposting too much.</b> A feed that is mostly reposts gives people little reason to follow you.</li>
<li><b>Reposting without reading.</b> Check the original account and any replies before you share.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Repost vs quote post', 'cols': ['Repost', 'Quote post'],
   'rows': [('Adds your own words', False, True), ('Shows the original as it is', True, True), ('Credit built in', True, True), ('Best when', 'The post speaks for itself', 'You have something to add')]},
  {'type': 'steps', 'title': 'Re-upload with permission', 'steps': [
    ('Spot it', 'Find a customer or partner post worth sharing.'),
    ('Ask', 'Comment or message to ask if you can share it with credit.'),
    ('Record the yes', 'Save a screenshot or note of the reply.'),
    ('Post with credit', 'Tag the creator in the caption and on the image.')]},
  {'type': 'stack', 'title': 'One way to mix your feed', 'sub': 'Share of monthly posts', 'example': True,
   'parts': [('Your own posts', 70), ('Customer reposts', 15), ('Partner reposts', 10), ('Team reposts', 5)],
   'note': 'Made-up mix for one brand. There is no set rule.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Spot mentions from customers who post about you, then reply to ask if you can share their post.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Schedule credited re-uploads on your calendar next to your own posts.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for keeping a log of who gave permission and when.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ("Is it legal to repost someone's content?", "Using an app's built-in repost button is generally allowed by that app's terms. Downloading and posting someone's work as your own without permission can break copyright law, so ask first."),
  ('How do you credit a repost?', "Tag the original creator's handle in the caption and, if you can, on the image or video. Say clearly that the content is theirs."),
  ('Can people see if I repost their content?', 'On most apps with a repost button, the original author gets a notification. Your repost also shows where your followers can see it.'),
  ('Can I undo a repost?', 'Yes. On apps with a repost button, tap it again to remove the repost. A re-upload is your own post, so you delete it like any other post.'),
 ],
 'related': ['quote-post', 'user-generated-content', 'social-proof', 'mention', 'tag'],
},
]

TERMS += [
{
 'slug': 'retargeting',
 'short': 'Retargeting is showing ads to people who already visited your website, used your app or engaged with your content, to bring them back.',
 'body': '''<h2>What is retargeting?</h2>
<p>Retargeting is a way to remind people about you after they leave. Someone looks at a pair of shoes on your site, then later sees an ad for those shoes on Instagram or Facebook. That is retargeting. It focuses your ad money on people who already showed interest, so they are more likely to act than strangers.</p>
<p>You may also hear it called remarketing. People often use the two words to mean the same thing. Some use remarketing for email reminders and retargeting for ads, but the goal of bringing people back is the same.</p>
<p>Most people don't buy the first time they visit a site. They get distracted, want to compare or simply aren't ready. Retargeting gives them a second and third chance to come back when they are.</p>
<h2>How retargeting works</h2>
<ol>
<li><b>You add a tracking tag.</b> Ad platforms give you a small piece of code, often called a pixel, to place on your website. Apps use a similar tool built into their code.</li>
<li><b>Visitors are added to a list.</b> When someone visits a page or takes an action, the tag records it.</li>
<li><b>You build an audience.</b> In the ads manager, you create a group such as "visited the pricing page" or "added to cart but did not buy".</li>
<li><b>You show ads to that group.</b> The ads appear while those people browse social apps or other sites.</li>
<li><b>You remove people who finished.</b> Buyers drop out of the list, so you stop paying to remind them.</li>
</ol>
<p>You can also retarget people who watched your videos, opened a lead form, followed your page or sent you a message, without any website tag. These lists live inside the ad platform and are built from activity on that platform.</p>
<h2>A retargeting funnel</h2>
<p>Retargeting works best when you match the ad to how far someone got. A person who read one blog post needs a gentler nudge than someone who left a full cart. The made-up funnel below shows how a shop might bring back some of the people who left. Not everyone on the list will see the ad, since some won't open a social app during the campaign, and only a share of those who see it will click.</p>
<figure data-chart="1"></figure>
<h2>Examples of retargeting</h2>
<ul>
<li>A shop shows the exact product a visitor left in their cart.</li>
<li>A software company shows a demo video to people who read its pricing page.</li>
<li>A course creator offers a free lesson to people who watched most of a video.</li>
<li>A restaurant reminds past website visitors about a new menu.</li>
<li>A charity shows a thank-you story to people who started a donation form and stopped.</li>
</ul>
<h2>How to set up a retargeting campaign, step by step</h2>
<ol>
<li><b>Install the tag</b> from each ad platform you use, and check that it fires on key pages.</li>
<li><b>Decide on your groups.</b> Start with two or four, such as all visitors, product viewers, cart leavers and video viewers.</li>
<li><b>Pick a time window.</b> Someone who visited yesterday is warmer than someone from two months ago. Shorter windows usually suit cart reminders.</li>
<li><b>Write an ad for each group.</b> Show the product they viewed, answer a common doubt or offer a next step.</li>
<li><b>Set a frequency cap</b> so the same person doesn't see your ad too many times.</li>
<li><b>Exclude buyers</b> and people who already signed up.</li>
<li><b>Track results</b> with UTM tags and conversion goals, then adjust.</li>
</ol>
<h2>Retargeting vs lookalike audiences</h2>
<p>Retargeting reaches people who already know you. A lookalike audience reaches new people who share traits with your customers. Retargeting usually gets better results per person, but its audience is smaller. Most ad plans use both, with lookalikes to find new people and retargeting to bring them back.</p>
<figure data-chart="2"></figure>
<h2>Privacy and good practice</h2>
<p>Retargeting relies on tracking, so follow privacy laws and each platform's rules. Tell visitors what you track in your privacy notice and get consent where the law requires it. Browser and phone privacy settings can also make retargeting lists smaller than they used to be, so lists built from activity on the platform itself matter more.</p>
<p>Limit how often the same person sees your ad, and stop showing it after they buy. Being followed by the same ad for weeks annoys people and can turn interest into dislike. Common mistakes include showing a discount to everyone, which teaches people to leave and wait, and running one generic ad to every group.</p>''',
 'charts': [
  {'type': 'funnel', 'title': 'Bringing back cart leavers', 'sub': 'One month of a retargeting campaign', 'example': True,
   'stages': [('Left a cart', 2000, '2,000'), ('Saw a retargeting ad', 1400, '1,400'), ('Clicked the ad', 210, '210'), ('Finished buying', 70, '70')],
   'unit': 'People', 'note': 'Made-up numbers to show the steps. Your results will differ.'},
  {'type': 'versus', 'title': 'Retargeting vs lookalike audience', 'cols': ['Retargeting', 'Lookalike'],
   'rows': [('Reaches people who know you', True, False), ('Finds new people', False, True), ('Audience size', 'Smaller', 'Larger'), ('Needs a tag or past activity', True, 'Needs a source list'), ('Typical goal', 'Bring people back', 'Find new customers')]},
 ],
 'tools': [
  {'name': 'Meta Ads Manager', 'url': 'https://www.facebook.com/business/tools/ads-manager', 'domain': 'facebook.com', 'line': 'The tool for building retargeting audiences and ads on Facebook and Instagram.'},
  {'name': 'LinkedIn Campaign Manager', 'url': 'https://business.linkedin.com/marketing-solutions/ads', 'domain': 'linkedin.com', 'line': 'The tool for running LinkedIn ads, including ads to people who visited your site.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags ad links so your analytics can show what retargeted visitors did.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics for checking which retargeting ads led to sales or sign-ups.'},
 ],
 'faqs': [
  ('What is the difference between retargeting and remarketing?', 'Most people use the words to mean the same thing. Some use remarketing for email reminders and retargeting for ads, but the goal of bringing people back is the same.'),
  ('Do I need a pixel for retargeting?', 'You need a pixel or similar tag to retarget website visitors. You can retarget people who engaged with your social posts or videos without one.'),
  ('Is retargeting allowed under privacy laws?', 'It is allowed in many places when you follow the rules, such as getting consent and explaining what you track. Check the laws that apply where your customers live.'),
  ('How often should someone see a retargeting ad?', 'There is no single number. Set a frequency cap in your ads tool, watch for falling clicks and rising hides, and lower it if people seem tired of the ad.'),
 ],
 'related': ['paid-social', 'lookalike-audience', 'conversion-rate', 'customer-journey', 'cost-per-click'],
},
{
 'slug': 'return-on-investment',
 'short': 'Return on investment (ROI) is a measure of how much you gained from something compared with what it cost, usually shown as a percentage.',
 'body': '''<h2>What is return on investment (ROI)?</h2>
<p>ROI answers one question: was it worth it? It compares what you got back from an activity with what you put in. In social media, the activity might be a whole channel, an ad campaign, an influencer deal or a single launch.</p>
<p>If the result is above zero, you made more than you spent. If it is below zero, you lost money. A result of exactly zero means you broke even.</p>
<p>ROI is useful because it puts very different things on the same scale. You can compare a creator deal with a month of ads, or one channel with another, as long as you count costs and returns the same way for each. That makes it easier to decide where your next hour or your next budget should go.</p>
<h2>How to calculate ROI</h2>
<figure data-chart="1"></figure>
<p>Take the value you gained, subtract what it cost, divide by the cost and multiply by 100. With the made-up numbers above, a campaign that cost 2,000 and brought in 5,000 has an ROI of 150%. For every 1 you spent, you got your 1 back plus 1.50 more.</p>
<p>The math is simple. The hard part is deciding what goes into "return" and "cost", and tracking both honestly.</p>
<h2>What counts as cost and return</h2>
<p>Costs usually include:</p>
<ul>
<li>Ad spend.</li>
<li>Pay for staff or freelancers, based on the hours they spend.</li>
<li>Software and tools.</li>
<li>Creator or influencer fees.</li>
<li>Photo, video and design costs.</li>
<li>Product you give away in contests or to creators.</li>
</ul>
<p>Time is the cost people forget most. A post that took a full day to make has a real price, even if you paid nothing to publish it.</p>
<p>On the other side, the clearest return is revenue: sales you can trace to social media. Other returns can be given a money value too, such as leads, sign-ups, booked calls or support costs you saved by answering questions publicly. If one in ten leads becomes a customer worth 500, each lead is worth about 50. Decide in advance what you will count, and stick to it so numbers can be compared over time.</p>
<h2>How to track social media ROI, step by step</h2>
<ol>
<li><b>Set a clear goal</b> for each campaign, such as sales, sign-ups or booked demos.</li>
<li><b>Add UTM parameters to every link</b> so your analytics can tell which posts sent visitors.</li>
<li><b>Set up conversion tracking</b> on your website or store, so a sale or sign-up is recorded.</li>
<li><b>Give non-sales goals a value.</b> Work out what a lead or a sign-up is worth to you.</li>
<li><b>Record all costs</b>, including hours spent, in one place.</li>
<li><b>Compare return and cost</b> at the end of each month or campaign, and write down what you learn.</li>
</ol>
<h2>ROI vs ROAS</h2>
<p>ROAS, or return on ad spend, looks only at ad money: revenue from ads ÷ ad spend. ROI looks at all costs, including people and tools. A campaign can have a healthy ROAS and still lose money once everything else is counted.</p>
<figure data-chart="2"></figure>
<p>Both numbers are useful. ROAS is quick to check inside an ads tool and helps you compare ads with each other. ROI tells you whether the whole effort paid off for the business.</p>
<h2>ROI for organic social</h2>
<p>Organic posts cost nothing to publish, but they still cost time. For organic social, the main cost is usually the hours your team spends planning, writing, filming and replying. Track those hours for a month, put a value on them and compare that with the sales and leads your tagged links brought in. Some value is hard to track, like people who saw your posts and later searched for you by name. Note it, but don't guess it into your numbers.</p>
<p>A simple habit helps. At the end of each month, write one line per channel: hours spent, money spent, tracked sales and leads. After a few months, you'll see which channels pay their way and which ones need a new plan.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Counting likes and followers as return.</b> They can lead to sales, but they are signs of progress, so treat them as steps on the way.</li>
<li><b>Leaving out time.</b> Free to post doesn't mean free to make.</li>
<li><b>Judging too soon.</b> Some buyers see your posts for months before they act, so look at longer periods as well as single campaigns.</li>
<li><b>Changing what you count</b> from one report to the next, which makes trends meaningless.</li>
<li><b>Taking credit for every sale.</b> If people also saw an email or a search ad, social media is one part of the story.</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Return on investment', 'formula': 'ROI = (return - cost) ÷ cost × 100',
   'note': 'Made-up numbers to show the math.', 'result': '150%',
   'example': [('Return', '5,000'), ('Cost', '2,000')]},
  {'type': 'bars', 'title': 'Same campaign, two answers', 'sub': 'ROAS counts only ad spend. ROI counts every cost.', 'example': True,
   'rows': [('ROAS (5,000 ÷ 1,200 ad spend)', 4.2, '4.2x'), ('ROI after staff and tools (2,000 total cost)', 1.5, '150%')],
   'highlight': 'ROI after staff and tools (2,000 total cost)', 'unit': 'Result', 'note': 'Made-up numbers. The ad looks great on its own, but the full cost tells a calmer story.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach and engagement across channels, with reports on Pro and Agency plans.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags links so you can trace visits and sales back to each post.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics for counting the sales and sign-ups that came from social media.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for adding up costs, hours and returns each month.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('How do you calculate social media ROI?', 'Subtract your total costs from the value you gained, divide by the costs and multiply by 100. Count time, tools and ad spend as costs.'),
  ('What is a good ROI for social media?', 'Any ROI above zero means you earned more than you spent. What counts as good depends on your business, margins and goals.'),
  ('Can you measure ROI on organic social?', 'Yes, though it takes more setup. Use tracked links and conversion goals, and count the time your team spends as the main cost.'),
  ('What is the difference between ROI and ROAS?', 'ROAS divides ad revenue by ad spend only. ROI subtracts every cost, including staff and tools, so it shows whether the whole effort paid off.'),
 ],
 'related': ['key-performance-indicator', 'conversion-rate', 'utm-parameters', 'analytics', 'vanity-metrics'],
},
{
 'slug': 'rich-pin',
 'short': "A Rich Pin is a Pinterest pin that pulls extra details, like a product's price or a recipe's ingredients, straight from your website.",
 'body': '''<h2>What is a Rich Pin?</h2>
<p>A Rich Pin is a pin that shows more than a picture and a title. It reads information from the web page it links to and displays it on the pin. If the details on your page change, the pin can update to match. That makes Rich Pins useful for shops, food blogs and publishers that share a lot of content on Pinterest.</p>
<p>A regular pin only knows what you type into it. A Rich Pin also knows what your website says about the page, such as the price of a lamp, the cook time of a soup or the author of an article. People see those details before they tap.</p>
<h2>Types of Rich Pins</h2>
<ul>
<li><b>Product Pins:</b> show details such as price and whether an item is in stock.</li>
<li><b>Recipe Pins:</b> show a recipe's title, ingredients and serving details.</li>
<li><b>Article Pins:</b> show the headline, author and a short description of a blog post or story.</li>
</ul>
<p>Pinterest has offered other kinds in the past and may change the list again, so check its help pages for the current types.</p>
<h2>How Rich Pins work</h2>
<p>Rich Pins rely on metadata, the hidden tags in your page's code that describe what is on it. Pinterest reads standard formats such as Open Graph tags and schema markup. When someone saves a pin from your site, Pinterest checks those tags and adds the details to the pin. Later, it checks the page again from time to time and updates the pin if the details changed.</p>
<p>That means the work happens on your website. Once your pages have good tags and Rich Pins are turned on, every pin from your site can carry the extra details, including pins that other people save.</p>
<figure data-chart="1"></figure>
<h2>How to set up Rich Pins, step by step</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Check your metadata.</b> Many website builders, store platforms and SEO plugins add it for you. Look in a page's source code for tags such as og:title and og:description, or product and recipe schema.</li>
<li><b>Claim your website</b> on your Pinterest business account, so Pinterest knows the site is yours.</li>
<li><b>Turn on Rich Pins</b> using Pinterest's current steps, which may include checking a sample page.</li>
<li><b>Save a test pin</b> from one of your pages and confirm the extra details appear.</li>
<li><b>Check a few page types</b>, such as a product, a recipe and a blog post, since each uses different tags.</li>
</ol>
<p>Pinterest updates its setup steps from time to time, so follow its help pages for the latest version.</p>
<h2>Why Rich Pins matter</h2>
<p>The extra details help people decide before they click. A shopper can see the price on the pin. A home cook can see the ingredients and know right away if the recipe works for them. That means the people who do click are more likely to be a good fit, which can make your website visits more useful.</p>
<p>Rich Pins also save time. Because the data comes from your site, you don't have to type it into every pin by hand, and you avoid pins with old prices. For a shop with hundreds of products, that alone is a big help.</p>
<p>For example, a made-up candle shop might find that its Product Pins show the price and "in stock" right on the pin. Shoppers who tap through already know what it costs, so fewer of them leave the product page right away.</p>
<h2>How to tell if Rich Pins help</h2>
<p>Compare pins from before and after you turned Rich Pins on, or compare pages with good tags against pages without. Look at saves and outbound clicks in Pinterest analytics, and what visitors do on your site in your website analytics. Give it a few weeks, since pins build slowly. If saves stay flat but clicks from those pins turn into more sales or longer visits, the extra details are doing their job of sending better fitting visitors.</p>
<h2>Common problems and fixes</h2>
<ul>
<li><b>Details missing on the pin.</b> The page tags may be missing or broken. Check the source code first.</li>
<li><b>Wrong price or title.</b> The pin shows what your tags say, so fix the tags on your site.</li>
<li><b>Only some pages work.</b> Different page templates may have different tags. Check each template.</li>
<li><b>Website not claimed.</b> Claim it in your business account settings.</li>
<li><b>Messy titles.</b> Page titles stuffed with keywords now appear on Pinterest too, so keep them clear.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Standard pin vs Rich Pin', 'cols': ['Standard pin', 'Rich Pin'],
   'rows': [('Image, title and link', True, True), ('Extra details from your site', False, True), ('Updates when your page changes', False, True), ('Needs page metadata', False, True), ('Needs a claimed website', False, True)]},
  {'type': 'steps', 'title': 'Turn on Rich Pins', 'steps': [
    ('Check tags', 'Make sure pages have Open Graph or schema metadata.'),
    ('Claim your site', 'Connect your website to your Pinterest business account.'),
    ('Turn them on', "Follow Pinterest's current steps."),
    ('Test a pin', 'Save a pin from your site and look for the extra details.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Pinterest scheduler', 'url': '/pinterest-pin-scheduler', 'line': 'Plan pins that link to your product, recipe and article pages on one calendar.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for making tall pin images for your Rich Pins.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics for seeing what Pinterest visitors do after they tap a pin.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Are Rich Pins free?', 'Yes. Rich Pins cost nothing. You only need a website with the right metadata and a Pinterest business account.'),
  ('Why are my Rich Pins not working?', 'The most common cause is missing or broken metadata on your pages. Check your page tags and that your website is claimed on Pinterest.'),
  ('Do Rich Pins update automatically?', 'Rich Pins pull details from your website, so changes to your page can show up on the pin over time.'),
  ('Do I need to make Rich Pins one by one?', 'No. Once Rich Pins are on for your site, pins saved from pages with the right tags get the extra details on their own.'),
 ],
 'related': ['pin', 'pinterest', 'open-graph', 'social-commerce', 'saves'],
},
{
 'slug': 'rss-feed',
 'short': 'An RSS feed is a file a website publishes that lists its newest posts in a standard format, so apps and tools can pick up new content automatically.',
 'body': '''<h2>What is an RSS feed?</h2>
<p>RSS stands for Really Simple Syndication. An RSS feed is a page of code that a blog, news site or podcast updates every time it publishes something new. Each item in the feed usually has a title, a link, a date and a short summary. Feed reader apps and other tools check the feed and show you new items without you having to visit the site.</p>
<p>Podcasts run on RSS too. When you subscribe to a show in a podcast app, the app is following its RSS feed. That is one reason RSS is still around years after many people thought it would fade.</p>
<p>You may also see Atom feeds or JSON feeds. They do the same job in a slightly different format, and most tools read all of them.</p>
<h2>How RSS feeds work</h2>
<figure data-chart="1"></figure>
<p>Here is the flow in plain terms. A site publishes a new post, and its feed adds the item at the top. Apps that follow the feed check it on a regular schedule, every few minutes or every few hours depending on the tool. When they find something new, they show it to you or act on it, for example by creating a draft social post.</p>
<p>The site never has to tell anyone about a new post. The feed just sits at a fixed address, and anyone who wants updates checks it. That makes RSS simple and private. The site doesn't need to know who follows the feed, and the reader doesn't need an account on the site.</p>
<h2>How RSS feeds help with social media</h2>
<ul>
<li><b>Auto-sharing:</b> tools can watch your blog's feed and create a social post each time you publish.</li>
<li><b>Content curation:</b> follow feeds from trusted sites to find articles worth sharing with your audience.</li>
<li><b>Staying informed:</b> track industry news in one place without endless browsing.</li>
<li><b>Following social accounts:</b> some apps, like Mastodon and Bluesky, offer RSS feeds of public profiles.</li>
<li><b>Content ideas:</b> skim headlines from your niche each morning to spot topics people care about.</li>
</ul>
<h2>How to find a site's RSS feed</h2>
<p>Look for an RSS icon, often orange, or a link labeled Feed or Subscribe. Many blogs use an address that ends in /feed or /rss. WordPress sites usually have one at /feed. You can also paste the site's address into a feed reader, which can often find the feed for you. If you run the site, check your website builder's settings, since many create a feed on their own.</p>
<h2>How to share new blog posts from RSS, step by step</h2>
<ol>
<li><b>Find your blog's feed address</b> and open it in a browser to check it lists your latest posts.</li>
<li><b>Connect the feed to an automation tool</b> that can watch for new items.</li>
<li><b>Decide what each new item should create.</b> A draft is safer than a post that goes live right away.</li>
<li><b>Map the fields.</b> Use the title and link, and leave room to add your own hook.</li>
<li><b>Review each draft</b>, add a line written for each network and schedule it.</li>
<li><b>Check the link preview</b> so the right image and title show.</li>
</ol>
<p>For example, a made-up gardening blog might connect its feed so every new article turns into a draft. On Monday, the writer opens the drafts, adds "Three plants that survive a hot balcony" as the hook for one of them and schedules it for Instagram, Threads and Pinterest.</p>
<h2>Auto-posting vs writing each post</h2>
<p>Posting straight from a feed saves time, but posts made that way can look plain and the same on every app. A post you edit by hand takes longer and usually does better.</p>
<figure data-chart="2"></figure>
<h2>Tips and common mistakes</h2>
<ul>
<li><b>Posting raw titles.</b> Add a hook, a question or a few lines of context so the post feels written for each app.</li>
<li><b>Missing link previews.</b> Make sure your pages have Open Graph tags, so the preview shows the right image and title.</li>
<li><b>Old posts flooding out.</b> When you first connect a feed, check that the tool won't post your whole archive at once.</li>
<li><b>Feeds that break.</b> A site redesign can move or remove the feed, so check it after big changes.</li>
<li><b>Sharing others' articles without a thought.</b> Read what you share and add why it matters to your audience.</li>
<li><b>Posting every item.</b> If a site publishes many times a day, filter by topic or keyword so only the best items become drafts.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'From new blog post to social post', 'steps': [
    ('Publish', 'A new post goes live on the site.'),
    ('Feed updates', 'The RSS feed adds the new item at the top.'),
    ('Tool checks', 'An app that follows the feed sees the new item.'),
    ('Draft created', 'The tool makes a draft post with the title and link.'),
    ('Review and schedule', 'You add a hook for each network and schedule it.')]},
  {'type': 'versus', 'title': 'Straight from the feed vs edited by hand', 'cols': ['Straight from feed', 'Edited by hand'],
   'rows': [('Saves time', True, False), ('Hook written for each app', False, True), ('Same text everywhere', True, False), ('Catches mistakes before posting', False, True), ('Good for', 'High volume news', 'Posts you want to stand out')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar API', 'url': '/api', 'line': 'Create posts from your own code, so a script that reads your feed can add them to your calendar.'},
  {'name': 'Zapier', 'url': 'https://zapier.com/', 'domain': 'zapier.com', 'line': 'An automation tool that can watch an RSS feed and pass new items to other apps.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter checks that your hook and link fit each network.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Is RSS still used?', 'Yes. Podcasts depend on RSS, and many news readers, blogs and automation tools still use it every day.'),
  ('How do I get the RSS feed for a website?', "Look for an RSS icon or a feed link, or try adding /feed or /rss to the site's address. A feed reader can often find it from the main address."),
  ('Can I post my blog to social media automatically with RSS?', "Yes. Many scheduling and automation tools can watch your blog's RSS feed and create a post whenever you publish."),
  ('Should RSS posts go live right away?', 'It is safer to create drafts you review first. That way you can add a hook for each network and catch mistakes.'),
 ],
 'related': ['auto-posting', 'social-media-scheduling', 'open-graph', 'evergreen-content', 'api'],
},
{
 'slug': 'saves',
 'short': 'Saves are the number of times people bookmarked your post so they could find it again later, a sign they found it useful.',
 'body': '''<h2>What are saves?</h2>
<p>A save happens when someone taps the bookmark or save button on a post. The post goes into a private collection on their account so they can come back to it. Instagram, TikTok, Pinterest, X, LinkedIn, Facebook and YouTube all offer some way to save content. Some call it bookmarks, favorites, collections or Watch later, but the idea matches.</p>
<p>Most apps show you how many saves a post got in your insights. They usually don't show who saved it. On Pinterest, saving is the main action, and saved pins can be seen on public boards.</p>
<h2>Why saves matter</h2>
<p>A like takes half a second. A save means the person plans to return, which is a stronger sign that your content was worth their time. Many apps treat saves as a signal of value when they decide what to show more people. Saves also show you which topics your audience finds most useful, which helps you plan future posts.</p>
<p>Saves also lead to second views. When someone opens their saved posts a week later, your content gets another moment of attention, often when they are ready to act on it. A saved recipe gets opened at the store. A saved workout gets opened at the gym. That second view is when people are most likely to click your link, buy the product or follow you.</p>
<h2>How to measure saves</h2>
<p>Look at saves on each post in your analytics. A post that reached 20,000 people will often have more saves than one that reached 2,000, so raw counts can mislead. To compare fairly, use the save rate.</p>
<figure data-chart="1"></figure>
<p>Posts with a high save rate are good candidates to turn into a series, a longer guide or an ad. Track save rate by format too. You may find one format earns far more saves than the rest.</p>
<p>Keep a simple monthly log of your top five posts by save rate. Over time, patterns appear. Maybe guides with numbers in the title keep winning, or posts about one topic keep beating the rest. Those patterns are a ready-made list of what to make next.</p>
<figure data-chart="2"></figure>
<h2>How to get more saves, step by step</h2>
<ol>
<li><b>Pick a problem your audience has.</b> Look at the questions in your comments and messages.</li>
<li><b>Make the answer worth keeping.</b> Checklists, step-by-step guides, recipes, templates and cheat sheets all earn saves.</li>
<li><b>Use a format that holds detail.</b> Carousels and longer captions let you pack in more useful points.</li>
<li><b>Make it easy to scan.</b> Short lines, numbered steps and clear headings help people find their place later.</li>
<li><b>Say it is worth saving.</b> A line such as "Save this for your next trip" reminds people the button exists.</li>
<li><b>Check your save rate after a week</b> and make more of what works.</li>
</ol>
<p>For example, a made-up travel creator might post a carousel called "Carry-on packing list for 5 days" with one category per slide. People who are planning a trip save it to check later, which is exactly the point.</p>
<h2>How saves differ by network</h2>
<p>On Instagram and TikTok, saves are a common way to judge useful content, and both show counts in insights. On Pinterest, saving is the core action, so every pin lives or dies by saves. On X and LinkedIn, bookmarks are private and show up less often in public numbers. On YouTube, adding a video to Watch later works like a save. Compare save rates within one app.</p>
<h2>Saves vs likes and shares</h2>
<p>Likes show quick approval. Shares show people want others to see your post. Saves show people want to keep it for themselves. A post with many saves and few likes often holds real, practical value. Funny or emotional posts tend to get shared. Useful posts tend to get saved. Track all of them to see the full picture.</p>
<figure data-chart="3"></figure>
<h2>Common mistakes</h2>
<ul>
<li><b>Asking for saves on posts that offer nothing to keep.</b> People notice the empty request.</li>
<li><b>Comparing raw saves</b> across posts with very different reach.</li>
<li><b>Packing too much into one post</b>, so it becomes hard to read even after saving it.</li>
<li><b>Ignoring old posts with lots of saves.</b> They are proof of what your audience wants, so update and share them again.</li>
<li><b>Hiding the useful part.</b> If the tips sit behind a link, people save the link less often than they would save the tips themselves.</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Save rate', 'formula': 'Save rate = saves ÷ people reached × 100',
   'note': 'Made-up numbers to show the math.', 'result': '2.5%',
   'example': [('Saves', '150'), ('People reached', '6,000')]},
  {'type': 'columns', 'title': 'Save rate by format', 'sub': 'Average over one month', 'example': True,
   'rows': [('Single photo', 0.6, '0.6%'), ('Carousel', 2.8, '2.8%'), ('Reel', 1.4, '1.4%'), ('Quote graphic', 0.4, '0.4%')],
   'highlight': 'Carousel', 'labels': 'all', 'unit': 'Save rate', 'note': 'Made-up numbers for one account. Your formats may rank differently.'},
  {'type': 'versus', 'title': 'Saves vs likes', 'cols': ['Saves', 'Likes'],
   'rows': [('Takes a second', True, True), ('Means they plan to come back', True, False), ('Usually private', True, False), ('Common on useful posts', True, 'Common on all posts'), ('Brings a second view later', True, False)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Compare engagement on posts across channels to find the ones people keep.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for carousels, checklists and other posts worth saving.'},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Our free guide to the right size for carousel slides.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('Can you see who saved your Instagram post?', 'No. Instagram shows how many people saved a post in your insights but does not show their names.'),
  ('Are saves more important than likes?', 'Saves are often seen as a stronger signal because they show the post had lasting value. Both matter, but saves tell you more about usefulness.'),
  ('Where do I find saved posts on Instagram?', 'Go to your profile, open the menu and tap Saved. Your saved posts are only visible to you.'),
  ('How do I work out save rate?', 'Divide saves by the number of people reached and multiply by 100. It lets you compare posts that reached different numbers of people.'),
 ],
 'related': ['shares', 'like', 'engagement-rate', 'carousel-post', 'evergreen-content'],
},
]

TERMS += [
{
 'slug': 'sentiment-analysis',
 'short': 'Sentiment analysis is the process of sorting comments, mentions and messages by the feeling behind them, such as positive, negative or neutral.',
 'body': '''<h2>What is sentiment analysis?</h2>
<p>Sentiment analysis looks at what people write and judges the mood of it. A comment like "Love the new update, it saves me so much time" is positive. "Still waiting for a reply after two days" is negative. "Does this come in blue?" is neutral. Doing this by hand works for a few comments. For hundreds or thousands, teams use software that reads the text and labels it automatically.</p>
<p>On social media, sentiment analysis is often part of social listening and inbox tools. It helps you see how people feel about your brand, a product, a campaign or a topic, and how that feeling changes over time.</p>
<h2>How sentiment analysis works</h2>
<p>Modern tools use AI language models trained on large amounts of text. They read each message, look at the words, the order and the context, and give it a label or a score. A score might run from very negative to very positive, with neutral in the middle. Some tools go further and spot specific feelings, such as anger, joy or confusion, or tie the mood to a topic, like shipping, price or support.</p>
<p>Older tools counted good and bad words. They were fast but easy to fool. Today's models handle context better, though they still make mistakes, which is why a person should always check the results.</p>
<p>Once each message has a label, the tool adds them up. You see a split for a post, a week or a campaign, like the made-up one below.</p>
<figure data-chart="1"></figure>
<h2>Why sentiment analysis matters</h2>
<ul>
<li><b>Spot problems early:</b> a jump in negative mentions can warn you about a bug, a delay or a bad ad.</li>
<li><b>Sort your inbox:</b> angry or urgent messages can rise to the top so someone replies first.</li>
<li><b>Measure campaigns:</b> see whether people liked a launch, beyond how many talked about it.</li>
<li><b>Compare with competitors:</b> check how the mood around your brand stacks up.</li>
<li><b>Find fans:</b> very positive comments point to customers who might share a review or join a program.</li>
</ul>
<h2>How to use sentiment analysis, step by step</h2>
<ol>
<li><b>Decide what to track:</b> your brand name, products, campaigns or industry topics.</li>
<li><b>Collect the messages</b> with a listening or inbox tool, so comments, mentions and messages from every channel land in one place.</li>
<li><b>Label them</b> with the tool, or with an AI assistant for a smaller batch.</li>
<li><b>Review the trend each week</b>, as well as single posts. A steady week matters more than one loud comment.</li>
<li><b>Read a sample from each group</b> to check the labels make sense for your audience.</li>
<li><b>Act on what you find</b>, such as fixing a common complaint or thanking happy customers.</li>
</ol>
<p>For example, a made-up food delivery app might see negative comments jump from about one in ten to one in four over two weeks. Reading a sample shows most of them mention late orders in one city. The team fixes the driver shortage there, posts an update and watches the share of negative comments fall again.</p>
<figure data-chart="2"></figure>
<h2>How to measure sentiment</h2>
<p>The simplest measure is the share of messages in each group: positive, neutral and negative. Some teams also track net sentiment, which is the positive share minus the negative share. Whatever you pick, use the same tool and the same rules every time, or your trend will jump for reasons that have nothing to do with your customers.</p>
<p>It also helps to split sentiment by topic. Overall mood may look fine while one topic, like returns, keeps getting worse.</p>
<h2>Limits of sentiment analysis</h2>
<p>Software can misread sarcasm. "Great, my order is late again" uses a positive word with a negative meaning. Slang, emoji, inside jokes, other languages and mixed messages are hard too. "The product is amazing but support is awful" holds two moods at once.</p>
<p>Treat sentiment scores as a guide and always have a person read the messages that matter most, especially complaints and anything that could become a crisis. Never reply to a customer based on a label alone.</p>
<h2>Common mistakes</h2>
<ul>
<li>Trusting the labels without ever reading the messages behind them.</li>
<li>Panicking over one bad day instead of watching the weekly trend.</li>
<li>Counting only positive and negative and ignoring the neutral group, where many questions hide.</li>
<li>Changing tools and comparing the new numbers with the old ones.</li>
</ul>''',
 'charts': [
  {'type': 'stack', 'title': 'Mood of comments on a launch post', 'sub': '600 comments labeled by a sentiment tool', 'example': True,
   'parts': [('Positive', 330), ('Neutral', 180), ('Negative', 90)],
   'note': 'Made-up numbers to show how a split looks.'},
  {'type': 'line', 'title': 'Share of negative comments by week', 'sub': 'Before and after fixing late orders', 'example': True, 'suffix': '%',
   'points': [('Week 1', 10), ('Week 2', 12), ('Week 3', 25), ('Week 4', 24), ('Week 5', 15), ('Week 6', 11)],
   'unit': 'Negative share', 'note': 'Made-up numbers for one brand.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Bring comments and mentions from every channel into one place, with suggested replies on paid plans.'},
  {'name': 'Claude', 'url': 'https://claude.ai/', 'domain': 'claude.ai', 'line': 'An AI assistant that can sort a batch of comments by mood and sum up the main themes.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for tracking your weekly sentiment split.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is an example of sentiment analysis?', 'A tool reads the comments on a product launch post and labels most of them positive, a few negative and the rest neutral. You then read the negative ones to see what went wrong.'),
  ('How accurate is sentiment analysis?', 'It works well on clear, simple messages but can miss sarcasm, slang and mixed feelings. Check a sample by hand to judge how well it fits your audience.'),
  ('Is sentiment analysis the same as social listening?', 'No. Social listening is gathering and studying what people say about a topic. Sentiment analysis is one part of it that judges the mood of those messages.'),
  ('What is net sentiment?', 'Net sentiment is the share of positive messages minus the share of negative ones. It turns the split into one number you can track over time.'),
 ],
 'related': ['social-listening', 'share-of-voice', 'social-customer-service', 'mention', 'community-management'],
},
{
 'slug': 'shadowban',
 'short': "A shadowban is an informal name for when an app limits who sees an account's posts without telling the owner, so reach drops with no clear reason.",
 'body': '''<h2>What is a shadowban?</h2>
<p>People say they have been shadowbanned when their posts suddenly stop reaching others. The account still works, and the owner can post as normal, but the posts may not show in hashtags, search, recommendations or followers' feeds. Because there is no notice, it can feel like being banned in secret.</p>
<p>Most platforms don't use the word shadowban. They do say they may limit how widely some content is recommended, for example posts that break their rules or their recommendation guidelines. Many reach drops people blame on shadowbans have other causes, such as changes to the algorithm, a new format that didn't land or a shift in when followers are online.</p>
<h2>How limited reach works</h2>
<p>Apps decide what to show in two broad ways. Followers may see your posts in their feed, and non-followers may see them through recommendations, search, hashtags and explore pages. Limits often hit the second group first. Your followers might still see you, while the app stops suggesting your posts to new people. That is why a so-called shadowban often shows up as a sharp drop in non-follower reach.</p>
<p>Limits can apply to one post, a set of posts or a whole account. Some last a short time, and others last until you remove the content that caused them. Apps rarely share the exact rules, which is part of why the topic causes so much worry.</p>
<p>It helps to know what normal looks like. Reach moves up and down from week to week on every account. A post about a slow topic, a holiday weekend or a new format can each pull numbers down without any limit at all. Keep a few months of reach numbers so you can tell a real drop from a normal dip.</p>
<figure data-chart="1"></figure>
<h2>Signs of a possible shadowban</h2>
<ul>
<li>A sharp, sudden drop in reach across many posts at once, with no change in what you post.</li>
<li>Your posts don't show up under a hashtag when viewed from another account.</li>
<li>Your account is hard to find in search, even by its exact handle.</li>
<li>Almost no non-followers see your content, while followers still do.</li>
<li>A warning or notice in your account status page.</li>
</ul>
<h2>Common causes of limited reach</h2>
<ul>
<li>Breaking community guidelines, even by mistake.</li>
<li>Using banned or spammy hashtags.</li>
<li>Following, liking or commenting at a very fast pace, which can look like a bot.</li>
<li>Using tools that automate likes, follows or comments.</li>
<li>Posting content flagged as misleading, sensitive or reused from others.</li>
<li>Many people reporting or hiding your posts.</li>
</ul>
<h2>How to check and fix a shadowban, step by step</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Look at your numbers first.</b> Compare reach for the last few weeks with the months before. One weak post is normal. A drop across many posts at once is worth a closer look.</li>
<li><b>Check the account status page.</b> Some apps show there whether your content can be recommended, and why.</li>
<li><b>Test search and hashtags</b> from another account or a logged-out browser.</li>
<li><b>Remove posts that may break the rules</b>, and appeal any decision you think is wrong.</li>
<li><b>Drop any hashtag</b> that shows few or no recent posts, which can be a sign it is restricted.</li>
<li><b>Slow down</b> and turn off any tool that automates likes, follows or comments.</li>
<li><b>Keep posting original content</b> that follows the rules, and give it a few weeks.</li>
</ol>
<p>For example, a made-up fitness coach might see non-follower reach fall by more than half in one week. The account status page shows one Reel flagged for a song that wasn't allowed. She removes it, keeps posting her usual workouts and sees reach return over the next few weeks.</p>
<h2>How to avoid a shadowban</h2>
<p>Read each app's community guidelines once, and check them again when you start a new type of content. Post your own work, avoid engagement bait and never buy followers or likes. Use hashtags that fit the post, and keep the number modest. Be careful with music and clips you don't have rights to. If you use a scheduling tool, pick one that posts through the network's official API, so your posts go out the way the app expects.</p>
<p>If reach drops, look at your analytics before assuming the worst. Often a change in format, timing or topic is enough to bring reach back. Ask what changed on your side before you blame the app.</p>''',
 'charts': [
  {'type': 'line', 'title': 'Non-follower reach before and after a limit', 'sub': 'Average per post, by week', 'example': True,
   'points': [('Week 1', 3200), ('Week 2', 3000), ('Week 3', 900), ('Week 4', 800), ('Week 5', 1600), ('Week 6', 2700)],
   'unit': 'Non-follower reach per post', 'note': 'Made-up numbers. Reach fell in week 3 and recovered after the flagged post was removed.'},
  {'type': 'steps', 'title': 'Check for limited reach', 'steps': [
    ('Compare weeks', 'Look for a drop across many posts at once.'),
    ('Account status', 'Check the app\'s status page for notices.'),
    ('Test from outside', 'Search your handle and hashtags from another account.'),
    ('Clean up', 'Remove posts that may break the rules and stop automation.'),
    ('Wait and watch', 'Keep posting normally for a few weeks.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Watch reach for every channel side by side, so a sudden drop stands out.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan your own posts on a calendar with previews, so you keep a normal, steady posting pace.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('How do I know if I am shadowbanned?', "Check your app's account status page first, if it has one. Then look for a sudden drop in reach across many posts and see if your posts show under hashtags from another account."),
  ('How long does a shadowban last?', 'There is no set length, since apps do not publish one. Reach often recovers once you remove posts that break the rules and keep posting normally.'),
  ('Do platforms admit to shadowbanning?', 'Most avoid the term. They do say they may limit how widely certain content is recommended, which is what many people mean by a shadowban.'),
  ('Can scheduling posts cause a shadowban?', 'Scheduling through a tool that uses the official connection to the network is a normal way to post. Tools that automate likes, follows or comments are a different thing and can lead to limits.'),
 ],
 'related': ['algorithm', 'community-guidelines', 'organic-reach', 'engagement-bait', 'hashtag'],
},
{
 'slug': 'share-of-voice',
 'short': 'Share of voice is how much of the online conversation in your market is about your brand compared with your competitors, shown as a percentage.',
 'body': '''<h2>What is share of voice?</h2>
<p>Share of voice measures your slice of the attention in your space. If people talk about coffee machines online, share of voice tells you how much of that talk is about your brand and how much is about others. A bigger share usually means more people know your name and think of you first.</p>
<p>The term started in advertising, where it meant your share of all ad spending in a market. On social media, it most often means your share of mentions. You may also see it used for search, where it means your share of the results people see.</p>
<h2>How to calculate share of voice</h2>
<figure data-chart="1"></figure>
<p>You choose which competitors to include and the time period. The group matters a lot. Your share against two local rivals will look very different from your share against every brand in the country, so write down your group and keep it the same.</p>
<p>The time period matters too. A week can be thrown off by one viral post or one news story. A month or a quarter gives a steadier picture, and comparing the same months year to year helps you allow for busy seasons.</p>
<p>You can swap mentions for other measures, such as:</p>
<ul>
<li>Hashtag use.</li>
<li>Engagements on posts about each brand.</li>
<li>Impressions from posts that mention each brand.</li>
<li>Ad impressions, for paid share of voice.</li>
<li>Search results, for search share of voice.</li>
</ul>
<h2>How to measure share of voice, step by step</h2>
<ol>
<li><b>Pick your competitors.</b> Choose the brands your customers actually compare you with, usually somewhere between two and five.</li>
<li><b>List the keywords for each brand:</b> names, product names, common misspellings and hashtags.</li>
<li><b>Pick your channels.</b> Decide which networks and sites to count.</li>
<li><b>Count mentions</b> for every brand over the same period, with a social listening tool or by hand for a small set.</li>
<li><b>Work out each share</b>: each brand's mentions divided by the total, times 100.</li>
<li><b>Repeat on a regular schedule</b>, such as monthly, so you can see trends.</li>
</ol>
<p>For example, with made-up numbers, a small coffee machine brand finds 400 mentions of itself in a month, against 900, 500 and 200 for three rivals. That is 2,000 mentions in total, so its share of voice is 20%.</p>
<figure data-chart="2"></figure>
<h2>Why share of voice matters</h2>
<p>Share of voice shows whether your marketing is getting noticed compared with others. If your mentions grow while your share stays flat, the whole market is just getting louder. If your share grows, you are winning attention. It also helps you spot a competitor's big campaign early, since their share will jump.</p>
<p>Many marketers watch share of voice because attention often comes before sales. Brands that people talk about more tend to come to mind first when someone is ready to buy.</p>
<h2>Share of voice and sentiment</h2>
<p>Pair share of voice with sentiment. A large share made up of complaints is a problem to fix. Some teams track positive share of voice, counting only positive mentions, to see whether they are winning the right kind of attention. Read a sample of each brand's mentions every month to get a feel for what people actually say. You may find that a rival's big share comes from one complaint thread, or that your smaller share is mostly warm praise. Both are worth knowing before you plan next month's posts.</p>
<h2>How to grow share of voice</h2>
<ul>
<li><b>Post useful content often enough</b> to stay in view in your niche.</li>
<li><b>Join conversations</b> by answering questions and replying to posts about your topic.</li>
<li><b>Work with creators</b> your audience trusts, so your name shows up in their posts.</li>
<li><b>Encourage customers to post about you</b>, and reply when they do.</li>
<li><b>Run campaigns with a clear hashtag</b> so people can find and join them.</li>
<li><b>Give people a reason to talk</b>, such as a launch, a useful tool or a strong opinion on an industry topic.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li>Changing the competitor group from one month to the next.</li>
<li>Missing mentions because the keyword list leaves out misspellings or product names.</li>
<li>Celebrating a spike caused by a complaint going viral.</li>
<li>Counting only one network when your customers talk about you in several places.</li>
<li>Comparing your share with a giant brand and giving up. Track your own trend against a fair group.</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Share of voice', 'formula': "Share of voice = your brand's mentions ÷ mentions of all brands in your group × 100",
   'note': 'Made-up numbers to show the math.', 'result': '20%',
   'example': [('Your mentions', '400'), ('All brands', '2,000')]},
  {'type': 'stack', 'title': 'Share of voice in one market', 'sub': 'Mentions in one month, four coffee machine brands', 'example': True,
   'parts': [('Brand A', 900), ('Your brand', 400), ('Brand B', 500), ('Brand C', 200)],
   'note': 'Made-up numbers for teaching.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Collect mentions of your brand from your channels in one place.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for counting mentions by brand and working out each share.'},
  {'name': 'Claude', 'url': 'https://claude.ai/', 'domain': 'claude.ai', 'line': 'An AI assistant that can help sort a batch of mentions by brand and topic.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is a good share of voice?', 'It depends on how many competitors you have and how big they are. The key is whether your share is growing over time against the same group.'),
  ('How is share of voice different from market share?', 'Market share measures your portion of sales. Share of voice measures your portion of attention or conversation, which can come before sales grow.'),
  ('Can I measure share of voice for free?', "You can count mentions by hand using each app's search for a small set of brands. Larger or ongoing tracking usually needs a social listening tool."),
  ('How often should I measure share of voice?', 'Monthly is a good start for most brands. Measure more often during a big launch or campaign.'),
 ],
 'related': ['social-listening', 'sentiment-analysis', 'brand-awareness', 'mention', 'key-performance-indicator'],
},
{
 'slug': 'shares',
 'short': 'Shares are the number of times people passed your post on to others, by reposting it, sending it in a message or adding it to their story.',
 'body': '''<h2>What are shares?</h2>
<p>A share happens when someone takes your post and spreads it further. They might repost it to their own followers, send it to a friend in a direct message, add it to their story or copy the link and paste it elsewhere. Each app counts shares a little differently, and some split them into reposts and sends. Read each app's definition before you compare numbers across networks.</p>
<p>Shares are one of the few numbers that show your content moving from person to person. A like stays between you and the person who tapped it. A share carries your post to someone new. That new person arrives with a friend's word behind them, which makes them far more likely to pay attention than if they had scrolled past you on their own.</p>
<h2>Why shares matter</h2>
<p>Shares are one of the strongest forms of engagement. When people share, they put their own name next to your content and tell their friends it is worth a look. That brings your post to people who don't follow you yet, which is how posts reach far beyond your audience and sometimes go viral.</p>
<p>Many apps also treat shares, and sends in private messages, as a sign that a post deserves to be shown to more people. A post that gets passed around early often keeps getting picked for recommendations.</p>
<h2>Types of shares</h2>
<ul>
<li><b>Reposts:</b> shared to the person's own profile or feed.</li>
<li><b>Quote posts:</b> shared with an added comment.</li>
<li><b>Sends:</b> shared privately in a direct message or group chat.</li>
<li><b>Story shares:</b> added to the person's story for a day.</li>
<li><b>Link copies:</b> pasted into other apps, emails or chats, which apps often can't fully track.</li>
</ul>
<h2>How to measure shares</h2>
<p>Look at shares in the insights for each post. To compare posts that reached different numbers of people, use the share rate.</p>
<figure data-chart="1"></figure>
<p>Keep in mind that a lot of sharing happens through copied links in private chats, sometimes called dark social. Your real share count may be higher than the number shown. Adding UTM tags to the links in your posts can help, since visits from a copied link still carry the tag to your website analytics.</p>
<p>Track share rate by topic and format. You may find one kind of post gets shared far more than the rest. Also look at what happens after a share. If a widely shared post brings new followers or profile visits, it found the right people. If it brings neither, it may have traveled far among people who will never care about your brand.</p>
<figure data-chart="2"></figure>
<h2>How to get more shares, step by step</h2>
<ol>
<li><b>Think about the person they will send it to.</b> Shares are a message from one friend to another, so ask what that message says.</li>
<li><b>Make the sharer look good.</b> People pass on things that make them seem smart, funny or caring.</li>
<li><b>Post relatable moments</b> people want to send with "this is so you".</li>
<li><b>Share useful tips, news or data</b> your audience will want their team or family to see.</li>
<li><b>Make the point clear in the first second</b>, since people share what they understand fast.</li>
<li><b>Ask now and then</b>, such as "Send this to someone planning a trip."</li>
</ol>
<p>For example, a made-up pet shop might post a short video titled "Things only cat owners understand" with five quick, funny moments. Cat owners send it to other cat owners, and the shop's post reaches many people who have never heard of it.</p>
<h2>Shares vs saves</h2>
<p>Saves show that someone wants to keep a post for themselves. Shares show they want others to see it. Practical guides tend to get saved, while funny, moving or surprising posts tend to get shared. Many strong posts get both. Tracking each one shows you what kind of value your content gives.</p>
<figure data-chart="3"></figure>
<h2>Common mistakes</h2>
<ul>
<li><b>Begging for shares</b> on posts that give people no reason to pass them on.</li>
<li><b>Using share-for-a-prize contests</b> that break an app's rules or bring in people who never come back.</li>
<li><b>Ignoring private sends.</b> They stay off your profile, yet they can be your biggest share type.</li>
<li><b>Making posts that only make sense to current followers.</b> A shared post meets new people, so it should stand on its own.</li>
<li><b>Leaving your name off.</b> A post that travels far without your handle or logo on it gives new viewers no way to find you.</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Share rate', 'formula': 'Share rate = shares ÷ people reached × 100',
   'note': 'Made-up numbers to show the math.', 'result': '1.5%',
   'example': [('Shares', '120'), ('People reached', '8,000')]},
  {'type': 'columns', 'title': 'Share rate by post type', 'sub': 'Average over one month', 'example': True,
   'rows': [('Relatable joke', 2.4, '2.4%'), ('How-to tip', 1.1, '1.1%'), ('News', 1.6, '1.6%'), ('Product photo', 0.3, '0.3%')],
   'highlight': 'Relatable joke', 'labels': 'all', 'unit': 'Share rate', 'note': 'Made-up numbers for one account.'},
  {'type': 'versus', 'title': 'Shares vs saves', 'cols': ['Shares', 'Saves'],
   'rows': [('Brings the post to new people', True, False), ('For the person themselves', False, True), ('Common on funny or moving posts', True, 'Less often'), ('Common on guides and checklists', 'Sometimes', True), ('Can happen in private chats', True, False)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Compare engagement and reach for each post across your channels.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags links so visits from copied links still show in your analytics.'},
  {'name': 'CapCut', 'url': 'https://www.capcut.com/', 'domain': 'capcut.com', 'line': 'A video editor for short clips people want to send to friends.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What counts as a share on Instagram?', 'Instagram counts it as a share when someone sends your post in a direct message or adds it to their story. Reposts may also be counted where the feature is available.'),
  ('Are shares better than likes?', 'Shares usually matter more because they bring your post to new people. A like shows approval, while a share puts your post in front of someone else.'),
  ("Why can't I see all my shares?", 'Many shares happen by copying a link into private chats or other apps, which platforms cannot always track. Your true share count is often higher than shown.'),
  ('How do I work out share rate?', 'Divide shares by the number of people reached and multiply by 100. It lets you compare posts with different reach.'),
 ],
 'related': ['saves', 'repost', 'dark-social', 'viral', 'engagement'],
},
{
 'slug': 'snapchat',
 'short': 'Snapchat is a messaging and camera app where people send photos and videos called Snaps, many of which disappear after they are viewed.',
 'body': '''<h2>What is Snapchat?</h2>
<p>Snapchat is a phone app built around the camera. It opens straight to a camera screen, so you can snap a photo or short video, add text, drawings or a fun lens and send it to friends. By default, many Snaps disappear after they are opened. That made Snapchat feel more casual and private than apps where every post stays on a profile.</p>
<p>Snapchat is known for being popular with teens and young adults, and for its augmented reality lenses that add effects to your face or surroundings. Many people use it mainly to talk with close friends, more like a messaging app than a place to follow brands.</p>
<p>Snapchat is free to download and use. It also offers an optional paid subscription with extra features, and businesses pay only if they choose to run ads. A public profile for your brand costs nothing, so you can test the app before you spend anything.</p>
<h2>Main Snapchat features</h2>
<ul>
<li><b>Snaps and chat:</b> photos, videos and messages sent to friends.</li>
<li><b>Stories:</b> a series of Snaps that friends can watch for a day.</li>
<li><b>Spotlight:</b> a feed of short public videos, similar to other short video apps.</li>
<li><b>Lenses and filters:</b> augmented reality effects and overlays.</li>
<li><b>Snap Map:</b> a map where friends can choose to share their location and see public Snaps from places.</li>
<li><b>Discover:</b> shows and stories from publishers and creators.</li>
<li><b>Memories:</b> a private place to save Snaps and Stories you want to keep.</li>
</ul>
<h2>How Snapchat differs from other apps</h2>
<p>On most social apps, your posts build up on a public profile, and strangers find you through a feed. Snapchat started the other way around. Most activity happens between friends, in private, and much of it disappears. Public features like Spotlight and public profiles were added later, so brands can now be found by people who don't know them yet.</p>
<figure data-chart="1"></figure>
<h2>How businesses use Snapchat</h2>
<p>Brands can set up a public profile that people can follow and visit. From there, they can post Stories, share Spotlight videos and save content to their profile so it stays visible. Other common uses are:</p>
<ul>
<li>Running ads between Stories or in the Discover and Spotlight feeds.</li>
<li>Creating custom lenses or filters for a product launch or event.</li>
<li>Showing behind-the-scenes moments that feel less polished than feed posts.</li>
<li>Working with Snapchat creators who already reach your audience.</li>
</ul>
<p>For example, a made-up sneaker shop might post a Story every morning of a launch week: the boxes arriving, staff trying the shoes, a countdown and a final "doors open" Snap. It also makes a simple lens with its logo for people who come to the store.</p>
<h2>How to start on Snapchat as a business, step by step</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Create or switch to a public profile</b> for your business, with your logo and a short description.</li>
<li><b>Post Stories often</b>, since they fade after a day and regular posting keeps you in view.</li>
<li><b>Try Spotlight</b> with short vertical videos that can reach people who don't follow you.</li>
<li><b>Save your best Stories</b> to your public profile so new visitors see them.</li>
<li><b>Share your Snapcode or profile link</b> on your other channels and in your store.</li>
<li><b>Check your insights</b> to see views and which Stories keep people watching to the end.</li>
</ol>
<h2>How to measure Snapchat results</h2>
<p>Snapchat's insights for public profiles show things like Story views, how many people watched to the end and how your followers grow. For Stories, the drop between the first Snap and the last tells you a lot. If most people leave after the second Snap, your Stories may be too long or start too slowly. For ads, use tracked links so your website analytics can show what visitors did after tapping.</p>
<h2>Tips for Snapchat content</h2>
<p>Shoot vertical video on your phone and keep it quick and personal. People on Snapchat expect raw, casual content from friends and brands alike. Talk to the camera, use lenses and text to add fun, and post Stories often so you stay in view. Save your best content to your public profile so it doesn't vanish.</p>
<p>Common mistakes include posting polished TV-style ads that feel out of place, letting a public profile go quiet for weeks and forgetting that people can screenshot anything you send. Treat every Snap as something that could be kept.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Snapchat vs a typical feed app', 'cols': ['Snapchat', 'Typical feed app'],
   'rows': [('Opens to the camera', True, False), ('Most activity between friends', True, 'Often public'), ('Many messages disappear', True, False), ('Public short video feed', 'Spotlight', True), ('Public profile for brands', True, True)]},
  {'type': 'steps', 'title': 'Start Snapchat for a business', 'steps': [
    ('Public profile', 'Set it up with your logo and a short line.'),
    ('Stories', 'Post often, since they fade after a day.'),
    ('Spotlight', 'Try short vertical videos for new viewers.'),
    ('Save the best', 'Keep top Stories on your public profile.'),
    ('Check insights', 'Watch views and how many reach the end.')]},
 ],
 'tools': [
  {'name': 'CapCut', 'url': 'https://www.capcut.com/', 'domain': 'capcut.com', 'line': 'A video editor for trimming vertical clips before you post them.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for simple graphics and text for Stories.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags links so you can see visits from Snapchat in your analytics.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('Do Snapchat messages really disappear?', 'Many Snaps and chats disappear after they are viewed by default, but people can take screenshots or save chats. Treat anything you send as something that could be kept.'),
  ('Can businesses use Snapchat?', "Yes. Businesses can create a public profile, post Stories and Spotlight videos, and run ads through Snapchat's ads tool."),
  ('What is Snapchat Spotlight?', "Spotlight is Snapchat's feed of short public videos. Anyone can submit a video, and it can be shown to people who do not follow you."),
  ('What is a Snapcode?', 'A Snapcode is a scannable code for a Snapchat profile. People scan it with the Snapchat camera to add or follow you.'),
 ],
 'related': ['augmented-reality-filter', 'story', 'filter', 'business-account', 'vlog'],
},
]
