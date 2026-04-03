import { Module, forwardRef } from "@nestjs/common";
import { AuditModule } from "../audit/audit.module";
import { CommissionsModule } from "../commissions/commissions.module";
import { AdminVendorApplicationsController, AdminVendorsController, VendorApplicationsController } from "./vendor-applications.controller";
import { VendorsService } from "./vendors.service";

@Module({
  imports: [AuditModule, forwardRef(() => CommissionsModule)],
  controllers: [VendorApplicationsController, AdminVendorApplicationsController, AdminVendorsController],
  providers: [VendorsService],
  exports: [VendorsService]
})
export class VendorsModule {}
