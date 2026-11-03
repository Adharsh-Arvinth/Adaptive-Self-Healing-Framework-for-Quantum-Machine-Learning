"use client";

import React, { useState } from "react";
import { ArrowDownRight, Terminal, Sparkles, Cpu, Sliders, Play, RotateCcw, ShieldCheck, Zap } from "lucide-react";

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
  const [selectedGate, setSelectedGate] = useState<string>("Ry(θ₁): Parameterized single-qubit variational rotation around Y-axis");
  const [gateParam, setGateParam] = useState<number>(0.785); // π/4 default

  return (
    <section
      id="hero"
      className="relative min-h-[92vh] flex flex-col justify-between pt-10 pb-16 px-4 sm:px-6 lg:px-12 section-cinematic overflow-hidden"
    >
      {/* Subtle Specular Ambient Gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[450px] bg-amber-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Subtle Precision Grid Backdrop */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-12">
        {/* Top Status & Simulator Telemetry Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-2.5 px-4 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md font-mono text-[11px] text-slate-300">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]"
                  : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
              }`}
            />
            <span className="font-semibold text-white tracking-wide">
              {isConnected ? "BACKEND TELEMETRY CONNECTED" : "BACKEND STANDBY"}
            </span>
            <span className="text-slate-600">•</span>
            <span className="hidden sm:inline text-slate-400">PennyLane 0.45.1 • CPU Statevector Engine</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">RUNTIME:</span>
              <span className="font-semibold text-emerald-400">{pipelineState.replace(/_/g, " ")}</span>
            </div>
            <span className="text-slate-600">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">STEP:</span>
              <span className="font-semibold text-white">{stepCount} / 60</span>
            </div>
          </div>
        </div>

        {/* Cinematic Main Hero Grid: 52% Editorial Narrative / 48% Large Architectural Quantum Circuit */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center pt-2">
          {/* Left Column: Authoritative Editorial Storytelling */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono tracking-wider uppercase bg-white/[0.05] text-blue-400 border border-blue-500/20">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Closed-Loop Runtime Resilience for VQCs</span>
            </div>

            {/* Exact Master Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-[3.75rem] font-display font-extrabold text-white tracking-tight leading-[1.06] uppercase">
              When Quantum <br />
              Models Fail, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-sky-300 to-amber-200">
                Intelligence Recovers.
              </span>
            </h1>

            {/* Exact Master Supporting Statement */}
            <p className="max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed font-sans font-normal">
              An adaptive self-healing framework that monitors, diagnoses and safely repairs failures in variational quantum machine learning workflows.
            </p>

            <p className="max-w-xl text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
              Continuous sliding-window telemetry detects anomalous divergence, Bayesian inference diagnoses root causes across 6 failure modes, Contextual Thompson Sampling evaluates repair actuators, and surrogate digital-twin simulation enforces fail-safe rollback recovery.
            </p>

            {/* Primary Action Controls */}
            <div className="flex flex-wrap items-center gap-3.5 pt-3">
              <button
                onClick={onLaunchLabClick}
                className="apple-btn px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm flex items-center gap-2.5 shadow-[0_0_20px_rgba(37,99,235,0.35)] active:scale-95 transition-all"
              >
                <Terminal className="w-4 h-4" />
                <span>Open Live Lab</span>
              </button>

              <button
                onClick={onExploreClick}
                className="apple-btn px-6 py-3.5 rounded-xl border border-white/15 bg-white/[0.05] hover:bg-white/[0.1] text-white font-medium text-sm flex items-center gap-2 active:scale-95 transition-all"
              >
                <span>Explore the Framework</span>
                <ArrowDownRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Large, Prominent Architectural Quantum Circuit Visual */}
          <div className="lg:col-span-6">
            <div className="p-6 sm:p-7 rounded-2xl border border-white/10 bg-slate-950/80 backdrop-blur-xl shadow-2xl space-y-5 specular-border">
              {/* Circuit Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="font-semibold text-white tracking-wide">VARIATIONAL QUANTUM CIRCUIT TOPOLOGY</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">2 QUBITS</span>
                  <span>•</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">L = 2 LAYERS</span>
                </div>
              </div>

              {/* Quantum Circuit Rails with Interactive Gates */}
              <div className="space-y-4 font-mono text-xs">
                {/* Qubit 0 Rail */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      |q₀⟩ Register Wire
                    </span>
                    <span className="text-[10px] text-slate-400">Hilbert Dim: 2² = 4</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    <button
                      onClick={() => setSelectedGate("Ry(x₀): Classical feature map encoding x₀ = arctan(feature)")}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold hover:bg-blue-500/20 transition-all text-xs"
                    >
                      Ry(x₀)
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate(`Ry(θ₁): Parameterized variational rotation θ₁ = ${gateParam.toFixed(3)} rad`)}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold hover:border-blue-400 transition-all text-xs shadow-sm"
                    >
                      Ry(θ₁)
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate("Rz(θ₂): Variational phase rotation around Z-axis")}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold hover:border-blue-400 transition-all text-xs"
                    >
                      Rz(θ₂)
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate("CNOT (Control): Entangles |q₀⟩ and |q₁⟩ generating non-classical quantum state correlation")}
                      className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center shrink-0 hover:scale-110 transition-all text-sm"
                      title="CNOT Control"
                    >
                      ●
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate("⟨Z₀⟩: Pauli-Z expectation value measurement for binary classification: ŷ = sign(⟨Z₀⟩)")}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/25 transition-all text-xs"
                    >
                      ⟨Z₀⟩
                    </button>
                  </div>
                </div>

                {/* Qubit 1 Rail */}
                <div className="p-4 rounded-xl border border-white/10 bg-black/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-indigo-400" />
                      |q₁⟩ Register Wire
                    </span>
                    <span className="text-[10px] text-slate-400">Angle Embedding U_Φ(x)</span>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto py-2">
                    <button
                      onClick={() => setSelectedGate("Ry(x₁): Classical feature map encoding x₁ = arctan(feature)")}
                      className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold hover:bg-blue-500/20 transition-all text-xs"
                    >
                      Ry(x₁)
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate("Ry(θ₃): Parameterized variational rotation in layer 1")}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold hover:border-blue-400 transition-all text-xs"
                    >
                      Ry(θ₃)
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate("Rz(θ₄): Variational phase rotation in layer 1")}
                      className="px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white font-bold hover:border-blue-400 transition-all text-xs"
                    >
                      Rz(θ₄)
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <button
                      onClick={() => setSelectedGate("CNOT (Target): Bit-flip on |q₁⟩ conditioned on |q₀⟩")}
                      className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-400 text-blue-300 font-bold flex items-center justify-center shrink-0 hover:scale-110 transition-all text-sm"
                      title="CNOT Target"
                    >
                      ⊕
                    </button>
                    <span className="text-slate-600 font-bold">───</span>
                    <span className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-500 text-xs">
                      IDLE
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Gate Inspector */}
              <div className="p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs font-mono text-slate-300 flex items-start gap-2.5">
                <span className="text-blue-400 font-bold shrink-0 uppercase tracking-wider text-[10px] mt-0.5">
                  OPERATOR INSPECTOR:
                </span>
                <span className="text-white text-xs leading-relaxed">{selectedGate}</span>
              </div>

              {/* Exact Architecture Specification Strip */}
              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10 font-mono text-center">
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] uppercase text-slate-500 block">TWIN LOOKAHEAD</span>
                  <span className="text-xs font-bold text-white mt-0.5 block">H = 3 Steps</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] uppercase text-slate-500 block">DIAGNOSTIC GATE</span>
                  <span className="text-xs font-bold text-blue-400 mt-0.5 block">τ = 0.60 Prod</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
                  <span className="text-[10px] uppercase text-slate-500 block">SAFE VALIDATION</span>
                  <span className="text-xs font-bold text-emerald-400 mt-0.5 block">W_val = 3</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Technical Specifications Strip (Apple / Motorsport Quality) */}
        <div className="pt-8 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-6 font-sans">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Decision Engine</span>
            <span className="text-sm font-semibold text-white mt-1 block">Contextual Thompson Sampling</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Bayesian linear posterior updates</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">State Context</span>
            <span className="text-sm font-semibold text-white mt-1 block">12-Dimensional Vector</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Empirical state representation</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Failure Taxonomy</span>
            <span className="text-sm font-semibold text-white mt-1 block">6 Categorical Failure Modes</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Calibrated Bayesian diagnosis</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono block">Recovery Invariant</span>
            <span className="text-sm font-semibold text-emerald-400 mt-1 block">Transactional Checkpointing</span>
            <span className="text-[11px] text-slate-400 block mt-0.5">Automatic rollback on divergence</span>
          </div>
        </div>
      </div>
    </section>
  );
};
