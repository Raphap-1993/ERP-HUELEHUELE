import { Body, Controller, Post } from "@nestjs/common";
import { CommerceService } from "./commerce.service";
import type { CheckoutQuoteInput, CheckoutRequestInput } from "@huelegood/shared";

@Controller("store/checkout")
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Post("quote")
  quote(@Body() body: CheckoutQuoteInput) {
    return this.commerceService.quote(body);
  }

  @Post("openpay")
  openpay(@Body() body: CheckoutRequestInput) {
    return this.commerceService.createOpenpayCheckout(body);
  }

  @Post("manual")
  manual(@Body() body: CheckoutRequestInput) {
    return this.commerceService.createManualCheckout(body);
  }
}
