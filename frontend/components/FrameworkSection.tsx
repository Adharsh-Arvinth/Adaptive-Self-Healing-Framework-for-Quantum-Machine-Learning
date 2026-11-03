"use client";

import React, { useState } from "react";
import { Activity, Search, ShieldAlert, Cpu, Eye, CheckCircle2, Play, BookOpen, ArrowRight } from "lucide-react";

interface LifecycleStage {
  id: string;
  number: string;
  title: string;
  operation: string;
  invariant: string;
  runtimeState: string;
  icon: React.ElementType;
}

const LIFECYCLE_STAGES: LifecycleStage[] = [
  {
    id: "monitor",
    number: "01",
    title: "Monitor",
    operation: "Continuous Parameter-Shift Telemetry",
    invariant: "Sample mini-batch loss L_t, calculate full parameter-shift gradient vector g_t = [∂_1 L, ..., ∂_p L], and compute velocity v_t = ||θ_t - θ_{t-1}||.",
    runtimeState: "HEALTHY_TRAINING",
    icon: Activity,
  },
  {
    id: "detect",
    number: "02",
    title: "Detect",
    operation: "Sliding Window Anomaly Verification",
    invariant: "Evaluate rolling variance Var(g), loss stagnation counter, and Bloch vector contraction against calibrated physical bounds [1e-5, 50.0].",
    runtimeState: "ANOMALY_DETECTED",
    icon: Search,
  },
  {
    id: "diagnose",
    number: "03",
    title: "Diagnose",
    operation: "Bayesian Posterior Categorical Inference",
    invariant: "Compute evidence likelihoods across all 6 non-overlapping failure classes. Apply production confidence gate: clearance requires argmax(P) ≥ 0.60.",
    runtimeState: "DIAGNOSING / CONFIDENCE_GATE",
    icon: ShieldAlert,
  },
  {
    id: "select",
    number: "04",
    title: "Select",
    operation: "Contextual Thompson Sampling Action Draw",
    invariant: "Sample parameter vectors θ_k ~ N(μ_k, σ_k^2 (X_k^T X_k)^-1) conditioned on 12D state vector. Safety filter eliminates oscillating arms (W_osc=4).",
    runtimeState: "REPAIR_SELECTION",
    icon: Cpu,
  },
  {
    id: "simulate",
    number: "05",
    title: "Simulate",
    operation: "Digital Twin Forward Verification (H=3)",
    invariant: "Clone live model state and forward-simulate 3 candidate steps. If predicted loss delta ΔL_pred ≥ 0, candidate is rejected before physical mutation.",
    runtimeState: "DIGITAL_TWIN_SIMULATING",
    icon: Eye,
  },
  {
    id: "validate",
    number: "06",
    title: "Validate",
    operation: "Transactional Multi-Step Observation",
    invariant: "Capture immutable in-memory checkpoint. Execute candidate repair and observe post-repair loss across validation window W_val = 3 iterations.",
    runtimeState: "VALIDATING_REPAIR",
    icon: CheckCircle2,
  },
  {
    id: "deploy",
    number: "07",
    title: "Deploy / Rollback",
    operation: "Atomic Commit or Zero-Regression Rollback",
    invariant: "If L_post ≤ L_pre: permanently commit repair. If average regression > 15% or NaN occurs: execute atomic rollback from pre-repair checkpoint snapshot.",
    runtimeState: "COMMITTED / ROLLED_BACK",
    icon: Play,
  },
  {
    id: "learn",
    number: "08",
    title: "Learn",
    operation: "Persistent Memory & Posterior Update",
    invariant: "Calculate empirical reward R = 0.40ΔL + 0.25ΔAcc - 0.15Pen - ... Update Bayesian posterior using verified empirical reward only. Commit episode to SQLite.",
    runtimeState: "POLICY_UPDATED",
    icon: BookOpen,
  },
];

export const FrameworkSection: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>("monitor");
  const activeStage = LIFECYCLE_STAGES.find((s) => s.id === activeStageId) || LIFECYCLE_STAGES[0];
  const Icon = activeStage.icon;

  return (
    <section id="the-framework" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[02 // AUTONOMOUS ARCHITECTURE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            The Closed-Loop <br />
            Self-Healing Lifecycle.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            An uninterrupted MAPE-K feedback loop executing parameter monitoring, Bayesian root-cause isolation, digital twin lookahead simulation, and transactional state-machine rollback recovery.
          </p>
        </div>

        {/* 8-Stage Interactive Process Pipeline Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
          {LIFECYCLE_STAGES.map((stage) => {
            const StageIcon = stage.icon;
            const isActive = stage.id === activeStageId;

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isActive
                    ? "bg-[var(--content-primary)] text-[var(--bg-primary)] border-[var(--content-primary)] shadow-md"
                    : "glass-panel-subtle hover:border-[var(--border-highlight)] text-[var(--content-primary)]"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-bold ${isActive ? "text-[var(--bg-primary)]/70" : "text-[var(--content-tertiary)]"}`}>
                    {stage.number}
                  </span>
                  <StageIcon className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-xs tracking-tight uppercase block truncate">
                  {stage.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Technical Blueprint Card */}
        <div className="glass-panel p-8 tech-crosshair relative space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent)] flex items-center justify-center shrink-0 border border-[var(--accent)]/20">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">STAGE {activeStage.number} LIFECYCLE OPERATION</span>
                <h3 className="text-lg font-bold text-[var(--content-primary)] font-sans">{activeStage.operation}</h3>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[var(--content-tertiary)]">RUNTIME STATE:</span>
              <span className="px-2.5 py-1 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--content-primary)] font-bold text-[10px]">
                {activeStage.runtimeState}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                Mathematical Invariant & Decision Logic
              </span>
              <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
                {activeStage.invariant}
              </p>
            </div>

            <div className="md:col-span-4 p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs space-y-2">
              <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">EXECUTION GUARANTEE</span>
              <div className="flex items-center justify-between">
                <span>Validation Window</span>
                <strong className="text-[var(--content-primary)]">W_val = 3 Steps</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Confidence Floor</span>
                <strong className="text-[var(--content-primary)]">τ = 0.60</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Rollback Mechanism</span>
                <strong className="text-emerald-500">Atomic Snapshot</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
