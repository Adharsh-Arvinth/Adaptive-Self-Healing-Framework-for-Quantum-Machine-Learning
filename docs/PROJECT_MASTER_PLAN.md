# Master Project Plan: Adaptive Self-Healing Framework for Quantum Machine Learning

**Status:** APPROVED FOR STAGE 1 SPECIFICATION  
**Author:** AI Research Engineering Team (Lead AI Research Engineer, Quantum ML Architect, Full-Stack Developer, Algorithm Designer, Research Scientist, QA Specialist)  
**Institution/Context:** Capstone Research & Development / VIT (22MID0324)  
**Date:** March 2026 (Assessment & Architecture Phase)

---

## 1. Executive Summary & Vision

Near-term Quantum Machine Learning (QML), particularly Variational Quantum Circuits (VQCs) running on Noisy Intermediate-Scale Quantum (NISQ) hardware or classical simulators, is severely hindered by training instability. Known pathologies include:
1. **Barren Plateaus (BPs)** — exponential concentration of measure causing vanishing gradients $\mathcal{O}(2^{-n})$.
2. **Learning-Rate Misconfiguration** — oscillatory divergence or stagnation.
3. **Optimizer Instability** — erratic parameter trajectory or Hessian ill-conditioning.
4. **Training Divergence** — explosive parameter updates or numerical NaN/Inf generation.
5. **Persistent Loss Plateau** — saddle points and trap-dominated landscapes.
6. **Noise-Induced Degradation** — depolarizing, dephasing, or amplitude damping pushing quantum states toward maximally mixed states $\rho \to \frac{I}{2^n}$.

Existing remedies are almost entirely **manual and open-loop** (hyperparameter grids, static ansatz design rules, offline heuristic choices). When automated recovery is attempted in classical ML (e.g., AutoTrainer), the repair is a fixed lookup table that cannot adapt or learn from experience.

This project delivers an **Adaptive Self-Healing Framework for QML** that closes the loop:
$$\text{VQC Training} \longrightarrow \text{Telemetry Monitoring} \longrightarrow \text{Anomaly Detection} \longrightarrow \text{Probabilistic Diagnosis} \longrightarrow \text{Confidence Gating}$$
$$\longrightarrow \text{Memory Retrieval} \longrightarrow \text{Candidate Repair Generation} \longrightarrow \text{Safety Filtering} \longrightarrow \text{Digital-Twin Simulation}$$
$$\longrightarrow \text{Contextual Thompson Sampling Selection} \longrightarrow \text{Safe Deployment} \longrightarrow \text{Outcome Verification} \longrightarrow \text{Memory \& Posterior Updates}$$

---

## 2. Fourteen-Phase Workflow to Thirteen-Module Architecture Mapping

To resolve the prompt's noted discrepancy between the 14-phase execution workflow and 13 named Python files, the mapping is formally defined below:

| Workflow Phase | Phase Description | Primary Python Module | Supporting Module / Mechanism |
|---|---|---|---|
| **Phase 1** | VQC Model Training & Execution | `qml_model.py` | PennyLane QNode, PyTorch/Autograd interfaces |
| **Phase 2** | Training Health Monitoring | `monitoring.py` | Telemetry extractor, running stats buffer |
| **Phase 3** | Anomaly & Failure Detection | `detection.py` | Multi-window statistical threshold detectors |
| **Phase 4** | Root-Cause Diagnosis | `diagnosis.py` | Bayesian / Evidential belief scoring engine |
| **Phase 5** | Confidence Gating & Safe Abstention | `diagnosis.py` | Confidence gate threshold ($\tau_{\text{conf}}$) & observation hold |
| **Phase 6** | Failure Memory & Prior Retrieval | `memory.py` | Cosine similarity vector store, persistent SQLite/JSON |
| **Phase 7** | Candidate Repair Generation | `repair_library.py` | 6 discrete parameter/configuration transforms |
| **Phase 8** | Safety Filtering & Anti-Oscillation | `safety_filter.py` | History buffer, budget checks, loop detection |
| **Phase 9** | Digital-Twin Proxy Simulation | `digital_twin.py` | Isolated branch clone, short-horizon proxy execution |
| **Phase 10** | Contextual Adaptive Decision-Making | `bandit.py` | Contextual Thompson Sampling with Bayesian linear posteriors |
| **Phase 11** | Safe Deployment & Transaction Check | `deployment.py` | Atomic state swap, rollback checkpoints |
| **Phase 12** | Outcome Evaluation & Reward Fusion | `evaluation.py` | Multi-objective normalized reward calculation |
| **Phase 13** | Memory & Policy Posterior Update | `memory.py` & `bandit.py` | Recursive Bayesian posterior updates & experience write |
| **Phase 14** | End-to-End Orchestration & Pipeline | `pipeline.py` & `run_slice.py` | Master loop coordinator & standalone vertical demonstration |

*Note:* Supporting modules include `config.py` (hyperparameters and schemas), `api.py` (FastAPI backend), and the Next.js/React frontend.

---

## 3. The Six Locked Repair Arms

No arms are added or deleted. Each arm is formulated as an immutable, side-effect-free configuration transform:

1. **Arm 1: Change Optimizer**  
   - *Transform:* $\text{Adam} \leftrightarrow \text{RMSprop} \leftrightarrow \text{SGD with Nesterov Momentum} \leftrightarrow \text{QNG (Quantum Natural Gradient)}$
   - *Preconditions:* Optimizer state divergence or high variance.
   - *Rollback:* Restore previous optimizer class and internal momentum buffers.

2. **Arm 2: Reduce Circuit Depth**  
   - *Transform:* Prune trailing entangling/rotational layers ($L \leftarrow \max(1, L - \Delta L)$).
   - *Preconditions:* Barren plateau detected; variance $\operatorname{Var}(\nabla_\theta \mathcal{L}) < \epsilon_{\text{BP}}$.
   - *Rollback:* Restore full layer parameter tensor and circuit specification.

3. **Arm 3: Modify Feature Map**  
   - *Transform:* Switch data encoding (e.g., Angle Embedding $\rightarrow$ IQP / ZZFeatureMap or Amplitude Embedding) or scale factor $\gamma$.
   - *Preconditions:* Persistent loss plateau or low expressive power.
   - *Rollback:* Re-encode using original feature map.

4. **Arm 4: Adjust Learning Rate**  
   - *Transform:* Multiplicative step decay $\eta \leftarrow \eta \cdot \alpha_{\text{decay}}$ or warm-up escalation $\eta \leftarrow \eta \cdot \alpha_{\text{boost}}$.
   - *Preconditions:* Gradient explosion, loss NaN/Inf, or sub-critical parameter velocity.
   - *Rollback:* Restore previous learning rate $\eta_{\text{prev}}$.

5. **Arm 5: Apply Noise Mitigation**  
   - *Transform:* Zero-Noise Extrapolation (ZNE) scale factors or Readout Error Mitigation (measurement calibration matrix inversion).
   - *Scope:* Clearly marked as simulation-side error mitigation; hardware-level claims are explicitly quarantined.
   - *Rollback:* Disable mitigation wrapper.

6. **Arm 6: Perform Warm Restart**  
   - *Transform:* Perturb parameters $\theta \leftarrow \theta_{\text{best}} + \mathcal{N}(0, \sigma^2)$ or re-initialize near identity (Identity block initialization to avoid barren plateaus).
   - *Preconditions:* Trapped in sub-optimal local minimum or saddle point.
   - *Rollback:* Revert to pre-restart parameters $\theta_{\text{prev}}$.

---

## 4. Multi-Phase Implementation Roadmap

- **Stage 1 (Current):** Literature Survey, Prior-Art Matrix, Novelty Definition, SRS, Formal Math, Architecture Approval.
- **Stage 2:** Core Quantum Foundation (`qml_model.py`, PennyLane VQC, baseline dataset, synthetic failure injection).
- **Stage 3:** Telemetry, Detection & Confidence-Gated Diagnosis (`monitoring.py`, `detection.py`, `diagnosis.py`).
- **Stage 4:** Persistent Experience Memory, Safety Filter & Repair Library (`memory.py`, `safety_filter.py`, `repair_library.py`).
- **Stage 5:** Digital Twin & Contextual Thompson Sampling (`digital_twin.py`, `bandit.py`, multi-objective reward).
- **Stage 6:** Atomic Deployment, Rollback & Pipeline Orchestration (`deployment.py`, `evaluation.py`, `pipeline.py`, `run_slice.py`).
- **Stage 7:** FastAPI Orchestration & Apple-Inspired Research Dashboard (Next.js, Tailwind, Motion, Recharts, Base UI).
- **Stage 8:** Scientific Validation & Empirical Benchmarking (Multi-seed trials, Ablation studies, Regret analysis).
- **Stage 9:** Research Manuscript & Indian CRI Patent Disclosure Preparation.
