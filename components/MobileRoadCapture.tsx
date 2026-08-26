'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  MapPin,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  Compass,
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

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

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

    ctx.drawImage(video, 0, 0, width, height);

    // Monochromatic stamp overlay
    const padding = Math.max(16, width * 0.02);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, height - 70, width, 70);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${Math.max(16, Math.floor(width * 0.022))}px sans-serif`;
    ctx.fillText(`GPS: ${lat}°N, ${lng}°E | ${selectedPresetName}`, padding, height - 42);

    ctx.fillStyle = '#A1A1AA';
    ctx.font = `${Math.max(13, Math.floor(width * 0.018))}px sans-serif`;
    ctx.fillText(`TIMESTAMP: ${new Date().toLocaleString()} | MONOCHROME INSPECTION`, padding, height - 18);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedImage(dataUrl);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `road_defect_${Date.now()}.jpg`, { type: 'image/jpeg' });
        setCapturedFile(file);
      }
    }, 'image/jpeg');

    saveAndDownloadPhoto(dataUrl, lat, lng);
    stopCamera();
    processAIDetection(canvas, dataUrl);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCapturedFile(file);
      const url = URL.createObjectURL(file);
      setCapturedImage(url);

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          saveAndDownloadPhoto(dataUrl, lat, lng);
        }
      };
      reader.readAsDataURL(file);
      runAnalysisWithFile(file);
    }
  };

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
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('current_defect_report', JSON.stringify(data.report));
            sessionStorage.setItem('current_defect_image', dataUrl);
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
    }, 'image/jpeg');
  };

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
    <div className="w-full max-w-lg mx-auto font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Monochromatic Mobile Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 md:p-6 shadow-2xl space-y-5">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
            <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-wide">
              AI CONTRACTOR SYSTEM
            </span>
          </div>

          <button
            onClick={fetchCurrentLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-[11px] font-mono bg-zinc-900 hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full border border-zinc-800 transition-all cursor-pointer"
            title="Auto-fetch GPS"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-zinc-300' : 'text-zinc-400'}`} />
            <span>{isLocating ? 'Locating...' : 'Auto GPS'}</span>
          </button>
        </div>

        {/* Hero Photo Trigger Area */}
        <div className="relative group">
          {capturedImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-4/3 flex items-center justify-center">
              <img
                src={capturedImage}
                alt="Captured Road Defect"
                className="w-full h-full object-cover grayscale opacity-90 contrast-125"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent flex flex-col justify-end p-4">
                <div className="flex items-center justify-between text-xs text-white font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-200 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-white" /> CAPTURED & SAVED
                  </span>
                  <span className="font-mono text-[11px] text-zinc-400">
                    {lat}°N, {lng}°E
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={() => startCamera('environment')}
              className="relative rounded-2xl border border-dashed border-zinc-700 hover:border-white bg-zinc-900/60 p-8 text-center cursor-pointer transition-all duration-200 group active:scale-[0.99]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white text-black flex items-center justify-center mx-auto shadow-md group-hover:scale-105 transition-transform duration-200 mb-3">
                <Camera className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Capture Road Photograph
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                Opens camera, saves photo to camera roll, and matches tender via AI
              </p>
            </div>
          )}
        </div>

        {/* Primary Monochromatic Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={() => startCamera('environment')}
            disabled={isAnalyzing}
            className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-black" />
                <span>Processing AI Tender Match...</span>
              </>
            ) : (
              <>
                <Camera className="w-5 h-5 text-black" />
                <span>Capture Road Photo</span>
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isAnalyzing}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-semibold py-2.5 px-3 rounded-xl border border-zinc-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
              <span>Gallery Upload</span>
            </button>

            {capturedImage && (
              <button
                onClick={() => {
                  setCapturedImage(null);
                  setCapturedFile(null);
                }}
                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-3.5 py-2.5 rounded-xl text-xs font-medium border border-zinc-800 cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Notification Toast */}
        {downloadSuccess && (
          <div className="bg-zinc-900 border border-zinc-700 text-zinc-200 p-3 rounded-xl flex items-center gap-2.5 text-xs animate-in fade-in">
            <Download className="w-4 h-4 text-white shrink-0" />
            <span>
              <strong>Camera Roll:</strong> Photo downloaded to device storage with GPS stamp.
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="bg-zinc-900 border border-zinc-700 text-zinc-300 p-3 rounded-xl flex items-center gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-white shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* GPS Coordinates & Presets */}
        <div className="pt-2 border-t border-zinc-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-zinc-300" /> GPS Location
            </label>
            <span className="text-[11px] font-mono text-zinc-400">
              {selectedPresetName}
            </span>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {PRESET_LOCATIONS.map((preset, idx) => (
              <button
                key={idx}
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono">LATITUDE</span>
              <input
                type="number"
                step="0.00001"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono">LONGITUDE</span>
              <input
                type="number"
                step="0.00001"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Camera Modal */}
      {isCameraOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between">
          <div className="p-4 flex items-center justify-between z-10 bg-gradient-to-b from-black to-transparent">
            <button
              onClick={stopCamera}
              className="w-10 h-10 rounded-full bg-zinc-900 text-white flex items-center justify-center border border-zinc-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center font-mono">
              <div className="text-xs font-bold text-white tracking-widest uppercase">CAMERA SCANNER</div>
              <div className="text-[10px] text-zinc-400">
                {lat}°N, {lng}°E
              </div>
            </div>

            <button
              onClick={toggleFacingMode}
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
            <div className="absolute inset-x-8 inset-y-16 border border-zinc-500/50 rounded-2xl pointer-events-none flex items-center justify-center">
              <div className="text-[11px] font-mono font-bold text-zinc-300 bg-black/80 px-3 py-1 rounded-full uppercase tracking-widest border border-zinc-700">
                ALIGN ROAD DEFECT
              </div>
            </div>
          </div>

          <div className="p-6 bg-black flex flex-col items-center gap-4 z-10 border-t border-zinc-900">
            <button
              onClick={takeSnapshot}
              className="w-18 h-18 rounded-full border-2 border-white p-1 flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-14 h-14 rounded-full bg-white"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
