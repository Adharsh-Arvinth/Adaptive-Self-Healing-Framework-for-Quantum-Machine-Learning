"use client";

import React from "react";
import { Eye, ShieldAlert, Zap, Cpu, AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";

export const DigitalTwinSection: React.FC = () => {
  return (
    <section id="digital-twin" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] section-luminous">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <span>[08 // PREDICTIVE LOOKAHEAD SANDBOX]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-slate-900 tracking-tight">
            Digital Twin Simulation. <br />
            Three-Step Predictive Lookahead.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
            Deploying untested structural changes to a live quantum circuit risks catastrophic unlearning. The framework instantiates an isolated digital twin running an exact H=3 lookahead simulation to pre-screen candidate mutations.
          </p>
        </div>

        {/* 2-Column Architectural Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Visual Simulation Trajectory */}
          <div className="lg:col-span-7 p-8 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900">DIGITAL TWIN SURROGATE SANDBOX (H=3)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] text-slate-600 font-semibold">
                  SURROGATE CIR-REPLICA
                </span>
              </div>

              {/* Step Simulation Pipeline Graphic */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs text-center py-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">STEP h=1</span>
                  <span className="font-bold text-slate-900 block">Apply Mutation</span>
                  <span className="text-[10px] text-blue-600 font-semibold block">Evaluate L(θ+Δθ)</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">STEP h=2</span>
                  <span className="font-bold text-slate-900 block">Surrogate Step</span>
                  <span className="text-[10px] text-blue-600 font-semibold block">Compute Stability</span>
                </div>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-bold">STEP h=3</span>
                  <span className="font-bold text-slate-900 block">Viability Check</span>
                  <span className="text-[10px] text-emerald-600 font-semibold block">ΔL_twin &lt; +20%</span>
                </div>
              </div>

              {/* Viability Rule Box */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-semibold">
                    VIABILITY THRESHOLD REJECTION RULE
                  </span>
                  <span className="text-amber-700 font-bold">REJECTION: ΔL_twin &gt; +20%</span>
                </div>
                <p className="text-slate-600 font-sans leading-relaxed text-xs">
                  If the 3-step projected proxy loss exceeds initial baseline loss by more than 20% (indicating divergence or parameter collapse), the candidate arm is vetoed before touching production weights.
                </p>
              </div>
            </div>

            {/* Stage 8 Benchmark Empirical Disclosure */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 space-y-1.5">
              <div className="flex items-center gap-2 font-mono text-xs text-amber-800 font-bold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>SCIENTIFIC DISCLOSURE: DIGITAL TWIN OVERHEAD &amp; POSTERIOR ISOLATION</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans">
                The digital twin introduces a <strong>3.8× circuit evaluation overhead</strong> (191 vs 50 evaluations). In the Stage 8 ablation, rollback rate with twin was 9.3% vs 10.3% without twin (overlapping 95% CIs; not statistically significant). Importantly, <strong>predicted surrogate rewards NEVER update the bandit posterior</strong>—only verified post-deployment empirical rewards are used for policy updates.
              </p>
            </div>
          </div>

          {/* Right Column: Mathematical Specifications */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                SPECIFICATION 01
              </span>
              <h4 className="font-bold text-base text-slate-900 font-display">
                Parameter State Cloning
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Clones variational parameter tensor θ, circuit configuration C, optimizer velocity buffers v, and NumPy RNG state to prevent cross-contamination.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                SPECIFICATION 02
              </span>
              <h4 className="font-bold text-base text-slate-900 font-display">
                Surrogate Mini-Batch Evaluation
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                Evaluates empirical loss trajectory L_1, L_2, L_3 across 3 lookahead mini-batches using PennyLane&apos;s analytical statevector CPU device.
              </p>
            </div>

            <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                SPECIFICATION 03
              </span>
              <h4 className="font-bold text-base text-slate-900 font-display">
                Bandit Eligibility Filtering
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed font-sans">
                If the twin rejects an arm, it is dynamically purged from the candidate set for that episode. Contextual Thompson Sampling samples exclusively from verified viable arms.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
