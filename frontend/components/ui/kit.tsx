"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";

/* --------------------------------------------------------------------------
   Lab design kit: the same building blocks as the story page, themed by the
   appearance tokens. Every lab section is composed from these so spacing, type,
   colour and motion stay identical everywhere.
   -------------------------------------------------------------------------- */

export type Tone = "neutral" | "accent" | "ok" | "warn" | "bad" | "info";

const toneText: Record<Tone, string> = {
  neutral: "text-[var(--content-primary)]",
  accent: "text-[var(--accent)]",
  ok: "text-[var(--status-success)]",
  warn: "text-[var(--status-warning)]",
  bad: "text-[var(--status-danger)]",
  info: "text-[var(--status-info)]",
};
const toneSoft: Record<Tone, string> = {
  neutral: "bg-[var(--bg-subtle)] text-[var(--content-secondary)] border-[var(--border-subtle)]",
  accent: "bg-[var(--accent-subtle)] text-[var(--accent)] border-c-accent/20",
  ok: "bg-[var(--status-success-subtle)] text-[var(--status-success)] border-c-status-success/20",
  warn: "bg-[var(--status-warning-subtle)] text-[var(--status-warning)] border-c-status-warning/20",
  bad: "bg-[var(--status-danger-subtle)] text-[var(--status-danger)] border-c-status-danger/20",
  info: "bg-[var(--status-info-subtle)] text-[var(--status-info)] border-c-status-info/20",
};
const toneDot: Record<Tone, string> = {
  neutral: "bg-[var(--content-tertiary)]",
  accent: "bg-[var(--accent)]",
  ok: "bg-[var(--status-success)]",
  warn: "bg-[var(--status-warning)]",
  bad: "bg-[var(--status-danger)]",
  info: "bg-[var(--status-info)]",
};

export const toneTextClass = (t: Tone) => toneText[t];

/** Panel: the single surface every lab section sits on. */
export const Panel: React.FC<{
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}> = ({ eyebrow, title, description, actions, children, className = "", bodyClassName = "" }) => (
  <section className={`rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-surface)] ${className}`}>
    {(eyebrow || title || actions) && (
      <header className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-6 sm:px-8 pt-6 sm:pt-8 ${children == null ? "pb-6 sm:pb-8" : ""}`}>
        <div className="min-w-0">
          {eyebrow && <div className="type-label text-[var(--accent)]">{eyebrow}</div>}
          {title && <h2 className="lab-title mt-1.5 text-[var(--content-primary)]">{title}</h2>}
          {description && <p className="text-[0.95rem] text-[var(--content-secondary)] mt-1.5 max-w-2xl leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
      </header>
    )}
    {children != null && (
      <div className={`px-6 sm:px-8 pb-6 sm:pb-8 ${eyebrow || title || actions ? "pt-6" : "pt-6 sm:pt-8"} ${bodyClassName}`}>{children}</div>
    )}
  </section>
);

/** Small uppercase heading with a hairline, used to split a panel into parts. */
export const SubHead: React.FC<{ children: React.ReactNode; right?: React.ReactNode; className?: string }> = ({ children, right, className = "" }) => (
  <div className={`flex items-center gap-3 mb-3 ${className}`}>
    <span className="type-label text-[var(--content-secondary)] shrink-0">{children}</span>
    <span className="h-px flex-1 bg-[var(--border-subtle)]" />
    {right && <span className="shrink-0">{right}</span>}
  </div>
);

/** Status badge: dot + uppercase label. */
export const Badge: React.FC<{ tone?: Tone; children: React.ReactNode; pulse?: boolean; className?: string }> = ({
  tone = "neutral",
  children,
  pulse,
  className = "",
}) => (
  <span className={`inline-flex items-center gap-2 h-8 px-3 rounded-full border type-label ${toneSoft[tone]} ${className}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${toneDot[tone]} ${pulse ? "animate-pulse-dot" : ""}`} />
    {children}
  </span>
);

/** Stat tile: label, big condensed value, optional hint. */
export const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: React.ReactNode; tone?: Tone; size?: "md" | "lg"; className?: string }> = ({
  label,
  value,
  hint,
  tone = "neutral",
  size = "md",
  className = "",
}) => (
  <div className={`rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 min-w-0 ${className}`}>
    <div className="type-label text-[var(--content-tertiary)] leading-snug">{label}</div>
    <div className={`type-condensed leading-none mt-2 truncate ${size === "lg" ? "text-[2.6rem]" : "text-[1.9rem]"} ${toneText[tone]}`}>{value}</div>
    {hint && <div className="text-xs text-[var(--content-tertiary)] mt-1.5 truncate">{hint}</div>}
  </div>
);

/** Animated horizontal meter (transform-only). */
export const Meter: React.FC<{ value: number; tone?: Tone; className?: string; label?: string }> = ({ value, tone = "accent", className = "", label }) => {
  const reduce = useReducedMotion();
  const v = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
  return (
    <div className={`h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden ${className}`} role="meter" aria-valuenow={Math.round(v * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <motion.div
        className={`h-full rounded-full origin-left ${toneDot[tone]}`}
        initial={false}
        animate={{ scaleX: v }}
        transition={reduce ? { duration: 0 } : { type: "spring", bounce: 0, duration: 0.7 }}
      />
    </div>
  );
};

type BtnVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
const btnCls: Record<BtnVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-[0_10px_24px_-14px_var(--accent)]",
  secondary: "border border-[var(--border-highlight)] text-[var(--content-primary)] hover:border-[var(--content-primary)]",
  ghost: "text-[var(--content-secondary)] hover:text-[var(--content-primary)] hover:bg-[var(--bg-subtle)]",
  danger: "border border-c-status-danger/40 text-[var(--status-danger)] hover:bg-[var(--status-danger)] hover:text-white hover:border-[var(--status-danger)]",
  success: "border border-c-status-success/40 text-[var(--status-success)] hover:bg-[var(--status-success)] hover:text-white hover:border-[var(--status-success)]",
};

/** Pill button with press feedback. */
export const Btn: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md"; icon?: React.ReactNode }
> = ({ variant = "secondary", size = "md", icon, className = "", children, ...rest }) => (
  <button
    {...rest}
    className={`apple-btn inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none ${
      size === "sm" ? "h-9 px-3.5 text-[0.8rem]" : "h-11 px-5 text-sm"
    } ${btnCls[variant]} ${className}`}
  >
    {icon}
    {children}
  </button>
);

/** Two-column definition list with hairlines. */
export const KeyValues: React.FC<{ items: { k: string; v: React.ReactNode; tone?: Tone }[]; className?: string }> = ({ items, className = "" }) => (
  <dl className={`divide-y divide-[var(--border-subtle)] ${className}`}>
    {items.map((it) => (
      <div key={it.k} className="flex items-baseline justify-between gap-4 py-2.5">
        <dt className="text-sm text-[var(--content-secondary)]">{it.k}</dt>
        <dd className={`text-sm font-mono tabular text-right ${toneText[it.tone ?? "neutral"]}`}>{it.v}</dd>
      </div>
    ))}
  </dl>
);

/** Empty state. */
export const Empty: React.FC<{ title: string; children?: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-2xl border border-dashed border-[var(--border-highlight)] p-6 text-center">
    <div className="font-semibold text-[var(--content-primary)]">{title}</div>
    {children && <div className="text-sm text-[var(--content-secondary)] mt-1">{children}</div>}
  </div>
);

export const fmt = {
  n: (v: unknown, d = 4) => (typeof v === "number" && Number.isFinite(v) ? v.toFixed(d) : "—"),
  pct: (v: unknown, d = 1) => (typeof v === "number" && Number.isFinite(v) ? `${(v * 100).toFixed(d)}%` : "—"),
  human: (s?: string | null) => (s ? s.replace(/_/g, " ") : "—"),
};
