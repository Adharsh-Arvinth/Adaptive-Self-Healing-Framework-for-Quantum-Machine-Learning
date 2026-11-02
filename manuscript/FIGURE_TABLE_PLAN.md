# Manuscript Figure and Table Publication Plan

**Project:** Adaptive Self-Healing Framework for Quantum Machine Learning  
**Target Submission:** IEEE Transactions on Quantum Engineering (IEEE TQE) / Quantum Science and Technology (QST)  
**Baseline Git Commit:** `7d37201aead20c7e5678585c998b51206bc49339`  

---

## 1. Publication Figure Plan

All figures are programmatically generated at 300 DPI (raster PNG) and scalable vector format (PDF) via [`scripts/generate_publication_figures.py`](file:///c:/Users/adhar/Desktop/capstone/scripts/generate_publication_figures.py).

### Figure 1: Reliability Diagrams & Systematic Probability Calibration
- **Source Files:**
  - PDF: `benchmark_results/figures/figure1_calibration_reliability.pdf` (`SHA-256: e00051c8c3f5...`)
  - PNG: `benchmark_results/figures/figure1_calibration_reliability.png` (`SHA-256: e0ca237de4eb...`)
- **Data Source:** `benchmark_results/calibration_n300_results.json`
- **Caption:**  
  *Figure 1. Empirical reliability diagrams and calibration curves on the unseen test partition ($N = 150$, seeds 1006–1010). (a) Production diagnostic pipeline ($T_{\text{prod}} = 0.50, \tau = 0.60$), showing severe overconfidence across confidence bins and an ECE of $0.430$. (b) Post-temperature calibration ($T^* = 1.70, \tau^* = 0.84$), achieving an ECE of $0.194$ and a multiclass Brier score of $0.577$, with bin counts ($n$) annotated.*
- **Column Span:** Two-column width ($10 \times 4.2$ inches).

### Figure 2: Multi-Seed Cumulative Reward & Benchmark-Defined Regret Gap
- **Source Files:**
  - PDF: `benchmark_results/figures/figure2_policy_regret_trajectories.pdf` (`SHA-256: a669865b8621...`)
  - PNG: `benchmark_results/figures/figure2_policy_regret_trajectories.png` (`SHA-256: 747caca55f5e...`)
- **Data Source:** `benchmark_results/policy_regret_benchmark.json`
- **Caption:**  
  *Figure 2. Empirical learning curves across 30 sequential failure episodes evaluated across 10 paired random seeds ($N = 1,200$ total circuit episodes). Shaded regions denote 95% confidence intervals across seeds. (a) Cumulative multi-objective self-healing reward $\sum r_t$. (b) Cumulative benchmark-defined reference-reward gap $\sum (r_{\text{ref}} - r_t)$, illustrating that Contextual Thompson Sampling achieves comparable reward to greedy optimization while maintaining substantially lower variance.*
- **Column Span:** Two-column width ($11 \times 4.5$ inches).

### Figure 3: Architectural Ablation Analysis
- **Source Files:**
  - PDF: `benchmark_results/figures/figure3_ablation_performance.pdf` (`SHA-256: 9ced75e10add...`)
  - PNG: `benchmark_results/figures/figure3_ablation_performance.png` (`SHA-256: 53c25b3e212d...`)
- **Data Source:** `benchmark_results/ablation_study_results.json`
- **Caption:**  
  *Figure 3. Component ablation analysis across 10 random seeds ($N = 1,200$ episodes). Bar heights denote mean rates with error bars indicating standard deviation ($\pm 1\sigma$). Disabling the Safety Filter causes destructive rollbacks to jump from $9.3\%$ to $34.0\%$, verifying its role as an indispensable operational shield.*
- **Column Span:** Single/1.5-column width ($8.5 \times 4.2$ inches).

### Figure 4: Per-Class Diagnostic Confusion Matrix & Recovery Success
- **Source Files:**
  - PDF: `benchmark_results/figures/figure4_per_class_confusion_and_repairs.pdf` (`SHA-256: 51b804dab6e3...`)
  - PNG: `benchmark_results/figures/figure4_per_class_confusion_and_repairs.png` (`SHA-256: f9b7778b9e38...`)
- **Data Source:** `benchmark_results/per_class_performance.json`
- **Caption:**  
  *Figure 4. Granular diagnostic and recovery breakdown across six failure modes ($N = 300$ episodes, 50 per category). (a) Normalized diagnostic classification matrix. (b) Diagnostic F1-score versus closed-loop recovery success rate. For optimizer instability, precision and F1 are mathematically undefined due to zero positive predictions; recall is $0.0\%$ (95% CI: $[0.0\%, 7.1\%]$).*
- **Column Span:** Two-column width ($11.5 \times 4.8$ inches).

### Figure 5: Dynamic Closed-Loop Recovery Trajectory
- **Source Files:**
  - PDF: `benchmark_results/figures/figure5_dynamic_recovery_trace.pdf` (`SHA-256: 5798bd6cc102...`)
  - PNG: `benchmark_results/figures/figure5_dynamic_recovery_trace.png` (`SHA-256: 9fc404708328...`)
- **Data Source:** Deterministic physical trace generated in `scripts/generate_publication_figures.py`
- **Caption:**  
  *Figure 5. Continuous step-by-step telemetry trace of an autonomous self-healing episode under induced quantum noise degradation. (a) Training and validation loss dynamics through nominal training, failure injection, Digital Twin validation window ($W_{\text{val}} = 3$), and post-commit convergence. (b) Parameter-shift gradient norm stability. (c) Physical Bloch vector radius $r$ and mixed-state purity $\gamma = (1 + r^2)/2$.*
- **Column Span:** Single/Two-column vertical stack ($9.5 \times 7.5$ inches).

---

## 2. Publication Table Plan

| Table # | Title / Objective | Location in Manuscript | Data Provenance |
| :---: | :--- | :--- | :--- |
| **Table 1** | Systematic Probability Calibration on Unseen Test Split ($N = 150$) | Section VII.A | `benchmark_results/calibration_n300_results.json` |
| **Table 2** | Multi-Seed Policy Performance Across 10 Evaluation Seeds ($N = 1,200$) | Section VII.B | `benchmark_results/policy_regret_benchmark.json` |
| **Table 3** | Architectural Ablation Study Across 10 Evaluation Seeds ($N = 1,200$) | Section VII.C | `benchmark_results/ablation_study_results.json` |
| **Table 4** | Granular Diagnostic Performance by Failure Category ($N = 300$) | Section VII.D | `benchmark_results/per_class_performance.json` |
