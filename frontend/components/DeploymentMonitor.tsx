"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  RotateCcw,
  AlertOctagon,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldAlert,
  Clock,
  Layers,
  Scale,
  Gauge,
} from "lucide-react";
import { DeploymentRecord } from "@/types";

interface DeploymentMonitorProps {
  deployment: DeploymentRecord | null;
  pipelineState: string;
  onCommit?: () => Promise<void> | void;
  onRollback?: () => Promise<void> | void;
}

export const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({
  deployment,
  pipelineState,
  onCommit,
  onRollback,
}) => {
  const [isActing, setIsActing] = useState(false);

  const isRolledBack = deployment?.status === "ROLLED_BACK" || pipelineState === "ROLLED_BACK";
  const isCommitted = deployment?.status === "COMMITTED" || pipelineState === "COMMITTED";
  const isValidating =
    deployment?.status === "VALIDATING" ||
    pipelineState === "VALIDATING_REPAIR" ||
    pipelineState === "DEPLOYED";

  const handleAction = async (action: "commit" | "rollback") => {
    setIsActing(true);
    try {
      if (action === "commit" && onCommit) {
        await onCommit();
      } else if (action === "rollback" && onRollback) {
        await onRollback();
      }
    } finally {
      setIsActing(false);
    }
  };

  const deltaLoss =
    deployment?.loss_post !== undefined &&
    deployment?.loss_pre !== undefined &&
    deployment.loss_post !== null &&
    deployment.loss_pre !== null
      ? deployment.loss_post - deployment.loss_pre
      : null;

  return (
    <div className="glass-panel p-6 flex flex-col justify-between h-full">
      {/* Symmetrical Header matching DiagnosisPanel */}
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--status-success-subtle)] flex items-center justify-center text-[var(--status-success)] shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
                Transactional Safe Deployment Monitor
              </h2>
              <p className="text-[11px] text-[var(--content-tertiary)]">
                Atomic state checkpointing, validation window & automatic rollback
              </p>
            </div>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-mono border flex items-center gap-1.5 shrink-0 ${
              isCommitted
                ? "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/30 font-semibold"
                : isRolledBack
                ? "bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border-[var(--status-danger)]/30 font-semibold"
                : isValidating
                ? "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-[var(--status-warning)]/30 font-semibold"
                : "bg-neutral-500/10 text-[var(--content-secondary)] border-[var(--border-subtle)]"
            }`}
          >
            {isCommitted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-[var(--status-success)]" />
                <span>COMMITTED</span>
              </>
            ) : isRolledBack ? (
              <>
                <RotateCcw className="w-3.5 h-3.5 text-[var(--status-danger)]" />
                <span>ROLLED BACK</span>
              </>
            ) : isValidating ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[var(--status-warning)] animate-pulse" />
                <span>VALIDATING (W=3)</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-neutral-400" />
                <span>STANDBY</span>
              </>
            )}
          </div>
        </div>

        {/* Transactional Lifecycle Pipeline Visual */}
        <div className="mb-4 px-3 py-2 rounded-xl glass-panel-subtle border border-[var(--border-subtle)] font-mono text-[10px] min-h-[36px] flex items-center">
          <div className="w-full flex items-center justify-between text-[var(--content-secondary)]">
            <span
              className={`flex items-center gap-1 ${
                isValidating || isCommitted || isRolledBack
                  ? "text-[var(--status-ansatz)] font-semibold"
                  : ""
              }`}
            >
              <Lock className="w-3 h-3" /> Checkpoint
            </span>
            <ArrowRight className="w-2.5 h-2.5 opacity-40" />
            <span
              className={`flex items-center gap-1 ${
                isValidating || isCommitted || isRolledBack
                  ? "text-[var(--status-info)] font-semibold"
                  : ""
              }`}
            >
              Deployed
            </span>
            <ArrowRight className="w-2.5 h-2.5 opacity-40" />
            <span
              className={`flex items-center gap-1 ${
                isValidating ? "text-[var(--status-warning)] font-semibold animate-pulse" : ""
              }`}
            >
              Validate W=3
            </span>
            <ArrowRight className="w-2.5 h-2.5 opacity-40" />
            <span
              className={`flex items-center gap-1 ${
                isCommitted
                  ? "text-[var(--status-success)] font-semibold"
                  : isRolledBack
                  ? "text-[var(--status-danger)] font-semibold"
                  : ""
              }`}
            >
              Commit / Rollback
            </span>
          </div>
        </div>

        {/* Live Deployment Metrics Card (Equal height to Bayesian Confidence Gauge) */}
        <div className="mb-4 p-3.5 rounded-xl glass-panel-subtle border border-[var(--border-subtle)]">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-[10px] text-[var(--content-tertiary)] block">Deployed Arm</span>
              <span className="text-xs font-semibold text-[var(--content-primary)] truncate block mt-0.5">
                {deployment?.repair_arm?.replace(/_/g, " ").toUpperCase() || "NONE"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--content-tertiary)] block">Pre-Repair Loss</span>
              <span className="text-xs font-semibold text-[var(--content-primary)] block mt-0.5">
                {deployment?.loss_pre ? deployment.loss_pre.toFixed(4) : "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--content-tertiary)] block">Post-Repair Loss</span>
              <span
                className={`text-xs font-semibold block mt-0.5 ${
                  deployment?.loss_post && deployment?.loss_pre && deployment.loss_post < deployment.loss_pre
                    ? "text-[var(--status-success)]"
                    : "text-[var(--content-primary)]"
                }`}
              >
                {deployment?.loss_post ? deployment.loss_post.toFixed(4) : "—"}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[var(--content-tertiary)] block">Δ Loss Delta</span>
              <span
                className={`text-xs font-semibold block mt-0.5 ${
                  deltaLoss !== null && deltaLoss < 0
                    ? "text-[var(--status-success)]"
                    : deltaLoss !== null && deltaLoss > 0
                    ? "text-[var(--status-danger)]"
                    : "text-[var(--content-secondary)]"
                }`}
              >
                {deltaLoss !== null ? `${deltaLoss > 0 ? "+" : ""}${deltaLoss.toFixed(4)}` : "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Failsafe Invariant Protection Grid (Symmetrically balances 6 posterior bars) */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="p-2.5 rounded-lg glass-panel-subtle border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--content-primary)] font-medium mb-1">
              <Clock className="w-3.5 h-3.5 text-[var(--status-info)]" />
              <span>Validation Window</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--content-tertiary)]">W_val = 3</span>
              <span className="text-[var(--status-success)] font-semibold">Protected</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg glass-panel-subtle border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--content-primary)] font-medium mb-1">
              <Scale className="w-3.5 h-3.5 text-[var(--status-warning)]" />
              <span>Max Regression</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--content-tertiary)]">Ceiling: +15.0%</span>
              <span className="text-[var(--status-warning)] font-semibold">Active Guard</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg glass-panel-subtle border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--content-primary)] font-medium mb-1">
              <Gauge className="w-3.5 h-3.5 text-[var(--status-ansatz)]" />
              <span>Accuracy Floor</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--content-tertiary)]">Floor: ≥ 40.0%</span>
              <span className="text-[var(--status-ansatz)] font-semibold">Enforced</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg glass-panel-subtle border border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs text-[var(--content-primary)] font-medium mb-1">
              <Layers className="w-3.5 h-3.5 text-[var(--status-purity)]" />
              <span>Rollback Mechanism</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[var(--content-tertiary)]">In-Memory Snapshot</span>
              <span className="text-[var(--status-purity)] font-semibold">Active Snapshot</span>
            </div>
          </div>
        </div>

        {/* Interactive Validation Controls if Active */}
        {isValidating && (onCommit || onRollback) && (
          <div className="p-3 rounded-xl bg-[var(--status-info-subtle)] border border-[var(--status-info)]/30 mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-[var(--status-info)]">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Active Validation Controls
              </span>
              <span className="text-[10px] font-mono text-[var(--status-info)]/80">Window W_val=3</span>
            </div>
            <div className="flex items-center gap-2">
              {onCommit && (
                <button
                  onClick={() => handleAction("commit")}
                  disabled={isActing}
                  className="apple-btn flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--status-success)] hover:opacity-90 text-white flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Force Commit</span>
                </button>
              )}
              {onRollback && (
                <button
                  onClick={() => handleAction("rollback")}
                  disabled={isActing}
                  className="apple-btn flex-1 py-1.5 rounded-lg text-xs font-medium bg-[var(--status-danger)] hover:opacity-90 text-white flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Force Rollback</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rollback Notice if Triggered */}
        {isRolledBack && deployment?.rollback_reason && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[var(--status-danger)] text-xs font-mono flex items-start gap-2 mb-3">
            <AlertOctagon className="w-4 h-4 text-[var(--status-danger)] shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-[var(--status-danger)]" />
                <span className="font-semibold">Automatic Rollback Executed</span>
              </div>
              <span className="text-[11px] leading-tight block mt-1 text-[var(--status-danger)]">
                {deployment.rollback_reason}
              </span>
            </div>
          </div>
        )}

        {/* Commit Notice if Committed */}
        {isCommitted && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[var(--status-success)] text-xs font-mono flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-[var(--status-success)] shrink-0" />
            <span className="leading-tight">
              Repair verified over validation window and permanently committed to model parameters.
            </span>
          </div>
        )}
      </div>

      {/* Symmetrical Footer matching DiagnosisPanel */}
      <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono text-[var(--content-tertiary)]">
        <span>Fail-Safe Checkpoint Snapshot: In-Memory Clone</span>
        <span>In-Memory Deepcopy Snapshot • Zero Data Loss Restoration</span>
      </div>
    </div>
  );
};
