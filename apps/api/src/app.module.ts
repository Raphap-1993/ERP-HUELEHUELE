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
  OrdersModule,
  PaymentsModule,
  SecurityModule,
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
    SecurityModule,
    AuthModule,
    CustomersModule,
    CommerceModule,
    OrdersModule
  ]
})
export class AppModule {}
