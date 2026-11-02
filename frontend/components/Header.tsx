"use client";

import React from "react";
import { Play, Pause, StepForward, RotateCcw, Activity } from "lucide-react";

interface HeaderProps {
  isConnected: boolean;
  pipelineState: string;
  stepCount: number;
  maxSteps: number;
  isRunning: boolean;
  optimizerName: string;
  featureMap: string;
  nLayers: number;
  nQbits: number;
  dataset: string;
  onStart: () => void;
  onStop: () => void;
  onStep: () => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  pipelineState,
  stepCount,
  maxSteps,
  isRunning,
  optimizerName,
  featureMap,
  nLayers,
  nQbits,
  dataset,
  onStart,
  onStop,
  onStep,
  onReset,
}) => {
  // Determine state badge color
  const getStateBadgeStyle = () => {
    switch (pipelineState) {
      case "HEALTHY_TRAINING":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "ANOMALY_DETECTED":
      case "DIAGNOSING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "CONFIDENCE_GATE_HOLD":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "REPAIR_SELECTION":
      case "DIGITAL_TWIN_SIMULATING":
      case "DEPLOYING":
      case "VALIDATING_REPAIR":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      case "COMMITTED":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      case "ROLLED_BACK":
        return "bg-rose-500/15 text-rose-400 border-rose-500/40";
      default:
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/30";
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-neutral-900/60 border-b border-white/10 px-6 py-3.5 flex items-center justify-between transition-all">
      {/* Brand Identity & Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <span className="font-mono font-bold text-white text-xs">QML</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold tracking-tight text-white">
                Adaptive Self-Healing VQC
              </h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-white/5 text-neutral-400 border border-white/5">
                v1.0.0
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              Autonomous Quantum Closed-Loop System
            </p>
          </div>
        </div>

        {/* Live WebSocket Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/30 border border-white/5 text-xs font-mono">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              isConnected ? "bg-emerald-400 shadow-glow-emerald" : "bg-rose-500 animate-pulse"
            }`}
          />
          <span className="text-neutral-400">
            {isConnected ? "WS Connected" : "Connecting..."}
          </span>
        </div>

        {/* Pipeline State Pill */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border transition-all ${getStateBadgeStyle()}`}
        >
          <Activity className="w-3 h-3 animate-pulse" />
          <span>{pipelineState.replace(/_/g, " ")}</span>
        </div>

        {/* Step Progress Pill */}
        <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/5 text-xs font-mono text-neutral-300 border border-white/5">
          <span>Step</span>
          <span className="text-white font-semibold">{stepCount}</span>
          <span className="text-neutral-500">/ {maxSteps}</span>
        </div>

        {/* Circuit Architecture Spec */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel-subtle text-xs font-mono text-neutral-400">
          <span>{dataset.toUpperCase()}</span>
          <span>•</span>
          <span>{nQbits}Q / {nLayers}L</span>
          <span>•</span>
          <span>{featureMap.toUpperCase()}</span>
          <span>•</span>
          <span>{optimizerName.toUpperCase()}</span>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={onStop}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause Loop
          </button>
        ) : (
          <button
            onClick={onStart}
            className="btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl bg-apple-blue hover:bg-apple-hover text-white shadow-subtle text-xs font-medium"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Start Autonomous Loop
          </button>
        )}

        <button
          onClick={onStep}
          disabled={isRunning}
          className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-neutral-200 border border-white/10 text-xs font-medium"
          title="Execute exactly one pipeline step"
        >
          <StepForward className="w-3.5 h-3.5" />
          Step
        </button>

        <button
          onClick={onReset}
          className="btn-press flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 border border-white/10 text-xs font-medium"
          title="Reset pipeline and QML model"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>
    </header>
  );
};
