import { NextRequest, NextResponse } from 'next/server';
import { crawlETenders, DEFAULT_ETENDER_URL } from '@/lib/crawler';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let targetUrl = DEFAULT_ETENDER_URL;
    try {
      const body = await req.json();
      if (body.url && typeof body.url === 'string') {
        targetUrl = body.url;
      }
    } catch {
      // no json body supplied, use default
    }

    const result = await crawlETenders(targetUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to crawl tenders', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const targetUrl = searchParams.get('url') || DEFAULT_ETENDER_URL;
    const result = await crawlETenders(targetUrl);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to crawl tenders', details: error.message },
      { status: 500 }
    );
  }
}
