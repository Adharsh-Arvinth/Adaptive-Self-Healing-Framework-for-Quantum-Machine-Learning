"use client";

import React, { useState, useEffect } from "react";
import { ArrowDown, FlaskConical, Sparkles, Activity, ShieldCheck, Zap } from "lucide-react";

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
}) => {
  // Interactive circuit state: normal -> anomaly -> self-healed
  const [circuitPhase, setCircuitPhase] = useState<"normal" | "anomaly" | "healed">("normal");
  const [activeGate, setActiveGate] = useState<string | null>(null);

  // Cycle through an educational self-healing loop subtly
  useEffect(() => {
    const timer = setInterval(() => {
      setCircuitPhase((prev) => {
        if (prev === "normal") return "anomaly";
        if (prev === "anomaly") return "healed";
        return "normal";
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section
      id="hero"
      className="relative min-h-[90vh] sm:min-h-[94vh] flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 pt-8 pb-16 overflow-hidden w-full max-w-full bg-[#05070c]"
    >
      {/* Cinematic Ambient Atmosphere Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[680px] h-[340px] sm:h-[680px] bg-gradient-to-tr from-cyan-500/10 via-blue-600/10 to-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#ffffff_1px,transparent_1px),linear-gradient(to_bottom,#ffffff_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col items-center text-center space-y-8 sm:space-y-10">
        {/* Subtle Live Backend Status Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-[11px] font-mono tracking-wide text-slate-300">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isConnected
                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"
            }`}
          />
          <span className="font-medium text-slate-200">
            {isConnected ? "Live Quantum Telemetry Active" : "Simulator Standby"}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-slate-400">Pennylane Closed-Loop VQC</span>
        </div>

        {/* Master Headline: 5-Second Immediate Clarity */}
        <div className="space-y-4 sm:space-y-5 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5rem] font-bold tracking-tight text-white leading-[1.05] uppercase">
            WHEN QUANTUM MODELS FAIL,{" "}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-200">
              INTELLIGENCE RECOVERS.
            </span>
          </h1>

          {/* Master Supporting Text */}
          <p className="max-w-2xl mx-auto text-base sm:text-xl text-slate-300 font-normal leading-relaxed">
            An adaptive self-healing framework that detects, diagnoses and safely repairs failures in variational quantum machine learning.
          </p>
        </div>

        {/* Primary and Secondary Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto pt-2">
          <button
            onClick={onExploreClick}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-semibold text-sm sm:text-base flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all active:scale-[0.98]"
          >
            <span>Explore the Framework</span>
            <ArrowDown className="w-4 h-4 text-slate-800" />
          </button>

          <button
            onClick={onLaunchLabClick}
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl border border-white/20 bg-white/[0.05] hover:bg-white/[0.1] text-white font-semibold text-sm sm:text-base flex items-center justify-center gap-2 backdrop-blur-md transition-all active:scale-[0.98]"
          >
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span>Enter Research Lab</span>
          </button>
        </div>

        {/* Visual Focus: Original Interactive Animated Quantum Circuit */}
        <div className="w-full max-w-3xl pt-4">
          <div className="relative p-5 sm:p-7 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
            {/* Top Circuit Meta Ribbon */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-semibold tracking-wider uppercase text-white">
                  Variational Circuit State
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all ${
                    circuitPhase === "normal"
                      ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                      : circuitPhase === "anomaly"
                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}
                >
                  {circuitPhase === "normal"
                    ? "Normal State"
                    : circuitPhase === "anomaly"
                    ? "Plateau Detected"
                    : "Self-Healed (TS Arm 01)"}
                </span>
              </div>
            </div>

            {/* Qubit Rails Wire Diagram */}
            <div className="py-6 space-y-6 sm:space-y-8 font-mono text-xs select-none">
              {/* Rail 0: |q0> */}
              <div className="relative flex items-center gap-2 sm:gap-4">
                <span className="text-slate-400 text-xs sm:text-sm font-bold w-10 shrink-0">
                  |q₀⟩
                </span>
                <div className="flex-1 relative flex items-center justify-between h-10 px-2 sm:px-4">
                  {/* Copper Wire Line */}
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/20" />

                  {/* Flowing Quantum Pulse */}
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full blur-[3px] transition-all duration-1000 ${
                      circuitPhase === "normal"
                        ? "bg-cyan-400 left-[20%] animate-pulse"
                        : circuitPhase === "anomaly"
                        ? "bg-rose-500 left-[55%]"
                        : "bg-emerald-400 left-[85%]"
                    }`}
                  />

                  {/* Gate 1: H */}
                  <button
                    onMouseEnter={() => setActiveGate("Hadamard (H): Creates equal quantum superposition |0⟩ → (|0⟩+|1⟩)/√2")}
                    onMouseLeave={() => setActiveGate(null)}
                    className="relative z-10 w-9 h-9 rounded-lg bg-slate-900 border border-white/20 hover:border-cyan-400 flex items-center justify-center font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    H
                  </button>

                  {/* Gate 2: Ry(x0) Feature Map */}
                  <button
                    onMouseEnter={() => setActiveGate("Ry(x₀): Classical data feature encoding via rotation")}
                    onMouseLeave={() => setActiveGate(null)}
                    className="relative z-10 px-2.5 h-9 rounded-lg bg-blue-950/80 border border-blue-500/40 hover:border-cyan-400 flex items-center justify-center font-bold text-cyan-300 text-[11px] shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    Ry(x₀)
                  </button>

                  {/* Gate 3: CNOT Control Node */}
                  <div className="relative z-10 w-4 h-4 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />

                  {/* Gate 4: Variational Parameter θ0 */}
                  <button
                    onMouseEnter={() => setActiveGate("Ry(θ₀): Variational parameter adjusted by optimizer")}
                    onMouseLeave={() => setActiveGate(null)}
                    className={`relative z-10 px-2.5 h-9 rounded-lg border font-bold text-[11px] shadow-md transition-all hover:scale-105 active:scale-95 ${
                      circuitPhase === "anomaly"
                        ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                        : circuitPhase === "healed"
                        ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-900 border-white/20 text-slate-200"
                    }`}
                  >
                    Ry(θ₀)
                  </button>

                  {/* Measurement M */}
                  <div className="relative z-10 w-8 h-8 rounded-lg bg-slate-900 border border-white/20 flex items-center justify-center text-[10px] text-slate-400">
                    ⟨Z₀⟩
                  </div>
                </div>
              </div>

              {/* Vertical Entanglement Bus */}
              <div className="relative flex items-center gap-2 sm:gap-4 -my-3 sm:-my-4">
                <span className="w-10 shrink-0" />
                <div className="flex-1 relative flex items-center justify-between px-2 sm:px-4">
                  <div className="w-9" />
                  <div className="w-14" />
                  <div className="w-[2px] h-8 sm:h-10 bg-cyan-400/60 shadow-[0_0_6px_rgba(34,211,238,0.6)] mx-auto" />
                  <div className="w-14" />
                  <div className="w-8" />
                </div>
              </div>

              {/* Rail 1: |q1> */}
              <div className="relative flex items-center gap-2 sm:gap-4">
                <span className="text-slate-400 text-xs sm:text-sm font-bold w-10 shrink-0">
                  |q₁⟩
                </span>
                <div className="flex-1 relative flex items-center justify-between h-10 px-2 sm:px-4">
                  <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-white/20" />

                  <button
                    onMouseEnter={() => setActiveGate("Hadamard (H): Creates superposition on qubit 1")}
                    onMouseLeave={() => setActiveGate(null)}
                    className="relative z-10 w-9 h-9 rounded-lg bg-slate-900 border border-white/20 hover:border-cyan-400 flex items-center justify-center font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    H
                  </button>

                  <button
                    onMouseEnter={() => setActiveGate("Ry(x₁): Classical feature map encoding feature x₁")}
                    onMouseLeave={() => setActiveGate(null)}
                    className="relative z-10 px-2.5 h-9 rounded-lg bg-blue-950/80 border border-blue-500/40 hover:border-cyan-400 flex items-center justify-center font-bold text-cyan-300 text-[11px] shadow-md transition-all hover:scale-105 active:scale-95"
                  >
                    Ry(x₁)
                  </button>

                  {/* CNOT Target Target Ring */}
                  <div className="relative z-10 w-6 h-6 rounded-full border-2 border-cyan-400 flex items-center justify-center text-cyan-400 font-bold text-xs bg-slate-950">
                    +
                  </div>

                  <button
                    onMouseEnter={() => setActiveGate("Rz(θ₁): Variational ansatz phase rotation")}
                    onMouseLeave={() => setActiveGate(null)}
                    className={`relative z-10 px-2.5 h-9 rounded-lg border font-bold text-[11px] shadow-md transition-all hover:scale-105 active:scale-95 ${
                      circuitPhase === "anomaly"
                        ? "bg-rose-950/80 border-rose-500/50 text-rose-300"
                        : circuitPhase === "healed"
                        ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-300"
                        : "bg-slate-900 border-white/20 text-slate-200"
                    }`}
                  >
                    Rz(θ₁)
                  </button>

                  <div className="relative z-10 w-8 h-8 rounded-lg bg-slate-900 border border-white/20 flex items-center justify-center text-[10px] text-slate-400">
                    ⟨Z₁⟩
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Caption / Gate Detail */}
            <div className="border-t border-white/10 pt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate">
                {activeGate || "Hover or tap any gate to inspect mathematical transformation"}
              </span>
              <button
                type="button"
                onClick={() =>
                  setCircuitPhase((prev) =>
                    prev === "normal" ? "anomaly" : prev === "anomaly" ? "healed" : "normal"
                  )
                }
                className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2 shrink-0 ml-2"
              >
                Step Transition
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
