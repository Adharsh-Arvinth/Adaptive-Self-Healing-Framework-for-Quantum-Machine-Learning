"use client";

import React from "react";
import { Eye, CheckCircle2, XCircle } from "lucide-react";
import { DigitalTwinPrediction, EvaluationRecord } from "@/types";

interface DigitalTwinPanelProps {
  prediction: DigitalTwinPrediction | null;
  evaluation: EvaluationRecord | null;
}

export const DigitalTwinPanel: React.FC<DigitalTwinPanelProps> = ({ prediction, evaluation }) => {
  const isViable = prediction ? prediction.is_viable !== false : true;
  const trajectory = prediction?.proxy_loss_trajectory || [];
  const delta = prediction?.predicted_loss_delta ?? 0.0;
  const stability = prediction?.proxy_stability ?? 0.0;
  const gradVar = prediction?.proxy_grad_variance ?? 0.0;
  const evals = prediction?.circuit_evaluations ?? 0;

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold text-neutral-200">
              Digital-Twin Proxy Simulator (H = 3)
            </span>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 ${
              isViable
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
            }`}
          >
            {isViable ? (
              <>
                <CheckCircle2 className="w-3 h-3" /> Viable (&lt; 20% degradation)
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3" /> Viability Rejected
              </>
            )}
          </span>
        </div>

        {/* 3-Step Mini Trajectory Display */}
        <div className="mb-4 p-3 rounded-lg bg-black/20 border border-white/5 font-mono text-xs">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider block mb-2">
            Proxy Loss Trajectory (H = 3 steps)
          </span>
          <div className="flex items-center justify-between">
            {trajectory.length > 0 ? (
              trajectory.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[10px] text-neutral-400">h = {idx}</span>
                  <span className="text-white font-semibold">{val.toFixed(4)}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-neutral-400 py-1">
                Awaiting proxy simulation...
              </span>
            )}
          </div>
        </div>

        {/* Prediction Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Predicted Delta */}
          <div className="p-2.5 rounded-lg glass-panel-subtle flex flex-col justify-between">
            <span className="text-[10px] text-neutral-400 font-mono">Predicted Delta</span>
            <span
              className={`text-sm font-bold font-mono ${
                delta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {delta >= 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4)}
            </span>
          </div>

          {/* Proxy Stability */}
          <div className="p-2.5 rounded-lg glass-panel-subtle flex flex-col justify-between">
            <span className="text-[10px] text-neutral-400 font-mono">Stability Score</span>
            <span className="text-sm font-bold font-mono text-purple-300">
              {(stability * 100).toFixed(1)}%
            </span>
          </div>

          {/* Uncertainty (Grad Var) */}
          <div className="p-2.5 rounded-lg glass-panel-subtle flex flex-col justify-between">
            <span className="text-[10px] text-neutral-400 font-mono">Uncertainty σ²</span>
            <span className="text-sm font-mono text-white">
              {gradVar.toExponential(2)}
            </span>
          </div>

          {/* Quantum Circuit Evals */}
          <div className="p-2.5 rounded-lg glass-panel-subtle flex flex-col justify-between">
            <span className="text-[10px] text-neutral-400 font-mono">Quantum Cost</span>
            <span className="text-sm font-mono text-cyan-300">
              {evals} <span className="text-[10px] font-normal text-neutral-400">evals</span>
            </span>
          </div>
        </div>
      </div>

      {/* Actual vs Predicted Fidelity Tracker */}
      {evaluation && (
        <div className="pt-2 border-t border-white/5 font-mono text-xs">
          <div className="flex justify-between text-neutral-400 text-[10px] mb-1">
            <span>PREDICTED VS ACTUAL DEPLOYMENT FIDELITY</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>
              Pred:{" "}
              <span className="text-indigo-300">
                {evaluation.predicted_reward?.toFixed(4) ?? "N/A"}
              </span>
            </span>
            <span>
              Actual:{" "}
              <span className="text-emerald-300">
                {evaluation.actual_reward?.toFixed(4) ?? "N/A"}
              </span>
            </span>
            <span>
              MAE:{" "}
              <span className="text-amber-300 font-semibold">
                {evaluation.prediction_error?.toFixed(4) ?? "0.0000"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
