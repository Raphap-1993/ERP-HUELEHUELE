import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException, OnModuleInit, forwardRef } from "@nestjs/common";
import { createHash } from "node:crypto";
import {
  type AdminDispatchLabelAvailabilitySummary,
  type AdminDispatchLabelPrintInput,
  type AdminDispatchLabelSummary,
  type AdminDispatchOrderSummary,
  type AdminManualPaymentCreateInput,
  type AdminOrderVendorOption,
  type AdminOrderVendorAssignmentInput,
  CrmStage,
  type AdminOrderStatusTransitionInput,
  ManualPaymentRequestStatus,
  LoyaltyMovementStatus,
  NotificationChannel,
  NotificationStatus,
  OrderStatus,
  PaymentStatus,
  type AuthSessionSummary,
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
  type FulfillmentAssignmentStatusValue,
  type FulfillmentAssignmentStrategyValue,
  type FulfillmentMissingLineSummary,
  inferOrderCommercialConfirmationAt,
  type InventoryAllocationSummary,
  isCheckoutStandardDeliveryProvinceCode,
  isOrderStatusCommerciallyConfirmed,
  type OrderCommercialTraceRoute,
  type OrderCommercialTraceStatus,
  type OrderCommercialTraceSummary,
  type OrderFulfillmentAssignmentInput,
  type OrderFulfillmentAssignmentSummary,
  type OrderFulfillmentSuggestionSummary,
  type OrderItemSummary,
  type OrderStatusHistorySummary,
  type WarehouseServiceAreaScopeValue
} from "@huelegood/shared";
import { isConfigured } from "../../common/env";
import { wrapResponse } from "../../common/response";
import { AuditService } from "../audit/audit.service";
import { InventoryService } from "../inventory/inventory.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { NotificationsService } from "../notifications/notifications.service";
import { ObservabilityService } from "../observability/observability.service";
import { ModuleStateService } from "../../persistence/module-state.service";
import { PrismaService } from "../../prisma/prisma.service";
import { PeruUbigeoService } from "../commerce/peru-ubigeo.service";
import { VendorsService } from "../vendors/vendors.service";
import { CustomersService } from "../customers/customers.service";

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

interface FulfillmentCoverageMatch {
  scope?: WarehouseServiceAreaScopeValue;
  specificityRank: number;
  priority: number;
  source: "service_area" | "warehouse_location" | "default_fallback";
}

interface SuggestionWarehouseRecord {
  id: string;
  code: string;
  name: string;
  status: string;
  priority: number;
  departmentCode: string;
  provinceCode: string;
  districtCode: string;
  countryCode: string;
  addressLine1: string;
  addressLine2: string | null;
  reference: string | null;
  serviceAreas: Array<{
    scopeType: WarehouseServiceAreaScopeValue;
    scopeCode: string;
    priority: number;
    isActive: boolean;
  }>;
}

interface FulfillmentSuggestionCandidate {
  warehouse: SuggestionWarehouseRecord;
  coverage: FulfillmentCoverageMatch;
  defaultWeight: number;
  isCommonDefault: boolean;
  availableForAllLines: boolean;
  missingLines: FulfillmentMissingLineSummary[];
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
const dispatchQueueStatuses = new Set<OrderStatus>([OrderStatus.Confirmed, OrderStatus.Preparing, OrderStatus.Shipped]);
const dispatchLabelStatuses = new Set<OrderStatus>([
  OrderStatus.Confirmed,
  OrderStatus.Preparing,
  OrderStatus.Shipped,
  OrderStatus.Delivered,
  OrderStatus.Completed
]);
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

function historyEntryTimestamp(entry: Pick<OrderStatusHistorySummary, "occurredAt">) {
  const parsed = Date.parse(entry.occurredAt);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function latestHistoryEntry(
  items: OrderStatusHistorySummary[],
  statuses: OrderStatus[]
) {
  return items
    .filter((entry) => statuses.includes(entry.status))
    .sort((left, right) => historyEntryTimestamp(right) - historyEntryTimestamp(left))[0];
}

function normalizeCommercialTraceStatus(
  status?: ManualPaymentRequestStatus
): OrderCommercialTraceStatus {
  if (status === ManualPaymentRequestStatus.Approved) {
    return "confirmed";
  }

  if (status === ManualPaymentRequestStatus.Rejected || status === ManualPaymentRequestStatus.Expired) {
    return "rejected";
  }

  return "pending";
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

function totalOrderUnits(items: OrderItemSummary[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function dispatchLabelActionLabel(status?: OrderStatus): "Imprimir etiqueta" | "Reimprimir etiqueta" {
  return status === OrderStatus.Delivered || status === OrderStatus.Completed
    ? "Reimprimir etiqueta"
    : "Imprimir etiqueta";
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
    departmentCode: normalizeText(address.departmentCode),
    departmentName: normalizeText(address.departmentName),
    provinceCode: normalizeText(address.provinceCode),
    provinceName: normalizeText(address.provinceName),
    districtCode: normalizeText(address.districtCode),
    districtName: normalizeText(address.districtName),
    deliveryMode,
    carrier: normalizeCarrier(address.carrier, deliveryMode),
    agencyName: normalizeText(address.agencyName),
    payOnPickup: deliveryMode === "province_shalom_pickup" ? true : address.payOnPickup === true ? true : undefined
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

function rewriteItemsToWarehouse(items: OrderItemSummary[], warehouseId: string) {
  return items.map((item) => ({
    ...item,
    inventoryAllocations:
      item.inventoryAllocations && item.inventoryAllocations.length > 0
        ? item.inventoryAllocations.map((allocation) => ({
            ...allocation,
            warehouseId
          }))
        : item.variantId
          ? [
              {
                variantId: item.variantId,
                sku: item.sku,
                name: item.name,
                quantity: item.quantity,
                warehouseId
              }
            ]
          : item.inventoryAllocations
  }));
}

function summarizeMissingLines(missingLines: FulfillmentMissingLineSummary[]) {
  if (!missingLines.length) {
    return "El almacén no cubre todas las líneas del pedido.";
  }

  return missingLines
    .slice(0, 3)
    .map((line) => `${line.sku} (${line.availableQuantity}/${line.requestedQuantity})`)
    .join(", ");
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

function normalizeFulfillmentStrategy(value?: string): FulfillmentAssignmentStrategyValue {
  const allowed: FulfillmentAssignmentStrategyValue[] = [
    "manual",
    "warehouse_default",
    "coverage_priority",
    "stock_priority",
    "fallback"
  ];
  const normalized = normalizeText(value) as FulfillmentAssignmentStrategyValue | undefined;
  return normalized && allowed.includes(normalized) ? normalized : "warehouse_default";
}

function normalizeFulfillmentStatus(value?: string): FulfillmentAssignmentStatusValue {
  const allowed: FulfillmentAssignmentStatusValue[] = ["pending", "assigned", "skipped", "cancelled"];
  const normalized = normalizeText(value) as FulfillmentAssignmentStatusValue | undefined;
  return normalized && allowed.includes(normalized) ? normalized : "assigned";
}

function fulfillmentCoverageScopeLabel(scope?: WarehouseServiceAreaScopeValue) {
  if (scope === "district") {
    return "distrito";
  }

  if (scope === "province") {
    return "provincia";
  }

  if (scope === "department") {
    return "departamento";
  }

  if (scope === "zone") {
    return "zona";
  }

  return "cobertura";
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
    @Inject(forwardRef(() => VendorsService)) private readonly vendorsService: VendorsService,
    private readonly moduleStateService: ModuleStateService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => CustomersService)) private readonly customersService: CustomersService,
    private readonly peruUbigeoService: PeruUbigeoService
  ) {
    if (demoRuntimeEnabled()) {
      this.seedInitialOrders();
    }
  }

  async onModuleInit() {
    const databaseConfigured = isConfigured(process.env.DATABASE_URL);
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

    if (databaseConfigured) {
      await this.hydrateLegacyOrders();
    }
    this.hydrateLegacyMetadata();
    this.promoteLegacyPaidWebOrders();
    if (databaseConfigured) {
      await this.reconcileCustomerLinks();
      await this.backfillFulfillmentSuggestions();
    }
    await this.persistState();

    if (databaseConfigured) {
      await this.inventoryService.rebuildFromOrders(
        this.sortedOrders().map((order) => ({
          orderNumber: order.orderNumber,
          orderStatus: order.orderStatus,
          items: order.items,
          fulfillmentWarehouseId: order.fulfillmentAssignment?.warehouseId,
          createdAt: order.createdAt,
          occurredAt: order.updatedAt
        }))
      );
    }
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
      manualRequest: order.manualRequest ? { ...order.manualRequest } : undefined,
      commercialTrace: order.commercialTrace ? { ...order.commercialTrace } : undefined
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

    const orderItems = await this.inventoryService.hydrateOrderItems(buildOrderItems(input.quote.items));
    const { fulfillmentSuggestion, fulfillmentAssignment } = await this.resolveFulfillmentPlan(
      orderNumber,
      address,
      orderItems,
      createdAt
    );

    const order: AdminOrderDetail = {
      orderNumber,
      customerId: undefined,
      customerConflictId: undefined,
      customer,
      address,
      items: orderItems,
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
      fulfillmentSuggestion,
      fulfillmentAssignment,
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
      commercialTrace: undefined,
      confirmedAt: undefined,
      createdAt,
      updatedAt: createdAt
    };

    this.syncCommercialTrace(order);
    await this.resolveOrderCustomerLink(order);
    if (order.fulfillmentAssignment?.warehouseId) {
      order.items = rewriteItemsToWarehouse(order.items, order.fulfillmentAssignment.warehouseId);
    }

    await this.synchronizeOrderInventory(order, createdAt, "Reserva generada al crear el checkout.");

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

    if (order.paymentMethod === "manual") {
      void this.queueManualReviewRequiredNotification(order);
    }

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
    address: {
      line1: string;
      line2?: string;
      city?: string;
      region?: string;
      countryCode?: string;
      departmentCode?: string;
      provinceCode?: string;
      districtCode?: string;
    };
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
    const address = this.normalizeBackofficeAddress(customer, input.address);

    const orderItems = await this.inventoryService.hydrateOrderItems(
      input.items.map((item) => ({
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
      }))
    );

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

    const { fulfillmentSuggestion, fulfillmentAssignment } = await this.resolveFulfillmentPlan(
      orderNumber,
      address,
      orderItems,
      createdAt
    );

    const order: AdminOrderDetail = {
      orderNumber,
      customerId: undefined,
      customerConflictId: undefined,
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
      fulfillmentSuggestion,
      fulfillmentAssignment,
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
      commercialTrace: undefined,
      confirmedAt: isPaid ? createdAt : undefined,
      createdAt,
      updatedAt: createdAt
    };

    this.syncCommercialTrace(order);
    await this.resolveOrderCustomerLink(order);
    if (order.fulfillmentAssignment?.warehouseId) {
      order.items = rewriteItemsToWarehouse(order.items, order.fulfillmentAssignment.warehouseId);
    }

    await this.synchronizeOrderInventory(order, createdAt, "Reserva generada por pedido manual desde backoffice.");

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

      void this.queueDispatchReadyNotification(
        order,
        "Pedido registrado desde backoffice con pago confirmado y listo para gestión operativa."
      );
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

  private normalizeBackofficeAddress(
    customer: CheckoutCustomerInput,
    address: {
      line1: string;
      line2?: string;
      city?: string;
      region?: string;
      countryCode?: string;
      departmentCode?: string;
      provinceCode?: string;
      districtCode?: string;
    }
  ) {
    const recipientName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");
    const countryCode = normalizeText(address.countryCode)?.toUpperCase() || "PE";
    const departmentCode = normalizeText(address.departmentCode);
    const provinceCode = normalizeText(address.provinceCode);
    const districtCode = normalizeText(address.districtCode);
    const hasAnyUbigeo = Boolean(departmentCode || provinceCode || districtCode);

    if (countryCode === "PE" && hasAnyUbigeo) {
      if (!departmentCode || !provinceCode || !districtCode) {
        throw new BadRequestException("Debes completar departamento, provincia y distrito para pedidos manuales en Perú.");
      }

      const ubigeo = this.peruUbigeoService.resolveSelection({
        departmentCode,
        provinceCode,
        districtCode
      });

      return normalizeAddress({
        recipientName,
        line1: address.line1,
        line2: address.line2,
        city: ubigeo.districtName,
        region: ubigeo.provinceName,
        postalCode: "",
        countryCode: "PE",
        departmentCode: ubigeo.departmentCode,
        departmentName: ubigeo.departmentName,
        provinceCode: ubigeo.provinceCode,
        provinceName: ubigeo.provinceName,
        districtCode: ubigeo.districtCode,
        districtName: ubigeo.districtName
      });
    }

    const city = normalizeText(address.city);
    const region = normalizeText(address.region) ?? city;

    if (!city) {
      throw new BadRequestException("La ciudad o distrito del pedido manual es obligatoria.");
    }

    return normalizeAddress({
      recipientName,
      line1: address.line1,
      line2: address.line2,
      city,
      region: region ?? city,
      postalCode: "",
      countryCode
    });
  }

  getOrderSnapshot(orderNumber: string) {
    return this.orders.get(orderNumber.trim().toUpperCase()) ?? null;
  }

  async applyCustomerResolution(
    orderNumber: string,
    input: {
      customerId?: string;
      customerConflictId?: string;
    }
  ) {
    const order = this.requireOrder(orderNumber);
    const changed = this.setOrderCustomerLink(order, input);
    if (changed) {
      await this.persistState();
    }

    return this.toOrderSummary(order);
  }

  async reassignMergedCustomer(sourceCustomerId: string, targetCustomerId: string) {
    let changed = false;

    for (const order of this.orders.values()) {
      if (order.customerId !== sourceCustomerId) {
        continue;
      }

      order.customerId = targetCustomerId;
      order.customerConflictId = undefined;
      changed = true;
    }

    if (changed) {
      await this.persistState();
    }
  }

  private async reconcileCustomerLinks() {
    const orders = Array.from(this.orders.values()).sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    let changed = false;

    for (const order of orders) {
      const didChange = await this.resolveOrderCustomerLink(order);
      changed = changed || didChange;
    }

    return changed;
  }

  private async resolveOrderCustomerLink(order: AdminOrderDetail) {
    const resolution = await this.customersService.resolveCustomerFromOrderSnapshot(order);
    return this.setOrderCustomerLink(order, resolution);
  }

  private setOrderCustomerLink(
    order: AdminOrderDetail,
    resolution: {
      customerId?: string;
      customerConflictId?: string;
    }
  ) {
    const nextCustomerId = resolution.customerId;
    const nextConflictId = resolution.customerConflictId;

    if (order.customerId === nextCustomerId && order.customerConflictId === nextConflictId) {
      return false;
    }

    order.customerId = nextCustomerId;
    order.customerConflictId = nextConflictId;
    return true;
  }

  private async backfillFulfillmentSuggestions() {
    let changed = false;

    for (const order of this.orders.values()) {
      const nextSuggestion = await this.buildFulfillmentSuggestion(
        order.orderNumber,
        order.address,
        order.items,
        order.updatedAt
      );
      const currentSerialized = JSON.stringify(order.fulfillmentSuggestion ?? null);
      const nextSerialized = JSON.stringify(nextSuggestion ?? null);

      if (currentSerialized !== nextSerialized) {
        order.fulfillmentSuggestion = nextSuggestion;
        changed = true;
      }

      if (!order.fulfillmentAssignment && nextSuggestion?.status === "suggested" && nextSuggestion.canAutoAssign && nextSuggestion.warehouseId) {
        order.fulfillmentAssignment = await this.buildFulfillmentAssignment(order.orderNumber, {
          warehouseId: nextSuggestion.warehouseId,
          assignedAt: nextSuggestion.suggestedAt,
          strategy: nextSuggestion.strategy,
          status: "assigned",
          notes: `Autoasignado por suggestion engine v1. ${nextSuggestion.reason}`
        });
        order.items = rewriteItemsToWarehouse(order.items, nextSuggestion.warehouseId);
        changed = true;
      }
    }

    return changed;
  }

  private async resolveFulfillmentPlan(
    orderNumber: string,
    address: AdminOrderDetail["address"],
    items: OrderItemSummary[],
    suggestedAt: string
  ) {
    const fulfillmentSuggestion = await this.buildFulfillmentSuggestion(orderNumber, address, items, suggestedAt);
    const fulfillmentAssignment =
      fulfillmentSuggestion?.status === "suggested" &&
      fulfillmentSuggestion.canAutoAssign &&
      fulfillmentSuggestion.warehouseId
        ? await this.buildFulfillmentAssignment(orderNumber, {
            warehouseId: fulfillmentSuggestion.warehouseId,
            assignedAt: suggestedAt,
            strategy: fulfillmentSuggestion.strategy,
            status: "assigned",
            notes: `Autoasignado por suggestion engine v1. ${fulfillmentSuggestion.reason}`
          })
        : undefined;

    return {
      fulfillmentSuggestion,
      fulfillmentAssignment
    };
  }

  private async applyAlgorithmicFulfillmentPlan(
    order: AdminOrderDetail,
    occurredAt: string,
    actorName: string,
    options: { syncInventory?: boolean } = {}
  ) {
    if (order.fulfillmentAssignment) {
      return {
        changed: false,
        assigned: false
      };
    }

    const { fulfillmentSuggestion, fulfillmentAssignment } = await this.resolveFulfillmentPlan(
      order.orderNumber,
      order.address,
      order.items,
      occurredAt
    );
    const comparableCurrentSuggestion = order.fulfillmentSuggestion
      ? { ...order.fulfillmentSuggestion, suggestedAt: "" }
      : null;
    const comparableNextSuggestion = fulfillmentSuggestion
      ? { ...fulfillmentSuggestion, suggestedAt: "" }
      : null;
    let changed = JSON.stringify(comparableCurrentSuggestion) !== JSON.stringify(comparableNextSuggestion);
    let assigned = false;

    if (changed) {
      order.fulfillmentSuggestion = fulfillmentSuggestion;
    }

    if (!order.fulfillmentAssignment && fulfillmentAssignment?.warehouseId) {
      order.fulfillmentSuggestion = fulfillmentSuggestion;
      order.fulfillmentAssignment = fulfillmentAssignment;
      order.items = rewriteItemsToWarehouse(order.items, fulfillmentAssignment.warehouseId);
      order.statusHistory.unshift(
        createHistoryEntry(
          order.orderStatus,
          actorName,
          `Origen de despacho autoasignado por triangulación a ${fulfillmentAssignment.warehouseName}.`,
          occurredAt
        )
      );
      changed = true;
      assigned = true;

      if (options.syncInventory) {
        await this.synchronizeOrderInventory(
          order,
          occurredAt,
          `Reserva alineada por triangulación al origen ${fulfillmentAssignment.warehouseName}.`,
          {
            allowWarehouseReallocation: true
          }
        );
      }
    }

    if (changed) {
      order.updatedAt = occurredAt;
    }

    return {
      changed,
      assigned
    };
  }

  private async synchronizeOrderInventory(
    order: AdminOrderDetail,
    occurredAt: string,
    note: string,
    options: { allowWarehouseReallocation?: boolean; skipAvailabilityCheck?: boolean } = {}
  ) {
    await this.inventoryService.syncOrder(
      {
        orderNumber: order.orderNumber,
        orderStatus: order.orderStatus,
        items: order.items,
        fulfillmentWarehouseId: order.fulfillmentAssignment?.warehouseId,
        occurredAt,
        note
      },
      {
        allowWarehouseReallocation: options.allowWarehouseReallocation,
        skipAvailabilityCheck: options.skipAvailabilityCheck
      }
    );
  }

  private async validateWarehouseAssignment(
    order: AdminOrderDetail,
    warehouseId: string
  ) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      include: {
        serviceAreas: true
      }
    });

    if (!warehouse) {
      throw new NotFoundException(`Almacén no encontrado: ${warehouseId}`);
    }

    if (warehouse.status !== "active") {
      throw new ConflictException(`El almacén ${warehouse.name} no está activo para fulfillment.`);
    }

    if (this.hasNormalizedDestinationUbigeo(order.address)) {
      const coverage = this.matchWarehouseCoverage(warehouse, order.address, false);
      if (!coverage) {
        throw new ConflictException(`El almacén ${warehouse.name} no cubre el destino actual del pedido.`);
      }
    }

    const availability = await this.inventoryService.assessWarehouseFulfillment({
      orderNumber: order.orderNumber,
      warehouseId,
      items: order.items
    });

    if (!availability.availableForAllLines) {
      throw new ConflictException(
        `El almacén ${warehouse.name} no tiene stock suficiente para todas las líneas. ${summarizeMissingLines(availability.missingLines)}.`
      );
    }
  }

  private collectDefaultWarehouseWeights(items: OrderItemSummary[]) {
    const weights = new Map<string, number>();
    const distinctWarehouseIds = new Set<string>();
    let totalWeightedAllocations = 0;

    for (const item of items) {
      for (const allocation of item.inventoryAllocations ?? []) {
        const warehouseId = normalizeText(allocation.warehouseId);
        if (!warehouseId) {
          continue;
        }

        const quantity = Math.max(1, Math.trunc(Number(allocation.quantity) || 0));
        weights.set(warehouseId, (weights.get(warehouseId) ?? 0) + quantity);
        distinctWarehouseIds.add(warehouseId);
        totalWeightedAllocations += quantity;
      }
    }

    return {
      weights,
      totalWeightedAllocations,
      commonDefaultWarehouseId:
        distinctWarehouseIds.size === 1 ? Array.from(distinctWarehouseIds)[0] : undefined
    };
  }

  private hasNormalizedDestinationUbigeo(address: AdminOrderDetail["address"]) {
    return Boolean(
      normalizeText(address.departmentCode) &&
        normalizeText(address.provinceCode) &&
        normalizeText(address.districtCode)
    );
  }

  private async loadActiveWarehousesForSuggestion() {
    return this.prisma.warehouse.findMany({
      where: {
        status: "active"
      },
      include: {
        serviceAreas: true
      },
      orderBy: [{ priority: "asc" }, { code: "asc" }]
    });
  }

  private matchWarehouseCoverage(
    warehouse: SuggestionWarehouseRecord,
    address: AdminOrderDetail["address"],
    allowDefaultFallback: boolean
  ): FulfillmentCoverageMatch | undefined {
    const departmentCode = normalizeText(address.departmentCode);
    const provinceCode = normalizeText(address.provinceCode);
    const districtCode = normalizeText(address.districtCode);
    const activeServiceAreas = warehouse.serviceAreas.filter((serviceArea) => serviceArea.isActive);

    if (!departmentCode || !provinceCode || !districtCode) {
      return allowDefaultFallback
        ? {
            specificityRank: 90,
            priority: warehouse.priority,
            source: "default_fallback"
          }
        : undefined;
    }

    if (activeServiceAreas.length > 0) {
      const matchingServiceAreas: FulfillmentCoverageMatch[] = [];

      for (const serviceArea of activeServiceAreas) {
        if (serviceArea.scopeType === "district" && serviceArea.scopeCode === districtCode) {
          matchingServiceAreas.push({
            scope: "district",
            specificityRank: 0,
            priority: serviceArea.priority,
            source: "service_area"
          });
          continue;
        }

        if (serviceArea.scopeType === "province" && serviceArea.scopeCode === provinceCode) {
          matchingServiceAreas.push({
            scope: "province",
            specificityRank: 1,
            priority: serviceArea.priority,
            source: "service_area"
          });
          continue;
        }

        if (serviceArea.scopeType === "department" && serviceArea.scopeCode === departmentCode) {
          matchingServiceAreas.push({
            scope: "department",
            specificityRank: 2,
            priority: serviceArea.priority,
            source: "service_area"
          });
        }
      }

      matchingServiceAreas.sort((left, right) => {
          if (left.specificityRank !== right.specificityRank) {
            return left.specificityRank - right.specificityRank;
          }

          return left.priority - right.priority;
        });

      return matchingServiceAreas[0];
    }

    if (warehouse.districtCode === districtCode) {
      return {
        scope: "district",
        specificityRank: 10,
        priority: warehouse.priority,
        source: "warehouse_location"
      };
    }

    if (warehouse.provinceCode === provinceCode) {
      return {
        scope: "province",
        specificityRank: 11,
        priority: warehouse.priority,
        source: "warehouse_location"
      };
    }

    if (warehouse.departmentCode === departmentCode) {
      return {
        scope: "department",
        specificityRank: 12,
        priority: warehouse.priority,
        source: "warehouse_location"
      };
    }

    if (allowDefaultFallback) {
      return {
        specificityRank: 90,
        priority: warehouse.priority,
        source: "default_fallback"
      };
    }

    return undefined;
  }

  private resolveSuggestionBucket(candidate: FulfillmentSuggestionCandidate, hasDestinationUbigeo: boolean) {
    if (candidate.isCommonDefault) {
      if (!hasDestinationUbigeo) {
        return 0;
      }

      if (candidate.coverage.source !== "default_fallback") {
        return 0;
      }

      return 3;
    }

    if (candidate.defaultWeight > 0) {
      return candidate.coverage.source === "default_fallback" ? 4 : 1;
    }

    return candidate.coverage.source === "default_fallback" ? 5 : 2;
  }

  private compareFulfillmentCandidates(
    left: FulfillmentSuggestionCandidate,
    right: FulfillmentSuggestionCandidate,
    hasDestinationUbigeo: boolean
  ) {
    const leftBucket = this.resolveSuggestionBucket(left, hasDestinationUbigeo);
    const rightBucket = this.resolveSuggestionBucket(right, hasDestinationUbigeo);

    if (leftBucket !== rightBucket) {
      return leftBucket - rightBucket;
    }

    if (left.defaultWeight !== right.defaultWeight) {
      return right.defaultWeight - left.defaultWeight;
    }

    if (left.coverage.specificityRank !== right.coverage.specificityRank) {
      return left.coverage.specificityRank - right.coverage.specificityRank;
    }

    if (left.coverage.priority !== right.coverage.priority) {
      return left.coverage.priority - right.coverage.priority;
    }

    if (left.warehouse.priority !== right.warehouse.priority) {
      return left.warehouse.priority - right.warehouse.priority;
    }

    return left.warehouse.code.localeCompare(right.warehouse.code);
  }

  private areEquivalentFulfillmentCandidates(
    left: FulfillmentSuggestionCandidate,
    right: FulfillmentSuggestionCandidate,
    hasDestinationUbigeo: boolean
  ) {
    return (
      this.resolveSuggestionBucket(left, hasDestinationUbigeo) === this.resolveSuggestionBucket(right, hasDestinationUbigeo) &&
      left.defaultWeight === right.defaultWeight &&
      left.coverage.specificityRank === right.coverage.specificityRank &&
      left.coverage.priority === right.coverage.priority &&
      left.warehouse.priority === right.warehouse.priority
    );
  }

  private buildBlockedFulfillmentSuggestion(
    orderNumber: string,
    suggestedAt: string,
    reason: string,
    candidateCount = 0,
    missingLines?: FulfillmentMissingLineSummary[],
    availableForAllLines = false
  ): OrderFulfillmentSuggestionSummary {
    return {
      id: `fs-${orderNumber.toLowerCase()}`,
      orderNumber,
      status: "blocked",
      suggestedAt,
      candidateCount,
      canAutoAssign: false,
      availableForAllLines,
      reason,
      blockingReason: reason,
      missingLines
    };
  }

  private buildFulfillmentSuggestionReason(
    candidate: FulfillmentSuggestionCandidate,
    hasDestinationUbigeo: boolean
  ) {
    if (candidate.isCommonDefault && !hasDestinationUbigeo) {
      return `Todos los ítems convergen en ${candidate.warehouse.name}; como el pedido aún no tiene ubigeo completo, se conserva ese origen base.`;
    }

    if (candidate.isCommonDefault && candidate.coverage.source !== "default_fallback") {
      return `Todos los ítems convergen en ${candidate.warehouse.name} y el destino queda cubierto por ${fulfillmentCoverageScopeLabel(candidate.coverage.scope)}.`;
    }

    if (candidate.defaultWeight > 0 && candidate.coverage.source !== "default_fallback") {
      return `Se sugirió ${candidate.warehouse.name} por triangulación de almacén base, stock disponible y cobertura por ${fulfillmentCoverageScopeLabel(candidate.coverage.scope)}.`;
    }

    if (candidate.coverage.source === "default_fallback") {
      return `No existe cobertura configurada suficiente; ${candidate.warehouse.name} queda como fallback operativo y requiere validación humana.`;
    }

    return `Se sugirió ${candidate.warehouse.name} por triangulación de cobertura, stock disponible y prioridad operativa.`;
  }

  private async buildFulfillmentSuggestion(
    orderNumber: string,
    address: AdminOrderDetail["address"],
    items: OrderItemSummary[],
    suggestedAt: string
  ): Promise<OrderFulfillmentSuggestionSummary> {
    const { weights, commonDefaultWarehouseId } = this.collectDefaultWarehouseWeights(items);
    const hasDestinationUbigeo = this.hasNormalizedDestinationUbigeo(address);
    const warehouses = await this.loadActiveWarehousesForSuggestion();

    if (!warehouses.length) {
      return this.buildBlockedFulfillmentSuggestion(orderNumber, suggestedAt, "No hay almacenes activos disponibles para sugerencia.");
    }

    const candidates: FulfillmentSuggestionCandidate[] = [];
    const stockBlockedCandidates: FulfillmentSuggestionCandidate[] = [];

    for (const warehouse of warehouses) {
      const isCommonDefault = commonDefaultWarehouseId === warehouse.id;
      const coverage = this.matchWarehouseCoverage(warehouse, address, isCommonDefault);
      if (!coverage) {
        continue;
      }

      const availability = await this.inventoryService.assessWarehouseFulfillment({
        orderNumber,
        warehouseId: warehouse.id,
        items
      });

      if (!availability.availableForAllLines) {
        stockBlockedCandidates.push({
          warehouse,
          coverage,
          defaultWeight: weights.get(warehouse.id) ?? 0,
          isCommonDefault,
          availableForAllLines: false,
          missingLines: availability.missingLines
        });
        continue;
      }

      candidates.push({
        warehouse,
        coverage,
        defaultWeight: weights.get(warehouse.id) ?? 0,
        isCommonDefault,
        availableForAllLines: true,
        missingLines: []
      });
    }

    candidates.sort((left, right) => this.compareFulfillmentCandidates(left, right, hasDestinationUbigeo));
    stockBlockedCandidates.sort((left, right) => this.compareFulfillmentCandidates(left, right, hasDestinationUbigeo));

    if (!candidates.length) {
      const bestStockBlockedCandidate = stockBlockedCandidates[0];
      if (bestStockBlockedCandidate) {
        return this.buildBlockedFulfillmentSuggestion(
          orderNumber,
          suggestedAt,
          `El destino tiene cobertura, pero ${bestStockBlockedCandidate.warehouse.name} no alcanza stock suficiente para todas las líneas. ${summarizeMissingLines(bestStockBlockedCandidate.missingLines)}.`,
          stockBlockedCandidates.length,
          bestStockBlockedCandidate.missingLines
        );
      }

      if (!hasDestinationUbigeo) {
        return this.buildBlockedFulfillmentSuggestion(
          orderNumber,
          suggestedAt,
          "El pedido no tiene ubigeo normalizado y no existe un almacén por defecto común para sugerir origen."
        );
      }

      return this.buildBlockedFulfillmentSuggestion(
        orderNumber,
        suggestedAt,
        "No encontramos un almacén activo que cubra el destino del pedido con las reglas actuales."
      );
    }

    if (candidates[1] && this.areEquivalentFulfillmentCandidates(candidates[0], candidates[1], hasDestinationUbigeo)) {
      return this.buildBlockedFulfillmentSuggestion(
        orderNumber,
        suggestedAt,
        "Hay más de un origen igualmente elegible; se requiere decisión operativa manual.",
        candidates.length,
        undefined,
        true
      );
    }

    const selectedCandidate = candidates[0];
    if (!selectedCandidate) {
      return this.buildBlockedFulfillmentSuggestion(
        orderNumber,
        suggestedAt,
        "No pudimos consolidar una sugerencia operativa para este pedido."
      );
    }

    const strategy =
      selectedCandidate.isCommonDefault && (!hasDestinationUbigeo || selectedCandidate.coverage.source !== "default_fallback")
        ? "warehouse_default"
        : selectedCandidate.coverage.source === "default_fallback"
          ? "fallback"
          : "coverage_priority";
    const canAutoAssign =
      selectedCandidate.coverage.source !== "default_fallback" ||
      (selectedCandidate.isCommonDefault && !hasDestinationUbigeo);

    return {
      id: `fs-${orderNumber.toLowerCase()}`,
      orderNumber,
      status: "suggested",
      strategy,
      suggestedAt,
      warehouseId: selectedCandidate.warehouse.id,
      warehouseCode: selectedCandidate.warehouse.code,
      warehouseName: selectedCandidate.warehouse.name,
      coverageScope: selectedCandidate.coverage.scope,
      candidateCount: candidates.length,
      canAutoAssign,
      availableForAllLines: selectedCandidate.availableForAllLines,
      reason: this.buildFulfillmentSuggestionReason(selectedCandidate, hasDestinationUbigeo)
    };
  }

  private async buildFulfillmentAssignment(
    orderNumber: string,
    input: Required<Pick<OrderFulfillmentAssignmentInput, "warehouseId">> &
      Partial<Omit<OrderFulfillmentAssignmentInput, "warehouseId">>
  ): Promise<OrderFulfillmentAssignmentSummary> {
    const warehouseId = normalizeText(input.warehouseId);
    if (!warehouseId) {
      throw new BadRequestException("El fulfillment requiere un warehouseId.");
    }

    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        countryCode: true,
        departmentCode: true,
        departmentName: true,
        provinceCode: true,
        provinceName: true,
        districtCode: true,
        districtName: true,
        addressLine1: true,
        addressLine2: true,
        reference: true
      }
    });

    if (!warehouse) {
      throw new NotFoundException(`Almacén no encontrado: ${warehouseId}`);
    }

    if (warehouse.status !== "active") {
      throw new ConflictException(`El almacén ${warehouse.name} no está activo para fulfillment.`);
    }

    const assignedAt = normalizeText(input.assignedAt) ?? new Date().toISOString();

    return {
      id: `fa-${orderNumber.toLowerCase()}`,
      orderNumber,
      warehouseId: warehouse.id,
      warehouseCode: warehouse.code,
      warehouseName: warehouse.name,
      status: normalizeFulfillmentStatus(input.status),
      strategy: normalizeFulfillmentStrategy(input.strategy),
      assignedAt,
      assignedByUserId: normalizeText(input.assignedByUserId),
      notes: normalizeText(input.notes),
      countryCodeSnapshot: warehouse.countryCode,
      departmentCodeSnapshot: warehouse.departmentCode,
      departmentNameSnapshot: warehouse.departmentName ?? undefined,
      provinceCodeSnapshot: warehouse.provinceCode,
      provinceNameSnapshot: warehouse.provinceName ?? undefined,
      districtCodeSnapshot: warehouse.districtCode,
      districtNameSnapshot: warehouse.districtName ?? undefined,
      addressLine1Snapshot: warehouse.addressLine1,
      addressLine2Snapshot: warehouse.addressLine2 ?? undefined,
      referenceSnapshot: warehouse.reference ?? undefined
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

  listOrderVendorOptions() {
    const vendors = this.vendorsService.listVendors().data;
    const options: AdminOrderVendorOption[] = vendors
      .map((vendor) => ({
        code: vendor.code,
        name: vendor.name,
        email: vendor.email,
        city: vendor.city,
        collaborationType: vendor.collaborationType,
        status: vendor.status,
        updatedAt: vendor.updatedAt
      }))
      .sort((left, right) => {
        if (left.status === "active" && right.status !== "active") {
          return -1;
        }

        if (left.status !== "active" && right.status === "active") {
          return 1;
        }

        return left.name.localeCompare(right.name, "es");
      });

    return wrapResponse(options, {
      total: options.length,
      active: options.filter((vendor) => vendor.status === "active").length
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
    return wrapResponse(this.toOrderDetail(this.requireOrder(orderNumber)), {
      found: true
    });
  }

  getOrderFulfillment(orderNumber: string) {
    const order = this.requireOrder(orderNumber);
    return wrapResponse(order.fulfillmentAssignment ?? null, {
      found: Boolean(order.fulfillmentAssignment)
    });
  }

  async suggestOrderFulfillment(
    orderNumber: string,
    actor?: AuthSessionSummary["user"]
  ) {
    const order = this.requireOrder(orderNumber);
    const suggestedAt = new Date().toISOString();
    const suggestion = await this.buildFulfillmentSuggestion(order.orderNumber, order.address, order.items, suggestedAt);
    const actorName = normalizeText(actor?.name) ?? normalizeText(actor?.email) ?? "admin";

    order.fulfillmentSuggestion = suggestion;
    order.updatedAt = suggestedAt;
    order.statusHistory.unshift(
      createHistoryEntry(
        order.orderStatus,
        actorName,
        suggestion.status === "suggested"
          ? `Sugerencia de origen recalculada: ${suggestion.warehouseName}.`
          : "Sugerencia de origen recalculada sin candidato claro.",
        suggestedAt
      )
    );

    await this.persistState();

    return {
      status: "ok" as const,
      message:
        suggestion.status === "suggested"
          ? `Sugerencia de origen actualizada para ${orderNumber}.`
          : `No encontramos un origen claro para ${orderNumber}; queda en revisión operativa.`,
      referenceId: suggestion.id,
      suggestion,
      order: this.toOrderDetail(order)
    };
  }

  async assignOrderFulfillment(
    orderNumber: string,
    input: OrderFulfillmentAssignmentInput,
    actor?: AuthSessionSummary["user"]
  ) {
    const order = this.requireOrder(orderNumber);
    const warehouseId = normalizeText(input.warehouseId);
    if (!warehouseId) {
      throw new BadRequestException("El fulfillment requiere un warehouseId.");
    }

    await this.validateWarehouseAssignment(order, warehouseId);
    const actorName = normalizeText(actor?.name) ?? normalizeText(actor?.email) ?? normalizeText(input.assignedByUserId) ?? "admin";
    const assignedAt = normalizeText(input.assignedAt) ?? new Date().toISOString();
    const fulfillmentAssignment = await this.buildFulfillmentAssignment(orderNumber, {
      ...input,
      warehouseId,
      assignedAt,
      assignedByUserId: input.assignedByUserId ?? actor?.id,
      strategy: normalizeFulfillmentStrategy(input.strategy),
      status: normalizeFulfillmentStatus(input.status),
      notes: normalizeText(input.notes)
    });

    order.items = rewriteItemsToWarehouse(order.items, fulfillmentAssignment.warehouseId);
    order.fulfillmentAssignment = fulfillmentAssignment;
    order.updatedAt = assignedAt;
    order.statusHistory.unshift(
      createHistoryEntry(order.orderStatus, actorName, `Origen de fulfillment asignado a ${fulfillmentAssignment.warehouseName}.`, assignedAt)
    );

    await this.synchronizeOrderInventory(order, assignedAt, `Reserva alineada al origen ${fulfillmentAssignment.warehouseName}.`, {
      allowWarehouseReallocation: true
    });
    await this.persistState();

    if (this.isDispatchQueueEligible(order)) {
      void this.queueFulfillmentAssignedNotification(order, actorName);
    }

    return {
      status: "ok" as const,
      message: `Origen logístico actualizado para ${orderNumber}.`,
      referenceId: fulfillmentAssignment.id,
      assignment: fulfillmentAssignment,
      order: this.toOrderDetail(order)
    };
  }

  async listDispatchOrders() {
    const occurredAt = new Date().toISOString();
    let changed = false;

    for (const order of this.sortedOrders().filter((candidate) => this.isDispatchQueueEligible(candidate) && !candidate.fulfillmentAssignment)) {
      const result = await this.applyAlgorithmicFulfillmentPlan(order, occurredAt, "Sistema", {
        syncInventory: true
      });
      changed = changed || result.changed;
    }

    if (changed) {
      await this.persistState();
    }

    const orders = this.sortedOrders()
      .filter((order) => this.isDispatchQueueEligible(order))
      .map((order) => this.toDispatchOrderSummary(order));

    return wrapResponse(orders, {
      total: orders.length,
      ready: orders.length
    });
  }

  getDispatchLabel(orderNumber: string) {
    const order = this.requireOrder(orderNumber);
    this.ensureDispatchLabelEligible(order);

    return wrapResponse(this.toDispatchLabelSummary(order), {
      found: true
    });
  }

  recordDispatchLabelPrint(
    orderNumber: string,
    actor: AuthSessionSummary["user"] | undefined,
    input: AdminDispatchLabelPrintInput = {}
  ) {
    const order = this.requireOrder(orderNumber);
    this.ensureDispatchLabelEligible(order);

    const actorName = normalizeText(actor?.name) ?? normalizeText(actor?.email) ?? "admin";
    const templateVersion = input.templateVersion ?? "dispatch-label-v1";
    const format = input.format === "pdf" ? "pdf" : "html";
    const channel = input.channel === "batch" ? "batch" : "single";

    this.auditService.recordAdminAction({
      actionType: "orders.label.print_requested",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `Se registró una solicitud de impresión de etiqueta para el pedido ${order.orderNumber}.`,
      actorUserId: actor?.id,
      actorName,
      metadata: {
        orderStatus: order.orderStatus,
        templateVersion,
        format,
        channel
      }
    });
    this.observabilityService.recordDomainEvent({
      category: "orders",
      action: "orders.label.print_requested",
      detail: `Se registró una solicitud de impresión de etiqueta para el pedido ${order.orderNumber}.`,
      relatedType: "order",
      relatedId: order.orderNumber
    });

    return {
      status: "ok" as const,
      message: `Solicitud de impresión registrada para ${order.orderNumber}.`,
      referenceId: order.orderNumber
    };
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

    if (isOrderStatusCommerciallyConfirmed(nextStatus) && order.paymentStatus !== PaymentStatus.Paid) {
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

    const fulfillmentPlanResult = dispatchQueueStatuses.has(nextStatus)
      ? await this.applyAlgorithmicFulfillmentPlan(order, occurredAt, actor)
      : { assigned: false };

    await this.synchronizeOrderInventory(order, occurredAt, note, {
      allowWarehouseReallocation: fulfillmentPlanResult.assigned
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

  async assignOrderVendor(orderNumber: string, input: AdminOrderVendorAssignmentInput = {}) {
    const order = this.requireOrder(orderNumber);
    const actor = normalizeText(input.actor) ?? "admin";
    const nextVendorCode = normalizeCode(input.vendorCode);
    const currentVendorCode = normalizeCode(order.vendorCode);

    if (currentVendorCode === nextVendorCode) {
      return {
        status: "ok" as const,
        message: nextVendorCode
          ? `El pedido ${order.orderNumber} ya estaba asociado al vendedor ${nextVendorCode}.`
          : `El pedido ${order.orderNumber} ya no tiene vendedor asociado.`,
        orderNumber: order.orderNumber,
        order: this.toOrderSummary(order)
      };
    }

    const previousVendorCode = order.vendorCode;
    const previousVendorName = order.vendorName;
    const occurredAt = new Date().toISOString();

    if (nextVendorCode) {
      const vendorTrace = this.resolveVendorTrace(nextVendorCode, { strict: true });
      order.vendorId = vendorTrace.vendorId;
      order.vendorCode = vendorTrace.vendorCode;
      order.vendorName = vendorTrace.vendorName;
    } else {
      order.vendorId = undefined;
      order.vendorCode = undefined;
      order.vendorName = undefined;
    }

    order.salesChannel = this.inferSalesChannel(order);
    order.updatedAt = occurredAt;

    this.auditService.recordAdminAction({
      actionType: "orders.vendor.updated",
      targetType: "order",
      targetId: order.orderNumber,
      summary: `Se actualizó el vendedor asociado al pedido ${order.orderNumber}.`,
      actorName: actor,
      metadata: {
        previousVendorCode,
        previousVendorName,
        nextVendorCode: order.vendorCode,
        nextVendorName: order.vendorName
      }
    });
    this.observabilityService.recordDomainEvent({
      category: "orders",
      action: "orders.vendor.updated",
      detail: order.vendorCode
        ? `Pedido ${order.orderNumber} asociado al vendedor ${order.vendorCode}.`
        : `Pedido ${order.orderNumber} quedó sin vendedor asociado.`,
      relatedType: "order",
      relatedId: order.orderNumber
    });

    await this.persistState();

    return {
      status: "ok" as const,
      message: order.vendorCode
        ? `Vendedor ${order.vendorCode} asignado a ${order.orderNumber}.`
        : `Pedido ${order.orderNumber} actualizado sin vendedor asociado.`,
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

    if (order.paymentMethod !== "manual") {
      throw new BadRequestException(
        `El pedido ${order.orderNumber} usa pago online. Usa la conciliación online desde backoffice.`
      );
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
    order.commercialTrace = {
      route: "manual_direct",
      status: "confirmed",
      actor,
      reference,
      note: notes,
      evidenceReference: reference,
      evidenceNotes: notes,
      occurredAt
    };

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
    order.commercialTrace = {
      route: "openpay_backoffice",
      status: "confirmed",
      actor,
      reference,
      note: notes,
      occurredAt
    };

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
      orderStatus: OrderStatus.Confirmed,
      paymentStatus: PaymentStatus.Paid,
      reviewer: reviewerName,
      notes: note,
      occurredAt: now,
      sendEmailNow
    });

    const message =
      decision.emailNotification === "queued"
        ? "La solicitud fue aprobada operativamente, el pedido quedó confirmado y el email al cliente quedó en cola."
        : decision.emailNotification === "skipped"
          ? "La solicitud fue aprobada operativamente, el pedido quedó confirmado y pasó a seguimiento CRM."
          : "La solicitud fue aprobada operativamente, el pedido quedó confirmado y pasó a seguimiento CRM. El email al cliente no pudo registrarse.";

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
      orderStatus: OrderStatus.Paid | OrderStatus.Confirmed | OrderStatus.Cancelled;
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
      order.commercialTrace = {
        route: "manual_request",
        status: "confirmed",
        actor: input.reviewer,
        reference: manualRequest.evidenceReference ?? order.providerReference,
        note: input.notes,
        evidenceReference: manualRequest.evidenceReference,
        evidenceNotes: manualRequest.evidenceNotes,
        evidenceImageUrl: manualRequest.evidenceImageUrl,
        occurredAt: input.occurredAt
      };

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
          ? `El pedido ${order.orderNumber} quedó confirmado después de la revisión manual y el email quedó en cola.`
          : emailNotification === "failed"
            ? `El pedido ${order.orderNumber} quedó confirmado después de la revisión manual, pero el email no pudo registrarse.`
          : `El pedido ${order.orderNumber} quedó confirmado después de la revisión manual y quedó listo para seguimiento CRM.`,
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
      order.commercialTrace = {
        route: "manual_request",
        status: "rejected",
        actor: input.reviewer,
        reference: manualRequest.evidenceReference ?? order.providerReference,
        note: input.notes,
        evidenceReference: manualRequest.evidenceReference,
        evidenceNotes: manualRequest.evidenceNotes,
        evidenceImageUrl: manualRequest.evidenceImageUrl,
        occurredAt: input.occurredAt
      };

      await this.synchronizeOrderInventory(order, input.occurredAt, "Inventario liberado por rechazo manual.");

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
      body: `Hola ${manualRequest.customerName},\n\nTu comprobante fue revisado y aprobado. Tu pedido ${order.orderNumber} quedó confirmado y ya pasó a seguimiento de atención para coordinar la entrega.\n\n¡Gracias por tu compra!`,
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
    return inferOrderCommercialConfirmationAt(order);
  }

  private resolvePendingCommercialRoute(order: Pick<AdminOrderDetail, "paymentMethod" | "manualRequest">): OrderCommercialTraceRoute {
    if (order.manualRequest) {
      return "manual_request";
    }

    return order.paymentMethod === "openpay" ? "openpay_backoffice" : "manual_direct";
  }

  private resolveConfirmedCommercialRoute(order: Pick<AdminOrderDetail, "paymentMethod" | "manualRequest" | "statusHistory">): OrderCommercialTraceRoute {
    if (order.manualRequest) {
      return "manual_request";
    }

    if (order.paymentMethod === "manual") {
      return "manual_direct";
    }

    const paidHistoryEntry = latestHistoryEntry(order.statusHistory, [OrderStatus.Paid]);
    return paidHistoryEntry?.actor?.trim().toLowerCase() === "openpay" ? "openpay_provider" : "openpay_backoffice";
  }

  private resolveCommercialTrace(order: AdminOrderDetail): OrderCommercialTraceSummary {
    if (order.commercialTrace) {
      if (order.commercialTrace.route === "manual_request" && order.manualRequest) {
        return {
          ...order.commercialTrace,
          status: normalizeCommercialTraceStatus(order.manualRequest.status),
          actor: order.manualRequest.reviewer ?? order.commercialTrace.actor,
          reference: order.commercialTrace.reference ?? order.manualRequest.evidenceReference ?? order.providerReference,
          note: order.manualRequest.notes ?? order.commercialTrace.note,
          evidenceReference:
            order.commercialTrace.evidenceReference ??
            order.manualRequest.evidenceReference ??
            order.manualEvidenceReference,
          evidenceNotes:
            order.commercialTrace.evidenceNotes ??
            order.manualRequest.evidenceNotes ??
            order.manualEvidenceNotes,
          evidenceImageUrl:
            order.commercialTrace.evidenceImageUrl ??
            order.manualRequest.evidenceImageUrl ??
            order.evidenceImageUrl,
          occurredAt:
            order.manualRequest.reviewedAt ??
            order.manualRequest.submittedAt ??
            order.commercialTrace.occurredAt ??
            order.updatedAt ??
            order.createdAt
        };
      }

      return {
        ...order.commercialTrace,
        reference: order.commercialTrace.reference ?? order.providerReference,
        evidenceReference:
          order.commercialTrace.evidenceReference ??
          order.manualRequest?.evidenceReference ??
          order.manualEvidenceReference,
        evidenceNotes:
          order.commercialTrace.evidenceNotes ??
          order.manualRequest?.evidenceNotes ??
          order.manualEvidenceNotes,
        evidenceImageUrl:
          order.commercialTrace.evidenceImageUrl ??
          order.manualRequest?.evidenceImageUrl ??
          order.evidenceImageUrl,
        occurredAt:
          order.commercialTrace.occurredAt ??
          order.confirmedAt ??
          order.manualRequest?.reviewedAt ??
          order.manualRequest?.submittedAt ??
          order.payment.updatedAt ??
          order.updatedAt ??
          order.createdAt
      };
    }

    if (order.manualRequest) {
      return {
        route: "manual_request",
        status: normalizeCommercialTraceStatus(order.manualRequest.status),
        actor:
          order.manualRequest.reviewer ??
          (order.manualRequest.status === ManualPaymentRequestStatus.Submitted ||
          order.manualRequest.status === ManualPaymentRequestStatus.UnderReview
            ? "Cliente"
            : undefined),
        reference: order.manualRequest.evidenceReference ?? order.manualEvidenceReference ?? order.providerReference,
        note: order.manualRequest.notes ?? order.manualRequest.evidenceNotes ?? order.manualEvidenceNotes ?? order.notes,
        evidenceReference: order.manualRequest.evidenceReference ?? order.manualEvidenceReference,
        evidenceNotes: order.manualRequest.evidenceNotes ?? order.manualEvidenceNotes,
        evidenceImageUrl: order.manualRequest.evidenceImageUrl ?? order.evidenceImageUrl,
        occurredAt:
          order.manualRequest.reviewedAt ??
          order.manualRequest.submittedAt ??
          order.confirmedAt ??
          order.updatedAt ??
          order.createdAt
      };
    }

    const isConfirmed = order.paymentStatus === PaymentStatus.Paid || isOrderStatusCommerciallyConfirmed(order.orderStatus);

    if (order.paymentMethod === "manual") {
      const commercialEntry = latestHistoryEntry(order.statusHistory, [OrderStatus.Paid, OrderStatus.Confirmed, order.orderStatus]);
      return {
        route: isConfirmed ? "manual_direct" : "manual_direct",
        status: isConfirmed ? "confirmed" : "pending",
        actor: isConfirmed ? commercialEntry?.actor ?? "Operación" : commercialEntry?.actor,
        reference: order.manualEvidenceReference ?? order.providerReference,
        note: order.manualEvidenceNotes ?? order.notes ?? commercialEntry?.note,
        evidenceReference: order.manualEvidenceReference,
        evidenceNotes: order.manualEvidenceNotes,
        occurredAt: order.confirmedAt ?? commercialEntry?.occurredAt ?? order.payment.updatedAt ?? order.updatedAt ?? order.createdAt
      };
    }

    if (isConfirmed) {
      const route = this.resolveConfirmedCommercialRoute(order);
      const paidHistoryEntry = latestHistoryEntry(order.statusHistory, [OrderStatus.Paid]);
      const confirmedHistoryEntry = latestHistoryEntry(order.statusHistory, [OrderStatus.Confirmed]);
      const commercialEntry = route === "openpay_provider" ? paidHistoryEntry ?? confirmedHistoryEntry : confirmedHistoryEntry ?? paidHistoryEntry;

      return {
        route,
        status: "confirmed",
        actor:
          route === "openpay_provider"
            ? paidHistoryEntry?.actor ?? "Openpay"
            : commercialEntry?.actor,
        reference: order.providerReference,
        note: commercialEntry?.note,
        occurredAt: order.confirmedAt ?? commercialEntry?.occurredAt ?? order.payment.updatedAt ?? order.updatedAt ?? order.createdAt
      };
    }

    return {
      route: this.resolvePendingCommercialRoute(order),
      status: "pending",
      reference: order.providerReference,
      note: order.notes,
      occurredAt: order.payment.updatedAt ?? order.updatedAt ?? order.createdAt
    };
  }

  private syncCommercialTrace(order: AdminOrderDetail) {
    order.commercialTrace = this.resolveCommercialTrace(order);
  }

  private hydrateLegacyMetadata() {
    for (const order of this.orders.values()) {
      const vendorTrace = this.resolveVendorTrace(order.vendorCode, { strict: false });
      order.salesChannel = this.inferSalesChannel(order);
      order.vendorId = vendorTrace.vendorId ?? order.vendorId;
      order.vendorCode = vendorTrace.vendorCode ?? order.vendorCode;
      order.vendorName = vendorTrace.vendorName ?? order.vendorName;
      order.confirmedAt = this.inferConfirmedAt(order);
      this.syncCommercialTrace(order);
    }
  }

  private promoteLegacyPaidWebOrders() {
    for (const order of this.orders.values()) {
      if (order.salesChannel !== "web" || order.orderStatus !== OrderStatus.Paid || order.paymentStatus !== PaymentStatus.Paid) {
        continue;
      }

      const occurredAt = order.confirmedAt ?? order.updatedAt ?? order.createdAt;
      order.orderStatus = OrderStatus.Confirmed;
      order.crmStage = resolveOperationalCrmStage(order.orderStatus, order.paymentStatus);
      order.confirmedAt = order.confirmedAt ?? occurredAt;
      order.payment = this.buildPaymentSummary({
        orderNumber: order.orderNumber,
        customerName: fullName(order.customer) || order.customer.email,
        provider: order.payment.provider,
        amount: order.payment.amount,
        currencyCode: order.currencyCode,
        paymentStatus: order.paymentStatus,
        manualStatus: order.manualStatus,
        manualEvidenceReference: order.manualEvidenceReference,
        updatedAt: order.updatedAt,
        orderStatus: order.orderStatus
      });

      if (!order.statusHistory.some((entry) => entry.status === OrderStatus.Confirmed)) {
        order.statusHistory = [
          ...order.statusHistory,
          createHistoryEntry(
            OrderStatus.Confirmed,
            "Sistema",
            "Pedido confirmado automáticamente tras validación comercial del pago.",
            occurredAt
          )
        ];
      }

      this.syncCommercialTrace(order);
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
    order.orderStatus = OrderStatus.Confirmed;
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
    order.statusHistory = [
      ...order.statusHistory,
      createHistoryEntry(OrderStatus.Paid, input.actor, input.notes, input.occurredAt),
      createHistoryEntry(OrderStatus.Confirmed, input.actor, "Pedido confirmado y listo para preparación.", input.occurredAt)
    ];

    const fulfillmentPlanResult = await this.applyAlgorithmicFulfillmentPlan(order, input.occurredAt, input.actor);

    await this.synchronizeOrderInventory(order, input.occurredAt, input.notes, {
      allowWarehouseReallocation: fulfillmentPlanResult.assigned
    });

    try {
      await this.loyaltyService.settleOrderPoints(order.orderNumber, input.actor);
    } catch (error) {
      if (!(error instanceof NotFoundException)) {
        throw error;
      }
    }

    void this.queueDispatchReadyNotification(order, "Pedido confirmado y listo para gestión de envío.");
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

  private async queueManualReviewRequiredNotification(order: AdminOrderDetail) {
    const manualRequest = this.requireManualRequest(order);
    const customerName = fullName(order.customer) || order.customer.email || manualRequest.customerName;

    await this.queueInternalNotification({
      eventName: "payment.manual.sent_to_review",
      audience: "operador_pagos",
      subject: `Pedido ${order.orderNumber} pendiente de validar pago`,
      body: [
        `Cliente: ${customerName}`,
        `Total: ${order.total} ${order.currencyCode}`,
        `Estado del pago: ${order.manualStatus ?? "under_review"}`,
        manualRequest.evidenceReference ? `Referencia declarada: ${manualRequest.evidenceReference}` : "Referencia declarada pendiente.",
        "Acción: revisar comprobante y resolver la validación."
      ].join("\n"),
      detail: `El pedido ${order.orderNumber} quedó en revisión manual y necesita validación operativa del pago.`,
      relatedType: "manual_payment_request",
      relatedId: manualRequest.id
    });
  }

  private async queueDispatchReadyNotification(order: AdminOrderDetail, detail: string) {
    const customerName = fullName(order.customer) || order.customer.email || order.orderNumber;
    const warehouseLine = order.fulfillmentAssignment
      ? `Origen sugerido: ${order.fulfillmentAssignment.warehouseName}`
      : "Origen de salida pendiente de asignación.";

    await this.queueInternalNotification({
      eventName: "order.dispatch.ready",
      audience: "operador_despachos",
      subject: `Pedido ${order.orderNumber} listo para gestión de envío`,
      body: [
        `Cliente: ${customerName}`,
        `Total: ${order.total} ${order.currencyCode}`,
        `Estado: ${statusLabels[order.orderStatus]}`,
        warehouseLine,
        "Acción: validar origen, preparar salida y continuar con despacho."
      ].join("\n"),
      detail,
      relatedType: "order",
      relatedId: order.orderNumber
    });
  }

  private async queueFulfillmentAssignedNotification(order: AdminOrderDetail, actorName: string) {
    if (!order.fulfillmentAssignment) {
      return;
    }

    await this.queueInternalNotification({
      eventName: "order.fulfillment.assigned",
      audience: "operador_despachos",
      subject: `Origen asignado para ${order.orderNumber}`,
      body: [
        `Pedido: ${order.orderNumber}`,
        `Origen: ${order.fulfillmentAssignment.warehouseName}`,
        `Estrategia: ${order.fulfillmentAssignment.strategy}`,
        `Asignado por: ${actorName}`,
        "Acción: continuar preparación y despacho sobre ese punto de salida."
      ].join("\n"),
      detail: `Se asignó el origen ${order.fulfillmentAssignment.warehouseName} al pedido ${order.orderNumber}.`,
      relatedType: "order",
      relatedId: order.orderNumber
    });
  }

  private async queueInternalNotification(input: {
    eventName: string;
    audience: string;
    subject: string;
    body: string;
    detail: string;
    relatedType?: string;
    relatedId?: string;
  }) {
    try {
      await this.notificationsService.recordEvent(
        input.eventName,
        "orders",
        input.subject,
        input.detail,
        input.relatedType,
        input.relatedId
      );

      await this.notificationsService.queueNotification({
        channel: NotificationChannel.Internal,
        audience: input.audience,
        subject: input.subject,
        body: input.body,
        source: "orders",
        relatedType: input.relatedType,
        relatedId: input.relatedId,
        status: NotificationStatus.Pending
      });
    } catch (error) {
      this.observabilityService.recordDomainEvent({
        category: "notification",
        action: `${input.eventName}.enqueue_failed`,
        severity: "warning",
        detail: `No pudimos registrar la alerta interna ${input.eventName}.`,
        relatedType: input.relatedType,
        relatedId: input.relatedId
      });
    }
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

  private getDispatchLabelMissingFields(order: AdminOrderDetail) {
    const missingFields: string[] = [];
    const recipientName = normalizeText(order.address.recipientName);
    const line1 = normalizeText(order.address.line1);
    const city = normalizeText(order.address.city);
    const region = normalizeText(order.address.region);
    const countryCode = normalizeText(order.address.countryCode);
    const phone = normalizeText(order.customer.phone);
    const providerReference = normalizeText(order.providerReference);
    const deliveryMode = order.address.deliveryMode ?? "standard";

    if (!recipientName) {
      missingFields.push("destinatario");
    }

    if (!line1) {
      missingFields.push("dirección");
    }

    if (!city) {
      missingFields.push("ciudad");
    }

    if (!region) {
      missingFields.push("región");
    }

    if (!countryCode) {
      missingFields.push("país");
    }

    if (!phone) {
      missingFields.push("teléfono");
    }

    if (!providerReference) {
      missingFields.push("referencia operativa");
    }

    if (deliveryMode === "province_shalom_pickup" && !normalizeText(order.address.agencyName)) {
      missingFields.push("sucursal de Shalom");
    }

    return missingFields;
  }

  private isDispatchQueueEligible(order: AdminOrderDetail) {
    return dispatchQueueStatuses.has(order.orderStatus) && this.getDispatchLabelMissingFields(order).length === 0;
  }

  private ensureDispatchLabelEligible(order: AdminOrderDetail) {
    if (!dispatchLabelStatuses.has(order.orderStatus)) {
      throw new ConflictException(`El pedido ${order.orderNumber} no está en una etapa elegible para imprimir etiqueta.`);
    }

    const missingFields = this.getDispatchLabelMissingFields(order);
    if (missingFields.length) {
      throw new ConflictException(
        `El pedido ${order.orderNumber} no puede imprimir etiqueta porque faltan: ${missingFields.join(", ")}.`
      );
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
    const departmentCode = normalizeText(input.request.address.departmentCode);
    const provinceCode = normalizeText(input.request.address.provinceCode);
    const districtCode = normalizeText(input.request.address.districtCode);
    const departmentName = normalizeText(input.request.address.departmentName);
    const provinceName = normalizeText(input.request.address.provinceName);
    const districtName = normalizeText(input.request.address.districtName);

    if (!clientRequestId) {
      throw new BadRequestException("El checkout requiere una clave de idempotencia.");
    }

    if (!documentType) {
      throw new BadRequestException("Debes seleccionar un tipo de documento para continuar.");
    }

    if (!isValidDocumentNumber(documentType, documentNumber)) {
      throw new BadRequestException("Debes ingresar un número de documento válido para continuar.");
    }

    if (!departmentCode || !provinceCode || !districtCode || !departmentName || !provinceName || !districtName) {
      throw new BadRequestException("Debes seleccionar departamento, provincia y distrito.");
    }

    if (!/^\d{2}$/.test(departmentCode) || !/^\d{4}$/.test(provinceCode) || !/^\d{6}$/.test(districtCode)) {
      throw new BadRequestException("La selección de ubigeo es inválida.");
    }

    if (deliveryMode === "standard" && !isCheckoutStandardDeliveryProvinceCode(provinceCode)) {
      throw new BadRequestException(
        "El delivery estándar solo está disponible para la provincia de Lima y Callao. Si tu envío es a provincia, elige Shalom."
      );
    }

    if (deliveryMode === "province_shalom_pickup") {
      if (carrier !== "shalom") {
        throw new BadRequestException("Los envíos a provincia solo se atienden por Shalom.");
      }

      if (!agencyName) {
        throw new BadRequestException("Debes indicar la sucursal de Shalom más cercana.");
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
      customerId: order.customerId,
      customerConflictId: order.customerConflictId,
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
      itemCount: order.items.length,
      dispatchLabel: this.getDispatchLabelAvailability(order)
    };
  }

  private toOrderDetail(order: AdminOrderDetail): AdminOrderDetail {
    return {
      ...order,
      fulfillmentSuggestion: order.fulfillmentSuggestion,
      payment: this.toPaymentSummary(order),
      dispatchLabel: this.getDispatchLabelAvailability(order)
    };
  }

  private toPaymentSummary(order: AdminOrderDetail): AdminPaymentSummary {
    return {
      ...order.payment,
      evidenceReference: order.manualEvidenceReference ?? order.payment.evidenceReference,
      manualStatus: order.manualStatus
    };
  }

  private toDispatchOrderSummary(order: AdminOrderDetail): AdminDispatchOrderSummary {
    const deliveryMode = order.address.deliveryMode ?? "standard";
    const carrier = normalizeCarrier(order.address.carrier, deliveryMode);

    return {
      orderNumber: order.orderNumber,
      customerName: fullName(order.customer) || order.customer.email,
      recipientName: normalizeText(order.address.recipientName) ?? normalizeText(fullName(order.customer)) ?? order.orderNumber,
      phone: order.customer.phone,
      city: order.address.city,
      region: order.address.region,
      countryCode: order.address.countryCode,
      deliveryMode,
      carrier,
      agencyName: normalizeText(order.address.agencyName),
      orderStatus: order.orderStatus,
      salesChannel: order.salesChannel,
      providerReference: order.providerReference,
      vendorCode: order.vendorCode,
      vendorName: order.vendorName,
      fulfillmentSuggestion: order.fulfillmentSuggestion,
      fulfillmentAssignment: order.fulfillmentAssignment,
      totalItems: order.items.length,
      totalUnits: totalOrderUnits(order.items),
      confirmedAt: order.confirmedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
  }

  private getDispatchLabelAvailability(order: AdminOrderDetail): AdminDispatchLabelAvailabilitySummary {
    const actionLabel = dispatchLabelActionLabel(order.orderStatus);

    if (!dispatchLabelStatuses.has(order.orderStatus)) {
      return {
        available: false,
        actionLabel,
        blockReason: "La etiqueta requiere pedido en etapa confirmada o posterior."
      };
    }

    const missingFields = this.getDispatchLabelMissingFields(order);
    if (missingFields.length) {
      return {
        available: false,
        actionLabel,
        blockReason: `Completa ${missingFields.join(", ")} antes de imprimir la etiqueta.`
      };
    }

    return {
      available: true,
      actionLabel
    };
  }

  private toDispatchLabelSummary(order: AdminOrderDetail): AdminDispatchLabelSummary {
    const deliveryMode = order.address.deliveryMode ?? "standard";
    const carrier = normalizeCarrier(order.address.carrier, deliveryMode);

    return {
      orderNumber: order.orderNumber,
      templateVersion: "dispatch-label-v1",
      generatedAt: new Date().toISOString(),
      recipient: {
        name: normalizeText(order.address.recipientName) ?? normalizeText(fullName(order.customer)) ?? order.orderNumber,
        phone: order.customer.phone
      },
      destination: {
        line1: order.address.line1,
        line2: normalizeText(order.address.line2),
        city: order.address.city,
        region: order.address.region,
        postalCode: normalizeText(order.address.postalCode),
        countryCode: order.address.countryCode,
        deliveryMode,
        carrier,
        agencyName: normalizeText(order.address.agencyName),
        payOnPickup: order.address.payOnPickup ?? null
      },
      order: {
        reference: order.providerReference,
        salesChannel: order.salesChannel,
        vendorCode: order.vendorCode,
        vendorName: order.vendorName,
        totalItems: order.items.length,
        totalUnits: totalOrderUnits(order.items),
        items: order.items.map((item) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity
        }))
      },
      barcode: {
        type: "code128",
        value: order.orderNumber
      },
      printHint: {
        paperSize: "A6",
        orientation: "portrait"
      }
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
        fulfillmentSuggestion: order.fulfillmentSuggestion ? { ...order.fulfillmentSuggestion } : undefined,
        fulfillmentAssignment: order.fulfillmentAssignment ? { ...order.fulfillmentAssignment } : undefined,
        statusHistory: order.statusHistory.map((entry) => ({ ...entry })),
        payment: { ...order.payment },
        manualRequest: order.manualRequest ? { ...order.manualRequest } : undefined,
        commercialTrace: order.commercialTrace ? { ...order.commercialTrace } : undefined
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
        fulfillmentSuggestion: order.fulfillmentSuggestion ? { ...order.fulfillmentSuggestion } : undefined,
        fulfillmentAssignment: order.fulfillmentAssignment ? { ...order.fulfillmentAssignment } : undefined,
        statusHistory: order.statusHistory.map((entry) => ({ ...entry })),
        payment: { ...order.payment },
        manualRequest: order.manualRequest ? { ...order.manualRequest } : undefined,
        commercialTrace: order.commercialTrace ? { ...order.commercialTrace } : undefined
      })),
      idempotencyIndex: Object.fromEntries(this.idempotencyIndex.entries())
    };
  }
}
