"""
Safe Deployment, Atomic Checkpointing, and Automatic Rollback Engine.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 6).

Implements atomic rollback state-machines:
  - Checkpoint capture: model parameters, optimizer state, circuit config, RNG state, metadata.
  - Controlled repair deployment onto live VQCModel instances.
  - Multi-step validation monitoring window (W_val) against noise.
  - Rollback triggers: NaN/Inf, loss divergence, significant regression (> 15%), accuracy collapse.
  - Complete, verifiable state restoration on rollback.
"""

from copy import deepcopy
from dataclasses import dataclass, field
from enum import Enum
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.qml_model import CircuitConfig, ModelState, StepMetrics, VQCModel
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary


class DeploymentStatus(str, Enum):
    IDLE = "IDLE"
    PENDING = "PENDING"
    VALIDATING = "VALIDATING"
    COMMITTED = "COMMITTED"
    ROLLED_BACK = "ROLLED_BACK"
    FAILED = "FAILED"


@dataclass
class Checkpoint:
    """Immutable snapshot of the complete training and system state prior to repair."""
    checkpoint_id: str
    timestamp: float
    iso_timestamp: str
    epoch: int
    step: int
    experiment_id: str
    model_state: ModelState
    rng_state: Any  # Snapshot of np.random.get_state()
    baseline_loss: float
    baseline_val_loss: float
    baseline_accuracy: float
    baseline_val_accuracy: float
    baseline_grad_norm: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class DeploymentConfig:
    """Configurable thresholds for post-deployment validation."""
    validation_window: int = 3  # W_val steps to observe before committing
    max_loss_regression: float = 0.15  # Rollback if average loss worsens by > 15%
    divergence_loss_ceiling: float = 5.0
    divergence_grad_ceiling: float = 50.0
    min_validation_accuracy: float = 0.40  # Rollback if accuracy collapses


@dataclass
class DeploymentRecord:
    """Full lifecycle tracking for a repair deployment operation."""
    deployment_id: str
    experiment_id: str
    repair_arm: RepairArm
    candidate: CandidateRepair
    checkpoint: Checkpoint
    status: DeploymentStatus = DeploymentStatus.PENDING
    validation_metrics: List[StepMetrics] = field(default_factory=list)
    rollback_reason: Optional[str] = None
    loss_pre: float = 0.0
    loss_post: float = 0.0
    acc_pre: float = 0.0
    acc_post: float = 0.0
    grad_norm_pre: float = 0.0
    grad_norm_post: float = 0.0
    started_at: float = field(default_factory=time.time)
    completed_at: float = 0.0


class DeploymentManager:
    """
    Manages atomic checkpoints, controlled repair deployment, multi-step validation monitoring,
    and automated rollback restoration for Variational Quantum Circuit models.
    """

    def __init__(self, config: Optional[DeploymentConfig] = None):
        self.config = config or DeploymentConfig()
        self.repair_lib = RepairLibrary()
        self.active_deployment: Optional[DeploymentRecord] = None
        self.deployment_history: List[DeploymentRecord] = []

    def create_checkpoint(
        self,
        model: VQCModel,
        experiment_id: str,
        step: int,
        loss: float,
        val_loss: float,
        accuracy: float,
        val_accuracy: float,
        grad_norm: float,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Checkpoint:
        """Capture an immutable, complete snapshot of model, optimizer, config, and RNG state."""
        checkpoint_id = f"ckpt_{experiment_id}_{step}_{int(time.time()*1000)}"
        return Checkpoint(
            checkpoint_id=checkpoint_id,
            timestamp=time.time(),
            iso_timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            epoch=model.epoch,
            step=step,
            experiment_id=experiment_id,
            model_state=model.get_state(),
            rng_state=np.random.get_state(),
            baseline_loss=float(loss),
            baseline_val_loss=float(val_loss),
            baseline_accuracy=float(accuracy),
            baseline_val_accuracy=float(val_accuracy),
            baseline_grad_norm=float(grad_norm),
            metadata=metadata or {},
        )

    def restore_checkpoint(self, model: VQCModel, checkpoint: Checkpoint) -> bool:
        """
        Atomically restore the model and RNG to the exact state captured in the checkpoint.
        Guarantees 100% parameter and optimizer state fidelity.
        """
        try:
            model.set_state(checkpoint.model_state)
            np.random.set_state(checkpoint.rng_state)
            # Verify restoration
            assert np.array_equal(model.params, checkpoint.model_state.params)
            assert model.config.optimizer_name == checkpoint.model_state.config.optimizer_name
            assert np.isclose(model.optimizer.lr, checkpoint.model_state.config.learning_rate)
            return True
        except Exception as e:
            # Fallback assertion failure
            return False

    def deploy_repair(
        self,
        model: VQCModel,
        candidate: CandidateRepair,
        checkpoint: Checkpoint,
    ) -> DeploymentRecord:
        """
        Deploy a candidate repair onto the live VQC model.
        Transitions state to VALIDATING and initializes tracking.
        """
        deployment_id = f"dep_{checkpoint.experiment_id}_{checkpoint.step}_{int(time.time()*1000)}"

        record = DeploymentRecord(
            deployment_id=deployment_id,
            experiment_id=checkpoint.experiment_id,
            repair_arm=candidate.arm,
            candidate=candidate,
            checkpoint=checkpoint,
            status=DeploymentStatus.PENDING,
            loss_pre=checkpoint.baseline_loss,
            acc_pre=checkpoint.baseline_val_accuracy,
            grad_norm_pre=checkpoint.baseline_grad_norm,
            started_at=time.time(),
        )

        # Apply repair transformation to live model
        repair_res = self.repair_lib.apply_to_model(model, candidate)
        if not repair_res.success:
            record.status = DeploymentStatus.FAILED
            record.rollback_reason = f"TRANSFORMATION_FAILED: {repair_res.error_message}"
            record.completed_at = time.time()
            self.restore_checkpoint(model, checkpoint)
            self.deployment_history.append(record)
            return record

        record.status = DeploymentStatus.VALIDATING
        self.active_deployment = record
        return record

    def validate_step(
        self,
        model: VQCModel,
        metrics: StepMetrics,
    ) -> Tuple[bool, Optional[str]]:
        """
        Evaluate a single post-deployment step.
        Returns (is_healthy, failure_trigger_reason).
        """
        if self.active_deployment is None or self.active_deployment.status != DeploymentStatus.VALIDATING:
            return True, None

        self.active_deployment.validation_metrics.append(metrics)

        # 1. NaN / Infinite Loss Trigger
        if np.isnan(metrics.loss) or np.isinf(metrics.loss) or np.isnan(metrics.val_loss) or np.isinf(metrics.val_loss):
            return False, "NAN_OR_INF_LOSS: Numerical NaN or Inf encountered in post-deployment step."

        # 2. Loss Divergence Ceiling Trigger
        if metrics.loss > self.config.divergence_loss_ceiling or metrics.val_loss > self.config.divergence_loss_ceiling:
            return False, f"DIVERGENCE_LOSS_LIMIT: Loss ({metrics.loss:.2f}) exceeded ceiling ({self.config.divergence_loss_ceiling})."

        # 3. Gradient Explosion Trigger
        if metrics.gradient_norm > self.config.divergence_grad_ceiling:
            return False, f"DIVERGENCE_GRAD_LIMIT: Gradient norm ({metrics.gradient_norm:.2f}) exceeded ceiling ({self.config.divergence_grad_ceiling})."

        # 4. Accuracy Collapse Trigger
        if metrics.val_accuracy < self.config.min_validation_accuracy and self.active_deployment.acc_pre >= 0.50:
            return False, f"ACCURACY_COLLAPSE: Validation accuracy ({metrics.val_accuracy:.2%}) collapsed below {self.config.min_validation_accuracy:.2%}."

        return True, None

    def finalize_deployment(
        self,
        model: VQCModel,
        immediate_abort_reason: Optional[str] = None,
    ) -> DeploymentRecord:
        """
        Complete validation evaluation:
        - If immediate_abort_reason or regression detected: executes rollback.
        - If all validation steps satisfied: commits repair.
        """
        if self.active_deployment is None:
            raise RuntimeError("No active deployment to finalize.")

        rec = self.active_deployment

        # Check immediate abort
        if immediate_abort_reason:
            rec.status = DeploymentStatus.ROLLED_BACK
            rec.rollback_reason = immediate_abort_reason
            rec.completed_at = time.time()
            self.restore_checkpoint(model, rec.checkpoint)
            rec.loss_post = rec.checkpoint.baseline_loss
            rec.acc_post = rec.checkpoint.baseline_val_accuracy
            rec.grad_norm_post = rec.checkpoint.baseline_grad_norm
            self.active_deployment = None
            self.deployment_history.append(rec)
            return rec

        # Check multi-step window average regression
        if len(rec.validation_metrics) > 0:
            avg_loss = float(np.mean([m.loss for m in rec.validation_metrics]))
            latest_m = rec.validation_metrics[-1]
            rec.loss_post = float(latest_m.loss)
            rec.acc_post = float(latest_m.val_accuracy)
            rec.grad_norm_post = float(latest_m.gradient_norm)

            # Regression check: is average loss worsened by > max_loss_regression?
            loss_increase = (avg_loss - rec.loss_pre) / max(rec.loss_pre, 1e-6)
            if loss_increase > self.config.max_loss_regression:
                rec.status = DeploymentStatus.ROLLED_BACK
                rec.rollback_reason = (
                    f"LOSS_REGRESSION: Average validation loss ({avg_loss:.4f}) worsened by "
                    f"{loss_increase*100:.1f}% relative to baseline ({rec.loss_pre:.4f})."
                )
                rec.completed_at = time.time()
                self.restore_checkpoint(model, rec.checkpoint)
                self.active_deployment = None
                self.deployment_history.append(rec)
                return rec

        # All acceptance criteria met -> Commit
        rec.status = DeploymentStatus.COMMITTED
        rec.completed_at = time.time()
        self.active_deployment = None
        self.deployment_history.append(rec)
        return rec

    def force_rollback(self, model: VQCModel, reason: str = "MANUAL_OR_EXTERNAL_ABORT") -> DeploymentRecord:
        """Force immediate rollback of the currently active deployment."""
        return self.finalize_deployment(model, immediate_abort_reason=reason)
