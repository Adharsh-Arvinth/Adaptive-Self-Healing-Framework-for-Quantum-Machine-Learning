"use client";

import React from "react";
import { Terminal, Play, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";

interface FinalCtaSectionProps {
  onLaunchLabClick: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onLaunchLabClick }) => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/10 section-cinematic">
      <div className="max-w-7xl mx-auto">
        <div className="p-10 sm:p-16 rounded-3xl border border-white/10 bg-slate-950 shadow-2xl relative space-y-8 text-center max-w-4xl mx-auto specular-border">
          {/* Sub-badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 font-mono text-xs text-blue-400 mx-auto">
            <span>[12 // RESEARCH COCKPIT ACCESS]</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-white tracking-tight">
              Experience Autonomous Resilience in Action.
            </h2>
            <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto font-sans">
              Test synthetic failure injections, monitor Bayesian root-cause diagnosis, simulate digital twin lookaheads, and observe transactional atomic rollbacks in real time.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchLabClick}
              className="apple-btn px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-3 shadow-[0_0_25px_rgba(37,99,235,0.4)] active:scale-95 transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Interactive Research Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
              target="_blank"
              rel="noreferrer"
              className="apple-btn px-8 py-4 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium text-sm flex items-center gap-2.5 active:scale-95 transition-all"
            >
              <span>Inspect Source on GitHub</span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Production Verification Metadata */}
          <div className="pt-8 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Full-Stack Verified</span>
            </span>
            <span>•</span>
            <span>PennyLane 0.45.1 Statevector</span>
            <span>•</span>
            <span>FastAPI Real-Time WebSockets</span>
            <span>•</span>
            <span>Next.js 14 Production</span>
          </div>
        </div>
      </div>
    </section>
  );
};
