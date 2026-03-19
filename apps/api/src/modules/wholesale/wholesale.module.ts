import { Module } from "@nestjs/common";
import { AdminWholesaleLeadsController, AdminWholesaleQuotesController, WholesaleLeadsController } from "./wholesale.controller";
import { WholesaleService } from "./wholesale.service";

@Module({
  controllers: [WholesaleLeadsController, AdminWholesaleLeadsController, AdminWholesaleQuotesController],
  providers: [WholesaleService],
  exports: [WholesaleService]
})
export class WholesaleModule {}

