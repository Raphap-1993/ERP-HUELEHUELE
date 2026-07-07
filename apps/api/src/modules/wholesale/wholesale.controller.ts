import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { adminModulePermissions, type WholesaleLeadInput, type WholesaleLeadStatusInput, type WholesaleQuoteInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { WholesaleService } from "./wholesale.service";

@Controller("store/wholesale-leads")
export class WholesaleLeadsController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Post()
  submit(@Body() body: WholesaleLeadInput) {
    return this.wholesaleService.submitLead(body);
  }
}

@Controller("store/wholesale-tiers")
export class WholesaleTiersController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  listTiers() {
    return this.wholesaleService.listTiers();
  }
}

@RequirePermissions(...adminModulePermissions.wholesale.read)
@Controller("admin/wholesale-leads")
export class AdminWholesaleLeadsController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  list() {
    return this.wholesaleService.listLeads();
  }

  @Post(":id/status")
  @RequirePermissions(...adminModulePermissions.wholesale.manage!)
  updateStatus(@Param("id") id: string, @Body() body: WholesaleLeadStatusInput) {
    return this.wholesaleService.updateLeadStatus(id, body);
  }
}

@RequirePermissions(...adminModulePermissions.wholesale.read)
@Controller("admin/wholesale-quotes")
export class AdminWholesaleQuotesController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  listQuotes() {
    return this.wholesaleService.listQuotes();
  }

  @Post()
  @RequirePermissions(...adminModulePermissions.wholesale.manage!)
  create(@Body() body: WholesaleQuoteInput) {
    return this.wholesaleService.createQuote(body);
  }
}

@RequirePermissions(...adminModulePermissions.wholesale.read)
@Controller("admin/wholesale-tiers")
export class AdminWholesaleTiersController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  listTiers() {
    return this.wholesaleService.listTiers();
  }
}
