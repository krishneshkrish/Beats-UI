import { Innertube } from 'youtubei.js';
import { refreshStreamUrl, API_BASE_URL } from './api';

let ytInstance: any = null;

async function getInnertubeInstance() {
  if (typeof window === 'undefined') {
    throw new Error('Innertube can only be initialized client-side in the browser');
  }

  if (!ytInstance) {
    ytInstance = await Innertube.create({
      fetch: async (input, init) => {
        let urlStr = '';
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof Request) {
          urlStr = input.url;
        }

        // Check if we are running in a browser environment (subject to CORS)
        // and NOT running in a Capacitor native context (which allows direct fetch)
        const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;
        const isBrowser = typeof window !== 'undefined' && !isCapacitor;

        if (isBrowser) {
          try {
            // Forward InnerTube and YouTube requests through the backend CORS proxy
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

            const response = await fetch(proxyUrl, {
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
            console.error('CORS proxy fetch failed:', proxyErr);
          }
        }

        // Fallback to direct fetch (useful for Capacitor or local environments without backend)
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
