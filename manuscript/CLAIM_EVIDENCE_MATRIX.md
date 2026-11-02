# Claim-Evidence Verification Matrix

**Project:** Adaptive Self-Healing Framework for Quantum Machine Learning  
**Baseline Git Commit:** `7d37201aead20c7e5678585c998b51206bc49339`  

This matrix maps every empirical assertion, statistical comparison, and architectural claim made in `MANUSCRIPT_DRAFT.md` directly to verified code implementations and raw experimental artifacts in `benchmark_results/`.

---

## 1. Empirical Performance Claims

| Claim ID | Paper Claim Statement | Supporting Evidence File & Keys | Raw Numerical Data | Statistical Test / Confidence Bound | Audit Status |
| :---: | :--- | :--- | :--- | :--- | :---: |
| **CLM-01** | Temperature scaling ($T^*=1.70$) reduces ECE on unseen test data from $0.430$ to $0.194$ ($-54.9\%$). | `benchmark_results/calibration_n300_results.json` -> `test_split_metrics` | Production ECE: $0.4295$<br>Calibrated ECE: $0.1939$ | Evaluated across $N = 150$ disjoint test samples (seeds 1006-1010). | **VERIFIED** |
| **CLM-02** | Calibration reduces multiclass Brier score from $0.865$ to $0.577$ ($-33.3\%$). | `benchmark_results/calibration_n300_results.json` -> `test_split_metrics` | Production: $0.8645$<br>Calibrated: $0.5768$ | Outperforms $0.8333$ uniform baseline. | **VERIFIED** |
| **CLM-03** | Calibrated gate admits zero false positives on test sample, with 95% Clopper-Pearson FPR upper bound $\le 4.99\%$. | `benchmark_results/calibration_n300_results.json` -> `test_raw_records` | Admitted: $25$<br>False Positives: $0$<br>Condition Negatives: $72$ | Exact Clopper–Pearson 95% CI on FPR: $[0.00\%, 4.99\%]$. | **VERIFIED** |
| **CLM-04** | False discovery rate (FDR) on admitted cases has 95% Clopper-Pearson upper bound of $13.72\%$ (Rule of Three: $12.00\%$). | `scripts/audit_stage8.py` -> `Item 2` | Admitted: $25$<br>False Discoveries: $0$ | Clopper-Pearson upper bound: $13.72\%$; Rule of Three: $3/25 = 12.00\%$. | **VERIFIED** |
| **CLM-05** | Thompson Sampling cuts destructive rollbacks by $>50\%$ relative to static heuristics ($10.7\%$ vs $23.0\%$). | `benchmark_results/policy_regret_benchmark.json` -> `summary` | TS Rollback: $10.7\% \pm 2.8\%$<br>Heuristic: $23.0\% \pm 3.7\%$ | Paired 10-seed reduction across $N = 300$ decisions/policy. | **VERIFIED** |
| **CLM-06** | Thompson Sampling achieves superior seed stability ($\sigma = 0.28$) compared to greedy ($\sigma = 0.76$) and heuristic ($\sigma = 0.78$). | `benchmark_results/policy_regret_benchmark.json` -> `detailed_results` | TS Reward: $-4.94 \pm 0.28$<br>Greedy: $-4.75 \pm 0.76$<br>Heuristic: $-5.45 \pm 0.78$ | Sample standard deviations across 10 paired seeds ($ddof = 1$). | **VERIFIED** |
| **CLM-07** | Mean cumulative reward difference between TS and Greedy is not statistically significant. | `scripts/audit_stage8.py` -> `Item 3` | $\Delta = -0.191 \pm 0.583$ | Paired Student's $t = -1.034, p = 0.3282$; Wilcoxon $W = 16.0, p = 0.2754$. | **VERIFIED** |
| **CLM-08** | Removing Safety Filter causes rollbacks to surge from $9.3\%$ to $34.0\%$. | `benchmark_results/ablation_study_results.json` -> `summary` | Full: $9.3\% \pm 3.4\%$<br>No Safe: $34.0\% \pm 18.0\%$ | Paired 10-seed $t$-test: $p < 0.001$. | **VERIFIED** |
| **CLM-09** | Digital twin proxy simulation imposes $3.8\times$ circuit evaluation overhead with no significant difference in success rate. | `benchmark_results/ablation_study_results.json` -> `detailed_results` | Full: $191.0 \pm 4.1$ evals<br>No Twin: $50.0 \pm 0.0$ evals | Paired $t$-test on success: $t = -0.28, p = 0.7895$. | **VERIFIED** |
| **CLM-10** | Barren plateaus and training divergences are detected with $100.0\%$ precision. | `benchmark_results/per_class_performance.json` -> `confusion_matrix` | Barren Plateau: $32$ TP, $0$ FP<br>Divergence: $32$ TP, $0$ FP | Wilson 95% Precision CI: $[89.3\%, 100.0\%]$. | **VERIFIED** |
| **CLM-11** | Precision and F1 for `optimizer_instability` are undefined due to 0 positive predictions, with recall = $0.0\%$. | `benchmark_results/per_class_performance.json` -> `confusion_matrix` | TP: $0$, FP: $0$, FN: $50$ | Precision: Undefined ($0/0$); Wilson 95% Recall CI: $[0.0\%, 7.1\%]$. | **VERIFIED** |

---

## 2. Architectural & Implementation Claims

| Architecture Claim | Code Implementation Location | Mathematical Verification |
| :--- | :--- | :--- |
| **12D Telemetry Embedding** | `backend/monitoring.py` -> `build_failure_embedding()` | Mathematical bounds verified: $x \in [-1, 1]^{12}$; zero-gradient variance fallback implemented. |
| **Bloch Sphere Purity** | `backend/qml_model.py` -> `get_bloch_coordinates()` | Formula verified: $\gamma = \frac{1 + \|\mathbf{r}\|_2^2}{2}$; contracts under noise: $\mathbf{r}_{\text{noisy}} = \max(0.1, 1 - 0.5\lambda)\mathbf{r}_{\text{ideal}}$. |
| **Digital Twin Parameter Isolation** | `backend/digital_twin.py` -> `simulate_candidate()` | Live circuit parameter arrays deep-copied; assertions enforce `np.array_equal(model.params, expected_params, equal_nan=True)`. |
| **Safety Shield Anti-Oscillation** | `backend/safety_filter.py` -> `filter_candidates()` | Window of $K = 5$ prior repairs tracked; cycles blocked by directed configuration transition graph. |
| **Contextual Thompson Sampling** | `backend/bandit.py` -> `select_arm()`, `update()` | Conjugate Normal-Inverse-Gamma Bayesian regression updates verified without dimension mismatch. |
| **Safe Rollback & Checkpointing** | `backend/deployment.py` -> `create_checkpoint()`, `restore_checkpoint()` | Immutable dictionary snapshots: parameters, optimizer momentum, random generator states. |
