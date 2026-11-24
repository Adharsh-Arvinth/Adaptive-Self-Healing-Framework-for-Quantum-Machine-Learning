"""
Parallel, resumable counterfactual campaign runner.

    python -m research.run_campaign --seeds 0-29 --workers 14
    python -m research.run_campaign --n-qubits 8 --seeds 0-9 --datasets breast_cancer,... --workers 14   # q8 regime

Each (dataset, seed) base run is written to research/data/raw/<dataset>_s<seed>.json.gz, so an
interrupted campaign resumes where it stopped. BLAS threads are pinned to 1 per worker.
"""

import argparse
import gzip
import json
import os
import sys
import time
from multiprocessing import Pool

for _v in ("OMP_NUM_THREADS", "MKL_NUM_THREADS", "OPENBLAS_NUM_THREADS"):
    os.environ.setdefault(_v, "1")

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, ROOT)
RAW_DIR = os.path.join(ROOT, "research", "data", "raw")


def _path(ds: str, seed: int, hw: str = "", lag: int = 0, nq: int = 4) -> str:
    suffix = (f"_hw-{hw}" if hw else "") + (f"_latent{lag}" if lag else "") + (f"_q{nq}" if nq != 4 else "")
    return os.path.join(RAW_DIR, f"{ds}_s{seed}{suffix}.json.gz")


def _task(args):
    ds, seed, hw, lag, nq = args
    out = _path(ds, seed, hw, lag, nq)
    if os.path.exists(out):
        return ds, seed, "cached", 0.0
    import warnings
    warnings.filterwarnings("ignore")
    from research.episodes import run_base, dumps
    t = time.time()
    try:
        recs = run_base(ds, seed, hw_device=hw or None, latent_lag=lag, n_qubits=nq)
    except Exception as e:  # keep the campaign going; record the failure
        return ds, seed, f"ERROR {type(e).__name__}: {e}", time.time() - t
    tmp = out + ".tmp"
    with gzip.open(tmp, "wt", encoding="utf-8") as f:
        for r in recs:
            f.write(dumps(r) + "\n")
    os.replace(tmp, out)
    return ds, seed, "ok", time.time() - t


def parse_seeds(spec: str):
    seeds = []
    for part in spec.split(","):
        if "-" in part:
            a, b = part.split("-")
            seeds.extend(range(int(a), int(b) + 1))
        else:
            seeds.append(int(part))
    return seeds


def main():
    from research.datasets import DATASETS
    ap = argparse.ArgumentParser()
    ap.add_argument("--seeds", default="0-29")
    ap.add_argument("--datasets", default=",".join(DATASETS))
    ap.add_argument("--workers", type=int, default=max(1, (os.cpu_count() or 2) - 2))
    ap.add_argument("--hw-device", default="", help="IBM calibration snapshot (e.g. torino) for the hardware-calibrated regime")
    ap.add_argument("--latent-lag", type=int, default=0, help="fault starts this many steps before the periodic checkpoint")
    ap.add_argument("--n-qubits", type=int, default=4, help="classifier width; 8 gives the q8 regime (PCA to 8 features)")
    a = ap.parse_args()
    os.makedirs(RAW_DIR, exist_ok=True)
    tasks = [(ds, s, a.hw_device, a.latent_lag, a.n_qubits) for s in parse_seeds(a.seeds) for ds in a.datasets.split(",")]
    print(f"{len(tasks)} base runs on {a.workers} workers", flush=True)
    t0 = time.time()
    done = 0
    with Pool(a.workers) as pool:
        for ds, seed, status, dt in pool.imap_unordered(_task, tasks):
            done += 1
            print(f"[{done}/{len(tasks)}] {ds} s{seed}: {status} ({dt:.0f}s) elapsed {time.time()-t0:.0f}s", flush=True)
    print("campaign complete", flush=True)


if __name__ == "__main__":
    main()
