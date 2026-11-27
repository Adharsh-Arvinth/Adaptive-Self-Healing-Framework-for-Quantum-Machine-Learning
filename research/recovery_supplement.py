"""Recompute policy comparisons from released episodes; write the supplement as CSV."""
import argparse
import csv
from collections import defaultdict
from pathlib import Path

import numpy as np
from research.analysis import load_episodes, section_c, replay
from research.replay import default_policies

OUTPUT = Path(__file__).parent / "results"
REGIMES = ("ideal", "hw_torino", "q8")


def main():
    with (OUTPUT / "recovery_by_task.csv").open("w", newline="") as per_task, (OUTPUT / "recovery_excluding_near_chance.csv").open("w", newline="") as filtered:
        tasks, comparisons = csv.writer(per_task), csv.writer(filtered)
        tasks.writerow(["regime", "task", "policy", "recovery_pct"])
        comparisons.writerow(["regime", "policy", "recovery_pct", "ci_low", "ci_high", "harmful_pct"])
        specs = default_policies()
        for regime in REGIMES:
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


def write_markdown(destination):
    tasks, policies = defaultdict(dict), defaultdict(dict)
    with (OUTPUT / "recovery_by_task.csv").open(newline="", encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            tasks[row["regime"], row["task"]][row["policy"]] = row["recovery_pct"]
    with (OUTPUT / "recovery_excluding_near_chance.csv").open(newline="", encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            policies[row["policy"]][row["regime"]] = row
    if {regime for regime, _ in tasks} != set(REGIMES) or not policies:
        raise ValueError("Supplement CSVs are incomplete. Run the replay before rendering Markdown.")

    lines = [
        "# Recovery robustness",
        "",
        "Recovery percentages use faulty episodes only and the released finite-state, one-sided criterion. Learning policies use 30 replay orders.",
        "",
        "## Table S1. Recovery by task",
        "",
        "| Regime | Task | Restore | Thompson sampling | No repair |",
        "|---|---|---:|---:|---:|",
    ]
    for (regime, task), row in tasks.items():
        lines.append(f'| {regime} | {task} | {row["Restore last healthy checkpoint"]} | '
                     f'{row["Thompson Sampling (proposed)"]} | {row["No repair (continue)"]} |')
    lines += [
        "",
        "## Table S2. Repair policies excluding hidden manifold and two curves",
        "",
        "Learned diagnosis is refitted on the retained tasks. Percentages use the same policy implementations, replay seeds and base-run bootstrap as the main table.",
        "",
        "| Policy | Ideal (95% CI) | Harmful (ideal) | Hardware-calibrated | Eight qubits |",
        "|---|---:|---:|---:|---:|",
    ]
    for policy, regimes in policies.items():
        ideal, hardware, eight_qubits = (regimes[regime] for regime in REGIMES)
        lines.append(f'| {policy} | {ideal["recovery_pct"]} ({ideal["ci_low"]}–{ideal["ci_high"]}) | '
                     f'{ideal["harmful_pct"]} | {hardware["recovery_pct"]} | {eight_qubits["recovery_pct"]} |')
    destination.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Table S1: {len(tasks)} rows. Table S2: {len(policies)} rows. Wrote {destination}.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--markdown", type=Path, help="Render the existing CSVs to this Markdown file without replay.")
    args = parser.parse_args()
    if args.markdown:
        write_markdown(args.markdown)
    else:
        main()
