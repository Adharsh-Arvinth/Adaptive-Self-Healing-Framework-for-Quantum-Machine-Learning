"""
Variational Quantum Circuit (VQC) Model and Classical Optimizer Integration.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
import pennylane as qml
from sklearn.datasets import make_moons, make_circles, load_iris
from sklearn.preprocessing import MinMaxScaler
from sklearn.model_selection import train_test_split


class FailureType(str, Enum):
    BARREN_PLATEAU = "barren_plateau"
    LR_MISCONFIGURATION = "lr_misconfiguration"
    OPTIMIZER_INSTABILITY = "optimizer_instability"
    TRAINING_DIVERGENCE = "training_divergence"
    PERSISTENT_PLATEAU = "persistent_plateau"
    NOISE_DEGRADATION = "noise_degradation"


@dataclass
class CircuitConfig:
    n_qubits: int = 2
    n_layers: int = 2
    feature_map: str = "angle"  # 'angle' or 'iqp'
    ansatz_type: str = "basic_entangling"  # 'basic_entangling' or 'strongly_entangling'
    optimizer_name: str = "adam"  # 'adam', 'rmsprop', 'sgd'
    learning_rate: float = 0.05
    seed: int = 42
    noise_mitigation: bool = False


@dataclass
class StepMetrics:
    epoch: int
    loss: float
    val_loss: float
    accuracy: float
    val_accuracy: float
    gradient: np.ndarray
    gradient_norm: float
    gradient_variance: float
    parameter_velocity: float
    learning_rate: float
    circuit_depth: int
    n_qubits: int = 2


@dataclass
class ModelState:
    params: np.ndarray
    config: CircuitConfig
    optimizer_state: Dict[str, Any]
    epoch: int
    active_injections: List[str] = field(default_factory=list)


# ----------------------------------------------------------------------
# Dataset Generators
# ----------------------------------------------------------------------

def generate_moons(n_samples: int = 200, noise: float = 0.1, random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """Generate normalized 2D Make Moons dataset scaled to [0, pi]."""
    X, y = make_moons(n_samples=n_samples, noise=noise, random_state=random_state)
    scaler = MinMaxScaler(feature_range=(0.0, np.pi))
    X_scaled = scaler.fit_transform(X)
    return X_scaled, y.astype(int)


def generate_circles(n_samples: int = 200, factor: float = 0.5, noise: float = 0.08, random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """Generate normalized 2D Concentric Circles dataset scaled to [0, pi]."""
    X, y = make_circles(n_samples=n_samples, factor=factor, noise=noise, random_state=random_state)
    scaler = MinMaxScaler(feature_range=(0.0, np.pi))
    X_scaled = scaler.fit_transform(X)
    return X_scaled, y.astype(int)


def generate_iris_binary(random_state: int = 42) -> Tuple[np.ndarray, np.ndarray]:
    """Generate normalized binary Iris dataset (Classes 0 & 1, 4 features) scaled to [0, pi]."""
    iris = load_iris()
    mask = iris.target < 2
    X = iris.data[mask]
    y = iris.target[mask]
    scaler = MinMaxScaler(feature_range=(0.0, np.pi))
    X_scaled = scaler.fit_transform(X)
    return X_scaled, y.astype(int)


def load_dataset(name: str = "moons", train_ratio: float = 0.7, seed: int = 42) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """Load and partition dataset into train and validation sets with fixed seed."""
    if name == "moons":
        X, y = generate_moons(n_samples=200, random_state=seed)
    elif name == "circles":
        X, y = generate_circles(n_samples=200, random_state=seed)
    elif name == "iris":
        X, y = generate_iris_binary(random_state=seed)
    else:
        raise ValueError(f"Unknown dataset name: {name}")

    test_count = int(round(len(X) * (1.0 - train_ratio)))
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=test_count, random_state=seed, stratify=y
    )
    return X_train, y_train, X_val, y_val


# ----------------------------------------------------------------------
# Pure Classical Optimizers (Fully Serializable & Inspectable)
# ----------------------------------------------------------------------

class ClassicalOptimizer:
    """Base class for fully serializable classical optimizers."""
    def __init__(self, lr: float = 0.05):
        self.lr = lr
        self.step_count = 0

    def step(self, params: np.ndarray, grads: np.ndarray) -> np.ndarray:
        raise NotImplementedError

    def get_state(self) -> Dict[str, Any]:
        return {"lr": self.lr, "step_count": self.step_count}

    def set_state(self, state: Dict[str, Any]) -> None:
        self.lr = state.get("lr", self.lr)
        self.step_count = state.get("step_count", 0)


class AdamOptimizer(ClassicalOptimizer):
    def __init__(self, lr: float = 0.05, beta1: float = 0.9, beta2: float = 0.999, eps: float = 1e-8):
        super().__init__(lr)
        self.beta1 = beta1
        self.beta2 = beta2
        self.eps = eps
        self.m: Optional[np.ndarray] = None
        self.v: Optional[np.ndarray] = None

    def step(self, params: np.ndarray, grads: np.ndarray) -> np.ndarray:
        if self.m is None or self.m.shape != params.shape:
            self.m = np.zeros_like(params)
            self.v = np.zeros_like(params)

        self.step_count += 1
        self.m = self.beta1 * self.m + (1.0 - self.beta1) * grads
        self.v = self.beta2 * self.v + (1.0 - self.beta2) * (grads ** 2)

        m_hat = self.m / (1.0 - self.beta1 ** self.step_count)
        v_hat = self.v / (1.0 - self.beta2 ** self.step_count)

        update = self.lr * m_hat / (np.sqrt(v_hat) + self.eps)
        return params - update

    def get_state(self) -> Dict[str, Any]:
        state = super().get_state()
        state.update({
            "beta1": self.beta1,
            "beta2": self.beta2,
            "eps": self.eps,
            "m": self.m.copy() if self.m is not None else None,
            "v": self.v.copy() if self.v is not None else None,
        })
        return state

    def set_state(self, state: Dict[str, Any]) -> None:
        super().set_state(state)
        self.beta1 = state.get("beta1", 0.9)
        self.beta2 = state.get("beta2", 0.999)
        self.eps = state.get("eps", 1e-8)
        self.m = state.get("m").copy() if state.get("m") is not None else None
        self.v = state.get("v").copy() if state.get("v") is not None else None


class RMSpropOptimizer(ClassicalOptimizer):
    def __init__(self, lr: float = 0.05, alpha: float = 0.99, eps: float = 1e-8):
        super().__init__(lr)
        self.alpha = alpha
        self.eps = eps
        self.v: Optional[np.ndarray] = None

    def step(self, params: np.ndarray, grads: np.ndarray) -> np.ndarray:
        if self.v is None or self.v.shape != params.shape:
            self.v = np.zeros_like(params)

        self.step_count += 1
        self.v = self.alpha * self.v + (1.0 - self.alpha) * (grads ** 2)
        update = self.lr * grads / (np.sqrt(self.v) + self.eps)
        return params - update

    def get_state(self) -> Dict[str, Any]:
        state = super().get_state()
        state.update({
            "alpha": self.alpha,
            "eps": self.eps,
            "v": self.v.copy() if self.v is not None else None,
        })
        return state

    def set_state(self, state: Dict[str, Any]) -> None:
        super().set_state(state)
        self.alpha = state.get("alpha", 0.99)
        self.eps = state.get("eps", 1e-8)
        self.v = state.get("v").copy() if state.get("v") is not None else None


class SGDOptimizer(ClassicalOptimizer):
    def __init__(self, lr: float = 0.05, momentum: float = 0.9):
        super().__init__(lr)
        self.momentum = momentum
        self.v: Optional[np.ndarray] = None

    def step(self, params: np.ndarray, grads: np.ndarray) -> np.ndarray:
        if self.v is None or self.v.shape != params.shape:
            self.v = np.zeros_like(params)

        self.step_count += 1
        self.v = self.momentum * self.v + grads
        return params - self.lr * self.v

    def get_state(self) -> Dict[str, Any]:
        state = super().get_state()
        state.update({
            "momentum": self.momentum,
            "v": self.v.copy() if self.v is not None else None,
        })
        return state

    def set_state(self, state: Dict[str, Any]) -> None:
        super().set_state(state)
        self.momentum = state.get("momentum", 0.9)
        self.v = state.get("v").copy() if state.get("v") is not None else None


def create_optimizer(name: str, lr: float) -> ClassicalOptimizer:
    name_lower = name.lower()
    if name_lower == "adam":
        return AdamOptimizer(lr=lr)
    elif name_lower == "rmsprop":
        return RMSpropOptimizer(lr=lr)
    elif name_lower in ("sgd", "momentum"):
        return SGDOptimizer(lr=lr)
    else:
        raise ValueError(f"Unknown optimizer: {name}")


# ----------------------------------------------------------------------
# Variational Quantum Circuit Model
# ----------------------------------------------------------------------

class VQCModel:
    """
    Configurable Variational Quantum Circuit Classification Model using PennyLane.
    Supports analytic parameter-shift gradients, controlled failure injection,
    and complete atomic state serialization/rollback.
    """

    def __init__(self, config: Optional[CircuitConfig] = None):
        self.config = config or CircuitConfig()
        self.epoch = 0
        self.prev_params: Optional[np.ndarray] = None
        self.active_injections: List[str] = []
        self._noise_level: float = 0.0

        # Deterministic seed initialization
        np.random.seed(self.config.seed)

        # Initialize device and circuit
        self._init_circuit()

        # Initialize parameters
        self._init_parameters()

        # Initialize optimizer
        self.optimizer = create_optimizer(self.config.optimizer_name, self.config.learning_rate)

    def _init_circuit(self) -> None:
        """Construct PennyLane QNode device and circuit."""
        self.dev = qml.device("default.qubit", wires=self.config.n_qubits)

        @qml.qnode(self.dev, diff_method="parameter-shift")
        def _qnode(params, x):
            # 1. Feature Map Encoding (supports both single sample and 2D batch)
            n_features = x.shape[1] if x.ndim == 2 else len(x)
            if self.config.feature_map == "angle":
                for i in range(min(n_features, self.config.n_qubits)):
                    val = x[:, i] if x.ndim == 2 else x[i]
                    qml.RY(val, wires=i)
            elif self.config.feature_map == "iqp":
                # IQP / ZZFeatureMap encoding
                for i in range(self.config.n_qubits):
                    qml.Hadamard(wires=i)
                    idx = i % n_features
                    val = x[:, idx] if x.ndim == 2 else x[idx]
                    qml.RZ(2.0 * val, wires=i)
                for i in range(self.config.n_qubits - 1):
                    idx_i = i % n_features
                    idx_j = (i + 1) % n_features
                    val_i = x[:, idx_i] if x.ndim == 2 else x[idx_i]
                    val_j = x[:, idx_j] if x.ndim == 2 else x[idx_j]
                    qml.CNOT(wires=[i, i + 1])
                    qml.RZ(2.0 * (np.pi - val_i) * (np.pi - val_j), wires=i + 1)
                    qml.CNOT(wires=[i, i + 1])
            else:
                raise ValueError(f"Unknown feature map: {self.config.feature_map}")

            # 2. Trainable Variational Ansatz
            if self.config.ansatz_type == "basic_entangling":
                # params shape: (n_layers, n_qubits)
                for l in range(self.config.n_layers):
                    for q in range(self.config.n_qubits):
                        qml.RY(params[l, q], wires=q)
                    if self.config.n_qubits > 1:
                        for q in range(self.config.n_qubits):
                            qml.CNOT(wires=[q, (q + 1) % self.config.n_qubits])
            elif self.config.ansatz_type == "strongly_entangling":
                # params shape: (n_layers, n_qubits, 3)
                for l in range(self.config.n_layers):
                    for q in range(self.config.n_qubits):
                        qml.Rot(params[l, q, 0], params[l, q, 1], params[l, q, 2], wires=q)
                    if self.config.n_qubits > 1:
                        for q in range(self.config.n_qubits):
                            target = (q + l + 1) % self.config.n_qubits
                            if target != q:
                                qml.CNOT(wires=[q, target])
            else:
                raise ValueError(f"Unknown ansatz: {self.config.ansatz_type}")

            # 3. Measurement Observable
            return qml.expval(qml.PauliZ(0))

        self.qnode = _qnode

    def _init_parameters(self) -> None:
        """Initialize circuit parameters with controlled random seed."""
        rng = np.random.RandomState(self.config.seed)
        if self.config.ansatz_type == "basic_entangling":
            # Small non-zero initialization around 0.1 to avoid barren plateau at init
            self.params = rng.uniform(low=-0.2, high=0.2, size=(self.config.n_layers, self.config.n_qubits))
        elif self.config.ansatz_type == "strongly_entangling":
            self.params = rng.uniform(low=-0.2, high=0.2, size=(self.config.n_layers, self.config.n_qubits, 3))
        else:
            raise ValueError(f"Unknown ansatz: {self.config.ansatz_type}")
        self.prev_params = self.params.copy()

    # ------------------------------------------------------------------
    # Forward Pass & Prediction
    # ------------------------------------------------------------------

    def predict_sample(self, x: np.ndarray, params: Optional[np.ndarray] = None) -> float:
        """Compute circuit expectation <Z_0> in [-1, 1] for a single sample."""
        p = params if params is not None else self.params
        expval = float(self.qnode(p, x))
        if self._noise_level > 0.0:
            noise = float(np.random.normal(0.0, self._noise_level))
            expval = float(np.clip(expval + noise, -1.0, 1.0))
        return expval

    def predict_proba(self, X: np.ndarray, params: Optional[np.ndarray] = None) -> np.ndarray:
        """Compute binary classification probabilities p(y=1|x) = (1 + <Z_0>) / 2 with vectorized batching."""
        p = params if params is not None else self.params
        try:
            expval = np.asarray(self.qnode(p, X), dtype=float)
        except Exception:
            # Fallback to sample-wise loop if ansatz/feature-map broadcasting fails
            expval = np.array([float(self.qnode(p, x)) for x in X], dtype=float)

        if self._noise_level > 0.0:
            noise = np.random.normal(0.0, self._noise_level, size=expval.shape)
            # Physical depolarizing contraction + readout error
            expval = np.clip(expval * (1.0 - 0.5 * self._noise_level) + noise, -1.0, 1.0)
            if self.config.noise_mitigation:
                # Simulation-side zero-noise extrapolation & bias correction
                expval = np.clip(expval / max(0.2, (1.0 - 0.5 * self._noise_level)), -1.0, 1.0)

        probs = (1.0 + expval) / 2.0
        return np.clip(probs, 0.01, 0.99)

    def predict(self, X: np.ndarray, params: Optional[np.ndarray] = None) -> np.ndarray:
        """Binary classification predictions in {0, 1}."""
        probs = self.predict_proba(X, params)
        return (probs >= 0.5).astype(int)

    def get_bloch_coordinates(self, sample_x: Optional[np.ndarray] = None) -> Dict[str, float]:
        """Compute real expectation values <X>, <Y>, <Z> on qubit 0 to position the Bloch sphere state vector."""
        if sample_x is None:
            sample_x = np.array([np.pi / 2.0, np.pi / 4.0])

        dev = qml.device("default.qubit", wires=self.config.n_qubits)

        @qml.qnode(dev)
        def _bloch_qnode(params, x):
            n_features = len(x)
            if self.config.feature_map == "angle":
                for i in range(min(n_features, self.config.n_qubits)):
                    qml.RY(x[i], wires=i)
            elif self.config.feature_map == "iqp":
                for i in range(self.config.n_qubits):
                    qml.Hadamard(wires=i)
                    qml.RZ(2.0 * x[i % n_features], wires=i)
                for i in range(self.config.n_qubits - 1):
                    val_i = x[i % n_features]
                    val_j = x[(i + 1) % n_features]
                    qml.CNOT(wires=[i, i + 1])
                    qml.RZ(2.0 * (np.pi - val_i) * (np.pi - val_j), wires=i + 1)
                    qml.CNOT(wires=[i, i + 1])

            if self.config.ansatz_type == "basic_entangling":
                for l in range(self.config.n_layers):
                    for q in range(self.config.n_qubits):
                        qml.RY(params[l, q], wires=q)
                    if self.config.n_qubits > 1:
                        for q in range(self.config.n_qubits):
                            qml.CNOT(wires=[q, (q + 1) % self.config.n_qubits])
            elif self.config.ansatz_type == "strongly_entangling":
                for l in range(self.config.n_layers):
                    for q in range(self.config.n_qubits):
                        qml.Rot(params[l, q, 0], params[l, q, 1], params[l, q, 2], wires=q)
                    if self.config.n_qubits > 1:
                        for q in range(self.config.n_qubits):
                            target = (q + l + 1) % self.config.n_qubits
                            if target != q:
                                qml.CNOT(wires=[q, target])

            return [
                qml.expval(qml.PauliX(0)),
                qml.expval(qml.PauliY(0)),
                qml.expval(qml.PauliZ(0)),
            ]

        try:
            exp_vals = _bloch_qnode(self.params, sample_x)
            bx, by, bz = float(exp_vals[0]), float(exp_vals[1]), float(exp_vals[2])
            # Account for physical noise contraction if active (mixed state Bloch vector contracts: ||r|| < 1)
            # In accordance with DEF-003, we preserve the true physical noisy quantum-state coordinates.
            if self._noise_level > 0.0:
                contraction = max(0.1, 1.0 - 0.5 * self._noise_level)
                bx *= contraction
                by *= contraction
                bz *= contraction

            # Physical Bloch radius and purity for single-qubit reduced mixed state rho
            bloch_radius = float(np.sqrt(bx**2 + by**2 + bz**2))
            purity = float(0.5 * (1.0 + min(1.0, bloch_radius**2)))

            # If simulation-side noise mitigation is enabled, compute error-mitigated expectation-value
            # estimates separately (Zero-Noise Extrapolation / linear Richardson scaling) without
            # artificially purifying the true physical state.
            if self.config.noise_mitigation and self._noise_level > 0.0:
                mitigation_factor = 1.0 / max(0.1, 1.0 - 0.5 * self._noise_level)
                mit_x = float(np.clip(bx * mitigation_factor, -1.0, 1.0))
                mit_y = float(np.clip(by * mitigation_factor, -1.0, 1.0))
                mit_z = float(np.clip(bz * mitigation_factor, -1.0, 1.0))
            else:
                mit_x, mit_y, mit_z = bx, by, bz

            # Return both 'qubit' and 'qubit_index' (and 'qubitIndex') for full backward/forward API compatibility (DEF-004)
            return {
                "x": bx,
                "y": by,
                "z": bz,
                "qubit": 0,
                "qubit_index": 0,
                "qubitIndex": 0,
                "purity": purity,
                "radius": bloch_radius,
                "mitigated_x": mit_x,
                "mitigated_y": mit_y,
                "mitigated_z": mit_z,
            }
        except Exception:
            return {
                "x": 0.0,
                "y": 0.0,
                "z": 1.0,
                "qubit": 0,
                "qubit_index": 0,
                "qubitIndex": 0,
                "purity": 1.0,
                "radius": 1.0,
                "mitigated_x": 0.0,
                "mitigated_y": 0.0,
                "mitigated_z": 1.0,
            }

    def compute_loss_and_accuracy(
        self, X: np.ndarray, y: np.ndarray, params: Optional[np.ndarray] = None
    ) -> Tuple[float, float]:
        """Compute binary cross-entropy loss and classification accuracy."""
        probs = self.predict_proba(X, params)
        # Binary Cross-Entropy
        bce = -np.mean(y * np.log(probs) + (1.0 - y) * np.log(1.0 - probs))
        acc = float(np.mean((probs >= 0.5).astype(int) == y))
        return float(bce), acc

    # ------------------------------------------------------------------
    # Parameter-Shift Gradient Calculation
    # ------------------------------------------------------------------

    def compute_parameter_shift_gradients(
        self, X_batch: np.ndarray, y_batch: np.ndarray, params: Optional[np.ndarray] = None
    ) -> np.ndarray:
        """
        Compute analytic parameter-shift gradients of the binary cross-entropy loss
        with respect to all circuit parameters:
          d<Z_0>/dtheta_k = (<Z_0>(theta_k + pi/2) - <Z_0>(theta_k - pi/2)) / 2
          dL/dtheta_k = (1/B) sum_i [ (y_hat_i - y_i) / (y_hat_i * (1 - y_hat_i)) * 0.5 * d<Z_0>_i/dtheta_k ]
        """
        p = params if params is not None else self.params
        param_shape = p.shape
        flat_p = p.flatten()
        n_params = len(flat_p)
        shift = np.pi / 2.0

        # Predict current batch probabilities
        probs = self.predict_proba(X_batch, p)
        # Loss derivative w.r.t. predicted probability: dL/d(y_hat)
        dl_dyhat = (probs - y_batch) / (probs * (1.0 - probs) + 1e-12)  # shape: (B,)

        grads_flat = np.zeros(n_params, dtype=float)

        # Iterate over each parameter coordinate
        for k in range(n_params):
            p_plus = flat_p.copy()
            p_plus[k] += shift
            p_plus_shaped = p_plus.reshape(param_shape)

            p_minus = flat_p.copy()
            p_minus[k] -= shift
            p_minus_shaped = p_minus.reshape(param_shape)

            # Vectorized evaluation across batch
            try:
                expval_plus = np.asarray(self.qnode(p_plus_shaped, X_batch), dtype=float)
                expval_minus = np.asarray(self.qnode(p_minus_shaped, X_batch), dtype=float)
                d_expval = (expval_plus - expval_minus) / (2.0 * np.sin(shift))
            except Exception:
                d_expval = np.array([
                    (float(self.qnode(p_plus_shaped, x)) - float(self.qnode(p_minus_shaped, x))) / (2.0 * np.sin(shift))
                    for x in X_batch
                ], dtype=float)

            # Chain rule: dy_hat/d<Z_0> = 0.5
            dyhat_dtheta = 0.5 * d_expval
            # Accumulate batch gradient
            grads_flat[k] = np.mean(dl_dyhat * dyhat_dtheta)

        grads = grads_flat.reshape(param_shape)

        # If flat landscape synthetic surrogate injected, artificially attenuate gradients
        if "barren_plateau_synth" in self.active_injections:
            grads = grads * 1e-6

        return grads

    def compute_finite_difference_gradients(
        self, X_batch: np.ndarray, y_batch: np.ndarray, eps: float = 1e-6
    ) -> np.ndarray:
        """
        Compute central finite difference gradients for verification purposes:
          dL/dtheta_k approx (L(theta_k + eps) - L(theta_k - eps)) / (2 * eps)
        """
        param_shape = self.params.shape
        flat_p = self.params.flatten()
        n_params = len(flat_p)
        grads_flat = np.zeros(n_params, dtype=float)

        for k in range(n_params):
            p_plus = flat_p.copy()
            p_plus[k] += eps
            loss_plus, _ = self.compute_loss_and_accuracy(X_batch, y_batch, p_plus.reshape(param_shape))

            p_minus = flat_p.copy()
            p_minus[k] -= eps
            loss_minus, _ = self.compute_loss_and_accuracy(X_batch, y_batch, p_minus.reshape(param_shape))

            grads_flat[k] = (loss_plus - loss_minus) / (2.0 * eps)

        return grads_flat.reshape(param_shape)

    # ------------------------------------------------------------------
    # Training Step
    # ------------------------------------------------------------------

    def train_step(
        self, X_train: np.ndarray, y_train: np.ndarray, X_val: np.ndarray, y_val: np.ndarray
    ) -> StepMetrics:
        """Execute one complete optimization step using parameter-shift gradients."""
        self.epoch += 1

        # 1. Compute loss & accuracy before step
        train_loss, train_acc = self.compute_loss_and_accuracy(X_train, y_train)
        val_loss, val_acc = self.compute_loss_and_accuracy(X_val, y_val)

        # 2. Compute analytic parameter-shift gradients
        grads = self.compute_parameter_shift_gradients(X_train, y_train)

        # 3. Compute telemetry metrics
        grad_flat = grads.flatten()
        grad_norm = float(np.linalg.norm(grad_flat))
        grad_var = float(np.var(grad_flat)) if len(grad_flat) > 0 else 0.0

        # 4. Update parameters using optimizer
        self.prev_params = self.params.copy()
        if "persistent_plateau" in self.active_injections:
            # Trapped at flat saddle manifold: parameters do not progress
            new_params = self.params.copy()
        else:
            new_params = self.optimizer.step(self.params, grads)

        # Parameter displacement velocity
        param_vel = float(np.linalg.norm(new_params.flatten() - self.prev_params.flatten()))
        self.params = new_params

        metrics = StepMetrics(
            epoch=self.epoch,
            loss=train_loss,
            val_loss=val_loss,
            accuracy=train_acc,
            val_accuracy=val_acc,
            gradient=grads,
            gradient_norm=grad_norm,
            gradient_variance=grad_var,
            parameter_velocity=param_vel,
            learning_rate=self.optimizer.lr,
            circuit_depth=self.config.n_layers,
            n_qubits=self.config.n_qubits,
        )
        return metrics

    # ------------------------------------------------------------------
    # Failure Injection Hooks
    # ------------------------------------------------------------------

    def inject_failure(self, failure_type: FailureType, severity: float = 1.0, mode: str = "default") -> Dict[str, Any]:
        """
        Inject controlled synthetic failure conditions into VQC model training.
        Returns a diagnostic report of the applied mutation.
        """
        report: Dict[str, Any] = {"failure_type": failure_type.value, "severity": severity, "epoch": self.epoch}

        if failure_type == FailureType.BARREN_PLATEAU:
            if mode == "structural":
                # Genuine structural barren plateau: expand depth to 8 layers and randomize
                self.config.n_layers = max(8, int(self.config.n_layers * 4))
                self.config.seed = int(np.random.randint(0, 10000))
                self._init_circuit()
                rng = np.random.RandomState(self.config.seed)
                # Draw from Haar-scrambling uniform distribution [0, 2*pi]
                if self.config.ansatz_type == "basic_entangling":
                    self.params = rng.uniform(0.0, 2.0 * np.pi, size=(self.config.n_layers, self.config.n_qubits))
                else:
                    self.params = rng.uniform(0.0, 2.0 * np.pi, size=(self.config.n_layers, self.config.n_qubits, 3))
                self.prev_params = self.params.copy()
                self.active_injections.append("barren_plateau_structural")
                report["action"] = f"Expanded circuit depth to {self.config.n_layers} with Haar-random parameters"
            else:
                # Controlled synthetic surrogate for detection testing
                self.active_injections.append("barren_plateau_synth")
                report["action"] = "Activated synthetic gradient attenuation surrogate (< 1e-6)"

        elif failure_type == FailureType.LR_MISCONFIGURATION:
            # Scale learning rate excessively (e.g. 50x) causing oscillatory explosion
            scale = 50.0 * severity
            self.optimizer.lr *= scale
            self.config.learning_rate = self.optimizer.lr
            self.active_injections.append("lr_misconfiguration")
            report["action"] = f"Scaled learning rate by {scale:.1f}x to {self.optimizer.lr:.4f}"

        elif failure_type == FailureType.OPTIMIZER_INSTABILITY:
            # Corrupt optimizer state
            if isinstance(self.optimizer, AdamOptimizer):
                if self.optimizer.m is not None:
                    # Invert momentum and amplify
                    self.optimizer.m = -10.0 * self.optimizer.m
                    self.optimizer.v = 1e-4 * np.ones_like(self.optimizer.v)
                self.optimizer.beta1 = 0.9999
                self.optimizer.beta2 = 0.1
            self.active_injections.append("optimizer_instability")
            report["action"] = "Corrupted optimizer momentum buffers and uncalibrated betas"

        elif failure_type == FailureType.TRAINING_DIVERGENCE:
            # Force numerical NaN / loss explosion
            self.params = np.full_like(self.params, np.nan)
            self.active_injections.append("training_divergence")
            report["action"] = "Set parameter tensor to NaN to trigger immediate loss divergence"

        elif failure_type == FailureType.PERSISTENT_PLATEAU:
            # Pin parameters into flat non-convergent saddle manifold
            self.active_injections.append("persistent_plateau")
            report["action"] = "Pinned parameter trajectory into flat non-convergent saddle manifold"

        elif failure_type == FailureType.NOISE_DEGRADATION:
            # Set simulation noise level
            self._noise_level = 0.25 * severity
            self.active_injections.append("noise_degradation")
            report["action"] = f"Injected simulation-side noise with std dev {self._noise_level:.3f}"

        else:
            raise ValueError(f"Unknown failure type: {failure_type}")

        return report

    # ------------------------------------------------------------------
    # Atomic State Serialization & Rollback
    # ------------------------------------------------------------------

    def get_state(self) -> ModelState:
        """Export an immutable, deep-copied model snapshot."""
        return ModelState(
            params=self.params.copy(),
            config=CircuitConfig(
                n_qubits=self.config.n_qubits,
                n_layers=self.config.n_layers,
                feature_map=self.config.feature_map,
                ansatz_type=self.config.ansatz_type,
                optimizer_name=self.config.optimizer_name,
                learning_rate=self.optimizer.lr,
                seed=self.config.seed,
                noise_mitigation=getattr(self.config, "noise_mitigation", False),
            ),
            optimizer_state=self.optimizer.get_state(),
            epoch=self.epoch,
            active_injections=list(self.active_injections),
        )

    def set_state(self, state: ModelState) -> None:
        """Restore model completely from a snapshot (rollback support)."""
        self.config = CircuitConfig(
            n_qubits=state.config.n_qubits,
            n_layers=state.config.n_layers,
            feature_map=state.config.feature_map,
            ansatz_type=state.config.ansatz_type,
            optimizer_name=state.config.optimizer_name,
            learning_rate=state.config.learning_rate,
            seed=state.config.seed,
            noise_mitigation=getattr(state.config, "noise_mitigation", False),
        )
        self.epoch = state.epoch
        self.active_injections = list(state.active_injections)
        self._noise_level = 0.0 if "noise_degradation" not in self.active_injections else 0.25

        # Reconstruct circuit with restored config
        self._init_circuit()
        self.params = state.params.copy()
        self.prev_params = self.params.copy()

        # Restore optimizer and its internal buffers
        self.optimizer = create_optimizer(self.config.optimizer_name, self.config.learning_rate)
        self.optimizer.set_state(state.optimizer_state)
