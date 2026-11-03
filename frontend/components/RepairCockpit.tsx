"use client";

import React, { useState } from "react";
import { Wrench, Shield, Layers, RefreshCw, Zap, Sliders, Cpu, GitBranch, Play } from "lucide-react";

interface RepairCockpitProps {
  selectedArm: string | null;
  eligibleArms: string[];
  currentOptimizer: string;
  currentFeatureMap: string;
  currentDepth: number;
  onTriggerRepair?: (armId: string) => Promise<void> | void;
}

interface ArmSpec {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  category: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
  };
  subInfo: (opt: string, feat: string, depth: number) => string;
}

const LOCKED_ARMS: ArmSpec[] = [
  {
    id: "change_optimizer",
    name: "Change Optimizer",
    desc: "Cycle Adam / RMSprop / SGD and reset momentum state",
    icon: Sliders,
    category: "Classical",
    colorScheme: {
      bg: "bg-blue-500/10 dark:bg-blue-500/15",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20",
    },
    subInfo: (opt) => `Current: ${opt.toUpperCase()}`,
  },
  {
    id: "reduce_circuit_depth",
    name: "Reduce Depth",
    desc: "Truncate ansatz layers L → L - 1 to alleviate barren plateaus",
    icon: Layers,
    category: "Ansatz",
    colorScheme: {
      bg: "bg-indigo-500/10 dark:bg-indigo-500/15",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-500/20",
    },
    subInfo: (_, __, depth) => `Layers: L = ${depth}`,
  },
  {
    id: "modify_feature_map",
    name: "Modify Feature Map",
    desc: "Toggle Angle ↔ IQP Hilbert space embedding",
    icon: GitBranch,
    category: "Embedding",
    colorScheme: {
      bg: "bg-purple-500/10 dark:bg-purple-500/15",
      text: "text-purple-600 dark:text-purple-400",
      border: "border-purple-500/20",
    },
    subInfo: (_, feat) => `Map: ${feat.toUpperCase()}`,
  },
  {
    id: "adjust_learning_rate",
    name: "Adjust Learning Rate",
    desc: "Dynamic scaling of eta within safe bounds [1e-4, 1.0]",
    icon: Zap,
    category: "Rate",
    colorScheme: {
      bg: "bg-amber-500/10 dark:bg-amber-500/15",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20",
    },
    subInfo: () => "Scale: 0.5x or 1.5x",
  },
  {
    id: "apply_noise_mitigation",
    name: "Noise Mitigation",
    desc: "Analytical inverse-noise correction over radial contraction",
    icon: Cpu,
    category: "Mitigation",
    colorScheme: {
      bg: "bg-cyan-500/10 dark:bg-cyan-500/15",
      text: "text-cyan-600 dark:text-cyan-400",
      border: "border-cyan-500/20",
    },
    subInfo: () => "Inverse Contraction",
  },
  {
    id: "perform_warm_restart",
    name: "Warm Restart",
    desc: "Perturb parameters (σ=0.05) or reset near-identity",
    icon: RefreshCw,
    category: "Restart",
    colorScheme: {
      bg: "bg-rose-500/10 dark:bg-rose-500/15",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/20",
    },
    subInfo: () => "Perturbation (σ=0.05)",
  },
];

export const RepairCockpit: React.FC<RepairCockpitProps> = ({
  selectedArm,
  eligibleArms = [],
  currentOptimizer,
  currentFeatureMap,
  currentDepth,
  onTriggerRepair,
}) => {
  const [deployingArm, setDeployingArm] = useState<string | null>(null);

  const handleDeploy = async (armId: string) => {
    if (!onTriggerRepair) return;
    setDeployingArm(armId);
    try {
      await onTriggerRepair(armId);
    } finally {
      setDeployingArm(null);
    }
  };

  return (
    <div className="glass-panel p-6 flex flex-col justify-between">
      {/* Cockpit Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-500">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
                Six-Arm Adaptive Repair Cockpit
              </h2>
              <p className="text-[11px] text-[var(--content-tertiary)]">
                Transactional quantum circuit reconfiguration & parameter restoration
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel-subtle text-xs font-mono text-[var(--content-secondary)]">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>Safety Filter Active</span>
          </div>
        </div>
      </div>

      {/* Grid of the 6 Locked Repair Arms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {LOCKED_ARMS.map((arm, index) => {
          const isSelected = selectedArm === arm.id;
          const isEligible = eligibleArms.includes(arm.id);
          const isDeploying = deployingArm === arm.id;
          const isMinDepth = arm.id === "reduce_circuit_depth" && currentDepth <= 2;
          const Icon = arm.icon;

          return (
            <div
              key={arm.id}
              className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-purple-500/10 dark:bg-purple-500/15 border-purple-500/40 shadow-sm"
                  : "glass-panel-subtle hover:border-[var(--border-highlight)]"
              }`}
            >
              <div>
                {/* Top Row: Icon Badge, Category, Status Pill */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${arm.colorScheme.bg} ${arm.colorScheme.text} ${arm.colorScheme.border}`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-[var(--content-primary)] leading-tight">
                        {arm.name}
                      </div>
                      <span className="text-[10px] text-[var(--content-tertiary)] font-mono">
                        Arm #{index + 1} • {arm.category}
                      </span>
                    </div>
                  </div>

                  {/* Status Pill */}
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30 shrink-0">
                      ACTIVE
                    </span>
                  ) : isMinDepth ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-amber-500/15 text-amber-500 border border-amber-500/30 shrink-0">
                      MIN DEPTH
                    </span>
                  ) : isEligible ? (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 shrink-0">
                      ELIGIBLE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono bg-neutral-500/10 text-[var(--content-tertiary)] border border-[var(--border-subtle)] shrink-0">
                      NOMINAL
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed mb-3">
                  {arm.desc}
                </p>
              </div>

              {/* Bottom Row: Dynamic Circuit State & Apple Action Button */}
              <div className="pt-2.5 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[var(--content-tertiary)] text-[10px]">
                  {arm.subInfo(currentOptimizer, currentFeatureMap, currentDepth)}
                </span>

                {onTriggerRepair && (
                  <button
                    onClick={() => handleDeploy(arm.id)}
                    disabled={isDeploying || isSelected || isMinDepth}
                    className={`apple-btn px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                      isSelected
                        ? "bg-purple-500/20 text-purple-300 cursor-default"
                        : isMinDepth
                        ? "opacity-40 cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--content-tertiary)] border border-[var(--border-subtle)]"
                        : "bg-blue-600 hover:bg-blue-500 text-white active:scale-95"
                    }`}
                    title={
                      isMinDepth
                        ? "Safety filter constraint: Circuit depth L=2 is already at minimum"
                        : `Deploy repair arm '${arm.name}'`
                    }
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isDeploying ? "Deploying..." : "Deploy"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
