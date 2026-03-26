import { Module } from "@nestjs/common";
import { CommissionsModule } from "../commissions/commissions.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { MarketingModule } from "../marketing/marketing.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { OrdersModule } from "../orders/orders.module";
import { PaymentsModule } from "../payments/payments.module";
import { VendorsModule } from "../vendors/vendors.module";
import { WholesaleModule } from "../wholesale/wholesale.module";
import { DashboardController } from "./dashboard.controller";
import { ReportsController } from "./reports.controller";
import { CoreService } from "./core.service";
import { SellerPanelController } from "./seller-panel.controller";

@Module({
  imports: [OrdersModule, PaymentsModule, VendorsModule, CommissionsModule, WholesaleModule, MarketingModule, NotificationsModule, LoyaltyModule],
  controllers: [DashboardController, ReportsController, SellerPanelController],
  providers: [CoreService],
  exports: [CoreService]
})
export class CoreModule {}
