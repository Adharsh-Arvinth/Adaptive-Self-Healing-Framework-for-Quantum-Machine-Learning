"""Paired no-injection simulator pilot. Run with python -m research.natural_failures."""
import argparse
from copy import deepcopy
import gc
import json
from math import isfinite, log
from pathlib import Path
from tempfile import TemporaryDirectory

from backend.detection import AnomalyStatus, FailureDetector
from backend.monitoring import HealthMonitor
from backend.pipeline import SelfHealingPipeline
from backend.qml_model import CircuitConfig, VQCModel
from research import fast_sim
from research.datasets import load_splits

DATASETS = ("iris", "breast_cancer", "wine", "digits")
CONFIGS = (
    ("adam", 0.05, 2),
    ("adam", 0.10, 3),
    ("rmsprop", 0.03, 2),
    ("sgd", 0.05, 2),
)
STEPS = 40
ALARM_WINDOW = 5


def reference_failure(losses, chance_loss):
    """First observable outcome breach, scored offline on untreated validation loss."""
    for index, loss in enumerate(losses):
        if loss is None:
            return {"step": index + 1, "kind": "nonfinite_loss", "target": chance_loss}
        if index >= 7:
            best = min(losses[:index - 2])
            if min(losses[index - 2:index + 1]) >= best + 0.15:
                return {"step": index + 1, "kind": "sustained_regression", "target": best + 0.05}
        if index >= 19 and min(losses[index - 9:index + 1]) >= chance_loss - 0.02:
            return {"step": index + 1, "kind": "near_chance_loss", "target": chance_loss - 0.05}
    return None


def finite(value):
    return float(value) if isfinite(value) else None


def run_pair(dataset, seed, optimizer, lr, layers, directory):
    sp = load_splits(dataset, seed)
    config = CircuitConfig(seed=seed, optimizer_name=optimizer, learning_rate=lr, n_layers=layers)
    control = VQCModel(deepcopy(config))
    pipeline = SelfHealingPipeline(
        VQCModel(deepcopy(config)), seed=seed,
        memory_db_path=str(directory / "memory.db"),
        bandit_storage_path=str(directory / "bandit.json"),
    )
    detector = FailureDetector()
    monitor = HealthMonitor(window_size=10)
    inputs = (sp.X_train, sp.y_train, sp.X_val, sp.y_val)
    losses, treated_losses, alarms, active_alarms, events = [], [], [], [], []
    for step in range(1, STEPS + 1):
        metrics = control.train_step(*inputs)
        losses.append(finite(metrics.val_loss))
        observation = monitor.record_step(metrics)
        anomalies = detector.evaluate(monitor.get_summary(), observation)
        if any(a.status == AnomalyStatus.CONFIRMED for a in anomalies):
            alarms.append(step)
        result = pipeline.step(*inputs, sp.X_twin, sp.y_twin)
        if any(a.status == AnomalyStatus.CONFIRMED for a in result.anomalies):
            active_alarms.append(step)
        treated_losses.append(finite(result.metrics.val_loss))
        events.extend({"step": step, "state": e.state.value} for e in result.events)

    positive_rate = float(sp.y_train.mean())
    chance_loss = -float((sp.y_val * log(positive_rate) + (1 - sp.y_val) * log(1 - positive_rate)).mean())
    failure = reference_failure(losses, chance_loss)
    timely = []
    if failure:
        onset = failure["step"]
        timely = [step for step in alarms if abs(step - onset) <= ALARM_WINDOW]

    def endpoint(model):
        val_loss, _ = model.compute_loss_and_accuracy(sp.X_val, sp.y_val)
        test_loss, test_acc = model.compute_loss_and_accuracy(sp.X_test, sp.y_test)
        return {
            "test_loss": finite(test_loss), "test_accuracy": finite(test_acc) if isfinite(test_loss) else None,
            "val_loss": finite(val_loss), "recovered": (
                bool(isfinite(test_loss) and isfinite(val_loss) and val_loss <= failure["target"])
                if failure else None
            ),
        }

    return {
        "dataset": dataset, "seed": seed, "optimizer": optimizer, "lr": lr, "layers": layers,
        "failure": failure, "confirmed_shadow_alarms": alarms, "timely_shadow_alarms": timely,
        "confirmed_active_alarms": active_alarms, "pipeline_events": events,
        "control_validation_trace": losses, "pipeline_validation_trace": treated_losses,
        "control": endpoint(control), "pipeline": endpoint(pipeline.model),
    }


def summarize(pairs):
    failed = [pair for pair in pairs if pair["failure"]]
    negative = [pair for pair in pairs if not pair["failure"]]
    return {
        "pairs": len(pairs),
        "reference_failures": len(failed),
        "timely_detections": sum(bool(p["timely_shadow_alarms"]) for p in failed),
        "missed_failures": sum(not p["timely_shadow_alarms"] for p in failed),
        "reference_negative_runs": len(negative),
        "false_alarm_runs": sum(bool(p["confirmed_shadow_alarms"]) for p in negative),
        "control_recovered": sum(p["control"]["recovered"] for p in failed),
        "pipeline_recovered": sum(p["pipeline"]["recovered"] for p in failed),
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--seeds", type=int, nargs="+", default=[0, 1, 2])
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    fast_sim.install()
    pairs = []
    try:
        for dataset in DATASETS:
            for config in CONFIGS:
                for seed in args.seeds:
                    with TemporaryDirectory() as temp:
                        pairs.append(run_pair(dataset, seed, *config, Path(temp)))
                        gc.collect()
                    print(dataset, config, seed, flush=True)
    finally:
        fast_sim.uninstall()
    report = {"steps": STEPS, "alarm_window": ALARM_WINDOW, "summary": summarize(pairs), "pairs": pairs}
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + "\n", encoding="utf-8")
    print(report["summary"])


if __name__ == "__main__":
    main()
