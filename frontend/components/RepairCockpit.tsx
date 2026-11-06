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
  ChevronDown,
  ChevronUp,
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
  oneLiner: string;
  mechanism: string;
  transformation: string;
  icon: React.ElementType;
  targetParameter: string;
  safetyRule: string;
  boundConstraint: string;
}

const LOCKED_ARMS: ArmSpec[] = [
  {
    id: "change_optimizer",
    number: "ARM 01",
    name: "Change Optimizer",
    domain: "Classical Optimization",
    domainColor: "border-blue-500/30 text-blue-400 bg-blue-500/10",
    oneLiner: "Cycles classical optimizer (Adam ↔ RMSprop ↔ SGD) and purges corrupted momentum buffers.",
    mechanism: "Adam ↔ RMSprop ↔ SGD cycling with momentum vector zeroing m_t = 0, v_t = 0.",
    transformation: "θ_{t+1} = θ_t - η · [α·m_t / (√v_t + ε)] → clean classical descent",
    icon: Sliders,
    targetParameter: "Optimizer Momentum Buffer",
    safetyRule: "Anti-oscillation guard (W_osc = 4) blocks rapid cyclic toggles within 4 consecutive steps.",
    boundConstraint: "Cooldown: K ≥ 4 steps before re-selecting same optimizer",
  },
  {
    id: "reduce_circuit_depth",
    number: "ARM 02",
    name: "Reduce Circuit Depth",
    domain: "Hilbert Expressibility",
    domainColor: "border-amber-500/30 text-amber-400 bg-amber-500/10",
    oneLiner: "Truncates variational ansatz layers (L → L - 1) to relieve barren plateau gradient vanishing.",
    mechanism: "Decrements ansatz layer count and truncates parameters θ_L. Parameter tensor dimension drops by 2 per qubit.",
    transformation: "U(θ) = ∏_{l=1}^{L-1} W_l(θ_l) V_l(x) — truncates layer L",
    icon: Layers,
    targetParameter: "Ansatz Depth Capacity L",
    safetyRule: "Hard boundary constraint: ansatz depth cannot be reduced below minimum limit L_min = 2.",
    boundConstraint: "Boundary Clamp: L ≥ 2 (preserves 2-qubit entanglement expressibility)",
  },
  {
    id: "modify_feature_map",
    number: "ARM 03",
    name: "Modify Feature Map",
    domain: "Quantum Embedding",
    domainColor: "border-sky-500/30 text-sky-400 bg-sky-500/10",
    oneLiner: "Toggles classical data embedding between separable Angle encoding and entangling IQP Hilbert space.",
    mechanism: "Mutates quantum data encoding unitary U_Φ(x) between separable rotations and non-linear entangling Ising gates.",
    transformation: "Angle: ⊗_j R_y(x_j)|0⟩  ⟷  IQP: exp(i ∑_{j,k} x_j x_k Z_j Z_k) ⊗_j H|0⟩",
    icon: GitBranch,
    targetParameter: "Quantum Kernel Map U_Φ(x)",
    safetyRule: "Post-mutation stabilization window (4 steps) enforced before subsequent structural changes.",
    boundConstraint: "Stabilization: 4-step cooloff window following Hilbert kernel change",
  },
  {
    id: "adjust_learning_rate",
    number: "ARM 04",
    name: "Adjust Learning Rate",
    domain: "Descent Dynamics",
    domainColor: "border-emerald-500/30 text-emerald-400 bg-emerald-500/10",
    oneLiner: "Scales step size η (0.5× reduction or 1.5× acceleration) within safe operational boundaries.",
    mechanism: "Multiplicatively scales descent step size η to recover from steep gradient divergence or flat plateau stalling.",
    transformation: "η_{t+1} = clip(η_t · factor, 1e-4, 1.0)  where factor ∈ {0.5, 1.5}",
    icon: Zap,
    targetParameter: "Gradient Step Size η",
    safetyRule: "Clamped within certified operational envelope [1e-4, 1.0] to prevent numerical instability.",
    boundConstraint: "Clamp Interval: η ∈ [1.0e-4, 1.0]",
  },
  {
    id: "noise_mitigation",
    number: "ARM 05",
    name: "Apply Noise Mitigation",
    domain: "Bloch State Correction",
    domainColor: "border-purple-500/30 text-purple-400 bg-purple-500/10",
    oneLiner: "Applies simulation-side inverse-noise contraction correction across single-qubit Bloch state.",
    mechanism: "Evaluates single-qubit density matrix coordinates and inverts radial shrinkage r → r / (1 - p_noise).",
    transformation: "r_mitigated = min(1.0, r / (1 - p_noise))  ⟹  Tr(ρ²) → 1.0",
    icon: Cpu,
    targetParameter: "Density Matrix Purity γ = Tr(ρ²)",
    safetyRule: "Simulation-side analytical correction on CPU statevector; non-destructive to parameter weights.",
    boundConstraint: "State Space: Clamped to Bloch sphere surface (r ≤ 1.0)",
  },
  {
    id: "warm_restart",
    number: "ARM 06",
    name: "Warm Restart",
    domain: "Trajectory Escape",
    domainColor: "border-rose-500/30 text-rose-400 bg-rose-500/10",
    oneLiner: "Adds bounded stochastic Gaussian jitter (σ = 0.05) to parameters to escape saddle points.",
    mechanism: "Perturbs parameter tensor coordinates θ with bounded isotropic Gaussian noise to kick weights off flat saddles.",
    transformation: "θ_{t+1} = θ_t + ε  where  ε ~ 𝒩(0, σ² I),  σ = 0.05",
    icon: RotateCcw,
    targetParameter: "Parameter Coordinates θ",
    safetyRule: "Strictly bounded jitter variance to prevent catastrophic unlearning of previously captured features.",
    boundConstraint: "Noise Envelope: σ = 0.05 Gaussian jitter, clamped [-π, π]",
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
  const [inspectedArmId, setInspectedArmId] = useState<string | null>(null);

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

  const activeArm = LOCKED_ARMS.find((a) => a.id === inspectedArmId);

  return (
    <div className="glass-panel p-4 sm:p-6 font-sans space-y-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
      {/* Cockpit Header */}
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

      {/* Six Actuator Cards: Simplified, high-clarity layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {LOCKED_ARMS.map((arm) => {
          const isSelected = selectedArm === arm.id;
          const isEligible = eligibleArms.includes(arm.id);
          const isDeploying = deployingArm === arm.id;
          const isSimulating = simulatingArm === arm.id;
          const isDepthConstrained = arm.id === "reduce_circuit_depth" && currentDepth <= 2;
          const isDeployedNow = deployment?.repair_arm === arm.id && isValidating;

          const isDeployDisabled =
            isDeploying ||
            isDeployedNow ||
            isDepthConstrained ||
            (eligibleArms.length > 0 && !isEligible);

          const Icon = arm.icon;
          const isInspected = inspectedArmId === arm.id;

          return (
            <div
              key={arm.id}
              className={`interactive-card group p-4 sm:p-5 rounded-2xl border flex flex-col justify-between select-none relative ${
                isDeployedNow
                  ? "bg-amber-500/10 border-amber-500 shadow-[0_0_24px_rgba(245,158,11,0.2)]"
                  : isSelected
                  ? "bg-[var(--accent-subtle)] border-[var(--accent)] shadow-[0_0_24px_rgba(56,189,248,0.2)]"
                  : isInspected
                  ? "bg-[var(--bg-surface)] border-[var(--accent)]/60 ring-1 ring-[var(--accent)]/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                  : "bg-[var(--bg-surface)] border-[var(--border-subtle)]"
              }`}
            >
              <div className="space-y-2.5">
                {/* Header: Name, Number & Eligibility Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="card-icon w-8 h-8 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-primary)] shrink-0 shadow-sm">
                      <Icon className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
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

                {/* One-Line Plain Explanation (Radically Simplified) */}
                <p className="text-xs text-[var(--content-secondary)] leading-relaxed">
                  {arm.oneLiner}
                </p>
              </div>

              {/* Bottom Actions: Deploy Button & Expandable Inspector Toggle */}
              <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setInspectedArmId(isInspected ? null : arm.id)}
                  className="text-[11px] font-mono text-[var(--content-tertiary)] hover:text-[var(--accent)] flex items-center gap-1 transition-colors"
                >
                  <span>{isInspected ? "Hide details" : "Inspect"}</span>
                  {isInspected ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                <div className="flex items-center gap-1.5">
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

      {/* Expandable Technical Deep-Dive Inspector (Only shown when user requests) */}
      {activeArm && (
        <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] space-y-3 font-mono text-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[var(--accent)]" />
              <span className="font-semibold text-[var(--content-primary)]">
                TECHNICAL ACTUATOR SPECIFICATION: {activeArm.name.toUpperCase()} ({activeArm.number})
              </span>
            </div>
            <button
              onClick={() => setInspectedArmId(null)}
              className="text-[11px] text-[var(--content-tertiary)] hover:text-[var(--content-primary)]"
            >
              Close
            </button>
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
      )}
    </div>
  );
};
