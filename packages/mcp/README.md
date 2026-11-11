# @capybaroar/mcp

Capybaroar's MCP server for apps that start a command (stdio). It forwards to the hosted server, so you get the same tools as https://app.capybaroar.com/api/mcp.

```json
{
  "mcpServers": {
    "capybaroar": { "command": "npx", "args": ["-y", "@capybaroar/mcp"], "env": { "CAPYBAROAR_API_KEY": "cbr_..." } }
  }
}
```

Apps that take a link (Claude, ChatGPT, Cursor) can connect to https://app.capybaroar.com/api/mcp directly instead.
