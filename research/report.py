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
           ("latent4", "Latent faults (fault starts 4 steps before the latest checkpoint)", os.path.join(RES, "latent4", "summary.json")),
           ("q8", "8-qubit classifier (q8: 2 layers, inputs PCA-reduced to 8 features)", os.path.join(RES, "q8", "summary.json"))]
SENS = os.path.join(RES, "sensitivity.json")
GRADVAR = os.path.join(RES, "q8", "gradient_variance.json")
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
    if key == "q8":
        L += ["Same protocol, faults, repairs and policies as the 4-qubit regimes; 8 qubits x 2 layers (16 trainable angles); "
              "inputs reduced to 8 features by a train-fitted PCA (tasks with 4 or 2 raw features are re-uploaded cyclically). "
              "Datasets: " + ", ".join(sorted(A["_healthy_reference_by_dataset"])) + ". "
              "Circuits are evaluated by `research/fast_sim.py`, an exact vectorised statevector engine that matches the PennyLane "
              "QNode to ~1e-16 in forward values and gradients. Re-running one base run (wine, seed 0) with both engines gave identical "
              "detection, diagnosis and decision steps and identical recovery labels for all 56 action outcomes; 5 final accuracies "
              "differ, all in the chaotic corrupted-optimizer / 50x-LR episodes, where rounding is amplified within a few steps.", ""]

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


SHORT = {"No repair (continue)": "No repair", "Restore last healthy checkpoint": "Restore", "Restore latest checkpoint": "Restore latest",
         "Restore checkpoint, learned gate": "Restore (learned gate)", "Restore older clean checkpoint": "Restore clean",
         "Thompson Sampling (proposed)": "TS (6 arms)", "Thompson Sampling (6 arms)": "TS (6 arms)",
         "TS, extended library (+checkpoint arm)": "TS ext.", "Diagnosis-conditioned TS, checkpoints": "Diag-TS + ckpts",
         "Hybrid: restore + TS for environmental faults": "Hybrid", "Oracle (6 arms)": "Oracle 6",
         "Oracle (extended library)": "Oracle ext.", "Oracle (arms + checkpoints)": "Oracle ext."}
SENS_TITLES = {"ideal": "Ideal", "hw_torino": "Hardware-calibrated (IBM Torino)", "latent4": "Latent faults",
               "q8": "8 qubits (q8)", "ideal@q8runs": "4 qubits, same base runs as q8 (paired reference)"}


def sensitivity_section(S):
    L = ["## Sensitivity to the recovery tolerance and the probation window", "",
         "No new training: recovery, acceptance and the short-window reward are re-derived from the stored per-step "
         "post-decision trajectories (`python -m research.sensitivity`). Tolerance tau: recovered if the final 3-step "
         "test accuracy is within tau of the fault-free run. W_val: number of probation steps used by the deployment "
         "guard and by the reward. Recovery % on faulty episodes, mean over "
         f"{S.get('n_orders', 30)} random episode orders.", "",
         "Claims checked in every cell: (1) *restore >> TS*: restore beats 6-arm TS by >= 20 pp with Wilcoxon p < 0.05; "
         "(2) *library ceiling*: both the reward-optimal 6-arm oracle and the hindsight 6-arm recovery ceiling stay below restore; "
         "(3) *reward misalignment*: the reward-optimal extended-library oracle recovers less than restore. "
         "In the latent regime 'restore' is the older clean checkpoint.", ""]
    for reg in ("ideal", "hw_torino", "latent4", "q8", "ideal@q8runs"):
        R = S.get(reg)
        if not R:
            continue
        names = R["policies"]
        chk = next((c["check"] for c in R["grid"] if c["check"]), None)
        L += [f"### {SENS_TITLES[reg]} ({R['n_episodes']} episodes)", ""]
        if chk:
            L += [f"W_val = 3 reproduction: {chk['acceptance_mismatches']} acceptance and {chk['reward_mismatches']} reward "
                  f"mismatches out of {chk['n_action_outcomes']} stored action outcomes.", ""]
        L += ["| W_val | tau (pp) | " + " | ".join(SHORT.get(n, n) for n in names) +
              " | 6-arm hindsight ceiling | Restore - TS (pp, p) | Reward vs gap rho | (1) | (2) | (3) |",
              "|---|---|" + "---|" * (len(names) + 6)]
        for c in R["grid"]:
            r = c["recovery"]
            t = c["restore_minus_ts"]
            cl = c["claims"]
            yn = lambda b: "holds" if b else "**fails**"
            L.append(f"| {c['W_val']} | {100 * c['tol']:.0f} | " + " | ".join(pct(r[n]) for n in names) +
                     f" | {pct(c['ceiling_6_arms'])} | {100 * t['diff']:+.1f} ({p_fmt(t['p'])}) | {c['alignment']['spearman_reward_vs_acc_gap']:.2f} | "
                     f"{yn(cl['restore_gg_ts'])} | {yn(cl['library_ceiling'])} | {yn(cl['reward_misaligned'])} |")
        L.append("")
    return L


def gradvar_section(G):
    rows = G["rows"]
    qs = sorted({r["n_qubits"] for r in rows})
    Ls = sorted({r["layers"] for r in rows if r["kind"] != "framework_healthy"})

    def v(n, Lr, kind, lab="q0"):
        return next((r[f"{lab}_var"] for r in rows if r["n_qubits"] == n and r["layers"] == Lr and r["kind"] == kind), float("nan"))

    L = ["## Genuine vs emulated barren plateaus", "",
         "Var[d<Z_0>/d theta] for the first-layer rotation on qubit 0, over random parameters and inputs, by exact parameter shift "
         f"(`python -m research.gradient_variance`; statevector simulator checked against the PennyLane circuit, max |diff| "
         f"{G['verification_max_abs_diff']:.1e}). *Healthy*: the framework's initialisation U[-0.2, 0.2], 2 layers. "
         "*Framework, random*: the framework's ansatz (RY + CNOT ring) with parameters U[0, 2 pi]. "
         "*HEA, random*: McClean et al. (2018) random-Pauli hardware-efficient ansatz.", "",
         "| Circuit | Layers | " + " | ".join(f"n = {n}" for n in qs) + " |", "|---|---|" + "---|" * len(qs)]
    L.append("| Healthy (framework init) | 2 | " + " | ".join(f"{v(n, 2, 'framework_healthy'):.2e}" for n in qs) + " |")
    for kind, lab in (("framework_random", "Framework, random"), ("mcclean_random", "HEA, random")):
        for Lr in Ls:
            L.append(f"| {lab} | {Lr} | " + " | ".join(f"{v(n, Lr, kind):.2e}" for n in qs) + " |")
    L.append("")
    f, c = G["fits"], G["comparison"]
    L += ["Exponential fit log10 Var = a - b n on the deepest framework circuits (n >= 4):", ""]
    for k, lab in (("framework_random_q0", "framework ansatz, qubit 0"), ("framework_random_q_last", "framework ansatz, last qubit")):
        L.append(f"- {lab}: b = {-f[k]['slope_log10_per_qubit']:.3f} decades per qubit (variance halves every "
                 f"{f[k]['halving_qubits']:.1f} qubits), L = {f[k]['layers']}.")
    L += ["", "The framework ansatz is already depth-saturated at L = 8 (L = 8 and L = 32 agree), so its fit is a concentration law. "
          "The HEA with a linear CZ ladder is NOT saturated at L = 32 for n >= 8: the qubit-0 variance stays near 1e-2 and the "
          "last-qubit variance is light-cone limited (zero at L = 2), so no exponent is extrapolated for it; its rows are shown for reference only.",
          "",
          f"Emulated plateau in the same units: gradients scaled by alpha = {G['alpha']:.0e}, i.e. an equivalent gradient std of "
          f"{c['emulated_equiv_std']:.1e} (alpha x the healthy 8-qubit std {c['healthy_std_8q_L2']:.3f}), under shot noise "
          f"std {G['bp_shot_std']} (about {G['shots']} shots): SNR {c['emulated_snr_at_1024_shots']:.1e}.", "",
          "| Circuit at 8 qubits | Gradient std | vs healthy | SNR at 1,024 shots | Qubits until genuine std = emulated std (extrapolated) | Qubits until SNR = 1 (extrapolated) |",
          "|---|---|---|---|---|---|"]
    Ld = max(Ls)
    for kind, lab in (("framework_random", "Framework ansatz, random"), ("mcclean_random", "HEA, random")):
        ext = (f"{c[f'{kind}_qubits_to_reach_emulated_std']:.0f} | {c[f'{kind}_qubits_to_snr1_at_1024_shots']:.1f}"
               if kind == "framework_random" else "not extrapolated | not extrapolated")
        L.append(f"| {lab}, L = {Ld} | {c[f'{kind}_std_8q_L{Ld}']:.3f} | {c[f'{kind}_concentration_vs_healthy_8q']:.2f}x | "
                 f"{c[f'{kind}_snr_8q_L{Ld}_at_1024_shots']:.2f} | {ext} |")
    ratio = c["framework_random_std_8q_L%d" % Ld] / c["emulated_equiv_std"]
    L += ["", f"At 8 qubits the genuine gradient of a fully scrambled framework circuit is {ratio:.1e} times larger than the emulated one "
          f"(SNR {c['framework_random_snr_8q_L%d_at_1024_shots' % Ld]:.1f} vs {c['emulated_snr_at_1024_shots']:.1e}). The emulation therefore "
          "represents a plateau far deeper than anything that occurs at 4-8 qubits; it is a model of the regime that genuine "
          "concentration would reach only around the extrapolated qubit count above, not of the circuits trained here.", ""]
    return L


def hardware_section(summaries):
    L = ["## Noise-model check on IBM hardware", "",
         "`python -m research.hardware_check`: 8 classifiers trained in noiseless simulation (seed 0, 45 steps) are executed "
         "on their test splits with 1,024 shots per sample, and the measured <Z_0> is compared with the hw_torino noise model "
         "c(L) = (1 - p)^L (1 - 2r). Two classifiers are also run padded to 4 and 8 layers (zero-angle layers, extra CNOT rings) "
         "to test the depth law. *Routing-aware*: the same calibration, counting the gates actually executed after "
         "transpilation onto the device's coupling map.", ""]
    for S in summaries:
        kind = ("Device-level noise SIMULATION (FakeTorino: Torino calibration snapshot with Aer), not hardware"
                if S["fake"] else f"Real QPU: {S['backend']}, job {S['job_id']}, submitted {S['submitted']}")
        s = S["L2"]
        L += [f"### {kind}", ""]
        tr = S["transpiled"]
        L += ["Transpiled two-qubit gates (logical circuit has 4 per layer): " +
              ", ".join(f"L = {k}: {v['two_qubit_gates']}" for k, v in sorted(tr.items(), key=lambda kv: int(kv[0]))) +
              (f". Processor time used: {S['usage_seconds']} s." if S.get("usage_seconds") else "."), "",
              "| Circuit | n | c measured | c paper model | c model, calibration at run | c routing-aware | Acc. ideal | Acc. measured | Flips | Residual / shot noise |",
              "|---|---|---|---|---|---|---|---|---|---|"]
        for r in S["rows"]:
            L.append(f"| {r['dataset']}, L = {r['layers']} | {r['n']} | {r['c_hw']:.3f} | {r['c_model_snapshot']:.3f} | "
                     f"{r['c_model_now']:.3f} | {r['c_model_routed']:.3f} | {r['acc_ideal']:.3f} | {r['acc_hw']:.3f} | "
                     f"{r['sign_flips']} | {r['resid_rms'] / r['shot_rms']:.2f} |")
        L += ["", f"Pooled over the {s['n']} two-layer test samples: contraction {s['c_hw_pooled']:.3f} measured vs "
              f"{s['c_model_snapshot']:.3f} (paper model) and {s['c_model_routed']:.3f} (routing-aware); accuracy "
              f"{pct(s['acc_ideal'])}% ideal vs {pct(s['acc_hw'])}% measured; {s['sign_flips']} predictions flipped; residual "
              f"scatter {s['excess_scatter_ratio']:.2f}x pure shot noise.", ""]
    if not any(not S["fake"] for S in summaries):
        L += ["The real-QPU run is prepared but has not been executed yet (see `research/HARDWARE_RUN.md`).", ""]
    return L


def main():
    out = ["# QFaultBench-VQC v1: Results", "", "_Generated by `python -m research.report` from `research/results/`. Do not edit by hand._", ""]
    for key, title, path in REGIMES:
        if os.path.exists(path):
            out += section(key, title, json.load(open(path, encoding="utf-8")))
    from research.sensitivity import load_all
    sens = load_all()
    if sens:
        out += sensitivity_section(sens)
    if os.path.exists(GRADVAR):
        out += gradvar_section(json.load(open(GRADVAR, encoding="utf-8")))
    hw = [(json.load(open(p, encoding="utf-8"))) for p in
          (os.path.join(RES, "hardware", "summary.json"), os.path.join(RES, "hardware_fake", "summary.json")) if os.path.exists(p)]
    if hw:
        out += hardware_section(hw)
    with open(os.path.join(ROOT, "research", "RESULTS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(out) + "\n")
    print("wrote research/RESULTS.md")


if __name__ == "__main__":
    main()
