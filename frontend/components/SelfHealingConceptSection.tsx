"use client";

import React from "react";
import { ShieldCheck, RotateCcw, Cpu, Zap, Activity, CheckCircle2 } from "lucide-react";

export const SelfHealingConceptSection: React.FC = () => {
  return (
    <section id="self-healing-concept" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] section-luminous">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <span>[04 // THE ARCHITECTURAL PARADIGM]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-slate-900 tracking-tight">
            Autonomous Self-Healing Runtime. <br />
            Closed-Loop Resilience.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
            Traditional machine learning treats training crashes as catastrophic failures requiring human intervention, manual restarts, and guess-and-check hyperparameter tuning. The Adaptive Self-Healing Framework embeds an autonomic control system directly into the runtime execution loop.
          </p>
        </div>

        {/* Comparison Grid: Fragile vs Autonomous Self-Healing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Fragile Conventional Training */}
          <div className="p-8 rounded-2xl border border-red-200 bg-red-50/40 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-red-700 font-bold uppercase tracking-wider">
                  CONVENTIONAL QML TRAINING
                </span>
                <span className="text-red-600/80 font-medium">OPEN-LOOP / FRAGILE</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-slate-900">
                The Failure-Abort Cycle
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                When an anomaly occurs (gradient vanishing, NaN explosion, momentum surge), the optimizer either runs blindly off the cliff or crashes. Quantum compute time and sample budgets are permanently lost.
              </p>
            </div>

            <ul className="space-y-3 font-mono text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <span className="text-red-600 font-bold">✕</span>
                <span>Unmonitored parameter drift into Haar-random barren plateaus</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-600 font-bold">✕</span>
                <span>No root-cause differentiation between optimizer instability and learning rate errors</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-red-600 font-bold">✕</span>
                <span>Irreversible parameter degradation with zero checkpoint rollback</span>
              </li>
            </ul>
          </div>

          {/* Right: Autonomous Self-Healing Platform */}
          <div className="p-8 rounded-2xl border border-emerald-300 bg-white shadow-md space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-emerald-700 font-bold uppercase tracking-wider">
                  ADAPTIVE SELF-HEALING ARCHITECTURE
                </span>
                <span className="text-emerald-600 font-semibold">CLOSED-LOOP / RESILIENT</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-slate-900">
                Proactive Autonomic Recovery
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Telemetry streams are continuously checked against 6 physical anomaly detectors. When faults arise, Bayesian diagnosis classifies the root cause, Contextual Thompson Sampling selects a candidate repair, a Digital Twin validates viability, and transactional rollbacks protect weights against regressions.
              </p>
            </div>

            <ul className="space-y-3 font-mono text-xs text-slate-700">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Continuous multi-variable telemetry (loss, gradient norm, velocity, purity)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Risk-gated Bayesian diagnosis clearing strict confidence threshold (τ = 0.60)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Atomic checkpoint snapshots ensuring exact pre-repair weight restoration on validation failure</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Core Invariants of the Self-Healing Runtime */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
            <span className="text-blue-600 font-bold block uppercase tracking-wide">INVARIANT 01 // NON-INVASIVE</span>
            <p className="text-slate-600 font-sans text-xs leading-relaxed">
              Observation uses analytical parameter-shift evaluations without altering underlying unitary states during healthy steps.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
            <span className="text-amber-600 font-bold block uppercase tracking-wide">INVARIANT 02 // CONFIDENCE-GATED</span>
            <p className="text-slate-600 font-sans text-xs leading-relaxed">
              No repair action is authorized unless primary diagnosis confidence clears τ = 0.60 production gate, preventing reckless mutations.
            </p>
          </div>
          <div className="p-6 rounded-xl bg-white border border-slate-200 space-y-2 shadow-sm">
            <span className="text-emerald-600 font-bold block uppercase tracking-wide">INVARIANT 03 // ROLLBACK PROTECTION</span>
            <p className="text-slate-600 font-sans text-xs leading-relaxed">
              Repairs must survive a W_val = 3 step validation window. Divergence triggers immediate in-memory rollback to snapshot checkpoint.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
