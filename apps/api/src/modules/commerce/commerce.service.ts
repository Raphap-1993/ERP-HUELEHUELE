import { BadRequestException, Injectable } from "@nestjs/common";
import {
  type AdminOrderDetail,
  type CheckoutActionSummary,
  type CheckoutDocumentLookupInput,
  type CheckoutDocumentLookupSummary,
  type CheckoutDocumentType,
  type CheckoutQuoteItemSummary,
  type CheckoutQuoteInput,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type CheckoutShippingInput,
  type PeruDepartmentSummary,
  type PeruDistrictSummary,
  type PeruProvinceSummary,
  ManualPaymentRequestStatus,
  OrderStatus,
  PaymentStatus
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { CommissionsService } from "../commissions/commissions.service";
import { CmsService } from "../cms/cms.service";
import { CouponsService } from "../coupons/coupons.service";
import { CustomersService } from "../customers/customers.service";
import { OrdersService } from "../orders/orders.service";
import { ProductsService } from "../products/products.service";
import { ApiPeruService } from "./apiperu.service";
import { PeruUbigeoService } from "./peru-ubigeo.service";

const validCheckoutDocumentTypes = new Set<CheckoutDocumentType>(["dni", "ce", "ruc", "passport", "other_sunat"]);

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function normalizeText(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : undefined;
}

function normalizeDocumentType(value?: CheckoutDocumentType) {
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

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function resolveShippingInput(body: CheckoutQuoteInput | CheckoutRequestInput): CheckoutShippingInput | undefined {
  if ("shipping" in body && body.shipping) {
    return body.shipping;
  }

  if ("address" in body && body.address) {
    return {
      deliveryMode: body.address.deliveryMode,
      carrier: body.address.carrier,
      agencyName: body.address.agencyName,
      payOnPickup: body.address.payOnPickup
    };
  }

  return undefined;
}

@Injectable()
export class CommerceService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly commissionsService: CommissionsService,
    private readonly productsService: ProductsService,
    private readonly cmsService: CmsService,
    private readonly couponsService: CouponsService,
    private readonly customersService: CustomersService,
    private readonly apiPeruService: ApiPeruService,
    private readonly peruUbigeoService: PeruUbigeoService
  ) {}

  async quote(body: CheckoutQuoteInput) {
    return wrapResponse<CheckoutQuoteSummary>(await this.buildQuote(body), {
      calculatedAt: new Date().toISOString()
    });
  }

  async lookupDocument(body: CheckoutDocumentLookupInput) {
    const documentType = normalizeDocumentType(body.documentType);
    const normalizedDocumentNumber = normalizeDocumentNumber(body.documentNumber, documentType);

    if (!documentType || !isValidDocumentNumber(documentType, normalizedDocumentNumber)) {
      throw new BadRequestException("Debes ingresar un documento válido para consultar.");
    }

    const ensuredDocumentType: CheckoutDocumentType = documentType;
    const documentNumber = normalizedDocumentNumber!;
    const customer = await this.customersService.findCheckoutPrefillByDocument(ensuredDocumentType, documentNumber);

    if (customer) {
      return wrapResponse<CheckoutDocumentLookupSummary>({
        documentType: ensuredDocumentType,
        documentNumber,
        officialIdentity: undefined,
        customer
      });
    }

    const officialIdentity =
      ensuredDocumentType === "dni" ? await this.apiPeruService.lookupDni(documentNumber) : undefined;

    return wrapResponse<CheckoutDocumentLookupSummary>({
      documentType: ensuredDocumentType,
      documentNumber,
      officialIdentity,
      customer
    });
  }

  listPeruDepartments() {
    return wrapResponse<PeruDepartmentSummary[]>(this.peruUbigeoService.listDepartments());
  }

  listPeruProvinces(departmentCode: string) {
    return wrapResponse<PeruProvinceSummary[]>(this.peruUbigeoService.listProvinces(departmentCode));
  }

  listPeruDistricts(provinceCode: string) {
    return wrapResponse<PeruDistrictSummary[]>(this.peruUbigeoService.listDistricts(provinceCode));
  }

  async createOpenpayCheckout(body: CheckoutRequestInput) {
    const normalizedRequest = this.normalizeCheckoutRequest(body);
    const quote = await this.buildQuote(normalizedRequest);
    const orderNumber = this.ordersService.reserveOrderNumber();
    const providerReference = `OP-${orderNumber}`;
    const nextStep = "Redirige al checkout del proveedor para autorizar el cobro.";
    const order = await this.ordersService.createCheckoutOrder({
      orderNumber,
      quote,
      request: normalizedRequest,
      orderStatus: OrderStatus.PendingPayment,
      paymentStatus: PaymentStatus.Initiated,
      providerReference,
      checkoutUrl: `https://sandbox.openpay.local/checkout/${orderNumber}`
    });

    this.commissionsService.syncFromOrders("openpay");

    return {
      ...actionResponse("queued", "Checkout preparado para Openpay.", orderNumber),
      order: this.buildActionPayload(order, nextStep),
      quote
    };
  }

  async createManualCheckout(body: CheckoutRequestInput) {
    const normalizedRequest = this.normalizeCheckoutRequest(body);
    const quote = await this.buildQuote(normalizedRequest);
    const orderNumber = this.ordersService.reserveOrderNumber();
    const providerReference = `MP-${orderNumber}`;
    const nextStep = "Solicita al cliente subir el comprobante y espera validación operativa.";
    const order = await this.ordersService.createCheckoutOrder({
      orderNumber,
      quote,
      request: normalizedRequest,
      orderStatus: OrderStatus.PaymentUnderReview,
      paymentStatus: PaymentStatus.Pending,
      providerReference,
      manualStatus: ManualPaymentRequestStatus.UnderReview
    });

    this.commissionsService.syncFromOrders("manual_checkout");

    return {
      ...actionResponse("pending_review", "Pago manual registrado para revisión interna.", orderNumber),
      order: this.buildActionPayload(order, nextStep, true),
      quote
    };
  }

  private async buildQuote(body: CheckoutQuoteInput | CheckoutRequestInput): Promise<CheckoutQuoteSummary> {
    if (!body.items?.length) {
      throw new BadRequestException("Debes incluir al menos un producto en el checkout.");
    }

    const { items, currencyCode } = await this.productsService.resolveCheckoutItems(body.items);

    const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const vendorCode = normalizeCode(body.vendorCode);
    const couponCode = normalizeCode(body.couponCode);
    const discountRate = this.getDiscountRate(items, vendorCode, couponCode);
    const discount = roundCurrency(Math.min(subtotal * discountRate, subtotal * 0.2));
    const settings = this.cmsService.getSiteSettings().data;
    const freeShippingThreshold = Number.isFinite(settings.freeShippingThreshold) ? settings.freeShippingThreshold : 500;
    const shippingFlatRate = Number.isFinite(settings.shippingFlatRate) ? settings.shippingFlatRate : 49;
    const shippingInput = resolveShippingInput(body);
    const shipping =
      shippingInput?.deliveryMode === "province_shalom_pickup"
        ? 0
        : subtotal - discount >= freeShippingThreshold
          ? 0
          : roundCurrency(shippingFlatRate);
    const grandTotal = roundCurrency(subtotal - discount + shipping);
    const paymentMethod = body.paymentMethod ?? "openpay";

    return {
      items,
      subtotal,
      discount,
      shipping,
      grandTotal,
      currencyCode,
      vendorCode,
      couponCode,
      paymentMethod,
      estimatedPoints: Math.max(1, Math.floor(grandTotal / 50))
    };
  }

  private getDiscountRate(
    items: CheckoutQuoteItemSummary[],
    vendorCode?: string,
    couponCode?: string
  ) {
    let rate = 0;

    if (vendorCode) {
      rate += 0.05;
    }

    if (couponCode) {
      rate += this.couponsService.resolveDiscount(items, couponCode);
    }

    return Math.min(rate, 0.2);
  }

  private normalizeCheckoutRequest(body: CheckoutRequestInput): CheckoutRequestInput {
    const documentType = normalizeDocumentType(body.customer.documentType);
    const documentNumber = normalizeDocumentNumber(body.customer.documentNumber, documentType);
    const ubigeo = this.peruUbigeoService.resolveSelection({
      departmentCode: body.address.departmentCode,
      provinceCode: body.address.provinceCode,
      districtCode: body.address.districtCode
    });

    return {
      ...body,
      customer: {
        ...body.customer,
        firstName: body.customer.firstName.trim(),
        lastName: body.customer.lastName.trim(),
        email: body.customer.email.trim(),
        phone: body.customer.phone.trim(),
        documentType,
        documentNumber
      },
      address: {
        ...body.address,
        recipientName: body.address.recipientName.trim(),
        line1: body.address.line1.trim(),
        line2: normalizeText(body.address.line2),
        city: ubigeo.districtName,
        region: ubigeo.provinceName,
        postalCode: body.address.postalCode?.trim() ?? "",
        countryCode: body.address.countryCode?.trim().toUpperCase() || "PE",
        deliveryMode: body.address.deliveryMode === "province_shalom_pickup" ? "province_shalom_pickup" : "standard",
        carrier: body.address.deliveryMode === "province_shalom_pickup" ? "shalom" : body.address.carrier,
        agencyName: body.address.deliveryMode === "province_shalom_pickup" ? normalizeText(body.address.agencyName) : undefined,
        payOnPickup: body.address.deliveryMode === "province_shalom_pickup" ? true : body.address.payOnPickup,
        departmentCode: ubigeo.departmentCode,
        departmentName: ubigeo.departmentName,
        provinceCode: ubigeo.provinceCode,
        provinceName: ubigeo.provinceName,
        districtCode: ubigeo.districtCode,
        districtName: ubigeo.districtName
      }
    };
  }

  private buildActionPayload(order: AdminOrderDetail, nextStep: string, evidenceRequired = false): CheckoutActionSummary {
    return {
      orderNumber: order.orderNumber,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      salesChannel: order.salesChannel,
      manualStatus: order.manualStatus,
      manualRequestId: order.manualRequestId,
      manualEvidenceReference: order.manualEvidenceReference,
      manualEvidenceNotes: order.manualEvidenceNotes,
      providerReference: order.providerReference,
      nextStep,
      checkoutUrl: order.checkoutUrl,
      evidenceRequired
    };
  }
}
