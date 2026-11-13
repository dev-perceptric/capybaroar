# Capybaroar

Schedule posts to every social channel from one calendar. Our own code on the Omniscient stack (Next.js, Supabase, Fly). No Postiz code: each channel is written from that network's official API docs.

## Look
- The calm style shared with Claritia and Omniscient (Claritia's `docs/brand.md` version 4, `/home/user/claritia-main/docs/brand.md` in sessions with that repo): Inter 13px, a 4px grid, plain grays for text. A light gray shell (`shell`) with the sidebar sitting on it (no panel) and the page as ONE white raised panel: a white header bar (`Page`: 52px, 15px title, the section's tabs as chips beside the title, actions on the right), then a `paper` work area where white cards sit on ring shadows. Use the tokens in `src/app/globals.css`, never a hex. No gradients, no emoji.
- Corners grow with the size of the thing: `rounded-sm` 6px (tags, menu rows), `rounded-md` 8px (inputs, tabs), `rounded-lg` 12px (cards, menus, panels), `rounded-xl`/`rounded-2xl` 16px (stat cards, dialogs, sheets). Buttons, chips, switches and segmented controls are pills (`rounded-full`). Raised things carry a ring shadow for their kind instead of a border (`shadow-card`/`shadow-rest`, `shadow-hover`, `shadow-chip`, `shadow-pill`, `shadow-outline`, `shadow-input`, `shadow-focus`, `shadow-primary`, `shadow-picked`, `shadow-menu`, `shadow-modal`); dividers inside them stay `line` hairlines. Never a dark frame.
- The one primary action is a dark gray pill (`brand`, #333333) with white text.
- Yellow is the one accent, Zite's palette (`signal`): #FFD202 fill, #E6BD00 ring and hover, #FFF6C7 and #FFFCED soft fills, #262209 ink on yellow (`on-signal`). It marks the open sidebar item's icon, today, picked chips, tabs and options (`bg-signal-soft` + `shadow-picked`), focus, switches and the inbox count, about 5% of a screen. Yellow is always a fill with ink on it: never yellow text or icons on white, never white text on yellow. `yolk` names still work and point to the same yellow.
- A record's state is a `Badge` (6px tag, soft fill, deep text, no frame). Section labels are gray Inter (`label-mono`); mono is only for code, keys and ids.
- Shared parts only (`src/components/ui.tsx`): `Page`, `Button`/`LinkButton`, `IconButton`/`IconLink`, `Chip`, `Field`, `Input`, `TextArea`, `TabNav`, `Segmented`, `Badge`, `Panel`, `CardHead`, `Rows`/`Row`, `PaneHead`, `CopyField`, `StatCards`, `Empty`, `ErrorNote`, `Loading`, `boxClass`/`bareArea` for a text box with a toolbar; `Modal`/`Sheet` (`Overlay.tsx`), `Select`, dialogs (`Dialogs.tsx`), `ToolIntro` (a line break in its title turns the rest gray), `Loader`, `ChannelFace` (`NetworkLogo.tsx`).
- No `<select>`, `window.prompt`, `window.confirm` or `window.alert`.
- Picking from a list that can grow (channels, groups, brands, campaigns, models, kinds) is a dropdown: `Select` for one, `MultiSelect` for several. Never a row of chips.
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
