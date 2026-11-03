"use client";

import React, { useState } from "react";
import { AlertTriangle, Compass, Zap, Sliders, Flame, ShieldAlert, Radio, ArrowUpRight } from "lucide-react";

interface FailureMode {
  id: string;
  name: string;
  code: string;
  signature: string;
  math: string;
  physics: string;
  recovery: string;
  icon: React.ElementType;
  accent: string;
}

const FAILURE_MODES: FailureMode[] = [
  {
    id: "barren_plateau",
    name: "Barren Plateau",
    code: "F1 // BP",
    signature: "Var[g] < 1e-5 exponentially vanishing",
    math: "\\text{Var}_{\\boldsymbol{\\theta}}[\\partial_k \\mathcal{L}] \\in \\mathcal{O}(2^{-n})",
    physics: "In high-dimensional Haar-random Hilbert spaces, the gradient norm concentrates exponentially around zero, rendering classical gradient descent directionless.",
    recovery: "Reduce ansatz circuit depth (L → L - 1) or collapse entanglement to restore non-vanishing gradients.",
    icon: Compass,
    accent: "text-[var(--status-ansatz)] border-[var(--status-ansatz)]/20 bg-[var(--status-ansatz-subtle)]",
  },
  {
    id: "lr_misconfiguration",
    name: "LR Misconfiguration",
    code: "F2 // LRM",
    signature: "Loss oscillation / step stagnation",
    math: "\\eta > \\eta_{\\text{crit}} \\implies \\Delta \\mathcal{L}_{t} \\cdot \\Delta \\mathcal{L}_{t-1} < 0",
    physics: "An improperly scaled learning rate causes optimization to oscillate wildly between energy valley walls or freeze in place due to under-scaled steps.",
    recovery: "Dynamic multiplicative scaling of step size η within calibrated bounds [1e-4, 1.0].",
    icon: Zap,
    accent: "text-[var(--status-warning)] border-[var(--status-warning)]/20 bg-[var(--status-warning-subtle)]",
  },
  {
    id: "optimizer_instability",
    name: "Optimizer Instability",
    code: "F3 // OPT",
    signature: "Momentum norm surge ||v_t|| > 5.0",
    math: "\\|\\mathbf{v}_t\\| > 5.0 \\land \\mathcal{L}_t > \\mathcal{L}_{t-1}",
    physics: "Momentum accumulators in adaptive optimizers (Adam/RMSprop) explode along ill-conditioned ravines, propelling weights away from the descent basin.",
    recovery: "Cycle classical optimizer (Adam ↔ RMSprop ↔ SGD) and flush corrupted second-moment buffers.",
    icon: Sliders,
    accent: "text-[var(--status-info)] border-[var(--status-info)]/20 bg-[var(--status-info-subtle)]",
  },
  {
    id: "training_divergence",
    name: "Training Divergence",
    code: "F4 // DIV",
    signature: "Non-finite loss (NaN / Inf / Exp)",
    math: "\\mathcal{L}_t \\notin \\mathbb{R}_{\\ge 0} \\lor \\|\\nabla \\mathcal{L}\\| > 50.0",
    physics: "Numerical overflow or unstable parameter updates propel weights into regions where the parameter-shift rule evaluates non-finite matrix exponentials.",
    recovery: "Atomic rollback from snapshot checkpoint and parameter perturbation near identity.",
    icon: Flame,
    accent: "text-[var(--status-danger)] border-[var(--status-danger)]/20 bg-[var(--status-danger-subtle)]",
  },
  {
    id: "persistent_plateau",
    name: "Persistent Plateau",
    code: "F5 // PP",
    signature: "Saddle-point velocity stagnation",
    math: "\\|\\Delta \\boldsymbol{\\theta}\\| < 10^{-4} \\land \\|\\nabla \\mathcal{L}\\| > 10^{-3}",
    physics: "Optimization trajectories become trapped in low-curvature saddle manifolds where gradient magnitudes are non-zero but directional progress is stalled.",
    recovery: "Perform warm restart with Gaussian parameter perturbation (σ=0.05) to escape zero-curvature traps.",
    icon: ShieldAlert,
    accent: "text-[var(--accent)] border-[var(--accent)]/20 bg-[var(--accent-subtle)]",
  },
  {
    id: "noise_degradation",
    name: "Noise Degradation",
    code: "F6 // DEC",
    signature: "Bloch vector radial contraction",
    math: "\\|\\vec{r}\\| < 0.90 \\implies \\gamma = \\text{Tr}(\\rho^2) < 0.90",
    physics: "Decoherence and depolarizing channels contract the quantum density matrix toward the maximally mixed state at the Bloch sphere center.",
    recovery: "Simulation-side analytical inverse-noise correction under custom radial-contraction model.",
    icon: Radio,
    accent: "text-[var(--status-purity)] border-[var(--status-purity)]/20 bg-[var(--status-purity-subtle)]",
  },
];

export const ProblemSection: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>("barren_plateau");
  const selectedMode = FAILURE_MODES.find((m) => m.id === selectedId) || FAILURE_MODES[0];
  const Icon = selectedMode.icon;

  return (
    <section id="the-problem" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[01 // THE PROBLEM LANDSCAPE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Why Variational Quantum Circuits Fail To Train.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Unlike classical deep neural networks, quantum variational models navigate highly non-convex, barren Haar-random manifolds subject to unitary decoherence and finite-shot stochastic noise.
          </p>
        </div>

        {/* Master-Detail Interactive Failure Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Failure Selector Strip */}
          <div className="lg:col-span-5 space-y-2.5">
            {FAILURE_MODES.map((mode) => {
              const ItemIcon = mode.icon;
              const isSelected = mode.id === selectedId;

              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedId(mode.id)}
                  className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between ${
                    isSelected
                      ? "glass-panel border-[var(--accent)] shadow-md"
                      : "bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-highlight)]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`p-2 rounded-lg border ${mode.accent}`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[var(--content-primary)]">
                          {mode.name}
                        </span>
                        <span className="text-[10px] font-mono text-[var(--content-tertiary)]">
                          {mode.code}
                        </span>
                      </div>
                      <span className="text-xs text-[var(--content-secondary)] line-clamp-1 font-mono">
                        {mode.signature}
                      </span>
                    </div>
                  </div>

                  <ArrowUpRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[var(--accent)] translate-x-0.5 -translate-y-0.5" : "text-[var(--content-tertiary)]"}`} />
                </button>
              );
            })}
          </div>

          {/* Right Column: Detailed Diagnostic Dossier */}
          <div className="lg:col-span-7">
            <div className="glass-panel p-8 tech-crosshair relative space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${selectedMode.accent}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-display text-[var(--content-primary)]">
                      {selectedMode.name}
                    </h3>
                    <span className="text-xs font-mono text-[var(--content-secondary)]">
                      CANONICAL TAXONOMY ID: {selectedMode.code}
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[11px] font-mono text-[var(--content-secondary)]">
                  MONITORED CONTINUOUSLY
                </div>
              </div>

              {/* Mathematical Formulation */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)]">
                  MATHEMATICAL SIGNATURE & CRITERION
                </span>
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-sm text-[var(--accent)] overflow-x-auto">
                  <code>{selectedMode.math}</code>
                </div>
              </div>

              {/* Physics Mechanism */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)]">
                  PHYSICAL & HILBERT SPACE PHENOMENON
                </span>
                <p className="text-sm text-[var(--content-secondary)] leading-relaxed">
                  {selectedMode.physics}
                </p>
              </div>

              {/* Autonomous Recovery Pathway */}
              <div className="p-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-subtle)] space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--accent)] font-semibold">
                  AUTONOMOUS HEALING INTERVENTION
                </span>
                <p className="text-xs text-[var(--content-primary)] leading-relaxed font-sans font-medium">
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
