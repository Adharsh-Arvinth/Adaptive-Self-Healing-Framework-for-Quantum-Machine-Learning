"use client";

import React, { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ChapterMark, MaskLines, Reveal } from "./motion";

const STAGES = [
  { n: "01", t: "Monitor", d: "Every step records loss, validation loss, gradient norm and direction, parameter velocity and the measured output margin.", c: "backend/monitoring.py" },
  { n: "02", t: "Detect", d: "Each signal is compared with the run's own recent history, so the same rules work on any dataset or circuit size.", c: "backend/detection.py" },
  { n: "03", t: "Diagnose", d: "Evidence is turned into a probability for each of the six faults. Below 60% confidence, the system waits rather than guessing.", c: "τ = 0.60 gate" },
  { n: "04", t: "Remember", d: "Past faults and what fixed them are stored and recalled by similarity, so experience accumulates across runs.", c: "SQLite episodic memory" },
  { n: "05", t: "Simulate", d: "Every candidate repair is tried on an isolated copy of the model for three steps before the real model is touched.", c: "digital twin · H = 3" },
  { n: "06", t: "Select", d: "A contextual Thompson-sampling bandit picks the repair, balancing what has worked before against what is still uncertain.", c: "12-D context" },
  { n: "07", t: "Validate", d: "The repair goes live inside a three-step probation window, watched for divergence, collapse or regression.", c: "W_val = 3" },
  { n: "08", t: "Commit · Rollback", d: "If the run improved, the change is kept. If not, the model is restored to its exact pre-repair checkpoint.", c: "atomic checkpoint" },
];

const Card: React.FC<{ s: (typeof STAGES)[number] }> = ({ s }) => (
  <article className="group relative shrink-0 w-[78vw] sm:w-[52vw] lg:w-[30vw] h-[58vh] min-h-[380px] rounded-[28px] border border-c-ink/[0.12] bg-c-paper/80 backdrop-blur-sm p-7 flex flex-col justify-between transition-colors duration-300 hover:bg-[var(--ink)] hover:text-[var(--paper)]">
    <div className="flex items-start justify-between">
      <span className="type-condensed text-[7rem] leading-none text-[var(--signal)]">{s.n}</span>
      <span className="type-label opacity-60 mt-3">{s.c}</span>
    </div>
    <div className="space-y-3">
      <h3 className="type-wide text-[clamp(1.8rem,2.6vw,2.6rem)]">{s.t}</h3>
      <p className="text-[15px] leading-relaxed opacity-75 max-w-sm">{s.d}</p>
    </div>
  </article>
);

export const ChapterLoop: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.35 });
  const x = useTransform(smooth, [0, 1], ["0%", "-72%"]);
  const bar = useTransform(smooth, [0, 1], [0, 1]);

  return (
    <section id="loop" className="relative bg-grid-paper text-[var(--ink)]">
      <div className="px-4 sm:px-8 lg:px-12 pt-24 sm:pt-32 pb-10">
        <ChapterMark index="02" label="The loop" />
        <div className="grid lg:grid-cols-12 gap-8 mt-10">
          <MaskLines className="lg:col-span-8 type-wide text-[clamp(2.4rem,6.6vw,6.5rem)]" lines={["Detect. Diagnose.", "Rehearse. Recover."]} />
          <Reveal className="lg:col-span-4 lg:pt-4 text-[var(--ink-2)] text-lg leading-relaxed" delay={0.15}>
            Eight stages run alongside training, the way a race engineer watches telemetry: quietly, until something changes.
          </Reveal>
        </div>
      </div>

      {/* Desktop: pinned horizontal track */}
      <div ref={ref} className="relative hidden md:block" style={{ height: "320vh" }}>
        <div className="sticky top-0 h-[100svh] flex flex-col justify-center overflow-hidden">
          <motion.div className="flex gap-6 pl-8 lg:pl-12 will-change-transform" style={{ x: reduce ? "0%" : x }}>
            {STAGES.map((s) => (
              <Card key={s.n} s={s} />
            ))}
            <div className="shrink-0 w-[20vw]" />
          </motion.div>
          <div className="mx-8 lg:mx-12 mt-10 h-px bg-c-ink/15 relative">
            <motion.div className="absolute inset-0 bg-[var(--signal)] origin-left" style={{ scaleX: bar }} />
          </div>
        </div>
      </div>

      {/* Mobile: vertical stack */}
      <div className="md:hidden px-4 pb-20 space-y-4">
        {STAGES.map((s, i) => (
          <Reveal key={s.n} delay={Math.min(i * 0.04, 0.2)}>
            <div className="rounded-3xl border border-c-ink/[0.12] bg-[var(--paper)] p-6">
              <div className="flex items-baseline justify-between">
                <span className="type-condensed text-6xl text-[var(--signal)]">{s.n}</span>
                <span className="type-label text-[var(--ink-3)]">{s.c}</span>
              </div>
              <h3 className="type-wide text-2xl mt-3">{s.t}</h3>
              <p className="text-[15px] text-[var(--ink-2)] leading-relaxed mt-2">{s.d}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};
