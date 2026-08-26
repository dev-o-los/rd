'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserCheck,
  Send,
  ShieldAlert,
  Building2,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

function TenderComplaintContent() {
  const searchParams = useSearchParams();
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
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <RefreshCw className="w-6 h-6 text-white animate-spin mb-3" />
        <p className="text-xs font-mono text-zinc-400">LOADING CONTRACTOR PROFILE...</p>
      </div>
    );
  }

  if (noMatchParam || (!tender && !report?.matchResult?.matched)) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 p-4 max-w-md mx-auto flex flex-col justify-center items-center text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-300">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-base font-bold text-white">No Matching Tender Found</h2>
        <p className="text-xs text-zinc-400">
          The defect coordinates did not match any active government road tender in the database.
        </p>
        <Link
          href="/"
          className="bg-white hover:bg-zinc-200 text-black font-bold text-xs py-3 px-6 rounded-xl flex items-center gap-2 transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-black" /> Back to Camera
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black pb-12">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800 py-3.5 px-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retake Photo</span>
          </Link>

          <span className="text-xs font-mono font-bold tracking-wider uppercase text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-zinc-300" />
            Contractor Profile
          </span>

          <Link
            href="/escalated"
            className="text-[11px] font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full hover:bg-zinc-800 transition-all"
          >
            Board
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4">
        {/* Defect Preview Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 font-mono text-zinc-200 font-bold">
              <CheckCircle2 className="w-4 h-4 text-white" /> TENDER MATCHED
            </span>
            {report?.matchResult?.distanceMeters !== undefined && (
              <span className="font-mono text-[11px] bg-zinc-900 px-2.5 py-1 rounded-full border border-zinc-800 text-zinc-400">
                {report.matchResult.distanceMeters}m away
              </span>
            )}
          </div>

          {capturedPhotoUrl && (
            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 aspect-16/9 bg-black">
              <img
                src={capturedPhotoUrl}
                alt="Captured Road Defect"
                className="w-full h-full object-cover grayscale opacity-90 contrast-125"
              />
            </div>
          )}

          {/* AI Metrics */}
          {report?.priorityAssessment && (
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <div className="text-[9px] text-zinc-400 uppercase">DEPTH</div>
                <div className="text-xs font-bold text-white mt-0.5">{report.defectDepthCm || 8} cm</div>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <div className="text-[9px] text-zinc-400 uppercase">WIDTH</div>
                <div className="text-xs font-bold text-white mt-0.5">{report.defectWidthCm || 40} cm</div>
              </div>
              <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                <div className="text-[9px] text-zinc-400 uppercase">SEVERITY</div>
                <div className="text-xs font-bold text-white mt-0.5">
                  {report.priorityAssessment.level}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accountable Contractor Profile Card */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-white" /> Contractor Liability
            </div>

            <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-zinc-900 text-zinc-200 border border-zinc-800">
              {liveCount} / 3 Complaints
            </span>
          </div>

          <div>
            <div className="text-lg font-extrabold text-white tracking-tight leading-snug">
              {tender?.contractor_name || 'Assigned Contractor'}
            </div>
            <div className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-zinc-300" />
              <span>Assigned by {tender?.organisation}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-1 font-mono">
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500">BUDGET</div>
              <div className="text-sm font-bold text-white mt-0.5">
                ₹{((tender?.budget_inr || 0) / 100000).toFixed(2)} Lakhs
              </div>
            </div>
            <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800">
              <div className="text-[10px] text-zinc-500">STATUS</div>
              <div className="text-xs font-bold text-zinc-300 mt-1 truncate">
                {tender?.status || 'Active'}
              </div>
            </div>
          </div>
        </div>

        {/* Tender Details */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-xl space-y-3">
          <div className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-zinc-300" /> Work Contract Summary
          </div>

          <h3 className="text-sm font-bold text-white leading-snug">
            {tender?.title}
          </h3>

          <div className="space-y-2 text-xs font-mono pt-1">
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-900 pb-2">
              <span>TENDER ID:</span>
              <span className="text-zinc-200 font-bold">{tender?.tender_id}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400 border-b border-zinc-900 pb-2">
              <span>DEPARTMENT:</span>
              <span className="text-zinc-200">{tender?.organisation}</span>
            </div>
            <div className="flex items-center justify-between text-zinc-400">
              <span>AREA:</span>
              <span className="text-zinc-200">{tender?.geo_location?.area_name}</span>
            </div>
          </div>
        </div>

        {/* Lodge Complaint Section */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <ShieldAlert className="w-5 h-5 text-white" />
            <span>Lodge Citizen Grievance</span>
          </div>

          <p className="text-xs text-zinc-400">
            Submit an official record. 3 citizen complaints trigger an automatic High Priority Escalation Notice to officials and contractor.
          </p>

          <form onSubmit={handleLodgeComplaint} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                Citizen Defect Remark
              </label>
              <textarea
                value={citizenRemark}
                onChange={(e) => setCitizenRemark(e.target.value)}
                placeholder="Describe road damage or hazard..."
                rows={3}
                className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-1">
                Contact Number (Optional)
              </label>
              <input
                type="tel"
                value={citizenContact}
                onChange={(e) => setCitizenContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-black border border-zinc-800 rounded-2xl p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white hover:bg-zinc-200 text-black font-extrabold text-sm py-4 px-6 rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Submitting Grievance...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 text-black" />
                  <span>Lodge Official Complaint</span>
                </>
              )}
            </button>
          </form>

          {/* Success Banner */}
          {complaintSuccess && (
            <div className="p-4 rounded-2xl border border-zinc-700 bg-zinc-900 text-zinc-100 text-xs font-mono space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-white shrink-0" />
                <span>Grievance Registered Successfully</span>
              </div>

              {complaintSuccess.escalationNotice ? (
                <div className="space-y-2">
                  <div className="p-3 bg-black rounded-xl border border-zinc-800 text-zinc-200 text-[11px] leading-relaxed">
                    OFFICIAL ESCALATION NOTICE: Threshold reached ({liveCount}/3 Complaints). Escalated to HIGH PRIORITY for immediate intervention by {tender?.organisation} and {tender?.contractor_name}.
                  </div>
                  <Link
                    href="/escalated"
                    className="w-full py-2.5 px-4 rounded-xl bg-white text-black font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <span>View Priority Escalation Board</span>
                    <ArrowRight className="w-4 h-4 text-black" />
                  </Link>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400">
                  Total logged complaints: <strong>{liveCount}/3</strong> needed for automatic high priority escalation notice.
                </div>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-3 rounded-xl flex items-center gap-2 text-xs font-mono">
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
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
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
          <RefreshCw className="w-6 h-6 text-white animate-spin mb-3" />
          <p className="text-xs font-mono text-zinc-400">Loading...</p>
        </div>
      }
    >
      <TenderComplaintContent />
    </Suspense>
  );
}
