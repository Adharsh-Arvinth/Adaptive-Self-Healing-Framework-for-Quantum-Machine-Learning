"""
Probabilistic Root-Cause Diagnosis Engine with Confidence Gating.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 3).
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple
import numpy as np

from backend.qml_model import FailureType
from backend.monitoring import HealthObservation, TelemetrySummary
from backend.detection import DetectedAnomaly, AnomalyStatus


@dataclass
class DiagnosisResult:
    """Structured diagnostic outcome for a training step."""
    step: int
    primary_cause: Optional[FailureType]
    confidence: float  # Posterior probability of the primary cause in [0.0, 1.0]
    probabilities: Dict[str, float]  # Full probability distribution over all 6 failure categories
    confidence_gate_cleared: bool
    recommended_action: str  # 'PROCEED_TO_REPAIR' or 'ABSTAIN_OBSERVE'
    supporting_evidence: List[str]
    alternative_causes: List[Tuple[str, float]]  # Other plausible causes (prob >= 0.15)
    anomalies_detected: int


class DiagnosisEngine:
    """
    Probabilistic Root-Cause Diagnosis Engine with Confidence Gating.
    Aggregates multi-source telemetry evidence, computes an evidence scoring vector,
    applies temperature-scaled softmax to produce a well-calibrated belief distribution,
    and enforces a strict confidence gate (tau_conf = 0.60) to avoid ungrounded repairs.
    """

    def __init__(self, confidence_threshold: float = 0.60, temperature: float = 0.50):
        self.confidence_threshold = confidence_threshold
        self.temperature = temperature
        self.categories: List[FailureType] = list(FailureType)

    def diagnose(
        self,
        anomalies: List[DetectedAnomaly],
        summary: TelemetrySummary,
        latest_obs: HealthObservation,
    ) -> DiagnosisResult:
        """
        Synthesize detected anomalies and rolling telemetry into a calibrated probabilistic diagnosis.
        """
        step = latest_obs.step
        evidence_scores: Dict[FailureType, float] = {ft: 0.0 for ft in self.categories}
        diagnostic_evidence: List[str] = []

        # If no anomalies were detected at all, do not diagnose a failure
        if len(anomalies) == 0:
            return DiagnosisResult(
                step=step,
                primary_cause=None,
                confidence=1.0 / len(self.categories),
                probabilities={ft.value: 1.0 / len(self.categories) for ft in self.categories},
                confidence_gate_cleared=False,
                recommended_action="ABSTAIN_OBSERVE",
                supporting_evidence=["Nominal training condition: No anomalies detected."],
                alternative_causes=[],
                anomalies_detected=0,
            )

        # 1. Accumulate Evidence from Anomaly Detectors
        for a in anomalies:
            weight = 3.5 if a.status == AnomalyStatus.CONFIRMED else 1.8
            contrib = weight * a.confidence * a.severity
            evidence_scores[a.failure_type] += contrib
            diagnostic_evidence.extend(a.supporting_evidence)

        # 2. Direct Telemetry Reinforcements & Cross-Inhibitions (only when window has >= 2 steps)
        if summary.steps_observed >= 2:
            # A. Training Divergence / NaN dominance
            if not latest_obs.is_valid or summary.has_nan_or_inf or latest_obs.loss > 5.0:
                evidence_scores[FailureType.TRAINING_DIVERGENCE] += 8.0
                diagnostic_evidence.append("Immediate numerical divergence flag active.")

            # B. Barren Plateau: requires low variance AND high loss
            if latest_obs.gradient_norm < 1e-4 and latest_obs.loss > 0.45:
                if latest_obs.gradient_variance < 1e-6:
                    evidence_scores[FailureType.BARREN_PLATEAU] += 2.5
            # Mutual Inhibition: if gradients are healthy, strongly suppress Barren Plateau
            if latest_obs.gradient_norm > 0.08:
                evidence_scores[FailureType.BARREN_PLATEAU] -= 3.5

            # C. Learning Rate: oscillation frequency
            if summary.oscillation_count >= 1 and abs(summary.loss_delta_recent) > 0.10:
                evidence_scores[FailureType.LR_MISCONFIGURATION] += 2.0

            # D. Optimizer Instability: loss CV
            if summary.loss_cv > 0.30 and latest_obs.loss > 0.40:
                evidence_scores[FailureType.OPTIMIZER_INSTABILITY] += 1.8

            # E. Noise Degradation: train-val divergence or accuracy collapse under noise
            if (latest_obs.val_loss - latest_obs.loss) > 0.08 or (latest_obs.step >= 4 and latest_obs.val_accuracy < 0.72 and summary.loss_std > 0.03):
                evidence_scores[FailureType.NOISE_DEGRADATION] += 2.5

            # F. Persistent Plateau: flat loss with active non-vanishing gradients
            if (summary.loss_max - summary.loss_min) < 0.008 and latest_obs.loss > 0.40 and latest_obs.gradient_norm > 0.02:
                evidence_scores[FailureType.PERSISTENT_PLATEAU] += 2.5

        # 3. Softmax Belief Distribution with Temperature Calibration
        scores_arr = np.array([evidence_scores[ft] for ft in self.categories], dtype=float)

        # Numerical stability: shift by max
        shifted_scores = scores_arr - np.max(scores_arr)
        exp_scores = np.exp(shifted_scores / self.temperature)
        probs_arr = exp_scores / np.sum(exp_scores)

        probabilities: Dict[str, float] = {
            ft.value: float(probs_arr[i]) for i, ft in enumerate(self.categories)
        }

        # 4. Primary Cause and Confidence Gate Evaluation
        max_idx = int(np.argmax(probs_arr))
        primary_cause = self.categories[max_idx]
        confidence = float(probs_arr[max_idx])

        # If no anomalies were detected at all and scores are baseline, do not assign a false cause
        if len(anomalies) == 0 and np.all(scores_arr <= 0.5):
            primary_cause = None
            confidence = float(np.max(probs_arr))
            confidence_gate_cleared = False
            recommended_action = "ABSTAIN_OBSERVE"
            diagnostic_evidence.append("Nominal training condition: No anomalies detected.")
        else:
            confidence_gate_cleared = confidence >= self.confidence_threshold
            recommended_action = "PROCEED_TO_REPAIR" if confidence_gate_cleared else "ABSTAIN_OBSERVE"
            if not confidence_gate_cleared:
                diagnostic_evidence.append(
                    f"Confidence ({confidence:.2%}) is below threshold ({self.confidence_threshold:.0%}); "
                    "abstaining from active repair to prevent premature parameter disruption."
                )

        # 5. Alternative Plausible Causes (prob >= 0.15 excluding primary)
        alternative_causes = [
            (ft.value, float(probabilities[ft.value]))
            for ft in self.categories
            if ft != primary_cause and probabilities[ft.value] >= 0.15
        ]
        alternative_causes.sort(key=lambda x: x[1], reverse=True)

        return DiagnosisResult(
            step=step,
            primary_cause=primary_cause,
            confidence=confidence,
            probabilities=probabilities,
            confidence_gate_cleared=confidence_gate_cleared,
            recommended_action=recommended_action,
            supporting_evidence=diagnostic_evidence,
            alternative_causes=alternative_causes,
            anomalies_detected=len(anomalies),
        )
