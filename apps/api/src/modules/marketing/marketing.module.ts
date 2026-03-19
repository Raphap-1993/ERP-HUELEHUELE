import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import {
  CampaignEventsController,
  CampaignSegmentsController,
  CampaignTemplatesController,
  MarketingController
} from "./marketing.controller";
import { MarketingService } from "./marketing.service";

@Module({
  imports: [AuditModule],
  controllers: [MarketingController, CampaignSegmentsController, CampaignTemplatesController, CampaignEventsController],
  providers: [MarketingService],
  exports: [MarketingService]
})
export class MarketingModule {}
