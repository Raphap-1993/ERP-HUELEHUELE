import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import {
  featuredProducts,
  type CheckoutActionSummary,
  type CheckoutQuoteInput,
  type CheckoutQuoteItemSummary,
  type CheckoutQuoteSummary,
  type CheckoutRequestInput,
  ManualPaymentRequestStatus,
  OrderStatus,
  PaymentStatus
} from "@huelegood/shared";
import { actionResponse, wrapResponse } from "../../common/response";

interface CatalogProductLookup {
  slug: string;
  name: string;
  sku: string;
  price: number;
  categorySlug: string;
}

const productMap = new Map<string, CatalogProductLookup>(
  featuredProducts.map((product) => [
    product.slug,
    {
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      price: product.price,
      categorySlug: product.categorySlug
    }
  ])
);

let checkoutSequence = 10042;

function normalizeCode(value?: string) {
  return value?.trim().toUpperCase() || undefined;
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

@Injectable()
export class CommerceService {
  quote(body: CheckoutQuoteInput) {
    return wrapResponse<CheckoutQuoteSummary>(this.buildQuote(body), {
      calculatedAt: new Date().toISOString()
    });
  }

  createOpenpayCheckout(body: CheckoutRequestInput) {
    const quote = this.buildQuote(body);
    const orderNumber = this.nextOrderNumber();
    const providerReference = `OP-${orderNumber}`;

    return {
      ...actionResponse("queued", "Checkout preparado para Openpay.", orderNumber),
      order: this.buildActionPayload({
        orderNumber,
        orderStatus: OrderStatus.PendingPayment,
        paymentStatus: PaymentStatus.Initiated,
        providerReference,
        nextStep: "Redirige al checkout del proveedor para autorizar el cobro.",
        checkoutUrl: `https://sandbox.openpay.local/checkout/${orderNumber}`
      }),
      quote
    };
  }

  createManualCheckout(body: CheckoutRequestInput) {
    const quote = this.buildQuote(body);
    const orderNumber = this.nextOrderNumber();
    const providerReference = `MP-${orderNumber}`;

    return {
      ...actionResponse("pending_review", "Pago manual registrado para revisión interna.", orderNumber),
      order: this.buildActionPayload({
        orderNumber,
        orderStatus: OrderStatus.PaymentUnderReview,
        paymentStatus: PaymentStatus.Pending,
        manualStatus: ManualPaymentRequestStatus.Submitted,
        providerReference,
        nextStep: "Solicita al cliente subir el comprobante y espera validación operativa.",
        evidenceRequired: true
      }),
      quote
    };
  }

  private buildQuote(body: CheckoutQuoteInput | CheckoutRequestInput): CheckoutQuoteSummary {
    if (!body.items?.length) {
      throw new BadRequestException("Debes incluir al menos un producto en el checkout.");
    }

    const items = body.items.map((item) => {
      const product = productMap.get(item.slug);
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${item.slug}`);
      }

      const quantity = Number(item.quantity);
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new BadRequestException(`Cantidad inválida para ${item.slug}.`);
      }

      const lineTotal = roundCurrency(product.price * quantity);

      return {
        slug: product.slug,
        name: product.name,
        sku: product.sku,
        quantity,
        unitPrice: product.price,
        lineTotal
      } satisfies CheckoutQuoteItemSummary;
    });

    const subtotal = roundCurrency(items.reduce((sum, item) => sum + item.lineTotal, 0));
    const vendorCode = normalizeCode(body.vendorCode);
    const couponCode = normalizeCode(body.couponCode);
    const discountRate = this.getDiscountRate(items, vendorCode, couponCode);
    const discount = roundCurrency(Math.min(subtotal * discountRate, subtotal * 0.2));
    const shipping = subtotal - discount >= 500 ? 0 : 49;
    const grandTotal = roundCurrency(subtotal - discount + shipping);
    const paymentMethod = body.paymentMethod ?? "openpay";

    return {
      items,
      subtotal,
      discount,
      shipping,
      grandTotal,
      currencyCode: "MXN",
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

    if (couponCode === "RESET10") {
      rate += 0.1;
    }

    if (couponCode === "DUPLO15" && items.some((item) => item.slug === "combo-duo-perfecto")) {
      rate += 0.15;
    }

    if (couponCode === "WELCOME5") {
      rate += 0.05;
    }

    return Math.min(rate, 0.2);
  }

  private buildActionPayload(input: {
    orderNumber: string;
    orderStatus: OrderStatus;
    paymentStatus: PaymentStatus;
    providerReference: string;
    nextStep: string;
    checkoutUrl?: string;
    manualStatus?: ManualPaymentRequestStatus;
    evidenceRequired?: boolean;
  }): CheckoutActionSummary {
    return {
      orderNumber: input.orderNumber,
      orderStatus: input.orderStatus,
      paymentStatus: input.paymentStatus,
      providerReference: input.providerReference,
      nextStep: input.nextStep,
      checkoutUrl: input.checkoutUrl,
      manualStatus: input.manualStatus,
      evidenceRequired: input.evidenceRequired
    };
  }

  private nextOrderNumber() {
    checkoutSequence += 1;
    return `HG-${checkoutSequence}`;
  }
}
