"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header, NavTab } from "@/components/Header";
import { MetricsRow } from "@/components/MetricsRow";
import { LossChart } from "@/components/LossChart";
import { BlochSphere } from "@/components/BlochSphere";
import { DiagnosisPanel } from "@/components/DiagnosisPanel";
import { RepairCockpit } from "@/components/RepairCockpit";
import { DigitalTwinPanel } from "@/components/DigitalTwinPanel";
import { DeploymentMonitor } from "@/components/DeploymentMonitor";
import { BanditMonitor } from "@/components/BanditMonitor";
import { FailureInjectionPanel } from "@/components/FailureInjectionPanel";
import { MemoryAndAuditLog } from "@/components/MemoryAndAuditLog";
import { BenchmarksPanel } from "@/components/BenchmarksPanel";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ToastContainer } from "@/components/Toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import {
  TelemetryPoint,
  DiagnosisData,
  DigitalTwinPrediction,
  EvaluationRecord,
  DeploymentRecord,
  BanditDecisionData,
  PosteriorData,
  Episode,
  EventItem,
  ToastMessage,
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (API_BASE.startsWith("https://")
    ? API_BASE.replace(/^https:\/\//, "wss://") + "/ws/telemetry"
    : API_BASE.replace(/^http:\/\//, "ws://") + "/ws/telemetry");

export default function DashboardPage() {
  // Navigation & Theme
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Notifications & Modals
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Connection and status
  const [isConnected, setIsConnected] = useState(false);
  const [pipelineState, setPipelineState] = useState("IDLE");
  const [stepCount, setStepCount] = useState(0);
  const [maxSteps, setMaxSteps] = useState(60);
  const [isRunning, setIsRunning] = useState(false);

  // Model & Circuit metadata
  const [optimizerName, setOptimizerName] = useState("Adam");
  const [featureMap, setFeatureMap] = useState("Angle");
  const [nLayers, setNLayers] = useState(2);
  const [nQbits, setNQbits] = useState(2);
  const [dataset] = useState("moons");

  // Telemetry Metrics
  const [metrics, setMetrics] = useState({
    loss: 0.6931,
    valLoss: 0.6931,
    accuracy: 0.5,
    valAccuracy: 0.5,
    gradientNorm: 0.05,
    gradientVariance: 0.001,
    parameterVelocity: 0.01,
    learningRate: 0.05,
    circuitDepth: 4,
  });

  // Bloch Coordinates
  const [bloch, setBloch] = useState({
    x: 0.0,
    y: 0.0,
    z: 1.0,
    qubitIndex: 0,
    x_mitigated: undefined as number | undefined,
    y_mitigated: undefined as number | undefined,
    z_mitigated: undefined as number | undefined,
  });

  // Time-series history
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  // Diagnostics & Anomalies
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [activeAnomalies, setActiveAnomalies] = useState<string[]>([]);

  // Repair & Decision
  const [selectedArm, setSelectedArm] = useState<string | null>(null);
  const [eligibleArms, setEligibleArms] = useState<string[]>([
    "adjust_learning_rate",
    "change_optimizer",
    "reduce_circuit_depth",
    "modify_feature_map",
    "apply_noise_mitigation",
    "perform_warm_restart",
  ]);

  // Digital Twin & Evaluation
  const [twinPrediction, setTwinPrediction] = useState<DigitalTwinPrediction | null>(null);
  const [evaluation, setEvaluation] = useState<EvaluationRecord | null>(null);

  // Deployment
  const [deployment, setDeployment] = useState<DeploymentRecord | null>(null);

  // Bandit & Posteriors
  const [banditDecision, setBanditDecision] = useState<BanditDecisionData | null>(null);
  const [banditPosteriors, setBanditPosteriors] = useState<Record<string, PosteriorData> | null>(null);

  // Memory Episodes & Audit Events
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [events, setEvents] = useState<EventItem[]>([
    { state: "IDLE", message: "System initialized and awaiting training commands." },
  ]);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Toast Helpers
  const addToast = useCallback(
    (type: ToastMessage["type"], title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newToast: ToastMessage = { id, type, title, message, timestamp: Date.now() };
      setToasts((prev) => [...prev.slice(-4), newToast]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Theme
  useEffect(() => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (isDarkMode) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, [isDarkMode]);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Fetch initial REST data
  const fetchStatusAndPosteriors = useCallback(async () => {
    try {
      const [statusRes, posteriorsRes, memoryRes, histRes] = await Promise.all([
        fetch(`${API_BASE}/api/experiment/status`),
        fetch(`${API_BASE}/api/bandit/posteriors`),
        fetch(`${API_BASE}/api/memory/episodes`),
        fetch(`${API_BASE}/api/telemetry/history`),
      ]);

      if (statusRes.ok) {
        const s = await statusRes.json();
        setIsRunning(s.is_running || false);
        setStepCount(s.step_count || 0);
        setMaxSteps(s.max_steps || 60);
        if (s.pipeline_state) setPipelineState(s.pipeline_state);
        if (s.config) {
          setOptimizerName(s.config.optimizer_name);
          setFeatureMap(s.config.feature_map);
          setNLayers(s.config.n_layers);
          setNQbits(s.config.n_qubits);
        }
      }

      if (posteriorsRes.ok) {
        const p = await posteriorsRes.json();
        setBanditPosteriors(p);
      }

      if (memoryRes.ok) {
        const m = await memoryRes.json();
        if (m.episodes) setEpisodes(m.episodes);
      }

      if (histRes.ok) {
        const h = await histRes.json();
        if (h.history && h.history.length > 0) {
          setHistory(h.history);
          const latest = h.history[h.history.length - 1];
          if (latest.loss !== undefined) {
            setMetrics({
              loss: latest.loss,
              valLoss: latest.val_loss,
              accuracy: latest.accuracy,
              valAccuracy: latest.val_accuracy,
              gradientNorm: latest.gradient_norm,
              gradientVariance: latest.gradient_variance,
              parameterVelocity: latest.parameter_velocity,
              learningRate: latest.learning_rate,
              circuitDepth: latest.circuit_depth,
            });
          }
          if (latest.bloch) setBloch(latest.bloch);
          if (latest.diagnosis) setDiagnosis(latest.diagnosis);
          if (latest.twin_prediction) setTwinPrediction(latest.twin_prediction);
          if (latest.deployment) setDeployment(latest.deployment);
          if (latest.bandit_decision) {
            setBanditDecision(latest.bandit_decision);
            setSelectedArm(latest.bandit_decision.selected_arm);
          }
        }
      }
    } catch (e) {
      console.warn("Could not load initial REST data:", e);
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          if (type === "step_telemetry" && payload) {
            setStepCount(payload.step);
            setPipelineState(payload.state);
            setOptimizerName(payload.optimizer_name || "Adam");
            setFeatureMap(payload.feature_map || "Angle");
            setMetrics({
              loss: payload.loss,
              valLoss: payload.val_loss,
              accuracy: payload.accuracy,
              valAccuracy: payload.val_accuracy,
              gradientNorm: payload.gradient_norm,
              gradientVariance: payload.gradient_variance,
              parameterVelocity: payload.parameter_velocity,
              learningRate: payload.learning_rate,
              circuitDepth: payload.circuit_depth,
            });

            if (payload.bloch) {
              setBloch(payload.bloch);
            }

            if (payload.anomalies) {
              setActiveAnomalies(payload.anomalies);
            }

            if (payload.diagnosis) {
              setDiagnosis(payload.diagnosis);
            }

            if (payload.bandit_decision) {
              setBanditDecision(payload.bandit_decision);
              setSelectedArm(payload.bandit_decision.selected_arm);
              setEligibleArms(payload.bandit_decision.eligible_arms);
            }

            if (payload.twin_prediction) {
              setTwinPrediction(payload.twin_prediction);
            }

            if (payload.deployment) {
              setDeployment(payload.deployment);
            }

            if (payload.evaluation) {
              setEvaluation(payload.evaluation);
            }

            if (payload.events && payload.events.length > 0) {
              setEvents((prev) => [...payload.events, ...prev].slice(0, 100));
            }

            setHistory((prev) => [...prev, payload]);
          } else if (type === "training_started") {
            setIsRunning(true);
            addToast("info", "Autonomous Runner Started", "Continuous closed-loop training is now active.");
          } else if (type === "training_stopped") {
            setIsRunning(false);
            addToast("info", "Training Stopped", "Autonomous runner has paused execution.");
          } else if (type === "failure_injected") {
            addToast(
              "warning",
              "Synthetic Failure Injected",
              `Fault ${payload.failure_type} deployed (severity = ${payload.severity}x)`
            );
            setEvents((prev) => [
              {
                state: "FAILURE_INJECTED",
                message: `Injected synthetic failure: ${payload.failure_type} (severity=${payload.severity})`,
              },
              ...prev,
            ]);
          } else if (type === "experiment_reset") {
            setHistory([]);
            setStepCount(0);
            setPipelineState("IDLE");
            setIsRunning(false);
            setDiagnosis(null);
            setTwinPrediction(null);
            setEvaluation(null);
            setDeployment(null);
            setSelectedArm(null);
            setActiveAnomalies([]);
            addToast("info", "Experiment Reset", "Weights, optimizer buffers and telemetry flushed.");
            fetchStatusAndPosteriors();
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch (e) {
      console.warn("WebSocket init failed:", e);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000);
    }
  }, [fetchStatusAndPosteriors, addToast]);

  useEffect(() => {
    fetchStatusAndPosteriors();
    connectWebSocket();

    const interval = setInterval(() => {
      fetch(`${API_BASE}/api/memory/episodes`)
        .then((r) => r.json())
        .then((m) => m.episodes && setEpisodes(m.episodes))
        .catch(() => {});

      fetch(`${API_BASE}/api/bandit/posteriors`)
        .then((r) => r.json())
        .then((p) => setBanditPosteriors(p))
        .catch(() => {});
    }, 4000);

    return () => {
      clearInterval(interval);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [fetchStatusAndPosteriors, connectWebSocket]);

  // Action Handlers
  const handleStart = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset,
          step_delay_ms: 200,
          max_steps: maxSteps,
        }),
      });
      if (res.ok) {
        setIsRunning(true);
        addToast("success", "Training Started", "Autonomous MAPE-K pipeline running.");
      }
    } catch (e) {
      addToast("error", "Failed to Start", String(e));
    }
  };

  const handlePause = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/pause`, { method: "POST" });
      if (res.ok) {
        setIsRunning(false);
        addToast("info", "Execution Paused", "Pipeline runner cleanly paused.");
      }
    } catch (e) {
      addToast("error", "Pause Failed", String(e));
    }
  };

  const handleResume = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/resume`, { method: "POST" });
      if (res.ok) {
        setIsRunning(true);
        addToast("success", "Execution Resumed", "Pipeline runner resumed execution.");
      }
    } catch (e) {
      addToast("error", "Resume Failed", String(e));
    }
  };

  const handleStep = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/step`, { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        setStepCount(payload.step);
        addToast("info", "Single Step Executed", `Advanced to step ${payload.step}`);
      }
    } catch (e) {
      addToast("error", "Step Execution Failed", String(e));
    }
  };

  const handleReset = async () => {
    setIsResetModalOpen(false);
    try {
      await fetch(`${API_BASE}/api/experiment/reset`, { method: "POST" });
      setHistory([]);
      setStepCount(0);
      setIsRunning(false);
      setPipelineState("IDLE");
      addToast("warning", "Experiment Reset", "All states re-initialized to step 0.");
      fetchStatusAndPosteriors();
    } catch (e) {
      addToast("error", "Reset Failed", String(e));
    }
  };

  const handleInjectFailure = async (failureType: string, severity: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/inject-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          failure_type: failureType,
          severity,
        }),
      });
      if (res.ok) {
        addToast("warning", "Fault Injected", `${failureType} (severity=${severity}x) applied.`);
      }
    } catch (e) {
      addToast("error", "Injection Failed", String(e));
    }
  };

  const handleTriggerRepair = async (armId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/trigger-repair`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arm: armId }),
      });
      const data = await res.json();
      if (data.status === "DEPLOYED") {
        addToast(
          "success",
          "Repair Deployed",
          `Arm '${armId}' deployed into validation window W_val=3`
        );
        setSelectedArm(armId);
        setPipelineState("DEPLOYED");
      } else {
        addToast("error", "Safety Rejection", data.message || "Repair arm rejected by safety filter.");
      }
    } catch (e) {
      addToast("error", "Deploy Failed", String(e));
    }
  };

  const handleSimulateTwin = async (armId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/simulate-twin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ arm: armId, horizon: 3 }),
      });
      if (res.ok) {
        const pred = await res.json();
        addToast(
          pred.is_viable ? "success" : "warning",
          "Digital Twin Simulation Complete",
          `Predicted delta: ${pred.predicted_loss_delta >= 0 ? "+" : ""}${pred.predicted_loss_delta.toFixed(4)} (Viable: ${pred.is_viable})`
        );
        return pred;
      }
    } catch (e) {
      addToast("error", "Twin Simulation Failed", String(e));
    }
    return null;
  };

  const handleCommit = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/commit`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addToast("success", "Repair Committed", "Active repair permanently accepted.");
        setPipelineState("COMMITTED");
      } else {
        addToast("warning", "Commit Ignored", data.detail || "No active repair to commit.");
      }
    } catch (e) {
      addToast("error", "Commit Failed", String(e));
    }
  };

  const handleRollback = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/rollback`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addToast("warning", "Repair Rolled Back", "Model restored from pre-repair checkpoint snapshot.");
        setPipelineState("ROLLED_BACK");
      } else {
        addToast("warning", "Rollback Ignored", data.detail || "No active repair to rollback.");
      }
    } catch (e) {
      addToast("error", "Rollback Failed", String(e));
    }
  };

  const latestTelemetry = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--content-primary)] transition-colors">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Confirmation Modal for Reset */}
      <ConfirmationModal
        isOpen={isResetModalOpen}
        title="Reset Experiment and Model State?"
        message="This action will reset the Variational Quantum Classifier weights, flush the optimizer momentum buffers, clear active anomalies, and re-initialize step telemetry to zero. Episodic memory will remain intact."
        confirmLabel="Reset Everything"
        cancelLabel="Keep Running"
        onConfirm={handleReset}
        onCancel={() => setIsResetModalOpen(false)}
      />

      {/* Top Application Bar */}
      <Header
        isConnected={isConnected}
        pipelineState={pipelineState}
        stepCount={stepCount}
        maxSteps={maxSteps}
        isRunning={isRunning}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onResetPrompt={() => setIsResetModalOpen(true)}
      />

      {/* Main Workspace Dashboard */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-time Telemetry Health-Style KPI Row (Visible on all tabs) */}
        <MetricsRow
          loss={metrics.loss}
          valLoss={metrics.valLoss}
          accuracy={metrics.accuracy}
          valAccuracy={metrics.valAccuracy}
          gradientNorm={metrics.gradientNorm}
          gradientVariance={metrics.gradientVariance}
          parameterVelocity={metrics.parameterVelocity}
          learningRate={metrics.learningRate}
          circuitDepth={metrics.circuitDepth}
        />

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fade-in">
            {/* Primary Visualization: Loss Trajectory & Interactive Quantum Bloch Sphere */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <LossChart history={history} />
              </div>
              <div className="lg:col-span-1">
                <BlochSphere
                  x={bloch.x}
                  y={bloch.y}
                  z={bloch.z}
                  qubitIndex={bloch.qubitIndex || 0}
                  xMitigated={bloch.x_mitigated}
                  yMitigated={bloch.y_mitigated}
                  zMitigated={bloch.z_mitigated}
                />
              </div>
            </section>

            {/* Tri-Panel Overview: Diagnosis, Repair Cockpit, Deployment Status */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
              <RepairCockpit
                selectedArm={selectedArm}
                eligibleArms={eligibleArms}
                currentOptimizer={optimizerName}
                currentFeatureMap={featureMap}
                currentDepth={metrics.circuitDepth}
                onTriggerRepair={handleTriggerRepair}
              />
              <DeploymentMonitor
                deployment={deployment}
                pipelineState={pipelineState}
                onCommit={handleCommit}
                onRollback={handleRollback}
              />
            </section>

            {/* Controlled Failure Injection Sandbox */}
            <section>
              <FailureInjectionPanel onInject={handleInjectFailure} isRunning={isRunning} />
            </section>
          </div>
        )}

        {/* TAB 2: DIAGNOSIS & REPAIRS */}
        {activeTab === "diagnosis" && (
          <div className="space-y-6 animate-fade-in">
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
              <RepairCockpit
                selectedArm={selectedArm}
                eligibleArms={eligibleArms}
                currentOptimizer={optimizerName}
                currentFeatureMap={featureMap}
                currentDepth={metrics.circuitDepth}
                onTriggerRepair={handleTriggerRepair}
              />
            </section>
            <section>
              <FailureInjectionPanel onInject={handleInjectFailure} isRunning={isRunning} />
            </section>
          </div>
        )}

        {/* TAB 3: DIGITAL TWIN & SAFETY */}
        {activeTab === "twin" && (
          <div className="space-y-6 animate-fade-in">
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DigitalTwinPanel
                prediction={twinPrediction}
                evaluation={evaluation}
                onSimulateTwin={handleSimulateTwin}
                selectedArm={selectedArm}
              />
              <DeploymentMonitor
                deployment={deployment}
                pipelineState={pipelineState}
                onCommit={handleCommit}
                onRollback={handleRollback}
              />
            </section>
          </div>
        )}

        {/* TAB 4: BANDIT & MEMORY */}
        {activeTab === "bandit" && (
          <div className="space-y-6 animate-fade-in">
            <section>
              <BanditMonitor
                decision={banditDecision}
                posteriors={banditPosteriors}
                currentTelemetry={latestTelemetry}
              />
            </section>
            <section>
              <MemoryAndAuditLog
                episodes={episodes}
                events={events}
                onClearEvents={() => setEvents([])}
              />
            </section>
          </div>
        )}

        {/* TAB 5: BENCHMARKS */}
        {activeTab === "benchmarks" && (
          <div className="animate-fade-in">
            <BenchmarksPanel apiBase={API_BASE} />
          </div>
        )}

        {/* TAB 6: SETTINGS */}
        {activeTab === "settings" && (
          <div className="animate-fade-in">
            <SettingsPanel
              optimizerName={optimizerName}
              featureMap={featureMap}
              nLayers={nLayers}
              nQbits={nQbits}
              dataset={dataset}
              learningRate={metrics.learningRate}
              history={history}
              apiBase={API_BASE}
            />
          </div>
        )}
      </main>

      {/* Apple-Style Sub-footer System Attribution */}
      <footer className="border-t border-[var(--border-subtle)] py-4 px-6 text-center text-xs text-[var(--content-secondary)] font-mono">
        Adaptive Self-Healing Quantum Machine Learning Framework • PennyLane 0.45.1 • Next.js 14 • Contextual Thompson Sampling • Closed-Loop MAPE-K
      </footer>
    </div>
  );
}
