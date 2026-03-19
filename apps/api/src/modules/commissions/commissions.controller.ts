import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { adminAccessRoles, type CommissionPayoutInput, type CommissionPayoutSettleInput, type CommissionRuleInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { CommissionsService } from "./commissions.service";

@RequireRoles(...adminAccessRoles.commissions)
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

  @Post("rules")
  createRule(@Body() body: CommissionRuleInput) {
    return this.commissionsService.createRule(body);
  }

  @Patch("rules/:id")
  updateRule(@Param("id") id: string, @Body() body: CommissionRuleInput) {
    return this.commissionsService.updateRule(id, body);
  }

  @Get("payouts")
  listPayouts() {
    return this.commissionsService.listPayouts();
  }

  @Post("payouts")
  createPayout(@Body() body: CommissionPayoutInput) {
    return this.commissionsService.queueCreatePayout(body);
  }

  @Post("payouts/:id/settle")
  settlePayout(@Param("id") id: string, @Body() body: CommissionPayoutSettleInput) {
    return this.commissionsService.queueSettlePayout(id, body);
  }
}
