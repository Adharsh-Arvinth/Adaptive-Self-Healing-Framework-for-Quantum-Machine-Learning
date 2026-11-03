"use client";

import React, { useState } from "react";
import { Sliders, Download, Cpu, ShieldCheck, HardDrive } from "lucide-react";
import { TelemetryPoint } from "@/types";

interface SettingsPanelProps {
  optimizerName: string;
  featureMap: string;
  nLayers: number;
  nQbits: number;
  dataset: string;
  learningRate: number;
  history: TelemetryPoint[];
  apiBase?: string;
  onUpdateConfig?: (config: {
    optimizerName?: string;
    featureMap?: string;
    nLayers?: number;
    learningRate?: number;
  }) => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  optimizerName,
  featureMap,
  nLayers,
  nQbits,
  dataset,
  learningRate,
  history,
  apiBase = "http://127.0.0.1:8000",
}) => {
  const [latency, setLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  const testPing = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      const res = await fetch(`${apiBase}/health`);
      if (res.ok) {
        const diff = performance.now() - start;
        setLatency(Math.round(diff));
      }
    } catch {
      setLatency(-1);
    } finally {
      setIsPinging(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `telemetry_history_step_${history.length}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6">
        <div className="flex items-center gap-2 mb-1.5">
          <Sliders className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-base font-bold text-[var(--content-primary)]">
            System & Quantum Circuit Configuration
          </h1>
        </div>
        <p className="text-xs text-[var(--content-secondary)] leading-relaxed max-w-2xl">
          Inspect and configure the Variational Quantum Classifier (VQC) hyperparameters, backend latency, telemetry exports, and scientific framework settings.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* VQC Circuit Architecture Card */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-[var(--content-primary)]">
              Quantum Circuit Architecture
            </h2>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="text-[var(--content-secondary)]">Quantum Register:</span>
              <span className="text-[var(--content-primary)] font-semibold">{nQbits} Qubits</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="text-[var(--content-secondary)]">Ansatz Layers (L):</span>
              <span className="text-[var(--content-primary)] font-semibold">{nLayers} Layers</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="text-[var(--content-secondary)]">Hilbert Space Map:</span>
              <span className="text-[var(--accent)] font-semibold">{featureMap} Encoding</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="text-[var(--content-secondary)]">Classical Optimizer:</span>
              <span className="text-emerald-400 font-semibold">{optimizerName.toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="text-[var(--content-secondary)]">Active Learning Rate (&eta;):</span>
              <span className="text-[var(--content-primary)] font-semibold">{learningRate.toFixed(4)}</span>
            </div>
            <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <span className="text-[var(--content-secondary)]">Benchmark Dataset:</span>
              <span className="text-cyan-400 font-semibold">{dataset}</span>
            </div>
          </div>
        </div>

        {/* System Operations & Telemetry Export */}
        <div className="glass-panel p-5 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3 mb-4">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-[var(--content-primary)]">
                Telemetry Export & Diagnostics
              </h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* API Ping & Health */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <div className="text-[var(--content-primary)] font-semibold">Backend REST API</div>
                  <div className="text-[10px] text-[var(--content-secondary)]">
                    {apiBase} •{" "}
                    {latency !== null
                      ? latency >= 0
                        ? `${latency}ms latency`
                        : "Offline"
                      : "Untested"}
                  </div>
                </div>
                <button
                  onClick={testPing}
                  disabled={isPinging}
                  className="apple-btn px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-primary)] hover:bg-neutral-800 text-[var(--content-primary)] border border-[var(--border-subtle)]"
                >
                  {isPinging ? "Testing..." : "Ping /health"}
                </button>
              </div>

              {/* Telemetry Points Stored */}
              <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between">
                <div>
                  <div className="text-[var(--content-primary)] font-semibold">Session Telemetry Store</div>
                  <div className="text-[10px] text-[var(--content-secondary)]">
                    {history.length} time-series steps recorded in current session
                  </div>
                </div>
                <button
                  onClick={handleExportJSON}
                  disabled={history.length === 0}
                  className="apple-btn px-3 py-1.5 rounded-lg text-xs bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center gap-1.5 font-medium disabled:opacity-40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Research Baseline Attribution */}
          <div className="p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--content-secondary)] font-mono space-y-1">
            <div className="flex items-center gap-1.5 text-[var(--accent)] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Scientific Baseline Verification</span>
            </div>
            <div>PennyLane: 0.45.1 • PyTorch: 2.x • Contextual Thompson Sampling</div>
            <div>Stage 8 Frozen Experimental Baseline: commit 7d37201</div>
          </div>
        </div>
      </div>
    </div>
  );
};
