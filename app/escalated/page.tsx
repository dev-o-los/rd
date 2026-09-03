'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
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
    <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-white selection:text-black flex flex-col">
      {/* Responsive Unified Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Top Monochromatic Banner */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-full text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 text-white" /> Escalation Threshold: {threshold}+ Complaints
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                Government Action & Defect Escalation Tracker
              </h2>
              <p className="text-xs text-zinc-400 mt-1 max-w-xl">
                Tender contracts receiving {threshold} or more citizen defect reports automatically trigger high priority notices to Luckow PWD, LDA, and NHAI authority engineers.
              </p>
            </div>

            {/* Quick Count Badge */}
            <div className="bg-black border border-zinc-800 rounded-2xl p-4 text-center shrink-0 min-w-36 font-mono">
              <div className="text-[10px] text-zinc-400 uppercase font-bold">ESCALATED NOTICES</div>
              <div className="text-2xl font-black text-white mt-0.5">
                {highPriorityCount} <span className="text-xs text-zinc-500">/ {escalatedList.length}</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">High Priority</div>
            </div>
          </div>
        </div>

        {/* Escalated Tenders Grid */}
        {loading ? (
          <div className="py-12 text-center text-xs font-mono text-zinc-400 flex flex-col items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin text-white mb-2" />
            <span>Loading Escalation Ledger...</span>
          </div>
        ) : escalatedList.length === 0 ? (
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-12 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-zinc-500 mx-auto" />
            <div className="text-sm font-bold text-white">No Complaints Logged Yet</div>
            <div className="text-xs text-zinc-400 max-w-md mx-auto">
              Scan road defects using the mobile road camera to log complaints against contractors.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider px-1">
              <span>Tracked Road Tenders ({escalatedList.length})</span>
              <span>Threshold = {threshold} Complaints</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {escalatedList.map((tender, idx) => {
                const count = tender.complaint_count || 0;
                const isHighPriority = count >= threshold;

                return (
                  <div
                    key={tender.tender_id || idx}
                    className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-3xl p-6 shadow-xl space-y-4 transition-all"
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-zinc-900 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                          {tender.tender_id}
                        </span>
                        <span className="text-xs text-zinc-400 font-semibold">{tender.organisation}</span>
                      </div>

                      {/* Escalation Tag */}
                      <span
                        className={`px-3.5 py-1 text-xs font-mono font-bold rounded-full border flex items-center gap-1.5 ${
                          isHighPriority
                            ? 'bg-white text-black border-white'
                            : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                        }`}
                      >
                        <Flame className="w-3.5 h-3.5" />
                        {isHighPriority ? 'HIGH PRIORITY ESCALATED' : 'ACTIVE COMPLAINTS LOGGED'} ({count}/{threshold})
                      </span>
                    </div>

                    {/* Work Title */}
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {tender.title}
                      </h3>
                      <div className="text-xs text-zinc-400 mt-1 font-mono">
                        Location: {tender.geo_location?.area_name}
                      </div>
                    </div>

                    {/* Contractor Liability Box */}
                    <div className="bg-black border border-zinc-800 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <div className="text-zinc-500 font-bold uppercase text-[10px]">Contractor / Agency</div>
                        <div className="text-sm font-extrabold text-white mt-0.5">
                          {tender.contractor_name}
                        </div>
                      </div>

                      <div>
                        <div className="text-zinc-500 font-bold uppercase text-[10px]">Contract Budget</div>
                        <div className="text-sm font-bold text-zinc-200 mt-0.5">
                          ₹{((tender.budget_inr || 0) / 100000).toFixed(2)} Lakhs
                        </div>
                      </div>

                      <div>
                        <div className="text-zinc-500 font-bold uppercase text-[10px]">Status</div>
                        <div className="text-xs font-bold text-zinc-300 mt-1">
                          {tender.status}
                        </div>
                      </div>
                    </div>

                    {/* Action link */}
                    <div className="flex items-center justify-between pt-1 text-xs font-mono">
                      <span className="text-zinc-500">Citizen Complaint Ledger Entry</span>
                      <Link
                        href={`/tender-complaint?tenderId=${encodeURIComponent(tender.tender_id)}`}
                        className="text-white hover:underline font-bold flex items-center gap-1"
                      >
                        <span>View Tender Profile & Lodge Complaint</span>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-zinc-900 bg-black py-4 text-center text-xs text-zinc-500 font-mono">
        RD SYSTEM • GOVERNMENT ACTION TRACKER
      </footer>
    </div>
  );
}
