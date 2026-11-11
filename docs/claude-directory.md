# Claude directory listing

Submit at claude.ai/directory/manage. Paste these fields as they are.

## Connector

- **Name:** Capybaroar
- **Server URL:** https://app.capybaroar.com/api/mcp
- **Auth:** OAuth 2.0 (sign in with Capybaroar, PKCE, dynamic client registration)
- **One-liner:** Plan, write and schedule social media posts to Instagram, LinkedIn, TikTok, X and 8 more networks, and see what worked.
- **Description:**

  Capybaroar is a social media scheduler for teams and creators. Connect it to Claude and ask for a week of posts, a LinkedIn version of your latest article or a recap of last month's results.

  Claude can:
  - List your channels, brands and channel groups, with each network's limits and settings.
  - Write posts and save them as drafts, schedule them for a set time, add them to your queue or publish them now.
  - Find your next free queue time and your best times to post.
  - List, update and delete scheduled posts.
  - Attach pictures and videos from your media library.
  - Read your analytics: reach, engagement, top posts and the formats that work.

  Networks: Instagram, Facebook, TikTok, LinkedIn profiles and Pages, YouTube, X, Threads, Pinterest, Bluesky, Mastodon and Discord.

  You sign in with your Capybaroar account and pick one workspace. Claude acts with your role and brand access, and every post goes through the same checks as the app (limits, required media, approvals). Remove the connection any time in Settings, API and MCP, Connected apps. Capybaroar has a free plan.

- **Categories:** Marketing, Productivity
- **Docs:** https://capybaroar.com/docs/mcp
- **Privacy policy:** https://capybaroar.com/privacy
- **Terms:** https://capybaroar.com/terms
- **Support:** hello@capybaroar.com
- **Icon:** claude-plugin/icon.png (square, 512 px)

## Example prompts

1. "Look at my channels and recent posts, then write a week of LinkedIn and X posts about our product launch. Save them as drafts at my next queue times."
2. "What's scheduled on Instagram this week?"
3. "Show my results for the last 30 days and tell me which posts did best and when to post."

## Test account for reviewers

- Email and password: make a demo account and paste them in the form.
- The workspace should have at least 2 connected channels (for example Bluesky and Mastodon) and a few published posts, so analytics show data.
- Note for reviewers: "Sign in, pick the Demo workspace, press Allow. Posts are saved as drafts unless you ask to schedule or publish."

## Tools

Every tool has a title and a readOnlyHint or destructiveHint. Picture and video generation (generate_media, get_generation) is left out of OAuth connections.

## Plugin (skills)

The `claude-plugin/` folder is a Claude Code plugin with the connector and 3 skills: plan-social-week, repurpose-into-posts and social-results-recap. Push it to its own public GitHub repo (for example capybaroar/capybaroar-claude-plugin) and submit that repo in the same form.

## Running cost

$0 extra a month at Beta (50 teams) and at Growth (500 teams). OAuth runs on the existing app and database. Claude runs on the customer's own Claude plan, so it adds no tokens to our bill.
