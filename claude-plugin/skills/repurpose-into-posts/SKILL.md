---
name: repurpose-into-posts
description: Turn an article, blog post, newsletter, transcript, video script or notes into social media posts for each network and save them as Capybaroar drafts. Use when someone shares a link or text and asks for posts, a thread, a LinkedIn post, an X post or social copy from it.
---

# Repurpose content into social posts

Uses the Capybaroar MCP server.

## Steps

1. **Read the source.** Use the text the person pasted, or fetch the link they shared. Pull out the main point, two to four supporting points, any numbers or quotes, and the link to send people to.
2. **Check the channels.** Call `list_channels` for ids, networks and each `character_limit`.
3. **Write one version per network**, keeping only facts from the source:
   - LinkedIn: a hook line, a short story or lesson, three to five short paragraphs, a question to end. Link in `first_comment`.
   - X and Bluesky: one tight post within the limit, or the single strongest point.
   - Instagram and Threads: a hook, a few short lines, hashtags at the end. Instagram needs a picture or video.
   - Facebook: conversational, with the link.
4. **Save as drafts.** Call `create_posts` with one post and `channel_text` for each network's version, or one post per network. Use `next_queue_slot` for `publish_at` unless the person gave times.
5. **Hand back.** Show each version and say they're drafts in the Capybaroar calendar.

## Rules

- Quote numbers and claims exactly as the source has them. Don't add new facts.
- Credit people the source quotes.
- Leave drafts as drafts unless asked to schedule.
