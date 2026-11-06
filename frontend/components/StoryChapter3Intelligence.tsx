"use client";

import React, { useState } from "react";
import { Activity, Search, Brain, Database, Cpu, Target, ShieldCheck, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface LifecycleStage {
  id: string;
  number: string;
  name: string;
  verb: string;
  icon: React.ElementType;
  summary: string;
  whyItMatters: string;
  technicalCode: string;
  subsystem: string;
}

const STAGES: LifecycleStage[] = [
  {
    id: "monitor",
    number: "01",
    name: "Sliding-Window Telemetry",
    verb: "Monitor",
    icon: Activity,
    summary: "Tracks loss, validation loss, gradient norms, parameter velocity, and single-qubit Bloch coordinates across window W = 5.",
    whyItMatters: "Provides high-frequency sensory telemetry so anomalies can be intercepted before numerical blowup.",
    technicalCode: "backend/telemetry/extractor.py &middot; SlidingWindow(W=5) computes rolling variance and velocity norms",
    subsystem: "Sensory Telemetry Engine",
  },
  {
    id: "detect",
    number: "02",
    name: "Multi-Heuristic Anomaly Detector",
    verb: "Detect",
    icon: Search,
    summary: "Evaluates gradient variance thresholds (Var[g] < 1e-5), loss divergence, and parameter oscillation.",
    whyItMatters: "Distinguishes normal stochastic descent fluctuations from genuine physical optimization traps.",
    technicalCode: "backend/diagnostics/detector.py &middot; Evaluates 6 heuristic rules across sliding telemetry window",
    subsystem: "Anomaly Detection Module",
  },
  {
    id: "diagnose",
    number: "03",
    name: "Bayesian Root-Cause Inference",
    verb: "Diagnose",
    icon: Brain,
    summary: "Computes categorical posterior probability P(cause | telemetry) across 6 failure modes with confidence gate τ = 0.60.",
    whyItMatters: "Prevents applying the wrong fix by requiring high statistical confidence before taking action.",
    technicalCode: "backend/diagnostics/bayesian.py &middot; Posterior P(C_k|X) calculated with temperature scaling",
    subsystem: "Bayesian Reasoning Engine",
  },
  {
    id: "retrieve",
    number: "04",
    name: "Episodic Memory Retrieval",
    verb: "Retrieve",
    icon: Database,
    summary: "Queries SQLite persistent store for historical episodes with matching failure signatures and successful repairs.",
    whyItMatters: "Allows the system to remember past training runs and reuse proven repair trajectories.",
    technicalCode: "backend/memory/store.py &middot; Queries persistent SQLite episodic database via cosine similarity",
    subsystem: "Episodic Memory Vault",
  },
  {
    id: "simulate",
    number: "05",
    name: "Surrogate Digital Twin Sandbox",
    verb: "Simulate",
    icon: Cpu,
    summary: "Clones model state in a sandboxed digital twin and simulates candidate repairs over horizon H = 3 steps.",
    whyItMatters: "Tests interventions in simulation before altering the live model, preventing destructive mutations.",
    technicalCode: "backend/twin/simulator.py &middot; Deepcopies VQC state; evaluates ΔLoss over lookahead horizon H=3",
    subsystem: "Digital Twin Sandbox",
  },
  {
    id: "select",
    number: "06",
    name: "Contextual Thompson Sampling",
    verb: "Select",
    icon: Target,
    summary: "Samples posterior reward distributions for eligible repair arms conditioned on the 12-dimensional state vector.",
    whyItMatters: "Intelligently balances exploring untried repairs with exploiting known high-reward interventions.",
    technicalCode: "backend/bandit/thompson.py &middot; μ_k ~ N(θ_kᵀ x, σ² (xᵀ A_k⁻¹ x)); selects arm with argmax sampled reward",
    subsystem: "Contextual Bandit Controller",
  },
  {
    id: "validate",
    number: "07",
    name: "Safety Filters & Boundary Clamps",
    verb: "Validate",
    icon: ShieldCheck,
    summary: "Enforces hard physical constraints: minimum depth bound L_min = 2 and anti-oscillation cooldown W_osc = 4 steps.",
    whyItMatters: "Guarantees that autonomous decisions cannot violate expressibility limits or enter infinite switching loops.",
    technicalCode: "backend/safety/filters.py &middot; Anti-oscillation circular buffer; clamp checks on L ≥ 2 and η ∈ [1e-4, 1.0]",
    subsystem: "Deterministic Safety Guard",
  },
  {
    id: "deploy",
    number: "08",
    name: "Atomic Deploy or Rollback",
    verb: "Recover",
    icon: RefreshCw,
    summary: "Applies chosen repair in validation window W_val = 3. If loss improves, state commits; if not, failsafe snapshot restores.",
    whyItMatters: "Ensures the live model is never corrupted by an ineffective repair.",
    technicalCode: "backend/deployment/pipeline.py &middot; Transactional deepcopy checkpoint snapshot; atomic revert on loss regression",
    subsystem: "Transactional Deployment Engine",
  },
];

export const StoryChapter3Intelligence: React.FC = () => {
  const [selectedStageIndex, setSelectedStageIndex] = useState<number>(0);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const active = STAGES[selectedStageIndex];
  const IconComponent = active.icon;

  return (
    <section id="the-framework" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#06080d] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 03 &middot; The Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Detect. Understand. Adapt. Recover.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            A closed-loop autonomic pipeline that runs continuously alongside quantum training. Click any stage below to inspect how sensory telemetry transforms into verified runtime recovery.
          </p>
        </div>

        {/* Progressive 8-Stage Interactive Carousel / Selector */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-8">
          {/* Stage Buttons Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-xs">
            {STAGES.map((s, idx) => {
              const StageIcon = s.icon;
              const isSelected = selectedStageIndex === idx;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStageIndex(idx)}
                  className={`group p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all duration-200 active:scale-95 ${
                    isSelected
                      ? "bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-[0_0_20px_rgba(34,211,238,0.3)] -translate-y-0.5"
                      : "bg-white/[0.03] border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.07] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] text-slate-300"
                  }`}
                >
                  <span className={`text-[10px] ${isSelected ? "text-slate-900" : "text-slate-500"}`}>
                    {s.number}
                  </span>
                  <StageIcon className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                  <span className="text-[11px] truncate w-full">{s.verb}</span>
                </button>
              );
            })}
          </div>

          {/* Active Stage Detailed Display */}
          <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-black/40 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0">
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                    STAGE {active.number} &middot; {active.subsystem}
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">
                    {active.name}
                  </h3>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.05] border border-white/10 text-slate-300 self-start sm:self-auto">
                Action: {active.verb}
              </span>
            </div>

            {/* Level 1 & Level 2 Narrative Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  What It Does (Essential)
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {active.summary}
                </p>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
                  Why It Matters (Insight)
                </span>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {active.whyItMatters}
                </p>
              </div>
            </div>

            {/* Level 3: Expandable Research & Source Code Detail */}
            <div className="pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <span>{showTechnicalDetails ? "Hide technical implementation" : "Inspect Level 3: Backend Implementation & Code Reference"}</span>
                {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showTechnicalDetails && (
                <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-xs font-mono text-slate-300 animate-fade-in">
                  <span className="text-cyan-400 font-bold block">Backend Source Module:</span>
                  <p className="text-slate-300 bg-black/60 p-2.5 rounded-lg border border-white/5">
                    {active.technicalCode}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
