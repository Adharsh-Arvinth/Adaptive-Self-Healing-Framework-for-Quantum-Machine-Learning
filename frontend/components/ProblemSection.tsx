"use client";

import React, { useState } from "react";
import { Compass, Zap, Sliders, Flame, ShieldAlert, Radio, Info } from "lucide-react";

interface FailureMode {
  id: string;
  name: string;
  code: string;
  signature: string;
  math: string;
  physics: string;
  recovery: string;
  recallRate: string;
  recallStatus: "high" | "gap" | "total_gap";
  icon: React.ElementType;
}

const FAILURE_MODES: FailureMode[] = [
  {
    id: "barren_plateau",
    name: "Barren Plateau",
    code: "F1 // BP",
    signature: "Var[g] < 1e-5 exponentially vanishing",
    math: "Var_θ[∂_k L] ∈ O(2⁻ⁿ)  [Ansatz 2-design, Global Observable]",
    physics: "Under global observables and deep Haar-random unitaries, gradient variances vanish exponentially with qubit count. In our VQC setup, our heuristic detector identifies vanishing variance and parameter stagnation.",
    recovery: "Reduce ansatz circuit depth (L → L - 1) or collapse entanglement to restore non-vanishing gradient variance.",
    recallRate: "64.0% Recall (32/50) • 100% Precision",
    recallStatus: "high",
    icon: Compass,
  },
  {
    id: "lr_misconfiguration",
    name: "LR Misconfiguration",
    code: "F2 // LRM",
    signature: "Loss oscillation / step stagnation",
    math: "η > η_crit ⟹ ΔL_t · ΔL_{t-1} < 0  or  ‖v_t‖ < 1e-4",
    physics: "An improperly scaled learning rate causes optimization to oscillate across steep loss ravines or freeze in place due to under-scaled descent steps.",
    recovery: "Dynamic multiplicative scaling of step size η within clamped safety envelope [1e-4, 1.0].",
    recallRate: "14.0% Recall (7/50) • 20.6% Precision",
    recallStatus: "gap",
    icon: Zap,
  },
  {
    id: "optimizer_instability",
    name: "Optimizer Instability",
    code: "F3 // OPT",
    signature: "Momentum norm surge ||v_t|| > 5.0",
    math: "‖v_t‖ > 5.0 ∧ L_t > L_{t-1}  [Corrupted second-moment buffers]",
    physics: "Adaptive momentum accumulators in Adam/RMSprop explode along ill-conditioned ravines, propelling weights away from the descent basin. Mimics high-frequency stochastic noise.",
    recovery: "Cycle classical optimizer (Adam ↔ RMSprop ↔ SGD) and flush corrupted second-moment velocity buffers.",
    recallRate: "0.0% Recall (0/50) • Total Diagnostic Gap",
    recallStatus: "total_gap",
    icon: Sliders,
  },
  {
    id: "training_divergence",
    name: "Training Divergence",
    code: "F4 // DIV",
    signature: "Non-finite loss (NaN / Inf / Exp)",
    math: "L_t ∉ R_≥0  ∨  ‖∇L_t‖ > 50.0  [Numerical Divergence]",
    physics: "Numerical overflow or excessive parameter jumps cause divergence where matrix operations evaluate non-finite loss values.",
    recovery: "Atomic rollback from snapshot checkpoint and parameter perturbation near identity.",
    recallRate: "64.0% Recall (32/50) • 100% Precision",
    recallStatus: "high",
    icon: Flame,
  },
  {
    id: "persistent_plateau",
    name: "Persistent Plateau",
    code: "F5 // PP",
    signature: "Saddle-point velocity stagnation",
    math: "‖Δθ_t‖ < 1e-4 ∧ ‖∇L_t‖ > 1e-3  [Low-curvature saddle trap]",
    physics: "Optimization trajectories become trapped in low-curvature saddle manifolds where gradient magnitudes are non-zero but directional descent is stalled. Frequently confused with learning rate misconfiguration.",
    recovery: "Perform warm restart with Gaussian parameter perturbation (σ=0.05) or modify feature map.",
    recallRate: "6.0% Recall (3/50) • Severe Diagnostic Gap",
    recallStatus: "gap",
    icon: ShieldAlert,
  },
  {
    id: "noise_degradation",
    name: "Noise Degradation",
    code: "F6 // DEC",
    signature: "Bloch vector radial contraction",
    math: "‖r⃗‖ < 0.90 ⟹ γ = (1 + r²) / 2 < 0.90",
    physics: "Simulated depolarizing and amplitude damping channels contract the density matrix toward the maximally mixed state at the Bloch sphere center.",
    recovery: "Simulation-side analytical inverse-noise correction under radial-contraction model.",
    recallRate: "72.0% Recall (36/50) • 35.0% Precision",
    recallStatus: "high",
    icon: Radio,
  },
];

export const ProblemSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("barren_plateau");
  const selectedMode = FAILURE_MODES.find((m) => m.id === selectedId) || FAILURE_MODES[0];
  const Icon = selectedMode.icon;

  return (
    <section id="the-problem" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/10 section-slate">
      <div className="max-w-7xl mx-auto space-y-14">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>[03 // TAXONOMY OF DIVERGENCE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-white tracking-tight">
            Six Canonical Quantum Failure Modes.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Variational quantum algorithms exhibit specific, mathematically identifiable failure signatures. The framework formalizes six canonical failure modes with continuous real-time diagnostic monitoring.
          </p>
        </div>

        {/* Interactive Mode Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Failure Mode Selector */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-2.5">
            {FAILURE_MODES.map((mode) => {
              const isSelected = mode.id === selectedId;
              const ModeIcon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedId(mode.id)}
                  className={`p-4 rounded-xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-900 border-blue-500 shadow-lg text-white"
                      : "bg-slate-950/60 border-white/10 hover:bg-slate-900/80 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0">
                      <ModeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">
                          {mode.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {mode.code}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-slate-400 block mt-0.5 truncate max-w-[200px] sm:max-w-[260px]">
                        {mode.signature}
                      </span>
                    </div>
                  </div>

                  {mode.recallStatus === "total_gap" && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      0% RECALL
                    </span>
                  )}
                  {mode.recallStatus === "gap" && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      GAP
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Diagnostic Dossier */}
          <div className="lg:col-span-7">
            <div className="p-7 sm:p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-6 specular-border">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 block uppercase">
                      {selectedMode.code} DIAGNOSTIC PROFILE
                    </span>
                    <h3 className="text-2xl font-bold font-display text-white">
                      {selectedMode.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-slate-500 block text-[10px] uppercase">EMPIRICAL SENSITIVITY</span>
                  <span className="font-semibold text-emerald-400">{selectedMode.recallRate}</span>
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                  MATHEMATICAL IDENTIFICATION CRITERION
                </span>
                <div className="p-3.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-blue-300 overflow-x-auto">
                  <code>{selectedMode.math}</code>
                </div>
              </div>

              {/* Physical Phenomenon */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                  PHYSICAL &amp; OPTIMIZATION PHENOMENON
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {selectedMode.physics}
                </p>
              </div>

              {/* Autonomous Countermeasure */}
              <div className="p-4 rounded-xl bg-white/[0.04] border border-white/10 space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs text-white font-semibold">
                  <Info className="w-3.5 h-3.5 text-blue-400" />
                  <span>AUTONOMOUS CLOSED-LOOP COUNTERMEASURE</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedMode.recovery}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
