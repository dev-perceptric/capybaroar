# Capybaroar for Claude

Plan, write and schedule social media posts to 12 networks from Claude, and recap what worked.

- **Connector:** the Capybaroar MCP server (`https://app.capybaroar.com/api/mcp`). Claude signs you in with Capybaroar and you pick the workspace.
- **Skills:**
  - `plan-social-week`: a week of posts saved as drafts at the right times.
  - `repurpose-into-posts`: an article, newsletter or transcript turned into posts for each network.
  - `social-results-recap`: results, top posts and what to post next.

Networks: Instagram, Facebook, TikTok, LinkedIn (profiles and Pages), YouTube, X, Threads, Pinterest, Bluesky, Mastodon and Discord.

## Install in Claude Code

```
/plugin marketplace add capybaroar/capybaroar-claude-plugin
/plugin install capybaroar@capybaroar
```

You need a Capybaroar account (free plan available): https://app.capybaroar.com/signup

Docs: https://capybaroar.com/docs/mcp, Privacy: https://capybaroar.com/privacy, Support: hello@capybaroar.com
