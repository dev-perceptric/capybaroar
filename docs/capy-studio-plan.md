# CapyInfographic and CapyMotion

Two new things the agent can make. Claude designs them with our own prompt packs ("skills"), in the brand's own style learned from its website. Our servers turn the design into the file.

- **CapyInfographic**: a picture or a carousel built from real text and numbers: stats, steps, comparisons, timelines, lists, quotes and charts. It becomes the default in the Agent's Make menu.
- **CapyMotion**: a short video (6 to 30 seconds) made with Remotion: animated text, counters, charts, logo and captions, with CapyAudio music or voice if asked.

## How it works

1. **Learn the style once per brand.** The first time someone picks CapyInfographic or CapyMotion, the agent asks: "Which website should I match?" We read the home page, up to 3 more pages and up to 10 stylesheets through `fetchSafe` (public internet only). Claude writes a style card: colors, fonts, logo, corner size, spacing and the general look. It's saved on the brand kit, shown in Brands, and people can edit it. Every later design uses it.
2. **Claude designs.** The agent picks a layout skill for the request, then writes the design:
   - Infographic: HTML and CSS on a fixed canvas (1:1, 4:5, 9:16 or 16:9), or one canvas per slide for a carousel.
   - Motion: a Remotion composition (TSX) built from our motion skills.
3. **We render.** A render worker turns the design into a PNG, a PDF carousel or an MP4.
4. **Claude checks its work.** The worker sends back the picture (for video, 3 frames). Claude looks for text that spills over, low contrast, crowding and off-brand colors, and makes one fix pass.
5. **It lands in Media,** like any Capy file, and attaches to the post. Videos use the same `generations` queue and `attach_when_done` as CapyVideo.

## The skills (our prompt packs, in `src/lib/capy/skills/`)

Each skill is a Markdown file loaded into Claude's prompt only when needed and cached, so repeat runs cost little.

- `style-from-site.md`: read page source and stylesheets, write the style card.
- `infographic-layouts.md`: when to use each layout, with a worked example of each (stat, steps, compare, timeline, list, quote, bar and line chart).
- `type-and-space.md`: a 4px grid, text sizes that read on a phone, the most words per slide, contrast rules.
- `carousel.md`: hook slide, one idea per slide, last slide with the call to action, page numbers.
- `motion-remotion.md`: built from Remotion's own agent skills (check their license), cut down to what we use: scenes, timing, springs, easing, captions, safe areas for Reels and TikTok.
- `motion-scenes.md`: our scene kinds (title, counter, chart grows, list reveals, quote, logo sting) with timing that feels good.
- `design-check.md`: what to look for in the render and how to fix it.
- `facts.md`: never make up numbers, quotes, customers or results. Numbers come from the user, the post or a linked page. Anything missing becomes a `[placeholder]` and the agent asks for it.

The `facts.md` rule matters most. An infographic with a made-up stat is worse than no infographic.

## Where it shows

- **Agent, Make menu:** CapyInfographic (default), CapyMotion, CapyImage, CapyVideo, CapyAudio. The model chip offers "Fast" (Sonnet) and "Best" (Opus) for the two new ones.
- **Composer:** "Make an infographic" from the post's text.
- **Brands:** the style card, with "Read the website again".
- **API and MCP:** `generate_media` takes `kind: "infographic"` and `kind: "motion"`, so both work in the same way (house rule). Claude connections keep the directory's rule that hides `generate_media`; ChatGPT and API keys get it.

## Safety

Claude writes code, and we run it on our servers, so the render worker is locked down:

- Its own container on its own small server, apart from the app and the database. It holds no secrets beyond a key that can only take and finish render jobs.
- No network while rendering, except our own font and logo files, fetched before the render starts.
- Infographics render with JavaScript turned off. Motion code is bundled with only Remotion and our scene kit allowed as imports; anything else fails the build.
- Time and memory limits per job (20 seconds for a picture, 4 minutes for a video), read-only files, and the job is killed past the limit.
- A failed render retries once with Claude's fix, then fails with one short line and the credits come back.

## Credits

Prices use the 2x markup (`MARKUP` in `creditRules.ts`). Claude prices: Opus $5 in and $25 out per million tokens (as in `creditRules.ts`, check), Sonnet $3 and $15 (check).

| What | Our cost | Credits | Compare |
|---|---|---|---|
| CapyInfographic, Fast | about $0.07 | about 14 | Nano Banana 2: 16, Nano Banana Pro: 30 |
| CapyInfographic, Best | about $0.12 | about 24 | |
| Carousel, 5 slides, Fast | about $0.25 | about 50 | |
| CapyMotion, 15 seconds | about $0.14 (Claude plus $0.01 Remotion) | about 30 | Kling 3 Pro 8 seconds: 269, Veo 3.1: 640 |
| Style card, once per brand | about $0.18 | free | we pay it |

So the Fast infographic costs less than every AI image model except Flux 2 Pro and Ideogram (6 credits each), and CapyMotion costs about a tenth of the cheapest AI video model.

## Running cost

Assumes each team makes 40 infographics and 10 motion videos a month.

| | Beta (50 teams) | Growth (500 teams) |
|---|---|---|
| Claude for infographics | $140 | $1,400 |
| Claude for motion | $65 | $650 |
| Style cards | $9 | $90 |
| Remotion company license (Automators: $0.01 a render, $100 a month at least, check) | $100 | $100 |
| Render server (Hostinger KVM 4, about $13 each, check) | $13 (1) | $26 (2) |
| File storage on B2 ($6 per TB, check) | under $1 | under $1 |
| **Total a month** | **about $330** | **about $2,270** |

Credits pay for the Claude part at twice its cost: about $410 a month of credits at Beta and $4,280 at Growth.

## Build order

1. **Style from the website:** brand kit fields (migration 041: `brands.website`, `brands.style`, `brands.style_read_at`), the scan, the style card in Brands, and tests on real sites with odd CSS.
2. **Render worker and CapyInfographic:** the locked-down worker, single pictures, carousels (PNG set and PDF for LinkedIn), the design check, credits, the Make menu default, the Composer button, API and MCP. Tests: a design with long text renders without spilling, and a broken design fails and gives the credits back.
3. **CapyMotion:** Remotion in the worker, the scene kit, captions, CapyAudio music and voice, frame checks, `attach_when_done`. Buy the Remotion license before launch.

## Open questions

- Remotion license: the free license covers companies with 3 people or fewer. Perceptric's size decides whether we need the paid one from day one.
- Fast (Sonnet) as the default, with Best (Opus) one click away? This plan assumes yes.
