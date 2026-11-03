"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";
import { DiagnosisData } from "@/types";

interface DiagnosisPanelProps {
  diagnosis: DiagnosisData | null;
  activeAnomalies: string[];
}

const CANONICAL_FAILURES: Record<
  string,
  { name: string; mechanism: string; invariant: string; category: string }
> = {
  barren_plateau: {
    name: "Barren Plateau",
    mechanism: "Vanishing variance Var(g) < 1e-5",
    invariant: "Exponential gradient suppression under deep Haar-random states",
    category: "Ansatz Depth",
  },
  lr_misconfiguration: {
    name: "LR Misconfiguration",
    mechanism: "Loss jitter / non-monotonic step",
    invariant: "Step-size outside stable lipschitz contraction bounds",
    category: "Optimization",
  },
  optimizer_instability: {
    name: "Optimizer Instability",
    mechanism: "Surging parameter velocity norm",
    invariant: "Momentum explosion without loss descent progress",
    category: "Optimization",
  },
  training_divergence: {
    name: "Training Divergence",
    mechanism: "Loss exploded or NaN gradient",
    invariant: "Numerical singularity or parameter runaway",
    category: "Numerical",
  },
  persistent_plateau: {
    name: "Persistent Plateau",
    mechanism: "Zero curvature across epochs",
    invariant: "Stalled loss trajectory despite non-zero gradient norm",
    category: "Landscape",
  },
  noise_degradation: {
    name: "Noise Contraction",
    mechanism: "Bloch vector shrinkage (γ < 0.90)",
    invariant: "Decoherence radial contraction towards maximally mixed state",
    category: "Quantum State",
  },
};

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({
  diagnosis,
  activeAnomalies = [],
}) => {
  const [showFullTaxonomy, setShowFullTaxonomy] = useState(false);

  const confidence = diagnosis?.confidence ?? 0.0;
  const gateCleared = diagnosis?.confidence_gate_cleared ?? false;
  const probs = diagnosis?.probabilities ?? {};
  const hasActiveAnomalies = activeAnomalies.length > 0;
  const primaryCause = diagnosis?.primary_cause;

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full font-sans">
      {/* Symmetrical Panel Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--content-primary)]">
                Root-Cause Diagnosis & Bayesian Gate
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--content-secondary)] border border-[var(--border-subtle)]">
                Threshold τ = 0.60
              </span>
            </div>
            <p className="text-xs text-[var(--content-secondary)] mt-0.5">
              Bayesian categorical posterior evaluation over 6 canonical quantum failure modes
            </p>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 shrink-0 ${
              gateCleared
                ? "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/30 font-semibold"
                : "bg-[var(--bg-subtle)] text-[var(--content-secondary)] border-[var(--border-subtle)]"
            }`}
          >
            {gateCleared ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>Gate Cleared (≥ 0.60)</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--content-tertiary)]" />
                <span>Gate Hold (&lt; 0.60)</span>
              </>
            )}
          </div>
        </div>

        {/* State Display: Either Nominal State OR Detected Anomaly */}
        {!hasActiveAnomalies && (!primaryCause || primaryCause === "nominal") ? (
          /* High-Quality Meaningful Nominal State */
          <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-[var(--content-primary)]">
                  Nominal Regime — Zero Active Anomalies
                </span>
              </div>
              <span className="text-[11px] font-mono text-[var(--status-success)] font-medium">
                P(Nominal) &gt; 99%
              </span>
            </div>

            <p className="text-xs text-[var(--content-secondary)] leading-relaxed">
              Model parameters are traversing a stable descent trajectory. Gradient variance, parameter velocity,
              and quantum purity satisfy operational invariants. Automatic repair intervention is intentionally held to prevent unnecessary parameter perturbation.
            </p>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px] font-mono">
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] block">Gradient Field</span>
                <span className="text-[var(--content-primary)] font-semibold">Variance Normal</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] block">Quantum State</span>
                <span className="text-[var(--content-primary)] font-semibold">Purity γ ≥ 0.90</span>
              </div>
              <div>
                <span className="text-[10px] text-[var(--content-tertiary)] block">Gate Policy</span>
                <span className="text-[var(--content-secondary)] font-semibold">Intervention Hold</span>
              </div>
            </div>
          </div>
        ) : (
          /* Active Failure Alert Stage */
          <div className="p-4 rounded-xl bg-[var(--status-danger-subtle)] border border-[var(--status-danger)]/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[var(--status-danger)]" />
                <span className="text-xs font-semibold text-[var(--status-danger)]">
                  Primary Failure: {CANONICAL_FAILURES[primaryCause || ""]?.name || primaryCause}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-[var(--status-danger)]">
                {(confidence * 100).toFixed(1)}% Confidence
              </span>
            </div>

            <p className="text-xs text-[var(--content-secondary)] leading-relaxed">
              {CANONICAL_FAILURES[primaryCause || ""]?.mechanism || "Invariant violation observed in telemetry."}
            </p>

            <div className="flex items-center justify-between text-xs font-mono pt-2 border-t border-[var(--status-danger)]/20">
              <span className="text-[var(--content-secondary)]">Confidence Gate τ = 0.60</span>
              <span className={gateCleared ? "text-[var(--status-success)] font-semibold" : "text-[var(--status-warning)] font-semibold"}>
                {gateCleared ? "Cleared: Interventions Permitted" : "Held: Confidence Insufficient"}
              </span>
            </div>
          </div>
        )}

        {/* Bayesian Confidence Progress Bar */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--content-secondary)]">
            <span>Primary Cause Posterior Probability</span>
            <span className="font-mono text-[var(--content-primary)] font-semibold">
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="relative w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                confidence >= 0.60 ? "bg-[var(--status-success)]" : "bg-[var(--accent)]"
              }`}
              style={{ width: `${Math.min(100, Math.max(3, confidence * 100))}%` }}
            />
            {/* Notch at tau = 0.60 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--status-warning)] z-10"
              style={{ left: "60%" }}
              title="Confidence Gate Threshold τ = 0.60"
            />
          </div>

          <div className="flex items-center justify-between text-[10px] text-[var(--content-tertiary)] font-mono">
            <span>0.00</span>
            <span className="text-[var(--status-warning)] font-medium">τ = 0.60 Decision Threshold</span>
            <span>1.00</span>
          </div>
        </div>

        {/* Expandable 6-Failure Posterior Inspector */}
        <div className="mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <button
            onClick={() => setShowFullTaxonomy(!showFullTaxonomy)}
            className="w-full flex items-center justify-between text-xs text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-colors py-1 font-medium"
          >
            <span>Inspect 6 Canonical Failure Posteriors</span>
            <span className="flex items-center gap-1 text-[11px] font-mono text-[var(--content-tertiary)]">
              {showFullTaxonomy ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              <span>{showFullTaxonomy ? "Hide" : "Show All"}</span>
            </span>
          </button>

          {showFullTaxonomy && (
            <div className="mt-2.5 space-y-1.5 rounded-lg border border-[var(--border-subtle)] p-2.5 bg-[var(--bg-surface)]">
              {Object.entries(CANONICAL_FAILURES).map(([key, item]) => {
                const p = probs[key] ?? 0.0;
                const isSelected = primaryCause === key && p > 0.0;
                return (
                  <div
                    key={key}
                    className={`p-2 rounded-md flex items-center justify-between text-xs transition-colors ${
                      isSelected ? "bg-[var(--status-warning-subtle)] font-medium" : "hover:bg-[var(--bg-subtle)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--content-primary)] font-medium">{item.name}</span>
                        <span className="text-[10px] font-mono text-[var(--content-tertiary)]">{item.category}</span>
                      </div>
                      <div className="text-[11px] text-[var(--content-secondary)]">{item.mechanism}</div>
                    </div>
                    <span className="font-mono text-xs text-[var(--content-primary)] font-semibold shrink-0">
                      {(p * 100).toFixed(1)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Symmetrical Panel Footer */}
      <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--content-tertiary)] font-mono">
        <span>Deterministic Rule + Bayesian Categorical Posterior</span>
        <span>Decision: {gateCleared ? "Intervene" : "Hold"}</span>
      </div>
    </div>
  );
};
