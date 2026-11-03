"use client";

import React from "react";
import { Cpu, Layers, GitBranch, Shield, Zap, Lock, Database, Sparkles } from "lucide-react";

interface TechCard {
  title: string;
  category: string;
  description: string;
  specs: string[];
  icon: React.ElementType;
}

const TECHNOLOGIES: TechCard[] = [
  {
    title: "Variational Quantum Circuits",
    category: "Quantum Hardware Model",
    description: "Parameterized unitary transformations U(θ) evaluating energy expectation values on PennyLane&apos;s high-performance statevector simulator with analytical parameter-shift gradient computation.",
    specs: ["PennyLane 0.45.1 Engine", "Basic Entangling Layers", "Angle & IQP Feature Maps"],
    icon: Cpu,
  },
  {
    title: "12D Context Representation",
    category: "State Feature Engineering",
    description: "Real-time state vector condensing loss trajectory, gradient norm, gradient variance, parameter velocity, current learning rate, ansatz depth, and quantum Bloch purity into an orthogonal representation.",
    specs: ["12 Continuous Metrics", "Z-Score Min-Max Normalization", "Sub-Millisecond Inference"],
    icon: Layers,
  },
  {
    title: "Contextual Thompson Sampling",
    category: "Reinforcement Learning Policy",
    description: "Bayesian linear bandit maintaining posterior Gaussian-Inverse-Gamma distributions over repair arm coefficients. Samples actions dynamically to solve the exploration-exploitation dilemma.",
    specs: ["Exact Posterior Conjugacy", "Empirical Reward Conditioning", "Zero Heuristic Bias"],
    icon: GitBranch,
  },
  {
    title: "Digital Twin Lookahead (H=3)",
    category: "Pre-Deployment Verification",
    description: "Simulation-side forward projection executing H=3 virtual iterations of the candidate repair on an isolated clone. Discards candidates that fail to produce predicted loss reduction before live deployment.",
    specs: ["H = 3 Lookahead Horizon", "Candidate Loss Delta Check", "100% Pre-Screening Viability"],
    icon: Sparkles,
  },
  {
    title: "Dynamic Safety Filter",
    category: "Invariant Guardrails",
    description: "State-machine barrier preventing high-frequency oscillatory switching (W_osc=4) between complementary repair arms and enforcing invariant constraints such as minimum ansatz depth L ≥ 2.",
    specs: ["W_osc = 4 Window", "Depth Floor L ≥ 2", "Zero Oscillatory Thrashing"],
    icon: Shield,
  },
  {
    title: "Atomic Checkpoint & Rollback",
    category: "Transactional Fault Recovery",
    description: "Transactional state-machine capturing deep-memory snapshots prior to deployment. If post-repair loss regresses by > 15% across W_val=3 iterations, exact parameters and optimizer buffers are restored.",
    specs: ["W_val = 3 Validation Horizon", "15% Regression Ceiling", "< 1.2ms In-Memory Rollback"],
    icon: Lock,
  },
  {
    title: "Six Canonical Repair Arms",
    category: "Intervention Space",
    description: "Non-destructive atomic repair primitives covering classical optimizer switching, ansatz depth adjustment, feature map transformation, learning rate scaling, analytical noise correction, and warm restarts.",
    specs: ["6 Frozen Repair Arms", "Zero Arbitrary Mutations", "Deterministic Reversibility"],
    icon: Zap,
  },
  {
    title: "Persistent Failure Memory",
    category: "Episodic Knowledge Base",
    description: "Persistent SQLite failure archive storing state context vectors, diagnosed anomaly classes, deployed repair arms, and verified empirical rewards for warm-start transfer across training runs.",
    specs: ["SQLite ACID Persistence", "Semantic Similarity Querying", "Zero Catastrophic Forgetting"],
    icon: Database,
  },
];

export const TechnologySection: React.FC = () => {
  return (
    <section id="technology" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[03 // CORE RESEARCH MECHANISMS]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Engineered Precision. <br />
            Scientific Rigor.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Every mechanism in the architecture is designed around deterministic safety invariants and verifiable closed-loop convergence guarantees.
          </p>
        </div>

        {/* 8 Technical Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TECHNOLOGIES.map((tech) => {
            const Icon = tech.icon;

            return (
              <div
                key={tech.title}
                className="glass-panel p-6 flex flex-col justify-between space-y-6 hover:border-[var(--border-highlight)] transition-all group"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                    <div className="w-9 h-9 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--content-primary)] group-hover:text-[var(--accent)] group-hover:border-[var(--accent)]/30 transition-all">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--content-tertiary)] uppercase tracking-wider">
                      {tech.category}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-[var(--content-primary)] font-sans tracking-tight">
                    {tech.title}
                  </h3>

                  <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                    {tech.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border-subtle)] space-y-1.5 font-mono text-[10px] text-[var(--content-tertiary)]">
                  {tech.specs.map((spec, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      <span>{spec}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
