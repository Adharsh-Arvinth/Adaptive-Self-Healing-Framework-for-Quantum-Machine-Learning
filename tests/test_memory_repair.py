"""
Comprehensive Test Suite for Failure Memory, Modular Repair Library, and Safety Filter.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 4).
"""

import os
import shutil
import tempfile
import numpy as np
import pytest

from backend.monitoring import HealthObservation, TelemetrySummary
from backend.diagnosis import DiagnosisResult
from backend.memory import FailureEpisode, FailureMemory, build_failure_embedding
from backend.qml_model import CircuitConfig, FailureType, ModelState, VQCModel, create_optimizer
from backend.repair_library import (
    CandidateRepair,
    RepairArm,
    RepairExecutionResult,
    RepairLibrary,
)
from backend.safety_filter import (
    RepairHistoryRecord,
    SafetyDecision,
    SafetyFilter,
    SafetyFilterConfig,
)


# ======================================================================
# Test Fixtures & Helpers
# ======================================================================

@pytest.fixture
def temp_db_dir():
    """Create a temporary directory for isolated SQLite test databases."""
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def nominal_observation():
    return HealthObservation(
        step=5,
        timestamp=100.0,
        iso_timestamp="2026-11-02T16:00:00",
        experiment_id="exp_test",
        loss=0.45,
        val_loss=0.48,
        accuracy=0.82,
        val_accuracy=0.80,
        gradient_norm=0.15,
        gradient_variance=0.012,
        parameter_velocity=0.02,
        learning_rate=0.05,
        circuit_depth=2,
        is_valid=True,
    )


@pytest.fixture
def nominal_summary():
    return TelemetrySummary(
        window_size=5,
        steps_observed=5,
        latest_step=5,
        loss_mean=0.47,
        loss_std=0.04,
        loss_min=0.45,
        loss_max=0.52,
        loss_slope=-0.03,
        loss_delta_recent=-0.01,
        val_loss_mean=0.49,
        val_loss_std=0.02,
        train_val_gap=0.02,
        accuracy_mean=0.81,
        val_accuracy_mean=0.79,
        grad_norm_mean=0.16,
        grad_norm_min=0.12,
        grad_norm_max=0.20,
        grad_var_mean=0.01,
        grad_var_min=0.005,
        param_velocity_mean=0.02,
        param_velocity_recent=0.018,
        oscillation_count=0,
        loss_cv=0.09,
        has_nan_or_inf=False,
        invalid_steps_count=0,
    )


@pytest.fixture
def sample_model_state():
    config = CircuitConfig(
        n_qubits=2,
        n_layers=2,
        feature_map="angle",
        ansatz_type="basic_entangling",
        optimizer_name="adam",
        learning_rate=0.05,
        seed=42,
    )
    rng = np.random.RandomState(42)
    params = rng.uniform(-0.2, 0.2, size=(2, 2))
    opt = create_optimizer("adam", 0.05)
    return ModelState(
        params=params,
        config=config,
        optimizer_state=opt.get_state(),
        epoch=10,
        active_injections=[],
    )


# ======================================================================
# 1. Failure Memory Tests
# ======================================================================

class TestFailureMemory:
    """Tests for 12D embedding builder, SQLite persistence, and vector retrieval."""

    def test_embedding_dimensions_and_bounds(self, nominal_observation, nominal_summary):
        diag = DiagnosisResult(
            step=5,
            primary_cause=None,
            confidence=0.78,
            probabilities={"optimizer_instability": 0.78, "barren_plateau": 0.04, "lr_misconfiguration": 0.06, "training_divergence": 0.04, "persistent_plateau": 0.04, "noise_degradation": 0.04},
            confidence_gate_cleared=True,
            recommended_action="PROCEED_TO_REPAIR",
            supporting_evidence=["High gradient variance"],
            alternative_causes=[],
            anomalies_detected=1,
        )
        emb = build_failure_embedding(nominal_observation, nominal_summary, diag, max_depth=8)
        assert isinstance(emb, np.ndarray)
        assert emb.shape == (12,)
        assert emb[0] == 1.0  # Bias term
        assert np.all(emb >= -1.0) and np.all(emb <= 1.0)  # Bounded in [-1, 1]

    def test_embedding_handles_nan_inf_safely(self, nominal_summary):
        # Pathological observation with NaNs and Infs
        bad_obs = HealthObservation(
            step=1,
            timestamp=10.0,
            iso_timestamp="2026-11-02T16:00:00",
            experiment_id="exp_test",
            loss=float("nan"),
            val_loss=float("inf"),
            accuracy=0.5,
            val_accuracy=0.5,
            gradient_norm=float("nan"),
            gradient_variance=float("inf"),
            parameter_velocity=float("nan"),
            learning_rate=0.0,
            circuit_depth=0,
            is_valid=False,
        )
        emb = build_failure_embedding(bad_obs, nominal_summary, None, max_depth=8)
        assert emb.shape == (12,)
        assert not np.any(np.isnan(emb))
        assert not np.any(np.isinf(emb))

    def test_cosine_similarity_retrieval_ranking(self, temp_db_dir):
        db_path = os.path.join(temp_db_dir, "test_memory.db")
        memory = FailureMemory(db_path=db_path)

        # Base embedding
        base_emb = np.zeros(12, dtype=np.float64)
        base_emb[0] = 1.0
        base_emb[1] = 0.5

        # Episode 1: Highly aligned (cos sim ~ 1.0)
        ep1 = FailureEpisode(
            episode_id="ep_001",
            timestamp=100.0,
            iso_timestamp="2026-11-02T16:00:00",
            experiment_id="exp_test",
            step=5,
            embedding=base_emb.copy(),
            diagnosed_cause="barren_plateau",
            diagnosis_confidence=0.85,
            telemetry_summary={"loss": 0.5},
            selected_repair="reduce_circuit_depth",
            reward=0.75,
            status="RESOLVED",
        )

        # Episode 2: Orthogonal vector (cos sim ~ 0.0)
        ortho_emb = np.zeros(12, dtype=np.float64)
        ortho_emb[5] = 1.0  # Index 5 is orthogonal to 0 and 1
        ep2 = FailureEpisode(
            episode_id="ep_002",
            timestamp=101.0,
            iso_timestamp="2026-11-02T16:01:00",
            experiment_id="exp_test",
            step=10,
            embedding=ortho_emb,
            diagnosed_cause="training_divergence",
            diagnosis_confidence=0.90,
            telemetry_summary={"loss": 10.0},
            selected_repair="perform_warm_restart",
            reward=0.80,
            status="RESOLVED",
        )

        # Episode 3: Negated vector (cos sim ~ -1.0)
        neg_emb = -base_emb.copy()
        ep3 = FailureEpisode(
            episode_id="ep_003",
            timestamp=102.0,
            iso_timestamp="2026-11-02T16:02:00",
            experiment_id="exp_test",
            step=15,
            embedding=neg_emb,
            diagnosed_cause="lr_misconfiguration",
            diagnosis_confidence=0.70,
            telemetry_summary={"loss": 1.2},
            selected_repair="adjust_learning_rate",
            reward=-0.3,
            status="FAILED",
        )

        assert memory.store_episode(ep1)
        assert memory.store_episode(ep2)
        assert memory.store_episode(ep3)
        assert memory.count() == 3

        # Query with base_emb
        results = memory.retrieve_similar(base_emb, top_k=3)
        assert len(results) == 3
        # ep1 should be top (similarity ~ 1.0)
        assert results[0].episode.episode_id == "ep_001"
        assert np.isclose(results[0].similarity, 1.0, atol=1e-5)
        # ep2 should be middle (similarity ~ 0.0)
        assert results[1].episode.episode_id == "ep_002"
        assert np.isclose(results[1].similarity, 0.0, atol=1e-5)
        # ep3 should be bottom (similarity ~ -1.0)
        assert results[2].episode.episode_id == "ep_003"
        assert np.isclose(results[2].similarity, -1.0, atol=1e-5)

    def test_database_persistence_across_reconnect(self, temp_db_dir):
        db_path = os.path.join(temp_db_dir, "persist.db")
        mem1 = FailureMemory(db_path=db_path)

        emb = np.random.uniform(-1, 1, size=12)
        ep = FailureEpisode(
            episode_id="persist_01",
            timestamp=500.0,
            iso_timestamp="2026-11-02T16:30:00",
            experiment_id="exp_persist",
            step=12,
            embedding=emb,
            diagnosed_cause="noise_degradation",
            diagnosis_confidence=0.88,
            telemetry_summary={"noise_level": 0.25},
            selected_repair="apply_noise_mitigation",
            reward=0.65,
            status="RESOLVED",
        )
        mem1.store_episode(ep)
        assert mem1.count() == 1

        # Destroy mem1 and create new instance pointing to same file
        del mem1
        mem2 = FailureMemory(db_path=db_path)
        assert mem2.count() == 1
        results = mem2.retrieve_similar(emb, top_k=1)
        assert len(results) == 1
        assert results[0].episode.episode_id == "persist_01"
        assert results[0].episode.diagnosed_cause == "noise_degradation"
        assert np.allclose(results[0].episode.embedding, emb)

    def test_empty_database_and_zero_norm_query(self, temp_db_dir):
        db_path = os.path.join(temp_db_dir, "empty.db")
        memory = FailureMemory(db_path=db_path)
        assert memory.count() == 0

        # Query on empty DB
        q_emb = np.ones(12)
        assert memory.retrieve_similar(q_emb) == []

        # Zero norm query
        zero_emb = np.zeros(12)
        assert memory.retrieve_similar(zero_emb) == []

        # Invalid shape
        bad_shape = np.ones(5)
        assert memory.retrieve_similar(bad_shape) == []

    def test_cause_filter_in_retrieval(self, temp_db_dir):
        db_path = os.path.join(temp_db_dir, "filter.db")
        memory = FailureMemory(db_path=db_path)

        for i, cause in enumerate(["barren_plateau", "lr_misconfiguration", "barren_plateau"]):
            emb = np.random.uniform(-1, 1, size=12)
            ep = FailureEpisode(
                episode_id=f"ep_{i}",
                timestamp=float(i),
                iso_timestamp=f"2026-11-02T16:0{i}:00",
                experiment_id="exp_filter",
                step=i,
                embedding=emb,
                diagnosed_cause=cause,
                diagnosis_confidence=0.8,
                telemetry_summary={},
                selected_repair="test_repair",
            )
            memory.store_episode(ep)

        # Retrieve only barren_plateau
        res = memory.retrieve_similar(np.ones(12), cause_filter="barren_plateau")
        assert len(res) == 2
        assert all(r.episode.diagnosed_cause == "barren_plateau" for r in res)


# ======================================================================
# 2. Repair Library Tests
# ======================================================================

class TestRepairLibrary:
    """Tests for all 6 repair transformations, reversibility, and state handling."""

    def test_candidate_generation_targeted_and_all_arms(self, sample_model_state):
        lib = RepairLibrary()

        # Targeted candidates for barren plateau
        diag_bp = DiagnosisResult(
            step=5,
            primary_cause=FailureType.BARREN_PLATEAU,
            confidence=0.85,
            probabilities={},
            confidence_gate_cleared=True,
            recommended_action="PROCEED_TO_REPAIR",
            supporting_evidence=[],
            alternative_causes=[],
            anomalies_detected=1,
        )
        candidates_bp = lib.generate_candidate_repairs(sample_model_state, diag_bp)
        arms_bp = [c.arm for c in candidates_bp]
        assert RepairArm.REDUCE_CIRCUIT_DEPTH in arms_bp
        assert RepairArm.PERFORM_WARM_RESTART in arms_bp

        # All 6 arms generation
        all_candidates = lib.generate_candidate_repairs(sample_model_state, all_arms=True)
        assert len(all_candidates) == 6
        assert set(c.arm for c in all_candidates) == set(RepairArm)

    def test_repair_arm_change_optimizer(self, sample_model_state):
        lib = RepairLibrary()
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
        result = lib.apply_repair(sample_model_state, cand)

        assert result.success is True
        assert result.transformed_state.config.optimizer_name == "rmsprop"
        # Verify original state was NOT mutated (immutability check)
        assert sample_model_state.config.optimizer_name == "adam"
        # Check diff summary
        assert result.diff_summary["prev_optimizer"] == "adam"
        assert result.diff_summary["new_optimizer"] == "rmsprop"

    def test_repair_arm_reduce_circuit_depth(self, sample_model_state):
        lib = RepairLibrary(min_depth=1)
        # Starting depth = 2, params shape (2, 2)
        assert sample_model_state.config.n_layers == 2
        assert sample_model_state.params.shape == (2, 2)

        cand = CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH)
        result = lib.apply_repair(sample_model_state, cand)

        assert result.success is True
        assert result.transformed_state.config.n_layers == 1
        assert result.transformed_state.params.shape == (1, 2)
        # Original state preserved
        assert sample_model_state.config.n_layers == 2
        assert sample_model_state.params.shape == (2, 2)

        # Attempt reducing below minimum (1 -> 0) should fail
        cand_fail = CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH)
        result_fail = lib.apply_repair(result.transformed_state, cand_fail)
        assert result_fail.success is False
        assert "minimum allowable value" in result_fail.error_message

    def test_repair_arm_modify_feature_map(self, sample_model_state):
        lib = RepairLibrary()
        assert sample_model_state.config.feature_map == "angle"

        cand = CandidateRepair(arm=RepairArm.MODIFY_FEATURE_MAP, params={"target_feature_map": "iqp"})
        result = lib.apply_repair(sample_model_state, cand)

        assert result.success is True
        assert result.transformed_state.config.feature_map == "iqp"
        # Variational parameters preserved
        assert np.array_equal(result.transformed_state.params, sample_model_state.params)

    def test_repair_arm_adjust_learning_rate(self, sample_model_state):
        lib = RepairLibrary(lr_min=1e-4, lr_max=1.0)
        curr_lr = sample_model_state.config.learning_rate  # 0.05

        # Scale down
        cand_down = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 0.2})
        res_down = lib.apply_repair(sample_model_state, cand_down)
        assert res_down.success is True
        assert np.isclose(res_down.transformed_state.config.learning_rate, 0.01)

        # Scale up
        cand_up = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 5.0})
        res_up = lib.apply_repair(sample_model_state, cand_up)
        assert res_up.success is True
        assert np.isclose(res_up.transformed_state.config.learning_rate, 0.25)

    def test_repair_arm_apply_noise_mitigation(self, sample_model_state):
        lib = RepairLibrary()
        assert not getattr(sample_model_state.config, "noise_mitigation", False)

        cand = CandidateRepair(arm=RepairArm.APPLY_NOISE_MITIGATION)
        result = lib.apply_repair(sample_model_state, cand)

        assert result.success is True
        assert result.transformed_state.config.noise_mitigation is True
        assert result.diff_summary["scope"] == "simulation_side_zne_and_readout_inversion"

        # Repeated application on already enabled state should fail safely
        res_dup = lib.apply_repair(result.transformed_state, cand)
        assert res_dup.success is False
        assert "already active" in res_dup.error_message

    def test_repair_arm_warm_restart_perturbation_and_nan_recovery(self, sample_model_state):
        lib = RepairLibrary(default_sigma=0.05)

        # Normal perturbation mode
        cand_pert = CandidateRepair(arm=RepairArm.PERFORM_WARM_RESTART, params={"mode": "perturbation", "sigma": 0.05})
        res_pert = lib.apply_repair(sample_model_state, cand_pert)
        assert res_pert.success is True
        # Parameters slightly shifted, not identical, but same shape
        assert res_pert.transformed_state.params.shape == sample_model_state.params.shape
        diff = np.abs(res_pert.transformed_state.params - sample_model_state.params)
        assert np.max(diff) > 0.001
        assert np.max(diff) < 0.3  # Bounded perturbation

        # NaN recovery mode (identity block fallback)
        nan_state = sample_model_state
        nan_state.params[0, 0] = np.nan
        cand_nan = CandidateRepair(arm=RepairArm.PERFORM_WARM_RESTART)
        res_nan = lib.apply_repair(nan_state, cand_nan)
        assert res_nan.success is True
        assert not np.any(np.isnan(res_nan.transformed_state.params))
        assert res_nan.diff_summary["nan_recovered"] is True

    def test_model_application_and_rollback(self, sample_model_state):
        lib = RepairLibrary()
        model = VQCModel(sample_model_state.config)
        orig_lr = model.optimizer.lr
        orig_opt = model.config.optimizer_name

        # Apply repair to live model instance
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
        result = lib.apply_to_model(model, cand)
        assert result.success is True
        assert model.config.optimizer_name == "rmsprop"

        # Atomic rollback verification
        lib.rollback_model(model, result)
        assert model.config.optimizer_name == orig_opt
        assert model.optimizer.lr == orig_lr


# ======================================================================
# 3. Safety Filter Tests
# ======================================================================

class TestSafetyFilter:
    """Tests for anti-oscillation, bounds, repeated failures, and rejection reasoning."""

    def test_learning_rate_bounds_enforcement(self, sample_model_state):
        filter_layer = SafetyFilter(SafetyFilterConfig(lr_min=1e-4, lr_max=1.0))

        # Too high: propose 2.0 (max is 1.0)
        cand_high = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"new_lr": 2.0})
        dec_high = filter_layer.evaluate_candidate(cand_high, sample_model_state)
        assert dec_high.is_safe is False
        assert "LR_UPPER_BOUND_EXCEEDED" in dec_high.rejection_reason

        # Too low: propose 1e-5 (min is 1e-4)
        cand_low = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"new_lr": 1e-5})
        dec_low = filter_layer.evaluate_candidate(cand_low, sample_model_state)
        assert dec_low.is_safe is False
        assert "LR_LOWER_BOUND_EXCEEDED" in dec_low.rejection_reason

        # Valid rate: propose 0.1
        cand_valid = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"new_lr": 0.1})
        dec_valid = filter_layer.evaluate_candidate(cand_valid, sample_model_state)
        assert dec_valid.is_safe is True
        assert dec_valid.rejection_reason is None

    def test_circuit_depth_minimum_enforcement(self, sample_model_state):
        filter_layer = SafetyFilter(SafetyFilterConfig(min_depth=1))
        # At depth 1
        state_depth_1 = sample_model_state
        state_depth_1.config.n_layers = 1

        cand = CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH)
        decision = filter_layer.evaluate_candidate(cand, state_depth_1)
        assert decision.is_safe is False
        assert "DEPTH_BOUND_EXCEEDED" in decision.rejection_reason

    def test_anti_oscillation_learning_rate_reversal(self, sample_model_state):
        filter_layer = SafetyFilter(SafetyFilterConfig(oscillation_window=4))

        # History: at step 5, LR was increased by factor 2.0
        history = [
            RepairHistoryRecord(
                step=5,
                arm=RepairArm.ADJUST_LEARNING_RATE,
                params={"factor": 2.0},
                status="SUCCESS",
                reward=0.2,
            )
        ]

        # Candidate at step 6 tries to immediately decrease LR by 0.5 (reversal)
        cand_reversal = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 0.5})
        decision = filter_layer.evaluate_candidate(cand_reversal, sample_model_state, history=history)
        assert decision.is_safe is False
        assert "ANTI_OSCILLATION" in decision.rejection_reason

    def test_anti_oscillation_feature_map_toggle(self, sample_model_state):
        filter_layer = SafetyFilter(SafetyFilterConfig(oscillation_window=4))

        # History: feature map was toggled at step 4
        history = [
            RepairHistoryRecord(
                step=4,
                arm=RepairArm.MODIFY_FEATURE_MAP,
                params={"target_feature_map": "iqp"},
                status="SUCCESS",
                reward=0.1,
            )
        ]

        # Current state has feature map 'iqp' (as set at step 4)
        sample_model_state.config.feature_map = "iqp"

        # Candidate proposes toggling back to 'angle' at step 5
        cand_toggle = CandidateRepair(arm=RepairArm.MODIFY_FEATURE_MAP, params={"target_feature_map": "angle"})
        decision = filter_layer.evaluate_candidate(cand_toggle, sample_model_state, history=history)
        assert decision.is_safe is False
        assert "ANTI_OSCILLATION" in decision.rejection_reason

    def test_repeated_failure_rejection(self, sample_model_state):
        filter_layer = SafetyFilter(SafetyFilterConfig(max_consecutive_failures=2))

        # Arm 'change_optimizer' failed twice consecutively
        history = [
            RepairHistoryRecord(step=2, arm=RepairArm.CHANGE_OPTIMIZER, params={}, status="FAILED", reward=-0.5),
            RepairHistoryRecord(step=4, arm=RepairArm.CHANGE_OPTIMIZER, params={}, status="ROLLED_BACK", reward=-0.2),
        ]

        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
        decision = filter_layer.evaluate_candidate(cand, sample_model_state, history=history)
        assert decision.is_safe is False
        assert "REPEATED_FAILURE" in decision.rejection_reason

    def test_filter_candidates_and_get_safe_candidates(self, sample_model_state):
        filter_layer = SafetyFilter(SafetyFilterConfig(min_depth=2))

        cand1 = CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH)  # depth is 2, min is 2 -> will fail
        cand2 = CandidateRepair(arm=RepairArm.PERFORM_WARM_RESTART)  # safe

        candidates = [cand1, cand2]
        decisions = filter_layer.filter_candidates(candidates, sample_model_state)
        assert len(decisions) == 2
        assert decisions[0].is_safe is False
        assert decisions[1].is_safe is True

        safe_candidates = filter_layer.get_safe_candidates(candidates, sample_model_state)
        assert len(safe_candidates) == 1
        assert safe_candidates[0].arm == RepairArm.PERFORM_WARM_RESTART
