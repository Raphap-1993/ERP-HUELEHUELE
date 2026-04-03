import assert from "node:assert/strict";
import { test } from "node:test";
import { BadRequestException, ConflictException } from "@nestjs/common";
import {
  OrderStatus,
  PaymentStatus,
  ProductSalesChannel,
  VendorCollaborationType
} from "@huelegood/shared";
import { CoreService } from "../src/modules/core/core.service";
import { InventoryService } from "../src/modules/inventory/inventory.service";
import { OrdersService } from "../src/modules/orders/orders.service";
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
  constructor(private readonly variants: TestVariantRecord[]) {}

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

  private cloneVariant(variant: TestVariantRecord): TestVariantRecord {
    return {
      ...variant,
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

function buildVariant(input: {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  variantName: string;
  stockOnHand: number;
  salesChannel?: ProductSalesChannel;
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

async function createContext() {
  const prisma = new PrismaStub([
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
  ]);
  const moduleState = new MemoryModuleStateService();
  const audit = new AuditStub();
  const notifications = new NotificationsStub();
  const observability = new ObservabilityStub();
  const loyalty = new LoyaltyStub();
  const payments = new PaymentsStub();
  const commissions = new CommissionsStub();
  const wholesale = new WholesaleStub();
  const marketing = new MarketingStub();

  const inventory = new InventoryService(prisma as never, moduleState as never);
  const vendors = new VendorsService(audit as never, moduleState as never);
  const orders = new OrdersService(
    audit as never,
    inventory as never,
    loyalty as never,
    notifications as never,
    observability as never,
    vendors as never,
    moduleState as never
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
  await orders.onModuleInit();

  return {
    inventory,
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
        phone: "999222333"
      },
      address: {
        recipientName: "Carlos Rojas",
        line1: "Jr. Test 456",
        city: "Lima",
        region: "Lima",
        postalCode: "15001",
        countryCode: "PE"
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

function periodRange() {
  return {
    from: "2026-03-01",
    to: "2026-04-30"
  };
}

async function findInventoryRow(context: Awaited<ReturnType<typeof createContext>>, sku: string) {
  const report = await context.inventory.getAdminReport();
  const row = report.data.rows.find((entry) => entry.sku === sku);
  assert.ok(row, `No encontramos la fila de inventario para ${sku}.`);
  return row;
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
  assert.equal(confirmedRow.reservedQuantity, 0);
  assert.equal(confirmedRow.unitsSold, 1);
  assert.equal(confirmedRow.availableStock, 7);
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
});
