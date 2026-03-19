import { Module } from "@nestjs/common";
import {
  CampaignEventsController,
  CampaignSegmentsController,
  CampaignTemplatesController,
  MarketingController
} from "./marketing.controller";
import { MarketingService } from "./marketing.service";

@Module({
  controllers: [MarketingController, CampaignSegmentsController, CampaignTemplatesController, CampaignEventsController],
  providers: [MarketingService],
  exports: [MarketingService]
})
export class MarketingModule {}
