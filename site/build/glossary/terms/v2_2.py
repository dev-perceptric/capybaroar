# Upgraded glossary terms, batch 2.
TERMS = []

TERMS += [
{
 'slug': 'bulk-scheduling',
 'short': 'Bulk scheduling is loading many social media posts into a scheduling tool at once, often from a spreadsheet, so they publish over days or weeks.',
 'body': '''<h2>What is bulk scheduling?</h2>
<p>Bulk scheduling means adding a large set of posts to your scheduler in one go instead of building them one at a time. The most common way is a spreadsheet or CSV file where each row is one post. Columns hold the text, the date, the time, the account and sometimes a link or a media file. The tool reads the file and places every post on your calendar.</p>
<p>Some tools also let you drop a folder of images or videos in at once and write each caption on a single screen. Others let you send a batch of posts into a queue that fills preset time slots. All of these count as bulk scheduling, because the goal is the same: plan many posts in one sitting.</p>
<h2>How bulk scheduling works</h2>
<p>Behind the scenes, the scheduler turns each row into a draft post. It checks the row against the rules of the network you picked, such as text length and file type. Rows that pass become scheduled posts. Rows that fail get flagged so you can fix them before anything goes live.</p>
<figure data-chart="1"></figure>
<p>Here is a made-up example. A bakery plans a month of posts in a shared sheet: 20 rows for Instagram, 20 for Facebook and 12 for Pinterest. One upload puts all 52 posts on the calendar. Two rows come back with errors, a missing time and a Pinterest description over the 500 character limit. The owner fixes both in a few minutes and uploads them again.</p>
<h2>Why bulk scheduling matters</h2>
<ul>
<li><b>Big time savings.</b> Planning a month of posts in one sitting is faster than logging in every day to write one.</li>
<li><b>Easy team work.</b> Writers can draft in a shared sheet that the scheduler then imports.</li>
<li><b>A natural fit for batching.</b> After you create a month of content, you load it all at once.</li>
<li><b>Simple repeat content.</b> Daily tips, quotes, event countdowns and product features are easy to lay out in a table.</li>
</ul>
<h2>How to bulk schedule posts step by step</h2>
<ol>
<li><b>Download the tool's template.</b> Each tool expects its own columns and date format, so start from its file.</li>
<li><b>Fill in one row per post.</b> Add the text, account, date, time and any link or media.</li>
<li><b>Check each network's limits.</b> Threads allows 500 characters, Bluesky 300 and a LinkedIn post 3,000. A caption that fits one may break another.</li>
<li><b>Set the time zone.</b> Confirm that the times in your sheet match the time zone your tool uses.</li>
<li><b>Upload and fix errors.</b> Read every flagged row and correct it before you move on.</li>
<li><b>Review the calendar.</b> Scroll through the month to spot gaps, typos and posts that land too close together.</li>
</ol>
<h2>Bulk scheduling vs a queue</h2>
<p>With bulk scheduling, each post usually gets its own date and time. With a queue, you set recurring slots, such as weekdays at 9 a.m., and posts fill the next open slot in order. You decide the order once, and the queue picks the exact times.</p>
<figure data-chart="2"></figure>
<p>Many teams use both. They bulk upload a planned campaign with fixed dates, such as a product launch, and keep evergreen posts in a queue to fill the slower days between.</p>
<h2>How to tell if it is working</h2>
<p>Bulk scheduling is about saving time, so start by noting how long planning takes you each month before and after. Then check that your results hold up. Compare reach and engagement for bulk scheduled posts with posts you made by hand. If the bulk posts lag behind, the cause is often a copied caption that doesn't suit each network, or a time slot when your audience is offline. Fix those two things first before you blame the method.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Time zone mix-ups.</b> A sheet written in one time zone and imported in another can shift every post by hours.</li>
<li><b>One caption for every network.</b> Text that suits Instagram may be far too long for X at 280 characters.</li>
<li><b>Scheduling too far ahead.</b> A post written in spring can feel stale by summer. Look over upcoming posts each week.</li>
<li><b>Forgetting the news.</b> Pause the calendar when something big happens so a cheerful promo doesn't land at the wrong moment.</li>
<li><b>Broken media links.</b> If your sheet points to files by web address, open every link before you upload.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'How a bulk upload works', 'steps': [
   ('Write the rows', 'One post per row with text, account, date and time.'),
   ('Upload the file', 'The tool reads every row and builds a draft for each one.'),
   ('Fix flagged rows', 'Missing times or captions over the limit come back for you to correct.'),
   ('Review the calendar', 'Scroll the month for gaps, typos and clashes.'),
   ('Posts go out', 'Each post publishes at its own time.'),
  ]},
  {'type': 'versus', 'title': 'Bulk scheduling vs a queue', 'cols': ('Bulk scheduling', 'Queue'), 'rows': [
   ('Each post gets its own date and time', True, False),
   ('Posts fill preset time slots', False, True),
   ('Good for launches with fixed dates', True, False),
   ('Good for evergreen posts', 'Sometimes', True),
   ('Loads many posts at once', True, True),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Upload many posts at once, then see them all on one calendar with a preview for each network.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter shows how long a caption is so you can check it against each network\'s limit.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for drafting a month of posts with your team before you upload them.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ('How do I bulk schedule social media posts?', 'Most tools let you upload a CSV or spreadsheet with one post per row, including text, date, time and account. You then review the posts on the calendar before they publish.'),
  ('Can I bulk schedule posts with images?', 'Many tools allow it, either with media links in the spreadsheet or by uploading files in a batch and matching them to posts.'),
  ('What is a CSV file?', 'A CSV is a plain text file that stores a table, with commas between the columns. You can make one by saving any spreadsheet as CSV.'),
  ('Is bulk scheduling the same as batching?', 'They go together but differ. Batching is making lots of content in one sitting. Bulk scheduling is loading that finished content into a tool in one go.'),
  ('Why did my bulk scheduled posts go out at the wrong time?', 'The most common cause is a time zone mismatch between your spreadsheet and your scheduling tool. Check the tool\'s time zone setting before you upload.'),
 ],
 'related': ['social-media-scheduling', 'batching', 'content-calendar', 'queue', 'auto-posting'],
},
{
 'slug': 'business-account',
 'short': 'A business account is a social media profile made for companies and brands, with tools such as analytics, contact buttons, ads and shopping features.',
 'body': '''<h2>What is a business account?</h2>
<p>A business account is a profile set up for a company or brand instead of a private person. Most large networks offer one, though the names differ. Instagram calls it a professional account and lets you pick business or creator. Facebook uses Pages. TikTok and Pinterest offer business accounts, and LinkedIn uses company pages. Google Business Profile is built for businesses from the start.</p>
<p>Switching is usually free. The change adds tools that help you run your profile like a shop front: data about your audience, ways for customers to reach you and access to ads.</p>
<h2>What a business account includes</h2>
<ul>
<li><b>Analytics.</b> Reach, impressions, follower details and how each post did.</li>
<li><b>Contact options.</b> Buttons for email, phone, directions or booking.</li>
<li><b>A category label.</b> A tag under your name, such as Bakery or Software Company.</li>
<li><b>Ads.</b> The option to boost posts and run paid campaigns.</li>
<li><b>Shopping tools.</b> Product tags and shops where the platform supports them.</li>
<li><b>App connections.</b> Access for scheduling and analytics tools through the platform's official API.</li>
</ul>
<p>The exact mix changes from network to network and over time, so check each app's help pages for the current list.</p>
<h2>Business account vs personal and creator accounts</h2>
<p>A personal account is for people sharing with friends, and it can often be set to private. A creator account suits influencers, artists and public figures, with tools for growth and brand deals. A business account suits shops, service providers and companies, with more focus on contact details, ads and selling.</p>
<figure data-chart="1"></figure>
<p>Here is a made-up example. Dana runs a dog grooming shop from her personal Instagram. Customers keep asking for her phone number in the comments. After she switches to a business account, a Call button and her address sit right on the profile. She can also see which posts brought the most profile visits, so she knows what to post more of.</p>
<h2>How to switch to a business account</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Open your profile settings.</b> Look for an option such as account type or switch to professional.</li>
<li><b>Choose business.</b> Then pick the category that best describes what you do.</li>
<li><b>Add contact details.</b> Fill in email, phone, address and a website link where you want customers to reach you.</li>
<li><b>Connect related tools.</b> Some networks ask you to link a Facebook Page or a business portfolio.</li>
<li><b>Check privacy settings.</b> Business accounts are public, so review what shows on your profile.</li>
<li><b>Reconnect your other apps.</b> Make sure any scheduling or analytics tools see the new account type.</li>
</ol>
<h2>How to use the data you get</h2>
<p>The best reason to switch is the insight. Once your account has a few weeks of data, look for patterns. Which posts brought profile visits? Which ones led to taps on your contact buttons or website link? When are your followers online? Write down your averages each month so you can tell whether changes help. Data about where your followers live and how old they are can also shape what you post and when you post it.</p>
<p>For example, a made-up cafe might notice that posts about its weekend specials bring twice the website taps of posts about coffee beans. That is a clear hint to put the specials up front on Fridays. Keep a simple log in a spreadsheet with the date, the post topic and the numbers you care about, then look at it once a month. Over time you build your own benchmark, which beats any general rule you read online.</p>
<h2>Things to know before you switch</h2>
<ul>
<li>Business accounts are public, so anyone can see your posts.</li>
<li>Some apps limit business accounts to music that is cleared for commercial use. That can rule out trends built on popular songs.</li>
<li>Solo creators may get more music options and partnership tools with a creator account.</li>
<li>You can usually switch back, though some insights may reset when you change type. Save any data you want to keep first.</li>
<li>Contact details may show on your profile by default. Hide any you don't want public, such as a home address.</li>
</ul>
<h2>Common mistakes</h2>
<p>Many small businesses run on a personal profile for years and miss out on data and contact buttons. Others switch but leave the category vague or the contact fields empty, which makes it harder for customers to call or find them. Another mistake is treating the business profile like a personal diary. Keep family updates for your own account and use the business one for what customers want to know: hours, offers, news and proof of your work.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Personal account vs business account', 'cols': ('Personal', 'Business'), 'rows': [
   ('Built-in insights', False, True),
   ('Contact buttons', False, True),
   ('Category label under the name', False, True),
   ('Can be set to private', True, False),
   ('Connects to scheduling tools', 'Rarely', 'Usually'),
   ('Full music library', 'Usually', 'Sometimes limited'),
  ], 'note': 'Features differ by network and change over time.'},
  {'type': 'steps', 'title': 'Switching to a business account', 'steps': [
   ('Open settings', 'Find account type or switch to professional.'),
   ('Pick business', 'Choose the category that fits what you do.'),
   ('Add contact details', 'Email, phone, address and a link.'),
   ('Connect your tools', 'Link a Page or portfolio if asked, then reconnect your apps.'),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, engagement and follower growth for your business profiles side by side.'},
  {'name': 'Meta Business Suite', 'url': 'https://business.facebook.com/', 'domain': 'facebook.com', 'line': 'Meta\'s hub for managing Facebook Pages and Instagram business accounts in one place.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for making profile pictures, cover images and post graphics.'},
 ],
 'list': 'social-media-tools-for-small-business',
 'faqs': [
  ('Is an Instagram business account free?', 'Yes. Switching to a professional account on Instagram is free. You only pay if you choose to run ads.'),
  ('Should I use a business or creator account?', 'Brands and service businesses usually pick a business account. Influencers and public figures often choose a creator account for its growth and partnership tools.'),
  ('Can I switch back to a personal account?', 'On most platforms, yes. Some insights may be lost when you switch, so download any data you want to keep first.'),
  ('Do I need a business account to use a scheduling tool?', 'On several networks, yes. Their official APIs often only let outside apps publish to business or creator profiles, so check what each network asks for.'),
  ('Will a business account get less reach?', 'There is no clear sign that the account type alone changes reach. What you post and how people react to it matter far more.'),
 ],
 'related': ['profile', 'analytics', 'instagram-insights', 'meta-business-suite', 'verified-account'],
},
{
 'slug': 'call-to-action',
 'short': 'A call to action (CTA) is a short prompt that tells people what to do next, such as Shop now, Save this or Comment below.',
 'body': '''<h2>What is a call to action?</h2>
<p>A call to action, or CTA, is the part of your post that asks people to take a step. It can be a line in a caption, a button on an ad, words on a graphic or a spoken line at the end of a video. Without one, people may enjoy your post and keep scrolling. With one, you point them toward what you want them to do next.</p>
<p>A CTA can ask for almost anything: a click, a comment, a save, a share, a follow, a sign-up or a visit to your shop. The best ones match the goal of the post.</p>
<h2>Examples of calls to action</h2>
<ul>
<li>"Save this for your next trip."</li>
<li>"Tap the link in our bio to shop the collection."</li>
<li>"Tell us your favorite flavor in the comments."</li>
<li>"Send this to a friend who just started running."</li>
<li>"Book your free class for Thursday."</li>
<li>"Follow for a new recipe every week."</li>
</ul>
<p>Each one names a single action and adds a reason or a place. "Save this for your next trip" works because it tells people why they would want the post later. "Send this to a friend who just started running" works because it puts a specific person in the reader's head. The clearer the picture, the easier the action feels.</p>
<h2>Why calls to action matter</h2>
<p>People are busy, and many will only do what you clearly ask. A CTA turns attention into action. It can drive clicks to your website, grow your email list, start conversations or bring the saves and shares that help a post travel further. It also gives you something to measure. If you asked for clicks, you can check your click-through rate to see whether it worked.</p>
<p>Small wording changes can open a big gap. The chart below uses made-up numbers for one account that tried four CTAs on similar posts.</p>
<figure data-chart="1"></figure>
<h2>How to write a strong CTA</h2>
<ol>
<li><b>Ask for one thing.</b> Pick the action that matters most for that post and leave out the rest.</li>
<li><b>Start with a verb.</b> Shop, watch, join, try, book and download are clear and direct.</li>
<li><b>Give a reason.</b> "Get the free packing checklist" tells people what they gain. "Click here" tells them nothing.</li>
<li><b>Say where to go.</b> Name the exact spot, such as the link in bio, the button below or the pinned comment.</li>
<li><b>Match the network.</b> Links in captions can't be tapped on every app, so point to a place that works.</li>
<li><b>Keep it short.</b> A CTA should fit on one line of a phone screen.</li>
</ol>
<h2>Where to put a CTA</h2>
<p>In long captions, put a short CTA near the start, because many people never tap "more." Repeat it at the end for those who read it all. In videos, say it out loud and show it as on-screen text, since many people watch with the sound off. In ads, the platform's button does much of the work, yet your copy should still back it up with a reason. On a carousel, the last slide is a natural spot for the ask, and in a Story a link sticker or poll can carry it.</p>
<h2>CTAs vs engagement bait</h2>
<p>A CTA asks for an action that makes sense for the post. Engagement bait asks for reactions just to game the feed, such as "Comment YES if you agree" on a post that isn't asking anything. Many platforms try to spot bait and may show those posts to fewer people. A simple test: would the request still make sense if the algorithm didn't exist? If yes, it is a real CTA.</p>
<figure data-chart="2"></figure>
<h2>How to measure and avoid mistakes</h2>
<p>Pick the number that matches the ask. Link clicks for "tap the link," comments for a question, saves for "save this." Track it for each CTA over a few weeks and keep the wording that wins.</p>
<p>Follow the action all the way to the goal. For example, a made-up yoga studio might find that "Book your free class" gets fewer clicks than "See the class times," yet brings more real bookings. The click count alone would have picked the wrong CTA.</p>
<ul>
<li><b>Using the same CTA on every post.</b> People stop seeing it. Rotate the wording and the action.</li>
<li><b>Asking for a click when the link is hard to find.</b> If people have to hunt, most give up.</li>
<li><b>Sending people to the home page.</b> Link to the exact page your post talks about.</li>
<li><b>Skipping link tags.</b> Add UTM parameters to each link so your website analytics can show which CTA sent the visit.</li>
</ul>''',
 'charts': [
  {'type': 'bars', 'title': 'Clicks by CTA wording', 'sub': 'Click-through rate on four similar posts from one account', 'example': True,
   'rows': [('"Click here"', 0.6, '0.6%'), ('"Learn more"', 0.9, '0.9%'), ('"Book your free class"', 1.8, '1.8%'), ('"Get the free checklist"', 2.4, '2.4%')],
   'highlight': '"Get the free checklist"', 'unit': 'Click-through rate', 'note': 'Made-up numbers for one account. Test your own wording.'},
  {'type': 'versus', 'title': 'Call to action vs engagement bait', 'cols': ('Call to action', 'Engagement bait'), 'rows': [
   ('Fits what the post is about', True, False),
   ('Gives people a reason to act', True, False),
   ('Helps you reach a business goal', True, False),
   ('Likely to be shown less by the feed', False, True),
   ('Example', '"Save this checklist for moving day"', '"Comment YES if you like pizza"'),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'Give every "link in bio" CTA one tidy page that holds all your links.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags each link so your analytics can show which CTA sent the visit.'},
  {'name': 'Bitly', 'url': 'https://bitly.com/', 'domain': 'bitly.com', 'line': 'A link shortener that turns long links into short ones and counts the clicks.'},
 ],
 'faqs': [
  ('What is a good call to action for social media?', 'A good CTA asks for one clear action and gives a reason, such as "Save this for later" or "Book your free consult using the link in bio."'),
  ('Where should I put a CTA in a caption?', 'Put a short CTA early in long captions so people see it before the cut off, and repeat it at the end.'),
  ('Can a post have more than one CTA?', 'It can, but one main CTA usually works better. Extra requests split attention and can lower the action you care about most.'),
  ('What is the difference between a CTA and engagement bait?', 'A CTA asks for an action that fits the post and helps a real goal. Engagement bait asks for likes or comments only to trick the feed, and platforms may show it less.'),
  ('How do I know if my CTA worked?', 'Measure the action you asked for, such as link clicks, comments or saves. Compare it with posts that used a different CTA over several weeks.'),
 ],
 'related': ['caption', 'click-through-rate', 'conversion-rate', 'link-in-bio', 'engagement-bait'],
},
{
 'slug': 'caption',
 'short': 'A caption is the text that goes with a social media post, used to add context, tell a story and ask people to take action.',
 'body': '''<h2>What is a caption?</h2>
<p>A caption is the written part of a social media post. On Instagram and TikTok it sits under or beside the photo or video. On LinkedIn, X, Threads and Bluesky, the text often is the post. Captions can hold words, emoji, hashtags, mentions and sometimes links, depending on the network.</p>
<p>A good caption gives people a reason to stop, explains why the post matters and tells them what to do next. A weak one leaves them guessing why they should care. Don't mix captions up with closed captions, which are on-screen text for the audio in a video.</p>
<h2>Caption length limits by network</h2>
<p>Every network sets its own limit. The chart shows the limits our composer uses. Most apps also cut the caption after the first line or two and add a "more" link, so the opening carries a lot of weight no matter how much room you have.</p>
<figure data-chart="1"></figure>
<h2>The parts of a good caption</h2>
<p>Most strong captions follow a simple shape. You don't need every part every time, but it helps to know them.</p>
<figure data-chart="2"></figure>
<p>Here is a made-up example for a plant shop: "Yellow leaves on your monstera? It's usually water, and it's easy to fix. Press a finger into the soil before you water. If it's still damp, wait a few more days. Save this for your next plant check." Then two hashtags at the end. The hook names the problem, the middle gives the fix and the last line asks for a save.</p>
<p>The first line does most of the work. Before you post, cover everything below it and ask whether that line alone would make you tap "more." If not, rewrite it. Strong first lines often name a problem, promise a result or open in the middle of a story.</p>
<h2>How to write a caption step by step</h2>
<ol>
<li><b>Lead with a hook.</b> Open with a question, a surprising detail, a bold line or the main benefit.</li>
<li><b>Add the value.</b> Share the tip, story or detail that makes the post worth reading.</li>
<li><b>Use short lines.</b> Break text into small chunks so it reads well on a phone.</li>
<li><b>Sound like you.</b> Follow your brand voice so every caption feels like it came from the same place.</li>
<li><b>End with one call to action.</b> Ask a question, invite a save or point to a link.</li>
<li><b>Add hashtags with care.</b> A few relevant tags can help people find you. A wall of them looks spammy.</li>
<li><b>Proofread out loud.</b> Typos in the first line are the ones everyone sees.</li>
</ol>
<h2>Short vs long captions</h2>
<p>Short captions work when the picture or video says it all, or for a quick joke. Long captions suit stories, tutorials and posts where people want detail. On LinkedIn and Instagram, a long caption with real value can earn more saves and comments. On X, with 280 characters for standard accounts, and Bluesky, with 300, you have to get to the point fast. Test both lengths with your own audience and compare the results over a few weeks.</p>
<h2>How captions differ between networks</h2>
<ul>
<li><b>Instagram and TikTok.</b> The caption supports the visual. Links in captions usually can't be tapped, so point to your bio.</li>
<li><b>LinkedIn.</b> The text is often the star. The first two lines decide if people click "see more."</li>
<li><b>X, Threads and Bluesky.</b> Short and chatty. Replies matter as much as the post itself.</li>
<li><b>Facebook.</b> Room for very long posts, though most people still read only the start.</li>
<li><b>Pinterest.</b> The description helps people find your pin in search, so use clear words people would type.</li>
</ul>
<p>If you schedule one post to several networks, write the longest version first, then trim. It is easier to cut a full caption down to 280 characters than to stretch a short one into a LinkedIn post people want to read.</p>
<h2>Common mistakes</h2>
<p>Pasting one caption across every network often breaks things. A long Instagram caption won't fit a standard X post, and hashtags that help on one app can look odd on another. Tailor each version. Other mistakes include burying the point at the end, adding links on apps where they can't be tapped and writing captions that only repeat what the image already shows. Use the words to add something the picture can't, like the reason, the story or the next step. Also check how line breaks show up, since some apps squash blank lines into one block of text.</p>''',
 'charts': [
  {'type': 'bars', 'title': 'Caption limits by network', 'sub': 'Characters allowed in one post', 'unit': 'Characters',
   'rows': [('Facebook', 63206, '63,206'), ('YouTube description', 5000, '5,000'), ('LinkedIn', 3000, '3,000'), ('Instagram', 2200, '2,200'), ('TikTok', 2200, '2,200'), ('Discord', 2000, '2,000'), ('Google Business Profile', 1500, '1,500'), ('Threads', 500, '500'), ('Pinterest description', 500, '500'), ('Mastodon', 500, '500'), ('Bluesky', 300, '300'), ('X', 280, '280')],
   'note': "Limits used by Capybaroar's composer, November 2026."},
  {'type': 'steps', 'title': 'The shape of a strong caption', 'steps': [
   ('Hook', 'The first line, the only part many people see before "more."'),
   ('Value', 'The tip, story or detail that makes the post worth reading.'),
   ('Call to action', 'One clear ask, such as a save, a reply or a link tap.'),
   ('Hashtags', 'A few relevant tags at the end, where the network uses them.'),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Write a caption, see a preview for each network and schedule it on one calendar.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter shows how many characters a caption uses before you post it.'},
  {'name': 'Bold text generator', 'url': '/tools/bold-text-generator', 'line': 'Our free generator turns plain words into bold letters you can paste into a caption.'},
 ],
 'faqs': [
  ('How long should an Instagram caption be?', 'Instagram allows up to 2,200 characters. Short captions suit simple posts, while longer ones work for stories and tips. Put the key point in the first line.'),
  ('Do captions affect reach?', 'Captions help people decide whether to engage, and platforms can use caption text to understand what a post is about. Clear, relevant captions tend to help.'),
  ('Should I put hashtags in the caption or the first comment?', 'Either works on many platforms. Putting them in the caption keeps everything in one place, while the first comment keeps the caption cleaner.'),
  ('What is the difference between a caption and closed captions?', 'A caption is the text that goes with a post. Closed captions are on-screen text that shows what is said in a video.'),
  ('Can I use the same caption on every network?', 'You can start from one draft, but edit it for each network. Limits run from 280 characters on X to 63,206 on Facebook, and the style differs too.'),
 ],
 'related': ['hook', 'hashtag', 'call-to-action', 'first-comment', 'alt-text'],
},
{
 'slug': 'carousel-post',
 'short': 'A carousel post is a single social media post that holds several images or videos people swipe through, one slide at a time.',
 'body': '''<h2>What is a carousel post?</h2>
<p>A carousel post bundles several slides into one post. Viewers swipe sideways to move from one image or video to the next, and dots or a counter show how many slides there are. Instagram made the format popular. Facebook, LinkedIn, TikTok photo posts and others have their own versions, though they work a little differently. Each platform sets its own slide limit, and those limits change, so check the app when you post.</p>
<h2>How carousels work</h2>
<p>Each slide is a separate image or clip, but the post shares one caption, one set of likes and one comment thread. When someone swipes, they spend more time on your post. On some apps, a person who skipped the post may later see it again starting on a different slide, which gives you a second chance to catch them.</p>
<p>Not everyone swipes to the end. Most carousels lose viewers with each slide, which is why the first few slides matter most. The chart below uses made-up numbers to show a common shape.</p>
<figure data-chart="1"></figure>
<h2>Why carousel posts matter</h2>
<ul>
<li><b>More time on your post.</b> Each swipe keeps people with your content a little longer.</li>
<li><b>Built for saves.</b> Step-by-step guides and checklists are easy to save and come back to.</li>
<li><b>Room to tell a story.</b> You can build an idea one slide at a time.</li>
<li><b>More of the product.</b> Angles, colors and sizes all fit in one post.</li>
</ul>
<h2>Ideas for carousel posts</h2>
<ul>
<li>A how-to broken into steps</li>
<li>Before and after photos</li>
<li>Myths and facts about your topic</li>
<li>Highlights from an event</li>
<li>A short story told like a comic strip</li>
<li>A list of tools, books or places your audience would like</li>
<li>Answers to the questions customers ask most</li>
</ul>
<p>The best carousel ideas have a natural order. If you can number the parts, or if each slide answers "and then what?", the format fits. If the slides could come in any order, a single image or a short video may tell the story faster.</p>
<h2>How to make a great carousel step by step</h2>
<ol>
<li><b>Plan the slides first.</b> Write one line per slide in a note so the story flows before you design anything.</li>
<li><b>Hook on slide one.</b> Make a clear promise or ask a question so people want to swipe.</li>
<li><b>Keep one idea per slide.</b> Short text in a large font reads best on a phone.</li>
<li><b>Use a steady design.</b> The same fonts, colors and margins make the slides feel like one piece.</li>
<li><b>Add a swipe cue.</b> An arrow, a number or a shape cut off at the edge invites the next swipe.</li>
<li><b>Close with a clear ask.</b> Invite people to save, share or tap the link on the last slide.</li>
<li><b>Write alt text for each slide.</b> Every image needs its own description.</li>
</ol>
<p>For example, a made-up budgeting coach might post eight slides: a hook slide reading "Where did my paycheck go?", five slides with one money habit each, a recap and a final slide asking people to save the post.</p>
<h2>Carousel vs LinkedIn document post</h2>
<p>On LinkedIn, many people build carousels by uploading a PDF as a document post. Each page becomes a slide. It behaves much like an Instagram carousel, but the whole thing is one file, which makes it handy for guides and slide decks you already have. You can reuse a deck from a talk or a sales call, as long as the text is big enough to read on a phone.</p>
<figure data-chart="2"></figure>
<h2>How to measure and avoid mistakes</h2>
<p>Check saves, shares and comments first, since those show people found the post worth keeping. Some apps also show how many people swiped past the first slide. Compare your carousels with single photo posts over a few weeks to see if they earn the extra design work. It also helps to note which slide holds your strongest point. If posts with the key tip on slide two get more saves than posts that hold it until slide six, move your best material earlier.</p>
<ul>
<li><b>A weak first slide.</b> If slide one doesn't earn the swipe, almost no one sees the rest.</li>
<li><b>Tiny text.</b> Fonts need to be readable on a small screen without zooming.</li>
<li><b>Mixed sizes.</b> Slides of different shapes can get cropped in odd ways. Pick one size for all of them.</li>
<li><b>Too many slides.</b> Cut any slide that doesn't add something new.</li>
</ul>''',
 'charts': [
  {'type': 'line', 'title': 'How many viewers reach each slide', 'sub': 'Share of people who saw slide 1', 'example': True, 'suffix': '%', 'unit': 'Viewers',
   'points': [('Slide 1', 100), ('Slide 2', 72), ('Slide 3', 58), ('Slide 4', 49), ('Slide 5', 43), ('Slide 6', 39), ('Slide 7', 36), ('Slide 8', 34)],
   'note': 'Made-up numbers for one eight-slide carousel.'},
  {'type': 'versus', 'title': 'Instagram carousel vs LinkedIn document post', 'cols': ('Instagram carousel', 'LinkedIn document post'), 'rows': [
   ('How you build it', 'Upload images or videos', 'Upload one PDF'),
   ('Can hold video slides', True, False),
   ('People swipe through pages', True, True),
   ('Easy to turn a slide deck into one', False, True),
   ('One caption and one comment thread', True, True),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar for Instagram', 'url': '/instagram-post-scheduler', 'line': 'Plan and schedule your Instagram posts on one calendar and preview them before they go out.'},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Our free guide to the image sizes that fit an Instagram post without odd crops.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for building a set of slides with matching fonts and colors.'},
 ],
 'list': 'instagram-post-schedulers',
 'faqs': [
  ('How many slides can a carousel post have?', 'It depends on the platform, and the limits change over time. Check the app when you create the post to see the current maximum.'),
  ('Do carousel posts get more engagement?', 'They often earn strong engagement, especially saves, because people spend more time swiping. Results vary by audience and content, so compare them with your other posts.'),
  ('Can you mix photos and videos in a carousel?', 'On Instagram and some other platforms, yes. You can combine images and short videos in one carousel.'),
  ('What size should carousel slides be?', 'Use the same size and shape for every slide. A tall portrait size usually fills more of a phone screen, but check each app\'s current guide.'),
  ('How do I make a carousel on LinkedIn?', 'Save your slides as one PDF and upload it as a document post. Each page shows as a slide people can click or swipe through.'),
 ],
 'related': ['instagram', 'linkedin-document-post', 'saves', 'hook', 'caption'],
},
]

TERMS += [
{
 'slug': 'cfbr',
 'short': 'CFBR is LinkedIn slang for "commenting for better reach," a short comment people leave to help a post get shown to more people.',
 'body': '''<h2>What is CFBR?</h2>
<p>CFBR stands for "commenting for better reach." You will see it almost only on LinkedIn. People leave the four letters as a comment on someone else's post, often a job search post, a call for help or a cause they want to back. The idea is simple. Comments count as interest, and interest can push a post into more feeds, so even a tiny comment might help the post travel.</p>
<p>Think of it as a public nudge that says, "I can't help directly, but I want more people to see this." It is a small act of support, and on a hard day it can mean a lot to the person who posted. The letters are usually in capitals, and some people add a short line of support after them.</p>
<h2>Where people use CFBR</h2>
<ul>
<li>Under posts from people who lost their job and are looking for work</li>
<li>Under requests for referrals, advice or introductions</li>
<li>Under posts about fundraisers or urgent local needs</li>
<li>Under a student's first post asking for an internship</li>
<li>Now and then under a friend's big news</li>
</ul>
<p>You will rarely see it on Instagram, TikTok or X. Each network has its own habits, and CFBR grew out of LinkedIn's culture of people helping each other find work.</p>
<h2>An example of CFBR</h2>
<p>Here is a made-up example. Someone posts: "After six great years, my role was cut this week. I'm looking for product design jobs in Denver or remote. Any leads are welcome!" One former coworker comments only "CFBR." Another writes: "CFBR. Maria is one of the most thoughtful designers I've worked with, and she ran our whole mobile redesign." The second comment tells a hiring manager something real. It also gives other readers a reason to reply. If you are the one commenting, aim for the second style.</p>
<figure data-chart="1"></figure>
<h2>Does CFBR work?</h2>
<p>Comments are one of the signals LinkedIn uses to judge interest, so a burst of them can help a post reach more people. Very short comments may count for less than real replies, though. Platforms in general try to reward real conversation and spot low-effort engagement. Nobody outside LinkedIn knows exactly how much weight a four-letter comment carries, and the system changes over time.</p>
<p>What is clear is that a comment with a sentence or two of real support helps twice. It adds a signal to the post, and it gives readers a reason to trust the person who posted. A bare acronym only does the first, and maybe not even that.</p>
<p>If you wrote the post and people are leaving CFBR, reply to a few of them with thanks. Replies keep the thread going and show newcomers that the post is active.</p>
<h2>How to use CFBR well</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Read the whole post.</b> Make sure you know what the person is asking for.</li>
<li><b>Add a real line.</b> Mention a skill, a project or a reason you trust them.</li>
<li><b>Tag someone who can help.</b> If you know a recruiter or a hiring manager in that field, mention them, but only if you think they would welcome it.</li>
<li><b>Repost with a note.</b> A repost with your own words reaches your network directly, which often does more than a comment.</li>
<li><b>Send a private lead.</b> If you know of an opening, a direct message with the details is the most useful help of all.</li>
</ol>
<h2>When to skip it</h2>
<p>Save CFBR for posts that really need reach, like someone looking for work or a request with a deadline. Using it on every post you scroll past feels like spam. It can also look like engagement bait when people use it to boost their own sales posts. If you ask your network to comment CFBR on your own post, keep it for moments that truly matter, such as a job search, and thank the people who show up for you. A short reply to each comment keeps the thread alive and shows you noticed.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Commenting without reading.</b> You might back a post you wouldn't agree with, or miss a chance to help directly.</li>
<li><b>Leaving only the letters when you know the person.</b> A short note about their work is worth far more.</li>
<li><b>Asking for CFBR on sales posts.</b> It can come across as gaming the feed and may annoy your network.</li>
<li><b>Tagging lots of people at once.</b> A long row of tags looks like spam. Pick one or two people who can really help.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'A bare "CFBR" vs a helpful comment', 'cols': ('Bare "CFBR"', 'Helpful comment'), 'rows': [
   ('Adds a comment to the post', True, True),
   ('Tells readers something about the person', False, True),
   ('Gives a hiring manager a reason to reach out', False, True),
   ('Takes more than a few seconds', False, True),
   ('Example', '"CFBR"', '"CFBR. Maria led our mobile redesign and mentors new designers."'),
  ]},
  {'type': 'steps', 'title': 'How to help a job post travel', 'steps': [
   ('Read the post', 'Know what the person needs before you add your name to it.'),
   ('Comment with a real line', 'One sentence about their skills or work.'),
   ('Tag one person who can help', 'A recruiter or manager in the right field.'),
   ('Repost with your own note', 'Your network sees it directly in their feed.'),
  ]},
 ],
 'faqs': [
  ('What does CFBR mean on LinkedIn?', 'CFBR means commenting for better reach. People comment it to help a post be seen by more people, usually a job search or a request for help.'),
  ('Is commenting CFBR helpful?', 'It can give a post a small boost, but a comment with a real sentence of support or a useful lead helps more.'),
  ('Is it okay to ask people to comment CFBR?', 'For a personal job search or urgent request, many people do. Asking for it on sales posts can look like engagement bait.'),
  ('What should I write instead of just CFBR?', 'Add one line about why you trust the person, such as a project you worked on together. If you know someone who could help, tag them or send a private message.'),
  ('Is a repost better than a CFBR comment?', 'Often, yes. A repost with your own note puts the post straight in front of your network, while a comment only adds a signal to the original.'),
 ],
 'related': ['linkedin', 'engagement-bait', 'algorithm', 'organic-reach'],
},
{
 'slug': 'click-through-rate',
 'short': 'Click-through rate (CTR) is the percentage of people who click a link or ad after seeing it: clicks divided by impressions, times 100.',
 'body': '''<h2>What is click-through rate?</h2>
<p>Click-through rate, or CTR, tells you how often people who see something actually click it. It is a percent, and the math is short: clicks divided by impressions, times 100. You can measure CTR for organic posts, ads, link-in-bio pages, YouTube thumbnails, emails and search results.</p>
<p>CTR sits between two other numbers. Impressions tell you how many times your post was shown. Conversions tell you how many people did what you hoped after the click. CTR is the bridge that tells you whether the post made people curious enough to leave the feed.</p>
<h2>How to calculate CTR</h2>
<figure data-chart="1"></figure>
<p>With made-up numbers: a post was shown 2,000 times and got 40 link clicks. 40 ÷ 2,000 × 100 = 2%. If the next post gets 60 clicks from 2,000 impressions, its CTR is 3%. The same number of showings brought half again as many clicks.</p>
<p>Some tools divide by reach instead of impressions. Reach counts people and impressions count showings, so CTR by reach is usually higher. Pick one base and stick with it when you compare.</p>
<h2>What counts as a click?</h2>
<p>This differs by platform, so read the labels. Some reports count only link clicks, which are taps that open your website. Others count every click on the post, such as opening the image, tapping "more" or tapping your name. For website traffic, link clicks are the number to watch. On YouTube, CTR usually means how often people chose your video after seeing its thumbnail, so it measures the thumbnail and title more than the video itself.</p>
<p>Where the link sits changes the picture too. A link sticker in a Story, a button on an ad and a link in a LinkedIn post all get tapped in different ways. When you see a CTR in a report, check where the link was before you compare it with another one.</p>
<h2>Why CTR matters</h2>
<p>Reach tells you how many people saw your post. CTR tells you whether it made them act. A post can reach thousands of people and still send almost no one to your site. Watching CTR helps you see which hooks, images and calls to action move people. On ad platforms, a higher CTR can also be a sign that your ad is relevant to the people seeing it, which may help it perform better over time.</p>
<figure data-chart="2"></figure>
<p>The funnel shows where CTR sits in a made-up journey. Most people drop off between seeing and clicking, which is why a small gain in CTR can change your results a lot further down.</p>
<h2>How to improve your click-through rate</h2>
<ol>
<li><b>Write a clear hook.</b> Tell people what they get in the first line.</li>
<li><b>Use a specific CTA.</b> "Read the five-step guide" beats "Click here."</li>
<li><b>Pick a strong image or thumbnail.</b> A clear subject and readable text draw the eye.</li>
<li><b>Target the right people.</b> In ads, a closer match between the message and the audience usually brings more clicks.</li>
<li><b>Make the link easy to find.</b> Point to the link in bio or the button when links can't be tapped in captions.</li>
<li><b>Test versions.</b> Run A/B tests on headlines and images, one change at a time.</li>
</ol>
<p>For example, a made-up gardening account changes only its first line, from "New blog post is up" to "The one mistake that kills tomato seedlings." With the same image and link, CTR on similar posts rises from 1.1% to 2.6%. One clear promise did the work.</p>
<h2>CTR vs conversion rate</h2>
<p>CTR measures the click. Conversion rate measures what happens after, such as a sale or a sign-up. A high CTR with a low conversion rate often means the post promised something the landing page didn't deliver. A low CTR with a high conversion rate can mean you have a great offer that too few people notice. Track both, ideally with UTM parameters, so you know which posts sent which visitors.</p>
<figure data-chart="3"></figure>
<h2>Common mistakes</h2>
<ul>
<li><b>Chasing clicks with clickbait.</b> CTR may rise for a while, but people feel tricked and leave fast.</li>
<li><b>Comparing across formats.</b> A video ad, a text post and an email behave differently. Compare like with like.</li>
<li><b>Mixing click types.</b> All clicks and link clicks are different numbers. Check which one your report shows.</li>
<li><b>Judging a single post.</b> Look at averages over several weeks before you change your plan.</li>
<li><b>Ignoring what happens after.</b> A click that leaves in two seconds is worth little. Pair CTR with time on page.</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Click-through rate', 'formula': 'CTR = clicks ÷ impressions × 100',
   'note': 'Made-up numbers to show the math.', 'result': '2%', 'example': [('Link clicks', '40'), ('Impressions', '2,000')]},
  {'type': 'funnel', 'title': 'From seeing a post to signing up', 'sub': 'One post with a link to a sign-up page', 'example': True, 'unit': 'People',
   'stages': [('Impressions', 20000, '20,000'), ('Link clicks', 400, '400'), ('Page views', 360, '360'), ('Sign-ups', 18, '18')],
   'note': 'Made-up numbers. CTR here is 400 ÷ 20,000 = 2%.'},
  {'type': 'versus', 'title': 'CTR vs conversion rate', 'cols': ('Click-through rate', 'Conversion rate'), 'rows': [
   ('Measures', 'The click', 'The action after the click'),
   ('Formula', 'Clicks ÷ impressions × 100', 'Conversions ÷ visitors × 100'),
   ('Where you find it', 'Platform insights', 'Website analytics'),
   ('Tells you about', 'The post or ad', 'The offer and landing page'),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach and engagement for every channel side by side, so you can tell which posts got seen.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free builder tags your links so website analytics can tell which post sent each click.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': 'Website analytics that shows where visitors came from and what they did on your site.'},
  {'name': 'Bitly', 'url': 'https://bitly.com/', 'domain': 'bitly.com', 'line': 'A link shortener that makes links tidy and counts how often they are clicked.'},
 ],
 'faqs': [
  ('How do you calculate click-through rate?', 'Divide the number of clicks by the number of impressions, then multiply by 100. For example, 30 clicks from 1,500 impressions is a 2% CTR.'),
  ('What is a good click-through rate on social media?', 'It varies a lot by platform, format, industry and audience. The best benchmark is your own past results, so aim to beat your average.'),
  ('What is the difference between CTR and engagement rate?', 'CTR counts clicks as a share of impressions. Engagement rate counts all interactions, such as likes, comments and shares, as a share of followers or reach.'),
  ('What does CTR mean on YouTube?', 'On YouTube, CTR usually shows how often people clicked your video after seeing its thumbnail. It mostly tells you how well the thumbnail and title work.'),
  ('Why is my CTR high but my sales low?', 'The post may promise something the landing page doesn\'t deliver, or the page may be slow or confusing. Check your conversion rate and make sure the page matches the post.'),
 ],
 'related': ['impressions', 'conversion-rate', 'call-to-action', 'utm-parameters', 'cost-per-click'],
},
{
 'slug': 'clickbait',
 'short': 'Clickbait is a headline or thumbnail that teases or exaggerates to get clicks, then fails to deliver what it promised.',
 'body': '''<h2>What is clickbait?</h2>
<p>Clickbait is content built to get clicks above all else. It uses shocking claims, teases or false promises to make people curious. Typical lines sound like "You won't believe what happened next" or "This one trick changes everything." The thumbnail might show something that never appears in the video. When people click, the content is thin, slow to get going or simply different from what they were promised.</p>
<p>The word started with online headlines. It now covers video titles, thumbnails, captions, ad copy and even the first seconds of a short video. Ads can be clickbait too, when the picture or offer in the ad doesn't match the page you land on.</p>
<h2>Clickbait vs a strong hook</h2>
<p>Every good post needs a hook, so where is the line? The test is whether you deliver. A strong hook makes a promise and keeps it. "Four ways to cut your grocery bill this week" is a hook if the post really gives four useful ways. It becomes clickbait when the post is padded, hides the answer at the very end or never gets to the point. Curiosity is fine. Tricking people is the problem.</p>
<figure data-chart="1"></figure>
<h2>How clickbait works, and why it backfires</h2>
<p>Clickbait plays on the gap between what you know and what you want to know. The title opens a question and the click promises to close it. That can bring a burst of clicks. Then people arrive, feel let down and leave. Platforms watch what happens after the click, such as how long people stay, so the burst often fades fast.</p>
<figure data-chart="2"></figure>
<ul>
<li><b>Lost trust.</b> People remember who wasted their time and stop clicking your posts.</li>
<li><b>Weak signals.</b> When people leave in the first seconds, platforms may show the post to fewer people.</li>
<li><b>Platform rules.</b> Many platforms have rules against misleading titles, thumbnails and ads.</li>
<li><b>Poor leads.</b> Clicks from people who feel tricked rarely turn into customers.</li>
</ul>
<p>There is also a slower cost. A follower who feels fooled once may scroll past your next post, even when it is honest and useful. You lose clicks you never get to see.</p>
<h2>Examples</h2>
<p>Here are made-up pairs that show the difference.</p>
<ul>
<li><b>Clickbait:</b> a video titled "I quit my job forever" that turns out to be about moving desks at the same company.</li>
<li><b>Honest hook:</b> "I left my office job to bake full time. Here's what the first month cost me."</li>
<li><b>Clickbait:</b> a thumbnail of a cracked phone on a video that never mentions a cracked phone.</li>
<li><b>Honest hook:</b> a thumbnail of the real phone case mid-drop, with the words "Drop test."</li>
</ul>
<p>The honest versions are still curious. They just tell you what you'll get.</p>
<h2>How to write curious posts without clickbait</h2>
<ol>
<li><b>Promise a clear benefit.</b> Then deliver it early, ideally in the first few seconds or lines.</li>
<li><b>Use real details.</b> Specific numbers and names from your own work feel honest and stand out.</li>
<li><b>Match the thumbnail to the content.</b> Show a moment that really happens in the video.</li>
<li><b>Keep the mystery in the how.</b> Be clear about what people will get, and let the how pull them in.</li>
<li><b>Read it as a stranger.</b> Ask yourself, "Would I feel fooled after watching this?"</li>
</ol>
<p>Try writing the title last. Once the video or post is done, find the most surprising true thing in it and build the title around that. You will find you rarely need to stretch anything.</p>
<h2>How to spot it in your own work</h2>
<p>Some creators slide into clickbait slowly. Each title gets a little bigger to keep up with the last one. Watch your numbers for signs. If clicks rise while watch time, time on page or comments fall, your titles may be promising more than your content gives. Read the comments too. Lines like "where is the part from the title?" are a clear warning. For example, a made-up cooking channel might see its click-through rate jump on a dramatic title while average watch time drops by half. That trade rarely pays off for long.</p>
<h2>Common mistakes</h2>
<ul>
<li>Saving the payoff for the last few seconds so people have to sit through filler</li>
<li>Using fake reactions, like a shocked face, for content that isn't surprising</li>
<li>Copying a title style from another niche without checking if it fits your audience</li>
<li>Thinking a small stretch doesn't count. Viewers notice, and trust is slow to win back.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Clickbait vs a strong hook', 'cols': ('Clickbait', 'Strong hook'), 'rows': [
   ('Makes people curious', True, True),
   ('Delivers what it promises', False, True),
   ('Thumbnail matches the content', 'Often not', True),
   ('People stay after clicking', 'Rarely', 'More often'),
   ('Builds trust over time', False, True),
  ]},
  {'type': 'line', 'title': 'What a misleading title does to watch time', 'sub': 'Share of viewers still watching, by seconds into the video', 'example': True, 'suffix': '%', 'unit': 'Still watching',
   'points': [('0s', 100), ('5s', 55), ('10s', 38), ('20s', 27), ('30s', 22), ('45s', 18), ('60s', 15)],
   'note': 'Made-up numbers to show a common shape.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Track reach and engagement for each post so you can see when a title brings views but no replies.'},
  {'name': 'YouTube Studio', 'url': 'https://studio.youtube.com/', 'domain': 'youtube.com', 'line': 'YouTube\'s own dashboard for your channel, where you can see how long people keep watching.'},
  {'name': 'YouTube thumbnail size', 'url': '/tools/youtube-thumbnail-size', 'line': 'Our free guide to the size a thumbnail needs so it looks sharp everywhere.'},
 ],
 'faqs': [
  ('Is clickbait bad for reach?', 'It often is. When people click and leave quickly, platforms and search engines can read that as a sign the content isn\'t useful.'),
  ('What is an example of clickbait?', 'A thumbnail showing a broken phone on a video that never mentions a broken phone is clickbait. So is a headline that promises a secret and never shares one.'),
  ('Is a curiosity hook the same as clickbait?', 'No. A curiosity hook makes people want to know more and then delivers. Clickbait promises something the content doesn\'t provide.'),
  ('Can clickbait get my account in trouble?', 'It can. Many platforms have rules against misleading titles, thumbnails and ads, and they may limit or remove content that breaks them.'),
  ('How do I know if my titles are too clickbaity?', 'Watch for clicks going up while watch time or comments go down, and read what viewers say. If people mention the title did not match, tone it down.'),
 ],
 'related': ['hook', 'engagement-bait', 'thumbnail', 'click-through-rate', 'authenticity'],
},
{
 'slug': 'closed-captions',
 'short': 'Closed captions are on-screen text that shows the words and key sounds in a video, which viewers can usually turn on or off.',
 'body': '''<h2>What are closed captions?</h2>
<p>Closed captions are a text version of a video's audio. They show what people say and often describe important sounds, such as [door slams] or [upbeat music]. "Closed" means the viewer can switch them on or off. Open captions are the opposite. They are burned into the video picture and always show.</p>
<p>Most big video apps can make captions for you. TikTok, Instagram, YouTube, Facebook and LinkedIn can create them from your audio, and most let you edit the text before or after you publish. On some platforms, such as YouTube, you can also upload your own caption file.</p>
<h2>Why closed captions matter</h2>
<ul>
<li><b>Access.</b> People who are deaf or hard of hearing can follow along.</li>
<li><b>Sound-off viewing.</b> Many people scroll in public, at work or late at night with the sound off.</li>
<li><b>Clarity.</b> Captions help with accents, fast speech, noisy rooms and technical words.</li>
<li><b>Language learners.</b> Reading along helps viewers whose first language is different from yours.</li>
<li><b>Search.</b> Caption text can help platforms and search engines understand what your video is about.</li>
</ul>
<p>Captions also help you. A viewer who can follow the words is more likely to stay to the end, and most video apps pay close attention to how long people watch.</p>
<h2>Closed captions vs open captions vs subtitles</h2>
<p>Closed captions include speech and key sounds, made for viewers who can't hear the audio. Open captions show the same kind of text, but it is part of the picture, so it can't be turned off or edited later. Subtitles usually show only speech and are often a translation. On social media, the word caption also means the text that goes with your post, which is a different thing.</p>
<figure data-chart="1"></figure>
<p>Many short video creators use open captions styled to match their brand, since they look the same everywhere. Closed captions are easier to fix and can be read by screen readers and search tools. Some creators use both on longer videos, with care so the two don't overlap.</p>
<h2>How to add good closed captions</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Turn on auto captions.</b> Use the platform's tool as a starting point.</li>
<li><b>Proofread every line.</b> Auto captions often get names, brand terms and numbers wrong.</li>
<li><b>Keep lines short.</b> Two short lines on screen are easier to read than one long one.</li>
<li><b>Time them well.</b> Captions should appear as words are spoken and stay long enough to read.</li>
<li><b>Place them carefully.</b> Keep text clear of app buttons and the post caption area on short video apps.</li>
<li><b>Note key sounds.</b> Add short tags such as [laughter] when the sound matters to the story.</li>
</ol>
<p>Here is a made-up example. A bike shop films a repair tip and turns on auto captions. The tool writes "chain loop" instead of "chain lube" and spells the brand name wrong. Two minutes of editing fixes both before anyone sees the video.</p>
<p>If you write a script before filming, keep it. You can use it to check the auto captions line by line, or upload it as a caption file on YouTube, which saves fixing mistakes word by word.</p>
<h2>How captions work on each network</h2>
<p>The tools differ, so check each app. Short video apps tend to offer auto captions in the editor, with a way to change the words. YouTube lets you review automatic captions in its studio and upload your own files in more than one language. Facebook and LinkedIn can add captions to uploaded videos too. If you post the same video to many networks, burned-in open captions save you from fixing captions on every app, while closed captions give viewers more control.</p>
<p>To see whether captions help, compare average watch time on a few captioned videos with a few older ones that had none. Look closely at the share of people who watch past the first few seconds, since that is where sound-off viewers decide to stay or go.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Skipping the review.</b> A wrong word can change your meaning or turn a serious video into a joke.</li>
<li><b>Fancy styles that are hard to read.</b> Words that pop in a different color each time tire the eyes. Pick a clear font with strong contrast.</li>
<li><b>Two sets of text.</b> If you burn in captions and also turn on auto captions, viewers may see both on top of each other.</li>
<li><b>Text under the buttons.</b> Captions placed too low or too far right can hide behind the app's icons.</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Closed captions vs open captions', 'cols': ('Closed captions', 'Open captions'), 'rows': [
   ('Viewer can turn them off', True, False),
   ('Can be fixed after posting', 'Usually', False),
   ('Look the same on every app', False, True),
   ('Readable by screen readers and search', 'Often', False),
   ('Styled to match your brand', False, True),
  ]},
  {'type': 'steps', 'title': 'How to caption a video', 'steps': [
   ('Turn on auto captions', 'Let the app make a first draft from your audio.'),
   ('Fix the words', 'Correct names, brand terms and numbers.'),
   ('Check the timing', 'Each line should show while it is spoken.'),
   ('Check the placement', 'Keep text clear of the app\'s buttons.'),
   ('Publish', 'Watch it once with the sound off to be sure.'),
  ]},
 ],
 'tools': [
  {'name': 'CapCut', 'url': 'https://www.capcut.com/', 'domain': 'capcut.com', 'line': 'A video editor for trimming clips and adding on-screen text and captions.'},
  {'name': 'YouTube Studio', 'url': 'https://studio.youtube.com/', 'domain': 'youtube.com', 'line': 'YouTube\'s own dashboard for managing your videos and their captions.'},
 ],
 'faqs': [
  ('What is the difference between closed captions and open captions?', 'Closed captions can be turned on or off by the viewer. Open captions are part of the video image and always show.'),
  ('How do I add captions to a TikTok or Reel?', 'Both apps offer an automatic captions option while you edit. Turn it on, then review and correct the text before posting.'),
  ('Do captions help video reach?', 'They can help people watch longer when the sound is off, and caption text can help platforms understand your video. Clear captions also make your content usable for more people.'),
  ('Are auto captions good enough?', 'They are a good start, but they often get names, brand terms and numbers wrong. Always read them through and fix mistakes before you post.'),
  ('What is the difference between captions and subtitles?', 'Captions show speech and key sounds for people who can\'t hear the audio. Subtitles usually show only speech, often translated into another language.'),
 ],
 'related': ['alt-text', 'voiceover', 'watch-time', 'video-views', 'caption'],
},
{
 'slug': 'collab-post',
 'short': 'A collab post is a single Instagram post or Reel shared by two or more accounts, appearing on each profile with combined likes and comments.',
 'body': '''<h2>What is a collab post?</h2>
<p>A collab post lets two or more accounts share one piece of content on Instagram. One account creates the post or Reel and invites another as a collaborator. Once the invite is accepted, the post shows on both profiles and in both sets of followers' feeds. All the names appear at the top. Likes, comments and views are shared, so everyone sees the same totals.</p>
<p>Collabs are common between a brand and a creator, two creators, two small businesses or a company and its partner. Other apps have their own ways to co-author or credit posts, and the details change, so check each network.</p>
<p>The post still belongs to the account that made it. That account can edit the caption or delete the post, while a collaborator can usually remove their name from it.</p>
<h2>How collab posts work</h2>
<p>A normal post reaches your followers and anyone the app recommends it to. A collab post adds your partner's followers to that pool. The post lives in one place, so all the reactions pile up together instead of being split across two copies.</p>
<figure data-chart="1"></figure>
<p>In this made-up example, a candle shop and a home decor creator make a Reel together. A little over a third of the views come from the shop's own followers. Almost as many come from the creator's followers, people who may never have heard of the shop before.</p>
<h2>Why collab posts matter</h2>
<ul>
<li><b>More reach.</b> One post is shown to both audiences at once.</li>
<li><b>Shared social proof.</b> Likes and comments from both communities add up on one post.</li>
<li><b>Clear credit.</b> Both names appear, which makes the partnership open and easy to see.</li>
<li><b>Less duplicate work.</b> You don't need two separate posts for the same campaign.</li>
</ul>
<p>Pick a partner whose followers would enjoy your work without being the same people. A coffee roaster and a bakery across town make a strong pair, because their fans like similar things but may not know each other's shops. Two roasters on the same street may just trade the same followers back and forth.</p>
<h2>How to create a collab post</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Agree on the plan.</b> Settle the topic, caption, date and time with your partner first.</li>
<li><b>Create the post or Reel.</b> Build it as you normally would.</li>
<li><b>Invite a collaborator.</b> Look for the option to tag people, choose to invite a collaborator and search for the other account.</li>
<li><b>Publish.</b> The post goes live on your profile right away.</li>
<li><b>Ask your partner to accept.</b> Once they do, it also appears on their profile and to their followers.</li>
</ol>
<p>Some accounts have privacy settings that limit who can invite them, and menu names can move between app versions.</p>
<h2>Collab post vs tagging</h2>
<p>When you tag someone in a post, it lives only on your profile, and they may see it in their tagged tab. With a collab post, the content belongs to both of you and shows on both grids. For paid brand deals, still use the platform's paid partnership label, since disclosure rules apply either way.</p>
<figure data-chart="3"></figure>
<h2>Ideas and how to measure</h2>
<ul>
<li>A creator reviewing or demoing a brand's product</li>
<li>Two local shops announcing a joint event</li>
<li>A guest recipe or tutorial</li>
<li>A giveaway run by a few brands together</li>
<li>Highlights from a podcast or interview with a guest</li>
</ul>
<p>To judge a collab, look past the total views. Check how many new followers you gained in the days after, how many people visited your profile and whether comments came from people new to you. Compare those with your normal posts. A collab that brings fewer views but more new followers may be the better deal.</p>
<p>Agree with your partner on what success looks like before you post, and share results after a week. Both accounts see the same likes and comments, but each sees only its own follower gains and profile visits, so swap those numbers too.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>No shared plan.</b> The invite sits unaccepted for days because nobody agreed on timing.</li>
<li><b>A poor audience match.</b> Extra reach won't help if your partner's followers don't care about your topic.</li>
<li><b>One-sided captions.</b> A caption that only talks about one brand makes the partner's followers feel left out.</li>
<li><b>Forgetting to reply.</b> Both accounts should answer comments, since they come from both communities.</li>
</ul>''',
 'charts': [
  {'type': 'stack', 'title': 'Where the views came from', 'sub': 'One collab Reel between a shop and a creator', 'example': True,
   'parts': [("Shop's followers", 38), ("Creator's followers", 34), ('Non-followers', 28)],
   'note': 'Made-up numbers to show how a collab adds a second audience.'},
  {'type': 'steps', 'title': 'Making a collab post', 'steps': [
   ('Agree on the plan', 'Topic, caption, date and time, decided together.'),
   ('Create the post', 'Build the post or Reel as usual.'),
   ('Invite a collaborator', 'Use the tag people option and pick invite collaborator.'),
   ('Partner accepts', 'The post appears on both profiles and both feeds.'),
  ]},
  {'type': 'versus', 'title': 'Collab post vs tagging', 'cols': ('Collab post', 'Tag'), 'rows': [
   ('Shows on both profile grids', True, False),
   ('Shown to both sets of followers', True, False),
   ('One shared count of likes and comments', True, False),
   ('Needs the other account to accept', True, False),
   ('Both names at the top of the post', True, False),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar for Instagram', 'url': '/instagram-post-scheduler', 'line': 'Plan the post on one calendar so you and your partner know exactly when it goes out.'},
  {'name': 'Instagram post size', 'url': '/tools/instagram-post-size', 'line': 'Our free guide to the image and video sizes that fit an Instagram post.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool where you and a partner can work on the same graphic.'},
 ],
 'list': 'instagram-post-schedulers',
 'faqs': [
  ('How do I make a collab post on Instagram?', 'While creating a post or Reel, go to the tag people option and invite a collaborator. Once they accept, the post appears on both profiles.'),
  ('Do collab posts get more reach?', 'They are shown to the followers of each account, so they can reach more people than a post on one profile alone.'),
  ('Who owns a collab post?', 'The account that created it can edit or delete it. A collaborator can usually remove themselves from the post.'),
  ('Do I still need a paid partnership label on a collab post?', 'Yes, if the post is paid. A collab post shows both names, but disclosure rules still ask you to mark sponsored content clearly.'),
  ('Can I invite more than one collaborator?', 'Instagram has allowed more than one collaborator on a post, but the limit can change. Check the app when you create the post.'),
 ],
 'related': ['instagram', 'influencer-marketing', 'tag', 'reach', 'sponsored-content'],
},
]

TERMS += [
{
 'slug': 'community-guidelines',
 'short': "Community guidelines are a platform's or group's public rules for what people may post, and what happens when someone breaks them.",
 'body': '''<h2>What are community guidelines?</h2>
<p>Community guidelines are the rules of a space. Every major network publishes its own, explaining what people may post and what is off limits. They cover topics such as hate speech, harassment, violence, nudity, spam, false information, scams and copyright. Brands and creators can also write their own guidelines for their pages, Facebook groups, Discord servers or comment sections.</p>
<p>Guidelines sit next to a platform's terms of service. The terms are the legal agreement you accept when you sign up. The guidelines explain the main rules in plainer words, often with examples of what is and isn't allowed.</p>
<figure data-chart="1"></figure>
<h2>How platforms enforce their guidelines</h2>
<p>Platforms use a mix of automatic systems and human reviewers. Automatic tools scan posts, comments, images and videos for things that look like a rule break. People report content too. Reviewers then look at the harder cases. Because so much is checked by software, mistakes happen in both directions: some rule breaks slip through, and some fine posts get flagged.</p>
<p>Each platform handles a rule break in its own way, but many follow a rising ladder of steps. The more serious or repeated the problem, the higher up the ladder it goes.</p>
<figure data-chart="2"></figure>
<p>Most platforms let you appeal if you think a decision was wrong. The notice you get usually has a link to start an appeal, and it helps to explain calmly why the post fits the rules.</p>
<h2>Why community guidelines matter for brands</h2>
<p>If you post for a business, a removed post or a limited account can wreck a campaign. Knowing the rules helps you avoid trouble with contests, health claims, before and after photos, weight loss content, alcohol, music and ads. Some content may be allowed but kept out of recommendations, which means it stays up yet reaches fewer new people. That can feel like a mystery drop in reach when the real cause is a rule you didn't know about.</p>
<p>Here is a made-up example. A supplement brand posts a Reel saying its gummies "cure anxiety." The post is flagged for a health claim and shown to far fewer people. A rewrite that calls the gummies "part of my calm evening routine," with no medical promise, runs without trouble.</p>
<h2>How to write guidelines for your own community</h2>
<ol>
<li><b>Keep them short.</b> A handful of clear rules is easier to follow than a long legal page.</li>
<li><b>Say what you want, too.</b> Pair "no personal attacks" with "be kind and stay on topic."</li>
<li><b>Give examples.</b> One line showing what crosses the line saves a lot of arguing later.</li>
<li><b>Explain the steps.</b> Tell members what happens if they break a rule, such as a warning first, then removal.</li>
<li><b>Pin them.</b> Put the rules where everyone sees them, such as a pinned post, a group description or a welcome channel.</li>
<li><b>Apply them evenly.</b> Enforce the same rules for everyone, including fans and friends.</li>
</ol>
<p>For example, a made-up running club's Facebook group might use five rules: be kind, stay on topic, no selling without asking the admins, no medical advice and no sharing other members' photos without asking. Each rule fits on one line, and the welcome post explains that a first break gets a friendly message and a second gets the post removed.</p>
<h2>How to stay on the right side of the rules</h2>
<ul>
<li>Read the sections that touch your niche before you plan a campaign.</li>
<li>Keep a short list of the rules that matter most for your brand and share it with anyone who posts for you.</li>
<li>Use licensed music and images, and credit creators when you share their work.</li>
<li>Check each platform's separate ad rules, which are often stricter than the rules for normal posts.</li>
<li>Look for updates every few months, since guidelines change.</li>
</ul>
<h2>Common mistakes</h2>
<p>Many creators only read the guidelines after a post is removed. Others rely on rumors about banned words instead of the official rules, which leads to confusing algospeak and can still miss the real problem. Another mistake is fighting a removal in public before filing an appeal. Use the appeal first and keep a calm record of what happened, with screenshots and dates. Finally, brands sometimes write rules for their own group and then never enforce them, which teaches members that the rules don't count.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Community guidelines vs terms of service', 'cols': ('Community guidelines', 'Terms of service'), 'rows': [
   ('Written in plain words', True, 'Less often'),
   ('Legal agreement you accept', False, True),
   ('Gives examples of what is allowed', 'Often', 'Rarely'),
   ('Explains what happens after a rule break', True, 'Sometimes'),
   ('Changes over time', True, True),
  ]},
  {'type': 'steps', 'title': 'A common ladder of enforcement', 'steps': [
   ('Warning', 'A notice that a post broke a rule.'),
   ('Post removed or hidden', 'The content comes down or stops being recommended.'),
   ('Strike on the account', 'On many platforms, strikes add up over time.'),
   ('Feature limits', 'Live video, earning tools or reach may be limited.'),
   ('Ban', 'A temporary or permanent loss of the account.'),
  ], 'note': 'Steps and names differ by platform.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See comments and mentions from every channel in one inbox so you can act on rule breaks quickly.'},
  {'name': 'Notion', 'url': 'https://www.notion.so/', 'domain': 'notion.so', 'line': 'A workspace for writing your community rules on one shared page your team can find.'},
 ],
 'faqs': [
  ('Where can I find a platform\'s community guidelines?', 'Most platforms link to them in the app\'s settings or help center and at the bottom of their website.'),
  ('What happens if I violate community guidelines?', 'Your post may be removed, your reach may be limited or your account may get a strike. Repeated or serious violations can lead to a ban.'),
  ('Can I appeal a community guidelines strike?', 'Most platforms offer an appeal option, often in the notice you receive about the removal.'),
  ('Should my brand have its own community guidelines?', 'If you run a group, server or busy comment section, yes. A short list of clear rules makes moderation fair and easier to explain.'),
  ('Are ad rules the same as community guidelines?', 'No. Most platforms have separate ad policies that add extra rules for paid content, so check both before you run a campaign.'),
 ],
 'related': ['moderation', 'shadowban', 'social-media-policy', 'troll', 'algospeak'],
},
{
 'slug': 'community-management',
 'short': 'Community management is talking with your audience on social media: replying to comments and messages and keeping discussions friendly and safe.',
 'body': '''<h2>What is community management?</h2>
<p>Community management is the people side of social media. Publishing posts is half the job. The other half is what happens after: answering comments, replying to messages, welcoming new members, handling complaints and clearing out spam. A community manager makes followers feel heard and helps them connect with the brand and with each other.</p>
<p>It happens wherever your audience gathers. That includes comment sections, direct messages, Facebook groups, Discord servers, LinkedIn groups and replies on X, Threads, Bluesky and Mastodon.</p>
<h2>What a community manager does each day</h2>
<p>The work is a steady loop. You check every channel for new comments and messages, sort them, reply to the ones that need you, hide the spam and pass bigger issues to the right person. Then you look for chances to start conversations of your own.</p>
<figure data-chart="1"></figure>
<p>Most of what comes in falls into a few buckets. The chart below shows a made-up mix for a small online shop over one month. Knowing your own mix tells you where saved replies will help the most.</p>
<figure data-chart="2"></figure>
<h2>Why community management matters</h2>
<ul>
<li><b>Trust.</b> Quick, friendly replies show there are real people behind the brand.</li>
<li><b>Loyalty.</b> Fans who feel noticed tend to stick around and recommend you.</li>
<li><b>Better reach.</b> Active comment threads can signal interest to the feed.</li>
<li><b>Insight.</b> Comments and messages show what people want and where they get stuck.</li>
<li><b>Damage control.</b> A fast, calm reply can stop a small problem from growing.</li>
</ul>
<h2>Community management vs social customer service</h2>
<p>Social customer service focuses on solving problems, such as late orders or login trouble. Community management is wider. It includes support, plus starting conversations, celebrating fans, running events and shaping the culture of a group. In many small teams one person does both, so it helps to know which hat you are wearing for each message. For example, a reply that fixes a broken discount code is customer service. A post that asks followers to share their best weekend project, then features the top answers, is community building.</p>
<h2>How to manage a social media community</h2>
<ol>
<li><b>Set reply goals.</b> Decide how quickly you aim to answer, such as within one business day, and share your hours on your profile.</li>
<li><b>Use one inbox.</b> Bring comments and messages from all networks into one place so nothing gets missed.</li>
<li><b>Write saved replies.</b> Prepare answers to common questions, then add a personal touch each time.</li>
<li><b>Moderate fairly.</b> Hide spam and abuse based on clear community guidelines.</li>
<li><b>Start conversations.</b> Ask questions, run polls and share fan content with credit.</li>
<li><b>Know when to move offline.</b> Take order numbers, addresses and sensitive issues to private messages or email.</li>
<li><b>Share what you learn.</b> Pass common feedback to the product or support team every week.</li>
</ol>
<p>Here is a made-up example. A bike shop gets the same question about tire sizes in its comments every few days. The community manager writes a saved reply, turns the answer into a carousel and pins it to the profile. The question still comes up, but now each reply links to a post that answers it fully, and the carousel itself picks up saves.</p>
<h2>How to measure community management</h2>
<p>Pick a few numbers and track them monthly. Response time shows how fast you reply. Response rate shows how many messages got an answer at all. The share of comments that are questions, praise or complaints tells you how people feel. For groups and servers, watch how many members post, since a big group where nobody talks isn't much of a community. Compare each month with the one before and look for steady gains instead of one-off spikes. Read a sample of your replies each month too. Numbers show speed, but only reading shows whether your answers actually helped.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Deleting fair criticism.</b> It often makes people angrier and draws more attention. Reply calmly and offer to help.</li>
<li><b>Arguing with trolls.</b> Hide or ignore clear abuse instead of feeding it.</li>
<li><b>Sounding like a robot.</b> Saved replies are a starting point. Add a name or a detail that shows a person read the message.</li>
<li><b>Only replying, never starting.</b> A community needs prompts and questions from you too.</li>
<li><b>Letting weekends pile up.</b> If nobody checks on Saturday, set an away message or schedule a short check so Monday isn't a flood.</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'A daily community routine', 'steps': [
   ('Check every channel', 'Comments, messages, mentions and group posts.'),
   ('Sort what came in', 'Questions, praise, complaints and spam.'),
   ('Reply and hide spam', 'Answer what needs you and clear out the junk.'),
   ('Pass on bigger issues', 'Send orders, bugs and refunds to the right person.'),
   ('Start a conversation', 'Post a question, a poll or a fan shout-out.'),
  ]},
  {'type': 'stack', 'title': 'What comes in during a month', 'sub': 'Comments and messages for a small online shop', 'example': True,
   'parts': [('Questions', 44), ('Praise', 26), ('Complaints', 18), ('Spam', 12)],
   'note': 'Made-up numbers. Sort your own inbox for a month to find your mix.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Answer comments and mentions from every channel in one inbox, with suggested replies on paid plans.'},
  {'name': 'Notion', 'url': 'https://www.notion.so/', 'domain': 'notion.so', 'line': 'A shared workspace for saved replies and notes on the questions people ask most.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for logging response times and sorting messages by type each month.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('What does a community manager do?', 'A community manager replies to comments and messages, moderates discussions, starts conversations and shares audience feedback with the rest of the company.'),
  ('How fast should brands reply on social media?', 'As fast as you can manage well. Many teams aim for replies within a few hours or by the next business day, and share their support hours on their profile.'),
  ('Is community management the same as social media management?', 'They overlap. Social media management often covers planning and posting, while community management focuses on conversations with the audience.'),
  ('Should I reply to every comment?', 'Reply to every question and complaint, and to as many other comments as you can. A like or short reply on the rest still shows people you are listening.'),
  ('How do I handle a negative comment?', 'Reply calmly, thank the person and offer to help, moving to private messages if details are needed. Hide or report comments that are abusive or spam.'),
 ],
 'related': ['moderation', 'social-customer-service', 'direct-message', 'troll', 'engagement'],
},
{
 'slug': 'content-calendar',
 'short': 'A content calendar is a schedule of planned social media posts showing what will go out, on which channel, on which day and at what time.',
 'body': '''<h2>What is a content calendar?</h2>
<p>A content calendar is your plan for what to post and when. It can be a spreadsheet, a shared document, a wall planner or the calendar view in a scheduling tool. Each entry usually lists the date, time, network, topic, format, caption, media, owner and status, such as draft, in review or scheduled.</p>
<p>Some teams plan a week ahead. Others sketch a full season of campaigns, then fill in the details as dates get closer. Both are content calendars. What matters is that everyone can see what is coming and who is doing it.</p>
<p>The calendar also works as a record. Months later, you can look back and see exactly what went out during a launch, which makes the next launch easier to plan.</p>
<h2>Why a content calendar matters</h2>
<ul>
<li><b>Consistency.</b> You post on a steady rhythm instead of in random bursts.</li>
<li><b>Less stress.</b> No more daily scramble to think of something to post.</li>
<li><b>Balance.</b> You can see at a glance whether you cover all your content pillars.</li>
<li><b>Teamwork.</b> Everyone knows what is coming, who owns it and what needs review.</li>
<li><b>Big moments.</b> Launches, sales and holidays get planned early instead of rushed.</li>
</ul>
<h2>How to build a content calendar step by step</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Set your goals.</b> Decide what you want social media to do this month, such as grow an email list or fill seats at an event.</li>
<li><b>Choose your channels.</b> Only include the networks you can keep up with.</li>
<li><b>Pick a posting frequency.</b> Set a realistic number of posts per week for each channel.</li>
<li><b>Mark key dates.</b> Add launches, sales, holidays, industry events and anything else that matters to your audience.</li>
<li><b>Fill in your pillars.</b> Spread topics across the week so the feed stays varied.</li>
<li><b>Add details and owners.</b> Assign each post to someone and track its status.</li>
<li><b>Review results.</b> At the end of each month, check what worked and adjust the next plan.</li>
</ol>
<h2>What a week can look like</h2>
<p>Here is a made-up plan for a small skincare brand posting to Instagram, TikTok and LinkedIn. Monday is a tip, Tuesday a customer story, Wednesday a product close-up and Thursday a behind-the-scenes clip from the lab. Friday is lighter, with a poll or a meme. The weekend gets one post each day, since the team found fewer of its followers engage then.</p>
<figure data-chart="2"></figure>
<p>Your own rhythm should come from your data. Check when your audience is online and how often you can post without the quality dropping. Fewer good posts beat a full calendar of rushed ones.</p>
<h2>Content calendar vs editorial calendar</h2>
<p>An editorial calendar often covers longer content, such as blog posts, newsletters and videos, and may plan months ahead. A social media content calendar focuses on posts across networks and tends to change more often. Many teams link the two, so each new article or video gets matching social posts on the days after it goes live. For example, a made-up travel blog publishes one long guide each week. The editorial calendar holds the guide. The content calendar holds the six social posts that point to it over the next ten days.</p>
<figure data-chart="3"></figure>
<h2>Tips for keeping it alive</h2>
<ul>
<li>Color-code posts by pillar or campaign so you can spot gaps fast.</li>
<li>Keep a running ideas list next to the calendar, so empty slots fill quickly.</li>
<li>Hold a short weekly check-in to move, cut or add posts.</li>
<li>Save your best posts as evergreen content you can bring back later.</li>
<li>Add the links and UTM tags to each entry so nobody has to hunt for them on posting day.</li>
</ul>
<p>When you review the month, look at more than likes. Note which days and formats brought the most reach, saves and clicks, and move your strongest ideas into those slots next time.</p>
<h2>Common mistakes</h2>
<p>The most common mistake is planning so tightly that there is no room to react. Leave a few open slots each week for news and fast-moving trends. Another is building a beautiful calendar and then never updating it. Treat it as a living plan. Filling every slot with promotion is a third trap. Mix in tips, stories and fun posts so people want to follow you between sales. Finally, don't plan more than your team can make. A calendar that keeps slipping is worse than a smaller one you hit every week.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Building a content calendar', 'steps': [
   ('Set goals', 'What should social media do for you this month?'),
   ('Pick channels and frequency', 'Only the networks you can keep up with.'),
   ('Mark key dates', 'Launches, sales, holidays and events.'),
   ('Fill in your pillars', 'Spread topics across the week.'),
   ('Assign owners', 'Each post gets a person and a status.'),
   ('Review each month', 'Keep what worked and change the rest.'),
  ]},
  {'type': 'columns', 'title': 'Posts planned per day', 'sub': 'One week for a small brand across three networks', 'example': True,
   'rows': [('Mon', 3, '3'), ('Tue', 3, '3'), ('Wed', 3, '3'), ('Thu', 3, '3'), ('Fri', 2, '2'), ('Weekend', 2, '2')],
   'labels': 'all', 'unit': 'Posts', 'note': 'Made-up plan. Base yours on when your audience is online.'},
  {'type': 'versus', 'title': 'Content calendar vs editorial calendar', 'cols': ('Content calendar', 'Editorial calendar'), 'rows': [
   ('Covers', 'Social posts on each network', 'Blog posts, newsletters and videos'),
   ('How far ahead', 'Days to weeks', 'Weeks to months'),
   ('Changes often', True, 'Less often'),
   ('Lists the network and format', True, 'Sometimes'),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'See every planned post for every network on one calendar and schedule them from there.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet that works as a simple content calendar for small teams.'},
  {'name': 'Notion', 'url': 'https://www.notion.so/', 'domain': 'notion.so', 'line': 'A workspace for keeping post ideas, drafts and notes next to your plan.'},
 ],
 'list': 'social-media-scheduling-apps',
 'faqs': [
  ('What should be included in a social media content calendar?', 'Include the date and time, network, topic, format, caption, media, owner and status for each post. Add campaign names and links if you track them.'),
  ('How far ahead should I plan social media content?', 'Many teams plan the big picture a month or more ahead and finish posts one to two weeks before they go out.'),
  ('Can I use a spreadsheet as a content calendar?', 'Yes. A spreadsheet works well for small teams. Scheduling tools add a visual calendar and can publish posts for you.'),
  ('How often should I update my content calendar?', 'Look at it every week to move or add posts, and review it fully each month against your results.'),
  ('What is the difference between a content calendar and a posting schedule?', 'A posting schedule says when you post, such as weekdays at noon. A content calendar also says what you post, where, in which format and who owns it.'),
 ],
 'related': ['social-media-scheduling', 'content-pillars', 'batching', 'posting-frequency', 'bulk-scheduling'],
},
{
 'slug': 'content-creator',
 'short': 'A content creator is a person who makes and publishes videos, posts, photos, podcasts or writing online, often building an audience around a topic.',
 'body': '''<h2>What is a content creator?</h2>
<p>A content creator is anyone who regularly makes content for an online audience. That includes YouTubers, TikTokers, podcasters, newsletter writers, streamers, photographers and bloggers. Some create as a hobby. Others turn it into a full-time job. Many work alone, filming, editing, writing and posting everything themselves.</p>
<p>Brands also hire creators to make posts for the brand's own accounts. This is often called UGC creation, since the content looks like it came from a regular customer. A UGC creator may have very few followers and still find steady work, because the brand pays for the content itself.</p>
<h2>Content creator vs influencer</h2>
<p>The words overlap a lot. A content creator is defined by what they make. An influencer is defined by the effect they have on what their audience buys or believes, often through brand deals. Many creators are also influencers. Some creators make great content without a big following or any sponsors, and some influencers are known more for their lifestyle than for the content itself. If you want brand deals, it helps to be both: make content people value, and build enough trust that your recommendations count.</p>
<figure data-chart="1"></figure>
<h2>What a content creator does</h2>
<p>The posting is only the part people see. Behind it sits a weekly cycle of finding ideas, planning, filming or writing, editing, publishing, replying and checking results. Full-time creators also handle the business side: pitching brands, signing contracts, sending invoices and keeping track of taxes. Many say the business work takes as much time as the creative work.</p>
<p>The gear can be simple. Many creators start with a phone, a clip-on microphone and a window for light. Better tools help later, but steady posting and clear ideas matter more at the start.</p>
<h2>How content creators make money</h2>
<ul>
<li>Brand sponsorships and paid partnerships</li>
<li>Affiliate links and discount codes</li>
<li>Platform programs that share ad revenue or pay for views</li>
<li>Fan support, such as subscriptions, tips and memberships</li>
<li>Selling their own products, courses or services</li>
<li>Making content for brands to post on their own accounts</li>
</ul>
<p>Most full-time creators mix several of these, so one platform change can't wipe out all their income. Brands often care about how engaged an audience is, so a small, active following can still attract offers. The chart shows a made-up mix for one creator over a year.</p>
<figure data-chart="2"></figure>
<h2>How to become a content creator</h2>
<figure data-chart="3"></figure>
<ol>
<li><b>Pick a niche.</b> Choose a topic you know well and could talk about for a long time.</li>
<li><b>Choose one main platform.</b> Start where your audience spends time and where your skills fit, such as short video or long writing.</li>
<li><b>Post on a schedule.</b> Steady posting helps you improve and helps the feed learn who to show your work to.</li>
<li><b>Study your results.</b> Look at what gets watched, saved and shared, then make more of that.</li>
<li><b>Build real connections.</b> Reply to comments and work with other creators in your space.</li>
<li><b>Reuse your work.</b> Turn one long video into short clips, a carousel and a newsletter.</li>
</ol>
<p>For example, a made-up home cook might start with one recipe video a week on TikTok. After a few months, she notices her budget meals get far more saves than fancy dishes, so she leans into cheap weeknight dinners. That focus is what later brings her first brand deal with a grocery app.</p>
<h2>Tips for staying in it</h2>
<ul>
<li>Batch your filming so you aren't racing to post every day.</li>
<li>Keep a running list of ideas from comments and questions.</li>
<li>Own a way to reach fans directly, such as an email list, in case a platform changes its rules.</li>
<li>Take real breaks. Schedule a few posts ahead so the account stays active while you rest.</li>
<li>Keep simple records of income and costs from day one, so tax time isn't a scramble.</li>
</ul>
<h2>Common mistakes</h2>
<p>New creators often try every platform at once and burn out. Start with one and add others when you have a system. Another mistake is copying trends that don't fit your niche, which can bring views without loyal followers. Some creators also undercharge for brand work because they don't know what their time is worth. Track your hours and results so you can price with confidence. Finally, be honest with your audience. Disclose sponsored posts and only recommend products you'd stand behind, since trust is the thing that keeps people coming back.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Content creator vs influencer', 'cols': ('Content creator', 'Influencer'), 'rows': [
   ('Defined by', 'What they make', 'Who they sway'),
   ('Needs a big following', False, 'Usually'),
   ('Main income', 'Many sources', 'Often brand deals'),
   ('Can make content for brand accounts', True, 'Sometimes'),
   ('Can be the same person', True, True),
  ]},
  {'type': 'stack', 'title': "One creator's income mix", 'sub': 'Share of a year\'s income by source', 'example': True,
   'parts': [('Brand deals', 40), ('Own products', 25), ('Affiliate links', 20), ('Platform payouts', 15)],
   'note': 'Made-up numbers. Every creator\'s mix is different.'},
  {'type': 'steps', 'title': 'Getting started as a creator', 'steps': [
   ('Pick a niche', 'A topic you know and could talk about for years.'),
   ('Choose one platform', 'Where your audience is and your skills fit.'),
   ('Post on a schedule', 'A pace you can keep for months.'),
   ('Study your results', 'Make more of what people watch and save.'),
   ('Reuse your work', 'Turn one piece into several formats.'),
  ]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan and schedule your posts for 12 networks from one calendar.'},
  {'name': 'CapCut', 'url': 'https://www.capcut.com/', 'domain': 'capcut.com', 'line': 'A video editor for cutting clips and adding text, music and captions.'},
  {'name': 'Canva', 'url': 'https://www.canva.com/', 'domain': 'canva.com', 'line': 'A design tool for thumbnails, carousels and post graphics.'},
 ],
 'faqs': [
  ('What does a content creator do?', 'A content creator plans, makes and publishes content such as videos, posts or podcasts, then engages with the audience that follows it.'),
  ('Do you need a lot of followers to be a content creator?', 'No. Anyone who makes and shares content is a creator. A larger audience can bring more paid chances, but many creators start with very few followers.'),
  ('What is a UGC creator?', 'A UGC creator makes videos or photos for brands that look like everyday customer content. The brand usually posts it on its own accounts or uses it in ads.'),
  ('What is the difference between a creator and an influencer?', 'A creator is defined by the content they make. An influencer is defined by how much they sway their audience, often through brand deals. One person can be both.'),
  ('Which platform should a new creator start on?', 'Start where your audience already spends time and where your skills fit. Short video suits people who like being on camera, while newsletters and blogs suit writers.'),
 ],
 'related': ['influencer', 'creator-economy', 'monetization', 'niche', 'user-generated-content'],
},
{
 'slug': 'content-pillars',
 'short': 'Content pillars are the three to five core topics a brand or creator posts about again and again, giving the feed focus and making planning easier.',
 'body': '''<h2>What are content pillars?</h2>
<p>Content pillars are the main themes your social media content is built on. Each pillar is a broad topic that matters to your audience and ties back to your goals. Every post you make should fit under one of them. Think of them as the shelves in a shop: each post goes on a shelf, and people learn where to find what they like.</p>
<p>For example, a home fitness coach might use four pillars: quick workouts, simple meals, client wins and mindset tips. A software company might pick product tips, customer stories, industry news and a look behind the scenes at the team.</p>
<h2>Why content pillars matter</h2>
<ul>
<li><b>Focus.</b> People learn what to expect from you and follow for those topics.</li>
<li><b>Faster planning.</b> You start every week with a list of themes instead of a blank page.</li>
<li><b>Balance.</b> You avoid posting only promotions or only one kind of post.</li>
<li><b>Clearer results.</b> You can compare pillars in your analytics and do more of what works.</li>
<li><b>Easier team work.</b> Writers, designers and helpers all know what fits the brand.</li>
</ul>
<h2>How to choose your content pillars</h2>
<ol>
<li><b>Start with your audience.</b> List the problems and questions your followers have.</li>
<li><b>Look at your goals.</b> Think about what you want people to know, feel or do.</li>
<li><b>Find the overlap.</b> Pick topics that serve both your audience and your goals.</li>
<li><b>Check your past posts.</b> Your best performers often point to a strong pillar.</li>
<li><b>Keep it small.</b> Most accounts do well with three to five pillars. Beyond that, focus slips.</li>
<li><b>Name them.</b> Give each pillar a simple label so the whole team uses the same words.</li>
</ol>
<p>For example, a made-up dog trainer lists the questions clients ask most. Nearly all of them fall into four groups: puppy basics, leash manners, fixing bad habits and life with a rescue dog. Those four groups become her pillars, and every post idea she writes down goes under one of them.</p>
<h2>How to balance your pillars</h2>
<p>Pillars don't need equal time. Give the most room to the ones that build trust, and keep promotion to a smaller slice so your feed doesn't feel like an ad. Here is a made-up mix for a small skincare brand.</p>
<figure data-chart="1"></figure>
<p>Assign each pillar a share of your posts, then map it onto your content calendar. Some people tie pillars to days, such as "Tip Tuesday" or "Customer Friday." Mix formats inside each pillar too. A pillar about recipes can hold a Reel, a carousel, a quick text tip and a Story poll.</p>
<h2>How to measure each pillar</h2>
<p>Tag every post with its pillar in your calendar or spreadsheet. At the end of each month, average the engagement, reach and clicks for each one. You will often find that one pillar earns the most saves, another brings more comments and a third drives the clicks that lead to sales. Each can earn its place for a different reason. Look at two or three months before you drop a pillar, since one slow month can be bad luck.</p>
<figure data-chart="2"></figure>
<p>In this made-up example, tutorials earn the highest engagement rate and promotions the lowest. The brand keeps promoting anyway, because the tutorials build the trust that makes the promotions work. The useful move is to make promotions feel more like tutorials, such as showing a product in use.</p>
<h2>Content pillars vs content series</h2>
<p>People use the terms loosely. In general, pillars are the big themes and series are the repeat formats inside them. "Simple meals" is a pillar. "Five-minute breakfast videos every Monday" is a series inside it. A pillar can hold several series, and a series makes a pillar easier to plan, because you already know the shape of the post before you start. Series help followers too. When they know a new breakfast video lands every Monday, they come back for it.</p>
<h2>Common mistakes</h2>
<ul>
<li><b>Pillars that are too broad.</b> "Lifestyle" gives you no real focus.</li>
<li><b>Pillars that are too narrow.</b> You run out of ideas within a month.</li>
<li><b>Never reviewing them.</b> As your business and audience change, swap out a pillar that no longer fits.</li>
<li><b>Forgetting your goals.</b> A pillar people love that never connects to what you sell may need a new angle.</li>
<li><b>Keeping them in your head.</b> Write the pillars down where your whole team can see them.</li>
</ul>''',
 'charts': [
  {'type': 'stack', 'title': "One brand's pillar mix", 'sub': 'Share of posts in a month', 'example': True,
   'parts': [('Tutorials', 40), ('Behind the scenes', 25), ('Customer stories', 20), ('Promotions', 15)],
   'note': 'Made-up mix for a small skincare brand.'},
  {'type': 'columns', 'title': 'Engagement rate by pillar', 'sub': 'Average over one month', 'example': True,
   'rows': [('Tutorials', 4.8, '4.8%'), ('Behind the scenes', 3.1, '3.1%'), ('Customer stories', 3.6, '3.6%'), ('Promotions', 1.4, '1.4%')],
   'highlight': 'Tutorials', 'labels': 'all', 'unit': 'Engagement rate', 'note': 'Made-up numbers for one account. Your pillars will rank differently.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar AI agent', 'url': '/#agents', 'line': 'An AI agent that plans and writes posts as drafts for you to review, on paid plans.'},
  {'name': 'Notion', 'url': 'https://www.notion.so/', 'domain': 'notion.so', 'line': 'A workspace for writing down your pillars and the post ideas under each one.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for tagging posts by pillar and comparing their results.'},
 ],
 'faqs': [
  ('How many content pillars should I have?', 'Most brands and creators use three to five. That is enough for variety without losing focus.'),
  ('What are examples of content pillars?', 'Common pillars include education, behind the scenes, customer stories, product tips, community and industry news. The right ones depend on your audience and goals.'),
  ('Can content pillars change?', 'Yes. Review them every few months and update them if your goals or audience change.'),
  ('Should every pillar get the same number of posts?', 'No. Give more room to the pillars that build trust and keep promotion to a smaller share. Adjust the mix based on your results.'),
  ('How do I track which pillar performs best?', 'Tag each post with its pillar, then average engagement, reach and clicks for each pillar at the end of the month.'),
 ],
 'related': ['content-calendar', 'brand-voice', 'niche', 'target-audience', 'batching'],
},
]
