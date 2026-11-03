"use client";

import React from "react";
import { AlertOctagon, Scale, ShieldAlert, Cpu, HelpCircle, ArrowRight } from "lucide-react";

export const LimitationsSection: React.FC = () => {
  return (
    <section id="limitations" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--status-warning)]">
            <span>[11 // SCIENTIFIC TRANSPARENCY & LIMITATIONS]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Honest Scientific Limitations. <br />
            Threats to Validity.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Rigorous quantum research demands uncompromising transparency. We explicitly document where the framework succeeds, where it encounters diagnostic boundaries, and what assumptions govern its findings.
          </p>
        </div>

        {/* 4 Detailed Limitations Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
          {/* Limitation 1: Diagnostic Recall Gaps */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-4 border-[var(--status-warning)]/20">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--status-warning)]">
              <span className="font-bold uppercase tracking-wider">DIAGNOSTIC CLASSIFIER LIMITATION</span>
              <span>STAGE 8 BENCHMARK</span>
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
              Selective Diagnostic Recall Gaps
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              While the Bayesian diagnostic classifier achieves high precision on Barren Plateaus (92.4%) and Training Divergence (94.1%), it exhibits severe blind spots:
            </p>
            <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--content-secondary)]">Optimizer Instability Recall:</span>
                <strong className="text-[var(--status-danger)]">0.0%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--content-secondary)]">Persistent Plateau Recall:</span>
                <strong className="text-[var(--status-danger)]">6.0%</strong>
              </div>
            </div>
            <p className="text-xs text-[var(--content-tertiary)] leading-relaxed font-sans">
              Root Cause: Momentum norm surges heavily overlap with learning-rate oscillations, causing the naive Bayes prior to conflate these failure classes.
            </p>
          </div>

          {/* Limitation 2: Calibration vs Coverage Trade-off */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-4 border-[var(--status-warning)]/20">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--status-warning)]">
              <span className="font-bold uppercase tracking-wider">BAYESIAN CALIBRATION TRADE-OFF</span>
              <span>STAGE 8 BENCHMARK</span>
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
              Coverage Collapse Under Calibrated Gate
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              Temperature scaling successfully reduced the Brier score (0.8645 → 0.5768) and eliminated observed false positives (95.8% → 0%), but caused an extreme coverage collapse:
            </p>
            <div className="p-3.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-[var(--content-secondary)]">Production Gate Coverage (τ=0.60):</span>
                <strong className="text-[var(--status-success)]">96.0%</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--content-secondary)]">Calibrated Gate Coverage:</span>
                <strong className="text-[var(--status-warning)]">16.67%</strong>
              </div>
            </div>
            <p className="text-xs text-[var(--content-tertiary)] leading-relaxed font-sans">
              Zero observed false positives in 72 negative test samples does not prove zero population risk. The Clopper-Pearson 95% exact confidence upper bound is ~4.99%.
            </p>
          </div>

          {/* Limitation 3: Statevector Simulation Boundary */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-4 border-[var(--border-subtle)]">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--content-tertiary)]">
              <span className="font-bold uppercase tracking-wider">HARDWARE VALIDATION SCOPE</span>
              <span>SIMULATION EXPERIMENTS</span>
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
              Simulation vs Physical Hardware
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              All benchmarks were conducted using PennyLane&apos;s exact analytical statevector simulator (`default.qubit`) on classical CPU hardware with synthetic noise channels.
            </p>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              Noise mitigation is strictly implemented as <strong>simulation-side analytical inverse-noise correction under a custom radial-contraction model</strong>, not multi-scale zero-noise extrapolation (ZNE) on real superconducting or trapped-ion QPUs.
            </p>
          </div>

          {/* Limitation 4: Policy Comparison Significance */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-4 border-[var(--border-subtle)]">
            <div className="flex items-center justify-between font-mono text-xs text-[var(--content-tertiary)]">
              <span className="font-bold uppercase tracking-wider">STATISTICAL COMPARISON</span>
              <span>POLICY EVIDENCE</span>
            </div>
            <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
              No Universal Reward Superiority
            </h3>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              Contextual Thompson Sampling demonstrated a lower observed rollback rate (10.7% vs 23.0% heuristic) and lower reward variance (-4.94 ± 0.28 vs -5.45 ± 0.78).
            </p>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
              However, the reward comparison versus heuristic yielded <strong>p = 0.0559</strong>, which fails to reach statistical significance at α = 0.05. TS versus greedy and random comparisons were also not statistically significant. We claim operational stability and reduced rollback risk, not proven universal reward superiority.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
