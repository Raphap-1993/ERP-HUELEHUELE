import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFIRM_TOKEN,
  PREMIUM_NEGRO_RETIRED_AROMA_SKUS,
  assertCanApplyPremiumNegroRetirement,
  parsePremiumNegroRetirementArgs,
  resolvePremiumNegroRetiredVariants
} from "./retire-premium-negro-extra-aromas";

test("declara solo los SKUs retirados de premium negro", () => {
  assert.deepEqual(PREMIUM_NEGRO_RETIRED_AROMA_SKUS, ["HG-PN-002", "HG-PN-003"]);
});

test("detecta qué variantes activas deben retirarse", () => {
  assert.deepEqual(
    resolvePremiumNegroRetiredVariants([
      { sku: "HG-PN-001", status: "active" },
      { sku: "HG-PN-002", status: "active" },
      { sku: "HG-PN-003", status: "inactive" }
    ]),
    ["HG-PN-002"]
  );
});

test("parsea dry-run por defecto y confirma apply de forma explícita", () => {
  assert.deepEqual(parsePremiumNegroRetirementArgs([]), {
    apply: false,
    confirm: null
  });
  assert.deepEqual(parsePremiumNegroRetirementArgs(["--apply", "--confirm", CONFIRM_TOKEN]), {
    apply: true,
    confirm: CONFIRM_TOKEN
  });
});

test("bloquea apply sin confirm token correcto", () => {
  assert.throws(
    () =>
      assertCanApplyPremiumNegroRetirement({
        apply: true,
        confirm: "otro-token",
        env: {}
      }),
    /confirm/
  );
});

test("bloquea apply productivo sin guard explícito", () => {
  assert.throws(
    () =>
      assertCanApplyPremiumNegroRetirement({
        apply: true,
        confirm: CONFIRM_TOKEN,
        env: { NODE_ENV: "production" }
      }),
    /HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_RETIREMENT/
  );
});
