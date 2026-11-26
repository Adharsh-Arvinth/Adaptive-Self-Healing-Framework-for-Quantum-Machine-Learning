"""Leave-one-dataset-out diagnosis with benchmark alignment and first-alarm alignment."""
import numpy as np
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import f1_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from research.analysis import _features, load_episodes


def compare(regime):
    episodes = load_episodes(regime)
    warm = {(e["dataset"], e["seed"]): e["warm_telemetry"] for e in episodes if e["warm_telemetry"]}
    aligned = np.array([_features(e, warm) for e in episodes])
    shifted = np.zeros_like(aligned)
    alarms = np.zeros(len(episodes), dtype=bool)
    for i, e in enumerate(episodes):
        if e["first_anomaly_step"] is None:
            continue
        start = e["first_anomaly_step"] - 1
        key = (e["dataset"], e["seed"])
        observations = e["obs_telemetry"]
        history = warm[key] + e.get("lag_telemetry", []) + observations[:start]
        shifted[i] = _features(dict(e, obs_telemetry=observations[start:], decision_step=e["decision_step"]-start), {key: history})
        alarms[i] = True
    y = np.array([e["condition"] for e in episodes])
    datasets = np.array([e["dataset"] for e in episodes])
    for label, x, eligible, model in [
        ("logistic", aligned, np.ones(len(y), dtype=bool), make_pipeline(StandardScaler(), LogisticRegression(max_iter=3000))),
        ("first-alarm boosting", shifted, alarms, HistGradientBoostingClassifier(max_iter=300, learning_rate=.08, max_leaf_nodes=15, random_state=0)),
    ]:
        predicted = np.full_like(y, "nominal")
        for dataset in np.unique(datasets):
            train = (datasets != dataset) & eligible
            test = (datasets == dataset) & eligible
            model.fit(x[train], y[train])
            if test.any():
                predicted[test] = model.predict(x[test])
        print(regime, label, f1_score(y, predicted, average="macro"), flush=True)


if __name__ == "__main__":
    for regime in ("ideal", "hw_torino", "latent4", "q8"):
        compare(regime)

