import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

let ytPromise: Promise<Innertube> | null = null;

async function getInnertube(): Promise<Innertube> {
  if (!ytPromise) {
    ytPromise = Innertube.create().catch((err) => {
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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get('video_id') || searchParams.get('id') || '';

  if (!videoId) {
    return NextResponse.json({ url: DEFAULT_FALLBACK, status: 'fallback' });
  }

  // Handle numeric mock IDs
  if (MOCK_FALLBACK_STREAMS[videoId]) {
    return NextResponse.json({ url: MOCK_FALLBACK_STREAMS[videoId], status: 'mock' });
  }

  // 1. Primary: Extract unenciphered M4A/AAC stream using Innertube IOS/MWEB client
  try {
    const yt = await getInnertube();
    const clients = ['IOS', 'MWEB'];

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
          // Prefer M4A (audio/mp4) for native iOS Safari & WebKit background playback
          const m4aFormat =
            audioFormats.find((f: any) => f.mimeType.includes('audio/mp4')) || audioFormats[0];

          if (m4aFormat?.url && typeof m4aFormat.url === 'string') {
            const secureUrl = m4aFormat.url.startsWith('http://')
              ? m4aFormat.url.replace('http://', 'https://')
              : m4aFormat.url;

            return NextResponse.json({ url: secureUrl, status: 'resolved' });
          }
        }
      } catch (clientErr) {
        console.warn(`[api/yt/refresh] Client ${clientName} extraction failed for ${videoId}:`, clientErr);
      }
    }
  } catch (err) {
    console.error(`[api/yt/refresh] Primary Innertube extraction error for ${videoId}:`, err);
  }

  // 2. Secondary Fallback: Try public Piped stream proxies
  const resolvers = [
    `https://pipedapi.in.projectsegfau.lt/streams/${videoId}`,
    `https://inv.riverside.rocks/api/v1/videos/${videoId}`,
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
          return NextResponse.json({ url: secureUrl, status: 'resolved' });
        }
      }
    } catch {
      // Ignore fallback error
    }
  }

  // 3. Guaranteed fallback stream to prevent audio player freeze
  const hash = Array.from(videoId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackIndex = ((hash % 8) + 1).toString();
  const fallbackUrl = MOCK_FALLBACK_STREAMS[fallbackIndex] || DEFAULT_FALLBACK;

  return NextResponse.json({ url: fallbackUrl, status: 'fallback' });
}
