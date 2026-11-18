# Getting-started emails

New workspaces get a short run of emails in their first weeks, sent to the person who made the workspace. Each one
asks for one thing and is skipped once that thing is done. When: `src/lib/nurturePlan.ts`. Words and look:
`src/lib/nurtureMail.ts`. Sending: `src/lib/nurture.ts`, from the runner every 15 minutes. Log and switch: 049.

| Day | Email | Sends when |
|---|---|---|
| 0 | Every channel, one calendar. Let's go. (first-week checklist) | 15 minutes after the workspace is made |
| 1 | Connect your first channel | No channel yet |
| 2 | Schedule your first post (shows the next open queue slot) | A channel, but nothing scheduled or sent |
| 3 | Your first post is live (posts, channels, what's next) | A post went out |
| 5 | Let Capy write your week (credits left) | AI unused, on a plan with AI |
| 7 | One link for everything you post | No link-in-bio page |
| 11 | 3 days left on Pro | 3 days or fewer left on the trial |
| 14 | Your trial ended. Your posts are safe. (Free, Creator, Pro) | The trial ended in the last 3 days |
| 14 | Want us to set it up with you? | On Free and not seen for 7 days |
| 21+ | Your queue ran dry | Not seen for 21 days and nothing scheduled, at most every 90 days |

Rules: one a day at most, 9:00 to 18:00 in the workspace's time zone (the welcome goes out right away). Paying
workspaces only get the setup emails (days 1 to 7). Someone who was already in another workspace doesn't get them.
Each person can turn them off in Settings, Your account, or with the link in each email (`/api/email/tips`).

The look: a yellow hero (#FFD202, ink on it), a kicker, the title and one big visual (a number, a row of numbers, a
progress bar, a post card, a link-in-bio card or the sender). Then one short list on white and the dark gray pill.

Settings (all optional): `NURTURE_START` (default 2026-11-19; older workspaces never get them), `NURTURE_REPLY_TO`
(default hello@mail.capybaroar.com), `NURTURE_SIGN_NAME` and `NURTURE_SIGN_ROLE` (shown on the help email),
`NURTURE_OFF=1`. The turn-off link is signed with `TOKEN_KEY`.

Previews: `npx tsx scripts/nurture-previews.ts` writes `email-previews/`.

## Running cost

No new service and no AI. At most 10 emails per new workspace through the Resend SMTP account the alerts already
use: about 500 emails a month at Beta (50 teams) and 5,000 at Growth (500 teams), inside the current Resend plan.
$0 added a month at both stages (check the Resend plan's monthly cap).
