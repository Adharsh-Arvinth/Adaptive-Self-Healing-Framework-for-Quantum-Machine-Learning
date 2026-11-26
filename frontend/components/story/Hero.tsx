"use client";

import results from "../../public/data/qfaultbench_results.json";
import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { EASE_OUT, MaskLines, Magnetic, scrollToId } from "./motion";

/* Healthy descent, fault spike, recovery: one trace drawn in three coloured segments. */
const HEALTHY = "M 0 40 C 40 52, 70 78, 110 96 S 170 118, 205 124";
const FAULT = "M 205 124 L 214 62 L 224 138 L 233 44 L 244 132 L 252 70";
const HEALED = "M 252 70 C 270 104, 300 136, 340 148 S 400 160, 440 163";

const PHASES = [
  { at: 0.0, tag: "HEALTHY", text: "Loss descending · ‖g‖ coherent", tone: "text-white/70" },
  { at: 0.42, tag: "FAULT", text: "Step size ×50 · loss oscillating", tone: "text-[var(--signal-2)]" },
  { at: 0.6, tag: "DIAGNOSED", text: "lr_misconfiguration · gate cleared", tone: "text-amber-300" },
  { at: 0.74, tag: "REPAIRED", text: "LR re-anchored · validated 3/3 · committed", tone: "text-[var(--heal)]" },
];

const CYCLE = 7.5;

const TelemetryCard: React.FC = () => {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState(reduce ? 3 : 0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const timers: number[] = [];
    PHASES.forEach((p, i) => timers.push(window.setTimeout(() => setPhase(i), p.at * CYCLE * 1000)));
    timers.push(window.setTimeout(() => setCycle((c) => c + 1), CYCLE * 1000));
    return () => timers.forEach(clearTimeout);
  }, [cycle, reduce]);

  const seg = (d: string, color: string, start: number, end: number, width = 2.25) => (
    <motion.path
      key={`${d}-${cycle}`}
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: reduce ? 1 : 0 }}
      animate={{ pathLength: 1 }}
      transition={{ duration: reduce ? 0 : (end - start) * CYCLE, delay: reduce ? 0 : start * CYCLE, ease: "linear" }}
    />
  );

  const p = PHASES[phase];
  return (
    <div className="relative rounded-[28px] bg-[var(--carbon)] text-white p-5 sm:p-6 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] overflow-hidden">
      <div className="absolute inset-0 bg-grid-carbon opacity-60 pointer-events-none" />
      <div className="relative flex items-center justify-between type-label text-white/50">
        <span className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--heal)] animate-pulse-dot" /> Illustrative trace
        </span>
        <span>VQC · 4 qubits · Adam</span>
      </div>
      <svg viewBox="0 0 440 180" className="relative mt-4 w-full h-auto" role="img" aria-label="Training loss: healthy descent, a fault spike, then recovery">
        {[36, 72, 108, 144].map((y) => (
          <line key={y} x1="0" x2="440" y1={y} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="2 6" />
        ))}
        {seg(HEALTHY, "rgba(255,255,255,0.85)", 0, 0.42)}
        {seg(FAULT, "var(--signal-2)", 0.42, 0.6, 2)}
        {seg(HEALED, "var(--heal)", 0.74, 1.0, 2.5)}
      </svg>
      <div className="relative mt-3 flex items-baseline justify-between gap-4 min-h-[2.5rem]">
        <motion.div
          key={`${phase}-${cycle}`}
          initial={{ opacity: 0, y: reduce ? 0 : 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE_OUT }}
          className="min-w-0"
        >
          <div className={`type-label ${p.tone}`}>{p.tag}</div>
          <div className="text-sm text-white/80 truncate">{p.text}</div>
        </motion.div>
        <div className="type-label text-white/40 tabular shrink-0">loss / step</div>
      </div>
    </div>
  );
};

export const Hero: React.FC<{ onLaunchLab: () => void; isConnected: boolean }> = ({ onLaunchLab, isConnected }) => {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", reduce ? "0%" : "28%"]);
  const titleOpacity = useTransform(scrollYProgress, [0, 0.85], [1, reduce ? 1 : 0.15]);

  return (
    <section ref={ref} id="top" className="relative bg-grid-paper text-[var(--ink)] overflow-hidden pt-[6.5rem] sm:pt-28">
      {/* Signal stripes (motorsport livery), sweeping in once */}
      <div className="pointer-events-none absolute -right-[12vw] top-0 h-full w-[46vw] hidden md:block" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute top-[-10%] h-[130%] bg-[var(--signal)] origin-top"
            style={{ left: `${i * 22}%`, width: i === 1 ? "9%" : "4%", rotate: 22, opacity: i === 1 ? 1 : 0.9 }}
            initial={{ scaleY: reduce ? 1 : 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 1.1, ease: [0.77, 0, 0.175, 1], delay: 0.15 + i * 0.09 }}
          />
        ))}
      </div>

      <div className="relative px-4 sm:px-8 lg:px-12">
        <div className="flex items-center justify-between type-label text-[var(--ink-2)]">
          <span>Quantum ML · Runtime reliability</span>
          <span className="hidden sm:flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--heal)] animate-pulse-dot" : "bg-[var(--ink-3)]"}`} />
            {isConnected ? "Backend live" : "Backend waking up"}
          </span>
        </div>

        <motion.div style={{ y: titleY, opacity: titleOpacity }} className="mt-6 sm:mt-8">
          <MaskLines
            immediate
            delay={0.1}
            className="type-condensed text-[19vw] md:text-[16.4vw] tracking-[-0.01em]"
            lines={[
              <span key="a">Self</span>,
              <span key="b">
                Healing<span className="text-[var(--signal)]">.</span>
              </span>,
            ]}
          />
        </motion.div>

        <div className="relative grid lg:grid-cols-12 gap-10 lg:gap-12 mt-8 sm:mt-12 pb-16 sm:pb-24 items-end">
          <motion.div
            className="lg:col-span-5 space-y-8"
            initial={{ opacity: 0, y: reduce ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.55 }}
          >
            <p className="type-wide text-[clamp(1.6rem,3.2vw,2.75rem)] leading-[1.02]">
              Quantum models break while they train. This one notices, and repairs itself.
            </p>
            <p className="text-[var(--ink-2)] text-base sm:text-lg leading-relaxed max-w-md">
              A closed loop around a variational quantum classifier that detects training faults, diagnoses the cause,
              tests a fix in a sandbox and keeps it only if it works.
            </p>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                ["Restore", `${results.headline.restore}%`],
                ["Thompson sampling", `${results.headline.thompson}%`],
                ["Diagnosis F1 · learned / rules", `${results.diagnosis.learned_macro_f1.toFixed(2)} / ${results.diagnosis.rule_macro_f1.toFixed(2)}`],
                ["Latent recovery · older / latest", `${results.headline.older}% / ${results.headline.latest}%`],
              ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd className="text-xl font-semibold">{value}</dd></div>)}
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              {process.env.NEXT_PUBLIC_PAPER_URL
                ? <a className="btn-ink border" href={process.env.NEXT_PUBLIC_PAPER_URL}>Read the paper</a>
                : <button disabled className="btn-ink border">Read the paper · preprint pending</button>}
              <Magnetic>
                <button onClick={onLaunchLab} className="btn-ink bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--signal)]">
                  Open the live lab <ArrowUpRight className="w-4 h-4" />
                </button>
              </Magnetic>
              <button
                onClick={() => scrollToId("faults")}
                className="btn-ink border border-c-ink/20 hover:border-[var(--ink)] text-[var(--ink)]"
              >
                How it works <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          </motion.div>

          <motion.div
            className="lg:col-span-6 lg:col-start-7"
            initial={{ opacity: 0, y: reduce ? 0 : 40, scale: reduce ? 1 : 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.7 }}
          >
            <TelemetryCard />
          </motion.div>
        </div>
      </div>
    </section>
  );
};
