"""
Stage 4 Empirical Verification Script.
Executes live integration tests across:
  - 12D Failure Embedding construction
  - Persistent SQLite Memory storage and Cosine Similarity retrieval
  - Candidate Repair Generation across all 6 locked arms
  - Safety Filter constraint and anti-oscillation verification
  - Live Model mutation and state rollback
"""

import json
import os
import sys
import numpy as np

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.qml_model import CircuitConfig, FailureType, VQCModel, load_dataset
from backend.monitoring import HealthMonitor
from backend.detection import FailureDetector
from backend.diagnosis import DiagnosisEngine
from backend.memory import FailureEpisode, FailureMemory, build_failure_embedding
from backend.repair_library import CandidateRepair, RepairArm, RepairLibrary
from backend.safety_filter import (
    RepairHistoryRecord,
    SafetyDecision,
    SafetyFilter,
    SafetyFilterConfig,
)


def run_stage4_verification():
    print("=" * 70)
    print("STAGE 4: EMPIRICAL VERIFICATION OF MEMORY & REPAIR LIBRARY")
    print("=" * 70)

    # 1. Initialize Components
    db_path = "data/empirical_stage4_memory.db"
    if os.path.exists(db_path):
        os.remove(db_path)

    memory = FailureMemory(db_path=db_path)
    repair_lib = RepairLibrary()
    safety_filter = SafetyFilter(SafetyFilterConfig(oscillation_window=4, max_consecutive_failures=2))

    X_train, y_train, X_val, y_val = load_dataset("moons", seed=42)
    config = CircuitConfig(n_qubits=2, n_layers=2, feature_map="angle", optimizer_name="adam", learning_rate=0.05, seed=42)
    model = VQCModel(config)
    monitor = HealthMonitor(window_size=5, experiment_id="exp_stage4_verif")
    detector = FailureDetector()
    diagnoser = DiagnosisEngine(confidence_threshold=0.60)

    # 2. Warm up model for 5 steps under nominal conditions
    print("\nPhase 1: Initializing Baseline Health Telemetry (5 Nominal Steps)...")
    for step in range(1, 6):
        metrics = model.train_step(X_train, y_train, X_val, y_val)
        obs = monitor.record_step(metrics)
        print(f"  Step {step}: Loss = {metrics.loss:.4f}, Val Acc = {metrics.val_accuracy:.4f}, GradNorm = {metrics.gradient_norm:.4f}")

    # 3. Inject LR Misconfiguration failure to trigger diagnostic event
    print("\nPhase 2: Injecting Failure [LR_MISCONFIGURATION] at Step 6...")
    model.inject_failure(FailureType.LR_MISCONFIGURATION, severity=1.0)
    metrics_fail = model.train_step(X_train, y_train, X_val, y_val)
    obs_fail = monitor.record_step(metrics_fail)
    summary_fail = monitor.get_summary()

    anomalies = detector.evaluate(summary_fail, obs_fail)
    diag = diagnoser.diagnose(anomalies, summary_fail, obs_fail)
    print(f"  Diagnosis: Primary Cause = {diag.primary_cause}, Confidence = {diag.confidence:.4f}, Gate = {diag.confidence_gate_cleared}")

    # 4. Build 12D Embedding
    print("\nPhase 3: Building 12-Dimensional Failure Embedding...")
    emb_12d = build_failure_embedding(obs_fail, summary_fail, diag, max_depth=8)
    print(f"  Embedding Shape: {emb_12d.shape}")
    print(f"  Vector components: {[round(float(x), 4) for x in emb_12d]}")
    assert emb_12d.shape == (12,)
    assert np.all(emb_12d >= -1.0) and np.all(emb_12d <= 1.0)

    # 5. Store Episode in Memory and Test Retrieval
    print("\nPhase 4: SQLite Persistence and Vector Cosine Similarity Retrieval...")
    episode_1 = FailureEpisode(
        episode_id="ep_stage4_001",
        timestamp=100.0,
        iso_timestamp="2026-11-02T16:15:00",
        experiment_id="exp_stage4_verif",
        step=6,
        embedding=emb_12d,
        diagnosed_cause=diag.primary_cause.value if diag.primary_cause else "unknown",
        diagnosis_confidence=diag.confidence,
        telemetry_summary={"loss": metrics_fail.loss, "grad_norm": metrics_fail.gradient_norm},
        selected_repair="adjust_learning_rate",
        recovery_duration=3,
        loss_before=metrics_fail.loss,
        loss_after=0.42,
        loss_improvement=0.35,
        acc_before=metrics_fail.val_accuracy,
        acc_after=0.82,
        acc_improvement=0.15,
        reward=0.68,
        status="RESOLVED",
    )
    assert memory.store_episode(episode_1)
    print(f"  Stored episode {episode_1.episode_id}. DB Count = {memory.count()}")

    # Reconnect to verify persistence
    memory_reconnected = FailureMemory(db_path=db_path)
    retrieved = memory_reconnected.retrieve_similar(emb_12d, top_k=1)
    print(f"  Retrieved match: {retrieved[0].episode.episode_id}, Cosine Similarity = {retrieved[0].similarity:.6f}")
    assert np.isclose(retrieved[0].similarity, 1.0, atol=1e-5)

    # 6. Candidate Repair Generation across All 6 Arms
    print("\nPhase 5: Candidate Generation across All 6 Locked Arms...")
    current_state = model.get_state()
    all_candidates = repair_lib.generate_candidate_repairs(current_state, all_arms=True)
    for cand in all_candidates:
        print(f"  Candidate Arm: {cand.arm.value:<25} Rationale: {cand.rationale[:60]}...")
    assert len(all_candidates) == 6

    # 7. Safety Filtering & Anti-Oscillation Layer
    print("\nPhase 6: Safety Filter Evaluation & Anti-Oscillation Rules...")
    # Simulate a history with LR increased at step 5
    sim_history = [
        RepairHistoryRecord(
            step=5,
            arm=RepairArm.ADJUST_LEARNING_RATE,
            params={"factor": 2.0},
            status="SUCCESS",
            reward=0.25,
        )
    ]
    # Propose reversing LR at step 6 (decreasing)
    reversal_cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"factor": 0.2})
    decision_rev = safety_filter.evaluate_candidate(reversal_cand, current_state, history=sim_history)
    print(f"  Reversal Test: Arm = {decision_rev.arm.value}, Safe = {decision_rev.is_safe}, Reason = {decision_rev.rejection_reason}")
    assert decision_rev.is_safe is False
    assert "ANTI_OSCILLATION" in decision_rev.rejection_reason

    # Test LR bounds rejection
    out_of_bounds_cand = CandidateRepair(arm=RepairArm.ADJUST_LEARNING_RATE, params={"new_lr": 2.5})
    decision_bounds = safety_filter.evaluate_candidate(out_of_bounds_cand, current_state)
    print(f"  LR Bounds Test: Safe = {decision_bounds.is_safe}, Reason = {decision_bounds.rejection_reason}")
    assert decision_bounds.is_safe is False
    assert "LR_UPPER_BOUND_EXCEEDED" in decision_bounds.rejection_reason

    # Test Depth minimum rejection on depth 1
    depth1_state = model.get_state()
    depth1_state.config.n_layers = 1
    depth_cand = CandidateRepair(arm=RepairArm.REDUCE_CIRCUIT_DEPTH)
    decision_depth = safety_filter.evaluate_candidate(depth_cand, depth1_state)
    print(f"  Depth Min Test: Safe = {decision_depth.is_safe}, Reason = {decision_depth.rejection_reason}")
    assert decision_depth.is_safe is False
    assert "DEPTH_BOUND_EXCEEDED" in decision_depth.rejection_reason

    # 8. Live Repair Transformation & Atomic Rollback
    print("\nPhase 7: Live Model Transformation & Atomic Rollback...")
    initial_opt = model.config.optimizer_name
    initial_params = model.params.copy()

    # Apply CHANGE_OPTIMIZER to live model
    cand_opt = CandidateRepair(arm=RepairArm.CHANGE_OPTIMIZER, params={"target_optimizer": "rmsprop"})
    res_opt = repair_lib.apply_to_model(model, cand_opt)
    print(f"  Applied {res_opt.arm.value}: Success = {res_opt.success}, New Opt = {model.config.optimizer_name}")
    assert model.config.optimizer_name == "rmsprop"

    # Roll back model to verify atomic reversibility
    repair_lib.rollback_model(model, res_opt)
    print(f"  Rollback complete: Restored Opt = {model.config.optimizer_name}")
    assert model.config.optimizer_name == initial_opt
    assert np.allclose(model.params, initial_params)

    # Apply WARM_RESTART to live model
    cand_warm = CandidateRepair(arm=RepairArm.PERFORM_WARM_RESTART, params={"mode": "perturbation", "sigma": 0.05})
    res_warm = repair_lib.apply_to_model(model, cand_warm)
    param_shift = float(np.linalg.norm(model.params - initial_params))
    print(f"  Applied {res_warm.arm.value}: Shift Norm = {param_shift:.6f}, Mode = {res_warm.diff_summary['mode']}")
    assert param_shift > 0.001

    print("\n" + "=" * 70)
    print("STAGE 4 VERIFICATION COMPLETE: ALL CHECKS PASSED EMPIRICALLY")
    print("=" * 70)


if __name__ == "__main__":
    run_stage4_verification()
