import { Module, forwardRef } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { OrdersModule } from "../orders/orders.module";
import { VendorsModule } from "../vendors/vendors.module";
import { CommissionsController } from "./commissions.controller";
import { CommissionsService } from "./commissions.service";

@Module({
  imports: [AuditModule, OrdersModule, forwardRef(() => VendorsModule)],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService]
})
export class CommissionsModule {}
