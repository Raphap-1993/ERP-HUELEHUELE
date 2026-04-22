import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assertSafeExecution() {
  if (process.env.NODE_ENV === "production" && process.env.HUELEGOOD_ALLOW_PRODUCTION_WAREHOUSE_BOOTSTRAP !== "1") {
    throw new Error(
      "scripts/backfill-warehouse-balances.ts no se ejecuta en producción sin HUELEGOOD_ALLOW_PRODUCTION_WAREHOUSE_BOOTSTRAP=1."
    );
  }
}

async function main() {
  assertSafeExecution();

  const bundleVariants = await prisma.productVariant.findMany({
    where: {
      product: {
        productKind: "bundle"
      }
    },
    select: {
      id: true
    }
  });
  const bundleVariantIds = bundleVariants.map((variant) => variant.id);
  const deletedBundleBalances =
    bundleVariantIds.length > 0
      ? await prisma.warehouseInventoryBalance.deleteMany({
          where: {
            variantId: {
              in: bundleVariantIds
            }
          }
        })
      : { count: 0 };
  const normalizedBundleVariants =
    bundleVariantIds.length > 0
      ? await prisma.productVariant.updateMany({
          where: {
            id: {
              in: bundleVariantIds
            },
            OR: [
              { stockOnHand: { not: 0 } },
              { defaultWarehouseId: { not: null } }
            ]
          },
          data: {
            stockOnHand: 0,
            defaultWarehouseId: null
          }
        })
      : { count: 0 };

  const activeWarehouses = await prisma.warehouse.findMany({
    where: {
      status: "active"
    },
    select: {
      id: true
    },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }]
  });

  const variants = await prisma.productVariant.findMany({
    where: {
      product: {
        productKind: "single"
      },
      defaultWarehouseId: {
        not: null
      }
    },
    include: {
      warehouseBalances: true
    },
    orderBy: [{ sku: "asc" }]
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const variant of variants) {
    const defaultWarehouseId = variant.defaultWarehouseId;
    if (!defaultWarehouseId) {
      skipped += 1;
      continue;
    }

    if (variant.warehouseBalances.length === 0) {
      await prisma.warehouseInventoryBalance.create({
        data: {
          warehouseId: defaultWarehouseId,
          variantId: variant.id,
          stockOnHand: variant.stockOnHand,
          reservedQuantity: 0,
          committedQuantity: 0
        }
      });
      created += 1;
    } else if (
      variant.warehouseBalances.length === 1 &&
      variant.warehouseBalances[0]?.warehouseId === defaultWarehouseId &&
      variant.warehouseBalances[0].stockOnHand !== variant.stockOnHand
    ) {
      await prisma.warehouseInventoryBalance.update({
        where: {
          warehouseId_variantId: {
            warehouseId: defaultWarehouseId,
            variantId: variant.id
          }
        },
        data: {
          stockOnHand: variant.stockOnHand
        }
      });
      updated += 1;
    } else {
      skipped += 1;
    }

    const existingWarehouseIds = new Set(
      [...variant.warehouseBalances.map((balance) => balance.warehouseId), defaultWarehouseId].filter(Boolean)
    );

    for (const warehouse of activeWarehouses) {
      if (existingWarehouseIds.has(warehouse.id)) {
        continue;
      }

      await prisma.warehouseInventoryBalance.create({
        data: {
          warehouseId: warehouse.id,
          variantId: variant.id,
          stockOnHand: 0,
          reservedQuantity: 0,
          committedQuantity: 0
        }
      });
      existingWarehouseIds.add(warehouse.id);
      created += 1;
    }
  }

  console.log(
    [
      `variants_total=${variants.length}`,
      `balances_created=${created}`,
      `balances_updated=${updated}`,
      `balances_skipped=${skipped}`,
      `active_warehouses=${activeWarehouses.length}`,
      `bundle_variants_normalized=${normalizedBundleVariants.count}`,
      `bundle_balances_deleted=${deletedBundleBalances.count}`
    ].join(" ")
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
