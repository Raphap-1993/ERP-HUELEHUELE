import { randomUUID } from "node:crypto";
import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { type ProductVariant } from "@prisma/client";
import { ProductSalesChannel, type InventoryReportRow, type InventoryReportSummary, type OrderItemSummary, OrderStatus } from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { ModuleStateService } from "../../persistence/module-state.service";
import { PrismaService } from "../../prisma/prisma.service";

type InventoryOrderState = "reserved" | "confirmed" | "released";

type InventoryAction = "reserve" | "confirm" | "release" | "reverse";

interface InventoryAllocationLine {
  variantId: string;
  sku: string;
  name: string;
  quantity: number;
  sourceSlug: string;
  sourceName: string;
  sourceVariantId?: string;
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
  state: InventoryOrderState;
  lines: InventoryAllocationLine[];
  createdAt: string;
  updatedAt: string;
}

interface InventoryLedgerEntry {
  id: string;
  orderNumber: string;
  variantId: string;
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
  reservations: Record<string, InventoryReservationRecord>;
  ledger: InventoryLedgerEntry[];
}

interface InventorySyncInput {
  orderNumber: string;
  orderStatus: OrderStatus;
  items: OrderItemSummary[];
  createdAt?: string;
  occurredAt?: string;
  note?: string;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeVariantId(value?: string) {
  const normalized = normalizeText(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

function isConsumptiveStatus(orderStatus: OrderStatus) {
  return (
    orderStatus === OrderStatus.Paid ||
    orderStatus === OrderStatus.Confirmed ||
    orderStatus === OrderStatus.Preparing ||
    orderStatus === OrderStatus.Shipped ||
    orderStatus === OrderStatus.Delivered ||
    orderStatus === OrderStatus.Completed
  );
}

function isReservableStatus(orderStatus: OrderStatus) {
  return orderStatus === OrderStatus.PendingPayment || orderStatus === OrderStatus.PaymentUnderReview;
}

function isReleaseStatus(orderStatus: OrderStatus) {
  return orderStatus === OrderStatus.Cancelled || orderStatus === OrderStatus.Refunded || orderStatus === OrderStatus.Expired;
}

function normalizeOrderState(orderStatus: OrderStatus): InventoryOrderState | undefined {
  if (isConsumptiveStatus(orderStatus)) {
    return "confirmed";
  }

  if (isReservableStatus(orderStatus)) {
    return "reserved";
  }

  if (isReleaseStatus(orderStatus)) {
    return "released";
  }

  return undefined;
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

  async syncOrder(input: InventorySyncInput, options: { skipAvailabilityCheck?: boolean; persist?: boolean } = {}) {
    const orderState = normalizeOrderState(input.orderStatus);
    if (!orderState) {
      return;
    }

    const occurredAt = input.occurredAt ?? new Date().toISOString();
    const items = await this.hydrateOrderItems(input.items);
    const lines = this.flattenAllocations(items, input.orderNumber);
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

    this.ensureSameLines(existing.lines, lines, input.orderNumber);

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
    this.reservations.clear();
    this.ledger.splice(0, this.ledger.length);

    const ordered = [...orders].sort((left, right) => {
      const leftAt = new Date(left.createdAt ?? left.occurredAt ?? 0).getTime();
      const rightAt = new Date(right.createdAt ?? right.occurredAt ?? 0).getTime();
      return leftAt - rightAt;
    });

    for (const order of ordered) {
      await this.syncOrder(order, { skipAvailabilityCheck: true, persist: false });
    }

    await this.persistState();
  }

  async getAdminReport() {
    const variants = await this.prisma.productVariant.findMany({
      include: {
        product: {
          include: {
            category: true
          }
        }
      },
      orderBy: [{ updatedAt: "desc" }]
    });

    const confirmedByVariant = new Map<string, number>();
    for (const entry of this.ledger) {
      if (entry.action !== "confirm") {
        continue;
      }

      confirmedByVariant.set(entry.variantId, (confirmedByVariant.get(entry.variantId) ?? 0) + entry.quantity);
    }

    const rows: InventoryReportRow[] = variants.map((variant) => {
      const state = this.variants.get(variant.id);
      const reservedQuantity = state?.reservedQuantity ?? 0;
      const committedQuantity = state?.committedQuantity ?? 0;
      const availableStock = variant.stockOnHand - reservedQuantity - committedQuantity;
      const reportingGroup = variant.product.reportingGroup?.trim() || variant.product.name;
      const salesChannel =
        variant.product.salesChannel === ProductSalesChannel.Internal
          ? ProductSalesChannel.Internal
          : ProductSalesChannel.Public;
      const lowStockThreshold = Math.max(0, variant.lowStockThreshold ?? 100);

      return {
        reportingGroup,
        productId: variant.productId,
        productName: variant.product.name,
        productSlug: variant.product.slug,
        salesChannel,
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        unitsSold: confirmedByVariant.get(variant.id) ?? 0,
        stockOnHand: variant.stockOnHand,
        reservedQuantity,
        availableStock,
        lowStockThreshold,
        lowStock: availableStock <= lowStockThreshold
      };
    });

    rows.sort((left, right) => {
      if (left.lowStock !== right.lowStock) {
        return left.lowStock ? -1 : 1;
      }

      if (left.reportingGroup !== right.reportingGroup) {
        return left.reportingGroup.localeCompare(right.reportingGroup);
      }

      return left.sku.localeCompare(right.sku);
    });

    const data: InventoryReportSummary = {
      rows,
      generatedAt: new Date().toISOString()
    };

    return wrapResponse<InventoryReportSummary>(data, {
      total: rows.length,
      lowStock: rows.filter((row) => row.lowStock).length,
      internal: rows.filter((row) => row.salesChannel === ProductSalesChannel.Internal).length,
      public: rows.filter((row) => row.salesChannel === ProductSalesChannel.Public).length
    });
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
          quantity
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
        quantity: component.quantity * quantity
      };
    });
  }

  private flattenAllocations(items: OrderItemSummary[], orderNumber: string) {
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
                  quantity: Math.trunc(Number(item.quantity))
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
      const existing = merged.get(line.variantId);
      if (existing) {
        existing.quantity += line.quantity;
        continue;
      }

      merged.set(line.variantId, { ...line });
    }

    return Array.from(merged.values());
  }

  private ensureSameLines(existingLines: InventoryAllocationLine[], nextLines: InventoryAllocationLine[], orderNumber: string) {
    const normalizedExisting = existingLines
      .map((line) => `${line.variantId}:${line.quantity}`)
      .sort()
      .join("|");
    const normalizedNext = nextLines
      .map((line) => `${line.variantId}:${line.quantity}`)
      .sort()
      .join("|");

    if (normalizedExisting !== normalizedNext) {
      throw new ConflictException(`El pedido ${orderNumber} cambió sus líneas de inventario y no puede sincronizarse de forma segura.`);
    }
  }

  private async reserveLines(
    orderNumber: string,
    lines: InventoryAllocationLine[],
    occurredAt: string,
    note?: string,
    skipAvailabilityCheck = false
  ) {
    await this.ensureVariantStates(lines);

    if (!skipAvailabilityCheck) {
      for (const line of lines) {
        const variant = this.variants.get(line.variantId);
        if (!variant) {
          throw new NotFoundException(`No encontramos la variante ${line.variantId} para reservar inventario.`);
        }

        if (this.availableQuantity(variant) < line.quantity) {
          throw new ConflictException(
            `No hay stock suficiente para ${variant.sku}. Disponible: ${this.availableQuantity(variant)}, solicitado: ${line.quantity}.`
          );
        }
      }
    }

    for (const line of lines) {
      const variant = this.requireVariantState(line.variantId);
      variant.reservedQuantity += line.quantity;
      variant.updatedAt = occurredAt;
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: variant.variantId,
        sku: variant.sku,
        name: variant.name,
        quantity: line.quantity,
        action: "reserve",
        balanceReserved: variant.reservedQuantity,
        balanceCommitted: variant.committedQuantity,
        occurredAt,
        note
      });
    }

    this.reservations.set(orderNumber, {
      orderNumber,
      state: "reserved",
      lines,
      createdAt: occurredAt,
      updatedAt: occurredAt
    });
  }

  private async confirmLines(orderNumber: string, lines: InventoryAllocationLine[], occurredAt: string, note?: string) {
    await this.ensureVariantStates(lines);

    for (const line of lines) {
      const variant = this.requireVariantState(line.variantId);
      if (variant.reservedQuantity < line.quantity) {
        throw new ConflictException(`No hay reserva suficiente para consolidar ${variant.sku}.`);
      }

      variant.reservedQuantity -= line.quantity;
      variant.committedQuantity += line.quantity;
      variant.updatedAt = occurredAt;
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: variant.variantId,
        sku: variant.sku,
        name: variant.name,
        quantity: line.quantity,
        action: "confirm",
        balanceReserved: variant.reservedQuantity,
        balanceCommitted: variant.committedQuantity,
        occurredAt,
        note
      });
    }

    this.reservations.set(orderNumber, {
      orderNumber,
      state: "confirmed",
      lines,
      createdAt: this.reservations.get(orderNumber)?.createdAt ?? occurredAt,
      updatedAt: occurredAt
    });
  }

  private async releaseLines(orderNumber: string, lines: InventoryAllocationLine[], occurredAt: string, note?: string) {
    await this.ensureVariantStates(lines);

    for (const line of lines) {
      const variant = this.requireVariantState(line.variantId);
      if (variant.reservedQuantity < line.quantity) {
        throw new ConflictException(`No hay reserva suficiente para liberar ${variant.sku}.`);
      }

      variant.reservedQuantity -= line.quantity;
      variant.updatedAt = occurredAt;
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: variant.variantId,
        sku: variant.sku,
        name: variant.name,
        quantity: line.quantity,
        action: "release",
        balanceReserved: variant.reservedQuantity,
        balanceCommitted: variant.committedQuantity,
        occurredAt,
        note
      });
    }

    this.reservations.set(orderNumber, {
      orderNumber,
      state: "released",
      lines,
      createdAt: this.reservations.get(orderNumber)?.createdAt ?? occurredAt,
      updatedAt: occurredAt
    });
  }

  private async reverseLines(orderNumber: string, lines: InventoryAllocationLine[], occurredAt: string, note?: string) {
    await this.ensureVariantStates(lines);

    for (const line of lines) {
      const variant = this.requireVariantState(line.variantId);
      if (variant.committedQuantity < line.quantity) {
        throw new ConflictException(`No hay inventario consolidado suficiente para revertir ${variant.sku}.`);
      }

      variant.committedQuantity -= line.quantity;
      variant.updatedAt = occurredAt;
      this.ledger.unshift({
        id: randomUUID(),
        orderNumber,
        variantId: variant.variantId,
        sku: variant.sku,
        name: variant.name,
        quantity: line.quantity,
        action: "reverse",
        balanceReserved: variant.reservedQuantity,
        balanceCommitted: variant.committedQuantity,
        occurredAt,
        note
      });
    }

    this.reservations.set(orderNumber, {
      orderNumber,
      state: "released",
      lines,
      createdAt: this.reservations.get(orderNumber)?.createdAt ?? occurredAt,
      updatedAt: occurredAt
    });
  }

  private async ensureVariantStates(lines: InventoryAllocationLine[]) {
    const variantIds = [...new Set(lines.map((line) => line.variantId))];
    if (variantIds.length === 0) {
      return;
    }

    const variants = await this.prisma.productVariant.findMany({
      where: {
        id: {
          in: variantIds
        }
      },
      include: {
        product: true
      }
    });

    for (const variant of variants) {
      const existing = this.variants.get(variant.id);
      this.variants.set(variant.id, {
        variantId: variant.id,
        sku: variant.sku,
        name: variant.name,
        productSlug: variant.product.slug,
        baseStockOnHand: variant.stockOnHand,
        reservedQuantity: existing?.reservedQuantity ?? 0,
        committedQuantity: existing?.committedQuantity ?? 0,
        updatedAt: existing?.updatedAt ?? new Date().toISOString()
      });
    }

    for (const variantId of variantIds) {
      if (!this.variants.has(variantId)) {
        throw new NotFoundException(`No encontramos la variante ${variantId} en inventario.`);
      }
    }
  }

  private requireVariantState(variantId: string) {
    const state = this.variants.get(variantId);
    if (!state) {
      throw new NotFoundException(`No encontramos la variante ${variantId} en inventario.`);
    }

    return state;
  }

  private availableQuantity(variant: InventoryVariantState) {
    return variant.baseStockOnHand - variant.reservedQuantity - variant.committedQuantity;
  }

  private restoreSnapshot(snapshot: InventorySnapshot) {
    this.variants.clear();
    this.reservations.clear();
    this.ledger.splice(0, this.ledger.length);

    for (const variant of Object.values(snapshot.variants ?? {})) {
      this.variants.set(variant.variantId, { ...variant });
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
