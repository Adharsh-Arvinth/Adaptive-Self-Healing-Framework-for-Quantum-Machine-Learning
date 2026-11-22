"use client";

import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Moon, RotateCcw, Sun, X } from "lucide-react";
import { useAppearance } from "./AppearanceProvider";
import { DEFAULT_APPEARANCE, FONTS, PALETTES } from "./palettes";

const spring = { type: "spring" as const, bounce: 0, duration: 0.4 };

export const AppearancePanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { appearance, setAppearance, reset } = useAppearance();
  const isDefault =
    appearance.mode === DEFAULT_APPEARANCE.mode &&
    appearance.palette === DEFAULT_APPEARANCE.palette &&
    appearance.font === DEFAULT_APPEARANCE.font;

  return (
    <div className="space-y-9 text-[var(--content-primary)]">
      {/* Mode */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="type-label text-[var(--content-secondary)]">Mode</h4>
          <span className="text-xs text-[var(--content-tertiary)]">Applies to the whole site</span>
        </div>
        <div className="relative grid grid-cols-2 p-1 rounded-full bg-[var(--bg-subtle)] border border-[var(--border-subtle)]" role="radiogroup" aria-label="Mode">
          {(["day", "night"] as const).map((m) => {
            const active = appearance.mode === m;
            const Icon = m === "day" ? Sun : Moon;
            return (
              <button
                key={m}
                role="radio"
                aria-checked={active}
                onClick={() => setAppearance({ mode: m })}
                className={`relative h-11 rounded-full text-sm font-semibold flex items-center justify-center gap-2 transition-colors duration-200 ${
                  active ? "text-[var(--bg-primary)]" : "text-[var(--content-secondary)] hover:text-[var(--content-primary)]"
                }`}
              >
                {active && (
                  <motion.span layoutId={`mode-pill-${compact ? "s" : "p"}`} transition={spring} className="absolute inset-0 rounded-full bg-[var(--content-primary)]" />
                )}
                <Icon className="relative w-4 h-4" />
                <span className="relative">{m === "day" ? "Day" : "Night"}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Palettes */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="type-label text-[var(--content-secondary)]">Colour palette</h4>
          <span className="text-xs text-[var(--content-tertiary)]">{PALETTES.find((p) => p.id === appearance.palette)?.name}</span>
        </div>
        <div className={`grid gap-3 ${compact ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"}`} role="radiogroup" aria-label="Colour palette">
          {PALETTES.map((p) => {
            const t = appearance.mode === "night" ? p.night : p.day;
            const active = appearance.palette === p.id;
            return (
              <button
                key={p.id}
                role="radio"
                aria-checked={active}
                onClick={() => setAppearance({ palette: p.id })}
                className={`interactive-card group relative text-left rounded-2xl overflow-hidden border transition-colors duration-200 ${
                  active ? "border-[var(--accent)] ring-1 ring-[var(--accent)]" : "border-[var(--border-subtle)]"
                }`}
              >
                {/* Live miniature of the palette */}
                <div className="relative h-24" style={{ background: t.paper }}>
                  <div className="absolute inset-0 opacity-60" style={{ backgroundImage: `linear-gradient(${t.ink}12 1px, transparent 1px), linear-gradient(90deg, ${t.ink}12 1px, transparent 1px)`, backgroundSize: "14px 14px" }} />
                  <span className="absolute left-3 top-2 type-condensed text-[2.4rem]" style={{ color: t.ink }}>Aa</span>
                  <span className="absolute right-3 top-3 w-4 h-4 rounded-full" style={{ background: t.signal }} />
                  <div className="absolute left-0 right-0 bottom-0 h-7 flex items-center gap-1.5 px-3" style={{ background: t.carbon }}>
                    <span className="h-1.5 w-8 rounded-full" style={{ background: t.signal }} />
                    <span className="h-1.5 w-5 rounded-full" style={{ background: t.heal }} />
                    <span className="h-1.5 w-3 rounded-full opacity-50" style={{ background: t.paper }} />
                  </div>
                  <AnimatePresence>
                    {active && (
                      <motion.span
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.6, opacity: 0 }}
                        transition={spring}
                        className="absolute right-2 bottom-9 w-6 h-6 rounded-full flex items-center justify-center text-white"
                        style={{ background: t.accent }}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <div className="px-3 py-2.5 bg-[var(--bg-surface)]">
                  <div className="text-sm font-semibold">{p.name}</div>
                  <div className="text-xs text-[var(--content-tertiary)] truncate">{p.mood}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Typefaces */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h4 className="type-label text-[var(--content-secondary)]">Typeface</h4>
          <span className="text-xs text-[var(--content-tertiary)]">{FONTS.find((f) => f.id === appearance.font)?.name}</span>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] overflow-hidden divide-y divide-[var(--border-subtle)]" role="radiogroup" aria-label="Typeface">
          {FONTS.map((f) => {
            const active = appearance.font === f.id;
            return (
              <button
                key={f.id}
                role="radio"
                aria-checked={active}
                onClick={() => setAppearance({ font: f.id })}
                className={`w-full flex items-center gap-4 px-4 py-3.5 text-left transition-colors duration-200 ${
                  active ? "bg-[var(--accent-subtle)]" : "bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <span className="w-16 shrink-0 text-[2rem] leading-none font-extrabold uppercase" style={{ fontFamily: f.sample }}>
                  Aa
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">{f.name}</span>
                  <span className="block text-xs text-[var(--content-tertiary)] truncate">{f.note}</span>
                </span>
                <span
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors duration-200 ${
                    active ? "bg-[var(--accent)] border-[var(--accent)] text-white" : "border-[var(--border-highlight)]"
                  }`}
                >
                  {active && <Check className="w-3.5 h-3.5" />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <button
        onClick={reset}
        disabled={isDefault}
        className="apple-btn inline-flex items-center gap-2 h-10 px-4 rounded-full border border-[var(--border-highlight)] text-sm font-medium disabled:opacity-40"
      >
        <RotateCcw className="w-4 h-4" /> Reset to default (Scuderia · Day · Racing)
      </button>
    </div>
  );
};

/** Right-hand sheet that hosts the panel; opened from the header's "Aa" button. */
export const AppearanceSheet: React.FC = () => {
  const { sheetOpen, closeSheet } = useAppearance();
  const reduce = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    window.addEventListener("keydown", onKey);
    const lenis = (window as unknown as { __lenis?: { stop: () => void; start: () => void } }).__lenis;
    lenis?.stop();
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      lenis?.start();
    };
  }, [sheetOpen, closeSheet]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {sheetOpen && (
        <div className="fixed inset-0 z-[95]" role="dialog" aria-modal="true" aria-label="Appearance">
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={closeSheet}
          />
          <motion.aside
            ref={panelRef}
            tabIndex={-1}
            data-lenis-prevent
            className="absolute right-0 top-0 h-full w-full sm:w-[30rem] bg-[var(--bg-primary)] border-l border-[var(--border-subtle)] shadow-[0_0_80px_-20px_rgba(0,0,0,0.5)] overflow-y-auto outline-none"
            initial={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reduce ? 0 : "100%", opacity: reduce ? 0 : 1 }}
            transition={reduce ? { duration: 0.2 } : { type: "spring", bounce: 0, duration: 0.5 }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 h-16 bg-c-bg-primary/90 backdrop-blur-xl border-b border-[var(--border-subtle)]">
              <div className="type-condensed text-3xl">Appearance</div>
              <button onClick={closeSheet} className="apple-btn w-10 h-10 rounded-full border border-[var(--border-subtle)] flex items-center justify-center" aria-label="Close appearance settings">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <AppearancePanel compact />
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
