"use client";

import React, { useState } from "react";
import { AlertTriangle, Play, RotateCcw, ChevronDown, ChevronUp, Activity, Compass, Cpu } from "lucide-react";

export const StoryChapter1Challenge: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Steps in the failure lifecycle
  const steps = [
    {
      id: "train",
      label: "1. Training Begins",
      status: "Healthy Descent",
      desc: "Classical optimizer computes parameter-shift gradients across variational ansatz layers. Loss converges steadily.",
      loss: 0.69,
      gradVar: "1.4e-2",
      state: "Converging",
      stateColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    },
    {
      id: "anomaly",
      label: "2. Failure Emerges",
      status: "Barren Plateau / Noise",
      desc: "Quantum state contracts or circuit depth pushes parameters into a barren plateau. Gradient variance exponentially vanishes.",
      loss: 0.61,
      gradVar: "3.2e-6",
      state: "Anomaly Triggered",
      stateColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    },
    {
      id: "diverge",
      label: "3. Model Stagnates",
      status: "Gradient Paralyzed",
      desc: "Without gradient signal, classical parameter updates stall. Loss flatlines at sub-optimal accuracy, freezing training.",
      loss: 0.61,
      gradVar: "1.1e-7",
      state: "Training Stalled",
      stateColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    },
    {
      id: "detect",
      label: "4. System Detects",
      status: "Telemetry Flagged",
      desc: "Sliding-window heuristics catch gradient variance dropping below threshold (Var[g] < 1e-5), flagging root cause.",
      loss: 0.61,
      gradVar: "FLAGGED",
      state: "Anomaly Detected",
      stateColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    },
  ];

  const current = steps[activeStep];

  const handleSimulate = () => {
    setIsSimulating(true);
    let step = 0;
    setActiveStep(0);
    const interval = setInterval(() => {
      step++;
      if (step < steps.length) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 1200);
  };

  return (
    <section id="the-challenge" className="py-24 px-4 sm:px-6 lg:px-12 border-b border-white/5 bg-[#07090e] text-white">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Chapter Header */}
        <div className="space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 uppercase tracking-widest">
            <span>Chapter 01 &middot; The Problem</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white leading-tight">
            Quantum models are powerful. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-slate-400 to-slate-500">
              They are not immune to failure.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans">
            Unlike classical neural networks, variational quantum circuits optimize parameters across complex Hilbert spaces. They contend with unique physical traps—exponential gradient vanishing, decoherence noise, and momentum buffer explosions that freeze learning.
          </p>
        </div>

        {/* Interactive Failure Progression Demonstration */}
        <div className="p-6 sm:p-8 rounded-3xl border border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                Interactive Demonstration &middot; Educational Simulation
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">
                The Anatomy of a Quantum Training Breakdown
              </h3>
            </div>
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="apple-btn px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-2 self-start sm:self-auto transition-all disabled:opacity-50"
            >
              {isSimulating ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isSimulating ? "Simulating Failure..." : "Run Failure Simulation"}</span>
            </button>
          </div>

          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 font-mono text-xs">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => setActiveStep(idx)}
                className={`pill-interactive p-3.5 rounded-2xl border text-left transition-all ${
                  activeStep === idx
                    ? "bg-white/[0.08] border-cyan-400/50 shadow-[0_0_18px_rgba(34,211,238,0.2)] -translate-y-0.5"
                    : "bg-white/[0.02] border-white/10 hover:border-cyan-400/40 hover:bg-white/[0.06] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4)] text-slate-400"
                }`}
              >
                <span className="text-[10px] text-slate-500 block">{s.label}</span>
                <span className="text-xs font-semibold text-slate-200 mt-1 block truncate">
                  {s.status}
                </span>
              </button>
            ))}
          </div>

          {/* Active Step Visual Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Visual Loss & Gradient Curve Canvas */}
            <div className="lg:col-span-7 p-5 rounded-2xl border border-white/10 bg-black/40 space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>SIMULATED TELEMETRY TELEGRAPH</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${current.stateColor}`}>
                  {current.state}
                </span>
              </div>

              {/* Minimal SVG Trajectory Wave */}
              <div className="h-32 sm:h-40 w-full relative flex items-center justify-center">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="400" y2="30" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="70" x2="400" y2="70" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  <line x1="0" y1="110" x2="400" y2="110" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

                  {/* Curve dynamically changes based on active step */}
                  {activeStep === 0 && (
                    <path
                      d="M 0 20 Q 100 40 200 65 T 400 100"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="3"
                      className="transition-all duration-700"
                    />
                  )}
                  {activeStep === 1 && (
                    <path
                      d="M 0 20 Q 100 40 200 65 L 400 65"
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="3"
                      className="transition-all duration-700"
                    />
                  )}
                  {(activeStep === 2 || activeStep === 3) && (
                    <g>
                      <path
                        d="M 0 20 Q 100 40 200 65 L 400 65"
                        fill="none"
                        stroke="#f43f5e"
                        strokeWidth="3"
                        className="transition-all duration-700"
                      />
                      <circle cx="200" cy="65" r="5" fill="#f43f5e" className="animate-ping" />
                      <circle cx="200" cy="65" r="4" fill="#f43f5e" />
                      <text x="215" y="60" fill="#f43f5e" fontSize="10" fontFamily="monospace">
                        Variance Collapsed &middot; Var[g] &lt; 1e-5
                      </text>
                    </g>
                  )}
                </svg>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <div>Loss: <span className="text-white font-bold">{current.loss.toFixed(2)}</span></div>
                <div>Gradient Variance: <span className="text-white font-bold">{current.gradVar}</span></div>
                <div>Horizon: <span className="text-cyan-400 font-bold">Step {activeStep * 15 + 10}/60</span></div>
              </div>
            </div>

            {/* Narrative Explanation */}
            <div className="lg:col-span-5 space-y-4">
              <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest block">
                Stage {activeStep + 1} Analysis
              </span>
              <h4 className="text-xl font-bold text-white">
                {current.status}
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed font-sans">
                {current.desc}
              </p>
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-slate-400 font-sans">
                <strong>Why traditional methods fail:</strong> Fixed optimizers cannot sense whether vanishing gradients originate from a barren plateau, quantum noise, or learning rate divergence. They blindly stall or diverge.
              </div>
            </div>
          </div>

          {/* Level 3: Optional Technical Details for Researchers */}
          <div className="pt-2 border-t border-white/10">
            <button
              onClick={() => setShowTechnical(!showTechnical)}
              className="flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors"
            >
              <span>{showTechnical ? "Hide mathematical foundations" : "Explore Level 3: Mathematical Physics of QML Failures"}</span>
              {showTechnical ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showTechnical && (
              <div className="mt-4 p-5 rounded-2xl bg-black/60 border border-white/10 space-y-4 text-xs font-mono text-slate-300 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-cyan-400 font-bold block">1. Barren Plateau Theorem</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      For unitaries forming 2-designs over U(2ⁿ) under global observables, partial derivatives vanish exponentially:
                    </p>
                    <code className="text-amber-300 block text-[11px]">Var_θ[∂_k L] ∈ O(2⁻ⁿ)</code>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-cyan-400 font-bold block">2. Stochastic Shot Noise</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Parameter-shift gradients evaluate expectation values with finite shot variance ε_shot:
                    </p>
                    <code className="text-amber-300 block text-[11px]">g_k = (⟨H⟩₊ - ⟨H⟩₋)/2 + ε_shot</code>
                  </div>

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-cyan-400 font-bold block">3. State Decoherence</span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Noise channels contract density matrix state purity toward the maximally mixed state:
                    </p>
                    <code className="text-amber-300 block text-[11px]">γ = Tr(ρ²) = (1 + r²)/2 &lt; 1.0</code>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
