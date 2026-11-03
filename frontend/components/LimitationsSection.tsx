"use client";

import React from "react";
import { AlertOctagon, Scale, ShieldAlert, Cpu, AlertTriangle } from "lucide-react";

export const LimitationsSection: React.FC = () => {
  return (
    <section id="limitations" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/10 section-slate">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>[11 // SCIENTIFIC TRANSPARENCY &amp; THREATS TO VALIDITY]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-white tracking-tight">
            Honest Scientific Limitations &amp; Threats to Validity.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Rigorous scientific evaluation demands transparent disclosure of boundaries. We document where the framework succeeds, where it encounters diagnostic limits, and what theoretical and empirical assumptions govern its findings.
          </p>
        </div>

        {/* 4 Detailed Limitations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Limitation 1: Diagnostic Recall Gaps */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-4 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-amber-400">
                <span className="font-bold uppercase tracking-wider">DIAGNOSTIC CLASSIFIER LIMITATIONS</span>
                <span className="text-slate-500">STAGE 8 N=300</span>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Selective Diagnostic Recall Gaps
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                While the Bayesian diagnostic engine achieves 100% precision on Barren Plateaus (64.0% recall, 32/50) and Training Divergence (64.0% recall, 32/50), it exhibits documented blind spots on complex trajectory modes:
              </p>
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Optimizer Instability (OPT):</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[11px]">
                    0.0% Recall (0 / 50) • Total Gap
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Persistent Plateau (PP):</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                    6.0% Recall (3 / 50) • Severe Gap
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans pt-3 border-t border-white/10">
              Root Cause: High-frequency stochastic parameter fluctuations closely mimic non-faulty exploration steps within standard sliding window sizes (W=5), causing the classifier to abstain or conflate with noise degradation.
            </p>
          </div>

          {/* Limitation 2: Calibration vs Coverage Trade-off */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-4 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-amber-400">
                <span className="font-bold uppercase tracking-wider">BAYESIAN CALIBRATION TRADE-OFF</span>
                <span className="text-slate-500">STAGE 8 N=300</span>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Coverage Collapse Under Calibrated Gate
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Temperature scaling successfully reduced the Brier score (0.8645 → 0.5768) and eliminated observed false positive diagnoses (95.8% → 0% observed), but introduced severe coverage collapse:
              </p>
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Production Gate Coverage (τ=0.60):</span>
                  <span className="font-bold text-white">96.00% (144 / 150)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Calibrated Gate Coverage (τ*=0.840):</span>
                  <span className="font-bold text-amber-400">16.67% (25 / 150)</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed font-sans pt-3 border-t border-white/10">
              Finite-Sample Uncertainty: Zero observed false positives across 72 negative test samples does not prove zero population risk. The Clopper-Pearson 95% exact confidence upper bound is <strong>≤ 4.99%</strong>.
            </p>
          </div>

          {/* Limitation 3: Statevector Simulation Boundary */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-4 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">HARDWARE VALIDATION SCOPE</span>
                <span className="text-blue-400">CPU SIMULATION</span>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Simulation vs Physical QPU Hardware
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                All empirical benchmarks were conducted using PennyLane&apos;s analytical statevector simulator (<code className="text-blue-300">default.qubit</code>) on classical CPU hardware with synthetic noise channels.
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Noise mitigation is strictly implemented as <strong>simulation-side analytical inverse-noise correction under a custom radial-contraction model</strong>, not physical multi-scale zero-noise extrapolation (ZNE) on real physical QPUs.
              </p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <span className="text-xs font-mono text-slate-500 block">No physical superconducting or trapped-ion QPU runs are claimed.</span>
            </div>
          </div>

          {/* Limitation 4: Policy Comparison Significance & Digital Twin Overhead */}
          <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-4 flex flex-col justify-between specular-border">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs text-slate-400">
                <span className="font-bold uppercase tracking-wider">STATISTICAL SIGNIFICANCE &amp; OVERHEAD</span>
                <span className="text-slate-500">POLICY EVIDENCE</span>
              </div>
              <h3 className="text-xl font-bold font-display text-white">
                Statistical Non-Superiority &amp; Twin Cost
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Across 10 random seeds (1,200 episodes), Contextual Thompson Sampling demonstrated lower rollback rates (10.7% vs 23.0% heuristic) and lower reward variance (-4.94 &plusmn; 0.28 vs -5.45 &plusmn; 0.78).
              </p>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                However, paired t-tests for reward superiority yielded <strong>p = 0.0559 vs heuristic</strong>, <strong>p = 0.3282 vs greedy</strong>, and <strong>p = 0.6746 vs random</strong> (none statistically significant at α = 0.05). Furthermore, the Digital Twin lookahead adds a <strong>3.8× circuit evaluation overhead</strong> (191 vs 50 evals) without statistically distinguishable rollback reduction (9.3% vs 10.3%).
              </p>
            </div>
            <div className="pt-3 border-t border-white/10">
              <span className="text-xs font-mono text-slate-500 block">Digital twin is not experimentally proven indispensable for low-depth models.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
