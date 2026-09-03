import { NextResponse } from 'next/server';
import { getAllReports } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reports = getAllReports();
  return NextResponse.json({
    total: reports.length,
    reports,
  });
}
