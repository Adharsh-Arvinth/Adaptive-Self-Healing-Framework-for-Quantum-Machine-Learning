"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

/* --------------------------------------------------------------------------
   Guided tour of the research lab.
   A spotlight glides (critically damped spring) between real elements marked with
   data-tour="…", switching dashboard tabs as needed. Keyboard: ← → Esc.
   Auto-starts on the first visit; reopen from the header's Tour button.
   -------------------------------------------------------------------------- */

export type TourTab = "overview" | "experiment" | "diagnosis" | "repairs" | "evidence";

export interface TourStep {
  target?: string; // data-tour id; omitted = centred card
  tab?: TourTab;
  title: string;
  body: React.ReactNode;
  hint?: string;
}

export const LAB_TOUR: TourStep[] = [
  {
    title: "Welcome to the lab",
    body: (
      <>
        A real 4-qubit quantum classifier is training on the server. In about a minute you will start it, break it on
        purpose, and watch the system diagnose and repair the fault.
      </>
    ),
    hint: "Use ← → or the buttons. Esc closes.",
  },
  {
    target: "controls",
    tab: "overview",
    title: "1 · Start training",
    body: (
      <>
        Press <b>Start</b> (or <b>New Experiment</b> if a previous run has finished). The model trains continuously;{" "}
        <b>Step</b> advances one step at a time. Let it run for about <b>10 healthy steps</b> so the detector learns
        what normal looks like for this run.
      </>
    ),
    hint: "If nothing happens, the free backend may still be waking up (up to a minute).",
  },
  {
    target: "metrics",
    tab: "overview",
    title: "2 · Read the vital signs",
    body: (
      <>
        Loss should fall and accuracy rise. Gradient norm and parameter velocity are what the detector watches: when
        they behave strangely, something is wrong.
      </>
    ),
  },
  {
    target: "inject",
    tab: "experiment",
    title: "3 · Break it on purpose",
    body: (
      <>
        Pick a severity, then click a fault card to inject it. Start with <b>LR Misconfig</b> at <b>1.0x</b>: its
        signature is the clearest. Then go back to <b>Overview</b> while training keeps running.
      </>
    ),
  },
  {
    target: "diagnosis",
    tab: "overview",
    title: "4 · Watch the diagnosis",
    body: (
      <>
        Within a few steps the system names the likely cause and its confidence. Below <b>60%</b> it deliberately waits
        rather than guessing. That is the confidence gate.
      </>
    ),
  },
  {
    target: "repairs",
    tab: "overview",
    title: "5 · The repair decision",
    body: (
      <>
        The bandit highlights the repair it chose. You can also rehearse any repair in the digital-twin sandbox, or
        deploy one yourself.
      </>
    ),
  },
  {
    target: "deployment",
    tab: "overview",
    title: "6 · Probation, then commit or rollback",
    body: (
      <>
        A deployed repair is watched for <b>3 steps</b>. If training improved it is committed; if not, the model returns
        to its exact pre-repair checkpoint. You can force either.
      </>
    ),
  },
  {
    target: "tabs",
    title: "7 · Go deeper",
    body: (
      <>
        Explore the digital twin, the bandit&apos;s learned beliefs, the failure memory, and <b>Evidence</b>: the full
        benchmark results. Press <b>Reset</b> to start a fresh experiment any time.
      </>
    ),
    hint: "Reopen this tour from the Tour button in the top bar.",
  },
];

const PAD = 10;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const LabTour: React.FC<{
  open: boolean;
  onClose: () => void;
  onTab: (tab: TourTab) => void;
  steps?: TourStep[];
}> = ({ open, onClose, onTab, steps = LAB_TOUR }) => {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vw, setVw] = useState(1200);
  const [vh, setVh] = useState(800);
  const cardRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const step = steps[i];

  useEffect(() => {
    if (open) setI(0);
  }, [open]);

  const measure = useCallback(() => {
    setVw(window.innerWidth);
    setVh(window.innerHeight);
    if (!step?.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ x: r.left - PAD, y: r.top - PAD, w: r.width + PAD * 2, h: r.height + PAD * 2 });
  }, [step]);

  // Switch tab, bring the target into view, then measure.
  useLayoutEffect(() => {
    if (!open || !step) return;
    if (step.tab) onTab(step.tab);
    let t2 = 0;
    const t1 = window.setTimeout(() => {
      const el = step.target ? (document.querySelector(`[data-tour="${step.target}"]`) as HTMLElement | null) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        const wantTop = Math.max(80, (window.innerHeight - Math.min(r.height, window.innerHeight * 0.55)) / 2 - 60);
        window.scrollBy({ top: r.top - wantTop, behavior: reduce ? "auto" : "smooth" });
      }
      t2 = window.setTimeout(measure, reduce ? 30 : 420);
    }, 60);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, i, step, onTab, measure, reduce]);

  useEffect(() => {
    if (!open) return;
    const on = () => measure();
    window.addEventListener("resize", on);
    window.addEventListener("scroll", on, { passive: true });
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("scroll", on);
    };
  }, [open, measure]);

  const next = useCallback(() => (i < steps.length - 1 ? setI(i + 1) : onClose()), [i, steps.length, onClose]);
  const prev = useCallback(() => setI((v) => Math.max(0, v - 1)), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    cardRef.current?.focus({ preventScroll: true });
    return () => window.removeEventListener("keydown", onKey);
  }, [open, next, prev, onClose]);

  if (!step || typeof document === "undefined") return null;

  const isMobile = vw < 640;
  const CARD_W = 360;
  let cardStyle: React.CSSProperties;
  if (isMobile || !rect) {
    cardStyle = isMobile
      ? { left: 12, right: 12, bottom: 12 }
      : // centred with coordinates, not a CSS transform (motion owns this element's transform)
        { left: Math.max(12, (vw - 420) / 2), top: Math.max(12, (vh - 300) / 2), width: 420 };
  } else {
    const below = rect.y + rect.h + 14;
    const fitsBelow = below + 230 < vh;
    const top = fitsBelow ? below : Math.max(12, rect.y - 14 - 230);
    const left = Math.min(Math.max(12, rect.x), vw - CARD_W - 12);
    cardStyle = { left, top, width: CARD_W };
  }

  const spring = reduce ? { duration: 0 } : { type: "spring" as const, bounce: 0, duration: 0.5 };

  // Portal to <body>: an ancestor with a transform (e.g. a fade-in animation) would otherwise become the
  // containing block of this fixed overlay and trap it inside the dashboard.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-label="Lab tour"
        >
          {/* Spotlight: a cut-out made with a huge box-shadow (one moving element, no repaint of the page) */}
          {rect ? (
            <motion.div
              className="absolute left-0 top-0 rounded-2xl pointer-events-none ring-2 ring-[var(--accent)]"
              style={{ boxShadow: "0 0 0 9999px rgba(6,6,7,0.68)" }}
              initial={false}
              animate={{ x: rect.x, y: rect.y, width: rect.w, height: rect.h }}
              transition={spring}
            />
          ) : (
            <div className="absolute inset-0 bg-[rgba(6,6,7,0.68)]" />
          )}
          {/* click-catcher (does not close: avoids accidental dismissal) */}
          <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

          <motion.div
            ref={cardRef}
            tabIndex={-1}
            key={i}
            className="absolute outline-none rounded-3xl bg-[var(--bg-surface-elevated)] text-[var(--content-primary)] border border-[var(--border-highlight)] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] p-6"
            style={cardStyle}
            initial={{ opacity: 0, y: reduce ? 0 : 10, scale: reduce ? 1 : 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="type-label text-[var(--accent)] tabular">
                {i === 0 ? "Guided tour" : `Step ${i} of ${steps.length - 1}`}
              </div>
              <button onClick={onClose} className="apple-btn -m-1 p-1 rounded-lg text-[var(--content-tertiary)] hover:text-[var(--content-primary)]" aria-label="Close tour">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h3 className="type-wide text-2xl mt-2">{step.title}</h3>
            <p className="text-[15px] leading-relaxed text-[var(--content-secondary)] mt-3 [&_b]:text-[var(--content-primary)] [&_b]:font-semibold">
              {step.body}
            </p>
            {step.hint && <p className="text-xs text-[var(--content-tertiary)] mt-3">{step.hint}</p>}

            <div className="flex items-center justify-between mt-6">
              <div className="flex gap-1.5" aria-hidden="true">
                {steps.map((_, k) => (
                  <span
                    key={k}
                    className={`h-1.5 rounded-full transition-all duration-300 ${k === i ? "w-5 bg-[var(--accent)]" : "w-1.5 bg-[var(--border-highlight)]"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {i > 0 && (
                  <button onClick={prev} className="apple-btn px-3 py-2 rounded-full text-sm border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>
                )}
                <button onClick={next} className="apple-btn px-4 py-2 rounded-full text-sm font-semibold bg-[var(--accent)] text-white inline-flex items-center gap-1">
                  {i === steps.length - 1 ? "Done" : i === 0 ? "Show me" : "Next"} <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};
