import { randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InventoryMovementType, ProductKind, type ProductImage, type ProductVariant, type WarehouseInventoryBalance } from "@prisma/client";
import {
  ProductSalesChannel,
  type InventoryStockAdjustmentInput,
  type InventoryReportRow,
  type InventoryReportSummary,
  type OrderInventoryLifecycleState,
  type OrderItemSummary,
  OrderStatus,
  resolveOrderInventoryLifecycleState
} from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { ModuleStateService } from "../../persistence/module-state.service";
import { PrismaService } from "../../prisma/prisma.service";

type InventoryAction =
  | "reserve"
  | "confirm"
  | "release"
  | "reverse"
  | "transfer_reserve"
  | "transfer_release"
  | "transfer_dispatch"
  | "transfer_receive";

interface InventoryAllocationLine {
  variantId: string;
  warehouseId?: string;
  sku: string;
  name: string;
  quantity: number;
  sourceSlug: string;
  sourceName: string;
  sourceVariantId?: string;
}

interface InventoryWarehouseBalanceState {
  warehouseId: string;
  variantId: string;
  stockOnHand: number;
  reservedQuantity: number;
  committedQuantity: number;
  updatedAt: string;
}

function sortInventoryProductImages(images?: ProductImage[]) {
  return (images ?? []).slice().sort((left, right) => {
    if (left.isPrimary && !right.isPrimary) {
      return -1;
    }

    if (!left.isPrimary && right.isPrimary) {
      return 1;
    }

    if (left.sortOrder !== right.sortOrder) {
      return left.sortOrder - right.sortOrder;
    }

    return left.createdAt.getTime() - right.createdAt.getTime();
  });
}

interface InventoryVariantState {
  variantId: string;
  sku: string;
  name: string;
  productSlug: string;
  baseStockOnHand: number;
  reservedQuantity: number;
  committedQuantity: number;
  updatedAt: string;
}

interface InventoryReservationRecord {
  orderNumber: string;
  state: OrderInventoryLifecycleState;
  lines: InventoryAllocationLine[];
  createdAt: string;
  updatedAt: string;
}

interface InventoryLedgerEntry {
  id: string;
  orderNumber: string;
  variantId: string;
  warehouseId?: string;
  sku: string;
  name: string;
  quantity: number;
  action: InventoryAction;
  balanceReserved: number;
  balanceCommitted: number;
  occurredAt: string;
  note?: string;
}

interface InventorySnapshot {
  variants: Record<string, InventoryVariantState>;
  warehouseBalances?: Record<string, InventoryWarehouseBalanceState>;
  reservations: Record<string, InventoryReservationRecord>;
  ledger: InventoryLedgerEntry[];
}

interface WarehouseFulfillmentMissingLine {
  warehouseId: string;
  variantId: string;
  sku: string;
  name: string;
  requestedQuantity: number;
  availableQuantity: number;
}

interface WarehouseFulfillmentAssessment {
  warehouseId: string;
  availableForAllLines: boolean;
  missingLines: WarehouseFulfillmentMissingLine[];
}

interface InventorySyncInput {
  orderNumber: string;
  orderStatus: OrderStatus;
  items: OrderItemSummary[];
  fulfillmentWarehouseId?: string;
  createdAt?: string;
  occurredAt?: string;
  note?: string;
}

interface WarehouseInventoryMutationLineInput {
  variantId: string;
  warehouseId: string;
  quantity: number;
}

interface ResolvedWarehouseInventoryMutationLine extends WarehouseInventoryMutationLineInput {
  sku: string;
  name: string;
}

function normalizeText(value?: string | null) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeVariantId(value?: string) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

function normalizeWarehouseId(value?: string | null) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

function warehouseBalanceKey(warehouseId: string, variantId: string) {
  return `${warehouseId}:${variantId}`;
}

function pickDefaultVariant(variants: ProductVariant[]) {
  return variants
    .slice()
    .sort((left, right) => {
      if (left.status === "active" && right.status !== "active") {
        return -1;
      }

      if (left.status !== "active" && right.status === "active") {
        return 1;
      }

      return left.createdAt.getTime() - right.createdAt.getTime();
    })[0];
}

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly variants = new Map<string, InventoryVariantState>();

  private readonly warehouseBalances = new Map<string, InventoryWarehouseBalanceState>();

  private readonly reservations = new Map<string, InventoryReservationRecord>();

  private readonly ledger: InventoryLedgerEntry[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly moduleStateService: ModuleStateService
  ) {}

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<InventorySnapshot>("inventory");
    if (snapshot) {
      this.restoreSnapshot(snapshot);
      return;
    }

    await this.persistState();
  }

  async hydrateOrderItems(items: OrderItemSummary[]) {
    const hydrated: OrderItemSummary[] = [];

    for (const item of items) {
      if (item.variantId && item.inventoryAllocations?.length) {
        hydrated.push({
          ...item,
          variantId: item.variantId.trim(),
          inventoryAllocations: item.inventoryAllocations.map((allocation) => ({
            ...allocation,
            variantId: allocation.variantId.trim(),
            sku: allocation.sku.trim(),
            name: allocation.name.trim(),
            quantity: allocation.quantity
          }))
        });
        continue;
      }

      const resolved = await this.resolveItemReference(item);
      hydrated.push({
        ...item,
        variantId: resolved.variant.id,
        sku: normalizeText(item.sku) ?? resolved.variant.sku,
        inventoryAllocations: resolved.allocations
      });
    }

    return hydrated;
  }

  async syncOrder(
    input: InventorySyncInput,
    options: {
      skipAvailabilityCheck?: boolean;
      persist?: boolean;
      overrideWarehouseId?: string;
      allowWarehouseReallocation?: boolean;
    } = {}
  ) {
    const orderState = resolveOrderInventoryLifecycleState(input.orderStatus);
    if (!orderState) {
      return;
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const items = await this.hydrateOrderItems(input.items);
    const overrideWarehouseId = normalizeWarehouseId(options.overrideWarehouseId ?? input.fulfillmentWarehouseId);
    const lines = this.flattenAllocations(items, input.orderNumber, overrideWarehouseId);
    const existing = this.reservations.get(input.orderNumber);

    if (!existing) {
      if (orderState === "released") {
        return;
      }

      if (orderState === "reserved") {
        await this.reserveLines(input.orderNumber, lines, occurredAt, input.note, options.skipAvailabilityCheck);
        if (options.persist !== false) {
          await this.persistState();
        }
        return;
      }

      await this.reserveLines(input.orderNumber, lines, occurredAt, input.note, options.skipAvailabilityCheck);
      await this.confirmLines(input.orderNumber, lines, occurredAt, input.note);
      if (options.persist !== false) {
        await this.persistState();
      }
      return;
    }

    const sameLines = this.haveEquivalentLines(existing.lines, lines);

    if (!sameLines) {
      if (!options.allowWarehouseReallocation || !this.haveEquivalentVariantQuantities(existing.lines, lines)) {
        throw new ConflictException(
          `El pedido ${input.orderNumber} cambió sus líneas de inventario y no puede sincronizarse de forma segura.`
        );
      }

      await this.reallocateLines(input.orderNumber, existing, lines, occurredAt, input.note, options.skipAvailabilityCheck);
      if (options.persist !== false) {
        await this.persistState();
      }
      return;
    }

    if (existing.state === orderState) {
      return;
    }

    if (existing.state === "reserved" && orderState === "confirmed") {
      await this.confirmLines(input.orderNumber, existing.lines, occurredAt, input.note);
      if (options.persist !== false) {
        await this.persistState();
      }
      return;
    }

    if (existing.state === "reserved" && orderState === "released") {
      await this.releaseLines(input.orderNumber, existing.lines, occurredAt, input.note);
      if (options.persist !== false) {
        await this.persistState();
      }
      return;
    }

    if (existing.state === "confirmed" && orderState === "released") {
      await this.reverseLines(input.orderNumber, existing.lines, occurredAt, input.note);
      if (options.persist !== false) {
        await this.persistState();
      }
      return;
    }

    if (existing.state === "confirmed" && orderState === "reserved") {
      throw new ConflictException(`El pedido ${input.orderNumber} ya consolidó inventario y no puede volver a reservado.`);
    }

    if (existing.state === "released" && orderState !== "released") {
      throw new ConflictException(`El pedido ${input.orderNumber} ya liberó inventario y no puede volver atrás.`);
    }

    if (options.persist !== false) {
      await this.persistState();
    }
  }

  async rebuildFromOrders(orders: InventorySyncInput[]) {
    this.variants.clear();
    this.warehouseBalances.clear();
    this.reservations.clear();
    this.ledger.splice(0, this.ledger.length);

    await this.seedRebuildBaselineFromPersistedInventory();

    const ordered = [...orders].sort((left, right) => {
      const leftAt = new Date(left.createdAt ?? left.occurredAt ?? 0).getTime();
      const rightAt = new Date(right.createdAt ?? right.occurredAt ?? 0).getTime();
      return leftAt - rightAt;
    });

    for (const order of ordered) {
      await this.syncOrder(order, { skipAvailabilityCheck: true, persist: false });
    }

    await this.persistAllWarehouseBalances();
    await this.persistState();
  }

  async getAdminReport() {
    const variants = await this.prisma.productVariant.findMany({
      where: {
        product: {
          productKind: ProductKind.single
        }
      },
      include: {
        warehouseBalances: true,
        defaultWarehouse: true,
        product: {
          include: {
            category: true,
            images: true
          }
        }
      },
      orderBy: [{ updatedAt: "desc" }]
    });

    const confirmedByVariant = new Map<string, number>();
    const confirmedByWarehouse = new Map<string, number>();
    for (const entry of this.ledger) {
      if (entry.action !== "confirm") {
        continue;
      }

      confirmedByVariant.set(entry.variantId, (confirmedByVariant.get(entry.variantId) ?? 0) + entry.quantity);
      const warehouseId = normalizeWarehouseId(entry.warehouseId);
      if (warehouseId) {
        confirmedByWarehouse.set(
          warehouseBalanceKey(warehouseId, entry.variantId),
          (confirmedByWarehouse.get(warehouseBalanceKey(warehouseId, entry.variantId)) ?? 0) + entry.quantity
        );
      }
    }

    const warehouseIds = [...new Set(
      variants.flatMap((variant) => [
        ...(variant.defaultWarehouseId ? [variant.defaultWarehouseId] : []),
        ...variant.warehouseBalances.map((balance) => balance.warehouseId)
      ])
    )];
    const warehouses = warehouseIds.length
      ? await this.prisma.warehouse.findMany({
          where: {
            id: {
              in: warehouseIds
            }
          },
          select: {
            id: true,
            code: true,
            name: true
          }
        })
      : [];
    const warehouseMetadata = new Map(warehouses.map((warehouse) => [warehouse.id, warehouse] as const));

    const rows: InventoryReportRow[] = [];
    for (const variant of variants) {
      this.syncVariantMetadata(variant);
      this.ensurePersistedBalancesForVariant(variant);
      this.reconcileDefaultBalanceWithVariantStock(variant);
      const aggregate = this.refreshAggregateVariantState(variant.id);
      const reportingGroup = variant.product.reportingGroup?.trim() || variant.product.name;
      const salesChannel =
        variant.product.salesChannel === ProductSalesChannel.Internal
          ? ProductSalesChannel.Internal
          : ProductSalesChannel.Public;
      const primaryImage = sortInventoryProductImages(variant.product.images)[0];
      const lowStockThreshold = Math.max(0, variant.lowStockThreshold ?? 100);
      const variantAvailableStock = aggregate.baseStockOnHand - aggregate.reservedQuantity - aggregate.committedQuantity;
      const variantBalances = this.getBalancesForVariant(variant.id).sort((left, right) => {
        if (left.warehouseId === normalizeWarehouseId(variant.defaultWarehouseId)) {
          return -1;
        }

        if (right.warehouseId === normalizeWarehouseId(variant.defaultWarehouseId)) {
          return 1;
        }

        return left.warehouseId.localeCompare(right.warehouseId);
      });
      const warehouseBalances = (variantBalances.length > 0
        ? variantBalances.map((balance) => ({
            warehouseId: balance.warehouseId,
            variantId: balance.variantId,
            stockOnHand: balance.stockOnHand,
            reservedQuantity: balance.reservedQuantity,
            committedQuantity: balance.committedQuantity,
            availableStock: this.availableBalanceQuantity(balance),
            updatedAt: balance.updatedAt
          }))
        : [
            {
              warehouseId: "unassigned",
              variantId: variant.id,
              stockOnHand: aggregate.baseStockOnHand,
              reservedQuantity: aggregate.reservedQuantity,
              committedQuantity: aggregate.committedQuantity,
              availableStock: variantAvailableStock,
              updatedAt: aggregate.updatedAt
            }
          ]);

      for (const balance of warehouseBalances) {
        const warehouse = warehouseMetadata.get(balance.warehouseId);
        rows.push({
          reportingGroup,
          productId: variant.productId,
          productName: variant.product.name,
          productSlug: variant.product.slug,
          productImageUrl: primaryImage?.url,
          productImageAlt: primaryImage?.altText ?? `${variant.product.name} - imagen del producto`,
          salesChannel,
          variantId: variant.id,
          variantName: variant.name,
          sku: variant.sku,
          warehouseId: balance.warehouseId,
          warehouseCode: warehouse?.code,
          warehouseName: warehouse?.name,
          isDefaultWarehouse: normalizeWarehouseId(variant.defaultWarehouseId) === balance.warehouseId,
          unitsSold: confirmedByWarehouse.get(warehouseBalanceKey(balance.warehouseId, variant.id)) ?? 0,
          stockOnHand: balance.stockOnHand,
          reservedQuantity: balance.reservedQuantity,
          committedQuantity: balance.committedQuantity,
          availableStock: balance.availableStock,
          variantUnitsSold: confirmedByVariant.get(variant.id) ?? 0,
          variantStockOnHand: aggregate.baseStockOnHand,
          variantReservedQuantity: aggregate.reservedQuantity,
          variantCommittedQuantity: aggregate.committedQuantity,
          variantAvailableStock,
          lowStockThreshold,
          lowStock: balance.availableStock <= lowStockThreshold,
          defaultWarehouseId: variant.defaultWarehouseId ?? undefined,
          defaultWarehouseCode: variant.defaultWarehouse?.code ?? undefined,
          defaultWarehouseName: variant.defaultWarehouse?.name ?? undefined,
          warehouseBalances
        });
      }
    }

    rows.sort((left, right) => {
      const leftNegative = left.availableStock < 0;
      const rightNegative = right.availableStock < 0;
      if (leftNegative !== rightNegative) {
        return leftNegative ? -1 : 1;
      }

      if (left.lowStock !== right.lowStock) {
        return left.lowStock ? -1 : 1;
      }

      if (left.reportingGroup !== right.reportingGroup) {
        return left.reportingGroup.localeCompare(right.reportingGroup);
      }

      if (left.variantId !== right.variantId) {
        return left.variantId.localeCompare(right.variantId);
      }

      if (left.isDefaultWarehouse !== right.isDefaultWarehouse) {
        return left.isDefaultWarehouse ? -1 : 1;
      }

      return (left.warehouseName ?? left.warehouseCode ?? left.warehouseId).localeCompare(
        right.warehouseName ?? right.warehouseCode ?? right.warehouseId
      );
    });

    const data: InventoryReportSummary = {
      rows,
      generatedAt: new Date().toISOString()
    };
    const lowStockVariants = new Set(rows.filter((row) => row.lowStock).map((row) => row.variantId));
    const variantIds = new Set(rows.map((row) => row.variantId));

    return wrapResponse<InventoryReportSummary>(data, {
      total: rows.length,
      variants: variantIds.size,
      lowStock: lowStockVariants.size,
      internal: rows.filter((row) => row.salesChannel === ProductSalesChannel.Internal).length,
      public: rows.filter((row) => row.salesChannel === ProductSalesChannel.Public).length
    });
  }

  async adjustWarehouseStock(input: InventoryStockAdjustmentInput) {
    const variantId = normalizeVariantId(input.variantId);
    const warehouseId = normalizeWarehouseId(input.warehouseId);
    const nextStockOnHand = Math.trunc(Number(input.stockOnHand));
    const reason = normalizeText(input.reason);

    if (!variantId) {
      throw new BadRequestException("La variante es obligatoria para ajustar stock.");
    }

    if (!warehouseId) {
      throw new BadRequestException("El almacén es obligatorio para ajustar stock.");
    }

    if (!Number.isFinite(nextStockOnHand) || nextStockOnHand < 0) {
      throw new BadRequestException("El stock físico debe ser un número entero mayor o igual a cero.");
    }

    if (!reason) {
      throw new BadRequestException("Indica el motivo del ajuste de stock.");
    }

    const adjustmentId = randomUUID();
    const result = await this.prisma.$transaction(async (tx) => {
      const [variant, warehouse, existingBalance] = await Promise.all([
        tx.productVariant.findUnique({
          where: { id: variantId },
          include: {
            product: true,
            warehouseBalances: true
          }
        }),
        tx.warehouse.findUnique({
          where: { id: warehouseId },
          select: {
            id: true,
            code: true,
            name: true,
            status: true
          }
        }),
        tx.warehouseInventoryBalance.findUnique({
          where: {
            warehouseId_variantId: {
              warehouseId,
              variantId
            }
          }
        })
      ]);

      if (!variant) {
        throw new NotFoundException(`No encontramos la variante ${variantId}.`);
      }

      if (variant.product.productKind === ProductKind.bundle) {
        throw new ConflictException("Los combos no tienen stock físico propio. Ajusta el stock de sus productos unitarios.");
      }

      if (!warehouse) {
        throw new NotFoundException(`No encontramos el almacén ${warehouseId}.`);
      }

      if (warehouse.status !== "active") {
        throw new ConflictException(`El almacén ${warehouse.name} no está activo para ajustar stock.`);
      }

      const previousStockOnHand =
        existingBalance?.stockOnHand ?? (normalizeWarehouseId(variant.defaultWarehouseId) === warehouseId ? variant.stockOnHand : 0);
      const reservedQuantity = existingBalance?.reservedQuantity ?? 0;
      const committedQuantity = existingBalance?.committedQuantity ?? 0;
      const delta = nextStockOnHand - previousStockOnHand;
      const balance = await tx.warehouseInventoryBalance.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId,
            variantId
          }
        },
        create: {
          warehouseId,
          variantId,
          stockOnHand: nextStockOnHand,
          reservedQuantity,
          committedQuantity
        },
        update: {
          stockOnHand: nextStockOnHand
        }
      });

      const balances = await tx.warehouseInventoryBalance.findMany({
        where: { variantId },
        select: {
          stockOnHand: true
        }
      });
      const aggregateStockOnHand = balances.reduce((total, item) => total + item.stockOnHand, 0);
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          stockOnHand: aggregateStockOnHand
        }
      });

      if (delta !== 0) {
        await tx.inventoryMovement.create({
          data: {
            variantId,
            warehouseId,
            type: InventoryMovementType.adjustment,
            quantity: delta,
            referenceType: "stock_adjustment",
            referenceId: adjustmentId,
            reason
          }
        });
      }

      return {
        variant,
        warehouse,
        balance,
        previousStockOnHand,
        nextStockOnHand,
        delta
      };
    });

    this.syncVariantMetadata(result.variant);
    this.ensurePersistedBalancesForVariant(result.variant);
    this.warehouseBalances.set(warehouseBalanceKey(result.balance.warehouseId, result.balance.variantId), this.mapWarehouseBalance(result.balance));
    this.refreshAggregateVariantState(result.variant.id, result.balance.updatedAt.toISOString());
    await this.persistState();

    return {
      status: "ok" as const,
      message: `Stock físico actualizado para ${result.variant.sku} en ${result.warehouse.name}.`,
      referenceId: adjustmentId,
      balance: {
        warehouseId: result.balance.warehouseId,
        variantId: result.balance.variantId,
        stockOnHand: result.balance.stockOnHand,
        reservedQuantity: result.balance.reservedQuantity,
        committedQuantity: result.balance.committedQuantity,
        availableStock: this.availableBalanceQuantity(this.mapWarehouseBalance(result.balance)),
        updatedAt: result.balance.updatedAt.toISOString()
      },
      previousStockOnHand: result.previousStockOnHand,
      nextStockOnHand: result.nextStockOnHand,
      delta: result.delta
    };
  }

  private async resolveItemReference(item: OrderItemSummary) {
    const identity = normalizeVariantId(item.variantId) ?? normalizeText(item.sku);
    if (!identity) {
      throw new BadRequestException(`No podemos resolver el inventario para ${item.slug}.`);
    }

    const variant = item.variantId
      ? await this.prisma.productVariant.findUnique({
          where: { id: identity },
          include: {
            product: {
              include: {
                bundleComponents: {
                  include: {
                    componentProduct: {
                      include: {
                        variants: true
                      }
                    },
                    componentVariant: true
                  },
                  orderBy: [{ sortOrder: "asc" }]
                }
              }
            }
          }
        })
      : await this.prisma.productVariant.findFirst({
          where: { sku: identity },
          include: {
            product: {
              include: {
                bundleComponents: {
                  include: {
                    componentProduct: {
                      include: {
                        variants: true
                      }
                    },
                    componentVariant: true
                  },
                  orderBy: [{ sortOrder: "asc" }]
                }
              }
            }
          }
        });

    if (!variant || variant.status !== "active") {
      throw new NotFoundException(`No encontramos la variante ${identity} para ${item.slug}.`);
    }

    const allocations = this.resolveAllocationsFromVariant(item, variant);
    return {
      variant,
      allocations
    };
  }

  private resolveAllocationsFromVariant(item: OrderItemSummary, variant: ProductVariant & {
    product: {
      bundleComponents: Array<{
        componentProduct: {
          variants: ProductVariant[];
        };
        componentVariant: ProductVariant | null;
        quantity: number;
      }>;
    };
  }) {
    const quantity = Math.trunc(Number(item.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException(`Cantidad inválida en inventario para ${item.slug}.`);
    }

    if (!variant.product.bundleComponents.length) {
      return [
        {
          variantId: variant.id,
          sku: variant.sku,
          name: variant.name,
          quantity,
          warehouseId: variant.defaultWarehouseId ?? undefined
        }
      ];
    }

    return variant.product.bundleComponents.map((component) => {
      const componentVariant = component.componentVariant ?? pickDefaultVariant(component.componentProduct.variants);
      if (!componentVariant || componentVariant.status !== "active") {
        throw new BadRequestException(`El bundle ${item.slug} depende de un componente sin variante activa.`);
      }

      return {
        variantId: componentVariant.id,
        sku: componentVariant.sku,
        name: componentVariant.name,
        quantity: component.quantity * quantity,
        warehouseId: componentVariant.defaultWarehouseId ?? undefined
      };
    });
  }

  private flattenAllocations(items: OrderItemSummary[], orderNumber: string, overrideWarehouseId?: string) {
    const lines: InventoryAllocationLine[] = [];

    for (const item of items) {
      const inventoryAllocations = item.inventoryAllocations ?? [];
      const allocations =
        inventoryAllocations.length > 0
          ? inventoryAllocations
          : item.variantId
            ? [
              {
                variantId: item.variantId,
                sku: item.sku,
                name: item.name,
                quantity: Math.trunc(Number(item.quantity)),
                warehouseId: overrideWarehouseId
              }
            ]
          : [];

      if (allocations.length === 0) {
        throw new BadRequestException(`No podemos reservar inventario para el item ${item.slug} del pedido ${orderNumber}.`);
      }

      for (const allocation of allocations) {
        const quantity = Math.trunc(Number(allocation.quantity));
        if (!Number.isFinite(quantity) || quantity <= 0) {
          throw new BadRequestException(`Cantidad inválida en inventario para ${item.slug}.`);
        }

        lines.push({
          variantId: allocation.variantId.trim(),
          warehouseId: overrideWarehouseId ?? normalizeWarehouseId(allocation.warehouseId),
          sku: allocation.sku.trim(),
          name: allocation.name.trim(),
          quantity,
          sourceSlug: item.slug.trim(),
          sourceName: item.name.trim(),
          sourceVariantId: item.variantId?.trim() || undefined
        });
      }
    }

    return this.mergeLines(lines);
  }

  private mergeLines(lines: InventoryAllocationLine[]) {
    const merged = new Map<string, InventoryAllocationLine>();

    for (const line of lines) {
      const key = `${line.variantId}:${line.warehouseId ?? "unassigned"}`;
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += line.quantity;
        continue;
      }

      merged.set(key, { ...line });
    }

    return Array.from(merged.values());
  }

  private haveEquivalentLines(existingLines: InventoryAllocationLine[], nextLines: InventoryAllocationLine[]) {
    const normalizedExisting = existingLines
      .map((line) => `${line.variantId}:${line.warehouseId ?? "unassigned"}:${line.quantity}`)
      .sort()
      .join("|");
    const normalizedNext = nextLines
      .map((line) => `${line.variantId}:${line.warehouseId ?? "unassigned"}:${line.quantity}`)
      .sort()
      .join("|");

    return normalizedExisting === normalizedNext;
  }

  private haveEquivalentVariantQuantities(existingLines: InventoryAllocationLine[], nextLines: InventoryAllocationLine[]) {
    const normalizedExisting = existingLines
      .map((line) => `${line.variantId}:${line.quantity}`)
      .sort()
      .join("|");
    const normalizedNext = nextLines
      .map((line) => `${line.variantId}:${line.quantity}`)
      .sort()
      .join("|");

    return normalizedExisting === normalizedNext;
  }

  private async reallocateLines(
    orderNumber: string,
    existing: InventoryReservationRecord,
    nextLines: InventoryAllocationLine[],
    occurredAt: string,
    note?: string,
    skipAvailabilityCheck = false
  ) {
    if (existing.state === "released") {
      throw new ConflictException(`El pedido ${orderNumber} ya liberó inventario y no puede reasignarse.`);
    }

    if (existing.state === "reserved") {
      await this.releaseLines(orderNumber, existing.lines, occurredAt, note);
      await this.reserveLines(orderNumber, nextLines, occurredAt, note, skipAvailabilityCheck);
      return;
    }

    await this.reverseLines(orderNumber, existing.lines, occurredAt, note);
    await this.reserveLines(orderNumber, nextLines, occurredAt, note, skipAvailabilityCheck);
    await this.confirmLines(orderNumber, nextLines, occurredAt, note);
  }

  private async reserveLines(
    orderNumber: string,
    lines: InventoryAllocationLine[],
    occurredAt: string,
    note?: string,
    skipAvailabilityCheck = false
  ) {
    const resolvedLines = await this.ensureResolvedLines(lines);

    if (!skipAvailabilityCheck) {
      for (const line of resolvedLines) {
        const balance = this.requireWarehouseBalanceState(line.warehouseId!, line.variantId);
        if (this.availableBalanceQuantity(balance) < line.quantity) {
          throw new ConflictException(
            `No hay stock suficiente para ${line.sku} en ${line.warehouseId}. Disponible: ${this.availableBalanceQuantity(balance)}, solicitado: ${line.quantity}.`
          );
        }
      }
    }

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId!, line.variantId);
      balance.reservedQuantity += line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "reserve",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(resolvedLines);
    this.reservations.set(orderNumber, {
      orderNumber,
      state: "reserved",
      lines: resolvedLines,
      createdAt: occurredAt,
      updatedAt: occurredAt
    });
  }

  private async confirmLines(orderNumber: string, lines: InventoryAllocationLine[], occurredAt: string, note?: string) {
    const resolvedLines = await this.ensureResolvedLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId!, line.variantId);
      if (balance.reservedQuantity < line.quantity) {
        throw new ConflictException(`No hay reserva suficiente para consolidar ${line.sku}.`);
      }

      balance.reservedQuantity -= line.quantity;
      balance.committedQuantity += line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "confirm",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(resolvedLines);
    this.reservations.set(orderNumber, {
      orderNumber,
      state: "confirmed",
      lines: resolvedLines,
      createdAt: this.reservations.get(orderNumber)?.createdAt ?? occurredAt,
      updatedAt: occurredAt
    });
  }

  private async releaseLines(orderNumber: string, lines: InventoryAllocationLine[], occurredAt: string, note?: string) {
    const resolvedLines = await this.ensureResolvedLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId!, line.variantId);
      if (balance.reservedQuantity < line.quantity) {
        throw new ConflictException(`No hay reserva suficiente para liberar ${line.sku}.`);
      }

      balance.reservedQuantity -= line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "release",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(resolvedLines);
    this.reservations.set(orderNumber, {
      orderNumber,
      state: "released",
      lines: resolvedLines,
      createdAt: this.reservations.get(orderNumber)?.createdAt ?? occurredAt,
      updatedAt: occurredAt
    });
  }

  private async reverseLines(orderNumber: string, lines: InventoryAllocationLine[], occurredAt: string, note?: string) {
    const resolvedLines = await this.ensureResolvedLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId!, line.variantId);
      if (balance.committedQuantity < line.quantity) {
        throw new ConflictException(`No hay inventario consolidado suficiente para revertir ${line.sku}.`);
      }

      balance.committedQuantity -= line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "reverse",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(resolvedLines);
    this.reservations.set(orderNumber, {
      orderNumber,
      state: "released",
      lines: resolvedLines,
      createdAt: this.reservations.get(orderNumber)?.createdAt ?? occurredAt,
      updatedAt: occurredAt
    });
  }

  async assessWarehouseFulfillment(input: {
    orderNumber?: string;
    warehouseId: string;
    items: OrderItemSummary[];
  }): Promise<WarehouseFulfillmentAssessment> {
    const warehouseId = normalizeWarehouseId(input.warehouseId);
    if (!warehouseId) {
      throw new BadRequestException("El almacén es obligatorio para validar inventario.");
    }

    const items = await this.hydrateOrderItems(input.items);
    const lines = await this.ensureResolvedLines(
      this.flattenAllocations(items, input.orderNumber ?? `assessment-${warehouseId}`, warehouseId)
    );
    const currentReservation = input.orderNumber ? this.reservations.get(input.orderNumber) : undefined;
    const missingLines: WarehouseFulfillmentMissingLine[] = [];

    for (const line of lines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId!, line.variantId);
      const effectiveAvailable =
        this.availableBalanceQuantity(balance) +
        this.currentOrderQuantityForWarehouse(currentReservation, line.variantId, line.warehouseId!);

      if (effectiveAvailable >= line.quantity) {
        continue;
      }

      missingLines.push({
        warehouseId: line.warehouseId!,
        variantId: line.variantId,
        sku: line.sku,
        name: line.name,
        requestedQuantity: line.quantity,
        availableQuantity: Math.max(0, effectiveAvailable)
      });
    }

    return {
      warehouseId,
      availableForAllLines: missingLines.length === 0,
      missingLines
    };
  }

  async reserveTransfer(
    transferNumber: string,
    lines: WarehouseInventoryMutationLineInput[],
    occurredAt: string,
    note?: string
  ) {
    const resolvedLines = await this.resolveWarehouseMutationLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      if (this.availableBalanceQuantity(balance) < line.quantity) {
        throw new ConflictException(
          `No hay stock suficiente para ${line.sku} en ${line.warehouseId}. Disponible: ${this.availableBalanceQuantity(balance)}, solicitado: ${line.quantity}.`
        );
      }
    }

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      balance.reservedQuantity += line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber: transferNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "transfer_reserve",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(
      resolvedLines.map((line) => ({
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        sourceSlug: "warehouse-transfer",
        sourceName: "Transferencia entre almacenes"
      }))
    );
  }

  async releaseTransferReservation(
    transferNumber: string,
    lines: WarehouseInventoryMutationLineInput[],
    occurredAt: string,
    note?: string
  ) {
    const resolvedLines = await this.resolveWarehouseMutationLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      if (balance.reservedQuantity < line.quantity) {
        throw new ConflictException(`No hay reserva suficiente para cancelar la transferencia ${transferNumber} de ${line.sku}.`);
      }
    }

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      balance.reservedQuantity -= line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber: transferNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "transfer_release",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(
      resolvedLines.map((line) => ({
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        sourceSlug: "warehouse-transfer",
        sourceName: "Transferencia entre almacenes"
      }))
    );
  }

  async dispatchTransfer(
    transferNumber: string,
    lines: WarehouseInventoryMutationLineInput[],
    occurredAt: string,
    note?: string
  ) {
    const resolvedLines = await this.resolveWarehouseMutationLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      if (balance.reservedQuantity < line.quantity) {
        throw new ConflictException(`No hay reserva suficiente para despachar la transferencia ${transferNumber} de ${line.sku}.`);
      }

      if (balance.stockOnHand < line.quantity) {
        throw new ConflictException(`No hay stock físico suficiente para despachar ${line.sku} desde ${line.warehouseId}.`);
      }
    }

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      balance.reservedQuantity -= line.quantity;
      balance.stockOnHand -= line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber: transferNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "transfer_dispatch",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(
      resolvedLines.map((line) => ({
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        sourceSlug: "warehouse-transfer",
        sourceName: "Transferencia entre almacenes"
      }))
    );
  }

  async receiveTransfer(
    transferNumber: string,
    lines: WarehouseInventoryMutationLineInput[],
    occurredAt: string,
    note?: string
  ) {
    const resolvedLines = await this.resolveWarehouseMutationLines(lines);

    for (const line of resolvedLines) {
      const balance = this.requireWarehouseBalanceState(line.warehouseId, line.variantId);
      balance.stockOnHand += line.quantity;
      balance.updatedAt = occurredAt;
      this.refreshAggregateVariantState(line.variantId, occurredAt);
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber: transferNumber,
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        action: "transfer_receive",
        balanceReserved: balance.reservedQuantity,
        balanceCommitted: balance.committedQuantity,
        occurredAt,
        note
      });
    }

    await this.persistWarehouseBalances(
      resolvedLines.map((line) => ({
        variantId: line.variantId,
        warehouseId: line.warehouseId,
        sku: line.sku,
        name: line.name,
        quantity: line.quantity,
        sourceSlug: "warehouse-transfer",
        sourceName: "Transferencia entre almacenes"
      }))
    );
  }

  private currentOrderQuantityForWarehouse(
    reservation: InventoryReservationRecord | undefined,
    variantId: string,
    warehouseId: string
  ) {
    if (!reservation) {
      return 0;
    }

    return reservation.lines
      .filter((line) => line.variantId === variantId && line.warehouseId === warehouseId)
      .reduce((sum, line) => sum + line.quantity, 0);
  }

  private async resolveWarehouseMutationLines(lines: WarehouseInventoryMutationLineInput[]) {
    const normalized = this.mergeWarehouseMutationLines(lines);
    const variantIds = [...new Set(normalized.map((line) => line.variantId))];
    if (variantIds.length === 0) {
      return [];
    }

    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds
        }
      },
      include: {
        product: true,
        warehouseBalances: true
      }
    });
    const variantsById = new Map(variants.map((variant) => [variant.id, variant] as const));

    for (const variant of variants) {
      this.syncVariantMetadata(variant);
      this.ensurePersistedBalancesForVariant(variant);
      this.reconcileDefaultBalanceWithVariantStock(variant);
      this.refreshAggregateVariantState(variant.id);
    }

    return normalized.map((line) => {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        throw new NotFoundException(`No encontramos la variante ${line.variantId} en inventario.`);
      }

      if (variant.product.productKind === ProductKind.bundle) {
        throw new ConflictException("Los combos no se transfieren como stock físico. Transfiere sus productos unitarios.");
      }

      const warehouseId = normalizeWarehouseId(line.warehouseId);
      if (!warehouseId) {
        throw new BadRequestException(`La línea ${line.variantId} requiere warehouseId.`);
      }

      this.ensureWarehouseBalanceState(warehouseId, variant);
      this.refreshAggregateVariantState(variant.id);

      return {
        variantId: variant.id,
        warehouseId,
        quantity: line.quantity,
        sku: variant.sku,
        name: variant.name
      } satisfies ResolvedWarehouseInventoryMutationLine;
    });
  }

  private mergeWarehouseMutationLines(lines: WarehouseInventoryMutationLineInput[]) {
    const merged = new Map<string, WarehouseInventoryMutationLineInput>();

    for (const line of lines) {
      const quantity = Math.trunc(Number(line.quantity));
      const variantId = normalizeVariantId(line.variantId);
      const warehouseId = normalizeWarehouseId(line.warehouseId);
      if (!variantId || !warehouseId) {
        throw new BadRequestException("Cada línea de inventario debe incluir variantId y warehouseId.");
      }

      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Cantidad inválida para la variante ${variantId}.`);
      }

      const key = warehouseBalanceKey(warehouseId, variantId);
      const existing = merged.get(key);
      if (existing) {
        existing.quantity += quantity;
        continue;
      }

      merged.set(key, {
        variantId,
        warehouseId,
        quantity
      });
    }

    return Array.from(merged.values());
  }

  private async ensureResolvedLines(lines: InventoryAllocationLine[]) {
    const variantIds = [...new Set(lines.map((line) => line.variantId))];
    if (variantIds.length === 0) {
      return [];
    }

    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds
        }
      },
      include: {
        product: true,
        warehouseBalances: true
      }
    });

    const variantsById = new Map(variants.map((variant) => [variant.id, variant] as const));
    const resolvedLines = lines.map((line) => {
      const variant = variantsById.get(line.variantId);
      if (!variant) {
        throw new NotFoundException(`No encontramos la variante ${line.variantId} en inventario.`);
      }

      const warehouseId = normalizeWarehouseId(line.warehouseId) ?? normalizeWarehouseId(variant.defaultWarehouseId);
      if (!warehouseId) {
        throw new ConflictException(`La variante ${variant.sku} no tiene almacén para reservar inventario.`);
      }

      return {
        ...line,
        warehouseId
      };
    });

    for (const variant of variants) {
      this.syncVariantMetadata(variant);
      this.ensurePersistedBalancesForVariant(variant);
      this.reconcileDefaultBalanceWithVariantStock(variant);
      this.refreshAggregateVariantState(variant.id);
    }

    for (const line of resolvedLines) {
      this.ensureWarehouseBalanceState(line.warehouseId!, variantsById.get(line.variantId)!);
      this.refreshAggregateVariantState(line.variantId);
    }

    return this.mergeLines(resolvedLines);
  }

  private syncVariantMetadata(
    variant: ProductVariant & {
      product: {
        slug: string;
      };
    }
  ) {
    const existing = this.variants.get(variant.id);
    this.variants.set(variant.id, {
      variantId: variant.id,
      sku: variant.sku,
      name: variant.name,
      productSlug: variant.product.slug,
      baseStockOnHand: existing?.baseStockOnHand ?? variant.stockOnHand,
      reservedQuantity: existing?.reservedQuantity ?? 0,
      committedQuantity: existing?.committedQuantity ?? 0,
      updatedAt: existing?.updatedAt ?? new Date().toISOString()
    });
  }

  private ensurePersistedBalancesForVariant(
    variant: ProductVariant & {
      warehouseBalances: WarehouseInventoryBalance[];
    }
  ) {
    for (const balance of variant.warehouseBalances) {
      const key = warehouseBalanceKey(balance.warehouseId, balance.variantId);
      if (this.warehouseBalances.has(key)) {
        continue;
      }

      this.warehouseBalances.set(key, this.mapWarehouseBalance(balance));
    }
  }

  private async seedRebuildBaselineFromPersistedInventory() {
    const variants = await this.prisma.productVariant.findMany({
      include: {
        product: true,
        warehouseBalances: true
      }
    });
    const now = new Date().toISOString();

    for (const variant of variants) {
      if (variant.product.productKind === ProductKind.bundle) {
        continue;
      }

      this.syncVariantMetadata(variant);

      for (const balance of variant.warehouseBalances) {
        this.warehouseBalances.set(warehouseBalanceKey(balance.warehouseId, balance.variantId), {
          warehouseId: balance.warehouseId,
          variantId: balance.variantId,
          stockOnHand: balance.stockOnHand,
          reservedQuantity: 0,
          committedQuantity: 0,
          updatedAt: now
        });
      }

      const defaultWarehouseId = normalizeWarehouseId(variant.defaultWarehouseId);
      if (!defaultWarehouseId) {
        if (this.getBalancesForVariant(variant.id).length > 0) {
          this.refreshAggregateVariantState(variant.id, now);
        }
        continue;
      }

      const defaultKey = warehouseBalanceKey(defaultWarehouseId, variant.id);
      if (!this.warehouseBalances.has(defaultKey)) {
        this.warehouseBalances.set(defaultKey, {
          warehouseId: defaultWarehouseId,
          variantId: variant.id,
          stockOnHand: variant.stockOnHand,
          reservedQuantity: 0,
          committedQuantity: 0,
          updatedAt: now
        });
      }

      this.refreshAggregateVariantState(variant.id, now);
    }
  }

  private reconcileDefaultBalanceWithVariantStock(
    variant: ProductVariant & {
      warehouseBalances: WarehouseInventoryBalance[];
    }
  ) {
    const defaultWarehouseId = normalizeWarehouseId(variant.defaultWarehouseId);
    if (!defaultWarehouseId) {
      return;
    }

    const balances = this.getBalancesForVariant(variant.id);
    if (balances.length === 0) {
      this.warehouseBalances.set(
        warehouseBalanceKey(defaultWarehouseId, variant.id),
        {
          warehouseId: defaultWarehouseId,
          variantId: variant.id,
          stockOnHand: variant.stockOnHand,
          reservedQuantity: 0,
          committedQuantity: 0,
          updatedAt: new Date().toISOString()
        }
      );
      return;
    }

    if (balances.length === 1 && balances[0]?.warehouseId === defaultWarehouseId && balances[0].stockOnHand !== variant.stockOnHand) {
      balances[0].stockOnHand = variant.stockOnHand;
    }
  }

  private ensureWarehouseBalanceState(
    warehouseId: string,
    variant: ProductVariant & {
      defaultWarehouseId: string | null;
    }
  ) {
    const key = warehouseBalanceKey(warehouseId, variant.id);
    const existing = this.warehouseBalances.get(key);
    if (existing) {
      return existing;
    }

    const balance: InventoryWarehouseBalanceState = {
      warehouseId,
      variantId: variant.id,
      stockOnHand: normalizeWarehouseId(variant.defaultWarehouseId) === warehouseId ? variant.stockOnHand : 0,
      reservedQuantity: 0,
      committedQuantity: 0,
      updatedAt: new Date().toISOString()
    };
    this.warehouseBalances.set(key, balance);
    return balance;
  }

  private getBalancesForVariant(variantId: string) {
    return Array.from(this.warehouseBalances.values()).filter((balance) => balance.variantId === variantId);
  }

  private refreshAggregateVariantState(variantId: string, occurredAt?: string) {
    const variant = this.variants.get(variantId);
    if (!variant) {
      throw new NotFoundException(`No encontramos la variante ${variantId} en inventario.`);
    }

    const balances = this.getBalancesForVariant(variantId);
    variant.baseStockOnHand = balances.reduce((sum, balance) => sum + balance.stockOnHand, 0);
    variant.reservedQuantity = balances.reduce((sum, balance) => sum + balance.reservedQuantity, 0);
    variant.committedQuantity = balances.reduce((sum, balance) => sum + balance.committedQuantity, 0);
    variant.updatedAt = occurredAt ?? variant.updatedAt;
    return variant;
  }

  private requireWarehouseBalanceState(warehouseId: string, variantId: string) {
    const balance = this.warehouseBalances.get(warehouseBalanceKey(warehouseId, variantId));
    if (!balance) {
      throw new NotFoundException(`No encontramos saldo por almacén para la variante ${variantId}.`);
    }

    return balance;
  }

  private availableBalanceQuantity(balance: InventoryWarehouseBalanceState) {
    return balance.stockOnHand - balance.reservedQuantity - balance.committedQuantity;
  }

  private mapWarehouseBalance(balance: WarehouseInventoryBalance): InventoryWarehouseBalanceState {
    return {
      warehouseId: balance.warehouseId,
      variantId: balance.variantId,
      stockOnHand: balance.stockOnHand,
      reservedQuantity: balance.reservedQuantity,
      committedQuantity: balance.committedQuantity,
      updatedAt: balance.updatedAt.toISOString()
    };
  }

  private async persistWarehouseBalances(lines: InventoryAllocationLine[]) {
    const uniqueKeys = [...new Set(lines.map((line) => warehouseBalanceKey(line.warehouseId!, line.variantId)))];

    for (const key of uniqueKeys) {
      const balance = this.warehouseBalances.get(key);
      if (!balance) {
        continue;
      }

      await this.prisma.warehouseInventoryBalance.upsert({
        where: {
          warehouseId_variantId: {
            warehouseId: balance.warehouseId,
            variantId: balance.variantId
          }
        },
        create: {
          warehouseId: balance.warehouseId,
          variantId: balance.variantId,
          stockOnHand: balance.stockOnHand,
          reservedQuantity: balance.reservedQuantity,
          committedQuantity: balance.committedQuantity
        },
        update: {
          stockOnHand: balance.stockOnHand,
          reservedQuantity: balance.reservedQuantity,
          committedQuantity: balance.committedQuantity
        }
      });
    }
  }

  private async persistAllWarehouseBalances() {
    await this.persistWarehouseBalances(
      Array.from(this.warehouseBalances.values()).map((balance) => ({
        variantId: balance.variantId,
        warehouseId: balance.warehouseId,
        sku: balance.variantId,
        name: balance.variantId,
        quantity: 1,
        sourceSlug: "inventory-rebuild",
        sourceName: "Reconstruccion de inventario"
      }))
    );
  }

  private restoreSnapshot(snapshot: InventorySnapshot) {
    this.variants.clear();
    this.warehouseBalances.clear();
    this.reservations.clear();
    this.ledger.splice(0, this.ledger.length);

    for (const variant of Object.values(snapshot.variants ?? {})) {
      this.variants.set(variant.variantId, { ...variant });
    }

    for (const balance of Object.values(snapshot.warehouseBalances ?? {})) {
      this.warehouseBalances.set(warehouseBalanceKey(balance.warehouseId, balance.variantId), { ...balance });
    }

    for (const reservation of Object.values(snapshot.reservations ?? {})) {
      this.reservations.set(reservation.orderNumber, {
        ...reservation,
        lines: reservation.lines.map((line) => ({ ...line }))
      });
    }

    this.ledger.push(...(snapshot.ledger ?? []).map((entry) => ({ ...entry })));
  }

  private buildSnapshot(): InventorySnapshot {
    return {
      variants: Object.fromEntries(Array.from(this.variants.values()).map((variant) => [variant.variantId, { ...variant }])),
      warehouseBalances: Object.fromEntries(
        Array.from(this.warehouseBalances.values()).map((balance) => [
          warehouseBalanceKey(balance.warehouseId, balance.variantId),
          { ...balance }
        ])
      ),
      reservations: Object.fromEntries(
        Array.from(this.reservations.values()).map((reservation) => [
          reservation.orderNumber,
          {
            ...reservation,
            lines: reservation.lines.map((line) => ({ ...line }))
          }
        ])
      ),
      ledger: this.ledger.map((entry) => ({ ...entry }))
    };
  }

  private async persistState() {
    await this.moduleStateService.save<InventorySnapshot>("inventory", this.buildSnapshot());
  }
}
