"""
Unit and Integration Tests for Quantum ML Model and Parameter-Shift Gradients.
Stage 2 Verification Suite.
"""

import pytest
import numpy as np
from backend.qml_model import (
    VQCModel,
    CircuitConfig,
    FailureType,
    generate_moons,
    generate_circles,
    generate_iris_binary,
    load_dataset,
    create_optimizer,
    AdamOptimizer,
    RMSpropOptimizer,
    SGDOptimizer,
)


class TestDatasetGenerators:
    """Validate dataset generation, shapes, and normalization bounds [0, pi]."""

    def test_moons_generation(self):
        X, y = generate_moons(n_samples=100, random_state=42)
        assert X.shape == (100, 2)
        assert y.shape == (100,)
        assert np.all(y >= 0) and np.all(y <= 1)
        assert np.min(X) >= 0.0 - 1e-7 and np.max(X) <= np.pi + 1e-7

    def test_circles_generation(self):
        X, y = generate_circles(n_samples=100, random_state=42)
        assert X.shape == (100, 2)
        assert y.shape == (100,)
        assert np.all(y >= 0) and np.all(y <= 1)
        assert np.min(X) >= 0.0 - 1e-7 and np.max(X) <= np.pi + 1e-7

    def test_iris_binary_generation(self):
        X, y = generate_iris_binary(random_state=42)
        assert X.shape == (100, 4)
        assert y.shape == (100,)
        assert np.all(y >= 0) and np.all(y <= 1)
        assert np.min(X) >= 0.0 - 1e-7 and np.max(X) <= np.pi + 1e-7

    def test_load_dataset_partitioning(self):
        X_train, y_train, X_val, y_val = load_dataset("moons", train_ratio=0.7, seed=42)
        assert len(X_train) == 140
        assert len(X_val) == 60
        assert len(y_train) == 140
        assert len(y_val) == 60


class TestParameterShiftGradientVerification:
    """
    Core Scientific Verification:
    Verify that exact analytic parameter-shift gradients match
    central finite differences within numerical tolerance.
    """

    def test_parameter_shift_vs_finite_difference(self):
        config = CircuitConfig(
            n_qubits=2,
            n_layers=1,
            feature_map="angle",
            ansatz_type="basic_entangling",
            seed=42,
        )
        model = VQCModel(config)

        # Small mini-batch of test points
        X_test = np.array([[0.5, 1.2], [1.8, 0.4]])
        y_test = np.array([1, 0])

        # Compute parameter-shift gradients
        g_ps = model.compute_parameter_shift_gradients(X_test, y_test)

        # Compute finite-difference gradients (eps = 1e-5)
        g_fd = model.compute_finite_difference_gradients(X_test, y_test, eps=1e-5)

        # Gradients must match within 1e-4 relative/absolute tolerance
        max_abs_diff = np.max(np.abs(g_ps - g_fd))
        assert max_abs_diff < 1e-4, f"Parameter shift diff from FD too large: {max_abs_diff}"

    def test_strongly_entangling_gradients(self):
        config = CircuitConfig(
            n_qubits=2,
            n_layers=1,
            feature_map="angle",
            ansatz_type="strongly_entangling",
            seed=42,
        )
        model = VQCModel(config)
        X_test = np.array([[0.8, 1.5], [2.1, 0.7]])
        y_test = np.array([0, 1])

        g_ps = model.compute_parameter_shift_gradients(X_test, y_test)
        g_fd = model.compute_finite_difference_gradients(X_test, y_test, eps=1e-5)

        max_abs_diff = np.max(np.abs(g_ps - g_fd))
        assert max_abs_diff < 1e-4, f"Strongly entangling PS diff from FD too large: {max_abs_diff}"


class TestVQCArchitecturesAndFeatures:
    """Verify various feature maps, ansatze, and classical optimizers."""

    def test_iqp_feature_map(self):
        config = CircuitConfig(
            n_qubits=2,
            n_layers=2,
            feature_map="iqp",
            ansatz_type="basic_entangling",
            seed=42,
        )
        model = VQCModel(config)
        X_test = np.array([[0.5, 1.0], [1.5, 2.0]])
        probs = model.predict_proba(X_test)
        assert probs.shape == (2,)
        assert np.all(probs >= 0.0) and np.all(probs <= 1.0)

    def test_optimizers(self):
        for opt_name in ["adam", "rmsprop", "sgd"]:
            config = CircuitConfig(
                n_qubits=2,
                n_layers=1,
                optimizer_name=opt_name,
                learning_rate=0.05,
                seed=42,
            )
            model = VQCModel(config)
            X = np.array([[0.5, 0.5], [1.0, 1.0]])
            y = np.array([1, 0])
            loss_before, _ = model.compute_loss_and_accuracy(X, y)
            metrics = model.train_step(X, y, X, y)
            assert metrics.epoch == 1
            assert metrics.gradient_norm > 0.0


class TestModelReproducibilityAndStateRollback:
    """Verify seed reproducibility and atomic state preservation/rollback."""

    def test_seed_controlled_reproducibility(self):
        config1 = CircuitConfig(n_qubits=2, n_layers=2, seed=123)
        model1 = VQCModel(config1)

        config2 = CircuitConfig(n_qubits=2, n_layers=2, seed=123)
        model2 = VQCModel(config2)

        # Initial parameters must be identical
        np.testing.assert_array_almost_equal(model1.params, model2.params)

        X = np.array([[0.4, 0.9], [1.2, 0.3]])
        y = np.array([1, 0])

        m1 = model1.train_step(X, y, X, y)
        m2 = model2.train_step(X, y, X, y)

        np.testing.assert_array_almost_equal(model1.params, model2.params)
        assert abs(m1.loss - m2.loss) < 1e-10

    def test_atomic_state_rollback(self):
        config = CircuitConfig(n_qubits=2, n_layers=2, seed=42)
        model = VQCModel(config)
        X = np.array([[0.5, 0.5], [1.0, 1.0]])
        y = np.array([1, 0])

        # Step 1
        model.train_step(X, y, X, y)
        snapshot = model.get_state()
        params_saved = snapshot.params.copy()

        # Step 2 and 3 (modifying state)
        model.train_step(X, y, X, y)
        model.train_step(X, y, X, y)
        assert not np.allclose(model.params, params_saved)

        # Trigger rollback to snapshot
        model.set_state(snapshot)
        np.testing.assert_array_almost_equal(model.params, params_saved)
        assert model.epoch == 1


class TestControlledFailureInjections:
    """Verify each of the 6 controlled failure injection hooks."""

    def test_inject_barren_plateau_synth(self):
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2, seed=42))
        X = np.array([[0.5, 0.5], [1.0, 1.0]])
        y = np.array([1, 0])

        grads_before = model.compute_parameter_shift_gradients(X, y)
        model.inject_failure(FailureType.BARREN_PLATEAU, mode="default")
        grads_after = model.compute_parameter_shift_gradients(X, y)

        assert np.linalg.norm(grads_after) < 1e-5
        assert np.linalg.norm(grads_after) < np.linalg.norm(grads_before) * 1e-4

    def test_inject_barren_plateau_structural(self):
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2, seed=42))
        report = model.inject_failure(FailureType.BARREN_PLATEAU, mode="structural")
        assert model.config.n_layers >= 8
        assert model.params.shape[0] >= 8

    def test_inject_lr_misconfiguration(self):
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2, learning_rate=0.01))
        initial_lr = model.optimizer.lr
        model.inject_failure(FailureType.LR_MISCONFIGURATION, severity=1.0)
        assert model.optimizer.lr == initial_lr * 50.0

    def test_inject_optimizer_instability(self):
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2, optimizer_name="adam"))
        X = np.array([[0.5, 0.5], [1.0, 1.0]])
        y = np.array([1, 0])
        model.train_step(X, y, X, y)
        model.inject_failure(FailureType.OPTIMIZER_INSTABILITY)
        assert "optimizer_instability" in model.active_injections
        assert model.optimizer.beta1 == 0.9999

    def test_inject_training_divergence(self):
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        initial_norm = np.linalg.norm(model.params)
        model.inject_failure(FailureType.TRAINING_DIVERGENCE, severity=1.0)
        norm_after = np.linalg.norm(model.params)
        assert np.isnan(norm_after) or norm_after > initial_norm * 100

    def test_inject_noise_degradation(self):
        model = VQCModel(CircuitConfig(n_qubits=2, n_layers=2))
        model.inject_failure(FailureType.NOISE_DEGRADATION, severity=1.0)
        assert model._noise_level > 0.0
