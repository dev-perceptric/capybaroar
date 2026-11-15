# CapyInfographic starter library

Claude writes an HTML page, our render worker turns it into a PNG. No image model. These templates are the worked examples Claude learns from: it reads the closest one or two, then writes a fresh page for the request in the same way.

- `templates/*.html`: 23 layouts, each one standalone file. See `templates/index.json` for the list with sizes and what each is for.
- `templates/themes/`: one layout in all 6 sample brands, to show the style card changing the whole look.
- `templates/fonts/`: open fonts (OFL) served from our own files: Inter, Fraunces, Space Grotesk, Archivo Black, DM Serif Display, Bricolage Grotesque.
- `templates/img/`: sample photos. In the product these come from the user's Media.
- `build_templates.py`: writes the templates. `render.mjs`: renders every template to `previews/` and makes `previews/contact-sheet.png`.

```bash
python3 capy/build_templates.py
```

```bash
node capy/render.mjs
```

## Layouts

| Size | Layouts |
|---|---|
| 1080x1080 | big-stat, stat-grid, steps, compare, quote, bar-chart, donut, myth-fact, sale, hiring |
| 1080x1350 | checklist, timeline, matrix, line-chart, menu, carousel cover, carousel slide, carousel last slide |
| 1080x1920 | event-story, launch-story, vote-story |
| 1200x627 | link-banner |
| 1280x720 | thumbnail |

## The page contract (what every page Claude writes must follow)

1. **One fixed canvas.** `<main class="canvas">` at the exact size in `--w` and `--h`. Nothing scrolls. `render.mjs` flags any text that spills off the canvas or gets cut off.
2. **The brand lives in CSS variables** at the top of the `<style>`: `--bg`, `--surface`, `--ink`, `--muted`, `--line`, `--accent`, `--accent-ink`, `--accent-2`, `--accent-text`, `--head`, `--head-w`, `--head-ls`, `--body`, `--radius`. The style card from the brand's website fills them. Layout CSS only uses the variables, never a hex color, so any brand works.
3. **Accent as text uses `--accent-text`.** It's the accent where that reads well on the background, and the ink where it doesn't (a yellow accent on white, for example). A filled shape with words on it uses `--accent` with `--accent-ink`.
4. **No JavaScript, no outside requests.** Fonts load from `fonts/`, photos from the user's Media, logos as inline SVG. The worker blocks everything else.
5. **Real facts only.** Numbers, quotes, names and dates come from the user, the post or a page they link. Anything missing is a `[placeholder]` the agent asks about. The sample text here is only an example.
6. **Readable on a phone.** Body text 26px or more on a 1080 canvas, headlines 64px or more, one idea per slide, at most about 40 words on a picture.
7. **The brand row** (logo and name) sits at the top or bottom of every design, and the handle or website in the footer.

## Sample brands (made up)

| Theme | Look |
|---|---|
| capy | White, yellow accent, Inter |
| ledgerly | Navy, green accent, Space Grotesk |
| lumen | Cream, terracotta, Fraunces |
| maya | Black, lime, Archivo Black, square corners |
| northwind | White, blue, DM Serif Display, editorial |
| taco | Orange, yellow, Bricolage Grotesque, round corners |

## Running cost

Nothing yet: these are files in the repo, and rendering the previews runs on a laptop or CI. The costs for running CapyInfographic in the product are in `docs/capy-studio-plan.md`.
