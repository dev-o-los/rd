export interface Waypoint {
  lat: number;
  lng: number;
}

export interface RoadTender {
  s_no: number;
  e_published_date: string;
  closing_date: string;
  opening_date: string;
  title: string;
  reference_number: string;
  tender_id: string;
  organisation: string;
  contractor_name: string;
  budget_inr: number;
  status: string;
  road_type: string;
  complaint_count?: number;
  is_escalated?: boolean;
  geo_location: {
    area_name: string;
    latitude: number;
    longitude: number;
    coverage_radius_meters: number;
    route_waypoints?: Waypoint[];
  };
}

export interface MatchResult {
  matched: boolean;
  confidenceScore: number; // 0 to 100
  distanceMeters: number;
  matchedTender: RoadTender | null;
  nearbyTenders: Array<{
    tender: RoadTender;
    distanceMeters: number;
  }>;
  matchReason: string;
  dataSource?: 'DATABASE' | 'ETENDER_CRAWLER';
}

/**
 * Calculates Haversine distance between two coordinates in meters.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates minimum distance from a point to a line segment in meters.
 */
export function pointToSegmentDistance(
  pLat: number,
  pLng: number,
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const d1 = haversineDistance(pLat, pLng, aLat, aLng);
  const d2 = haversineDistance(pLat, pLng, bLat, bLng);
  const dAB = haversineDistance(aLat, aLng, bLat, bLng);

  if (dAB === 0) return d1;

  const x = (pLng - aLng) * Math.cos(((aLat + pLat) / 2) * (Math.PI / 180));
  const y = pLat - aLat;
  const dx = (bLng - aLng) * Math.cos(((aLat + bLat) / 2) * (Math.PI / 180));
  const dy = bLat - aLat;

  const t = Math.max(0, Math.min(1, (x * dx + y * dy) / (dx * dx + dy * dy)));
  const projLat = aLat + t * (bLat - aLat);
  const projLng = aLng + t * (bLng - aLng);

  return haversineDistance(pLat, pLng, projLat, projLng);
}

/**
 * Finds distance between a point and a road tender's geometric features (center point + route waypoints).
 */
export function calculateTenderDistance(pLat: number, pLng: number, tender: RoadTender): number {
  let minDistance = haversineDistance(pLat, pLng, tender.geo_location.latitude, tender.geo_location.longitude);

  const waypoints = tender.geo_location.route_waypoints;
  if (waypoints && waypoints.length >= 2) {
    for (let i = 0; i < waypoints.length - 1; i++) {
      const segDist = pointToSegmentDistance(
        pLat,
        pLng,
        waypoints[i].lat,
        waypoints[i].lng,
        waypoints[i + 1].lat,
        waypoints[i + 1].lng
      );
      if (segDist < minDistance) {
        minDistance = segDist;
      }
    }
  }

  return minDistance;
}

/**
 * Matches a defect location (lat, lng) against the list of road tenders.
 */
export function matchPotholeToTender(
  pLat: number,
  pLng: number,
  tenders: RoadTender[],
  maxSearchRadiusMeters = 5000
): MatchResult {
  if (!tenders || tenders.length === 0) {
    return {
      matched: false,
      confidenceScore: 0,
      distanceMeters: Infinity,
      matchedTender: null,
      nearbyTenders: [],
      matchReason: "No road tenders database loaded.",
    };
  }

  const scoredTenders = tenders
    .map((tender) => {
      const dist = calculateTenderDistance(pLat, pLng, tender);
      return { tender, distanceMeters: Math.round(dist) };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  const bestMatch = scoredTenders[0];

  if (!bestMatch || bestMatch.distanceMeters > maxSearchRadiusMeters) {
    return {
      matched: false,
      confidenceScore: 0,
      distanceMeters: bestMatch ? bestMatch.distanceMeters : Infinity,
      matchedTender: null,
      nearbyTenders: scoredTenders.slice(0, 3),
      matchReason: `No road tender contract found within ${maxSearchRadiusMeters / 1000}km of this location.`,
    };
  }

  const maxRadius = bestMatch.tender.geo_location.coverage_radius_meters || 1000;
  let confidenceScore = 100;

  if (bestMatch.distanceMeters <= maxRadius / 2) {
    confidenceScore = 98;
  } else if (bestMatch.distanceMeters <= maxRadius) {
    confidenceScore = 88;
  } else if (bestMatch.distanceMeters <= maxRadius * 1.5) {
    confidenceScore = 72;
  } else {
    confidenceScore = Math.max(25, Math.round(100 - (bestMatch.distanceMeters / maxSearchRadiusMeters) * 100));
  }

  return {
    matched: true,
    confidenceScore,
    distanceMeters: bestMatch.distanceMeters,
    matchedTender: bestMatch.tender,
    nearbyTenders: scoredTenders.slice(1, 4),
    matchReason: `Matched with ${bestMatch.tender.organisation} tender contract '${bestMatch.tender.tender_id}' located ${bestMatch.distanceMeters}m away (${bestMatch.tender.geo_location.area_name}).`,
  };
}
