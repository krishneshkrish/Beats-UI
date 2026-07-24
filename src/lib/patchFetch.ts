/**
 * patchFetch.ts
 * ─────────────
 * Intercepts all YouTube / InnerTube API fetch calls made by youtubei.js and
 * routes them through the Next.js /yt-api/ and /yt-www/ server-side rewrites.
 *
 * WHY: Browsers block direct XHR to youtubei.googleapis.com with a CORS error.
 *      Next.js rewrites run on Vercel's Edge and are transparent to the browser.
 *
 * NOTE: This ONLY runs in browser context (window exists). SSR is untouched.
 */

if (typeof window !== 'undefined' && !(window as any).__beats_fetch_patched__) {
  (window as any).__beats_fetch_patched__ = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let urlStr = '';
    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (input instanceof Request) {
      urlStr = input.url;
    }

    // Already a rewritten / local URL — pass through unmodified
    if (!urlStr || urlStr.startsWith('/') || urlStr.startsWith(window.location.origin)) {
      return originalFetch(input, init);
    }

    // ── Route InnerTube API calls through Vercel rewrite (/yt-api/) ──────────
    if (urlStr.includes('/youtubei/v1/')) {
      try {
        const parsed = new URL(urlStr);
        const v1Idx = parsed.pathname.indexOf('/youtubei/v1');
        const afterV1 = parsed.pathname.substring(v1Idx + '/youtubei/v1'.length);
        const rewrittenUrl = `/yt-api${afterV1}${parsed.search}`;
        
        if (input instanceof Request) {
          return await originalFetch(new Request(rewrittenUrl, input), init);
        }
        return await originalFetch(rewrittenUrl, init);
      } catch (err) {
        console.warn('[patchFetch] /yt-api/ rewrite failed, falling back to direct fetch:', err);
      }
    }

    // ── Route other youtube.com page requests through /yt-www/ rewrite ─────────
    if (urlStr.includes('www.youtube.com/')) {
      try {
        const parsed = new URL(urlStr);
        const rewrittenUrl = `/yt-www${parsed.pathname}${parsed.search}`;
        if (input instanceof Request) {
          return await originalFetch(new Request(rewrittenUrl, input), init);
        }
        return await originalFetch(rewrittenUrl, init);
      } catch (err) {
        console.warn('[patchFetch] /yt-www/ rewrite failed, falling back to direct fetch:', err);
      }
    }

    // All other requests pass through unchanged
    return originalFetch(input, init);
  };
}
