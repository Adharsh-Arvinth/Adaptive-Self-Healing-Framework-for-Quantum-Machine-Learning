"""Recompute policy comparisons from released episodes; write the supplement as CSV."""
import csv
from pathlib import Path

import numpy as np
from research.analysis import load_episodes, section_c, replay
from research.replay import default_policies


def main():
    output = Path(__file__).parent / "results"
    with (output / "recovery_by_task.csv").open("w", newline="") as per_task, (output / "recovery_excluding_near_chance.csv").open("w", newline="") as filtered:
        tasks, comparisons = csv.writer(per_task), csv.writer(filtered)
        tasks.writerow(["regime", "task", "policy", "recovery_pct"])
        comparisons.writerow(["regime", "policy", "recovery_pct", "ci_low", "ci_high", "harmful_pct"])
        specs = default_policies()
        for regime in ("ideal", "hw_torino", "q8"):
            eps = load_episodes(regime)
            _, records, _ = replay(eps, [s for s in specs if s.name in {"No repair (continue)", "Restore last healthy checkpoint", "Thompson Sampling (proposed)"}])
            for dataset in sorted({e["dataset"] for e in eps}):
                mask = [e["dataset"] == dataset and e["condition"] != "nominal" for e in eps]
                for policy, metrics in records.items():
                    tasks.writerow([regime, dataset, policy, round(100*np.mean(metrics["recovered"][mask]), 1)])
            kept = [e for e in eps if e["dataset"] not in {"hidden_manifold", "two_curves"}]
            section_c(kept)
            rows, _, _ = replay(kept, specs)
            for policy, row in rows.items():
                comparisons.writerow([regime, policy, *[round(100*x, 1) for x in (row["recovered"], *row["recovered_ci"], row["harmful"])]])
            per_task.flush()
            filtered.flush()
            print(regime, "completed", flush=True)


if __name__ == "__main__":
    main()
