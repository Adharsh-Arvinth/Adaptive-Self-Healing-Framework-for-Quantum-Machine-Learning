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
        return "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/20";
      case "ANOMALY_DETECTED":
      case "DIAGNOSING":
        return "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-[var(--status-warning)]/20";
      case "CONFIDENCE_GATE_HOLD":
        return "bg-[var(--status-ansatz-subtle)] text-[var(--status-ansatz)] border-[var(--status-ansatz)]/20";
      case "REPAIR_SELECTION":
      case "DIGITAL_TWIN_SIMULATING":
      case "DEPLOYING":
      case "VALIDATING_REPAIR":
        return "bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/20";
      case "COMMITTED":
        return "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-[var(--status-success)]/30 font-semibold";
      case "ROLLED_BACK":
        return "bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border-[var(--status-danger)]/20";
      default:
        return "bg-[var(--bg-subtle)] text-[var(--content-secondary)] border-[var(--border-subtle)]";
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
    <header className="sticky top-0 z-40 backdrop-blur-2xl bg-[var(--bg-surface)]/85 dark:bg-[var(--bg-surface)]/85 border-b border-[var(--border-subtle)] transition-all">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Tier 1: Brand, Status Indicators, and Primary Action Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#8B4C2F] via-[#A65E3E] to-[#6E432A] flex items-center justify-center shadow-md shadow-[#A65E3E]/20 shrink-0">
              <span className="font-mono font-bold text-white text-xs tracking-tight">QML</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold tracking-tight text-[var(--content-primary)]">
                  Adaptive Self-Healing VQC
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-[var(--bg-subtle)] text-[var(--content-secondary)] border border-[var(--border-subtle)] font-medium">
                  v1.1.0
                </span>
              </div>
              <p className="text-[11px] text-[var(--content-tertiary)] font-medium">
                Autonomous Closed-Loop Runtime Platform • VIT 22MID0324
              </p>
            </div>
          </div>

          {/* Right Action Cluster: Connection status, State, Step, Theme, Controls */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Live Stream indicator with breathing radar dot */}
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono">
              <span className="relative flex h-2 w-2">
                {isConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--status-success)] opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? "bg-[var(--status-success)]" : "bg-[var(--status-danger)]"}`}></span>
              </span>
              <span className="text-[var(--content-secondary)] text-[11px] font-medium">
                {isConnected ? "Live Stream" : "Disconnected"}
              </span>
            </div>

            {/* State Badge */}
            <div className={`px-3 py-1 rounded-full text-xs font-mono border font-medium ${getStateBadgeStyle()}`}>
              {pipelineState.replace(/_/g, " ")}
            </div>

            {/* Step Progress Pill */}
            <div className="px-3 py-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-mono text-[var(--content-secondary)]">
              Step <span className="font-semibold text-[var(--content-primary)]">{stepCount}</span> / {maxSteps}
            </div>

            {/* Theme Toggle Button */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl border border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--content-secondary)] hover:text-[var(--content-primary)] transition-all active:scale-95"
              aria-label="Toggle Theme"
              title="Toggle Dark / Light Mode"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Action Controls Pill Group */}
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] gap-1">
              {isRunning ? (
                <button
                  onClick={onPause}
                  className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--status-warning-subtle)] text-[var(--status-warning)] hover:opacity-90 transition-all active:scale-95"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : stepCount > 0 ? (
                <button
                  onClick={onResume}
                  className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  onClick={onStart}
                  className="apple-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white shadow-sm transition-all active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Start</span>
                </button>
              )}

              <button
                onClick={onStep}
                disabled={isRunning}
                className="apple-btn flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-surface)] disabled:opacity-40 transition-all active:scale-95"
                title="Single-step quantum execution"
              >
                <StepForward className="w-3.5 h-3.5" />
                <span>Step</span>
              </button>

              <button
                onClick={onResetPrompt}
                className="apple-btn p-1.5 rounded-lg text-[var(--content-tertiary)] hover:text-[var(--status-danger)] hover:bg-[var(--status-danger-subtle)] transition-all active:scale-95"
                title="Reset experiment and parameters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: macOS Segmented Control Bar (Zero text truncation, perfect padding) */}
        <div className="mt-3 pt-2.5 border-t border-[var(--border-subtle)]/60 flex items-center justify-center">
          <nav className="flex items-center p-1 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] shadow-sm max-w-full overflow-x-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`apple-btn relative flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--bg-surface)] text-[var(--content-primary)] shadow-sm border border-[var(--border-subtle)] font-semibold"
                      : "text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-surface)]/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 transition-colors ${isActive ? "text-[var(--accent)]" : "text-[var(--content-tertiary)]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
