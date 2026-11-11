import test from "node:test";
import assert from "node:assert/strict";
import { EXAMPLE_CONFIG, recordConfigChange, validateConfig } from "../src/lib/demo/rules.ts";

test("the example config is valid", () => {
  assert.deepEqual(validateConfig(EXAMPLE_CONFIG), {});
});

test("thresholds must be integers between 0 and 100 (CU-07)", () => {
  assert.equal(validateConfig({ ...EXAMPLE_CONFIG, reviewThreshold: -1 }).reviewThreshold, "Ingresá un valor entero entre 0 y 100.");
  assert.equal(validateConfig({ ...EXAMPLE_CONFIG, blockThreshold: 101 }).blockThreshold, "Ingresá un valor entero entre 0 y 100.");
  assert.equal(validateConfig({ ...EXAMPLE_CONFIG, reviewThreshold: 60.5 }).reviewThreshold, "Ingresá un valor entero entre 0 y 100.");
  assert.equal(validateConfig({ ...EXAMPLE_CONFIG, reviewThreshold: Number.NaN }).reviewThreshold, "Ingresá un valor entero entre 0 y 100.");
});

test("the block threshold must be greater than the review threshold (CU-04)", () => {
  assert.equal(validateConfig({ ...EXAMPLE_CONFIG, reviewThreshold: 85, blockThreshold: 85 }).blockThreshold, "Tiene que ser mayor que el umbral de revisión.");
});

test("an enabled minimum amount must be positive; a disabled one is not checked", () => {
  assert.equal(validateConfig({ ...EXAMPLE_CONFIG, minAmount: 0 }).minAmount, "Ingresá un monto mayor a 0.");
  assert.deepEqual(validateConfig({ ...EXAMPLE_CONFIG, minAmountEnabled: false, minAmount: 0 }), {});
});

test("records who changed the config, when, and the previous values, newest first", () => {
  const at = new Date("2026-11-11T16:00:00Z");
  const next = { ...EXAMPLE_CONFIG, blockThreshold: 90 };
  const log = recordConfigChange([], EXAMPLE_CONFIG, next, "Administrador (demo)", at);
  assert.deepEqual(log, [{ author: "Administrador (demo)", at: at.toISOString(), previous: EXAMPLE_CONFIG, next }]);
  const later = recordConfigChange(log, next, EXAMPLE_CONFIG, "Administrador (demo)", new Date("2026-11-11T17:00:00Z"));
  assert.equal(later.length, 2);
  assert.deepEqual(later[0].next, EXAMPLE_CONFIG);
});

test("does not record a change when nothing changed", () => {
  assert.deepEqual(recordConfigChange([], EXAMPLE_CONFIG, { ...EXAMPLE_CONFIG }, "x", new Date()), []);
});
