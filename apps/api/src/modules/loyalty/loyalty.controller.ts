import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import {
  type LoyaltyPointsInput,
  type LoyaltyRedemptionInput,
  type LoyaltyRedemptionStatusInput
} from "@huelegood/shared";
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
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get("accounts")
  accounts() {
    return this.loyaltyService.listAccounts();
  }
}

@Controller("admin/loyalty/movements")
export class LoyaltyMovementsController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  listMovements() {
    return this.loyaltyService.listMovements();
  }

  @Post()
  assignPoints(@Body() body: LoyaltyPointsInput) {
    return this.loyaltyService.assignPoints(body);
  }
}

@Controller("admin/loyalty/redemptions")
export class LoyaltyRedemptionsController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  listRedemptions() {
    return this.loyaltyService.listRedemptions();
  }

  @Post()
  create(@Body() body: LoyaltyRedemptionInput) {
    return this.loyaltyService.createRedemption(body);
  }

  @Post(":id/status")
  updateStatus(@Param("id") id: string, @Body() body: LoyaltyRedemptionStatusInput) {
    return this.loyaltyService.updateRedemptionStatus(id, body);
  }
}

@Controller("admin/loyalty/rules")
export class LoyaltyRulesController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get()
  listRules() {
    return this.loyaltyService.listRules();
  }
}
