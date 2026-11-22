"use client";

import React, { useState } from "react";
import { FlaskConical, Layers, RefreshCw, Shuffle, Sliders, Sparkles, Wand2 } from "lucide-react";
import { DeploymentRecord } from "@/types";
import { Badge, Btn, Panel } from "./ui/kit";

interface RepairCockpitProps {
  selectedArm: string | null;
  eligibleArms: string[];
  currentOptimizer: string;
  currentFeatureMap: string;
  currentDepth: number;
  onTriggerRepair?: (armId: string) => Promise<void> | void;
  onSimulateTwin?: (armId: string) => Promise<unknown>;
  deployment?: DeploymentRecord | null;
  pipelineState?: string;
  onCommit?: () => Promise<void> | void;
  onRollback?: () => Promise<void> | void;
}

/* Arm ids must match backend RepairArm values exactly. */
const ARMS = [
  { id: "adjust_learning_rate", name: "Re-anchor learning rate", what: "Resets a step size that drifted more than 4× from its configured value; otherwise scales it by 0.2× or 2×.", guard: "Bounded to [1e-4, 1.0]; no direction reversal within 4 steps.", icon: Sliders },
  { id: "change_optimizer", name: "Change optimizer", what: "Switches Adam ↔ RMSprop ↔ SGD and clears all momentum buffers.", guard: "No switching back to a recently used optimizer.", icon: Shuffle },
  { id: "perform_warm_restart", name: "Warm restart", what: "Near-identity re-initialisation for plateaus and NaNs; a small Gaussian nudge otherwise.", guard: "Parameters stay finite and bounded.", icon: RefreshCw },
  { id: "apply_noise_mitigation", name: "Noise mitigation", what: "Rescales measured expectations by the calibrated contraction: removes bias, amplifies shot noise.", guard: "Skipped when already active.", icon: Sparkles },
  { id: "reduce_circuit_depth", name: "Reduce depth", what: "Removes one variational layer: less noise accumulation and gradient concentration, less capacity.", guard: "Never below one layer.", icon: Layers },
  { id: "modify_feature_map", name: "Swap feature map", what: "Toggles angle encoding ↔ entangling IQP map, reshaping the kernel the model learns with.", guard: "No toggling back within 4 steps.", icon: Wand2 },
];

export const RepairCockpit: React.FC<RepairCockpitProps> = ({
  selectedArm,
  eligibleArms = [],
  currentOptimizer,
  currentFeatureMap,
  currentDepth,
  onTriggerRepair,
  onSimulateTwin,
  deployment,
  pipelineState,
}) => {
  const [busy, setBusy] = useState<string | null>(null);
  const validating = deployment?.status === "VALIDATING" || pipelineState === "VALIDATING_REPAIR" || pipelineState === "DEPLOYED";

  const current: Record<string, string> = {
    change_optimizer: `now: ${currentOptimizer.toUpperCase()}`,
    modify_feature_map: `now: ${currentFeatureMap}`,
    reduce_circuit_depth: `now: L = ${currentDepth}`,
  };

  const run = async (kind: "deploy" | "rehearse", id: string) => {
    if (busy) return;
    setBusy(`${kind}:${id}`);
    try {
      if (kind === "deploy") await onTriggerRepair?.(id);
      else await onSimulateTwin?.(id);
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      eyebrow="Repairs"
      title="Six reversible repairs"
      description="Each repair is a small, reversible change to the training configuration. The bandit normally chooses; you can rehearse any of them in the digital twin or deploy one yourself."
      actions={validating ? <Badge tone="warn" pulse>Repair on probation</Badge> : <Badge tone="neutral">Ready</Badge>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ARMS.map((a, i) => {
          const Icon = a.icon;
          const chosen = selectedArm === a.id;
          const blocked = (eligibleArms.length > 0 && !eligibleArms.includes(a.id)) || (a.id === "reduce_circuit_depth" && currentDepth <= 1);
          return (
            <article
              key={a.id}
              className={`interactive-card relative rounded-[1.4rem] border bg-[var(--bg-primary)] p-5 flex flex-col ${
                chosen ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--border-subtle)]"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="card-icon w-11 h-11 rounded-2xl border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-secondary)]">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="flex items-center gap-2">
                  {chosen && <Badge tone="accent">Chosen</Badge>}
                  {blocked && !chosen && <Badge tone="neutral">Blocked</Badge>}
                  <span className="type-label text-[var(--content-tertiary)] tabular">{String(i + 1).padStart(2, "0")}</span>
                </div>
              </div>
              <h3 className="font-display font-bold text-[1.2rem] tracking-[-0.02em] mt-5 text-[var(--content-primary)]">{a.name}</h3>
              <p className="text-sm text-[var(--content-secondary)] mt-1.5 leading-relaxed flex-1">{a.what}</p>
              <p className="text-xs text-[var(--content-tertiary)] mt-3">
                Guard: {a.guard}
                {current[a.id] && <span className="block mt-0.5 font-mono">{current[a.id]}</span>}
              </p>
              <div className="flex gap-2 mt-5 pt-4 border-t border-[var(--border-subtle)]">
                <Btn size="sm" variant="secondary" onClick={() => run("rehearse", a.id)} disabled={!!busy || !onSimulateTwin} icon={<FlaskConical className="w-3.5 h-3.5" />}>
                  {busy === `rehearse:${a.id}` ? "Rehearsing…" : "Rehearse"}
                </Btn>
                <Btn size="sm" variant="primary" onClick={() => run("deploy", a.id)} disabled={!!busy || blocked || validating || !onTriggerRepair}>
                  {busy === `deploy:${a.id}` ? "Deploying…" : "Deploy"}
                </Btn>
              </div>
            </article>
          );
        })}
      </div>
      <p className="text-xs text-[var(--content-tertiary)] mt-4">
        Deploying is disabled while another repair is on probation. Rehearsal results appear in the Digital twin section.
      </p>
    </Panel>
  );
};

export default RepairCockpit;
