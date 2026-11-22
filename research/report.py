"""
Generate research/RESULTS.md from research/results/**/summary.json (no hand-typed numbers).

    python -m research.report
"""

import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
RES = os.path.join(ROOT, "research", "results")
REGIMES = [("ideal", "Ideal (noiseless statevector)", os.path.join(RES, "summary.json")),
           ("hw_torino", "Hardware-calibrated (IBM Torino noise baseline)", os.path.join(RES, "hw_torino", "summary.json")),
           ("latent4", "Latent faults (fault starts 4 steps before the latest checkpoint)", os.path.join(RES, "latent4", "summary.json"))]
ACTIONS = ["noop", "rollback_healthy", "change_optimizer", "reduce_circuit_depth", "modify_feature_map",
           "adjust_learning_rate", "apply_noise_mitigation", "perform_warm_restart"]
ACT = {"noop": "No repair", "rollback_healthy": "Restore ckpt", "rollback_clean": "Restore clean ckpt", "change_optimizer": "Optimizer", "reduce_circuit_depth": "Depth",
       "modify_feature_map": "Feat. map", "adjust_learning_rate": "LR", "apply_noise_mitigation": "Mitigation",
       "perform_warm_restart": "Warm restart"}
CONDS = ["nominal", "barren_plateau", "lr_misconfiguration", "optimizer_instability", "training_divergence",
         "persistent_plateau", "noise_degradation"]
COND = {"nominal": "Nominal", "barren_plateau": "Barren plateau (emul.)", "lr_misconfiguration": "LR too large",
        "optimizer_instability": "Optimizer corrupted", "training_divergence": "Divergence (NaN)",
        "persistent_plateau": "Step-size collapse", "noise_degradation": "Noise degradation"}


def pct(x):
    return f"{100 * x:.1f}"


def p_fmt(p):
    return "<1e-6" if p < 1e-6 else f"{p:.3g}"


def section(key, title, S):
    A, B, C, F = S["A_landscape"], S["B_rule_diagnosis"], S["C_learned_diagnoser"], S["F_twin"]
    n_base = len({k for k in S["A_landscape"]["_healthy_reference_by_dataset"]})
    L = [f"## {title}", "", f"{S['n_episodes']} episodes. Recovery = mean test accuracy over the last 3 steps within 5 points of the fault-free run at the same step.", ""]

    acts = ACTIONS + (["rollback_clean"] if "rollback_clean" in A["nominal"] else [])
    L += ["### Counterfactual recovery (%) by fault and action", "",
          "| Condition | n | " + " | ".join(ACT[a] for a in acts) + " | Best arm (6) |",
          "|---|---|" + "---|" * (len(acts) + 1)]
    for c in CONDS:
        L.append(f"| {COND[c]} | {A[c]['n']} | " + " | ".join(f"{100 * A[c][a]['recovery']:.0f}" for a in acts)
                 + f" | {100 * A[c]['any_arm_recovers']:.0f} |")
    L.append("")

    L += ["### Diagnosis", "",
          "| Diagnoser | Macro-F1 | Notes |", "|---|---|---|",
          f"| Expert rules (online, gated) | {B['macro_f1']:.3f} | false gate on healthy runs {pct(B['false_gate_rate_nominal'])}%, coverage {pct(B['coverage_faulty'])}%, admitted precision {pct(B['admitted_precision'])}% |",
          f"| Learned, leave-one-dataset-out | {C['lodo_macro_f1']:.3f} | ECE {C['lodo_ece']:.3f}, false alarms {pct(C['lodo_false_alarm_rate'])}%, detection recall {pct(C['lodo_detection_recall'])}% |",
          f"| Learned, seed-disjoint | {C.get('seed_split_macro_f1', float('nan')):.3f} | train seeds < {C.get('seed_split_cut', 20)}, test seeds >= |", "",
          "Per-dataset macro-F1 (LODO): " + ", ".join(f"{k} {v:.2f}" for k, v in sorted(C["lodo_per_dataset_macro_f1"].items())), ""]

    L += ["### Repair policies (faulty episodes; mean over random episode orders; 95% cluster-bootstrap CI)", "",
          "| Policy | Recovery % | 95% CI | Acc. gap (pp) | Harmful commits % | Healthy-run interventions % |",
          "|---|---|---|---|---|---|"]
    for n, r in S["D_policies"].items():
        L.append(f"| {n} | {pct(r['recovered'])} | {pct(r['recovered_ci'][0])}-{pct(r['recovered_ci'][1])} | {100 * r['acc_gap']:+.1f} | {pct(r['harmful'])} | {pct(r['nominal_intervention_rate'])} |")
    L.append("")
    ref = "the diagnosis-conditioned TS policy" if key.startswith("latent") else "the hybrid policy"
    L += [f"Paired Wilcoxon on per-run means vs. {ref} (recovery), Holm-corrected:", "",
          "| Comparator | Diff (pp) | p (Holm) | Cohen's d_z |", "|---|---|---|---|"]
    for n, t in S["D_tests_integrated_recovery"].items():
        L.append(f"| {n} | {100 * t['mean_diff']:+.1f} | {p_fmt(t['p_holm'])} | {t['cohens_dz']:.2f} |")
    fr = S["D_friedman_reward"]
    L += ["", f"Friedman test across the six learning/heuristic policies (reward): chi2 = {fr['chi2']:.1f}, p = {p_fmt(fr['p'])}, {fr['n_blocks']} blocks.", ""]

    L += ["### Ablation of the Thompson-sampling pipeline", "",
          "| Variant | Recovery % | Harmful % | p (Holm, recovery) |", "|---|---|---|---|"]
    for n, r in S["E_ablation"].items():
        t = S["E_tests_recovery"].get(n)
        L.append(f"| {n} | {pct(r['recovered'])} | {pct(r['harmful'])} | {p_fmt(t['p_holm']) if t else '-'} |")
    L.append("")

    g = F["gate"]
    al = S["D_reward_alignment"]
    L += ["### Digital twin and reward signal", "",
          f"- Twin prediction vs realised test accuracy: Spearman {F['spearman_pred_vs_test_acc']:.3f} (within-episode rank correlation {F['within_episode_rank_corr_mean']:.3f}, n = {F['n_pairs']}).",
          f"- Twin veto: precision {pct(g['precision'])}% (vetoed repairs that were indeed bad), recall {pct(g['recall'])}% (bad repairs caught).",
          f"- Short-window reward vs eventual accuracy gap: Spearman {al['spearman_reward_vs_acc_gap']:.3f}; point-biserial vs recovery {al['pointbiserial_reward_vs_recovered']:.3f} (n = {al['n']}).", ""]
    return L


def main():
    out = ["# QFaultBench-VQC v1: Results", "", "_Generated by `python -m research.report` from `research/results/`. Do not edit by hand._", ""]
    for key, title, path in REGIMES:
        if os.path.exists(path):
            out += section(key, title, json.load(open(path, encoding="utf-8")))
    with open(os.path.join(ROOT, "research", "RESULTS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print("wrote research/RESULTS.md")


if __name__ == "__main__":
    main()
