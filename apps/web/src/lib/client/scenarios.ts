import type { EvaluationForm } from "./transaction-evaluations.ts";

/**
 * Manual test inputs for the API. They only prefill the form: the decision always
 * comes from the server, and no outcome is promised for any scenario.
 */
export type TestScenario = {
  id: "new-customer" | "usual-purchase" | "foreign-card" | "unusual-amount";
  title: string;
  description: string;
  values: Omit<EvaluationForm, "transaction_id" | "transaction_datetime" | "user_id"> & {
    /** `null` creates a new user on every run. */
    user_id: string | null;
  };
};

const RECURRING_USER = "demo-cliente-frecuente";

export const TEST_SCENARIOS: readonly TestScenario[] = [
  {
    id: "new-customer",
    title: "Cliente nuevo",
    description: "Usuario sin compras previas. Prueba cómo decide la IA sin historial.",
    values: {
      user_id: null, amount: "48000", currency: "ARS", merchant: "Librería Ateneo",
      country: "AR", card_country: "AR", cardholder_present: "true", card_present: "true",
    },
  },
  {
    id: "usual-purchase",
    title: "Compra habitual",
    description: `Mismo usuario (${RECURRING_USER}). Enviala varias veces para construir historial.`,
    values: {
      user_id: RECURRING_USER, amount: "25000", currency: "ARS", merchant: "Supermercado Central",
      country: "AR", card_country: "AR", cardholder_present: "true", card_present: "true",
    },
  },
  {
    id: "foreign-card",
    title: "Tarjeta extranjera",
    description: "Operación en Argentina con tarjeta emitida en Brasil.",
    values: {
      user_id: RECURRING_USER, amount: "31000", currency: "ARS", merchant: "Supermercado Central",
      country: "AR", card_country: "BR", cardholder_present: "true", card_present: "true",
    },
  },
  {
    id: "unusual-amount",
    title: "Monto fuera de patrón",
    description: "Monto y comercio distintos a lo habitual, sin tarjeta presente.",
    values: {
      user_id: RECURRING_USER, amount: "1850000", currency: "ARS", merchant: "Electrónica Online",
      country: "AR", card_country: "AR", cardholder_present: "false", card_present: "false",
    },
  },
];

export function localDateTimeValue(date: Date): string {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function randomId(): string {
  return crypto.randomUUID().slice(0, 8).toUpperCase();
}

export function buildScenarioForm(scenario: TestScenario, now: Date, nextId: () => string = randomId): EvaluationForm {
  const { user_id, ...values } = scenario.values;
  return {
    ...values,
    transaction_id: `TX-${nextId()}`,
    user_id: user_id ?? `cliente-${nextId().toLowerCase()}`,
    transaction_datetime: localDateTimeValue(now),
  };
}
