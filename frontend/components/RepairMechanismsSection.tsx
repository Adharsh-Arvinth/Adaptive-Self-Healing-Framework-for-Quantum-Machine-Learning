"use client";

import React, { useState } from "react";
import { Sliders, Layers, Network, Zap, Shield, RotateCcw, Check, ArrowRight } from "lucide-react";

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
    mechanism: "Cycles between Adam, RMSprop, and SGD while flushing corrupted second-moment velocity accumulators to escape momentum divergence.",
    safetyInvariant: "Preserves current parameter weights θ; only resets optimizer velocity buffers.",
    icon: Sliders,
  },
  {
    id: "reduce_circuit_depth",
    number: "ARM #2",
    name: "Reduce Circuit Depth",
    targetDomain: "Quantum Circuit Topology",
    mechanism: "Truncates ansatz layers from L to L - 1. Reduces Haar-measure concentration, collapsing state space dimensionality to restore non-vanishing gradients.",
    safetyInvariant: "Bounded minimum depth L ≥ 1. Discards trailing layer parameters deterministically.",
    icon: Layers,
  },
  {
    id: "modify_feature_map",
    number: "ARM #3",
    name: "Modify Feature Map",
    targetDomain: "Hilbert Space Embedding",
    mechanism: "Toggles between Angle Embedding and second-order entangling IQP (Instantaneous Quantum Polynomial) feature mapping to change kernel geometry.",
    safetyInvariant: "Re-encodes input data without modifying learned variational parameters in downstream ansatz.",
    icon: Network,
  },
  {
    id: "adjust_learning_rate",
    number: "ARM #4",
    name: "Adjust Learning Rate",
    targetDomain: "Step-Size Dynamics",
    mechanism: "Multiplicatively scales classical learning rate η (0.5× on divergence, 1.5× on plateau stagnation) within calibrated stable envelope.",
    safetyInvariant: "Enforces strict clamped safety bounds: η ∈ [1e-4, 1.0].",
    icon: Zap,
  },
  {
    id: "apply_noise_mitigation",
    number: "ARM #5",
    name: "Noise Mitigation",
    targetDomain: "Decoherence Analytical Correction",
    mechanism: "Simulation-side analytical inverse-noise correction under custom radial-contraction model. Rescales contracted expectation values.",
    safetyInvariant: "Corrected expectation values clamped to valid physical spectrum [-1.0, 1.0].",
    icon: Shield,
  },
  {
    id: "perform_warm_restart",
    number: "ARM #6",
    name: "Warm Restart",
    targetDomain: "Parameter Manifold Perturbation",
    mechanism: "Injects calibrated Gaussian perturbation Δθ ~ N(0, σ² I) with σ=0.05 to escape zero-curvature saddle manifolds and persistent plateaus.",
    safetyInvariant: "Perturbation magnitude bounded by ‖Δθ‖ ≤ 0.25 to prevent catastrophic unlearning.",
    icon: RotateCcw,
  },
];

export const RepairMechanismsSection: React.FC = () => {
  const [selectedArm, setSelectedArm] = useState<string>("change_optimizer");
  const arm = REPAIR_ARMS.find((a) => a.id === selectedArm) || REPAIR_ARMS[0];
  const ArmIcon = arm.icon;

  return (
    <section id="repair-mechanisms" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-sans text-xs font-semibold text-[var(--accent)]">
            <span>[06 // THE LOCKED REPAIR LIBRARY]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Six Verified Quantum Repair Mechanisms.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
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
                  className={`p-4 rounded-xl text-left border transition-all flex flex-col justify-between min-h-[140px] ${
                    isSelected
                      ? "glass-panel border-[var(--accent)] shadow-md"
                      : "bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] hover:bg-[var(--bg-surface)] hover:border-[var(--border-highlight)]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono text-[10px] font-bold text-[var(--content-tertiary)]">
                      {item.number}
                    </span>
                    <ItemIcon className={`w-4 h-4 ${isSelected ? "text-[var(--accent)]" : "text-[var(--content-secondary)]"}`} />
                  </div>

                  <div>
                    <h4 className="font-bold text-sm text-[var(--content-primary)]">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-mono text-[var(--content-secondary)] block mt-0.5">
                      {item.targetDomain}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Detailed Mechanical Specification */}
          <div className="lg:col-span-6">
            <div className="glass-panel p-8 tech-crosshair relative space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--accent)]">
                    <ArmIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs text-[var(--content-tertiary)] block">
                      {arm.number} SPECIFICATION
                    </span>
                    <h3 className="text-2xl font-bold font-display text-[var(--content-primary)]">
                      {arm.name}
                    </h3>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[11px] font-mono text-[var(--content-secondary)]">
                  LOCKED REPAIR ARM
                </span>
              </div>

              {/* Mechanism Description */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)]">
                  RUNTIME TRANSFORMATION MECHANISM
                </span>
                <p className="text-sm text-[var(--content-secondary)] leading-relaxed font-sans">
                  {arm.mechanism}
                </p>
              </div>

              {/* Safety Invariant */}
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-2">
                <div className="flex items-center gap-2 font-mono text-xs text-[var(--accent)] font-semibold uppercase">
                  <Check className="w-3.5 h-3.5" />
                  <span>SAFETY FILTER INVARIANT</span>
                </div>
                <p className="text-xs text-[var(--content-primary)] font-mono leading-relaxed">
                  {arm.safetyInvariant}
                </p>
              </div>

              {/* Context Vector Coupling */}
              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between font-mono text-xs text-[var(--content-secondary)]">
                <span>SELECTION METHOD:</span>
                <strong className="text-[var(--content-primary)]">Contextual Thompson Sampling (12D Context)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
