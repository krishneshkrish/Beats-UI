import { Innertube } from 'youtubei.js';
import { refreshStreamUrl } from './api';

let ytInstance: any = null;

async function getInnertubeInstance() {
  if (typeof window === 'undefined') {
    throw new Error('Innertube can only be initialized client-side in the browser');
  }

  if (!ytInstance) {
    const origin = window.location.origin;

    ytInstance = await Innertube.create({
      fetch: async (input, init) => {
        let urlStr = '';
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof Request) {
          urlStr = input.url;
        }

        // Intercept and route InnerTube API calls via the Next.js local rewrite proxy to bypass CORS
        if (urlStr.includes('youtubei/v1')) {
          const parsedUrl = new URL(urlStr);
          const newUrl = `${origin}/yt-api${parsedUrl.pathname.replace('/youtubei/v1', '')}${parsedUrl.search}`;

          if (typeof input === 'string') {
            input = newUrl;
          } else if (input instanceof Request) {
            input = new Request(newUrl, input);
          }
        } else if (urlStr.startsWith('https://www.youtube.com') || urlStr.startsWith('https://youtubei.googleapis.com')) {
          // Route general YouTube scrapes and pages through the local /yt-www rewrite proxy
          const parsedUrl = new URL(urlStr);
          const newUrl = `${origin}/yt-www${parsedUrl.pathname}${parsedUrl.search}`;

          if (typeof input === 'string') {
            input = newUrl;
          } else if (input instanceof Request) {
            input = new Request(newUrl, input);
          }
        }

        return fetch(input, init);
      }
    });
  }
  return ytInstance;
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
