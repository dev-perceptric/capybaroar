# @capybaroar/sdk

Capybaroar's REST API for Node 18+ and the browser. No dependencies.

```bash
npm install @capybaroar/sdk
```

```js
import { Capybaroar } from "@capybaroar/sdk";

const capy = new Capybaroar({ apiKey: process.env.CAPYBAROAR_API_KEY });
const channels = await capy.channels();
await capy.createPost({
  channel_ids: channels.filter((c) => c.network === "x").map((c) => c.id),
  text: "We're open late on Fridays now.",
  thread: ["From 7 to 11 PM.", "Bring a friend."],
  mode: "schedule",
  publish_at: "best",
});
```

Get an API key in Capybaroar: Settings, API and MCP. Every call retries on 429 and 5xx. Errors are `CapybaroarError` with `status`, `code` and `message`. Full reference: https://capybaroar.com/api
