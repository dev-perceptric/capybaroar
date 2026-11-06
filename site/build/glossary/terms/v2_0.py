# Model entry for the upgraded glossary. Writers match this depth and these parts.
TERMS = [
{
 'slug': 'engagement-rate',
 'short': 'Engagement rate is the share of people who interact with your post or profile, shown as a percent of followers, reach or impressions.',
 'body': '''<h2>What is engagement rate?</h2>
<p>Engagement rate tells you how many people did something with your content after they saw it. It turns raw counts, like 120 likes or 15 comments, into a percent you can compare across posts, weeks and accounts of different sizes.</p>
<p>An engagement is any action a person takes on a post. Most tools count likes, comments, shares and saves. Some also count link clicks, profile visits, replies to Stories or video completions. Before you compare two numbers, check that both were worked out with the same actions and the same base.</p>
<h2>How to calculate engagement rate</h2>
<p>The math is always engagements divided by a base, times 100. What changes is the base you divide by.</p>
<figure data-chart="1"></figure>
<ul>
<li><b>By followers:</b> engagements ÷ followers × 100. Easy to work out from public numbers, so it is the one used to compare creators. It looks low for viral posts that reach far past your followers.</li>
<li><b>By reach:</b> engagements ÷ people reached × 100. This shows how people who actually saw the post reacted. You need access to the account's insights to get reach.</li>
<li><b>By impressions:</b> engagements ÷ impressions × 100. Impressions count repeat views, so this number is usually the lowest of the three.</li>
</ul>
<figure data-chart="2"></figure>
<h2>Why engagement rate matters</h2>
<p>Follower counts tell you how big an audience is. Engagement rate tells you whether that audience cares. A smaller account with people who reply and share often drives more sales and sign-ups than a big account that nobody talks to.</p>
<p>It is also an early signal. Many platforms show a post to a small group first and widen the audience when people interact, so posts with strong early engagement tend to keep traveling.</p>
<h2>What is a good engagement rate?</h2>
<p>There is no single good number. Rates differ by network, by format and by account size, and smaller accounts often see higher rates than large ones. The useful comparison is your own history: track your average for each network and format, then look for posts that beat it.</p>
<figure data-chart="3"></figure>
<h2>How to raise your engagement rate</h2>
<ol>
<li><b>Open with a hook.</b> The first line or first second decides if people stop scrolling.</li>
<li><b>Ask for one clear action.</b> A question gets comments. A useful checklist gets saves.</li>
<li><b>Reply fast.</b> Answering comments in the first hour keeps the thread going and shows people you are listening.</li>
<li><b>Post when your audience is online.</b> Use your analytics to find the hours your followers are active.</li>
<li><b>Lean into the formats that work.</b> If carousels earn twice the saves of single pictures, make more carousels.</li>
</ol>
<h2>Common mistakes</h2>
<ul>
<li>Comparing a rate by reach with someone else's rate by followers.</li>
<li>Chasing likes with giveaways or engagement bait, which pulls in people who never buy.</li>
<li>Judging one post. Look at averages over at least a few weeks.</li>
</ul>''',
 'charts': [
  {'type': 'formula', 'title': 'Engagement rate by followers', 'formula': 'Engagement rate = (likes + comments + shares + saves) ÷ followers × 100',
   'note': 'numbers to show the math.', 'result': '4%',
   'example': [('Engagements', '480'), ('Followers', '12,000')]},
  {'type': 'bars', 'title': 'One post, three engagement rates', 'sub': 'The same 480 engagements divided by three different bases', 'example': True,
   'rows': [('By reach (6,000 reached)', 8.0, '8%'), ('By followers (12,000)', 4.0, '4%'), ('By impressions (16,000)', 3.0, '3%')], 'highlight': 'By reach (6,000 reached)', 'unit': 'Engagement rate',
   'note': 'numbers. Always say which base you used.'},
  {'type': 'columns', 'title': 'Track your own average by format', 'sub': 'Engagement rate by followers, averaged over a month', 'example': True,
   'rows': [('Single photo', 2.1, '2.1%'), ('Carousel', 4.6, '4.6%'), ('Reel', 3.8, '3.8%'), ('Text post', 1.2, '1.2%')], 'highlight': 'Carousel', 'labels': 'all', 'unit': 'Engagement rate',
   'note': 'numbers for one account. Your mix will differ.'},
 ],
 'tools': [
  {'id': 'capybaroar', 'name': 'Capybaroar Analytics', 'url': '/social-media-analytics', 'line': 'See engagement, reach and followers for every channel side by side, with your best times to post.'},
  {'name': 'Engagement rate calculator', 'url': '/tools/engagement-rate-calculator', 'line': 'Our free calculator works out the rate for any post or profile by followers, reach or impressions.'},
  {'name': 'Google Sheets', 'url': 'https://www.google.com/sheets/about/', 'domain': 'google.com', 'line': 'A free spreadsheet for tracking your monthly averages if you like to keep your own log.'},
 ],
 'list': 'social-media-management-tools',
 'faqs': [
  ('How do you calculate engagement rate?', 'Add up the engagements on a post, divide by followers, reach or impressions, then multiply by 100. Say which base you used so others can compare it fairly.'),
  ('Is engagement rate by reach or by followers better?', 'By reach is better for judging how people who saw a post reacted, since it ignores followers who never saw it. By followers is better for comparing public accounts, because anyone can see follower counts.'),
  ('Do views count as engagement?', 'Most tools leave plain views out, because watching takes no action. Some video reports count full plays or replays as engagement, so check the tool\'s definition.'),
  ('Why is my engagement rate going down as I grow?', 'Bigger accounts often see lower rates because new followers are less close to you than early ones. Watch the trend for each format, and compare yourself with your own past results.'),
 ],
 'related': ['engagement', 'reach', 'impressions', 'analytics', 'vanity-metrics'],
},
]
