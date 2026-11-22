# External data: provenance

Everything in this folder was downloaded from public sources on 2026-11-22 to strengthen the
benchmark. Only small derived files are committed; raw downloads are gitignored and can be
re-fetched with the commands below. Check each source for its licence terms before redistribution.

## 1. QML benchmark suite (Bowles, Ahmed & Schuld, 2024)

J. Bowles, S. Ahmed, M. Schuld, "Better than classical? The subtle art of benchmarking quantum
machine learning models," arXiv:2403.07059 (2024). Distributed through PennyLane's dataset service.

| Committed file | Source dataset | Variant |
|---|---|---|
| `qml_benchmarks/hidden-manifold_d4.csv` | `qml.data.load("other", name="hidden-manifold")` | `train["4"]` + `test["4"]` |
| `qml_benchmarks/two-curves_d4.csv` | `qml.data.load("other", name="two-curves")` | `train["4"]` + `test["4"]` |
| `qml_benchmarks/linearly-separable_d4.csv` | `qml.data.load("other", name="linearly-separable")` | `train["4"]` + `test["4"]` |

Each CSV keeps the original split in `orig_split`; labels are mapped {-1, +1} -> {0, 1}.
The 4-feature variant matches the 4-qubit classifier used throughout. The raw HDF5 downloads
(~189 MB, all dimensions 2-20) live in `pennylane/` (gitignored). Re-fetch with:

```python
import pennylane as qml   # requires: pip install h5py fsspec aiohttp
for n in ["hidden-manifold", "two-curves", "linearly-separable"]:
    qml.data.load("other", name=n, folder_path="research/external/pennylane")
```

## 2. OpenML tabular datasets

| Committed file | OpenML id | Name | Samples x features | Positive class |
|---|---|---|---|---|
| `openml/banknote.csv` | 1462 | banknote-authentication (UCI) | 1372 x 4 | class 2 |
| `openml/pima_diabetes.csv` | 37 | diabetes (Pima Indians) | 768 x 8 | tested_positive |

Re-fetch with `sklearn.datasets.fetch_openml(data_id=...)`.

## 3. IBM Quantum device calibration snapshots

Public calibration snapshots shipped in Qiskit's `qiskit-ibm-runtime` repository
(`qiskit_ibm_runtime/fake_provider/backends/<device>/props_<device>.json`, Apache-2.0 repository licence),
downloaded from `https://raw.githubusercontent.com/Qiskit/qiskit-ibm-runtime/main/...`.

| Device | Processor family | Qubits | 2q gate | Median 2q error | Median readout error | Snapshot date |
|---|---|---|---|---|---|---|
| ibmq_manila | Falcon | 5 | CX | 1.01e-2 | 0.022 | 2024-05-27 |
| ibm_lagos | Falcon | 7 | CX | 1.05e-2 | 0.169 | 2024-05-27 |
| ibmq_kolkata | Falcon | 27 | CX | 7.54e-3 | 0.010 | 2021-12-09 |
| ibm_sherbrooke | Eagle | 127 | ECR | 7.50e-3 | 0.020 | 2025-02-26 |
| ibm_torino | Heron | 133 | CZ | 4.08e-3 | 0.023 | 2025-02-26 |

`calibration_summary.json` (committed) holds medians over qubits/couplers and the derived noise
parameters used by the hardware-calibrated regime: per-layer depolarizing probability
p = 1 - (1 - e1q)^4 (1 - e2q)^4 for one layer of the 4-qubit ansatz (4 single-qubit rotations + 4
two-qubit gates), and the readout contraction 1 - 2r. Sampling noise uses 1,024 shots (sigma = 1/32).
These are snapshot medians, not time-resolved device behaviour.
