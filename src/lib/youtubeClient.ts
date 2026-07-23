/**
 * youtubeClient.ts
 * ─────────────────
 * Client-side stream resolution using youtubei.js (Innertube).
 *
 * Flow:
 *  1. patchFetch.ts intercepts all InnerTube XHR and routes via /yt-api/ Vercel rewrite.
 *  2. Innertube.create() initialises a fresh session using the patched fetch.
 *  3. getBasicInfo() + chooseFormat() decipher the direct DASH/M4A URL.
 *  4. On failure, fallback to GET /api/yt/refresh (Piped pool) on the backend.
 */
import './patchFetch';
import { Innertube } from 'youtubei.js';
import { refreshStreamUrl } from './api';

// Singleton promise — initialised once per browser session
let ytInstancePromise: Promise<any> | null = null;

async function getInnertubeInstance(): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('Innertube can only be initialised client-side');
  }
  if (!ytInstancePromise) {
    ytInstancePromise = Innertube.create({
      // Use the patched global fetch so all XHR goes through Vercel /yt-api/ rewrite
      fetch: window.fetch.bind(window),
    }).catch((err) => {
      // Reset on failure so the next call retries
      ytInstancePromise = null;
      throw err;
    });
  }
  return ytInstancePromise;
}

export async function resolveAudioStream(videoId: string): Promise<string> {
  // ── Primary: client-side youtubei.js via Vercel rewrite ──────────────────
  try {
    const yt = await getInnertubeInstance();
    const info = await yt.getBasicInfo(videoId);

    // Prefer audio-only M4A (AAC) for maximum iOS / Android compatibility
    let format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (!format) {
      format = info.chooseFormat({ type: 'audio' });
    }
    if (!format) {
      throw new Error(`No audio format found for ${videoId}`);
    }

    const deciphered = format.decipher(yt.session.player);
    const url = typeof deciphered === 'string' ? deciphered : await deciphered;

    if (!url) throw new Error(`Deciphered URL was empty for ${videoId}`);

    return url;
  } catch (primaryError) {
    console.warn(`[youtubeClient] Primary resolution failed for ${videoId}:`, primaryError);
  }

  // ── Fallback: backend Piped pool resolver ─────────────────────────────────
  try {
    const result = await refreshStreamUrl(videoId, 'youtube');
    if (result?.url) {
      // Upgrade insecure URLs (Piped sometimes returns http://)
      return result.url.startsWith('http://')
        ? result.url.replace('http://', 'https://')
        : result.url;
    }
  } catch (fallbackError) {
    console.error(`[youtubeClient] Piped fallback also failed for ${videoId}:`, fallbackError);
  }

  throw new Error(`All stream resolution methods failed for video ID: ${videoId}`);
}
