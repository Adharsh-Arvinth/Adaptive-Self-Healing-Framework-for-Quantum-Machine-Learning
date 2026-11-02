"""
Persistent SQLite-Based Failure Memory & Vector Retrieval.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 4).
"""

from dataclasses import dataclass, field
import datetime
import json
import os
import sqlite3
import time
from typing import Any, Dict, List, Optional, Tuple
import numpy as np

from backend.monitoring import HealthObservation, TelemetrySummary
from backend.diagnosis import DiagnosisResult


# ----------------------------------------------------------------------
# 12-Dimensional Failure Embedding Builder
# ----------------------------------------------------------------------

def build_failure_embedding(
    obs: HealthObservation,
    summary: TelemetrySummary,
    diag: Optional[DiagnosisResult] = None,
    max_depth: int = 8,
) -> np.ndarray:
    """
    Construct a deterministic 12-dimensional normalized failure embedding vector:
      e = [e_1, e_2, ..., e_12]^T in [-1, 1]^12
    Strictly follows the mathematical specifications in ALGORITHM_SPECIFICATION.md.
    Safely imputes missing or NaN/Inf values.
    """
    e = np.zeros(12, dtype=np.float64)

    # e1: Bias term
    e[0] = 1.0

    # e2: Normalized Training Loss: tanh(L_t)
    loss_val = obs.loss if (obs.is_valid and not np.isnan(obs.loss) and not np.isinf(obs.loss)) else 10.0
    e[1] = float(np.tanh(loss_val))

    # e3: Log Gradient Norm: clip((ln(||g|| + 1e-8) + 8) / 12, -1, 1)
    g_norm = obs.gradient_norm if not (np.isnan(obs.gradient_norm) or np.isinf(obs.gradient_norm)) else 0.0
    log_gnorm = np.log(max(1e-12, g_norm) + 1e-8)
    e[2] = float(np.clip((log_gnorm + 8.0) / 12.0, -1.0, 1.0))

    # e4: Log Gradient Variance: clip((ln(Var(g) + 1e-10) + 10) / 14, -1, 1)
    g_var = obs.gradient_variance if not (np.isnan(obs.gradient_variance) or np.isinf(obs.gradient_variance)) else 0.0
    log_gvar = np.log(max(1e-12, g_var) + 1e-10)
    e[3] = float(np.clip((log_gvar + 10.0) / 14.0, -1.0, 1.0))

    # e5: Normalized Parameter Velocity: tanh(10 * velocity)
    vel = obs.parameter_velocity if not (np.isnan(obs.parameter_velocity) or np.isinf(obs.parameter_velocity)) else 0.0
    e[4] = float(np.tanh(10.0 * vel))

    # e6: Relative Circuit Depth: L / max_depth in [0, 1]
    depth = max(1, obs.circuit_depth)
    e[5] = float(np.clip(depth / float(max_depth), 0.0, 1.0))

    # e7: Primary Diagnosis Probability in [1/6, 1.0]
    if diag is not None and diag.primary_cause is not None:
        e[6] = float(np.clip(diag.confidence, 0.0, 1.0))
    else:
        e[6] = float(1.0 / 6.0)

    # e8: Normalized Diagnosis Entropy in [0, 1]
    if diag is not None and len(diag.probabilities) == 6:
        probs = np.array(list(diag.probabilities.values()), dtype=np.float64)
        entropy = -np.sum(probs * np.log(probs + 1e-12))
        e[7] = float(np.clip(entropy / np.log(6.0), 0.0, 1.0))
    else:
        e[7] = 1.0  # Max uncertainty default

    # e9: Normalized Loss Slope: tanh(5 * slope)
    slope = summary.loss_slope if not (np.isnan(summary.loss_slope) or np.isinf(summary.loss_slope)) else 0.0
    e[8] = float(np.tanh(5.0 * slope))

    # e10: Loss Coefficient of Variation: tanh(cv)
    cv = summary.loss_cv if not (np.isnan(summary.loss_cv) or np.isinf(summary.loss_cv)) else 0.0
    e[9] = float(np.tanh(cv))

    # e11: Train-Val Gap: tanh(2 * (val_loss - loss))
    val_loss = obs.val_loss if not (np.isnan(obs.val_loss) or np.isinf(obs.val_loss)) else loss_val
    gap = val_loss - loss_val
    e[10] = float(np.tanh(2.0 * gap))

    # e12: Normalized Learning Rate: clip(log10(lr) / 4 + 1, 0, 1)
    lr = obs.learning_rate if (obs.learning_rate > 0.0 and not np.isnan(obs.learning_rate)) else 0.05
    e[11] = float(np.clip(np.log10(lr) / 4.0 + 1.0, -1.0, 1.0))

    return e


# ----------------------------------------------------------------------
# Episode Data Structures
# ----------------------------------------------------------------------

@dataclass
class FailureEpisode:
    """Record of a failure event, diagnosis, selected repair, and verified outcome."""
    episode_id: str
    timestamp: float
    iso_timestamp: str
    experiment_id: str
    step: int
    embedding: np.ndarray  # Shape (12,)
    diagnosed_cause: str
    diagnosis_confidence: float
    telemetry_summary: Dict[str, Any]
    selected_repair: str
    recovery_duration: int = 0
    loss_before: float = 0.0
    loss_after: float = 0.0
    loss_improvement: float = 0.0
    acc_before: float = 0.0
    acc_after: float = 0.0
    acc_improvement: float = 0.0
    reward: float = 0.0
    status: str = "RESOLVED"  # 'RESOLVED', 'FAILED', 'ROLLED_BACK'


@dataclass
class SimilarEpisode:
    """Retrieved historical episode with computed cosine similarity score."""
    episode: FailureEpisode
    similarity: float


# ----------------------------------------------------------------------
# Persistent SQLite Failure Memory
# ----------------------------------------------------------------------

class FailureMemory:
    """
    Persistent failure-experience repository utilizing SQLite.
    Stores 12-dimensional failure embeddings and historical recovery outcomes.
    Executes cosine-similarity nearest-neighbor search, and survives application restarts.
    """

    def __init__(self, db_path: str = "data/failure_memory.db"):
        self.db_path = db_path
        # Ensure parent directory exists
        db_dir = os.path.dirname(os.path.abspath(db_path))
        if db_dir:
            os.makedirs(db_dir, exist_ok=True)

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=10.0)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self) -> None:
        """Initialize SQLite table schema if it does not exist."""
        with self._get_connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS failure_episodes (
                    episode_id TEXT PRIMARY KEY,
                    timestamp REAL NOT NULL,
                    iso_timestamp TEXT NOT NULL,
                    experiment_id TEXT NOT NULL,
                    step INTEGER NOT NULL,
                    embedding TEXT NOT NULL,
                    embedding_norm REAL NOT NULL,
                    diagnosed_cause TEXT NOT NULL,
                    diagnosis_confidence REAL NOT NULL,
                    telemetry_summary TEXT NOT NULL,
                    selected_repair TEXT NOT NULL,
                    recovery_duration INTEGER NOT NULL,
                    loss_before REAL NOT NULL,
                    loss_after REAL NOT NULL,
                    loss_improvement REAL NOT NULL,
                    acc_before REAL NOT NULL,
                    acc_after REAL NOT NULL,
                    acc_improvement REAL NOT NULL,
                    reward REAL NOT NULL,
                    status TEXT NOT NULL
                )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cause ON failure_episodes(diagnosed_cause);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_repair ON failure_episodes(selected_repair);")
            conn.commit()

    def store_episode(self, episode: FailureEpisode) -> bool:
        """
        Store a validated FailureEpisode record into SQLite.
        Returns True on success, False if record is corrupted.
        """
        if not isinstance(episode.embedding, np.ndarray) or episode.embedding.shape != (12,):
            return False

        # Compute L2 norm for cosine similarity
        norm = float(np.linalg.norm(episode.embedding))
        embedding_json = json.dumps(episode.embedding.tolist())
        telemetry_json = json.dumps(episode.telemetry_summary)

        with self._get_connection() as conn:
            conn.execute("""
                INSERT OR REPLACE INTO failure_episodes (
                    episode_id, timestamp, iso_timestamp, experiment_id, step,
                    embedding, embedding_norm, diagnosed_cause, diagnosis_confidence,
                    telemetry_summary, selected_repair, recovery_duration,
                    loss_before, loss_after, loss_improvement,
                    acc_before, acc_after, acc_improvement,
                    reward, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                episode.episode_id,
                episode.timestamp,
                episode.iso_timestamp,
                episode.experiment_id,
                episode.step,
                embedding_json,
                norm,
                episode.diagnosed_cause,
                episode.diagnosis_confidence,
                telemetry_json,
                episode.selected_repair,
                episode.recovery_duration,
                float(episode.loss_before) if not (np.isnan(episode.loss_before) or np.isinf(episode.loss_before)) else 10.0,
                float(episode.loss_after) if not (np.isnan(episode.loss_after) or np.isinf(episode.loss_after)) else 10.0,
                float(episode.loss_improvement) if not (np.isnan(episode.loss_improvement) or np.isinf(episode.loss_improvement)) else -1.0,
                float(episode.acc_before) if not (np.isnan(episode.acc_before) or np.isinf(episode.acc_before)) else 0.0,
                float(episode.acc_after) if not (np.isnan(episode.acc_after) or np.isinf(episode.acc_after)) else 0.0,
                float(episode.acc_improvement) if not (np.isnan(episode.acc_improvement) or np.isinf(episode.acc_improvement)) else 0.0,
                float(episode.reward) if not (np.isnan(episode.reward) or np.isinf(episode.reward)) else -1.0,
                episode.status,
            ))
            conn.commit()
        return True

    def retrieve_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        min_similarity: float = -1.0,
        cause_filter: Optional[str] = None,
    ) -> List[SimilarEpisode]:
        """
        Retrieve top-K similar historical episodes via Cosine Similarity:
          sim(q, v) = (q . v) / (||q|| * ||v||)
        Handles empty databases, zero-norm queries, and corrupted embeddings safely.
        """
        if not isinstance(query_embedding, np.ndarray) or query_embedding.shape != (12,):
            return []

        q_norm = float(np.linalg.norm(query_embedding))
        if q_norm < 1e-12:
            return []  # Zero-norm query cannot have meaningful angle

        with self._get_connection() as conn:
            if cause_filter:
                cursor = conn.execute(
                    "SELECT * FROM failure_episodes WHERE diagnosed_cause = ?", (cause_filter,)
                )
            else:
                cursor = conn.execute("SELECT * FROM failure_episodes")
            rows = cursor.fetchall()

        if not rows:
            return []

        candidates: List[Tuple[FailureEpisode, float]] = []

        for row in rows:
            try:
                emb_list = json.loads(row["embedding"])
                v = np.array(emb_list, dtype=np.float64)
                v_norm = float(row["embedding_norm"])
                if v_norm < 1e-12 or len(v) != 12:
                    continue

                dot = float(np.dot(query_embedding, v))
                cosine_sim = float(dot / (q_norm * v_norm))
                # Bound within [-1.0, 1.0] against precision overflow
                cosine_sim = float(np.clip(cosine_sim, -1.0, 1.0))

                if cosine_sim >= min_similarity:
                    ep = FailureEpisode(
                        episode_id=row["episode_id"],
                        timestamp=row["timestamp"],
                        iso_timestamp=row["iso_timestamp"],
                        experiment_id=row["experiment_id"],
                        step=row["step"],
                        embedding=v,
                        diagnosed_cause=row["diagnosed_cause"],
                        diagnosis_confidence=row["diagnosis_confidence"],
                        telemetry_summary=json.loads(row["telemetry_summary"]),
                        selected_repair=row["selected_repair"],
                        recovery_duration=row["recovery_duration"],
                        loss_before=row["loss_before"],
                        loss_after=row["loss_after"],
                        loss_improvement=row["loss_improvement"],
                        acc_before=row["acc_before"],
                        acc_after=row["acc_after"],
                        acc_improvement=row["acc_improvement"],
                        reward=row["reward"],
                        status=row["status"],
                    )
                    candidates.append((ep, cosine_sim))
            except Exception:
                continue  # Skip corrupted records safely

        # Sort descending by similarity
        candidates.sort(key=lambda x: x[1], reverse=True)
        return [SimilarEpisode(episode=ep, similarity=sim) for ep, sim in candidates[:top_k]]

    def get_recent_episodes(self, limit: int = 20) -> List[FailureEpisode]:
        """
        Retrieve recent failure episodes ordered by timestamp descending (DEF-007).
        Provides clean chronological retrieval without requiring synthetic query embeddings.
        """
        with self._get_connection() as conn:
            cursor = conn.execute(
                "SELECT * FROM failure_episodes ORDER BY timestamp DESC LIMIT ?", (limit,)
            )
            rows = cursor.fetchall()

        episodes: List[FailureEpisode] = []
        for row in rows:
            try:
                emb_list = json.loads(row["embedding"])
                v = np.array(emb_list, dtype=np.float64)
                ep = FailureEpisode(
                    episode_id=row["episode_id"],
                    timestamp=row["timestamp"],
                    iso_timestamp=row["iso_timestamp"],
                    experiment_id=row["experiment_id"],
                    step=row["step"],
                    embedding=v,
                    diagnosed_cause=row["diagnosed_cause"],
                    diagnosis_confidence=row["diagnosis_confidence"],
                    telemetry_summary=json.loads(row["telemetry_summary"]),
                    selected_repair=row["selected_repair"],
                    recovery_duration=row["recovery_duration"],
                    loss_before=row["loss_before"],
                    loss_after=row["loss_after"],
                    loss_improvement=row["loss_improvement"],
                    acc_before=row["acc_before"],
                    acc_after=row["acc_after"],
                    acc_improvement=row["acc_improvement"],
                    reward=row["reward"],
                    status=row["status"],
                )
                episodes.append(ep)
            except Exception:
                continue
        return episodes

    def count(self) -> int:
        """Return total count of stored failure episodes."""
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT COUNT(*) FROM failure_episodes")
            return int(cursor.fetchone()[0])

    def clear(self) -> None:
        """Clear all stored failure memory episodes."""
        with self._get_connection() as conn:
            conn.execute("DELETE FROM failure_episodes")
            conn.commit()
