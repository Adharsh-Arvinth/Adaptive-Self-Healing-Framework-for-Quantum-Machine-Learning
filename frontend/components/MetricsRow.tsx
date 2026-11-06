"use client";

import React from "react";
import {
  TrendingDown,
  Target,
  Gauge,
  Activity,
  Zap,
  Layers,
  Atom,
  TrendingUp,
} from "lucide-react";

interface MetricsRowProps {
  loss: number;
  valLoss: number;
  accuracy: number;
  valAccuracy: number;
  gradientNorm: number;
  gradientVariance: number;
  parameterVelocity: number;
  learningRate: number;
  circuitDepth: number;
  purity?: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  loss,
  valLoss,
  accuracy,
  valAccuracy,
  gradientNorm,
  parameterVelocity,
  learningRate,
  circuitDepth,
  purity = 0.985,
}) => {
  const isStarted = loss > 0 || accuracy > 0;

  // Primary High-Level KPIs
  const primaryMetrics = [
    {
      id: "train-loss",
      label: "Training Loss",
      spec: "Binary Cross-Entropy",
      value: isStarted ? loss.toFixed(4) : "0.6931",
      status: isStarted ? (loss < 0.35 ? "Optimal" : loss < 0.65 ? "Converging" : "Elevated") : "Baseline",
      icon: TrendingDown,
      color: "text-[var(--accent)]",
    },
    {
      id: "val-acc",
      label: "Validation Accuracy",
      spec: `Holdout Generalization`,
      value: isStarted ? `${(valAccuracy * 100).toFixed(1)}%` : "50.0%",
      status: isStarted ? (valAccuracy > 0.80 ? "High" : valAccuracy > 0.60 ? "Moderate" : "Sub-optimal") : "Random Guess",
      icon: Target,
      color: "text-[var(--status-success)]",
    },
    {
      id: "val-loss",
      label: "Validation Loss",
      spec: isStarted ? `Δ Gap: ${Math.abs(valLoss - loss).toFixed(3)}` : "Generalization Delta",
      value: isStarted ? valLoss.toFixed(4) : "0.6931",
      status: isStarted ? (Math.abs(valLoss - loss) < 0.15 ? "Generalizing" : "Variance Gap") : "Baseline",
      icon: TrendingUp,
      color: "text-[var(--status-warning)]",
    },
  ];

  // Secondary Auxiliary Quantum Telemetry
  const telemetryStrip = [
    {
      label: "Gradient Norm ||g||",
      value: isStarted ? gradientNorm.toFixed(4) : "—",
      sub: "Parameter-Shift",
      icon: Gauge,
    },
    {
      label: "Param Velocity",
      value: isStarted ? parameterVelocity.toFixed(4) : "—",
      sub: "||θ_t - θ_{t-1}||",
      icon: Activity,
    },
    {
      label: "Learning Rate η",
      value: learningRate.toFixed(4),
      sub: "Adaptive Step",
      icon: Zap,
    },
    {
      label: "Ansatz Layers",
      value: `L = ${circuitDepth}`,
      sub: "Hardware Depth",
      icon: Layers,
    },
    {
      label: "Bloch Purity γ",
      value: isStarted ? purity.toFixed(3) : "1.000",
      sub: "Tr(ρ²)",
      icon: Atom,
    },
  ];

  return (
    <div className="space-y-3 font-sans">
      {/* Tier 1: Primary Metrics with Distinct Visual Weight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {primaryMetrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.id}
              className="interactive-card group p-4 sm:p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between text-xs text-[var(--content-secondary)]">
                <span className="font-medium">{m.label}</span>
                <span className="text-[11px] font-mono text-[var(--content-tertiary)]">{m.spec}</span>
              </div>
              <div className="flex items-baseline justify-between mt-2">
                <div className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--content-primary)] font-sans">
                  {m.value}
                </div>
                <div className="text-xs font-medium text-[var(--content-secondary)] flex items-center gap-1.5">
                  <Icon className={`w-3.5 h-3.5 ${m.color}`} />
                  <span>{m.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tier 2: Compact Scannable Auxiliary Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {telemetryStrip.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="interactive-card group p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between"
            >
              <div>
                <div className="text-[11px] text-[var(--content-secondary)] font-medium truncate">
                  {item.label}
                </div>
                <div className="text-sm font-semibold text-[var(--content-primary)] mt-0.5 font-mono">
                  {item.value}
                </div>
              </div>
              <div className="text-[10px] text-[var(--content-tertiary)] text-right font-mono hidden sm:block">
                {item.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
