import { Module } from "@nestjs/common";
import { OrdersModule } from "../orders/orders.module";
import { CommerceController } from "./commerce.controller";
import { CommerceService } from "./commerce.service";

@Module({
  imports: [OrdersModule],
  controllers: [CommerceController],
  providers: [CommerceService],
  exports: [CommerceService]
})
export class CommerceModule {}
