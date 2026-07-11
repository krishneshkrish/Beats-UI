import { NextResponse } from 'next/server';
import { SEARCH_CATALOG } from '@/lib/mockData';

export async function GET() {
  return NextResponse.json(SEARCH_CATALOG);
}
