/**
 * Road & Pothole Image Recognition Engine
 * Evaluates visual features (color distribution, asphalt achromatic balance,
 * texture edge variance, and cavity distress) to recognize valid road pavement
 * and reject non-road objects (faces, indoor rooms, furniture, screens, animals, etc.)
 */

export interface RoadClassificationResult {
  isRoad: boolean;
  confidence: number; // 0 to 100
  reason?: string;
  metrics: {
    asphaltNeutralScore: number; // 0 to 100
    textureVariance: number; // local edge roughness
    averageLuminance: number; // 0 to 255
    colorSaturation: number; // 0 to 1
    defectPresenceScore: number; // 0 to 100
  };
}

export const INVALID_ROAD_MESSAGE =
  'This is not a recognized image of a road. Please upload the proper image of the road potholes only, so that it can be detected and tenders can be seen';

/**
 * Evaluates RGBA pixel buffer from an HTML5 Canvas or image buffer
 * Expected image size: normalized 256x256 or similar for fast CV analysis
 */
export function classifyRoadImageFromPixels(
  data: Uint8ClampedArray | Uint8Array,
  width: number,
  height: number
): RoadClassificationResult {
  const totalPixels = width * height;
  if (totalPixels === 0) {
    return {
      isRoad: false,
      confidence: 0,
      reason: 'Empty image buffer',
      metrics: {
        asphaltNeutralScore: 0,
        textureVariance: 0,
        averageLuminance: 0,
        colorSaturation: 0,
        defectPresenceScore: 0,
      },
    };
  }

  let totalLuminance = 0;
  let totalSaturation = 0;
  let neutralAsphaltPixels = 0;
  let skinTonePixels = 0;
  let foliagePixels = 0;
  let vividPixels = 0;

  // Grayscale buffer for texture & gradient analysis
  const gray = new Float32Array(totalPixels);

  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    totalLuminance += lum;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    const sat = max === 0 ? 0 : delta / max;
    totalSaturation += sat;

    // 1. Asphalt neutral color check:
    // Road asphalt/concrete is low saturation and balanced across RGB channels
    const rgDiff = Math.abs(r - g);
    const gbDiff = Math.abs(g - b);
    const rbDiff = Math.abs(r - b);

    if (sat < 0.32 && rgDiff < 35 && gbDiff < 35 && rbDiff < 35 && lum >= 20 && lum <= 210) {
      neutralAsphaltPixels++;
    }

    // 2. Skin tone detection (reject selfies/portraits)
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && (r - g) >= 12 && sat > 0.22 && sat < 0.68) {
      skinTonePixels++;
    }

    // 3. Foliage/grass detection (reject garden/parks without roads)
    if (g > r * 1.12 && g > b * 1.12 && sat > 0.25) {
      foliagePixels++;
    }

    // 4. High vivid saturation (indoor toys, posters, colorful clothing, vibrant screens)
    if (sat > 0.55) {
      vividPixels++;
    }
  }

  const avgLuminance = totalLuminance / totalPixels;
  const avgSaturation = totalSaturation / totalPixels;
  const asphaltRatio = neutralAsphaltPixels / totalPixels;
  const skinRatio = skinTonePixels / totalPixels;
  const foliageRatio = foliagePixels / totalPixels;
  const vividRatio = vividPixels / totalPixels;

  // 5. Texture & Edge Variance (Sobel gradient approximation)
  let gradientSum = 0;
  let edgeCount = 0;
  let darkCavityPixels = 0;

  // Sample grid skipping border for performance
  const step = 2;
  let sampledCount = 0;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const idx = y * width + x;
      const gx = gray[idx + 1] - gray[idx - 1];
      const gy = gray[idx + width] - gray[idx - width];
      const grad = Math.sqrt(gx * gx + gy * gy);
      gradientSum += grad;
      sampledCount++;

      if (grad > 22) {
        edgeCount++;
      }

      // Check for pothole cavity (localized dark region relative to road median)
      if (gray[idx] < avgLuminance * 0.72 && gray[idx] >= 15) {
        darkCavityPixels++;
      }
    }
  }

  const meanGradient = sampledCount > 0 ? gradientSum / sampledCount : 0;
  const edgeDensity = sampledCount > 0 ? edgeCount / sampledCount : 0;
  const cavityRatio = sampledCount > 0 ? darkCavityPixels / sampledCount : 0;

  // Calculate scores
  const asphaltNeutralScore = Math.min(100, Math.round(asphaltRatio * 130));
  const textureVariance = Math.round(meanGradient * 10) / 10;
  const defectPresenceScore = Math.min(
    100,
    Math.round((edgeDensity * 120 + cavityRatio * 80 + (asphaltRatio > 0.4 ? 20 : 0)))
  );

  // REJECTION CRITERIA:
  // 1. Extreme non-road color (Selfie, skin, foliage, or vivid indoor object)
  if (skinRatio > 0.28) {
    return {
      isRoad: false,
      confidence: Math.round((1 - skinRatio) * 100),
      reason: 'Detected portrait or skin tones instead of road surface.',
      metrics: {
        asphaltNeutralScore,
        textureVariance,
        averageLuminance: Math.round(avgLuminance),
        colorSaturation: Math.round(avgSaturation * 100) / 100,
        defectPresenceScore,
      },
    };
  }

  if (vividRatio > 0.35) {
    return {
      isRoad: false,
      confidence: Math.round((1 - vividRatio) * 100),
      reason: 'Detected vivid indoor objects or colorful surfaces.',
      metrics: {
        asphaltNeutralScore,
        textureVariance,
        averageLuminance: Math.round(avgLuminance),
        colorSaturation: Math.round(avgSaturation * 100) / 100,
        defectPresenceScore,
      },
    };
  }

  if (foliageRatio > 0.45) {
    return {
      isRoad: false,
      confidence: Math.round((1 - foliageRatio) * 100),
      reason: 'Detected predominantly vegetation or grass without road pavement.',
      metrics: {
        asphaltNeutralScore,
        textureVariance,
        averageLuminance: Math.round(avgLuminance),
        colorSaturation: Math.round(avgSaturation * 100) / 100,
        defectPresenceScore,
      },
    };
  }

  // 2. Plain blank surface check (painted wall, paper, ceiling, laptop screen)
  if (edgeDensity < 0.02 && meanGradient < 7.0) {
    return {
      isRoad: false,
      confidence: 15,
      reason: 'Surface lacks asphalt texture, pavement aggregate, or road defects (blank/smooth surface).',
      metrics: {
        asphaltNeutralScore,
        textureVariance,
        averageLuminance: Math.round(avgLuminance),
        colorSaturation: Math.round(avgSaturation * 100) / 100,
        defectPresenceScore,
      },
    };
  }

  // 3. Over-exposure or lens blackout
  if (avgLuminance > 225 || avgLuminance < 18) {
    return {
      isRoad: false,
      confidence: 10,
      reason: 'Image is severely over-exposed or dark/blocked.',
      metrics: {
        asphaltNeutralScore,
        textureVariance,
        averageLuminance: Math.round(avgLuminance),
        colorSaturation: Math.round(avgSaturation * 100) / 100,
        defectPresenceScore,
      },
    };
  }

  // 4. Asphalt presence threshold:
  // At least 35% of the frame must exhibit neutral pavement coloration with low saturation
  if (asphaltRatio < 0.35 || avgSaturation > 0.38) {
    return {
      isRoad: false,
      confidence: Math.round(asphaltRatio * 100),
      reason: 'Pavement asphalt characteristics not identified in photo.',
      metrics: {
        asphaltNeutralScore,
        textureVariance,
        averageLuminance: Math.round(avgLuminance),
        colorSaturation: Math.round(avgSaturation * 100) / 100,
        defectPresenceScore,
      },
    };
  }

  // PASSED: Recognizable road surface
  const confidence = Math.min(
    99,
    Math.max(65, Math.round(asphaltRatio * 60 + Math.min(30, meanGradient * 2) + 20))
  );

  return {
    isRoad: true,
    confidence,
    metrics: {
      asphaltNeutralScore,
      textureVariance,
      averageLuminance: Math.round(avgLuminance),
      colorSaturation: Math.round(avgSaturation * 100) / 100,
      defectPresenceScore,
    },
  };
}
