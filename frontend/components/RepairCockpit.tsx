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
  subInfo: (opt: string, feat: string, depth: number) => string;
}

const LOCKED_ARMS: ArmSpec[] = [
  {
    id: "change_optimizer",
    name: "Change Optimizer",
    desc: "Cycle Adam / RMSprop / SGD and reset momentum state",
    icon: Sliders,
    category: "Classical",
    subInfo: (opt) => `Current: ${opt.toUpperCase()}`,
  },
  {
    id: "reduce_circuit_depth",
    name: "Reduce Depth",
    desc: "Truncate ansatz layers L -> L - 1 to relieve barren plateaus",
    icon: Layers,
    category: "Ansatz",
    subInfo: (_, __, depth) => `Layers: L = ${depth}`,
  },
  {
    id: "modify_feature_map",
    name: "Modify Feature Map",
    desc: "Toggle Angle <-> IQP Hilbert space embedding",
    icon: GitBranch,
    category: "Embedding",
    subInfo: (_, feat) => `Map: ${feat}`,
  },
  {
    id: "adjust_learning_rate",
    name: "Adjust Learning Rate",
    desc: "Dynamic scaling of eta within safe bounds [1e-4, 1.0]",
    icon: Zap,
    category: "Rate",
    subInfo: () => "Scale: 0.5x or 1.5x",
  },
  {
    id: "apply_noise_mitigation",
    name: "Noise Mitigation",
    desc: "Analytical inverse-noise correction over radial contraction",
    icon: Cpu,
    category: "Mitigation",
    subInfo: () => "Inverse Contraction",
  },
  {
    id: "perform_warm_restart",
    name: "Warm Restart",
    desc: "Perturb parameters (sigma=0.05) or reset near-identity",
    icon: RefreshCw,
    category: "Restart",
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
    <div className="glass-panel p-5 flex flex-col justify-between">
      {/* Cockpit Header */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Six-Arm Adaptive Repair Cockpit
            </h2>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-panel-subtle text-[11px] font-mono text-[var(--content-secondary)]">
            <Shield className="w-3 h-3 text-cyan-400" />
            <span>Safety Filter Active</span>
          </div>
        </div>

        {/* Grid of the 6 Locked Repair Arms */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {LOCKED_ARMS.map((arm, index) => {
            const isSelected = selectedArm === arm.id;
            const isEligible = eligibleArms.includes(arm.id);
            const isDeploying = deployingArm === arm.id;
            const Icon = arm.icon;

            return (
              <div
                key={arm.id}
                className={`p-3 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? "bg-purple-500/10 border-purple-500/40 shadow-glow"
                    : isEligible
                    ? "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-purple-500/30"
                    : "bg-[var(--bg-surface)]/50 border-[var(--border-subtle)] opacity-70"
                }`}
              >
                <div>
                  {/* Top Bar: Icon, Name & Status Pill */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-purple-500 text-white"
                            : "bg-[var(--bg-primary)] text-[var(--content-secondary)] border border-[var(--border-subtle)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[var(--content-primary)] leading-tight">
                          {arm.name}
                        </div>
                        <span className="text-[10px] text-[var(--content-secondary)] font-mono">
                          Arm #{index + 1} • {arm.category}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isSelected ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 shrink-0">
                        ACTIVE
                      </span>
                    ) : isEligible ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                        ELIGIBLE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-500/10 text-[var(--content-secondary)] border border-[var(--border-subtle)] shrink-0">
                        FILTERED
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed mb-2.5">
                    {arm.desc}
                  </p>
                </div>

                {/* Bottom Row: Dynamic State Info & Deploy Button */}
                <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] font-mono">
                  <span className="text-[var(--content-secondary)]">
                    {arm.subInfo(currentOptimizer, currentFeatureMap, currentDepth)}
                  </span>

                  {onTriggerRepair && (
                    <button
                      onClick={() => handleDeploy(arm.id)}
                      disabled={isDeploying || isSelected}
                      className={`px-2 py-1 rounded-md text-[10px] font-sans font-medium flex items-center gap-1 transition-all ${
                        isSelected
                          ? "bg-purple-500/20 text-purple-300 cursor-default"
                          : isEligible
                          ? "apple-btn bg-purple-600 hover:bg-purple-500 text-white"
                          : "apple-btn bg-[var(--bg-primary)] hover:bg-neutral-800 text-[var(--content-secondary)] border border-[var(--border-subtle)]"
                      }`}
                      title={
                        isEligible
                          ? "Deploy this repair to the pipeline"
                          : "Test deploying this arm through safety validation"
                      }
                    >
                      <Play className="w-2.5 h-2.5" />
                      <span>{isDeploying ? "Deploying..." : "Deploy"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
