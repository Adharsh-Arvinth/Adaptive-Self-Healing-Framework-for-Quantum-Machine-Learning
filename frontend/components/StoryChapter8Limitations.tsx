"use client";

import React from "react";
import { AlertTriangle, BookOpen, GitBranch, Terminal, ShieldAlert, Cpu } from "lucide-react";

export const StoryChapter8Limitations: React.FC = () => {
  const limitations = [
    {
      title: "1. Simulation-Only Evaluation",
      desc: "All experiments were executed on classical CPU statevectors using PennyLane 0.45.1. While mathematically exact, statevector simulation does not experience physical quantum gate crosstalk, drift, or laser dephasing.",
    },
    {
      title: "2. Synthetic Failure Injection",
      desc: "Anomalies were introduced using synthetic noise protocols and deliberate parameter stagnation. While representative of common NISQ hurdles, physical device fault distributions may exhibit more complex correlations.",
    },
    {
      title: "3. Diagnosis Generalization Boundary",
      desc: "The Bayesian categorical diagnostician is calibrated across 6 specific failure modes. Uncharacterized exotic quantum phase transitions or hardware bus resets will trigger diagnostic abstention.",
    },
    {
      title: "4. Benchmark Sample Size",
      desc: "Stage 8 evaluations used 50 Monte Carlo evaluation episodes per policy. While sufficient for demonstrating variance reduction, larger-scale benchmarks are needed for definitive reward separation.",
    },
    {
      title: "5. Digital Twin Classical Overhead",
      desc: "Simulating candidate repairs in the surrogate digital twin over lookahead horizon H = 3 requires additional classical compute before each physical deployment.",
    },
    {
      title: "6. Absence of Physical QPU Validation",
      desc: "The framework has not been verified on physical superconducting transmon or trapped-ion QPUs. Physical hardware deployment and real-time pulse-level calibration remain active future work.",
    },
  ];

  return (
    <section id="limitations" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#06080d] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 08 &middot; Scientific Integrity</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Built for rigor. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-500">
              Transparent by design.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Every scientific breakthrough has operational boundaries. Rather than obscuring theoretical assumptions or preliminary sample sizes, we explicitly disclose the six key research constraints of this initial release.
          </p>
        </div>

        {/* 6 Limitation Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {limitations.map((lim) => (
            <div
              key={lim.title}
              className="interactive-card group p-6 rounded-2xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-lg space-y-3 flex flex-col justify-between hover:border-amber-400/40 hover:shadow-[0_12px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(245,158,11,0.12)]"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:text-amber-300" />
                  <span>{lim.title}</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                  {lim.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Research Dossier Links Box */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-xl">
            <h4 className="text-base font-bold text-white font-sans">
              Complete Research Dossier &amp; Reproducibility Package
            </h4>
            <p className="text-xs text-slate-400 font-sans leading-relaxed">
              Full mathematical proofs, 20 peer-reviewed reference validations, and raw JSON benchmark traces are available in the public repository.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            <a
              href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl border border-white/20 bg-white/[0.05] hover:bg-white/[0.1] text-white flex items-center gap-2 transition-all active:scale-95"
            >
              <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
              <span>GitHub Source</span>
            </a>

            <a
              href="https://qml-backend-nczx.onrender.com/docs"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold flex items-center gap-2 transition-all active:scale-95"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>FastAPI Docs</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
