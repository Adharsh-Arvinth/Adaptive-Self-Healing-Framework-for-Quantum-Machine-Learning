"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Compass, Flame, Radio, ShieldX, Sliders, Zap } from "lucide-react";
import { Badge, Panel } from "./ui/kit";

interface FailureInjectionPanelProps {
  onInject: (failureType: string, severity: number) => Promise<void> | void;
  isRunning: boolean;
}

/* Each fault: what it does, and the telemetry signature to watch for afterwards. */
const FAULTS = [
  { type: "lr_misconfiguration", label: "LR too large", what: "Learning rate ×50: the loss starts to bounce.", watch: "Oscillating loss, opposing gradients", icon: Zap, recommended: true },
  { type: "barren_plateau", label: "Barren plateau", what: "Gradient signal sinks below shot noise.", watch: "Decorrelated gradients, flat loss", icon: Compass },
  { type: "optimizer_instability", label: "Optimizer corrupted", what: "Momentum buffers inverted and amplified.", watch: "Loss drifts upward smoothly", icon: Sliders },
  { type: "training_divergence", label: "Numerical divergence", what: "Parameters become NaN.", watch: "Non-finite loss in one step", icon: Flame },
  { type: "persistent_plateau", label: "Step-size collapse", what: "Learning rate ÷1000: live gradients, no motion.", watch: "Healthy gradient, zero velocity", icon: ShieldX },
  { type: "noise_degradation", label: "Device noise", what: "Depolarizing contraction plus shot noise.", watch: "Output margin shrinks", icon: Radio },
];

const SEVERITIES = [1, 2, 3];

export const FailureInjectionPanel: React.FC<FailureInjectionPanelProps> = ({ onInject, isRunning }) => {
  const [severity, setSeverity] = useState(1.0);
  const [injected, setInjected] = useState<string | null>(null);

  const handleInject = async (type: string) => {
    setInjected(type);
    try {
      await onInject(type, severity);
    } finally {
      window.setTimeout(() => setInjected(null), 1600);
    }
  };

  return (
    <Panel
      eyebrow="Break it on purpose"
      title="Inject a fault"
      description="Pick a severity, then a fault. Keep training running and watch the Dashboard and Diagnosis respond within a few steps."
      actions={
        <>
          <Badge tone={isRunning ? "ok" : "neutral"} pulse={isRunning}>
            {isRunning ? "Training live" : "Training paused"}
          </Badge>
          <div className="relative grid grid-cols-3 p-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" role="radiogroup" aria-label="Severity">
            {SEVERITIES.map((s) => (
              <button
                key={s}
                role="radio"
                aria-checked={severity === s}
                onClick={() => setSeverity(s)}
                className={`relative h-9 px-4 rounded-full type-label transition-colors duration-200 ${severity === s ? "text-white" : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"}`}
              >
                {severity === s && (
                  <motion.span layoutId="severity-pill" className="absolute inset-0 rounded-full bg-[var(--accent)]" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />
                )}
                <span className="relative">{s.toFixed(1)}×</span>
              </button>
            ))}
          </div>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {FAULTS.map((f) => {
          const Icon = f.icon;
          const done = injected === f.type;
          return (
            <button
              key={f.type}
              onClick={() => handleInject(f.type)}
              className={`interactive-card group relative text-left rounded-[1.4rem] border p-5 flex flex-col justify-between min-h-[12.5rem] bg-[var(--bg-primary)] ${
                done ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--border-subtle)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="card-icon w-11 h-11 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-secondary)]">
                  <Icon className="w-5 h-5" />
                </span>
                {f.recommended && <span className="type-label text-[var(--accent)]">Start here</span>}
              </div>
              <div className="mt-6">
                <div className="font-display font-bold text-[1.15rem] tracking-[-0.02em] text-[var(--content-primary)]">{f.label}</div>
                <p className="text-sm text-[var(--content-secondary)] mt-1 leading-relaxed">{f.what}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
                <span className="text-xs text-[var(--content-tertiary)] truncate">Watch: {f.watch}</span>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={done ? "done" : "idle"}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className={`shrink-0 inline-flex items-center gap-1.5 type-label ${done ? "text-[var(--accent)]" : "text-[var(--content-primary)] group-hover:text-[var(--accent)]"}`}
                  >
                    {done ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Injected
                      </>
                    ) : (
                      "Inject →"
                    )}
                  </motion.span>
                </AnimatePresence>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
};

export default FailureInjectionPanel;
