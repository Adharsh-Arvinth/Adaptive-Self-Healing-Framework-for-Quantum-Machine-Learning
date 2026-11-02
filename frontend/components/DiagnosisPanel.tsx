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
    desc: "Bloch vector length contracted toward origin (purity gamma < 0.90)",
  },
};

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ diagnosis, activeAnomalies }) => {
  const confidence = diagnosis ? diagnosis.confidence : 0.0;
  const gateCleared = diagnosis ? diagnosis.confidence_gate_cleared : false;
  const probs = diagnosis ? diagnosis.probabilities : {};

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full">
      {/* Panel Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Root-Cause Diagnosis & Confidence Gate
            </h2>
          </div>
          <div
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1.5 ${
              gateCleared
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold"
                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
            }`}
          >
            {gateCleared ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Cleared (≥ 0.60)
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" /> Gate Hold (&lt; 0.60)
              </>
            )}
          </div>
        </div>

        {/* Active Anomalies Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3.5">
          {activeAnomalies.length > 0 ? (
            activeAnomalies.map((anom) => (
              <span
                key={anom}
                className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[11px] font-mono flex items-center gap-1"
              >
                <Activity className="w-3 h-3" />
                FAULT: {CATEGORY_LABELS[anom]?.name || anom}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--content-secondary)] flex items-center gap-1.5 font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Nominal state — zero active anomalies
            </span>
          )}
        </div>

        {/* Bayesian Confidence Gauge with tau = 0.60 Threshold Notch */}
        <div className="mb-4 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <div className="flex justify-between items-center text-[11px] font-mono text-[var(--content-secondary)] mb-1.5">
            <span>Primary Cause Confidence</span>
            <span
              className={`font-bold ${
                confidence >= 0.60 ? "text-emerald-400" : "text-[var(--content-primary)]"
              }`}
            >
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="relative w-full h-2.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                confidence >= 0.60
                  ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                  : "bg-gradient-to-r from-amber-500 to-amber-400"
              }`}
              style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
            />
            {/* 60% Gate Threshold Notch */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/80 shadow-sm"
              style={{ left: "60%" }}
              title="Confidence Gate (tau = 0.60)"
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[var(--content-secondary)] mt-1.5">
            <span>0.00</span>
            <span className="text-purple-400 font-semibold">Production Gate τ = 0.60</span>
            <span>1.00</span>
          </div>
        </div>

        {/* Six Categories Probability Distribution */}
        <div className="space-y-2 mb-3">
          {Object.entries(CATEGORY_LABELS).map(([key, meta]) => {
            const prob = probs[key] || 0.0;
            const isPrimary = diagnosis?.primary_cause === key;
            return (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-[11px] font-mono">
                  <span
                    className={
                      isPrimary
                        ? "text-purple-400 font-semibold flex items-center gap-1"
                        : "text-[var(--content-secondary)]"
                    }
                  >
                    {meta.name} {isPrimary && "★"}
                  </span>
                  <span
                    className={
                      isPrimary
                        ? "text-purple-400 font-semibold"
                        : "text-[var(--content-secondary)]"
                    }
                  >
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 rounded-full ${
                      isPrimary ? "bg-purple-500" : "bg-[var(--content-secondary)]/30"
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, prob * 100))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supporting Diagnostic Evidence */}
      {diagnosis && diagnosis.supporting_evidence && diagnosis.supporting_evidence.length > 0 && (
        <div className="pt-2.5 border-t border-[var(--border-subtle)]">
          <span className="text-[10px] font-mono text-[var(--content-secondary)] uppercase tracking-wider block mb-1">
            Diagnostic Evidence
          </span>
          <ul className="text-[11px] text-[var(--content-primary)] space-y-1 font-mono">
            {diagnosis.supporting_evidence.slice(0, 3).map((ev, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-amber-400 shrink-0">•</span>
                <span className="leading-tight">{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
