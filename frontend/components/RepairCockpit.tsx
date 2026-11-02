"use client";

import React from "react";
import { Wrench, Shield, Layers, RefreshCw, Zap, Sliders, Cpu, GitBranch } from "lucide-react";

interface RepairCockpitProps {
  selectedArm: string | null;
  eligibleArms: string[];
  currentOptimizer: string;
  currentFeatureMap: string;
  currentDepth: number;
}

interface ArmSpec {
  id: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  category: string;
}

const LOCKED_ARMS: ArmSpec[] = [
  {
    id: "change_optimizer",
    name: "Change Optimizer",
    desc: "Switch optimizer (Adam/RMS/SGD) & reset momentum buffers",
    icon: Sliders,
    category: "Classical",
  },
  {
    id: "reduce_circuit_depth",
    name: "Reduce Depth",
    desc: "Truncate L -> L - 1 to relieve barren plateau saturation",
    icon: Layers,
    category: "Quantum Ansatz",
  },
  {
    id: "modify_feature_map",
    name: "Modify Feature Map",
    desc: "Toggle Angle <-> IQP Hilbert space data embedding",
    icon: GitBranch,
    category: "Embedding",
  },
  {
    id: "adjust_learning_rate",
    name: "Adjust Learning Rate",
    desc: "Scale eta dynamically within [1e-4, 1.0]",
    icon: Zap,
    category: "Hyperparameter",
  },
  {
    id: "apply_noise_mitigation",
    name: "Noise Mitigation",
    desc: "Activate simulation-side ZNE & readout calibration",
    icon: Cpu,
    category: "Error Mitigation",
  },
  {
    id: "perform_warm_restart",
    name: "Warm Restart",
    desc: "Perturb parameters (sigma=0.05) or reset to near-identity",
    icon: RefreshCw,
    category: "Re-Initialization",
  },
];

export const RepairCockpit: React.FC<RepairCockpitProps> = ({
  selectedArm,
  eligibleArms,
  currentOptimizer,
  currentFeatureMap,
  currentDepth,
}) => {
  return (
    <div className="glass-panel p-5">
      {/* Cockpit Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-400" />
          <h2 className="text-xs font-semibold text-neutral-200">
            Six-Arm Adaptive Repair Cockpit
          </h2>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full glass-panel-subtle text-[11px] font-mono text-neutral-400">
          <Shield className="w-3 h-3 text-cyan-400" />
          <span>Safety Filter Verified</span>
        </div>
      </div>

      {/* Grid of the 6 Locked Repair Arms */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {LOCKED_ARMS.map((arm) => {
          const isSelected = selectedArm === arm.id;
          const isEligible = eligibleArms.includes(arm.id);
          const Icon = arm.icon;

          return (
            <div
              key={arm.id}
              className={`p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? "bg-purple-600/15 border-purple-500/50 shadow-glow"
                  : isEligible
                  ? "bg-white/[0.02] border-white/5 hover:border-white/15"
                  : "bg-white/[0.01] border-white/5 opacity-50"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-purple-500 text-white" : "bg-white/5 text-neutral-400"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-white flex items-center gap-1">
                        {arm.name}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-sm" />
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {arm.category}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      DEPLOYED
                    </span>
                  ) : isEligible ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      ELIGIBLE
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-800 text-neutral-400">
                      FILTERED
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
                  {arm.desc}
                </p>
              </div>

              {/* Dynamic Sub-State Info */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-400">
                {arm.id === "change_optimizer" && (
                  <span>Current: {currentOptimizer.toUpperCase()}</span>
                )}
                {arm.id === "reduce_circuit_depth" && (
                  <span>Current Depth: L = {currentDepth}</span>
                )}
                {arm.id === "modify_feature_map" && (
                  <span>Encoding: {currentFeatureMap}</span>
                )}
                {arm.id === "adjust_learning_rate" && (
                  <span>Bounds: [1e-4, 1.0]</span>
                )}
                {arm.id === "apply_noise_mitigation" && (
                  <span>Method: Richardson ZNE</span>
                )}
                {arm.id === "perform_warm_restart" && (
                  <span>Mode: Perturbation (σ=0.05)</span>
                )}
                <span className="text-neutral-400">Arm #{LOCKED_ARMS.indexOf(arm) + 1}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
