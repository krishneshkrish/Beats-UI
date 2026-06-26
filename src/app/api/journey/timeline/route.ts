import { NextResponse } from 'next/server';
import { MOCK_JOURNEY } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(MOCK_JOURNEY);
}
