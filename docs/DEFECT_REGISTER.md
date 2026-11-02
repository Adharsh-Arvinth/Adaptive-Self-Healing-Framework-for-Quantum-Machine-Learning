# Defect Register: Stage 7.5 Research-Readiness Audit

**Document Reference:** `DEFECT_REGISTER.md`  
**Framework:** Adaptive Self-Healing Framework for Quantum Machine Learning  
**Audit Phase:** Stage 7.5 Independent Research-Readiness Audit  
**Status:** All Defects Successfully Remediated & Verified (100% Resolved)  
**Audit Date:** March 2026  
**Auditors:** Lead AI Research Engineer, Quantum ML Architect & Research Scientist  

---

## 1. Summary of Identified Defects & Resolution Status

| Defect ID | Severity | Module Affected | Defect Summary | Status | Resolution Evidence |
|---|---|---|---|---|---|
| **DEF-001** | **High** | `backend/pipeline.py` | Embedding semantic mismatch between storage and retrieval in `FailureMemory` | **RESOLVED** | Stored embedding in `_finalize_recovery` now explicitly uses cached `_current_failure_embedding` (12D telemetry failure embedding). Verified by `test_def_001_memory_stores_failure_embedding_not_bandit_context`. |
| **DEF-002** | **Medium** | `backend/detection.py` | Conflation of ansatz layer count ($L$) with qubit count ($n$) in barren plateau variance bound | **RESOLVED** | Updated variance threshold to use physical `o.n_qubits` ($\mathcal{O}(2^{-n})$) with documented scientific assumptions/limitations (McClean et al. 2018, Cerezo et al. 2021). Verified by `test_def_002_barren_plateau_variance_bound_scales_with_qubits`. |
| **DEF-003** | **Medium** | `backend/qml_model.py` | Bloch sphere expectation values do not reflect simulation-side noise mitigation | **RESOLVED** | Physical noisy coordinates $\langle X\rangle, \langle Y\rangle, \langle Z\rangle$, purity, and radius are preserved as contracted mixed states without artificial purification; error-mitigated expectation values are reported separately under `mitigated_x, mitigated_y, mitigated_z`. Verified by `test_def_003_bloch_coordinates_preserve_noisy_state_and_separate_mitigated`. |
| **DEF-004** | **Low** | `backend/qml_model.py` | Key naming discrepancy (`qubit` vs `qubit_index`) in Bloch coordinate dictionary | **RESOLVED** | Standardized dictionary return to include `qubit`, `qubit_index`, and `qubitIndex` for universal backward/forward compatibility. Verified by `test_def_004_bloch_coordinates_key_compatibility`. |
| **DEF-005** | **Low** | `backend/bandit.py` | Redundant duplication of multi-objective reward function between `bandit.py` and `evaluation.py` | **RESOLVED** | Centralized in `backend/evaluation.py` and imported into `backend/bandit.py` with zero circular dependencies. Verified by `test_def_005_centralized_reward_function_consistency`. |
| **DEF-006** | **Low** | `backend/bandit.py` | Absence of explicit symmetrization in Sherman-Morrison rank-1 update of $\mathbf{B}^{-1}$ | **RESOLVED** | Enforced strict symmetry $\mathbf{B}^{-1} = \frac{1}{2}(\mathbf{B}^{-1} + (\mathbf{B}^{-1})^T)$, evaluated $\lambda_{\text{min}}$, and added reconditioning floor ($\le 10^{-10}$). Verified by `test_def_006_posterior_symmetry_and_positive_definiteness`. |
| **DEF-007** | **Low** | `backend/memory.py` | Absence of direct `get_recent_episodes()` method requiring dummy vector query in API layer | **RESOLVED** | Added `get_recent_episodes(limit=20)` to `FailureMemory` and wired into `/api/memory/episodes` in `backend/api.py`. Verified by `test_def_007_memory_get_recent_episodes`. |

---

## 2. Detailed Defect Reports

### DEF-001: Embedding Semantic Mismatch in FailureMemory Storage vs Retrieval
- **Unique Identifier:** `DEF-001`
- **Severity:** **High**
- **Affected Module:** `backend/pipeline.py` (lines 310, 444–466)
- **Evidence:**
  In `backend/pipeline.py`, line 310 constructs `query_emb` using `build_failure_embedding(obs, summary, diag)`:
  $$\mathbf{e}_{\text{query}} = [1, \tanh(L), \log \|g\|, \log \text{Var}(g), v_\theta, L/L_{\text{max}}, p_{\text{primary}}, H(p), \text{slope}, \text{cv}, \text{gap}, \eta]^T$$
  However, in `_finalize_recovery` (line 451), the episode is stored in SQLite using `self._current_context.copy()`:
  $$\mathbf{x}_{\text{stored}} = [1, \tanh(L), \log \|g\|, \log \text{Var}(g), v_\theta, L/L_{\text{max}}, p_{\text{primary}}, H(p), \bar{r}_{\text{hist}}, S_{\text{hist}}, \widetilde{\Delta\mathcal{L}}_{\text{twin}}, S_{\text{proxy}}]^T$$
- **Root Cause:**
  The developer passed the 12D *bandit context vector* $\mathbf{x} \in \mathbb{R}^{12}$ instead of the 12D *telemetry failure embedding* $\mathbf{e}_f \in \mathbb{R}^{12}$ when persisting `FailureEpisode` into the SQLite database. Consequently, cosine similarity compares indices 8–11 of heterogeneous semantic quantities:
  - Query Index 8: `loss_slope` $\longleftrightarrow$ Stored Index 8: `memory_prior_reward`
  - Query Index 9: `loss_cv` $\longleftrightarrow$ Stored Index 9: `memory_top_similarity`
  - Query Index 10: `train_val_gap` $\longleftrightarrow$ Stored Index 10: `twin_loss_delta`
  - Query Index 11: `normalized_lr` $\longleftrightarrow$ Stored Index 11: `twin_proxy_stability`
- **Proposed Correction:**
  Cache `self._current_failure_embedding = query_emb.copy()` at line 310 in `backend/pipeline.py`, and pass `embedding=self._current_failure_embedding.copy()` at line 451.
- **Regression Test:**
  Assert that dimensions 8–11 of retrieved episodes match the output of `build_failure_embedding`.

---

### DEF-002: Conflation of Ansatz Layer Count ($L$) with Qubit Count ($n$) in Barren Plateau Variance Bound
- **Unique Identifier:** `DEF-002`
- **Severity:** **Medium**
- **Affected Module:** `backend/detection.py` (lines 157–160)
- **Evidence:**
  ```python
  # Qubit scaling threshold for variance
  n_qubits = max(2, o.circuit_depth)
  var_bound = self.thresholds.bp_grad_var_max * (2.0 ** (-n_qubits))
  ```
- **Root Cause:**
  `o.circuit_depth` represents the number of ansatz layers $L \in [1, 8]$, not the number of qubits $n \in [2, 4]$. In McClean et al. (2018), the gradient variance in a 2-design Haar-random circuit scales as $\mathcal{O}(2^{-n})$ or $\mathcal{O}(2^{-2n})$ where $n$ is the number of qubits, independent of layer count (once $L$ exceeds the scrambling depth). Conflating $L$ with $n$ causes a deep 2-qubit circuit ($L=8$) to enforce a variance threshold scaled by $2^{-8} = 1/256$, which is an unphysical qubit scaling bound.
- **Proposed Correction:**
  Pass `n_qubits` explicitly from `StepMetrics` and `HealthObservation` into `TelemetrySummary`, and evaluate:
  $$\text{var\_bound} = \theta_{\text{bp\_var}} \times 2^{-n_{\text{qubits}}}$$
- **Regression Test:**
  Unit test with $n_{\text{qubits}}=2, L=8$ verifying that `var_bound` scales with $2^{-2}$ rather than $2^{-8}$.

---

### DEF-003: Bloch Sphere Expectation Values Do Not Reflect Simulation-Side Noise Mitigation
- **Unique Identifier:** `DEF-003`
- **Severity:** **Medium**
- **Affected Module:** `backend/qml_model.py` (lines 434–440)
- **Evidence:**
  ```python
  if self._noise_level > 0.0:
      contraction = max(0.1, 1.0 - 0.5 * self._noise_level)
      bx *= contraction
      by *= contraction
      bz *= contraction
  ```
- **Root Cause:**
  While `predict_proba` checks `if self.config.noise_mitigation: expval = expval / (1.0 - 0.5 * self._noise_level)`, `get_bloch_coordinates` contracts $\langle X \rangle, \langle Y \rangle, \langle Z \rangle$ unconditionally whenever `self._noise_level > 0.0`. Consequently, after repair arm 5 (`apply_noise_mitigation`) is deployed and committed, the model predictions recover, but the visual Bloch sphere vector remains contracted.
- **Proposed Correction:**
  Check `if not getattr(self.config, "noise_mitigation", False)` before applying depolarizing contraction to the Bloch expectation values.
- **Regression Test:**
  Deploy `apply_noise_mitigation` on a noisy model and assert that the Bloch vector purity $r = \sqrt{x^2+y^2+z^2}$ recovers towards unity.

---

### DEF-004: Key Naming Discrepancy in Bloch Coordinate Dictionary
- **Unique Identifier:** `DEF-004`
- **Severity:** **Low**
- **Affected Module:** `backend/qml_model.py` (line 440) vs `frontend/types/index.ts` (line 15)
- **Evidence:**
  `backend/qml_model.py` returns `{"x": bx, "y": by, "z": bz, "qubit": 0}`, whereas `frontend/types/index.ts` declares `qubit_index?: number` and `frontend/components/BlochSphere.tsx` defaults `qubitIndex = 0`.
- **Root Cause:**
  Inconsistent schema key naming across backend serialization and frontend TypeScript interface.
- **Proposed Correction:**
  Standardize backend dictionary return to `{"x": bx, "y": by, "z": bz, "qubit_index": 0}`.
- **Regression Test:**
  JSON serialization schema test asserting presence of `qubit_index`.

---

### DEF-005: Redundant Duplication of Multi-Objective Reward Function
- **Unique Identifier:** `DEF-005`
- **Severity:** **Low**
- **Affected Module:** `backend/bandit.py` (lines 116–171) vs `backend/evaluation.py` (lines 82–140)
- **Evidence:**
  `compute_multi_objective_reward` is fully defined twice in separate files with identical weighting constants ($w_1=0.40, w_2=0.25, w_3=0.15, w_4=0.05, w_5=0.05, w_6=0.10$).
- **Root Cause:**
  Independent module authoring during Stages 5 and 6 without subsequent refactoring import.
- **Proposed Correction:**
  Have `backend/bandit.py` import `compute_multi_objective_reward` directly from `backend/evaluation.py` to maintain a single source of truth.
- **Regression Test:**
  Verification test checking that reward outputs from both entry points are bitwise identical.

---

### DEF-006: Absence of Explicit Symmetrization in Sherman-Morrison Update of $\mathbf{B}^{-1}$
- **Unique Identifier:** `DEF-006`
- **Severity:** **Low**
- **Affected Module:** `backend/bandit.py` (lines 242–250)
- **Evidence:**
  ```python
  denominator = 1.0 + float(np.dot(x, B_inv_x))
  numerator = np.outer(B_inv_x, B_inv_x)
  self.B_inv -= numerator / max(1e-12, denominator)
  ```
- **Root Cause:**
  While `sample_weights` symmetrizes `cov = 0.5 * (cov + cov.T)` prior to sampling, `self.B_inv` itself is not symmetrized at the end of `update()`. In floating-point arithmetic with asymmetric context vectors, machine precision rounding can cause $\mathbf{B}^{-1}$ to develop minor off-diagonal asymmetry over hundreds of online updates.
- **Proposed Correction:**
  Add `self.B_inv = 0.5 * (self.B_inv + self.B_inv.T)` at the conclusion of `update()`.
- **Regression Test:**
  Execute 500 sequential updates and assert $\|\mathbf{B}^{-1} - (\mathbf{B}^{-1})^T\|_{\infty} \equiv 0.0$.

---

### DEF-007: Absence of Direct `get_recent_episodes()` in FailureMemory
- **Unique Identifier:** `DEF-007`
- **Severity:** **Low**
- **Affected Module:** `backend/memory.py` (line 235) vs `backend/api.py` (lines 385–386)
- **Evidence:**
  In `backend/api.py`:
  ```python
  dummy_query = np.ones(12) / np.sqrt(12)
  top_matches = state_mgr.pipeline.memory.retrieve_similar(dummy_query, top_k=20)
  ```
- **Root Cause:**
  `FailureMemory` lacked an explicit method for chronological retrieval of recent episodes without computing vector cosine similarity against an arbitrary vector.
- **Proposed Correction:**
  Add `get_recent_episodes(limit: int = 20) -> List[FailureEpisode]` to `FailureMemory`.
- **Regression Test:**
  Unit test verifying that `get_recent_episodes` returns episodes ordered by timestamp descending.
