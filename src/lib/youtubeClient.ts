import { Innertube } from 'youtubei.js';

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
    console.error(`Error resolving client-side audio stream for ${videoId}:`, error);
    throw error;
  }
}
