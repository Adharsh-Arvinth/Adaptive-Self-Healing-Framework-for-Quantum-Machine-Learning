"use client";

import React from "react";
import { Eye, ShieldAlert, Zap, Cpu, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export const DigitalTwinSection: React.FC = () => {
  return (
    <section id="digital-twin" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[08 // PREDICTIVE LOOKAHEAD SANDBOX]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Digital Twin Simulation. <br />
            Three-Step Predictive Lookahead.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Deploying untested structural changes to a live quantum circuit risks catastrophic unlearning. The framework instantiates an isolated digital twin running an exact H=3 lookahead simulation to pre-screen candidate mutations.
          </p>
        </div>

        {/* 2-Column Architectural Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Visual Simulation Trajectory */}
          <div className="lg:col-span-7 glass-panel p-8 tech-crosshair relative space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[var(--accent)]" />
                  <span className="font-bold text-[var(--content-primary)]">DIGITAL TWIN SANDBOX (H=3)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[11px] text-[var(--content-secondary)]">
                  CIRCUIT REPLICA
                </span>
              </div>

              {/* Step Simulation Pipeline Graphic */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center py-4">
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">STEP h=1</span>
                  <span className="font-bold text-[var(--content-primary)]">Apply Mutation</span>
                  <span className="text-[10px] text-[var(--accent)] block">Evaluate L(θ+Δθ)</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">STEP h=2</span>
                  <span className="font-bold text-[var(--content-primary)]">Surrogate Step</span>
                  <span className="text-[10px] text-[var(--accent)] block">Check Stability</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">STEP h=3</span>
                  <span className="font-bold text-[var(--content-primary)]">Viability Gate</span>
                  <span className="text-[10px] text-[var(--status-success)] block">Compute ΔL_final</span>
                </div>
              </div>

              {/* Viability Rule Box */}
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--content-tertiary)] uppercase tracking-wider font-semibold">
                    VIABILITY THRESHOLD CONDITION
                  </span>
                  <span className="text-[var(--status-warning)] font-bold">REJECTION CRITERION: ΔL &gt; +20%</span>
                </div>
                <p className="text-[var(--content-secondary)] font-sans leading-relaxed">
                  If the 3-step projected proxy loss exceeds initial baseline loss by more than 20% (indicating runaway divergence or sudden parameter collapse), the candidate arm is vetoed before touching production weights.
                </p>
              </div>
            </div>

            {/* Stage 8 Benchmark Empirical Disclosure */}
            <div className="p-4 rounded-xl border border-[var(--status-warning)]/30 bg-[var(--status-warning-subtle)] space-y-2">
              <div className="flex items-center gap-2 font-mono text-xs text-[var(--status-warning)] font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>SCIENTIFIC DISCLOSURE // STAGE 8 EMPIRICAL EVIDENCE</span>
              </div>
              <p className="text-xs text-[var(--content-primary)] leading-relaxed font-sans">
                The digital twin lookahead incurred a <strong>3.8× circuit evaluation overhead</strong>. In the frozen Stage 8 ablation campaign, it yielded an observed rollback rate of 9.3% (versus 10.3% without twin lookahead)—a marginal improvement that was not statistically significant. The twin serves as an aggressive failsafe rather than a universal performance accelerator.
              </p>
            </div>
          </div>

          {/* Right Column: Mathematical Specifications */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="glass-panel p-6 space-y-3">
              <span className="font-mono text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">
                SPECIFICATION 01
              </span>
              <h4 className="font-bold text-base text-[var(--content-primary)]">
                Parameter State Cloning
              </h4>
              <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                Clones variational parameter tensor θ, circuit configuration C, optimizer velocity buffers v, and NumPy RNG state to prevent cross-contamination.
              </p>
            </div>

            <div className="glass-panel p-6 space-y-3">
              <span className="font-mono text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">
                SPECIFICATION 02
              </span>
              <h4 className="font-bold text-base text-[var(--content-primary)]">
                Surrogate Mini-Batch Evaluation
              </h4>
              <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                Evaluates empirical loss trajectory L_1, L_2, L_3 across 3 lookahead mini-batches using PennyLane&apos;s exact analytical statevector device.
              </p>
            </div>

            <div className="glass-panel p-6 space-y-3">
              <span className="font-mono text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">
                SPECIFICATION 03
              </span>
              <h4 className="font-bold text-base text-[var(--content-primary)]">
                Bandit Eligibility Filtering
              </h4>
              <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                If the twin rejects an arm, it is dynamically purged from the candidate set A_eligible for that episode. The bandit samples exclusively from verified viable arms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
