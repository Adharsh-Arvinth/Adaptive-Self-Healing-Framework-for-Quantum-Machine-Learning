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
  ShieldCheck,
  History,
  Terminal,
  Search,
  ExternalLink,
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
  const [memorySearch, setMemorySearch] = useState("");
  const [memoryFilter, setMemoryFilter] = useState("all");

  // Synchronized single-qubit reduced mixed state purity gamma = (1 + ||r||^2)/2
  const rPhys = Math.sqrt(bloch.x * bloch.x + bloch.y * bloch.y + bloch.z * bloch.z);
  const physicalPurity =
    stepCount > 0 || history.length > 0
      ? Math.min(1.0, Math.max(0.5, (1.0 + rPhys * rPhys) / 2.0))
      : 1.0;

  const tabs = [
    { id: "overview" as DashboardTab, label: "01 Overview", icon: Activity },
    { id: "experiment" as DashboardTab, label: "02 Live Experiments", icon: Play },
    { id: "diagnosis" as DashboardTab, label: "03 Failure Diagnosis", icon: ShieldAlert },
    { id: "repairs" as DashboardTab, label: "04 Repair Intelligence", icon: Sliders },
    { id: "twin" as DashboardTab, label: "05 Digital Twin", icon: Layers },
    { id: "safety" as DashboardTab, label: "06 Safety & Deployment", icon: ShieldCheck },
    { id: "bandit" as DashboardTab, label: "07 Bandit Intelligence", icon: Cpu },
    { id: "memory" as DashboardTab, label: "08 Persistent Memory", icon: Database },
    { id: "audit" as DashboardTab, label: "09 Audit History", icon: History },
    { id: "settings" as DashboardTab, label: "10 Settings", icon: Settings },
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

  return (
    <div id="dashboard" className="space-y-8 animate-fade-in pb-16">
      {/* Top Laboratory Control Strip */}
      <div className="glass-panel p-4 tech-crosshair flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Experiment Status & Telemetry Tag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
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
            ) : (
              <button
                onClick={stepCount === 0 ? onStart : onResume}
                className="apple-btn px-3 py-1.5 rounded-lg font-medium bg-[var(--accent)] text-white shadow-sm flex items-center gap-1.5 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{stepCount === 0 ? "Start Autonomous" : "Resume"}</span>
              </button>
            )}

            <button
              onClick={onStep}
              disabled={isRunning || stepCount >= maxSteps}
              className="apple-btn px-3 py-1.5 rounded-lg font-medium hover:bg-[var(--bg-surface)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] disabled:opacity-40 flex items-center gap-1.5 active:scale-95"
              title="Execute a single discrete parameter-shift descent step"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={onResetPrompt}
              className="apple-btn p-1.5 rounded-lg font-medium hover:bg-[var(--status-danger-subtle)] text-[var(--content-secondary)] hover:text-[var(--status-danger)] active:scale-95 transition-colors"
              title="Reset model weights, optimizer buffers, and telemetry history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 10-Tab Navigation Dock */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-[var(--border-subtle)] scrollbar-none font-mono text-xs">
        {tabs.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap ${
                isActive
                  ? "bg-[var(--content-primary)] text-[var(--bg-primary)] font-bold shadow-sm"
                  : "text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Synchronized 8-KPI Real-Time Strip */}
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

      {/* VIEW 1: SYSTEM OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-6 animate-fade-in">
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

      {/* VIEW 2: LIVE EXPERIMENTS */}
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

      {/* VIEW 3: FAILURE DIAGNOSIS */}
      {activeTab === "diagnosis" && (
        <div className="space-y-6 animate-fade-in">
          <DiagnosisPanel diagnosis={diagnosis} activeAnomalies={activeAnomalies} />
        </div>
      )}

      {/* VIEW 4: REPAIR INTELLIGENCE */}
      {activeTab === "repairs" && (
        <div className="space-y-6 animate-fade-in">
          <RepairCockpit
            selectedArm={selectedArm}
            eligibleArms={eligibleArms}
            currentOptimizer={optimizerName}
            currentFeatureMap={featureMap}
            currentDepth={metrics.circuitDepth}
            onTriggerRepair={onTriggerRepair}
          />
        </div>
      )}

      {/* VIEW 5: DIGITAL TWIN */}
      {activeTab === "twin" && (
        <div className="space-y-6 animate-fade-in">
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
        <div className="space-y-6 animate-fade-in">
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
        <div className="space-y-6 animate-fade-in">
          <BanditMonitor
            decision={banditDecision}
            posteriors={banditPosteriors}
            currentTelemetry={latestTelemetry}
          />
        </div>
      )}

      {/* VIEW 8: PERSISTENT MEMORY */}
      {activeTab === "memory" && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[var(--accent)]" />
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase text-[var(--content-primary)]">
                    Episodic Failure Memory Store (SQLite Backend)
                  </h3>
                  <span className="text-xs text-[var(--content-secondary)] font-mono">
                    `data/failure_memory.db` • Cosine Similarity Nearest-Neighbor Search (k=3)
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[var(--content-secondary)]">
                  {filteredEpisodes.length} / {episodes.length} Episodes
                </span>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--content-tertiary)]" />
                <input
                  type="text"
                  placeholder="Search memory episodes by cause, repair arm, or episode ID..."
                  value={memorySearch}
                  onChange={(e) => setMemorySearch(e.target.value)}
                  className="w-full text-xs font-mono pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none focus:border-[var(--border-highlight)]"
                />
              </div>

              <select
                value={memoryFilter}
                onChange={(e) => setMemoryFilter(e.target.value)}
                className="text-xs font-mono px-3 py-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--content-primary)] focus:outline-none"
              >
                <option value="all">All Outcomes</option>
                <option value="resolved">Resolved</option>
                <option value="rolled_back">Rolled Back</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Episodes Table */}
            <div className="border border-[var(--border-subtle)] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-[11px] text-[var(--content-tertiary)]">
                  <tr>
                    <th className="p-3">EPISODE ID</th>
                    <th className="p-3">CAUSE</th>
                    <th className="p-3">REPAIR ARM</th>
                    <th className="p-3">LOSS DELTA</th>
                    <th className="p-3">REWARD</th>
                    <th className="p-3">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredEpisodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[var(--content-tertiary)]">
                        No episodic memory records found matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredEpisodes.map((ep) => (
                      <tr key={ep.episode_id} className="hover:bg-[var(--bg-subtle)]/50 transition-colors">
                        <td className="p-3 font-bold text-[var(--content-primary)]">{ep.episode_id.slice(0, 12)}...</td>
                        <td className="p-3 text-[var(--accent)] font-semibold">{ep.diagnosed_cause}</td>
                        <td className="p-3 text-[var(--content-secondary)]">{ep.selected_repair}</td>
                        <td className="p-3">
                          <span className={ep.loss_improvement >= 0 ? "text-[var(--status-success)]" : "text-[var(--status-danger)]"}>
                            {ep.loss_improvement >= 0 ? "-" : "+"}{Math.abs(ep.loss_improvement).toFixed(4)}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-[var(--content-primary)]">{ep.reward.toFixed(4)}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
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

      {/* VIEW 9: AUDIT HISTORY */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-panel p-6 space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[var(--accent)]" />
                <div>
                  <h3 className="text-sm font-bold font-mono uppercase text-[var(--content-primary)]">
                    Deterministic Chronological Audit Log
                  </h3>
                  <span className="text-xs text-[var(--content-secondary)] font-mono">
                    State Machine Transitions • Transaction Snapshots • Diagnostic Traces
                  </span>
                </div>
              </div>

              <button
                onClick={onClearEvents}
                className="apple-btn px-3 py-1 rounded-lg border border-[var(--border-subtle)] text-xs font-mono text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
              >
                Clear Log
              </button>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 font-mono text-xs">
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
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--accent)]">
                          {ev.state}
                        </span>
                        <span className="text-[10px] text-[var(--content-tertiary)]">
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
