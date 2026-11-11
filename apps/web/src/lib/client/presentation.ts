const DECISION_LABELS: Record<string, string> = {
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  BLOCK: "Bloqueada (registro anterior)",
};

const SIGNAL_LABELS: Record<string, string> = {
  UNUSUAL_AMOUNT: "Monto inusual",
  UNUSUAL_MERCHANT: "Comercio inusual",
  COUNTRY_MISMATCH: "País de la tarjeta distinto al de la operación",
  INSUFFICIENT_HISTORY: "Historial insuficiente",
};

const FIELD_ERRORS: Record<string, string> = {
  body: "La solicitud no es válida.",
  transaction_id: "Ingresá un ID de transacción.",
  user_id: "Ingresá un ID de usuario.",
  merchant: "Ingresá el comercio.",
  transaction_datetime: "Ingresá una fecha y hora válidas.",
  amount: "Ingresá un monto mayor a 0.",
  currency: "Usá un código de 3 letras, por ejemplo ARS.",
  operation_type: "Solo se admiten compras.",
  country: "Usá un código de país de 2 letras, por ejemplo AR.",
  card_country: "Usá un código de país de 2 letras, por ejemplo AR.",
  cardholder_present: "Elegí Sí o No.",
  card_present: "Elegí Sí o No.",
};

export function decisionLabel(decision: string): string {
  return DECISION_LABELS[decision] ?? decision;
}

export function signalLabel(signal: string): string {
  return SIGNAL_LABELS[signal] ?? signal;
}

export function fieldErrorMessage(field: string): string {
  return FIELD_ERRORS[field] ?? "Revisá este campo.";
}

/** The score is a model estimate from 0 to 1; no risk levels are derived from it. */
export function formatRiskScore(score: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(score);
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : new Intl.DateTimeFormat("es-AR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

/** Compact date for dense tables, e.g. "11/11/26, 12:20". */
export function formatShortDateTime(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Sin fecha"
    : new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(date);
}
