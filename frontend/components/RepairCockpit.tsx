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
      bg: "bg-[var(--status-info-subtle)]",
      text: "text-[var(--status-info)]",
      border: "border-[var(--status-info)]/20",
    },
    subInfo: (opt) => `Current: ${opt.toUpperCase()}`,
  },
  {
    id: "reduce_circuit_depth",
    name: "Reduce Depth",
    desc: "Truncate ansatz layers L → L - 1 to relieve barren plateaus",
    icon: Layers,
    category: "Ansatz",
    colorScheme: {
      bg: "bg-[var(--status-ansatz-subtle)]",
      text: "text-[var(--status-ansatz)]",
      border: "border-[var(--status-ansatz)]/20",
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
      bg: "bg-[var(--accent-subtle)]",
      text: "text-[var(--accent)]",
      border: "border-[var(--accent)]/20",
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
      bg: "bg-[var(--status-warning-subtle)]",
      text: "text-[var(--status-warning)]",
      border: "border-[var(--status-warning)]/20",
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
      bg: "bg-[var(--status-purity-subtle)]",
      text: "text-[var(--status-purity)]",
      border: "border-[var(--status-purity)]/20",
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
      bg: "bg-[var(--status-danger-subtle)]",
      text: "text-[var(--status-danger)]",
      border: "border-[var(--status-danger)]/20",
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
    <div className="glass-panel p-6">
      {/* Cockpit Symmetrical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-subtle)] flex items-center justify-center text-[var(--accent)] shrink-0">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-[var(--content-primary)]">
              Six-Arm Adaptive Repair Cockpit
            </h2>
            <p className="text-[11px] text-[var(--content-tertiary)]">
              Autonomous Contextual Thompson Sampling repair arms with safety validation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full glass-panel-subtle text-xs font-mono text-[var(--content-secondary)] self-start sm:self-auto">
          <Shield className="w-3.5 h-3.5 text-[var(--status-success)]" />
          <span>Safety Filter Active (W_osc=4)</span>
        </div>
      </div>

      {/* Symmetrical 6-Column Grid of Arms */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {LOCKED_ARMS.map((arm, index) => {
          const isSelected = selectedArm === arm.id;
          const isEligible = eligibleArms.includes(arm.id);
          const isDeploying = deployingArm === arm.id;
          const isMinDepth = arm.id === "reduce_circuit_depth" && currentDepth <= 2;
          const Icon = arm.icon;

          return (
            <div
              key={arm.id}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between h-[195px] ${
                isSelected
                  ? "bg-[var(--accent-subtle)] border-[var(--accent)]/40 shadow-sm"
                  : "glass-panel-subtle hover:border-[var(--border-highlight)]"
              }`}
            >
              <div>
                {/* Top Row: Icon Badge, Category & Status Tag */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${arm.colorScheme.bg} ${arm.colorScheme.text} ${arm.colorScheme.border}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Status Pill */}
                  {isSelected ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono font-semibold bg-[var(--status-ansatz-subtle)] text-[var(--status-ansatz)] border border-[var(--status-ansatz)]/30 shrink-0">
                      ACTIVE
                    </span>
                  ) : isMinDepth ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border border-[var(--status-warning)]/30 shrink-0">
                      MIN L=2
                    </span>
                  ) : isEligible ? (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-emerald-500/15 text-[var(--status-success)] border border-emerald-500/30 shrink-0">
                      ELIGIBLE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-neutral-500/10 text-[var(--content-tertiary)] border border-[var(--border-subtle)] shrink-0">
                      NOMINAL
                    </span>
                  )}
                </div>

                {/* Arm Name & Category */}
                <div className="text-xs font-semibold text-[var(--content-primary)] leading-tight truncate">
                  {arm.name}
                </div>
                <div className="text-[10px] text-[var(--content-tertiary)] font-mono mb-2">
                  Arm #{index + 1} • {arm.category}
                </div>

                {/* Description */}
                <p className="text-[10px] text-[var(--content-secondary)] leading-snug line-clamp-2 min-h-[28px]">
                  {arm.desc}
                </p>
              </div>

              {/* Bottom Row: State readout & Aligned Action Button */}
              <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono">
                <span className="text-[var(--content-tertiary)] truncate max-w-[85px]">
                  {arm.subInfo(currentOptimizer, currentFeatureMap, currentDepth)}
                </span>

                {onTriggerRepair && (
                  <button
                    onClick={() => handleDeploy(arm.id)}
                    disabled={isDeploying || isSelected || isMinDepth}
                    className={`apple-btn px-2.5 py-1 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-all shadow-sm ${
                      isSelected
                        ? "bg-[var(--status-ansatz-subtle)] text-[var(--status-ansatz)] cursor-default"
                        : isMinDepth
                        ? "opacity-40 cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--content-tertiary)] border border-[var(--border-subtle)]"
                        : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white active:scale-95"
                    }`}
                    title={
                      isMinDepth
                        ? "Safety filter constraint: Circuit depth L=2 is already at minimum allowable limit"
                        : `Deploy repair arm '${arm.name}'`
                    }
                  >
                    <Play className="w-2.5 h-2.5 fill-current" />
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
