"""
Stage 8 Benchmark: Systematic Probability Calibration Experiment (N = 300)
Disjoint Seed Partitions:
  - Calibration Partition: Seeds [1001, 1002, 1003, 1004, 1005] (N = 150)
  - Test Partition:        Seeds [1006, 1007, 1008, 1009, 1010] (N = 150)
Strict separation: Zero data leakage between calibration and evaluation.
"""

import json
import os
import sys
import numpy as np
from scipy.optimize import minimize

# Ensure repository root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import VQCModel, CircuitConfig, FailureType
from backend.monitoring import HealthMonitor
from backend.detection import FailureDetector
from backend.diagnosis import DiagnosisEngine

CALIB_SEEDS = [1001, 1002, 1003, 1004, 1005]
TEST_SEEDS = [1006, 1007, 1008, 1009, 1010]

FAILURE_TYPES = [
    FailureType.BARREN_PLATEAU,
    FailureType.PERSISTENT_PLATEAU,
    FailureType.LR_MISCONFIGURATION,
    FailureType.OPTIMIZER_INSTABILITY,
    FailureType.TRAINING_DIVERGENCE,
    FailureType.NOISE_DEGRADATION,
]

C_CLASSES = len(FAILURE_TYPES)
TRIALS_PER_SEED_PER_CLASS = 5  # 5 * 6 * 5 = 150 per partition


def run_episode(seed: int, ft: FailureType, episode_idx: int) -> dict:
    """Run an isolated episode with failure injection and diagnosis."""
    config = CircuitConfig(n_qubits=2, n_layers=2, seed=seed + episode_idx * 17)
    model = VQCModel(config)
    detector = FailureDetector()
    diagnoser = DiagnosisEngine(confidence_threshold=0.60)
    monitor = HealthMonitor(window_size=10, experiment_id=f"cal_{ft.value}_{seed}_{episode_idx}")

    rng = np.random.RandomState(seed + episode_idx * 31)
    X_train = rng.uniform(0, np.pi, size=(30, 2))
    y_train = rng.randint(0, 2, size=30)

    # Warmup nominal training (3 steps)
    for _ in range(3):
        metrics = model.train_step(X_train, y_train, X_train, y_train)
        obs = monitor.record_step(metrics)
        summary = monitor.get_summary()
        detector.evaluate(summary, obs)

    # Inject failure mode
    model.inject_failure(ft, severity=0.85)

    diag = None
    detection_step = -1
    for step_idx in range(1, 8):
        metrics = model.train_step(X_train, y_train, X_train, y_train)
        obs = monitor.record_step(metrics)
        summary = monitor.get_summary()
        anomalies = detector.evaluate(summary, obs)
        if anomalies and diag is None:
            detection_step = step_idx
            diag = diagnoser.diagnose(anomalies, summary, obs)
            break

    if diag is not None:
        primary = diag.primary_cause
        conf = float(diag.confidence)
        probs = {str(k): float(v) for k, v in diag.probabilities.items()}
        # Reconstruct canonical shifted logits from production probabilities (T_prod = 0.50)
        # Since ln(p_c) - ln(max_p) = (s_c - max_s) / 0.50, we have (s_c - max_s) = 0.50 * (ln(p_c) - ln(max_p))
        max_p = max(probs.values())
        evidence_scores = {
            f.value: float(0.50 * (np.log(max(1e-12, probs.get(f.value, 1e-12))) - np.log(max_p)))
            for f in FAILURE_TYPES
        }
        is_correct = (primary == ft)
        cleared = bool(diag.confidence_gate_cleared)
        diagnosed = True
    else:
        primary = None
        conf = 1.0 / C_CLASSES
        probs = {f.value: 1.0 / C_CLASSES for f in FAILURE_TYPES}
        evidence_scores = {f.value: 0.0 for f in FAILURE_TYPES}
        is_correct = False
        cleared = False
        diagnosed = False

    return {
        "seed": seed,
        "episode_idx": episode_idx,
        "ground_truth": ft.value,
        "primary_cause": primary.value if primary else None,
        "confidence": conf,
        "gate_cleared": cleared,
        "is_correct": is_correct,
        "detection_step": detection_step,
        "diagnosed": diagnosed,
        "probabilities": probs,
        "evidence_scores": evidence_scores,
    }


def compute_calibration_metrics(records: list, temperature: float = 1.0, threshold: float = 0.60):
    """Compute strictly consistent calibration and classification metrics."""
    brier_mc_list = []
    binary_brier_list = []
    confidences = []
    accuracies = []
    gate_admissions = []
    tprs = []
    fprs = []

    for r in records:
        gt = r["ground_truth"]
        evidence = r["evidence_scores"]
        diagnosed = r["diagnosed"]

        if diagnosed and evidence:
            # Rescale evidence with temperature
            scores = np.array([evidence.get(f.value, 0.0) for f in FAILURE_TYPES], dtype=np.float64)
            scaled = (scores - np.max(scores)) / max(0.01, temperature)
            exp_scores = np.exp(scaled)
            probs = exp_scores / np.sum(exp_scores)
            pred_idx = int(np.argmax(probs))
            pred_class = FAILURE_TYPES[pred_idx].value
            conf = float(np.max(probs))
            is_corr = float(pred_class == gt)
        else:
            probs = np.full(C_CLASSES, 1.0 / C_CLASSES, dtype=np.float64)
            conf = 1.0 / C_CLASSES
            is_corr = 0.0

        # One-hot ground truth
        y_onehot = np.array([1.0 if f.value == gt else 0.0 for f in FAILURE_TYPES], dtype=np.float64)
        sq_err = float(np.sum((probs - y_onehot) ** 2))
        brier_mc_list.append(sq_err)

        binary_brier_list.append((conf - is_corr) ** 2)
        confidences.append(conf)
        accuracies.append(is_corr)

        # Gate admission decision: conf >= threshold
        admitted = conf >= threshold
        gate_admissions.append(admitted)

    conf_arr = np.array(confidences)
    acc_arr = np.array(accuracies)
    admit_arr = np.array(gate_admissions)
    N = len(conf_arr)

    # Reliability diagram & ECE (M = 5 bins)
    n_bins = 5
    bin_boundaries = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    reliability_diagram = []

    for i in range(n_bins):
        low, high = bin_boundaries[i], bin_boundaries[i + 1]
        mask = (conf_arr >= low) & (conf_arr <= high if i == n_bins - 1 else conf_arr < high)
        bin_count = int(np.sum(mask))
        if bin_count > 0:
            bin_acc = float(np.mean(acc_arr[mask]))
            bin_conf = float(np.mean(conf_arr[mask]))
            gap = abs(bin_acc - bin_conf)
            ece += (bin_count / N) * gap
            reliability_diagram.append({
                "bin_range": f"[{low:.1f}, {high:.1f}]",
                "count": bin_count,
                "mean_confidence": bin_conf,
                "empirical_accuracy": bin_acc,
                "calibration_gap": gap,
            })
        else:
            reliability_diagram.append({
                "bin_range": f"[{low:.1f}, {high:.1f}]",
                "count": 0,
                "mean_confidence": None,
                "empirical_accuracy": None,
                "calibration_gap": None,
            })

    # Classification rates at threshold
    tp = np.sum((admit_arr == True) & (acc_arr == 1.0))
    fp = np.sum((admit_arr == True) & (acc_arr == 0.0))
    tn = np.sum((admit_arr == False) & (acc_arr == 0.0))
    fn = np.sum((admit_arr == False) & (acc_arr == 1.0))

    tpr = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    precision = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
    abstention_rate = float(np.mean(admit_arr == False))

    return {
        "temperature": temperature,
        "threshold": threshold,
        "sample_size": N,
        "multiclass_brier": float(np.mean(brier_mc_list)),
        "binary_brier": float(np.mean(binary_brier_list)),
        "ece": float(ece),
        "tpr": tpr,
        "fpr": fpr,
        "precision": precision,
        "abstention_rate": abstention_rate,
        "youden_j": float(tpr - fpr),
        "reliability_diagram": reliability_diagram,
    }


def fit_optimal_temperature(calib_records: list) -> float:
    """Learn T* by minimizing Negative Log-Likelihood strictly on calibration split."""
    scores_list = []
    target_indices = []

    for r in calib_records:
        if r["diagnosed"] and r["evidence_scores"]:
            gt = r["ground_truth"]
            gt_idx = [f.value for f in FAILURE_TYPES].index(gt)
            scores = np.array([r["evidence_scores"].get(f.value, 0.0) for f in FAILURE_TYPES], dtype=np.float64)
            scores_list.append(scores)
            target_indices.append(gt_idx)

    if not scores_list:
        return 0.50

    scores_matrix = np.array(scores_list)
    targets = np.array(target_indices)

    def nll_objective(t_param):
        T = t_param[0]
        if T <= 0.01:
            return 1e9
        shifted = (scores_matrix - np.max(scores_matrix, axis=1, keepdims=True)) / T
        exp_s = np.exp(shifted)
        probs = exp_s / np.sum(exp_s, axis=1, keepdims=True)
        # Select target probabilities
        target_p = probs[np.arange(len(targets)), targets]
        nll = -np.mean(np.log(np.maximum(1e-12, target_p)))
        return nll

    res = minimize(nll_objective, [0.50], bounds=[(0.05, 5.0)], method="L-BFGS-B")
    return float(res.x[0]) if res.success else 0.50


def find_optimal_threshold(calib_records: list, temperature: float, max_fpr: float = 0.05) -> float:
    """Find threshold tau* maximizing Youden's J subject to FPR <= max_fpr on calibration split."""
    candidate_thresholds = np.linspace(1.0 / C_CLASSES, 0.99, 100)
    best_j = -1.0
    best_tau = 0.60

    for tau in candidate_thresholds:
        m = compute_calibration_metrics(calib_records, temperature=temperature, threshold=tau)
        if m["fpr"] <= max_fpr and m["youden_j"] > best_j:
            best_j = m["youden_j"]
            best_tau = float(tau)

    # Fallback to unrestricted Youden's J if constraint is too tight
    if best_j < 0.0:
        for tau in candidate_thresholds:
            m = compute_calibration_metrics(calib_records, temperature=temperature, threshold=tau)
            if m["youden_j"] > best_j:
                best_j = m["youden_j"]
                best_tau = float(tau)

    return best_tau


def main():
    print("=" * 70)
    print("Executing Stage 8: Systematic Calibration Benchmark (N = 300)")
    print("Disjoint Seed Partitions:")
    print(f"  Calibration Split (N=150): Seeds {CALIB_SEEDS}")
    print(f"  Test Split        (N=150): Seeds {TEST_SEEDS}")
    print("=" * 70)

    # 1. Execute Calibration Partition
    print("\n[Phase 1] Collecting Calibration Split (N = 150)...")
    calib_records = []
    for seed in CALIB_SEEDS:
        for ft in FAILURE_TYPES:
            for trial in range(TRIALS_PER_SEED_PER_CLASS):
                rec = run_episode(seed, ft, trial)
                calib_records.append(rec)
    print(f"  Collected {len(calib_records)} calibration episodes. Diagnosed: {sum(1 for r in calib_records if r['diagnosed'])}.")

    # 2. Execute Test Partition
    print("\n[Phase 2] Collecting Test Split (N = 150)...")
    test_records = []
    for seed in TEST_SEEDS:
        for ft in FAILURE_TYPES:
            for trial in range(TRIALS_PER_SEED_PER_CLASS):
                rec = run_episode(seed, ft, trial)
                test_records.append(rec)
    print(f"  Collected {len(test_records)} test episodes. Diagnosed: {sum(1 for r in test_records if r['diagnosed'])}.")

    # 3. Fit Parameters Strictly on Calibration Split
    print("\n[Phase 3] Optimizing Calibration Parameters on Calibration Split...")
    T_prod = 0.50
    tau_prod = 0.60

    T_opt = fit_optimal_temperature(calib_records)
    tau_opt = find_optimal_threshold(calib_records, temperature=T_opt, max_fpr=0.05)
    print(f"  Fitted Temperature T* = {T_opt:.4f} (Production: {T_prod:.2f})")
    print(f"  Optimized Threshold tau* = {tau_opt:.4f} (Production: {tau_prod:.2f}, Constraint FPR <= 0.05)")

    # 4. Evaluate on Untouched Test Split
    print("\n[Phase 4] Evaluating Performance on Untouched Test Split...")
    # Baseline Uncalibrated Production on Test
    test_metrics_prod = compute_calibration_metrics(test_records, temperature=T_prod, threshold=tau_prod)
    # Calibrated on Test
    test_metrics_calib = compute_calibration_metrics(test_records, temperature=T_opt, threshold=tau_opt)
    # Calibration Split Metrics for Reference
    calib_metrics_prod = compute_calibration_metrics(calib_records, temperature=T_prod, threshold=tau_prod)
    calib_metrics_calib = compute_calibration_metrics(calib_records, temperature=T_opt, threshold=tau_opt)

    uniform_baseline = 5.0 / 6.0  # 0.8333

    print("\n" + "=" * 70)
    print("STAGE 8 CALIBRATION BENCHMARK RESULTS (TEST SPLIT N = 150)")
    print("=" * 70)
    print(f"Metric                          Production (T=0.50, tau=0.60)   Calibrated (T*={T_opt:.2f}, tau*={tau_opt:.2f})")
    print("-" * 70)
    print(f"Multiclass Brier Score:         {test_metrics_prod['multiclass_brier']:.4f}                          {test_metrics_calib['multiclass_brier']:.4f}  (Uniform: {uniform_baseline:.4f})")
    print(f"Binary Confidence Brier:        {test_metrics_prod['binary_brier']:.4f}                          {test_metrics_calib['binary_brier']:.4f}")
    print(f"Expected Calibration Error:     {test_metrics_prod['ece']:.4f}                          {test_metrics_calib['ece']:.4f}")
    print(f"True Positive Rate (TPR):       {test_metrics_prod['tpr']*100:.2f}%                         {test_metrics_calib['tpr']*100:.2f}%")
    print(f"False Positive Rate (FPR):      {test_metrics_prod['fpr']*100:.2f}%                         {test_metrics_calib['fpr']*100:.2f}%")
    print(f"Precision at Gate:              {test_metrics_prod['precision']*100:.2f}%                         {test_metrics_calib['precision']*100:.2f}%")
    print(f"Abstention Rate at Gate:        {test_metrics_prod['abstention_rate']*100:.2f}%                         {test_metrics_calib['abstention_rate']*100:.2f}%")
    print(f"Youden's J Statistic:           {test_metrics_prod['youden_j']:.4f}                          {test_metrics_calib['youden_j']:.4f}")
    print("=" * 70)

    # Save comprehensive results
    out_dir = os.path.join(os.path.dirname(__file__), "..", "benchmark_results")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "calibration_n300_results.json")

    results_payload = {
        "metadata": {
            "experiment": "N=300 Systematic Probability Calibration Benchmark",
            "calib_seeds": CALIB_SEEDS,
            "test_seeds": TEST_SEEDS,
            "n_calib": len(calib_records),
            "n_test": len(test_records),
            "uniform_brier_baseline": uniform_baseline,
            "production_temperature": T_prod,
            "production_threshold": tau_prod,
            "calibrated_temperature": T_opt,
            "calibrated_threshold": tau_opt,
        },
        "calib_split_metrics": {
            "production": calib_metrics_prod,
            "calibrated": calib_metrics_calib,
        },
        "test_split_metrics": {
            "production": test_metrics_prod,
            "calibrated": test_metrics_calib,
        },
        "calib_raw_records": calib_records,
        "test_raw_records": test_records,
    }

    with open(out_file, "w") as f:
        json.dump(results_payload, f, indent=2)

    print(f"\nRaw results and reliability diagram data saved to: {out_file}")


if __name__ == "__main__":
    main()
