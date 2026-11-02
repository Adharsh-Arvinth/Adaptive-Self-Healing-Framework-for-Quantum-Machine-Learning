# Software Requirements Specification (SRS)

**Project:** Adaptive Self-Healing Framework for Quantum Machine Learning  
**Standard:** IEEE 830-1998 / ISO/IEC/IEEE 29148:2018 Adapted  
**Date:** March 2026

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for the Adaptive Self-Healing Framework for Quantum Machine Learning. The system autonomously monitors, detects, diagnoses, simulates, repairs, and evaluates training failures in Variational Quantum Circuits (VQCs) using Contextual Thompson Sampling, short-horizon digital twins, and persistent failure memory.

### 1.2 Scope
- **Core Engine:** Python 3.13 backend implementing PennyLane quantum simulation, numerical telemetry tracking, Bayesian linear regression Thompson Sampling, and atomic rollback deployment.
- **Service Layer:** FastAPI asynchronous gateway exposing REST and WebSocket endpoints for state inspection and job control.
- **Frontend Dashboard:** Apple-inspired Next.js 15+ research dashboard with dark/light mode, live charts, and interactive experiment controls.

---

## 2. Overall Description

### 2.1 Product Perspective
The system wraps standard VQC training loops into an autonomous MAPE-K closed loop. It does not replace the quantum circuit simulator but provides intelligent, adaptive oversight and automatic recovery.

### 2.2 User Classes and Characteristics
1. **Quantum ML Researchers:** Requires mathematical rigor, reproducible random seeds, transparent posterior inspection, and telemetry exports.
2. **Academic Evaluators / Thesis Committee:** Requires verifiable empirical ablation comparisons, formal statistical tests, and patent disclosures.
3. **MLOps / Software Engineers:** Requires atomic rollback guarantees, clean API contracts, and crash resilience.

---

## 3. Specific Functional Requirements

### Section 3.1: Quantum Model Execution (`qml_model.py`)
- **FR-1.1:** The model shall support configurable qubit counts $n \in [2, 10]$ and circuit layers $L \in [1, 12]$.
- **FR-1.2:** The model shall implement at least two feature encoding maps: Angle Embedding and IQP/ZZ-feature map.
- **FR-1.3:** The model shall implement Strongly Entangling Layers and Basic Entangling Layers.
- **FR-1.4:** The model shall compute exact analytic gradients via the PennyLane parameter-shift rule.
- **FR-1.5:** The model shall support controlled synthetic failure injection for: Barren Plateau, Learning Rate Misconfiguration, Optimizer Instability, and Divergence.

### Section 3.2: Health Monitoring (`monitoring.py`)
- **FR-2.1:** Telemetry shall record loss, accuracy, gradient norm $\|\mathbf{g}\|_2$, gradient variance $\operatorname{Var}(\mathbf{g})$, parameter velocity $\|\Delta \boldsymbol{\theta}\|_2$, and optimizer learning rate $\eta$ at every training step.
- **FR-2.2:** Telemetry shall maintain a sliding window buffer of length $W$ (default: 10 steps).

### Section 3.3: Failure Detection (`detection.py`)
- **FR-3.1:** The detector shall flag a Barren Plateau when $\operatorname{Var}(\mathbf{g}) < 10^{-4} \cdot 2^{-n}$ and $\|\Delta \boldsymbol{\theta}\| < 10^{-4}$ for $\ge 3$ consecutive steps.
- **FR-3.2:** The detector shall flag Learning Rate Misconfiguration when loss oscillates with $|\Delta \mathcal{L}| > 0.5$ or parameter updates stagnate despite high gradient norm.
- **FR-3.3:** The detector shall flag Training Divergence when loss equals NaN, Inf, or exceeds $10.0 \times \mathcal{L}_{\text{init}}$.

### Section 3.4: Root-Cause Diagnosis & Gating (`diagnosis.py`)
- **FR-4.1:** The diagnosis engine shall compute a probability distribution over the 6 failure categories.
- **FR-4.2:** The system shall enforce a confidence gate $\tau_{\text{conf}} \ge 0.60$. If $\max(\mathbf{p}) < \tau_{\text{conf}}$, the system shall hold state and observe for $\Delta t_{\text{obs}}$ steps rather than taking destructive action.

### Section 3.5: Persistent Failure Memory (`memory.py`)
- **FR-5.1:** Failure episodes shall be embedded as normalized vectors in $\mathbb{R}^{12}$.
- **FR-5.2:** Memory shall be persisted in SQLite / JSON and survive complete system restarts.
- **FR-5.3:** Memory retrieval shall employ Cosine Similarity and return the top-$K$ historical nearest neighbors.

### Section 3.6: Locked Six-Arm Repair Library (`repair_library.py`)
- **FR-6.1:** Exactly six repair arms shall be implemented:
  1. Change Optimizer
  2. Reduce Circuit Depth
  3. Modify Feature Map
  4. Adjust Learning Rate
  5. Apply Noise Mitigation (Simulation-side ZNE)
  6. Perform Warm Restart
- **FR-6.2:** All repairs shall be pure configuration transformations capable of complete reversal.

### Section 3.7: Safety Filter (`safety_filter.py`)
- **FR-7.1:** The safety filter shall prevent oscillatory actions (e.g., reversing an action applied within 5 steps).
- **FR-7.2:** The safety filter shall enforce circuit depth limits ($L \le L_{\text{max}}$) and learning rate boundaries ($\eta \in [10^{-4}, 1.0]$).

### Section 3.8: Digital-Twin Pre-Verification (`digital_twin.py`)
- **FR-8.1:** The digital twin shall spawn an isolated copy of the current VQC state without mutating the primary model.
- **FR-8.2:** The digital twin shall simulate the candidate repair over a truncated horizon of $H \in [3, 5]$ steps.
- **FR-8.3:** The digital twin shall output predicted loss improvement $\widehat{\Delta \mathcal{L}}$ and proxy stability $S_{\text{proxy}}$.

### Section 3.9: Contextual Thompson Sampling (`bandit.py`)
- **FR-9.1:** Contextual TS shall maintain independent Bayesian linear regression posteriors $\mathcal{N}(\boldsymbol{\mu}_a, \mathbf{B}_a^{-1})$ for each of the 6 arms.
- **FR-9.2:** The context vector $\mathbf{x} \in \mathbb{R}^{12}$ shall incorporate telemetry, diagnosis probabilities, historical memory payoff, and digital-twin predictions.
- **FR-9.3:** Posterior sampling shall be fully reproducible via seed control.
- **FR-9.4:** Upon observing post-deployment reward, posteriors shall be updated recursively via rank-1 updates.

### Section 3.10: Safe Atomic Deployment & Rollback (`deployment.py`)
- **FR-10.1:** An immutable checkpoint of model state $\boldsymbol{\theta}_t$, optimizer parameters, and circuit configuration shall be saved before executing any repair.
- **FR-10.2:** The repaired model shall be monitored over a validation horizon $W_{\text{val}}$.
- **FR-10.3:** If the loss diverges (NaN/Inf) or degrades by $> 20\%$, the system shall automatically trigger atomic rollback to the pre-repair checkpoint and assign a penalty reward ($r = -1.0$) to the offending arm.

### Section 3.11: Evaluation & Baselines (`evaluation.py`)
- **FR-11.1:** The evaluation module shall benchmark Contextual TS against: (1) Random Selection, (2) Greedy Selection, and (3) Fixed Rule-Based Selection.
- **FR-11.2:** Metrics computed shall include: Recovery Success Rate, Cumulative Regret, Time-to-Recovery, Digital-Twin Prediction Error, and Diagnosis Accuracy.

### Section 3.12: Orchestration & Vertical Slice (`pipeline.py`, `run_slice.py`)
- **FR-12.1:** `pipeline.py` shall provide unattended end-to-end execution of full training runs with continuous self-healing.
- **FR-12.2:** `run_slice.py` shall execute a standalone, fully reproducible single-failure recovery slice outputting structured verification logs.

---

## 4. Non-Functional & Quality Requirements

- **NFR-1 (Performance):** Telemetry computation overhead shall not exceed $15\%$ of total step time on CPU simulator.
- **NFR-2 (Reproducibility):** Setting a global random seed shall produce identical weight trajectories, failure detections, and bandit sampling choices.
- **NFR-3 (Robustness):** The system shall handle numerical floating-point overflows gracefully without crashing the training process.
- **NFR-4 (Security):** FastAPI endpoints shall enforce strict schema validation via Pydantic; no untrusted arbitrary code execution.
- **NFR-5 (Apple Design System):** The frontend shall adhere to Apple WWDC fluid interface standards:
  - Responsive button presses (`transform: scale(0.97)` on `:active`).
  - Spring-based modal and drawer transitions (`damping: 1.0`, `response: 0.35s`).
  - Strict optical sizing typography, subtle translucent materials (`backdrop-filter: blur(20px)`), and `prefers-reduced-motion` compliance.
