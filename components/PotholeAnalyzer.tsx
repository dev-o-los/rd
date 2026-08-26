'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Upload,
  MapPin,
  Camera,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  Flame,
  ArrowRight
} from 'lucide-react';

interface PresetSample {
  name: string;
  lat: number;
  lng: number;
  locationName: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    name: 'Shaheed Path Service Road',
    lat: 26.8468,
    lng: 81.0105,
    locationName: 'Gomti Nagar Vistar Sector-1, Lucknow',
  },
  {
    name: 'Kanpur Road Yojna',
    lat: 26.7768,
    lng: 80.8845,
    locationName: 'Mragshira Apartment, Kanpur Road, Lucknow',
  },
  {
    name: 'Hardoi Road (Ward 85)',
    lat: 26.8732,
    lng: 80.8922,
    locationName: 'Mallahi Tola I, Hardoi Road, Lucknow',
  },
  {
    name: 'Mohan Road (Nadarganj)',
    lat: 26.7892,
    lng: 80.8462,
    locationName: 'Nadarganj to TS Mishra Bridge, Mohan Road',
  },
  {
    name: 'New Nandi Vihar (Chinhat)',
    lat: 26.8892,
    lng: 81.0562,
    locationName: 'Chinhat, Lucknow',
  },
];

export default function PotholeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [manualLat, setManualLat] = useState<string>('26.8468');
  const [manualLng, setManualLng] = useState<string>('81.0105');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Complaint registration state
  const [isRegisteringComplaint, setIsRegisteringComplaint] = useState<boolean>(false);
  const [complaintSuccessMsg, setComplaintSuccessMsg] = useState<string | null>(null);
  const [liveComplaintCount, setLiveComplaintCount] = useState<number>(0);
  const [isEscalated, setIsEscalated] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setErrorMsg(null);
    }
  };

  const applyPreset = (preset: PresetSample) => {
    setManualLat(preset.lat.toString());
    setManualLng(preset.lng.toString());
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    setComplaintSuccessMsg(null);
  };

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setErrorMsg(null);
    setResult(null);
    setComplaintSuccessMsg(null);

    try {
      let res: Response;

      if (selectedFile) {
        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('latitude', manualLat);
        formData.append('longitude', manualLng);

        res = await fetch('/api/analyze-pothole', {
          method: 'POST',
          body: formData,
        });
      } else {
        res = await fetch('/api/analyze-pothole', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude: parseFloat(manualLat),
            longitude: parseFloat(manualLng),
            imageName: 'road_photo.jpg',
          }),
        });
      }

      const data = await res.json();

      if (!res.ok || data.error) {
        setErrorMsg(data.message || data.error || 'Failed to match road tender.');
      } else {
        setResult(data.report);
        const tender = data.report?.matchResult?.matchedTender;
        if (tender) {
          setLiveComplaintCount(tender.complaint_count || 0);
          setIsEscalated(!!tender.is_escalated);
        }
      }
    } catch (err: any) {
      setErrorMsg('Network error: ' + (err.message || String(err)));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRegisterComplaint = async () => {
    if (!result?.matchResult?.matchedTender) return;

    setIsRegisteringComplaint(true);
    setComplaintSuccessMsg(null);

    try {
      const tender = result.matchResult.matchedTender;
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId: tender.tender_id,
          latitude: parseFloat(manualLat),
          longitude: parseFloat(manualLng),
          citizenRemark: `Road defect complaint registered for ${tender.title}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLiveComplaintCount(data.complaintCount);
        setIsEscalated(data.isEscalated);
        if (data.isEscalated) {
          setComplaintSuccessMsg(
            `THRESHOLD EXCEEDED (${data.complaintCount}/${data.threshold} Complaints). Escalated to High Priority government escalation.`
          );
        } else {
          setComplaintSuccessMsg(
            `Complaint registered successfully. (${data.complaintCount}/${data.threshold} needed for threshold escalation).`
          );
        }
      } else {
        setErrorMsg(data.error || 'Failed to register complaint.');
      }
    } catch (err: any) {
      setErrorMsg('Failed to submit complaint: ' + err.message);
    } finally {
      setIsRegisteringComplaint(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 font-sans">
      {/* Upload & Input Card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-white" />
            <h2 className="text-base font-bold text-white">Upload Geotagged Road Photo</h2>
          </div>
          <span className="text-xs font-mono text-zinc-400">EXIF GPS AUTO-MATCH</span>
        </div>

        {/* Drag & Drop Photo Upload */}
        <div className="relative border border-dashed border-zinc-700 hover:border-white rounded-2xl p-8 text-center bg-black/50 transition-all cursor-pointer group">
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
          />
          {previewUrl ? (
            <div className="space-y-3">
              <img
                src={previewUrl}
                alt="Uploaded Road Defect"
                className="max-h-56 mx-auto rounded-xl border border-zinc-800 object-cover shadow-md grayscale contrast-125"
              />
              <div className="text-xs font-mono text-zinc-300 truncate max-w-sm mx-auto">
                {selectedFile?.name}
              </div>
              <span className="inline-block text-xs bg-zinc-900 text-zinc-300 px-3 py-1 rounded-full border border-zinc-800">
                Click to replace photo
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">
                  Click to Upload or Drag Road Photo
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  Extracts GPS coordinates automatically from EXIF data
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sample Locations */}
        <div className="space-y-2">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-zinc-300" /> Lucknow Sample Locations:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_SAMPLES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="text-left p-3 rounded-xl bg-black hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all text-xs cursor-pointer group"
              >
                <div className="font-bold text-zinc-200 group-hover:text-white transition-colors">
                  {preset.name}
                </div>
                <div className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">{preset.locationName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Coordinate Inputs */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
          <div>
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">LATITUDE (°N)</label>
            <input
              type="number"
              step="0.00001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-white"
            />
          </div>
          <div>
            <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">LONGITUDE (°E)</label>
            <input
              type="number"
              step="0.00001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 focus:outline-none focus:border-white"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-3.5 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
              Matching with Database...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 text-black" /> Find Accountable Contractor & Tender
            </>
          )}
        </button>
      </div>

      {/* Error Output */}
      {errorMsg && (
        <div className="bg-zinc-950 border border-zinc-800 text-zinc-300 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-white shrink-0" />
          <div className="text-xs">{errorMsg}</div>
        </div>
      )}

      {/* Output Result Card */}
      {result && result.matchResult && (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Road Tender Match Found
            </div>
            <span className="text-xs font-mono text-zinc-400 bg-black px-3 py-1 rounded-full border border-zinc-800">
              Proximity: {result.matchResult.distanceMeters}m
            </span>
          </div>

          {result.matchResult.matched && result.matchResult.matchedTender ? (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-zinc-300" /> Tender Work Title
                </div>
                <h3 className="text-base font-bold text-white leading-snug">
                  {result.matchResult.matchedTender.title}
                </h3>
                <div className="text-xs font-mono text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-zinc-200 font-semibold">{result.matchResult.matchedTender.organisation}</span>
                  <span>•</span>
                  <span>ID: {result.matchResult.matchedTender.tender_id}</span>
                </div>
              </div>

              {/* Accountable Contractor */}
              <div className="bg-black border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-white" /> Accountable Contractor
                  </div>

                  <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-zinc-900 text-zinc-200 border border-zinc-800">
                    Complaints: {liveComplaintCount} / 3
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-zinc-500 font-mono">Assigned Contractor</div>
                    <div className="text-base font-extrabold text-white mt-0.5">
                      {result.matchResult.matchedTender.contractor_name}
                    </div>
                  </div>

                  <div>
                    <div className="text-zinc-500 font-mono">Budget & Status</div>
                    <div className="text-sm font-bold text-zinc-200 mt-0.5">
                      ₹{(result.matchResult.matchedTender.budget_inr / 100000).toFixed(2)} Lakhs
                      <span className="text-zinc-400 font-normal ml-2 font-mono">({result.matchResult.matchedTender.status})</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <Link
                  href={`/tender-complaint?tenderId=${encodeURIComponent(result.matchResult.matchedTender.tender_id)}`}
                  className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-3 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Dedicated Contractor Complaint Page</span>
                  <ArrowRight className="w-4 h-4 text-black" />
                </Link>

                <button
                  onClick={handleRegisterComplaint}
                  disabled={isRegisteringComplaint}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-sm py-3 px-6 rounded-2xl border border-zinc-800 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isRegisteringComplaint ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Registering Complaint...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-zinc-300" /> Register Official Complaint
                    </>
                  )}
                </button>

                {complaintSuccessMsg && (
                  <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-xs font-mono space-y-2">
                    <div>{complaintSuccessMsg}</div>
                    <div>
                      <Link
                        href="/escalated"
                        className="inline-flex items-center gap-1 text-xs font-bold text-white underline"
                      >
                        View Priority Escalation Board <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <AlertCircle className="w-8 h-8 text-zinc-400 mx-auto" />
              <div className="text-sm font-bold text-white">No Matching Road Tender</div>
              <div className="text-xs text-zinc-400">{result.matchResult.matchReason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
