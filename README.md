# Vidsay — Free Screen Recorder & Async Video Messages

A lightweight, free rebuild of [Loom](https://www.loom.com) — record your screen, camera and mic in the browser and share the video instead of booking a meeting. No sign-up, no install, no server.

**Live site:** https://vidsay.pages.dev/

> Unofficial rebuild for personal use — not affiliated with Loom.

## What it does

- **Recorder** (`recorder.html`) — screen + webcam overlay + mic, live preview, pause/resume, 5-minute free cap, downloads as `.webm`. On a phone it records with your camera instead (front/rear switch, portrait video) — phones can't share their screen.
- **My videos** (`library.html`) — recordings saved in the browser (IndexedDB), with play, download, import and delete
- **Pricing** (`pricing.html`) — Free $0 (25 videos, 5-minute cap), Pro $12/user/mo (unlimited, no watermark, 1080p; AI summaries/transcripts marked coming soon)
- **SEO pages** — free screen recorder, Loom alternative (honest comparison), async video messaging

## How it works

Everything runs in the browser. The screen and camera are composited on a canvas (camera picture-in-picture, small "Vidsay" mark on free recordings) and captured with the MediaRecorder API. Videos are stored in the browser's IndexedDB and download as `.webm` files — **there is no cloud storage in v1, nothing is uploaded anywhere**. Keep the downloaded files safe: clearing browser data deletes the library.

Works in Chrome, Edge and Firefox on desktop (screen + camera) and on mobile (camera recording).

## Tech

Plain HTML, CSS, and JavaScript. No framework, no build step. The whole site is ~70 KB.

## Deploy

Hosted on Cloudflare Pages (free). Deploy with the Pages helper from the project directory:

```bash
cd ~/workspace/loom-clone
PYTHONPATH=/opt/muse/skills/custom-connector-setup/bin python3 ~/workspace/custom-connectors/custom.legacy-cloudflare-pages-deploy/bin/cf-pages-deploy.py vidsay . <account-id>
```

## Files

| File | What it is |
| --- | --- |
| `index.html` | Landing page |
| `recorder.html` + `js/recorder.js` | Working screen recorder |
| `library.html` + `js/library.js` | Recordings library (IndexedDB) |
| `pricing.html` | Pricing tiers |
| `free-screen-recorder.html` | SEO page |
| `loom-alternative.html` | SEO page (honest comparison) |
| `async-video-messaging.html` | SEO page |
| `styles.css` | Shared styles |
| `sitemap.xml` | 7 URLs |
| `ANALYSIS.md` | Deep analysis of the original (Loom: ~$50M ARR, $975M Atlassian acquisition, 25M users) + brand check |
| `EARNINGS.md` | How the original earns and how this clone could — honest: slower than the Tally clone |
| `SEARCH-CONSOLE.md` | Search Console setup notes |

## Status

- Live at https://vidsay.pages.dev/ (deployed 2026-10-28)
- Search Console: NOT submitted yet (owner's tap — see SEARCH-CONSOLE.md)
- Brand check: **Vidsay** — no existing company/brand/trademark found (9 other names checked and rejected: Reelcast, Screenloop, Castly, Vidloop, Loopcast, Clipcast, Talkclip, Vidnote, Loopvid)
