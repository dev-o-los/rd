import { NextResponse } from 'next/server';
import { getAllReports } from '@/lib/db';

export async function GET() {
  const reports = getAllReports();
  return NextResponse.json({
    total: reports.length,
    reports,
  });
}
