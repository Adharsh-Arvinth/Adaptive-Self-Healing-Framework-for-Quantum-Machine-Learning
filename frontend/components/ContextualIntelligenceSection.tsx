"use client";

import React, { useState } from "react";
import { Network, Brain, Activity, Database, CheckCircle2, ChevronRight } from "lucide-react";

interface FeatureSpec {
  index: number;
  name: string;
  formula: string;
  range: string;
  interpretation: string;
}

const CONTEXT_FEATURES: FeatureSpec[] = [
  { index: 1, name: "Constant Bias", formula: "x₁ = 1.0", range: "[1.0, 1.0]", interpretation: "Affine intercept offset for Bayesian regression hyperplanes" },
  { index: 2, name: "Normalized Loss", formula: "x₂ = tanh(L_t)", range: "[0.0, 1.0)", interpretation: "Current training binary cross-entropy loss compressed via tanh" },
  { index: 3, name: "Log Gradient Norm", formula: "x₃ = clip((ln(‖g‖ + 1e-8) + 8)/12, -1, 1)", range: "[-1.0, 1.0]", interpretation: "Log-scale parameter-shift gradient magnitude detecting vanishing/exploding bounds" },
  { index: 4, name: "Log Gradient Variance", formula: "x₄ = clip((ln(Var(g) + 1e-10) + 10)/14, -1, 1)", range: "[-1.0, 1.0]", interpretation: "Parameter-shift variance across ansatz parameters capturing Haar concentration" },
  { index: 5, name: "Parameter Velocity", formula: "x₅ = tanh(10 · ‖v_t‖)", range: "[0.0, 1.0)", interpretation: "Velocity of Euclidean parameter displacement ‖θ_t - θ_{t-1}‖ across descent steps" },
  { index: 6, name: "Relative Circuit Depth", formula: "x₆ = L / L_max", range: "[0.125, 1.0]", interpretation: "Current entangling ansatz layer count normalized to maximum depth 8" },
  { index: 7, name: "Quantum State Purity", formula: "x₇ = 2 · (γ - 0.75)", range: "[-1.0, 1.0]", interpretation: "Single-qubit reduced density matrix purity γ = (1 + ‖r⃗‖²)/2 tracking decoherence" },
  { index: 8, name: "Step Progression", formula: "x₈ = t / t_max", range: "[0.0, 1.0]", interpretation: "Current optimization epoch relative to total training horizon" },
  { index: 9, name: "Failure Type Index", formula: "x₉ = (code - 3.5) / 2.5", range: "[-1.0, 1.0]", interpretation: "Normalized categorical index of diagnosed anomaly (BP, LRM, OPT, DIV, PP, DEC)" },
  { index: 10, name: "Diagnosis Confidence", formula: "x₁₀ = 2 · (P(cause) - 0.5)", range: "[-1.0, 1.0]", interpretation: "Posterior probability output of the Bayesian classifier centered around zero" },
  { index: 11, name: "Episodic Prior Reward", formula: "x₁₁ = tanh(r_mem)", range: "[-1.0, 1.0]", interpretation: "Reward observed in top cosine-similar historical episode retrieved from SQLite" },
  { index: 12, name: "Log Learning Rate", formula: "x₁₂ = clip(log₁₀(η)/4 + 1, -1, 1)", range: "[-1.0, 1.0]", interpretation: "Base-10 log classical optimizer learning rate scaled across [1e-4, 1.0]" },
];

export const ContextualIntelligenceSection: React.FC = () => {
  const [selectedFeature, setSelectedFeature] = useState<number>(1);
  const feat = CONTEXT_FEATURES[selectedFeature - 1];

  return (
    <section id="contextual-intelligence" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[07 // BANDIT DECISION ENGINE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            12-Dimensional Context Representation & Thompson Sampling.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Repair selection cannot rely on naive static lookup tables. The runtime synthesizes an orthogonal 12-dimensional state vector x ∈ [-1, 1]¹² to condition a Bayesian Contextual Multi-Armed Bandit using Thompson Sampling.
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
                      ? "glass-panel border-[var(--accent)] shadow-sm"
                      : "bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] hover:bg-[var(--bg-surface)]"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--accent)]">
                        x{item.index}
                      </span>
                      <span className="font-bold text-xs text-[var(--content-primary)] truncate max-w-[150px]">
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] text-[var(--content-tertiary)] block mt-0.5">
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
            <div className="glass-panel p-8 tech-crosshair relative space-y-6">
              <div className="flex items-center justify-between pb-6 border-b border-[var(--border-subtle)]">
                <div>
                  <span className="font-mono text-xs text-[var(--content-tertiary)] block">
                    FEATURE x{feat.index} SPECIFICATION
                  </span>
                  <h3 className="text-2xl font-bold font-display text-[var(--content-primary)]">
                    {feat.name}
                  </h3>
                </div>

                <div className="px-3 py-1 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] font-mono text-xs text-[var(--accent)] font-bold">
                  {feat.range}
                </div>
              </div>

              {/* Exact Mathematical Formula */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)]">
                  MATHEMATICAL NORMALIZATION MAPPING
                </span>
                <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] font-mono text-xs text-[var(--accent)] overflow-x-auto">
                  <code>{feat.formula}</code>
                </div>
              </div>

              {/* Physical Interpretation */}
              <div className="space-y-2">
                <span className="text-xs font-mono uppercase tracking-wider text-[var(--content-tertiary)]">
                  SEMANTIC & STATE-SPACE SIGNIFICANCE
                </span>
                <p className="text-xs text-[var(--content-secondary)] leading-relaxed">
                  {feat.interpretation}
                </p>
              </div>

              {/* Thompson Sampling Posterior Formulation */}
              <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[var(--content-primary)] font-bold block">
                  BAYESIAN POSTERIOR SAMPLING RULE
                </span>
                <p className="text-[11px] font-mono text-[var(--content-secondary)] leading-relaxed">
                  Payoff sampled via θ̃_a ~ N(μ_a, v² B_a⁻¹). Arm with highest expected reward r̂_a = xᵀ θ̃_a deployed if eligible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
