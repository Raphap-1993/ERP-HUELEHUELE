import { Body, Controller, Get, Post } from "@nestjs/common";
import { type MarketingCampaignInput } from "@huelegood/shared";
import { MarketingService } from "./marketing.service";

@Controller("admin/campaigns")
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listCampaigns() {
    return this.marketingService.listCampaigns();
  }

  @Post()
  createCampaign(@Body() body: MarketingCampaignInput) {
    return this.marketingService.createCampaign(body);
  }
}

@Controller("admin/campaigns/segments")
export class CampaignSegmentsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listSegments() {
    return this.marketingService.listSegments();
  }
}

@Controller("admin/campaigns/templates")
export class CampaignTemplatesController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listTemplates() {
    return this.marketingService.listTemplates();
  }
}

@Controller("admin/campaigns/events")
export class CampaignEventsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listEvents() {
    return this.marketingService.listEvents();
  }
}
