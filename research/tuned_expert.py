"""Fit six thresholds on expert probability scores using training datasets only."""
import numpy as np
from sklearn.metrics import f1_score


def scores_for_episodes(episodes, faults):
    groups = np.array([e["dataset"] for e in episodes])
    y = np.array([e["condition"] for e in episodes])
    scores = np.array([[e["diagnosis"]["probs"].get(f, 0) for f in faults] for e in episodes])
    out = np.full_like(y, "nominal")
    for dataset in np.unique(groups):
        test = groups == dataset
        thresholds = []
        for j, fault in enumerate(faults):
            candidates = np.unique(scores[~test, j])
            target = y[~test] == fault
            values = scores[~test, j]
            def quality(t):
                positive = values >= t
                return 2*(positive & target).sum() / (positive.sum()+target.sum())
            thresholds.append(max(candidates, key=quality))
        margins = scores[test] - thresholds
        out[test] = np.where(margins.max(axis=1) >= 0, np.array(faults)[margins.argmax(axis=1)], "nominal")
    return f1_score(y, out, average="macro"), f1_score(y, out, labels=faults, average="macro")


if __name__ == "__main__":
    from research.analysis import FAULTS, load_episodes

    for regime in ("ideal", "hw_torino", "latent4"):
        print(regime, *scores_for_episodes(load_episodes(regime), FAULTS))
