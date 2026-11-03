"use client";

import React, { useState } from "react";
import { AlertCircle, Flame, Zap, Sliders, ShieldX, Compass, Radio, Check } from "lucide-react";

interface FailureInjectionPanelProps {
  onInject: (failureType: string, severity: number) => Promise<void> | void;
  isRunning: boolean;
}

const FAILURE_OPTIONS = [
  {
    type: "lr_misconfiguration",
    label: "LR Misconfig (50x)",
    desc: "Explodes learning rate causing oscillatory divergence",
    icon: Zap,
    color: "text-[var(--status-warning)] hover:border-[var(--status-warning)]/40",
  },
  {
    type: "barren_plateau",
    label: "Barren Plateau",
    desc: "Exponential gradient attenuation surrogate (< 1e-6)",
    icon: Compass,
    color: "text-[var(--status-ansatz)] hover:border-[var(--status-ansatz)]/40",
  },
  {
    type: "optimizer_instability",
    label: "Optimizer Instability",
    desc: "Inverts and corrupts classical momentum buffers",
    icon: Sliders,
    color: "text-[var(--status-info)] hover:border-[var(--status-info)]/40",
  },
  {
    type: "training_divergence",
    label: "Training Divergence",
    desc: "Injects non-finite parameter tensor triggering divergence",
    icon: Flame,
    color: "text-[var(--status-danger)] hover:border-[var(--status-danger)]/40",
  },
  {
    type: "persistent_plateau",
    label: "Persistent Plateau",
    desc: "Pins parameter trajectory to zero-curvature saddle",
    icon: ShieldX,
    color: "text-[var(--accent)] hover:border-[var(--accent)]/40",
  },
  {
    type: "noise_degradation",
    label: "Noise Degradation",
    desc: "Radial contraction decoherence & readout noise channel",
    icon: Radio,
    color: "text-[var(--status-purity)] hover:border-[var(--status-purity)]/40",
  },
];

export const FailureInjectionPanel: React.FC<FailureInjectionPanelProps> = ({
  onInject,
  isRunning,
}) => {
  const [severity, setSeverity] = useState(1.0);
  const [injectingType, setInjectingType] = useState<string | null>(null);

  const handleInject = async (type: string) => {
    setInjectingType(type);
    try {
      await onInject(type, severity);
    } finally {
      setTimeout(() => setInjectingType(null), 1200);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col justify-between">
      {/* Symmetrical Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--status-danger-subtle)] flex items-center justify-center text-[var(--status-danger)] shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
                  Controlled Synthetic Failure Injection Testing
                </h2>
                {isRunning && (
                  <span
                    className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"
                    title="Model actively training"
                  />
                )}
              </div>
              <p className="text-[11px] text-[var(--content-tertiary)]">
                Empirical fault verification across 6 non-overlapping quantum failure modes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono self-start sm:self-auto">
            <span className="text-[var(--content-secondary)] text-[11px]">Severity:</span>
            {[1.0, 2.0, 3.0].map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition-all ${
                  severity === s
                    ? "bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border border-[var(--status-danger)]/40 shadow-sm"
                    : "glass-panel-subtle text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                }`}
              >
                {s.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>

        {/* Symmetrical 6-Column Failure Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {FAILURE_OPTIONS.map((f) => {
            const Icon = f.icon;
            const isTarget = injectingType === f.type;
            return (
              <button
                key={f.type}
                onClick={() => handleInject(f.type)}
                className={`apple-btn p-3.5 rounded-xl border text-left flex flex-col justify-between h-[115px] transition-all duration-150 glass-panel-subtle hover:border-[var(--border-highlight)] ${
                  isTarget ? "ring-2 ring-[var(--status-danger)] scale-[0.98] border-[var(--status-danger)]" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3.5 h-3.5 text-[var(--status-danger)] shrink-0" />
                    <span className="text-xs font-semibold text-[var(--content-primary)] leading-tight truncate">
                      {f.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--content-secondary)] leading-snug line-clamp-2">
                    {f.desc}
                  </p>
                </div>
                <div className="pt-2 border-t border-[var(--border-subtle)] text-[10px] font-mono font-medium text-[var(--content-secondary)] flex items-center justify-between">
                  <span className={isTarget ? "text-[var(--status-danger)] font-semibold" : ""}>
                    {isTarget ? "Injected!" : "Inject"}
                  </span>
                  {isTarget && <Check className="w-3 h-3 text-[var(--status-danger)]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
