"use client";

import React, { useState } from "react";
import { Brain, Target, ChevronDown, ChevronUp, Layers, Sparkles } from "lucide-react";

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

export const StoryChapter5AdaptiveBandit: React.FC = () => {
  const [selectedFeatureIdx, setSelectedFeatureIdx] = useState<number>(1);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [decisionMode, setDecisionMode] = useState<"exploit" | "explore">("exploit");

  const feat = CONTEXT_FEATURES[selectedFeatureIdx - 1];

  return (
    <section id="adaptive-intelligence" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#06080d] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 05 &middot; Adaptive Decision</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            The system learns <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-200">
              which intervention to choose.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Static if-then rules break when quantum noise fluctuates. Our framework uses Contextual Thompson Sampling—balancing exploration of untried interventions with exploitation of proven solutions conditioned on a 12-dimensional quantum state vector.
          </p>
        </div>

        {/* Simplified Visual Explanation Canvas */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Decision Principle (Level 1)
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Balancing Exploration and Exploitation
              </h3>
            </div>

            {/* Toggle demo mode */}
            <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10 font-mono text-xs self-start sm:self-auto">
              <button
                onClick={() => setDecisionMode("exploit")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  decisionMode === "exploit"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                High Confidence (Exploit)
              </button>
              <button
                onClick={() => setDecisionMode("explore")}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  decisionMode === "explore"
                    ? "bg-amber-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                High Uncertainty (Explore)
              </button>
            </div>
          </div>

          {/* Graphical Representation of Posterior Sampling */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs font-mono">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-cyan-400 font-bold block text-[11px]">1. CONTEXT INPUT x ∈ ℝ¹²</span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                A 12-dimensional vector captures current loss, gradient norms, variance, velocity, diagnosis entropy, and digital twin predictions.
              </p>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[10px] text-slate-400">
                Input: [1.0, 0.61, -0.42, -0.88, 0.05, 0.25, 0.91, 0.22, 0.85, 0.94, -0.15, 0.8]
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-cyan-400 font-bold block text-[11px]">2. POSTERIOR SAMPLING</span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                {decisionMode === "exploit"
                  ? "When uncertainty is low, expected reward is dominated by the mean parameter estimates, selecting the proven repair with high probability."
                  : "When uncertainty is high, wider variance distributions allow untried arms to be sampled, discovering novel recovery pathways."}
              </p>
              <div className="p-2.5 rounded-xl bg-black/50 border border-white/5 text-[10px] text-slate-400">
                Rule: r̃_k ~ 𝒩(θ̂_kᵀ x, σ² xᵀ A_k⁻¹ x)
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <span className="text-cyan-400 font-bold block text-[11px]">3. DECISION SELECTION</span>
              <p className="text-slate-300 font-sans leading-relaxed text-xs">
                The actuator with the maximum sampled reward is selected for sandbox validation, subject to safety bounds.
              </p>
              <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] text-cyan-300 font-bold">
                Selected: {decisionMode === "exploit" ? "ARM 01 (Change Optimizer)" : "ARM 02 (Reduce Circuit Depth)"}
              </div>
            </div>
          </div>

          {/* Level 3: Expandable Full 12-Dimensional Vector Schema for Researchers */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>{showTechnicalDetails ? "Hide 12D schema & Bayesian regression formulas" : "Inspect Level 3: Complete 12-Dimensional Context Schema & Update Equations"}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-5 space-y-6 animate-fade-in font-mono text-xs">
                {/* 12-Feature Buttons */}
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 block">
                    Select a feature index (x₁ through x₁₂) to inspect mathematical derivation:
                  </span>
                  <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-1.5">
                    {CONTEXT_FEATURES.map((f) => (
                      <button
                        key={f.index}
                        onClick={() => setSelectedFeatureIdx(f.index)}
                        className={`pill-interactive py-2 px-1 rounded-xl border text-center transition-all ${
                          selectedFeatureIdx === f.index
                            ? "bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.3)] -translate-y-0.5"
                            : "bg-white/[0.02] border-white/10 text-slate-400 hover:text-white hover:border-cyan-400/40 hover:bg-white/[0.06] hover:-translate-y-0.5"
                        }`}
                      >
                        x_{f.index}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Feature Card */}
                <div className="p-5 rounded-2xl bg-black/60 border border-white/10 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                    <span className="text-sm font-bold text-white">
                      Feature x_{feat.index}: {feat.name}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-cyan-300">
                      Range: {feat.range}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-500 block">EXACT FORMULA</span>
                      <code className="text-amber-300 block mt-1">{feat.formula}</code>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">SOURCE SUBSYSTEM</span>
                      <span className="text-slate-300 block mt-1">{feat.source}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">PHYSICAL INTERPRETATION</span>
                      <span className="text-slate-400 block mt-1 font-sans">{feat.interpretation}</span>
                    </div>
                  </div>
                </div>

                {/* Posterior Ridge Regression Math Box */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2 text-slate-300">
                  <span className="text-cyan-400 font-bold block">Bayesian Ridge Regression Posterior Update:</span>
                  <p className="text-slate-400 font-sans leading-relaxed text-xs">
                    After observing reward r from deployed repair a on context x, the inverse covariance matrix A_a and feature-reward accumulator b_a are updated in closed form:
                  </p>
                  <code className="text-amber-300 block bg-black/50 p-2.5 rounded-lg border border-white/5">
                    A_a ← A_a + x xᵀ, &nbsp;&nbsp; b_a ← b_a + r · x, &nbsp;&nbsp; θ̂_a = A_a⁻¹ b_a
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
