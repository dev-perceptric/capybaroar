# Glossary v2, batch 5.
TERMS = []

TERMS += [
{
 'slug': 'linkedin-company-page',
 'short': "A LinkedIn Company Page is an organization's official profile on LinkedIn, used to share updates, post jobs and show who works there.",
 'body': '''<h2>What is a LinkedIn Company Page?</h2>
<p>A LinkedIn Company Page is the home of a business, nonprofit or school on LinkedIn. It has a logo, a cover image, an about section, a website link and a feed of posts. When employees list the company as their workplace on their own profiles, they show up as people who work there. Anyone can follow the page to see its updates in their feed.</p>
<p>Think of it as your company's front desk on LinkedIn. People stop by to check who you are and whether you look active. A good page answers those questions before anyone sends a message.</p>
<h2>Why a Company Page matters</h2>
<p>Buyers and job seekers often look up a company on LinkedIn before they get in touch. A clear, busy page tells them you are real and doing well. It is also the place to post open roles and share official news. Without one, your team's posts have nowhere to point, and your staff can't link their profiles to anything.</p>
<p>A page also gives you data that a personal profile doesn't. You can see who follows the page, which posts they react to and how many people visit. Over a few months, that tells you a lot about what your market cares about.</p>
<h2>How to set up a Company Page</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Start from your personal profile.</b> Pages are created and run by people, so you need a profile first.</li>
<li><b>Pick the page type.</b> Choose a company page or a school page, depending on what you run.</li>
<li><b>Fill in the basics.</b> Add the name, page address, website, industry, company size and logo.</li>
<li><b>Write the about section.</b> Say in plain words what you do and who you serve. Skip the buzzwords.</li>
<li><b>Add a cover image and a button.</b> A button such as "Visit website" or "Contact us" gives visitors a next step.</li>
<li><b>Add more admins.</b> Give at least one teammate admin access so the page doesn't depend on one person.</li>
</ol>
<h2>What to post on your page</h2>
<p>A strong page mixes a few kinds of posts so followers get something useful each week. Good options include:</p>
<ul>
<li>Product news and launches, explained by what changes for customers.</li>
<li>Short tips and how-tos from the people on your team who know the topic best.</li>
<li>Behind-the-scenes posts about your team and the way you work.</li>
<li>Open jobs and hiring news.</li>
<li>Customer stories, shared with their permission.</li>
<li>Document posts and short videos that teach one idea.</li>
</ul>
<p>For example, a made-up accounting firm might post a tax deadline reminder on Monday and a one-page checklist as a document post on Thursday. Every other week it adds a staff spotlight. Each post gives followers a reason to keep the page in their feed.</p>
<h2>Company Page vs personal profile</h2>
<p>A personal profile speaks for one person. A Company Page speaks for the whole organization. Posts from people often feel warmer and can travel further, while page posts carry an official voice. The strongest setups use both. The page shares the news first, and staff share it again with their own take.</p>
<figure data-chart="2"></figure>
<p>Here is how that can look in practice. A made-up software company announces a new feature on its page with a short video. The same morning, the product lead writes a personal post about why the team built it and links to the page post. A sales rep shares it with a note for her clients. Each post reaches a different crowd, and all of them point back to the page.</p>
<p>To make this easy, tell staff when a big post is going out and give them a line or two they can change into their own words. Never ask them to copy and paste the same text, since a feed full of identical posts looks forced.</p>
<h2>How to measure your page</h2>
<p>Open the page analytics as an admin. The numbers worth checking each month are:</p>
<ul>
<li><b>Followers:</b> how many people follow the page, and how fast that grows.</li>
<li><b>Impressions and reach:</b> how often your posts were shown and to how many people.</li>
<li><b>Engagement:</b> reactions, comments, reposts and clicks on each post.</li>
<li><b>Visitors:</b> how many people opened the page itself.</li>
</ul>
<p>Watch the trend over months instead of judging one week. Steady posting usually shows up as slow, steady follower growth, like the made-up numbers below.</p>
<figure data-chart="3"></figure>
<h2>Common mistakes</h2>
<ul>
<li>Leaving the page empty for months, which makes the company look closed.</li>
<li>Posting only sales messages that give followers nothing to learn.</li>
<li>Letting one person hold the only admin access. When they leave, you can lose control of the page.</li>
<li>Forgetting to ask staff to add the company to their profiles, so the page shows almost nobody working there.</li>
<li>Using a blurry logo or a cover image with text that gets cut off on phones.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Setting up a Company Page', 'steps': [
   ('Start from your profile', 'Sign in with your personal LinkedIn account and choose to create a page.'),
   ('Add the basics', 'Name, page address, website, industry, size and logo.'),
   ('Write the about section', 'Two or three plain sentences on what you do and who you serve.'),
   ('Add a cover and a button', 'Pick a cover image and a button like "Visit website."'),
   ('Invite admins and post', 'Add a second admin, then share your first update.')]},
  {'type': 'versus', 'title': 'Company Page vs personal profile', 'cols': ('Company Page', 'Personal profile'), 'rows': [
   ('Speaks for', 'The whole organization', 'One person'),
   ('Run by', 'One or more admins', 'The person who owns it'),
   ('Shows on staff profiles as their workplace', True, False),
   ('Tone', 'Official', 'Personal'),
   ('Best for', 'Company news and open jobs', 'Ideas and opinions')]},
  {'type': 'line', 'title': 'Page followers with weekly posting', 'sub': 'Followers at the end of each month', 'example': True,
   'points': [('Jan', 420), ('Feb', 480), ('Mar', 560), ('Apr', 610), ('May', 700), ('Jun', 790)], 'unit': 'Followers',
   'note': 'Made-up numbers for one small company page.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar LinkedIn scheduler', 'url': '/linkedin-post-scheduler', 'line': 'Plan and schedule LinkedIn posts on one calendar with your other channels.'},
  {'name': 'LinkedIn banner size', 'url': '/tools/linkedin-banner-size', 'line': 'Our free guide to the right size for LinkedIn cover images.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for making your page logo, cover image and post graphics.'},
 ],
 'list': 'linkedin-post-schedulers',
 'faqs': [
  ('Is a LinkedIn Company Page free?', 'Yes. Creating and posting from a Company Page is free. You only pay if you run ads or buy optional paid features.'),
  ('Do I need a personal profile to create a Company Page?', 'Yes. LinkedIn pages are created and managed by people with personal profiles who are given admin access.'),
  ('Can a Company Page have more than one admin?', 'Yes, and it should. Adding a second admin means the page stays safe if someone leaves the company or loses access to their account.'),
  ('How do I get more followers on my LinkedIn Company Page?', 'Ask employees to list the company on their profiles, invite your connections to follow and post useful content on a steady schedule. Link the page from your website and emails too.'),
  ('How often should a Company Page post?', 'Pick a pace you can keep for months, such as two or three times a week. Steady posting matters more than posting a lot in one burst.'),
 ],
 'related': ['linkedin', 'employee-advocacy', 'b2b-social-media', 'profile', 'linkedin-newsletter'],
},
{
 'slug': 'linkedin-document-post',
 'short': 'A LinkedIn document post is a post with a PDF or slide file attached that readers flip through page by page right in the feed.',
 'body': '''<h2>What is a LinkedIn document post?</h2>
<p>A LinkedIn document post lets you upload a file, such as a PDF or a slide deck, and share it as a post. In the feed it shows as a viewer that people swipe or click through one page at a time. Many people call these LinkedIn carousels, because they look like the swipe posts found on other apps. You give the document a title and write a normal text caption above it.</p>
<p>The format works well for anything you would normally explain with a few slides. Checklists, short guides, before-and-after examples and step-by-step tips all fit.</p>
<h2>Why people use document posts</h2>
<p>A document post can teach a whole idea in a few pages, which suits LinkedIn's work-focused crowd. Each swipe is a small action, and people often spend longer with a post they flip through. That time spent can help the post do well, since many feeds pay attention to how long people stay. Readers can also save the post and come back later, which makes the format a good home for guides.</p>
<h2>How to make a document post</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Pick one clear topic.</b> "Five ways to cut meeting time" works better than "Productivity tips."</li>
<li><b>Design the pages.</b> Use any slides or design tool. Square or tall pages fill more of a phone screen.</li>
<li><b>Put a strong title on page one.</b> It works like the hook of a video. Say what the reader gets.</li>
<li><b>Give each page one point.</b> Use large text and few words, so a phone screen is enough to read it.</li>
<li><b>End with a summary page.</b> Repeat the main idea and add a simple next step, like "Save this for later."</li>
<li><b>Export as a PDF.</b> A PDF keeps your fonts and layout the same on every screen.</li>
<li><b>Post it.</b> Start a LinkedIn post, attach the document, add its title and write a short caption.</li>
</ol>
<h2>How to design pages people finish</h2>
<p>Plan the pages before you open a design tool. Write the title, then one line per page, then the closing page. If the plan reads well as plain text, the design will only make it better. If it doesn't, no amount of color will save it.</p>
<p>Most readers drop off a little with every swipe. That is normal. Your job is to make each page worth the next swipe. The made-up chart below shows how a typical drop-off might look across an eight-page document.</p>
<figure data-chart="2"></figure>
<ul>
<li><b>Front-load the value.</b> Put your best tip on page two, since more people see it there than on page seven.</li>
<li><b>Number the pages.</b> "3/8" tells readers how far along they are and that the end is near.</li>
<li><b>Use your brand colors and fonts.</b> People should know it's you before they read your name.</li>
<li><b>Keep it short.</b> Six to ten pages is plenty for one idea. Cut pages that repeat a point.</li>
<li><b>Test on a phone.</b> If you have to zoom to read it, the text is too small.</li>
</ul>
<h2>Document post vs carousel post</h2>
<p>On Instagram and Facebook, a carousel is a post with several images or videos. On LinkedIn, the swipe format usually comes from uploading a document. The result looks alike, but the steps differ. If you reuse one design across apps, export images for Instagram and a single PDF for LinkedIn.</p>
<figure data-chart="3"></figure>
<h2>How to write the caption and check results</h2>
<p>Your caption sits above the document and can run up to LinkedIn's 3,000 character limit, though short usually works better here. Tell people what they will learn by swiping. For example: "Our team cut weekly meetings from five to two. Here is the checklist we used. Swipe to page 4 for the one change that made the biggest difference." End with a question to start comments.</p>
<p>Check the post analytics a few days after it goes live. Impressions show how often it was shown. Reactions, comments and reposts show who cared enough to act. Saves and comments that quote a page are good signs that people read past the cover. Compare each document post with your own text and image posts to see whether the format earns its extra design time.</p>
<h2>Common mistakes</h2>
<ul>
<li>Cramming a full slide deck from a meeting into the feed, small print and all.</li>
<li>Leaving the cover page plain, so nobody starts swiping.</li>
<li>Putting the only useful tip on the last page.</li>
<li>Sharing a file with private details. Depending on settings, viewers may be able to download it.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Making a document post', 'steps': [
   ('Pick one topic', 'Choose a single idea you can teach in a few pages.'),
   ('Design the pages', 'One point per page, big text, square or tall size.'),
   ('Write a cover hook', 'Page one says what the reader gets by swiping.'),
   ('Export as PDF', 'Keeps fonts and layout the same on every screen.'),
   ('Post with a short caption', 'Attach the file, add a title and tell people why to swipe.')]},
  {'type': 'line', 'title': 'Readers still swiping on each page', 'sub': 'Share of people who opened the document', 'example': True, 'suffix': '%',
   'points': [('P1', 100), ('P2', 78), ('P3', 64), ('P4', 55), ('P5', 49), ('P6', 45), ('P7', 42), ('P8', 40)], 'unit': 'Still reading',
   'note': 'Made-up numbers to show a typical shape. Your drop-off will differ.'},
  {'type': 'versus', 'title': 'LinkedIn document post vs Instagram carousel', 'cols': ('LinkedIn document post', 'Instagram carousel'), 'rows': [
   ('What you upload', 'One PDF or slide file', 'Several images or videos'),
   ('Readers swipe page by page', True, True),
   ('Has its own document title', True, False),
   ('Can mix video into the slides', False, True),
   ('How to export one design', 'One PDF', 'One image per slide')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar LinkedIn scheduler', 'url': '/linkedin-post-scheduler', 'line': 'Plan your LinkedIn posts ahead on a calendar with your other channels.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': "Check your caption against LinkedIn's 3,000 character limit."},
  {'name': 'LinkedIn text formatter', 'url': '/tools/linkedin-text-formatter', 'line': 'Add bold or italic text to your caption with our free formatter.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for building slide pages and saving them as a PDF.'},
 ],
 'list': 'linkedin-post-schedulers',
 'faqs': [
  ('What file types can I upload to a LinkedIn document post?', 'PDF is the most common choice. LinkedIn also accepts other document and slide formats, but PDF keeps your layout and fonts looking the same.'),
  ('Are LinkedIn document posts the same as carousels?', 'People often call them carousels because they swipe the same way. Technically they are posts with an attached document.'),
  ('How many pages should a LinkedIn document have?', 'Enough to teach one idea, often six to ten pages. If a page repeats an earlier point, cut it.'),
  ('Can people download my LinkedIn document?', "Depending on settings, viewers may be able to download the file. Leave out anything you wouldn't want shared."),
  ('What size should the pages be?', 'Square or tall pages fill more of a phone screen than wide slides. Pick one size and keep every page the same.'),
 ],
 'related': ['linkedin', 'carousel-post', 'b2b-social-media', 'dwell-time', 'content-pillars'],
},
{
 'slug': 'linkedin-newsletter',
 'short': 'A LinkedIn newsletter is a series of articles you publish on LinkedIn that people can subscribe to and get alerted about each new issue.',
 'body': '''<h2>What is a LinkedIn newsletter?</h2>
<p>A LinkedIn newsletter is a set of long articles published under one name on a regular schedule. You might run "Friday Hiring Notes" or "The Small Shop Report." Readers can subscribe with one click, and LinkedIn tells them when a new issue is out. Both personal profiles and Company Pages can publish newsletters, though LinkedIn decides who has access to the feature.</p>
<p>It sits somewhere between a blog and an email newsletter. Like a blog, each issue lives on LinkedIn where anyone can find it. Like email, subscribers get a notice each time you publish.</p>
<p>Each issue is a LinkedIn article with a title, a cover image and a body. When you publish, LinkedIn notifies your subscribers and shares the issue in the feed. Because people chose to subscribe, they tend to pay more attention than casual scrollers. Past issues stay on your profile or page, so new readers can catch up on what they missed.</p>
<h2>How to start a LinkedIn newsletter</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Choose a narrow topic.</b> "Pricing for freelance designers" is easier to own than "business advice."</li>
<li><b>Name it clearly.</b> Pick a name and a one-line description that says what readers get.</li>
<li><b>Set a schedule you can keep.</b> Weekly or every other week are common choices.</li>
<li><b>Create the newsletter.</b> Use the write article option on your profile or page and set it up as a newsletter.</li>
<li><b>Write a strong first issue.</b> Share one specific, useful idea with a clear headline.</li>
<li><b>Promote each issue.</b> Write a short post about it, so people outside your subscriber list see it too.</li>
</ol>
<h2>How to write an issue people read</h2>
<ul>
<li><b>Lead with the answer.</b> Say the main point in the first two lines, then explain.</li>
<li><b>Use headings and short paragraphs.</b> Most people read on a phone, and walls of text get skipped.</li>
<li><b>Add real examples from your work.</b> A story about a client problem beats a list of general tips.</li>
<li><b>Ask one question at the end.</b> It gives readers a reason to comment.</li>
<li><b>Publish on the same day each time.</b> Readers start to expect you.</li>
</ul>
<p>Here is a made-up opening for an issue: "Last month three of my clients asked the same thing: should they raise prices in a slow quarter? My answer was yes, for two of them. Here is how I decided." It gets straight to a real question and promises an answer.</p>
<h2>Newsletter vs regular post</h2>
<p>A regular LinkedIn post is short, up to 3,000 characters, and lives in the feed for a while before fading. A newsletter issue can be much longer and goes straight to subscribers. Posts are great for quick ideas and conversation. Newsletters suit deeper thinking and building a loyal group of readers over time.</p>
<figure data-chart="2"></figure>
<h2>How to measure your newsletter</h2>
<p>Check the stats for each issue. The numbers that matter most are new subscribers, views of the article and the comments and reposts it earns. Treat it like a funnel. Many subscribers get the notice, fewer open the issue, fewer still read to the end, and a small group replies. The made-up example below shows the shape.</p>
<figure data-chart="3"></figure>
<p>If opens fall over several issues, test new headlines. If people open but don't comment, try ending with a more specific question. If subscribers stop growing, share older issues again in short posts, since new followers have never seen them.</p>
<p>Keep a simple log with one row per issue: the date, the headline, views, new subscribers and comments. After ten issues you will see which topics pull readers in and which ones fall flat. Write more of the first kind.</p>
<h2>LinkedIn newsletter vs email newsletter</h2>
<p>Your LinkedIn subscriber list lives on LinkedIn. You can't download it or move it if the app changes how newsletters work. An email list is owned media, so it stays with you. Many writers run both. They publish on LinkedIn to be found, then invite readers to join an email list for extras such as templates or a monthly roundup.</p>
<h2>Common mistakes</h2>
<ul>
<li>Launching with a big promise, then skipping issues after a month.</li>
<li>Picking a topic so broad that nobody knows why they should subscribe.</li>
<li>Turning every issue into a sales pitch.</li>
<li>Publishing without a short promo post, so only subscribers ever see it.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Starting a LinkedIn newsletter', 'steps': [
   ('Pick a narrow topic', 'Something you can write about for a year.'),
   ('Name it and describe it', 'One clear name and one line on what readers get.'),
   ('Set a schedule', 'Choose a day and a pace you can keep.'),
   ('Publish the first issue', 'One useful idea with a strong headline.'),
   ('Promote every issue', 'A short post brings in readers beyond your subscribers.')]},
  {'type': 'versus', 'title': 'Newsletter issue vs regular post', 'cols': ('Newsletter issue', 'Regular post'), 'rows': [
   ('Length', 'Long article', 'Up to 3,000 characters'),
   ('Subscribers get a notice', True, False),
   ('Has a title and cover image', True, False),
   ('Best for', 'Deep ideas and guides', 'Quick thoughts and talk'),
   ('Stays on your profile to browse', True, True)]},
  {'type': 'funnel', 'title': 'From subscriber to reply', 'sub': 'One newsletter issue', 'example': True, 'unit': 'People',
   'stages': [('Subscribers', 2000), ('Opened the issue', 640), ('Read to the end', 290), ('Commented or reposted', 40)],
   'note': 'Made-up numbers to show the shape of a newsletter funnel.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar LinkedIn scheduler', 'url': '/linkedin-post-scheduler', 'line': 'Schedule the short posts that point people to each new issue.'},
  {'name': 'Mailchimp', 'url': 'https://mailchimp.com', 'domain': 'mailchimp.com', 'line': 'An email marketing tool for building a list you own next to your LinkedIn readers.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for making the cover image for each issue.'},
  {'name': 'Notion', 'url': 'https://www.notion.com', 'domain': 'notion.com', 'line': 'A workspace for drafting issues and keeping a list of future topics.'},
 ],
 'list': 'linkedin-post-schedulers',
 'faqs': [
  ('Is a LinkedIn newsletter free?', 'Yes. Publishing and subscribing to LinkedIn newsletters is free.'),
  ('Who can start a LinkedIn newsletter?', "Personal profiles and Company Pages that meet LinkedIn's requirements can create one. If you don't see the option, check your settings or try again later."),
  ('How do people find my LinkedIn newsletter?', 'LinkedIn suggests it to your network when you launch, and each issue appears in the feed. Sharing issues in posts and linking from your profile helps more people subscribe.'),
  ('How often should I publish a LinkedIn newsletter?', 'Pick a pace you can keep, such as weekly or every other week. Being steady matters more to readers than being frequent.'),
  ('Can I export my LinkedIn newsletter subscribers?', 'You should plan as if you cannot. If you want a list you control, invite readers to join your email list as well.'),
 ],
 'related': ['linkedin', 'subscriber', 'owned-media', 'linkedin-company-page', 'evergreen-content'],
},
{
 'slug': 'live-streaming',
 'short': 'Live streaming is broadcasting video to your audience in real time, so viewers can watch, comment and react while it happens.',
 'body': '''<h2>What is live streaming?</h2>
<p>Live streaming means sharing video as you film it. Viewers see you right away and can type comments that you read and answer on the spot. When the stream ends, many apps let you save a replay so people who missed it can watch later. It is the closest thing social media has to a live TV show, and you run it.</p>
<p>People go live for all kinds of reasons. A bakery might show a cake being decorated. A software company might demo a new feature and take questions. A teacher might run a study session the night before an exam.</p>
<p>Most big networks have a live option, including Instagram, TikTok, YouTube, Facebook and LinkedIn. Twitch is built mainly around live streams, and Discord lets people stream to a server. Each app has its own rules about who can go live and how long a stream can run. The tools differ too, such as adding guests, pinning comments, running Q&amp;A or receiving gifts. Check each app's current rules before you plan.</p>
<h2>Why go live</h2>
<ul>
<li><b>Real connection:</b> viewers can talk to you and get answers right away.</li>
<li><b>Alerts to followers:</b> many apps send a notice to followers when you start.</li>
<li><b>Little editing:</b> there is nothing to cut or polish afterward.</li>
<li><b>Ways to earn:</b> some platforms offer gifts or tips during streams.</li>
<li><b>Content for later:</b> one stream can be cut into many short clips.</li>
</ul>
<h2>How to plan a live stream</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Pick a topic and a clear title.</b> "Live Q&amp;A: fixing slow websites" tells people what they will get.</li>
<li><b>Announce it ahead.</b> Post the time a few days before in posts and Stories, then remind people an hour before.</li>
<li><b>Test your setup.</b> Check camera, light, sound and internet in a short private test.</li>
<li><b>Write a short outline.</b> A few points and a closing call to action keep you on track.</li>
<li><b>Get a helper.</b> Ask a teammate to answer questions in the chat and remove spam.</li>
</ol>
<h2>What to do during the stream</h2>
<p>Start the real content within a minute or two. Viewers drift in over the first few minutes, so greet people by name as they join and repeat your main point now and then for latecomers. Read questions out loud before you answer them, since people watching the replay can't see the chat in the same way.</p>
<p>Watch how your audience grows and shrinks. A typical stream builds for the first part, peaks, then slowly loses viewers. The made-up chart below shows that shape for a 35-minute stream. Plan your best moment for the peak and wrap up before the drop gets steep.</p>
<figure data-chart="2"></figure>
<h2>After the stream</h2>
<ul>
<li>Save the replay and post it, or share a link to it.</li>
<li>Cut short clips of the best answers and post them over the next week.</li>
<li>Reply to comments that came in after you ended.</li>
<li>Note the peak viewer count and the questions people asked. Both help you plan the next one.</li>
</ul>
<p>For example, a made-up gardening account might go live for 30 minutes on Sunday, then post four short clips from it during the week. Each clip ends with "Full stream on my profile."</p>
<h2>How to measure a live stream</h2>
<p>Most apps show stats once the stream is over. Look for these:</p>
<ul>
<li><b>Peak viewers:</b> the most people watching at one time.</li>
<li><b>Average watch time:</b> how long a typical viewer stayed.</li>
<li><b>Comments and reactions:</b> how much people talked back.</li>
<li><b>Replay views:</b> how many people watched after it ended.</li>
<li><b>New followers:</b> how many people followed you during or right after the stream.</li>
</ul>
<p>Compare each stream with your last few, since live numbers swing a lot from week to week. If replay views beat live views, your audience may prefer to watch later, so put more effort into the clips. If people leave in the first five minutes, tighten your opening. Keep notes on the day, time and topic of each stream so you can spot what draws the biggest crowd.</p>
<h2>Common mistakes</h2>
<ul>
<li>Going live with no warning, which often means an empty room.</li>
<li>Waiting too long for people to show up, so early viewers leave.</li>
<li>Ignoring comments, which wastes the whole point of being live.</li>
<li>Forgetting to check your background or what is open on your screen before you share it.</li>
<li>Running long past the point where viewers started to leave.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Planning a live stream', 'steps': [
   ('Pick a topic and title', 'Say exactly what viewers will get.'),
   ('Announce it', 'Post the time a few days ahead and remind people on the day.'),
   ('Test your setup', 'Camera, light, sound and internet in a private test.'),
   ('Go live with a helper', 'Someone else watches the chat and removes spam.'),
   ('Reuse the replay', 'Save it and cut short clips to post later.')]},
  {'type': 'line', 'title': 'Viewers during a live stream', 'sub': 'People watching at each point', 'example': True,
   'points': [('0 min', 12), ('5', 48), ('10', 75), ('15', 90), ('20', 86), ('25', 80), ('30', 70), ('35', 52)], 'unit': 'Viewers',
   'note': 'Made-up numbers to show a common shape.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Schedule the posts that announce your stream on every channel ahead of time.'},
  {'name': 'OBS Studio', 'url': 'https://obsproject.com', 'domain': 'obsproject.com', 'line': 'Free software for recording and live streaming from your computer.'},
  {'name': 'CapCut', 'url': 'https://www.capcut.com', 'domain': 'capcut.com', 'line': 'A video editor for cutting short clips from your replay.'},
  {'name': 'YouTube Studio', 'url': 'https://studio.youtube.com', 'domain': 'youtube.com', 'line': "YouTube's dashboard for setting up streams and seeing how they did."},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Which platform is best for live streaming?', 'Go where your audience already is. Gamers often use Twitch or YouTube, while brands and creators often go live on Instagram, TikTok, Facebook or LinkedIn.'),
  ('Do I need special equipment to live stream?', 'No. A phone and steady internet are enough to start. A microphone and a stand make a big difference as you grow.'),
  ('Can I stream to several platforms at once?', 'Yes, with streaming tools that send one video to more than one app. Watching comments from every place at once is harder, so plan for help.'),
  ('Can I save my live stream?', 'Most platforms let you save a replay or download the video after the stream ends. Check your settings before you go live.'),
  ('How long should a live stream be?', 'Long enough to cover your topic and answer questions, often 20 to 60 minutes. Watch when viewers start to leave and plan the next one around that.'),
 ],
 'related': ['youtube', 'engagement', 'community-management', 'monetization', 'broadcast-channel'],
},
{
 'slug': 'lookalike-audience',
 'short': 'A lookalike audience is an ad audience the platform builds to reach new people who share traits with your existing customers.',
 'body': '''<h2>What is a lookalike audience?</h2>
<p>A lookalike audience is a targeting option in social media advertising. You give the ad platform a group of people who already matter to you, such as buyers or newsletter subscribers. The platform studies what they have in common and finds other users who look similar. Then it shows your ads to those new people, who are more likely to care than a random crowd.</p>
<p>You never see who is in a lookalike audience. You only see its rough size and the results your ads get. The platform does the matching.</p>
<h2>How lookalike audiences work</h2>
<p>Everything starts with a source audience, sometimes called a seed. Common sources include:</p>
<ul>
<li>A customer list you upload, such as emails from past buyers.</li>
<li>People who visited your website, tracked with a pixel or tag.</li>
<li>People who engaged with your page, videos or lead forms.</li>
<li>Your existing followers.</li>
</ul>
<p>The platform matches that list to its users and looks for patterns in their activity and interests. Then it builds a new audience of people who share those patterns. Most platforms let you choose how close the match should be. A tight match is smaller and more alike. A loose match is bigger but less precise.</p>
<h2>Choosing a source and a match size</h2>
<p>The source decides what the platform looks for. If you upload everyone who ever bought from you, it looks for people like your average buyer. If you upload only customers who bought three times or more, it looks for people like your best buyers. A smaller, sharper source often finds better people, as long as it meets the platform's minimum size.</p>
<p>Here is a made-up example. A pet food shop has a list of past buyers. It makes one lookalike from all buyers and a second one from buyers on a monthly plan. The second audience is smaller, but the people in it are more likely to sign up for a plan too.</p>
<p>Match size works the same way. A close match stays near your source and reaches fewer people. A wide match reaches many more people who share fewer traits. Start close, see what it costs to get a result, then try wider matches once the close one runs out of new people.</p>
<h2>How to create a lookalike audience</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Pick your best source.</b> Your highest-value customers teach the platform more than everyone who ever clicked.</li>
<li><b>Check permission.</b> Make sure you collected the data with consent and follow privacy laws.</li>
<li><b>Upload or select the source.</b> Do this in the platform's ad manager.</li>
<li><b>Choose a location.</b> Pick the country or region you want to reach.</li>
<li><b>Set the match size.</b> Start with a close match, then test wider ones.</li>
<li><b>Exclude current customers.</b> There's no point paying to reach people who already bought.</li>
<li><b>Run a test.</b> Compare results against other audiences with the same ad and budget.</li>
</ol>
<h2>How to test and measure a lookalike</h2>
<p>The fair way to judge a lookalike is a side-by-side test. Run the same ad with the same budget to a few audiences at once, such as a close lookalike, a wider lookalike, an interest audience and broad targeting. Then compare the rate at which each one turns viewers into sign-ups or sales.</p>
<figure data-chart="2"></figure>
<p>In the made-up test above, the close lookalike won. In real life, the result can go any way. Platforms have grown better at finding buyers with broad targeting, so lookalikes don't always win. The only way to know for your ads is to test.</p>
<p>Watch these numbers for each audience:</p>
<ul>
<li><b>Click-through rate:</b> how many people who saw the ad clicked it.</li>
<li><b>Conversion rate:</b> how many clickers signed up or bought.</li>
<li><b>Cost per result:</b> what you paid for each sign-up or sale.</li>
<li><b>Audience size:</b> whether it is big enough to keep spending on.</li>
</ul>
<h2>Lookalike audience vs retargeting</h2>
<p>Retargeting shows ads to people who already know you, like someone who left items in their cart. Lookalike audiences reach new people who have never heard of you but resemble your fans. Retargeting helps close sales. Lookalikes help find new customers. Many ad plans use both, with lookalikes filling the top of the funnel and retargeting bringing people back.</p>
<figure data-chart="3"></figure>
<h2>Common mistakes</h2>
<ul>
<li>A source list so small that the platform has little to learn from.</li>
<li>A source full of low-quality leads, which teaches the platform to find more of the same.</li>
<li>Mixing very different customers in one source, which blurs the match.</li>
<li>Forgetting to exclude current customers.</li>
<li>Judging a lookalike after a day or two, before it has enough results to compare.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Building a lookalike audience', 'steps': [
   ('Choose a source', 'Your best customers or most engaged fans.'),
   ('Check permission', 'Use only data you collected with consent.'),
   ('Upload and pick a region', 'Add the source in the ad manager and choose where to reach.'),
   ('Set the match size', 'Start close, then test wider matches.'),
   ('Test against others', 'Same ad, same budget, different audiences.')]},
  {'type': 'columns', 'title': 'Sign-up rate by audience', 'sub': 'One ad shown to four audiences with the same budget', 'example': True,
   'rows': [('Close lookalike', 3.2, '3.2%'), ('Wide lookalike', 1.9, '1.9%'), ('Interests', 1.4, '1.4%'), ('Broad', 2.1, '2.1%')], 'highlight': 'Close lookalike', 'labels': 'all', 'unit': 'Sign-up rate',
   'note': 'Made-up results from one test. Yours will differ, so run your own.'},
  {'type': 'versus', 'title': 'Lookalike audience vs retargeting', 'cols': ('Lookalike audience', 'Retargeting'), 'rows': [
   ('Who sees the ad', 'New people like your customers', 'People who already know you'),
   ('Main job', 'Find new customers', 'Bring people back to buy'),
   ('Needs a source list or pixel', True, True),
   ('Audience size', 'Usually large', 'Usually small'),
   ('Place in the funnel', 'Top', 'Bottom')]},
 ],
 'tools': [
  {'name': 'Meta Ads Manager', 'url': 'https://www.facebook.com/business/tools/ads-manager', 'domain': 'facebook.com', 'line': "Meta's tool for building ad audiences and running ads on Facebook and Instagram."},
  {'name': 'LinkedIn Campaign Manager', 'url': 'https://business.linkedin.com/advertise', 'domain': 'linkedin.com', 'line': "LinkedIn's tool for creating ad audiences and running ads to professionals."},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag your ad links so you can see which audience brought visitors to your site.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics for seeing what ad visitors do after they land.'},
 ],
 'faqs': [
  ('How big should my source audience be?', 'Each platform sets its own minimum, and larger, higher-quality lists usually give better matches. Check the ad tool for its current requirement.'),
  ('Are lookalike audiences still useful?', 'Yes, though platforms now also offer broad automatic targeting. Testing a lookalike against broad targeting shows which works better for your ads.'),
  ('Is it legal to upload a customer list?', "It can be, if you collected the data with permission and follow privacy laws and the platform's terms. Platforms usually scramble the data before matching it."),
  ('Can I see who is in my lookalike audience?', 'No. The platform keeps the list private and only shows a rough size and how your ads perform.'),
  ('What is the best source for a lookalike?', 'Your most valuable customers usually make the best source, such as repeat buyers. A list of everyone who ever clicked tends to give a weaker match.'),
 ],
 'related': ['retargeting', 'target-audience', 'paid-social', 'psychographics', 'boosted-post'],
},
]

TERMS += [
{
 'slug': 'lurker',
 'short': 'A lurker is someone who reads and watches posts online but rarely or never likes, comments or posts anything themselves.',
 'body': '''<h2>What is a lurker?</h2>
<p>A lurker is a silent member of an online space. They follow accounts, read threads and watch videos, but they almost never leave a trace. The word sounds a bit sneaky, yet it isn't usually an insult. Most people lurk somewhere. You might comment often on one app and just scroll on another.</p>
<p>Lurking is simply watching without joining in. Some people do it because they are shy. Others are busy, still learning about a topic or just enjoy reading more than talking. Plenty of lurkers have followed an account for years without ever pressing like.</p>
<h2>Where people use the word</h2>
<p>You'll hear "lurker" most in online communities like forums, Reddit, Discord servers and Facebook Groups. People often admit it when they finally speak up. A classic phrase is "long-time lurker, first-time poster." Creators also use it to wave at their quiet viewers, for example on a live stream or in a Story.</p>
<p>Here is a made-up example post: "Long-time lurker here! Finally baked my first sourdough loaf after reading this group for a year. Be gentle with feedback."</p>
<p>And a made-up creator Story: "Shout-out to all my lurkers. Drop a single emoji if you're watching, no pressure."</p>
<p>You may also see "delurk," which means to come out of hiding and post for the first time. Some communities run a "delurking day" where quiet members are invited to say hello.</p>
<h2>Why lurkers matter</h2>
<p>In most communities, the people who post are a small slice of the people who read. The made-up chart below shows how that split can look in a typical group. Most members only read, a few react now and then, and a small number do most of the talking.</p>
<figure data-chart="1"></figure>
<p>Lurkers still see your content and may buy from you later. They might share your post in a private chat and never like it in public. So a post with few comments can still be doing real work. If you judge your content only by comments, you miss most of your audience.</p>
<h2>How to spot your quiet audience</h2>
<p>Your analytics show lurkers even when your comments don't. Reach, views, watch time and saves all count people who looked without speaking. Compare how many people saw a post with how many reacted. The gap between those numbers is mostly lurkers.</p>
<figure data-chart="2"></figure>
<p>In the made-up example above, thousands of people saw the post and a big share read or watched most of it. Only a few dozen commented. That post did well, even though the comment section looks empty.</p>
<p>Other signs of a strong quiet audience include:</p>
<ul>
<li>Saves and shares that are high next to likes.</li>
<li>Profile visits and link clicks after a post goes out.</li>
<li>Customers who say "I've followed you for ages" when they finally buy or email.</li>
<li>Direct messages from people who have never commented.</li>
</ul>
<h2>Lurking on different networks</h2>
<p>Lurking looks a little different from app to app. On video apps, lurkers watch to the end and maybe replay a clip, but they skip the comments. On LinkedIn, many people read posts at work and never react, since a like shows up for their boss and coworkers too. In Discord servers and group chats, lurkers sit in channels for months and read every message. On forums and Reddit, they often search old threads for answers instead of asking new questions.</p>
<p>Knowing this helps you set fair goals. A LinkedIn post with few reactions may still have been read by the very buyers you wanted to reach. A Discord server with a few loud members may have many more quiet ones who show up when it counts, like on launch day.</p>
<h2>How to get lurkers to join in</h2>
<ul>
<li><b>Make it easy:</b> ask a yes-or-no question or offer a poll.</li>
<li><b>Lower the stakes:</b> say there's no wrong answer, or invite a single emoji reply.</li>
<li><b>Welcome first posts:</b> reply warmly when someone new speaks up.</li>
<li><b>Offer private options:</b> some people prefer to answer by DM.</li>
<li><b>Thank quiet fans:</b> letting them know they count can make them feel part of the group.</li>
<li><b>Ask about them:</b> "Where are you reading this from?" is easier to answer than "What do you think?"</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li>Calling out lurkers in a way that sounds like a scolding. It makes people want to hide more.</li>
<li>Deciding a post failed because it got few comments, without checking reach and saves.</li>
<li>Asking big, open questions that take effort to answer.</li>
<li>Ignoring a first-time poster, which teaches them not to try again.</li>
</ul>
<p>Not every lurker wants to talk, and that's fine. Respect people who just like to read. They are still part of your audience.</p>''',
 'charts': [
  {'type': 'stack', 'title': 'Who does the talking in a group', 'sub': 'Members of one online community by how they take part', 'example': True,
   'parts': [('Only read', 72), ('React now and then', 18), ('Comment sometimes', 7), ('Post often', 3)],
   'note': 'Made-up numbers to show a common pattern.'},
  {'type': 'funnel', 'title': 'Seen by many, talked about by few', 'sub': 'One post from seen to commented', 'example': True, 'unit': 'People',
   'stages': [('Saw the post', 5000), ('Read or watched most of it', 1900), ('Reacted', 240), ('Commented', 30)],
   'note': 'Made-up numbers. The gap between seen and commented is mostly lurkers.'},
 ],
 'faqs': [
  ('What does lurker mean on social media?', 'A lurker is someone who follows and reads content but rarely interacts with it by liking or commenting.'),
  ('Is it bad to be a lurker?', "No. Most people lurk in at least some online spaces. It's a normal way to learn and enjoy content without joining the conversation."),
  ('What does long-time lurker, first-time poster mean?', 'It means the person has read a community for a long time without posting and is now sharing something for the first time.'),
  ('What does delurk mean?', 'To delurk is to post or comment for the first time after only reading for a while. Some groups invite members to delurk by saying hello.'),
  ('How can I tell if lurkers see my posts?', 'Check reach, views and saves in your analytics. If many people saw a post but few commented, most of them were lurkers.'),
 ],
 'related': ['engagement', 'community-management', 'discord', 'facebook-group', 'dark-social'],
},
{
 'slug': 'mastodon',
 'short': 'Mastodon is a free, open source social network made of many independent servers that can follow and talk to each other.',
 'body': '''<h2>What is Mastodon?</h2>
<p>Mastodon looks a lot like other microblogging apps. You post short updates and scroll a timeline. The big difference is how it's built. There isn't one company running a single site. Instead, many separate servers, called instances, each run Mastodon software and set their own rules. Because they speak the same language, someone on one server can follow and reply to someone on another.</p>
<p>A good way to picture it is email. You can have an address with one provider and still write to people who use another. Mastodon works the same way for social posts.</p>
<h2>How Mastodon works</h2>
<p>When you join, you pick a server. Some are general, and others focus on a topic, a region or a language. Your handle includes your server, like @maria@example.social. Servers connect through a shared standard called ActivityPub, and the wider network of connected apps is often called the fediverse. If you don't like your server, you can move to another and bring your followers with you.</p>
<p>Each server has its own moderators and rules. One might ban political posts. Another might focus on artists and ask everyone to add image descriptions. Read the rules before you join, since they shape what your timeline feels like.</p>
<ul>
<li>Posts can be up to 500 characters on default servers, though some servers allow more.</li>
<li>Boosting a post shares it with your followers, similar to a repost.</li>
<li>Content warnings let you hide text behind a short label, so readers choose whether to open it.</li>
<li>Hashtags are a key way to be found, since there is less automatic recommendation.</li>
<li>The home timeline is mostly in time order, showing posts from people you follow.</li>
<li>You can choose who sees each post, from public to followers only.</li>
</ul>
<p>Here is how Mastodon's default limit compares with other short-post apps:</p>
<figure data-chart="1"></figure>
<h2>How to get started</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Pick a server.</b> Browse a list of servers and choose one whose rules and topic suit you.</li>
<li><b>Set up your profile.</b> Add a clear photo, a short bio and a link to your website.</li>
<li><b>Write an introduction.</b> Post a hello with the #introduction hashtag and a few of your interests.</li>
<li><b>Follow hashtags.</b> Follow tags in your field to find people worth following.</li>
<li><b>Add alt text to images.</b> Many Mastodon users expect a short description on every picture.</li>
<li><b>Reply and boost.</b> Join other people's threads. Growth here comes from conversation.</li>
</ol>
<h2>Mastodon vs X</h2>
<p>X is run by one company with one set of rules and a ranked feed. Mastodon is spread across many servers run by different people, each with its own moderators. Mastodon has no ads built into the software. Growth on Mastodon tends to be slower and more personal, and conversations often feel calmer.</p>
<figure data-chart="3"></figure>
<h2>Mastodon for brands</h2>
<p>Brands can do well on Mastodon if they act like members of the community. Talk like a person and answer replies. Use content warnings when your server's norms call for them, such as for long threads or sensitive topics. Avoid posting the same ad-like message over and over, which many users see as rude.</p>
<p>For example, a made-up indie game studio might post short dev updates twice a week, share screenshots with alt text and reply to every question about the game. It grows slowly, but its followers are loyal and talk about the game on other servers too.</p>
<h2>How to measure Mastodon</h2>
<p>Mastodon shows basic numbers on each post, like boosts, favorites and replies. Your follower count shows overall growth. Since there is less ranking, the time you post matters a lot, so test a few posting times and note which ones get the most replies.</p>
<p>Boosts matter more than favorites here. A boost puts your post in front of a whole new group of followers, often on other servers. A favorite is a nice nod, but it mostly stays between you and that person. If a post gets many boosts, write more like it.</p>
<p>Keep a simple monthly log of followers, boosts per post and replies per post. Growth on Mastodon is often slow at first, so compare months instead of days. If the numbers stay flat for a long time, look at whether your hashtags match what people in your field actually follow.</p>
<h2>Common mistakes</h2>
<ul>
<li>Joining a server without reading its rules.</li>
<li>Posting images with no alt text.</li>
<li>Skipping hashtags, which makes posts hard to find.</li>
<li>Copying posts from other apps without trimming them to fit 500 characters.</li>
<li>Only broadcasting and never replying to anyone.</li>
</ul>''',
 'charts': [
  {'type': 'bars', 'title': 'Characters per post on short-post apps', 'unit': 'Characters',
   'rows': [('Mastodon (default)', 500), ('Threads', 500), ('Bluesky', 300), ('X (standard)', 280)], 'highlight': 'Mastodon (default)',
   'note': "Limits used by Capybaroar's composer, November 2026."},
  {'type': 'steps', 'title': 'Getting started on Mastodon', 'steps': [
   ('Pick a server', 'Choose one whose rules and topic fit you.'),
   ('Fill in your profile', 'Photo, short bio and a website link.'),
   ('Post an introduction', 'Say hello with the #introduction hashtag.'),
   ('Follow hashtags', 'Find people in your field through the tags they use.'),
   ('Join conversations', 'Reply and boost. That is how people find you.')]},
  {'type': 'versus', 'title': 'Mastodon vs X', 'cols': ('Mastodon', 'X'), 'rows': [
   ('Run by', 'Many independent servers', 'One company'),
   ('Rules set by', "Each server's moderators", 'The company'),
   ('Post length', '500 characters on default servers', '280 characters for standard accounts'),
   ('Ads built into the software', False, True),
   ('Pick your own server', True, False)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Mastodon scheduler', 'url': '/mastodon-scheduler', 'line': 'Schedule Mastodon posts on one calendar with your other networks.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Check a post against the 500 character limit before you share it.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Is Mastodon free?', 'Yes. Mastodon is free and open source software, and most servers let you join without paying. Some servers ask for optional donations to cover their costs.'),
  ('What is the Mastodon character limit?', 'Default Mastodon servers allow posts of up to 500 characters. Some servers change this setting and allow more.'),
  ('Which Mastodon server should I join?', "Pick one with rules you agree with and a topic or region that fits you. You can follow people on any server, so your choice doesn't lock you in."),
  ('Can I schedule posts on Mastodon?', 'Yes. Mastodon supports scheduled posts through its API, and many apps and scheduling tools use it.'),
  ('What is the fediverse?', 'The fediverse is the wider network of apps and servers that talk to each other through shared standards like ActivityPub. Mastodon is one part of it.'),
 ],
 'related': ['microblogging', 'bluesky', 'threads', 'x-twitter', 'handle'],
},
{
 'slug': 'mcp',
 'short': 'MCP (Model Context Protocol) is an open standard that lets AI assistants connect to outside tools and data in a consistent way.',
 'body': '''<h2>What is MCP (Model Context Protocol)?</h2>
<p>MCP is a shared set of rules for how an AI assistant talks to other software. Without it, every AI app needs custom code for every tool it wants to use. With MCP, a tool builds one MCP server, and any AI app that supports MCP can use it. People often compare it to a universal plug. Anthropic introduced it as an open standard, and many AI apps and tools now support it.</p>
<p>For you, this means an AI assistant can do more than chat. Once it is connected to the right MCP servers, it can read your calendar, look up data or save drafts in an app you use, all from a plain request.</p>
<h2>How MCP works</h2>
<p>There are two main sides:</p>
<ul>
<li><b>The MCP client:</b> the AI app you talk to, such as a chat assistant or a coding tool.</li>
<li><b>The MCP server:</b> a small program that offers tools and data from another service, like a calendar, a database or a social media app.</li>
</ul>
<p>The server tells the AI what it can do, for example "list scheduled posts" or "create a draft." When you ask the assistant for something, it picks the right tool, sends a request and uses the answer in its reply. You stay in control because the app usually asks before taking actions.</p>
<figure data-chart="1"></figure>
<h2>Why MCP matters for social media work</h2>
<p>MCP lets you run social media tasks just by asking an AI assistant in plain words. With the right servers connected, you could ask it to:</p>
<ol>
<li>Draft a week of posts and save them as drafts in your scheduler.</li>
<li>Pull last month's top posts and sum up what they share.</li>
<li>Find open comments that still need a reply.</li>
<li>Check your content calendar for gaps.</li>
<li>Rewrite one post for each network's length limit.</li>
</ol>
<p>The assistant does the clicking, and you review the results. Here is a made-up example. A shop owner types: "Look at my scheduled posts for next week. If any day is empty, write a post about our spring sale and save it as a draft for that day." The assistant checks the calendar, finds two empty days and saves two drafts for the owner to approve.</p>
<h2>How to connect an MCP server</h2>
<ol>
<li><b>Check your AI app.</b> Make sure it supports MCP. Many chat and coding assistants do.</li>
<li><b>Find the server.</b> Use the MCP server from the tool you want to connect, ideally its official one.</li>
<li><b>Add it to your app.</b> Most apps let you paste a link or sign in. Some ask for a key.</li>
<li><b>Grant access.</b> Approve only the permissions the task needs.</li>
<li><b>Test with a safe request.</b> Ask for something read-only first, like "list my drafts."</li>
</ol>
<h2>MCP vs API</h2>
<p>An API is how software talks to a service, and it is usually written for developers. MCP sits on top of APIs and packages them in a form AI assistants understand. Many MCP servers call a service's API behind the scenes. If you code, you'd use the API directly. If you'd rather ask an assistant, MCP makes that possible.</p>
<figure data-chart="2"></figure>
<h2>Staying safe and reading the tool list</h2>
<p>Only connect MCP servers from sources you trust. Read what each one can access, and give it the smallest set of permissions that does the job. Keep keys and tokens private, and remove a connection when you stop using it. Review actions that publish, send or delete before you approve them, since an AI can misread a request.</p>
<p>It also helps to save AI work as drafts first. That way nothing goes live until a person has read it.</p>
<p>MCP shows up in a few kinds of apps. Chat assistants use it to reach your files, calendars and work tools. Coding tools use it to read databases, open tickets or check docs while they write code. Business apps offer MCP servers so their customers can work with them through an assistant of their choice.</p>
<p>If an app you use lists an MCP server, it usually has a short guide that shows the link to paste and what the server can do. Read that list of tools before you connect. It tells you exactly what the assistant will be able to see and change. If the list includes things like "delete" or "publish," decide whether you want the assistant to have those at all, or whether drafts are enough for your team.</p>
<h2>Common mistakes</h2>
<ul>
<li>Connecting servers from unknown sources because they promise extra features.</li>
<li>Giving full access when read-only would do.</li>
<li>Approving every action without reading it.</li>
<li>Pasting keys into chats or shared documents.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'What happens when you ask', 'steps': [
   ('You ask in plain words', '"Save a draft post for Friday about our new menu."'),
   ('The assistant picks a tool', 'It reads the list of tools the MCP server offers.'),
   ('It sends the request', 'The MCP server passes it to the app, often through its API.'),
   ('You approve', 'The assistant shows what it will do before it acts.'),
   ('The app answers', 'The draft is saved and the assistant tells you it is done.')]},
  {'type': 'versus', 'title': 'MCP vs API', 'cols': ('MCP', 'API'), 'rows': [
   ('Made for', 'AI assistants', 'Developers and their code'),
   ('How you use it', 'Ask in plain words', 'Write code that sends requests'),
   ('Needs coding to use', False, True),
   ('Often calls an API behind the scenes', True, False),
   ('Lists its tools so the AI can find them', True, False)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar MCP server', 'url': '/mcp', 'line': 'Connect Claude, ChatGPT or Cursor to your Capybaroar account on any plan.'},
  {'id': 'capybaroar', 'name': 'Capybaroar API', 'url': '/api', 'line': 'Build your own scripts and apps on top of Capybaroar.'},
  {'name': 'Claude', 'url': 'https://claude.ai', 'domain': 'claude.ai', 'line': 'An AI assistant from Anthropic that can connect to MCP servers.'},
  {'name': 'ChatGPT', 'url': 'https://chatgpt.com', 'domain': 'chatgpt.com', 'line': 'An AI assistant from OpenAI for writing and research.'},
 ],
 'list': 'ai-social-media-scheduling-tools',
 'faqs': [
  ('What does MCP stand for?', 'MCP stands for Model Context Protocol, an open standard for connecting AI assistants to tools and data.'),
  ('Do I need to code to use MCP?', 'Usually no. Many AI apps let you add an MCP server by pasting a link or signing in. Building your own server does take coding.'),
  ('Is MCP safe?', 'It can be, if you connect only trusted servers, limit their permissions and review actions before approving them. Treat an MCP connection like giving an app access to your account.'),
  ('Is MCP the same as an API?', 'No. An API is a general way for software to talk to a service. MCP is a standard that packages tools so AI assistants can find and use them.'),
  ('Can an AI post to social media through MCP?', 'It can if the MCP server offers that tool and you allow it. Saving posts as drafts first lets you check them before anything goes live.'),
 ],
 'related': ['api', 'ai-agent', 'auto-posting', 'social-media-management-tool', 'ai-generated-content'],
},
{
 'slug': 'meme',
 'short': 'A meme is an image, video, sound or phrase that spreads online as people copy it and change it to make new jokes.',
 'body': '''<h2>What is a meme?</h2>
<p>A meme is a piece of content that people pass around and remix. It often starts as a funny photo, a scene from a show, a catchphrase or a sound. Then others reuse the same format with their own twist, and it spreads. Part of the fun is that everyone knows the format, so a new version lands fast. Memes come and go quickly, and some come back years later.</p>
<p>What makes something a meme is the copying. One funny photo is just a funny photo. When lots of people start adding their own captions to it, it becomes a meme.</p>
<p>Common meme formats include:</p>
<ul>
<li><b>Image macros:</b> a picture with bold text on top and bottom.</li>
<li><b>Reaction images and GIFs:</b> a face or moment used to show a feeling.</li>
<li><b>Labeled images:</b> parts of a picture tagged with words to tell a joke.</li>
<li><b>Video and audio trends:</b> a sound or dance that many people copy with their own spin.</li>
<li><b>Text formats:</b> a fixed sentence pattern people fill in, like "Nobody: / Me at 2am:".</li>
<li><b>Comparison grids:</b> four or more boxes that sort things into types, often with a twist in the last box.</li>
</ul>
<h2>Why brands use memes</h2>
<p>Memes speak the language of the internet. A good one can make a brand feel human and in on the joke. They are cheap to make, quick to read and easy to share, which can boost reach. They also show that you understand your audience's sense of humor and the problems they joke about.</p>
<p>Here is a made-up example. A project management app posts a two-panel meme. The top panel says "The plan in the kickoff meeting." The bottom says "The plan by Thursday." Every project manager who sees it nods, laughs and sends it to a coworker.</p>
<h2>How to use memes well</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Learn the meaning.</b> Search for the meme's origin and how people use it before you post.</li>
<li><b>Tie it to your audience.</b> The joke should be about something your followers truly deal with.</li>
<li><b>Make your own version.</b> Use your own photos or a blank template when you can.</li>
<li><b>Keep your brand voice.</b> If your brand is serious, a light touch works better than a wild joke.</li>
<li><b>Move fast.</b> Memes age quickly, and a late one feels forced.</li>
<li><b>Check the rights.</b> Photos, film stills and art may be protected by copyright, so be careful with commercial use.</li>
</ol>
<h2>The life of a meme</h2>
<p>Most memes follow a curve. A few people start it, interest climbs fast, it peaks, and then it fades as everyone moves on. Brands that post near the peak look clued in. Brands that post a week after the peak can look like they are trying too hard. The made-up chart below shows the shape.</p>
<figure data-chart="2"></figure>
<p>You can't predict the exact timing, but you can watch for signs. When a format starts showing up in many accounts in your niche, it is rising. When you see it in ads from big brands everywhere, it is probably on the way out.</p>
<h2>Memes on different networks</h2>
<p>The same joke often needs a different shape on each app. On TikTok and Instagram Reels, memes are usually short videos built on a sound or a fixed format. On X, Threads and Bluesky, text memes and single images travel well, and replies often turn into a chain of new versions. On LinkedIn, work jokes do best when they are gentle and tied to a real job problem. On Pinterest, memes are less common, though funny quote images get saved.</p>
<p>So before you cross-post a meme, ask whether it fits each place. A video meme might become a still image with a caption for X. A loud joke for TikTok might need a calmer version for LinkedIn. The idea can stay the same while the format changes.</p>
<h2>Memes and copyright</h2>
<p>Many memes use images or clips that someone else owns. Sharing them for fun is common, but using them to sell something can raise legal issues. The safest choices are memes made with your own photos, stock images you have a license for, or text formats that don't need anyone's picture. When in doubt, ask a lawyer or skip it.</p>
<h2>Common mistakes</h2>
<ul>
<li>Using a meme you don't fully understand, which can backfire if it has a hidden or offensive meaning.</li>
<li>Jumping on jokes about tragedies or serious news, which makes a brand look careless.</li>
<li>Posting memes all the time, so your feed feels like it is trying too hard.</li>
<li>Pasting a big logo across the meme, which ruins the joke.</li>
<li>Explaining the joke in the caption. Let the humor do the work.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'From spotting a meme to posting it', 'steps': [
   ('Spot it early', 'Notice a format popping up in your niche.'),
   ('Check what it means', 'Look up where it came from and how people use it.'),
   ('Fit it to your audience', 'Find the version your followers will relate to.'),
   ('Make your own version', 'Use your own images or a blank template.'),
   ('Post while it is fresh', 'A day or two late can be too late.')]},
  {'type': 'line', 'title': 'Interest in one meme over ten days', 'sub': 'Interest score, peak day = 100', 'example': True,
   'points': [('Day 1', 8), ('2', 30), ('3', 72), ('4', 100), ('5', 76), ('6', 48), ('7', 30), ('8', 18), ('9', 11), ('10', 7)], 'unit': 'Interest',
   'note': 'Made-up numbers to show a common rise and fall.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Post your version to every channel fast, or schedule it for when your audience is online.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for making image memes with your own photos and text.'},
  {'name': 'CapCut', 'url': 'https://www.capcut.com', 'domain': 'capcut.com', 'line': 'A video editor for making video memes and trend clips.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Can brands legally use memes?', 'It depends. Many memes use photos or clips owned by someone else, so commercial use can raise copyright issues. Making your own version with your own images is safer.'),
  ('How do I find memes that are trending?', 'Watch what people in your niche are sharing and check the explore or discover page of each app.'),
  ('What is the difference between a meme and a trend?', 'A meme is a format people copy and change, usually as a joke. A trend is anything many people are doing or talking about at once, and it can include memes.'),
  ('How fast should a brand post a meme?', 'Usually within a day or two of noticing it in your niche. If it already shows up in ads everywhere, it may be too late.'),
 ],
 'related': ['viral', 'trend', 'user-generated-content', 'gif', 'remix'],
},
{
 'slug': 'mention',
 'short': 'A mention is when someone names an account by typing @ and its handle in a post or comment, which usually sends that account a notice.',
 'body': '''<h2>What is a mention?</h2>
<p>A mention, often called an @mention, happens when you type the @ sign followed by someone's handle, like @sunnybakery. The handle turns into a link to that profile, and the account usually gets a notice. Mentions work in posts, comments, replies, Stories and many chat apps. They are how people pull someone into a conversation.</p>
<p>For a brand, mentions are one of the main ways customers reach out in public. Someone might praise your product, ask a question or complain, and they add your handle so you see it.</p>
<h2>Mentions vs tags</h2>
<p>The two words are often used the same way. On some apps, a tag means marking a person in a photo or video, while a mention means naming them with @ in the text. Both usually alert the person and link to their profile.</p>
<p>People also talk about "untagged mentions," which is when someone writes your brand name without the @ sign. You won't get a notice for those, but they still matter. A post that says "Sunny Bakery has the best croissants in town" is great news, even if it never pings you.</p>
<figure data-chart="1"></figure>
<h2>Why mentions matter</h2>
<ul>
<li>They show who is talking about you and what they are saying.</li>
<li>They often hold questions or complaints that need a reply.</li>
<li>A mention from a well-known account can send new people to your profile.</li>
<li>Mentioning partners and customers in your posts invites them to share it.</li>
<li>They give you real words from customers to use in your copy, with permission.</li>
</ul>
<h2>How to handle mentions</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Check every day.</b> Look at your notifications or social inbox daily, and more often during a launch.</li>
<li><b>Sort them.</b> Group mentions into questions, praise, complaints and spam.</li>
<li><b>Answer the urgent ones first.</b> Questions and complaints need a fast reply. Move private details to DMs.</li>
<li><b>Thank people.</b> A short thank you for kind words goes a long way. Share good ones, with permission, as social proof.</li>
<li><b>Search for untagged mentions.</b> Use social listening or search your brand name to catch posts without the @.</li>
</ol>
<p>Here is a made-up example. A bike shop gets 40 mentions in a week. Most are happy customers posting their new bikes. A handful ask about opening hours. Two complain about a late repair. The shop answers the complaints first, thanks the happy riders and pins its hours to the profile so fewer people need to ask.</p>
<p>Once you sort mentions for a few weeks, patterns show up. Lots of the same question means your website or bio is missing something. A spike in complaints after a change means the change needs a second look. The made-up mix below is from one month for a small brand.</p>
<figure data-chart="3"></figure>
<h2>Mentions on different networks</h2>
<p>Every app handles mentions a little differently. On Instagram, people can mention you in a caption, a comment or a Story, and Story mentions often show up in your messages. On X, Threads and Bluesky, a reply to your post counts as a mention too, so busy threads can fill your notices fast. On LinkedIn, mentioning a Company Page works much like mentioning a person. On Mastodon, your handle includes your server name, so people need the full address to reach you.</p>
<p>Most apps also let you choose who can mention you. Brands usually leave this open so customers can reach them. Private people may limit it to friends or turn it off. If you can't mention someone, their settings may block it.</p>
<p>Because each network sends mentions to a different place, it is easy to miss some. Pulling them into one view saves you from opening every app in turn.</p>
<h2>Tips for mentioning others</h2>
<p>Mention people when they are truly part of the post, such as a collaborator, a customer story or a speaker at your event. Mentioning big accounts that have nothing to do with the post can look spammy. Always double-check the handle before posting, since a typo might tag a stranger. Handles can differ from network to network, so look each one up instead of guessing.</p>
<h2>Common mistakes</h2>
<ul>
<li>Only checking mentions once a week, so questions sit unanswered.</li>
<li>Arguing with angry customers in public instead of offering help.</li>
<li>Ignoring untagged mentions because no notice came in.</li>
<li>Tagging dozens of accounts in one post to get attention.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Tagged vs untagged mention', 'cols': ('Tagged @mention', 'Untagged mention'), 'rows': [
   ('Uses the @ sign and your handle', True, False),
   ('You get a notice', True, False),
   ('Links to your profile', True, False),
   ('How to find it', 'Notifications or inbox', 'Search or social listening'),
   ('Worth a reply', True, True)]},
  {'type': 'steps', 'title': 'Handling mentions each day', 'steps': [
   ('Collect them', 'Open your notifications or social inbox.'),
   ('Sort them', 'Questions, praise, complaints and spam.'),
   ('Reply to urgent ones', 'Answer questions and complaints first.'),
   ('Thank and share', 'Say thanks and reshare praise with permission.'),
   ('Search for the rest', 'Look for your brand name without the @.')]},
  {'type': 'stack', 'title': 'What one month of mentions looked like', 'sub': 'Mentions for a small brand, sorted by type', 'example': True,
   'parts': [('Praise', 52), ('Questions', 30), ('Complaints', 10), ('Spam', 8)],
   'note': 'Made-up numbers. Sort your own mentions to see your mix.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See comments and mentions from your channels in one inbox and reply from there.'},
  {'name': 'Google Alerts', 'url': 'https://www.google.com/alerts', 'domain': 'google.com', 'line': 'Email alerts when your brand name shows up on new web pages.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What does @ mean on social media?', 'The @ sign before a username creates a mention. It links to that account and usually notifies them.'),
  ('How do I see who mentioned me?', 'Check your notifications tab, which often has a mentions filter. A social inbox or listening tool can collect mentions from several networks in one place.'),
  ('Can I remove a mention of my account?', "On many apps you can remove a tag of yourself from someone else's post or limit who can mention you in your privacy settings."),
  ('What is an untagged mention?', "It is when someone writes your name or brand without the @ sign. You don't get a notice, so you need social listening to find it."),
  ('How fast should a brand reply to mentions?', 'As fast as you can, especially for questions and complaints. Checking at least once a day keeps people from waiting long.'),
 ],
 'related': ['tag', 'handle', 'social-listening', 'community-management', 'social-customer-service'],
},
]

TERMS += [
{
 'slug': 'meta-business-suite',
 'short': "Meta Business Suite is Meta's free tool for managing a Facebook Page and its linked Instagram account from one place.",
 'body': '''<h2>What is Meta Business Suite?</h2>
<p>Meta Business Suite is a dashboard made by Meta, the company behind Facebook and Instagram. It lets a business handle both apps without jumping between them. You can use it on a computer in a web browser or on a phone through its app. It is aimed at small and medium businesses that want one home for their Meta accounts.</p>
<p>Before tools like this, a shop owner had to post on Facebook, then open Instagram and post again, then check two sets of messages. Business Suite puts those jobs side by side.</p>
<h2>What you can do with it</h2>
<ul>
<li><b>Create and schedule posts:</b> write a post once and publish it to Facebook, Instagram or both.</li>
<li><b>Plan with a calendar:</b> see what's scheduled for the days and weeks ahead.</li>
<li><b>Answer messages and comments:</b> a shared inbox gathers messages and comments from both apps.</li>
<li><b>Check results:</b> insights show reach, engagement and audience details.</li>
<li><b>Run ads:</b> boost posts or create simple ads.</li>
<li><b>Manage access:</b> give teammates roles so they can help without sharing passwords.</li>
</ul>
<p>Meta adds and moves features over time, so menus may look a bit different from one month to the next.</p>
<p>Using Meta Business Suite is free. You only pay if you choose to run ads, and that money goes to the ads themselves.</p>
<h2>How to get started</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Have a Facebook Page.</b> Business Suite is built around a Page for your business.</li>
<li><b>Switch Instagram to a professional account.</b> A business or creator account can connect to your Page.</li>
<li><b>Sign in.</b> Open Meta Business Suite with the Facebook account that manages your Page.</li>
<li><b>Connect Instagram.</b> Link the account in settings and confirm the login.</li>
<li><b>Invite teammates.</b> Add people and give each one the role they need.</li>
<li><b>Test a post.</b> Schedule a test post to both apps and check how it looks on each.</li>
</ol>
<h2>Tips for using it well</h2>
<p>Posting the same text to both apps is quick, but the two audiences often respond to different styles. Facebook posts can carry a link and a longer story. Instagram posts lean on the picture, and links in captions don't click. Use the option to change the text for each app before you schedule.</p>
<p>Here is a made-up example. A yoga studio writes one post about a new evening class. On Facebook, it adds the sign-up link and a few lines about the teacher. On Instagram, it uses a bright photo of the room, a short caption and "Link in bio" at the end. Same news, two versions.</p>
<p>Other tips:</p>
<ul>
<li>Check the inbox at set times each day so messages don't pile up.</li>
<li>Look at insights once a week and note which posts earned the most reach.</li>
<li>Use the calendar to spot empty days before they happen.</li>
<li>Give each teammate the smallest role that lets them do their job.</li>
</ul>
<h2>How to read the insights</h2>
<p>The insights area shows how your Page and Instagram account are doing over a date range you pick. Start with reach, which tells you how many people saw your content. Then look at engagement, such as reactions, comments, shares and saves. The audience section shows where your followers live and when they tend to be online.</p>
<p>Pick one or two numbers that match your goal and check them every week. If you want more people to find you, watch reach and new followers. If you want sales, watch link clicks and messages. Write the numbers down in a simple sheet so you can see the trend over a few months.</p>
<p>Compare Facebook and Instagram side by side. Many businesses find that one app brings far more replies or clicks than the other. That tells you where to spend more of your time, and which app needs a fresh approach.</p>
<h2>Business Suite vs a multi-network scheduler</h2>
<p>Meta Business Suite only covers Meta's apps. If you also post to TikTok, LinkedIn, YouTube or other networks, you'll need another tool or extra time for each. A multi-network scheduler puts every channel on one calendar, while Business Suite goes deeper on Meta's own features, like ads and Page settings. Many teams use both: Business Suite for ads and Meta settings, and a scheduler for day-to-day posting everywhere.</p>
<figure data-chart="2"></figure>
<p>Because the insights only show Meta data, you'll want your website analytics to see what happens after someone clicks. Some newer post types and features may reach the apps themselves before they reach Business Suite. And if you lose admin access to the Page, you lose access to Business Suite too, so always keep more than one admin.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting the exact same caption to Facebook and Instagram every time.</li>
<li>Leaving one person as the only admin on the Page.</li>
<li>Using a personal Instagram account that can't connect.</li>
<li>Forgetting to check the inbox, so customer messages wait for days.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Setting up Meta Business Suite', 'steps': [
   ('Have a Facebook Page', 'Business Suite is built around your Page.'),
   ('Switch Instagram to professional', 'A business or creator account can connect.'),
   ('Sign in and connect', 'Open Business Suite and link Instagram in settings.'),
   ('Add teammates', 'Give each person the role they need.'),
   ('Schedule a test post', 'Check how it looks on both apps.')]},
  {'type': 'versus', 'title': 'Meta Business Suite vs a multi-network scheduler', 'cols': ('Meta Business Suite', 'Multi-network scheduler'), 'rows': [
   ('Facebook and Instagram', True, True),
   ('TikTok, LinkedIn, YouTube and more', False, True),
   ('Made by Meta', True, False),
   ('Meta ad tools built in', True, False),
   ('One calendar for every channel', False, True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan posts for Facebook, Instagram and 10 more networks on one calendar.'},
  {'name': 'Meta Business Suite', 'url': 'https://business.facebook.com', 'domain': 'facebook.com', 'line': "Meta's free dashboard for your Facebook Page and linked Instagram account."},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Our free guide to picture sizes for Instagram posts.'},
  {'name': 'Facebook cover photo size', 'url': '/tools/facebook-cover-photo-size', 'line': 'Our free guide to the right size for your Page cover.'},
 ],
 'list': 'facebook-post-schedulers',
 'faqs': [
  ('Is Meta Business Suite the same as Business Manager?', "They are related. Business Manager was Meta's older tool for managing business assets and ad accounts, and many of those settings now sit alongside Business Suite. Meta has changed the names over time."),
  ('Can I schedule Instagram posts in Meta Business Suite?', 'Yes. You can schedule feed posts and Stories for a connected professional Instagram account.'),
  ('Can I use Meta Business Suite without a Facebook Page?', 'You generally need a Facebook Page to use it, and your Instagram account connects through that Page.'),
  ('Does Meta Business Suite post to TikTok or LinkedIn?', "No. It only covers Meta's own apps. For other networks you need a separate tool or have to post in each app."),
  ('Is there a Meta Business Suite phone app?', 'Yes. Meta offers a phone app as well as the web version, so you can answer messages and check posts on the go.'),
 ],
 'related': ['facebook-page', 'instagram', 'business-account', 'analytics', 'social-media-scheduling'],
},
{
 'slug': 'micro-influencer',
 'short': 'A micro-influencer is a creator with a modest, focused following who tends to know their audience well and get strong engagement.',
 'body': '''<h2>What is a micro-influencer?</h2>
<p>A micro-influencer sits between the very small nano-influencer and the big-name creator. Their audience is large enough to matter but small enough that they still reply to comments and know their regulars. They usually stick to one niche, like trail running, home baking or budget travel. Different agencies draw the size cutoff in different places, so think of it as a range.</p>
<p>What sets them apart is focus. A micro-influencer who reviews running shoes has followers who run. When they say a shoe is good, those followers listen, because that is why they follow.</p>
<h2>Why brands work with micro-influencers</h2>
<ul>
<li><b>Trust:</b> followers often see them as a real person with honest opinions.</li>
<li><b>Engagement:</b> smaller, focused audiences often comment and share at a higher rate than very large ones.</li>
<li><b>Fit:</b> their niche makes it easier to reach exactly the right people.</li>
<li><b>Cost:</b> they usually charge less than large creators, so you can work with several.</li>
<li><b>Content:</b> many make photos and videos you can, with permission, reuse in your own posts or ads.</li>
</ul>
<h2>Micro vs macro influencers</h2>
<p>A macro-influencer reaches a much larger crowd, which helps when the goal is broad awareness. A micro-influencer reaches fewer people who are closer to the topic, which often helps when the goal is trust or sales. Many brands run several micro-influencers at once to get both reach and a personal touch.</p>
<figure data-chart="1"></figure>
<h2>How to find and work with micro-influencers</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Search your niche.</b> Look through hashtags and keywords and note who makes posts people respond to.</li>
<li><b>Check your own fans.</b> See who already mentions or tags your brand.</li>
<li><b>Vet the audience.</b> Read their comments to make sure the engagement comes from real people. Rows of generic emoji can be a sign of bots.</li>
<li><b>Reach out personally.</b> Send a short note that shows you know their work.</li>
<li><b>Offer a fair deal.</b> Payment, free product, an affiliate cut or a mix.</li>
<li><b>Share a simple brief.</b> Explain the goal and the must-haves, then let them speak in their own voice.</li>
<li><b>Track results.</b> Give each creator a unique code or link.</li>
</ol>
<p>The kind of content a micro-influencer makes depends on where they post. On Instagram, they often share photos, Reels and Stories, and Stories are a natural place for a quick product mention with a link. On TikTok, short videos with a real reaction or a how-to tend to work best. On YouTube, they may do longer reviews that people find through search for months. On LinkedIn, micro-influencers are often experts in a field who post about their work, which suits business products.</p>
<p>Pick the network where your buyers already spend time, then find creators there. A sock brand might look on Instagram and YouTube, where runners share gear. A software company might look on LinkedIn, where its buyers read about work tools. The same creator may post on more than one app, so ask which one their most engaged followers use.</p>
<h2>What to put in a brief</h2>
<p>A good brief fits on one page. It should say what the product is, who it's for and the one thing you want followers to know. Add the dates, the number and type of posts, and any words or claims to avoid. Spell out how the post should be labeled as an ad or a gift. Then stop. The less you script, the more the post sounds like the creator, and that is why you hired them.</p>
<p>Here is a made-up example. A hiking sock brand asks five trail runners to wear its socks on one long run each and post honestly about how their feet felt. It gives each runner a code for followers. No script, just the socks and the deadline.</p>
<h2>How to measure a campaign</h2>
<p>Look past likes. Follow each creator's audience from seeing the post to buying. Views tell you reach. Clicks on the link tell you interest. Uses of the code tell you sales. The made-up funnel below shows one creator's results for one post.</p>
<figure data-chart="3"></figure>
<p>Compare creators side by side once the posts are a week or two old. Some will drive many clicks but few sales. Others will have fewer views but a loyal crowd that buys. Keep working with the ones whose followers act, even if their numbers look smaller.</p>
<h2>Common mistakes</h2>
<ul>
<li>Expecting free posts in return for a small gift. Be clear and generous.</li>
<li>Sending a stiff script that makes the post sound like an ad.</li>
<li>Picking creators only for their numbers, without checking their values or past posts.</li>
<li>Forgetting to ask for clear disclosure, which puts both of you at risk.</li>
<li>Judging a creator on one post instead of a few.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Micro vs macro influencer', 'cols': ('Micro-influencer', 'Macro-influencer'), 'rows': [
   ('Audience size', 'Modest and focused', 'Large and broad'),
   ('Replies to most comments', True, False),
   ('Best for', 'Trust and sales in a niche', 'Wide awareness'),
   ('Easy to work with several at once', True, False),
   ('Usually has a manager or agency', False, True)]},
  {'type': 'steps', 'title': 'Working with a micro-influencer', 'steps': [
   ('Find them in your niche', 'Hashtags, keywords and people who already tag you.'),
   ('Check the audience', 'Read comments to make sure followers are real.'),
   ('Agree on a fair deal', 'Fee, product, affiliate cut or a mix, in writing.'),
   ('Send a short brief', 'Goal, dates and must-haves. No script.'),
   ('Track with codes or links', 'One per creator so you can compare.')]},
  {'type': 'funnel', 'title': 'One creator post, from views to sales', 'example': True, 'unit': 'People',
   'stages': [('Saw the post', 18000), ('Clicked the link', 540), ('Visited the product page', 410), ('Bought with the code', 46)],
   'note': 'Made-up numbers for one post by one creator.'},
 ],
 'tools': [
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': "Work out a creator's engagement rate from their public numbers."},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Make a tracked link for each creator so you can see who sent visitors.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for keeping creators, deals and results in one place.'},
 ],
 'faqs': [
  ('How many followers does a micro-influencer have?', 'There is no official number, and agencies use different ranges. Think of a micro-influencer as having a mid-sized, focused audience that is still personal.'),
  ('Are micro-influencers worth it?', 'For many brands, yes. They often bring strong engagement and trust in a specific niche, and you can work with several for the cost of one large creator.'),
  ('How do I pay a micro-influencer?', 'Common options are a flat fee, free products, a commission on sales through an affiliate link or a mix. Put the terms in writing.'),
  ('How do I know if a micro-influencer has real followers?', 'Read their comments and look for real conversations. Sudden jumps in followers or rows of generic comments can be warning signs.'),
  ('Do micro-influencers need to label paid posts?', 'Yes. In many countries, paid or gifted posts must be clearly marked as ads. Agree on how to label them before anything goes live.'),
 ],
 'related': ['influencer', 'nano-influencer', 'influencer-marketing', 'niche', 'engagement-rate'],
},
{
 'slug': 'microblogging',
 'short': 'Microblogging is posting short, frequent updates such as text, links or images to a feed where followers can reply and share.',
 'body': '''<h2>What is microblogging?</h2>
<p>Microblogging is a style of social media built around short posts. You skip the long article and share a quick thought, a link, a photo or a short video. People follow accounts they like, read a stream of updates and reply, repost or quote them. The short format makes it fast to post and fast to read, so news and conversation move quickly.</p>
<p>The word comes from blogging. A blog post might run a thousand words. A microblog post might be one sentence. Same idea of sharing your thoughts in public, much smaller size.</p>
<h2>Microblogging platforms and their limits</h2>
<p>Each app sets a cap on how long a post can be. Here are the limits for the main short-post apps:</p>
<figure data-chart="1"></figure>
<ul>
<li><b>X:</b> 280 characters per post for standard accounts.</li>
<li><b>Threads:</b> 500 characters per post.</li>
<li><b>Bluesky:</b> 300 characters per post.</li>
<li><b>Mastodon:</b> 500 characters on default servers.</li>
</ul>
<p>Some people also count Tumblr and LinkedIn's short posts as microblogging, since the idea is the same. The apps differ in more than length. Some rank posts by what they think you'll like. Others show posts mostly in time order. Some lean on hashtags to help people find you, while others rely on replies and reposts.</p>
<h2>How to write good short posts</h2>
<ol>
<li><b>Lead with the point.</b> Put your main idea in the first few words.</li>
<li><b>One idea per post.</b> If you have more, start a thread.</li>
<li><b>Cut filler.</b> Use plain words, since every character counts.</li>
<li><b>Add a picture when it helps.</b> An image or short clip can tell the story faster.</li>
<li><b>Ask now and then.</b> A question starts replies.</li>
<li><b>Reply to others often.</b> On these apps, conversation is a big part of growth.</li>
</ol>
<p>Here is a made-up before and after. Before: "We are so excited to share with all of you that our brand new coffee blend is finally available to order today!" After: "Our new coffee blend is out today. Dark, smooth, a little cocoa. Order link below." The second one says more in fewer characters.</p>
<p>When an idea doesn't fit in one post, you can chain several together as a thread. Each post replies to the one before, so readers can follow the whole story in order. Make the first one a strong hook, since it's the part most people see first. Keep each post readable on its own in case someone only sees one.</p>
<figure data-chart="2"></figure>
<h2>Microblogging vs blogging</h2>
<p>A blog post is long and is often found through search engines weeks or months later. A microblog post is short, lives in a fast-moving feed and gets most of its attention soon after it's posted. Blogging suits deep guides. Microblogging suits quick news and back-and-forth chat. Many people link the two by sharing a short post that points to a longer article.</p>
<figure data-chart="3"></figure>
<h2>Microblogging for brands</h2>
<p>Brands use short posts in a few different ways. Some share news and launches the moment they happen. Some answer customer questions in public, which shows everyone that they respond. Others join conversations about their field, adding a useful tip or a friendly reply to posts that have nothing to do with selling.</p>
<p>Here is a made-up example. A small bike shop posts once or twice a day. In the morning it shares a quick repair tip. During the day it replies to local cyclists who ask about routes or parts. Once a week it posts a photo of a bike it fixed. It rarely posts about sales, yet people in town know it as the helpful bike shop, and that brings them in.</p>
<p>The key is to sound like a person. Short posts that read like press releases get ignored. Short posts that sound like a friendly expert get replies. Pick one or two people to write for the brand so the voice stays the same.</p>
<h2>How to measure microblogging</h2>
<p>Look at replies, reposts and quotes more than likes. They show that people cared enough to pass your post along or talk back. Track profile visits and new followers after a post does well, since that is how short posts turn into a bigger audience. And because these feeds move fast, check when your best posts went out. Posting when your followers are online can matter a lot.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting the same text on every app without trimming it to each limit.</li>
<li>Only posting and never replying to anyone.</li>
<li>Burying the point at the end of a long post.</li>
<li>Starting a thread that could have been one post.</li>
<li>Posting in bursts, then going silent for weeks.</li>
</ul>''',
 'charts': [
  {'type': 'bars', 'title': 'Characters per post on microblogging apps', 'unit': 'Characters',
   'rows': [('Threads', 500), ('Mastodon (default)', 500), ('Bluesky', 300), ('X (standard)', 280)], 'highlight': 'X (standard)',
   'note': "Limits used by Capybaroar's composer, November 2026."},
  {'type': 'steps', 'title': 'Writing a thread', 'steps': [
   ('Write the hook', 'The first post says what the thread will teach or tell.'),
   ('One point per post', 'Each post covers a single step or idea.'),
   ('Make each post stand alone', 'Someone who sees only one should still get it.'),
   ('End with a wrap-up', 'Sum up and add a link or a question.')]},
  {'type': 'versus', 'title': 'Microblogging vs blogging', 'cols': ('Microblogging', 'Blogging'), 'rows': [
   ('Length', 'A few sentences', 'Hundreds of words or more'),
   ('Where people find it', 'Feeds and replies', 'Search and links'),
   ('Most attention comes', 'Soon after posting', 'Over weeks and months'),
   ('Best for', 'Quick news and chat', 'Deep guides'),
   ('Lives on your own site', False, True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Schedule short posts to X, Threads, Bluesky and Mastodon from one calendar.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': "Check a post against each network's limit before you post."},
 ],
 'list': 'x-post-schedulers',
 'faqs': [
  ('What is an example of microblogging?', 'Posting a short update on X, Threads, Bluesky or Mastodon is microblogging. So is sharing a quick photo with a one-line caption in a feed.'),
  ('Why is it called microblogging?', 'It is like blogging, but each post is very short. The small size is where the word micro comes from.'),
  ('Is microblogging good for business?', 'It can be. Short posts are a quick way to share news and answer customers in public. It works best when you reply to others as well as post.'),
  ('What is the character limit on X?', 'Standard X accounts can post up to 280 characters. Threads allows 500, Bluesky 300 and default Mastodon servers 500.'),
 ],
 'related': ['x-twitter', 'threads', 'bluesky', 'mastodon', 'thread'],
},
{
 'slug': 'moderation',
 'short': 'Moderation is reviewing and managing the comments and messages in your community to remove harm and keep talk useful.',
 'body': '''<h2>What is moderation?</h2>
<p>Moderation is the job of looking after the spaces where people talk to you or each other. It covers comment sections, group chats, forums, Discord servers and Facebook Groups. A moderator removes spam, scams and abuse, steps in when talks get heated and makes sure the rules are followed. Good moderation keeps a space safe and welcoming, so more people feel comfortable joining in.</p>
<p>Most of the time, moderation is calm work. You read comments, answer what needs an answer and clear out the junk. Now and then a post blows up, and good habits make the difference between a busy day and a crisis.</p>
<h2>Why moderation matters</h2>
<p>An unmoderated comment section can fill up with spam links and insults. That scares off real customers and can make your brand look careless. Scammers sometimes pretend to be your brand in replies, offering fake prizes or support, so fast action protects your followers. Moderation also shows people that someone is listening, which builds trust.</p>
<h2>Moderation tools</h2>
<ul>
<li><b>Hide:</b> the comment is hidden from others, but the writer may not know.</li>
<li><b>Delete:</b> the comment is removed for everyone.</li>
<li><b>Mute or restrict:</b> limit what one account can do without blocking it.</li>
<li><b>Block:</b> stop an account from seeing or reaching you.</li>
<li><b>Keyword filters:</b> automatically hide comments with words you choose.</li>
<li><b>Report:</b> send rule-breaking content to the platform to review.</li>
</ul>
<p>The exact tools and names differ by platform, so check what each app offers. Group spaces like Discord servers and Facebook Groups often give you more, such as slow mode, member approval or timeouts.</p>
<p>These two get mixed up a lot. Hiding keeps the comment visible to the writer and their friends while removing it for everyone else, which can calm things down without starting a fight. Deleting removes it for good. Hide is often the better first step for rude but harmless comments. Delete is for scams, hate and anything dangerous.</p>
<figure data-chart="1"></figure>
<h2>How to set up moderation rules</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Write short guidelines.</b> Say what is and isn't allowed in plain words.</li>
<li><b>Make them easy to find.</b> Pin them or link them in your bio or group description.</li>
<li><b>Match actions to problems.</b> Decide what fits each case, from a reply to a warning to a ban.</li>
<li><b>Turn on filters.</b> Add slurs, scam phrases and common spam links to your keyword filter.</li>
<li><b>Set a schedule.</b> Choose who moderates and when, including weekends.</li>
<li><b>Keep a log.</b> Write down tough calls so decisions stay fair and consistent.</li>
</ol>
<h2>Moderation on different networks</h2>
<p>Each kind of space needs a slightly different approach. On Instagram and TikTok, most moderation happens in comments on your posts, and keyword filters do a lot of the work. On Facebook Pages, you also need to watch replies to ads, which can draw more angry or spammy comments than normal posts. On X, Threads and Bluesky, replies are public and fast, so mute and block are your main tools. In Facebook Groups and Discord servers, you run the whole space, so you set member rules, approve new members and can give trusted members moderator roles.</p>
<p>The bigger and more open the space, the more you need written rules and a schedule. A group of a few hundred friendly customers may need a quick check each day. A busy server with members in many time zones needs moderators spread across the day.</p>
<h2>What a normal week looks like</h2>
<p>Most comments on most accounts need nothing more than a reply or a like. A small share needs action. The made-up mix below shows one week of comments on a mid-sized brand account. Knowing your own mix helps you plan how much time moderation takes.</p>
<figure data-chart="3"></figure>
<p>Here is a made-up example of a tricky case. A customer leaves an angry comment about a late order, with some swearing. It is rude, but it is a real complaint. The moderator replies in public with an apology and asks the person to send their order number by DM. The swearing stays, the problem gets fixed, and other customers see that the brand cares.</p>
<h2>Common mistakes</h2>
<ul>
<li>Deleting every complaint, which makes people angrier and can look like you're hiding something.</li>
<li>Waiting days to act, so spam and abuse spread.</li>
<li>Moderating with no written rules, which leads to choices that seem random.</li>
<li>Arguing with trolls in public. Hide, mute or block and move on.</li>
<li>Leaving one person to moderate everything with no backup.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Hide vs delete a comment', 'cols': ('Hide', 'Delete'), 'rows': [
   ('Others can see it', False, False),
   ('The writer can still see it', True, False),
   ('Can be undone', True, False),
   ('Good for', 'Rude but harmless comments', 'Scams, hate and danger'),
   ('Likely to start a fight', 'Less likely', 'More likely')]},
  {'type': 'steps', 'title': 'Setting up moderation', 'steps': [
   ('Write the rules', 'Short guidelines in plain words.'),
   ('Post them where people look', 'Pinned post, bio or group description.'),
   ('Decide the actions', 'Reply, hide, warn, mute, block or ban.'),
   ('Turn on filters', 'Slurs, scam phrases and spam links.'),
   ('Set a schedule and a log', 'Who covers when, and a record of tough calls.')]},
  {'type': 'stack', 'title': 'One week of comments', 'sub': 'Comments on one brand account, sorted by what they needed', 'example': True,
   'parts': [('Fine as is', 82), ('Needed a reply', 10), ('Spam to remove', 6), ('Rule breaking', 2)],
   'note': 'Made-up numbers. Your mix will depend on your audience and topic.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Read comments and mentions from your channels in one place so nothing waits for days.'},
  {'name': 'Meta Business Suite', 'url': 'https://business.facebook.com', 'domain': 'facebook.com', 'line': "Meta's dashboard with comment and message tools for Facebook and Instagram."},
  {'name': 'Notion', 'url': 'https://www.notion.com', 'domain': 'notion.com', 'line': 'A shared workspace for your rules and a log of tough calls.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is the difference between moderation and community management?', 'Moderation is about enforcing rules and removing harmful content. Community management is broader and includes starting talks and growing the group.'),
  ('Should I delete negative comments?', 'Usually no. Answer honest complaints in public and help the person. Remove comments that break your rules, such as spam, threats or hate.'),
  ('Can moderation be automated?', 'Partly. Keyword filters and spam detection catch a lot, but a person should review tricky cases and replies that need care.'),
  ('Do I need a moderator for a small account?', 'You may not need a dedicated person, but someone should check comments and messages often and know your rules.'),
  ('What should I do about fake accounts pretending to be my brand?', 'Report them to the platform, warn your followers in a post and reply under any fake comments with a short note. Never ask followers to share passwords or card details.'),
 ],
 'related': ['community-guidelines', 'community-management', 'troll', 'mute', 'social-media-policy'],
},
{
 'slug': 'monetization',
 'short': 'Monetization is turning your social media content or audience into income through ads, sponsorships, sales or paid fan support.',
 'body': '''<h2>What is monetization?</h2>
<p>Monetization means earning money from what you post. A creator might sign brand deals or sell their own products. A business might sell directly through social shops or use social media to drive sales on its website. Most people who earn well mix several income sources so they don't rely on just one.</p>
<p>It rarely happens all at once. Most accounts start with one small source of money, like an affiliate link, and add more as their audience grows and they learn what their followers will pay for.</p>
<h2>Ways to monetize social media</h2>
<ul>
<li><b>Platform payouts:</b> some apps share ad revenue or pay from creator programs.</li>
<li><b>Brand deals:</b> companies pay you to feature their products.</li>
<li><b>Affiliate links:</b> you earn a cut when someone buys through your link.</li>
<li><b>Subscriptions:</b> fans pay monthly for extra content or perks.</li>
<li><b>Tips and gifts:</b> viewers send money during live streams or on posts.</li>
<li><b>Your own products:</b> merch, courses, templates or digital downloads.</li>
<li><b>Services:</b> coaching or freelance work found through your content.</li>
</ul>
<p>Each app runs its own programs with its own rules, and those rules change. Check the current requirements on each one before you plan around it.</p>
<h2>How to start monetizing</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Pick a clear niche.</b> You need to know who your audience is and what they need.</li>
<li><b>Post on a steady schedule.</b> Trust and growth come from showing up.</li>
<li><b>Read the program rules.</b> Each platform sets its own requirements for its money programs.</li>
<li><b>Start with one source.</b> Choose one that fits your audience, like affiliate links for product reviewers.</li>
<li><b>Track what earns.</b> Note which posts lead to sales or sign-ups.</li>
<li><b>Add more sources over time.</b> A change on one app shouldn't wipe you out.</li>
</ol>
<p>Relying on one source is risky. If a brand pulls its budget or an app changes its payouts, your income can drop overnight. A healthier mix spreads money across a few sources. The made-up example below shows how one creator's monthly income might split.</p>
<figure data-chart="2"></figure>
<p>For example, a made-up home cooking creator earns from brand deals with kitchen companies, affiliate links to the pans she uses, an e-book of weeknight recipes and a small share of platform payouts. When one brand deal ends, the other sources keep her going while she finds the next.</p>
<h2>How to track what earns</h2>
<p>A simple way to compare posts and platforms is earnings per 1,000 views. It lets you see whether a long video on one app pays better than short clips on another, once you count every source of money tied to each post.</p>
<figure data-chart="3"></figure>
<p>Use tracked links and unique discount codes so you know which post led to each sale. Keep a monthly sheet with each income source, so you can see which ones are growing and which are shrinking.</p>
<h2>Monetization on different networks</h2>
<p>Each app tends to favor certain ways of earning. Long video apps like YouTube often share ad money with creators who meet their rules, and longer videos leave room for a sponsor message. Short video apps like TikTok and Instagram Reels are strong for brand deals, gifts during live streams and affiliate links. LinkedIn rarely pays creators directly, but it is a good place to find clients for services like coaching or consulting. Pinterest can send steady traffic to a shop or blog where you sell or use affiliate links.</p>
<p>So the same audience size can earn very different amounts on different apps. Think about what your followers do on each one. People who search for tutorials may buy a course. People who scroll for fun may be happier to send a gift or click a product link.</p>
<h2>Owning your audience</h2>
<p>Platforms can change their rules or pay programs at any time. If all your income depends on one app, you are at risk. Building an email list or a website gives you a direct line to your fans that no platform controls. Many creators use social media to find people and their own channels to keep in touch.</p>
<h2>Common mistakes</h2>
<ul>
<li>Taking every brand deal, even ones that don't fit, which costs you your audience's trust.</li>
<li>Forgetting to disclose paid posts, which breaks rules in many countries.</li>
<li>Pricing your work too low, which makes it hard to keep going.</li>
<li>Chasing quick money before you have real fans, which often leads to burnout.</li>
<li>Skipping taxes and records. Income from social media is usually taxable, so keep track.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Starting to monetize', 'steps': [
   ('Pick your niche', 'Know who you serve and what they need.'),
   ('Post steadily', 'Build trust and an audience first.'),
   ('Start with one source', 'Choose the one that fits your followers best.'),
   ('Track what earns', 'Use codes and tracked links.'),
   ('Add more sources', 'Spread your income so one change cannot sink you.')]},
  {'type': 'stack', 'title': "One creator's monthly income mix", 'example': True,
   'parts': [('Brand deals', 45), ('Affiliate links', 25), ('Own products', 20), ('Platform payouts', 10)],
   'note': 'Made-up numbers for one creator. Every mix is different.'},
  {'type': 'formula', 'title': 'Earnings per 1,000 views', 'formula': 'Earnings per 1,000 views = total earnings from a post ÷ views × 1,000',
   'note': 'Made-up numbers to show the math.', 'result': '$3.00',
   'example': [('Earnings', '$120'), ('Views', '40,000')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'Put your shop, affiliate links and sign-up page behind one link in your bio.'},
  {'name': 'YouTube money calculator', 'url': '/tools/youtube-money-calculator', 'line': 'Get a rough estimate of YouTube earnings from your views.'},
  {'name': 'TikTok money calculator', 'url': '/tools/tiktok-money-calculator', 'line': 'Get a rough estimate of TikTok earnings from your views.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag your links so you can see which posts lead to sales.'},
 ],
 'faqs': [
  ('How do you get monetized on social media?', "Join a platform's creator program once you meet its rules, partner with brands, use affiliate links or sell your own products and services."),
  ('Can small accounts make money?', 'Yes. Small accounts with a loyal niche audience often earn through affiliate links and small brand deals.'),
  ('Do I have to pay taxes on social media income?', 'In most countries, yes. Income from brand deals and sales is usually taxable. Check with a tax professional where you live.'),
  ('What is the easiest way to start monetizing?', 'Affiliate links are often the easiest first step, since you can share products you already use. Brand deals and your own products usually come later.'),
  ('Should I rely on platform payouts?', 'It is safer to treat them as one part of your income. Programs and rates can change, so spread your earnings across a few sources.'),
 ],
 'related': ['creator-economy', 'creator-fund', 'affiliate-marketing', 'sponsored-content', 'social-commerce'],
},
]

TERMS += [
{
 'slug': 'mute',
 'short': "Mute is a setting that hides posts or messages from an account, word or chat without unfollowing or blocking, and the other side isn't told.",
 'body': '''<h2>What is mute?</h2>
<p>Muting lets you stop seeing something without cutting ties. When you mute an account, its posts stop showing in your feed, but you still follow it and it can still see your content. You can also mute words, hashtags, Stories, group chats or notifications on most apps. The muted person generally isn't told. You can unmute any time, and things go back to normal.</p>
<p>It is the gentlest way to control your feed. Nothing changes for the other person. Only what you see changes.</p>
<h2>Mute vs block vs unfollow</h2>
<p>Apps give you a few ways to step back from an account. They differ in how much they change and whether the other person can tell.</p>
<ul>
<li><b>Mute:</b> you stop seeing their content. You stay connected, and they usually don't know.</li>
<li><b>Unfollow:</b> you stop following them. They may notice their follower count drop or see you're gone from their list.</li>
<li><b>Block:</b> you cut contact. They can't see your profile or reach you, depending on the app.</li>
<li><b>Restrict:</b> on some apps, a middle option that limits what one person can do without them knowing.</li>
</ul>
<figure data-chart="1"></figure>
<p>Mute is handy for a friend who posts a lot, a coworker you'd rather not unfollow or a topic you're tired of hearing about. Block is for people who harass you or won't leave you alone.</p>
<h2>What you can mute</h2>
<p>The options vary by app, but most offer some of these:</p>
<ul>
<li><b>Accounts:</b> hide someone's posts, Stories or both from your feed.</li>
<li><b>Words and phrases:</b> hide any post that uses a word you pick, like a show's name before you've watched the finale.</li>
<li><b>Hashtags:</b> keep a busy tag out of your feed.</li>
<li><b>Conversations:</b> stop getting notices from a thread that keeps buzzing.</li>
<li><b>Group chats:</b> keep a chat but silence its alerts.</li>
<li><b>Notifications:</b> pause alerts for a few hours or until you turn them back on.</li>
</ul>
<p>Some apps let you set a time limit, such as muting a word for a day or a week. That is useful for live events and spoilers.</p>
<h2>How to mute</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Open the profile or chat.</b> Go to the account or conversation you want to mute.</li>
<li><b>Open the menu.</b> It is often shown as three dots.</li>
<li><b>Choose mute.</b> Pick what to mute, such as posts, Stories or notifications.</li>
<li><b>Mute words in settings.</b> Look in your privacy or content settings for muted words.</li>
<li><b>Undo it the same way.</b> Follow the same steps and pick unmute.</li>
</ol>
<p>The idea is the same everywhere, but the details change. On Instagram, you can mute someone's posts and Stories separately, so you might keep their posts and skip their Stories. On X, Threads and Bluesky, you can mute accounts and words, and muting a word often hides replies that use it too. On Facebook, the closest option is often called snooze or unfollow, and snoozing can be set for a limited time. In Discord and group chats, mute usually means silencing alerts while you stay in the chat.</p>
<p>Because the names and menus move around, search the app's help pages for "mute" if you can't find it. The option is almost always somewhere near the profile menu or in privacy settings.</p>
<h2>How brands and social media managers use mute</h2>
<p>For people who manage brand accounts, mute is mostly about keeping their own feed and alerts calm. You might mute spoiler words before a big show, or mute notices on a busy post so you can focus on other work. Some managers mute their own brand's hashtag on a personal account so work doesn't follow them home.</p>
<p>Here is a made-up example. A social media manager runs a giveaway that gets hundreds of comments. Her phone buzzes nonstop. She mutes notices for that post on her phone and checks the comments twice a day from her desk instead. She still answers every question, but she can get other work done.</p>
<h2>When muting isn't enough</h2>
<p>Keep in mind that muting doesn't remove anything from your public pages. If someone is posting spam or abuse in your comments, other people still see it, even if you don't. Use moderation tools like hiding, filtering or blocking instead. And if someone threatens you or keeps harassing you, block and report them.</p>
<p>Muting a customer who complains a lot is also risky for a brand. You might miss a real problem. It is better to answer them once, kindly, and move the talk to private messages.</p>
<h2>Common mistakes</h2>
<ul>
<li>Muting a troll on a brand account and forgetting their comments are still public.</li>
<li>Muting a word so broad that you miss posts you wanted to see.</li>
<li>Forgetting what you muted, then wondering why a friend went silent.</li>
<li>Using mute when someone is breaking the rules. That calls for moderation.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Mute vs block', 'cols': ('Mute', 'Block'), 'rows': [
   ('You stop seeing their posts', True, True),
   ('They can still see your posts', True, False),
   ('You still follow each other', True, False),
   ('They are usually told', False, False),
   ('Good for', 'A noisy feed', 'Harassment and abuse')]},
  {'type': 'steps', 'title': 'Muting an account', 'steps': [
   ('Open the profile', 'Go to the account or chat you want to mute.'),
   ('Tap the menu', 'Often three dots near the name.'),
   ('Pick mute', 'Choose posts, Stories, notifications or all of them.'),
   ('Undo any time', 'Repeat the steps and choose unmute.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': "Keep your brand's comments and mentions in one inbox, apart from your personal feed."},
  {'name': 'Meta Business Suite', 'url': 'https://business.facebook.com', 'domain': 'facebook.com', 'line': "Meta's dashboard with comment tools for your Facebook Page and Instagram account."},
 ],
 'faqs': [
  ('Does someone know if I mute them?', "Generally no. Most platforms don't send a notice when you mute someone, and they can still see and interact with your posts."),
  ('Can a muted account still see my posts?', "Yes. Muting only changes what you see. To stop someone from seeing your posts, you'd need to block them or change your privacy settings."),
  ('Can I mute words or hashtags?', 'Many apps let you mute words and hashtags so posts that use them stay out of your feed.'),
  ('Does muting hide comments on my posts from others?', 'No. Muting only changes your view. To hide a comment from everyone, use the hide or delete option on that comment.'),
  ('How do I see who I have muted?', 'Most apps keep a list of muted accounts in privacy or settings. You can unmute anyone from there.'),
 ],
 'related': ['moderation', 'unfollow', 'troll', 'community-management'],
},
{
 'slug': 'nano-influencer',
 'short': 'A nano-influencer is a creator with a small but close-knit following, often friends, neighbors and fans of one niche topic.',
 'body': '''<h2>What is a nano-influencer?</h2>
<p>A nano-influencer is the smallest tier of influencer. They aren't famous, but the people who follow them know and trust them. Their followers might be locals, classmates, members of a hobby group or fans of a very specific topic. When a nano-influencer recommends a café or a pair of hiking socks, it feels like advice from a friend, because often it is.</p>
<p>Many nano-influencers don't think of themselves as influencers at all. They are a teacher who posts about books, a dad who shares weekend hikes or a student who reviews ramen spots in one city. That is part of why people trust them.</p>
<h2>Why brands work with nano-influencers</h2>
<p>Small audiences can be powerful. Nano-influencers tend to reply to nearly every comment, so their posts start real conversations. Their content looks natural, which helps it blend into feeds. For local businesses, a neighbor with a loyal following can bring in more customers than a celebrity from far away.</p>
<ul>
<li><b>Trust:</b> followers often know them in real life.</li>
<li><b>Real talk:</b> comments turn into actual conversations.</li>
<li><b>Local reach:</b> many followers live nearby.</li>
<li><b>Easy start:</b> many are open to product swaps or small fees.</li>
<li><b>Fresh content:</b> their photos and videos look like real life, which you can reshare with permission.</li>
</ul>
<h2>Nano vs micro influencers</h2>
<p>Micro-influencers have a larger following and usually treat content as more of a side business. Nano-influencers are smaller and more personal, and many post just for fun. Micro creators may have more polished content and media kits. Nano creators often have even closer ties to their audience. A campaign can use both to get a mix of reach and warmth.</p>
<figure data-chart="1"></figure>
<h2>How to work with nano-influencers</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Look close to home.</b> Find people who already post about your product type or your town.</li>
<li><b>Check your own fans.</b> Your followers and tagged posts may already hold the right people.</li>
<li><b>Send a personal message.</b> Say what you liked about their posts. Skip copy-paste pitches.</li>
<li><b>Offer something fair.</b> Free product, a discount for their followers, a fee or an affiliate cut.</li>
<li><b>Keep the brief simple.</b> Share the must-haves and let them post in their own way.</li>
<li><b>Give each person a code or link.</b> That is how you see who drove results.</li>
<li><b>Say thank you.</b> Reshare their posts, with permission, and keep in touch.</li>
</ol>
<h2>How to track results</h2>
<p>With small creators, each one brings a small number of sales or visits. The value comes from working with several at once and seeing who fits best. Give each person their own code, then compare. The made-up chart below shows sales by code from five nano creators who each posted once for a local bakery.</p>
<figure data-chart="3"></figure>
<p>In that made-up example, one creator drove far more sales than the rest. The bakery invites her back each month and tries new people in the other spots. Over time, it builds a small group of regulars who know the brand well.</p>
<p>Here is a made-up campaign. A new climbing gym invites eight local climbers with small followings to a free evening session. Each one gets a guest pass to give away and a code for a discount on a first month. They post Stories from the night and a photo or two over the next week. The gym counts code uses, new sign-ups and how many new people tag the gym afterward. The whole thing costs a few passes and a pizza night.</p>
<h2>Nano-influencers on different networks</h2>
<p>Most nano-influencers post on Instagram and TikTok, where everyday life content fits right in. Instagram Stories are a natural spot for a quick "look what I got" moment with a link sticker. TikTok can push a small creator's video to many strangers when it lands well, so one post sometimes reaches far past their followers. Facebook Groups and local community pages are another good place for neighborhood creators. On LinkedIn, a nano-influencer might be a respected person in one small industry whose posts every peer reads.</p>
<h2>Things to watch</h2>
<ul>
<li><b>Disclosure:</b> nano creators may be new to brand deals, so explain how to label posts as ads or gifts.</li>
<li><b>Written terms:</b> put basic terms in writing, even for a gift.</li>
<li><b>Timelines:</b> be patient, since many have jobs or school.</li>
<li><b>Respect:</b> treat them as partners. A good experience can turn a nano-influencer into a long-term fan.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Nano vs micro influencer', 'cols': ('Nano-influencer', 'Micro-influencer'), 'rows': [
   ('Audience size', 'Small', 'Modest'),
   ('Followers often know them in person', True, False),
   ('Usually has a media kit', False, True),
   ('Often happy with product or a small fee', True, False),
   ('Good for', 'Local and word of mouth', 'Niche reach and sales')]},
  {'type': 'steps', 'title': 'Working with nano-influencers', 'steps': [
   ('Find local fans', 'People who already post about your town or product.'),
   ('Reach out personally', 'A short, friendly message that shows you looked.'),
   ('Agree on a fair swap', 'Product, discount, fee or affiliate cut, in writing.'),
   ('Give each a code', 'So you can see who drove results.'),
   ('Thank and reshare', 'With permission, and invite the best back.')]},
  {'type': 'columns', 'title': 'Sales by creator code', 'sub': 'Five nano creators, one post each', 'example': True,
   'rows': [('Ana', 14), ('Ben', 6), ('Cara', 22), ('Dev', 9), ('Eli', 11)], 'highlight': 'Cara', 'labels': 'all', 'unit': 'Sales',
   'note': 'Made-up numbers for one local bakery.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See mentions of your brand in one inbox and spot fans who already talk about you.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': "Check a creator's engagement rate from their public numbers."},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Make a tracked link for each creator.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for keeping track of creators, codes and results.'},
 ],
 'faqs': [
  ('How many followers does a nano-influencer have?', 'There is no set number, and agencies use different ranges. A nano-influencer has the smallest following of the influencer tiers, often made up of people who know them.'),
  ('Do nano-influencers get paid?', 'Some do and some work for free products or discounts. Fair pay depends on the work you ask for, so agree on it before they post.'),
  ('Are nano-influencers good for local businesses?', 'Yes. Their followers are often nearby, which makes them a strong fit for cafés, gyms, salons and shops that serve one area.'),
  ('Do nano-influencers need to label gifted posts?', 'In many countries, yes. Gifted and paid posts should be clearly marked, so explain this when you reach out.'),
 ],
 'related': ['micro-influencer', 'influencer', 'influencer-marketing', 'user-generated-content', 'word-of-mouth'],
},
{
 'slug': 'native-content',
 'short': 'Native content is content made to fit the platform it appears on, so it looks and feels like the other posts people see there.',
 'body': '''<h2>What is native content?</h2>
<p>Native content follows the habits of the place where it's posted. A native TikTok is a vertical video with a fast hook and a sound. A native LinkedIn post is a clear text post with short paragraphs. A native Pinterest Pin is a tall image with a helpful title. Each one fits right in with what people expect to see on that app.</p>
<p>The term has a second meaning in advertising. Native advertising is paid content designed to match the look of the site or feed it runs on, like a sponsored article on a news site. Both meanings share the same idea: content that blends in with its surroundings.</p>
<h2>Native content vs cross-posted content</h2>
<p>Cross-posting means sharing the exact same post on many networks. It saves time, but it can look out of place. A video with another app's watermark, a caption full of tags that don't work on that network or a square image cropped badly in a tall feed all tell viewers the post wasn't made for them. Native content takes the same idea and shapes it for each place.</p>
<figure data-chart="1"></figure>
<p>You don't have to start from scratch for each app. Start with one idea, then change the shape, the length and the tone to fit. Many teams write one main version and then make quick edits for each network.</p>
<h2>How to make native content</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Use each app as a regular user.</b> Spend time scrolling to learn what people post and enjoy.</li>
<li><b>Get the shape right.</b> Note the right size for images and video on each app, from tall to square.</li>
<li><b>Match the tone.</b> Playful on TikTok, more thoughtful on LinkedIn, helpful on Pinterest.</li>
<li><b>Use the app's own features.</b> Stickers, sounds, polls or document posts show you belong there.</li>
<li><b>Fit the text limits.</b> Write captions that work within each app's cap.</li>
<li><b>Upload files directly.</b> A link to a video on another network feels like a detour.</li>
</ol>
<p>Length is one of the clearest signs that a post was made for its app. A caption that works on Facebook may get cut off or rejected on X. Here are the caps for the main networks:</p>
<figure data-chart="3"></figure>
<p>Even when a long caption fits, short often reads better. A long story suits Facebook and LinkedIn. A single sharp line suits X, Threads and Bluesky.</p>
<h2>Native advertising and disclosure</h2>
<p>Because native ads blend in, they must be labeled. Words like "sponsored," "paid partnership" or "ad" tell readers that money was involved. Hiding that label can mislead people and break advertising rules in many countries. Good native ads are honest about who paid and still give readers something useful.</p>
<h2>An example</h2>
<p>Say a made-up bakery wants to share a new croissant. On TikTok it posts a quick video of the flaky layers being pulled apart, set to a trending sound. On Instagram it shares a carousel with close-ups and the price. On LinkedIn the owner writes about the four months it took to test the recipe and what she learned about patience. On Pinterest it posts a tall photo titled "How to tell a good croissant." Same news, shaped four ways.</p>
<h2>Native content on different networks</h2>
<p>Here is a quick sense of what feels native on the main apps, in general terms. On Instagram, polished photos, carousels and Reels with clear covers. On TikTok, fast vertical video that starts with action in the first second. On YouTube, longer videos with a strong thumbnail, plus Shorts for quick clips. On LinkedIn, text posts with a clear opening line, document posts and real stories from work. On X, Threads and Bluesky, short, sharp text and replies. On Pinterest, tall images with helpful titles that people save for later.</p>
<p>Features on every app change often. The best guide is what you see working in your own feed this month.</p>
<p>Compare the same idea across networks. If the native version on each app beats the posts you used to cross-post unchanged, your effort is paying off. Look at watch time on video apps, saves on Pinterest and Instagram, and comments on LinkedIn. Each app rewards a different kind of attention, so judge each version by what counts there.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting a video with another app's watermark.</li>
<li>Using hashtags or mentions that don't work on the network you post to.</li>
<li>Cropping a wide image into a tall feed so the main subject is cut off.</li>
<li>Copying one tone everywhere, so the brand sounds stiff on fun apps or silly on work apps.</li>
<li>Running native ads without a clear label.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Native vs cross-posted content', 'cols': ('Native content', 'Cross-posted content'), 'rows': [
   ('Shape fits the app', True, False),
   ('Caption fits the text limit', True, 'Not always'),
   ('Uses the app\'s own features', True, False),
   ('Time to make', 'More', 'Less'),
   ('Looks like it belongs in the feed', True, False)]},
  {'type': 'steps', 'title': 'Turning one idea into native posts', 'steps': [
   ('Start with one idea', 'The news, tip or story you want to share.'),
   ('Pick the shape for each app', 'Tall video, carousel, text post or Pin.'),
   ('Change the tone and length', 'Fit each audience and each text limit.'),
   ('Add the app\'s own touches', 'Sounds, stickers, polls or document pages.'),
   ('Upload directly to each app', 'No watermarks and no detour links.')]},
  {'type': 'bars', 'title': 'Characters per post by network', 'unit': 'Characters',
   'rows': [('Facebook', 63206), ('LinkedIn', 3000), ('Instagram', 2200), ('TikTok', 2200), ('Threads', 500), ('Bluesky', 300), ('X (standard)', 280)], 'highlight': 'X (standard)',
   'note': "Limits used by Capybaroar's composer, November 2026."},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Schedule to each network from one calendar and check the previews before posts go out.'},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Our free guide to the right picture sizes for Instagram.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for resizing one design into the shape each app needs.'},
  {'name': 'CapCut', 'url': 'https://www.capcut.com', 'domain': 'capcut.com', 'line': 'A video editor for cutting tall and square versions of the same clip.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('What is an example of native content?', 'A vertical video with a trending sound made for TikTok, or a short text post with line breaks written for LinkedIn, is native content for that app.'),
  ('Is native content the same as native advertising?', 'They are related. Native content is any content that fits its platform. Native advertising is paid content made to match the look of the place it appears, and it should be labeled as an ad.'),
  ('Why does native content perform better?', 'It feels familiar and avoids things like watermarks or broken links that make viewers scroll past.'),
  ('Is cross-posting bad?', 'It saves time, and it can work if you make small changes for each app. Posting the exact same file and caption everywhere is what tends to look out of place.'),
 ],
 'related': ['cross-posting', 'sponsored-content', 'paid-social', 'organic-social', 'brand-voice'],
},
{
 'slug': 'niche',
 'short': 'A niche is a focused topic or group of people that an account serves, like vegan baking or budget travel for students.',
 'body': '''<h2>What is a niche?</h2>
<p>A niche is the specific corner of the internet you choose to focus on. Where a broad account posts about "food," you might post only about quick vegan dinners for busy parents. A niche can be defined by a topic, an audience or both. The tighter it is, the easier it is for the right people to recognize that your account is for them.</p>
<p>Brands have niches too. A shoe company might focus on wide-fit running shoes. A software company might serve only dental offices. The same rule applies: the clearer you are about who you serve, the easier it is for them to find you.</p>
<h2>Why picking a niche helps</h2>
<ul>
<li><b>People know why to follow:</b> they can tell what they will get from you.</li>
<li><b>Platforms know who to show you to:</b> steady topics help apps match your posts to interested viewers.</li>
<li><b>Ideas come easier:</b> a clear focus makes it simpler to plan what to post.</li>
<li><b>Brands can find you:</b> companies looking for a creator in your area can spot you faster.</li>
</ul>
<p>Think about the last account you followed. You likely followed because you knew what you would get. A niche makes that promise for you.</p>
<h2>How to find your niche</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>List what you know.</b> Write down topics you know well or could talk about for a long time.</li>
<li><b>Name your audience.</b> Write down who you most want to help or entertain.</li>
<li><b>Find the overlap.</b> Look for where your topics and that audience meet.</li>
<li><b>Check demand.</b> Search each idea in social apps to see if people are posting and engaging.</li>
<li><b>Test it.</b> Pick one and run a series of posts on it.</li>
<li><b>Adjust.</b> Check your results, then narrow or widen based on what people respond to.</li>
</ol>
<h2>Testing a niche</h2>
<p>You won't know a niche works until you try it. A simple test is to post about two to four related ideas for a few weeks each, then compare how people respond. Use your average engagement rate or saves per post, so posts with lucky timing don't fool you.</p>
<figure data-chart="2"></figure>
<p>In the made-up test above, a gardening account tried four angles. Balcony herbs won by a lot, even though general gardening has a bigger audience. The account narrowed its focus to small-space growing and kept houseplants as a side topic.</p>
<p>Here are some made-up examples to spark ideas. A broad topic becomes a niche when you add a twist:</p>
<ul>
<li>Fitness becomes home workouts for new moms.</li>
<li>Money becomes budgeting for college students.</li>
<li>Gardening becomes growing herbs on a small balcony.</li>
<li>Marketing becomes social media tips for dentists.</li>
<li>Gaming becomes cozy farming games.</li>
<li>Travel becomes weekend trips by train from one city.</li>
</ul>
<h2>Niches on different networks</h2>
<p>Some apps reward narrow topics more than others. Video apps with strong recommendation feeds can put a niche video in front of the right strangers fast, even with few followers. Search-driven apps like YouTube and Pinterest reward niches that people actively look for, such as "how to fix a squeaky door." On LinkedIn, a niche is often a job or an industry. On X and Threads, niches form around shared interests and the people who talk about them.</p>
<h2>Growing, narrowing and widening</h2>
<p>Most accounts start narrow and widen slowly. You might begin with balcony herbs, then add small-space tomatoes, then indoor seed starting. Each step stays close to what your followers already like, so they come along. Jumping from herbs to car repair would lose them. Before you add a new topic, ask whether your current followers would care about it. If most would, it fits your niche.</p>
<p>Going too broad leaves people unsure what you're about. Going so narrow that hardly anyone searches for it can stall growth. A good test: can you think of at least 50 post ideas, and can you find other people already talking about it? If both are yes, you are probably in a good spot.</p>
<h2>Common mistakes</h2>
<ul>
<li>Picking a niche only because it seems to pay well, then losing interest fast.</li>
<li>Switching topics every week, so followers never know what to expect.</li>
<li>Treating your niche as a cage. Once you have a loyal audience, you can add related topics that fit the same people.</li>
<li>Copying another creator's niche exactly instead of bringing your own angle.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Finding your niche', 'steps': [
   ('List your topics', 'What you know well and could post about for a year.'),
   ('Name your audience', 'Who you want to help or entertain.'),
   ('Find the overlap', 'Where your topics meet their needs.'),
   ('Test with a run of posts', 'A few weeks on each idea.'),
   ('Narrow or widen', 'Follow what people respond to.')]},
  {'type': 'columns', 'title': 'Testing four niche ideas', 'sub': 'Average engagement rate by topic over three weeks each', 'example': True,
   'rows': [('Balcony herbs', 5.2, '5.2%'), ('General gardening', 1.8, '1.8%'), ('Houseplants', 3.1, '3.1%'), ('Garden tools', 2.0, '2.0%')], 'highlight': 'Balcony herbs', 'labels': 'all', 'unit': 'Engagement rate',
   'note': 'Made-up numbers for one account.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach and engagement for each post so you can tell which topics land.'},
  {'name': 'Google Trends', 'url': 'https://trends.google.com', 'domain': 'google.com', 'line': 'Shows how interest in a search topic rises and falls over time.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Work out the engagement rate for each test post the same way.'},
 ],
 'faqs': [
  ('What does niche mean on social media?', 'It means the focused topic or audience an account is built around, such as plant care for beginners or tech reviews for photographers.'),
  ('Do I need a niche to grow on social media?', "It isn't required, but a clear niche usually makes growth easier because people and platforms understand what you post."),
  ('Can I change my niche later?', 'Yes. Many accounts shift over time. Moving to a related topic is easier, since your current followers are more likely to stay.'),
  ('How do I know if my niche is too small?', 'Search for it in social apps and tools. If almost nobody posts, searches or engages with the topic, widen it a little.'),
  ('Can a business have a niche?', 'Yes. Serving one type of customer or one problem very well often makes a small business easier to find and remember.'),
 ],
 'related': ['target-audience', 'content-pillars', 'micro-influencer', 'brand-voice', 'audience'],
},
{
 'slug': 'ootd',
 'short': 'OOTD is short for outfit of the day, a tag people use when they share a photo or video of what they are wearing today.',
 'body': '''<h2>What is OOTD?</h2>
<p>OOTD stands for "outfit of the day." It is a caption or hashtag people add when they show off what they're wearing. An OOTD post can be a quick mirror selfie or a short video that walks through each piece. People often list where each item came from, so followers can find the same look.</p>
<p>You'll see it written as OOTD, #OOTD or sometimes in lowercase. It works on its own as a caption, too. A photo with just "OOTD" underneath says everything people need to know.</p>
<h2>Where you'll see it</h2>
<p>OOTD is most common on Instagram, TikTok and Pinterest, where fashion content is popular. You'll find it as #OOTD on posts and in video titles. Fashion creators use it daily, but regular people post OOTDs too, for a first day at a new job, a wedding or just a good hair day.</p>
<p>Related tags you'll spot include GRWM (get ready with me), WIWT (what I wore today) and OOTN (outfit of the night). Some people add a theme, like "work OOTD" or "rainy day OOTD."</p>
<p>Here is a made-up example post: "Rainy Monday OOTD: thrifted trench coat, white sneakers, silver hoops and my lucky green scarf. Jeans are from my sister's closet. #OOTD"</p>
<p>And a made-up video caption: "OOTD for a job interview, all pieces linked below."</p>
<p>The tag looks a little different on each app. On Instagram, OOTD is often a single photo or a carousel, with a close-up of shoes or jewelry on the second slide. On TikTok, it is usually a short video with a quick outfit change or a slow turn set to music. On Pinterest, OOTD photos are saved as outfit ideas, so a clean, full-length photo with a helpful title does well. On YouTube, people make longer videos with a week of outfits in one go.</p>
<p>If you post the same look on more than one app, change the format to fit. A carousel for Instagram, a short clip for TikTok and a tall photo for Pinterest can all come from the same ten minutes of filming.</p>
<h2>OOTD vs GRWM</h2>
<p>These two get mixed up, but they show different parts of the day. OOTD shows the finished outfit. GRWM shows the process of getting dressed, often with hair, makeup and chatting along the way.</p>
<figure data-chart="1"></figure>
<h2>How brands use OOTD</h2>
<ul>
<li>Clothing shops post daily OOTD looks built from items they sell.</li>
<li>Brands reshare customers' OOTD posts, with permission, as social proof.</li>
<li>Creators tag the brands they wear, which can lead to affiliate or sponsored deals.</li>
<li>Stores invite shoppers to post with a branded OOTD hashtag for a chance to be featured.</li>
<li>Staff at a shop post their own OOTDs to show how real people wear the clothes.</li>
</ul>
<p>For example, a made-up vintage store might post an OOTD every weekday using one new arrival. Each post tags the item and says the size. Followers start checking each morning to see what came in.</p>
<h2>How to film an OOTD video</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Find good light.</b> A big window during the day or a bright shady spot outside works best.</li>
<li><b>Set up the phone.</b> Use a stand or lean it on a shelf at chest height so the full outfit fits.</li>
<li><b>Show the whole look first.</b> A slow turn or a short walk toward the camera.</li>
<li><b>Add close-ups.</b> Shoes, bags, jewelry and any detail people will ask about.</li>
<li><b>List the pieces.</b> Put where each item is from in the caption or on screen.</li>
</ol>
<h2>Tips for OOTD posts</h2>
<ul>
<li>Keep the background simple so the clothes stand out.</li>
<li>Tag the brands you wear, so people can find the pieces.</li>
<li>Mark any paid or gifted items clearly as an ad or gift.</li>
<li>Post at a steady pace so followers know when to look for your looks.</li>
<li>Mix in budget, thrifted and borrowed pieces. People like outfits they can copy.</li>
<li>Answer questions about sizes and fit in the comments.</li>
</ul>
<h2>Common mistakes</h2>
<p>A dark or cluttered photo makes it hard to see the outfit. Cropping off the shoes leaves people asking about them. Forgetting to say where pieces are from means a flood of "where is that from?" comments. And hiding a paid partnership can break the rules in many countries, so always label it.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'OOTD vs GRWM', 'cols': ('OOTD', 'GRWM'), 'rows': [
   ('Stands for', 'Outfit of the day', 'Get ready with me'),
   ('Shows', 'The finished look', 'Getting ready, step by step'),
   ('Usual format', 'Photo or short clip', 'Longer video with talking'),
   ('Lists the pieces', True, 'Sometimes'),
   ('Includes hair and makeup', False, True)]},
  {'type': 'steps', 'title': 'Filming an OOTD video', 'steps': [
   ('Find good light', 'A window or a bright shady spot.'),
   ('Set the phone at chest height', 'So the full outfit fits in the frame.'),
   ('Show the whole look', 'A slow turn or a short walk.'),
   ('Add close-ups', 'Shoes, bags and jewelry.'),
   ('List the pieces', 'Where each item is from, in the caption.')]},
 ],
 'faqs': [
  ('What does OOTD mean?', "OOTD means outfit of the day. People use it to label a photo or video of what they're wearing."),
  ('How do you use OOTD in a caption?', 'Add OOTD or #OOTD to a post that shows your outfit, often with a short line about the look and where each piece is from.'),
  ('What is the difference between OOTD and GRWM?', 'OOTD shows the finished outfit. GRWM, or get ready with me, shows the process of getting dressed and doing hair or makeup, often while chatting.'),
  ('What does OOTN mean?', 'OOTN means outfit of the night. People use it for a look they wore to a party, a dinner or a night out.'),
 ],
 'related': ['grwm', 'hashtag', 'user-generated-content', 'influencer', 'pov'],
},
]

TERMS += [
{
 'slug': 'open-graph',
 'short': "Open Graph is a set of tags in a web page's code that tells social apps which title, description and image to show when someone shares the link.",
 'body': '''<h2>What is Open Graph?</h2>
<p>Open Graph is a small set of meta tags that sit in the head section of a web page. When you paste a link into a post or a chat, the app visits the page, reads these tags and builds a preview card. That card usually shows an image, a title, a short description and the site name. Facebook first introduced the idea, and today most social apps and messaging tools read the same tags.</p>
<p>Without Open Graph tags, an app has to guess. It may grab the wrong image, pull a random line of text or show a bare link with no picture at all.</p>
<h2>How Open Graph works</h2>
<p>Each tag is one line of HTML with a property and a value. The most common ones are:</p>
<ul>
<li><b>og:title</b>: the headline shown on the card.</li>
<li><b>og:description</b>: one or two lines under the headline.</li>
<li><b>og:image</b>: the address of the picture the card shows.</li>
<li><b>og:url</b>: the main address of the page.</li>
<li><b>og:type</b>: the kind of page, such as an article or a website.</li>
<li><b>og:site_name</b>: the name of your site, shown small on some cards.</li>
</ul>
<p>Here is what the code looks like for a made-up blog post: <b>&lt;meta property="og:title" content="How to repot a fern"&gt;</b>. You add one line like this for each tag.</p>
<p>When someone shares the link, the app fetches the page once, reads the tags and saves the card. That saved card is what everyone sees, which is why changes don't always show up right away.</p>
<figure data-chart="1"></figure>
<h2>Why Open Graph matters for social media</h2>
<p>A link with a clear image and a good title stands out in a busy feed. A broken preview looks careless and gives people a reason to scroll past. If you share blog posts, product pages or landing pages, these tags decide how your links look before anyone clicks.</p>
<p>It also matters when other people share your links. You can't control their caption, but your Open Graph tags still decide the image and headline they show. Every share becomes a small ad you designed ahead of time.</p>
<h2>How to set up Open Graph tags</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Add the tags.</b> Put them in the head of each page, or switch them on in your website builder or SEO plugin.</li>
<li><b>Write for sharing.</b> Your sharing title and description can differ from your search title. Make them clear and inviting.</li>
<li><b>Pick a strong image.</b> Use a sharp, wide picture with very little small text on it.</li>
<li><b>Give each page its own tags.</b> Each important page should have its own title and image.</li>
<li><b>Test the link.</b> Use the preview or debug tool of the platform you post to.</li>
<li><b>Refresh after changes.</b> If you change the image later, ask the platform to fetch the page again.</li>
</ol>
<h2>Open Graph on different networks</h2>
<p>Most apps read Open Graph, but they don't all show the card the same way. Facebook and LinkedIn usually show a wide image with the title below. Messaging apps often show a smaller card. Some apps crop the image to a square or show only the title on small screens. X reads its own card tags first and falls back to Open Graph when they are missing. On apps where links in captions don't click, like Instagram feed posts, the card doesn't show at all.</p>
<p>Because of this, keep the key part of your image in the center, where it survives cropping. And keep titles short enough to read in a small card.</p>
<h2>Testing and fixing previews</h2>
<p>Paste your link into the platform's debug or inspector tool before you post. It shows the card the app will build and lists any missing tags. If you see an old image, the tool usually has a button to fetch the page again.</p>
<p>Here is a made-up example. A shop changes a product photo, but shared links still show the old one. The owner runs the link through the debug tool, presses the button to fetch again, and the new photo appears in fresh shares.</p>
<h2>Common mistakes</h2>
<ul>
<li>A missing or tiny image, which leaves the card blank or badly cropped.</li>
<li>Giving every page the same title and image, so every shared link looks alike.</li>
<li>Putting small text on the image that nobody can read in a feed.</li>
<li>Forgetting that apps save old previews, then thinking your changes didn't work.</li>
<li>Pointing og:image at a picture that needs a login to load.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'What happens when you share a link', 'steps': [
   ('You paste the link', 'Into a post, a comment or a chat.'),
   ('The app visits the page', 'It reads the Open Graph tags in the head.'),
   ('It builds a card', 'Image, title, description and site name.'),
   ('It saves the card', 'Everyone sees the saved card until the app fetches again.')]},
  {'type': 'steps', 'title': 'Setting up Open Graph tags', 'steps': [
   ('Add the tags', 'In the page head or through your site builder.'),
   ('Write a sharing title', 'Short, clear and inviting.'),
   ('Choose a wide image', 'Sharp, centered and with little small text.'),
   ('Test the link', 'Use each platform\'s preview tool.'),
   ('Refresh after changes', 'Ask the app to fetch the page again.')]},
 ],
 'tools': [
  {'name': 'Sharing Debugger', 'url': 'https://developers.facebook.com/tools/debug/', 'domain': 'facebook.com', 'line': "Meta's tool for seeing how a link will look when shared and fetching it again."},
  {'name': 'LinkedIn Post Inspector', 'url': 'https://www.linkedin.com/post-inspector/', 'domain': 'linkedin.com', 'line': "LinkedIn's tool for checking and refreshing a link preview."},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for making the share image for each page.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag the links you share so you can see which posts bring visitors.'},
 ],
 'faqs': [
  ('What does og:image mean?', 'og:image is the Open Graph tag that points to the picture a social app should show in a link preview. If it is missing, the app may pick a random image or show none.'),
  ('Why is my link preview showing an old image?', "Social apps save previews, so an old image can stick around after you change it. Update the og:image tag, then use the platform's sharing debug tool to fetch the page again."),
  ('Does WordPress add Open Graph tags?', 'Many WordPress themes and SEO plugins add Open Graph tags for you. View your page source and search for og: to see whether they are there.'),
  ('Does Open Graph help SEO?', 'Open Graph tags have no direct effect on search rankings. Better link previews can still bring you more clicks from social apps.'),
  ('Do I need Open Graph if I use a link in bio page?', 'It still helps, since people may share that page in chats and posts. A clear image and title make those shares look better.'),
 ],
 'related': ['thumbnail', 'embed', 'url-shortener', 'utm-parameters', 'link-in-bio'],
},
{
 'slug': 'organic-reach',
 'short': 'Organic reach is the number of unique people who see your content without you paying to promote it.',
 'body': '''<h2>What is organic reach?</h2>
<p>Organic reach counts the different people who saw a post through free means. They might follow you, find the post on an explore or For You page, see it because a friend shared it, or land on it through search. Each person counts once, however many times they saw it.</p>
<p>Any view that came from an ad or a boosted post counts as paid reach instead. Most analytics tools split the two so you can see each one on its own.</p>
<h2>Organic reach vs paid reach</h2>
<p>Paid reach grows when you spend money and stops when the budget runs out. Organic reach grows when people find your content worth showing to others and when the app's algorithm decides to recommend it. Organic reach takes longer to build, but it keeps working after a post goes live, and it tells you what your audience truly cares about.</p>
<figure data-chart="1"></figure>
<h2>How to calculate organic reach rate</h2>
<p>Raw reach is hard to compare across accounts of different sizes. A rate fixes that. Divide organic reach by your followers and multiply by 100.</p>
<figure data-chart="2"></figure>
<p>A rate above 100% is possible. It means the post reached more people than you have followers, usually because it was shared or recommended to strangers. Track your rate for each format, since a video and a photo often behave very differently.</p>
<h2>How organic reach builds and changes</h2>
<p>Most posts get the bulk of their reach in the first day or two. Many apps show a new post to a small group first, then widen the audience if people react. So reach climbs fast at first, then levels off. The made-up chart below shows how total reach might grow over the first two days.</p>
<figure data-chart="3"></figure>
<p>Some posts break the pattern. A video that gets picked up by a recommendation feed can keep growing for days or weeks. Search-driven content on YouTube or Pinterest can gain reach for months.</p>
<p>Feeds hold far more posts than anyone can see, so each app ranks them. A post that gets early likes, comments, saves and shares tends to be shown to more people. Reach can drop when you post less, when your topic drifts away from what your followers expect or when the app changes how it ranks content. A sudden drop on one post is normal. A steady drop over weeks is worth a closer look.</p>
<p>Each app hands out reach in its own way. Apps with strong recommendation feeds, like TikTok and Instagram Reels, can show a post to many people who don't follow you. Facebook Pages often reach a smaller share of their followers, so groups and shares matter more. LinkedIn tends to reward posts that start real conversations in the comments. YouTube and Pinterest work more like search engines, so good titles and descriptions help people find you long after you post. On Mastodon and other time-ordered feeds, reach depends heavily on when you post and who boosts you.</p>
<h2>How to measure organic reach</h2>
<p>Open the insights or analytics area of each app and look for reach on posts that were not promoted. If you ran ads, make sure you are looking at the organic number only, since some views combine both. Check each post a few days after it goes live, once most of its reach has come in.</p>
<p>Keep a simple log with one row per post: the date, the format, the topic and the organic reach. After a month, sort by reach. You will start to see which formats and topics travel, and which days and times work best for you. Compare averages over weeks instead of judging single posts.</p>
<h2>How to grow organic reach</h2>
<ul>
<li>Open with a strong hook so people stop scrolling.</li>
<li>Use the formats each app is pushing, such as short video or carousels.</li>
<li>Reply to comments quickly, since active threads often travel further.</li>
<li>Post when your followers are online.</li>
<li>Make things people want to save or send to a friend.</li>
<li>Keep a steady rhythm so the app and your audience know what to expect.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li>Mixing up reach and impressions. Reach counts people. Impressions count views.</li>
<li>Judging an account on one post instead of a few weeks of averages.</li>
<li>Comparing your reach with a much bigger account without using a rate.</li>
<li>Panicking about one bad week and changing everything at once.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Organic reach vs paid reach', 'cols': ('Organic reach', 'Paid reach'), 'rows': [
   ('Costs money', False, True),
   ('Stops when spending stops', False, True),
   ('You choose exactly who sees it', False, True),
   ('Shows what people truly like', True, False),
   ('Speed', 'Builds over time', 'Fast')]},
  {'type': 'formula', 'title': 'Organic reach rate', 'formula': 'Organic reach rate = organic reach ÷ followers × 100',
   'note': 'Made-up numbers to show the math.', 'result': '35%',
   'example': [('Organic reach', '2,800'), ('Followers', '8,000')]},
  {'type': 'line', 'title': 'Total reach in the first two days', 'sub': 'Unique people reached since posting', 'example': True,
   'points': [('1h', 300), ('3h', 900), ('6h', 1500), ('12h', 2100), ('24h', 2600), ('48h', 2850)], 'unit': 'People reached',
   'note': 'Made-up numbers for one post.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, engagement and followers for every channel side by side, with your best times to post.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Our free guide to picking posting times for each network.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Work out engagement by reach to see how people who saw a post reacted.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What is a good organic reach rate?', 'It varies a lot by app, account size and topic. The most useful benchmark is your own average, so aim to beat your last few months.'),
  ('Why is my organic reach going down?', 'Common causes are posting less often, content your audience engages with less and changes to how the app ranks posts. Check which recent posts did best and make more like them.'),
  ('Is organic reach the same as impressions?', 'No. Reach counts unique people, while impressions count every time the post was shown, so one person can create several impressions.'),
  ('Can organic reach be higher than my follower count?', 'Yes. When a post is shared or recommended to people who don\'t follow you, reach can go past your follower count.'),
 ],
 'related': ['reach', 'impressions', 'algorithm', 'paid-social', 'organic-social'],
},
{
 'slug': 'organic-social',
 'short': 'Organic social is everything a brand or creator does on social media for free, such as posting, replying to comments and joining conversations.',
 'body': '''<h2>What is organic social?</h2>
<p>Organic social covers all the unpaid work you do on social apps. It includes the posts, Stories and videos you publish, the comments you answer, the messages you reply to and the groups or threads you take part in. Nothing in it is boosted with ad money.</p>
<p>The goal is to build an audience that knows you, trusts you and comes back on its own. Over time, that audience becomes a steady source of website visits, leads and word of mouth.</p>
<h2>Organic social vs paid social</h2>
<p>Paid social uses ads to put content in front of chosen groups of people, and it can reach strangers fast. Organic social mostly reaches your followers, their friends and people who find you through search or recommendations. The two work well together. Many teams test ideas organically first, then put ad money behind the posts that already did well.</p>
<figure data-chart="1"></figure>
<p>Organic social is worth the effort for a few reasons:</p>
<ul>
<li>It gives your brand a human voice people can talk to.</li>
<li>It builds trust before someone is ready to buy.</li>
<li>It costs time more than money, so small teams can start today.</li>
<li>Comments and messages show you what customers think.</li>
<li>Your best organic posts tell you which ads are worth running.</li>
</ul>
<h2>How to build an organic social plan</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Pick your apps.</b> Choose where your audience already spends time. Two done well beat many done badly.</li>
<li><b>Choose content pillars.</b> These are the few topics you will post about again and again.</li>
<li><b>Set a rhythm.</b> Pick a posting pace you can keep for months, then plan it on a content calendar.</li>
<li><b>Batch your posts.</b> Write and schedule ahead so busy weeks don't leave gaps.</li>
<li><b>Make time to reply.</b> Block time each day to answer comments and messages.</li>
<li><b>Review monthly.</b> Check your analytics and do more of what worked.</li>
</ol>
<p>Followers stay for posts that help or entertain them. If every post is an offer, people tune out. A healthy mix leans on useful and human posts, with offers mixed in. The made-up split below is one example for a small brand.</p>
<figure data-chart="3"></figure>
<p>Here is how that might look for a made-up coffee roaster over a month. Helpful posts teach brewing tips. Behind-the-scenes posts show the roasting room. Community posts share customer photos and answer questions. Offers announce new beans and a holiday gift box. Each type gives followers a different reason to stay.</p>
<h2>Organic social on different networks</h2>
<p>What works for free varies by app. Short video apps can show a new account's posts to many strangers, so they are often the fastest place to grow from zero. Instagram rewards a steady mix of Reels, carousels and Stories. LinkedIn rewards people who post their own ideas and reply to others, so staff accounts often reach more than the Company Page. Facebook Groups can build a close community around a topic. On X, Threads, Bluesky and Mastodon, growth comes from joining conversations as much as posting. Pick one or two to master before adding more.</p>
<h2>Organic social for small teams</h2>
<p>You don't need a big team to do organic social well. Many small businesses run it with one person and a few hours a week. The trick is a routine. Spend one block of time each week writing and scheduling posts. Spend a few minutes each day replying to comments and messages. Once a month, look at what worked and plan the next month around it.</p>
<p>For example, a made-up hair salon owner sets aside Monday mornings. She photographs a few recent styles, writes captions and schedules the week. Each evening she spends ten minutes answering comments and booking questions. That routine keeps her accounts active without taking over her week.</p>
<h2>How to measure organic social</h2>
<p>Track a few numbers each month: follower growth, reach, engagement rate and clicks to your website. Add the business numbers too, such as sign-ups or sales that came from social links. Use UTM tags on your links so your website analytics can show which posts sent visitors. Look at trends over a few months, since organic work builds slowly.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting only about your own products, which gives people little reason to follow.</li>
<li>Posting in bursts and then disappearing for weeks.</li>
<li>Ignoring comments and messages.</li>
<li>Spreading across every app at once and doing none of them well.</li>
<li>Quitting after a month, before organic work has had time to build.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Organic social vs paid social', 'cols': ('Organic social', 'Paid social'), 'rows': [
   ('Costs ad money', False, True),
   ('Reaches strangers fast', False, True),
   ('Builds trust over time', True, 'Sometimes'),
   ('Keeps working after you stop spending', True, False),
   ('Main cost', 'Time', 'Budget')]},
  {'type': 'steps', 'title': 'Building an organic social plan', 'steps': [
   ('Pick your apps', 'Where your audience already spends time.'),
   ('Choose content pillars', 'A few topics you post about again and again.'),
   ('Set a rhythm', 'A pace you can keep, planned on a calendar.'),
   ('Batch and schedule', 'Write ahead so busy weeks stay covered.'),
   ('Reply and review', 'Answer daily, check results monthly.')]},
  {'type': 'stack', 'title': 'A content mix for a small brand', 'sub': 'Share of posts in one month', 'example': True,
   'parts': [('Helpful tips', 40), ('Behind the scenes', 25), ('Community', 20), ('Offers', 15)],
   'note': 'Made-up split. Adjust it to your audience.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan your posts on a calendar or a queue, and bulk upload a month at a time.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, engagement and followers for every channel side by side.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Our free guide to picking posting times for each network.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for making post graphics and short videos.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('Is organic social media free?', 'Posting is free on every major app. The real cost is the time it takes to plan, create and reply, plus any tools you choose to use.'),
  ('How long does organic social take to work?', 'It usually takes months of steady posting before you see clear growth. Results build up over time as your audience grows.'),
  ('Should I do organic or paid social first?', 'Most brands start with organic social to learn what their audience likes. Paid social works better once you know which posts and messages land.'),
  ('How often should I post for organic growth?', 'Pick a pace you can keep for months. Steady posting usually beats a burst of daily posts followed by silence.'),
 ],
 'related': ['paid-social', 'organic-reach', 'content-calendar', 'content-pillars', 'community-management'],
},
{
 'slug': 'owned-media',
 'short': 'Owned media are the channels a brand controls itself, such as its website, blog, email list and app.',
 'body': '''<h2>What is owned media?</h2>
<p>Owned media are the places where you decide what goes out, when it goes out and who sees it. Your website, your blog, your email newsletter, your mobile app and your podcast feed are all owned media. You do not need permission from another company to publish there, and nobody can change the rules on you overnight.</p>
<p>Owning a channel also means you own the data. You can see who signed up, who visited and what they did, and you can keep that list even if you change tools.</p>
<h2>Owned, earned and paid media</h2>
<p>Marketers often sort channels into groups:</p>
<ul>
<li><b>Owned media</b>: channels you run, like your site and email list.</li>
<li><b>Earned media</b>: attention you get for free from others, such as press stories, reviews and shares.</li>
<li><b>Paid media</b>: space you buy, such as ads and sponsored posts.</li>
<li><b>Shared media</b>: social posts, which sit between the others.</li>
</ul>
<p>Most brands use all of them. Paid and earned media bring new people in. Owned media is where you keep them.</p>
<h2>Are social media profiles owned media?</h2>
<p>Partly. You control what you post on your profiles, so many people count them as owned. But the platform owns the account rules, the feed and your list of followers. If an app changes its algorithm, limits your account or shuts down a feature, you can lose reach you spent years building. That is why social profiles are sometimes called rented space.</p>
<figure data-chart="1"></figure>
<p>Owned channels protect you from sudden changes on any one app. When someone joins your email list, you can reach them directly, whatever happens to a feed. Content on your own site can also rank in search for years and keep bringing visitors.</p>
<p>Here is a made-up example. A pottery studio has a big following on one app. The app changes how it ranks posts, and the studio's reach drops by half. Its class sign-ups barely change, though, because most bookings come from its email list. It had spent two years inviting followers to join.</p>
<h2>How to use social media to grow owned media</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Use your bio link.</b> Put a clear link in your bio that leads to your site or a sign-up page.</li>
<li><b>Offer something useful.</b> A guide, a checklist or a discount in exchange for an email address.</li>
<li><b>Share and send back.</b> Post a short version of a blog post, then link to the full article.</li>
<li><b>Tag your links.</b> Add UTM parameters so you can see which posts bring visitors.</li>
<li><b>Repurpose your best posts.</b> Turn top social posts into articles or newsletter issues.</li>
</ol>
<p>Each step moves people from a feed you rent to a channel you own. Most people who see a post won't click, and most who click won't sign up, so the funnel narrows fast. That is normal. A steady trickle adds up over a year.</p>
<h2>Where your visitors come from</h2>
<p>Once your owned channels grow, check your website analytics to see where visits start. A healthy mix doesn't lean too hard on any one source. The made-up split below is for a small online shop.</p>
<figure data-chart="3"></figure>
<p>If social sends most of your traffic, work on your email list and search content so a change on one app can't sink you. If email is strong but social is weak, social may be a good place to find new subscribers.</p>
<h2>Owned media on different networks</h2>
<p>Every social app lets you point people to owned media, but in different ways. Instagram and TikTok mostly rely on a link in your bio. Facebook, LinkedIn and X let you put links right in posts. YouTube lets you add links in video descriptions. Pinterest Pins can link straight to a page on your site. LinkedIn newsletters and Facebook Groups feel owned, but they still live on someone else's app.</p>
<h2>Common mistakes</h2>
<ul>
<li>Building only on social apps with no website or email list.</li>
<li>Sending followers to a home page instead of a page made for them.</li>
<li>Asking for an email without offering anything in return.</li>
<li>Collecting emails and then never sending anything.</li>
</ul>
<p>Think of social apps as the place people meet you and owned media as the place they get to know you.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Owned media vs a social profile', 'cols': ('Website and email list', 'Social profile'), 'rows': [
   ('You set the rules', True, False),
   ('You keep your audience list', True, False),
   ('Reach can change overnight', False, True),
   ('Easy for strangers to find you', 'Through search', 'Through feeds'),
   ('Free to start', 'Mostly', True)]},
  {'type': 'funnel', 'title': 'From followers to email subscribers', 'sub': 'One month of bio link traffic', 'example': True, 'unit': 'People',
   'stages': [('Followers', 10000), ('Clicked the bio link', 400), ('Visited the sign-up page', 300), ('Joined the email list', 90)],
   'note': 'Made-up numbers to show how the funnel narrows.'},
  {'type': 'stack', 'title': "Where one shop's website visits come from", 'example': True,
   'parts': [('Email', 35), ('Social', 30), ('Search', 25), ('Ads', 10)],
   'note': 'Made-up split for one small shop.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'One page behind your bio link that sends followers to your site, shop or sign-up form.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag your social links so you can see which posts bring visitors.'},
  {'name': 'Mailchimp', 'url': 'https://mailchimp.com', 'domain': 'mailchimp.com', 'line': 'An email marketing tool for building and writing to your list.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics for seeing where visitors come from and what they do.'},
 ],
 'faqs': [
  ('What are examples of owned media?', 'Your website, blog, email newsletter, mobile app, podcast and printed brochures are all owned media. Many people also include your social media profiles.'),
  ('What is the difference between owned and earned media?', 'Owned media are channels you control and publish on yourself. Earned media is attention other people give you for free, such as reviews, press coverage or shares.'),
  ('Why is an email list important if I have followers?', 'A platform can change its rules or reach at any time, but your email list stays with you. It lets you contact your audience directly.'),
  ('What is shared media?', 'Shared media usually means social posts. You make them, but they live on someone else\'s app and spread when people share them.'),
 ],
 'related': ['earned-media', 'paid-social', 'link-in-bio', 'lead-generation', 'utm-parameters'],
},
{
 'slug': 'paid-social',
 'short': 'Paid social is advertising on social media apps, where you pay to show posts or ads to people you choose by interest, location, age or behavior.',
 'body': '''<h2>What is paid social?</h2>
<p>Paid social means any content you pay a social app to show. It includes ads in the feed, sponsored Stories, promoted videos, boosted posts and sponsored messages. You set a budget, choose who should see the ad and pick a goal, such as website visits, app installs, leads or sales.</p>
<p>The big draw is control. With organic posts, you hope the right people see them. With paid social, you choose the audience and pay to reach them.</p>
<h2>How paid social works</h2>
<p>Each app has an ads manager where you build a campaign. The usual steps are:</p>
<figure data-chart="1"></figure>
<ol>
<li><b>Pick a goal.</b> The app uses it to decide who to show the ad to.</li>
<li><b>Choose an audience.</b> Target by location, age, interests or job title, or upload a customer list.</li>
<li><b>Set a budget and schedule.</b> Choose a daily or total amount and how long the ads run.</li>
<li><b>Create the ad.</b> Add images or video, text, a headline and a call to action.</li>
<li><b>Launch and watch the results.</b> Check costs, clicks and conversions, then adjust.</li>
</ol>
<p>Ads are sold through auctions. The price you pay depends on how many other advertisers want the same audience and how well people respond to your ad. An ad people like often costs less to show than one they skip.</p>
<h2>Paid social vs organic social</h2>
<p>Organic posts reach mostly your followers and people the algorithm picks. Paid posts can reach strangers right away and can be aimed very precisely. Organic social builds trust slowly, while paid social gives fast, measurable results that stop when spending stops. Most brands use both, often by putting money behind organic posts that already did well.</p>
<h2>Following an ad from view to sale</h2>
<p>Think of each campaign as a funnel. Many people see the ad, some click, fewer sign up or buy. Each step has a rate you can work on. The made-up funnel below shows one small campaign.</p>
<figure data-chart="2"></figure>
<p>If many people see the ad but few click, the ad itself needs work: try a new image or a stronger first line. If people click but don't sign up, look at the page they land on. It should match the ad and make the next step easy.</p>
<p>The numbers most teams watch are:</p>
<ul>
<li><b>CPM</b>: cost per thousand impressions.</li>
<li><b>CPC</b>: cost per click.</li>
<li><b>CTR</b>: clicks ÷ impressions × 100.</li>
<li><b>Conversion rate</b>: conversions ÷ clicks × 100.</li>
<li><b>ROAS</b>: revenue from ads ÷ ad spend.</li>
</ul>
<p>ROAS, or return on ad spend, is the number many teams care about most. It tells you how much money came back for each dollar you spent.</p>
<figure data-chart="3"></figure>
<h2>Paid social on different networks</h2>
<p>Each app suits different goals, in general terms. Facebook and Instagram offer wide reach and many targeting options, so they suit lots of consumer brands. TikTok ads work best when they look like native TikToks, with real people and fast hooks. LinkedIn lets you target by job title, company and industry, which suits B2B brands. Pinterest reaches people who are planning purchases. YouTube suits video ads that teach or show a product in use. Ad tools and formats change often, so check each ads manager for what's current.</p>
<h2>How to set a budget and test your ads</h2>
<p>Start with an amount you are comfortable losing while you learn. Treat your first campaigns as tests. Their job is to show you what works. Spread the money across two or more ad versions so you can compare. Once one version clearly does better, move more of the budget to it and test a new challenger.</p>
<p>Write down what you expect before you launch. For example, you might decide that a sign-up is worth a certain amount to you. If an ad brings sign-ups for less than that, keep it running. If it costs more, change it or stop it.</p>
<p>Change one thing at a time. Run two versions of an ad with the same audience and budget, where only the image or the headline differs. Give each test enough time and enough results before you pick a winner. Then test the next thing. Small, steady tests teach you more than one big launch.</p>
<h2>Common mistakes</h2>
<ul>
<li>Targeting too many people, so the budget spreads thin.</li>
<li>Using an ad that looks nothing like a normal post, so people skip it.</li>
<li>Sending clicks to a home page that has nothing to do with the ad.</li>
<li>Stopping a test after a day, before there is real data.</li>
<li>Skipping tracking, so you can't tell which ads led to sales.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Building a paid social campaign', 'steps': [
   ('Pick a goal', 'Visits, leads, installs or sales.'),
   ('Choose an audience', 'Location, interests, job title or a customer list.'),
   ('Set a budget', 'A daily or total amount and an end date.'),
   ('Create the ad', 'Image or video, text and a clear call to action.'),
   ('Launch and adjust', 'Watch costs and results, then change one thing at a time.')]},
  {'type': 'funnel', 'title': 'One campaign from view to sign-up', 'example': True, 'unit': 'People',
   'stages': [('Saw the ad', 50000), ('Clicked', 600), ('Landed on the page', 520), ('Signed up', 48)],
   'note': 'Made-up numbers for one small campaign.'},
  {'type': 'formula', 'title': 'Return on ad spend (ROAS)', 'formula': 'ROAS = revenue from ads ÷ ad spend',
   'note': 'Made-up numbers to show the math.', 'result': '3.2',
   'example': [('Revenue from ads', '$1,600'), ('Ad spend', '$500')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Find the organic posts that did best so you know which ones to put ad money behind.'},
  {'name': 'Meta Ads Manager', 'url': 'https://www.facebook.com/business/tools/ads-manager', 'domain': 'facebook.com', 'line': "Meta's tool for running ads on Facebook and Instagram."},
  {'name': 'LinkedIn Campaign Manager', 'url': 'https://business.linkedin.com/advertise', 'domain': 'linkedin.com', 'line': "LinkedIn's tool for running ads to professionals."},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Tag your ad links so your website analytics can show which ads brought visitors.'},
 ],
 'faqs': [
  ('How much does paid social cost?', 'It depends on your audience, the app, your goal and how much competition there is. You set the budget yourself, and most apps let you start small.'),
  ('Is a boosted post the same as paid social?', 'A boosted post is one simple type of paid social. Full ad campaigns give you more choices for goals, audiences and ad formats.'),
  ('Which platform is best for paid social?', 'The best one is where your customers spend time. LinkedIn suits many B2B brands, while visual products often do well on Instagram, TikTok or Pinterest.'),
  ('What is ROAS?', 'ROAS stands for return on ad spend. It is the revenue your ads brought in divided by what you spent on them.'),
  ('How long should I run a paid social test?', 'Long enough to collect a fair number of results for each version, often at least several days. Stopping after one day can point you to the wrong winner.'),
 ],
 'related': ['organic-social', 'boosted-post', 'retargeting', 'lookalike-audience', 'cost-per-click'],
},
]
