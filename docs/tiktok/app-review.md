# TikTok app review

Everything the TikTok for Developers form asks for, matching what the app does in `src/lib/providers/tiktok.ts`.

## App details

| Field | Value |
|---|---|
| App icon | `docs/tiktok/capybaroar-app-icon-1024.png` (1024 × 1024 PNG) |
| App name | Capybaroar |
| Category | Business (or Productivity if Business isn't listed) |
| Description (117/120) | Plan, schedule and publish your TikTok videos and posts for other networks from one calendar, then track how they do. |
| Terms of Service URL | https://capybaroar.com/terms |
| Privacy Policy URL | https://capybaroar.com/privacy |
| Platforms | Web |
| Website URL | https://capybaroar.com |

## Products and scopes

| Product | Scopes | What the app does with it |
|---|---|---|
| Login Kit | user.info.basic | Connect TikTok; show the account's name and avatar |
| Login Kit redirect URI | https://app.capybaroar.com/integrations/social/tiktok | |
| Content Posting API (turn on Direct Post) | video.publish | Show the creator's options, upload and publish a video now or at a scheduled time |

Remove Display API and the user.info.profile, user.info.stats, video.list and video.upload scopes. The app no longer asks for them; add them back after the Direct Post audit if analytics for TikTok is wanted.

## App review text (990/1000)

```
Capybaroar is a web app (app.capybaroar.com) where people plan and schedule their own social media posts.

Login Kit, user.info.basic: the user clicks Connect TikTok in Channels, signs in, and we read open_id, display name and avatar to show which account is connected. They can disconnect at any time.

Content Posting API (Direct Post), video.publish: the user uploads one video and writes a caption. For the TikTok channel we call creator_info and show the creator's nickname and avatar, only the privacy options TikTok returns (no default), and Allow comments, Duet and Stitch (off by default, locked off when the account disables them). The user can mark promotional content, which shows TikTok's label, and sees the Music Usage Confirmation (and Branded Content Policy when branded). They post now or at a set time. Our server uploads the file (FILE_UPLOAD), publishes it, checks the status and says the video may take a few minutes to appear. Nothing posts without the user's action.
```

## URL properties

1. URL properties, Verify property, URL prefix: `https://capybaroar.com/`.
2. Download the signature file TikTok gives you (named like `tiktokAbC123.txt`) and send it over. It goes in `site/public/` and ships with the next site deploy.
3. Do the same for `https://app.capybaroar.com/` if TikTok asks for it. That file goes in the app's `public/` folder.
4. Or verify the whole domain with a DNS TXT record (`tiktok-developers-site-verification=...`) where capybaroar.com's DNS is managed.

## Demo video (record in Sandbox)

Set up first:
- Sandbox tab: add the products and scopes above, the same redirect URI, and add your TikTok account as a target user.
- Point the app at the Sandbox keys for the recording: `fly secrets set TIKTOK_CLIENT_ID=<sandbox key> TIKTOK_CLIENT_SECRET=<sandbox secret> -a capybaroar-web`, then set the production keys back after.

Record one take, with the address bar showing app.capybaroar.com:
1. Open https://app.capybaroar.com and log in.
2. Channels, Connect TikTok. Sign in to TikTok, approve the scopes, land back on Channels with the TikTok account's name, avatar and username showing.
3. New post. Upload one video, write a caption, pick the TikTok channel.
4. Show the TikTok block: "Posting as" with your TikTok name and avatar, Who can watch (only the options TikTok allows, pick Only me), Allow comments, Allow Duet, Allow Stitch (all off, turn one on), Promotional content (pick Your brand to show the label line, then set it back to No), and the Music Usage Confirmation line.
5. Post now. Show the "TikTok can take a few minutes" message, then wait for the post to show as published.
6. Open TikTok on your phone or tiktok.com and show the video on the account.
7. Channels, show how to disconnect TikTok.

Unaudited apps can only post as "Only me". After approval, apply for the Direct Post audit so public posting opens up.
