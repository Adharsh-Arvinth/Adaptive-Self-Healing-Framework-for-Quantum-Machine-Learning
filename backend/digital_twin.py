"""
Digital-Twin Proxy Pre-Deployment Simulation Engine.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 5).

Provides isolated, short-horizon proxy evaluation of candidate repairs:
  - Horizon locked to H = 3 training steps.
  - Complete state isolation: primary model state is never mutated.
  - Prevents validation data leakage: proxy optimization uses dedicated validation mini-batches.
  - Computes predicted loss delta, stability score, simulation uncertainty, and circuit overhead.
  - Rejects harmful candidates (> 20% degradation or NaN/Inf) before primary deployment.
  - Tracks prediction error (MAE / RMSE) against actual post-deployment outcomes.
"""

from copy import deepcopy
from dataclasses import dataclass, field
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.qml_model import CircuitConfig, ModelState, VQCModel
from backend.repair_library import CandidateRepair, RepairArm, RepairExecutionResult, RepairLibrary


@dataclass
class DigitalTwinPrediction:
    """Pre-deployment simulation outcome and stability metrics for a candidate repair."""
    arm: RepairArm
    candidate: CandidateRepair
    horizon: int  # Fixed H = 3
    initial_loss: float
    predicted_loss_final: float
    predicted_loss_delta: float  # initial_loss - predicted_loss_final (> 0 means improved)
    normalized_predicted_delta: float  # tanh(predicted_loss_delta / (initial_loss + 1e-8)) in [-1, 1]
    proxy_loss_trajectory: List[float]
    proxy_stability: float  # S_proxy in [0, 1]
    proxy_grad_variance: float  # Simulation uncertainty sigma_twin^2
    circuit_evaluations: int  # Quantum circuit evaluations incurred during H steps
    is_viable: bool  # False if proxy loss worsens by >= 20% or produces NaN/Inf
    rejection_reason: Optional[str] = None
    execution_time_ms: float = 0.0


@dataclass
class PredictionFidelityRecord:
    """Historical record comparing digital twin prediction with actual deployment outcome."""
    arm: RepairArm
    predicted_loss_delta: float
    actual_loss_delta: float
    prediction_error: float  # abs(predicted - actual)
    squared_error: float
    timestamp: float = field(default_factory=time.time)


class DigitalTwinSimulator:
    """
    Isolated short-horizon proxy simulator for candidate quantum repair validation.
    Executes exactly H = 3 training iterations on an isolated clone of the VQC model.
    """

    def __init__(
        self,
        horizon: int = 3,
        max_loss_degradation: float = 0.20,
        batch_size: int = 20,
    ):
        if horizon != 3:
            # Enforce architectural lock unless explicitly justified
            raise ValueError(f"Digital twin horizon is locked to H = 3 by specification. Received: {horizon}")

        self.horizon = horizon
        self.max_loss_degradation = max_loss_degradation
        self.batch_size = batch_size
        self.repair_lib = RepairLibrary()
        self.fidelity_history: List[PredictionFidelityRecord] = []

    def simulate_candidate(
        self,
        current_model: VQCModel,
        candidate: CandidateRepair,
        X_val: np.ndarray,
        y_val: np.ndarray,
        seed: int = 42,
    ) -> DigitalTwinPrediction:
        """
        Execute an isolated H = 3 proxy simulation of a candidate repair.
        The primary model state is guaranteed to be untouched (100% state isolation).
        """
        start_time = time.perf_counter()
        arm = candidate.arm

        # ------------------------------------------------------------------
        # 1. State Isolation: Deep clone current model state
        # ------------------------------------------------------------------
        primary_state_snapshot = current_model.get_state()
        primary_params_copy = primary_state_snapshot.params.copy()
        primary_opt_name = primary_state_snapshot.config.optimizer_name
        primary_lr = primary_state_snapshot.config.learning_rate

        # Construct an isolated twin proxy model
        twin_config = deepcopy(primary_state_snapshot.config)
        twin_model = VQCModel(twin_config)
        twin_model.set_state(deepcopy(primary_state_snapshot))

        # ------------------------------------------------------------------
        # 2. Apply Candidate Repair to Isolated Twin
        # ------------------------------------------------------------------
        repair_result = self.repair_lib.apply_to_model(twin_model, candidate)
        if not repair_result.success:
            elapsed_ms = (time.perf_counter() - start_time) * 1000.0
            return DigitalTwinPrediction(
                arm=arm,
                candidate=candidate,
                horizon=self.horizon,
                initial_loss=10.0,
                predicted_loss_final=10.0,
                predicted_loss_delta=0.0,
                normalized_predicted_delta=0.0,
                proxy_loss_trajectory=[],
                proxy_stability=0.0,
                proxy_grad_variance=0.0,
                circuit_evaluations=0,
                is_viable=False,
                rejection_reason=f"PRECONDITION_FAILED: {repair_result.error_message}",
                execution_time_ms=elapsed_ms,
            )

        # ------------------------------------------------------------------
        # 3. Dedicated Validation Mini-Batch (Prevents Data Leakage)
        # ------------------------------------------------------------------
        rng = np.random.RandomState(seed + int(primary_state_snapshot.epoch * 31))
        total_val = len(X_val)
        batch_n = min(self.batch_size, total_val)
        batch_indices = rng.choice(total_val, size=batch_n, replace=False)
        X_proxy_batch = X_val[batch_indices]
        y_proxy_batch = y_val[batch_indices]

        # Baseline loss before proxy steps
        initial_loss, _ = twin_model.compute_loss_and_accuracy(X_proxy_batch, y_proxy_batch)
        if np.isnan(initial_loss) or np.isinf(initial_loss):
            initial_loss = 10.0

        # ------------------------------------------------------------------
        # 4. Execute Exactly H = 3 Proxy Optimization Steps
        # ------------------------------------------------------------------
        proxy_trajectory: List[float] = [float(initial_loss)]
        grad_variances: List[float] = []
        circuit_evals = 0

        # Parameter-shift gradient cost formula: batch_size * (2 * num_trainable_params + 1)
        num_params = twin_model.params.size

        for step in range(self.horizon):
            metrics = twin_model.train_step(X_proxy_batch, y_proxy_batch, X_proxy_batch, y_proxy_batch)
            loss_step = float(metrics.loss)
            proxy_trajectory.append(loss_step)
            grad_variances.append(float(metrics.gradient_variance))
            # 2 evaluations per parameter for symmetric shift + 1 for expectation value
            circuit_evals += batch_n * (2 * num_params + 1)

            # Check for catastrophic numerical divergence
            if np.isnan(loss_step) or np.isinf(loss_step):
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                # Verify primary model state isolation before returning
                self._verify_isolation(current_model, primary_params_copy, primary_opt_name, primary_lr)
                return DigitalTwinPrediction(
                    arm=arm,
                    candidate=candidate,
                    horizon=self.horizon,
                    initial_loss=float(initial_loss),
                    predicted_loss_final=float("inf"),
                    predicted_loss_delta=-10.0,
                    normalized_predicted_delta=-1.0,
                    proxy_loss_trajectory=proxy_trajectory,
                    proxy_stability=0.0,
                    proxy_grad_variance=float("inf"),
                    circuit_evaluations=circuit_evals,
                    is_viable=False,
                    rejection_reason="DIVERGENCE: Numerical NaN or Inf produced during proxy simulation.",
                    execution_time_ms=elapsed_ms,
                )

        # ------------------------------------------------------------------
        # 5. Compute Prediction & Stability Metrics
        # ------------------------------------------------------------------
        final_proxy_loss = proxy_trajectory[-1]
        loss_delta = float(initial_loss - final_proxy_loss)
        normalized_delta = float(np.tanh(loss_delta / (initial_loss + 1e-8)))

        # Proxy stability score: 1 - CV(L_proxy) in [0, 1]
        traj_array = np.array(proxy_trajectory[1:], dtype=np.float64)
        mean_proxy = float(np.mean(traj_array))
        std_proxy = float(np.std(traj_array))
        stability_score = float(np.clip(1.0 - (std_proxy / (mean_proxy + 1e-8)), 0.0, 1.0))

        mean_grad_variance = float(np.mean(grad_variances)) if grad_variances else 0.0

        # Assess viability: reject if loss worsens by >= max_loss_degradation (20%)
        is_viable = True
        rejection_reason = None
        if loss_delta < -self.max_loss_degradation * initial_loss:
            is_viable = False
            rejection_reason = (
                f"DEGRADATION: Proxy loss worsened by {abs(loss_delta / initial_loss)*100:.1f}% "
                f"over {self.horizon} steps (threshold: {self.max_loss_degradation*100:.0f}%)."
            )

        elapsed_ms = (time.perf_counter() - start_time) * 1000.0

        # ------------------------------------------------------------------
        # 6. Verify Primary Model State Isolation Guarantee
        # ------------------------------------------------------------------
        self._verify_isolation(current_model, primary_params_copy, primary_opt_name, primary_lr)

        return DigitalTwinPrediction(
            arm=arm,
            candidate=candidate,
            horizon=self.horizon,
            initial_loss=float(initial_loss),
            predicted_loss_final=float(final_proxy_loss),
            predicted_loss_delta=loss_delta,
            normalized_predicted_delta=normalized_delta,
            proxy_loss_trajectory=proxy_trajectory,
            proxy_stability=stability_score,
            proxy_grad_variance=mean_grad_variance,
            circuit_evaluations=circuit_evals,
            is_viable=is_viable,
            rejection_reason=rejection_reason,
            execution_time_ms=elapsed_ms,
        )

    def simulate_all(
        self,
        current_model: VQCModel,
        candidates: List[CandidateRepair],
        X_val: np.ndarray,
        y_val: np.ndarray,
        seed: int = 42,
    ) -> Dict[RepairArm, DigitalTwinPrediction]:
        """
        Simulate all candidate repairs independently.
        Returns a dictionary mapping each candidate arm to its DigitalTwinPrediction.
        """
        predictions: Dict[RepairArm, DigitalTwinPrediction] = {}
        for cand in candidates:
            pred = self.simulate_candidate(current_model, cand, X_val, y_val, seed=seed)
            predictions[cand.arm] = pred
        return predictions

    def record_actual_outcome(
        self,
        prediction: DigitalTwinPrediction,
        actual_loss_delta: float,
    ) -> PredictionFidelityRecord:
        """
        Record empirical comparison between proxy prediction and actual deployment outcome.
        Computes prediction error and updates fidelity metrics.
        """
        err = abs(prediction.predicted_loss_delta - actual_loss_delta)
        record = PredictionFidelityRecord(
            arm=prediction.arm,
            predicted_loss_delta=prediction.predicted_loss_delta,
            actual_loss_delta=actual_loss_delta,
            prediction_error=err,
            squared_error=err ** 2,
        )
        self.fidelity_history.append(record)
        return record

    def get_fidelity_metrics(self) -> Dict[str, float]:
        """Compute aggregate simulation fidelity metrics (MAE, RMSE, count)."""
        if not self.fidelity_history:
            return {"count": 0.0, "mae": 0.0, "rmse": 0.0}

        errors = [r.prediction_error for r in self.fidelity_history]
        sq_errors = [r.squared_error for r in self.fidelity_history]
        mae = float(np.mean(errors))
        rmse = float(np.sqrt(np.mean(sq_errors)))
        return {
            "count": float(len(self.fidelity_history)),
            "mae": mae,
            "rmse": rmse,
        }

    # ------------------------------------------------------------------
    # Internal Verification Helpers
    # ------------------------------------------------------------------

    def _verify_isolation(
        self,
        model: VQCModel,
        expected_params: np.ndarray,
        expected_opt_name: str,
        expected_lr: float,
    ) -> None:
        """Assert that primary model state was never mutated during proxy simulation."""
        assert np.array_equal(model.params, expected_params, equal_nan=True), (
            "CRITICAL ISOLATION VIOLATION: Primary model parameters were modified during digital-twin proxy simulation!"
        )
        assert model.config.optimizer_name == expected_opt_name, (
            "CRITICAL ISOLATION VIOLATION: Primary optimizer was modified during digital-twin proxy simulation!"
        )
        assert model.optimizer.lr == expected_lr, (
            "CRITICAL ISOLATION VIOLATION: Primary learning rate was modified during digital-twin proxy simulation!"
        )
