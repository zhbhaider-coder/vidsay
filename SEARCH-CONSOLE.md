# Google Search Console — setup steps for vidsay.pages.dev

**Status: NOT submitted.** These steps need the site owner's Google account, so they cannot be done by the agent. Follow them once, in order.

## 1. Add the property

1. Go to https://search.google.com/search-console
2. Sign in with the Google account that should own the property.
3. Click **Add property** → choose **URL prefix** (not Domain).
4. Enter exactly: `https://vidsay.pages.dev`
5. Click **Continue**. Google will ask you to verify ownership.

## 2. Verify ownership (HTML-file method — works with Cloudflare Pages)

1. In the verification screen, choose the **HTML file** method.
2. Google will give you a file to download, named something like `googleXXXXXXXXXXXX.html` (a long string of letters and numbers), plus its contents.
3. Download that file.
4. Place the file in the root of this repo (`~/workspace/loom-clone/`), next to `index.html`. Do not rename it and do not edit its contents.
5. Commit and redeploy the site (the coordinator deploys — the file must be live at `https://vidsay.pages.dev/googleXXXXXXXXXXXX.html`).
6. Go back to Search Console and click **Verify**.
7. If it fails, first check the file loads in a browser at that URL. The usual cause is a deploy that did not include the new file.

Notes:
- The verification file must stay in the repo permanently. Removing it can lose verification.
- Alternative methods (DNS TXT, HTML tag) also work, but the HTML-file method is the simplest for a Cloudflare Pages site with no DNS access to the `pages.dev` domain.

## 3. Submit the sitemap

1. In Search Console, open **Sitemaps** in the left menu (under "Indexing").
2. In "Add a new sitemap", enter: `sitemap.xml`
3. Click **Submit**.
4. The full sitemap URL is `https://vidsay.pages.dev/sitemap.xml` — it lists all 7 pages (home, recorder, pricing, free-screen-recorder, loom-alternative, async-video-messaging, library).

Note (Oct 2026): the Natively and Tally clones' sitemaps showed "Couldn't fetch" in Search Console even though the files were valid (HTTP 200, valid XML) — the same happened on the Books site. The cause was traced to Cloudflare's automatic edge behaviour for pages.dev (script user-agents got 403; Googlebot's user-agent got 200), and Google retries sitemaps on its own. If this sitemap also shows "Couldn't fetch", leave it and re-check after a day or two.

## 4. Check indexing (after 1–3 days)

1. In Search Console, open **Pages** (under "Indexing") and confirm the 7 URLs appear as indexed or "Discovered — currently not indexed" (normal for a new site; re-check after a week).
2. Use the **URL Inspection** tool on the homepage and the three guide pages to request indexing if they are not picked up within a week.
3. Under **Performance**, watch for impressions on the target keywords: "free screen recorder", "loom alternative", "async video messaging".

## 5. Keep it healthy

- Re-check Search Console monthly for crawl errors and manual actions.
- Every time a new page is added, add it to `sitemap.xml` and re-submit the sitemap (Search Console re-reads it automatically, but a manual submit speeds things up).
