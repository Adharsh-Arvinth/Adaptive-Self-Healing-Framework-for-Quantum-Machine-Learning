"""
Statistical Failure Detection Engine for Quantum Machine Learning.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 3).
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional
import numpy as np

from backend.qml_model import FailureType
from backend.monitoring import HealthObservation, TelemetrySummary


class AnomalyStatus(str, Enum):
    SUSPECTED = "SUSPECTED"      # Condition met for 1 to (confirm_steps - 1) observations
    CONFIRMED = "CONFIRMED"      # Condition sustained for >= confirm_steps observations


@dataclass
class DetectionThresholds:
    """Configurable statistical thresholds for multi-window failure detection."""
    # Barren Plateau
    bp_grad_norm_max: float = 1e-4
    bp_grad_var_max: float = 1e-5
    bp_param_vel_max: float = 1e-4
    bp_min_loss: float = 0.45  # Must not classify a well-converged model as barren plateau!
    bp_confirm_steps: int = 2

    # Learning Rate Misconfiguration
    lr_oscillation_min_count: int = 1  # At least 1 reversal or large jump
    lr_oscillation_min_delta: float = 0.10  # Magnitude of jumps
    lr_stagnation_param_vel_max: float = 1e-4
    lr_stagnation_grad_norm_min: float = 0.08
    lr_confirm_steps: int = 1

    # Optimizer Instability
    opt_instability_cv_min: float = 0.30  # Loss coefficient of variation
    opt_min_loss: float = 0.40
    opt_confirm_steps: int = 2

    # Training Divergence
    div_loss_max: float = 5.0
    div_grad_norm_max: float = 50.0
    div_confirm_steps: int = 1  # Divergence or NaN is immediate

    # Persistent Loss Plateau (Saddle points, not BP)
    plt_loss_delta_max: float = 0.008  # Negligible loss movement
    plt_min_loss: float = 0.40
    plt_grad_var_min: float = 1e-6  # Gradients are NOT vanishing (distinguishes from BP)
    plt_confirm_steps: int = 2

    # Noise-Related Degradation
    noise_train_val_gap_min: float = 0.08
    noise_val_acc_max: float = 0.72
    noise_loss_std_min: float = 0.03
    noise_confirm_steps: int = 2


@dataclass
class DetectedAnomaly:
    """Structured representation of a detected anomaly or failure."""
    failure_type: FailureType
    status: AnomalyStatus
    step: int
    severity: float  # Scale in [0.0, 1.0]
    confidence: float  # Scale in [0.0, 1.0]
    supporting_evidence: List[str]
    persistence_count: int
    metrics_snapshot: Dict[str, float] = field(default_factory=dict)


class FailureDetector:
    """
    Multi-window statistical anomaly detector.
    Evaluates rolling telemetry against measurable criteria for the six established failure categories,
    tracking persistence counters to distinguish suspected anomalies from confirmed failures.
    """

    def __init__(self, thresholds: Optional[DetectionThresholds] = None):
        self.thresholds = thresholds or DetectionThresholds()
        # Persistence counters across steps for each failure type
        self.consecutive_counts: Dict[FailureType, int] = {ft: 0 for ft in FailureType}

    def evaluate(self, summary: TelemetrySummary, latest_obs: HealthObservation) -> List[DetectedAnomaly]:
        """
        Evaluate recent telemetry summary and return all active anomalies (suspected or confirmed).
        """
        anomalies: List[DetectedAnomaly] = []

        if summary.steps_observed < 2:
            return anomalies  # Need at least 2 steps for statistical assessment

        # Evaluate each failure category independently
        self._evaluate_training_divergence(summary, latest_obs, anomalies)
        self._evaluate_barren_plateau(summary, latest_obs, anomalies)
        self._evaluate_lr_misconfiguration(summary, latest_obs, anomalies)
        self._evaluate_optimizer_instability(summary, latest_obs, anomalies)
        self._evaluate_persistent_plateau(summary, latest_obs, anomalies)
        self._evaluate_noise_degradation(summary, latest_obs, anomalies)

        return anomalies

    # ------------------------------------------------------------------
    # Individual Evaluators
    # ------------------------------------------------------------------

    def _evaluate_training_divergence(
        self, s: TelemetrySummary, o: HealthObservation, anomalies: List[DetectedAnomaly]
    ) -> None:
        ft = FailureType.TRAINING_DIVERGENCE
        evidence: List[str] = []
        is_triggered = False
        severity = 0.0

        if not o.is_valid or s.has_nan_or_inf:
            is_triggered = True
            severity = 1.0
            evidence.append("NaN or Inf detected in loss or gradient telemetry.")
        elif o.loss > self.thresholds.div_loss_max or s.loss_mean > self.thresholds.div_loss_max:
            is_triggered = True
            severity = float(np.clip(o.loss / 20.0, 0.7, 1.0))
            evidence.append(f"Training loss ({o.loss:.2f}) exceeds divergence ceiling ({self.thresholds.div_loss_max}).")
        elif o.gradient_norm > self.thresholds.div_grad_norm_max:
            is_triggered = True
            severity = float(np.clip(o.gradient_norm / 100.0, 0.6, 1.0))
            evidence.append(f"Gradient norm ({o.gradient_norm:.2f}) indicates explosive gradient burst.")

        if is_triggered:
            self.consecutive_counts[ft] += 1
            count = self.consecutive_counts[ft]
            status = AnomalyStatus.CONFIRMED if count >= self.thresholds.div_confirm_steps else AnomalyStatus.SUSPECTED
            confidence = 0.95 if status == AnomalyStatus.CONFIRMED else 0.75
            anomalies.append(DetectedAnomaly(
                failure_type=ft,
                status=status,
                step=o.step,
                severity=severity,
                confidence=confidence,
                supporting_evidence=evidence,
                persistence_count=count,
                metrics_snapshot={"loss": o.loss, "gradient_norm": o.gradient_norm},
            ))
        else:
            self.consecutive_counts[ft] = 0

    def _evaluate_barren_plateau(
        self, s: TelemetrySummary, o: HealthObservation, anomalies: List[DetectedAnomaly]
    ) -> None:
        ft = FailureType.BARREN_PLATEAU
        evidence: List[str] = []
        is_triggered = False

        # Essential check: Avoid classifying well-converged models as barren plateaus
        is_loss_high = o.loss > self.thresholds.bp_min_loss

        # Scientific Formulation for Barren Plateau Variance Bound (DEF-002)
        # McClean et al. (2018), Cerezo et al. (2021):
        # Under random hardware-efficient parameterized quantum circuits forming approximate unitary
        # 2-designs (depth L >= Omega(n)) measured with local observables (e.g. Z_0), the variance
        # of the gradient vanishes exponentially with the number of qubits: Var_theta[dC/dtheta] ~ O(2^-n).
        #
        # ASSUMPTIONS:
        # 1. Haar-random or approximate unitary 2-design parameter initialization.
        # 2. Scrambling circuit depth L >= Omega(n) sufficient for state randomization.
        # 3. Local Pauli observable (e.g. Z_0). Global observables scale as O(2^-2n) even at depth L=1.
        # 4. Unentangled product state input.
        #
        # LIMITATIONS:
        # Shallow ansatzes (L in O(log n)) with local cost functions exhibit polynomial scaling O(1/poly(n)),
        # not exponential concentration. Conversely, global observables concentrate exponentially regardless
        # of depth. Hence, 2^-n represents a theoretical scaling envelope under deep random circuits,
        # and must be conjoined with loss_high (o.loss > bp_min_loss) to prevent false classification
        # of well-converged models.
        n_qubits = max(1, int(getattr(o, "n_qubits", 2)))
        var_bound = self.thresholds.bp_grad_var_max * (2.0 ** (-n_qubits))

        is_grad_norm_low = o.gradient_norm < self.thresholds.bp_grad_norm_max
        is_grad_var_low = o.gradient_variance < var_bound or o.gradient_variance < 1e-7
        is_param_vel_low = o.parameter_velocity < self.thresholds.bp_param_vel_max

        if is_loss_high and is_grad_norm_low and (is_grad_var_low or is_param_vel_low):
            is_triggered = True
            evidence.append(
                f"Gradient norm ({o.gradient_norm:.2e}) below BP threshold ({self.thresholds.bp_grad_norm_max:.2e}) "
                f"while loss ({o.loss:.3f}) remains high."
            )
            if is_grad_var_low:
                evidence.append(f"Gradient variance ({o.gradient_variance:.2e}) collapsed below theoretical bound ({var_bound:.2e}).")
            if is_param_vel_low:
                evidence.append(f"Parameter displacement velocity ({o.parameter_velocity:.2e}) is virtually halted.")

        if is_triggered:
            self.consecutive_counts[ft] += 1
            count = self.consecutive_counts[ft]
            status = AnomalyStatus.CONFIRMED if count >= self.thresholds.bp_confirm_steps else AnomalyStatus.SUSPECTED
            severity = float(np.clip(1.0 - (o.gradient_norm / (self.thresholds.bp_grad_norm_max + 1e-12)), 0.5, 1.0))
            confidence = 0.90 if status == AnomalyStatus.CONFIRMED else 0.65
            anomalies.append(DetectedAnomaly(
                failure_type=ft,
                status=status,
                step=o.step,
                severity=severity,
                confidence=confidence,
                supporting_evidence=evidence,
                persistence_count=count,
                metrics_snapshot={
                    "gradient_norm": o.gradient_norm,
                    "gradient_variance": o.gradient_variance,
                    "loss": o.loss,
                },
            ))
        else:
            self.consecutive_counts[ft] = 0

    def _evaluate_lr_misconfiguration(
        self, s: TelemetrySummary, o: HealthObservation, anomalies: List[DetectedAnomaly]
    ) -> None:
        ft = FailureType.LR_MISCONFIGURATION
        evidence: List[str] = []
        is_triggered = False
        severity = 0.0

        # Sub-case A: Oscillatory Explosion (LR too large)
        if (s.oscillation_count >= self.thresholds.lr_oscillation_min_count and abs(s.loss_delta_recent) > self.thresholds.lr_oscillation_min_delta and o.learning_rate >= 0.20) or (o.learning_rate >= 0.50 and abs(s.loss_delta_recent) > 0.10):
            is_triggered = True
            severity = float(np.clip(abs(s.loss_delta_recent) / 1.0, 0.4, 1.0))
            evidence.append(
                f"Severe loss instability detected: {s.oscillation_count} sign reversals or large jump of {s.loss_delta_recent:+.3f} "
                f"with learning rate {o.learning_rate:.2f}."
            )

        # Sub-case B: Learning Rate Stagnation (LR too small)
        elif o.gradient_norm > self.thresholds.lr_stagnation_grad_norm_min and o.parameter_velocity < self.thresholds.lr_stagnation_param_vel_max and o.loss > 0.40:
            is_triggered = True
            severity = 0.60
            evidence.append(
                f"Learning rate stagnation: Parameter velocity ({o.parameter_velocity:.2e}) is suppressed "
                f"despite substantial gradient norm ({o.gradient_norm:.3f})."
            )

        # Sub-case C: Single huge loss explosion with large LR
        elif abs(s.loss_delta_recent) > 0.25 and o.learning_rate >= 0.20:
            is_triggered = True
            severity = float(np.clip(abs(s.loss_delta_recent), 0.5, 1.0))
            evidence.append(f"Sudden loss jump ({s.loss_delta_recent:+.3f}) coupled with elevated learning rate ({o.learning_rate:.2f}).")

        if is_triggered:
            self.consecutive_counts[ft] += 1
            count = self.consecutive_counts[ft]
            status = AnomalyStatus.CONFIRMED if count >= self.thresholds.lr_confirm_steps else AnomalyStatus.SUSPECTED
            confidence = 0.88 if status == AnomalyStatus.CONFIRMED else 0.60
            anomalies.append(DetectedAnomaly(
                failure_type=ft,
                status=status,
                step=o.step,
                severity=severity,
                confidence=confidence,
                supporting_evidence=evidence,
                persistence_count=count,
                metrics_snapshot={
                    "learning_rate": o.learning_rate,
                    "loss_delta_recent": s.loss_delta_recent,
                    "oscillation_count": float(s.oscillation_count),
                },
            ))
        else:
            self.consecutive_counts[ft] = 0

    def _evaluate_optimizer_instability(
        self, s: TelemetrySummary, o: HealthObservation, anomalies: List[DetectedAnomaly]
    ) -> None:
        ft = FailureType.OPTIMIZER_INSTABILITY
        evidence: List[str] = []
        is_triggered = False

        if s.loss_cv > self.thresholds.opt_instability_cv_min and o.loss > self.thresholds.opt_min_loss:
            is_triggered = True
            evidence.append(
                f"High loss coefficient of variation ({s.loss_cv:.2f}) indicates erratic non-monotonic optimization trajectory."
            )

        if is_triggered:
            self.consecutive_counts[ft] += 1
            count = self.consecutive_counts[ft]
            status = AnomalyStatus.CONFIRMED if count >= self.thresholds.opt_confirm_steps else AnomalyStatus.SUSPECTED
            severity = float(np.clip(s.loss_cv, 0.4, 0.95))
            confidence = 0.82 if status == AnomalyStatus.CONFIRMED else 0.55
            anomalies.append(DetectedAnomaly(
                failure_type=ft,
                status=status,
                step=o.step,
                severity=severity,
                confidence=confidence,
                supporting_evidence=evidence,
                persistence_count=count,
                metrics_snapshot={"loss_cv": s.loss_cv, "loss_std": s.loss_std},
            ))
        else:
            self.consecutive_counts[ft] = 0

    def _evaluate_persistent_plateau(
        self, s: TelemetrySummary, o: HealthObservation, anomalies: List[DetectedAnomaly]
    ) -> None:
        ft = FailureType.PERSISTENT_PLATEAU
        evidence: List[str] = []
        is_triggered = False

        loss_range = s.loss_max - s.loss_min
        # Stalled loss while loss is still unsatisfactory, but gradients are NOT dead
        if (
            loss_range < self.thresholds.plt_loss_delta_max
            and o.loss > self.thresholds.plt_min_loss
            and o.gradient_norm > self.thresholds.bp_grad_norm_max
        ):
            is_triggered = True
            evidence.append(
                f"Loss stalled across window (range: {loss_range:.4f} < {self.thresholds.plt_loss_delta_max}) "
                f"at suboptimal loss ({o.loss:.3f}) with active non-zero gradients ({o.gradient_norm:.3f})."
            )

        if is_triggered:
            self.consecutive_counts[ft] += 1
            count = self.consecutive_counts[ft]
            status = AnomalyStatus.CONFIRMED if count >= self.thresholds.plt_confirm_steps else AnomalyStatus.SUSPECTED
            severity = float(np.clip((o.loss - 0.40) / 0.60, 0.4, 0.9))
            confidence = 0.85 if status == AnomalyStatus.CONFIRMED else 0.58
            anomalies.append(DetectedAnomaly(
                failure_type=ft,
                status=status,
                step=o.step,
                severity=severity,
                confidence=confidence,
                supporting_evidence=evidence,
                persistence_count=count,
                metrics_snapshot={"loss_range": loss_range, "loss": o.loss},
            ))
        else:
            self.consecutive_counts[ft] = 0

    def _evaluate_noise_degradation(
        self, s: TelemetrySummary, o: HealthObservation, anomalies: List[DetectedAnomaly]
    ) -> None:
        ft = FailureType.NOISE_DEGRADATION
        evidence: List[str] = []
        is_triggered = False

        gap = o.val_loss - o.loss
        is_gap_high = gap > self.thresholds.noise_train_val_gap_min or s.train_val_gap > self.thresholds.noise_train_val_gap_min
        # Distinguish genuine noise from normal early-training learning: normal learning has strongly negative slope!
        is_stunted = (
            o.step >= 4
            and o.val_accuracy < self.thresholds.noise_val_acc_max
            and s.loss_slope > -0.01  # No downward training progress
            and s.loss_std > self.thresholds.noise_loss_std_min
            and o.loss > 0.45
        )

        if is_gap_high:
            is_triggered = True
            evidence.append(
                f"Train-validation loss divergence ({gap:.3f} > {self.thresholds.noise_train_val_gap_min}) "
                f"indicates simulation noise degradation or severe generalization collapse."
            )
        elif is_stunted:
            is_triggered = True
            evidence.append(
                f"Generalization collapse under noisy quantum channel: Validation accuracy ({o.val_accuracy:.1%}) "
                f"remains stunted with high loss variance (std={s.loss_std:.3f})."
            )

        if is_triggered:
            self.consecutive_counts[ft] += 1
            count = self.consecutive_counts[ft]
            status = AnomalyStatus.CONFIRMED if count >= self.thresholds.noise_confirm_steps else AnomalyStatus.SUSPECTED
            severity = float(np.clip(max(gap / 0.50, 0.55), 0.4, 1.0))
            confidence = 0.85 if status == AnomalyStatus.CONFIRMED else 0.60
            anomalies.append(DetectedAnomaly(
                failure_type=ft,
                status=status,
                step=o.step,
                severity=severity,
                confidence=confidence,
                supporting_evidence=evidence,
                persistence_count=count,
                metrics_snapshot={"train_val_gap": gap, "val_loss": o.val_loss, "val_accuracy": o.val_accuracy},
            ))
        else:
            self.consecutive_counts[ft] = 0
