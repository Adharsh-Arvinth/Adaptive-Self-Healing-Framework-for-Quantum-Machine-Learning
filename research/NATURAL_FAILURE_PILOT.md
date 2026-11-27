# No-injection pilot

QFaultBench measures responses to controlled fault injections. This pilot asks whether
the existing detector and recovery pipeline help when training runs from initialization
with the original configuration and no injected faults.

## Design

Each of four datasets (Iris, Breast Cancer Wisconsin, Wine and Digits) ran under four
optimizer, learning-rate and depth combinations with three seeds (48 matched pairs).
Each pair used the same initial model and split in both arms. One arm optimized normally
and ran a read-only copy of the detector. The other used the full self-healing pipeline,
with fresh memory and bandit state for each pair. Both arms ran for 40 outer training
steps in the existing vectorized VQC simulator. Twin candidate evaluations add compute
in the self-healing arm. The test split was used only at the endpoint.

The offline reference labels the first nonfinite validation loss, three consecutive losses
at least 0.15 above the earlier best from step 8 onward, or ten consecutive losses
within 0.02 of the majority-prior cross-entropy or worse from step 20 onward.
The majority-prior cross-entropy uses a constant prediction equal to the training label
prevalence, evaluated on validation. These are operational outcome labels based on
untreated validation loss. They use no alarm, diagnosis or intervention data. They share
the validation stream with the detector and do not independently establish a root cause.

A confirmed shadow alarm within five steps either side of the first reference breach
counts as timely. A reference-negative run is a false-alarm run if it has any confirmed
shadow alarm. Recovery requires a finite test loss and final validation loss at or below
the applicable target. Targets are the prior cross-entropy for nonfinite loss, the earlier
best plus 0.05 for regression, and the prior cross-entropy minus 0.05 for near-chance loss.

## Results

| Measure | Observed |
| --- | ---: |
| No-injection matched pairs | 48 |
| Reference-positive control runs | 2 |
| Timely shadow detections | 2/2 |
| Missed failures within the alarm window | 0/2 |
| Reference-negative runs with a confirmed shadow alarm | 19/46 (41.3%) |
| Matched reference-negative pairs with an active repair deployment | 22/46 |
| Reference-positive pairs recovered by step 40, ordinary training | 1/2 |
| Reference-positive pairs recovered by step 40, self-healing | 0/2 |
| Mean held-out accuracy across all pairs, ordinary training | 84.43% |
| Mean held-out accuracy across all pairs, self-healing | 83.33% |

Both positive cases were near-chance loss on the same Iris split and seed with different
Adam configurations. On the case where ordinary training recovered, held-out accuracy
was 75% with ordinary training and 50% with self-healing. Both active runs deployed
repairs before the untreated reference breach. Shadow detection timing therefore
describes the detector on the untreated trajectory. Active deployment measurements
describe the treatment policy on its own trajectory.

The pilot offers no observed recovery advantage and shows frequent alarms on runs that
did not trigger the reference rule. Two correlated positive cases are insufficient to
estimate sensitivity or recovery benefit reliably. A confirmatory study needs frozen
criteria, new datasets and seeds, longer trajectories, and enough independently
adjudicated events for uncertainty estimates. A physical-device arm is needed for
claims about naturally occurring failures during QPU training.

Reproduce with
`py -m research.natural_failures --output research/results/natural_failures_pilot.json`.
The JSON records each pair's validation traces, alarm times, deployment events and endpoints.
