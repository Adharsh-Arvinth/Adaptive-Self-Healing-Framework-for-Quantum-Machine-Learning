# Remediation Plan: Stage 7.5 Research-Readiness Audit

**Document Reference:** `REMEDIATION_PLAN.md`  
**Framework:** Adaptive Self-Healing Framework for Quantum Machine Learning  
**Audit Phase:** Stage 7.5 Independent Research-Readiness Audit  
**Status:** Awaiting Final Audit Review & Authorization  
**Target Completion:** Prior to Launching Stage 8 Empirical Campaign  

---

## 1. Remediation Scope & Guidelines

In accordance with Section 9 of the Stage 7.5 instructions:
- **No structural rewrites:** Do not rewrite the entire project.
- **No feature creep:** Do not introduce new features or change approved architectures.
- **No algorithmic alterations for convenience:** Preserve exactly:
  1. Six approved repair arms (`change_optimizer`, `reduce_circuit_depth`, `modify_feature_map`, `adjust_learning_rate`, `apply_noise_mitigation`, `perform_warm_restart`).
  2. 12-dimensional contextual feature vector $\mathbf{x} \in [-1, 1]^{12}$.
  3. Contextual Thompson Sampling with Bayesian linear regression.
  4. Three-step digital-twin horizon ($H = 3$).
  5. Confidence-gated diagnosis ($\tau = 0.60, T = 0.50$).
  6. Persistent SQLite failure memory with cosine similarity.
  7. Operational safety filtering ($K_{\text{osc}} = 4$).
  8. Atomic deployment and rollback state-machine.
  9. Actual-observation-only bandit posterior updates.

---

## 2. Remediation Action Matrix

| Step | Defect ID | Severity | File(s) to Modify | Exact Correction Description | Risk Assessment |
|---|---|---|---|---|---|
| **Phase 1** | **DEF-001** | **High** | `backend/pipeline.py` | Cache `query_emb` from `build_failure_embedding` at step 310 and store it in `FailureEpisode` at step 451 instead of `_current_context`. | **Zero risk to architecture**; ensures storage and retrieval compare identical 12D telemetry vectors. |
| **Phase 1** | **DEF-002** | **Medium** | `backend/monitoring.py`, `backend/detection.py` | Add `n_qubits` field to `StepMetrics` and `HealthObservation`. Update `_evaluate_barren_plateau` in `detection.py` to scale variance bound by $2^{-n_{\text{qubits}}}$ rather than $2^{-L}$. | **Low risk**; fixes physical qubit-scaling bound for barren plateaus without altering detection logic. |
| **Phase 1** | **DEF-003** | **Medium** | `backend/qml_model.py` | In `get_bloch_coordinates`, gate depolarizing contraction with `if not getattr(self.config, "noise_mitigation", False)`. | **Zero risk**; visual fidelity fix aligning Bloch coordinates with mitigated expectation values. |
| **Phase 2** | **DEF-004** | **Low** | `backend/qml_model.py` | Return `{"x": bx, "y": by, "z": bz, "qubit_index": 0}` in `get_bloch_coordinates`. | **Zero risk**; schema naming alignment. |
| **Phase 2** | **DEF-005** | **Low** | `backend/bandit.py` | Import `compute_multi_objective_reward` from `backend/evaluation.py` instead of maintaining duplicated logic. | **Zero risk**; removes duplicate code. |
| **Phase 2** | **DEF-006** | **Low** | `backend/bandit.py` | Add `self.B_inv = 0.5 * (self.B_inv + self.B_inv.T)` at the end of `ArmPosterior.update()`. | **Zero risk**; prevents numerical floating-point asymmetry over extended training runs. |
| **Phase 2** | **DEF-007** | **Low** | `backend/memory.py`, `backend/api.py` | Add `get_recent_episodes(limit=20)` to `FailureMemory` and invoke it in `/api/memory/episodes`. | **Zero risk**; cleaner API retrieval without dummy vector search. |

---

## 3. Verification & Regression Protocol

Once authorized, remediation must be executed and validated in strict order:
1. **Unit Test Verification:** Run `pytest tests/ -v` to ensure all 85 tests continue to pass.
2. **Defect-Specific Regression Tests:**
   - Execute `tests/test_audit_safety_failure.py` verifying that all safety stress tests pass.
   - Verify that SQLite stored failure episodes match query feature dimensions exactly.
   - Verify that Bloch coordinates recover under noise mitigation.
3. **End-to-End Vertical Slice Verification:** Run `backend/run_slice.py` and `backend/verify_integration.py` to confirm full-stack closed-loop integrity.
4. **Production Build Cleanliness:** Run `npm run build` in `frontend/` to confirm zero TypeScript or bundling regressions.
