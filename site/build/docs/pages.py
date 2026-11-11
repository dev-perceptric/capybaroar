# Capybaroar docs: sections and pages. Every fact here comes from the app (src/lib/networks.ts, the providers,
# creditRules.ts, billing.ts) or the live pricing page. Network pages are drawn from facts.json plus NET below.
# Page keys: slug, section, title, lead, body (HTML), app (where "Open in Capybaroar" goes), shot (image key), related.

SECTIONS = [
    ('start', 'Get started'),
    ('channels', 'Channels'),
    ('ai', 'AI agent and MCP'),
]

PAGES = [
{
 'slug': 'welcome', 'section': 'start', 'title': 'What is Capybaroar?', 'app': '/calendar', 'shot': 'calendar',
 'lead': 'Capybaroar is an agentic social media platform: an AI agent plans and writes your posts, and you schedule them to 12 networks from one calendar.',
 'body': '''<h2 id="what-you-can-do">What you can do</h2>
<ul>
<li><b>Calendar:</b> plan, write and schedule posts for every channel in one place, with a preview for each network.</li>
<li><b>Agents:</b> ask for a week of posts in one message. The agent writes them as drafts for you to check.</li>
<li><b>Inbox:</b> answer comments and mentions from your channels without switching apps.</li>
<li><b>Analytics and Reports:</b> see reach, engagement and your best times to post, then share a report.</li>
<li><b>Link in bio:</b> one page for every link you share.</li>
<li><b>MCP and API:</b> use Capybaroar from Claude, ChatGPT or Cursor, or from your own code.</li>
</ul>
<h2 id="networks">The 12 networks</h2>
<p>Instagram, Facebook, TikTok, LinkedIn profiles, LinkedIn Pages, YouTube, X, Threads, Pinterest, Bluesky, Mastodon and Discord. Each one has its own page in these docs with what you can post and how to connect it.</p>
<h2 id="plans">Plans</h2>
<p>The Free plan covers 3 channels and 30 scheduled posts a month for 1 person. Creator, Pro and Agency add more channels, AI credits, teammates, brands and approvals. New accounts get 14 days of Pro free, with no card needed. See <a href="/pricing">Pricing</a> for every limit.</p>
<h2 id="next">Where to start</h2>
<ol>
<li><a href="/docs/create-account">Create your account</a></li>
<li><a href="/docs/connect-a-channel">Connect your first channel</a></li>
<li><a href="/docs/schedule-your-first-post">Schedule your first post</a></li>
</ol>''',
 'related': ['create-account', 'connect-a-channel', 'agent'],
},
{
 'slug': 'create-account', 'section': 'start', 'title': 'Create your account', 'app': '/signup', 'shot': None,
 'lead': 'Sign up with your email in under a minute. You start on 14 days of Pro, free, with no card.',
 'body': '''<h2 id="steps">Steps</h2>
<ol class="dx-steps">
<li><b>Open the sign-up page.</b> Go to <a href="https://app.capybaroar.com/signup">app.capybaroar.com/signup</a>.</li>
<li><b>Fill in the form.</b> Enter your name, company, email and a password, then press <b>Create account</b>.</li>
<li><b>Follow the welcome steps.</b> The welcome screen walks you through two things: <b>Connect a channel</b> and <b>Schedule a post</b>.</li>
</ol>
<h2 id="trial">Your free trial</h2>
<p>New workspaces get 14 days of Pro with 200 AI credits. You don't need a card. When the trial ends you move to the Free plan unless you pick a paid plan, and your posts and channels stay where they are.</p>
<h2 id="team">Inviting your team</h2>
<p>Pro includes 5 members and Agency includes 15. Clients who only approve posts don't take a seat. Invite people from <b>Settings</b>.</p>''',
 'related': ['connect-a-channel', 'welcome'],
},
{
 'slug': 'connect-a-channel', 'section': 'start', 'title': 'Connect your first channel', 'app': '/channels', 'shot': 'channels',
 'lead': 'A channel is one social account Capybaroar can post to, like your Instagram account or your LinkedIn Page.',
 'body': '''<h2 id="steps">Steps</h2>
<ol class="dx-steps">
<li><b>Open Channels.</b> Click <b>Channels</b> in the sidebar.</li>
<li><b>Pick a network.</b> Click the network you want to add.</li>
<li><b>Sign in and approve.</b> Most networks open their own sign-in page. Sign in with the account you post from and approve Capybaroar. Bluesky and Discord ask for details in a short form instead.</li>
<li><b>Check it's connected.</b> You land back on Channels, and the new channel shows as <b>Connected</b>. Post to it from the calendar.</li>
</ol>
<h2 id="how-each-connects">How each network connects</h2>
<div class="scroll"><table class="cmp"><thead><tr><th scope="col">Network</th><th scope="col">How you connect</th></tr></thead><tbody>
<tr><th scope="row"><a href="/docs/instagram">Instagram</a>, <a href="/docs/facebook">Facebook</a>, <a href="/docs/threads">Threads</a></th><td>Sign in with Meta</td></tr>
<tr><th scope="row"><a href="/docs/tiktok">TikTok</a></th><td>Sign in with TikTok</td></tr>
<tr><th scope="row"><a href="/docs/linkedin">LinkedIn</a></th><td>Sign in with LinkedIn, for your profile or a Page you manage</td></tr>
<tr><th scope="row"><a href="/docs/youtube">YouTube</a></th><td>Sign in with the Google account that owns the channel</td></tr>
<tr><th scope="row"><a href="/docs/x">X</a>, <a href="/docs/pinterest">Pinterest</a></th><td>Sign in with that network</td></tr>
<tr><th scope="row"><a href="/docs/mastodon">Mastodon</a></th><td>Type your server, then sign in there</td></tr>
<tr><th scope="row"><a href="/docs/bluesky">Bluesky</a></th><td>Your handle and an app password</td></tr>
<tr><th scope="row"><a href="/docs/discord">Discord</a></th><td>A webhook link for the channel</td></tr>
</tbody></table></div>
<h2 id="reconnect">When a channel says Reconnect</h2>
<p>Networks sign apps out from time to time, for example after a password change. Click <b>Reconnect</b> on the channel and sign in again. Scheduled posts stay in place.</p>
<h2 id="limits">How many channels you can add</h2>
<p>Free covers 3 channels, Creator 8, Pro 30 and Agency 100.</p>''',
 'related': ['schedule-your-first-post', 'instagram', 'linkedin'],
},
{
 'slug': 'schedule-your-first-post', 'section': 'start', 'title': 'Schedule your first post', 'app': '/calendar', 'shot': 'composer',
 'lead': 'Write a post once, check how it looks on each network, then schedule it, queue it or post it now.',
 'body': '''<h2 id="steps">Steps</h2>
<ol class="dx-steps">
<li><b>Open the calendar.</b> Click <b>Calendar</b>, then <b>New post</b>.</li>
<li><b>Pick channels.</b> Choose one or more connected channels at the top of the editor.</li>
<li><b>Write your post.</b> Type your text. The counter shows how much room each network has left.</li>
<li><b>Add pictures or a video.</b> Upload files or pick them from your media. Some networks need media, like Instagram, TikTok, YouTube and Pinterest.</li>
<li><b>Set network options.</b> Click a channel's tab to change things for that network only, like an Instagram Reel, a YouTube title or a Pinterest board. You can also change the text for one network.</li>
<li><b>Check the preview.</b> The right side shows how the post will look on each network. Click a video to play it.</li>
<li><b>Choose when it goes out.</b>
<ul><li><b>Schedule:</b> pick a date and time.</li><li><b>Add to queue:</b> put it in your next open queue time.</li><li><b>Post now:</b> publish right away.</li><li><b>Save draft:</b> keep it for later.</li></ul></li>
</ol>
<h2 id="after">After it posts</h2>
<p>Open the post again from the calendar to see each channel's result. When a network gives Capybaroar the post's address, an <b>Open post</b> link shows next to that channel. If a network turns a post down, its reason shows in the same place.</p>
<h2 id="tips">Tips</h2>
<ul>
<li>Use a first comment on Instagram, Facebook and LinkedIn for links or hashtags.</li>
<li>Upload many posts at once with <b>Bulk</b> in the calendar.</li>
<li>Let the <a href="/docs/agent">agent</a> write a whole week of drafts, then edit and schedule them here.</li>
</ul>''',
 'related': ['connect-a-channel', 'agent', 'plan-a-week'],
},
{
 'slug': 'agent', 'section': 'ai', 'title': 'The AI agent', 'app': '/agents', 'shot': 'agent',
 'lead': 'The agent is Claude with every Capybaroar action. Tell it what you need and it plans and writes posts, makes pictures and checks your results.',
 'body': '''<h2 id="what-it-does">What the agent can do</h2>
<ul>
<li>Look at your channels and recent posts, then plan and write new ones.</li>
<li>Save posts as drafts at your queue times, or schedule them when you ask.</li>
<li>Make pictures and videos for posts and attach them when they're ready.</li>
<li>Read your analytics and tell you which posts did best.</li>
<li>Edit or delete posts. It asks before deleting.</li>
</ul>
<p>It uses the same actions and checks you do, so it can't go past your plan's limits or post to a channel you can't use.</p>
<h2 id="start">Start a chat</h2>
<ol class="dx-steps">
<li><b>Open Agents.</b> Click <b>Agents</b> in the sidebar, then <b>New chat</b>.</li>
<li><b>Say what you want.</b> For example: "Plan next week for our bakery launch: one LinkedIn post a day, Monday to Friday at 10 AM. Save them as drafts."</li>
<li><b>Check the drafts.</b> The agent tells you what it saved. Open them in the calendar to edit, then schedule.</li>
</ol>
<h2 id="drafts">Drafts first</h2>
<p>The agent saves drafts unless you ask it to schedule. Nothing goes out until you, or the agent on your request, schedule it.</p>
<h2 id="cost">What it costs</h2>
<p>The agent is on paid plans and uses <a href="/docs/ai-credits">AI credits</a>. Each message costs what it really used, with a small minimum. Pictures and videos it makes are charged on their own.</p>''',
 'related': ['plan-a-week', 'ai-credits', 'mcp'],
},
{
 'slug': 'plan-a-week', 'section': 'ai', 'title': 'Plan a week of posts with the agent', 'app': '/agents', 'shot': 'agent',
 'lead': 'One message, five days of drafts. Here is how to ask so the first try is close to right.',
 'body': '''<h2 id="steps">Steps</h2>
<ol class="dx-steps">
<li><b>Open a new chat</b> in <b>Agents</b>.</li>
<li><b>Give the topic and the goal.</b> "We're launching a sourdough class on the 20th. Get sign-ups."</li>
<li><b>Name the channels and the rhythm.</b> "One LinkedIn post and one Instagram post a day, Monday to Friday."</li>
<li><b>Say when.</b> "At my queue times" or "at 9 AM New York time".</li>
<li><b>Say what to save.</b> "Save them as drafts." The agent saves drafts by default anyway.</li>
<li><b>Review in the calendar.</b> Open each draft, tweak it, check the preview and schedule.</li>
</ol>
<h2 id="prompts">Prompts to copy</h2>
<ul>
<li>"Look at my channels and recent posts, then write a week of posts about [topic]. Save them as drafts at my next queue times."</li>
<li>"Turn this article into a LinkedIn post and an X post, and save both as drafts: [link]"</li>
<li>"Make a picture for each draft this week and attach it."</li>
<li>"Show my results for the last 30 days and tell me which posts did best."</li>
</ul>
<h2 id="better">Getting better results</h2>
<ul>
<li>Paste a few of your best past posts so it can match your voice.</li>
<li>Give facts it can't guess: prices, dates, names and links.</li>
<li>Ask for changes in the same chat: "Make Wednesday's shorter and add a question."</li>
</ul>''',
 'related': ['agent', 'ai-credits', 'schedule-your-first-post'],
},
{
 'slug': 'ai-credits', 'section': 'ai', 'title': 'AI credits', 'app': '/settings', 'shot': None,
 'lead': 'Everything AI in Capybaroar draws from one credit balance: the agent, writing help, pictures, videos and voiceovers.',
 'body': '''<h2 id="per-plan">Credits on each plan</h2>
<div class="scroll"><table class="cmp"><thead><tr><th scope="col">Plan</th><th scope="col">AI credits a month</th></tr></thead><tbody>
<tr><th scope="row">Free</th><td><span class="no">&ndash;</span></td></tr>
<tr><th scope="row">Creator</th><td>1,000</td></tr>
<tr><th scope="row">Pro</th><td>2,500</td></tr>
<tr><th scope="row">Agency</th><td>8,000</td></tr>
<tr><th scope="row">Pro trial (14 days)</th><td>200</td></tr>
</tbody></table></div>
<p>Plan credits refill on your billing date each month, on yearly plans too. Unused ones don't carry over.</p>
<h2 id="costs">What things cost</h2>
<ul>
<li><b>Rewrite, fit to a network, suggested reply or caption:</b> 4 credits.</li>
<li><b>Build a link in bio page with AI:</b> 50 credits.</li>
<li><b>An agent message:</b> what it really used, at least 2 credits. Long jobs, like a week of posts with pictures, use more.</li>
<li><b>Pictures and videos:</b> priced by the model and length. A short video costs the most.</li>
</ul>
<p>1,000 credits make about 125 images, or about 6 weeks of posts planned by the agent. If something fails, you get its credits back.</p>
<h2 id="top-up">Buying more</h2>
<p>On a paid plan you can buy packs: 1,000 credits for $12, 5,000 for $50 or 20,000 for $160. Bought credits last 12 months and are used after your plan credits. You can also turn on automatic top-up, which buys a pack when your balance gets low.</p>
<h2 id="agency">Limits per client</h2>
<p>On Agency you can cap how many credits each client brand uses a month, so one client can't use up the whole pool.</p>''',
 'related': ['agent', 'rewrite-with-ai', 'mcp'],
},
{
 'slug': 'rewrite-with-ai', 'section': 'ai', 'title': 'Rewrite and fit posts with AI', 'app': '/calendar', 'shot': 'composer',
 'lead': 'In the post editor, AI can rewrite your text, fit it to each network and suggest replies in the Inbox.',
 'body': '''<h2 id="rewrite">Rewrite a post</h2>
<ol class="dx-steps">
<li><b>Open a post</b> in the calendar, or click <b>New post</b>.</li>
<li><b>Write a first version</b>, even a rough one.</li>
<li><b>Press Rewrite</b> in the text toolbar, or Ctrl+J, and keep the version you like.</li>
</ol>
<h2 id="fit">Fit to each network</h2>
<p>One post rarely fits every network as is. X has 280 characters and LinkedIn has 3,000. Open a channel's tab and change the text for that network only, or ask AI to fit it. Each network's preview updates as you go.</p>
<h2 id="replies">Suggested replies in the Inbox</h2>
<p>In the <b>Inbox</b>, open a comment and press <b>Suggest reply</b>. Edit the draft and send it.</p>
<h2 id="cost">What it costs</h2>
<p>Each rewrite, fit, caption or suggested reply costs 4 <a href="/docs/ai-credits">AI credits</a>. AI writing is on paid plans.</p>''',
 'related': ['ai-credits', 'schedule-your-first-post', 'agent'],
},
{
 'slug': 'mcp', 'section': 'ai', 'title': 'Use Capybaroar from Claude, ChatGPT or Cursor', 'app': '/settings', 'shot': 'settings',
 'lead': 'Capybaroar has an MCP server, so the AI you already use can plan, write and schedule posts in your account. It is on every plan, Free too.',
 'body': '''<h2 id="claude">Claude: sign in</h2>
<p>Claude connects with your Capybaroar sign-in, so there is no key to copy.</p>
<ol class="dx-steps">
<li>In Claude, open <b>Settings</b>, then <b>Connectors</b>.</li>
<li>Press <b>Add custom connector</b>, name it Capybaroar and paste <code>https://app.capybaroar.com/api/mcp</code></li>
<li>Press <b>Connect</b>, sign in to Capybaroar, pick the workspace and press <b>Allow</b>.</li>
<li>Start a new chat.</li>
</ol>
<p>In Claude Code, run this and sign in when it asks:</p>
<pre><code>claude mcp add --transport http capybaroar https://app.capybaroar.com/api/mcp</code></pre>
<p>Apps you connect this way are listed in <b>Settings</b>, <b>API and MCP</b>, under <b>Connected apps</b>. Press <b>Remove</b> to cut one off.</p>
<h2 id="link">Other apps: copy your MCP link</h2>
<ol class="dx-steps">
<li>In Capybaroar, open <b>Settings</b>, then <b>API and MCP</b>.</li>
<li>Press <b>New key</b> and copy the <b>MCP link</b>. It looks like <code>https://app.capybaroar.com/api/mcp/cbr_...</code></li>
</ol>
<p class="dx-note">Keep the link private. Anyone with it can post as you. You only see it once, so make a new key if you lose it.</p>
<h2 id="chatgpt">ChatGPT</h2>
<ol class="dx-steps">
<li>Open <b>Settings</b>, then <b>Apps and Connectors</b>.</li>
<li>Under <b>Advanced</b>, turn on <b>Developer mode</b>. This needs a paid ChatGPT plan.</li>
<li>Press <b>Create</b>, name it Capybaroar and paste your link.</li>
<li>In a new chat, open <b>+</b> and pick Capybaroar.</li>
</ol>
<h2 id="cursor">Cursor</h2>
<p>Open <b>Cursor Settings</b>, then <b>MCP</b>, press <b>Add new MCP server</b> and paste this with your link:</p>
<pre><code>{
  "mcpServers": {
    "capybaroar": { "url": "https://app.capybaroar.com/api/mcp/cbr_your_key" }
  }
}</code></pre>
<h2 id="try">Try it</h2>
<ul>
<li>"Use Capybaroar. Look at my channels and recent posts, then write a week of posts about [topic]. Save them as drafts at my next queue times."</li>
<li>"Use Capybaroar. List everything scheduled for this week."</li>
<li>"Use Capybaroar. Show my results for the last 30 days and tell me which posts did best."</li>
</ul>
<h2 id="tools">What your AI can do</h2>
<p>List channels, brands and channel groups; create, update, list and delete posts; find the next queue time; upload and list media; make pictures and videos (with an MCP link); read analytics and credits; and manage webhooks. The <a href="/api">API docs</a> list every action in detail.</p>''',
 'related': ['agent', 'ai-credits', 'welcome'],
},
]

# Extra copy for each network page; the rest (limits, settings, inbox, analytics) comes from facts.json.
NET = {
 'instagram': {'title': 'Instagram', 'nav': 'instagram', 'page': '/instagram-post-scheduler',
   'connect': 'Click Instagram in Channels and sign in with Meta. Pick the Instagram account you post from and approve Capybaroar.',
   'notes': ['Instagram only lets apps post to professional accounts (business or creator). You can switch for free in the Instagram app under account settings.',
             'A post needs at least one picture or video. A Reel is one video, and a Story is one picture or video.',
             'A post takes up to 10 files, which Instagram shows as a carousel.',
             'Add a cover for a Reel from its tab, and a first comment for hashtags or links.'],
   'errors': [('Instagram needs a picture or video', 'Add a picture or video. Instagram doesn\'t take text-only posts.'),
              ('An Instagram Reel is one video', 'Remove extra files, or set the format back to Post.'),
              ('An Instagram Story is one picture or video', 'Keep one file for a Story.'),
              ('Instagram takes up to 10 files', 'Remove files until there are 10 or fewer.')]},
 'facebook': {'title': 'Facebook', 'nav': 'facebook', 'page': '/facebook-post-scheduler',
   'connect': 'Click Facebook in Channels, sign in with Meta and pick the Facebook Pages you want to add. Capybaroar posts to Pages.',
   'notes': ['Choose Post, Reel or Story in the Facebook tab.',
             'A post takes one video, or pictures only. A Reel is one video, and a Story is one picture or video.',
             'Add a first comment for links or extra details.'],
   'errors': [('Facebook takes one video, or pictures only', 'Use one video on its own, or only pictures.'),
              ('A Facebook Reel is one video', 'Keep one video for a Reel.'),
              ('A Facebook Story is one picture or video', 'Keep one file for a Story.')]},
 'tiktok': {'title': 'TikTok', 'nav': 'tiktok', 'page': '/tiktok-scheduler',
   'connect': 'Click TikTok in Channels, sign in with TikTok and approve Capybaroar. TikTok always shows its approval page, with Switch account if you want a different account.',
   'notes': ['Every TikTok post is one video, with a caption of up to 2,200 characters.',
             'The TikTok tab shows the account you post as, and the Who can watch choices TikTok allows for it. Pick one: there is no default.',
             'Allow comments, Duet and Stitch start off. Turn on the ones you want. If your TikTok settings turn one off, it stays off here too.',
             'Mark promotional posts as Your brand or Branded content. TikTok labels them, and branded content can\'t be set to Only me.',
             'After it posts, TikTok may take a few minutes to process the video before it shows on your profile.',
             'Disconnecting TikTok in Capybaroar also removes Capybaroar\'s access on TikTok.'],
   'errors': [('TikTok needs exactly one video', 'Use one video and no pictures.'),
              ('Choose who can watch this TikTok', 'Pick an option in Who can watch.'),
              ("Branded content can't be set to Only me on TikTok", 'Pick a wider audience, or set Promotional content to Your brand or No.'),
              ("This TikTok account can't post with that Who can watch choice. Pick another", 'Pick one of the options the TikTok tab shows.'),
              ('TikTok has blocked this account from posting for now', 'Check the account in the TikTok app.')]},
 'linkedin': {'title': 'LinkedIn', 'nav': 'linkedin', 'page': '/linkedin-post-scheduler', 'ids': ['linkedin', 'linkedin-page'],
   'connect': 'Click LinkedIn in Channels and sign in. Add your own profile, or a company Page where you are an admin.',
   'notes': ['Posts can be up to 3,000 characters.',
             'A post takes one video, up to 20 pictures, or one PDF.',
             'A PDF goes out as a document post that people swipe through like a carousel. PDFs are up to 100 MB and 300 pages. Set its title in PDF title, or the file name is used.',
             'Pick who can see a post on your profile (anyone, connections only or LinkedIn members), and turn resharing off if you want.',
             'Add a first comment for links, so the post itself keeps people on LinkedIn.',
             'The Inbox shows comments on LinkedIn Pages, and you can like them there.'],
   'errors': [('LinkedIn takes one video, or pictures only', 'Use one video on its own, or only pictures.'),
              ('LinkedIn takes one PDF on its own', 'Remove the other files, or post the PDF on its own.'),
              ('PDFs can only go to LinkedIn', 'Pick only LinkedIn channels for a PDF, or use pictures for the other networks.'),
              ("LinkedIn couldn't read this PDF", 'Check that the file opens, is under 100 MB and has 300 pages or fewer.')]},
 'youtube': {'title': 'YouTube', 'nav': 'youtube', 'page': '/youtube-video-scheduler',
   'connect': 'Click YouTube in Channels and sign in with the Google account that owns the channel.',
   'notes': ['Every YouTube post is one video with a title. The post text becomes the description, up to 5,000 characters.',
             'Set Visibility (Public, Unlisted or Private), Made for kids, tags and a thumbnail in the YouTube tab.',
             'In the Inbox you can answer comments and hide them. YouTube doesn\'t let a hidden comment be shown again.'],
   'errors': [('YouTube needs exactly one video', 'Use one video and no pictures.'),
              ('YouTube needs a title', 'Add a title in the YouTube tab.'),
              ('This Google account has no YouTube channel', 'Sign in with the Google account that owns the channel, or create a channel first.')]},
 'x': {'title': 'X (Twitter)', 'nav': 'x', 'page': '/x-post-scheduler',
   'connect': 'Click X in Channels, sign in to X and approve Capybaroar.',
   'notes': ['Press Add to thread under the text to post a thread: each post goes out as a reply to the one before, with its own text and files, up to 25 posts.',
             'Posts can be up to 280 characters.',
             'A post takes up to 4 pictures, or one video or GIF.',
             'Pictures must be under 5 MB, GIFs under 15 MB and videos under 512 MB.',
             'Add a poll: write 2 to 4 options in Poll, one per line, each up to 25 characters, and pick how long it stays open. A poll can\'t have pictures or video.',
             'Pick who can reply (everyone, people you follow, only people you mention, or verified accounts), and mark a post as made with AI or as a paid partnership.'],
   'errors': [('An X poll has 2 to 4 options', 'Write 2, 3 or 4 options in Poll, one per line.'),
              ("An X poll can't have pictures or video", 'Remove the files, or clear the poll.'), ('X posts are up to 280 characters', 'Shorten the text in the X tab.'),
              ('X takes up to 4 pictures, or one video or GIF', 'Remove files until you have up to 4 pictures, or one video or GIF.'),
              ('X posts need text or media', 'Add text or a file.')]},
 'threads': {'title': 'Threads', 'nav': 'threads', 'page': '/threads-scheduler',
   'connect': 'Click Threads in Channels, sign in with Meta and approve Capybaroar.',
   'notes': ['Press Add to thread under the text to post a thread: each post goes out as a reply to the one before, with its own text and files, up to 25 posts.', 'Posts can be up to 500 characters.', 'A post takes up to 20 files.', 'In the Inbox you can answer replies and hide them.'],
   'errors': [('Threads posts are up to 500 characters', 'Shorten the text in the Threads tab.'), ('Threads takes up to 20 files', 'Remove files until there are 20 or fewer.')]},
 'pinterest': {'title': 'Pinterest', 'nav': 'pinterest', 'page': '/pinterest-pin-scheduler',
   'connect': 'Click Pinterest in Channels, sign in and approve Capybaroar.',
   'notes': ['Every Pin is one picture or one video, and goes to a board you pick.', 'Add a title and the link people visit when they click the Pin.', 'Descriptions can be up to 500 characters.'],
   'errors': [('Pinterest needs a board', 'Pick a board in the Pinterest tab.'), ('Pinterest needs one picture or one video', 'Keep one file.')]},
 'bluesky': {'title': 'Bluesky', 'nav': 'bluesky', 'page': '/bluesky-scheduler',
   'connect': 'Bluesky connects with an app password, so your real password stays private. In Bluesky, open Settings, then Privacy and security, then App passwords, and add one. In Capybaroar, click Bluesky in Channels and enter your handle and the app password.',
   'notes': ['Press Add to thread under the text to post a thread: each post goes out as a reply to the one before, with its own text and files, up to 25 posts.', 'Posts can be up to 300 characters.', 'A post takes up to 4 pictures, each under 1 MB. Videos aren\'t supported yet.', 'In the Inbox you can answer and like replies and mentions.'],
   'errors': [('Wrong handle or app password', 'Check the handle (like name.bsky.social) and make a new app password if needed.'),
              ('Bluesky posts are up to 300 characters', 'Shorten the text in the Bluesky tab.'),
              ('Bluesky pictures must be under 1 MB', 'Use smaller pictures.')]},
 'mastodon': {'title': 'Mastodon', 'nav': 'mastodon', 'page': '/mastodon-scheduler',
   'connect': 'Click Mastodon in Channels and type your server, like mastodon.social. Capybaroar sends you to that server to sign in and approve.',
   'notes': ['Press Add to thread under the text to post a thread: each post goes out as a reply to the one before, with its own text and files, up to 25 posts.', 'Posts can be up to 500 characters.', 'Pick Visibility (Public, Quiet public or Followers) and add a content warning if you need one.', 'In the Inbox you can answer and like replies.'],
   'errors': [('Enter a Mastodon server, like mastodon.social', 'Type the server your account is on.'), ('Mastodon posts are up to 500 characters', 'Shorten the text in the Mastodon tab.')]},
 'discord': {'title': 'Discord', 'nav': 'discord', 'page': '/discord-message-scheduler',
   'connect': 'Discord connects with a webhook, a private link that posts into one channel. In Discord, open the channel\'s settings, then Integrations, then Webhooks, create one and copy its URL. In Capybaroar, click Discord in Channels and paste the webhook URL.',
   'notes': ['Messages can be up to 2,000 characters.', 'A message takes up to 10 files, each under 10 MB.', 'Each webhook posts to one channel. Add another webhook for another channel.'],
   'errors': [("This Discord webhook doesn't exist or was deleted", 'Make a new webhook in Discord and connect it again.'), ('Discord takes up to 10 files', 'Remove files until there are 10 or fewer.'), ('Discord files must be under 10 MB', 'Use smaller files.')]},
}
NET_ORDER = ['instagram', 'facebook', 'tiktok', 'linkedin', 'youtube', 'x', 'threads', 'pinterest', 'bluesky', 'mastodon', 'discord']
