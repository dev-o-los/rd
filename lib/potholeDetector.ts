export interface DetectedPothole {
  id: string;
  box: [number, number, number, number]; // [ymin, xmin, ymax, xmax] percentages (0-100)
  confidence: number; // percentage, e.g. 95.4
  estimatedDepthCm: number;
  estimatedWidthCm: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  distressType: string;
}

export interface PavementDiagnostics {
  potholeCount: number;
  pciScore: number; // 0-100 Pavement Condition Index (ASTM D6433)
  pciRating: 'Good' | 'Fair' | 'Poor' | 'Very Poor' | 'Serious' | 'Failed';
  surfaceDistressPercentage: number;
  primaryDistressType: string;
  detectedPotholes: DetectedPothole[];
  damageRisk: string;
  estimatedAsphaltRepairVolumeM3: number;
}

export interface GeocodedLocation {
  roadName: string;
  locality: string;
  subArea: string;
  ward: string;
  city: string;
  state: string;
  pincode: string;
  geohash: string;
  formattedAddress: string;
}

/**
 * Generate a short geohash for coordinates
 */
export function generateSimpleGeohash(lat: number, lng: number): string {
  const chars = '0123456789bcdefghjkmnpqrstuvwxyz';
  let hash = '';
  let minLat = -90, maxLat = 90;
  let minLng = -180, maxLng = 180;
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (hash.length < 8) {
    if (isEven) {
      const mid = (minLng + maxLng) / 2;
      if (lng > mid) {
        ch |= 1 << (4 - bit);
        minLng = mid;
      } else {
        maxLng = mid;
      }
    } else {
      const mid = (minLat + maxLat) / 2;
      if (lat > mid) {
        ch |= 1 << (4 - bit);
        minLat = mid;
      } else {
        maxLat = mid;
      }
    }

    isEven = !isEven;
    if (bit < 4) {
      bit++;
    } else {
      hash += chars[ch];
      bit = 0;
      ch = 0;
    }
  }

  return hash;
}

/**
 * Reverse geocodes coordinates to Lucknow street names & wards
 */
export function reverseGeocodeLocation(lat: number, lng: number): GeocodedLocation {
  const geohash = generateSimpleGeohash(lat, lng);

  // High precision spatial matching for known Lucknow zones
  if (Math.abs(lat - 26.8468) < 0.02 && Math.abs(lng - 81.0105) < 0.02) {
    return {
      roadName: 'Shaheed Path Service Road (Sector-1 to RITES Bhawan)',
      locality: 'Gomti Nagar Vistar',
      subArea: 'Sector-1 near Thana Chauraha',
      ward: 'Ward 85 - Gomti Vistar Zone',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226010',
      geohash,
      formattedAddress: 'Shaheed Path Service Road, Sector-1, Gomti Nagar Vistar, Lucknow, UP 226010',
    };
  }

  if (Math.abs(lat - 26.7768) < 0.02 && Math.abs(lng - 80.8845) < 0.02) {
    return {
      roadName: 'Kanpur Road Highway Service Lane',
      locality: 'Kanpur Road Yojna',
      subArea: 'Opposite Mragshira Apartment',
      ward: 'Ward 42 - Sarojini Nagar',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226012',
      geohash,
      formattedAddress: 'Kanpur Road Highway Service Lane, Near Mragshira Apts, Lucknow, UP 226012',
    };
  }

  if (Math.abs(lat - 26.8732) < 0.02 && Math.abs(lng - 80.8922) < 0.02) {
    return {
      roadName: 'Hardoi Road Main Arterial Stretch',
      locality: 'Mallahi Tola I',
      subArea: 'Ward 85 Approach Road',
      ward: 'Ward 85 - Hardoi Bypass',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226003',
      geohash,
      formattedAddress: 'Hardoi Road, Mallahi Tola I, Ward 85, Lucknow, UP 226003',
    };
  }

  if (Math.abs(lat - 26.7892) < 0.02 && Math.abs(lng - 80.8462) < 0.02) {
    return {
      roadName: 'Mohan Road (Nadarganj to TS Mishra Bridge)',
      locality: 'Nadarganj Industrial Area',
      subArea: 'TS Mishra Bridge Crossway',
      ward: 'Ward 19 - Amausi Zone',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226008',
      geohash,
      formattedAddress: 'Mohan Road, Near TS Mishra Bridge, Nadarganj, Lucknow, UP 226008',
    };
  }

  if (Math.abs(lat - 26.8892) < 0.02 && Math.abs(lng - 81.0562) < 0.02) {
    return {
      roadName: 'Chinhat Nandi Vihar Connecting Road',
      locality: 'Chinhat Industrial Belt',
      subArea: 'Nandi Vihar Colony Main Gate',
      ward: 'Ward 64 - Chinhat',
      city: 'Lucknow',
      state: 'Uttar Pradesh',
      pincode: '226028',
      geohash,
      formattedAddress: 'Nandi Vihar Connecting Road, Chinhat, Lucknow, UP 226028',
    };
  }

  // General Lucknow fallback
  return {
    roadName: `Road Segment at ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`,
    locality: 'Lucknow Urban Municipal Limits',
    subArea: 'Municipal Road Corridor',
    ward: 'Municipal Zone Area',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226001',
    geohash,
    formattedAddress: `Road Location (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E), Lucknow, Uttar Pradesh`,
  };
}

/**
 * Computer Vision Pothole & Surface Distress Diagnostics Engine
 * Simulates deep CV neural network analysis (YOLOv8-Pothole / Mask-RCNN style inference)
 */
export function analyzePotholesAndSurface(
  lat: number,
  lng: number,
  customDepth?: number,
  customWidth?: number
): PavementDiagnostics {
  // Deterministic seed based on location coordinates for consistent analysis on re-scans
  const seed = Math.abs(Math.sin(lat * 1000 + lng * 500));
  
  const estimatedDepth = customDepth || Math.round((7 + seed * 9) * 10) / 10; // 7.0 to 16.0 cm
  const estimatedWidth = customWidth || Math.round((35 + seed * 45) * 10) / 10; // 35 to 80 cm

  // Determine severity
  let severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (estimatedDepth >= 12 || estimatedWidth >= 60) {
    severity = 'CRITICAL';
  } else if (estimatedDepth >= 9 || estimatedWidth >= 45) {
    severity = 'HIGH';
  } else if (estimatedDepth >= 5) {
    severity = 'MEDIUM';
  } else {
    severity = 'LOW';
  }

  // Detect 1 to 3 potholes based on seed
  const potholeCount = seed > 0.6 ? 2 : (seed > 0.85 ? 3 : 1);
  const detectedPotholes: DetectedPothole[] = [];

  // Primary pothole (center/lower third of road perspective)
  detectedPotholes.push({
    id: 'DEF-01',
    box: [46, 26, 76, 68], // [ymin, xmin, ymax, xmax]
    confidence: Math.round((93.5 + seed * 5.5) * 10) / 10, // 93.5% - 99.0%
    estimatedDepthCm: estimatedDepth,
    estimatedWidthCm: estimatedWidth,
    severity,
    distressType: estimatedDepth > 10 ? 'Deep Impact Crater' : 'Surface Layer Cavity',
  });

  if (potholeCount >= 2) {
    const depth2 = Math.round((estimatedDepth * 0.72) * 10) / 10;
    const width2 = Math.round((estimatedWidth * 0.65) * 10) / 10;
    detectedPotholes.push({
      id: 'DEF-02',
      box: [28, 56, 48, 82],
      confidence: Math.round((88.0 + seed * 8.0) * 10) / 10,
      estimatedDepthCm: depth2,
      estimatedWidthCm: width2,
      severity: depth2 >= 9 ? 'HIGH' : 'MEDIUM',
      distressType: 'Secondary Spalling / Edge Ravelling',
    });
  }

  if (potholeCount >= 3) {
    detectedPotholes.push({
      id: 'DEF-03',
      box: [62, 10, 82, 32],
      confidence: Math.round((84.5 + seed * 9.0) * 10) / 10,
      estimatedDepthCm: 5.4,
      estimatedWidthCm: 28.0,
      severity: 'LOW',
      distressType: 'Longitudinal Asphalt Fatigue Crack',
    });
  }

  // Pavement Condition Index (PCI) calculation (ASTM D6433)
  // 100 = Perfect, 0 = Completely Destroyed
  const deductPoints = (estimatedDepth * 2.8) + (estimatedWidth * 0.45) + (potholeCount * 8);
  const pciScore = Math.max(15, Math.min(85, Math.round(100 - deductPoints)));

  let pciRating: 'Good' | 'Fair' | 'Poor' | 'Very Poor' | 'Serious' | 'Failed' = 'Poor';
  if (pciScore < 25) pciRating = 'Failed';
  else if (pciScore < 40) pciRating = 'Serious';
  else if (pciScore < 55) pciRating = 'Very Poor';
  else if (pciScore < 70) pciRating = 'Poor';
  else if (pciScore < 85) pciRating = 'Fair';
  else pciRating = 'Good';

  const surfaceDistressPercentage = Math.round((8.5 + (deductPoints * 0.28)) * 10) / 10;
  const estimatedVolumeM3 = Math.round(((Math.PI * Math.pow(estimatedWidth / 200, 2) * (estimatedDepth / 100)) * potholeCount) * 1000) / 1000;

  const damageRisk = severity === 'CRITICAL'
    ? 'Extreme - Tire blowout, motorcycle wheel entrapment, rim cracking risk at normal speed'
    : severity === 'HIGH'
    ? 'High - Severe suspension jolt, vehicle alignment loss, water accumulation hazard'
    : 'Moderate - Driving discomfort, progressive road base deterioration';

  return {
    potholeCount,
    pciScore,
    pciRating,
    surfaceDistressPercentage,
    primaryDistressType: detectedPotholes[0].distressType,
    detectedPotholes,
    damageRisk,
    estimatedAsphaltRepairVolumeM3: estimatedVolumeM3 || 0.045,
  };
}
