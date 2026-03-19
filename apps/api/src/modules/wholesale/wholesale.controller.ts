import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { type WholesaleLeadInput, type WholesaleLeadStatusInput, type WholesaleQuoteInput } from "@huelegood/shared";
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

@Controller("admin/wholesale-leads")
export class AdminWholesaleLeadsController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  list() {
    return this.wholesaleService.listLeads();
  }

  @Post(":id/status")
  updateStatus(@Param("id") id: string, @Body() body: WholesaleLeadStatusInput) {
    return this.wholesaleService.updateLeadStatus(id, body);
  }
}

@Controller("admin/wholesale-quotes")
export class AdminWholesaleQuotesController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  listQuotes() {
    return this.wholesaleService.listQuotes();
  }

  @Post()
  create(@Body() body: WholesaleQuoteInput) {
    return this.wholesaleService.createQuote(body);
  }
}

@Controller("admin/wholesale-tiers")
export class AdminWholesaleTiersController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Get()
  listTiers() {
    return this.wholesaleService.listTiers();
  }
}
