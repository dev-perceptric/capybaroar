# docs.capybaroar.com: the documentation plan

A full help center and developer reference for Capybaroar, at its own address, in the style of Brew's docs (docs.brew.new, built on Mintlify): one place where a new user, an agency, a developer and an AI assistant can each find the answer in a few seconds.

Today we have 20 help pages at capybaroar.com/docs (built by `site/build/build_docs.py`) and one API page. This plan grows that to about 150 pages, moves it to docs.capybaroar.com, and adds search, AI-ready copies of every page, generated API reference and short videos.

## 1. How it's built

**Our own static docs, served by the homepage container (nginx), with the features people like in Mintlify.** It costs nothing to host, matches our brand exactly, and keeps every fact tied to the app's code.

- **Builder:** the existing Python builders, grown into `site/build/docs/` (a page list, Markdown sources, one layout). Output goes to `site/public/docs/`, which nginx serves on docs.capybaroar.com.
- **Sources:** one Markdown file per page in `site/build/docs/pages/<tab>/<slug>.md`, with a small front matter block (title, description, section, order, app link, related pages, video). Components are written as short tags the builder turns into HTML (see section 4).
- **Facts from the code:** limits, credits, models, plans, networks, API fields and errors come from the app's own code (`site/build/docs/facts.ts` already does this for network limits). A check in `npm test` fails when a page quotes a number the code no longer has, so the docs never drift.
- **Search:** Pagefind (open source, runs at build time, no server). Opens with ⌘K or `/`, searches titles, headings and text, shows the section.
- **AI-ready:** every page also exists as `.md` (already true today), plus `/llms.txt` (the index) and `/llms-full.txt` (every page in one file). A "Copy page" menu on each page: Copy as Markdown, Open in Claude, Open in ChatGPT.
- **Screenshots:** taken by Playwright from a demo workspace (`site/build/app-shots.mjs` already exists), in light mode at 2x, retaken on every release so they match the app.
- **Videos:** short CapyMotion explainers plus screen recordings, hosted as MP4 files on our own server.

## 2. The layout (every page)

- **Top bar:** logo, the tabs (Guides, Networks, Capy AI, Recipes, Developers, Changelog), search, "Open Capybaroar" button.
- **Left sidebar:** the sections and pages of the current tab, open on the current section. Collapsible on phones.
- **Page:** breadcrumbs, title, one-line description, "Copy page" menu, then the content.
- **Right rail:** "On this page" (the H2 and H3 headings), "Open in Capybaroar" (the screen this page is about), "Suggest an edit" (the Markdown file on GitHub; the repo is public).
- **Bottom:** "Was this helpful?" (yes or no, with an optional line; saved through the app's API), Previous and Next, Related pages, "Last updated" date.
- **Brand:** the site's tokens (Inter 13px app style scaled up for reading, yellow accent, gray shell), light and dark mode, readable at phone width.

## 3. The pages

About 150 pages. Pages marked (have) exist today and are moved and expanded.

### Tab 1: Guides

**Get started**
- Welcome to Capybaroar (have): what it is, three ways to use it (the calendar, the agent, your own AI through MCP), "New here?" and "Building something?" routes, help options.
- Create your account (have)
- Connect your first channel (have)
- Schedule your first post (have)
- Plan a week with the agent
- Tour of the app: Calendar, Agents, Inbox, Media, Analytics, Link in bio, Settings
- Plans, trial and credits at a glance

**Calendar and posting**
- The calendar: week, month and list views, filters by channel and brand
- Write a post: the composer, live previews, per-network text and settings
- Post now, schedule, or save a draft
- Posting queue: set your times once
- Channel groups
- Campaigns
- Bulk scheduling with a CSV (the columns, an example file, errors and fixes)
- Post from your blog (RSS feeds)
- Evergreen posts: post your best ones again
- Edit or delete a published post (on the network, and everywhere at once)
- Short links and click counts
- Time zones and the best time to post
- Why a post failed, and how to fix it

**Media**
- The media library: upload, folders, search
- Crop, resize and trim for each network
- Alt text
- File types and size limits (from the code)

**Inbox**
- Comments, mentions and messages in one list
- Reply, hide and moderate
- Suggested replies with AI
- Which networks send what to the inbox

**Analytics and reports**
- Reading your analytics: reach, engagement, followers, best times
- Post results
- Client reports: a link, a PDF or a monthly email; your logo on reports (Agency)
- Key metrics glossary

**Link in bio**
- Build your page: blocks, themes, fonts
- Build it with AI from your website
- Your address, your own domain, and tracking clicks

**Brands, teams and clients**
- Brands: one per client, with their own channels and people
- Brand kit: voice, words to avoid, hashtags, and the look from your website
- Team members and roles (owner, admin, editor)
- Approvals and client review links (clients approve free, without an account)

**Settings and billing**
- Plans and limits (from the code)
- AI credits: what each thing costs, packs, automatic top up (from the code)
- Billing, invoices, changing or cancelling a plan
- Notifications and alerts

**Security and privacy**
- Two-step sign in (2FA)
- Audit log
- Download your data, delete your account or workspace
- How we keep your data safe (links to /security and /subprocessors)

### Tab 2: Networks

One page per network, the same shape every time: what you can post (from the code), how to connect it, every setting in the composer, limits table, inbox and analytics support, common errors with their fixes, and FAQ.

- Overview: every network side by side (a table generated from the code)
- Instagram (have), Facebook (have), Threads (have), TikTok (have), LinkedIn profiles and Pages (have), YouTube (have), X (have), Pinterest (have), Bluesky (have), Mastodon (have), Discord (have)
- Google Business Profile, Reddit, Telegram, WordPress (new pages for the networks the app has without a page)
- Reconnecting a channel and why it disconnects
- Troubleshooting: every error message the app shows, what it means and what to do (generated from the providers' error texts)

### Tab 3: Capy AI

- The AI agent (have): what it can do, how it uses your brand kit, picking a model
- Plan a week of posts with the agent (have)
- Rewrite and fit posts with AI (have)
- CapyInfographic: graphics, charts and banners in your brand (shapes, the 23 layouts, adding a photo, what to write)
- CapyMotion: short animated videos (scene kinds, length, what to write)
- CapyImage, CapyVideo and CapyAudio: the models, what each is best at, how Capy picks
- Your brand's look: reading it from your website, editing it
- Prompt guide: how to ask for posts, infographics, videos and replies, with 30 examples to copy
- AI credits (have): the price of every model and action, from the code
- What the AI never does: no made-up numbers or quotes, drafts first, you approve

### Tab 4: Recipes

End-to-end workflows, each with the result first, the steps, the exact prompts and what you'll see.

- Plan and schedule a month of posts in 15 minutes
- Turn one blog post into a week of posts on every network
- Launch a product: teaser, launch day and follow-ups
- Run a client's social media as an agency (brand, approvals, monthly report)
- Weekly content review: analytics to next week's plan
- Turn customer reviews into quote graphics
- Make a Reel from your numbers with CapyMotion
- Post every day from Claude with the MCP server
- Answer every comment within a day
- Recycle your best posts automatically

### Tab 5: Developers

**Start here**
- Build with Capybaroar: REST API, MCP server and webhooks, and which to use
- Authentication: API keys (created in Settings, shown once, act as you)
- Rate limits (120 requests a minute per key) and errors (every error code, from the code)
- Send your first post from code (curl, JavaScript, Python)

**MCP**
- MCP overview: every tool, what it does and what it needs (generated from `TOOLS` in `src/lib/api/mcp.ts`)
- Connect Claude (claude.ai and the desktop app), Claude Code, ChatGPT, Cursor and other MCP apps
- OAuth sign-in for apps, and keys in a link for apps that only take a link

**API reference** (one page per endpoint, generated from the same actions the MCP uses, `src/lib/api/ops.ts` and `input.ts`)
- Brands: list
- Channels and channel groups: list, details, next queue slot
- Posts: create, list, get, update, delete, publish now
- Media: upload from a link, list, get
- Generations: start (CapyInfographic, CapyMotion, pictures, videos, audio), get
- Credits: get
- Campaigns: list
- Analytics: get
- Webhooks: create, list, update, delete, test

Each endpoint page: what it does, the request (method, path, every field with type, limits and an example), the response, every error it can return, and code in curl, JavaScript and Python. An OpenAPI file (`/openapi.json`) generated from the same source.

**Webhooks**
- Events and their payloads, signatures, retries and how a webhook gets turned off

### Tab 6: Changelog

- One entry per release (date, what's new, what changed, what was fixed), written for users. Newest first, with an RSS feed.
- Links to the status page.

### Videos (inside the tabs, plus a "Videos" index page)

Eight short videos, each on its own page with a transcript: Tour of Capybaroar, Connect your channels, Plan a week with the agent, Make an infographic, Make a Reel with CapyMotion, Run clients with brands and approvals, Read your analytics, Use Capybaroar from Claude.

### Moving from another tool

One page each: Buffer, Hootsuite, Later, Sprout Social, Metricool, Postiz. How to move channels, queues, scheduled posts (CSV) and media, and what's different.

## 4. Page parts (the builder's components)

- **Callouts:** Note, Tip, Warning, "Plan" (shows which plans have the feature).
- **Steps:** numbered, each with a short line, an optional screenshot and "what you'll see".
- **Cards and card grids:** for routing on section pages.
- **Tabs:** for "Calendar / Agent / MCP" ways of doing the same thing, and for code in curl, JavaScript and Python.
- **Prompt block:** a prompt to copy, with a Copy button (the Brew pattern).
- **Field table:** for settings and API fields (name, type, required, limits, what it does).
- **Facts:** `{{fact:networks.instagram.caption_limit}}` style tags filled from the code.
- **Video:** our MP4 with a poster frame and a transcript below.
- **Screenshot:** a framed app picture with a caption and alt text.

## 5. Writing rules

- Second person, short sentences, 9th grade reading level, the app's exact words for buttons and screens in bold.
- Every guide: the result in one line, a time estimate ("About 5 minutes"), what you need first, numbered steps, what you just did, related pages.
- One idea per page. A page answers one question; long topics split.
- Every number from the code, never typed by hand.
- Facts only: no promises the app doesn't keep, no made-up customers or results.
- Screenshots retaken each release; a page whose screen changed is flagged by the screenshot step.

## 6. The address

- **docs.capybaroar.com** serves the docs from the homepage container (nginx), with clean addresses (`/agent`, `/networks/instagram`, `/api/posts/create`).
- capybaroar.com/docs/* moves there with permanent redirects once the new address works, so links and search results keep working.
- `/llms.txt`, `/llms-full.txt`, `/openapi.json`, `/sitemap.xml` and `.md` copies on the docs address.

Setting it up (done in the repo; two steps are yours):
1. **DNS (yours, at Namecheap):** Domain List, capybaroar.com, Manage, Advanced DNS, Add New Record: type A, host `docs`, value `45.90.109.7`, TTL Automatic.
2. **Caddy on the VPS (yours, or give me SSH access):** add the block below next to the capybaroar.com block, then reload Caddy. Caddy gets the HTTPS certificate on its own.
3. **nginx (done in the repo):** the homepage container answers docs.capybaroar.com from `site/public/docs`, with the site's styles and pictures from the root.

```
docs.capybaroar.com {
	import edge
	import access_log
	reverse_proxy {$CAPY_SITE:127.0.0.1:8081} {
		import upstream
	}
}
```

## 7. Build order

1. **The address** (now): DNS, Caddy, nginx. The 20 current pages work at docs.capybaroar.com.
2. **The docs engine:** Markdown sources, the layout (tabs, sidebar, right rail, Copy page), components, Pagefind search, llms.txt, redirects from /docs, the facts check in tests. The 20 pages move in.
3. **Guides:** the rest of the Guides tab (about 45 pages) with screenshots.
4. **Networks and Capy AI:** 15 network pages, troubleshooting generated from the error texts, 10 Capy AI pages.
5. **Developers:** generated API reference (about 30 pages), OpenAPI file, MCP and webhooks pages.
6. **Recipes, videos, migrations and changelog:** 10 recipes, 8 videos, 6 migration guides, the changelog with RSS, and "Was this helpful?".
7. **Ask AI (later):** a search box answer written by Claude from the docs, with links to the pages it used.

## 8. Running cost

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| Hosting (the homepage container, already paid for) | $0 | $0 |
| Search (Pagefind, open source, built with the site) | $0 | $0 |
| Screenshots and builds (GitHub Actions, already used) | $0 | $0 |
| Videos (8 CapyMotion videos, made once, our own credits) | about $1 once | about $1 once |
| "Was this helpful?" (rows in our database) | $0 | $0 |
| Ask AI, phase 7 (Claude Haiku, about 2,000 tokens in and 400 out a question, $1 and $5 per million tokens, check; 20 questions a team a month) | about $4 | about $40 |
| **Total a month** | **$0, then about $4 with Ask AI** | **$0, then about $40 with Ask AI** |
