# Use Capybaroar from Claude, ChatGPT or Cursor

Capybaroar has an MCP server, so the AI you already use can plan, write and schedule posts in your account. It is on every plan, Free too.

## 1. Copy your MCP link

1. In Capybaroar, open **Settings**, then **API and MCP**.
2. Press **New key** and copy the **MCP link**. It looks like `https://app.capybaroar.com/api/mcp/cbr_...`

Keep the link private. Anyone with it can post as you. You only see it once, so make a new key if you lose it.

## 2a. Claude

1. Open **Settings**, then **Connectors**.
2. Press **Add custom connector**, name it Capybaroar and paste your link.
3. Press **Add**, then start a new chat.

## 2b. ChatGPT

1. Open **Settings**, then **Apps and Connectors**.
2. Under **Advanced**, turn on **Developer mode**. This needs a paid ChatGPT plan.
3. Press **Create**, name it Capybaroar and paste your link.
4. In a new chat, open **+** and pick Capybaroar.

## 2c. Cursor

Open **Cursor Settings**, then **MCP**, press **Add new MCP server** and paste this with your link:

```
{
  "mcpServers": {
    "capybaroar": { "url": "https://app.capybaroar.com/api/mcp/cbr_your_key" }
  }
}
```

## 2d. Claude Code

```
`claude mcp add --transport http capybaroar https://app.capybaroar.com/api/mcp/cbr_your_key`
```

## 3. Try it

- "Use Capybaroar. Look at my channels and recent posts, then write a week of posts about [topic]. Save them as drafts at my next queue times."

- "Use Capybaroar. List everything scheduled for this week."

- "Use Capybaroar. Show my results for the last 30 days and tell me which posts did best."

## What your AI can do

List channels, brands and channel groups; create, update, list and delete posts; find the next queue time; upload and list media; make pictures and videos; read analytics and credits; and manage webhooks. The [API docs](https://capybaroar.com/api) list every action in detail.

Source: https://capybaroar.com/docs/mcp
