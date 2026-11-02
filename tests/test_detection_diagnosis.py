"""
Unit and Integration Tests for Telemetry Monitoring, Failure Detection, and Root-Cause Diagnosis.
Stage 3 Verification Suite.
"""

import pytest
import numpy as np

from backend.qml_model import VQCModel, CircuitConfig, FailureType, load_dataset, StepMetrics
from backend.monitoring import HealthMonitor, HealthObservation, TelemetrySummary
from backend.detection import FailureDetector, DetectionThresholds, AnomalyStatus, DetectedAnomaly
from backend.diagnosis import DiagnosisEngine, DiagnosisResult


@pytest.fixture
def dataset():
    return load_dataset("moons", train_ratio=0.7, seed=42)


@pytest.fixture
def nominal_model():
    config = CircuitConfig(n_qubits=2, n_layers=2, learning_rate=0.08, seed=42)
    return VQCModel(config)


class TestHealthMonitoring:
    """Verify continuous telemetry extraction, sliding window aggregation, and NaN/Inf handling."""

    def test_nominal_step_recording(self, nominal_model, dataset):
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5, experiment_id="test_exp")

        for _ in range(5):
            metrics = nominal_model.train_step(X_train, y_train, X_val, y_val)
            obs = monitor.record_step(metrics)
            assert obs.is_valid is True
            assert obs.loss > 0.0
            assert obs.gradient_norm > 0.0

        summary = monitor.get_summary()
        assert summary.steps_observed == 5
        assert summary.loss_mean > 0.0
        assert summary.has_nan_or_inf is False
        assert summary.oscillation_count >= 0

    def test_nan_and_inf_telemetry_safety(self):
        monitor = HealthMonitor(window_size=5)

        # Inject StepMetrics with NaN loss
        dummy_metrics_nan = StepMetrics(
            epoch=1,
            loss=float("nan"),
            val_loss=0.5,
            accuracy=0.5,
            val_accuracy=0.5,
            gradient=np.array([0.1, 0.1]),
            gradient_norm=float("inf"),
            gradient_variance=0.01,
            parameter_velocity=0.01,
            learning_rate=0.05,
            circuit_depth=2,
        )

        obs = monitor.record_step(dummy_metrics_nan)
        assert obs.is_valid is False
        assert "NAN_LOSS" in obs.error_flags
        assert "INVALID_GRAD_NORM" in obs.error_flags

        summary = monitor.get_summary()
        assert summary.has_nan_or_inf is True
        assert summary.invalid_steps_count == 1


class TestFailureDetectionCategories:
    """Verify that every supported failure category is reliably detected under controlled injection."""

    def test_normal_training_no_false_alarm(self, nominal_model, dataset):
        """Under normal training, no failure should be confirmed."""
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5)
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        for _ in range(6):
            metrics = nominal_model.train_step(X_train, y_train, X_val, y_val)
            obs = monitor.record_step(metrics)
            summary = monitor.get_summary()
            anomalies = detector.evaluate(summary, obs)
            diag = diagnosis_engine.diagnose(anomalies, summary, obs)

            # Confirm no false positive repair triggering
            confirmed = [a for a in anomalies if a.status == AnomalyStatus.CONFIRMED]
            assert len(confirmed) == 0, f"False positive confirmed anomaly: {confirmed}"
            assert diag.confidence_gate_cleared is False

    def test_detect_training_divergence(self, nominal_model, dataset):
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5)
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        # Step normally
        metrics = nominal_model.train_step(X_train, y_train, X_val, y_val)
        monitor.record_step(metrics)

        # Inject Training Divergence
        nominal_model.inject_failure(FailureType.TRAINING_DIVERGENCE, severity=1.0)
        metrics = nominal_model.train_step(X_train, y_train, X_val, y_val)
        obs = monitor.record_step(metrics)
        summary = monitor.get_summary()

        anomalies = detector.evaluate(summary, obs)
        diag = diagnosis_engine.diagnose(anomalies, summary, obs)

        types_detected = [a.failure_type for a in anomalies]
        assert FailureType.TRAINING_DIVERGENCE in types_detected
        assert diag.primary_cause == FailureType.TRAINING_DIVERGENCE
        assert diag.confidence >= 0.60
        assert diag.confidence_gate_cleared is True

    def test_detect_barren_plateau_synth(self, nominal_model, dataset):
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5)
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        # Step 1-2 normally
        for _ in range(2):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            monitor.record_step(m)

        # Inject Barren Plateau
        nominal_model.inject_failure(FailureType.BARREN_PLATEAU, mode="default")

        for _ in range(2):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            obs = monitor.record_step(m)
            summary = monitor.get_summary()
            anomalies = detector.evaluate(summary, obs)

        diag = diagnosis_engine.diagnose(anomalies, summary, obs)
        assert any(a.failure_type == FailureType.BARREN_PLATEAU for a in anomalies)
        assert diag.primary_cause == FailureType.BARREN_PLATEAU
        assert diag.confidence >= 0.60
        assert diag.confidence_gate_cleared is True

    def test_detect_lr_misconfiguration(self, nominal_model, dataset):
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5)
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        # Step normally
        for _ in range(2):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            monitor.record_step(m)

        # Inject LR Misconfiguration (large LR causing oscillatory jumps)
        nominal_model.inject_failure(FailureType.LR_MISCONFIGURATION, severity=1.0)

        for _ in range(3):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            obs = monitor.record_step(m)
            summary = monitor.get_summary()
            anomalies = detector.evaluate(summary, obs)

        diag = diagnosis_engine.diagnose(anomalies, summary, obs)
        assert any(a.failure_type == FailureType.LR_MISCONFIGURATION for a in anomalies)
        assert diag.primary_cause == FailureType.LR_MISCONFIGURATION
        assert diag.confidence >= 0.60

    def test_detect_noise_degradation(self, nominal_model, dataset):
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5)
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        # Step normally
        for _ in range(2):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            monitor.record_step(m)

        # Inject Noise Degradation
        nominal_model.inject_failure(FailureType.NOISE_DEGRADATION, severity=2.0)

        detected_noise_anomalies = []
        for _ in range(4):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            obs = monitor.record_step(m)
            summary = monitor.get_summary()
            anomalies = detector.evaluate(summary, obs)
            noise_hits = [a for a in anomalies if a.failure_type == FailureType.NOISE_DEGRADATION]
            if noise_hits:
                detected_noise_anomalies.extend(noise_hits)
                diag = diagnosis_engine.diagnose(noise_hits, summary, obs)
                assert diag.primary_cause == FailureType.NOISE_DEGRADATION
                assert diag.confidence >= 0.60

        assert len(detected_noise_anomalies) > 0, "Noise degradation was not detected across 4 steps"

    def test_detect_persistent_plateau(self, nominal_model, dataset):
        X_train, y_train, X_val, y_val = dataset
        monitor = HealthMonitor(window_size=5)
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        # Inject persistent plateau (loss stalls, gradient active)
        nominal_model.inject_failure(FailureType.PERSISTENT_PLATEAU)

        for _ in range(4):
            m = nominal_model.train_step(X_train, y_train, X_val, y_val)
            obs = monitor.record_step(m)
            summary = monitor.get_summary()
            anomalies = detector.evaluate(summary, obs)

        diag = diagnosis_engine.diagnose(anomalies, summary, obs)
        assert any(a.failure_type == FailureType.PERSISTENT_PLATEAU for a in anomalies)
        assert diag.primary_cause == FailureType.PERSISTENT_PLATEAU


class TestDiagnosisAndConfidenceGating:
    """Verify confidence gating, safe abstention, and handling of ambiguous signals."""

    def test_confidence_gate_abstention_on_weak_signal(self):
        """When an anomaly is only weakly suspected (not confirmed), confidence gate must hold."""
        engine = DiagnosisEngine(confidence_threshold=0.60)

        dummy_obs = HealthObservation(
            step=3,
            timestamp=100.0,
            iso_timestamp="2026-03-02T12:00:00Z",
            experiment_id="test",
            loss=0.52,
            val_loss=0.55,
            accuracy=0.65,
            val_accuracy=0.60,
            gradient_norm=0.04,
            gradient_variance=0.001,
            parameter_velocity=0.01,
            learning_rate=0.05,
            circuit_depth=2,
        )

        dummy_summary = TelemetrySummary(
            window_size=5,
            steps_observed=3,
            latest_step=3,
            loss_mean=0.53, loss_std=0.03, loss_min=0.50, loss_max=0.56,
            loss_slope=-0.01, loss_delta_recent=0.02,
            val_loss_mean=0.55, val_loss_std=0.02, train_val_gap=0.02,
            accuracy_mean=0.65, val_accuracy_mean=0.60,
            grad_norm_mean=0.04, grad_norm_min=0.03, grad_norm_max=0.05,
            grad_var_mean=0.001, grad_var_min=0.001,
            param_velocity_mean=0.01, param_velocity_recent=0.01,
            oscillation_count=1, loss_cv=0.05,
            has_nan_or_inf=False, invalid_steps_count=0,
        )

        # Weak suspected anomaly with low confidence
        weak_anomaly = DetectedAnomaly(
            failure_type=FailureType.OPTIMIZER_INSTABILITY,
            status=AnomalyStatus.SUSPECTED,
            step=3,
            severity=0.35,
            confidence=0.40,
            supporting_evidence=["Slight non-monotonicity"],
            persistence_count=1,
        )

        diag = engine.diagnose([weak_anomaly], dummy_summary, dummy_obs)
        # Because confidence is below 0.60, the gate must not clear
        assert diag.confidence < 0.60
        assert diag.confidence_gate_cleared is False
        assert diag.recommended_action == "ABSTAIN_OBSERVE"

    def test_distinguish_convergence_from_barren_plateau(self):
        """A well-converged model with small gradients must NOT be flagged as a barren plateau."""
        detector = FailureDetector()
        diagnosis_engine = DiagnosisEngine()

        converged_obs = HealthObservation(
            step=25,
            timestamp=200.0,
            iso_timestamp="2026-03-02T12:00:00Z",
            experiment_id="test",
            loss=0.22,  # Low, healthy loss!
            val_loss=0.25,
            accuracy=0.92,
            val_accuracy=0.90,
            gradient_norm=0.00008,  # Small gradient norm due to convergence at minimum
            gradient_variance=0.000001,
            parameter_velocity=0.00005,
            learning_rate=0.08,
            circuit_depth=2,
        )

        summary = TelemetrySummary(
            window_size=5, steps_observed=5, latest_step=25,
            loss_mean=0.23, loss_std=0.01, loss_min=0.22, loss_max=0.25,
            loss_slope=-0.005, loss_delta_recent=-0.005,
            val_loss_mean=0.26, val_loss_std=0.01, train_val_gap=0.03,
            accuracy_mean=0.92, val_accuracy_mean=0.90,
            grad_norm_mean=0.0001, grad_norm_min=0.00008, grad_norm_max=0.00015,
            grad_var_mean=0.000001, grad_var_min=0.000001,
            param_velocity_mean=0.00005, param_velocity_recent=0.00005,
            oscillation_count=0, loss_cv=0.04,
            has_nan_or_inf=False, invalid_steps_count=0,
        )

        anomalies = detector.evaluate(summary, converged_obs)
        bp_detected = [a for a in anomalies if a.failure_type == FailureType.BARREN_PLATEAU]
        assert len(bp_detected) == 0, "Converged model falsely flagged as Barren Plateau!"

        diag = diagnosis_engine.diagnose(anomalies, summary, converged_obs)
        assert diag.primary_cause != FailureType.BARREN_PLATEAU
        assert diag.confidence_gate_cleared is False
