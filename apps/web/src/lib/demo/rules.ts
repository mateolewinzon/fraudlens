/**
 * Demo-only rules. They illustrate CU-02, CU-04 and section 6 of the functional requirements
 * using the requirements' own example values. Nothing here is used by the real API.
 */
export type DemoConfig = {
  minAmountEnabled: boolean;
  minAmount: number;
  reviewThreshold: number;
  blockThreshold: number;
};

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DemoDecision = "APPROVE" | "REVIEW" | "BLOCK";

type DemoBase = {
  id: string;
  userId: string;
  datetime: string;
  amount: number;
  currency: "ARS";
  merchant: string;
  country: string;
  cardCountry: string;
  decision: DemoDecision;
  rule: string;
  factors: string[];
  history: { count: number; averageAmount: number | null; usualMerchants: string[] };
  analyzedAt: string;
  config: DemoConfig;
};

export type DemoTransaction = DemoBase & (
  | { status: "ANALYZED"; score: number }
  | { status: "RULE_APPROVED"; score: null }
);

/** Input for a simulated live arrival: the score stands in for the model output. */
export type IncomingTemplate = Pick<DemoBase, "userId" | "amount" | "currency" | "merchant" | "country" | "cardCountry" | "factors" | "history"> & {
  score: number;
};

/** CU-02 example ("ARS 10.000") and CU-04 example (review from 60, block from 85). */
export const EXAMPLE_CONFIG: DemoConfig = Object.freeze({
  minAmountEnabled: true,
  minAmount: 10000,
  reviewThreshold: 60,
  blockThreshold: 85,
});

const MEDIUM_FROM = 40;

export function formatArs(amount: number): string {
  return `ARS ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(amount)}`;
}

/** Section 6 levels; the high and critical bands move with the configured thresholds. */
export function riskLevel(score: number, config: DemoConfig): RiskLevel {
  if (score >= config.blockThreshold) return "CRITICAL";
  if (score >= config.reviewThreshold) return "HIGH";
  return score >= Math.min(MEDIUM_FROM, config.reviewThreshold) ? "MEDIUM" : "LOW";
}

export function decide(score: number, config: DemoConfig): { decision: DemoDecision; rule: string } {
  if (score >= config.blockThreshold) return { decision: "BLOCK", rule: `Riesgo desde ${config.blockThreshold} → bloquear` };
  if (score >= config.reviewThreshold) return { decision: "REVIEW", rule: `Riesgo desde ${config.reviewThreshold} → revisar` };
  return { decision: "APPROVE", rule: `Riesgo menor a ${config.reviewThreshold} → aprobar` };
}

/** Simulates FraudLens analyzing a new transaction with the config in force right now. */
export function evaluateIncoming(template: IncomingTemplate, config: DemoConfig, now: Date, id: string): DemoTransaction {
  const { score, ...data } = template;
  const base = { ...data, id, datetime: now.toISOString(), analyzedAt: now.toISOString(), config: { ...config } };
  if (config.minAmountEnabled && template.amount < config.minAmount) {
    return {
      ...base, status: "RULE_APPROVED", score: null, decision: "APPROVE", factors: [],
      rule: `Monto menor a ${formatArs(config.minAmount)} → aprobada por regla, sin ejecutar el modelo`,
    };
  }
  return { ...base, status: "ANALYZED", score, ...decide(score, config) };
}

export type SortKey = "date" | "risk";
export type SortDirection = "asc" | "desc";

export function sortTransactions(list: readonly DemoTransaction[], key: SortKey, direction: SortDirection): DemoTransaction[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...list].sort((a, b) => {
    if (key === "date") return sign * (Date.parse(a.datetime) - Date.parse(b.datetime));
    if (a.score === null || b.score === null) return a.score === b.score ? 0 : a.score === null ? 1 : -1;
    return sign * (a.score - b.score);
  });
}

export const LEVEL_LABELS: Record<RiskLevel, string> = { LOW: "Bajo", MEDIUM: "Medio", HIGH: "Alto", CRITICAL: "Crítico" };
export const DECISION_LABELS: Record<DemoDecision, string> = { APPROVE: "Aprobar", REVIEW: "Revisar", BLOCK: "Bloquear" };
export const STATUS_LABELS: Record<DemoTransaction["status"], string> = { ANALYZED: "Analizada", RULE_APPROVED: "Aprobada por regla" };
