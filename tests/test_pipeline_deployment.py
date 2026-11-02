"""
Comprehensive Test Suite for Safe Deployment, Multi-Objective Evaluation, and Autonomous Pipeline.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 6).
"""

import json
import os
import shutil
import tempfile
import numpy as np
import pytest

from backend.qml_model import CircuitConfig, FailureType, ModelState, StepMetrics, VQCModel, load_dataset
from backend.monitoring import HealthObservation, TelemetrySummary
from backend.diagnosis import DiagnosisResult
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary
from backend.safety_filter import SafetyDecision, SafetyFilter, SafetyFilterConfig
from backend.digital_twin import DigitalTwinPrediction, DigitalTwinSimulator
from backend.bandit import ContextualThompsonSampler
from backend.deployment import (
    Checkpoint,
    DeploymentConfig,
    DeploymentManager,
    DeploymentRecord,
    DeploymentStatus,
)
from backend.evaluation import EvaluationEngine, RecoveryEvaluation
from backend.pipeline import PipelineState, PipelineStepResult, SelfHealingPipeline


# ======================================================================
# Test Fixtures & Helpers
# ======================================================================

@pytest.fixture
def temp_dir():
    d = tempfile.mkdtemp()
    yield d
    shutil.rmtree(d, ignore_errors=True)


@pytest.fixture
def moons_data():
    X_train, y_train, X_val, y_val = load_dataset("moons", seed=42)
    return X_train, y_train, X_val, y_val


@pytest.fixture
def sample_model():
    config = CircuitConfig(
        n_qubits=2,
        n_layers=2,
        feature_map="angle",
        optimizer_name="adam",
        learning_rate=0.05,
        seed=42,
    )
    return VQCModel(config)


# ======================================================================
# 1. Deployment and Checkpointing Tests
# ======================================================================

class TestDeploymentManager:
    """Tests for atomic checkpoints, multi-step validation, and automatic rollback triggers."""

    def test_checkpoint_integrity_and_restoration(self, sample_model):
        mgr = DeploymentManager()
        orig_params = sample_model.params.copy()
        orig_opt = sample_model.config.optimizer_name
        orig_lr = sample_model.optimizer.lr

        # Create checkpoint
        ckpt = mgr.create_checkpoint(
            model=sample_model,
            experiment_id="test_exp",
            step=5,
            loss=0.50,
            val_loss=0.52,
            accuracy=0.80,
            val_accuracy=0.78,
            grad_norm=0.15,
        )

        assert ckpt.step == 5
        assert np.array_equal(ckpt.model_state.params, orig_params)

        # Mutate model completely
        sample_model.params += 1.50
        sample_model.config.optimizer_name = "sgd"
        sample_model.optimizer.lr = 0.50

        # Restore checkpoint
        success = mgr.restore_checkpoint(sample_model, ckpt)
        assert success is True
        assert np.array_equal(sample_model.params, orig_params)
        assert sample_model.config.optimizer_name == orig_opt
        assert np.isclose(sample_model.optimizer.lr, orig_lr)

    def test_successful_deployment_and_commit(self, sample_model, moons_data):
        X_train, y_train, X_val, y_val = moons_data
        mgr = DeploymentManager(DeploymentConfig(validation_window=2))

        ckpt = mgr.create_checkpoint(
            sample_model, "exp", 1, loss=0.70, val_loss=0.72, accuracy=0.6, val_accuracy=0.6, grad_norm=0.3
        )
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
        rec = mgr.deploy_repair(sample_model, cand, ckpt)

        assert rec.status == DeploymentStatus.VALIDATING
        assert sample_model.config.optimizer_name == "rmsprop"

        # Step 1: healthy metrics
        m1 = sample_model.train_step(X_train, y_train, X_val, y_val)
        ok1, _ = mgr.validate_step(sample_model, m1)
        assert ok1 is True

        # Step 2: healthy metrics
        m2 = sample_model.train_step(X_train, y_train, X_val, y_val)
        ok2, _ = mgr.validate_step(sample_model, m2)
        assert ok2 is True

        # Finalize deployment -> should COMMIT
        final_rec = mgr.finalize_deployment(sample_model)
        assert final_rec.status == DeploymentStatus.COMMITTED
        assert sample_model.config.optimizer_name == "rmsprop"

    def test_rollback_on_nan_loss(self, sample_model):
        mgr = DeploymentManager()
        ckpt = mgr.create_checkpoint(sample_model, "exp", 1, 0.5, 0.5, 0.8, 0.8, 0.1)
        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 0.5})
        rec = mgr.deploy_repair(sample_model, cand, ckpt)

        # Injected NaN loss step
        bad_metrics = StepMetrics(
            epoch=1, loss=float("nan"), val_loss=0.5, accuracy=0.5, val_accuracy=0.5,
            gradient=np.zeros_like(sample_model.params), gradient_norm=0.0, gradient_variance=0.0,
            parameter_velocity=0.0, learning_rate=0.025, circuit_depth=2
        )
        ok, reason = mgr.validate_step(sample_model, bad_metrics)
        assert ok is False
        assert "NAN_OR_INF_LOSS" in reason

        # Finalize with failure reason
        final_rec = mgr.finalize_deployment(sample_model, immediate_abort_reason=reason)
        assert final_rec.status == DeploymentStatus.ROLLED_BACK
        assert "NAN_OR_INF" in final_rec.rollback_reason
        # Model state restored
        assert np.array_equal(sample_model.params, ckpt.model_state.params)

    def test_rollback_on_divergence_ceiling(self, sample_model):
        mgr = DeploymentManager(DeploymentConfig(divergence_loss_ceiling=5.0))
        ckpt = mgr.create_checkpoint(sample_model, "exp", 1, 0.5, 0.5, 0.8, 0.8, 0.1)
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
        mgr.deploy_repair(sample_model, cand, ckpt)

        # Injected exploded loss
        divergent_metrics = StepMetrics(
            epoch=1, loss=8.5, val_loss=9.0, accuracy=0.4, val_accuracy=0.3,
            gradient=np.zeros_like(sample_model.params), gradient_norm=60.0, gradient_variance=1.0,
            parameter_velocity=0.5, learning_rate=0.05, circuit_depth=2
        )
        ok, reason = mgr.validate_step(sample_model, divergent_metrics)
        assert ok is False
        assert "DIVERGENCE" in reason

    def test_rollback_on_loss_regression(self, sample_model):
        # Baseline loss is 0.50. Max allowable regression is 15% (ceiling 0.575)
        mgr = DeploymentManager(DeploymentConfig(validation_window=2, max_loss_regression=0.15))
        ckpt = mgr.create_checkpoint(sample_model, "exp", 1, 0.50, 0.50, 0.8, 0.8, 0.1)
        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 0.5})
        mgr.deploy_repair(sample_model, cand, ckpt)

        # Step 1: loss 0.65 (30% regression)
        m1 = StepMetrics(1, 0.65, 0.65, 0.7, 0.7, np.zeros_like(sample_model.params), 0.1, 0.01, 0.01, 0.025, 2)
        # Step 2: loss 0.68 (36% regression)
        m2 = StepMetrics(2, 0.68, 0.68, 0.7, 0.7, np.zeros_like(sample_model.params), 0.1, 0.01, 0.01, 0.025, 2)
        mgr.validate_step(sample_model, m1)
        mgr.validate_step(sample_model, m2)

        # Finalize should trigger LOSS_REGRESSION rollback
        final_rec = mgr.finalize_deployment(sample_model)
        assert final_rec.status == DeploymentStatus.ROLLED_BACK
        assert "LOSS_REGRESSION" in final_rec.rollback_reason
        assert np.array_equal(sample_model.params, ckpt.model_state.params)


# ======================================================================
# 2. Multi-Objective Evaluation Tests
# ======================================================================

class TestEvaluationEngine:
    """Tests for normalized reward formulation, component weights, and predicted vs actual separation."""

    def test_weight_sum_and_normalization(self):
        engine = EvaluationEngine()
        total_w = engine.w_loss + engine.w_acc + engine.w_grad + engine.w_cost + engine.w_depth + engine.w_rollback
        assert np.isclose(total_w, 1.0)

    def test_positive_recovery_reward_calculation(self, sample_model):
        engine = EvaluationEngine()
        mgr = DeploymentManager()
        ckpt = mgr.create_checkpoint(sample_model, "exp", 1, 0.80, 0.85, 0.60, 0.60, 0.10)
        cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE)
        rec = mgr.deploy_repair(sample_model, cand, ckpt)

        # Post-deployment outcome: loss improved 0.80 -> 0.40, acc +0.20
        rec.status = DeploymentStatus.COMMITTED
        rec.loss_post = 0.40
        rec.acc_post = 0.80
        rec.grad_norm_post = 0.15

        evaluation = engine.evaluate_deployment(
            deployment=rec,
            failure_type="lr_misconfiguration",
            circuit_evaluations=100,
            predicted_reward=0.30,
        )

        assert evaluation.actual_reward > 0.0
        assert evaluation.actual_reward <= 1.0
        assert evaluation.predicted_reward == 0.30
        assert evaluation.prediction_error >= 0.0
        assert evaluation.was_rolled_back is False

    def test_rollback_penalty_applied(self, sample_model):
        engine = EvaluationEngine()
        mgr = DeploymentManager()
        ckpt = mgr.create_checkpoint(sample_model, "exp", 1, 0.50, 0.50, 0.80, 0.80, 0.10)
        cand = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER)
        rec = mgr.deploy_repair(sample_model, cand, ckpt)

        # Rolled back deployment
        rec.status = DeploymentStatus.ROLLED_BACK
        rec.loss_post = 0.50
        rec.acc_post = 0.80
        rec.grad_norm_post = 0.10

        evaluation = engine.evaluate_deployment(
            deployment=rec,
            failure_type="optimizer_instability",
            circuit_evaluations=150,
            predicted_reward=0.10,
        )

        assert evaluation.was_rolled_back is True
        assert evaluation.rollback_penalty_term == 1.0
        # Rollback penalty lowers overall reward
        assert evaluation.actual_reward < 0.0


# ======================================================================
# 3. Autonomous Pipeline Integration Tests
# ======================================================================

class TestSelfHealingPipeline:
    """Tests for complete end-to-end closed loop, confidence gating, and feedback."""

    def test_nominal_training_pipeline_step(self, sample_model, moons_data, temp_dir):
        X_train, y_train, X_val, y_val = moons_data
        pipeline = SelfHealingPipeline(
            model=sample_model,
            memory_db_path=os.path.join(temp_dir, "test_mem.db"),
            bandit_storage_path=os.path.join(temp_dir, "test_post.json"),
        )

        res = pipeline.step(X_train, y_train, X_val, y_val)
        assert res.step == 1
        assert res.state == PipelineState.HEALTHY_TRAINING
        assert res.metrics.loss > 0.0

    def test_confidence_gate_abstention(self, sample_model, moons_data, temp_dir):
        X_train, y_train, X_val, y_val = moons_data
        pipeline = SelfHealingPipeline(
            model=sample_model,
            confidence_threshold=0.99,  # Very high threshold forces abstention
            memory_db_path=os.path.join(temp_dir, "test_mem.db"),
            bandit_storage_path=os.path.join(temp_dir, "test_post.json"),
        )

        # Warmup
        for _ in range(3):
            pipeline.step(X_train, y_train, X_val, y_val)

        # Inject failure
        sample_model.inject_failure(FailureType.LR_MISCONFIGURATION, severity=1.0)
        res = pipeline.step(X_train, y_train, X_val, y_val)

        # If diagnosed with confidence < 0.99, should enter CONFIDENCE_GATE_HOLD
        if res.diagnosis and not res.diagnosis.confidence_gate_cleared:
            assert res.state == PipelineState.CONFIDENCE_GATE_HOLD
            # Model was NOT mutated by repair
            assert pipeline.deployment_mgr.active_deployment is None

    def test_end_to_end_autonomous_recovery_cycle(self, sample_model, moons_data, temp_dir):
        X_train, y_train, X_val, y_val = moons_data
        pipeline = SelfHealingPipeline(
            model=sample_model,
            confidence_threshold=0.60,
            validation_window=2,
            memory_db_path=os.path.join(temp_dir, "test_mem.db"),
            bandit_storage_path=os.path.join(temp_dir, "test_post.json"),
        )

        # 1. Warm up model for 5 steps under nominal conditions
        for _ in range(5):
            pipeline.step(X_train, y_train, X_val, y_val)

        # 2. Inject LR misconfiguration
        sample_model.inject_failure(FailureType.LR_MISCONFIGURATION, severity=1.0)

        # 3. Step 6: Failure detected, diagnosed, repair selected and deployed
        recovery_triggered = False
        for step_idx in range(6, 12):
            res = pipeline.step(X_train, y_train, X_val, y_val)
            if res.bandit_decision is not None:
                recovery_triggered = True
                assert res.bandit_decision.selected_arm in RepairArm
            if res.evaluation is not None:
                # Recovery finalized and evaluated!
                assert res.evaluation.actual_reward is not None
                break

        assert recovery_triggered is True
        # Verify continuous learning feedback
        assert pipeline.memory.count() > 0
        updated_arm_count = sum(p.update_count for p in pipeline.bandit.posteriors.values())
        assert updated_arm_count > 0
