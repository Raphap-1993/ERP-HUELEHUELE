import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException, OnModuleInit } from "@nestjs/common";
import { createHash } from "node:crypto";
import {
  type AdminManualPaymentCreateInput,
  CrmStage,
  type AdminOrderStatusTransitionInput,
  ManualPaymentRequestStatus,
  LoyaltyMovementStatus,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  type SalesChannelValue,
  type AdminManualPaymentRequestSummary,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type AdminPaymentSummary,
  type CheckoutAddressInput,
  type CheckoutCarrier,
  type CheckoutCustomerInput,
  type CheckoutDeliveryMode,
  type CheckoutDocumentType,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type InventoryAllocationSummary,
  type OrderItemSummary,
  type OrderStatusHistorySummary
} from "@huelegood/shared";
import { wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ObservabilityService } from "../observability/observability.service";
import { ModuleStateService } from "../../persistence/module-state.service";
import { VendorsService } from "../vendors/vendors.service";

interface CreateCheckoutOrderInput {
  orderNumber: string;
  quote: CheckoutQuoteSummary;
  request: CheckoutRequestInput;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  providerReference: string;
  checkoutUrl?: string;
  manualStatus?: ManualPaymentRequestStatus;
}

interface CheckoutIdempotencyRecord {
  orderNumber: string;
  requestHash: string;
  createdAt: string;
}

interface OrdersSnapshot {
  orders: AdminOrderDetail[];
  idempotencyIndex: Record<string, CheckoutIdempotencyRecord>;
}

interface VendorTraceSnapshot {
  vendorId?: string;
  vendorCode?: string;
  vendorName?: string;
}

const statusLabels: Record<OrderStatus, string> = {
  [OrderStatus.Draft]: "Pedido creado",
  [OrderStatus.PendingPayment]: "Pendiente de pago",
  [OrderStatus.PaymentUnderReview]: "Pago en revisión",
  [OrderStatus.Paid]: "Pago confirmado",
  [OrderStatus.Confirmed]: "Confirmado por operación",
  [OrderStatus.Preparing]: "Preparación en curso",
  [OrderStatus.Shipped]: "Enviado",
  [OrderStatus.Delivered]: "Entregado",
  [OrderStatus.Completed]: "Completado",
  [OrderStatus.Cancelled]: "Cancelado",
  [OrderStatus.Refunded]: "Reembolsado",
  [OrderStatus.Expired]: "Expirado"
};
const validCheckoutDocumentTypes = new Set<CheckoutDocumentType>(["dni", "ce", "ruc", "passport", "other_sunat"]);

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeDocumentType(value?: CheckoutDocumentType): CheckoutDocumentType | undefined {
  return value && validCheckoutDocumentTypes.has(value) ? value : undefined;
}

function normalizeDocumentNumber(value?: string, documentType?: CheckoutDocumentType) {
  const raw = value?.trim().toUpperCase();
  if (!raw) {
    return undefined;
  }

  const normalized = documentType === "dni" || documentType === "ruc" ? raw.replace(/\D/g, "") : raw.replace(/[^0-9A-Z-]/g, "");
  return normalized ? normalized : undefined;
}

function isValidDocumentNumber(documentType: CheckoutDocumentType, documentNumber?: string) {
  if (!documentNumber) {
    return false;
  }

  switch (documentType) {
    case "dni":
      return /^\d{8}$/.test(documentNumber);
    case "ruc":
      return /^\d{11}$/.test(documentNumber);
    case "ce":
      return /^[A-Z0-9-]{6,15}$/.test(documentNumber);
    case "passport":
      return /^[A-Z0-9-]{6,15}$/.test(documentNumber);
    case "other_sunat":
      return /^[A-Z0-9-]{3,20}$/.test(documentNumber);
    default:
      return false;
  }
}

function normalizeDeliveryMode(value?: CheckoutDeliveryMode): CheckoutDeliveryMode {
  return value === "province_shalom_pickup" ? "province_shalom_pickup" : "standard";
}

function normalizeCarrier(value?: CheckoutCarrier, deliveryMode: CheckoutDeliveryMode = "standard"): CheckoutCarrier | undefined {
  if (value === "shalom" || value === "olva_courier") {
    return value;
  }

  return deliveryMode === "province_shalom_pickup" ? "shalom" : undefined;
}

function createHistoryEntry(status: OrderStatus, actor: string, note: string, occurredAt: string): OrderStatusHistorySummary {
  return {
    status,
    label: statusLabels[status],
    actor,
    occurredAt,
    note
  };
}

function resolveNotificationStatus(orderStatus: OrderStatus, paymentStatus: PaymentStatus) {
  if (paymentStatus === PaymentStatus.Paid || orderStatus === OrderStatus.Paid || orderStatus === OrderStatus.Confirmed) {
    return NotificationStatus.Sent;
  }

  if (paymentStatus === PaymentStatus.Failed || orderStatus === OrderStatus.Cancelled) {
    return NotificationStatus.Failed;
  }

  return NotificationStatus.Pending;
}

function resolveInitialCrmStage(orderStatus: OrderStatus, paymentStatus: PaymentStatus) {
  if (
    paymentStatus === PaymentStatus.Paid ||
    orderStatus === OrderStatus.Paid ||
    orderStatus === OrderStatus.Confirmed
  ) {
    return CrmStage.ReadyForFollowUp;
  }

  return undefined;
}

function resolveOperationalCrmStage(orderStatus: OrderStatus, paymentStatus: PaymentStatus) {
  if (paymentStatus !== PaymentStatus.Paid) {
    return undefined;
  }

  if (orderStatus === OrderStatus.Delivered || orderStatus === OrderStatus.Completed) {
    return CrmStage.Closed;
  }

  if (orderStatus === OrderStatus.Preparing || orderStatus === OrderStatus.Shipped) {
    return CrmStage.FollowUp;
  }

  if (orderStatus === OrderStatus.Paid || orderStatus === OrderStatus.Confirmed) {
    return CrmStage.ReadyForFollowUp;
  }

  return undefined;
}

const operationalTransitions: Partial<Record<OrderStatus, readonly OrderStatus[]>> = {
  [OrderStatus.Draft]: [OrderStatus.PendingPayment, OrderStatus.Cancelled],
  [OrderStatus.PendingPayment]: [OrderStatus.PaymentUnderReview, OrderStatus.Cancelled, OrderStatus.Expired],
  [OrderStatus.PaymentUnderReview]: [OrderStatus.Cancelled],
  [OrderStatus.Paid]: [OrderStatus.Confirmed, OrderStatus.Refunded],
  [OrderStatus.Confirmed]: [OrderStatus.Preparing, OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Completed, OrderStatus.Refunded],
  [OrderStatus.Preparing]: [OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Completed, OrderStatus.Refunded],
  [OrderStatus.Shipped]: [OrderStatus.Delivered, OrderStatus.Completed, OrderStatus.Refunded],
  [OrderStatus.Delivered]: [OrderStatus.Completed, OrderStatus.Refunded]
};

function fullName(customer: CheckoutCustomerInput) {
  return [customer.firstName, customer.lastName].map((part) => part.trim()).filter(Boolean).join(" ");
}

function normalizeCustomer(customer: CheckoutCustomerInput) {
  const documentType = normalizeDocumentType(customer.documentType);

  return {
    firstName: customer.firstName.trim(),
    lastName: customer.lastName.trim(),
    email: customer.email.trim().toLowerCase(),
    phone: customer.phone.trim(),
    documentType,
    documentNumber: normalizeDocumentNumber(customer.documentNumber, documentType)
  };
}

function normalizeAddress(address: CheckoutAddressInput) {
  const deliveryMode = normalizeDeliveryMode(address.deliveryMode);

  return {
    label: normalizeText(address.label),
    recipientName: address.recipientName.trim(),
    line1: address.line1.trim(),
    line2: normalizeText(address.line2),
    city: address.city.trim(),
    region: address.region.trim(),
    postalCode: address.postalCode.trim(),
    countryCode: address.countryCode?.trim().toUpperCase() || "PE",
    deliveryMode,
    carrier: normalizeCarrier(address.carrier, deliveryMode),
    agencyName: normalizeText(address.agencyName),
    payOnPickup: deliveryMode === "province_shalom_pickup" ? true : address.payOnPickup === true ? true : undefined
  };
}

function isStatusPaidLike(status: OrderStatus) {
  return (
    status === OrderStatus.Paid ||
    status === OrderStatus.Confirmed ||
    status === OrderStatus.Preparing ||
    status === OrderStatus.Shipped ||
    status === OrderStatus.Delivered ||
    status === OrderStatus.Completed
  );
}

function cloneInventoryAllocations(allocations?: InventoryAllocationSummary[]) {
  return allocations?.map((allocation) => ({ ...allocation }));
}

function buildOrderItems(items: CheckoutQuoteSummary["items"]): OrderItemSummary[] {
  return items.map((item) => ({
    slug: item.slug,
    name: item.name,
    sku: item.sku,
    variantId: item.variantId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    inventoryAllocations: cloneInventoryAllocations(item.inventoryAllocations)
  }));
}

function cloneOrderItems(items: OrderItemSummary[]) {
  return items.map((item) => ({
    ...item,
    inventoryAllocations: cloneInventoryAllocations(item.inventoryAllocations)
  }));
}

function normalizeQuoteItems(items: CheckoutQuoteSummary["items"]) {
  return [...items]
    .map((item) => ({
      slug: item.slug.trim(),
      name: item.name.trim(),
      sku: item.sku.trim(),
      variantId: item.variantId?.trim() || undefined,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      inventoryAllocations: cloneInventoryAllocations(item.inventoryAllocations)
    }))
    .sort(
      (left, right) =>
        left.slug.localeCompare(right.slug) ||
        (left.variantId ?? "").localeCompare(right.variantId ?? "") ||
        left.quantity - right.quantity
    );
}

function normalizeCheckoutRequest(input: CreateCheckoutOrderInput) {
  const request = input.request;

  return {
    orderStatus: input.orderStatus,
    paymentStatus: input.paymentStatus,
    checkoutUrl: input.checkoutUrl ?? null,
    manualStatus: input.manualStatus ?? null,
    quote: {
      items: normalizeQuoteItems(input.quote.items),
      subtotal: input.quote.subtotal,
      discount: input.quote.discount,
      shipping: input.quote.shipping,
      grandTotal: input.quote.grandTotal,
      currencyCode: input.quote.currencyCode,
      vendorCode: normalizeCode(input.quote.vendorCode) ?? null,
      couponCode: normalizeCode(input.quote.couponCode) ?? null,
      paymentMethod: input.quote.paymentMethod,
      estimatedPoints: input.quote.estimatedPoints
    },
    request: {
      clientRequestId: normalizeText(request.clientRequestId) ?? null,
      paymentMethod: request.paymentMethod,
      vendorCode: normalizeCode(request.vendorCode) ?? null,
      couponCode: normalizeCode(request.couponCode) ?? null,
      notes: normalizeText(request.notes) ?? null,
      manualEvidenceReference: normalizeText(request.manualEvidenceReference) ?? null,
      manualEvidenceNotes: normalizeText(request.manualEvidenceNotes) ?? null,
      customer: {
        firstName: request.customer.firstName.trim(),
        lastName: request.customer.lastName.trim(),
        email: request.customer.email.trim().toLowerCase(),
        phone: request.customer.phone.trim(),
        documentType: normalizeDocumentType(request.customer.documentType) ?? null,
        documentNumber:
          normalizeDocumentNumber(request.customer.documentNumber, normalizeDocumentType(request.customer.documentType)) ?? null
      },
      address: normalizeAddress(request.address),
      items: request.items
        .map((item) => ({
          slug: item.slug.trim(),
          quantity: item.quantity,
          variantId: item.variantId?.trim() || null
        }))
        .sort(
          (left, right) =>
            left.slug.localeCompare(right.slug) ||
            (left.variantId ?? "").localeCompare(right.variantId ?? "") ||
            left.quantity - right.quantity
        )
    }
  };
}

function hashCheckoutRequest(input: CreateCheckoutOrderInput) {
  return createHash("sha256").update(JSON.stringify(normalizeCheckoutRequest(input))).digest("hex");
}

function isManualRequestResolvable(status: ManualPaymentRequestStatus) {
  return status === ManualPaymentRequestStatus.Submitted || status === ManualPaymentRequestStatus.UnderReview;
}

function manualRequestResolutionLabel(status: ManualPaymentRequestStatus) {
  if (status === ManualPaymentRequestStatus.Approved) {
    return "aprobada";
  }

  if (status === ManualPaymentRequestStatus.Rejected) {
    return "rechazada";
  }

  return status;
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function demoRuntimeEnabled() {
  const value = process.env.HUELEGOOD_ENABLE_DEMO_DATA?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

const demoOrderNumbers = new Set(["HG-10040", "HG-10041", "HG-10042"]);

@Injectable()
export class OrdersService implements OnModuleInit {
  private readonly orders = new Map<string, AdminOrderDetail>();

  private readonly idempotencyIndex = new Map<string, CheckoutIdempotencyRecord>();

  private orderSequence = 10042;

  constructor(
    private readonly auditService: AuditService,
    private readonly inventoryService: InventoryService,
    private readonly loyaltyService: LoyaltyService,
    private readonly notificationsService: NotificationsService,
    private readonly observabilityService: ObservabilityService,
    private readonly vendorsService: VendorsService,
    private readonly moduleStateService: ModuleStateService
  ) {
    if (demoRuntimeEnabled()) {
      this.seedInitialOrders();
    }
  }

  async onModuleInit() {
    const snapshot = await this.moduleStateService.load<OrdersSnapshot>("orders");
    if (snapshot) {
      const sanitizedSnapshot = this.sanitizeSnapshot(snapshot);
      this.restoreSnapshot(sanitizedSnapshot ?? snapshot);
      if (sanitizedSnapshot) {
        await this.persistState();
      }
    } else {
      await this.persistState();
    }

    await this.hydrateLegacyOrders();
    this.hydrateLegacyMetadata();
    await this.persistState();
    await this.inventoryService.rebuildFromOrders(
      this.sortedOrders().map((order) => ({
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        items: order.items,
        createdAt: order.createdAt,
        occurredAt: order.updatedAt
      }))
    );
  }

  reserveOrderNumber() {
    this.orderSequence += 1;
    return `HG-${this.orderSequence}`;
  }

  getAllOrderDetails() {
    return this.sortedOrders().map((order) => ({
      ...order,
      customer: { ...order.customer },
      address: { ...order.address },
      items: cloneOrderItems(order.items),
      statusHistory: order.statusHistory.map((entry) => ({ ...entry })),
      payment: { ...order.payment },
      manualRequest: order.manualRequest ? { ...order.manualRequest } : undefined
    }));
  }

  async createCheckoutOrder(input: CreateCheckoutOrderInput) {
    const orderNumber = input.orderNumber.trim().toUpperCase();
    if (this.orders.has(orderNumber)) {
      throw new BadRequestException(`Ya existe un pedido con el número ${orderNumber}.`);
    }

    this.validateCheckoutInput(input);

    const clientRequestId = normalizeText(input.request.clientRequestId);
    const requestHash = clientRequestId ? hashCheckoutRequest(input) : undefined;
    if (clientRequestId) {
      const existingRequest = this.idempotencyIndex.get(clientRequestId);
      if (existingRequest) {
        if (existingRequest.requestHash !== requestHash) {
          throw new ConflictException("La solicitud de checkout ya fue procesada con contenido diferente.");
        }

        const existingOrder = this.orders.get(existingRequest.orderNumber);
        if (existingOrder) {
          return existingOrder;
        }

        this.idempotencyIndex.delete(clientRequestId);
      }
    }

    this.syncSequence(orderNumber);

    const createdAt = new Date().toISOString();
    const customer = normalizeCustomer(input.request.customer);
    const customerName = fullName(customer) || customer.email;
    const address = normalizeAddress(input.request.address);
    const manualEvidenceReference = normalizeText(input.request.manualEvidenceReference);
    const manualEvidenceNotes = normalizeText(input.request.manualEvidenceNotes);
    const evidenceImageUrl = input.request.evidenceImageUrl?.trim() || undefined;
    const manualStatus =
      input.request.paymentMethod === "manual"
        ? input.manualStatus ?? (manualEvidenceReference ? ManualPaymentRequestStatus.UnderReview : ManualPaymentRequestStatus.Submitted)
        : undefined;
    const manualRequestId = input.request.paymentMethod === "manual" ? `mpr-${orderNumber.toLowerCase()}` : undefined;
    const paymentStatus = input.paymentStatus;
    const orderStatus = input.orderStatus;
    const paymentMethod = input.request.paymentMethod;
    const vendorTrace = this.resolveVendorTrace(input.request.vendorCode, { strict: true });
    const salesChannel: SalesChannelValue = "web";

    const payment = this.buildPaymentSummary({
      orderNumber,
      customerName: fullName(customer) || customer.email,
      provider: paymentMethod,
      amount: input.quote.grandTotal,
      currencyCode: input.quote.currencyCode,
      paymentStatus,
      manualStatus,
      manualEvidenceReference,
      updatedAt: createdAt,
      orderStatus
    });

    const manualRequest =
      paymentMethod === "manual"
        ? this.buildManualRequestSummary({
            id: manualRequestId ?? `mpr-${orderNumber.toLowerCase()}`,
            orderNumber,
            customerName: fullName(customer) || customer.email,
            amount: input.quote.grandTotal,
            currencyCode: input.quote.currencyCode,
            status: manualStatus ?? ManualPaymentRequestStatus.Submitted,
            evidenceReference: manualEvidenceReference,
            evidenceNotes: manualEvidenceNotes,
            evidenceImageUrl,
            submittedAt: createdAt
          })
        : undefined;

    const order: AdminOrderDetail = {
      orderNumber,
      customer,
      address,
      items: buildOrderItems(input.quote.items),
      subtotal: input.quote.subtotal,
      discount: input.quote.discount,
      shipping: input.quote.shipping,
      total: input.quote.grandTotal,
      currencyCode: input.quote.currencyCode,
      paymentMethod,
      salesChannel,
      orderStatus,
      paymentStatus,
      vendorId: vendorTrace.vendorId,
      vendorCode: vendorTrace.vendorCode,
      vendorName: vendorTrace.vendorName,
      couponCode: normalizeCode(input.request.couponCode),
      notes: normalizeText(input.request.notes),
      providerReference: input.providerReference,
      checkoutUrl: input.checkoutUrl,
      manualStatus,
      crmStage: resolveInitialCrmStage(orderStatus, paymentStatus),
      manualRequestId,
      manualEvidenceReference,
      manualEvidenceNotes,
      evidenceImageUrl,
      statusHistory: this.buildInitialHistory({
        orderStatus,
        paymentMethod,
        createdAt
      }),
      payment,
      manualRequest,
      confirmedAt: undefined,
      createdAt,
      updatedAt: createdAt
    };

    await this.inventoryService.syncOrder({
      orderNumber,
      orderStatus: order.orderStatus,
      items: order.items,
      occurredAt: createdAt,
      note: "Reserva generada al crear el checkout."
    });

    this.orders.set(orderNumber, order);
    if (clientRequestId) {
      this.idempotencyIndex.set(clientRequestId, {
        orderNumber,
        requestHash: requestHash ?? hashCheckoutRequest(input),
        createdAt
      });
    }

    const loyaltyStatus =
      input.paymentStatus === PaymentStatus.Paid || input.orderStatus === OrderStatus.Paid || input.orderStatus === OrderStatus.Confirmed
        ? LoyaltyMovementStatus.Available
        : LoyaltyMovementStatus.Pending;

    this.loyaltyService.recordOrderPoints({
      customer: customerName,
      points: input.quote.estimatedPoints,
      orderNumber,
      reviewer: "sistema",
      available: loyaltyStatus === LoyaltyMovementStatus.Available,
      reason:
        loyaltyStatus === LoyaltyMovementStatus.Available
          ? "Puntos liberados por pedido confirmado."
          : "Puntos retenidos hasta confirmar el pago."
    });

    void this.notificationsService.recordEvent(
      "order.created",
      "orders",
      customerName,
      `Pedido ${orderNumber} generado con ${order.paymentMethod === "manual" ? "pago manual" : "Openpay"} y ${input.quote.estimatedPoints} puntos estimados.`,
      "order",
      orderNumber
    );

    void this.notificationsService.queueNotification({
      channel: NotificationChannel.Email,
      audience: customer.email,
      subject: `Pedido ${orderNumber} recibido`,
      body:
        order.paymentMethod === "manual"
          ? "Recibimos tu comprobante y el pedido quedó en revisión."
          : "Tu pedido fue preparado y espera la confirmación del pago.",
      source: "orders",
      relatedType: "order",
      relatedId: orderNumber,
      status: NotificationStatus.Pending
    });

    this.auditService.recordAudit({
      module: "orders",
      action: "checkout.created",
      entityType: "order",
      entityId: orderNumber,
      summary: `Pedido ${orderNumber} creado desde checkout.`,
      actorName: customerName,
      payload: {
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        paymentStatus: order.paymentStatus,
        vendorCode: order.vendorCode,
        total: order.total
      }
    });
    this.observabilityService.recordDomainEvent({
      category: "checkout",
      action: `checkout.${order.paymentMethod}.created`,
      detail: `Se creó el pedido ${orderNumber} con total ${order.total} ${order.currencyCode}.`,
      relatedType: "order",
      relatedId: orderNumber
    });

    await this.persistState();

    return order;
  }

  async createBackofficeOrder(input: {
    customer: { firstName: string; lastName: string; email: string; phone: string };
    address: { line1: string; city: string; region?: string; countryCode?: string };
    items: Array<{ slug: string; name: string; sku: string; variantId?: string; quantity: number; unitPrice: number }>;
    initialStatus: "paid" | "pending_payment";
    notes?: string;
    vendorCode?: string;
    reviewer?: string;
  }) {
    if (!input.items?.length) throw new BadRequestException("El pedido debe tener al menos un ítem.");
    if (!input.customer?.firstName?.trim()) throw new BadRequestException("El nombre del cliente es obligatorio.");

    const orderNumber = this.reserveOrderNumber();
    const createdAt = new Date().toISOString();
    const customer = normalizeCustomer({
      firstName: input.customer.firstName,
      lastName: input.customer.lastName || "",
      email: input.customer.email || "",
      phone: input.customer.phone || ""
    });
    const address = normalizeAddress({
      recipientName: [customer.firstName, customer.lastName].filter(Boolean).join(" "),
      line1: input.address.line1,
      line2: undefined,
      city: input.address.city,
      region: input.address.region || input.address.city,
      postalCode: "",
      countryCode: input.address.countryCode || "PE"
    });

    const orderItems: OrderItemSummary[] = input.items.map((item) => ({
      slug: item.slug,
      name: item.name,
      sku: item.sku,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.unitPrice * item.quantity,
      imageUrl: undefined,
      originalUnitPrice: item.unitPrice,
      discountApplied: 0
    }));

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const isPaid = input.initialStatus === "paid";
    const orderStatus = isPaid ? OrderStatus.Confirmed : OrderStatus.PendingPayment;
    const paymentStatus = isPaid ? PaymentStatus.Paid : PaymentStatus.Pending;
    const customerName = fullName(customer) || customer.email;
    const actorName = normalizeText(input.reviewer) ?? "backoffice";
    const vendorTrace = this.resolveVendorTrace(input.vendorCode, { strict: true });
    const salesChannel: SalesChannelValue = "manual";

    const payment = this.buildPaymentSummary({
      orderNumber,
      customerName,
      provider: "manual",
      amount: subtotal,
      currencyCode: "PEN",
      paymentStatus,
      manualStatus: undefined,
      updatedAt: createdAt,
      orderStatus
    });

    const order: AdminOrderDetail = {
      orderNumber,
      customer,
      address,
      items: orderItems,
      subtotal,
      discount: 0,
      shipping: 0,
      total: subtotal,
      currencyCode: "PEN",
      paymentMethod: "manual",
      salesChannel,
      orderStatus,
      paymentStatus,
      vendorId: vendorTrace.vendorId,
      vendorCode: vendorTrace.vendorCode,
      vendorName: vendorTrace.vendorName,
      couponCode: undefined,
      notes: normalizeText(input.notes),
      providerReference: `backoffice-${orderNumber.toLowerCase()}`,
      checkoutUrl: undefined,
      manualStatus: undefined,
      crmStage: isPaid ? CrmStage.ReadyForFollowUp : undefined,
      manualRequestId: undefined,
      manualEvidenceReference: undefined,
      manualEvidenceNotes: undefined,
      evidenceImageUrl: undefined,
      statusHistory: [
        createHistoryEntry(
          orderStatus,
          actorName,
          isPaid ? "Pedido registrado manualmente como pagado." : "Pedido registrado manualmente, pendiente de cobro.",
          createdAt
        )
      ],
      payment,
      manualRequest: undefined,
      confirmedAt: isPaid ? createdAt : undefined,
      createdAt,
      updatedAt: createdAt
    };

    await this.inventoryService.syncOrder({
      orderNumber,
      orderStatus: order.orderStatus,
      items: order.items,
      occurredAt: createdAt,
      note: "Reserva generada por pedido manual desde backoffice."
    });

    this.orders.set(orderNumber, order);

    if (isPaid) {
      this.loyaltyService.recordOrderPoints({
        customer: customerName,
        points: Math.floor(subtotal / 10),
        orderNumber,
        reviewer: actorName,
        available: true,
        reason: "Puntos liberados por pedido manual confirmado."
      });
    }

    this.auditService.recordAdminAction({
      actionType: "orders.backoffice.created",
      targetType: "order",
      targetId: orderNumber,
      summary: `Pedido ${orderNumber} creado manualmente desde backoffice por ${actorName}.`,
      actorName,
      metadata: { orderStatus, paymentStatus, total: subtotal, vendorCode: order.vendorCode }
    });

    this.observabilityService.recordDomainEvent({
      category: "checkout",
      action: "checkout.backoffice.created",
      detail: `Pedido manual ${orderNumber} registrado por ${actorName} con total ${subtotal} PEN.`,
      relatedType: "order",
      relatedId: orderNumber
    });

    await this.persistState();

    return {
      status: "ok" as const,
      message: `Pedido ${orderNumber} registrado correctamente.`,
      orderNumber,
      order: this.toOrderSummary(order)
    };
  }

  listOrders() {
    const orders = this.sortedOrders().map((order) => this.toOrderSummary(order));
    return wrapResponse(orders, {
      total: orders.length,
      paid: orders.filter((order) => order.paymentStatus === PaymentStatus.Paid).length,
      manualReview: orders.filter((order) => order.manualStatus === ManualPaymentRequestStatus.UnderReview).length,
      pendingPayment: orders.filter((order) => order.orderStatus === OrderStatus.PendingPayment).length
    });
  }

  listOrdersInRange(from: string, to: string) {
    const fromMs = new Date(from).getTime();
    const toStr = to.includes("T") ? to : `${to}T23:59:59.999Z`;
    const toMs = new Date(toStr).getTime();
    const orders = this.sortedOrders()
      .filter((order) => {
        const t = new Date(order.createdAt).getTime();
        return t >= fromMs && t <= toMs;
      })
      .map((order) => this.toOrderSummary(order));
    return wrapResponse(orders, {
      total: orders.length,
      paid: orders.filter((order) => order.paymentStatus === PaymentStatus.Paid).length,
      manualReview: orders.filter((order) => order.manualStatus === ManualPaymentRequestStatus.UnderReview).length,
      pendingPayment: orders.filter((order) => order.orderStatus === OrderStatus.PendingPayment).length
    });
  }

  listOrdersByVendorCode(vendorCode: string) {
    const normalizedVendorCode = normalizeCode(vendorCode);
    if (!normalizedVendorCode) {
      return wrapResponse<AdminOrderSummary[]>([], {
        total: 0,
        paid: 0,
        manualReview: 0,
        pendingPayment: 0
      });
    }

    const orders = this.sortedOrders()
      .filter((order) => order.vendorCode === normalizedVendorCode)
      .map((order) => this.toOrderSummary(order));

    return wrapResponse(orders, {
      total: orders.length,
      paid: orders.filter((order) => order.paymentStatus === PaymentStatus.Paid).length,
      manualReview: orders.filter((order) => order.manualStatus === ManualPaymentRequestStatus.UnderReview).length,
      pendingPayment: orders.filter((order) => order.orderStatus === OrderStatus.PendingPayment).length
    });
  }

  getOrder(orderNumber: string) {
    return wrapResponse(this.requireOrder(orderNumber), {
      found: true
    });
  }

  async transitionOrderStatus(orderNumber: string, input: AdminOrderStatusTransitionInput) {
    const order = this.requireOrder(orderNumber);
    const nextStatus = input.status;
    const actor = normalizeText(input.actor) ?? "admin";
    const note = normalizeText(input.note) ?? "Estado actualizado manualmente desde backoffice.";
    const occurredAt = new Date().toISOString();

    if (order.orderStatus === nextStatus) {
      throw new ConflictException(`El pedido ${order.orderNumber} ya está en ${statusLabels[nextStatus]}.`);
    }

    const allowed = operationalTransitions[order.orderStatus] ?? [];
    if (!allowed.includes(nextStatus)) {
      throw new ConflictException(`No permitimos pasar de ${statusLabels[order.orderStatus]} a ${statusLabels[nextStatus]} desde operación.`);
    }

    if (isStatusPaidLike(nextStatus) && order.paymentStatus !== PaymentStatus.Paid) {
      throw new ConflictException(`El pedido ${order.orderNumber} debe tener pago confirmado antes de avanzar a ${statusLabels[nextStatus]}.`);
    }

    if (nextStatus === OrderStatus.Refunded && order.paymentStatus !== PaymentStatus.Paid) {
      throw new ConflictException(`Solo puedes marcar como reembolsado un pedido con pago confirmado.`);
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = nextStatus;
    order.crmStage = resolveOperationalCrmStage(nextStatus, order.paymentStatus);
    order.salesChannel = this.inferSalesChannel(order);
    order.confirmedAt = order.confirmedAt ?? this.inferConfirmedAt({ ...order, orderStatus: nextStatus });
    order.updatedAt = occurredAt;
    order.payment = this.buildPaymentSummary({
      orderNumber: order.orderNumber,
      customerName: fullName(order.customer) || order.customer.email,
      provider: order.payment.provider,
      amount: order.payment.amount,
      currencyCode: order.currencyCode,
      paymentStatus: order.paymentStatus,
      manualStatus: order.manualStatus,
      manualEvidenceReference: order.manualEvidenceReference,
      updatedAt: occurredAt,
      orderStatus: order.orderStatus
    });
    order.statusHistory = [...order.statusHistory, createHistoryEntry(nextStatus, actor, note, occurredAt)];

    await this.inventoryService.syncOrder({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      items: order.items,
      occurredAt,
      note
    });

    if (nextStatus === OrderStatus.Refunded || nextStatus === OrderStatus.Cancelled || nextStatus === OrderStatus.Expired) {
      try {
        await this.loyaltyService.reverseOrderPoints(order.orderNumber, actor);
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }
      }
    }

    this.auditService.recordAdminAction({
      actionType: "orders.status.transitioned",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `El pedido ${order.orderNumber} pasó de ${statusLabels[previousStatus]} a ${statusLabels[nextStatus]}.`,
      actorName: actor,
      metadata: {
        previousStatus,
        nextStatus,
        paymentStatus: order.paymentStatus,
        crmStage: order.crmStage
      }
    });
    this.observabilityService.recordDomainEvent({
      category: "orders",
      action: "orders.status.transitioned",
      detail: `Pedido ${order.orderNumber} pasó de ${previousStatus} a ${nextStatus}.`,
      relatedType: "order",
      relatedId: order.orderNumber
    });

    await this.persistState();

    return {
      status: "ok" as const,
      message: `Pedido ${order.orderNumber} actualizado a ${statusLabels[nextStatus]}.`,
      orderNumber: order.orderNumber,
      order: this.toOrderSummary(order)
    };
  }

  async registerAdminManualPayment(orderNumber: string, input: AdminManualPaymentCreateInput = {}) {
    const order = this.requireOrder(orderNumber);
    const actor = normalizeText(input.reviewer) ?? "operador_pagos";
    const notes = normalizeText(input.notes) ?? "Pago registrado manualmente desde backoffice.";
    const reference = normalizeText(input.reference) ?? `manual-${order.orderNumber.toLowerCase()}`;
    const occurredAt = new Date().toISOString();
    const amount = typeof input.amount === "number" ? Number(input.amount) : order.total;

    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("El monto del pago manual debe ser válido.");
    }

    if (Math.abs(amount - order.total) > 0.01) {
      throw new BadRequestException("Por ahora solo soportamos registrar el pago completo del pedido.");
    }

    if (order.paymentStatus === PaymentStatus.Paid) {
      throw new ConflictException(`El pedido ${order.orderNumber} ya tiene un pago confirmado.`);
    }

    if (order.manualRequest) {
      throw new ConflictException(`El pedido ${order.orderNumber} ya tiene una solicitud manual. Usa la revisión manual existente.`);
    }

    await this.applyCommercialConfirmation(order, {
      actor,
      notes: "Inventario confirmado por registro manual de pago.",
      occurredAt,
      provider: "manual",
      paymentMethod: "manual",
      providerReference: reference,
      manualStatus: undefined,
      manualEvidenceReference: reference,
      manualEvidenceNotes: notes
    });

    this.auditService.recordAdminAction({
      actionType: "payments.manual.recorded",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `Se registró manualmente el pago del pedido ${order.orderNumber}.`,
      actorName: actor,
      metadata: {
        amount,
        reference,
        paymentMethod: order.paymentMethod
      }
    });
    this.observabilityService.recordDomainEvent({
      category: "payment",
      action: "payment.manual.recorded",
      detail: `Se registró manualmente el pago del pedido ${order.orderNumber}.`,
      relatedType: "order",
      relatedId: order.orderNumber
    });

    await this.persistState();

    return {
      status: "ok" as const,
      message: `Pago manual registrado para ${order.orderNumber}.`,
      orderNumber: order.orderNumber,
      order: this.toOrderSummary(order)
    };
  }

  async confirmOnlinePayment(orderNumber: string, input: AdminManualPaymentCreateInput = {}) {
    const order = this.requireOrder(orderNumber);
    const actor = normalizeText(input.reviewer) ?? "operador_pagos";
    const notes = normalizeText(input.notes) ?? "Pago online conciliado desde backoffice.";
    const reference = normalizeText(input.reference) ?? order.providerReference;
    const occurredAt = new Date().toISOString();

    if (order.paymentMethod !== "openpay") {
      throw new BadRequestException(`El pedido ${order.orderNumber} no usa pago online conciliable por esta ruta.`);
    }

    if (order.paymentStatus === PaymentStatus.Paid) {
      return {
        status: "ok" as const,
        message: `El pedido ${order.orderNumber} ya tenia el pago online confirmado.`,
        orderNumber: order.orderNumber,
        order: this.toOrderSummary(order)
      };
    }

    await this.applyCommercialConfirmation(order, {
      actor,
      notes: "Inventario confirmado por conciliacion de pago online.",
      occurredAt,
      provider: "openpay",
      paymentMethod: "openpay",
      providerReference: reference,
      manualStatus: undefined
    });

    this.auditService.recordAdminAction({
      actionType: "payments.online.confirmed",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `Se confirmo el pago online del pedido ${order.orderNumber}.`,
      actorName: actor,
      metadata: {
        paymentMethod: order.paymentMethod,
        providerReference: order.providerReference,
        confirmedAt: order.confirmedAt
      }
    });
    this.observabilityService.recordDomainEvent({
      category: "payment",
      action: "payment.online.confirmed",
      detail: `Se confirmo el pago online del pedido ${order.orderNumber}.`,
      relatedType: "order",
      relatedId: order.orderNumber
    });

    await this.persistState();

    return {
      status: "ok" as const,
      message: `Pago online confirmado para ${order.orderNumber}.`,
      orderNumber: order.orderNumber,
      order: this.toOrderSummary(order)
    };
  }

  async deleteOrder(orderNumber: string) {
    const order = this.requireOrder(orderNumber);
    this.orders.delete(order.orderNumber);
    await this.persistState();
    this.auditService.recordAdminAction({
      actionType: "orders.deleted",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `El pedido ${order.orderNumber} fue eliminado manualmente por un administrador.`,
      actorName: "admin"
    });
    return { status: "deleted" as const, orderNumber: order.orderNumber };
  }

  listPayments() {
    const payments = this.sortedOrders().map((order) => this.toPaymentSummary(order));
    return wrapResponse(payments, {
      total: payments.length,
      paid: payments.filter((payment) => payment.status === PaymentStatus.Paid).length,
      pending: payments.filter((payment) => payment.status === PaymentStatus.Pending || payment.status === PaymentStatus.Initiated).length,
      manualReview: payments.filter((payment) => payment.manualStatus === ManualPaymentRequestStatus.UnderReview).length
    });
  }

  listManualPaymentRequests() {
    const requests = this.sortedOrders()
      .filter((order) => order.manualRequest)
      .map((order) => this.requireManualRequest(order));

    return wrapResponse(requests, {
      total: requests.length,
      underReview: requests.filter((request) => request.status === ManualPaymentRequestStatus.UnderReview).length,
      approved: requests.filter((request) => request.status === ManualPaymentRequestStatus.Approved).length,
      rejected: requests.filter((request) => request.status === ManualPaymentRequestStatus.Rejected).length
    });
  }

  async approveManualRequest(id: string, reviewer?: string, notes?: string, sendEmailNow = true) {
    const order = this.findOrderByManualRequestId(id);
    const now = new Date().toISOString();
    const reviewerName = normalizeText(reviewer) ?? "operador";
    const note = normalizeText(notes) ?? "Aprobado operativamente.";
    const manualRequest = this.requireManualRequest(order);

    if (manualRequest.status === ManualPaymentRequestStatus.Approved) {
      return {
        status: "ok" as const,
        message: "La solicitud manual ya estaba aprobada.",
        referenceId: id,
        request: this.requireManualRequest(order),
        order: this.toOrderSummary(order)
      };
    }

    if (manualRequest.status === ManualPaymentRequestStatus.Rejected) {
      throw new ConflictException("La solicitud manual ya fue rechazada y no puede aprobarse.");
    }

    this.ensureManualRequestReviewable(order, manualRequest);

    const decision = await this.applyManualDecision(order, {
      status: ManualPaymentRequestStatus.Approved,
      orderStatus: OrderStatus.Paid,
      paymentStatus: PaymentStatus.Paid,
      reviewer: reviewerName,
      notes: note,
      occurredAt: now,
      sendEmailNow
    });

    const message =
      decision.emailNotification === "queued"
        ? "La solicitud fue aprobada operativamente, el pedido quedó pagado y el email al cliente quedó en cola."
        : decision.emailNotification === "skipped"
          ? "La solicitud fue aprobada operativamente, el pedido quedó pagado y pasó a seguimiento CRM."
          : "La solicitud fue aprobada operativamente, el pedido quedó pagado y pasó a seguimiento CRM. El email al cliente no pudo registrarse.";

    return {
      status: "ok" as const,
      message,
      referenceId: id,
      request: this.requireManualRequest(order),
      order: this.toOrderSummary(order)
    };
  }

  async rejectManualRequest(id: string, reviewer?: string, notes?: string) {
    const order = this.findOrderByManualRequestId(id);
    const now = new Date().toISOString();
    const reviewerName = normalizeText(reviewer) ?? "operador";
    const note = normalizeText(notes) ?? "Rechazado operativamente.";
    const manualRequest = this.requireManualRequest(order);

    if (manualRequest.status === ManualPaymentRequestStatus.Rejected) {
      return {
        status: "rejected" as const,
        message: "La solicitud manual ya estaba rechazada.",
        referenceId: id,
        request: this.requireManualRequest(order),
        order: this.toOrderSummary(order)
      };
    }

    if (manualRequest.status === ManualPaymentRequestStatus.Approved) {
      throw new ConflictException("La solicitud manual ya fue aprobada y no puede rechazarse.");
    }

    this.ensureManualRequestReviewable(order, manualRequest);

    await this.applyManualDecision(order, {
      status: ManualPaymentRequestStatus.Rejected,
      orderStatus: OrderStatus.Cancelled,
      paymentStatus: PaymentStatus.Failed,
      reviewer: reviewerName,
      notes: note,
      occurredAt: now
    });

    return {
      status: "rejected" as const,
      message: "La solicitud fue rechazada y quedó registrada para auditoría.",
      referenceId: id,
      request: this.requireManualRequest(order),
      order: this.toOrderSummary(order)
    };
  }

  async resendManualApprovalNotification(orderNumber: string, reviewer?: string) {
    const order = this.requireOrder(orderNumber);
    const manualRequest = this.requireManualRequest(order);
    const reviewerName = normalizeText(reviewer) ?? "admin";

    if (order.paymentMethod !== "manual") {
      throw new BadRequestException(`El pedido ${order.orderNumber} no usa pago manual.`);
    }

    if (manualRequest.status !== ManualPaymentRequestStatus.Approved || order.paymentStatus !== PaymentStatus.Paid) {
      throw new ConflictException(`El pedido ${order.orderNumber} todavía no tiene una aprobación manual confirmada para reenviar.`);
    }

    if (!normalizeText(order.customer.email)) {
      throw new BadRequestException(`El pedido ${order.orderNumber} no tiene email de cliente para reenviar la notificación.`);
    }

    try {
      await this.notificationsService.queueNotification(this.buildManualApprovalEmailNotification(order, manualRequest));
    } catch (error) {
      this.observabilityService.recordDomainEvent({
        category: "notification",
        action: "payment.manual.approved.email_resend_failed",
        severity: "warning",
        detail: `No pudimos registrar el reenvío del email para el pedido ${order.orderNumber}.`,
        relatedType: "order",
        relatedId: order.orderNumber
      });
      throw new InternalServerErrorException(`No pudimos registrar el reenvío del email para el pedido ${order.orderNumber}.`);
    }

    this.auditService.recordAdminAction({
      actionType: "payments.manual_request.email_resent",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `Reenvío manual del email de confirmación para ${order.orderNumber}.`,
      actorName: reviewerName,
      metadata: {
        orderNumber: order.orderNumber,
        customerEmail: order.customer.email,
        manualRequestId: manualRequest.id
      }
    });

    await this.notificationsService.recordEvent(
      "order.manual.approval_email.resent",
      "payments",
      manualRequest.customerName,
      `Reenviamos el email de confirmación del pedido ${order.orderNumber} a ${order.customer.email}.`,
      "order",
      order.orderNumber
    );

    return {
      status: "ok" as const,
      message: `Reenviamos el email de confirmación al cliente (${order.customer.email}).`,
      referenceId: order.orderNumber,
      order: this.toOrderSummary(order)
    };
  }

  private async applyManualDecision(
    order: AdminOrderDetail,
    input: {
      status: ManualPaymentRequestStatus.Approved | ManualPaymentRequestStatus.Rejected;
      orderStatus: OrderStatus.Paid | OrderStatus.Cancelled;
      paymentStatus: PaymentStatus.Paid | PaymentStatus.Failed;
      reviewer: string;
      notes: string;
      occurredAt: string;
      sendEmailNow?: boolean;
    }
  ) {
    const manualRequest = this.requireManualRequest(order);

    order.manualStatus = input.status;

    manualRequest.status = input.status;
    manualRequest.reviewedAt = input.occurredAt;
    manualRequest.reviewer = input.reviewer;
    manualRequest.notes = input.notes;

    let emailNotification: "queued" | "skipped" | "failed" = "skipped";

    if (input.status === ManualPaymentRequestStatus.Approved) {
      await this.applyCommercialConfirmation(order, {
        actor: input.reviewer,
        notes: "Inventario confirmado por aprobacion manual.",
        occurredAt: input.occurredAt,
        provider: "manual",
        paymentMethod: "manual",
        providerReference: order.providerReference,
        manualStatus: ManualPaymentRequestStatus.Approved,
        manualEvidenceReference: manualRequest.evidenceReference,
        manualEvidenceNotes: manualRequest.evidenceNotes
      });

      this.auditService.recordAdminAction({
        actionType: "payments.manual_request.approved",
        targetType: "manual_payment_request",
        targetId: manualRequest.id,
        summary: `La revisión manual de ${order.orderNumber} fue aprobada.`,
        actorName: input.reviewer,
        metadata: {
          orderNumber: order.orderNumber,
          reviewer: input.reviewer,
          crmStage: order.crmStage,
          sendEmailNow: input.sendEmailNow !== false
        }
      });
      this.observabilityService.recordDomainEvent({
        category: "payment",
        action: "payment.manual.approved",
        detail: `La solicitud ${manualRequest.id} aprobó el pedido ${order.orderNumber}.`,
        relatedType: "manual_payment_request",
        relatedId: manualRequest.id
      });
      if (input.sendEmailNow !== false && order.customer.email) {
        try {
          await this.notificationsService.queueNotification(this.buildManualApprovalEmailNotification(order, manualRequest));
          emailNotification = "queued";
        } catch (error) {
          emailNotification = "failed";
          this.observabilityService.recordDomainEvent({
            category: "notification",
            action: "payment.manual.approved.email_failed",
            severity: "warning",
            detail: `No pudimos registrar el email para el pedido ${order.orderNumber}.`,
            relatedType: "order",
            relatedId: order.orderNumber
          });
        }
      }

      await this.notificationsService.recordEvent(
        "order.manual.approved",
        "payments",
        manualRequest.customerName,
        emailNotification === "queued"
          ? `El pedido ${order.orderNumber} quedó pagado después de la revisión manual y el email quedó en cola.`
          : emailNotification === "failed"
            ? `El pedido ${order.orderNumber} quedó pagado después de la revisión manual, pero el email no pudo registrarse.`
          : `El pedido ${order.orderNumber} quedó pagado después de la revisión manual y quedó listo para seguimiento CRM.`,
        "order",
        order.orderNumber
      );
    } else {
      order.orderStatus = input.orderStatus;
      order.paymentStatus = input.paymentStatus;
      order.crmStage = undefined;
      order.updatedAt = input.occurredAt;
      order.payment = this.buildPaymentSummary({
        orderNumber: order.orderNumber,
        customerName: manualRequest.customerName,
        provider: order.paymentMethod,
        amount: order.total,
        currencyCode: order.currencyCode,
        paymentStatus: input.paymentStatus,
        manualStatus: input.status,
        manualEvidenceReference: manualRequest.evidenceReference,
        updatedAt: input.occurredAt,
        orderStatus: input.orderStatus
      });
      order.statusHistory = [
        ...order.statusHistory,
        createHistoryEntry(OrderStatus.Cancelled, input.reviewer, "Pago manual rechazado.", input.occurredAt)
      ];

      await this.inventoryService.syncOrder({
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        items: order.items,
        occurredAt: input.occurredAt,
        note: "Inventario liberado por rechazo manual."
      });

      try {
        await this.loyaltyService.reverseOrderPoints(order.orderNumber, input.reviewer);
      } catch (error) {
        if (!(error instanceof NotFoundException)) {
          throw error;
        }

        this.observabilityService.recordDomainEvent({
          category: "payment",
          action: "payment.manual.rejected.loyalty_missing",
          severity: "warning",
          detail: `No encontramos puntos de loyalty para el pedido ${order.orderNumber}. Continuamos sin revertir loyalty.`,
          relatedType: "order",
          relatedId: order.orderNumber
        });
      }

      this.auditService.recordAdminAction({
        actionType: "payments.manual_request.rejected",
        targetType: "manual_payment_request",
        targetId: manualRequest.id,
        summary: `La revisión manual de ${order.orderNumber} fue rechazada.`,
        actorName: input.reviewer,
        metadata: {
          orderNumber: order.orderNumber,
          reviewer: input.reviewer
        }
      });
      this.observabilityService.recordDomainEvent({
        category: "payment",
        action: "payment.manual.rejected",
        severity: "warning",
        detail: `La solicitud ${manualRequest.id} rechazó el pedido ${order.orderNumber}.`,
        relatedType: "manual_payment_request",
        relatedId: manualRequest.id
      });
      void this.notificationsService.queueNotification({
        channel: NotificationChannel.Email,
        audience: order.customer.email,
        subject: `❌ Comprobante no válido — Pedido ${order.orderNumber}`,
        body: `Hola ${manualRequest.customerName},\n\nRevisamos tu comprobante pero no pudimos validarlo para el pedido ${order.orderNumber}. El pedido fue cancelado.\n\nSi crees que hubo un error, comunícate con nosotros por WhatsApp y con gusto te ayudamos.`,
        source: "payments",
        relatedType: "order",
        relatedId: order.orderNumber,
        status: NotificationStatus.Pending
      });
      void this.notificationsService.recordEvent(
        "order.manual.rejected",
        "payments",
        manualRequest.customerName,
        `El pedido ${order.orderNumber} fue cancelado después de la revisión manual.`,
        "order",
        order.orderNumber
      );
    }

    await this.persistState();

    return {
      emailNotification
    };
  }

  private buildManualApprovalEmailNotification(order: AdminOrderDetail, manualRequest: AdminManualPaymentRequestSummary) {
    return {
      channel: NotificationChannel.Email,
      audience: order.customer.email,
      subject: `✅ Tu pago fue confirmado — Pedido ${order.orderNumber}`,
      body: `Hola ${manualRequest.customerName},\n\nTu comprobante fue revisado y aprobado. Tu pedido ${order.orderNumber} quedó pagado y ya pasó a seguimiento de atención para coordinar la entrega.\n\n¡Gracias por tu compra!`,
      source: "payments",
      relatedType: "order",
      relatedId: order.orderNumber,
      status: NotificationStatus.Pending
    };
  }

  private buildInitialHistory(input: {
    orderStatus: OrderStatus;
    paymentMethod: "openpay" | "manual";
    createdAt: string;
  }) {
    const history = [createHistoryEntry(OrderStatus.Draft, "Sistema", "Carrito convertido a pedido.", input.createdAt)];

    if (input.paymentMethod === "manual") {
      history.push(createHistoryEntry(OrderStatus.PendingPayment, "Sistema", "Checkout preparado para pago manual.", input.createdAt));
      history.push(
        createHistoryEntry(
          OrderStatus.PaymentUnderReview,
          "Cliente",
          "Se registró el comprobante y queda en revisión.",
          input.createdAt
        )
      );
    } else {
      history.push(createHistoryEntry(OrderStatus.PendingPayment, "Sistema", "Checkout preparado para Openpay.", input.createdAt));
    }

    if (input.orderStatus === OrderStatus.Paid || input.orderStatus === OrderStatus.Confirmed) {
      history.push(createHistoryEntry(input.orderStatus, "Operación", "Pago conciliado.", input.createdAt));
    }

    return history;
  }

  private resolveVendorTrace(vendorCode?: string, options: { strict?: boolean } = {}): VendorTraceSnapshot {
    const normalizedVendorCode = normalizeCode(vendorCode);
    if (!normalizedVendorCode) {
      return {};
    }

    const vendor = this.vendorsService.findVendorSummaryByCode(normalizedVendorCode);
    if (!vendor) {
      if (options.strict) {
        throw new BadRequestException(`No encontramos un vendedor activo con el codigo ${normalizedVendorCode}.`);
      }

      return {
        vendorCode: normalizedVendorCode
      };
    }

    if (options.strict && vendor.status !== "active") {
      throw new BadRequestException(`El vendedor ${normalizedVendorCode} no esta activo para atribuir ventas.`);
    }

    return {
      vendorId: vendor.id,
      vendorCode: vendor.code,
      vendorName: vendor.name
    };
  }

  private inferSalesChannel(order: Pick<AdminOrderDetail, "salesChannel" | "paymentMethod" | "manualRequest" | "providerReference">): SalesChannelValue {
    if (order.salesChannel === "web" || order.salesChannel === "manual") {
      return order.salesChannel;
    }

    if (order.paymentMethod === "openpay") {
      return "web";
    }

    if (order.manualRequest || order.providerReference.startsWith("MP-")) {
      return "web";
    }

    return "manual";
  }

  private inferConfirmedAt(order: Pick<AdminOrderDetail, "confirmedAt" | "orderStatus" | "paymentStatus" | "statusHistory" | "updatedAt" | "createdAt">) {
    if (order.confirmedAt) {
      return order.confirmedAt;
    }

    const historyEntry = order.statusHistory.find((entry) => isStatusPaidLike(entry.status));
    if (historyEntry?.occurredAt) {
      return historyEntry.occurredAt;
    }

    if (order.paymentStatus === PaymentStatus.Paid || isStatusPaidLike(order.orderStatus)) {
      return order.updatedAt || order.createdAt;
    }

    return undefined;
  }

  private hydrateLegacyMetadata() {
    for (const order of this.orders.values()) {
      const vendorTrace = this.resolveVendorTrace(order.vendorCode, { strict: false });
      order.salesChannel = this.inferSalesChannel(order);
      order.vendorId = vendorTrace.vendorId ?? order.vendorId;
      order.vendorCode = vendorTrace.vendorCode ?? order.vendorCode;
      order.vendorName = vendorTrace.vendorName ?? order.vendorName;
      order.confirmedAt = this.inferConfirmedAt(order);
    }
  }

  private async applyCommercialConfirmation(
    order: AdminOrderDetail,
    input: {
      actor: string;
      notes: string;
      occurredAt: string;
      provider: "openpay" | "manual";
      providerReference?: string;
      paymentMethod?: "openpay" | "manual";
      manualStatus?: ManualPaymentRequestStatus;
      manualEvidenceReference?: string;
      manualEvidenceNotes?: string;
    }
  ) {
    order.paymentMethod = input.paymentMethod ?? order.paymentMethod;
    order.paymentStatus = PaymentStatus.Paid;
    order.orderStatus = OrderStatus.Paid;
    order.crmStage = resolveOperationalCrmStage(order.orderStatus, order.paymentStatus);
    order.providerReference = input.providerReference ?? order.providerReference;
    order.manualStatus = input.manualStatus;
    order.manualEvidenceReference = input.manualEvidenceReference ?? order.manualEvidenceReference;
    order.manualEvidenceNotes = input.manualEvidenceNotes ?? order.manualEvidenceNotes;
    order.salesChannel = this.inferSalesChannel(order);
    order.confirmedAt = order.confirmedAt ?? input.occurredAt;
    order.updatedAt = input.occurredAt;

    const vendorTrace = this.resolveVendorTrace(order.vendorCode, { strict: false });
    order.vendorId = vendorTrace.vendorId ?? order.vendorId;
    order.vendorCode = vendorTrace.vendorCode ?? order.vendorCode;
    order.vendorName = vendorTrace.vendorName ?? order.vendorName;

    order.payment = this.buildPaymentSummary({
      orderNumber: order.orderNumber,
      customerName: fullName(order.customer) || order.customer.email,
      provider: input.provider,
      amount: order.total,
      currencyCode: order.currencyCode,
      paymentStatus: order.paymentStatus,
      manualStatus: order.manualStatus,
      manualEvidenceReference: order.manualEvidenceReference,
      updatedAt: input.occurredAt,
      orderStatus: order.orderStatus
    });
    order.statusHistory = [...order.statusHistory, createHistoryEntry(OrderStatus.Paid, input.actor, input.notes, input.occurredAt)];

    await this.inventoryService.syncOrder({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      items: order.items,
      occurredAt: input.occurredAt,
      note: input.notes
    });

    try {
      await this.loyaltyService.settleOrderPoints(order.orderNumber, input.actor);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }
  }

  private async hydrateLegacyOrders() {
    for (const order of this.orders.values()) {
      order.items = await this.inventoryService.hydrateOrderItems(order.items);
    }
  }

  private buildPaymentSummary(input: {
    orderNumber: string;
    customerName: string;
    provider: "openpay" | "manual";
    amount: number;
    currencyCode: string;
    paymentStatus: PaymentStatus;
    manualStatus?: ManualPaymentRequestStatus;
    manualEvidenceReference?: string;
    updatedAt: string;
    orderStatus: OrderStatus;
  }): AdminPaymentSummary {
    return {
      id: `pay-${input.orderNumber.toLowerCase()}`,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      provider: input.provider,
      status: input.paymentStatus,
      amount: input.amount,
      currencyCode: input.currencyCode,
      manualStatus: input.manualStatus,
      notificationStatus: resolveNotificationStatus(input.orderStatus, input.paymentStatus),
      evidenceReference: input.manualEvidenceReference,
      updatedAt: input.updatedAt
    };
  }

  private ensureManualRequestReviewable(order: AdminOrderDetail, manualRequest: AdminManualPaymentRequestSummary) {
    if (order.paymentMethod !== "manual") {
      throw new BadRequestException(`El pedido ${order.orderNumber} no usa pago manual.`);
    }

    if (order.orderStatus !== OrderStatus.PaymentUnderReview) {
      throw new ConflictException(`El pedido ${order.orderNumber} ya no está en revisión manual.`);
    }

    if (order.paymentStatus !== PaymentStatus.Pending) {
      throw new ConflictException(`El pedido ${order.orderNumber} ya no está pendiente de pago manual.`);
    }

    if (!isManualRequestResolvable(manualRequest.status)) {
      throw new ConflictException(`La solicitud manual ${manualRequest.id} ya fue ${manualRequestResolutionLabel(manualRequest.status)}.`);
    }
  }

  private validateCheckoutInput(input: CreateCheckoutOrderInput) {
    const paymentMethod = input.request.paymentMethod;
    const manualEvidenceReference = normalizeText(input.request.manualEvidenceReference);
    const manualEvidenceNotes = normalizeText(input.request.manualEvidenceNotes);
    const clientRequestId = normalizeText(input.request.clientRequestId);
    const deliveryMode = normalizeDeliveryMode(input.request.address.deliveryMode);
    const carrier = normalizeCarrier(input.request.address.carrier, deliveryMode);
    const agencyName = normalizeText(input.request.address.agencyName);
    const documentType = normalizeDocumentType(input.request.customer.documentType);
    const documentNumber = normalizeDocumentNumber(input.request.customer.documentNumber, documentType);

    if (!clientRequestId) {
      throw new BadRequestException("El checkout requiere una clave de idempotencia.");
    }

    if (deliveryMode === "province_shalom_pickup") {
      if (carrier !== "shalom") {
        throw new BadRequestException("Los envíos a provincia solo se atienden por Shalom.");
      }

      if (!agencyName) {
        throw new BadRequestException("Debes indicar la sucursal de Shalom más cercana.");
      }

      if (!documentType) {
        throw new BadRequestException("El envío a provincia requiere seleccionar un tipo de documento.");
      }

      if (!isValidDocumentNumber(documentType, documentNumber)) {
        throw new BadRequestException("El envío a provincia requiere un número de documento válido para el tipo seleccionado.");
      }
    }

    if (paymentMethod === "manual") {
      if (input.orderStatus !== OrderStatus.PaymentUnderReview) {
        throw new BadRequestException("El pago manual debe crear el pedido en revisión.");
      }

      if (input.paymentStatus !== PaymentStatus.Pending) {
        throw new BadRequestException("El pago manual debe iniciar pendiente.");
      }

      if (!manualEvidenceReference && !input.request.evidenceImageUrl) {
        throw new BadRequestException("El pago manual requiere un comprobante de pago.");
      }

      if (!input.manualStatus || !isManualRequestResolvable(input.manualStatus)) {
        throw new BadRequestException("El pago manual debe iniciar como enviado o en revisión.");
      }

      if (input.checkoutUrl) {
        throw new BadRequestException("El pago manual no debe incluir URL de checkout.");
      }

      return;
    }

    if (input.orderStatus !== OrderStatus.PendingPayment) {
      throw new BadRequestException("El checkout Openpay debe crear el pedido en espera de pago.");
    }

    if (input.paymentStatus !== PaymentStatus.Initiated) {
      throw new BadRequestException("El checkout Openpay debe iniciar como payment initiated.");
    }

    if (input.manualStatus) {
      throw new BadRequestException("El checkout Openpay no acepta estado manual.");
    }

    if (manualEvidenceReference || manualEvidenceNotes) {
      throw new BadRequestException("El checkout Openpay no debe incluir evidencia manual.");
    }

    if (!input.checkoutUrl) {
      throw new BadRequestException("El checkout Openpay requiere una URL de checkout.");
    }
  }

  private buildManualRequestSummary(input: {
    id: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    currencyCode: string;
    status: ManualPaymentRequestStatus;
    evidenceReference?: string;
    evidenceNotes?: string;
    evidenceImageUrl?: string;
    submittedAt: string;
  }): AdminManualPaymentRequestSummary {
    return {
      id: input.id,
      orderNumber: input.orderNumber,
      customerName: input.customerName,
      amount: input.amount,
      currencyCode: input.currencyCode,
      status: input.status,
      evidenceReference: input.evidenceReference,
      evidenceNotes: input.evidenceNotes,
      evidenceImageUrl: input.evidenceImageUrl,
      submittedAt: input.submittedAt
    };
  }

  private requireOrder(orderNumber: string) {
    const order = this.orders.get(orderNumber.trim().toUpperCase());
    if (!order) {
      throw new NotFoundException(`No encontramos el pedido ${orderNumber}.`);
    }

    return order;
  }

  private requireManualRequest(order: AdminOrderDetail) {
    if (!order.manualRequest) {
      throw new NotFoundException(`El pedido ${order.orderNumber} no tiene una solicitud manual asociada.`);
    }

    return order.manualRequest;
  }

  private findOrderByManualRequestId(id: string) {
    const order = this.sortedOrders().find((item) => item.manualRequest?.id === id);
    if (!order) {
      throw new NotFoundException(`No encontramos una solicitud manual con id ${id}.`);
    }

    return order;
  }

  private sortedOrders() {
    return Array.from(this.orders.values()).sort((left, right) => {
      const delta = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
      if (delta !== 0) {
        return delta;
      }

      return right.orderNumber.localeCompare(left.orderNumber);
    });
  }

  private toOrderSummary(order: AdminOrderDetail): AdminOrderSummary {
    return {
      orderNumber: order.orderNumber,
      customerName: fullName(order.customer) || order.customer.email,
      total: order.total,
      currencyCode: order.currencyCode,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      salesChannel: order.salesChannel,
      vendorId: order.vendorId,
      vendorCode: order.vendorCode,
      vendorName: order.vendorName,
      manualStatus: order.manualStatus,
      crmStage: order.crmStage,
      providerReference: order.providerReference,
      confirmedAt: order.confirmedAt,
      updatedAt: order.updatedAt,
      createdAt: order.createdAt,
      itemCount: order.items.length
    };
  }

  private toPaymentSummary(order: AdminOrderDetail): AdminPaymentSummary {
    return {
      ...order.payment,
      evidenceReference: order.manualEvidenceReference ?? order.payment.evidenceReference,
      manualStatus: order.manualStatus
    };
  }

  private syncSequence(orderNumber: string) {
    const numeric = Number(orderNumber.replace(/[^\d]/g, ""));
    if (Number.isFinite(numeric)) {
      this.orderSequence = Math.max(this.orderSequence, numeric);
    }
  }

  private seedInitialOrders() {
    const seeds: AdminOrderDetail[] = [
      {
        orderNumber: "HG-10040",
        customer: {
          firstName: "Sofía",
          lastName: "Rivera",
          email: "sofia@example.com",
          phone: "+51 999 111 222"
        },
        address: {
          label: "Casa",
          recipientName: "Sofía Rivera",
          line1: "Jr. Los Pinos 123",
          line2: "Dpto. 201",
          city: "Lima",
          region: "Lima",
          postalCode: "15001",
          countryCode: "PE"
        },
        items: [
          {
            slug: "premium-negro",
            name: "Premium Negro",
            sku: "HG-PN-001",
            quantity: 1,
            unitPrice: 349,
            lineTotal: 349
          }
        ],
        subtotal: 349,
        discount: 0,
        shipping: 0,
        total: 349,
        currencyCode: "PEN",
        paymentMethod: "openpay",
        salesChannel: "web",
        orderStatus: OrderStatus.Confirmed,
        paymentStatus: PaymentStatus.Paid,
        vendorCode: "VEND-021",
        couponCode: undefined,
        notes: "Pedido de referencia para dashboard.",
        providerReference: "OP-HG-10040",
        checkoutUrl: "https://sandbox.openpay.local/checkout/HG-10040",
        manualStatus: undefined,
        manualRequestId: undefined,
        manualEvidenceReference: undefined,
        manualEvidenceNotes: undefined,
        statusHistory: [
          createHistoryEntry(OrderStatus.Draft, "Sistema", "Pedido generado desde storefront.", "2026-03-18T10:00:00.000Z"),
          createHistoryEntry(OrderStatus.PendingPayment, "Sistema", "Enviado a Openpay.", "2026-03-18T10:01:00.000Z"),
          createHistoryEntry(OrderStatus.Paid, "Openpay", "Pago confirmado por proveedor.", "2026-03-18T10:04:00.000Z"),
          createHistoryEntry(OrderStatus.Confirmed, "Operación", "Pedido listo para preparación.", "2026-03-18T10:08:00.000Z")
        ],
        payment: {
          id: "pay-hg-10040",
          orderNumber: "HG-10040",
          customerName: "Sofía Rivera",
          provider: "openpay",
          status: PaymentStatus.Paid,
          amount: 349,
          currencyCode: "PEN",
          manualStatus: undefined,
          notificationStatus: NotificationStatus.Sent,
          evidenceReference: undefined,
          updatedAt: "2026-03-18T10:04:00.000Z"
        },
        manualRequest: undefined,
        createdAt: "2026-03-18T10:00:00.000Z",
        updatedAt: "2026-03-18T10:08:00.000Z"
      },
      {
        orderNumber: "HG-10041",
        customer: {
          firstName: "Carlos",
          lastName: "Gómez",
          email: "carlos@example.com",
          phone: "+51 999 333 444"
        },
        address: {
          label: "Oficina",
          recipientName: "Carlos Gómez",
          line1: "Av. Arequipa 456",
          line2: "Oficina 802",
          city: "Lima",
          region: "Lima",
          postalCode: "15046",
          countryCode: "PE"
        },
        items: [
          {
            slug: "combo-duo-perfecto",
            name: "Combo Dúo Perfecto",
            sku: "HG-CDP-001",
            quantity: 1,
            unitPrice: 449,
            lineTotal: 449
          }
        ],
        subtotal: 449,
        discount: 0,
        shipping: 0,
        total: 449,
        currencyCode: "PEN",
        paymentMethod: "manual",
        salesChannel: "web",
        orderStatus: OrderStatus.PaymentUnderReview,
        paymentStatus: PaymentStatus.Pending,
        vendorCode: "VEND-007",
        couponCode: undefined,
        notes: "Pago manual con comprobante adjunto.",
        providerReference: "MP-HG-10041",
        checkoutUrl: undefined,
        manualStatus: ManualPaymentRequestStatus.UnderReview,
        manualRequestId: "mpr-hg-10041",
        manualEvidenceReference: "comprobante-hg-10041.jpg",
        manualEvidenceNotes: "Comprobante cargado desde checkout.",
        statusHistory: [
          createHistoryEntry(OrderStatus.Draft, "Sistema", "Pedido generado desde storefront.", "2026-03-18T10:20:00.000Z"),
          createHistoryEntry(OrderStatus.PendingPayment, "Sistema", "Pago manual solicitado.", "2026-03-18T10:21:00.000Z"),
          createHistoryEntry(OrderStatus.PaymentUnderReview, "Cliente", "Comprobante cargado para revisión.", "2026-03-18T10:22:00.000Z")
        ],
        payment: {
          id: "pay-hg-10041",
          orderNumber: "HG-10041",
          customerName: "Carlos Gómez",
          provider: "manual",
          status: PaymentStatus.Pending,
          amount: 449,
          currencyCode: "PEN",
          manualStatus: ManualPaymentRequestStatus.UnderReview,
          notificationStatus: NotificationStatus.Pending,
          evidenceReference: "comprobante-hg-10041.jpg",
          updatedAt: "2026-03-18T10:22:00.000Z"
        },
        manualRequest: {
          id: "mpr-hg-10041",
          orderNumber: "HG-10041",
          customerName: "Carlos Gómez",
          amount: 449,
          currencyCode: "PEN",
          status: ManualPaymentRequestStatus.UnderReview,
          evidenceReference: "comprobante-hg-10041.jpg",
          evidenceNotes: "Comprobante cargado desde checkout.",
          submittedAt: "2026-03-18T10:22:00.000Z"
        },
        createdAt: "2026-03-18T10:20:00.000Z",
        updatedAt: "2026-03-18T10:22:00.000Z"
      },
      {
        orderNumber: "HG-10042",
        customer: {
          firstName: "Laura",
          lastName: "Mendoza",
          email: "laura@example.com",
          phone: "+51 999 555 666"
        },
        address: {
          label: "Casa",
          recipientName: "Laura Mendoza",
          line1: "Av. Principal 123",
          line2: "Piso 4",
          city: "Lima",
          region: "Lima",
          postalCode: "15001",
          countryCode: "PE"
        },
        items: [
          {
            slug: "clasico-verde",
            name: "Clásico Verde",
            sku: "HG-CV-001",
            quantity: 2,
            unitPrice: 249,
            lineTotal: 498
          },
          {
            slug: "premium-negro",
            name: "Premium Negro",
            sku: "HG-PN-001",
            quantity: 1,
            unitPrice: 349,
            lineTotal: 349
          }
        ],
        subtotal: 847,
        discount: 98,
        shipping: 0,
        total: 749,
        currencyCode: "PEN",
        paymentMethod: "openpay",
        salesChannel: "web",
        orderStatus: OrderStatus.Confirmed,
        paymentStatus: PaymentStatus.Paid,
        vendorCode: "VEND-014",
        couponCode: "RESET10",
        notes: "Pedido con cupón y atribución de vendedor.",
        providerReference: "OP-HG-10042",
        checkoutUrl: "https://sandbox.openpay.local/checkout/HG-10042",
        manualStatus: undefined,
        manualRequestId: undefined,
        manualEvidenceReference: undefined,
        manualEvidenceNotes: undefined,
        statusHistory: [
          createHistoryEntry(OrderStatus.Draft, "Sistema", "Pedido generado desde storefront.", "2026-03-18T10:36:00.000Z"),
          createHistoryEntry(OrderStatus.PendingPayment, "Sistema", "Enviado a Openpay.", "2026-03-18T10:37:00.000Z"),
          createHistoryEntry(OrderStatus.Paid, "Openpay", "Pago confirmado por proveedor.", "2026-03-18T10:39:00.000Z"),
          createHistoryEntry(OrderStatus.Confirmed, "Operación", "Pedido listo para preparación.", "2026-03-18T10:42:00.000Z")
        ],
        payment: {
          id: "pay-hg-10042",
          orderNumber: "HG-10042",
          customerName: "Laura Mendoza",
          provider: "openpay",
          status: PaymentStatus.Paid,
          amount: 749,
          currencyCode: "PEN",
          manualStatus: undefined,
          notificationStatus: NotificationStatus.Sent,
          evidenceReference: undefined,
          updatedAt: "2026-03-18T10:39:00.000Z"
        },
        manualRequest: undefined,
        createdAt: "2026-03-18T10:36:00.000Z",
        updatedAt: "2026-03-18T10:42:00.000Z"
      }
    ];

    for (const seed of seeds) {
      this.orders.set(seed.orderNumber, seed);
      this.syncSequence(seed.orderNumber);
    }
  }

  private restoreSnapshot(snapshot: OrdersSnapshot) {
    this.orders.clear();
    this.idempotencyIndex.clear();
    for (const order of snapshot.orders ?? []) {
      this.orders.set(order.orderNumber, order);
      this.syncSequence(order.orderNumber);
    }

    for (const [clientRequestId, record] of Object.entries(snapshot.idempotencyIndex ?? {})) {
      this.idempotencyIndex.set(clientRequestId, record);
    }
  }

  private sanitizeSnapshot(snapshot: OrdersSnapshot) {
    if (demoRuntimeEnabled()) {
      return undefined;
    }

    const orders = (snapshot.orders ?? []).filter((order) => !demoOrderNumbers.has(order.orderNumber));
    const validOrderNumbers = new Set(orders.map((order) => order.orderNumber));
    const idempotencyIndex = Object.fromEntries(
      Object.entries(snapshot.idempotencyIndex ?? {}).filter(([, record]) => validOrderNumbers.has(record.orderNumber))
    );

    const hasOrderChanges = orders.length !== (snapshot.orders ?? []).length;
    const hasIdempotencyChanges = Object.keys(idempotencyIndex).length !== Object.keys(snapshot.idempotencyIndex ?? {}).length;

    if (!hasOrderChanges && !hasIdempotencyChanges) {
      return undefined;
    }

    return {
      orders: orders.map((order) => ({
        ...order,
        customer: { ...order.customer },
        address: { ...order.address },
        items: cloneOrderItems(order.items),
        statusHistory: order.statusHistory.map((entry) => ({ ...entry })),
        payment: { ...order.payment },
        manualRequest: order.manualRequest ? { ...order.manualRequest } : undefined
      })),
      idempotencyIndex
    };
  }

  private async persistState() {
    await this.moduleStateService.save<OrdersSnapshot>("orders", this.buildSnapshot());
  }

  private buildSnapshot(): OrdersSnapshot {
    return {
      orders: Array.from(this.orders.values()).map((order) => ({
        ...order,
        customer: { ...order.customer },
        address: { ...order.address },
        items: cloneOrderItems(order.items),
        statusHistory: order.statusHistory.map((entry) => ({ ...entry })),
        payment: { ...order.payment },
        manualRequest: order.manualRequest ? { ...order.manualRequest } : undefined
      })),
      idempotencyIndex: Object.fromEntries(this.idempotencyIndex.entries())
    };
  }
}
