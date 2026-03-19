import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import {
  AuditModule,
  AuthModule,
  CatalogModule,
  CmsModule,
  CommissionsModule,
  CommerceModule,
  CoreModule,
  CustomersModule,
  HealthModule,
  LoyaltyModule,
  MarketingModule,
  NotificationsModule,
  PaymentsModule,
  OrdersModule,
  VendorsModule,
  WholesaleModule
} from "./modules";

@Module({
  imports: [
    PrismaModule,
    HealthModule,
    CatalogModule,
    CmsModule,
    CoreModule,
    VendorsModule,
    WholesaleModule,
    PaymentsModule,
    CommissionsModule,
    LoyaltyModule,
    MarketingModule,
    NotificationsModule,
    AuditModule,
    AuthModule,
    CustomersModule,
    CommerceModule,
    OrdersModule
  ]
})
export class AppModule {}
