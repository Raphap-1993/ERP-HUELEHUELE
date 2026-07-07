import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFIRM_TOKEN,
  PREMIUM_NEGRO_AROMA_VARIANTS,
  assertCanApplyPremiumNegroBackfill,
  buildPremiumNegroWarehouseBalancePlan,
  parseBackfillPremiumNegroArgs,
  resolveMissingPremiumNegroAromaVariants
} from "./backfill-premium-negro-aroma-variants";

test("declara solo las dos variantes de aroma faltantes de premium negro", () => {
  assert.deepEqual(
    PREMIUM_NEGRO_AROMA_VARIANTS.map((variant) => ({
      sku: variant.sku,
      flavorCode: variant.flavorCode,
      flavorLabel: variant.flavorLabel,
      stockOnHand: variant.stockOnHand
    })),
    [
      {
        sku: "HG-PN-002",
        flavorCode: "eucalipto-frio",
        flavorLabel: "Eucalipto Frío",
        stockOnHand: 70
      },
      {
        sku: "HG-PN-003",
        flavorCode: "citrus-herbal",
        flavorLabel: "Citrus Herbal",
        stockOnHand: 50
      }
    ]
  );
});

test("resuelve solo variantes faltantes sin tocar SKUs existentes", () => {
  const missing = resolveMissingPremiumNegroAromaVariants(["HG-PN-001", "HG-PN-002"]);

  assert.deepEqual(
    missing.map((variant) => variant.sku),
    ["HG-PN-003"]
  );
});

test("parsea dry-run por defecto y exige confirmacion explicita para apply", () => {
  assert.deepEqual(parseBackfillPremiumNegroArgs([]), {
    apply: false,
    confirm: null
  });
  assert.deepEqual(parseBackfillPremiumNegroArgs(["--dry-run"]), {
    apply: false,
    confirm: null
  });
  assert.deepEqual(parseBackfillPremiumNegroArgs(["--apply", "--confirm", CONFIRM_TOKEN]), {
    apply: true,
    confirm: CONFIRM_TOKEN
  });
});

test("bloquea apply sin confirm token correcto", () => {
  assert.throws(
    () =>
      assertCanApplyPremiumNegroBackfill({
        apply: true,
        confirm: "otro-token",
        env: {}
      }),
    /confirm/
  );
});

test("bloquea apply productivo sin guard explicito", () => {
  assert.throws(
    () =>
      assertCanApplyPremiumNegroBackfill({
        apply: true,
        confirm: CONFIRM_TOKEN,
        env: { NODE_ENV: "production" }
      }),
    /HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_AROMAS/
  );

  assert.doesNotThrow(() =>
    assertCanApplyPremiumNegroBackfill({
      apply: true,
      confirm: CONFIRM_TOKEN,
      env: {
        NODE_ENV: "production",
        HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_AROMAS: "1"
      }
    })
  );
});

test("conserva el stock total cuando produccion no tiene todos los almacenes locales", () => {
  const plan = buildPremiumNegroWarehouseBalancePlan({
    target: PREMIUM_NEGRO_AROMA_VARIANTS[0],
    fallbackWarehouseId: "warehouse-lima-id",
    warehouses: [{ id: "warehouse-lima-id", code: "WH-LIMA-CENTRAL" }]
  });

  assert.deepEqual(plan, [
    {
      warehouseCode: "WH-LIMA-CENTRAL",
      warehouseId: "warehouse-lima-id",
      stockOnHand: 70
    }
  ]);
});
