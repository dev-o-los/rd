'use client';

import React from 'react';
import Link from 'next/link';
import PotholeAnalyzer from '@/components/PotholeAnalyzer';
import { Building2, ShieldAlert, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Simple Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-600/30">
              RD
            </div>
            <div>
              <h1 className="text-base font-extrabold text-white tracking-tight">
                Road Tender & Contractor Matcher
              </h1>
              <p className="text-[11px] text-slate-400">
                Match geotagged road defect photos with government tender contracts
              </p>
            </div>
          </div>

          <Link
            href="/escalated"
            className="flex items-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm group"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            <span>Priority Escalation Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Single Page Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        <PotholeAnalyzer />
      </main>

      {/* Simple Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        RD System • Road Tender Matching & Contractor Accountability Platform
      </footer>
    </div>
  );
}
