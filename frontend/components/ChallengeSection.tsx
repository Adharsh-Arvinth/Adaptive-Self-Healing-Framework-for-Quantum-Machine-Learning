"use client";

import React from "react";
import { Compass, Activity, Cpu } from "lucide-react";

export const ChallengeSection: React.FC = () => {
  return (
    <section id="the-challenge" className="py-20 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[02 // THE FOUNDATIONAL CHALLENGE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            The Physics of Failure in Quantum ML.
          </h2>
          <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
            Unlike classical neural networks, parameterized quantum circuits operate within complex Hilbert spaces. Optimization does not merely face poor local minima; it contends with fundamental quantum mechanical barriers that extinguish gradient signals.
          </p>
        </div>

        {/* 3 Pillars of the QML Training Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Exponential Hilbert Dimensionality */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)]">
              <Compass className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
                Haar Measure &amp; Barren Plateaus
              </h3>
              <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                Assuming a global cost observable and an ansatz that forms a 2-design over the unitary group U(2ⁿ), the variance of parameter-shift partial derivatives vanishes exponentially:
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--content-primary)]">
              <code>Var_θ[∂_k L] &in; O(2⁻ⁿ)</code>
            </div>

            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed font-sans">
              Classical optimizers receive vanishing signals indistinguishable from numerical zero, leaving training directionless. Shallow circuits with local observables mitigate but do not eliminate this trap.
            </p>
          </div>

          {/* Pillar 2: Parameter-Shift Shot Noise */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Activity className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
                Stochastic Parameter-Shift Shot Noise
              </h3>
              <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                Analytical quantum gradients evaluate expectation values at shifted angles &plusmn;π/2. Finite quantum measurement shots introduce stochastic variance:
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--content-primary)]">
              <code>g_k = (⟨H⟩₊ - ⟨H⟩₋) / 2 + ε_shot</code>
            </div>

            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed font-sans">
              Shot noise compounds along ill-conditioned ravines, corrupting second-moment accumulators in adaptive optimizers and inducing optimizer instability.
            </p>
          </div>

          {/* Pillar 3: Environmental Decoherence */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Cpu className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
                Decoherence &amp; Radial Contraction
              </h3>
              <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                Depolarizing and amplitude damping noise channels contract the single-qubit density matrix toward the maximally mixed state at the Bloch center:
              </p>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--content-primary)]">
              <code>γ = Tr(ρ²) &lt; 1.0, ‖r⃗‖ → 0</code>
            </div>

            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed font-sans">
              In this simulation framework, mitigation operates as simulation-side analytical inverse-noise correction under a custom radial-contraction model (not physical multi-scale ZNE).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
