"use client";

import React, { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ChapterMark, EASE_OUT, MaskLines, Reveal } from "./motion";

/* Each fault: what it is, what it looks like in telemetry, and a signature sketch (200 x 80). */
const FAULTS = [
  {
    key: "barren_plateau",
    name: ["Barren", "plateau"],
    what: "The gradient signal sinks below the noise of measuring it. The optimiser starts following noise instead of the landscape.",
    tell: "Consecutive gradients stop agreeing (cosine ≈ 0) while the loss stops improving.",
    path: "M0 30 L20 31 L28 29 L36 32 L44 30 L52 31 L60 29 L70 31 L80 30 L92 32 L104 29 L118 31 L132 30 L150 32 L168 29 L184 31 L200 30",
  },
  {
    key: "lr_misconfiguration",
    name: ["Step size", "too large"],
    what: "A mis-set learning rate turns descent into a bounce between the walls of the valley.",
    tell: "Loss oscillates; consecutive gradients point in opposite directions (cosine < 0).",
    path: "M0 60 L18 20 L36 64 L54 16 L72 66 L90 18 L108 62 L126 22 L144 66 L162 14 L180 60 L200 24",
  },
  {
    key: "optimizer_instability",
    name: ["Optimizer", "corrupted"],
    what: "The optimiser's momentum memory is corrupted and keeps pushing parameters the wrong way.",
    tell: "Loss drifts upward smoothly with no change to the data or circuit.",
    path: "M0 66 C30 64, 50 60, 70 52 S110 40, 130 34 S170 22, 200 14",
  },
  {
    key: "training_divergence",
    name: ["Numerical", "divergence"],
    what: "A numerical fault poisons the parameters. Every later step returns NaN.",
    tell: "Non-finite loss or gradients: unambiguous, detected in a single step.",
    path: "M0 60 C30 58, 60 56, 90 54 L104 52 L110 0",
  },
  {
    key: "persistent_plateau",
    name: ["Step-size", "collapse"],
    what: "The learning rate collapses toward zero. Gradients are alive, but nothing moves.",
    tell: "Healthy gradient norm, near-zero parameter velocity, flat loss.",
    path: "M0 40 C20 44, 40 47, 60 48 L200 48",
  },
  {
    key: "noise_degradation",
    name: ["Device", "noise"],
    what: "Hardware noise contracts every measurement toward zero. It lives in the device, so rolling back does not remove it.",
    tell: "The measured, label-aligned output margin shrinks by the contraction factor.",
    path: "M0 40 L10 12 L20 66 L30 18 L40 60 L50 24 L60 54 L70 28 L80 50 L90 32 L100 47 L110 35 L120 45 L130 37 L140 43 L150 38 L160 42 L170 39 L180 41 L200 40",
  },
];

export const ChapterFaults: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const rail = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const i = Math.min(FAULTS.length - 1, Math.max(0, Math.floor(v * FAULTS.length)));
    setActive((prev) => (prev === i ? prev : i));
  });

  const f = FAULTS[active];

  return (
    <section id="faults" className="relative bg-[var(--carbon)] text-white">
      <div className="px-4 sm:px-8 lg:px-12 pt-24 sm:pt-32">
        <ChapterMark index="01" label="The problem" tone="carbon" />
        <div className="grid lg:grid-cols-12 gap-8 mt-10">
          <MaskLines
            className="lg:col-span-8 type-wide text-[clamp(2.4rem,6.6vw,6.5rem)]"
            lines={["Six ways a", "quantum model", "quietly fails."]}
          />
          <Reveal className="lg:col-span-4 lg:pt-4 text-white/60 text-lg leading-relaxed" delay={0.15}>
            Each leaves a different fingerprint in the training telemetry. Scroll through them.
          </Reveal>
        </div>
      </div>

      {/* Pinned sequence */}
      <div ref={ref} style={{ height: `${FAULTS.length * 85}vh` }} className="relative">
        <div className="sticky top-0 h-[100svh] overflow-hidden flex flex-col justify-center px-4 sm:px-8 lg:px-12">
          <div className="absolute inset-0 bg-grid-carbon opacity-70 pointer-events-none" />
          <div className="relative grid lg:grid-cols-12 gap-8 items-center">
            {/* progress rail */}
            <div className="hidden lg:flex lg:col-span-1 flex-col items-center gap-3 self-stretch justify-center">
              <span className="type-label text-white/40 tabular">0{active + 1}</span>
              <div className="relative w-px h-56 bg-white/15">
                <motion.div className="absolute inset-x-0 top-0 h-full bg-[var(--signal)] origin-top" style={{ scaleY: rail }} />
              </div>
              <span className="type-label text-white/40 tabular">06</span>
            </div>

            <div className="lg:col-span-7 min-h-[42vh] flex items-center">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: reduce ? 0 : 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduce ? 0 : -40 }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                >
                  <div className="type-label text-[var(--signal-2)] mb-4">Fault {String(active + 1).padStart(2, "0")} / 06</div>
                  <h3 className="type-condensed text-[clamp(4.5rem,13vw,12rem)]">
                    {f.name[0]}
                    <br />
                    <span className="text-white/35">{f.name[1]}</span>
                  </h3>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="lg:col-span-4">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                    <div className="flex items-center justify-between type-label text-white/40 mb-3">
                      <span>Telemetry signature</span>
                      <span>loss</span>
                    </div>
                    <svg viewBox="0 0 200 80" className="w-full h-24" aria-hidden="true">
                      <line x1="0" x2="200" y1="78" y2="78" stroke="rgba(255,255,255,0.12)" />
                      <motion.path
                        d={f.path}
                        fill="none"
                        stroke="var(--signal-2)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        initial={{ pathLength: reduce ? 1 : 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: reduce ? 0 : 1.1, ease: EASE_OUT }}
                      />
                      {f.key === "training_divergence" && (
                        <text x="118" y="14" fill="var(--signal-2)" fontSize="11" fontFamily="var(--font-mono)">NaN</text>
                      )}
                    </svg>
                  </div>
                  <p className="text-white/85 text-lg leading-relaxed">{f.what}</p>
                  <p className="text-white/50 text-sm leading-relaxed border-l border-[var(--signal)] pl-4">{f.tell}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
