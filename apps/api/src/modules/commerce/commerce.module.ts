import { Module, forwardRef } from "@nestjs/common";
import { CommissionsModule } from "../commissions/commissions.module";
import { CmsModule } from "../cms/cms.module";
import { CouponsModule } from "../coupons/coupons.module";
import { CustomersModule } from "../customers/customers.module";
import { MediaModule } from "../media/media.module";
import { OrdersModule } from "../orders/orders.module";
import { ProductsModule } from "../products/products.module";
import { ApiPeruService } from "./apiperu.service";
import { CommerceController } from "./commerce.controller";
import { CommerceService } from "./commerce.service";
import { PeruUbigeoService } from "./peru-ubigeo.service";

@Module({
  imports: [OrdersModule, CommissionsModule, CouponsModule, ProductsModule, CmsModule, MediaModule, forwardRef(() => CustomersModule)],
  controllers: [CommerceController],
  providers: [CommerceService, ApiPeruService, PeruUbigeoService],
  exports: [CommerceService]
})
export class CommerceModule {}
