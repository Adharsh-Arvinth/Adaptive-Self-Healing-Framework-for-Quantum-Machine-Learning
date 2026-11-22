"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { ArrowLeft, ArrowUpRight, GraduationCap, Moon, Sun, Type } from "lucide-react";
import { Logo } from "./Logo";
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
  { n: "01", label: "The problem", href: "#faults" },
  { n: "02", label: "The loop", href: "#loop" },
  { n: "03", label: "The actuators", href: "#repairs" },
  { n: "04", label: "The evidence", href: "#evidence" },
  { n: "05", label: "The boundaries", href: "#limits" },
  { n: "06", label: "Use the research", href: "#resources" },
  { n: "07", label: "FAQ", href: "#faq" },
  { n: "08", label: "Enter the lab", href: "#lab-cta" },
  { n: "09", label: "Contact", href: "#contact" },
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
  const reduce = useReducedMotion();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(activeView === "landing" && y > 160 && y > prev && !menuOpen);
  });

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    if (menuOpen) lenis?.stop();
    else lenis?.start();
  }, [menuOpen]);

  if (activeView === "dashboard") {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-[var(--border-subtle)] bg-c-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto h-16 px-4 sm:px-6 flex items-center justify-between gap-3">
          <button onClick={() => onToggleView("landing")} className="flex items-center gap-3 text-[var(--content-primary)]" aria-label="Back to the story">
            <Mark />
          </button>
          <div className="hidden md:flex items-center gap-3 type-label text-[var(--content-secondary)]">
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
          <div className="flex items-center gap-2">
            {onStartTour && (
              <button
                onClick={onStartTour}
                className="apple-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-sm font-semibold bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Tutorial</span>
              </button>
            )}
            <button
              onClick={openSheet}
              className="apple-btn h-9 w-9 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] flex items-center justify-center text-[var(--content-secondary)]"
              aria-label="Appearance: mode, palette and typeface"
              title="Appearance"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={onToggleTheme}
              className="apple-btn h-9 w-9 rounded-full border border-[var(--border-subtle)] hover:border-[var(--border-highlight)] flex items-center justify-center text-[var(--content-secondary)]"
              aria-label={isDarkMode ? "Switch to light theme" : "Switch to dark theme"}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => onToggleView("landing")}
              className="apple-btn inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-semibold bg-[var(--content-primary)] text-[var(--bg-primary)]"
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
        <div className="flex items-center justify-between px-4 sm:px-8 lg:px-12 h-20">
          <a href="#top" className="pointer-events-auto h-11 px-4 flex items-center rounded-full bg-c-paper/75 backdrop-blur-xl backdrop-saturate-150 border border-c-ink/10 text-[var(--ink)] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)]" aria-label="Top of page">
            <Mark />
          </a>
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <button
              onClick={openSheet}
              aria-label="Appearance: mode, palette and typeface"
              title="Appearance"
              className="h-11 w-11 rounded-full bg-c-paper/75 backdrop-blur-xl backdrop-saturate-150 border border-c-ink/10 text-[var(--ink)] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)] flex items-center justify-center apple-btn"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              className="type-label h-11 px-4 flex items-center gap-3 rounded-full bg-c-paper/75 backdrop-blur-xl backdrop-saturate-150 border border-c-ink/10 text-[var(--ink)] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)]"
            >
              <span>{menuOpen ? "Close" : "Chapters"}</span>
              <span className="relative w-6 h-3">
                <motion.span className="absolute left-0 right-0 h-[1.5px] bg-current" animate={{ top: menuOpen ? 5 : 0, rotate: menuOpen ? 45 : 0 }} />
                <motion.span className="absolute left-0 right-0 h-[1.5px] bg-current" animate={{ top: menuOpen ? 5 : 10, rotate: menuOpen ? -45 : 0 }} />
              </span>
            </button>
            <button
              onClick={() => onToggleView("dashboard")}
              className="btn-ink h-11 !py-0 !px-5 text-sm bg-[var(--signal)] text-white hover:bg-[var(--ink)] shadow-[0_8px_24px_-12px_rgba(232,52,28,0.7)]"
            >
              Live lab <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            className="fixed inset-0 z-40 bg-[var(--carbon)] text-white flex flex-col justify-end px-4 sm:px-8 lg:px-12 pb-10 pt-28"
            initial={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduce ? 0 : 1 }}
            animate={{ clipPath: "inset(0 0 0% 0)", opacity: 1 }}
            exit={{ clipPath: reduce ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", opacity: reduce ? 0 : 1 }}
            transition={{ duration: reduce ? 0.2 : 0.7, ease: [0.77, 0, 0.175, 1] }}
            aria-label="Chapters"
          >
            <div className="absolute inset-0 bg-grid-carbon opacity-70 pointer-events-none" />
            <ul className="relative">
              {CHAPTERS.map((c, i) => (
                <li key={c.href} className="border-t border-white/10 overflow-hidden">
                  <motion.a
                    href={c.href}
                    onClick={() => setMenuOpen(false)}
                    className="group flex items-baseline gap-6 py-3 sm:py-4"
                    initial={{ y: reduce ? 0 : "100%" }}
                    animate={{ y: "0%" }}
                    transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : 0.18 + i * 0.05 }}
                  >
                    <span className="type-label text-white/40 tabular w-8">{c.n}</span>
                    <span className="type-condensed text-[clamp(2.8rem,8.5vw,7rem)] text-white/80 group-hover:text-[var(--signal-2)] transition-colors duration-200">
                      {c.label}
                    </span>
                  </motion.a>
                </li>
              ))}
            </ul>
            <div className="relative flex items-center justify-between border-t border-white/10 pt-6 type-label text-white/50">
              <span className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--heal)]" : "bg-white/30"}`} />
                {isConnected ? "Backend live" : "Backend waking up"}
              </span>
              <a
                href="https://github.com/Adharsh-Arvinth/Adaptive-Self-Healing-Framework-for-Quantum-Machine-Learning"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white"
              >
                Source on GitHub ↗
              </a>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
};
