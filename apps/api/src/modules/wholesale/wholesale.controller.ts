import { Body, Controller, Get, Post } from "@nestjs/common";
import { wholesaleLeads, wholesaleQuotes } from "@huelegood/shared";
import { WholesaleService, type WholesaleLeadInput } from "./wholesale.service";

@Controller("store/wholesale-leads")
export class WholesaleLeadsController {
  constructor(private readonly wholesaleService: WholesaleService) {}

  @Post()
  submit(@Body() body: WholesaleLeadInput) {
    return this.wholesaleService.submitLead(body);
  }
}

@Controller("admin/wholesale-leads")
export class AdminWholesaleLeadsController {
  @Get()
  list() {
    return { data: wholesaleLeads };
  }
}

@Controller("admin/wholesale-quotes")
export class AdminWholesaleQuotesController {
  @Get()
  listQuotes() {
    return { data: wholesaleQuotes };
  }
}
