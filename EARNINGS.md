# EARNINGS.md — How this clone can make money

**Date:** 2026-10-28 · **Scope:** one page, honest, no income promises.

## 1. How the original Loom makes money

Loom is freemium. The **Starter** plan is free (25 videos, 5-minute cap) — that free tier is the funnel: 25M users at acquisition. Revenue comes from the small share who need more:

- **Business — $15–$18/user/month:** unlimited videos, longer recordings, no Loom branding, engagement insights.
- **Business + AI — $20–$24/user/month:** everything in Business + AI transcription, summaries, chapters, titles.
- **Enterprise — custom:** SSO, advanced admin, dedicated support.
- **Result (Sacra estimate, Oct 2023):** ~$50M ARR on 25M users — roughly **$2 per user per year**. The vast majority of users never pay. Loom's conversion funnel was famously weak: one of SaaS's best top-of-funnel engines on top of one of its weakest conversion funnels. Atlassian bought it for $975M anyway — for distribution and the Atlassian ecosystem fit, not for its monetization.

## 2. How THIS clone can make money with the same model

Same freemium shape, adapted to a browser-only build:

- **Keep free forever:** screen + camera + mic recording in the browser, 25 videos, 5-minute cap, .webm download. Free is the funnel — never charge for the core.
- **Charge for the Pro tier ($12/user/month target — below Loom's $15–$18):** unlimited videos, longer recordings, no watermark, 1080p, and (later) AI summaries/transcripts. These are the exact features the original charges for.
- **The honest catch — storage costs money.** Unlike the Tally clone (text in localStorage, nearly free to run), every video costs storage and bandwidth. A clone that stores videos in the cloud pays for every free user, forever. That is why this v1 stores nothing: videos live on the user's device. Cloud storage only makes sense once paying users cover it — e.g. Cloudflare R2 (free tier: 10 GB storage; egress free) as a first step, with upload caps on the free plan.
- **Distribution:** "free screen recorder" and "loom alternative" are high-volume search terms. A free tool page that ranks brings users without ads. Each recording's downloaded file is not a billboard the way Tally's badge is — the loop is weaker, so SEO and directory listings matter more.
- **What stays free by design:** the recorder, the library, the download. If the free tier feels crippled, the loop dies.

## 3. What is still missing before it can earn a single rupee

Be blunt: **this build earns nothing on day one.** It is a working website + browser recorder, not a business yet. Missing pieces, in order:

1. **User accounts** — today recordings live in one browser's IndexedDB; there is no signup, no login, no cross-device access. Needed: auth + a server database.
2. **Cloud storage** — to offer share links (the core Loom feature), videos must live on a server. Needed: object storage (e.g. R2/S3) + upload/download + quotas. This is the single biggest cost line: storage + bandwidth per video.
3. **Payments** — no checkout exists. Needed: Stripe or Paddle (Paddle handles tax/VAT and works better for Pakistan-based sellers; Stripe is not available for Pakistan-registered businesses). Plus a billing page, invoices, and dunning for failed cards.
4. **Usage limits & plan enforcement** — free vs Pro must be enforced server-side (video count, length cap, watermark), otherwise anyone can bypass it in the browser.
5. **Terms of Service + Privacy Policy** — required before taking money or storing other people's videos; must cover data ownership, retention, deletion, and GDPR-style commitments. Video is more sensitive than form text.
6. **Abuse & spam controls** — rate limits, upload size caps, content moderation. Free video upload attracts abuse faster than free forms.
7. **Support + reliability** — uptime, backups, a way for paying users to reach a human. A paid product with no support refunds fast.
8. **Legal identity** — a registered business entity and a bank/payment account that can receive payouts.

## 4. Realistic path & timeline (no income promises)

- **Weeks 1–4 — users first:** ship the clone, list it in free directories, share in "loom alternative" / screen-recorder communities. Goal: real people recording and downloading videos. Measure: recordings made, downloads, returning visitors. Target: 100+ recordings in month one.
- **Months 2–3 — prove retention:** add accounts + cloud storage so recordings survive across devices and get share links (the single biggest reason users stay — and the feature that justifies paying). Goal: users returning weekly.
- **Months 3–4 — first paid tier:** add Paddle checkout for Pro ($12/user/month). Start with unlimited videos + no watermark only — the two features with the clearest willingness to pay. Goal: first 10 paying users.
- **Months 4–6 — grow the loop:** AI summaries/transcripts (the Loom Business+AI upsell), team workspaces, comments. Each free recording shared is a potential signup.
- **Honest expectation:** a clone earns nothing on day one, and most clones never earn. Loom itself made only ~$2/user/year — if this clone reached 1,000 active users and matched that, it would be ~$170/month, and storage would eat part of it. **This clone earns slower than the Tally clone** (text is nearly free to store; video is not). The realistic win is a working product with real users first; revenue follows retention, not launch day.

## 5. The faster earnings use of "Loom" (for Zohaib, right now)

The clone is the slow asset. The fast one is using Loom itself (free tier) to record short personal video pitches with Contra/freelance proposals — video pitches convert better than text, and the nearest income is a Contra client, not a SaaS subscription. Build the clone in the background; pitch with video in the foreground.
