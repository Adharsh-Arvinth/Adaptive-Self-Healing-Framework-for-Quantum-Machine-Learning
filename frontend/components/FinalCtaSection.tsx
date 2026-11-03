"use client";

import React from "react";
import { Terminal, Play, ExternalLink, ShieldCheck, ArrowRight } from "lucide-react";

interface FinalCtaSectionProps {
  onLaunchLabClick: () => void;
}

export const FinalCtaSection: React.FC<FinalCtaSectionProps> = ({ onLaunchLabClick }) => {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel p-10 sm:p-16 tech-crosshair relative space-y-8 text-center max-w-4xl mx-auto">
          {/* Sub-badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--accent)] mx-auto">
            <span>[12 // RESEARCH COCKPIT ACCESS]</span>
          </div>

          {/* Headline */}
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
              Experience Autonomous Resilience in Action.
            </h2>
            <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed max-w-2xl mx-auto font-sans">
              Test synthetic failure injections, monitor Bayesian root-cause diagnosis, simulate digital twin lookaheads, and observe transactional atomic rollbacks in real time.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={onLaunchLabClick}
              className="apple-btn px-8 py-4 rounded-xl bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold text-sm flex items-center gap-3 shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <Terminal className="w-4 h-4" />
              <span>Launch Interactive Research Lab</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <a
              href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git"
              target="_blank"
              rel="noreferrer"
              className="apple-btn px-8 py-4 rounded-xl glass-panel text-[var(--content-primary)] font-medium text-sm flex items-center gap-2.5 hover:border-[var(--border-highlight)] active:scale-95 transition-all"
            >
              <span>Inspect Source on GitHub</span>
              <ExternalLink className="w-4 h-4 text-[var(--content-tertiary)]" />
            </a>
          </div>

          {/* Production Verification Metadata */}
          <div className="pt-8 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-center gap-6 font-mono text-xs text-[var(--content-tertiary)]">
            <span className="flex items-center gap-1.5 text-[var(--status-success)]">
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
