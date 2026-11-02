"""
FastAPI REST and WebSocket Endpoint Test Suite.
Part of the Adaptive Self-Healing Framework for Quantum Machine Learning (Stage 7).
"""

import json
import pytest
from fastapi.testclient import TestClient

from backend.api import app, state_mgr


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "PennyLane" in data["framework"]


def test_experiment_status_and_step(client):
    # Step synchronously
    step_res = client.post("/api/experiment/step")
    assert step_res.status_code == 200
    data = step_res.json()
    assert "step" in data
    assert "loss" in data
    assert "bloch" in data
    assert "x" in data["bloch"]
    assert "y" in data["bloch"]
    assert "z" in data["bloch"]

    # Check status
    status_res = client.get("/api/experiment/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["step_count"] >= 1
    assert "config" in status_data


def test_inject_failure_endpoint(client):
    # Valid injection
    res = client.post("/api/experiment/inject-failure", json={"failure_type": "lr_misconfiguration", "severity": 1.5})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "INJECTED"
    assert "report" in data

    # Invalid injection should 400
    bad_res = client.post("/api/experiment/inject-failure", json={"failure_type": "invalid_failure", "severity": 1.0})
    assert bad_res.status_code == 400


def test_telemetry_history_and_posteriors(client):
    hist_res = client.get("/api/telemetry/history")
    assert hist_res.status_code == 200
    assert "history" in hist_res.json()

    post_res = client.get("/api/bandit/posteriors")
    assert post_res.status_code == 200
    post_data = post_res.json()
    assert "adjust_learning_rate" in post_data
    assert "mu" in post_data["adjust_learning_rate"]


def test_memory_episodes_endpoint(client):
    mem_res = client.get("/api/memory/episodes")
    assert mem_res.status_code == 200
    data = mem_res.json()
    assert "total_count" in data
    assert isinstance(data["episodes"], list)


def test_websocket_telemetry(client):
    with client.websocket_connect("/ws/telemetry") as websocket:
        # Initial connection message
        data = websocket.receive_json()
        assert data["type"] == "connection_established"
        assert "payload" in data

        # Send step command through WebSocket
        websocket.send_json({"action": "step"})
        msg = websocket.receive_json()
        assert msg["type"] == "step_telemetry"
        assert "loss" in msg["payload"]
        assert "bloch" in msg["payload"]
