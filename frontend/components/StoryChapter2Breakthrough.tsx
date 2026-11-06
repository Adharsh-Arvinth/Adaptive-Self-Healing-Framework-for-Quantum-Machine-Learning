"use client";

import React, { useState } from "react";
import { Sparkles, ArrowRight, ShieldCheck, RefreshCw, Layers, CheckCircle2, XCircle } from "lucide-react";

export const StoryChapter2Breakthrough: React.FC = () => {
  const [activeMode, setActiveMode] = useState<"traditional" | "selfhealing">("selfhealing");

  return (
    <section id="the-breakthrough" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#05070a] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 02 &middot; The Breakthrough</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            What if a quantum model <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-200">
              could recover itself?
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Instead of discarding crashed quantum training runs or relying on human trial-and-error, our framework introduces an autonomous closed-loop runtime guardian. It continuously senses anomalies, diagnoses root causes, and deploys targeted structural repairs with atomic rollback safety.
          </p>
        </div>

        {/* Visual Comparison: Traditional Crash vs Autonomous Self-Healing */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Interactive Paradigm Comparison
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Two Philosophies for Quantum Machine Learning
              </h3>
            </div>

            {/* Mode Switcher */}
            <div className="inline-flex p-1 rounded-xl bg-white/[0.05] border border-white/10 self-start sm:self-auto font-mono text-xs">
              <button
                onClick={() => setActiveMode("traditional")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeMode === "traditional"
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Traditional QML
              </button>
              <button
                onClick={() => setActiveMode("selfhealing")}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeMode === "selfhealing"
                    ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Self-Healing Loop
              </button>
            </div>
          </div>

          {activeMode === "traditional" ? (
            /* Traditional Failure Workflow */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-xs font-mono text-slate-500">STEP 1</span>
                <h4 className="text-sm font-bold text-slate-200">Silent Anomaly</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gradient vanishes into barren plateau. Classical optimizer updates blindly into dead space.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-xs font-mono text-slate-500">STEP 2</span>
                <h4 className="text-sm font-bold text-slate-200">Execution Stalls</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Loss plateaus at random accuracy. Compute resources continue burning without learning.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
                <span className="text-xs font-mono text-rose-400">STEP 3</span>
                <h4 className="text-sm font-bold text-rose-300">Run Aborts</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Training halts after max steps or loss divergence. All weights and runtime state are lost.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <XCircle className="w-4 h-4" />
                  <span>Manual Retrial Required</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Researchers guess new hyperparameters, re-initialize weights, and re-run from scratch.
                </p>
              </div>
            </div>
          ) : (
            /* Autonomous Self-Healing Workflow */
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
              <div className="p-5 rounded-2xl bg-white/[0.03] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400">SENSE &middot; 01</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <h4 className="text-sm font-bold text-white">Instant Interception</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Continuous telemetry detects anomaly within a 5-step window before catastrophic divergence.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400">DIAGNOSE &middot; 02</span>
                  <span className="text-[10px] text-slate-400 font-bold">P = 91%</span>
                </div>
                <h4 className="text-sm font-bold text-white">Root-Cause Inference</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Bayesian inference categorizes failure and queries episodic memory for historical precedents.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.03] border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-cyan-400">SIMULATE &middot; 03</span>
                  <span className="text-[10px] text-slate-400 font-bold">H = 3</span>
                </div>
                <h4 className="text-sm font-bold text-white">Digital Twin Sandbox</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Candidate repairs are tested in an isolated simulation twin to verify gradient recovery before deployment.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Autonomous Recovery</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Repair applied safely. If validation passes (W_val=3), changes commit; otherwise, fail-safe rollback restores state.
                </p>
              </div>
            </div>
          )}

          {/* Core Takeaway Ribbon */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>THE DESIGN PRINCIPLE: Resilience at runtime, without human intervention.</span>
            </div>
            <span className="text-cyan-400">Zero data loss &middot; Fail-safe rollback</span>
          </div>
        </div>
      </div>
    </section>
  );
};
