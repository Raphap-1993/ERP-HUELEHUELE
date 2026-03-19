import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { type CommissionPayoutInput, type CommissionPayoutSettleInput } from "@huelegood/shared";
import { CommissionsService } from "./commissions.service";

@Controller("admin/commissions")
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get()
  list() {
    return this.commissionsService.listCommissions();
  }

  @Get("rules")
  listRules() {
    return this.commissionsService.listRules();
  }

  @Get("payouts")
  listPayouts() {
    return this.commissionsService.listPayouts();
  }

  @Post("payouts")
  createPayout(@Body() body: CommissionPayoutInput) {
    return this.commissionsService.createPayout(body);
  }

  @Post("payouts/:id/settle")
  settlePayout(@Param("id") id: string, @Body() body: CommissionPayoutSettleInput) {
    return this.commissionsService.settlePayout(id, body);
  }
}
