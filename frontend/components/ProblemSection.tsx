"use client";

import React, { useState } from "react";
import { Compass, Zap, Sliders, Flame, ShieldAlert, Radio, AlertOctagon, Info } from "lucide-react";

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
    math: "\\text{Var}_{\\boldsymbol{\\theta}}[\\partial_k \\mathcal{L}] \\in \\mathcal{O}(2^{-n})",
    physics: "Under global observables and deep Haar-random unitaries, gradient variances vanish exponentially with qubit count, leaving classical descent directionless.",
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
    math: "\\eta > \\eta_{\\text{crit}} \\implies \\Delta \\mathcal{L}_{t} \\cdot \\Delta \\mathcal{L}_{t-1} < 0",
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
    math: "\\|\\mathbf{v}_t\\| > 5.0 \\land \\mathcal{L}_t > \\mathcal{L}_{t-1}",
    physics: "Adaptive momentum accumulators in Adam/RMSprop explode along ill-conditioned ravines, propelling weights away from the descent basin.",
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
    math: "\\mathcal{L}_t \\notin \\mathbb{R}_{\\ge 0} \\lor \\|\\nabla \\mathcal{L}\\| > 50.0",
    physics: "Numerical overflow or parameter jumps cause divergence where matrix operations evaluate non-finite loss values.",
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
    math: "\\|\\Delta \\boldsymbol{\\theta}\\| < 10^{-4} \\land \\|\\nabla \\mathcal{L}\\| > 10^{-3}",
    physics: "Optimization trajectories become trapped in low-curvature saddle manifolds where gradient magnitudes are non-zero but directional descent is stalled.",
    recovery: "Perform warm restart with Gaussian parameter perturbation (σ=0.05) to escape zero-curvature traps.",
    recallRate: "6.0% Recall (3/50) • Severe Diagnostic Gap",
    recallStatus: "gap",
    icon: ShieldAlert,
  },
  {
    id: "noise_degradation",
    name: "Noise Degradation",
    code: "F6 // DEC",
    signature: "Bloch vector radial contraction",
    math: "\\|\\vec{r}\\| < 0.90 \\implies \\gamma = \\text{Tr}(\\rho^2) < 0.90",
    physics: "Simulated depolarizing and amplitude damping channels contract the density matrix toward the maximally mixed state (γ = 0.5) at the Bloch sphere center.",
    recovery: "Simulation-side analytical inverse-noise correction under custom radial-contraction model.",
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
    <section id="the-problem" className="py-20 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[04 // TAXONOMY OF DIVERGENCE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Six Canonical Quantum Failure Modes.
          </h2>
          <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
            Variational quantum algorithms exhibit specific, mathematically identifiable failure signatures. The framework formalizes six canonical failure modes with continuous real-time diagnostic monitoring.
          </p>
        </div>

        {/* Interactive Mode Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Failure Mode Selector */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-2">
            {FAILURE_MODES.map((mode) => {
              const isSelected = mode.id === selectedId;
              const ModeIcon = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedId(mode.id)}
                  className={`p-3.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[var(--bg-surface)] border-[var(--accent)] shadow-sm"
                      : "bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-primary)] shrink-0">
                      <ModeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[var(--content-primary)]">
                          {mode.name}
                        </span>
                        <span className="font-mono text-[10px] text-[var(--content-tertiary)]">
                          {mode.code}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--content-secondary)] block mt-0.5 truncate max-w-[200px] sm:max-w-[260px]">
                        {mode.signature}
                      </span>
                    </div>
                  </div>

                  {mode.recallStatus === "total_gap" && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      0% RECALL
                    </span>
                  )}
                  {mode.recallStatus === "gap" && (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                      GAP
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Diagnostic Dossier */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[var(--content-secondary)] block">
                      {selectedMode.code} DIAGNOSTIC PROFILE
                    </span>
                    <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                      {selectedMode.name}
                    </h3>
                  </div>
                </div>

                <div className="text-right font-mono text-[11px]">
                  <span className="text-[var(--content-tertiary)] block text-[9px]">EMPIRICAL SENSITIVITY</span>
                  <span className="font-semibold text-[var(--content-primary)]">{selectedMode.recallRate}</span>
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">
                  MATHEMATICAL CRITERION
                </span>
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--content-primary)] overflow-x-auto">
                  <code>{selectedMode.math}</code>
                </div>
              </div>

              {/* Physical Phenomenon */}
              <div className="space-y-1.5">
                <span className="font-mono text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">
                  PHYSICAL &amp; OPTIMIZATION PHENOMENON
                </span>
                <p className="text-xs sm:text-sm text-[var(--content-secondary)] leading-relaxed font-sans">
                  {selectedMode.physics}
                </p>
              </div>

              {/* Autonomous Countermeasure */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-1.5">
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--content-primary)] font-semibold">
                  <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>AUTONOMOUS COUNTERMEASURE</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
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
