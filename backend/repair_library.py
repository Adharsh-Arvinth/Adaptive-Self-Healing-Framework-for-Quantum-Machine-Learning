"""
Modular Repair Library for Variational Quantum Circuit Self-Healing.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 4).

Implements exactly the six approved repair strategies:
  1. change_optimizer: Switch optimizer and reset momentum buffers cleanly.
  2. reduce_circuit_depth: Decrement layer count L -> L-1, truncating parameter tensor safely.
  3. modify_feature_map: Toggle between 'angle' and 'iqp' quantum embeddings.
  4. adjust_learning_rate: Scale learning rate eta by alpha within [eta_min, eta_max].
  5. apply_noise_mitigation: Enable simulation-side zero-noise extrapolation (ZNE) / readout calibration.
  6. perform_warm_restart: Perturb parameters (sigma=0.05) or reset to near-identity, resetting optimizer buffers.
"""

from copy import deepcopy
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.qml_model import CircuitConfig, ModelState, VQCModel, create_optimizer
from backend.diagnosis import DiagnosisResult


class RepairArm(str, Enum):
    CHANGE_OPTIMIZER = "change_optimizer"
    REDUCE_CIRCUIT_DEPTH = "reduce_circuit_depth"
    MODIFY_FEATURE_MAP = "modify_feature_map"
    ADJUST_LEARNING_RATE = "adjust_learning_rate"
    APPLY_NOISE_MITIGATION = "apply_noise_mitigation"
    PERFORM_WARM_RESTART = "perform_warm_restart"


@dataclass
class CandidateRepair:
    """Specification of a candidate repair action to evaluate or execute."""
    arm: RepairArm
    params: Dict[str, Any] = field(default_factory=dict)
    rationale: str = ""


@dataclass
class RepairExecutionResult:
    """Outcome of applying a repair transformation."""
    arm: RepairArm
    success: bool
    original_state: ModelState
    transformed_state: Optional[ModelState] = None
    diff_summary: Dict[str, Any] = field(default_factory=dict)
    error_message: Optional[str] = None


class RepairLibrary:
    """
    Library of atomic, reversible transformations for Variational Quantum Circuit models.
    Provides candidate generation, precondition validation, execution, and rollback.
    """

    def __init__(
        self,
        lr_min: float = 1e-4,
        lr_max: float = 1.0,
        min_depth: int = 1,
        max_depth: int = 8,
        default_sigma: float = 0.05,
    ):
        self.lr_min = lr_min
        self.lr_max = lr_max
        self.min_depth = min_depth
        self.max_depth = max_depth
        self.default_sigma = default_sigma

    # ------------------------------------------------------------------
    # Candidate Generation
    # ------------------------------------------------------------------

    def generate_candidate_repairs(
        self,
        current_state: ModelState,
        diagnosis: Optional[DiagnosisResult] = None,
        all_arms: bool = False,
    ) -> List[CandidateRepair]:
        """
        Generate candidate repairs tailored to the diagnosed failure cause,
        or generate candidates for all six arms (e.g. for Thompson Sampling evaluation).
        """
        candidates: List[CandidateRepair] = []
        primary_cause_raw = diagnosis.primary_cause if diagnosis else None
        primary_cause = primary_cause_raw.value if hasattr(primary_cause_raw, "value") else (str(primary_cause_raw) if primary_cause_raw else None)

        # 1. Arm: Change Optimizer
        curr_opt = current_state.config.optimizer_name.lower()
        alt_opts = [opt for opt in ["adam", "rmsprop", "sgd"] if opt != curr_opt]
        target_opt = alt_opts[0] if alt_opts else "adam"
        opt_repair = CandidateRepair(
            arm=RepairArm.CHANGE_OPTIMIZER,
            params={"target_optimizer": target_opt},
            rationale=f"Switch classical optimizer from {curr_opt} to {target_opt} and reset momentum buffers.",
        )

        # 2. Arm: Reduce Circuit Depth
        depth_repair = CandidateRepair(
            arm=RepairArm.REDUCE_CIRCUIT_DEPTH,
            params={"target_depth": current_state.config.n_layers - 1},
            rationale=f"Reduce circuit depth from {current_state.config.n_layers} to {current_state.config.n_layers - 1} to alleviate barren plateau expressivity saturation.",
        )

        # 3. Arm: Modify Feature Map
        curr_fmap = current_state.config.feature_map.lower()
        target_fmap = "iqp" if curr_fmap == "angle" else "angle"
        fmap_repair = CandidateRepair(
            arm=RepairArm.MODIFY_FEATURE_MAP,
            params={"target_feature_map": target_fmap},
            rationale=f"Toggle feature map from '{curr_fmap}' to '{target_fmap}' to reshape quantum Hilbert kernel.",
        )

        # 4. Arm: Adjust Learning Rate
        # Determine factor based on diagnosis
        if primary_cause in ("lr_misconfiguration", "training_divergence", "optimizer_instability"):
            factor = 0.2  # Decelerate runaway gradients
            rationale = f"Decelerate learning rate by 0.2x (from {current_state.config.learning_rate:.4f}) to stabilize divergence."
        else:
            factor = 2.0  # Accelerate out of stagnation
            rationale = f"Scale learning rate by 2.0x (from {current_state.config.learning_rate:.4f}) to overcome plateau."

        lr_repair = CandidateRepair(
            arm=RepairArm.ADJUST_LEARNING_RATE,
            params={"factor": factor},
            rationale=rationale,
        )

        # 5. Arm: Apply Noise Mitigation
        noise_repair = CandidateRepair(
            arm=RepairArm.APPLY_NOISE_MITIGATION,
            params={"method": "zne_richardson", "enabled": True},
            rationale="Activate simulation-side Zero-Noise Extrapolation (ZNE) and readout calibration.",
        )

        # 6. Arm: Perform Warm Restart
        warm_mode = "identity" if (primary_cause == "training_divergence" or np.any(np.isnan(current_state.params))) else "perturbation"
        warm_repair = CandidateRepair(
            arm=RepairArm.PERFORM_WARM_RESTART,
            params={"mode": warm_mode, "sigma": self.default_sigma},
            rationale=f"Perform warm restart via {warm_mode} mode to dislodge parameters without Haar scrambling.",
        )

        if all_arms:
            return [opt_repair, depth_repair, fmap_repair, lr_repair, noise_repair, warm_repair]

        # Cause-specific targeted candidate selection
        if primary_cause == "barren_plateau":
            candidates.extend([depth_repair, warm_repair, fmap_repair])
        elif primary_cause == "lr_misconfiguration":
            candidates.extend([lr_repair, warm_repair, opt_repair])
        elif primary_cause == "optimizer_instability":
            candidates.extend([opt_repair, lr_repair, warm_repair])
        elif primary_cause == "training_divergence":
            candidates.extend([warm_repair, lr_repair, opt_repair])
        elif primary_cause == "persistent_plateau":
            candidates.extend([warm_repair, fmap_repair, lr_repair])
        elif primary_cause == "noise_degradation":
            candidates.extend([noise_repair, depth_repair, warm_repair])
        else:
            # Fallback when diagnosis is uninformative or abstained
            candidates = [lr_repair, opt_repair, warm_repair, depth_repair, fmap_repair, noise_repair]

        return candidates

    # ------------------------------------------------------------------
    # Repair Execution
    # ------------------------------------------------------------------

    def apply_repair(self, state: ModelState, candidate: CandidateRepair) -> RepairExecutionResult:
        """
        Pure, reversible configuration and parameter transformation on a ModelState snapshot.
        Original state is preserved untouched. Returns RepairExecutionResult.
        """
        # Deep-copy original state to ensure immutability
        orig_state = deepcopy(state)
        new_state = deepcopy(state)

        arm = candidate.arm
        params = candidate.params

        if arm == RepairArm.CHANGE_OPTIMIZER:
            return self._apply_change_optimizer(orig_state, new_state, params)

        elif arm == RepairArm.REDUCE_CIRCUIT_DEPTH:
            return self._apply_reduce_circuit_depth(orig_state, new_state, params)

        elif arm == RepairArm.MODIFY_FEATURE_MAP:
            return self._apply_modify_feature_map(orig_state, new_state, params)

        elif arm == RepairArm.ADJUST_LEARNING_RATE:
            return self._apply_adjust_learning_rate(orig_state, new_state, params)

        elif arm == RepairArm.APPLY_NOISE_MITIGATION:
            return self._apply_noise_mitigation(orig_state, new_state, params)

        elif arm == RepairArm.PERFORM_WARM_RESTART:
            return self._apply_warm_restart(orig_state, new_state, params)

        else:
            return RepairExecutionResult(
                arm=arm,
                success=False,
                original_state=orig_state,
                error_message=f"Unknown repair arm: {arm}",
            )

    # ------------------------------------------------------------------
    # Individual Repair Implementations
    # ------------------------------------------------------------------

    def _apply_change_optimizer(
        self, orig: ModelState, state: ModelState, params: Dict[str, Any]
    ) -> RepairExecutionResult:
        """
        Arm 1: Change classical optimizer.
        Preconditions: Target optimizer is valid and differs from current.
        Transformation: Switches optimizer and resets momentum buffers.
        """
        curr_opt = state.config.optimizer_name.lower()
        target_opt = params.get("target_optimizer")
        if not target_opt:
            alt_opts = [opt for opt in ["adam", "rmsprop", "sgd"] if opt != curr_opt]
            target_opt = alt_opts[0] if alt_opts else "adam"
        else:
            target_opt = target_opt.lower()

        if target_opt not in ["adam", "rmsprop", "sgd"]:
            return RepairExecutionResult(
                arm=RepairArm.CHANGE_OPTIMIZER,
                success=False,
                original_state=orig,
                error_message=f"Invalid target optimizer: {target_opt}",
            )

        if target_opt == curr_opt:
            return RepairExecutionResult(
                arm=RepairArm.CHANGE_OPTIMIZER,
                success=False,
                original_state=orig,
                error_message=f"Target optimizer '{target_opt}' is identical to current optimizer.",
            )

        # Apply transformation
        state.config.optimizer_name = target_opt
        # Cleanly reset optimizer momentum buffers to avoid dimension or scaling incompatibility
        fresh_optimizer = create_optimizer(target_opt, state.config.learning_rate)
        state.optimizer_state = fresh_optimizer.get_state()

        return RepairExecutionResult(
            arm=RepairArm.CHANGE_OPTIMIZER,
            success=True,
            original_state=orig,
            transformed_state=state,
            diff_summary={
                "prev_optimizer": curr_opt,
                "new_optimizer": target_opt,
                "momentum_reset": True,
            },
        )

    def _apply_reduce_circuit_depth(
        self, orig: ModelState, state: ModelState, params: Dict[str, Any]
    ) -> RepairExecutionResult:
        """
        Arm 2: Reduce circuit depth.
        Preconditions: Current depth > min_depth (L >= 2).
        Transformation: Decrements n_layers by 1, truncating parameter tensor slice.
        """
        curr_depth = state.config.n_layers
        if curr_depth <= self.min_depth:
            return RepairExecutionResult(
                arm=RepairArm.REDUCE_CIRCUIT_DEPTH,
                success=False,
                original_state=orig,
                error_message=f"Circuit depth is already at minimum allowable value ({curr_depth} <= {self.min_depth}).",
            )

        target_depth = params.get("target_depth", curr_depth - 1)
        if target_depth < self.min_depth or target_depth >= curr_depth:
            target_depth = curr_depth - 1

        # Truncate parameters
        state.config.n_layers = target_depth
        state.params = state.params[:target_depth].copy()

        # Resynchronize optimizer state with the new parameter shape
        fresh_optimizer = create_optimizer(state.config.optimizer_name, state.config.learning_rate)
        state.optimizer_state = fresh_optimizer.get_state()

        return RepairExecutionResult(
            arm=RepairArm.REDUCE_CIRCUIT_DEPTH,
            success=True,
            original_state=orig,
            transformed_state=state,
            diff_summary={
                "prev_depth": curr_depth,
                "new_depth": target_depth,
                "new_param_shape": list(state.params.shape),
            },
        )

    def _apply_modify_feature_map(
        self, orig: ModelState, state: ModelState, params: Dict[str, Any]
    ) -> RepairExecutionResult:
        """
        Arm 3: Modify feature map encoding.
        Preconditions: Target feature map is valid ('angle' or 'iqp') and differs from current.
        Transformation: Switches feature map while preserving variational parameters.
        """
        curr_fmap = state.config.feature_map.lower()
        target_fmap = params.get("target_feature_map")
        if not target_fmap:
            target_fmap = "iqp" if curr_fmap == "angle" else "angle"
        else:
            target_fmap = target_fmap.lower()

        if target_fmap not in ["angle", "iqp"]:
            return RepairExecutionResult(
                arm=RepairArm.MODIFY_FEATURE_MAP,
                success=False,
                original_state=orig,
                error_message=f"Invalid feature map: {target_fmap}",
            )

        if target_fmap == curr_fmap:
            return RepairExecutionResult(
                arm=RepairArm.MODIFY_FEATURE_MAP,
                success=False,
                original_state=orig,
                error_message=f"Target feature map '{target_fmap}' is identical to current feature map.",
            )

        state.config.feature_map = target_fmap

        return RepairExecutionResult(
            arm=RepairArm.MODIFY_FEATURE_MAP,
            success=True,
            original_state=orig,
            transformed_state=state,
            diff_summary={
                "prev_feature_map": curr_fmap,
                "new_feature_map": target_fmap,
            },
        )

    def _apply_adjust_learning_rate(
        self, orig: ModelState, state: ModelState, params: Dict[str, Any]
    ) -> RepairExecutionResult:
        """
        Arm 4: Adjust learning rate.
        Preconditions: Proposed learning rate within bounds [lr_min, lr_max].
        Transformation: Scales learning rate and updates optimizer state.
        """
        curr_lr = state.config.learning_rate
        if "new_lr" in params:
            new_lr = float(params["new_lr"])
        else:
            factor = float(params.get("factor", 0.5))
            new_lr = curr_lr * factor

        # Bound check
        clipped_lr = float(np.clip(new_lr, self.lr_min, self.lr_max))
        if clipped_lr == curr_lr:
            return RepairExecutionResult(
                arm=RepairArm.ADJUST_LEARNING_RATE,
                success=False,
                original_state=orig,
                error_message=f"Learning rate {curr_lr} is already at boundary [{self.lr_min}, {self.lr_max}].",
            )

        state.config.learning_rate = clipped_lr
        state.optimizer_state["lr"] = clipped_lr

        return RepairExecutionResult(
            arm=RepairArm.ADJUST_LEARNING_RATE,
            success=True,
            original_state=orig,
            transformed_state=state,
            diff_summary={
                "prev_lr": curr_lr,
                "new_lr": clipped_lr,
                "scale_factor": clipped_lr / curr_lr,
            },
        )

    def _apply_noise_mitigation(
        self, orig: ModelState, state: ModelState, params: Dict[str, Any]
    ) -> RepairExecutionResult:
        """
        Arm 5: Apply simulation-side noise mitigation.
        Preconditions: Simulation-side procedure; not already active.
        Transformation: Sets noise_mitigation flag to True.
        Note: Strictly simulation-side Zero-Noise Extrapolation / readout calibration.
        """
        if getattr(state.config, "noise_mitigation", False):
            return RepairExecutionResult(
                arm=RepairArm.APPLY_NOISE_MITIGATION,
                success=False,
                original_state=orig,
                error_message="Simulation-side noise mitigation is already active.",
            )

        state.config.noise_mitigation = True

        return RepairExecutionResult(
            arm=RepairArm.APPLY_NOISE_MITIGATION,
            success=True,
            original_state=orig,
            transformed_state=state,
            diff_summary={
                "noise_mitigation_enabled": True,
                "method": params.get("method", "zne_richardson"),
                "scope": "simulation_side_zne_and_readout_inversion",
            },
        )

    def _apply_warm_restart(
        self, orig: ModelState, state: ModelState, params: Dict[str, Any]
    ) -> RepairExecutionResult:
        """
        Arm 6: Perform warm restart.
        Preconditions: Mode in ('perturbation', 'identity').
        Transformation: Perturbs parameters with Gaussian noise (sigma=0.05) or
        resets to near-identity, and resets optimizer momentum buffers.
        """
        mode = params.get("mode", "perturbation")
        sigma = float(params.get("sigma", self.default_sigma))

        # Check for NaN or Inf in current parameters
        has_nan = bool(np.any(np.isnan(state.params)) or np.any(np.isinf(state.params)))
        if has_nan or mode == "identity":
            # Mode A: Identity / near-zero block initialization
            # Eliminates NaN and avoids random Haar scrambling
            rng = np.random.RandomState(42)
            state.params = rng.normal(0.0, 0.01, size=state.params.shape)
            actual_mode = "identity_initialization"
        else:
            # Mode B: Controlled Gaussian perturbation around current parameters
            rng = np.random.RandomState(int(state.epoch * 17 + 101))
            perturbation = rng.normal(0.0, sigma, size=state.params.shape)
            state.params = state.params + perturbation
            actual_mode = "gaussian_perturbation"

        # Cleanly reset optimizer step count and momentum buffers
        fresh_optimizer = create_optimizer(state.config.optimizer_name, state.config.learning_rate)
        state.optimizer_state = fresh_optimizer.get_state()

        return RepairExecutionResult(
            arm=RepairArm.PERFORM_WARM_RESTART,
            success=True,
            original_state=orig,
            transformed_state=state,
            diff_summary={
                "mode": actual_mode,
                "sigma": sigma,
                "momentum_reset": True,
                "nan_recovered": has_nan,
            },
        )

    # ------------------------------------------------------------------
    # Model Instance Interface
    # ------------------------------------------------------------------

    def apply_to_model(self, model: VQCModel, candidate: CandidateRepair) -> RepairExecutionResult:
        """
        Apply candidate repair directly to a live VQCModel instance.
        Preserves model state snapshot in result for atomic rollback.
        """
        current_state = model.get_state()
        result = self.apply_repair(current_state, candidate)
        if result.success and result.transformed_state is not None:
            model.set_state(result.transformed_state)
        return result

    def rollback_model(self, model: VQCModel, result: RepairExecutionResult) -> None:
        """Revert a model instance back to its original state prior to repair."""
        model.set_state(result.original_state)
