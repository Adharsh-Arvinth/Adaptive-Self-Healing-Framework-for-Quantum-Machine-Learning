"use client";

import React, { useState } from "react";
import { Brain, ChevronRight, Info, Layers, Database, Calculator } from "lucide-react";

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
    interpretation: "Constant intercept feature ensuring Bayesian linear regression hyperplanes are not constrained through the origin.",
  },
  {
    index: 2,
    name: "Normalized Training Loss",
    formula: "x₂ = tanh(L_t)",
    range: "[0.0, 1.0)",
    source: "Objective Evaluation",
    interpretation: "Current binary cross-entropy loss compressed smoothly via hyperbolic tangent, bounding large divergent loss values.",
  },
  {
    index: 3,
    name: "Normalized Log Gradient Norm",
    formula: "x₃ = clip((ln(‖g‖ + 1e-8) + 8) / 12, -1, 1)",
    range: "[-1.0, 1.0]",
    source: "Parameter-Shift Gradients",
    interpretation: "Logarithmic scaling of analytical gradient magnitude, detecting both vanishing (barren plateau) and exploding gradient regimes.",
  },
  {
    index: 4,
    name: "Normalized Log Gradient Variance",
    formula: "x₄ = clip((ln(Var(g) + 1e-10) + 10) / 14, -1, 1)",
    range: "[-1.0, 1.0]",
    source: "Ansatz Variance Spectrum",
    interpretation: "Variance of parameter-shift derivatives across circuit parameters, directly tracking state-space concentration.",
  },
  {
    index: 5,
    name: "Normalized Parameter Velocity Norm",
    formula: "x₅ = tanh(10 · ‖v_t‖)",
    range: "[0.0, 1.0)",
    source: "Euclidean Weight Step",
    interpretation: "Displacement rate ‖θ_t - θ_{t-1}‖ across classical optimizer steps, distinguishing active descent from stationary stagnation.",
  },
  {
    index: 6,
    name: "Relative Circuit Depth",
    formula: "x₆ = D / 8",
    range: "[0.25, 1.0]",
    source: "Ansatz Layer Count",
    interpretation: "Current variational layer depth relative to maximum permitted depth (D_max = 8), governing expressibility vs barren risk.",
  },
  {
    index: 7,
    name: "Maximum Diagnosis Confidence",
    formula: "x₇ = clip(P(F_max | z), 0.0, 1.0)",
    range: "[1/6, 1.0]",
    source: "Bayesian Diagnostician",
    interpretation: "Posterior probability of the leading diagnosed failure mode, bounded below by the uniform prior 1/6.",
  },
  {
    index: 8,
    name: "Normalized Diagnosis Entropy",
    formula: "x₈ = clip(H(p) / ln(6), 0.0, 1.0)",
    range: "[0.0, 1.0]",
    source: "Shannon Entropy Over Posteriors",
    interpretation: "Normalized entropy across all 6 failure probabilities; 0 indicates deterministic certainty, 1 indicates maximal ambiguity.",
  },
  {
    index: 9,
    name: "Memory Prior Reward",
    formula: "x₉ = clip(r_prior, -1.0, 1.0)",
    range: "[-1.0, 1.0]",
    source: "Episodic SQLite Retrieval",
    interpretation: "Observed reward of the top cosine-similar historical episode retrieved from the failure memory database.",
  },
  {
    index: 10,
    name: "Maximum Cosine Similarity",
    formula: "x₁₀ = clip(cos_sim_max, -1.0, 1.0)",
    range: "[-1.0, 1.0]",
    source: "Cosine Nearest-Neighbor",
    interpretation: "Maximum cosine similarity between current failure signature and stored episodes in persistent failure memory.",
  },
  {
    index: 11,
    name: "Twin-Predicted Normalized Loss Delta",
    formula: "x₁₁ = ΔL_twin / (1 + |ΔL_twin|)",
    range: "[-1.0, 1.0]",
    source: "Surrogate Digital Twin (H=3)",
    interpretation: "Normalized predicted loss improvement from H=3 lookahead on an isolated surrogate circuit. 0 if unsimulated.",
  },
  {
    index: 12,
    name: "Twin Stability",
    formula: "x₁₂ = clip(σ_twin, 0.0, 1.0)",
    range: "[0.0, 1.0]",
    source: "Surrogate Trajectory Variance",
    interpretation: "Bounded stability score of surrogate lookahead trajectory; 0.5 represents neutral prior uncertainty.",
  },
];

export const ContextualIntelligenceSection: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<number>(1);
  const feat = CONTEXT_FEATURES[selectedFeature - 1];

  return (
    <section id="contextual-intelligence" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/10 section-slate">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-400 uppercase tracking-wider">
            <span>[07 // BANDIT DECISION ENGINE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-white tracking-tight">
            12-Dimensional Context &amp; Thompson Sampling.
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Repair selection is governed by Contextual Thompson Sampling over six independent Bayesian linear regression posteriors. The runtime synthesizes an exact 12-dimensional state vector strictly implemented in <code className="font-mono text-xs text-blue-300">backend/bandit.py</code>.
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
                  className={`p-3.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-slate-900 border-blue-500 shadow-md text-white ring-1 ring-blue-500"
                      : "bg-slate-950/60 border-white/10 hover:bg-slate-900/60 text-slate-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        x{item.index}
                      </span>
                      <span className="font-semibold text-xs text-white truncate max-w-[150px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      {item.range}
                    </span>
                  </div>

                  <ChevronRight className={`w-3.5 h-3.5 ${isSelected ? "text-blue-400" : "text-slate-600"}`} />
                </button>
              );
            })}
          </div>

          {/* Feature Dossier Column */}
          <div className="lg:col-span-5">
            <div className="p-7 sm:p-8 rounded-2xl border border-white/10 bg-slate-950 shadow-2xl space-y-6 specular-border">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider block">
                    FEATURE x{feat.index} SPECIFICATION
                  </span>
                  <h3 className="text-xl font-bold font-display text-white">
                    {feat.name}
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 font-mono text-xs text-blue-300 font-bold">
                  {feat.range}
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block tracking-wider">MATHEMATICAL FORMULATION</span>
                  <code className="text-xs font-bold text-blue-300 bg-black/60 px-3 py-2 rounded-xl border border-white/10 block mt-1 break-words">
                    {feat.formula}
                  </code>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block tracking-wider">FEATURE SOURCE</span>
                  <span className="text-xs text-white block mt-0.5">
                    {feat.source}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase block tracking-wider">ROLE IN THOMPSON SAMPLING</span>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans mt-1">
                    {feat.interpretation}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[11px] text-slate-400">
                <span>BAYESIAN LINEAR POSTERIOR</span>
                <span className="text-emerald-400 font-semibold">B_a ← B_a + x xᵀ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Objective Reward Function Specification */}
        <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 space-y-4 specular-border">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white">
            <Calculator className="w-4 h-4 text-blue-400" />
            <span>CENTRALIZED REWARD FUNCTION SPECIFICATION (r ∈ [-1.0, 1.0])</span>
          </div>

          <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-blue-300 overflow-x-auto">
            <code>r = clip(0.40·δ_L + 0.25·δ_acc + 0.15·r_grad − 0.05·c_cost − 0.05·δ_D − 0.10·i_rollback, −1, 1)</code>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2 font-mono text-[11px] text-slate-400">
            <div>
              <span className="text-white font-bold block">δ_L (w₁=0.40)</span>
              <span>Fractional loss improvement (L_pre - L_post) / L_pre</span>
            </div>
            <div>
              <span className="text-white font-bold block">δ_acc (w₂=0.25)</span>
              <span>Classification accuracy improvement</span>
            </div>
            <div>
              <span className="text-white font-bold block">r_grad (w₃=0.15)</span>
              <span>Gated gradient recovery on plateaus</span>
            </div>
            <div>
              <span className="text-white font-bold block">c_cost (w₄=0.05)</span>
              <span>Normalized evaluation cost</span>
            </div>
            <div>
              <span className="text-white font-bold block">δ_D (w₅=0.05)</span>
              <span>Ansatz depth expansion penalty</span>
            </div>
            <div>
              <span className="text-white font-bold block">i_rollback (w₆=0.10)</span>
              <span>Rollback penalty indicator ∈ &#123;0, 1&#125;</span>
            </div>
          </div>
        </div>

        {/* Explicit Architectural Clarification: Bandit Context vs Failure Memory Embedding */}
        <div className="p-8 rounded-2xl border border-white/10 bg-slate-950 space-y-4 specular-border">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold text-white">
            <Database className="w-4 h-4 text-blue-400" />
            <span>ARCHITECTURAL CLARIFICATION: BANDIT CONTEXT VS FAILURE MEMORY EMBEDDING</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans text-slate-300 leading-relaxed">
            <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <span className="font-mono font-bold text-white block text-sm">
                1. 12D Bandit Context Vector (x in backend/bandit.py)
              </span>
              <p>
                Constructed at decision time to condition Thompson Sampling. It comprises: bias, loss, log grad norm, log grad variance, parameter velocity, circuit depth, diagnosis probability, diagnosis entropy, <strong>memory prior reward (x₉)</strong>, <strong>memory top similarity (x₁₀)</strong>, <strong>digital-twin predicted loss delta (x₁₁)</strong>, and <strong>twin stability (x₁₂)</strong>.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-black/40 border border-white/10 space-y-2">
              <span className="font-mono font-bold text-white block text-sm">
                2. 12D Failure Memory Embedding (e in backend/memory.py)
              </span>
              <p>
                Constructed at anomaly detection to store failure signatures in SQLite. It shares the first eight semantic features with x, but uses distinct final four features: <strong>normalized loss slope (e₉)</strong>, <strong>loss coefficient of variation (e₁₀)</strong>, <strong>generalization gap (e₁₁)</strong>, and <strong>normalized learning rate (e₁₂)</strong> for cosine nearest-neighbor queries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
