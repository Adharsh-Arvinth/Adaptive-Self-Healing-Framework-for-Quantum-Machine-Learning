"""
Sensitivity of the main policy comparison to the recovery tolerance and the probation window.

    python -m research.sensitivity                 # all regimes with stored episodes
    REGIMES=ideal,hw_torino python -m research.sensitivity

No new training. Every counterfactual outcome in research/data/raw stores, per action, the full
K_POST = 20-step post-decision trajectory (train/val loss, val accuracy, gradient norm, test
accuracy), the test accuracy averaged over the last 3 steps, the fault-free reference at the same
steps, and whether the final state is finite. From these:

  * recovery tolerance tau in {3, 5, 10} accuracy points:
        recovered = final_finite and test_acc3 >= ref_test_acc3 - tau
  * probation window W_val in {3, 5}: the DeploymentManager acceptance rules and the multi-objective
    reward are re-evaluated on the first W_val post-decision steps (reward at step W_val), exactly as
    research.episodes does for W_val = 3. The W_val = 3 recomputation is checked against the stored
    acceptance flags and rewards (counts of mismatches are reported).

Changing W_val does not change the trajectories themselves (the probation only decides commit vs
rollback, and the reward a learner sees), so this is an exact counterfactual for both knobs.

The policies are then replayed with research.replay (same orders and seeds as research.analysis).
Writes research/results/sensitivity.json.
"""

import json
import os
import time
from copy import copy

import numpy as np
from scipy import stats

from backend.deployment import DeploymentConfig
from backend.evaluation import compute_multi_objective_reward
from research import analysis as AN
from research.replay import ARMS, EXT2_ARMS, PolicySpec, outcome

ROOT = AN.ROOT
OUT = os.path.join(ROOT, "research", "results", "sensitivity.json")
PART_DIR = os.path.join(ROOT, "research", "results", "sensitivity")
TOLS = [0.03, 0.05, 0.10]
WINDOWS = [3, 5]
N_ORDERS = int(os.environ.get("N_ORDERS", "30"))
L = dict(diag_source="learned", gate_source="learned")


def main_policies():
    return [
        PolicySpec("No repair (continue)", "noop"),
        PolicySpec("Restore last healthy checkpoint", "rollback"),
        PolicySpec("Restore checkpoint, learned gate", "rollback", **L),
        PolicySpec("Thompson Sampling (proposed)", "ts"),
        PolicySpec("TS, extended library (+checkpoint arm)", "ts", arms=AN.EXT_ARMS),
        PolicySpec("Hybrid: restore + TS for environmental faults", "hybrid", arms=AN.EXT_ARMS, **L),
        PolicySpec("Oracle (6 arms)", "oracle"),
        PolicySpec("Oracle (extended library)", "oracle", arms=AN.EXT_ARMS),
    ]


def latent_policies():
    return [
        PolicySpec("No repair (continue)", "noop"),
        PolicySpec("Restore latest checkpoint", "rollback", **L),
        PolicySpec("Restore older clean checkpoint", "fixed", arms=EXT2_ARMS, fixed_arm="rollback_clean", **L),
        PolicySpec("Thompson Sampling (6 arms)", "ts", **L),
        PolicySpec("Diagnosis-conditioned TS, checkpoints", "class_ts", arms=EXT2_ARMS, **L),
        PolicySpec("Oracle (6 arms)", "oracle", **L),
        PolicySpec("Oracle (arms + checkpoints)", "oracle", arms=EXT2_ARMS, **L),
    ]


# ----------------------------------------------------------------------------------------------
# Outcome recomputation
# ----------------------------------------------------------------------------------------------

def _acceptance(pre, rows, cfg):
    """Same rules as research.episodes._acceptance; non-finite values were stored as 1e6."""
    for r in rows:
        if r["loss"] >= 1e6 or r["val_loss"] >= 1e6:
            return False
        if r["loss"] > cfg.divergence_loss_ceiling or r["val_loss"] > cfg.divergence_loss_ceiling:
            return False
        if r["grad_norm"] > cfg.divergence_grad_ceiling:
            return False
        if r["val_acc"] < cfg.min_validation_accuracy and pre["val_acc"] >= 0.50:
            return False
    avg_loss = float(np.mean([r["loss"] for r in rows]))
    lp = pre["loss"]
    if np.isfinite(lp) and lp < 1e5 and (avg_loss - lp) / max(lp, 1e-6) > cfg.max_loss_regression:
        return False
    return True


def _depth_pre(ep):
    rows = ep.get("obs_telemetry") or []
    return int(rows[-1]["depth"]) if rows else 2


def recompute(eps, tol, W):
    """Copy of the episodes with recovery / acceptance / reward re-derived for (tol, W)."""
    cfg = DeploymentConfig(validation_window=W)
    out, mism_acc, mism_rew, n = [], 0, 0, 0
    for ep in eps:
        e = copy(ep)
        pre = ep["pre"]
        ft = ep["diagnosis"]["primary"] or "unknown"
        dpre = _depth_pre(ep)
        oc = {}
        for a, o in ep["outcomes"].items():
            o = dict(o)
            o["recovered"] = bool(o["final_finite"] and o["test_acc3"] >= o["ref_test_acc3"] - tol)
            rows = o["trajectory"][:W]
            acc = _acceptance(pre, rows, cfg)
            post = rows[W - 1]
            rew = compute_multi_objective_reward(
                loss_pre=pre["loss"] if pre["loss"] < 1e5 else float("nan"), loss_post=post["loss"],
                acc_pre=pre["val_acc"], acc_post=post["val_acc"],
                grad_norm_pre=pre["grad_norm"], grad_norm_post=post["grad_norm"], failure_type=ft,
                circuit_evaluations=0, depth_pre=dpre, depth_post=dpre,  # no action increases depth
                was_rolled_back=not acc, max_depth=8)
            if W == 3 and a != "noop":
                n += 1
                mism_acc += int(acc != o["accepted"])
                mism_rew += int(abs(rew - o["reward"]) > 1e-9)
            o["accepted"], o["reward"] = acc, float(rew)
            o["evals_validation"] = int(round(o["evals_validation"] * W / 3))
            oc[a] = o
        e["outcomes"] = oc
        out.append(e)
    check = {"n_action_outcomes": n, "acceptance_mismatches": mism_acc, "reward_mismatches": mism_rew} if W == 3 else None
    return out, check


# ----------------------------------------------------------------------------------------------


def _alignment(eps):
    rw, ac, rc = [], [], []
    for e in eps:
        if e["condition"] == "nominal":
            continue
        for a in [k for k in e.get("actions", ["noop", "rollback_healthy"] + ARMS) if k != "noop"]:
            o = e["outcomes"][a]
            if o["applied"]:
                rw.append(o["reward"]); ac.append(o["acc_gap"]); rc.append(o["recovered"])
    return {"spearman_reward_vs_acc_gap": float(stats.spearmanr(rw, ac).correlation),
            "pointbiserial_reward_vs_recovered": float(stats.pointbiserialr(rc, rw).correlation), "n": len(rw)}


def _ceiling(eps, arms):
    """Hindsight recovery ceiling: fraction of faulty episodes in which ANY of `arms` recovers (guarded)."""
    f = [e for e in eps if e["condition"] != "nominal"]
    return float(np.mean([max(outcome(e, a, True)["recovered"] for a in arms if a in e["outcomes"]) for e in f]))


def run_regime(regime, runs=None):
    """runs: optional set of (dataset, seed) base runs to restrict to (paired 4-qubit comparison for q8)."""
    t0 = time.time()
    eps = AN.load_episodes(regime)
    if runs is not None:
        eps = [e for e in eps if (e["dataset"], e["seed"]) in runs]
        regime = regime + "@q8runs"
    if not eps:
        return None
    print(f"[{regime}] {len(eps)} episodes", flush=True)
    AN.section_c(eps)  # learned (LODO) diagnosis probabilities; independent of tol / W
    latent = regime.startswith("latent")
    specs = latent_policies() if latent else main_policies()
    restore = "Restore older clean checkpoint" if latent else "Restore last healthy checkpoint"
    ts = "Thompson Sampling (6 arms)" if latent else "Thompson Sampling (proposed)"
    ext_oracle = "Oracle (arms + checkpoints)" if latent else "Oracle (extended library)"
    restore_arms = ["rollback_clean"] if latent else ["rollback_healthy"]
    res = {"n_episodes": len(eps), "policies": [s.name for s in specs], "restore": restore, "ts": ts,
           "ext_oracle": ext_oracle, "grid": [],
           "datasets": sorted({e["dataset"] for e in eps}), "n_seeds": len({e["seed"] for e in eps}),
           "_runs": sorted({(e["dataset"], e["seed"]) for e in eps})}
    for W in WINDOWS:
        for tol in TOLS:
            E, check = recompute(eps, tol, W)
            pol, per_ep, _ = AN.replay(E, specs, N_ORDERS)
            t_ts = AN.paired_tests(E, {k: per_ep[k] for k in (restore, ts)}, restore, "recovered")[ts]
            t_or = AN.paired_tests(E, {k: per_ep[k] for k in (restore, ext_oracle)}, restore, "recovered")[ext_oracle]
            cell = {
                "tol": tol, "W_val": W, "check": check,
                "recovery": {n: pol[n]["recovered"] for n in pol},
                "recovery_ci": {n: pol[n]["recovered_ci"] for n in pol},
                "harmful": {n: pol[n]["harmful"] for n in pol},
                "rolled_back": {n: pol[n]["rolled_back"] for n in pol},
                "ceiling_6_arms": _ceiling(E, ARMS),
                "ceiling_restore_only": _ceiling(E, restore_arms),
                "alignment": _alignment(E),
                "restore_minus_ts": {"diff": t_ts["mean_diff"], "p": t_ts["p_wilcoxon"], "dz": t_ts["cohens_dz"]},
                "restore_minus_ext_oracle": {"diff": t_or["mean_diff"], "p": t_or["p_wilcoxon"], "dz": t_or["cohens_dz"]},
            }
            r = cell["recovery"]
            cell["claims"] = {
                # (1) checkpoint restore >> bandit repair: >= 20 pp and significant
                "restore_gg_ts": bool(r[restore] - r[ts] >= 0.20 and t_ts["p_wilcoxon"] < 0.05),
                # (2) library ceiling: the reward-optimal 6-arm oracle AND the hindsight recovery ceiling are below restore
                "library_ceiling": bool(r["Oracle (6 arms)"] < r[restore] and cell["ceiling_6_arms"] < r[restore]),
                # (3) reward misalignment: the reward-optimal extended-library oracle recovers less than restore
                "reward_misaligned": bool(r[ext_oracle] < r[restore]),
            }
            res["grid"].append(cell)
            print(f"[{regime}] W={W} tol={tol:.2f} restore {100*r[restore]:.1f} ts {100*r[ts]:.1f} "
                  f"or6 {100*r['Oracle (6 arms)']:.1f} orx {100*r[ext_oracle]:.1f} ceil6 {100*cell['ceiling_6_arms']:.1f} "
                  f"claims {cell['claims']} check {check} ({time.time()-t0:.0f}s)", flush=True)
    return res


def _write(name, r):
    """One file per regime (so regimes can run as parallel processes), merged by load_all()."""
    os.makedirs(PART_DIR, exist_ok=True)
    r = dict(r)
    r.pop("_runs", None)
    r.update({"tolerances": TOLS, "windows": WINDOWS, "n_orders": N_ORDERS})
    with open(os.path.join(PART_DIR, f"{name}.json"), "w", encoding="utf-8") as f:
        json.dump(r, f, indent=1, default=float)


def load_all():
    import glob
    out = {}
    for p in sorted(glob.glob(os.path.join(PART_DIR, "*.json"))):
        with open(p, encoding="utf-8") as f:
            r = json.load(f)
        out[os.path.splitext(os.path.basename(p))[0]] = r
        out.setdefault("n_orders", r.get("n_orders"))
    return out


def main():
    regimes = os.environ.get("REGIMES", "ideal,hw_torino,latent4,q8").split(",")
    for reg in regimes:
        r = run_regime(reg)
        if r is None:
            continue
        _write(reg, r)
        if reg == "q8":  # the 4-qubit ideal regime on exactly the same base runs (paired comparison)
            runs = {(d, s) for d, s in r["_runs"]}
            _write("ideal@q8runs", run_regime("ideal", runs))
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(load_all(), f, indent=1, default=float)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
