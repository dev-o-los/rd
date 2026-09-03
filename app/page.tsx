'use client';

import React from 'react';
import Link from 'next/link';
import MobileRoadCapture from '@/components/MobileRoadCapture';
import { ShieldAlert, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Black & White Premium Header */}
      <header className="border-b border-zinc-800/80 bg-black/90 backdrop-blur-md py-4 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm tracking-widest shadow-sm">
              RD
            </div>
            <div>
              <h1 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
                Road Tender & Contractor Matcher
                <span className="text-[10px] bg-zinc-900 text-zinc-300 font-mono font-medium px-2 py-0.5 rounded-full border border-zinc-800">
                  AI SYSTEM
                </span>
              </h1>
              <p className="text-[11px] text-zinc-400">
                Pothole computer vision detection & contractor legal accountability
              </p>
            </div>
          </div>

          <Link
            href="/escalated"
            className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm group"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-zinc-300 group-hover:text-white transition-colors" />
            <span className="hidden sm:inline">Escalation Board</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </header>

      {/* Main Content Area: Simplified, direct, clean */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 md:py-8 flex flex-col justify-center">
        <MobileRoadCapture />
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-900 bg-black py-4 text-center text-xs text-zinc-500 font-mono tracking-tight">
        RD SYSTEM • ROAD DEFECT & CONTRACTOR ACCOUNTABILITY PLATFORM
      </footer>
    </div>
  );
}
