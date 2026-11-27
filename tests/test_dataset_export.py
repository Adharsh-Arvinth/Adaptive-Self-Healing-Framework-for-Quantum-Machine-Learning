import csv
import gzip
import hashlib
from collections import Counter

from research import export_dataset


def test_export_preserves_fault_onset_and_pre_checkpoint_telemetry(tmp_path, monkeypatch):
    monkeypatch.setattr(export_dataset, "OUT", str(tmp_path))
    export_dataset.main()

    with (tmp_path / "episodes.csv").open(newline="", encoding="utf-8") as stream:
        episodes = {row["episode_id"]: row for row in csv.DictReader(stream)}
    assert len(episodes) == 3850
    for episode in episodes.values():
        assert episode["checkpoint_step"] == "15"
        if episode["label"] == "nominal":
            assert episode["onset_step"] == ""
        elif episode["regime"] == "latent4":
            assert episode["onset_step"] == "11"
        else:
            assert episode["onset_step"] == "15"

    pre_checkpoint = Counter()
    with gzip.open(tmp_path / "telemetry.csv.gz", "rt", newline="", encoding="utf-8") as stream:
        for row in csv.DictReader(stream):
            if row["phase"] == "pre_checkpoint":
                episode_id = row["episode_id"]
                assert episodes[episode_id]["regime"] == "latent4"
                assert row["label"] == episodes[episode_id]["label"]
                pre_checkpoint[episode_id, int(row["step"])] += 1
    assert pre_checkpoint == {
        (episode_id, step): 1
        for episode_id, episode in episodes.items()
        if episode["regime"] == "latent4"
        for step in range(12, 16)
    }

    for line in (tmp_path / "SHA256SUMS").read_text(encoding="utf-8").splitlines():
        digest, filename = line.split("  ", 1)
        assert hashlib.sha256((tmp_path / filename).read_bytes()).hexdigest() == digest
