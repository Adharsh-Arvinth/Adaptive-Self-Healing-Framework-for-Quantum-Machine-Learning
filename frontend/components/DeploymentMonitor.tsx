"use client";

import React from "react";
import { ShieldCheck, RotateCcw, AlertOctagon, CheckCircle2 } from "lucide-react";
import { DeploymentRecord } from "@/types";

interface DeploymentMonitorProps {
  deployment: DeploymentRecord | null;
  pipelineState: string;
}

export const DeploymentMonitor: React.FC<DeploymentMonitorProps> = ({ deployment, pipelineState }) => {
  const isRolledBack = deployment?.status === "ROLLED_BACK" || pipelineState === "ROLLED_BACK";
  const isCommitted = deployment?.status === "COMMITTED" || pipelineState === "COMMITTED";
  const isValidating = deployment?.status === "VALIDATING" || pipelineState === "VALIDATING_REPAIR";

  return (
    <div className="glass-panel p-5 flex flex-col justify-between h-full">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-neutral-200">
              Safe Deployment & Rollback Monitor
            </span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${
              isCommitted
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-semibold"
                : isRolledBack
                ? "bg-rose-500/15 text-rose-400 border-rose-500/40 font-semibold"
                : isValidating
                ? "bg-blue-500/15 text-blue-400 border-blue-500/30"
                : "bg-white/5 text-neutral-400 border-white/5"
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

        {/* Deployment Meta */}
        <div className="p-3 rounded-lg bg-black/20 border border-white/5 space-y-1.5 font-mono text-xs mb-3">
          <div className="flex justify-between">
            <span className="text-neutral-400">Deployed Arm:</span>
            <span className="text-white font-medium">
              {deployment?.repair_arm?.replace(/_/g, " ").toUpperCase() || "NONE"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Pre-Repair Loss:</span>
            <span className="text-neutral-300">
              {deployment?.loss_pre ? deployment.loss_pre.toFixed(4) : "—"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-neutral-400">Post-Repair Loss:</span>
            <span className="text-emerald-400">
              {deployment?.loss_post ? deployment.loss_post.toFixed(4) : "—"}
            </span>
          </div>
        </div>

        {/* Validation Progress Bar */}
        {isValidating && (
          <div className="mb-3">
            <div className="flex justify-between text-[11px] font-mono text-neutral-400 mb-1">
              <span>Validation Window Progress</span>
              <span className="text-blue-400">Observing...</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse w-2/3" />
            </div>
          </div>
        )}

        {/* Rollback Reason Notice */}
        {isRolledBack && deployment?.rollback_reason && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <div className="flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
                <span className="font-semibold">Automatic Rollback Executed</span>
              </div>
              <span className="text-[11px] text-rose-400 leading-tight block mt-0.5">
                {deployment.rollback_reason}
              </span>
            </div>
          </div>
        )}

        {/* Success Commit Notice */}
        {isCommitted && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Repair verified over validation window and permanently committed.</span>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-white/5 text-[10px] font-mono text-neutral-400 flex justify-between">
        <span>Fail-Safe Checkpointing</span>
        <span>100% Parameter Restoration</span>
      </div>
    </div>
  );
};
