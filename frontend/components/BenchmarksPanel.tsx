"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, Award, ShieldCheck, Layers, Lock, RefreshCw, AlertTriangle } from "lucide-react";
import { BenchmarkSummaryData } from "@/types";

interface BenchmarksPanelProps {
  apiBase?: string;
}

export const BenchmarksPanel: React.FC<BenchmarksPanelProps> = ({
  apiBase = "http://127.0.0.1:8000",
}) => {
  const [data, setData] = useState<BenchmarkSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"calibration" | "policy" | "ablation" | "per_class">("calibration");

  useEffect(() => {
    fetch(`${apiBase}/api/benchmarks/summary`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch benchmark summary:", err);
        setLoading(false);
      });
  }, [apiBase]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Award className="w-5 h-5 text-[var(--accent)]" />
            <h1 className="text-base font-semibold text-[var(--content-primary)] tracking-tight">
              Stage 8 Empirical Benchmark Campaign
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
              VERIFIED RECORD
            </span>
          </div>
          <p className="text-xs text-[var(--content-secondary)] leading-relaxed max-w-3xl">
            Empirical evidence from 3,000 executed benchmark episodes across 900 unique scenario initialisations (300 calibration, 1,200 multi-policy regret, 1,200 component ablation, and 300 per-failure recovery evaluations).
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[var(--content-secondary)] shrink-0 bg-[var(--bg-primary)] px-3 py-1.5 rounded-xl border border-[var(--border-subtle)]">
          <Lock className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Baseline: <code className="font-bold text-[var(--content-primary)]">7d37201</code> <span className="text-[10px] text-[var(--content-tertiary)]" title="Frozen baseline commit">(7d37201aead20c7e5678585c998b51206bc49339)</span></span>
        </div>
      </div>

      {/* Segmented Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("calibration")}
          className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${
            activeTab === "calibration"
              ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          Confidence Calibration (N=300)
        </button>
        <button
          onClick={() => setActiveTab("policy")}
          className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${
            activeTab === "policy"
              ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          Policy Regret (10 Seeds)
        </button>
        <button
          onClick={() => setActiveTab("ablation")}
          className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${
            activeTab === "ablation"
              ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          Component Ablations
        </button>
        <button
          onClick={() => setActiveTab("per_class")}
          className={`text-xs font-medium px-4 py-2 rounded-xl transition-all ${
            activeTab === "per_class"
              ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
              : "bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] border border-[var(--border-subtle)]"
          }`}
        >
          Per-Failure Recovery Matrix
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-[var(--content-secondary)] flex items-center justify-center gap-2 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" />
          <span>Loading frozen benchmark evidence...</span>
        </div>
      ) : (
        <>
          {/* TAB 1: CALIBRATION */}
          {activeTab === "calibration" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
                  <span className="text-[11px] text-[var(--content-secondary)] font-mono">Production ECE</span>
                  <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-2">
                    {data?.calibration?.production?.ece?.toFixed(4) ?? "0.4295"}
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] mt-1">Uncalibrated (T=0.50, τ=0.60)</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
                  <span className="text-[11px] text-[var(--content-secondary)] font-mono">Calibrated ECE</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                    {data?.calibration?.calibrated?.ece?.toFixed(4) ?? "0.1939"}
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] mt-1">Calibrated analysis threshold T*=1.70, τ*=0.84</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
                  <span className="text-[11px] text-[var(--content-secondary)] font-mono">Observed False-Positive Rate</span>
                  <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
                    0.0%
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] mt-1">Exact 95% Clopper-Pearson &le; 4.99% (0/72 false alarms)</span>
                </div>
                <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between">
                  <span className="text-[11px] text-[var(--content-secondary)] font-mono">Admission Coverage</span>
                  <div className="text-2xl font-bold font-mono text-[var(--accent)] mt-2">
                    16.7%
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] mt-1">83.3% selective abstention (100% precision, FDR bound &le; 13.72%)</span>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <h3 className="text-xs font-semibold text-[var(--content-primary)] mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Disjoint Partition Calibration Protocol (N = 300 Episodes: 150 Calibration / 150 Held-Out Test)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--content-secondary)]">
                      <tr>
                        <th className="p-3">Gate Configuration</th>
                        <th className="p-3">Threshold τ</th>
                        <th className="p-3">ECE</th>
                        <th className="p-3">Brier Score</th>
                        <th className="p-3">Admitted</th>
                        <th className="p-3">Abstained</th>
                        <th className="p-3">Observed FPR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                      <tr>
                        <td className="p-3 font-semibold text-amber-600 dark:text-amber-400">Production Gate (Baseline Runtime)</td>
                        <td className="p-3">τ = 0.60, T = 0.50</td>
                        <td className="p-3">0.4295</td>
                        <td className="p-3">0.8645</td>
                        <td className="p-3">144 / 150 (96.0%)</td>
                        <td className="p-3">6 / 150 (4.0%)</td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-semibold">95.8% (Uncalibrated)</td>
                      </tr>
                      <tr className="bg-emerald-500/5">
                        <td className="p-3 font-semibold text-emerald-600 dark:text-emerald-400">Calibrated Analysis Threshold (Research Analysis)</td>
                        <td className="p-3">τ* = 0.840, T* = 1.699</td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">0.1939 (-55%)</td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">0.5768 (-33%)</td>
                        <td className="p-3 font-bold">25 / 150 (16.7%)</td>
                        <td className="p-3">125 / 150 (83.3%)</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">0.0% (&le; 4.99% CI)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-3.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] text-[var(--content-secondary)] leading-relaxed">
                  <strong className="text-[var(--content-primary)]">Scientific Trade-off Disclosure:</strong> Temperature scaling (T*=1.70) and calibrated analysis thresholding (τ*=0.84) reduce observed false positive diagnoses to 0.0% (exact one-sided 95% Clopper-Pearson upper bound &le; 4.99%; 0/25 false discoveries with exact upper FDR bound &le; 13.72%), but this requires selective abstention on 83.33% of episodes (admission coverage drops from 96.0% down to 16.67%, with True Positive Rate of 32.05%). The calibrated threshold τ*=0.84 is an analytical investigation result; production runtime remains frozen at τ=0.60 to maintain operational admission coverage.</div>
              </div>
            </div>
          )}

          {/* TAB 2: POLICY REGRET */}
          {activeTab === "policy" && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-[var(--content-primary)] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                    Paired Policy Regret Benchmark (10 Random Seeds, 120 Episodes/Seed, Total N=1,200)
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--content-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                    Frozen Multi-Seed Record
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--content-secondary)]">
                      <tr>
                        <th className="p-3">Policy Arm</th>
                        <th className="p-3">Mean Reward r̄</th>
                        <th className="p-3">95% Confidence Interval</th>
                        <th className="p-3">Mean Regret R_T</th>
                        <th className="p-3">Success Rate</th>
                        <th className="p-3">Rollback Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                      <tr className="bg-[var(--accent)]/5 font-semibold">
                        <td className="p-3 text-[var(--accent)] flex items-center gap-1.5">
                          <span>★ Contextual Thompson Sampling</span>
                        </td>
                        <td className="p-3 font-bold text-[var(--content-primary)]">
                          -4.94 &plusmn; 0.28
                        </td>
                        <td className="p-3 text-[var(--content-secondary)]">
                          [-5.14, -4.74]
                        </td>
                        <td className="p-3 font-semibold">
                          12.69 &plusmn; 0.19
                        </td>
                        <td className="p-3 font-semibold">
                          23.3%
                        </td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">
                          10.7 &plusmn; 2.8% (Lowest)
                        </td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Greedy Exploitation</td>
                        <td className="p-3">-4.75 &plusmn; 0.76</td>
                        <td className="p-3 text-[var(--content-secondary)]">[-5.29, -4.20]</td>
                        <td className="p-3">12.65 &plusmn; 0.51</td>
                        <td className="p-3">25.3%</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">17.3 &plusmn; 4.3%</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Fixed Heuristic Rule</td>
                        <td className="p-3">-5.45 &plusmn; 0.78</td>
                        <td className="p-3 text-[var(--content-secondary)]">[-6.01, -4.89]</td>
                        <td className="p-3">12.38 &plusmn; 0.74</td>
                        <td className="p-3">12.3%</td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">23.0 &plusmn; 3.7% (2.1x surge)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">Uniform Random</td>
                        <td className="p-3">-5.01 &plusmn; 0.64</td>
                        <td className="p-3 text-[var(--content-secondary)]">[-5.46, -4.56]</td>
                        <td className="p-3">12.76 &plusmn; 0.46</td>
                        <td className="p-3">23.3%</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">16.3 &plusmn; 3.7%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] space-y-2 text-[11px] text-[var(--content-secondary)] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--content-primary)]">Statistical Rigor Disclosure:</strong> TS reward superiority is not statistically significant against the comparison policies across 10 paired seeds (TS vs Heuristic: <code className="font-mono text-[var(--content-primary)]">p = 0.0559</code>; TS vs Greedy: <code className="font-mono text-[var(--content-primary)]">p = 0.3282</code>; TS vs Random: <code className="font-mono text-[var(--content-primary)]">p = 0.6746</code>). The demonstrable advantages of Thompson Sampling are a 53.5% reduction in observed rollbacks (10.7% vs 23.0% for heuristic) and substantially lower seed-to-seed reward variability.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ABLATIONS */}
          {activeTab === "ablation" && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-[var(--content-primary)] flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[var(--accent)]" />
                    Component-Level Ablation Study (1,200 Executions)
                  </h3>
                  <span className="text-[11px] font-mono text-[var(--content-secondary)] bg-[var(--bg-primary)] px-2.5 py-1 rounded-lg border border-[var(--border-subtle)]">
                    Identifies Essential vs Redundant Architectural Components
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--content-secondary)]">
                      <tr>
                        <th className="p-3">Architecture Variant</th>
                        <th className="p-3">Success Rate</th>
                        <th className="p-3">Rollback Rate</th>
                        <th className="p-3">Execution Latency</th>
                        <th className="p-3">Circuit Evaluations</th>
                        <th className="p-3">Empirical Finding</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                      <tr className="bg-emerald-500/5 font-semibold">
                        <td className="p-3 text-emerald-700 dark:text-emerald-400">Full MAPE-K Framework</td>
                        <td className="p-3 font-bold">23.0 &plusmn; 4.8%</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-bold">9.3 &plusmn; 3.4%</td>
                        <td className="p-3">3.57 &plusmn; 0.08s</td>
                        <td className="p-3">191 &plusmn; 4.1</td>
                        <td className="p-3 text-emerald-700 dark:text-emerald-400">Optimal stability &amp; low rollback</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">w/o Digital Twin Proxy (H=3)</td>
                        <td className="p-3">23.7 &plusmn; 4.8%</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">10.3 &plusmn; 5.5%</td>
                        <td className="p-3">3.58 &plusmn; 0.07s</td>
                        <td className="p-3 font-bold text-blue-600 dark:text-blue-400">50 &plusmn; 0 (-3.8x overhead)</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400">3.8x overhead with no statistically significant rollback benefit</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-medium">w/o Episodic Failure Memory</td>
                        <td className="p-3">22.3 &plusmn; 2.2%</td>
                        <td className="p-3">10.0 &plusmn; 2.7%</td>
                        <td className="p-3">3.56 &plusmn; 0.04s</td>
                        <td className="p-3">185 &plusmn; 3.3</td>
                        <td className="p-3 text-[var(--content-secondary)]">Minimal impact on low-dimensional synthetic tasks</td>
                      </tr>
                      <tr className="bg-rose-500/5">
                        <td className="p-3 text-rose-700 dark:text-rose-400 font-semibold">w/o Safety Filter (Critical Invariant)</td>
                        <td className="p-3 text-rose-700 dark:text-rose-400">52.3 &plusmn; 17.2%</td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">34.0 &plusmn; 18.0% (3.7x surge)</td>
                        <td className="p-3">3.41 &plusmn; 0.17s</td>
                        <td className="p-3">215 &plusmn; 18.3</td>
                        <td className="p-3 text-rose-700 dark:text-rose-400 font-semibold">Catastrophic failure: deploys destructive mutations</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] text-[var(--content-secondary)] leading-relaxed">
                  <strong className="text-[var(--content-primary)]">Key Architectural Insight:</strong> The Safety Filter is the indispensable safety mechanism of the platform; removing it causes rollbacks to surge by 365%. In contrast, the Digital Twin lookahead adds a 3.8&times; circuit evaluation overhead while yielding no statistically distinguishable rollback reduction on low-depth benchmarks.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PER-CLASS RECOVERY */}
          {activeTab === "per_class" && (
            <div className="space-y-4">
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                <h3 className="text-xs font-semibold text-[var(--content-primary)] mb-4 flex items-center gap-2">
                  <Award className="w-4 h-4 text-[var(--accent)]" />
                  Per-Failure-Class Recovery &amp; Precision/Recall Matrix (N = 300, 50 Episodes / Class)
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono text-xs">
                    <thead className="bg-[var(--bg-primary)] border-b border-[var(--border-subtle)] text-[var(--content-secondary)]">
                      <tr>
                        <th className="p-3">Synthetic Failure Mode</th>
                        <th className="p-3">Precision</th>
                        <th className="p-3">Recall</th>
                        <th className="p-3">Rollback Rate</th>
                        <th className="p-3">Optimal Verified Repair Arm</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                      <tr>
                        <td className="p-3 font-semibold text-[var(--content-primary)]">Barren Plateau</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">100.0%</td>
                        <td className="p-3">64.0% (32/50)</td>
                        <td className="p-3">16.0%</td>
                        <td className="p-3 text-[var(--accent)]">Reduce Circuit Depth (L &rarr; L-1)</td>
                      </tr>
                      <tr className="bg-amber-500/5">
                        <td className="p-3 font-semibold text-amber-700 dark:text-amber-400">Persistent Plateau (Diagnostic Gap)</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">100.0%</td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">6.0% (3/50)</td>
                        <td className="p-3">6.0%</td>
                        <td className="p-3 text-[var(--accent)]">Modify Feature Map (Angle &harr; IQP)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[var(--content-primary)]">LR Misconfiguration</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">20.6%</td>
                        <td className="p-3">14.0% (7/50)</td>
                        <td className="p-3">46.0%</td>
                        <td className="p-3 text-[var(--accent)]">Adjust Learning Rate (&eta; scaling)</td>
                      </tr>
                      <tr className="bg-rose-500/5">
                        <td className="p-3 font-semibold text-rose-700 dark:text-rose-400">Optimizer Instability (Total Gap)</td>
                        <td className="p-3 text-[var(--content-tertiary)] italic">Undefined (0/0)</td>
                        <td className="p-3 text-rose-600 dark:text-rose-400 font-bold">0.0% (0/50)</td>
                        <td className="p-3">42.0%</td>
                        <td className="p-3 text-[var(--accent)]">Change Optimizer (Reset momentum)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[var(--content-primary)]">Training Divergence</td>
                        <td className="p-3 text-emerald-600 dark:text-emerald-400 font-semibold">100.0%</td>
                        <td className="p-3">64.0% (32/50)</td>
                        <td className="p-3">46.0%</td>
                        <td className="p-3 text-[var(--accent)]">Warm Restart (Near-identity)</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-semibold text-[var(--content-primary)]">Noise Degradation</td>
                        <td className="p-3 text-amber-600 dark:text-amber-400 font-semibold">35.0%</td>
                        <td className="p-3">72.0% (36/50)</td>
                        <td className="p-3">24.0%</td>
                        <td className="p-3 text-[var(--accent)]">Noise Mitigation (Inverse contraction)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-[11px] text-[var(--content-secondary)] leading-relaxed">
                  <strong className="text-[var(--content-primary)]">Transparent Limitations:</strong> The Bayesian diagnostic engine achieves 0.0% recall on Optimizer Instability and only 6.0% recall on Persistent Plateau, because high-frequency stochastic oscillations mimic non-faulty exploration steps under standard window sizes ($W=5$). Future iterations require expanded sliding windows and Fisher information spectrum features.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
