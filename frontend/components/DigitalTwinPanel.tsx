"use client";

import React, { useState } from "react";
import { Eye, CheckCircle2, XCircle, FlaskConical, Play } from "lucide-react";
import { DigitalTwinPrediction, EvaluationRecord } from "@/types";

interface DigitalTwinPanelProps {
  prediction: DigitalTwinPrediction | null;
  evaluation: EvaluationRecord | null;
  onSimulateTwin?: (arm: string) => Promise<DigitalTwinPrediction | null>;
  selectedArm?: string | null;
}

const ARMS = [
  "adjust_learning_rate",
  "change_optimizer",
  "reduce_circuit_depth",
  "modify_feature_map",
  "apply_noise_mitigation",
  "perform_warm_restart",
];

export const DigitalTwinPanel: React.FC<DigitalTwinPanelProps> = ({
  prediction,
  evaluation,
  onSimulateTwin,
  selectedArm,
}) => {
  const [testArm, setTestArm] = useState<string>(selectedArm || "adjust_learning_rate");
  const [isSimulating, setIsSimulating] = useState(false);
  const [customPrediction, setCustomPrediction] = useState<DigitalTwinPrediction | null>(null);

  const activePred = customPrediction || prediction;

  const isViable = activePred ? activePred.is_viable !== false : true;
  const trajectory = activePred?.proxy_loss_trajectory || [];
  const delta = activePred?.predicted_loss_delta ?? 0.0;
  const stability = activePred?.proxy_stability ?? 0.0;
  const gradVar = activePred?.proxy_grad_variance ?? 0.0;
  const evals = activePred?.circuit_evaluations ?? 0;

  const handleRunSimulation = async () => {
    if (!onSimulateTwin) return;
    setIsSimulating(true);
    try {
      const res = await onSimulateTwin(testArm);
      if (res) {
        setCustomPrediction(res);
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="glass-panel p-5 font-sans flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Digital-Twin Proxy Simulator (H = 3)
            </h2>
          </div>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-mono border flex items-center gap-1 ${
              isViable
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
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
        <div className="mb-3.5 p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-[var(--content-secondary)] uppercase tracking-wider">
              Proxy Loss Trajectory (H = 3 steps)
            </span>
            {activePred?.arm && (
              <span className="text-[10px] text-[var(--accent)] font-semibold">
                Arm: {activePred.arm.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between">
            {trajectory.length > 0 ? (
              trajectory.map((val, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[10px] text-[var(--content-secondary)]">h = {idx}</span>
                  <span className="text-[var(--content-primary)] font-semibold">{val.toFixed(4)}</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-[var(--content-secondary)] py-1">
                Awaiting proxy trajectory simulation...
              </span>
            )}
          </div>
        </div>

        {/* Prediction Metrics Grid */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {/* Predicted Delta */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <span className="text-[10px] text-[var(--content-secondary)] font-mono">Predicted Delta</span>
            <span
              className={`text-sm font-bold font-mono ${
                delta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {delta >= 0 ? `+${delta.toFixed(4)}` : delta.toFixed(4)}
            </span>
          </div>

          {/* Proxy Stability */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <span className="text-[10px] text-[var(--content-secondary)] font-mono">Stability Score</span>
            <span className="text-sm font-bold font-mono text-[var(--accent)]">
              {(stability * 100).toFixed(1)}%
            </span>
          </div>

          {/* Uncertainty (Grad Var) */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <span className="text-[10px] text-[var(--content-secondary)] font-mono">Uncertainty σ²</span>
            <span className="text-sm font-mono text-[var(--content-primary)] font-semibold">
              {gradVar.toExponential(2)}
            </span>
          </div>

          {/* Quantum Circuit Evals */}
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
            <span className="text-[10px] text-[var(--content-secondary)] font-mono">Quantum Cost</span>
            <span className="text-sm font-mono text-cyan-400 font-semibold">
              {evals} <span className="text-[10px] font-normal text-[var(--content-secondary)]">evals</span>
            </span>
          </div>
        </div>

        {/* Sandbox Tester Control */}
        {onSimulateTwin && (
          <div className="p-2.5 rounded-xl bg-[var(--bg-surface)]/70 border border-[var(--border-subtle)] mb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-[var(--content-primary)]">
                <FlaskConical className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Sandbox Test:</span>
              </div>
              <div className="flex items-center gap-1.5 flex-1 max-w-[220px]">
                <select
                  value={testArm}
                  onChange={(e) => setTestArm(e.target.value)}
                  className="w-full text-[10px] font-mono px-2 py-1 rounded bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none"
                >
                  {ARMS.map((a) => (
                    <option key={a} value={a}>
                      {a.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="apple-btn px-2.5 py-1 rounded text-[10px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white shrink-0 flex items-center gap-1"
                >
                  <Play className="w-2.5 h-2.5" />
                  <span>{isSimulating ? "Sim..." : "Run"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actual vs Predicted Fidelity Tracker */}
      {evaluation && (
        <div className="pt-2 border-t border-[var(--border-subtle)] font-mono text-xs">
          <div className="flex justify-between text-[var(--content-secondary)] text-[10px] mb-1">
            <span>PREDICTED VS ACTUAL REWARD FIDELITY</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span>
              Pred:{" "}
              <span className="text-[var(--accent)] font-semibold">
                {evaluation.predicted_reward?.toFixed(4) ?? "N/A"}
              </span>
            </span>
            <span>
              Actual:{" "}
              <span className="text-emerald-400 font-semibold">
                {evaluation.actual_reward?.toFixed(4) ?? "N/A"}
              </span>
            </span>
            <span>
              MAE:{" "}
              <span className="text-amber-400 font-bold">
                {evaluation.prediction_error?.toFixed(4) ?? "0.0000"}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
