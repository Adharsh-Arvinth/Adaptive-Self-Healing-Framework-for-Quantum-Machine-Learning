"""
Publication figures from research/results/summary.json.

    python -m research.figures

Style: one sequential blue for magnitudes, neutral gray for baselines, one accent (blue) for the
proposed method, orange for the oracle reference. No dual axes; direct labels; 300 dpi PDF + PNG.
"""

import json
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.colors import LinearSegmentedColormap

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
_REGIME = os.environ.get("REGIME", "ideal")
RES = os.path.join(ROOT, "research", "results") if _REGIME == "ideal" else os.path.join(ROOT, "research", "results", _REGIME)
FIG = os.path.join(RES, "figures")

BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"
INK, INK2, MUTED, GRID = "#0b0b0b", "#52514e", "#9a9893", "#e6e4df"
SEQ = LinearSegmentedColormap.from_list("seq_blue", ["#f4f8fd", "#cfe0f6", "#8fb7ea", "#4f8fdc", "#2a78d6", "#1a4f93"])
FAULT_LABEL = {
    "nominal": "Nominal", "barren_plateau": "Barren plateau", "lr_misconfiguration": "LR misconfig.",
    "optimizer_instability": "Optimizer instab.", "training_divergence": "Divergence (NaN)",
    "persistent_plateau": "Step-size collapse", "noise_degradation": "Noise degradation",
}
ACTION_LABEL = {
    "noop": "No repair", "rollback_healthy": "Restore ckpt.", "change_optimizer": "Change optim.",
    "reduce_circuit_depth": "Reduce depth", "modify_feature_map": "Feature map", "adjust_learning_rate": "Adjust LR",
    "apply_noise_mitigation": "Noise mitig.", "perform_warm_restart": "Warm restart",
}

plt.rcParams.update({
    "font.family": "DejaVu Sans", "font.size": 8.5, "axes.edgecolor": MUTED, "axes.labelcolor": INK2,
    "xtick.color": INK2, "ytick.color": INK2, "axes.spines.top": False, "axes.spines.right": False,
    "axes.grid": False, "figure.dpi": 150, "savefig.bbox": "tight", "pdf.fonttype": 42,
})


def save(fig, name):
    os.makedirs(FIG, exist_ok=True)
    for ext in ("pdf", "png"):
        fig.savefig(os.path.join(FIG, f"{name}.{ext}"), dpi=300)
    plt.close(fig)


def fig_landscape(S):
    A = S["A_landscape"]
    rows = ["nominal", "barren_plateau", "lr_misconfiguration", "optimizer_instability",
            "training_divergence", "persistent_plateau", "noise_degradation"]
    cols = list(ACTION_LABEL)
    M = np.array([[A[r][c]["recovery"] * 100 for c in cols] for r in rows])
    fig, ax = plt.subplots(figsize=(7.0, 3.1))
    im = ax.imshow(M, cmap=SEQ, vmin=0, vmax=100, aspect="auto")
    for i in range(M.shape[0]):
        for j in range(M.shape[1]):
            ax.text(j, i, f"{M[i, j]:.0f}", ha="center", va="center", fontsize=7.5,
                    color="white" if M[i, j] > 62 else INK)
    ax.set_xticks(range(len(cols)), [ACTION_LABEL[c] for c in cols], rotation=30, ha="right")
    ax.set_yticks(range(len(rows)), [f"{FAULT_LABEL[r]} (n={A[r]['n']})" for r in rows])
    ax.tick_params(length=0)
    for s in ax.spines.values():
        s.set_visible(False)
    ax.set_xticks(np.arange(-.5, len(cols)), minor=True)
    ax.set_yticks(np.arange(-.5, len(rows)), minor=True)
    ax.grid(which="minor", color="white", linewidth=2)
    cb = fig.colorbar(im, ax=ax, fraction=0.025, pad=0.02)
    cb.set_label("Recovery rate (%)", color=INK2)
    cb.outline.set_visible(False)
    ax.set_title("Counterfactual recovery: every action applied from the identical decision state", loc="left", color=INK, fontsize=9)
    save(fig, "fig_counterfactual_landscape")


def fig_regret(S):
    C = S["curves"]
    show = [("Random arm", MUTED, "--"), ("Fixed rule map (AutoTrainer-style)", INK2, ":"),
            ("LinUCB", AQUA, "-"), ("Thompson Sampling (proposed)", BLUE, "-")]
    fig, ax = plt.subplots(figsize=(3.5, 2.6))
    for name, col, ls in show:
        c = C[name]
        x = np.arange(len(c["mean"])) * 10
        ax.plot(x, c["mean"], color=col, ls=ls, lw=2 if "proposed" in name else 1.4)
        ax.fill_between(x, c["lo"], c["hi"], color=col, alpha=0.12, lw=0)
        lab = name.replace(" (proposed)", "").replace(" (AutoTrainer-style)", "")
        ax.annotate(lab, (x[-1], c["mean"][-1]), xytext=(4, 0), textcoords="offset points", va="center", fontsize=7, color=INK2)
    ax.set_xlabel("Episodes (all datasets, random order)")
    ax.set_ylabel("Cumulative regret vs. oracle")
    ax.yaxis.grid(True, color=GRID, lw=0.6)
    ax.set_xlim(0, None)
    save(fig, "fig_cumulative_regret")


def fig_policies(S):
    P = S["D_policies"]
    names = [n for n in P if not n.startswith("Oracle")]
    names = sorted(names, key=lambda n: P[n]["recovered"])
    fig, ax = plt.subplots(figsize=(5.2, 3.0))
    y = np.arange(len(names))
    vals = np.array([P[n]["recovered"] * 100 for n in names])
    lo = np.array([P[n]["recovered_ci"][0] * 100 for n in names])
    hi = np.array([P[n]["recovered_ci"][1] * 100 for n in names])
    cols = [BLUE if "proposed" in n or n.startswith("TS") else "#b9c7d8" for n in names]
    ax.barh(y, vals, color=cols, height=0.62)
    ax.errorbar(vals, y, xerr=[vals - lo, hi - vals], fmt="none", ecolor=INK2, elinewidth=0.9, capsize=2)
    for n, ref in (("Oracle (6 arms)", ORANGE), ("Oracle (extended library)", ORANGE)):
        v = P[n]["recovered"] * 100
        ax.axvline(v, color=ref, lw=1, ls="--" if "6 arms" in n else ":")
        ax.text(v, -1.15, "oracle" + (" (6 arms)" if "6 arms" in n else " (ext.)"), color=INK2, fontsize=6.5, ha="center", va="top", bbox=dict(facecolor="white", edgecolor="none", pad=1.5))
    for yi, v, h in zip(y, vals, hi):
        ax.text(h + 1.2, yi, f"{v:.1f}", va="center", fontsize=7, color=INK2)
    ax.set_xlim(0, 104)
    ax.set_ylim(-1.6, len(names) - 0.4)
    ax.set_yticks(y, names)
    ax.set_xlabel("Recovery rate on faulty episodes (%), 95% cluster-bootstrap CI", labelpad=14)
    ax.tick_params(axis="y", length=0)
    ax.xaxis.grid(True, color=GRID, lw=0.6)
    ax.set_axisbelow(True)
    save(fig, "fig_policy_recovery")


def fig_diagnosis(S):
    B, C = S["B_rule_diagnosis"], S["C_learned_diagnoser"]
    labels = C["labels"]
    rule_cols = labels + ["held/none"]
    R = np.array([[B["confusion"][t][p] for p in rule_cols] for t in labels], dtype=float)
    R = R / R.sum(1, keepdims=True) * 100
    L = np.array(C["lodo_confusion"], dtype=float)
    L = L / L.sum(1, keepdims=True) * 100
    short = [FAULT_LABEL[l].replace(" (NaN)", "") for l in labels]
    fig, axes = plt.subplots(1, 2, figsize=(7.2, 3.0), gridspec_kw={"width_ratios": [8, 7]})
    for ax, M, cols, title in ((axes[0], R, short + ["Held"], f"Expert rules (online, gated) - macro-F1 {B['macro_f1']:.2f}"),
                               (axes[1], L, short, f"Learned (leave-one-dataset-out) - macro-F1 {C['lodo_macro_f1']:.2f}")):
        ax.imshow(M, cmap=SEQ, vmin=0, vmax=100, aspect="auto")
        for i in range(M.shape[0]):
            for j in range(M.shape[1]):
                if M[i, j] >= 0.5:
                    ax.text(j, i, f"{M[i, j]:.0f}", ha="center", va="center", fontsize=6.5, color="white" if M[i, j] > 62 else INK)
        ax.set_xticks(range(len(cols)), cols, rotation=40, ha="right", fontsize=7)
        ax.set_yticks(range(len(short)), short if ax is axes[0] else [""] * len(short), fontsize=7)
        ax.tick_params(length=0)
        for s in ax.spines.values():
            s.set_visible(False)
        ax.set_title(title, loc="left", fontsize=8, color=INK)
        ax.set_xlabel("Predicted (% of true class)")
    axes[0].set_ylabel("True condition")
    save(fig, "fig_diagnosis_confusion")


def fig_ablation(S):
    E = S["E_ablation"]
    T = S["E_tests_recovery"]
    base = E["TS full"]["recovered"] * 100
    names = [n for n in E if n != "TS full"]
    d = np.array([E[n]["recovered"] * 100 - base for n in names])
    order = np.argsort(d)
    fig, ax = plt.subplots(figsize=(4.6, 2.5))
    y = np.arange(len(names))
    ax.barh(y, d[order], color=["#b9c7d8" if v >= 0 else BLUE for v in d[order]], height=0.6)
    ax.axvline(0, color=INK2, lw=0.8)
    for yi, i in zip(y, order):
        p = T[names[i]]["p_holm"]
        star = "***" if p < 1e-3 else "**" if p < 1e-2 else "*" if p < 0.05 else "n.s."
        v = d[i]
        ax.text(v + (0.3 if v >= 0 else -0.3), yi, f"{v:+.1f} {star}", va="center", ha="left" if v >= 0 else "right", fontsize=7, color=INK2)
    ax.set_yticks(y, [names[i].replace("TS - ", "without ") for i in order])
    ax.tick_params(axis="y", length=0)
    ax.set_xlabel("Change in recovery rate vs. full framework (pp)")
    ax.xaxis.grid(True, color=GRID, lw=0.6)
    ax.set_axisbelow(True)
    lim = max(3, np.abs(d).max() * 1.45)
    ax.set_xlim(-lim, lim)
    save(fig, "fig_ablation")


def main():
    S = json.load(open(os.path.join(RES, "summary.json"), encoding="utf-8"))
    fig_landscape(S)
    fig_regret(S)
    fig_policies(S)
    fig_diagnosis(S)
    fig_ablation(S)
    print("figures written to", FIG)


if __name__ == "__main__":
    main()
