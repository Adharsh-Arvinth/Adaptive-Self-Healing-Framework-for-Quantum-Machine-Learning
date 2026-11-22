"use client";

import React, { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Plus } from "lucide-react";
import { ChapterMark, EASE_OUT, MaskLines, Reveal } from "./motion";
import { CONDITION_LABEL, useResults } from "./useResults";

const ACTIONS = [
  { key: "rollback_healthy", name: "Restore checkpoint", changes: "Returns parameters, optimizer state and learning rate to the last healthy snapshot. Device noise is environmental and survives it.", guard: "Loses the steps since the checkpoint." },
  { key: "adjust_learning_rate", name: "Re-anchor learning rate", changes: "If the step size has drifted more than 4x from its configured value, it is reset; otherwise it is scaled by 0.2x or 2x.", guard: "Bounded to [1e-4, 1.0]; never reverses direction within 4 steps." },
  { key: "change_optimizer", name: "Change optimizer", changes: "Switches between Adam, RMSprop and SGD and clears all momentum buffers.", guard: "No switching back to a recently used optimizer." },
  { key: "perform_warm_restart", name: "Warm restart", changes: "Re-initialises near the identity for plateaus and NaNs, or nudges parameters with small Gaussian noise otherwise.", guard: "Parameters stay finite and bounded." },
  { key: "apply_noise_mitigation", name: "Noise mitigation", changes: "Rescales measured expectations by the calibrated contraction factor. This removes bias but amplifies shot noise.", guard: "Skipped when already active." },
  { key: "reduce_circuit_depth", name: "Reduce depth", changes: "Removes one variational layer: less noise accumulation and less gradient concentration, but less capacity.", guard: "Never below one layer." },
  { key: "modify_feature_map", name: "Swap feature map", changes: "Toggles between angle encoding and an entangling IQP map, reshaping the kernel the model learns with.", guard: "No toggling back within 4 steps." },
];

export const ChapterRepairs: React.FC = () => {
  const [open, setOpen] = useState<string | null>("rollback_healthy");
  const reduce = useReducedMotion();
  const { data } = useResults();

  // For each action, the fault it recovers best (from the counterfactual landscape).
  const best = useMemo(() => {
    const out: Record<string, { fault: string; rate: number } | null> = {};
    if (!data) return out;
    const { conditions, actions, recovery } = data.landscape;
    actions.forEach((a, j) => {
      let bestI = -1;
      conditions.forEach((c, i) => {
        if (c === "nominal") return;
        if (bestI < 0 || recovery[i][j] > recovery[bestI][j]) bestI = i;
      });
      out[a] = bestI >= 0 ? { fault: conditions[bestI], rate: recovery[bestI][j] } : null;
    });
    return out;
  }, [data]);

  return (
    <section id="repairs" className="relative bg-[var(--carbon)] text-white px-4 sm:px-8 lg:px-12 py-24 sm:py-32">
      <ChapterMark index="03" label="The actuators" tone="carbon" />
      <div className="grid lg:grid-cols-12 gap-8 mt-10 mb-16">
        <MaskLines className="lg:col-span-8 type-wide text-[clamp(2.4rem,6.6vw,6.5rem)]" lines={["Seven ways", "to recover."]} />
        <Reveal className="lg:col-span-4 lg:pt-4 text-white/60 text-lg leading-relaxed" delay={0.15}>
          Every repair is a small, reversible change to the training configuration. None of them is right for every fault,
          which is why the choice has to be learned.
        </Reveal>
      </div>

      <ul className="border-t border-white/[0.12]">
        {ACTIONS.map((a, i) => {
          const isOpen = open === a.key;
          const b = best[a.key];
          return (
            <li key={a.key} className="border-b border-white/[0.12]">
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : a.key)}
                onMouseEnter={() => window.matchMedia("(hover: hover)").matches && setOpen(a.key)}
                aria-expanded={isOpen}
                className="w-full grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[5rem_1fr_auto] items-center gap-4 py-6 text-left group"
              >
                <span className="type-label text-white/40 tabular">{String(i + 1).padStart(2, "0")}</span>
                <span
                  className={`type-condensed text-[clamp(2.6rem,6vw,5.5rem)] transition-colors duration-300 ${
                    isOpen ? "text-white" : "text-white/35 group-hover:text-white/70"
                  }`}
                >
                  {a.name}
                </span>
                <motion.span
                  animate={{ rotate: isOpen ? 45 : 0 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center ${
                    isOpen ? "border-[var(--signal)] bg-[var(--signal)]" : "border-white/20"
                  }`}
                >
                  <Plus className="w-4 h-4" />
                </motion.span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: reduce ? 0.15 : 0.45, ease: EASE_OUT }}
                className="overflow-hidden"
              >
                <div className="grid sm:grid-cols-[5rem_1fr] gap-4 pb-8">
                  <span />
                  <div className="grid md:grid-cols-3 gap-6 md:gap-10">
                    <div>
                      <div className="type-label text-white/40 mb-2">What it changes</div>
                      <p className="text-white/80 leading-relaxed">{a.changes}</p>
                    </div>
                    <div>
                      <div className="type-label text-white/40 mb-2">Safety bound</div>
                      <p className="text-white/80 leading-relaxed">{a.guard}</p>
                    </div>
                    <div>
                      <div className="type-label text-white/40 mb-2">Works best on</div>
                      {b ? (
                        <p className="leading-relaxed">
                          <span className="type-condensed text-5xl text-[var(--heal)] tabular">{b.rate.toFixed(0)}%</span>
                          <span className="block text-white/70 text-sm mt-1">recovered · {CONDITION_LABEL[b.fault] ?? b.fault}</span>
                        </p>
                      ) : (
                        <p className="text-white/40 text-sm">Benchmark results loading…</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
