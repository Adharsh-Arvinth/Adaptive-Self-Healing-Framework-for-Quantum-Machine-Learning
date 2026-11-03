# Online Deployment Guide: Adaptive Self-Healing Framework for QML

This guide provides step-by-step instructions for deploying the **Adaptive Self-Healing Framework for Quantum Machine Learning** as a live, publicly accessible web application.

---

## 1. System Architecture & Requirements

The application consists of two decoupled services:

```
[ Web Browser ]
      │
      ▼ (HTTPS)
[ Next.js 14 Frontend ] ─── (WSS WebSocket + HTTPS REST) ───► [ FastAPI Backend ]
  Hosted on: Vercel / Render / Cloud VM                       Hosted on: Render / Railway / Cloud VM
  Tech: React 18, Tailwind, Lucide, Canvas 3D                 Tech: Python 3.11, PennyLane, Uvicorn
```

| Service | Technology | Port (Local) | Key Protocols |
|---|---|---|---|
| **Backend** | Python 3.11, FastAPI, Uvicorn, PennyLane | `8000` | REST API (`/api/*`), WebSockets (`/ws/telemetry`) |
| **Frontend** | Next.js 14, React 18, Tailwind CSS | `3000` | HTTP/HTTPS |

---

## 2. Option A (Recommended & 100% Free): Render + Vercel

This is the fastest, zero-cost production deployment setup:
- **Backend:** Hosted on **Render.com** (Free tier Web Service, native Python & WebSocket support).
- **Frontend:** Hosted on **Vercel.com** (Free tier, zero-configuration Next.js deployment).

### Step 1: Deploy Backend on Render

1. Go to [Render.com](https://render.com) and sign in with your GitHub account (`Adharsh-Arvinth`).
2. Click **New +** -> **Web Service**.
3. Select your repository: `Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning`.
4. Configure service settings:
   - **Name:** `qml-self-healing-backend` (or your preferred name)
   - **Language:** `Python 3`
   - **Region:** Any (e.g., `Oregon (US West)` or `Frankfurt (EU Central)`)
   - **Branch:** `master` or `main`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn backend.api:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. (Optional alternative) Render will automatically detect the included [`render.yaml`](../render.yaml) blueprint if you choose **New +** -> **Blueprint**.
6. Click **Deploy Web Service**.
7. Once deployed, copy your public backend URL (e.g. `https://qml-self-healing-backend.onrender.com`).
8. Verify the backend is alive by visiting `https://<YOUR-BACKEND-URL>/health` in your browser. You should receive:
   ```json
   {"status":"healthy","step_count":0,"is_running":false,"timestamp":...}
   ```

---

### Step 2: Deploy Frontend on Vercel

1. Go to [Vercel.com](https://vercel.com) and sign in with your GitHub account.
2. Click **Add New...** -> **Project**.
3. Import `Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning`.
4. In the configuration screen:
   - **Root Directory:** Click **Edit** and select `frontend`.
   - **Framework Preset:** `Next.js` (detected automatically).
5. Expand **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL` = `https://<YOUR-BACKEND-URL>` (e.g. `https://qml-self-healing-backend.onrender.com`)
   *(Note: The frontend automatically derives `wss://.../ws/telemetry` from your HTTPS URL).*
6. Click **Deploy**.
7. In ~60 seconds, your site will be live at `https://<your-project>.vercel.app`!

---

## 3. Option B: Railway (All-in-One Deployment)

If you prefer hosting both frontend and backend on a single platform:

1. Sign in to [Railway.app](https://railway.app) with GitHub.
2. Click **New Project** -> **Deploy from GitHub repo**.
3. **Deploy Backend Service:**
   - Root directory: `/`
   - Railway will detect the [`Procfile`](../Procfile) or [`Dockerfile`](../Dockerfile).
   - Add Environment Variable: `PORT` = `8000`.
   - Generate a Public Domain in Settings (e.g., `qml-backend.up.railway.app`).
4. **Deploy Frontend Service:**
   - In the same project, click **New** -> **GitHub Repo** -> select the same repository.
   - Settings -> Root Directory: `/frontend`.
   - Environment Variables:
     - `NEXT_PUBLIC_API_URL` = `https://<backend-railway-url>`
     - `NEXT_PUBLIC_WS_URL` = `wss://<backend-railway-url>/ws/telemetry`
   - Generate a Public Domain in Settings.

---

## 4. Option C: Single Cloud Virtual Machine (Docker Compose)

For hosting on an AWS EC2 instance, DigitalOcean Droplet, Linode, Hetzner, or GCP Compute Engine:

1. SSH into your cloud server:
   ```bash
   ssh user@your-server-ip
   ```
2. Install Docker and Docker Compose (if not already installed):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning.git
   cd Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning
   ```
4. Start both frontend and backend in detached mode:
   ```bash
   docker compose up -d --build
   ```
5. Verify services are running:
   ```bash
   docker compose ps
   ```
6. Access your application:
   - Frontend: `http://<your-server-ip>:3000`
   - Backend API: `http://<your-server-ip>:8000`
   - API Docs: `http://<your-server-ip>:8000/docs`

*(For production domain setup on a VPS, place Nginx or Caddy with Let's Encrypt SSL in front of ports 3000 and 8000).*

---

## 5. Configuration Reference

### Environment Variables

| Variable | Target Service | Default (Local) | Production Example | Description |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Frontend | `http://127.0.0.1:8000` | `https://qml-api.onrender.com` | Base URL for FastAPI REST calls |
| `NEXT_PUBLIC_WS_URL` | Frontend | *(Auto-derived)* | `wss://qml-api.onrender.com/ws/telemetry` | WebSocket telemetry endpoint |
| `PORT` | Backend | `8000` | Set by cloud provider | HTTP server listening port |

### Verification Checklist

After deploying online, verify these features to confirm full functionality:

- [ ] **Health Check:** `curl https://<backend>/health` returns `200 OK` with JSON payload.
- [ ] **Dashboard Loading:** Frontend opens with Apple-style typography and dark/light mode toggle.
- [ ] **Live Telemetry Connection:** Top header shows `LIVE STREAM` indicator in green.
- [ ] **Bloch Sphere Rendering:** 3D state vector sphere renders interactively with rotation/drag.
- [ ] **Start Experiment:** Clicking **Start** initiates closed-loop quantum training.
- [ ] **Autonomous Self-Healing:** Injecting a failure (e.g. Barren Plateau) triggers diagnosis, twin verification, and Thompson Sampling bandit mitigation.
- [ ] **Stage 8 Benchmarks Tab:** Displays verified empirical evaluation graphs and statistical bounds.
