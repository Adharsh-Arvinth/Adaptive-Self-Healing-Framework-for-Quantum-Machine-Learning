"use client";

import React, { useState } from "react";
import {
  Wrench,
  Shield,
  Layers,
  RefreshCw,
  Zap,
  Sliders,
  Cpu,
  GitBranch,
  Play,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
  number: string;
  name: string;
  desc: string;
  icon: React.ElementType;
  domain: string;
  targetParameter: string;
  safetyRule: string;
  getParamPreview: (opt: string, feat: string, depth: number) => string;
}

const LOCKED_ARMS: ArmSpec[] = [
  {
    id: "change_optimizer",
    number: "ARM 01",
    name: "Change Optimizer",
    desc: "Cycles classical optimizer state (Adam ↔ RMSprop ↔ SGD) and purges momentum buffers.",
    icon: Sliders,
    domain: "Classical Optimization",
    targetParameter: "Optimizer State",
    safetyRule: "Anti-oscillation (W_osc=4) prevents rapid cyclic optimizer switching.",
    getParamPreview: (opt) => `Active: ${opt.toUpperCase()}`,
  },
  {
    id: "reduce_circuit_depth",
    number: "ARM 02",
    name: "Reduce Circuit Depth",
    desc: "Truncates variational ansatz layers (L → L - 1) to relieve barren plateau gradient vanishing.",
    icon: Layers,
    domain: "Ansatz Architecture",
    targetParameter: "Circuit Depth L",
    safetyRule: "Minimum depth bound L_min = 2 preserves expressibility.",
    getParamPreview: (_, __, depth) => `Capacity: L = ${depth}`,
  },
  {
    id: "modify_feature_map",
    number: "ARM 03",
    name: "Modify Feature Map",
    desc: "Toggles data embedding between Angle encoding and IQP Hilbert space embedding.",
    icon: GitBranch,
    domain: "Quantum Embedding",
    targetParameter: "Kernel Map U_Φ(x)",
    safetyRule: "Feature map alteration requires 4-step stabilization window.",
    getParamPreview: (_, feat) => `Map: ${feat.toUpperCase()}`,
  },
  {
    id: "adjust_learning_rate",
    number: "ARM 04",
    name: "Adjust Learning Rate",
    desc: "Scales gradient descent step size η (0.5× reduction or 1.5× acceleration) within safe bounds.",
    icon: Zap,
    domain: "Optimization Step",
    targetParameter: "Learning Rate η",
    safetyRule: "Strict clamping within operational envelope [1e-4, 1.0].",
    getParamPreview: () => "Adaptive Factor: 0.5× / 1.5×",
  },
  {
    id: "apply_noise_mitigation",
    number: "ARM 05",
    name: "Noise Mitigation",
    desc: "Applies analytical inverse-noise contraction correction across the single-qubit Bloch state.",
    icon: Cpu,
    domain: "Simulation Mitigation",
    targetParameter: "Bloch Radius ||r||",
    safetyRule: "Simulation-side analytical correction; non-destructive.",
    getParamPreview: () => "Inverse Contraction Mode",
  },
  {
    id: "perform_warm_restart",
    number: "ARM 06",
    name: "Warm Restart",
    desc: "Perturbs parameter coordinates (Gaussian σ=0.05) or resets near identity to escape saddle points.",
    icon: RefreshCw,
    domain: "Parameter Space",
    targetParameter: "Variational Weights θ",
    safetyRule: "Perturbation bounded to prevent catastrophic unlearning.",
    getParamPreview: () => "Stochastic Jitter σ = 0.05",
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
    <div className="glass-panel p-5 font-sans">
      {/* Symmetrical Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--content-primary)]">
              Six-Arm Adaptive Repair Matrix
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--content-secondary)] border border-[var(--border-subtle)]">
              Contextual Thompson Sampling
            </span>
          </div>
          <p className="text-xs text-[var(--content-secondary)] mt-0.5">
            Autonomous closed-loop repair actuators evaluated by Thompson Sampling and validated by safety filters
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--content-secondary)]">
          <Shield className="w-3.5 h-3.5 text-[var(--status-success)]" />
          <span>Safety Filter Active (W_osc = 4)</span>
        </div>
      </div>

      {/* Structured Matrix Grid: 6 Distinct Scientific Actuator Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {LOCKED_ARMS.map((arm) => {
          const isSelected = selectedArm === arm.id;
          const isEligible = eligibleArms.includes(arm.id);
          const isDeploying = deployingArm === arm.id;
          const isDepthConstrained = arm.id === "reduce_circuit_depth" && currentDepth <= 2;
          const Icon = arm.icon;

          return (
            <div
              key={arm.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? "bg-[var(--accent-subtle)] border-[var(--accent)] shadow-sm"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)]"
              }`}
            >
              <div>
                {/* Header: Arm Number, Domain, and Status Badge */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-primary)] shrink-0">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-[var(--content-tertiary)] block">
                        {arm.number}
                      </span>
                      <span className="text-xs font-semibold text-[var(--content-primary)] block leading-tight">
                        {arm.name}
                      </span>
                    </div>
                  </div>

                  {/* Operational Status Pill */}
                  {isSelected ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--accent)] text-white">
                      SELECTED
                    </span>
                  ) : isDepthConstrained ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--bg-subtle)] text-[var(--content-tertiary)] border border-[var(--border-subtle)]">
                      MIN L=2
                    </span>
                  ) : isEligible ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--status-success-subtle)] text-[var(--status-success)] border border-[var(--status-success)]/30">
                      ELIGIBLE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--content-tertiary)] bg-[var(--bg-subtle)]">
                      STANDBY
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--content-secondary)] leading-relaxed mt-2 min-h-[36px]">
                  {arm.desc}
                </p>

                {/* Safety Rule Note */}
                <div className="mt-2 text-[11px] text-[var(--content-tertiary)] font-mono leading-tight">
                  Constraint: {arm.safetyRule}
                </div>
              </div>

              {/* Bottom Control Strip */}
              <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-[11px] font-mono text-[var(--content-secondary)]">
                  {arm.getParamPreview(currentOptimizer, currentFeatureMap, currentDepth)}
                </span>

                {onTriggerRepair && (
                  <button
                    onClick={() => handleDeploy(arm.id)}
                    disabled={isDeploying || isSelected || isDepthConstrained}
                    className={`apple-btn px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                      isSelected
                        ? "bg-[var(--accent-subtle)] text-[var(--accent)] cursor-default"
                        : isDepthConstrained
                        ? "opacity-50 cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--content-tertiary)] border border-[var(--border-subtle)]"
                        : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white active:scale-95"
                    }`}
                    title={
                      isDepthConstrained
                        ? "Safety constraint: Circuit depth L=2 is at minimum limit"
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
