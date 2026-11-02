"""
Stage 8: Automated Publication Figures Generator
Produces vector PDFs and high-resolution PNGs directly from recorded benchmark JSON outputs:
  - Figure 1: Probability Calibration & Reliability Diagrams (Test Set N=150)
  - Figure 2: Multi-Seed Cumulative Reward & Regret Trajectories with 95% CIs
  - Figure 3: Architectural Ablation Study Comparisons (Success, Rollback, Overhead)
  - Figure 4: Per-Class Diagnostic Confusion Matrix & Repair Arm Allocations
  - Figure 5: Dynamic Recovery Trajectory (Loss, Gradient, Bloch Coordinates)
"""

import json
import os
import sys

# Ensure repository root is in python path
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.ticker as ticker

# Styling for academic publications (IEEE / Nature style)
plt.rcParams.update({
    "font.family": "serif",
    "font.size": 10,
    "axes.labelsize": 11,
    "axes.titlesize": 12,
    "xtick.labelsize": 9,
    "ytick.labelsize": 9,
    "legend.fontsize": 9,
    "figure.titlesize": 13,
    "figure.dpi": 300,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
})

RESULTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "benchmark_results"))
FIGURES_DIR = os.path.join(RESULTS_DIR, "figures")
os.makedirs(FIGURES_DIR, exist_ok=True)


def plot_figure1_calibration():
    """Figure 1: Reliability Diagrams for Production vs Calibrated on Test Split."""
    json_path = os.path.join(RESULTS_DIR, "calibration_n300_results.json")
    if not os.path.exists(json_path):
        print(f"Skipping Figure 1: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        data = json.load(f)

    test_prod = data["test_split_metrics"]["production"]
    test_calib = data["test_split_metrics"]["calibrated"]

    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2), sharey=True)

    # Subplot A: Production
    ax = axes[0]
    bins_prod = test_prod["reliability_diagram"]
    bin_centers = [0.1, 0.3, 0.5, 0.7, 0.9]
    accs_prod = [b["empirical_accuracy"] if b["empirical_accuracy"] is not None else 0.0 for b in bins_prod]
    counts_prod = [b["count"] for b in bins_prod]

    ax.plot([0, 1], [0, 1], "k--", label="Perfect Calibration", alpha=0.6, linewidth=1.2)
    bars = ax.bar(bin_centers, accs_prod, width=0.16, alpha=0.65, color="#1f77b4", edgecolor="#0b3c5d", label="Empirical Accuracy")
    
    # Annotate counts
    for bc, cnt, acc in zip(bin_centers, counts_prod, accs_prod):
        if cnt > 0:
            ax.text(bc, acc + 0.03, f"n={cnt}", ha="center", va="bottom", fontsize=7.5, color="#0b3c5d")

    ax.set_title(r"(a) Production ($T=0.50, \tau=0.60$)" + f"\nECE = {test_prod['ece']:.3f} | Brier = {test_prod['multiclass_brier']:.3f}")
    ax.set_xlabel("Confidence Bin")
    ax.set_ylabel("Empirical Accuracy")
    ax.set_xlim(0, 1.0)
    ax.set_ylim(0, 1.15)
    ax.legend(loc="upper left", framealpha=0.9)
    ax.grid(True, linestyle=":", alpha=0.5)

    # Subplot B: Calibrated
    ax = axes[1]
    bins_calib = test_calib["reliability_diagram"]
    accs_calib = [b["empirical_accuracy"] if b["empirical_accuracy"] is not None else 0.0 for b in bins_calib]
    counts_calib = [b["count"] for b in bins_calib]

    ax.plot([0, 1], [0, 1], "k--", label="Perfect Calibration", alpha=0.6, linewidth=1.2)
    bars = ax.bar(bin_centers, accs_calib, width=0.16, alpha=0.65, color="#2ca02c", edgecolor="#145214", label="Empirical Accuracy")
    
    for bc, cnt, acc in zip(bin_centers, counts_calib, accs_calib):
        if cnt > 0:
            ax.text(bc, acc + 0.03, f"n={cnt}", ha="center", va="bottom", fontsize=7.5, color="#145214")

    ax.set_title(r"(b) Calibrated ($T^*=1.70, \tau^*=0.84$)" + f"\nECE = {test_calib['ece']:.3f} | Brier = {test_calib['multiclass_brier']:.3f}")
    ax.set_xlabel("Confidence Bin")
    ax.set_xlim(0, 1.0)
    ax.legend(loc="upper left", framealpha=0.9)
    ax.grid(True, linestyle=":", alpha=0.5)

    plt.tight_layout()
    out_png = os.path.join(FIGURES_DIR, "figure1_calibration_reliability.png")
    out_pdf = os.path.join(FIGURES_DIR, "figure1_calibration_reliability.pdf")
    plt.savefig(out_png)
    plt.savefig(out_pdf)
    plt.close()
    print(f"Generated Figure 1: {out_png}")


def plot_figure2_policy_regret():
    """Figure 2: Multi-Seed Policy Regret & Cumulative Reward Trajectories with 95% CIs."""
    json_path = os.path.join(RESULTS_DIR, "policy_regret_benchmark.json")
    if not os.path.exists(json_path):
        print(f"Skipping Figure 2: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        data = json.load(f)

    policies = ["thompson_sampling", "greedy", "heuristic", "random"]
    labels = {
        "thompson_sampling": "Contextual Thompson Sampling (Proposed)",
        "greedy": "Greedy Policy (No Exploration)",
        "heuristic": "Fixed-Rule Heuristic",
        "random": "Random Uniform Selection",
    }
    colors = {
        "thompson_sampling": "#1f77b4",
        "greedy": "#ff7f0e",
        "heuristic": "#2ca02c",
        "random": "#d62728",
    }

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

    episodes = np.arange(1, 31)

    # Subplot A: Cumulative Reward
    ax = axes[0]
    for p in policies:
        runs = data["detailed_results"][p]
        trajectories = np.array([r["reward_trajectory"] for r in runs])
        mean_traj = np.mean(trajectories, axis=0)
        std_traj = np.std(trajectories, axis=0, ddof=1)
        ci_traj = 2.262 * std_traj / np.sqrt(len(runs))

        ax.plot(episodes, mean_traj, color=colors[p], label=labels[p], linewidth=1.8)
        ax.fill_between(episodes, mean_traj - ci_traj, mean_traj + ci_traj, color=colors[p], alpha=0.15)

    ax.set_title("(a) Cumulative Self-Healing Reward")
    ax.set_xlabel("Failure Episodes")
    ax.set_ylabel(r"Cumulative Reward $\sum r_t$")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="lower right", framealpha=0.9, fontsize=8)

    # Subplot B: Cumulative Regret
    ax = axes[1]
    for p in policies:
        runs = data["detailed_results"][p]
        trajectories = np.array([r["regret_trajectory"] for r in runs])
        mean_traj = np.mean(trajectories, axis=0)
        std_traj = np.std(trajectories, axis=0, ddof=1)
        ci_traj = 2.262 * std_traj / np.sqrt(len(runs))

        ax.plot(episodes, mean_traj, color=colors[p], label=labels[p], linewidth=1.8)
        ax.fill_between(episodes, mean_traj - ci_traj, mean_traj + ci_traj, color=colors[p], alpha=0.15)

    ax.set_title("(b) Cumulative Policy Regret")
    ax.set_xlabel("Failure Episodes")
    ax.set_ylabel(r"Cumulative Regret $\sum (r^*_t - r_t)$")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="upper left", framealpha=0.9, fontsize=8)

    plt.tight_layout()
    out_png = os.path.join(FIGURES_DIR, "figure2_policy_regret_trajectories.png")
    out_pdf = os.path.join(FIGURES_DIR, "figure2_policy_regret_trajectories.pdf")
    plt.savefig(out_png)
    plt.savefig(out_pdf)
    plt.close()
    print(f"Generated Figure 2: {out_png}")


def plot_figure3_ablation():
    """Figure 3: Architectural Ablation Study Summary Bar Chart."""
    json_path = os.path.join(RESULTS_DIR, "ablation_study_results.json")
    if not os.path.exists(json_path):
        print(f"Skipping Figure 3: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        data = json.load(f)

    configs = ["full_framework", "no_digital_twin", "no_episodic_memory", "no_safety_filter"]
    labels = ["Full Framework\n(Proposed)", "No Digital Twin\n(No Proxy)", "No Memory\n(No Retrieval)", "No Safety Filter\n(Unconstrained)"]
    
    succ_means = [data["summary"][c]["success_rate_mean"] * 100 for c in configs]
    succ_stds = [data["summary"][c]["success_rate_std"] * 100 for c in configs]
    roll_means = [data["summary"][c]["rollback_rate_mean"] * 100 for c in configs]
    roll_stds = [data["summary"][c]["rollback_rate_std"] * 100 for c in configs]

    x = np.arange(len(configs))
    width = 0.35

    fig, ax = plt.subplots(figsize=(8.5, 4.2))

    rects1 = ax.bar(x - width/2, succ_means, width, yerr=succ_stds, capsize=4, label="Recovery Success Rate (%)", color="#1f77b4", alpha=0.85)
    rects2 = ax.bar(x + width/2, roll_means, width, yerr=roll_stds, capsize=4, label="Rollback Rate (%)", color="#d62728", alpha=0.85)

    ax.set_ylabel("Rate (%)")
    ax.set_title("Architectural Ablation Analysis across 10 Seeds (N = 300 Episodes)")
    ax.set_xticks(x)
    ax.set_xticklabels(labels)
    ax.set_ylim(0, 115)
    ax.legend(loc="upper right", framealpha=0.9)
    ax.grid(True, linestyle=":", alpha=0.5, axis="y")

    # Value labels
    for rect in rects1:
        h = rect.get_height()
        ax.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width()/2, h + 3), ha="center", va="bottom", fontsize=8)
    for rect in rects2:
        h = rect.get_height()
        ax.annotate(f"{h:.1f}%", xy=(rect.get_x() + rect.get_width()/2, h + 3), ha="center", va="bottom", fontsize=8)

    plt.tight_layout()
    out_png = os.path.join(FIGURES_DIR, "figure3_ablation_performance.png")
    out_pdf = os.path.join(FIGURES_DIR, "figure3_ablation_performance.pdf")
    plt.savefig(out_png)
    plt.savefig(out_pdf)
    plt.close()
    print(f"Generated Figure 3: {out_png}")


def plot_figure4_per_class():
    """Figure 4: Per-Class Diagnostic Confusion Matrix & Repair Distribution."""
    json_path = os.path.join(RESULTS_DIR, "per_class_performance.json")
    if not os.path.exists(json_path):
        print(f"Skipping Figure 4: {json_path} not found.")
        return

    with open(json_path, "r") as f:
        data = json.load(f)

    classes = data["metadata"]["classes"]
    short_classes = ["Barren Plt", "Persist Plt", "LR Miscfg", "Opt Instab", "Divergence", "Noise Deg"]
    cm = data["confusion_matrix"]

    # Build matrix array
    mat = np.zeros((len(classes), len(classes)))
    for i, c_true in enumerate(classes):
        row_sum = max(1, sum(cm[c_true].values()))
        for j, c_pred in enumerate(classes):
            mat[i, j] = cm[c_true].get(c_pred, 0) / row_sum

    fig, axes = plt.subplots(1, 2, figsize=(11.5, 4.8))

    # Subplot A: Confusion Matrix Heatmap
    ax = axes[0]
    im = ax.imshow(mat, cmap="Blues", vmin=0, vmax=1.0)
    ax.set_xticks(np.arange(len(short_classes)))
    ax.set_yticks(np.arange(len(short_classes)))
    ax.set_xticklabels(short_classes, rotation=35, ha="right")
    ax.set_yticklabels(short_classes)
    ax.set_xlabel("Predicted Failure Diagnosis")
    ax.set_ylabel("Ground-Truth Injected Mode")
    ax.set_title("(a) Diagnostic Classification Matrix")

    for i in range(len(classes)):
        for j in range(len(classes)):
            val = mat[i, j]
            color = "white" if val > 0.5 else "black"
            ax.text(j, i, f"{val:.2f}", ha="center", va="center", color=color, fontsize=8)

    fig.colorbar(im, ax=ax, fraction=0.046, pad=0.04)

    # Subplot B: Recovery Success Rate by Category
    ax = axes[1]
    rep = data["classification_report"]
    succ_rates = [rep[c]["success_rate"] * 100 for c in classes]
    f1_scores = [rep[c]["f1_score"] * 100 for c in classes]

    x = np.arange(len(classes))
    width = 0.35

    ax.bar(x - width/2, f1_scores, width, label="Diagnosis F1-Score (%)", color="#9467bd", alpha=0.85)
    ax.bar(x + width/2, succ_rates, width, label="Recovery Success Rate (%)", color="#2ca02c", alpha=0.85)

    ax.set_xticks(x)
    ax.set_xticklabels(short_classes, rotation=35, ha="right")
    ax.set_ylabel("Score / Rate (%)")
    ax.set_title("(b) Per-Category Diagnostic F1 & Recovery Success")
    ax.set_ylim(0, 115)
    ax.legend(loc="upper right", framealpha=0.9, fontsize=8.5)
    ax.grid(True, linestyle=":", alpha=0.5, axis="y")

    plt.tight_layout()
    out_png = os.path.join(FIGURES_DIR, "figure4_per_class_confusion_and_repairs.png")
    out_pdf = os.path.join(FIGURES_DIR, "figure4_per_class_confusion_and_repairs.pdf")
    plt.savefig(out_png)
    plt.savefig(out_pdf)
    plt.close()
    print(f"Generated Figure 4: {out_png}")


def plot_figure5_dynamic_recovery():
    """Figure 5: Dynamic Closed-Loop Recovery Trajectory under Induced Quantum Failure."""
    from backend.qml_model import CircuitConfig, VQCModel, FailureType
    from backend.pipeline import SelfHealingPipeline, PipelineState

    seed = 101
    rng = np.random.RandomState(seed)
    config = CircuitConfig(n_qubits=2, n_layers=2, seed=seed)
    model = VQCModel(config)

    db_path = "data/fig5_trace_mem.db"
    post_path = "data/fig5_trace_post.json"
    if os.path.exists(db_path):
        os.remove(db_path)
    if os.path.exists(post_path):
        os.remove(post_path)

    pipeline = SelfHealingPipeline(
        model=model,
        experiment_id="fig5_trace",
        memory_db_path=db_path,
        bandit_storage_path=post_path,
        confidence_threshold=0.60,
        validation_window=3,
        seed=seed,
    )

    X_train = rng.uniform(0, np.pi, size=(30, 2))
    y_train = rng.randint(0, 2, size=30)
    X_val = rng.uniform(0, np.pi, size=(20, 2))
    y_val = rng.randint(0, 2, size=20)

    steps = []
    losses = []
    val_losses = []
    grad_norms = []
    bloch_radii = []
    purities = []
    states = []

    # Phase 1: Nominal training (Steps 1-3)
    for _ in range(3):
        res = pipeline.step(X_train, y_train, X_val, y_val)
        b_coord = pipeline.model.get_bloch_coordinates()
        steps.append(pipeline.step_count)
        losses.append(float(res.metrics.loss))
        val_losses.append(float(res.metrics.val_loss))
        grad_norms.append(float(res.metrics.gradient_norm))
        bloch_radii.append(float(b_coord["radius"]))
        purities.append(float(b_coord["purity"]))
        states.append(res.state)

    # Phase 2: Inject Noise Degradation
    pipeline.model.inject_failure(FailureType.NOISE_DEGRADATION, severity=0.90)

    # Phase 3: Run through failure detection, diagnosis, deployment, and recovery
    for _ in range(8):
        res = pipeline.step(X_train, y_train, X_val, y_val)
        b_coord = pipeline.model.get_bloch_coordinates()
        steps.append(pipeline.step_count)
        losses.append(float(res.metrics.loss))
        val_losses.append(float(res.metrics.val_loss))
        grad_norms.append(float(res.metrics.gradient_norm))
        bloch_radii.append(float(b_coord["radius"]))
        purities.append(float(b_coord["purity"]))
        states.append(res.state)

    # Phase 4: Clean up temporary trace databases
    if os.path.exists(db_path):
        try:
            os.remove(db_path)
        except Exception:
            pass
    if os.path.exists(post_path):
        try:
            os.remove(post_path)
        except Exception:
            pass

    # Plot 3-panel dynamic recovery
    fig, axes = plt.subplots(3, 1, figsize=(9.5, 7.5), sharex=True)
    steps_arr = np.array(steps)

    # Subplot A: Loss Trajectory
    ax = axes[0]
    ax.plot(steps_arr, losses, "o-", color="#1f77b4", label="Training Loss $L_{train}$", linewidth=1.8, markersize=4)
    ax.plot(steps_arr, val_losses, "s--", color="#ff7f0e", label="Validation Loss $L_{val}$", linewidth=1.5, markersize=4)
    ax.axvspan(0.8, 3.2, color="#2ca02c", alpha=0.12, label="Nominal Training")
    ax.axvspan(3.2, 5.2, color="#d62728", alpha=0.15, label="Failure Active (Noise Drift)")
    ax.axvspan(5.2, 8.5, color="#ffbb78", alpha=0.20, label="Digital Twin & Safe Validation ($W_{val}=3$)")
    ax.axvspan(8.5, max(steps_arr)+0.2, color="#aec7e8", alpha=0.20, label="Autonomous Recovery Committed")
    ax.set_ylabel("Loss")
    ax.set_title("(a) Closed-Loop Self-Healing Loss Dynamics")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="upper left", framealpha=0.9, fontsize=8)

    # Subplot B: Gradient Norm
    ax = axes[1]
    ax.plot(steps_arr, grad_norms, "D-", color="#9467bd", label=r"Gradient Norm $\|\nabla_\theta L\|_2$", linewidth=1.8, markersize=4)
    ax.axvspan(0.8, 3.2, color="#2ca02c", alpha=0.12)
    ax.axvspan(3.2, 5.2, color="#d62728", alpha=0.15)
    ax.axvspan(5.2, 8.5, color="#ffbb78", alpha=0.20)
    ax.axvspan(8.5, max(steps_arr)+0.2, color="#aec7e8", alpha=0.20)
    ax.set_ylabel(r"$\|\nabla_\theta L\|_2$")
    ax.set_title(r"(b) Analytic Parameter-Shift Gradient Stability")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="upper left", framealpha=0.9, fontsize=8)

    # Subplot C: Bloch Vector Radius and Purity
    ax = axes[2]
    ax.plot(steps_arr, bloch_radii, "^-", color="#2ca02c", label=r"Bloch Radius $r = \|\vec{r}\|_2$", linewidth=1.8, markersize=4)
    ax.plot(steps_arr, purities, "v--", color="#17becf", label=r"State Purity $\gamma = (1 + r^2)/2$", linewidth=1.5, markersize=4)
    ax.axvspan(0.8, 3.2, color="#2ca02c", alpha=0.12)
    ax.axvspan(3.2, 5.2, color="#d62728", alpha=0.15)
    ax.axvspan(5.2, 8.5, color="#ffbb78", alpha=0.20)
    ax.axvspan(8.5, max(steps_arr)+0.2, color="#aec7e8", alpha=0.20)
    ax.set_xlabel("Pipeline Step $t$")
    ax.set_ylabel("Quantum State Metric")
    ax.set_title(r"(c) Physical Bloch Sphere Contraction and Stabilization")
    ax.grid(True, linestyle=":", alpha=0.5)
    ax.legend(loc="lower left", framealpha=0.9, fontsize=8)

    plt.tight_layout()
    out_png = os.path.join(FIGURES_DIR, "figure5_dynamic_recovery_trace.png")
    out_pdf = os.path.join(FIGURES_DIR, "figure5_dynamic_recovery_trace.pdf")
    plt.savefig(out_png)
    plt.savefig(out_pdf)
    plt.close()
    print(f"Generated Figure 5: {out_png}")


def main():
    print("=" * 70)
    print("Stage 8: Generating Publication Figures Directly from Benchmark Data")
    print(f"Output Directory: {FIGURES_DIR}")
    print("=" * 70)
    plot_figure1_calibration()
    plot_figure2_policy_regret()
    plot_figure3_ablation()
    plot_figure4_per_class()
    plot_figure5_dynamic_recovery()
    print("Figure generation complete.")


if __name__ == "__main__":
    main()
