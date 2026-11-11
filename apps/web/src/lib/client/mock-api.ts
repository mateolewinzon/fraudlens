import type { EvaluationApi, TransactionEvaluation, TransactionInput } from "./transaction-evaluations.ts";

/**
 * Simulated evaluation API for presentations without MongoDB or an AI provider.
 * Signals follow the same consistency rules the backend enforces on the model output:
 * COUNTRY_MISMATCH iff countries differ, INSUFFICIENT_HISTORY without approved history,
 * amount compared only in the same currency, and no UNUSUAL_MERCHANT without history.
 * Scores and decisions are illustrative, not FraudLens rules.
 */
type Options = { delayMs?: number; now?: () => Date };

const MODEL_ID = "simulado";
const VERSION = "simulacion-demo";

const SEED: (Omit<TransactionInput, "operation_type"> & { at: string })[] = [
  { at: "2026-11-11T12:10:00Z", transaction_id: "TX-SIM004", user_id: "demo-cliente-frecuente", transaction_datetime: "2026-11-11T12:08:00Z", amount: 31000, currency: "ARS", merchant: "Supermercado Central", country: "AR", card_country: "AR", cardholder_present: true, card_present: true },
  { at: "2026-11-10T19:40:00Z", transaction_id: "TX-SIM003", user_id: "demo-cliente-frecuente", transaction_datetime: "2026-11-10T19:38:00Z", amount: 18000, currency: "ARS", merchant: "Farmacia del Sol", country: "AR", card_country: "AR", cardholder_present: true, card_present: true },
  { at: "2026-11-09T13:05:00Z", transaction_id: "TX-SIM002", user_id: "demo-cliente-frecuente", transaction_datetime: "2026-11-09T13:02:00Z", amount: 27400, currency: "ARS", merchant: "Supermercado Central", country: "AR", card_country: "AR", cardholder_present: true, card_present: true },
  { at: "2026-11-08T11:20:00Z", transaction_id: "TX-SIM001", user_id: "demo-cliente-frecuente", transaction_datetime: "2026-11-08T11:18:00Z", amount: 25000, currency: "ARS", merchant: "Supermercado Central", country: "AR", card_country: "AR", cardholder_present: true, card_present: true },
];

function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (ms <= 0) return resolve();
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener("abort", () => { clearTimeout(timer); reject(new DOMException("Aborted", "AbortError")); }, { once: true });
  });
}

function assess(input: TransactionInput, store: readonly TransactionEvaluation[]) {
  const history = store.filter(item => item.user_id === input.user_id && item.decision === "APPROVED");
  const sameCurrency = history.filter(item => item.currency === input.currency);
  const signals: string[] = [];
  const reasons: string[] = [];
  let score = 0.08;

  if (history.length === 0) {
    signals.push("INSUFFICIENT_HISTORY");
    reasons.push("El usuario no tiene compras aprobadas previas; no hay patrón para comparar.");
    score += 0.2;
  } else {
    if (sameCurrency.length) {
      const average = sameCurrency.reduce((sum, item) => sum + item.amount, 0) / sameCurrency.length;
      if (input.amount > average * 3) {
        signals.push("UNUSUAL_AMOUNT");
        reasons.push(`El monto es ${Math.round(input.amount / average)} veces mayor al promedio aprobado del usuario.`);
        score += 0.3;
      }
    } else {
      reasons.push(`No hay compras en ${input.currency} para comparar el monto.`);
    }
    if (!history.some(item => item.merchant.toLowerCase() === input.merchant.toLowerCase())) {
      signals.push("UNUSUAL_MERCHANT");
      reasons.push("El comercio no aparece en el historial aprobado del usuario.");
      score += 0.2;
    }
  }
  if (input.country !== input.card_country) {
    signals.push("COUNTRY_MISMATCH");
    reasons.push(`La operación es en ${input.country} y la tarjeta fue emitida en ${input.card_country}.`);
    score += 0.25;
  }
  if (!input.card_present) score += 0.1;
  if (reasons.length === 0) reasons.push("Monto y comercio consistentes con el historial aprobado del usuario.");

  const risk_score = Math.min(0.97, Math.round(score * 100) / 100);
  return {
    decision: risk_score >= 0.6 ? "REJECTED" as const : "APPROVED" as const,
    risk_score, reasons, signals, history_count: history.length,
  };
}

export function createMockApi({ delayMs = 900, now = () => new Date() }: Options = {}): EvaluationApi {
  let counter = 0;
  const store: TransactionEvaluation[] = [];
  for (const { at, ...seed } of [...SEED].reverse()) {
    const input: TransactionInput = { ...seed, operation_type: "PURCHASE" };
    store.unshift({
      ...input, ...assess(input, store), transaction_evaluation_id: `sim-seed-${++counter}`,
      rules_applied: [], model_id: MODEL_ID, assessment_version: VERSION, created_at: at, updated_at: at,
    });
  }

  return {
    async create(input) {
      await wait(delayMs);
      const at = now().toISOString();
      const evaluation: TransactionEvaluation = {
        ...input, ...assess(input, store), transaction_evaluation_id: `sim-${++counter}`,
        rules_applied: [], model_id: MODEL_ID, assessment_version: VERSION, created_at: at, updated_at: at,
      };
      store.unshift(evaluation);
      const { transaction_evaluation_id, transaction_id, risk_score, decision, reasons, signals, rules_applied, model_id, assessment_version, history_count } = evaluation;
      return { transaction_evaluation_id, transaction_id, risk_score, decision, reasons, signals, rules_applied, model_id, assessment_version, history_count };
    },
    async list(offset, limit, signal) {
      await wait(Math.min(delayMs, 300), signal);
      return { items: store.slice(offset, offset + limit), limit, offset, has_more: store.length > offset + limit };
    },
  };
}
