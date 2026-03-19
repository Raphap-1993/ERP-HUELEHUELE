import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { VendorsModule } from "../vendors/vendors.module";
import { CommissionsController } from "./commissions.controller";
import { CommissionsService } from "./commissions.service";

@Module({
  imports: [OrdersModule, VendorsModule],
  controllers: [CommissionsController],
  providers: [CommissionsService],
  exports: [CommissionsService]
})
export class CommissionsModule {}
