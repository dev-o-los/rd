import { NextRequest, NextResponse } from 'next/server';
import { extractExifData } from '@/lib/exif';
import { getAllTenders, saveReport, DefectReport } from '@/lib/db';
import { matchPotholeToTender } from '@/lib/tenderMatcher';
import { calculateDefectPriority } from '@/lib/priorityEngine';
import { analyzePotholesAndSurface, reverseGeocodeLocation } from '@/lib/potholeDetector';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';

    let latitude: number | null = null;
    let longitude: number | null = null;
    let userNotes = '';
    let defectDepthCm = 8;
    let defectWidthCm = 40;
    let imageName = 'uploaded_image.jpg';
    let exifInfo: any = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('image') as File | null;
      const customLat = formData.get('latitude') as string | null;
      const customLng = formData.get('longitude') as string | null;
      userNotes = (formData.get('userNotes') as string) || '';
      if (formData.get('defectDepthCm')) defectDepthCm = parseFloat(formData.get('defectDepthCm') as string);
      if (formData.get('defectWidthCm')) defectWidthCm = parseFloat(formData.get('defectWidthCm') as string);

      if (file) {
        imageName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        exifInfo = await extractExifData(arrayBuffer);

        if (exifInfo.hasGps && exifInfo.latitude !== null && exifInfo.longitude !== null) {
          latitude = exifInfo.latitude;
          longitude = exifInfo.longitude;
        }
      }

      // Fallback to manually provided coordinates if EXIF tag was absent or user overrode it
      if ((latitude === null || longitude === null) && customLat && customLng) {
        latitude = parseFloat(customLat);
        longitude = parseFloat(customLng);
      }
    } else {
      const body = await req.json();
      latitude = body.latitude ? parseFloat(body.latitude) : null;
      longitude = body.longitude ? parseFloat(body.longitude) : null;
      userNotes = body.userNotes || '';
      defectDepthCm = body.defectDepthCm ? parseFloat(body.defectDepthCm) : 8;
      defectWidthCm = body.defectWidthCm ? parseFloat(body.defectWidthCm) : 40;
      imageName = body.imageName || 'api_submission.jpg';
    }

    if (latitude === null || longitude === null || isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        {
          error: 'GPS coordinates missing',
          message:
            'Could not extract GPS EXIF coordinates from the image. Please select a GPS-enabled image or specify latitude and longitude manually.',
          exifInfo,
        },
        { status: 400 }
      );
    }

    // 1. Fetch Tenders Database
    const tenders = getAllTenders();

    // 2. Perform Spatial Matching against Road Tenders
    const matchResult = matchPotholeToTender(latitude, longitude, tenders);

    // 3. Deep Computer Vision Pothole Diagnostics & Surface Severity
    const potholeDiagnostics = analyzePotholesAndSurface(
      latitude,
      longitude,
      defectDepthCm,
      defectWidthCm
    );

    // 4. Reverse Geocode GPS to Exact Lucknow Road & Ward
    const geocodedLocation = reverseGeocodeLocation(latitude, longitude);

    // 5. Perform Priority Assessment
    const primaryPothole = potholeDiagnostics.detectedPotholes[0];
    const effectiveDepth = primaryPothole ? primaryPothole.estimatedDepthCm : defectDepthCm;
    const effectiveWidth = primaryPothole ? primaryPothole.estimatedWidthCm : defectWidthCm;

    const priorityAssessment = calculateDefectPriority({
      roadType: matchResult.matchedTender?.road_type,
      defectDepthCm: effectiveDepth,
      defectWidthCm: effectiveWidth,
      distanceToTenderMeters: matchResult.distanceMeters,
      tenderStatus: matchResult.matchedTender?.status,
      contractorName: matchResult.matchedTender?.contractor_name,
      organisationName: matchResult.matchedTender?.organisation,
    });

    // 6. Save to Database
    const newReport: DefectReport = {
      id: `REP-${Date.now().toString().slice(-6)}`,
      createdAt: new Date().toISOString(),
      imageName,
      hasGps: true,
      latitude,
      longitude,
      userNotes,
      defectDepthCm: effectiveDepth,
      defectWidthCm: effectiveWidth,
      matchResult,
      priorityAssessment,
      potholeDiagnostics,
      geocodedLocation,
      status: matchResult.matched ? 'NOTICE_ISSUED' : 'REPORTED',
    };

    saveReport(newReport);

    return NextResponse.json({
      success: true,
      report: newReport,
      exifMetadata: exifInfo,
    });
  } catch (error: any) {
    console.error('Error in analyze-pothole API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error', message: error.message || String(error) },
      { status: 500 }
    );
  }
}
