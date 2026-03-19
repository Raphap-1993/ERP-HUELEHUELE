import { Module } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { AdminVendorApplicationsController, VendorApplicationsController } from "./vendor-applications.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [AuditModule],
  controllers: [VendorApplicationsController, AdminVendorApplicationsController],
  providers: [VendorsService],
  exports: [VendorsService]
})
export class VendorsModule {}
