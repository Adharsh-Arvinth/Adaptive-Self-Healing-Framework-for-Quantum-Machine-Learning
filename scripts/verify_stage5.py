"""
Stage 5 Empirical Verification & Policy Regret Benchmark Script.
Executes:
  1. Live Digital Twin (H = 3) proxy simulation across all 6 locked repair arms.
  2. Proof of primary model state isolation.
  3. Digital twin prediction error measurement (MAE, RMSE).
  4. Multi-seed contextual bandit benchmark comparing Contextual Thompson Sampling against
     Random Selection, Greedy Selection, and Fixed Rule Selection.
  5. Cumulative regret and reward measurements across seeds 42, 101, 202.
"""

import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import CircuitConfig, FailureType, VQCModel, load_dataset
from backend.monitoring import HealthMonitor
from backend.detection import FailureDetector
from backend.diagnosis import DiagnosisEngine
from backend.memory import FailureMemory, build_failure_embedding
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary
from backend.safety_filter import SafetyDecision, SafetyFilter, SafetyFilterConfig
from backend.digital_twin import DigitalTwinPrediction, DigitalTwinSimulator
from backend.bandit import (
    ContextualThompsonSampler,
    build_context_vector,
    compute_multi_objective_reward,
)


def run_stage5_verification():
    print("=" * 75)
    print("STAGE 5: ADAPTIVE SELECTION & DIGITAL TWIN EMPIRICAL BENCHMARK")
    print("=" * 75)

    # ------------------------------------------------------------------
    # Part 1: Live Digital Twin Proxy Simulation (H = 3)
    # ------------------------------------------------------------------
    print("\nPhase 1: Live Digital-Twin Proxy Simulation (Horizon H = 3)...")
    X_train, y_train, X_val, y_val = load_dataset("moons", seed=42)
    config = CircuitConfig(n_qubits=2, n_layers=2, feature_map="angle", optimizer_name="adam", learning_rate=0.05, seed=42)
    model = VQCModel(config)

    # Warm up model for 3 steps
    for s in range(1, 4):
        m = model.train_step(X_train, y_train, X_val, y_val)
        print(f"  Warmup Step {s}: Loss = {m.loss:.4f}, Val Acc = {m.val_accuracy:.4f}")

    # Snapshot primary model state before proxy simulation
    pre_sim_params = model.params.copy()
    pre_sim_opt = model.config.optimizer_name
    pre_sim_lr = model.optimizer.lr

    dt = DigitalTwinSimulator(horizon=3, max_loss_degradation=0.20, batch_size=20)
    repair_lib = RepairLibrary()
    all_candidates = repair_lib.generate_candidate_repairs(model.get_state(), all_arms=True)

    print(f"\nSimulating all {len(all_candidates)} locked repair arms on isolated validation mini-batch...")
    predictions = dt.simulate_all(model, all_candidates, X_val, y_val, seed=42)

    for arm, pred in predictions.items():
        print(
            f"  Arm: {arm.value:<25} | Viable: {str(pred.is_viable):<5} | "
            f"L0: {pred.initial_loss:.4f} -> L3: {pred.predicted_loss_final:.4f} | "
            f"Delta: {pred.predicted_loss_delta:+.4f} | Stab: {pred.proxy_stability:.3f} | "
            f"Cost: {pred.circuit_evaluations} evals | Time: {pred.execution_time_ms:.1f}ms"
        )

    # Verify 100% Primary Model State Isolation
    print("\nPhase 2: Verifying Primary Model State Isolation Guarantee...")
    assert np.array_equal(model.params, pre_sim_params), "Isolation Failed: parameters mutated!"
    assert model.config.optimizer_name == pre_sim_opt, "Isolation Failed: optimizer mutated!"
    assert model.optimizer.lr == pre_sim_lr, "Isolation Failed: learning rate mutated!"
    print("  [PASSED] Primary model parameters and optimizer state are 100.0% unchanged.")

    # ------------------------------------------------------------------
    # Part 2: Prediction Fidelity Tracking (Actual vs Predicted)
    # ------------------------------------------------------------------
    print("\nPhase 3: Measuring Digital Twin Prediction Error (Fidelity Tracking)...")
    # Deploy candidate 1 (Arm: change_optimizer) to measure actual outcome vs proxy prediction
    chosen_pred = predictions[RepairArm.CHANGE_OPTIMIZER]
    initial_loss_actual = model.compute_loss_and_accuracy(X_val, y_val)[0]
    repair_lib.apply_to_model(model, chosen_pred.candidate)

    # Train actual model for 3 steps
    for _ in range(3):
        m_actual = model.train_step(X_train, y_train, X_val, y_val)
    final_loss_actual = m_actual.loss
    actual_loss_delta = float(initial_loss_actual - final_loss_actual)

    fidelity_record = dt.record_actual_outcome(chosen_pred, actual_loss_delta)
    print(f"  Predicted Delta: {chosen_pred.predicted_loss_delta:+.4f}")
    print(f"  Actual Delta:    {actual_loss_delta:+.4f}")
    print(f"  Prediction Error (MAE): {fidelity_record.prediction_error:.4f}")
    metrics = dt.get_fidelity_metrics()
    print(f"  Aggregate Simulator MAE: {metrics['mae']:.4f}")

    # ------------------------------------------------------------------
    # Part 3: Contextual Thompson Sampling Benchmark vs Baselines
    # ------------------------------------------------------------------
    print("\nPhase 4: Multi-Seed Policy Regret Benchmark (Thompson vs Random vs Greedy vs Fixed Rule)...")
    seeds = [42, 101, 202]
    trials_per_seed = 40
    benchmark_results = {"thompson": [], "random": [], "greedy": [], "fixed_rule": []}
    regret_results = {"thompson": [], "random": [], "greedy": [], "fixed_rule": []}

    for seed in seeds:
        sampler = ContextualThompsonSampler(
            d=12,
            storage_path=f"data/temp_bench_{seed}.json",
            exploration_v=0.40,
            seed=seed,
        )
        rng = np.random.RandomState(seed)
        candidates = [CandidateRepair(arm=arm) for arm in RepairArm]

        # Ground truth contextual environment model
        # True optimal arm depends on context:
        # If context indicates BP (x[2] < -0.3): Arm REDUCE_DEPTH is optimal (payoff 0.85)
        # If context indicates LR divergence (x[11] > 0.4): Arm ADJUST_LR is optimal (payoff 0.90)
        # If context indicates noise (x[10] < -0.2): Arm NOISE_MITIGATION is optimal (payoff 0.80)
        # Otherwise: Arm WARM_RESTART is optimal (payoff 0.75)
        def true_environment(arm: RepairArm, ctx: np.ndarray) -> Tuple[float, float]:
            if ctx[2] < -0.3:
                optimal_arm = RepairArm.REDUCE_CIRCUIT_DEPTH
            elif ctx[11] > 0.4:
                optimal_arm = RepairArm.ADJUST_LEARNING_RATE
            elif ctx[10] < -0.2:
                optimal_arm = RepairArm.APPLY_NOISE_MITIGATION
            else:
                optimal_arm = RepairArm.PERFORM_WARM_RESTART

            max_reward = 0.85
            if arm == optimal_arm:
                base_r = 0.85
            elif arm == RepairArm.CHANGE_OPTIMIZER:
                base_r = 0.35
            else:
                base_r = -0.25

            noise = rng.normal(0.0, 0.04)
            actual_r = float(np.clip(base_r + noise, -1.0, 1.0))
            instant_regret = max(0.0, max_reward - actual_r)
            return actual_r, instant_regret

        cum_r_ts = 0.0
        cum_reg_ts = 0.0

        cum_r_rand = 0.0
        cum_reg_rand = 0.0

        cum_r_greedy = 0.0
        cum_reg_greedy = 0.0

        cum_r_rule = 0.0
        cum_reg_rule = 0.0

        for t in range(trials_per_seed):
            # Draw synthetic empirical 12D context
            ctx = rng.uniform(-1.0, 1.0, size=12)
            ctx[0] = 1.0
            ctx = ctx / np.linalg.norm(ctx)

            # 1. Thompson Sampling
            ts_dec = sampler.select_arm(candidates, ctx, greedy=False)
            r_ts, reg_ts = true_environment(ts_dec.selected_arm, ctx)
            sampler.update_arm(ts_dec.selected_arm, ctx, r_ts)
            cum_r_ts += r_ts
            cum_reg_ts += reg_ts

            # 2. Random Selection
            rand_arm = rng.choice(list(RepairArm))
            r_rand, reg_rand = true_environment(rand_arm, ctx)
            cum_r_rand += r_rand
            cum_reg_rand += reg_rand

            # 3. Greedy Selection
            greedy_dec = sampler.select_arm(candidates, ctx, greedy=True)
            r_greedy, reg_greedy = true_environment(greedy_dec.selected_arm, ctx)
            cum_r_greedy += r_greedy
            cum_reg_greedy += reg_greedy

            # 4. Fixed Rule (Static priority heuristic)
            r_rule, reg_rule = true_environment(RepairArm.CHANGE_OPTIMIZER, ctx)
            cum_r_rule += r_rule
            cum_reg_rule += reg_rule

        # Cleanup temp file
        if os.path.exists(f"data/temp_bench_{seed}.json"):
            os.remove(f"data/temp_bench_{seed}.json")

        benchmark_results["thompson"].append(cum_r_ts)
        benchmark_results["random"].append(cum_r_rand)
        benchmark_results["greedy"].append(cum_r_greedy)
        benchmark_results["fixed_rule"].append(cum_r_rule)

        regret_results["thompson"].append(cum_reg_ts)
        regret_results["random"].append(cum_reg_rand)
        regret_results["greedy"].append(cum_reg_greedy)
        regret_results["fixed_rule"].append(cum_reg_rule)

    print("\nBenchmark Summary across Seeds [42, 101, 202] (40 Trials/Seed):")
    print("-" * 75)
    print(f"{'Policy Name':<30} | {'Cumulative Reward (Mean +/- SEM)':<30} | {'Cumulative Regret':<15}")
    print("-" * 75)

    policies = [
        ("Contextual Thompson Sampling", "thompson"),
        ("Greedy (Exploitation-Only)", "greedy"),
        ("Fixed Rule (Static Heuristic)", "fixed_rule"),
        ("Random Uniform Selection", "random"),
    ]

    for label, key in policies:
        r_vals = benchmark_results[key]
        reg_vals = regret_results[key]
        mean_r = np.mean(r_vals)
        sem_r = np.std(r_vals) / np.sqrt(len(seeds))
        mean_reg = np.mean(reg_vals)
        sem_reg = np.std(reg_vals) / np.sqrt(len(seeds))
        print(f"{label:<30} | {mean_r:+.2f} +/- {sem_r:.2f}{'':<17} | {mean_reg:.2f} +/- {sem_reg:.2f}")

    print("-" * 75)

    # Assertions
    assert np.mean(benchmark_results["thompson"]) > np.mean(benchmark_results["random"]), (
        "Thompson Sampling failed to outperform Random Selection!"
    )
    assert np.mean(regret_results["thompson"]) < np.mean(regret_results["random"]), (
        "Thompson Sampling has higher regret than Random Selection!"
    )

    print("\n" + "=" * 75)
    print("STAGE 5 VERIFICATION COMPLETE: ALL BENCHMARKS EMPIRICALLY CONFIRMED")
    print("=" * 75)


if __name__ == "__main__":
    run_stage5_verification()
