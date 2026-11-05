# Site builder

The marketing site in `site/public` is plain HTML. These scripts generate most of it from shared parts, so every page keeps the same nav, footer and look.

Rebuild everything (Python 3, no packages needed):

```
npm run site:build
```

That runs `build_tools.py`, which runs the others in order. The output goes straight into `site/public`. Check it with `git diff`, then deploy from `site/` with `fly deploy`.

| File | Builds |
|---|---|
| `build_pages.py` | The nav and footer on every page, the 5 feature pages (`/social-media-scheduler`, `/social-media-inbox`, `/social-media-analytics`, `/link-in-bio`, `/mcp`) and the sitemap |
| `build_channels.py` | The 11 network pages (`/facebook-post-scheduler` and the rest), `/blog` and `/tools` |
| `build_tools.py` | The free tools under `/tools/` and the `/tools` index |
| `tools_text.py`, `tools_plan.py`, `tools_media.py`, `tools_more.py` | The content of each tool page: the tool, the guide and the FAQ |
| `emoji/` | Emoji data from emojibase-data 18.0.0 (MIT, see `emoji/LICENSE`) |

`site/public/index.html` is the source for the homepage and for the parts other pages copy (the sprite of icons and logos, the header, the footer and the live scenes), so edit the homepage there directly. The tools' behavior lives in `site/public/tools/tools.js` and the site's shared behavior in `site/public/site.js` and `site/public/nav.js`.

Facts on the network pages come from the app (`src/lib/networks.ts` and `src/lib/providers/*`). When a network changes there, update `build_channels.py` and the network tables in `build_pages.py` to match.
