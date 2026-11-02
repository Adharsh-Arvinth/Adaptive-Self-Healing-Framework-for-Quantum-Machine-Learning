"use client";

import React from "react";
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Sun,
  Moon,
  Activity,
  Layers,
  ShieldAlert,
  Cpu,
  BarChart3,
  Settings,
} from "lucide-react";

export type NavTab = "overview" | "diagnosis" | "twin" | "bandit" | "benchmarks" | "settings";

interface HeaderProps {
  isConnected: boolean;
  pipelineState: string;
  stepCount: number;
  maxSteps: number;
  isRunning: boolean;
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onResetPrompt: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  pipelineState,
  stepCount,
  maxSteps,
  isRunning,
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleTheme,
  onStart,
  onPause,
  onResume,
  onStep,
  onResetPrompt,
}) => {
  // Determine state badge styling
  const getStateBadgeStyle = () => {
    switch (pipelineState) {
      case "HEALTHY_TRAINING":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "ANOMALY_DETECTED":
      case "DIAGNOSING":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "CONFIDENCE_GATE_HOLD":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
      case "REPAIR_SELECTION":
      case "DIGITAL_TWIN_SIMULATING":
      case "DEPLOYING":
      case "VALIDATING_REPAIR":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      case "COMMITTED":
        return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 font-semibold";
      case "ROLLED_BACK":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      default:
        return "bg-neutral-500/10 text-content-secondary border-border-subtle";
    }
  };

  const navItems = [
    { id: "overview" as NavTab, label: "Overview", icon: Activity },
    { id: "diagnosis" as NavTab, label: "Diagnosis & Repairs", icon: ShieldAlert },
    { id: "twin" as NavTab, label: "Digital Twin & Safety", icon: Layers },
    { id: "bandit" as NavTab, label: "Bandit & Memory", icon: Cpu },
    { id: "benchmarks" as NavTab, label: "Stage 8 Proof", icon: BarChart3 },
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-bg-surface/85 border-b border-border-subtle px-4 sm:px-6 py-2.5 transition-all">
      <div className="max-w-[1600px] w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Identity & Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
              <span className="font-mono font-bold text-white text-xs tracking-tighter">QML</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-content-primary">
                  Adaptive Self-Healing VQC
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-bg-subtle text-content-secondary border border-border-subtle">
                  v1.0.1
                </span>
              </div>
              <p className="text-[11px] text-content-tertiary font-medium">
                Autonomous Closed-Loop Platform • VIT 22MID0324
              </p>
            </div>
          </div>

          {/* Mobile Right Controls: Theme + State */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="p-1.5 rounded-lg border border-border-subtle text-content-secondary hover:text-content-primary"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>
            <div className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${getStateBadgeStyle()}`}>
              {pipelineState}
            </div>
          </div>
        </div>

        {/* Center: Apple-style Segmented Navigation */}
        <nav className="flex items-center p-1 rounded-xl bg-bg-subtle border border-border-subtle overflow-x-auto max-w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-bg-surface text-content-primary shadow-apple border border-border-subtle"
                    : "text-content-secondary hover:text-content-primary"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-accent" : "text-content-tertiary"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right: Telemetry Status, Theme & Experiment Controls */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {/* Connection Status Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-subtle border border-border-subtle text-xs font-mono">
            <span
              className={`w-2 h-2 rounded-full transition-colors ${
                isConnected ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
              }`}
            />
            <span className="text-content-secondary text-[11px]">
              {isConnected ? "Live Stream" : "Disconnected"}
            </span>
          </div>

          {/* Pipeline State Badge */}
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border ${getStateBadgeStyle()}`}>
            <span>{pipelineState.replace(/_/g, " ")}</span>
          </div>

          {/* Step Progress Pill */}
          <div className="px-2 py-1 rounded-full bg-bg-subtle border border-border-subtle text-[11px] font-mono text-content-secondary">
            Step <span className="text-content-primary font-semibold">{stepCount}</span> / {maxSteps}
          </div>

          {/* Theme Switcher Button */}
          <button
            onClick={onToggleTheme}
            className="apple-btn p-2 rounded-lg border border-border-subtle bg-bg-subtle hover:bg-bg-elevated text-content-secondary hover:text-content-primary transition-colors"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-neutral-600" />
            )}
          </button>

          {/* Primary Experiment Controls */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-border-subtle">
            {!isRunning ? (
              <button
                onClick={stepCount === 0 ? onStart : onResume}
                className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-accent text-white hover:bg-accent-hover shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{stepCount === 0 ? "Start" : "Resume"}</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 shadow-sm"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause</span>
              </button>
            )}

            <button
              onClick={onStep}
              disabled={isRunning}
              className="apple-btn flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-bg-subtle hover:bg-bg-elevated border border-border-subtle text-content-primary disabled:opacity-40"
              title="Execute exactly one autonomous step"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>Step</span>
            </button>

            <button
              onClick={onResetPrompt}
              className="apple-btn p-1.5 rounded-lg text-content-secondary hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
              title="Reset experiment to step 0"
              aria-label="Reset experiment"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
