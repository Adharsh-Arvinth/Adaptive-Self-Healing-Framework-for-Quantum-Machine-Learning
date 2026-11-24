"""
Benchmark datasets for the QML self-healing study.

Eleven binary tasks:
  - four UCI datasets shipped with scikit-learn (Iris, Breast Cancer Wisconsin, Wine, Digits),
  - two further real tabular datasets downloaded from OpenML (Banknote Authentication, Pima Diabetes),
  - three datasets from the QML benchmark suite of Bowles, Ahmed & Schuld (2024), downloaded from
    PennyLane's dataset service (hidden-manifold, two-curves, linearly-separable; 4-feature variants),
  - two synthetic geometric controls (moons, circles).
Downloaded files live in research/external/ with provenance in research/external/README.md.
Every dataset is reduced to a binary task with 4 input features so that one 4-qubit
variational classifier architecture is used throughout.

Preprocessing is fit on the TRAINING split only (StandardScaler -> PCA(4) -> MinMax[0, pi]);
the other splits are transformed with the train-fitted maps and clipped to [0, pi].
This avoids the common leakage of fitting scalers/PCA on the full dataset.

Splits (stratified): train 55% | twin 10% | val 15% | test 20%
  train : optimisation
  twin  : digital-twin proxy optimisation (never used for acceptance decisions)
  val   : online telemetry + post-repair acceptance window (what a practitioner monitors)
  test  : held-out, used ONLY for reporting recovery outcomes
"""

import csv
import os
from dataclasses import dataclass
from typing import Dict, Tuple

import numpy as np
from sklearn.datasets import load_breast_cancer, load_digits, load_iris, load_wine, make_circles, make_moons
from sklearn.decomposition import PCA
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, StandardScaler

N_FEATURES = 4
MAX_SAMPLES = 300

DATASET_INFO: Dict[str, Dict[str, str]] = {
    "iris": {"source": "UCI Iris (Fisher, 1936)", "task": "versicolor vs. virginica", "kind": "real"},
    "breast_cancer": {"source": "UCI Breast Cancer Wisconsin (Diagnostic)", "task": "malignant vs. benign", "kind": "real"},
    "wine": {"source": "UCI Wine", "task": "cultivar 1 vs. cultivar 2", "kind": "real"},
    "digits": {"source": "UCI Optical Recognition of Handwritten Digits", "task": "digit 3 vs. digit 8", "kind": "real"},
    "banknote": {"source": "UCI Banknote Authentication (OpenML id 1462)", "task": "genuine vs. forged", "kind": "real"},
    "pima_diabetes": {"source": "Pima Indians Diabetes (OpenML id 37)", "task": "tested negative vs. positive", "kind": "real"},
    "hidden_manifold": {"source": "QML benchmark suite, hidden-manifold d=4 (Bowles et al., 2024; PennyLane datasets)", "task": "manifold label", "kind": "qml-benchmark"},
    "two_curves": {"source": "QML benchmark suite, two-curves d=4 (Bowles et al., 2024; PennyLane datasets)", "task": "curve A vs. curve B", "kind": "qml-benchmark"},
    "linearly_separable": {"source": "QML benchmark suite, linearly-separable d=4 (Bowles et al., 2024; PennyLane datasets)", "task": "half-space label", "kind": "qml-benchmark"},
    "moons": {"source": "synthetic (two interleaving half-moons, noise 0.15)", "task": "moon A vs. moon B", "kind": "synthetic"},
    "circles": {"source": "synthetic (concentric circles, factor 0.5, noise 0.08)", "task": "inner vs. outer", "kind": "synthetic"},
}
DATASETS = list(DATASET_INFO.keys())


@dataclass
class Splits:
    name: str
    X_train: np.ndarray
    y_train: np.ndarray
    X_twin: np.ndarray
    y_twin: np.ndarray
    X_val: np.ndarray
    y_val: np.ndarray
    X_test: np.ndarray
    y_test: np.ndarray
    n_raw_features: int
    n_total: int


EXTERNAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "external")


def _csv(path: str, drop=()) -> Tuple[np.ndarray, np.ndarray]:
    """Load a downloaded dataset (see research/external/README.md for provenance)."""
    with open(path, encoding="utf-8") as f:
        rows = list(csv.reader(f))
    header, body = rows[0], rows[1:]
    keep = [i for i, h in enumerate(header) if h not in drop and h != "y"]
    yi = header.index("y")
    X = np.array([[float(r[i]) for i in keep] for r in body])
    y = np.array([int(r[yi]) for r in body])
    return X, y


def _raw(name: str) -> Tuple[np.ndarray, np.ndarray]:
    if name == "iris":
        d = load_iris()
        m = d.target > 0
        return d.data[m], (d.target[m] == 2).astype(int)
    if name == "breast_cancer":
        d = load_breast_cancer()
        return d.data, d.target.astype(int)
    if name == "wine":
        d = load_wine()
        m = d.target < 2
        return d.data[m], d.target[m].astype(int)
    if name == "digits":
        d = load_digits()
        m = (d.target == 3) | (d.target == 8)
        return d.data[m], (d.target[m] == 8).astype(int)
    if name in ("banknote", "pima_diabetes"):
        return _csv(os.path.join(EXTERNAL, "openml", f"{name}.csv"))
    if name in ("hidden_manifold", "two_curves", "linearly_separable"):
        return _csv(os.path.join(EXTERNAL, "qml_benchmarks", f"{name.replace('_', '-')}_d4.csv"), drop=("orig_split",))
    if name == "moons":
        X, y = make_moons(n_samples=MAX_SAMPLES, noise=0.15, random_state=0)
        return X, y.astype(int)
    if name == "circles":
        X, y = make_circles(n_samples=MAX_SAMPLES, factor=0.5, noise=0.08, random_state=0)
        return X, y.astype(int)
    raise ValueError(f"Unknown dataset {name}")


def load_splits(name: str, seed: int, n_features: int = N_FEATURES) -> Splits:
    """Stratified, seed-dependent splits with train-only preprocessing.

    n_features: width of the encoded input (= number of qubits). Tasks with more raw features are
    reduced with a train-fitted PCA(n_features); tasks with fewer are re-uploaded cyclically.
    The 8-qubit regime (q8) uses n_features = 8.
    """
    X, y = _raw(name)
    n_raw = X.shape[1]
    rng = np.random.RandomState(seed)
    if len(X) > MAX_SAMPLES:
        idx, _ = train_test_split(np.arange(len(X)), train_size=MAX_SAMPLES, stratify=y, random_state=seed)
        X, y = X[idx], y[idx]
    n = len(X)

    X_tr, X_rest, y_tr, y_rest = train_test_split(X, y, train_size=0.55, stratify=y, random_state=seed)
    # rest = 45% -> twin 10 / val 15 / test 20  (fractions of the remainder: 2/9, 3/9, 4/9)
    X_tw, X_rest2, y_tw, y_rest2 = train_test_split(X_rest, y_rest, train_size=2 / 9, stratify=y_rest, random_state=seed + 1)
    X_va, X_te, y_va, y_te = train_test_split(X_rest2, y_rest2, train_size=3 / 7, stratify=y_rest2, random_state=seed + 2)

    scaler = StandardScaler().fit(X_tr)
    if n_raw > n_features:
        pca = PCA(n_components=n_features, random_state=seed).fit(scaler.transform(X_tr))
        f = lambda A: pca.transform(scaler.transform(A))
    else:
        f = lambda A: scaler.transform(A)
    Z_tr = f(X_tr)
    mm = MinMaxScaler(feature_range=(0.0, np.pi)).fit(Z_tr)

    def g(A: np.ndarray) -> np.ndarray:
        Z = np.clip(mm.transform(f(A)), 0.0, np.pi)
        if Z.shape[1] < n_features:  # fewer raw features than qubits: re-upload features cyclically
            Z = np.concatenate([Z] * int(np.ceil(n_features / Z.shape[1])), axis=1)[:, :n_features]
        return Z

    _ = rng  # seed retained for API symmetry
    return Splits(
        name=name,
        X_train=g(X_tr), y_train=y_tr,
        X_twin=g(X_tw), y_twin=y_tw,
        X_val=g(X_va), y_val=y_va,
        X_test=g(X_te), y_test=y_te,
        n_raw_features=n_raw, n_total=n,
    )


if __name__ == "__main__":
    for ds in DATASETS:
        s = load_splits(ds, 0)
        print(f"{ds:14s} n={s.n_total:3d} raw_d={s.n_raw_features:2d} train={len(s.y_train)} twin={len(s.y_twin)} "
              f"val={len(s.y_val)} test={len(s.y_test)} pos_rate={s.y_train.mean():.2f}")
