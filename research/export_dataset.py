"""
Export the campaign as a flat, documented benchmark dataset (QFaultBench-VQC v1).

    python -m research.export_dataset

Writes research/dataset/qfaultbench_v1/
  episodes.csv    one row per episode: dataset, seed, fault label, severity, online detection and
                  rule-based diagnosis outcome, decision step
  telemetry.csv.gz one row per (episode, training step): the 12 telemetry channels, with the phase
                  (warmup / fault-observation) and the ground-truth label of that step
  outcomes.csv    one row per (episode, action): counterfactual outcome of each of the 8 actions
                  (acceptance verdict, reward, test accuracy vs healthy reference, recovery flag)
  twin.csv        one row per (episode, arm): digital-twin prediction for each repair arm
  DATASHEET.md    datasheet (Gebru et al., 2021) describing collection, labels, splits and limits
  SHA256SUMS      checksums of the files above
"""

import csv
import gzip
import io
import hashlib
import os

from research.analysis import load_episodes
from research.datasets import DATASET_INFO
from research.episodes import ACTIONS, K_POST, N_LAYERS, N_QUBITS, T_OBS, W_WARM
from research.replay import ARMS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT = os.path.join(ROOT, "research", "dataset", "qfaultbench_v1")
TEL = ["loss", "val_loss", "acc", "val_acc", "grad_norm", "grad_var", "velocity", "lr", "depth",
       "margin", "magnitude", "grad_cos", "test_loss", "test_acc", "finite"]


def main():
    os.makedirs(OUT, exist_ok=True)
    eps = load_episodes("ideal") + load_episodes("hw_torino") + load_episodes("latent4")
    reg = lambda e: e.get("regime", "ideal")
    warm = {(e["dataset"], e["seed"], reg(e)): e["warm_telemetry"] for e in eps if e.get("warm_telemetry")}

    with open(os.path.join(OUT, "episodes.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["episode_id", "regime", "dataset", "seed", "label", "severity", "bp_mode", "onset_step",
                    "first_anomaly_step", "decision_step", "gate_cleared", "rule_diagnosis", "rule_confidence",
                    "healthy_test_acc_at_onset"])
        for e in eps:
            w.writerow([e["episode_id"], reg(e), e["dataset"], e["seed"], e["condition"], round(e["severity"], 4),
                        e["bp_mode"] or "", W_WARM, e["first_anomaly_step"] or "", e["decision_step"],
                        int(e["gate_cleared"]), e["diagnosis"]["primary"] or "", round(e["diagnosis"]["confidence"], 4),
                        round(e["healthy_test"]["acc"], 4)])

    # mtime=0 and no embedded filename: byte-identical output on every export (stable SHA256SUMS)
    _raw = open(os.path.join(OUT, "telemetry.csv.gz"), "wb")
    with io.TextIOWrapper(gzip.GzipFile(filename="", mode="wb", fileobj=_raw, mtime=0), newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["episode_id", "step", "phase", "label"] + TEL)
        for e in eps:
            rows = [("warmup", "nominal", r) for r in warm[(e["dataset"], e["seed"], reg(e))]]
            rows += [("observation", e["condition"], r) for r in e["obs_telemetry"]]
            # natural evolution with no intervention (noop counterfactual) extends the trace
            for r in e["outcomes"]["noop"]["trajectory"]:
                rows.append(("continuation", e["condition"], r))
            for phase, lab, r in rows:
                w.writerow([e["episode_id"], r["step"], phase, lab] + [r.get(k, "") if r.get(k) is not None else "" for k in TEL])

    _raw.close()
    with open(os.path.join(OUT, "outcomes.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["episode_id", "action", "applied", "accepted", "reject_reason", "reward", "test_acc3",
                    "ref_test_acc3", "acc_gap", "recovered", "test_loss3", "final_finite"])
        for e in eps:
            for a in e.get("actions", ACTIONS):
                o = e["outcomes"][a]
                w.writerow([e["episode_id"], a, int(o["applied"]), int(o["accepted"]), o["reject_reason"] or "",
                            round(o["reward"], 5), round(o["test_acc3"], 5), round(o["ref_test_acc3"], 5),
                            round(o["acc_gap"], 5), int(o["recovered"]), round(o["test_loss3"], 5), int(o["final_finite"])])

    with open(os.path.join(OUT, "twin.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["episode_id", "arm", "safe", "viable", "pred_loss_delta", "norm_delta", "stability", "circuit_evals"])
        for e in eps:
            for a in ARMS:
                t = e["twin"][a]
                w.writerow([e["episode_id"], a, int(e["safety"][a]["safe"]), int(t["viable"]), round(t["pred_delta"], 6),
                            round(t["norm_delta"], 6), round(t["stability"], 6), t["evals"]])

    n_base = len({(e["dataset"], e["seed"], reg(e)) for e in eps})
    from collections import Counter
    n_reg = Counter(reg(e) for e in eps)
    seeds_by_reg = {r: sorted({e["seed"] for e in eps if reg(e) == r}) for r in n_reg}
    ds_rows = "\n".join(f"| `{k}` | {v['source']} | {v['task']} | {v['kind']} |" for k, v in DATASET_INFO.items())
    sheet = f"""# Datasheet: QFaultBench-VQC v1

A labelled benchmark of training-time faults in variational quantum classifiers, with
counterfactual repair outcomes. Generated by `research/run_campaign.py` from this repository.

## Composition
- **{len(eps)} episodes** from **{n_base} base runs** (11 datasets x seeds, {len(n_reg)} regimes), 7 conditions per base run:
  `nominal` and six injected faults (`barren_plateau`, `lr_misconfiguration`, `optimizer_instability`,
  `training_divergence`, `persistent_plateau`, `noise_degradation`). Classes are balanced by design.
- `telemetry.csv.gz`: per-step telemetry (gzip-compressed CSV) for every episode: {W_WARM} healthy warm-up steps, up to {T_OBS} fault-observation
  steps, then {K_POST} steps of uncorrected continuation.
- `outcomes.csv`: for each episode, the outcome of all {len(ACTIONS)} actions (`noop`, `rollback_healthy`, six repair arms; the `latent4` regime adds `rollback_clean`)
  applied from the identical decision-time state, then trained for {K_POST} steps.
- `twin.csv`: digital-twin (H = 3) predictions and safety-filter verdicts for each arm.

## Underlying tasks
| key | source | binary task | kind |
|---|---|---|---|
{ds_rows}

Real datasets ship with scikit-learn (UCI originals). Inputs are reduced to 4 features with
train-only StandardScaler + PCA and scaled to [0, pi]; at most 300 samples per task (stratified).
Splits per seed: train 55% / twin 10% / val 15% / test 20%.

## Regimes
- `ideal`: noiseless statevector training ({n_reg.get('ideal', 0)} episodes, seeds {seeds_by_reg.get('ideal', [0])[0]}-{seeds_by_reg.get('ideal', [0])[-1]}); the noise fault is an emulated degradation.
- `latent4`: the fault starts 4 steps before the periodic checkpoint, so the latest checkpoint already
  carries it; outcomes include an extra action, `rollback_clean` (restore the older clean checkpoint) ({n_reg.get('latent4', 0)} episodes).
- `hw_torino`: training under an IBM Torino (Heron) calibration-derived noise baseline - per-layer depolarizing
  p from median gate errors, median readout error, 1,024-shot sampling noise - where the noise fault is a
  calibration-drift event multiplying error rates by 3-5x ({n_reg.get('hw_torino', 0)} episodes, seeds {seeds_by_reg.get('hw_torino', [0])[0]}-{seeds_by_reg.get('hw_torino', [0])[-1]}). See `research/external/README.md`.

## Model and simulator
{N_QUBITS}-qubit VQC, RY angle encoding, {N_LAYERS} layers of RY + CNOT ring, <Z_0> readout, BCE loss,
Adam (lr 0.05), parameter-shift gradients on PennyLane `default.qubit` (statevector).

## Fault model (how labels were produced)
Labels are exact: each fault was injected at step {W_WARM} by `VQCModel.inject_failure` with severity ~ U[0.75, 1.25].
See the docstring of `inject_failure`. Two faults are *emulations* of effects that cannot be reproduced at
4 qubits: barren plateau (gradient SNR collapse, alpha = 1e-6 plus fixed finite-shot gradient noise; half of the
episodes also re-initialise a deep Haar-scrambled ansatz) and hardware noise (per-layer depolarizing
contraction (1-p)^L plus Gaussian shot noise). These are modelling assumptions, not hardware measurements.

## Recommended uses
Fault detection and diagnosis from training telemetry; offline evaluation of repair/selection policies
(contextual bandits, rules) with exact counterfactual regret; studying digital-twin fidelity.
Leave-one-dataset-out (generalisation to unseen tasks) and seed-disjoint (train on the lower half of the seeds, test on the upper half; the analysis uses seeds < 9 vs. >= 9 for `ideal` and `latent4`, < 4 vs. >= 4 for `hw_torino`).
## Recommended splits
Leave-one-dataset-out (generalisation to unseen tasks) and seed-disjoint (seeds 0-19 train, 20-29 test).

## Limitations
Simulation only; small qubit count; one ansatz family; one optimiser at injection time; faults injected singly
and at a fixed onset step; small test sets (20-60 samples) make accuracy coarse, so outcomes use a 3-step mean.

## Licence
MIT, as the repository.
"""
    with open(os.path.join(OUT, "DATASHEET.md"), "w", encoding="utf-8") as f:
        f.write(sheet)

    lines = []
    for fn in sorted(os.listdir(OUT)):
        if fn == "SHA256SUMS":
            continue
        h = hashlib.sha256(open(os.path.join(OUT, fn), "rb").read()).hexdigest()
        lines.append(f"{h}  {fn}")
    with open(os.path.join(OUT, "SHA256SUMS"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    print(f"exported {len(eps)} episodes to {OUT}")
    for fn in sorted(os.listdir(OUT)):
        print(f"  {fn:16s} {os.path.getsize(os.path.join(OUT, fn)) / 1e6:7.2f} MB")


if __name__ == "__main__":
    main()
