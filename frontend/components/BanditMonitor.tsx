"use client";

import React from "react";
import { Network } from "lucide-react";
import { BanditDecisionData, PosteriorData } from "@/types";

interface BanditMonitorProps {
  decision: BanditDecisionData | null;
  posteriors: Record<string, PosteriorData> | null;
}

const FEATURE_NAMES = [
  "x1: Bias",
  "x2: Loss tanh",
  "x3: Log ||g||",
  "x4: Log Var(g)",
  "x5: Velocity",
  "x6: Depth L/8",
  "x7: P(diag)",
  "x8: Entropy",
  "x9: Mem Prior",
  "x10: Sim(q,v)",
  "x11: Twin Delta",
  "x12: Stability",
];

export const BanditMonitor: React.FC<BanditMonitorProps> = ({ decision, posteriors }) => {
  return (
    <div className="glass-panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-purple-400" />
          <span className="text-xs font-semibold text-neutral-200">
            Contextual Thompson Sampling & Bayesian Posteriors
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono text-neutral-400">
          <span>Mode:</span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 font-semibold">
            {decision?.decision_mode || "THOMPSON_SAMPLING"}
          </span>
        </div>
      </div>

      {/* Decision Summary */}
      {decision && (
        <div className="p-3 rounded-lg bg-black/20 border border-white/5 grid grid-cols-2 md:grid-cols-4 gap-2 font-mono text-xs mb-4">
          <div>
            <span className="text-[10px] text-neutral-400 block">Selected Arm</span>
            <span className="text-white font-semibold">{decision.selected_arm}</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block">Sampled Payoff r̃</span>
            <span className="text-purple-300 font-semibold">{decision.sampled_reward.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block">Expected Reward μ</span>
            <span className="text-cyan-300 font-semibold">{decision.expected_reward.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-400 block">Eligible Pool</span>
            <span className="text-emerald-400 font-semibold">{decision.eligible_arms.length} Arms</span>
          </div>
        </div>
      )}

      {/* Posterior Weights Across All 6 Arms */}
      <div className="mb-3">
        <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider block mb-2">
          Bayesian Posterior Beliefs Across Arms
        </span>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 font-mono text-xs">
          {posteriors &&
            Object.entries(posteriors).map(([armName, data]) => {
              const isSelected = decision?.selected_arm === armName;
              return (
                <div
                  key={armName}
                  className={`p-2.5 rounded-lg border flex flex-col justify-between ${
                    isSelected
                      ? "bg-purple-600/15 border-purple-500/40"
                      : "glass-panel-subtle"
                  }`}
                >
                  <span className="text-[10px] text-neutral-400 truncate" title={armName}>
                    {armName.replace(/_/g, " ")}
                  </span>
                  <div className="text-sm font-bold text-white mt-1">
                    {data.mu_norm.toFixed(3)}
                    <span className="text-[9px] text-neutral-400 font-normal ml-1">||μ||</span>
                  </div>
                  <div className="text-[9px] text-neutral-400 mt-1">
                    Updates: <span className="text-neutral-300">{data.update_count}</span>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 12-Dimensional Context Feature Space Reference */}
      <div className="pt-2 border-t border-white/5">
        <span className="text-[10px] font-mono text-neutral-500 block mb-1">
          12D Context Vector Feature Representation:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {FEATURE_NAMES.map((fn, idx) => (
            <span
              key={idx}
              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400"
            >
              {fn}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
