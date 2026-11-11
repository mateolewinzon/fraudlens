export type TransactionInput = {
  transaction_id: string;
  user_id: string;
  transaction_datetime: string;
  amount: number;
  currency: string;
  operation_type: "PURCHASE";
  merchant: string;
  country: string;
  card_country: string;
  cardholder_present: boolean;
  card_present: boolean;
};

export type TransactionEvaluation = TransactionInput & {
  transaction_evaluation_id: string;
  risk_score: number;
  decision: "APPROVED" | "REJECTED" | "BLOCK";
  reasons?: string[];
  signals?: string[];
  rules_applied?: string[];
  model_id?: string;
  assessment_version?: string;
  history_count?: number;
  created_at: string;
  updated_at: string;
};

export type EvaluationResult = Pick<
  TransactionEvaluation,
  "transaction_evaluation_id" | "transaction_id" | "risk_score" | "decision" | "reasons" | "signals" |
  "rules_applied" | "model_id" | "assessment_version" | "history_count"
>;

export type EvaluationPage = {
  items: TransactionEvaluation[];
  limit: number;
  offset: number;
  has_more: boolean;
};

export type EvaluationForm = Omit<
  TransactionInput,
  "amount" | "operation_type" | "cardholder_present" | "card_present" | "transaction_datetime"
> & {
  amount: string;
  transaction_datetime: string;
  cardholder_present: string;
  card_present: string;
};

export function toTransactionInput(form: EvaluationForm): TransactionInput {
  const date = new Date(form.transaction_datetime);
  if (!Number.isFinite(date.getTime())) throw new Error("Ingresá una fecha y hora válidas.");
  return {
    transaction_id: form.transaction_id.trim(),
    user_id: form.user_id.trim(),
    transaction_datetime: date.toISOString(),
    amount: Number(form.amount),
    currency: form.currency.trim().toUpperCase(),
    operation_type: "PURCHASE",
    merchant: form.merchant.trim(),
    country: form.country.trim().toUpperCase(),
    card_country: form.card_country.trim().toUpperCase(),
    cardholder_present: form.cardholder_present === "true",
    card_present: form.card_present === "true",
  };
}

/** API failure with a Spanish message for the UI and the server's per-field errors, if any. */
export class ApiError extends Error {
  readonly status: number;
  readonly fields: Record<string, string>;

  constructor(message: string, status: number, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fields = fields;
  }
}

function readFields(body: unknown): Record<string, string> {
  if (!body || typeof body !== "object" || !("fields" in body)) return {};
  const fields = body.fields;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return {};
  return Object.fromEntries(Object.entries(fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

async function parseResponse<T>(response: Response, failureMessage: string): Promise<T> {
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const fields = readFields(body);
    const message = response.status === 400 && Object.keys(fields).length
      ? "Revisá los datos marcados."
      : response.status === 400 ? "La solicitud no es válida." : failureMessage;
    throw new ApiError(message, response.status, fields);
  }
  return body as T;
}

export async function getTransactionEvaluations(offset = 0, limit = 10, signal?: AbortSignal): Promise<EvaluationPage> {
  const query = new URLSearchParams({ limit: String(limit), offset: String(offset) });
  const response = await fetch(`/api/transaction-evaluations?${query}`, { cache: "no-store", signal });
  return parseResponse<EvaluationPage>(response, "No se pudo cargar el historial.");
}

export async function createTransactionEvaluation(input: TransactionInput): Promise<EvaluationResult> {
  const response = await fetch("/api/transaction-evaluations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return parseResponse<EvaluationResult>(
    response,
    "No se pudo evaluar la transacción. La base de datos o el proveedor de IA no respondieron.",
  );
}
