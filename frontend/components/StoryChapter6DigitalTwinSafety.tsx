"use client";

import React, { useState } from "react";
import { Cpu, ShieldCheck, RefreshCw, CheckCircle2, RotateCcw, AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export const StoryChapter6DigitalTwinSafety: React.FC = () => {
  const [outcomeMode, setOutcomeMode] = useState<"commit" | "rollback">("commit");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  return (
    <section id="digital-twin-safety" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#07090e] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 06 &middot; Digital Twin &amp; Safety</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Test before you trust.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            In quantum machine learning, an improper intervention can permanently corrupt parameter weights. Our framework runs a surrogate digital twin sandbox that simulates candidate repairs over horizon H = 3 steps, validated by deterministic safety filters and atomic rollback.
          </p>
        </div>

        {/* Interactive Lifecycle Visualizer */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Interactive Lifecycle Simulator
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                The Safe Deployment Protocol
              </h3>
            </div>

            {/* Outcome Toggle */}
            <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-xs self-start sm:self-auto">
              <button
                onClick={() => setOutcomeMode("commit")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  outcomeMode === "commit"
                    ? "bg-emerald-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(52,211,153,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Simulate Successful Repair (Commit)
              </button>
              <button
                onClick={() => setOutcomeMode("rollback")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  outcomeMode === "rollback"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Simulate Regressive Repair (Rollback)
              </button>
            </div>
          </div>

          {/* 3 Step Deployment Ribbon */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
            {/* Step 1: Sandbox Simulation */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-cyan-400 font-bold">1. SURROGATE TWIN (H=3)</span>
                <Cpu className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                The model state is deepcopied into an isolated surrogate circuit. The candidate repair is stepped 3 iterations forward.
              </p>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[10px] text-slate-400">
                {outcomeMode === "commit" ? "Predicted ΔLoss: -0.084 (Viable)" : "Predicted ΔLoss: +0.120 (At Risk)"}
              </div>
            </div>

            {/* Step 2: Safety Filter Validation */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-amber-400 font-bold">2. SAFETY FILTER GATES</span>
                <ShieldCheck className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                Before deployment, deterministic filters check depth clamp (L ≥ 2) and anti-oscillation circular buffers (W_osc = 4).
              </p>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[10px] text-slate-400">
                L_min check: PASS &middot; W_osc cooldown: CLEAR
              </div>
            </div>

            {/* Step 3: Transactional Outcome */}
            <div
              className={`p-5 rounded-2xl border space-y-3 transition-all ${
                outcomeMode === "commit"
                  ? "bg-emerald-950/20 border-emerald-500/40"
                  : "bg-amber-950/20 border-amber-500/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-bold ${outcomeMode === "commit" ? "text-emerald-400" : "text-amber-400"}`}>
                  3. {outcomeMode === "commit" ? "ATOMIC COMMIT" : "FAIL-SAFE ROLLBACK"}
                </span>
                {outcomeMode === "commit" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <RotateCcw className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-slate-300 font-sans text-xs leading-relaxed">
                {outcomeMode === "commit"
                  ? "Validation window W_val = 3 verified loss decrease. Repair is committed permanently into the model state."
                  : "Validation window detected loss regression. Transactional snapshot immediately restored pre-repair checkpoint."}
              </p>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[10px] text-slate-300 font-bold">
                Status: {outcomeMode === "commit" ? "STATE PERMANENTLY COMMITTED" : "RESTORED VIA CHECKPOINT SNAPSHOT"}
              </div>
            </div>
          </div>

          {/* Transparent Simulation-Only Scientific Disclosure */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-start gap-3 text-xs text-slate-400 font-sans">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong className="text-slate-200">Scientific Disclosure:</strong> The digital twin operates as a simulation-side surrogate running on classical CPU statevectors (PennyLane). It does not guarantee identical convergence on physical quantum hardware (QPU) subject to multi-scale environmental noise.
            </p>
          </div>

          {/* Level 3: Expandable Safety Mathematics for Researchers */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>{showTechnicalDetails ? "Hide safety filter constraints" : "Inspect Level 3: Mathematical Invariant Specifications"}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 space-y-3 text-xs font-mono text-slate-300 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-cyan-400 font-bold block">Anti-Oscillation Cooldown Invariant:</span>
                    <p className="text-slate-400 text-[11px]">
                      If repair arm a was deployed at step t_a, it is ineligible for re-selection until step count satisfies:
                    </p>
                    <code className="text-amber-300 block">t - t_a ≥ W_osc = 4</code>
                  </div>

                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5 space-y-1">
                    <span className="text-cyan-400 font-bold block">Circuit Depth Lower Bound Invariant:</span>
                    <p className="text-slate-400 text-[11px]">
                      The depth reduction arm is strictly disabled when ansatz layer depth equals the minimum bound:
                    </p>
                    <code className="text-amber-300 block">L_t = L_min = 2  ⟹  Arm 02 Ineligible</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
