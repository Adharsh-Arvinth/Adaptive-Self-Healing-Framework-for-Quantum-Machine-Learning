"use client";

import React, { useState } from "react";
import { ArrowDownRight, Terminal, Sparkles, Shield, Cpu, Activity, RefreshCw } from "lucide-react";

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
  const [selectedGate, setSelectedGate] = useState<string | null>(null);

  return (
    <section id="hero" className="relative flex flex-col justify-between pt-8 pb-16 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] overflow-hidden">
      {/* Subtle Architectural Grid Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02] dark:opacity-[0.04] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-10">
        {/* Compact Technical Status Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] font-mono text-[11px] text-[var(--content-secondary)]">
          <div className="flex items-center gap-2.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500"}`} />
            <span className="font-semibold text-[var(--content-primary)]">
              {isConnected ? "BACKEND TELEMETRY CONNECTED" : "BACKEND STANDBY"}
            </span>
            <span className="text-[var(--content-tertiary)]">•</span>
            <span className="hidden sm:inline">PennyLane 0.45.1 (CPU Statevector)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--content-tertiary)]">RUNTIME:</span>
              <span className="font-semibold text-[var(--content-primary)]">{pipelineState.replace(/_/g, " ")}</span>
            </div>
            <span className="text-[var(--content-tertiary)]">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--content-tertiary)]">STEP:</span>
              <span className="font-semibold text-[var(--content-primary)]">{stepCount} / 60</span>
            </div>
          </div>
        </div>

        {/* Balanced Two-Column Hero Composition (55% / 45%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Left Column (55%): Controlled Editorial Typography & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-[var(--bg-surface)] text-[var(--content-secondary)] border border-[var(--border-subtle)]">
              <Sparkles className="w-3 h-3 text-[var(--accent)]" />
              <span>Closed-Loop Runtime Resilience for VQCs</span>
            </div>

            {/* Controlled Responsive Headline */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-display font-extrabold text-[var(--content-primary)] leading-[1.08] tracking-tight uppercase">
                When Quantum <br />
                Models Fail, <br />
                <span className="text-[var(--accent)]">Intelligence Recovers.</span>
              </h1>
            </div>

            {/* Concise, Scientifically Rigorous Narrative Description */}
            <p className="max-w-xl text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans font-normal">
              An autonomous closed-loop runtime self-healing architecture for Variational Quantum Classifiers.
              Continuous health monitoring detects anomalies, temperature-calibrated Bayesian inference diagnoses root causes, Contextual Thompson Sampling selects targeted repairs, and surrogate digital-twin simulation enforces atomic transactional recovery.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onLaunchLabClick}
                className="px-5 py-3 rounded-xl bg-[var(--content-primary)] text-[var(--bg-primary)] font-medium text-xs sm:text-sm flex items-center gap-2 shadow-sm hover:opacity-90 active:scale-98 transition-all"
              >
                <Terminal className="w-4 h-4" />
                <span>Open Live Lab</span>
              </button>

              <button
                onClick={onExploreClick}
                className="px-5 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-primary)] font-medium text-xs sm:text-sm flex items-center gap-2 hover:border-[var(--border-highlight)] active:scale-98 transition-all"
              >
                <span>Explore the Framework</span>
                <ArrowDownRight className="w-4 h-4 text-[var(--content-secondary)]" />
              </button>
            </div>
          </div>

          {/* Right Column (45%): Prominent Architectural Quantum Circuit Visual */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-5">
              {/* Circuit Header */}
              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-[var(--accent)]" />
                  <span className="font-semibold text-[var(--content-primary)]">VQC CIRCUIT TOPOLOGY</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--content-secondary)]">
                  <span>2 QUBITS</span>
                  <span>•</span>
                  <span>L=2 ANSATZ</span>
                </div>
              </div>

              {/* Integrated Circuit Rails Diagram */}
              <div className="space-y-4 font-mono text-xs">
                {/* Qubit 0 Rail */}
                <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[var(--content-primary)]">|q₀⟩ Register Wire</span>
                    <span className="text-[10px] text-[var(--content-secondary)]">Angle Embedding</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <button
                      onClick={() => setSelectedGate("R_y(x₀): Classical feature map rotation")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors font-semibold text-[11px]"
                    >
                      Ry(x₀)
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("R_y(θ₁), R_z(θ₂): Parameterized single-qubit rotation")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors font-semibold text-[11px]"
                    >
                      Ry(θ₁)
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("R_z(θ₂): Phase rotation")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors font-semibold text-[11px]"
                    >
                      Rz(θ₂)
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("CNOT (Control): Two-qubit entangling generator")}
                      className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-bold text-[11px]"
                    >
                      ●
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("⟨Z₀⟩: Pauli-Z expectation measurement")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]"
                    >
                      ⟨Z₀⟩
                    </button>
                  </div>
                </div>

                {/* Qubit 1 Rail */}
                <div className="p-3.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-[var(--content-primary)]">|q₁⟩ Register Wire</span>
                    <span className="text-[10px] text-[var(--content-secondary)]">Angle Embedding</span>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                    <button
                      onClick={() => setSelectedGate("R_y(x₁): Classical feature map rotation")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors font-semibold text-[11px]"
                    >
                      Ry(x₁)
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("R_y(θ₃): Parameterized variational rotation")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors font-semibold text-[11px]"
                    >
                      Ry(θ₃)
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("R_z(θ₄): Phase rotation")}
                      className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent)] transition-colors font-semibold text-[11px]"
                    >
                      Rz(θ₄)
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <button
                      onClick={() => setSelectedGate("CNOT (Target): Inverted on control bit")}
                      className="px-2 py-1 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/30 font-bold text-[11px]"
                    >
                      ⊕
                    </button>
                    <span className="text-[var(--content-tertiary)]">─</span>
                    <span className="px-2 py-1 rounded bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--content-tertiary)] text-[10px]">
                      IDLE
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Gate Inspector */}
              <div className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--content-secondary)] flex items-center gap-2">
                <span className="text-[var(--accent)] font-bold shrink-0">OPERATOR:</span>
                <span className="truncate text-[var(--content-primary)]">
                  {selectedGate || "Click any circuit gate above to inspect operator function"}
                </span>
              </div>

              {/* Compact Technical Specs Grid */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-[var(--border-subtle)] font-mono text-center">
                <div>
                  <span className="text-[9px] uppercase text-[var(--content-tertiary)] block">TWIN HORIZON</span>
                  <span className="text-xs font-semibold text-[var(--content-primary)] mt-0.5 block">H = 3 Steps</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[var(--content-tertiary)] block">CALIBRATED GATE</span>
                  <span className="text-xs font-semibold text-[var(--content-primary)] mt-0.5 block">τ* = 0.840</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-[var(--content-tertiary)] block">SAFE ROLLBACK</span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">W_val = 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Technical Specifications Strip (Clean, Grounded) */}
        <div className="pt-6 border-t border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-4 font-sans text-xs">
          <div>
            <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Decision Engine</span>
            <span className="text-xs sm:text-sm font-semibold text-[var(--content-primary)] mt-0.5 block">Contextual Thompson Sampling</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Bandit Context</span>
            <span className="text-xs sm:text-sm font-semibold text-[var(--content-primary)] mt-0.5 block">12-Dimensional Feature Vector</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Failure Classification</span>
            <span className="text-xs sm:text-sm font-semibold text-[var(--content-primary)] mt-0.5 block">6 Locked Categorical Modes</span>
          </div>
          <div>
            <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">Deployment Guarantee</span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 block">In-Memory Checkpoint Snapshot</span>
          </div>
        </div>
      </div>
    </section>
  );
};
