import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { adminModulePermissions, type CommissionPayoutInput, type CommissionPayoutSettleInput, type CommissionRuleInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { CommissionsService } from "./commissions.service";

@RequirePermissions(...adminModulePermissions.commissions.read)
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
  @RequirePermissions(...adminModulePermissions.commissions.manage!)
  createRule(@Body() body: CommissionRuleInput) {
    return this.commissionsService.createRule(body);
  }

  @Patch("rules/:id")
  @RequirePermissions(...adminModulePermissions.commissions.manage!)
  updateRule(@Param("id") id: string, @Body() body: CommissionRuleInput) {
    return this.commissionsService.updateRule(id, body);
  }

  @Get("payouts")
  listPayouts() {
    return this.commissionsService.listPayouts();
  }

  @Post("payouts")
  @RequirePermissions(...adminModulePermissions.commissions.payout!)
  createPayout(@Body() body: CommissionPayoutInput) {
    return this.commissionsService.queueCreatePayout(body);
  }

  @Post("payouts/:id/settle")
  @RequirePermissions(...adminModulePermissions.commissions.payout!)
  settlePayout(@Param("id") id: string, @Body() body: CommissionPayoutSettleInput) {
    return this.commissionsService.queueSettlePayout(id, body);
  }
}
