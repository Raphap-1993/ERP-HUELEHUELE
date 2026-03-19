import { Module } from "@nestjs/common";
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
  imports: [MarketingModule],
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
