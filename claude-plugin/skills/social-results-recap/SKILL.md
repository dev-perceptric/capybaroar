---
name: social-results-recap
description: Recap social media results from Capybaroar analytics, explain what worked and suggest what to post next. Use when someone asks how their social media is doing, for a weekly or monthly report, their best posts, best time to post, or what to post more of.
---

# Social media results recap

Uses the Capybaroar MCP server.

## Steps

1. **Get the numbers.** Call `get_analytics` with `days` set to the period asked for (7 for a week, 30 for a month). Add `channel_id` for one channel only.
2. **Summarize in plain words.**
   - Reach and engagement against the period before, with the change in percent.
   - The top three posts and what they have in common (format, topic, first line, time).
   - Which formats did best, from the results by format.
   - The best times to post.
3. **Recommend next steps.** Two or three concrete actions, like "Post two carousels a week on Tuesday mornings" or "Turn the top post into a LinkedIn version".
4. **Offer to act.** Ask if they want you to draft next week's posts with the plan-social-week skill, using what worked.

## Rules

- Use only numbers that `get_analytics` returned. Say when a channel has too little data to judge.
- Keep it short: a few bullets per section, no long tables unless asked.
