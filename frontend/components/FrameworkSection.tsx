"use client";

import React, { useState } from "react";
import { Activity, Search, ShieldAlert, Database, Eye, Cpu, CheckCircle2, RotateCcw } from "lucide-react";

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
    invariant: "Sample mini-batch loss L_t, calculate full parameter-shift gradient vector g_t = [∂_1 L, ..., ∂_p L], and track parameter velocity v_t = ||θ_t - θ_{t-1}||.",
    runtimeState: "HEALTHY_TRAINING",
    icon: Activity,
  },
  {
    id: "detect",
    number: "02",
    title: "Detect",
    operation: "Sliding Window Anomaly Verification",
    invariant: "Evaluate rolling variance Var(g), loss stagnation counters, and Bloch vector contraction against calibrated bounds [1e-5, 50.0] over window W = 5.",
    runtimeState: "ANOMALY_DETECTED",
    icon: Search,
  },
  {
    id: "diagnose",
    number: "03",
    title: "Diagnose",
    operation: "Bayesian Posterior Categorical Inference",
    invariant: "Compute evidence likelihoods across all 6 non-overlapping failure modes. Production gate enforces τ = 0.60 confidence threshold before permitting repair.",
    runtimeState: "DIAGNOSING / CONFIDENCE_GATE",
    icon: ShieldAlert,
  },
  {
    id: "retrieve",
    number: "04",
    title: "Retrieve",
    operation: "12D Episodic Memory Cosine Lookup",
    invariant: "Construct 12D failure embedding vector e_t. Query SQLite persistent failure memory using nearest-neighbor cosine similarity to retrieve historical prior reward.",
    runtimeState: "MEMORY_RETRIEVAL",
    icon: Database,
  },
  {
    id: "simulate",
    number: "05",
    title: "Simulate",
    operation: "Digital Twin Surrogate Lookahead (H=3)",
    invariant: "Forward-simulate 3 candidate steps on an isolated surrogate circuit. If projected loss delta exceeds +20% divergence, candidate arm is dynamically purged.",
    runtimeState: "DIGITAL_TWIN_SIMULATING",
    icon: Eye,
  },
  {
    id: "select",
    number: "06",
    title: "Select",
    operation: "Contextual Thompson Sampling Action Draw",
    invariant: "Synthesize 12D state vector x_t. Sample posterior weight distributions θ_k ~ N(μ_k, B_k^-1). Anti-oscillation filter (W_osc = 4) vetoes recently used arms.",
    runtimeState: "REPAIR_SELECTION",
    icon: Cpu,
  },
  {
    id: "validate",
    number: "07",
    title: "Validate",
    operation: "Transactional Multi-Step Observation",
    invariant: "Capture immutable in-memory checkpoint snapshot θ_pre. Deploy selected repair and observe trajectory across validation window W_val = 3 iterations.",
    runtimeState: "VALIDATING_REPAIR",
    icon: CheckCircle2,
  },
  {
    id: "deploy_rollback",
    number: "08",
    title: "Deploy or Rollback",
    operation: "Atomic Commit or In-Memory Rollback",
    invariant: "If L_post improves or stabilizes: permanently commit. If average loss degrades or NaN occurs: execute atomic in-memory rollback from snapshot θ_pre.",
    runtimeState: "COMMITTED / ROLLED_BACK",
    icon: RotateCcw,
  },
];

export const FrameworkSection: React.FC = () => {
  const [activeStageId, setActiveStageId] = useState<string>("monitor");
  const activeStage = LIFECYCLE_STAGES.find((s) => s.id === activeStageId) || LIFECYCLE_STAGES[0];
  const Icon = activeStage.icon;

  return (
    <section id="the-framework" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/10 section-cinematic">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>[05 // THE RECOVERY LIFECYCLE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-white tracking-tight">
            The Eight-Stage Autonomic Control Loop.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            The runtime executes a continuous, closed-loop self-healing lifecycle based on the classical MAPE-K (Monitor, Analyze, Plan, Execute, Knowledge) autonomic control architecture, augmented with quantum digital twins and contextual bandits.
          </p>
        </div>

        {/* Interactive 8-Stage Pipeline Selector */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {LIFECYCLE_STAGES.map((stage) => {
            const isActive = stage.id === activeStageId;
            const StageIcon = stage.icon;
            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                className={`p-3.5 rounded-xl border transition-all text-left flex flex-col justify-between min-h-[105px] ${
                  isActive
                    ? "bg-slate-900 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.25)] text-white"
                    : "bg-slate-950/60 border-white/10 hover:bg-slate-900/60 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono text-xs font-bold text-slate-500">{stage.number}</span>
                  <StageIcon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-500"}`} />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block mt-2">{stage.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 block truncate">
                    {stage.runtimeState.split("_")[0]}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stage Dossier Card */}
        <div className="p-8 sm:p-10 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-6 specular-border">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <span className="font-mono text-xs text-blue-400 block uppercase tracking-wider">
                  STAGE {activeStage.number} EXECUTION PROFILE
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {activeStage.title}: {activeStage.operation}
                </h3>
              </div>
            </div>

            <div className="px-3.5 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] font-mono text-xs text-right">
              <span className="text-[10px] text-slate-500 block uppercase">RUNTIME STATE</span>
              <span className="font-bold text-emerald-400">{activeStage.runtimeState}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-8 space-y-3">
              <span className="font-mono text-xs text-slate-400 uppercase tracking-wider block">
                MATHEMATICAL INVARIANT &amp; EXECUTION LOGIC
              </span>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
                {activeStage.invariant}
              </p>
            </div>

            <div className="md:col-span-4 p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2 font-mono text-xs">
              <span className="text-[10px] text-slate-400 uppercase block tracking-wider">STATE TRANSITION RULE</span>
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                Atomic transitions are recorded in the SQLite audit log. Posterior updates use only real post-deployment empirical rewards, never surrogate estimates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
