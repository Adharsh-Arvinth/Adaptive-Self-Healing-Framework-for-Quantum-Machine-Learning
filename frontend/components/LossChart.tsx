"use client";

import React, { useState } from "react";
import { Activity } from "lucide-react";
import { TelemetryPoint } from "@/types";

interface LossChartProps {
  history: TelemetryPoint[];
}

export const LossChart: React.FC<LossChartProps> = ({ history }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (history.length === 0) {
    return (
      <div className="glass-panel p-6 flex flex-col items-center justify-center h-72 text-neutral-500">
        <Activity className="w-8 h-8 mb-2 animate-pulse text-neutral-600" />
        <span className="text-xs font-mono">Awaiting training telemetry...</span>
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const width = 600;
  const height = 240;

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Extents
  const maxStep = Math.max(10, ...history.map((d) => d.step));
  const maxLoss = Math.min(2.5, Math.max(1.0, ...history.map((d) => Math.max(d.loss, d.val_loss))));
  const minLoss = 0.0;

  // Coordinate scales
  const getX = (step: number) => padding.left + (step / maxStep) * innerWidth;
  const getY = (lossVal: number) =>
    padding.top + innerHeight - (Math.min(lossVal, maxLoss) / maxLoss) * innerHeight;

  // Generate SVG paths
  const trainPath = history
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getY(d.loss).toFixed(1)}`)
    .join(" ");

  const valPath = history
    .map((d, i) => `${i === 0 ? "M" : "L"} ${getX(d.step).toFixed(1)} ${getY(d.val_loss).toFixed(1)}`)
    .join(" ");

  const activePoint = hoveredIdx !== null && history[hoveredIdx] ? history[hoveredIdx] : history[history.length - 1];

  return (
    <div className="glass-panel p-5 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-300">Live Loss Trajectory</span>
          <span className="text-[11px] font-mono text-neutral-400">
            (BCE Loss over Steps)
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full" />
            <span className="text-neutral-400">Train:</span>
            <span className="text-white font-semibold">{activePoint.loss.toFixed(4)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-purple-400 rounded-full border-dashed" />
            <span className="text-neutral-400">Val:</span>
            <span className="text-purple-300 font-semibold">{activePoint.val_loss.toFixed(4)}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Background Grid Lines */}
          {[0.25, 0.5, 0.75, 1.0].map((frac) => {
            const val = minLoss + frac * (maxLoss - minLoss);
            const y = getY(val);
            return (
              <g key={frac}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[9px] fill-neutral-500 font-mono"
                >
                  {val.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* X Axis Step Labels */}
          {[0, Math.floor(maxStep / 2), maxStep].map((s) => {
            const x = getX(s);
            return (
              <text
                key={s}
                x={x}
                y={height - 8}
                textAnchor="middle"
                className="text-[9px] fill-neutral-500 font-mono"
              >
                Step {s}
              </text>
            );
          })}

          {/* Validation Loss Curve (Purple Dashed) */}
          <path
            d={valPath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="1.8"
            strokeDasharray="4 3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Training Loss Curve (Cyan Solid) */}
          <path
            d={trainPath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points and Hover Target Hitboxes */}
          {history.map((d, i) => {
            const cx = getX(d.step);
            const cy = getY(d.loss);
            const isHovered = hoveredIdx === i;
            const hasAnomaly = d.anomalies && d.anomalies.length > 0;
            const isCommitted = d.state === "COMMITTED";
            const isRolledBack = d.state === "ROLLED_BACK";

            return (
              <g key={d.step} onMouseEnter={() => setHoveredIdx(i)}>
                {/* Event Marker Bar */}
                {hasAnomaly && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={height - padding.bottom}
                    stroke="rgba(244, 63, 94, 0.3)"
                    strokeDasharray="2 2"
                  />
                )}
                {isCommitted && (
                  <line
                    x1={cx}
                    y1={padding.top}
                    x2={cx}
                    y2={height - padding.bottom}
                    stroke="rgba(16, 185, 129, 0.4)"
                    strokeWidth="1.5"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : isCommitted ? 4.0 : 2.0}
                  fill={isCommitted ? "#10b981" : isRolledBack ? "#f43f5e" : "#06b6d4"}
                  className="transition-all duration-150"
                />

                {/* Invisible hit box for seamless hover */}
                <rect
                  x={cx - 10}
                  y={0}
                  width={20}
                  height={height}
                  fill="transparent"
                  className="cursor-crosshair"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
