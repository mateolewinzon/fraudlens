import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_FILTERS, filterTransactions, levelOf } from "../src/lib/demo/rules.ts";
import { DEMO_TRANSACTIONS } from "../src/lib/demo/data.ts";

const ids = list => list.map(item => item.id);

test("empty filters keep every transaction", () => {
  assert.deepEqual(ids(filterTransactions(DEMO_TRANSACTIONS, EMPTY_FILTERS)), ids(DEMO_TRANSACTIONS));
});

test("filters by transaction and user id, case-insensitive and partial", () => {
  assert.deepEqual(ids(filterTransactions(DEMO_TRANSACTIONS, { ...EMPTY_FILTERS, transactionId: "d1a07" })), ["TX-D1A07"]);
  const byUser = filterTransactions(DEMO_TRANSACTIONS, { ...EMPTY_FILTERS, userId: "USR-1042" });
  assert.ok(byUser.length >= 2);
  assert.ok(byUser.every(item => item.userId === "usr-1042"));
});

test("filters by risk level, including transactions without analysis", () => {
  const critical = filterTransactions(DEMO_TRANSACTIONS, { ...EMPTY_FILTERS, level: "CRITICAL" });
  assert.ok(critical.length > 0);
  assert.ok(critical.every(item => levelOf(item) === "CRITICAL"));
  const none = filterTransactions(DEMO_TRANSACTIONS, { ...EMPTY_FILTERS, level: "NONE" });
  assert.ok(none.length > 0);
  assert.ok(none.every(item => item.score === null));
});

test("filters by decision", () => {
  const review = filterTransactions(DEMO_TRANSACTIONS, { ...EMPTY_FILTERS, decision: "REVIEW" });
  assert.ok(review.length > 0);
  assert.ok(review.every(item => item.decision === "REVIEW"));
});

test("filters by an inclusive date range on the transaction date", () => {
  const list = [
    { ...DEMO_TRANSACTIONS[0], id: "A", datetime: "2026-11-09T12:00:00" },
    { ...DEMO_TRANSACTIONS[0], id: "B", datetime: "2026-11-10T23:59:00" },
    { ...DEMO_TRANSACTIONS[0], id: "C", datetime: "2026-11-11T00:01:00" },
  ];
  assert.deepEqual(ids(filterTransactions(list, { ...EMPTY_FILTERS, from: "2026-11-10", to: "2026-11-10" })), ["B"]);
  assert.deepEqual(ids(filterTransactions(list, { ...EMPTY_FILTERS, from: "2026-11-10" })), ["B", "C"]);
  assert.deepEqual(ids(filterTransactions(list, { ...EMPTY_FILTERS, to: "2026-11-09" })), ["A"]);
});

test("combines filters and can return no results", () => {
  assert.deepEqual(filterTransactions(DEMO_TRANSACTIONS, { ...EMPTY_FILTERS, decision: "BLOCK", level: "LOW" }), []);
});
