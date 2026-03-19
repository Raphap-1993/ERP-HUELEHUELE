import { Controller, Get } from "@nestjs/common";
import { loyaltyOverview } from "@huelegood/shared";
import { LoyaltyService } from "./loyalty.service";

@Controller("store/me/loyalty")
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  summary() {
    return this.loyaltyService.getSummary();
  }
}

@Controller("admin/loyalty")
export class AdminLoyaltyController {
  @Get("accounts")
  accounts() {
    return { data: loyaltyOverview };
  }
}

