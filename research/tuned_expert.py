"""Fit six thresholds on expert probability scores using training datasets only."""
import numpy as np
from sklearn.metrics import f1_score
from research.analysis import load_episodes, FAULTS


def evaluate(regime):
    episodes = load_episodes(regime)
    groups = np.array([e["dataset"] for e in episodes])
    y = np.array([e["condition"] for e in episodes])
    scores = np.array([[e["diagnosis"]["probs"].get(f, 0) for f in FAULTS] for e in episodes])
    out = np.full_like(y, "nominal")
    for dataset in np.unique(groups):
        test = groups == dataset
        thresholds = []
        for j, fault in enumerate(FAULTS):
            candidates = np.unique(scores[~test, j])
            target = y[~test] == fault
            values = scores[~test, j]
            def quality(t):
                positive = values >= t
                return 2*(positive & target).sum() / (positive.sum()+target.sum())
            thresholds.append(max(candidates, key=quality))
        margins = scores[test] - thresholds
        out[test] = np.where(margins.max(axis=1) >= 0, np.array(FAULTS)[margins.argmax(axis=1)], "nominal")
    print(regime, f1_score(y, out, average="macro"), f1_score(y, out, labels=FAULTS, average="macro"))


if __name__ == "__main__":
    for regime in ("ideal", "hw_torino", "latent4"):
        evaluate(regime)
