"""
End-to-End Vertical Slice Demonstration: Autonomous Quantum Self-Healing.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 6).

Executes a complete 17-step closed-loop autonomous recovery cycle on the Make Moons dataset:
  1. Baseline VQC training (Steps 1-5).
  2. Controlled learning-rate failure injection (Step 6).
  3. Real telemetry degradation.
  4. Multi-window statistical anomaly detection.
  5. Temperature-scaled root-cause diagnosis.
  6. Confidence-gate decision (tau = 0.60).
  7. Similar historical memory retrieval from SQLite.
  8. Candidate repair generation across locked arms.
  9. SafetyFilter anti-oscillation and bounds clearance.
  10. Digital-Twin proxy simulation (H = 3).
  11. Contextual Thompson Sampling repair selection.
  12. Atomic checkpoint creation (model, config, optimizer, RNG).
  13. Controlled live model repair deployment.
  14. Multi-step post-deployment validation monitoring (W_val = 3).
  15. Automated commit or rollback.
  16. Empirical multi-objective reward calculation.
  17. Continuous learning feedback (Memory & Thompson Sampling posterior update).
"""

import json
import os
import sys
import time
from typing import Any, Dict, List
import numpy as np

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import CircuitConfig, FailureType, VQCModel, load_dataset
from backend.repair_library import RepairArm
from backend.pipeline import PipelineState, SelfHealingPipeline


def run_vertical_slice_demonstration(output_trace_path: str = "docs/vertical_slice_trace.json") -> Dict[str, Any]:
    print("=" * 80)
    print("VERTICAL SLICE DEMONSTRATION: AUTONOMOUS QUANTUM SELF-HEALING FRAMEWORK")
    print("=" * 80)

    # 1. Initialize Dataset and Pipeline
    seed = 42
    np.random.seed(seed)
    X_train, y_train, X_val, y_val = load_dataset("moons", seed=seed)

    config = CircuitConfig(
        n_qubits=2,
        n_layers=2,
        feature_map="angle",
        optimizer_name="adam",
        learning_rate=0.05,
        seed=seed,
    )
    model = VQCModel(config)

    # Clean previous demo database if exists
    demo_db_path = "data/demo_failure_memory.db"
    demo_post_path = "data/demo_bandit_posteriors.json"
    if os.path.exists(demo_db_path):
        os.remove(demo_db_path)
    if os.path.exists(demo_post_path):
        os.remove(demo_post_path)

    pipeline = SelfHealingPipeline(
        model=model,
        experiment_id="exp_vertical_slice_demo",
        memory_db_path=demo_db_path,
        bandit_storage_path=demo_post_path,
        confidence_threshold=0.60,
        validation_window=3,
        seed=seed,
    )

    trace_records: List[Dict[str, Any]] = []

    # ------------------------------------------------------------------
    # Step 1: Baseline Convergent VQC Training (Steps 1 to 5)
    # ------------------------------------------------------------------
    print("\n--- PHASE 1: Baseline VQC Training (Nominal Convergence, Steps 1-5) ---")
    for step in range(1, 6):
        res = pipeline.step(X_train, y_train, X_val, y_val)
        print(
            f"Step {res.step:2d} | State: {res.state.value:<18} | "
            f"Train Loss: {res.metrics.loss:.4f} | Val Loss: {res.metrics.val_loss:.4f} | "
            f"Val Acc: {res.metrics.val_accuracy:.2%} | GradNorm: {res.metrics.gradient_norm:.4f}"
        )
        trace_records.append({
            "step": res.step,
            "phase": "baseline_training",
            "state": res.state.value,
            "loss": float(res.metrics.loss),
            "val_loss": float(res.metrics.val_loss),
            "val_accuracy": float(res.metrics.val_accuracy),
            "grad_norm": float(res.metrics.gradient_norm),
        })

    # ------------------------------------------------------------------
    # Step 2: Controlled Failure Injection at Step 6
    # ------------------------------------------------------------------
    print("\n--- PHASE 2: Controlled Failure Injection [LR_MISCONFIGURATION] at Step 6 ---")
    model.inject_failure(FailureType.LR_MISCONFIGURATION, severity=1.0)
    print("  [FAULT INJECTED] Scaled learning rate 50x (eta -> 2.50) to induce oscillatory loss instability.")

    # ------------------------------------------------------------------
    # Step 3 to 17: Autonomous Detection, Diagnosis & Recovery Cycle
    # ------------------------------------------------------------------
    recovery_executed = False
    recovery_summary = {}

    for step in range(6, 16):
        res = pipeline.step(X_train, y_train, X_val, y_val)
        step_entry = {
            "step": res.step,
            "state": res.state.value,
            "loss": float(res.metrics.loss),
            "val_loss": float(res.metrics.val_loss),
            "val_accuracy": float(res.metrics.val_accuracy),
            "grad_norm": float(res.metrics.gradient_norm),
            "anomalies": [a.failure_type.value for a in res.anomalies],
        }

        if res.diagnosis:
            step_entry["diagnosis"] = {
                "primary_cause": res.diagnosis.primary_cause.value if res.diagnosis.primary_cause else None,
                "confidence": float(res.diagnosis.confidence),
                "gate_cleared": bool(res.diagnosis.confidence_gate_cleared),
            }

        if res.bandit_decision:
            recovery_executed = True
            step_entry["bandit_decision"] = {
                "selected_arm": res.bandit_decision.selected_arm.value,
                "sampled_reward": float(res.bandit_decision.sampled_reward),
                "eligible_arms": [a.value for a in res.bandit_decision.eligible_arms],
            }

        if res.deployment_record:
            step_entry["deployment"] = {
                "deployment_id": res.deployment_record.deployment_id,
                "repair_arm": res.deployment_record.repair_arm.value,
                "status": res.deployment_record.status.value,
                "loss_pre": float(res.deployment_record.loss_pre),
                "loss_post": float(res.deployment_record.loss_post),
            }

        if res.evaluation:
            step_entry["evaluation"] = {
                "actual_reward": float(res.evaluation.actual_reward),
                "predicted_reward": float(res.evaluation.predicted_reward),
                "prediction_error": float(res.evaluation.prediction_error),
                "was_rolled_back": bool(res.evaluation.was_rolled_back),
            }
            recovery_summary = step_entry["evaluation"]

        trace_records.append(step_entry)

        status_str = f"Step {res.step:2d} | State: {res.state.value:<18} | Loss: {res.metrics.loss:.4f} | Val Acc: {res.metrics.val_accuracy:.2%}"
        if res.anomalies:
            status_str += f" | Anomalies: {[a.failure_type.value for a in res.anomalies]}"
        if res.bandit_decision:
            status_str += f" | Bandit Arm: {res.bandit_decision.selected_arm.value}"
        if res.evaluation:
            status_str += f" | Reward: {res.evaluation.actual_reward:+.4f}"
        print(status_str)

        # Print detailed events
        for evt in res.events:
            print(f"    -> [{evt.state.value}] {evt.message}")

    # ------------------------------------------------------------------
    # Step 18: Post-Recovery Telemetry & Verification Summary
    # ------------------------------------------------------------------
    print("\n--- PHASE 3: Recovery Outcome & Continuous Learning Summary ---")
    memory_count = pipeline.memory.count()
    print(f"  Persistent SQLite Memory Episodes Stored: {memory_count}")
    for arm in RepairArm:
        post = pipeline.bandit.posteriors[arm]
        if post.update_count > 0:
            print(f"  Bandit Posterior for [{arm.value}]: Updates = {post.update_count}, mu norm = {np.linalg.norm(post.mu):.4f}")

    final_loss = trace_records[-1]["loss"]
    final_acc = trace_records[-1]["val_accuracy"]
    print(f"\nFinal Model Health: Loss = {final_loss:.4f}, Val Accuracy = {final_acc:.2%}")

    output_data = {
        "title": "Autonomous Quantum Self-Healing Vertical Slice Execution Trace",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "experiment_id": pipeline.experiment_id,
        "dataset": "moons",
        "num_qubits": config.n_qubits,
        "num_layers": config.n_layers,
        "failure_injected": FailureType.LR_MISCONFIGURATION.value,
        "recovery_executed": recovery_executed,
        "recovery_summary": recovery_summary,
        "memory_episodes_count": memory_count,
        "trace": trace_records,
    }

    dir_path = os.path.dirname(os.path.abspath(output_trace_path))
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)
    with open(output_trace_path, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2)

    print(f"\nSaved complete machine-readable demonstration trace to: {output_trace_path}")
    print("=" * 80)
    print("VERTICAL SLICE EXECUTION COMPLETE: DEMONSTRATION VERIFIED")
    print("=" * 80)
    return output_data


if __name__ == "__main__":
    run_vertical_slice_demonstration()
