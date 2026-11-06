"use client";

import React, { useState } from "react";
import { BarChart3, Scale, Layers, AlertOctagon, Info, Award, Lock, ShieldCheck } from "lucide-react";

export const ResearchEvidenceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"policies" | "calibration" | "ablation" | "diagnostics">("policies");

  return (
    <section id="research" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-slate-200 section-architectural overflow-hidden max-w-full w-full">
      <div className="max-w-7xl mx-auto space-y-16 max-w-full">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-blue-600 uppercase tracking-wider">
            <span>[10 // EMPIRICAL BENCHMARK EVIDENCE]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-slate-900 tracking-tight">
            Stage 8 Empirical Benchmark Campaign.
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-sans">
            Rigorous evaluation across 2,700 total quantum model executions from frozen commit <code className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-900 font-bold">7d37201</code>. Every result is documented with exact statistical uncertainty, formal hypothesis tests, and transparent disclosure of theoretical and empirical limitations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto font-mono text-xs max-w-full w-full">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "policies"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            Policy Regret (10 Seeds, N=1,200)
          </button>
          <button
            onClick={() => setActiveTab("calibration")}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "calibration"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            Calibration &amp; Coverage (N=300)
          </button>
          <button
            onClick={() => setActiveTab("ablation")}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "ablation"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            Component Ablation (N=1,200)
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "diagnostics"
                ? "bg-blue-600 text-white font-semibold shadow-sm"
                : "border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-300"
            }`}
          >
            Per-Class Diagnostic Matrix (N=300)
          </button>
        </div>

        {/* TAB 1: MULTI-POLICY REGRET COMPARISON */}
        {activeTab === "policies" && (
          <div className="p-7 sm:p-9 rounded-2xl border border-slate-200 bg-white shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 font-mono text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">PAIRED POLICY BENCHMARK (10 SEEDS, 30 EPISODES/SEED, 1,200 EXECUTIONS)</span>
              </div>
              <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 font-semibold">
                FROZEN EVIDENCE: 7d37201
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                    <th className="py-3 px-4 font-semibold">Policy Arm</th>
                    <th className="py-3 px-4 font-semibold">Mean Reward (r̄)</th>
                    <th className="py-3 px-4 font-semibold">Ref-Reward Gap (Regret)</th>
                    <th className="py-3 px-4 font-semibold">Recovery Rate</th>
                    <th className="py-3 px-4 font-semibold">Rollback Rate</th>
                    <th className="py-3 px-4 font-semibold">Statistical Test vs TS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="bg-blue-50/40 font-semibold">
                    <td className="py-3.5 px-4 text-blue-700 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      Contextual Thompson Sampling
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">-4.94 &plusmn; 0.28</td>
                    <td className="py-3.5 px-4 font-semibold">12.69 &plusmn; 0.19</td>
                    <td className="py-3.5 px-4 font-bold">23.3 &plusmn; 2.8%</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">10.7 &plusmn; 2.8% (Lowest)</td>
                    <td className="py-3.5 px-4 text-slate-500 font-normal">Reference Policy (Lowest variance)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">Greedy Exploitation</td>
                    <td className="py-3.5 px-4">-4.75 &plusmn; 0.76</td>
                    <td className="py-3.5 px-4">12.65 &plusmn; 0.51</td>
                    <td className="py-3.5 px-4">25.3 &plusmn; 4.3%</td>
                    <td className="py-3.5 px-4 text-amber-700">17.3 &plusmn; 4.3%</td>
                    <td className="py-3.5 px-4 text-slate-500">p = 0.3282 (Not statistically significant)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">Fixed Heuristic</td>
                    <td className="py-3.5 px-4">-5.45 &plusmn; 0.78</td>
                    <td className="py-3.5 px-4">12.38 &plusmn; 0.74</td>
                    <td className="py-3.5 px-4">12.3 &plusmn; 4.4%</td>
                    <td className="py-3.5 px-4 text-rose-700 font-semibold">23.0 &plusmn; 3.7% (2.1× surge)</td>
                    <td className="py-3.5 px-4 text-slate-500">p = 0.0559 (Borderline non-significant)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">Uniform Random</td>
                    <td className="py-3.5 px-4">-5.01 &plusmn; 0.64</td>
                    <td className="py-3.5 px-4">12.76 &plusmn; 0.46</td>
                    <td className="py-3.5 px-4">23.3 &plusmn; 3.7%</td>
                    <td className="py-3.5 px-4 text-amber-700">16.3 &plusmn; 3.7%</td>
                    <td className="py-3.5 px-4 text-slate-500">p = 0.6746 (Not statistically significant)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>MANDATORY STATISTICAL DISCLOSURE &amp; REGRET INTERPRETATION</span>
              </div>
              <p>
                Contextual Thompson Sampling reward superiority is <strong>not statistically significant</strong> against the comparison policies across 10 paired seeds (TS vs Heuristic: <code className="font-mono text-slate-900">p = 0.0559</code>; TS vs Greedy: <code className="font-mono text-slate-900">p = 0.3282</code>; TS vs Random: <code className="font-mono text-slate-900">p = 0.6746</code>). The demonstrable advantages of Thompson Sampling are a 53.5% reduction in observed rollbacks (10.7% vs 23.0% for heuristic) and substantially lower seed-to-seed reward variance (std = 0.28 vs 0.78). The reported regret metric is a benchmark-defined reference-reward gap, not counterfactual regret against a proven optimal policy.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CALIBRATION & COVERAGE DISCLOSURE */}
        {activeTab === "calibration" && (
          <div className="p-7 sm:p-9 rounded-2xl border border-slate-200 bg-white shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">BAYESIAN TEMPERATURE CALIBRATION &amp; SELECTIVE PREDICTION (N=300 EPISODES)</span>
              </div>
              <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 font-semibold">
                150 TRAIN / 150 TEST HELD-OUT
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                    <th className="py-3 px-4 font-semibold">Evaluation Metric</th>
                    <th className="py-3 px-4 font-semibold">Production Threshold (τ=0.60, T=0.50)</th>
                    <th className="py-3 px-4 font-semibold">Calibrated Analysis (τ*=0.84, T*=1.70)</th>
                    <th className="py-3 px-4 font-semibold">Observed Delta</th>
                    <th className="py-3 px-4 font-semibold">Scientific Implication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Multi-Class Brier Score</td>
                    <td className="py-3 px-4 text-amber-700">0.8645</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">0.5768</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">-33.3% Error</td>
                    <td className="py-3 px-4 text-slate-500">Sharper probabilistic assignments</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Expected Calibration Error (ECE)</td>
                    <td className="py-3 px-4 text-amber-700">0.4295</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">0.1939</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">-54.9% ECE</td>
                    <td className="py-3 px-4 text-slate-500">Alleviates overconfident misclassifications</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">False Positive Rate (FPR)</td>
                    <td className="py-3 px-4 text-rose-700 font-semibold">95.83%</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">0% observed (≤ 4.99% CI)</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">-95.8% Points</td>
                    <td className="py-3 px-4 text-slate-500">Exact 95% Clopper-Pearson bound based on 0/72 cases</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">Gate Precision</td>
                    <td className="py-3 px-4">52.08%</td>
                    <td className="py-3 px-4 font-bold text-emerald-700">100% observed (FDR ≤ 13.72%)</td>
                    <td className="py-3 px-4 text-emerald-700 font-semibold">+47.9% Points</td>
                    <td className="py-3 px-4 text-slate-500">0/25 false discoveries among admitted predictions</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="py-3 px-4 font-semibold text-amber-900">Coverage (Selective Admission)</td>
                    <td className="py-3 px-4 font-semibold">96.00% (144 / 150)</td>
                    <td className="py-3 px-4 font-bold text-amber-700">16.67% (25 / 150)</td>
                    <td className="py-3 px-4 text-amber-700 font-semibold">-79.3% Coverage</td>
                    <td className="py-3 px-4 text-amber-800">Coverage collapse: 83.33% abstention rate</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-slate-900">True Positive Rate (Recall)</td>
                    <td className="py-3 px-4">96.15%</td>
                    <td className="py-3 px-4 font-bold text-slate-900">32.05%</td>
                    <td className="py-3 px-4 text-slate-500">-64.1% Points</td>
                    <td className="py-3 px-4 text-slate-500">Sacrifices recall to avoid false positive admissions</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>COVERAGE TRADE-OFF &amp; FINITE-SAMPLE UNCERTAINTY DISCLOSURE</span>
              </div>
              <p>
                Eliminating false positive repairs under the calibrated threshold (0% observed FPR) requires abstaining on 83.33% of episodes (coverage collapses from 96.0% down to 16.67%). Because zero false alarms occurred across 72 negative test samples, the exact one-sided 95% Clopper-Pearson upper confidence bound is <strong>4.99%</strong>, rather than absolute mathematical zero. The calibrated threshold 0.84 is an analysis result; the production runtime remains frozen at τ = 0.60 to maintain coverage.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: COMPONENT ABLATION STUDY */}
        {activeTab === "ablation" && (
          <div className="p-7 sm:p-9 rounded-2xl border border-slate-200 bg-white shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 font-mono text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">COMPONENT ISOLATION &amp; ABLATION BENCHMARK (1,200 EXECUTIONS)</span>
              </div>
              <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 font-semibold">
                IDENTIFIES ESSENTIAL VS REDUNDANT PILLARS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                    <th className="py-3 px-4 font-semibold">Configuration</th>
                    <th className="py-3 px-4 font-semibold">Success Rate</th>
                    <th className="py-3 px-4 font-semibold">Rollback Rate</th>
                    <th className="py-3 px-4 font-semibold">Latency</th>
                    <th className="py-3 px-4 font-semibold">Circuit Evaluations</th>
                    <th className="py-3 px-4 font-semibold">Empirical Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr className="bg-emerald-50/40 font-semibold">
                    <td className="py-3.5 px-4 text-emerald-800">Full Framework</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">23.0 &plusmn; 4.8%</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">9.3 &plusmn; 3.4%</td>
                    <td className="py-3.5 px-4">3.57 &plusmn; 0.08 s</td>
                    <td className="py-3.5 px-4">191 &plusmn; 4.1</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-medium">Optimal stability &amp; low rollback rate</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">No Digital Twin</td>
                    <td className="py-3.5 px-4">23.7 &plusmn; 4.8%</td>
                    <td className="py-3.5 px-4 text-amber-700 font-semibold">10.3 &plusmn; 5.5%</td>
                    <td className="py-3.5 px-4">3.58 &plusmn; 0.07 s</td>
                    <td className="py-3.5 px-4 font-bold text-blue-600">50 &plusmn; 0 (-3.8× overhead)</td>
                    <td className="py-3.5 px-4 text-amber-700">Twin incurs 3.8× overhead without significant rollback reduction</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium text-slate-900">No Memory</td>
                    <td className="py-3.5 px-4">22.3 &plusmn; 2.2%</td>
                    <td className="py-3.5 px-4">10.0 &plusmn; 2.7%</td>
                    <td className="py-3.5 px-4">3.56 &plusmn; 0.04 s</td>
                    <td className="py-3.5 px-4">185 &plusmn; 3.3</td>
                    <td className="py-3.5 px-4 text-slate-500">Minimal divergence impact on low-dimensional synthetic tasks</td>
                  </tr>
                  <tr className="bg-rose-50/40">
                    <td className="py-3.5 px-4 font-semibold text-rose-800">No Safety Filter</td>
                    <td className="py-3.5 px-4 text-rose-800 font-bold">52.3 &plusmn; 17.2%</td>
                    <td className="py-3.5 px-4 text-rose-700 font-bold">34.0 &plusmn; 18.0% (3.7× surge)</td>
                    <td className="py-3.5 px-4">3.41 &plusmn; 0.17 s</td>
                    <td className="py-3.5 px-4">215 &plusmn; 18.3</td>
                    <td className="py-3.5 px-4 text-rose-700 font-semibold">Catastrophic instability: deploys destructive parameter jumps</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>ARCHITECTURAL INSIGHT: SAFETY FILTER VS DIGITAL TWIN</span>
              </div>
              <p>
                Removing the safety filter increased short-window success (52.3% vs 23.0%) but substantially increased rollbacks (34.0% vs 9.3%, +265%). In contrast, the digital twin introduces approximately <strong>3.8× circuit-evaluation overhead</strong> (191 vs 50 evaluations), while the observed twin rollback difference (9.3% vs 10.3%) was not statistically significant. The digital twin is not experimentally proven indispensable for low-depth models.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: PER-CLASS DIAGNOSTIC MATRIX */}
        {activeTab === "diagnostics" && (
          <div className="p-7 sm:p-9 rounded-2xl border border-slate-200 bg-white shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200 font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-slate-900">PER-FAILURE DIAGNOSTIC PERFORMANCE MATRIX (N=300, 50 EPISODES PER CATEGORY)</span>
              </div>
              <span className="text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 font-semibold">
                FROZEN STAGE 8 RECORD
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/80">
                    <th className="py-3 px-4 font-semibold">Failure Category</th>
                    <th className="py-3 px-4 font-semibold">Precision</th>
                    <th className="py-3 px-4 font-semibold">Recall</th>
                    <th className="py-3 px-4 font-semibold">F1 Score</th>
                    <th className="py-3 px-4 font-semibold">Recovery Rate</th>
                    <th className="py-3 px-4 font-semibold">Diagnostic Behavior &amp; Confusion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900">Barren Plateau (BP)</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">100%</td>
                    <td className="py-3.5 px-4">64% (32/50)</td>
                    <td className="py-3.5 px-4 font-semibold">0.780</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">84%</td>
                    <td className="py-3.5 px-4 text-slate-500">Zero false alarms; successfully recovered by layer truncation</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900">Training Divergence (DIV)</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">100%</td>
                    <td className="py-3.5 px-4">64% (32/50)</td>
                    <td className="py-3.5 px-4 font-semibold">0.780</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">54%</td>
                    <td className="py-3.5 px-4 text-slate-500">High gradient spike detection; recovered via rollback &amp; restart</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900">Noise Degradation (DEC)</td>
                    <td className="py-3.5 px-4 text-amber-700 font-semibold">35%</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">72% (36/50)</td>
                    <td className="py-3.5 px-4 font-semibold">0.471</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">76%</td>
                    <td className="py-3.5 px-4 text-slate-500">Radial contraction detection; high recall, modest precision</td>
                  </tr>
                  <tr className="bg-amber-50/40">
                    <td className="py-3.5 px-4 font-bold text-amber-900">Persistent Plateau (PP)</td>
                    <td className="py-3.5 px-4 text-emerald-700 font-bold">100%</td>
                    <td className="py-3.5 px-4 text-rose-700 font-bold">6% (3/50)</td>
                    <td className="py-3.5 px-4 font-semibold text-rose-700">0.113</td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">88%</td>
                    <td className="py-3.5 px-4 text-amber-800">Severe Diagnostic Gap: frequently confused with LR misconfiguration</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-bold text-slate-900">LR Misconfiguration (LRM)</td>
                    <td className="py-3.5 px-4 text-amber-700 font-semibold">20.6%</td>
                    <td className="py-3.5 px-4 text-amber-700">14% (7/50)</td>
                    <td className="py-3.5 px-4 font-semibold">0.167</td>
                    <td className="py-3.5 px-4">54%</td>
                    <td className="py-3.5 px-4 text-slate-500">Slow descent steps mimic small learning rates; low recall</td>
                  </tr>
                  <tr className="bg-rose-50/40">
                    <td className="py-3.5 px-4 font-bold text-rose-900">Optimizer Instability (OPT)</td>
                    <td className="py-3.5 px-4 text-slate-500 italic">Undefined (0/0)</td>
                    <td className="py-3.5 px-4 text-rose-700 font-bold">0% (0/50)</td>
                    <td className="py-3.5 px-4 text-slate-500 italic">Undefined (0/0)</td>
                    <td className="py-3.5 px-4">58%</td>
                    <td className="py-3.5 px-4 text-rose-800">Total Diagnostic Gap: frequently confused with noise degradation</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-600 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-slate-900 font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>EXPLICIT DIAGNOSTIC GAP DISCLOSURE</span>
              </div>
              <p>
                For Optimizer Instability, precision and F1 are <strong>Undefined</strong> because there were no positive predictions (0/0). High-frequency stochastic parameter fluctuations were frequently confused with noise degradation. Similarly, Persistent Plateau achieved 100% precision on the 3 cases admitted, but had a severe 6% recall gap because vanishing gradient norms and slow displacement velocities were misdiagnosed as learning rate misconfigurations.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
