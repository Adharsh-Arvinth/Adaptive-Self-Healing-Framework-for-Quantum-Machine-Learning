"""
Analysis of the counterfactual campaign.

    python -m research.analysis            # writes research/results/*.json, *.csv, figures/*.png|pdf

Sections
  A  Fault impact and the counterfactual repair landscape (fault x action recovery matrix)
  B  Online detection + rule-based diagnosis (detection rate, false alarms, delay, confusion, macro-F1)
  C  Learned diagnoser on the released telemetry (leave-one-dataset-out and seed-disjoint CV)
  D  Policy replay: proposed TS vs baselines vs oracle (paired tests, Holm correction, bootstrap CIs)
  E  Ablations of framework components (replay)
  F  Digital-twin fidelity (rank correlation of predicted vs realised outcomes)
"""

import glob
import gzip
import json
import os
from collections import defaultdict
from typing import Dict, List

import numpy as np
from scipy import stats

from research.replay import ARMS, EXT_ARMS, ablation_policies, default_policies, latent_policies, outcome, run_policy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RAW = os.path.join(ROOT, "research", "data", "raw")
REGIME = os.environ.get("REGIME", "ideal")          # ideal | hw_torino | latent4 | q8
OUT = os.path.join(ROOT, "research", "results") if REGIME == "ideal" else os.path.join(ROOT, "research", "results", REGIME)
FIG = os.path.join(OUT, "figures")
FAULTS = ["barren_plateau", "lr_misconfiguration", "optimizer_instability",
          "training_divergence", "persistent_plateau", "noise_degradation"]
ACTIONS = ["noop", "rollback_healthy"] + ARMS
N_ORDERS = int(os.environ.get("N_ORDERS", "30"))


def load_episodes(regime: str = REGIME) -> List[dict]:
    eps = []
    for p in sorted(glob.glob(os.path.join(RAW, "*.json.gz"))):
        with gzip.open(p, "rt", encoding="utf-8") as f:
            for line in f:
                e = json.loads(line)
                if e.get("regime", "ideal") == regime:
                    eps.append(e)
    return eps


def wilson(k: int, n: int, z: float = 1.96):
    if n == 0:
        return (float("nan"), float("nan"))
    p = k / n
    den = 1 + z * z / n
    c = (p + z * z / (2 * n)) / den
    h = z * np.sqrt(p * (1 - p) / n + z * z / (4 * n * n)) / den
    return (float(c - h), float(c + h))


def holm(pvals: Dict[str, float]) -> Dict[str, float]:
    items = sorted(pvals.items(), key=lambda kv: kv[1])
    m = len(items)
    adj, running = {}, 0.0
    for i, (k, p) in enumerate(items):
        running = max(running, min(1.0, (m - i) * p))
        adj[k] = running
    return adj


def boot_ci(x: np.ndarray, groups: np.ndarray, n_boot: int = 2000, seed: int = 0):
    """Cluster bootstrap over base runs (groups) of the mean of x."""
    rng = np.random.RandomState(seed)
    ug = np.unique(groups)
    idx_by = {g: np.where(groups == g)[0] for g in ug}
    means = []
    for _ in range(n_boot):
        gs = rng.choice(ug, size=len(ug), replace=True)
        ii = np.concatenate([idx_by[g] for g in gs])
        means.append(np.mean(x[ii]))
    return float(np.percentile(means, 2.5)), float(np.percentile(means, 97.5))


# ----------------------------------------------------------------------------------------------
# A. Counterfactual landscape
# ----------------------------------------------------------------------------------------------

def section_a(eps):
    global ACTIONS
    ACTIONS = eps[0].get("actions", ACTIONS) if eps else ACTIONS
    res = {}
    for cond in ["nominal"] + FAULTS:
        E = [e for e in eps if e["condition"] == cond]
        row = {"n": len(E)}
        for a in ACTIONS:
            rec = [e["outcomes"][a]["recovered"] for e in E]
            gap = [e["outcomes"][a]["acc_gap"] for e in E]
            acc = [e["outcomes"][a]["accepted"] for e in E] if a != "noop" else [True] * len(E)
            row[a] = {"recovery": float(np.mean(rec)), "recovery_ci": wilson(int(np.sum(rec)), len(rec)),
                      "acc_gap_mean": float(np.mean(gap)), "acceptance": float(np.mean(acc))}
        best6 = [max(e["outcomes"][a]["recovered"] for a in ARMS) for e in E]
        row["any_arm_recovers"] = float(np.mean(best6))
        row["noop_test_acc3"] = float(np.mean([e["outcomes"]["noop"]["test_acc3"] for e in E]))
        row["ref_test_acc3"] = float(np.mean([e["outcomes"]["noop"]["ref_test_acc3"] for e in E]))
        res[cond] = row
    # per dataset healthy reference accuracy
    by_ds = defaultdict(list)
    for e in eps:
        if e["condition"] == "nominal":
            by_ds[e["dataset"]].append(e["outcomes"]["noop"]["ref_test_acc3"])
    res["_healthy_reference_by_dataset"] = {k: {"mean": float(np.mean(v)), "std": float(np.std(v)), "n": len(v)} for k, v in by_ds.items()}
    return res


# ----------------------------------------------------------------------------------------------
# B. Rule-based online detection and diagnosis
# ----------------------------------------------------------------------------------------------

def section_b(eps):
    labels = ["nominal"] + FAULTS
    pred_labels = labels + ["held/none"]
    conf = {t: {p: 0 for p in pred_labels} for t in labels}
    det = defaultdict(list)
    delay = defaultdict(list)
    gate = defaultdict(list)
    for e in eps:
        t = e["condition"]
        detected = e["first_anomaly_step"] is not None
        det[t].append(detected)
        gate[t].append(e["gate_cleared"])
        if detected:
            delay[t].append(e["first_anomaly_step"])
        p = e["diagnosis"]["primary"] if e["gate_cleared"] else "held/none"
        conf[t][p if p in pred_labels else "held/none"] += 1
    # per-class P/R/F1 over gate-cleared predictions (abstentions count as misses)
    prf = {}
    for c in FAULTS:
        tp = conf[c][c]
        fp = sum(conf[t][c] for t in labels if t != c)
        fn = sum(conf[c][p] for p in pred_labels if p != c)
        prec = tp / (tp + fp) if (tp + fp) else float("nan")
        rec = tp / (tp + fn) if (tp + fn) else float("nan")
        f1 = 2 * prec * rec / (prec + rec) if (tp and np.isfinite(prec) and (prec + rec)) else 0.0
        prf[c] = {"precision": prec, "recall": rec, "f1": f1, "tp": tp, "fp": fp, "fn": fn}
    admitted = sum(conf[t][p] for t in labels for p in FAULTS)
    correct = sum(conf[c][c] for c in FAULTS)
    return {
        "detection_rate": {t: float(np.mean(v)) for t, v in det.items()},
        "gate_clear_rate": {t: float(np.mean(v)) for t, v in gate.items()},
        "false_alarm_rate_nominal": float(np.mean(det["nominal"])),
        "false_gate_rate_nominal": float(np.mean(gate["nominal"])),
        "false_gate_ci": wilson(int(np.sum(gate["nominal"])), len(gate["nominal"])),
        "median_detection_delay": {t: float(np.median(v)) for t, v in delay.items() if v},
        "confusion": conf,
        "per_class": prf,
        "macro_f1": float(np.mean([prf[c]["f1"] for c in FAULTS])),
        "admitted_precision": correct / admitted if admitted else float("nan"),
        "coverage_faulty": float(np.mean([e["gate_cleared"] for e in eps if e["condition"] != "nominal"])),
    }


# ----------------------------------------------------------------------------------------------
# C. Learned diagnoser
# ----------------------------------------------------------------------------------------------

FEATS = ["loss", "val_loss", "grad_norm", "grad_var", "velocity", "lr", "depth", "margin", "magnitude", "grad_cos"]


def _features(ep, warm_by_run, k: int = 3) -> np.ndarray:
    """Baseline-relative features from the first k post-onset steps (scale-free across datasets)."""
    base = warm_by_run[(ep["dataset"], ep["seed"])][-3:]
    # Causal: only telemetry available at the decision point (never steps after t_d).
    post = ep["obs_telemetry"][:max(1, min(k, ep["decision_step"]))]

    def mean(rows, f):
        v = [r[f] for r in rows if r.get(f) is not None and np.isfinite(r[f])]
        return float(np.mean(v)) if v else 0.0

    f = []
    for name in FEATS:
        b, p = mean(base, name), mean(post, name)
        if name in ("grad_norm", "grad_var", "velocity", "lr"):
            f.append(np.log10(max(p, 1e-12)) - np.log10(max(b, 1e-12)))
        elif name == "depth":
            f.append(p - b)
        elif name == "grad_cos":
            f.extend([p, b])
        else:
            f.append(min(p, 50.0) - min(b, 50.0))
    f.append(float(all(r["finite"] for r in post)))
    losses = [min(r["loss"], 50.0) for r in post]
    f.append(float(np.std(losses)))
    f.append(float(losses[-1] - losses[0]) if len(losses) > 1 else 0.0)
    return np.array(f, dtype=float)


def section_c(eps):
    from sklearn.ensemble import HistGradientBoostingClassifier
    from sklearn.metrics import f1_score, accuracy_score, confusion_matrix
    warm = {(e["dataset"], e["seed"]): e["warm_telemetry"] for e in eps if e.get("warm_telemetry")}
    labels = ["nominal"] + FAULTS
    X = np.array([_features(e, warm) for e in eps])
    y = np.array([labels.index(e["condition"]) for e in eps])
    ds = np.array([e["dataset"] for e in eps])
    seeds = np.array([e["seed"] for e in eps])
    out = {"n": int(len(y)), "features": FEATS}

    def fit_pred(tr, te):
        clf = HistGradientBoostingClassifier(max_iter=300, learning_rate=0.08, max_leaf_nodes=15, random_state=0)
        clf.fit(X[tr], y[tr])
        return clf.predict(X[te]), clf.predict_proba(X[te])

    # leave-one-dataset-out: generalisation to an unseen dataset
    yp_all = np.zeros_like(y)
    proba_all = np.zeros((len(y), len(labels)))
    per_ds = {}
    for d in np.unique(ds):
        te = ds == d
        yp, pp = fit_pred(~te, te)
        yp_all[te] = yp
        proba_all[te] = pp
        per_ds[d] = float(f1_score(y[te], yp, average="macro"))
    for e, pr in zip(eps, proba_all):
        e["learned_probs"] = dict(zip(labels, pr.tolist()))
    conf_top = proba_all.max(1)
    correct = (proba_all.argmax(1) == y)
    bins = np.linspace(0, 1, 11)
    ece = 0.0
    for lo, hi in zip(bins[:-1], bins[1:]):
        m = (conf_top > lo) & (conf_top <= hi)
        if m.any():
            ece += m.mean() * abs(correct[m].mean() - conf_top[m].mean())
    out["lodo_ece"] = float(ece)
    fault_true = y != 0
    out["lodo_detection_recall"] = float(np.mean(proba_all[fault_true, 0] < 0.5))
    out["lodo_brier_multiclass"] = float(np.mean(np.sum((proba_all - np.eye(len(labels))[y]) ** 2, axis=1)))
    out["lodo_macro_f1"] = float(f1_score(y, yp_all, average="macro"))
    out["lodo_macro_f1_faults_only"] = float(f1_score(y, yp_all, labels=list(range(1, 7)), average="macro"))
    out["lodo_accuracy"] = float(accuracy_score(y, yp_all))
    out["lodo_per_dataset_macro_f1"] = per_ds
    out["lodo_confusion"] = confusion_matrix(y, yp_all, labels=list(range(7))).tolist()
    out["lodo_per_class_f1"] = dict(zip(labels, f1_score(y, yp_all, labels=list(range(7)), average=None).tolist()))
    out["lodo_false_alarm_rate"] = float(np.mean(yp_all[y == 0] != 0))
    # seed-disjoint split: seeds < 20 train, >= 20 test
    cut = 20 if seeds.max() >= 20 else int(np.median(np.unique(seeds)))
    tr, te = seeds < cut, seeds >= cut
    if tr.any() and te.any():
        yp, _ = fit_pred(tr, te)
        out["seed_split_macro_f1"] = float(f1_score(y[te], yp, average="macro"))
        out["seed_split_accuracy"] = float(accuracy_score(y[te], yp))
        out["seed_split_cut"] = cut
    out["labels"] = labels
    return out


# ----------------------------------------------------------------------------------------------
# D/E. Policy replay
# ----------------------------------------------------------------------------------------------

def replay(eps, specs, n_orders=N_ORDERS):
    groups = np.array([f'{e["dataset"]}_{e["seed"]}' for e in eps])
    res = {}
    per_episode = {}
    curves = {}
    for spec in specs:
        acc = defaultdict(lambda: np.zeros(len(eps)))
        cum_regret = []
        for r in range(n_orders):
            order = np.random.RandomState(1000 + r).permutation(len(eps))
            o = run_policy(spec, eps, order, seed=r)
            for k in ("reward", "regret", "recovered", "acc_gap", "rolled_back", "harmful", "acted", "evals", "test_acc3"):
                acc[k][order] += o[k].astype(float) / n_orders
            cum_regret.append(np.cumsum(o["regret"]))
        per_episode[spec.name] = {k: v for k, v in acc.items()}
        cr = np.array(cum_regret)
        curves[spec.name] = {"mean": cr.mean(0)[::10].tolist(), "lo": np.percentile(cr, 5, axis=0)[::10].tolist(),
                             "hi": np.percentile(cr, 95, axis=0)[::10].tolist()}
        faulty = np.array([e["condition"] != "nominal" for e in eps])
        row = {}
        for k in ("reward", "regret", "recovered", "acc_gap", "rolled_back", "harmful", "evals"):
            x = acc[k][faulty]
            row[k] = float(np.mean(x))
            row[k + "_ci"] = boot_ci(x, groups[faulty])
        row["nominal_intervention_rate"] = float(np.mean(acc["acted"][~faulty]))
        row["nominal_harm_rate"] = float(np.mean(acc["harmful"][~faulty]))
        row["final_cum_regret"] = float(cr.mean(0)[-1])
        row["per_fault_recovery"] = {f: float(np.mean(acc["recovered"][np.array([e["condition"] == f for e in eps])])) for f in FAULTS}
        res[spec.name] = row
    return res, per_episode, curves


def paired_tests(eps, per_episode, ref_name, metric="reward"):
    groups = np.array([f'{e["dataset"]}_{e["seed"]}' for e in eps])
    faulty = np.array([e["condition"] != "nominal" for e in eps])
    ug = np.unique(groups[faulty])

    def block_means(name):
        v = per_episode[name][metric]
        return np.array([np.mean(v[(groups == g) & faulty]) for g in ug])

    ref = block_means(ref_name)
    raw = {}
    eff = {}
    for name in per_episode:
        if name == ref_name:
            continue
        other = block_means(name)
        d = ref - other
        if np.allclose(d, 0):
            raw[name], eff[name] = 1.0, 0.0
            continue
        raw[name] = float(stats.wilcoxon(ref, other).pvalue)
        eff[name] = float(np.mean(d) / (np.std(d, ddof=1) + 1e-12))  # paired Cohen's d_z
    adj = holm(raw)
    return {n: {"p_wilcoxon": raw[n], "p_holm": adj[n], "cohens_dz": eff[n],
                "mean_diff": float(np.mean(block_means(ref_name) - block_means(n)))} for n in raw}


def friedman(eps, per_episode, names, metric="reward"):
    groups = np.array([f'{e["dataset"]}_{e["seed"]}' for e in eps])
    faulty = np.array([e["condition"] != "nominal" for e in eps])
    ug = np.unique(groups[faulty])
    M = np.array([[np.mean(per_episode[n][metric][(groups == g) & faulty]) for n in names] for g in ug])
    stat, p = stats.friedmanchisquare(*M.T)
    ranks = np.mean(stats.rankdata(-M, axis=1), axis=0)
    return {"chi2": float(stat), "p": float(p), "mean_ranks": dict(zip(names, ranks.tolist())), "n_blocks": int(len(ug))}


# ----------------------------------------------------------------------------------------------
# F. Digital-twin fidelity
# ----------------------------------------------------------------------------------------------

def section_f(eps):
    pred, real, real_acc = [], [], []
    gate_tp = gate_fp = gate_fn = gate_tn = 0
    per_ep_rho = []
    for e in eps:
        if e["condition"] == "nominal":
            continue
        p_e, r_e = [], []
        for a in ARMS:
            o = e["outcomes"][a]
            if not o["applied"]:
                continue
            tw = e["twin"][a]
            pred.append(tw["norm_delta"])
            real.append(o["reward"])
            real_acc.append(o["test_acc3"])
            p_e.append(tw["norm_delta"])
            r_e.append(o["test_acc3"])
            bad = (not o["accepted"]) or (o["test_acc3"] < e["outcomes"]["noop"]["test_acc3"] - 0.05)
            if not tw["viable"]:
                gate_tp += bad
                gate_fp += (not bad)
            else:
                gate_fn += bad
                gate_tn += (not bad)
        if len(p_e) >= 3 and np.std(p_e) > 0 and np.std(r_e) > 0:
            per_ep_rho.append(stats.spearmanr(p_e, r_e).correlation)
    rho_r = stats.spearmanr(pred, real)
    rho_a = stats.spearmanr(pred, real_acc)
    return {
        "spearman_pred_vs_reward": float(rho_r.correlation), "p_reward": float(rho_r.pvalue),
        "spearman_pred_vs_test_acc": float(rho_a.correlation), "p_test_acc": float(rho_a.pvalue),
        "within_episode_rank_corr_mean": float(np.nanmean(per_ep_rho)) if per_ep_rho else float("nan"),
        "n_pairs": len(pred),
        "gate": {"reject_bad": gate_tp, "reject_good": gate_fp, "pass_bad": gate_fn, "pass_good": gate_tn,
                 "precision": gate_tp / max(1, gate_tp + gate_fp), "recall": gate_tp / max(1, gate_tp + gate_fn)},
    }


WEB_POLICIES = [
    "No repair (continue)", "Random arm", "Fixed rule map (AutoTrainer-style)", "LinUCB",
    "Thompson Sampling (proposed)", "Rule map + learned diagnosis", "TS + learned diagnosis, ext. library",
    "Restore checkpoint, learned gate", "Class-conditioned TS, ext. library",
    "Hybrid: restore + TS for environmental faults", "Oracle (6 arms)", "Oracle (ext. library, learned gate)",
]


def write_web_summary(eps, S):
    """Compact, display-ready results consumed by the website (frontend/public/data)."""
    import datetime
    A, B, C, F = S["A_landscape"], S["B_rule_diagnosis"], S["C_learned_diagnoser"], S["F_twin"]
    conds = ["nominal"] + FAULTS
    web = {
        "generated": datetime.datetime.utcnow().strftime("%Y-%m-%d"),
        "n_episodes": len(eps),
        "n_faulty": sum(e["condition"] != "nominal" for e in eps),
        "n_base_runs": len({(e["dataset"], e["seed"]) for e in eps}),
        "datasets": sorted({e["dataset"] for e in eps}),
        "n_seeds": len({e["seed"] for e in eps}),
        "landscape": {"conditions": conds, "actions": ACTIONS,
                      "recovery": [[round(A[c][a]["recovery"] * 100, 1) for a in ACTIONS] for c in conds],
                      "n": [A[c]["n"] for c in conds]},
        "diagnosis": {
            "rule_macro_f1": round(B["macro_f1"], 3), "rule_false_gate_rate": round(B["false_gate_rate_nominal"], 3),
            "rule_coverage": round(B["coverage_faulty"], 3),
            "learned_macro_f1": round(C["lodo_macro_f1"], 3), "learned_ece": round(C["lodo_ece"], 3),
            "learned_false_alarm_rate": round(C["lodo_false_alarm_rate"], 3),
            "learned_detection_recall": round(C["lodo_detection_recall"], 3),
        },
        "policies": [{
            "name": n, "recovery": round(S["D_policies"][n]["recovered"] * 100, 1),
            "ci": [round(v * 100, 1) for v in S["D_policies"][n]["recovered_ci"]],
            "acc_gap": round(S["D_policies"][n]["acc_gap"] * 100, 1),
            "harmful": round(S["D_policies"][n]["harmful"] * 100, 1),
            "oracle": n.startswith("Oracle"),
        } for n in WEB_POLICIES if n in S["D_policies"]],
        "ablation": [{
            "name": n, "recovery": round(S["E_ablation"][n]["recovered"] * 100, 1),
            "delta": round((S["E_ablation"][n]["recovered"] - S["E_ablation"]["TS full"]["recovered"]) * 100, 1),
            "p_holm": S["E_tests_recovery"].get(n, {}).get("p_holm"),
        } for n in S["E_ablation"]],
        "twin": {"spearman_test_acc": round(F["spearman_pred_vs_test_acc"], 3),
                 "gate_precision": round(F["gate"]["precision"], 3), "gate_recall": round(F["gate"]["recall"], 3)},
        "reward_alignment": round(S["D_reward_alignment"]["spearman_reward_vs_acc_gap"], 3),
    }
    paths = [os.path.join(OUT, "web_summary.json")]
    if REGIME == "ideal" and not os.environ.get("NO_WEB"):
        paths.append(os.path.join(ROOT, "frontend", "public", "data", "qfaultbench_results.json"))
    for path in paths:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(web, f, indent=1)


def main():
    os.makedirs(FIG, exist_ok=True)
    eps = load_episodes()
    print(f"loaded {len(eps)} episodes from {len(set((e['dataset'], e['seed']) for e in eps))} base runs")
    A = section_a(eps)
    B = section_b(eps)
    C = section_c(eps)
    F = section_f(eps)
    latent = REGIME.startswith("latent")
    pol, per_ep, curves = replay(eps, latent_policies() if latent else default_policies())
    abl, per_ep_abl, curves_abl = replay(eps, ablation_policies())
    tests_abl = paired_tests(eps, per_ep_abl, "TS full", "reward")
    tests_abl_rec = paired_tests(eps, per_ep_abl, "TS full", "recovered")
    if not latent:
        learners = ["Random arm", "Fixed rule map (AutoTrainer-style)", "Greedy linear", "epsilon-greedy linear",
                    "LinUCB", "Thompson Sampling (proposed)"]
        tests_reward = paired_tests(eps, {k: per_ep[k] for k in per_ep if k in learners}, "Thompson Sampling (proposed)", "reward")
        tests_recov = paired_tests(eps, {k: per_ep[k] for k in per_ep if k in learners}, "Thompson Sampling (proposed)", "recovered")
        fr = friedman(eps, per_ep, learners, "reward")
    else:
        learners = [n for n in ["Random action", "Rule map + learned diagnosis", "Thompson Sampling (6 arms)",
                                "TS + learned diagnosis, checkpoints", "Diagnosis-conditioned TS, checkpoints",
                                "Restore latest checkpoint", "Restore older clean checkpoint"] if n in per_ep]
        tests_reward = paired_tests(eps, {k: per_ep[k] for k in learners}, "Diagnosis-conditioned TS, checkpoints", "reward")
        tests_recov = paired_tests(eps, {k: per_ep[k] for k in learners}, "Diagnosis-conditioned TS, checkpoints", "recovered")
        fr = friedman(eps, per_ep, learners, "reward")
    integ = ["Hybrid: restore + TS for environmental faults", "Restore checkpoint, learned gate",
             "TS + learned diagnosis, ext. library", "Class-conditioned TS, ext. library", "Rule map + learned diagnosis",
             "TS + learned diagnosis (6 arms)", "Thompson Sampling (proposed)", "Restore last healthy checkpoint", "Random arm"]
    if latent:
        integ = ["Diagnosis-conditioned TS, checkpoints"] + [n for n in learners if n != "Diagnosis-conditioned TS, checkpoints"]
    tests_integ_rec = paired_tests(eps, {k: per_ep[k] for k in integ if k in per_ep}, integ[0], "recovered")
    tests_integ_gap = paired_tests(eps, {k: per_ep[k] for k in integ if k in per_ep}, integ[0], "acc_gap")
    # Reward alignment: does the W_val=3 multi-objective reward track the eventual outcome?
    rw, ac, rc = [], [], []
    for e in eps:
        if e["condition"] == "nominal":
            continue
        for a in ACTIONS[1:]:
            o = e["outcomes"][a]
            if o["applied"]:
                rw.append(o["reward"]); ac.append(o["acc_gap"]); rc.append(o["recovered"])
    rho = stats.spearmanr(rw, ac)
    pb = stats.pointbiserialr(rc, rw)
    align = {"spearman_reward_vs_acc_gap": float(rho.correlation), "p": float(rho.pvalue),
             "pointbiserial_reward_vs_recovered": float(pb.correlation), "p_pb": float(pb.pvalue), "n": len(rw)}
    summary = {"n_episodes": len(eps), "A_landscape": A, "B_rule_diagnosis": B, "C_learned_diagnoser": C,
               "D_policies": pol, "D_tests_vs_TS_reward": tests_reward, "D_tests_vs_TS_recovery": tests_recov,
               "D_friedman_reward": fr, "D_tests_integrated_recovery": tests_integ_rec,
               "D_tests_integrated_acc_gap": tests_integ_gap, "D_reward_alignment": align, "E_ablation": abl, "E_tests_reward": tests_abl, "E_tests_recovery": tests_abl_rec,
               "F_twin": F, "curves": curves, "curves_ablation": curves_abl}
    with open(os.path.join(OUT, "summary.json"), "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2, default=float)
    write_web_summary(eps, summary)
    print(json.dumps({k: summary[k] for k in ("B_rule_diagnosis",)}, indent=1, default=float)[:3000])
    print("wrote", os.path.join(OUT, "summary.json"))


if __name__ == "__main__":
    main()
