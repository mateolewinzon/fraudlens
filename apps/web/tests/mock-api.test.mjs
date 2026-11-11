import test from "node:test";
import assert from "node:assert/strict";
import { createMockApi } from "../src/lib/client/mock-api.ts";

const base = {
  transaction_id: "TX-1", user_id: "demo-cliente-frecuente", transaction_datetime: "2026-11-11T18:00:00.000Z",
  amount: 25000, currency: "ARS", operation_type: "PURCHASE", merchant: "Supermercado Central",
  country: "AR", card_country: "AR", cardholder_present: true, card_present: true,
};
const api = () => createMockApi({ delayMs: 0, now: () => new Date("2026-11-11T18:00:00Z") });

test("starts with seeded history, newest first, paginated with has_more", async () => {
  const page = await api().list(0, 2);
  assert.equal(page.items.length, 2);
  assert.equal(page.has_more, true);
  const times = page.items.map(item => Date.parse(item.created_at));
  assert.ok(times[0] >= times[1]);
});

test("a usual purchase of the recurring user is approved without signals", async () => {
  const result = await api().create(base);
  assert.equal(result.decision, "APPROVED");
  assert.deepEqual(result.signals, []);
  assert.ok(result.history_count > 0);
  assert.ok(result.risk_score >= 0 && result.risk_score <= 1);
});

test("a new user gets INSUFFICIENT_HISTORY and never UNUSUAL_MERCHANT", async () => {
  const result = await api().create({ ...base, user_id: "cliente-nuevo", merchant: "Librería Ateneo" });
  assert.ok(result.signals.includes("INSUFFICIENT_HISTORY"));
  assert.ok(!result.signals.includes("UNUSUAL_MERCHANT"));
  assert.equal(result.history_count, 0);
});

test("COUNTRY_MISMATCH appears if and only if countries differ", async () => {
  const client = api();
  assert.ok((await client.create({ ...base, transaction_id: "A", card_country: "BR" })).signals.includes("COUNTRY_MISMATCH"));
  assert.ok(!(await client.create({ ...base, transaction_id: "B" })).signals.includes("COUNTRY_MISMATCH"));
});

test("an unusual amount at a new merchant without card is rejected with reasons", async () => {
  const result = await api().create({ ...base, amount: 1850000, merchant: "Electrónica Online", cardholder_present: false, card_present: false });
  assert.equal(result.decision, "REJECTED");
  assert.ok(result.signals.includes("UNUSUAL_AMOUNT"));
  assert.ok(result.signals.includes("UNUSUAL_MERCHANT"));
  assert.ok(result.reasons.length >= 2);
});

test("created evaluations appear first in the list with the submitted data", async () => {
  const client = api();
  const result = await client.create({ ...base, transaction_id: "TX-NEW" });
  const page = await client.list(0, 10);
  assert.equal(page.items[0].transaction_evaluation_id, result.transaction_evaluation_id);
  assert.equal(page.items[0].transaction_id, "TX-NEW");
  assert.equal(page.items[0].merchant, base.merchant);
});

test("only approved evaluations count as history", async () => {
  const client = api();
  const user = { ...base, user_id: "otro" };
  await client.create({ ...user, transaction_id: "R", amount: 1850000, merchant: "X", cardholder_present: false, card_present: false, card_country: "US" });
  const next = await client.create({ ...user, transaction_id: "N" });
  assert.equal(next.history_count, 0);
});
