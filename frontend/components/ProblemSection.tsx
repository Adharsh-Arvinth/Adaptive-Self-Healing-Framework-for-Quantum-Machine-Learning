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
    accent: "text-purple-400 border-purple-500/20 bg-purple-500/10",
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
    accent: "text-amber-400 border-amber-500/20 bg-amber-500/10",
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
    accent: "text-blue-400 border-blue-500/20 bg-blue-500/10",
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
    accent: "text-rose-400 border-rose-500/20 bg-rose-500/10",
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
    accent: "text-indigo-400 border-indigo-500/20 bg-indigo-500/10",
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
    accent: "text-cyan-400 border-cyan-500/20 bg-cyan-500/10",
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
            <span>[01 // FAILURE TAXONOMY]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            The Fragile Nature of <br />
            Quantum Intelligence.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Variational Quantum Algorithms operate in exponential, non-convex Hilbert spaces where classical optimization primitives routinely fail.
            Uncontrolled depth causes exponential gradient attenuation, noisy channels destroy state purity, and momentum buffers destabilize.
          </p>
        </div>

        {/* Master-Detail Interactive Failure Mode Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Grid: 6 Canonical Modes */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-3">
            {FAILURE_MODES.map((mode) => {
              const ItemIcon = mode.icon;
              const isSelected = mode.id === selectedId;

              return (
                <div
                  key={mode.id}
                  onClick={() => setSelectedId(mode.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-[var(--bg-surface)] border-[var(--accent)] shadow-md"
                      : "glass-panel-subtle hover:border-[var(--border-highlight)]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${mode.accent}`}>
                      <ItemIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-[var(--content-primary)]">{mode.name}</h3>
                        <span className="text-[10px] font-mono text-[var(--content-tertiary)]">{mode.code}</span>
                      </div>
                      <p className="text-xs text-[var(--content-secondary)] font-mono mt-0.5">{mode.signature}</p>
                    </div>
                  </div>

                  <ArrowUpRight className={`w-4 h-4 transition-transform ${isSelected ? "text-[var(--accent)] translate-x-0.5 -translate-y-0.5" : "text-[var(--content-tertiary)]"}`} />
                </div>
              );
            })}
          </div>

          {/* Right Panel: Deep Physics & Mathematical Breakdown */}
          <div className="lg:col-span-7 glass-panel p-8 tech-crosshair relative space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${selectedMode.accent}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--content-primary)] font-sans">{selectedMode.name}</h3>
                  <span className="text-[11px] text-[var(--content-tertiary)] font-mono">{selectedMode.code}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border border-[var(--status-danger)]/20 text-[10px] font-bold">
                CANONICAL FAILURE CLASS
              </span>
            </div>

            {/* Mathematical Governing Formulation */}
            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                Mathematical Governing Signature
              </span>
              <div className="font-mono text-sm sm:text-base text-[var(--content-primary)] font-bold tracking-tight">
                <code>{selectedMode.math}</code>
              </div>
            </div>

            {/* Physical Mechanism */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                Physical Manifestation in Parameter Space
              </span>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed font-sans">
                {selectedMode.physics}
              </p>
            </div>

            {/* Autonomous Recovery Pathway */}
            <div className="pt-4 border-t border-[var(--border-subtle)] space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono text-[var(--status-success)]">
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span className="font-semibold uppercase tracking-wider">Autonomous Recovery Intervention</span>
              </div>
              <p className="text-xs text-[var(--content-primary)] font-mono leading-relaxed bg-[var(--status-success-subtle)] p-3 rounded-lg border border-[var(--status-success)]/20">
                {selectedMode.recovery}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
