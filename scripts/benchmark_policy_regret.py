"""
Stage 8 Benchmark: Multi-Seed Policy Regret Benchmark & Paired Statistical Tests
Comparing 4 Policies across 10 Independent Seeds [42, 101, 202, 303, 404, 505, 606, 707, 808, 909]:
  1. Contextual Thompson Sampling (Adaptive Self-Healing Proposed Policy)
  2. Greedy Policy (Posterior Mean Exploitation without Exploration)
  3. Fixed-Rule Heuristic (Static Deterministic Failure Mapping)
  4. Random Uniform Policy (Uniform Selection among Eligible Arms)
"""

import json
import os
import sys
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import VQCModel, CircuitConfig, FailureType
from backend.pipeline import SelfHealingPipeline, PipelineState
from backend.repair_library import RepairArm, CandidateRepair
from backend.bandit import BanditDecision

SEEDS = [42, 101, 202, 303, 404, 505, 606, 707, 808, 909]
FAILURE_TYPES = [
    FailureType.BARREN_PLATEAU,
    FailureType.PERSISTENT_PLATEAU,
    FailureType.LR_MISCONFIGURATION,
    FailureType.OPTIMIZER_INSTABILITY,
    FailureType.TRAINING_DIVERGENCE,
    FailureType.NOISE_DEGRADATION,
]

HEURISTIC_MAP = {
    FailureType.BARREN_PLATEAU: RepairArm.REDUCE_CIRCUIT_DEPTH,
    FailureType.PERSISTENT_PLATEAU: RepairArm.REDUCE_CIRCUIT_DEPTH,
    FailureType.LR_MISCONFIGURATION: RepairArm.ADJUST_LEARNING_RATE,
    FailureType.OPTIMIZER_INSTABILITY: RepairArm.CHANGE_OPTIMIZER,
    FailureType.TRAINING_DIVERGENCE: RepairArm.PERFORM_WARM_RESTART,
    FailureType.NOISE_DEGRADATION: RepairArm.APPLY_NOISE_MITIGATION,
}


def run_policy_benchmark_for_seed(seed: int, policy_name: str, episodes_per_class: int = 5) -> dict:
    """Run full benchmark for a specific policy under a fixed random seed."""
    rng = np.random.RandomState(seed)
    
    config = CircuitConfig(n_qubits=2, n_layers=2, seed=seed)
    model = VQCModel(config)
    
    db_path = f"data/benchmark_mem_{policy_name}_{seed}.db"
    post_path = f"data/benchmark_post_{policy_name}_{seed}.json"
    if os.path.exists(db_path):
        os.remove(db_path)
    if os.path.exists(post_path):
        os.remove(post_path)
        
    pipeline = SelfHealingPipeline(
        model=model,
        experiment_id=f"regret_{policy_name}_{seed}",
        memory_db_path=db_path,
        bandit_storage_path=post_path,
        confidence_threshold=0.60,
        validation_window=3,
        seed=seed,
    )
    
    # Configure policy selection mechanism
    original_select_arm = pipeline.bandit.select_arm
    
    def policy_select_arm(candidates, context, safety_decisions=None, twin_predictions=None, greedy=False):
        if policy_name == "thompson_sampling":
            return original_select_arm(candidates, context, safety_decisions, twin_predictions, greedy=False)
        elif policy_name == "greedy":
            return original_select_arm(candidates, context, safety_decisions, twin_predictions, greedy=True)
        elif policy_name == "heuristic":
            # Map primary diagnosed cause to preferred arm
            curr_diag = pipeline._current_diagnosis
            ft = curr_diag.primary_cause if curr_diag else FailureType.OPTIMIZER_INSTABILITY
            preferred = HEURISTIC_MAP.get(ft, RepairArm.CHANGE_OPTIMIZER)
            
            # Find candidate with matching arm
            matching = [c for c in candidates if c.arm == preferred]
            chosen_c = matching[0] if matching else candidates[0]
            
            return BanditDecision(
                selected_arm=chosen_c.arm,
                candidate=chosen_c,
                sampled_reward=0.0,
                expected_reward=0.0,
                eligible_arms=[c.arm for c in candidates],
                all_sampled_rewards={c.arm: 0.0 for c in candidates},
                all_expected_rewards={c.arm: 0.0 for c in candidates},
                context_vector=context,
                decision_mode="HEURISTIC",
            )
        elif policy_name == "random":
            chosen_c = candidates[rng.randint(0, len(candidates))]
            return BanditDecision(
                selected_arm=chosen_c.arm,
                candidate=chosen_c,
                sampled_reward=0.0,
                expected_reward=0.0,
                eligible_arms=[c.arm for c in candidates],
                all_sampled_rewards={c.arm: 0.0 for c in candidates},
                all_expected_rewards={c.arm: 0.0 for c in candidates},
                context_vector=context,
                decision_mode="RANDOM",
            )
        else:
            raise ValueError(f"Unknown policy {policy_name}")
            
    pipeline.bandit.select_arm = policy_select_arm
    
    # Synthetic dataset
    X_train = rng.uniform(0, np.pi, size=(30, 2))
    y_train = rng.randint(0, 2, size=30)
    X_val = rng.uniform(0, np.pi, size=(20, 2))
    y_val = rng.randint(0, 2, size=20)
    
    total_episodes = episodes_per_class * len(FAILURE_TYPES)
    
    cumulative_rewards = []
    cumulative_regrets = []
    commit_successes = []
    rollbacks = []
    
    for ep_idx in range(total_episodes):
        ft = FAILURE_TYPES[ep_idx % len(FAILURE_TYPES)]
        
        # Warmup nominal steps
        for _ in range(2):
            pipeline.step(X_train, y_train, X_val, y_val)
            
        # Inject failure
        pipeline.model.inject_failure(ft, severity=0.85)
        
        # Step until recovery finishes or max steps reached
        max_recovery_steps = 10
        recovery_finished = False
        last_reward = 0.0
        
        for _ in range(max_recovery_steps):
            res = pipeline.step(X_train, y_train, X_val, y_val)
            
            if res.state in (PipelineState.COMMITTED, PipelineState.ROLLED_BACK):
                is_comm = (res.state == PipelineState.COMMITTED)
                commit_successes.append(1 if is_comm else 0)
                rollbacks.append(0 if is_comm else 1)
                if res.evaluation is not None:
                    last_reward = float(res.evaluation.actual_reward)
                else:
                    last_reward = 0.30 if is_comm else -0.50
                recovery_finished = True
                break
                
        if not recovery_finished:
            # Did not finish or held by confidence gate
            commit_successes.append(0)
            rollbacks.append(0)
            last_reward = -0.20
            
        cumulative_rewards.append(last_reward)
        
        # Counterfactual optimal reward benchmark for this step (max achievable reward ~ +0.50)
        best_possible = 0.45 if commit_successes[-1] == 1 else 0.20
        regret = max(0.0, best_possible - last_reward)
        cumulative_regrets.append(regret)

    # Clean up temporary database
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

    return {
        "policy": policy_name,
        "seed": seed,
        "total_reward": float(np.sum(cumulative_rewards)),
        "total_regret": float(np.sum(cumulative_regrets)),
        "mean_reward": float(np.mean(cumulative_rewards)),
        "mean_regret": float(np.mean(cumulative_regrets)),
        "success_rate": float(np.mean(commit_successes)),
        "rollback_rate": float(np.mean(rollbacks)),
        "total_episodes": len(cumulative_rewards),
        "reward_trajectory": [float(r) for r in np.cumsum(cumulative_rewards)],
        "regret_trajectory": [float(r) for r in np.cumsum(cumulative_regrets)],
    }


def main():
    print("=" * 75)
    print("Executing Stage 8: Multi-Seed Policy Regret Benchmark")
    print(f"Seeds ({len(SEEDS)}): {SEEDS}")
    print("Policies: Contextual Thompson Sampling, Greedy, Fixed-Rule Heuristic, Random")
    print("=" * 75)
    
    policies = ["thompson_sampling", "greedy", "heuristic", "random"]
    all_results = {p: [] for p in policies}
    
    for seed in SEEDS:
        print(f"\n--- Running Seed {seed} ---")
        for p in policies:
            res = run_policy_benchmark_for_seed(seed, p, episodes_per_class=5)
            all_results[p].append(res)
            print(f"  [{p:18s}] Reward: {res['total_reward']:+6.2f} | Regret: {res['total_regret']:6.2f} | Success: {res['success_rate']*100:5.1f}% | Rollback: {res['rollback_rate']*100:5.1f}%")

    # Aggregate Statistics and Paired Tests
    summary = {}
    print("\n" + "=" * 80)
    print("POLICY REGRET BENCHMARK SUMMARY (10 SEEDS, 30 EPISODES/SEED)")
    print("=" * 80)
    print(f"{'Policy':20s} {'Total Reward':18s} {'Cumulative Regret':18s} {'Success Rate':14s} {'Rollback Rate':14s}")
    print("-" * 80)
    
    for p in policies:
        rewards = np.array([r["total_reward"] for r in all_results[p]])
        regrets = np.array([r["total_regret"] for r in all_results[p]])
        succ = np.array([r["success_rate"] for r in all_results[p]])
        roll = np.array([r["rollback_rate"] for r in all_results[p]])
        
        r_mean, r_std = np.mean(rewards), np.std(rewards, ddof=1)
        reg_mean, reg_std = np.mean(regrets), np.std(regrets, ddof=1)
        succ_mean = np.mean(succ)
        roll_mean = np.mean(roll)
        
        summary[p] = {
            "reward_mean": float(r_mean),
            "reward_std": float(r_std),
            "reward_ci95": [float(r_mean - 2.262 * r_std / np.sqrt(10)), float(r_mean + 2.262 * r_std / np.sqrt(10))],
            "regret_mean": float(reg_mean),
            "regret_std": float(reg_std),
            "regret_ci95": [float(reg_mean - 2.262 * reg_std / np.sqrt(10)), float(reg_mean + 2.262 * reg_std / np.sqrt(10))],
            "success_rate_mean": float(succ_mean),
            "rollback_rate_mean": float(roll_mean),
        }
        
        print(f"{p:20s} {r_mean:+6.2f} +/- {r_std:5.2f}     {reg_mean:6.2f} +/- {reg_std:5.2f}     {succ_mean*100:5.1f}%          {roll_mean*100:5.1f}%")
        
    print("=" * 80)
    
    # Paired Statistical Tests against Thompson Sampling
    print("\nPAIRED STATISTICAL HYPOTHESIS TESTS (Thompson Sampling vs Baselines):")
    print("-" * 80)
    paired_tests = {}
    ts_rewards = np.array([r["total_reward"] for r in all_results["thompson_sampling"]])
    ts_regrets = np.array([r["total_regret"] for r in all_results["thompson_sampling"]])
    
    for baseline in ["greedy", "heuristic", "random"]:
        b_rewards = np.array([r["total_reward"] for r in all_results[baseline]])
        b_regrets = np.array([r["total_regret"] for r in all_results[baseline]])
        
        diff_reward = ts_rewards - b_rewards
        diff_regret = ts_regrets - b_regrets
        
        t_stat, p_val_t = stats.ttest_rel(ts_rewards, b_rewards)
        
        try:
            w_stat, p_val_w = stats.wilcoxon(ts_rewards, b_rewards)
        except Exception:
            w_stat, p_val_w = 0.0, 1.0
            
        delta_r_mean = float(np.mean(diff_reward))
        delta_r_ci = [
            float(delta_r_mean - 2.262 * np.std(diff_reward, ddof=1) / np.sqrt(10)),
            float(delta_r_mean + 2.262 * np.std(diff_reward, ddof=1) / np.sqrt(10)),
        ]
        
        paired_tests[f"TS_vs_{baseline}"] = {
            "delta_reward_mean": delta_r_mean,
            "delta_reward_ci95": delta_r_ci,
            "paired_t_stat": float(t_stat),
            "paired_t_pvalue": float(p_val_t),
            "wilcoxon_stat": float(w_stat),
            "wilcoxon_pvalue": float(p_val_w),
            "statistically_significant": bool(p_val_t < 0.05),
        }
        
        sig_str = "STATISTICALLY SIGNIFICANT (p < 0.05)" if p_val_t < 0.05 else "Not statistically significant"
        print(f"TS vs {baseline:10s}: Delta Reward = {delta_r_mean:+5.2f} (95% CI: [{delta_r_ci[0]:+5.2f}, {delta_r_ci[1]:+5.2f}]) | t = {t_stat:5.2f}, p = {p_val_t:.4e} -> {sig_str}")
        
    print("=" * 80)
    
    # Save results
    out_dir = os.path.join(os.path.dirname(__file__), "..", "benchmark_results")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "policy_regret_benchmark.json")
    
    payload = {
        "metadata": {
            "seeds": SEEDS,
            "policies": policies,
            "episodes_per_seed": len(SEEDS) * 30,
        },
        "summary": summary,
        "paired_tests": paired_tests,
        "detailed_results": all_results,
    }
    
    with open(out_file, "w") as f:
        json.dump(payload, f, indent=2)
        
    print(f"\nPolicy regret benchmark results saved to: {out_file}")


if __name__ == "__main__":
    main()
