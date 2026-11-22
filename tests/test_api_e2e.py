"""
End-to-end API session: the same sequence a visitor drives from the lab.

start -> step -> inject a fault -> step until the pipeline reacts -> twin rehearsal ->
manual repair -> commit / rollback -> telemetry, memory, posteriors -> reset.
Checks every endpoint answers successfully and that responses are JSON-serialisable
after the fault-model and telemetry changes.
"""

import math

import pytest
from fastapi.testclient import TestClient

from backend.api import app, state_mgr


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c


def _finite_numbers(obj):
    """Every float in a JSON payload must be finite (NaN/Inf break JSON clients)."""
    if isinstance(obj, float):
        assert math.isfinite(obj), "non-finite number in API response"
    elif isinstance(obj, dict):
        for v in obj.values():
            _finite_numbers(v)
    elif isinstance(obj, list):
        for v in obj:
            _finite_numbers(v)


def test_full_lab_session(client):
    r = client.get("/api/health")
    assert r.status_code == 200 and r.json()["status"] == "ok"

    # Start with a short step budget, then stop the background loop and drive steps manually.
    r = client.post("/api/experiment/start", json={"dataset": "moons", "seed": 7, "max_steps": 40, "step_delay_ms": 0})
    assert r.status_code == 200
    client.post("/api/experiment/pause")
    state_mgr.is_running = False

    for _ in range(6):
        r = client.post("/api/experiment/step")
        assert r.status_code == 200, r.text
        _finite_numbers(r.json())

    r = client.post("/api/experiment/inject-failure", json={"failure_type": "lr_misconfiguration", "severity": 1.0})
    assert r.status_code == 200, r.text

    states = set()
    for _ in range(8):
        r = client.post("/api/experiment/step")
        assert r.status_code == 200, r.text
        body = r.json()
        states.add(str(body.get("payload", body).get("pipeline_state", body.get("pipeline_state", ""))))

    r = client.post("/api/experiment/simulate-twin", json={"repair_arm": "adjust_learning_rate"})
    assert r.status_code in (200, 409), r.text
    if r.status_code == 200:
        _finite_numbers(r.json())

    r = client.post("/api/experiment/trigger-repair", json={"repair_arm": "perform_warm_restart"})
    assert r.status_code in (200, 409), r.text

    # Commit or rollback may legitimately report that nothing is pending.
    for ep in ("/api/experiment/commit", "/api/experiment/rollback"):
        r = client.post(ep)
        assert r.status_code in (200, 400, 409), r.text

    for ep in ("/api/experiment/status", "/api/telemetry/history", "/api/bandit/posteriors", "/api/memory/episodes"):
        r = client.get(ep)
        assert r.status_code == 200, (ep, r.text)
        _finite_numbers(r.json())

    r = client.post("/api/experiment/reset")
    assert r.status_code == 200, r.text


@pytest.mark.parametrize("fault", ["barren_plateau", "optimizer_instability", "training_divergence", "persistent_plateau", "noise_degradation"])
def test_every_fault_injects_and_steps(client, fault):
    client.post("/api/experiment/reset")
    state_mgr.is_running = False
    for _ in range(3):
        assert client.post("/api/experiment/step").status_code == 200
    r = client.post("/api/experiment/inject-failure", json={"failure_type": fault, "severity": 1.0})
    assert r.status_code == 200, r.text
    for _ in range(4):
        r = client.post("/api/experiment/step")
        assert r.status_code == 200, (fault, r.text)
        _finite_numbers(r.json())
