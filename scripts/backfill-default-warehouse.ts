import "dotenv/config";
import { LifecycleStatus, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function assertSafeExecution() {
  if (process.env.NODE_ENV === "production" && process.env.HUELEGOOD_ALLOW_PRODUCTION_WAREHOUSE_BOOTSTRAP !== "1") {
    throw new Error(
      "scripts/backfill-default-warehouse.ts no se ejecuta en producción sin HUELEGOOD_ALLOW_PRODUCTION_WAREHOUSE_BOOTSTRAP=1."
    );
  }
}

async function ensureDefaultWarehouse() {
  const existing = await prisma.warehouse.findUnique({
    where: { code: "WH-DEFAULT" }
  });

  if (existing) {
    return { warehouse: existing, created: false };
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      code: "WH-DEFAULT",
      name: "Almacén principal",
      status: LifecycleStatus.active,
      priority: 0,
      countryCode: "PE",
      addressLine1: "Pendiente de configurar",
      reference: "Editable desde admin",
      departmentCode: "15",
      departmentName: "Lima",
      provinceCode: "1501",
      provinceName: "Lima",
      districtCode: "150101",
      districtName: "Lima"
    }
  });

  return { warehouse, created: true };
}

async function main() {
  assertSafeExecution();

  const { warehouse, created } = await ensureDefaultWarehouse();
  const bundleVariants = await prisma.productVariant.findMany({
    where: {
      product: {
        productKind: "bundle"
      }
    },
    select: {
      id: true,
      sku: true
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

  const variantsWithoutWarehouse = await prisma.productVariant.findMany({
    where: {
      defaultWarehouseId: null,
      product: {
        productKind: "single"
      }
    },
    select: {
      id: true,
      sku: true
    }
  });

  if (variantsWithoutWarehouse.length > 0) {
    await prisma.productVariant.updateMany({
      where: {
        id: {
          in: variantsWithoutWarehouse.map((variant) => variant.id)
        },
        defaultWarehouseId: null,
        product: {
          productKind: "single"
        }
      },
      data: {
        defaultWarehouseId: warehouse.id
      }
    });
  }

  const totalAssignedToDefault = await prisma.productVariant.count({
    where: {
      defaultWarehouseId: warehouse.id,
      product: {
        productKind: "single"
      }
    }
  });

  console.log(
    [
      `warehouse=${warehouse.code}`,
      `warehouse_created=${created ? "yes" : "no"}`,
      `variants_backfilled=${variantsWithoutWarehouse.length}`,
      `variants_default_total=${totalAssignedToDefault}`,
      `bundle_variants_normalized=${normalizedBundleVariants.count}`,
      `bundle_balances_deleted=${deletedBundleBalances.count}`
    ].join(" ")
  );

  if (variantsWithoutWarehouse.length > 0) {
    console.log(`SKUs actualizados: ${variantsWithoutWarehouse.map((variant) => variant.sku).join(", ")}`);
  }
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
