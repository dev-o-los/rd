import { NextRequest, NextResponse } from 'next/server';
import { registerComplaint, getEscalatedTenders, COMPLAINT_THRESHOLD } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenderId, latitude, longitude, citizenRemark } = body;

    if (!tenderId) {
      return NextResponse.json({ error: 'Tender ID is required to register a complaint' }, { status: 400 });
    }

    const result = registerComplaint(
      tenderId,
      latitude ? parseFloat(latitude) : 26.8468,
      longitude ? parseFloat(longitude) : 81.0105,
      citizenRemark || 'Pothole complaint registered by citizen.'
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to register complaint', message: error.message || String(error) },
      { status: 500 }
    );
  }
}

export async function GET() {
  const escalatedTenders = getEscalatedTenders();
  return NextResponse.json({
    threshold: COMPLAINT_THRESHOLD,
    totalTracked: escalatedTenders.length,
    escalatedTenders,
  });
}
