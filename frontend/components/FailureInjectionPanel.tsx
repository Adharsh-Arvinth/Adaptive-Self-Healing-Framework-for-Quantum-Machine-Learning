"use client";

import React, { useState } from "react";
import { AlertCircle, Flame, Zap, Sliders, ShieldX, Compass, Radio } from "lucide-react";

interface FailureInjectionPanelProps {
  onInject: (failureType: string, severity: number) => void;
  isRunning: boolean;
}

const FAILURE_OPTIONS = [
  {
    type: "lr_misconfiguration",
    label: "LR Misconfig (50x)",
    desc: "Explodes learning rate causing oscillatory divergence",
    icon: Zap,
    color: "text-amber-400 hover:bg-amber-500/10 border-amber-500/20",
  },
  {
    type: "barren_plateau",
    label: "Barren Plateau",
    desc: "Exponential gradient attenuation surrogate (< 1e-6)",
    icon: Compass,
    color: "text-purple-400 hover:bg-purple-500/10 border-purple-500/20",
  },
  {
    type: "optimizer_instability",
    label: "Optimizer Instability",
    desc: "Inverts and corrupts classical momentum buffers",
    icon: Sliders,
    color: "text-blue-400 hover:bg-blue-500/10 border-blue-500/20",
  },
  {
    type: "training_divergence",
    label: "Training Divergence",
    desc: "Injects NaN parameter tensor triggering divergence",
    icon: Flame,
    color: "text-rose-400 hover:bg-rose-500/10 border-rose-500/20",
  },
  {
    type: "persistent_plateau",
    label: "Persistent Plateau",
    desc: "Pins parameter trajectory to zero-curvature saddle",
    icon: ShieldX,
    color: "text-indigo-400 hover:bg-indigo-500/10 border-indigo-500/20",
  },
  {
    type: "noise_degradation",
    label: "Noise Degradation",
    desc: "Depolarizing contraction and readout noise channel",
    icon: Radio,
    color: "text-cyan-400 hover:bg-cyan-500/10 border-cyan-500/20",
  },
];

export const FailureInjectionPanel: React.FC<FailureInjectionPanelProps> = ({ onInject, isRunning }) => {
  const [severity, setSeverity] = useState(1.0);
  const [injectedMsg, setInjectedMsg] = useState<string | null>(null);

  const handleInject = (type: string) => {
    onInject(type, severity);
    setInjectedMsg(`Injected ${type}`);
    setTimeout(() => setInjectedMsg(null), 2500);
  };

  return (
    <div className="glass-panel p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <h2 className="text-xs font-semibold text-neutral-200">
            Controlled Synthetic Failure Injection Testing
          </h2>
          {isRunning && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" title="Model actively training" />
          )}
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          {injectedMsg && (
            <span className="text-rose-400 font-semibold animate-pulse">
              ● {injectedMsg}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 text-[11px]">Severity:</span>
            {[1.0, 2.0, 3.0].map((s) => (
              <button
                key={s}
                onClick={() => setSeverity(s)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                  severity === s
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                    : "bg-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                {s.toFixed(1)}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Failure Buttons Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {FAILURE_OPTIONS.map((f) => {
          const Icon = f.icon;
          return (
            <button
              key={f.type}
              onClick={() => handleInject(f.type)}
              className={`btn-press p-3 rounded-xl border text-left flex flex-col justify-between transition-all bg-white/[0.02] ${f.color}`}
            >
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="text-xs font-medium text-white">{f.label}</span>
                </div>
                <p className="text-[10px] text-neutral-400 leading-tight">
                  {f.desc}
                </p>
              </div>
              <div className="mt-2 text-[9px] font-mono text-neutral-400 uppercase tracking-wider">
                Inject Fault
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
