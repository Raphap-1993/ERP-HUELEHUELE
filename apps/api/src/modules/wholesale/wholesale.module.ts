import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { MarketingModule } from "../marketing/marketing.module";
import {
  AdminWholesaleLeadsController,
  AdminWholesaleQuotesController,
  AdminWholesaleTiersController,
  WholesaleLeadsController,
  WholesaleTiersController
} from "./wholesale.controller";
import { WholesaleService } from "./wholesale.service";

@Module({
  imports: [AuditModule, MarketingModule],
  controllers: [
    WholesaleLeadsController,
    WholesaleTiersController,
    AdminWholesaleLeadsController,
    AdminWholesaleQuotesController,
    AdminWholesaleTiersController
  ],
  providers: [WholesaleService],
  exports: [WholesaleService]
})
export class WholesaleModule {}
