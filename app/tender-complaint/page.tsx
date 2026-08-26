'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  Flame,
  ShieldAlert,
  MapPin,
  Building2,
  Calendar,
  IndianRupee,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Phone,
  AlertTriangle
} from 'lucide-react';

function TenderComplaintContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tenderIdParam = searchParams.get('tenderId');
  const noMatchParam = searchParams.get('noMatch');

  const [report, setReport] = useState<any | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [tender, setTender] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Complaint Form State
  const [citizenRemark, setCitizenRemark] = useState('');
  const [citizenContact, setCitizenContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [isEscalated, setIsEscalated] = useState<boolean>(false);

  useEffect(() => {
    // 1. Try to load report & image from sessionStorage
    if (typeof window !== 'undefined') {
      const storedReport = sessionStorage.getItem('current_defect_report');
      const storedImage = sessionStorage.getItem('current_defect_image');

      if (storedImage) {
        setCapturedPhotoUrl(storedImage);
      }

      if (storedReport) {
        try {
          const parsed = JSON.parse(storedReport);
          setReport(parsed);
          if (parsed.matchResult?.matchedTender) {
            setTender(parsed.matchResult.matchedTender);
            setLiveCount(parsed.matchResult.matchedTender.complaint_count || 0);
            setIsEscalated(!!parsed.matchResult.matchedTender.is_escalated);
          }
        } catch (e) {
          console.error('Error parsing stored report:', e);
        }
      }
    }

    // 2. Fetch tender details directly if needed
    if (tenderIdParam) {
      fetchTenderById(tenderIdParam);
    } else {
      setLoading(false);
    }
  }, [tenderIdParam]);

  const fetchTenderById = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/tenders');
      const data = await res.json();
      if (data.road_tenders) {
        const found = data.road_tenders.find((t: any) => t.tender_id === id);
        if (found) {
          setTender(found);
          setLiveCount(found.complaint_count || 0);
          setIsEscalated(!!found.is_escalated);
        }
      }
    } catch (err) {
      console.error('Failed to load tender:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLodgeComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tender) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setComplaintSuccess(null);

    try {
      const lat = report?.latitude || tender?.geo_location?.latitude || 26.8468;
      const lng = report?.longitude || tender?.geo_location?.longitude || 81.0105;

      const remarkText = citizenRemark.trim() || `Citizen defect report registered for road work: ${tender.title}`;
      const remarkWithContact = citizenContact.trim()
        ? `${remarkText} [Contact: ${citizenContact.trim()}]`
        : remarkText;

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenderId: tender.tender_id,
          latitude: lat,
          longitude: lng,
          citizenRemark: remarkWithContact,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setComplaintSuccess(data);
        setLiveCount(data.complaintCount);
        setIsEscalated(data.isEscalated);
      } else {
        setErrorMsg(data.error || 'Failed to lodge official complaint.');
      }
    } catch (err: any) {
      setErrorMsg('Submission error: ' + (err.message || String(err)));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-300">Loading Tender & Contractor Profile...</p>
      </div>
    );
  }

  if (noMatchParam || (!tender && !report?.matchResult?.matched)) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto flex flex-col justify-center items-center text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-extrabold text-white">No Matching Road Tender Found</h2>
        <p className="text-xs text-slate-400">
          The defect coordinates did not match any active government road tender in the database within coverage radius.
        </p>
        <Link
          href="/"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-3 px-6 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Camera Capture
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white pb-12">
      {/* Mobile Top App Bar */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 py-3.5 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retake Photo</span>
          </Link>

          <span className="text-xs font-extrabold tracking-tight text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
            Tender & Contractor Profile
          </span>

          <Link
            href="/escalated"
            className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 px-2.5 py-1 rounded-full hover:bg-rose-500/20 transition-all flex items-center gap-1"
          >
            <Flame className="w-3 h-3" />
            Board
          </Link>
        </div>
      </header>

      {/* Main Mobile Screen Content */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Captured Defect Preview Thumbnail & Match Proximity Banner */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" /> AI Contractor Matched
            </span>
            {report?.matchResult?.distanceMeters !== undefined && (
              <span className="font-mono text-[11px] bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800 text-slate-300">
                {report.matchResult.distanceMeters}m from Tender Path
              </span>
            )}
          </div>

          {capturedPhotoUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-16/9 bg-slate-950">
              <img
                src={capturedPhotoUrl}
                alt="Captured Road Defect"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2.5 py-0.5 rounded-md text-[10px] font-mono text-emerald-300 border border-white/10">
                📍 Saved to Camera Roll
              </div>
            </div>
          )}

          {/* AI Defect Assessment Chips */}
          {report?.priorityAssessment && (
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">DEFECT DEPTH</div>
                <div className="text-xs font-bold text-white mt-0.5">{report.defectDepthCm || 8} cm</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">DEFECT WIDTH</div>
                <div className="text-xs font-bold text-white mt-0.5">{report.defectWidthCm || 40} cm</div>
              </div>
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800">
                <div className="text-[10px] text-slate-400">URGENCY</div>
                <div className={`text-xs font-extrabold mt-0.5 ${
                  report.priorityAssessment.level === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                }`}>
                  {report.priorityAssessment.level}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accountable Contractor Profile Card */}
        <div className="bg-gradient-to-b from-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-3xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-400" /> Accountable Contractor
            </div>

            {/* Live Complaint Badge */}
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${
                isEscalated
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              {liveCount} / 3 Complaints
            </span>
          </div>

          <div>
            <div className="text-lg font-black text-white tracking-tight leading-snug">
              {tender?.contractor_name || 'Assigned Contractor'}
            </div>
            <div className="text-xs text-emerald-400 font-medium mt-0.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>Responsible for maintenance under {tender?.organisation}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400">CONTRACT BUDGET</div>
              <div className="text-sm font-bold text-white mt-0.5">
                ₹{((tender?.budget_inr || 0) / 100000).toFixed(2)} Lakhs
              </div>
            </div>
            <div className="bg-slate-950/70 p-3 rounded-2xl border border-slate-800">
              <div className="text-[10px] text-slate-400">CONTRACT STATUS</div>
              <div className="text-sm font-bold text-indigo-300 mt-0.5 truncate">
                {tender?.status || 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Road Tender Official Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-400" /> Government Tender Details
          </div>

          <h3 className="text-sm font-bold text-white leading-snug">
            {tender?.title}
          </h3>

          <div className="space-y-2 text-xs pt-1">
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span>Tender ID:</span>
              <span className="font-mono text-indigo-300 font-bold">{tender?.tender_id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/80 pb-2">
              <span>Department:</span>
              <span className="text-slate-200 font-semibold">{tender?.organisation}</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Location Area:</span>
              <span className="text-slate-200">{tender?.geo_location?.area_name}</span>
            </div>
          </div>
        </div>

        {/* Lodge Citizen Complaint Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5" />
            <span>Lodge Official Defect Complaint</span>
          </div>

          <p className="text-xs text-slate-400">
            Submit an official citizen grievance. Once a tender receives 3 complaints, it automatically triggers a High Priority Escalation Notice to Lucknow government officials and the contractor.
          </p>

          <form onSubmit={handleLodgeComplaint} className="space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Citizen Defect Remark / Description
              </label>
              <textarea
                value={citizenRemark}
                onChange={(e) => setCitizenRemark(e.target.value)}
                placeholder="e.g. Hazardous pothole causing severe traffic slowdown and vehicle damage..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1">
                Your Contact Number (Optional)
              </label>
              <input
                type="tel"
                value={citizenContact}
                onChange={(e) => setCitizenContact(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-xl shadow-rose-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Submitting Official Complaint...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Lodge Official Complaint</span>
                </>
              )}
            </button>
          </form>

          {/* Success Banner */}
          {complaintSuccess && (
            <div
              className={`p-4 rounded-2xl border text-xs font-medium space-y-3 animate-in fade-in ${
                isEscalated
                  ? 'bg-rose-950/70 border-rose-600 text-rose-200 shadow-lg shadow-rose-900/40'
                  : 'bg-emerald-950/70 border-emerald-600 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Grievance Registered Successfully!</span>
              </div>

              {complaintSuccess.escalationNotice ? (
                <div className="space-y-2">
                  <div className="p-3 bg-rose-900/50 rounded-xl border border-rose-500/40 text-rose-100 font-semibold text-[11px] leading-relaxed">
                    🚨 <strong>OFFICIAL ESCALATION NOTICE:</strong> Threshold reached ({liveCount}/3 Complaints)! This tender has been escalated to HIGH PRIORITY for immediate intervention by {tender?.organisation} and {tender?.contractor_name}.
                  </div>
                  <Link
                    href="/escalated"
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md"
                  >
                    <span>View Priority Escalation Board</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              ) : (
                <div className="text-[11px] text-slate-300">
                  Complaint ID: <strong>{complaintSuccess.tenderId}</strong>. Current Total: <strong>{liveCount}/3</strong> complaints needed for high priority automatic escalation.
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-rose-950/80 border border-rose-800 text-rose-300 p-3 rounded-xl flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function TenderComplaintPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading...</p>
        </div>
      }
    >
      <TenderComplaintContent />
    </Suspense>
  );
}
