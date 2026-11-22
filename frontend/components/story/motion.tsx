"use client";

/* --------------------------------------------------------------------------
   Motion primitives for the story.
   Rules (from the project's animation skills):
   - animate transform/opacity only; never layout properties;
   - strong ease-out for entrances, critically damped springs for anything that follows input;
   - every effect has a reduced-motion equivalent (cross-fade or static).
   -------------------------------------------------------------------------- */

import React, { useEffect, useRef } from "react";
import Lenis from "lenis";
import { motion, useInView, useReducedMotion, useSpring, useMotionValue, animate } from "motion/react";

export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

/** Lenis smooth scrolling for the story page only (the lab keeps native scrolling). */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    let raf = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    // in-page anchor links glide instead of jumping
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest("a[href^='#']") as HTMLAnchorElement | null;
      if (!a) return;
      const id = a.getAttribute("href")!;
      const el = id.length > 1 ? document.querySelector(id) : null;
      if (el) {
        e.preventDefault();
        lenis.scrollTo(el as HTMLElement, { offset: -8 });
      }
    };
    document.addEventListener("click", onClick);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("click", onClick);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [enabled]);
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis) lenis.scrollTo(el, { offset: -8 });
  else el.scrollIntoView({ behavior: "smooth" });
}

/** Fade-and-rise on first entry into view. */
export const Reveal: React.FC<{
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "span";
}> = ({ children, delay = 0, y = 24, className, as = "div" }) => {
  const reduce = useReducedMotion();
  const Comp = motion[as] as typeof motion.div;
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: reduce ? 0 : y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: reduce ? 0.2 : 0.9, ease: EASE_OUT, delay }}
    >
      {children}
    </Comp>
  );
};

/** Line-by-line masked rise for display type (each line slides up from behind a mask). */
export const MaskLines: React.FC<{
  lines: React.ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  immediate?: boolean;
}> = ({ lines, className, lineClassName, delay = 0, stagger = 0.08, immediate = false }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();
  const show = immediate || inView;
  return (
    <div ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em] -mb-[0.06em]">
          <motion.span
            className={`block will-change-transform ${lineClassName ?? ""}`}
            initial={{ y: reduce ? 0 : "105%", opacity: reduce ? 0 : 1 }}
            animate={show ? { y: "0%", opacity: 1 } : undefined}
            transition={{ duration: reduce ? 0.25 : 1.05, ease: EASE_OUT, delay: delay + i * stagger }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </div>
  );
};

/** Infinite marquee (CSS, runs on the compositor; pauses on hover). */
export const Marquee: React.FC<{ children: React.ReactNode; duration?: number; className?: string; reverse?: boolean }> = ({
  children,
  duration = 38,
  className,
  reverse,
}) => (
  <div className={`overflow-hidden group ${className ?? ""}`} aria-hidden="true">
    <div
      className="flex w-max animate-marquee group-hover:[animation-play-state:paused]"
      style={{ ["--marquee-duration" as string]: `${duration}s`, animationDirection: reverse ? "reverse" : "normal" }}
    >
      <div className="flex shrink-0">{children}</div>
      <div className="flex shrink-0">{children}</div>
    </div>
  </div>
);

/** Count up once when visible. */
export const CountUp: React.FC<{ to: number; decimals?: number; suffix?: string; className?: string; duration?: number }> = ({
  to,
  decimals = 0,
  suffix = "",
  className,
  duration = 1.4,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = `${to.toFixed(decimals)}${suffix}`;
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = `${v.toFixed(decimals)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, to, decimals, suffix, duration, reduce]);
  return (
    <span ref={ref} className={className}>
      {(0).toFixed(decimals)}
      {suffix}
    </span>
  );
};

/** Magnetic pull toward the pointer (decorative, spring-smoothed, fine pointers only). */
export const Magnetic: React.FC<{ children: React.ReactNode; strength?: number; className?: string }> = ({
  children,
  strength = 0.25,
  className,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 22, mass: 0.6 });
  const sy = useSpring(y, { stiffness: 220, damping: 22, mass: 0.6 });
  const reduce = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { x: sx, y: sy }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
};

/** Small mono label with a leading dot and a hairline rule (editorial chapter marker). */
export const ChapterMark: React.FC<{ index: string; label: string; tone?: "paper" | "carbon" | "ink" }> = ({ index, label, tone = "paper" }) => (
  <div className={`flex items-center gap-4 ${tone === "paper" ? "text-[var(--ink-2)]" : tone === "ink" ? "text-[var(--ink)]" : "text-white/60"}`}>
    <span className="type-label tabular">{index}</span>
    <span className={`h-px flex-1 ${tone === "carbon" ? "bg-white/15" : "bg-c-ink/20"}`} />
    <span className="type-label flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${tone === "ink" ? "bg-[var(--ink)]" : "bg-[var(--signal)]"}`} />
      {label}
    </span>
  </div>
);
