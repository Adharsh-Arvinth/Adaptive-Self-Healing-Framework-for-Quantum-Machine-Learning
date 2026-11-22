"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowLeft, ArrowUpRight, GraduationCap, Moon, Sun, Type } from "lucide-react";
import { Logo } from "./Logo";
import { SOCIAL } from "./story/ChapterFinale";
import { REPO } from "./story/ChapterResources";
import { useAppearance } from "./appearance/AppearanceProvider";

interface HeaderProps {
  isConnected: boolean;
  pipelineState: string;
  stepCount: number;
  maxSteps: number;
  isRunning: boolean;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStep: () => void;
  onResetPrompt: () => void;
  activeView: "landing" | "dashboard";
  onToggleView: (view: "landing" | "dashboard") => void;
  onStartTour?: () => void;
}

const CHAPTERS = [
  { n: "01", label: "The problem", href: "#faults", blurb: "Six ways a variational quantum classifier quietly breaks while it trains." },
  { n: "02", label: "The loop", href: "#loop", blurb: "Detect, diagnose, rehearse, deploy on probation, then commit or roll back." },
  { n: "03", label: "The actuators", href: "#repairs", blurb: "Six small, reversible repairs and the guard rails around each one." },
  { n: "04", label: "The evidence", href: "#evidence", blurb: "3,850 counterfactual episodes across 11 datasets and three fault regimes." },
  { n: "05", label: "The boundaries", href: "#limits", blurb: "What the results do not show, stated plainly." },
  { n: "06", label: "Use the research", href: "#resources", blurb: "Dataset, code, reproduction commands and citation." },
  { n: "07", label: "FAQ", href: "#faq", blurb: "Short answers to the questions reviewers ask first." },
  { n: "08", label: "Enter the lab", href: "#lab-cta", blurb: "Train a live model, break it on purpose and watch it heal." },
  { n: "09", label: "Contact", href: "#contact", blurb: "GitHub, LinkedIn and email." },
];

const Mark: React.FC = () => <Logo />;

export const Header: React.FC<HeaderProps> = ({
  isConnected,
  isDarkMode,
  onToggleTheme,
  activeView,
  onToggleView,
  onStartTour,
  stepCount,
  maxSteps,
}) => {
  const { openSheet } = useAppearance();
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState(0);
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(activeView === "landing" && y > 160 && y > prev && !menuOpen);
  });

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (menuOpen) lenis?.stop();
    else lenis?.start();
  }, [menuOpen]);

  const cap = "hdr-cap";

  if (activeView === "dashboard") {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-c-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto h-16 px-3 min-[400px]:px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-3">
          <button onClick={() => onToggleView("landing")} className="flex items-center gap-3 min-w-0 text-[var(--content-primary)]" aria-label="Back to the story">
            <Logo textClassName="hidden min-[400px]:block" />
          </button>
          <div className="hidden lg:flex items-center gap-3 whitespace-nowrap type-label text-[var(--content-secondary)]">
            <span className="text-[var(--accent)]">Research lab</span>
            <span className="h-3 w-px bg-[var(--border-highlight)]" />
            <span className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--status-success)] animate-pulse-dot" : "bg-[var(--status-warning)]"}`} />
              {isConnected ? "Backend live" : "Connecting…"}
            </span>
            <span className="h-3 w-px bg-[var(--border-highlight)]" />
            <span className="tabular">
              Step {stepCount}/{maxSteps}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {onStartTour && (
              <button
                onClick={onStartTour}
                className="hdr-cap hdr-text inline-flex items-center gap-2 h-10 w-10 sm:w-auto justify-center sm:px-4 rounded-full !text-[var(--accent)]"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Tutorial</span>
              </button>
            )}
            <button
              onClick={openSheet}
              className="hdr-cap h-10 w-10 rounded-full flex items-center justify-center"
              aria-label="Appearance: mode, palette and typeface"
              title="Appearance"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleTheme}
              className="hdr-cap h-10 w-10 rounded-full flex items-center justify-center"
              aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleView("landing")}
              className="hdr-cta hdr-text inline-flex items-center justify-center gap-2 h-10 w-10 sm:w-auto sm:px-4 rounded-full"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Story</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <motion.header
        className="fixed top-0 inset-x-0 z-50 pointer-events-none"
        animate={{ y: hidden ? "-110%" : "0%" }}
        transition={{ duration: reduce ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] }}
      >
        <div className="flex items-center justify-between gap-2 px-3 min-[400px]:px-4 sm:px-8 lg:px-12 h-[4.5rem] sm:h-20">
          <a href="#top" data-on-carbon={menuOpen} className={`pointer-events-auto shrink-0 h-11 pl-3 pr-4 sm:px-4 flex items-center rounded-full ${cap}`} aria-label="Top of page" onClick={() => setMenuOpen(false)}>
            <Mark />
          </a>
          <div className="flex items-center gap-1.5 sm:gap-3 pointer-events-auto shrink-0">
            <button
              onClick={openSheet}
              aria-label="Appearance: mode, palette and typeface"
              title="Appearance"
              data-on-carbon={menuOpen}
              className={`hidden sm:flex h-11 w-11 rounded-full ${cap} items-center justify-center`}
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close chapters" : "Open chapters"}
              data-on-carbon={menuOpen}
              className={`hdr-text h-11 w-11 sm:w-auto sm:pl-5 sm:pr-4 flex items-center justify-center gap-3 rounded-full ${cap}`}
            >
              <span className="hidden sm:inline">{menuOpen ? "Close" : "Chapters"}</span>
              <span className="relative w-5 sm:w-6 h-3">
                <motion.span className="absolute left-0 right-0 h-[1.5px] bg-current" animate={{ top: menuOpen ? 5 : 0, rotate: menuOpen ? 45 : 0 }} />
                <motion.span className="absolute left-0 right-0 h-[1.5px] bg-current" animate={{ top: menuOpen ? 5 : 10, rotate: menuOpen ? -45 : 0 }} />
              </span>
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                onToggleView("dashboard");
              }}
              className="hdr-cta hdr-text inline-flex items-center rounded-full h-11 px-4 sm:px-5 gap-1.5 whitespace-nowrap"
            >
              <span className="hidden min-[420px]:inline">Live lab</span><span className="min-[420px]:hidden">Lab</span> <ArrowUpRight className="w-4 h-4 hidden min-[375px]:block" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="fixed inset-0 z-40 bg-[var(--carbon)] text-white overflow-y-auto overscroll-contain"
            data-lenis-prevent
            initial={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduce ? 0 : 1 }}
            animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
            exit={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduce ? 0 : 1 }}
            transition={{ duration: reduce ? 0.2 : 0.7, ease: [0.77, 0, 0.175, 1] }}
            aria-label="Chapters"
          >
            <div className="fixed inset-0 bg-grid-carbon opacity-60 pointer-events-none" />
            <div className="relative min-h-full flex flex-col px-4 sm:px-8 lg:px-12 pt-24 sm:pt-28 pb-6">
              <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)] gap-10 lg:gap-16 items-end">
                {/* Chapter list: sized by the viewport height so all nine always fit */}
                <ol className="min-w-0" onMouseLeave={() => setHover(0)}>
                  {CHAPTERS.map((c, i) => (
                    <li key={c.href} className="border-t border-white/10 overflow-hidden">
                      <motion.a
                        href={c.href}
                        onClick={() => setMenuOpen(false)}
                        onMouseEnter={() => setHover(i)}
                        onFocus={() => setHover(i)}
                        className="group grid grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] items-center gap-3 py-[clamp(0.3rem,0.9dvh,0.8rem)]"
                        initial={{ y: reduce ? 0 : "105%" }}
                        animate={{ y: "0%" }}
                        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : 0.2 + i * 0.045 }}
                      >
                        <span className={`type-label tabular transition-colors duration-200 ${hover === i ? "text-[var(--signal-2)]" : "text-white/35"}`}>{c.n}</span>
                        <span
                          className={`type-condensed leading-[0.95] whitespace-nowrap text-[clamp(1.9rem,min(11vw,calc((100dvh_-_15rem)/10)),6.4rem)] transition-[color,transform] duration-300 ease-out group-hover:translate-x-2 ${
                            hover === i ? "text-white" : "text-white/45"
                          }`}
                        >
                          {c.label}
                        </span>
                        <ArrowUpRight
                          className={`w-5 h-5 sm:w-6 sm:h-6 transition-[opacity,transform] duration-300 ${
                            hover === i ? "opacity-100 text-[var(--signal-2)] rotate-45" : "opacity-0 -translate-x-2"
                          }`}
                        />
                      </motion.a>
                    </li>
                  ))}
                </ol>

                {/* Side column: what the hovered chapter holds, plus quick links */}
                <motion.aside
                  className="hidden lg:flex flex-col gap-8 pb-2"
                  initial={{ opacity: 0, y: reduce ? 0 : 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : 0.45 }}
                >
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 min-h-[11rem]">
                    <div className="type-label text-[var(--signal-2)] tabular">Chapter {CHAPTERS[hover].n}</div>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={hover}
                        initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                      >
                        <div className="font-display font-bold text-[1.35rem] tracking-[-0.02em] mt-2">{CHAPTERS[hover].label}</div>
                        <p className="text-white/60 mt-2 leading-relaxed">{CHAPTERS[hover].blurb}</p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                  <div className="space-y-px">
                    {[
                      { label: "GitHub", href: SOCIAL.github },
                      { label: "LinkedIn", href: SOCIAL.linkedin },
                      { label: "Source code", href: REPO },
                    ].map((l) => (
                      <a
                        key={l.label}
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex items-center justify-between border-b border-white/10 py-3 text-white/70 hover:text-white transition-colors duration-200"
                      >
                        <span>{l.label}</span>
                        <ArrowUpRight className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                      </a>
                    ))}
                  </div>
                </motion.aside>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-white/10 pt-5 type-label text-white/50">
                <span className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--heal)] animate-pulse-dot" : "bg-white/30"}`} />
                  {isConnected ? "Backend live" : "Backend waking up"}
                </span>
                <span className="hidden md:inline text-white/30">Esc to close</span>
                <div className="flex items-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      openSheet();
                    }}
                    className="inline-flex items-center gap-2 hover:text-white transition-colors"
                  >
                    <Type className="w-3.5 h-3.5" /> Appearance
                  </button>
                  <a href={REPO} target="_blank" rel="noreferrer" className="lg:hidden hover:text-white transition-colors">
                    Source ↗
                  </a>
                </div>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};
