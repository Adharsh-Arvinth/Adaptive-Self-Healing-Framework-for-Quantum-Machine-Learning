"use client";

import React from "react";
import { ShieldCheck, RotateCcw, Lock, CheckCircle2, AlertOctagon, History } from "lucide-react";

export const SafetyAndRecoverySection: React.FC = () => {
  return (
    <section id="safety-recovery" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[09 // TRANSACTIONAL INTEGRITY & RECOVERY]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Safety Filtering & Atomic Rollback.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Autonomous self-healing requires rigorous safety guarantees. The framework combines dynamic non-holonomic safety filters with atomic checkpointing, establishing an ACID-compliant recovery boundary around running quantum classifiers.
          </p>
        </div>

        {/* 3 Safety Pillars Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pillar 1: Non-Holonomic Safety Bounds */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)]">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                Dynamic Safety Filtering
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed font-sans">
                Prevents hyperparameter values from migrating into unstable regimes. Any proposed mutation outside safe bounds is vetoed before deployment.
              </p>
            </div>

            <ul className="space-y-2.5 font-mono text-xs text-[var(--content-secondary)] pt-4 border-t border-[var(--border-subtle)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Learning Rate: η ∈ [1e-4, 1.0]</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Circuit Depth: L ∈ [1, 8] layers</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-success)]">✓</span>
                <span>Max Perturbation: ‖Δθ‖ ≤ 0.25</span>
              </li>
            </ul>
          </div>

          {/* Pillar 2: Pre-Repair Checkpointing */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--status-warning)]">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                Atomic Checkpointing
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed font-sans">
                Immediately prior to mutation deployment, an immutable checkpoint snapshot is written capturing the exact state of parameters, optimizer, and RNG buffers.
              </p>
            </div>

            <ul className="space-y-2.5 font-mono text-xs text-[var(--content-secondary)] pt-4 border-t border-[var(--border-subtle)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-warning)]">✓</span>
                <span>Exact parameter weights θ_pre</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-warning)]">✓</span>
                <span>Optimizer velocity & momentum states</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-warning)]">✓</span>
                <span>NumPy & PennyLane PRNG seeds</span>
              </li>
            </ul>
          </div>

          {/* Pillar 3: Validation Window & Rollback */}
          <div className="glass-panel p-8 tech-crosshair relative space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--status-danger)]">
                <RotateCcw className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                Validation & Atomic Rollback
              </h3>
              <p className="text-sm text-[var(--content-secondary)] leading-relaxed font-sans">
                Deployed repairs run inside a sandboxed validation window (W_val = 3). If loss degrades or divergence occurs, the model restores state with zero data loss.
              </p>
            </div>

            <ul className="space-y-2.5 font-mono text-xs text-[var(--content-secondary)] pt-4 border-t border-[var(--border-subtle)]">
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-danger)]">✓</span>
                <span>Multi-step evaluation: W_val = 3</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-danger)]">✓</span>
                <span>Automatic rollback on loss surge</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--status-danger)]">✓</span>
                <span>100% parameter restoration fidelity</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Empirical Evidence Box from Ablation */}
        <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] font-mono text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <span className="text-[var(--accent)] font-bold uppercase">
              ABLATION STUDY FINDING // SAFETY FILTER EFFICACY
            </span>
            <span className="text-[var(--content-tertiary)]">3,000 EXECUTED EPISODES</span>
          </div>
          <p className="text-[var(--content-secondary)] font-sans text-xs leading-relaxed">
            In the Stage 8 component ablation study, disabling the safety filter caused the rollback rate to surge from <strong>9.3% to 34.0%</strong> (a 3.6× increase in critical model destabilization). The safety filter is empirically confirmed as the essential architectural component preventing catastrophic training collapse.
          </p>
        </div>
      </div>
    </section>
  );
};
