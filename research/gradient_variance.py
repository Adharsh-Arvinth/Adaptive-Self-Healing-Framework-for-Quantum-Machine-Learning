"""
Genuine gradient concentration of the framework's circuit vs the emulated barren plateau.

    python -m research.gradient_variance          # writes research/results/q8/gradient_variance.json

The campaign's barren-plateau fault is EMULATED: parameter-shift gradients are scaled by
alpha = 1e-6 and finite-shot noise N(0, 0.02^2) is added (backend/qml_model.py), i.e. a gradient
SNR collapse. This script measures how strongly REAL circuits concentrate, so the gap between the
emulation and genuine barren plateaus can be stated as a number.

Measured quantity: Var_theta,x[ d<Z_0>/d theta_k ] by exact parameter shift on a vectorised
statevector simulator (verified against the PennyLane QNode of backend.qml_model), for
  * the framework's ansatz (angle RY encoding, L x [RY on every qubit + ring of CNOTs]),
    - "healthy": parameters ~ U[-0.2, 0.2] (the framework's initialisation), L = 2;
    - "random":  parameters ~ U[0, 2 pi] (scrambled, as after the structural plateau fault);
  * a McClean et al. (2018) style hardware-efficient ansatz (random Pauli-axis rotations
    RX/RY/RZ on every qubit + CZ ladder, after an initial RY(pi/4) layer), random parameters.
k is the first-layer rotation on qubit 0 and on the last qubit (the latter has to propagate through the
entangler to reach the measured qubit).

The emulated plateau is mapped into the same units as an equivalent gradient standard deviation
alpha * std_healthy, and an exponential fit Var ~ 10^(a - b n) on the deep random circuits is
extrapolated to the qubit count at which genuine concentration would reach it.
"""

import json
import os
import time

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "research", "results", "q8")
ALPHA = 1e-6            # emulated concentration factor (VQCModel._bp_exponent = 6)
BP_SHOT_STD = 0.02      # VQCModel.BP_GRAD_SHOT_STD
SHOTS = 1024            # shot budget the emulated noise corresponds to: std of a parameter-shift
                        # difference of two 1,024-shot <Z> estimates is ~ 1/sqrt(2*1024) = 0.022

# ----------------------------------------------------------------------------------------------
# Vectorised statevector simulator (batch of B states, n qubits), qubit 0 = most significant axis
# ----------------------------------------------------------------------------------------------


def _apply_1q(psi, n, q, U):
    """psi: (B, 2,...,2); U: (B, 2, 2) per-batch single-qubit gate on qubit q."""
    psi = np.moveaxis(psi, q + 1, 1)                       # (B, 2, rest...)
    sh = psi.shape
    psi = psi.reshape(sh[0], 2, -1)
    psi = np.einsum("bij,bjk->bik", U, psi)
    return np.moveaxis(psi.reshape(sh), 1, q + 1)


def _ry(theta):
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.stack([np.stack([c, -s], -1), np.stack([s, c], -1)], -2).astype(complex)


def _rx(theta):
    c, s = np.cos(theta / 2), np.sin(theta / 2)
    return np.stack([np.stack([c + 0j, -1j * s], -1), np.stack([-1j * s, c + 0j], -1)], -2)


def _rz(theta):
    e = np.exp(-0.5j * theta)
    z = np.zeros_like(e)
    return np.stack([np.stack([e, z], -1), np.stack([z, np.conj(e)], -1)], -2)


def _cnot(psi, c, t):
    psi = psi.copy()
    idx = [slice(None)] * psi.ndim
    idx[c + 1] = 1
    sub = psi[tuple(idx)]                                  # control = 1 slice; target axis shifts if t > c
    tt = t if t < c else t - 1
    psi[tuple(idx)] = np.flip(sub, axis=tt + 1)
    return psi


def _cz(psi, a, b):
    psi = psi.copy()
    idx = [slice(None)] * psi.ndim
    idx[a + 1] = 1
    idx[b + 1] = 1
    psi[tuple(idx)] *= -1
    return psi


def _z0(psi):
    p = np.abs(psi) ** 2
    return p[:, 0].reshape(p.shape[0], -1).sum(1) - p[:, 1].reshape(p.shape[0], -1).sum(1)


def framework_expval(params, X):
    """params: (B, L, n); X: (B, n). Angle RY encoding + L x [RY layer, CNOT ring]  (backend ansatz)."""
    B, L, n = params.shape
    psi = np.zeros((B,) + (2,) * n, dtype=complex)
    psi[(slice(None),) + (0,) * n] = 1.0
    for i in range(n):
        psi = _apply_1q(psi, n, i, _ry(X[:, i]))
    for l in range(L):
        for q in range(n):
            psi = _apply_1q(psi, n, q, _ry(params[:, l, q]))
        if n > 1:
            for q in range(n):
                psi = _cnot(psi, q, (q + 1) % n)
    return _z0(psi)


def mcclean_expval(params, axes):
    """McClean et al. (2018): RY(pi/4) layer, then L x [random-axis rotation on each qubit, CZ ladder]."""
    B, L, n = params.shape
    psi = np.zeros((B,) + (2,) * n, dtype=complex)
    psi[(slice(None),) + (0,) * n] = 1.0
    for i in range(n):
        psi = _apply_1q(psi, n, i, _ry(np.full(B, np.pi / 4)))
    gates = (_rx, _ry, _rz)
    for l in range(L):
        for q in range(n):
            U = np.empty((B, 2, 2), dtype=complex)
            for g in range(3):
                m = axes[:, l, q] == g
                if m.any():
                    U[m] = gates[g](params[m, l, q])
            psi = _apply_1q(psi, n, q, U)
        for q in range(n - 1):
            psi = _cz(psi, q, q + 1)
    return _z0(psi)


def shift_grad(f, params, k, *args):
    """Exact parameter-shift derivative d<Z_0>/d theta_k for every batch element."""
    lq = np.unravel_index(k, params.shape[1:])
    pp, pm = params.copy(), params.copy()
    pp[(slice(None),) + lq] += np.pi / 2
    pm[(slice(None),) + lq] -= np.pi / 2
    return 0.5 * (f(pp, *args) - f(pm, *args))


# ----------------------------------------------------------------------------------------------


def _verify_against_pennylane(rng):
    from backend.qml_model import CircuitConfig, VQCModel
    errs = []
    for n, L in ((4, 2), (8, 3)):
        m = VQCModel(CircuitConfig(n_qubits=n, n_layers=L, seed=0))
        P = rng.uniform(0, 2 * np.pi, size=(L, n))
        X = rng.uniform(0, np.pi, size=(5, n))
        ref = np.asarray(m.qnode(P, X), dtype=float)
        ours = framework_expval(np.repeat(P[None], 5, 0), X)
        errs.append(float(np.max(np.abs(ref - ours))))
    return max(errs)


def measure(n, L, kind, n_samples, rng, batch=512):
    """Return {param_label: (var, mean)} over n_samples random (theta, x) draws."""
    res = {}
    ks = {"q0": 0, "q_last": n - 1}  # first-layer rotation on qubit 0 / on the last qubit
    vals = {lab: [] for lab in ks}
    done = 0
    while done < n_samples:
        b = min(batch, n_samples - done)
        if kind == "framework_healthy":
            P = rng.uniform(-0.2, 0.2, size=(b, L, n))
        else:
            P = rng.uniform(0, 2 * np.pi, size=(b, L, n))
        if kind == "mcclean_random":
            axes = rng.randint(0, 3, size=(b, L, n))
            for lab, k in ks.items():
                vals[lab].append(shift_grad(mcclean_expval, P, k, axes))
        else:
            X = rng.uniform(0, np.pi, size=(b, n))
            for lab, k in ks.items():
                vals[lab].append(shift_grad(framework_expval, P, k, X))
        done += b
    for lab in ks:
        v = np.concatenate(vals[lab])
        # bootstrap SE of the variance
        bs = [np.var(v[rng.randint(0, len(v), len(v))]) for _ in range(200)]
        res[lab] = {"var": float(np.var(v)), "var_se": float(np.std(bs)), "mean": float(np.mean(v)),
                    "std": float(np.std(v)), "n": int(len(v))}
    return res


def main():
    os.makedirs(OUT, exist_ok=True)
    rng = np.random.RandomState(2024)
    t0 = time.time()
    max_err = _verify_against_pennylane(rng)
    print(f"statevector vs PennyLane max |diff| = {max_err:.2e}")
    qubits = [2, 4, 6, 8, 10, 12]
    depths = [2, 8, 32]
    out = {"description": __doc__.strip().split("\n\n")[0], "alpha": ALPHA, "bp_shot_std": BP_SHOT_STD,
           "shots": SHOTS, "verification_max_abs_diff": max_err, "rows": []}
    for n in qubits:
        ns = 4000 if n <= 8 else (1500 if n <= 10 else 600)
        for kind, Ls in (("framework_healthy", [2]), ("framework_random", depths), ("mcclean_random", depths)):
            for L in Ls:
                r = measure(n, L, kind, ns, rng)
                row = {"n_qubits": n, "layers": L, "kind": kind, **{f"{lab}_{k}": v for lab, d in r.items() for k, v in d.items()}}
                out["rows"].append(row)
                print(f"n={n:2d} L={L:2d} {kind:18s} Var(q0)={r['q0']['var']:.3e}  Var(q_last)={r['q_last']['var']:.3e}  ({time.time()-t0:.0f}s)", flush=True)

    rows = out["rows"]

    def get(n, L, kind, lab="q0"):
        return next(r[f"{lab}_var"] for r in rows if r["n_qubits"] == n and r["layers"] == L and r["kind"] == kind)

    # Exponential fits log10 Var = a - b n on the deepest random circuits
    fits = {}
    Ldeep = max(depths)
    for kind in ("framework_random", "mcclean_random"):
        for lab in ("q0", "q_last"):
            ns_ = np.array(qubits, dtype=float)
            v = np.array([get(n, Ldeep, kind, lab) for n in qubits])
            m = ns_ >= 4
            b, a = np.polyfit(ns_[m], np.log10(v[m]), 1)
            fits[f"{kind}_{lab}"] = {"slope_log10_per_qubit": float(b), "intercept": float(a), "layers": Ldeep,
                                     "fit_qubits": [int(x) for x in ns_[m]], "halving_qubits": float(np.log10(2) / -b) if b < 0 else float("inf")}
    out["fits"] = fits

    # Map the emulation into the same units (std of d<Z0>/d theta)
    h8 = get(8, 2, "framework_healthy")
    std_h8 = float(np.sqrt(h8))
    emu_std = ALPHA * std_h8
    emu_snr = emu_std / BP_SHOT_STD
    cmp = {"healthy_std_8q_L2": std_h8, "emulated_equiv_std": emu_std, "emulated_snr_at_1024_shots": emu_snr}
    for kind in ("framework_random", "mcclean_random"):
        f = fits[f"{kind}_q0"]
        v8 = get(8, Ldeep, kind)
        cmp[f"{kind}_std_8q_L{Ldeep}"] = float(np.sqrt(v8))
        cmp[f"{kind}_snr_8q_L{Ldeep}_at_1024_shots"] = float(np.sqrt(v8) / BP_SHOT_STD)
        cmp[f"{kind}_concentration_vs_healthy_8q"] = float(np.sqrt(v8) / std_h8)
        b, a = f["slope_log10_per_qubit"], f["intercept"]
        if b < 0:
            # qubits at which genuine std reaches the emulated std:  0.5*(a + b n) = log10(emu_std)
            cmp[f"{kind}_qubits_to_reach_emulated_std"] = float((2 * np.log10(emu_std) - a) / b)
            # qubits at which genuine std drops below the 1,024-shot noise floor (SNR = 1)
            cmp[f"{kind}_qubits_to_snr1_at_1024_shots"] = float((2 * np.log10(BP_SHOT_STD) - a) / b)
        else:
            cmp[f"{kind}_qubits_to_reach_emulated_std"] = float("inf")
            cmp[f"{kind}_qubits_to_snr1_at_1024_shots"] = float("inf")
    out["comparison"] = cmp
    out["runtime_s"] = time.time() - t0
    with open(os.path.join(OUT, "gradient_variance.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, indent=1)
    print(json.dumps({"fits": fits, "comparison": cmp}, indent=1))


if __name__ == "__main__":
    main()
