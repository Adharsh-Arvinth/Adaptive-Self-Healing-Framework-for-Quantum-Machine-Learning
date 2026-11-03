"use client";

import React, { useState } from "react";
import { Activity, BarChart2 } from "lucide-react";
import { TelemetryPoint } from "@/types";

interface LossChartProps {
  history: TelemetryPoint[];
}

type ChartMode = "loss" | "accuracy" | "dual";

export const LossChart: React.FC<LossChartProps> = ({ history }) => {
  const [mode, setMode] = useState<ChartMode>("loss");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="apple-card p-6 flex flex-col items-center justify-center min-h-[340px] text-content-tertiary">
        <Activity className="w-8 h-8 mb-3 animate-pulse text-content-secondary" />
        <span className="text-sm font-medium text-content-primary">Awaiting Real-Time Telemetry</span>
        <span className="text-xs text-content-secondary mt-1">
          Click &quot;Start Experiment&quot; in the header bar to initiate autonomous VQC training.
        </span>
      </div>
    );
  }

  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const width = 800;
  const height = 300;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Extents
  const maxStep = Math.max(10, ...history.map((d) => d.step));
  const minStep = 0;

  // Loss bounds
  const maxLoss = Math.min(3.0, Math.max(1.0, ...history.map((d) => Math.max(d.loss, d.val_loss))));

  // Coordinate scales
  const getX = (step: number) => padding.left + ((step - minStep) / (maxStep - minStep)) * innerWidth;
  const getYLoss = (lossVal: number) =>
    padding.top + innerHeight - (Math.min(lossVal, maxLoss) / maxLoss) * innerHeight;
  const getYAcc = (accVal: number) =>
    padding.top + innerHeight - (Math.min(1.0, Math.max(0.0, accVal))) * innerHeight;

  // Generate SVG path for Loss
  const trainLossPath = history
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYLoss(d.loss).toFixed(1)}`)
    .join(" ");

  const valLossPath = history
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYLoss(d.val_loss).toFixed(1)}`)
    .join(" ");

  // Generate SVG path for Accuracy
  const trainAccPath = history
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYAcc(d.accuracy).toFixed(1)}`)
    .join(" ");

  const valAccPath = history
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYAcc(d.val_accuracy).toFixed(1)}`)
    .join(" ");

  const activePoint = hoveredIdx !== null && history[hoveredIdx] ? history[hoveredIdx] : history[history.length - 1];

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      {/* Symmetrical Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
              {mode === "loss"
                ? "Binary Cross-Entropy Loss Trajectory"
                : mode === "accuracy"
                ? "Classification Accuracy Convergence"
                : "Dual Loss & Accuracy Dynamics"}
            </h3>
            <p className="text-[11px] text-[var(--content-tertiary)]">
              Continuous step-by-step quantum model optimization & convergence
            </p>
          </div>
        </div>

        {/* Right: Legend & Segmented Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* Segmented Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-bg-subtle border border-border-subtle text-xs">
            <button
              onClick={() => setMode("loss")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                mode === "loss"
                  ? "bg-bg-surface text-content-primary shadow-apple"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Loss
            </button>
            <button
              onClick={() => setMode("accuracy")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                mode === "accuracy"
                  ? "bg-bg-surface text-content-primary shadow-apple"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Accuracy
            </button>
            <button
              onClick={() => setMode("dual")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                mode === "dual"
                  ? "bg-bg-surface text-content-primary shadow-apple"
                  : "text-content-secondary hover:text-content-primary"
              }`}
            >
              Dual
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Defs: Gradients for area under curves */}
          <defs>
            <linearGradient id="trainLossGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="trainAccGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines (Horizontal) */}
          {[0.2, 0.4, 0.6, 0.8, 1.0].map((frac) => {
            const y = padding.top + innerHeight * (1.0 - frac);
            const valLabel =
              mode === "accuracy"
                ? `${(frac * 100).toFixed(0)}%`
                : (frac * maxLoss).toFixed(2);
            return (
              <g key={frac}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-border-subtle"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-content-tertiary font-mono"
                >
                  {valLabel}
                </text>
              </g>
            );
          })}

          {/* Vertical Step Grid */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
            const stepVal = Math.round(minStep + frac * (maxStep - minStep));
            const x = getX(stepVal);
            return (
              <g key={frac}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="currentColor"
                  className="text-border-subtle"
                  strokeDasharray="3 3"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-content-tertiary font-mono"
                >
                  Step {stepVal}
                </text>
              </g>
            );
          })}

          {/* Event Annotations (Anomalies & Commits) */}
          {history.map((pt) => {
            if (pt.anomalies && pt.anomalies.length > 0) {
              const x = getX(pt.step);
              return (
                <g key={`anom-${pt.step}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="#EF4444"
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                    opacity="0.6"
                  />
                  <circle cx={x} cy={padding.top + 8} r="3" fill="#EF4444" />
                </g>
              );
            }
            if (pt.state === "COMMITTED") {
              const x = getX(pt.step);
              return (
                <g key={`commit-${pt.step}`}>
                  <line
                    x1={x}
                    y1={padding.top}
                    x2={x}
                    y2={height - padding.bottom}
                    stroke="var(--status-success)"
                    strokeWidth="1.5"
                    opacity="0.7"
                  />
                  <circle cx={x} cy={padding.top + 8} r="3.5" fill="#10B981" />
                </g>
              );
            }
            return null;
          })}

          {/* Paths: LOSS MODE */}
          {(mode === "loss" || mode === "dual") && (
            <>
              {/* Training Loss Path */}
              <path
                d={trainLossPath}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Validation Loss Path (Dashed) */}
              <path
                d={valLossPath}
                fill="none"
                stroke="var(--status-warning)"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Paths: ACCURACY MODE */}
          {(mode === "accuracy" || mode === "dual") && (
            <>
              {/* Training Accuracy Path */}
              <path
                d={trainAccPath}
                fill="none"
                stroke="var(--status-success)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Validation Accuracy Path */}
              <path
                d={valAccPath}
                fill="none"
                stroke="var(--status-purity)"
                strokeWidth="1.8"
                strokeDasharray="4 3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}

          {/* Interactive Hover Crosshair */}
          {hoveredIdx !== null && history[hoveredIdx] && (
            <g>
              <line
                x1={getX(history[hoveredIdx].step)}
                y1={padding.top}
                x2={getX(history[hoveredIdx].step)}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-content-secondary"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(history[hoveredIdx].step)}
                cy={mode === "accuracy" ? getYAcc(history[hoveredIdx].val_accuracy) : getYLoss(history[hoveredIdx].loss)}
                r="4.5"
                fill="var(--accent)"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Invisible Overlay Rectangles for Hover Hit Detection */}
          {history.map((d, i) => {
            const barWidth = innerWidth / Math.max(1, history.length);
            return (
              <rect
                key={d.step}
                x={getX(d.step) - barWidth / 2}
                y={padding.top}
                width={barWidth}
                height={innerHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}
        </svg>
      </div>

      {/* Footer Readout & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-2 border-t border-border-subtle text-xs font-mono">
        <div className="flex items-center gap-4">
          {(mode === "loss" || mode === "dual") && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[var(--accent)] rounded-full" />
                <span className="text-content-secondary">Train Loss:</span>
                <span className="text-content-primary font-semibold">{activePoint.loss.toFixed(4)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[var(--status-warning)] rounded-full border-dashed" />
                <span className="text-content-secondary">Val Loss:</span>
                <span className="text-[var(--status-warning)] font-semibold">{activePoint.val_loss.toFixed(4)}</span>
              </div>
            </>
          )}

          {(mode === "accuracy" || mode === "dual") && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[var(--status-success)] rounded-full" />
                <span className="text-content-secondary">Train Acc:</span>
                <span className="text-[var(--status-success)] font-semibold">{(activePoint.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-1 bg-[var(--status-purity)] rounded-full border-dashed" />
                <span className="text-content-secondary">Val Acc:</span>
                <span className="text-[var(--status-purity)] font-semibold">{(activePoint.val_accuracy * 100).toFixed(1)}%</span>
              </div>
            </>
          )}
        </div>

        <div className="text-[11px] text-content-tertiary">
          Hover over data points to inspect step metrics
        </div>
      </div>
    </div>
  );
};
