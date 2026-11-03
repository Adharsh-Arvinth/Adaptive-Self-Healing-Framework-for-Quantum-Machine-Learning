"use client";

import React, { useState } from "react";
import { BarChart2, Info, Sparkles, TrendingDown } from "lucide-react";
import { TelemetryPoint } from "@/types";

interface LossChartProps {
  history: TelemetryPoint[];
}

type ChartMode = "loss" | "accuracy" | "dual";

export const LossChart: React.FC<LossChartProps> = ({ history }) => {
  const [mode, setMode] = useState<ChartMode>("loss");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const hasData = history.length > 0;

  // Chart Dimensions & Padding
  const width = 800;
  const height = 300;
  const padding = { top: 25, right: 30, bottom: 35, left: 50 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Extents
  const maxStep = hasData ? Math.max(10, ...history.map((d) => d.step)) : 60;
  const minStep = 0;
  const maxLoss = hasData ? Math.min(3.0, Math.max(1.0, ...history.map((d) => Math.max(d.loss, d.val_loss)))) : 1.2;

  // Coordinate scales
  const getX = (step: number) => padding.left + ((step - minStep) / (maxStep - minStep)) * innerWidth;
  const getYLoss = (lossVal: number) =>
    padding.top + innerHeight - (Math.min(lossVal, maxLoss) / maxLoss) * innerHeight;
  const getYAcc = (accVal: number) =>
    padding.top + innerHeight - Math.min(1.0, Math.max(0.0, accVal)) * innerHeight;

  // SVG Paths
  const trainLossPath = hasData
    ? history.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYLoss(d.loss).toFixed(1)}`).join(" ")
    : "";

  const valLossPath = hasData
    ? history.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYLoss(d.val_loss).toFixed(1)}`).join(" ")
    : "";

  const trainAccPath = hasData
    ? history.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYAcc(d.accuracy).toFixed(1)}`).join(" ")
    : "";

  const valAccPath = hasData
    ? history.map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getYAcc(d.val_accuracy).toFixed(1)}`).join(" ")
    : "";

  const activePoint = hoveredIdx !== null && history[hoveredIdx] ? history[hoveredIdx] : (hasData ? history[history.length - 1] : null);

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full font-sans">
      {/* Symmetrical Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--content-primary)]">
              {mode === "loss"
                ? "Binary Cross-Entropy Loss Trajectory"
                : mode === "accuracy"
                ? "Classification Accuracy Convergence"
                : "Dual Loss & Accuracy Dynamics"}
            </h3>
            {hasData && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--content-secondary)]">
                Step {activePoint?.step ?? 0}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--content-secondary)] mt-0.5">
            Step-by-step optimization curve showing training vs validation holdout
          </p>
        </div>

        {/* Right Controls: Mode Switcher & Legend */}
        <div className="flex items-center gap-3 text-xs">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-[var(--content-secondary)]">
              <span className="w-2.5 h-0.5 bg-[var(--accent)] rounded-full" />
              <span>Training</span>
            </span>
            <span className="flex items-center gap-1.5 text-[var(--content-secondary)]">
              <span className="w-2.5 h-0.5 border-b border-dashed border-[var(--status-warning)]" />
              <span>Validation</span>
            </span>
          </div>

          {/* Segmented Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
            <button
              onClick={() => setMode("loss")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "loss"
                  ? "bg-[var(--bg-surface)] text-[var(--content-primary)] shadow-sm font-semibold"
                  : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
              }`}
            >
              Loss
            </button>
            <button
              onClick={() => setMode("accuracy")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "accuracy"
                  ? "bg-[var(--bg-surface)] text-[var(--content-primary)] shadow-sm font-semibold"
                  : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
              }`}
            >
              Accuracy
            </button>
            <button
              onClick={() => setMode("dual")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                mode === "dual"
                  ? "bg-[var(--bg-surface)] text-[var(--content-primary)] shadow-sm font-semibold"
                  : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
              }`}
            >
              Dual
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden flex-1 min-h-[220px]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Background Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const y = padding.top + innerHeight * (1 - ratio);
            const val = mode === "loss" ? (ratio * maxLoss).toFixed(2) : `${(ratio * 100).toFixed(0)}%`;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="currentColor"
                  className="text-[var(--border-subtle)]"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-[var(--content-tertiary)] text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Theoretical Cross-Entropy Baseline line at 0.6931 */}
          {mode !== "accuracy" && (
            <g>
              <line
                x1={padding.left}
                y1={getYLoss(0.6931)}
                x2={width - padding.right}
                y2={getYLoss(0.6931)}
                stroke="#C25E38"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.6"
              />
              <text
                x={width - padding.right - 4}
                y={getYLoss(0.6931) - 4}
                textAnchor="end"
                className="fill-[#C25E38] text-[9px] font-mono"
              >
                ln(2) = 0.6931 Baseline
              </text>
            </g>
          )}

          {/* X Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1.0].map((ratio) => {
            const stepVal = Math.round(minStep + ratio * (maxStep - minStep));
            const x = padding.left + ratio * innerWidth;
            return (
              <text
                key={ratio}
                x={x}
                y={height - 12}
                textAnchor="middle"
                className="fill-[var(--content-tertiary)] text-[10px] font-mono"
              >
                t={stepVal}
              </text>
            );
          })}

          {/* If history exists, render actual lines */}
          {hasData ? (
            <>
              {/* Training Loss Curve */}
              {(mode === "loss" || mode === "dual") && (
                <path
                  d={trainLossPath}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Validation Loss Curve */}
              {(mode === "loss" || mode === "dual") && (
                <path
                  d={valLossPath}
                  fill="none"
                  stroke="var(--status-warning)"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Accuracy Curves */}
              {(mode === "accuracy" || mode === "dual") && (
                <>
                  <path
                    d={trainAccPath}
                    fill="none"
                    stroke="var(--status-success)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={valAccPath}
                    fill="none"
                    stroke="var(--status-info)"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}

              {/* Interactive Hover Columns */}
              {history.map((d, i) => {
                const x = getX(d.step);
                return (
                  <rect
                    key={d.step}
                    x={x - 6}
                    y={padding.top}
                    width={12}
                    height={innerHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredIdx(i)}
                  />
                );
              })}

              {/* Hover Indicator Crosshair */}
              {hoveredIdx !== null && history[hoveredIdx] && (
                <g>
                  <line
                    x1={getX(history[hoveredIdx].step)}
                    y1={padding.top}
                    x2={getX(history[hoveredIdx].step)}
                    y2={padding.top + innerHeight}
                    stroke="var(--content-secondary)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={getX(history[hoveredIdx].step)}
                    cy={mode === "accuracy" ? getYAcc(history[hoveredIdx].accuracy) : getYLoss(history[hoveredIdx].loss)}
                    r="4"
                    fill="var(--bg-surface)"
                    stroke="var(--accent)"
                    strokeWidth="2"
                  />
                </g>
              )}
            </>
          ) : (
            /* Meaningful Idle State Canvas Overlay */
            <g>
              {/* Soft baseline trajectory preview */}
              <path
                d={`M ${padding.left} ${getYLoss(0.6931)} Q ${padding.left + innerWidth * 0.4} ${getYLoss(0.60)}, ${padding.left + innerWidth} ${getYLoss(0.20)}`}
                fill="none"
                stroke="var(--border-highlight)"
                strokeWidth="1.5"
                strokeDasharray="3 4"
                opacity="0.5"
              />
            </g>
          )}
        </svg>

        {/* Meaningful Idle State Notice Overlay if No Data */}
        {!hasData && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-4">
            <div className="max-w-md bg-[var(--bg-surface)]/95 backdrop-blur-sm border border-[var(--border-subtle)] p-4 rounded-xl shadow-sm text-center">
              <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-[var(--content-primary)]">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Simulation Ready for Execution</span>
              </div>
              <p className="text-xs text-[var(--content-secondary)] mt-1 leading-relaxed">
                The Variational Quantum Classifier is initialized at the random-guess baseline (L0 ≈ 0.6931).
                Click <strong className="text-[var(--content-primary)]">Start Autonomous</strong> in the cockpit controls to stream parameter-shift descent steps.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Readout Strip */}
      <div className="pt-2.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between text-xs text-[var(--content-secondary)]">
        <div className="flex items-center gap-4">
          <span>
            Loss: <strong className="text-[var(--content-primary)] font-mono">{activePoint ? activePoint.loss.toFixed(4) : "0.6931"}</strong>
          </span>
          <span>
            Val Loss: <strong className="text-[var(--content-primary)] font-mono">{activePoint ? activePoint.val_loss.toFixed(4) : "0.6931"}</strong>
          </span>
          <span>
            Accuracy: <strong className="text-[var(--content-primary)] font-mono">{activePoint ? `${(activePoint.accuracy * 100).toFixed(1)}%` : "50.0%"}</strong>
          </span>
        </div>
        <div className="text-[11px] text-[var(--content-tertiary)] font-mono">
          Loss Function: BCE • Ansatz: Hardware-Efficient $R_y(\theta)$-$R_z(\theta)$
        </div>
      </div>
    </div>
  );
};
