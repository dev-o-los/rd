import { NextRequest, NextResponse } from 'next/server';
import { getAllTenders, saveTender } from '@/lib/db';
import { RoadTender } from '@/lib/tenderMatcher';

export const dynamic = 'force-dynamic';

export async function GET() {
  const tenders = getAllTenders();
  return NextResponse.json({
    total: tenders.length,
    road_tenders: tenders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.road_tenders && Array.isArray(body.road_tenders)) {
      const added: RoadTender[] = [];
      for (const t of body.road_tenders) {
        added.push(saveTender(t));
      }
      return NextResponse.json({
        success: true,
        message: `Successfully imported ${added.length} tenders`,
        tenders: added,
      });
    } else if (body.tender_id && body.title) {
      const saved = saveTender(body as RoadTender);
      return NextResponse.json({
        success: true,
        tender: saved,
      });
    } else {
      return NextResponse.json({ error: 'Invalid payload schema. Expected tender object or road_tenders array.' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to save tender', details: error.message }, { status: 500 });
  }
}
