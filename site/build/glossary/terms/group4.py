TERMS = [
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
</ul>
<p>Some platforms also have tags of their own. X, for example, reads its own card tags first and falls back to Open Graph when they are missing.</p>
<h2>Why Open Graph matters for social media</h2>
<p>A link with a clear image and a good title stands out in a busy feed. A broken preview looks careless and gives people a reason to scroll past. If you share blog posts, product pages or landing pages, these tags decide how your links look before anyone clicks.</p>
<h2>How to set up Open Graph tags</h2>
<ol>
<li>Add the tags to the head of each page, or switch them on in your website builder or SEO plugin.</li>
<li>Write a title and description meant for sharing. They can differ from your search title.</li>
<li>Pick a sharp, wide image with very little small text on it.</li>
<li>Test the link with the preview or debug tool of the platform you post to.</li>
<li>If you change the image later, ask the platform to fetch the page again, since apps often keep old previews for a while.</li>
</ol>
<h2>Common mistakes</h2>
<p>The most frequent problem is a missing or tiny image, which leaves the card blank or badly cropped. Another is giving every page on a site the same title and image, so every shared link looks alike. Check your most shared pages first and fix those before anything else.</p>''',
 'faqs': [
  ("What does og:image mean?", "og:image is the Open Graph tag that points to the picture a social app should show in a link preview. If it is missing, the app may pick a random image or show none."),
  ("Why is my link preview showing an old image?", "Social apps save previews, so an old image can stick around after you change it. Update the og:image tag, then use the platform's sharing debug tool to fetch the page again."),
  ("Does WordPress add Open Graph tags?", "Many WordPress themes and SEO plugins add Open Graph tags for you. View your page source and search for og: to see whether they are there."),
  ("Does Open Graph help SEO?", "Open Graph tags have no direct effect on search rankings. Better link previews can still bring you more clicks from social apps."),
 ],
 'related': ['thumbnail', 'embed', 'url-shortener', 'utm-parameters', 'link-in-bio'],
},
{
 'slug': 'organic-reach',
 'short': "Organic reach is the number of unique people who see your content without you paying to promote it.",
 'body': '''<h2>What is organic reach?</h2>
<p>Organic reach counts the different people who saw a post through free means. They might follow you, find the post on an explore or For You page, see it because a friend shared it, or land on it through search. Each person counts once, however many times they saw it.</p>
<p>Any view that came from an ad or a boosted post counts as paid reach instead. Most analytics tools split the two so you can see each one on its own.</p>
<h2>Organic reach vs paid reach</h2>
<p>Paid reach grows when you spend money and stops when the budget runs out. Organic reach grows when people find your content worth showing to others and when the app's algorithm decides to recommend it. Organic reach takes longer to build, but it keeps working after a post goes live, and it tells you what your audience truly cares about.</p>
<h2>Why organic reach changes</h2>
<p>Feeds hold far more posts than anyone can see, so each app ranks them. A post that gets early likes, comments, saves and shares tends to be shown to more people. Reach can drop when you post less, when your topic drifts away from what your followers expect or when the app changes how it ranks content. A sudden drop on one post is normal. A steady drop over weeks is worth a closer look.</p>
<h2>How to grow organic reach</h2>
<ul>
<li>Open with a strong hook so people stop scrolling.</li>
<li>Use the formats each app is pushing, such as short video or carousels.</li>
<li>Reply to comments quickly, since active threads often travel further.</li>
<li>Post when your followers are online.</li>
<li>Make things people want to save or send to a friend.</li>
<li>Keep a steady rhythm so the app and your audience know what to expect.</li>
</ul>
<h2>How to measure organic reach</h2>
<p>Open the insights or analytics area of each app and look for reach on posts that were not promoted. To compare accounts of different sizes, work out your organic reach rate: organic reach / followers × 100. Track it over time and compare post types, since a single number on its own says little.</p>''',
 'faqs': [
  ("What is a good organic reach rate?", "It varies a lot by app, account size and topic. The most useful benchmark is your own average, so aim to beat your last few months."),
  ("Why is my organic reach going down?", "Common causes are posting less often, content your audience engages with less and changes to how the app ranks posts. Check which recent posts did best and make more like them."),
  ("Is organic reach the same as impressions?", "No. Reach counts unique people, while impressions count every time the post was shown, so one person can create several impressions."),
 ],
 'related': ['reach', 'impressions', 'algorithm', 'paid-social', 'organic-social'],
},
{
 'slug': 'organic-social',
 'short': "Organic social is everything a brand or creator does on social media for free, such as posting, replying to comments and joining conversations.",
 'body': '''<h2>What is organic social?</h2>
<p>Organic social covers all the unpaid work you do on social apps. It includes the posts, stories and videos you publish, the comments you answer, the messages you reply to and the groups or threads you take part in. Nothing in it is boosted with ad money.</p>
<p>The goal is to build an audience that knows you, trusts you and comes back on its own. Over time, that audience becomes a steady source of website visits, leads and word of mouth.</p>
<h2>Organic social vs paid social</h2>
<p>Paid social uses ads to put content in front of chosen groups of people, and it can reach strangers fast. Organic social mostly reaches your followers, their friends and people who find you through search or recommendations. The two work well together. Many teams test ideas organically first, then put ad money behind the posts that already did well.</p>
<h2>Why organic social matters</h2>
<ul>
<li>It gives your brand a human voice people can talk to.</li>
<li>It builds trust before someone is ready to buy.</li>
<li>It costs time more than money, so small teams can start today.</li>
<li>Comments and messages show you what customers think.</li>
</ul>
<h2>How to build an organic social plan</h2>
<ol>
<li>Pick the apps where your audience already spends time. Two done well beat many done badly.</li>
<li>Choose a few content pillars, the topics you will post about again and again.</li>
<li>Set a posting rhythm you can keep for months, then plan it on a content calendar.</li>
<li>Write and batch posts ahead so busy weeks do not leave gaps.</li>
<li>Block time each day to answer comments and messages.</li>
<li>Review your analytics each month and do more of what worked.</li>
</ol>
<h2>Common mistakes</h2>
<p>Many accounts post only about their own products, which gives people little reason to follow. Others post in bursts and then disappear for weeks. Mix helpful, fun and behind-the-scenes posts with your offers, and keep showing up.</p>''',
 'faqs': [
  ("Is organic social media free?", "Posting is free on every major app. The real cost is the time it takes to plan, create and reply, plus any tools you choose to use."),
  ("How long does organic social take to work?", "It usually takes months of steady posting before you see clear growth. Results build up over time as your audience grows."),
  ("Should I do organic or paid social first?", "Most brands start with organic social to learn what their audience likes. Paid social works better once you know which posts and messages land."),
 ],
 'related': ['paid-social', 'organic-reach', 'content-calendar', 'content-pillars', 'community-management'],
},
{
 'slug': 'owned-media',
 'short': "Owned media are the channels a brand controls itself, such as its website, blog, email list and app.",
 'body': '''<h2>What is owned media?</h2>
<p>Owned media are the places where you decide what goes out, when it goes out and who sees it. Your website, your blog, your email newsletter, your mobile app and your podcast feed are all owned media. You do not need permission from another company to publish there, and nobody can change the rules on you overnight.</p>
<h2>Owned, earned and paid media</h2>
<p>Marketers often sort channels into groups:</p>
<ul>
<li><b>Owned media</b>: channels you run, like your site and email list.</li>
<li><b>Earned media</b>: attention you get for free from others, such as press stories, reviews and shares.</li>
<li><b>Paid media</b>: space you buy, such as ads and sponsored posts.</li>
<li><b>Shared media</b>: social posts, which sit between the others.</li>
</ul>
<h2>Are social media profiles owned media?</h2>
<p>Partly. You control what you post on your profiles, so many people count them as owned. But the platform owns the account rules, the feed and your list of followers. If an app changes its algorithm, limits your account or shuts down a feature, you can lose reach you spent years building. That is why social profiles are sometimes called rented space.</p>
<h2>Why owned media matters</h2>
<p>Owned channels protect you from sudden changes on any one app. When someone joins your email list, you can reach them directly, whatever happens to a feed. Content on your own site can also rank in search for years and keep bringing visitors.</p>
<h2>How to use social media to grow owned media</h2>
<ol>
<li>Put a clear link in your bio that leads to your site or a sign-up page.</li>
<li>Offer something useful, like a guide or a discount, in exchange for an email address.</li>
<li>Share blog posts on social, then send readers back to the full article.</li>
<li>Add UTM parameters to links so you can see which posts bring visitors.</li>
<li>Repurpose your best social posts into articles or newsletter issues.</li>
</ol>
<p>Think of social apps as the place people meet you and owned media as the place they get to know you.</p>''',
 'faqs': [
  ("What are examples of owned media?", "Your website, blog, email newsletter, mobile app, podcast and printed brochures are all owned media. Many people also include your social media profiles."),
  ("What is the difference between owned and earned media?", "Owned media are channels you control and publish on yourself. Earned media is attention other people give you for free, such as reviews, press coverage or shares."),
  ("Why is an email list important if I have followers?", "A platform can change its rules or reach at any time, but your email list stays with you. It lets you contact your audience directly."),
 ],
 'related': ['earned-media', 'paid-social', 'link-in-bio', 'lead-generation', 'utm-parameters'],
},
{
 'slug': 'paid-social',
 'short': "Paid social is advertising on social media apps, where you pay to show posts or ads to people you choose by interest, location, age or behavior.",
 'body': '''<h2>What is paid social?</h2>
<p>Paid social means any content you pay a social app to show. It includes ads in the feed, sponsored stories, promoted videos, boosted posts and sponsored messages. You set a budget, choose who should see the ad and pick a goal, such as website visits, app installs, leads or sales.</p>
<h2>How paid social works</h2>
<p>Each app has an ads manager where you build a campaign. The usual steps are:</p>
<ol>
<li><b>Pick a goal.</b> The app uses it to decide who to show the ad to.</li>
<li><b>Choose an audience.</b> You can target by location, age, interests or job title, or upload a customer list.</li>
<li><b>Set a budget and schedule.</b> You choose a daily or total amount and how long the ads run.</li>
<li><b>Create the ad.</b> Add images or video, text, a headline and a call to action.</li>
<li><b>Launch and watch the results.</b> Check costs, clicks and conversions, then adjust.</li>
</ol>
<p>Ads are sold through auctions. The price you pay depends on how many other advertisers want the same audience and how well people respond to your ad.</p>
<h2>Paid social vs organic social</h2>
<p>Organic posts reach mostly your followers and people the algorithm picks. Paid posts can reach strangers right away and can be aimed very precisely. Organic social builds trust slowly, while paid social gives fast, measurable results that stop when spending stops. Most brands use both.</p>
<h2>Common paid social metrics</h2>
<ul>
<li><b>CPM</b>: cost per thousand impressions.</li>
<li><b>CPC</b>: cost per click.</li>
<li><b>CTR</b>: clicks / impressions × 100.</li>
<li><b>Conversion rate</b>: conversions / clicks × 100.</li>
<li><b>ROAS</b>: revenue from ads / ad spend.</li>
</ul>
<h2>Common mistakes</h2>
<p>New advertisers often target too many people, so the budget spreads thin. Others use an ad that looks nothing like a normal post, and people skip it. Start small, test a few versions, and give each test enough time to collect real data before you decide.</p>''',
 'faqs': [
  ("How much does paid social cost?", "It depends on your audience, the app, your goal and how much competition there is. You set the budget yourself, and most apps let you start small."),
  ("Is a boosted post the same as paid social?", "A boosted post is one simple type of paid social. Full ad campaigns give you more choices for goals, audiences and ad formats."),
  ("Which platform is best for paid social?", "The best one is where your customers spend time. LinkedIn suits many B2B brands, while visual products often do well on Instagram, TikTok or Pinterest."),
 ],
 'related': ['organic-social', 'boosted-post', 'retargeting', 'lookalike-audience', 'cost-per-click'],
},
{
 'slug': 'pin',
 'short': "A pin is a post on Pinterest, an image or video with a title, description and link that people save to boards to keep ideas for later.",
 'body': '''<h2>What is a pin?</h2>
<p>A pin is the basic unit of Pinterest. It is a picture or a short video, often with a title, a description and a link to a web page. People find pins through search or their home feed, then save the ones they like to boards, which work like folders of ideas. A recipe, a living room photo, a workout plan or a product page can all become pins.</p>
<h2>How pins work</h2>
<p>Pinterest behaves a lot like a visual search engine. People type what they want, such as "small balcony ideas", and Pinterest shows matching pins. When someone saves your pin, it lands on their board and can be seen by their followers too. Because people search for ideas long before they act, a good pin can keep getting views and clicks for months.</p>
<p>Clicking a pin opens a close-up view. If the pin has a link, a second tap takes the person to the website behind it.</p>
<h2>Types of pins</h2>
<ul>
<li><b>Image pins</b>: a single photo or graphic.</li>
<li><b>Video pins</b>: a short clip that plays in the feed.</li>
<li><b>Pins with several images</b>: a set people swipe through.</li>
<li><b>Product pins</b>: pins that show price and stock details from a shop.</li>
<li><b>Rich Pins</b>: pins that pull extra details from your website automatically.</li>
</ul>
<h2>How to make a good pin</h2>
<ol>
<li>Use a tall image, since Pinterest shows pins in narrow columns.</li>
<li>Add a short text overlay that says what the pin is about.</li>
<li>Write a title with the words people would search for.</li>
<li>Use the description to explain the idea. You have up to 500 characters.</li>
<li>Link to the exact page that matches the pin. A home page link makes people hunt for the idea.</li>
<li>Save it to a board with a clear, searchable name.</li>
</ol>
<h2>Pin vs post</h2>
<p>A post on most apps fades from feeds within a day or two. A pin is built to be found through search and saved for later, so it can keep working long after you publish it.</p>''',
 'faqs': [
  ("What does it mean to pin something?", "To pin something means to save an image or video to one of your Pinterest boards. You can pin from Pinterest itself or from a website."),
  ("How long can a Pinterest pin description be?", "A pin description can be up to 500 characters. Put the most important words near the start."),
  ("How do I see how many saves my pin has?", "Open Pinterest analytics on a business account to see the saves for each pin. Compare them to learn which ideas people want to keep."),
  ("How do I add a link to a pin?", "When you create a pin, paste the web address into the link field. People who tap the pin can then visit that page."),
 ],
 'related': ['pinterest', 'rich-pin', 'saves', 'evergreen-content', 'keyword'],
},
{
 'slug': 'pinned-post',
 'short': "A pinned post is a post you fix to the top of your profile or a group so it stays the first thing visitors see, even after you publish newer posts.",
 'body': '''<h2>What is a pinned post?</h2>
<p>A pinned post is one you choose to keep at the top of your profile, page or group. Normally, the newest post shows first and older ones slide down. A pin breaks that order and holds one post, or a small set of posts, in the top spot until you unpin it.</p>
<p>Most major apps offer some form of pinning. You can pin posts on X, Threads, Bluesky and Mastodon profiles, pin posts in a Facebook group or page, pin a few posts or Reels to the top of an Instagram grid and pin videos on a TikTok profile. LinkedIn uses a Featured section for a similar purpose. Many apps also let you pin a comment under your own post.</p>
<h2>Why pinned posts matter</h2>
<p>New visitors decide fast whether to follow you. Your pinned post is often the first full post they read, so it works like a welcome sign. It can explain who you are, show your best work or point people to the one thing you want them to do.</p>
<h2>What to pin</h2>
<ul>
<li>An intro post that says who you are and what you post about.</li>
<li>Your best performing post, so newcomers see you at your strongest.</li>
<li>A current offer, launch or event.</li>
<li>Rules or a welcome note in a group or community.</li>
<li>A post that answers the question people ask you most.</li>
</ul>
<h2>How to pin a post</h2>
<ol>
<li>Open your profile and find the post you want to keep on top.</li>
<li>Tap the menu on the post, usually three dots.</li>
<li>Choose the pin option. The wording can be "Pin to profile" or "Pin to your grid".</li>
<li>Check your profile to confirm the post now sits at the top.</li>
</ol>
<p>To remove it, open the same menu and choose unpin. The post then returns to its normal place by date.</p>
<h2>Common mistakes</h2>
<p>The biggest mistake is forgetting a pin. An event that ended months ago, or a sale that has closed, makes your profile look out of date. Set a reminder to review your pinned posts every few weeks and swap them when your goals change.</p>''',
 'faqs': [
  ("Can other people see my pinned post?", "Yes. A pinned post on a public profile shows at the top for anyone who visits. On a private account, only approved followers can see it."),
  ("How many posts can I pin?", "It depends on the app. Some let you pin one post, while others, like the Instagram grid, let you pin a few."),
  ("Does pinning a post boost its reach?", "Pinning keeps the post at the top of your profile, so visitors see it first. Over time, that steady spot can bring it more views."),
 ],
 'related': ['profile', 'post', 'grid', 'bio', 'facebook-group'],
},
{
 'slug': 'pinterest',
 'short': "Pinterest is a visual discovery app where people search for ideas, save images and videos called pins to boards, and click through to websites.",
 'body': '''<h2>What is Pinterest?</h2>
<p>Pinterest is a social app built around ideas. People use it to plan meals, decorate homes, find outfits, gather wedding ideas, learn crafts and shop. Each idea is a pin, and people save pins to boards so they can come back later. A board might be called "Garden plans" or "Easy dinners".</p>
<p>Pinterest feels less like a chat app and more like a search engine with pictures. People come with a goal in mind and look for ways to reach it.</p>
<h2>How Pinterest works</h2>
<ul>
<li><b>Pins</b>: images or videos with a title, a description and often a link.</li>
<li><b>Boards</b>: collections where people save pins by theme.</li>
<li><b>Search</b>: people type what they want and see matching pins.</li>
<li><b>Home feed</b>: a stream of pins picked for each person based on what they search and save.</li>
</ul>
<p>When someone saves your pin, more people can find it through their boards and through recommendations. A pin can keep getting found long after you post it.</p>
<h2>Why Pinterest matters for business</h2>
<p>People on Pinterest are often planning a purchase or a project, so they are open to ideas from brands. Pins link straight to websites, which makes Pinterest a strong source of traffic for blogs, shops and recipe sites. Content also tends to last longer here than on fast-moving feeds, which rewards evergreen posts.</p>
<h2>How to use Pinterest for marketing</h2>
<ol>
<li>Set up a business account so you can see analytics and run ads.</li>
<li>Claim your website so your pins show your name and logo.</li>
<li>Create boards for the main topics your customers search for.</li>
<li>Pin tall, clear images with short text overlays.</li>
<li>Use search words in titles, descriptions and board names. Descriptions can run up to 500 characters.</li>
<li>Pin new content often and keep linking to the right pages.</li>
</ol>
<h2>Is Pinterest free?</h2>
<p>Yes. Personal and business accounts are free to create and use. You only pay if you choose to run ads to reach more people.</p>''',
 'faqs': [
  ("Is Pinterest a social media platform or a search engine?", "It is a bit of both. People can follow others and save pins, but many use it mainly to search for ideas."),
  ("Do I need a business account on Pinterest?", "You need a business account to see analytics, claim your website and run ads. It is free, and you can switch a personal account over."),
  ("What should businesses post on Pinterest?", "Post helpful, visual ideas related to what you sell, such as how-to guides, product photos, recipes or style tips. Link each pin to a matching page."),
  ("How long does a pin last on Pinterest?", "There is no set end date. Because people find pins through search, a good pin can keep getting views and clicks for a long time."),
 ],
 'related': ['pin', 'rich-pin', 'saves', 'evergreen-content', 'keyword'],
},
{
 'slug': 'post',
 'short': "A post is any piece of content you publish on a social media app, such as text, a photo, a video, a link or a mix of these.",
 'body': '''<h2>What is a post?</h2>
<p>A post is a single item you share on a social app. It might be a few lines of text on Threads, a photo on Instagram, a short video on TikTok, a link on LinkedIn or an update in a Facebook group. Once it goes live, it shows on your profile and may appear in your followers' feeds.</p>
<p>Some apps use their own name for a post. People talk about tweets or posts on X, pins on Pinterest, toots on Mastodon, which now calls them posts, and Snaps on Snapchat. The idea is the same.</p>
<h2>Parts of a post</h2>
<ul>
<li><b>Media</b>: the image, video, carousel or GIF.</li>
<li><b>Caption or text</b>: the words that go with it.</li>
<li><b>Hashtags and mentions</b>: tags that help people find the post or point to other accounts.</li>
<li><b>Link</b>: a web address, where the app allows one.</li>
<li><b>Location, alt text and settings</b>: extra details such as who can reply.</li>
</ul>
<h2>Post length limits by platform</h2>
<p>Each app caps how much text a post can hold:</p>
<ul>
<li>X: 280 characters for standard accounts.</li>
<li>Threads: 500 characters.</li>
<li>Bluesky: 300 characters.</li>
<li>Mastodon: 500 characters on default servers.</li>
<li>Instagram and TikTok captions: 2,200 characters.</li>
<li>LinkedIn: 3,000 characters.</li>
<li>Facebook: 63,206 characters.</li>
<li>Google Business Profile posts: 1,500 characters.</li>
</ul>
<h2>How to write a good post</h2>
<ol>
<li>Know the single point you want to make before you start.</li>
<li>Put the hook in the first line, since apps often cut long text with a "more" link.</li>
<li>Match the format to the app. A long text post on TikTok or a plain link on Instagram rarely works.</li>
<li>Add alt text to images so everyone can follow along.</li>
<li>End with a clear next step, such as a question or a link.</li>
<li>Read it once more for typos, then publish or schedule it.</li>
</ol>
<h2>Post vs story</h2>
<p>A post stays on your profile until you delete it. A story disappears after a short time unless you save it as a highlight. Use posts for content you want people to find later and stories for quick, casual updates.</p>''',
 'faqs': [
  ("What is the difference between a post and a story?", "A post stays on your profile and in feeds until you remove it. A story is a short update that disappears after a day unless you save it."),
  ("Can I edit a post after publishing it?", "Most apps let you edit the caption after posting, though some limit what you can change. Many do not let you swap the photo or video once it is live."),
  ("How long should a social media post be?", "Stay well inside each app's limit and keep it as short as the message allows. The first line matters most because many apps hide the rest behind a more link."),
 ],
 'related': ['caption', 'story', 'carousel-post', 'social-media-scheduling', 'feed'],
},
{
 'slug': 'posting-frequency',
 'short': "Posting frequency is how often you publish new content on a social media account, such as several times a day, once a day or a few times a week.",
 'body': '''<h2>What is posting frequency?</h2>
<p>Posting frequency is the pace at which you share new posts on an account. It can be counted per day, per week or per month, and it often differs from one app to the next. A brand might post many times a day on X, once a day on Instagram and a couple of times a week on LinkedIn.</p>
<h2>Why posting frequency matters</h2>
<p>Each post is a new chance to be seen. Posting too rarely means your followers forget you, and the app has little fresh content to recommend. Posting too often can tire your audience, lower the quality of each post and burn out your team. The right pace keeps you visible without wearing anyone out.</p>
<p>Frequency also shapes how much you learn. More posts give you more data on what works, as long as each one is good enough to be worth testing.</p>
<h2>How to find the right posting frequency</h2>
<ol>
<li><b>Start with what you can keep up.</b> A pace you can hold for months beats a burst that stops after two weeks.</li>
<li><b>Think about each app.</b> Fast feeds like X and Threads move quickly, so posts fade sooner. Pinterest and YouTube content lasts longer, so fewer posts can go further.</li>
<li><b>Check your analytics.</b> Look at reach and engagement per post as you post more or less.</li>
<li><b>Change one thing at a time.</b> Raise or lower your pace for a few weeks, then compare.</li>
<li><b>Watch for signs of fatigue.</b> Rising unfollows or falling engagement per post can mean you are posting too much.</li>
</ol>
<h2>How to keep a steady posting schedule</h2>
<ul>
<li>Plan posts ahead on a content calendar.</li>
<li>Batch your writing and filming into set blocks of time.</li>
<li>Use a scheduling tool or a queue with fixed time slots.</li>
<li>Repurpose one strong idea into several formats for different apps.</li>
</ul>
<h2>Common mistakes</h2>
<p>A common mistake is copying a posting number you read somewhere. Your own results are a better guide. Another is posting the exact same text on every app at the same time, which can look lazy to people who follow you in more than one place. Good posts on a steady rhythm are what count.</p>''',
 'faqs': [
  ("How often should I post on social media?", "There is no single right answer for every account. Pick a pace you can keep for months, then adjust it based on your own reach and engagement."),
  ("Does posting more often increase reach?", "It can, because each post is another chance to be seen. But if quality drops or followers get tired, reach per post can fall."),
  ("Is it bad to post twice in one day?", "Not on most apps, as long as both posts are worth seeing. Spacing them a few hours apart helps each one get its own attention."),
 ],
 'related': ['best-time-to-post', 'content-calendar', 'queue', 'batching', 'social-media-scheduling'],
},
{
 'slug': 'pov',
 'short': "POV is short for point of view, a caption style on short videos that puts the viewer inside a scene, as in \"POV: you just got your first paycheck.\"",
 'body': '''<h2>What is POV?</h2>
<p>POV stands for point of view. On social media, it usually starts a caption or an on-screen line that sets up a scene. The words after "POV:" tell you who you are or what is happening, and the video then plays out that moment as if you were living it. The person on camera often acts as someone you are talking to, or the camera stands in for your own eyes.</p>
<p>The format took off on TikTok and spread to Instagram Reels, YouTube Shorts and other short video apps. People also use POV in plain text posts and memes to describe a feeling everyone knows.</p>
<h2>How people use POV</h2>
<ul>
<li><b>Skits</b>: short acted scenes, such as a teacher reacting to an excuse.</li>
<li><b>Relatable moments</b>: everyday feelings, like the first sip of coffee on a Monday.</li>
<li><b>Fan stories</b>: imagined scenes with a character or celebrity.</li>
<li><b>Work and hobby life</b>: what a job or a hobby looks like from the inside.</li>
</ul>
<h2>Examples of POV posts</h2>
<p>These are made-up examples to show the style:</p>
<ul>
<li>"POV: you open the group chat after a few hours offline."</li>
<li>"POV: you are the barista and someone orders a drink with a long list of changes."</li>
<li>"POV: you finally fixed the bug just before the weekend."</li>
</ul>
<p>In each one, the caption sets the scene, and the video or image shows the reaction.</p>
<h2>How brands can use POV</h2>
<p>POV videos work well for brands because they feel like jokes between friends. A bakery could post "POV: you walk in right as the bread comes out of the oven" with a slow shot of the shelves. A software company might show the moment a customer finds the feature they needed. The trick is to start from a feeling your audience already knows, then let your product appear inside that moment.</p>
<h2>Common mistakes</h2>
<p>Some posts use "POV" for things that are just regular videos, which confuses people. Keep the scene clear and quick, put the line on screen in the first second, and make sure the viewer can picture themselves in it.</p>''',
 'faqs': [
  ("What does POV mean on TikTok?", "POV means point of view. A TikTok captioned POV puts you, the viewer, inside a scene, and the video acts out what you would see or feel."),
  ("How do you write a POV caption?", "Start with POV and a colon, then describe a short scene from the viewer's side, such as POV: your dog hears the treat bag. Keep it to one line."),
  ("Is POV the same as a skit?", "Many POV videos are skits. What makes it POV is the angle: the viewer is placed inside the scene as one of the people in it."),
 ],
 'related': ['tiktok', 'instagram-reels', 'meme', 'trend', 'hook'],
},
{
 'slug': 'profile',
 'short': "A profile is the public page for a social media account, showing its name, handle, photo, bio, links and posts.",
 'body': '''<h2>What is a profile?</h2>
<p>A profile is your home base on a social app. When someone taps your name, they land on your profile and see who you are, what you post and how to reach you. Every account has one, whether it belongs to a person, a creator, a brand or a group.</p>
<p>Your profile is often the place where people decide whether to follow you. It has a few seconds to make the case.</p>
<h2>Parts of a profile</h2>
<ul>
<li><b>Display name</b>: the name people see, which can include spaces and sometimes keywords.</li>
<li><b>Handle</b>: your unique username, often shown with an @ sign.</li>
<li><b>Profile photo</b>: your face or logo, shown small next to every post and comment.</li>
<li><b>Cover or banner image</b>: a wide image at the top on apps like X, LinkedIn, YouTube and Facebook.</li>
<li><b>Bio</b>: a short line or paragraph about you.</li>
<li><b>Link</b>: one or more web addresses, depending on the app.</li>
<li><b>Posts and highlights</b>: your content, often with pinned posts on top.</li>
</ul>
<h2>Personal, creator and business profiles</h2>
<p>Many apps offer different account types. A personal profile is for everyday use. Creator and business profiles add tools such as analytics, contact buttons, categories and access to ads. On Facebook, businesses use a Page, and on LinkedIn they use a Company Page, while people have personal profiles on both.</p>
<h2>How to set up a strong profile</h2>
<ol>
<li>Use a clear photo or logo that still looks good at a tiny size.</li>
<li>Pick a handle that is easy to spell and, if you can, the same on every app.</li>
<li>Write a bio that says what you do and who it is for in plain words.</li>
<li>Add a link to the page you most want people to visit.</li>
<li>Pin a post that shows your best work or explains what you share.</li>
<li>Check that your contact details and category are correct.</li>
</ol>
<h2>Common mistakes</h2>
<p>Old links, blurry logos, missing contact details and bios full of buzzwords push people away. Visit your own profile as a stranger would once a month and ask yourself if you would follow it.</p>''',
 'faqs': [
  ("What is the difference between a profile and an account?", "An account is your login and everything tied to it. A profile is the public page other people see for that account."),
  ("Can I make my social media profile private?", "Many apps, including Instagram, TikTok and X, let personal accounts go private so only approved followers see posts. Business pages are usually public."),
  ("What should I put in my profile bio?", "Say what you do, who you help and what people get from following you. Add a link or a call to action if there is room."),
 ],
 'related': ['bio', 'handle', 'avatar', 'business-account', 'pinned-post'],
},
{
 'slug': 'psychographics',
 'short': "Psychographics are the values, interests, attitudes and lifestyle choices that explain why people act the way they do, used to understand an audience.",
 'body': '''<h2>What are psychographics?</h2>
<p>Psychographics describe the inner side of your audience. They cover what people care about, how they spend their free time, what they believe and what worries or excites them. Two people of the same age in the same city can have very different psychographics. One might be a weekend hiker who saves for travel, while the other loves gaming and buys the newest gadgets.</p>
<h2>Psychographics vs demographics</h2>
<p>Demographics tell you who someone is on paper: age, gender, location, income, job or education. Psychographics tell you why they make the choices they do. Demographics help you aim. Psychographics help you write content that feels like it was made for the reader. The best audience profiles use both.</p>
<h2>Common psychographic traits</h2>
<ul>
<li><b>Values</b>: what matters most, such as family, saving money or caring for the planet.</li>
<li><b>Interests and hobbies</b>: cooking, fitness, music, gardening and so on.</li>
<li><b>Lifestyle</b>: busy parent, frequent traveler, remote worker.</li>
<li><b>Attitudes</b>: early adopter of new things or careful buyer who reads every review.</li>
<li><b>Pain points</b>: problems they want to solve.</li>
</ul>
<h2>How to find your audience's psychographics</h2>
<ol>
<li>Read the comments and messages people send you, and note the words they use.</li>
<li>Run polls and question stickers on stories.</li>
<li>Use social listening to see what your audience talks about beyond your brand.</li>
<li>Check the interest data in your platform analytics and ad tools.</li>
<li>Talk to a handful of real customers and ask why they chose you.</li>
<li>Look at which of your posts get the most saves and shares.</li>
</ol>
<h2>How to use psychographics on social media</h2>
<p>Once you know what your audience values, you can pick topics, tone and visuals that match. A brand whose followers care about saving time can post quick tips and shortcuts. One whose followers love craft and detail can show slow, behind-the-scenes work. In paid social, interest targeting lets you reach people with similar traits. Write a short persona that blends demographics and psychographics, and check new posts against it before you publish.</p>''',
 'faqs': [
  ("What is an example of psychographics?", "A psychographic profile might say a customer values health, cooks at home most nights and reads labels before buying. That tells you far more than their age alone."),
  ("Why are psychographics important in marketing?", "They explain why people buy, which helps you write messages that feel personal. Content that matches someone's values is more likely to get attention."),
  ("How do you collect psychographic data?", "Use surveys, polls, interviews, comment threads, social listening and interest data from analytics tools. Look for patterns across many people."),
 ],
 'related': ['target-audience', 'audience', 'social-listening', 'customer-journey', 'niche'],
},
{
 'slug': 'qanda-sticker',
 'short': "A Q&A sticker is a sticker you add to an Instagram story that lets viewers type a question for you, which you can then answer in a new story.",
 'body': '''<h2>What is a Q&amp;A sticker?</h2>
<p>A Q&amp;A sticker is an interactive box you place on an Instagram story. It shows a prompt, such as "Ask me anything", with a space where viewers type a reply. Instagram labels it the Questions sticker in the sticker tray, but most people call it the Q&amp;A sticker. The questions come to you privately, and you choose which ones to share and answer.</p>
<p>When you share an answer, the question appears on a new story without the sender's name. You then add your reply as text, a photo or a video.</p>
<h2>Why the Q&amp;A sticker matters</h2>
<p>The sticker turns a one-way story into a conversation. It shows you what your audience wants to know, gives you a steady supply of content ideas and makes followers feel heard. Replies are also a form of story engagement, a sign that people care about what you share.</p>
<h2>How to use the Q&amp;A sticker</h2>
<ol>
<li>Start a new story and add a photo, video or plain background.</li>
<li>Tap the sticker icon and choose Questions.</li>
<li>Type your own prompt so people know what to ask.</li>
<li>Post the story and wait for replies.</li>
<li>Open the viewer list on the story to see the responses.</li>
<li>Tap a question and pick share to answer it in a new story.</li>
</ol>
<p>Save your answers as a highlight on your profile so new visitors can find them later.</p>
<h2>Q&amp;A sticker ideas</h2>
<ul>
<li>Ask me anything about your job, product or hobby.</li>
<li>Product questions before a launch.</li>
<li>Tips people want on a specific topic.</li>
<li>Feedback on what to post next.</li>
<li>A weekly question session with a regular time slot.</li>
</ul>
<h2>Common mistakes</h2>
<p>A vague prompt brings few answers. Make the prompt specific, such as "What is your biggest question about meal prep?" Also answer quickly. A sticker that collects questions and never replies leaves people feeling ignored.</p>''',
 'faqs': [
  ("Is the Instagram Q&A sticker anonymous?", "No. You can see who sent each question. When you share a question in a story, the sender's name is not shown to other viewers."),
  ("How do I see responses to my question sticker?", "Open the story, swipe up or tap the viewer list, and you will find the responses there. Tap one to share or reply."),
  ("What should I write on a Q&A sticker?", "Use a clear prompt tied to one topic, such as Ask me about running shoes. Specific prompts bring more and better questions."),
 ],
 'related': ['instagram-stories', 'highlights', 'engagement', 'community-management', 'instagram'],
},
{
 'slug': 'qr-code',
 'short': "A QR code is a square barcode that a phone camera can scan to open a link, such as a website, a social profile or a sign-up page.",
 'body': '''<h2>What is a QR code?</h2>
<p>QR stands for quick response. A QR code is a pattern of black and white squares that stores a short piece of data, most often a web address. Point a phone camera at it, tap the link that pops up and you land on the page. No typing is needed.</p>
<p>You see QR codes on posters, menus, flyers, product packaging, business cards and event screens. They connect something in the real world to something online.</p>
<h2>How QR codes help social media</h2>
<ul>
<li>Send people from a shop window or flyer to your Instagram or TikTok profile.</li>
<li>Add a code to packaging that opens a how-to video.</li>
<li>Show a code at an event so people can follow you on the spot.</li>
<li>Link to a contest entry or sign-up form.</li>
</ul>
<p>Many social apps can make a QR code for your profile. Look in your profile menu for a QR or share option.</p>
<h2>Static vs dynamic QR codes</h2>
<p>A <b>static</b> QR code holds the link inside the pattern itself. It never expires, but you cannot change where it points once it is printed. A <b>dynamic</b> QR code points to a short link that a service controls, so you can change the destination later and often see how many scans it got. Dynamic codes stop working if the service stops, so pick one you trust.</p>
<h2>How to make a QR code</h2>
<ol>
<li>Decide which page the code should open.</li>
<li>Add UTM parameters to the link so you can track visits in your analytics.</li>
<li>Paste the link into a QR code generator or your social app's QR tool.</li>
<li>Download a high quality file for print.</li>
<li>Test it with a few different phones before you print hundreds of copies.</li>
</ol>
<h2>Tips for QR codes that get scanned</h2>
<p>Print the code large enough to scan from where people stand. Leave clear space around it and keep strong contrast between the squares and the background. Add a short line next to it that says what people get, such as "Scan for the recipe". A code with no reason to scan tends to be ignored.</p>''',
 'faqs': [
  ("Do QR codes expire?", "Static QR codes do not expire, since the link is stored in the pattern. Dynamic codes can stop working if the service behind them ends or your plan lapses."),
  ("How do I scan a QR code?", "Open your phone's camera and point it at the code. Tap the link that appears on screen."),
  ("Can I make a QR code for my Instagram profile?", "Yes. Instagram and many other apps can create a QR code for your profile from the profile or share menu."),
  ("Are QR codes free to make?", "Many tools make static QR codes for free. Dynamic codes with scan tracking often come with a paid plan."),
 ],
 'related': ['url-shortener', 'utm-parameters', 'link-in-bio', 'profile', 'call-to-action'],
},
{
 'slug': 'queue',
 'short': "A queue is a line of posts waiting to be published in order, each one going out at the next open time slot you set in a scheduling tool.",
 'body': '''<h2>What is a queue?</h2>
<p>In social media tools, a queue is a list of posts lined up to go out one after another. You set regular time slots for each account, such as weekday mornings and evenings. Each post you add drops into the next free slot, and the tool publishes it when that time comes. You do not have to pick a date and time for every single post.</p>
<h2>How a queue works</h2>
<ol>
<li>You set up a posting schedule with time slots for each channel.</li>
<li>You write a post and add it to the queue.</li>
<li>The tool places it in the next empty slot.</li>
<li>When the slot arrives, the post goes live.</li>
<li>The queue moves forward, and the next post waits for its slot.</li>
</ol>
<p>Most tools let you drag posts to reorder them, push an urgent post to the front or pause the whole queue if news breaks.</p>
<h2>Queue vs scheduling a set time</h2>
<p>Scheduling a post for a set date and time is best when timing matters, like a launch, a live event or a holiday greeting. A queue is best for steady, everyday content where the exact hour matters less than showing up often. Many teams use both. Time-sensitive posts get fixed times, and everything else flows through the queue.</p>
<h2>Why use a queue</h2>
<ul>
<li>You keep a steady posting rhythm without thinking about each slot.</li>
<li>You can write many posts in one sitting and let them roll out over days.</li>
<li>Gaps on busy weeks are less likely, since the queue keeps going.</li>
<li>You can change slot times once and have every queued post follow.</li>
</ul>
<h2>How to set up a good queue</h2>
<p>Start by picking slot times based on when your audience is most active. Check your analytics for the hours your followers are online. Keep enough posts in the queue to cover at least the next week, so you always have a buffer. Mix post types inside the queue, such as tips, questions and offers, so followers do not see the same kind of post several times in a row.</p>
<p>A queue runs on its own, which is both its strength and its risk. Review it often. A cheerful post going out during a serious news event, or a promotion that has already ended, can hurt your brand. Pause the queue when something big happens and check it before you start it again.</p>''',
 'faqs': [
  ("What does queue mean in social media?", "It means a list of posts waiting to be published in order. Each post goes out at the next time slot you have set."),
  ("How many posts should I keep in my queue?", "Keep enough to cover at least a week of your normal posting pace. That way a busy few days will not leave your accounts silent."),
  ("Can I change the order of posts in a queue?", "Most scheduling tools let you drag posts into a new order or move one to the front. You can also edit or remove a post before it goes out."),
 ],
 'related': ['social-media-scheduling', 'bulk-scheduling', 'content-calendar', 'posting-frequency', 'auto-posting'],
},
{
 'slug': 'quote-post',
 'short': "A quote post is a share of someone else's post with your own comment added on top, so your followers see both your words and the original.",
 'body': '''<h2>What is a quote post?</h2>
<p>A quote post lets you repost something and add your own thoughts. Your text shows first, and the original post appears below it as an embedded card that people can tap to open. On X, this was long known as a quote tweet. Threads and Bluesky also have quote posts, and LinkedIn offers a similar option when you repost with your thoughts.</p>
<h2>Quote post vs repost</h2>
<p>A plain repost shares the original exactly as it is, with no added words. It says "I think you should see this." A quote post adds your view, so it says "Here is what I think about this." Quote posts give you more room to add value, but they also put your opinion on the record next to someone else's words.</p>
<h2>Why quote posts matter</h2>
<ul>
<li>They let you join a popular conversation in your own voice.</li>
<li>They give credit to the original author while adding context.</li>
<li>They show up as your own post, so they can reach your followers in their feed.</li>
<li>The original author is usually notified, which can start a real exchange.</li>
</ul>
<h2>How to make a quote post</h2>
<ol>
<li>Find the post you want to share.</li>
<li>Tap the repost or share icon.</li>
<li>Choose Quote, or repost with your thoughts on LinkedIn.</li>
<li>Write your comment. On X you have 280 characters on a standard account, on Threads 500 and on Bluesky 300.</li>
<li>Check how the preview looks, then post.</li>
</ol>
<p>Good quote posts add something. Add a fact, a tip or a personal story that builds on the original. Thank a customer who praised you and add a short reply. Share industry news with one clear line on why it matters to your audience. Celebrate a partner's launch and tag them.</p>
<h2>Common mistakes</h2>
<p>Quote posts used to mock or pile on someone can spread fast and look bad for a brand. Avoid quoting complaints just to argue in public. If a customer has a problem, reply directly or move the chat to messages. Also skip empty quotes like "This!" that add nothing a plain repost would not.</p>''',
 'faqs': [
  ("What is the difference between a quote post and a repost?", "A repost shares the original post as it is. A quote post adds your own comment on top of it."),
  ("Does the original poster see a quote post?", "On most apps the original author gets a notification when their post is quoted. Some apps also let authors limit or remove quotes of their posts."),
  ("Can I quote post on Instagram?", "Instagram has no quote button like the one on X or Threads. A common way to comment on a post there is to share it to your story and add text."),
 ],
 'related': ['repost', 'x-twitter', 'threads', 'bluesky', 'mention'],
},
{
 'slug': 'reach',
 'short': "Reach is the number of unique people who saw your content at least once, counting each person only one time.",
 'body': '''<h2>What is reach?</h2>
<p>Reach tells you how many different people saw a post, a story, an ad or your account as a whole over a set period. If one person sees your post five times, reach counts that as one. It is a measure of how widely your content spread across people.</p>
<p>Most apps show reach in their analytics, sometimes labeled accounts reached or unique viewers.</p>
<h2>Reach vs impressions</h2>
<p>Impressions count every time your content appeared on a screen, including repeat views by the same person. Reach counts the people. So impressions are always equal to or higher than reach. Comparing the two shows frequency, which is impressions / reach. A high frequency means the same people see your content many times.</p>
<h2>Types of reach</h2>
<ul>
<li><b>Organic reach</b>: people who saw your content for free.</li>
<li><b>Paid reach</b>: people who saw it through an ad or boost.</li>
<li><b>Viral reach</b>: people who saw it because someone else shared or engaged with it.</li>
<li><b>Follower and non-follower reach</b>: some apps split viewers by whether they already follow you.</li>
</ul>
<h2>How to measure reach</h2>
<p>Open the insights for each post and note its reach. To compare posts fairly, work out the reach rate: reach / followers × 100. A rising reach rate means your content is spreading further than your follower count alone would suggest. Track reach over weeks and months, since single posts vary a lot.</p>
<h2>How to increase reach</h2>
<ol>
<li>Lead with a hook in the first line or first second of video.</li>
<li>Make content people want to share with a friend.</li>
<li>Post at times when your audience is online.</li>
<li>Use the formats each app is showing to new people, such as short video.</li>
<li>Collaborate with other accounts so you appear in front of their followers.</li>
<li>Use relevant keywords and hashtags so search can find you.</li>
</ol>
<p>Reach is the top of the funnel. Before anyone can like, click or buy, they must see you. Still, reach on its own does not prove success. Pair it with engagement and conversions to see whether the right people are seeing your posts and acting on them.</p>''',
 'faqs': [
  ("What is the difference between reach and impressions?", "Reach counts unique people who saw your content. Impressions count every view, so one person can create several impressions."),
  ("What is a good reach rate on social media?", "It depends on the app, your niche and your account size. Compare against your own past posts to see if you are improving."),
  ("Can reach be higher than followers?", "Yes. When people share your post or the app recommends it, people who do not follow you can see it, which can push reach above your follower count."),
 ],
 'related': ['impressions', 'organic-reach', 'engagement-rate', 'analytics', 'viral'],
},
{
 'slug': 'remix',
 'short': "A remix is an Instagram feature that lets you create your own Reel using someone else's Reel, either side by side, after it or as a backdrop.",
 'body': '''<h2>What is a remix?</h2>
<p>On Instagram, a remix is a Reel you make by building on another public Reel. You can play your clip next to the original, add your clip after it, or react to it in other layouts. The original creator gets credit on your remix, and people can tap through to see their Reel.</p>
<p>The idea is close to TikTok's duet and stitch features. People use remixes to react, answer a question, try a challenge, add a joke or show their own version of a trend.</p>
<h2>How remix works</h2>
<p>Remixing is available on public Reels whose creators allow it. When you remix, Instagram usually lets you choose a layout:</p>
<ul>
<li><b>Side by side</b>: your video plays next to the original.</li>
<li><b>Sequential</b>: your clip plays after a part of the original.</li>
<li><b>Green screen</b>: the original plays behind you.</li>
<li><b>Picture in picture</b>: a small view of one clip sits on top of the other.</li>
</ul>
<p>Layout choices change over time, so check the remix screen in the app for what is offered now.</p>
<h2>How to remix a Reel</h2>
<ol>
<li>Open the Reel you want to remix.</li>
<li>Tap the share or menu icon and choose Remix.</li>
<li>Pick a layout.</li>
<li>Record or upload your part of the video.</li>
<li>Add text, captions or audio changes, then write your caption and post.</li>
</ol>
<h2>How to control remixes of your Reels</h2>
<p>You can turn remixing on or off in your settings for all future Reels, or change it on a single Reel from its menu. If you share a lot of personal content, you may want to keep it off. If you want more reach, leaving it on gives others a reason to share your work.</p>
<h2>Ideas for brands</h2>
<p>Remix a customer's review Reel to thank them and show the product in use. Answer a common question someone asked in a Reel. Join a trend with your team's own take. Always keep remixes kind, since the original creator and their followers will see them.</p>''',
 'faqs': [
  ("What does remix mean on Instagram?", "It means making your own Reel that builds on someone else's Reel, such as reacting side by side or adding a clip after theirs. The original creator is credited."),
  ("Can I stop people from remixing my Reels?", "Yes. You can turn remixing off for all your Reels in settings or switch it off on one Reel from its menu."),
  ("Is remix the same as a TikTok duet?", "They are similar ideas. Both let you build a new video on top of someone else's, but each app has its own layouts and rules."),
 ],
 'related': ['instagram-reels', 'duet', 'stitch', 'trend', 'collab-post'],
},
{
 'slug': 'repost',
 'short': "A repost is when you share someone else's post with your own followers, either with a built-in repost button or by posting it again with credit.",
 'body': '''<h2>What is a repost?</h2>
<p>Reposting means passing another account's content on to your audience. On some apps, a repost button does it in one tap. The post appears in your followers' feeds and on your profile, still showing the original author. On X this used to be called a retweet. Mastodon calls it a boost. Threads, Bluesky, TikTok and LinkedIn all have their own repost buttons.</p>
<p>On apps without such a button, people repost by downloading a photo or video and posting it again on their own account with credit to the creator, or by sharing it to their story.</p>
<h2>Repost vs quote post</h2>
<p>A repost shares the original exactly as it is. A quote post adds your own comment above the original. Use a repost when the content speaks for itself, and a quote post when you have something to add.</p>
<h2>Why reposting matters</h2>
<ul>
<li>It helps creators and partners reach more people.</li>
<li>It fills your feed with useful content on days you have less to share.</li>
<li>Sharing customer posts is a strong form of social proof.</li>
<li>It shows you are part of a community, beyond posting about yourself.</li>
<li>It builds goodwill with the accounts you share.</li>
</ul>
<h2>How to repost the right way</h2>
<ol>
<li>Use the app's built-in repost button when there is one. It keeps credit attached.</li>
<li>If you need to download and post again, ask the creator for permission first.</li>
<li>Credit them clearly by tagging their handle in the caption and, where you can, on the image.</li>
<li>Do not crop out watermarks or change the content in a way that hides who made it.</li>
<li>Add your own short caption so followers know why you shared it.</li>
</ol>
<h2>Common mistakes</h2>
<p>Posting other people's photos or videos without asking can break copyright rules and upset creators. Brands should get written permission before using customer content in ads. Also watch the balance. A feed that is mostly reposts gives people little reason to follow you over the original accounts.</p>''',
 'faqs': [
  ("Is it legal to repost someone's content?", "Using an app's built-in repost button is generally allowed by that app's terms. Downloading and posting someone's work as your own without permission can break copyright law, so ask first."),
  ("How do you credit a repost?", "Tag the original creator's handle in the caption and, if you can, on the image or video. Say clearly that the content is theirs."),
  ("Can people see if I repost their content?", "On most apps with a repost button, the original author gets a notification. Your repost also shows where your followers can see it."),
 ],
 'related': ['quote-post', 'user-generated-content', 'social-proof', 'mention', 'tag'],
},
{
 'slug': 'retargeting',
 'short': "Retargeting is showing ads to people who already visited your website, used your app or engaged with your content, to bring them back.",
 'body': '''<h2>What is retargeting?</h2>
<p>Retargeting is a way to remind people about you after they leave. Someone looks at a pair of shoes on your site, then later sees an ad for those shoes on Instagram or Facebook. That is retargeting. It focuses your ad money on people who already showed interest, so they are more likely to act than strangers.</p>
<p>You may also hear it called remarketing. People often use the two words to mean the same thing.</p>
<h2>How retargeting works</h2>
<ol>
<li><b>You add a tracking tag.</b> Ad platforms give you a small piece of code, often called a pixel, to place on your website. Apps use a similar tool built into their code.</li>
<li><b>Visitors are added to a list.</b> When someone visits a page or takes an action, the tag records it.</li>
<li><b>You build an audience.</b> In the ads manager, you create a group such as "visited the pricing page" or "added to cart but did not buy".</li>
<li><b>You show ads to that group.</b> The ads appear while those people browse social apps or other sites.</li>
</ol>
<p>You can also retarget people who watched your videos, opened a lead form, followed your page or sent you a message, without any website tag.</p>
<h2>Examples of retargeting</h2>
<ul>
<li>A shop shows the exact product a visitor left in their cart.</li>
<li>A software company shows a demo video to people who read its pricing page.</li>
<li>A course creator offers a free lesson to people who watched most of a video.</li>
<li>A restaurant reminds past website visitors about a new menu.</li>
</ul>
<h2>Retargeting vs lookalike audiences</h2>
<p>Retargeting reaches people who already know you. A lookalike audience reaches new people who share traits with your customers. Retargeting usually gets better results per person, but its audience is smaller. Most ad plans use both, with lookalikes to find new people and retargeting to bring them back.</p>
<h2>Privacy and good practice</h2>
<p>Retargeting relies on tracking, so follow privacy laws and the platform's rules. Tell visitors what you track in your privacy notice and get consent where the law requires it. Browser and phone privacy settings can also make retargeting lists smaller than they used to be.</p>
<p>Limit how often the same person sees your ad, and stop showing it after they buy. Being followed by the same ad for weeks annoys people and can turn interest into dislike.</p>''',
 'faqs': [
  ("What is the difference between retargeting and remarketing?", "Most people use the words to mean the same thing. Some use remarketing for email reminders and retargeting for ads, but the goal of bringing people back is the same."),
  ("Do I need a pixel for retargeting?", "You need a pixel or similar tag to retarget website visitors. You can retarget people who engaged with your social posts or videos without one."),
  ("Is retargeting allowed under privacy laws?", "It is allowed in many places when you follow the rules, such as getting consent and explaining what you track. Check the laws that apply where your customers live."),
 ],
 'related': ['paid-social', 'lookalike-audience', 'conversion-rate', 'customer-journey', 'cost-per-click'],
},
{
 'slug': 'return-on-investment',
 'short': "Return on investment (ROI) is a measure of how much you gained from something compared with what it cost, usually shown as a percentage.",
 'body': '''<h2>What is return on investment (ROI)?</h2>
<p>ROI answers one question: was it worth it? It compares what you got back from an activity with what you put in. In social media, the activity might be a whole channel, an ad campaign, an influencer deal or a single launch.</p>
<p>The basic formula is ROI = (return - cost) / cost × 100. If the result is above zero, you made more than you spent. If it is below zero, you lost money.</p>
<h2>What counts as cost and return</h2>
<ul>
<li>Ad spend.</li>
<li>Pay for staff or freelancers, based on the hours they spend.</li>
<li>Software and tools.</li>
<li>Creator or influencer fees.</li>
<li>Photo, video and design costs.</li>
</ul>
<p>Time is the cost people forget most. A post that took a full day to make has a real price, even if you paid nothing to publish it.</p>
<p>On the other side, the clearest return is revenue: sales you can trace to social media. Other returns can be given a money value too, such as leads, sign-ups, booked calls or support costs you saved by answering questions publicly. Decide in advance what you will count, and stick to it so numbers can be compared over time.</p>
<h2>How to track social media ROI</h2>
<ol>
<li>Set a clear goal for each campaign, such as sales or sign-ups.</li>
<li>Add UTM parameters to every link so your analytics can tell which posts sent visitors.</li>
<li>Set up conversion tracking on your website or store.</li>
<li>Record all costs, including time.</li>
<li>Compare return and cost at the end of each month or campaign.</li>
</ol>
<h2>ROI vs ROAS</h2>
<p>ROAS, or return on ad spend, looks only at ad money: revenue from ads / ad spend. ROI looks at all costs, including people and tools. A campaign can have a healthy ROAS and still lose money once everything else is counted.</p>
<h2>Common mistakes</h2>
<p>Many teams count likes and followers as return. Those can lead to sales, but they are signs of progress, so treat them as steps. Another mistake is judging ROI too soon. Some buyers see your posts for months before they act, so look at longer periods as well as single campaigns.</p>''',
 'faqs': [
  ("How do you calculate social media ROI?", "Subtract your total costs from the value you gained, divide by the costs and multiply by 100. Count time, tools and ad spend as costs."),
  ("What is a good ROI for social media?", "Any ROI above zero means you earned more than you spent. What counts as good depends on your business, margins and goals."),
  ("Can you measure ROI on organic social?", "Yes, though it takes more setup. Use tracked links and conversion goals, and count the time your team spends as the main cost."),
 ],
 'related': ['key-performance-indicator', 'conversion-rate', 'utm-parameters', 'analytics', 'vanity-metrics'],
},
{
 'slug': 'rich-pin',
 'short': "A Rich Pin is a Pinterest pin that pulls extra details, like a product's price or a recipe's ingredients, straight from your website.",
 'body': '''<h2>What is a Rich Pin?</h2>
<p>A Rich Pin is a pin that shows more than a picture and a title. It reads information from the web page it links to and displays it on the pin. If the details on your page change, the pin can update to match. That makes Rich Pins useful for shops, food blogs and publishers that share a lot of content on Pinterest.</p>
<h2>Types of Rich Pins</h2>
<ul>
<li><b>Product Pins</b>: show details such as price and whether an item is in stock.</li>
<li><b>Recipe Pins</b>: show a recipe's title, ingredients and serving details.</li>
<li><b>Article Pins</b>: show the headline, author and a short description of a blog post or story.</li>
</ul>
<h2>How Rich Pins work</h2>
<p>Rich Pins rely on metadata, the hidden tags in your page's code that describe what is on it. Pinterest reads standard formats such as Open Graph tags and schema markup. When someone saves a pin from your site, Pinterest checks those tags and adds the details to the pin.</p>
<h2>How to set up Rich Pins</h2>
<ol>
<li>Make sure your website has the right metadata. Many website builders, store platforms and SEO plugins add it for you.</li>
<li>Check a page's source code for tags such as og:title and og:description, or product and recipe schema.</li>
<li>Claim your website on your Pinterest business account.</li>
<li>Follow Pinterest's current steps to turn on Rich Pins, which may include checking a sample page.</li>
<li>Save a new pin from your site and confirm the extra details appear.</li>
</ol>
<p>Pinterest updates its setup steps from time to time, so check its help pages for the latest version.</p>
<h2>Why Rich Pins matter</h2>
<p>The extra details help people decide before they click. A shopper can see the price on the pin. A home cook can see the ingredients and know right away if the recipe works for them. Because the data comes from your site, you do not have to type it into every pin by hand, and you avoid pins with old prices.</p>
<p>Rich Pins break when the metadata on your site is missing or wrong. If your pins stop showing details, check your page tags first. Also keep the title and description on your pages clear, since they now appear on Pinterest too.</p>''',
 'faqs': [
  ("Are Rich Pins free?", "Yes. Rich Pins cost nothing. You only need a website with the right metadata and a Pinterest business account."),
  ("Why are my Rich Pins not working?", "The most common cause is missing or broken metadata on your pages. Check your page tags and that your website is claimed on Pinterest."),
  ("Do Rich Pins update automatically?", "Rich Pins pull details from your website, so changes to your page can show up on the pin over time."),
 ],
 'related': ['pin', 'pinterest', 'open-graph', 'social-commerce', 'saves'],
},
{
 'slug': 'rss-feed',
 'short': "An RSS feed is a file a website publishes that lists its newest posts in a standard format, so apps and tools can pick up new content automatically.",
 'body': '''<h2>What is an RSS feed?</h2>
<p>RSS stands for Really Simple Syndication. An RSS feed is a page of code that a blog, news site or podcast updates every time it publishes something new. Each item in the feed usually has a title, a link, a date and a short summary. Feed reader apps and other tools check the feed and show you new items without you having to visit the site.</p>
<p>Podcasts run on RSS too. When you subscribe to a show in a podcast app, the app is following its RSS feed.</p>
<h2>How RSS feeds work</h2>
<ol>
<li>A site publishes a new post.</li>
<li>Its RSS feed adds the new item at the top.</li>
<li>Apps that follow the feed check it on a regular schedule.</li>
<li>When they find something new, they show it to you or act on it.</li>
</ol>
<h2>How RSS feeds help with social media</h2>
<ul>
<li><b>Auto-sharing</b>: tools can watch your blog's feed and create a social post each time you publish.</li>
<li><b>Content curation</b>: follow feeds from trusted sites to find articles worth sharing with your audience.</li>
<li><b>Staying informed</b>: track industry news in one place without endless browsing.</li>
<li><b>Following social accounts</b>: some apps, like Mastodon and Bluesky, offer RSS feeds of public profiles.</li>
</ul>
<h2>How to find a site's RSS feed</h2>
<p>Look for an RSS icon, often orange, or a link labeled Feed or Subscribe. Many blogs use an address that ends in /feed or /rss. WordPress sites usually have one at /feed. You can also paste the site's address into a feed reader, which can often find the feed for you.</p>
<h2>Tips for sharing from an RSS feed</h2>
<p>Auto-sharing saves time, but posts made straight from a feed can look plain. Review them before they go out when you can. Add a hook, a question or a few lines of context so the post feels written for each app. Make sure your pages have Open Graph tags, so the link preview shows the right image and title.</p>''',
 'faqs': [
  ("Is RSS still used?", "Yes. Podcasts depend on RSS, and many news readers, blogs and automation tools still use it every day."),
  ("How do I get the RSS feed for a website?", "Look for an RSS icon or a feed link, or try adding /feed or /rss to the site's address. A feed reader can often find it from the main address."),
  ("Can I post my blog to social media automatically with RSS?", "Yes. Many scheduling and automation tools can watch your blog's RSS feed and create a post whenever you publish."),
 ],
 'related': ['auto-posting', 'social-media-scheduling', 'open-graph', 'evergreen-content', 'api'],
},
{
 'slug': 'saves',
 'short': "Saves are the number of times people bookmarked your post so they could find it again later, a sign they found it useful.",
 'body': '''<h2>What are saves?</h2>
<p>A save happens when someone taps the bookmark or save button on a post. The post goes into a private collection on their account so they can come back to it. Instagram, TikTok, Pinterest, X, LinkedIn, Facebook and YouTube all offer some way to save content. Some call it bookmarks, favorites, collections or Watch later, but the idea matches.</p>
<p>Most apps show you how many saves a post got in your insights. They usually do not show who saved it.</p>
<h2>Why saves matter</h2>
<p>A like takes half a second. A save means the person plans to return, which is a stronger sign that your content was worth their time. Many apps treat saves as a signal of value when they decide what to show more people. Saves also show you which topics your audience finds most useful, which helps you plan future posts.</p>
<h2>How to measure saves</h2>
<p>Look at saves on each post in your analytics. To compare posts that reached different numbers of people, use the save rate: saves / reach × 100. Posts with a high save rate are good candidates to turn into a series, a longer guide or an ad.</p>
<h2>How to get more saves</h2>
<ul>
<li>Share checklists, step-by-step guides and how-to tips.</li>
<li>Use carousels that pack a lot of useful detail into one post.</li>
<li>Post recipes, templates, resource lists and cheat sheets.</li>
<li>Add text that says the post is worth keeping, such as "Save this for your next trip."</li>
<li>Make infographics people want to look at again.</li>
<li>Cover questions your audience asks often.</li>
</ul>
<h2>Saves vs likes and shares</h2>
<p>Likes show quick approval. Shares show people want others to see your post. Saves show people want to keep it for themselves. A post with many saves and few likes often holds real, practical value. Funny or emotional posts tend to get shared. Useful posts tend to get saved. Track all three to see the full picture.</p>''',
 'faqs': [
  ("Can you see who saved your Instagram post?", "No. Instagram shows how many people saved a post in your insights but does not show their names."),
  ("Are saves more important than likes?", "Saves are often seen as a stronger signal because they show the post had lasting value. Both matter, but saves tell you more about usefulness."),
  ("Where do I find saved posts on Instagram?", "Go to your profile, open the menu and tap Saved. Your saved posts are only visible to you."),
 ],
 'related': ['shares', 'like', 'engagement-rate', 'carousel-post', 'evergreen-content'],
},
{
 'slug': 'sentiment-analysis',
 'short': "Sentiment analysis is the process of sorting comments, mentions and messages by the feeling behind them, such as positive, negative or neutral.",
 'body': '''<h2>What is sentiment analysis?</h2>
<p>Sentiment analysis looks at what people write and judges the mood of it. A comment like "Love the new update, it saves me so much time" is positive. "Still waiting for a reply after two days" is negative. "Does this come in blue?" is neutral. Doing this by hand works for a few comments. For hundreds or thousands, teams use software that reads the text and labels it automatically.</p>
<p>On social media, sentiment analysis is often part of social listening and inbox tools. It helps you see how people feel about your brand, a product, a campaign or a topic.</p>
<h2>How sentiment analysis works</h2>
<p>Modern tools use AI language models trained on large amounts of text. They read each message, look at the words, the order and the context, and give it a label or a score. Some tools go further and spot specific feelings, such as anger, joy or confusion, or tie the mood to a feature, like shipping or price.</p>
<h2>Why sentiment analysis matters</h2>
<ul>
<li><b>Spot problems early</b>: a jump in negative mentions can warn you about a bug, a delay or a bad ad.</li>
<li><b>Sort your inbox</b>: angry or urgent messages can rise to the top so someone replies first.</li>
<li><b>Measure campaigns</b>: see whether people liked a launch, beyond how many talked about it.</li>
<li><b>Compare with competitors</b>: check how the mood around your brand stacks up.</li>
</ul>
<h2>How to use sentiment analysis</h2>
<ol>
<li>Decide what you want to track: your brand name, products, campaigns or industry topics.</li>
<li>Collect mentions, comments and messages with a listening or inbox tool.</li>
<li>Review the sentiment trend each week, as well as single posts.</li>
<li>Read a sample of messages in each group to check the labels make sense.</li>
<li>Act on what you find, such as fixing a common complaint or thanking happy customers.</li>
</ol>
<h2>Limits of sentiment analysis</h2>
<p>Software can misread sarcasm. "Great, my order is late again" uses a positive word with a negative meaning. Slang, emoji, inside jokes and mixed messages are hard too. Treat sentiment scores as a guide and always have a person read the messages that matter most, especially complaints and anything that could become a crisis.</p>''',
 'faqs': [
  ("What is an example of sentiment analysis?", "A tool reads the comments on a product launch post and labels most of them positive, a few negative and the rest neutral. You then read the negative ones to see what went wrong."),
  ("How accurate is sentiment analysis?", "It works well on clear, simple messages but can miss sarcasm, slang and mixed feelings. Check a sample by hand to judge how well it fits your audience."),
  ("Is sentiment analysis the same as social listening?", "No. Social listening is gathering and studying what people say about a topic. Sentiment analysis is one part of it that judges the mood of those messages."),
 ],
 'related': ['social-listening', 'share-of-voice', 'social-customer-service', 'mention', 'community-management'],
},
{
 'slug': 'shadowban',
 'short': "A shadowban is an informal name for when an app limits who sees an account's posts without telling the owner, so reach drops with no clear reason.",
 'body': '''<h2>What is a shadowban?</h2>
<p>People say they have been shadowbanned when their posts suddenly stop reaching others. The account still works, and the owner can post as normal, but the posts may not show in hashtags, search, recommendations or followers' feeds. Because there is no notice, it can feel like being banned in secret.</p>
<p>Most platforms do not use the word shadowban. They do say they may limit how widely some content is recommended, for example posts that break their rules or recommendation guidelines. Many reach drops people blame on shadowbans have other causes, such as changes to the algorithm or content that simply did not land.</p>
<h2>Signs of a possible shadowban</h2>
<ul>
<li>A sharp, sudden drop in reach across many posts at once.</li>
<li>Your posts do not show up under a hashtag when viewed from another account.</li>
<li>Your account is hard to find in search, even by its exact handle.</li>
<li>Almost no new followers or non-followers see your content.</li>
</ul>
<h2>Common causes of limited reach</h2>
<ul>
<li>Breaking community guidelines, even by mistake.</li>
<li>Using banned or spammy hashtags.</li>
<li>Following, liking or commenting at a very fast pace, which can look like a bot.</li>
<li>Posting content flagged as misleading, sensitive or reused from others.</li>
<li>Many people reporting or hiding your posts.</li>
</ul>
<h2>How to check and fix a shadowban</h2>
<ol>
<li>Look for an account status or account quality page in the app's settings. Some apps show there whether your content can be recommended.</li>
<li>Remove posts that may break the rules and appeal any decision you think is wrong.</li>
<li>Stop using any hashtag that shows few or no recent posts.</li>
<li>Slow down activity and avoid tools that automate likes, follows or comments.</li>
<li>Keep posting original content that follows the rules, and give it a few weeks.</li>
</ol>
<h2>How to avoid a shadowban</h2>
<p>Read each app's community guidelines once and check them again when you start a new type of content. Post your own work, avoid engagement bait and never buy followers or likes. If reach drops, look at your analytics before assuming the worst. Often a change in format, timing or topic is enough to bring reach back.</p>''',
 'faqs': [
  ("How do I know if I am shadowbanned?", "Check your app's account status page first, if it has one. Then look for a sudden drop in reach across many posts and see if your posts show under hashtags from another account."),
  ("How long does a shadowban last?", "There is no set length, since apps do not publish one. Reach often recovers once you remove posts that break the rules and keep posting normally."),
  ("Do platforms admit to shadowbanning?", "Most avoid the term. They do say they may limit how widely certain content is recommended, which is what many people mean by a shadowban."),
 ],
 'related': ['algorithm', 'community-guidelines', 'organic-reach', 'engagement-bait', 'hashtag'],
},
{
 'slug': 'share-of-voice',
 'short': "Share of voice is how much of the online conversation in your market is about your brand compared with your competitors, shown as a percentage.",
 'body': '''<h2>What is share of voice?</h2>
<p>Share of voice measures your slice of the attention in your space. If people talk about coffee machines online, share of voice tells you how much of that talk is about your brand and how much is about others. A bigger share usually means more people know your name and think of you first.</p>
<p>The term started in advertising, where it meant your share of all ad spending in a market. On social media, it most often means your share of mentions.</p>
<h2>How to calculate share of voice</h2>
<p>The basic formula is share of voice = your brand's mentions / total mentions of all brands in your group × 100. You choose which competitors to include and the time period. You can swap mentions for other measures, such as:</p>
<ul>
<li>Hashtag use.</li>
<li>Engagements on posts about each brand.</li>
<li>Impressions from posts that mention each brand.</li>
<li>Ad impressions, for paid share of voice.</li>
</ul>
<h2>How to measure share of voice</h2>
<ol>
<li>Make a list of the competitors you want to compare against.</li>
<li>List the keywords for each brand: names, product names, common misspellings and hashtags.</li>
<li>Use a social listening tool to count mentions across apps over the same period.</li>
<li>Add up the total and work out each brand's share.</li>
<li>Repeat on a regular schedule so you can see trends.</li>
</ol>
<h2>Why share of voice matters</h2>
<p>Share of voice shows whether your marketing is getting noticed relative to others. If your mentions grow while your share stays flat, the whole market is just getting louder. If your share grows, you are winning attention. It also helps you spot a competitor's big campaign early.</p>
<p>Pair share of voice with sentiment. A large share made up of complaints is a problem to fix.</p>
<h2>How to grow share of voice</h2>
<p>Post useful content often enough to stay in view. Join conversations in your niche, answer questions and work with creators your audience trusts. Encourage customers to post about you, and reply when they do. Run campaigns with a clear hashtag so people can find and join them.</p>''',
 'faqs': [
  ("What is a good share of voice?", "It depends on how many competitors you have and how big they are. The key is whether your share is growing over time against the same group."),
  ("How is share of voice different from market share?", "Market share measures your portion of sales. Share of voice measures your portion of attention or conversation, which can come before sales grow."),
  ("Can I measure share of voice for free?", "You can count mentions by hand using each app's search for a small set of brands. Larger or ongoing tracking usually needs a social listening tool."),
 ],
 'related': ['social-listening', 'sentiment-analysis', 'brand-awareness', 'mention', 'key-performance-indicator'],
},
{
 'slug': 'shares',
 'short': "Shares are the number of times people passed your post on to others, by reposting it, sending it in a message or adding it to their story.",
 'body': '''<h2>What are shares?</h2>
<p>A share happens when someone takes your post and spreads it further. They might repost it to their own followers, send it to a friend in a direct message, add it to their story or copy the link and paste it elsewhere. Each app counts shares a little differently, and some split them into reposts and sends.</p>
<h2>Why shares matter</h2>
<p>Shares are one of the strongest forms of engagement. When people share, they put their own name next to your content and tell their friends it is worth a look. That brings your post to people who do not follow you yet, which is how posts reach far beyond your audience and sometimes go viral.</p>
<p>Many apps also treat shares, and sends in private messages, as a sign that a post deserves to be shown to more people.</p>
<h2>Types of shares</h2>
<ul>
<li><b>Reposts</b>: shared to the person's own profile or feed.</li>
<li><b>Quote posts</b>: shared with an added comment.</li>
<li><b>Sends</b>: shared privately in a direct message or group chat.</li>
<li><b>Story shares</b>: added to the person's story for a day.</li>
<li><b>Link copies</b>: pasted into other apps, emails or chats, which apps often cannot fully track.</li>
</ul>
<h2>How to measure shares</h2>
<p>Look at shares in the insights for each post. To compare posts fairly, work out the share rate: shares / reach × 100. Keep in mind that a lot of sharing happens through copied links in private chats, sometimes called dark social, so your real share count may be higher than the number shown.</p>
<h2>How to get more shares</h2>
<ol>
<li>Make content that helps people look smart, funny or caring when they pass it on.</li>
<li>Post relatable moments people want to send to a friend with "this is so you".</li>
<li>Share useful tips, news or data your audience will want their team to see.</li>
<li>Ask directly now and then, such as "Send this to someone planning a trip."</li>
<li>Keep the main point clear in the first second, since people share what they understand fast.</li>
</ol>
<p>Saves show that someone wants to keep a post for themselves. Shares show they want others to see it. Practical guides tend to get saved, while funny, moving or surprising posts tend to get shared. Tracking both shows you what kind of value your content gives.</p>''',
 'faqs': [
  ("What counts as a share on Instagram?", "Instagram counts it as a share when someone sends your post in a direct message or adds it to their story. Reposts may also be counted where the feature is available."),
  ("Are shares better than likes?", "Shares usually matter more because they bring your post to new people. A like shows approval, while a share puts your post in front of someone else."),
  ("Why can't I see all my shares?", "Many shares happen by copying a link into private chats or other apps, which platforms cannot always track. Your true share count is often higher than shown."),
 ],
 'related': ['saves', 'repost', 'dark-social', 'viral', 'engagement'],
},
{
 'slug': 'snapchat',
 'short': "Snapchat is a messaging and camera app where people send photos and videos called Snaps, many of which disappear after they are viewed.",
 'body': '''<h2>What is Snapchat?</h2>
<p>Snapchat is a phone app built around the camera. It opens straight to a camera screen, so you can snap a photo or short video, add text, drawings or a fun lens and send it to friends. By default, many Snaps disappear after they are opened. That made Snapchat feel more casual and private than apps where every post stays on a profile.</p>
<p>Snapchat is known for being popular with teens and young adults, and for its augmented reality lenses that add effects to your face or surroundings.</p>
<h2>Main Snapchat features</h2>
<ul>
<li><b>Snaps and chat</b>: photos, videos and messages sent to friends.</li>
<li><b>Stories</b>: a series of Snaps that friends can watch for a day.</li>
<li><b>Spotlight</b>: a feed of short public videos, similar to other short video apps.</li>
<li><b>Lenses and filters</b>: augmented reality effects and overlays.</li>
<li><b>Snap Map</b>: a map where friends can choose to share their location and see public Snaps from places.</li>
<li><b>Discover</b>: shows and stories from publishers and creators.</li>
</ul>
<h2>How businesses use Snapchat</h2>
<p>Brands can set up a public profile that people can follow and visit. From there, they can post Stories, share Spotlight videos and save content to their profile. Other common uses are:</p>
<ol>
<li>Running ads between Stories or in the Discover and Spotlight feeds.</li>
<li>Creating custom lenses or filters for a product launch or event.</li>
<li>Showing behind-the-scenes moments that feel less polished than feed posts.</li>
<li>Working with Snapchat creators who already reach your audience.</li>
</ol>
<h2>Is Snapchat free?</h2>
<p>Yes. Snapchat is free to download and use. It also offers an optional paid subscription with extra features, and businesses pay only if they choose to run ads.</p>
<h2>Tips for Snapchat content</h2>
<p>Shoot vertical video on your phone and keep it quick and personal. People on Snapchat expect raw, casual content from friends and brands alike. Talk to the camera, use lenses and text to add fun, and post Stories often so you stay in view. Save your best content to your public profile so it does not vanish.</p>''',
 'faqs': [
  ("Do Snapchat messages really disappear?", "Many Snaps and chats disappear after they are viewed by default, but people can take screenshots or save chats. Treat anything you send as something that could be kept."),
  ("Can businesses use Snapchat?", "Yes. Businesses can create a public profile, post Stories and Spotlight videos, and run ads through Snapchat's ads tool."),
  ("What is Snapchat Spotlight?", "Spotlight is Snapchat's feed of short public videos. Anyone can submit a video, and it can be shown to people who do not follow you."),
 ],
 'related': ['augmented-reality-filter', 'story', 'filter', 'business-account', 'vlog'],
},
{
 'slug': 'social-commerce',
 'short': "Social commerce is selling products directly inside social media apps, so people can find, browse and buy without leaving the app.",
 'body': '''<h2>What is social commerce?</h2>
<p>Social commerce means shopping happens where people scroll. A shopper sees a product in a video or post, taps it, reads the details and, on some apps, checks out right there. Even when the final payment happens on the brand's website, the discovery and the decision start on social media.</p>
<p>It is different from simply posting about products and linking to a store. Social commerce uses shopping tools built into the app, such as product tags, shops and in-app checkout.</p>
<h2>How social commerce works</h2>
<ol>
<li>You connect a product catalog to the app, often through your store platform.</li>
<li>The app approves your shop and products under its commerce rules.</li>
<li>You tag products in posts, videos, stories or live streams.</li>
<li>Shoppers tap a tag to see the price and details.</li>
<li>They buy in the app or tap through to your website, depending on the app and region.</li>
</ol>
<h2>Where social commerce happens</h2>
<ul>
<li><b>TikTok Shop</b>: products in videos and live streams, with checkout in the app where offered.</li>
<li><b>Instagram and Facebook</b>: product tags and shops linked to a catalog.</li>
<li><b>Pinterest</b>: product pins that link to items and show details.</li>
<li><b>YouTube</b>: product shelves and tags on videos and streams for eligible channels.</li>
<li><b>Live shopping</b>: hosts show products in a live stream while viewers buy.</li>
</ul>
<p>Features and countries change often, so check each app's current shopping options.</p>
<h2>Why social commerce matters</h2>
<p>Every extra step between seeing a product and buying it loses some shoppers. Social commerce removes steps. It also lets real people, such as creators and happy customers, show products in action, which builds trust faster than a plain product page.</p>
<h2>How to start with social commerce</h2>
<p>Pick the app where your buyers already spend time. Set up a business account and connect your catalog. Start by tagging products in content that already does well. Work with creators who can show the product in their own style, and try a live shopping session once you have a few products people ask about. Track sales by app so you know where to invest more.</p>
<p>Some shops treat social commerce like a catalog and post only product photos. People came to scroll, so lead with stories, tips and entertainment, and let the products sit inside that content. Also watch stock levels, since a viral video can sell out an item fast.</p>''',
 'faqs': [
  ("What is an example of social commerce?", "A viewer watches a creator review a skincare product on TikTok, taps the product tag and buys it in the app. That is social commerce."),
  ("Is social commerce the same as e-commerce?", "Social commerce is a type of e-commerce. The difference is that discovery, and often the purchase, happen inside a social app."),
  ("Do I need a website for social commerce?", "Many apps connect to a store platform or product catalog, so most brands have one. Some apps let you sell with only an in-app shop, depending on the region."),
 ],
 'related': ['tiktok-shop', 'live-streaming', 'influencer-marketing', 'rich-pin', 'user-generated-content'],
},
{
 'slug': 'social-customer-service',
 'short': "Social customer service is helping customers through social media, by answering their questions, complaints and requests in comments and direct messages.",
 'body': '''<h2>What is social customer service?</h2>
<p>Social customer service is support that happens on social apps. A customer comments that their order is late, sends a direct message asking how to reset a password or tags your brand in a post about a broken product. Your team replies, solves the problem and keeps a record, just like with email or phone support.</p>
<p>Many people now reach out on social first because it is fast and they are already in the app. Some also post in public when they feel other channels did not work.</p>
<h2>Why social customer service matters</h2>
<ul>
<li>Replies are often public, so a good answer shows many people that you care.</li>
<li>A fast fix can turn an angry customer into a fan.</li>
<li>Ignored complaints can spread and hurt your reputation.</li>
<li>Common questions reveal problems in your product, site or process.</li>
</ul>
<h2>How to do social customer service well</h2>
<ol>
<li><b>Bring messages into one inbox.</b> Comments, mentions and DMs from every app in one place make sure nothing gets missed.</li>
<li><b>Set reply time goals.</b> Decide how fast your team should answer and track it.</li>
<li><b>Move private details to DMs.</b> Never ask for order numbers, addresses or account details in public comments.</li>
<li><b>Use saved replies wisely.</b> Templates speed up common answers, but add the person's name and details so it does not feel robotic.</li>
<li><b>Know when to hand off.</b> Have a clear path to send complex issues to the right team.</li>
<li><b>Close the loop.</b> Follow up to make sure the problem is truly solved.</li>
</ol>
<h2>How to handle complaints in public</h2>
<p>Stay calm and polite, even if the customer is not. Thank them for raising it, say sorry for the trouble and offer a clear next step. If you need private details, invite them to send a direct message. Once it is solved, a short public reply can show others that you followed through. Do not delete fair complaints, since people notice and it often makes things worse.</p>
<h2>What to measure</h2>
<p>Track first reply time, time to solve, number of conversations and customer satisfaction. Sentiment analysis can show whether the mood around your brand improves as support gets better.</p>''',
 'faqs': [
  ("How fast should you reply to customers on social media?", "As fast as you reasonably can, since people expect quicker answers on social than by email. Set a goal your team can meet and post your support hours if you are not available around the clock."),
  ("Should I reply to negative comments publicly?", "Yes, in most cases. A calm, helpful public reply shows others you care, and you can move the details to a private message."),
  ("What tools help with social customer service?", "A shared social inbox that collects comments, mentions and messages from all your accounts is the main tool. Saved replies, tags and assignments help a team work together."),
 ],
 'related': ['community-management', 'direct-message', 'sentiment-analysis', 'suggested-replies', 'moderation'],
},
{
 'slug': 'social-listening',
 'short': "Social listening is tracking what people say online about your brand, competitors and industry, then using what you learn to make better decisions.",
 'body': '''<h2>What is social listening?</h2>
<p>Social listening means paying attention to the wider conversation, beyond your own notifications. It includes posts that mention your brand without tagging you, talk about your competitors, discussion of your industry and the questions your audience asks. A listening tool searches social apps, forums, blogs and news sites for the keywords you choose and gathers the results in one place.</p>
<h2>Social listening vs social monitoring</h2>
<p>Social monitoring is watching for mentions so you can reply to them, like answering a customer who tagged you. Social listening goes a step further. It looks for patterns across many conversations and asks what they mean for your brand. Monitoring is about single messages. Listening is about the bigger picture.</p>
<h2>Why social listening matters</h2>
<ul>
<li>Find out how people really feel about your brand and products.</li>
<li>Catch a complaint or crisis before it grows.</li>
<li>Learn what customers like and dislike about competitors.</li>
<li>Discover content ideas from real questions.</li>
<li>Find creators and fans who already talk about you.</li>
<li>Spot trends early in your niche.</li>
</ul>
<h2>How to start social listening</h2>
<ol>
<li><b>Pick your keywords.</b> Include your brand name, product names, common misspellings, hashtags, competitors and industry terms.</li>
<li><b>Choose where to listen.</b> Focus on the apps and sites where your audience talks.</li>
<li><b>Set up a tool or saved searches.</b> Even each app's own search can work for a small brand.</li>
<li><b>Review results on a schedule.</b> Look daily for urgent issues and monthly for trends.</li>
<li><b>Share what you learn.</b> Send product feedback to the product team and content ideas to your writers.</li>
</ol>
<p>Once you are set up, watch the volume of mentions over time, the sentiment, the topics that come up again and again, and the people driving the conversation. Compare your share of voice with competitors. A sudden spike in mentions is always worth a look, whether it is good news or bad.</p>
<h2>Common mistakes</h2>
<p>Choosing keywords that are too broad fills your results with noise. Too narrow, and you miss real talk about you. Refine your list often. Data on its own changes nothing, so make sure someone reads the findings and acts on them.</p>''',
 'faqs': [
  ("What is an example of social listening?", "A shoe brand notices many people online asking for a wider fit. It reads the posts, tells the product team and later launches a wide version."),
  ("Is social listening free?", "You can listen for free by searching each app for your brand and keywords. Dedicated listening tools that cover many sites at once are usually paid."),
  ("What is the difference between social listening and social monitoring?", "Monitoring tracks mentions so you can reply to each one. Listening studies many conversations to find patterns and guide decisions."),
 ],
 'related': ['sentiment-analysis', 'share-of-voice', 'mention', 'social-customer-service', 'trend'],
},
{
 'slug': 'social-media-audit',
 'short': "A social media audit is a review of all your social accounts and results, to see what is working, what is not and what to change next.",
 'body': '''<h2>What is a social media audit?</h2>
<p>A social media audit is a health check for your social presence. You list every account your brand has, look at how each one looks and performs, and compare the results with your goals. At the end, you have a clear picture of where you stand and a short list of changes to make.</p>
<p>Many teams run an audit once or twice a year, before planning a new strategy, or when a new person takes over the accounts.</p>
<h2>Why a social media audit matters</h2>
<p>Over time, brands collect old accounts, mismatched bios and posting habits nobody remembers choosing. An audit clears that up. It shows which apps are worth your time, which content types earn results and where you are wasting effort. It also finds risks, like a forgotten account a former employee still controls.</p>
<h2>How to do a social media audit</h2>
<ol>
<li><b>List every account.</b> Search each app for your brand name to find old or fake profiles too.</li>
<li><b>Check who has access.</b> Note the owner and every person with login or admin rights.</li>
<li><b>Review each profile.</b> Check the name, handle, photo, bio, links and contact details for accuracy and match across apps.</li>
<li><b>Gather the numbers.</b> For a set period, record followers, reach, engagement rate, clicks and conversions.</li>
<li><b>Find top and bottom posts.</b> Look at what your best and worst posts have in common.</li>
<li><b>Compare with goals.</b> See whether each account supports what your business is trying to do.</li>
<li><b>Look at competitors.</b> Note what similar brands post and how people respond.</li>
<li><b>Write the action list.</b> Decide what to keep, fix, start and stop.</li>
</ol>
<h2>What a social media audit template includes</h2>
<ul>
<li>Account name, link and owner.</li>
<li>Profile check notes.</li>
<li>Key metrics for the period.</li>
<li>Top posts and content themes.</li>
<li>Audience details.</li>
<li>Actions and deadlines.</li>
</ul>
<p>A simple spreadsheet with one row per account and one column per item works well.</p>
<h2>Common mistakes</h2>
<p>Some audits look only at follower counts, which say little on their own. Focus on metrics tied to your goals, such as clicks, leads or sales. Another mistake is finishing the audit and filing it away. Assign each action to a person with a date, and check progress at your next review.</p>''',
 'faqs': [
  ("How often should you do a social media audit?", "Many teams audit once or twice a year. Do one sooner if you are starting a new strategy, launching a rebrand or taking over accounts."),
  ("What should be included in a social media audit?", "Include every account, who has access, profile details, key metrics, top and bottom posts, a competitor check and a list of actions."),
  ("How long does a social media audit take?", "It depends on how many accounts you have. A small brand can finish in an afternoon, while a large company may need several days."),
 ],
 'related': ['analytics', 'key-performance-indicator', 'engagement-rate', 'brand-voice', 'content-pillars'],
},
{
 'slug': 'social-media-management-tool',
 'short': "A social media management tool is software that lets you plan, schedule, publish, reply to and measure posts across many social accounts from one place.",
 'body': '''<h2>What is a social media management tool?</h2>
<p>A social media management tool connects to your accounts on different apps and gives you one dashboard to run them. Instead of logging in and out of each app, you write posts, set their times, answer comments and check results in a single place. Teams, agencies and solo creators all use these tools to save time and stay organized.</p>
<h2>Common features</h2>
<ul>
<li><b>Scheduling and publishing</b>: write posts ahead and have them go live at set times.</li>
<li><b>Content calendar</b>: see every planned post across all accounts on one calendar.</li>
<li><b>Social inbox</b>: read and reply to comments, mentions and messages from all apps together.</li>
<li><b>Analytics and reports</b>: compare reach, engagement and clicks across accounts.</li>
<li><b>Team tools</b>: roles, approvals and notes so several people can work safely.</li>
<li><b>Media library</b>: store images and videos for reuse.</li>
<li><b>AI help</b>: draft captions, suggest replies or turn one post into versions for each app.</li>
</ul>
<h2>How a social media management tool works</h2>
<p>You sign in to each social account through the tool, and the app asks you to allow access. The tool then uses the platform's official connection, called an API, to post and read data on your behalf. What a tool can do depends on what each platform allows through its API, so some features vary from app to app.</p>
<h2>How to choose a social media management tool</h2>
<ol>
<li>List the apps you post on and make sure the tool supports all of them.</li>
<li>Decide which features you truly need, such as an inbox, approvals or reports.</li>
<li>Check how many accounts and team members each plan includes.</li>
<li>Try a free trial or free plan with your real content.</li>
<li>Test the mobile app if you post on the go.</li>
<li>Read how the tool handles your data and permissions.</li>
</ol>
<h2>Is a social media management tool free?</h2>
<p>Many tools offer a free plan with limits on accounts or posts. Paid plans add more accounts, team seats and advanced features. Most social apps also have their own free scheduling and insights tools, which can be enough if you use only one or two apps.</p>
<p>One warning: posting the exact same text everywhere is easy with a tool, but each app has its own style and limits. X allows 280 characters on standard accounts, while LinkedIn allows 3,000. Adjust each version so it fits the app it goes to.</p>''',
 'faqs': [
  ("What does a social media management tool do?", "It lets you plan, schedule and publish posts, reply to messages and see analytics for many social accounts from one dashboard."),
  ("Is it safe to connect my accounts to a social media tool?", "Reputable tools connect through each platform's official login and API, so they never need your password. Remove access for any tool you stop using."),
  ("Do I need a social media management tool?", "If you manage several accounts or work in a team, a tool saves a lot of time. For one account, the app's own tools may be enough."),
 ],
 'related': ['social-media-scheduling', 'content-calendar', 'approval-workflow', 'analytics', 'api'],
},
{
 'slug': 'social-media-manager',
 'short': "A social media manager is the person who plans, creates, posts and measures a brand's content on social apps and talks with its online community.",
 'body': '''<h2>What is a social media manager?</h2>
<p>A social media manager runs a brand's presence on social apps. In a small business, one person might do everything, from writing captions to replying to messages at night. In a large company, the manager may lead a team of writers, designers, video editors and community staff. Either way, the role is responsible for how the brand looks, sounds and performs on social media.</p>
<h2>What does a social media manager do?</h2>
<ul>
<li><b>Strategy</b>: set goals, choose apps and decide what to post about.</li>
<li><b>Planning</b>: build and keep the content calendar.</li>
<li><b>Content</b>: write, shoot, edit or brief others to make posts.</li>
<li><b>Publishing</b>: schedule posts and make sure they go out on time.</li>
<li><b>Community</b>: answer comments and messages, and handle complaints.</li>
<li><b>Reporting</b>: track results and share what is working.</li>
<li><b>Paid support</b>: help plan or run social ads, in some roles.</li>
<li><b>Partnerships</b>: work with creators, influencers and other brands.</li>
</ul>
<h2>Skills a social media manager needs</h2>
<p>Good writing comes first, since almost every post needs words. Visual sense matters too, along with basic photo and video editing. Managers also need to read analytics, stay calm during a crisis, keep up with trends and explain results to people who do not use social media every day. Organization ties it all together, because there are always many posts, apps and deadlines at once.</p>
<h2>How to become a social media manager</h2>
<ol>
<li>Learn how the main apps work by using them as a creator, beyond scrolling.</li>
<li>Grow an account of your own or run one for a club, a friend's business or a local group.</li>
<li>Learn the basics of copywriting, design and analytics.</li>
<li>Build a portfolio with real posts, results and what you learned.</li>
<li>Apply for assistant or coordinator roles, or take on freelance clients.</li>
</ol>
<h2>Social media manager vs content creator</h2>
<p>A content creator focuses on making posts, often under their own name. A social media manager handles the full picture for a brand, including planning, publishing, community, reporting and working with other teams. Many managers create content too, but their job is to make the whole program work.</p>
<p>The job never fully switches off, since comments and news arrive at all hours. Set clear working hours, use scheduling tools, share inbox duty with teammates and have a plan for urgent issues. Managers also need clear approval steps so posts do not stall while waiting for sign-off.</p>''',
 'faqs': [
  ("What does a social media manager do day to day?", "A typical day mixes planning and writing posts, scheduling content, replying to comments and messages, and checking analytics. Many also meet with other teams to plan campaigns."),
  ("Do you need a degree to be a social media manager?", "Many roles ask for a degree in marketing or communications, but a strong portfolio and real results often matter just as much."),
  ("What tools do social media managers use?", "Most use a scheduling and management tool, a design app, a video editor and each platform's own analytics. Many also use AI writing helpers."),
 ],
 'related': ['content-creator', 'community-management', 'content-calendar', 'social-media-management-tool', 'social-media-policy'],
},
{
 'slug': 'social-media-policy',
 'short': "A social media policy is a written set of rules for how a company and its employees use social media, both on brand accounts and in personal posts.",
 'body': '''<h2>What is a social media policy?</h2>
<p>A social media policy is a document that explains what is and is not allowed when people post on behalf of a company or about it. It protects the brand, its customers and its staff by making the rules clear before something goes wrong. Most policies cover the official brand accounts as well as what employees share on their own profiles.</p>
<h2>Why a social media policy matters</h2>
<ul>
<li>It keeps posts on brand and in line with the law.</li>
<li>It protects private customer and company information.</li>
<li>It tells employees what they can share, which makes them more confident to post.</li>
<li>It sets clear steps for a crisis or a mistake.</li>
<li>It helps with security, such as who holds passwords.</li>
</ul>
<h2>What to include in a social media policy</h2>
<ol>
<li><b>Roles and access</b>: who runs each account, who approves posts and who holds admin rights.</li>
<li><b>Brand voice and style</b>: tone, words to use or avoid and visual rules.</li>
<li><b>Approval steps</b>: which posts need review before they go live.</li>
<li><b>Confidential information</b>: what must never be shared, such as unreleased products or customer data.</li>
<li><b>Legal rules</b>: copyright, disclosures for paid partnerships and rules for your industry.</li>
<li><b>Personal accounts</b>: when employees should note that views are their own, and how to talk about the company.</li>
<li><b>Responding to the public</b>: how to handle complaints, trolls and press questions.</li>
<li><b>Crisis plan</b>: who to contact and what to do if something goes wrong.</li>
<li><b>Security</b>: password rules, two-factor login and what to do when someone leaves.</li>
</ol>
<h2>How to write a social media policy</h2>
<p>Bring together people from marketing, legal, HR and security. Start from what your company already has, such as a code of conduct. Write in plain language with real examples of good and bad posts. Keep it short enough that people will read it. Share it with every employee, add it to onboarding and review it each year, since apps and laws change.</p>
<h2>Common mistakes</h2>
<p>A policy that only lists bans makes staff afraid to post at all. Include what people are encouraged to share as well. Another mistake is writing a policy and never training anyone on it. A short session with examples does more than a long document nobody opens. Be careful with rules on personal accounts too, since employment laws in some places protect what workers can say. Check with a legal expert.</p>''',
 'faqs': [
  ("What should a social media policy include?", "It should cover who runs and approves brand accounts, brand voice, confidential information, legal rules, personal account guidance, a crisis plan and security."),
  ("Do small businesses need a social media policy?", "Yes, even a short one helps. It sets clear rules for who posts, what is off limits and what to do if something goes wrong."),
  ("Can a company control what employees post on personal accounts?", "Companies can set some rules, especially about confidential information and speaking for the company. Laws differ by country and state, so check with a legal expert before writing these rules."),
 ],
 'related': ['approval-workflow', 'brand-voice', 'employee-advocacy', 'community-guidelines', 'social-media-manager'],
},
{
 'slug': 'social-media-scheduling',
 'short': "Social media scheduling is writing posts ahead of time and setting them to publish automatically at a chosen date and time.",
 'body': '''<h2>What is social media scheduling?</h2>
<p>Social media scheduling means you do the work of posting before the moment it goes live. You write the caption, add images or video, choose the accounts and set a date and time. When that time arrives, the post publishes on its own, whether you are in a meeting, asleep or on holiday.</p>
<p>You can schedule inside many social apps directly, or use a social media management tool to schedule across several apps at once.</p>
<h2>Why social media scheduling matters</h2>
<ul>
<li><b>Consistency</b>: posts go out on a steady rhythm, even on busy days.</li>
<li><b>Better timing</b>: you can post when your audience is online, even if that is outside your working hours.</li>
<li><b>Time saved</b>: batching a week of posts in one sitting is faster than writing each one on the day.</li>
<li><b>Fewer mistakes</b>: you have time to proofread and get approval before anything goes live.</li>
<li><b>A clear plan</b>: a calendar view shows gaps and overlaps across all accounts.</li>
</ul>
<h2>How to schedule social media posts</h2>
<ol>
<li>Plan your topics on a content calendar.</li>
<li>Write and design the posts in a batch.</li>
<li>Adjust each version to fit its app. Instagram captions run up to 2,200 characters, X posts up to 280 on standard accounts and Bluesky posts up to 300.</li>
<li>Pick a date and time for each post, or add it to a queue with set time slots.</li>
<li>Get approval if your team needs it.</li>
<li>Check the calendar before each week starts.</li>
</ol>
<h2>What you can schedule</h2>
<p>Most tools can schedule image posts, videos, carousels, link posts and text posts. Stories, Reels, Shorts and some special formats depend on what each platform allows outside its own app. Some tools also schedule the first comment or post to several apps at once.</p>
<h2>Common mistakes</h2>
<p>Scheduling makes it easy to set posts and forget them. If major news breaks, pause your scheduled posts and check whether any could seem out of touch. Remember that scheduling covers only publishing. Someone still needs to reply to comments once the posts go live. Finally, double check time zones, especially when your audience lives somewhere else.</p>''',
 'faqs': [
  ("Can you schedule posts directly on Instagram and Facebook?", "Yes. Meta's own tools let you schedule posts for Instagram and Facebook. Third-party tools can also schedule them through the official connection."),
  ("Does scheduling posts hurt reach?", "There is no clear sign that scheduled posts reach fewer people when published through official connections. Content quality and timing matter far more."),
  ("How far ahead can I schedule social media posts?", "It depends on the app or tool. Many let you schedule weeks or months in advance."),
 ],
 'related': ['queue', 'bulk-scheduling', 'content-calendar', 'best-time-to-post', 'social-media-management-tool'],
},
{
 'slug': 'social-proof',
 'short': "Social proof is the idea that people trust and follow what others are doing, so reviews, likes and customer stories make a brand seem more trustworthy.",
 'body': '''<h2>What is social proof?</h2>
<p>Social proof is a pull we all feel. When we are unsure what to do, we look at what other people do. A busy restaurant seems better than an empty one. A product with many good reviews feels safer to buy. On social media, social proof shows up in comments, shares, follower counts, tags from customers and posts by people we trust.</p>
<h2>Types of social proof</h2>
<ul>
<li><b>Customer reviews and ratings</b>: what buyers say about you.</li>
<li><b>Testimonials</b>: short quotes or videos from happy customers.</li>
<li><b>User-generated content</b>: photos and videos customers post of your product.</li>
<li><b>Expert or creator approval</b>: a trusted person in your niche using or recommending you.</li>
<li><b>Case studies</b>: detailed stories of how you helped a client.</li>
<li><b>Numbers</b>: customers served or downloads, when they are true and current.</li>
<li><b>Badges</b>: verified checks, awards or certifications.</li>
</ul>
<h2>Why social proof matters</h2>
<p>People trust other customers more than they trust ads. Seeing someone like them use a product helps them picture doing the same. Social proof lowers the fear of making a bad choice, which can turn a maybe into a yes.</p>
<h2>How to use social proof on social media</h2>
<ol>
<li>Ask happy customers to post and tag you, and make it easy with a branded hashtag.</li>
<li>Repost customer content with permission and credit.</li>
<li>Turn reviews into simple graphics or short videos.</li>
<li>Pin a post with your best testimonial to your profile.</li>
<li>Save customer stories to a highlight on Instagram.</li>
<li>Work with creators whose audience matches yours.</li>
<li>Reply to good comments so they stay visible and active.</li>
</ol>
<h2>Common mistakes</h2>
<p>Fake reviews, bought followers and made-up testimonials can break the law in many places and destroy trust when people find out. Keep every quote real and get permission before using a customer's name, photo or words. Also keep it fresh. A testimonial from years ago, or a number that is no longer true, can do more harm than good.</p>''',
 'faqs': [
  ("What is an example of social proof?", "A clothing brand reposts photos of customers wearing its jackets, with their permission. People see real buyers using the product and feel more confident buying it."),
  ("Is buying followers a form of social proof?", "Bought followers look like social proof but are fake, and apps may remove them or limit your account. Real customers and genuine reviews are what build trust."),
  ("How do I get more social proof?", "Ask happy customers for reviews, encourage them to post and tag you, and share their stories with permission. Make it easy with a hashtag or a simple request after purchase."),
 ],
 'related': ['user-generated-content', 'influencer-marketing', 'repost', 'word-of-mouth', 'verified-account'],
},
{
 'slug': 'social-selling',
 'short': "Social selling is using social media to find, connect with and build trust with potential buyers, so sales conversations start from a real relationship.",
 'body': '''<h2>What is social selling?</h2>
<p>Social selling is how salespeople use social apps to build relationships before and during a sale. They share useful posts, comment on what prospects write, answer questions and reach out with a personal message when the timing is right. The goal is to become a trusted name a buyer already knows, so the first sales call feels like a conversation between people who have met.</p>
<p>It is most common in B2B sales on LinkedIn, but it also works on X, in online communities and in industry groups.</p>
<h2>Social selling vs cold outreach</h2>
<p>Cold outreach sends the same message to a long list of people who have never heard of you. Social selling starts by giving value in public, then reaches out to people who have already seen your posts or interacted with you. It takes longer per person, but replies tend to be warmer and conversations more open.</p>
<h2>How to do social selling</h2>
<ol>
<li><b>Fix your profile.</b> Use a clear photo, a headline that says who you help and an about section written for buyers. LinkedIn posts can run up to 3,000 characters, so you have room to share real ideas.</li>
<li><b>Define your buyers.</b> Know the job titles, industries and problems you focus on.</li>
<li><b>Share useful content.</b> Post tips, lessons from your work and answers to common questions.</li>
<li><b>Engage before you pitch.</b> Comment thoughtfully on posts from people you want to know.</li>
<li><b>Connect with a reason.</b> Mention something specific when you send a connection request.</li>
<li><b>Move to a conversation.</b> When someone shows interest, offer a call or a helpful resource.</li>
<li><b>Track it.</b> Note which posts and messages lead to meetings.</li>
</ol>
<h2>Why social selling matters</h2>
<p>Buyers often research a company and the person selling to them long before they reply. A helpful, active profile builds trust during that research. Social selling also helps sales teams spot buying signals, such as a new job, a company announcement or a post asking for advice.</p>
<h2>Common mistakes</h2>
<p>The biggest mistake is pitching in the first message. Another is copying the same note to hundreds of people, which feels like spam. Be patient, keep messages personal and focus on being useful. Follow each platform's rules, and avoid tools that automate actions on your account, since they can get it limited.</p>''',
 'faqs': [
  ("Is social selling only for LinkedIn?", "LinkedIn is the most common place for social selling, especially in B2B. It also works on X, in online communities and in groups where your buyers spend time."),
  ("How long does social selling take to work?", "It builds over weeks and months, since trust takes time. Steady posting and real conversations usually bring better results than short bursts."),
  ("What is a good social selling message?", "A good message is short, personal and mentions something specific about the person or their post. It offers help or a question before any pitch."),
 ],
 'related': ['linkedin', 'b2b-social-media', 'employee-advocacy', 'lead-generation', 'direct-message'],
},
]
