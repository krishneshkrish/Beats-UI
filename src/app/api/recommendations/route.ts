import { NextRequest, NextResponse } from 'next/server';
import { MOCK_SONGS, MOOD_SONG_MAP } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mood = searchParams.get('mood');
  const limitStr = searchParams.get('limit');
  const limit = limitStr ? parseInt(limitStr, 10) : 10;

  if (mood && MOOD_SONG_MAP[mood]) {
    const songIds = MOOD_SONG_MAP[mood];
    const filteredSongs = MOCK_SONGS.filter(song => songIds.includes(song.id));
    
    // Fallback if mood has too few songs
    if (filteredSongs.length > 0) {
      return NextResponse.json(filteredSongs.slice(0, limit));
    }
  }

  return NextResponse.json(MOCK_SONGS.slice(0, limit));
}
