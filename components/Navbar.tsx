'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Camera,
  ShieldAlert,
  Menu,
  X,
  Building2,
  CheckCircle2,
  FileText
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [escalatedCount, setEscalatedCount] = useState<number>(2);

  // Fetch live escalated count
  useEffect(() => {
    fetch('/api/complaints')
      .then((res) => res.json())
      .then((data) => {
        if (data.totalTracked !== undefined) {
          setEscalatedCount(data.totalTracked);
        }
      })
      .catch(() => { });
  }, [pathname]);

  // Close mobile menu on page navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-md border-b border-zinc-800/90 transition-all">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm tracking-wider shadow-sm transition-transform group-hover:scale-105">
              RD
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  <span className="hidden sm:inline">Road Tender & Contractor Matcher</span>
                  <span className="sm:hidden">RD Matcher</span>
                </span>
                <span className="text-[9px] font-mono font-bold bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-0.5 rounded-full">
                  AI SYSTEM
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline">
                Pothole computer vision detection & contractor legal accountability
              </span>
            </div>
          </Link>

          {/* Desktop & Tablet Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link
              href="/scan"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${pathname === '/scan'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Camera Scanner</span>
            </Link>

            <Link
              href="/escalated"
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${pathname === '/escalated'
                  ? 'bg-white text-black border-white shadow-sm'
                  : 'text-zinc-300 bg-zinc-900/90 hover:bg-zinc-800 border-zinc-800 hover:border-zinc-700'
                }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-zinc-300" />
              <span>Escalation Board</span>
              <span className="bg-black/60 px-1.5 py-0.5 rounded-full text-[10px] font-mono border border-zinc-800 text-zinc-300">
                {escalatedCount}
              </span>
            </Link>
          </nav>

          {/* Mobile Right Buttons (Compact Escalation Badge + Hamburger) */}
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href="/escalated"
              className="flex items-center gap-1.5 bg-zinc-900 text-zinc-200 border border-zinc-800 hover:bg-zinc-800 px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold"
              title="Escalation Board"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Board</span>
              <span className="bg-black px-1.5 py-0.2 rounded-full text-[10px] text-white">
                {escalatedCount}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white flex items-center justify-center border border-zinc-800 cursor-pointer active:scale-95 transition-all"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-black/95 px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <Link
            href="/scan"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${pathname === '/scan'
                ? 'bg-white text-black'
                : 'text-zinc-300 bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <Camera className="w-4 h-4" />
              <span>Camera Road Scanner</span>
            </div>
            <span className="text-[10px] font-mono opacity-80">CAPTURE</span>
          </Link>

          <Link
            href="/escalated"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${pathname === '/escalated'
                ? 'bg-white text-black'
                : 'text-zinc-300 bg-zinc-950 border border-zinc-800/80 hover:bg-zinc-900'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Priority Escalation Board</span>
            </div>
            <span className="text-[10px] font-mono bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
              {escalatedCount} Active
            </span>
          </Link>

          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between text-[11px] font-mono text-zinc-500 px-1">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>20 Tenders Monitored</span>
            </span>
            <span>UP PWD / LDA</span>
          </div>
        </div>
      )}
    </header>
  );
}
