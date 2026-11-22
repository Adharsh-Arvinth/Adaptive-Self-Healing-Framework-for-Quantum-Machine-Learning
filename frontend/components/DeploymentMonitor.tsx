"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { DeploymentRecord } from "@/types";
import { Badge, Btn, KeyValues, Panel, Stat, SubHead, fmt } from "./ui/kit";

interface DeploymentMonitorProps {
  deployment: DeploymentRecord | null;
  pipelineState: string;
  onCommit?: () => Promise<void> | void;
  onRollback?: () => Promise<void> | void;
}

const STAGES = ["Checkpoint", "Repair applied", "Probation · 3 steps", "Commit or rollback"];

export const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({ deployment, pipelineState, onCommit, onRollback }) => {
  const [acting, setActing] = useState(false);

  const isRolledBack = deployment?.status === "ROLLED_BACK" || pipelineState === "ROLLED_BACK";
  const isCommitted = deployment?.status === "COMMITTED" || pipelineState === "COMMITTED";
  const isValidating = deployment?.status === "VALIDATING" || pipelineState === "VALIDATING_REPAIR" || pipelineState === "DEPLOYED";
  const isIdle = !isValidating && !isCommitted && !isRolledBack;

  const stage = isIdle ? -1 : isValidating ? 2 : 3;
  const status = isCommitted
    ? { tone: "ok" as const, text: "Committed" }
    : isRolledBack
    ? { tone: "bad" as const, text: "Rolled back" }
    : isValidating
    ? { tone: "warn" as const, text: "On probation" }
    : { tone: "neutral" as const, text: "Idle" };

  const pre = deployment?.loss_pre;
  const post = deployment?.loss_post;
  const delta = typeof pre === "number" && typeof post === "number" && Number.isFinite(pre) && Number.isFinite(post) ? post - pre : null;

  const act = async (kind: "commit" | "rollback") => {
    setActing(true);
    try {
      if (kind === "commit") await onCommit?.();
      else await onRollback?.();
    } finally {
      setActing(false);
    }
  };

  return (
    <Panel
      eyebrow="Safe deployment"
      title="Probation, then commit or rollback"
      description="Before a repair touches the model, the exact state is checkpointed. The repair then runs on probation and is kept only if training improves."
      actions={<Badge tone={status.tone} pulse={isValidating}>{status.text}</Badge>}
    >
      {/* Lifecycle */}
      <ol className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8" aria-label="Deployment lifecycle">
        {STAGES.map((s, i) => {
          const done = stage > i || (stage === 3 && i === 3);
          const active = stage === i;
          const tone = i === 3 && isRolledBack ? "bad" : "accent";
          return (
            <li key={s} className="relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 overflow-hidden">
              <motion.span
                className={`absolute inset-x-0 bottom-0 h-1 origin-left ${tone === "bad" ? "bg-[var(--status-danger)]" : "bg-[var(--accent)]"}`}
                initial={false}
                animate={{ scaleX: done || active ? 1 : 0, opacity: active ? 0.6 : 1 }}
                transition={{ type: "spring", bounce: 0, duration: 0.6, delay: i * 0.05 }}
              />
              <div className="type-label text-[var(--content-tertiary)] tabular">{String(i + 1).padStart(2, "0")}</div>
              <div className={`font-semibold mt-1 ${done || active ? "text-[var(--content-primary)]" : "text-[var(--content-tertiary)]"}`}>{s}</div>
            </li>
          );
        })}
      </ol>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div>
            <SubHead>This deployment</SubHead>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              <Stat label="Repair" value={deployment?.repair_arm ? fmt.human(deployment.repair_arm) : "None"} />
              <Stat label="Loss before" value={fmt.n(pre)} />
              <Stat label="Loss after" value={fmt.n(post)} />
              <Stat
                label="Change"
                value={delta === null ? "—" : `${delta > 0 ? "+" : ""}${delta.toFixed(4)}`}
                tone={delta === null ? "neutral" : delta < 0 ? "ok" : "bad"}
              />
            </div>
            {deployment?.rollback_reason && (
              <p className="mt-3 text-sm text-[var(--status-danger)] leading-relaxed">Rolled back: {deployment.rollback_reason}</p>
            )}
          </div>
          <div>
            <SubHead>Manual override</SubHead>
            <div className="flex flex-wrap gap-2">
              <Btn variant="success" disabled={!isValidating || acting} onClick={() => act("commit")} icon={<CheckCircle2 className="w-4 h-4" />}>
                Force commit
              </Btn>
              <Btn variant="danger" disabled={!isValidating || acting} onClick={() => act("rollback")} icon={<RotateCcw className="w-4 h-4" />}>
                Force rollback
              </Btn>
            </div>
            <p className="text-xs text-[var(--content-tertiary)] mt-2">
              {isValidating ? "Ends probation early. Rollback restores the exact checkpoint." : "Available while a repair is on probation."}
            </p>
          </div>
        </div>
        <div className="lg:col-span-2">
          <SubHead>Guard rules</SubHead>
          <KeyValues
            items={[
              { k: "Probation window", v: "3 steps" },
              { k: "Loss may not rise by more than", v: "15%" },
              { k: "Validation accuracy floor", v: "40%" },
              { k: "Divergence ceiling", v: "loss 5 · ‖g‖ 50" },
              { k: "Rollback restores", v: "params, optimizer, RNG" },
            ]}
          />
        </div>
      </div>
    </Panel>
  );
};

export default DeploymentMonitor;
