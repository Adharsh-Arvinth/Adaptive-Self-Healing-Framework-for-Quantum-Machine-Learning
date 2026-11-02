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
  bloch?: { x: number; y: number; z: number; qubit_index?: number };
  anomalies?: string[];
  diagnosis?: DiagnosisData | null;
  bandit_decision?: BanditDecisionData | null;
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
