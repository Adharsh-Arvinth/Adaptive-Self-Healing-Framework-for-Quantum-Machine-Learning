"use client";

import React, { useState } from "react";
import { Brain, ChevronRight, Info, Layers, Database } from "lucide-react";

interface FeatureSpec {
  index: number;
  name: string;
  formula: string;
  range: string;
  source: string;
  interpretation: string;
}

const CONTEXT_FEATURES: FeatureSpec[] = [
  {
    index: 1,
    name: "Constant Bias Offset",
    formula: "x₁ = 1.0",
    range: "[1.0, 1.0]",
    source: "Static Affine Offset",
    interpretation: "Constant intercept feature ensuring Bayesian linear regression hyperplanes are not constrained through the origin."
  },
  {
    index: 2,
    name: "Normalized Training Loss",
    formula: "x₂ = tanh(L_t)",
    range: "[0.0, 1.0)",
    source: "Objective Evaluation",
    interpretation: "Current binary cross-entropy loss compressed smoothly via hyperbolic tangent, bounding large divergent loss values."
  },
  {
    index: 3,
    name: "Log Gradient Norm",
    formula: "x₃ = clip((ln(‖g‖ + 1e-8) + 8)/12, -1, 1)",
    range: "[-1.0, 1.0]",
    source: "Parameter-Shift Gradients",
    interpretation: "Logarithmic scaling of analytical gradient magnitude, detecting both vanishing (barren plateau) and exploding gradient regimes."
  },
  {
    index: 4,
    name: "Log Gradient Variance",
    formula: "x₄ = clip((ln(Var(g) + 1e-10) + 10)/14, -1, 1)",
    range: "[-1.0, 1.0]",
    source: "Ansatz Variance Spectrum",
    interpretation: "Variance of parameter-shift derivatives across circuit parameters, directly tracking Haar-measure concentration."
  },
  {
    index: 5,
    name: "Normalized Parameter Velocity",
    formula: "x₅ = tanh(10 · ‖v_t‖)",
    range: "[0.0, 1.0)",
    source: "Euclidean Weight Step",
    interpretation: "Displacement rate ‖θ_t - θ_{t-1}‖ across classical optimizer steps, distinguishing active descent from stationary stagnation."
  },
  {
    index: 6,
    name: "Relative Circuit Depth",
    formula: "x₆ = L / L_max",
    range: "[0.125, 1.0]",
    source: "Ansatz Layer Count",
    interpretation: "Current variational layer depth relative to maximum permitted depth (L_max = 8), governing expressibility vs barren risk."
  },
  {
    index: 7,
    name: "Primary Diagnosis Confidence",
    formula: "x₇ = clip(P(F_primary | z), 0.0, 1.0)",
    range: "[1/6, 1.0]",
    source: "Bayesian Diagnostician",
    interpretation: "Posterior probability of the leading diagnosed failure mode, bounded below by the uniform prior 1/6."
  },
  {
    index: 8,
    name: "Normalized Diagnosis Entropy",
    formula: "x₈ = clip(H(p) / ln(6), 0.0, 1.0)",
    range: "[0.0, 1.0]",
    source: "Shannon Entropy Over Posteriors",
    interpretation: "Normalized entropy across all 6 failure probabilities; 0 indicates deterministic certainty, 1 indicates maximal ambiguity."
  },
  {
    index: 9,
    name: "Historical Memory Prior Reward",
    formula: "x₉ = clip(r_hist, -1.0, 1.0)",
    range: "[-1.0, 1.0]",
    source: "Episodic SQLite Retrieval",
    interpretation: "Observed reward of the top cosine-similar historical episode retrieved from the failure memory database."
  },
  {
    index: 10,
    name: "Historical Top Cosine Similarity",
    formula: "x₁₀ = clip(s_hist, -1.0, 1.0)",
    range: "[-1.0, 1.0]",
    source: "Cosine Nearest-Neighbor",
    interpretation: "Cosine similarity between current 12D failure embedding and the closest stored recovery episode in persistent memory."
  },
  {
    index: 11,
    name: "Digital-Twin Predicted Loss Delta",
    formula: "x₁₁ = ΔL_twin / (1 + |ΔL_twin|)",
    range: "[-1.0, 1.0]",
    source: "Digital Twin Proxy (H=3)",
    interpretation: "Normalized predicted loss improvement from H=3 forward lookahead on a surrogate circuit; 0 if unsimulated or non-viable."
  },
  {
    index: 12,
    name: "Digital-Twin Proxy Stability",
    formula: "x₁₂ = clip(σ_twin, 0.0, 1.0)",
    range: "[0.0, 1.0]",
    source: "Surrogate Variance",
    interpretation: "Bounded stability score of the surrogate lookahead trajectory; 0.5 represents neutral prior uncertainty."
  },
];

export const ContextualIntelligenceSection: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<number>(1);
  const feat = CONTEXT_FEATURES[selectedFeature - 1];

  return (
    <section id="contextual-intelligence" className="py-20 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-sans text-xs font-semibold text-[var(--accent)]">
            <span>[07 // BANDIT DECISION ENGINE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            12-Dimensional Context & Thompson Sampling.
          </h2>
          <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
            Repair selection is governed by Contextual Thompson Sampling over six independent Bayesian linear regression posteriors. The runtime synthesizes an exact 12-dimensional state vector <code className="font-mono text-xs text-[var(--content-primary)]">x &in; [-1, 1]¹²</code> strictly implemented in <code className="font-mono text-xs text-[var(--content-primary)]">backend/bandit.py</code>.
          </p>
        </div>

        {/* 12-Dimensional Feature Map Explorer */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Feature List Column */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {CONTEXT_FEATURES.map((item) => {
              const isSelected = item.index === selectedFeature;
              return (
                <button
                  key={item.index}
                  onClick={() => setSelectedFeature(item.index)}
                  className={`p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[var(--bg-surface)] border-[var(--accent)] shadow-sm"
                      : "bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--accent)]">
                        x{item.index}
                      </span>
                      <span className="font-semibold text-xs text-[var(--content-primary)] truncate max-w-[150px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--content-secondary)] block mt-0.5">
                      {item.range}
                    </span>
                  </div>

                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-[var(--accent)]" : "text-[var(--content-tertiary)]"}`} />
                </button>
              );
            })}
          </div>

          {/* Feature Dossier Column */}
          <div className="lg:col-span-5">
            <div className="p-6 sm:p-7 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="font-mono text-[10px] text-[var(--content-secondary)] block">
                    FEATURE x{feat.index} SPECIFICATION
                  </span>
                  <h3 className="text-xl font-bold font-display text-[var(--content-primary)]">
                    {feat.name}
                  </h3>
                </div>

                <div className="px-2.5 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-primary)] font-mono text-[11px] text-[var(--accent)] font-semibold">
                  {feat.range}
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-[var(--content-tertiary)] uppercase block">MATHEMATICAL FORMULATION</span>
                  <code className="text-xs font-bold text-[var(--content-primary)] bg-[var(--bg-primary)] px-2.5 py-1.5 rounded-lg border border-[var(--border-subtle)] block mt-1 break-words">
                    {feat.formula}
                  </code>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--content-tertiary)] uppercase block">FEATURE SOURCE</span>
                  <span className="text-xs text-[var(--content-primary)] block mt-0.5">
                    {feat.source}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-[var(--content-tertiary)] uppercase block">PHYSICAL & ALGORITHMIC ROLE</span>
                  <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans mt-1">
                    {feat.interpretation}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between font-mono text-[10px] text-[var(--content-secondary)]">
                <span>BAYESIAN LINEAR REGRESSION</span>
                <span>B_a ← B_a + x xᵀ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explicit Architectural Clarification: Bandit Context vs Failure Memory Embedding */}
        <div className="p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-4">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[var(--content-primary)]">
            <Database className="w-4 h-4 text-[var(--accent)]" />
            <span>ARCHITECTURAL CLARIFICATION: BANDIT CONTEXT VS FAILURE MEMORY EMBEDDING</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-[var(--content-secondary)] leading-relaxed">
            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <span className="font-mono font-bold text-[var(--content-primary)] block">
                1. 12D Bandit Context Vector (x in backend/bandit.py)
              </span>
              <p>
                Constructed at decision time to condition Thompson Sampling. It comprises: bias, loss, log grad norm, log grad variance, parameter velocity, circuit depth, diagnosis probability, diagnosis entropy, <strong>historical memory prior reward (x₉)</strong>, <strong>memory top similarity (x₁₀)</strong>, <strong>digital-twin predicted delta (x₁₁)</strong>, and <strong>twin stability (x₁₂)</strong>. Neither learning rate nor Bloch purity are components of x.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2">
              <span className="font-mono font-bold text-[var(--content-primary)] block">
                2. 12D Failure Memory Embedding (e in backend/memory.py)
              </span>
              <p>
                Constructed at anomaly detection to store failure signatures in SQLite. It comprises: bias, loss, log grad norm, log grad variance, velocity, depth, diagnosis probability, diagnosis entropy, <strong>normalized loss slope (e₉)</strong>, <strong>loss CV (e₁₀)</strong>, <strong>train-val generalization gap (e₁₁)</strong>, and <strong>normalized learning rate (e₁₂)</strong>. Used exclusively for nearest-neighbor cosine similarity queries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
