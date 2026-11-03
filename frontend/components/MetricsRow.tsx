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
  const cards = [
    {
      label: "Training Loss",
      sublabel: "BCE on mini-batch",
      value: loss.toFixed(4),
      icon: TrendingDown,
      color: "text-[var(--accent)]",
      badge: loss < 0.60 ? "Converging" : "Active",
      badgeColor:
        loss < 0.60
          ? "bg-[var(--status-success-subtle)] text-[var(--status-success)]"
          : "bg-[var(--accent-subtle)] text-[var(--accent)]",
    },
    {
      label: "Validation Accuracy",
      sublabel: `Train: ${(accuracy * 100).toFixed(0)}% • Holdout`,
      value: `${(valAccuracy * 100).toFixed(1)}%`,
      icon: Target,
      color: "text-[var(--status-success)]",
      badge: valAccuracy >= 0.70 ? "High" : valAccuracy >= 0.55 ? "Moderate" : "Low",
      badgeColor:
        valAccuracy >= 0.70
          ? "bg-[var(--status-success-subtle)] text-[var(--status-success)]"
          : "bg-[var(--status-warning-subtle)] text-[var(--status-warning)]",
    },
    {
      label: "Validation Loss",
      sublabel: "Generalization",
      value: valLoss.toFixed(4),
      icon: TrendingUp,
      color: "text-[var(--status-warning)]",
      badge: Math.abs(valLoss - loss) < 0.15 ? "Generalizing" : "Gap Observed",
      badgeColor:
        Math.abs(valLoss - loss) < 0.15
          ? "bg-[var(--status-success-subtle)] text-[var(--status-success)]"
          : "bg-[var(--status-warning-subtle)] text-[var(--status-warning)]",
    },
    {
      label: "Gradient Norm",
      sublabel: "Parameter-shift ||g||",
      value: gradientNorm.toFixed(4),
      icon: Gauge,
      color: "text-[var(--status-info)]",
      badge: gradientNorm > 1e-4 ? "Active" : "Vanishing",
      badgeColor:
        gradientNorm > 1e-4
          ? "bg-[var(--status-info-subtle)] text-[var(--status-info)]"
          : "bg-[var(--status-danger-subtle)] text-[var(--status-danger)]",
    },
    {
      label: "Parameter Velocity",
      sublabel: "||θ_t - θ_{t-1}||",
      value: parameterVelocity.toFixed(4),
      icon: Activity,
      color: "text-[var(--status-purity)]",
      badge: parameterVelocity < 1e-4 ? "Saddle Trap" : "Dynamic",
      badgeColor:
        parameterVelocity >= 1e-4
          ? "bg-[var(--status-purity-subtle)] text-[var(--status-purity)]"
          : "bg-[var(--status-warning-subtle)] text-[var(--status-warning)]",
    },
    {
      label: "Learning Rate",
      sublabel: "Step size η",
      value: learningRate.toFixed(4),
      icon: Zap,
      color: "text-[var(--status-warning)]",
      badge: `${learningRate.toFixed(3)}`,
      badgeColor: "bg-[var(--status-warning-subtle)] text-[var(--status-warning)]",
    },
    {
      label: "Circuit Depth",
      sublabel: "Ansatz layers (L)",
      value: `${circuitDepth} Layers`,
      icon: Layers,
      color: "text-[var(--content-secondary)]",
      badge: `D = ${circuitDepth}`,
      badgeColor: "glass-panel-subtle text-[var(--content-secondary)]",
    },
    {
      label: "State Purity",
      sublabel: "γ = (1 + ||r||²)/2",
      value: purity.toFixed(4),
      icon: Atom,
      color: "text-[var(--status-ansatz)]",
      badge: purity >= 0.90 ? "Pure State" : "Mixed State",
      badgeColor:
        purity >= 0.90
          ? "bg-[var(--status-success-subtle)] text-[var(--status-success)]"
          : "bg-[var(--status-danger-subtle)] text-[var(--status-danger)]",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="apple-card p-3.5 flex flex-col justify-between hover:shadow-apple-md transition-all"
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] font-medium text-content-secondary truncate">
                {card.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${card.color} shrink-0`} />
            </div>

            <div className="my-1">
              <span className="text-lg font-semibold tracking-tight text-content-primary font-mono block">
                {card.value}
              </span>
            </div>

            <div className="flex items-center justify-between gap-1 mt-1 pt-1.5 border-t border-border-subtle">
              <span className="text-[10px] text-content-tertiary truncate">
                {card.sublabel}
              </span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono shrink-0 ${card.badgeColor}`}>
                {card.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
