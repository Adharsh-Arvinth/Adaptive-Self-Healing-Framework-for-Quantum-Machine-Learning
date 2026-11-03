"use client";

import React from "react";
import { Compass, Activity, Cpu } from "lucide-react";

export const ChallengeSection: React.FC = () => {
  return (
    <section id="the-challenge" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] section-architectural">
      <div className="max-w-7xl mx-auto space-y-14">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <span>[02 // THE FOUNDATIONAL CHALLENGE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-slate-900 tracking-tight">
            The Physics of Failure in Quantum ML.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
            Unlike classical neural networks, parameterized quantum circuits operate within complex Hilbert spaces. Optimization does not merely face poor local minima; it contends with fundamental quantum mechanical barriers that extinguish gradient signals.
          </p>
        </div>

        {/* 3 Pillars of the QML Training Challenge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Exponential Hilbert Dimensionality */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <Compass className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Haar Measure &amp; Barren Plateaus
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Assuming a global cost observable and an ansatz that forms a 2-design over the unitary group U(2ⁿ), the variance of parameter-shift partial derivatives vanishes exponentially:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 font-bold">
              <code>Var_θ[∂_k L] ∈ O(2⁻ⁿ)</code>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Theoretical assumptions require deep circuits and global observables. In finite-depth VQCs, our framework treats barren plateaus as an empirical telemetry heuristic using variance and velocity thresholds.
            </p>
          </div>

          {/* Pillar 2: Parameter-Shift Shot Noise */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
              <Activity className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Stochastic Parameter-Shift Shot Noise
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Analytical quantum gradients evaluate expectation values at shifted angles ±π/2. Finite quantum measurement shots introduce stochastic variance:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 font-bold">
              <code>g_k = (⟨H⟩₊ - ⟨H⟩₋) / 2 + ε_shot</code>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Shot noise compounds along ill-conditioned ravines, corrupting second-moment accumulators in adaptive optimizers and inducing destructive parameter velocity surges.
            </p>
          </div>

          {/* Pillar 3: Environmental Decoherence */}
          <div className="p-7 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4 hover:border-slate-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-bold font-display text-slate-900">
                Decoherence &amp; Radial Contraction
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-sans">
                Depolarizing and amplitude damping noise channels contract the single-qubit density matrix toward the maximally mixed state at the Bloch center:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900 font-bold">
              <code>γ = Tr(ρ²) = (1 + r²) / 2 &lt; 1.0</code>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-sans">
              Disclosed limitation: Mitigation operates as simulation-side analytical inverse-noise correction under a custom radial-contraction model on PennyLane CPU statevector, not physical multi-scale ZNE.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
