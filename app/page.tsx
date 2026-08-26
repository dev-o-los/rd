'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import MobileRoadCapture from '@/components/MobileRoadCapture';
import PotholeAnalyzer from '@/components/PotholeAnalyzer';
import { Camera, ShieldAlert, ArrowRight, Smartphone, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function Home() {
  const [activeMode, setActiveMode] = useState<'mobile_camera' | 'advanced_analyzer'>('mobile_camera');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Sleek App Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md py-3.5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-700 to-indigo-500 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-600/30">
              RD
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-1.5">
                Road Tender & Contractor Matcher
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-500/30 hidden sm:inline-block">
                  AI Powered
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Capture road photos to auto-detect responsible contractors & lodge complaints
              </p>
            </div>
          </div>

          <Link
            href="/escalated"
            className="flex items-center gap-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-sm group"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Priority Board</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Mode Switcher Tabs */}
      <div className="max-w-md mx-auto w-full px-4 pt-6 pb-2">
        <div className="bg-slate-900/80 p-1 rounded-2xl border border-slate-800 flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveMode('mobile_camera')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'mobile_camera'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Camera Capture</span>
          </button>

          <button
            onClick={() => setActiveMode('advanced_analyzer')}
            className={`flex-1 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeMode === 'advanced_analyzer'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Manual & Batch Tool</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 md:py-6">
        {activeMode === 'mobile_camera' ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <MobileRoadCapture />
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            <PotholeAnalyzer />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        RD System • Road Tender Matching & Contractor Accountability Platform
      </footer>
    </div>
  );
}
