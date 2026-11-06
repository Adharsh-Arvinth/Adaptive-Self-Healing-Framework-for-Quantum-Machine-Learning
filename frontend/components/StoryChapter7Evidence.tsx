"use client";

import React, { useState } from "react";
import { BarChart3, CheckCircle2, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Scale } from "lucide-react";

export const StoryChapter7Evidence: React.FC = () => {
  const [showFullStats, setShowFullStats] = useState<boolean>(false);

  const policyData = [
    {
      name: "Thompson Sampling (Our Framework)",
      reward: "-4.94 ± 0.28",
      rollback: "10.7 ± 2.8%",
      brier: "0.115",
      isPrimary: true,
      color: "border-cyan-500/50 bg-cyan-950/20 text-cyan-300",
      barWidth: "75%",
    },
    {
      name: "Greedy Policy",
      reward: "-4.75 ± 0.76",
      rollback: "17.3 ± 4.3%",
      brier: "0.106",
      isPrimary: false,
      color: "border-white/10 bg-white/[0.02] text-slate-300",
      barWidth: "78%",
    },
    {
      name: "Random Selection",
      reward: "-5.01 ± 0.64",
      rollback: "16.3 ± 3.7%",
      brier: "—",
      isPrimary: false,
      color: "border-white/10 bg-white/[0.02] text-slate-300",
      barWidth: "73%",
    },
    {
      name: "Fixed Heuristic Baseline",
      reward: "-5.45 ± 0.78",
      rollback: "23.0 ± 3.7%",
      brier: "0.119",
      isPrimary: false,
      color: "border-white/10 bg-white/[0.02] text-slate-300",
      barWidth: "65%",
    },
  ];

  return (
    <section id="research" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#05070a] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 07 &middot; Empirical Evidence</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            What did the experiments <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-500">
              actually show?
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Rigorous scientific research requires transparency. We report the exact, frozen experimental data from our Stage 8 benchmark suite across 50 Monte Carlo evaluation episodes—highlighting both verified gains and honest statistical limitations.
          </p>
        </div>

        {/* 4 Policy Comparison Cards */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Frozen Stage 8 Benchmark Data (Commit 7d37201aead20c7e5678585c998b51206bc49339)
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Policy Regret &amp; Rollback Rates Across 50 Seeds
              </h3>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-white/[0.05] border border-white/10 text-slate-400 self-start sm:self-auto">
              N = 50 Evaluation Episodes
            </span>
          </div>

          {/* Benchmark Table */}
          <div className="grid grid-cols-1 gap-3 font-mono text-xs">
            {policyData.map((pol) => (
              <div
                key={pol.name}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${pol.color} flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider">
                    {pol.isPrimary ? "Adaptive Framework" : "Comparison Policy"}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-white">
                    {pol.name}
                  </h4>
                </div>

                <div className="grid grid-cols-3 gap-4 text-right">
                  <div>
                    <span className="text-[10px] text-slate-500 block">MEAN REWARD</span>
                    <span className="text-xs sm:text-sm font-bold text-white">{pol.reward}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">ROLLBACK RATE</span>
                    <span className="text-xs sm:text-sm font-bold text-amber-300">{pol.rollback}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">BRIER SCORE</span>
                    <span className="text-xs sm:text-sm font-bold text-slate-300">{pol.brier}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Transparent Scientific Findings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm font-sans pt-2">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
                <CheckCircle2 className="w-4 h-4" />
                <span>What Was Verified</span>
              </div>
              <ul className="text-slate-300 space-y-1.5 text-xs leading-relaxed list-disc list-inside">
                <li>
                  <strong>Lower Rollback Rate:</strong> Thompson Sampling reduced rollback rate from 23.0% (heuristic) down to 10.7 ± 2.8%, proving surgical repair selection.
                </li>
                <li>
                  <strong>Lower Reward Variability:</strong> Seed-to-seed standard deviation dropped to ±0.28 (compared to ±0.76 for Greedy and ±0.78 for Heuristic).
                </li>
                <li>
                  <strong>Atomic Rollback Works:</strong> 100% of regressive candidate repairs were safely restored without parameter corruption.
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase font-mono">
                <Scale className="w-4 h-4" />
                <span>What Did Not Show Significance</span>
              </div>
              <ul className="text-slate-300 space-y-1.5 text-xs leading-relaxed list-disc list-inside">
                <li>
                  <strong>Reward Superiority:</strong> Thompson Sampling reward (-4.94) was not statistically significantly superior to Greedy (-4.75, p=0.3282) or Random (-5.01, p=0.6746).
                </li>
                <li>
                  <strong>TS vs Heuristic:</strong> Reached p = 0.0559 (approaching but not clearing the classical α = 0.05 significance threshold).
                </li>
                <li>
                  <strong>Sample Size Limitation:</strong> 50 evaluation episodes per policy; larger QPU-scale benchmarks are required for definitive statistical separation.
                </li>
              </ul>
            </div>
          </div>

          {/* Level 3: Expandable Statistical Audit for Peer Reviewers */}
          <div className="pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowFullStats(!showFullStats)}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>{showFullStats ? "Hide statistical audit table" : "Inspect Level 3: Exact Hypothesis Test p-values & Calibration Brier Scores"}</span>
              {showFullStats ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFullStats && (
              <div className="mt-4 p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4 text-xs font-mono text-slate-300 animate-fade-in">
                <span className="text-cyan-400 font-bold block">Formal Two-Sided Welch t-test p-values (TS vs Competitors):</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 text-[10px] block">TS vs HEURISTIC</span>
                    <span className="text-white font-bold block mt-1">p = 0.0559</span>
                    <span className="text-[10px] text-amber-300">Marginal significance</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 text-[10px] block">TS vs GREEDY</span>
                    <span className="text-white font-bold block mt-1">p = 0.3282</span>
                    <span className="text-[10px] text-slate-400">Not significant</span>
                  </div>
                  <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
                    <span className="text-slate-400 text-[10px] block">TS vs RANDOM</span>
                    <span className="text-white font-bold block mt-1">p = 0.6746</span>
                    <span className="text-[10px] text-slate-400">Not significant</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
