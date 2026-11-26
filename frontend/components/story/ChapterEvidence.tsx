"use client";

import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ChevronDown } from "lucide-react";
import { ChapterMark, CountUp, EASE_OUT, MaskLines, Reveal } from "./motion";
import { ACTION_LABEL, CONDITION_LABEL, DATASET_LABEL, useResults } from "./useResults";

/* Every number in this chapter is read from /data/qfaultbench_results.json. Nothing is hand-typed. */

type Tone = "paper" | "carbon";

const T = {
  paper: {
    section: "bg-grid-paper text-[var(--ink)]",
    muted: "text-[var(--ink-2)]",
    faint: "text-[var(--ink-3)]",
    rule: "border-c-ink/[0.12]",
    card: "bg-[var(--paper)] border border-c-ink/[0.12]",
    track: "bg-c-ink/[0.06]",
    bar: "bg-c-ink/70",
    cell: (t: number) => ({ backgroundColor: `rgb(var(--rgb-ink) / ${(0.04 + 0.86 * t).toFixed(3)})`, color: t > 0.5 ? "var(--paper)" : "var(--ink-2)" }),
  },
  carbon: {
    section: "bg-[var(--carbon)] text-white",
    muted: "text-white/60",
    faint: "text-white/40",
    rule: "border-white/[0.12]",
    card: "bg-white/[0.03] border border-white/10",
    track: "bg-white/[0.05]",
    bar: "bg-white/45",
    cell: (t: number) => ({ backgroundColor: `rgba(244,242,236,${(0.04 + 0.82 * t).toFixed(3)})`, color: t > 0.5 ? "#0a0a0b" : "#a3a09a" }),
  },
};

const pct = (v: number) => `${v.toFixed(1)}%`;

export const ChapterEvidence: React.FC<{ tone?: Tone; compact?: boolean }> = ({ tone = "paper", compact = false }) => {
  const s = T[tone];
  const reduce = useReducedMotion();
  const { data, failed } = useResults();
  const [showAblation, setShowAblation] = useState(false);

  const policies = useMemo(() => (data ? data.policies.filter((p) => !p.oracle) : []), [data]);
  const oracles = useMemo(() => (data ? data.policies.filter((p) => p.oracle) : []), [data]);
  const isOurs = (n: string) => n.includes("TS") || n.includes("Thompson") || n.startsWith("Hybrid");

  return (
    <section id="evidence" className={`relative ${s.section} ${compact ? "rounded-[28px] overflow-hidden" : ""} px-4 sm:px-8 lg:px-12 py-24 sm:py-32`}>
      <ChapterMark index="04" label="The evidence" tone={tone} />
      <div className="grid lg:grid-cols-12 gap-8 mt-10 mb-14">
        <MaskLines className="lg:col-span-8 type-wide text-[clamp(2.4rem,6.6vw,6.5rem)]" lines={["What actually", "works."]} />
        <Reveal className={`lg:col-span-4 lg:pt-4 ${s.muted} text-lg leading-relaxed`} delay={0.15}>
          Every fault episode is replayed under every possible action from the identical training state, so each policy is
          measured against what was achievable, not against a guess.
        </Reveal>
      </div>

      {failed && (
        <p className={`${s.card} rounded-2xl p-5 text-sm`}>
          Showing the bundled benchmark results. The live results file could not be loaded. Reproduce with <code>python -m research.analysis</code>.
        </p>
      )}
      {!data && !failed && <div className={`h-40 rounded-3xl ${s.track} animate-pulse`} aria-busy="true" />}

      {data && (
        <div className="space-y-20">
          {/* Headline numbers */}
          <div className={`grid grid-cols-2 lg:grid-cols-4 border-t ${s.rule}`}>
            {[
              { v: data.n_episodes, d: 0, suf: "", label: "counterfactual episodes", sub: `${data.n_faulty.toLocaleString("en-US")} faulty + ${(data.n_episodes - data.n_faulty).toLocaleString("en-US")} healthy controls · ${data.n_base_runs} paired runs` },
              { v: data.datasets.length, d: 0, suf: "", label: "datasets", sub: data.datasets.map((x) => DATASET_LABEL[x] ?? x).join(" · ") },
              { v: data.landscape.actions.length, d: 0, suf: "", label: "actions per episode", sub: "all from the same state" },
              { v: data.diagnosis.learned_macro_f1, d: 2, suf: "", label: "diagnosis macro-F1", sub: `on unseen datasets (rules: ${data.diagnosis.rule_macro_f1.toFixed(2)})` },
            ].map((k, i) => (
              <div key={k.label} className={`py-8 pr-6 ${i % 2 === 1 ? "pl-6 border-l" : ""} ${i >= 2 ? "border-t lg:border-t-0" : ""} ${i === 2 ? "lg:pl-6 lg:border-l" : ""} ${s.rule}`}>
                <CountUp to={k.v} decimals={k.d} suffix={k.suf} className="type-condensed text-[clamp(4rem,8vw,7.5rem)] tabular block" />
                <div className="mt-2 font-semibold">{k.label}</div>
                <div className={`text-xs mt-1 ${s.faint} line-clamp-2`}>{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Landscape */}
          <Reveal>
            <div className="flex items-end justify-between gap-6 mb-6 flex-wrap">
              <div>
                <div className={`type-label ${s.faint}`}>Counterfactual landscape</div>
                <h3 className="type-wide text-[clamp(1.6rem,3vw,2.6rem)] mt-2">Which action recovers which fault</h3>
              </div>
              <p className={`text-sm ${s.muted} max-w-md`}>
                Share of episodes that end within 5 points of the fault-free run&apos;s test accuracy, at the same training step.
              </p>
            </div>
            <div className="overflow-x-auto -mx-4 px-4" data-lenis-prevent>
              <table className="w-full min-w-[720px] border-separate" style={{ borderSpacing: 3 }}>
                <thead>
                  <tr>
                    <th className={`text-left type-label font-normal pb-2 ${s.faint}`}>Condition</th>
                    {data.landscape.actions.map((a) => (
                      <th key={a} className={`type-label font-normal pb-2 px-1 ${s.faint} whitespace-nowrap`}>
                        {ACTION_LABEL[a] ?? a}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.landscape.conditions.map((c, i) => (
                    <tr key={c}>
                      <td className="pr-4 text-sm whitespace-nowrap font-medium">{CONDITION_LABEL[c] ?? c}</td>
                      {data.landscape.recovery[i].map((v, j) => (
                        <motion.td
                          key={j}
                          title={`${CONDITION_LABEL[c] ?? c} → ${ACTION_LABEL[data.landscape.actions[j]]}: ${pct(v)}`}
                          initial={{ opacity: 0, scale: reduce ? 1 : 0.85 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true, margin: "0px 0px -10% 0px" }}
                          transition={{ duration: 0.5, ease: EASE_OUT, delay: reduce ? 0 : (i + j) * 0.018 }}
                          className="h-11 rounded-lg text-center font-mono text-xs tabular"
                          style={s.cell(v / 100)}
                        >
                          {v.toFixed(0)}
                        </motion.td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          {/* Policies */}
          <Reveal>
            <div className="flex items-end justify-between gap-6 mb-8 flex-wrap">
              <div>
                <div className={`type-label ${s.faint}`}>Repair policies</div>
                <h3 className="type-wide text-[clamp(1.6rem,3vw,2.6rem)] mt-2">Recovery on faulty episodes</h3>
              </div>
              <div className={`flex flex-wrap gap-x-5 gap-y-2 text-xs ${s.muted}`}>
                <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-[var(--signal)]" /> This framework</span>
                <span className="inline-flex items-center gap-2"><span className={`w-3 h-3 rounded-sm ${s.bar}`} /> Baseline</span>
                {oracles[oracles.length - 1] && (
                  <span className="inline-flex items-center gap-2"><span className="w-4 border-t border-dashed border-[var(--heal)]" /> Best achievable ({pct(oracles[oracles.length - 1].recovery)})</span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {policies.map((p, i) => (
                <div key={p.name} className="grid grid-cols-[minmax(0,11rem)_1fr_3.5rem] sm:grid-cols-[18rem_1fr_4.5rem] items-center gap-4">
                  <span className="text-[0.8rem] sm:text-sm leading-snug" title={p.name}>{p.name}</span>
                  <div className={`relative h-7 rounded-md ${s.track}`} title={`${p.name}: ${pct(p.recovery)} (95% CI ${pct(p.ci[0])}–${pct(p.ci[1])})`}>
                    <motion.div
                      className={`absolute inset-y-0 left-0 rounded-md origin-left ${isOurs(p.name) ? "bg-[var(--signal)]" : s.bar}`}
                      style={{ width: `${p.recovery}%` }}
                      initial={{ scaleX: reduce ? 1 : 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, ease: EASE_OUT, delay: reduce ? 0 : i * 0.05 }}
                    />
                    <div className="absolute top-1/2 h-px bg-current opacity-60" style={{ left: `${p.ci[0]}%`, width: `${Math.max(0.5, p.ci[1] - p.ci[0])}%` }} />
                    {oracles.slice(-1).map((o) => (
                      <div key={o.name} className="absolute -inset-y-1 border-l border-dashed border-[var(--heal)]" style={{ left: `${o.recovery}%` }} />
                    ))}
                  </div>
                  <span className="text-sm font-mono tabular text-right">{pct(p.recovery)}</span>
                </div>
              ))}
            </div>
            <p className={`text-xs mt-6 ${s.faint}`}>Bars: mean over random episode orders. Whiskers: 95% cluster-bootstrap intervals over training runs.</p>
          </Reveal>

          {/* Insights */}
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { k: `${data.diagnosis.learned_macro_f1.toFixed(2)}`, t: "Learned diagnosis", d: `Macro-F1 on datasets never seen in training, against ${data.diagnosis.rule_macro_f1.toFixed(2)} for hand-written rules. False alarms: ${pct(data.diagnosis.learned_false_alarm_rate * 100)}.` },
              { k: `ρ ${data.twin.spearman_test_acc.toFixed(2)}`, t: "Digital twin", d: `Its 3-step rehearsal ranks repairs in line with real outcomes. When it vetoes a repair it is right ${pct(data.twin.gate_precision * 100)} of the time.` },
              { k: `ρ ${data.reward_alignment.toFixed(2)}`, t: "Reward signal", d: "The short-window reward only partly predicts the final outcome, which is an open problem for any learner that relies on it." },
            ].map((c, i) => (
              <Reveal key={c.t} delay={i * 0.06}>
                <div className={`${s.card} rounded-3xl p-7 h-full`}>
                  <div className="type-condensed normal-case text-6xl tabular">{c.k}</div>
                  <div className="font-semibold mt-3">{c.t}</div>
                  <p className={`text-sm leading-relaxed mt-2 ${s.muted}`}>{c.d}</p>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Ablation */}
          <div className={`border-t ${s.rule}`}>
            <button
              type="button"
              onClick={() => setShowAblation((v) => !v)}
              aria-expanded={showAblation}
              className="w-full flex items-center justify-between py-6 text-left"
            >
              <span>
                <span className={`type-label ${s.faint} block`}>Ablation</span>
                <span className="type-wide text-2xl">What each component contributes</span>
              </span>
              <motion.span animate={{ rotate: showAblation ? 180 : 0 }} transition={{ type: "spring", bounce: 0, duration: 0.35 }}>
                <ChevronDown className="w-5 h-5" />
              </motion.span>
            </button>
            <motion.div
              initial={false}
              animate={{ height: showAblation ? "auto" : 0, opacity: showAblation ? 1 : 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="overflow-hidden"
            >
              <div className="overflow-x-auto pb-6" data-lenis-prevent>
                <table className="w-full min-w-[480px] text-sm">
                  <thead>
                    <tr className={`text-left type-label ${s.faint} border-b ${s.rule}`}>
                      <th className="py-2 font-normal">Variant</th>
                      <th className="py-2 font-normal text-right">Recovery</th>
                      <th className="py-2 font-normal text-right">Δ vs full</th>
                      <th className="py-2 font-normal text-right">p (Holm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.ablation.map((a) => (
                      <tr key={a.name} className={`border-b ${s.rule}`}>
                        <td className="py-2.5">{a.name}</td>
                        <td className="py-2.5 text-right font-mono tabular">{pct(a.recovery)}</td>
                        <td className="py-2.5 text-right font-mono tabular">{a.name === "TS full" ? "—" : `${a.delta > 0 ? "+" : ""}${a.delta.toFixed(1)} pp`}</td>
                        <td className={`py-2.5 text-right font-mono tabular ${s.muted}`}>{a.p_holm == null ? "—" : a.p_holm < 0.001 ? "<0.001" : a.p_holm.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          <p className={`text-xs ${s.faint}`}>
            Simulation (PennyLane statevector, 4 qubits). Barren plateaus are emulated; device noise uses public IBM calibration data.
            Generated {data.generated} from {data.n_base_runs} training runs.
          </p>
        </div>
      )}
    </section>
  );
};
