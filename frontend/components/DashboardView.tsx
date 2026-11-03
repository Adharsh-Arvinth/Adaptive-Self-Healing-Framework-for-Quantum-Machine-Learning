"use client";

import React, { useState } from "react";
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
  Sparkles,
  BarChart3,
  Sliders,
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
import { MemoryAndAuditLog } from "./MemoryAndAuditLog";
import { SettingsPanel } from "./SettingsPanel";
import { BenchmarksPanel } from "./BenchmarksPanel";
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
  | "twin"
  | "bandit"
  | "memory"
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
}

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
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");

  // Synchronized single-qubit reduced mixed state purity gamma = (1 + ||r||^2)/2
  const rPhys = Math.sqrt(bloch.x * bloch.x + bloch.y * bloch.y + bloch.z * bloch.z);
  const physicalPurity = stepCount > 0 || history.length > 0
    ? Math.min(1.0, Math.max(0.5, (1.0 + rPhys * rPhys) / 2.0))
    : 1.0;

  const tabs = [
    { id: "overview" as DashboardTab, label: "01 Overview", icon: Activity },
    { id: "experiment" as DashboardTab, label: "02 Live Experiment", icon: Play },
    { id: "diagnosis" as DashboardTab, label: "03 Diagnosis & Repairs", icon: ShieldAlert },
    { id: "twin" as DashboardTab, label: "04 Digital Twin & Safety", icon: Layers },
    { id: "bandit" as DashboardTab, label: "05 Bandit Intelligence", icon: Cpu },
    { id: "memory" as DashboardTab, label: "06 Memory & Audit", icon: Database },
    { id: "settings" as DashboardTab, label: "07 Settings", icon: Settings },
  ];

  const latestTelemetry = history.length > 0 ? history[history.length - 1] : null;

  return (
    <div id="dashboard" className="space-y-8 animate-fade-in pb-16">
      {/* Top Laboratory Control Strip */}
      <div className="glass-panel p-4 tech-crosshair flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Experiment Status & Telemetry Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-xs font-bold text-[var(--content-primary)] uppercase tracking-wider">
              QUANTUM RESEARCH LAB COCKPIT
            </span>
          </div>
          <span className="text-[var(--content-tertiary)]">•</span>
          <div className="text-[11px] font-mono text-[var(--content-secondary)]">
            STATE: <span className="text-[var(--content-primary)] font-bold">{pipelineState.replace(/_/g, " ")}</span>
          </div>
          <span className="text-[var(--content-tertiary)]">•</span>
          <div className="text-[11px] font-mono text-[var(--content-secondary)]">
            STEP: <span className="text-[var(--content-primary)] font-bold">{stepCount} / {maxSteps}</span>
          </div>
        </div>

        {/* Right: Tactile Hardware-Grade Action Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] gap-1">
            {isRunning ? (
              <button
                onClick={onPause}
                className="apple-btn px-3 py-1.5 rounded-lg font-medium bg-[var(--status-warning-subtle)] text-[var(--status-warning)] flex items-center gap-1.5 active:scale-95"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            ) : stepCount > 0 ? (
              <button
                onClick={onResume}
                className="apple-btn px-3.5 py-1.5 rounded-lg font-medium bg-[var(--accent)] text-white flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume</span>
              </button>
            ) : (
              <button
                onClick={onStart}
                className="apple-btn px-3.5 py-1.5 rounded-lg font-medium bg-[var(--accent)] text-white flex items-center gap-1.5 shadow-sm active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Run</span>
              </button>
            )}

            <button
              onClick={onStep}
              disabled={isRunning}
              className="apple-btn px-2.5 py-1.5 rounded-lg text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-40 flex items-center gap-1 active:scale-95"
              title="Single-step quantum execution"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={onResetPrompt}
              className="apple-btn p-1.5 rounded-lg text-[var(--content-tertiary)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-subtle)] active:scale-95"
              title="Reset experiment and parameter state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 7-View Dedicated Segmented Navigation Ribbon */}
      <div className="flex items-center justify-start overflow-x-auto pb-1">
        <div className="flex items-center p-1 rounded-2xl glass-panel border border-[var(--border-subtle)] font-mono text-xs max-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`apple-btn flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold shadow-sm"
                    : "text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized 8-KPI Real-Time Telemetry Strip */}
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

      {/* TAB 1: SYSTEM OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
          {/* Row 1: Convergence Trajectory & 3D Bloch Sphere */}
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

          {/* Row 2: Bayesian Root-Cause Diagnosis & Transactional Deployment Monitor */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
            <DeploymentMonitor
              deployment={deployment}
              pipelineState={pipelineState}
              onCommit={onCommit}
              onRollback={onRollback}
            />
          </section>

          {/* Row 3: Six-Arm Adaptive Repair Cockpit */}
          <section>
            <RepairCockpit
              selectedArm={selectedArm}
              eligibleArms={eligibleArms}
              currentOptimizer={optimizerName}
              currentFeatureMap={featureMap}
              currentDepth={metrics.circuitDepth}
              onTriggerRepair={onTriggerRepair}
            />
          </section>
        </div>
      )}

      {/* TAB 2: LIVE EXPERIMENT RUNNER & FAILURE INJECTION */}
      {activeTab === "experiment" && (
        <div className="space-y-6 animate-fade-in">
          <section>
            <FailureInjectionPanel onInject={onInjectFailure} isRunning={isRunning} />
          </section>
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-sm font-bold font-mono uppercase text-[var(--content-primary)]">
                Active Quantum Circuit Model Configuration
              </h3>
              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">DATASET SEED</span>
                  <span className="text-[var(--content-primary)] font-bold">{dataset.toUpperCase()} (Seed 42)</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">CIRCUIT TOPOLOGY</span>
                  <span className="text-[var(--content-primary)] font-bold">{nQbits} Qubits • {nLayers} Layers</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">CLASSICAL OPTIMIZER</span>
                  <span className="text-[var(--content-primary)] font-bold">{optimizerName.toUpperCase()}</span>
                </div>
                <div className="p-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
                  <span className="text-[10px] text-[var(--content-tertiary)] block">FEATURE EMBEDDING</span>
                  <span className="text-[var(--content-primary)] font-bold">{featureMap.toUpperCase()}</span>
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

      {/* TAB 3: DIAGNOSIS & REPAIRS */}
      {activeTab === "diagnosis" && (
        <div className="space-y-6 animate-fade-in">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
            <DeploymentMonitor
              deployment={deployment}
              pipelineState={pipelineState}
              onCommit={onCommit}
              onRollback={onRollback}
            />
          </section>
          <section>
            <RepairCockpit
              selectedArm={selectedArm}
              eligibleArms={eligibleArms}
              currentOptimizer={optimizerName}
              currentFeatureMap={featureMap}
              currentDepth={metrics.circuitDepth}
              onTriggerRepair={onTriggerRepair}
            />
          </section>
        </div>
      )}

      {/* TAB 4: DIGITAL TWIN & SAFETY */}
      {activeTab === "twin" && (
        <div className="space-y-6 animate-fade-in">
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DigitalTwinPanel
              prediction={twinPrediction}
              evaluation={evaluation}
              onSimulateTwin={onSimulateTwin}
              selectedArm={selectedArm}
            />
            <DeploymentMonitor
              deployment={deployment}
              pipelineState={pipelineState}
              onCommit={onCommit}
              onRollback={onRollback}
            />
          </section>
        </div>
      )}

      {/* TAB 5: BANDIT INTELLIGENCE */}
      {activeTab === "bandit" && (
        <div className="space-y-6 animate-fade-in">
          <section>
            <BanditMonitor
              decision={banditDecision}
              posteriors={banditPosteriors}
              currentTelemetry={latestTelemetry}
            />
          </section>
        </div>
      )}

      {/* TAB 6: MEMORY & AUDIT */}
      {activeTab === "memory" && (
        <div className="space-y-6 animate-fade-in">
          <section>
            <MemoryAndAuditLog
              episodes={episodes}
              events={events}
              onClearEvents={onClearEvents}
            />
          </section>
        </div>
      )}

      {/* TAB 7: SETTINGS & BENCHMARKS */}
      {activeTab === "settings" && (
        <div className="space-y-6 animate-fade-in">
          <section>
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
          </section>
          <section>
            <BenchmarksPanel apiBase={API_BASE} />
          </section>
        </div>
      )}
    </div>
  );
};
