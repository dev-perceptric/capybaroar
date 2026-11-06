# Help docs

The docs live at `/docs` and are built by `site/build/build_docs.py` as part of `npm run site:build`.

## Files

- `site/build/docs/pages.py`: sections, the guide pages, and the extra copy for each network (`NET`).
- `site/build/docs/facts.ts`: reads every network's limits, settings, Inbox and analytics straight from the app. The build runs it and saves `facts.json`, so network pages change when the app changes.
- `site/build/app-shots.mjs` (`npm run site:shots`): logs in with a demo account and saves fresh screens to `site/public/img/docs/`. Run it after each release with `CAPY_DEMO_EMAIL` and `CAPY_DEMO_PASSWORD` set. Use a demo workspace, never a customer's.
- Output: `/docs` (start page with search), `/docs/<slug>` (each page), `/docs/<slug>.md` (Markdown copy), `/docs/search.json`, `/llms.txt`.

## Writing a page

1. Title is the task ("Schedule a TikTok video"), and the lead says what you get in one line.
2. Steps go in `<ol class="dx-steps">` with the exact button names in bold.
3. Every fact comes from the app's code or the pricing page. Error messages are quoted exactly as the app shows them.
4. Set `app` to the screen the "Open in Capybaroar" button opens, and `shot` to a screenshot key.

## Running cost

$0 a month at Beta (50 teams) and Growth (500 teams). Static pages.
