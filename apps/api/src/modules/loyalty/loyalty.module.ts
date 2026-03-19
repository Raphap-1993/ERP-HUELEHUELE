import { Module } from "@nestjs/common";
import {
  AdminLoyaltyController,
  LoyaltyController,
  LoyaltyMovementsController,
  LoyaltyRedemptionsController,
  LoyaltyRulesController
} from "./loyalty.controller";
import { LoyaltyService } from "./loyalty.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [LoyaltyController, AdminLoyaltyController, LoyaltyMovementsController, LoyaltyRedemptionsController, LoyaltyRulesController],
  providers: [LoyaltyService],
  exports: [LoyaltyService]
})
export class LoyaltyModule {}
