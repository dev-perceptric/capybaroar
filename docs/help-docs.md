# Help docs

The help docs live at https://docs.capybaroar.com, an Astro Starlight site in its own repo (`capybaroar-docs`, pages in `src/content/docs/`), served by GitHub Pages.

The old docs that `site/build` made at capybaroar.com/docs are gone. `site/default.conf.template` sends every old `/docs` address (with or without `.html`, `.md` or a trailing slash) to the matching new page with a 301, and anything else under `/docs` to the docs home. When a docs page moves, update that map and the links that point to it (the site's nav and footer, `site/public/llms.txt`, `src/lib/oauth/rules.ts`, `claude-plugin/`).

## Running cost

$0 a month at Beta (50 teams) and Growth (500 teams). Static pages on GitHub Pages.
