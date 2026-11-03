# PRODUCTION DEPLOYMENT & ZERO-COST OPERATIONAL RUNBOOK
## Adaptive Self-Healing Framework for Quantum Machine Learning
**Date:** November 2026  
**Operating Cost:** $0.00 / month (Zero AWS services, zero paid third-party dependencies)  
**Public Frontend:** `https://adaptive-self-healing-framework-for.vercel.app/`  
**Public Backend:** `https://qml-backend-nczx.onrender.com/`  
**GitHub Repository:** `https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git`  

---

### 1. Architectural Topology

```
                  +----------------------------------------------+
                  |               Public Client                  |
                  |     Browser / Researcher / Mobile Web        |
                  +----------------------------------------------+
                                         |
                  +----------------------+-----------------------+
                  |                                              |
                  v HTTPS                                        v WSS / HTTPS
+----------------------------------+           +----------------------------------+
|          Vercel Edge             |           |          Render Cloud            |
|       (Next.js 14 Frontend)      |           |     (FastAPI Python Gateway)     |
|                                  |           |                                  |
| • 13 Editorial Landing Sections  |           | • PennyLane 0.45.1 Statevector   |
| • 10 Research Cockpit Views      |           | • MAPE-K Autonomous Orchestrator |
| • Client-side Purity Invariants  |           | • Real-time WebSocket Broadcaster|
| • Zero-cost Hobby Tier ($0.00)   |           | • Free Web Service Tier ($0.00)  |
+----------------------------------+           +----------------------------------+
                                                                 |
                                               +-----------------+----------------+
                                               |                                  |
                                               v Local SQLite                     v External Health
                                    +----------------------+           +----------------------+
                                    | Persistent Episodic  |           |     cron-job.org     |
                                    | Memory & Bandit DB   |           | Keep-Alive Ping (10m)|
                                    +----------------------+           +----------------------+
```

---

### 2. Frontend Deployment Configuration (Vercel)

- **Platform:** Vercel (Hobby Tier)
- **Framework:** Next.js 14 (App Router)
- **Build Command:** `cd frontend && npm run build`
- **Output Directory:** `.next`
- **Output Mode:** `standalone` (declared in `next.config.mjs`)
- **Environment Variables:**
  ```env
  NEXT_PUBLIC_API_URL=https://qml-backend-nczx.onrender.com
  NEXT_PUBLIC_WS_URL=wss://qml-backend-nczx.onrender.com/ws/telemetry
  ```
- **Deployment Trigger:** Automatic on push to `main` branch of GitHub repository.

---

### 3. Backend Deployment Configuration (Render)

- **Platform:** Render (Free Web Service Tier)
- **Runtime:** Python 3.13
- **Root Directory:** Repository root (`.`)
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  ```env
  PYTHONPATH=.
  PORT=10000
  ```
- **Cold Boot & Keep-Alive Strategy:**
  - Render free tier instances enter sleep mode after 15 minutes of inbound HTTP inactivity.
  - An external free cron ping is configured via `cron-job.org` calling `GET https://qml-backend-nczx.onrender.com/api/health` every 10 minutes.
  - In the event of a cold start (approx. 40 seconds wake-up time), the frontend HUD gracefully displays `BACKEND STANDBY / TELEMETRY READY` in warm amber, auto-retrying connections every 3,000 ms without alarming red error toasts.

---

### 4. Zero-Cost ($0.00) Guarantee

- **Compute & Serverless:** 
  - Vercel Hobby Tier: $0.00 / month (100 GB bandwidth, infinite static assets).
  - Render Free Tier: $0.00 / month (750 free instance hours / month, sufficient for 24/7 continuous keep-alive operation).
- **Database & Persistence:**
  - Embedded SQLite database stored locally in `./data/self_healing_qml.db` for episodic failure episodes and Thompson sampling posteriors.
  - Zero AWS RDS, DynamoDB, S3, or ElastiCache instances required.
- **Total Operational Overhead:** **$0.00 / month permanent.**

---

### 5. Verification Runbook

1. **Verify Backend Root & Gateway:**
   ```bash
   # JSON response
   curl -s -H "Accept: application/json" https://qml-backend-nczx.onrender.com/ | jq .
   # HTML response
   curl -s -I -H "Accept: text/html" https://qml-backend-nczx.onrender.com/
   ```
2. **Verify System Health:**
   ```bash
   curl -s https://qml-backend-nczx.onrender.com/api/health | jq .
   ```
3. **Verify Empirical Benchmarks Endpoint:**
   ```bash
   curl -s https://qml-backend-nczx.onrender.com/api/benchmarks/summary | jq .
   ```
4. **Verify WebSocket Telemetry:**
   Connect via `wscat -c wss://qml-backend-nczx.onrender.com/ws/telemetry` and observe JSON payloads broadcasting `state_purity`, `bloch_r`, `step`, and `pipeline_state`.
5. **Verify Live Web Application:**
   Visit `https://adaptive-self-healing-framework-for.vercel.app/` in any modern web browser. Confirm warm travertine minimalism loads by default, 13 sections render smoothly, and launching the Research Cockpit displays all 10 specialized views.
