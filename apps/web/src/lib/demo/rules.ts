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

export type LevelFilter = RiskLevel | "NONE" | "";

/** CU-05 minimum filters. Empty strings mean "no filter"; dates are local YYYY-MM-DD, inclusive. */
export type DemoFilters = {
  transactionId: string;
  userId: string;
  from: string;
  to: string;
  level: LevelFilter;
  decision: DemoDecision | "";
};

export const EMPTY_FILTERS: DemoFilters = Object.freeze({ transactionId: "", userId: "", from: "", to: "", level: "", decision: "" });

export function levelOf(item: DemoTransaction): RiskLevel | "NONE" {
  return item.score === null ? "NONE" : riskLevel(item.score, item.config);
}

function localDay(value: string): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function filterTransactions(list: readonly DemoTransaction[], filters: DemoFilters): DemoTransaction[] {
  const transactionId = filters.transactionId.trim().toLowerCase();
  const userId = filters.userId.trim().toLowerCase();
  return list.filter(item => {
    const day = localDay(item.datetime);
    return (!transactionId || item.id.toLowerCase().includes(transactionId)) &&
      (!userId || item.userId.toLowerCase().includes(userId)) &&
      (!filters.from || day >= filters.from) &&
      (!filters.to || day <= filters.to) &&
      (!filters.level || levelOf(item) === filters.level) &&
      (!filters.decision || item.decision === filters.decision);
  });
}

export type ConfigErrors = Partial<Record<keyof DemoConfig, string>>;

/** CU-07: values from 0 to 100 and no inconsistent configurations. */
export function validateConfig(config: DemoConfig): ConfigErrors {
  const errors: ConfigErrors = {};
  const isScore = (value: number) => Number.isInteger(value) && value >= 0 && value <= 100;
  if (!isScore(config.reviewThreshold)) errors.reviewThreshold = "Ingresá un valor entero entre 0 y 100.";
  if (!isScore(config.blockThreshold)) errors.blockThreshold = "Ingresá un valor entero entre 0 y 100.";
  else if (!errors.reviewThreshold && config.blockThreshold <= config.reviewThreshold) {
    errors.blockThreshold = "Tiene que ser mayor que el umbral de revisión.";
  }
  if (config.minAmountEnabled && !(Number.isFinite(config.minAmount) && config.minAmount > 0)) {
    errors.minAmount = "Ingresá un monto mayor a 0.";
  }
  return errors;
}

export type ConfigChange = { author: string; at: string; previous: DemoConfig; next: DemoConfig };

/** CU-07 audit trail: who, when and the previous values. Unchanged configs are not recorded. */
export function recordConfigChange(log: readonly ConfigChange[], previous: DemoConfig, next: DemoConfig, author: string, at: Date): ConfigChange[] {
  const keys = Object.keys(previous) as (keyof DemoConfig)[];
  if (keys.every(key => previous[key] === next[key])) return [...log];
  return [{ author, at: at.toISOString(), previous: { ...previous }, next: { ...next } }, ...log];
}
