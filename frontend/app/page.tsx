"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
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
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/telemetry";

export default function DashboardPage() {
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

  // Metrics
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
  });

  // Time-series history
  const [history, setHistory] = useState<TelemetryPoint[]>([]);

  // Diagnostics & Anomalies
  const [diagnosis, setDiagnosis] = useState<DiagnosisData | null>(null);
  const [activeAnomalies, setActiveAnomalies] = useState<string[]>([]);

  // Repair & Decision
  const [selectedArm, setSelectedArm] = useState<string | null>(null);
  const [eligibleArms, setEligibleArms] = useState<string[]>([]);

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
        }
      }
    } catch (e) {
      console.warn("Could not load initial REST data:", e);
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
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

            if (payload.deployment) {
              setDeployment(payload.deployment);
            }

            if (payload.evaluation) {
              setEvaluation(payload.evaluation);
            }

            if (payload.events && payload.events.length > 0) {
              setEvents((prev) => [...payload.events, ...prev].slice(0, 50));
            }

            setHistory((prev) => [...prev, payload]);
          } else if (type === "training_started") {
            setIsRunning(true);
          } else if (type === "training_stopped") {
            setIsRunning(false);
          } else if (type === "failure_injected") {
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
  }, [fetchStatusAndPosteriors]);

  useEffect(() => {
    fetchStatusAndPosteriors();
    connectWebSocket();

    const interval = setInterval(() => {
      // Refresh memory episodes and posteriors periodically
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

  // Action handlers
  const handleStart = async () => {
    try {
      await fetch(`${API_BASE}/api/experiment/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataset,
          step_delay_ms: 200,
          max_steps: maxSteps,
        }),
      });
      setIsRunning(true);
    } catch (e) {
      console.error("Start failed:", e);
    }
  };

  const handleStop = async () => {
    try {
      await fetch(`${API_BASE}/api/experiment/stop`, { method: "POST" });
      setIsRunning(false);
    } catch (e) {
      console.error("Stop failed:", e);
    }
  };

  const handleStep = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/step`, { method: "POST" });
      if (res.ok) {
        const payload = await res.json();
        setStepCount(payload.step);
      }
    } catch (e) {
      console.error("Step execution failed:", e);
    }
  };

  const handleReset = async () => {
    try {
      await fetch(`${API_BASE}/api/experiment/reset`, { method: "POST" });
      setHistory([]);
      setStepCount(0);
      setIsRunning(false);
      setPipelineState("IDLE");
      fetchStatusAndPosteriors();
    } catch (e) {
      console.error("Reset failed:", e);
    }
  };

  const handleInjectFailure = async (failureType: string, severity: number) => {
    try {
      await fetch(`${API_BASE}/api/experiment/inject-failure`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          failure_type: failureType,
          severity,
        }),
      });
    } catch (e) {
      console.error("Failure injection failed:", e);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Application Bar */}
      <Header
        isConnected={isConnected}
        pipelineState={pipelineState}
        stepCount={stepCount}
        maxSteps={maxSteps}
        isRunning={isRunning}
        optimizerName={optimizerName}
        featureMap={featureMap}
        nLayers={nLayers}
        nQbits={nQbits}
        dataset={dataset}
        onStart={handleStart}
        onStop={handleStop}
        onStep={handleStep}
        onReset={handleReset}
      />

      {/* Main Workspace Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Real-time Telemetry KPI Row */}
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

        {/* Primary Visualization: Loss Trajectory & Real Quantum Bloch Sphere */}
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
            />
          </div>
        </section>

        {/* Autonomous Closed-Loop Self-Healing: Diagnosis, Repair Cockpit, & Digital Twin */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
          <RepairCockpit
            selectedArm={selectedArm}
            eligibleArms={eligibleArms}
            currentOptimizer={optimizerName}
            currentFeatureMap={featureMap}
            currentDepth={metrics.circuitDepth}
          />
          <DigitalTwinPanel prediction={twinPrediction} evaluation={evaluation} />
        </section>

        {/* Closed-Loop Execution: Deployment & Rollback, Contextual Bandit, and Injection Sandbox */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DeploymentMonitor deployment={deployment} pipelineState={pipelineState} />
          <BanditMonitor decision={banditDecision} posteriors={banditPosteriors} />
          <FailureInjectionPanel onInject={handleInjectFailure} isRunning={isRunning} />
        </section>

        {/* Empirical Knowledge & Audit Logs */}
        <section>
          <MemoryAndAuditLog episodes={episodes} events={events} />
        </section>
      </main>

      {/* Sub-footer System Attribution */}
      <footer className="border-t border-white/5 py-4 px-6 text-center text-xs text-neutral-500 font-mono">
        Adaptive Self-Healing Quantum Machine Learning Framework • PennyLane 0.45.1 • Next.js 14 • Closed-Loop MAPE-K Architecture
      </footer>
    </div>
  );
}
