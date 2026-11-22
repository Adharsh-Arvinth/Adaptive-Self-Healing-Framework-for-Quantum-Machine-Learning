"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Activity,
  ShieldAlert,
  Layers,
  Cpu,
  Database,
  Settings,
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Sliders,
  ShieldCheck,
  History,
  Search,
  BarChart3,
} from "lucide-react";
import { MetricsRow } from "./MetricsRow";
import { LossChart } from "./LossChart";
import { BlochSphere } from "./BlochSphere";
import { DiagnosisPanel } from "./DiagnosisPanel";
import { DeploymentMonitor } from "./DeploymentMonitor";
import { RepairCockpit } from "./RepairCockpit";
import { FailureInjectionPanel } from "./FailureInjectionPanel";
import { DigitalTwinPanel } from "./DigitalTwinPanel";
import { BanditMonitor } from "./BanditMonitor";
import { SettingsPanel } from "./SettingsPanel";
import { BenchmarksPanel } from "./BenchmarksPanel";
import { ErrorBoundary } from "./ErrorBoundary";
import { LabTour, TourTab } from "./LabTour";
import { AppearancePanel } from "./appearance/AppearancePanel";
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

export type DashboardTab =
  | "overview"
  | "experiment"
  | "diagnosis"
  | "repairs"
  | "twin"
  | "safety"
  | "bandit"
  | "memory"
  | "audit"
  | "evidence"
  | "settings";

interface DashboardViewProps {
  isConnected: boolean;
  pipelineState: string;
  stepCount: number;
  maxSteps: number;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onResetPrompt: () => void;
  onInjectFailure: (failureType: string, severity: number) => Promise<void> | void;
  onTriggerRepair: (armId: string) => Promise<void> | void;
  onSimulateTwin: (armId: string) => Promise<DigitalTwinPrediction | null>;
  onCommit: () => Promise<void> | void;
  onRollback: () => Promise<void> | void;
  metrics: {
    loss: number;
    valLoss: number;
    accuracy: number;
    valAccuracy: number;
    gradientNorm: number;
    gradientVariance: number;
    parameterVelocity: number;
    learningRate: number;
    circuitDepth: number;
  };
  bloch: {
    x: number;
    y: number;
    z: number;
    qubitIndex?: number;
    x_mitigated?: number;
    y_mitigated?: number;
    z_mitigated?: number;
    purity?: number;
  };
  history: TelemetryPoint[];
  activeAnomalies: string[];
  diagnosis: DiagnosisData | null;
  twinPrediction: DigitalTwinPrediction | null;
  evaluation: EvaluationRecord | null;
  deployment: DeploymentRecord | null;
  banditDecision: BanditDecisionData | null;
  banditPosteriors: Record<string, PosteriorData> | null;
  episodes: Episode[];
  events: EventItem[];
  onClearEvents: () => void;
  selectedArm: string | null;
  eligibleArms: string[];
  optimizerName: string;
  featureMap: string;
  nLayers: number;
  nQbits: number;
  dataset: string;
  API_BASE: string;
  seed?: number;
  stepDelayMs?: number;
  onApplyConfig?: (cfg: any) => void;
  onStartExperimentWithConfig?: (cfg: any) => void;
  /** Incrementing this number (from the header's Tour button) opens the guided tour. */
  tourSignal?: number;
}

const TOUR_KEY = "shqml-lab-tour-v1";

export const DashboardView: React.FC<DashboardViewProps> = ({
  isConnected,
  pipelineState,
  stepCount,
  maxSteps,
  isRunning,
  onStart,
  onPause,
  onResume,
  onStep,
  onResetPrompt,
  onInjectFailure,
  onTriggerRepair,
  onSimulateTwin,
  onCommit,
  onRollback,
  metrics,
  bloch,
  history,
  activeAnomalies,
  diagnosis,
  twinPrediction,
  evaluation,
  deployment,
  banditDecision,
  banditPosteriors,
  episodes,
  events,
  onClearEvents,
  selectedArm,
  eligibleArms,
  optimizerName,
  featureMap,
  nLayers,
  nQbits,
  dataset,
  API_BASE,
  seed = 42,
  stepDelayMs = 250,
  onApplyConfig,
  onStartExperimentWithConfig,
  tourSignal = 0,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [tourOpen, setTourOpen] = useState(false);

  // First visit: open the guided tour automatically (remembered per browser).
  useEffect(() => {
    try {
      if (!window.localStorage.getItem(TOUR_KEY)) setTourOpen(true);
    } catch {
      /* storage unavailable: skip auto-open */
    }
  }, []);
  useEffect(() => {
    if (tourSignal > 0) setTourOpen(true);
  }, [tourSignal]);
  const closeTour = useCallback(() => {
    setTourOpen(false);
    try {
      window.localStorage.setItem(TOUR_KEY, "done");
    } catch {
      /* ignore */
    }
  }, []);
  const onTourTab = useCallback((t: TourTab) => setActiveTab(t as DashboardTab), []);
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState("all");

  const rPhys = Math.sqrt(bloch.x * bloch.x + bloch.y * bloch.y + bloch.z * bloch.z);
  const physicalPurity =
    stepCount > 0 || history.length > 0
      ? Math.min(1.0, Math.max(0.5, (1.0 + rPhys * rPhys) / 2.0))
      : 1.0;

  // Decouple independent lifecycle states (Part 8)
  const isCompleted = stepCount >= maxSteps && stepCount > 0;
  const trainingStateDisplay: "IDLE" | "RUNNING" | "PAUSED" | "COMPLETED" = isCompleted
    ? "COMPLETED"
    : isRunning
    ? "RUNNING"
    : stepCount > 0
    ? "PAUSED"
    : "IDLE";

  let deploymentStateDisplay = "NO CANDIDATE";
  if (deployment?.status) {
    const s = String(deployment.status).toUpperCase();
    if (s.includes("COMMIT")) deploymentStateDisplay = "COMMITTED";
    else if (s.includes("ROLLBACK")) deploymentStateDisplay = "ROLLED BACK";
    else if (s.includes("VALIDAT")) deploymentStateDisplay = "VALIDATING";
    else if (s.includes("CANDIDATE")) deploymentStateDisplay = "CANDIDATE SELECTED";
    else deploymentStateDisplay = s.replace(/_/g, " ");
  } else if (pipelineState === "VALIDATING_REPAIR") {
    deploymentStateDisplay = "VALIDATING";
  } else if (pipelineState === "COMMITTED") {
    deploymentStateDisplay = "COMMITTED";
  } else if (pipelineState === "ROLLED_BACK") {
    deploymentStateDisplay = "ROLLED BACK";
  }

  const tabs = [
    { id: "overview" as DashboardTab, label: "Dashboard", icon: Activity, group: "Run" },
    { id: "experiment" as DashboardTab, label: "Inject faults", icon: Play, group: "Run" },
    { id: "settings" as DashboardTab, label: "Settings", icon: Settings, group: "Run" },
    { id: "diagnosis" as DashboardTab, label: "Diagnosis", icon: ShieldAlert, group: "Understand" },
    { id: "repairs" as DashboardTab, label: "Repairs", icon: Sliders, group: "Understand" },
    { id: "twin" as DashboardTab, label: "Digital twin", icon: Layers, group: "Understand" },
    { id: "safety" as DashboardTab, label: "Deployment", icon: ShieldCheck, group: "Understand" },
    { id: "bandit" as DashboardTab, label: "Bandit", icon: Cpu, group: "Understand" },
    { id: "memory" as DashboardTab, label: "Memory", icon: Database, group: "Records" },
    { id: "audit" as DashboardTab, label: "Audit log", icon: History, group: "Records" },
    { id: "evidence" as DashboardTab, label: "Evidence", icon: BarChart3, group: "Records" },
  ];

  const latestTelemetry = history.length > 0 ? history[history.length - 1] : null;

  const filteredEpisodes = episodes.filter((ep) => {
    const matchesSearch =
      ep.diagnosed_cause?.toLowerCase().includes(memorySearch.toLowerCase()) ||
      ep.selected_repair?.toLowerCase().includes(memorySearch.toLowerCase()) ||
      ep.episode_id?.toLowerCase().includes(memorySearch.toLowerCase());
    const matchesStatus =
      memoryFilter === "all" || ep.status?.toLowerCase() === memoryFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const progress = maxSteps > 0 ? Math.min(1, stepCount / maxSteps) : 0;

  const human = (v?: string | null) => (v ? v.replace(/_/g, " ") : "");
  const faultInjected = activeAnomalies.length > 0 || !!diagnosis?.primary_cause || events.some((e) => /inject/i.test(e.message));
  const nextStep: { stage: number; title: string; body: string; action?: { label: string; run: () => void } } =
    !isConnected
      ? { stage: 0, title: "Connecting to the simulator…", body: "The free backend sleeps when idle. The first connection can take up to a minute; everything starts automatically." }
      : isCompleted
      ? { stage: 3, title: "Run complete", body: "Start a fresh experiment to try another fault.", action: { label: "New experiment", run: onResetPrompt } }
      : stepCount === 0
      ? { stage: 0, title: "Start training the quantum classifier", body: "Let it run for about ten healthy steps so the detector learns what normal looks like for this run.", action: { label: "Start training", run: onStart } }
      : stepCount < 10 && !faultInjected
      ? { stage: 0, title: "Training is warming up", body: `Step ${stepCount} of about 10 healthy steps. Watch the loss fall and the accuracy rise.` }
      : !faultInjected
      ? { stage: 1, title: "Now break it on purpose", body: "Open Inject faults and pick one. A learning-rate fault at 1.0x has the clearest signature.", action: { label: "Inject a fault", run: () => setActiveTab("experiment") } }
      : { stage: 2, title: "Watch it diagnose and heal", body: "Diagnosis appears within a few steps; a repair is rehearsed, deployed on probation, then committed or rolled back.", action: { label: "Open diagnosis", run: () => setActiveTab("diagnosis") } };

  const diagValue = diagnosis?.primary_cause ? human(diagnosis.primary_cause) : "No fault";
  const depStatus = deploymentStateDisplay;
  const summaryCards: { label: string; value: string; detail: string; tab: DashboardTab; tone: string }[] = [
    {
      label: "Diagnosis",
      value: diagValue,
      detail: diagnosis?.primary_cause
        ? `${Math.round((diagnosis.confidence || 0) * 100)}% confidence · ${diagnosis.confidence_gate_cleared ? "gate cleared, repairing" : "below the 60% gate, waiting"}`
        : "All telemetry within its normal range",
      tab: "diagnosis",
      tone: diagnosis?.primary_cause ? "text-[var(--status-warning)]" : "text-[var(--status-success)]",
    },
    {
      label: "Deployment",
      value: depStatus === "NO CANDIDATE" ? "Idle" : depStatus,
      detail: deployment?.repair_arm ? `Repair: ${human(deployment.repair_arm)}` : selectedArm ? `Chosen repair: ${human(selectedArm)}` : "No repair in progress",
      tab: "safety",
      tone: depStatus === "COMMITTED" ? "text-[var(--status-success)]" : depStatus === "ROLLED BACK" ? "text-[var(--status-danger)]" : "text-[var(--content-primary)]",
    },
    {
      label: "Memory",
      value: `${episodes.length}`,
      detail: episodes.length === 1 ? "past repair episode remembered" : "past repair episodes remembered",
      tab: "memory",
      tone: "text-[var(--content-primary)]",
    },
  ];
  const phase = String(pipelineState || "IDLE").replace(/_/g, " ");
  const tiles: { label: string; value: string; tone?: "ok" | "warn" | "bad" | "accent" }[] = [
    { label: "Training", value: trainingStateDisplay, tone: trainingStateDisplay === "RUNNING" ? "ok" : trainingStateDisplay === "COMPLETED" ? "accent" : undefined },
    {
      label: "Deployment",
      value: deploymentStateDisplay === "NO CANDIDATE" ? "IDLE" : deploymentStateDisplay,
      tone: deploymentStateDisplay === "COMMITTED" ? "ok" : deploymentStateDisplay === "ROLLED BACK" ? "bad" : deploymentStateDisplay === "VALIDATING" ? "warn" : undefined,
    },
    { label: "Pipeline phase", value: phase },
  ];
  const toneClass = (t?: string) =>
    t === "ok" ? "text-[var(--status-success)]" : t === "warn" ? "text-[var(--status-warning)]" : t === "bad" ? "text-[var(--status-danger)]" : t === "accent" ? "text-[var(--accent)]" : "text-[var(--content-primary)]";

  return (
    <div id="dashboard" className="pb-24 font-sans">
      {/* Guided tour (portalled to <body>) */}
      <LabTour open={tourOpen} onClose={closeTour} onTab={onTourTab} />

      {/* ─── Race-control header ─────────────────────────────────────────── */}
      <section className="pt-6 sm:pt-10 pb-8">
        <div className="flex items-center gap-4 text-[var(--content-secondary)]">
          <span className="type-label flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--status-success)] animate-pulse-dot" : "bg-[var(--status-warning)]"}`} />
            {isConnected ? "Live · connected to the quantum backend" : "Connecting to the backend…"}
          </span>
          <span className="h-px flex-1 bg-[var(--border-subtle)]" />
          <span className="type-label hidden sm:inline tabular">{dataset.toUpperCase()} · seed {seed} · {nQbits}q × {nLayers}L · {optimizerName.toUpperCase()}</span>
        </div>

        <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-10 items-end">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="xl:col-span-5 type-condensed text-[clamp(4.5rem,11vw,10rem)] text-[var(--content-primary)]"
          >
            Live lab<span className="text-[var(--accent)]">.</span>
          </motion.h1>

          <div className="xl:col-span-7 space-y-5">
            {/* Timing-board tiles */}
            <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-[var(--border-subtle)]">
              <div className="border-r border-b border-[var(--border-subtle)] p-4">
                <div className="type-label text-[var(--content-tertiary)]">Step</div>
                <div className="type-condensed text-5xl mt-1 tabular text-[var(--content-primary)]">
                  {stepCount}
                  <span className="text-[var(--content-tertiary)] text-3xl">/{maxSteps}</span>
                </div>
              </div>
              {tiles.map((t) => (
                <div key={t.label} className="border-r border-b border-[var(--border-subtle)] p-4 min-w-0">
                  <div className="type-label text-[var(--content-tertiary)]">{t.label}</div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={t.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      className={`type-condensed text-[1.9rem] leading-tight mt-2 truncate ${toneClass(t.tone)}`}
                      title={t.value}
                    >
                      {t.value}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Controls */}
            <div data-tour="controls" className="flex flex-wrap items-center gap-2.5">
              {isCompleted ? (
                <button onClick={onResetPrompt} className="btn-ink apple-btn bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">
                  <RotateCcw className="w-4 h-4" /> New experiment
                </button>
              ) : isRunning ? (
                <button onClick={onPause} className="btn-ink apple-btn bg-[var(--content-primary)] text-[var(--bg-primary)]">
                  <Pause className="w-4 h-4" /> Pause
                </button>
              ) : (
                <button onClick={stepCount === 0 ? onStart : onResume} className="btn-ink apple-btn bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_12px_28px_-14px_var(--accent)]">
                  <Play className="w-4 h-4 fill-current" /> {stepCount === 0 ? "Start training" : "Resume"}
                </button>
              )}
              <button
                onClick={onStep}
                disabled={isRunning || isCompleted}
                className="btn-ink apple-btn border border-[var(--border-highlight)] text-[var(--content-primary)] hover:border-[var(--content-primary)] disabled:opacity-40"
                title="Run a single training step"
              >
                <StepForward className="w-4 h-4" /> Step
              </button>
              <button
                onClick={onResetPrompt}
                className="btn-ink apple-btn border border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--status-danger)] hover:border-[var(--status-danger)]"
                title="Reset weights, optimizer and telemetry"
              >
                <RotateCcw className="w-4 h-4" /> Reset
              </button>
              <div className="flex-1 min-w-[8rem] h-1 rounded-full bg-[var(--border-subtle)] overflow-hidden ml-1" aria-label={`Training progress ${Math.round(progress * 100)}%`}>
                <motion.div
                  className="h-full bg-[var(--accent)] origin-left"
                  initial={false}
                  animate={{ scaleX: progress }}
                  transition={{ type: "spring", bounce: 0, duration: 0.6 }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Tab rail (sticky, sliding indicator) ────────────────────────── */}
      <div className="sticky top-16 z-30 -mx-3 sm:-mx-6 px-3 sm:px-6 py-3 bg-c-bg-primary/85 backdrop-blur-xl border-y border-[var(--border-subtle)]">
        <div data-tour="tabs" className="flex items-center gap-1 overflow-x-auto scrollbar-none" role="tablist" aria-label="Lab sections">
          {tabs.map((tab, ti) => {
            const newGroup = ti === 0 || tabs[ti - 1].group !== tab.group;
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <React.Fragment key={tab.id}>
              {newGroup && (
                <span className={`hidden md:flex shrink-0 items-center gap-2 type-label text-[var(--content-tertiary)] ${ti > 0 ? "ml-3 pl-4 border-l border-[var(--border-subtle)]" : "mr-1"}`}>
                  {tab.group}
                </span>
              )}
              <button
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`relative shrink-0 flex items-center gap-2 h-10 px-4 rounded-full text-sm font-medium transition-colors duration-200 ${
                  isActive ? "text-[var(--bg-primary)]" : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="lab-tab-pill"
                    className="absolute inset-0 rounded-full bg-[var(--content-primary)]"
                    transition={{ type: "spring", bounce: 0, duration: 0.45 }}
                  />
                )}
                <TabIcon className="relative w-4 h-4" />
                <span className="relative whitespace-nowrap">{tab.label}</span>
              </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* ─── Tab content (cross-fades between tabs) ───────────────────────── */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.38, ease: [0.23, 1, 0.32, 1] }}
          className="pt-8 space-y-6 lab-stagger"
        >
      {/* VIEW 1: DASHBOARD (calm overview; details live in their own sections) */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* What to do next */}
          <div className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center gap-5 lg:gap-8">
              <div className="flex-1 min-w-0">
                <div className="type-label text-[var(--accent)]">Next step</div>
                <div className="type-wide text-[clamp(1.25rem,1.8vw,1.75rem)] mt-1">{nextStep.title}</div>
                <p className="text-[var(--content-secondary)] mt-1.5 max-w-2xl">{nextStep.body}</p>
              </div>
              <ol className="flex items-center gap-2 shrink-0" aria-label="Walkthrough progress">
                {["Train", "Break", "Watch"].map((label, i) => (
                  <li key={label} className="flex items-center gap-2">
                    <span
                      className={`h-9 px-3.5 rounded-full flex items-center gap-2 text-sm font-medium border transition-colors duration-300 ${
                        i < nextStep.stage
                          ? "bg-[var(--content-primary)] text-[var(--bg-primary)] border-[var(--content-primary)]"
                          : i === nextStep.stage
                          ? "border-[var(--accent)] text-[var(--accent)]"
                          : "border-[var(--border-subtle)] text-[var(--content-tertiary)]"
                      }`}
                    >
                      <span className="type-label tabular">{String(i + 1).padStart(2, "0")}</span>
                      {label}
                    </span>
                    {i < 2 && <span className="w-4 h-px bg-[var(--border-highlight)]" />}
                  </li>
                ))}
              </ol>
              {nextStep.action && (
                <button onClick={nextStep.action.run} className="btn-ink apple-btn bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shrink-0">
                  {nextStep.action.label}
                </button>
              )}
            </div>
          </div>

          <div data-tour="metrics">
            <MetricsRow
              loss={stepCount > 0 ? metrics.loss : 0}
              valLoss={stepCount > 0 ? metrics.valLoss : 0}
              accuracy={stepCount > 0 ? metrics.accuracy : 0}
              valAccuracy={stepCount > 0 ? metrics.valAccuracy : 0}
              gradientNorm={stepCount > 0 ? metrics.gradientNorm : 0}
              gradientVariance={metrics.gradientVariance}
              parameterVelocity={stepCount > 0 ? metrics.parameterVelocity : 0}
              learningRate={metrics.learningRate}
              circuitDepth={metrics.circuitDepth}
              purity={physicalPurity}
            />
          </div>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <LossChart history={history} />
            </div>
            <div>
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

          {/* Summaries that open the detailed sections */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {summaryCards.map((c) => (
              <button
                key={c.label}
                onClick={() => setActiveTab(c.tab)}
                className="interactive-card group text-left rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 flex flex-col justify-between min-h-[11rem]"
              >
                <div className="flex items-center justify-between">
                  <span className="type-label text-[var(--content-tertiary)]">{c.label}</span>
                  <span className="text-sm text-[var(--content-secondary)] group-hover:text-[var(--accent)] transition-colors duration-200">Open →</span>
                </div>
                <div>
                  <div className={`type-condensed text-[2.4rem] leading-none mt-4 ${c.tone}`}>{c.value}</div>
                  <div className="text-sm text-[var(--content-secondary)] mt-2">{c.detail}</div>
                </div>
              </button>
            ))}
          </section>
        </div>
      )}

      {/* VIEW 2: LIVE EXPERIMENTS & FAULT INJECTION */}
      {activeTab === "experiment" && (
        <div className="space-y-6">
          <section data-tour="inject">
            <FailureInjectionPanel onInject={onInjectFailure} isRunning={isRunning} />
          </section>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[var(--content-primary)]">
                Active Quantum Circuit Model Configuration
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[11px] text-[var(--content-tertiary)] block">DATASET SEED</span>
                  <span className="text-[var(--content-primary)] font-semibold mt-0.5 block">{dataset.toUpperCase()} (Seed {seed})</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[11px] text-[var(--content-tertiary)] block">CIRCUIT TOPOLOGY</span>
                  <span className="text-[var(--content-primary)] font-semibold mt-0.5 block">{nQbits} Qubits • {nLayers} Layers</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[11px] text-[var(--content-tertiary)] block">CLASSICAL OPTIMIZER</span>
                  <span className="text-[var(--content-primary)] font-semibold mt-0.5 block">{optimizerName.toUpperCase()}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[11px] text-[var(--content-tertiary)] block">FEATURE EMBEDDING</span>
                  <span className="text-[var(--content-primary)] font-semibold mt-0.5 block">{featureMap.toUpperCase()} Map</span>
                </div>
              </div>
            </div>

            <DeploymentMonitor
              deployment={deployment}
              pipelineState={pipelineState}
              onCommit={onCommit}
              onRollback={onRollback}
            />
          </section>
        </div>
      )}

      {/* VIEW 3: FAILURE DIAGNOSIS */}
      {activeTab === "diagnosis" && (
        <div className="space-y-6">
          <div data-tour="diagnosis">
            <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
          </div>
        </div>
      )}

      {/* VIEW 4: REPAIR ACTUATORS */}
      {activeTab === "repairs" && (
        <div className="space-y-6">
          <div data-tour="repairs">
          <ErrorBoundary fallbackTitle="Repair Actuator Matrix Interrupted">
            <RepairCockpit
              selectedArm={selectedArm}
              eligibleArms={eligibleArms}
              currentOptimizer={optimizerName}
              currentFeatureMap={featureMap}
              currentDepth={metrics.circuitDepth}
              onTriggerRepair={onTriggerRepair}
              onSimulateTwin={onSimulateTwin}
              deployment={deployment}
              pipelineState={pipelineState}
              onCommit={onCommit}
              onRollback={onRollback}
            />
          </ErrorBoundary>
          </div>
        </div>
      )}

      {/* VIEW 5: DIGITAL TWIN */}
      {activeTab === "twin" && (
        <div className="space-y-6">
          <DigitalTwinPanel
            prediction={twinPrediction}
            evaluation={evaluation}
            onSimulateTwin={onSimulateTwin}
            selectedArm={selectedArm}
          />
        </div>
      )}

      {/* VIEW 6: SAFETY & DEPLOYMENT */}
      {activeTab === "safety" && (
        <div className="space-y-6" data-tour="deployment">
          <DeploymentMonitor
            deployment={deployment}
            pipelineState={pipelineState}
            onCommit={onCommit}
            onRollback={onRollback}
          />
        </div>
      )}

      {/* VIEW 7: BANDIT INTELLIGENCE */}
      {activeTab === "bandit" && (
        <div className="space-y-6">
          <BanditMonitor
            decision={banditDecision}
            posteriors={banditPosteriors}
            currentTelemetry={latestTelemetry}
          />
        </div>
      )}

      {/* VIEW 8: PERSISTENT MEMORY */}
      {activeTab === "memory" && (
        <div className="space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--content-primary)]">
                    Episodic Failure Memory Store (SQLite Backend)
                  </h3>
                </div>
                <p className="text-xs text-[var(--content-secondary)] mt-0.5">
                  Cosine similarity nearest-neighbor lookup over 12D historical failure embeddings
                </p>
              </div>

              <div className="text-xs text-[var(--content-secondary)] font-mono">
                {filteredEpisodes.length} / {episodes.length} Episodes
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--content-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search episodes by cause, repair arm, or ID..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none focus:border-[var(--border-highlight)]"
                />
              </div>

              <select
                value={memoryFilter}
                onChange={(e) => setMemoryFilter(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none"
              >
                <option value="all">All Outcomes</option>
                <option value="resolved">Resolved</option>
                <option value="rolled_back">Rolled Back</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Episodes Table */}
            <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[11px] text-[var(--content-tertiary)]">
                  <tr>
                    <th className="p-3">EPISODE ID</th>
                    <th className="p-3">DIAGNOSED CAUSE</th>
                    <th className="p-3">REPAIR ARM</th>
                    <th className="p-3">LOSS IMPROVEMENT</th>
                    <th className="p-3">REWARD</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)] font-mono">
                  {filteredEpisodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[var(--content-tertiary)] font-sans">
                        No episodic memory records found.
                      </td>
                    </tr>
                  ) : (
                    filteredEpisodes.map((ep) => (
                      <tr key={ep.episode_id} className="hover:bg-c-bg-subtle/50 transition-colors">
                        <td className="p-3 font-semibold text-[var(--content-primary)]">{ep.episode_id.slice(0, 12)}...</td>
                        <td className="p-3 text-[var(--accent)] font-semibold font-sans">{ep.diagnosed_cause}</td>
                        <td className="p-3 text-[var(--content-secondary)] font-sans">{ep.selected_repair}</td>
                        <td className="p-3">
                          <span className={ep.loss_improvement >= 0 ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}>
                            {ep.loss_improvement >= 0 ? "-" : "+"}{Math.abs(ep.loss_improvement).toFixed(4)}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-[var(--content-primary)]">{ep.reward.toFixed(4)}</td>
                        <td className="p-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ep.status === "RESOLVED"
                              ? "bg-[var(--status-success-subtle)] text-[var(--status-success)]"
                              : ep.status === "ROLLED_BACK"
                              ? "bg-[var(--status-warning-subtle)] text-[var(--status-warning)]"
                              : "bg-[var(--status-danger-subtle)] text-[var(--status-danger)]"
                          }`}>
                            {ep.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 9: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <div className="glass-panel p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[var(--accent)]" />
                  <h3 className="text-sm font-semibold text-[var(--content-primary)]">
                    Deterministic Chronological Audit Log
                  </h3>
                </div>
                <p className="text-xs text-[var(--content-secondary)] mt-0.5">
                  State machine transitions, transaction snapshots, and diagnostic traces
                </p>
              </div>

              <button
                onClick={onClearEvents}
                className="apple-btn px-3 py-1 rounded-lg border border-[var(--border-subtle)] text-xs text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
              >
                Clear Log
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 text-xs">
              {events.length === 0 ? (
                <div className="p-8 text-center text-[var(--content-tertiary)]">
                  Audit log buffer is currently empty.
                </div>
              ) : (
                events.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent)]">
                          {ev.state}
                        </span>
                        <span className="text-[10px] text-[var(--content-tertiary)] font-mono">
                          EVENT #{events.length - idx}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--content-primary)]">{ev.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 10: SETTINGS & BENCHMARKS */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <section id="appearance" className="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <div className="type-label text-[var(--accent)]">Appearance</div>
                <h2 className="type-condensed text-[clamp(2.5rem,5vw,4rem)] mt-1">Make it yours</h2>
              </div>
              <p className="text-sm text-[var(--content-secondary)] max-w-md">
                Day or night, six colour palettes and five typefaces. Your choice is saved in this browser and applies to the whole site.
              </p>
            </div>
            <AppearancePanel />
          </section>
          <section>
            <SettingsPanel
              optimizerName={optimizerName}
              featureMap={featureMap}
              nLayers={nLayers}
              nQbits={nQbits}
              dataset={dataset}
              learningRate={metrics.learningRate}
              maxSteps={maxSteps}
              seed={seed}
              stepDelayMs={stepDelayMs}
              history={history}
              episodes={episodes}
              apiBase={API_BASE}
              isBackendConnected={isConnected}
              trainingState={trainingStateDisplay}
              onApplyConfig={onApplyConfig}
              onStartExperimentWithConfig={onStartExperimentWithConfig}
              onResetToDefaults={onResetPrompt}
            />
          </section>
        </div>
      )}

      {/* VIEW 11: BENCHMARK EVIDENCE */}
      {activeTab === "evidence" && (
        <div>
          <BenchmarksPanel apiBase={API_BASE} />
        </div>
      )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
