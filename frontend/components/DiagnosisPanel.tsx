"use client";

import React from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles } from "lucide-react";

interface DiagnosisData {
  primary_cause: string | null;
  confidence: number;
  probabilities: Record<string, number>;
  confidence_gate_cleared: boolean;
  supporting_evidence: string[];
}

interface DiagnosisPanelProps {
  diagnosis: DiagnosisData | null;
  activeAnomalies: string[];
}

const CATEGORY_LABELS: Record<string, string> = {
  barren_plateau: "Barren Plateau",
  lr_misconfiguration: "LR Misconfig",
  optimizer_instability: "Optimizer Instab",
  training_divergence: "Divergence",
  persistent_plateau: "Saddle Plateau",
  noise_degradation: "Noise Contraction",
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
            <span className="text-xs font-semibold text-neutral-200">
              Root-Cause Diagnosis & Confidence Gate
            </span>
          </div>
          <div
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 ${
              gateCleared
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-neutral-500/10 text-neutral-400 border-white/5"
            }`}
          >
            {gateCleared ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Gate Cleared (≥ 0.60)
              </>
            ) : (
              <>
                <AlertTriangle className="w-3 h-3" /> Gate Hold (&lt; 0.60)
              </>
            )}
          </div>
        </div>

        {/* Active Anomalies Badges */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {activeAnomalies.length > 0 ? (
            activeAnomalies.map((anom) => (
              <span
                key={anom}
                className="px-2 py-0.5 rounded-md bg-rose-500/15 text-rose-300 border border-rose-500/30 text-[11px] font-mono"
              >
                FAULT: {CATEGORY_LABELS[anom] || anom}
              </span>
            ))
          ) : (
            <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Nominal state — zero active anomalies
            </span>
          )}
        </div>

        {/* Confidence Meter Bar with tau=0.60 Marker */}
        <div className="mb-4">
          <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
            <span>Primary Cause Confidence</span>
            <span className={confidence >= 0.60 ? "text-emerald-400 font-bold" : "text-neutral-300"}>
              {(confidence * 100).toFixed(1)}%
            </span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                confidence >= 0.60 ? "bg-emerald-400" : "bg-amber-400"
              }`}
              style={{ width: `${Math.min(100, confidence * 100)}%` }}
            />
            {/* 60% Gate Threshold Notch */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/60 shadow-sm"
              style={{ left: "60%" }}
              title="Confidence Gate (tau = 0.60)"
            />
          </div>
          <div className="flex justify-between text-[9px] font-mono text-neutral-400 mt-1">
            <span>0%</span>
            <span className="text-white/60 font-semibold">τ = 0.60 Gate</span>
            <span>100%</span>
          </div>
        </div>

        {/* Six Categories Probability Distribution */}
        <div className="space-y-2 mb-3">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const prob = probs[key] || 0.0;
            const isPrimary = diagnosis?.primary_cause === key;
            return (
              <div key={key} className="space-y-0.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className={isPrimary ? "text-purple-300 font-semibold" : "text-neutral-400"}>
                    {label} {isPrimary && "★"}
                  </span>
                  <span className={isPrimary ? "text-purple-300 font-semibold" : "text-neutral-400"}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isPrimary ? "bg-purple-500" : "bg-white/20"
                    }`}
                    style={{ width: `${Math.min(100, prob * 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supporting Diagnostic Evidence */}
      {diagnosis && diagnosis.supporting_evidence && diagnosis.supporting_evidence.length > 0 && (
        <div className="pt-2 border-t border-white/5">
          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-1">
            Diagnostic Evidence
          </span>
          <ul className="text-[11px] text-neutral-300 space-y-1 font-mono">
            {diagnosis.supporting_evidence.slice(0, 2).map((ev, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-amber-400">•</span>
                <span>{ev}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
