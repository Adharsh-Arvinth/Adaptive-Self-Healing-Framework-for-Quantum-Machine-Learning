"""
Stage 8 Benchmark: Per-Failure-Class Granular Performance Deep Dive
Evaluates detailed performance across all 6 failure categories over 10 seeds:
  - Confusion Matrix, Precision, Recall, F1-score
  - Repair Arm Selection Distribution per Failure Mode
  - Recovery Success Rate, Rollback Rate, and Loss/Accuracy Deltas
  - Computational Cost and Latency per Mode
"""

import json
import os
import sys
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import VQCModel, CircuitConfig, FailureType
from backend.pipeline import SelfHealingPipeline, PipelineState
from backend.repair_library import RepairArm

SEEDS = [42, 101, 202, 303, 404, 505, 606, 707, 808, 909]
FAILURE_TYPES = [
    FailureType.BARREN_PLATEAU,
    FailureType.PERSISTENT_PLATEAU,
    FailureType.LR_MISCONFIGURATION,
    FailureType.OPTIMIZER_INSTABILITY,
    FailureType.TRAINING_DIVERGENCE,
    FailureType.NOISE_DEGRADATION,
]

ARM_LIST = [
    RepairArm.CHANGE_OPTIMIZER.value,
    RepairArm.REDUCE_CIRCUIT_DEPTH.value,
    RepairArm.MODIFY_FEATURE_MAP.value,
    RepairArm.ADJUST_LEARNING_RATE.value,
    RepairArm.APPLY_NOISE_MITIGATION.value,
    RepairArm.PERFORM_WARM_RESTART.value,
]


def main():
    print("=" * 80)
    print("Executing Stage 8: Per-Failure-Class Granular Performance Benchmark")
    print(f"Seeds ({len(SEEDS)}): {SEEDS}")
    print("=" * 80)

    # Initialize tracking matrices
    class_names = [f.value for f in FAILURE_TYPES]
    confusion_matrix = {true_c: {pred_c: 0 for pred_c in class_names + ["UNASSIGNED"]} for true_c in class_names}
    repair_distributions = {true_c: {arm: 0 for arm in ARM_LIST} for true_c in class_names}
    
    per_class_stats = {
        true_c: {
            "attempts": 0,
            "successes": 0,
            "rollbacks": 0,
            "pre_losses": [],
            "post_losses": [],
            "pre_accs": [],
            "post_accs": [],
            "latencies": [],
            "rewards": [],
        }
        for true_c in class_names
    }

    for seed in SEEDS:
        print(f"\n--- Running Seed {seed} ---")
        rng = np.random.RandomState(seed + 555)
        
        db_path = f"data/per_class_mem_{seed}.db"
        post_path = f"data/per_class_post_{seed}.json"
        if os.path.exists(db_path):
            os.remove(db_path)
        if os.path.exists(post_path):
            os.remove(post_path)

        X_train = rng.uniform(0, np.pi, size=(30, 2))
        y_train = rng.randint(0, 2, size=30)
        X_val = rng.uniform(0, np.pi, size=(20, 2))
        y_val = rng.randint(0, 2, size=20)
        
        ep_count = 0
        # 5 episodes per failure category per seed = 30 episodes
        for ft in FAILURE_TYPES:
            for rep in range(5):
                ep_count += 1
                config = CircuitConfig(n_qubits=2, n_layers=2, seed=seed + ep_count * 13)
                model = VQCModel(config)
                
                pipeline = SelfHealingPipeline(
                    model=model,
                    experiment_id=f"per_class_{seed}_{ft.value}_{rep}",
                    memory_db_path=db_path,
                    bandit_storage_path=post_path,
                    confidence_threshold=0.60,
                    validation_window=3,
                    seed=seed + ep_count,
                )
                
                # Warmup (2 steps)
                for _ in range(2):
                    pipeline.step(X_train, y_train, X_val, y_val)
                    
                # Inject failure
                pipeline.model.inject_failure(ft, severity=0.85)
                start_step = pipeline.step_count
                
                # Step until diagnosis & recovery
                recovery_done = False
                chosen_arm = None
                pred_cause = "UNASSIGNED"
                pre_loss = 0.0
                post_loss = 0.0
                pre_acc = 0.0
                post_acc = 0.0
                reward = 0.0
                
                for _ in range(10):
                    res = pipeline.step(X_train, y_train, X_val, y_val)
                    
                    if res.diagnosis is not None and res.diagnosis.primary_cause is not None:
                        pred_cause = res.diagnosis.primary_cause.value
                        
                    if res.bandit_decision is not None and res.bandit_decision.selected_arm is not None:
                        chosen_arm = res.bandit_decision.selected_arm.value
                    elif res.deployment_record is not None and res.deployment_record.repair_arm is not None:
                        chosen_arm = res.deployment_record.repair_arm.value
                        
                    if res.state in (PipelineState.COMMITTED, PipelineState.ROLLED_BACK):
                        is_comm = (res.state == PipelineState.COMMITTED)
                        confusion_matrix[ft.value][pred_cause] += 1
                        if chosen_arm:
                            repair_distributions[ft.value][chosen_arm] += 1
                            
                        per_class_stats[ft.value]["attempts"] += 1
                        if is_comm:
                            per_class_stats[ft.value]["successes"] += 1
                        else:
                            per_class_stats[ft.value]["rollbacks"] += 1
                            
                        if res.evaluation:
                            pre_loss = float(res.evaluation.loss_pre)
                            post_loss = float(res.evaluation.loss_post)
                            pre_acc = float(res.evaluation.acc_pre)
                            post_acc = float(res.evaluation.acc_post)
                            reward = float(res.evaluation.actual_reward)
                            
                        per_class_stats[ft.value]["pre_losses"].append(pre_loss)
                        per_class_stats[ft.value]["post_losses"].append(post_loss)
                        per_class_stats[ft.value]["pre_accs"].append(pre_acc)
                        per_class_stats[ft.value]["post_accs"].append(post_acc)
                        per_class_stats[ft.value]["rewards"].append(reward)
                        per_class_stats[ft.value]["latencies"].append(pipeline.step_count - start_step)
                        
                        recovery_done = True
                        break
                        
                if not recovery_done:
                    confusion_matrix[ft.value][pred_cause] += 1
                    if chosen_arm:
                        repair_distributions[ft.value][chosen_arm] += 1
                    per_class_stats[ft.value]["attempts"] += 1
                    per_class_stats[ft.value]["latencies"].append(10)

        # Cleanup
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

    # Compute Classification Metrics (Precision, Recall, F1)
    classification_report = {}
    print("\n" + "=" * 90)
    print("PER-FAILURE-CLASS DIAGNOSTIC & RECOVERY SUMMARY (10 SEEDS, 50 EPISODES/CLASS)")
    print("=" * 90)
    print(f"{'Failure Category':28s} {'Precision':12s} {'Recall':12s} {'F1-Score':12s} {'Success Rate':14s} {'Mean Reward':12s}")
    print("-" * 90)
    
    for c in class_names:
        tp = confusion_matrix[c][c]
        fn = sum(confusion_matrix[c][other] for other in class_names + ["UNASSIGNED"] if other != c)
        fp = sum(confusion_matrix[other][c] for other in class_names if other != c)
        
        prec = float(tp / (tp + fp)) if (tp + fp) > 0 else 0.0
        rec = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
        f1 = float(2 * prec * rec / (prec + rec)) if (prec + rec) > 0 else 0.0
        
        stats_c = per_class_stats[c]
        n_att = max(1, stats_c["attempts"])
        succ_rate = stats_c["successes"] / n_att
        mean_r = float(np.mean(stats_c["rewards"])) if stats_c["rewards"] else 0.0
        
        classification_report[c] = {
            "precision": prec,
            "recall": rec,
            "f1_score": f1,
            "true_positives": tp,
            "false_positives": fp,
            "false_negatives": fn,
            "total_episodes": n_att,
            "success_rate": float(succ_rate),
            "rollback_rate": float(stats_c["rollbacks"] / n_att),
            "mean_reward": mean_r,
            "mean_loss_pre": float(np.mean(stats_c["pre_losses"])) if stats_c["pre_losses"] else 0.0,
            "mean_loss_post": float(np.mean(stats_c["post_losses"])) if stats_c["post_losses"] else 0.0,
            "mean_acc_pre": float(np.mean(stats_c["pre_accs"])) if stats_c["pre_accs"] else 0.0,
            "mean_acc_post": float(np.mean(stats_c["post_accs"])) if stats_c["post_accs"] else 0.0,
            "mean_latency": float(np.mean(stats_c["latencies"])) if stats_c["latencies"] else 0.0,
        }
        
        print(f"{c:28s} {prec*100:6.1f}%      {rec*100:6.1f}%      {f1:6.3f}       {succ_rate*100:6.1f}%         {mean_r:+6.3f}")
        
    print("=" * 90)

    # Save to JSON
    out_dir = os.path.join(os.path.dirname(__file__), "..", "benchmark_results")
    os.makedirs(out_dir, exist_ok=True)
    out_file = os.path.join(out_dir, "per_class_performance.json")
    
    payload = {
        "metadata": {
            "seeds": SEEDS,
            "classes": class_names,
            "arms": ARM_LIST,
            "total_episodes": len(SEEDS) * len(FAILURE_TYPES) * 5,
        },
        "classification_report": classification_report,
        "confusion_matrix": confusion_matrix,
        "repair_arm_distributions": repair_distributions,
    }
    
    with open(out_file, "w") as f:
        json.dump(payload, f, indent=2)
        
    print(f"\nPer-class benchmark results saved to: {out_file}")


if __name__ == "__main__":
    main()
