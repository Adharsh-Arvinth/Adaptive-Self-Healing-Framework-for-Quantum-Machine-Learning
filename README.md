# Adaptive Self-Healing Framework for Quantum Machine Learning

[![Python 3.11 | 3.12 | 3.13](https://img.shields.io/badge/Python-3.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![PennyLane 0.45.1](https://img.shields.io/badge/PennyLane-0.45.1-purple.svg)](https://pennylane.ai/)
[![Next.js 14.2](https://img.shields.io/badge/Next.js-14.2%20(React%2018)-black.svg)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg)](https://fastapi.tiangolo.com/)
[![Pytest Suite](https://img.shields.io/badge/Pytest-93%2F93%20Passing-brightgreen.svg)](tests/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

An autonomous, closed-loop runtime self-healing architecture for Variational Quantum Classifiers (VQCs). The framework unifies real-time continuous quantum telemetry extraction, multi-heuristic anomaly detection, Bayesian confidence-gated root-cause diagnosis, contextual bandit repair selection (LinUCB), digital-twin predictive sandbox validation, and transactional atomic commit/rollback mechanisms.

Developed as a Capstone Research Project at **Vellore Institute of Technology (VIT)** — Student ID: `22MID0324`.

---

## Table of Contents

1. [Executive Summary & Core Novelty](#executive-summary--core-novelty)
2. [Architectural Overview](#architectural-overview)
3. [Quantum Failure Modes & Repair Library](#quantum-failure-modes--repair-library)
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
10. [Troubleshooting & Windows Tips](#troubleshooting--windows-tips)
11. [Manuscript & Scientific Dossier](#manuscript--scientific-dossier)
12. [Citation & License](#citation--license)

---

## Executive Summary & Core Novelty

Variational Quantum Algorithms (VQAs) and Quantum Neural Networks (QNNs) deployed in Noisy Intermediate-Scale Quantum (NISQ) environments suffer from severe runtime failure modes that disrupt classical parameter optimization. These include:
- **Barren plateaus** (exponential concentration of gradient variance),
- **Quantum noise degradation** (depolarizing state contraction),
- **Learning rate misconfigurations** (destabilizing quantum state trajectories),
- **Parameter vanishing/freezing** (gradient starvation),
- **Phase shift drift** (coherent over-rotation), and
- **Loss explosion / Optimizer instability**.

Existing methods either rely on manual offline intervention or uncalibrated automated heuristics that frequently inject destructive circuit alterations during ambiguous training dynamics. 

This framework resolves these challenges through a **7-stage autonomous closed-loop**:
1. **12-Dimensional Telemetry Extraction:** Computes quantum state observables, analytical Bloch coordinates $(r_x, r_y, r_z)$, gradient first and second moments, parameter velocities, and circuit complexity in real time.
2. **Statistical Anomaly Detection:** Employs sliding-window variance and moving Z-score thresholding across loss, gradient, and Bloch trajectories.
3. **Calibrated Bayesian Diagnosis:** Formulates posterior probabilities $P(F_k \mid \mathbf{x}_t)$ over six failure modes, guarded by an empirical Bayesian confidence gate ($\tau = 0.60$) that abstains from ungrounded repairs when confidence is ambiguous.
4. **Contextual Bandit Selection:** Uses a Linear Upper Confidence Bound (LinUCB) bandit with ridge-regression posteriors ($A_a \in \mathbb{R}^{12 \times 12}, b_a \in \mathbb{R}^{12}$) to select optimal repair strategies conditioned on live telemetry.
5. **Digital-Twin Predictive Validation:** Executes an isolated $H=3$ step forward simulation of the candidate repair to verify numerical stability before touching the physical quantum model.
6. **Atomic Rollback Architecture:** Applies the selected repair with snapshot checkpoints; if validation window performance ($W_{\text{val}}=3$) fails to show improvement, the system triggers an automatic state rollback.
7. **Episodic SQLite Memory:** Stores complete failure trajectories, contextual embeddings, and scalar rewards for continuous lifelong policy improvement.

---

## Architectural Overview

```
                      +---------------------------------------+
                      |       Physical VQC Model / QPU        |
                      |  (PennyLane Default Qubit / Simulator) |
                      +-------------------+-------------------+
                                          |
                               [Telemetry Stream]
                               (12D State Vector)
                                          v
                      +---------------------------------------+
                      |        12D Continuous Telemetry       |
                      |  Loss, Val Loss, Grad Norm/Var, Bloch |
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
                      |       Naïve Bayes Posterior P(F|x)    |
                      +-------------------+-------------------+
                                          |
                        +-----------------+-----------------+
                        |                                   |
                 Confidence < 0.60                   Confidence >= 0.60
                        |                                   |
                        v                                   v
             +--------------------+              +--------------------+
             | Confidence Gate    |              | Contextual Bandit  |
             | HOLD (Abstain)     |              | (LinUCB Selection) |
             +--------------------+              +----------+---------+
                                                            |
                                                            v
                                                 +--------------------+
                                                 | Digital Twin Proxy |
                                                 | (H=3 Step Sandbox) |
                                                 +----------+---------+
                                                            | Stable
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

## Quantum Failure Modes & Repair Library

The framework continuously detects, isolates, and rectifies six defined failure modes using six corresponding candidate repair actions:

| Code | Failure Mode | Physical Symptoms | Recommended Repair Action |
| :--- | :--- | :--- | :--- |
| `F1` | **Barren Plateau** | Exponential gradient vanishing ($\text{Var}[\nabla] < 10^{-5}$), loss plateau. | `insert_layer` (Entangling layer insertion with identity initialization) |
| `F2` | **Noise Degradation** | Bloch radius contraction ($r < 0.50$), state purity degradation. | `modify_feature_map` (Switch to robust Pauli-Z / Chebyshev encoding) |
| `F3` | **LR Misconfiguration** | Oscillatory loss spikes, extreme parameter velocity ($v > 2.0$). | `scale_learning_rate` (Adaptive geometric learning rate scaling) |
| `F4` | **Parameter Freezing** | Zero parameter velocity ($v < 10^{-4}$), stagnant training loss. | `perturb_parameters` (Stochastic orthogonal parameter perturbation) |
| `F5` | **Phase Shift Drift** | Coherent rotation drift, Bloch angle precession. | `scale_learning_rate` / `modify_feature_map` |
| `F6` | **Loss Explosion** | Numerical divergence, gradient norm overflow ($\|\mathbf{g}\| > 10.0$), NaNs. | `perform_warm_restart` (Reversion to best checkpoint + momentum reset) |

---

## Repository Structure

```
Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning/
├── backend/                             # Core Python Self-Healing Engine & REST API
│   ├── api.py                          # FastAPI application & real-time WebSocket gateway
│   ├── bandit.py                       # LinUCB & Thompson Sampling contextual bandits
│   ├── deployment.py                   # Atomic transaction engine (Commit / Rollback)
│   ├── detection.py                    # Multi-heuristic statistical anomaly detector
│   ├── diagnosis.py                    # Gaussian Naïve Bayes & Bayesian Confidence Gate
│   ├── digital_twin.py                 # Isolated H=3 forward simulation sandbox
│   ├── evaluation.py                   # Multi-objective reward equation calculator
│   ├── memory.py                       # SQLite episodic memory & episode recorder
│   ├── monitoring.py                   # 12D telemetry extraction & state tracker
│   ├── pipeline.py                     # Master autonomous self-healing coordinator
│   ├── qml_model.py                    # PennyLane VQC model, circuits, & datasets
│   ├── repair_library.py               # 6 discrete candidate repair implementations
│   ├── run_slice.py                    # Standalone vertical slice demonstration script
│   └── safety_filter.py                # Parameter bounds & gradient norm safety gates
├── frontend/                            # Next.js 14 Real-Time Web Dashboard
│   ├── app/                            # Next.js App Router (layout, page, globals.css)
│   ├── components/                     # Apple-inspired interface components
│   │   ├── BanditMonitor.tsx           # Bandit action probabilities & LinUCB posteriors
│   │   ├── BlochSphere.tsx             # Interactive 3D Canvas Bloch sphere visualizer
│   │   ├── DeploymentMonitor.tsx       # Transactional rollback ledger & health status
│   │   ├── DiagnosisPanel.tsx          # Bayesian root-cause probabilities & gate state
│   │   ├── DigitalTwinPanel.tsx        # Forward simulation matrix & trajectory preview
│   │   ├── FailureInjectionPanel.tsx   # Manual fault injection cockpit
│   │   ├── Header.tsx                  # System status bar & experiment controls
│   │   ├── LossChart.tsx               # Real-time SVG training/validation convergence
│   │   ├── MemoryAndAuditLog.tsx       # SQLite episode log & historical audit trail
│   │   ├── MetricsRow.tsx              # Live telemetry cards (Loss, Accuracy, Grad Norm)
│   │   └── RepairCockpit.tsx           # Manual repair triggers & validation status
│   ├── package.json                    # Frontend dependencies & npm scripts
│   └── tailwind.config.ts              # Custom Apple-inspired styling configuration
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
│   ├── CLAIM_EVIDENCE_MATRIX.md        # Audit matrix mapping claims to raw data
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
- **RAM:** Minimum 4 GB (8 GB recommended for benchmark campaigns).
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

To ensure clarity for researchers, evaluators, and beginners, this repository supports **four distinct execution modes**. Please review which mode suits your immediate need:

| Mode | Purpose | Command | Typical Runtime | Resource Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Mode 1** | Interactive Web Dashboard | `npm run dev` + `uvicorn` | Continuous | Low (1 browser tab) |
| **Mode 2** | Fast Vertical Slice CLI | `python backend/run_slice.py` | **~5–8 seconds** | Very Low |
| **Mode 3** | Automated Pytest Suite | `pytest -q` | **~9–10 seconds** | Very Low |
| **Mode 4** | Full Benchmark Campaign | `python scripts/benchmark_*.py` | **1–3 hours** | High (Multi-seed) |

### Mode 1: Full-Stack Web Dashboard
Provides an Apple-inspired visual control center. Real-time telemetry, 3D Bloch sphere updates, anomaly alerts, Bayesian confidence indicators, and manual fault injection controls are streamed over WebSockets (`ws://127.0.0.1:8000/ws/telemetry`).

### Mode 2: Fast Vertical Slice CLI Verification
If you want an immediate, non-visual verification that the entire pipeline functions correctly (nominal training $\to$ fault injection $\to$ anomaly detection $\to$ confidence gating $\to$ LinUCB selection $\to$ digital-twin validation $\to$ atomic commit):
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
> ⚠️ **IMPORTANT NOTICE:**  
> All Stage 8 benchmark campaign results are **already computed, audited, and frozen** in the [`benchmark_results/`](benchmark_results/) directory. The raw JSON files and high-resolution figures in `benchmark_results/figures/` match the published manuscript.
> 
> You do **not** need to rerun the benchmarks to inspect the data or run the application. Re-running the full benchmark scripts executes over 3,000 quantum training episodes across multiple seeds and takes **several hours**:
> - `python scripts/benchmark_calibration_n300.py` (300 episodes, ~15 mins)
> - `python scripts/benchmark_policy_regret.py` (1,200 episodes, ~45 mins)
> - `python scripts/benchmark_ablation_study.py` (1,200 episodes, ~45 mins)
> - `python scripts/benchmark_per_class.py` (300 episodes, ~15 mins)
> - `python scripts/generate_publication_figures.py` (Regenerates all publication figures in ~5 seconds)

---

## Dashboard Walkthrough & Telemetry

When running the Next.js dashboard (`http://localhost:3000`), you have access to a unified telemetry surface:

1. **Header & Lifecycle Bar:**
   - Real-time connection badge (WebSocket ping/pong).
   - "Start Autonomous Training", "Pause", and "Reset Experiment" controls.
   - Live step counter and active pipeline state (`HEALTHY_TRAINING`, `CONFIDENCE_GATE_HOLD`, `VALIDATING_REPAIR`, `COMMITTED`, `ROLLED_BACK`).
2. **Metrics Row:**
   - Primary scalar cards: Training Loss, Validation Loss, Validation Accuracy, Gradient Norm, and Learning Rate.
3. **Loss & Convergence Stream:**
   - Real-time SVG line charts tracking train vs. validation loss and validation accuracy across steps.
4. **Interactive 3D Bloch Sphere Visualizer:**
   - Rendered using HTML5 Canvas with analytical inverse noise mitigation.
   - Shows true noisy quantum state Bloch coordinates $(r_x, r_y, r_z)$, state purity $\gamma = \frac{1 + \|\mathbf{r}\|^2}{2}$, and error-mitigated trajectories.
5. **Anomaly & Fault Injection Cockpit:**
   - Trigger any of the 6 physical quantum failures with customizable severity sliders.
6. **Bayesian Diagnosis Panel:**
   - Horizontal probability bars showing $P(F_k \mid \mathbf{x}_t)$ across all 6 fault hypotheses.
   - Visual indicator of the empirical confidence gate ($\tau = 0.60$).
7. **Bandit & Digital Twin Matrices:**
   - LinUCB action selection probabilities and ridge posterior vector norms.
   - Forward simulation trajectory preview ($H=3$) comparing candidate repairs against baseline drift.
8. **Deployment Ledger & SQLite Memory Log:**
   - Real-time transaction audit displaying repair timestamps, validation outcomes, commit/rollback statuses, and rewards.

---

## Mathematical & Algorithmic Foundations

### 1. Multi-Objective Reward Function
When a candidate repair is deployed, its quality is evaluated over a validation window of length $W_{\text{val}} = 3$ using a normalized multi-objective reward equation:

$$R_t = w_{\Delta L} \cdot \Delta L_{\text{norm}} + w_{\text{acc}} \cdot \Delta \text{Acc} + w_g \cdot \tanh(10 \cdot \Delta \|\mathbf{g}\|) - w_d \cdot \Delta D_{\text{norm}} + \text{Bonus}$$

Where:
- $w_{\Delta L} = 0.35$: Weight for fractional loss improvement $\Delta L_{\text{norm}} = \frac{L_{\text{pre}} - L_{\text{post}}}{L_{\text{pre}} + \epsilon}$.
- $w_{\text{acc}} = 0.25$: Weight for validation accuracy change $\Delta \text{Acc} = \text{Acc}_{\text{post}} - \text{Acc}_{\text{pre}} \in [-1, +1]$.
- $w_g = 0.20$: Weight for gradient restoration mapped via hyperbolic tangent $\tanh(10 \cdot (\bar{g}_{\text{post}} - \bar{g}_{\text{pre}})) \in [-1, +1]$.
- $w_d = 0.10$: Penalty for circuit depth expansion $\Delta D_{\text{norm}} = \min(1.0, \frac{\Delta \text{Depth}}{10})$.
- $\text{Bonus}$: Transactional stability bonus: $+0.10$ if repair is successfully committed; $-0.20$ if rejected or rolled back.

### 2. 12-Dimensional Contextual Embedding ($\mathbf{x}_t \in \mathbb{R}^{12}$)
The continuous state vector supplied to the Bayesian diagnostician and LinUCB bandit is defined as:
1. Normalized Training Loss: $\min(5.0, L_t) / 5.0 \in [0, 1]$
2. Normalized Validation Loss: $\min(5.0, L_{\text{val}, t}) / 5.0 \in [0, 1]$
3. Validation Accuracy: $\text{Acc}_t \in [0, 1]$
4. Log Gradient Norm: $\log_{10}(\|\mathbf{g}_t\|_2 + 10^{-8}) / 8.0 \in [-1, 1]$
5. Normalized Gradient Variance: $\tanh(100 \cdot \text{Var}[\mathbf{g}_t]) \in [0, 1]$
6. Normalized Parameter Velocity: $\tanh(10 \cdot \|\boldsymbol{\theta}_t - \boldsymbol{\theta}_{t-1}\|_2) \in [0, 1]$
7. Normalized Learning Rate: $\min(1.0, \eta_t) \in [0, 1]$
8. Normalized Circuit Depth: $\min(50, D_t) / 50.0 \in [0, 1]$
9. Bloch Coordinate $r_x$: $\frac{r_x + 1.0}{2.0} \in [0, 1]$
10. Bloch Coordinate $r_y$: $\frac{r_y + 1.0}{2.0} \in [0, 1]$
11. Bloch Coordinate $r_z$: $\frac{r_z + 1.0}{2.0} \in [0, 1]$
12. Quantum State Purity: $\gamma = \frac{1 + r_x^2 + r_y^2 + r_z^2}{2} \in [0.5, 1.0]$

### 3. Contextual LinUCB Decision Rule
For each candidate repair arm $a \in \mathcal{A}$, the bandit maintains a ridge precision matrix $A_a \in \mathbb{R}^{12 \times 12}$ and reward accumulator $b_a \in \mathbb{R}^{12}$. The arm selected maximizes:

$$a_t = \arg\max_{a \in \mathcal{A}} \left[ \hat{\theta}_a^T \mathbf{x}_t + \alpha \sqrt{\mathbf{x}_t^T A_a^{-1} \mathbf{x}_t} \right], \quad \text{where } \hat{\theta}_a = A_a^{-1} b_a$$

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
If port 8000 or 3000 is occupied by an orphaned process:
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

### 3. PennyLane Device Warnings
PennyLane operates seamlessly on `default.qubit`. If you see a warning regarding PyTorch or TensorFlow, ignore it—the backend uses standard NumPy and SciPy for quantum tensor contractions and autograd operations.

---

## Manuscript & Scientific Dossier

All research documentation, peer-reviewed reference validations, and manuscript drafts are maintained in the [`manuscript/`](manuscript/) directory:
- **`manuscript/MANUSCRIPT_DRAFT.md`**: Complete, formal journal article draft with Abstract, Sections I–X, Tables 1–4, and Figures 1–5.
- **`manuscript/REFERENCE_VERIFICATION.md`**: Bibliographic audit verifying DOIs, authors, titles, and publication venues for all 20 cited references.
- **`manuscript/CLAIM_EVIDENCE_MATRIX.md`**: Mathematical and experimental claim traceability matrix linking every paper claim to exact JSON data files and lines of code.
- **`manuscript/FIGURE_TABLE_PLAN.md`**: Detailed captions, data provenance, and SHA-256 cryptographic hashes for all publication figures and tables.
- **`manuscript/AUTHOR_REVIEW_CHECKLIST.md`**: Formal author review and reproducibility checklist.

---

## Citation & Academic Integrity

If you use this framework, dataset, or benchmark methodology in your research, please cite:

```bibtex
@misc{arvinth2026adaptiveselfhealing,
  author       = {Adharsh Arvinth and Collaborators},
  title        = {Adaptive Self-Healing Framework for Quantum Machine Learning: Closed-Loop Telemetry, Bayesian Root-Cause Diagnosis, and Contextual Bandit Repair},
  year         = {2026},
  publisher    = {GitHub},
  howpublished = {\url{https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning}},
  note         = {Capstone Research Project, Vellore Institute of Technology (VIT), Registration: 22MID0324}
}
```

### Institutional Disclosure & License
This project was developed as a Capstone Research Project at **Vellore Institute of Technology (VIT)**.  
Released under the [MIT License](LICENSE).
