"""
Exact, vectorised statevector engine for VQCModel (used by the 8-qubit campaign, regime q8).

PennyLane's default.qubit spends most of an 8-qubit training step in per-call overhead (about 33
QNode calls per parameter-shift gradient at L = 2, 129 at L = 8). This module replaces only the
CIRCUIT EVALUATION of backend.qml_model.VQCModel; every other part of the model (loss, optimiser,
noise channel and its random stream, fault injection, emulated plateau, repairs) is untouched.

  * forward pass: the same circuit as VQCModel._init_circuit (angle or IQP feature map,
    basic-entangling RY + CNOT-ring ansatz), simulated on a (batch, 2^n) statevector, wire 0 most
    significant as in PennyLane;
  * gradient, noiseless channel: exact adjoint differentiation of <Z_0>. For RY gates the
    parameter-shift rule (E(theta + pi/2) - E(theta - pi/2)) / 2 is exact, so this equals what
    compute_parameter_shift_gradients returns, up to floating-point rounding;
  * gradient, active noise channel: the shifted circuits are evaluated explicitly (batched), and the
    channel is applied in exactly the original order (forward pass, then +shift / -shift for each
    parameter), so the random stream is consumed identically.

Configurations outside this family (strongly-entangling ansatz) fall back to PennyLane.
`verify()` checks forward values and gradients against the PennyLane implementation.

    from research import fast_sim; fast_sim.install()
"""

import numpy as np

from backend.qml_model import VQCModel

_ORIG = {}


def _supported(cfg) -> bool:
    return cfg.ansatz_type == "basic_entangling" and cfg.feature_map in ("angle", "iqp")


_PERM = {}


def _cnot_perm(n, c, t):
    key = (n, c, t)
    if key not in _PERM:
        idx = np.arange(2 ** n)
        bc = (idx >> (n - 1 - c)) & 1
        _PERM[key] = np.where(bc == 1, idx ^ (1 << (n - 1 - t)), idx)
    return _PERM[key]


def _view(psi, n, q):
    return psi.reshape(psi.shape[0], 2 ** q, 2, 2 ** (n - q - 1))


def _ry(psi, n, q, theta):
    """In-place-free RY(theta) on wire q; theta scalar or (N,)."""
    v = _view(psi, n, q)
    th = np.asarray(theta, dtype=float).reshape(-1, 1, 1) if np.ndim(theta) else theta
    c, s = np.cos(th / 2), np.sin(th / 2)
    a0, a1 = v[:, :, 0, :], v[:, :, 1, :]
    out = np.empty_like(v)
    out[:, :, 0, :] = c * a0 - s * a1
    out[:, :, 1, :] = s * a0 + c * a1
    return out.reshape(psi.shape)


def _dry(psi, n, q, theta):
    """d RY(theta) / d theta applied to psi."""
    v = _view(psi, n, q)
    th = np.asarray(theta, dtype=float).reshape(-1, 1, 1) if np.ndim(theta) else theta
    c, s = np.cos(th / 2), np.sin(th / 2)
    a0, a1 = v[:, :, 0, :], v[:, :, 1, :]
    out = np.empty_like(v)
    out[:, :, 0, :] = 0.5 * (-s * a0 - c * a1)
    out[:, :, 1, :] = 0.5 * (c * a0 - s * a1)
    return out.reshape(psi.shape)


def _h(psi, n, q):
    v = _view(psi, n, q)
    a0, a1 = v[:, :, 0, :], v[:, :, 1, :]
    out = np.empty_like(v)
    r = 1.0 / np.sqrt(2.0)
    out[:, :, 0, :] = r * (a0 + a1)
    out[:, :, 1, :] = r * (a0 - a1)
    return out.reshape(psi.shape)


def _rz(psi, n, q, phi):
    v = _view(psi, n, q)
    ph = np.asarray(phi, dtype=float).reshape(-1, 1)
    out = np.empty_like(v)
    out[:, :, 0, :] = np.exp(-0.5j * ph)[:, :, None] * v[:, :, 0, :]
    out[:, :, 1, :] = np.exp(0.5j * ph)[:, :, None] * v[:, :, 1, :]
    return out.reshape(psi.shape)


def _cnot(psi, n, c, t):
    return psi[:, _cnot_perm(n, c, t)]


def _encode(cfg, X):
    """State after the feature map for a batch X of shape (N, n_features)."""
    n = cfg.n_qubits
    N, nf = X.shape
    if cfg.feature_map == "angle":
        psi = np.zeros((N, 2 ** n))
        psi[:, 0] = 1.0
        for i in range(min(nf, n)):
            psi = _ry(psi, n, i, X[:, i])
        return psi
    psi = np.zeros((N, 2 ** n), dtype=complex)
    psi[:, 0] = 1.0
    for i in range(n):
        psi = _h(psi, n, i)
        psi = _rz(psi, n, i, 2.0 * X[:, i % nf])
    for i in range(n - 1):
        xi, xj = X[:, i % nf], X[:, (i + 1) % nf]
        psi = _cnot(psi, n, i, i + 1)
        psi = _rz(psi, n, i + 1, 2.0 * (np.pi - xi) * (np.pi - xj))
        psi = _cnot(psi, n, i, i + 1)
    return psi


def _ansatz(psi, n, P):
    """P: (L, n) shared, or (N, L, n) per state."""
    per = P.ndim == 3
    L = P.shape[-2]
    for l in range(L):
        for q in range(n):
            psi = _ry(psi, n, q, P[:, l, q] if per else P[l, q])
        if n > 1:
            for q in range(n):
                psi = _cnot(psi, n, q, (q + 1) % n)
    return psi


def _z0(psi):
    p = np.abs(psi) ** 2
    h = p.shape[1] // 2
    return p[:, :h].sum(1) - p[:, h:].sum(1)


def expvals(cfg, P, X):
    X = np.atleast_2d(np.asarray(X, dtype=float))
    return _z0(_ansatz(_encode(cfg, X), cfg.n_qubits, np.asarray(P, dtype=float)))


def adjoint_grad(cfg, P, X):
    """Exact d<Z_0>/d theta for every parameter and sample: returns (n_params, B) in P.flatten() order."""
    n = cfg.n_qubits
    P = np.asarray(P, dtype=float)
    L = P.shape[0]
    X = np.atleast_2d(np.asarray(X, dtype=float))
    psi = _ansatz(_encode(cfg, X), n, P)
    lam = psi.copy()
    lam[:, 2 ** n // 2:] *= -1.0                       # Z_0 |psi>
    G = np.zeros((L, n, X.shape[0]))
    for l in reversed(range(L)):
        if n > 1:
            for q in reversed(range(n)):
                psi = _cnot(psi, n, q, (q + 1) % n)    # CNOT is self-inverse; undo with the inverse permutation
                lam = _cnot(lam, n, q, (q + 1) % n)
        for q in reversed(range(n)):
            psi = _ry(psi, n, q, -P[l, q])
            mu = _dry(psi, n, q, P[l, q])
            G[l, q] = 2.0 * np.real(np.sum(np.conj(lam) * mu, axis=1))
            lam = _ry(lam, n, q, -P[l, q])
    return G.reshape(L * n, -1)


# ----------------------------------------------------------------------------------------------
# Patched VQCModel methods
# ----------------------------------------------------------------------------------------------

def _raw_expvals(self, p, X):
    if not _supported(self.config):
        return _ORIG["_raw_expvals"](self, p, X)
    return expvals(self.config, p, X)


def _param_shift(self, X_batch, y_batch, params=None):
    if not _supported(self.config):
        return _ORIG["compute_parameter_shift_gradients"](self, X_batch, y_batch, params)
    p = params if params is not None else self.params
    shape = p.shape
    probs = self.predict_proba(X_batch, p)
    dl_dyhat = (probs - y_batch) / (probs * (1.0 - probs) + 1e-12)
    if not self.noise_active:
        dE = adjoint_grad(self.config, p, X_batch)                       # (n_params, B)
    else:
        flat = p.flatten()
        K, B = len(flat), len(X_batch)
        Pp = np.repeat(flat[None], K, 0); Pp[np.arange(K), np.arange(K)] += np.pi / 2
        Pm = np.repeat(flat[None], K, 0); Pm[np.arange(K), np.arange(K)] -= np.pi / 2
        Ps = np.concatenate([Pp, Pm]).reshape((2 * K,) + shape)
        Ps = np.repeat(Ps, B, axis=0)                                      # (2K*B, L, n)
        Xs = np.tile(np.asarray(X_batch, dtype=float), (2 * K, 1))
        raw = expvals(self.config, Ps, Xs).reshape(2 * K, B)
        dE = np.empty((K, B))
        for k in range(K):                                                # same channel/RNG order as the original
            ep = self._apply_channel(raw[k])
            em = self._apply_channel(raw[K + k])
            dE[k] = (ep - em) / (2.0 * np.sin(np.pi / 2))
    grads = np.mean(dl_dyhat[None, :] * 0.5 * dE, axis=1).reshape(shape)
    if self._bp_exponent > 0.0:                                           # emulated plateau, unchanged
        grads = grads * (10.0 ** (-self._bp_exponent))
        grads = grads + self.rng.normal(0.0, self.BP_GRAD_SHOT_STD, size=grads.shape)
    return grads


def install():
    if _ORIG:
        return
    _ORIG["_raw_expvals"] = VQCModel._raw_expvals
    _ORIG["compute_parameter_shift_gradients"] = VQCModel.compute_parameter_shift_gradients
    VQCModel._raw_expvals = _raw_expvals
    VQCModel.compute_parameter_shift_gradients = _param_shift


def uninstall():
    for k, f in _ORIG.items():
        setattr(VQCModel, k, f)
    _ORIG.clear()


def verify(seed: int = 0) -> dict:
    """Max abs difference vs the PennyLane implementation (forward values and loss gradients)."""
    from backend.qml_model import CircuitConfig
    rng = np.random.RandomState(seed)
    worst = {"forward": 0.0, "grad_noiseless": 0.0, "grad_noisy": 0.0}
    was = bool(_ORIG)
    uninstall()
    for n, L, fm in ((4, 2, "angle"), (4, 3, "iqp"), (8, 2, "angle"), (8, 8, "angle"), (8, 2, "iqp")):
        X = rng.uniform(0, np.pi, size=(12, n))
        y = rng.randint(0, 2, size=12)
        for noisy in (False, True):
            m = VQCModel(CircuitConfig(n_qubits=n, n_layers=L, feature_map=fm, seed=seed))
            m.params = rng.uniform(0, 2 * np.pi, size=m.params.shape)
            if noisy:
                m._depol_p, m._noise_level = 0.1, 0.05
            st = m.rng.get_state()
            f_ref = m._raw_expvals(m.params, X)
            g_ref = m.compute_parameter_shift_gradients(X, y)
            install()
            m.rng.set_state(st)
            f_new = m._raw_expvals(m.params, X)
            g_new = m.compute_parameter_shift_gradients(X, y)
            uninstall()
            worst["forward"] = max(worst["forward"], float(np.max(np.abs(f_ref - f_new))))
            k = "grad_noisy" if noisy else "grad_noiseless"
            worst[k] = max(worst[k], float(np.max(np.abs(g_ref - g_new))))
    if was:
        install()
    return worst


if __name__ == "__main__":
    import time
    print(verify())
    from backend.qml_model import CircuitConfig
    from research.datasets import load_splits
    sp = load_splits("breast_cancer", 0, 8)
    install()
    for L in (2, 8):
        m = VQCModel(CircuitConfig(n_qubits=8, n_layers=L, seed=0))
        t = time.time()
        for _ in range(5):
            m.train_step(sp.X_train, sp.y_train, sp.X_val, sp.y_val)
        print(f"8 qubits L={L}: {(time.time() - t) / 5:.3f} s/step")
