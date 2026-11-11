import test from "node:test";
import assert from "node:assert/strict";
import {
  decisionLabel, fieldErrorMessage, formatRiskScore, formatShortDateTime, signalLabel,
} from "../src/lib/client/presentation.ts";
import { buildScenarioForm, TEST_SCENARIOS } from "../src/lib/client/scenarios.ts";
import { toTransactionInput } from "../src/lib/client/transaction-evaluations.ts";

test("shows decisions in Spanish and keeps unknown legacy values neutral", () => {
  assert.equal(decisionLabel("APPROVED"), "Aprobada");
  assert.equal(decisionLabel("REJECTED"), "Rechazada");
  assert.equal(decisionLabel("BLOCK"), "Bloqueada (registro anterior)");
});

test("translates every risk signal returned by the API", () => {
  assert.equal(signalLabel("UNUSUAL_AMOUNT"), "Monto inusual");
  assert.equal(signalLabel("UNUSUAL_MERCHANT"), "Comercio inusual");
  assert.equal(signalLabel("COUNTRY_MISMATCH"), "País de la tarjeta distinto al de la operación");
  assert.equal(signalLabel("INSUFFICIENT_HISTORY"), "Historial insuficiente");
  assert.equal(signalLabel("SOMETHING_NEW"), "SOMETHING_NEW");
});

test("formats the risk score as a 0 to 1 value with two decimals, without inventing levels", () => {
  assert.equal(formatRiskScore(0.7234), "0,72");
  assert.equal(formatRiskScore(0), "0,00");
  assert.equal(formatRiskScore(1), "1,00");
});

test("maps API field errors to Spanish guidance", () => {
  assert.equal(fieldErrorMessage("currency"), "Usá un código de 3 letras, por ejemplo ARS.");
  assert.equal(fieldErrorMessage("card_country"), "Usá un código de país de 2 letras, por ejemplo AR.");
  assert.equal(fieldErrorMessage("unexpected"), "Revisá este campo.");
});

test("every scenario builds a form the API contract accepts, with a fresh transaction id", () => {
  const now = new Date("2026-11-11T15:30:00");
  let counter = 0;
  const nextId = () => `id${++counter}`;
  const ids = new Set();
  for (const scenario of TEST_SCENARIOS) {
    const form = buildScenarioForm(scenario, now, nextId);
    const input = toTransactionInput(form);
    assert.equal(input.operation_type, "PURCHASE");
    assert.match(input.currency, /^[A-Z]{3}$/);
    assert.match(input.country, /^[A-Z]{2}$/);
    assert.match(input.card_country, /^[A-Z]{2}$/);
    assert.ok(input.amount > 0);
    assert.ok(input.transaction_id && input.user_id && input.merchant);
    ids.add(input.transaction_id);
  }
  assert.equal(ids.size, TEST_SCENARIOS.length);
});

test("the new-customer scenario uses a user id never reused by other runs", () => {
  const scenario = TEST_SCENARIOS.find(item => item.id === "new-customer");
  assert.ok(scenario);
  const first = buildScenarioForm(scenario, new Date(), () => "aaa");
  const second = buildScenarioForm(scenario, new Date(), () => "bbb");
  assert.notEqual(first.user_id, second.user_id);
});

test("the foreign-card scenario sends different transaction and card countries", () => {
  const scenario = TEST_SCENARIOS.find(item => item.id === "foreign-card");
  assert.ok(scenario);
  const form = buildScenarioForm(scenario, new Date(), () => "x");
  assert.notEqual(form.country, form.card_country);
});

test("formats table dates compactly and labels invalid dates", () => {
  assert.match(formatShortDateTime("2026-11-11T15:20:00.000Z"), /^\d{1,2}\/\d{1,2}\/\d{2},? \d{1,2}:\d{2}/);
  assert.equal(formatShortDateTime("not-a-date"), "Sin fecha");
});
