import { BadRequestException, Injectable } from "@nestjs/common";
import {
  type AdminOrderDetail,
  type CheckoutActionSummary,
  type CheckoutQuoteItemSummary,
  type CheckoutQuoteInput,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  type CheckoutShippingInput,
  ManualPaymentRequestStatus,
  OrderStatus,
  PaymentStatus
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";
import { CommissionsService } from "../commissions/commissions.service";
import { CmsService } from "../cms/cms.service";
import { CouponsService } from "../coupons/coupons.service";
import { OrdersService } from "../orders/orders.service";
import { ProductsService } from "../products/products.service";

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
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
    private readonly couponsService: CouponsService
  ) {}

  async quote(body: CheckoutQuoteInput) {
    return wrapResponse<CheckoutQuoteSummary>(await this.buildQuote(body), {
      calculatedAt: new Date().toISOString()
    });
  }

  async createOpenpayCheckout(body: CheckoutRequestInput) {
    const quote = await this.buildQuote(body);
    const orderNumber = this.ordersService.reserveOrderNumber();
    const providerReference = `OP-${orderNumber}`;
    const nextStep = "Redirige al checkout del proveedor para autorizar el cobro.";
    const order = await this.ordersService.createCheckoutOrder({
      orderNumber,
      quote,
      request: body,
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
    const quote = await this.buildQuote(body);
    const orderNumber = this.ordersService.reserveOrderNumber();
    const providerReference = `MP-${orderNumber}`;
    const nextStep = "Solicita al cliente subir el comprobante y espera validación operativa.";
    const order = await this.ordersService.createCheckoutOrder({
      orderNumber,
      quote,
      request: body,
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
