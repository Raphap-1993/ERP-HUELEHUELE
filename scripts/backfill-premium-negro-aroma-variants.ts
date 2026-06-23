import "dotenv/config";
import { LifecycleStatus, PrismaClient } from "@prisma/client";

export const CONFIRM_TOKEN = "premium-negro-aromas-2026-06-23";

type BackfillArgs = {
  apply: boolean;
  confirm: string | null;
};

type BackfillEnv = Record<string, string | undefined>;

type PremiumNegroAromaVariantTarget = {
  sku: string;
  name: string;
  flavorCode: string;
  flavorLabel: string;
  presentationCode: string;
  presentationLabel: string;
  price: string;
  compareAtPrice: string;
  stockOnHand: number;
  lowStockThreshold: number;
  warehouseBalances: Array<{
    warehouseCode: string;
    stockOnHand: number;
  }>;
};

export const PREMIUM_NEGRO_AROMA_VARIANTS: PremiumNegroAromaVariantTarget[] = [
  {
    sku: "HG-PN-002",
    name: "Premium Negro - Eucalipto Frío 10 ml",
    flavorCode: "eucalipto-frio",
    flavorLabel: "Eucalipto Frío",
    presentationCode: "unitario",
    presentationLabel: "Unitario",
    price: "39.90",
    compareAtPrice: "50.00",
    stockOnHand: 70,
    lowStockThreshold: 100,
    warehouseBalances: [
      { warehouseCode: "WH-LIMA-CENTRAL", stockOnHand: 35 },
      { warehouseCode: "WH-AREQUIPA-SUR", stockOnHand: 35 }
    ]
  },
  {
    sku: "HG-PN-003",
    name: "Premium Negro - Citrus Herbal 10 ml",
    flavorCode: "citrus-herbal",
    flavorLabel: "Citrus Herbal",
    presentationCode: "unitario",
    presentationLabel: "Unitario",
    price: "39.90",
    compareAtPrice: "50.00",
    stockOnHand: 50,
    lowStockThreshold: 100,
    warehouseBalances: [
      { warehouseCode: "WH-LIMA-CENTRAL", stockOnHand: 25 },
      { warehouseCode: "WH-AREQUIPA-SUR", stockOnHand: 25 }
    ]
  }
];

export function parseBackfillPremiumNegroArgs(argv: string[]): BackfillArgs {
  let apply = false;
  let confirm: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--apply") {
      apply = true;
      continue;
    }

    if (arg === "--dry-run") {
      apply = false;
      continue;
    }

    if (arg === "--confirm") {
      confirm = argv[index + 1] ?? null;
      index += 1;
      continue;
    }

    if (arg?.startsWith("--confirm=")) {
      confirm = arg.slice("--confirm=".length) || null;
      continue;
    }

    throw new Error(`Argumento no soportado: ${arg}`);
  }

  return { apply, confirm };
}

export function assertCanApplyPremiumNegroBackfill({
  apply,
  confirm,
  env
}: BackfillArgs & { env: BackfillEnv }) {
  if (!apply) {
    return;
  }

  if (confirm !== CONFIRM_TOKEN) {
    throw new Error(
      `Para aplicar este backfill usa --confirm ${CONFIRM_TOKEN}. Sin confirm correcto solo se permite dry-run.`
    );
  }

  if (
    env.NODE_ENV === "production" &&
    env.HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_AROMAS !== "1"
  ) {
    throw new Error(
      "Producción requiere HUELEGOOD_ALLOW_PRODUCTION_PREMIUM_NEGRO_AROMAS=1 para proteger data real."
    );
  }
}

export function resolveMissingPremiumNegroAromaVariants(existingSkus: string[]) {
  const existing = new Set(existingSkus);
  return PREMIUM_NEGRO_AROMA_VARIANTS.filter((variant) => !existing.has(variant.sku));
}

function shouldRunCli() {
  return process.argv[1]?.endsWith("backfill-premium-negro-aroma-variants.ts") ?? false;
}

export function buildPremiumNegroWarehouseBalancePlan({
  target,
  fallbackWarehouseId,
  warehouses
}: {
  target: PremiumNegroAromaVariantTarget;
  fallbackWarehouseId: string;
  warehouses: Array<{ id: string; code: string }>;
}) {
  const warehouseByCode = new Map(warehouses.map((warehouse) => [warehouse.code, warehouse]));
  const balanceByWarehouseId = new Map<
    string,
    { warehouseId: string; warehouseCode: string; stockOnHand: number }
  >();
  let assignedStock = 0;

  for (const targetBalance of target.warehouseBalances) {
    const warehouse = warehouseByCode.get(targetBalance.warehouseCode);
    if (!warehouse) {
      continue;
    }

    assignedStock += targetBalance.stockOnHand;
    const existing = balanceByWarehouseId.get(warehouse.id);
    balanceByWarehouseId.set(warehouse.id, {
      warehouseId: warehouse.id,
      warehouseCode: warehouse.code,
      stockOnHand: (existing?.stockOnHand ?? 0) + targetBalance.stockOnHand
    });
  }

  const remainder = target.stockOnHand - assignedStock;
  if (remainder > 0) {
    const fallbackWarehouse =
      warehouses.find((warehouse) => warehouse.id === fallbackWarehouseId) ??
      ({ id: fallbackWarehouseId, code: "fallback" } satisfies { id: string; code: string });
    const existing = balanceByWarehouseId.get(fallbackWarehouse.id);
    balanceByWarehouseId.set(fallbackWarehouse.id, {
      warehouseId: fallbackWarehouse.id,
      warehouseCode: fallbackWarehouse.code,
      stockOnHand: (existing?.stockOnHand ?? 0) + remainder
    });
  }

  return Array.from(balanceByWarehouseId.values());
}

export async function runPremiumNegroAromaBackfill(argv = process.argv.slice(2), env: BackfillEnv = process.env) {
  const args = parseBackfillPremiumNegroArgs(argv);
  assertCanApplyPremiumNegroBackfill({ ...args, env });

  const prisma = new PrismaClient();

  try {
    const product = await prisma.product.findUnique({
      where: { slug: "premium-negro" },
      include: {
        variants: {
          orderBy: { sku: "asc" }
        }
      }
    });

    if (!product) {
      throw new Error("No existe product.slug=premium-negro.");
    }

    const missing = resolveMissingPremiumNegroAromaVariants(
      product.variants.map((variant) => variant.sku)
    );
    const activeWarehouses = await prisma.warehouse.findMany({
      where: { status: LifecycleStatus.active },
      select: { id: true, code: true, priority: true, createdAt: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
    });
    const warehouseByCode = new Map(activeWarehouses.map((warehouse) => [warehouse.code, warehouse]));
    const referenceVariant =
      product.variants.find((variant) => variant.sku === "HG-PN-001") ?? product.variants[0] ?? null;
    const fallbackWarehouseId = referenceVariant?.defaultWarehouseId ?? activeWarehouses[0]?.id ?? null;

    console.log(
      [
        `apply=${args.apply ? "true" : "false"}`,
        `product=${product.slug}`,
        `existing_skus=${product.variants.map((variant) => variant.sku).join(",") || "none"}`,
        `missing_skus=${missing.map((variant) => variant.sku).join(",") || "none"}`,
        `active_warehouses=${activeWarehouses.map((warehouse) => warehouse.code).join(",") || "none"}`
      ].join(" ")
    );

    if (missing.length === 0) {
      return { created: 0, missing: 0 };
    }

    if (!fallbackWarehouseId) {
      throw new Error("No hay almacén activo ni variante de referencia para asignar stock.");
    }

    for (const target of missing) {
      const balancePlan = buildPremiumNegroWarehouseBalancePlan({
        target,
        fallbackWarehouseId,
        warehouses: activeWarehouses
      });
      console.log(
        `plan sku=${target.sku} stock=${target.stockOnHand} balances=${balancePlan
          .map((balance) => `${balance.warehouseCode}:${balance.stockOnHand}`)
          .join(",")}`
      );
    }

    if (!args.apply) {
      console.log(`dry_run=true confirm_token=${CONFIRM_TOKEN}`);
      return { created: 0, missing: missing.length };
    }

    const created = await prisma.$transaction(async (tx) => {
      let createdCount = 0;

      for (const target of missing) {
        const defaultWarehouseId =
          warehouseByCode.get(target.warehouseBalances[0]?.warehouseCode ?? "")?.id ?? fallbackWarehouseId;
        const createdVariant = await tx.productVariant.create({
          data: {
            productId: product.id,
            defaultWarehouseId,
            sku: target.sku,
            name: target.name,
            flavorCode: target.flavorCode,
            flavorLabel: target.flavorLabel,
            presentationCode: target.presentationCode,
            presentationLabel: target.presentationLabel,
            price: target.price,
            compareAtPrice: target.compareAtPrice,
            stockOnHand: target.stockOnHand,
            lowStockThreshold: target.lowStockThreshold,
            status: "active"
          }
        });

        const balancePlan = buildPremiumNegroWarehouseBalancePlan({
          target,
          fallbackWarehouseId: defaultWarehouseId,
          warehouses: activeWarehouses
        });

        for (const balance of balancePlan) {
          await tx.warehouseInventoryBalance.create({
            data: {
              warehouseId: balance.warehouseId,
              variantId: createdVariant.id,
              stockOnHand: balance.stockOnHand,
              reservedQuantity: 0,
              committedQuantity: 0
            }
          });
        }

        createdCount += 1;
      }

      return createdCount;
    });

    console.log(`created_variants=${created}`);
    return { created, missing: missing.length };
  } finally {
    await prisma.$disconnect();
  }
}

if (shouldRunCli()) {
  runPremiumNegroAromaBackfill().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
