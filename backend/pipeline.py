"""
Autonomous Self-Healing Pipeline for Quantum Machine Learning.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 6).

Implements the continuous closed-loop MAPE-K orchestration:
  VQC Training
  -> Continuous Health Monitoring
  -> Multi-Window Statistical Anomaly Detection
  -> Probabilistic Root-Cause Diagnosis (Temperature-Scaled)
  -> Strict Confidence Gate (tau = 0.60)
  -> SQLite Failure Memory Nearest-Neighbor Retrieval
  -> Candidate Repair Generation (6 Locked Arms)
  -> Safety Filter & Anti-Oscillation Layer
  -> Digital-Twin Proxy Pre-Deployment Simulation (H = 3)
  -> Contextual Thompson Sampling Action Selection
  -> Safe Atomic Deployment & Checkpoint Creation
  -> Multi-Step Validation Monitoring (W_val)
  -> Automatic Rollback or Permanent Commit
  -> Multi-Objective Empirical Reward Calculation
  -> Continuous Learning Feedback (Memory & Bandit Update)
  -> Resumed Autonomous Training.
"""

from dataclasses import dataclass, field
from enum import Enum
import time
from typing import Any, Callable, Dict, List, Optional, Tuple
import numpy as np

from backend.qml_model import CircuitConfig, FailureType, ModelState, StepMetrics, VQCModel
from backend.monitoring import HealthMonitor, HealthObservation, TelemetrySummary
from backend.detection import DetectedAnomaly, FailureDetector
from backend.diagnosis import DiagnosisEngine, DiagnosisResult
from backend.memory import FailureEpisode, FailureMemory, SimilarEpisode, build_failure_embedding
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary
from backend.safety_filter import RepairHistoryRecord, SafetyDecision, SafetyFilter, SafetyFilterConfig
from backend.digital_twin import DigitalTwinPrediction, DigitalTwinSimulator
from backend.bandit import (
    BanditDecision,
    ContextualThompsonSampler,
    build_context_vector,
    compute_multi_objective_reward,
)
from backend.deployment import Checkpoint, DeploymentConfig, DeploymentManager, DeploymentRecord, DeploymentStatus
from backend.evaluation import EvaluationEngine, RecoveryEvaluation


class PipelineState(str, Enum):
    IDLE = "IDLE"
    HEALTHY_TRAINING = "HEALTHY_TRAINING"
    ANOMALY_DETECTED = "ANOMALY_DETECTED"
    DIAGNOSING = "DIAGNOSING"
    CONFIDENCE_GATE_HOLD = "CONFIDENCE_GATE_HOLD"
    REPAIR_SELECTION = "REPAIR_SELECTION"
    DIGITAL_TWIN_SIMULATING = "DIGITAL_TWIN_SIMULATING"
    DEPLOYING = "DEPLOYING"
    VALIDATING_REPAIR = "VALIDATING_REPAIR"
    COMMITTED = "COMMITTED"
    ROLLED_BACK = "ROLLED_BACK"
    STOPPED = "STOPPED"


@dataclass
class PipelineEvent:
    """Audit log entry capturing internal pipeline state transitions."""
    step: int
    timestamp: float
    state: PipelineState
    message: str
    details: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PipelineStepResult:
    """Summary of operations performed during a single pipeline step."""
    step: int
    state: PipelineState
    metrics: StepMetrics
    observation: HealthObservation
    anomalies: List[DetectedAnomaly] = field(default_factory=list)
    diagnosis: Optional[DiagnosisResult] = None
    bandit_decision: Optional[BanditDecision] = None
    deployment_record: Optional[DeploymentRecord] = None
    evaluation: Optional[RecoveryEvaluation] = None
    twin_prediction: Optional[DigitalTwinPrediction] = None
    events: List[PipelineEvent] = field(default_factory=list)


class SelfHealingPipeline:
    """
    End-to-end autonomous orchestration pipeline for self-healing Variational Quantum Circuits.
    Enforces atomic state transitions, safety constraints, and continuous learning feedback loops.
    """

    def __init__(
        self,
        model: VQCModel,
        experiment_id: str = "exp_self_healing",
        memory_db_path: str = "data/pipeline_memory.db",
        bandit_storage_path: str = "data/pipeline_posteriors.json",
        confidence_threshold: float = 0.60,
        validation_window: int = 3,
        oscillation_window: int = 4,
        seed: int = 42,
    ):
        self.model = model
        self.experiment_id = experiment_id
        self.step_count = 0
        self.state = PipelineState.HEALTHY_TRAINING
        self.is_recovering = False

        # Component Integrations
        self.monitor = HealthMonitor(window_size=10, experiment_id=experiment_id)
        self.detector = FailureDetector()
        self.diagnosis_engine = DiagnosisEngine(confidence_threshold=confidence_threshold)
        self.memory = FailureMemory(db_path=memory_db_path)
        self.repair_lib = RepairLibrary()
        self.safety_filter = SafetyFilter(
            SafetyFilterConfig(oscillation_window=oscillation_window, max_consecutive_failures=2)
        )
        self.digital_twin = DigitalTwinSimulator(horizon=3, max_loss_degradation=0.20, batch_size=20)
        self.bandit = ContextualThompsonSampler(d=12, storage_path=bandit_storage_path, seed=seed)
        self.deployment_mgr = DeploymentManager(DeploymentConfig(validation_window=validation_window))
        self.evaluator = EvaluationEngine()

        # Operational Tracing
        self.repair_history: List[RepairHistoryRecord] = []
        self.event_log: List[PipelineEvent] = []
        self._current_context: Optional[np.ndarray] = None
        self._current_failure_embedding: Optional[np.ndarray] = None
        self._current_twin_pred: Optional[DigitalTwinPrediction] = None
        self._current_diagnosis: Optional[DiagnosisResult] = None

    def _log_event(self, state: PipelineState, message: str, details: Optional[Dict[str, Any]] = None) -> PipelineEvent:
        evt = PipelineEvent(
            step=self.step_count,
            timestamp=time.time(),
            state=state,
            message=message,
            details=details or {},
        )
        self.event_log.append(evt)
        return evt

    def step(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
    ) -> PipelineStepResult:
        """
        Execute a single autonomous cycle of training, monitoring, failure detection,
        and (if required) recovery orchestration.
        """
        self.step_count += 1
        step_events: List[PipelineEvent] = []

        # ------------------------------------------------------------------
        # Branch A: Post-Deployment Validation Window Active
        # ------------------------------------------------------------------
        if (
            self.deployment_mgr.active_deployment is not None
            and self.deployment_mgr.active_deployment.status == DeploymentStatus.VALIDATING
        ):
            metrics = self.model.train_step(X_train, y_train, X_val, y_val)
            obs = self.monitor.record_step(metrics)

            is_healthy, failure_reason = self.deployment_mgr.validate_step(self.model, metrics)

            # Failure during validation window -> Immediate Rollback
            if not is_healthy:
                dep_record = self.deployment_mgr.finalize_deployment(self.model, immediate_abort_reason=failure_reason)
                self.state = PipelineState.ROLLED_BACK
                evt = self._log_event(
                    PipelineState.ROLLED_BACK,
                    f"Rollback triggered: {failure_reason}",
                    {"deployment_id": dep_record.deployment_id, "reason": failure_reason},
                )
                step_events.append(evt)

                # Multi-objective evaluation of rollback
                eval_record = self._finalize_recovery(dep_record, was_rolled_back=True)
                self.is_recovering = False
                self.state = PipelineState.HEALTHY_TRAINING

                return PipelineStepResult(
                    step=self.step_count,
                    state=PipelineState.ROLLED_BACK,
                    metrics=metrics,
                    observation=obs,
                    deployment_record=dep_record,
                    evaluation=eval_record,
                    events=step_events,
                )

            # Check if validation window is complete
            val_steps_done = len(self.deployment_mgr.active_deployment.validation_metrics)
            if val_steps_done >= self.deployment_mgr.config.validation_window:
                dep_record = self.deployment_mgr.finalize_deployment(self.model)
                was_rolled_back = (dep_record.status == DeploymentStatus.ROLLED_BACK)

                final_state = PipelineState.ROLLED_BACK if was_rolled_back else PipelineState.COMMITTED
                self.state = final_state
                msg = (
                    f"Rollback executed: {dep_record.rollback_reason}"
                    if was_rolled_back
                    else f"Repair {dep_record.repair_arm.value} successfully committed after {val_steps_done} validation steps."
                )
                evt = self._log_event(final_state, msg, {"deployment_id": dep_record.deployment_id})
                step_events.append(evt)

                eval_record = self._finalize_recovery(dep_record, was_rolled_back=was_rolled_back)
                self.is_recovering = False
                self.state = PipelineState.HEALTHY_TRAINING

                return PipelineStepResult(
                    step=self.step_count,
                    state=final_state,
                    metrics=metrics,
                    observation=obs,
                    deployment_record=dep_record,
                    evaluation=eval_record,
                    events=step_events,
                )

            # Still in validation window
            self.state = PipelineState.VALIDATING_REPAIR
            return PipelineStepResult(
                step=self.step_count,
                state=PipelineState.VALIDATING_REPAIR,
                metrics=metrics,
                observation=obs,
                deployment_record=self.deployment_mgr.active_deployment,
                twin_prediction=self._current_twin_pred,
                events=step_events,
            )

        # ------------------------------------------------------------------
        # Branch B: Standard Training Step & Failure Monitoring
        # ------------------------------------------------------------------
        metrics = self.model.train_step(X_train, y_train, X_val, y_val)
        obs = self.monitor.record_step(metrics)
        summary = self.monitor.get_summary()

        # Evaluate statistical anomaly detectors
        anomalies = self.detector.evaluate(summary, obs)
        if not anomalies:
            self.state = PipelineState.HEALTHY_TRAINING
            return PipelineStepResult(
                step=self.step_count,
                state=PipelineState.HEALTHY_TRAINING,
                metrics=metrics,
                observation=obs,
                anomalies=[],
                events=step_events,
            )

        # ------------------------------------------------------------------
        # Branch C: Anomaly Detected -> Probabilistic Diagnosis
        # ------------------------------------------------------------------
        self.state = PipelineState.ANOMALY_DETECTED
        evt_anom = self._log_event(
            PipelineState.ANOMALY_DETECTED,
            f"Detected {len(anomalies)} anomaly conditions at step {self.step_count}.",
            {"anomalies": [a.failure_type.value for a in anomalies]},
        )
        step_events.append(evt_anom)

        # Synthesize diagnosis
        self.state = PipelineState.DIAGNOSING
        diag = self.diagnosis_engine.diagnose(anomalies, summary, obs)
        self._current_diagnosis = diag

        # Confidence Gate Check (tau = 0.60)
        if not diag.confidence_gate_cleared:
            self.state = PipelineState.CONFIDENCE_GATE_HOLD
            evt_hold = self._log_event(
                PipelineState.CONFIDENCE_GATE_HOLD,
                f"Diagnostic confidence ({diag.confidence:.2f}) below threshold ({self.diagnosis_engine.confidence_threshold:.2f}). Holding ungrounded repairs.",
                {"primary_cause": diag.primary_cause.value if diag.primary_cause else None, "confidence": diag.confidence},
            )
            step_events.append(evt_hold)
            return PipelineStepResult(
                step=self.step_count,
                state=PipelineState.CONFIDENCE_GATE_HOLD,
                metrics=metrics,
                observation=obs,
                anomalies=anomalies,
                diagnosis=diag,
                events=step_events,
            )

        # ------------------------------------------------------------------
        # Branch D: Confidence Cleared -> Closed-Loop Self-Healing Recovery
        # ------------------------------------------------------------------
        if self.is_recovering:
            # Prevent duplicate concurrent recovery operations
            return PipelineStepResult(
                step=self.step_count,
                state=PipelineState.HEALTHY_TRAINING,
                metrics=metrics,
                observation=obs,
                anomalies=anomalies,
                diagnosis=diag,
                events=step_events,
            )

        self.is_recovering = True
        self.state = PipelineState.REPAIR_SELECTION

        # 1. Failure Memory Nearest Neighbor Retrieval
        query_emb = build_failure_embedding(obs, summary, diag, max_depth=self.evaluator.max_depth)
        self._current_failure_embedding = query_emb.copy()
        similar_episodes = self.memory.retrieve_similar(query_emb, top_k=3)
        mem_prior_reward = float(similar_episodes[0].episode.reward) if similar_episodes else 0.0
        mem_top_similarity = float(similar_episodes[0].similarity) if similar_episodes else 0.0

        # 2. Candidate Generation across Locked Arms
        candidates = self.repair_lib.generate_candidate_repairs(self.model.get_state(), diag, all_arms=True)

        # 3. Safety Filtering & Anti-Oscillation
        safety_decisions = self.safety_filter.filter_candidates(
            candidates, self.model.get_state(), self.repair_history
        )
        safe_candidates = [c for c in candidates if any(d.arm == c.arm and d.is_safe for d in safety_decisions)]

        if not safe_candidates:
            self.is_recovering = False
            evt_reject = self._log_event(
                PipelineState.HEALTHY_TRAINING,
                "All candidate repairs rejected by SafetyFilter. Resuming baseline monitoring.",
                {"decisions": [(d.arm.value, d.rejection_reason) for d in safety_decisions if not d.is_safe]},
            )
            step_events.append(evt_reject)
            return PipelineStepResult(
                step=self.step_count,
                state=PipelineState.HEALTHY_TRAINING,
                metrics=metrics,
                observation=obs,
                anomalies=anomalies,
                diagnosis=diag,
                events=step_events,
            )

        # 4. Digital Twin Short-Horizon Proxy Simulation (H = 3)
        self.state = PipelineState.DIGITAL_TWIN_SIMULATING
        twin_predictions = self.digital_twin.simulate_all(self.model, safe_candidates, X_val, y_val)

        # 5. Build 12D Context Vector
        # Use top viable prediction for context feature x11 and x12
        viable_preds = [p for p in twin_predictions.values() if p.is_viable]
        best_twin_pred = viable_preds[0] if viable_preds else None
        self._current_twin_pred = best_twin_pred

        ctx = build_context_vector(
            obs=obs,
            summary=summary,
            diag=diag,
            memory_prior_reward=mem_prior_reward,
            memory_top_similarity=mem_top_similarity,
            twin_prediction=best_twin_pred,
            max_depth=self.evaluator.max_depth,
        )
        self._current_context = ctx

        # 6. Contextual Thompson Sampling Action Selection
        bandit_decision = self.bandit.select_arm(
            candidates=candidates,
            context=ctx,
            safety_decisions=safety_decisions,
            twin_predictions=twin_predictions,
        )
        evt_bandit = self._log_event(
            PipelineState.REPAIR_SELECTION,
            f"Contextual Thompson Sampling selected arm: '{bandit_decision.selected_arm.value}' (sampled reward: {bandit_decision.sampled_reward:.4f}).",
            {"arm": bandit_decision.selected_arm.value, "eligible": [a.value for a in bandit_decision.eligible_arms]},
        )
        step_events.append(evt_bandit)

        # 7. Create Atomic Checkpoint & Deploy Repair
        self.state = PipelineState.DEPLOYING
        ckpt = self.deployment_mgr.create_checkpoint(
            model=self.model,
            experiment_id=self.experiment_id,
            step=self.step_count,
            loss=metrics.loss,
            val_loss=metrics.val_loss,
            accuracy=metrics.accuracy,
            val_accuracy=metrics.val_accuracy,
            grad_norm=metrics.gradient_norm,
        )
        dep_record = self.deployment_mgr.deploy_repair(self.model, bandit_decision.candidate, ckpt)
        evt_deploy = self._log_event(
            PipelineState.DEPLOYING,
            f"Deployed repair '{bandit_decision.selected_arm.value}'. Transitioning to validation window (W_val={self.deployment_mgr.config.validation_window}).",
            {"deployment_id": dep_record.deployment_id},
        )
        step_events.append(evt_deploy)

        return PipelineStepResult(
            step=self.step_count,
            state=PipelineState.VALIDATING_REPAIR,
            metrics=metrics,
            observation=obs,
            anomalies=anomalies,
            diagnosis=diag,
            bandit_decision=bandit_decision,
            deployment_record=dep_record,
            twin_prediction=best_twin_pred,
            events=step_events,
        )

    def _finalize_recovery(self, deployment: DeploymentRecord, was_rolled_back: bool) -> RecoveryEvaluation:
        """
        Compute empirical reward and execute continuous feedback updates into
        FailureMemory and Contextual Thompson Sampling posteriors.
        """
        # Calculate evaluations consumed by twin and validation steps
        circuit_evals = 0
        if self._current_twin_pred:
            circuit_evals += self._current_twin_pred.circuit_evaluations
        circuit_evals += len(deployment.validation_metrics) * 50

        failure_type_name = (
            self._current_diagnosis.primary_cause.value
            if (self._current_diagnosis and self._current_diagnosis.primary_cause)
            else "unknown"
        )

        eval_rec = self.evaluator.evaluate_deployment(
            deployment=deployment,
            failure_type=failure_type_name,
            circuit_evaluations=circuit_evals,
            predicted_reward=self._current_twin_pred.normalized_predicted_delta if self._current_twin_pred else 0.0,
            depth_pre=deployment.checkpoint.model_state.config.n_layers,
            depth_post=self.model.config.n_layers,
        )

        # 1. Update Contextual Thompson Sampling Posterior (ONLY with actual empirical reward)
        if self._current_context is not None:
            self.bandit.update_arm(
                arm=deployment.repair_arm,
                context=self._current_context,
                actual_reward=eval_rec.actual_reward,
            )

        # 2. Update Persistent Failure Memory (DEF-001)
        # Store genuine 12D telemetry failure embedding (query_emb), matching retrieval schema
        stored_embedding = (
            self._current_failure_embedding.copy()
            if self._current_failure_embedding is not None
            else (self._current_context.copy() if self._current_context is not None else np.zeros(12, dtype=np.float64))
        )
        if self._current_context is not None or self._current_failure_embedding is not None:
            ep = FailureEpisode(
                episode_id=f"ep_{deployment.deployment_id}",
                timestamp=time.time(),
                iso_timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                experiment_id=self.experiment_id,
                step=deployment.checkpoint.step,
                embedding=stored_embedding,
                diagnosed_cause=failure_type_name,
                diagnosis_confidence=self._current_diagnosis.confidence if self._current_diagnosis else 0.5,
                telemetry_summary={"loss_pre": deployment.loss_pre, "loss_post": deployment.loss_post},
                selected_repair=deployment.repair_arm.value,
                recovery_duration=len(deployment.validation_metrics),
                loss_before=deployment.loss_pre,
                loss_after=deployment.loss_post,
                loss_improvement=eval_rec.loss_improvement_fraction,
                acc_before=deployment.acc_pre,
                acc_after=deployment.acc_post,
                acc_improvement=eval_rec.acc_improvement,
                reward=eval_rec.actual_reward,
                status="ROLLED_BACK" if was_rolled_back else "RESOLVED",
            )
            self.memory.store_episode(ep)

        # 3. Record in Safety Filter History
        self.repair_history.append(
            RepairHistoryRecord(
                step=deployment.checkpoint.step,
                arm=deployment.repair_arm,
                params=deployment.candidate.params,
                status="ROLLED_BACK" if was_rolled_back else "SUCCESS",
                reward=eval_rec.actual_reward,
                timestamp=time.time(),
            )
        )

        return eval_rec
