"use client";

import React from "react";
import { TrendingDown, TrendingUp, Gauge, Compass, Zap, Layers } from "lucide-react";

interface MetricsRowProps {
  loss: number;
  valLoss: number;
  accuracy: number;
  valAccuracy: number;
  gradientNorm: number;
  gradientVariance: number;
  parameterVelocity: number;
  learningRate: number;
  circuitDepth: number;
}

export const MetricsRow: React.FC<MetricsRowProps> = ({
  loss,
  valLoss,
  accuracy,
  valAccuracy,
  gradientNorm,
  gradientVariance,
  parameterVelocity,
  learningRate,
  circuitDepth,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {/* Training Loss */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Train Loss</span>
          <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
        </div>
        <div className="text-xl font-semibold font-mono tracking-tight text-white">
          {loss.toFixed(4)}
        </div>
        <div className="text-[11px] text-neutral-400 mt-1 font-mono">
          Val Loss: <span className="text-neutral-300">{valLoss.toFixed(4)}</span>
        </div>
      </div>

      {/* Validation Accuracy */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Val Accuracy</span>
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="text-xl font-semibold font-mono tracking-tight text-emerald-400">
          {(valAccuracy * 100).toFixed(1)}%
        </div>
        <div className="text-[11px] text-neutral-400 mt-1 font-mono">
          Train: <span className="text-neutral-300">{(accuracy * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Gradient Norm */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Gradient Norm</span>
          <Gauge className="w-3.5 h-3.5 text-purple-400" />
        </div>
        <div className="text-xl font-semibold font-mono tracking-tight text-white">
          {gradientNorm.toFixed(4)}
        </div>
        <div className="text-[11px] text-neutral-400 mt-1 font-mono">
          Var: <span className="text-neutral-300">{gradientVariance.toExponential(2)}</span>
        </div>
      </div>

      {/* Parameter Velocity */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Param Velocity</span>
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
        </div>
        <div className="text-xl font-semibold font-mono tracking-tight text-white">
          {parameterVelocity.toFixed(4)}
        </div>
        <div className="text-[11px] text-neutral-400 mt-1 font-mono">
          Displacement / Step
        </div>
      </div>

      {/* Learning Rate */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Learning Rate</span>
          <Zap className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="text-xl font-semibold font-mono tracking-tight text-amber-300">
          {learningRate.toFixed(4)}
        </div>
        <div className="text-[11px] text-neutral-400 mt-1 font-mono">
          Adaptive Scale
        </div>
      </div>

      {/* Circuit Depth */}
      <div className="glass-panel p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-neutral-400 text-xs mb-1">
          <span>Circuit Depth</span>
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="text-xl font-semibold font-mono tracking-tight text-white">
          {circuitDepth} <span className="text-xs font-normal text-neutral-400">Layers</span>
        </div>
        <div className="text-[11px] text-neutral-400 mt-1 font-mono">
          Max: 8 Layers
        </div>
      </div>
    </div>
  );
};
