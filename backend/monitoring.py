"""
Health Monitoring and Telemetry Extraction for Quantum Machine Learning.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 3).
"""

from collections import deque
from dataclasses import dataclass, field
import datetime
import time
from typing import Any, Dict, List, Optional
import numpy as np
from backend.qml_model import StepMetrics


@dataclass
class HealthObservation:
    """Telemetry observation captured at a single training step."""
    step: int
    timestamp: float
    iso_timestamp: str
    experiment_id: str
    loss: float
    val_loss: float
    accuracy: float
    val_accuracy: float
    gradient_norm: float
    gradient_variance: float
    parameter_velocity: float
    learning_rate: float
    circuit_depth: int
    n_qubits: int = 2
    is_valid: bool = True
    error_flags: List[str] = field(default_factory=list)


@dataclass
class TelemetrySummary:
    """Aggregated statistical summary of the recent observation window."""
    window_size: int
    steps_observed: int
    latest_step: int
    # Loss trajectory metrics
    loss_mean: float
    loss_std: float
    loss_min: float
    loss_max: float
    loss_slope: float  # Linear regression slope of loss over window
    loss_delta_recent: float  # L_t - L_{t-1}
    # Validation loss metrics
    val_loss_mean: float
    val_loss_std: float
    train_val_gap: float  # val_loss_mean - loss_mean
    # Accuracy metrics
    accuracy_mean: float
    val_accuracy_mean: float
    # Gradient statistics
    grad_norm_mean: float
    grad_norm_min: float
    grad_norm_max: float
    grad_var_mean: float
    grad_var_min: float
    # Parameter kinematics
    param_velocity_mean: float
    param_velocity_recent: float
    # Behavioral patterns
    oscillation_count: int  # Number of sign reversals in consecutive loss deltas
    loss_cv: float  # Coefficient of variation std / (mean + eps)
    has_nan_or_inf: bool
    invalid_steps_count: int
    n_qubits: int = 2


class HealthMonitor:
    """
    Continuous rolling telemetry extractor.
    Maintains a sliding window of recent health observations, computes rolling statistics,
    and safely handles missing, noisy, or invalid (NaN/Inf) numerical inputs.
    """

    def __init__(self, window_size: int = 10, experiment_id: str = "exp_default"):
        if window_size < 2:
            raise ValueError("Observation window size must be at least 2 steps.")
        self.window_size = window_size
        self.experiment_id = experiment_id
        self.history: List[HealthObservation] = []
        self.window: deque[HealthObservation] = deque(maxlen=window_size)

    def record_step(self, metrics: StepMetrics) -> HealthObservation:
        """
        Record and sanitize a StepMetrics instance from the quantum model training step.
        Safely captures numerical anomalies without crashing.
        """
        now_ts = time.time()
        now_iso = datetime.datetime.fromtimestamp(now_ts, datetime.timezone.utc).isoformat()
        error_flags: List[str] = []
        is_valid = True

        # 1. Sanitize Loss values
        loss = metrics.loss
        if np.isnan(loss):
            error_flags.append("NAN_LOSS")
            loss = 1e6
            is_valid = False
        elif np.isinf(loss):
            error_flags.append("INF_LOSS")
            loss = 1e6
            is_valid = False

        val_loss = metrics.val_loss
        if np.isnan(val_loss):
            error_flags.append("NAN_VAL_LOSS")
            val_loss = 1e6
            is_valid = False
        elif np.isinf(val_loss):
            error_flags.append("INF_VAL_LOSS")
            val_loss = 1e6
            is_valid = False

        # 2. Sanitize Accuracy
        acc = float(np.clip(metrics.accuracy, 0.0, 1.0)) if not np.isnan(metrics.accuracy) else 0.0
        val_acc = float(np.clip(metrics.val_accuracy, 0.0, 1.0)) if not np.isnan(metrics.val_accuracy) else 0.0

        # 3. Sanitize Gradient metrics
        grad_norm = metrics.gradient_norm
        if np.isnan(grad_norm) or np.isinf(grad_norm):
            error_flags.append("INVALID_GRAD_NORM")
            grad_norm = 1e6
            is_valid = False
        else:
            grad_norm = float(max(0.0, grad_norm))

        grad_var = metrics.gradient_variance
        if np.isnan(grad_var) or np.isinf(grad_var):
            error_flags.append("INVALID_GRAD_VAR")
            grad_var = 0.0
            is_valid = False
        else:
            grad_var = float(max(0.0, grad_var))

        # 4. Parameter velocity
        param_vel = metrics.parameter_velocity
        if np.isnan(param_vel) or np.isinf(param_vel):
            error_flags.append("INVALID_PARAM_VEL")
            param_vel = 0.0
            is_valid = False
        else:
            param_vel = float(max(0.0, param_vel))

        n_qubits = int(getattr(metrics, "n_qubits", 2))

        obs = HealthObservation(
            step=metrics.epoch,
            timestamp=now_ts,
            iso_timestamp=now_iso,
            experiment_id=self.experiment_id,
            loss=float(loss),
            val_loss=float(val_loss),
            accuracy=acc,
            val_accuracy=val_acc,
            gradient_norm=grad_norm,
            gradient_variance=grad_var,
            parameter_velocity=param_vel,
            learning_rate=float(metrics.learning_rate),
            circuit_depth=metrics.circuit_depth,
            n_qubits=n_qubits,
            is_valid=is_valid,
            error_flags=error_flags,
        )

        self.history.append(obs)
        self.window.append(obs)
        return obs

    def get_window(self) -> List[HealthObservation]:
        """Return the current rolling window of observations."""
        return list(self.window)

    def get_summary(self) -> TelemetrySummary:
        """
        Compute descriptive and kinematic statistics over the current sliding window.
        Handles small window cold-starts gracefully.
        """
        obs_list = list(self.window)
        n = len(obs_list)
        if n == 0:
            return TelemetrySummary(
                window_size=self.window_size,
                steps_observed=0,
                latest_step=0,
                loss_mean=0.0, loss_std=0.0, loss_min=0.0, loss_max=0.0, loss_slope=0.0, loss_delta_recent=0.0,
                val_loss_mean=0.0, val_loss_std=0.0, train_val_gap=0.0,
                accuracy_mean=0.0, val_accuracy_mean=0.0,
                grad_norm_mean=0.0, grad_norm_min=0.0, grad_norm_max=0.0,
                grad_var_mean=0.0, grad_var_min=0.0,
                param_velocity_mean=0.0, param_velocity_recent=0.0,
                oscillation_count=0, loss_cv=0.0,
                has_nan_or_inf=False, invalid_steps_count=0,
                n_qubits=2,
            )

        losses = np.array([o.loss for o in obs_list], dtype=float)
        val_losses = np.array([o.val_loss for o in obs_list], dtype=float)
        accs = np.array([o.accuracy for o in obs_list], dtype=float)
        val_accs = np.array([o.val_accuracy for o in obs_list], dtype=float)
        grad_norms = np.array([o.gradient_norm for o in obs_list], dtype=float)
        grad_vars = np.array([o.gradient_variance for o in obs_list], dtype=float)
        param_vels = np.array([o.parameter_velocity for o in obs_list], dtype=float)

        has_nan_or_inf = any(not o.is_valid for o in obs_list)
        invalid_count = sum(1 for o in obs_list if not o.is_valid)

        # Loss Slope via Simple Linear Regression over window steps
        if n >= 2:
            x_steps = np.arange(n, dtype=float)
            x_mean = np.mean(x_steps)
            y_mean = np.mean(losses)
            denom = np.sum((x_steps - x_mean) ** 2)
            slope = float(np.sum((x_steps - x_mean) * (losses - y_mean)) / (denom + 1e-12))
            recent_delta = float(losses[-1] - losses[-2])
        else:
            slope = 0.0
            recent_delta = 0.0

        # Loss Oscillation Count: sign reversals in consecutive deltas
        oscillation_count = 0
        if n >= 3:
            deltas = np.diff(losses)
            signs = np.sign(deltas)
            for i in range(len(signs) - 1):
                if signs[i] * signs[i + 1] < 0 and abs(deltas[i]) > 0.02:
                    oscillation_count += 1

        loss_mean = float(np.mean(losses))
        loss_std = float(np.std(losses))
        loss_cv = float(loss_std / (loss_mean + 1e-8))

        return TelemetrySummary(
            window_size=self.window_size,
            steps_observed=n,
            latest_step=obs_list[-1].step,
            loss_mean=loss_mean,
            loss_std=loss_std,
            loss_min=float(np.min(losses)),
            loss_max=float(np.max(losses)),
            loss_slope=slope,
            loss_delta_recent=recent_delta,
            val_loss_mean=float(np.mean(val_losses)),
            val_loss_std=float(np.std(val_losses)),
            train_val_gap=float(np.mean(val_losses) - loss_mean),
            accuracy_mean=float(np.mean(accs)),
            val_accuracy_mean=float(np.mean(val_accs)),
            grad_norm_mean=float(np.mean(grad_norms)),
            grad_norm_min=float(np.min(grad_norms)),
            grad_norm_max=float(np.max(grad_norms)),
            grad_var_mean=float(np.mean(grad_vars)),
            grad_var_min=float(np.min(grad_vars)),
            param_velocity_mean=float(np.mean(param_vels)),
            param_velocity_recent=float(param_vels[-1]),
            oscillation_count=oscillation_count,
            loss_cv=loss_cv,
            has_nan_or_inf=has_nan_or_inf,
            invalid_steps_count=invalid_count,
            n_qubits=obs_list[-1].n_qubits if hasattr(obs_list[-1], "n_qubits") else 2,
        )

    def export_history(self) -> List[Dict[str, Any]]:
        """Export all recorded observations as serializable dictionaries."""
        return [
            {
                "step": o.step,
                "timestamp": o.timestamp,
                "iso_timestamp": o.iso_timestamp,
                "loss": o.loss,
                "val_loss": o.val_loss,
                "accuracy": o.accuracy,
                "val_accuracy": o.val_accuracy,
                "gradient_norm": o.gradient_norm,
                "gradient_variance": o.gradient_variance,
                "parameter_velocity": o.parameter_velocity,
                "learning_rate": o.learning_rate,
                "circuit_depth": o.circuit_depth,
                "n_qubits": getattr(o, "n_qubits", 2),
                "is_valid": o.is_valid,
                "error_flags": o.error_flags,
            }
            for o in self.history
        ]
