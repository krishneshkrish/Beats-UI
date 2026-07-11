import { NextResponse } from 'next/server';
import { MOCK_SONGS } from '@/lib/mockData';

export async function GET() {
  // AI recommendations (e.g. tracks 3, 6, 8)
  const aiPicks = [MOCK_SONGS[2], MOCK_SONGS[5], MOCK_SONGS[7]];
  return NextResponse.json(aiPicks);
}
