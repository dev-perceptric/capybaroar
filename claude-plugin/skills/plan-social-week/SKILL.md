---
name: plan-social-week
description: Plan and write a week of social media posts in Capybaroar and save them as drafts at the right times. Use when someone asks to plan, fill or write their social posts, a content calendar or a week or month of posts for Instagram, LinkedIn, TikTok, X, Facebook, Threads, YouTube, Pinterest, Bluesky, Mastodon or Discord.
---

# Plan a week of social posts

Uses the Capybaroar MCP server. Posts are saved as drafts, so nothing goes out until the person schedules them.

## Steps

1. **Learn the setup.** Call `list_channels`. Note each channel's id, network, `character_limit` and required settings. If there are several brands, ask which one, since one post can only use one brand's channels.
2. **Learn the voice.** Call `list_posts` with a `from` 30 days back and a `to` of today. Read the recent posts to match tone, length, emoji use and hashtags. If there are none, ask for two or three example posts or a short description of the voice.
3. **Agree the brief.** Make sure you know the topic or goal, the channels, how many posts a day and which days. Ask only for what's missing. Facts you can't know (prices, dates, names, links) must come from the person: never make them up.
4. **Pick the times.** If the person named times, use them with their time zone offset. Otherwise call `next_queue_slot` for each post, or call `get_analytics` and use its best times to post.
5. **Write the posts.** One idea per post, with a strong first line. Fit each post to its network: stay inside `character_limit`, use `channel_text` when one network needs its own version (X short, LinkedIn longer), and put links or hashtags in a `first_comment` setting where the network supports it.
6. **Save as drafts.** Call `create_posts` with every post, `mode: "draft"` and `publish_at` set. Each post is checked on its own, so report any that were refused and why.
7. **Hand back.** List what you saved (day, time, channel, first line) and tell the person to review them in the Capybaroar calendar and schedule them, or ask you to.

## Rules

- Never use `mode: "now"` or `"schedule"` unless the person asks to publish or schedule.
- Never delete posts without asking first.
- Instagram, TikTok, YouTube and Pinterest need media. If the person hasn't given any, call `list_media` and suggest files, or save the draft and say it needs a picture or video.
