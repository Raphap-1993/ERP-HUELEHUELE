import test from "node:test";
import assert from "node:assert/strict";
import { buildProductVariantRolloutAudit, extractAromaCopyValues } from "../src/modules/products/product-variant-rollout-audit";

test("extractAromaCopyValues splits common aroma separators", () => {
  const values = extractAromaCopyValues([
    {
      label: "Aromas",
      value: "Negro Intenso, Eucalipto Frío y Citrus Herbal"
    }
  ]);

  assert.deepEqual(values, ["Negro Intenso", "Eucalipto Frío", "Citrus Herbal"]);
});

test("buildProductVariantRolloutAudit flags copy that needs real variants", () => {
  const audit = buildProductVariantRolloutAudit({
    productKind: "single",
    detailAttributes: [
      {
        label: "Aromas",
        value: "Negro Intenso, Eucalipto Frío y Citrus Herbal"
      }
    ],
    variants: [
      {
        flavorCode: "negro-intenso",
        flavorLabel: "Negro Intenso",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 20,
        defaultWarehouseId: "wh-1",
        warehouseBalances: [
          {
            stockOnHand: 20,
            reservedQuantity: 0,
            committedQuantity: 0
          }
        ]
      }
    ]
  });

  assert.equal(audit.status, "copy_needs_variants");
  assert.equal(audit.activeVariantCount, 1);
  assert.match(audit.warnings.join(" "), /solo existe una variante activa/i);
});

test("buildProductVariantRolloutAudit marks multi-variant products without inventory as incomplete", () => {
  const audit = buildProductVariantRolloutAudit({
    productKind: "single",
    detailAttributes: [
      {
        label: "Aromas",
        value: "Negro Intenso, Eucalipto Frío, Citrus Herbal"
      }
    ],
    variants: [
      {
        flavorCode: "negro-intenso",
        flavorLabel: "Negro Intenso",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 0,
        defaultWarehouseId: "wh-1",
        warehouseBalances: []
      },
      {
        flavorCode: "eucalipto-frio",
        flavorLabel: "Eucalipto Frío",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 0,
        defaultWarehouseId: "wh-1",
        warehouseBalances: []
      }
    ]
  });

  assert.equal(audit.status, "multi_variant_incomplete");
  assert.match(audit.warnings.join(" "), /stock operativo cargado/i);
});

test("buildProductVariantRolloutAudit keeps editorial mismatches out of ready state", () => {
  const audit = buildProductVariantRolloutAudit({
    productKind: "single",
    detailAttributes: [
      {
        label: "Aromas",
        value: "Negro Intenso, Eucalipto Frío, Citrus Herbal"
      }
    ],
    variants: [
      {
        flavorCode: "negro-intenso",
        flavorLabel: "Negro Intenso",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 10,
        defaultWarehouseId: "wh-1",
        warehouseBalances: [
          {
            stockOnHand: 10,
            reservedQuantity: 0,
            committedQuantity: 0
          }
        ]
      },
      {
        flavorCode: "eucalipto-frio",
        flavorLabel: "Eucalipto Frío",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 12,
        defaultWarehouseId: "wh-2",
        warehouseBalances: [
          {
            stockOnHand: 12,
            reservedQuantity: 0,
            committedQuantity: 0
          }
        ]
      }
    ]
  });

  assert.equal(audit.status, "multi_variant_incomplete");
  assert.match(audit.warnings[0] ?? "", /no existen como variantes activas reales/i);
});

test("buildProductVariantRolloutAudit marks consistent multi-aroma products as ready", () => {
  const audit = buildProductVariantRolloutAudit({
    productKind: "single",
    detailAttributes: [
      {
        label: "Aromas",
        value: "Negro Intenso, Eucalipto Frío, Citrus Herbal"
      }
    ],
    variants: [
      {
        flavorCode: "negro-intenso",
        flavorLabel: "Negro Intenso",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 10,
        defaultWarehouseId: "wh-1",
        warehouseBalances: [
          {
            stockOnHand: 10,
            reservedQuantity: 0,
            committedQuantity: 0
          }
        ]
      },
      {
        flavorCode: "eucalipto-frio",
        flavorLabel: "Eucalipto Frío",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 12,
        defaultWarehouseId: "wh-2",
        warehouseBalances: [
          {
            stockOnHand: 12,
            reservedQuantity: 0,
            committedQuantity: 0
          }
        ]
      },
      {
        flavorCode: "citrus-herbal",
        flavorLabel: "Citrus Herbal",
        presentationCode: "unitario",
        presentationLabel: "Unitario",
        status: "active",
        stockOnHand: 8,
        defaultWarehouseId: "wh-1",
        warehouseBalances: [
          {
            stockOnHand: 8,
            reservedQuantity: 0,
            committedQuantity: 0
          }
        ]
      }
    ]
  });

  assert.equal(audit.status, "multi_variant_ready");
  assert.equal(audit.warnings.length, 0);
});
