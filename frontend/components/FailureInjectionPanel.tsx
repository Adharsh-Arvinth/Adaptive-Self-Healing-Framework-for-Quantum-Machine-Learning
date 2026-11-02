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
    color: "text-amber-400 hover:border-amber-500/40",
  },
  {
    type: "barren_plateau",
    label: "Barren Plateau",
    desc: "Exponential gradient attenuation surrogate (< 1e-6)",
    icon: Compass,
    color: "text-purple-400 hover:border-purple-500/40",
  },
  {
    type: "optimizer_instability",
    label: "Optimizer Instability",
    desc: "Inverts and corrupts classical momentum buffers",
    icon: Sliders,
    color: "text-blue-400 hover:border-blue-500/40",
  },
  {
    type: "training_divergence",
    label: "Training Divergence",
    desc: "Injects non-finite parameter tensor triggering divergence",
    icon: Flame,
    color: "text-rose-400 hover:border-rose-500/40",
  },
  {
    type: "persistent_plateau",
    label: "Persistent Plateau",
    desc: "Pins parameter trajectory to zero-curvature saddle",
    icon: ShieldX,
    color: "text-indigo-400 hover:border-indigo-500/40",
  },
  {
    type: "noise_degradation",
    label: "Noise Degradation",
    desc: "Radial contraction decoherence & readout noise channel",
    icon: Radio,
    color: "text-cyan-400 hover:border-cyan-500/40",
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
    <div className="glass-panel p-5 flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Controlled Synthetic Failure Injection Testing
            </h2>
            {isRunning && (
              <span
                className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1"
                title="Model actively training"
              />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[var(--content-secondary)] text-[11px]">Severity:</span>
            {[1.0, 2.0, 3.0].map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono transition-colors ${
                  severity === s
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-semibold"
                    : "glass-panel-subtle text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                }`}
              >
                {s.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>

        {/* Failure Buttons Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {FAILURE_OPTIONS.map((f) => {
            const Icon = f.icon;
            const isTarget = injectingType === f.type;
            return (
              <button
                key={f.type}
                onClick={() => handleInject(f.type)}
                className={`apple-btn p-3 rounded-xl border text-left flex flex-col justify-between transition-all bg-[var(--bg-surface)] border-[var(--border-subtle)] ${f.color} ${
                  isTarget ? "ring-2 ring-rose-500 scale-[0.98]" : ""
                }`}
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-semibold text-[var(--content-primary)] leading-tight">
                      {f.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--content-secondary)] leading-tight line-clamp-2">
                    {f.desc}
                  </p>
                </div>
                <div className="mt-2.5 text-[9px] font-mono font-medium text-[var(--content-secondary)] flex items-center justify-between">
                  <span>{isTarget ? "Injected!" : "Inject"}</span>
                  {isTarget && <Check className="w-2.5 h-2.5 text-rose-400" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
