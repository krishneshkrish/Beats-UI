import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { song_id, mood_tag, timestamp, session_id } = body;
    // Simulating console logging or saving to a database
    console.log(`[Log Play] Song: ${song_id}, Mood: ${mood_tag}, Session: ${session_id}, Time: ${timestamp}`);
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
