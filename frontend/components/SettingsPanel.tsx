"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sliders,
  Download,
  Cpu,
  ShieldCheck,
  HardDrive,
  Activity,
  Layers,
  Zap,
  RotateCcw,
  AlertTriangle,
  Lock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Database,
  Radio,
  FileSpreadsheet,
  FileCode,
  Terminal,
  Settings as SettingsIcon,
  Play,
  Eye,
  Check,
  RefreshCw,
} from "lucide-react";
import { TelemetryPoint, Episode } from "@/types";

export interface SettingsPanelProps {
  optimizerName: string;
  featureMap: string;
  nLayers: number;
  nQbits: number;
  dataset: string;
  learningRate: number;
  maxSteps?: number;
  seed?: number;
  stepDelayMs?: number;
  history: TelemetryPoint[];
  episodes?: Episode[];
  apiBase?: string;
  isBackendConnected?: boolean;
  trainingState?: string;
  onApplyConfig?: (newConfig: {
    dataset: string;
    nQbits: number;
    nLayers: number;
    featureMap: string;
    optimizerName: string;
    learningRate: number;
    maxSteps: number;
    seed: number;
    stepDelayMs: number;
    confidenceThreshold?: number;
    validationWindow?: number;
    oscillationWindow?: number;
  }) => void;
  onStartExperimentWithConfig?: (newConfig: {
    dataset: string;
    nQbits: number;
    nLayers: number;
    featureMap: string;
    optimizerName: string;
    learningRate: number;
    maxSteps: number;
    seed: number;
    stepDelayMs: number;
    confidenceThreshold?: number;
    validationWindow?: number;
    oscillationWindow?: number;
  }) => void;
  onResetToDefaults?: () => void;
  density?: "comfortable" | "compact";
  onDensityChange?: (density: "comfortable" | "compact") => void;
  isDarkMode?: boolean;
  onToggleTheme?: (mode?: "dark" | "light" | "system") => void;
}

type SettingsSection =
  | "general"
  | "experiment"
  | "circuit"
  | "optimization"
  | "overrides"
  | "invariants"
  | "connectivity"
  | "export"
  | "about";

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  optimizerName,
  featureMap,
  nLayers,
  nQbits,
  dataset,
  learningRate,
  maxSteps = 60,
  seed = 42,
  stepDelayMs = 250,
  history,
  episodes = [],
  apiBase = "http://127.0.0.1:8000",
  isBackendConnected = false,
  trainingState = "IDLE",
  onApplyConfig,
  onStartExperimentWithConfig,
  onResetToDefaults,
  density = "comfortable",
  onDensityChange,
  isDarkMode = true,
  onToggleTheme,
}) => {
  const [activeSection, setActiveSection] = useState<SettingsSection>("general");

  // Draft Experiment Configuration
  const [draftDataset, setDraftDataset] = useState(dataset);
  const [draftNQbits, setDraftNQbits] = useState(nQbits);
  const [draftNLayers, setDraftNLayers] = useState(nLayers);
  const [draftFeatureMap, setDraftFeatureMap] = useState(featureMap);
  const [draftOptimizerName, setDraftOptimizerName] = useState(optimizerName);
  const [draftLearningRate, setDraftLearningRate] = useState(learningRate);
  const [draftMaxSteps, setDraftMaxSteps] = useState(maxSteps);
  const [draftSeed, setDraftSeed] = useState(seed);
  const [draftStepDelayMs, setDraftStepDelayMs] = useState(stepDelayMs);

  // Category B: Advanced Research Overrides
  const [enableOverrides, setEnableOverrides] = useState(false);
  const [draftConfidenceThreshold, setDraftConfidenceThreshold] = useState(0.60);
  const [draftValidationWindow, setDraftValidationWindow] = useState(3);
  const [draftOscillationWindow, setDraftOscillationWindow] = useState(4);
  const [overrideConfirmed, setOverrideConfirmed] = useState(false);

  // General Preferences
  const [themePreference, setThemePreference] = useState<"dark" | "light" | "system">("dark");
  const [densityPreference, setDensityPreference] = useState<"comfortable" | "compact">(density);
  const [animationSpeed, setAnimationSpeed] = useState<"cinematic" | "subtle" | "reduced">("cinematic");
  const [toastDuration, setToastDuration] = useState<number>(4000);
  const [confirmDestructive, setConfirmDestructive] = useState<boolean>(true);
  const [numericPrecision, setNumericPrecision] = useState<number>(4);
  const [defaultChartDisplay, setDefaultChartDisplay] = useState<"dual" | "loss" | "accuracy">("dual");

  // Status & Notification
  const [saveBanner, setSaveBanner] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Real Health Ping & Connectivity Telemetry
  const [latency, setLatency] = useState<number | null>(null);
  const [httpStatus, setHttpStatus] = useState<string | null>(null);
  const [frameworkVersion, setFrameworkVersion] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Load Preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("qml_user_settings_v1");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.theme) setThemePreference(parsed.theme);
          if (parsed.density) {
            setDensityPreference(parsed.density);
            onDensityChange?.(parsed.density);
          }
          if (parsed.animations) setAnimationSpeed(parsed.animations);
          if (parsed.toastDuration) setToastDuration(parsed.toastDuration);
          if (parsed.confirmDestructive !== undefined) setConfirmDestructive(parsed.confirmDestructive);
          if (parsed.numericPrecision) setNumericPrecision(parsed.numericPrecision);
          if (parsed.defaultChartDisplay) setDefaultChartDisplay(parsed.defaultChartDisplay);
          if (parsed.draftDataset) setDraftDataset(parsed.draftDataset);
          if (parsed.draftNQbits) setDraftNQbits(parsed.draftNQbits);
          if (parsed.draftNLayers) setDraftNLayers(parsed.draftNLayers);
          if (parsed.draftFeatureMap) setDraftFeatureMap(parsed.draftFeatureMap);
          if (parsed.draftOptimizerName) setDraftOptimizerName(parsed.draftOptimizerName);
          if (parsed.draftLearningRate) setDraftLearningRate(parsed.draftLearningRate);
          if (parsed.draftMaxSteps) setDraftMaxSteps(parsed.draftMaxSteps);
          if (parsed.draftSeed) setDraftSeed(parsed.draftSeed);
        }
      } catch (e) {
        console.warn("Could not parse saved user settings:", e);
      }
    }
  }, [onDensityChange]);

  // Synchronize when parent props change
  useEffect(() => {
    setDraftDataset(dataset);
    setDraftNQbits(nQbits);
    setDraftNLayers(nLayers);
    setDraftFeatureMap(featureMap);
    setDraftOptimizerName(optimizerName);
    setDraftLearningRate(learningRate);
    setDraftMaxSteps(maxSteps);
    setDraftSeed(seed);
    setDraftStepDelayMs(stepDelayMs);
  }, [dataset, nQbits, nLayers, featureMap, optimizerName, learningRate, maxSteps, seed, stepDelayMs]);

  // Real /health ping
  const testPing = useCallback(async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch(`${apiBase}/health`);
      const diff = Math.round(performance.now() - start);
      if (res.ok) {
        const data = await res.json();
        setLatency(diff);
        setHttpStatus(`${res.status} OK`);
        setFrameworkVersion(data.framework || "PennyLane 0.45.1");
        setLastChecked(new Date().toLocaleTimeString());
      } else {
        setLatency(diff);
        setHttpStatus(`HTTP ${res.status}`);
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch {
      // Fallback try /api/health
      try {
        const res2 = await fetch(`${apiBase}/api/health`);
        const diff2 = Math.round(performance.now() - start);
        if (res2.ok) {
          const data2 = await res2.json();
          setLatency(diff2);
          setHttpStatus(`${res2.status} OK`);
          setFrameworkVersion(data2.framework || "PennyLane 0.45.1");
          setLastChecked(new Date().toLocaleTimeString());
        } else {
          setLatency(-1);
          setHttpStatus("Unreachable");
          setLastChecked(new Date().toLocaleTimeString());
        }
      } catch {
        setLatency(-1);
        setHttpStatus("Offline / Unreachable");
        setLastChecked(new Date().toLocaleTimeString());
      }
    } finally {
      setIsPinging(false);
    }
  }, [apiBase]);

  // Run ping on mount
  useEffect(() => {
    testPing();
  }, [testPing]);

  // Presets definition
  const applyPreset = (presetKey: "demo" | "standard" | "research" | "benchmark") => {
    if (presetKey === "demo") {
      setDraftDataset("moons");
      setDraftNQbits(2);
      setDraftNLayers(2);
      setDraftFeatureMap("Angle");
      setDraftOptimizerName("Adam");
      setDraftLearningRate(0.05);
      setDraftMaxSteps(30);
      setDraftSeed(42);
      setDraftStepDelayMs(150);
      setSaveBanner("Applied preset: Quick Demo (30 steps, 2 Qubits)");
    } else if (presetKey === "standard") {
      setDraftDataset("moons");
      setDraftNQbits(2);
      setDraftNLayers(2);
      setDraftFeatureMap("Angle");
      setDraftOptimizerName("Adam");
      setDraftLearningRate(0.05);
      setDraftMaxSteps(60);
      setDraftSeed(42);
      setDraftStepDelayMs(250);
      setSaveBanner("Applied preset: Standard Experiment (60 steps, recommended)");
    } else if (presetKey === "research") {
      setDraftDataset("circles");
      setDraftNQbits(2);
      setDraftNLayers(3);
      setDraftFeatureMap("IQP");
      setDraftOptimizerName("Adam");
      setDraftLearningRate(0.02);
      setDraftMaxSteps(100);
      setDraftSeed(123);
      setDraftStepDelayMs(200);
      setSaveBanner("Applied preset: Research Deep Experiment (100 steps, IQP map)");
    } else if (presetKey === "benchmark") {
      setDraftDataset("moons");
      setDraftNQbits(2);
      setDraftNLayers(2);
      setDraftFeatureMap("Angle");
      setDraftOptimizerName("Adam");
      setDraftLearningRate(0.05);
      setDraftMaxSteps(60);
      setDraftSeed(42);
      setDraftStepDelayMs(250);
      setEnableOverrides(false);
      setDraftConfidenceThreshold(0.60);
      setSaveBanner("Applied preset: Stage 8 Benchmark Reproduction (Frozen Commit 7d37201)");
    }
    setTimeout(() => setSaveBanner(null), 4000);
  };

  // Save Settings to localStorage & Propagate
  const handleSaveSettings = () => {
    const payload = {
      theme: themePreference,
      density: densityPreference,
      animations: animationSpeed,
      toastDuration,
      confirmDestructive,
      numericPrecision,
      defaultChartDisplay,
      draftDataset,
      draftNQbits,
      draftNLayers,
      draftFeatureMap,
      draftOptimizerName,
      draftLearningRate,
      draftMaxSteps,
      draftSeed,
      draftStepDelayMs,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem("qml_user_settings_v1", JSON.stringify(payload));
    }

    if (onToggleTheme) {
      onToggleTheme(themePreference);
    }
    if (onDensityChange) {
      onDensityChange(densityPreference);
    }

    // Apply configuration to application state
    onApplyConfig?.({
      dataset: draftDataset,
      nQbits: draftNQbits,
      nLayers: draftNLayers,
      featureMap: draftFeatureMap,
      optimizerName: draftOptimizerName,
      learningRate: draftLearningRate,
      maxSteps: draftMaxSteps,
      seed: draftSeed,
      stepDelayMs: draftStepDelayMs,
      confidenceThreshold: enableOverrides ? draftConfidenceThreshold : 0.60,
      validationWindow: enableOverrides ? draftValidationWindow : 3,
      oscillationWindow: enableOverrides ? draftOscillationWindow : 4,
    });

    setSaveBanner("Configuration saved & active across local session.");
    setTimeout(() => setSaveBanner(null), 4000);
  };

  const handleResetDefaults = () => {
    setDraftDataset("moons");
    setDraftNQbits(2);
    setDraftNLayers(2);
    setDraftFeatureMap("Angle");
    setDraftOptimizerName("Adam");
    setDraftLearningRate(0.05);
    setDraftMaxSteps(60);
    setDraftSeed(42);
    setDraftStepDelayMs(250);
    setEnableOverrides(false);
    setDraftConfidenceThreshold(0.60);
    setDraftValidationWindow(3);
    setDraftOscillationWindow(4);
    setThemePreference("dark");
    setDensityPreference("comfortable");
    setAnimationSpeed("cinematic");
    setNumericPrecision(4);
    setConfirmDestructive(true);
    setSaveBanner("Reset to recommended baseline defaults.");
    setTimeout(() => setSaveBanner(null), 4000);
  };

  // Export 1: CSV Telemetry Time-Series
  const handleExportCSV = () => {
    if (history.length === 0) return;
    const headers = [
      "step",
      "loss",
      "val_loss",
      "accuracy",
      "val_accuracy",
      "gradient_norm",
      "gradient_variance",
      "parameter_velocity",
      "learning_rate",
      "circuit_depth",
      "bloch_x",
      "bloch_y",
      "bloch_z",
      "purity",
      "pipeline_state",
      "selected_arm",
    ];

    const rows = history.map((pt) => {
      const bloch = pt.bloch || { x: 0, y: 0, z: 1 };
      const rSq = (bloch.x || 0) ** 2 + (bloch.y || 0) ** 2 + (bloch.z || 1) ** 2;
      const purity = Math.min(1.0, Math.max(0.5, (1 + rSq) / 2));
      return [
        pt.step,
        pt.loss.toFixed(6),
        (pt.val_loss ?? pt.loss).toFixed(6),
        pt.accuracy.toFixed(6),
        (pt.val_accuracy ?? pt.accuracy).toFixed(6),
        (pt.gradient_norm ?? 0).toFixed(6),
        (pt.gradient_variance ?? 0).toFixed(6),
        (pt.parameter_velocity ?? 0).toFixed(6),
        (pt.learning_rate ?? draftLearningRate).toFixed(6),
        pt.circuit_depth ?? draftNLayers,
        (bloch.x ?? 0).toFixed(6),
        (bloch.y ?? 0).toFixed(6),
        (bloch.z ?? 1).toFixed(6),
        purity.toFixed(6),
        `"${pt.state || "RUNNING"}"`,
        `"${pt.selected_arm || "NONE"}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qml_telemetry_history_${draftDataset}_step_${history.length}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export 2: JSON Active Experiment Record
  const handleExportJSON = () => {
    const payload = {
      experiment_id: `exp_${draftDataset}_${Date.now()}`,
      exported_at: new Date().toISOString(),
      provenance: {
        baseline_commit: "7d37201aead20c7e5678585c998b51206bc49339",
        framework: "PennyLane 0.45.1",
        engine: "CPU Statevector Default.Qubit",
      },
      configuration: {
        dataset: draftDataset,
        qubits: draftNQbits,
        layers: draftNLayers,
        parameters_count: 2 * draftNLayers * draftNQbits,
        feature_map: draftFeatureMap,
        optimizer: draftOptimizerName,
        learning_rate: draftLearningRate,
        max_steps: draftMaxSteps,
        seed: draftSeed,
        overrides_active: enableOverrides,
        confidence_threshold: enableOverrides ? draftConfidenceThreshold : 0.60,
      },
      telemetry_steps_count: history.length,
      history,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qml_experiment_run_${draftDataset}_steps_${history.length}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Export 3: Complete Audit Package Dossier
  const handleExportAuditDossier = () => {
    const auditPackage = {
      framework_title: "Adaptive Self-Healing Framework for Quantum Machine Learning",
      provenance: {
        baseline_commit_full: "7d37201aead20c7e5678585c998b51206bc49339",
        baseline_commit_short: "7d37201",
        verified_campaign: "Stage 8 Empirical Benchmark (3,000 executed episodes across 900 unique initialisations)",
        calibration: {
          episodes_calibration: 150,
          episodes_test_heldout: 150,
          production_gate: { threshold: 0.60, temperature: 0.50, ece: 0.4295, brier: 0.8645, fpr: 0.9583, coverage: 0.96 },
          calibrated_analysis: { threshold: 0.84, temperature: 1.70, ece: 0.1939, brier: 0.5768, fpr_observed: 0.0, fpr_95_upper_bound: 0.0499, fdr_95_upper_bound: 0.1372, coverage: 0.1667, tpr: 0.3205 },
        },
        policy_regret_10seeds: {
          thompson_sampling: { reward: "-4.94 ± 0.28", rollback_rate: "10.7 ± 2.8%" },
          greedy: { reward: "-4.75 ± 0.76", rollback_rate: "17.3 ± 4.3%" },
          heuristic: { reward: "-5.45 ± 0.78", rollback_rate: "23.0 ± 3.7%" },
          random: { reward: "-5.01 ± 0.64", rollback_rate: "16.3 ± 3.7%" },
          p_values: { vs_heuristic: 0.0559, vs_greedy: 0.3282, vs_random: 0.6746 },
        },
      },
      current_session: {
        active_config: {
          dataset: draftDataset,
          n_qubits: draftNQbits,
          n_layers: draftNLayers,
          feature_map: draftFeatureMap,
          optimizer_name: draftOptimizerName,
          learning_rate: draftLearningRate,
          max_steps: draftMaxSteps,
          seed: draftSeed,
        },
        episodes_recorded_count: episodes.length,
        telemetry_samples_recorded: history.length,
      },
      episodes_sample: episodes.slice(-20),
    };

    const blob = new Blob([JSON.stringify(auditPackage, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `qml_complete_audit_dossier_stage8.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const circuitParamCount = 2 * draftNLayers * draftNQbits;

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner with Quick Actions */}
      <div className="glass-panel p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <SettingsIcon className="w-5 h-5 text-[var(--accent)]" />
            <h1 className="text-base font-bold text-[var(--content-primary)] tracking-tight">
              Control Centre &amp; Experiment Configuration
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              VQC ARCHITECTURE
            </span>
          </div>
          <p className="text-xs text-[var(--content-secondary)] leading-relaxed max-w-2xl">
            Configure variational hyperparameters, dataset topology, classical optimization, diagnostic thresholds, live telemetry feeds, and empirical data exports.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="apple-btn px-3 py-1.5 rounded-xl text-xs font-medium text-[var(--content-secondary)] hover:text-[var(--content-primary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] flex items-center gap-1.5 active:scale-95 transition-all"
            title="Restore recommended research defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
          <button
            onClick={handleSaveSettings}
            className="apple-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Save Preferences</span>
          </button>
          <button
            onClick={() => setIsPreviewOpen(true)}
            className="apple-btn px-3.5 py-1.5 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview &amp; Run</span>
          </button>
        </div>
      </div>

      {saveBanner && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveBanner}</span>
        </div>
      )}

      {/* Main Two-Column Layout: Navigation Dock + Configuration Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-1 glass-panel p-3 space-y-1">
          {[
            { id: "general", label: "General & Appearance", icon: Sliders },
            { id: "experiment", label: "Experiment & Presets", icon: Sparkles },
            { id: "circuit", label: "Quantum Circuit Topology", icon: Cpu },
            { id: "optimization", label: "Classical Optimization", icon: Zap },
            { id: "overrides", label: "Research Overrides (B)", icon: AlertTriangle, badge: enableOverrides ? "Active" : undefined },
            { id: "invariants", label: "Locked Invariants (C)", icon: Lock },
            { id: "connectivity", label: "Connectivity Monitor", icon: Radio, badge: latency && latency > 0 ? `${latency}ms` : undefined },
            { id: "export", label: "Data Management & Export", icon: Download },
            { id: "about", label: "Scientific Provenance", icon: ShieldCheck },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id as SettingsSection)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
                  isActive
                    ? "bg-[var(--accent)] text-white font-semibold shadow-sm"
                    : "text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${
                      isActive ? "bg-white/20 text-white" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Configuration Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* TAB 1: GENERAL & APPEARANCE */}
          {activeSection === "general" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4">
                <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[var(--accent)]" />
                  General Preferences &amp; Interface Ergonomics
                </h2>
                <p className="text-xs text-[var(--content-secondary)] mt-1">
                  Customise display density, colour theme, animation timing, and formatting across sessions.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Theme Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Colour Palette Theme
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "dark", label: "Dark Obsidian" },
                      { id: "light", label: "Light Precision" },
                      { id: "system", label: "System Sync" },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setThemePreference(t.id as "dark" | "light" | "system");
                          onToggleTheme?.(t.id as "dark" | "light" | "system");
                        }}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          themePreference === t.id
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold shadow-sm"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--content-tertiary)] block">
                    Defaults to cinematic dark obsidian with Apple Liquid Retina &amp; motorsport styling.
                  </span>
                </div>

                {/* Interface Density */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Interface Density
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "comfortable", label: "Comfortable (Default)" },
                      { id: "compact", label: "Compact Density" },
                    ].map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setDensityPreference(d.id as "comfortable" | "compact");
                          onDensityChange?.(d.id as "comfortable" | "compact");
                        }}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          densityPreference === d.id
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--content-tertiary)] block">
                    Controls padding and row height across telemetry tables and cockpit cards.
                  </span>
                </div>

                {/* Animation Preferences */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Animation Physics &amp; Motion
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "cinematic", label: "Cinematic (Apple)" },
                      { id: "subtle", label: "Subtle (Crisp)" },
                      { id: "reduced", label: "Reduced Motion" },
                    ].map((a) => (
                      <button
                        key={a.id}
                        onClick={() => setAnimationSpeed(a.id as "cinematic" | "subtle" | "reduced")}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          animationSpeed === a.id
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numeric Precision */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Scientific Decimal Precision
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { val: 4, label: "4 Decimals (e.g. 0.0500)" },
                      { val: 3, label: "3 Decimals (e.g. 0.050)" },
                    ].map((p) => (
                      <button
                        key={p.val}
                        onClick={() => setNumericPrecision(p.val)}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          numericPrecision === p.val
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Default Chart View */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Default Loss Chart Representation
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "dual", label: "Loss & Accuracy" },
                      { id: "loss", label: "Loss Only" },
                      { id: "accuracy", label: "Accuracy Only" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setDefaultChartDisplay(c.id as "dual" | "loss" | "accuracy")}
                        className={`p-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                          defaultChartDisplay === c.id
                            ? "bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)] font-semibold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Destructive Confirmations */}
                <div className="space-y-2 flex flex-col justify-between p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  <div>
                    <span className="text-xs font-medium text-[var(--content-primary)] block">
                      Destructive Action Confirmation
                    </span>
                    <span className="text-[11px] text-[var(--content-tertiary)] block mt-0.5">
                      Prompt confirmation dialog prior to clearing session memory or resetting model weights.
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setConfirmDestructive(!confirmDestructive)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        confirmDestructive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                      }`}
                    >
                      {confirmDestructive ? "Enabled (Recommended)" : "Disabled"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXPERIMENT CONFIGURATION & PRESETS */}
          {activeSection === "experiment" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[var(--accent)]" />
                    Experiment Configuration &amp; Presets
                  </h2>
                  <p className="text-xs text-[var(--content-secondary)] mt-1">
                    Select supported synthetic or benchmark datasets and choose pre-validated experiment presets.
                  </p>
                </div>
              </div>

              {/* 4 Supported Presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-[var(--content-primary)] block">
                  1-Click Experiment Presets
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    {
                      id: "demo",
                      title: "Quick Demo",
                      desc: "Moons • 2Q • 2L • 30 steps",
                      badge: "Fast Evaluation",
                      action: () => applyPreset("demo"),
                    },
                    {
                      id: "standard",
                      title: "Standard Experiment",
                      desc: "Moons • 2Q • 2L • 60 steps",
                      badge: "Recommended",
                      action: () => applyPreset("standard"),
                    },
                    {
                      id: "research",
                      title: "Research Deep Run",
                      desc: "Circles • 2Q • 3L • 100 steps",
                      badge: "High Expressibility",
                      action: () => applyPreset("research"),
                    },
                    {
                      id: "benchmark",
                      title: "Stage 8 Baseline",
                      desc: "Moons • Commit 7d37201",
                      badge: "Frozen Record",
                      action: () => applyPreset("benchmark"),
                    },
                  ].map((p) => (
                    <div
                      key={p.id}
                      className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] transition-all flex flex-col justify-between space-y-2"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-[var(--content-primary)]">{p.title}</h4>
                          <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20">
                            {p.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--content-secondary)] mt-1">{p.desc}</p>
                      </div>
                      <button
                        onClick={p.action}
                        className="apple-btn w-full py-1.5 rounded-lg text-xs font-medium bg-[var(--bg-primary)] hover:bg-[var(--accent)] hover:text-white border border-[var(--border-subtle)] text-[var(--content-secondary)] transition-all"
                      >
                        Apply Preset
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dataset Selection */}
              <div className="space-y-3 pt-2 border-t border-[var(--border-subtle)]">
                <span className="text-xs font-semibold text-[var(--content-primary)] block">
                  Quantum Classification Dataset (Validated Backend Drivers)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: "moons",
                      name: "Interleaved Half-Moons",
                      desc: "Dual non-linear interleaved half-moons. Canonical quantum classifier testbed with non-trivial decision boundary curvature.",
                      badge: "Standard VQC",
                      samples: "200 samples (70% train / 30% val)",
                    },
                    {
                      id: "circles",
                      name: "Concentric Circles",
                      desc: "Concentric circular distributions testing non-linear radial Hilbert space mappings and barren plateau resilience.",
                      badge: "Non-Linear Radial",
                      samples: "200 samples (70% train / 30% val)",
                    },
                    {
                      id: "iris",
                      name: "Iris Binary Classification",
                      desc: "Fisher Iris benchmark (Setosa vs Versicolor) projected into 2D feature subspace for Hilbert statevector embedding.",
                      badge: "Real-World Tabular",
                      samples: "100 samples (70% train / 30% val)",
                    },
                  ].map((ds) => (
                    <div
                      key={ds.id}
                      onClick={() => setDraftDataset(ds.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
                        draftDataset === ds.id
                          ? "bg-[var(--accent)]/10 border-[var(--accent)] shadow-sm"
                          : "bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-highlight)]"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h4 className="text-xs font-bold text-[var(--content-primary)]">{ds.name}</h4>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-subtle)] text-[var(--content-secondary)] border border-[var(--border-subtle)]">
                            {ds.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">{ds.desc}</p>
                      </div>
                      <div className="text-[10px] font-mono text-[var(--content-tertiary)] pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
                        <span>{ds.samples}</span>
                        {draftDataset === ds.id && (
                          <span className="text-[var(--accent)] font-bold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Training Budget & Seeds */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[var(--border-subtle)]">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Training Step Budget (max_steps)
                  </label>
                  <select
                    value={draftMaxSteps}
                    onChange={(e) => setDraftMaxSteps(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--content-primary)] font-mono focus:border-[var(--accent)] outline-none"
                  >
                    <option value={30}>30 Steps (Rapid Evaluation)</option>
                    <option value={60}>60 Steps (Standard Experiment)</option>
                    <option value={100}>100 Steps (Convergence Study)</option>
                    <option value={150}>150 Steps (Deep Training)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    PRNG Random Seed
                  </label>
                  <input
                    type="number"
                    value={draftSeed}
                    onChange={(e) => setDraftSeed(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--content-primary)] font-mono focus:border-[var(--accent)] outline-none"
                    placeholder="42"
                  />
                  <span className="text-[10px] text-[var(--content-tertiary)] block">
                    Fixed seed ensures deterministic dataset partition and initial parameters.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Autonomous Step Delay (ms)
                  </label>
                  <select
                    value={draftStepDelayMs}
                    onChange={(e) => setDraftStepDelayMs(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--content-primary)] font-mono focus:border-[var(--accent)] outline-none"
                  >
                    <option value={100}>100ms (High Speed)</option>
                    <option value={200}>200ms (Smooth Telemetry)</option>
                    <option value={250}>250ms (Recommended)</option>
                    <option value={500}>500ms (Cinematic Inspection)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: QUANTUM CIRCUIT TOPOLOGY */}
          {activeSection === "circuit" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4">
                <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  Quantum Circuit Architecture &amp; Hilbert Space Mapping
                </h2>
                <p className="text-xs text-[var(--content-secondary)] mt-1">
                  Adjust register width, parameterized ansatz layers, and feature encoding strategies within the verified expressibility envelope.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Qubit Register Count */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-[var(--content-primary)]">
                      Quantum Register Qubits (n_qubits)
                    </label>
                    <span className="text-xs font-mono font-bold text-cyan-400">{draftNQbits} Qubits</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[2, 4].map((q) => (
                      <button
                        key={q}
                        onClick={() => setDraftNQbits(q)}
                        className={`p-3 rounded-xl text-xs font-medium border text-center transition-all ${
                          draftNQbits === q
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-400 font-bold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        {q} Qubits {q === 2 ? "(Default / Validated)" : "(Expanded Register)"}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--content-tertiary)] block">
                    Supported range: 2 or 4 qubits with PennyLane CPU statevector engine.
                  </span>
                </div>

                {/* Ansatz Depth Layers */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-[var(--content-primary)]">
                      Parameterized Ansatz Depth L (Layers)
                    </label>
                    <span className="text-xs font-mono font-bold text-cyan-400">L = {draftNLayers}</span>
                  </div>
                  <input
                    type="range"
                    min={2}
                    max={6}
                    step={1}
                    value={draftNLayers}
                    onChange={(e) => setDraftNLayers(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--content-tertiary)]">
                    <span>L = 2 (Min Bound L_min)</span>
                    <span>L = 4 (Recommended)</span>
                    <span>L = 6 (Max Depth)</span>
                  </div>
                  <span className="text-[11px] text-[var(--content-tertiary)] block">
                    Safety invariant strictly clamps depth to L &ge; 2 to prevent expressibility collapse.
                  </span>
                </div>

                {/* Feature Map Encoding */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Hilbert Space Feature Encoding Strategy
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "Angle", name: "Angle Encoding", desc: "Rotational mapping R_Y(x_i). Direct and resilient to small gradient fluctuations." },
                      { id: "IQP", name: "IQP Kernel Map", desc: "Instantaneous Quantum Poly-time entangling map. Higher non-linear expressibility." },
                    ].map((fm) => (
                      <button
                        key={fm.id}
                        onClick={() => setDraftFeatureMap(fm.id)}
                        className={`p-3 rounded-xl text-left border transition-all ${
                          draftFeatureMap.toLowerCase() === fm.id.toLowerCase()
                            ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 font-semibold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        <div className="text-xs font-bold text-[var(--content-primary)]">{fm.name}</div>
                        <div className="text-[10px] text-[var(--content-secondary)] mt-1">{fm.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Real-Time Parameter Counter */}
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-bold text-[var(--content-primary)] flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                      Variational Parameter Equation
                    </span>
                    <p className="text-[11px] text-[var(--content-secondary)] mt-1">
                      Rotational angles per layer: 2 &times; L &times; n_qubits
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] font-mono text-xs flex justify-between items-center">
                    <span className="text-[var(--content-secondary)]">Total Variational Weights (&theta;):</span>
                    <span className="text-cyan-400 font-bold text-sm">
                      {circuitParamCount} parameters
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLASSICAL OPTIMIZATION */}
          {activeSection === "optimization" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4">
                <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-emerald-400" />
                  Classical Optimizer &amp; Learning Rate Dynamics
                </h2>
                <p className="text-xs text-[var(--content-secondary)] mt-1">
                  Select parameter-shift descent optimizers, configure learning rate step sizes, and inspect momentum reset rules.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Optimizer Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--content-primary)] block">
                    Active Parameter-Shift Optimizer
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "Adam", name: "ADAM", desc: "Adaptive moments (β1=0.9, β2=0.999)" },
                      { id: "RMSprop", name: "RMSprop", desc: "Root mean square gradient decay" },
                      { id: "SGD", name: "SGD", desc: "Stochastic gradient with momentum=0.9" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setDraftOptimizerName(opt.id)}
                        className={`p-3 rounded-xl text-center border transition-all ${
                          draftOptimizerName.toLowerCase() === opt.id.toLowerCase()
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400 font-bold"
                            : "bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                        }`}
                      >
                        <div className="text-xs font-bold text-[var(--content-primary)]">{opt.name}</div>
                        <div className="text-[10px] text-[var(--content-secondary)] mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-[var(--content-tertiary)] block">
                    Optimizer Arm 01 cycles Adam ↔ RMSprop ↔ SGD and flushes momentum buffers on repair deployment.
                  </span>
                </div>

                {/* Learning Rate Configuration */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-[var(--content-primary)]">
                      Descent Step Size &eta; (Learning Rate)
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {draftLearningRate.toFixed(4)}
                      </span>
                      <button
                        onClick={() => setDraftLearningRate(0.05)}
                        className="text-[10px] font-mono text-[var(--accent)] hover:underline"
                        title="Reset to 0.05 default"
                      >
                        (Reset 0.05)
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0.001}
                    max={0.25}
                    step={0.005}
                    value={draftLearningRate}
                    onChange={(e) => setDraftLearningRate(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[var(--content-tertiary)]">
                    <span>0.001 (Conservative)</span>
                    <span>0.050 (Recommended)</span>
                    <span>0.250 (Aggressive)</span>
                  </div>
                  <span className="text-[11px] text-[var(--content-tertiary)] block">
                    Strict bounds clamp: $[10^{-4}, 1.0]$. Values $\ge 0.15$ may induce parameter-shift oscillations.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CATEGORY B — ADVANCED RESEARCH OVERRIDES */}
          {activeSection === "overrides" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in border-amber-500/30">
              {/* Caution Banner */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-xs font-bold uppercase tracking-wider">
                    Advanced Research Overrides — Caution
                  </h3>
                </div>
                <p className="text-xs leading-relaxed text-amber-200/90">
                  These parameters govern the autonomous Bayesian inference and digital twin evaluation gates. Modifying them alters the frozen Stage 8 production baseline (&tau; = 0.60, H = 3, W_osc = 4). Overrides must remain explicit, traceable, and require affirmative confirmation.
                </p>
                <div className="pt-2 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="confirmOverrides"
                    checked={enableOverrides}
                    onChange={(e) => {
                      setEnableOverrides(e.target.checked);
                      if (!e.target.checked) setOverrideConfirmed(false);
                    }}
                    className="accent-amber-400 cursor-pointer"
                  />
                  <label htmlFor="confirmOverrides" className="text-xs font-semibold cursor-pointer">
                    Enable experimental overrides for this research session
                  </label>
                </div>
              </div>

              {enableOverrides ? (
                <div className="space-y-6 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Confidence Gate Threshold */}
                    <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-[var(--content-primary)]">
                          Diagnostic Gate Threshold &tau;
                        </label>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          &tau; = {draftConfidenceThreshold.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          onClick={() => setDraftConfidenceThreshold(0.60)}
                          className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                            draftConfidenceThreshold === 0.60
                              ? "bg-amber-500/15 border-amber-500 text-amber-300 font-semibold"
                              : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--content-secondary)]"
                          }`}
                        >
                          <div className="font-bold">Production: &tau; = 0.60</div>
                          <div className="text-[10px] text-[var(--content-secondary)]">96% coverage, baseline</div>
                        </button>
                        <button
                          onClick={() => setDraftConfidenceThreshold(0.84)}
                          className={`p-2.5 rounded-lg text-xs font-medium border text-left transition-all ${
                            draftConfidenceThreshold === 0.84
                              ? "bg-amber-500/15 border-amber-500 text-amber-300 font-semibold"
                              : "bg-[var(--bg-primary)] border-[var(--border-subtle)] text-[var(--content-secondary)]"
                          }`}
                        >
                          <div className="font-bold">Calibrated: &tau;* = 0.84</div>
                          <div className="text-[10px] text-[var(--content-secondary)]">0% FPR, 16.7% coverage</div>
                        </button>
                      </div>
                      <p className="text-[11px] text-[var(--content-tertiary)] pt-1 leading-relaxed">
                        Setting &tau; = 0.84 reduces observed false positive admissions to 0.0%, but abstains on 83.33% of episodes. Production runtime remains frozen at &tau; = 0.60.
                      </p>
                    </div>

                    {/* Twin Horizon */}
                    <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-[var(--content-primary)]">
                          Digital Twin Lookahead Horizon H
                        </label>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          H = {draftValidationWindow} steps
                        </span>
                      </div>
                      <input
                        type="range"
                        min={1}
                        max={5}
                        step={1}
                        value={draftValidationWindow}
                        onChange={(e) => setDraftValidationWindow(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] font-mono text-[var(--content-tertiary)]">
                        <span>H = 1 (Fast)</span>
                        <span>H = 3 (Frozen Baseline)</span>
                        <span>H = 5 (Deep Lookahead)</span>
                      </div>
                      <p className="text-[11px] text-[var(--content-tertiary)] pt-1 leading-relaxed">
                        Ablation study proved H=3 adds 3.8&times; circuit evaluations with marginal rollback reduction on low-depth benchmarks.
                      </p>
                    </div>

                    {/* Safety Filter Anti-Oscillation Window */}
                    <div className="space-y-2 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-[var(--content-primary)]">
                          Anti-Oscillation Window W_osc
                        </label>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          W_osc = {draftOscillationWindow} steps
                        </span>
                      </div>
                      <input
                        type="range"
                        min={2}
                        max={8}
                        step={1}
                        value={draftOscillationWindow}
                        onChange={(e) => setDraftOscillationWindow(Number(e.target.value))}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <p className="text-[11px] text-[var(--content-tertiary)] pt-1 leading-relaxed">
                        Prevents the multi-armed bandit from repeatedly deploying alternating repair arms within consecutive steps.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs font-mono text-[var(--content-secondary)] rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                  Research overrides are locked to prevent accidental modification of the Stage 8 baseline. Check the box above to unlock experimental parameters.
                </div>
              )}
            </div>
          )}

          {/* TAB 6: CATEGORY C — LOCKED INVARIANTS */}
          {activeSection === "invariants" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    Locked Framework Invariants (Protected Architecture)
                  </h2>
                  <p className="text-xs text-[var(--content-secondary)] mt-1">
                    These 10 core theoretical and architectural invariants define the published research framework and cannot be modified by user settings.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  IMMUTABLE
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    num: "01",
                    title: "Six-Arm Discrete Actuator Matrix",
                    formula: "\\mathcal{A} = \\{a_1, \\dots, a_6\\}",
                    desc: "Exactly six repair primitives: optimizer cycle, depth reduction, feature map toggle, LR scaling, noise mitigation, and warm restart.",
                  },
                  {
                    num: "02",
                    title: "12-Dimensional Contextual State",
                    formula: "s_t \\in \\mathbb{R}^{12}",
                    desc: "Loss, validation loss, accuracy, gradient norm, gradient variance, parameter velocity, circuit depth, learning rate, bloch coordinates (x,y,z), and purity.",
                  },
                  {
                    num: "03",
                    title: "Contextual Thompson Sampling",
                    formula: "r_t \\sim \\mathcal{N}(\\mu_a^T s_t, \\sigma_a^2)",
                    desc: "Bayesian linear bandit with Normal-Gamma prior distributions maintaining conjugate posterior parameter distributions per arm.",
                  },
                  {
                    num: "04",
                    title: "Production Confidence Threshold",
                    formula: "\\tau = 0.60 \\text{ (Frozen Baseline)}",
                    desc: "Diagnoses with Bayesian posterior confidence below 0.60 are held, preventing ungrounded destructive interventions.",
                  },
                  {
                    num: "05",
                    title: "Digital Twin Lookahead Horizon",
                    formula: "H = 3 \\text{ Steps}",
                    desc: "Short-horizon synthetic projection before live parameter deployment to verify loss trajectory feasibility.",
                  },
                  {
                    num: "06",
                    title: "SQLite Persistent Failure Memory",
                    formula: "\\text{data/failure_memory.db (WAL)}",
                    desc: "Persistent transactional storage capturing full anomaly context vectors, selected repairs, and empirical delta rewards.",
                  },
                  {
                    num: "07",
                    title: "Deterministic Safety Filter",
                    formula: "W_{\\text{osc}} = 4, \\, L \\ge 2, \\, \\eta \\in [10^{-4}, 1.0]",
                    desc: "Pre-execution bounding checks that enforce minimum ansatz expressibility and prevent rapid cyclic optimizer thrashing.",
                  },
                  {
                    num: "08",
                    title: "Empirical Validation Gate & Rollback",
                    formula: "R_{\\text{post}} < R_{\\text{pre}} \\implies \\text{Rollback}",
                    desc: "Candidate repairs are evaluated on validation batches; any degradation triggers automatic rollback to snapshot.",
                  },
                  {
                    num: "09",
                    title: "Atomic Memory Snapshots",
                    formula: "\\text{In-Memory Deepcopy Checkpoint}",
                    desc: "Zero-latency parameter restoration ensuring model parameters are never corrupted by speculative updates.",
                  },
                  {
                    num: "10",
                    title: "Empirical-Only Posterior Condition",
                    formula: "\\Delta \\mu_a \\propto r_{\\text{post}} - r_{\\text{pre}}",
                    desc: "Thompson sampling weights are updated exclusively on real post-deployment empirical loss deltas, never on simulator guesses.",
                  },
                ].map((inv) => (
                  <div
                    key={inv.num}
                    className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[var(--accent)] font-bold">
                          INVARIANT {inv.num}
                        </span>
                        <Lock className="w-3.5 h-3.5 text-neutral-500" />
                      </div>
                      <h4 className="text-xs font-bold text-[var(--content-primary)]">{inv.title}</h4>
                      <div className="font-mono text-[11px] text-cyan-400 my-1 bg-[var(--bg-primary)] px-2 py-1 rounded border border-[var(--border-subtle)]">
                        {inv.formula}
                      </div>
                      <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">{inv.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: BACKEND & CONNECTIVITY MONITOR (PART 5) */}
          {activeSection === "connectivity" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                    <Radio className="w-4 h-4 text-emerald-400" />
                    Backend REST &amp; WebSocket Connectivity Monitor
                  </h2>
                  <p className="text-xs text-[var(--content-secondary)] mt-1">
                    Live telemetry link, REST endpoint health check, latency verification, and simulator process status.
                  </p>
                </div>
                <button
                  onClick={testPing}
                  disabled={isPinging}
                  className="apple-btn px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? "animate-spin" : ""}`} />
                  <span>{isPinging ? "Pinging..." : "Ping /health"}</span>
                </button>
              </div>

              {/* 6 Subsystem Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {/* 1. Frontend Client */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                    Frontend Application
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-[var(--content-primary)]">Online (Next.js 14)</span>
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] block">
                    React 19 • Browser Localhost / Vercel Edge
                  </span>
                </div>

                {/* 2. Backend REST API */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                    Backend REST API
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        latency !== null && latency >= 0 ? "bg-emerald-500" : "bg-rose-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-[var(--content-primary)]">
                      {latency !== null && latency >= 0
                        ? `Reachable (${latency}ms)`
                        : isPinging
                        ? "Checking..."
                        : "Offline / Standby"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--content-secondary)] truncate block">
                    {apiBase}
                  </span>
                </div>

                {/* 3. WebSocket Telemetry Stream */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                    WebSocket Telemetry
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        isBackendConnected ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-[var(--content-primary)]">
                      {isBackendConnected ? "Connected (Stream Active)" : "Disconnected / Polling"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] block">
                    /ws/telemetry push channel
                  </span>
                </div>

                {/* 4. Quantum Simulator Engine */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                    Quantum Simulator Engine
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                    <span className="text-xs font-bold text-[var(--content-primary)]">
                      {frameworkVersion || "PennyLane 0.45.1"}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] block">
                    Default.Qubit CPU Statevector
                  </span>
                </div>

                {/* 5. Training State */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                    Training Pipeline State
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                    <span className="text-xs font-bold text-[var(--content-primary)] font-mono">
                      {trainingState}
                    </span>
                  </div>
                  <span className="text-[10px] text-[var(--content-secondary)] block">
                    Decoupled training lifecycle
                  </span>
                </div>

                {/* 6. SQLite Database */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--content-tertiary)] block">
                    SQLite Episode Memory
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-xs font-bold text-[var(--content-primary)]">
                      WAL Mode Active
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--content-secondary)] truncate block">
                    data/failure_memory.db
                  </span>
                </div>
              </div>

              {/* Ping Telemetry Card */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--content-secondary)]">Endpoint URL:</span>
                  <span className="text-[var(--content-primary)] font-semibold">{apiBase}/health</span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--content-secondary)]">HTTP Response Status:</span>
                  <span className={`font-bold ${latency !== null && latency >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {httpStatus || "Untested"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
                  <span className="text-[var(--content-secondary)]">Round-Trip Latency:</span>
                  <span className="text-[var(--accent)] font-bold">
                    {latency !== null && latency >= 0 ? `${latency} ms` : "N/A"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[var(--content-secondary)]">Last Verified Timestamp:</span>
                  <span className="text-[var(--content-primary)]">{lastChecked || "Never"}</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: DATA MANAGEMENT & EXPORT (PART 6) */}
          {activeSection === "export" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4">
                <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  Telemetry Data Management &amp; Multi-Format Export
                </h2>
                <p className="text-xs text-[var(--content-secondary)] mt-1">
                  Download empirical telemetry, tabular loss curves, and complete cryptographic audit dossiers for peer-reviewed publication.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Export 1: CSV */}
                <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 mb-2">
                      <FileSpreadsheet className="w-5 h-5" />
                      <h4 className="text-xs font-bold text-[var(--content-primary)]">Tabular CSV Telemetry</h4>
                    </div>
                    <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">
                      Download full time-series step records as a comma-separated table. Includes loss, val_loss, accuracy, gradient norm, Bloch coordinates, and purity.
                    </p>
                    <div className="mt-3 text-[10px] font-mono text-[var(--content-tertiary)]">
                      Recorded Steps: <strong>{history.length}</strong>
                    </div>
                  </div>
                  <button
                    onClick={handleExportCSV}
                    disabled={history.length === 0}
                    className="apple-btn w-full py-2 rounded-xl text-xs font-semibold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Telemetry (.CSV)</span>
                  </button>
                </div>

                {/* Export 2: JSON */}
                <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-cyan-400 mb-2">
                      <FileCode className="w-5 h-5" />
                      <h4 className="text-xs font-bold text-[var(--content-primary)]">Structured JSON Run</h4>
                    </div>
                    <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">
                      Complete hierarchical JSON serialization of current model configuration, circuit parameters, telemetry series, and runtime states.
                    </p>
                    <div className="mt-3 text-[10px] font-mono text-[var(--content-tertiary)]">
                      Format: JSON Schema v1.0
                    </div>
                  </div>
                  <button
                    onClick={handleExportJSON}
                    disabled={history.length === 0}
                    className="apple-btn w-full py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400 border border-cyan-500/30 flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Run Record (.JSON)</span>
                  </button>
                </div>

                {/* Export 3: Complete Audit Dossier */}
                <div className="p-5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-[var(--accent)] mb-2">
                      <ShieldCheck className="w-5 h-5" />
                      <h4 className="text-xs font-bold text-[var(--content-primary)]">Complete Research Dossier</h4>
                    </div>
                    <p className="text-[11px] text-[var(--content-secondary)] leading-relaxed">
                      Full audit package combining frozen baseline commit hash <code className="font-bold">7d37201</code>, calibration bounds, SQLite episodes, and multi-seed bandit distributions.
                    </p>
                    <div className="mt-3 text-[10px] font-mono text-[var(--content-tertiary)]">
                      Audit Hash: 7d37201aead20c7e5678585c998b51206bc49339
                    </div>
                  </div>
                  <button
                    onClick={handleExportAuditDossier}
                    className="apple-btn w-full py-2 rounded-xl text-xs font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Audit Dossier (.JSON)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: SCIENTIFIC PROVENANCE & ABOUT */}
          {activeSection === "about" && (
            <div className="glass-panel p-6 space-y-6 animate-fade-in">
              <div className="border-b border-[var(--border-subtle)] pb-4">
                <h2 className="text-sm font-semibold text-[var(--content-primary)] flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
                  Scientific Baseline Provenance &amp; Attribution
                </h2>
                <p className="text-xs text-[var(--content-secondary)] mt-1">
                  Cryptographic commit verification, frozen benchmark provenance, and framework citations.
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                  <div className="flex justify-between items-center text-[var(--accent)] font-bold">
                    <span>FROZEN EXPERIMENTAL RECORD</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      VERIFIED
                    </span>
                  </div>
                  <div className="text-[var(--content-primary)] text-sm font-bold">
                    Commit: 7d37201aead20c7e5678585c998b51206bc49339
                  </div>
                  <div className="text-[11px] text-[var(--content-secondary)]">
                    Short Hash: <code>7d37201</code> • Tree clean • Frozen baseline reference
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2">
                  <div className="text-[var(--content-primary)] font-semibold">Underlying Scientific Software Stack</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-[11px] text-[var(--content-secondary)]">
                    <div>
                      <span className="text-[var(--content-tertiary)] block">Quantum Engine</span>
                      <strong>PennyLane 0.45.1</strong>
                    </div>
                    <div>
                      <span className="text-[var(--content-tertiary)] block">Autograd Framework</span>
                      <strong>PyTorch 2.x Autograd</strong>
                    </div>
                    <div>
                      <span className="text-[var(--content-tertiary)] block">Front-End Interface</span>
                      <strong>Next.js 14 / React 19</strong>
                    </div>
                    <div>
                      <span className="text-[var(--content-tertiary)] block">Memory Subsystem</span>
                      <strong>SQLite 3 (WAL Mode)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Preview & Start Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-xl w-full p-6 space-y-5 rounded-2xl border border-[var(--border-highlight)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                <h3 className="text-sm font-bold text-[var(--content-primary)]">
                  Confirm Experiment Launch Configuration
                </h3>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="text-[var(--content-secondary)] hover:text-[var(--content-primary)] text-xs font-mono"
              >
                ✕ Close
              </button>
            </div>

            <p className="text-xs text-[var(--content-secondary)] leading-relaxed">
              Verify the exact hyperparameters before initializing the PennyLane statevector circuit and launching autonomous closed-loop training:
            </p>

            <div className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Benchmark Dataset:</span>
                <span className="font-bold text-cyan-400">{draftDataset.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Qubits Register:</span>
                <span className="font-bold text-[var(--content-primary)]">{draftNQbits} Qubits</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Ansatz Depth:</span>
                <span className="font-bold text-[var(--content-primary)]">L = {draftNLayers} ({circuitParamCount} parameters)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Hilbert Feature Map:</span>
                <span className="font-bold text-[var(--accent)]">{draftFeatureMap} Encoding</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Classical Optimizer:</span>
                <span className="font-bold text-emerald-400">{draftOptimizerName.toUpperCase()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Learning Rate &eta;:</span>
                <span className="font-bold text-emerald-400">{draftLearningRate.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">Budget Steps (max_steps):</span>
                <span className="font-bold text-[var(--content-primary)]">{draftMaxSteps} Steps</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[var(--content-secondary)]">PRNG Seed:</span>
                <span className="font-bold text-[var(--content-primary)]">{draftSeed}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[var(--border-subtle)] pt-2">
                <span className="text-[var(--content-secondary)]">Research Overrides:</span>
                <span className={`font-bold ${enableOverrides ? "text-amber-400" : "text-emerald-400"}`}>
                  {enableOverrides ? `ACTIVE (τ = ${draftConfidenceThreshold})` : "LOCKED PRODUCTION (τ = 0.60)"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="apple-btn px-4 py-2 rounded-xl text-xs font-medium text-[var(--content-secondary)] hover:text-[var(--content-primary)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]"
              >
                Back to Edit
              </button>
              <button
                onClick={() => {
                  setIsPreviewOpen(false);
                  handleSaveSettings();
                  if (onStartExperimentWithConfig) {
                    onStartExperimentWithConfig({
                      dataset: draftDataset,
                      nQbits: draftNQbits,
                      nLayers: draftNLayers,
                      featureMap: draftFeatureMap,
                      optimizerName: draftOptimizerName,
                      learningRate: draftLearningRate,
                      maxSteps: draftMaxSteps,
                      seed: draftSeed,
                      stepDelayMs: draftStepDelayMs,
                      confidenceThreshold: enableOverrides ? draftConfidenceThreshold : 0.60,
                      validationWindow: enableOverrides ? draftValidationWindow : 3,
                      oscillationWindow: enableOverrides ? draftOscillationWindow : 4,
                    });
                  }
                }}
                className="apple-btn px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] flex items-center gap-1.5 shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Apply &amp; Launch Autonomous Run</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
