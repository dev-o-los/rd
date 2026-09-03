'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import MobileRoadCapture from '@/components/MobileRoadCapture';

export default function Home() {
  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-white selection:text-black">
      {/* Responsive Navbar for Mobile, Tablet, and Desktop */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-5 sm:py-7 flex flex-col justify-center">
        <MobileRoadCapture />
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-zinc-900 bg-black py-4 text-center text-xs text-zinc-500 font-mono tracking-tight">
        RD SYSTEM • ROAD DEFECT & CONTRACTOR ACCOUNTABILITY PLATFORM
      </footer>
    </div>
  );
}
