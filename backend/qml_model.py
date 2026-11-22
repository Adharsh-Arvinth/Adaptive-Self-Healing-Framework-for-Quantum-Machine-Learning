"""
Variational Quantum Circuit (VQC) Model and Classical Optimizer Integration.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning.
"""

from copy import deepcopy
from dataclasses import dataclass, field, replace
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
    # Nominal (operator-configured) learning rate. Used by the learning-rate repair arm to
    # re-anchor a mis-scaled step size. Defaults to `learning_rate` at model construction.
    reference_learning_rate: Optional[float] = None


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
    # Label-aligned measured margin E[(2y-1)<Z_0>] over the batch. Observable on hardware; contracts by the
    # depolarizing factor (1-p)^L under noise, so it is a physically grounded noise signal.
    output_margin: float = float("nan")
    # Cosine similarity between consecutive gradient estimates. Scale-free: ~+1 on a smooth
    # descent, ~0 when estimates are noise-dominated (plateau / heavy shot noise), < 0 when bouncing.
    grad_cosine: float = float("nan")
    # Unsigned prediction magnitude E|2p-1|: shrinks under depolarizing damping, but stays high
    # for confident-but-wrong predictions (e.g. scrambled parameters).
    output_magnitude: float = float("nan")


@dataclass
class ModelState:
    params: np.ndarray
    config: CircuitConfig
    optimizer_state: Dict[str, Any]
    epoch: int
    active_injections: List[str] = field(default_factory=list)
    # Fault-environment state (round-tripped through snapshots so rollback is exact).
    noise_level: float = 0.0          # finite-shot readout noise std (sigma_shot)
    depolarizing_p: float = 0.0       # per-layer depolarizing probability p
    bp_exponent: float = 0.0          # emulated gradient-concentration exponent e (alpha = 10^-e)
    rng_state: Any = None             # model-local RNG state
    readout_error: float = 0.0        # symmetric readout flip probability r (contracts <Z> by 1-2r)
    device_baseline: bool = False     # True when a calibrated device noise baseline is configured


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

    # Per-component finite-shot std of a parameter-shift gradient estimate (~2,500 shots).
    BP_GRAD_SHOT_STD: float = 0.02

    def __init__(self, config: Optional[CircuitConfig] = None):
        self.config = config or CircuitConfig()
        self.epoch = 0
        self.prev_params: Optional[np.ndarray] = None
        self.active_injections: List[str] = []
        if self.config.reference_learning_rate is None:
            self.config.reference_learning_rate = float(self.config.learning_rate)

        # Fault-environment state
        self._noise_level: float = 0.0     # sigma_shot: finite-shot readout noise std
        self._depol_p: float = 0.0         # per-layer depolarizing probability
        self._bp_exponent: float = 0.0     # emulated gradient concentration exponent
        self._readout_err: float = 0.0     # symmetric readout error r
        self._device_baseline: bool = False

        # Model-local RNG. (The previous implementation called np.random.seed(), which
        # silently reset the *global* RNG every time a model or digital twin was built.)
        self.rng = np.random.RandomState(self.config.seed)
        self._prev_grad: Optional[np.ndarray] = None

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

    # ------------------------------------------------------------------
    # Noise Channel (single source of truth for forward pass AND gradients)
    # ------------------------------------------------------------------

    @property
    def noise_active(self) -> bool:
        return self._noise_level > 0.0 or self._depol_p > 0.0 or self._readout_err > 0.0

    def contraction_factor(self) -> float:
        """
        Expectation-value contraction under a per-layer global depolarizing channel and symmetric
        readout error: <Z>_noisy = (1 - p)^L (1 - 2r) <Z>_ideal. Depth-dependent, so shallower
        circuits are less damped.
        """
        c = 1.0
        if self._depol_p > 0.0:
            c *= (1.0 - self._depol_p) ** max(1, self.config.n_layers)
        if self._readout_err > 0.0:
            c *= (1.0 - 2.0 * self._readout_err)
        return float(max(0.05, c))

    def set_device_noise(self, per_layer_depolarizing: float, readout_error: float, shots: int = 1024) -> None:
        """
        Configure a hardware-calibrated noise BASELINE (present throughout, including healthy training):
        per-layer depolarizing probability derived from measured gate errors, the measured readout
        error, and finite-shot sampling noise sigma = 1/sqrt(shots) per expectation value.
        """
        self._depol_p = float(per_layer_depolarizing)
        self._readout_err = float(readout_error)
        self._noise_level = float(1.0 / np.sqrt(max(1, shots)))
        self._device_baseline = True

    def _apply_channel(self, expval: np.ndarray) -> np.ndarray:
        """
        Apply the simulated hardware channel to ideal expectation values:
          1. depolarizing contraction c = (1-p)^L,
          2. finite-shot readout noise N(0, sigma_shot^2),
          3. optional mitigation: rescale by 1/c (calibrated zero-noise-style correction).
        Mitigation removes the contraction bias but amplifies shot noise by 1/c, which is
        the same bias-variance trade-off that error mitigation incurs on hardware.
        """
        if not self.noise_active:
            return expval
        c = self.contraction_factor()
        noisy = c * expval
        if self._noise_level > 0.0:
            noisy = noisy + self.rng.normal(0.0, self._noise_level, size=np.shape(expval))
        if self.config.noise_mitigation:
            noisy = noisy / c
        return np.clip(noisy, -1.0, 1.0)

    def _raw_expvals(self, p: np.ndarray, X: np.ndarray) -> np.ndarray:
        try:
            return np.asarray(self.qnode(p, X), dtype=float)
        except Exception:
            # Fallback to sample-wise loop if ansatz/feature-map broadcasting fails
            return np.array([float(self.qnode(p, x)) for x in X], dtype=float)

    def predict_sample(self, x: np.ndarray, params: Optional[np.ndarray] = None) -> float:
        """Compute (noisy, if a channel is active) circuit expectation <Z_0> in [-1, 1] for one sample."""
        p = params if params is not None else self.params
        expval = np.array([float(self.qnode(p, x))])
        return float(self._apply_channel(expval)[0])

    def predict_proba(self, X: np.ndarray, params: Optional[np.ndarray] = None) -> np.ndarray:
        """Compute binary classification probabilities p(y=1|x) = (1 + <Z_0>) / 2 with vectorized batching."""
        p = params if params is not None else self.params
        expval = self._apply_channel(self._raw_expvals(p, X))
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
            if self.noise_active:
                contraction = self.contraction_factor()
                bx *= contraction
                by *= contraction
                bz *= contraction

            # Physical Bloch radius and purity for single-qubit reduced mixed state rho
            bloch_radius = float(np.sqrt(bx**2 + by**2 + bz**2))
            purity = float(0.5 * (1.0 + min(1.0, bloch_radius**2)))

            # If simulation-side noise mitigation is enabled, compute error-mitigated expectation-value
            # estimates separately (Zero-Noise Extrapolation / linear Richardson scaling) without
            # artificially purifying the true physical state.
            if self.config.noise_mitigation and self.noise_active:
                mitigation_factor = 1.0 / self.contraction_factor()
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

            # Vectorized evaluation across batch. Shifted circuits pass through the SAME noise
            # channel as the forward pass (previously gradients were computed noise-free, so the
            # injected noise never affected optimisation dynamics).
            expval_plus = self._apply_channel(self._raw_expvals(p_plus_shaped, X_batch))
            expval_minus = self._apply_channel(self._raw_expvals(p_minus_shaped, X_batch))
            d_expval = (expval_plus - expval_minus) / (2.0 * np.sin(shift))

            # Chain rule: dy_hat/d<Z_0> = 0.5
            dyhat_dtheta = 0.5 * d_expval
            # Accumulate batch gradient
            grads_flat[k] = np.mean(dl_dyhat * dyhat_dtheta)

        grads = grads_flat.reshape(param_shape)

        # Emulated barren-plateau concentration law: alpha = 10^(-e).
        # Exponential gradient concentration cannot be reproduced at simulable qubit counts
        # (measured Var[dC/dtheta] ~ 1e-2 at n = 4-8), so the fault model scales gradients by
        # alpha. The exponent is reduced by depth reduction and cleared by near-identity
        # re-initialisation (Grant et al., 2019), see RepairLibrary.
        # Crucially, gradient *magnitude* alone does not stall scale-invariant optimisers such as
        # Adam; the practical harm of a barren plateau is that the attenuated signal falls below the
        # finite-shot estimation noise of each parameter-shift term, which does not shrink with the
        # signal (McClean et al., 2018). The emulation therefore returns alpha*g + eps with
        # eps ~ N(0, BP_GRAD_SHOT_STD^2), i.e. a gradient SNR collapse.
        if self._bp_exponent > 0.0:
            grads = grads * (10.0 ** (-self._bp_exponent))
            grads = grads + self.rng.normal(0.0, self.BP_GRAD_SHOT_STD, size=grads.shape)

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

        # 1. Compute loss & accuracy before step (single forward pass reused for the margin)
        train_probs = self.predict_proba(X_train)
        train_loss = float(-np.mean(y_train * np.log(train_probs) + (1.0 - y_train) * np.log(1.0 - train_probs)))
        train_acc = float(np.mean((train_probs >= 0.5).astype(int) == y_train))
        # Label-aligned margin E[(2y-1)(2p-1)]: zero-mean shot noise averages out, while
        # depolarizing contraction scales it by (1-p)^L.
        output_margin = float(np.mean((2.0 * y_train - 1.0) * (2.0 * train_probs - 1.0)))
        output_magnitude = float(np.mean(np.abs(2.0 * train_probs - 1.0)))
        val_loss, val_acc = self.compute_loss_and_accuracy(X_val, y_val)

        # 2. Compute analytic parameter-shift gradients
        grads = self.compute_parameter_shift_gradients(X_train, y_train)

        # 3. Compute telemetry metrics
        grad_flat = grads.flatten()
        grad_norm = float(np.linalg.norm(grad_flat))
        grad_var = float(np.var(grad_flat)) if len(grad_flat) > 0 else 0.0
        grad_cos = float("nan")
        if self._prev_grad is not None and self._prev_grad.shape == grad_flat.shape:
            denom = float(np.linalg.norm(grad_flat) * np.linalg.norm(self._prev_grad))
            if np.isfinite(denom) and denom > 0.0:
                grad_cos = float(np.dot(grad_flat, self._prev_grad) / denom)
        self._prev_grad = grad_flat.copy() if np.all(np.isfinite(grad_flat)) else None

        # 4. Update parameters using optimizer
        self.prev_params = self.params.copy()
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
            output_margin=output_margin,
            grad_cosine=grad_cos,
            output_magnitude=output_magnitude,
        )
        return metrics

    # ------------------------------------------------------------------
    # Failure Injection Hooks
    # ------------------------------------------------------------------

    def inject_failure(self, failure_type: FailureType, severity: float = 1.0, mode: str = "default") -> Dict[str, Any]:
        """
        Inject a controlled fault into VQC training (fault-injection campaign semantics).

        Fault model (each fault perturbs a concrete, inspectable part of the training state,
        and every fault is in principle repairable by at least one action):
          barren_plateau        emulated gradient concentration alpha = 10^-6 (mode='default'), or
                                deep (L>=8) Haar-scrambled re-initialisation + concentration
                                (mode='structural').
          lr_misconfiguration   step size scaled up by 50 x severity (oscillation / blow-up).
          optimizer_instability optimizer moment buffers inverted/amplified and decays corrupted.
          training_divergence   parameter tensor set to NaN (numerical fault).
          persistent_plateau    step-size collapse: learning rate scaled by 1e-3 (stagnation with
                                non-vanishing gradients). Replaces the former, unphysical
                                "parameters pinned forever" injection that no repair could undo.
          noise_degradation     per-layer depolarizing channel p = 0.12 x severity plus finite-shot
                                readout noise sigma = 0.15 x severity.
        """
        report: Dict[str, Any] = {"failure_type": failure_type.value, "severity": severity, "epoch": self.epoch}

        if failure_type == FailureType.BARREN_PLATEAU:
            if mode == "structural":
                self.config.n_layers = max(8, int(self.config.n_layers * 4))
                self.config.seed = int(self.rng.randint(0, 10000))
                self._init_circuit()
                rng = np.random.RandomState(self.config.seed)
                if self.config.ansatz_type == "basic_entangling":
                    self.params = rng.uniform(0.0, 2.0 * np.pi, size=(self.config.n_layers, self.config.n_qubits))
                else:
                    self.params = rng.uniform(0.0, 2.0 * np.pi, size=(self.config.n_layers, self.config.n_qubits, 3))
                self.prev_params = self.params.copy()
                # Optimizer buffers no longer match the new parameter shape
                self.optimizer = create_optimizer(self.config.optimizer_name, self.optimizer.lr)
                self._bp_exponent = 6.0
                self.active_injections.append("barren_plateau_structural")
                report["action"] = f"Expanded circuit depth to {self.config.n_layers} with Haar-random parameters"
            else:
                self._bp_exponent = 6.0
                self.active_injections.append("barren_plateau_synth")
                report["action"] = "Activated emulated gradient concentration (alpha = 1e-6, gradient SNR << 1)"

        elif failure_type == FailureType.LR_MISCONFIGURATION:
            scale = 50.0 * severity
            self.optimizer.lr *= scale
            self.config.learning_rate = self.optimizer.lr
            self.active_injections.append("lr_misconfiguration")
            report["action"] = f"Scaled learning rate by {scale:.1f}x to {self.optimizer.lr:.4f}"

        elif failure_type == FailureType.OPTIMIZER_INSTABILITY:
            if isinstance(self.optimizer, AdamOptimizer):
                if self.optimizer.m is not None:
                    self.optimizer.m = -10.0 * self.optimizer.m
                    self.optimizer.v = 1e-4 * np.ones_like(self.optimizer.v)
                self.optimizer.beta1 = 0.9999
                self.optimizer.beta2 = 0.1
            elif isinstance(self.optimizer, SGDOptimizer):
                if self.optimizer.v is not None:
                    self.optimizer.v = -10.0 * self.optimizer.v
                self.optimizer.momentum = 0.999
            elif isinstance(self.optimizer, RMSpropOptimizer):
                if self.optimizer.v is not None:
                    self.optimizer.v = 1e-6 * np.ones_like(self.optimizer.v)
                self.optimizer.alpha = 0.1
            self.active_injections.append("optimizer_instability")
            report["action"] = "Corrupted optimizer moment buffers and decay coefficients"

        elif failure_type == FailureType.TRAINING_DIVERGENCE:
            self.params = np.full_like(self.params, np.nan)
            self.active_injections.append("training_divergence")
            report["action"] = "Set parameter tensor to NaN to trigger immediate loss divergence"

        elif failure_type == FailureType.PERSISTENT_PLATEAU:
            self.optimizer.lr *= 1e-3
            self.config.learning_rate = self.optimizer.lr
            self.active_injections.append("persistent_plateau")
            report["action"] = f"Collapsed step size by 1e-3 to {self.optimizer.lr:.2e} (stagnation with live gradients)"

        elif failure_type == FailureType.NOISE_DEGRADATION and self._device_baseline:
            # Calibration-drift event on a calibrated device: error rates multiply by 4 x severity
            # (3-5x over the campaign's severity range).
            k = 4.0 * severity
            self._depol_p = float(min(0.45, self._depol_p * k))
            self._readout_err = float(min(0.25, self._readout_err * k))
            self.active_injections.append("noise_degradation")
            report["action"] = (
                f"Device drift: error rates x{k:.2f} -> per-layer p={self._depol_p:.3f}, "
                f"readout r={self._readout_err:.3f} (contraction {self.contraction_factor():.3f})"
            )

        elif failure_type == FailureType.NOISE_DEGRADATION:
            self._depol_p = float(min(0.45, 0.12 * severity))
            self._noise_level = float(0.15 * severity)
            self.active_injections.append("noise_degradation")
            report["action"] = (
                f"Activated per-layer depolarizing channel p={self._depol_p:.3f} "
                f"(contraction {self.contraction_factor():.3f}) and shot noise sigma={self._noise_level:.3f}"
            )

        else:
            raise ValueError(f"Unknown failure type: {failure_type}")

        return report

    # ------------------------------------------------------------------
    # Atomic State Serialization & Rollback
    # ------------------------------------------------------------------

    def get_state(self) -> ModelState:
        """Export an immutable, deep-copied model snapshot (including fault-environment and RNG state)."""
        cfg = replace(self.config, learning_rate=self.optimizer.lr)
        return ModelState(
            params=self.params.copy(),
            config=cfg,
            optimizer_state=deepcopy(self.optimizer.get_state()),
            epoch=self.epoch,
            active_injections=list(self.active_injections),
            noise_level=self._noise_level,
            depolarizing_p=self._depol_p,
            bp_exponent=self._bp_exponent,
            rng_state=self.rng.get_state(),
            readout_error=self._readout_err,
            device_baseline=self._device_baseline,
        )

    def set_state(self, state: ModelState) -> None:
        """Restore model completely from a snapshot (rollback support)."""
        self.config = replace(state.config)
        if self.config.reference_learning_rate is None:
            self.config.reference_learning_rate = float(self.config.learning_rate)
        self.epoch = state.epoch
        self.active_injections = list(state.active_injections)
        # Restore the exact fault environment (previously hard-coded to 0.25 regardless of severity)
        self._noise_level = float(getattr(state, "noise_level", 0.0))
        self._depol_p = float(getattr(state, "depolarizing_p", 0.0))
        self._bp_exponent = float(getattr(state, "bp_exponent", 0.0))
        self._readout_err = float(getattr(state, "readout_error", 0.0))
        self._device_baseline = bool(getattr(state, "device_baseline", False))
        if getattr(state, "rng_state", None) is not None:
            self.rng.set_state(state.rng_state)

        # Reconstruct circuit with restored config
        self._init_circuit()
        self.params = state.params.copy()
        self.prev_params = self.params.copy()
        self._prev_grad = None

        # Restore optimizer and its internal buffers
        self.optimizer = create_optimizer(self.config.optimizer_name, self.config.learning_rate)
        self.optimizer.set_state(deepcopy(state.optimizer_state))
