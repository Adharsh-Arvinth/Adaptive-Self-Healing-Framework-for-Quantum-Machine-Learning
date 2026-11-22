"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { FlaskConical } from "lucide-react";
import { DigitalTwinPrediction, EvaluationRecord } from "@/types";
import { Badge, Btn, Empty, Panel, Stat, SubHead, fmt } from "./ui/kit";

interface DigitalTwinPanelProps {
  prediction: DigitalTwinPrediction | null;
  evaluation: EvaluationRecord | null;
  onSimulateTwin?: (arm: string) => Promise<DigitalTwinPrediction | null>;
  selectedArm?: string | null;
}

const ARMS: { id: string; label: string }[] = [
  { id: "adjust_learning_rate", label: "Re-anchor LR" },
  { id: "change_optimizer", label: "Change optimizer" },
  { id: "perform_warm_restart", label: "Warm restart" },
  { id: "apply_noise_mitigation", label: "Noise mitigation" },
  { id: "reduce_circuit_depth", label: "Reduce depth" },
  { id: "modify_feature_map", label: "Swap feature map" },
];

const Trajectory: React.FC<{ values: (number | null | undefined)[]; viable: boolean }> = ({ values, viable }) => {
  const reduce = useReducedMotion();
  const pts = values.map((v, i) => ({ i, v: typeof v === "number" && Number.isFinite(v) ? v : null }));
  const finite = pts.filter((p) => p.v !== null) as { i: number; v: number }[];
  if (finite.length < 2) return <Empty title="No trajectory">The rehearsal produced non-finite losses.</Empty>;
  const min = Math.min(...finite.map((p) => p.v));
  const max = Math.max(...finite.map((p) => p.v));
  const W = 320, H = 120, pad = 14;
  const x = (i: number) => pad + (i / Math.max(1, values.length - 1)) * (W - 2 * pad);
  const y = (v: number) => (max === min ? H / 2 : pad + (1 - (v - min) / (max - min)) * (H - 2 * pad));
  const d = finite.map((p, k) => `${k ? "L" : "M"} ${x(p.i).toFixed(1)} ${y(p.v).toFixed(1)}`).join(" ");
  const color = viable ? "var(--status-success)" : "var(--status-danger)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-36" role="img" aria-label="Rehearsed loss over the three twin steps">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={W - pad} y1={pad + f * (H - 2 * pad)} y2={pad + f * (H - 2 * pad)} stroke="var(--border-subtle)" strokeDasharray="2 5" />
      ))}
      <motion.path key={d} d={d} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduce ? 0 : 0.8, ease: [0.23, 1, 0.32, 1] }} />
      {finite.map((p) => (
        <g key={p.i}>
          <circle cx={x(p.i)} cy={y(p.v)} r="4" fill="var(--bg-surface)" stroke={color} strokeWidth="2" />
          <text x={x(p.i)} y={H - 1} textAnchor="middle" fontSize="9" fill="var(--content-tertiary)" fontFamily="var(--font-mono)">h={p.i}</text>
        </g>
      ))}
    </svg>
  );
};

export const DigitalTwinPanel: React.FC<DigitalTwinPanelProps> = ({ prediction, evaluation, onSimulateTwin, selectedArm }) => {
  const [arm, setArm] = useState<string>(selectedArm || "adjust_learning_rate");
  const [running, setRunning] = useState(false);
  const [custom, setCustom] = useState<DigitalTwinPrediction | null>(null);

  const pred = custom || prediction;
  const viable = pred ? pred.is_viable !== false : true;

  const run = async () => {
    if (!onSimulateTwin) return;
    setRunning(true);
    try {
      const res = await onSimulateTwin(arm);
      if (res) setCustom(res);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Panel
      eyebrow="Digital twin"
      title="Rehearse a repair first"
      description="The twin copies the live model and runs the repair for three steps on held-out data. The real model is never touched; repairs that make things worse are vetoed."
      actions={pred ? <Badge tone={viable ? "ok" : "bad"}>{viable ? "Viable" : "Vetoed"}</Badge> : undefined}
    >
      <SubHead>Choose a repair to rehearse</SubHead>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Repair to rehearse">
        {ARMS.map((a) => (
          <button
            key={a.id}
            role="radio"
            aria-checked={arm === a.id}
            onClick={() => setArm(a.id)}
            className={`relative h-10 px-4 rounded-full text-sm font-medium border transition-colors duration-200 ${
              arm === a.id ? "text-[var(--bg-primary)] border-transparent" : "border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            {arm === a.id && <motion.span layoutId="twin-arm" className="absolute inset-0 rounded-full bg-[var(--content-primary)]" transition={{ type: "spring", bounce: 0, duration: 0.4 }} />}
            <span className="relative">{a.label}</span>
          </button>
        ))}
        <Btn variant="primary" onClick={run} disabled={running || !onSimulateTwin} icon={<FlaskConical className="w-4 h-4" />} className="ml-auto">
          {running ? "Rehearsing…" : "Run rehearsal"}
        </Btn>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 mt-8">
        <div className="lg:col-span-3">
          <SubHead right={pred?.arm ? <span className="type-label text-[var(--content-tertiary)]">{fmt.human(pred.arm)}</span> : undefined}>
            Rehearsed loss · 3 steps
          </SubHead>
          {pred ? (
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
              <Trajectory values={pred.proxy_loss_trajectory ?? []} viable={viable} />
              {!viable && pred.rejection_reason && <p className="text-sm text-[var(--status-danger)] mt-2 leading-relaxed">{pred.rejection_reason}</p>}
            </div>
          ) : (
            <Empty title="No rehearsal yet">Pick a repair and run it, or wait for the pipeline to rehearse one after a fault.</Empty>
          )}
        </div>
        <div className="lg:col-span-2 space-y-6">
          <div>
            <SubHead>Prediction</SubHead>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Loss change" value={pred ? `${(pred.predicted_loss_delta ?? 0) >= 0 ? "−" : "+"}${fmt.n(Math.abs(pred.predicted_loss_delta ?? 0))}` : "—"} tone={pred ? ((pred.predicted_loss_delta ?? 0) >= 0 ? "ok" : "bad") : "neutral"} hint="positive = improves" />
              <Stat label="Stability" value={pred ? fmt.pct(pred.proxy_stability, 0) : "—"} />
              <Stat label="Grad variance" value={pred ? fmt.n(pred.proxy_grad_variance, 4) : "—"} />
              <Stat label="Circuit evals" value={pred?.circuit_evaluations ?? "—"} />
            </div>
          </div>
          <div>
            <SubHead>Prediction vs reality</SubHead>
            {evaluation ? (
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Predicted" value={fmt.n(evaluation.predicted_reward, 3)} />
                <Stat label="Actual" value={fmt.n(evaluation.actual_reward, 3)} tone={(evaluation.actual_reward ?? 0) >= 0 ? "ok" : "bad"} />
                <Stat label="Error" value={fmt.n(evaluation.prediction_error, 3)} />
              </div>
            ) : (
              <p className="text-sm text-[var(--content-secondary)]">Appears after a repair finishes probation.</p>
            )}
          </div>
        </div>
      </div>
    </Panel>
  );
};

export default DigitalTwinPanel;
