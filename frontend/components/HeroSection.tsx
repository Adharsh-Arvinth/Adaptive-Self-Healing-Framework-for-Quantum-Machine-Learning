"use client";

import React, { useState } from "react";
import { ArrowDownRight, Play, Terminal, Shield, Cpu, Activity, Sparkles, Layers } from "lucide-react";

interface HeroSectionProps {
  onExploreClick: () => void;
  onLaunchLabClick: () => void;
  isConnected: boolean;
  pipelineState: string;
  stepCount: number;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreClick,
  onLaunchLabClick,
  isConnected,
  pipelineState,
  stepCount,
}) => {
  const [activeQubit, setActiveQubit] = useState(0);

  return (
    <section className="relative min-h-[92vh] flex flex-col justify-between pt-12 pb-16 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
      {/* Background Architectural Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.06] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:64px_64px]" />

      {/* Top Telemetry Header HUD Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-[var(--border-subtle)] font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <span className="relative flex h-2 w-2">
              {isConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`}></span>
            </span>
            <span className="text-[var(--content-primary)] font-medium">
              {isConnected ? "WSS TELEMETRY ONLINE" : "BACKEND STANDBY"}
            </span>
          </div>

          <span className="hidden sm:inline-block text-[var(--content-tertiary)]">•</span>
          <span className="hidden sm:inline-block text-[var(--content-secondary)]">
            PENNYLANE 0.45.1 STATEVECTOR ENGINE
          </span>
        </div>

        <div className="flex items-center gap-4 text-[var(--content-secondary)]">
          <span className="hidden md:inline">SYSTEM STATE: <strong className="text-[var(--content-primary)] font-semibold">{pipelineState.replace(/_/g, " ")}</strong></span>
          <span className="hidden md:inline text-[var(--content-tertiary)]">•</span>
          <span>STEP COUNT: <strong className="text-[var(--content-primary)] font-semibold">{stepCount} / 60</strong></span>
        </div>
      </div>

      {/* Main Cinematic Editorial Hero Typography */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center my-auto py-12">
        {/* Left Column: Bold Headline & Editorial Statement */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Autonomous Resilience for Quantum Machine Learning</span>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-display font-extrabold text-[var(--content-primary)] leading-[0.92] tracking-tight uppercase">
            When Quantum <br />
            Models Fail, <br />
            <span className="text-[var(--accent)]">Intelligence</span> <br />
            Recovers.
          </h1>

          <p className="max-w-xl text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans font-normal">
            The world’s first autonomous closed-loop self-healing runtime platform for Variational Quantum Classifiers.
            Diagnosing barren plateaus, non-convex optimizer instability, and environmental decoherence through Contextual Thompson Sampling, pre-deployment digital twin verification, and atomic state rollback.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onLaunchLabClick}
              className="apple-btn px-6 py-3.5 rounded-xl bg-[var(--content-primary)] text-[var(--bg-primary)] font-semibold text-sm flex items-center gap-2.5 shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Research Lab</span>
            </button>

            <button
              onClick={onExploreClick}
              className="apple-btn px-6 py-3.5 rounded-xl glass-panel text-[var(--content-primary)] font-medium text-sm flex items-center gap-2 hover:border-[var(--border-highlight)] active:scale-95 transition-all"
            >
              <span>Explore The Framework</span>
              <ArrowDownRight className="w-4 h-4 text-[var(--content-tertiary)]" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive Quantum Circuit Topology HUD */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-6 tech-crosshair relative">
            {/* HUD Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--content-primary)]">VQC CIRCUIT TOPOLOGY</span>
              </div>
              <div className="flex items-center gap-1.5 text-[var(--content-tertiary)]">
                <span>L=2 ANSATZ</span>
                <span>•</span>
                <span>4 PARAM/GATE</span>
              </div>
            </div>

            {/* Circuit Wire Simulation Graphic */}
            <div className="bg-[var(--bg-subtle)] p-5 rounded-lg border border-[var(--border-subtle)] space-y-4 font-mono text-xs">
              {/* Qubit 0 Wire */}
              <div
                onClick={() => setActiveQubit(0)}
                className={`p-3 rounded-md transition-all cursor-pointer border ${
                  activeQubit === 0
                    ? "bg-[var(--bg-surface)] border-[var(--accent)] shadow-sm"
                    : "border-transparent hover:bg-[var(--bg-surface)]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--content-primary)]">|q₀⟩ Wire Alpha</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--status-success-subtle)] text-[var(--status-success)]">
                    FIDELITY: 99.4%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--content-secondary)]">
                  <span className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-bold">R_y(θ₁)</span>
                  <span>──►</span>
                  <span className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-bold">R_z(θ₂)</span>
                  <span>──●──</span>
                  <span className="px-2 py-1 rounded bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/30 font-bold">CNOT</span>
                </div>
              </div>

              {/* Qubit 1 Wire */}
              <div
                onClick={() => setActiveQubit(1)}
                className={`p-3 rounded-md transition-all cursor-pointer border ${
                  activeQubit === 1
                    ? "bg-[var(--bg-surface)] border-[var(--accent)] shadow-sm"
                    : "border-transparent hover:bg-[var(--bg-surface)]/50"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[var(--content-primary)]">|q₁⟩ Wire Beta</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--status-success-subtle)] text-[var(--status-success)]">
                    FIDELITY: 98.9%
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--content-secondary)]">
                  <span className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-bold">R_y(θ₃)</span>
                  <span>──►</span>
                  <span className="px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-bold">R_z(θ₄)</span>
                  <span>──⊕──</span>
                  <span className="px-2 py-1 rounded bg-[var(--status-ansatz-subtle)] text-[var(--status-ansatz)] border border-[var(--status-ansatz)]/30 font-bold">MEASURE</span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Ribbon below Circuit */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[var(--border-subtle)] font-mono text-[11px]">
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] block">TWIN HORIZON</span>
                <span className="text-[var(--content-primary)] font-semibold mt-0.5 block">H = 3 Steps</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] block">CONFIDENCE GATE</span>
                <span className="text-[var(--content-primary)] font-semibold mt-0.5 block">τ = 0.60 Notch</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] block">ROLLBACK LATENCY</span>
                <span className="text-emerald-500 font-semibold mt-0.5 block">&lt; 1.2 ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Technical Spec strip */}
      <div className="relative z-10 pt-6 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-6 font-mono text-xs">
        <div>
          <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Policy Optimizer</span>
          <span className="text-sm font-semibold text-[var(--content-primary)] mt-0.5 block">Thompson Sampling</span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Contextual Vector</span>
          <span className="text-sm font-semibold text-[var(--content-primary)] mt-0.5 block">12-Dimensional</span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Failure Classification</span>
          <span className="text-sm font-semibold text-[var(--content-primary)] mt-0.5 block">6 Non-Overlapping</span>
        </div>
        <div>
          <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Rollback Integrity</span>
          <span className="text-sm font-semibold text-emerald-500 mt-0.5 block">100% Parameter Restoration</span>
        </div>
      </div>
    </section>
  );
};
