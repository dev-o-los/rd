'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Flame,
  BellRing,
  Building2,
  FileText,
  AlertTriangle,
  RefreshCw,
  Award
} from 'lucide-react';

export default function EscalatedBoardPage() {
  const [escalatedList, setEscalatedList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [threshold, setThreshold] = useState<number>(3);

  useEffect(() => {
    fetchEscalatedTenders();
  }, []);

  const fetchEscalatedTenders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/complaints');
      const data = await res.json();
      if (data.escalatedTenders) {
        setEscalatedList(data.escalatedTenders);
      }
      if (data.threshold) {
        setThreshold(data.threshold);
      }
    } catch (err) {
      console.error('Error fetching escalated tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const highPriorityCount = escalatedList.filter((t) => t.is_escalated).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md py-4 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Matcher
            </Link>

            <div className="h-4 w-px bg-slate-800"></div>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-600/30">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-base font-extrabold text-white tracking-tight">
                  Priority Escalation Board
                </h1>
                <p className="text-[11px] text-slate-400">
                  Government Action Tracker & Citizen Complaint Ledger
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={fetchEscalatedTenders}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5 transition-all"
            title="Refresh Board"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Top Banner Stats */}
        <div className="bg-gradient-to-r from-rose-950/60 via-slate-900 to-indigo-950/60 border border-rose-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <BellRing className="w-3.5 h-3.5" /> High Priority Escalation Threshold: {threshold}+ Complaints
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white">
                Lucknow Government Action Tracker
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                When citizen complaints for a specific road tender reach {threshold} or more, the system automatically escalates the contract to High Priority and dispatches an official repair directive to the government authority.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl text-center shrink-0">
              <div className="text-2xl font-black text-rose-400 font-mono">{highPriorityCount}</div>
              <div className="text-[11px] text-slate-400 font-medium">Escalated Tenders</div>
            </div>
          </div>
        </div>

        {/* List of Escalated Tenders */}
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-xs flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            Fetching Priority Board...
          </div>
        ) : escalatedList.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-xs">
            No road tenders currently have complaints registered against them.
          </div>
        ) : (
          <div className="space-y-4">
            {escalatedList.map((tender) => (
              <div
                key={tender.tender_id}
                className={`bg-slate-900 border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
                  tender.is_escalated
                    ? 'border-rose-700/60 shadow-rose-950/20'
                    : 'border-slate-800'
                }`}
              >
                {/* Status Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-400">
                      Tender ID: {tender.tender_id}
                    </span>
                    <span className="text-xs text-slate-500">Ref: {tender.reference_number}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" /> {tender.complaint_count} Citizen Complaints
                    </span>

                    {tender.is_escalated ? (
                      <span className="bg-rose-600 text-white text-xs font-extrabold px-3 py-1 rounded-full shadow-md animate-pulse">
                        HIGH PRIORITY ESCALATED
                      </span>
                    ) : (
                      <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full">
                        Pending ({threshold - (tender.complaint_count || 0)} more for escalation)
                      </span>
                    )}
                  </div>
                </div>

                {/* Tender Title */}
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{tender.title}</h3>
                  <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 text-slate-300">
                      <Building2 className="w-3.5 h-3.5 text-indigo-400" /> {tender.organisation}
                    </span>
                    <span>•</span>
                    <span className="text-slate-300">Area: {tender.geo_location.area_name}</span>
                  </div>
                </div>

                {/* Contractor & Budget Grid */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-500 font-medium">Accountable Contractor Firm</div>
                    <div className="text-sm font-bold text-emerald-400 mt-0.5">
                      {tender.contractor_name}
                    </div>
                  </div>

                  <div>
                    <div className="text-slate-500 font-medium">Contract Budget & Status</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      ₹{(tender.budget_inr / 100000).toFixed(2)} Lakhs
                      <span className="text-indigo-300 font-normal ml-2">({tender.status})</span>
                    </div>
                  </div>
                </div>

                {/* Government Official Notice */}
                {tender.is_escalated && (
                  <div className="bg-rose-950/40 border border-rose-800/60 p-4 rounded-xl text-xs text-rose-200 leading-relaxed font-mono space-y-1">
                    <div className="font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Official Government Direct Notice
                    </div>
                    <div>
                      URGENT DEFECT RECTIFICATION ORDER: Issued to contractor &quot;{tender.contractor_name}&quot; by {tender.organisation}. Complaint threshold exceeded ({tender.complaint_count}/{threshold} registered complaints). Road repairs must commence immediately.
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        RD System • Government Action Tracker & Priority Escalation Board
      </footer>
    </div>
  );
}
