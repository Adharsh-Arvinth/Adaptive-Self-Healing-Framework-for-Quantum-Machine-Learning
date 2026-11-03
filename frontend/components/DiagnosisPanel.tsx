"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Activity } from "lucide-react";
import { DiagnosisData } from "@/types";

interface DiagnosisPanelProps {
  diagnosis: DiagnosisData | null;
  activeAnomalies: string[];
}

const CATEGORY_LABELS: Record<string, { name: string; tag: string; desc: string }> = {
  barren_plateau: {
    name: "Barren Plateau",
    tag: "Vanishing Gradients",
    desc: "Gradient variance Var(g) < 1e-5 exponentially attenuated with depth",
  },
  lr_misconfiguration: {
    name: "LR Misconfiguration",
    tag: "Oscillation / Stagnation",
    desc: "Sub-optimal learning rate causing loss jitter or frozen progress",
  },
  optimizer_instability: {
    name: "Optimizer Instability",
    tag: "Momentum Explosion",
    desc: "Parameter velocity norm surges without descent progress",
  },
  training_divergence: {
    name: "Training Divergence",
    tag: "Loss Exploded / NaN",
    desc: "Loss diverges exponentially or produces non-finite gradients",
  },
  persistent_plateau: {
    name: "Saddle-Point Plateau",
    tag: "Zero Curvature",
    desc: "Loss stalled across multiple epochs despite non-zero gradient norm",
  },
  noise_degradation: {
    name: "Noise Contraction",
    tag: "Decoherence Mixed State",
    desc: "Bloch vector length contracted toward origin (purity γ < 0.90)",
  },
};

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ diagnosis, activeAnomalies }) => {
  const confidence = diagnosis ? diagnosis.confidence : 0.0;
  const gateCleared = diagnosis ? diagnosis.confidence_gate_cleared : false;
  const probs = diagnosis ? diagnosis.probabilities : {};

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      {/* Panel Symmetrical Header */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--status-warning-subtle)] flex items-center justify-center text-[var(--status-warning)] shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
                Root-Cause Diagnosis & Confidence Gate
              </h2>
              <p className="text-[11px] text-[var(--content-tertiary)]">
                Bayesian posterior inference across 6 non-overlapping quantum failure classes
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-1.5 shrink-0 ${
              gateCleared
                ? "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/30 font-semibold"
                : "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-[var(--status-warning)]/30"
            }`}
          >
            {gateCleared ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> Cleared (≥ 0.60)
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> Gate Hold (&lt; 0.60)
              </>
            )}
          </div>
        </div>

        {/* Active Anomalies Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[26px]">
          {activeAnomalies.length > 0 ? (
            activeAnomalies.map((anom) => (
              <span
                key={anom}
                className="px-2.5 py-0.5 rounded-full bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border border-[var(--status-danger)]/30 text-[11px] font-mono flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                FAULT: {CATEGORY_LABELS[anom]?.name || anom}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--content-secondary)] flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-[var(--status-success)]" /> Nominal state — zero active anomalies
            </span>
          )}
        </div>

        {/* Bayesian Confidence Gauge with tau = 0.60 Threshold Notch */}
        <div className="mb-4 p-3.5 rounded-xl glass-panel-subtle border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center text-xs font-mono mb-2">
            <span className="text-[var(--content-secondary)]">Primary Cause Confidence</span>
            <span className={`font-semibold ${confidence >= 0.6 ? "text-[var(--status-success)]" : "text-[var(--content-primary)]"}`}>
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>

          {/* Progress bar with production gate threshold line */}
          <div className="relative w-full h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                confidence >= 0.6 ? "bg-[var(--status-success)]" : "bg-[var(--status-warning)]"
              }`}
              style={{ width: `${Math.min(100, confidence * 100)}%` }}
            />
            {/* Notch at tau = 0.60 */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent)] z-10"
              style={{ left: "60%" }}
              title="Production Gate Threshold tau = 0.60"
            />
          </div>

          <div className="flex justify-between text-[10px] font-mono text-[var(--content-tertiary)] mt-1.5">
            <span>0.00</span>
            <span className="text-[var(--accent)] font-medium">Production Gate τ = 0.60</span>
            <span>1.00</span>
          </div>
        </div>

        {/* Multiclass Failure Probabilities Grid */}
        <div className="space-y-2">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const prob = probs[key] ?? 0.0;
            const isHighest = diagnosis?.primary_cause === key && prob > 0.0;

            return (
              <div
                key={key}
                className={`p-2 rounded-lg flex items-center justify-between text-xs transition-colors ${
                  isHighest ? "bg-[var(--status-warning-subtle)] border border-[var(--status-warning)]/30" : "hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="flex-1 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-[var(--content-primary)]">{label.name}</span>
                    <span className="text-[10px] text-[var(--content-tertiary)] font-mono">({label.tag})</span>
                  </div>
                  <div className="w-full bg-[var(--bg-subtle)] h-1 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full transition-all duration-300 ${
                        isHighest ? "bg-[var(--status-warning)]" : "bg-[var(--content-tertiary)]/40"
                      }`}
                      style={{ width: `${Math.min(100, prob * 100)}%` }}
                    />
                  </div>
                </div>
                <span className="font-mono text-[11px] text-[var(--content-primary)] font-semibold shrink-0">
                  {(prob * 100).toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Panel Footer */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--content-tertiary)]">
        <span>Deterministic Rule + Bayesian Categorical Posterior</span>
        <span>Threshold τ = 0.60</span>
      </div>
    </div>
  );
};
