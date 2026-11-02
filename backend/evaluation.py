"""
Multi-Objective Recovery Evaluation Engine.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 6).

Implements empirical reward computation and recovery metrics:
  - Normalized, non-redundant reward components.
  - Locked weights: w1=0.40, w2=0.25, w3=0.15, w4=0.05, w5=0.05, w6=0.10.
  - Strict distinction between digital-twin predicted reward and actual observed reward.
  - Audit logging of recovery telemetry and deployment outcomes.
"""

from dataclasses import dataclass, field
import time
from typing import Any, Dict, List, Optional
import numpy as np

from backend.repair_library import RepairArm
from backend.deployment import DeploymentRecord, DeploymentStatus


@dataclass
class RecoveryEvaluation:
    """Complete diagnostic and empirical evaluation of a deployed repair."""
    evaluation_id: str
    experiment_id: str
    repair_arm: RepairArm
    status: DeploymentStatus
    # Telemetry before and after
    loss_pre: float
    loss_post: float
    loss_improvement_fraction: float  # (loss_pre - loss_post) / loss_pre
    acc_pre: float
    acc_post: float
    acc_improvement: float  # acc_post - acc_pre
    grad_norm_pre: float
    grad_norm_post: float
    gradient_health_term: float
    circuit_evaluations: int
    computational_cost_term: float
    depth_pre: int
    depth_post: int
    circuit_complexity_penalty: float
    was_rolled_back: bool
    rollback_penalty_term: float
    # Rewards
    predicted_reward: float  # Estimated by Digital Twin prior to deployment
    actual_reward: float     # Real empirical multi-objective reward in [-1.0, 1.0]
    prediction_error: float  # abs(predicted_reward - actual_reward)
    # Component breakdown
    components: Dict[str, float] = field(default_factory=dict)
    weights: Dict[str, float] = field(default_factory=dict)
    timestamp: float = field(default_factory=time.time)


def compute_multi_objective_reward(
    loss_pre: float,
    loss_post: float,
    acc_pre: float,
    acc_post: float,
    grad_norm_pre: float,
    grad_norm_post: float,
    failure_type: str,
    circuit_evaluations: int = 0,
    depth_pre: int = 2,
    depth_post: int = 2,
    was_rolled_back: bool = False,
    max_depth: int = 8,
    w_loss: float = 0.40,
    w_acc: float = 0.25,
    w_grad: float = 0.15,
    w_cost: float = 0.05,
    w_depth: float = 0.05,
    w_rollback: float = 0.10,
) -> float:
    """
    Centralized computation of multi-objective recovery reward r in [-1.0, 1.0] (DEF-005).
    Balances fractional loss improvement, accuracy delta, gradient health restoration,
    computational overhead, circuit complexity change, and rollback penalty.
    Strictly follows Section 9 in ALGORITHM_SPECIFICATION.md.
    """
    # 1. Normalized Fractional Loss Improvement in [-1.0, 1.0]
    if loss_pre > 1e-6 and not np.isnan(loss_pre) and not np.isinf(loss_pre):
        delta_loss_frac = (loss_pre - loss_post) / loss_pre
    else:
        delta_loss_frac = 0.0
    delta_loss_norm = float(np.clip(delta_loss_frac, -1.0, 1.0))

    # 2. Accuracy Delta in [-1.0, 1.0]
    delta_acc = float(np.clip(acc_post - acc_pre, -1.0, 1.0))

    # 3. Gradient Health Restoration (Restricted to vanishing gradient / plateau faults)
    ft_lower = str(failure_type).lower()
    if ("barren_plateau" in ft_lower or "persistent_plateau" in ft_lower) and grad_norm_pre > 0.0:
        ratio = (grad_norm_post - grad_norm_pre) / (grad_norm_pre + 1e-6)
        r_grad = float(np.tanh(ratio))
    else:
        r_grad = 0.0  # Zeroed out to prevent double-counting in other faults

    # 4. Normalized Computational Cost in [0.0, 1.0]
    c_cost = float(np.clip(circuit_evaluations / 500.0, 0.0, 1.0))

    # 5. Circuit Complexity Penalty in [0.0, 1.0]
    delta_depth = float(max(0, depth_post - depth_pre) / float(max_depth))

    # 6. Rollback Penalty in {0.0, 1.0}
    i_rollback = 1.0 if was_rolled_back else 0.0

    actual_r = (
        w_loss * delta_loss_norm
        + w_acc * delta_acc
        + w_grad * r_grad
        - w_cost * c_cost
        - w_depth * delta_depth
        - w_rollback * i_rollback
    )
    return float(np.clip(actual_r, -1.0, 1.0))


class EvaluationEngine:
    """
    Evaluates repair efficacy post-deployment, computes multi-objective reward vectors,
    and isolates predicted from actual outcomes.
    """

    def __init__(
        self,
        w_loss: float = 0.40,
        w_acc: float = 0.25,
        w_grad: float = 0.15,
        w_cost: float = 0.05,
        w_depth: float = 0.05,
        w_rollback: float = 0.10,
        max_depth: int = 8,
    ):
        self.w_loss = w_loss
        self.w_acc = w_acc
        self.w_grad = w_grad
        self.w_cost = w_cost
        self.w_depth = w_depth
        self.w_rollback = w_rollback
        self.max_depth = max_depth

        total_w = w_loss + w_acc + w_grad + w_cost + w_depth + w_rollback
        assert np.isclose(total_w, 1.0, atol=1e-5), f"Reward weights must sum to 1.0. Sum: {total_w}"

    def evaluate_deployment(
        self,
        deployment: DeploymentRecord,
        failure_type: str,
        circuit_evaluations: int = 0,
        predicted_reward: float = 0.0,
        depth_pre: int = 2,
        depth_post: int = 2,
    ) -> RecoveryEvaluation:
        """
        Compute empirical recovery evaluation and multi-objective reward r in [-1, 1].
        """
        loss_pre = deployment.loss_pre
        loss_post = deployment.loss_post
        acc_pre = deployment.acc_pre
        acc_post = deployment.acc_post
        grad_norm_pre = deployment.grad_norm_pre
        grad_norm_post = deployment.grad_norm_post
        was_rolled_back = (deployment.status == DeploymentStatus.ROLLED_BACK)

        # 1. Normalized Fractional Loss Improvement in [-1.0, 1.0]
        if loss_pre > 1e-6 and not np.isnan(loss_pre) and not np.isinf(loss_pre):
            delta_loss_frac = (loss_pre - loss_post) / loss_pre
        else:
            delta_loss_frac = 0.0
        delta_loss_norm = float(np.clip(delta_loss_frac, -1.0, 1.0))

        # 2. Accuracy Delta in [-1.0, 1.0]
        delta_acc = float(np.clip(acc_post - acc_pre, -1.0, 1.0))

        # 3. Gradient Health Restoration (Restricted to vanishing gradient / plateau faults)
        ft_lower = str(failure_type).lower()
        if ("barren_plateau" in ft_lower or "persistent_plateau" in ft_lower) and grad_norm_pre > 0.0:
            ratio = (grad_norm_post - grad_norm_pre) / (grad_norm_pre + 1e-6)
            r_grad = float(np.tanh(ratio))
        else:
            r_grad = 0.0  # Zeroed out to prevent double-counting in other faults

        # 4. Normalized Computational Cost in [0.0, 1.0]
        c_cost = float(np.clip(circuit_evaluations / 500.0, 0.0, 1.0))

        # 5. Circuit Complexity Penalty in [0.0, 1.0]
        delta_depth = float(max(0, depth_post - depth_pre) / float(self.max_depth))

        # 6. Rollback Penalty in {0.0, 1.0}
        i_rollback = 1.0 if was_rolled_back else 0.0

        # Multi-Objective Weighted Reward Sum computed via centralized function (DEF-005)
        actual_reward = compute_multi_objective_reward(
            loss_pre=loss_pre,
            loss_post=loss_post,
            acc_pre=acc_pre,
            acc_post=acc_post,
            grad_norm_pre=grad_norm_pre,
            grad_norm_post=grad_norm_post,
            failure_type=failure_type,
            circuit_evaluations=circuit_evaluations,
            depth_pre=depth_pre,
            depth_post=depth_post,
            was_rolled_back=was_rolled_back,
            max_depth=self.max_depth,
            w_loss=self.w_loss,
            w_acc=self.w_acc,
            w_grad=self.w_grad,
            w_cost=self.w_cost,
            w_depth=self.w_depth,
            w_rollback=self.w_rollback,
        )
        pred_err = abs(predicted_reward - actual_reward)

        evaluation_id = f"eval_{deployment.deployment_id}"
        return RecoveryEvaluation(
            evaluation_id=evaluation_id,
            experiment_id=deployment.experiment_id,
            repair_arm=deployment.repair_arm,
            status=deployment.status,
            loss_pre=loss_pre,
            loss_post=loss_post,
            loss_improvement_fraction=delta_loss_norm,
            acc_pre=acc_pre,
            acc_post=acc_post,
            acc_improvement=delta_acc,
            grad_norm_pre=grad_norm_pre,
            grad_norm_post=grad_norm_post,
            gradient_health_term=r_grad,
            circuit_evaluations=circuit_evaluations,
            computational_cost_term=c_cost,
            depth_pre=depth_pre,
            depth_post=depth_post,
            circuit_complexity_penalty=delta_depth,
            was_rolled_back=was_rolled_back,
            rollback_penalty_term=i_rollback,
            predicted_reward=predicted_reward,
            actual_reward=actual_reward,
            prediction_error=pred_err,
            components={
                "delta_loss_norm": delta_loss_norm,
                "delta_acc": delta_acc,
                "r_grad": r_grad,
                "c_cost": c_cost,
                "delta_depth": delta_depth,
                "i_rollback": i_rollback,
            },
            weights={
                "w_loss": self.w_loss,
                "w_acc": self.w_acc,
                "w_grad": self.w_grad,
                "w_cost": self.w_cost,
                "w_depth": self.w_depth,
                "w_rollback": self.w_rollback,
            },
        )
