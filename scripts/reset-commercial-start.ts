import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const CONFIRM_TOKEN = "RESET_COMMERCIAL_START";
const PRESERVE_PAYMENT_REVIEW_FLAG = "--preserve-payment-review";

const TABLES_TO_CLEAR = [
  "cart_items",
  "carts",
  "payment_evidences",
  "manual_payment_requests",
  "payment_transactions",
  "payments",
  "order_fulfillment_assignments",
  "order_status_history",
  "order_addresses",
  "order_items",
  "payout_items",
  "commissions",
  "commission_attributions",
  "commission_payouts",
  "orders",
  "loyalty_movements",
  "redemptions",
  "notification_logs",
  "notifications"
] as const;

const TABLES_TO_COUNT = [
  ...TABLES_TO_CLEAR,
  "customers",
  "customer_addresses",
  "products",
  "product_variants",
  "warehouses",
  "warehouse_inventory_balances",
  "inventory_movements"
] as const;

type SnapshotRecord = Record<string, unknown>;

function isRecord(value: unknown): value is SnapshotRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasArg(name: string) {
  return process.argv.includes(name);
}

function argValue(name: string) {
  const prefix = `${name}=`;
  const inline = process.argv.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = process.argv.indexOf(name);
  if (index >= 0) {
    return process.argv[index + 1];
  }

  return undefined;
}

function assertExecutionAllowed(apply: boolean) {
  const isProduction = process.env.NODE_ENV === "production";
  const confirm = argValue("--confirm");

  if (apply && confirm !== CONFIRM_TOKEN) {
    throw new Error(`Para aplicar el reset debes pasar --confirm ${CONFIRM_TOKEN}.`);
  }

  if (apply && isProduction && process.env.HUELEGOOD_ALLOW_COMMERCIAL_RESET !== "1") {
    throw new Error(
      "Reset comercial bloqueado en producción. Define HUELEGOOD_ALLOW_COMMERCIAL_RESET=1 sólo durante la ventana aprobada."
    );
  }
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function stringField(value: unknown, field: string) {
  if (!isRecord(value)) {
    return undefined;
  }

  const fieldValue = value[field];
  return typeof fieldValue === "string" ? fieldValue : undefined;
}

function nestedStringField(value: unknown, fields: string[]) {
  let current = value;
  for (const field of fields) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[field];
  }

  return typeof current === "string" ? current : undefined;
}

function numberField(value: unknown, field: string) {
  if (!isRecord(value)) {
    return 0;
  }

  const fieldValue = value[field];
  const parsed = typeof fieldValue === "number" ? fieldValue : Number(fieldValue);
  return Number.isFinite(parsed) ? parsed : 0;
}

function objectSize(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).length : 0;
}

async function tableCount(table: string) {
  const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint | number | string }>>(`select count(*) as count from ${table}`);
  return Number(rows[0]?.count ?? 0);
}

async function collectTableCounts() {
  const entries: Array<[string, number]> = [];
  for (const table of TABLES_TO_COUNT) {
    entries.push([table, await tableCount(table)]);
  }

  return Object.fromEntries(entries);
}

async function loadSnapshot(moduleName: string) {
  const snapshot = await prisma.moduleSnapshot.findUnique({
    where: {
      moduleName
    }
  });

  return (snapshot?.snapshot ?? {}) as SnapshotRecord;
}

function snapshotSummary(moduleName: string, snapshot: SnapshotRecord) {
  if (moduleName === "orders") {
    return {
      orders: asArray(snapshot.orders).length,
      idempotencyKeys: objectSize(snapshot.idempotencyIndex)
    };
  }

  if (moduleName === "inventory") {
    return {
      reservations: objectSize(snapshot.reservations),
      ledger: asArray(snapshot.ledger).length,
      variants: objectSize(snapshot.variants),
      warehouseBalances: objectSize(snapshot.warehouseBalances)
    };
  }

  if (moduleName === "commissions") {
    return {
      rules: asArray(snapshot.rules).length,
      commissions: asArray(snapshot.commissions).length,
      payouts: asArray(snapshot.payouts).length
    };
  }

  if (moduleName === "loyalty") {
    return {
      accounts: asArray(snapshot.accounts).length,
      movements: asArray(snapshot.movements).length,
      redemptions: asArray(snapshot.redemptions).length,
      rules: asArray(snapshot.rules).length
    };
  }

  if (moduleName === "notifications") {
    return {
      notifications: asArray(snapshot.notifications).length,
      logs: asArray(snapshot.logs).length
    };
  }

  if (moduleName === "vendors") {
    return {
      vendors: asArray(snapshot.vendors).length,
      applications: asArray(snapshot.applications).length
    };
  }

  return {};
}

async function collectSnapshotSummaries() {
  const modules = ["orders", "inventory", "commissions", "loyalty", "notifications", "vendors"];
  const entries: Array<[string, ReturnType<typeof snapshotSummary>]> = [];

  for (const moduleName of modules) {
    entries.push([moduleName, snapshotSummary(moduleName, await loadSnapshot(moduleName))]);
  }

  return Object.fromEntries(entries);
}

function shouldZeroStock() {
  return hasArg("--zero-stock");
}

function shouldPreservePaymentReview() {
  return hasArg(PRESERVE_PAYMENT_REVIEW_FLAG);
}

function isPaymentReviewOrder(order: unknown) {
  return (
    stringField(order, "orderStatus") === "payment_under_review" ||
    stringField(order, "status") === "payment_under_review" ||
    stringField(order, "manualStatus") === "under_review" ||
    nestedStringField(order, ["manualRequest", "status"]) === "under_review" ||
    nestedStringField(order, ["payment", "manualStatus"]) === "under_review"
  );
}

function orderNumberOf(value: unknown) {
  return stringField(value, "orderNumber");
}

function filterIdempotencyIndex(value: unknown, preservedOrderNumbers: Set<string>) {
  const index = isRecord(value) ? value : {};
  const entries = Object.entries(index).filter(([, record]) => {
    const orderNumber = orderNumberOf(record);
    return orderNumber ? preservedOrderNumbers.has(orderNumber) : false;
  });

  return Object.fromEntries(entries);
}

function filterReservations(value: unknown, preservedOrderNumbers: Set<string>) {
  const reservations = isRecord(value) ? value : {};
  const entries = Object.entries(reservations).filter(([key, reservation]) => {
    const orderNumber = orderNumberOf(reservation) ?? key;
    return preservedOrderNumbers.has(orderNumber);
  });

  return Object.fromEntries(entries);
}

function filterLedger(value: unknown, preservedOrderNumbers: Set<string>) {
  return asArray(value).filter((entry) => {
    const orderNumber = orderNumberOf(entry);
    return orderNumber ? preservedOrderNumbers.has(orderNumber) : false;
  });
}

function collectPaymentReviewOrders(snapshot: SnapshotRecord) {
  return asArray(snapshot.orders).filter(isPaymentReviewOrder);
}

async function upsertSnapshot(tx: Prisma.TransactionClient, moduleName: string, snapshot: Prisma.InputJsonValue) {
  await tx.moduleSnapshot.upsert({
    where: {
      moduleName
    },
    create: {
      moduleName,
      snapshot,
      version: 1
    },
    update: {
      snapshot,
      version: 1
    }
  });
}

function applyPreservedReservationsToInventorySnapshot(
  variantSnapshot: Record<string, SnapshotRecord>,
  balanceSnapshot: Record<string, SnapshotRecord>,
  reservations: SnapshotRecord,
  now: string
) {
  for (const reservation of Object.values(reservations)) {
    for (const line of asArray(isRecord(reservation) ? reservation.lines : undefined)) {
      const variantId = stringField(line, "variantId");
      const warehouseId = stringField(line, "warehouseId");
      const quantity = numberField(line, "quantity");

      if (!variantId || quantity <= 0) {
        continue;
      }

      const variant = variantSnapshot[variantId];
      if (variant) {
        variant.reservedQuantity = numberField(variant, "reservedQuantity") + quantity;
        variant.updatedAt = now;
      }

      if (!warehouseId) {
        continue;
      }

      const key = `${warehouseId}:${variantId}`;
      const balance = balanceSnapshot[key];
      if (balance) {
        balance.reservedQuantity = numberField(balance, "reservedQuantity") + quantity;
        balance.updatedAt = now;
      }
    }
  }
}

async function buildInventorySnapshot(
  tx: Prisma.TransactionClient,
  now: string,
  zeroStock: boolean,
  preservedInventory: { reservations: SnapshotRecord; ledger: unknown[] } = { reservations: {}, ledger: [] }
) {
  const variants = await tx.productVariant.findMany({
    include: {
      product: {
        select: {
          slug: true
        }
      },
      warehouseBalances: true
    },
    orderBy: [{ sku: "asc" }]
  });

  const variantSnapshot: Record<string, unknown> = {};
  const balanceSnapshot: Record<string, unknown> = {};

  for (const variant of variants) {
    const balanceStock = variant.warehouseBalances.reduce((sum, balance) => sum + balance.stockOnHand, 0);
    const baseStockOnHand = zeroStock ? 0 : variant.warehouseBalances.length ? balanceStock : variant.stockOnHand;

    variantSnapshot[variant.id] = {
      variantId: variant.id,
      sku: variant.sku,
      name: variant.name,
      productSlug: variant.product.slug,
      baseStockOnHand,
      reservedQuantity: 0,
      committedQuantity: 0,
      updatedAt: now
    };

    for (const balance of variant.warehouseBalances) {
      const key = `${balance.warehouseId}:${balance.variantId}`;
      balanceSnapshot[key] = {
        warehouseId: balance.warehouseId,
        variantId: balance.variantId,
        stockOnHand: zeroStock ? 0 : balance.stockOnHand,
        reservedQuantity: 0,
        committedQuantity: 0,
        updatedAt: now
      };
    }
  }

  applyPreservedReservationsToInventorySnapshot(
    variantSnapshot as Record<string, SnapshotRecord>,
    balanceSnapshot as Record<string, SnapshotRecord>,
    preservedInventory.reservations,
    now
  );

  return {
    variants: variantSnapshot,
    warehouseBalances: balanceSnapshot,
    reservations: preservedInventory.reservations,
    ledger: preservedInventory.ledger
  };
}

async function collectPreservationSummary(preservePaymentReview: boolean) {
  if (!preservePaymentReview) {
    return undefined;
  }

  const ordersSnapshot = await loadSnapshot("orders");
  const preservedOrders = collectPaymentReviewOrders(ordersSnapshot);

  return {
    paymentReviewOrders: preservedOrders.length,
    orderNumbers: preservedOrders.map(orderNumberOf).filter(Boolean)
  };
}

async function applyReset() {
  const now = new Date().toISOString();
  const zeroStock = shouldZeroStock();
  const preservePaymentReview = shouldPreservePaymentReview();

  await prisma.$transaction(async (tx) => {
    const ordersSnapshot = ((await tx.moduleSnapshot.findUnique({ where: { moduleName: "orders" } }))?.snapshot ?? {}) as SnapshotRecord;
    const inventorySnapshot = ((await tx.moduleSnapshot.findUnique({ where: { moduleName: "inventory" } }))?.snapshot ?? {}) as SnapshotRecord;
    const commissionsSnapshot = ((await tx.moduleSnapshot.findUnique({ where: { moduleName: "commissions" } }))?.snapshot ?? {}) as SnapshotRecord;
    const loyaltySnapshot = ((await tx.moduleSnapshot.findUnique({ where: { moduleName: "loyalty" } }))?.snapshot ?? {}) as SnapshotRecord;
    const vendorsSnapshot = ((await tx.moduleSnapshot.findUnique({ where: { moduleName: "vendors" } }))?.snapshot ?? {}) as SnapshotRecord;
    const preservedOrders = preservePaymentReview ? collectPaymentReviewOrders(ordersSnapshot) : [];
    const preservedOrderNumbers = new Set(preservedOrders.map(orderNumberOf).filter(Boolean));
    const preservedInventory = preservePaymentReview
      ? {
          reservations: filterReservations(inventorySnapshot.reservations, preservedOrderNumbers),
          ledger: filterLedger(inventorySnapshot.ledger, preservedOrderNumbers)
        }
      : {
          reservations: {},
          ledger: []
        };

    for (const table of TABLES_TO_CLEAR) {
      await tx.$executeRawUnsafe(`delete from ${table}`);
    }

    await tx.coupon.updateMany({
      data: {
        usageCount: 0
      }
    });
    await tx.loyaltyAccount.updateMany({
      data: {
        availablePoints: 0,
        pendingPoints: 0,
        redeemedPoints: 0
      }
    });
    await tx.warehouseInventoryBalance.updateMany({
      data: {
        stockOnHand: zeroStock ? 0 : undefined,
        reservedQuantity: 0,
        committedQuantity: 0
      }
    });

    if (zeroStock) {
      await tx.inventoryMovement.deleteMany();
      await tx.productVariant.updateMany({
        data: {
          stockOnHand: 0
        }
      });
    } else {
      const balances = await tx.warehouseInventoryBalance.findMany({
        select: {
          variantId: true,
          stockOnHand: true
        }
      });
      const stockByVariant = new Map<string, number>();

      for (const balance of balances) {
        stockByVariant.set(balance.variantId, (stockByVariant.get(balance.variantId) ?? 0) + balance.stockOnHand);
      }

      for (const [variantId, stockOnHand] of stockByVariant.entries()) {
        await tx.productVariant.update({
          where: {
            id: variantId
          },
          data: {
            stockOnHand
          }
        });
      }
    }

    await upsertSnapshot(tx, "orders", {
      orders: preservedOrders,
      idempotencyIndex: preservePaymentReview ? filterIdempotencyIndex(ordersSnapshot.idempotencyIndex, preservedOrderNumbers) : {}
    } as Prisma.InputJsonValue);
    await upsertSnapshot(tx, "inventory", (await buildInventorySnapshot(tx, now, zeroStock, preservedInventory)) as Prisma.InputJsonValue);
    await upsertSnapshot(tx, "commissions", {
      rules: asArray(commissionsSnapshot.rules),
      commissions: [],
      payouts: []
    });
    await upsertSnapshot(tx, "loyalty", {
      accounts: asArray(loyaltySnapshot.accounts).map((account) => ({
        ...(account as Record<string, unknown>),
        availablePoints: 0,
        pendingPoints: 0,
        redeemedPoints: 0,
        recentMovement: "pending",
        redemptionStatus: "pending",
        updatedAt: now
      })),
      movements: [],
      redemptions: [],
      rules: asArray(loyaltySnapshot.rules)
    });
    await upsertSnapshot(tx, "notifications", {
      notifications: [],
      logs: []
    });
    await upsertSnapshot(tx, "vendors", {
      ...vendorsSnapshot,
      vendors: asArray(vendorsSnapshot.vendors).map((vendor) => ({
        ...(vendor as Record<string, unknown>),
        sales: 0,
        commissions: 0,
        pendingCommissions: 0,
        paidCommissions: 0,
        ordersCount: 0,
        updatedAt: now
      }))
    });
  });
}

async function main() {
  const apply = hasArg("--apply");
  const zeroStock = shouldZeroStock();
  const preservePaymentReview = shouldPreservePaymentReview();
  assertExecutionAllowed(apply);

  const before = {
    tables: await collectTableCounts(),
    snapshots: await collectSnapshotSummaries(),
    preservation: await collectPreservationSummary(preservePaymentReview)
  };

  if (!apply) {
    console.log(JSON.stringify({ mode: "dry-run", zeroStock, preservePaymentReview, before }, null, 2));
    console.log(`Dry-run listo. Para aplicar preservando stock: tsx scripts/reset-commercial-start.ts --apply --confirm ${CONFIRM_TOKEN}`);
    console.log(`Para aplicar dejando stock físico en cero: tsx scripts/reset-commercial-start.ts --apply --zero-stock --confirm ${CONFIRM_TOKEN}`);
    console.log(`Para aplicar dejando stock físico en cero y conservar pagos en revisión: tsx scripts/reset-commercial-start.ts --apply --zero-stock ${PRESERVE_PAYMENT_REVIEW_FLAG} --confirm ${CONFIRM_TOKEN}`);
    return;
  }

  await applyReset();

  const after = {
    tables: await collectTableCounts(),
    snapshots: await collectSnapshotSummaries(),
    preservation: await collectPreservationSummary(preservePaymentReview)
  };

  console.log(JSON.stringify({ mode: "apply", zeroStock, preservePaymentReview, before, after }, null, 2));
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
