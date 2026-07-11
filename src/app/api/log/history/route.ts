import { NextResponse } from 'next/server';
import { MOCK_SONGS } from '@/lib/mockData';

export async function GET() {
  // Return a subset of songs as history
  const history = [
    MOCK_SONGS[5], // Rainy Cafe
    MOCK_SONGS[0], // Neon Horizons
    MOCK_SONGS[2], // Solar Wind
  ];

  return NextResponse.json(history);
}
