import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';
import { RoadTender } from './tenderMatcher';

const TENDERS_FILE = path.join(process.cwd(), 'data', 'tenders.json');
export const DEFAULT_ETENDER_URL = 'https://etender.up.nic.in/nicgep/app?component=%24DirectLink&page=FrontEndTendersByOrganisation&service=direct&sp=S4fOW%2By4lfko37f6uDHrBBw%3D%3D';

const DISTRICT_COORDINATES: Record<string, { lat: number; lng: number; area: string }> = {
  lucknow: { lat: 26.8467, lng: 80.9462, area: 'Lucknow Central / PWD Central Zone' },
  raebareli: { lat: 26.2236, lng: 81.2400, area: 'Raebareli District Road Network' },
  unchahar: { lat: 25.9250, lng: 81.3150, area: 'Unchahar, Raebareli' },
  kanpur: { lat: 26.4499, lng: 80.3319, area: 'Kanpur Road Zone' },
  ayodhya: { lat: 26.7922, lng: 82.1998, area: 'Ayodhya Division Road Corridor' },
  varanasi: { lat: 25.3176, lng: 82.9739, area: 'Varanasi Zone' },
  prayagraj: { lat: 25.4358, lng: 81.8463, area: 'Prayagraj Zone' },
  bareilly: { lat: 28.3670, lng: 79.4304, area: 'Bareilly Zone' },
  gorakhpur: { lat: 26.7606, lng: 83.3732, area: 'Gorakhpur Zone' },
};

function parseDateToISO(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') return new Date().toISOString();
  try {
    const d = new Date(dateStr.trim());
    if (!isNaN(d.getTime())) return d.toISOString();
  } catch {}
  return dateStr.trim();
}

function extractLocationFromTitle(title: string, org: string) {
  const lower = `${title} ${org}`.toLowerCase();
  for (const [key, coords] of Object.entries(DISTRICT_COORDINATES)) {
    if (lower.includes(key)) {
      return {
        area_name: coords.area,
        latitude: Number((coords.lat + (Math.random() - 0.5) * 0.015).toFixed(6)),
        longitude: Number((coords.lng + (Math.random() - 0.5) * 0.015).toFixed(6)),
        coverage_radius_meters: 1200,
        route_waypoints: [
          { lat: Number((coords.lat - 0.003).toFixed(6)), lng: Number((coords.lng - 0.003).toFixed(6)) },
          { lat: Number(coords.lat.toFixed(6)), lng: Number(coords.lng.toFixed(6)) },
          { lat: Number((coords.lat + 0.003).toFixed(6)), lng: Number((coords.lng + 0.003).toFixed(6)) },
        ],
      };
    }
  }
  return {
    area_name: 'Central Zone Highway Corridor, UP',
    latitude: Number((26.8467 + (Math.random() - 0.5) * 0.02).toFixed(6)),
    longitude: Number((80.9462 + (Math.random() - 0.5) * 0.02).toFixed(6)),
    coverage_radius_meters: 1000,
    route_waypoints: [
      { lat: 26.8437, lng: 80.9432 },
      { lat: 26.8467, lng: 80.9462 },
      { lat: 26.8497, lng: 80.9492 },
    ],
  };
}

function inferRoadType(title: string): string {
  const lower = title.toLowerCase();
  if (lower.includes('bridge') || lower.includes('pantoon') || lower.includes('pontoon')) return 'Bridge / Pontoon Approach Road';
  if (lower.includes('boat') || lower.includes('barz') || lower.includes('ghat')) return 'River Transit & Ghat Approach';
  if (lower.includes('interlocking') || lower.includes('service road')) return 'Urban Arterial / Service Road';
  if (lower.includes('marg') || lower.includes('road') || lower.includes('sadak')) return 'Major District Road (MDR)';
  return 'State Road Infrastructure';
}

function inferBudget(title: string): number {
  const lower = title.toLowerCase();
  if (lower.includes('bridge') || lower.includes('pantoon')) return 3500000;
  if (lower.includes('boat') || lower.includes('barz')) return 1800000;
  if (lower.includes('interlocking')) return 2400000;
  return 4200000;
}

export async function crawlETenders(targetUrl: string = DEFAULT_ETENDER_URL) {
  const response = await fetch(targetUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Referer': 'https://etender.up.nic.in/nicgep/app',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl}: HTTP ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const tenderRows = $('table.list_table tr.even, table.list_table tr.odd');
  const crawledTenders: RoadTender[] = [];

  tenderRows.each((idx, row) => {
    const cols = $(row).find('td');
    if (cols.length < 5) return;

    const sNo = parseInt($(cols[0]).text().trim(), 10) || idx + 1;
    const ePublishedDateRaw = $(cols[1]).text().trim();
    const closingDateRaw = $(cols[2]).text().trim();
    const openingDateRaw = $(cols[3]).text().trim();

    const titleCol = $(cols[4]);
    const fullText = titleCol.text().trim();

    let tenderId = '';
    let refNo = '';
    let title = '';

    const tenderIdMatch = fullText.match(/\b(\d{4}_[A-Za-z0-9_]+)\b/);
    if (tenderIdMatch) {
      tenderId = tenderIdMatch[1];
    }

    const titleAnchor = titleCol.find('a').first();
    if (titleAnchor.length > 0) {
      title = titleAnchor.text().trim();
    } else {
      const lines = fullText.split('\n').map((s) => s.trim()).filter(Boolean);
      title = lines[0] || 'Road Infrastructure Maintenance Work';
    }
    title = title.replace(/^\[|\]$/g, '').trim();

    const refMatch = fullText.match(/(\d+[\/\w\.-]+\d{2,4}-\d{2,4}[^\n\r\]]*)/i) || fullText.match(/Ref(?:erence)?\.?\s*No\.?\s*:\s*([^\n\r\]]+)/i);
    if (refMatch) {
      refNo = refMatch[1].trim();
    } else {
      refNo = `Ref/${tenderId || sNo}`;
    }

    const orgChain = cols.length >= 6 ? $(cols[5]).text().trim().replace(/\s+/g, ' ') : 'UP Public Works Department (PWD)';

    if (!tenderId) {
      tenderId = `2026_UPPWD_${Date.now()}_${sNo}`;
    }

    crawledTenders.push({
      s_no: sNo,
      e_published_date: parseDateToISO(ePublishedDateRaw),
      closing_date: parseDateToISO(closingDateRaw),
      opening_date: parseDateToISO(openingDateRaw),
      title: title,
      reference_number: refNo,
      tender_id: tenderId,
      organisation: orgChain,
      contractor_name: 'PWD Central Zone Empanelled Contractor',
      budget_inr: inferBudget(title),
      status: 'Active Contract',
      road_type: inferRoadType(title),
      geo_location: extractLocationFromTitle(title, orgChain),
    });
  });

  // Safe merge into data/tenders.json
  let existingData: { road_tenders: RoadTender[] } = { road_tenders: [] };
  if (fs.existsSync(TENDERS_FILE)) {
    try {
      const raw = fs.readFileSync(TENDERS_FILE, 'utf-8');
      existingData = JSON.parse(raw);
    } catch (e) {
      console.warn('Error reading existing tenders.json', e);
    }
  }

  const existingMap = new Map<string, RoadTender>();
  existingData.road_tenders.forEach((t) => {
    existingMap.set(t.tender_id, t);
  });

  let addedCount = 0;
  let updatedCount = 0;

  for (const t of crawledTenders) {
    if (existingMap.has(t.tender_id)) {
      const current = existingMap.get(t.tender_id)!;
      existingMap.set(t.tender_id, {
        ...t,
        contractor_name: current.contractor_name || t.contractor_name,
        budget_inr: current.budget_inr || t.budget_inr,
        geo_location: current.geo_location || t.geo_location,
        status: current.status || t.status,
      });
      updatedCount++;
    } else {
      existingMap.set(t.tender_id, t);
      addedCount++;
    }
  }

  const mergedList = Array.from(existingMap.values());
  existingData.road_tenders = mergedList;
  fs.writeFileSync(TENDERS_FILE, JSON.stringify(existingData, null, 2), 'utf-8');

  return {
    success: true,
    total: mergedList.length,
    added: addedCount,
    updated: updatedCount,
    crawled_count: crawledTenders.length,
    crawled: crawledTenders,
  };
}
