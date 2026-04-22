import { Module, forwardRef } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { PeruUbigeoService } from "../commerce/peru-ubigeo.service";
import { InventoryModule } from "../inventory/inventory.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { VendorsModule } from "../vendors/vendors.module";
import { CustomersModule } from "../customers/customers.module";
import { DispatchController } from "./dispatch.controller";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";

@Module({
  imports: [
    AuditModule,
    InventoryModule,
    LoyaltyModule,
    NotificationsModule,
    forwardRef(() => VendorsModule),
    forwardRef(() => CustomersModule)
  ],
  controllers: [OrdersController, DispatchController],
  providers: [OrdersService, PeruUbigeoService],
  exports: [OrdersService]
})
export class OrdersModule {}
