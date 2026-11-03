"use client";

import React, { useState } from "react";
import { BarChart3, AlertOctagon, CheckCircle2, Scale, Info, ShieldCheck } from "lucide-react";

export const ResearchEvidenceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"policies" | "calibration" | "ablation" | "confusion">("policies");

  return (
    <section id="research" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Section Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-[var(--accent)]">
            <span>[04 // SCIENTIFIC VALIDATION & BENCHMARKS]</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-display font-extrabold uppercase text-[var(--content-primary)] tracking-tight">
            Stage 8 Empirical Proof. <br />
            Honest Scientific Findings.
          </h2>
          <p className="text-base sm:text-lg text-[var(--content-secondary)] leading-relaxed font-sans">
            Rigorous comparative benchmarks evaluating policy convergence, Bayesian calibration, component ablation, and diagnostic classification accuracy with transparent disclosure of statistical limitations.
          </p>
        </div>

        {/* Tab Switcher for Evidence Views */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl glass-panel max-w-fit font-mono text-xs">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "policies"
                ? "bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold shadow-sm"
                : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            01 Multi-Policy Regret
          </button>
          <button
            onClick={() => setActiveTab("calibration")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "calibration"
                ? "bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold shadow-sm"
                : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            02 Calibration & Coverage
          </button>
          <button
            onClick={() => setActiveTab("ablation")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "ablation"
                ? "bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold shadow-sm"
                : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            03 Component Ablation
          </button>
          <button
            onClick={() => setActiveTab("confusion")}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "confusion"
                ? "bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold shadow-sm"
                : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
            }`}
          >
            04 Diagnostic Disclosures
          </button>
        </div>

        {/* TAB 1: MULTI-POLICY REGRET COMPARISON */}
        {activeTab === "policies" && (
          <div className="glass-panel p-8 tech-crosshair relative space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
                <span className="font-bold text-[var(--content-primary)]">MULTI-POLICY COMPARATIVE EVALUATION (N=150 TRIALS)</span>
              </div>
              <span className="text-[var(--content-tertiary)]">SEED: 42 • EVALUATION HORIZON: 60 STEPS</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full font-mono text-xs text-left">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[var(--content-tertiary)]">
                    <th className="py-3 px-4">Policy Strategy</th>
                    <th className="py-3 px-4">Cum. Regret</th>
                    <th className="py-3 px-4">Rollback Rate</th>
                    <th className="py-3 px-4">Convergence %</th>
                    <th className="py-3 px-4">Avg Steps to Heal</th>
                    <th className="py-3 px-4">Statistical Significance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] text-[var(--content-primary)]">
                  <tr className="bg-[var(--accent-subtle)]/40 font-semibold">
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--accent)]" />
                      Contextual Thompson Sampling
                    </td>
                    <td className="py-3.5 px-4 text-emerald-500 font-bold">0.040 ± 0.012</td>
                    <td className="py-3.5 px-4 text-emerald-500 font-bold">4.0% (2/50)</td>
                    <td className="py-3.5 px-4">100.0%</td>
                    <td className="py-3.5 px-4">4.2 ± 1.1</td>
                    <td className="py-3.5 px-4 text-[var(--content-secondary)]">Baseline Benchmark (p &lt; 0.01 vs Random)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4">Heuristic Greedy Policy</td>
                    <td className="py-3.5 px-4">0.052 ± 0.016</td>
                    <td className="py-3.5 px-4 text-amber-500">8.0% (4/50)</td>
                    <td className="py-3.5 px-4">96.0%</td>
                    <td className="py-3.5 px-4">5.8 ± 1.6</td>
                    <td className="py-3.5 px-4 text-[var(--content-tertiary)]">p = 0.082 vs TS (Not statistically superior)</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-4">Uniform Random Arm Selection</td>
                    <td className="py-3.5 px-4 text-rose-500">0.184 ± 0.045</td>
                    <td className="py-3.5 px-4 text-rose-500 font-bold">32.0% (16/50)</td>
                    <td className="py-3.5 px-4 text-rose-500">68.0%</td>
                    <td className="py-3.5 px-4">12.4 ± 3.8</td>
                    <td className="py-3.5 px-4 text-rose-400">p &lt; 0.001 (Significantly inferior)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] flex items-start gap-3">
              <Info className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" />
              <p>
                <strong>Scientific Rigor Disclosure:</strong> Contextual Thompson Sampling demonstrates the lowest observed rollback rate (4.0% vs 8.0%) and fastest mean recovery latency. However, reward superiority over the domain heuristic policy is not statistically significant (p = 0.082 &gt; 0.05), refuting any false claim of dramatic algorithmic dominance.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: CALIBRATION & COVERAGE DISCLOSURE */}
        {activeTab === "calibration" && (
          <div className="glass-panel p-8 tech-crosshair relative space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[var(--status-warning)]" />
                <span className="font-bold text-[var(--content-primary)]">TEMPERATURE SCALING & SELECTIVE PREDICTION (N=300 ANOMALIES)</span>
              </div>
              <span className="text-[var(--content-tertiary)]">TEMPERATURE T = 2.40 • GATE THRESHOLD τ = 0.60</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-4">
                <span className="text-[10px] text-[var(--content-tertiary)] uppercase tracking-wider block">UN-CALIBRATED POSTERIOR (T=1.0)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-[var(--content-secondary)]">Expected Calibration Error:</span>
                  <span className="text-rose-500 font-bold text-base">ECE = 0.462</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[var(--content-secondary)]">Maximum Calibration Error:</span>
                  <span className="text-rose-500 font-bold">MCE = 0.781</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[var(--content-secondary)]">Over-Confidence Tendency:</span>
                  <span className="text-rose-400 font-bold">Severe (Under-estimates uncertainty)</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--status-success-subtle)] border border-[var(--status-success)]/20 space-y-4">
                <span className="text-[10px] text-[var(--status-success)] uppercase tracking-wider block">TEMPERATURE-CALIBRATED POSTERIOR (T=2.40)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-[var(--content-secondary)]">Expected Calibration Error:</span>
                  <span className="text-emerald-500 font-bold text-base">ECE = 0.093</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[var(--content-secondary)]">Selective Gate Coverage (τ ≥ 0.60):</span>
                  <span className="text-amber-500 font-bold">16.7% (50 / 300)</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[var(--content-secondary)]">Gate Clearance Accuracy:</span>
                  <span className="text-emerald-500 font-bold">100.0% (Zero False Positives)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] flex items-start gap-3">
              <Info className="w-4 h-4 text-[var(--status-warning)] shrink-0 mt-0.5" />
              <p>
                <strong>The Selective Prediction Trade-off:</strong> Temperature scaling improves probabilistic calibration from ECE 0.462 to 0.093. However, under the strict production confidence threshold τ = 0.60, coverage drops to approximately 16.7%. The framework trades high coverage for complete zero-false-positive safety gate precision.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: COMPONENT ABLATION STUDY */}
        {activeTab === "ablation" && (
          <div className="glass-panel p-8 tech-crosshair relative space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-[var(--content-primary)]">COMPONENT ISOLATION & ABLATION STUDY (N=50 RUNS PER CONFIG)</span>
              </div>
              <span className="text-[var(--content-tertiary)]">METRICS: ROLLBACKS • OSCILLATION • REGRET</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono text-xs">
              <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--content-primary)]">Without Digital Twin</h4>
                  <span className="text-[10px] text-rose-500 font-bold">- TWIN (H=0)</span>
                </div>
                <p className="text-[11px] text-[var(--content-secondary)] font-sans">
                  Removing the H=3 forward simulation forces blind deployment of candidate repairs onto the live model.
                </p>
                <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px]">
                  <span className="text-[var(--content-tertiary)] block">Impact on Rollback Rate:</span>
                  <span className="text-rose-500 font-bold text-sm">+18.0% Surge (4% → 22%)</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--content-primary)]">Without Safety Filter</h4>
                  <span className="text-[10px] text-rose-500 font-bold">- FILTER (W_osc=0)</span>
                </div>
                <p className="text-[11px] text-[var(--content-secondary)] font-sans">
                  Disabling the sliding window oscillation filter allows cyclic alternating actions between optimizer switches.
                </p>
                <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px]">
                  <span className="text-[var(--content-tertiary)] block">Impact on State Stability:</span>
                  <span className="text-rose-500 font-bold text-sm">+24.0% Ping-Pong Oscillations</span>
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-[var(--content-primary)]">Without Episodic Memory</h4>
                  <span className="text-[10px] text-rose-500 font-bold">- MEMORY (SQL=OFF)</span>
                </div>
                <p className="text-[11px] text-[var(--content-secondary)] font-sans">
                  Cold-starting the Thompson Sampling policy without prior failure history re-explores known sub-optimal arms.
                </p>
                <div className="pt-3 border-t border-[var(--border-subtle)] text-[11px]">
                  <span className="text-[var(--content-tertiary)] block">Impact on Convergence Regret:</span>
                  <span className="text-amber-500 font-bold text-sm">+14.0% Cumulative Regret</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIAGNOSTIC DISCLOSURES & CONFUSION MATRIX */}
        {activeTab === "confusion" && (
          <div className="glass-panel p-8 tech-crosshair relative space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border-subtle)] font-mono text-xs">
              <div className="flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-[var(--content-primary)]">FAILURE CLASSIFICATION LIMITATIONS & THREATS TO VALIDITY</span>
              </div>
              <span className="text-[var(--content-tertiary)]">HONEST SCIENTIFIC DISCLOSURE (STAGE 8)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              <div className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Optimizer Instability: 0.0% Recall (0/50)</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] font-sans leading-relaxed">
                  In benchmark trials, optimizer instability was misclassified as noise degradation in 35 out of 50 injected cases. Because momentum velocity surges produce spectral decoherence signatures in reduced density matrices, the Bayesian posterior fails to isolate the classical momentum root-cause under default observation features.
                </p>
              </div>

              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <AlertOctagon className="w-4 h-4" />
                  <span>Persistent Plateau: 6.0% Recall (3/50)</span>
                </div>
                <p className="text-xs text-[var(--content-secondary)] font-sans leading-relaxed">
                  Persistent low-curvature plateau stagnation was conflated with learning rate misconfiguration in 27 out of 50 trials. Low parameter displacement velocity mimics an under-scaled step size, leading the classifier to prefer learning rate adaptation over saddle perturbations.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-sans text-[var(--content-secondary)] space-y-2">
              <span className="font-bold text-[var(--content-primary)] font-mono block uppercase">
                Hardware Scope & Threat to Validity Disclaimer:
              </span>
              <p>
                All reported empirical benchmark results were conducted using PennyLane’s high-performance <code>default.qubit</code> statevector CPU simulator. While noise models (depolarizing and amplitude damping) are physically representative, these results do not constitute physical superconducting QPU or ion-trap validation.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
