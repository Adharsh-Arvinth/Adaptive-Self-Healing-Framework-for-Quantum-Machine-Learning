"""
Stage 8 Benchmark: 10-Seed Comprehensive Architectural Ablation Study
Comparing 4 Architectural Configurations across 10 Independent Seeds [42, 101, 202, 303, 404, 505, 606, 707, 808, 909]:
  1. Full Framework (Thompson Sampling + Digital Twin H=3 + Episodic Memory + Safety Filter)
  2. Ablation 1: No Digital Twin (Twin viability bypassed, x11=0.0, x12=0.50)
  3. Ablation 2: No Episodic Memory (Memory retrieval bypassed, x9=0.0, x10=0.0)
  4. Ablation 3: No Safety Filter (Anti-oscillation and parameter bound pruning disabled)
"""

import json
import os
import sys
import numpy as np
from scipy import stats

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import VQCModel, CircuitConfig, FailureType
from backend.pipeline import SelfHealingPipeline, PipelineState
from backend.digital_twin import DigitalTwinPrediction
from backend.safety_filter import SafetyDecision

SEEDS = [42, 101, 202, 303, 404, 505, 606, 707, 808, 909]
FAILURE_TYPES = [
    FailureType.BARREN_PLATEAU,
    FailureType.PERSISTENT_PLATEAU,
    FailureType.LR_MISCONFIGURATION,
    FailureType.OPTIMIZER_INSTABILITY,
    FailureType.TRAINING_DIVERGENCE,
    FailureType.NOISE_DEGRADATION,
]


def run_ablation_benchmark_for_seed(seed: int, config_name: str, episodes_per_class: int = 5) -> dict:
    """Run full benchmark for a specific ablation configuration under a fixed random seed."""
    rng = np.random.RandomState(seed + 999)
    
    config = CircuitConfig(n_qubits=2, n_layers=2, seed=seed)
    model = VQCModel(config)
    
    db_path = f"data/ablation_mem_{config_name}_{seed}.db"
    post_path = f"data/ablation_post_{config_name}_{seed}.json"
    if os.path.exists(db_path):
        os.remove(db_path)
    if os.path.exists(post_path):
        os.remove(post_path)
        
    pipeline = SelfHealingPipeline(
        model=model,
        experiment_id=f"ablation_{config_name}_{seed}",
        memory_db_path=db_path,
        bandit_storage_path=post_path,
        confidence_threshold=0.60,
        validation_window=3,
        seed=seed,
    )
    
    # Apply Architectural Ablation Modifications
    if config_name == "no_digital_twin":
        # Neutralize Digital Twin proxy simulation
        def bypassed_simulate_all(model_inst, safe_cands, X_v, y_v):
            return {
                c.arm: DigitalTwinPrediction(
                    arm=c.arm,
                    candidate=c,
                    horizon=3,
                    initial_loss=1.0,
                    predicted_loss_final=1.0,
                    predicted_loss_delta=0.0,
                    normalized_predicted_delta=0.0,
                    proxy_loss_trajectory=[1.0, 1.0, 1.0],
                    proxy_stability=0.5,
                    proxy_grad_variance=0.0,
                    circuit_evaluations=0,
                    is_viable=True,  # All treated as viable
                )
                for c in safe_cands
            }
        pipeline.digital_twin.simulate_all = bypassed_simulate_all
        
    elif config_name == "no_episodic_memory":
        # Neutralize memory retrieval
        pipeline.memory.retrieve_similar = lambda query_emb, top_k=3: []
        
    elif config_name == "no_safety_filter":
        # Neutralize safety filter: all candidates deemed safe
        def bypassed_filter_candidates(cands, model_st, rep_hist):
            return [
                SafetyDecision(
                    arm=c.arm,
                    is_safe=True,
                    rejection_reason=None,
                    candidate=c,
                )
                for c in cands
            ]
        pipeline.safety_filter.filter_candidates = bypassed_filter_candidates
        
    # Dataset
    X_train = rng.uniform(0, np.pi, size=(30, 2))
    y_train = rng.randint(0, 2, size=30)
    X_val = rng.uniform(0, np.pi, size=(20, 2))
    y_val = rng.randint(0, 2, size=20)
    
    total_episodes = episodes_per_class * len(FAILURE_TYPES)
    
    commit_successes = []
    rollbacks = []
    detection_delays = []
    recovery_latencies = []
    depth_overheads = []
    eval_costs = []
    per_class_success = {f.value: [] for f in FAILURE_TYPES}
    
    for ep_idx in range(total_episodes):
        ft = FAILURE_TYPES[ep_idx % len(FAILURE_TYPES)]
        pre_depth = model.config.n_layers
        
        # Warmup nominal steps
        for _ in range(2):
            pipeline.step(X_train, y_train, X_val, y_val)
            
        # Inject failure
        pipeline.model.inject_failure(ft, severity=0.85)
        inject_step = pipeline.step_count
        
        detection_step = None
        recovery_finished = False
        max_recovery_steps = 10
        ep_eval_cost = 0
        
        for step_idx in range(max_recovery_steps):
            res = pipeline.step(X_train, y_train, X_val, y_val)
            
            # Count evaluations (training step = 1, twin simulation = ~6 if active)
            ep_eval_cost += 1
            if config_name != "no_digital_twin" and res.state == PipelineState.DIGITAL_TWIN_SIMULATING:
                ep_eval_cost += 12  # Twin proxy evaluations for eligible arms
                
            if detection_step is None and res.anomalies:
                detection_step = pipeline.step_count - inject_step
                
            if res.state == PipelineState.COMMITTED:
                commit_successes.append(1)
                rollbacks.append(0)
                per_class_success[ft.value].append(1)
                post_depth = model.config.n_layers
                depth_overheads.append(max(0, post_depth - pre_depth))
                recovery_finished = True
                recovery_latencies.append(pipeline.step_count - inject_step)
                break
            elif res.state == PipelineState.ROLLED_BACK:
                commit_successes.append(0)
                rollbacks.append(1)
                per_class_success[ft.value].append(0)
                post_depth = model.config.n_layers
                depth_overheads.append(max(0, post_depth - pre_depth))
                recovery_finished = True
                recovery_latencies.append(pipeline.step_count - inject_step)
                break
                
        if not recovery_finished:
            commit_successes.append(0)
            rollbacks.append(0)
            per_class_success[ft.value].append(0)
            depth_overheads.append(0)
            recovery_latencies.append(max_recovery_steps)
            
        detection_delays.append(detection_step if detection_step is not None else max_recovery_steps)
        eval_costs.append(ep_eval_cost)

    # Clean up temporary DB
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
        "config": config_name,
        "seed": seed,
        "success_rate": float(np.mean(commit_successes)),
        "rollback_rate": float(np.mean(rollbacks)),
        "mean_detection_delay": float(np.mean(detection_delays)),
        "mean_recovery_latency": float(np.mean(recovery_latencies)),
        "mean_depth_overhead": float(np.mean(depth_overheads)),
        "mean_eval_cost": float(np.mean(eval_costs)),
        "per_class_success": {k: float(np.mean(v)) if v else 0.0 for k, v in per_class_success.items()},
    }


def main():
    print("=" * 80)
    print("Executing Stage 8: 10-Seed Comprehensive Architectural Ablation Study")
    print(f"Seeds ({len(SEEDS)}): {SEEDS}")
    print("Configurations: Full Framework, No Digital Twin, No Episodic Memory, No Safety Filter")
    print("=" * 80)
    
    configs = ["full_framework", "no_digital_twin", "no_episodic_memory", "no_safety_filter"]
    all_results = {c: [] for c in configs}
    
    for seed in SEEDS:
        print(f"\n--- Running Seed {seed} ---")
        for c in configs:
            res = run_ablation_benchmark_for_seed(seed, c, episodes_per_class=5)
            all_results[c].append(res)
            print(f"  [{c:20s}] Success: {res['success_rate']*100:5.1f}% | Rollback: {res['rollback_rate']*100:5.1f}% | Latency: {res['mean_recovery_latency']:4.1f} steps | Cost: {res['mean_eval_cost']:4.1f} evals")

    # Aggregate Statistics
    summary = {}
    print("\n" + "=" * 90)
    print("ABLATION STUDY SUMMARY (10 SEEDS, 30 EPISODES/SEED)")
    print("=" * 90)
    print(f"{'Configuration':22s} {'Success Rate':16s} {'Rollback Rate':16s} {'Latency (steps)':18s} {'Cost (evals)':16s}")
    print("-" * 90)
    
    for c in configs:
        succ = np.array([r["success_rate"] for r in all_results[c]])
        roll = np.array([r["rollback_rate"] for r in all_results[c]])
        lat = np.array([r["mean_recovery_latency"] for r in all_results[c]])
        cost = np.array([r["mean_eval_cost"] for r in all_results[c]])
        
        s_mean, s_std = np.mean(succ), np.std(succ, ddof=1)
        r_mean, r_std = np.mean(roll), np.std(roll, ddof=1)
        l_mean, l_std = np.mean(lat), np.std(lat, ddof=1)
        c_mean, c_std = np.mean(cost), np.std(cost, ddof=1)
        
        summary[c] = {
            "success_rate_mean": float(s_mean),
            "success_rate_std": float(s_std),
            "success_rate_ci95": [float(s_mean - 2.262 * s_std / np.sqrt(10)), float(s_mean + 2.262 * s_std / np.sqrt(10))],
            "rollback_rate_mean": float(r_mean),
            "rollback_rate_std": float(r_std),
            "rollback_rate_ci95": [float(r_mean - 2.262 * r_std / np.sqrt(10)), float(r_mean + 2.262 * r_std / np.sqrt(10))],
            "latency_mean": float(l_mean),
            "latency_std": float(l_std),
            "cost_mean": float(c_mean),
            "cost_std": float(c_std),
        }
        
        print(f"{c:22s} {s_mean*100:5.1f}% +/- {s_std*100:4.1f}%    {r_mean*100:5.1f}% +/- {r_std*100:4.1f}%    {l_mean:4.2f} +/- {l_std:4.2f}        {c_mean:5.1f} +/- {c_std:4.1f}")
        
    print("=" * 90)
    
    # Save results
    out_dir = os.path.join(os.path.dirname(__file__), "..", "benchmark_results")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "ablation_study_results.json")
    
    payload = {
        "metadata": {
            "seeds": SEEDS,
            "configurations": configs,
            "episodes_per_seed": len(SEEDS) * 30,
        },
        "summary": summary,
        "detailed_results": all_results,
    }
    
    with open(out_file, "w") as f:
        json.dump(payload, f, indent=2)
        
    print(f"\nAblation study results saved to: {out_file}")


if __name__ == "__main__":
    main()
