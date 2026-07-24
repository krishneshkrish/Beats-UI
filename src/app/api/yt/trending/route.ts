import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';
import { MOCK_SONGS, MOOD_SONG_MAP } from '@/lib/mockData';

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
  const mood = searchParams.get('mood') || 'Chill';

  try {
    const yt = await getInnertube();
    const query = `${mood} music lofi beats`;
    const searchResult = await yt.search(query);
    const videos = (searchResult.videos || []).slice(0, 8);

    if (videos.length > 0) {
      const songs = videos.map((v: any) => {
        const videoId = v.id || '';
        const title = typeof v.title === 'string' ? v.title : (v.title?.text || `${mood} Vibe`);
        const artist = typeof v.author === 'string' ? v.author : (v.author?.name || 'YouTube Artist');
        const duration = v.duration?.seconds || 240;
        const artwork = v.thumbnails?.[0]?.url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        return {
          id: videoId,
          title,
          artist,
          album: `${mood} Collection`,
          artwork,
          duration,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        };
      });

      return NextResponse.json(songs);
    }
  } catch (err) {
    console.warn('[api/yt/trending] Trending search failed, using fallback songs:', err);
  }

  // Fallback to mood song map
  const songIds = MOOD_SONG_MAP[mood] || MOOD_SONG_MAP['Chill'];
  const matchedSongs = MOCK_SONGS.filter((s) => songIds.includes(s.id));

  return NextResponse.json(matchedSongs.length > 0 ? matchedSongs : MOCK_SONGS);
}
