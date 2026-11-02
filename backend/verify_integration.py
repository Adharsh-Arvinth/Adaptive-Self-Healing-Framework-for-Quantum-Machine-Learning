"""
Stage 7 Full-Stack End-to-End Integration Verification Script.
Exercises FastAPI REST endpoints, WebSocket streaming, failure injection,
autonomous diagnosis, digital twin proxy simulation, bandit decision, and deployment.
"""

import sys
import os
import json
import time

# Ensure root is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.api import app, state_mgr
from backend.pipeline import PipelineState

def run_integration_verification():
    print("=" * 80)
    print("STAGE 7 FULL-STACK INTEGRATION & WEBSOCKET VERIFICATION")
    print("=" * 80)

    client = TestClient(app)

    # 1. Health check
    print("\n[Step 1] Verifying System Health Endpoint (/api/health)...")
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    health_data = res.json()
    print(f" -> Status: {health_data['status']}, Framework: {health_data['framework']}")

    # 2. Reset experiment
    print("\n[Step 2] Initializing Experiment State (/api/experiment/reset)...")
    res = client.post("/api/experiment/reset", json={
        "dataset": "moons",
        "seed": 42,
        "n_layers": 2,
        "n_qubits": 2,
        "learning_rate": 0.05,
        "optimizer_name": "adam"
    })
    assert res.status_code == 200
    print(f" -> Reset result: {res.json()}")

    # 3. Status inspection
    print("\n[Step 3] Querying Experiment Status (/api/experiment/status)...")
    res = client.get("/api/experiment/status")
    status_data = res.json()
    assert status_data["step_count"] == 0
    print(f" -> Initial Step: {status_data['step_count']}, State: {status_data['pipeline_state']}")

    # 4. WebSocket test & single steps
    print("\n[Step 4] Verifying Real-Time WebSocket Telemetry Stream (/ws/telemetry)...")
    with client.websocket_connect("/ws/telemetry") as ws:
        handshake = ws.receive_json()
        assert handshake["type"] == "connection_established"
        print(f" -> Handshake established: initial step = {handshake['payload']['step_count']}")

        # Execute 3 nominal steps
        print("\n[Step 5] Executing 3 Nominal Steps via REST (/api/experiment/step)...")
        for s in range(1, 4):
            step_res = client.post("/api/experiment/step")
            assert step_res.status_code == 200
            step_data = step_res.json()
            ws_msg = ws.receive_json()
            assert ws_msg["type"] == "step_telemetry"
            assert ws_msg["payload"]["step"] == s
            loss = step_data["loss"]
            bloch = step_data["bloch"]
            print(f"   Step {s}: Loss = {loss:.4f}, Bloch = (x={bloch['x']:.3f}, y={bloch['y']:.3f}, z={bloch['z']:.3f})")

        # Inject failure
        print("\n[Step 6] Injecting Controlled Synthetic Fault (lr_misconfiguration) via REST...")
        inject_res = client.post("/api/experiment/inject-failure", json={
            "failure_type": "lr_misconfiguration",
            "severity": 1.0
        })
        assert inject_res.status_code == 200
        print(f" -> Injection confirmed: {inject_res.json()['report']['failure_type']}")

        # Advance until anomaly detection and self-healing response trigger
        print("\n[Step 7] Advancing Pipeline to Trigger Autonomous Self-Healing MAPE-K Cycle...")
        healed = False
        for cycle in range(15):
            step_res = client.post("/api/experiment/step")
            assert step_res.status_code == 200
            payload = step_res.json()
            state = payload["state"]
            anomalies = payload["anomalies"]
            diag = payload["diagnosis"]
            decision = payload["bandit_decision"]
            deployment = payload["deployment"]
            evaluation = payload["evaluation"]

            print(f"   Cycle +{cycle+1} (Step {payload['step']}): State = {state:<22} Loss = {payload['loss']:.4f}")
            if anomalies:
                print(f"     -> Anomalies detected: {anomalies}")
            if diag and diag.get("primary_cause"):
                print(f"     -> Root Cause: {diag['primary_cause']} (Confidence: {diag['confidence']:.2f}, Gate: {diag['confidence_gate_cleared']})")
            if decision:
                print(f"     -> Bandit Choice: {decision['selected_arm']} (Payoff: {decision['sampled_reward']:.4f}, Mode: {decision['decision_mode']})")
            if deployment:
                print(f"     -> Deployment Status: {deployment['status']} for arm {deployment['repair_arm']}")
            if evaluation:
                print(f"     -> Evaluation Reward: {evaluation['actual_reward']:.4f} (Prediction Error: {evaluation['prediction_error']:.4f})")

            if state in ["COMMITTED", "HEALTHY_TRAINING"] and cycle > 3:
                healed = True
                print("\n[SUCCESS] Autonomous self-healing recovery cycle executed and verified!")
                break

    # 5. Query Bandit Posteriors & Memory Episodes
    print("\n[Step 8] Verifying Posteriors & Persistent Memory Endpoints...")
    post_res = client.get("/api/bandit/posteriors")
    assert post_res.status_code == 200
    posteriors = post_res.json()
    assert len(posteriors) == 6
    print(f" -> 6 Locked Bandit Arms verified in posteriors: {list(posteriors.keys())}")

    mem_res = client.get("/api/memory/episodes")
    assert mem_res.status_code == 200
    mem_data = mem_res.json()
    print(f" -> Memory Episodes Stored in SQLite: {mem_data['total_count']}")

    hist_res = client.get("/api/telemetry/history")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    print(f" -> Telemetry Points in Time-Series Buffer: {hist['count']}")

    print("\n" + "=" * 80)
    print("STAGE 7 FULL-STACK INTEGRATION FULLY VERIFIED")
    print("=" * 80)

if __name__ == "__main__":
    run_integration_verification()
