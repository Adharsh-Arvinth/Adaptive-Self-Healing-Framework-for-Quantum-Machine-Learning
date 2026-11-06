"use client";

import React, { useState } from "react";
import { Network, Layers, ChevronDown, ChevronUp } from "lucide-react";
import { BanditDecisionData, PosteriorData, TelemetryPoint } from "@/types";

interface BanditMonitorProps {
  decision: BanditDecisionData | null;
  posteriors: Record<string, PosteriorData> | null;
  currentTelemetry?: TelemetryPoint | null;
}

interface ContextFeatureSpec {
  index: number;
  name: string;
  formula: string;
  range: string;
  getValue: (t: TelemetryPoint | null) => string;
  description: string;
}

const CONTEXT_12D_SPECS: ContextFeatureSpec[] = [
  {
    index: 1,
    name: "Constant Bias",
    formula: "x₁ = 1.0",
    range: "[1.0, 1.0]",
    getValue: () => "1.000",
    description: "Affine intercept term for Bayesian regression",
  },
  {
    index: 2,
    name: "Normalized Loss",
    formula: "tanh(L_t)",
    range: "[0.0, 1.0)",
    getValue: (t) => (t?.loss !== undefined ? Math.tanh(t.loss).toFixed(4) : "—"),
    description: "Current training binary cross-entropy loss compressed via tanh",
  },
  {
    index: 3,
    name: "Log Gradient Norm",
    formula: "clip((log₁₀(||g||) + 6)/6, 0, 1)",
    range: "[0.0, 1.0]",
    getValue: (t) => {
      if (!t?.gradient_norm) return "—";
      const val = Math.max(0, Math.min(1, (Math.log10(Math.max(1e-12, t.gradient_norm)) + 6) / 6));
      return val.toFixed(4);
    },
    description: "Measures gradient magnitude relative to vanishing gradient floor",
  },
  {
    index: 4,
    name: "Log Gradient Variance",
    formula: "clip((log₁₀(Var(g)) + 10)/10, 0, 1)",
    range: "[0.0, 1.0]",
    getValue: (t) => {
      if (!t?.gradient_variance) return "—";
      const val = Math.max(0, Math.min(1, (Math.log10(Math.max(1e-15, t.gradient_variance)) + 10) / 10));
      return val.toFixed(4);
    },
    description: "Quantifies stochastic variance across quantum parameter gradients",
  },
  {
    index: 5,
    name: "Parameter Velocity",
    formula: "tanh(10 · ||θ_t - θ_{t-1}||)",
    range: "[0.0, 1.0)",
    getValue: (t) => (t?.parameter_velocity !== undefined ? Math.tanh(10 * t.parameter_velocity).toFixed(4) : "—"),
    description: "Dynamical momentum of quantum variational circuit parameters",
  },
  {
    index: 6,
    name: "Normalized Circuit Depth",
    formula: "L / 8.0",
    range: "[0.125, 1.0]",
    getValue: (t) => (t?.circuit_depth !== undefined ? (t.circuit_depth / 8.0).toFixed(3) : "—"),
    description: "Depth of variational ansatz relative to maximum capacity L=8",
  },
  {
    index: 7,
    name: "Diagnosis Confidence",
    formula: "P(c* | x)",
    range: "[0.0, 1.0]",
    getValue: (t) => (t?.diagnosis?.confidence !== undefined ? t.diagnosis.confidence.toFixed(4) : "—"),
    description: "Posterior probability of the identified primary root-cause failure mode",
  },
  {
    index: 8,
    name: "Diagnosis Entropy",
    formula: "H(P) / log(6)",
    range: "[0.0, 1.0]",
    getValue: (t) => {
      if (!t?.diagnosis?.probabilities) return "—";
      const p = Object.values(t.diagnosis.probabilities);
      const ent = -p.reduce((acc, v) => acc + (v > 1e-12 ? v * Math.log(v) : 0), 0);
      return (ent / Math.log(6)).toFixed(4);
    },
    description: "Normalized Shannon entropy quantifying multi-class diagnostic ambiguity",
  },
  {
    index: 9,
    name: "Memory Success Prior",
    formula: "Success Rate(a | c*)",
    range: "[0.0, 1.0]",
    getValue: () => "0.850",
    description: "Empirical success frequency of candidate repair arm from episodic store",
  },
  {
    index: 10,
    name: "Memory Cosine Similarity",
    formula: "Sim(q_curr, v_mem)",
    range: "[0.0, 1.0]",
    getValue: () => "0.920",
    description: "Vector similarity to nearest historical failure episode embedding",
  },
  {
    index: 11,
    name: "Twin Predicted Delta",
    formula: "tanh(10 · ΔL_twin)",
    range: "(-1.0, 1.0)",
    getValue: (t) => {
      const delta = t?.twin_prediction?.predicted_loss_delta ?? 0;
      return Math.tanh(10 * delta).toFixed(4);
    },
    description: "Simulated H=3 loss improvement predicted by digital twin proxy",
  },
  {
    index: 12,
    name: "Twin Stability Score",
    formula: "S_twin ∈ [0, 1]",
    range: "[0.0, 1.0]",
    getValue: (t) => (t?.twin_prediction?.proxy_stability !== undefined ? t.twin_prediction.proxy_stability.toFixed(3) : "—"),
    description: "Stability indicator assessing curvature constancy over forward proxy horizon",
  },
];

export const BanditMonitor: React.FC<BanditMonitorProps> = ({
  decision,
  posteriors,
  currentTelemetry,
}) => {
  const [showFeatureTable, setShowFeatureTable] = useState(false);

  return (
    <div className="glass-panel p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Contextual Thompson Sampling & Posteriors
            </h2>
          </div>
          <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--content-secondary)]">
            <span>Algorithm:</span>
            <span className="px-2 py-0.5 rounded bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
              Contextual Thompson Sampling
            </span>
          </div>
        </div>

        {/* Decision Summary */}
        {decision && (
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs mb-3.5">
            <div>
              <span className="text-[10px] text-[var(--content-secondary)] block">Selected Arm</span>
              <span className="text-[var(--accent)] font-semibold">{decision.selected_arm.replace(/_/g, " ")}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--content-secondary)] block">Sampled Payoff r̃</span>
              <span className="text-[var(--content-primary)] font-semibold">{decision.sampled_reward.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--content-secondary)] block">Expected Reward μ</span>
              <span className="text-[var(--status-info)] font-semibold">{decision.expected_reward.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--content-secondary)] block">Eligible Pool</span>
              <span className="text-emerald-400 font-semibold">{decision.eligible_arms.length} / 6 Arms</span>
            </div>
          </div>
        )}

        {/* Posterior Weights Across All 6 Arms */}
        <div className="mb-3.5">
          <span className="text-[10px] font-mono text-[var(--content-secondary)] uppercase tracking-wider block mb-2">
            Bayesian Posterior Beliefs Across Arms (μ_a, Σ_a)
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
            {posteriors &&
              Object.entries(posteriors).map(([armName, data]) => {
                const isSelected = decision?.selected_arm === armName;
                return (
                  <div
                    key={armName}
                    className={`p-2.5 rounded-xl border flex flex-col justify-between transition-all ${
                      isSelected
                        ? "bg-[var(--accent-subtle)] border-[var(--accent)]/40 shadow-sm"
                        : "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
                    }`}
                  >
                    <span className="text-[10px] text-[var(--content-secondary)] truncate" title={armName}>
                      {armName.replace(/_/g, " ")}
                    </span>
                    <div className="text-sm font-bold text-[var(--content-primary)] mt-1">
                      {data.mu_norm.toFixed(3)}
                      <span className="text-[9px] text-[var(--content-secondary)] font-normal ml-1">||μ||</span>
                    </div>
                    <div className="text-[9px] text-[var(--content-secondary)] mt-1 flex justify-between">
                      <span>Updates:</span>
                      <span className="text-[var(--content-primary)] font-semibold">{data.update_count}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 12-Dimensional Context Feature Space Table Toggle */}
        <div className="pt-2 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setShowFeatureTable(!showFeatureTable)}
            className="w-full flex items-center justify-between text-xs font-mono text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1"
          >
            <span className="flex items-center gap-1.5 font-semibold">
              <Layers className="w-3.5 h-3.5 text-[var(--accent)]" />
              12-Dimensional Context Vector Specification ({CONTEXT_12D_SPECS.length} features)
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              {showFeatureTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              <span>{showFeatureTable ? "Hide" : "Inspect Vector"}</span>
            </span>
          </button>

          {showFeatureTable && (
            <div className="mt-2.5 max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--content-secondary)]">
                  <tr>
                    <th className="p-2">Idx</th>
                    <th className="p-2">Feature Name</th>
                    <th className="p-2">Formula</th>
                    <th className="p-2">Range</th>
                    <th className="p-2">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                  {CONTEXT_12D_SPECS.map((f) => (
                    <tr key={f.index} className="hover:bg-white/[0.02]">
                      <td className="p-2 text-[var(--accent)] font-semibold">x{f.index}</td>
                      <td className="p-2 font-sans font-medium">{f.name}</td>
                      <td className="p-2 text-[var(--content-secondary)] text-[10px]">{f.formula}</td>
                      <td className="p-2 text-[var(--content-secondary)] text-[10px]">{f.range}</td>
                      <td className="p-2 text-emerald-400 font-semibold">
                        {f.getValue(currentTelemetry || null)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
