# Discord

How to connect Discord, what you can post there and how to fix a post it turns down.

## At a glance

| Characters | 2,000 |
| Needs a picture or video | No |
| Connects with | A short form (Webhook URL) |
| Inbox | Not in the Inbox |
| Analytics | Not in Analytics yet |

## Connect Discord

Discord connects with a webhook, a private link that posts into one channel. In Discord, open the channel's settings, then Integrations, then Webhooks, create one and copy its URL. In Capybaroar, click Discord in Channels and paste the webhook URL.

## Post to Discord

1. **Open the calendar** and click **New post**.
2. **Pick your Discord channel** and write the post.
3. **Open the Discord tab** to set the options below.
4. **Check the preview**, then schedule, queue or post now.

- Messages can be up to 2,000 characters.
- A message takes up to 10 files, each under 10 MB.
- Each webhook posts to one channel. Add another webhook for another channel.

## If a post is turned down

Capybaroar checks each post before it's scheduled and shows the reason next to the channel. These are the Discord ones:

| Message | What to do |
| `This Discord webhook doesn't exist or was deleted` | Make a new webhook in Discord and connect it again. |
| `Discord takes up to 10 files` | Remove files until there are 10 or fewer. |
| `Discord files must be under 10 MB` | Use smaller files. |

Read more about scheduling Discord on the [Discord scheduler](https://capybaroar.com/discord-message-scheduler) page.

Source: https://capybaroar.com/docs/discord
