'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  MapPin,
  Sparkles,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Compass,
  Layers,
  ArrowRight,
  ShieldCheck,
  Smartphone
} from 'lucide-react';

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

interface MobileRoadCaptureProps {
  onAnalysisComplete?: (report: any) => void;
}

export default function MobileRoadCapture({ onAnalysisComplete }: MobileRoadCaptureProps) {
  const router = useRouter();

  // State
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [lat, setLat] = useState<string>('26.8468');
  const [lng, setLng] = useState<string>('81.0105');
  const [isLocating, setIsLocating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState<string>('Shaheed Path Service Road');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
        (err) => {
          console.warn('Geolocation error or denied:', err.message);
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
  };

  // Start Camera Stream
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    try {
      setErrorMsg(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);
      setIsCameraOpen(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('MediaDevices camera access failed, falling back to native file input:', err);
      // Fallback: trigger standard mobile file capture
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsCameraOpen(false);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Toggle Camera Facing Mode
  const toggleFacingMode = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  // Watermark and Save/Download to Camera Roll
  const saveAndDownloadPhoto = (dataUrl: string, latitude: string, longitude: string) => {
    try {
      const downloadLink = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      downloadLink.download = `road_defect_geo_${timestamp}.jpg`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 5000);
    } catch (err) {
      console.error('Error auto-downloading photo:', err);
    }
  };

  // Take Snapshot from Camera Viewfinder
  const takeSnapshot = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = video.videoWidth || 1280;
    const height = video.videoHeight || 720;
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, width, height);

    // Add Geotag & Timestamp Stamp Overlay
    const padding = Math.max(16, width * 0.02);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
    ctx.fillRect(0, height - 70, width, 70);

    ctx.fillStyle = '#10B981'; // emerald
    ctx.font = `bold ${Math.max(16, Math.floor(width * 0.022))}px sans-serif`;
    ctx.fillText(`📍 GPS: ${lat}°N, ${lng}°E | ${selectedPresetName}`, padding, height - 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `${Math.max(13, Math.floor(width * 0.018))}px sans-serif`;
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleString()} | RD ACCREDITED INSPECTION`, padding, height - 18);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    // Convert to File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `road_defect_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedFile(file);
      }
    }, 'image/jpeg');

    // Auto-save & download to device camera roll
    saveAndDownloadPhoto(dataUrl, lat, lng);

    // Close viewfinder modal
    stopCamera();

    // Trigger AI Detection automatically
    processAIDetection(canvas, dataUrl);
  };

  // Handle native file input (fallback or gallery upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCapturedFile(file);
      const url = URL.createObjectURL(file);
      setCapturedImage(url);

      // Auto-save download copy
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          saveAndDownloadPhoto(dataUrl, lat, lng);
        }
      };
      reader.readAsDataURL(file);

      // Trigger AI Detection
      runAnalysisWithFile(file);
    }
  };

  // Process AI Detection from snapshot canvas
  const processAIDetection = async (canvas: HTMLCanvasElement, dataUrl: string) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setIsAnalyzing(false);
        return;
      }

      const formData = new FormData();
      formData.append('image', blob, `road_photo_${Date.now()}.jpg`);
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
          setErrorMsg(data.message || data.error || 'Failed to detect road tender.');
          setIsAnalyzing(false);
        } else {
          // Store report in sessionStorage for next page transition
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('current_defect_report', JSON.stringify(data.report));
            sessionStorage.setItem('current_defect_image', dataUrl);
          }

          if (onAnalysisComplete) {
            onAnalysisComplete(data.report);
          }

          // Transition to the dedicated Tender & Complaint page
          const tenderId = data.report?.matchResult?.matchedTender?.tender_id;
          if (tenderId) {
            router.push(`/tender-complaint?tenderId=${encodeURIComponent(tenderId)}`);
          } else {
            router.push('/tender-complaint?noMatch=true');
          }
        }
      } catch (err: any) {
        setErrorMsg('Network error: ' + (err.message || String(err)));
        setIsAnalyzing(false);
      }
    }, 'image/jpeg');
  };

  // Run analysis with raw File
  const runAnalysisWithFile = async (file: File) => {
    setIsAnalyzing(true);
    setErrorMsg(null);

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
        setErrorMsg(data.message || data.error || 'Failed to detect road tender.');
        setIsAnalyzing(false);
      } else {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('current_defect_report', JSON.stringify(data.report));
          sessionStorage.setItem('current_defect_image', URL.createObjectURL(file));
        }

        if (onAnalysisComplete) {
          onAnalysisComplete(data.report);
        }

        const tenderId = data.report?.matchResult?.matchedTender?.tender_id;
        if (tenderId) {
          router.push(`/tender-complaint?tenderId=${encodeURIComponent(tenderId)}`);
        } else {
          router.push('/tender-complaint?noMatch=true');
        }
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + (err.message || String(err)));
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Hidden native input for fallback / direct camera access on iOS & Android */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Mobile Card */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-5">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"></div>

        {/* Top Status Bar */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-semibold text-slate-300">AI Contractor Detection Ready</span>
          </div>

          <button
            onClick={fetchCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-indigo-300 px-2.5 py-1 rounded-full border border-slate-700 transition-all cursor-pointer"
            title="Auto-fetch GPS"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-indigo-400' : 'text-indigo-400'}`} />
            <span>{isLocating ? 'Locating...' : 'Auto GPS'}</span>
          </button>
        </div>

        {/* Hero Interactive Photo Trigger Area */}
        <div className="relative group">
          {capturedImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 aspect-4/3 flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Road Defect"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center justify-between text-xs text-white font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" /> Captured & Saved
                  </span>
                  <span className="font-mono text-[11px] text-slate-300">
                    {lat}°N, {lng}°E
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => startCamera('environment')}
              className="relative rounded-2xl border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-gradient-to-b from-indigo-950/20 to-slate-950/60 p-8 text-center cursor-pointer transition-all duration-300 hover:shadow-indigo-500/10 hover:shadow-xl group active:scale-[0.99]"
            >
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/40 group-hover:scale-110 transition-transform duration-300 text-white mb-3">
                <Camera className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Tap to Capture Road Photo
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Opens camera, saves photo to camera roll, and auto-detects accountable contractor via AI
              </p>
            </div>
          )}
        </div>

        {/* Primary Action Button (Mobile-First CTA) */}
        <div className="space-y-2.5">
          <button
            onClick={() => startCamera('environment')}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running AI Detection & Tender Match...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5" />
                <span>Capture Photograph of Road</span>
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse ml-1" />
              </>
            )}
          </button>

          {/* Quick upload from gallery button */}
          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold py-2.5 px-3 rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Choose from Device Gallery</span>
            </button>

            {capturedImage && (
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setCapturedFile(null);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-3 py-2.5 rounded-xl text-xs font-medium border border-slate-700 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Camera Roll Saved Toast Notification */}
        {downloadSuccess && (
          <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-top-2">
            <Download className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>Saved to Camera Roll:</strong> Stamped geotagged defect photo has been downloaded to your device storage.
            </span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-950/70 border border-rose-800/80 text-rose-300 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GPS Coordinates & Road Presets Selector */}
        <div className="pt-2 border-t border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Geolocation Coordinates
            </label>
            <span className="text-[11px] text-indigo-400 font-medium">
              {selectedPresetName}
            </span>
          </div>

          {/* Preset Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {PRESET_LOCATIONS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectPreset(preset)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all shrink-0 border cursor-pointer ${
                  selectedPresetName === preset.name
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/30'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Coordinate Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 font-mono">LAT (°N)</span>
              <input
                type="number"
                step="0.00001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-mono">LNG (°E)</span>
              <input
                type="number"
                step="0.00001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Live Camera Viewfinder Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          {/* Top Camera Controls */}
          <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center backdrop-blur-md active:scale-95 cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center">
              <div className="text-xs font-bold text-white tracking-wide">LIVE ROAD SCANNER</div>
              <div className="text-[10px] text-emerald-400 font-mono">
                {lat}°N, {lng}°E
              </div>
            </div>

            <button
              onClick={toggleFacingMode}
              className="w-10 h-10 rounded-full bg-slate-800/80 text-white flex items-center justify-center backdrop-blur-md active:scale-95 cursor-pointer"
              title="Switch Camera"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Video Element Viewfinder with Target Crosshairs */}
          <div className="relative flex-1 flex items-center justify-center overflow-hidden bg-black">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Road inspection viewfinder guidelines */}
            <div className="absolute inset-x-8 inset-y-16 border-2 border-dashed border-indigo-400/50 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="text-[11px] font-bold text-indigo-300/80 bg-black/50 px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
                Center Road Defect In Frame
              </div>
            </div>
          </div>

          {/* Bottom Shutter Action Bar */}
          <div className="p-6 bg-gradient-to-t from-black/90 via-black/70 to-transparent flex flex-col items-center gap-4 z-10">
            <div className="text-xs text-slate-300 font-medium">
              Tap shutter to capture & auto-save to camera roll
            </div>

            <div className="flex items-center justify-center gap-8 w-full">
              {/* Shutter Button */}
              <button
                onClick={takeSnapshot}
                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform bg-white/20 backdrop-blur-md cursor-pointer"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-400 transition-colors shadow-lg shadow-rose-500/50"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
