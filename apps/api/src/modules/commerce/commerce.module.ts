import { Module } from "@nestjs/common";
import { CommissionsModule } from "../commissions/commissions.module";
import { OrdersModule } from "../orders/orders.module";
import { ProductsModule } from "../products/products.module";
import { CommerceController } from "./commerce.controller";
import { CommerceService } from "./commerce.service";

@Module({
  imports: [OrdersModule, CommissionsModule, ProductsModule],
  controllers: [CommerceController],
  providers: [CommerceService],
  exports: [CommerceService]
})
export class CommerceModule {}
