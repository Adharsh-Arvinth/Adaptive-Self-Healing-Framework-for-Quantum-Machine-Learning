"use client";

import React from "react";
import { AlertOctagon, Scale, ShieldAlert, Cpu, Sparkles } from "lucide-react";

export const LimitationsSection: React.FC = () => {
  return (
    <section id="limitations" className="py-20 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-sans text-xs font-semibold text-[var(--accent)]">
            <span>[11 // SCIENTIFIC TRANSPARENCY & LIMITATIONS]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Honest Scientific Limitations &amp; Threats to Validity.
          </h2>
          <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
            Rigorous scientific evaluation demands transparent disclosure of boundaries. We document where the framework succeeds, where it encounters diagnostic limits, and what assumptions govern its findings.
          </p>
        </div>

        {/* 4 Detailed Limitations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
          {/* Limitation 1: Diagnostic Recall Gaps */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-amber-600 dark:text-amber-400">
              <span className="font-bold uppercase tracking-wider">DIAGNOSTIC CLASSIFIER LIMITATIONS</span>
              <span>STAGE 8 N=300</span>
            </div>
            <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
              Selective Diagnostic Recall Gaps
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              While the Bayesian diagnostic engine achieves 100% precision on Barren Plateaus (64.0% recall, 32/50) and Training Divergence (64.0% recall, 32/50), it exhibits documented blind spots on complex trajectory modes:
            </p>
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Optimizer Instability (OPT):</span>
                <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 font-bold text-[11px]">
                  0.0% Recall (0 / 50)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Persistent Plateau (PP):</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-[11px]">
                  6.0% Recall (3 / 50)
                </span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed font-sans">
              Root Cause: High-frequency stochastic parameter oscillations mimic non-faulty exploration steps within standard sliding window sizes (W=5), causing the classifier to abstain or conflate with noise degradation.
            </p>
          </div>

          {/* Limitation 2: Calibration vs Coverage Trade-off */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-amber-600 dark:text-amber-400">
              <span className="font-bold uppercase tracking-wider">BAYESIAN CALIBRATION TRADE-OFF</span>
              <span>STAGE 8 N=300</span>
            </div>
            <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
              Coverage Collapse Under Calibrated Gate
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              Temperature scaling successfully reduced the Brier score (0.8645 &rarr; 0.5768) and eliminated observed false positive diagnoses (95.8% &rarr; 0% observed), but introduced severe coverage collapse:
            </p>
            <div className="p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Production Gate Coverage (τ=0.60):</span>
                <span className="font-bold text-[var(--content-primary)]">96.0% (144 / 150)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Calibrated Gate Coverage (τ*=0.840):</span>
                <span className="font-bold text-[var(--accent)]">16.67% (25 / 150)</span>
              </div>
            </div>
            <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed font-sans">
              Finite-Sample Uncertainty: Zero observed false positives in 72 negative test samples does not prove zero population risk. The Clopper-Pearson 95% exact confidence upper bound is <strong>&le; 4.99%</strong>.
            </p>
          </div>

          {/* Limitation 3: Statevector Simulation Boundary */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--content-secondary)]">
              <span className="font-bold uppercase tracking-wider">HARDWARE VALIDATION SCOPE</span>
              <span>CPU SIMULATION</span>
            </div>
            <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
              Simulation vs Physical Hardware
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              All benchmarks were conducted using PennyLane&apos;s analytical statevector simulator (<code>default.qubit</code>) on classical CPU hardware with synthetic noise channels (depolarizing and amplitude damping).
            </p>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              Noise mitigation is strictly implemented as <strong>simulation-side analytical inverse-noise correction under a custom radial-contraction model</strong>, not physical multi-scale zero-noise extrapolation (ZNE) on real superconducting or trapped-ion QPUs.
            </p>
          </div>

          {/* Limitation 4: Policy Comparison Significance & Digital Twin Overhead */}
          <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--content-secondary)]">
              <span className="font-bold uppercase tracking-wider">STATISTICAL COMPARISON & OVERHEAD</span>
              <span>POLICY EVIDENCE</span>
            </div>
            <h3 className="text-lg font-bold font-display text-[var(--content-primary)]">
              Statistical Significance &amp; Twin Overhead
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              Across 10 random seeds (1,200 episodes), Contextual Thompson Sampling demonstrated lower rollback rates (10.7% vs 23.0% heuristic) and lower reward variance (-4.94 &plusmn; 0.28 vs -5.45 &plusmn; 0.78).
            </p>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              However, paired t-tests for reward superiority yielded <strong>p = 0.0559 vs heuristic</strong>, <strong>p = 0.3282 vs greedy</strong>, and <strong>p = 0.6746 vs random</strong> (none statistically significant at &alpha; = 0.05). Furthermore, the Digital Twin lookahead adds a <strong>3.8&times; circuit evaluation overhead</strong> without statistically distinguishable rollback reduction (9.3% vs 10.3%).
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
