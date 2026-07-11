import { NextResponse } from 'next/server';
import { MOCK_SONGS } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(MOCK_SONGS);
}
