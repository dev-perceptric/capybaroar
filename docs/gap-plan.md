# Build plan: what PostEverywhere has that we don't

From 25 PostEverywhere pages (11 Nov 2026), checked against Capybaroar's code. Four phases, about 11 weeks for one developer. Phases 1 to 3 (about 6 weeks) close the gaps people compare on. Phase 4 widens where Capybaroar can be used.

Rules for every item:
- Every write goes through `savePost`. Every feature is added to both the REST API and MCP (`src/lib/api/ops.ts`), or to neither.
- New network settings go in `src/lib/networks.ts`, so the composer, bulk CSV, API and docs pick them up.
- Every network call has a test with the network's real error, and the publish loop is tested on a flaky case (a part that fails, then works on retry).
- The help docs (`site/build/docs/`) and `facts.json` are updated in the same change.

## Phase 1: Post types (3 weeks)

### 1.1 Threads on X, Bluesky, Threads and Mastodon (5 days)
- **What:** write 2 to 25 posts that publish as a chain. Each part has its own text and media. The main post is part 1.
- **Data:** `posts.thread jsonb` holds `[{text, media_ids}]` for parts 2 and up (migration 027). `post_targets.parts jsonb` holds each published part's network id.
- **Publish:** part N replies to part N-1:
  - X: `reply.in_reply_to_tweet_id`
  - Bluesky: `reply {root, parent}`
  - Threads: `reply_to_id`
  - Mastodon: `in_reply_to_id`
- **Reliability:** a retry starts from the first part with no network id, so parts never go out twice. Test: part 3 fails, then the retry posts parts 3 and up only.
- **Composer:** an "Add to thread" button under the text, a counter on each part, and preview as a chain. Networks without threads get part 1 only, with a tag on their preview.
- **Bulk CSV:** a `thread` column, with parts split by a line holding `---`.

### 1.2 X polls and X options (3 days)
- **Polls:** 2 to 4 options of up to 25 characters, open 5 minutes to 7 days (`poll.options`, `poll.duration_minutes`). No media with a poll.
- **Who can reply:** everyone, people you follow, people you mention, or verified accounts (`reply_settings`).
- **Quote post:** paste a post's link (`quote_tweet_id`).
- **Community:** pick from the account's communities (`community_id`).
- **AI label and paid partnership label:** only if X's API docs list them. Check before building.
- **Premium:** posts up to 25,000 characters when the account has X Premium. Read `subscription_type` when connecting.

### 1.3 LinkedIn documents and options (4 days)
- **PDF carousel:** upload one PDF of up to 100 MB through the Documents API (`initializeUpload`), then post it with a title. It shows as a swipeable carousel.
- **Up to 20 images** in one post (`multiImage`).
- **Visibility:** anyone, connections only (profiles only), or LinkedIn members.
- **Turn off resharing** (`isReshareDisabledByAuthor`).
- **Media:** the library accepts PDF (100 MB).

### 1.4 TikTok photo posts (3 days)
- **What:** 1 to 35 images, with a title of up to 90 characters and a cover image, through `post/publish/content/init` with `media_type: PHOTO`.
- **Your step:** TikTok only pulls photos from a verified domain. Verify the media domain in the TikTok developer portal. The app review may need an update to mention photo posts.
- **Composer:** TikTok accepts images, and the same privacy, comment and disclosure settings apply.

### 1.5 Instagram Trial Reels (1 day)
- A "Trial" switch on Reels, shown to non-followers first. Share with followers manually, or automatically when it does well (`trial_params.graduation_strategy`).

### 1.6 YouTube options (2 days)
- **Custom thumbnail** (`thumbnails.set`, verified channels only), **category**, **notify subscribers** and **altered or synthetic content** label.
- **Quota:** an upload costs 1,600 units and a thumbnail 50, out of 10,000 a day by default. That's about 6 uploads a day for all users together. Check the project's quota and apply for more before launch.

### 1.7 Pinterest and alt text (1 day)
- **Board section** under the board, and **alt text** up to 500 characters.
- Send the media library's alt text to every network that takes it: X, Bluesky, Mastodon, Threads, Instagram images and Pinterest.

**Phase 1 running cost:** $0 at Beta and at Growth. All of these use the networks' free posting APIs on our servers. PDFs add storage on the VPS disk, under 5 GB at Growth.

## Phase 2: Planning (2 weeks)

### 2.1 Campaigns (3 days)
- **What:** name a campaign, give it a color, and add posts to it from the composer or bulk CSV.
- **Calendar:** a campaign filter.
- **Analytics:** results by campaign, plus scheduled, published and failed counts.
- **Data:** a `campaigns` table and `posts.campaign_id` (migration 028). Added to the API, MCP and the `campaign` column in bulk CSV.

### 2.2 Queue presets and "Best time" (1 day)
- **Already built:** the composer shows up to 3 best-time buttons, Analytics has a best-times heatmap, and `get_analytics` returns the top 3 times. All need 10 posts with results.
- **One-click time sets:** "Weekdays at 9" (5 a week), "Morning and lunch" (10), "All day" (14) and "Your best times" (uses `bestSlots`, which exists and isn't used yet). Each fills the queue's slots, and you can still edit them.
- **API and MCP:** `publish_at: "best"` schedules at the next best time at least 30 minutes out.

### 2.3 Best times for new accounts (2 days)
- **What:** until an account has 10 posts with results, show the best times per network across all Capybaroar accounts, labeled "Popular on Instagram".
- **How:** a nightly job adds up engagement by network, weekday and hour. Only networks with 200 or more posts count. No workspace data is shown.

### 2.4 Calendar day view (1 day)
- Hour rows for one day, with drag and drop between hours.

### 2.5 Media library (3 days)
- **More file types:** HEIC and AVIF photos (turned into JPEG on upload), PDF for LinkedIn, and video up to 1 GB.
- **Search** by name and alt text, plus **favorites** and a filter by type.
- **Google Drive:** pick files with Google's file picker (`drive.file` scope, so no Google security review). Needs a Google Cloud project with the Picker API.
- **Warning** before deleting a file used by a scheduled post.

### 2.6 Import from Buffer, Hootsuite and Later (1 day)
- Bulk upload reads their CSV exports and maps their columns to ours, so switching takes one file.

**Phase 2 running cost:** $0 at Beta and at Growth. The nightly best-time job runs on the database we already pay for. The Google Picker API is free.

## Phase 3: AI (1.5 weeks)

### 3.1 Brand kit (2 days)
- **What:** per brand, a voice description, banned words, required hashtags and a few example posts.
- **Where it applies:** every AI rewrite, the agent, MCP captions and AI formats. The composer flags a banned word before saving.

### 3.2 AI formats (4 days)
- **Thread:** 3 to 10 parts from a topic or a link.
- **Poll:** a question with 2 to 4 options.
- **TikTok slideshow:** 3 to 10 slide images with text, made with our image tools, then posted as a TikTok photo post (needs 1.4).
- **LinkedIn carousel:** 4 to 12 slides in the brand's colors and fonts, drawn as SVG and saved as a PDF (resvg and pdf-lib, so no browser on the server). Needs 1.3.
- Each one uses credits at our usual markup.

### 3.3 AI helper in the composer (2 days)
- **What:** Ctrl+J (⌘J on Mac) opens Otto beside the composer. He edits the text, thread, channels, time and settings from what you type. Every change has an Undo, and nothing is saved until you press Save.
- **Cost to users:** uses credits like the agent does now.

**Phase 3 running cost (Claude Opus at $5 and $25 per million tokens, check):**

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| AI formats (20 a team a month, about 3.5 cents each) | $35 | $350 |
| Composer helper (30 chats a team a month, about 15 cents each) | $225 | $2,250 |
| Brand kit (about 300 more input tokens per AI call) | $5 | $50 |
| Carousel slide images (fal, 8 images per carousel, 5 carousels a team a month, check) | $10 | $100 |
| **Total** | **$275** | **$2,750** |

Customers pay for all of it with credits, priced so our cost stays at 40% of the price or less (`creditRules.ts`). Net cost to us: $0.

## Phase 4: Reach (4.5 weeks)

### 4.1 ChatGPT app (2 days)
- Submit the MCP server to ChatGPT's app directory, using the same sign-in we built for Claude. Picture and video tools stay hidden, as they are for Claude.

### 4.2 npm MCP package, Node SDK and CLI (4 days)
- **SDK:** `@capybaroar/sdk`, typed from the actions in `ops.ts`.
- **CLI:** `capybaroar` with `--json` output. It signs in once through the browser.
- **MCP package:** runs locally and connects to the hosted server, for apps that only take a command.

### 4.3 WordPress (3 days)
- **What:** publish, draft or pending review, with title, categories, tags and a featured image.
- **How:** WordPress.com sites connect with WordPress.com sign-in. Self-hosted sites connect with an application password (WordPress's own way for apps).

### 4.4 Turn Google Business Profile and Telegram back on (2 days, check)
- Find what paused each one. For GBP that's usually Google's API access approval. Then add GBP Event and Offer posts.

### 4.5 iOS app (3 weeks)
- **Built with:** Expo (React Native) on our REST API.
- **Features:** compose with photos and video, calendar month view, posts by status, retry failed posts, reconnect accounts, approvals, Inbox replies and push notifications for failures and approvals.
- **Sign in with Apple** is required by Apple, since we offer Google sign-in.

**Phase 4 running cost:**

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| Apple Developer Program ($99 a year) | $8 | $8 |
| Expo push notifications and builds (free tier, check) | $0 | $0 |
| ChatGPT app, SDK, CLI, MCP package and WordPress | $0 | $0 |
| **Total** | **$8** | **$8** |

## Total added to the monthly bill

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| Phases 1 and 2 | $0 | $0 |
| Phase 3 (paid back by credits) | $275 | $2,750 |
| Phase 4 | $8 | $8 |
| **Total** | **$283** | **$2,758** |
| **Net, after credits** | **$8** | **$8** |

## Order

1. Threads (1.1)
2. LinkedIn documents (1.3)
3. TikTok photo posts (1.4)
4. X polls and options (1.2)
5. Campaigns, queue presets and best time (2.1 to 2.3)
6. Brand kit and AI formats (3.1, 3.2)
7. Everything else, in the order above

## What you need to do

- Verify the media domain with TikTok, for photo posts.
- Check the YouTube API quota and apply for more.
- Create a Google Cloud project with the Picker API, for Google Drive.
- Join the Apple Developer Program, for the iOS app.
