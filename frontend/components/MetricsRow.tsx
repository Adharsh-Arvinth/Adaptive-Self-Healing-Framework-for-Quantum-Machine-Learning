"use client";

import React, { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

/* --------------------------------------------------------------------------
   Timing-board telemetry. Big condensed numerals that roll to each new value
   (a short ease-out tween written straight to the DOM, so React does not
   re-render per frame), with a status word and a hairline grid.
   -------------------------------------------------------------------------- */

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

type Fmt = (v: number) => string;

const Rolling: React.FC<{ value: number; format: Fmt; className?: string }> = ({ value, format, className }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const from = prev.current;
    prev.current = value;
    if (reduce || !Number.isFinite(from) || !Number.isFinite(value) || from === value) {
      el.textContent = format(value);
      return;
    }
    const c = animate(from, value, { duration: 0.6, ease: [0.23, 1, 0.32, 1], onUpdate: (v) => (el.textContent = format(v)) });
    return () => c.stop();
  }, [value, format, reduce]);
  return (
    <span ref={ref} className={className}>
      {format(value)}
    </span>
  );
};

const f4: Fmt = (v) => (Number.isFinite(v) ? v.toFixed(4) : "—");
const pct: Fmt = (v) => (Number.isFinite(v) ? `${(v * 100).toFixed(1)}%` : "—");
const sci: Fmt = (v) => (!Number.isFinite(v) ? "—" : v === 0 ? "0" : Math.abs(v) < 1e-3 ? v.toExponential(1) : v.toFixed(4));
const int: Fmt = (v) => (Number.isFinite(v) ? String(Math.round(v)) : "—");
const f3: Fmt = (v) => (Number.isFinite(v) ? v.toFixed(3) : "—");

type Tone = "ok" | "warn" | "bad" | "muted";
const toneCls: Record<Tone, string> = {
  ok: "text-[var(--status-success)]",
  warn: "text-[var(--status-warning)]",
  bad: "text-[var(--status-danger)]",
  muted: "text-[var(--content-tertiary)]",
};

export const MetricsRow: React.FC<MetricsRowProps> = ({
  loss,
  valLoss,
  accuracy,
  valAccuracy,
  gradientNorm,
  parameterVelocity,
  learningRate,
  circuitDepth,
  purity = 1,
}) => {
  const started = loss > 0 || accuracy > 0;

  const hero: { label: string; note: string; value: number; fmt: Fmt; status: string; tone: Tone }[] = [
    {
      label: "Training loss",
      note: "binary cross-entropy",
      value: started ? loss : 0.6931,
      fmt: f4,
      status: !started ? "Baseline" : loss < 0.35 ? "Low" : loss < 0.65 ? "Falling" : "High",
      tone: !started ? "muted" : loss < 0.35 ? "ok" : loss < 0.65 ? "warn" : "bad",
    },
    {
      label: "Validation accuracy",
      note: "held-out samples",
      value: started ? valAccuracy : 0.5,
      fmt: pct,
      status: !started ? "Chance" : valAccuracy > 0.8 ? "Strong" : valAccuracy > 0.6 ? "Learning" : "Weak",
      tone: !started ? "muted" : valAccuracy > 0.8 ? "ok" : valAccuracy > 0.6 ? "warn" : "bad",
    },
    {
      label: "Validation loss",
      note: `gap ${started ? (valLoss - loss).toFixed(3) : "0.000"}`,
      value: started ? valLoss : 0.6931,
      fmt: f4,
      status: !started ? "Baseline" : valLoss - loss > 0.08 ? "Overfitting?" : "Tracking",
      tone: !started ? "muted" : valLoss - loss > 0.08 ? "warn" : "ok",
    },
  ];

  const instruments: { label: string; value: number; fmt: Fmt; hint: string }[] = [
    { label: "Gradient norm", value: gradientNorm, fmt: sci, hint: "‖∇L‖ · watched for plateaus" },
    { label: "Param velocity", value: parameterVelocity, fmt: sci, hint: "‖θₜ − θₜ₋₁‖ · step size" },
    { label: "Learning rate", value: learningRate, fmt: sci, hint: "η · live optimiser value" },
    { label: "Circuit depth", value: circuitDepth, fmt: int, hint: "variational layers L" },
    { label: "Bloch purity", value: purity, fmt: f3, hint: "Tr(ρ²) of qubit 0" },
    { label: "Train accuracy", value: started ? accuracy : 0.5, fmt: pct, hint: "on the training batch" },
  ];

  return (
    <div className="space-y-px rounded-[1.75rem] overflow-hidden border border-[var(--border-subtle)] bg-[var(--border-subtle)]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-px">
        {hero.map((m) => (
          <div key={m.label} className="bg-[var(--bg-surface)] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <span className="type-label text-[var(--content-secondary)]">{m.label}</span>
              <span className={`type-label ${toneCls[m.tone]}`}>{m.status}</span>
            </div>
            <Rolling value={m.value} format={m.fmt} className="block type-condensed text-[clamp(3.25rem,6vw,5.5rem)] mt-2 text-[var(--content-primary)]" />
            <div className="text-xs text-[var(--content-tertiary)] mt-1">{m.note}</div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-px">
        {instruments.map((m) => (
          <div key={m.label} className="bg-[var(--bg-surface)] px-5 py-4" title={m.hint}>
            <div className="type-label text-[var(--content-tertiary)]">{m.label}</div>
            <Rolling value={m.value} format={m.fmt} className="block type-condensed text-[2rem] mt-1 text-[var(--content-primary)]" />
            <div className="text-[0.7rem] text-[var(--content-tertiary)] truncate">{m.hint}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MetricsRow;
