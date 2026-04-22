import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { test } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import {
  ManualPaymentRequestStatus,
  OrderStatus,
  PaymentStatus,
  ProductSalesChannel,
  VendorCollaborationType
} from "@huelegood/shared";
import { PeruUbigeoService } from "../src/modules/commerce/peru-ubigeo.service";
import { CoreService } from "../src/modules/core/core.service";
import { InventoryService } from "../src/modules/inventory/inventory.service";
import { OrdersService } from "../src/modules/orders/orders.service";
import { TransfersService } from "../src/modules/transfers/transfers.service";
import { VendorsService } from "../src/modules/vendors/vendors.service";

type BackofficeOrderInput = Parameters<OrdersService["createBackofficeOrder"]>[0];
type CheckoutOrderInput = Parameters<OrdersService["createCheckoutOrder"]>[0];

type TestVariantRecord = {
  id: string;
  productId: string;
  sku: string;
  name: string;
  status: "active";
  stockOnHand: number;
  lowStockThreshold: number;
  defaultWarehouseId: string | null;
  defaultWarehouse?: {
    code: string;
    name: string;
  };
  warehouseBalances: Array<{
    warehouseId: string;
    variantId: string;
    stockOnHand: number;
    reservedQuantity: number;
    committedQuantity: number;
    updatedAt: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    reportingGroup?: string | null;
    salesChannel: ProductSalesChannel;
    category: null;
    bundleComponents: Array<{
      quantity: number;
      componentProduct: {
        variants: TestVariantRecord[];
      };
      componentVariant: TestVariantRecord | null;
    }>;
  };
};

type TestWarehouseRecord = {
  id: string;
  code: string;
  name: string;
  status: "active" | "inactive" | "suspended";
  priority: number;
  countryCode: string;
  addressLine1: string;
  addressLine2?: string | null;
  reference?: string | null;
  departmentCode: string;
  departmentName?: string | null;
  provinceCode: string;
  provinceName?: string | null;
  districtCode: string;
  districtName?: string | null;
  serviceAreas: Array<{
    scopeType: "department" | "province" | "district" | "zone";
    scopeCode: string;
    priority: number;
    isActive: boolean;
  }>;
};

type TestTransferLineRecord = {
  id: string;
  transferId: string;
  variantId: string;
  skuSnapshot: string;
  nameSnapshot: string;
  quantity: number;
  dispatchedQuantity: number;
  receivedQuantity: number;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

type TestTransferIncidentRecord = {
  id: string;
  transferId: string;
  transferNumber: string;
  status: "open" | "resolved";
  kind: "missing" | "damage" | "loss" | "overage" | "mixed";
  notes: string | null;
  openedByUserId: string | null;
  resolvedByUserId: string | null;
  openedAt: Date;
  resolvedAt: Date | null;
  resolutionNote: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type TestTransferDocumentRecord = {
  id: string;
  transferId: string;
  transferNumber: string;
  kind: "package_snapshot" | "gre" | "sticker";
  templateVersion: string;
  referenceCode: string | null;
  actorUserId: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
};

type TestTransferRecord = {
  id: string;
  transferNumber: string;
  status: "reserved" | "in_transit" | "received" | "cancelled";
  reason: string;
  notes: string | null;
  originWarehouseId: string;
  originWarehouseCodeSnapshot: string;
  originWarehouseNameSnapshot: string;
  destinationWarehouseId: string;
  destinationWarehouseCodeSnapshot: string;
  destinationWarehouseNameSnapshot: string;
  requestedByUserId: string | null;
  dispatchedByUserId: string | null;
  receivedByUserId: string | null;
  cancelledByUserId: string | null;
  reservationNote: string | null;
  dispatchNote: string | null;
  receiveNote: string | null;
  cancelNote: string | null;
  partialReceivedNote: string | null;
  partialReceivedByUserId: string | null;
  dispatchedAt: Date | null;
  partialReceivedAt: Date | null;
  receivedAt: Date | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  lines: TestTransferLineRecord[];
  documents: TestTransferDocumentRecord[];
  incident: TestTransferIncidentRecord | null;
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

class MemoryModuleStateService {
  private readonly snapshots = new Map<string, unknown>();

  async load<T>(moduleName: string): Promise<T | null> {
    const snapshot = this.snapshots.get(moduleName);
    return snapshot ? (deepClone(snapshot) as T) : null;
  }

  async save<T>(moduleName: string, snapshot: T) {
    this.snapshots.set(moduleName, deepClone(snapshot));
  }
}

class PrismaStub {
  private readonly transfers: TestTransferRecord[] = [];

  constructor(
    private readonly variants: TestVariantRecord[],
    private readonly warehouses: TestWarehouseRecord[]
  ) {}

  readonly productVariant = {
    findMany: async (args?: { where?: { id?: { in?: string[] } } }) => {
      const ids = args?.where?.id?.in;
      const records = ids ? this.variants.filter((variant) => ids.includes(variant.id)) : this.variants;
      return records.map((variant) => this.cloneVariant(variant));
    },
    findUnique: async (args: { where: { id: string } }) => {
      const variant = this.variants.find((record) => record.id === args.where.id);
      return variant ? this.cloneVariant(variant) : null;
    },
    findFirst: async (args: { where: { sku: string } }) => {
      const variant = this.variants.find((record) => record.sku === args.where.sku);
      return variant ? this.cloneVariant(variant) : null;
    }
  };

  readonly moduleSnapshot = {
    findUnique: async () => null,
    upsert: async () => null
  };

  readonly warehouse = {
    findUnique: async (args: { where: { id?: string; code?: string } }) => {
      const warehouse = this.warehouses.find(
        (record) => record.id === args.where.id || record.code === args.where.code
      );
      return warehouse ? this.cloneWarehouse(warehouse) : null;
    },
    findMany: async (args?: { where?: { id?: { in?: string[] }; status?: string } }) => {
      const ids = args?.where?.id?.in;
      const status = args?.where?.status;
      return this.warehouses
        .filter((warehouse) => (ids ? ids.includes(warehouse.id) : true))
        .filter((warehouse) => (status ? warehouse.status === status : true))
        .map((warehouse) => this.cloneWarehouse(warehouse));
    }
  };

  readonly warehouseInventoryBalance = {
    upsert: async () => null
  };

  readonly warehouseTransfer = {
    findMany: async () => this.sortedTransfers().map((transfer) => this.cloneTransfer(transfer)),
    findUnique: async (args: { where: { id?: string; transferNumber?: string } }) => {
      const transfer = this.transfers.find(
        (record) => record.id === args.where.id || record.transferNumber === args.where.transferNumber
      );
      return transfer ? this.cloneTransfer(transfer) : null;
    },
    findFirst: async (args?: { select?: { transferNumber?: boolean } }) => {
      const transfer = this.sortedTransfersByNumber()[0];
      if (!transfer) {
        return null;
      }

      if (args?.select?.transferNumber) {
        return {
          transferNumber: transfer.transferNumber
        };
      }

      return this.cloneTransfer(transfer);
    },
    create: async (args: {
      data: {
        transferNumber: string;
        status: TestTransferRecord["status"];
        reason: string;
        notes?: string | null;
        originWarehouseId: string;
        originWarehouseCodeSnapshot: string;
        originWarehouseNameSnapshot: string;
        destinationWarehouseId: string;
        destinationWarehouseCodeSnapshot: string;
        destinationWarehouseNameSnapshot: string;
        requestedByUserId?: string | null;
        reservationNote?: string | null;
        createdAt?: Date;
        updatedAt?: Date;
        lines?: {
          create?: Array<{
            variantId: string;
            skuSnapshot: string;
            nameSnapshot: string;
            quantity: number;
            dispatchedQuantity?: number;
            receivedQuantity?: number;
            sortOrder?: number;
          }>;
        };
      };
    }) => {
      const createdAt = args.data.createdAt ?? new Date();
      const updatedAt = args.data.updatedAt ?? createdAt;
      const transferId = randomUUID();
      const transfer: TestTransferRecord = {
        id: transferId,
        transferNumber: args.data.transferNumber,
        status: args.data.status,
        reason: args.data.reason,
        notes: args.data.notes ?? null,
        originWarehouseId: args.data.originWarehouseId,
        originWarehouseCodeSnapshot: args.data.originWarehouseCodeSnapshot,
        originWarehouseNameSnapshot: args.data.originWarehouseNameSnapshot,
        destinationWarehouseId: args.data.destinationWarehouseId,
        destinationWarehouseCodeSnapshot: args.data.destinationWarehouseCodeSnapshot,
        destinationWarehouseNameSnapshot: args.data.destinationWarehouseNameSnapshot,
        requestedByUserId: args.data.requestedByUserId ?? null,
        dispatchedByUserId: null,
        receivedByUserId: null,
        cancelledByUserId: null,
        reservationNote: args.data.reservationNote ?? null,
        dispatchNote: null,
        receiveNote: null,
        cancelNote: null,
        partialReceivedNote: null,
        partialReceivedByUserId: null,
        dispatchedAt: null,
        partialReceivedAt: null,
        receivedAt: null,
        cancelledAt: null,
        createdAt: new Date(createdAt),
        updatedAt: new Date(updatedAt),
        documents: [],
        incident: null,
        lines: (args.data.lines?.create ?? []).map((line, index) => ({
          id: randomUUID(),
          transferId,
          variantId: line.variantId,
          skuSnapshot: line.skuSnapshot,
          nameSnapshot: line.nameSnapshot,
          quantity: line.quantity,
          dispatchedQuantity: line.dispatchedQuantity ?? 0,
          receivedQuantity: line.receivedQuantity ?? 0,
          sortOrder: line.sortOrder ?? index,
          createdAt: new Date(createdAt),
          updatedAt: new Date(updatedAt)
        }))
      };

      this.transfers.push(transfer);
      return this.cloneTransfer(transfer);
    },
    update: async (args: {
      where: { id: string };
      data: Partial<{
        status: TestTransferRecord["status"];
        dispatchedAt: Date | null;
        dispatchedByUserId: string | null;
        dispatchNote: string | null;
        receivedAt: Date | null;
        receivedByUserId: string | null;
        receiveNote: string | null;
        cancelledAt: Date | null;
        cancelledByUserId: string | null;
        cancelNote: string | null;
        partialReceivedAt: Date | null;
        partialReceivedByUserId: string | null;
        partialReceivedNote: string | null;
        updatedAt: Date;
      }>;
    }) => {
      const transfer = this.transfers.find((record) => record.id === args.where.id);
      if (!transfer) {
        return null;
      }

      Object.assign(transfer, args.data);
      if (args.data.updatedAt) {
        transfer.updatedAt = new Date(args.data.updatedAt);
      }
      if (args.data.dispatchedAt) {
        transfer.dispatchedAt = new Date(args.data.dispatchedAt);
      }
      if (args.data.receivedAt) {
        transfer.receivedAt = new Date(args.data.receivedAt);
      }
      if (args.data.partialReceivedAt) {
        transfer.partialReceivedAt = new Date(args.data.partialReceivedAt);
      }
      if (args.data.cancelledAt) {
        transfer.cancelledAt = new Date(args.data.cancelledAt);
      }

      return this.cloneTransfer(transfer);
    }
  };

  readonly warehouseTransferLine = {
    update: async (args: {
      where: { id: string };
      data: Partial<{
        dispatchedQuantity: number;
        receivedQuantity: number;
      }>;
    }) => {
      for (const transfer of this.transfers) {
        const line = transfer.lines.find((record) => record.id === args.where.id);
        if (!line) {
          continue;
        }

        Object.assign(line, args.data);
        return this.cloneTransfer(transfer).lines.find((record) => record.id === line.id) ?? null;
      }

      return null;
    }
  };

  readonly warehouseTransferDocument = {
    findUnique: async (args: { where: { transferId_kind: { transferId: string; kind: TestTransferDocumentRecord["kind"] } } }) => {
      const document = this.transfers
        .flatMap((transfer) => transfer.documents)
        .find(
          (record) =>
            record.transferId === args.where.transferId_kind.transferId &&
            record.kind === args.where.transferId_kind.kind
        );
      return document ? this.cloneDocument(document) : null;
    },
    upsert: async (args: {
      where: { transferId_kind: { transferId: string; kind: TestTransferDocumentRecord["kind"] } };
      create: {
        transferId: string;
        transferNumber: string;
        kind: TestTransferDocumentRecord["kind"];
        templateVersion: string;
        referenceCode?: string | null;
        actorUserId?: string | null;
        payload: Record<string, unknown>;
      };
      update: Partial<Record<string, never>>;
    }) => {
      const existing = this.transfers
        .flatMap((transfer) => transfer.documents)
        .find(
          (record) =>
            record.transferId === args.where.transferId_kind.transferId &&
            record.kind === args.where.transferId_kind.kind
        );
      if (existing) {
        return this.cloneDocument(existing);
      }

      const transfer = this.transfers.find((record) => record.id === args.create.transferId);
      if (!transfer) {
        throw new Error(`Transferencia no encontrada: ${args.create.transferId}`);
      }

      const now = new Date();
      const document: TestTransferDocumentRecord = {
        id: randomUUID(),
        transferId: args.create.transferId,
        transferNumber: args.create.transferNumber,
        kind: args.create.kind,
        templateVersion: args.create.templateVersion,
        referenceCode: args.create.referenceCode ?? null,
        actorUserId: args.create.actorUserId ?? null,
        payload: { ...args.create.payload },
        createdAt: now,
        updatedAt: now
      };

      transfer.documents.push(document);
      return this.cloneDocument(document);
    }
  };

  readonly warehouseTransferIncident = {
    findUnique: async (args: { where: { transferId: string } }) => {
      const incident = this.transfers.find((transfer) => transfer.id === args.where.transferId)?.incident ?? null;
      return incident ? this.cloneIncident(incident) : null;
    },
    upsert: async (args: {
      where: { transferId: string };
      create: {
        transferId: string;
        transferNumber: string;
        status: "open" | "resolved";
        kind: "missing" | "damage" | "loss" | "overage" | "mixed";
        notes?: string | null;
        openedByUserId?: string | null;
        openedAt: Date;
        payload: Record<string, unknown>;
      };
      update: {
        status?: "open" | "resolved";
        kind?: "missing" | "damage" | "loss" | "overage" | "mixed";
        notes?: string | null;
        openedByUserId?: string | null;
        resolvedAt?: Date | null;
        resolvedByUserId?: string | null;
        resolutionNote?: string | null;
        payload?: Record<string, unknown>;
        updatedAt?: Date;
      };
    }) => {
      const transfer = this.transfers.find((record) => record.id === args.where.transferId);
      if (!transfer) {
        throw new Error(`Transferencia no encontrada: ${args.where.transferId}`);
      }

      if (!transfer.incident) {
        const now = new Date();
        transfer.incident = {
          id: randomUUID(),
          transferId: args.create.transferId,
          transferNumber: args.create.transferNumber,
          status: args.create.status,
          kind: args.create.kind,
          notes: args.create.notes ?? null,
          openedByUserId: args.create.openedByUserId ?? null,
          resolvedByUserId: null,
          openedAt: new Date(args.create.openedAt),
          resolvedAt: null,
          resolutionNote: null,
          payload: { ...args.create.payload },
          createdAt: now,
          updatedAt: now
        };
        return this.cloneIncident(transfer.incident);
      }

      if (args.update.status) {
        transfer.incident.status = args.update.status;
      }
      if (args.update.kind) {
        transfer.incident.kind = args.update.kind;
      }
      if (args.update.notes !== undefined) {
        transfer.incident.notes = args.update.notes ?? null;
      }
      if (args.update.openedByUserId !== undefined) {
        transfer.incident.openedByUserId = args.update.openedByUserId ?? null;
      }
      if (args.update.resolvedAt !== undefined) {
        transfer.incident.resolvedAt = args.update.resolvedAt ? new Date(args.update.resolvedAt) : null;
      }
      if (args.update.resolvedByUserId !== undefined) {
        transfer.incident.resolvedByUserId = args.update.resolvedByUserId ?? null;
      }
      if (args.update.resolutionNote !== undefined) {
        transfer.incident.resolutionNote = args.update.resolutionNote ?? null;
      }
      if (args.update.payload) {
        transfer.incident.payload = { ...args.update.payload };
      }
      if (args.update.updatedAt) {
        transfer.incident.updatedAt = new Date(args.update.updatedAt);
      }

      return this.cloneIncident(transfer.incident);
    },
    update: async (args: {
      where: { transferId: string };
      data: Partial<{
        status: "open" | "resolved";
        resolvedAt: Date | null;
        resolvedByUserId: string | null;
        resolutionNote: string | null;
        payload: Record<string, unknown>;
        updatedAt: Date;
      }>;
    }) => {
      const transfer = this.transfers.find((record) => record.id === args.where.transferId);
      if (!transfer?.incident) {
        return null;
      }

      Object.assign(transfer.incident, args.data);
      if (args.data.resolvedAt) {
        transfer.incident.resolvedAt = new Date(args.data.resolvedAt);
      }
      if (args.data.updatedAt) {
        transfer.incident.updatedAt = new Date(args.data.updatedAt);
      }
      return this.cloneIncident(transfer.incident);
    }
  };

  private cloneVariant(variant: TestVariantRecord): TestVariantRecord {
    return {
      ...variant,
      defaultWarehouse:
        this.warehouses.find((warehouse) => warehouse.id === variant.defaultWarehouseId)
          ? {
              code: this.warehouses.find((warehouse) => warehouse.id === variant.defaultWarehouseId)!.code,
              name: this.warehouses.find((warehouse) => warehouse.id === variant.defaultWarehouseId)!.name
            }
          : undefined,
      warehouseBalances: variant.warehouseBalances.map((balance) => ({
        ...balance,
        updatedAt: new Date(balance.updatedAt)
      })),
      createdAt: new Date(variant.createdAt),
      updatedAt: new Date(variant.updatedAt),
      product: {
        ...variant.product,
        bundleComponents: variant.product.bundleComponents.map((component) => ({
          quantity: component.quantity,
          componentProduct: {
            variants: component.componentProduct.variants.map((record) => this.cloneVariant(record))
          },
          componentVariant: component.componentVariant ? this.cloneVariant(component.componentVariant) : null
        }))
      }
    };
  }

  private cloneWarehouse(warehouse: TestWarehouseRecord) {
    return {
      ...warehouse,
      addressLine2: warehouse.addressLine2 ?? null,
      reference: warehouse.reference ?? null,
      departmentName: warehouse.departmentName ?? null,
      provinceName: warehouse.provinceName ?? null,
      districtName: warehouse.districtName ?? null,
      serviceAreas: warehouse.serviceAreas.map((area) => ({ ...area }))
    };
  }

  private cloneTransfer(transfer: TestTransferRecord) {
    return {
      ...transfer,
      createdAt: new Date(transfer.createdAt),
      updatedAt: new Date(transfer.updatedAt),
      dispatchedAt: transfer.dispatchedAt ? new Date(transfer.dispatchedAt) : null,
      partialReceivedAt: transfer.partialReceivedAt ? new Date(transfer.partialReceivedAt) : null,
      receivedAt: transfer.receivedAt ? new Date(transfer.receivedAt) : null,
      cancelledAt: transfer.cancelledAt ? new Date(transfer.cancelledAt) : null,
      incident: transfer.incident ? this.cloneIncident(transfer.incident) : null,
      documents: transfer.documents
        .slice()
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        .map((document) => this.cloneDocument(document)),
      lines: transfer.lines
        .slice()
        .sort((left, right) => left.sortOrder - right.sortOrder)
        .map((line) => ({
          ...line,
          createdAt: new Date(line.createdAt),
          updatedAt: new Date(line.updatedAt)
      }))
    };
  }

  private cloneIncident(incident: TestTransferIncidentRecord) {
    return {
      ...incident,
      openedAt: new Date(incident.openedAt),
      resolvedAt: incident.resolvedAt ? new Date(incident.resolvedAt) : null,
      createdAt: new Date(incident.createdAt),
      updatedAt: new Date(incident.updatedAt),
      payload: deepClone(incident.payload)
    };
  }

  private cloneDocument(document: TestTransferDocumentRecord) {
    return {
      ...document,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
      payload: deepClone(document.payload)
    };
  }

  private sortedTransfers() {
    return this.transfers
      .slice()
      .sort(
        (left, right) =>
          right.updatedAt.getTime() - left.updatedAt.getTime() || right.createdAt.getTime() - left.createdAt.getTime()
      );
  }

  private sortedTransfersByNumber() {
    return this.transfers.slice().sort((left, right) => right.transferNumber.localeCompare(left.transferNumber));
  }
}

class AuditStub {
  recordAudit() {}

  recordAdminAction() {}
}

class NotificationsStub {
  async queueNotification() {}

  async recordEvent() {}

  async listNotifications() {
    return { data: [] };
  }
}

class ObservabilityStub {
  recordDomainEvent() {}
}

class LoyaltyStub {
  recordOrderPoints() {}

  async settleOrderPoints() {}

  async reverseOrderPoints() {}

  listAccounts() {
    return { data: [] };
  }
}

class PaymentsStub {
  listPayments() {
    return { data: [] };
  }

  listManualRequests() {
    return { data: [] };
  }
}

class CommissionsStub {
  listCommissions() {
    return { data: [] };
  }

  listPayouts() {
    return { data: [] };
  }

  replaceVendorCodeReferences() {}
}

class WholesaleStub {
  listLeads() {
    return { data: [] };
  }
}

class MarketingStub {
  listCampaigns() {
    return { data: [] };
  }
}

class CustomersStub {
  async resolveCustomerFromOrderSnapshot() {
    return {};
  }
}

function buildVariant(input: {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  variantName: string;
  stockOnHand: number;
  salesChannel?: ProductSalesChannel;
  defaultWarehouseId?: string | null;
  warehouseBalances?: TestVariantRecord["warehouseBalances"];
}) {
  const now = new Date("2026-04-01T12:00:00.000Z");

  return {
    id: input.id,
    productId: input.productId,
    sku: input.sku,
    name: input.variantName,
    status: "active" as const,
    stockOnHand: input.stockOnHand,
    lowStockThreshold: 2,
    defaultWarehouseId: input.defaultWarehouseId ?? "wh-lima-central",
    warehouseBalances: input.warehouseBalances ?? [],
    createdAt: now,
    updatedAt: now,
    product: {
      id: input.productId,
      name: input.productName,
      slug: input.productSlug,
      reportingGroup: input.productName,
      salesChannel: input.salesChannel ?? ProductSalesChannel.Public,
      category: null,
      bundleComponents: []
    }
  } satisfies TestVariantRecord;
}

function buildWarehouse(input: {
  id: string;
  code: string;
  name: string;
  priority?: number;
  departmentCode?: string;
  departmentName?: string;
  provinceCode?: string;
  provinceName?: string;
  districtCode?: string;
  districtName?: string;
}) {
  return {
    id: input.id,
    code: input.code,
    name: input.name,
    status: "active" as const,
    priority: input.priority ?? 0,
    countryCode: "PE",
    addressLine1: `${input.name} - dirección demo`,
    addressLine2: null,
    reference: null,
    departmentCode: input.departmentCode ?? "15",
    departmentName: input.departmentName ?? "Lima",
    provinceCode: input.provinceCode ?? "1501",
    provinceName: input.provinceName ?? "Lima",
    districtCode: input.districtCode ?? "150101",
    districtName: input.districtName ?? "Lima",
    serviceAreas: []
  } satisfies TestWarehouseRecord;
}

async function createContext(input?: {
  variants?: TestVariantRecord[];
  warehouses?: TestWarehouseRecord[];
}) {
  process.env.DATABASE_URL = "";
  process.env.HUELEGOOD_ENABLE_DEMO_DATA = "false";

  const warehouses = input?.warehouses ?? [
    buildWarehouse({
      id: "wh-lima-central",
      code: "WH-LIMA-CENTRAL",
      name: "Lima Central"
    })
  ];
  const prisma = new PrismaStub(
    input?.variants ?? [
      buildVariant({
        id: "var-premium-negro",
        productId: "prod-premium-negro",
        productName: "Premium Negro",
        productSlug: "premium-negro",
        sku: "HG-PN-001",
        variantName: "Premium Negro 10 ml",
        stockOnHand: 5
      }),
      buildVariant({
        id: "var-clasico-verde",
        productId: "prod-clasico-verde",
        productName: "Clasico Verde",
        productSlug: "clasico-verde",
        sku: "HG-CV-001",
        variantName: "Clasico Verde 10 ml",
        stockOnHand: 8
      })
    ],
    warehouses
  );
  const moduleState = new MemoryModuleStateService();
  const audit = new AuditStub();
  const notifications = new NotificationsStub();
  const observability = new ObservabilityStub();
  const loyalty = new LoyaltyStub();
  const payments = new PaymentsStub();
  const commissions = new CommissionsStub();
  const wholesale = new WholesaleStub();
  const marketing = new MarketingStub();
  const customers = new CustomersStub();
  const peruUbigeo = new PeruUbigeoService();

  const inventory = new InventoryService(prisma as never, moduleState as never);
  const transfers = new TransfersService(prisma as never, inventory as never);
  const vendors = new VendorsService(audit as never, commissions as never, moduleState as never);
  const orders = new OrdersService(
    audit as never,
    inventory as never,
    loyalty as never,
    notifications as never,
    observability as never,
    vendors as never,
    moduleState as never,
    prisma as never,
    customers as never,
    peruUbigeo as never
  );
  const core = new CoreService(
    orders as never,
    payments as never,
    vendors as never,
    commissions as never,
    wholesale as never,
    marketing as never,
    notifications as never,
    loyalty as never
  );

  await vendors.onModuleInit();
  await inventory.onModuleInit();
  await transfers.onModuleInit();
  await orders.onModuleInit();

  return {
    inventory,
    transfers,
    vendors,
    orders,
    core
  };
}

function buildManualVendor(overrides: Partial<Parameters<VendorsService["createManualVendor"]>[0]> = {}) {
  return {
    name: "Vendedor Test",
    email: "seller@test.local",
    city: "Lima",
    phone: "+51 999111222",
    collaborationType: VendorCollaborationType.Seller,
    source: "QA",
    notes: "Creado desde prueba automatizada.",
    ...overrides
  };
}

function buildBackofficeOrderInput(input: {
  vendorCode?: string;
  variantId: string;
  sku: string;
  productSlug: string;
  productName: string;
  quantity?: number;
  unitPrice?: number;
  initialStatus?: "paid" | "pending_payment";
}): BackofficeOrderInput {
  return {
    customer: {
      firstName: "Laura",
      lastName: "Mendoza",
      email: "laura@test.local",
      phone: "999111222"
    },
    address: {
      line1: "Av. Principal 123",
      city: "Lima",
      region: "Lima",
      countryCode: "PE"
    },
    items: [
      {
        slug: input.productSlug,
        name: input.productName,
        sku: input.sku,
        variantId: input.variantId,
        quantity: input.quantity ?? 1,
        unitPrice: input.unitPrice ?? 60
      }
    ],
    initialStatus: input.initialStatus ?? "paid",
    vendorCode: input.vendorCode,
    reviewer: "qa"
  };
}

function buildOpenpayCheckoutInput(input: {
  orderNumber: string;
  clientRequestId: string;
  vendorCode?: string;
  variantId: string;
  sku: string;
  productSlug: string;
  productName: string;
  quantity?: number;
  unitPrice?: number;
}): CheckoutOrderInput {
  const quantity = input.quantity ?? 1;
  const unitPrice = input.unitPrice ?? 55;
  const lineTotal = quantity * unitPrice;

  return {
    orderNumber: input.orderNumber,
    quote: {
      items: [
        {
          slug: input.productSlug,
          name: input.productName,
          sku: input.sku,
          variantId: input.variantId,
          quantity,
          unitPrice,
          lineTotal
        }
      ],
      subtotal: lineTotal,
      discount: 0,
      shipping: 0,
      grandTotal: lineTotal,
      currencyCode: "PEN",
      vendorCode: input.vendorCode,
      couponCode: undefined,
      paymentMethod: "openpay",
      estimatedPoints: Math.floor(lineTotal / 10)
    },
    request: {
      items: [
        {
          slug: input.productSlug,
          quantity,
          variantId: input.variantId
        }
      ],
      customer: {
        firstName: "Carlos",
        lastName: "Rojas",
        email: "carlos@test.local",
        phone: "999222333",
        documentType: "dni",
        documentNumber: "12345678"
      },
      address: {
        recipientName: "Carlos Rojas",
        line1: "Jr. Test 456",
        city: "Lima",
        region: "Lima",
        postalCode: "15001",
        countryCode: "PE",
        departmentCode: "15",
        departmentName: "Lima",
        provinceCode: "1501",
        provinceName: "Lima",
        districtCode: "150101",
        districtName: "Lima"
      },
      paymentMethod: "openpay",
      vendorCode: input.vendorCode,
      clientRequestId: input.clientRequestId
    },
    orderStatus: OrderStatus.PendingPayment,
    paymentStatus: PaymentStatus.Initiated,
    providerReference: `openpay-${input.orderNumber.toLowerCase()}`,
    checkoutUrl: `https://checkout.test/${input.orderNumber.toLowerCase()}`
  };
}

function buildManualCheckoutInput(input: {
  orderNumber: string;
  clientRequestId: string;
  vendorCode?: string;
  variantId: string;
  sku: string;
  productSlug: string;
  productName: string;
  quantity?: number;
  unitPrice?: number;
  evidenceReference?: string;
  evidenceNotes?: string;
}): CheckoutOrderInput {
  const base = buildOpenpayCheckoutInput(input);

  return {
    ...base,
    quote: {
      ...base.quote,
      paymentMethod: "manual"
    },
    request: {
      ...base.request,
      paymentMethod: "manual",
      manualEvidenceReference: input.evidenceReference ?? `voucher-${input.orderNumber.toLowerCase()}`,
      manualEvidenceNotes: input.evidenceNotes ?? "Comprobante enviado desde checkout."
    },
    orderStatus: OrderStatus.PaymentUnderReview,
    paymentStatus: PaymentStatus.Pending,
    providerReference: `MP-${input.orderNumber.toLowerCase()}`,
    checkoutUrl: undefined,
    manualStatus: ManualPaymentRequestStatus.Submitted
  };
}

function periodRange() {
  return {
    from: "2026-03-01",
    to: "2026-04-30"
  };
}

async function findInventoryRow(context: Awaited<ReturnType<typeof createContext>>, sku: string) {
  const report = await context.inventory.getAdminReport();
  const row = report.data.rows.find((entry) => entry.sku === sku && entry.isDefaultWarehouse);
  assert.ok(row, `No encontramos la fila de inventario para ${sku}.`);
  return row;
}

async function findInventoryRows(context: Awaited<ReturnType<typeof createContext>>, sku: string) {
  const report = await context.inventory.getAdminReport();
  return report.data.rows.filter((entry) => entry.sku === sku);
}

test("permite registrar un vendedor despues de rechazar una postulacion previa", async () => {
  const context = await createContext();

  const applicationResult = context.vendors.submitApplication({
    name: "Ana Canal",
    email: "ana.canal@test.local",
    city: "Lima",
    phone: "+51 999 777 111",
    applicationIntent: "seller",
    source: "Formulario"
  });

  context.vendors.screenApplication(applicationResult.application!.id, {
    reviewer: "qa",
    notes: "Pasa a revisión comercial."
  });

  context.vendors.rejectApplication(applicationResult.application!.id, {
    reviewer: "qa",
    notes: "No aplica para este corte."
  });

  const vendorResult = context.vendors.createManualVendor(
    buildManualVendor({
      name: "Ana Canal",
      email: "ana.canal@test.local"
    })
  );

  assert.equal(vendorResult.status, "ok");
  assert.ok(vendorResult.vendor);
  assert.equal(vendorResult.vendor.status, "active");
  assert.match(vendorResult.vendor.code, /^VEND-/);
});

test("permite registrar un vendedor con código comercial friendly", async () => {
  const context = await createContext();

  const vendorResult = context.vendors.createManualVendor(
    buildManualVendor({
      preferredCode: "rapha lima"
    })
  );

  assert.equal(vendorResult.status, "ok");
  assert.ok(vendorResult.vendor);
  assert.equal(vendorResult.vendor.code, "RAPHA-LIMA");
});

test("rechaza alta manual con código comercial duplicado", async () => {
  const context = await createContext();

  context.vendors.createManualVendor(
    buildManualVendor({
      email: "seller.one@test.local",
      preferredCode: "RAPHA-LIMA"
    })
  );

  assert.throws(
    () =>
      context.vendors.createManualVendor(
        buildManualVendor({
          email: "seller.two@test.local",
          preferredCode: "rapha-lima"
        })
      ),
    (error: unknown) => error instanceof ConflictException && error.message === "Ya existe un vendedor con el código RAPHA-LIMA."
  );
});

test("rechaza alta manual con WhatsApp sin código de país", async () => {
  const context = await createContext();

  assert.throws(
    () =>
      context.vendors.createManualVendor(
        buildManualVendor({
          phone: "999111222"
        })
      ),
    (error: unknown) =>
      error instanceof BadRequestException &&
      error.message === "WhatsApp inválido. Usa formato internacional con código de país, por ejemplo +51 998906481."
  );
});

test("una postulación válida queda submitted y bloquea duplicados activos", async () => {
  const context = await createContext();

  const first = context.vendors.submitApplication({
    name: "Camila Growth",
    email: "camila.growth@test.local",
    city: "Lima",
    phone: "+51 999 222 444",
    applicationIntent: "content_creator",
    source: "Landing"
  });

  assert.equal(first.application?.status, "submitted");
  assert.equal(first.application?.applicationIntent, "content_creator");

  assert.throws(
    () =>
      context.vendors.submitApplication({
        name: "Camila Growth",
        email: "camila.growth@test.local",
        city: "Lima",
        phone: "+51 999 222 444",
        applicationIntent: "content_creator",
        source: "Landing"
      }),
    (error: unknown) => error instanceof ConflictException && error.message.includes("postulación activa")
  )
});

test("screening y aprobación generan el vendedor con el tipo final confirmado", async () => {
  const context = await createContext();

  const application = context.vendors.submitApplication({
    name: "Lucia Afiliada",
    email: "lucia.afiliada@test.local",
    city: "Cusco",
    phone: "+51 999 555 888",
    applicationIntent: "affiliate",
    source: "Landing"
  }).application!;

  const screening = context.vendors.screenApplication(application.id, {
    reviewer: "seller_manager",
    notes: "Perfil con fit comercial."
  });
  assert.equal(screening.application?.status, "screening");

  const approved = context.vendors.approveApplication(application.id, {
    reviewer: "seller_manager",
    notes: "Aprobada como afiliada.",
    resolvedCollaborationType: VendorCollaborationType.Affiliate
  });

  assert.equal(approved.application?.status, "approved");
  assert.equal(approved.application?.resolvedCollaborationType, VendorCollaborationType.Affiliate);
  assert.ok(approved.vendor);
  assert.equal(approved.vendor.collaborationType, VendorCollaborationType.Affiliate);
  assert.match(approved.vendor.code, /^AFF-/);
});

test("la aprobación permite fijar un código comercial friendly", async () => {
  const context = await createContext();

  const application = context.vendors.submitApplication({
    name: "Lucia Friendly",
    email: "lucia.friendly@test.local",
    city: "Cusco",
    phone: "+51 999 555 123",
    applicationIntent: "seller",
    source: "Landing"
  }).application!;

  context.vendors.screenApplication(application.id, {
    reviewer: "seller_manager",
    notes: "Lista para aprobar."
  });

  const approved = context.vendors.approveApplication(application.id, {
    reviewer: "seller_manager",
    notes: "Aprobada con código editable.",
    resolvedCollaborationType: VendorCollaborationType.Seller,
    preferredCode: "lucia-cusco"
  });

  assert.ok(approved.vendor);
  assert.equal(approved.vendor.code, "LUCIA-CUSCO");
});

test("la aprobación exige screening previo y tipo comercial final", async () => {
  const context = await createContext();

  const application = context.vendors.submitApplication({
    name: "Rocio Canal",
    email: "rocio.canal@test.local",
    city: "Arequipa",
    phone: "+51 999 101 202",
    applicationIntent: "seller",
    source: "Landing"
  }).application!;

  assert.throws(
    () =>
      context.vendors.approveApplication(application.id, {
        reviewer: "qa",
        resolvedCollaborationType: VendorCollaborationType.Seller
      }),
    (error: unknown) => error instanceof BadRequestException && error.message.includes("aprobar")
  )

  context.vendors.screenApplication(application.id, {
    reviewer: "qa",
    notes: "Pasa a revisión."
  });

  assert.throws(
    () =>
      context.vendors.approveApplication(application.id, {
        reviewer: "qa"
      }),
    (error: unknown) => error instanceof BadRequestException && error.message.includes("tipo comercial final")
  )
});

test("una venta manual confirmada guarda vendedor, canal y fecha de venta", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const result = await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      initialStatus: "paid"
    })
  );

  const detail = context.orders.getOrder(result.orderNumber).data;

  assert.equal(detail.vendorCode, vendor.code);
  assert.equal(detail.vendorName, vendor.name);
  assert.equal(detail.salesChannel, "manual");
  assert.equal(detail.paymentStatus, PaymentStatus.Paid);
  assert.ok(detail.confirmedAt);
});

test("permite asignar, cambiar y retirar vendedor desde un pedido existente", async () => {
  const context = await createContext();
  const vendorA = context.vendors.createManualVendor(buildManualVendor({ email: "seller-edit-a@test.local" })).vendor!;
  const vendorB = context.vendors.createManualVendor(buildManualVendor({ email: "seller-edit-b@test.local" })).vendor!;

  const order = await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      initialStatus: "paid"
    })
  );

  const options = context.orders.listOrderVendorOptions().data;
  assert.ok(options.some((option) => option.code === vendorA.code && option.status === "active"));
  assert.equal("sales" in options[0], false);

  const assigned = await context.orders.assignOrderVendor(order.orderNumber, {
    actor: "qa",
    vendorCode: vendorA.code
  });
  assert.equal(assigned.order.vendorCode, vendorA.code);
  assert.equal(context.orders.getOrder(order.orderNumber).data.vendorName, vendorA.name);

  const reassigned = await context.orders.assignOrderVendor(order.orderNumber, {
    actor: "qa",
    vendorCode: vendorB.code
  });
  assert.equal(reassigned.order.vendorCode, vendorB.code);
  assert.equal(context.orders.getOrder(order.orderNumber).data.vendorName, vendorB.name);

  const cleared = await context.orders.assignOrderVendor(order.orderNumber, {
    actor: "qa",
    vendorCode: ""
  });
  assert.equal(cleared.order.vendorCode, undefined);
  assert.equal(context.orders.getOrder(order.orderNumber).data.vendorName, undefined);
});

test("un pedido manual pendiente reserva stock y al confirmarse consolida la venta", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const result = await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      initialStatus: "pending_payment"
    })
  );

  const reservedRow = await findInventoryRow(context, "HG-PN-001");
  assert.equal(reservedRow.reservedQuantity, 1);
  assert.equal(reservedRow.unitsSold, 0);

  await context.orders.registerAdminManualPayment(result.orderNumber, {
    reviewer: "qa",
    reference: "cash-001"
  });

  const confirmedRow = await findInventoryRow(context, "HG-PN-001");
  assert.equal(confirmedRow.reservedQuantity, 0);
  assert.equal(confirmedRow.unitsSold, 1);
  assert.equal(confirmedRow.availableStock, 4);
});

test("el registro manual directo persiste una traza comercial canonica", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const result = await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      initialStatus: "pending_payment"
    })
  );

  await context.orders.registerAdminManualPayment(result.orderNumber, {
    reviewer: "qa",
    reference: "cash-002",
    notes: "Cobro validado contra caja física."
  });

  const detail = context.orders.getOrder(result.orderNumber).data;

  assert.ok(detail.commercialTrace);
  assert.equal(detail.commercialTrace?.route, "manual_direct");
  assert.equal(detail.commercialTrace?.status, "confirmed");
  assert.equal(detail.commercialTrace?.actor, "qa");
  assert.equal(detail.commercialTrace?.reference, "cash-002");
  assert.equal(detail.commercialTrace?.note, "Cobro validado contra caja física.");
  assert.equal(detail.commercialTrace?.evidenceReference, "cash-002");
  assert.equal(detail.commercialTrace?.evidenceNotes, "Cobro validado contra caja física.");
});

test("una orden openpay no puede registrarse por la ruta de pago manual directo", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const order = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "checkout-openpay-guard-001",
      vendorCode: vendor.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde"
    })
  );

  await assert.rejects(
    () =>
      context.orders.registerAdminManualPayment(order.orderNumber, {
        reviewer: "qa",
        reference: "wrong-path-001"
      }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      error.message === `El pedido ${order.orderNumber} usa pago online. Usa la conciliación online desde backoffice.`
  );
});

test("una orden web valida reserva y luego confirma stock al conciliar el pago", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const order = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "checkout-web-001",
      vendorCode: vendor.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde"
    })
  );

  const reservedRow = await findInventoryRow(context, "HG-CV-001");
  assert.equal(reservedRow.reservedQuantity, 1);
  assert.equal(reservedRow.unitsSold, 0);

  await context.orders.confirmOnlinePayment(order.orderNumber, {
    reviewer: "qa",
    reference: "openpay-verified-001"
  });

  const detail = context.orders.getOrder(order.orderNumber).data;
  const confirmedRow = await findInventoryRow(context, "HG-CV-001");

  assert.equal(detail.salesChannel, "web");
  assert.equal(detail.paymentStatus, PaymentStatus.Paid);
  assert.ok(detail.confirmedAt);
  assert.ok(detail.commercialTrace);
  assert.equal(detail.commercialTrace?.route, "openpay_backoffice");
  assert.equal(detail.commercialTrace?.status, "confirmed");
  assert.equal(detail.commercialTrace?.actor, "qa");
  assert.equal(detail.commercialTrace?.reference, "openpay-verified-001");
  assert.equal(detail.commercialTrace?.note, "Pago online conciliado desde backoffice.");
  assert.equal(confirmedRow.reservedQuantity, 0);
  assert.equal(confirmedRow.unitsSold, 1);
  assert.equal(confirmedRow.availableStock, 7);
});

test("la aprobacion de comprobante manual deja una traza comercial canonica", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const order = await context.orders.createCheckoutOrder(
    buildManualCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "checkout-manual-trace-001",
      vendorCode: vendor.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde",
      evidenceReference: "voucher-manual-001",
      evidenceNotes: "Transferencia enviada por Yape."
    })
  );

  const detailBeforeApproval = context.orders.getOrder(order.orderNumber).data;
  assert.equal(detailBeforeApproval.commercialTrace?.route, "manual_request");
  assert.equal(detailBeforeApproval.commercialTrace?.status, "pending");

  assert.ok(detailBeforeApproval.manualRequest?.id);
  await context.orders.approveManualRequest(
    detailBeforeApproval.manualRequest.id,
    "qa",
    "Comprobante validado contra abono recibido.",
    false
  );

  const detail = context.orders.getOrder(order.orderNumber).data;

  assert.ok(detail.commercialTrace);
  assert.equal(detail.commercialTrace?.route, "manual_request");
  assert.equal(detail.commercialTrace?.status, "confirmed");
  assert.equal(detail.commercialTrace?.actor, "qa");
  assert.equal(detail.commercialTrace?.reference, "voucher-manual-001");
  assert.equal(detail.commercialTrace?.note, "Comprobante validado contra abono recibido.");
  assert.equal(detail.commercialTrace?.evidenceReference, "voucher-manual-001");
  assert.equal(detail.commercialTrace?.evidenceNotes, "Transferencia enviada por Yape.");
});

test("la misma orden web idempotente no descuenta stock dos veces", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const firstInput = buildOpenpayCheckoutInput({
    orderNumber: context.orders.reserveOrderNumber(),
    clientRequestId: "checkout-idem-001",
    vendorCode: vendor.code,
    variantId: "var-premium-negro",
    sku: "HG-PN-001",
    productSlug: "premium-negro",
    productName: "Premium Negro"
  });

  const first = await context.orders.createCheckoutOrder(firstInput);
  const second = await context.orders.createCheckoutOrder({
    ...firstInput,
    orderNumber: context.orders.reserveOrderNumber()
  });

  assert.equal(first.orderNumber, second.orderNumber);
  assert.equal(context.orders.listOrders().data.length, 1);

  await context.orders.confirmOnlinePayment(first.orderNumber, {
    reviewer: "qa",
    reference: "openpay-idem-001"
  });
  await context.orders.confirmOnlinePayment(first.orderNumber, {
    reviewer: "qa",
    reference: "openpay-idem-001"
  });

  const row = await findInventoryRow(context, "HG-PN-001");
  assert.equal(row.unitsSold, 1);
  assert.equal(row.availableStock, 4);
});

test("una venta falla correctamente cuando no hay stock suficiente", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  await assert.rejects(
    () =>
      context.orders.createBackofficeOrder(
        buildBackofficeOrderInput({
          vendorCode: vendor.code,
          variantId: "var-premium-negro",
          sku: "HG-PN-001",
          productSlug: "premium-negro",
          productName: "Premium Negro",
          quantity: 6,
          initialStatus: "paid"
        })
      ),
    (error: unknown) => error instanceof ConflictException && error.message.includes("No hay stock suficiente")
  );
});

test("reconstruir inventario desde pedidos no duplica reservas ni comprometidos persistidos", async () => {
  const warehouse = buildWarehouse({
    id: "wh-lima-central",
    code: "WH-LIMA-CENTRAL",
    name: "Lima Central"
  });
  const variant = buildVariant({
    id: "var-premium-negro",
    productId: "prod-premium-negro",
    productName: "Premium Negro",
    productSlug: "premium-negro",
    sku: "HG-PN-001",
    variantName: "Premium Negro 10 ml",
    stockOnHand: 10,
    warehouseBalances: [
      {
        warehouseId: warehouse.id,
        variantId: "var-premium-negro",
        stockOnHand: 10,
        reservedQuantity: 4,
        committedQuantity: 5,
        updatedAt: new Date("2026-04-01T12:00:00.000Z")
      }
    ]
  });
  const inventory = new InventoryService(
    new PrismaStub([variant], [warehouse]) as never,
    new MemoryModuleStateService() as never
  );

  await inventory.onModuleInit();
  await inventory.rebuildFromOrders([
    {
      orderNumber: "HG-REBUILD-1",
      orderStatus: OrderStatus.Confirmed,
      createdAt: "2026-04-02T12:00:00.000Z",
      occurredAt: "2026-04-02T12:00:00.000Z",
      items: [
        {
          slug: "premium-negro",
          name: "Premium Negro",
          sku: "HG-PN-001",
          variantId: "var-premium-negro",
          quantity: 2,
          unitPrice: 60,
          lineTotal: 120
        }
      ]
    }
  ]);

  const row = (await inventory.getAdminReport()).data.rows.find((entry) => entry.sku === "HG-PN-001");
  assert.ok(row);
  assert.equal(row.stockOnHand, 10);
  assert.equal(row.reservedQuantity, 0);
  assert.equal(row.committedQuantity, 2);
  assert.equal(row.availableStock, 8);
  assert.equal(row.unitsSold, 2);
});

test("el reporte separa saldo por almacen y descuenta solo el origen asignado", async () => {
  const context = await createContext({
    warehouses: [
      buildWarehouse({
        id: "wh-lima-central",
        code: "WH-LIMA-CENTRAL",
        name: "Lima Central"
      }),
      buildWarehouse({
        id: "wh-arequipa-sur",
        code: "WH-AREQUIPA-SUR",
        name: "Arequipa Sur",
        priority: 1,
        departmentCode: "04",
        departmentName: "Arequipa",
        provinceCode: "0401",
        provinceName: "Arequipa",
        districtCode: "040129",
        districtName: "José Luis Bustamante y Rivero"
      })
    ],
    variants: [
      buildVariant({
        id: "var-premium-negro",
        productId: "prod-premium-negro",
        productName: "Premium Negro",
        productSlug: "premium-negro",
        sku: "HG-PN-001",
        variantName: "Premium Negro 10 ml",
        stockOnHand: 12,
        warehouseBalances: [
          {
            warehouseId: "wh-lima-central",
            variantId: "var-premium-negro",
            stockOnHand: 7,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          },
          {
            warehouseId: "wh-arequipa-sur",
            variantId: "var-premium-negro",
            stockOnHand: 5,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          }
        ]
      })
    ]
  });
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      initialStatus: "pending_payment"
    })
  );

  const rows = await findInventoryRows(context, "HG-PN-001");
  assert.equal(rows.length, 2);

  const limaRow = rows.find((row) => row.warehouseId === "wh-lima-central");
  const arequipaRow = rows.find((row) => row.warehouseId === "wh-arequipa-sur");

  assert.ok(limaRow);
  assert.ok(arequipaRow);
  assert.equal(limaRow.stockOnHand, 7);
  assert.equal(limaRow.reservedQuantity, 1);
  assert.equal(limaRow.availableStock, 6);
  assert.equal(arequipaRow.stockOnHand, 5);
  assert.equal(arequipaRow.reservedQuantity, 0);
  assert.equal(arequipaRow.availableStock, 5);
  assert.equal(limaRow.variantAvailableStock, 11);
  assert.equal(arequipaRow.variantAvailableStock, 11);
});

test("una transferencia reserva, despacha y recibe stock sin mezclar almacenes", async () => {
  const context = await createContext({
    warehouses: [
      buildWarehouse({
        id: "wh-lima-central",
        code: "WH-LIMA-CENTRAL",
        name: "Lima Central"
      }),
      buildWarehouse({
        id: "wh-arequipa-sur",
        code: "WH-AREQUIPA-SUR",
        name: "Arequipa Sur",
        priority: 1,
        departmentCode: "04",
        departmentName: "Arequipa",
        provinceCode: "0401",
        provinceName: "Arequipa",
        districtCode: "040129",
        districtName: "José Luis Bustamante y Rivero"
      })
    ],
    variants: [
      buildVariant({
        id: "var-premium-negro",
        productId: "prod-premium-negro",
        productName: "Premium Negro",
        productSlug: "premium-negro",
        sku: "HG-PN-001",
        variantName: "Premium Negro 10 ml",
        stockOnHand: 12,
        warehouseBalances: [
          {
            warehouseId: "wh-lima-central",
            variantId: "var-premium-negro",
            stockOnHand: 7,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          },
          {
            warehouseId: "wh-arequipa-sur",
            variantId: "var-premium-negro",
            stockOnHand: 5,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          }
        ]
      })
    ]
  });

  const created = await context.transfers.createTransfer({
    originWarehouseId: "wh-lima-central",
    destinationWarehouseId: "wh-arequipa-sur",
    reason: "Reabastecimiento regional",
    lines: [
      {
        variantId: "var-premium-negro",
        quantity: 2
      }
    ]
  });

  assert.equal(created.transfer?.status, "reserved");
  let rows = await findInventoryRows(context, "HG-PN-001");
  let limaRow = rows.find((row) => row.warehouseId === "wh-lima-central");
  let arequipaRow = rows.find((row) => row.warehouseId === "wh-arequipa-sur");
  assert.ok(limaRow);
  assert.ok(arequipaRow);
  assert.equal(limaRow.reservedQuantity, 2);
  assert.equal(limaRow.stockOnHand, 7);
  assert.equal(limaRow.availableStock, 5);
  assert.equal(arequipaRow.reservedQuantity, 0);
  assert.equal(arequipaRow.stockOnHand, 5);
  assert.equal(arequipaRow.availableStock, 5);

  const transferId = created.transfer?.id;
  assert.ok(transferId);

  const dispatched = await context.transfers.dispatchTransfer(transferId, {});
  assert.equal(dispatched.transfer?.status, "in_transit");
  rows = await findInventoryRows(context, "HG-PN-001");
  limaRow = rows.find((row) => row.warehouseId === "wh-lima-central");
  arequipaRow = rows.find((row) => row.warehouseId === "wh-arequipa-sur");
  assert.ok(limaRow);
  assert.ok(arequipaRow);
  assert.equal(limaRow.reservedQuantity, 0);
  assert.equal(limaRow.stockOnHand, 5);
  assert.equal(limaRow.availableStock, 5);
  assert.equal(arequipaRow.stockOnHand, 5);
  assert.equal(arequipaRow.availableStock, 5);

  const received = await context.transfers.receiveTransfer(transferId, {});
  assert.equal(received.transfer?.status, "received");
  rows = await findInventoryRows(context, "HG-PN-001");
  limaRow = rows.find((row) => row.warehouseId === "wh-lima-central");
  arequipaRow = rows.find((row) => row.warehouseId === "wh-arequipa-sur");
  assert.ok(limaRow);
  assert.ok(arequipaRow);
  assert.equal(limaRow.stockOnHand, 5);
  assert.equal(limaRow.availableStock, 5);
  assert.equal(arequipaRow.stockOnHand, 7);
  assert.equal(arequipaRow.availableStock, 7);
});

test("una transferencia puede recibir parcialmente, abrir incidencia y reconciliarse sin editar balances", async () => {
  const context = await createContext({
    warehouses: [
      buildWarehouse({
        id: "wh-lima-central",
        code: "WH-LIMA-CENTRAL",
        name: "Lima Central"
      }),
      buildWarehouse({
        id: "wh-arequipa-sur",
        code: "WH-AREQUIPA-SUR",
        name: "Arequipa Sur",
        priority: 1,
        departmentCode: "04",
        departmentName: "Arequipa",
        provinceCode: "0401",
        provinceName: "Arequipa",
        districtCode: "040129",
        districtName: "José Luis Bustamante y Rivero"
      })
    ],
    variants: [
      buildVariant({
        id: "var-premium-negro",
        productId: "prod-premium-negro",
        productName: "Premium Negro",
        productSlug: "premium-negro",
        sku: "HG-PN-001",
        variantName: "Premium Negro 10 ml",
        stockOnHand: 12,
        warehouseBalances: [
          {
            warehouseId: "wh-lima-central",
            variantId: "var-premium-negro",
            stockOnHand: 7,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          },
          {
            warehouseId: "wh-arequipa-sur",
            variantId: "var-premium-negro",
            stockOnHand: 5,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          }
        ]
      })
    ]
  });

  const created = await context.transfers.createTransfer({
    originWarehouseId: "wh-lima-central",
    destinationWarehouseId: "wh-arequipa-sur",
    reason: "Recepción parcial de prueba",
    lines: [
      {
        variantId: "var-premium-negro",
        quantity: 2
      }
    ]
  });

  const transferId = created.transfer?.id;
  assert.ok(transferId);

  await context.transfers.dispatchTransfer(transferId, {});
  const partial = await context.transfers.receiveTransfer(transferId, {
    lines: [
      {
        variantId: "var-premium-negro",
        quantity: 1
      }
    ],
    incidentKind: "missing",
    incidentNotes: "Falta una unidad al cierre de ruta."
  });

  assert.equal(partial.transfer?.status, "partial_received");
  assert.equal(partial.transfer?.incident?.status, "open");
  assert.equal(partial.transfer?.incident?.kind, "missing");
  assert.equal(partial.transfer?.incident?.totalDifferenceUnits, -1);
  assert.equal(partial.transfer?.receivedUnits, 1);
  assert.equal(partial.transfer?.pendingUnits, 1);

  const rowsAfterPartial = await findInventoryRows(context, "HG-PN-001");
  const destinationAfterPartial = rowsAfterPartial.find((row) => row.warehouseId === "wh-arequipa-sur");
  assert.ok(destinationAfterPartial);
  assert.equal(destinationAfterPartial.stockOnHand, 6);

  const reconciled = await context.transfers.reconcileTransfer(transferId, {
    notes: "Diferencia registrada y cerrada por operación."
  });

  assert.equal(reconciled.transfer?.status, "received");
  assert.equal(reconciled.transfer?.incident?.status, "resolved");
  assert.equal(reconciled.transfer?.incident?.totalDifferenceUnits, -1);

  const rowsAfterReconcile = await findInventoryRows(context, "HG-PN-001");
  const originAfterReconcile = rowsAfterReconcile.find((row) => row.warehouseId === "wh-lima-central");
  const destinationAfterReconcile = rowsAfterReconcile.find((row) => row.warehouseId === "wh-arequipa-sur");
  assert.ok(originAfterReconcile);
  assert.ok(destinationAfterReconcile);
  assert.equal(originAfterReconcile.stockOnHand, 5);
  assert.equal(destinationAfterReconcile.stockOnHand, 6);
});

test("una transferencia genera paquete, GRE y sticker persistidos sobre el mismo transferNumber", async () => {
  const context = await createContext({
    warehouses: [
      buildWarehouse({
        id: "wh-lima-central",
        code: "WH-LIMA-CENTRAL",
        name: "Lima Central"
      }),
      buildWarehouse({
        id: "wh-arequipa-sur",
        code: "WH-AREQUIPA-SUR",
        name: "Arequipa Sur",
        priority: 1,
        departmentCode: "04",
        departmentName: "Arequipa",
        provinceCode: "0401",
        provinceName: "Arequipa",
        districtCode: "040129",
        districtName: "José Luis Bustamante y Rivero"
      })
    ],
    variants: [
      buildVariant({
        id: "var-premium-negro",
        productId: "prod-premium-negro",
        productName: "Premium Negro",
        productSlug: "premium-negro",
        sku: "HG-PN-001",
        variantName: "Premium Negro 10 ml",
        stockOnHand: 12,
        warehouseBalances: [
          {
            warehouseId: "wh-lima-central",
            variantId: "var-premium-negro",
            stockOnHand: 7,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          },
          {
            warehouseId: "wh-arequipa-sur",
            variantId: "var-premium-negro",
            stockOnHand: 5,
            reservedQuantity: 0,
            committedQuantity: 0,
            updatedAt: new Date("2026-04-01T12:00:00.000Z")
          }
        ]
      })
    ]
  });

  const created = await context.transfers.createTransfer({
    originWarehouseId: "wh-lima-central",
    destinationWarehouseId: "wh-arequipa-sur",
    reason: "Documentación logística",
    lines: [
      {
        variantId: "var-premium-negro",
        quantity: 2
      }
    ]
  });

  const transferId = created.transfer?.id;
  assert.ok(transferId);

  const packageSnapshot = await context.transfers.createPackageSnapshot(transferId, {
    notes: "Paquete consolidado para traslado."
  });
  const gre = await context.transfers.createGre(transferId, {
    transportMode: "private",
    notes: "Documento legal preparado para salida."
  });
  const sticker = await context.transfers.createSticker(transferId, {
    notes: "Sticker de caja derivado del mismo snapshot."
  });

  assert.equal(packageSnapshot.transfer?.transferNumber, "TR-000001");
  assert.equal(gre.transfer?.transferNumber, "TR-000001");
  assert.equal(sticker.transfer?.transferNumber, "TR-000001");
  assert.equal(packageSnapshot.transfer?.logistics?.packageSnapshot?.packageId, "PKG-TR-000001");
  assert.equal(gre.transfer?.logistics?.gre?.referenceCode, "GRE-TR-000001");
  assert.equal(sticker.transfer?.logistics?.sticker?.stickerCode, "STK-TR-000001");
  assert.equal(sticker.transfer?.logistics?.sticker?.guideReference, "GRE-TR-000001");

  const persisted = (await context.transfers.getTransfer(transferId)).data;
  assert.equal(persisted.logistics?.packageSnapshot?.packageId, "PKG-TR-000001");
  assert.equal(persisted.logistics?.gre?.referenceCode, "GRE-TR-000001");
  assert.equal(persisted.logistics?.sticker?.stickerCode, "STK-TR-000001");
  assert.equal((persisted.logistics?.packageSnapshot?.lines ?? []).length, 1);

  await context.transfers.dispatchTransfer(transferId, {});
  await context.transfers.receiveTransfer(transferId, {});

  const finalized = (await context.transfers.getTransfer(transferId)).data;
  assert.equal(finalized.status, "received");
  assert.equal(finalized.logistics?.packageSnapshot?.packageId, "PKG-TR-000001");
  assert.equal(finalized.logistics?.gre?.referenceCode, "GRE-TR-000001");
  assert.equal(finalized.logistics?.sticker?.stickerCode, "STK-TR-000001");
});

test("el reporte por vendedor agrega ventas confirmadas por canal y total", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      quantity: 1,
      unitPrice: 60,
      initialStatus: "paid"
    })
  );

  const webOrder = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "report-vendor-001",
      vendorCode: vendor.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde",
      quantity: 1,
      unitPrice: 55
    })
  );
  await context.orders.confirmOnlinePayment(webOrder.orderNumber, {
    reviewer: "qa",
    reference: "report-vendor-confirm"
  });

  const { from, to } = periodRange();
  const report = context.core.getReportByPeriod(from, to).data;
  const vendorRow = report.vendors.rows.find((row) => row.vendorCode === vendor.code);

  assert.ok(vendorRow);
  assert.equal(vendorRow.salesCount, 2);
  assert.equal(vendorRow.totalRevenue, 115);
  assert.equal(vendorRow.webSalesCount, 1);
  assert.equal(vendorRow.manualSalesCount, 1);
});

test("el reporte por producto agrega unidades e ingresos correctos", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      quantity: 2,
      unitPrice: 60,
      initialStatus: "paid"
    })
  );

  const webOrder = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "report-product-001",
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      quantity: 1,
      unitPrice: 60
    })
  );
  await context.orders.confirmOnlinePayment(webOrder.orderNumber, {
    reviewer: "qa",
    reference: "report-product-confirm"
  });

  const { from, to } = periodRange();
  const report = context.core.getReportByPeriod(from, to).data;
  const productRow = report.products.rows.find((row) => row.sku === "HG-PN-001");

  assert.ok(productRow);
  assert.equal(productRow.unitsSold, 3);
  assert.equal(productRow.totalRevenue, 180);
  assert.equal(productRow.webUnitsSold, 1);
  assert.equal(productRow.manualUnitsSold, 2);
});

test("la fecha de venta persiste y alimenta el detalle de reportes", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const order = await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde",
      initialStatus: "paid"
    })
  );

  const detail = context.orders.getOrder(order.orderNumber).data;
  const { from, to } = periodRange();
  const report = context.core.getReportByPeriod(from, to).data;
  const saleDetail = report.sales.details.find((row) => row.orderNumber === order.orderNumber);

  assert.ok(detail.confirmedAt);
  assert.ok(saleDetail);
  assert.equal(saleDetail.confirmedAt, detail.confirmedAt);
  assert.equal(saleDetail.vendorCode, vendor.code);
});

test("el reporte permite filtrar ventas por canal y vendedor", async () => {
  const context = await createContext();
  const vendorA = context.vendors.createManualVendor(buildManualVendor({ email: "seller-a@test.local" })).vendor!;
  const vendorB = context.vendors.createManualVendor(buildManualVendor({ email: "seller-b@test.local" })).vendor!;

  await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendorA.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      quantity: 1,
      unitPrice: 60,
      initialStatus: "paid"
    })
  );

  const webOrderA = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "report-filter-vendor-a",
      vendorCode: vendorA.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde",
      quantity: 1,
      unitPrice: 55
    })
  );
  await context.orders.confirmOnlinePayment(webOrderA.orderNumber, {
    reviewer: "qa",
    reference: "report-filter-vendor-a-confirm"
  });

  const webOrderB = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "report-filter-vendor-b",
      vendorCode: vendorB.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      quantity: 1,
      unitPrice: 60
    })
  );
  await context.orders.confirmOnlinePayment(webOrderB.orderNumber, {
    reviewer: "qa",
    reference: "report-filter-vendor-b-confirm"
  });

  const { from, to } = periodRange();
  const report = context.core.getReportByPeriod(from, to, {
    salesChannel: "web",
    vendorCode: vendorA.code
  }).data;

  assert.equal(report.orders.total, 1);
  assert.equal(report.sales.totalConfirmed, 1);
  assert.equal(report.sales.totalRevenue, 55);
  assert.deepEqual(report.vendors.rows.map((row) => row.vendorCode), [vendorA.code]);
  assert.equal(report.vendors.rows[0]?.webSalesCount, 1);
  assert.equal(report.vendors.rows[0]?.manualSalesCount, 0);
  assert.ok(report.sales.details.every((row) => row.salesChannel === "web"));
  assert.ok(report.sales.details.every((row) => row.vendorCode === vendorA.code));
});

test("el filtro por producto recorta detalle, ingresos y exportación CSV", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const mixedOrderInput = buildBackofficeOrderInput({
    vendorCode: vendor.code,
    variantId: "var-premium-negro",
    sku: "HG-PN-001",
    productSlug: "premium-negro",
    productName: "Premium Negro",
    quantity: 1,
    unitPrice: 60,
    initialStatus: "paid"
  });
  mixedOrderInput.items = [
    {
      slug: "premium-negro",
      name: "Premium Negro",
      sku: "HG-PN-001",
      variantId: "var-premium-negro",
      quantity: 1,
      unitPrice: 60
    },
    {
      slug: "clasico-verde",
      name: "Clasico Verde",
      sku: "HG-CV-001",
      variantId: "var-clasico-verde",
      quantity: 1,
      unitPrice: 55
    }
  ];
  const mixedOrder = await context.orders.createBackofficeOrder(mixedOrderInput);

  const clasicoOnlyOrder = await context.orders.createCheckoutOrder(
    buildOpenpayCheckoutInput({
      orderNumber: context.orders.reserveOrderNumber(),
      clientRequestId: "report-filter-product-only-clasico",
      vendorCode: vendor.code,
      variantId: "var-clasico-verde",
      sku: "HG-CV-001",
      productSlug: "clasico-verde",
      productName: "Clasico Verde",
      quantity: 1,
      unitPrice: 55
    })
  );
  await context.orders.confirmOnlinePayment(clasicoOnlyOrder.orderNumber, {
    reviewer: "qa",
    reference: "report-filter-product-only-clasico-confirm"
  });

  const { from, to } = periodRange();
  const report = context.core.getReportByPeriod(from, to, {
    productSlug: "premium-negro"
  }).data;

  assert.equal(report.orders.total, 1);
  assert.equal(report.orders.revenue, 60);
  assert.equal(report.sales.totalConfirmed, 1);
  assert.equal(report.sales.totalRevenue, 60);
  assert.equal(report.products.rows.length, 1);
  assert.equal(report.products.rows[0]?.productSlug, "premium-negro");
  assert.equal(report.products.rows[0]?.unitsSold, 1);
  assert.ok(report.sales.details.every((row) => row.productSlug === "premium-negro"));

  const csv = context.core.generateOrdersCsv(from, to, {
    productSlug: "premium-negro"
  });

  assert.match(csv, new RegExp(mixedOrder.orderNumber));
  assert.doesNotMatch(csv, new RegExp(clasicoOnlyOrder.orderNumber));
  assert.match(csv, /,60,/);
});

test("una cancelacion o reembolso revierte el stock comprometido", async () => {
  const context = await createContext();
  const vendor = context.vendors.createManualVendor(buildManualVendor()).vendor!;

  const order = await context.orders.createBackofficeOrder(
    buildBackofficeOrderInput({
      vendorCode: vendor.code,
      variantId: "var-premium-negro",
      sku: "HG-PN-001",
      productSlug: "premium-negro",
      productName: "Premium Negro",
      initialStatus: "paid"
    })
  );

  const beforeRefund = await findInventoryRow(context, "HG-PN-001");
  assert.equal(beforeRefund.availableStock, 4);

  await context.orders.transitionOrderStatus(order.orderNumber, {
    status: OrderStatus.Refunded,
    actor: "qa",
    note: "Reversion por prueba automatizada."
  });

  const afterRefund = await findInventoryRow(context, "HG-PN-001");
  assert.equal(afterRefund.reservedQuantity, 0);
  assert.equal(afterRefund.availableStock, 5);

  const { from, to } = periodRange();
  const report = context.core.getReportByPeriod(from, to).data;
  assert.equal(report.sales.totalConfirmed, 0);
  assert.equal(report.sales.details.some((row) => row.orderNumber === order.orderNumber), false);
});
