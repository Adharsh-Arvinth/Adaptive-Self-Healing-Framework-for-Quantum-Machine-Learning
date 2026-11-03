export interface TelemetryPoint {
  step: number;
  timestamp: number;
  state: string;
  loss: number;
  val_loss: number;
  accuracy: number;
  val_accuracy: number;
  gradient_norm: number;
  gradient_variance: number;
  parameter_velocity: number;
  learning_rate: number;
  circuit_depth: number;
  optimizer_name: string;
  feature_map: string;
  bloch?: {
    x: number;
    y: number;
    z: number;
    qubit_index?: number;
    x_mitigated?: number;
    y_mitigated?: number;
    z_mitigated?: number;
  };
  anomalies?: string[];
  diagnosis?: DiagnosisData | null;
  bandit_decision?: BanditDecisionData | null;
  twin_prediction?: DigitalTwinPrediction | null;
  deployment?: DeploymentRecord | null;
  evaluation?: EvaluationRecord | null;
  events?: EventItem[];
}

export interface DiagnosisData {
  primary_cause: string | null;
  confidence: number;
  probabilities: Record<string, number>;
  confidence_gate_cleared: boolean;
  supporting_evidence: string[];
}

export interface BanditDecisionData {
  selected_arm: string;
  sampled_reward: number;
  expected_reward: number;
  eligible_arms: string[];
  decision_mode: string;
}

export interface PosteriorData {
  update_count: number;
  mu: number[];
  mu_norm: number;
  diag_cov: number[];
}

export interface DigitalTwinPrediction {
  arm?: string;
  horizon?: number;
  initial_loss?: number;
  predicted_loss_final?: number;
  predicted_loss_delta?: number;
  normalized_predicted_delta?: number;
  proxy_loss_trajectory?: number[];
  proxy_stability?: number;
  proxy_grad_variance?: number;
  circuit_evaluations?: number;
  is_viable?: boolean;
  rejection_reason?: string | null;
}

export interface EvaluationRecord {
  evaluation_id?: string;
  actual_reward?: number;
  predicted_reward?: number;
  prediction_error?: number;
  was_rolled_back?: boolean;
  components?: Record<string, number>;
}

export interface DeploymentRecord {
  deployment_id?: string;
  repair_arm?: string;
  status?: string;
  rollback_reason?: string | null;
  loss_pre?: number;
  loss_post?: number;
}

export interface Episode {
  episode_id: string;
  iso_timestamp: string;
  diagnosed_cause: string;
  confidence: number;
  selected_repair: string;
  loss_before: number;
  loss_after: number;
  loss_improvement: number;
  reward: number;
  status: string;
}

export interface EventItem {
  state: string;
  message: string;
}

export interface BenchmarkSummaryData {
  calibration?: {
    production_ece?: number;
    calibrated_ece?: number;
    production_brier?: number;
    calibrated_brier?: number;
    test_sample_count?: number;
    optimal_temperature?: number;
    calibrated_gate_tau?: number;
    admitted_cases?: number;
    false_positives_admitted?: number;
    condition_negatives?: number;
    fpr_upper_bound_clopper_pearson?: number;
    fdr_upper_bound_clopper_pearson?: number;
    production?: {
      temperature?: number;
      threshold?: number;
      sample_size?: number;
      multiclass_brier?: number;
      binary_brier?: number;
      ece?: number;
      tpr?: number;
      fpr?: number;
      precision?: number;
      abstention_rate?: number;
      [key: string]: any;
    };
    calibrated?: {
      temperature?: number;
      threshold?: number;
      sample_size?: number;
      multiclass_brier?: number;
      binary_brier?: number;
      ece?: number;
      tpr?: number;
      fpr?: number;
      precision?: number;
      abstention_rate?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  policy_regret?: {
    thompson_sampling?: any;
    greedy?: any;
    heuristic?: any;
    fixed_heuristic?: any;
    random?: any;
    random_selection?: any;
    [key: string]: any;
  };
  ablation?: {
    full_framework?: any;
    no_safety_filter?: any;
    no_digital_twin?: any;
    no_episodic_memory?: any;
    [key: string]: any;
  };
  per_class?: Record<string, any>;
  [key: string]: any;
}

export interface ToastMessage {
  id: string;
  type: "info" | "success" | "warning" | "error";
  title: string;
  message: string;
  timestamp: number;
}
