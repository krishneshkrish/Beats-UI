import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

let ytPromise: Promise<Innertube> | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!ytPromise) {
    ytPromise = Innertube.create({
      fetch: (input, init) => {
        const reqHeaders = new Headers(init?.headers);
        if (!reqHeaders.has('User-Agent')) {
          reqHeaders.set(
            'User-Agent',
            'com.google.ios.youtube/19.09.3 (iPhone; CPU iPhone OS 17_4 like Mac OS X; en_US)'
          );
        }
        reqHeaders.set('Origin', 'https://www.youtube.com');
        reqHeaders.set('Referer', 'https://www.youtube.com/');
        return fetch(input, { ...init, headers: reqHeaders });
      },
    }).catch((err) => {
      ytPromise = null;
      throw err;
    });
  }
  return ytPromise;
}

const MOCK_FALLBACK_STREAMS: Record<string, string> = {
  '1': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  '2': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  '3': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
  '4': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
  '5': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
  '6': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
  '7': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
  '8': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
};

const DEFAULT_FALLBACK = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';

async function resolveStreamUrl(videoId: string): Promise<{ status: string; url: string }> {
  if (!videoId) return { status: 'fallback', url: DEFAULT_FALLBACK };

  // Direct HTTP/HTTPS audio URL check
  if (videoId.startsWith('http://') || videoId.startsWith('https://')) {
    return { status: 'success', url: videoId };
  }

  // Handle numeric mock IDs
  if (MOCK_FALLBACK_STREAMS[videoId]) {
    return { status: 'success', url: MOCK_FALLBACK_STREAMS[videoId] };
  }

  // 1. Primary Extractor: InnerTube server-side with client 'IOS' or 'MWEB'
  try {
    const yt = await getInnertube();
    const clients = ['IOS', 'MWEB', 'ANDROID'];

    for (const clientName of clients) {
      try {
        const playerRes = await yt.actions.execute('/player', {
          videoId,
          client: clientName,
          parse: false,
        });

        const data = playerRes?.data;
        const formats =
          data?.streamingData?.adaptiveFormats || data?.streamingData?.formats || [];

        const audioFormats = formats.filter(
          (f: any) => f?.mimeType?.includes('audio') && f?.url
        );

        if (audioFormats.length > 0) {
          // Format 140 (audio/mp4 M4A) is ideal for iOS Safari WebKit background audio
          const m4aFormat =
            audioFormats.find(
              (f: any) => f.itag === 140 || f.mimeType?.includes('audio/mp4')
            ) || audioFormats[0];

          if (m4aFormat?.url && typeof m4aFormat.url === 'string') {
            const secureUrl = m4aFormat.url.startsWith('http://')
              ? m4aFormat.url.replace('http://', 'https://')
              : m4aFormat.url;
            return { status: 'success', url: secureUrl };
          }
        }
      } catch (clientErr) {
        console.warn(`[api/stream] Innertube ${clientName} extraction failed for ${videoId}:`, clientErr);
      }
    }
  } catch (err) {
    console.error(`[api/stream] Innertube extraction error for ${videoId}:`, err);
  }

  // 2. Fallback Guard: Query FastAPI backend if FASTAPI_URL environment variable is set
  if (process.env.FASTAPI_URL) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const fastApiRes = await fetch(`${process.env.FASTAPI_URL}/api/yt/stream?video_id=${encodeURIComponent(videoId)}`, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (fastApiRes.ok) {
        const data = await fastApiRes.json();
        const backendUrl = data?.url || data?.stream_url || data?.data?.url;
        if (backendUrl && typeof backendUrl === 'string' && !backendUrl.includes('soundhelix.com')) {
          const secureUrl = backendUrl.startsWith('http://')
            ? backendUrl.replace('http://', 'https://')
            : backendUrl;
          return { status: 'success', url: secureUrl };
        }
      }
    } catch (fastApiErr) {
      console.warn(`[api/stream] FastAPI backend fallback failed for ${videoId}:`, fastApiErr);
    }
  }

  // 3. Secondary Fallback: Public Piped resolvers
  const resolvers = [
    `https://pipedapi.palvelu.org/streams/${videoId}`,
    `https://pipedapi.mha.fi/streams/${videoId}`,
    `https://pipedapi.drgns.space/streams/${videoId}`,
    `https://piped-api.garudalinux.org/streams/${videoId}`,
    `https://pipedapi.lunar.icu/streams/${videoId}`,
    `https://api.piped.yt/streams/${videoId}`,
  ];

  for (const resolverUrl of resolvers) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(resolverUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const audioUrl =
          data?.audioStreams?.[0]?.url ||
          data?.adaptiveFormats?.find(
            (f: any) => f?.type?.includes('audio') || f?.mimeType?.includes('audio')
          )?.url;

        if (audioUrl && typeof audioUrl === 'string') {
          const secureUrl = audioUrl.startsWith('http://')
            ? audioUrl.replace('http://', 'https://')
            : audioUrl;
          return { status: 'success', url: secureUrl };
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  // 4. Ultimate Mock Fallback
  const hash = Array.from(videoId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackIndex = ((hash % 8) + 1).toString();
  const fallbackUrl = MOCK_FALLBACK_STREAMS[fallbackIndex] || DEFAULT_FALLBACK;

  return { status: 'fallback', url: fallbackUrl };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId =
    searchParams.get('videoId') ||
    searchParams.get('video_id') ||
    searchParams.get('id') ||
    '';

  const result = await resolveStreamUrl(videoId);

  const response = NextResponse.json(result);

  response.headers.set(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );

  return response;
}

export async function POST(request: NextRequest) {
  let videoId = '';
  try {
    const body = await request.json();
    videoId = body?.videoId || body?.video_id || body?.id || '';
  } catch {
    const { searchParams } = new URL(request.url);
    videoId = searchParams.get('videoId') || searchParams.get('video_id') || searchParams.get('id') || '';
  }

  const result = await resolveStreamUrl(videoId);

  const response = NextResponse.json(result);

  response.headers.set(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  );

  return response;
}
