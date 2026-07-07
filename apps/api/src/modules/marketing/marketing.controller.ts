import { Body, Controller, Get, Post } from "@nestjs/common";
import { adminModulePermissions, type MarketingCampaignInput } from "@huelegood/shared";
import { RequirePermissions } from "../auth/auth-rbac";
import { MarketingService } from "./marketing.service";

@RequirePermissions(...adminModulePermissions.marketing.read)
@Controller("admin/campaigns")
export class MarketingController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listCampaigns() {
    return this.marketingService.listCampaigns();
  }

  @Post()
  @RequirePermissions(...adminModulePermissions.marketing.manage!)
  createCampaign(@Body() body: MarketingCampaignInput) {
    return this.marketingService.createCampaign(body);
  }
}

@RequirePermissions(...adminModulePermissions.marketing.read)
@Controller("admin/campaigns/segments")
export class CampaignSegmentsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listSegments() {
    return this.marketingService.listSegments();
  }
}

@RequirePermissions(...adminModulePermissions.marketing.read)
@Controller("admin/campaigns/templates")
export class CampaignTemplatesController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listTemplates() {
    return this.marketingService.listTemplates();
  }
}

@RequirePermissions(...adminModulePermissions.marketing.read)
@Controller("admin/campaigns/events")
export class CampaignEventsController {
  constructor(private readonly marketingService: MarketingService) {}

  @Get()
  listEvents() {
    return this.marketingService.listEvents();
  }
}
