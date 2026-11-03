# Adaptive Self-Healing Framework for Quantum Machine Learning

[![Python 3.11 | 3.12 | 3.13](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![PennyLane 0.45.1](https://img.shields.io/badge/PennyLane-0.45.1-purple.svg)](https://pennylane.ai/)
[![Next.js 14.2](https://img.shields.io/badge/Next.js-14.2%20(React%2018)-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Pytest Suite](https://img.shields.io/badge/Pytest-97%2F97%20Passing-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20%7C%20Render-black.svg?logo=vercel&logoColor=white)](https://adaptive-self-healing-framework-for.vercel.app/)

An autonomous, closed-loop runtime self-healing architecture for Variational Quantum Classifiers (VQCs). The framework unifies continuous quantum telemetry extraction, multi-heuristic anomaly detection, Bayesian confidence-gated root-cause diagnosis, contextual bandit repair selection via **Contextual Thompson Sampling**, digital-twin predictive sandbox validation, and transactional atomic commit/rollback mechanisms.

Developed as an Autonomous Closed-Loop Runtime Platform for Variational Quantum Classifiers.

> 🌐 **Live Web Application:** [https://adaptive-self-healing-framework-for.vercel.app/](https://adaptive-self-healing-framework-for.vercel.app/)  
> ⚡ **Cloud Telemetry API:** [https://qml-backend-nczx.onrender.com/health](https://qml-backend-nczx.onrender.com/health)

---

## Table of Contents

1. [Executive Summary & Scope](#executive-summary--scope)
2. [Architectural Overview](#architectural-overview)
3. [Quantum Failure Taxonomy & Locked Repair Library](#quantum-failure-taxonomy--locked-repair-library)
4. [Repository Structure](#repository-structure)
5. [Prerequisites & System Requirements](#prerequisites--system-requirements)
6. [Quick Start Guide](#quick-start-guide)
   - [Day 1: Initial Setup](#day-1-initial-setup)
   - [Day 2+: Everyday Execution](#day-2-everyday-execution)
7. [Execution Modes](#execution-modes)
   - [Mode 1: Full-Stack Web Dashboard](#mode-1-full-stack-web-dashboard)
   - [Mode 2: Fast Vertical Slice CLI](#mode-2-fast-vertical-slice-cli)
   - [Mode 3: Automated Test Suite](#mode-3-automated-test-suite)
   - [Mode 4: Stage 8 Benchmark Replication](#mode-4-stage-8-benchmark-replication)
8. [Dashboard Walkthrough & Telemetry](#dashboard-walkthrough--telemetry)
9. [Mathematical & Algorithmic Foundations](#mathematical--algorithmic-foundations)
   - [Multi-Objective Reward Formulation](#1-multi-objective-reward-formulation)
   - [12-Dimensional Context Feature Vector](#2-12-dimensional-context-feature-vector)
   - [Contextual Thompson Sampling Decision Rule](#3-contextual-thompson-sampling-decision-rule)
10. [Empirical Scope & Research Limitations](#empirical-scope--research-limitations)
11. [Troubleshooting & Windows Tips](#troubleshooting--windows-tips)
12. [Manuscript & Scientific Dossier](#manuscript--scientific-dossier)
13. [License](#license)

---

## Executive Summary & Scope

Variational Quantum Algorithms (VQAs) and Quantum Neural Networks (QNNs) deployed in Noisy Intermediate-Scale Quantum (NISQ) simulation environments encounter severe runtime failure modes that disrupt classical parameter optimization. These include barren plateaus (exponential vanishing of cost variance), quantum noise degradation (depolarizing state contraction), classical optimizer instability, learning rate misconfigurations, training divergences, and persistent saddle traps.

Existing workflows rely on manual post-hoc trial and error or uncalibrated restarts that discard optimization history. This framework presents an automated, closed-loop diagnostic and recovery architecture comprising:
1. **12-Dimensional Continuous Telemetry:** Computes training loss, parameter-shift gradient norms, gradient variances, parameter velocities, and diagnostic metrics at every optimization step.
2. **Statistical Anomaly Detection:** Employs sliding-window variance and moving Z-score thresholding across short ($W_{\text{short}}=3$) and long ($W_{\text{long}}=10$) observation windows.
3. **Calibrated Bayesian Diagnosis:** Formulates posterior belief distributions $P(F_k \mid \mathbf{x}_t)$ over six canonical quantum failure classes, guarded by an empirical Bayesian confidence gate ($\tau = 0.60$) that safely abstains from ungrounded interventions when symptoms are ambiguous.
4. **Contextual Thompson Sampling Bandit:** Models expected repair payoffs using independent Bayesian linear regression posteriors $\mathcal{N}(\boldsymbol{\mu}_a, v^2 B_a^{-1})$ across six locked repair arms, updated online via Sherman-Morrison rank-1 inversions.
5. **Digital-Twin Predictive Validation:** Executes an isolated short-horizon ($H=3$) forward simulation of candidate repairs on non-training batches to verify numerical viability before touching the live model.
6. **Atomic Rollback Architecture:** Applies the selected repair with state snapshotting; if validation window performance ($W_{\text{val}}=3$) indicates divergence or degradation, the model is atomically reverted to its pre-failure checkpoint.
7. **Episodic SQLite Memory:** Stores complete failure trajectories, contextual embeddings, and scalar rewards for lifelong experiential learning.

> ℹ️ **Scientific Scope & Simulation Disclosure:**  
> All empirical benchmarks in this repository were conducted on simulated quantum circuits using PennyLane's `default.qubit` statevector simulator with analytical radial contraction noise models. This project does not claim physical QPU hardware validation, guaranteed resolution of NP-hard quantum training problems, or patent grants.

---

## Architectural Overview

```
                      +---------------------------------------+
                      |       Variational Quantum Circuit     |
                      |  (PennyLane default.qubit Simulator)  |
                      +-------------------+-------------------+
                                          |
                               [Telemetry Stream]
                               (12D State Vector)
                                          v
                      +---------------------------------------+
                      |        12D Continuous Telemetry       |
                      | Loss, Grad Norm/Var, Velocity, Depth  |
                      +-------------------+-------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |      Multi-Heuristic Detector         |
                      |   (Sliding Window Z-Scores & Norms)   |
                      +-------------------+-------------------+
                                          | Anomaly Flagged
                                          v
                      +---------------------------------------+
                      |     Bayesian Root-Cause Diagnosis     |
                      |    Temperature-Scaled Softmax P(F|x)  |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                 Confidence < 0.60                   Confidence >= 0.60
                        |                                   |
                        v                                   v
             +--------------------+              +--------------------+
             | Confidence Gate    |              | Contextual Bandit  |
             | HOLD (Abstain)     |              | (Thompson Sampling)|
             +--------------------+              +----------+---------+
                                                            |
                                                            v
                                                 +--------------------+
                                                 | Digital Twin Proxy |
                                                 | (H=3 Step Sandbox) |
                                                 +----------+---------+
                                                            | Viable
                                                            v
                                                 +--------------------+
                                                 |  Atomic Deployment |
                                                 | (Snapshot Saved)   |
                                                 +----------+---------+
                                                            |
                                                            v
                                                 +--------------------+
                                                 | Validation Window  |
                                                 | (W_val = 3 Steps)  |
                                                 +----------+---------+
                                                            |
                                          +-----------------+-----------------+
                                          |                                   |
                                    Loss Improved                       Degraded / NaN
                                          |                                   |
                                          v                                   v
                               +--------------------+              +--------------------+
                               |   Atomic COMMIT    |              |  Atomic ROLLBACK   |
                               | (Log SQLite Event) |              | (Revert Snapshot)  |
                               +--------------------+              +--------------------+
```

---

## Quantum Failure Taxonomy & Locked Repair Library

The framework diagnoses exactly **six canonical failure categories** (`backend/qml_model.py::FailureType`) and evaluates interventions across **six locked repair arms** (`backend/repair_library.py::RepairArm`):

### 1. Failure Categories

| Code | Failure Mode | Physical / Mathematical Symptoms | Primary Trigger Condition |
| :--- | :--- | :--- | :--- |
| `F1` | `barren_plateau` | Exponential gradient vanishing, cost variance flattening | $\|\mathbf{g}\|_2 < 10^{-4}$ and $\text{Var}[\mathbf{g}] < 10^{-5}$ sustained for $\ge 2$ steps |
| `F2` | `lr_misconfiguration` | Destabilizing step size inducing oscillatory loss spikes | Severe loss oscillation variance $\ge 0.10$ or divergence under oversized steps |
| `F3` | `optimizer_instability` | Classical momentum buffer corruption, directional incoherence | Loss coefficient of variation $CV(L) > 0.30$ with incoherent gradients |
| `F4` | `training_divergence` | Numerical divergence, gradient norm overflow, NaNs | Loss $L > 5.0$, gradient norm $\|\mathbf{g}\|_2 > 50.0$, or IEEE 754 NaN/Inf |
| `F5` | `persistent_plateau` | Trapped in low-curvature saddle manifold | Parameter displacement velocity $v_\theta < 10^{-4}$ with non-vanishing loss |
| `F6` | `noise_degradation` | Mixed-state purity degradation, Bloch radius contraction | Radial Bloch vector contraction $\|\mathbf{r}\|_2 < 0.70$ with stagnant accuracy |

### 2. Locked Repair Strategy Library

| Arm ID | Repair Arm Name | Implementation Mechanism | Safety Filter Guard |
| :---: | :--- | :--- | :--- |
| **Arm 1** | `change_optimizer` | Cycles classical optimizer (Adam $\leftrightarrow$ RMSprop $\leftrightarrow$ SGD) and cleanly resets momentum buffers. | Anti-oscillation: blocks cycling back to an optimizer used within $K=5$ steps. |
| **Arm 2** | `reduce_circuit_depth` | Decrements ansatz layer depth $L \to L - 1$, safely truncating parameters to alleviate barren plateau saturation. | Boundary check: strictly blocked if current layer depth $L = 1$. |
| **Arm 3** | `modify_feature_map` | Toggles quantum data embedding between separable Angle encoding ($R_Y$) and non-linear entangling IQP kernel maps. | Anti-oscillation: blocks rapid embedding toggles within $K=5$ steps. |
| **Arm 4** | `adjust_learning_rate` | Scales learning rate $\eta \leftarrow \eta \cdot \alpha$ dynamically ($\alpha \in \{0.2, 0.5, 2.0\}$) based on divergence profile. | Boundary check: clamped strictly within $[\eta_{\min}, \eta_{\max}] = [10^{-4}, 1.0]$. |
| **Arm 5** | `apply_noise_mitigation`| Activates simulation-side analytical Richardson inverse scaling against the depolarizing radial contraction model. | No-op guard: bypassed if noise mitigation is already active on circuit. |
| **Arm 6** | `perform_warm_restart` | Applies localized Gaussian parameter perturbation ($\boldsymbol{\theta} \leftarrow \boldsymbol{\theta} + \mathcal{N}(0, \sigma^2 \mathbf{I})$) or near-identity reset, resetting optimizer state. | Boundary check: parameter values clamped within $[-\pi, \pi]$ post-perturbation. |

---

## Repository Structure

```
Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning/
├── backend/                             # Core Python Self-Healing Engine & REST API
│   ├── api.py                          # FastAPI application & real-time WebSocket gateway
│   ├── bandit.py                       # Contextual Thompson Sampling bandit engine
│   ├── deployment.py                   # Atomic transaction engine (Commit / Rollback)
│   ├── detection.py                    # Multi-heuristic statistical anomaly detector
│   ├── diagnosis.py                    # Calibrated Bayesian diagnosis & confidence gate
│   ├── digital_twin.py                 # Isolated H=3 forward simulation sandbox
│   ├── evaluation.py                   # Multi-objective reward equation calculator
│   ├── memory.py                       # SQLite episodic memory & episode recorder
│   ├── monitoring.py                   # 12D telemetry extraction & state tracker
│   ├── pipeline.py                     # Master autonomous self-healing coordinator
│   ├── qml_model.py                    # PennyLane VQC model, circuits, & datasets
│   ├── repair_library.py               # Exactly 6 locked candidate repair implementations
│   ├── run_slice.py                    # Fast standalone vertical slice demonstration script
│   └── safety_filter.py                # Parameter bounds & anti-oscillation safety guards
├── frontend/                            # Next.js 14 Real-Time Web Dashboard
│   ├── app/                            # Next.js App Router (layout, page, globals.css)
│   ├── components/                     # Apple-inspired interface components
│   │   ├── BanditMonitor.tsx           # Contextual Thompson Sampling posteriors & weights
│   │   ├── BlochSphere.tsx             # Interactive 3D Canvas Bloch sphere visualizer
│   │   ├── DeploymentMonitor.tsx       # Transactional rollback ledger & health status
│   │   ├── DiagnosisPanel.tsx          # Bayesian root-cause probabilities & gate state
│   │   ├── DigitalTwinPanel.tsx        # Forward simulation matrix & trajectory preview
│   │   ├── FailureInjectionPanel.tsx   # Controlled synthetic failure injection testing
│   │   ├── Header.tsx                  # System status bar & experiment controls
│   │   ├── LossChart.tsx               # Real-time SVG training/validation convergence
│   │   ├── MemoryAndAuditLog.tsx       # SQLite episode log & historical audit trail
│   │   ├── MetricsRow.tsx              # Live telemetry cards (Loss, Accuracy, Grad Norm)
│   │   └── RepairCockpit.tsx           # Six-Arm adaptive repair cockpit & status
│   ├── package.json                    # Frontend dependencies & npm scripts
│   └── tailwind.config.ts              # Apple-inspired UI styling configuration
├── benchmark_results/                   # Stage 8 Frozen Benchmark Campaign Data
│   ├── figures/                        # Publication figures (PDF & PNG, 300 DPI)
│   │   ├── figure1_calibration_reliability.pdf / .png
│   │   ├── figure2_policy_regret_trajectories.pdf / .png
│   │   ├── figure3_ablation_performance.pdf / .png
│   │   ├── figure4_per_class_confusion_and_repairs.pdf / .png
│   │   └── figure5_dynamic_recovery_trace.pdf / .png
│   ├── ablation_study_results.json     # 10-seed ablation study data (1,200 episodes)
│   ├── calibration_n300_results.json   # Disjoint N=300 calibration experiment data
│   ├── per_class_performance.json      # Per-failure-mode recovery rates (300 episodes)
│   └── policy_regret_benchmark.json    # 10-seed 4-policy benchmark data (1,200 episodes)
├── manuscript/                          # Academic Publication & Audit Package
│   ├── MANUSCRIPT_DRAFT.md             # Complete journal-ready manuscript draft
│   ├── REFERENCE_VERIFICATION.md       # Verified DOIs and metadata for 20 citations
│   ├── CLAIM_EVIDENCE_MATRIX.md        # Cryptographic matrix mapping claims to raw data
│   ├── FIGURE_TABLE_PLAN.md            # Captions, provenance, and SHA-256 hashes
│   └── AUTHOR_REVIEW_CHECKLIST.md      # Statistical integrity & disclosure checklist
├── docs/                                # Technical Documentation & Audit Reports
│   ├── BEGINNER_GUIDE.md               # Step-by-step Windows & VS Code handbook
│   ├── ARCHITECTURE.md                 # Deep-dive architectural specification
│   ├── MATHEMATICAL_VERIFICATION.md    # Formal proofs and boundary derivations
│   └── TEST_REPORT.md                  # Comprehensive verification test report
├── scripts/                             # Benchmark Automation & Figure Generators
│   ├── audit_stage8.py                 # Statistical evidence & verification auditor
│   ├── benchmark_ablation_study.py     # 10-seed ablation campaign runner
│   ├── benchmark_calibration_n300.py   # N=300 reliability calibration runner
│   ├── benchmark_per_class.py          # Per-failure recovery rate benchmark
│   ├── benchmark_policy_regret.py      # 4-policy regret benchmark runner
│   └── generate_publication_figures.py # Matplotlib publication figure generator
├── tests/                               # Comprehensive Automated Pytest Suite
│   ├── test_api.py                     # REST endpoints & WebSocket telemetry tests
│   ├── test_audit_safety_failure.py    # Numerical safety and failure injection tests
│   ├── test_bandit_digital_twin.py     # Bandit updates & forward simulation tests
│   ├── test_detection_diagnosis.py     # Anomaly detector & Bayesian diagnosis tests
│   ├── test_memory_repair.py           # SQLite persistence & repair library tests
│   ├── test_pipeline_deployment.py     # End-to-end pipeline & rollback tests
│   └── test_qml_model.py               # PennyLane VQC circuit & Bloch sphere tests
├── requirements.txt                     # Pinned Python package dependencies
└── README.md                            # Primary project documentation (this file)
```

---

## Prerequisites & System Requirements

### Hardware Requirements
- **CPU:** Dual-core x86_64 or Apple Silicon (Quad-core recommended).
- **RAM:** Minimum 4 GB (8 GB recommended for multi-seed benchmarks).
- **Disk Space:** ~500 MB for repository, dependencies, and virtual environment.

### Software Requirements
- **Operating System:** Windows 10/11, macOS (12+), or Linux (Ubuntu 20.04+).
- **Python:** Version `3.11`, `3.12`, or `3.13` (64-bit).
- **Node.js:** Version `18.x` or higher (LTS recommended) with `npm 9+`.
- **Git:** Version `2.30+`.

---

## Quick Start Guide

> 💡 **New to Python, Next.js, or VS Code on Windows?**  
> Check out the complete, beginner-friendly walkthrough in [docs/BEGINNER_GUIDE.md](docs/BEGINNER_GUIDE.md).
>
> 🌐 **Deploy Online as a Live Web App:**  
> Want to host this application online on the cloud? See our full [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md) for 1-click deployments on **Render + Vercel**, **Railway**, or **Docker Compose** (`docker compose up -d`).

### Day 1: Initial Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git
cd Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning
```

#### 2. Configure Python Virtual Environment
**On Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

**On macOS / Linux (Bash):**
```bash
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install --upgrade pip
pip install -r requirements.txt
```

#### 3. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

### Day 2+: Everyday Execution

Once installed, running the system daily requires only two terminal commands:

#### Terminal 1 — Start the FastAPI Backend Gateway:
```bash
# Ensure virtual environment is activated (.venv)
uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload
```
*The backend API will start on `http://127.0.0.1:8000`. You can inspect health status at `http://127.0.0.1:8000/api/health`.*

#### Terminal 2 — Start the Next.js Web Dashboard:
```bash
cd frontend
npm run dev
```
*Open your browser and navigate to `http://localhost:3000` to interact with the full-stack dashboard.*

---

## Execution Modes

To ensure clarity for researchers, evaluators, and beginners, this repository supports **four distinct execution modes**:

| Mode | Purpose | Command | Typical Runtime | Resource Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Mode 1** | Interactive Web Dashboard | `npm run dev` + `uvicorn` | Continuous | Low (1 browser tab) |
| **Mode 2** | Fast Vertical Slice CLI | `python backend/run_slice.py` | **~5–8 seconds** | Very Low |
| **Mode 3** | Automated Pytest Suite | `pytest -q` | **~9–10 seconds** | Very Low |
| **Mode 4** | Full Benchmark Campaign | `python scripts/benchmark_*.py` | **1–3 hours** | High (Multi-seed) |

### Mode 1: Full-Stack Web Dashboard
Provides an Apple-inspired visual control center. Real-time telemetry, 3D Bloch sphere updates, anomaly alerts, Bayesian confidence indicators, and manual fault injection controls are streamed over WebSockets (`ws://127.0.0.1:8000/ws/telemetry`).

### Mode 2: Fast Vertical Slice CLI Verification
If you want an immediate, non-visual verification that the entire pipeline functions correctly (nominal training $\to$ fault injection $\to$ anomaly detection $\to$ confidence gating $\to$ Thompson Sampling selection $\to$ digital-twin validation $\to$ atomic commit):
```bash
python backend/run_slice.py
```
*Executes a complete 15-step cycle in under 8 seconds and writes a full execution trace to `docs/vertical_slice_trace.json`.*

### Mode 3: Automated Test Suite
To verify code integrity, numerical correctness, and API endpoints across the entire stack:
```bash
pytest -q
```
*Runs all 93 unit and integration tests. Expected output:*
```
93 passed, 1 warning in 9.52s
```

### Mode 4: Stage 8 Benchmark Replication
> ⚠️ **NOTICE ON PRE-COMPUTED BENCHMARK EVIDENCE:**  
> All Stage 8 benchmark campaign results are **already computed, audited, and frozen** in the [`benchmark_results/`](benchmark_results/) directory. The raw JSON files and high-resolution figures in `benchmark_results/figures/` match the published manuscript.
> 
> You do **not** need to rerun the benchmarks to inspect the data or run the application. Re-running the full benchmark scripts executes over 3,000 quantum training episodes across multiple seeds and takes **several hours**:
> - `python scripts/benchmark_calibration_n300.py` (300 episodes, ~15 mins)
> - `python scripts/benchmark_policy_regret.py` (1,200 episodes, ~45 mins)
> - `python scripts/benchmark_ablation_study.py` (1,200 episodes, ~45 mins)
> - `python scripts/benchmark_per_class.py` (300 episodes, ~15 mins)
> - `python scripts/generate_publication_figures.py` (Regenerates all publication figures in ~5 seconds)

---

## Dashboard Walkthrough & Telemetry (Apple Design System)

When running the Next.js dashboard (`http://localhost:3000`), the interface is structured according to **Apple Design Principles** (clean typography, generous whitespace, tactile interactions, frosted glassmorphism, and seamless light/dark mode adaptation). 

The dashboard provides a multi-tab segmented navigation architecture designed for deep scientific inspectability without visual clutter:

### 1. Unified Header & Autonomous Lifecycle Bar (`Header.tsx`)
- **Real-Time Connectivity:** Automatic WebSocket reconnection with status indicator (`LIVE STREAM`).
- **Autonomous Lifecycle Controls:** Interactive buttons for **Start Training**, **Pause**, **Resume**, **Single Step** execution, and **Reset Experiment** (with macOS-style confirmation dialog).
- **Theme Switcher:** Instant one-click toggle between Light Mode and Dark Mode using CSS variable design tokens.
- **Pipeline State Pill:** Real-time color-coded indication of the MAPE-K autonomous phase (`HEALTHY_TRAINING`, `ANOMALY_DETECTED`, `DIAGNOSING`, `CONFIDENCE_GATE_HOLD`, `REPAIR_SELECTION`, `DEPLOYING`, `VALIDATING_REPAIR`, `COMMITTED`, `ROLLED_BACK`).

### 2. Apple Health-Style Telemetry KPI Strip (`MetricsRow.tsx`)
Continuous summary cards providing high-level diagnostics:
- **Training Loss (BCE):** Mini-batch convergence with trend badges.
- **Validation Accuracy:** Evaluated over non-training dataset samples.
- **Validation Loss:** Generalization gap monitoring ($|\mathcal{L}_{\text{val}} - \mathcal{L}_{\text{train}}|$).
- **Parameter-Shift Gradient Norm ($\|\mathbf{g}\|$):** Early vanishing gradient indicator.
- **Parameter Velocity ($\|\mathbf{v}\|$):** Momentum trajectory detector.
- **Circuit Depth & Learning Rate:** Ansatz capacity and step scale indicators.

---

### Segmented Navigation Tabs

#### Tab 1 — Overview
- **Loss & Convergence Stream (`LossChart.tsx`):** Responsive SVG charting with cubic bezier curves, segmented mode toggle (`Loss`, `Accuracy`, `Dual-Axis`), event annotations for injected faults and commits, and hover crosshair with exact point inspection.
- **Interactive 3D Bloch Sphere Visualizer (`BlochSphere.tsx`):** Interactive mouse-drag orbit controls (azimuth and elevation rotation), true noisy physical Bloch coordinates $(r_x, r_y, r_z)$, quantum state purity calculated via $\gamma = \frac{1 + \|\mathbf{r}\|^2}{2} \in [0.5, 1.0]$, and separate error-mitigated coordinate markers.
- **Tri-Panel Overview:** Compact root-cause diagnosis, repair arm status, and deployment monitor.
- **Synthetic Fault Injection Sandbox (`FailureInjectionPanel.tsx`):** One-click injection of all 6 canonical failure modes with severity selection ($1.0\times, 2.0\times, 3.0\times$).

#### Tab 2 — Diagnosis & Repairs
- **Root-Cause Diagnostic Engine (`DiagnosisPanel.tsx`):** Six-category temperature-scaled posterior distribution bars, active anomaly fault tags, evidence attribution list, and visual Bayesian confidence gate indicator ($\tau = 0.60$).
- **Six-Arm Adaptive Repair Cockpit (`RepairCockpit.tsx`):** Cards for each locked repair arm, eligibility indicators, analytical inverse-contraction noise mitigation tags, and manual **Deploy & Test** action buttons with safety filter validation.

#### Tab 3 — Digital Twin & Safety
- **Digital Twin Proxy Simulator (`DigitalTwinPanel.tsx`):** Forward simulation trajectory preview ($H=3$), predicted loss delta ($\Delta \mathcal{L}$), proxy stability score, uncertainty variance ($\sigma_g^2$), and a sandbox simulation tester (`POST /api/experiment/simulate-twin`) that tests candidate repairs without altering live model parameters.
- **Safe Deployment Monitor (`DeploymentMonitor.tsx`):** Visual transactional lifecycle (Checkpoint $\to$ Deployed $\to$ Validate $W=3$ $\to$ Commit/Rollback), pre/post loss metrics, and manual **Force Commit** / **Force Rollback** buttons.

#### Tab 4 — Bandit & Memory
- **Contextual Thompson Sampling Monitor (`BanditMonitor.tsx`):** Posterior weight norms ($\|\boldsymbol{\mu}_a\|$), update counters, and a collapsible, exhaustive **12-Dimensional Context Vector Specification Table** documenting formulas, bounds, and live feature values ($x_1$ through $x_{12}$).
- **Episodic Failure Memory & Live Audit (`MemoryAndAuditLog.tsx`):** Searchable and filterable SQLite failure episode table, historical recovery rewards, and live timestamped MAPE-K pipeline transition stream.

#### Tab 5 — Stage 8 Empirical Proof (`BenchmarksPanel.tsx`)
Direct visualization of frozen empirical benchmark campaign evidence (`GET /api/benchmarks/summary`):
- **Temperature Calibration:** ECE and Brier score improvements under optimal $T^*$, plus exact Clopper-Pearson 95% confidence intervals for False Positive Rate ($\le 4.99\%$) and False Discovery Rate ($\le 13.72\%$).
- **Policy Regret:** 10-seed paired comparisons across Thompson Sampling, Greedy, Heuristic, and Random baselines.
- **Ablation Studies:** 5-condition architectural ablations isolating the necessity of the safety filter, digital twin, memory, and confidence gate.
- **Per-Class Recovery:** Recovery rates and precision/recall metrics across all six canonical quantum failure categories.

#### Tab 6 — Settings & Operations (`SettingsPanel.tsx`)
- **Quantum Circuit Configuration:** Inspect and configure ansatz layers ($L$), qubits ($N$), Hilbert space feature map, and optimizer.
- **Session Telemetry Export:** Single-click JSON export of all recorded time-series telemetry steps for offline analysis.
- **REST Latency & Health:** Real-time round-trip latency ping test to the FastAPI backend gateway.
- **Research Baseline Attribution:** Verifies commit baseline `7d37201` and framework versions.

---

## Mathematical & Algorithmic Foundations

### 1. Multi-Objective Reward Formulation
When a candidate repair is deployed, its recovery quality is evaluated over a validation window of length $W_{\text{val}} = 3$ using the centralized, locked reward function (`backend/evaluation.py::compute_multi_objective_reward`):

$$r = \operatorname{clip}\left(w_1 \cdot \delta_{\mathcal{L}} + w_2 \cdot \delta_{\text{acc}} + w_3 \cdot r_{\text{grad}} - w_4 \cdot c_{\text{cost}} - w_5 \cdot \delta_D - w_6 \cdot i_{\text{rollback}}, -1.0, 1.0\right)$$

Where the weights satisfy $\sum_{i=1}^6 w_i = 1.00$:
$$\mathbf{w} = [w_1 = 0.40, \; w_2 = 0.25, \; w_3 = 0.15, \; w_4 = 0.05, \; w_5 = 0.05, \; w_6 = 0.10]^T$$

Component definitions:
1. **Fractional Loss Improvement ($\delta_{\mathcal{L}} \in [-1.0, 1.0]$):**
   $$\delta_{\mathcal{L}} = \begin{cases} \operatorname{clip}\left(\frac{\mathcal{L}_{\text{pre}} - \mathcal{L}_{\text{post}}}{\max(\mathcal{L}_{\text{pre}}, 10^{-6})}, -1.0, 1.0\right), & \text{if } \mathcal{L}_{\text{pre}} > 10^{-6} \text{ and } \mathcal{L}_{\text{pre}} \notin \{\text{NaN}, \text{Inf}\} \\ 0.0, & \text{otherwise} \end{cases}$$
2. **Classification Accuracy Delta ($\delta_{\text{acc}} \in [-1.0, 1.0]$):**
   $$\delta_{\text{acc}} = \operatorname{clip}(\operatorname{Acc}_{\text{post}} - \operatorname{Acc}_{\text{pre}}, -1.0, 1.0)$$
3. **Gradient Health Recovery Term ($r_{\text{grad}} \in (-1.0, 1.0)$):**
   $$r_{\text{grad}} = \begin{cases} \tanh\left(\frac{\|\mathbf{g}\|_{\text{post}} - \|\mathbf{g}\|_{\text{pre}}}{\|\mathbf{g}\|_{\text{pre}} + 10^{-6}}\right), & \text{if failure} \in \{\text{barren\_plateau}, \text{persistent\_plateau}\} \text{ and } \|\mathbf{g}\|_{\text{pre}} > 0 \\ 0.0, & \text{otherwise} \end{cases}$$
   *(Zeroed out for non-plateau failures to prevent double-counting).*
4. **Normalized Computational Evaluation Cost ($c_{\text{cost}} \in [0.0, 1.0]$):**
   $$c_{\text{cost}} = \operatorname{clip}\left(\frac{N_{\text{circuit\_evaluations}}}{500}, 0.0, 1.0\right)$$
5. **Circuit Depth Expansion Penalty ($\delta_D \in [0.0, 1.0]$):**
   $$\delta_D = \frac{\max(0, D_{\text{post}} - D_{\text{pre}})}{D_{\max}}, \quad D_{\max} = 8$$
6. **Rollback Indicator ($i_{\text{rollback}} \in \{0.0, 1.0\}$):**
   $$i_{\text{rollback}} = \begin{cases} 1.0, & \text{if repair failed validation and was rolled back} \\ 0.0, & \text{if repair was committed} \end{cases}$$

**Theoretical Bounds:** $R_{\min} = -1.0000$, $R_{\max} = +0.8000 \le +1.0$.

---

### 2. 12-Dimensional Context Feature Vector
The continuous context vector $\mathbf{x}_t \in [-1, 1]^{12}$ provided to the Contextual Thompson Sampling bandit is constructed as follows (`backend/bandit.py::build_context_vector`):

| Index | Symbol | Feature Name | Mathematical Definition | Valid Range | Fallback / Missing Rule |
| :---: | :---: | :--- | :--- | :---: | :--- |
| $x_1$ | $\text{Bias}$ | Constant Offset | $x_1 = 1.0$ | $\{1.0\}$ | Invariant $1.0$ |
| $x_2$ | $\widetilde{\mathcal{L}}_t$ | Normalized Training Loss | $\tanh(L_t)$ | $[0.0, 1.0)$ | Missing/NaN $\to 10.0 \implies \tanh(10) \approx 1.0$ |
| $x_3$ | $\widetilde{\|\mathbf{g}\|}$ | Log Gradient Norm | $\operatorname{clip}\left(\frac{\ln(\max(10^{-12}, \|\mathbf{g}\|) + 10^{-8}) + 8}{12}, -1, 1\right)$ | $[-0.8684, 1.0]$ | Missing/NaN $\to 0.0 \implies -0.8684$ |
| $x_4$ | $\widetilde{\operatorname{Var}}(\mathbf{g})$ | Log Gradient Variance | $\operatorname{clip}\left(\frac{\ln(\max(10^{-12}, \operatorname{Var}[\mathbf{g}]) + 10^{-10}) + 10}{14}, -1, 1\right)$ | $[-0.9297, 1.0]$ | Missing/NaN $\to 0.0 \implies -0.9297$ |
| $x_5$ | $\widetilde{v}_\theta$ | Normalized Parameter Velocity | $\tanh(10 \cdot v_\theta)$ | $[0.0, 1.0)$ | Missing/NaN $\to 0.0 \implies 0.0$ |
| $x_6$ | $\widetilde{D}$ | Relative Circuit Depth | $\operatorname{clip}(D / D_{\max}, 0, 1), \; D_{\max} = 8$ | $[0.125, 1.0]$ | Clamped to $[1/8, 1.0]$ |
| $x_7$ | $p_{\text{primary}}$ | Primary Diagnostic Confidence | $\max_c P(F_c \mid \mathbf{x})$ | $[1/6, 1.0]$ | No diagnosis $\to 1/6 \approx 0.1667$ |
| $x_8$ | $\widetilde{H}(\mathbf{p})$ | Normalized Diagnostic Entropy | $\frac{-\sum_{c=1}^6 p_c \ln(p_c + 10^{-12})}{\ln 6}$ | $[0.0, 1.0]$ | No diagnosis $\to 1.0$ (max uncertainty) |
| $x_9$ | $r_{\text{hist}}$ | Episodic Memory Prior Reward | Top-$1$ retrieved episode reward | $[-1.0, 1.0]$ | Empty memory $\to 0.0$ |
| $x_{10}$| $s_{\text{hist}}$ | Episodic Memory Top Similarity | Cosine similarity $S_C(\mathbf{q}, \mathbf{e}_{\text{top}})$ | $[-1.0, 1.0]$ | Empty memory $\to 0.0$ |
| $x_{11}$| $\Delta \hat{L}_{\text{twin}}$ | Digital Twin Predicted Loss Delta | Normalized twin predicted loss improvement | $[-1.0, 1.0]$ | Unviable/unsimulated $\to 0.0$ |
| $x_{12}$| $S_{\text{twin}}$ | Digital Twin Proxy Stability | Proxy trajectory stability metric | $[0.0, 1.0]$ | Unviable/unsimulated $\to 0.5$ |

---

### 3. Contextual Thompson Sampling Decision Rule
For each candidate repair arm $a \in \mathcal{A}$, the bandit models expected reward via Bayesian linear regression:
$$r_{a, t} = \mathbf{x}_t^T \boldsymbol{\theta}_a + \epsilon, \quad \epsilon \sim \mathcal{N}(0, v^2)$$

The posterior distribution over coefficients $\boldsymbol{\theta}_a$ given precision matrix $B_a \in \mathbb{R}^{12 \times 12}$ and accumulator $f_a \in \mathbb{R}^{12}$ is:
$$\boldsymbol{\theta}_a \sim \mathcal{N}\left(\boldsymbol{\mu}_a, v^2 B_a^{-1}\right), \quad \text{where } \boldsymbol{\mu}_a = B_a^{-1} f_a$$

At decision step $t$, the agent:
1. Filters candidate arms through the **Safety Filter** to obtain eligible subset $\mathcal{A}_{\text{eligible}} \subseteq \mathcal{A}$.
2. Samples coefficient vectors $\tilde{\boldsymbol{\theta}}_a \sim \mathcal{N}(\boldsymbol{\mu}_a, v^2 B_a^{-1})$ for all $a \in \mathcal{A}_{\text{eligible}}$.
3. Selects the arm maximizing the sampled expected return:
   $$a^* = \arg\max_{a \in \mathcal{A}_{\text{eligible}}} \tilde{\boldsymbol{\theta}}_a^T \mathbf{x}_t$$
4. Upon observing empirical validation reward $r_t$, updates posterior parameters online via Sherman-Morrison rank-1 maintenance:
   $$B_a \leftarrow B_a + \mathbf{x}_t \mathbf{x}_t^T, \quad f_a \leftarrow f_a + r_t \mathbf{x}_t$$
   $$B_a^{-1} \leftarrow B_a^{-1} - \frac{B_a^{-1} \mathbf{x}_t \mathbf{x}_t^T B_a^{-1}}{1 + \mathbf{x}_t^T B_a^{-1} \mathbf{x}_t}$$

---

## Empirical Scope & Research Limitations

In keeping with rigorous academic integrity, we document the empirical scope, negative findings, and boundary conditions established in Stage 8:

1. **Simulation-Only Quantum Circuit Execution:**  
   All quantum circuits were executed on classical CPU simulators using PennyLane's `default.qubit` device. Physical QPU deployment on superconducting or trapped-ion hardware subject to non-Markovian noise remains future work.
2. **Cumulative Reward Significance:**  
   In the 10-seed policy benchmark ($N=1,200$ episodes), Contextual Thompson Sampling achieved significant reductions in destructive parameter rollbacks ($10.7\%$ vs $23.0\%$ for heuristics, a $>50\%$ reduction) and superior seed stability ($\sigma = 0.28$ vs $0.76$ for greedy). However, the difference in cumulative reward between Thompson Sampling and Greedy was **not statistically significant** ($p = 0.3282$, paired Student's $t = -1.034$).
3. **Undefined Precision for Optimizer Instability:**  
   Under the frozen diagnostic gate ($\tau = 0.60$), the diagnostician issued zero positive predictions for `optimizer_instability` across the 300-episode per-class evaluation. Consequently, precision and F1 score for this specific class are mathematically **Undefined ($0/0$)**, with empirical recall = $0.0\%$ ($0/50$, Wilson 95% CI: $[0.0\%, 7.1\%]$). Despite this diagnostic limitation, systemic recovery was $58.0\%$ because Thompson Sampling explored universal parameter dislodgement repairs.
4. **Finite Sample Calibration Bounds:**  
   In the $N=150$ unseen test split, the calibrated gate admitted 0 false positives out of 72 condition negatives (empirical FPR = $0.00\%$, exact Clopper–Pearson 95% upper bound = $4.99\%$). On the 25 admitted cases, 0 were false discoveries (empirical FDR = $0.00\%$, exact Clopper–Pearson 95% upper bound = $13.72\%$). Observed zero errors on finite splits do not constitute a proof of zero population risk.
5. **Digital Twin Evaluation Overhead:**  
   Executing $H=3$ proxy steps imposes a $3.8\times$ computational circuit evaluation overhead ($191.0 \pm 4.1$ vs $50.0 \pm 0.0$ evaluations). For applications where quantum circuit calls are expensive, this computational trade-off must be weighed against the marginal $1.0\%$ reduction in physical rollbacks.

---

## Troubleshooting & Windows Tips

### 1. PowerShell Script Execution Policy Error
If activating `.venv` gives:
```
File ... Activate.ps1 cannot be loaded because running scripts is disabled on this system.
```
**Fix:** Run this command once in your current PowerShell session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### 2. Port Conflicts (Port 8000 or 3000 in use)
If port 8000 or 3000 is occupied by an earlier process:
- **Change backend port:**
  ```powershell
  uvicorn backend.api:app --port 8001 --reload
  ```
- **Change frontend port:**
  ```powershell
  npm run dev -- -p 3001
  ```
- **Or terminate the existing process (Windows):**
  ```powershell
  Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
  ```

---

## Manuscript & Scientific Dossier

All research documentation, peer-reviewed reference validations, and manuscript drafts are maintained in the [`manuscript/`](manuscript/) directory:
- **`manuscript/MANUSCRIPT_DRAFT.md`**: Complete, formal journal article draft with Abstract, Sections I–X, Tables 1–4, and Figures 1–5.
- **`manuscript/REFERENCE_VERIFICATION.md`**: Bibliographic audit verifying DOIs, authors, titles, and publication venues for all 20 cited references.
- **`manuscript/CLAIM_EVIDENCE_MATRIX.md`**: Mathematical and experimental claim traceability matrix linking every paper claim to exact JSON data files and lines of code.
- **`manuscript/FIGURE_TABLE_PLAN.md`**: Detailed captions, data provenance, and SHA-256 cryptographic hashes for all publication figures and tables.
- **`manuscript/AUTHOR_REVIEW_CHECKLIST.md`**: Formal author review and reproducibility checklist.

---

## License

Released under the [MIT License](LICENSE).
