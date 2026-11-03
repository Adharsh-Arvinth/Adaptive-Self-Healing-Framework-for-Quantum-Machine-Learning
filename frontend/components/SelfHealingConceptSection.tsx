"use client";

import React from "react";
import { ShieldCheck, RotateCcw, Cpu, Zap, Activity, CheckCircle2 } from "lucide-react";

export const SelfHealingConceptSection: React.FC = () => {
  return (
    <section id="self-healing-concept" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[04 // THE ARCHITECTURAL PARADIGM]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Autonomous Self-Healing Runtime. <br />
            Closed-Loop Resilience.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Traditional machine learning treats training crashes as catastrophic failures requiring human intervention, manual restarts, and guess-and-check hyperparameter tuning. The Adaptive Self-Healing Framework embeds an autonomous autonomic control system directly into the runtime execution loop.
          </p>
        </div>

        {/* Comparison Grid: Naive Approach vs Autonomous Self-Healing */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Left: Fragile Conventional Training */}
          <div className="p-8 rounded-2xl border border-[var(--status-danger)]/20 bg-[var(--status-danger-subtle)] space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--status-danger)] font-bold uppercase tracking-wider">
                  CONVENTIONAL QML TRAINING
                </span>
                <span className="text-[var(--status-danger)]/70">OPEN-LOOP / FRAGILE</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-[var(--content-primary)]">
                The Failure-Abort Cycle
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed">
                When an anomaly occurs (gradient vanishing, NaN explosion, momentum surge), the optimizer either runs blindly off the cliff or crashes. Quantum compute time and sample budgets are permanently lost.
              </p>
            </div>

            <ul className="space-y-3 font-mono text-xs text-[var(--content-secondary)]">
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--status-danger)] font-bold">✕</span>
                <span>Unmonitored parameter drift into Haar-random barren plateaus</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--status-danger)] font-bold">✕</span>
                <span>No root-cause differentiation between optimizer instability and learning rate errors</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-[var(--status-danger)] font-bold">✕</span>
                <span>Irreversible weight degradation with zero checkpoint rollback</span>
              </li>
            </ul>
          </div>

          {/* Right: Autonomous Self-Healing Platform */}
          <div className="p-8 rounded-2xl glass-panel border-[var(--status-success)]/30 space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-[var(--status-success)] font-bold uppercase tracking-wider">
                  ADAPTIVE SELF-HEALING ARCHITECTURE
                </span>
                <span className="text-[var(--status-success)] font-semibold">CLOSED-LOOP / RESILIENT</span>
              </div>
              <h3 className="text-2xl font-bold font-display text-[var(--content-primary)]">
                Proactive Autonomic Recovery
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed">
                Telemetry streams are continuously checked against 6 physical anomaly detectors. When faults arise, Bayesian diagnosis classifies the root cause, Contextual Thompson Sampling selects a candidate repair, a Digital Twin validates viability, and transactional rollbacks protect weights against regressions.
              </p>
            </div>

            <ul className="space-y-3 font-mono text-xs text-[var(--content-secondary)]">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span>Continuous multi-variable telemetry (loss, gradient norm, velocity, purity)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span>Risk-gated Bayesian diagnosis clearing strict confidence threshold (τ = 0.60)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />
                <span>Atomic checkpoint snapshots ensuring 100% parameter restoration on validation failure</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 3 Core Invariants of the Self-Healing Runtime */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-mono text-xs">
          <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <span className="text-[var(--accent)] font-bold block">INVARIANT 01 // NON-INVASIVE</span>
            <p className="text-[var(--content-secondary)] font-sans text-xs">
              Observation uses analytical parameter-shift evaluations without altering underlying unitary states during healthy steps.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <span className="text-[var(--status-warning)] font-bold block">INVARIANT 02 // RISK GATED</span>
            <p className="text-[var(--content-secondary)] font-sans text-xs">
              Interventions require both Bayesian confidence clearance and digital-twin predictive viability before mutation deployment.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
            <span className="text-[var(--status-success)] font-bold block">INVARIANT 03 // ZERO DATA LOSS</span>
            <p className="text-[var(--content-secondary)] font-sans text-xs">
              Every deployed repair is sandboxed in a 3-step validation window (W_val = 3). Any negative delta triggers instant transactional rollback.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
