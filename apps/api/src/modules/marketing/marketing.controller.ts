import { Controller, Get } from "@nestjs/common";
import { MarketingService } from "./marketing.service";

@Controller("admin/campaigns")
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  list() {
    return this.marketingService.listCampaigns();
  }
}
