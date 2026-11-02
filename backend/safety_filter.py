"""
Safety Filter and Anti-Oscillation Layer.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 4).

Enforces operational constraints and anti-oscillation guards before any repair action is accepted:
  1. Anti-oscillation rules across sliding window K_osc.
  2. Learning rate bounds [eta_min, eta_max].
  3. Circuit depth constraints [L_min, L_max].
  4. Feature-map and optimizer compatibility checks.
  5. Repeated-failure penalties (rejection after consecutive repair failures).
  6. Reversible non-destructive evaluation preserving original configuration.
"""

from dataclasses import dataclass, field
import time
from typing import Any, Dict, List, Optional
import numpy as np

from backend.qml_model import ModelState
from backend.repair_library import CandidateRepair, RepairArm


@dataclass
class RepairHistoryRecord:
    """Historical record of an applied repair action and its empirical outcome."""
    step: int
    arm: RepairArm
    params: Dict[str, Any]
    status: str  # 'SUCCESS', 'FAILED', 'ROLLED_BACK'
    reward: float = 0.0
    timestamp: float = field(default_factory=time.time)


@dataclass
class SafetyDecision:
    """Evaluation decision for a candidate repair action."""
    arm: RepairArm
    is_safe: bool
    rejection_reason: Optional[str] = None
    candidate: CandidateRepair = field(default_factory=lambda: CandidateRepair(arm=RepairArm.PERFORM_WARM_RESTART))


@dataclass
class SafetyFilterConfig:
    """Operational bounds and safety thresholds."""
    lr_min: float = 1e-4
    lr_max: float = 1.0
    min_depth: int = 1
    max_depth: int = 8
    oscillation_window: int = 4
    max_consecutive_failures: int = 2


class SafetyFilter:
    """
    Validates candidate repairs against operational constraints, anti-oscillation rules,
    and historical failure memory before execution or digital-twin simulation.
    Preserves model state immutability.
    """

    def __init__(self, config: Optional[SafetyFilterConfig] = None):
        self.config = config or SafetyFilterConfig()

    def evaluate_candidate(
        self,
        candidate: CandidateRepair,
        current_state: ModelState,
        history: Optional[List[RepairHistoryRecord]] = None,
    ) -> SafetyDecision:
        """
        Evaluate a single candidate repair.
        Returns a SafetyDecision indicating whether the candidate is approved or rejected,
        along with an explicit, identifiable reason if rejected.
        """
        history = history or []
        arm = candidate.arm
        params = candidate.params

        # ------------------------------------------------------------------
        # 1. Repeated Failure Check (across all arms)
        # ------------------------------------------------------------------
        arm_history = [rec for rec in history if rec.arm == arm]
        if len(arm_history) >= self.config.max_consecutive_failures:
            recent_attempts = arm_history[-self.config.max_consecutive_failures :]
            all_failed = all(rec.status in ("FAILED", "ROLLED_BACK") or rec.reward < 0.0 for rec in recent_attempts)
            if all_failed:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"REPEATED_FAILURE: Arm '{arm.value}' failed in its last "
                        f"{self.config.max_consecutive_failures} consecutive attempts on this model."
                    ),
                    candidate=candidate,
                )

        # ------------------------------------------------------------------
        # 2. Arm-Specific Operational Bounds & Checks
        # ------------------------------------------------------------------
        if arm == RepairArm.CHANGE_OPTIMIZER:
            curr_opt = current_state.config.optimizer_name.lower()
            target_opt = params.get("target_optimizer", "").lower()
            if not target_opt:
                # If unspecified, repair library selects an alternate optimizer
                pass
            elif target_opt == curr_opt:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=f"NO_OP_MUTATION: Target optimizer '{target_opt}' is identical to current optimizer.",
                    candidate=candidate,
                )
            elif target_opt not in ["adam", "rmsprop", "sgd"]:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=f"INVALID_OPTIMIZER: '{target_opt}' is not a recognized optimizer.",
                    candidate=candidate,
                )

            # Anti-oscillation: check if we switched to curr_opt from target_opt within oscillation window
            recent_opt_changes = [
                rec for rec in history[-self.config.oscillation_window :] if rec.arm == RepairArm.CHANGE_OPTIMIZER
            ]
            if recent_opt_changes:
                last_change = recent_opt_changes[-1]
                prev_target = last_change.params.get("target_optimizer", "").lower()
                if prev_target == curr_opt:
                    return SafetyDecision(
                        arm=arm,
                        is_safe=False,
                        rejection_reason=(
                            f"ANTI_OSCILLATION: Optimizer was recently switched to '{curr_opt}' "
                            f"at step {last_change.step}. Switching back violates the {self.config.oscillation_window}-step oscillation window."
                        ),
                        candidate=candidate,
                    )

        elif arm == RepairArm.REDUCE_CIRCUIT_DEPTH:
            curr_depth = current_state.config.n_layers
            if curr_depth <= self.config.min_depth:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"DEPTH_BOUND_EXCEEDED: Circuit depth {curr_depth} cannot be reduced below "
                        f"minimum allowable depth {self.config.min_depth}."
                    ),
                    candidate=candidate,
                )

            # Anti-oscillation: Prevent rapid consecutive depth decreases in short horizon
            recent_depth_reductions = [
                rec for rec in history[-self.config.oscillation_window :] if rec.arm == RepairArm.REDUCE_CIRCUIT_DEPTH
            ]
            if len(recent_depth_reductions) >= 2:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"ANTI_OSCILLATION: Circuit depth has already been reduced {len(recent_depth_reductions)} times "
                        f"within the last {self.config.oscillation_window} steps."
                    ),
                    candidate=candidate,
                )

        elif arm == RepairArm.MODIFY_FEATURE_MAP:
            curr_fmap = current_state.config.feature_map.lower()
            target_fmap = params.get("target_feature_map", "").lower()
            if target_fmap and target_fmap == curr_fmap:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=f"NO_OP_MUTATION: Target feature map '{target_fmap}' is identical to current feature map.",
                    candidate=candidate,
                )

            # Anti-oscillation: check if feature map was toggled within window
            recent_fmap_changes = [
                rec for rec in history[-self.config.oscillation_window :] if rec.arm == RepairArm.MODIFY_FEATURE_MAP
            ]
            if recent_fmap_changes:
                last_change = recent_fmap_changes[-1]
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"ANTI_OSCILLATION: Feature map was altered at step {last_change.step}. "
                        f"Toggling back within {self.config.oscillation_window} steps creates representational jitter."
                    ),
                    candidate=candidate,
                )

        elif arm == RepairArm.ADJUST_LEARNING_RATE:
            curr_lr = current_state.config.learning_rate
            if "new_lr" in params:
                proposed_lr = float(params["new_lr"])
            else:
                factor = float(params.get("factor", 0.5))
                proposed_lr = curr_lr * factor

            if proposed_lr < self.config.lr_min:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"LR_LOWER_BOUND_EXCEEDED: Proposed learning rate {proposed_lr:.6f} is below "
                        f"minimum threshold {self.config.lr_min}."
                    ),
                    candidate=candidate,
                )

            if proposed_lr > self.config.lr_max:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"LR_UPPER_BOUND_EXCEEDED: Proposed learning rate {proposed_lr:.6f} exceeds "
                        f"maximum allowable threshold {self.config.lr_max}."
                    ),
                    candidate=candidate,
                )

            # Anti-oscillation: check if we are reversing a recent LR adjustment direction
            recent_lr_changes = [
                rec for rec in history[-self.config.oscillation_window :] if rec.arm == RepairArm.ADJUST_LEARNING_RATE
            ]
            if recent_lr_changes:
                last_lr_change = recent_lr_changes[-1]
                last_factor = float(last_lr_change.params.get("factor", 1.0))
                current_factor = proposed_lr / curr_lr
                # Check for opposing directions
                if (last_factor > 1.0 and current_factor < 1.0) or (last_factor < 1.0 and current_factor > 1.0):
                    return SafetyDecision(
                        arm=arm,
                        is_safe=False,
                        rejection_reason=(
                            f"ANTI_OSCILLATION: Inverting learning rate direction "
                            f"(previous factor {last_factor:.2f} at step {last_lr_change.step}, proposed factor {current_factor:.2f}) "
                            f"within {self.config.oscillation_window}-step window causes optimizer limit cycling."
                        ),
                        candidate=candidate,
                    )

        elif arm == RepairArm.APPLY_NOISE_MITIGATION:
            if getattr(current_state.config, "noise_mitigation", False):
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason="NO_OP_MUTATION: Simulation-side noise mitigation is already active.",
                    candidate=candidate,
                )

        elif arm == RepairArm.PERFORM_WARM_RESTART:
            # Check for excessive back-to-back restarts
            recent_restarts = [
                rec for rec in history[-self.config.oscillation_window :] if rec.arm == RepairArm.PERFORM_WARM_RESTART
            ]
            if len(recent_restarts) >= 2:
                return SafetyDecision(
                    arm=arm,
                    is_safe=False,
                    rejection_reason=(
                        f"ANTI_OSCILLATION: Model was warm-restarted {len(recent_restarts)} times "
                        f"within the last {self.config.oscillation_window} steps. Repeated restarts prevent convergence."
                    ),
                    candidate=candidate,
                )

        # Passed all safety checks
        return SafetyDecision(
            arm=arm,
            is_safe=True,
            candidate=candidate,
        )

    def filter_candidates(
        self,
        candidates: List[CandidateRepair],
        current_state: ModelState,
        history: Optional[List[RepairHistoryRecord]] = None,
    ) -> List[SafetyDecision]:
        """Evaluate a list of candidate repairs and return their SafetyDecisions."""
        return [self.evaluate_candidate(cand, current_state, history) for cand in candidates]

    def get_safe_candidates(
        self,
        candidates: List[CandidateRepair],
        current_state: ModelState,
        history: Optional[List[RepairHistoryRecord]] = None,
    ) -> List[CandidateRepair]:
        """Return only the subset of candidate repairs that satisfy all safety constraints."""
        decisions = self.filter_candidates(candidates, current_state, history)
        return [dec.candidate for dec in decisions if dec.is_safe]
