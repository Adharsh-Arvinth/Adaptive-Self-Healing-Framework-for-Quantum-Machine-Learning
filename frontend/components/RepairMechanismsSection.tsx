"use client";

import React, { useState } from "react";
import { Sliders, Layers, GitBranch, Zap, Shield, RotateCcw, Check, ArrowRight } from "lucide-react";

interface RepairArmSpec {
  id: string;
  number: string;
  name: string;
  targetDomain: string;
  mechanism: string;
  safetyInvariant: string;
  icon: React.ElementType;
}

const REPAIR_ARMS: RepairArmSpec[] = [
  {
    id: "change_optimizer",
    number: "ARM #1",
    name: "Change Optimizer",
    targetDomain: "Classical Optimization State",
    mechanism: "Cycles classical optimizer state (Adam ↔ RMSprop ↔ SGD) while flushing corrupted second-moment velocity accumulators to escape momentum explosion.",
    safetyInvariant: "Preserves current parameter weights θ; resets momentum buffers. Anti-oscillation (W_osc=4) prevents cyclic optimizer switching.",
    icon: Sliders,
  },
  {
    id: "reduce_circuit_depth",
    number: "ARM #2",
    name: "Reduce Circuit Depth",
    targetDomain: "Ansatz Architecture",
    mechanism: "Truncates variational ansatz layers from L to L - 1. Reduces Haar-measure concentration, collapsing state space dimensionality to relieve barren plateaus.",
    safetyInvariant: "Bounded minimum depth L ≥ 2 preserves quantum expressibility. Trailing layer parameters are deterministically pruned.",
    icon: Layers,
  },
  {
    id: "modify_feature_map",
    number: "ARM #3",
    name: "Modify Feature Map",
    targetDomain: "Quantum Embedding Kernel",
    mechanism: "Toggles between Angle Embedding and second-order entangling IQP (Instantaneous Quantum Polynomial) feature mapping to change kernel geometry.",
    safetyInvariant: "Re-encodes input data without altering learned variational weights. Requires 4-step stabilization window.",
    icon: GitBranch,
  },
  {
    id: "adjust_learning_rate",
    number: "ARM #4",
    name: "Adjust Learning Rate",
    targetDomain: "Descent Step Dynamics",
    mechanism: "Multiplicatively scales classical learning rate η (0.5× on loss surge/divergence, 1.5× on plateau stagnation) within calibrated envelope.",
    safetyInvariant: "Enforces strict clamped safety bounds: η ∈ [1e-4, 1.0].",
    icon: Zap,
  },
  {
    id: "apply_noise_mitigation",
    number: "ARM #5",
    name: "Noise Mitigation",
    targetDomain: "Decoherence Analytical Correction",
    mechanism: "Simulation-side analytical inverse-noise correction under implemented radial-contraction model. Rescales contracted expectation values.",
    safetyInvariant: "Corrected expectation estimates clamped to valid physical spectrum [-1.0, 1.0]. Does not synthesize a non-physical density matrix.",
    icon: Shield,
  },
  {
    id: "perform_warm_restart",
    number: "ARM #6",
    name: "Warm Restart",
    targetDomain: "Parameter Manifold Perturbation",
    mechanism: "Injects calibrated Gaussian perturbation Δθ ~ N(0, σ² I) with σ=0.05 or resets near identity to escape zero-curvature saddle manifolds and persistent plateaus.",
    safetyInvariant: "Perturbation magnitude bounded by ‖Δθ‖ ≤ 0.25 to prevent catastrophic unlearning.",
    icon: RotateCcw,
  },
];

export const RepairMechanismsSection: React.FC = () => {
  const [selectedArm, setSelectedArm] = useState<string>("change_optimizer");
  const arm = REPAIR_ARMS.find((a) => a.id === selectedArm) || REPAIR_ARMS[0];
  const ArmIcon = arm.icon;

  return (
    <section id="repair-mechanisms" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] section-architectural">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <span>[06 // THE LOCKED REPAIR LIBRARY]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-slate-900 tracking-tight">
            Six Verified Quantum Repair Mechanisms.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
            The framework operates over an immutable library of six targeted repair arms. Each arm addresses a specific failure signature across quantum topology, classical optimization, or embedding space.
          </p>
        </div>

        {/* Interactive 6-Arm Grid & Detail Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 6 Arm Selector Cards */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {REPAIR_ARMS.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = item.id === selectedArm;

              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedArm(item.id)}
                  className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[140px] ${
                    isSelected
                      ? "bg-white border-blue-600 shadow-md ring-1 ring-blue-600"
                      : "bg-white/70 border-slate-200 hover:bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-xs font-bold text-slate-400">{item.number}</span>
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <ItemIcon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">{item.name}</h3>
                    <span className="text-[11px] font-mono text-slate-500 block truncate mt-0.5">
                      {item.targetDomain}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Dossier for Selected Arm */}
          <div className="lg:col-span-6">
            <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <ArmIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider block">
                      ACTUATOR {arm.number} SPECIFICATION
                    </span>
                    <h3 className="text-2xl font-bold font-display text-slate-900">
                      {arm.name}
                    </h3>
                  </div>
                </div>

                <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 font-mono text-xs text-blue-700 font-bold">
                  LOCKED ARM
                </div>
              </div>

              <div className="space-y-4 text-xs sm:text-sm">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                    TARGET REPAIR DOMAIN
                  </span>
                  <span className="text-sm font-semibold text-slate-900 block mt-0.5">
                    {arm.targetDomain}
                  </span>
                </div>

                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                    PHYSICAL / ALGORITHMIC MECHANISM
                  </span>
                  <p className="text-slate-600 leading-relaxed font-sans mt-1">
                    {arm.mechanism}
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1">
                  <div className="flex items-center gap-2 font-mono text-xs text-emerald-800 font-bold">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ENFORCED SAFETY CONSTRAINT</span>
                  </div>
                  <p className="text-xs text-emerald-700 leading-relaxed font-sans">
                    {arm.safetyInvariant}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
