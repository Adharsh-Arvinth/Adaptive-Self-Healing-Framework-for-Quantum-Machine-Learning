"use client";

import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { ChapterMark, EASE_OUT, Magnetic, Marquee, MaskLines, Reveal } from "./motion";
import { REPO } from "./ChapterResources";

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

const GithubMark: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M12 2C6.48 2 2 6.48 2 12.02c0 4.42 2.87 8.17 6.84 9.5.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.45-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.56 9.56 0 0 1 12 6.84c.85 0 1.71.12 2.5.34 1.91-1.3 2.75-1.03 2.75-1.03.55 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.85-2.34 4.7-4.57 4.94.36.31.68.92.68 1.86v2.75c0 .27.18.58.69.48A10.02 10.02 0 0 0 22 12.02C22 6.48 17.52 2 12 2Z" />
  </svg>
);
const LinkedInMark: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
  </svg>
);

const STEPS = [
  { n: "01", t: "Start training", d: "Let it run ten healthy steps." },
  { n: "02", t: "Inject a fault", d: "Pick one, e.g. a learning-rate blow-up." },
  { n: "03", t: "Watch it heal", d: "Diagnosis, rehearsal, probation, commit." },
];

export const ChapterFinale: React.FC<{ onLaunchLab: () => void }> = ({ onLaunchLab }) => {
  const reduce = useReducedMotion();
  return (
    <section id="lab-cta" className="relative bg-[var(--signal)] text-[var(--ink)] overflow-hidden">
      <div className="px-4 sm:px-8 lg:px-12 pt-20 sm:pt-28 pb-20 sm:pb-24">
        <ChapterMark index="08" label="Your turn" tone="ink" />
        <div className="grid xl:grid-cols-12 gap-10 xl:gap-12 mt-10 items-end">
          <MaskLines
            className="xl:col-span-7 type-condensed text-[clamp(5.5rem,15vw,17rem)] leading-[0.82]"
            lines={["Enter", "the lab."]}
          />
          <div className="xl:col-span-5 space-y-8">
            <p className="type-wide text-[clamp(1.4rem,2.2vw,2.2rem)] leading-[1.05]">
              Break a live quantum model on purpose. Watch it diagnose and repair itself.
            </p>
            <ol className="border-t border-c-ink/25">
              {STEPS.map((s, i) => (
                <motion.li
                  key={s.n}
                  initial={{ opacity: 0, x: reduce ? 0 : 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE_OUT, delay: reduce ? 0 : 0.1 + i * 0.08 }}
                  className="grid grid-cols-[3rem_1fr] gap-4 py-4 border-b border-c-ink/25"
                >
                  <span className="type-label tabular pt-1">{s.n}</span>
                  <span>
                    <span className="font-semibold block">{s.t}</span>
                    <span className="text-[0.95rem] opacity-75">{s.d}</span>
                  </span>
                </motion.li>
              ))}
            </ol>
            <div className="flex flex-wrap items-center gap-4">
              <Magnetic className="inline-block">
                <button onClick={onLaunchLab} className="btn-ink bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--paper)] hover:text-[var(--ink)] text-base px-7 py-4">
                  Open the live lab <ArrowUpRight className="w-5 h-5" />
                </button>
              </Magnetic>
              <span className="text-sm opacity-75 max-w-[16rem]">A guided tour starts on your first visit. The free backend may take a minute to wake.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ── Contact (email is assembled client-side only, so it never appears in the HTML source) ── */
const EMAIL_PARTS = ["moc.liamg", "8012htnivrahsrahda"]; // reversed: domain, user
const useEmail = () => {
  const [email, setEmail] = React.useState<string | null>(null);
  React.useEffect(() => {
    const [d, u] = EMAIL_PARTS.map((p) => p.split("").reverse().join(""));
    setEmail(`${u}@${d}`);
  }, []);
  return email;
};

const SOCIAL = {
  github: "https://github.com/Adharsh-Arvinth",
  linkedin: "https://www.linkedin.com/in/adharsh-arvinth",
};

export const SiteFooter: React.FC<{ isConnected: boolean }> = ({ isConnected }) => {
  const email = useEmail();
  const [copied, setCopied] = React.useState(false);
  const year = new Date().getFullYear();
  const cols: { h: string; links: { label: string; href: string; ext?: boolean }[] }[] = [
    {
      h: "Explore",
      links: [
        { label: "The problem", href: "#faults" },
        { label: "The loop", href: "#loop" },
        { label: "The actuators", href: "#repairs" },
        { label: "The evidence", href: "#evidence" },
        { label: "FAQ", href: "#faq" },
      ],
    },
    {
      h: "Research",
      links: [
        { label: "Findings", href: `${REPO}/blob/main/research/RESEARCH_FINDINGS.md`, ext: true },
        { label: "Results tables", href: `${REPO}/blob/main/research/RESULTS.md`, ext: true },
        { label: "Dataset", href: `${REPO}/tree/main/research/dataset/qfaultbench_v1`, ext: true },
        { label: "Source code", href: REPO, ext: true },
        { label: "API docs", href: "https://qml-backend-nczx.onrender.com/docs", ext: true },
      ],
    },
  ];

  return (
    <footer id="contact" className="relative bg-[var(--carbon)] text-white overflow-hidden">
      <Marquee duration={44} className="border-b border-white/10 py-5">
        {["Monitor", "Detect", "Diagnose", "Remember", "Simulate", "Select", "Validate", "Recover"].map((w) => (
          <span key={w} className="type-condensed text-5xl text-white/15 px-8 flex items-center gap-8">
            {w} <span className="w-2 h-2 rounded-full bg-[var(--signal)]" />
          </span>
        ))}
      </Marquee>

      {/* Contact */}
      <div className="px-4 sm:px-8 lg:px-12 pt-20 pb-16 grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-6">
          <div className="type-label text-white/45 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--signal)]" /> Built by
          </div>
          <h2 className="type-condensed text-[clamp(3.5rem,8vw,8rem)] mt-4">Adharsh Arvinth</h2>
          <p className="text-white/60 text-lg leading-relaxed mt-4 max-w-xl">
            Research on reliable quantum machine learning. Questions, collaborations or opportunities: get in touch.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href={SOCIAL.github} target="_blank" rel="noopener noreferrer me" className="btn-ink border border-white/15 hover:border-white text-white">
              <GithubMark /> GitHub
            </a>
            <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer me" className="btn-ink border border-white/15 hover:border-white text-white">
              <LinkedInMark /> LinkedIn
            </a>
            <span className="btn-ink border border-dashed border-white/15 text-white/40 cursor-default" title="Portfolio link coming soon">
              Portfolio · soon
            </span>
          </div>
        </div>

        <div className="lg:col-span-6 lg:pl-8 flex flex-col justify-end">
          <div className="type-label text-white/45">Email</div>
          {email ? (
            <a href={`mailto:${email}`} className="group mt-3 type-wide text-[clamp(1.3rem,2.6vw,2.6rem)] break-all hover:text-[var(--signal-2)] transition-colors duration-200">
              {email}
              <ArrowUpRight className="inline w-[0.8em] h-[0.8em] ml-2 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </a>
          ) : (
            <span className="mt-3 type-wide text-[clamp(1.3rem,2.6vw,2.6rem)] text-white/30">Loading…</span>
          )}
          <button
            type="button"
            disabled={!email}
            onClick={async () => {
              if (!email) return;
              try {
                await navigator.clipboard.writeText(email);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              } catch {
                /* ignore */
              }
            }}
            className="apple-btn mt-5 self-start inline-flex items-center gap-2 h-10 px-4 rounded-full border border-white/15 hover:border-white/40 text-sm text-white/80"
          >
            {copied ? "Copied to clipboard" : "Copy email address"}
          </button>
        </div>
      </div>

      {/* Sitemap + status */}
      <div className="px-4 sm:px-8 lg:px-12 py-12 border-t border-white/10 grid grid-cols-2 md:grid-cols-4 gap-10 text-sm">
        {cols.map((c) => (
          <div key={c.h}>
            <div className="type-label text-white/40 mb-4">{c.h}</div>
            <ul className="space-y-2.5">
              {c.links.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-white/70 hover:text-white transition-colors duration-200"
                  >
                    {l.label}
                    {l.ext && <span className="text-white/30"> ↗</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <div className="type-label text-white/40 mb-4">Connect</div>
          <ul className="space-y-2.5">
            <li><a href={SOCIAL.github} target="_blank" rel="noopener noreferrer me" className="text-white/70 hover:text-white">GitHub <span className="text-white/30">↗</span></a></li>
            <li><a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer me" className="text-white/70 hover:text-white">LinkedIn <span className="text-white/30">↗</span></a></li>
            {email && <li><a href={`mailto:${email}`} className="text-white/70 hover:text-white">Email</a></li>}
          </ul>
        </div>
        <div>
          <div className="type-label text-white/40 mb-4">Status</div>
          <ul className="space-y-2.5 text-white/70">
            <li className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-[var(--heal)] animate-pulse-dot" : "bg-white/30"}`} />
              Simulator {isConnected ? "online" : "waking up"}
            </li>
            <li>11 datasets · 2 noise regimes</li>
            <li>
              <a href="#top" className="hover:text-white">Back to top ↑</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Wordmark */}
      <div className="px-4 sm:px-8 lg:px-12 select-none" aria-hidden="true">
        <div className="type-condensed text-[clamp(4rem,17.5vw,24rem)] leading-[0.8] text-white/[0.06] whitespace-nowrap">Self healing</div>
      </div>
      <div className="px-4 sm:px-8 lg:px-12 py-6 border-t border-white/10 flex flex-col sm:flex-row gap-2 justify-between text-xs text-white/40">
        <span>© {year} Adharsh Arvinth</span>
        <span>Self-Healing Quantum ML</span>
      </div>
    </footer>
  );
};
