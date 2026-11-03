"""
FastAPI Backend Gateway & Real-Time WebSocket Telemetry Server.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 7).

Exposes:
  - REST endpoints for experiment lifecycle, manual failure injection, and telemetry inspection.
  - Asynchronous background worker for continuous autonomous self-healing training.
  - High-frequency WebSockets broadcasting live quantum metrics, Bloch coordinates,
    anomalies, root-cause diagnosis, digital-twin predictions, bandit decisions, and deployment events.
"""

import asyncio
from contextlib import asynccontextmanager
from dataclasses import asdict
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional, Set
import numpy as np

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root directory is on PYTHONPATH
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

# Ensure data directory exists for SQLite and bandit storage
os.makedirs(os.path.join(PROJECT_ROOT, "data"), exist_ok=True)

from backend.qml_model import CircuitConfig, FailureType, VQCModel, load_dataset
from backend.repair_library import CandidateRepair, RepairArm
from backend.deployment import DeploymentStatus
from backend.pipeline import PipelineState, PipelineStepResult, SelfHealingPipeline


# ----------------------------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------------------------

class StartExperimentRequest(BaseModel):
    dataset: str = Field(default="moons", description="Dataset name: 'moons', 'circles', or 'iris'")
    seed: int = Field(default=42, description="Random seed")
    learning_rate: float = Field(default=0.05, ge=1e-4, le=1.0)
    n_layers: int = Field(default=2, ge=1, le=8)
    n_qubits: int = Field(default=2, ge=2, le=4)
    feature_map: str = Field(default="angle")
    optimizer_name: str = Field(default="adam")
    step_delay_ms: int = Field(default=250, ge=0, le=5000, description="Delay between autonomous steps")
    max_steps: int = Field(default=60, ge=1, le=500)


class InjectFailureRequest(BaseModel):
    failure_type: str = Field(description="One of the 6 FailureTypes")
    severity: float = Field(default=1.0, ge=0.1, le=5.0)


class SimulateTwinRequest(BaseModel):
    repair_arm: str = Field(description="One of the 6 RepairArms: change_optimizer, reduce_circuit_depth, modify_feature_map, adjust_learning_rate, apply_noise_mitigation, perform_warm_restart")


class TriggerRepairRequest(BaseModel):
    repair_arm: str = Field(description="One of the 6 RepairArms: change_optimizer, reduce_circuit_depth, modify_feature_map, adjust_learning_rate, apply_noise_mitigation, perform_warm_restart")


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "1.0.0"
    framework: str = "PennyLane 0.45.1"
    timestamp: float = Field(default_factory=time.time)


# ----------------------------------------------------------------------
# Global Application & Pipeline State Manager
# ----------------------------------------------------------------------

class GlobalStateManager:
    """Manages the active pipeline instance, background runner, and WebSocket client connections."""

    def __init__(self):
        self.pipeline: Optional[SelfHealingPipeline] = None
        self.model: Optional[VQCModel] = None
        self.X_train: Optional[Any] = None
        self.y_train: Optional[Any] = None
        self.X_val: Optional[Any] = None
        self.y_val: Optional[Any] = None

        self.is_running = False
        self.step_delay_ms = 250
        self.max_steps = 60
        self.runner_task: Optional[asyncio.Task] = None

        self.active_connections: Set[WebSocket] = set()
        self.telemetry_history: List[Dict[str, Any]] = []

    def initialize_experiment(self, req: StartExperimentRequest) -> None:
        """Initialize or reset the QML model, dataset, and self-healing pipeline."""
        X_tr, y_tr, X_v, y_v = load_dataset(req.dataset, seed=req.seed)
        self.X_train, self.y_train, self.X_val, self.y_val = X_tr, y_tr, X_v, y_v

        config = CircuitConfig(
            n_qubits=req.n_qubits,
            n_layers=req.n_layers,
            feature_map=req.feature_map,
            ansatz_type="basic_entangling",
            optimizer_name=req.optimizer_name,
            learning_rate=req.learning_rate,
            seed=req.seed,
        )
        self.model = VQCModel(config)
        self.pipeline = SelfHealingPipeline(
            model=self.model,
            experiment_id=f"exp_{req.dataset}_{int(time.time())}",
            memory_db_path=os.path.join(PROJECT_ROOT, "data", "api_failure_memory.db"),
            bandit_storage_path=os.path.join(PROJECT_ROOT, "data", "api_bandit_posteriors.json"),
            confidence_threshold=0.60,
            validation_window=3,
            seed=req.seed,
        )
        self.step_delay_ms = req.step_delay_ms
        self.max_steps = req.max_steps
        self.telemetry_history.clear()

    async def connect_client(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect_client(self, websocket: WebSocket) -> None:
        self.active_connections.discard(websocket)

    async def broadcast(self, message: Dict[str, Any]) -> None:
        """Safely broadcast a JSON event to all connected WebSocket clients."""
        if not self.active_connections:
            return

        dead_connections = set()
        msg_text = json.dumps(message)
        for client in self.active_connections:
            try:
                await client.send_text(msg_text)
            except Exception:
                dead_connections.add(client)

        for dead in dead_connections:
            self.active_connections.discard(dead)

    def execute_single_step(self) -> Dict[str, Any]:
        """Execute one autonomous cycle of the pipeline and format payload."""
        if self.pipeline is None:
            raise RuntimeError("Pipeline not initialized")

        res: PipelineStepResult = self.pipeline.step(
            self.X_train, self.y_train, self.X_val, self.y_val
        )

        bloch = self.model.get_bloch_coordinates()

        payload = {
            "step": res.step,
            "timestamp": time.time(),
            "state": res.state.value,
            "loss": float(res.metrics.loss),
            "val_loss": float(res.metrics.val_loss),
            "accuracy": float(res.metrics.accuracy),
            "val_accuracy": float(res.metrics.val_accuracy),
            "gradient_norm": float(res.metrics.gradient_norm),
            "gradient_variance": float(res.metrics.gradient_variance),
            "parameter_velocity": float(res.metrics.parameter_velocity),
            "learning_rate": float(res.metrics.learning_rate),
            "circuit_depth": int(res.metrics.circuit_depth),
            "optimizer_name": self.model.config.optimizer_name,
            "feature_map": self.model.config.feature_map,
            "bloch": bloch,
            "anomalies": [a.failure_type.value for a in res.anomalies],
            "diagnosis": None,
            "bandit_decision": None,
            "twin_prediction": None,
            "deployment": None,
            "evaluation": None,
            "events": [{"state": e.state.value, "message": e.message} for e in res.events],
        }

        if res.diagnosis:
            payload["diagnosis"] = {
                "primary_cause": res.diagnosis.primary_cause.value if res.diagnosis.primary_cause else None,
                "confidence": float(res.diagnosis.confidence),
                "probabilities": res.diagnosis.probabilities,
                "confidence_gate_cleared": bool(res.diagnosis.confidence_gate_cleared),
                "supporting_evidence": res.diagnosis.supporting_evidence,
            }

        if res.bandit_decision:
            payload["bandit_decision"] = {
                "selected_arm": res.bandit_decision.selected_arm.value,
                "sampled_reward": float(res.bandit_decision.sampled_reward),
                "expected_reward": float(res.bandit_decision.expected_reward),
                "eligible_arms": [a.value for a in res.bandit_decision.eligible_arms],
                "decision_mode": res.bandit_decision.decision_mode,
            }

        if res.deployment_record:
            payload["deployment"] = {
                "deployment_id": res.deployment_record.deployment_id,
                "repair_arm": res.deployment_record.repair_arm.value,
                "status": res.deployment_record.status.value,
                "rollback_reason": res.deployment_record.rollback_reason,
                "loss_pre": float(res.deployment_record.loss_pre),
                "loss_post": float(res.deployment_record.loss_post),
            }

        if res.evaluation:
            payload["evaluation"] = {
                "evaluation_id": res.evaluation.evaluation_id,
                "actual_reward": float(res.evaluation.actual_reward),
                "predicted_reward": float(res.evaluation.predicted_reward),
                "prediction_error": float(res.evaluation.prediction_error),
                "was_rolled_back": bool(res.evaluation.was_rolled_back),
                "components": res.evaluation.components,
            }

        if getattr(res, "twin_prediction", None):
            pred = res.twin_prediction
            payload["twin_prediction"] = {
                "arm": pred.arm.value if hasattr(pred.arm, "value") else str(pred.arm),
                "horizon": int(pred.horizon),
                "initial_loss": float(pred.initial_loss),
                "predicted_loss_final": float(pred.predicted_loss_final),
                "predicted_loss_delta": float(pred.predicted_loss_delta),
                "normalized_predicted_delta": float(pred.normalized_predicted_delta),
                "proxy_loss_trajectory": [float(v) for v in pred.proxy_loss_trajectory],
                "proxy_stability": float(pred.proxy_stability),
                "proxy_grad_variance": float(pred.proxy_grad_variance),
                "circuit_evaluations": int(pred.circuit_evaluations),
                "is_viable": bool(pred.is_viable),
                "rejection_reason": pred.rejection_reason,
            }

        self.telemetry_history.append(payload)
        return payload

    async def run_training_loop(self) -> None:
        """Asynchronous autonomous training worker."""
        try:
            while self.is_running and self.pipeline and self.pipeline.step_count < self.max_steps:
                payload = self.execute_single_step()
                await self.broadcast({"type": "step_telemetry", "payload": payload})
                if self.step_delay_ms > 0:
                    await asyncio.sleep(self.step_delay_ms / 1000.0)
        except asyncio.CancelledError:
            pass
        finally:
            self.is_running = False
            await self.broadcast({"type": "training_stopped", "payload": {"final_step": self.pipeline.step_count if self.pipeline else 0}})


state_mgr = GlobalStateManager()


# ----------------------------------------------------------------------
# Lifespan and Application Initialization
# ----------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure default model is initialized on startup
    state_mgr.initialize_experiment(StartExperimentRequest())
    yield
    # Gracefully stop runner on shutdown
    if state_mgr.runner_task and not state_mgr.runner_task.done():
        state_mgr.runner_task.cancel()


app = FastAPI(
    title="Adaptive Self-Healing Quantum Machine Learning API",
    description="Full-stack REST and WebSocket interface for autonomous VQC training and self-healing.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----------------------------------------------------------------------
# REST Endpoints
# ----------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
@app.get("/api/health", response_model=HealthResponse)
def get_health():
    """System health status and framework verification."""
    return HealthResponse()


@app.get("/api/experiment/status")
def get_experiment_status():
    """Current experiment configuration, running state, and latest step."""
    if not state_mgr.pipeline or not state_mgr.model:
        return {"status": "NOT_INITIALIZED"}

    latest = state_mgr.telemetry_history[-1] if state_mgr.telemetry_history else None
    return {
        "is_running": state_mgr.is_running,
        "step_count": state_mgr.pipeline.step_count,
        "max_steps": state_mgr.max_steps,
        "pipeline_state": state_mgr.pipeline.state.value,
        "config": asdict(state_mgr.model.config),
        "latest_telemetry": latest,
    }


@app.post("/api/experiment/start")
async def start_experiment(req: StartExperimentRequest):
    """Start autonomous training loop in the background."""
    if state_mgr.is_running:
        return {"status": "ALREADY_RUNNING", "message": "Training loop is already active."}

    # If new configuration or reset requested, initialize
    state_mgr.initialize_experiment(req)
    state_mgr.is_running = True
    state_mgr.runner_task = asyncio.create_task(state_mgr.run_training_loop())

    await state_mgr.broadcast({"type": "training_started", "payload": {"config": asdict(state_mgr.model.config)}})
    return {"status": "STARTED", "experiment_id": state_mgr.pipeline.experiment_id}


@app.post("/api/experiment/stop")
async def stop_experiment():
    """Pause or stop the autonomous background training loop."""
    if state_mgr.is_running and state_mgr.runner_task:
        state_mgr.is_running = False
        state_mgr.runner_task.cancel()
        await state_mgr.broadcast({"type": "training_stopped", "payload": {"step": state_mgr.pipeline.step_count if state_mgr.pipeline else 0}})
        return {"status": "STOPPED"}
    return {"status": "IDLE"}


@app.post("/api/experiment/pause")
async def pause_experiment():
    """Pause autonomous training loop cleanly without resetting state."""
    if state_mgr.is_running and state_mgr.runner_task:
        state_mgr.is_running = False
        state_mgr.runner_task.cancel()
        step = state_mgr.pipeline.step_count if state_mgr.pipeline else 0
        await state_mgr.broadcast({"type": "training_paused", "payload": {"step": step}})
        return {"status": "PAUSED", "step": step}
    return {"status": "NOT_RUNNING"}


@app.post("/api/experiment/resume")
async def resume_experiment():
    """Resume autonomous background training worker from current step."""
    if state_mgr.is_running:
        return {"status": "ALREADY_RUNNING"}
    if not state_mgr.pipeline:
        raise HTTPException(status_code=400, detail="Experiment not initialized")
    state_mgr.is_running = True
    state_mgr.runner_task = asyncio.create_task(state_mgr.run_training_loop())
    step = state_mgr.pipeline.step_count
    await state_mgr.broadcast({"type": "training_resumed", "payload": {"step": step}})
    return {"status": "RESUMED", "step": step}


@app.post("/api/experiment/simulate-twin")
async def simulate_twin(req: SimulateTwinRequest):
    """Run an isolated H=3 forward simulation in the Digital Twin sandbox without mutating model weights."""
    if not state_mgr.pipeline or not state_mgr.model:
        raise HTTPException(status_code=400, detail="Model not initialized")
    try:
        arm = RepairArm(req.repair_arm)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid arm: {req.repair_arm}. Must be one of {[a.value for a in RepairArm]}"
        )
    
    candidates = state_mgr.pipeline.repair_lib.generate_candidate_repairs(state_mgr.model.get_state(), all_arms=True)
    cand = next((c for c in candidates if c.arm == arm), None)
    if not cand:
        raise HTTPException(status_code=400, detail=f"Candidate repair for arm {arm.value} not available")
    
    pred = state_mgr.pipeline.digital_twin.simulate_candidate(
        state_mgr.model,
        cand,
        state_mgr.X_val,
        state_mgr.y_val,
    )
    data = {
        "arm": pred.arm.value,
        "horizon": int(pred.horizon),
        "initial_loss": float(pred.initial_loss),
        "predicted_loss_final": float(pred.predicted_loss_final),
        "predicted_loss_delta": float(pred.predicted_loss_delta),
        "normalized_predicted_delta": float(pred.normalized_predicted_delta),
        "proxy_loss_trajectory": [float(v) for v in pred.proxy_loss_trajectory],
        "proxy_stability": float(pred.proxy_stability),
        "proxy_grad_variance": float(pred.proxy_grad_variance),
        "circuit_evaluations": int(pred.circuit_evaluations),
        "is_viable": bool(pred.is_viable),
        "rejection_reason": pred.rejection_reason,
    }
    await state_mgr.broadcast({"type": "twin_simulated", "payload": data})
    return data


@app.post("/api/experiment/trigger-repair")
async def trigger_repair(req: TriggerRepairRequest):
    """Manually trigger deployment of a candidate repair through safety filtering and atomic validation."""
    if not state_mgr.pipeline or not state_mgr.model:
        raise HTTPException(status_code=400, detail="Model not initialized")
    try:
        arm = RepairArm(req.repair_arm)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid arm: {req.repair_arm}. Must be one of {[a.value for a in RepairArm]}"
        )
    
    candidates = state_mgr.pipeline.repair_lib.generate_candidate_repairs(state_mgr.model.get_state(), all_arms=True)
    cand = next((c for c in candidates if c.arm == arm), None)
    if not cand:
        raise HTTPException(status_code=400, detail=f"Candidate repair for arm {arm.value} not available")
    
    # Check safety filter
    decisions = state_mgr.pipeline.safety_filter.filter_candidates([cand], state_mgr.model.get_state())
    decision = decisions[0] if decisions else None
    if decision and not decision.is_safe:
        return {"status": "BLOCKED_BY_SAFETY_FILTER", "reason": decision.rejection_reason}
    
    # Snapshot checkpoint & deploy
    latest = state_mgr.telemetry_history[-1] if state_mgr.telemetry_history else None
    cur_loss = float(latest["loss"]) if latest else 0.693
    cur_val_loss = float(latest["val_loss"]) if latest else 0.693
    cur_acc = float(latest["accuracy"]) if latest else 0.50
    cur_val_acc = float(latest["val_accuracy"]) if latest else 0.50
    cur_grad_norm = float(latest["gradient_norm"]) if latest else 0.05

    ckpt = state_mgr.pipeline.deployment_mgr.create_checkpoint(
        model=state_mgr.model,
        experiment_id=state_mgr.pipeline.experiment_id,
        step=state_mgr.pipeline.step_count,
        loss=cur_loss,
        val_loss=cur_val_loss,
        accuracy=cur_acc,
        val_accuracy=cur_val_acc,
        grad_norm=cur_grad_norm,
    )
    record = state_mgr.pipeline.deployment_mgr.deploy_repair(state_mgr.model, cand, ckpt)
    state_mgr.pipeline.state = PipelineState.VALIDATING_REPAIR
    state_mgr.pipeline.is_recovering = True
    
    dep_data = {
        "deployment_id": record.deployment_id,
        "repair_arm": record.repair_arm.value,
        "status": record.status.value,
        "loss_pre": float(record.loss_pre),
    }
    await state_mgr.broadcast({"type": "repair_deployed", "payload": dep_data})
    return {"status": "DEPLOYED", "deployment": dep_data}


@app.post("/api/experiment/commit")
async def commit_active_repair():
    """Manually commit active repair during validation."""
    if not state_mgr.pipeline or not state_mgr.pipeline.deployment_mgr.active_deployment:
        raise HTTPException(status_code=400, detail="No active deployment to commit")
    dep = state_mgr.pipeline.deployment_mgr.finalize_deployment(state_mgr.model)
    eval_rec = state_mgr.pipeline._finalize_recovery(dep, was_rolled_back=False)
    state_mgr.pipeline.state = PipelineState.COMMITTED
    state_mgr.pipeline.is_recovering = False
    payload = {
        "status": "COMMITTED",
        "reward": float(eval_rec.actual_reward),
        "deployment_id": dep.deployment_id,
    }
    await state_mgr.broadcast({"type": "repair_committed", "payload": payload})
    return payload


@app.post("/api/experiment/rollback")
async def rollback_active_repair():
    """Manually rollback active repair during validation."""
    if not state_mgr.pipeline or not state_mgr.pipeline.deployment_mgr.active_deployment:
        raise HTTPException(status_code=400, detail="No active deployment to rollback")
    dep = state_mgr.pipeline.deployment_mgr.force_rollback(state_mgr.model, reason="Manual user rollback request")
    eval_rec = state_mgr.pipeline._finalize_recovery(dep, was_rolled_back=True)
    state_mgr.pipeline.state = PipelineState.ROLLED_BACK
    state_mgr.pipeline.is_recovering = False
    payload = {
        "status": "ROLLED_BACK",
        "reason": dep.rollback_reason,
        "reward": float(eval_rec.actual_reward),
        "deployment_id": dep.deployment_id,
    }
    await state_mgr.broadcast({"type": "repair_rolled_back", "payload": payload})
    return payload


@app.post("/api/experiment/step")
async def step_experiment():
    """Execute exactly one step synchronously and broadcast telemetry."""
    if not state_mgr.pipeline:
        raise HTTPException(status_code=400, detail="Experiment not initialized")

    payload = state_mgr.execute_single_step()
    await state_mgr.broadcast({"type": "step_telemetry", "payload": payload})
    return payload


@app.post("/api/experiment/reset")
async def reset_experiment(req: Optional[StartExperimentRequest] = None):
    """Reset model, optimizer, memory, and pipeline to step 0."""
    if state_mgr.is_running and state_mgr.runner_task:
        state_mgr.is_running = False
        state_mgr.runner_task.cancel()

    r = req or StartExperimentRequest()
    state_mgr.initialize_experiment(r)
    await state_mgr.broadcast({"type": "experiment_reset", "payload": {}})
    return {"status": "RESET", "step": 0}


@app.post("/api/experiment/inject-failure")
async def inject_failure(req: InjectFailureRequest):
    """Inject a controlled synthetic failure into the live running model."""
    if not state_mgr.model:
        raise HTTPException(status_code=400, detail="Model not initialized")

    try:
        ft = FailureType(req.failure_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid failure type. Must be one of {[f.value for f in FailureType]}")

    report = state_mgr.model.inject_failure(ft, severity=req.severity)
    await state_mgr.broadcast({"type": "failure_injected", "payload": report})
    return {"status": "INJECTED", "report": report}


@app.get("/api/telemetry/history")
def get_telemetry_history():
    """Return complete time-series history of training telemetry."""
    return {"count": len(state_mgr.telemetry_history), "history": state_mgr.telemetry_history}


@app.get("/api/bandit/posteriors")
def get_bandit_posteriors():
    """Inspect current Bayesian linear regression posteriors for all 6 locked arms."""
    if not state_mgr.pipeline:
        raise HTTPException(status_code=400, detail="Pipeline not initialized")

    res = {}
    for arm, post in state_mgr.pipeline.bandit.posteriors.items():
        res[arm.value] = {
            "update_count": post.update_count,
            "mu": post.mu.tolist(),
            "mu_norm": float(np.linalg.norm(post.mu)),
            "diag_cov": np.diag(post.B_inv).tolist(),
        }
    return res


@app.get("/api/memory/episodes")
def get_memory_episodes():
    """Query persistent SQLite failure memory repository (DEF-007)."""
    if not state_mgr.pipeline:
        raise HTTPException(status_code=400, detail="Pipeline not initialized")

    count = state_mgr.pipeline.memory.count()
    # Retrieve recent episodes chronologically without dummy vectors
    recent_episodes = state_mgr.pipeline.memory.get_recent_episodes(limit=20)

    episodes = []
    for ep in recent_episodes:
        episodes.append({
            "episode_id": ep.episode_id,
            "iso_timestamp": ep.iso_timestamp,
            "diagnosed_cause": ep.diagnosed_cause,
            "confidence": ep.diagnosis_confidence,
            "selected_repair": ep.selected_repair,
            "loss_before": ep.loss_before,
            "loss_after": ep.loss_after,
            "loss_improvement": ep.loss_improvement,
            "reward": ep.reward,
            "status": ep.status,
        })
    return {"total_count": count, "episodes": episodes}


@app.get("/api/benchmarks/summary")
def get_benchmarks_summary():
    """Return verified frozen Stage 8 empirical evaluation summary data."""
    calib_path = os.path.join(PROJECT_ROOT, "benchmark_results", "calibration_n300_results.json")
    policy_path = os.path.join(PROJECT_ROOT, "benchmark_results", "policy_regret_benchmark.json")
    ablation_path = os.path.join(PROJECT_ROOT, "benchmark_results", "ablation_study_results.json")
    per_class_path = os.path.join(PROJECT_ROOT, "benchmark_results", "per_class_performance.json")
    
    out: Dict[str, Any] = {}
    if os.path.exists(calib_path):
        try:
            with open(calib_path, "r", encoding="utf-8") as f:
                d = json.load(f)
                out["calibration"] = d.get("test_split_metrics", {})
        except Exception:
            pass
    if os.path.exists(policy_path):
        try:
            with open(policy_path, "r", encoding="utf-8") as f:
                d = json.load(f)
                out["policy_regret"] = d.get("summary", {})
        except Exception:
            pass
    if os.path.exists(ablation_path):
        try:
            with open(ablation_path, "r", encoding="utf-8") as f:
                d = json.load(f)
                out["ablation"] = d.get("summary", {})
        except Exception:
            pass
    if os.path.exists(per_class_path):
        try:
            with open(per_class_path, "r", encoding="utf-8") as f:
                d = json.load(f)
                out["per_class"] = d.get("per_class_recovery_rates", {})
        except Exception:
            pass
    return out


# ----------------------------------------------------------------------
# WebSocket Telemetry Stream
# ----------------------------------------------------------------------

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """
    Real-time bidirectional WebSocket stream.
    Broadcasts step metrics, Bloch coordinates, diagnosis, digital twin,
    bandit actions, and recovery events.
    """
    await state_mgr.connect_client(websocket)
    # Send welcome handshake with initial state and full history
    try:
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "payload": {
                "step_count": state_mgr.pipeline.step_count if state_mgr.pipeline else 0,
                "is_running": state_mgr.is_running,
                "history": state_mgr.telemetry_history,
                "bloch": state_mgr.model.get_bloch_coordinates() if state_mgr.model else None,
            }
        }))

        # Keep connection alive and accept incoming command messages
        while True:
            data_text = await websocket.receive_text()
            try:
                cmd = json.loads(data_text)
                action = cmd.get("action")
                if action == "step":
                    payload = state_mgr.execute_single_step()
                    await state_mgr.broadcast({"type": "step_telemetry", "payload": payload})
                elif action == "pause":
                    state_mgr.is_running = False
                    await state_mgr.broadcast({"type": "training_stopped", "payload": {}})
            except Exception:
                pass  # Ignore malformed client command messages safely
    except WebSocketDisconnect:
        state_mgr.disconnect_client(websocket)
    except Exception:
        state_mgr.disconnect_client(websocket)
