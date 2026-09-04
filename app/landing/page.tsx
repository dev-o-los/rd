'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Camera,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  Sparkles,
  Cpu,
  Layers
} from 'lucide-react';

export default function LandingPage() {
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [activeStep, setActiveStep] = useState<number>(0);

  const toggleFaq = (idx: number) => {
    setActiveFaq(activeFaq === idx ? null : idx);
  };

  const steps = [
    {
      step: '01',
      title: 'Capture Road Defect',
      description: 'Point your camera at the road pothole. Device GPS coordinates are automatically verified and locked.',
      tag: 'Capture'
    },
    {
      step: '02',
      title: 'Computer Vision Analysis',
      description: 'The neural model assesses asphalt texture, measures cavity depth and width, and calculates pavement condition.',
      tag: 'Verify'
    },
    {
      step: '03',
      title: 'Tender Contract Matching',
      description: 'Coordinates are spatially cross-referenced against active highway maintenance tenders to identify the liable contractor.',
      tag: 'Match'
    },
    {
      step: '04',
      title: 'Statutory Notice Escalation',
      description: 'When 3 citizens log reports on the same road, an official escalation notice is automatically issued to executive engineers.',
      tag: 'Enforce'
    }
  ];

  const faqs = [
    {
      q: 'How does the system distinguish road defects from other photos?',
      a: 'The image recognition model inspects color neutrality, asphalt grain, and surface depth cavities. Photos of non-road surfaces are promptly filtered out.'
    },
    {
      q: 'What is the 3-complaint escalation rule?',
      a: 'When 3 verified reports are filed for the same road stretch, the system automatically escalates the issue to civic engineers for expedited action.'
    },
    {
      q: 'How are contractors identified for a specific road?',
      a: 'The platform compares image GPS coordinates with civic tender zones and active maintenance contracts in the database.'
    },
    {
      q: 'Can I capture reports directly on mobile?',
      a: 'Yes. The web app works in any modern mobile browser with camera and GPS access without requiring an app store download.'
    }
  ];

  const teamMembers = [
    { name: 'Utkarsh', role: 'Architecture & AI Engineering' },
    { name: 'Core Team', role: 'Full-Stack Development' },
    { name: 'Civic Data Division', role: 'Tender Synchronization' }
  ];

  return (
    <div className="min-h-screen bg-black text-white font-[family-name:var(--font-geist-sans),sans-serif] selection:bg-white selection:text-black antialiased">

      {/* ========================================================================= */}
      {/* 1. TOP MINIMALIST NAVBAR (Responsive, clean spacing)                      */}
      {/* ========================================================================= */}
      <header className="fixed top-0 inset-x-0 z-50 bg-black/85 backdrop-blur-md border-b border-zinc-900/80">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105">
              RD
            </div>
            <span className="font-semibold text-base tracking-tight text-zinc-100">
              RoadWatch AI
            </span>
          </Link>

          {/* Minimal Nav Links */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-normal text-zinc-400">
            <a href="#procedure" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
            <Link href="/escalated" className="hover:text-white transition-colors flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              <span>Escalation Board</span>
            </Link>
          </nav>

          {/* Action Button */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-white text-black hover:bg-zinc-200 transition-all active:scale-95 shadow-sm"
            >
              <Camera className="w-4 h-4" />
              <span>Open Scanner</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Catchy tagline, semi-bold, generous desktop spread)      */}
      {/* ========================================================================= */}
      <section className="min-h-screen flex flex-col justify-center items-center relative px-6 sm:px-10 lg:px-16 pt-28 pb-16 text-center">

        {/* Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] lg:w-[1000px] h-[450px] bg-gradient-to-tr from-zinc-800/10 via-zinc-800/25 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="w-full max-w-5xl lg:max-w-6xl mx-auto space-y-8 lg:space-y-10">

          {/* Top Pill Tag */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>CIVIC INFRASTRUCTURE INTELLIGENCE</span>
          </div>

          {/* Tagline: Semi-Bold, Larger Font Size, Increased Width & Spread */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-semibold tracking-tight text-zinc-100 leading-[1.08]">
            Spot every pothole. <br />
            <span className="font-serif italic font-light text-zinc-400">
              Enforce real repairs.
            </span>
          </h1>

          {/* Clean Subheading */}
          <p className="text-base sm:text-lg lg:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Citizen-powered defect detection matched directly with official road maintenance contracts.
          </p>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full bg-white text-black font-medium text-sm sm:text-base hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <span>Scan Road Defect</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/escalated"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-medium text-sm sm:text-base border border-zinc-800 transition-all active:scale-95"
            >
              <ShieldAlert className="w-4 h-4 text-zinc-400" />
              <span>Escalation Board</span>
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. BELOW HERO: PROCEDURE & GUIDE (Spacious, Uncongested Timeline)          */}
      {/* ========================================================================= */}
      <section id="procedure" className="py-28 lg:py-36 border-t border-zinc-900 bg-black">
        <div className="max-w-6xl lg:max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">

          <div className="text-center max-w-2xl mx-auto mb-20 space-y-3">
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              Procedure & Guide
            </span>
            <h2 className="text-3xl sm:text-5xl font-semibold text-zinc-100 tracking-tight">
              How It Works
            </h2>
            <p className="text-sm sm:text-base text-zinc-400">
              Four clear steps from road defect snapshot to contractor legal escalation notice.
            </p>
          </div>

          {/* Spacious Timeline */}
          <div className="relative">
            {/* Center connecting line (Desktop) */}
            <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-px bg-zinc-800/80 -translate-x-1/2" />

            <div className="space-y-12 lg:space-y-16">
              {steps.map((item, idx) => {
                const isEven = idx % 2 === 0;
                return (
                  <div
                    key={item.step}
                    className={`relative flex flex-col md:flex-row items-center gap-8 md:gap-16 lg:gap-24 ${isEven ? 'md:flex-row-reverse' : ''
                      }`}
                  >
                    {/* Content Card with Generous Desktop Spread */}
                    <div className="w-full md:w-1/2">
                      <div
                        onClick={() => setActiveStep(idx)}
                        className={`p-7 sm:p-9 lg:p-10 rounded-3xl border transition-all cursor-pointer ${activeStep === idx
                          ? 'bg-zinc-900/90 border-zinc-700 shadow-[0_0_35px_rgba(255,255,255,0.03)]'
                          : 'bg-zinc-950/50 border-zinc-900 hover:border-zinc-800'
                          }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-mono text-blue-400 font-medium">
                            {item.tag}
                          </span>
                          <span className="text-xs font-mono text-zinc-500 bg-zinc-900/80 px-3 py-1 rounded-full border border-zinc-800">
                            Phase {item.step}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-semibold text-zinc-100 mb-2">
                          {item.title}
                        </h3>
                        <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-normal">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    {/* Timeline Center Node */}
                    <div className="relative z-10 w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center font-mono text-sm font-semibold text-zinc-200 shadow-lg shrink-0">
                      {item.step}
                    </div>

                    {/* Spacer Column for Desktop Balance */}
                    <div className="hidden md:block w-1/2" />
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. BODY SECTION: FEATURES & FAQ (Generous 3-Column Desktop Spread)         */}
      {/* ========================================================================= */}
      <section id="features" className="py-28 lg:py-36 border-t border-zinc-900 bg-zinc-950/40">
        <div className="max-w-6xl lg:max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 space-y-24 lg:space-y-28">

          {/* Key Features Grid: Generous 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            <div className="p-8 sm:p-10 rounded-3xl bg-black border border-zinc-900 space-y-4 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">Pixel-Level Road Verification</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Inspects asphalt texture, measures defect depth and width, and screens out non-road images with high precision.
              </p>
            </div>

            <div className="p-8 sm:p-10 rounded-3xl bg-black border border-zinc-900 space-y-4 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">Spatial Contract Matching</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Cross-references photo GPS coordinates with road maintenance contracts to locate responsible parties and budgets.
              </p>
            </div>

            <div className="p-8 sm:p-10 rounded-3xl bg-black border border-zinc-900 space-y-4 hover:border-zinc-800 transition-colors">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-200">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-100">3-Report Escalation Rule</h3>
              <p className="text-sm text-zinc-400 leading-relaxed font-normal">
                Collective reports on the same road trigger an official escalation notice dispatched directly to executive engineers.
              </p>
            </div>
          </div>

          {/* FAQ Accordion Section: Spacious & Clean */}
          <div id="faq" className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                FAQ
              </span>
              <h2 className="text-2xl sm:text-4xl font-semibold text-zinc-100 tracking-tight">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4 pt-2">
              {faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-zinc-900 bg-black overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-6 sm:p-7 text-left flex items-center justify-between gap-6 cursor-pointer hover:bg-zinc-950 transition-colors"
                  >
                    <span className="text-sm sm:text-base font-medium text-zinc-200">
                      {faq.q}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-500 transition-transform duration-200 shrink-0 ${activeFaq === idx ? 'rotate-180 text-zinc-300' : ''
                        }`}
                    />
                  </button>

                  {activeFaq === idx && (
                    <div className="px-6 pb-6 sm:px-7 sm:pb-7 text-sm text-zinc-400 font-normal leading-relaxed border-t border-zinc-900/60 pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FOOTER (Spacious, Clean Multi-Column Layout)                            */}
      {/* ========================================================================= */}
      <footer className="border-t border-zinc-900 bg-black py-16 text-zinc-400">
        <div className="max-w-6xl lg:max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 space-y-12">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {/* Col 1: Brand & Socials */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
                  RD
                </div>
                <span className="font-semibold text-base text-white">
                  RoadWatch AI
                </span>
              </div>
              <p className="text-sm text-zinc-500 leading-relaxed font-normal max-w-sm">
                Citizen road defect detection and contractor accountability platform.
              </p>

              {/* Social Platform Handles */}
              <div className="flex items-center gap-3 pt-2">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800/80 transition-colors"
                  title="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800/80 transition-colors"
                  title="X (Twitter)"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800/80 transition-colors"
                  title="GitHub"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noreferrer"
                  className="w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white flex items-center justify-center border border-zinc-800/80 transition-colors"
                  title="LinkedIn"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-widest block">
                Platform
              </span>
              <ul className="space-y-2 text-sm text-zinc-400">
                <li>
                  <Link href="/" className="hover:text-white transition-colors">Camera Scanner</Link>
                </li>
                <li>
                  <Link href="/escalated" className="hover:text-white transition-colors">Escalation Board</Link>
                </li>
                <li>
                  <Link href="/tender-complaint" className="hover:text-white transition-colors">Lodge Complaint</Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Team Credits */}
            <div className="space-y-3">
              <span className="text-xs font-mono font-medium text-zinc-300 uppercase tracking-widest block">
                Team Credits
              </span>
              <ul className="space-y-2.5 text-sm">
                {teamMembers.map((member, i) => (
                  <li key={i} className="text-zinc-400">
                    <span className="font-medium text-zinc-200">{member.name}</span>
                    <span className="text-zinc-500 text-xs block mt-0.5">{member.role}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="pt-8 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-zinc-500">
            <div>© 2026 RoadWatch AI.</div>
            <div>Built for Transparent Civic Accountability.</div>
          </div>

        </div>
      </footer>

    </div>
  );
}
