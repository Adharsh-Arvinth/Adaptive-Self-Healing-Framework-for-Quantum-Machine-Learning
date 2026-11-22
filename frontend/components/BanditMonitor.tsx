"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { BanditDecisionData, PosteriorData, TelemetryPoint } from "@/types";
import { Badge, Empty, Meter, Panel, Stat, SubHead, fmt } from "./ui/kit";

interface BanditMonitorProps {
  decision: BanditDecisionData | null;
  posteriors: Record<string, PosteriorData> | null;
  currentTelemetry?: TelemetryPoint | null;
}

const ARM_LABEL: Record<string, string> = {
  change_optimizer: "Change optimizer",
  reduce_circuit_depth: "Reduce depth",
  modify_feature_map: "Swap feature map",
  adjust_learning_rate: "Re-anchor LR",
  apply_noise_mitigation: "Noise mitigation",
  perform_warm_restart: "Warm restart",
};

const clip = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const fin = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/* The 12-D context exactly as backend/bandit.py::build_context_vector computes it. */
const CONTEXT: { x: string; name: string; formula: string; live?: (t: TelemetryPoint | null) => string }[] = [
  { x: "x₁", name: "Bias", formula: "1", live: () => "1.000" },
  { x: "x₂", name: "Loss", formula: "tanh(L)", live: (t) => (fin(t?.loss) ? Math.tanh(t!.loss).toFixed(3) : "—") },
  { x: "x₃", name: "Gradient norm", formula: "clip((ln(‖g‖+1e-8)+8)/12, −1, 1)", live: (t) => (fin(t?.gradient_norm) ? clip((Math.log(Math.max(1e-12, t!.gradient_norm) + 1e-8) + 8) / 12, -1, 1).toFixed(3) : "—") },
  { x: "x₄", name: "Gradient variance", formula: "clip((ln(Var g+1e-10)+10)/14, −1, 1)", live: (t) => (fin(t?.gradient_variance) ? clip((Math.log(Math.max(1e-12, t!.gradient_variance) + 1e-10) + 10) / 14, -1, 1).toFixed(3) : "—") },
  { x: "x₅", name: "Parameter velocity", formula: "tanh(10·‖Δθ‖)", live: (t) => (fin(t?.parameter_velocity) ? Math.tanh(10 * t!.parameter_velocity).toFixed(3) : "—") },
  { x: "x₆", name: "Circuit depth", formula: "L / 8", live: (t) => (fin(t?.circuit_depth) ? clip(t!.circuit_depth / 8, 0, 1).toFixed(3) : "—") },
  { x: "x₇", name: "Diagnosis confidence", formula: "max P(fault)" },
  { x: "x₈", name: "Diagnosis entropy", formula: "H(P) / ln 6" },
  { x: "x₉", name: "Memory: past reward", formula: "reward of nearest past episode" },
  { x: "x₁₀", name: "Memory: similarity", formula: "cosine to nearest past episode" },
  { x: "x₁₁", name: "Twin: predicted gain", formula: "best viable twin Δloss (normalised)" },
  { x: "x₁₂", name: "Twin: stability", formula: "1 − CV of rehearsed loss" },
];

export const BanditMonitor: React.FC<BanditMonitorProps> = ({ decision, posteriors, currentTelemetry = null }) => {
  const [showCtx, setShowCtx] = useState(false);
  const arms = Object.keys(ARM_LABEL);
  const maxNorm = Math.max(1e-9, ...arms.map((a) => posteriors?.[a]?.mu_norm ?? 0));
  const totalUpdates = arms.reduce((s, a) => s + (posteriors?.[a]?.update_count ?? 0), 0);

  return (
    <Panel
      eyebrow="Repair selection"
      title="How the next repair is chosen"
      description="A contextual Thompson-sampling bandit keeps a Bayesian linear model per repair. It samples a plausible payoff for each from its beliefs and picks the best, so it keeps exploring while it is still uncertain."
      actions={<Badge tone={decision ? "accent" : "neutral"}>{decision ? fmt.human(decision.decision_mode).toLowerCase() : "no decision yet"}</Badge>}
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5">
            <div className="type-label text-[var(--content-tertiary)]">Latest choice</div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={decision?.selected_arm ?? "none"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="type-condensed text-[clamp(2.2rem,3.6vw,3.2rem)] leading-none mt-2"
              >
                {decision ? ARM_LABEL[decision.selected_arm] ?? fmt.human(decision.selected_arm) : "Waiting"}
              </motion.div>
            </AnimatePresence>
            <div className="grid grid-cols-2 gap-3 mt-5">
              <Stat label="Sampled payoff" value={decision ? fmt.n(decision.sampled_reward, 3) : "—"} />
              <Stat label="Expected payoff" value={decision ? fmt.n(decision.expected_reward, 3) : "—"} />
            </div>
          </div>
          <div>
            <SubHead>Eligible after safety checks</SubHead>
            {decision?.eligible_arms?.length ? (
              <div className="flex flex-wrap gap-2">
                {decision.eligible_arms.map((a) => (
                  <Badge key={a} tone={a === decision.selected_arm ? "accent" : "neutral"}>{ARM_LABEL[a] ?? fmt.human(a)}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--content-secondary)]">Shown after the first repair decision.</p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3">
          <SubHead right={<span className="type-label text-[var(--content-tertiary)] tabular">{totalUpdates} updates</span>}>
            What it has learned, per repair
          </SubHead>
          {posteriors ? (
            <ul className="space-y-3">
              {arms.map((a) => {
                const p = posteriors[a];
                const isSel = decision?.selected_arm === a;
                return (
                  <li key={a} className="grid grid-cols-[minmax(0,10rem)_1fr_4.5rem] items-center gap-3">
                    <span className={`text-sm truncate ${isSel ? "font-semibold text-[var(--content-primary)]" : "text-[var(--content-secondary)]"}`}>{ARM_LABEL[a]}</span>
                    <Meter value={(p?.mu_norm ?? 0) / maxNorm} tone={isSel ? "accent" : "neutral"} label={`${a} belief strength`} />
                    <span className="text-xs font-mono tabular text-right text-[var(--content-tertiary)]">{p?.update_count ?? 0} obs</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Empty title="No beliefs yet">Every repair starts from the same uninformative prior; this fills in as repairs are evaluated.</Empty>
          )}
          <p className="text-xs text-[var(--content-tertiary)] mt-3">Bar length: size of the learned weight vector ‖μ‖ relative to the largest; observations: completed repairs of that kind.</p>
        </div>
      </div>

      <div className="mt-8 border-t border-[var(--border-subtle)]">
        <button type="button" onClick={() => setShowCtx((v) => !v)} aria-expanded={showCtx} className="w-full flex items-center justify-between py-4 text-left">
          <span className="type-label text-[var(--content-secondary)]">The 12-dimensional context it sees</span>
          <motion.span animate={{ rotate: showCtx ? 180 : 0 }} transition={{ type: "spring", bounce: 0, duration: 0.35 }}>
            <ChevronDown className="w-4 h-4 text-[var(--content-secondary)]" />
          </motion.span>
        </button>
        <motion.div initial={false} animate={{ height: showCtx ? "auto" : 0, opacity: showCtx ? 1 : 0 }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} className="overflow-hidden">
          <div className="overflow-x-auto pb-2" data-lenis-prevent>
            <table className="w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="text-left type-label text-[var(--content-tertiary)] border-b border-[var(--border-subtle)]">
                  <th className="py-2 font-normal w-14">Feature</th>
                  <th className="py-2 font-normal">Meaning</th>
                  <th className="py-2 font-normal">Formula</th>
                  <th className="py-2 font-normal text-right">Now</th>
                </tr>
              </thead>
              <tbody>
                {CONTEXT.map((c) => (
                  <tr key={c.x} className="border-b border-[var(--border-subtle)]">
                    <td className="py-2.5 font-mono text-[var(--accent)]">{c.x}</td>
                    <td className="py-2.5 text-[var(--content-primary)]">{c.name}</td>
                    <td className="py-2.5 font-mono text-xs text-[var(--content-secondary)]">{c.formula}</td>
                    <td className="py-2.5 font-mono tabular text-right text-[var(--content-secondary)]">{c.live ? c.live(currentTelemetry) : "at decision"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </Panel>
  );
};

export default BanditMonitor;
