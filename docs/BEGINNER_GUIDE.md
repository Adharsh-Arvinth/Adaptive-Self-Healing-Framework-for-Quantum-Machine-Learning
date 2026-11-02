# Complete Beginner's Execution Guide
## Adaptive Self-Healing Framework for Quantum Machine Learning

Welcome! This guide is written specifically for students, researchers, evaluators, and engineers running this project on **Windows 10/11** using **Visual Studio Code (VS Code)**. 

No prior deep expertise in quantum computing, reinforcement learning, or web architecture is required to get this project up and running smoothly.

---

## Table of Contents

1. [What Does This Project Do? (Plain English)](#1-what-does-this-project-do-plain-english)
2. [Prerequisites & System Check](#2-prerequisites--system-check)
3. [Opening the Project in VS Code](#3-opening-the-project-in-vs-code)
4. [Setting Up Split Terminals in VS Code](#4-setting-up-split-terminals-in-vs-code)
5. [Day 1: First-Time Setup (One-Time Only)](#5-day-1-first-time-setup-one-time-only)
6. [Day 2+: Everyday Startup (The 2-Command Workflow)](#6-day-2-everyday-startup-the-2-command-workflow)
7. [Step-by-Step Dashboard Tour & Live Experiment](#7-step-by-step-dashboard-tour--live-experiment)
8. [Instant CLI Verifications (Zero Browser Required)](#8-instant-cli-verifications-zero-browser-required)
9. [Common Windows Pitfalls & Easy Fixes](#9-common-windows-pitfalls--easy-fixes)
10. [How to Safely Stop the Servers](#10-how-to-safely-stop-the-servers)

---

## 1. What Does This Project Do? (Plain English)

Quantum Machine Learning models (specifically Variational Quantum Classifiers, or VQCs) train by optimizing parameters on a quantum computer or simulator. However, quantum training is notoriously fragile—models frequently crash into "barren plateaus" (gradients vanish to zero), get corrupted by quantum noise, or diverge due to bad learning rates.

Traditionally, when a model fails, the training run is lost and a human engineer has to manually diagnose and restart it.

**This framework acts as an autonomous runtime "doctor" for the quantum model:**
1. It continuously monitors the quantum model's vitals (loss, gradients, quantum Bloch coordinates).
2. If an anomaly occurs, it identifies the root cause using a **Bayesian Diagnostician**.
3. If confident ($\ge 60\%$), it uses an AI policy (**Contextual Thompson Sampling**) to choose the best repair strategy (e.g., adjust learning rate, reduce circuit depth, modify feature map, change optimizer, apply noise mitigation, or warm restart).
4. Before touching the actual quantum circuit, it tests the fix in a fast **Digital Twin Sandbox**.
5. It applies the repair with an **automatic safety net (Atomic Rollback)**: if the repair helps, it commits the changes; if the model gets worse, it instantly reverts to a saved snapshot.
6. Everything is visible in real-time on a modern **Apple-inspired Web Dashboard**.

---

## 2. Prerequisites & System Check

Before running the commands below, make sure you have the following installed on your Windows machine:

1. **Python 3.11, 3.12, or 3.13 (64-bit)**
   - Download from [python.org](https://www.python.org/downloads/).
   - ⚠️ **Crucial:** During installation, ensure you check the box that says **"Add python.exe to PATH"**.
2. **Node.js (Version 18 or higher)**
   - Download the LTS version from [nodejs.org](https://nodejs.org/).
3. **Git for Windows**
   - Download from [git-scm.com](https://git-scm.com/).
4. **Visual Studio Code (VS Code)**
   - Download from [code.visualstudio.com](https://code.visualstudio.com/).

### Quick Verification
Open PowerShell on your computer and test that your tools are accessible:
```powershell
python --version    # Should print: Python 3.11.x, 3.12.x, or 3.13.x
node --version      # Should print: v18.x.x, v20.x.x, or v22.x.x
npm --version       # Should print: 9.x.x or 10.x.x
git --version       # Should print: git version 2.x.x
```
If any command is not recognized, restart PowerShell or reinstall the corresponding tool making sure it is added to your system PATH.

---

## 3. Opening the Project in VS Code

1. Launch **Visual Studio Code**.
2. Go to the top menu and select **File > Open Folder...** (or press `Ctrl + K, Ctrl + O`).
3. Navigate to and select the project directory:
   ```
   C:\Users\<YourUsername>\Desktop\capstone
   ```
   *(or the folder where you cloned the repository)*.
4. Click **Select Folder**.
5. You should now see the project file explorer on the left sidebar with folders like `backend/`, `frontend/`, `docs/`, `tests/`, and `manuscript/`.

---

## 4. Setting Up Split Terminals in VS Code

Because this is a full-stack system, it has two components that run concurrently:
- **Terminal 1:** The Python FastAPI backend gateway (Port 8000)
- **Terminal 2:** The Next.js web dashboard frontend (Port 3000)

VS Code makes it very easy to view both side-by-side:

1. Open the integrated terminal by pressing `Ctrl + ` ` (the backtick key, next to 1) or selecting **Terminal > New Terminal** from the menu.
2. Ensure the terminal shell is **PowerShell** (visible in the top-right corner of the terminal panel).
3. Click the **Split Terminal** icon (the small rectangle divided into two, or press `Ctrl + Shift + 5`).
4. You now have two PowerShell terminals side-by-side!
   - Label or dedicate the **Left Terminal** to **Backend**.
   - Label or dedicate the **Right Terminal** to **Frontend**.

---

## 5. Day 1: First-Time Setup (One-Time Only)

You only need to execute this setup process once when first cloning or setting up the repository.

### Step 5.1 — Configure Python Environment (Left Terminal)
In your **Left Terminal** (root project directory):

```powershell
# 1. Enable script execution for this PowerShell session (fixes Windows permission issues)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 2. Create an isolated Python virtual environment named .venv
python -m venv .venv

# 3. Activate the virtual environment
.\.venv\Scripts\Activate.ps1
# (You should now see '(.venv)' at the beginning of your command prompt)

# 4. Upgrade pip and install all Python dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```
*This installs PennyLane, FastAPI, Uvicorn, NumPy, SciPy, Scikit-Learn, and Pytest. This may take 1–2 minutes.*

### Step 5.2 — Configure Frontend Environment (Right Terminal)
In your **Right Terminal**:

```powershell
# 1. Navigate into the frontend directory
cd frontend

# 2. Install all Node.js and Next.js dependencies
npm install

# 3. Return to the root directory
cd ..
```
*This downloads Next.js, React, Lucide icons, and Tailwind CSS. Once complete, your setup is 100% ready!*

---

## 6. Day 2+: Everyday Startup (The 2-Command Workflow)

Every time you restart your computer or reopen VS Code to work with or demonstrate the application, follow these two simple steps:

### Terminal 1 (Left Terminal — Backend):
```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.api:app --host 127.0.0.1 --port 8000 --reload
```
*Expected output:*
```
INFO:     Started server process [xxxx]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### Terminal 2 (Right Terminal — Frontend):
```powershell
cd frontend
npm run dev
```
*Expected output:*
```
  ▲ Next.js 14.2.23
  - Local:        http://localhost:3000
  - Network:      http://...
 ✓ Ready in 1200ms
```

### Step 6.3 — Open the Dashboard
Open your favorite web browser (Chrome, Edge, Firefox, or Safari) and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

You will be greeted by the Apple-inspired Self-Healing Quantum Control Center!

---

## 7. Step-by-Step Dashboard Tour & Live Experiment

Here is how to interact with the full-stack system and watch the autonomous self-healing in action:

### Step 1: Check Connection Status
Look at the top-right corner of the dashboard. You should see a green badge that reads **"LIVE STREAM"** with a pulsing indicator. This confirms that the Next.js UI is receiving real-time WebSocket telemetry from the PennyLane backend.

### Step 2: Start Autonomous Training
In the top control bar:
- Select a dataset (e.g., `Moons`, `Circles`, or `Iris`).
- Leave the default settings (2 qubits, 2 layers, learning rate 0.05).
- Click the blue **"Start Experiment"** button.

### Step 3: Observe Nominal Training
- In the **Metrics Row**, watch the Training Loss decrease and Validation Accuracy increase.
- In the **Loss & Convergence** chart, observe the loss curve smoothly trending downwards.
- In the **3D Bloch Sphere Visualizer**, rotate the sphere with your mouse to observe the quantum state vector traversing the Bloch sphere surface.

### Step 4: Inject a Synthetic Quantum Failure
Scroll down to the **"Failure Injection Cockpit"**:
- Select **`LR Misconfiguration`** or **`Quantum Noise Degradation`**.
- Keep the severity at `1.0`.
- Click the red **"Inject Failure"** button.

### Step 5: Watch the Self-Healing Engine React Live!
Observe the coordinated sequence across the dashboard panels:
1. **Anomaly Detected:** The top status bar changes to an orange warning. The **Telemetry Stream** flags loss spikes and gradient anomalies.
2. **Root-Cause Diagnosis:** In the **Diagnosis Panel**, the Bayesian diagnostician computes posterior probabilities across all 6 failure hypotheses.
3. **Confidence Gating:** If confidence is below $60\%$, the state displays **"CONFIDENCE_GATE_HOLD"**, safely abstaining from rash decisions. As symptoms clarify, confidence exceeds the threshold.
4. **Bandit Decision:** The **Bandit Monitor** highlights the chosen repair arm (e.g., `adjust_learning_rate` or `modify_feature_map`).
5. **Digital Twin Validation:** The **Digital Twin Panel** simulates the proposed repair for $H=3$ steps ahead in a sandbox to ensure it won't crash the circuit.
6. **Atomic Rollback Safety:** The **Deployment Monitor** shows the repair entering the 3-step validation window. If the loss improves, it reports **"COMMITTED"**; if the repair fails, it instantly triggers **"ROLLED BACK"** to protect the model.
7. **Lifelong Memory:** The **Memory & Audit Log** automatically logs the episode into the SQLite database, updating the Contextual Thompson Sampling policy for future runs.

---

## 8. Instant CLI Verifications (Zero Browser Required)

If you need to quickly verify that the algorithms, PennyLane circuits, and APIs work properly without opening a browser:

### Verification 1: Rapid 5-Second Vertical Slice
Run the standalone vertical slice runner:
```powershell
python backend/run_slice.py
```
This executes an end-to-end self-healing cycle in the terminal:
- Runs 5 nominal VQC training steps.
- Injects a severe learning rate fault at step 6.
- Detects the anomaly and activates the Bayesian confidence gate.
- Selects a candidate repair using Contextual Thompson Sampling.
- Evaluates the repair, commits it to the model, and updates the SQLite episodic memory.
- Writes full machine-readable telemetry to `docs/vertical_slice_trace.json`.

### Verification 2: Run the 93-Test Pytest Suite
Run the comprehensive automated test suite:
```powershell
pytest -q
```
*Expected result:*
```
93 passed, 1 warning in 9.52s
```
This tests:
- PennyLane quantum circuit executions and Bloch coordinate tracking.
- All 6 failure injection mechanisms and safety limits.
- The 12-dimensional continuous telemetry extractor.
- Gaussian Naïve Bayes diagnosis and the $\tau=0.60$ confidence gate.
- Contextual Thompson Sampling bandit updates with Sherman-Morrison rank-1 inversions.
- Digital twin proxy forward simulation and state cloning.
- Atomic commit and rollback state restoration.
- SQLite memory episode storage and retrieval.
- FastAPI REST endpoints and WebSocket protocol handlers.

---

## 9. Common Windows Pitfalls & Easy Fixes

### Pitfall 1: "Running scripts is disabled on this system"
**What you see:**
```
.\.venv\Scripts\Activate.ps1 : File cannot be loaded because running scripts is disabled on this system.
```
**Why:** Windows PowerShell restricts running scripts by default for security.  
**Fix:** Run this one-liner in your PowerShell window:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```
Then re-run `.\.venv\Scripts\Activate.ps1`.

---

### Pitfall 2: "Port 8000 or Port 3000 is already in use"
**What you see:**
```
ERROR: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 8000): only one usage of each socket address is normally permitted
```
**Why:** An earlier Python or Node process is still running in the background.  
**Fix:**
Option A — Free port 8000 in PowerShell:
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess -Force
```
Option B — Simply run on another port:
```powershell
uvicorn backend.api:app --port 8001 --reload
```
*(If you run the backend on port 8001, pass the port to the frontend or configure the environment variable)*.

---

### Pitfall 3: "python is not recognized as an internal or external command"
**Why:** Python was installed without checking "Add python.exe to PATH".  
**Fix:**
- Try typing `py` instead of `python` (Windows Python Launcher).
- Or search for "Environment Variables" in Windows Start, edit `Path`, and add `C:\Users\<YourUsername>\AppData\Local\Programs\Python\Python313\`.

---

### Pitfall 4: VS Code Terminal is Frozen or Stuck
If a process seems unresponsive:
- Click inside the terminal and press `Ctrl + C` twice.
- If it still doesn't respond, click the **Trash Can icon** (Kill Terminal) in the top-right corner of the terminal panel, and open a new terminal with `Ctrl + ` `.

---

## 10. How to Safely Stop the Servers

When you are done testing or demonstrating the application:

1. **Stop the Frontend:**
   - Click into the **Right Terminal** (Next.js).
   - Press `Ctrl + C`.
   - When asked `Terminate batch job (Y/N)?`, type `Y` and press `Enter`.
2. **Stop the Backend:**
   - Click into the **Left Terminal** (FastAPI).
   - Press `Ctrl + C`.
   - The Uvicorn server will gracefully shut down the PennyLane simulator and close active WebSocket connections.

---

## Congratulations!
You now have a complete, fully functional autonomous self-healing quantum machine learning system running on your local machine.

For architectural deep-dives, mathematical formulations, and research publication drafts, explore:
- 📖 [docs/ARCHITECTURE.md](ARCHITECTURE.md) — Comprehensive technical architecture.
- 📐 [docs/MATHEMATICAL_VERIFICATION.md](MATHEMATICAL_VERIFICATION.md) — Complete mathematical proofs and boundaries.
- 📝 [manuscript/MANUSCRIPT_DRAFT.md](../manuscript/MANUSCRIPT_DRAFT.md) — Full academic journal manuscript.
