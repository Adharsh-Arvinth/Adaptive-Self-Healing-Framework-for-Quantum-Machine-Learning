"""
Hardware validation of the noise model used by the hardware-calibrated regime (hw_torino).

The hw_torino regime models an IBM Heron device as a global depolarizing contraction of the measured
expectation, c(L) = (1 - p)^L (1 - 2r), plus 1,024-shot sampling noise (backend/qml_model.py), with p and r
derived from a public ibm_torino calibration snapshot (research/external/ibm_calibration). This script
tests that model against a real IBM processor on FIXED, already-trained classifiers (no training on
hardware, which the free plan's processor time cannot afford):

    python -m research.hardware_check prepare                 # train classifiers in simulation, build circuits
    python -m research.hardware_check submit --fake           # dry run on a local FakeTorino (Aer) noise model
    python -m research.hardware_check submit [--backend NAME] # real QPU (needs a saved IBM Quantum account)
    python -m research.hardware_check collect                 # fetch the job result (resumable)
    python -m research.hardware_check analyze [--fake]        # compare hardware with the model

What is measured (per classifier, test split, 1,024 shots per sample):
  * the contraction c_hw: least-squares slope of measured <Z_0> on the ideal <Z_0> (through the origin),
    against the model's c(L) from the paper's snapshot and from the device's calibration at run time;
  * test accuracy on hardware vs noiseless simulation (the model predicts no change beyond shot noise,
    because a global depolarizing channel cannot flip the sign of <Z_0>);
  * residual scatter after removing the contraction, against pure shot noise (excess scatter means noise
    that is not a global contraction, e.g. coherent or crosstalk errors);
  * the depth law: the same samples on circuits padded to L = 4 and 8 layers (extra layers have zero
    rotation angles, so the ideal function changes only through the extra CNOT rings).

Account setup is done by the user, never by this script (it only loads a saved account):
    from qiskit_ibm_runtime import QiskitRuntimeService
    QiskitRuntimeService.save_account(channel="ibm_quantum_platform", token="<API key>", set_as_default=True)
"""

import argparse
import datetime
import json
import os
import sys
import time

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)

SHOTS = 1024
N_TRAIN_STEPS = 45                     # W_WARM + T_OBS + K_POST of the benchmark protocol
SEED = 0
DATASETS = ["breast_cancer", "wine", "digits", "banknote", "pima_diabetes", "iris", "hidden_manifold", "moons"]
DEPTH_DATASETS = ["breast_cancer", "banknote"]
DEPTHS = [4, 8]
N_Q = 4


def _dir(fake: bool) -> str:
    d = os.path.join(ROOT, "research", "results", "hardware_fake" if fake else "hardware")
    os.makedirs(d, exist_ok=True)
    return d


def _plan_path():
    return os.path.join(ROOT, "research", "results", "hardware", "plan.json")


# ----------------------------------------------------------------------------------------------
# Circuits (identical to backend.qml_model: RY angle encoding, L x [RY layer + CNOT ring], read <Z_0>)
# ----------------------------------------------------------------------------------------------

def circuit(L: int):
    from qiskit import QuantumCircuit
    from qiskit.circuit import ParameterVector
    x = ParameterVector("x", N_Q)
    th = ParameterVector("t", L * N_Q)
    qc = QuantumCircuit(N_Q, 1)
    for i in range(N_Q):
        qc.ry(x[i], i)
    for l in range(L):
        for q in range(N_Q):
            qc.ry(th[l * N_Q + q], q)
        for q in range(N_Q):
            qc.cx(q, (q + 1) % N_Q)
    qc.measure(0, 0)
    return qc, list(x) + list(th)


def bind_values(qc_params, X, theta):
    """Parameter-value matrix in the circuit's own (sorted) parameter order."""
    names = [p.name for p in qc_params]
    rows = []
    for xs in X:
        vals = {f"x[{i}]": float(xs[i]) for i in range(N_Q)}
        vals.update({f"t[{k}]": float(v) for k, v in enumerate(np.asarray(theta).ravel())})
        rows.append([vals[n] for n in names])
    return np.array(rows)


def ideal_expvals(qc, values):
    from qiskit.quantum_info import Statevector, SparsePauliOp
    base = qc.remove_final_measurements(inplace=False)
    op = SparsePauliOp("I" * (N_Q - 1) + "Z")          # Z on qubit 0 (Qiskit is little-endian)
    return np.array([float(np.real(Statevector(base.assign_parameters(v)).expectation_value(op))) for v in values])


# ----------------------------------------------------------------------------------------------
# prepare
# ----------------------------------------------------------------------------------------------

def prepare():
    from backend.qml_model import CircuitConfig, VQCModel
    from research.datasets import load_splits
    from research.episodes import device_noise
    cal = device_noise("torino")
    p, r = cal["per_layer_depolarizing_p"], cal["median_readout_error"]
    pubs = []
    for ds in DATASETS:
        sp = load_splits(ds, SEED)
        m = VQCModel(CircuitConfig(n_qubits=N_Q, n_layers=2, learning_rate=0.05, seed=SEED))
        for _ in range(N_TRAIN_STEPS):
            m.train_step(sp.X_train, sp.y_train, sp.X_val, sp.y_val)
        pl_ideal = np.asarray(m._raw_expvals(m.params, sp.X_test), dtype=float)
        for L in [2] + (DEPTHS if ds in DEPTH_DATASETS else []):
            theta = np.zeros((L, N_Q))
            theta[:2] = m.params                       # extra layers: zero angles, CNOT rings only
            qc, params = circuit(L)
            values = bind_values(qc.parameters, sp.X_test, theta)
            ideal = ideal_expvals(qc, values)
            if L == 2:
                assert np.max(np.abs(ideal - pl_ideal)) < 1e-9, "Qiskit circuit disagrees with the PennyLane model"
            pubs.append({
                "dataset": ds, "layers": L, "n": int(len(sp.y_test)), "y": sp.y_test.tolist(),
                "values": values.tolist(), "param_names": [q.name for q in qc.parameters],
                "ideal": ideal.tolist(), "c_model_snapshot": float((1 - p) ** L * (1 - 2 * r)),
            })
            print(f"{ds:16s} L={L}  n={len(sp.y_test):3d}  ideal acc={np.mean((ideal >= 0) == (sp.y_test == 1)):.3f}", flush=True)
    plan = {"created": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "shots": SHOTS, "seed": SEED, "train_steps": N_TRAIN_STEPS, "calibration_snapshot": cal, "pubs": pubs,
            "n_circuit_executions": int(sum(pb["n"] for pb in pubs))}
    os.makedirs(os.path.dirname(_plan_path()), exist_ok=True)
    with open(_plan_path(), "w", encoding="utf-8") as f:
        json.dump(plan, f, indent=1)
    n = plan["n_circuit_executions"]
    print(f"\n{len(pubs)} PUBs, {n} circuit executions x {SHOTS} shots = {n * SHOTS:,} shots")
    print(f"estimated processor time ~ {n * SHOTS * 300e-6 / 60:.1f} min (at ~300 us per shot incl. reset delay)")


# ----------------------------------------------------------------------------------------------
# submit / collect
# ----------------------------------------------------------------------------------------------

def _calibration_now(backend):
    """Median 1q/2q/readout errors from the backend's current target (same derivation as the snapshot)."""
    t = backend.target
    e1 = [pr.error for op in ("sx", "x") if op in t for pr in t[op].values() if pr is not None and pr.error is not None]
    two = [op for op in ("cz", "ecr", "cx") if op in t]
    e2 = [pr.error for op in two for pr in t[op].values() if pr is not None and pr.error is not None and pr.error < 1]
    ro = [pr.error for pr in t["measure"].values() if pr is not None and pr.error is not None]
    m1, m2, mr = float(np.median(e1)), float(np.median(e2)), float(np.median(ro))
    return {"median_1q_error": m1, "median_2q_error": m2, "median_readout_error": mr,
            "per_layer_depolarizing_p": float(1 - (1 - m1) ** 4 * (1 - m2) ** 4), "two_qubit_gate": two}


def submit(backend_name=None, fake=False):
    from qiskit.transpiler.preset_passmanagers import generate_preset_pass_manager
    from qiskit_ibm_runtime import SamplerV2
    plan = json.load(open(_plan_path(), encoding="utf-8"))
    if fake:
        from qiskit_ibm_runtime.fake_provider import FakeTorino
        backend = FakeTorino()
    else:
        from qiskit_ibm_runtime import QiskitRuntimeService
        service = QiskitRuntimeService()                 # loads the account the user saved; never handles a token
        backend = service.backend(backend_name) if backend_name else service.least_busy(operational=True, simulator=False, min_num_qubits=N_Q)
    pm = generate_preset_pass_manager(optimization_level=1, backend=backend, seed_transpiler=0)
    isa, meta = {}, {}
    for L in sorted({pb["layers"] for pb in plan["pubs"]}):
        qc, _ = circuit(L)
        t = pm.run(qc)
        isa[L] = t
        ops = t.count_ops()
        meta[L] = {"depth": t.depth(), "two_qubit_gates": int(sum(v for k, v in ops.items() if k in ("cz", "ecr", "cx"))),
                   "ops": {k: int(v) for k, v in ops.items()},
                   "layout": [int(i) for i in t.layout.final_index_layout()] if t.layout else None}
        print(f"L={L}: transpiled depth {meta[L]['depth']}, two-qubit gates {meta[L]['two_qubit_gates']} "
              f"(logical circuit has {4 * L})", flush=True)
    pubs = []
    for pb in plan["pubs"]:
        t = isa[pb["layers"]]
        assert [q.name for q in t.parameters] == pb["param_names"], "parameter order changed during transpilation"
        pubs.append((t, np.array(pb["values"]), SHOTS))
    sampler = SamplerV2(mode=backend)
    job = sampler.run(pubs)
    info = {"job_id": job.job_id(), "backend": backend.name, "fake": fake,
            "submitted": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
            "calibration_at_submit": _calibration_now(backend), "transpiled": {str(k): v for k, v in meta.items()}}
    with open(os.path.join(_dir(fake), "job.json"), "w", encoding="utf-8") as f:
        json.dump(info, f, indent=1)
    print(f"submitted job {info['job_id']} to {backend.name}")
    if fake:
        _save_result(job.result(), fake)


def _save_result(result, fake):
    counts = []
    for pr in result:
        ba = pr.data.c                                   # BitArray, shape (n_values,), one classical bit
        counts.append([int(ba.get_counts(i).get("1", 0)) for i in range(ba.shape[0])])
    with open(os.path.join(_dir(fake), "counts.json"), "w", encoding="utf-8") as f:
        json.dump({"ones": counts, "shots": SHOTS}, f)
    print("saved", os.path.join(_dir(fake), "counts.json"))


def collect(fake=False):
    from qiskit_ibm_runtime import QiskitRuntimeService
    info = json.load(open(os.path.join(_dir(fake), "job.json"), encoding="utf-8"))
    job = QiskitRuntimeService().job(info["job_id"])
    status = str(job.status())
    print(f"job {info['job_id']} on {info['backend']}: {status}")
    if status.upper().endswith("DONE"):
        _save_result(job.result(), fake)
        try:
            m = job.metrics()
            info["usage_seconds"] = m.get("usage", {}).get("quantum_seconds")
            with open(os.path.join(_dir(fake), "job.json"), "w", encoding="utf-8") as f:
                json.dump(info, f, indent=1)
        except Exception:
            pass


# ----------------------------------------------------------------------------------------------
# analyze
# ----------------------------------------------------------------------------------------------

def analyze(fake=False):
    plan = json.load(open(_plan_path(), encoding="utf-8"))
    info = json.load(open(os.path.join(_dir(fake), "job.json"), encoding="utf-8"))
    ones = json.load(open(os.path.join(_dir(fake), "counts.json"), encoding="utf-8"))["ones"]
    cal_now = info["calibration_at_submit"]
    rows = []
    for pb, k in zip(plan["pubs"], ones):
        L = pb["layers"]
        ideal = np.array(pb["ideal"])
        meas = 1.0 - 2.0 * np.array(k) / SHOTS            # <Z_0> = P(0) - P(1)
        y = np.array(pb["y"])
        c_hw = float(ideal @ meas / (ideal @ ideal))
        resid = meas - c_hw * ideal
        shot_sd = np.sqrt(np.clip(1 - (c_hw * ideal) ** 2, 0, 1) / SHOTS)
        c_now = (1 - cal_now["per_layer_depolarizing_p"]) ** L * (1 - 2 * cal_now["median_readout_error"])
        # Routing-aware variant: count the gates actually executed after transpilation (SWAP routing on the
        # device's coupling map adds two-qubit gates the paper's 4-per-layer model does not count).
        ops = info["transpiled"][str(L)]["ops"]
        n1 = sum(v for kk, v in ops.items() if kk in ("sx", "x"))
        n2 = info["transpiled"][str(L)]["two_qubit_gates"]
        c_routed = ((1 - cal_now["median_1q_error"]) ** n1 * (1 - cal_now["median_2q_error"]) ** n2
                    * (1 - 2 * cal_now["median_readout_error"]))
        acc_ideal = float(np.mean((ideal >= 0) == (y == 1)))          # p(y=1) = (1 + <Z>)/2 (VQCModel.predict_proba)
        acc_hw = float(np.mean((meas >= 0) == (y == 1)))
        rows.append({
            "dataset": pb["dataset"], "layers": L, "n": pb["n"],
            "c_hw": c_hw, "c_model_snapshot": pb["c_model_snapshot"], "c_model_now": float(c_now),
            "c_model_routed": float(c_routed),
            "acc_ideal": acc_ideal, "acc_hw": acc_hw,
            "sign_flips": int(np.sum(np.sign(meas) != np.sign(ideal))),
            "resid_rms": float(np.sqrt(np.mean(resid ** 2))), "shot_rms": float(np.sqrt(np.mean(shot_sd ** 2))),
            "bias": float(np.mean(meas - c_hw * ideal)),
        })
    l2 = [r for r in rows if r["layers"] == 2]
    n_tot = sum(r["n"] for r in l2)
    summ = {
        "backend": info["backend"], "fake": fake, "job_id": info["job_id"], "submitted": info["submitted"],
        "usage_seconds": info.get("usage_seconds"), "transpiled": info["transpiled"], "calibration_at_submit": cal_now,
        "calibration_snapshot": plan["calibration_snapshot"], "rows": rows,
        "L2": {
            "c_hw_pooled": float(sum(r["c_hw"] * r["n"] for r in l2) / n_tot),
            "c_model_snapshot": l2[0]["c_model_snapshot"], "c_model_now": l2[0]["c_model_now"],
            "c_model_routed": l2[0]["c_model_routed"],
            "acc_ideal": float(sum(r["acc_ideal"] * r["n"] for r in l2) / n_tot),
            "acc_hw": float(sum(r["acc_hw"] * r["n"] for r in l2) / n_tot),
            "sign_flips": int(sum(r["sign_flips"] for r in l2)), "n": n_tot,
            "excess_scatter_ratio": float(np.mean([r["resid_rms"] / r["shot_rms"] for r in l2])),
        },
        "depth": {f"{r['dataset']}_L{r['layers']}": {"c_hw": r["c_hw"], "c_model_snapshot": r["c_model_snapshot"],
                                                      "c_model_now": r["c_model_now"], "c_model_routed": r["c_model_routed"]}
                  for r in rows if r["dataset"] in DEPTH_DATASETS},
    }
    with open(os.path.join(_dir(fake), "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summ, f, indent=1)
    s = summ["L2"]
    print(f"{info['backend']}: L=2 contraction measured {s['c_hw_pooled']:.3f} vs paper model {s['c_model_snapshot']:.3f} "
          f"(snapshot) / {s['c_model_now']:.3f} (calibration at run time) / {s['c_model_routed']:.3f} (routing-aware)")
    print(f"accuracy ideal {s['acc_ideal']:.3f} -> hardware {s['acc_hw']:.3f}; {s['sign_flips']}/{s['n']} predictions flipped; "
          f"residual scatter {s['excess_scatter_ratio']:.2f}x shot noise")
    for r in rows:
        print(f"  {r['dataset']:16s} L={r['layers']}: c_hw {r['c_hw']:.3f}  model {r['c_model_snapshot']:.3f}  "
              f"routed {r['c_model_routed']:.3f}  "
              f"acc {r['acc_ideal']:.3f}->{r['acc_hw']:.3f}  flips {r['sign_flips']}  resid/shot {r['resid_rms']/r['shot_rms']:.2f}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("cmd", choices=["prepare", "submit", "collect", "analyze"])
    ap.add_argument("--backend", default=None, help="IBM backend name (default: least busy)")
    ap.add_argument("--fake", action="store_true", help="local FakeTorino (Aer) dry run instead of the QPU")
    a = ap.parse_args()
    if a.cmd == "prepare":
        prepare()
    elif a.cmd == "submit":
        submit(a.backend, a.fake)
    elif a.cmd == "collect":
        collect(a.fake)
    else:
        analyze(a.fake)


if __name__ == "__main__":
    main()
