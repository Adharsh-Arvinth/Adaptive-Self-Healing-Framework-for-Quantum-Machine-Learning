"""
Counterfactual fault-injection episodes.

One BASE RUN = (dataset, seed). A 4-qubit VQC is trained for W_WARM healthy steps; the healthy
checkpoint C_h is then forked into one episode per CONDITION (nominal + 6 fault classes), so all
conditions of a base run share the same healthy history (paired design).

Per episode:
  1. restore C_h, inject the fault (severity ~ U[0.75, 1.25]); nominal = no injection
  2. OBSERVE up to T_OBS steps with no intervention, running the framework's own detector and
     diagnosis engine online; the decision point t_d is the first step at which the confidence
     gate clears (what the pipeline would do), else T_OBS.
  3. at t_d snapshot S_d and record everything a policy may condition on:
     telemetry, diagnosis posterior, failure embedding, 12-D context (x9/x10 left for the replay,
     since they depend on the policy's own memory), safety-filter verdicts and digital-twin
     predictions for all six arms (twin split, H = 3).
  4. COUNTERFACTUALS: from the identical S_d, apply each action in
        noop | rollback_healthy | 6 repair arms
     and continue training for K_POST steps, logging val/test trajectories. The framework's
     acceptance window (W_val = 3, DeploymentManager rules) is evaluated on each arm, so the
     benchmark can score both the raw repair and the guarded (commit-or-rollback) outcome.

Because every policy sees the same S_d and the same per-action outcomes, policies are compared
by replay on identical episodes, and regret against the per-episode oracle is exact.
"""

from copy import deepcopy
import json
import os
import time
from typing import Any, Dict, List, Optional

import numpy as np

from backend.qml_model import CircuitConfig, FailureType, VQCModel
from backend.monitoring import HealthMonitor
from backend.detection import FailureDetector
from backend.diagnosis import DiagnosisEngine
from backend.memory import build_failure_embedding
from backend.bandit import build_context_vector
from backend.repair_library import RepairArm, RepairLibrary
from backend.safety_filter import SafetyFilter, SafetyFilterConfig
from backend.digital_twin import DigitalTwinSimulator
from backend.deployment import DeploymentConfig
from backend.evaluation import compute_multi_objective_reward

from research.datasets import load_splits

N_QUBITS = 4
N_LAYERS = 2
LR = 0.05
W_WARM = 15
T_OBS = 10
K_POST = 20
W_VAL = 3
RECOVERY_TOL = 0.05
CONDITIONS = ["nominal"] + [f.value for f in FailureType]
ARMS = [a.value for a in RepairArm]
ACTIONS = ["noop", "rollback_healthy"] + ARMS
FAULT_SEED_OFFSET = 7919


def _finite(x: float, default: float = 1e6) -> float:
    return float(x) if np.isfinite(x) else default


def _eval(model: VQCModel, X: np.ndarray, y: np.ndarray) -> Dict[str, float]:
    loss, acc = model.compute_loss_and_accuracy(X, y)
    return {"loss": _finite(loss), "acc": float(acc) if np.isfinite(loss) else 0.0}


def _metrics_row(step: int, m, model: VQCModel, sp) -> Dict[str, Any]:
    te = _eval(model, sp.X_test, sp.y_test)
    return {
        "step": int(step),
        "loss": _finite(m.loss), "val_loss": _finite(m.val_loss),
        "acc": float(m.accuracy), "val_acc": float(m.val_accuracy),
        "grad_norm": _finite(m.gradient_norm), "grad_var": _finite(m.gradient_variance),
        "velocity": _finite(m.parameter_velocity), "lr": float(m.learning_rate),
        "depth": int(m.circuit_depth), "margin": _finite(m.output_margin, 0.0),
        "magnitude": _finite(m.output_magnitude, 0.0),
        "grad_cos": float(m.grad_cosine) if np.isfinite(m.grad_cosine) else None,
        "test_loss": te["loss"], "test_acc": te["acc"],
        "finite": bool(np.isfinite(m.loss) and np.isfinite(m.val_loss)),
    }


def _acceptance(pre: Dict[str, float], rows: List[Dict[str, Any]], cfg: DeploymentConfig) -> Dict[str, Any]:
    """Replicates DeploymentManager.validate_step / finalize_deployment on the first W_val rows."""
    win = rows[:cfg.validation_window]
    for r in win:
        if not r["finite"]:
            return {"accepted": False, "reason": "NAN_OR_INF_LOSS"}
        if r["loss"] > cfg.divergence_loss_ceiling or r["val_loss"] > cfg.divergence_loss_ceiling:
            return {"accepted": False, "reason": "DIVERGENCE_LOSS_LIMIT"}
        if r["grad_norm"] > cfg.divergence_grad_ceiling:
            return {"accepted": False, "reason": "DIVERGENCE_GRAD_LIMIT"}
        if r["val_acc"] < cfg.min_validation_accuracy and pre["val_acc"] >= 0.50:
            return {"accepted": False, "reason": "ACCURACY_COLLAPSE"}
    avg_loss = float(np.mean([r["loss"] for r in win]))
    loss_pre = pre["loss"]
    if np.isfinite(loss_pre) and loss_pre < 1e5:
        if (avg_loss - loss_pre) / max(loss_pre, 1e-6) > cfg.max_loss_regression:
            return {"accepted": False, "reason": "LOSS_REGRESSION"}
    return {"accepted": True, "reason": None}


def _run_post(model: VQCModel, sp, start_step: int) -> List[Dict[str, Any]]:
    rows = []
    for k in range(K_POST):
        m = model.train_step(sp.X_train, sp.y_train, sp.X_val, sp.y_val)
        rows.append(_metrics_row(start_step + k + 1, m, model, sp))
    return rows


def device_noise(name: str) -> Dict[str, float]:
    """Calibrated noise parameters derived from a public IBM calibration snapshot."""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "external", "ibm_calibration", "calibration_summary.json")
    with open(path, encoding="utf-8") as f:
        return json.load(f)[name]


def run_base(dataset: str, seed: int, conditions: Optional[List[str]] = None,
             hw_device: Optional[str] = None) -> List[Dict[str, Any]]:
    """Run one base run and return one record per condition.

    hw_device: if given (e.g. "torino"), healthy training runs under that device's calibrated noise
    baseline (gate + readout error, 1,024-shot sampling noise) and the noise fault is a drift event.
    """
    t0 = time.time()
    sp = load_splits(dataset, seed)
    conditions = conditions or CONDITIONS
    model = VQCModel(CircuitConfig(n_qubits=N_QUBITS, n_layers=N_LAYERS, learning_rate=LR, seed=seed))
    regime = "ideal"
    if hw_device:
        cal = device_noise(hw_device)
        model.set_device_noise(cal["per_layer_depolarizing_p"], cal["median_readout_error"], shots=1024)
        regime = f"hw_{hw_device}"
    monitor = HealthMonitor(window_size=10, experiment_id=f"{dataset}_{seed}")
    warm_rows = []
    for t in range(W_WARM):
        m = model.train_step(sp.X_train, sp.y_train, sp.X_val, sp.y_val)
        monitor.record_step(m)
        warm_rows.append(_metrics_row(t + 1, m, model, sp))
    healthy_state = model.get_state()
    healthy_monitor = deepcopy(monitor)
    healthy_test = _eval(model, sp.X_test, sp.y_test)
    healthy_val = _eval(model, sp.X_val, sp.y_val)
    # Healthy continuation: the fault-free counterfactual, used as the recovery reference at the
    # SAME absolute training step as each action's outcome.
    ref_model = VQCModel(deepcopy(healthy_state.config))
    ref_model.set_state(deepcopy(healthy_state))
    healthy_cont = {}
    for t in range(T_OBS + K_POST):
        m = ref_model.train_step(sp.X_train, sp.y_train, sp.X_val, sp.y_val)
        te = _eval(ref_model, sp.X_test, sp.y_test)
        healthy_cont[W_WARM + t + 1] = te

    lib = RepairLibrary()
    safety = SafetyFilter(SafetyFilterConfig())
    twin = DigitalTwinSimulator(horizon=3, max_loss_degradation=0.20, batch_size=20)
    dep_cfg = DeploymentConfig(validation_window=W_VAL)

    records = []
    for ci, cond in enumerate(conditions):
        ep_seed = seed * 1000 + ci * 17 + FAULT_SEED_OFFSET
        frng = np.random.RandomState(ep_seed)
        model.set_state(deepcopy(healthy_state))
        model.rng = np.random.RandomState(ep_seed)  # independent noise stream per episode
        mon = deepcopy(healthy_monitor)
        detector = FailureDetector()
        diag_engine = DiagnosisEngine(confidence_threshold=0.60)
        severity = float(frng.uniform(0.75, 1.25))
        bp_mode = "structural" if (cond == "barren_plateau" and frng.rand() < 0.5) else "default"
        inject_report = None
        if cond != "nominal":
            inject_report = model.inject_failure(FailureType(cond), severity=severity, mode=bp_mode)

        obs_rows, step_log = [], []
        first_anomaly, decision_step, gate_cleared = None, None, False
        last = None
        for t in range(T_OBS):
            m = model.train_step(sp.X_train, sp.y_train, sp.X_val, sp.y_val)
            obs = mon.record_step(m)
            summ = mon.get_summary()
            anomalies = detector.evaluate(summ, obs)
            diag = diag_engine.diagnose(anomalies, summ, obs)
            obs_rows.append(_metrics_row(W_WARM + t + 1, m, model, sp))
            step_log.append({
                "anomalies": [a.failure_type.value for a in anomalies],
                "anomaly_status": [a.status.value for a in anomalies],
                "primary": diag.primary_cause.value if diag.primary_cause else None,
                "confidence": float(diag.confidence),
                "gate": bool(diag.confidence_gate_cleared),
                "probs": diag.probabilities,
            })
            last = (m, obs, summ, anomalies, diag)
            if anomalies and first_anomaly is None:
                first_anomaly = t + 1
            if diag.confidence_gate_cleared and anomalies:
                decision_step, gate_cleared = t + 1, True
                break
        if decision_step is None:
            decision_step = T_OBS
        m_d, obs_d, summ_d, anomalies_d, diag_d = last
        S_d = model.get_state()
        t_abs = W_WARM + decision_step
        pre = {"loss": _finite(m_d.loss), "val_acc": float(m_d.val_accuracy), "grad_norm": _finite(m_d.gradient_norm)}

        # Decision-time features
        emb = build_failure_embedding(obs_d, summ_d, diag_d if anomalies_d else None, max_depth=8)
        cands = lib.generate_candidate_repairs(S_d, diag_d if anomalies_d else None, all_arms=True)
        safety_dec = {d.arm.value: {"safe": bool(d.is_safe), "reason": d.rejection_reason}
                      for d in safety.filter_candidates(cands, S_d, [])}
        twin_model = VQCModel(deepcopy(S_d.config))
        twin_model.set_state(deepcopy(S_d))
        twin_preds = twin.simulate_all(twin_model, cands, sp.X_twin, sp.y_twin, seed=seed)
        twin_out = {a.value: {
            "viable": bool(p.is_viable), "pred_delta": float(p.predicted_loss_delta),
            "norm_delta": float(p.normalized_predicted_delta), "stability": float(p.proxy_stability),
            "evals": int(p.circuit_evaluations), "reason": p.rejection_reason,
        } for a, p in twin_preds.items()}
        viable = [p for p in twin_preds.values() if p.is_viable]
        best_twin = max(viable, key=lambda p: p.normalized_predicted_delta) if viable else None
        ctx_no_mem = build_context_vector(obs_d, summ_d, diag_d if anomalies_d else None, 0.0, 0.0, best_twin, max_depth=8)
        cand_params = {c.arm.value: c.params for c in cands}

        # Counterfactual outcomes
        outcomes = {}
        for action in ACTIONS:
            cm = VQCModel(deepcopy(S_d.config))
            cm.set_state(deepcopy(S_d))
            applied, err = True, None
            if action == "rollback_healthy":
                env = (cm._noise_level, cm._depol_p, cm._readout_err)  # device noise is environmental: survives a rollback
                cm.set_state(deepcopy(healthy_state))
                cm._noise_level, cm._depol_p, cm._readout_err = env
                cm.rng.set_state(S_d.rng_state)
                cm.epoch = S_d.epoch
            elif action != "noop":
                cand = next(c for c in cands if c.arm.value == action)
                res = lib.apply_to_model(cm, cand)
                applied, err = bool(res.success), res.error_message
            rows = _run_post(cm, sp, t_abs)
            acc_rule = _acceptance(pre, rows, dep_cfg)
            post = rows[W_VAL - 1]
            final = rows[-1]
            final_steps = [r["step"] for r in rows[-3:]]
            ref_acc3 = float(np.mean([healthy_cont[st]["acc"] for st in final_steps]))
            ref_loss3 = float(np.mean([healthy_cont[st]["loss"] for st in final_steps]))
            out_acc3 = float(np.mean([r["test_acc"] for r in rows[-3:]]))
            out_loss3 = float(np.mean([r["test_loss"] for r in rows[-3:]]))
            n_params = int(np.prod(cm.params.shape))
            evals = W_VAL * len(sp.y_train) * (2 * n_params + 1)
            reward_raw = compute_multi_objective_reward(
                loss_pre=pre["loss"] if pre["loss"] < 1e5 else float("nan"), loss_post=post["loss"],
                acc_pre=pre["val_acc"], acc_post=post["val_acc"],
                grad_norm_pre=pre["grad_norm"], grad_norm_post=post["grad_norm"],
                failure_type=(diag_d.primary_cause.value if (anomalies_d and diag_d.primary_cause) else "unknown"),
                circuit_evaluations=0, depth_pre=S_d.config.n_layers, depth_post=cm.config.n_layers,
                was_rolled_back=not acc_rule["accepted"], max_depth=8,
            )
            outcomes[action] = {
                "applied": applied, "error": err, "accepted": acc_rule["accepted"], "reject_reason": acc_rule["reason"],
                "reward": float(reward_raw), "evals_validation": int(evals),
                "final_test_acc": final["test_acc"], "final_test_loss": final["test_loss"],
                "final_val_acc": final["val_acc"], "final_finite": final["finite"],
                "test_acc3": out_acc3, "test_loss3": out_loss3, "ref_test_acc3": ref_acc3, "ref_test_loss3": ref_loss3,
                "acc_gap": out_acc3 - ref_acc3,
                "recovered": bool(final["finite"] and out_acc3 >= ref_acc3 - RECOVERY_TOL),
                "auc_test_loss": float(np.mean([r["test_loss"] for r in rows])),
                "trajectory": [{k: r[k] for k in ("step", "loss", "val_loss", "val_acc", "test_acc", "test_loss", "grad_norm")} for r in rows],
            }

        records.append({
            "episode_id": f"{dataset}_s{seed}_{cond}" + ("" if regime == "ideal" else f"_{regime}"),
            "regime": regime,
            "dataset": dataset, "seed": seed, "condition": cond, "severity": severity if cond != "nominal" else 0.0,
            "bp_mode": bp_mode if cond == "barren_plateau" else None, "inject_report": inject_report,
            "healthy_test": healthy_test, "healthy_val": healthy_val,
            "first_anomaly_step": first_anomaly, "decision_step": decision_step, "gate_cleared": gate_cleared,
            "diagnosis": {
                "primary": diag_d.primary_cause.value if (anomalies_d and diag_d.primary_cause) else None,
                "confidence": float(diag_d.confidence), "probs": diag_d.probabilities,
                "anomalies": [a.failure_type.value for a in anomalies_d],
            },
            "obs_log": step_log, "warm_telemetry": warm_rows if ci == 0 else None, "obs_telemetry": obs_rows,
            "pre": pre, "embedding": emb.tolist(), "context_no_memory": ctx_no_mem.tolist(),
            "safety": safety_dec, "twin": twin_out, "candidate_params": cand_params,
            "outcomes": outcomes,
        })
    for r in records:
        r["base_runtime_s"] = time.time() - t0
    return records


def _jsonable(o):
    if isinstance(o, (np.floating,)):
        return float(o)
    if isinstance(o, (np.integer,)):
        return int(o)
    if isinstance(o, np.ndarray):
        return o.tolist()
    if isinstance(o, (np.bool_,)):
        return bool(o)
    raise TypeError(type(o))


def dumps(rec: Dict[str, Any]) -> str:
    return json.dumps(rec, default=_jsonable)


if __name__ == "__main__":
    import sys
    ds = sys.argv[1] if len(sys.argv) > 1 else "breast_cancer"
    sd = int(sys.argv[2]) if len(sys.argv) > 2 else 0
    recs = run_base(ds, sd)
    for r in recs:
        oc = r["outcomes"]
        best = max(oc, key=lambda a: oc[a]["test_acc3"])
        print(f"{r['condition']:22s} sev={r['severity']:.2f} t_d={r['decision_step']} gate={r['gate_cleared']!s:5s} "
              f"diag={str(r['diagnosis']['primary']):22s} ref={oc['noop']['ref_test_acc3']:.2f} "
              f"noop={oc['noop']['test_acc3']:.2f} rb={oc['rollback_healthy']['test_acc3']:.2f} "
              f"best={best}:{oc[best]['test_acc3']:.2f} rec=" +
              "".join("1" if oc[a]["recovered"] else "." for a in ACTIONS))
    print(f"runtime {recs[0]['base_runtime_s']:.1f}s")
