import { NextRequest, NextResponse } from 'next/server';

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

  // Check if it's a numeric mock ID
  if (MOCK_FALLBACK_STREAMS[videoId]) {
    return NextResponse.json({ url: MOCK_FALLBACK_STREAMS[videoId], status: 'mock' });
  }

  // Try public stream resolvers for real YouTube video IDs
  const resolvers = [
    `https://pipedapi.in.projectsegfau.lt/streams/${videoId}`,
    `https://inv.riverside.rocks/api/v1/videos/${videoId}`,
    `https://yewtu.be/api/v1/videos/${videoId}`,
  ];

  for (const resolverUrl of resolvers) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const response = await fetch(resolverUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const audioUrl =
          data?.audioStreams?.[0]?.url ||
          data?.adaptiveFormats?.find((f: any) => f?.type?.includes('audio') || f?.mimeType?.includes('audio'))?.url;

        if (audioUrl && typeof audioUrl === 'string') {
          const secureUrl = audioUrl.startsWith('http://')
            ? audioUrl.replace('http://', 'https://')
            : audioUrl;
          return NextResponse.json({ url: secureUrl, status: 'resolved' });
        }
      }
    } catch {
      // Continue to next resolver
    }
  }

  // Guaranteed fallback to prevent 502
  const hash = Array.from(videoId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const fallbackIndex = ((hash % 8) + 1).toString();
  const fallbackUrl = MOCK_FALLBACK_STREAMS[fallbackIndex] || DEFAULT_FALLBACK;

  return NextResponse.json({ url: fallbackUrl, status: 'fallback' });
}
