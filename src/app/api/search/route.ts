import { NextRequest, NextResponse } from 'next/server';
import { SEARCH_CATALOG } from '@/lib/mockData';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  if (!q) {
    return NextResponse.json(SEARCH_CATALOG);
  }

  const filteredSongs = SEARCH_CATALOG.songs.filter(
    song =>
      song.title.toLowerCase().includes(q) ||
      song.artist.toLowerCase().includes(q) ||
      song.album.toLowerCase().includes(q)
  );

  const filteredArtists = SEARCH_CATALOG.artists.filter(artist =>
    artist.toLowerCase().includes(q)
  );

  const filteredAlbums = SEARCH_CATALOG.albums.filter(album =>
    album.toLowerCase().includes(q)
  );

  const filteredPlaylists = SEARCH_CATALOG.playlists.filter(playlist =>
    playlist.name.toLowerCase().includes(q)
  );

  return NextResponse.json({
    songs: filteredSongs,
    artists: filteredArtists,
    albums: filteredAlbums,
    playlists: filteredPlaylists,
  });
}
