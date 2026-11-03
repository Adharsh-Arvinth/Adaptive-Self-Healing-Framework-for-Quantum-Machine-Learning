"use client";

import React from "react";
import { Cpu, Layers, GitBranch, Sparkles, Shield, Lock, Wrench, Database } from "lucide-react";

interface TechItem {
  title: string;
  category: string;
  description: string;
  specs: string[];
  icon: React.ComponentType<{ className?: string }>;
}

const TECH_STACK: TechItem[] = [
  {
    title: "Variational Quantum Circuits",
    category: "Quantum Simulation Model",
    description: "Parameterized unitary transformations U(θ) evaluating expectation values on PennyLane&apos;s analytical statevector simulator (`default.qubit`) with parameter-shift gradient computation.",
    specs: ["PennyLane 0.45.1 Engine", "Basic Entangling Layers", "Angle & IQP Feature Maps"],
    icon: Cpu,
  },
  {
    title: "12D Bandit Context Vector",
    category: "State Feature Engineering",
    description: "Real-time state vector condensing loss trajectory, gradient norm, gradient variance, parameter velocity, circuit depth, Bayesian diagnosis confidence, entropy, memory retrieval priors, and digital-twin projections.",
    specs: ["12 Continuous Metrics", "Strict Bounded Range [-1, 1]", "Fast Classical Evaluation"],
    icon: Layers,
  },
  {
    title: "Contextual Thompson Sampling",
    category: "Reinforcement Learning Policy",
    description: "Bayesian linear bandit maintaining posterior Gaussian distributions over repair arm coefficients. Samples actions dynamically to balance exploration of uncertain repairs and exploitation of known successes.",
    specs: ["Conjugate Gaussian Updating", "Rank-1 Sherman-Morrison Inversion", "Reduced Rollback Variance"],
    icon: GitBranch,
  },
  {
    title: "Digital Twin Lookahead (H=3)",
    category: "Pre-Deployment Verification",
    description: "Simulation-side forward projection executing H=3 virtual iterations of the candidate repair on an isolated clone. Discards candidates predicted to degrade loss by > 20% before live deployment.",
    specs: ["H = 3 Lookahead Horizon", "Loss Delta Viability Filter", "Disclosed 3.8x Circuit Overhead"],
    icon: Sparkles,
  },
  {
    title: "Dynamic Safety Filter",
    category: "Invariant Guardrails",
    description: "State-machine barrier preventing high-frequency oscillatory switching (W_osc=4) between complementary repair arms and enforcing invariant constraints such as minimum ansatz depth L ≥ 1 and learning rate bounds.",
    specs: ["W_osc = 4 Anti-Oscillation Window", "Non-Holonomic Bounds", "3.7x Rollback Reduction in Ablation"],
    icon: Shield,
  },
  {
    title: "Atomic Checkpoint & Rollback",
    category: "Transactional Fault Recovery",
    description: "Transactional state-machine capturing in-memory parameter snapshots prior to repair. If post-repair loss regresses beyond the validation ceiling across W_val=3 iterations, exact parameter snapshots are restored.",
    specs: ["W_val = 3 Validation Horizon", "Regression Rollback Guard", "In-Memory Snapshot Restoration"],
    icon: Lock,
  },
  {
    title: "Six Locked Repair Arms",
    category: "Intervention Space",
    description: "Non-destructive atomic repair primitives covering classical optimizer switching, ansatz depth adjustment, feature map transformation, learning rate scaling, analytical noise correction, and warm restarts.",
    specs: ["6 Domain Actions", "Orthogonal Repair Primitives", "Parameter State Invariants"],
    icon: Wrench,
  },
  {
    title: "Episodic Failure Memory",
    category: "Long-Term Knowledge Retrieval",
    description: "Persistent SQLite failure episode store recording 12-dimensional failure embeddings, diagnostic causes, applied repairs, and resulting rewards. Cosine similarity retrieves nearest-neighbor priors.",
    specs: ["SQLite Persistent Storage", "Cosine Vector Retrieval", "Prior Reward Conditioning"],
    icon: Database,
  },
];

export const TechnologySection: React.FC = () => {
  return (
    <section id="technology" className="py-20 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-sans text-xs font-semibold text-[var(--accent)]">
            <span>[03 // ARCHITECTURAL SUBSTRATE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Scientific &amp; Technical Substrate.
          </h2>
          <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
            The self-healing runtime integrates quantum mechanics, Bayesian statistical inference, reinforcement learning, and transactional systems engineering into a cohesive autonomous control loop.
          </p>
        </div>

        {/* Tech Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {TECH_STACK.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm hover:border-[var(--border-highlight)] transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider">
                      {item.category}
                    </span>
                    <Icon className="w-4 h-4 text-[var(--accent)]" />
                  </div>

                  <h3 className="text-base font-bold text-[var(--content-primary)] tracking-tight">
                    {item.title}
                  </h3>

                  <p className="text-xs text-[var(--content-secondary)] leading-relaxed font-sans">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[var(--border-subtle)] space-y-1.5 font-mono text-[10px] text-[var(--content-secondary)]">
                  {item.specs.map((spec) => (
                    <div key={spec} className="flex items-center gap-1.5">
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
