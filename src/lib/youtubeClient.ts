import { Innertube } from 'youtubei.js';
import { refreshStreamUrl, API_BASE_URL } from './api';

// Global window.fetch patch to intercept all YouTube/InnerTube calls to bypass CORS blocks
if (typeof window !== 'undefined' && !window.hasOwnProperty('__beats_fetch_patched__')) {
  (window as any).__beats_fetch_patched__ = true;
  
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    let urlStr = '';
    if (typeof input === 'string') {
      urlStr = input;
    } else if (input instanceof URL) {
      urlStr = input.toString();
    } else if (input && typeof input === 'object' && 'url' in input) {
      urlStr = (input as any).url;
    }

    const isCapacitor = (window as any).Capacitor;
    const isBrowser = !isCapacitor;

    const isYouTubeUrl = urlStr.includes('youtubei.googleapis.com') || 
                         urlStr.includes('googleapis.com/youtubei') ||
                         urlStr.includes('youtube.com') ||
                         urlStr.includes('ytimg.com');

    if (isBrowser && isYouTubeUrl && !urlStr.includes('/api/yt/proxy')) {
      try {
        const proxyUrl = `${API_BASE_URL}/api/yt/proxy`;
        
        // Re-map request headers to a plain object
        const headers: Record<string, string> = {};
        if (init?.headers) {
          if (init.headers instanceof Headers) {
            init.headers.forEach((value, key) => {
              headers[key] = value;
            });
          } else if (Array.isArray(init.headers)) {
            init.headers.forEach(([key, value]) => {
              headers[key] = value;
            });
          } else {
            Object.assign(headers, init.headers);
          }
        }

        // Extract body if present
        let body: any = null;
        if (init?.body) {
          if (typeof init.body === 'string') {
            body = init.body;
          } else if (init.body instanceof URLSearchParams) {
            body = init.body.toString();
          } else {
            body = init.body;
          }
        }

        const response = await originalFetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: urlStr,
            method: init?.method || 'GET',
            headers: headers,
            body: body,
          }),
        });

        return response;
      } catch (proxyErr) {
        console.error('Global CORS proxy fetch failed for:', urlStr, proxyErr);
      }
    }

    return originalFetch(input, init);
  };
}

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
