# Capybaroar

Schedule posts to every social channel from one calendar. Our own code on the Omniscient stack (Next.js, Supabase, Fly). No Postiz code: each channel is written from that network's official API docs.

## Look
- Omniscient's style (`/home/user/omniscient/docs/brand.md` in sessions with that repo): black and white, square and framed, Inter 13px, 4px grid, no shadows, no gradients, no emoji.
- Ocelot yellow (`yolk`, #FFE100) with ink text marks the one primary action, the current sidebar item, the current segment, today and selections. Never yellow text on white, never white text on yellow. Black stays for frames, text, links and focus.
- Shared parts only: `Button`, `IconButton`, `Field`, `Input`, `TabNav`, `Segmented`, `Badge`, `Empty` (`src/components/ui.tsx`), `Modal`/`Sheet` (`Overlay.tsx`), `Select`, dialogs (`Dialogs.tsx`), `ToolIntro`, `Loader`.
- No `<select>`, `window.prompt`, `window.confirm` or `window.alert`.
- Networks show their logo (`NetworkLogo`), with the name as the label.

## Copy
- Working screens: labels, buttons and real errors only. Explain once, on a tool's first screen (`ToolIntro`).

## Rule: every build includes its running cost
- State what a feature adds to the monthly bill at Beta (50 teams) and Growth (500 teams). Mark unconfirmed prices "check".
