"use client";

import released from "../../public/data/qfaultbench_results.json";
import { useEffect, useState } from "react";

/* Shape of /data/qfaultbench_results.json (written by `python -m research.analysis`). */
export interface PolicyRow {
  name: string;
  recovery: number;
  ci: [number, number];
  acc_gap: number;
  harmful: number;
  oracle: boolean;
}
export interface AblationRow {
  name: string;
  recovery: number;
  delta: number;
  p_holm: number | null;
}
export interface Results {
  headline: { restore: number; thompson: number; latest: number; older: number };
  generated: string;
  n_episodes: number;
  n_faulty: number;
  n_base_runs: number;
  n_seeds: number;
  datasets: string[];
  landscape: { conditions: string[]; actions: string[]; recovery: number[][]; n: number[] };
  diagnosis: {
    rule_macro_f1: number;
    rule_false_gate_rate: number;
    rule_coverage: number;
    learned_macro_f1: number;
    learned_ece: number;
    learned_false_alarm_rate: number;
    learned_detection_recall: number;
  };
  policies: PolicyRow[];
  ablation: AblationRow[];
  twin: { spearman_test_acc: number; gate_precision: number; gate_recall: number };
  reward_alignment: number;
}

let cache: Promise<Results> | null = null;

export function useResults(): { data: Results | null; failed: boolean } {
  const [data, setData] = useState<Results | null>(released as Results);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    if (!cache) {
      cache = fetch("/data/qfaultbench_results.json").then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))));
      cache.catch(() => {
        cache = null;
      });
    }
    cache.then((j) => alive && setData(j)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  return { data, failed };
}

export const CONDITION_LABEL: Record<string, string> = {
  nominal: "Healthy (no fault)",
  barren_plateau: "Barren plateau",
  lr_misconfiguration: "Step size too large",
  optimizer_instability: "Optimizer corrupted",
  training_divergence: "Numerical divergence",
  persistent_plateau: "Step-size collapse",
  noise_degradation: "Device noise",
};

export const ACTION_LABEL: Record<string, string> = {
  noop: "No repair",
  rollback_healthy: "Restore checkpoint",
  change_optimizer: "Change optimizer",
  reduce_circuit_depth: "Reduce depth",
  modify_feature_map: "Swap feature map",
  adjust_learning_rate: "Re-anchor LR",
  apply_noise_mitigation: "Noise mitigation",
  perform_warm_restart: "Warm restart",
};

export const DATASET_LABEL: Record<string, string> = {
  iris: "Iris",
  breast_cancer: "Breast Cancer",
  wine: "Wine",
  digits: "Digits 3/8",
  banknote: "Banknote",
  pima_diabetes: "Pima Diabetes",
  hidden_manifold: "Hidden Manifold",
  two_curves: "Two Curves",
  linearly_separable: "Linearly Separable",
  moons: "Moons",
  circles: "Circles",
};
