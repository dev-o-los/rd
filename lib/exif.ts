import ExifReader from 'exifreader';

export interface ExifExtractionResult {
  hasGps: boolean;
  latitude: number | null;
  longitude: number | null;
  altitude?: number | null;
  dateTime?: string | null;
  cameraMake?: string | null;
  cameraModel?: string | null;
  rawTags?: Record<string, any>;
  warning?: string;
}

/**
 * Parses image buffer using ExifReader and extracts decimal latitude and longitude
 */
export async function extractExifData(imageBuffer: Buffer | ArrayBuffer): Promise<ExifExtractionResult> {
  try {
    const tags = ExifReader.load(imageBuffer, { expanded: true });

    let latitude: number | null = null;
    let longitude: number | null = null;
    let altitude: number | null = null;

    if (tags.gps && tags.gps.Latitude !== undefined && tags.gps.Longitude !== undefined) {
      latitude = tags.gps.Latitude;
      longitude = tags.gps.Longitude;

      if (tags.gps.Altitude !== undefined) {
        altitude = tags.gps.Altitude;
      }
    }

    const dateTime = tags.exif?.DateTimeOriginal?.description || tags.exif?.DateTime?.description || null;
    const cameraMake = tags.exif?.Make?.description || null;
    const cameraModel = tags.exif?.Model?.description || null;

    if (latitude !== null && longitude !== null) {
      return {
        hasGps: true,
        latitude,
        longitude,
        altitude,
        dateTime,
        cameraMake,
        cameraModel,
      };
    } else {
      return {
        hasGps: false,
        latitude: null,
        longitude: null,
        dateTime,
        cameraMake,
        cameraModel,
        warning: "No GPS EXIF tags found in this image. Image might have metadata stripped or was captured without GPS permissions.",
      };
    }
  } catch (error: any) {
    return {
      hasGps: false,
      latitude: null,
      longitude: null,
      warning: `Failed to parse EXIF metadata: ${error.message || error}`,
    };
  }
}
