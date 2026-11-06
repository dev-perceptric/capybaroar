# Social media glossary

200 terms at `/social-media-terms/<slug>`, with an A to Z index at `/social-media-terms`. Built by `site/build/build_glossary.py` as part of `npm run site:build`.

## Files

- `site/build/glossary/list.json`: every term's name, category, the Capybaroar page it ties to (`cap`) and its writing batch.
- `site/build/glossary/terms/v2_*.py`: the copy. Each entry has `short` (the "X is..." line and meta description), `body` (HTML with `<figure data-chart="N"></figure>` slots), `charts`, `tools`, `list` (a blog comparison post), `faqs` and `related`.
- `site/build/charts.py`: the chart and diagram renderer, shared with the blog listicles.
- `site/public/img/glossary/logos/<domain>.png`: logos for outside tools.

## Rules

- Every term page opens with "What is <term>?" and has at least one chart or diagram.
- Numbers in charts are made up for teaching and carry the Example tag, except the network text limits from `src/lib/networks.ts`.
- Tools that help: Capybaroar first when a feature fits, then our free tools, then well-known outside software described only by its purpose. No competitors; the `list` card links to the blog post that compares them.
- The build links other terms the first time they come up (8 per page at most) and adds the Capybaroar block for the term's `cap`.

## Running cost

$0 a month at Beta (50 teams) and Growth (500 teams). Static pages.
