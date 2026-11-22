"use client";

import React from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ChapterMark, Magnetic, Marquee, MaskLines, Reveal } from "./motion";

const LIMITS = [
  { t: "Simulation only", d: "Results come from statevector simulation of a 4-qubit classifier, not physical hardware." },
  { t: "Emulated plateaus", d: "Barren plateaus cannot be reproduced at 4 qubits, so they are modelled as a gradient signal-to-noise collapse." },
  { t: "Calibrated, not measured, noise", d: "The hardware regime uses public IBM calibration snapshots (medians), not live device runs." },
  { t: "Checkpoints are strong", d: "Restoring a healthy checkpoint fixes most state faults. Adaptive repair matters most when the fault lives in the device." },
  { t: "One fault at a time", d: "Each episode injects a single fault mid-training. Compound and gradual faults are future work." },
  { t: "Short-window reward", d: "Policies learn from a 3-step reward that only partly predicts the final result." },
];

export const ChapterLimits: React.FC = () => (
  <section id="limits" className="relative bg-[var(--carbon)] text-white px-4 sm:px-8 lg:px-12 py-24 sm:py-32">
    <ChapterMark index="05" label="The boundaries" tone="carbon" />
    <div className="grid lg:grid-cols-12 gap-8 mt-10 mb-14">
      <MaskLines className="lg:col-span-8 type-wide text-[clamp(2.4rem,6.6vw,6.5rem)]" lines={["What this", "does not claim."]} />
      <Reveal className="lg:col-span-4 lg:pt-4 text-white/60 text-lg leading-relaxed" delay={0.15}>
        Knowing where a result stops is part of the result.
      </Reveal>
    </div>
    <ol className="grid md:grid-cols-2 lg:grid-cols-3 border-t border-l border-white/[0.12]">
      {LIMITS.map((l, i) => (
        <Reveal as="li" key={l.t} delay={i * 0.05} className="border-r border-b border-white/[0.12] p-7 sm:p-8 min-h-[220px] flex flex-col justify-between">
          <span className="type-label text-[var(--signal-2)] tabular">{String(i + 1).padStart(2, "0")}</span>
          <div>
            <h3 className="type-wide text-2xl">{l.t}</h3>
            <p className="text-white/60 leading-relaxed mt-3 text-[15px]">{l.d}</p>
          </div>
        </Reveal>
      ))}
    </ol>
  </section>
);

const GithubMark = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.12 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2Z" />
  </svg>
);

export const ChapterFinale: React.FC<{ onLaunchLab: () => void }> = ({ onLaunchLab }) => {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end end"] });
  // The phrase is ~1.4x the viewport wide; drift it so the whole phrase has read by the end of the scroll.
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["-24%", "-24%"] : ["10%", "-46%"]);

  return (
    <>
      <section ref={ref} id="lab-cta" className="relative bg-[var(--signal)] text-[var(--ink)] overflow-hidden pt-24 sm:pt-32">
        <div className="px-4 sm:px-8 lg:px-12">
          <ChapterMark index="06" label="Your turn" tone="ink" />
        </div>
        <motion.div style={{ x }} className="type-condensed text-[24vw] leading-[0.8] whitespace-nowrap mt-10 select-none" aria-hidden="true">
          Enter the lab
        </motion.div>
        <div className="px-4 sm:px-8 lg:px-12 grid lg:grid-cols-12 gap-8 pt-12 pb-24 items-end">
          <p className="lg:col-span-6 type-wide text-[clamp(1.5rem,2.8vw,2.4rem)] leading-[1.05]">
            Break a live quantum model on purpose, then watch it diagnose and repair itself, step by step.
          </p>
          <div className="lg:col-span-5 lg:col-start-8 space-y-5">
            <p className="text-c-ink/75 leading-relaxed">
              First time? The lab opens with a short guided tour that shows exactly what to press and what to watch.
              The backend runs on a free server, so the first connection can take up to a minute.
            </p>
            <Magnetic className="inline-block">
              <button onClick={onLaunchLab} className="btn-ink bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)] text-base px-7 py-4">
                Open the live lab <ArrowUpRight className="w-5 h-5" />
              </button>
            </Magnetic>
          </div>
        </div>
      </section>

      <footer className="bg-[var(--carbon)] text-white/60">
        <Marquee duration={44} className="border-b border-white/10 py-5">
          {["Monitor", "Detect", "Diagnose", "Remember", "Simulate", "Select", "Validate", "Recover"].map((w) => (
            <span key={w} className="type-condensed text-5xl text-white/15 px-8 flex items-center gap-8">
              {w} <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
            </span>
          ))}
        </Marquee>
        <div className="px-4 sm:px-8 lg:px-12 py-10 flex flex-col md:flex-row gap-6 md:items-center justify-between text-sm">
          <div>
            <div className="text-white font-semibold">Self-Healing Quantum ML</div>
            <div className="text-white/45 mt-1">Adaptive repair for variational quantum classifiers · MIT licence</div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 hover:text-white transition-colors"
            >
              <GithubMark /> Source &amp; data
            </a>
            <a href="https://qml-backend-nczx.onrender.com/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
              API docs
            </a>
            <a href="#top" className="hover:text-white transition-colors">Back to top ↑</a>
          </div>
        </div>
      </footer>
    </>
  );
};
