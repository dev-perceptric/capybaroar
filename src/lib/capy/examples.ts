// Written by capy/build_templates.py from the starter library. Do not edit by hand: change the library and run it.
// Each layout is its own CSS (on the base CSS and the brand variables) and the markup inside <main class="canvas">.

export type Example = { slug: string; title: string; use: string; size: string; photo: boolean; carousel: boolean; css: string; body: string };

export const BASE_CSS = "*{box-sizing:border-box;margin:0;padding:0}\nhtml,body{width:var(--w);height:var(--h);overflow:hidden}\nbody{background:var(--bg);color:var(--ink);font:400 30px/1.4 var(--body),system-ui,sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}\n.canvas{position:relative;width:var(--w);height:var(--h);padding:var(--pad);display:flex;flex-direction:column}\n.brand{display:flex;align-items:center;gap:14px;font:600 26px/1 var(--body);letter-spacing:-.01em}\n.brand svg{width:40px;height:40px;flex-shrink:0}\n.brand .logo{height:44px;width:auto;max-width:280px;object-fit:contain;flex-shrink:0}\n.kicker{display:inline-flex;align-self:flex-start;align-items:center;gap:10px;font:600 22px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--accent-text)}\n.chip{display:inline-flex;align-self:flex-start;align-items:center;height:48px;padding:0 22px;border-radius:999px;background:var(--accent);color:var(--accent-ink);font:600 22px/1 var(--body)}\n.h{font-family:var(--head);font-weight:var(--head-w);letter-spacing:var(--head-ls);line-height:1.02;text-wrap:balance}\n.muted{color:var(--muted)}\n.accent{color:var(--accent-text)}\n/* Accent as text uses --accent-text: the accent where it reads well on the background, the ink where it doesn't. */\n.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;font-size:22px;line-height:1.3;color:var(--muted)}\n.card{background:var(--surface);border-radius:var(--radius)}\n.ph{background:var(--line);overflow:hidden}\n.ph img{display:block;width:100%;height:100%;object-fit:cover}";

export const EXAMPLES: Example[] = [
 {
  "slug": "big-stat",
  "title": "One big number",
  "use": "A single striking number with what it means and where it came from.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".stat-wrap{margin-top:auto;display:flex;flex-direction:column;gap:22px}\n.stat{font-size:420px;line-height:.84;color:var(--accent-text);margin-top:8px;align-self:flex-start;background:linear-gradient(transparent 78%,var(--mark) 78%,var(--mark) 92%,transparent 92%)}\n.stat span{font-size:.5em;vertical-align:.62em;margin-left:6px}\n.lead{font-size:68px;max-width:880px}\n.sub{font-size:30px}\n.foot{margin-top:72px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<div class=\"stat-wrap\">\n<p class=\"kicker\">Small business survey 2026</p>\n<p class=\"h stat\">73<span>%</span></p>\n<p class=\"h lead\">of owners now check their cash flow every week.</p>\n<p class=\"muted sub\">Up from 51% in 2024.</p>\n</div>\n<div class=\"foot\"><span>Source: [your source]</span><span>ledgerly.com</span></div>"
 },
 {
  "slug": "stat-grid",
  "title": "Four numbers",
  "use": "A year in review, results of a campaign, or any 3 to 4 numbers side by side.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".title{font-size:96px;margin:56px 0 48px}\n.title em{font-style:italic;color:var(--accent-text)}\n.grid{flex:1;display:grid;grid-template-columns:1fr 1fr;gap:20px}\n.cell{display:flex;flex-direction:column;justify-content:flex-end;padding:36px}\n.n{font-size:120px;line-height:.9}\n.l{font-size:30px;margin-top:12px}\n.cell:first-child{background:var(--accent);color:var(--accent-ink)}\n.cell:first-child .l{color:inherit;opacity:.8}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<h1 class=\"h title\">Our 2026 <em>in numbers</em></h1>\n<div class=\"grid\"><div class=\"card cell\"><p class=\"h n\">48</p><p class=\"muted l\">brands launched</p></div><div class=\"card cell\"><p class=\"h n\">2.1M</p><p class=\"muted l\">people reached</p></div><div class=\"card cell\"><p class=\"h n\">312</p><p class=\"muted l\">videos made</p></div><div class=\"card cell\"><p class=\"h n\">97%</p><p class=\"muted l\">clients stayed</p></div></div>"
 },
 {
  "slug": "steps",
  "title": "Numbered steps",
  "use": "How to do something in 3 to 5 steps.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": "body{color:var(--ink)}\n.foot{color:var(--ink);opacity:.8}\n.title{font-size:92px;margin:44px 0 40px;max-width:860px}\n.steps{list-style:none;display:flex;flex-direction:column;padding:16px 40px;background:var(--surface)}\n.steps li{display:flex;align-items:center;gap:28px;padding:22px 0;border-bottom:2px dashed var(--line)}\n.steps li:last-child{border-bottom:0}\n.num{flex-shrink:0;display:flex;align-items:center;justify-content:center;width:76px;height:76px;border-radius:50%;background:var(--accent);font:800 38px/1 var(--head)}\n.st{font:700 36px/1.15 var(--body)}\n.sd{font-size:26px;color:var(--muted)}\n.foot{margin-top:32px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<h1 class=\"h title\">How to order catering</h1>\n<ol class=\"card steps\"><li><span class=\"num\">1</span><div><p class=\"st\">Pick your tacos</p><p class=\"sd\">Choose 3 fillings from the menu.</p></div></li><li><span class=\"num\">2</span><div><p class=\"st\">Tell us the date</p><p class=\"sd\">At least 2 days ahead.</p></div></li><li><span class=\"num\">3</span><div><p class=\"st\">Add the extras</p><p class=\"sd\">Salsas, chips and agua fresca.</p></div></li><li><span class=\"num\">4</span><div><p class=\"st\">We bring it hot</p><p class=\"sd\">Set up and ready to serve.</p></div></li></ol>\n<div class=\"foot\"><span>@tacoluna</span><span>Order at tacoluna.com/catering</span></div>"
 },
 {
  "slug": "compare",
  "title": "This vs that",
  "use": "Two ways of doing something, row by row.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".title{font-size:84px;margin:48px 0 44px}\n.table{flex:1;display:flex;flex-direction:column;justify-content:space-between}\n.row{display:grid;grid-template-columns:1.1fr 1fr 1fr;align-items:center;gap:16px;padding:22px 0;border-top:2px solid var(--line);font-size:32px}\n.row.head{border-top:0;padding-top:0;font:600 24px/1 var(--body);color:var(--muted);text-transform:uppercase;letter-spacing:.06em}\n.rl{color:var(--muted)}\n.old{text-decoration:line-through;text-decoration-color:var(--line);text-decoration-thickness:3px;color:var(--muted)}\n.new{font-weight:700;display:inline-flex;align-items:center;gap:12px}\n.new::before{content:\"\";width:34px;height:34px;flex-shrink:0;border-radius:50%;background:var(--accent) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='m6 12 4 4 8-8' fill='none' stroke='%23262209' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") center/22px no-repeat}\n.new-h{color:var(--ink)}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<h1 class=\"h title\">Posting by hand <span class=\"muted\">vs</span> with a queue</h1>\n<div class=\"table\">\n<div class=\"row head\"><p></p><p>By hand</p><p class=\"new-h\">With a queue</p></div>\n<div class=\"row\"><p class=\"rl\">Time each week</p><p class=\"old\">6 hours</p><p class=\"new\">45 minutes</p></div><div class=\"row\"><p class=\"rl\">Posts missed</p><p class=\"old\">Often</p><p class=\"new\">Never</p></div><div class=\"row\"><p class=\"rl\">Networks</p><p class=\"old\">One at a time</p><p class=\"new\">14 at once</p></div><div class=\"row\"><p class=\"rl\">Best times</p><p class=\"old\">A guess</p><p class=\"new\">From your results</p></div>\n</div>"
 },
 {
  "slug": "quote",
  "title": "Customer quote",
  "use": "A review or testimonial in the customer's own words.",
  "size": "1080x1080",
  "photo": true,
  "carousel": false,
  "css": ".q{margin:auto 0;display:flex;flex-direction:column;gap:36px}\n.mark{width:96px;height:72px}\n.text{font-size:68px;line-height:1.12;font-weight:600}\n.who{display:flex;align-items:center;gap:22px;padding-top:36px;border-top:2px solid var(--line)}\n.av{width:92px;height:92px;border-radius:50%}\n.nm{font:600 30px/1.2 var(--body)}\n.stars{margin-left:auto;font-size:40px;letter-spacing:4px;color:var(--accent-text)}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<div class=\"q\">\n<svg class=\"mark\" viewBox=\"0 0 64 48\"><path d=\"M0 48V28C0 12 8 2 26 0l2 8C18 11 14 17 14 24h12v24zm36 0V28C36 12 44 2 62 0l2 8c-10 3-14 9-14 16h12v24z\" fill=\"var(--accent)\"/></svg>\n<p class=\"h text\">The oat flat white is the best thing on our street. I come in every morning before work.</p>\n</div>\n<div class=\"who\"><div class=\"ph av\"><img src=\"https://capy.local/photo\" alt=\"\"></div><div><p class=\"nm\">Ana Ruiz</p><p class=\"muted\">Regular since 2023</p></div>\n<p class=\"stars\">&#9733;&#9733;&#9733;&#9733;&#9733;</p></div>"
 },
 {
  "slug": "bar-chart",
  "title": "Bar chart",
  "use": "Compare 4 to 8 values, with the top one picked out.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".kicker{margin-top:52px}\n.title{font-size:80px;margin:20px 0 36px}\n.title em{font-style:italic;color:var(--accent-text)}\n.chart{flex:1;display:grid;grid-template-columns:repeat(7,1fr);gap:18px;align-items:end}\n.bar{height:100%;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:12px}\n.b{width:100%;background:var(--surface);border-radius:var(--radius) var(--radius) 0 0}\n.top .b{background:var(--accent)}\n.v{font:600 24px/1 var(--body);color:var(--muted)}\n.top .v{color:var(--accent-text)}\n.d{font:600 24px/1 var(--body)}\n.foot{margin-top:28px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"kicker\">Engagement by day</p>\n<h1 class=\"h title\">Thursday is your <em>best day</em> to post</h1>\n<div class=\"chart\"><div class=\"bar\"><span class=\"v\">62</span><span class=\"b\" style=\"height:62%\"></span><span class=\"d\">Mon</span></div><div class=\"bar\"><span class=\"v\">81</span><span class=\"b\" style=\"height:81%\"></span><span class=\"d\">Tue</span></div><div class=\"bar\"><span class=\"v\">74</span><span class=\"b\" style=\"height:74%\"></span><span class=\"d\">Wed</span></div><div class=\"bar top\"><span class=\"v\">100</span><span class=\"b\" style=\"height:100%\"></span><span class=\"d\">Thu</span></div><div class=\"bar\"><span class=\"v\">58</span><span class=\"b\" style=\"height:58%\"></span><span class=\"d\">Fri</span></div><div class=\"bar\"><span class=\"v\">33</span><span class=\"b\" style=\"height:33%\"></span><span class=\"d\">Sat</span></div><div class=\"bar\"><span class=\"v\">41</span><span class=\"b\" style=\"height:41%\"></span><span class=\"d\">Sun</span></div></div>\n<div class=\"foot\"><span>Average engagement, last 90 days, Thursday = 100</span></div>"
 },
 {
  "slug": "donut",
  "title": "Donut chart",
  "use": "Parts of a whole: 2 to 4 shares that add up to 100%.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".title{font-size:88px;line-height:.95;margin:48px 0 0;max-width:900px}\n.body{flex:1;display:flex;align-items:center;gap:64px}\n.d{width:440px;height:440px;flex-shrink:0}\n.leg{list-style:none;display:flex;flex-direction:column;gap:28px;flex:1}\n.leg li{display:flex;align-items:center;gap:18px;font-size:34px;padding-bottom:24px;border-bottom:2px solid var(--line)}\n.sw{width:28px;height:28px}\n.pc{margin-left:auto;font:400 52px/1 var(--head)}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<h1 class=\"h title\">WHERE OUR MEMBERS TRAIN</h1>\n<div class=\"body\"><svg class=\"d\" viewBox=\"0 0 400 400\"><g transform=\"rotate(-90 200 200)\"><circle r=\"150\" cx=\"200\" cy=\"200\" fill=\"none\" stroke=\"var(--accent)\" stroke-width=\"64\" stroke-dasharray=\"502.9 942.5\" stroke-dashoffset=\"0.0\"/><circle r=\"150\" cx=\"200\" cy=\"200\" fill=\"none\" stroke=\"var(--accent-2)\" stroke-width=\"64\" stroke-dasharray=\"286.2 942.5\" stroke-dashoffset=\"-508.9\"/><circle r=\"150\" cx=\"200\" cy=\"200\" fill=\"none\" stroke=\"var(--ink)\" stroke-width=\"64\" stroke-dasharray=\"135.4 942.5\" stroke-dashoffset=\"-801.1\"/></g></svg><ul class=\"leg\"><li><span class=\"sw\" style=\"background:var(--accent)\"></span><span class=\"ln\">Home</span><span class=\"pc\">54%</span></li><li><span class=\"sw\" style=\"background:var(--accent-2)\"></span><span class=\"ln\">Gym</span><span class=\"pc\">31%</span></li><li><span class=\"sw\" style=\"background:var(--ink)\"></span><span class=\"ln\">Outdoors</span><span class=\"pc\">15%</span></li></ul></div>\n<div class=\"foot\"><span>2,400 members asked in October</span><span>@mayamoves</span></div>"
 },
 {
  "slug": "myth-fact",
  "title": "Myth and fact",
  "use": "Correct a common belief: the myth, then the fact.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".pair{flex:1;display:flex;flex-direction:column;gap:20px;margin:44px 0 36px}\n.panel{flex:1;display:flex;flex-direction:column;justify-content:center;gap:20px;padding:44px}\n.myth{background:var(--surface)}\n.myth .txt{color:var(--muted);text-decoration:line-through;text-decoration-thickness:6px;text-decoration-color:var(--accent-2)}\n.fact{background:var(--accent);color:var(--accent-ink)}\n.tag{font:800 26px/1 var(--body);letter-spacing:.12em}\n.myth .tag{color:var(--accent-2)}\n.txt{font-size:62px;line-height:1.02}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<div class=\"pair\">\n<div class=\"panel myth\"><p class=\"tag\">MYTH</p><p class=\"h txt\">You need an hour a day to get strong.</p></div>\n<div class=\"panel fact\"><p class=\"tag\">FACT</p><p class=\"h txt\">Three 20-minute sessions a week build real strength.</p></div>\n</div>\n<div class=\"foot\"><span>@mayamoves</span><span>Save this for your next excuse</span></div>"
 },
 {
  "slug": "sale",
  "title": "Offer banner",
  "use": "A sale, discount or limited offer with dates and a code.",
  "size": "1080x1080",
  "photo": true,
  "carousel": false,
  "css": ".canvas{padding:0;flex-direction:row}\n.photo{width:44%;height:100%}\n.over{flex:1;display:flex;flex-direction:column;padding:72px 64px}\n.deal{margin:auto 0}\n.big{font-size:150px;line-height:.9;color:var(--accent-text)}\n.what{font-size:64px;margin-top:16px}\n.row{display:flex;flex-direction:column;gap:18px}\n.dates{font:600 30px/1 var(--body)}\n.code{align-self:flex-start;padding:18px 24px;border:3px dashed var(--accent);border-radius:16px;font-size:28px}\n.code b{font-weight:700;letter-spacing:.06em}",
  "body": "<div class=\"ph photo\"><img src=\"https://capy.local/photo\" alt=\"\"></div>\n<div class=\"over\">\n<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<div class=\"deal\"><p class=\"h big\">20% off</p><p class=\"h what\">every bag of beans</p></div>\n<div class=\"row\"><p class=\"dates\">Friday to Sunday</p><p class=\"code\">Code <b>WEEKEND20</b></p></div>\n</div>"
 },
 {
  "slug": "hiring",
  "title": "We are hiring",
  "use": "A job opening with the role, the basics and how to apply.",
  "size": "1080x1080",
  "photo": false,
  "carousel": false,
  "css": ".hire{margin-top:64px}\n.title{font-size:112px;margin:28px 0 auto}\n.title em{font-style:italic;color:var(--accent-text)}\n.facts{display:grid;grid-template-columns:1fr 1fr;gap:0 40px;margin:40px 0}\n.f{padding:22px 0;border-top:2px solid var(--line)}\n.fk{font-size:22px}\n.fv{font:600 30px/1.3 var(--body)}\n.apply{padding:28px 32px;background:var(--ink);color:#fff;border-radius:var(--radius);font:600 30px/1 var(--body);align-items:center}\n.arrow{font-size:40px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"chip hire\">We're hiring</p>\n<h1 class=\"h title\">Senior Product <em>Designer</em></h1>\n<div class=\"facts\"><div class=\"f\"><p class=\"muted fk\">Where</p><p class=\"fv\">Lisbon or remote in Europe</p></div><div class=\"f\"><p class=\"muted fk\">Type</p><p class=\"fv\">Full time</p></div><div class=\"f\"><p class=\"muted fk\">Pay</p><p class=\"fv\">[salary range]</p></div><div class=\"f\"><p class=\"muted fk\">Start</p><p class=\"fv\">January 2027</p></div></div>\n<div class=\"foot apply\"><span>Apply at northwind.studio/jobs</span><span class=\"arrow\">&rarr;</span></div>"
 },
 {
  "slug": "checklist",
  "title": "Checklist",
  "use": "Tips or a checklist of 4 to 6 short items.",
  "size": "1080x1350",
  "photo": false,
  "carousel": false,
  "css": ".kicker{margin-top:64px}\n.title{font-size:96px;margin:20px 0 48px}\n.list{list-style:none;padding:20px 44px}\n.list li{display:flex;align-items:center;gap:26px;padding:28px 0;border-bottom:2px solid var(--line);font-size:34px;line-height:1.25}\n.list li:last-child{border-bottom:0}\n.box{flex-shrink:0;width:48px;height:48px;border-radius:14px;background:var(--accent) url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='m6 12 4 4 8-8' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\") center/30px no-repeat}\n.foot{margin-top:40px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"kicker\">Brew guide</p>\n<h1 class=\"h title\">5 steps to better coffee at home</h1>\n<ul class=\"list card\"><li><span class=\"box\"></span><span>Fresh beans, roasted in the last 3 weeks</span></li><li><span class=\"box\"></span><span>Grind right before you brew</span></li><li><span class=\"box\"></span><span>Water just off the boil, 94&deg;C</span></li><li><span class=\"box\"></span><span>One gram of coffee for every 16 of water</span></li><li><span class=\"box\"></span><span>Pour slowly for 3 minutes</span></li></ul>\n<div class=\"foot\"><span>@lumencoffee</span><span>Save it for tomorrow morning</span></div>"
 },
 {
  "slug": "timeline",
  "title": "Timeline",
  "use": "A plan, a history or a roadmap: 4 to 6 dated moments.",
  "size": "1080x1350",
  "photo": false,
  "carousel": false,
  "css": ".title{font-size:96px;margin:56px 0 56px}\n.title em{font-style:italic;color:var(--accent-text)}\n.tl{list-style:none;position:relative;flex:1;display:flex;flex-direction:column;justify-content:space-between}\n.tl::before{content:\"\";position:absolute;left:206px;top:20px;bottom:40px;width:3px;background:var(--line)}\n.tl li{position:relative;display:grid;grid-template-columns:170px 72px 1fr;align-items:start;font-size:28px}\n.when{font:600 26px/1.6 var(--body);color:var(--muted);text-align:right;padding-right:6px}\n.dot{width:26px;height:26px;margin:10px auto 0;border-radius:50%;background:var(--bg);border:4px solid var(--ink);position:relative;z-index:1}\n.now .dot{background:var(--accent);border-color:var(--accent);box-shadow:0 0 0 10px rgba(47,84,235,.15)}\n.what{font:400 46px/1.1 var(--head)}\n.now .what{color:var(--accent-text)}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<h1 class=\"h title\">From kickoff to <em>launch</em> in 8 weeks</h1>\n<ol class=\"tl\"><li class=\"\"><p class=\"when\">Week 1</p><span class=\"dot\"></span><div><p class=\"what\">Discovery</p><p class=\"muted\">Interviews, audit and goals</p></div></li><li class=\"\"><p class=\"when\">Week 2</p><span class=\"dot\"></span><div><p class=\"what\">Brand</p><p class=\"muted\">Logo, colors and type</p></div></li><li class=\"\"><p class=\"when\">Week 4</p><span class=\"dot\"></span><div><p class=\"what\">Website</p><p class=\"muted\">Design and build</p></div></li><li class=\"\"><p class=\"when\">Week 6</p><span class=\"dot\"></span><div><p class=\"what\">Content</p><p class=\"muted\">First month of posts</p></div></li><li class=\"now\"><p class=\"when\">Week 8</p><span class=\"dot\"></span><div><p class=\"what\">Launch</p><p class=\"muted\">Live, with a report every month</p></div></li></ol>\n<div class=\"foot\"><span>northwind.studio</span></div>"
 },
 {
  "slug": "matrix",
  "title": "2 by 2 grid",
  "use": "Sort ideas on two scales, like effort and impact.",
  "size": "1080x1350",
  "photo": false,
  "carousel": false,
  "css": ".title{font-size:84px;margin:52px 0 44px}\n.wrap{flex:1;display:grid;grid-template-columns:48px 1fr;grid-template-rows:1fr 48px;gap:12px}\n.m{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;gap:16px}\n.q{background:var(--surface);border-radius:var(--radius);padding:32px;display:flex;flex-direction:column;gap:14px}\n.q.hot{background:var(--accent);color:var(--accent-ink)}\n.qn{font:700 40px/1.1 var(--head);margin-bottom:8px}\n.it{font-size:26px;line-height:1.3;padding:14px 18px;border-radius:12px;background:rgba(255,255,255,.06)}\n.hot .it{background:rgba(6,40,26,.1)}\n.ax{font:600 22px/1 var(--body);color:var(--muted);letter-spacing:.04em}\n.y{writing-mode:vertical-rl;transform:rotate(180deg);text-align:right;grid-row:1}\n.x{grid-column:2;text-align:right}\n.foot{margin-top:24px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<h1 class=\"h title\">Where to spend your time this quarter</h1>\n<div class=\"wrap\"><p class=\"ax y\">More impact &rarr;</p><div class=\"m\"><div class=\"q hot\"><p class=\"qn\">Quick wins</p><p class=\"it\">Send invoices on day 1</p><p class=\"it\">Turn on card payments</p></div><div class=\"q\"><p class=\"qn\">Big bets</p><p class=\"it\">Raise prices for new clients</p><p class=\"it\">Hire a bookkeeper</p></div><div class=\"q\"><p class=\"qn\">Fill-ins</p><p class=\"it\">Rename your files</p><p class=\"it\">Tidy old receipts</p></div><div class=\"q\"><p class=\"qn\">Skip</p><p class=\"it\">Build your own spreadsheet</p><p class=\"it\">Daily reports nobody reads</p></div></div><p class=\"ax x\">More effort &rarr;</p></div>\n<div class=\"foot\"><span>ledgerly.com</span></div>"
 },
 {
  "slug": "line-chart",
  "title": "Line chart",
  "use": "A trend over time: 6 to 12 points, with the change called out.",
  "size": "1080x1350",
  "photo": false,
  "carousel": false,
  "css": ".kicker{margin-top:56px}\n.title{font-size:96px;margin:20px 0 44px}\n.chart{flex:1;display:flex;flex-direction:column;padding:40px 36px 28px}\n.chart svg{flex:1;width:100%}\n.months{display:flex;justify-content:space-between;padding:16px 4px 0;font:600 22px/1 var(--body);color:var(--muted)}\n.foot{margin-top:32px}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"kicker\">Monthly revenue, 2026</p>\n<h1 class=\"h title\">Up <span class=\"accent\">105%</span> since January</h1>\n<div class=\"card chart\"><svg viewBox=\"-10 -20 940 600\"><line x1=\"0\" x2=\"920\" y1=\"0\" y2=\"0\" stroke=\"var(--line)\" stroke-width=\"2\"/><line x1=\"0\" x2=\"920\" y1=\"140\" y2=\"140\" stroke=\"var(--line)\" stroke-width=\"2\"/><line x1=\"0\" x2=\"920\" y1=\"280\" y2=\"280\" stroke=\"var(--line)\" stroke-width=\"2\"/><line x1=\"0\" x2=\"920\" y1=\"420\" y2=\"420\" stroke=\"var(--line)\" stroke-width=\"2\"/><line x1=\"0\" x2=\"920\" y1=\"560\" y2=\"560\" stroke=\"var(--line)\" stroke-width=\"2\"/><polygon points=\"0,560 0.0,456.6 83.6,430.8 167.3,439.4 250.9,379.1 334.5,344.6 418.2,361.8 501.8,301.5 585.5,249.8 669.1,267.1 752.7,198.2 836.4,137.8 920.0,77.5 920,560\" fill=\"var(--accent)\" opacity=\".14\"/><polyline points=\"0.0,456.6 83.6,430.8 167.3,439.4 250.9,379.1 334.5,344.6 418.2,361.8 501.8,301.5 585.5,249.8 669.1,267.1 752.7,198.2 836.4,137.8 920.0,77.5\" fill=\"none\" stroke=\"var(--accent)\" stroke-width=\"7\" stroke-linejoin=\"round\" stroke-linecap=\"round\"/><circle cx=\"920.0\" cy=\"77.5\" r=\"14\" fill=\"var(--accent)\" stroke=\"var(--surface)\" stroke-width=\"6\"/></svg>\n<div class=\"months\"><span>J</span><span>F</span><span>M</span><span>A</span><span>M</span><span>J</span><span>J</span><span>A</span><span>S</span><span>O</span><span>N</span><span>D</span></div></div>\n<div class=\"foot\"><span>$42K in January, $86K in December</span><span>ledgerly.com</span></div>"
 },
 {
  "slug": "menu",
  "title": "Menu or price list",
  "use": "A short menu, price list or list of services with a photo.",
  "size": "1080x1350",
  "photo": true,
  "carousel": false,
  "css": ".canvas{padding:0}\n.top{position:relative;height:430px}\n.photo{width:100%;height:100%}\n.new{position:absolute;left:64px;bottom:-24px}\n.sheet{flex:1;margin:0;padding:64px 64px 56px;background:var(--surface);display:flex;flex-direction:column}\n.hd{display:flex;justify-content:space-between;align-items:center}\n.hours{font:600 24px/1 var(--body);color:var(--muted)}\n.title{font-size:92px;margin:36px 0 28px;color:var(--bg)}\n.list{list-style:none;display:flex;flex-direction:column;gap:30px}\n.list li{display:flex;align-items:flex-end;gap:16px}\n.it{font:800 40px/1.1 var(--head)}\n.ds{font-size:26px;color:var(--muted)}\n.dots{flex:1;border-bottom:3px dotted var(--line);margin-bottom:12px}\n.pr{font:800 44px/1 var(--head)}",
  "body": "<div class=\"top\"><div class=\"ph photo\"><img src=\"https://capy.local/photo\" alt=\"\"></div><p class=\"chip new\">New this week</p></div>\n<div class=\"sheet\">\n<div class=\"hd\"><div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div><p class=\"hours\">Tue to Sun, 11 to 10</p></div>\n<h1 class=\"h title\">Taco Tuesday menu</h1>\n<ul class=\"list\"><li><div><p class=\"it\">Al pastor</p><p class=\"ds\">Pork, pineapple, onion, cilantro</p></div><span class=\"dots\"></span><p class=\"pr\">$4</p></li><li><div><p class=\"it\">Baja fish</p><p class=\"ds\">Crispy cod, slaw, chipotle mayo</p></div><span class=\"dots\"></span><p class=\"pr\">$5</p></li><li><div><p class=\"it\">Hongos</p><p class=\"ds\">Mushrooms, corn, queso fresco</p></div><span class=\"dots\"></span><p class=\"pr\">$4</p></li><li><div><p class=\"it\">Birria</p><p class=\"ds\">Slow-cooked beef, dipping broth</p></div><span class=\"dots\"></span><p class=\"pr\">$6</p></li></ul>\n</div>"
 },
 {
  "slug": "event-story",
  "title": "Event story",
  "use": "A workshop, webinar or event: date, time, speaker and how to join.",
  "size": "1080x1920",
  "photo": true,
  "carousel": false,
  "css": ".canvas{padding:120px 80px 140px}\n.live{margin-top:auto}\n.title{font-size:168px;margin:36px 0 64px}\n.title em{font-style:italic;color:var(--accent-text)}\n.when{display:flex;align-items:center;gap:32px;padding:32px}\n.date{width:132px;height:132px;flex-shrink:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--accent);color:var(--accent-ink);border-radius:var(--radius)}\n.mo{font:700 24px/1 var(--body);letter-spacing:.1em}\n.dd{font-size:72px;line-height:1}\n.wd{font:600 36px/1.2 var(--body)}\n.spk{display:flex;align-items:center;gap:24px;margin-top:48px}\n.av{width:104px;height:104px;border-radius:50%}\n.nm{font:600 32px/1.2 var(--body)}\n.cta{display:flex;flex-direction:column;align-items:center;gap:14px;margin-top:64px;padding:36px;background:var(--ink);color:#fff;border-radius:var(--radius);font:700 40px/1 var(--body)}\n.lnk{font:500 26px/1 var(--body);opacity:.7}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"chip live\">Free live workshop</p>\n<h1 class=\"h title\">Build a brand people <em>remember</em></h1>\n<div class=\"when card\"><div class=\"date\"><p class=\"mo\">DEC</p><p class=\"h dd\">4</p></div><div><p class=\"wd\">Thursday, 5 PM Lisbon</p><p class=\"muted\">45 minutes, then questions</p></div></div>\n<div class=\"spk\"><div class=\"ph av\"><img src=\"https://capy.local/photo\" alt=\"\"></div><div><p class=\"nm\">Jon Avery</p><p class=\"muted\">Creative director, Northwind</p></div></div>\n<div class=\"cta\"><span>Save your seat</span><span class=\"lnk\">northwind.studio/live</span></div>"
 },
 {
  "slug": "launch-story",
  "title": "Launch story",
  "use": "Announce something new: a product, program or drop.",
  "size": "1080x1920",
  "photo": true,
  "carousel": false,
  "css": ".canvas{padding:0}\n.photo{position:absolute;inset:0 0 auto 0;height:1000px}\n.photo::after{content:\"\";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(17,17,17,0) 55%,var(--bg))}\n.photo{position:absolute}\n.over{position:relative;flex:1;display:flex;flex-direction:column;padding:110px 80px 150px}\n.over .chip{margin-top:auto}\n.title{font-size:150px;line-height:.9;margin:28px 0 40px;color:var(--accent)}\n.pts{list-style:none;display:flex;flex-wrap:wrap;gap:14px}\n.pts li{padding:16px 26px;border:3px solid var(--ink);font:700 30px/1 var(--body)}\n.start{font:700 40px/1 var(--body);margin-top:56px}\n.lnk{font:500 30px/1 var(--body);color:var(--muted);margin-top:16px}",
  "body": "<div class=\"ph photo\"><img src=\"https://capy.local/photo\" alt=\"\"></div>\n<div class=\"over\">\n<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"chip\">New</p>\n<h1 class=\"h title\">6-WEEK STRONG PROGRAM</h1>\n<ul class=\"pts\"><li>3 workouts a week</li><li>20 minutes each</li><li>No gym needed</li></ul>\n<p class=\"start\">Starts January 5</p>\n<p class=\"lnk\">Link in bio &darr;</p>\n</div>"
 },
 {
  "slug": "vote-story",
  "title": "This or that story",
  "use": "Ask people to pick between two things.",
  "size": "1080x1920",
  "photo": true,
  "carousel": false,
  "css": ".canvas{padding:110px 72px 130px;align-items:center}\n.hd{align-self:flex-start}\n.title{font-size:128px;margin:48px 0 48px;text-align:center}\n.pick{position:relative;width:100%;flex:1;border-radius:var(--radius);overflow:hidden}\n.pick .img{position:absolute;inset:0}\n.lbl{position:absolute;left:28px;bottom:28px;padding:16px 26px;border-radius:999px;background:var(--surface);font:800 36px/1 var(--head)}\n.or{margin:-36px 0;z-index:1;width:112px;height:112px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:var(--accent);font:800 40px/1 var(--head);border:8px solid var(--bg)}\n.foot2{margin-top:40px;font:600 32px/1 var(--body)}",
  "body": "<div class=\"hd\"><div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div></div>\n<h1 class=\"h title\">Which one wins?</h1>\n<div class=\"pick a\"><div class=\"ph img\"><img src=\"https://capy.local/photo\" alt=\"\"></div><p class=\"lbl\">Churro croissant</p></div>\n<p class=\"or\">OR</p>\n<div class=\"pick b\"><div class=\"ph img\"><img src=\"https://capy.local/photo\" alt=\"\"></div><p class=\"lbl\">Masa banana bread</p></div>\n<p class=\"foot2\">Vote with the poll &uarr;</p>"
 },
 {
  "slug": "link-banner",
  "title": "Link post banner",
  "use": "The picture for a LinkedIn, X or blog link: the article title and author.",
  "size": "1200x627",
  "photo": true,
  "carousel": false,
  "css": ".canvas{flex-direction:row;gap:48px;padding:64px}\n.l{flex:1.4;display:flex;flex-direction:column}\n.title{font-size:64px;margin:auto 0 32px}\n.by{display:flex;align-items:center;gap:16px;font:600 24px/1 var(--body)}\n.av{width:56px;height:56px;border-radius:50%}\n.r{flex:1;display:flex;align-items:center}\n.mini{width:100%;padding:36px}\n.lb{font-size:22px}\n.n{font-size:96px;color:var(--accent-text);margin:8px 0 24px}\n.bars{display:flex;align-items:flex-end;gap:12px;height:150px}\n.bars span{flex:1;background:var(--line);border-radius:8px 8px 0 0}\n.bars .hi{background:var(--accent)}",
  "body": "<div class=\"l\"><div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div><h1 class=\"h title\">How to price your services in 2027</h1>\n<div class=\"by\"><div class=\"ph av\"><img src=\"https://capy.local/photo\" alt=\"\"></div><p>Sam Okafor <span class=\"muted\">&middot; 6 min read</span></p></div></div>\n<div class=\"r\"><div class=\"card mini\"><p class=\"muted lb\">Average rate rise</p><p class=\"h n\">+18%</p><div class=\"bars\"><span style=\"height:40%\"></span><span style=\"height:55%\"></span><span style=\"height:48%\"></span><span style=\"height:72%\"></span><span class=\"hi\" style=\"height:100%\"></span></div></div></div>"
 },
 {
  "slug": "thumbnail",
  "title": "Video thumbnail",
  "use": "A YouTube thumbnail: 2 to 4 huge words and a face.",
  "size": "1280x720",
  "photo": true,
  "carousel": false,
  "css": ".canvas{padding:0}\n.face{position:absolute;right:0;top:0;width:560px;height:100%}\n.face::after{content:\"\";position:absolute;inset:0;box-shadow:inset 120px 0 80px -40px var(--bg)}\n.txt{position:relative;padding:64px 72px;display:flex;flex-direction:column;align-items:flex-start}\n.w1{font-size:200px;line-height:.86;color:var(--ink)}\n.w2{font-size:260px;line-height:.86;color:var(--accent)}\n.tag{margin-top:24px;padding:14px 22px;background:var(--accent-2);color:#fff;font:800 32px/1 var(--body);letter-spacing:.06em;transform:rotate(-2deg)}\n.brandc{position:absolute;left:72px;bottom:44px}",
  "body": "<div class=\"ph face\"><img src=\"https://capy.local/photo\" alt=\"\"></div>\n<div class=\"txt\"><p class=\"h w1\">5 MIN</p><p class=\"h w2\">ABS</p><p class=\"tag\">NO EQUIPMENT</p></div>\n<div class=\"brandc\"><div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div></div>"
 },
 {
  "slug": "carousel-1-cover",
  "title": "Carousel cover",
  "use": "A carousel: cover, one idea per slide, a last slide that asks for the follow or save.",
  "size": "1080x1350",
  "photo": false,
  "carousel": true,
  "css": ".kicker2{margin-top:auto;align-self:flex-start;padding:10px 18px;border-radius:10px;background:var(--accent);color:var(--accent-ink);font:700 24px/1 var(--body)}\n.title{font-size:150px;line-height:.95;margin:32px 0 28px}\n.lead{font-size:40px;margin-bottom:auto}\n.swipe{display:inline-flex;align-items:center;gap:14px;font:600 28px/1 var(--body);color:var(--ink)}\n.arr{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--ink);color:#fff;font-size:30px}\n.pg{position:absolute;top:84px;right:80px;font:600 24px/1 var(--body);color:var(--muted)}",
  "body": "<div class=\"brand\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"><span>Brand name</span></div>\n<p class=\"kicker2\">Guide</p>\n<h1 class=\"h title\">7 hooks that stop the scroll</h1>\n<p class=\"muted lead\">Steal these for your next post.</p>\n<div class=\"foot\"><span>capybaroar.com</span><span class=\"swipe\">Swipe <span class=\"arr\">&rarr;</span></span></div>\n<p class=\"pg\">1/9</p>"
 },
 {
  "slug": "carousel-2-point",
  "title": "Carousel slide",
  "use": "A carousel: cover, one idea per slide, a last slide that asks for the follow or save.",
  "size": "1080x1350",
  "photo": false,
  "carousel": true,
  "css": ".top{display:flex;justify-content:space-between;align-items:flex-start}\n.n{align-self:flex-start;padding:18px 26px;border-radius:20px;background:var(--accent);color:var(--accent-ink);font:800 72px/1 var(--head);letter-spacing:-.03em}\n.pg{font:600 24px/1 var(--body);color:var(--muted)}\n.title{font-size:104px;margin:72px 0 32px}\n.body{font-size:38px;line-height:1.4;color:var(--muted)}\n.ex{margin-top:auto;padding:40px;border-left:10px solid var(--accent);border-radius:0 var(--radius) var(--radius) 0}\n.exl{font:700 22px/1 var(--body);letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}\n.ext{font:600 38px/1.3 var(--body);margin-top:16px}\n.foot{margin-top:48px}\n.arr{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:var(--ink);color:#fff;font-size:30px}",
  "body": "<div class=\"top\"><p class=\"n\">01</p><p class=\"pg\">2/9</p></div>\n<h2 class=\"h title\">Start with the result</h2>\n<p class=\"body\">Lead with what happened, then explain how. People stay for the story once they know where it ends.</p>\n<div class=\"ex card\"><p class=\"exl\">Try</p><p class=\"ext\">&ldquo;We tripled our bookings in 6 weeks. Here&rsquo;s the one change we made.&rdquo;</p></div>\n<div class=\"foot\"><span>capybaroar.com</span><span class=\"arr\">&rarr;</span></div>"
 },
 {
  "slug": "carousel-3-cta",
  "title": "Carousel last slide",
  "use": "A carousel: cover, one idea per slide, a last slide that asks for the follow or save.",
  "size": "1080x1350",
  "photo": false,
  "carousel": true,
  "css": ".pg{position:absolute;top:84px;right:80px;font:600 24px/1 var(--body);color:var(--muted)}\n.mid{margin:auto 0;display:flex;flex-direction:column;align-items:center;text-align:center}\n.big svg{width:140px;height:140px}\n.title{font-size:110px;margin:48px 0 24px}\n.lead{font-size:38px}\n.acts{display:flex;gap:16px;margin-top:56px}\n.act{padding:22px 32px;border-radius:999px;background:var(--surface);box-shadow:0 0 0 2px var(--line);font:600 30px/1 var(--body)}\n.act.pri{background:var(--accent);color:var(--accent-ink);box-shadow:none}",
  "body": "<p class=\"pg\">9/9</p>\n<div class=\"mid\">\n<div class=\"big\"><img class=\"logo\" src=\"https://capy.local/logo\" alt=\"\"></div>\n<h2 class=\"h title\">Save this for your next post</h2>\n<p class=\"muted lead\">Follow for a new guide every Tuesday.</p>\n<div class=\"acts\"><p class=\"act\">&#9734; Save</p><p class=\"act\">&#8618; Share</p><p class=\"act pri\">+ Follow</p></div>\n</div>\n<div class=\"foot\"><span>capybaroar.com</span></div>"
 }
];
