import test from "node:test";
import assert from "node:assert/strict";
import {
  EXAMPLE_CONFIG, decide, evaluateIncoming, riskLevel, sortTransactions,
} from "../src/lib/demo/rules.ts";
import { DEMO_TRANSACTIONS, INCOMING_TEMPLATES } from "../src/lib/demo/data.ts";

test("the example config is the one in the requirements (CU-02, CU-04)", () => {
  assert.deepEqual(EXAMPLE_CONFIG, { minAmountEnabled: true, minAmount: 10000, reviewThreshold: 60, blockThreshold: 85 });
});

test("risk levels follow section 6 and adapt to the configured thresholds", () => {
  assert.equal(riskLevel(39, EXAMPLE_CONFIG), "LOW");
  assert.equal(riskLevel(40, EXAMPLE_CONFIG), "MEDIUM");
  assert.equal(riskLevel(59, EXAMPLE_CONFIG), "MEDIUM");
  assert.equal(riskLevel(60, EXAMPLE_CONFIG), "HIGH");
  assert.equal(riskLevel(84, EXAMPLE_CONFIG), "HIGH");
  assert.equal(riskLevel(85, EXAMPLE_CONFIG), "CRITICAL");
  const strict = { ...EXAMPLE_CONFIG, reviewThreshold: 30, blockThreshold: 50 };
  assert.equal(riskLevel(35, strict), "HIGH");
  assert.equal(riskLevel(29, strict), "LOW");
});

test("decisions follow CU-04 and name the threshold that produced them", () => {
  assert.deepEqual(decide(59, EXAMPLE_CONFIG), { decision: "APPROVE", rule: "Riesgo menor a 60 → aprobar" });
  assert.deepEqual(decide(60, EXAMPLE_CONFIG), { decision: "REVIEW", rule: "Riesgo desde 60 → revisar" });
  assert.deepEqual(decide(85, EXAMPLE_CONFIG), { decision: "BLOCK", rule: "Riesgo desde 85 → bloquear" });
});

test("amounts under the enabled minimum are approved by rule without running the model (CU-02)", () => {
  const now = new Date("2026-11-11T15:00:00Z");
  const small = { ...INCOMING_TEMPLATES[0], amount: 9999, score: 90 };
  const result = evaluateIncoming(small, EXAMPLE_CONFIG, now, "N1");
  assert.equal(result.status, "RULE_APPROVED");
  assert.equal(result.score, null);
  assert.equal(result.decision, "APPROVE");
  assert.equal(result.rule, "Monto menor a ARS 10.000 → aprobada por regla, sin ejecutar el modelo");
  assert.deepEqual(result.config, EXAMPLE_CONFIG);
  const disabled = evaluateIncoming(small, { ...EXAMPLE_CONFIG, minAmountEnabled: false }, now, "N2");
  assert.equal(disabled.status, "ANALYZED");
  assert.equal(disabled.decision, "BLOCK");
});

test("incoming transactions keep a snapshot of the config used to analyze them", () => {
  const config = { ...EXAMPLE_CONFIG, blockThreshold: 95 };
  const result = evaluateIncoming({ ...INCOMING_TEMPLATES[0], amount: 50000, score: 90 }, config, new Date(), "N3");
  assert.equal(result.decision, "REVIEW");
  assert.deepEqual(result.config, config);
  assert.notEqual(result.config, config, "snapshot must be a copy");
});

test("sorts by date or risk in both directions, leaving unscored rows last", () => {
  const byRisk = sortTransactions(DEMO_TRANSACTIONS, "risk", "desc");
  const scores = byRisk.map(item => item.score);
  const scored = scores.filter(score => score !== null);
  assert.deepEqual(scored, [...scored].sort((a, b) => b - a));
  assert.equal(scores.at(-1), null);
  const byDate = sortTransactions(DEMO_TRANSACTIONS, "date", "asc").map(item => Date.parse(item.datetime));
  assert.deepEqual(byDate, [...byDate].sort((a, b) => a - b));
  assert.notEqual(sortTransactions(DEMO_TRANSACTIONS, "date", "asc"), DEMO_TRANSACTIONS);
});

test("demo data is consistent with its own config snapshot", () => {
  for (const item of DEMO_TRANSACTIONS) {
    if (item.status === "RULE_APPROVED") {
      assert.equal(item.score, null);
      assert.ok(item.amount < item.config.minAmount);
    } else if (item.status === "ANALYZED") {
      assert.equal(item.decision, decide(item.score, item.config).decision, item.id);
      assert.ok(item.factors.length <= 3, item.id);
    }
  }
});
