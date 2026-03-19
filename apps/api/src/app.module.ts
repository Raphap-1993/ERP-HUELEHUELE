import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { PrismaModule } from "./prisma/prisma.module";
import { RolesGuard } from "./modules/auth/roles.guard";
import { PersistenceModule } from "./persistence/persistence.module";
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
    PersistenceModule,
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
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
