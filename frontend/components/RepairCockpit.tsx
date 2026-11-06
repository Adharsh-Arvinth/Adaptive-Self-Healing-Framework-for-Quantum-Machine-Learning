"use client";

import React, { useState } from "react";
import {
  Shield,
  Layers,
  RefreshCw,
  Zap,
  Sliders,
  Cpu,
  GitBranch,
  Play,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  Activity,
  ArrowRight,
  Lock,
} from "lucide-react";
import { DeploymentRecord } from "@/types";

interface RepairCockpitProps {
  selectedArm: string | null;
  eligibleArms: string[];
  currentOptimizer: string;
  currentFeatureMap: string;
  currentDepth: number;
  onTriggerRepair?: (armId: string) => Promise<void> | void;
  onSimulateTwin?: (armId: string) => Promise<any>;
  deployment?: DeploymentRecord | null;
  pipelineState?: string;
  onCommit?: () => Promise<void> | void;
  onRollback?: () => Promise<void> | void;
}

interface ArmSpec {
  id: string;
  number: string;
  name: string;
  domain: string;
  domainColor: string;
  tagColor: string;
  desc: string;
  mechanism: string;
  transformation: string;
  icon: React.ElementType;
  targetParameter: string;
  safetyRule: string;
  boundConstraint: string;
  getParamPreview: (opt: string, feat: string, depth: number) => string;
}

const LOCKED_ARMS: ArmSpec[] = [
  {
    id: "change_optimizer",
    number: "ARM 01",
    name: "Change Optimizer",
    domain: "Classical Optimization",
    domainColor: "border-blue-500/30 text-blue-500 bg-blue-500/10",
    tagColor: "text-blue-500",
    desc: "Cycles classical gradient optimizer state and purges momentum buffers to escape corrupted trajectory manifolds.",
    mechanism: "Adam ↔ RMSprop ↔ SGD cycling with momentum vector zeroing m_t = 0, v_t = 0.",
    transformation: "θ_{t+1} = θ_t - η · [α·m_t / (√v_t + ε)] → clean classical descent",
    icon: Sliders,
    targetParameter: "Optimizer Momentum Buffer",
    safetyRule: "Anti-oscillation guard (W_osc = 4) blocks rapid cyclic toggles within 4 consecutive steps.",
    boundConstraint: "Cooldown: K ≥ 4 steps before re-selecting same optimizer",
    getParamPreview: (opt) => `Active: ${opt.toUpperCase()} (Buffers Clean)`,
  },
  {
    id: "reduce_circuit_depth",
    number: "ARM 02",
    name: "Reduce Circuit Depth",
    domain: "Hilbert Expressibility",
    domainColor: "border-amber-500/30 text-amber-500 bg-amber-500/10",
    tagColor: "text-amber-500",
    desc: "Truncates variational ansatz layers (L → L - 1) to restore gradient variance across Haar-measure barren plateaus.",
    mechanism: "Decrements ansatz layer count and truncates parameters θ_L. Parameter tensor dimension drops by 2 per qubit.",
    transformation: "U(θ) = ∏_{l=1}^{L-1} W_l(θ_l) V_l(x) — truncates layer L",
    icon: Layers,
    targetParameter: "Ansatz Depth Capacity L",
    safetyRule: "Hard boundary constraint: ansatz depth cannot be reduced below minimum limit L_min = 2.",
    boundConstraint: "Boundary Clamp: L ≥ 2 (preserves 2-qubit entanglement expressibility)",
    getParamPreview: (_, __, depth) => `Capacity: L = ${depth} Layers (Min L = 2)`,
  },
  {
    id: "modify_feature_map",
    number: "ARM 03",
    name: "Modify Feature Map",
    domain: "Quantum Embedding",
    domainColor: "border-sky-500/30 text-sky-500 bg-sky-500/10",
    tagColor: "text-sky-500",
    desc: "Toggles classical data encoding between separable Angle encoding and non-linear entangling IQP Hilbert space kernels.",
    mechanism: "Switches unitary data generator U_Φ(x) between independent R_y(x_i) and entangling ZZ(x_i · x_j) kernels.",
    transformation: "Angle: ⨂ R_y(arctan(x_i)) ↔ IQP: exp(i ∑ x_i Z_i + i ∑ x_i x_j Z_i Z_j)",
    icon: GitBranch,
    targetParameter: "Kernel Map Generator U_Φ(x)",
    safetyRule: "Feature map alteration enforces a 4-step stabilization observation window before secondary mutation.",
    boundConstraint: "Cooldown: K ≥ 4 steps; preserves input coordinate space",
    getParamPreview: (_, feat) => `Map: ${feat.toUpperCase()} Kernel`,
  },
  {
    id: "adjust_learning_rate",
    number: "ARM 04",
    name: "Adjust Learning Rate",
    domain: "Optimization Step Envelope",
    domainColor: "border-emerald-500/30 text-emerald-500 bg-emerald-500/10",
    tagColor: "text-emerald-500",
    desc: "Dynamically scales gradient descent step size η by factor α to restore loss convergence and prevent trajectory divergence.",
    mechanism: "Scales η ← η · α (α ∈ {0.5, 1.5}) based on parameter displacement velocity and loss oscillation profile.",
    transformation: "η_{t+1} = clip(η_t · α, η_min, η_max) where [η_min, η_max] = [10⁻⁴, 1.0]",
    icon: Zap,
    targetParameter: "Learning Rate η",
    safetyRule: "Strict clamping within operational envelope [10⁻⁴, 1.0] to prevent numerical underflow and explosive updates.",
    boundConstraint: "Operational Bounds: η ∈ [1.0e-4, 1.0]",
    getParamPreview: () => "Adaptive Factor: 0.5× / 1.5× Envelope Clamped",
  },
  {
    id: "apply_noise_mitigation",
    number: "ARM 05",
    name: "Apply Noise Mitigation",
    domain: "Simulation State Correction",
    domainColor: "border-indigo-500/30 text-indigo-500 bg-indigo-500/10",
    tagColor: "text-indigo-500",
    desc: "Applies analytical inverse-noise contraction across the single-qubit Bloch state to correct depolarizing decoherence.",
    mechanism: "Multiplies noisy expectation estimates by radial contraction factor r_phys⁻¹ under single-qubit depolarizing model.",
    transformation: "⟨Z⟩_mit = ⟨Z⟩_noisy / ||r_phys||₂ (Corrected expectation estimator)",
    icon: Cpu,
    targetParameter: "Expectation Estimator ⟨Z⟩",
    safetyRule: "Simulation-side analytical expectation rescaling; purely observational and non-destructive to statevector.",
    boundConstraint: "Radial Correction: r_phys ≥ 0.50 (No-op if mitigation already active)",
    getParamPreview: () => "Analytical Richardson Contraction Rescaling",
  },
  {
    id: "perform_warm_restart",
    number: "ARM 06",
    name: "Perform Warm Restart",
    domain: "Stochastic Manifold Perturbation",
    domainColor: "border-purple-500/30 text-purple-500 bg-purple-500/10",
    tagColor: "text-purple-500",
    desc: "Perturbs variational parameter coordinates with localized Gaussian jitter to escape high-loss saddle points.",
    mechanism: "Injects stochastic perturbation θ ← θ + N(0, σ²I) with σ = 0.05 and resets classical optimizer momentum to zero.",
    transformation: "θ_{new} = clip(θ + N(0, 0.05² · I), -π, π)",
    icon: RefreshCw,
    targetParameter: "Variational Weights θ",
    safetyRule: "Perturbation magnitude σ=0.05 is bounded to preserve learned representation topology and prevent unlearning.",
    boundConstraint: "Boundary Clamp: θ ∈ [-π, π], σ = 0.05",
    getParamPreview: () => "Stochastic Jitter: σ = 0.05 (Clamped [-π, π])",
  },
];

export const RepairCockpit: React.FC<RepairCockpitProps> = ({
  selectedArm,
  eligibleArms = [],
  currentOptimizer,
  currentFeatureMap,
  currentDepth,
  onTriggerRepair,
  onSimulateTwin,
  deployment,
  pipelineState,
  onCommit,
  onRollback,
}) => {
  const [deployingArm, setDeployingArm] = useState<string | null>(null);
  const [simulatingArm, setSimulatingArm] = useState<string | null>(null);
  const [inspectedArmId, setInspectedArmId] = useState<string | null>("change_optimizer");

  const isValidating =
    deployment?.status === "VALIDATING" ||
    pipelineState === "VALIDATING_REPAIR" ||
    pipelineState === "DEPLOYED";

  const handleDeploy = async (armId: string) => {
    if (!onTriggerRepair || deployingArm) return;
    if (armId === "reduce_circuit_depth" && currentDepth <= 2) return;
    if (eligibleArms.length > 0 && !eligibleArms.includes(armId)) return;

    setDeployingArm(armId);
    try {
      await onTriggerRepair(armId);
    } catch (err) {
      console.error("Deploy error in RepairCockpit:", err);
    } finally {
      setDeployingArm(null);
    }
  };

  const handleSimulate = async (armId: string) => {
    if (!onSimulateTwin || simulatingArm) return;
    setSimulatingArm(armId);
    try {
      await onSimulateTwin(armId);
    } catch (err) {
      console.error("Simulate error in RepairCockpit:", err);
    } finally {
      setSimulatingArm(null);
    }
  };

  const activeArm = LOCKED_ARMS.find((a) => a.id === inspectedArmId) || LOCKED_ARMS[0];

  return (
    <div className="glass-panel p-4 sm:p-6 font-sans space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {/* Symmetrical Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        <div>
          <div className="flex items-center flex-wrap gap-2">
            <h3 className="text-sm sm:text-base font-semibold text-[var(--content-primary)] tracking-tight">
              Six-Arm Adaptive Repair Matrix
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/30 font-semibold">
              Contextual Thompson Sampling
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--content-secondary)] border border-[var(--border-subtle)]">
              Digital Twin H=3
            </span>
          </div>
          <p className="text-xs text-[var(--content-secondary)] mt-1 leading-relaxed">
            Autonomous closed-loop actuators evaluated via Bayesian linear regression posteriors, pre-screened in twin simulation, and gated by safety filters.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--status-success-subtle)] text-[var(--status-success)] border border-[var(--status-success)]/20 font-medium">
            <Shield className="w-3.5 h-3.5" />
            <span>Safety Filter Active (W_osc = 4)</span>
          </div>
        </div>
      </div>

      {/* Live Transaction Status Bar if an arm is deployed/validating */}
      {isValidating && deployment && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold text-[var(--content-primary)]">
              ACTIVE DEPLOYMENT: {deployment.repair_arm ? deployment.repair_arm.replace(/_/g, " ").toUpperCase() : "MUTATION"}
            </span>
            <span className="text-[var(--content-tertiary)]">•</span>
            <span className="text-amber-500 font-medium">Validating Window W_val = 3</span>
            <span className="text-[var(--content-tertiary)]">•</span>
            <span className="text-[var(--content-secondary)]">
              Pre-Loss: {deployment.loss_pre ? deployment.loss_pre.toFixed(4) : "—"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onCommit && (
              <button
                onClick={onCommit}
                className="apple-btn px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--status-success)] text-white hover:opacity-90 active:scale-95"
              >
                Force Commit
              </button>
            )}
            {onRollback && (
              <button
                onClick={onRollback}
                className="apple-btn px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[var(--status-danger)] text-white hover:opacity-90 active:scale-95"
              >
                Force Rollback
              </button>
            )}
          </div>
        </div>
      )}

      {/* Six Actuator Cards: 1 col on mobile, 2 col on tablet, 3 col on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {LOCKED_ARMS.map((arm) => {
          const isSelected = selectedArm === arm.id;
          const isEligible = eligibleArms.includes(arm.id);
          const isDeploying = deployingArm === arm.id;
          const isSimulating = simulatingArm === arm.id;
          const isDepthConstrained = arm.id === "reduce_circuit_depth" && currentDepth <= 2;
          const isInspected = inspectedArmId === arm.id;
          const isDeployedNow = deployment?.repair_arm === arm.id && isValidating;

          // An arm cannot be deployed if: currently deploying, already deployed, depth constrained, or ineligible when eligibility set is active
          const isDeployDisabled =
            isDeploying ||
            isDeployedNow ||
            isDepthConstrained ||
            (eligibleArms.length > 0 && !isEligible);

          const Icon = arm.icon;

          return (
            <div
              key={arm.id}
              onClick={() => setInspectedArmId(arm.id)}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between cursor-pointer select-none relative ${
                isDeployedNow
                  ? "bg-amber-500/10 border-amber-500 shadow-sm"
                  : isSelected
                  ? "bg-[var(--accent-subtle)] border-[var(--accent)] shadow-sm"
                  : isInspected
                  ? "bg-[var(--bg-surface)] border-[var(--border-highlight)] ring-1 ring-[var(--accent)]/30"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)]"
              }`}
            >
              <div>
                {/* Header: Arm Number, Domain, and Operational Status Pill */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-primary)] shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono text-[var(--content-tertiary)] block">
                        {arm.number}
                      </span>
                      <h4 className="text-xs sm:text-sm font-semibold text-[var(--content-primary)] truncate block leading-tight">
                        {arm.name}
                      </h4>
                    </div>
                  </div>

                  {/* Status Pill */}
                  <div className="shrink-0">
                    {isDeployedNow ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500 text-white animate-pulse">
                        VALIDATING
                      </span>
                    ) : isSelected ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--accent)] text-white">
                        SELECTED
                      </span>
                    ) : isDepthConstrained ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[var(--bg-subtle)] text-[var(--content-tertiary)] border border-[var(--border-subtle)]" title="Circuit depth L=2 is at absolute minimum">
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
                </div>

                {/* Domain Pill */}
                <div className="mb-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${arm.domainColor} inline-block`}>
                    {arm.domain}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-[var(--content-secondary)] leading-relaxed min-h-[38px]">
                  {arm.desc}
                </p>

                {/* Safety Rule Note */}
                <div className="mt-2.5 p-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--content-tertiary)] font-mono leading-tight">
                  <span className="font-semibold text-[var(--content-secondary)]">Guard:</span> {arm.safetyRule}
                </div>
              </div>

              {/* Bottom Control Strip */}
              <div className="pt-3.5 mt-3.5 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-mono text-[var(--content-secondary)] truncate">
                  {arm.getParamPreview(currentOptimizer, currentFeatureMap, currentDepth)}
                </span>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  {onSimulateTwin && (
                    <button
                      type="button"
                      onClick={() => handleSimulate(arm.id)}
                      disabled={isSimulating || isDepthConstrained}
                      className="apple-btn px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--border-subtle)] disabled:opacity-40 transition-all active:scale-95"
                      title={`Simulate candidate repair '${arm.name}' in H=3 lookahead sandbox`}
                    >
                      <span>{isSimulating ? "Simulating..." : "Twin H=3"}</span>
                    </button>
                  )}

                  {onTriggerRepair && (
                    <button
                      type="button"
                      onClick={() => handleDeploy(arm.id)}
                      disabled={isDeployDisabled}
                      aria-disabled={isDeployDisabled}
                      className={`apple-btn px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                        isDeployedNow
                          ? "bg-amber-500 text-white cursor-default"
                          : isDeployDisabled
                          ? "opacity-40 cursor-not-allowed bg-[var(--bg-subtle)] text-[var(--content-tertiary)] border border-[var(--border-subtle)]"
                          : "bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white active:scale-95"
                      }`}
                      title={
                        isDepthConstrained
                          ? "Safety constraint: Circuit depth L=2 is at minimum limit"
                          : isDeployDisabled
                          ? `Repair arm '${arm.name}' is currently standby or ineligible`
                          : `Deploy repair arm '${arm.name}' into validation window W_val=3`
                      }
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isDeploying ? "Deploying..." : "Deploy"}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Arm Deep-Dive Telemetry Inspector */}
      <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[var(--accent)]" />
            <span className="font-semibold text-[var(--content-primary)]">
              ACTUATOR MATHEMATICAL INSPECTION: {activeArm.name.toUpperCase()} ({activeArm.number})
            </span>
          </div>
          <span className="text-[11px] text-[var(--content-tertiary)]">
            Target: {activeArm.targetParameter}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px]">
          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--content-tertiary)] block">PHYSICAL TRANSFORMATION</span>
            <span className="text-[var(--content-primary)] font-semibold block">{activeArm.mechanism}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--content-tertiary)] block">OPERATOR EQUATION</span>
            <span className="text-[var(--accent)] font-semibold block">{activeArm.transformation}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1">
            <span className="text-[10px] text-[var(--content-tertiary)] block">SAFETY CLAMP CONSTRAINT</span>
            <span className="text-amber-500 font-semibold block">{activeArm.boundConstraint}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
