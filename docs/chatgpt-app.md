# ChatGPT app

Capybaroar's MCP server works as a ChatGPT app with no extra build: it signs in with OAuth (PKCE S256, dynamic client registration, discovery at `/.well-known/oauth-protected-resource` and `/.well-known/oauth-authorization-server`), every tool has `readOnlyHint`, `destructiveHint` and `openWorldHint`, and apps that sign in get `securitySchemes` on each tool. Picture and video generation is hidden for apps that sign in.

## Steps

1. **Verify the organization** on platform.openai.com (Settings, Organization, Verification). Apps under an unverified name are rejected.
2. **Create the app** at https://platform.openai.com/plugins and connect the MCP server: `https://app.capybaroar.com/api/mcp`.
3. **Domain check:** OpenAI gives a challenge token. Put it on the app server as `OPENAI_APPS_CHALLENGE=<token>` and redeploy; `https://app.capybaroar.com/.well-known/openai-apps-challenge` then answers with it.
4. **Listing** (below), **test account** and **demo recording**, then Submit for review.

## Listing

- **Name:** Capybaroar
- **Description:** Plan, write and schedule social media posts to Instagram, TikTok, LinkedIn, YouTube, X and 9 more networks, and see what worked. Ask for a week of posts, a thread from an article, or last month's results; posts are saved as drafts unless you ask to schedule them.
- **Website:** https://capybaroar.com
- **Support:** https://capybaroar.com/docs (hello@capybaroar.com)
- **Privacy policy:** https://capybaroar.com/privacy
- **Terms:** https://capybaroar.com/terms

## Test account

A demo workspace with at least 2 connected channels (Bluesky and Mastodon work without app reviews), a few published posts with results, and one campaign. No two-step sign-in. Enter the email and password in the review form, not in the package.

## Review test cases

Positive:
1. "What channels do I have in Capybaroar?" → `list_channels`; lists the channels with their networks.
2. "Write a week of posts about our new rye bread and save them as drafts." → `list_channels`, `next_queue_slot`, `create_posts` (mode draft); drafts appear on the calendar.
3. "Turn this into a 4-post thread for Bluesky: [text]" → `create_posts` with `thread`; one draft with 3 more parts.
4. "How did my posts do in the last 30 days?" → `get_analytics`; reach, engagement, top posts and best times.
5. "What's scheduled next week?" → `list_posts`; the posts with times and channels.

Negative:
1. "Make a picture of a croissant." → no image tool is offered to ChatGPT; it says it can't make pictures here.
2. "Delete all my posts." → `delete_post` is destructive; ChatGPT asks to confirm each one before calling it.
3. "Post this to my Facebook" when no Facebook channel is connected → `list_channels` shows none; it says to connect Facebook in Capybaroar first.

## Running cost

$0 at Beta and Growth: the same MCP server and sign-in as Claude.
