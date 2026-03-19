import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  ManualPaymentRequestStatus,
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
  type OrderItemSummary,
  type OrderStatusHistorySummary
} from "@huelegood/shared";
import { wrapResponse } from "../../common/response";

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
    countryCode: address.countryCode?.trim().toUpperCase() || "MX"
  };
}

function buildOrderItems(items: CheckoutQuoteSummary["items"]): OrderItemSummary[] {
  return items.map((item) => ({
    slug: item.slug,
    name: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal
  }));
}

@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, AdminOrderDetail>();

  private orderSequence = 10042;

  constructor() {
    this.seedInitialOrders();
  }

  reserveOrderNumber() {
    this.orderSequence += 1;
    return `HG-${this.orderSequence}`;
  }

  createCheckoutOrder(input: CreateCheckoutOrderInput) {
    const orderNumber = input.orderNumber.trim().toUpperCase();
    if (this.orders.has(orderNumber)) {
      throw new BadRequestException(`Ya existe un pedido con el número ${orderNumber}.`);
    }

    this.syncSequence(orderNumber);

    const createdAt = new Date().toISOString();
    const customer = normalizeCustomer(input.request.customer);
    const address = normalizeAddress(input.request.address);
    const manualEvidenceReference = normalizeText(input.request.manualEvidenceReference);
    const manualEvidenceNotes = normalizeText(input.request.manualEvidenceNotes);
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

    this.orders.set(orderNumber, order);
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

  approveManualRequest(id: string, reviewer?: string, notes?: string) {
    const order = this.findOrderByManualRequestId(id);
    const now = new Date().toISOString();
    const reviewerName = normalizeText(reviewer) ?? "operador";
    const note = normalizeText(notes) ?? "Aprobado operativamente.";

    this.applyManualDecision(order, {
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

  rejectManualRequest(id: string, reviewer?: string, notes?: string) {
    const order = this.findOrderByManualRequestId(id);
    const now = new Date().toISOString();
    const reviewerName = normalizeText(reviewer) ?? "operador";
    const note = normalizeText(notes) ?? "Rechazado operativamente.";

    this.applyManualDecision(order, {
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

  private applyManualDecision(
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

  private buildManualRequestSummary(input: {
    id: string;
    orderNumber: string;
    customerName: string;
    amount: number;
    currencyCode: string;
    status: ManualPaymentRequestStatus;
    evidenceReference?: string;
    evidenceNotes?: string;
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
        currencyCode: "MXN",
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
          currencyCode: "MXN",
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
        currencyCode: "MXN",
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
          currencyCode: "MXN",
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
          currencyCode: "MXN",
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
        currencyCode: "MXN",
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
          currencyCode: "MXN",
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
}
