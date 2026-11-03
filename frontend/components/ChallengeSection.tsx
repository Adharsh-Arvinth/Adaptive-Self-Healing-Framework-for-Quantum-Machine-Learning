"use client";

import React from "react";
import { Layers, Activity, TrendingDown, Cpu, AlertCircle, Compass } from "lucide-react";

export const ChallengeSection: React.FC = () => {
  return (
    <section id="the-challenge" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[02 // THE FOUNDATIONAL CHALLENGE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            The Physics of Failure in Quantum Machine Learning.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Unlike classical deep neural networks, parameterized quantum circuits operate within the geometry of complex Hilbert spaces. Optimization does not merely face poor local minima; it contends with fundamental quantum mechanical barriers that extinguish gradient signals.
          </p>
        </div>

        {/* 3 Editorial Pillars of the QML Training Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Exponential Hilbert Dimensionality */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)]">
              <Compass className="w-5 h-5" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                Haar Measure & Barren Manifolds
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed">
                As qubit count and ansatz depth scale, random parameterized unitaries sample uniformly from the Haar measure. The variance of partial derivatives vanishes exponentially:
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--accent)]">
              <code>Var[∂_k L] ∈ O(2^-n)</code>
            </div>

            <p className="text-xs text-[var(--content-tertiary)] leading-relaxed">
              Classical optimizers receive vanishing signals indistinguishable from zero, trapping training in directionless plateaus.
            </p>
          </div>

          {/* Pillar 2: Parameter-Shift Shot Noise */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--status-warning)]">
              <Activity className="w-5 h-5" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                Stochastic Parameter-Shift Noise
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed">
                Analytical quantum gradients require evaluating expectation values at shifted angles ±π/2. Finite quantum measurement shots introduce non-Gaussian noise:
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--status-warning)]">
              <code>g_k = (⟨H⟩_+ - ⟨H⟩_-) / 2 + ε_shot</code>
            </div>

            <p className="text-xs text-[var(--content-tertiary)] leading-relaxed">
              Shot noise variance compounds along ill-conditioned ravines, destabilizing adaptive momentum accumulators in Adam and RMSprop.
            </p>
          </div>

          {/* Pillar 3: Environmental Decoherence */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-5">
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--status-info)]">
              <Cpu className="w-5 h-5" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                Decoherence & State Contraction
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed">
                Interaction with thermal baths contracts the quantum state toward the maximally mixed state at the Bloch sphere center:
              </p>
            </div>

            <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--status-info)]">
              <code>γ = Tr(ρ²) &lt; 1.0, ‖r⃗‖ → 0</code>
            </div>

            <p className="text-xs text-[var(--content-tertiary)] leading-relaxed">
              Depolarizing channels flatten the optimization landscape into an invariant noisy plateau where no classical descent direction survives.
            </p>
          </div>
        </div>

        {/* Synthesis Callout */}
        <div className="p-6 rounded-2xl glass-panel-subtle border border-[var(--border-subtle)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse" />
            <span className="text-[var(--content-primary)] font-semibold">
              CRITICAL RESEARCH INSIGHT:
            </span>
            <span className="text-[var(--content-secondary)]">
              Manual trial-and-error hyperparameter re-tuning cannot rescue running quantum circuits. Autonomous closed-loop intervention is mandatory.
            </span>
          </div>
          <span className="text-[var(--content-tertiary)] shrink-0 font-bold">
            STAGE 11 SPECIFICATION
          </span>
        </div>
      </div>
    </section>
  );
};
