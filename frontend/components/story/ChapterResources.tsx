"use client";

import React, { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, Check, Copy, Plus } from "lucide-react";
import { ChapterMark, EASE_OUT, MaskLines, Reveal } from "./motion";
import { useResults } from "./useResults";

export const REPO = "https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning";
const BLOB = `${REPO}/blob/main`;
const TREE = `${REPO}/tree/main`;

const BIBTEX = `@misc{arvinth2026selfhealing,
  title  = {Adaptive Self-Healing for Variational Quantum Classifiers:
            the QFaultBench-VQC Counterfactual Benchmark},
  author = {Arvinth, Adharsh},
  year   = {2026},
  howpublished = {\\url{${REPO}}},
  note   = {Code and dataset, QFaultBench-VQC v1}
}`;

const REPRO = `git clone ${REPO}.git
cd Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning
pip install -r requirements.txt
python -m research.analysis      # re-derive every number from the raw data
python -m research.figures       # rebuild the figures`;

/** Copy-to-clipboard with a short, spring-free confirmation (frequent action: kept fast). */
const CopyButton: React.FC<{ text: string; label: string; tone?: "paper" | "carbon" }> = ({ text, label, tone = "carbon" }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        } catch {
          /* clipboard unavailable: ignore */
        }
      }}
      className={`apple-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-medium border ${
        tone === "carbon" ? "border-white/15 text-white/80 hover:text-white hover:border-white/40" : "border-c-ink/20 hover:border-[var(--ink)]"
      }`}
      aria-live="polite"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={done ? "done" : "idle"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="inline-flex items-center gap-2"
        >
          {done ? <Check className="w-4 h-4 text-[var(--heal)]" /> : <Copy className="w-4 h-4" />}
          {done ? "Copied" : label}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

export const ChapterResources: React.FC = () => {
  const { data } = useResults();
  const cards = [
    { k: "Findings", t: "Read the research", d: "The audit, the protocol, what the results mean and what they do not.", href: `${BLOB}/research/RESEARCH_FINDINGS.md` },
    { k: "Results", t: "Every number", d: "Generated tables for both noise regimes: no hand-typed figures.", href: `${BLOB}/research/RESULTS.md` },
    {
      k: "Dataset",
      t: "QFaultBench-VQC",
      d: `Every campaign episode labelled, with counterfactual outcomes for all actions, a datasheet and checksums${data ? ` (${data.datasets.length} datasets)` : ""}.`,
      href: `${TREE}/research/dataset/qfaultbench_v1`,
    },
    { k: "API", t: "Live backend", d: "Interactive FastAPI documentation for the simulator the lab talks to.", href: "https://qml-backend-nczx.onrender.com/docs" },
  ];
  return (
    <section id="resources" className="relative bg-grid-paper text-[var(--ink)] px-4 sm:px-8 lg:px-12 py-24 sm:py-32">
      <ChapterMark index="06" label="Use the research" />
      <div className="grid lg:grid-cols-12 gap-8 mt-10 mb-14">
        <MaskLines className="lg:col-span-8 type-wide text-[clamp(2.4rem,6.6vw,6.5rem)]" lines={["Open data.", "Open method."]} />
        <Reveal className="lg:col-span-4 lg:pt-4 text-[var(--ink-2)] text-lg leading-relaxed" delay={0.15}>
          Everything behind this page is public: code, raw campaign data, the released benchmark and the analysis that turns
          one into the other.
        </Reveal>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <Reveal key={c.k} delay={i * 0.06}>
            <a
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col justify-between h-full min-h-[15rem] rounded-[1.75rem] border border-c-ink/[0.12] bg-[var(--paper)] p-6 transition-colors duration-300 hover:bg-[var(--ink)] hover:text-[var(--paper)]"
            >
              <div className="flex items-start justify-between">
                <span className="type-label opacity-60">{c.k}</span>
                <ArrowUpRight className="w-5 h-5 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </div>
              <div>
                <h3 className="type-wide text-2xl">{c.t}</h3>
                <p className="text-[0.95rem] leading-relaxed opacity-70 mt-2">{c.d}</p>
              </div>
            </a>
          </Reveal>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <Reveal className="min-w-0">
          <div className="rounded-[1.75rem] bg-[var(--carbon)] text-white p-6 sm:p-7 h-full">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="type-label text-white/45">Reproduce</div>
                <div className="type-wide text-xl mt-1">One copy, five commands</div>
              </div>
              <CopyButton text={REPRO} label="Copy" />
            </div>
            <pre className="font-mono text-[0.8rem] leading-relaxed text-white/80 overflow-x-auto whitespace-pre" data-lenis-prevent>
              {REPRO}
            </pre>
          </div>
        </Reveal>
        <Reveal delay={0.06} className="min-w-0">
          <div className="rounded-[1.75rem] bg-[var(--carbon)] text-white p-6 sm:p-7 h-full">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <div className="type-label text-white/45">Cite</div>
                <div className="type-wide text-xl mt-1">BibTeX</div>
              </div>
              <CopyButton text={BIBTEX} label="Copy" />
            </div>
            <pre className="font-mono text-[0.8rem] leading-relaxed text-white/80 overflow-x-auto whitespace-pre" data-lenis-prevent>
              {BIBTEX}
            </pre>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

const FAQS = [
  {
    q: "What does \"self-healing\" mean here?",
    a: "While a quantum classifier trains, the system watches its telemetry, recognises when something has gone wrong, names the likely cause, rehearses a fix on a copy of the model, and applies it only if it survives a short probation, rolling back otherwise.",
  },
  {
    q: "Does this run on a real quantum computer?",
    a: "Not yet. Training runs on PennyLane's exact statevector simulator. A second regime injects noise derived from public IBM device calibration data, which is as close to hardware as the study goes today.",
  },
  {
    q: "So what actually works best?",
    a: "On this benchmark, restoring the last healthy checkpoint recovers far more faults than choosing among configuration repairs with a bandit. The learned diagnosis is the strongest component: it recognises the fault correctly on datasets it never saw.",
  },
  {
    q: "Can I use the dataset or code?",
    a: "Yes. Both are public in the GitHub repository with a datasheet and checksums. Please cite the work if you build on it; the BibTeX is just above.",
  },
  {
    q: "Why is the lab slow to respond at first?",
    a: "The simulator backend runs on a free server that sleeps when idle. The first request wakes it, which can take up to a minute; after that it responds step by step.",
  },
  {
    q: "Can visitors change or break the live experiment?",
    a: "The lab drives one shared demo simulator, so anyone can start, pause or reset it, by design. Nobody can change the website itself: what someone edits in their browser's inspector only changes their own screen.",
  },
];

export const ChapterFAQ: React.FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <section id="faq" className="relative bg-grid-paper text-[var(--ink)] px-4 sm:px-8 lg:px-12 pb-24 sm:pb-32">
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 border-t border-c-ink/[0.12] pt-16">
        <div className="lg:col-span-4">
          <div className="type-label text-[var(--ink-2)] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)]" /> Questions
          </div>
          <h2 className="type-condensed text-[clamp(3.5rem,7vw,7rem)] mt-4">FAQ</h2>
          <p className="text-[var(--ink-2)] leading-relaxed mt-4 max-w-sm">The short answers people ask for first.</p>
        </div>
        <ul className="lg:col-span-8 border-t border-c-ink/[0.12]">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-c-ink/[0.12]">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-6 py-6 text-left group"
                >
                  <span className="type-wide text-[clamp(1.1rem,1.6vw,1.6rem)] group-hover:text-[var(--signal)] transition-colors duration-200">{f.q}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 45 : 0 }}
                    transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                    className={`shrink-0 w-10 h-10 rounded-full border flex items-center justify-center ${
                      isOpen ? "bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]" : "border-c-ink/20"
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </motion.span>
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: reduce ? 0.15 : 0.4, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <p className="pb-7 pr-14 text-[var(--ink-2)] leading-relaxed text-[1.05rem] max-w-3xl">{f.a}</p>
                </motion.div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
