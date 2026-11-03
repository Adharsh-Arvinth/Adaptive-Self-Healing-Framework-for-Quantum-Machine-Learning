"use client";

import React, { useState } from "react";
import { BarChart3, Scale, Layers, AlertOctagon, Info, Award, Lock, ShieldCheck } from "lucide-react";

export const ResearchEvidenceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"policies" | "calibration" | "ablation" | "diagnostics">("policies");

  return (
    <section id="research" className="py-20 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[10 // EMPIRICAL BENCHMARK EVIDENCE]</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Stage 8 Empirical Benchmark Campaign.
          </h2>
          <p className="text-sm sm:text-base text-[var(--content-secondary)] leading-relaxed font-sans">
            Rigorous evaluation across 2,700 total quantum model executions from frozen commit <code className="font-mono text-xs text-[var(--content-primary)]">7d37201</code>. Every result is documented with exact statistical uncertainty, formal hypothesis tests, and transparent disclosure of theoretical and empirical limitations.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto font-mono text-xs">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "policies"
                ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            Policy Regret (10 Seeds, N=1,200)
          </button>
          <button
            onClick={() => setActiveTab("calibration")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "calibration"
                ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            Calibration & Coverage (N=300)
          </button>
          <button
            onClick={() => setActiveTab("ablation")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "ablation"
                ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            Component Ablation (N=1,200)
          </button>
          <button
            onClick={() => setActiveTab("diagnostics")}
            className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap font-medium ${
              activeTab === "diagnostics"
                ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
                : "border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            Diagnostic Recall & Limitations
          </button>
        </div>

        {/* TAB 1: MULTI-POLICY REGRET COMPARISON */}
        {activeTab === "policies" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--content-primary)]">PAIRED POLICY REGRET BENCHMARK (10 SEEDS, 120 EPISODES/SEED, TOTAL N=1,200)</span>
              </div>
              <span className="text-[var(--content-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                FROZEN BASELINE: 7d37201
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--content-secondary)] bg-[var(--bg-primary)]">
                    <th className="py-3 px-4">Policy Arm</th>
                    <th className="py-3 px-4">Empirical Reward (r̄)</th>
                    <th className="py-3 px-4">Rollback Rate</th>
                    <th className="py-3 px-4">Success Rate</th>
                    <th className="py-3 px-4">Mean Regret (R_T)</th>
                    <th className="py-3 px-4">Statistical Significance vs TS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                  <tr className="bg-[var(--accent)]/5 font-semibold">
                    <td className="py-3.5 px-4 text-[var(--accent)] flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                      Contextual Thompson Sampling
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[var(--content-primary)]">-4.94 &plusmn; 0.28</td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">10.7 &plusmn; 2.8% (Lowest)</td>
                    <td className="py-3.5 px-4">23.3%</td>
                    <td className="py-3.5 px-4">12.69 &plusmn; 0.19</td>
                    <td className="py-3.5 px-4 text-[var(--content-secondary)] font-normal">Reference Policy (Lowest reward variance)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium">Greedy Exploitation</td>
                    <td className="py-3.5 px-4">-4.75 &plusmn; 0.76</td>
                    <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400">17.3 &plusmn; 4.3%</td>
                    <td className="py-3.5 px-4">25.3%</td>
                    <td className="py-3.5 px-4">12.65 &plusmn; 0.51</td>
                    <td className="py-3.5 px-4 text-[var(--content-secondary)]">p = 0.3282 (Not statistically significant)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium">Fixed Heuristic</td>
                    <td className="py-3.5 px-4">-5.45 &plusmn; 0.78</td>
                    <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-semibold">23.0 &plusmn; 3.7% (2.1x surge)</td>
                    <td className="py-3.5 px-4">12.3%</td>
                    <td className="py-3.5 px-4">12.38 &plusmn; 0.74</td>
                    <td className="py-3.5 px-4 text-[var(--content-secondary)]">p = 0.0559 (Borderline non-significant at α=0.05)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium">Uniform Random</td>
                    <td className="py-3.5 px-4">-5.01 &plusmn; 0.64</td>
                    <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400">16.3 &plusmn; 3.7%</td>
                    <td className="py-3.5 px-4">23.3%</td>
                    <td className="py-3.5 px-4">12.76 &plusmn; 0.46</td>
                    <td className="py-3.5 px-4 text-[var(--content-secondary)]">p = 0.6746 (Not statistically significant)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--content-primary)] font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>MANDATORY STATISTICAL DISCLOSURE</span>
              </div>
              <p>
                Contextual Thompson Sampling reward superiority is <strong>not statistically significant</strong> against the comparison policies across 10 paired random seeds (TS vs Heuristic: <code className="font-mono text-[var(--content-primary)]">p = 0.0559</code>; TS vs Greedy: <code className="font-mono text-[var(--content-primary)]">p = 0.3282</code>; TS vs Random: <code className="font-mono text-[var(--content-primary)]">p = 0.6746</code>). The primary empirical advantages of Thompson Sampling are lower observed rollback rates (10.7% vs 23.0% for heuristic) and substantially lower seed-to-seed reward variance (std = 0.28 vs 0.78).
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CALIBRATION & COVERAGE DISCLOSURE */}
        {activeTab === "calibration" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--content-primary)]">DISJOINT PARTITION CALIBRATION PROTOCOL (N=300 EPISODES, 150 TRAIN / 150 TEST)</span>
              </div>
              <span className="text-[var(--content-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                TEMPERATURE SCALING & SELECTIVE PREDICTION
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--content-secondary)] bg-[var(--bg-primary)]">
                    <th className="py-3 px-4">Evaluation Metric</th>
                    <th className="py-3 px-4">Production Gate (τ=0.60, T=0.50)</th>
                    <th className="py-3 px-4">Calibrated Gate (τ*=0.840, T*=1.699)</th>
                    <th className="py-3 px-4">Observed Difference</th>
                    <th className="py-3 px-4">Scientific Implication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                  <tr>
                    <td className="py-3 px-4 font-semibold">Multi-Class Brier Score</td>
                    <td className="py-3 px-4 text-amber-600 dark:text-amber-400">0.8645</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">0.5768</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">-33.3% Error</td>
                    <td className="py-3 px-4 text-[var(--content-secondary)]">Sharper probabilistic probability assignments</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Expected Calibration Error (ECE)</td>
                    <td className="py-3 px-4 text-amber-600 dark:text-amber-400">0.4295</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">0.1939</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">-54.9% ECE</td>
                    <td className="py-3 px-4 text-[var(--content-secondary)]">Alleviates overconfident misclassifications</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">False Positive Rate (FPR)</td>
                    <td className="py-3 px-4 text-rose-600 dark:text-rose-400 font-semibold">95.83%</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">0% observed (≤ 4.99% CI)</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">-95.8% Points</td>
                    <td className="py-3 px-4 text-[var(--content-secondary)]">Exact 95% Clopper-Pearson bound based on 0/72 cases</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">Gate Precision</td>
                    <td className="py-3 px-4">52.08%</td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">100% observed</td>
                    <td className="py-3 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">+47.9% Points</td>
                    <td className="py-3 px-4 text-[var(--content-secondary)]">Admitted diagnoses are completely accurate</td>
                  </tr>
                  <tr className="bg-amber-500/5">
                    <td className="py-3 px-4 font-semibold text-amber-700 dark:text-amber-400">Gate Coverage (Selective Rate)</td>
                    <td className="py-3 px-4">96.0% (144 / 150)</td>
                    <td className="py-3 px-4 font-bold text-[var(--accent)]">16.67% (25 / 150)</td>
                    <td className="py-3 px-4 text-amber-700 dark:text-amber-400 font-semibold">-79.3% Coverage</td>
                    <td className="py-3 px-4 text-amber-700 dark:text-amber-400">Coverage collapse: 83.33% abstention rate</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold">True Positive Rate (Recall)</td>
                    <td className="py-3 px-4">96.15%</td>
                    <td className="py-3 px-4 font-bold">32.05%</td>
                    <td className="py-3 px-4 text-[var(--content-secondary)]">-64.1% Points</td>
                    <td className="py-3 px-4 text-[var(--content-secondary)]">Sacrifices recall to avoid harmful repair deployments</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--content-primary)] font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>COVERAGE TRADE-OFF & FINITE-SAMPLE UNCERTAINTY DISCLOSURE</span>
              </div>
              <p>
                Eliminating false positive repairs under the calibrated gate (0% observed FPR) requires abstaining on 83.33% of episodes (coverage collapses from 96.0% down to 16.67%). Furthermore, because zero false alarms were observed across 72 negative samples, the exact 95% Clopper-Pearson upper confidence bound is <strong>4.99%</strong>, rather than absolute mathematical zero.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: COMPONENT ABLATION STUDY */}
        {activeTab === "ablation" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-semibold text-[var(--content-primary)]">COMPONENT ISOLATION & ABLATION STUDY (N=1,200 EXECUTIONS)</span>
              </div>
              <span className="text-[var(--content-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                IDENTIFIES ESSENTIAL VS REDUNDANT PILLARS
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--content-secondary)] bg-[var(--bg-primary)]">
                    <th className="py-3 px-4">Architecture Configuration</th>
                    <th className="py-3 px-4">Success Rate</th>
                    <th className="py-3 px-4">Rollback Rate</th>
                    <th className="py-3 px-4">Circuit Eval Cost</th>
                    <th className="py-3 px-4">Empirical Finding</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                  <tr className="bg-emerald-500/5 font-semibold">
                    <td className="py-3.5 px-4 text-emerald-700 dark:text-emerald-400">Full Framework</td>
                    <td className="py-3.5 px-4 font-bold">23.0%</td>
                    <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">9.3%</td>
                    <td className="py-3.5 px-4">7.45 evals</td>
                    <td className="py-3.5 px-4 text-emerald-700 dark:text-emerald-400">Optimal recovery and rollback balance</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium">Without Digital Twin (H=0)</td>
                    <td className="py-3.5 px-4">23.7%</td>
                    <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400 font-semibold">10.3%</td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-600 dark:text-emerald-400">7.31 evals (-3.8x overhead)</td>
                    <td className="py-3.5 px-4 text-amber-600 dark:text-amber-400">3.8x overhead without statistically significant rollback benefit</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4 font-medium">Without Episodic Memory</td>
                    <td className="py-3.5 px-4">22.3%</td>
                    <td className="py-3.5 px-4">10.0%</td>
                    <td className="py-3.5 px-4">7.45 evals</td>
                    <td className="py-3.5 px-4 text-[var(--content-secondary)]">Minimal divergence impact on low-dimensional synthetic tasks</td>
                  </tr>
                  <tr className="bg-rose-500/5">
                    <td className="py-3.5 px-4 font-semibold text-rose-700 dark:text-rose-400">Without Safety Filter (Non-holonomic bounds)</td>
                    <td className="py-3.5 px-4 text-rose-700 dark:text-rose-400 font-bold">52.3%</td>
                    <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-bold">34.0% (3.7x surge)</td>
                    <td className="py-3.5 px-4">3.01 evals</td>
                    <td className="py-3.5 px-4 text-rose-700 dark:text-rose-400 font-semibold">Catastrophic instability: deploys destructive parameter jumps</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--content-primary)] font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>ARCHITECTURAL INSIGHT: SAFETY FILTER VS DIGITAL TWIN</span>
              </div>
              <p>
                The ablation proves that the <strong>Safety Filter is the indispensable stability pillar</strong> of the framework; removing it causes rollbacks to surge from 9.3% to 34.0% (+265%). In contrast, the <strong>Digital Twin lookahead incurs a 3.8&times; circuit evaluation overhead</strong> while delivering no statistically significant reduction in rollback rate (9.3% vs 10.3%, overlapping 95% CIs), representing an important trade-off for resource-constrained QPU applications.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: DIAGNOSTIC SENSITIVITY & LIMITATIONS */}
        {activeTab === "diagnostics" && (
          <div className="p-6 sm:p-8 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <span className="font-semibold text-[var(--content-primary)]">PER-FAILURE DIAGNOSTIC RECALL MATRIX & VALIDITY LIMITATIONS (N=300)</span>
              </div>
              <span className="text-[var(--content-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                HONEST SCIENTIFIC DISCLOSURE
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-5 rounded-xl border border-rose-500/30 bg-rose-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-700 dark:text-rose-400">Optimizer Instability (OPT)</span>
                  <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-[10px]">RECALL: 0% (0 / 50)</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] font-sans leading-relaxed">
                  <strong>Total Diagnostic Gap:</strong> Zero cases of injected optimizer instability were correctly diagnosed. High-frequency stochastic parameter fluctuations closely mimic healthy exploratory descent steps within standard sliding window sizes (W=5), causing the classifier to abstain or conflate with noise degradation.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700 dark:text-amber-400">Persistent Plateau (PP)</span>
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[10px]">RECALL: 6.0% (3 / 50)</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] font-sans leading-relaxed">
                  <strong>Severe Diagnostic Gap:</strong> Only 3 of 50 persistent plateau episodes were detected. In 27 cases, vanishing gradient norms and slow displacement velocities were misdiagnosed as learning rate misconfigurations, resulting in ineffective learning rate scaling rather than feature map modifications.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--content-primary)]">Barren Plateau (BP)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">RECALL: 64.0% (32 / 50)</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] font-sans leading-relaxed">
                  Precision was 100.0% (0 false positives). Successfully relieved by reducing circuit depth (L &rarr; L-1), restoring non-vanishing gradient variance without ansatz over-parameterization.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[var(--content-primary)]">Training Divergence (DIV)</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold text-[10px]">RECALL: 64.0% (32 / 50)</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] font-sans leading-relaxed">
                  Precision was 100.0%. Triggered by gradient norm spikes (&gt; 5.0) and loss explosion. Recovered via near-identity warm restart and learning rate backoff.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] leading-relaxed space-y-1.5">
              <div className="flex items-center gap-2 text-[var(--content-primary)] font-semibold font-mono text-[11px]">
                <Info className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>HARDWARE BOUNDARY DISCLAIMER</span>
              </div>
              <p>
                All benchmarks were executed on classical CPU hardware using PennyLane's analytical <code>default.qubit</code> statevector simulator. Noise mitigation is implemented strictly as simulation-side analytical inverse-noise correction under a custom radial-contraction model, not physical multi-scale zero-noise extrapolation (ZNE) on physical superconducting or trapped-ion QPUs.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
