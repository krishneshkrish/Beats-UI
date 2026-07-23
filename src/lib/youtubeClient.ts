import './patchFetch';
import { Innertube } from 'youtubei.js';
import { refreshStreamUrl } from './api';

let ytInstancePromise: Promise<any> | null = null;

async function getInnertubeInstance() {
  if (typeof window === 'undefined') {
    throw new Error('Innertube can only be initialized client-side in the browser');
  }

  if (!ytInstancePromise) {
    ytInstancePromise = (async () => {
      // Create the Innertube instance using the patched global fetch
      const instance = await Innertube.create();
      return instance;
    })();
  }
  return ytInstancePromise;
}

export async function resolveAudioStream(videoId: string): Promise<string> {
  try {
    const yt = await getInnertubeInstance();
    const info = await yt.getBasicInfo(videoId);

    // Prioritize best audio-only stream (M4A/AAC) for native iOS Safari decoding support
    let format = info.chooseFormat({ type: 'audio', quality: 'best' });
    if (!format) {
      format = info.chooseFormat({ type: 'audio' });
    }

    if (!format) {
      throw new Error(`No audio format found for video ID: ${videoId}`);
    }

    // Decipher the direct streaming URL using the current player session
    const deciphered = format.decipher(yt.session.player);
    const resolvedUrl = typeof deciphered === 'string' ? deciphered : await deciphered;

    if (!resolvedUrl) {
      throw new Error(`Failed to decipher stream URL for video ID: ${videoId}`);
    }

    return resolvedUrl;
  } catch (error) {
    console.warn(`Client-side extraction failed for ${videoId}. Falling back to backend stream resolver...`, error);
    try {
      const refreshResult = await refreshStreamUrl(videoId, 'youtube');
      if (refreshResult && refreshResult.url) {
        let finalUrl = refreshResult.url;
        if (finalUrl.startsWith('http://') && !finalUrl.includes('localhost') && !finalUrl.includes('127.0.0.1')) {
          finalUrl = finalUrl.replace('http://', 'https://');
        }
        return finalUrl;
      }
    } catch (fallbackError) {
      console.error(`Backend stream resolver fallback also failed for ${videoId}:`, fallbackError);
    }
    throw error;
  }
}
