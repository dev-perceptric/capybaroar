# Upgraded glossary entries, batch 1 (see v2_0.py for the model).
TERMS = []

TERMS += [
{
 'slug': 'a-b-testing',
 'short': "A/B testing is comparing two versions of a post or ad that differ in one detail to see which one performs better with your audience.",
 'body': '''<h2>What is A/B testing?</h2>
<p>A/B testing means you make two versions of the same post or ad and change just one part. Version A might open with a question. Version B might open with a bold claim. You show each version to a similar group of people, then compare the results to see which one did better on the goal you picked.</p>
<p>You can test almost anything on social media: a caption, a thumbnail, a hook, a call to action, a posting time or an ad image. The rule that matters most is to change a single thing at a time. If you swap the image and the caption together, you won't know which change made the difference.</p>
<h2>Why A/B testing matters</h2>
<p>Guessing is easy, and it is often wrong. A headline you love may leave your audience cold. A test gives you an answer from the people you actually want to reach.</p>
<p>Small wins also stack up. A slightly better hook can lift watch time on every video you post after that. A clearer call to action can bring more clicks on every link you share for the rest of the year. One test takes a week or two. The lesson lasts much longer.</p>
<h2>How to run an A/B test on social media</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Pick one goal.</b> Decide what counts as a win before you start, such as link clicks, saves or a higher engagement rate. Picking the goal after you see the numbers makes it far too easy to fool yourself.</li>
<li><b>Choose one thing to change.</b> Write version A and version B so they match in every way except that one part.</li>
<li><b>Keep conditions fair.</b> Post at similar times on similar days, or use the split test option in an ad platform, which shows each version to a separate group.</li>
<li><b>Wait for enough data.</b> A few dozen views can swing either way by chance. Let both versions collect a fair number of impressions before you judge.</li>
<li><b>Write down the result.</b> Keep a simple log with the date, what you changed and what happened, so you can plan the next test.</li>
</ol>
<h2>How to read your results</h2>
<p>Compare rates instead of raw counts. For example, say version A got 300 clicks from 20,000 impressions and version B got 250 clicks from 10,000 impressions. Version B is the stronger one, even though A has more clicks, because B turned a bigger share of its views into clicks. Divide each result by the views it had, then compare.</p>
<figure data-chart="2"></figure>
<p>Look at the size of the gap too. If one version wins by a tiny margin, treat it as a tie and run the test again. A real winner usually shows the same lead when you repeat it. Ad platforms often give you a confidence score for split tests. With organic posts you have to judge it yourself, so a repeat test is your best check.</p>
<h2>Organic tests vs ad tests</h2>
<p>Ad platforms can split an audience for you, so each person sees only one version. That makes ad tests cleaner and faster. You also set the budget, so both versions get a similar number of views.</p>
<p>With organic posts, you can't control who sees what. You post one version, then the other, and compare. News, holidays and the day of the week can all sway the numbers. Some creators test hooks by posting two short videos with different openings a week apart, then compare how many viewers kept watching past the first few seconds. Repeat an organic test a few times before you trust it.</p>
<figure data-chart="3"></figure>
<h2>Ideas worth testing</h2>
<ul>
<li>A question hook against a bold statement hook</li>
<li>A face in the thumbnail against a product shot</li>
<li>A short caption against a long, story-style caption</li>
<li>"Shop now" against "See the full range" as a call to action</li>
<li>A carousel against a single image with the same content</li>
</ul>
<p>Start with the parts people see first. The hook, the thumbnail and the first line decide whether anyone reads the rest, so a win there helps every other part of the post.</p>
<h2>Common mistakes</h2>
<ul>
<li>Changing several things at once, so the result can't teach you anything</li>
<li>Calling a winner after one day</li>
<li>Comparing a Monday morning post with a Saturday night post</li>
<li>Measuring likes when the real goal is clicks</li>
<li>Running a test and then never using what you learned</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'An A/B test in five steps', 'steps': [
   ('Pick the goal', 'Choose the one number that decides the winner, such as clicks or saves.'),
   ('Change one thing', 'Make two versions that match except for one part.'),
   ('Show both fairly', 'Use an ad split test, or post organic versions at similar times.'),
   ('Wait for data', 'Let each version collect enough views before you compare.'),
   ('Log and repeat', 'Write down the result, then test the next idea.')]},
  {'type': 'bars', 'title': 'Version B wins on click-through rate', 'sub': 'Version A has more clicks, but B turns more of its views into clicks', 'example': True,
   'rows': [('Version A (300 clicks from 20,000 views)', 1.5, '1.5%'), ('Version B (250 clicks from 10,000 views)', 2.5, '2.5%')], 'highlight': 'Version B (250 clicks from 10,000 views)', 'unit': 'Click-through rate',
   'note': 'Made-up numbers to show why you compare rates.'},
  {'type': 'versus', 'title': 'Organic test vs ad test', 'cols': ('Organic test', 'Ad test'), 'rows': [
   ('Each person sees only one version', False, True),
   ('Costs money', False, True),
   ('You control how many views each gets', False, True),
   ('Speed', 'Slower, repeat a few times', 'Faster'),
   ('Good for', 'Hooks, captions, formats', 'Images, headlines, offers')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': "Compare reach and engagement for each version of a post across every channel you run."},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': "Tag each version's link so your website analytics shows which one sent the visits."},
  {'name': 'Meta Ads Manager', 'url': 'https://www.facebook.com/business/tools/ads-manager', 'domain': 'facebook.com', 'line': "Meta's tool for building and running ads on Facebook and Instagram."},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for keeping a log of every test and its result.'},
 ],
 'faqs': [
  ("What is an example of A/B testing on social media?", "You could post the same video twice with two different opening lines and compare watch time. Or you could run an ad with two images and see which one gets a higher click-through rate."),
  ("How long should an A/B test run?", "Run it until each version has enough views to show a clear gap. For a small account, that can take several posts over a few weeks."),
  ("Can you A/B test organic posts?", "Yes, though it is less exact than an ad test. Post each version at similar times and repeat the test before you act on the result."),
  ("What is the difference between A/B testing and multivariate testing?", "An A/B test changes one thing between two versions. A multivariate test changes several things at once and compares the combinations, which needs far more traffic."),
  ("Should I compare likes or clicks?", "Compare the number tied to your goal. If you want website visits, judge the test on clicks, even if the other version got more likes."),
 ],
 'related': ['engagement-rate', 'click-through-rate', 'analytics', 'hook', 'caption'],
},
{
 'slug': 'affiliate-marketing',
 'short': "Affiliate marketing is when you earn a commission on sales that come through your own tracking link or code for another company's product.",
 'body': '''<h2>What is affiliate marketing?</h2>
<p>Affiliate marketing is a deal between a brand and a person who promotes it. The brand gives you a special link or discount code. When someone buys through that link or uses that code, the brand pays you a share of the sale. That share is called a commission.</p>
<p>On social media, affiliates are often creators who talk about products they already use. A cooking account might link to a favorite knife. A tech reviewer might share a code for a microphone. The audience gets a recommendation, the brand gets a sale and the creator gets paid for the help.</p>
<h2>How affiliate marketing works</h2>
<ol>
<li>You join a brand's affiliate program, or a network that lists many programs in one place.</li>
<li>You get a unique link or code that tracks the people you send.</li>
<li>You share it in posts, videos, Stories or your link in bio.</li>
<li>A follower clicks and buys within the tracking window the program sets, such as a set number of days.</li>
<li>The program records the sale and pays your commission on its schedule.</li>
</ol>
<p>Most people who see your post will never click, and most who click won't buy. That is normal. What matters is the share that moves from one step to the next, and which posts move the most people.</p>
<figure data-chart="1"></figure>
<h2>Affiliate marketing vs sponsored content</h2>
<p>With sponsored content, a brand usually pays you a set fee to make a post, whatever happens next. With affiliate marketing, you get paid only when your audience takes action, usually a purchase. Many creators mix both. A brand might pay a small fee for a video and add an affiliate code so the creator also earns on sales.</p>
<p>Each model fits a different kind of post. A sponsored post suits a launch where the brand wants many people to see something new. An affiliate link suits evergreen content that people find for months, such as a "what's in my camera bag" video or a pinned guide. If you are new, affiliate links are easier to start with, because many programs accept anyone who applies and follows the rules.</p>
<figure data-chart="2"></figure>
<h2>How to pick affiliate programs</h2>
<p>Start with what you already own and talk about. Look at your last few months of posts and list every product that came up. Those are your best bets, since you can speak about them with real detail. Then check each program's terms: how long the tracking window lasts, when payouts happen and what kinds of promotion it allows.</p>
<p>Fit matters more than the size of the commission. A high rate on a product your audience doesn't need earns nothing. A modest rate on something they ask you about every week can add up over time.</p>
<h2>How to promote affiliate links on social media</h2>
<ul>
<li><b>Show the product in action.</b> A short demo, a before and after or an honest review works better than a plain link.</li>
<li><b>Match the network.</b> Short video apps suit quick demos. Pinterest suits pins that lead to a guide. YouTube descriptions can hold several links with notes. Some networks limit links in captions, so a link in bio page often does the heavy lifting.</li>
<li><b>Tell people it is an affiliate link.</b> Most platforms and many countries require a clear disclosure, such as "I earn a commission if you buy." Put it near the top where people will see it.</li>
<li><b>Answer questions.</b> Comments like "does it fit a small kitchen?" are buying signals. A quick, honest reply can be worth more than the post itself.</li>
</ul>
<h2>How to track your results</h2>
<p>Use the program's dashboard to see clicks and sales for each link. If you share the same link in many places, add UTM parameters or make a separate link for each channel, so you can tell whether TikTok or your newsletter sent the sale. Check results monthly. One post rarely tells the full story, but a few months of data shows which products and formats earn for you.</p>
<p>Keep a simple sheet with the product, the post, the date and the sales that followed. Over time you'll spot patterns, such as reviews beating hauls, or tutorials earning long after the post went up.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting so many links that your feed starts to feel like an ad</li>
<li>Hiding the disclosure at the end of a long caption</li>
<li>Pushing a product you have never used</li>
<li>Skipping the program rules, some of which ban certain ad types or coupon sites and can cost you your earnings</li>
</ul>''',
 'charts': [
  {'type': 'funnel', 'title': 'From post to commission', 'sub': 'How one affiliate post might turn views into sales', 'example': True,
   'stages': [('Saw the post', 20000, '20,000'), ('Clicked the link', 600, '600'), ('Bought', 18, '18')], 'unit': 'People',
   'note': 'Made-up numbers for one post. Your rates will differ.'},
  {'type': 'versus', 'title': 'Affiliate marketing vs sponsored content', 'cols': ('Affiliate', 'Sponsored'), 'rows': [
   ('Paid when people buy', True, False),
   ('Paid a set fee for the post', False, True),
   ('Needs a tracking link or code', True, False),
   ('Needs a clear disclosure', True, True),
   ('Can keep earning after the post', True, False)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'Put all your affiliate links on one page and point every profile to it.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free tool adds tracking tags so you can see which channel sent each sale.'},
  {'name': 'Bitly', 'url': 'https://bitly.com', 'domain': 'bitly.com', 'line': 'A link shortener that counts the clicks on each short link.'},
 ],
 'faqs': [
  ("Can you do affiliate marketing on social media without a website?", "Yes. Many creators share affiliate links in captions, Stories, video descriptions or a link in bio page. Check each program's terms, since some ask how you plan to promote them."),
  ("Do you have to disclose affiliate links?", "In most cases, yes. Platform rules and advertising laws in many countries require you to tell people when you earn money from a link or code."),
  ("How do affiliates get paid?", "The program tracks sales from your link or code and pays a commission on a set schedule, often once a month after a minimum balance is reached."),
  ("Do I need a big following to be an affiliate?", "No. Smaller accounts with a clear niche can do well, because their followers trust their picks. What matters is that your audience wants the product."),
 ],
 'related': ['influencer-marketing', 'link-in-bio', 'sponsored-content', 'monetization', 'utm-parameters'],
},
{
 'slug': 'ai-agent',
 'short': "An AI agent is software built on an AI model that can plan steps and use tools to finish a task for you, such as drafting and scheduling posts.",
 'body': '''<h2>What is an AI agent?</h2>
<p>An AI agent is a program that takes a goal and works toward it by itself, step by step. A plain chatbot answers one message at a time. An agent can break a job into smaller tasks, use tools along the way and check its own work before it hands you the result.</p>
<p>Tools are what make an agent useful. A tool might let it read your calendar, search the web, pull your post stats or save a draft in your scheduler. The AI model decides which tool to use and when. You set the goal and the limits.</p>
<h2>How an AI agent works</h2>
<p>Most agents follow the same loop. They look at the goal, decide on a next step, take it, look at what happened and decide again. That loop keeps going until the job is done or the agent needs you.</p>
<figure data-chart="1"></figure>
<p>Here is a made-up example. You ask an agent to "plan next week's posts for our bakery." It reads your last month of posts and sees that photos of fresh bread did well. It checks your calendar and finds a farmers market on Saturday. It writes five drafts, one of them a market reminder, and suggests times based on when your followers are active. Then it stops and asks you to review before anything is scheduled.</p>
<h2>What AI agents can do for social media</h2>
<ul>
<li>Turn a blog post or video into short posts for several networks</li>
<li>Draft replies to common questions in comments or messages</li>
<li>Sum up which posts did well last month and why</li>
<li>Fill gaps in a content calendar with ideas that match your pillars</li>
<li>Rewrite a caption to fit a shorter limit, such as 280 characters for a standard X post or 300 for Bluesky</li>
<li>Spot posts that are missing alt text or a link before they go out</li>
</ul>
<p>The best jobs for an agent are the ones you already do the same way each week. If you can write the steps on a sticky note, an agent can probably follow them. Jobs that need taste, fresh facts or a delicate reply are better left with a person, with the agent helping on research or a first draft.</p>
<h2>AI agent vs AI chatbot</h2>
<p>A chatbot waits for your next message. An agent keeps going until the task is done or it needs your input. A chatbot can write a caption when you ask. An agent can write the caption, attach the image, pick a time slot and send the post to your approval queue.</p>
<figure data-chart="2"></figure>
<p>The line between the two is blurry. Many chat assistants can act as agents once you connect them to tools. That is what protocols such as MCP are for: they let an assistant like Claude or ChatGPT reach outside software and take real actions there.</p>
<h2>How to set up an agent for your team</h2>
<ol>
<li><b>Start with one job.</b> Pick a task that repeats every week, such as drafting posts from new blog articles.</li>
<li><b>Write clear instructions.</b> Describe your audience, your brand voice and a few posts you liked. Add words you never use.</li>
<li><b>Limit its access.</b> Connect only the accounts and data the job needs.</li>
<li><b>Keep a review step.</b> Have the agent save drafts, and let a person approve before anything goes live.</li>
<li><b>Check the output for a few weeks.</b> Note what you change each time and add those notes to its instructions.</li>
</ol>
<h2>How to use an AI agent safely</h2>
<p>Treat an agent like a new team member. Give it small tasks first, where a mistake is easy to fix, such as drafts. Read what it writes, since AI models can state wrong facts with confidence. Watch for made-up statistics, wrong dates and links that go nowhere.</p>
<p>Check which accounts and data the agent can reach, and give it only the access it needs. If it can publish, make sure you can see a record of every action it took. Turn off access you no longer use.</p>
<h2>Common mistakes</h2>
<ul>
<li>Letting an agent publish straight away before you trust its work</li>
<li>Giving vague goals like "grow our account," which leads to vague posts</li>
<li>Connecting every account and tool at once</li>
<li>Skipping the edit step, so posts lose the details only your team knows</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'How an AI agent finishes a task', 'steps': [
   ('Get the goal', 'You say what you want done and set the limits.'),
   ('Make a plan', 'The agent decides what it needs to know and in what order.'),
   ('Use tools', 'It reads data, writes drafts and checks your calendar.'),
   ('Check its work', 'It looks at the result and fixes gaps.'),
   ('Hand back', 'It shows you the drafts and waits for your approval.')]},
  {'type': 'versus', 'title': 'AI agent vs AI chatbot', 'cols': ('AI agent', 'Chatbot'), 'rows': [
   ('Works across several steps on its own', True, False),
   ('Uses tools like your calendar or scheduler', True, 'Only if connected'),
   ('Waits for your next message', False, True),
   ('Can save drafts for review', True, False),
   ('Writes a caption when asked', True, True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar AI agent', 'url': '/#agents', 'line': 'Plans and writes posts for your channels and saves them as drafts for you to review, on paid plans.'},
  {'id': 'capybaroar', 'name': 'Capybaroar MCP', 'url': '/mcp', 'line': 'Connect Claude, ChatGPT or Cursor to your Capybaroar account, on every plan.'},
  {'name': 'Claude', 'url': 'https://claude.ai', 'domain': 'claude.ai', 'line': "Anthropic's AI assistant for writing, research and working with connected tools."},
  {'name': 'ChatGPT', 'url': 'https://chatgpt.com', 'domain': 'chatgpt.com', 'line': "OpenAI's AI assistant for writing, questions and working with connected apps."},
 ],
 'list': 'ai-social-media-scheduling-tools',
 'faqs': [
  ("What is the difference between an AI agent and ChatGPT?", "A chat assistant answers your messages one at a time. An AI agent is set up to pursue a goal across several steps and use tools, such as reading data or saving drafts, along the way. Chat assistants can also act as agents when they are given tools."),
  ("Can an AI agent post on social media for me?", "It can if the software gives it access to your accounts. Many teams keep an approval step so a person checks each post before it goes live."),
  ("Are AI agents safe to use for business accounts?", "They can be, with limits. Give the agent only the access it needs, keep a review step and read its work before it goes public."),
  ("What is MCP and how does it relate to AI agents?", "MCP, the Model Context Protocol, is a standard way for AI assistants to use outside tools. It lets an assistant act like an agent inside software you already use."),
 ],
 'related': ['ai-generated-content', 'mcp', 'api', 'approval-workflow', 'social-media-management-tool'],
},
{
 'slug': 'ai-generated-content',
 'short': "AI-generated content is text, images, audio or video made fully or partly by an AI model from a prompt or other input.",
 'body': '''<h2>What is AI-generated content?</h2>
<p>AI-generated content is anything an AI tool creates for you. You type a request, called a prompt, and the tool writes a caption, makes an image, clones a voice or builds a short video. Sometimes the AI makes the whole thing. More often, a person writes a draft and the AI helps edit or translate it.</p>
<p>On social media, people use AI to brainstorm post ideas, write first drafts of captions, resize images, add subtitles to videos and answer common questions. Used well, it saves hours each week. Used carelessly, it fills feeds with bland posts that sound like everyone else.</p>
<h2>Why AI-generated content matters</h2>
<p>AI tools make it fast to produce a lot of content. That is useful when you post on many networks with different limits and styles. It also raises the bar. If anyone can make a passable post in seconds, people start to reward posts with real knowledge, a clear point of view and honest details.</p>
<p>Your experience and opinions are the parts AI can't supply. The tool doesn't know what your customers asked last week or why your team changed a recipe. Those details are what make a post worth reading.</p>
<p>Images and video add another layer. AI can make a picture of a product that doesn't exist yet, or a crowd at an event that never happened. That can mislead people even when you mean no harm, so think about what a viewer will believe after seeing it.</p>
<h2>How to use AI-generated content well</h2>
<p>The safest setup keeps a person at both ends. You bring the idea and the facts. The AI does the first draft. You edit and approve.</p>
<figure data-chart="1"></figure>
<ol>
<li><b>Start with your own idea.</b> Give the tool your topic, your angle, your audience and a few facts only you know.</li>
<li><b>Feed it your brand voice.</b> Share sample posts and a short list of words you use and avoid.</li>
<li><b>Ask for options.</b> Request several hooks or openings, then pick the one that sounds most like you.</li>
<li><b>Edit every draft.</b> Cut filler and fix facts. Then add a personal detail or example.</li>
<li><b>Check images closely.</b> Look for odd hands, warped text, strange shadows and details that could mislead.</li>
<li><b>Follow labeling rules.</b> Many platforms ask you to label realistic AI images, video or audio, especially of real people or events.</li>
</ol>
<h2>What a good edit looks like</h2>
<p>Here is a made-up example. An AI draft for a bike shop says: "Discover the joy of cycling with our amazing range of bikes for every rider!" It is fine and forgettable. After an edit, it reads: "Mia rode her first 20 km on Saturday on a bike we fitted in ten minutes. Want the same fit? Drop in before noon." The second version has a name, a number and a clear next step. The shop supplied those. The tool could never guess them.</p>
<figure data-chart="2"></figure>
<h2>Where AI helps most, and where it doesn't</h2>
<p>AI is strong at the parts of the job that repeat. It can turn one long video into several short captions, rewrite a post to fit a 300 character Bluesky limit, suggest hashtags or translate a post for another market. It is also handy for writing alt text drafts that you then check.</p>
<p>It is weak at anything that needs fresh facts, taste or trust. It can invent statistics, quote people who never said a thing and miss a joke your audience would get at once. Replies to upset customers, posts about sensitive news and anything legal deserve a person from start to finish.</p>
<h2>Is AI-generated content bad for reach?</h2>
<p>Platforms mostly rank posts on how people respond to them. A helpful AI-assisted post can do well. A generic one usually won't, because people scroll past it. Some platforms may also limit content that breaks their rules on misleading media. Use AI as a helper and keep a person in charge of what gets published.</p>
<p>Watch your own numbers to see how AI-assisted posts compare. For a month, mark which posts started as AI drafts and which you wrote from scratch, then compare saves, shares and comments. If the AI drafts lag behind, the fix is usually more editing and more real detail, rather than dropping the tool.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting AI text without reading it, including made-up facts or links</li>
<li>Using the same tone and structure in every post until the feed feels robotic</li>
<li>Making images that look like real people without their consent</li>
<li>Skipping a label when the platform requires one</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Keep a person at both ends', 'steps': [
   ('You bring the idea', 'Topic, angle, audience and facts only you know.'),
   ('AI writes a draft', 'Ask for a few options in your brand voice.'),
   ('You edit', 'Fix facts, cut filler and add a real detail.'),
   ('You check media', 'Look over images and video, and add labels where needed.'),
   ('You approve', 'Only then does the post go into the schedule.')]},
  {'type': 'versus', 'title': 'Raw AI draft vs edited post', 'cols': ('Raw draft', 'Edited post'), 'rows': [
   ('Fast to make', True, True),
   ('Has real names, numbers or stories', False, True),
   ('Facts checked by a person', False, True),
   ('Sounds like your brand', 'Sometimes', True),
   ('Ready to publish', False, True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar AI agent', 'url': '/#agents', 'line': 'Plans and writes posts as drafts, so a person reviews each one before it goes out. On paid plans.'},
  {'name': 'Claude', 'url': 'https://claude.ai', 'domain': 'claude.ai', 'line': "Anthropic's AI assistant for drafting and editing text."},
  {'name': 'ChatGPT', 'url': 'https://chatgpt.com', 'domain': 'chatgpt.com', 'line': "OpenAI's AI assistant for drafting text and images."},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for making and resizing social graphics.'},
 ],
 'list': 'ai-social-media-scheduling-tools',
 'faqs': [
  ("Do I have to label AI-generated content on social media?", "Many platforms ask you to label realistic AI images, video or audio, and some add labels themselves. Rules differ by platform and change over time, so check each network's current policy."),
  ("Can people tell when a post is written by AI?", "Often they can, especially when the post is vague or full of stock phrases. Editing drafts in your own words and adding real details helps."),
  ("Who owns AI-generated content?", "It depends on the tool's terms and the laws where you live. Read the terms of any AI tool you use for business content."),
  ("What should I never hand to AI?", "Keep replies to upset customers, sensitive news and legal topics with a person. AI can also get facts wrong, so check every number and quote it writes."),
 ],
 'related': ['ai-agent', 'brand-voice', 'authenticity', 'content-pillars'],
},
{
 'slug': 'algorithm',
 'short': "An algorithm is the set of rules a social platform uses to decide which posts to show each person and in what order.",
 'body': '''<h2>What is a social media algorithm?</h2>
<p>A social media algorithm is the system that sorts content for you. Each network has far more posts than anyone could read. The algorithm picks which ones land in your feed and your recommendations, then ranks them. Two people who open the same app at the same moment will see different posts.</p>
<p>When people say "the algorithm," they usually mean the ranking system behind a feed such as TikTok's For You page, the Instagram feed or LinkedIn's home feed. Each platform builds its own, and each one changes often. Many apps also run several at once, with one for the main feed, one for short video and one for search.</p>
<h2>How algorithms work</h2>
<p>Platforms don't share every detail, but most follow the same broad steps. They gather posts you might see, score each one and show the highest scores first.</p>
<figure data-chart="1"></figure>
<p>The score comes from signals. These are the most common ones:</p>
<ul>
<li><b>Your past behavior.</b> What you liked, watched, saved, shared or skipped.</li>
<li><b>Your connections.</b> Accounts you follow, message or interact with often.</li>
<li><b>The post itself.</b> Its topic, format, sound, text and how new it is.</li>
<li><b>Early reactions.</b> How other people responded in the first hours, such as watch time, comments and shares.</li>
</ul>
<h2>Why early reactions matter</h2>
<p>Many platforms show a new post to a small group first. If those people stop, watch and respond, the post gets shown to more people, then more again. If they scroll past, it slows down. That is why a post can sit still for an hour and then take off, or stall after a strong start.</p>
<figure data-chart="2"></figure>
<p>This test-and-widen pattern also explains why the first second of a video and the first line of a caption carry so much weight. They decide whether the first small group sticks around long enough to send a signal.</p>
<h2>How algorithms differ by network</h2>
<p>Short video apps lean heavily on recommendations, so people who don't follow you can see your posts every day. Networks built around friends and family give more weight to accounts you already know. Professional networks tend to favor posts that start real conversations in the comments. Some open networks, such as Mastodon, show posts in time order by default, while Bluesky lets people choose custom feeds built by others.</p>
<p>The safest plan is to learn how each place you post tends to work, then judge it with your own numbers.</p>
<h2>How to work with the algorithm</h2>
<ol>
<li><b>Make the first seconds count.</b> A strong hook keeps people watching or reading, which is a strong signal.</li>
<li><b>Give people a reason to respond.</b> Ask a real question or share something worth saving.</li>
<li><b>Post at a steady pace.</b> Regular posts give the system more chances to learn who likes your content.</li>
<li><b>Use each platform's own formats.</b> Short video, carousels and text posts each do best in their own home.</li>
<li><b>Post when your audience is awake.</b> Early reactions need people who are online.</li>
<li><b>Watch your own analytics.</b> Your data tells you more than any rumor about a secret rule.</li>
</ol>
<h2>Common myths</h2>
<p>Many tips online are guesses. There is rarely a single trick that beats the system. Paying for followers or stuffing posts with hashtags tends to hurt more than it helps. Deleting and reposting a slow post usually doesn't fix it either. Platforms say their goal is to show people content they value, so helpful, interesting posts are the most reliable path.</p>
<p>Another myth says that links, edits or scheduled posts are always punished. Some networks may show posts with outside links less often, but this varies and changes. Test it on your own account by comparing similar posts with and without a link.</p>
<p>When your reach drops, look for a cause in your own posts before you blame a change. Did you switch formats? Post at a new time? Cover a topic your audience cares less about? Most of the time, the answer is in your data.</p>
<h2>How to tell if the feed is favoring a post</h2>
<p>Open the post's insights and look at where the views came from. Most networks split them into followers and non-followers, or show sources such as the home feed, search, profile and recommendations. A post that the algorithm is pushing will usually show a growing share of views from people who don't follow you.</p>
<p>Then look at the shape over time. A post that keeps gaining views a day or two later is still being shown to new groups. A post that stops after the first few hours has run its course. Compare both kinds and ask what the long runners had in common, such as a topic, a format or a strong first line.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'How a feed picks what you see', 'steps': [
   ('Gather', 'Collect posts from accounts you follow and others you might like.'),
   ('Score', 'Predict how likely you are to watch, like, share or comment.'),
   ('Rank', 'Put the highest scores at the top of your feed.'),
   ('Test', 'Show new posts to a small group first.'),
   ('Widen', 'Show posts that do well to more and more people.')]},
  {'type': 'line', 'title': 'Reach in the first day after posting', 'sub': 'People reached, counted every few hours', 'example': True,
   'points': [('1h', 300), ('2h', 700), ('4h', 2100), ('8h', 5200), ('12h', 7400), ('24h', 8900)], 'unit': 'People reached',
   'note': 'Made-up numbers for one post that kept getting shown to new groups.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach and engagement for every channel side by side, so you can spot which posts the feed favored.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Our free tool helps you pick posting times when your audience is likely online.'},
 ],
 'faqs': [
  ("How does the Instagram algorithm work?", "Instagram uses separate ranking systems for the feed, Stories, Reels and Explore. Each one weighs signals such as your past activity, your relationship with the account and how others reacted to the post."),
  ("Can you beat the algorithm?", "There is no reliable shortcut. Posts that hold attention and get real responses tend to do best, and tricks that fake engagement can lower your reach."),
  ("Why did my reach suddenly drop?", "Reach can fall when a platform changes its ranking, when your posts get fewer early reactions or when the format you use is shown less. Compare recent posts in your analytics to spot a pattern."),
  ("Do all social networks use an algorithm?", "Most large ones rank their main feeds. Some, such as Mastodon by default, show posts in time order, and others let you pick feeds."),
 ],
 'related': ['organic-reach', 'engagement', 'feed', 'explore-page', 'watch-time'],
},
]

TERMS += [
{
 'slug': 'algospeak',
 'short': "Algospeak is coded slang people use online to swap out words they think will get a post hidden or removed by moderation systems.",
 'body': '''<h2>What is algospeak?</h2>
<p>Algospeak is a way of talking around filters. People replace words they believe automated moderation will flag with look-alike spellings and made-up terms. The word comes from "algorithm" plus "speak." It grew on short video apps, where creators worried that certain words would limit their reach or cut their earnings.</p>
<p>A well-known example is "unalive" in place of words about death or suicide. Others include "seggs" for sex and "le dollar bean" for lesbian, which came from a text filter turning the word into odd symbols. Some terms fade within months. Others spread so far that people use them in everyday speech, far from any filter.</p>
<p>Nobody official decides what counts as algospeak. Terms start in one corner of an app, get copied in comments and spread when a big creator picks them up.</p>
<h2>How algospeak works</h2>
<p>Most algospeak follows a handful of patterns. Once you know them, new terms are easier to spot.</p>
<ul>
<li><b>Swapped letters.</b> Numbers or symbols stand in for letters, such as "s3x" or "k!ll."</li>
<li><b>Stand-in words.</b> A cute or harmless word replaces the real one, such as "unalive" or "spicy accountant."</li>
<li><b>Spoken one way, written another.</b> A creator says the real word out loud while the captions or on-screen text show a softer version.</li>
<li><b>Emoji codes.</b> A single emoji carries a meaning that insiders know, such as a corn emoji used for "porn" in some circles.</li>
<li><b>Sound-alikes.</b> A word that sounds close, such as "seggs," lets the speaker keep the meaning while dodging exact matches.</li>
</ul>
<h2>Where people use algospeak</h2>
<p>You will see it most on TikTok, Instagram Reels and YouTube Shorts, where much of the reach comes from recommendations and creators feel the most pressure to stay "safe." It shows up in captions, on-screen text, hashtags and comments. Creators who talk about health, news, money or hard personal topics use it most, because those subjects are more likely to be reviewed.</p>
<p>Text-heavy networks see it less often, though it still appears in comment sections and replies. On open networks such as Mastodon, people more often use content warnings, which hide a post behind a short label until the reader taps to open it.</p>
<h2>An example of algospeak</h2>
<p>Here is a made-up example post: "That movie scene where the dog gets unalived had me crying for an hour #movietok." The writer chose "unalived" to avoid a word they feared would push the video down. A viewer who knows algospeak reads it right away. Someone new to the app might be confused. A screen reader would read it out as written, which may make little sense to a listener.</p>
<figure data-chart="1"></figure>
<h2>Why algospeak matters for brands</h2>
<p>Even if you never use it, algospeak changes how people talk about topics near your brand. That affects how you listen and how you moderate.</p>
<ul>
<li><b>Social listening.</b> If you track mentions of a topic, you may miss posts that use coded words. Add common variants to your keyword lists and review them every few months.</li>
<li><b>Moderation.</b> Comment filters that block exact words can miss algospeak. Review hidden and flagged comments by hand from time to time.</li>
<li><b>Clarity.</b> Coded words can confuse new readers, older audiences and people using screen readers.</li>
<li><b>Tone.</b> Some algospeak makes serious topics sound light. A health brand that copies "unalive" may come across as careless.</li>
</ul>
<figure data-chart="2"></figure>
<h2>Should you use algospeak?</h2>
<p>For most brands, the answer is usually no. Platforms publish community guidelines that explain what they limit, and many sensitive topics are allowed when handled with care. Odd spellings can make your post harder to find in search and harder to understand. If a topic is truly against the rules, coded words won't make it safe, and moderation systems learn new terms over time.</p>
<p>Write clearly and follow the guidelines. When you cover hard subjects, add context, use a content warning where the network offers one and link to support resources. If you work with creators who use algospeak in their own voice, agree up front on which words appear in posts made for your brand.</p>
<h2>Common mistakes</h2>
<ul>
<li>Using algospeak in a brand post to sound current, then confusing most of your audience</li>
<li>Building comment filters around exact words and missing the coded versions</li>
<li>Assuming every odd spelling is harmless, when some codes hide harassment or scams</li>
<li>Copying a term without knowing what it means in the community that made it</li>
</ul>''',
 'charts': [
  {'type': 'versus', 'title': 'Plain words vs algospeak', 'cols': ('Plain words', 'Algospeak'), 'rows': [
   ('Easy to find in search', True, False),
   ('Clear to new readers', True, False),
   ('Reads well on a screen reader', True, False),
   ('Understood by insiders', True, True),
   ('Keeps a post within the rules', 'Depends on the content', 'Depends on the content')]},
  {'type': 'steps', 'title': 'Catch coded words in your listening and moderation', 'steps': [
   ('List your topics', 'Write down subjects near your brand that people may talk about in code.'),
   ('Collect variants', 'Note the spellings, stand-ins and emoji people use for each one.'),
   ('Update your filters', 'Add the variants to listening keywords and comment filters.'),
   ('Review by hand', 'Check hidden and flagged comments every week or two.')]},
 ],
 'faqs': [
  ("What does unalive mean?", "Unalive is algospeak for dying or killing. People use it on video apps to talk about death or suicide without using words they think will be filtered."),
  ("Does algospeak actually work?", "Sometimes it gets past automated filters for a while, but moderation systems learn new terms. It can also make posts harder to find in search."),
  ("Why do TikTokers say seggs?", "Seggs is a playful spelling some creators use for sex. They choose it because they believe the real word could get a video limited or removed."),
  ("Should brands track algospeak?", "Yes, if you listen for mentions or moderate comments. Add common coded versions of your key topics to your keyword lists so you don't miss what people say."),
 ],
 'related': ['algorithm', 'moderation', 'community-guidelines', 'shadowban', 'social-listening'],
},
{
 'slug': 'alt-text',
 'short': "Alt text is a short written description of an image that screen readers read aloud and that appears when an image fails to load.",
 'body': '''<h2>What is alt text?</h2>
<p>Alt text, short for alternative text, describes what is in an image. People who are blind or have low vision often use screen readers, which read the alt text out loud. Without it, the reader might say only "image" or read the file name, so the person misses what you meant to share.</p>
<p>Most major networks let you add alt text to images, including Instagram, Facebook, X, LinkedIn, Bluesky, Mastodon and Threads. Some also write automatic alt text, but it is often vague, such as "may be an image of two people." Your own description is almost always better, because you know why you posted the picture.</p>
<h2>Why alt text matters</h2>
<ul>
<li><b>Access.</b> It lets more people understand your post, including people who use screen readers every day.</li>
<li><b>Clarity.</b> It helps when images load slowly or fail to load on a weak connection.</li>
<li><b>Search.</b> Platforms and search engines can read alt text to understand what an image shows.</li>
<li><b>Respect.</b> Some communities, such as many Mastodon and Bluesky users, expect it as basic good manners, and some people skip reposting images that lack it.</li>
</ul>
<p>Alt text also makes you a better writer. Describing an image in one sentence forces you to ask what the picture is for. If you can't say it, the image may not be doing much for the post.</p>
<h2>How to write good alt text</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Say what matters.</b> Describe the part of the image that makes your point. Skip details that don't add meaning.</li>
<li><b>Keep it short.</b> One or two sentences is enough for most photos.</li>
<li><b>Include text from the image.</b> If your graphic shows a quote, a price or a headline, type it out word for word.</li>
<li><b>Skip "image of."</b> Screen readers already announce that it is an image.</li>
<li><b>Match the tone.</b> A funny meme deserves a description that carries the joke.</li>
</ol>
<h2>Examples</h2>
<p>Weak: "Coffee."</p>
<p>Better: "A latte with a heart drawn in the foam, on a wooden table next to a blueberry muffin."</p>
<p>For a chart: "Bar chart showing website visits by month. Visits rise each month from January to June."</p>
<p>For a quote graphic: "Text on a green background reads: Done is better than perfect. Signed, the Fernwood Studio team."</p>
<p>For a product shot, think about what a shopper needs. "Black canvas backpack with a padded laptop sleeve, two side pockets and brown leather straps" helps someone decide. "Our best backpack" does not.</p>
<h2>Alt text vs captions</h2>
<p>A caption is the text everyone sees next to your post. Alt text is hidden by default and describes the image itself. You need both. The caption gives context and a call to action, while the alt text tells a screen reader user what is in the picture. For videos, closed captions do a similar job for sound.</p>
<figure data-chart="2"></figure>
<h2>Alt text across networks</h2>
<p>Where you add it changes from app to app. On some, you tap an option such as "accessibility" or "advanced settings" before you share. On others, a small "ALT" button sits on the image in the composer. Many apps let you edit alt text after posting, but not all do, so it is safest to add it before you publish.</p>
<p>Some networks show a small ALT badge on images that have a description, and anyone can tap it to read the text. That makes your effort visible. It also makes missing alt text easy to notice.</p>
<p>The easiest way to keep it up is to make it a habit. Add alt text at the same moment you pick the image, while the reason you chose it is fresh. If you batch posts, write the descriptions in the same session as the captions. Keep a short note in your style guide with a couple of good examples, so everyone on the team writes them the same way. For carousels, number the descriptions in your draft so none get skipped.</p>
<p>If a description feels hard to write, try saying it out loud as if you were telling a friend on the phone what the picture shows. Whatever you would say first is usually the right start.</p>
<h2>Common mistakes</h2>
<ul>
<li>Stuffing alt text with hashtags or keywords, which makes it painful to listen to</li>
<li>Pasting the caption again in the alt text field</li>
<li>Forgetting carousels, where each image needs its own description</li>
<li>Leaving out the words in a text graphic, which are often the whole point</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'Write alt text in four moves', 'steps': [
   ('Ask why', 'Decide what the image adds to the post.'),
   ('Describe that part', 'Name the subject and the detail that matters.'),
   ('Copy any words', 'Type out text shown in the image.'),
   ('Read it aloud', 'Cut anything that sounds like filler or keywords.')]},
  {'type': 'versus', 'title': 'Alt text vs caption', 'cols': ('Alt text', 'Caption'), 'rows': [
   ('Seen by everyone', False, True),
   ('Read aloud by screen readers', True, True),
   ('Describes what is in the image', True, 'Sometimes'),
   ('Holds hashtags and calls to action', False, True),
   ('Needed for each image in a carousel', True, False)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan image posts for every channel on one calendar and preview them before they go out.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter keeps your descriptions and captions within each limit.'},
  {'name': 'Claude', 'url': 'https://claude.ai', 'domain': 'claude.ai', 'line': "Anthropic's AI assistant, handy for a first draft of a description that you then check."},
 ],
 'faqs': [
  ("How do I add alt text on Instagram?", "When you create a post, look for the accessibility or advanced settings option before you share it. You can also edit a published post to add or change alt text."),
  ("How long should alt text be?", "Keep it to a sentence or two for most images. Add more only when the image holds text or data people need."),
  ("Does alt text help SEO?", "It can help search engines understand an image, which may help it show in image search. Write it for people first, though."),
  ("Do GIFs and memes need alt text?", "Yes. Describe the action and any text in the GIF or meme, and keep the joke if there is one."),
 ],
 'related': ['closed-captions', 'caption', 'carousel-post', 'gif'],
},
{
 'slug': 'ambassador-program',
 'short': "An ambassador program is a long-term partnership where a brand recruits fans and creators to promote it regularly in return for rewards.",
 'body': '''<h2>What is an ambassador program?</h2>
<p>An ambassador program is a group of people who represent a brand over time. Ambassadors talk about the brand on their social accounts, share discount codes, show up at events and give feedback on products. In return, they get perks such as free products, early access, commissions, exclusive merch or payment.</p>
<p>Ambassadors are often real customers who already love the brand. Some are creators with large followings. Others are students, local fitness coaches or hobby experts with a smaller but loyal audience. What they share is a real link to the brand and a willingness to talk about it for months.</p>
<h2>Ambassador program vs influencer campaign</h2>
<p>An influencer campaign is usually short. A brand pays a creator for a set number of posts about one launch. An ambassador program lasts months or years. Ambassadors mention the brand again and again, which feels more natural to their followers and builds trust over time. Many programs also give ambassadors a voice in what the brand does next.</p>
<figure data-chart="1"></figure>
<h2>Why ambassador programs matter</h2>
<ul>
<li>People trust friends and familiar faces more than ads.</li>
<li>Ambassadors create a steady stream of user-generated content you can reshare with permission.</li>
<li>They bring honest product feedback from real use.</li>
<li>They give your brand a human face in places your ads can't reach, such as group chats, clubs and local events.</li>
<li>They can answer questions from their own followers faster than your support team.</li>
</ul>
<p>Ambassador programs suit brands that people already talk about with some pride, such as sports gear, beauty, food, games and local services. They are harder for products people buy once and rarely discuss. If nobody tags you yet, work on getting customers to share first, then invite the ones who do.</p>
<h2>How to start an ambassador program</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Set a goal.</b> Decide whether you want more sales, more content, more reviews or a stronger community. The goal shapes who you invite and how you reward them.</li>
<li><b>Find the right people.</b> Look at who already tags you, reviews you or recommends you in comments. An open application form on your site helps too.</li>
<li><b>Write simple rules.</b> Explain what you ask for, how often and how ambassadors should disclose the partnership.</li>
<li><b>Pick rewards that fit.</b> Mix free product, commission, early access and shoutouts. A feature on your own account can mean a lot.</li>
<li><b>Give them tools.</b> Share unique codes, tracked links, photos and early news they can post.</li>
<li><b>Stay in touch.</b> A private group chat or monthly email keeps ambassadors involved and excited.</li>
</ol>
<h2>How to measure an ambassador program</h2>
<p>Give each ambassador a unique code or tracked link, so you can see the sales and visits each one drives. Count the posts and Stories they share, and how many of those you could reuse with permission. Watch mentions of your brand from their followers too.</p>
<p>Expect a drop-off. Many people sign up full of energy and post a few times, and a smaller group keeps going for months. That smaller group is your program. Here is a made-up example of how the numbers can thin out between first interest and a steady core.</p>
<figure data-chart="3"></figure>
<p>Use the numbers to find your best ambassadors, then spend more time on them. Ask what helps them post, send them new products first and invite them to shape the next season of the program.</p>
<h2>A made-up example</h2>
<p>A running shoe shop invites customers who already tag it in race photos. Each ambassador gets a code worth a discount for their followers, a free pair each season and a spot in a monthly group run. In return, they post about their training twice a month and bring friends to the group runs. After six months, the shop reposts their race photos every week, and the group run has become its best source of new customers.</p>
<h2>Common mistakes</h2>
<ul>
<li>Recruiting hundreds of people and then going silent, so ambassadors lose interest fast</li>
<li>Handing out strict scripts that make every post sound the same</li>
<li>Forgetting disclosure, since ambassadors must tell followers about the relationship too</li>
<li>Choosing people only by follower count instead of fit and enthusiasm</li>
</ul>
<p>Give ambassadors the key facts and let them speak in their own words. Their real voice is the reason the program works.</p>
<p>Plan for the end of a partnership too. Some ambassadors will move on, change interests or stop posting. Thank them, close their code on a set date and keep the door open. A clean exit leaves a good memory, and some come back later.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Ambassador program vs influencer campaign', 'cols': ('Ambassador program', 'Influencer campaign'), 'rows': [
   ('Length', 'Months or years', 'Weeks'),
   ('Posts', 'Regular, over time', 'A set number'),
   ('Usually real customers', True, 'Sometimes'),
   ('Gives product feedback', True, False),
   ('Needs a clear disclosure', True, True)]},
  {'type': 'steps', 'title': 'Start an ambassador program', 'steps': [
   ('Set the goal', 'Sales, content, reviews or community.'),
   ('Find fans', 'Start with people who already tag or review you.'),
   ('Write the rules', 'What you ask for, how often and how to disclose.'),
   ('Choose rewards', 'Product, commission, early access or a feature.'),
   ('Equip them', 'Codes, tracked links, photos and early news.'),
   ('Keep in touch', 'A group chat or monthly email.')]},
  {'type': 'funnel', 'title': 'From sign-ups to a steady core', 'sub': 'How one program might thin out over six months', 'example': True,
   'stages': [('Applied', 400, '400'), ('Accepted', 120, '120'), ('Posted in month one', 90, '90'), ('Still posting at month six', 35, '35')], 'unit': 'Ambassadors',
   'note': 'Made-up numbers to show a typical shape.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See comments and mentions from every channel in one place, so ambassador posts never slip by.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free tool makes a tracked link for each ambassador.'},
  {'name': 'Typeform', 'url': 'https://www.typeform.com', 'domain': 'typeform.com', 'line': 'A form builder for an ambassador application page.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for tracking each ambassador\'s posts and sales.'},
 ],
 'faqs': [
  ("Do brand ambassadors get paid?", "Some do, and some are rewarded with free products, discounts, commissions or early access instead. The deal depends on the brand and the ambassador's reach."),
  ("How do I become a brand ambassador?", "Start by using and posting about brands you genuinely like, and tag them. Many brands also have an application form on their website."),
  ("What is the difference between an ambassador and an affiliate?", "An affiliate mainly earns a commission on sales from a link. An ambassador has a closer, longer relationship that often includes content, events and feedback, and may also earn commission."),
  ("How many ambassadors should a small brand start with?", "Start with a small group you can actually stay in touch with, such as ten to twenty people. Grow once you know what helps them post."),
 ],
 'related': ['influencer-marketing', 'affiliate-marketing', 'employee-advocacy', 'user-generated-content', 'micro-influencer'],
},
{
 'slug': 'analytics',
 'short': "Analytics are the data and reports that show how your social media posts and accounts perform, such as reach, engagement and clicks.",
 'body': '''<h2>What are social media analytics?</h2>
<p>Social media analytics are the numbers behind your posts. They tell you how many people saw your content and what they did next. Every major platform offers built-in analytics for business and creator accounts, such as Instagram Insights, YouTube Studio and LinkedIn page analytics. Social media tools can also pull data from several networks into one report.</p>
<p>Analytics come in two levels. Post analytics show how one piece of content did. Account analytics show the bigger picture over weeks and months, such as follower growth, total reach and when your audience is online.</p>
<p>The numbers you can see depend on the network and the account type. Short video apps lean on views and watch time. Professional networks show job titles and industries of the people who saw your post. Some open networks show very little, because they collect less data about their users.</p>
<h2>Common metrics you will see</h2>
<ul>
<li><b>Reach.</b> How many unique people saw a post.</li>
<li><b>Impressions.</b> How many times a post was shown, counting repeat views.</li>
<li><b>Engagement.</b> Likes, comments, shares, saves and other actions.</li>
<li><b>Engagement rate.</b> Engagements divided by followers or reach, times 100.</li>
<li><b>Click-through rate.</b> Clicks divided by impressions, times 100.</li>
<li><b>Watch time.</b> How long people spent watching your videos.</li>
<li><b>Follower growth.</b> How many followers you gained or lost over a period.</li>
</ul>
<figure data-chart="1"></figure>
<h2>Why analytics matter</h2>
<p>Without data, you are guessing about what your audience wants. Analytics show which topics and formats work for you. They help you spend time on what pays off and drop what doesn't. They also give you proof to share with a boss or client when you explain results.</p>
<p>Most metrics line up along a path. Many people see a post, fewer react, fewer still click and a small group signs up or buys. Looking at the path shows where people drop off, which tells you what to fix.</p>
<figure data-chart="2"></figure>
<h2>How to use analytics</h2>
<ol>
<li><b>Start with a goal.</b> If you want website visits, focus on clicks. If you want awareness, look at reach.</li>
<li><b>Pick a few key numbers.</b> Track the same handful of metrics every month so you can compare.</li>
<li><b>Look for patterns.</b> Sort your posts by your main metric and ask what the top ones share.</li>
<li><b>Compare fair periods.</b> Compare this month to last month, or to the same month last year.</li>
<li><b>Test and adjust.</b> Turn what you learn into a change, then check whether it helped.</li>
</ol>
<h2>Reading trends over time</h2>
<p>Single days jump around. A post can do well because of a holiday, a news story or one big share. Trends over weeks tell you much more. A line that climbs slowly month after month is a better sign than one huge spike followed by a drop.</p>
<figure data-chart="3"></figure>
<p>When you see a change, look for the cause. Did you start posting more video? Change your posting time? Run a giveaway? Write a short note in your report each month so future you knows what happened.</p>
<p>A simple monthly report makes those notes stick. It doesn't need to be long. One page that your team actually reads beats a deck nobody opens. Try this layout each month:</p>
<ul>
<li>Your three or four key numbers, with last month beside them</li>
<li>Your top two posts and a line on why they worked</li>
<li>Your weakest post and what you'd change</li>
<li>One test you will run next month</li>
</ul>
<p>Keep the same layout every month, so changes jump out at a glance.</p>
<h2>Analytics vs vanity metrics</h2>
<p>Some numbers look good but don't tell you much. A big follower count or lots of likes can feel great, yet they may not lead to sales or signups. These are often called vanity metrics. Focus on metrics tied to your goal, such as saves for useful content or link clicks for traffic.</p>
<p>Likes still have a use. They show what grabs attention, which helps you pick hooks and topics. Just don't stop there. Ask what happened after the like, and whether any of it moved you closer to your goal.</p>
<p>To connect social media to your website, add UTM tags to your links. Then your website analytics can show which network, post or campaign sent each visit and sale.</p>
<h2>Common mistakes</h2>
<ul>
<li>Checking stats every hour and reacting to every dip</li>
<li>Comparing different networks directly, when a comment on LinkedIn and a like on TikTok mean different things</li>
<li>Tracking dozens of metrics and acting on none of them</li>
<li>Reporting numbers without saying what you will do next because of them</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Click-through rate', 'formula': 'Click-through rate = link clicks ÷ impressions × 100',
   'note': 'Made-up numbers to show the math.', 'result': '1.2%',
   'example': [('Link clicks', '240'), ('Impressions', '20,000')]},
  {'type': 'funnel', 'title': 'From reach to sign-ups', 'sub': 'One month of posts for a small online shop', 'example': True,
   'stages': [('Reached', 50000, '50,000'), ('Engaged', 2500, '2,500'), ('Clicked to the site', 800, '800'), ('Signed up', 60, '60')], 'unit': 'People',
   'note': 'Made-up numbers to show where people drop off.'},
  {'type': 'line', 'title': 'Followers over six months', 'sub': 'Total followers at the end of each month', 'example': True,
   'points': [('Jan', 4200), ('Feb', 4350), ('Mar', 4600), ('Apr', 4900), ('May', 5150), ('Jun', 5500)], 'unit': 'Followers',
   'note': 'Made-up numbers for one account with steady growth.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, engagement and followers for every channel side by side, with reports on Pro and Agency.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Our free calculator works out the rate for any post or profile.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free tool tags your links so website analytics can credit each post.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': "Google's tool for seeing how people find and use your website."},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ("What are the most important social media metrics?", "It depends on your goal. Reach and impressions show awareness, engagement rate shows interest and clicks or conversions show action."),
  ("Do you need a business account to see analytics?", "On most networks, detailed analytics are only available on business or creator accounts. Personal accounts often see little or no data."),
  ("How often should I check social media analytics?", "A weekly check is enough for most accounts, with a deeper review once a month. Daily swings are often random."),
  ("What is the difference between reach and impressions?", "Reach counts unique people who saw a post. Impressions count every time it was shown, so one person can create several impressions."),
  ("How do I see which posts send website traffic?", "Add UTM tags to the links in your posts. Your website analytics will then show visits and sales by network, post or campaign."),
 ],
 'related': ['engagement-rate', 'reach', 'impressions', 'key-performance-indicator', 'vanity-metrics'],
},
{
 'slug': 'api',
 'short': "An API is a set of rules that lets one piece of software talk to another, such as an app asking a social network to publish a post.",
 'body': '''<h2>What is an API?</h2>
<p>API stands for application programming interface. It is a way for programs to make requests to each other and get answers back in a format they both understand. You never see it, but you use APIs every day. When a weather app shows the forecast, it asks a weather service's API. When a scheduling tool posts to Instagram for you, it uses Instagram's API.</p>
<p>A simple way to picture it is a restaurant menu. The menu lists what you can order and how to ask for it. The kitchen does the work and sends back your food. An API lists the requests a program can make, and the service sends back data or carries out the action.</p>
<h2>How social media APIs work</h2>
<figure data-chart="1"></figure>
<p>Behind each step is a request and a reply. A request names an action, such as "create a post," and carries the details, such as the text and the image. The reply says whether it worked and sends back data, such as the new post's link. If something is wrong, the reply carries an error that explains why, such as a caption that is too long or a token that has expired.</p>
<p>Each network decides what its API allows. One might let apps publish videos and read comments. Another might limit what data apps can see. Networks also set rate limits, which cap how many requests an app can make in a given time. That is why tools sometimes wait a moment before they retry.</p>
<h2>Why APIs matter for social media</h2>
<ul>
<li><b>Scheduling.</b> Tools can publish posts at set times only because the network offers a publishing API.</li>
<li><b>Reporting.</b> Analytics dashboards pull your numbers through APIs.</li>
<li><b>Automation.</b> You can connect your store or blog so new events create posts or alerts.</li>
<li><b>AI agents.</b> Agents use APIs, or protocols built on them such as MCP, to take real actions.</li>
</ul>
<h2>What you can build with a scheduling API</h2>
<p>If your social tool has its own API, your developers can connect it to the rest of your business. Here are a few made-up examples. An online shop could create a draft post each time it adds a product. A news site could queue a post for every new article. An agency could pull post results into its own client dashboard every morning. A team could load a spreadsheet of posts from its own system instead of typing each one.</p>
<p>No-code tools such as Zapier sit in the middle for people who don't write code. They connect two apps' APIs with a few clicks, so a trigger in one app causes an action in another.</p>
<h2>API vs MCP</h2>
<p>An API is written for programs and developers. MCP, the Model Context Protocol, is a standard way to describe tools so AI assistants can find and use them. An MCP server often sits on top of an existing API and turns its actions into tools an AI model can call.</p>
<figure data-chart="2"></figure>
<p>In practice, that means a developer might use the API to build a nightly import, while a marketer asks Claude or ChatGPT to "draft three posts for Friday" and the assistant uses MCP to save them.</p>
<h2>Keeping API access safe</h2>
<p>An API key or token works like a password. Store it in a safe place and never paste it in a public post or shared doc. Give each app only the permissions it needs. If a key leaks, revoke it and make a new one.</p>
<p>Treat API access for AI tools the same way. An assistant connected through MCP acts with the permissions of the key or account behind it. If it only needs to draft posts, don't give it access that can delete them.</p>
<p>Review connected apps in your account settings from time to time and remove any you no longer use. When someone leaves your team, check which keys they made and replace them. If a tool lets you name keys, give each one a clear name, such as "store sync," so you know what breaks if you turn it off.</p>
<h2>Common mistakes</h2>
<ul>
<li>Sharing one key across many scripts, so you can't tell which one caused a problem</li>
<li>Ignoring error replies and assuming every post went out</li>
<li>Sending requests too fast and hitting rate limits</li>
<li>Keeping old keys alive long after the project ended</li>
</ul>''',
 'charts': [
  {'type': 'steps', 'title': 'How an app gets permission to post for you', 'steps': [
   ('Register the app', 'A developer signs up the app with the social network.'),
   ('You approve', 'You sign in and allow what the app may do, such as publish posts.'),
   ('Get a token', 'The network gives the app a digital key tied to your account.'),
   ('Send requests', 'The app sends each request with that token.'),
   ('Check and reply', 'The network checks the token and sends back a result or an error.')]},
  {'type': 'versus', 'title': 'API vs MCP', 'cols': ('API', 'MCP'), 'rows': [
   ('Built for', 'Programs and developers', 'AI assistants'),
   ('Needs code to use', True, False),
   ('Describes tools an AI can find', False, True),
   ('Often built on the other', False, True),
   ('Uses keys or tokens', True, True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar API', 'url': '/api', 'line': 'Create, schedule and read posts on your Capybaroar account from your own code.'},
  {'id': 'capybaroar', 'name': 'Capybaroar MCP', 'url': '/mcp', 'line': 'Let Claude, ChatGPT or Cursor work with your Capybaroar account, on every plan.'},
  {'name': 'Zapier', 'url': 'https://zapier.com', 'domain': 'zapier.com', 'line': 'A no-code tool for connecting apps so a trigger in one starts an action in another.'},
 ],
 'faqs': [
  ("What is an API key?", "An API key is a secret code that identifies the app or person making a request. The service uses it to check who is asking and what they may do."),
  ("Do I need to know how to code to use an API?", "To build with an API directly, yes. Many tools, though, use APIs for you behind the scenes, so you only click Connect and sign in."),
  ("Why do social networks limit their APIs?", "They limit access to protect user privacy and keep their systems stable. Rules and rate limits differ by network."),
  ("What is a rate limit?", "A rate limit caps how many requests an app can send in a set time. If an app goes over it, the service asks it to wait before trying again."),
 ],
 'related': ['mcp', 'ai-agent', 'social-media-management-tool', 'white-label', 'rss-feed'],
},
]

TERMS += [
{
 'slug': 'approval-workflow',
 'short': "An approval workflow is a set of review steps a post must pass, such as a manager or client sign-off, before it can be published.",
 'body': '''<h2>What is an approval workflow?</h2>
<p>An approval workflow is the path a post takes from draft to published. Someone writes it, one or more people review it and only then does it go live. Each step has an owner. A writer might create the post, an editor might fix the copy and a client or legal reviewer might give the final yes.</p>
<p>Small teams may have a single check. Large brands and companies in regulated fields such as health or finance often have several, since one wrong post can cause real trouble. Agencies almost always have one, because the client needs to see what goes out under their name.</p>
<h2>Why approval workflows matter</h2>
<ul>
<li><b>Fewer mistakes.</b> A second pair of eyes catches typos, wrong dates and broken links.</li>
<li><b>Brand safety.</b> Reviewers make sure posts match the brand voice and policies.</li>
<li><b>Client trust.</b> Agencies can show clients every post before it publishes.</li>
<li><b>A clear record.</b> You can see who approved what and when, which helps if questions come up later.</li>
</ul>
<p>A workflow also takes pressure off the writer. When a post has been checked, nobody has to wonder at midnight whether that price in the caption was right.</p>
<h2>How an approval workflow works</h2>
<figure data-chart="1"></figure>
<p>Each post sits in a state, such as draft, in review, changes requested, approved or scheduled. Everyone can see where it is at a glance. When a reviewer acts, the post moves to the next state and the right person gets a notice. If a reviewer asks for changes, the writer edits and sends it back through the same path.</p>
<h2>How to set up a good approval workflow</h2>
<ol>
<li><b>Map who approves what.</b> A routine tip might need only an editor. A product launch might need a manager. A post about a lawsuit might need legal.</li>
<li><b>Keep steps few.</b> Every extra reviewer adds delay, and slow approvals can make timely posts miss their moment.</li>
<li><b>Set deadlines.</b> Agree on how long each reviewer has, such as one working day.</li>
<li><b>Write a checklist.</b> List what reviewers should check, such as links, spelling, claims, tags and image rights, so feedback stays consistent.</li>
<li><b>Plan a fast lane.</b> For replies to trends or breaking news, agree ahead of time on one trusted approver who can say yes quickly.</li>
</ol>
<h2>How many reviewers is too many?</h2>
<p>Each person you add makes the post safer and slower. At some point the delay costs more than the risk it removes. A post about a trend that peaks on Tuesday is worth little on Friday.</p>
<figure data-chart="2"></figure>
<p>Watch how long posts sit in review. If approvals often take longer than the time you planned, look for the step where posts wait the most. Sometimes one busy reviewer is the whole problem, and adding a backup fixes it. Other times a reviewer is checking things that someone earlier already checked, and you can drop the overlap.</p>
<h2>Approval workflows for agencies</h2>
<p>Agencies face an extra layer: the client. A common setup has an internal review first, so the client only sees polished drafts, then a client review before scheduling. Give clients one simple place to approve, comment or ask for changes. Chasing approvals through email threads and chat apps is where most delays and mix-ups come from.</p>
<p>Agree on what happens when a client doesn't respond. Some agencies set a rule that a post is approved if there are no comments by a set time. Others hold the post. Either works if it is written down and both sides agree.</p>
<p>It also helps to send clients posts in batches, such as a full week at once, instead of one at a time. They can approve in one sitting, and you can see the week as a whole before it goes out.</p>
<h2>Common mistakes</h2>
<ul>
<li>Feedback scattered across email and chat, so the writer guesses which version is final</li>
<li>Editing a post after approval without sending it back for review</li>
<li>Adding a reviewer "just to be safe" for every post</li>
<li>No backup when a reviewer is out, so the whole calendar stalls</li>
<li>Vague feedback like "make it pop," which leads to several rounds of guessing</li>
</ul>
<p>Good feedback names the problem and, where possible, the fix. "The second line repeats the first, cut it" takes one round. "Not sure about this" can take five.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'From draft to published', 'steps': [
   ('Draft', 'A team member writes the post and adds media, links and a planned time.'),
   ('Submit', 'The draft moves to review and the reviewer gets a notice.'),
   ('Review', 'The reviewer approves, asks for changes or rejects it, with comments.'),
   ('Revise', 'The writer updates the draft and sends it back if needed.'),
   ('Publish', 'The approved post goes into the schedule and goes live on time.')]},
  {'type': 'columns', 'title': 'More reviewers, longer waits', 'sub': 'Average days from draft to approved', 'example': True,
   'rows': [('1 reviewer', 0.5, '0.5 days'), ('2 reviewers', 1.4, '1.4 days'), ('3 reviewers', 2.6, '2.6 days'), ('4 reviewers', 4.1, '4.1 days')], 'highlight': '2 reviewers', 'labels': 'all', 'unit': 'Days to approve',
   'note': 'Made-up numbers for one team. Track your own.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Approvals', 'url': '/pricing', 'line': 'Send posts for review before they are scheduled, on the Pro and Agency plans.'},
  {'name': 'Notion', 'url': 'https://www.notion.so', 'domain': 'notion.so', 'line': 'A workspace for writing down your review checklist and who approves what.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for tracking how long posts wait at each step.'},
 ],
 'list': 'social-media-tools-for-agencies',
 'faqs': [
  ("Why do agencies use approval workflows?", "Agencies post on behalf of clients, so they need the client to see and approve content before it goes live. A workflow keeps that process clear and recorded."),
  ("How many approval steps should a social post have?", "As few as you can manage safely. One review is enough for many teams, while regulated brands may need two or more."),
  ("What happens if a post is rejected?", "It goes back to the writer, usually with comments explaining what to change. The writer edits it and submits it again for review."),
  ("How do you handle urgent posts?", "Agree on a fast lane ahead of time, with one trusted person who can approve trend replies or news posts quickly."),
 ],
 'related': ['social-media-policy', 'content-calendar', 'social-media-manager', 'brand-voice', 'social-media-scheduling'],
},
{
 'slug': 'audience',
 'short': "An audience is the group of people who see and engage with your social media content, along with the people you want to reach.",
 'body': '''<h2>What is an audience on social media?</h2>
<p>Your audience is everyone who sees and responds to your posts. It includes your followers, people who find you through search or recommendations and people who see your content because a friend shared it. When marketers talk about an audience, they often mean two groups: the people you reach now and the people you want to reach.</p>
<p>Knowing your audience means knowing who these people are, what they care about and how they use each platform. A post that works for teenage gamers on TikTok will likely flop with accountants on LinkedIn. Even on one network, the same person may want quick laughs at night and careful advice at lunch.</p>
<h2>Where your audience comes from</h2>
<p>Followers are only part of the picture. On networks that recommend posts, a large share of your views can come from people who have never heard of you. Others arrive from search, from a share in a group chat or from your profile after they saw you mentioned somewhere.</p>
<figure data-chart="1"></figure>
<p>Your analytics usually split views by source. Check it for your last few posts. If most views come from followers, your posts are serving your fans well but rarely reaching new people. If most come from recommendations, you are growing reach, and the next job is turning those visitors into followers.</p>
<h2>Audience vs target audience</h2>
<p>Your audience is who actually shows up. Your target audience is the group you are trying to reach on purpose. Ideally the two match. If they don't, your analytics will show it. For example, a local gym might aim for nearby adults, but find that most viewers live in another country. That is a sign to change content, hashtags or location tags.</p>
<figure data-chart="2"></figure>
<h2>How to learn about your audience</h2>
<ol>
<li><b>Check platform analytics.</b> Business and creator accounts show age ranges, locations, active times and more.</li>
<li><b>Read comments and messages.</b> The words people use tell you what they want and what confuses them.</li>
<li><b>Ask directly.</b> Polls and question stickers give quick answers. A short survey link in your bio can go deeper.</li>
<li><b>Study top posts.</b> Look at which topics and formats get the most saves or shares.</li>
<li><b>Look at similar accounts.</b> See who comments on accounts in your niche and what they respond to.</li>
</ol>
<p>Write what you learn into a short audience profile. Give the person a made-up name, a job, a few goals and the questions they would ask you. When you plan a post, ask whether that person would stop scrolling for it.</p>
<p>Many accounts have more than one kind of person in the audience. A design studio may speak to clients, to students and to other designers. That is fine. Give each group its own profile and decide which one each post is for.</p>
<h2>Why your audience matters</h2>
<p>Every choice you make on social media gets easier when you know who you're talking to. Your topics, your tone, your posting times and even your choice of networks depend on it. A clear picture of your audience also helps you say no to ideas that don't fit, which keeps your feed focused.</p>
<p>It changes how you measure, too. A post that reaches fewer people can still be your best one if those people are the ones who buy. A thousand views from local parents may be worth more to a toy shop than fifty thousand from people who live too far away to visit.</p>
<h2>How to grow the right audience</h2>
<ul>
<li>Pick a clear niche and stick to it long enough for people to know what you offer.</li>
<li>Answer real questions your audience asks, in posts as well as replies.</li>
<li>Collaborate with accounts that serve the same kind of people.</li>
<li>Use words and hashtags your audience actually searches for.</li>
<li>Reply to comments, since people who get a response tend to come back.</li>
</ul>
<h2>Common mistakes</h2>
<ul>
<li>Chasing big numbers with giveaways or trends that have nothing to do with you, which brings followers who never return</li>
<li>Assuming your audience on one network is the same as on another</li>
<li>Writing for everyone, so the post speaks to no one in particular</li>
<li>Never checking again after the first look, even as your audience shifts</li>
</ul>
<p>Look at your audience data a few times a year. New topics, new formats and new networks all bring in different people, and your plan should change with them.</p>''',
 'charts': [
  {'type': 'stack', 'title': 'Where one month of views came from', 'sub': 'Share of views by source for one account', 'example': True,
   'parts': [('Recommendations', 52), ('Followers', 30), ('Search', 11), ('Shares and other', 7)],
   'note': 'Made-up numbers. Your analytics show your own split.'},
  {'type': 'versus', 'title': 'Audience vs target audience', 'cols': ('Audience', 'Target audience'), 'rows': [
   ('Who it is', 'People who actually see you', 'People you aim to reach'),
   ('Where you find it', 'Your analytics', 'Your plan'),
   ('Includes non-followers', True, True),
   ('Changes with each post', True, False),
   ('You choose it', False, True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See reach, followers and the best times to post for every channel in one place.'},
  {'name': 'Typeform', 'url': 'https://www.typeform.com', 'domain': 'typeform.com', 'line': 'A form builder for short audience surveys you can link from your bio.'},
  {'name': 'Google Analytics', 'url': 'https://marketingplatform.google.com/about/analytics/', 'domain': 'google.com', 'line': "Google's tool for seeing who visits your website from social media."},
 ],
 'faqs': [
  ("How do I find out who my audience is on Instagram?", "Switch to a professional account and open Insights. It shows details such as age range, top locations and the times your followers are most active."),
  ("What is the difference between audience and followers?", "Followers are people who chose to follow you. Your audience is wider and includes anyone who sees or engages with your posts, such as people reached through shares or recommendations."),
  ("Can my audience change over time?", "Yes. New topics and trends can bring in different people. Check your analytics a few times a year to see how your audience is shifting."),
  ("What is an audience profile?", "It is a short written picture of the person you want to reach, with their goals, problems and questions. Teams use it to decide whether a post idea fits."),
 ],
 'related': ['target-audience', 'psychographics', 'follower', 'analytics', 'niche'],
},
{
 'slug': 'augmented-reality-filter',
 'short': "An augmented reality filter is a camera effect that adds digital objects or masks to your face or surroundings in real time.",
 'body': '''<h2>What is an augmented reality filter?</h2>
<p>An augmented reality (AR) filter places digital effects on top of what your camera sees, live. It can add dog ears to your head, change your hair color, put a virtual hat on you or drop a 3D object onto your kitchen table. The effect moves with you, because the app tracks your face, hands or the space around you.</p>
<p>Snapchat helped make AR filters popular with its Lenses. Today you will find them on Instagram, TikTok, Facebook and other apps with a built-in camera, often under names such as effects or lenses. Which apps let outside creators publish their own effects changes over time, so check each one's current creator tools.</p>
<h2>How AR filters work</h2>
<p>The app uses your phone's camera to find key points, such as the corners of your eyes or the edges of a table. It then draws digital layers that stick to those points as you move. Some effects react to actions like opening your mouth, raising your eyebrows or tapping the screen.</p>
<p>A creator builds an effect in a design tool, tests it on a phone and submits it to the platform. The platform reviews it against its rules. Once approved, people can find it in the effects gallery, from the creator's profile or from a post that used it.</p>
<figure data-chart="1"></figure>
<p>Most effects you will come across fall into one of these types:</p>
<ul>
<li><b>Face filters.</b> Masks, makeup, ears, glasses and color changes.</li>
<li><b>World effects.</b> 3D objects placed in a room or outdoor scene.</li>
<li><b>Games and quizzes.</b> Effects that pick a random answer or let you play with head movements.</li>
<li><b>Try-on effects.</b> Let shoppers see how glasses, hats or makeup might look.</li>
<li><b>Brand effects.</b> Custom frames or characters tied to a product or campaign.</li>
</ul>
<p>Face filters are the most shared, because people love seeing themselves changed in a fun way. World effects take more work to build but can make a strong demo, such as placing a new sofa in your own living room.</p>
<h2>AR filter vs a regular filter</h2>
<p>A regular filter changes the color or mood of the whole picture, like making it warmer or black and white. It doesn't know what is in the frame. An AR filter does. It finds your face or the floor and adds things that follow along as you move.</p>
<figure data-chart="2"></figure>
<h2>Why brands use AR filters</h2>
<p>A fun filter turns your audience into creators. When people use your effect, they post it to their own Stories or videos, and their friends see your brand. Each use is a small piece of user-generated content that you didn't have to film.</p>
<p>Try-on effects can also help shoppers feel more sure before they buy. A person who has seen a pair of sunglasses on their own face has fewer doubts than one who has only seen a product photo. For events, a custom frame gives guests an easy way to share photos with your name on them.</p>
<h2>How to make an AR filter people use</h2>
<ol>
<li><b>Keep the idea simple.</b> People should get it in one second.</li>
<li><b>Make it flattering or funny.</b> People share effects that make them look good or laugh.</li>
<li><b>Keep your logo small.</b> Heavy branding makes people less likely to post.</li>
<li><b>Test widely.</b> Try it on older and newer phones, in bright and dim light, and on different faces.</li>
<li><b>Show it off.</b> Use it in your own posts and ask a few creators to try it, so people know it exists.</li>
<li><b>Give it a clear name.</b> People search the effects gallery by name, so pick something easy to type.</li>
</ol>
<h2>How to measure an AR filter</h2>
<p>Most creator tools show how many times an effect was opened, how many photos or videos were captured with it and how many were shared. The share count matters most, since a capture that never leaves the phone reaches no one. Look at the share of captures that were posted. A low number can mean the effect is fun to try but not flattering enough to share.</p>
<p>Search for posts that used your effect too. The comments on them show what people liked and what felt odd.</p>
<h2>Things to watch for</h2>
<p>Beauty filters that reshape faces can affect how people see themselves, and some platforms have rules about them. Always follow the platform's effect policies. Be honest in ads when a filter changes how a product looks, and don't use an effect to make a product seem bigger, brighter or better than it really is.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'From idea to published effect', 'steps': [
   ('Sketch the idea', 'One simple, shareable effect.'),
   ('Build it', 'Design it in the platform\'s creator tool.'),
   ('Test on phones', 'Check different phones, faces and lighting.'),
   ('Submit for review', 'The platform checks it against its rules.'),
   ('Launch and share', 'Use it in your own posts and invite creators to try it.')]},
  {'type': 'versus', 'title': 'Regular filter vs AR filter', 'cols': ('Regular filter', 'AR filter'), 'rows': [
   ('Changes color or mood', True, 'Sometimes'),
   ('Tracks your face or space', False, True),
   ('Adds objects that move with you', False, True),
   ('Works on a finished photo', True, False),
   ('Can let shoppers try a product', False, True)]},
 ],
 'tools': [
  {'name': 'Lens Studio', 'url': 'https://ar.snap.com/lens-studio', 'domain': 'snap.com', 'line': "Snap's free app for building AR effects for Snapchat."},
  {'name': 'CapCut', 'url': 'https://www.capcut.com', 'domain': 'capcut.com', 'line': 'A video editor for cutting demo clips that show your effect in use.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan the launch posts for your effect across every channel on one calendar.'},
 ],
 'faqs': [
  ("Can I make my own AR filter?", "Yes. Several platforms offer free creator tools for designing effects, and you can publish them for others to use once they pass review."),
  ("What is the difference between a filter and an AR filter?", "A basic filter changes the color or mood of a whole photo. An AR filter tracks your face or surroundings and adds effects that move with you."),
  ("Are AR filters good for marketing?", "They can be, especially when the effect is fun to share or helps people try a product. Results depend on how simple and appealing the effect is."),
  ("How do I know if people use my filter?", "The creator tool usually shows opens, captures and shares. Shares matter most, because they put your effect in front of new people."),
 ],
 'related': ['filter', 'snapchat', 'instagram-stories', 'user-generated-content', 'tiktok'],
},
{
 'slug': 'authenticity',
 'short': "Authenticity is being real and consistent on social media: posting in your own voice, being honest about what you offer and acting on what you say.",
 'body': '''<h2>What is authenticity on social media?</h2>
<p>Authenticity means your posts match who you really are. For a person, it means sharing real opinions and experiences. For a brand, it means telling the truth about products, owning mistakes and acting in line with your stated values. Authentic accounts don't pretend to be something they are not.</p>
<p>Authenticity does not mean sharing everything. You can keep private things private. It simply means what you do share is honest, and that the person or team people meet online is the same one they meet in real life.</p>
<h2>Why authenticity matters</h2>
<p>People see a huge number of ads and polished posts every day. They learn to tune out content that feels fake or overly sales focused. Posts that feel human stand out. Trust grows when followers can tell there are real people behind an account who mean what they say.</p>
<p>That trust shows up in what people do. They comment more, recommend you to friends and forgive you faster when something goes wrong. A brand that has been honest for years can survive a bad week. A brand caught faking it often can't.</p>
<p>Authenticity also makes your work easier. When you post what is true, you never have to keep track of a story. New team members can join in, because the voice is just how the team already talks. And when a customer asks a hard question, you can answer it straight.</p>
<h2>What authentic content looks like</h2>
<p>Here is a made-up comparison for one small brand. Over a month, it tracked engagement on different kinds of posts. The behind-the-scenes clips and customer stories pulled well ahead of the stock-style product shots.</p>
<figure data-chart="1"></figure>
<ul>
<li>A bakery posting a short video of a cake that collapsed, with a laugh and the fix</li>
<li>A software founder explaining why a feature is late</li>
<li>A creator saying they stopped using a product and why</li>
<li>A team photo from a normal Tuesday</li>
<li>A shop owner answering a tough review in public, calmly and with a real fix</li>
</ul>
<h2>How to be more authentic online</h2>
<ol>
<li><b>Write the way you talk.</b> Drop stiff corporate phrases and speak plainly.</li>
<li><b>Show the process.</b> Behind-the-scenes clips, early drafts and team stories let people see real work.</li>
<li><b>Admit mistakes.</b> When something goes wrong, say so, explain the fix and move on.</li>
<li><b>Share real customer voices.</b> Repost user-generated content with permission alongside your own photos.</li>
<li><b>Be clear about paid posts.</b> Label ads, gifted products and affiliate links.</li>
<li><b>Answer people.</b> Reply to comments and messages like a person would, with names and specifics.</li>
</ol>
<h2>Real vs staged</h2>
<p>Many brands try to look authentic without being authentic. They script "candid" videos, jump on causes they don't support in real life or use slang that doesn't fit them. Audiences often notice, and it can backfire badly.</p>
<figure data-chart="2"></figure>
<p>A useful test is to ask whether you would be comfortable if people saw how the post was made. If the honest answer is "they'd feel tricked," change the post.</p>
<p>Polish is fine. A well-lit video with clean sound can be fully authentic if what it shows is true. What breaks trust is pretending: actors posing as customers, fake "first try" videos after twenty takes, stock photos passed off as your team or a brand that posts about a cause only on the day it trends.</p>
<h2>Authenticity and AI</h2>
<p>AI tools can help you write faster, and using them is fine. The risk is posts that sound like everyone else and say nothing real. If you use AI to draft, edit the result so it sounds like you and add details only you would know, such as a customer's question, a number from your own shop or a story from your week. Label AI images or video when the platform asks, and never use AI to fake a review, a testimonial or a person.</p>
<h2>Common mistakes</h2>
<ul>
<li>Treating authenticity as an excuse to skip editing, when being real still means being clear and useful</li>
<li>Oversharing personal problems in ways that make followers uncomfortable</li>
<li>Copying another creator's "relatable" style until it stops being yours</li>
<li>Making a promise in a post, such as a new policy, and then not keeping it</li>
</ul>
<p>Consistency is the steady part of authenticity that people often miss. Saying the same things in posts, replies, ads and real life, month after month, is what makes people believe you.</p>''',
 'charts': [
  {'type': 'columns', 'title': 'Engagement by post type for one brand', 'sub': 'Average engagement rate by followers over one month', 'example': True,
   'rows': [('Behind the scenes', 4.8, '4.8%'), ('Customer story', 4.1, '4.1%'), ('Team photo', 3.3, '3.3%'), ('Stock-style product shot', 1.4, '1.4%')], 'highlight': 'Behind the scenes', 'labels': 'all', 'unit': 'Engagement rate',
   'note': 'Made-up numbers for one account. Test your own mix.'},
  {'type': 'versus', 'title': 'Authentic vs staged', 'cols': ('Authentic', 'Staged'), 'rows': [
   ('Shows real people and work', True, 'Sometimes'),
   ('Owns mistakes in public', True, False),
   ('Labels paid posts', True, 'Sometimes'),
   ('Fine if people saw how it was made', True, False),
   ('Polished', 'Can be', True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'Read and answer comments and mentions from every channel in one place.'},
  {'name': 'Notion', 'url': 'https://www.notion.so', 'domain': 'notion.so', 'line': 'A workspace for keeping your brand values and voice notes where the whole team can see them.'},
 ],
 'faqs': [
  ("Why is authenticity important in social media marketing?", "People trust accounts that feel honest and human. That trust makes them more likely to buy from you and recommend you to others."),
  ("Can a brand be authentic and still sell?", "Yes. Be clear about what you sell and label paid content. Honest selling still counts as authentic."),
  ("Is it authentic to use AI for social media posts?", "It can be, if you use AI as a helper and make sure the final post reflects your real views and facts. Label AI images or video when the platform asks."),
  ("How do I show authenticity as a big company?", "Let real employees speak, show the work behind products and reply to people with specifics. Own mistakes quickly and explain the fix."),
 ],
 'related': ['brand-voice', 'user-generated-content', 'social-proof', 'ai-generated-content', 'influencer-marketing'],
},
{
 'slug': 'auto-posting',
 'short': "Auto-posting is publishing social media content automatically at a set time or after a trigger, without someone pressing post by hand.",
 'body': '''<h2>What is auto-posting?</h2>
<p>Auto-posting means a tool publishes your posts for you. You write the post, add images or video, pick the account and choose a time. When that time comes, the tool sends the post to the network through its API. You don't need to be online.</p>
<p>Auto-posting can also run on triggers. A new blog article, a new product in your store or a new video on your channel can create a post on its own. Some tools pull from an RSS feed and share each new item. Others take posts sent from your own code through an API.</p>
<h2>Why auto-posting matters</h2>
<ul>
<li><b>Consistency.</b> Posts go out on schedule even on busy days and holidays.</li>
<li><b>Better timing.</b> You can publish when your audience is active, even if that is 6 a.m. for you.</li>
<li><b>Time saved.</b> You plan a week of posts in one sitting.</li>
<li><b>Fewer slips.</b> No more forgetting to post during a launch.</li>
<li><b>Room to think.</b> With the queue full, you can spend your energy on replies and new ideas.</li>
</ul>
<h2>How auto-posting works</h2>
<figure data-chart="1"></figure>
<p>Most tools give you two ways to time posts. You can pick an exact date and time for each one, which suits launches and events. Or you can set up a queue: a list of weekly time slots, such as Monday, Wednesday and Friday at 9 a.m., and the tool drops each new post into the next open slot. The queue suits steady, evergreen content.</p>
<h2>Auto-posting vs cross-posting</h2>
<p>Cross-posting means sharing the same content on several networks. Auto-posting is about timing and automation. You can do both at once, but take care. Each network has its own limits and style. An Instagram caption can run to 2,200 characters, while a standard X post has room for 280 and a Bluesky post 300.</p>
<figure data-chart="2"></figure>
<p>A long LinkedIn post pasted into X will get cut short or fail. Write a version for each network, or start with the shortest limit and add detail for the roomier ones. A preview of each version before you schedule catches most problems.</p>
<p>Media matters too. A tall video that fits a short video app may need a different crop for a feed that shows square posts. Some networks take several images in one post, while others take one. Check that each version has the right shape and count before it goes into the schedule.</p>
<figure data-chart="3"></figure>
<h2>How to set up auto-posting</h2>
<ol>
<li><b>Connect your accounts.</b> Sign in to each network through your tool and approve its access.</li>
<li><b>Set your time slots.</b> Start with times your analytics say your audience is online.</li>
<li><b>Fill a week.</b> Write and schedule a week of posts, then check the calendar for gaps and clumps.</li>
<li><b>Turn on alerts.</b> Make sure you hear about any post that fails, such as one with an expired login.</li>
<li><b>Review weekly.</b> Look at what went out, what worked and what needs to change.</li>
</ol>
<p>Keep a few open slots each week for timely posts. A fully booked queue leaves no room for a trend, a customer story or a quick reply to news in your field.</p>
<h2>Common mistakes</h2>
<p>The biggest risk is posting on autopilot and forgetting the world around you. If major news breaks, a cheerful scheduled post can look careless. Check your queue when big events happen and pause it if needed.</p>
<p>Another mistake is setting up a trigger, such as every new product, and then flooding followers with dozens of posts at once. Add limits or space them out. A third is ignoring failed posts. Logins expire, and networks change their rules, so check your alerts.</p>
<p>Finally, auto-posting is only half of social media. Someone still needs to read comments and reply, ideally soon after each post goes live, when people are most likely to be watching.</p>
<p>Plan for that time. If a post is set for 9 a.m., block a few minutes around 9:30 to read the first comments and answer them.</p>
<h2>Is auto-posting allowed?</h2>
<p>Most major networks allow scheduled posting through their official APIs. Using unofficial bots or spam patterns breaks platform rules and can get accounts limited. Stick to tools that use each network's official connection, and keep posting at a pace that a person would. Avoid tools that ask for your password instead of sending you to the network's own sign-in page. Some post types may still need you to finish them by hand in the app, depending on the network.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'What happens when a post auto-publishes', 'steps': [
   ('Connect', 'You link your accounts to the tool and approve its access.'),
   ('Schedule', 'You set a date and time, or add the post to a queue.'),
   ('Store', 'The tool keeps the post and its media until it is due.'),
   ('Publish', 'At the set time, it sends the post through the network\'s API.'),
   ('Report', 'It shows whether the post went live or failed.')]},
  {'type': 'versus', 'title': 'Auto-posting vs cross-posting', 'cols': ('Auto-posting', 'Cross-posting'), 'rows': [
   ('About', 'When a post goes out', 'Where a post goes'),
   ('Publishes without you online', True, 'Only if scheduled'),
   ('Shares one idea on many networks', 'Can', True),
   ('Needs a version for each limit', 'When cross-posting', True)]},
  {'type': 'bars', 'title': 'Post text limits by network', 'sub': 'Characters allowed in one post or caption',
   'rows': [('Facebook', 63206, '63,206'), ('YouTube description', 5000, '5,000'), ('LinkedIn', 3000, '3,000'), ('Instagram', 2200, '2,200'), ('TikTok', 2200, '2,200'), ('Discord', 2000, '2,000'), ('Google Business Profile', 1500, '1,500'), ('Threads', 500, '500'), ('Pinterest description', 500, '500'), ('Mastodon', 500, '500'), ('Bluesky', 300, '300'), ('X', 280, '280')], 'highlight': 'X', 'unit': 'Characters',
   'note': "Limits used by Capybaroar's composer, November 2026."},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Plan posts on a calendar or queue and publish to 12 networks, with previews for each one.'},
  {'id': 'capybaroar', 'name': 'Capybaroar API', 'url': '/api', 'line': 'Send posts from your own store, blog or app straight into your schedule.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter checks a post against each network\'s limit.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ("Does auto-posting hurt reach?", "There is no clear sign that posting through an official scheduling tool lowers reach by itself. Reach depends mainly on how people respond to the post."),
  ("Can I auto-post to Instagram?", "Yes, through tools that use Instagram's official publishing access for professional accounts. Some post types may have extra limits."),
  ("What is the difference between auto-posting and scheduling?", "Scheduling is setting a future time for a post. Auto-posting is the tool publishing it for you at that time, and it can also include posts created by triggers."),
  ("What happens if an auto-post fails?", "A good tool tells you and shows the reason, such as an expired login or a caption over the limit. Fix the issue and publish again."),
  ("Should I auto-post replies too?", "No. Replies work best when a person writes them, since they answer a real comment. Use automation for planned posts and keep conversations human."),
 ],
 'related': ['social-media-scheduling', 'bulk-scheduling', 'queue', 'cross-posting', 'rss-feed'],
},
]

TERMS += [
{
 'slug': 'avatar',
 'short': "An avatar is the small picture or graphic that represents you or your brand on a social media profile, next to your name and posts.",
 'body': '''<h2>What is an avatar?</h2>
<p>An avatar is your profile picture. It appears on your profile page and next to every post, comment and reply you make. For a person, it is usually a face photo. For a brand, it is usually a logo or logo mark. Some people use cartoons, 3D characters or digital versions of themselves, which are also called avatars.</p>
<p>Because it shows up so often and so small, your avatar is one of the most seen parts of your account. People often recognize you by the picture before they read your name. In a busy comment section, it may be the only thing that tells them the reply came from you.</p>
<h2>Why your avatar matters</h2>
<ul>
<li><b>Recognition.</b> A clear, steady image helps people spot you in a busy feed.</li>
<li><b>Trust.</b> A real face or familiar logo looks more credible than a blank default image.</li>
<li><b>Consistency.</b> Using the same avatar on every network tells people they found the right account.</li>
<li><b>Safety.</b> A familiar image makes it easier for followers to spot fake accounts that copy your name.</li>
</ul>
<p>A missing avatar sends a signal too. Many people treat a default gray silhouette as a sign of a spam or brand-new account and skip it. Even a simple photo is better than none.</p>
<h2>How to choose a good avatar</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Think small.</b> Your avatar often shows as a tiny circle beside a comment. Check that it still reads at that size.</li>
<li><b>Keep it simple.</b> One face or one logo mark works better than a busy scene or long text.</li>
<li><b>Center it in a circle.</b> Most networks crop avatars into circles, so keep key parts away from the corners.</li>
<li><b>Use high contrast.</b> A clean, plain background helps your face or logo stand out against both light and dark app themes.</li>
<li><b>Upload a sharp file.</b> Start with a square, high-resolution image so it stays crisp on large screens.</li>
</ol>
<p>A quick test: shrink your avatar on your screen until it is about the size of a fingernail. If you can still tell what it is, it will work in a feed. If it turns into a blur, crop tighter or simplify.</p>
<h2>Avatars for personal brands vs companies</h2>
<p>If you are a creator or founder, a friendly, well-lit photo of your face usually works best. People connect with faces, and a face makes your replies feel personal. Frame from the shoulders up, look at the camera and pick a background that doesn't compete with you.</p>
<p>For companies, a logo mark is standard. Use the simplest version you have, such as the symbol alone without the full name. Some brands that post with a personal voice use a mascot or character, which can be memorable if it fits the brand. A few small businesses use the owner's photo, which works well when the owner is the face of the shop.</p>
<figure data-chart="2"></figure>
<h2>How avatars fit the rest of your profile</h2>
<p>Your avatar sits next to your header image, your name and your bio. Plan them together. If your header is busy, keep the avatar plain. If your avatar is a dark logo, a lighter header helps it pop. On some networks the avatar overlaps the header, so check that nothing important sits under it.</p>
<p>When you update your branding, change the avatar on every network on the same day. A mix of old and new images makes people wonder which account is really yours.</p>
<h2>Common mistakes</h2>
<ul>
<li>Changing your avatar often, which makes you harder to recognize</li>
<li>Using a full logo with small words that become unreadable</li>
<li>Group photos where nobody can tell which person you are</li>
<li>Seasonal versions that stay up long after the season ends</li>
<li>Images that look like a famous brand or a verified account, which can confuse people and break rules on impersonation</li>
</ul>
<h2>Avatars beyond the profile picture</h2>
<p>The word avatar also means a digital character that stands in for you. Some apps let you build a cartoon or 3D version of yourself to use in stickers, games or video calls. Brands sometimes create AI-driven avatars as virtual hosts or support helpers.</p>
<p>If you use one, be open about it so people know they are not talking to a real person. Label AI-made video where the platform asks, and keep a way for people to reach a human when they need one.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Check your avatar before you upload', 'steps': [
   ('Start square', 'Use a square, high-resolution file.'),
   ('Crop to a circle', 'Keep the face or logo in the middle.'),
   ('Shrink it', 'Make sure it reads at fingernail size.'),
   ('Check both themes', 'Look at it on light and dark backgrounds.'),
   ('Use it everywhere', 'Upload the same image on every network.')]},
  {'type': 'versus', 'title': 'Face photo vs logo mark', 'cols': ('Face photo', 'Logo mark'), 'rows': [
   ('Best for', 'Creators, founders, solo pros', 'Companies and products'),
   ('Feels personal in replies', True, False),
   ('Stays the same when staff change', False, True),
   ('Reads well at small sizes', 'If cropped close', 'If simple')]},
 ],
 'tools': [
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for cropping photos and making a simple logo mark.'},
  {'name': 'X header size', 'url': '/tools/x-header-size', 'line': 'Our free guide to sizing the header that sits behind your avatar on X.'},
  {'name': 'LinkedIn banner size', 'url': '/tools/linkedin-banner-size', 'line': 'Our free guide to sizing a LinkedIn banner so it works with your profile picture.'},
 ],
 'faqs': [
  ("What size should a social media avatar be?", "Each network recommends its own size, and these can change. Upload a square, high-resolution image and check how it looks in the app after cropping."),
  ("Should my business use a logo or a photo as its avatar?", "Companies usually use a logo mark. Solo businesses and personal brands often do better with a clear photo of the person behind them."),
  ("Is avatar the same as profile picture?", "On social media, yes. Avatar can also mean a digital character that represents you in apps and games."),
  ("How often should I change my avatar?", "Rarely. Keep one image for a long time so people learn to recognize it, and change it on every network at once when you do."),
 ],
 'related': ['profile', 'bio', 'handle', 'verified-account'],
},
{
 'slug': 'b2b-social-media',
 'short': "B2B social media is using social networks to market products or services to other businesses and the people who make buying decisions there.",
 'body': '''<h2>What is B2B social media?</h2>
<p>B2B stands for business to business. B2B social media is how companies that sell to other companies use social networks. Think software firms, consultancies, manufacturers and agencies. Their buyers are managers and owners who make decisions for a company, often with a team and a budget to answer to.</p>
<p>LinkedIn is the main home for most B2B brands, but many also use YouTube for demos and webinars, X and Bluesky for industry talk and short video apps for brand building. The right mix depends on where your buyers spend time, which you can find out by asking a few of them.</p>
<h2>How B2B social media differs from B2C</h2>
<p>Selling to a business is slower and involves more people than selling to a shopper. That changes what you post and how you measure it.</p>
<figure data-chart="1"></figure>
<ul>
<li><b>Longer sales cycles.</b> A business purchase can take months and involve several people. Social media builds trust along the way.</li>
<li><b>Deeper content.</b> Buyers want guides, case studies, data and expert opinions they can share with their boss.</li>
<li><b>People over logos.</b> Posts from founders and employees often reach further than the company page.</li>
<li><b>Different goals.</b> Leads, demo requests and sales conversations matter more than impulse buys.</li>
</ul>
<h2>How to do B2B social media well</h2>
<ol>
<li><b>Know your buyer.</b> Write down their job title, problems and the questions they ask before buying.</li>
<li><b>Teach first.</b> Share how-to posts, lessons learned and clear explanations of hard topics.</li>
<li><b>Show proof.</b> Customer stories and real numbers from your own work build trust.</li>
<li><b>Get experts posting.</b> Encourage leaders and staff to share their own views through an employee advocacy program.</li>
<li><b>Use each format for its job.</b> On LinkedIn, document posts suit step-by-step guides, newsletters suit regular deep dives and short video suits quick tips.</li>
<li><b>Track what matters.</b> Measure profile visits, website clicks, demo requests and sales conversations, along with engagement.</li>
</ol>
<h2>From post to pipeline</h2>
<p>Most B2B posts won't lead straight to a sale. They move people a little closer. Someone sees a useful post, visits your profile, reads a guide on your site and, weeks later, books a call. The path is long, so measure each step and see where people stall.</p>
<figure data-chart="2"></figure>
<p>Tag your links with UTM parameters so your website analytics shows which posts sent the visits that turned into demo requests. Ask new leads how they heard about you too. Many will name a post or a person, even when the click data can't show it.</p>
<h2>How to plan a B2B posting week</h2>
<p>A simple rhythm helps busy teams keep going. Pick two or three themes that match your buyers' biggest problems, then give each day a job. Here is one made-up plan for a small team:</p>
<ul>
<li>Monday: a short tip on one problem your buyers face</li>
<li>Wednesday: a customer story or a behind-the-scenes look at how you work</li>
<li>Thursday: a founder or expert post with an opinion on an industry change</li>
<li>Friday: a poll or question that invites peers to share their view</li>
</ul>
<p>Leave room to reply. In B2B, the comments under a post are often where real conversations start, and a thoughtful reply can turn into a call.</p>
<h2>Examples of B2B social content</h2>
<ul>
<li>A carousel explaining common mistakes in a process your product helps with</li>
<li>A short video of a customer describing a problem you solved together</li>
<li>A founder post about a tough decision and what the team learned</li>
<li>A webinar clip with one useful tip</li>
<li>A poll asking peers how they handle a common task</li>
<li>A post sharing a template or checklist people can use right away</li>
</ul>
<p>Here is a made-up example. A payroll software company has a finance lead post every Tuesday about one small tax rule, in plain words. The posts aren't about the product. After a few months, accountants start tagging her when the topic comes up, and the sales team hears her name on calls.</p>
<h2>Common mistakes</h2>
<ul>
<li>Posting only product news and press releases, which buyers scroll past</li>
<li>Writing in heavy jargon that sounds smart but says little</li>
<li>Giving up after a few weeks, when trust builds over many months</li>
<li>Counting likes and ignoring the demo requests and replies that matter</li>
</ul>
<p>Use plain words and specific details. A post that says "we cut invoice errors for a 40-person firm by fixing one approval step" beats "we drive operational excellence." Buyers are people, and people read what is clear.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'B2B vs B2C social media', 'cols': ('B2B', 'B2C'), 'rows': [
   ('Buyers', 'Teams inside a company', 'Single shoppers'),
   ('Sales cycle', 'Weeks to months', 'Minutes to days'),
   ('Main network', 'Often LinkedIn', 'Varies widely'),
   ('Content', 'Guides, proof, expert views', 'Products, fun, offers'),
   ('Key goal', 'Leads and conversations', 'Sales and loyalty')]},
  {'type': 'funnel', 'title': 'From LinkedIn posts to demo requests', 'sub': 'One quarter of posts for a small software company', 'example': True,
   'stages': [('Impressions', 120000, '120,000'), ('Profile and page visits', 3600, '3,600'), ('Website clicks', 900, '900'), ('Demo requests', 27, '27')], 'unit': 'Count',
   'note': 'Made-up numbers to show where B2B buyers drop off.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar for LinkedIn', 'url': '/linkedin-post-scheduler', 'line': 'Plan and schedule LinkedIn posts alongside your other channels on one calendar.'},
  {'name': 'LinkedIn text formatter', 'url': '/tools/linkedin-text-formatter', 'line': 'Our free tool adds bold and italic text to LinkedIn posts.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free tool tags your links so you can see which posts bring leads.'},
  {'name': 'LinkedIn Campaign Manager', 'url': 'https://business.linkedin.com/marketing-solutions/campaign-manager', 'domain': 'linkedin.com', 'line': "LinkedIn's tool for running ads aimed at people by job and company."},
 ],
 'list': 'linkedin-post-schedulers',
 'faqs': [
  ("What is the best social media platform for B2B?", "LinkedIn is the most common choice because people use it for work. YouTube, X and others can also work well depending on your industry."),
  ("How do you get leads from B2B social media?", "Share useful content, invite people to a clear next step such as a guide or demo and follow up when someone engages. Track clicks with UTM parameters."),
  ("Should B2B brands post on TikTok?", "Some do well there, especially with educational or behind-the-scenes video. Test it if your buyers use the app and you can post short video regularly."),
  ("Should employees post for a B2B brand?", "It often helps, since people trust people more than logos. Give staff ideas and freedom, and never force them to share."),
 ],
 'related': ['linkedin', 'linkedin-company-page', 'employee-advocacy', 'social-selling', 'lead-generation'],
},
{
 'slug': 'batching',
 'short': "Batching is creating many pieces of social content in one focused session, such as writing a week of posts or filming several videos in one day.",
 'body': '''<h2>What is batching?</h2>
<p>Batching means grouping similar tasks and doing them together. In social media, it means you write all your captions in one sitting, film several videos in one shoot or design a set of graphics at once. Then you schedule them to post over the following days or weeks.</p>
<p>The idea is simple. Switching between tasks wastes time and focus. Every time you set up lights, open a design app or get into a writing mood, there is a warm-up cost. Batching pays that cost once instead of every day.</p>
<h2>Why batching matters</h2>
<ul>
<li><b>Saves time.</b> Setup happens once for many posts.</li>
<li><b>Keeps you consistent.</b> A full queue means you still post during busy or sick days.</li>
<li><b>Improves quality.</b> You can think more deeply when you stay in one kind of work for a few hours.</li>
<li><b>Lowers stress.</b> No more scrambling for an idea at 9 p.m.</li>
<li><b>Frees your days.</b> Outside your batch sessions, you can focus on replies, clients or the rest of your job.</li>
</ul>
<p>Here is a made-up comparison for one person who posts five times a week. Making each post on the day it goes out took far longer than doing the same work in two blocks.</p>
<figure data-chart="1"></figure>
<h2>How to batch your social media content</h2>
<ol>
<li><b>Plan topics first.</b> Use your content pillars and calendar to list the posts you need for the next week or month.</li>
<li><b>Group by task.</b> Do all the writing in one block, then all the filming, then all the editing.</li>
<li><b>Prepare your space.</b> For video, set up lighting and props once and change outfits or angles between clips.</li>
<li><b>Use templates.</b> Reusable graphic and caption formats speed things up.</li>
<li><b>Schedule everything.</b> Load the finished posts into your scheduler with times and accounts.</li>
<li><b>Leave room.</b> Keep a few open slots for trends and news.</li>
</ol>
<h2>A sample batching week</h2>
<figure data-chart="2"></figure>
<p>You don't need a full week. Many people do it all in one afternoon every Sunday or every other Friday. Others batch writing on one day and filming on another, because those tasks need different energy. Try a rhythm for a month, then adjust.</p>
<p>Protect the time. Put your batch sessions in your calendar like meetings, turn off notifications and tell your team you're heads down. A two-hour block with no interruptions often gets more done than a full day of stop-and-start work.</p>
<h2>How to batch for several networks</h2>
<p>Start with one core idea and make each network's version in the same session. A tip that becomes a 60-second video can also become a carousel, a short text post and a pin. Write the longest version first, then cut it down. A LinkedIn post can run to 3,000 characters, while Threads allows 500 and a standard X post 280, so the short versions need their own tight wording.</p>
<p>Batch media the same way. Export each image or video in every shape you need while the design file is open. Coming back later to resize one graphic costs more time than doing all the sizes at once.</p>
<p>Keep a simple tracker for each batch with the post, the network, the date, the media file and its status. When something goes wrong, such as a missing image or a wrong link, the tracker shows you which post to fix before it goes live.</p>
<h2>Batching and bulk scheduling</h2>
<p>Batching is about making content. Bulk scheduling is about loading it. Once a batch is finished, a bulk upload or a queue lets you place dozens of posts on the calendar in minutes instead of one at a time. Together, they turn a week of small daily tasks into two focused sessions. The scheduler also shows the batch as a whole, so you can spot two similar posts landing on the same day and move one.</p>
<h2>Common mistakes</h2>
<ul>
<li>Batching too far ahead, so posts feel stale or clash with news</li>
<li>Batching posts and then ignoring the account, when comments still need replies</li>
<li>Making every post in a batch look and sound the same</li>
<li>Skipping a final check of dates, links and offers before scheduling</li>
</ul>
<p>A week to a month ahead works for most people. Mix formats and angles inside each batch, and give the whole set one more read before it goes into the queue. Look for repeated openings, since a batch written in one sitting often starts every post the same way.</p>''',
 'charts': [
  {'type': 'columns', 'title': 'Hours per week, daily vs batched', 'sub': 'Time to make five posts a week', 'example': True,
   'rows': [('Made each day', 7.5, '7.5 h'), ('Batched in two sessions', 4.0, '4 h')], 'highlight': 'Batched in two sessions', 'labels': 'all', 'unit': 'Hours',
   'note': 'Made-up numbers for one person. Time yourself for a fair picture.'},
  {'type': 'steps', 'title': 'One way to batch a week', 'steps': [
   ('Monday', 'Brainstorm ten post ideas and pick seven.'),
   ('Tuesday', 'Write all seven captions.'),
   ('Wednesday', 'Film four short videos and take photos for three posts.'),
   ('Thursday', 'Edit the videos and design the graphics.'),
   ('Friday', 'Schedule the full week ahead and review last week\'s comments.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Load a finished batch with bulk upload or a queue, and see the whole week on one calendar.'},
  {'name': 'Notion', 'url': 'https://www.notion.so', 'domain': 'notion.so', 'line': 'A workspace for planning post ideas and tracking each batch.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool with reusable templates for making many graphics at once.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ("How far ahead should I batch social media content?", "Many people batch one to four weeks ahead. That gives a buffer without making posts feel out of date."),
  ("What is the difference between batching and bulk scheduling?", "Batching is creating many posts in one session. Bulk scheduling is loading many finished posts into a scheduler at once. People often do both."),
  ("Can I batch video content?", "Yes. Film several videos in one session by changing outfits, angles or locations between takes, then edit them together later."),
  ("What if news breaks after I batch?", "Check your queue and pause or move any post that no longer fits. Keep a few open slots so you can add timely posts."),
 ],
 'related': ['content-calendar', 'bulk-scheduling', 'content-pillars', 'queue', 'social-media-scheduling'],
},
{
 'slug': 'best-time-to-post',
 'short': "The best time to post is the day and hour when your own audience is most active and most likely to see and engage with your content.",
 'body': '''<h2>What is the best time to post?</h2>
<p>The best time to post is when the people you want to reach are on the app and ready to pay attention. Posting then gives your content a better start. Early views and comments help the algorithm decide whether to show a post to more people.</p>
<p>There is no single best time for everyone. A coffee shop's followers may scroll at breakfast. A gaming creator's fans may be online late at night. B2B audiences on LinkedIn often use it during the work week. Your best time comes from your own audience, and it can differ from one network to the next even for the same account.</p>
<h2>Why posting time matters</h2>
<p>Most feeds rank posts by interest, but timing still plays a part. If you post while your followers are asleep, your post competes with everything else that was shared by the time they wake up. A post that lands when they are active has a better shot at those first reactions.</p>
<p>That said, timing is a smaller factor than the post itself. A great post at an average time will usually beat a weak post at the perfect time. Think of good timing as a small boost on top of good content.</p>
<h2>How to find your best time to post</h2>
<ol>
<li><b>Check your analytics.</b> Many platforms show when your followers are online, by hour and day.</li>
<li><b>Look at your past posts.</b> Sort them by reach or engagement and note when the top ones went out.</li>
<li><b>Think about time zones.</b> If your audience lives across several regions, find the overlap or post more than once.</li>
<li><b>Test different slots.</b> Try a few time windows for several weeks each and compare results.</li>
<li><b>Recheck every few months.</b> Habits change with seasons and school terms.</li>
</ol>
<h2>What your data might show</h2>
<p>Here is a made-up example from one account. It posted at different times for a month and averaged the engagement rate for each slot. The evening slot came out ahead. A different account could see the opposite.</p>
<figure data-chart="1"></figure>
<p>Days matter as well as hours. Some accounts see weekdays and weekends behave very differently. A recipe account might do best on Sunday, when people plan meals. A business tips account might do best midweek. Group your posts by day and compare averages the same way.</p>
<figure data-chart="2"></figure>
<h2>How to test posting times</h2>
<figure data-chart="3"></figure>
<p>Keep everything else as steady as you can while you test. If you post your best format in one slot and your weakest in another, the result tells you about formats and says little about times. Rotate formats across slots so each time gets a fair mix. Write down each post's slot, format and result in a simple sheet. After a few weeks, sort by slot and the pattern is usually easy to see.</p>
<p>Timing also works hand in hand with frequency. Timing is when you post. Frequency is how often. Both matter, and they work together. Posting at a strong time every day may beat posting once a week at the perfect time. Find a steady pace you can keep, then fit those posts into your best time windows.</p>
<p>A scheduler helps here. Set up your best slots as a queue, and each new post drops into the next good time without you watching the clock.</p>
<h2>How timing differs across networks</h2>
<p>Each network has its own rhythm. Professional networks tend to be busiest during working hours, when people check them between meetings. Entertainment apps often peak in the evening and on weekends, when people have time to scroll. Chat-based places such as Discord servers follow the habits of each community, which may be late at night.</p>
<p>How long a post stays visible changes the stakes too. On a fast text feed, a post can drop out of view within hours, so timing matters more. On search-driven places such as Pinterest and YouTube, people may find a post weeks later, so the hour you publish matters less than the title and keywords.</p>
<h2>Common mistakes</h2>
<ul>
<li>Copying generic "best time" charts made from other people's accounts</li>
<li>Posting at exactly the top of the hour, when many scheduled posts go out at once</li>
<li>Judging a time slot from one post</li>
<li>Forgetting that your own time zone may differ from your audience's</li>
<li>Using the same time on every network, when each audience keeps its own habits</li>
</ul>''',
 'charts': [
  {'type': 'columns', 'title': 'Engagement by posting time', 'sub': 'Average engagement rate by followers for one account over a month', 'example': True,
   'rows': [('7 a.m.', 2.4, '2.4%'), ('10 a.m.', 2.9, '2.9%'), ('1 p.m.', 3.1, '3.1%'), ('4 p.m.', 2.7, '2.7%'), ('7 p.m.', 4.2, '4.2%'), ('10 p.m.', 3.0, '3.0%')], 'highlight': '7 p.m.', 'labels': 'all', 'unit': 'Engagement rate',
   'note': 'Made-up numbers for one account. Your best time will differ.'},
  {'type': 'columns', 'title': 'Engagement by day of the week', 'sub': 'Same account, same month', 'example': True,
   'rows': [('Mon', 2.6, '2.6%'), ('Tue', 3.0, '3.0%'), ('Wed', 3.4, '3.4%'), ('Thu', 3.1, '3.1%'), ('Fri', 2.5, '2.5%'), ('Sat', 2.2, '2.2%'), ('Sun', 3.8, '3.8%')], 'highlight': 'Sun', 'unit': 'Engagement rate',
   'note': 'Made-up numbers. Group your own posts by day to find your pattern.'},
  {'type': 'steps', 'title': 'Test your posting times', 'steps': [
   ('Pick three or four slots', 'Choose windows your analytics say are busy.'),
   ('Rotate for a few weeks', 'Post in each slot several times with a mix of formats.'),
   ('Compare rates', 'Average the engagement rate or reach for each slot.'),
   ('Set your queue', 'Make the winners your regular times, and recheck each season.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See your best times to post for each channel, based on your own results.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Scheduler', 'url': '/social-media-scheduler', 'line': 'Turn your best times into a queue so new posts land in the right slots.'},
  {'name': 'Best time to post', 'url': '/tools/best-time-to-post', 'line': 'Our free tool suggests starting times to test for each network.'},
 ],
 'list': 'social-media-scheduling-tools',
 'faqs': [
  ("What is the best time to post on Instagram?", "It depends on your followers. Open Insights on a professional account to see when they are most active, then test posts in those windows."),
  ("Does posting time really matter?", "It matters some, because early reactions help a post spread. The content itself still matters more than the exact hour."),
  ("Should I post at the same time every day?", "A regular schedule helps your audience know when to expect you, but test a few different times before you settle on one."),
  ("How do I handle followers in many time zones?", "Look for the hours when the most followers overlap, or post key content twice at different times. Your analytics show where followers live."),
 ],
 'related': ['posting-frequency', 'analytics', 'social-media-scheduling', 'queue', 'reach'],
},
{
 'slug': 'bio',
 'short': "A bio is the short description on your social media profile that tells people who you are and what they should do next.",
 'body': '''<h2>What is a social media bio?</h2>
<p>A bio is the text at the top of your profile, usually under your name and profile picture. It is often the first thing a new visitor reads when they decide whether to follow you. Most networks give you a small amount of space, so every word needs to earn its place.</p>
<p>A bio can include a one-line description, your location, a link, contact buttons and sometimes a category label. Many businesses add a call to action and a link to a website or link in bio page. Some networks also let you add pronouns, a pinned post or a highlight row right below it.</p>
<h2>Why your bio matters</h2>
<p>People decide fast. A visitor lands on your profile from a post they liked and gives your bio a few seconds. If it doesn't explain what you do and why they should care, many leave. A clear bio turns profile visits into follows and clicks.</p>
<p>It also helps search. Some platforms use words in your name and bio to match you with what people type, so a bio that says "vegan baker in Leeds" can show up when someone searches for exactly that.</p>
<h2>How to write a good bio</h2>
<figure data-chart="1"></figure>
<ol>
<li><b>Say what you do.</b> "Handmade leather wallets" is clearer than "Crafting dreams."</li>
<li><b>Say who it is for.</b> Name your audience if it helps, such as "for first-time home buyers."</li>
<li><b>Show proof.</b> Add a quick credential or result if you have one, such as years of experience or a product award.</li>
<li><b>Add personality.</b> A small detail or a touch of humor makes you memorable.</li>
<li><b>End with an action.</b> Tell people what to do next, such as "Shop new arrivals below" or "Book a free call."</li>
</ol>
<p>Write a long version first, then cut. Read it on your phone, since that is where most people will see it. If a line wraps awkwardly or a word breaks across lines, rework it.</p>
<p>Ask someone who doesn't know your work to read your bio and tell you what you do. If their answer matches what you meant, the bio works. If they hesitate or guess wrong, simplify the first line until they get it right away.</p>
<h2>Bio examples</h2>
<ul>
<li>"Plant-based meal prep for busy families. New recipes every Sunday. Get the free shopping list below."</li>
<li>"Wedding photographer in Austin. Calm, candid photos. Booking next year now."</li>
<li>"Bookkeeping for small online shops. Tips on taxes and cash flow. DM to work with us."</li>
<li>"Fixing old bikes in a tiny garage. Before and afters every Friday. Parts list in the link."</li>
</ul>
<p>Notice what these share. Each one names the thing, adds one detail that sets it apart and points to a next step. None of them tries to say everything.</p>
<h2>How bios differ across networks</h2>
<p>Each network sets its own space and style. Some allow only a line or two. Others give you room for a short paragraph, or add a separate "about" section with more detail. Professional networks expect a headline that names your role and what you help with. Short video apps reward a punchy line that matches the tone of your videos.</p>
<p>Keep the core message the same everywhere, so people recognize you. Then adjust the wording, the length and the call to action to fit each place. Check each app's current limit in the edit screen before you write.</p>
<p>If you run a business account, the bio is also where people look for practical facts. Add your service area, opening days or how fast you reply to messages if those help someone decide to get in touch.</p>
<h2>Bio vs link in bio</h2>
<p>Your bio is the text. A link in bio is the single link most profiles allow in that area. Because many networks give you only one or a few profile links, people often use a link in bio page that lists several links, such as a shop, a newsletter, a booking page and recent videos.</p>
<figure data-chart="2"></figure>
<h2>Common mistakes</h2>
<ul>
<li>Vague slogans that could belong to anyone</li>
<li>Long strings of emoji that hide the actual message</li>
<li>Outdated offers and broken links</li>
<li>Stuffing the bio with hashtags until it is hard to read</li>
<li>Fancy text fonts that screen readers can't read aloud</li>
</ul>
<p>Check your bio every few months. Update the link for new launches, remove expired offers and make sure it still describes what you do today.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Build a bio line by line', 'steps': [
   ('What you do', 'Name the product, service or topic in plain words.'),
   ('Who it is for', 'Add the audience if it makes the line clearer.'),
   ('Why you', 'One detail, credential or result that sets you apart.'),
   ('What to do next', 'A short call to action that points to your link.')]},
  {'type': 'versus', 'title': 'Bio vs link in bio', 'cols': ('Bio', 'Link in bio'), 'rows': [
   ('What it is', 'Text on your profile', 'A link, often to a page of links'),
   ('Tells people who you are', True, False),
   ('Sends people somewhere', False, True),
   ('Can hold several destinations', False, True),
   ('Should be updated for launches', 'Sometimes', True)]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Link in bio', 'url': '/link-in-bio', 'line': 'Make one page with all your links and point every profile to it.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter checks your bio length as you write.'},
  {'name': 'Bold text generator', 'url': '/tools/bold-text-generator', 'line': 'Our free tool makes bold text for a word or two, used sparingly.'},
 ],
 'faqs': [
  ("What should I put in my bio?", "Say what you do and what visitors should do next. Add a link and a personal detail if there is room."),
  ("Can I change my bio often?", "Yes. Updating your bio for launches, events or new offers is normal. Keep your core description steady so people recognize you."),
  ("Do keywords in a bio help?", "On some platforms, words in your name and bio help people find you in search. Use the words your audience would type, and keep it readable."),
  ("Should I use special fonts in my bio?", "Use them sparingly, if at all. Screen readers often can't read them, and search may not match them."),
 ],
 'related': ['link-in-bio', 'profile', 'avatar', 'handle', 'call-to-action'],
},
]

TERMS += [
{
 'slug': 'bluesky',
 'short': "Bluesky is an open, decentralized social network for short text posts, built on the AT Protocol, with posts of up to 300 characters.",
 'body': '''<h2>What is Bluesky?</h2>
<p>Bluesky is a microblogging network. It looks and feels a lot like early X (Twitter): you write short posts, follow people, reply, repost and like. Posts can be up to 300 characters and can include images, video, links and alt text.</p>
<p>What makes Bluesky different is what sits underneath. It runs on an open system called the AT Protocol. The goal is that your account and your followers are not locked to one company's app. Other apps and services can build on the same network, and in principle you can move your account to a different host and keep your followers.</p>
<h2>How Bluesky works</h2>
<ul>
<li><b>Handles.</b> Every account gets a handle. You can also use a domain name you own, such as @yourbrand.com, which proves you control that website.</li>
<li><b>Custom feeds.</b> Besides the main Following feed, anyone can build feeds around a topic, a community or a rule, and you can pin the ones you like.</li>
<li><b>Moderation choices.</b> Bluesky runs its own moderation, and you can add extra labeling services that hide or flag content based on your settings.</li>
<li><b>Starter packs.</b> Users can bundle accounts and feeds into a list that helps newcomers find people to follow.</li>
<li><b>Lists.</b> You can group accounts into lists to read them together or to mute or block them in bulk.</li>
</ul>
<p>Custom feeds are the part most new users miss. The Following feed shows posts from people you follow. Other feeds might show only posts about gardening, only posts from scientists or only posts with photos. Pin a few that fit your interests and the app starts to feel very different.</p>
<h2>Bluesky vs X and Threads</h2>
<p>All three are built around short text posts, but the room you get differs. A standard X post allows 280 characters, Threads allows 500 and Bluesky allows 300. Mastodon, another open network, allows 500 on default servers.</p>
<figure data-chart="1"></figure>
<p>X and Threads are run by single companies that control their feeds. Bluesky's open protocol lets people pick or build their own feeds and moderation tools. Mastodon is open too, but it uses a different protocol and a group of separate servers, each with its own rules.</p>
<figure data-chart="2"></figure>
<h2>Why Bluesky matters for brands and creators</h2>
<p>Bluesky attracts many writers, journalists, researchers, artists and tech fans. Conversations often feel close to how text social media used to work, with lots of replies and reposts. For brands, it can be a good place for real talk and community. Custom feeds also give niche topics a way to be found by the right people, even when an account is small.</p>
<p>The tone tends to reward people who show up as people. A brand that answers questions, shares useful links with a note and jokes along with its community often does better than one that posts only announcements.</p>
<h2>How to get started on Bluesky</h2>
<figure data-chart="3"></figure>
<p>Spend your first week listening. Read the feeds in your field, note who gets replies and how they write, then start joining threads where you have something to add. Your first followers often come from good replies more than from your own posts.</p>
<h2>How to write for 300 characters</h2>
<p>Three hundred characters is room for one clear idea. Lead with the point, cut filler words and use a link card when you need more space. If you have more to say, a short thread of two or three connected posts works well. Number them only if the order matters.</p>
<p>Links on Bluesky show as cards with a title and image, and the link text in the post can be shortened for you. Even so, add a line of your own on why the link is worth opening. A bare link with no comment rarely gets clicks.</p>
<p>When you cross-post from other networks, rewrite for the limit. A LinkedIn post that runs to 3,000 characters needs a fresh, short version. Chopping the long one off mid-sentence reads badly and loses the point.</p>
<h2>Common mistakes</h2>
<ul>
<li>Pasting the same promotional post you use everywhere, which tends to fall flat</li>
<li>Skipping alt text on images, which many Bluesky users expect</li>
<li>Posting links with no comment</li>
<li>Ignoring custom feeds, which are one of the best ways to be found</li>
<li>Leaving the default handle when you own a domain that would prove who you are</li>
</ul>''',
 'charts': [
  {'type': 'bars', 'title': 'Post limits on short-text networks', 'sub': 'Characters allowed in one post',
   'rows': [('Threads', 500, '500'), ('Mastodon', 500, '500'), ('Bluesky', 300, '300'), ('X', 280, '280')], 'highlight': 'Bluesky', 'unit': 'Characters',
   'note': "Limits used by Capybaroar's composer, November 2026. X is for standard accounts, Mastodon for default servers."},
  {'type': 'versus', 'title': 'Bluesky vs X', 'cols': ('Bluesky', 'X'), 'rows': [
   ('Post limit', '300 characters', '280 for standard accounts'),
   ('Built on an open protocol', True, False),
   ('Use your own domain as a handle', True, False),
   ('Pick feeds built by other people', True, False),
   ('Alt text on images', True, True)]},
  {'type': 'steps', 'title': 'Get started on Bluesky', 'steps': [
   ('Pick a handle', 'Use your own domain as the handle if you have one.'),
   ('Set up your profile', 'Clear bio and the same avatar as your other accounts.'),
   ('Find feeds and starter packs', 'Follow active accounts in your field.'),
   ('Join conversations', 'Reply where you have something useful to add.'),
   ('Post with alt text', 'Short, useful updates with descriptions on every image.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar for Bluesky', 'url': '/bluesky-scheduler', 'line': 'Schedule Bluesky posts next to your other channels, with a 300 character check.'},
  {'name': 'Character counter', 'url': '/tools/character-counter', 'line': 'Our free counter shows how much room is left in a 300 character post.'},
 ],
 'faqs': [
  ("How many characters can a Bluesky post have?", "A Bluesky post can have up to 300 characters. You can add images, video, a link card and alt text."),
  ("Is Bluesky free?", "Yes, creating an account and posting on Bluesky is free."),
  ("How do I use my website as my Bluesky handle?", "In your account settings, choose to change your handle to a domain you own, then add the record Bluesky gives you to your domain's DNS settings or website. Once it checks out, your handle becomes your domain."),
  ("Is Bluesky decentralized?", "It is built on the open AT Protocol, which is designed so accounts and data can move between services. Bluesky runs the main app and many of the core services today."),
  ("What is a custom feed on Bluesky?", "It is a feed anyone can build around a topic or rule, such as posts about birds or posts from teachers. You can pin feeds you like next to your Following feed."),
 ],
 'related': ['x-twitter', 'threads', 'mastodon', 'microblogging', 'handle'],
},
{
 'slug': 'boosted-post',
 'short': "A boosted post is an organic post you pay to show to more people, turning it into a simple ad without building a full ad campaign.",
 'body': '''<h2>What is a boosted post?</h2>
<p>A boosted post is a regular post that you pay to promote. You publish something on your page or profile, then press a Boost or Promote button. You pick a budget, a length of time and who you want to reach. The platform then shows your post as an ad to more people, often marked as sponsored.</p>
<p>Facebook and Instagram made the idea well known, and other networks offer similar options. It is the simplest form of paid social, since you don't need to set up campaigns in a full ads manager. Likes and comments people leave on the boosted version usually stay on the original post.</p>
<h2>How boosting works</h2>
<figure data-chart="1"></figure>
<p>The platform then runs a short review to check the post against its ad rules. Once it starts, you can watch results in the post's insights and stop the boost at any time. Some platforms won't let you boost posts with certain content, such as music you don't have rights to or claims that break their ad policies.</p>
<h2>Boosted post vs ad campaign</h2>
<p>A boosted post is quick and simple. A full ad campaign, built in an ads manager, gives you more control. You can set detailed goals, test several images, use custom audiences, place ads in more spots and create dark posts that only appear as ads.</p>
<figure data-chart="2"></figure>
<p>Boosting is a good start. As you spend more, a full campaign usually gives you better tools to measure and improve results. Many businesses use both: boosting for quick wins on posts that are already doing well, and campaigns for launches and steady sales.</p>
<h2>When to boost a post</h2>
<ul>
<li>A post is already getting strong engagement and you want more people to see it</li>
<li>You have a time-limited offer or event</li>
<li>You want to reach people in a specific area, such as near your store</li>
<li>You are testing which message gets the most interest before a bigger campaign</li>
</ul>
<p>The best posts to boost are ones that already worked with your followers. If a post got more saves, shares or comments than usual, people who are like your followers will probably respond too. Boosting a post that flopped organically rarely fixes it.</p>
<p>Timing matters too. Boost while the post is still fresh and the topic is current. A post about a weekend sale needs its boost to start days before the weekend, with enough time for people to see it and plan a visit.</p>
<h2>How to measure a boosted post</h2>
<p>Start with the goal you picked. If you chose website visits, look at link clicks and what people did on your site. If you chose messages, count the conversations that started. Then work out what each result cost by dividing what you spent by the number of results.</p>
<figure data-chart="3"></figure>
<p>Compare that cost across boosts. If one post brings clicks at half the cost of another, ask why. Maybe the image was clearer, the offer was stronger or the audience was a better fit. Add UTM tags to the link so your website analytics can tell boosted visits from organic ones.</p>
<p>Look past the first click as well. A boost that brings cheap clicks from people who leave your site at once is worth less than one with pricier clicks that turn into sales or sign-ups. Your website analytics shows what those visitors did next.</p>
<h2>How to set up a good boost</h2>
<ol>
<li><b>Pick one goal.</b> Choose the action you want, such as clicks, messages or profile visits.</li>
<li><b>Choose a tight audience.</b> Location, age and interests that match your real customers.</li>
<li><b>Start small.</b> Run a modest budget for a few days and check results before adding more.</li>
<li><b>Check the post on a phone.</b> Make sure the first line and the image make sense to a stranger.</li>
<li><b>Reply to comments.</b> Boosted posts draw comments from new people, and quick replies help.</li>
</ol>
<h2>Common mistakes</h2>
<ul>
<li>Boosting with no clear goal, so you get likes that never lead to sales</li>
<li>Aiming at a huge, broad audience instead of people who would care</li>
<li>Letting a boost run for weeks without checking it</li>
<li>Ignoring comments on the boosted post, including questions from buyers</li>
<li>Boosting a post with an expired offer or a broken link</li>
</ul>
<p>If a boost isn't working after a few days, stop it. Change the post or the audience, then try again with what you learned.</p>''',
 'charts': [
  {'type': 'steps', 'title': 'Boost a post in five steps', 'steps': [
   ('Choose a post', 'Pick one that already does well or one tied to an offer.'),
   ('Pick a goal', 'Engagement, profile visits, website visits or messages.'),
   ('Choose an audience', 'Target by location, age, interests or people like your followers.'),
   ('Set budget and length', 'A daily or total amount, and how many days to run.'),
   ('Review and launch', 'The platform checks the ad, then starts showing it.')]},
  {'type': 'versus', 'title': 'Boosted post vs full ad campaign', 'cols': ('Boosted post', 'Ad campaign'), 'rows': [
   ('Set up in a few taps', True, False),
   ('Starts from a post you already published', True, 'Optional'),
   ('Test several images or versions', False, True),
   ('Custom audiences and detailed goals', 'Limited', True),
   ('Ads that never appear on your page', False, True)]},
  {'type': 'formula', 'title': 'Cost per result', 'formula': 'Cost per result = amount spent ÷ number of results',
   'note': 'Made-up numbers to show the math.', 'result': '0.40 per click',
   'example': [('Amount spent', '50'), ('Link clicks', '125')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Find the organic posts with the strongest engagement, the best ones to boost.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free tool tags the link so you can tell boosted visits from organic ones.'},
  {'name': 'Meta Ads Manager', 'url': 'https://www.facebook.com/business/tools/ads-manager', 'domain': 'facebook.com', 'line': "Meta's tool for building full ad campaigns on Facebook and Instagram."},
  {'name': 'Meta Business Suite', 'url': 'https://www.facebook.com/business/tools/meta-business-suite', 'domain': 'facebook.com', 'line': "Meta's app for managing Facebook and Instagram business accounts."},
 ],
 'faqs': [
  ("What is the difference between boosting and promoting a post?", "They mean the same thing on most networks. Some platforms call the button Boost and others call it Promote."),
  ("Do boosted posts show as ads?", "Yes. People usually see a label such as Sponsored or Promoted on boosted posts."),
  ("Can I boost a post on Instagram?", "Yes, if you have a professional account. You can boost eligible posts and reels from the app with a budget and an audience you choose."),
  ("Is boosting worth it?", "It can be, when you boost the right posts to the right people with a clear goal. Track clicks and sales with UTM links so you can see what you get for what you spend."),
 ],
 'related': ['paid-social', 'sponsored-content', 'dark-post', 'organic-reach', 'target-audience'],
},
{
 'slug': 'brand-awareness',
 'short': "Brand awareness is how familiar people are with your brand: whether they recognize your name or logo and remember what you offer.",
 'body': '''<h2>What is brand awareness?</h2>
<p>Brand awareness is how well people know your brand. At the simplest level, it is whether someone has heard of you. At a deeper level, it is whether they remember your name when they need what you sell and can tell you apart from others.</p>
<p>Marketers often split it into two kinds. <b>Recognition</b> is when people know your logo or name when they see it. <b>Recall</b> is when they think of you without a prompt, for example when a friend asks for a good running shoe brand. Recall is harder to earn and worth more, because the person picks you before they see anyone else.</p>
<h2>Why brand awareness matters</h2>
<p>People rarely buy from a brand they have never heard of. Awareness is the first step of the customer journey. When someone knows and trusts your name, your ads work better, your posts get more clicks and your sales team has an easier first conversation.</p>
<p>Social media is one of the most direct ways to build that familiarity, because people see you again and again in their feeds. Each sighting is small. Over months, they add up to a name people feel they know.</p>
<h2>How to build brand awareness on social media</h2>
<ol>
<li><b>Show up often.</b> Regular posting keeps your name in front of people.</li>
<li><b>Look and sound the same.</b> Use steady colors and a consistent brand voice so people spot you fast.</li>
<li><b>Make shareable posts.</b> Helpful tips and funny takes get passed along to new people.</li>
<li><b>Work with creators.</b> Influencers and ambassadors introduce you to audiences that trust them.</li>
<li><b>Encourage user content.</b> Customers posting about you reach their own friends.</li>
<li><b>Use paid reach.</b> Ads aimed at awareness show your brand to many people at a set budget.</li>
</ol>
<p>Pick one or two places to start. A small brand that shows up well on one network builds more awareness than one that posts thinly on six.</p>
<h2>How to measure brand awareness</h2>
<ul>
<li><b>Reach and impressions.</b> How many people saw your content, and how often.</li>
<li><b>Follower growth.</b> How fast new people choose to follow you.</li>
<li><b>Mentions and tags.</b> How often people talk about you, tracked with social listening.</li>
<li><b>Share of voice.</b> Your share of the conversation in your market compared with others.</li>
<li><b>Branded search.</b> How many people search for your name.</li>
<li><b>Surveys.</b> Asking people whether they have heard of you.</li>
</ul>
<p>Share of voice is one of the clearest single numbers. It compares mentions of your brand with mentions of all the brands in your market over the same period.</p>
<figure data-chart="1"></figure>
<figure data-chart="2"></figure>
<h2>Watching awareness grow over time</h2>
<p>Awareness moves slowly, so look at it month by month. A rising line of mentions, follower growth or branded searches tells you more than any single viral post. Note what you did each month, such as a creator partnership or a new video series, so you can match changes in the line to the work behind them.</p>
<figure data-chart="3"></figure>
<p>Expect bumps. A launch or a big share can cause a spike that fades. What you want is a base that keeps rising after each spike, a sign that more people now know you than before.</p>
<h2>Awareness vs other goals</h2>
<p>Awareness is the top of the funnel. It fills the pool of people who might buy later. Goals like clicks, leads and sales sit further down. A healthy plan has both: posts that reach new people and posts that move known fans to act. If you judge awareness posts only on sales, you may cut the very work that feeds future sales.</p>
<p>Give awareness its own numbers and its own budget. Then judge it on reach, mentions and searches, and judge your sales posts on clicks and orders. Both kinds of post can live on the same calendar.</p>
<h2>Common mistakes</h2>
<ul>
<li>Stunts that get attention but leave no memory of what you do, so people remember the joke and forget the name</li>
<li>Expecting awareness to bring sales right away, when it is a long game judged over months</li>
<li>Changing your look so often that people never learn it</li>
<li>Counting reach alone, without checking whether mentions and searches grow too</li>
</ul>
<p>Tie creative ideas back to your product or message. The best awareness posts are ones people can describe to a friend afterward, with your name in the sentence.</p>''',
 'charts': [
  {'type': 'formula', 'title': 'Share of voice', 'formula': 'Share of voice = mentions of your brand ÷ mentions of all brands in your market × 100',
   'note': 'Made-up numbers to show the math.', 'result': '24%',
   'example': [('Your mentions', '360'), ('All brands\' mentions', '1,500')]},
  {'type': 'stack', 'title': 'Share of voice in one market', 'sub': 'Mentions over one month', 'example': True,
   'parts': [('Your brand', 24), ('Brand A', 38), ('Brand B', 21), ('Others', 17)],
   'note': 'Made-up numbers for a small market.'},
  {'type': 'line', 'title': 'Brand mentions per month', 'sub': 'Posts and comments that name the brand', 'example': True,
   'points': [('Jan', 180), ('Feb', 210), ('Mar', 340), ('Apr', 260), ('May', 300), ('Jun', 360)], 'unit': 'Mentions',
   'note': 'Made-up numbers. The March spike was a launch, and the base kept rising after it.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'Track reach and follower growth for every channel in one place.'},
  {'id': 'capybaroar', 'name': 'Capybaroar Inbox', 'url': '/social-media-inbox', 'line': 'See the comments and mentions of your brand from every channel together.'},
  {'name': 'Google Search Console', 'url': 'https://search.google.com/search-console', 'domain': 'google.com', 'line': "Google's free tool for seeing which searches bring people to your website."},
 ],
 'faqs': [
  ("How do you measure brand awareness on social media?", "Look at reach, impressions, follower growth, mentions and share of voice. Branded search and simple surveys add a fuller picture."),
  ("What is the difference between brand awareness and brand recognition?", "Recognition is one part of awareness. It means people know your name or logo when they see it, while awareness also includes whether they remember you on their own."),
  ("How long does it take to build brand awareness?", "It usually takes months of steady posting and outreach. Paid ads and creator partnerships can speed up early reach."),
  ("What is share of voice?", "It is your share of all the mentions in your market. Divide your mentions by the total for all brands you track, then multiply by 100."),
 ],
 'related': ['reach', 'impressions', 'share-of-voice', 'social-listening', 'word-of-mouth'],
},
{
 'slug': 'brand-voice',
 'short': "Brand voice is the steady personality and style a brand uses in its words, so every post, caption and reply sounds like it came from the same place.",
 'body': '''<h2>What is brand voice?</h2>
<p>Brand voice is how your brand sounds when it speaks. It covers the words you choose, how long your sentences are, whether you use humor, how formal you are and how you talk to customers. If your brand were a person, the voice would be their personality coming through in writing.</p>
<p>A strong brand voice is easy to spot. You could hide the logo on a caption and still guess who wrote it. That holds across every place you write: posts, replies, ads, emails and even error messages on your website.</p>
<h2>Brand voice vs tone</h2>
<p>Voice stays the same. Tone changes with the moment. A friendly, playful brand may joke in a product launch post, then switch to a calm, serious tone when replying to an upset customer. The personality is steady, while the mood fits the situation.</p>
<figure data-chart="1"></figure>
<p>A simple way to plan tone is to list the moments you write in most, such as launches, tips, replies to praise, replies to complaints and posts about serious news. For each one, note how far you dial the voice up or down. A playful brand might keep jokes for launches and tips, and drop them for complaints.</p>
<h2>Why brand voice matters</h2>
<ul>
<li>It makes you memorable in a crowded feed.</li>
<li>It builds trust, since people know what to expect.</li>
<li>It helps many writers sound like one brand, including team members, agencies and AI tools.</li>
<li>It speeds up writing, because you have fewer choices to make on every post.</li>
</ul>
<p>It also protects you as you grow. When a second person starts writing posts, or an agency takes over, a written voice guide is what keeps the account from sounding like a different company overnight.</p>
<h2>How to define your brand voice</h2>
<figure data-chart="2"></figure>
<ol>
<li><b>Start with your audience.</b> Think about how they talk and what they respond to.</li>
<li><b>Pick a few traits.</b> Choose words like "warm," "direct" or "nerdy," and add what each one means in practice.</li>
<li><b>Write do and don't lists.</b> For example: do use short sentences; don't use slang we wouldn't say out loud.</li>
<li><b>Collect examples.</b> Save posts that sound right and posts that sound wrong, with notes on why.</li>
<li><b>Keep a word list.</b> Note product names, phrases you always use and words you avoid.</li>
<li><b>Share it.</b> Put your voice guide where everyone who writes for you can find it, and give it to AI writing tools as instructions.</li>
</ol>
<h2>Examples</h2>
<p>A budget airline might write: "Cheap seats, big views. Grab a window before Friday." A private bank might write: "Plan your next chapter with a dedicated advisor." Both are clear. They just sound like very different brands, because they serve very different people.</p>
<p>Here is how one made-up brand, a bike repair shop with a "friendly and direct" voice, might handle two moments. A tip post: "Squeaky brakes? Nine times out of ten it's dirt. Wipe the rim, test, done." A reply to a complaint: "Sorry your repair took longer than we said. That's on us. Can we call you today to sort it out?" Same voice. Different tone.</p>
<h2>How to use brand voice with AI tools</h2>
<p>AI writing tools pick up voice from what you give them. Paste your voice guide, a handful of your best posts and your list of words to avoid into the instructions. Ask for a draft, then compare it with your examples. If it drifts, point out the exact line and say why it's off. Keep edited drafts as new examples, so the guide gets better over time.</p>
<p>The same goes for agencies and freelancers. Send your guide before their first draft, along with a few of your best posts and one or two that missed the mark.</p>
<p>Read every AI draft before it goes out. Tools tend to fall back on stock phrases and upbeat filler, which is the opposite of a distinct voice. Strike those phrases and add them to your list of words to avoid.</p>
<h2>Common mistakes</h2>
<ul>
<li>Copying the voice of a famous brand instead of finding your own</li>
<li>Choosing traits that sound nice but don't change anything, like "professional" alone</li>
<li>Writing a voice guide once and never updating it as your audience grows</li>
<li>Keeping one tone for everything, including serious moments</li>
</ul>
<p>Be specific enough that a new writer would know what to do. "We use contractions, short sentences and one joke at most per post" is a guide. "We are fun" is a wish.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Brand voice vs tone', 'cols': ('Voice', 'Tone'), 'rows': [
   ('Stays the same everywhere', True, False),
   ('Changes with the moment', False, True),
   ('Example', 'Friendly and direct', 'Playful at launch, calm in a complaint'),
   ('Written in your voice guide', True, 'As notes for each moment')]},
  {'type': 'steps', 'title': 'Write a brand voice guide', 'steps': [
   ('Study your audience', 'How they talk and what they respond to.'),
   ('Pick traits', 'A few words, each with what it means in practice.'),
   ('List dos and don\'ts', 'Short rules a new writer can follow.'),
   ('Collect examples', 'Posts that sound right and wrong, with notes.'),
   ('Share it', 'With your team, agencies and AI tools.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar AI agent', 'url': '/#agents', 'line': 'Plans and writes posts as drafts that your team edits and approves, on paid plans.'},
  {'name': 'Notion', 'url': 'https://www.notion.so', 'domain': 'notion.so', 'line': 'A workspace for keeping your voice guide and examples where every writer can find them.'},
  {'name': 'Claude', 'url': 'https://claude.ai', 'domain': 'claude.ai', 'line': "Anthropic's AI assistant, useful for drafting in your voice when you give it your guide and examples."},
 ],
 'faqs': [
  ("How do I find my brand voice?", "Look at who your audience is, pick a few personality traits that fit your brand and write examples of posts that match them. Test them and adjust based on how people respond."),
  ("What is an example of brand voice?", "A brand with a playful voice might write short, punny captions with casual words. A brand with an expert voice might use clear, calm explanations and fewer jokes."),
  ("Can AI write in my brand voice?", "It can get close if you give it a clear voice guide, sample posts and words to avoid. Review and edit what it writes before posting."),
  ("Should my voice change on each network?", "The voice should stay the same, while the format and tone can shift. A LinkedIn post may be longer and calmer than a TikTok caption, yet both should sound like you."),
 ],
 'related': ['authenticity', 'social-media-policy', 'content-pillars', 'ai-generated-content', 'caption'],
},
{
 'slug': 'broadcast-channel',
 'short': "A broadcast channel is a one-to-many messaging feature where a creator or brand sends updates to followers who join, usually without open replies.",
 'body': '''<h2>What is a broadcast channel?</h2>
<p>A broadcast channel is like a group chat where only the host talks. A creator or brand posts messages, and everyone who joined the channel gets them, often with a notification. Followers can usually react or vote in polls, but they can't start conversations in the main thread.</p>
<p>Instagram offers broadcast channels inside its messaging inbox. Other apps have similar features, such as WhatsApp Channels, Telegram channels and announcement channels on Discord servers. The exact options differ by app and change over time, so check each one's current settings before you plan around a feature.</p>
<p>Hosts usually share a mix of these:</p>
<ul>
<li>Short text updates and behind-the-scenes notes</li>
<li>Photos and short videos</li>
<li>Voice notes</li>
<li>Polls and quick questions</li>
<li>Early news and exclusive offers</li>
<li>Links to new posts, so members see them first</li>
</ul>
<p>Variety keeps members opening messages. A voice note feels personal in a way text can't, and a quick poll gives people something to do. Mix formats from week to week and watch which ones get the most reactions.</p>
<h2>Why broadcast channels matter</h2>
<p>Feeds are ranked by algorithms, so many followers never see a given post. A broadcast channel lands in the inbox of people who chose to join, which makes it feel closer and more direct. It is a good way to reward your biggest fans with first looks and personal updates.</p>
<p>It also gives you a small, engaged group to test ideas with before you post them widely. Ask members which of two product names they like, or which topic they want next, and you have an answer within hours.</p>
<p>Channels can help with reach too. Many hosts drop a link when a new video or post goes live. Members open it right away, and those first views and comments give the post a stronger start in the main feed.</p>
<h2>Broadcast channel vs group chat</h2>
<p>In a group chat, everyone can post and reply. In a broadcast channel, the host posts and members mostly react. That makes channels easier to run with a large audience, since there is far less to moderate. If you want open discussion, a community group, a Discord server or a Facebook group may suit you better.</p>
<figure data-chart="1"></figure>
<h2>How to start and grow a broadcast channel</h2>
<figure data-chart="2"></figure>
<p>Your first members will come from your most loyal followers, so the launch matters. Tell them clearly what they get that the main feed doesn't, and deliver it in the first week. A strong first few messages set the tone and keep people from muting you.</p>
<p>Keep promoting the channel after launch. Mention it in Stories now and then, pin it in your bio and point to it when you share something there first. "Members saw this yesterday" is a simple, honest nudge.</p>
<h2>How to use a broadcast channel well</h2>
<ol>
<li><b>Give people a reason to join.</b> Promise something specific, such as early drops or weekly tips.</li>
<li><b>Keep it personal.</b> Write casually, like a note to friends, and share things you don't post elsewhere.</li>
<li><b>Ask for input.</b> Use polls and emoji reactions to see what members want.</li>
<li><b>Post at a steady pace.</b> Too many messages lead to people muting or leaving the channel.</li>
<li><b>Keep messages short.</b> People read channels on their phones between other things. One idea per message is plenty.</li>
</ol>
<h2>How to measure a broadcast channel</h2>
<p>Most apps show the number of members, and some show how many people saw or reacted to each message. Watch the trend in members after each message. If you lose people after a certain kind of update, send fewer of those. Poll results and reactions show what members enjoy. Track clicks on links you share in the channel with a UTM tag, so you can compare channel traffic with traffic from your main posts.</p>
<h2>Common mistakes</h2>
<ul>
<li>Treating the channel as another ad feed and posting only promotions, so members leave quickly</li>
<li>Starting strong and then going silent for months</li>
<li>Posting the same content that is already in the main feed</li>
<li>Sending several messages in a row, each with its own notification</li>
</ul>
<p>Plan a simple rhythm, such as one or two messages a week, that you can keep up. A small channel that people look forward to is worth more than a big one they've muted.</p>''',
 'charts': [
  {'type': 'versus', 'title': 'Broadcast channel vs group chat', 'cols': ('Broadcast channel', 'Group chat'), 'rows': [
   ('Who posts', 'The host', 'Everyone'),
   ('Members can react and vote', True, True),
   ('Open replies in the main thread', False, True),
   ('Easy to run with a big audience', True, False),
   ('Needs much moderation', False, True)]},
  {'type': 'steps', 'title': 'Launch a broadcast channel', 'steps': [
   ('Decide the promise', 'Early drops, weekly tips or behind-the-scenes notes.'),
   ('Start the channel', 'Create it and write a short welcome message.'),
   ('Invite your followers', 'Share it in Stories, posts and your bio.'),
   ('Deliver in week one', 'Send something members can\'t get in the main feed.'),
   ('Settle a rhythm', 'One or two messages a week, with polls now and then.')]},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar for Discord', 'url': '/discord-message-scheduler', 'line': 'Schedule messages to your Discord server\'s channels, such as an announcements channel.'},
  {'name': 'Canva', 'url': 'https://www.canva.com', 'domain': 'canva.com', 'line': 'A design tool for quick graphics to share with channel members.'},
  {'name': 'UTM builder', 'url': '/tools/utm-builder', 'line': 'Our free tool tags the links you share so you can see what the channel sends.'},
 ],
 'faqs': [
  ("How do Instagram broadcast channels work?", "A creator or professional account starts a channel and invites followers to join. Members get the host's messages in their inbox and can react and vote in polls, but usually can't post in the channel."),
  ("Can followers reply in a broadcast channel?", "Usually not in the main thread. They can react to messages and take part in polls or prompts, and some apps add limited ways to respond."),
  ("Who can start a broadcast channel?", "It depends on the app. On Instagram, the feature is available to creator and business accounts in supported regions."),
  ("How often should I post in a broadcast channel?", "One or two messages a week works for many hosts. Post often enough to stay in mind, and rarely enough that people don't mute you."),
 ],
 'related': ['whatsapp-channels', 'direct-message', 'subscriber', 'community-management', 'instagram'],
},
]
