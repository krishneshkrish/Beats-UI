import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { song_id, mood_tag, timestamp, session_id, username, title, artist, album, artwork, duration, url } = body;
    console.log(`[Mock Log Play] User: ${username}, Song: ${song_id} (${title} - ${artist}), Album: ${album}, Duration: ${duration}s, Mood: ${mood_tag}, Session: ${session_id}, Time: ${timestamp}`);
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
