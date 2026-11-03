"use client";

import React from "react";
import { ShieldCheck, RotateCcw, Lock, CheckCircle2, AlertOctagon, History } from "lucide-react";

export const SafetyAndRecoverySection: React.FC = () => {
  return (
    <section id="safety-recovery" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/10 section-cinematic">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>[09 // TRANSACTIONAL INTEGRITY & RECOVERY]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-white tracking-tight">
            Safety Filtering &amp; Atomic Rollback.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Autonomous self-healing requires rigorous safety guarantees. The framework combines operational boundary constraints with in-memory transactional checkpointing, establishing a safe execution boundary around running quantum classifiers.
          </p>
        </div>

        {/* 3 Safety Pillars Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Operational Safety Bounds */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-5 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Operational Safety Bounds
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Prevents hyperparameter values from migrating into unstable regimes. Any proposed mutation outside safe bounds is vetoed before deployment.
              </p>
            </div>

            <ul className="space-y-2.5 font-mono text-xs text-slate-300 pt-4 border-t border-white/10">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Learning Rate: η ∈ [1e-4, 1.0]</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Circuit Depth: L ∈ [2, 8] layers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Max Perturbation: ‖Δθ‖ ≤ 0.25</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Anti-Oscillation Window: W_osc = 4</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Pre-Repair Checkpointing */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-5 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                In-Memory Checkpointing
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Immediately prior to mutation deployment, an in-memory snapshot captures the exact state of variational parameters, optimizer buffers, and RNG states.
              </p>
            </div>

            <ul className="space-y-2.5 font-mono text-xs text-slate-300 pt-4 border-t border-white/10">
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>Exact parameter weights θ_pre</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>Optimizer velocity & momentum states</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>Ansatz configuration & layer count L</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">✓</span>
                <span>NumPy & PennyLane PRNG states</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Validation Window & Rollback */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-5 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Validation &amp; Rollback
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Deployed repairs run inside an observed validation window (W_val = 3). If loss degrades or divergence occurs, the model restores state from snapshot θ_pre.
              </p>
            </div>

            <ul className="space-y-2.5 font-mono text-xs text-slate-300 pt-4 border-t border-white/10">
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✓</span>
                <span>Multi-step evaluation: W_val = 3 steps</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✓</span>
                <span>Automatic rollback on loss surge (&gt; 15%)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✓</span>
                <span>Immediate rollback on NaN / Inf loss</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">✓</span>
                <span>Deterministic restoration of θ_pre weights</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Empirical Evidence Box from Stage 8 Ablation */}
        <div className="p-7 rounded-2xl border border-white/10 bg-white/[0.03] font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-blue-400 font-bold uppercase tracking-wider">
              STAGE 8 ABLATION FINDING // SAFETY FILTER EFFICACY
            </span>
            <span className="text-slate-500">1,200 EXECUTIONS</span>
          </div>
          <p className="text-slate-300 font-sans text-xs sm:text-sm leading-relaxed">
            In the Stage 8 component ablation study, disabling the safety filter caused the rollback rate to surge from <strong>9.3 ± 3.4% to 34.0 ± 18.0%</strong> (a 3.7× increase in critical model destabilization). The safety filter is empirically confirmed as the essential architectural component preventing catastrophic training collapse.
          </p>
        </div>
      </div>
    </section>
  );
};
