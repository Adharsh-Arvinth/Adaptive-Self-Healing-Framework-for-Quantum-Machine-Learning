"""
Per-visitor lab sessions: each browser (X-Lab-Session header / ?session= on the WebSocket) gets its own
pipeline, so one visitor's start, step, reset or injected fault never touches another visitor's run.
"""

import pytest
from fastapi.testclient import TestClient

import backend.api as api
from backend.api import app, sessions, state_mgr

A = {"X-Lab-Session": "visitor-aaaaaaaa"}
B = {"X-Lab-Session": "visitor-bbbbbbbb"}


@pytest.fixture()
def client():
    with TestClient(app) as c:
        yield c
    for sid in list(sessions.sessions):
        if sid != "default":
            sessions.drop(sid)


def _status(client, headers=None):
    r = client.get("/api/experiment/status", headers=headers or {})
    assert r.status_code == 200, r.text
    return r.json()


def test_two_visitors_are_isolated(client):
    client.post("/api/experiment/reset", headers=A)
    client.post("/api/experiment/reset", headers=B)
    for _ in range(3):
        assert client.post("/api/experiment/step", headers=A).status_code == 200
    assert _status(client, A)["step_count"] == 3
    assert _status(client, B)["step_count"] == 0  # B untouched by A's steps

    # A fault injected by B does not reach A's model
    r = client.post("/api/experiment/inject-failure", headers=B, json={"failure_type": "lr_misconfiguration", "severity": 1.0})
    assert r.status_code == 200
    assert sessions.get(A["X-Lab-Session"]).model.active_injections == []
    assert "lr_misconfiguration" in sessions.get(B["X-Lab-Session"]).model.active_injections

    # B's reset does not reset A
    client.post("/api/experiment/reset", headers=B)
    assert _status(client, A)["step_count"] == 3

    # Telemetry history is per visitor
    assert client.get("/api/telemetry/history", headers=A).json()["count"] == 3
    assert client.get("/api/telemetry/history", headers=B).json()["count"] == 0


def test_missing_or_invalid_id_uses_default_session(client):
    s1 = sessions.get(None)
    s2 = sessions.get("../../etc/passwd")  # rejected by the id pattern
    s3 = sessions.get("short")              # too short
    assert s1 is s2 is s3 is state_mgr


def test_session_cap_evicts_idle_least_recent(client, monkeypatch):
    monkeypatch.setattr(api, "MAX_SESSIONS", 2)
    a = sessions.get("cap-test-0001")
    b = sessions.get("cap-test-0002")
    c = sessions.get("cap-test-0003")  # forces eviction of the least recently used idle session
    assert len([k for k in sessions.sessions if k != "default"]) == 2
    assert "cap-test-0001" not in sessions.sessions
    assert sessions.sessions["cap-test-0003"] is c and sessions.sessions["cap-test-0002"] is b
    assert a is not sessions.get("cap-test-0001")  # comes back as a fresh session


def test_idle_sessions_expire(client, monkeypatch):
    sess = sessions.get("expire-test-01")
    monkeypatch.setattr(api, "IDLE_TTL_S", 0.0)
    sess.last_used -= 10
    assert sessions.expire_idle() >= 1
    assert "expire-test-01" not in sessions.sessions
    assert "default" in sessions.sessions  # the default session never expires


def test_running_cap_returns_429(client, monkeypatch):
    monkeypatch.setattr(api, "MAX_RUNNING", 0)
    r = client.post("/api/experiment/start", headers=A, json={"max_steps": 5, "step_delay_ms": 0})
    assert r.status_code == 429
    assert "busy" in r.json()["detail"].lower()


def test_websocket_joins_own_session(client):
    client.post("/api/experiment/reset", headers=A)
    client.post("/api/experiment/step", headers=A)
    with client.websocket_connect("/ws/telemetry?session=visitor-aaaaaaaa") as ws:
        hello = ws.receive_json()
        assert hello["type"] == "connection_established"
        assert hello["payload"]["step_count"] == 1
    with client.websocket_connect("/ws/telemetry?session=visitor-bbbbbbbb") as ws:
        assert ws.receive_json()["payload"]["step_count"] == 0
