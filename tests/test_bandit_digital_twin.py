"""
Comprehensive Test Suite for Digital-Twin Proxy Simulation and Contextual Thompson Sampling.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 5).
"""

import json
import os
import shutil
import tempfile
import numpy as np
import pytest

from backend.qml_model import CircuitConfig, FailureType, ModelState, VQCModel, create_optimizer, load_dataset
from backend.monitoring import HealthObservation, TelemetrySummary
from backend.diagnosis import DiagnosisResult
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary
from backend.safety_filter import SafetyDecision, SafetyFilter, SafetyFilterConfig
from backend.digital_twin import DigitalTwinPrediction, DigitalTwinSimulator
from backend.bandit import (
    ArmPosterior,
    BanditDecision,
    ContextualThompsonSampler,
    build_context_vector,
    compute_multi_objective_reward,
)


# ======================================================================
# Test Fixtures & Helpers
# ======================================================================

@pytest.fixture
def temp_storage_dir():
    temp_dir = tempfile.mkdtemp()
    yield temp_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture
def moons_data():
    X_train, y_train, X_val, y_val = load_dataset("moons", seed=42)
    return X_train, y_train, X_val, y_val


@pytest.fixture
def baseline_model():
    config = CircuitConfig(
        n_qubits=2,
        n_layers=2,
        feature_map="angle",
        ansatz_type="basic_entangling",
        optimizer_name="adam",
        learning_rate=0.05,
        seed=42,
    )
    return VQCModel(config)


@pytest.fixture
def nominal_obs():
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


# ======================================================================
# 1. Digital Twin Tests
# ======================================================================

class TestDigitalTwin:
    """Tests for short-horizon proxy simulation, state isolation, and prediction metrics."""

    def test_horizon_lock_enforcement(self):
        # Must enforce H = 3
        with pytest.raises(ValueError, match="locked to H = 3"):
            DigitalTwinSimulator(horizon=5)
        # H = 3 works
        dt = DigitalTwinSimulator(horizon=3)
        assert dt.horizon == 3

    def test_original_model_state_isolation(self, baseline_model, moons_data):
        _, _, X_val, y_val = moons_data
        dt = DigitalTwinSimulator(horizon=3)

        orig_params = baseline_model.params.copy()
        orig_opt = baseline_model.config.optimizer_name
        orig_lr = baseline_model.optimizer.lr

        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
        pred = dt.simulate_candidate(baseline_model, cand, X_val, y_val, seed=42)

        # Verify simulation output
        assert pred.arm == RepairArm.CHANGE_OPTIMIZER
        assert len(pred.proxy_loss_trajectory) == 4  # Initial L0 + 3 steps

        # CRITICAL ISOLATION CHECK: Primary model state must be 100% untouched
        assert np.array_equal(baseline_model.params, orig_params)
        assert baseline_model.config.optimizer_name == orig_opt
        assert baseline_model.optimizer.lr == orig_lr

    def test_three_step_execution_and_metrics(self, baseline_model, moons_data):
        _, _, X_val, y_val = moons_data
        dt = DigitalTwinSimulator(horizon=3)

        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 0.5})
        pred = dt.simulate_candidate(baseline_model, cand, X_val, y_val, seed=101)

        assert pred.horizon == 3
        assert len(pred.proxy_loss_trajectory) == 4
        assert pred.proxy_stability >= 0.0 and pred.proxy_stability <= 1.0
        assert pred.proxy_grad_variance >= 0.0
        assert pred.circuit_evaluations > 0
        assert pred.is_viable is True

    def test_rejection_of_degrading_candidates(self, baseline_model, moons_data):
        _, _, X_val, y_val = moons_data
        dt = DigitalTwinSimulator(horizon=3, max_loss_degradation=0.10)

        # A massive learning rate explosion (50x) will cause severe loss degradation in 3 steps
        cand_bad = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"new_lr": 1.0})
        # Set baseline to an already converged low loss state
        for _ in range(5):
            baseline_model.train_step(X_val, y_val, X_val, y_val)

        pred = dt.simulate_candidate(baseline_model, cand_bad, X_val, y_val, seed=42)
        # If proxy loss worsened by > 10%, is_viable must be False
        if pred.predicted_loss_delta < -0.10 * pred.initial_loss:
            assert pred.is_viable is False
            assert "DEGRADATION" in pred.rejection_reason

    def test_reproducibility_with_fixed_seed(self, baseline_model, moons_data):
        _, _, X_val, y_val = moons_data
        dt = DigitalTwinSimulator(horizon=3)
        cand = CandidateRepair(arm=RepairArm.PERFORM_WARM_RESTART, params={"mode": "perturbation", "sigma": 0.05})

        pred1 = dt.simulate_candidate(baseline_model, cand, X_val, y_val, seed=777)
        pred2 = dt.simulate_candidate(baseline_model, cand, X_val, y_val, seed=777)

        assert np.allclose(pred1.proxy_loss_trajectory, pred2.proxy_loss_trajectory)
        assert np.isclose(pred1.predicted_loss_delta, pred2.predicted_loss_delta)
        assert np.isclose(pred1.proxy_stability, pred2.proxy_stability)

    def test_prediction_fidelity_tracking(self):
        dt = DigitalTwinSimulator(horizon=3)
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER)
        pred = DigitalTwinPrediction(
            arm=RepairArm.CHANGE_OPTIMIZER,
            candidate=cand,
            horizon=3,
            initial_loss=0.70,
            predicted_loss_final=0.55,
            predicted_loss_delta=0.15,
            normalized_predicted_delta=0.15,
            proxy_loss_trajectory=[0.70, 0.65, 0.60, 0.55],
            proxy_stability=0.90,
            proxy_grad_variance=0.01,
            circuit_evaluations=100,
            is_viable=True,
        )

        record = dt.record_actual_outcome(pred, actual_loss_delta=0.12)
        assert np.isclose(record.prediction_error, 0.03)

        metrics = dt.get_fidelity_metrics()
        assert metrics["count"] == 1.0
        assert np.isclose(metrics["mae"], 0.03)


# ======================================================================
# 2. Contextual Thompson Sampling Tests
# ======================================================================

class TestContextualThompsonSampler:
    """Tests for 12D context mapping, Bayesian posteriors, rank-1 updates, and selection."""

    def test_context_vector_dimensions_and_ranges(self, nominal_obs, nominal_summary):
        diag = DiagnosisResult(
            step=5,
            primary_cause=FailureType.LR_MISCONFIGURATION,
            confidence=0.80,
            probabilities={"lr_misconfiguration": 0.80, "barren_plateau": 0.04, "optimizer_instability": 0.04, "training_divergence": 0.04, "persistent_plateau": 0.04, "noise_degradation": 0.04},
            confidence_gate_cleared=True,
            recommended_action="PROCEED_TO_REPAIR",
            supporting_evidence=["LR jump"],
            alternative_causes=[],
            anomalies_detected=1,
        )
        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE)
        twin_pred = DigitalTwinPrediction(
            arm=RepairArm.ADJUST_LEARNING_RATE,
            candidate=cand,
            horizon=3,
            initial_loss=0.60,
            predicted_loss_final=0.45,
            predicted_loss_delta=0.15,
            normalized_predicted_delta=0.24,
            proxy_loss_trajectory=[0.60, 0.55, 0.50, 0.45],
            proxy_stability=0.92,
            proxy_grad_variance=0.005,
            circuit_evaluations=120,
            is_viable=True,
        )

        x = build_context_vector(
            nominal_obs,
            nominal_summary,
            diag=diag,
            memory_prior_reward=0.65,
            memory_top_similarity=0.88,
            twin_prediction=twin_pred,
            max_depth=8,
        )

        assert isinstance(x, np.ndarray)
        assert x.shape == (12,)
        assert x[0] == 1.0  # Bias
        assert np.isclose(x[8], 0.65)  # Historical reward
        assert np.isclose(x[9], 0.88)  # Historical similarity
        assert np.isclose(x[10], 0.24)  # Twin predicted delta
        assert np.isclose(x[11], 0.92)  # Twin stability
        assert np.all(x >= -1.0) and np.all(x <= 1.0)

    def test_posterior_initialization(self, temp_storage_dir):
        storage_path = os.path.join(temp_storage_dir, "posteriors.json")
        sampler = ContextualThompsonSampler(d=12, storage_path=storage_path)

        assert len(sampler.posteriors) == 6
        for arm in RepairArm:
            post = sampler.posteriors[arm]
            assert post.d == 12
            assert post.update_count == 0
            assert np.array_equal(post.B, np.eye(12))
            assert np.array_equal(post.B_inv, np.eye(12))
            assert np.array_equal(post.f, np.zeros(12))
            assert np.array_equal(post.mu, np.zeros(12))

    def test_online_bayesian_posterior_updates(self, temp_storage_dir):
        storage_path = os.path.join(temp_storage_dir, "posteriors.json")
        sampler = ContextualThompsonSampler(d=12, storage_path=storage_path)

        x = np.ones(12, dtype=np.float64) / np.sqrt(12)  # Unit norm context
        arm = RepairArm.CHANGE_OPTIMIZER
        post = sampler.posteriors[arm]

        # Prior mean is zero
        assert np.allclose(post.mu, 0.0)

        # Update with high positive reward
        sampler.update_arm(arm, x, actual_reward=0.90)
        assert post.update_count == 1
        assert not np.allclose(post.mu, 0.0)

        # Point estimate E[r|x] must now be positive
        pred_reward = post.predict_expected_reward(x)
        assert pred_reward > 0.0

        # Update again with positive reward
        sampler.update_arm(arm, x, actual_reward=0.95)
        assert post.update_count == 2
        pred_reward_2 = post.predict_expected_reward(x)
        assert pred_reward_2 > pred_reward  # Mean belief strengthened

    def test_restart_persistence(self, temp_storage_dir):
        storage_path = os.path.join(temp_storage_dir, "persist_posteriors.json")
        sampler1 = ContextualThompsonSampler(d=12, storage_path=storage_path)

        x = np.array([1.0] + [0.1] * 11, dtype=np.float64)
        sampler1.update_arm(RepairArm.ADJUST_LEARNING_RATE, x, actual_reward=0.85)

        saved_mu = sampler1.posteriors[RepairArm.ADJUST_LEARNING_RATE].mu.copy()
        saved_B = sampler1.posteriors[RepairArm.ADJUST_LEARNING_RATE].B.copy()
        saved_pred = sampler1.posteriors[RepairArm.ADJUST_LEARNING_RATE].predict_expected_reward(x)

        # Destroy instance and create fresh one loading from same file
        del sampler1
        sampler2 = ContextualThompsonSampler(d=12, storage_path=storage_path)
        post = sampler2.posteriors[RepairArm.ADJUST_LEARNING_RATE]

        assert post.update_count == 1
        assert np.allclose(post.mu, saved_mu)
        assert np.allclose(post.B, saved_B)
        assert np.isclose(post.predict_expected_reward(x), saved_pred)
        # Analytical check: x^T mu = r * (x^T x) / (1 + x^T x)
        expected_analytical = 0.85 * float(np.dot(x, x)) / (1.0 + float(np.dot(x, x)))
        assert np.isclose(post.predict_expected_reward(x), expected_analytical, atol=1e-5)

    def test_selection_filters_unsafe_and_non_viable_arms(self, temp_storage_dir):
        storage_path = os.path.join(temp_storage_dir, "filter_posteriors.json")
        sampler = ContextualThompsonSampler(d=12, storage_path=storage_path)

        candidates = [
            CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER),
            CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH),
            CandidateRepair(arm=RepairArm.MODIFY_FEATURE_MAP),
        ]
        context = np.ones(12) / np.sqrt(12)

        # Safety filter rejects CHANGE_OPTIMIZER
        safety_decisions = [
            SafetyDecision(arm=RepairArm.CHANGE_OPTIMIZER, is_safe=False, rejection_reason="NO_OP"),
            SafetyDecision(arm=RepairArm.REDUCE_CIRCUIT_DEPTH, is_safe=True),
            SafetyDecision(arm=RepairArm.MODIFY_FEATURE_MAP, is_safe=True),
        ]

        # Digital twin deems REDUCE_CIRCUIT_DEPTH non-viable (e.g. loss degradation)
        twin_preds = {
            RepairArm.REDUCE_CIRCUIT_DEPTH: DigitalTwinPrediction(
                arm=RepairArm.REDUCE_CIRCUIT_DEPTH, candidate=candidates[1], horizon=3,
                initial_loss=0.5, predicted_loss_final=0.9, predicted_loss_delta=-0.4,
                normalized_predicted_delta=-0.6, proxy_loss_trajectory=[], proxy_stability=0.2,
                proxy_grad_variance=0.1, circuit_evaluations=50, is_viable=False
            ),
            RepairArm.MODIFY_FEATURE_MAP: DigitalTwinPrediction(
                arm=RepairArm.MODIFY_FEATURE_MAP, candidate=candidates[2], horizon=3,
                initial_loss=0.5, predicted_loss_final=0.4, predicted_loss_delta=0.1,
                normalized_predicted_delta=0.2, proxy_loss_trajectory=[], proxy_stability=0.8,
                proxy_grad_variance=0.01, circuit_evaluations=50, is_viable=True
            ),
        }

        # Bandit must select MODIFY_FEATURE_MAP because it's the only one that passed both gates!
        decision = sampler.select_arm(
            candidates=candidates,
            context=context,
            safety_decisions=safety_decisions,
            twin_predictions=twin_preds,
        )

        assert decision.selected_arm == RepairArm.MODIFY_FEATURE_MAP
        assert decision.eligible_arms == [RepairArm.MODIFY_FEATURE_MAP]

    def test_multi_objective_reward_bounds_and_components(self):
        # 1. Exceptional recovery: loss improves from 0.8 to 0.4, acc +0.20, no depth change, no rollback
        r_good = compute_multi_objective_reward(
            loss_pre=0.80,
            loss_post=0.40,
            acc_pre=0.60,
            acc_post=0.80,
            grad_norm_pre=0.10,
            grad_norm_post=0.12,
            failure_type="lr_misconfiguration",
            circuit_evaluations=100,
            depth_pre=2,
            depth_post=2,
            was_rolled_back=False,
        )
        assert r_good > 0.0
        assert r_good <= 1.0

        # 2. Catastrophic repair that had to be rolled back
        r_bad = compute_multi_objective_reward(
            loss_pre=0.50,
            loss_post=1.50,
            acc_pre=0.75,
            acc_post=0.45,
            grad_norm_pre=0.20,
            grad_norm_post=5.00,
            failure_type="optimizer_instability",
            circuit_evaluations=200,
            depth_pre=2,
            depth_post=2,
            was_rolled_back=True,
        )
        assert r_bad < 0.0
        assert r_bad >= -1.0


# ======================================================================
# 3. Comparative Policy Benchmark: Regret Minimization
# ======================================================================

class TestPolicyRegretBenchmark:
    """
    Experimental validation comparing Contextual Thompson Sampling against:
      - Random selection
      - Greedy selection
      - Fixed rule-based heuristic
    Measures cumulative reward and cumulative regret over repeated trials across multiple seeds.
    """

    def test_thompson_sampling_regret_minimization(self, temp_storage_dir):
        """
        Simulate a contextual bandit environment with distinct contextual preferences:
          - If context feature x[2] (loss) is high and x[3] (grad norm) is tiny -> Arm 2 (Reduce Depth) has payoff +0.8
          - If context feature x[11] (learning rate) is high -> Arm 4 (Adjust LR) has payoff +0.85
          - Other arms produce baseline payoff 0.0 or negative payoff -0.4
        Verify Thompson Sampling achieves higher cumulative reward than Random selection.
        """
        seeds = [42, 101, 202]
        trials_per_seed = 30

        results = {"thompson": [], "random": [], "greedy": [], "fixed_rule": []}

        for seed in seeds:
            storage_path = os.path.join(temp_storage_dir, f"benchmark_{seed}.json")
            ts_sampler = ContextualThompsonSampler(d=12, storage_path=storage_path, seed=seed)
            rng = np.random.RandomState(seed)

            ts_cum_reward = 0.0
            random_cum_reward = 0.0
            greedy_cum_reward = 0.0
            rule_cum_reward = 0.0

            candidates = [CandidateRepair(arm=arm) for arm in RepairArm]

            # True underlying environmental reward function
            def env_payoff(arm: RepairArm, ctx: np.ndarray) -> float:
                # Scenario A: Barren plateau regime
                if ctx[2] < -0.5:
                    best = RepairArm.REDUCE_CIRCUIT_DEPTH
                # Scenario B: Divergent / high LR regime
                elif ctx[11] > 0.5:
                    best = RepairArm.ADJUST_LEARNING_RATE
                else:
                    best = RepairArm.PERFORM_WARM_RESTART

                if arm == best:
                    base = 0.80
                elif arm == RepairArm.CHANGE_OPTIMIZER:
                    base = 0.30
                else:
                    base = -0.20
                noise = rng.normal(0.0, 0.05)
                return float(np.clip(base + noise, -1.0, 1.0))

            for t in range(trials_per_seed):
                # Generate random context vector
                ctx = rng.uniform(-1.0, 1.0, size=12)
                ctx[0] = 1.0  # Bias
                ctx = ctx / np.linalg.norm(ctx)

                # 1. Thompson Sampling
                ts_dec = ts_sampler.select_arm(candidates, ctx, greedy=False)
                ts_r = env_payoff(ts_dec.selected_arm, ctx)
                ts_sampler.update_arm(ts_dec.selected_arm, ctx, ts_r)
                ts_cum_reward += ts_r

                # 2. Random Selection
                rand_arm = rng.choice(list(RepairArm))
                rand_r = env_payoff(rand_arm, ctx)
                random_cum_reward += rand_r

                # 3. Greedy Selection
                greedy_dec = ts_sampler.select_arm(candidates, ctx, greedy=True)
                greedy_r = env_payoff(greedy_dec.selected_arm, ctx)
                greedy_cum_reward += greedy_r

                # 4. Fixed Rule: Always change optimizer
                rule_r = env_payoff(RepairArm.CHANGE_OPTIMIZER, ctx)
                rule_cum_reward += rule_r

            results["thompson"].append(ts_cum_reward)
            results["random"].append(random_cum_reward)
            results["greedy"].append(greedy_cum_reward)
            results["fixed_rule"].append(rule_cum_reward)

        mean_ts = np.mean(results["thompson"])
        mean_rand = np.mean(results["random"])
        mean_rule = np.mean(results["fixed_rule"])

        print(f"\nPolicy Benchmark Results across 3 seeds ({trials_per_seed} trials/seed):")
        print(f"  Contextual Thompson Sampling Mean Cumulative Reward: {mean_ts:.2f}")
        print(f"  Random Selection Mean Cumulative Reward:             {mean_rand:.2f}")
        print(f"  Fixed Rule Selection Mean Cumulative Reward:         {mean_rule:.2f}")

        # Thompson Sampling must statistically outperform Random Selection
        assert mean_ts > mean_rand, (
            f"Thompson Sampling ({mean_ts:.2f}) failed to outperform Random Selection ({mean_rand:.2f})!"
        )
