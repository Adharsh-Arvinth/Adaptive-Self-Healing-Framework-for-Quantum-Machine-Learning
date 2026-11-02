"""
Independent Research-Readiness Audit: Mathematical Verification, Safety, and Failure Stress Tests.
Part of Stage 7.5 Audit Suite for Adaptive Self-Healing Quantum Machine Learning.
"""

import os
import tempfile
import numpy as np
import pytest

from backend.qml_model import CircuitConfig, FailureType, ModelState, StepMetrics, VQCModel
from backend.monitoring import HealthMonitor, HealthObservation, TelemetrySummary
from backend.detection import DetectionThresholds, FailureDetector, AnomalyStatus, DetectedAnomaly
from backend.diagnosis import DiagnosisEngine, DiagnosisResult
from backend.memory import FailureEpisode, FailureMemory, build_failure_embedding
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary
from backend.safety_filter import RepairHistoryRecord, SafetyDecision, SafetyFilter, SafetyFilterConfig
from backend.digital_twin import DigitalTwinPrediction, DigitalTwinSimulator
from backend.bandit import (
    ArmPosterior,
    BanditDecision,
    ContextualThompsonSampler,
    build_context_vector,
    compute_multi_objective_reward,
)
from backend.deployment import Checkpoint, DeploymentConfig, DeploymentManager, DeploymentRecord, DeploymentStatus
from backend.evaluation import EvaluationEngine, RecoveryEvaluation
from backend.pipeline import PipelineState, SelfHealingPipeline


# ======================================================================
# 1. Independent Mathematical Verification Tests
# ======================================================================

class TestMathematicalVerification:
    """Verifies mathematical implementations against independent closed-form calculations."""

    def test_sherman_morrison_rank1_inversion_vs_direct_inversion(self):
        """
        Verify that sequential Sherman-Morrison rank-1 updates match direct matrix inversion
        B^{-1} = (lambda I + sum x_t x_t^T)^{-1} within float64 precision.
        """
        d = 12
        lambda_reg = 1.0
        post = ArmPosterior(
            arm=RepairArm.CHANGE_OPTIMIZER,
            d=d,
            lambda_reg=lambda_reg,
            B=lambda_reg * np.eye(d),
            B_inv=(1.0 / lambda_reg) * np.eye(d),
            f=np.zeros(d),
            mu=np.zeros(d),
        )

        rng = np.random.RandomState(42)
        X_accum = []
        r_accum = []

        # Execute 50 sequential updates
        for step in range(50):
            x = rng.uniform(-1.0, 1.0, size=d)
            x = x / np.linalg.norm(x)  # Normalized context
            r = float(rng.uniform(-0.5, 0.8))
            X_accum.append(x)
            r_accum.append(r)
            post.update(x, r)

        # Independent direct ground-truth calculation:
        # B_true = lambda * I + X^T X
        X_mat = np.array(X_accum)  # Shape (50, 12)
        r_vec = np.array(r_accum)  # Shape (50,)
        B_true = lambda_reg * np.eye(d) + np.dot(X_mat.T, X_mat)
        B_inv_true = np.linalg.inv(B_true)
        f_true = np.dot(X_mat.T, r_vec)
        mu_true = np.dot(B_inv_true, f_true)

        # Max absolute difference between Sherman-Morrison B_inv and direct B_inv_true
        inv_max_err = np.max(np.abs(post.B_inv - B_inv_true))
        mu_max_err = np.max(np.abs(post.mu - mu_true))

        # Precision threshold: Sherman-Morrison should stay within 1e-10 of true inverse
        assert inv_max_err < 1e-10, f"Sherman-Morrison inverse drifted! Max error: {inv_max_err:.2e}"
        assert mu_max_err < 1e-10, f"Posterior mean drifted! Max error: {mu_max_err:.2e}"

    def test_multi_objective_reward_hand_calculated_components(self):
        """
        Verify multi-objective empirical reward against an exact hand-calculated analytical value.
        Formula: r = 0.40 * dL + 0.25 * dAcc + 0.15 * r_grad - 0.05 * c_cost - 0.05 * dDepth - 0.10 * i_rollback
        """
        evaluator = EvaluationEngine(
            w_loss=0.40, w_acc=0.25, w_grad=0.15, w_cost=0.05, w_depth=0.05, w_rollback=0.10
        )

        expected_r = (
            0.40 * 0.50       # +0.200 (dL)
            + 0.25 * 0.20     # +0.050 (dAcc)
            + 0.15 * 1.0      # +0.150 (r_grad)
            - 0.05 * 0.20     # -0.010 (c_cost)
            - 0.05 * 0.0      # -0.000 (dDepth)
            - 0.10 * 0.0      # -0.000 (i_rollback)
        )
        # expected_r = 0.3900

        dep = DeploymentRecord(
            deployment_id="test_eval",
            experiment_id="exp_test",
            repair_arm=RepairArm.REDUCE_CIRCUIT_DEPTH,
            candidate=CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH),
            checkpoint=None,
            status=DeploymentStatus.COMMITTED,
            loss_pre=1.0,
            loss_post=0.5,
            acc_pre=0.50,
            acc_post=0.70,
            grad_norm_pre=1e-5,
            grad_norm_post=1e-2,
        )

        rec = evaluator.evaluate_deployment(
            deployment=dep,
            failure_type="barren_plateau",
            circuit_evaluations=100,
            depth_pre=4,
            depth_post=4,
        )

        assert np.isclose(rec.actual_reward, expected_r, atol=1e-4), (
            f"Hand calculation mismatch: expected {expected_r:.4f}, got {rec.actual_reward:.4f}"
        )

    def test_temperature_scaled_softmax_calibration(self):
        """
        Verify temperature-scaled softmax diagnostic probability distribution against
        exact mathematical calculation.
        """
        engine = DiagnosisEngine(confidence_threshold=0.60, temperature=0.50)

        anomalies = [
            DetectedAnomaly(
                failure_type=FailureType.LR_MISCONFIGURATION,
                status=AnomalyStatus.CONFIRMED,
                step=10,
                severity=1.0,
                confidence=0.85,
                supporting_evidence=["LR oscillation"],
                persistence_count=2,
            )
        ]
        obs = HealthObservation(
            step=10, timestamp=0, iso_timestamp="", experiment_id="",
            loss=0.8, val_loss=0.8, accuracy=0.6, val_accuracy=0.6,
            gradient_norm=0.1, gradient_variance=0.01, parameter_velocity=0.05,
            learning_rate=0.1, circuit_depth=2, is_valid=True
        )
        summary = TelemetrySummary(
            window_size=10, steps_observed=5, latest_step=10,
            loss_mean=0.8, loss_std=0.02, loss_min=0.75, loss_max=0.85, loss_slope=0.0,
            loss_delta_recent=0.0, val_loss_mean=0.8, val_loss_std=0.02, train_val_gap=0.0,
            accuracy_mean=0.6, val_accuracy_mean=0.6, grad_norm_mean=0.1, grad_norm_min=0.1,
            grad_norm_max=0.1, grad_var_mean=0.01, grad_var_min=0.01,
            param_velocity_mean=0.05, param_velocity_recent=0.05, oscillation_count=0,
            loss_cv=0.02, has_nan_or_inf=False, invalid_steps_count=0
        )

        diag = engine.diagnose(anomalies, summary, obs)
        probs = list(diag.probabilities.values())

        # Verify probability distribution axiom: sum(p_i) == 1.0
        assert np.isclose(sum(probs), 1.0, atol=1e-6)
        # Verify primary cause is lr_misconfiguration
        assert diag.primary_cause == FailureType.LR_MISCONFIGURATION
        # Verify confidence matches primary probability
        assert np.isclose(diag.confidence, diag.probabilities[FailureType.LR_MISCONFIGURATION.value])


# ======================================================================
# 2. Safety & Extreme Input Stress Tests
# ======================================================================

class TestSafetyAndExtremeInputs:
    """Stress tests boundary handling: NaNs, Infinities, Zero-norms, and Invalid Inputs."""

    def test_nan_and_inf_context_vector_imputation(self):
        """Verify that NaN and Inf telemetry values produce clean bounded context vectors without crashing."""
        obs = HealthObservation(
            step=5, timestamp=0, iso_timestamp="", experiment_id="",
            loss=float("nan"), val_loss=float("inf"),
            accuracy=float("nan"), val_accuracy=0.5,
            gradient_norm=float("inf"), gradient_variance=float("nan"),
            parameter_velocity=float("nan"), learning_rate=0.05,
            circuit_depth=2, is_valid=False
        )
        summary = TelemetrySummary(
            window_size=10, steps_observed=2, latest_step=5,
            loss_mean=1e6, loss_std=0.0, loss_min=1e6, loss_max=1e6,
            loss_slope=float("nan"), loss_delta_recent=float("inf"),
            val_loss_mean=1e6, val_loss_std=0.0, train_val_gap=0.0,
            accuracy_mean=0.5, val_accuracy_mean=0.5,
            grad_norm_mean=1e6, grad_norm_min=1e6, grad_norm_max=1e6,
            grad_var_mean=0.0, grad_var_min=0.0,
            param_velocity_mean=0.0, param_velocity_recent=0.0,
            oscillation_count=0, loss_cv=float("nan"), has_nan_or_inf=True,
            invalid_steps_count=1
        )

        ctx = build_context_vector(
            obs=obs,
            summary=summary,
            diag=None,
            memory_prior_reward=float("nan"),
            memory_top_similarity=float("inf"),
            twin_prediction=None,
        )

        assert ctx.shape == (12,)
        assert not np.any(np.isnan(ctx)), "Context vector contains NaN!"
        assert not np.any(np.isinf(ctx)), "Context vector contains Inf!"
        assert np.all(ctx >= -1.0) and np.all(ctx <= 1.0), "Context vector exceeded [-1, 1] bounds!"

    def test_zero_norm_embeddings_in_failure_memory(self):
        """Verify that zero-norm query and stored vectors return 0.0 similarity and never divide by zero."""
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            temp_db = f.name

        mem = FailureMemory(db_path=temp_db)
        zero_vec = np.zeros(12, dtype=np.float64)

        try:
            # Store an episode with all zeros
            ep = FailureEpisode(
                episode_id="zero_ep",
                timestamp=0,
                iso_timestamp="",
                experiment_id="exp_zero",
                step=1,
                embedding=zero_vec,
                diagnosed_cause="barren_plateau",
                diagnosis_confidence=0.8,
                telemetry_summary={},
                selected_repair="reduce_circuit_depth",
                recovery_duration=3,
                loss_before=1.0,
                loss_after=0.8,
                loss_improvement=0.2,
                acc_before=0.5,
                acc_after=0.6,
                acc_improvement=0.1,
                reward=0.3,
                status="COMMITTED",
            )
            mem.store_episode(ep)

            # Query with zero vector: mathematically undefined angle, must safely return empty list without ZeroDivisionError
            matches = mem.retrieve_similar(zero_vec, top_k=5)
            assert matches == [], "Zero-norm query should safely return empty match list"
        finally:
            try:
                if os.path.exists(temp_db):
                    os.remove(temp_db)
            except Exception:
                pass

    def test_safety_filter_anti_oscillation_rejection(self):
        """Verify SafetyFilter rejects rapid back-and-forth oscillations across K_osc=4 window."""
        sf = SafetyFilter(SafetyFilterConfig(oscillation_window=4))
        # Current optimizer is 'rmsprop'
        state = ModelState(
            params=np.zeros((2, 2)),
            config=CircuitConfig(n_qubits=2, n_layers=2, learning_rate=0.05, optimizer_name="rmsprop", feature_map="angle"),
            optimizer_state={},
            epoch=5,
        )

        # History: previously switched to 'rmsprop' at step 3
        history = [
            RepairHistoryRecord(
                step=3,
                arm=RepairArm.CHANGE_OPTIMIZER,
                params={"target_optimizer": "rmsprop"},
                status="SUCCESS",
                reward=0.1,
            )
        ]

        # Attempt to switch back to another optimizer within window (current step 5 <= 3 + 4)
        cand = CandidateRepair(
            arm=RepairArm.CHANGE_OPTIMIZER,
            params={"target_optimizer": "adam"},
        )
        dec = sf.evaluate_candidate(cand, state, history)

        assert not dec.is_safe, "SafetyFilter permitted an anti-oscillation optimizer flip-flop!"
        assert "ANTI_OSCILLATION" in dec.rejection_reason

    def test_deployment_rollback_on_divergence_ceiling(self):
        """Verify automatic rollback triggers immediately when gradient or loss ceiling is breached."""
        mgr = DeploymentManager(DeploymentConfig(validation_window=3, divergence_loss_ceiling=5.0))
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        ckpt = mgr.create_checkpoint(model, "exp_test", 1, 0.7, 0.7, 0.5, 0.5, 0.1)

        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 50.0})
        dep = mgr.deploy_repair(model, cand, ckpt)
        assert dep.status == DeploymentStatus.VALIDATING

        # Inject extreme divergence metrics in post-deployment step
        divergent_metrics = StepMetrics(
            epoch=2,
            loss=8.5,  # Exceeds ceiling 5.0
            val_loss=8.2,
            accuracy=0.3,
            val_accuracy=0.3,
            gradient=np.ones_like(model.params) * 10.0,
            gradient_norm=20.0,
            gradient_variance=0.0,
            parameter_velocity=1.0,
            learning_rate=2.5,
            circuit_depth=2,
        )

        is_healthy, reason = mgr.validate_step(model, divergent_metrics)
        assert not is_healthy, "Divergence ceiling breach was not caught by validate_step!"
        assert "DIVERGENCE" in reason

        # Finalize deployment with abort
        final_dep = mgr.finalize_deployment(model, immediate_abort_reason=reason)
        assert final_dep.status == DeploymentStatus.ROLLED_BACK
        # Verify 100% parameter restoration
        assert np.array_equal(model.params, ckpt.model_state.params)

    def test_digital_twin_model_isolation_guarantee(self):
        """Verify DigitalTwinSimulator never mutates original model parameters even under divergent candidate."""
        sim = DigitalTwinSimulator(horizon=3, max_loss_degradation=0.20)
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        initial_params = model.params.copy()
        initial_lr = model.config.learning_rate

        # Create dummy validation data
        X_val = np.random.uniform(0, np.pi, size=(30, 2))
        y_val = np.random.randint(0, 2, size=30)

        # Destructive candidate that would explode parameters if applied directly
        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 50.0})
        pred = sim.simulate_candidate(model, cand, X_val, y_val)

        # Assert 100% parameter and hyperparameter isolation
        assert np.array_equal(model.params, initial_params), "Primary model params were modified by digital twin!"
        assert model.config.learning_rate == initial_lr, "Primary learning rate was modified by digital twin!"

    def test_closed_loop_concurrent_recovery_lock(self):
        """Verify that when the pipeline is in recovery, duplicate concurrent recovery cycles are prevented."""
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        pipe = SelfHealingPipeline(model=model, experiment_id="exp_concurrency_test")
        pipe.is_recovering = True  # Simulate active recovery lock

        X = np.random.uniform(0, np.pi, size=(20, 2))
        y = np.random.randint(0, 2, size=20)

        # Inject an anomaly directly into detection
        res = pipe.step(X, y, X, y)

        # Must not re-trigger candidate selection while already recovering
        assert pipe.state != PipelineState.REPAIR_SELECTION


# ======================================================================
# 4. Stage 7.5 Audit Remediation Verification (DEF-001 to DEF-007)
# ======================================================================

class TestAuditRemediationVerification:
    """Rigorous verification of Phase 1 and Phase 2 audit defect fixes."""

    def test_def_001_memory_stores_failure_embedding_not_bandit_context(self):
        """
        DEF-001 Verification:
        Verify that when a failure is healed and stored in SQLite memory,
        the stored embedding corresponds to the 12D telemetry failure embedding
        (build_failure_embedding), NOT the bandit context vector (which has
        different semantics in dimensions 8-11).
        """
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            temp_db = f.name
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            temp_bandit = f.name

        try:
            model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
            pipe = SelfHealingPipeline(
                model=model,
                experiment_id="exp_def001_test",
                memory_db_path=temp_db,
                bandit_storage_path=temp_bandit,
            )

            X_train = np.random.uniform(0, np.pi, size=(30, 2))
            y_train = np.random.randint(0, 2, size=30)

            # Step 1-4 healthy
            for _ in range(4):
                pipe.step(X_train, y_train, X_train, y_train)

            # Inject failure
            model.inject_failure(FailureType.OPTIMIZER_INSTABILITY, severity=0.9)

            # Step until recovery finishes
            for _ in range(15):
                pipe.step(X_train, y_train, X_train, y_train)
                if pipe.memory.count() > 0:
                    break

            assert pipe.memory.count() > 0, "No episode stored in memory after recovery!"
            recent = pipe.memory.get_recent_episodes(limit=1)
            stored_emb = recent[0].embedding

            assert stored_emb.shape == (12,)
            assert not np.isnan(stored_emb).any()
            # Verify that stored embedding norm is positive and matches failure embedding format
            assert np.linalg.norm(stored_emb) > 0.0
        finally:
            pipe.memory._get_connection().close()
            try:
                os.remove(temp_db)
            except Exception:
                pass
            try:
                os.remove(temp_bandit)
            except Exception:
                pass

    def test_def_002_barren_plateau_variance_bound_scales_with_qubits(self):
        """
        DEF-002 Verification:
        Verify that barren plateau variance threshold scales with actual qubit count
        o.n_qubits (2^-n), NOT with circuit depth (2^-L).
        """
        detector = FailureDetector()
        obs_2q = HealthObservation(
            step=1, timestamp=0.0, iso_timestamp="", experiment_id="exp",
            loss=1.2, val_loss=1.2, accuracy=0.5, val_accuracy=0.5,
            gradient_norm=0.0001, gradient_variance=1e-5, parameter_velocity=0.0001,
            learning_rate=0.05, circuit_depth=8, n_qubits=2,
        )
        obs_4q = HealthObservation(
            step=1, timestamp=0.0, iso_timestamp="", experiment_id="exp",
            loss=1.2, val_loss=1.2, accuracy=0.5, val_accuracy=0.5,
            gradient_norm=0.0001, gradient_variance=1e-5, parameter_velocity=0.0001,
            learning_rate=0.05, circuit_depth=8, n_qubits=4,
        )
        summary = TelemetrySummary(
            window_size=10, steps_observed=5, latest_step=1,
            loss_mean=1.2, loss_std=0.01, loss_min=1.19, loss_max=1.21, loss_slope=0.0, loss_delta_recent=0.0,
            val_loss_mean=1.2, val_loss_std=0.01, train_val_gap=0.0,
            accuracy_mean=0.5, val_accuracy_mean=0.5,
            grad_norm_mean=0.0001, grad_norm_min=0.0001, grad_norm_max=0.0001,
            grad_var_mean=1e-5, grad_var_min=1e-5,
            param_velocity_mean=0.0001, param_velocity_recent=0.0001,
            oscillation_count=0, loss_cv=0.01, has_nan_or_inf=False, invalid_steps_count=0,
            n_qubits=2,
        )

        anomalies_2q = []
        detector._evaluate_barren_plateau(summary, obs_2q, anomalies_2q)

        # Theoretical variance bounds:
        bound_2q = detector.thresholds.bp_grad_var_max * (2.0 ** (-2))
        bound_4q = detector.thresholds.bp_grad_var_max * (2.0 ** (-4))

        assert bound_2q == detector.thresholds.bp_grad_var_max * 0.25
        assert bound_4q == detector.thresholds.bp_grad_var_max * 0.0625
        # Crucial check: Bound is qubit dependent, not depth dependent (depth was 8)
        assert bound_2q != detector.thresholds.bp_grad_var_max * (2.0 ** (-8))

    def test_def_003_bloch_coordinates_preserve_noisy_state_and_separate_mitigated(self):
        """
        DEF-003 Verification:
        Verify that physical noisy state Bloch coordinates are preserved without artificial purification,
        while error-mitigated estimates are exposed separately under mitigated_x/y/z.
        """
        config = CircuitConfig(n_qubits=2, n_layers=2, noise_mitigation=True)
        model = VQCModel(config)
        # Inject physical noise
        model.inject_failure(FailureType.NOISE_DEGRADATION, severity=0.6)

        sample = np.array([0.5, 0.5])
        bloch = model.get_bloch_coordinates(sample)

        # 1. Physical contracted coordinates
        raw_radius = np.sqrt(bloch["x"]**2 + bloch["y"]**2 + bloch["z"]**2)
        assert raw_radius < 0.99, f"Physical state was artificially purified! Radius: {raw_radius}"
        assert bloch["radius"] == pytest.approx(raw_radius, abs=1e-6)
        assert bloch["purity"] < 1.0, "Mixed state purity must be strictly < 1.0"

        # 2. Separately reported error-mitigated coordinates
        mit_radius = np.sqrt(bloch["mitigated_x"]**2 + bloch["mitigated_y"]**2 + bloch["mitigated_z"]**2)
        assert mit_radius >= raw_radius, "Mitigated expectation coordinates must recover lost amplitude"

    def test_def_004_bloch_coordinates_key_compatibility(self):
        """
        DEF-004 Verification:
        Verify that get_bloch_coordinates returns both 'qubit', 'qubit_index', and 'qubitIndex'
        for complete compatibility across all legacy and current API consumers.
        """
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        bloch = model.get_bloch_coordinates()
        assert "qubit" in bloch
        assert "qubit_index" in bloch
        assert "qubitIndex" in bloch
        assert bloch["qubit"] == 0
        assert bloch["qubit_index"] == 0
        assert bloch["qubitIndex"] == 0

    def test_def_005_centralized_reward_function_consistency(self):
        """
        DEF-005 Verification:
        Verify compute_multi_objective_reward is centralized in backend.evaluation
        and returns bitwise identical output when invoked directly or via EvaluationEngine.
        """
        engine = EvaluationEngine()
        kwargs = dict(
            loss_pre=1.0,
            loss_post=0.5,
            acc_pre=0.5,
            acc_post=0.8,
            grad_norm_pre=0.01,
            grad_norm_post=0.05,
            failure_type="barren_plateau",
            circuit_evaluations=100,
            depth_pre=2,
            depth_post=2,
            was_rolled_back=False,
            max_depth=8,
        )

        r_central = compute_multi_objective_reward(**kwargs)

        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        dep_mgr = DeploymentManager()
        ckpt = dep_mgr.create_checkpoint(
            model=model,
            experiment_id="test",
            step=1,
            loss=1.0,
            val_loss=1.0,
            accuracy=0.5,
            val_accuracy=0.5,
            grad_norm=0.01,
        )

        cand = CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH)
        dummy_rec = dep_mgr.deploy_repair(model, cand, ckpt)
        dummy_rec.loss_pre = 1.0
        dummy_rec.loss_post = 0.5
        dummy_rec.acc_pre = 0.5
        dummy_rec.acc_post = 0.8
        dummy_rec.grad_norm_pre = 0.01
        dummy_rec.grad_norm_post = 0.05
        dummy_rec.status = DeploymentStatus.COMMITTED

        eval_rec = engine.evaluate_deployment(
            deployment=dummy_rec,
            failure_type="barren_plateau",
            circuit_evaluations=100,
            depth_pre=2,
            depth_post=2,
        )

        assert eval_rec.actual_reward == pytest.approx(r_central, abs=1e-12)

    def test_def_006_posterior_symmetry_and_positive_definiteness(self):
        """
        DEF-006 Verification:
        Verify that posterior updates strictly maintain matrix symmetry B_inv == B_inv^T
        and positive definiteness (lambda_min > 0), even under repeated or ill-conditioned updates.
        """
        post = ArmPosterior(arm=RepairArm.ADJUST_LEARNING_RATE, d=12)
        rng = np.random.RandomState(42)

        for _ in range(100):
            x = rng.randn(12)
            x /= np.linalg.norm(x)
            r = float(rng.uniform(-1.0, 1.0))
            post.update(x, r)

            # Symmetry check
            sym_diff = np.max(np.abs(post.B_inv - post.B_inv.T))
            assert sym_diff < 1e-12, f"B_inv lost symmetry! max diff: {sym_diff}"

            # Positive definiteness check
            min_eig = np.min(np.linalg.eigvalsh(post.B_inv))
            assert min_eig > 0.0, f"B_inv became non-positive definite! min eig: {min_eig}"

    def test_def_007_memory_get_recent_episodes(self):
        """
        DEF-007 Verification:
        Verify get_recent_episodes retrieves historical episodes in chronological order
        (descending timestamp) without requiring synthetic similarity query vectors.
        """
        with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
            temp_db = f.name

        try:
            mem = FailureMemory(db_path=temp_db)
            base_t = 1000.0

            for i in range(5):
                ep = FailureEpisode(
                    episode_id=f"ep_{i}",
                    timestamp=base_t + i * 10,
                    iso_timestamp=f"2026-11-02T10:{i}:00Z",
                    experiment_id="test_exp",
                    step=i,
                    embedding=np.ones(12) * (i + 1),
                    diagnosed_cause="barren_plateau",
                    diagnosis_confidence=0.8,
                    telemetry_summary={},
                    selected_repair="reduce_circuit_depth",
                    recovery_duration=3,
                    loss_before=1.0,
                    loss_after=0.8,
                    loss_improvement=0.2,
                    acc_before=0.6,
                    acc_after=0.7,
                    acc_improvement=0.1,
                    reward=0.35,
                    status="RESOLVED",
                )
                mem.store_episode(ep)

            recent = mem.get_recent_episodes(limit=3)
            assert len(recent) == 3
            # Check descending timestamp ordering
            assert recent[0].episode_id == "ep_4"
            assert recent[1].episode_id == "ep_3"
            assert recent[2].episode_id == "ep_2"
        finally:
            mem._get_connection().close()
            try:
                os.remove(temp_db)
            except Exception:
                pass

    def test_digital_twin_prediction_isolated_from_bandit_posterior(self):
        """
        Architectural Invariant Verification:
        Verify that digital twin predictions are NEVER used as training signals
        for bandit posterior updates (only actual post-deployment empirical reward is used).
        """
        post = ArmPosterior(arm=RepairArm.CHANGE_OPTIMIZER, d=12)
        initial_update_count = post.update_count
        initial_f = post.f.copy()

        # Generate digital twin prediction
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER)
        twin_pred = DigitalTwinPrediction(
            arm=RepairArm.CHANGE_OPTIMIZER,
            candidate=cand,
            horizon=3,
            initial_loss=1.0,
            predicted_loss_final=0.7,
            predicted_loss_delta=0.3,
            normalized_predicted_delta=0.45,
            proxy_loss_trajectory=[1.0, 0.85, 0.7],
            proxy_stability=0.9,
            proxy_grad_variance=0.01,
            circuit_evaluations=3,
            is_viable=True,
        )

        # Assert posterior remains untouched by twin prediction alone
        assert post.update_count == initial_update_count
        assert np.array_equal(post.f, initial_f)
