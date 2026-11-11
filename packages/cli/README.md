# capybaroar

Capybaroar from the terminal.

```bash
npx capybaroar login
npx capybaroar channels
npx capybaroar post "We're open late on Fridays now." --to x,linkedin --at best --thread "From 7 to 11 PM."
npx capybaroar posts --json
```

`login` signs in through your browser and keeps the sign-in in `~/.config/capybaroar`. Set `CAPYBAROAR_API_KEY` to use an API key instead (Settings, API and MCP). Add `--json` to any command.
