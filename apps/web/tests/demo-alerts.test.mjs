import test from "node:test";
import assert from "node:assert/strict";
import { buildAlerts } from "../src/lib/demo/rules.ts";
import { DEMO_TRANSACTIONS } from "../src/lib/demo/data.ts";

test("creates one alert per transaction to review or block, newest first", () => {
  const alerts = buildAlerts(DEMO_TRANSACTIONS);
  const expected = DEMO_TRANSACTIONS.filter(item => item.decision !== "APPROVE");
  assert.equal(alerts.length, expected.length);
  assert.ok(alerts.every(alert => ["REVIEW", "BLOCK"].includes(alert.severity)));
  const times = alerts.map(alert => Date.parse(alert.at));
  assert.deepEqual(times, [...times].sort((a, b) => b - a));
});

test("each alert explains the decision with the rule that produced it", () => {
  const blocked = DEMO_TRANSACTIONS.find(item => item.decision === "BLOCK");
  const alert = buildAlerts([blocked])[0];
  assert.equal(alert.transactionId, blocked.id);
  assert.equal(alert.id, `alert-${blocked.id}`);
  assert.equal(alert.title, `Bloquear ${blocked.id}`);
  assert.equal(alert.detail, `${blocked.rule} · ${blocked.merchant}`);
});

test("approved transactions never raise alerts", () => {
  assert.deepEqual(buildAlerts(DEMO_TRANSACTIONS.filter(item => item.decision === "APPROVE")), []);
});
