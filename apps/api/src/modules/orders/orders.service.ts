import { BadRequestException, ConflictException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { createHash } from "node:crypto";
import {
  ManualPaymentRequestStatus,
  LoyaltyMovementStatus,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  type AdminManualPaymentRequestSummary,
  type AdminOrderDetail,
  type AdminOrderSummary,
  type AdminPaymentSummary,
  type CheckoutAddressInput,
  type CheckoutCustomerInput,
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

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
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

function fullName(customer: CheckoutCustomerInput) {
  return [customer.firstName, customer.lastName].map((part) => part.trim()).filter(Boolean).join(" ");
}

function normalizeCustomer(customer: CheckoutCustomerInput) {
  return {
    firstName: customer.firstName.trim(),
    lastName: customer.lastName.trim(),
    email: customer.email.trim().toLowerCase(),
    phone: customer.phone.trim()
  };
}

function normalizeAddress(address: CheckoutAddressInput) {
  return {
    label: normalizeText(address.label),
    recipientName: address.recipientName.trim(),
    line1: address.line1.trim(),
    line2: normalizeText(address.line2),
    city: address.city.trim(),
    region: address.region.trim(),
    postalCode: address.postalCode.trim(),
    countryCode: address.countryCode?.trim().toUpperCase() || "PE"
  };
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
        phone: request.customer.phone.trim()
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
    private readonly moduleStateService: ModuleStateService
  ) {
    if (!isProductionRuntime()) {
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
      orderStatus,
      paymentStatus,
      vendorCode: normalizeCode(input.request.vendorCode),
      couponCode: normalizeCode(input.request.couponCode),
      notes: normalizeText(input.request.notes),
      providerReference: input.providerReference,
      checkoutUrl: input.checkoutUrl,
      manualStatus,
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
      audience: customerName,
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

  listOrders() {
    const orders = this.sortedOrders().map((order) => this.toOrderSummary(order));
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

  async approveManualRequest(id: string, reviewer?: string, notes?: string) {
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

    await this.applyManualDecision(order, {
      status: ManualPaymentRequestStatus.Approved,
      orderStatus: OrderStatus.Paid,
      paymentStatus: PaymentStatus.Paid,
      reviewer: reviewerName,
      notes: note,
      occurredAt: now
    });

    return {
      status: "ok" as const,
      message: "La solicitud fue aprobada operativamente y el pedido quedó en estado pagado.",
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

  private async applyManualDecision(
    order: AdminOrderDetail,
    input: {
      status: ManualPaymentRequestStatus.Approved | ManualPaymentRequestStatus.Rejected;
      orderStatus: OrderStatus.Paid | OrderStatus.Cancelled;
      paymentStatus: PaymentStatus.Paid | PaymentStatus.Failed;
      reviewer: string;
      notes: string;
      occurredAt: string;
    }
  ) {
    const manualRequest = this.requireManualRequest(order);

    order.manualStatus = input.status;
    order.orderStatus = input.orderStatus;
    order.paymentStatus = input.paymentStatus;
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

    manualRequest.status = input.status;
    manualRequest.reviewedAt = input.occurredAt;
    manualRequest.reviewer = input.reviewer;
    manualRequest.notes = input.notes;

    order.statusHistory = [
      ...order.statusHistory,
      createHistoryEntry(
        input.orderStatus,
        input.reviewer,
        input.status === ManualPaymentRequestStatus.Approved ? "Pago manual aprobado." : "Pago manual rechazado.",
        input.occurredAt
      )
    ];

    await this.inventoryService.syncOrder({
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      items: order.items,
      occurredAt: input.occurredAt,
      note: input.status === ManualPaymentRequestStatus.Approved ? "Inventario confirmado por aprobación manual." : "Inventario liberado por rechazo manual."
    });

    if (input.status === ManualPaymentRequestStatus.Approved) {
      this.loyaltyService.settleOrderPoints(order.orderNumber, input.reviewer);
      this.auditService.recordAdminAction({
        actionType: "payments.manual_request.approved",
        targetType: "manual_payment_request",
        targetId: manualRequest.id,
        summary: `La revisión manual de ${order.orderNumber} fue aprobada.`,
        actorName: input.reviewer,
        metadata: {
          orderNumber: order.orderNumber,
          reviewer: input.reviewer
        }
      });
      this.observabilityService.recordDomainEvent({
        category: "payment",
        action: "payment.manual.approved",
        detail: `La solicitud ${manualRequest.id} aprobó el pedido ${order.orderNumber}.`,
        relatedType: "manual_payment_request",
        relatedId: manualRequest.id
      });
      void this.notificationsService.queueNotification({
        channel: NotificationChannel.Email,
        audience: order.customer.email,
        subject: `✅ Tu pago fue confirmado — Pedido ${order.orderNumber}`,
        body: `Hola ${manualRequest.customerName},\n\nTu comprobante fue revisado y aprobado. Tu pedido ${order.orderNumber} ya está confirmado y pronto nos pondremos en contacto contigo para coordinar la entrega.\n\n¡Gracias por tu compra!`,
        source: "payments",
        relatedType: "order",
        relatedId: order.orderNumber,
        status: NotificationStatus.Pending
      });
      void this.notificationsService.recordEvent(
        "order.manual.approved",
        "payments",
        manualRequest.customerName,
        `El pedido ${order.orderNumber} quedó pagado después de la revisión manual.`,
        "order",
        order.orderNumber
      );
    } else {
      this.loyaltyService.reverseOrderPoints(order.orderNumber, input.reviewer);
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

    if (!clientRequestId) {
      throw new BadRequestException("El checkout requiere una clave de idempotencia.");
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
      vendorCode: order.vendorCode,
      manualStatus: order.manualStatus,
      providerReference: order.providerReference,
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
    if (!isProductionRuntime()) {
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
