"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { StoryChapter1Challenge } from "@/components/StoryChapter1Challenge";
import { StoryChapter2Breakthrough } from "@/components/StoryChapter2Breakthrough";
import { StoryChapter3Intelligence } from "@/components/StoryChapter3Intelligence";
import { StoryChapter4RepairArms } from "@/components/StoryChapter4RepairArms";
import { StoryChapter5AdaptiveBandit } from "@/components/StoryChapter5AdaptiveBandit";
import { StoryChapter6DigitalTwinSafety } from "@/components/StoryChapter6DigitalTwinSafety";
import { StoryChapter7Evidence } from "@/components/StoryChapter7Evidence";
import { StoryChapter8Limitations } from "@/components/StoryChapter8Limitations";
import { FinalCtaSection } from "@/components/FinalCtaSection";
import { DashboardView } from "@/components/DashboardView";
import { Footer } from "@/components/Footer";
import { ToastContainer } from "@/components/Toast";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

// Dynamic API resolution: In production browser environments, always target live Render backend
const DEFAULT_PROD_API = "https://qml-backend-nczx.onrender.com";
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined" && !["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? DEFAULT_PROD_API
    : "http://127.0.0.1:8000");

const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL ||
  (API_BASE.startsWith("https://")
    ? API_BASE.replace(/^https:\/\//, "wss://") + "/ws/telemetry"
    : API_BASE.replace(/^http:\/\//, "ws://") + "/ws/telemetry");

export default function Page() {
  // Primary View Mode: "landing" (Cinematic Editorial Experience) | "dashboard" (Interactive Research Lab)
  const [activeView, setActiveView] = useState<"landing" | "dashboard">("landing");
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

  // Telemetry Metrics (Idle defaults)
  const [metrics, setMetrics] = useState({
    loss: 0.6931,
    valLoss: 0.6931,
    accuracy: 0.5,
    valAccuracy: 0.5,
    gradientNorm: 0.05,
    gradientVariance: 0.001,
    parameterVelocity: 0.01,
    learningRate: 0.05,
    circuitDepth: 2,
  });

  // Bloch Coordinates & Reduced State Purity
  const [bloch, setBloch] = useState({
    x: 0.0,
    y: 0.0,
    z: 1.0,
    qubitIndex: 0,
    x_mitigated: undefined as number | undefined,
    y_mitigated: undefined as number | undefined,
    z_mitigated: undefined as number | undefined,
    purity: 1.0,
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
    { state: "IDLE", message: "Adaptive Self-Healing Runtime initialized. Telemetry link standby." },
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

  // Sync Theme (Cinematic Dark Default with persistence)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "light") {
        setIsDarkMode(false);
        document.documentElement.classList.remove("dark");
      } else {
        setIsDarkMode(true);
        document.documentElement.classList.add("dark");
      }
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("theme", next ? "dark" : "light");
        if (next) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      return next;
    });
  };

  // Allow ESC key to exit dashboard back to landing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeView === "dashboard") {
        setActiveView("landing");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeView]);

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
        setIsConnected(true);
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
        if (s.latest_telemetry) {
          const lt = s.latest_telemetry;
          if (lt.loss !== undefined) {
            setMetrics({
              loss: lt.loss,
              valLoss: lt.val_loss ?? lt.loss,
              accuracy: lt.accuracy ?? 0.5,
              valAccuracy: lt.val_accuracy ?? 0.5,
              gradientNorm: lt.gradient_norm ?? 0.05,
              gradientVariance: lt.gradient_variance ?? 0.001,
              parameterVelocity: lt.parameter_velocity ?? 0.01,
              learningRate: lt.learning_rate ?? 0.05,
              circuitDepth: lt.circuit_depth ?? 2,
            });
          }
          if (lt.bloch) {
            const rx = lt.bloch.x ?? 0;
            const ry = lt.bloch.y ?? 0;
            const rz = lt.bloch.z ?? 1;
            const rSq = rx * rx + ry * ry + rz * rz;
            const calcPurity = Math.min(1.0, Math.max(0.5, (1 + rSq) / 2));
            setBloch({
              x: rx,
              y: ry,
              z: rz,
              qubitIndex: lt.bloch.qubitIndex || 0,
              x_mitigated: lt.bloch.x_mitigated,
              y_mitigated: lt.bloch.y_mitigated,
              z_mitigated: lt.bloch.z_mitigated,
              purity: calcPurity,
            });
          }
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
          if (latest.bloch) {
            const rx = latest.bloch.x ?? 0;
            const ry = latest.bloch.y ?? 0;
            const rz = latest.bloch.z ?? 1;
            const rSq = rx * rx + ry * ry + rz * rz;
            const calcPurity = Math.min(1.0, Math.max(0.5, (1 + rSq) / 2));
            setBloch({
              x: rx,
              y: ry,
              z: rz,
              qubitIndex: latest.bloch.qubitIndex || 0,
              x_mitigated: latest.bloch.x_mitigated,
              y_mitigated: latest.bloch.y_mitigated,
              z_mitigated: latest.bloch.z_mitigated,
              purity: calcPurity,
            });
          }
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

          if (type === "connection_established") {
            setIsConnected(true);
            if (payload?.step_count !== undefined) setStepCount(payload.step_count);
            if (payload?.pipeline_state) setPipelineState(payload.pipeline_state);
            return;
          }

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
              const rx = payload.bloch.x ?? 0;
              const ry = payload.bloch.y ?? 0;
              const rz = payload.bloch.z ?? 1;
              const rSq = rx * rx + ry * ry + rz * rz;
              const calcPurity = Math.min(1.0, Math.max(0.5, (1 + rSq) / 2));
              setBloch({
                x: rx,
                y: ry,
                z: rz,
                qubitIndex: payload.bloch.qubitIndex || 0,
                x_mitigated: payload.bloch.x_mitigated,
                y_mitigated: payload.bloch.y_mitigated,
                z_mitigated: payload.bloch.z_mitigated,
                purity: calcPurity,
              });
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
            addToast("info", "Autonomous Runner Started", "Continuous closed-loop training active.");
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
          } else if (type === "repair_deployed") {
            if (payload) {
              setDeployment(payload);
              if (payload.repair_arm) setSelectedArm(payload.repair_arm);
              setPipelineState("DEPLOYED");
            }
          } else if (type === "repair_committed") {
            if (payload) {
              setDeployment(payload);
              setPipelineState("COMMITTED");
            }
          } else if (type === "repair_rolled_back") {
            if (payload) {
              setDeployment(payload);
              setPipelineState("ROLLED_BACK");
            }
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
      fetchStatusAndPosteriors();
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
        body: JSON.stringify({ repair_arm: armId, arm: armId }),
      });
      const data = await res.json();
      if (res.ok && data.status === "DEPLOYED") {
        addToast(
          "success",
          "Repair Deployed",
          `Arm '${armId.replace(/_/g, " ")}' deployed into validation window W_val=3`
        );
        setSelectedArm(armId);
        setPipelineState("DEPLOYED");
        if (data.deployment) {
          setDeployment(data.deployment);
        }
      } else {
        const rawDetail =
          data.reason ||
          data.detail ||
          data.message ||
          "Circuit mutation prohibited by safety filter.";
        const reason =
          typeof rawDetail === "string"
            ? rawDetail
            : Array.isArray(rawDetail)
            ? rawDetail.map((d: any) => d.msg || d.message || JSON.stringify(d)).join("; ")
            : typeof rawDetail === "object" && rawDetail !== null
            ? rawDetail.msg || JSON.stringify(rawDetail)
            : String(rawDetail);
        addToast("warning", "Safety Filter Intervened", reason);
      }
    } catch (e) {
      addToast("error", "Deploy Failed", e instanceof Error ? e.message : String(e));
    }
  };

  const handleSimulateTwin = async (armId: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/simulate-twin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repair_arm: armId, arm: armId, horizon: 3 }),
      });
      const data = await res.json();
      if (res.ok && data.status !== "error") {
        addToast(
          data.is_viable ? "success" : "warning",
          "Digital Twin Simulation Complete",
          `Predicted delta: ${data.predicted_loss_delta >= 0 ? "+" : ""}${Number(data.predicted_loss_delta).toFixed(4)} (Viable: ${data.is_viable})`
        );
        setTwinPrediction(data);
        return data;
      } else {
        const rawDetail = data.detail || data.message || "Twin simulation failed";
        const reason = typeof rawDetail === "string" ? rawDetail : JSON.stringify(rawDetail);
        addToast("warning", "Simulation Alert", reason);
      }
    } catch (e) {
      addToast("error", "Twin Simulation Failed", e instanceof Error ? e.message : String(e));
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
        if (data.deployment) setDeployment(data.deployment);
      } else {
        const msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail || "No active repair to commit.");
        addToast("warning", "Commit Ignored", msg);
      }
    } catch (e) {
      addToast("error", "Commit Failed", e instanceof Error ? e.message : String(e));
    }
  };

  const handleRollback = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/experiment/rollback`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        addToast("warning", "Repair Rolled Back", "Model restored from pre-repair checkpoint snapshot.");
        setPipelineState("ROLLED_BACK");
        if (data.deployment) setDeployment(data.deployment);
      } else {
        const msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail || "No active repair to rollback.");
        addToast("warning", "Rollback Ignored", msg);
      }
    } catch (e) {
      addToast("error", "Rollback Failed", e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[var(--bg-primary)] text-[var(--content-primary)] transition-colors selection:bg-[var(--accent)] selection:text-white">
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

      {/* Unified Brand Header with Mode Toggle */}
      <Header
        isConnected={isConnected}
        pipelineState={pipelineState}
        stepCount={stepCount}
        maxSteps={maxSteps}
        isRunning={isRunning}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        onStart={handleStart}
        onPause={handlePause}
        onResume={handleResume}
        onStep={handleStep}
        onResetPrompt={() => setIsResetModalOpen(true)}
        activeView={activeView}
        onToggleView={(view) => setActiveView(view)}
      />

      {/* VIEW CONDITIONAL: LANDING VS DASHBOARD */}
      {activeView === "landing" ? (
        <main className="flex-1 w-full animate-fade-in">
          {/* Section 1: Hero */}
          <div id="hero">
            <HeroSection
              isConnected={isConnected}
              pipelineState={pipelineState}
              stepCount={stepCount}
              onExploreClick={() => {
                const el = document.getElementById("the-challenge");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              onLaunchLabClick={() => setActiveView("dashboard")}
            />
          </div>

          {/* Chapter 1: The Challenge */}
          <StoryChapter1Challenge />

          {/* Chapter 2: The Breakthrough */}
          <StoryChapter2Breakthrough />

          {/* Chapter 3: The Architecture */}
          <StoryChapter3Intelligence />

          {/* Chapter 4: Six Repair Mechanisms */}
          <StoryChapter4RepairArms />

          {/* Chapter 5: Adaptive Intelligence */}
          <StoryChapter5AdaptiveBandit />

          {/* Chapter 6: Digital Twin and Safety */}
          <StoryChapter6DigitalTwinSafety />

          {/* Chapter 7: Experimental Evidence */}
          <StoryChapter7Evidence />

          {/* Chapter 8: Limitations and Research */}
          <StoryChapter8Limitations />

          {/* Section 12: Final Call to Action */}
          <div id="cockpit-cta">
            <FinalCtaSection onLaunchLabClick={() => setActiveView("dashboard")} />
          </div>

          {/* Section 13: Editorial Brand Footer */}
          <div id="footer">
            <Footer />
          </div>
        </main>
      ) : (
        <main className="flex-1 w-full animate-fade-in py-6">
          <ErrorBoundary
            fallbackTitle="Interactive Research Laboratory Interrupted"
            onReturnToOverview={() => setActiveView("landing")}
          >
            <DashboardView
            isConnected={isConnected}
            pipelineState={pipelineState}
            stepCount={stepCount}
            maxSteps={maxSteps}
            isRunning={isRunning}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStep={handleStep}
            onResetPrompt={() => setIsResetModalOpen(true)}
            onInjectFailure={handleInjectFailure}
            onTriggerRepair={handleTriggerRepair}
            onSimulateTwin={handleSimulateTwin}
            onCommit={handleCommit}
            onRollback={handleRollback}
            metrics={metrics}
            bloch={bloch}
            history={history}
            activeAnomalies={activeAnomalies}
            diagnosis={diagnosis}
            twinPrediction={twinPrediction}
            evaluation={evaluation}
            deployment={deployment}
            banditDecision={banditDecision}
            banditPosteriors={banditPosteriors}
            episodes={episodes}
            events={events}
            onClearEvents={() => setEvents([])}
            selectedArm={selectedArm}
            eligibleArms={eligibleArms}
            optimizerName={optimizerName}
            featureMap={featureMap}
            nLayers={nLayers}
            nQbits={nQbits}
            dataset={dataset}
            API_BASE={API_BASE}
          />
          </ErrorBoundary>
        </main>
      )}
    </div>
  );
}
