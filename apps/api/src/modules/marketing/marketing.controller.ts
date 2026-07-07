import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminAccessRoles, type MarketingCampaignInput } from "@huelegood/shared";
import { RequireRoles } from "../auth/auth-rbac";
import { MarketingService } from "./marketing.service";

@RequireRoles(...adminAccessRoles.marketing)
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

@RequireRoles(...adminAccessRoles.marketing)
@Controller("admin/campaigns/segments")
export class CampaignSegmentsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listSegments() {
    return this.marketingService.listSegments();
  }
}

@RequireRoles(...adminAccessRoles.marketing)
@Controller("admin/campaigns/templates")
export class CampaignTemplatesController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listTemplates() {
    return this.marketingService.listTemplates();
  }
}

@RequireRoles(...adminAccessRoles.marketing)
@Controller("admin/campaigns/events")
export class CampaignEventsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listEvents() {
    return this.marketingService.listEvents();
  }
}
