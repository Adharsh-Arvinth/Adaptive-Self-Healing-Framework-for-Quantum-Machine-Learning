"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  Layers,
  Scale,
  Gauge,
  Activity,
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

  const isIdle = !isValidating && !isCommitted && !isRolledBack;

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
    <div className="glass-panel p-5 flex flex-col justify-between h-full font-sans">
      {/* Symmetrical Header matching DiagnosisPanel */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--content-primary)]">
                Transactional Safe Deployment Monitor
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--content-secondary)] border border-[var(--border-subtle)]">
                Window W_val = 3
              </span>
            </div>
            <p className="text-xs text-[var(--content-secondary)] mt-0.5">
              Atomic state checkpointing, sandboxed lookahead validation & automatic rollback
            </p>
          </div>

          <div
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 shrink-0 ${
              isCommitted
                ? "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/30 font-semibold"
                : isRolledBack
                ? "bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border-[var(--status-danger)]/30 font-semibold"
                : isValidating
                ? "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-[var(--status-warning)]/30 font-semibold"
                : "bg-[var(--bg-subtle)] text-[var(--content-secondary)] border-[var(--border-subtle)]"
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
                <span className="w-2 h-2 rounded-full bg-[var(--content-tertiary)]" />
                <span>STANDBY</span>
              </>
            )}
          </div>
        </div>

        {/* Lifecycle Flow Pipeline: Checkpoint -> Candidate Repair -> Validation -> Commit / Rollback */}
        <div className="mb-3.5 p-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <div className="flex items-center justify-between text-xs font-sans">
            <span
              className={`flex items-center gap-1 ${
                isValidating || isCommitted || isRolledBack ? "text-[var(--accent)] font-semibold" : "text-[var(--content-secondary)]"
              }`}
            >
              <Lock className="w-3 h-3" />
              <span>Checkpoint</span>
            </span>
            <ArrowRight className="w-3 h-3 text-[var(--content-tertiary)]" />
            <span
              className={`flex items-center gap-1 ${
                isValidating || isCommitted || isRolledBack ? "text-[var(--status-info)] font-semibold" : "text-[var(--content-secondary)]"
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Candidate Repair</span>
            </span>
            <ArrowRight className="w-3 h-3 text-[var(--content-tertiary)]" />
            <span
              className={`flex items-center gap-1 ${
                isValidating ? "text-[var(--status-warning)] font-semibold animate-pulse" : "text-[var(--content-secondary)]"
              }`}
            >
              <Clock className="w-3 h-3" />
              <span>Validation (W=3)</span>
            </span>
            <ArrowRight className="w-3 h-3 text-[var(--content-tertiary)]" />
            <span
              className={`flex items-center gap-1 ${
                isCommitted
                  ? "text-[var(--status-success)] font-semibold"
                  : isRolledBack
                  ? "text-[var(--status-danger)] font-semibold"
                  : "text-[var(--content-secondary)]"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Commit / Rollback</span>
            </span>
          </div>
        </div>

        {/* State Display: Active Validation vs Meaningful Idle State */}
        {isIdle ? (
          /* High-Quality Compact Idle State */
          <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--content-primary)]">
                Transactional Rollback Failsafe Active
              </span>
              <span className="text-[11px] font-mono text-[var(--status-success)]">
                In-Memory Snapshot Ready
              </span>
            </div>
            <p className="text-xs text-[var(--content-secondary)] leading-relaxed">
              Before any candidate parameter mutation is executed, an in-memory deepcopy checkpoint captures exact
              weights, optimizer momentum, and random number generator states. If validation detects performance regression,
              the state restores in zero time with zero data loss.
            </p>
          </div>
        ) : (
          /* Active Deployment Readout */
          <div className="p-3.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
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
              <span className="text-xs font-semibold text-[var(--content-primary)] block mt-0.5">
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
        )}

        {/* 4 Invariant Guard Indicators */}
        <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1.5 text-[var(--content-primary)] font-medium">
              <Clock className="w-3.5 h-3.5 text-[var(--status-info)]" />
              <span>Validation Window</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-[var(--content-secondary)]">
              <span>W_val = 3 steps</span>
              <span className="text-[var(--status-success)] font-semibold">Active</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1.5 text-[var(--content-primary)] font-medium">
              <Scale className="w-3.5 h-3.5 text-[var(--status-warning)]" />
              <span>Regression Ceiling</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-[var(--content-secondary)]">
              <span>ΔL &le; +15.0%</span>
              <span className="text-[var(--status-warning)] font-semibold">Guarded</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1.5 text-[var(--content-primary)] font-medium">
              <Gauge className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Accuracy Floor</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-[var(--content-secondary)]">
              <span>Acc &ge; 40.0%</span>
              <span className="text-[var(--status-success)] font-semibold">Enforced</span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            <div className="flex items-center gap-1.5 text-[var(--content-primary)] font-medium">
              <Layers className="w-3.5 h-3.5 text-[var(--status-purity)]" />
              <span>Snapshot Mode</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-1 text-[var(--content-secondary)]">
              <span>In-Memory Deepcopy</span>
              <span className="text-[var(--status-purity)] font-semibold">Ready</span>
            </div>
          </div>
        </div>

        {/* Interactive Manual Override Controls if Validating */}
        {isValidating && (onCommit || onRollback) && (
          <div className="mt-3 p-3 rounded-xl bg-[var(--status-info-subtle)] border border-[var(--status-info)]/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-[var(--status-info)] font-medium">
              <span>Candidate Under Validation</span>
              <span className="font-mono text-[11px]">Validation Window W_val=3</span>
            </div>
            <div className="flex items-center gap-2">
              {onCommit && (
                <button
                  onClick={() => handleAction("commit")}
                  disabled={isActing}
                  className="apple-btn flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[var(--status-success)] text-white hover:opacity-90 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Force Commit</span>
                </button>
              )}
              {onRollback && (
                <button
                  onClick={() => handleAction("rollback")}
                  disabled={isActing}
                  className="apple-btn flex-1 py-1.5 rounded-lg text-xs font-semibold bg-[var(--status-danger)] text-white hover:opacity-90 flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Force Rollback</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Symmetrical Panel Footer */}
      <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] text-[var(--content-tertiary)] font-mono">
        <span>Fail-Safe Checkpoint Snapshot: In-Memory Deepcopy</span>
        <span>Zero Data Loss Recovery</span>
      </div>
    </div>
  );
};
