'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Camera,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Compass,
  Eye,
  EyeOff,
  ShieldAlert,
  Send,
  Building2,
  RotateCcw,
  Upload,
  ArrowRight
} from 'lucide-react';
import { DefectReport } from '@/lib/db';
import { DetectedPothole } from '@/lib/potholeDetector';

export interface PresetLocation {
  name: string;
  lat: number;
  lng: number;
  area: string;
}

export const PRESET_LOCATIONS: PresetLocation[] = [
  {
    name: 'Shaheed Path Service Road',
    lat: 26.8468,
    lng: 81.0105,
    area: 'Gomti Nagar Vistar Sector-1, Lucknow',
  },
  {
    name: 'Kanpur Road Yojna',
    lat: 26.7768,
    lng: 80.8845,
    area: 'Mragshira Apartment, Kanpur Road, Lucknow',
  },
  {
    name: 'Hardoi Road (Ward 85)',
    lat: 26.8732,
    lng: 80.8922,
    area: 'Mallahi Tola I, Hardoi Road, Lucknow',
  },
  {
    name: 'Mohan Road (Nadarganj)',
    lat: 26.7892,
    lng: 80.8462,
    area: 'Nadarganj to TS Mishra Bridge, Mohan Road',
  },
  {
    name: 'Chinhat Nandi Vihar',
    lat: 26.8892,
    lng: 81.0562,
    area: 'Chinhat, Lucknow',
  },
];

export default function MobileRoadCapture() {
  // State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [lat, setLat] = useState<string>('26.8468');
  const [lng, setLng] = useState<string>('81.0105');
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Shaheed Path Service Road');

  // Webcam modal state (for desktop/secure context)
  const [isWebcamOpen, setIsWebcamOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isMobile, setIsMobile] = useState(false);

  // AI Pothole Detection & Accountability State
  const [analysisReport, setAnalysisReport] = useState<DefectReport | null>(null);
  const [showAiOverlay, setShowAiOverlay] = useState(true);

  // Complaint Form State
  const [citizenRemark, setCitizenRemark] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [isLODGINGComplaint, setIsLODGINGComplaint] = useState(false);
  const [complaintNotice, setComplaintNotice] = useState<string | null>(null);
  const [liveComplaintCount, setLiveComplaintCount] = useState<number>(0);
  const [isEscalated, setIsEscalated] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  // Device detection
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    }
  }, []);

  // Auto-fetch device GPS on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  const fetchCurrentLocation = () => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(5));
          setLng(position.coords.longitude.toFixed(5));
          setSelectedPresetName('Live Device GPS');
          setIsLocating(false);
        },
        () => {
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  };

  const handleSelectPreset = (preset: PresetLocation) => {
    setLat(preset.lat.toFixed(5));
    setLng(preset.lng.toFixed(5));
    setSelectedPresetName(preset.name);
    if (analysisReport) {
      setAnalysisReport(null);
      setComplaintNotice(null);
    }
  };

  // Attach stream to videoRef when modal opens
  useEffect(() => {
    if (isWebcamOpen && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => console.warn('Webcam play error:', err));
    }
  }, [stream, isWebcamOpen]);

  // Clean up media tracks
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Stop Webcam
  const stopWebcam = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsWebcamOpen(false);
  }, [stream]);

  // Launch Desktop Webcam
  const openDesktopWebcam = async (mode: 'environment' | 'user' = facingMode) => {
    setErrorMsg(null);
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: mode } },
        audio: false,
      });
      setStream(mediaStream);
      setIsWebcamOpen(true);
    } catch {
      // Fallback: trigger file camera input
      nativeCameraInputRef.current?.click();
    }
  };

  // Click handler for the primary "Capture Road Photo" button
  const handleCaptureClick = (e: React.MouseEvent) => {
    // On mobile phone or non-webcam setups: let native HTML label fire native camera directly
    if (isMobile || !navigator?.mediaDevices?.getUserMedia) {
      return;
    }
    // On desktop with webcam support: open in-browser webcam scanner
    e.preventDefault();
    openDesktopWebcam('environment');
  };

  // Snapshot from desktop webcam
  const takeWebcamSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    stopWebcam();

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `road_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
        runAnalysisWithFile(file, dataUrl);
      }
    }, 'image/jpeg');
  };

  // Handle Photo Taken via Native Camera or Gallery Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCapturedImage(url);
      runAnalysisWithFile(file, url);
    }
    e.target.value = '';
  };

  // Run AI Pothole & Tender Match Analysis
  const runAnalysisWithFile = async (file: File, displayUrl: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisReport(null);
    setComplaintNotice(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('latitude', lat);
    formData.append('longitude', lng);
    formData.append('userNotes', `Defect captured at ${selectedPresetName}`);

    try {
      const res = await fetch('/api/analyze-pothole', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.message || data.error || 'Failed to analyze road defect.');
      } else {
        setAnalysisReport(data.report);

        // Update GPS if photo had real EXIF coordinates
        if (data.report?.latitude && data.report?.longitude) {
          setLat(Number(data.report.latitude).toFixed(5));
          setLng(Number(data.report.longitude).toFixed(5));
        }

        const matchedTender = data.report?.matchResult?.matchedTender;
        if (matchedTender) {
          setLiveComplaintCount(matchedTender.complaint_count || 0);
          setIsEscalated(!!matchedTender.is_escalated);
        }

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('current_defect_report', JSON.stringify(data.report));
          sessionStorage.setItem('current_defect_image', displayUrl);
        }
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + (err.message || String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Lodge Official Grievance
  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysisReport?.matchResult?.matchedTender) return;

    setIsLODGINGComplaint(true);
    setComplaintNotice(null);

    try {
      const tender = analysisReport.matchResult.matchedTender;
      const remarkText = citizenRemark.trim() || `Road defect & pothole complaint registered for: ${tender.title}`;
      const remarkWithContact = citizenContact.trim()
        ? `${remarkText} [Contact: ${citizenContact.trim()}]`
        : remarkText;

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId: tender.tender_id,
          latitude: parseFloat(lat),
          longitude: parseFloat(lng),
          citizenRemark: remarkWithContact,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLiveComplaintCount(data.complaintCount);
        setIsEscalated(data.isEscalated);
        if (data.isEscalated) {
          setComplaintNotice(
            `GOVERNMENT ESCALATION NOTICE: Threshold reached (${data.complaintCount}/${data.threshold} Complaints). Official High Priority Notice issued to ${tender.organisation} & contractor ${tender.contractor_name}.`
          );
        } else {
          setComplaintNotice(
            `Official complaint registered successfully. (${data.complaintCount}/${data.threshold} complaints needed for automatic government escalation notice).`
          );
        }
      } else {
        setErrorMsg(data.error || 'Failed to lodge complaint.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to submit grievance: ' + err.message);
    } finally {
      setIsLODGINGComplaint(false);
    }
  };

  const handleResetCapture = () => {
    setCapturedImage(null);
    setAnalysisReport(null);
    setComplaintNotice(null);
    setErrorMsg(null);
    setCitizenRemark('');
    setCitizenContact('');
  };

  const tender = analysisReport?.matchResult?.matchedTender;
  const diagnostics = analysisReport?.potholeDiagnostics;
  const geocoded = analysisReport?.geocodedLocation;

  return (
    <div className="w-full max-w-2xl mx-auto font-sans space-y-6">
      {/* Hidden Hardware Camera Input (Instant phone camera) */}
      <input
        ref={nativeCameraInputRef}
        id="camera-capture-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="sr-only opacity-0 absolute w-0 h-0 pointer-events-none"
      />

      {/* Hidden Gallery Input */}
      <input
        ref={galleryInputRef}
        id="gallery-upload-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only opacity-0 absolute w-0 h-0 pointer-events-none"
      />

      {/* MAIN CARD */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
        {/* Top Status & GPS Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse"></span>
            <span className="text-xs font-mono font-bold text-zinc-200 tracking-wider uppercase">
              ROAD TENDER & CONTRACTOR MATCHER
            </span>
          </div>

          <button
            type="button"
            onClick={fetchCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-full border border-zinc-800 transition-all cursor-pointer"
            title="Auto-detect GPS"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-zinc-200' : 'text-zinc-400'}`} />
            <span>{isLocating ? 'Locating...' : 'Auto GPS'}</span>
          </button>
        </div>

        {/* IMAGE DISPLAY AREA (Shown when photo is captured/uploaded) */}
        {capturedImage ? (
          <div className="space-y-4">
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-4/3 flex items-center justify-center shadow-xl">
              <img
                src={capturedImage}
                alt="Captured Road Defect"
                className="w-full h-full object-cover grayscale contrast-125"
              />

              {/* AI Pothole Bounding Box Overlay */}
              {showAiOverlay && diagnostics?.detectedPotholes && (
                <div className="absolute inset-0 pointer-events-none">
                  {diagnostics.detectedPotholes.map((pothole: DetectedPothole, idx: number) => {
                    const [ymin, xmin, ymax, xmax] = pothole.box;
                    const top = `${ymin}%`;
                    const left = `${xmin}%`;
                    const width = `${xmax - xmin}%`;
                    const height = `${ymax - ymin}%`;

                    const isCritical = pothole.severity === 'CRITICAL';
                    const isHigh = pothole.severity === 'HIGH';

                    return (
                      <div
                        key={pothole.id}
                        style={{ top, left, width, height }}
                        className={`absolute border-2 rounded-lg transition-all ${
                          isCritical
                            ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                            : isHigh
                            ? 'border-amber-400 bg-amber-400/10 shadow-[0_0_12px_rgba(251,191,36,0.4)]'
                            : 'border-white bg-white/10'
                        }`}
                      >
                        <div className="absolute -top-6 left-0 flex items-center gap-1 bg-black/90 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-white border border-zinc-700 whitespace-nowrap shadow-md">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isCritical ? 'bg-rose-500 animate-ping' : 'bg-amber-400'
                            }`}
                          />
                          <span>#{idx + 1} Pothole ({pothole.confidence}%)</span>
                        </div>
                        <div className="absolute -bottom-5 right-0 bg-black/90 px-1.5 py-0.5 rounded text-[9px] font-mono text-zinc-300 border border-zinc-800">
                          {pothole.estimatedDepthCm}cm depth × {pothole.estimatedWidthCm}cm
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Toggle AI Overlay Button */}
              {diagnostics && (
                <button
                  type="button"
                  onClick={() => setShowAiOverlay(!showAiOverlay)}
                  className="absolute top-3 right-3 bg-black/80 hover:bg-black text-white px-3 py-1 rounded-full text-[11px] font-mono flex items-center gap-1.5 border border-zinc-700 shadow-md backdrop-blur cursor-pointer z-10"
                >
                  {showAiOverlay ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-400" />
                      <span>AI Boxes: ON</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-zinc-400" />
                      <span>AI Boxes: OFF</span>
                    </>
                  )}
                </button>
              )}

              {/* Bottom Watermark Bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4 flex items-center justify-between text-xs font-mono text-white">
                <span className="flex items-center gap-1.5 text-zinc-200">
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>CAPTURED DEFECT</span>
                </span>
                <span className="text-[11px] text-zinc-400">
                  {lat}°N, {lng}°E
                </span>
              </div>
            </div>

            {/* Retake / New Photo Action */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleResetCapture}
                className="text-xs font-mono text-zinc-400 hover:text-white flex items-center gap-1.5 py-1 px-3 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 cursor-pointer transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Capture / Upload Another Photo</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* 
          EXACTLY TWO BUTTONS AS REQUESTED:
          1. "Capture Road Photo"
          2. "Gallery Upload"
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* BUTTON 1: Capture Road Photo */}
          <label
            htmlFor="camera-capture-input"
            onClick={handleCaptureClick}
            className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer text-center select-none"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-black" />
                <span>Analyzing Photo...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 text-black" />
                <span>Capture Road Photo</span>
              </>
            )}
          </label>

          {/* BUTTON 2: Gallery Upload */}
          <label
            htmlFor="gallery-upload-input"
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-100 font-bold text-sm py-4 px-6 rounded-2xl border border-zinc-700 shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer text-center select-none"
          >
            <Upload className="w-5 h-5 text-zinc-300" />
            <span>Gallery Upload</span>
          </label>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-mono">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Preset Location Chips */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-300" /> Selected Road Stretch:
            </label>
            <span className="text-[11px] font-mono text-zinc-400 truncate max-w-[200px]">
              {selectedPresetName}
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {PRESET_LOCATIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-medium transition-all shrink-0 border cursor-pointer ${
                  selectedPresetName === preset.name
                    ? 'bg-white text-black border-white font-bold'
                    : 'bg-black text-zinc-400 hover:text-white border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ANALYSIS RESULTS & CONTRACTOR ACCOUNTABILITY CARD */}
      {analysisReport && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-white" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Pothole Diagnostics & Accountable Tender
              </h2>
            </div>
            <span className="text-[11px] font-mono bg-zinc-900 text-zinc-300 px-2.5 py-1 rounded-full border border-zinc-800">
              ID: {analysisReport.id}
            </span>
          </div>

          {/* 1. Computer Vision Pothole Metrics */}
          {diagnostics && (
            <div className="space-y-3">
              <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                1. AI Pothole Detection Analysis
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center font-mono">
                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Defects Detected</div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {diagnostics.potholeCount} Pothole{diagnostics.potholeCount > 1 ? 's' : ''}
                  </div>
                </div>

                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Measured Depth</div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {analysisReport.defectDepthCm} cm
                  </div>
                </div>

                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Pavement Index (PCI)</div>
                  <div className="text-base font-extrabold text-white mt-0.5">
                    {diagnostics.pciScore} / 100
                  </div>
                  <div className="text-[9px] text-zinc-400">{diagnostics.pciRating}</div>
                </div>

                <div className="bg-black p-3.5 rounded-2xl border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Severity Level</div>
                  <div className="text-sm font-extrabold text-white mt-0.5">
                    {analysisReport.priorityAssessment.level}
                  </div>
                  <div className="text-[9px] text-zinc-400">SLA: {analysisReport.priorityAssessment.slaHours}h</div>
                </div>
              </div>

              <div className="p-3.5 bg-black rounded-2xl border border-zinc-800 text-xs text-zinc-300 font-mono">
                <span className="text-white font-bold">Hazard Assessment: </span>
                <span className="text-zinc-400">{diagnostics.damageRisk}</span>
              </div>
            </div>
          )}

          {/* 2. Geocoded Location */}
          {geocoded && (
            <div className="space-y-2 border-t border-zinc-800 pt-4 font-mono">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-zinc-300" /> 2. Ground Location Determined
              </div>

              <div className="bg-black p-4 rounded-2xl border border-zinc-800 space-y-1">
                <div className="text-sm font-bold text-white">{geocoded.roadName}</div>
                <div className="text-xs text-zinc-400">
                  {geocoded.locality} • {geocoded.ward} • {geocoded.city}, {geocoded.state}
                </div>
                <div className="text-[11px] text-zinc-500 pt-1">
                  GPS Coordinates: {lat}°N, {lng}°E
                </div>
              </div>
            </div>
          )}

          {/* 3. Accountable Road Tender & Contractor from Database */}
          {tender ? (
            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-white" /> 3. Responsible Tender & Contractor
                </div>
                <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-zinc-900 text-zinc-200 border border-zinc-800">
                  Complaints: {liveComplaintCount} / 3
                </span>
              </div>

              <div className="bg-black p-5 rounded-2xl border border-zinc-800 space-y-4">
                {/* Contractor Name */}
                <div>
                  <div className="text-[10px] text-zinc-500 font-mono uppercase">Assigned Contractor Company</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">
                    {tender.contractor_name}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1">
                    Authority: <strong className="text-zinc-200">{tender.organisation}</strong> • Tender ID: <span className="font-mono text-zinc-300">{tender.tender_id}</span>
                  </div>
                </div>

                {/* Tender Work Title */}
                <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800 text-xs">
                  <span className="text-zinc-500 font-mono text-[10px] block uppercase">Tender Work Scope</span>
                  <div className="text-zinc-200 font-medium mt-0.5">{tender.title}</div>
                </div>

                {/* Budget & DLP */}
                <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Sanctioned Budget</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ₹{(tender.budget_inr / 100000).toFixed(2)} Lakhs
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">Defect Liability (DLP)</div>
                    <div className="text-xs font-bold text-emerald-400 mt-1">
                      Active Legal Liability
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 font-mono leading-relaxed border-t border-zinc-900 pt-3">
                  <strong>Contractor Responsibility:</strong> Under UP PWD Clause 14.2 (Defect Liability Period), contractor <em>{tender.contractor_name}</em> is legally obligated to rectify potholes on this stretch at zero cost to the public.
                </div>
              </div>

              {/* 4. Lodge a Complaint Section */}
              <div className="space-y-3 pt-2">
                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  4. Lodge Official Complaint Against Contractor
                </div>

                <form onSubmit={handleLodgeComplaint} className="space-y-3">
                  <textarea
                    value={citizenRemark}
                    onChange={(e) => setCitizenRemark(e.target.value)}
                    placeholder="Describe defect or hazard (optional)..."
                    rows={2}
                    className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="tel"
                      value={citizenContact}
                      onChange={(e) => setCitizenContact(e.target.value)}
                      placeholder="Contact number (optional)"
                      className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white font-mono"
                    />

                    <button
                      type="submit"
                      disabled={isLODGINGComplaint}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-xs py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isLODGINGComplaint ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin text-black" />
                          <span>Filing Complaint...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-black" />
                          <span>Lodge Official Complaint</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Complaint Notice / Escalation Banner */}
                {complaintNotice && (
                  <div className="p-4 rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs font-mono space-y-2 animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                      <span>Complaint Registered Successfully</span>
                    </div>
                    <div className="text-zinc-300 leading-relaxed">{complaintNotice}</div>
                    {isEscalated && (
                      <Link
                        href="/escalated"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-white underline pt-1"
                      >
                        View High Priority Government Escalation Board <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-5 bg-black rounded-2xl border border-zinc-800 text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-zinc-400 mx-auto" />
              <div className="text-xs font-bold text-white font-mono">No Matching Active Road Tender Found</div>
              <div className="text-xs text-zinc-400">{analysisReport.matchResult.matchReason}</div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Webcam Viewfinder Modal */}
      {isWebcamOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black to-transparent">
            <button
              type="button"
              onClick={stopWebcam}
              className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center border border-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              ALIGN POTHOLE IN WEBCAM
            </div>
            <button
              type="button"
              onClick={() => {
                const next = facingMode === 'environment' ? 'user' : 'environment';
                setFacingMode(next);
                openDesktopWebcam(next);
              }}
              className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center border border-zinc-800 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover grayscale contrast-125"
            />
            <div className="absolute inset-x-8 inset-y-16 border border-zinc-500/40 rounded-3xl pointer-events-none flex items-center justify-center">
              <div className="text-[11px] font-mono font-bold text-white bg-black/80 px-4 py-1.5 rounded-full border border-zinc-700">
                ALIGN ROAD DEFECT
              </div>
            </div>
          </div>

          <div className="p-6 bg-black flex flex-col items-center gap-3 z-10 border-t border-zinc-900">
            <button
              type="button"
              onClick={takeWebcamSnapshot}
              className="w-20 h-20 rounded-full border-4 border-white p-1 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white"></div>
            </button>
            <span className="text-[11px] font-mono text-zinc-400">TAP TO SNAP & ANALYZE</span>
          </div>
        </div>
      )}
    </div>
  );
}
