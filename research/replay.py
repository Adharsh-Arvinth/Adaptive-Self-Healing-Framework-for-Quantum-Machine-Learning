"""
Policy evaluation by replay over the counterfactual episode table.

Every policy faces the same stream of episodes (in R random orders); at each episode it observes
only decision-time information (context, diagnosis, safety verdicts, twin predictions) and receives
the logged outcome of the action it chose. Since outcomes for ALL actions are logged, regret against
the per-episode oracle is exact, and all comparisons are paired.

Pipeline semantics: a policy acts only when the confidence gate cleared ("gated"); otherwise the
outcome is the no-op outcome. The deployment guard (W_val acceptance) turns a rejected repair into
a rollback to the decision-time state, i.e. the no-op continuation (with the rollback penalty in
the reward).
"""

from collections import defaultdict
from dataclasses import dataclass
from typing import Callable, Dict, List, Optional

import numpy as np

ARMS = ["change_optimizer", "reduce_circuit_depth", "modify_feature_map",
        "adjust_learning_rate", "apply_noise_mitigation", "perform_warm_restart"]
EXT_ARMS = ARMS + ["rollback_healthy"]          # extended library with checkpoint restore
EXT2_ARMS = ARMS + ["rollback_healthy", "rollback_clean"]  # latent regime: recent (maybe faulty) and older clean checkpoint
RESTORES = ("rollback_healthy", "rollback_clean")
HEURISTIC_MAP = {                                # AUTOTRAINER-style fixed diagnosis -> fix map
    "barren_plateau": "reduce_circuit_depth",
    "persistent_plateau": "adjust_learning_rate",
    "lr_misconfiguration": "adjust_learning_rate",
    "optimizer_instability": "change_optimizer",
    "training_divergence": "perform_warm_restart",
    "noise_degradation": "apply_noise_mitigation",
}


# ----------------------------------------------------------------------------------------------
# Outcome model
# ----------------------------------------------------------------------------------------------

def outcome(ep: dict, action: str, guarded: bool = True) -> dict:
    """Realised outcome of `action` in episode `ep`, with or without the deployment guard."""
    oc = ep["outcomes"]
    o = oc[action]
    if action == "noop":
        return {"reward": 0.0, "test_acc3": o["test_acc3"], "recovered": o["recovered"], "acc_gap": o["acc_gap"],
                "committed": False, "rolled_back": False, "harmful": False, "evals": 0}
    if guarded and not o["accepted"]:
        n = oc["noop"]
        return {"reward": o["reward"], "test_acc3": n["test_acc3"], "recovered": n["recovered"], "acc_gap": n["acc_gap"],
                "committed": False, "rolled_back": True, "harmful": False, "evals": o["evals_validation"]}
    harmful = (o["test_acc3"] < oc["noop"]["test_acc3"] - 0.05)
    return {"reward": o["reward"], "test_acc3": o["test_acc3"], "recovered": o["recovered"], "acc_gap": o["acc_gap"],
            "committed": True, "rolled_back": False, "harmful": bool(harmful), "evals": o["evals_validation"]}


def eligible(ep: dict, arms: List[str], use_safety: bool = True, use_twin_gate: bool = True) -> List[str]:
    el = []
    for a in arms:
        if a in RESTORES:
            if a in ep["outcomes"]:
                el.append(a)
            continue
        if use_safety and not ep["safety"][a]["safe"]:
            continue
        if not ep["outcomes"][a]["applied"]:
            continue
        el.append(a)
    if use_twin_gate:
        twin_ok = [a for a in el if a in RESTORES or ep["twin"][a]["viable"]]
        if twin_ok:
            el = twin_ok
    return el or ["perform_warm_restart"]


# ----------------------------------------------------------------------------------------------
# Context construction (x9/x10 depend on the policy's own memory)
# ----------------------------------------------------------------------------------------------

class EpisodicMemory:
    """In-memory replica of backend.memory retrieval: cosine top-1 over stored failure embeddings."""

    def __init__(self):
        self.E: List[np.ndarray] = []
        self.R: List[float] = []

    def query(self, e: np.ndarray):
        if not self.E:
            return 0.0, 0.0
        M = np.array(self.E)
        sims = M @ e / (np.linalg.norm(M, axis=1) * np.linalg.norm(e) + 1e-12)
        i = int(np.argmax(sims))
        return float(self.R[i]), float(sims[i])

    def add(self, e: np.ndarray, r: float):
        self.E.append(e)
        self.R.append(r)


def context(ep: dict, mem: Optional[EpisodicMemory], use_twin: bool = True, use_memory: bool = True) -> np.ndarray:
    x = np.array(ep["context_no_memory"], dtype=float)
    if use_memory and mem is not None:
        r, s = mem.query(np.array(ep["embedding"], dtype=float))
        x[8], x[9] = np.clip(r, -1, 1), np.clip(s, -1, 1)
    else:
        x[8], x[9] = 0.0, 0.0
    if not use_twin:
        x[10], x[11] = 0.0, 0.5
    return x


def diag_onehot(ep: dict, source: str = "rule") -> np.ndarray:
    keys = list(HEURISTIC_MAP.keys())
    v = np.zeros(len(keys))
    p = ep["diagnosis"]["probs"] if source == "rule" else ep["learned_probs"]
    for i, k in enumerate(keys):
        v[i] = p.get(k, 0.0)
    return v


def primary(ep: dict, source: str = "rule") -> str:
    if source == "rule":
        return ep["diagnosis"]["primary"] or ""
    p = {k: v for k, v in ep["learned_probs"].items() if k != "nominal"}
    return max(p, key=p.get)


def should_act(ep: dict, spec) -> bool:
    if spec.gated is False:
        return True
    if spec.gate_source == "learned":
        return ep["learned_probs"]["nominal"] < 0.5
    return bool(ep["gate_cleared"])


# ----------------------------------------------------------------------------------------------
# Linear contextual bandits (disjoint per-arm Bayesian linear regression)
# ----------------------------------------------------------------------------------------------

class LinearArms:
    def __init__(self, arms: List[str], d: int, lam: float = 1.0):
        self.arms = arms
        self.Binv = {a: np.eye(d) / lam for a in arms}
        self.f = {a: np.zeros(d) for a in arms}

    def mu(self, a):
        return self.Binv[a] @ self.f[a]

    def update(self, a, x, r):
        Bx = self.Binv[a] @ x
        self.Binv[a] -= np.outer(Bx, Bx) / (1.0 + x @ Bx)
        self.f[a] += r * x


@dataclass
class PolicySpec:
    name: str
    kind: str                       # ts | greedy | egreedy | linucb | random | heuristic | noop | rollback | oracle | fixed
    arms: List[str] = None
    use_twin: bool = True
    use_memory: bool = True
    use_safety: bool = True
    use_twin_gate: bool = True
    guarded: bool = True
    gated: bool = True              # act only when the confidence gate cleared
    v: float = 0.5                  # TS exploration scale
    alpha: float = 1.0              # LinUCB width
    eps: float = 0.1
    add_diag: bool = False          # append diagnosis posterior to the context
    fixed_arm: Optional[str] = None
    adaptive_classes: tuple = ("noise_degradation",)  # hybrid: classes routed to the adaptive learner
    diag_source: str = "rule"       # rule | learned (out-of-fold, leave-one-dataset-out)
    gate_source: str = "rule"       # rule confidence gate | learned P(nominal) < 0.5


def run_policy(spec: PolicySpec, episodes: List[dict], order: np.ndarray, seed: int) -> Dict[str, np.ndarray]:
    rng = np.random.RandomState(seed)
    arms = spec.arms or ARMS
    d = 12 + (6 if spec.add_diag else 0)
    lin = LinearArms(arms, d)
    # Diagnosis-conditioned Gaussian TS: one Normal posterior over mean reward per (class, arm)
    # (prior N(0, 1), unit observation noise scaled by spec.v).
    cls_n = defaultdict(float)
    cls_s = defaultdict(float)
    mem = EpisodicMemory()
    out = {k: [] for k in ("reward", "regret", "recovered", "test_acc3", "acc_gap", "rolled_back", "harmful",
                           "acted", "evals", "oracle_reward", "action")}
    for idx in order:
        ep = episodes[idx]
        acts = should_act(ep, spec)
        el = eligible(ep, arms, spec.use_safety, spec.use_twin_gate)
        x = context(ep, mem, spec.use_twin, spec.use_memory)
        if spec.add_diag:
            x = np.concatenate([x, diag_onehot(ep, spec.diag_source)])
        # oracle over the same eligible set (guarded outcomes)
        oracle_r = max(outcome(ep, a, spec.guarded)["reward"] for a in el) if acts else 0.0

        if not acts or spec.kind == "noop":
            a = "noop"
        elif spec.kind == "rollback":
            a = "rollback_healthy"
        elif spec.kind == "fixed":
            a = spec.fixed_arm if spec.fixed_arm in el else el[0]
        elif spec.kind == "oracle":
            a = max(el, key=lambda k: outcome(ep, k, spec.guarded)["reward"])
        elif spec.kind == "random":
            a = el[rng.randint(len(el))]
        elif spec.kind == "heuristic":
            pref = HEURISTIC_MAP.get(primary(ep, spec.diag_source), "perform_warm_restart")
            a = pref if pref in el else el[0]
        elif spec.kind in ("class_ts", "hybrid"):
            c = primary(ep, spec.diag_source)
            if spec.kind == "hybrid" and c not in spec.adaptive_classes:
                a = "rollback_healthy"
            else:
                cand = [k for k in el if not (spec.kind == "hybrid" and k in RESTORES)] or el
                draws = {}
                for k in cand:
                    n, sm = cls_n[(c, k)], cls_s[(c, k)]
                    var = 1.0 / (1.0 + n / spec.v ** 2)
                    mean = var * (sm / spec.v ** 2)
                    draws[k] = rng.normal(mean, np.sqrt(var))
                a = max(draws, key=draws.get)
        elif spec.kind in ("ts", "greedy", "egreedy", "linucb"):
            scores = {}
            for k in el:
                mu = lin.mu(k)
                if spec.kind == "ts":
                    cov = (spec.v ** 2) * lin.Binv[k]
                    cov = 0.5 * (cov + cov.T) + 1e-9 * np.eye(d)
                    th = rng.multivariate_normal(mu, cov)
                    scores[k] = float(x @ th)
                elif spec.kind == "linucb":
                    scores[k] = float(x @ mu + spec.alpha * np.sqrt(max(0.0, x @ lin.Binv[k] @ x)))
                else:
                    scores[k] = float(x @ mu)
            if spec.kind == "egreedy" and rng.rand() < spec.eps:
                a = el[rng.randint(len(el))]
            else:
                best = max(scores.values())
                ties = [k for k, s in scores.items() if s >= best - 1e-12]
                a = ties[rng.randint(len(ties))]
        else:
            raise ValueError(spec.kind)

        o = outcome(ep, a, spec.guarded)
        if a != "noop" and acts and spec.kind in ("ts", "greedy", "egreedy", "linucb"):
            lin.update(a, x, o["reward"])
        if a != "noop" and acts and spec.kind in ("class_ts", "hybrid"):
            c = primary(ep, spec.diag_source)
            cls_n[(c, a)] += 1.0
            cls_s[(c, a)] += o["reward"]
        if a != "noop" and acts:
            mem.add(np.array(ep["embedding"], dtype=float), o["reward"])
        out["reward"].append(o["reward"])
        out["regret"].append(oracle_r - o["reward"] if acts else 0.0)
        out["recovered"].append(o["recovered"])
        out["test_acc3"].append(o["test_acc3"])
        out["acc_gap"].append(o["acc_gap"])
        out["rolled_back"].append(o["rolled_back"])
        out["harmful"].append(o["harmful"])
        out["acted"].append(a != "noop")
        out["evals"].append(o["evals"] + (sum(ep["twin"][k]["evals"] for k in ARMS) if (acts and spec.use_twin_gate and a != "noop") else 0))
        out["oracle_reward"].append(oracle_r)
        out["action"].append(a)
    return {k: np.array(v) for k, v in out.items()}


def default_policies() -> List[PolicySpec]:
    return [
        PolicySpec("No repair (continue)", "noop"),
        PolicySpec("Restore last healthy checkpoint", "rollback"),
        PolicySpec("Random arm", "random"),
        PolicySpec("Fixed rule map (AutoTrainer-style)", "heuristic"),
        PolicySpec("Greedy linear", "greedy"),
        PolicySpec("epsilon-greedy linear", "egreedy"),
        PolicySpec("LinUCB", "linucb"),
        PolicySpec("Thompson Sampling (proposed)", "ts"),
        PolicySpec("TS + diagnosis posterior", "ts", add_diag=True),
        PolicySpec("TS, extended library (+checkpoint arm)", "ts", arms=EXT_ARMS),
        PolicySpec("Rule map + learned diagnosis", "heuristic", diag_source="learned", gate_source="learned"),
        PolicySpec("TS + learned diagnosis (6 arms)", "ts", add_diag=True, diag_source="learned", gate_source="learned"),
        PolicySpec("TS + learned diagnosis, ext. library", "ts", arms=EXT_ARMS, add_diag=True,
                   diag_source="learned", gate_source="learned"),
        PolicySpec("Restore checkpoint, learned gate", "rollback", gate_source="learned"),
        PolicySpec("Class-conditioned TS, ext. library", "class_ts", arms=EXT_ARMS, diag_source="learned", gate_source="learned"),
        PolicySpec("Hybrid: restore + TS for environmental faults", "hybrid", arms=EXT_ARMS,
                   diag_source="learned", gate_source="learned"),
        PolicySpec("Oracle (6 arms)", "oracle"),
        PolicySpec("Oracle (extended library)", "oracle", arms=EXT_ARMS),
        PolicySpec("Oracle (ext. library, learned gate)", "oracle", arms=EXT_ARMS, gate_source="learned"),
    ]


def latent_policies() -> List[PolicySpec]:
    """Latent-fault regime: the most recent checkpoint may itself carry the fault."""
    L = dict(diag_source="learned", gate_source="learned")
    return [
        PolicySpec("No repair (continue)", "noop"),
        PolicySpec("Restore latest checkpoint", "rollback", **L),
        PolicySpec("Restore older clean checkpoint", "fixed", arms=EXT2_ARMS, fixed_arm="rollback_clean", **L),
        PolicySpec("Random action", "random", arms=EXT2_ARMS, **L),
        PolicySpec("Rule map + learned diagnosis", "heuristic", **L),
        PolicySpec("Thompson Sampling (6 arms)", "ts", **L),
        PolicySpec("TS + learned diagnosis, checkpoints", "ts", arms=EXT2_ARMS, add_diag=True, **L),
        PolicySpec("Diagnosis-conditioned TS, checkpoints", "class_ts", arms=EXT2_ARMS, **L),
        PolicySpec("Oracle (6 arms)", "oracle", **L),
        PolicySpec("Oracle (arms + checkpoints)", "oracle", arms=EXT2_ARMS, **L),
    ]


def ablation_policies() -> List[PolicySpec]:
    return [
        PolicySpec("TS full", "ts"),
        PolicySpec("TS - digital-twin features", "ts", use_twin=False),
        PolicySpec("TS - twin viability gate", "ts", use_twin_gate=False),
        PolicySpec("TS - twin (features + gate)", "ts", use_twin=False, use_twin_gate=False),
        PolicySpec("TS - episodic memory", "ts", use_memory=False),
        PolicySpec("TS - safety filter", "ts", use_safety=False),
        PolicySpec("TS - deployment guard", "ts", guarded=False),
        PolicySpec("TS - confidence gate (always act)", "ts", gated=False),
    ]
