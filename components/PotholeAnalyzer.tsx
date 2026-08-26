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
  ArrowRight,
  ShieldAlert
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
            `🚨 THRESHOLD EXCEEDED (${data.complaintCount}/${data.threshold} Complaints)! This tender has been automatically escalated to HIGH PRIORITY for immediate government action.`
          );
        } else {
          setComplaintSuccessMsg(
            `Complaint registered successfully! (Total Complaints: ${data.complaintCount}/${data.threshold} needed for threshold escalation).`
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload & Input Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Upload Geotagged Road Photo</h2>
          </div>
          <span className="text-xs text-slate-400">EXIF GPS Auto-Match</span>
        </div>

        {/* Drag & Drop Photo Upload */}
        <div className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-8 text-center bg-slate-950/50 transition-all cursor-pointer group">
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
                className="max-h-56 mx-auto rounded-xl border border-slate-700 object-cover shadow-lg"
              />
              <div className="text-xs text-indigo-300 font-semibold truncate max-w-sm mx-auto">
                {selectedFile?.name}
              </div>
              <span className="inline-block text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full border border-indigo-500/30">
                Click or drag to replace image
              </span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-14 h-14 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Upload className="w-7 h-7" />
              </div>
              <div>
                <div className="text-base font-semibold text-slate-200">
                  Click to Upload or Drag Road Photo Here
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Extracts GPS Latitude & Longitude from EXIF metadata automatically
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 1-Click Sample Locations */}
        <div className="space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-indigo-400" /> Or Select Lucknow Sample Location:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {PRESET_SAMPLES.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(preset)}
                className="text-left p-3 rounded-xl bg-slate-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/50 transition-all text-xs group"
              >
                <div className="font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                  {preset.name}
                </div>
                <div className="text-[11px] text-slate-400 truncate mt-0.5">{preset.locationName}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Coordinate Inputs */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Latitude (°N)</label>
            <input
              type="number"
              step="0.00001"
              value={manualLat}
              onChange={(e) => setManualLat(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400 mb-1 block">Longitude (°E)</label>
            <input
              type="number"
              step="0.00001"
              value={manualLng}
              onChange={(e) => setManualLng(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={runAnalysis}
          disabled={isAnalyzing}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
        >
          {isAnalyzing ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Matching with Database...
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Find Accountable Road Tender & Contractor
            </>
          )}
        </button>
      </div>

      {/* Error Output */}
      {errorMsg && (
        <div className="bg-rose-950/40 border border-rose-800 text-rose-300 p-4 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <div className="text-xs">{errorMsg}</div>
        </div>
      )}

      {/* Output Result Card */}
      {result && result.matchResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" /> Road Tender Match Found
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
              Proximity: {result.matchResult.distanceMeters}m away
            </span>
          </div>

          {result.matchResult.matched && result.matchResult.matchedTender ? (
            <div className="space-y-6">
              {/* Road Tender Title & Org */}
              <div>
                <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Road Tender Work Title
                </div>
                <h3 className="text-lg font-bold text-white leading-snug">
                  {result.matchResult.matchedTender.title}
                </h3>
                <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                  <span className="text-slate-300 font-semibold">{result.matchResult.matchedTender.organisation}</span>
                  <span>•</span>
                  <span className="font-mono text-indigo-300">Tender ID: {result.matchResult.matchedTender.tender_id}</span>
                </div>
              </div>

              {/* Accountable Contractor Card */}
              <div className="bg-slate-950 border border-indigo-500/30 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Accountable Contractor Information
                  </div>

                  {/* Complaint Count Badge */}
                  <span
                    className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                      isEscalated
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    Complaints: {liveComplaintCount} (Threshold: 3)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 font-medium">Assigned Contractor / Agency</div>
                    <div className="text-base font-extrabold text-emerald-400 mt-0.5">
                      {result.matchResult.matchedTender.contractor_name}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 font-medium">Contract Budget & Status</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ₹{(result.matchResult.matchedTender.budget_inr / 100000).toFixed(2)} Lakhs
                      <span className="text-indigo-300 font-normal ml-2">({result.matchResult.matchedTender.status})</span>
                    </div>
                  </div>
                </div>

                {/* Location Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{result.matchResult.matchedTender.geo_location.area_name}</span>
                  </div>
                  <div className="font-mono text-slate-400">
                    GPS: {result.latitude.toFixed(5)}°N, {result.longitude.toFixed(5)}°E
                  </div>
                </div>
              </div>

              {/* Action Buttons: Register or Open Mobile Tender Complaint Page */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <Link
                  href={`/tender-complaint?tenderId=${encodeURIComponent(result.matchResult.matchedTender.tender_id)}`}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Open Dedicated Mobile Tender & Complaint View</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <button
                  onClick={handleRegisterComplaint}
                  disabled={isRegisteringComplaint}
                  className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isRegisteringComplaint ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Registering Complaint...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Register Official Complaint Against This Tender
                    </>
                  )}
                </button>

                {complaintSuccessMsg && (
                  <div
                    className={`p-4 rounded-xl border text-xs font-medium leading-relaxed space-y-2 ${
                      isEscalated
                        ? 'bg-rose-950/60 border-rose-700 text-rose-200'
                        : 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                    }`}
                  >
                    <div>{complaintSuccessMsg}</div>
                    <div className="pt-1">
                      <Link
                        href="/escalated"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white underline"
                      >
                        View Priority Escalation Board Page <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-6 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-slate-200">No Matching Road Tender</div>
              <div className="text-xs text-slate-400">{result.matchResult.matchReason}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
