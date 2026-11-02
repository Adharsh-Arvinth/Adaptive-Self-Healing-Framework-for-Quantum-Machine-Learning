# System Architecture: Adaptive Self-Healing Framework for Quantum Machine Learning

**Status:** APPROVED ARCHITECTURAL SPECIFICATION  
**Version:** 1.0.0  
**Date:** March 2026

---

## 1. System Architecture Overview

The system is organized into a modular, decoupled architecture where quantum computation, autonomous control, storage, and presentation remain strictly separated:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Apple-Inspired Frontend                         │
│   Next.js 15+ • React 19 • TypeScript • Tailwind CSS • Motion • Recharts│
│  (Overview, Health, Detection, Diagnosis, Memory, Repairs, Twins, Lab) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP REST / WebSocket JSON
┌───────────────────────────────────▼────────────────────────────────────┐
│                        FastAPI Orchestration Gateway                   │
│   Asynchronous Job Scheduler • Telemetry Streaming • Run Controller    │
└──────┬────────────────────────────┬─────────────────────────────┬──────┘
       │ Execution Commands         │ Telemetry Feed              │ State Queries
┌──────▼────────────────────────────▼─────────────────────────────▼──────┐
│                    Autonomous Self-Healing Core Engine                 │
│                                                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐  │
│  │  monitoring.py   │  │   detection.py   │  │     diagnosis.py     │  │
│  │ Telemetry Buffer │─▶│ Anomaly Detectors│─▶│ Confidence Gated Bel.│  │
│  └──────────────────┘  └──────────────────┘  └──────────┬───────────┘  │
│                                                         │              │
│  ┌──────────────────┐  ┌──────────────────┐             ▼              │
│  │ safety_filter.py │◀─│repair_library.py │◀─┌──────────────────────┐  │
│  │ Anti-Oscillation │  │ 6 Pure Transforms│  │      memory.py       │  │
│  └────────┬─────────┘  └──────────────────┘  │ Cosine Similarity DB │  │
│           │ Safe Arms                        └──────────────────────┘  │
│  ┌────────▼─────────┐  ┌──────────────────┐                            │
│  │ digital_twin.py  │─▶│    bandit.py     │                            │
│  │ Proxy Simulation │  │ Contextual TS    │                            │
│  └──────────────────┘  └────────┬─────────┘                            │
│                                 │ Action a*                            │
│  ┌──────────────────┐  ┌────────▼─────────┐  ┌──────────────────────┐  │
│  │  deployment.py   │─▶│   qml_model.py   │◀─│     evaluation.py    │  │
│  │ Atomic Checkpoint│  │  PennyLane VQC   │  │ Reward & Metrics Eval│  │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Fourteen-Phase Workflow to Thirteen-Module Specification

| Phase # | Phase Title | Responsible Module | Inputs | Outputs | Core Algorithmic Role |
|---|---|---|---|---|---|
| **1** | VQC Model Training | `qml_model.py` | Dataset, Hyperparameters, $\boldsymbol{\theta}$ | $\mathcal{L}_t, \operatorname{Acc}_t, \mathbf{g}_t$ | Executes variational circuit on simulator via parameter-shift |
| **2** | Health Monitoring | `monitoring.py` | Training outputs, parameters | $\mathbf{h}_t, \mathcal{W}_t$ | Aggregates rolling statistics, norms, velocities |
| **3** | Failure Detection | `detection.py` | $\mathcal{W}_t$ | Anomaly events $\mathcal{E}_t$ | Evaluates statistical thresholds across sliding windows |
| **4** | Root-Cause Diagnosis | `diagnosis.py` | $\mathcal{E}_t, \mathcal{W}_t$ | Belief vector $\mathbf{p}_t$ | Evidence weighting kernel & softmax belief distribution |
| **5** | Confidence Gate | `diagnosis.py` | $\mathbf{p}_t, \tau_{\text{conf}}$ | Gate decision $\{0, 1\}$ | Prevents blind repair if max confidence is below threshold |
| **6** | Failure Memory Retrieval | `memory.py` | $\mathbf{e}_f, \mathcal{M}$ | Top-$K$ priors $\bar{r}_{\text{hist}}$ | Computes cosine similarity over persistent SQLite/JSON store |
| **7** | Candidate Repair Gen. | `repair_library.py` | Model state, Cause | Candidate configs | Generates valid config transforms from locked 6 arms |
| **8** | Safety Filtering | `safety_filter.py` | Candidate configs, History | Approved arms $\mathcal{A}_{\text{safe}}$ | Enforces oscillation guards, depth caps, and bounds |
| **9** | Digital-Twin Simulation | `digital_twin.py` | State clone, $\mathcal{A}_{\text{safe}}$ | $\widehat{\Delta \mathcal{L}}_{\text{twin}}, S_{\text{proxy}}$ | Runs $H$-step proxy training in isolated sandbox |
| **10** | Contextual Thompson Sampling | `bandit.py` | $\mathbf{x}, \mathcal{A}_{\text{safe}}$ | Selected arm $a^*$ | Samples from per-arm Bayesian linear regression posteriors |
| **11** | Safe Atomic Deployment | `deployment.py` | $a^*$, Model state | Deployed state, snapshot | Saves checkpoint, commits transform, sets rollback trap |
| **12** | Performance Evaluation | `evaluation.py` | Pre/Post telemetry | Multi-objective reward $r$ | Computes normalized reward; evaluates acceptance criteria |
| **13** | Continuous Learning | `memory.py`, `bandit.py` | $r, \mathbf{x}, a^*$ | Updated $\mathbf{B}_a, \boldsymbol{\mu}_a, \mathcal{M}$ | Recursive Bayesian posterior update & experience write |
| **14** | Pipeline Orchestration | `pipeline.py`, `run_slice.py` | Config file / CLI | Execution report, logs | Master loop coordination and vertical slice demo |

---

## 3. Module Interface Specifications

### 1. `qml_model.py`
```python
class VQCModel:
    def __init__(self, config: CircuitConfig): ...
    def forward(self, x: np.ndarray) -> np.ndarray: ...
    def compute_loss_and_gradients(self, x_batch: np.ndarray, y_batch: np.ndarray) -> Tuple[float, float, np.ndarray]: ...
    def train_step(self, x_batch: np.ndarray, y_batch: np.ndarray) -> StepMetrics: ...
    def get_state(self) -> ModelState: ...
    def set_state(self, state: ModelState) -> None: ...
    def inject_failure(self, failure_type: FailureType, severity: float) -> None: ...
```

### 2. `monitoring.py`
```python
class HealthMonitor:
    def __init__(self, window_size: int = 10): ...
    def record_step(self, metrics: StepMetrics) -> HealthObservation: ...
    def get_sliding_window(self) -> List[HealthObservation]: ...
    def get_telemetry_summary(self) -> TelemetrySummary: ...
```

### 3. `detection.py`
```python
class FailureDetector:
    def __init__(self, thresholds: DetectionThresholds): ...
    def evaluate(self, window: List[HealthObservation]) -> List[DetectedFailure]: ...
```

### 4. `diagnosis.py`
```python
class DiagnosisEngine:
    def __init__(self, confidence_threshold: float = 0.60): ...
    def diagnose(self, failures: List[DetectedFailure], window: List[HealthObservation]) -> DiagnosisResult: ...
```

### 5. `memory.py`
```python
class FailureMemory:
    def __init__(self, storage_path: str = "data/memory.db"): ...
    def store_episode(self, episode: FailureEpisode) -> None: ...
    def retrieve_similar(self, query_embedding: np.ndarray, top_k: int = 5) -> List[SimilarEpisode]: ...
```

### 6. `repair_library.py`
```python
class RepairLibrary:
    def generate_candidate_repairs(self, model_state: ModelState, diagnosis: DiagnosisResult) -> Dict[RepairArm, CandidateRepair]: ...
    def apply_transform(self, model_state: ModelState, arm: RepairArm) -> ModelState: ...
```

### 7. `safety_filter.py`
```python
class SafetyFilter:
    def __init__(self, max_depth: int = 8, min_lr: float = 1e-4, max_lr: float = 1.0): ...
    def filter_repairs(self, candidates: Dict[RepairArm, CandidateRepair], history: List[RepairEvent]) -> Dict[RepairArm, CandidateRepair]: ...
```

### 8. `digital_twin.py`
```python
class DigitalTwin:
    def __init__(self, horizon_steps: int = 3): ...
    def simulate_repair(self, base_state: ModelState, arm: RepairArm, val_data: Tuple[np.ndarray, np.ndarray]) -> TwinSimulationResult: ...
```

### 9. `bandit.py`
```python
class ContextualThompsonSampler:
    def __init__(self, num_arms: int = 6, context_dim: int = 12, v: float = 0.5, l2_reg: float = 1.0): ...
    def build_context(self, diagnosis: DiagnosisResult, telemetry: TelemetrySummary, twin_results: Dict[RepairArm, TwinSimulationResult]) -> np.ndarray: ...
    def select_action(self, context: np.ndarray, eligible_arms: List[int]) -> int: ...
    def update_posterior(self, arm: int, context: np.ndarray, reward: float) -> None: ...
    def save_state(self, path: str) -> None: ...
    def load_state(self, path: str) -> None: ...
```

### 10. `deployment.py`
```python
class SafeDeploymentManager:
    def prepare_deployment(self, model: VQCModel, selected_repair: CandidateRepair) -> DeploymentTransaction: ...
    def commit(self, transaction: DeploymentTransaction) -> None: ...
    def rollback(self, transaction: DeploymentTransaction) -> None: ...
```

### 11. `evaluation.py`
```python
class PerformanceEvaluator:
    def evaluate_repair(self, pre_metrics: HealthObservation, post_metrics: HealthObservation, costs: RepairCosts) -> EvaluationOutcome: ...
```

### 12. `pipeline.py` & `run_slice.py`
```python
class SelfHealingPipeline:
    def __init__(self, config: PipelineConfig): ...
    def run_training_loop(self, epochs: int) -> TrainingSummary: ...
```
