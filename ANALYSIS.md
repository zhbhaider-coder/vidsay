# Vidsay — Analysis of Loom (loom.com)

**Date:** 2026-10-28 · **Analyst:** Muse (builder subagent) · **Method:** web research (Sacra, Latka, Atlassian announcements, Loom pricing pages) + live checks of the clone. All Loom figures below are Loom's, not the clone's.

## 0. Brand check — the clone's name

The clone is named **Vidsay** ("say it in video"). Brand check done 2026-10-28 before the name was used anywhere:

| Candidate | Result |
| --- | --- |
| Reelcast | TAKEN — "ReelCast by ReelMetrics", a casino-industry podcast |
| Screenloop | TAKEN — Screenloop, an AI hiring/ATS platform (also "ScreenLoop" screen-recording ads) |
| Castly | TAKEN — Castly Mac app (Perfect Paradox Ltd), Castly+ iOS app, Castly Android TV-casting app (1.3M installs) |
| Vidloop | TAKEN — VidLoop AI video generator (Nexfuze, App Store), Vidloop Pte. Ltd., VidLoop.pro |
| Loopcast | TAKEN — Loopcast.io, a 24/7 video-looping broadcast service |
| Clipcast | TAKEN — ClipCast sports video (deadpooled, US trademark filed 2014), ClipCast podcast app (ClipCast Ltd, Scotland), Clipcast.cloud (native macOS screen recorder) |
| Talkclip | TAKEN — TalkClip iOS app, social-clip bookmark manager (Companywide AI) |
| Vidnote | TAKEN — VidNote (vidnote.app), a Slack-first meeting follow-up tool |
| Loopvid | TAKEN — LoopVid, iOS GIF-maker app (Visual Playground LLC, 2016) |
| **Vidsay** | **CLEAR — no company, product, app or trademark found under this name in two searches (only near-names Vidsy, VidDay, Vidyard appeared)** |

"Vidsay" is not "Loom" and does not use Loom's name, logo or copy anywhere on the clone. Footer on every page: "Unofficial rebuild for personal use — not affiliated with Loom."

## 1. What Loom is

Loom is an async video messaging platform: record your screen, camera and mic, share a link, and the other person watches when it suits them — instead of a live meeting. Founded 2015 (Joe Thomas, Shahed Khan, Vinay Hiremath). Acquired by **Atlassian in October 2023 for ~$975M**.

**Verified numbers:**
- **~$50M ARR** at acquisition (Sacra estimate, Oct 2023; Atlassian never confirmed it in SEC filings — widely cited, no primary source).
- **25M users** at acquisition; 200,000+ customers; 1.5B+ minutes of video recorded.
- **~$2 average revenue per user per year** ($50M ÷ 25M users) — the vast majority of users were on the free tier and never converted. For comparison, Slack makes ~$180/user/year.
- **$203M venture funding** raised before acquisition; largest round $130M Series C (May 2021, a16z), valuing Loom at $1.53B at the peak of the SaaS cycle.
- Post-acquisition, Atlassian does not break out Loom revenue (inside Atlassian's FY2025 revenue of $5.2B).

**Pricing (post-acquisition, 2026):**
- **Starter (free):** 25 videos, 5-minute recording cap.
- **Business:** $15–$18/user/month.
- **Business + AI:** $20–$24/user/month (transcription, summaries, chapters; AI locked to this tier).
- **Enterprise:** custom.
- Since the acquisition: free tier cut (25-video cap), prices roughly doubled on some tiers, Creator Lite role discontinued, and users have reported quality complaints (lag, audio sync drift, failed uploads) tied to the migration onto Atlassian infrastructure.

## 2. Site structure (Loom)

- `/` — homepage (hero "record once, share anywhere" style, async-video pitch)
- `/pricing` — tiers + FAQ
- Product pages: screen recorder, video messaging, AI features, integrations (Slack, Gmail, Jira, Confluence, Notion)
- App (login-gated): video library, folders, comments, viewer analytics, engagement tracking
- Chrome extension + desktop/mobile apps; embeddable video player

## 3. What the clone copies — and what it does not

**Copied (the idea, in original words):** async video messaging; screen + camera + mic recording; pause/resume; share the video instead of meeting; freemium with a 25-video / 5-minute free tier; Pro at $12/user/month (below Loom's $15–$18).

**NOT copied:** no Loom branding, copy, logo or design; no cloud storage; no accounts; no AI features (marked "coming soon" honestly); no viewer analytics; no comments; no team workspaces. The clone records in the browser and downloads a .webm file to the user's device.

## 4. How the clone works (technical)

- **Recorder** (`recorder.html` + `js/recorder.js`): `getDisplayMedia` for the screen, `getUserMedia` for camera + mic. Screen and camera are composited onto a 1280×720 canvas (camera picture-in-picture bottom-right, small "Vidsay" mark bottom-left on free recordings), `canvas.captureStream(30)` plus the mic/system audio track feeds a `MediaRecorder` (VP9/VP8 WebM). Pause/resume via the MediaRecorder API; the 5:00 free cap auto-stops recording with a 30-second warning.
- **Mobile mode:** phones can't share their screen (no `getDisplayMedia`), so on a phone — or any browser without screen capture — the recorder switches to camera-only mode: front camera by default with a switch to the rear camera (live, mid-recording), portrait 720×1280 canvas, same MediaRecorder pipeline, same limits and library save. Screen options and system audio are hidden; the copy says "Record with your camera" instead of showing an error.
- **Library** (`library.html` + `js/library.js`): recordings are stored in the browser's IndexedDB (video blob + metadata) and listed with play / download / delete. An import button re-adds a downloaded .webm. Nothing leaves the device.
- **Free limits enforced in code:** 25 recordings (IndexedDB count) and the 5-minute cap. Pro does not exist yet, so the limits apply to everyone for now — stated on the site.
- **Browser support:** Chrome, Edge, Firefox on desktop (screen + camera) and on mobile (camera recording; phones can't share their screen).
- **Stack:** plain HTML/CSS/JS, no framework, no build step. Total site ~70 KB.

## 5. Site structure (clone)

- `/` — landing (hero, features, how it works, FAQ)
- `/recorder` — working screen recorder
- `/library` — recordings library (IndexedDB)
- `/pricing` — Free $0 / Pro $12 (coming soon)
- `/free-screen-recorder` — SEO page
- `/loom-alternative` — SEO page (honest comparison)
- `/async-video-messaging` — SEO page
- `sitemap.xml` — 7 URLs, clean URLs (no `.html` in sitemap/canonical/og:url)
- `robots.txt` — Allow all + sitemap

## 6. Honest limits of this build

- No cloud storage, no share links, no accounts — the "share" step is downloading a file and sending it yourself.
- No AI features (summaries/transcripts) — marked coming soon, not claimed.
- No mobile screen sharing (phones can't share their screen — camera recording only).
- Video files live in the browser's IndexedDB; clearing browser data deletes the library (the downloaded .webm files are the safe copy).
