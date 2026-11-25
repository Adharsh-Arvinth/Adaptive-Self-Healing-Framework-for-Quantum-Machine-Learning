# Running the noise-model check on a real IBM quantum processor

What it does: runs 8 already-trained 4-qubit classifiers (plus 4 deeper variants) on a real IBM processor and
compares the measured outputs with the noise model used in the paper's hardware-calibrated regime. No training
happens on hardware. Code: `research/hardware_check.py`. The plan (circuits, inputs, ideal outputs) is already in
`research/results/hardware/plan.json`.

Budget: 647 circuit executions x 1,024 shots, about 3-4 minutes of processor time, which fits IBM's free (Open)
plan allowance (about 10 minutes per month at the time of writing; check the current terms). One job is submitted.

## 1. Create an account and save your key (you do this; the scripts never ask for or store your key)

1. Sign up at https://quantum.cloud.ibm.com and choose the free Open plan.
2. Create an API key in the dashboard.
3. In your own terminal, save it once (replace the placeholder; do not paste it into any file in this repository):

```powershell
python -c "from qiskit_ibm_runtime import QiskitRuntimeService; QiskitRuntimeService.save_account(channel='ibm_quantum_platform', token='PASTE_YOUR_API_KEY', set_as_default=True)"
```

The key is stored in your user profile (`~/.qiskit/qiskit-ibm.json`), outside the repository.

## 2. Submit (from the repository root)

```powershell
python -m research.hardware_check submit
```

This picks the least busy processor available to you (or pass `--backend ibm_torino`, for example), transpiles the
circuits, prints the two-qubit gate counts, submits one job and records its id in `research/results/hardware/job.json`.

## 3. Collect when the job has run (queue time on the free plan: minutes to a day or more)

```powershell
python -m research.hardware_check collect
```

Run it again later if the job is still queued. When it reports DONE, the counts are saved.

## 4. Analyse and regenerate the report

```powershell
python -m research.hardware_check analyze
```

```powershell
python -m research.report
```

`research/RESULTS.md` then gets the real-QPU table next to the device-simulation dry run. The dry run can be
repeated at any time without an account: `python -m research.hardware_check submit --fake` then
`python -m research.hardware_check analyze --fake`.

Packages: `pip install -r research/requirements-hardware.txt`.
