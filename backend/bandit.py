"""
Contextual Thompson Sampling Bandit Engine for Adaptive Quantum Repair Selection.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 5).

Implements genuine Bayesian linear regression Thompson Sampling:
  - 12-dimensional explicit context vector x in [-1, 1]^12.
  - Six locked repair arms A = {a_1, ..., a_6}.
  - Independent Gaussian conjugate posteriors N(mu_a, Sigma_a) for each arm.
  - Online recursive updates via rank-1 Sherman-Morrison inversion.
  - Integration with SafetyFilter and DigitalTwin viability gates.
  - Persistent posterior serialization across restarts.
  - Multi-objective reward computation with zero double-counting.
"""

from dataclasses import dataclass, field
import json
import os
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.monitoring import HealthObservation, TelemetrySummary
from backend.diagnosis import DiagnosisResult
from backend.digital_twin import DigitalTwinPrediction
from backend.repair_library import CandidateRepair, RepairArm
from backend.safety_filter import SafetyDecision, SafetyFilter
from backend.evaluation import compute_multi_objective_reward


# ----------------------------------------------------------------------
# 12-Dimensional Context Feature Vector Construction
# ----------------------------------------------------------------------

def build_context_vector(
    obs: HealthObservation,
    summary: TelemetrySummary,
    diag: Optional[DiagnosisResult] = None,
    memory_prior_reward: float = 0.0,
    memory_top_similarity: float = 0.0,
    twin_prediction: Optional[DigitalTwinPrediction] = None,
    max_depth: int = 8,
) -> np.ndarray:
    """
    Construct the mathematically rigorous 12-dimensional context vector x in [-1, 1]^12:
      x = [x_1, x_2, ..., x_12]^T
    Strictly follows Section 8 Table in ALGORITHM_SPECIFICATION.md.
    Safely imputes missing or NaN/Inf values.
    """
    x = np.zeros(12, dtype=np.float64)

    # x1: Constant Bias Offset
    x[0] = 1.0

    # x2: Normalized Training Loss: tanh(L_t)
    loss_val = obs.loss if (obs.is_valid and not np.isnan(obs.loss) and not np.isinf(obs.loss)) else 10.0
    x[1] = float(np.tanh(loss_val))

    # x3: Log Gradient Norm: clip((ln(||g|| + 1e-8) + 8) / 12, -1, 1)
    g_norm = obs.gradient_norm if not (np.isnan(obs.gradient_norm) or np.isinf(obs.gradient_norm)) else 0.0
    log_gnorm = np.log(max(1e-12, g_norm) + 1e-8)
    x[2] = float(np.clip((log_gnorm + 8.0) / 12.0, -1.0, 1.0))

    # x4: Log Gradient Variance: clip((ln(Var(g) + 1e-10) + 10) / 14, -1, 1)
    g_var = obs.gradient_variance if not (np.isnan(obs.gradient_variance) or np.isinf(obs.gradient_variance)) else 0.0
    log_gvar = np.log(max(1e-12, g_var) + 1e-10)
    x[3] = float(np.clip((log_gvar + 10.0) / 14.0, -1.0, 1.0))

    # x5: Normalized Parameter Velocity: tanh(10 * velocity)
    vel = obs.parameter_velocity if not (np.isnan(obs.parameter_velocity) or np.isinf(obs.parameter_velocity)) else 0.0
    x[4] = float(np.tanh(10.0 * vel))

    # x6: Relative Circuit Depth: L / max_depth in [0, 1]
    depth = max(1, obs.circuit_depth)
    x[5] = float(np.clip(depth / float(max_depth), 0.0, 1.0))

    # x7: Primary Diagnosis Probability in [1/6, 1.0]
    if diag is not None and diag.primary_cause is not None:
        x[6] = float(np.clip(diag.confidence, 0.0, 1.0))
    else:
        x[6] = float(1.0 / 6.0)

    # x8: Normalized Diagnosis Entropy in [0, 1]
    if diag is not None and len(diag.probabilities) == 6:
        probs = np.array(list(diag.probabilities.values()), dtype=np.float64)
        entropy = -np.sum(probs * np.log(probs + 1e-12))
        x[7] = float(np.clip(entropy / np.log(6.0), 0.0, 1.0))
    else:
        x[7] = 1.0  # Max uncertainty

    # x9: Historical Memory Prior Reward in [-1, 1]
    r_hist = memory_prior_reward if not (np.isnan(memory_prior_reward) or np.isinf(memory_prior_reward)) else 0.0
    x[8] = float(np.clip(r_hist, -1.0, 1.0))

    # x10: Historical Top Similarity in [-1, 1]
    s_hist = memory_top_similarity if not (np.isnan(memory_top_similarity) or np.isinf(memory_top_similarity)) else 0.0
    x[9] = float(np.clip(s_hist, -1.0, 1.0))

    # x11: Digital-Twin Predicted Loss Delta in [-1, 1]
    if twin_prediction is not None and twin_prediction.is_viable:
        x[10] = float(twin_prediction.normalized_predicted_delta)
    else:
        x[10] = 0.0  # Neutral prior if unsimulated or non-viable

    # x12: Digital-Twin Proxy Stability in [0, 1]
    if twin_prediction is not None and twin_prediction.is_viable:
        x[11] = float(np.clip(twin_prediction.proxy_stability, 0.0, 1.0))
    else:
        x[11] = 0.5  # Neutral default

    return x


# ----------------------------------------------------------------------
# Multi-Objective Reward Function (DEF-005)
# Centralized in backend.evaluation; re-exported above for backward compatibility.
# ----------------------------------------------------------------------


# ----------------------------------------------------------------------
# Bayesian Linear Regression Posterior for a Single Arm
# ----------------------------------------------------------------------
# Bayesian Linear Regression Posterior for a Single Arm
# ----------------------------------------------------------------------

@dataclass
class ArmPosterior:
    """Independent Bayesian linear regression posterior for an individual repair arm."""
    arm: RepairArm
    d: int = 12
    lambda_reg: float = 1.0
    exploration_v: float = 0.5
    update_count: int = 0
    # Precision matrix B_a = X^T X + lambda I
    B: np.ndarray = field(default_factory=lambda: np.eye(12, dtype=np.float64))
    # Inverse precision matrix B_a^{-1}
    B_inv: np.ndarray = field(default_factory=lambda: np.eye(12, dtype=np.float64))
    # Correlation vector f_a = X^T r
    f: np.ndarray = field(default_factory=lambda: np.zeros(12, dtype=np.float64))
    # Weight mean vector mu_a = B_a^{-1} f_a
    mu: np.ndarray = field(default_factory=lambda: np.zeros(12, dtype=np.float64))

    def sample_weights(self, rng: np.random.RandomState) -> np.ndarray:
        """
        Sample weight vector beta_tilde ~ N(mu, v^2 * B_inv).
        Enforces numerical symmetry and positive semi-definiteness on covariance.
        """
        cov = (self.exploration_v ** 2) * self.B_inv
        # Symmetrize
        cov = 0.5 * (cov + cov.T)
        # Add small regularizing ridge for positive definiteness
        cov += 1e-8 * np.eye(self.d)

        try:
            sample = rng.multivariate_normal(mean=self.mu, cov=cov)
        except Exception:
            # Fallback to diagonal jitter if extreme conditioning occurs
            std = np.sqrt(np.maximum(1e-8, np.diag(cov)))
            sample = self.mu + rng.normal(0.0, 1.0, size=self.d) * std
        return sample

    def predict_expected_reward(self, x: np.ndarray) -> float:
        """Point estimate of expected reward: E[r|x] = x^T mu."""
        return float(np.dot(x, self.mu))

    def sample_reward(self, x: np.ndarray, rng: np.random.RandomState) -> float:
        """Thompson sampled expected reward: r_tilde = x^T beta_tilde."""
        beta_tilde = self.sample_weights(rng)
        return float(np.dot(x, beta_tilde))

    def update(self, x: np.ndarray, reward: float) -> None:
        """
        Online Bayesian posterior update with Sherman-Morrison rank-1 inverse update:
          B <- B + x x^T
          f <- f + r x
          B_inv <- B_inv - (B_inv x x^T B_inv) / (1 + x^T B_inv x)
          mu <- B_inv f
        """
        if x.shape != (self.d,):
            raise ValueError(f"Context vector shape must be ({self.d},), received {x.shape}")

        r = float(np.clip(reward, -1.0, 1.0))
        x_col = x.reshape(-1, 1)

        # Update B and f
        self.B += np.dot(x_col, x_col.T)
        self.f += r * x
        self.update_count += 1

        # Sherman-Morrison rank-1 update of B_inv:
        # B_inv_new = B_inv - (B_inv * x * x^T * B_inv) / (1 + x^T * B_inv * x)
        B_inv_x = np.dot(self.B_inv, x)  # Shape (d,)
        denominator = 1.0 + float(np.dot(x, B_inv_x))
        numerator = np.outer(B_inv_x, B_inv_x)  # Shape (d, d)
        self.B_inv -= numerator / max(1e-12, denominator)

        # DEF-006: Numerical stability enforcement
        # 1. Enforce exact symmetry against floating-point roundoff
        self.B_inv = 0.5 * (self.B_inv + self.B_inv.T)
        self.B = 0.5 * (self.B + self.B.T)

        # 2. Positive definiteness verification: compute minimum eigenvalue
        eigvals = np.linalg.eigvalsh(self.B_inv)
        min_eig = float(np.min(eigvals))
        if min_eig <= 1e-10:
            # Recondition: direct robust inversion of regularized precision matrix
            try:
                self.B_inv = np.linalg.inv(self.B + 1e-6 * np.eye(self.d))
                self.B_inv = 0.5 * (self.B_inv + self.B_inv.T)
            except np.linalg.LinAlgError:
                # Spectral floor clipping fallback
                eigvals_clip, eigvecs = np.linalg.eigh(self.B_inv)
                eigvals_clip = np.maximum(eigvals_clip, 1e-6)
                self.B_inv = eigvecs @ np.diag(eigvals_clip) @ eigvecs.T

        # Update mean vector: mu = B_inv * f
        self.mu = np.dot(self.B_inv, self.f)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize posterior state to JSON-compatible dictionary."""
        return {
            "arm": self.arm.value,
            "d": self.d,
            "lambda_reg": self.lambda_reg,
            "exploration_v": self.exploration_v,
            "update_count": self.update_count,
            "B": self.B.tolist(),
            "B_inv": self.B_inv.tolist(),
            "f": self.f.tolist(),
            "mu": self.mu.tolist(),
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ArmPosterior":
        """Reconstruct posterior state from serialized dictionary."""
        inst = cls(
            arm=RepairArm(data["arm"]),
            d=data.get("d", 12),
            lambda_reg=data.get("lambda_reg", 1.0),
            exploration_v=data.get("exploration_v", 0.5),
            update_count=data.get("update_count", 0),
        )
        inst.B = np.array(data["B"], dtype=np.float64)
        inst.B_inv = np.array(data["B_inv"], dtype=np.float64)
        inst.f = np.array(data["f"], dtype=np.float64)
        inst.mu = np.array(data["mu"], dtype=np.float64)
        return inst


# ----------------------------------------------------------------------
# Contextual Thompson Sampling Engine
# ----------------------------------------------------------------------

@dataclass
class BanditDecision:
    """Action selected by the bandit with diagnostic tracing information."""
    selected_arm: RepairArm
    candidate: CandidateRepair
    sampled_reward: float
    expected_reward: float
    eligible_arms: List[RepairArm]
    all_sampled_rewards: Dict[RepairArm, float]
    all_expected_rewards: Dict[RepairArm, float]
    context_vector: np.ndarray
    decision_mode: str  # 'THOMPSON_SAMPLING', 'GREEDY', 'FALLBACK'
    timestamp: float = field(default_factory=time.time)


class ContextualThompsonSampler:
    """
    Contextual Multi-Armed Bandit using Bayesian Linear Regression Thompson Sampling.
    Maintains six independent arm posteriors over 12-dimensional contexts.
    """

    def __init__(
        self,
        d: int = 12,
        lambda_reg: float = 1.0,
        exploration_v: float = 0.5,
        storage_path: str = "data/bandit_posteriors.json",
        seed: int = 42,
    ):
        self.d = d
        self.lambda_reg = lambda_reg
        self.exploration_v = exploration_v
        self.storage_path = storage_path
        self.rng = np.random.RandomState(seed)

        # Initialize independent posteriors for all 6 locked arms
        self.posteriors: Dict[RepairArm, ArmPosterior] = {
            arm: ArmPosterior(
                arm=arm,
                d=d,
                lambda_reg=lambda_reg,
                exploration_v=exploration_v,
                B=lambda_reg * np.eye(d, dtype=np.float64),
                B_inv=(1.0 / lambda_reg) * np.eye(d, dtype=np.float64),
                f=np.zeros(d, dtype=np.float64),
                mu=np.zeros(d, dtype=np.float64),
            )
            for arm in RepairArm
        }

        # Attempt restoring from persistent disk storage if available
        self._load_posteriors()

    def select_arm(
        self,
        candidates: List[CandidateRepair],
        context: np.ndarray,
        safety_decisions: Optional[List[SafetyDecision]] = None,
        twin_predictions: Optional[Dict[RepairArm, DigitalTwinPrediction]] = None,
        greedy: bool = False,
    ) -> BanditDecision:
        """
        Select the optimal repair arm using Contextual Thompson Sampling:
          1. Filters candidates by SafetyFilter clearance.
          2. Filters candidates by DigitalTwin viability (> 20% degradation rejection).
          3. Samples payoff ~ N(mu_a, v^2 B_inv) for eligible arms.
          4. Returns arm with highest sampled reward.
        """
        if context.shape != (self.d,):
            raise ValueError(f"Context vector shape must be ({self.d},), received {context.shape}")

        # Map candidates by arm
        cand_map = {c.arm: c for c in candidates}

        # Filter safe arms
        if safety_decisions is not None:
            safe_arms = {d.arm for d in safety_decisions if d.is_safe}
        else:
            safe_arms = set(cand_map.keys())

        # Filter viable twin arms
        if twin_predictions is not None:
            viable_arms = {arm for arm, pred in twin_predictions.items() if pred.is_viable}
        else:
            viable_arms = set(cand_map.keys())

        # Intersection: Eligible arms passed by both safety filter and digital twin
        eligible_arms = [arm for arm in cand_map.keys() if arm in safe_arms and arm in viable_arms]

        # Safe fallback: if all arms rejected, fall back to safe arms, then to perform_warm_restart
        decision_mode = "GREEDY" if greedy else "THOMPSON_SAMPLING"
        if not eligible_arms:
            eligible_arms = [arm for arm in cand_map.keys() if arm in safe_arms]
            if not eligible_arms:
                eligible_arms = [RepairArm.PERFORM_WARM_RESTART]
            decision_mode = "FALLBACK"

        # Compute sampled and expected rewards
        sampled_rewards: Dict[RepairArm, float] = {}
        expected_rewards: Dict[RepairArm, float] = {}

        for arm in cand_map.keys():
            post = self.posteriors[arm]
            expected_rewards[arm] = post.predict_expected_reward(context)
            if greedy:
                sampled_rewards[arm] = expected_rewards[arm]
            else:
                sampled_rewards[arm] = post.sample_reward(context, self.rng)

        # Select arm with max sampled reward among eligible
        best_arm = eligible_arms[0]
        best_val = sampled_rewards[best_arm]
        for arm in eligible_arms[1:]:
            val = sampled_rewards[arm]
            if val > best_val:
                best_val = val
                best_arm = arm

        selected_cand = cand_map.get(
            best_arm,
            CandidateRepair(arm=best_arm, rationale="Bandit fallback repair"),
        )

        return BanditDecision(
            selected_arm=best_arm,
            candidate=selected_cand,
            sampled_reward=best_val,
            expected_reward=expected_rewards[best_arm],
            eligible_arms=eligible_arms,
            all_sampled_rewards=sampled_rewards,
            all_expected_rewards=expected_rewards,
            context_vector=context.copy(),
            decision_mode=decision_mode,
        )

    def update_arm(self, arm: RepairArm, context: np.ndarray, actual_reward: float) -> None:
        """
        Execute Bayesian posterior update for the selected arm using actual empirical reward.
        Persists updated posterior state to disk.
        """
        if arm not in self.posteriors:
            raise ValueError(f"Unknown repair arm: {arm}")

        self.posteriors[arm].update(context, actual_reward)
        self._save_posteriors()

    # ------------------------------------------------------------------
    # Persistence
    # ------------------------------------------------------------------

    def _save_posteriors(self) -> None:
        """Save posteriors to JSON file safely."""
        try:
            dir_name = os.path.dirname(os.path.abspath(self.storage_path))
            if dir_name:
                os.makedirs(dir_name, exist_ok=True)
            data = {arm.value: post.to_dict() for arm, post in self.posteriors.items()}
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception:
            pass  # Do not crash if disk I/O fails temporarily

    def _load_posteriors(self) -> bool:
        """Load posteriors from JSON file if present."""
        if not os.path.exists(self.storage_path):
            return False
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            for arm_val, arm_data in data.items():
                arm = RepairArm(arm_val)
                self.posteriors[arm] = ArmPosterior.from_dict(arm_data)
            return True
        except Exception:
            return False

    def reset_posteriors(self) -> None:
        """Reset all posteriors to uninformative isotropic priors."""
        for arm in RepairArm:
            self.posteriors[arm] = ArmPosterior(
                arm=arm,
                d=self.d,
                lambda_reg=self.lambda_reg,
                exploration_v=self.exploration_v,
                B=self.lambda_reg * np.eye(self.d, dtype=np.float64),
                B_inv=(1.0 / self.lambda_reg) * np.eye(self.d, dtype=np.float64),
                f=np.zeros(self.d, dtype=np.float64),
                mu=np.zeros(self.d, dtype=np.float64),
            )
        if os.path.exists(self.storage_path):
            try:
                os.remove(self.storage_path)
            except Exception:
                pass
