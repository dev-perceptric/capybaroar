# Capybaroar brand kit

The logo is one wordmark in Fredoka Bold, all lowercase: "capyba" in ink, "roar" in yellow with a thin ink edge, and two sound waves after the last r. Every file here is outlined paths, so nothing needs the font to draw it. The one-page guide is `guide.html` (rendered to `guide.png`).

## Files

| Path | What |
| --- | --- |
| `svg/wordmark-{light,dark,ink,white}.svg` | The main logo. Light for white and light grays, dark for ink and photos, ink or white when there's one color. |
| `svg/stacked-{light,dark,ink,white}.svg` | "capyba" over "roar", right-aligned, on a square artboard. The collapsed sidebar and other small squares. |
| `svg/icon.svg` | The app icon: the stacked mark (white and yellow) on an ink tile with 13px corners at 48px. |
| `svg/icon-yellow.svg` | The same on a yellow tile, all in ink. |
| `svg/icon-small.svg` | The small icon: the yellow o of "roar" and its waves on the ink tile. For 48px and below. |
| `png/wordmark-*@{1,2,4}x.png` | The wordmarks, 240px wide at 1x. |
| `png/stacked-*@{1,2,4}x.png` | The stacked marks, 128px square at 1x. |
| `png/icon-{1024,512,192,180}.png` | The app icon (180 is the apple-touch icon). `icon-yellow-*` likewise. |
| `png/icon-{48,32,16}.png` | The small icon. |
| `favicon.ico` | The small icon at 16, 32 and 48. |
| `png/og.png` | The share image template, 1200x630: the wordmark on ink and "The agentic social media platform". |
| `marks.json` | The paths and tile placements, for anything else that draws the mark. |
| `src/` | The font, the build scripts, the OG templates and the comparisons shown in the guide. |

## Where it's used

- App: `src/components/Logo.tsx` (`variant` wordmark, stacked or icon, `tone` light or dark, `small` for the small icon), drawing the paths in `src/components/logoMarks.ts`. Next picks up `src/app/favicon.ico`, `icon.svg` (the small icon) and `apple-icon.png`; `src/app/manifest.ts` points at `public/brand/icon-{192,512}.png`.
- Homepage (`site/public`): the wordmark inline as `<symbol id="logo">` on every page, `favicon.ico`, `icon.svg`, `apple-touch-icon.png`, `img/og.jpg` (made from `src/og-site.html`).
- Emails: `https://capybaroar.com/brand/wordmark-light@2x.png` (`site/public/brand/`), shown 136px wide.

## Rules

- **Clear space:** the height of the "a" (the x-height, about half the wordmark's height) free on every side.
- **Minimum sizes:** wordmark 80px wide, stacked 24px, icon 16px. Below 48px icons use the small icon, since the words can't be read there.
- **Colors:** yellow `#FFD202` (`signal`), ink `#262209` (`on-signal`), white. Nothing else.
- **Yellow on white:** the app never sets yellow text on white. The logo is the one exception, because "roar" carries its ink edge. Never drop the edge on a light background.
- **Don't** recolor "roar" or the waves, stretch or squash the mark, put the yellow "roar" on yellow (use the ink version there), or rebuild the logo from live text.
- **Type:** Fredoka is for the logo only, and only as these outlines. The app, the site and emails use Inter.

## Rebuild

```sh
pip install fonttools uharfbuzz
npm run brand    # python3 brand/src/build.py && node brand/src/render.mjs
```

`build.py` instances `src/Fredoka[wdth,wght].ttf` at weight 700, shapes the words with HarfBuzz (Fredoka's kerning), applies the tracking (-0.025em), the pair spacing and the waves, and writes `svg/`, `marks.json` and `src/components/logoMarks.ts`. The design numbers (tracking, pairs, edge width, wave radii, stacked leading) sit at the top of the script. `render.mjs` renders the PNGs and `favicon.ico` with sharp, shoots the OG images and `guide.png` with Playwright's Chromium (skipped if Playwright isn't installed), and copies the files the app, the homepage and the emails use into place.

Fredoka is by Milena Brandão and Hafontia, from github.com/google/fonts (`ofl/fredoka`), under the SIL Open Font License 1.1 (`src/OFL.txt`), which allows using it in a logo.

## Running cost

$0 a month at Beta (50 teams) and Growth (500 teams). The logo is static files: inline SVG in the app's pages, a few PNGs served by the existing app and homepage servers, and a 10KB PNG in emails that are already sent. No new service, no Claude tokens, no font hosting (the font is never loaded at runtime), and the build runs on a laptop.
