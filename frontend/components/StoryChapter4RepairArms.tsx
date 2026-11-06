"use client";

import React, { useState } from "react";
import { Sliders, Layers, GitBranch, Zap, Cpu, RotateCcw, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

interface RepairArm {
  id: string;
  number: string;
  name: string;
  category: string;
  accentColor: string;
  badgeClass: string;
  icon: React.ElementType;
  whatItChanges: string;
  whyItIsUsed: string;
  constraints: string;
  recoveryRole: string;
  mathOperator: string;
}

const REPAIR_ARMS: RepairArm[] = [
  {
    id: "change_optimizer",
    number: "ARM 01",
    name: "Change Optimizer",
    category: "Classical Optimization",
    accentColor: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    icon: Sliders,
    whatItChanges: "Switches the classical gradient descent optimizer (Adam ↔ RMSprop ↔ SGD) and completely zeros out accumulated momentum buffers (m_t = 0, v_t = 0).",
    whyItIsUsed: "Corrupted second-moment momentum buffers often launch weights away from optimal minima along ill-conditioned loss ravines.",
    constraints: "Anti-oscillation guard enforces a 4-step cooldown window (W_osc = 4) before this arm can be re-triggered.",
    recoveryRole: "Purges corrupted historical trajectory memory and restores smooth classical descent dynamics.",
    mathOperator: "θ_{t+1} = θ_t - η · [α·m_t / (√v_t + ε)]  ⟹  Reset buffers m_t = 0, v_t = 0",
  },
  {
    id: "reduce_circuit_depth",
    number: "ARM 02",
    name: "Reduce Circuit Depth",
    category: "Hilbert Expressibility",
    accentColor: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
    icon: Layers,
    whatItChanges: "Truncates variational ansatz layers (L → L - 1) and removes parameter weights corresponding to the discarded layer.",
    whyItIsUsed: "Deep quantum circuits form Haar 2-designs where gradient variances vanish exponentially (barren plateaus). Shallowing the circuit restores non-zero gradient flow.",
    constraints: "Hard physical bound: Depth cannot be reduced below minimum limit L_min = 2 layers to preserve entanglement expressibility.",
    recoveryRole: "Restores measurable parameter-shift partial derivatives, enabling the classical optimizer to resume learning.",
    mathOperator: "U(θ) = ∏_{l=1}^{L-1} W_l(θ_l) V_l(x)  ⟹  Dim(θ) decrements by 2·N_qubits",
  },
  {
    id: "modify_feature_map",
    number: "ARM 03",
    name: "Modify Feature Map",
    category: "Quantum Embedding",
    accentColor: "border-sky-500/40 text-sky-400 bg-sky-500/10",
    badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
    icon: GitBranch,
    whatItChanges: "Toggles classical data embedding between separable Angle encoding and non-linear entangling IQP Hilbert space kernel embedding.",
    whyItIsUsed: "When decision boundaries cannot be separated in a simple rotation space, entangling feature maps map classical data into higher-dimensional non-linear Hilbert spaces.",
    constraints: "Feature map mutation requires a 4-step post-mutation stabilization window before subsequent structural modifications.",
    recoveryRole: "Transforms the underlying quantum geometry so non-linearly separable datasets become linearly separable.",
    mathOperator: "Angle: ⊗_i R_y(x_i)|0⟩   ⟷   IQP: exp(i ∑_{j,k} x_j x_k Z_j Z_k) ⊗_i H|0⟩",
  },
  {
    id: "adjust_learning_rate",
    number: "ARM 04",
    name: "Adjust Learning Rate",
    category: "Descent Dynamics",
    accentColor: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    icon: Zap,
    whatItChanges: "Multiplicatively scales classical descent step size η (0.5× reduction on divergence or 1.5× acceleration on plateau stagnation).",
    whyItIsUsed: "Step sizes that are too aggressive cause severe loss oscillation across steep loss walls, while underscaled steps freeze in flat valleys.",
    constraints: "Strict clamping within the certified operational safety envelope [1e-4, 1.0].",
    recoveryRole: "Stabilizes descent trajectories and accelerates escape from flat plateaus without inducing numerical overflow.",
    mathOperator: "η_{t+1} = clip(η_t · factor, 1e-4, 1.0)  where factor ∈ {0.5, 1.5}",
  },
  {
    id: "noise_mitigation",
    number: "ARM 05",
    name: "Apply Noise Mitigation",
    category: "Bloch State Correction",
    accentColor: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/20",
    icon: Cpu,
    whatItChanges: "Applies simulation-side analytical inverse-noise contraction correction across the single-qubit Bloch density matrix state.",
    whyItIsUsed: "Depolarizing noise contracts the state vector toward the maximally mixed center of the Bloch sphere, reducing purity γ = Tr(ρ²) < 1.0.",
    constraints: "Disclosed simulation-side analytical model on CPU statevector; non-destructive to underlying parameter coordinates.",
    recoveryRole: "Restores expectation value contrast without requiring physical zero-noise extrapolation (ZNE) hardware overhead.",
    mathOperator: "r_mitigated = min(1.0, r / (1 - p_noise))  ⟹  γ_{mitigated} → 1.0",
  },
  {
    id: "warm_restart",
    number: "ARM 06",
    name: "Warm Restart",
    category: "Trajectory Escape",
    accentColor: "border-rose-500/40 text-rose-400 bg-rose-500/10",
    badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20",
    icon: RotateCcw,
    whatItChanges: "Adds bounded stochastic Gaussian noise (σ = 0.05) to current variational parameter tensor coordinates θ.",
    whyItIsUsed: "Quantum cost landscapes are riddled with sub-optimal saddle traps where gradient norms approach zero while loss remains unacceptably high.",
    constraints: "Perturbation magnitude is strictly bounded to prevent catastrophic unlearning of previously captured features.",
    recoveryRole: "Perturbs parameter coordinates just enough to roll off saddle points and into a steeper descent basin.",
    mathOperator: "θ_{perturbed} = θ + ε  where  ε ~ N(0, σ² I),  σ = 0.05",
  },
];

export const StoryChapter4RepairArms: React.FC = () => {
  const [selectedArmId, setSelectedArmId] = useState<string>("change_optimizer");
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  const activeArm = REPAIR_ARMS.find((a) => a.id === selectedArmId) || REPAIR_ARMS[0];
  const ArmIcon = activeArm.icon;

  return (
    <section id="repair-mechanisms" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#07090f] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 04 &middot; The Actuators</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Six ways to recover. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-500">
              One adaptive decision system.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Every failure mode in quantum machine learning requires a specific intervention. Our framework defines a verified portfolio of six autonomous repair arms, each governed by mathematical safety constraints.
          </p>
        </div>

        {/* 6 Arm Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
          {REPAIR_ARMS.map((arm) => {
            const Icon = arm.icon;
            const isSelected = selectedArmId === arm.id;
            return (
              <button
                key={arm.id}
                onClick={() => setSelectedArmId(arm.id)}
                className={`p-4 rounded-2xl border text-left flex flex-col justify-between gap-3 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-white/[0.08] border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.2)]"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20 text-slate-400"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] text-slate-500 font-bold">{arm.number}</span>
                  <Icon className={`w-4 h-4 ${isSelected ? "text-cyan-400" : "text-slate-400"}`} />
                </div>
                <span className={`text-xs font-bold leading-tight ${isSelected ? "text-white" : "text-slate-300"}`}>
                  {arm.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Arm Detail View (Level 1 & Level 2 Progressive Disclosure) */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-cyan-400 shrink-0">
                <ArmIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 block">
                  {activeArm.number} &middot; {activeArm.category}
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  {activeArm.name}
                </h3>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-mono border ${activeArm.badgeClass} self-start sm:self-auto`}>
              {activeArm.category}
            </span>
          </div>

          {/* 4 Pillars of the Selected Arm */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                1. What It Changes
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                {activeArm.whatItChanges}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider block">
                2. Why It Is Used
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                {activeArm.whyItIsUsed}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block">
                3. Safety Constraints
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                {activeArm.constraints}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
                4. Role in Recovery
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-xs sm:text-sm">
                {activeArm.recoveryRole}
              </p>
            </div>
          </div>

          {/* Level 3: Expandable Mathematical Transformation for Researchers */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>{showTechnicalDetails ? "Hide mathematical formulation" : "Inspect Level 3: Mathematical Operator Equation"}</span>
              {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTechnicalDetails && (
              <div className="mt-4 p-4 rounded-xl bg-black/60 border border-white/10 space-y-2 text-xs font-mono text-slate-300 animate-fade-in">
                <span className="text-cyan-400 font-bold block">Operator Transformation Equation:</span>
                <code className="text-amber-300 block bg-white/[0.02] p-3 rounded-lg border border-white/5 break-words">
                  {activeArm.mathOperator}
                </code>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
