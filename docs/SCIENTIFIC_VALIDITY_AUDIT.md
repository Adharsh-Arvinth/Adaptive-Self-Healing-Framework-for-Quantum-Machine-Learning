# Scientific Validity Audit

**Document Reference:** `SCIENTIFIC_VALIDITY_AUDIT.md`  
**Framework:** Adaptive Self-Healing Framework for Quantum Machine Learning  
**Audit Phase:** Stage 7.5 Independent Research-Readiness Audit  
**Author:** Research Scientist & Lead Quantum ML Architect  
**Status:** Scientifically Evaluated & Defensible  

---

## 1. Physical vs Synthetic Failure Injections

In quantum machine learning, failure modes arise from both quantum phenomena (expressibility saturation, noise channels) and classical optimization anomalies. A core scientific requirement is distinguishing between genuine structural quantum failures and controlled synthetic surrogates used for detector sensitivity benchmarks.

| Failure Category | Physical Mechanism in Quantum Computing | Implementation in Framework | Scientific Validity Assessment |
|---|---|---|---|
| **Barren Plateau (Structural)** | Exponential concentration of measure under Haar-random unitary 2-designs; $\text{Var}_{\boldsymbol{\theta}}[\partial_{\theta} \langle O \rangle] \in \mathcal{O}(2^{-n})$. | `inject_failure(..., mode="structural")`: Expands depth to $L = 8$ and samples parameters uniformly from $[0, 2\pi]$ across all qubits. | **Genuine Physical Phenomenon.** Creates genuine dimensional expressivity saturation and gradient vanishing on the circuit landscape. |
| **Barren Plateau (Synthetic)** | Flat gradient landscape surrogate. | `inject_failure(..., mode="default")`: Attenuates gradients by $10^{-6}$. | **Controlled Synthetic Surrogate.** Must be documented as an artificial gradient attenuation surrogate used for detector sensitivity testing, not presented as proof of genuine barren plateau discovery. |
| **Learning Rate Misconfiguration** | Classical optimizer divergence from excessive step size; parameter oscillations across narrow quantum loss valleys. | `inject_failure(LR_MISCONFIGURATION)`: Multiplies learning rate by $50\times$, destabilizing parameter updates. | **Realistic Algorithmic Failure.** Faithfully reproduces optimizer limit cycles and loss explosion seen in uncalibrated VQC training. |
| **Optimizer Instability** | Momentum buffer corruption; gradient misalignment in classical adaptive moment estimation. | `inject_failure(OPTIMIZER_INSTABILITY)`: Inverts momentum vector $\mathbf{m} \to -10 \mathbf{m}$ and perturbs $\beta_1, \beta_2$. | **Realistic Optimization Defect.** Tests framework's ability to diagnose and reset corrupted classical optimizer buffers. |
| **Training Divergence** | Numerical overflow / division by zero in loss computation producing non-finite tensors. | `inject_failure(TRAINING_DIVERGENCE)`: Sets parameter tensor to `NaN`. | **Standard Numerical Failure Mode.** Validates atomic checkpoint rollback state-machine under catastrophic error. |
| **Persistent Loss Plateau** | Saddle-point traps in non-convex quantum landscape where $\|\nabla \mathcal{L}\| > 0$ but loss delta $\Delta \mathcal{L} \approx 0$. | `inject_failure(PERSISTENT_PLATEAU)`: Freezes parameter updates while retaining active non-vanishing parameter-shift gradients. | **Realistic Optimization Trap.** Distinct from barren plateaus; gradients are non-zero but trajectory is trapped. |
| **Noise-Related Degradation** | Depolarizing quantum noise and measurement readout infidelity contracting the state towards maximally mixed state $I/2^n$. | `inject_failure(NOISE_DEGRADATION)`: Injects depolarizing contraction and readout noise into expectation values. | **Faithful Phenomenological Noise Model.** Contracts the Bloch vector radially inwards and collapses validation classification accuracy. |

---

## 2. Ground Truth & Diagnostic Benchmark Integrity

In Stage 3 benchmarking (`docs/stage3_detection_benchmark.json`):
- **Ground Truth Establishment:** Each failure mode was injected via controlled function calls with known ground-truth labels across 30 independent trials (5 trials per category).
- **False Positive Baseline:** Nominal unperturbed VQC training was evaluated across 3 independent random seeds over 45 total steps. The anomaly detector produced **0 false alarms (FPR = 0.00%)**, verifying that natural convergence does not trigger spurious repairs.
- **Confidence Gate Efficacy:** When diagnostic evidence yielded confidence $< 0.60$ (e.g., initial transition steps), the framework successfully abstained via `CONFIDENCE_GATE_HOLD`, eliminating ungrounded parameter mutations.

---

## 3. Data Leakage & Partition Isolation

A common flaw in automated machine learning (AutoML) systems is evaluating candidate repairs on the test set or leaking validation data into primary model training:
1. **Partitioning:** Datasets (Moons, Circles, Iris) are partitioned using deterministic 70/30 stratified splits:
   $$\mathcal{D} = \mathcal{D}_{\text{train}} \cup \mathcal{D}_{\text{val}}, \quad \mathcal{D}_{\text{train}} \cap \mathcal{D}_{\text{val}} = \emptyset$$
2. **Digital Twin Proxy Optimization:** Proxy simulations draw mini-batches strictly from $\mathcal{D}_{\text{val}}$ to assess generalization improvement.
3. **Primary Model Training:** The primary VQC model trains strictly on $\mathcal{D}_{\text{train}}$. The isolated twin's parameter updates are discarded; only hyperparameter configurations are deployed. No parameters trained on $\mathcal{D}_{\text{val}}$ enter the primary model weights.

---

## 4. Fair Baseline Comparisons

In the policy regret benchmark (`tests/test_bandit_digital_twin.py::TestPolicyRegretBenchmark`):
- **Equivalent Operational Permissions:** All four comparison policies (Contextual Thompson Sampling, Greedy, Fixed Rule Heuristic, Random Selection) operated under identical conditions:
  - Exact same candidate repairs generated by `RepairLibrary`.
  - Exact same `SafetyFilter` constraints ($K_{\text{osc}} = 4$, $\eta \in [10^{-4}, 1.0]$, $L \ge 1$).
  - Exact same multi-objective reward function and weights.
- **Empirical Significance:** Evaluated across 3 independent random seeds over 50 decision episodes:
  - Contextual Thompson Sampling: Cumulative Reward $= +8.42 \pm 1.59$, Regret $= 25.75 \pm 1.56$.
  - Random Uniform Selection: Cumulative Reward $= -9.98 \pm 0.10$, Regret $= 43.98 \pm 0.10$.
  - Contextual Thompson Sampling outperformed Random Selection by $+18.40$ reward points ($\Delta = +184\%$), confirming statistically meaningful policy learning.

---

## 5. Strict Separation of Predicted vs Actual Rewards

In `backend/pipeline.py` and `backend/evaluation.py`:
- `predicted_reward`: Estimated by `DigitalTwinSimulator` *prior* to deployment:
  $$\hat{r} = \tanh\left(\frac{\mathcal{L}_0 - \mathcal{L}_{\text{proxy}, H}}{\mathcal{L}_0 + 10^{-8}}\right)$$
- `actual_reward`: Evaluated by `EvaluationEngine` *after* $W_{\text{val}} = 3$ validation steps on the live model.
- **Posterior Update Integrity:** The Bayesian linear regression posteriors in `backend/bandit.py` are updated **strictly with `actual_reward`** (lines 437–441 of `pipeline.py`). Proxy predictions are never used as ground truth for bandit posterior updates.

---

## 6. Diagnosis Confidence Calibration Analysis

In compliance with supplementary research-readiness standards, diagnosis probability calibration was evaluated using $N = 60$ controlled ground-truth failure injections across 10 independent random seeds:

### 6.1 Brier Score Conventions & Formulation
Under the standard multi-category formulation (Brier, 1950):
$$\text{BS}_{\text{mc}} = \frac{1}{N} \sum_{i=1}^N \sum_{c=1}^C (p_{ic} - y_{ic})^2 \in [0.0, 2.0]$$
where $C = 6$ failure categories, $y_{ic} \in \{0, 1\}$ is the one-hot ground-truth indicator.
- **Analytical Uniform Baseline:**
  $$\text{BS}_{\text{uniform}} = \left(\frac{1}{6} - 1\right)^2 + 5 \cdot \left(\frac{1}{6} - 0\right)^2 = \frac{25}{36} + \frac{5}{36} = \frac{30}{36} = \frac{5}{6} \approx \mathbf{0.8333}$$
  *(Under the normalized MSE convention $\text{BS}_{\text{norm}} = \frac{1}{2C} \sum (p - y)^2 \in [0, 1]$, the baseline is $\frac{5}{12} \approx 0.4167$)*.

### 6.2 Investigation of Reliability Diagram Bin $[0.0, 0.2)$ & Metric Reconciliation
In preliminary scratch test reporting, bin $[0.0, 0.2)$ recorded `count = 4` with `mean_confidence = 0.0000`.
- **Root Cause:** In 4 of the 60 trials, the upstream anomaly detector did not trigger within 6 steps, leading the scratch script to artificially record `confidence = 0.0` and inject a maximal squared error penalty of $2.0$.
- **Mathematical Invariant:** Primary diagnosis confidence is defined as $\hat{p}_i = \max_c p_{ic}$. For $C=6$ normalized softmax classes, the analytical minimum is $\min(\max_c p_c) \ge 1/6 \approx 0.1667$. A normalized softmax can never produce a maximum confidence of $0.0000$.
- **Reconciliation of $0.8707$:** The previously reported multiclass score was derived as $\frac{56 \times 0.79007 + 4 \times 2.0}{60} = 0.87073$.
- **Consistent Benchmarks:**
  1. *Diagnosis-Conditional ($N = 56$ diagnosed trials):* $\text{BS}_{\text{mc}} = \mathbf{0.7901} < \text{BS}_{\text{uniform}} (0.8333)$, $\text{BS}_{\text{bin}} = \mathbf{0.3656}$, $\text{ECE} = \mathbf{0.3999}$. (Min confidence observed: $0.5671$; Bin $[0.0, 0.2)$: count $= 0$).
  2. *Full Closed-Loop Pipeline ($N = 60$ trials with $p_c = 1/6$ fallback):* $\text{BS}_{\text{mc}} = \mathbf{0.7930} < \text{BS}_{\text{uniform}} (0.8333)$, $\text{BS}_{\text{bin}} = \mathbf{0.3430}$, $\text{ECE} = \mathbf{0.3843}$. (Bin $[0.0, 0.2)$: count $= 4$, mean confidence $= 0.1667$).

### 6.3 Gate Threshold Status ($\tau = 0.60$)
- **Provisional & Uncalibrated Designation:** The current operational threshold $\tau = 0.60$ is an engineering heuristic, not a calibrated decision boundary.
- **Empirical Trade-Off ($N = 60$):**
  - Abstention Rate: $11.67\%$ (7 abstentions out of 60 trials held in `CONFIDENCE_GATE_HOLD`).
  - Precision at Gate: $54.72\%$ ($29 / 53$ accepted initial diagnoses correct).
  - Recall at Gate: $90.62\%$ ($29 / 32$ identifiable faults admitted to repair).
- **Small-Sample Limitations ($N = 60$):**
  The sample size of 60 observations (10 per category) is an exploratory sensitivity test bed, insufficient for asymptotic calibration guarantees.

### 6.4 Reproducible Stage 8 Calibration Protocol
1. **Seed-Independent Partitions ($N = 300$):**
   - Calibration split $\mathcal{D}_{\text{calib}}$ ($N = 150$, seeds `[1001, ..., 1005]`).
   - Evaluation split $\mathcal{D}_{\text{test}}$ ($N = 150$, disjoint seeds `[1006, ..., 1010]`).
2. **Binary Event Definition:**
   - Correctness event: $Y_i = \mathbb{I}[\hat{c}_i = c_{\text{true}, i}] \in \{0, 1\}$.
   - Gate decision: $\hat{D}_i(\tau) = \mathbb{I}[\hat{p}_i \ge \tau]$.
   - Rates: $\text{TPR}(\tau) = \frac{\text{TP}}{\text{TP} + \text{FN}}$, $\text{FPR}(\tau) = \frac{\text{FP}}{\text{FP} + \text{TN}}$.
3. **Training on $\mathcal{D}_{\text{calib}}$ ONLY:**
   - Fit scalar temperature $T^* > 0$ minimizing negative log-likelihood on $\mathcal{D}_{\text{calib}}$.
   - Select threshold $\tau^*$ by maximizing Youden's $J = \text{TPR} - \text{FPR}$ subject to $\text{FPR} \le 0.05$.
   - *Youden's J Description:* Youden's $J$ is a non-parametric ROC informedness index with equal sensitivity/specificity weighting. It is **not** Bayes-optimal unless misclassification costs and prior odds satisfy $\frac{C_{\text{FP}}}{C_{\text{FN}}} \frac{P(Y=0)}{P(Y=1)} = 1$.
4. **Untouched Evaluation on $\mathcal{D}_{\text{test}}$:**
   - Freeze $T^*$ and $\tau^*$. Evaluate final test ECE, test Brier scores, test TPR, and test FPR strictly on $\mathcal{D}_{\text{test}}$.
