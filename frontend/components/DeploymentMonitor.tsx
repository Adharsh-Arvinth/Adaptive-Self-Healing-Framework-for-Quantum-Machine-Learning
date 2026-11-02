"use client";

import React, { useState } from "react";
import { ShieldCheck, RotateCcw, AlertOctagon, CheckCircle2, Lock, ArrowRight, ShieldAlert } from "lucide-react";
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

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Transactional Safe Deployment Monitor
            </h2>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
              isCommitted
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold"
                : isRolledBack
                ? "bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold"
                : isValidating
                ? "bg-blue-500/15 text-blue-400 border-blue-500/30 font-semibold"
                : "bg-neutral-500/10 text-[var(--content-secondary)] border-[var(--border-subtle)]"
            }`}
          >
            {isCommitted
              ? "COMMITTED"
              : isRolledBack
              ? "ROLLED BACK"
              : isValidating
              ? "VALIDATING (W_val=3)"
              : "STANDBY"}
          </span>
        </div>

        {/* Transactional Lifecycle Pipeline Visual */}
        <div className="mb-3.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] font-mono text-[10px]">
          <div className="flex items-center justify-between text-[var(--content-secondary)]">
            <span
              className={`flex items-center gap-1 ${
                isValidating || isCommitted || isRolledBack
                  ? "text-purple-400 font-semibold"
                  : ""
              }`}
            >
              <Lock className="w-3 h-3" /> Checkpoint
            </span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span
              className={`flex items-center gap-1 ${
                isValidating || isCommitted || isRolledBack
                  ? "text-blue-400 font-semibold"
                  : ""
              }`}
            >
              Deployed
            </span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span
              className={`flex items-center gap-1 ${
                isValidating ? "text-amber-400 font-semibold animate-pulse" : ""
              }`}
            >
              Validate W=3
            </span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span
              className={`flex items-center gap-1 ${
                isCommitted
                  ? "text-emerald-400 font-semibold"
                  : isRolledBack
                  ? "text-rose-400 font-semibold"
                  : ""
              }`}
            >
              Commit / Rollback
            </span>
          </div>
        </div>

        {/* Deployment Metadata */}
        <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 font-mono text-xs mb-3">
          <div className="flex justify-between items-center">
            <span className="text-[var(--content-secondary)]">Deployed Arm:</span>
            <span className="text-[var(--content-primary)] font-semibold">
              {deployment?.repair_arm?.replace(/_/g, " ").toUpperCase() || "NONE"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--content-secondary)]">Pre-Repair Loss:</span>
            <span className="text-[var(--content-primary)]">
              {deployment?.loss_pre ? deployment.loss_pre.toFixed(4) : "—"}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[var(--content-secondary)]">Post-Repair Loss:</span>
            <span
              className={
                deployment?.loss_post && deployment?.loss_pre && deployment.loss_post < deployment.loss_pre
                  ? "text-emerald-400 font-semibold"
                  : "text-[var(--content-primary)]"
              }
            >
              {deployment?.loss_post ? deployment.loss_post.toFixed(4) : "—"}
            </span>
          </div>
        </div>

        {/* Manual Force Commit / Force Rollback Controls during validation */}
        {isValidating && (onCommit || onRollback) && (
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 mb-3 space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-blue-400">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Active Validation Controls
              </span>
              <span className="text-[10px] font-mono text-blue-400/80">Window W_val=3</span>
            </div>
            <div className="flex items-center gap-2">
              {onCommit && (
                <button
                  onClick={() => handleAction("commit")}
                  disabled={isActing}
                  className="apple-btn flex-1 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Force Commit</span>
                </button>
              )}
              {onRollback && (
                <button
                  onClick={() => handleAction("rollback")}
                  disabled={isActing}
                  className="apple-btn flex-1 py-1.5 rounded-lg text-xs font-medium bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Force Rollback</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Rollback Reason Notice */}
        {isRolledBack && deployment?.rollback_reason && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono flex items-start gap-2 mb-3">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">Automatic Rollback Executed</span>
              </div>
              <span className="text-[11px] leading-tight block mt-1 text-rose-300">
                {deployment.rollback_reason}
              </span>
            </div>
          </div>
        )}

        {/* Success Commit Notice */}
        {isCommitted && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="leading-tight">
              Repair verified over validation window and permanently committed to model parameters.
            </span>
          </div>
        )}
      </div>

      <div className="pt-2.5 border-t border-[var(--border-subtle)] text-[10px] font-mono text-[var(--content-secondary)] flex justify-between">
        <span>Fail-Safe Checkpoint Snapshot</span>
        <span>100% Exact Weight Restoration</span>
      </div>
    </div>
  );
};
