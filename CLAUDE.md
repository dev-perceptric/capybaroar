# Capybaroar

Schedule posts to every social channel from one calendar. Our own code on the Omniscient stack (Next.js, Supabase, Fly). No Postiz code: each channel is written from that network's official API docs.

## Look
- The calm style shared with Omniscient and Claritia (`/home/user/omniscient/docs/brand.md` in sessions with that repo): Inter 13px, a 4px grid, a light gray shell (`shell`) with the sidebar and the page as two white raised panels, plain grays for text. Use the tokens in `src/app/globals.css`, never a hex. No gradients, no emoji.
- Corners grow with the size of the thing: `rounded-xs` 4px, `rounded-sm` 6px (tags, menu rows), `rounded-md` 8px (buttons, inputs), `rounded-lg` 12px (cards, menus, panels), `rounded-2xl` 16px (dialogs, sheets). Raised things carry the soft `border-frame` ring (#E5E5E5) and the shadow for their kind (`shadow-card`, `shadow-chip`, `shadow-outline`, `shadow-input`, `shadow-focus`, `shadow-primary`, `shadow-pop`, `shadow-modal`). Never a dark frame.
- The one primary action is dark gray (`brand`, #333333) with white text.
- Yellow is the one accent, Zite's palette (`signal`): #FFD202 fill, #E6BD00 ring and hover, #FFF6C7 and #FFFCED soft fills, #262209 ink on yellow (`on-signal`). It marks the open sidebar item's icon, today, picked chips and options, focus, switches and the inbox count, about 5% of a screen. Yellow is always a fill with ink on it: never yellow text or icons on white, never white text on yellow. `yolk` names still work and point to the same yellow.
- A record's state is a `Badge` (6px tag, soft fill, deep text, no frame). Section labels are gray Inter (`label-mono`); mono is only for code, keys and ids.
- Shared parts only: `Button`, `IconButton`, `Field`, `Input`, `TabNav`, `Segmented`, `Badge`, `Empty` (`src/components/ui.tsx`), `Modal`/`Sheet` (`Overlay.tsx`), `Select`, dialogs (`Dialogs.tsx`), `ToolIntro`, `Loader`.
- No `<select>`, `window.prompt`, `window.confirm` or `window.alert`.
- Networks show their logo (`NetworkLogo`), with the name as the label.

## Copy
- Working screens: labels, buttons and real errors only. Explain once, on a tool's first screen (`ToolIntro`).

## Rule: every build includes its running cost
- State what a feature adds to the monthly bill at Beta (50 teams) and Growth (500 teams). Mark unconfirmed prices "check".

## API and MCP
- The REST API (`/api/v1`) and the MCP server (`/api/mcp`, and `/api/mcp/<key>` for apps that take only a link) run the same actions (`src/lib/api/ops.ts`). Add a feature to both or to neither.
- Every write goes through `savePost`, so the API keeps the app's checks: limits, settings, media, plan, brands and approvals.
- Keys (`009_api.sql`) are stored as a hash, shown once, and act as the person who made them, checked on every request. 120 requests a minute per key.
- Input is checked in `src/lib/api/input.ts` and the protocol in `src/lib/api/mcp.ts`, both pure and covered by `tests/api.test.ts`.
- Anything the server fetches or calls for people (webhook URLs, links to upload from) goes through `src/lib/api/fetchSafe.ts`: public internet only, checked on the IP it connects to. Never call a person's URL with plain `fetch`.
- Webhooks (`020_webhooks.sql`, `src/lib/webhooks.ts`) have their own deliveries table and loop, so a slow URL never holds up publishing. `emit()` never throws. Rules (signature, retries, turning off) are in `src/lib/api/hookRules.ts`, covered by `tests/webhooks.test.ts`.
