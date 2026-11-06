# Blog listicles

Bottom-of-funnel posts at `/blog/<slug>`, each a ranked list of tools with real screenshots and prices checked on each vendor's own site. Built by `site/build/build_listicles.py` as part of `npm run site:build`.

## Files

- `site/build/listicles/tools.json`: each tool's name, domain, homepage and pricing page.
- `site/build/listicles/text/`: the plain text of every homepage and pricing page, captured with the screenshots. This is the source for every price and feature claim.
- `site/build/listicles/facts.json`: prices, plans, free plan, trial, AI, MCP, pros and cons per tool, each with a quote from the text files, plus the short lines the pages show (`priceShort`, `priceLine`, `freeShort`, `freeLine`, `trialShort`, `bestFor`).
- `site/build/listicles/posts/<slug>.py`: one post each (`POST = {...}`). `sprout-social-alternatives.py` is the model.
- `site/public/img/blog/shots/<id>-home.webp` and `<id>-pricing.webp`: 1440 × 900 screenshots.
- `site/public/img/blog/logos/<id>.png`: tool logos.

## Rules

- Every price and feature comes from the captured text. If it isn't there, it isn't on the page.
- Prices say "billed yearly" when the vendor shows a yearly price.
- Capybaroar is #1 and gets honest cons like every other tool. Each post says it is our product.
- Every tool section opens with what the tool is: "{Tool} is a {kind}." The kinds live in `facts.json` (`kind`), worded from the vendor's own site.
- Links are added by the build: Capybaroar's own pages (agent, inbox, analytics, link in bio, MCP, API, pricing, channel pages) where Capybaroar is reviewed, the channel pages and other lists where the intro and bottom line name them, once per page. Each post ends with 4 related lists.
- Every post has a sticky contents list with a small sign-up card (a closed menu on phones) and a sign-up block after the comparison table.
- Each tool section shows a screenshot from the vendor's own site with its capture month.
- Covers come from `site/build/covers.mjs` (`list`, `alternatives` or `versus`), added to `covers.json` by the build.

## Refresh every 90 days

```bash
node site/build/shots.mjs
```

Then compare the new text files with `facts.json`, fix any price that moved, update `MONTH` in `build_listicles.py`, and run `npm run site:build`, then `npm run site:covers`.

## Running cost

$0 a month at Beta (50 teams) and Growth (500 teams). The posts are static pages; screenshots and covers render on a laptop.
