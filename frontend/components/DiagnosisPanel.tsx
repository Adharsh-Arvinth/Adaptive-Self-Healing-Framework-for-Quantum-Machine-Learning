"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { DiagnosisData } from "@/types";
import { Badge, Empty, Meter, Panel, SubHead, fmt } from "./ui/kit";

interface DiagnosisPanelProps {
  diagnosis: DiagnosisData | null;
  activeAnomalies: string[];
}

const FAULTS: Record<string, { name: string; signature: string }> = {
  barren_plateau: { name: "Barren plateau", signature: "Consecutive gradients decorrelate while the loss stops improving." },
  lr_misconfiguration: { name: "LR too large", signature: "The loss oscillates; gradients reverse direction step to step." },
  optimizer_instability: { name: "Optimizer corrupted", signature: "The loss's coefficient of variation rises without any change to data or circuit." },
  training_divergence: { name: "Numerical divergence", signature: "Non-finite loss or gradients, or loss above 5." },
  persistent_plateau: { name: "Step-size collapse", signature: "Healthy gradient norm, near-zero parameter velocity, flat loss." },
  noise_degradation: { name: "Device noise", signature: "The measured, label-aligned output margin contracts." },
};

const GATE = 0.6;

export const DiagnosisPanel: React.FC<DiagnosisPanelProps> = ({ diagnosis, activeAnomalies = [] }) => {
  const [showRef, setShowRef] = useState(false);
  const confidence = diagnosis?.confidence ?? 0;
  const gate = diagnosis?.confidence_gate_cleared ?? false;
  const primary = diagnosis?.primary_cause ?? null;
  const probs = Object.entries(diagnosis?.probabilities ?? {}).sort((a, b) => b[1] - a[1]);
  const evidence = (diagnosis?.supporting_evidence ?? []).slice(0, 4);

  const status = !primary
    ? { tone: "ok" as const, text: "Healthy" }
    : gate
    ? { tone: "warn" as const, text: "Diagnosed · repairing" }
    : { tone: "info" as const, text: "Waiting for evidence" };

  return (
    <Panel
      eyebrow="Diagnosis"
      title="What is going wrong?"
      description="Telemetry evidence is scored into a probability for each fault. Below 60% confidence the system deliberately waits instead of guessing."
      actions={<Badge tone={status.tone} pulse={!!primary}>{status.text}</Badge>}
    >
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-5">
            <div className="type-label text-[var(--content-tertiary)]">Most likely cause</div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={primary ?? "none"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="type-condensed text-[clamp(2.4rem,4vw,3.4rem)] leading-none mt-2 text-[var(--content-primary)]"
              >
                {primary ? FAULTS[primary]?.name ?? fmt.human(primary) : "No fault"}
              </motion.div>
            </AnimatePresence>
            <div className="mt-5">
              <div className="flex items-baseline justify-between text-sm mb-2">
                <span className="text-[var(--content-secondary)]">Confidence</span>
                <span className="font-mono tabular text-[var(--content-primary)]">{primary ? fmt.pct(confidence) : "—"}</span>
              </div>
              <div className="relative">
                <Meter value={primary ? confidence : 0} tone={gate ? "warn" : "info"} label="Diagnosis confidence" />
                <span className="absolute -top-1 h-4 w-px bg-[var(--content-primary)]" style={{ left: `${GATE * 100}%` }} aria-hidden="true" />
              </div>
              <div className="relative flex justify-between text-xs text-[var(--content-tertiary)] mt-1.5">
                <span>0%</span>
                <span className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${GATE * 100}%` }}>gate 60%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <div>
            <SubHead>Active anomalies</SubHead>
            {activeAnomalies.length ? (
              <div className="flex flex-wrap gap-2">
                {activeAnomalies.map((a) => (
                  <Badge key={a} tone="warn">{FAULTS[a]?.name ?? fmt.human(a)}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[var(--content-secondary)]">
                {primary && gate
                  ? "No new anomaly since this diagnosis. The chosen repair is on probation; see Deployment for the outcome."
                  : primary
                  ? "Nothing confirmed yet; evidence is still being collected."
                  : "None. All telemetry is within its normal range."}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <div>
            <SubHead>Probability by fault</SubHead>
            {probs.length ? (
              <ul className="space-y-3">
                {probs.map(([k, v]) => (
                  <li key={k} className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] items-center gap-3">
                    <span className={`text-sm truncate ${k === primary ? "font-semibold text-[var(--content-primary)]" : "text-[var(--content-secondary)]"}`}>
                      {FAULTS[k]?.name ?? fmt.human(k)}
                    </span>
                    <Meter value={v} tone={k === primary ? (gate ? "warn" : "info") : "neutral"} label={`${k} probability`} />
                    <span className="text-sm font-mono tabular text-right text-[var(--content-secondary)]">{fmt.pct(v, 0)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty title="No diagnosis yet">Start training and inject a fault; probabilities appear as soon as evidence accumulates.</Empty>
            )}
          </div>

          {evidence.length > 0 && (
            <div>
              <SubHead>Evidence</SubHead>
              <ul className="space-y-2">
                {evidence.map((e, i) => (
                  <li key={i} className="text-sm text-[var(--content-secondary)] leading-relaxed pl-4 border-l-2 border-[var(--border-highlight)]">
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 border-t border-[var(--border-subtle)]">
        <button
          type="button"
          onClick={() => setShowRef((v) => !v)}
          aria-expanded={showRef}
          className="w-full flex items-center justify-between py-4 text-left"
        >
          <span className="type-label text-[var(--content-secondary)]">Fault reference · six signatures</span>
          <motion.span animate={{ rotate: showRef ? 180 : 0 }} transition={{ type: "spring", bounce: 0, duration: 0.35 }}>
            <ChevronDown className="w-4 h-4 text-[var(--content-secondary)]" />
          </motion.span>
        </button>
        <motion.div
          initial={false}
          animate={{ height: showRef ? "auto" : 0, opacity: showRef ? 1 : 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="overflow-hidden"
        >
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-2">
            {Object.entries(FAULTS).map(([k, f]) => (
              <div key={k} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                <div className="font-semibold text-[var(--content-primary)]">{f.name}</div>
                <p className="text-sm text-[var(--content-secondary)] mt-1 leading-relaxed">{f.signature}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </Panel>
  );
};

export default DiagnosisPanel;
