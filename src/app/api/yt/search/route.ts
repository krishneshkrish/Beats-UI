import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';
import { SEARCH_CATALOG } from '@/lib/mockData';

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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  if (!q.trim()) {
    return NextResponse.json(SEARCH_CATALOG.songs);
  }

  try {
    const yt = await getInnertube();
    const searchResult = await yt.search(q);
    const videos = (searchResult.videos || []).slice(0, limit);

    if (videos.length > 0) {
      const songs = videos.map((v: any) => {
        const videoId = v.id || '';
        const title = typeof v.title === 'string' ? v.title : (v.title?.text || 'Unknown Title');
        const artist = typeof v.author === 'string' ? v.author : (v.author?.name || 'YouTube Artist');
        const duration = v.duration?.seconds || 180;
        const artwork = v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title,
          artist,
          album: 'YouTube Music',
          artwork,
          duration,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });

      return NextResponse.json(songs);
    }
  } catch (err) {
    console.warn('[api/yt/search] YouTube search failed, using fallback catalog:', err);
  }

  // Fallback catalog search
  const lowerQ = q.toLowerCase();
  const filtered = SEARCH_CATALOG.songs.filter(
    (s) => s.title.toLowerCase().includes(lowerQ) || s.artist.toLowerCase().includes(lowerQ)
  );

  return NextResponse.json(filtered.length > 0 ? filtered : SEARCH_CATALOG.songs);
}
